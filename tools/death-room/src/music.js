/** File-based room soundtrack. Attribution is read from the manifest, never invented. */
const ROOMS = ['crushing', 'boiler', 'flood', 'gas', 'rats', 'collapse', 'electric', 'freeze', 'spikes', 'lasers'];
const clamp = (number, min = 0, max = 1) => Math.min(max, Math.max(min, number));
const finite = (number, fallback = 0) => Number.isFinite(number) ? number : fallback;
const now = () => globalThis.performance?.now?.() ?? Date.now();

function readTracks(manifest, base) {
  const entries = Array.isArray(manifest) ? manifest
    : Array.isArray(manifest?.tracks) ? manifest.tracks
    : Object.entries(manifest?.tracks || manifest?.scenarios || manifest || {})
      .filter(([key, value]) => ROOMS.includes(key) && value && typeof value === 'object')
      .map(([key, value]) => ({ scenarioId: key, ...value }));
  const tracks = new Map();
  for (const entry of entries) {
    const scenarioId = entry.scenarioId || entry.scenario || entry.id;
    const file = entry.file || entry.path || entry.audioUrl || entry.audio;
    if (!ROOMS.includes(scenarioId) || typeof file !== 'string' || !file.trim()) continue;
    let url;
    try {
      url = new URL(file, base);
      if (!['http:', 'https:', 'file:', 'blob:'].includes(url.protocol)) continue;
    } catch { continue; }
    if (tracks.has(scenarioId)) continue;
    tracks.set(scenarioId, Object.freeze({
      id: String(entry.id || scenarioId), scenarioId,
      title: String(entry.title || scenarioId), file,
      url: url.href,
      // Missing provider metadata stays unspecified; silence is never relabeled Suno.
      provider: String(entry.provider || ''),
      sourceUrl: String(entry.sourceUrl || ''),
      duration: finite(Number(entry.duration)),
      style: String(entry.style || ''), lyrics: String(entry.lyrics || ''),
      generatedAt: String(entry.generatedAt || ''),
    }));
  }
  return tracks;
}

