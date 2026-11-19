/* Bump the version whenever a packaged file changes. */
const VERSION = '5';
const scope = new URL(self.registration.scope);
const cachePrefix = 'princess-diary|' + encodeURIComponent(scope.href) + '|';
const cacheName = cachePrefix + VERSION;
const coreFiles = [
  'index.html', 'style.css', 'app.js', 'chart.js', 'effects.js', 'icons.js',
  'pages.js', 'pages.css', 'dialog.js', 'dialog.css', 'ui-sounds.js', 'praise.js',
  'manifest.webmanifest', 'assets/diary.js', 'assets/hero.jpg'
];
const extras = [
  'assets/cover-cn.woff2', 'assets/cover-script.woff2', 'assets/weekly.jpg',
  'assets/tea.png', 'assets/cake.png', 'assets/dessert.png',
  'assets/gem.png', 'assets/crystal.png', 'assets/trophy.png', 'assets/crown.png',
  'assets/clap.png', 'assets/heart.png', 'assets/sparkles.png',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png',
  'assets/first.mp3', 'assets/three.mp3', 'assets/seven.mp3',
  'assets/return.mp3', 'assets/daily.mp3',
  'assets/ui-hover.mp3', 'assets/ui-check.mp3', 'assets/ui-uncheck.mp3',
  'assets/ui-navigate.mp3', 'assets/ui-open.mp3', 'assets/ui-close.mp3', 'assets/ui-tap.mp3'
];
const absolute = file => new URL(file, scope).href;
const urls = new Set([...coreFiles, ...extras].map(absolute));
const indexURL = new URL('index.html', scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    const fresh = file => new Request(absolute(file), {cache: 'reload'});
    await cache.addAll(coreFiles.map(fresh));
    await Promise.allSettled(extras.map(file => cache.add(fresh(file))));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

/* iOS media elements can request small ranges, including a two-byte probe. */
async function audioRange(response, header) {
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const fields = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  let start;
  let end;
  if (fields && fields[1]) {
    start = Number(fields[1]);
    end = fields[2] ? Math.min(Number(fields[2]), size - 1) : size - 1;
  } else if (fields && fields[2]) {
    start = Math.max(size - Number(fields[2]), 0);
    end = size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start > end || start >= size) {
    return new Response(null, {status: 416, headers: {'Content-Range': 'bytes */' + size}});
  }
  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size
    }
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;
  url.search = '';
  const isHome = request.mode === 'navigate' &&
    (url.pathname === scope.pathname || url.href === indexURL);
  const key = isHome ? indexURL : url.href;
  if (!urls.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const saved = await cache.match(key);
    if (!saved) return fetch(request);
    const range = request.headers.get('Range');
    if (range && key.endsWith('.mp3')) return audioRange(saved, range);
    return saved;
  })());
});
