const PLAYLIST_URL = new URL('../assets/race3d-music/playlist.json', import.meta.url);

/** Call start() directly from a trusted click/key handler. Loading never starts audio. */
export function createRaceMusic({ sound = true, container } = {}) {
  if (!container?.appendChild) throw new TypeError('Music needs a container element');
  const doc = container.ownerDocument;
  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0.16;
  audio.muted = !sound;
  let enabled = !!sound, destroyed = false, tracks = [], index = 0, wanted = false;
  let status = 'Loading track list…', playToken = 0;
  const listeners = [];
  const abort = new AbortController();
  const panel = doc.createElement('details');
  panel.className = 'race-music';
  panel.style.cssText = 'position:absolute;left:12px;bottom:42px;z-index:12;max-width:min(260px,calc(100vw - 24px));color:#d9f7ff;background:#07131ee8;border:1px solid #456579;border-radius:8px;font:12px/1.35 system-ui;pointer-events:auto;box-shadow:0 3px 12px #0008';
  const summary = doc.createElement('summary');
  summary.textContent = '♫ Music · 12 tracks';
  summary.style.cssText = 'cursor:pointer;padding:7px 10px;user-select:none';
  panel.appendChild(summary);
  const body = doc.createElement('div');
  body.style.cssText = 'padding:0 10px 9px;display:grid;gap:7px';
  panel.appendChild(body);
  const select = doc.createElement('select');
  select.setAttribute('aria-label', 'Music track');
  select.style.cssText = 'width:100%;min-width:0;background:#102939;color:#fff;border:1px solid #52758b;border-radius:4px;padding:5px;font:inherit';
  select.disabled = true;
  body.appendChild(select);
  const controls = doc.createElement('div');
  controls.style.cssText = 'display:flex;gap:7px;align-items:center';
  const button = (text, label) => {
    const b = doc.createElement('button');
    b.type = 'button'; b.textContent = text; b.setAttribute('aria-label', label);
    b.style.cssText = 'background:#17384b;color:#fff;border:1px solid #52758b;border-radius:4px;padding:5px 9px;font:inherit;cursor:pointer';
    controls.appendChild(b); return b;
  };
  const play = button('Play', 'Play music');
  const next = button('Next ›', 'Next music track');
  body.appendChild(controls);
  const volumeLabel = doc.createElement('label');
  volumeLabel.textContent = 'Music volume ';
  const volume = doc.createElement('input');
  volume.type = 'range'; volume.min = '0'; volume.max = '1'; volume.step = '0.01'; volume.value = '0.16';
  volume.setAttribute('aria-label', 'Music volume');
  volume.style.cssText = 'width:130px;vertical-align:middle';
  volumeLabel.appendChild(volume); body.appendChild(volumeLabel);
  const message = doc.createElement('span');
  message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
  message.style.cssText = 'color:#a8c3d4;font-size:11px';
  body.appendChild(message);
  container.appendChild(panel);
  function on(target, event, callback) {
    target.addEventListener(event, callback);
    listeners.push(() => target.removeEventListener(event, callback));
  }
  function render() {
    if (destroyed) return;
    play.textContent = wanted && !audio.paused ? 'Pause' : 'Play';
    play.setAttribute('aria-label', play.textContent + ' music');
    play.disabled = !enabled || !tracks.length;
    next.disabled = !tracks.length;
    select.value = String(index);
    message.textContent = enabled ? status : 'Sound off · music paused';
    summary.textContent = `♫ Music · ${wanted && !audio.paused ? tracks[index]?.title || 'Playing' : '12 tracks'}`;
  }
  function stop(text = 'Paused') {
    wanted = false; playToken++; audio.pause(); status = text; render();
  }
  function choose(i) {
    stop(); index = (i + tracks.length) % tracks.length;
    if (tracks.length) {
      audio.src = new URL(tracks[index].file, PLAYLIST_URL).href;
      status = tracks[index].title;
    }
    render();
  }
  function start() {
    if (destroyed || !enabled || doc.hidden) return Promise.resolve(false);
    if (!tracks.length) {
      status = 'Track list loading · tap Play when ready'; render();
      return Promise.resolve(false);
    }
    if (!audio.src) choose(index);
    wanted = true; const token = ++playToken;
    // play() is deliberately called before any await, preserving the user gesture.
    let attempt;
    try { attempt = audio.play(); } catch (error) { attempt = Promise.reject(error); }
    return Promise.resolve(attempt).then(() => {
      if (destroyed || token !== playToken || !enabled || doc.hidden) {
        // A newer explicit play owns this same element; do not pause it.
        if (destroyed || !wanted || !enabled || doc.hidden) audio.pause();
        return false;
      }
      status = tracks[index].title; render(); return true;
    }, () => {
      if (destroyed || token !== playToken) return false;
      wanted = false; status = 'Playback blocked · tap Play to try again';
      panel.open = true; render(); return false;
    });
  }
  function reset() {
    if (destroyed) return;
    stop('Ready · tap Play');
    try { audio.currentTime = 0; } catch {}
  }
  function setSound(value) {
    if (destroyed) return;
    enabled = !!value; audio.muted = !enabled;
    if (!enabled) stop(); else { status = 'Ready · tap Play'; render(); }
  }
  on(play, 'click', () => { if (wanted && !audio.paused) stop(); else start(); });
  on(next, 'click', () => { if (tracks.length) { choose(index + 1); start(); } });
  on(select, 'change', () => { if (tracks.length) { choose(Number(select.value)); start(); } });
  on(volume, 'input', () => { audio.volume = Math.max(0, Math.min(1, Number(volume.value) || 0)); });
  on(audio, 'ended', () => {
    if (!destroyed && enabled && wanted && !doc.hidden && tracks.length) {
      choose(index + 1); start();
    }
  });
  on(audio, 'error', () => { if (!destroyed) { stop('Track unavailable · select another or retry'); panel.open = true; } });
  on(audio, 'pause', render);
  on(audio, 'playing', render);
  on(doc, 'visibilitychange', () => { if (doc.hidden) stop('Paused while tab is hidden'); });
  render();
  fetch(PLAYLIST_URL, { signal: abort.signal }).then(response => {
    if (!response.ok) throw new Error('Playlist unavailable');
    return response.json();
  }).then(list => {
    if (destroyed) return;
    if (!Array.isArray(list) || !list.length || list.some(t => !t.title || !/^[\w-]+\.mp3$/.test(t.file))) throw new Error('Invalid playlist');
    tracks = list;
    tracks.forEach((track, i) => {
      const option = doc.createElement('option'); option.value = String(i);
      option.textContent = `${String(i + 1).padStart(2, '0')} · ${track.title}`;
      select.appendChild(option);
    });
    select.disabled = false; status = 'Ready · tap Play'; render();
  }).catch(error => {
    if (!destroyed && error.name !== 'AbortError') { status = 'Track list unavailable · reload to retry'; panel.open = true; render(); }
  });
  return {
    start,
    pause: () => { if (!destroyed) stop(); },
    reset,
    setSound,
    snapshot: () => ({ enabled, playing: !destroyed && wanted && !audio.paused, volume: audio.volume, index, track: tracks[index]?.title || null, count: tracks.length, status, destroyed }),
    destroy() {
      if (destroyed) return;
      stop(); destroyed = true; abort.abort(); listeners.splice(0).forEach(remove => remove());
      audio.removeAttribute('src'); audio.load(); panel.remove(); tracks = [];
    }
  };
}