export function createMusic({ assetBase = '/assets/music/' } = {}) {
  let base;
  try {
    base = new URL(assetBase.endsWith('/') ? assetBase : `${assetBase}/`, globalThis.location?.href || 'http://localhost/');
  } catch { base = new URL('http://localhost/assets/music/'); }
  let disposed = false;
  let unlocked = false;
  let muted = true;
  let volume = .42;
  let scenarioId = 'crushing';
  let phase = 'preview';
  let paused = false;
  let progress = 0;
  let phaseGain = .48;
  let tracks = new Map();
  let manifestState = 'loading';
  let manifestMessage = '';
  let manifestError = '';
  let manifestController = null;
  let manifestTimer = null;
  let manifestVersion = 0;
  let transition = null;
  let desiredTrack = null;
  let desiredKey = '';
  let desiredSlot = null;
  let ready;
  let context=null, analyser=null, samples=null, envelope=0, baseline=0, pulse=0, lastOnset=-99, rhythmTime=0;
  let rhythm={active:false,time:0,energy:0,beatPulse:0,bpm:0,phase:0};
  function connectAudio(slot){if(!context||slot.source)return;try{slot.source=context.createMediaElementSource(slot.audio);slot.source.connect(analyser);}catch{ /* Keep ordinary media playback if analysis is unavailable. */ }}
  function unlockAnalysis(){try{if(!context){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;context=new AC();analyser=context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.5;analyser.connect(context.destination);samples=new Float32Array(analyser.fftSize);for(const slot of slots)connectAudio(slot);}context.resume().catch(()=>{});}catch{}}
  function updateRhythm(dt){const audible=slots.filter(s=>s.track&&!s.audio.paused&&s.audio.readyState>=2&&s.weight>.001).sort((a,b)=>b.weight-a.weight);const current=audible[0];const active=!!current&&!disposed&&!muted&&!paused&&volume>.001&&context?.state==='running';const time=finite(current?.audio.currentTime);const bpm=Number(current?.track?.style.match(/(\d+(?:\.\d+)?)\s*BPM/i)?.[1])||0;let rms=0;if(active&&analyser){analyser.getFloatTimeDomainData(samples);for(const v of samples)rms+=v*v;rms=Math.sqrt(rms/samples.length);}const target=clamp(rms*8);envelope+=(target-envelope)*(1-Math.exp(-dt*14));baseline+=(target-baseline)*(1-Math.exp(-dt*2));rhythmTime+=dt;pulse*=Math.exp(-dt*9);if(active&&target>.025&&target>baseline*1.28+.012&&rhythmTime-lastOnset>.18){pulse=1;lastOnset=rhythmTime;}if(!active){envelope=0;pulse=0;}rhythm={active,time,energy:envelope,beatPulse:pulse,bpm,phase:bpm?(time*bpm/60)%1:0};}
  const slots = [];
  const errors = new Map();
  const keyFor = track => track ? `${track.scenarioId}|${track.url}` : '';

  function applyLevels() {
    for (const slot of slots) {
      slot.audio.muted = muted;
      slot.audio.volume = clamp(volume * phaseGain * slot.weight);
    }
  }
  function stopSlot(slot, clear = false) {
    slot.audio.pause();
    slot.wantsPlay = false;
    if (!clear) return;
    slot.generation++;
    slot.playPromise = null;
    slot.blocked = false;
    slot.failed = '';
    slot.loading = false;
    slot.interruptRetries = 0;
    slot.weight = 0;
    slot.track = null;
    slot.key = '';
    slot.loadedAt = 0;
    for (const [type, listener] of slot.listeners) slot.audio.removeEventListener(type, listener);
    slot.listeners = [];
    slot.audio.removeAttribute('src');
    // Explicit load after clearing src releases the decoder/network resource.
    try { slot.audio.load(); } catch { /* The element may already be detached. */ }
  }
  function makeSlot() {
    if (typeof globalThis.Audio !== 'function') return null;
    const audio = new Audio();
    audio.preload = 'auto';
    audio.loop = true;
    audio.muted = true;
    audio.volume = 0;
    audio.playsInline = true;
    const slot = { audio, track: null, key: '', weight: 0, generation: 0, loadedAt: 0, playPromise: null, wantsPlay: false, blocked: false, failed: '', loading: false, interruptRetries: 0, listeners: [] };
    slots.push(slot);
    connectAudio(slot);
    return slot;
  }
  function startTransition(slot) {
    if (disposed || (slot && slot !== desiredSlot)) return;
    const to = slots.map(candidate => candidate === slot ? 1 : 0);
    if (transition && transition.to.every((value, index) => value === to[index])) return;
    if (slots.every((candidate, index) => Math.abs(candidate.weight - to[index]) < .0001)) return;
    transition = { age: 0, from: slots.map(candidate => candidate.weight), to };
  }
  function failSlot(slot, message) {
    if (disposed || !slot.track) return;
    slot.failed = message;
    slot.loading = false;
    slot.wantsPlay = false;
    errors.set(slot.track.scenarioId, message);
    if (slot === desiredSlot) startTransition(null);
  }
  function attemptPlay(slot, explicit = false) {
    if (disposed || !unlocked || paused || !slot.track || slot.failed) return Promise.resolve(false);
    if (explicit) { slot.blocked = false; slot.interruptRetries = 0; }
    if (slot.blocked) return Promise.resolve(false);
    slot.wantsPlay = true;
    if (slot.playPromise) return slot.playPromise;
    if (!slot.audio.paused) {
      if (slot === desiredSlot) startTransition(slot);
      return Promise.resolve(true);
    }
    const generation = slot.generation;
    let interrupted = false;
    let play;
    try { play = slot.audio.play(); } catch (error) { play = Promise.reject(error); }
    const promise = Promise.resolve(play).then(() => {
      if (disposed || slot.generation !== generation) return false;
      if (paused || !slot.wantsPlay) {
        slot.audio.pause();
        return false;
      }
      slot.blocked = false;
      if (slot === desiredSlot) startTransition(slot);
      return true;
    }).catch(error => {
      if (disposed || slot.generation !== generation) return false;
      if (error?.name === 'NotAllowedError') slot.blocked = true;
      else if (error?.name === 'AbortError') interrupted = true;
      else if (error?.name !== 'AbortError') failSlot(slot, error?.message || 'The music file could not play.');
      return false;
    }).finally(() => {
      if (slot.playPromise !== promise) return;
      slot.playPromise = null;
      // A pause followed quickly by resume can interrupt the first play promise.
      // Retry once after that interruption; permission/file failures stay latched.
      if (interrupted && slot.interruptRetries < 1 && !disposed && !paused && slot.wantsPlay && !slot.blocked && !slot.failed && slot.audio.paused && slot.generation === generation) {
        slot.interruptRetries++;
        slot.wantsPlay = false;
        queueMicrotask(() => {
          if (!disposed && !paused && (slot === desiredSlot || slot.weight > 0)) attemptPlay(slot);
        });
      }
    });
    slot.playPromise = promise;
    return promise;
  }
  function loadSlot(slot, track) {
    stopSlot(slot, true);
    slot.track = track;
    slot.key = keyFor(track);
    slot.loadedAt = now();
    slot.loading = true;
    const generation = slot.generation;
    const onError = () => {
      if (slot.generation !== generation || disposed) return;
      const code = slot.audio.error?.code;
      const reason = code === 2 ? 'Music download failed.' : code === 3 ? 'Music decoding failed.' : code === 4 ? 'Music file is missing or unsupported.' : 'Music file could not be loaded.';
      failSlot(slot, `${reason} ${track.file}`);
    };
    const onReady = () => {
      if (slot.generation !== generation || disposed) return;
      slot.loading = false;
      if (slot === desiredSlot && unlocked && !paused && !slot.blocked && !slot.failed) attemptPlay(slot);
    };
    const onEnded = () => {
      if (slot.generation !== generation || disposed || paused || !unlocked) return;
      // loop=true normally handles this; the fallback only runs at an actual end.
      if (slot === desiredSlot || slot.weight > 0) attemptPlay(slot);
    };
    slot.listeners = [['error', onError], ['canplay', onReady], ['ended', onEnded]];
    for (const [type, listener] of slot.listeners) slot.audio.addEventListener(type, listener);
    slot.audio.src = track.url;
    slot.audio.load();
  }
  function selectTrack(force = false) {
    if (disposed || manifestState !== 'ready') return;
    const track = tracks.get(scenarioId) || null;
    const key = keyFor(track);
    if (!force && key === desiredKey && track === desiredTrack) return;
    desiredTrack = track;
    desiredKey = key;
    if (!track) {
      desiredSlot = null;
      startTransition(null);
      return;
    }
    let slot = slots.find(candidate => candidate.key === key && !candidate.failed);
    if (!slot) {
      if (slots.length < 2) slot = makeSlot();
      else slot = [...slots].sort((a, b) => a.weight - b.weight)[0];
      if (!slot) {
        manifestError = 'This browser does not support HTML audio.';
        return;
      }
      // Reusing the quietest deck bounds playback resources during rapid switches.
      // The louder outgoing deck remains audible until the replacement is ready.
      transition = null;
      loadSlot(slot, track);
    }
    desiredSlot = slot;
    if (unlocked && !paused) attemptPlay(slot);
    applyLevels();
  }

  async function reloadManifest() {
    if (disposed) return false;
    const version = ++manifestVersion;
    manifestController?.abort();
    if (manifestTimer !== null) clearTimeout(manifestTimer);
    const controller = new AbortController();
    manifestController = controller;
    manifestState = 'loading';
    manifestError = '';
    manifestTimer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(new URL('manifest.json', base).href, { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error(`Music manifest unavailable (HTTP ${response.status}).`);
      const manifest = await response.json();
      if (disposed || version !== manifestVersion) return false;
      tracks = readTracks(manifest, base);
      manifestMessage = String(manifest?.message || manifest?.reason || manifest?.blocker || '');
      manifestState = tracks.size ? 'ready' : 'unavailable';
      if (!tracks.size && !manifestMessage) manifestMessage = 'No completed music files are listed in the manifest.';
      errors.clear();
      if (tracks.size) selectTrack(true);
      else { desiredTrack = null; desiredSlot = null; desiredKey = ''; startTransition(null); }
      return tracks.size > 0;
    } catch (error) {
      if (disposed || version !== manifestVersion) return false;
      manifestState = 'unavailable';
      manifestError = error?.name === 'AbortError' ? 'Music manifest request timed out.' : error?.message || 'Music manifest could not be read.';
      return false;
    } finally {
      if (version === manifestVersion) {
        if (manifestTimer !== null) clearTimeout(manifestTimer);
        manifestTimer = null;
        manifestController = null;
      }
    }
  }

  function unlock() {
    if (disposed) return Promise.resolve(false);
    unlocked = true;
    unlockAnalysis();
    // play() is invoked synchronously within this call when a track is loaded,
    // retaining the caller's real user activation. Later rejection is exposed.
    selectTrack();
    const attempts = slots.filter(slot => slot.track && (slot === desiredSlot || slot.weight > 0))
      .map(slot => attemptPlay(slot, true));
    return Promise.all(attempts).then(results => !disposed && (results.length ? results.some(Boolean) : true));
  }
  function setMuted(value) {
    muted = Boolean(value);
    applyLevels();
  }
  function setVolume(value) {
    volume = clamp(finite(Number(value), volume));
    applyLevels();
  }
  function update(dt, state = {}) {
    if (disposed) return;
    const step = clamp(finite(dt), 0, .25);
    const wasPaused = paused;
    phase = state.phase || phase;
    paused = phase === 'paused' || state.paused === true;
    progress = clamp(finite(state.progress, progress));
    if (ROOMS.includes(state.scenarioId) && state.scenarioId !== scenarioId) {
      scenarioId = state.scenarioId;
      selectTrack();
    }
    if (paused !== wasPaused) {
      if (paused) {
        for (const slot of slots) stopSlot(slot);
      } else if (unlocked) {
        for (const slot of slots) {
          if (slot.track && (slot === desiredSlot || slot.weight > 0)) { slot.interruptRetries = 0; attemptPlay(slot); }
        }
      }
    }
    if (!paused && transition) {
      transition.age = Math.min(1, transition.age + step);
      const t = transition.age;
      const blend = t * t * (3 - 2 * t);
      const initialPower = Math.hypot(...transition.from);
      const endPower = Math.hypot(...transition.to);
      const power = initialPower + (endPower - initialPower) * blend;
      const weights = slots.map((slot, i) => transition.from[i] + (transition.to[i] - transition.from[i]) * blend);
      const normalization = Math.hypot(...weights);
      for (let i = 0; i < slots.length; i++) slots[i].weight = normalization > 0 ? weights[i] / normalization * power : 0;
      if (t === 1) {
        transition = null;
        for (const slot of slots) if (slot.weight < .0001 && slot !== desiredSlot) stopSlot(slot, true);
      }
    }
    const desiredPhaseGain = phase === 'running' ? .72 + progress * .24 : phase === 'reveal' ? .55 : phase === 'complete' ? .36 : .48;
    phaseGain += (desiredPhaseGain - phaseGain) * (1 - Math.exp(-step / .23));
    for (const slot of slots) {
      if (slot.track && slot.loading && !slot.failed && now() - slot.loadedAt > 25000) failSlot(slot, `Music loading timed out: ${slot.track.file}`);
    }
    applyLevels();
    updateRhythm(step);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    manifestVersion++;
    manifestController?.abort();
    manifestController = null;
    if (manifestTimer !== null) clearTimeout(manifestTimer);
    manifestTimer = null;
    transition = null;
    for (const slot of slots) stopSlot(slot, true);
    for(const slot of slots)slot.source?.disconnect();
    analyser?.disconnect();context?.close().catch(()=>{});
    rhythm={active:false,time:0,energy:0,beatPulse:0,bpm:0,phase:0};
    slots.length = 0;
    tracks.clear();
    errors.clear();
    desiredTrack = null;
    desiredSlot = null;
  }
  function getStatus() {
    const audible = slots.filter(slot => slot.track && !slot.audio.paused && slot.audio.readyState >= 2);
    const level = !disposed && unlocked && !muted && !paused ? clamp(volume * phaseGain * Math.hypot(...audible.map(slot => slot.weight))) : 0;
    const current = slots.filter(slot => slot.track).sort((a, b) => b.weight - a.weight)[0];
    const error = errors.get(scenarioId) || manifestError;
    const state = disposed ? 'disposed' : error ? 'error'
      : manifestState === 'loading' ? 'loading'
      : manifestState === 'unavailable' ? 'unavailable'
      : !desiredTrack ? 'unavailable'
      : !unlocked ? 'locked'
      : desiredSlot?.blocked ? 'blocked'
      : paused ? 'paused'
      : desiredSlot?.audio.readyState < 2 ? 'loading'
      : muted || volume === 0 ? 'muted'
      : level > .0001 ? 'playing' : 'ready';
    return {
      state, available: tracks.size > 0, unlocked, muted, volume, level,
      paused, phase, scenarioId, track: current?.track || null,
      requestedTrack: desiredTrack, loadingTrack: desiredSlot?.loading ? desiredSlot.track : null,
      currentTime: finite(current?.audio.currentTime),
      duration: finite(current?.audio.duration, current?.track?.duration || 0),
      crossfading: Boolean(transition), fadeProgress: transition?.age ?? 1, trackCount: tracks.size,
      decks: slots.map(slot => ({ scenarioId: slot.track?.scenarioId || null,
        currentTime: finite(slot.audio.currentTime), duration: finite(slot.audio.duration),
        paused: slot.audio.paused, readyState: slot.audio.readyState,
        weight: slot.weight, volume: slot.audio.volume, muted: slot.audio.muted,
        loading: slot.loading, blocked: slot.blocked, error: slot.failed })),
      missingScenarios: ROOMS.filter(id => !tracks.has(id)),
      message: state === 'blocked' ? 'Click the sound control again to allow music playback.'
        : !desiredTrack && tracks.size ? `No completed music file is available for ${scenarioId}.` : manifestMessage,
      error, errors: Object.fromEntries(errors), manifestState,
    };
  }
  ready = reloadManifest();
  return { unlock, setMuted, setVolume, update, dispose, reloadManifest,
    get rhythm() { return {...rhythm,active:rhythm.active&&!muted&&!paused&&!disposed&&volume>0}; }, get ready() { return ready; }, get status() { return getStatus(); } };
}
