/* Company logo wall tiles. Catalog images are prepared once, never per frame. */
(function (scope) {
  'use strict';

  function createMazeLogos(options) {
    options = options || {};
    var artwork = options.artwork || {};
    var onReady = typeof options.onReady === 'function' ? options.onReady : function () {};
    var manifestPath = artwork.mazeLogos || 'assets/maze-logos/manifest.json';
    var pageBase = (typeof document !== 'undefined' && document.baseURI) ||
      (scope.location && scope.location.href) || 'http://localhost/';
    var manifestURL = new URL(manifestPath, pageBase).href;
    var entries = [];
    var entryCount = 0;
    var loadedEntries = 0;
    var packs = [];
    var packCache = new Map();
    var packQueue = [];
    var activePacks = 0;
    var atlases = [];
    var cache = new Map();
    var failed = new Set();
    var pinned = new Set();
    var queue = [];
    var active = 0;
    var clock = 0;
    var destroyed = false;
    var loaded = false;
    var error = '';
    var roundSeed = '1';
    var cellCount = 4096;
    var offset = 0;
    var stride = 1;
    var shift = 0;
    var notifyTimer = null;
    var manifestTimer = null;
    var fetchAbort = typeof AbortController === 'function' ? new AbortController() : null;
    var concurrency = 6;
    var cacheLimit = 12;

    function hash(value) {
      var h = 2166136261;
      var text = String(value);
      for (var i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      h ^= h >>> 16;
      return h >>> 0;
    }

    function gcd(a, b) {
      while (b) { var t = a % b; a = b; b = t; }
      return a;
    }

    function notify() {
      if (destroyed || notifyTimer !== null) return;
      notifyTimer = setTimeout(function () {
        notifyTimer = null;
        if (!destroyed) onReady(getState());
      }, 40);
    }

    function imageURL(value) {
      if (typeof value !== 'string' || !value) return '';
      // A catalog can use files beside its manifest or explicit page-relative assets.
      return new URL(value, /^(?:\.?\/?assets\/)/.test(value) ? pageBase : manifestURL).href;
    }

    function release(record) {
      if (!record || !record.image) return;
      clearTimeout(record.timer);
      record.image.onload = null;
      record.image.onerror = null;
      record.image.src = '';
      record.image = null;
    }

    function prune() {
      if (cache.size <= cacheLimit) return;
      var candidates = [];
      cache.forEach(function (record, key) {
        if (!pinned.has(key) && record.status !== 'loading' && record.status !== 'queued') {
          candidates.push([key, record]);
        }
      });
      candidates.sort(function (a, b) { return a[1].used - b[1].used; });
      for (var i = 0; i < candidates.length && cache.size > cacheLimit; i++) {
        release(candidates[i][1]);
        cache.delete(candidates[i][0]);
      }
    }

    function pump() {
      if (destroyed || typeof Image !== 'function') return;
      while (active < concurrency && queue.length) {
        var record = queue.shift();
        if (record.status !== 'queued') continue;
        if (!pinned.has(record.key)) {
          cache.delete(record.key);
          continue;
        }
        record.status = 'loading';
        active++;
        var image = new Image();
        record.image = image;
        image.decoding = 'async';
        (function (current, picture) {
          var settled = false;
          function complete(ok) {
            if (settled) return;
            settled = true;
            clearTimeout(current.timer);
            picture.onload = null;
            picture.onerror = null;
            active--;
            if (destroyed) { release(current); return; }
            current.status = ok && (picture.naturalWidth || picture.width) > 0 ? 'ready' : 'failed';
            if (current.status === 'failed') { failed.add(current.key); release(current); }
            current.used = ++clock;
            prune();
            notify();
            pump();
          }
          picture.onload = function () { complete(true); };
          picture.onerror = function () { complete(false); };
          current.timer = setTimeout(function () { complete(false); }, 12000);
          picture.src = current.url;
        })(record, image);
      }
    }

    function request(atlasIndex) {
      var atlas = atlases[atlasIndex];
      if (!atlas || !atlas.url) return null;
      var key = atlasIndex;
      var record = cache.get(key);
      if (record) { record.used = ++clock; return record; }
      if (failed.has(key)) return null;
      record = { key: key, url: atlas.url, status: 'queued', used: ++clock, image: null };
      cache.set(key, record);
      queue.push(record);
      return record;
    }

    function validEntry(entry) {
      if (!entry || !atlases[entry.atlas] || !Number.isInteger(entry.index) || entry.index < 0) return false;
      var atlas = atlases[entry.atlas];
      return !!String(entry.id || entry.name || '') && entry.index < atlas.cols * atlas.rows;
    }

    function pumpPacks() {
      if (destroyed || typeof fetch !== 'function') return;
      while (activePacks < 3 && packQueue.length) {
        var pack = packQueue.shift();
        packCache.set(pack.start, 'loading');
        activePacks++;
        (function (current) {
          fetch(current.url, fetchAbort ? {signal: fetchAbort.signal} : {}).then(function (response) {
            if (!response.ok) throw new Error('Logo names are unavailable');
            return response.json();
          }).then(function (data) {
            if (destroyed) return;
            var list = Array.isArray(data) ? data : data.entries;
            if (!Array.isArray(list)) throw new Error('Logo names are unavailable');
            for (var i = 0; i < Math.min(list.length, current.count); i++) {
              var target = current.start + i;
              if (target < entryCount && validEntry(list[i])) {
                if (!entries[target]) loadedEntries++;
                entries[target] = list[i];
              }
            }
            packCache.set(current.start, 'ready');
          }).catch(function () {
            if (!destroyed) packCache.set(current.start, 'failed');
          }).finally(function () {
            if (destroyed) return;
            activePacks--;
            prepareRound();
            notify();
            pumpPacks();
          });
        })(pack);
      }
    }

    function requestPackFor(index) {
      for (var i = 0; i < packs.length; i++) {
        var pack = packs[i];
        if (index >= pack.start && index < pack.start + pack.count) {
          if (!packCache.has(pack.start)) {
            packCache.set(pack.start, 'queued');
            packQueue.push(pack);
          }
          return;
        }
      }
    }

    function entryAt(index) {
      if (!entryCount) return null;
      var cell = Math.max(0, Math.floor(Number(index) || 0));
      var within = (Math.imul(cell % cellCount, stride) >>> 0) % cellCount;
      return entries[(offset + (within + shift) % cellCount) % entryCount];
    }

    function prepareRound() {
      if (!entryCount || destroyed) return;
      var h = hash(roundSeed);
      offset = h % entryCount;
      shift = hash(roundSeed + ':cells') % cellCount;
      stride = 1 + hash(roundSeed + ':shuffle') % cellCount;
      while (gcd(stride, cellCount) !== 1) stride = stride % cellCount + 1;
      pinned.clear();
      // A contiguous catalog window uses a handful of atlases, even with 10,000+ companies.
      for (var i = 0, n = Math.min(cellCount, entryCount); i < n; i++) {
        var position = (offset + i) % entryCount;
        var entry = entries[position];
        if (entry) pinned.add(entry.atlas);
        else requestPackFor(position);
      }
      cacheLimit = Math.max(12, Math.min(48, pinned.size + 3));
      queue = queue.filter(function (record) {
        if (pinned.has(record.key)) return true;
        cache.delete(record.key);
        return false;
      });
      pinned.forEach(request);
      prune();
      pump();
      pumpPacks();
    }

    function acceptManifest(manifest) {
      if (destroyed) return;
      if (!manifest || (!Array.isArray(manifest.entries) && !Array.isArray(manifest.entryPacks)) || !Array.isArray(manifest.atlases)) {
        throw new Error('Logo catalog is unavailable');
      }
      atlases = manifest.atlases.map(function (atlas) {
        return {
          url: imageURL(atlas.url),
          cols: Math.max(1, Math.floor(Number(atlas.cols) || 1)),
          rows: Math.max(1, Math.floor(Number(atlas.rows) || 1)),
          tileSize: Math.max(1, Math.floor(Number(atlas.tileSize) || 64))
        };
      });
      if (Array.isArray(manifest.entries)) {
        var ids = new Set();
        entries = manifest.entries.filter(function (entry) {
          if (!validEntry(entry)) return false;
          var id = String(entry.id || entry.name || '');
          if (ids.has(id)) return false;
          ids.add(id);
          return true;
        });
        entryCount = loadedEntries = entries.length;
      } else {
        entryCount = Math.max(0, Math.min(200000, Math.floor(Number(manifest.count) || 0)));
        entries = new Array(entryCount);
        packs = manifest.entryPacks.map(function (pack) {
          return {url: imageURL(pack.url),start:Math.max(0, Math.floor(Number(pack.start) || 0)),count:Math.max(0, Math.floor(Number(pack.count) || 0))};
        }).filter(function (pack) {return pack.count && pack.start < entryCount;});
      }
      loaded = true;
      prepareRound();
      notify();
    }

    function setRound(seed, count) {
      var nextSeed = String(seed == null ? 1 : seed);
      var nextCount = Math.max(1, Math.min(65536, Math.floor(Number(count) || cellCount)));
      if (nextSeed === roundSeed && nextCount === cellCount) return;
      roundSeed = nextSeed;
      cellCount = nextCount;
      prepareRound();
    }

    function drawTile(ctx, tile) {
      if (destroyed || !ctx || !tile) return false;
      var x = Number(tile.x), y = Number(tile.y), size = Number(tile.size);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0) return false;
      var inset = Math.max(.6, size * .045);
      var left = x + inset, top = y + inset, inner = Math.max(.1, size - inset * 2);
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if ('filter' in ctx) ctx.filter = 'none';
      ctx.fillStyle = '#f7f8fa';
      ctx.fillRect(left, top, inner, inner);
      var entry = entryAt(tile.index);
      var record = entry && cache.get(entry.atlas);
      var painted = false;
      if (entry && record && record.status === 'ready' && record.image) {
        var atlas = atlases[entry.atlas];
        var sx = entry.index % atlas.cols * atlas.tileSize;
        var sy = Math.floor(entry.index / atlas.cols) * atlas.tileSize;
        ctx.imageSmoothingEnabled = true;
        try {
          ctx.drawImage(record.image, sx, sy, atlas.tileSize, atlas.tileSize, left, top, inner, inner);
          record.used = ++clock;
          painted = true;
        } catch (_) { /* Keep the neutral card while a damaged image is unavailable. */ }
      }
      if (!painted) {
        // Quiet neutral inset; never invent or substitute a company logo.
        ctx.fillStyle = '#e0e4e9';
        var dot = Math.max(.6, size * .06);
        ctx.fillRect(x + size * .5 - dot * .5, y + size * .5 - dot * .5, dot, dot);
      }
      ctx.strokeStyle = 'rgba(20,30,45,.17)';
      ctx.lineWidth = Math.max(.4, size * .018);
      ctx.strokeRect(left, top, inner, inner);
      ctx.restore();
      return true;
    }

    function getState() {
      var ready = 0, pending = 0;
      cache.forEach(function (record) {
        if (record.status === 'ready') ready++;
        else if (record.status === 'queued' || record.status === 'loading') pending++;
      });
      return {
        ready: loaded, count: entryCount, loadedEntries: loadedEntries, atlasCount: atlases.length,
        cachedAtlases: cache.size, loadedAtlases: ready, pendingAtlases: pending,
        activeRequests: active, failedAtlases: failed.size, selectedAtlases: pinned.size,
        pendingEntryPacks: packQueue.length + activePacks,
        cellCount: cellCount, round: roundSeed, error: error, destroyed: destroyed
      };
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (fetchAbort) fetchAbort.abort();
      clearTimeout(manifestTimer);
      clearTimeout(notifyTimer);
      cache.forEach(release);
      cache.clear();
      failed.clear();
      pinned.clear();
      queue.length = 0;
      packQueue.length = 0;
      packCache.clear();
      packs = [];
      entries = [];
      entryCount = loadedEntries = 0;
      atlases = [];
      active = activePacks = 0;
    }

    Promise.resolve().then(function () {
      if (destroyed) return null;
      if (artwork.mazeLogoManifest) return artwork.mazeLogoManifest;
      if (typeof fetch !== 'function') throw new Error('Logo catalog is unavailable');
      manifestTimer = setTimeout(function () { if (fetchAbort) fetchAbort.abort(); }, 12000);
      return fetch(manifestURL, fetchAbort ? { signal: fetchAbort.signal } : {}).then(function (response) {
        if (!response.ok) throw new Error('Logo catalog is unavailable');
        return response.json();
      });
    }).then(function (manifest) {
      clearTimeout(manifestTimer);
      if (!destroyed && manifest) acceptManifest(manifest);
    }).catch(function (reason) {
      clearTimeout(manifestTimer);
      if (destroyed) return;
      error = reason && reason.message || 'Logo catalog is unavailable';
      notify();
    });

    return { drawTile: drawTile, setRound: setRound, getState: getState, destroy: destroy };
  }

  scope.createMazeLogos = createMazeLogos;
})(typeof window !== 'undefined' ? window : globalThis);
