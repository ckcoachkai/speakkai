import {audioPeakCurve} from './race3d-finish-fx.js?v=20261025-balance-drivers1';
import { audioControls, newAudioState } from './race3d-audio-controls.js?v=20261025-balance-drivers1';
/** Recorded driving textures with a procedural fallback. All audio creation and resume calls stay on start/setSound
 * so browsers only unlock the graph from a host user gesture. */
export function createRaceAudio({ sound = true } = {}) {
  const MAX_ENGINES = 3;
  const MAX_FX = 12;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const smooth = (param, value, time, constant = 0.06) => {
    if (!param) return;
    try { param.setTargetAtTime(value, time, constant); } catch { try { param.value = value; } catch {} }
  };

  let enabled = Boolean(sound), alive = true, racing = false, finished = false;
  let context = null, master = null, compressor = null, peakLimiter = null, noiseBuffer = null;
  let noiseSource = null, windFilter = null, windGain = null, skidFilter = null, skidGain = null;
  let thrustFilter = null, thrustGain = null, turboFilter = null, turboGain = null;
  let sampleGeneration = 0, sampleAbort = null, tireSample = null;
  const sampleBuffers = new Map(), sampleLoops = new Set(), sampleErrors = new Set(), seenEvents = new Set();
  let controlsSnapshot = [], focusIdentity = null, lastAccelerationCue = -Infinity;
  let previousFocusLoad = 0, previousTurbo = 0, skipTransientFrame = true;
  const sampleURLs = {
    'engine-idle': new URL('../assets/race3d-audio/engine-idle.wav', import.meta.url).href,
    'engine-load': new URL('../assets/race3d-audio/engine-load.wav', import.meta.url).href,
    'acceleration': new URL('../assets/race3d-audio/acceleration.wav', import.meta.url).href,
    'tire-skid': new URL('../assets/race3d-audio/tire-skid.wav', import.meta.url).href,
    'impact': new URL('../assets/race3d-audio/impact.wav', import.meta.url).href,
    'suspension-thud': new URL('../assets/race3d-audio/suspension-thud.wav', import.meta.url).href,
    'mechanical-click': new URL('../assets/race3d-audio/mechanical-click.wav', import.meta.url).href,
    'pressure-release': new URL('../assets/race3d-audio/pressure-release.wav', import.meta.url).href,
  };

  function makeSampleLoop(id, destination) {
    const buffer = sampleBuffers.get(id);
    if (!context || !buffer || !destination) return null;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer; source.loop = true; gain.gain.value = 0;
    source.connect(gain).connect(destination); source.start();
    const loop = { source, gain }; sampleLoops.add(loop); return loop;
  }

  function loadSamples(ctx) {
    const generation = ++sampleGeneration;
    sampleErrors.clear();
    sampleAbort = new AbortController();
    const signal = sampleAbort.signal;
    // Loading never creates or resumes an AudioContext. A late decode cannot
    // attach sources to a muted, replaced or destroyed graph.
    Promise.all(Object.entries(sampleURLs).map(async ([id, url]) => {
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        if (!alive || generation !== sampleGeneration || context !== ctx) return;
        const buffer = await ctx.decodeAudioData(data);
        if (!alive || generation !== sampleGeneration || context !== ctx || signal.aborted) return;
        sampleBuffers.set(id, buffer);
      } catch (error) { if (!signal.aborted && generation === sampleGeneration) sampleErrors.add(id); }
    })).then(() => {
      if (!alive || !enabled || generation !== sampleGeneration || context !== ctx) return;
      for (const engine of engines) {
        engine.idleSample = makeSampleLoop('engine-idle', engine.bus);
        engine.loadSample = makeSampleLoop('engine-load', engine.bus);
      }
      tireSample = makeSampleLoop('tire-skid', master);
    });
  }

  function sampleHit(id, volume = .06, { pan = 0, duration = .3, rate = 1 } = {}) {
    const buffer = sampleBuffers.get(id);
    if (!buffer || !context || !master || !enabled || effects.size >= MAX_FX) return false;
    const now = context.currentTime, source = context.createBufferSource(), gain = context.createGain();
    const length = Math.min(duration, buffer.duration / Math.max(.1, rate));
    source.buffer = buffer; source.playbackRate.value = rate;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), now + Math.min(.015, length / 3));
    gain.gain.setTargetAtTime(.0001, now + Math.max(.02, length * .6), Math.max(.015, length * .12));
    const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
    source.connect(gain);
    if (panner) { panner.pan.value = clamp(pan, -1, 1); gain.connect(panner).connect(master); }
    else gain.connect(master);
    if (!addEffect([source], [source, gain, ...(panner ? [panner] : [])])) return false;
    source.start(now); source.stop(now + length + .03); return true;
  }

  let engines = [], effects = new Set(), closeTimer = 0, finishTimer = 0;
  let lastSpin = new Map(), lastCars = new Map(), eventCooldowns = new Map();
  let lastCrashAt = -Infinity, lastShiftAt = -Infinity;
  let lastUpdateAt = 0,lastFinishBurstAt=-Infinity,finishBurstsPlayed=0,mergedFinishBursts=0,activeCount=0;
  let previousCountdown = -1;

  function makeNoiseBuffer(ctx) {
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 1.5)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let low = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      low = low * 0.72 + white * 0.28;
      data[i] = low * 2.1;
    }
    return buffer;
  }

  function makeEngine(ctx, destination) {
    const low = ctx.createOscillator(), high = ctx.createOscillator(), pulse = ctx.createOscillator();
    const lowFilter = ctx.createBiquadFilter(), highFilter = ctx.createBiquadFilter();
    const lowGain = ctx.createGain(), highGain = ctx.createGain(), bus = ctx.createGain();
    const pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    // Uneven exhaust harmonics give a combustion timbre, without the bright
    // constant buzz of an unfiltered sawtooth; recordings blend in when ready.
    low.type = 'triangle'; high.type = 'triangle'; pulse.type = 'sine';
    if (typeof ctx.createPeriodicWave === 'function') {
      const real = new Float32Array(25), imag = new Float32Array(25);
      for (let n = 1; n < imag.length; n++) imag[n] = (n % 2 ? 1 : 0.52) / Math.pow(n, 1.28);
      low.setPeriodicWave(ctx.createPeriodicWave(real, imag));
    }
    lowFilter.type = 'lowpass'; lowFilter.Q.value = 0.65;
    highFilter.type = 'bandpass'; highFilter.Q.value = 0.9;
    lowGain.gain.value = 0.58; highGain.gain.value = 0.17;
    bus.gain.value = 0;
    low.connect(lowFilter).connect(lowGain).connect(bus);
    high.connect(highFilter).connect(highGain).connect(bus);
    // The lower firing-order harmonic carries the exhaust body at idle.
    const pulseGain = ctx.createGain(); pulseGain.gain.value = 0.15;
    const pulseFilter = ctx.createBiquadFilter(); pulseFilter.type = 'lowpass'; pulseFilter.frequency.value = 280;
    pulse.connect(pulseFilter).connect(pulseGain).connect(bus);
    if (pan) bus.connect(pan).connect(destination); else bus.connect(destination);
    const now = ctx.currentTime;
    low.frequency.value = 34; high.frequency.value = 68; pulse.frequency.value = 34;
    low.start(now); high.start(now); pulse.start(now);
    return { low, high, pulse, lowFilter, highFilter, pulseFilter, lowGain, highGain, pulseGain, bus, pan,
      carId: null, gear: 1, rpm: 950, speed: 0, load: 0.15, shiftUntil: 0, controls: newAudioState(), idleSample: null, loadSample: null };
  }

  function createGraph() {
    if (!alive || !enabled) return false;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (typeof Audio !== 'function') return false;
    try {
      const ctx = new Audio();
      context = ctx;
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18; compressor.knee.value = 16;
      compressor.ratio.value = 4; compressor.attack.value = 0.008; compressor.release.value = 0.18;
      master = ctx.createGain(); master.gain.value = 0;
      peakLimiter=ctx.createWaveShaper();peakLimiter.curve=audioPeakCurve();peakLimiter.oversample='none';
      master.connect(compressor).connect(peakLimiter).connect(ctx.destination);
      noiseBuffer = makeNoiseBuffer(ctx);
      noiseSource = ctx.createBufferSource(); noiseSource.buffer = noiseBuffer; noiseSource.loop = true;
      windFilter = ctx.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 250;
      windGain = ctx.createGain(); windGain.gain.value = 0;
      skidFilter = ctx.createBiquadFilter(); skidFilter.type = 'bandpass'; skidFilter.frequency.value = 900; skidFilter.Q.value = 0.55;
      skidGain = ctx.createGain(); skidGain.gain.value = 0;
      noiseSource.connect(windFilter).connect(windGain).connect(master);
      noiseSource.connect(skidFilter).connect(skidGain).connect(master);
      thrustFilter = ctx.createBiquadFilter(); thrustFilter.type = 'bandpass'; thrustFilter.Q.value = 0.8;
      thrustGain = ctx.createGain(); thrustGain.gain.value = 0;
      noiseSource.connect(thrustFilter).connect(thrustGain).connect(master);
      turboFilter = ctx.createBiquadFilter(); turboFilter.type = 'bandpass'; turboFilter.Q.value = .65;
      turboGain = ctx.createGain(); turboGain.gain.value = 0;
      noiseSource.connect(turboFilter).connect(turboGain).connect(master);
      noiseSource.start();
      engines = Array.from({ length: MAX_ENGINES }, () => makeEngine(ctx, master));
      loadSamples(ctx);
      return true;
    } catch {
      disposeGraph();
      return false;
    }
  }

  function cancelEffects() {
    for (const effect of effects) {
      for (const source of effect.sources) {
        try { source.onended = null; source.stop(); } catch {}
      }
      for (const node of effect.nodes) { try { node.disconnect(); } catch {} }
    }
    effects.clear();
  }

  function disposeGraph() {
    const ctx = context;
    ++sampleGeneration; sampleAbort?.abort(); sampleAbort = null;
    for (const loop of sampleLoops) {
      try { loop.source.stop(); } catch {}
      try { loop.source.disconnect(); loop.gain.disconnect(); } catch {}
    }
    sampleLoops.clear(); sampleBuffers.clear(); tireSample = null;
    context = null;
    cancelEffects();
    if (noiseSource) { try { noiseSource.stop(); } catch {} try { noiseSource.disconnect(); } catch {} }
    noiseSource = null;
    for (const engine of engines) {
      for (const node of [engine.low, engine.high, engine.pulse]) { try { node.stop(); } catch {} }
      for (const node of Object.values(engine)) { try { node.disconnect(); } catch {} }
    }
    engines = [];
    for (const node of [windFilter, windGain, skidFilter, skidGain, thrustFilter, thrustGain, turboFilter, turboGain, master, compressor, peakLimiter]) { try { node?.disconnect(); } catch {} }
    thrustFilter = thrustGain = turboFilter = turboGain = null;
    windFilter = windGain = skidFilter = skidGain = master = compressor = peakLimiter = noiseBuffer = null;
    if (ctx && ctx.state !== 'closed') { try { const closing = ctx.close(); closing?.catch?.(() => {}); } catch {} }
  }

  function unlockFromGesture() {
    if (!alive || !enabled) return false;
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    if (!context || context.state === 'closed' || context.state === 'closing') {
      if (context) disposeGraph();
      if (!createGraph()) return false;
    }
    try { context.resume()?.catch?.(() => {}); } catch {}
    return true;
  }

  function addEffect(sources, nodes) {
    if (!context || effects.size >= MAX_FX) {
      for (const source of sources) { try { source.stop(); } catch {} }
      for (const node of nodes) { try { node.disconnect(); } catch {} }
      return false;
    }
    const effect = { sources, nodes, remaining: sources.length };
    effects.add(effect);
    for (const source of sources) source.onended = () => {
      effect.remaining--;
      if (effect.remaining <= 0) {
        effects.delete(effect);
        for (const node of nodes) { try { node.disconnect(); } catch {} }
      }
    };
    return true;
  }

  function reserveEffects(count) {
    while (effects.size > MAX_FX - count) {
      const effect = effects.values().next().value;
      effects.delete(effect);
      for (const source of effect.sources) { try { source.onended = null; source.stop(); } catch {} }
      for (const node of effect.nodes) { try { node.disconnect(); } catch {} }
    }
  }

  function tone(frequency, duration = 0.11, { type = 'sine', volume = 0.09, delay = 0, endFrequency = frequency, pan = 0 } = {}) {
    if (!context || !master || !enabled || effects.size >= MAX_FX) return;
    try {
      const now = context.currentTime + Math.max(0, delay), osc = context.createOscillator(), gain = context.createGain();
      osc.type = type; osc.frequency.setValueAtTime(frequency, now);
      if (endFrequency !== frequency) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
      osc.connect(gain);
      if (panner) { panner.pan.value = clamp(pan, -1, 1); gain.connect(panner).connect(master); }
      else gain.connect(master);
      if (!addEffect([osc], [osc, gain, ...(panner ? [panner] : [])])) return;
      osc.start(now); osc.stop(now + duration + 0.015);
    } catch {}
  }

  function noiseHit(duration = 0.16, volume = 0.18, cutoff = 1200, { endCutoff = cutoff, type = 'lowpass', pan = 0, attack = 0.004, delay = 0 } = {}) {
    if (!context || !noiseBuffer || !master || !enabled || effects.size >= MAX_FX) return;
    try {
      const now = context.currentTime + delay, source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = noiseBuffer; filter.type = type; filter.frequency.setValueAtTime(cutoff, now);
      if (endCutoff !== cutoff) filter.frequency.exponentialRampToValueAtTime(Math.max(20, endCutoff), now + duration);
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(attack, duration * 0.4));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
      source.connect(filter).connect(gain);
      if (panner) { panner.pan.value = clamp(pan, -1, 1); gain.connect(panner).connect(master); }
      else gain.connect(master);
      if (!addEffect([source], [source, filter, gain, ...(panner ? [panner] : [])])) return;
      source.start(now); source.stop(now + duration + 0.01);
    } catch {}
  }

  function crash(intensity = 1, { volume = 1, pan = 0 } = {}) {
    const now = context?.currentTime ?? 0;
    if (!context || now - lastCrashAt < 0.18) return;
    lastCrashAt = now;
    const strength = clamp(Number(intensity) || 1, 0.35, 1.6);
    reserveEffects(3);
    if (sampleHit('impact', .15 * strength * volume, { pan, duration: .52, rate: 1.1 - strength * .12 })) return;
    noiseHit(0.22, 0.14 * strength * volume, 780, { pan });
    tone(92 + Math.random() * 22, 0.19, { type: 'triangle', volume: 0.095 * strength * volume, endFrequency: 42, pan });
    tone(410, 0.055, { type: 'square', volume: 0.035 * strength * volume, endFrequency: 170, pan });
  }

  function shift(direction = 1) {
    const now = context?.currentTime ?? 0;
    if (!context || now - lastShiftAt < 0.12) return;
    lastShiftAt = now;
    if (sampleHit('mechanical-click', .035, { duration: .085, rate: direction > 0 ? 1.15 : .9 })) return;
    tone(direction > 0 ? 210 : 145, 0.105, { type: 'sawtooth', volume: 0.045, endFrequency: direction > 0 ? 105 : 225 });
    noiseHit(0.055, 0.032, 1900);
  }

  function eventList(events) {
    if (!events) return [];
    if (Array.isArray(events)) return events;
    if (Array.isArray(events.events)) return events.events;
    const flags = ['crash', 'collision', 'gearshift', 'shift', 'skid', 'pickup', 'boost', 'banana-drop', 'banana-launch', 'banana-land', 'banana-hit', 'bomb-launch', 'bomb-explode', 'ramp-approach', 'ramp-takeoff', 'ramp-land', 'trick-complete', 'repair'];
    const flagged = flags.filter(key => events[key]).map(key => ({ type: key, intensity: events[key]?.intensity ?? events.intensity }));
    if (flagged.length) return flagged;
    return [events];
  }

  function eventType(event) {
    if (typeof event === 'string') return event.toLowerCase();
    return String(event?.type ?? event?.name ?? event?.kind ?? '').toLowerCase();
  }

  function carId(car, index) { return car?.id ?? car?.name ?? index; }
  function carSpeed(car) { return Math.max(0, Number(car?.speed ?? car?.velocity ?? car?.forwardSpeed) || 0); }
  function carSideSpeed(car) { return Math.abs(Number(car?.lateralVelocity ?? car?.sideSpeed ?? car?.driftSpeed) || 0); }
  function carSpin(car) { return Math.max(0, Number(car?.spin) || 0); }
  function scalarDistance(car) { return Number(car?.distance ?? car?.progress ?? 0) || 0; }
  function scalarSide(car) { return Number(car?.lateral ?? car?.offset ?? car?.x ?? 0) || 0; }

  function eventSpace(event, primary) {
    if (!primary || typeof event !== 'object') return { volume: 0.75, pan: 0 };
    const isPrimary = event?.carId === primary.id;
    const eventDistance = Number(event?.distance);
    const separation = Number.isFinite(eventDistance) ? Math.abs(eventDistance - scalarDistance(primary)) : 0;
    const lateral = Number(event?.lateral);
    return {
      volume: isPrimary ? 1 : (separation > 180 ? 0 : 0.85 / (1 + separation * 0.035)),
      pan: Number.isFinite(lateral) ? clamp((lateral - scalarSide(primary)) / 10, -0.85, 0.85) : 0,
    };
  }

  function powerSound(type, space, itemType) {
    const { volume, pan } = space;
    if(type==='item-pickup'||type==='pickup'){
      // Original ratcheting prism draw, bounded to six short voices. The
      // result's distinct motif plays only when that driver's draw locks.
      for(let i=0;i<6;i++)tone(470+i*115,.045,{type:'triangle',volume:.034*volume,delay:i*.115,pan});
      return;
    }
    if (type === 'item-ready') {
      const motifs = {
        launch: [660, 1320, 'square', 0.06], rocket: [880, 1760, 'triangle', 0.13],
        shield: [1046, 1568, 'sine', 0.1], missile: [1480, 1110, 'square', 0.075],
        shockwave: [523, 2093, 'triangle', 0.15], freeze: [2349, 1760, 'sine', 0.16],
        repair: [1319, 1661, 'sine', 0.1],
      };
      if (motifs[itemType]) {
        const [first, second, wave, delay] = motifs[itemType];
        tone(first, 0.12, { type: wave, volume: 0.07 * volume, pan });
        tone(second, 0.22, { type: wave, volume: 0.065 * volume, delay, pan });
        return;
      }
      // Each collected item has a two-note identity before its deployment cue.
      if (itemType === 'banana') {
        tone(780, 0.12, { volume: 0.09 * volume, endFrequency: 390, pan });
        tone(510, 0.16, { volume: 0.075 * volume, endFrequency: 1020, delay: 0.12, pan });
        return;
      }
      if (itemType === 'bomb') {
        tone(220, 0.09, { type: 'square', volume: 0.055 * volume, pan });
        tone(330, 0.16, { type: 'square', volume: 0.05 * volume, delay: 0.13, pan });
        return;
      }
      if (itemType === 'boost') {
        tone(620, 0.24, { type: 'triangle', volume: 0.085 * volume, endFrequency: 1860, pan });
        tone(1240, 0.2, { volume: 0.055 * volume, endFrequency: 2480, delay: 0.08, pan });
        return;
      }
      tone(920, 0.085, { volume: 0.065 * volume, endFrequency: 1320, pan });
      tone(1580, 0.13, { type: 'triangle', volume: 0.045 * volume, delay: 0.075, pan });
    } else if (/^repair(-|$)/.test(type)) {
      // Soft ratchet clicks, a rising servo, then a warm restored chord.
      // Delays share the ordinary voice pool, so repair cannot leak voices.
      noiseHit(0.065, 0.045 * volume, 1600, { type: 'bandpass', endCutoff: 900, pan });
      noiseHit(0.065, 0.035 * volume, 2100, { type: 'bandpass', delay: 0.11, pan });
      tone(230, 0.28, { type: 'triangle', endFrequency: 460, volume: 0.045 * volume, pan });
      for (const [pitch, delay] of [[660, 0.22], [830.6, 0.27], [990, 0.32]])
        tone(pitch, 0.31, { volume: 0.035 * volume, delay, pan });
    } else if (/^shockwave(-|$)/.test(type)) {
      // A rounded, expanding liquid pulse for the jellyfish's shockwave.
      tone(190, 0.52, { volume: 0.08 * volume, endFrequency: 42, pan });
      tone(430, 0.3, { volume: 0.043 * volume, endFrequency: 100, delay: 0.055, pan });
      noiseHit(0.48, 0.085 * volume, 1900, { type: 'bandpass', endCutoff: 190, attack: 0.065, pan });
      tone(310, 0.29, { volume: 0.035 * volume, endFrequency: 70, delay: 0.17, pan });
    } else if (/^(launch|rocket|shield|missile|freeze)(-|$)/.test(type)) {
      const ability = type.split('-')[0];
      const cues = {
        launch: [160, 680, 0.36, 'triangle', 850], rocket: [190, 760, 0.55, 'sawtooth', 1800],
        shield: [520, 1040, 0.48, 'sine', 3200], missile: [1800, 420, 0.32, 'triangle', 2400],
        freeze: [3200, 1600, 0.5, 'sine', 6000],
      };
      const [pitch, end, duration, wave, cutoff] = cues[ability];
      tone(pitch, duration, { type: wave, endFrequency: end, volume: 0.065 * volume, pan });
      noiseHit(duration, 0.075 * volume, cutoff, { type: 'bandpass', endCutoff: cutoff / 2, pan });
    } else if (type === 'boost') {
      noiseHit(0.7, 0.15 * volume, 450, { endCutoff: 4400, type: 'bandpass', attack: 0.045, pan });
      tone(160, 0.48, { type: 'triangle', volume: 0.07 * volume, endFrequency: 440, pan });
    } else if (type === 'banana-launch') {
      noiseHit(0.27, 0.065 * volume, 650, { type: 'bandpass', endCutoff: 2800, attack: 0.025, pan });
      tone(350, 0.23, { volume: 0.045 * volume, endFrequency: 830, pan });
    } else if (type === 'banana-land' || type === 'banana-drop') {
      tone(310, 0.12, { volume: 0.065 * volume, endFrequency: 125, pan });
      noiseHit(0.055, 0.035 * volume, 700, { pan });
    } else if (type === 'ramp-approach') {
      tone(350, 0.21, { type: 'triangle', volume: 0.04 * volume, endFrequency: 700, pan });
      noiseHit(0.22, 0.045 * volume, 600, { type: 'bandpass', endCutoff: 1800, attack: 0.04, pan });
    } else if (type === 'ramp-takeoff') {
      // Nitro lift followed by a longer airy tail, once per launch.
      tone(140, 0.32, { type: 'triangle', volume: 0.07 * volume, endFrequency: 560, pan });
      noiseHit(0.32, 0.11 * volume, 400, { type: 'bandpass', endCutoff: 2800, attack: 0.025, pan });
      noiseHit(0.85, 0.065 * volume, 2400, { type: 'bandpass', endCutoff: 800, attack: 0.08, delay: 0.16, pan });
    } else if (type === 'trick-complete') {
      for (const [pitch, delay] of [[784, 0], [988, 0.075], [1568, 0.15]])
        tone(pitch, 0.23, { type: 'triangle', volume: 0.045 * volume, delay, pan });
    } else if (type === 'ramp-land') {
      if (sampleHit('suspension-thud', .10 * volume, { pan, duration: .45, rate: .92 })) return;
      // Low tyre contact and a soft suspension rebound, without a crash clang.
      noiseHit(0.16, 0.085 * volume, 700, { endCutoff: 170, pan });
      tone(105, 0.2, { volume: 0.07 * volume, endFrequency: 48, pan });
      tone(68, 0.18, { volume: 0.025 * volume, endFrequency: 92, delay: 0.075, pan });
    } else if (type === 'banana-hit' || type === 'spin' || type === 'skid') {
      // Filtered rubber scrape and descending squeal distinguish a slip from
      // the low, hard body impact used for collisions and bomb damage.
      if (sampleHit('tire-skid', .075 * volume, { pan, duration: .26, rate: .95 })) return;
      noiseHit(0.5, 0.1 * volume, 2400, { endCutoff: 700, type: 'bandpass', attack: 0.02, pan });
      tone(1450, 0.32, { volume: 0.04 * volume, endFrequency: 420, pan });
    } else if (type === 'bomb-launch') {
      noiseHit(0.2, 0.11 * volume, 480, { endCutoff: 2800, type: 'bandpass', attack: 0.025, pan });
      tone(225, 0.16, { type: 'triangle', volume: 0.055 * volume, endFrequency: 95, pan });
    } else if (type === 'bomb-explode') {
      noiseHit(0.65, 0.28 * volume, 2200, { endCutoff: 140, pan });
      tone(100, 0.5, { type: 'triangle', volume: 0.18 * volume, endFrequency: 28, pan });
      noiseHit(0.13, 0.09 * volume, 5200, { endCutoff: 1200, type: 'highpass', pan });
    }
  }

  function finishBurst(space){
    const now=context.currentTime;if(now-lastFinishBurstAt<.12){mergedFinishBursts++;return;}
    lastFinishBurstAt=now;finishBurstsPlayed++;reserveEffects(3);
    const volume=Math.min(.8,space.volume),pan=space.pan||0;
    noiseHit(.62,.20*volume,4800,{endCutoff:180,pan,attack:.012});
    tone(95,.65,{type:'sine',volume:.16*volume,endFrequency:27,pan});
    noiseHit(.25,.055*volume,6000,{endCutoff:1900,type:'highpass',pan,attack:.008});
  }
  function normalizeEvents(events, cars, primary) {
    let crashEvent = false, shiftEvent = false;
    const now = context.currentTime;
    // Nearby explosions take voice priority over the numerous item boxes in a
    // large grid. Every one-shot still uses the same twelve-voice ceiling.
    const focusedPickup = event => primary && event?.carId === primary.id && /^(item-pickup|item-ready|pickup)$/.test(eventType(event));
    const priority = event => (focusedPickup(event) ? 200 : eventType(event) === 'finish-burst' ? 150 : eventType(event) === 'bomb-explode' ? 100 : 0) + eventSpace(event, primary).volume * 10;
    const list = eventList(events).sort((a, b) => priority(b) - priority(a)).slice(0, 80);
    for (const event of list) {
      const type = eventType(event);
      if (Number.isFinite(event?.time)) {
        const identity = `${type}:${event.carId}:${event.time}:${event.projectileId ?? event.hazardId ?? event.otherCarId ?? ''}`;
        if (seenEvents.has(identity)) continue;
        seenEvents.add(identity);
      }
      const space = eventSpace(event, primary);
      if (space.volume < 0.04) continue;
      if(type==='finish-burst'){finishBurst({...space,volume:space.volume*(event.intensity??1)});continue;}
      const isSkid = /^(banana-hit|spin|skid|drift|spinout)$/.test(type);
      const isPower = /^(item-pickup|item-ready|pickup|boost|banana-drop|banana-launch|banana-land|banana-hit|bomb-launch|bomb-explode|ramp-approach|ramp-takeoff|ramp-land|trick-complete)$/.test(type) || /^(launch|rocket|shield|missile|shockwave|freeze|repair)(-|$)/.test(type);
      if(type==='item-pickup' && primary && event.carId!==primary.id)continue;
      const group = isSkid ? 'skid' : /crash|collision|impact|hit/.test(type) ? 'impact' : type;
      const key = `${group}:${event?.carId ?? 'all'}`;
      const interval = isSkid ? 0.55 : group === 'impact' ? .18 : /^(ramp-|trick-complete|repair)/.test(type) ? 1 : type === 'boost' ? 0.7 : 0.14;
      // Explicit impacts suppress state fallbacks even when another event from
      // this car was just heard; a single slip must not become a second crash.
      if (isSkid || type === 'bomb-hit' || type === 'bomb-explode') crashEvent = true;
      if (now - (eventCooldowns.get(key) ?? -Infinity) < interval) continue;
      eventCooldowns.set(key, now);
      if (focusedPickup(event)) {
        // Reserve two voices even if earlier frames filled the transient pool.
        reserveEffects(type==='item-pickup'?6:2);
      }
      if (isPower || isSkid) powerSound(isSkid ? 'skid' : type, space, event?.itemType);
      else if (/crash|collision|impact|hit/.test(type)) { crashEvent = true; crash(event?.intensity ?? event?.strength ?? 1, space); }
      else if (/gear|shift/.test(type)) { shiftEvent = true; if (space.volume > 0.5) shift(event?.direction ?? 1); }
    }
    while (seenEvents.size > 512) seenEvents.delete(seenEvents.values().next().value);
    while (eventCooldowns.size > 256) eventCooldowns.delete(eventCooldowns.keys().next().value);
  }

  function chooseEngines(cars, focusId) {
    if (!cars.length) return [];
    let primary = focusId == null ? null : cars.find(car => carId(car, cars.indexOf(car)) === focusId || car.id === focusId);
    if (!primary) primary = cars.reduce((best, car) => scalarDistance(car) > scalarDistance(best) ? car : best, cars[0]);
    const others = cars.filter(car => car !== primary).sort((a, b) => {
      const da = Math.hypot(scalarDistance(a) - scalarDistance(primary), (scalarSide(a) - scalarSide(primary)) * 2.5);
      const db = Math.hypot(scalarDistance(b) - scalarDistance(primary), (scalarSide(b) - scalarSide(primary)) * 2.5);
      return da - db;
    });
    return [primary, ...others.slice(0, MAX_ENGINES - 1)];
  }

  function updateEngines(selected, time, dt) {
    if (!context || !master) return;
    const primary = selected[0];
    const changedFocus = focusIdentity !== primary?.id;
    if (changedFocus) {
      focusIdentity = primary?.id ?? null; previousFocusLoad = 0; previousTurbo = 0;
      for (const engine of engines) engine.controls = newAudioState();
    }
    const snapshots = [];
    let focusGain = .13;
    for (let i = 0; i < engines.length; i++) {
      const engine = engines[i], car = selected[i];
      if (!car) { smooth(engine.bus.gain, 0, time); continue; }
      const speed = carSpeed(car), normalized = clamp(speed / Math.max(20, Number(car.topSpeed) || 43), 0, 1.5);
      const type = String(car.racerType || car.vehicleId || '');
      const profile = /formula|f1|gt3/.test(type) ? 'hypercar' : /gallardo|supercar/.test(type) ? 'supercar' : /monster/.test(type) ? 'muscle' : 'electric';
      const controls = audioControls(car, engine.controls, { time, dt, focused: i === 0, enabled, racing,
        profile, separation: Math.abs(scalarDistance(car) - scalarDistance(primary)), focusGain });
      if (i === 0) focusGain = controls.engineGain;
      if (controls.shift && !skipTransientFrame) {
        engine.shiftUntil = time + .11; shift(controls.shift);
      }
      engine.gear = controls.gear; engine.rpm = controls.rpm; engine.load = controls.load; engine.carId = car.id;
      const relativeSpeed = i ? speed - carSpeed(primary) : 0;
      const approach = scalarDistance(car) < scalarDistance(primary) ? 1 : -1;
      const doppler = clamp(1 + relativeSpeed * approach / 340, .94, 1.06);
      const hz = controls.pitchHz * doppler;
      const sampled = !!engine.idleSample && !!engine.loadSample;
      smooth(engine.low.frequency, hz, time, .025);
      smooth(engine.high.frequency, hz * 2.01, time, .035);
      smooth(engine.pulse.frequency, hz * .5, time, .03);
      smooth(engine.lowGain.gain, sampled ? .13 : .58, time, .12);
      smooth(engine.pulseGain.gain, sampled ? .05 : .15, time, .12);
      smooth(engine.lowFilter.frequency, 280 + normalized * 1050 + controls.load * 900, time, .08);
      smooth(engine.highFilter.frequency, 420 + normalized * 1300 + controls.load * 700, time, .08);
      smooth(engine.pulseFilter.frequency, 140 + normalized * 270, time, .08);
      smooth(engine.highGain.gain, (sampled ? .03 : .07) + controls.load * (sampled ? .045 : .14), time, .08);
      const playbackRate = clamp(controls.rpm / 3600, .55, 1.8) * doppler;
      if (engine.idleSample) {
        smooth(engine.idleSample.source.playbackRate, clamp(playbackRate, .65, 1.65), time, .08);
        smooth(engine.idleSample.gain.gain, .64 * (1 - controls.load * .8), time, .08);
      }
      if (engine.loadSample) {
        smooth(engine.loadSample.source.playbackRate, playbackRate, time, .055);
        smooth(engine.loadSample.gain.gain, .12 + controls.load * .68, time, .07);
      }
      smooth(engine.bus.gain, controls.engineGain * (time < engine.shiftUntil ? .5 : 1), time, changedFocus ? .08 : .045);
      if (engine.pan) smooth(engine.pan.pan, clamp((scalarSide(car) - scalarSide(primary)) / 14, -.85, .85), time, .12);
      if (i === 0) {
        smooth(windFilter.frequency, 180 + normalized * 1800, time, .12);
        smooth(windGain.gain, controls.windGain, time, .16);
        smooth(skidFilter.frequency, controls.tireHz, time, .05);
        smooth(skidGain.gain, controls.tireGain * (tireSample ? .12 : 1), time, controls.tireGain ? .035 : .13);
        if (tireSample) {
          smooth(tireSample.gain.gain, controls.tireGain * .85, time, controls.tireGain ? .035 : .13);
          smooth(tireSample.source.playbackRate, .85 + normalized * .3, time, .10);
        }
        smooth(turboGain.gain, controls.turboGain, time, controls.turboGain ? .04 : .10);
        smooth(turboFilter.frequency, 650 + normalized * 1900 + controls.load * 500, time, .08);
        smooth(thrustGain.gain, controls.rocketGain, time, .04);
        smooth(thrustFilter.frequency, 1100 + speed * 30, time, .08);
        const skidKey = `skid:${car.id}`;
        if (!changedFocus && !skipTransientFrame && controls.brakeChirp && time - (eventCooldowns.get(skidKey) ?? -Infinity) > .55) {
          eventCooldowns.set(skidKey, time);
          if (!sampleHit('tire-skid', .055, { duration: .13, rate: 1.12 })) noiseHit(.13, .055, 1800, { type: 'bandpass' });
        }
        if (!changedFocus && !skipTransientFrame && controls.load > .72 && previousFocusLoad < .60 && Number(car.acceleration) > 3 && time - lastAccelerationCue > 3) {
          sampleHit('acceleration', .065, { duration: .8, rate: clamp(playbackRate, .8, 1.3) }); lastAccelerationCue = time;
        }
        if (!changedFocus && !skipTransientFrame && previousTurbo > .012 && controls.turboGain === 0) sampleHit('pressure-release', .04, { duration: .22, rate: 1.2 });
        previousFocusLoad = controls.load; previousTurbo = controls.turboGain;
      }
      snapshots.push({ id: car.id, profile, ...controls, sampled });
    }
    if (!primary) {
      for (const node of [windGain, skidGain, thrustGain, turboGain, tireSample?.gain]) smooth(node?.gain, 0, time);
    }
    controlsSnapshot = snapshots;
  }

  function playCountdown(value) {
    if (!racing || finished || !context || ![3, 2, 1, 'GO'].includes(value) || value === previousCountdown) return;
    previousCountdown = value;
    // The core supplies the visible transitions; audio has no independent clock.
    // One oscillator per cue also makes GO unmistakable without an extra beep.
    reserveEffects(1);
    tone(value === 'GO' ? 1040 : 510, value === 'GO' ? 0.28 : 0.12,
      { type: value === 'GO' ? 'triangle' : 'square', volume: value === 'GO' ? 0.11 : 0.075 });
  }
  function start() {
    if (!alive) return;
    if (finishTimer) { clearTimeout(finishTimer); finishTimer = 0; }
    racing = true; finished = false; lastUpdateAt = 0;
    skipTransientFrame = true; focusIdentity = null; seenEvents.clear(); controlsSnapshot = [];
    previousFocusLoad = 0; previousTurbo = 0; lastAccelerationCue = -Infinity;
    lastSpin.clear(); lastCars.clear(); eventCooldowns.clear(); lastCrashAt = -Infinity; lastShiftAt = -Infinity; previousCountdown = -1;
    for (const engine of engines) { engine.carId = null; engine.rpm = 950; engine.load = 0.15; engine.controls = newAudioState(); }
    if (!enabled || !unlockFromGesture()) return;
    const now = context.currentTime;
    smooth(master?.gain, 0.82, now, 0.07);
  }

  function update(cars = [], focusId = null, events = []) {
    if(!alive)return;
    const list = Array.isArray(cars) ? cars : [];
    const active=list.filter(c=>!c.finished);activeCount=active.length;
    if (!racing || !enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    const selected = chooseEngines(active, focusId);
    const dt = clamp(lastUpdateAt ? now - lastUpdateAt : 1 / 60, 1 / 240, 0.1);
    lastUpdateAt = now;
    const pending = eventList(events);
    for (const event of pending) if (eventType(event) === 'countdown') playCountdown(event.value);
    const listener=list.find(c=>c.id===focusId)||selected[0];
    if (!skipTransientFrame) normalizeEvents(pending.filter(event => eventType(event) !== 'countdown'), list, listener);
    for (let i = 0; i < list.length; i++) {
      const car = list[i], id = carId(car, i);
      lastCars.set(id, { speed: carSpeed(car), gear: car?.gear == null ? null : Number(car.gear) });
    }
    while (lastCars.size > 64) lastCars.delete(lastCars.keys().next().value);
    updateEngines(selected, now, dt);
    skipTransientFrame = false;
    if(finished&&!activeCount&&pending.some(e=>eventType(e)==='finish-burst')){
      if(finishTimer)clearTimeout(finishTimer);
      finishTimer=setTimeout(()=>{finishTimer=0;if(!alive||activeCount||!context)return;master?.gain.setValueAtTime(0,context.currentTime);racing=false;context.suspend()?.catch?.(()=>{});},1450);
    }
  }

  function finish(winner){
    // A winner is recorded before the other drivers finish. Keep their mixer
    // alive and leave the decorative burst sounds on the regular shared bus.
    if(!alive||finished)return;finished=true;
  }
  function reset() {
    if (!alive) return;
    if (finishTimer) { clearTimeout(finishTimer); finishTimer = 0; }
    racing = false; finished = false; lastUpdateAt = 0;lastFinishBurstAt=-Infinity;finishBurstsPlayed=mergedFinishBursts=activeCount=0;
    focusIdentity = null; skipTransientFrame = true; controlsSnapshot = []; seenEvents.clear();
    for (const engine of engines) engine.controls = newAudioState();
    previousCountdown = -1; lastSpin.clear(); lastCars.clear(); eventCooldowns.clear();
    cancelEffects();
    if (context && master) {
      const now = context.currentTime;
      try { master.gain.setValueAtTime(0, now); } catch { master.gain.value = 0; }
      for (const engine of engines) { try { engine.bus.gain.setValueAtTime(0, now); } catch { engine.bus.gain.value = 0; } }
      try { windGain?.gain.setValueAtTime(0, now); skidGain?.gain.setValueAtTime(0, now); } catch {}
      try { thrustGain?.gain.setValueAtTime(0, now); turboGain?.gain.setValueAtTime(0, now); tireSample?.gain.gain.setValueAtTime(0, now); } catch {}
      try { context.suspend()?.catch?.(() => {}); } catch {}
    }
  }

  function setSound(value) {
    if (!alive) return;
    enabled = Boolean(value);
    if (!enabled) {
      cancelEffects(); skipTransientFrame = true;
      if (context && master) smooth(master.gain, 0, context.currentTime, 0.04);
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { closeTimer = 0; disposeGraph(); }, 120);
      return;
    }
    // Host invokes this from its sound-button click. This is the second and only
    // other place where a suspended context may be resumed.
    if (racing) {
      skipTransientFrame = true; focusIdentity = null; seenEvents.clear(); lastUpdateAt = 0;
      for (const engine of engines) engine.controls = newAudioState();
      if (unlockFromGesture()) {
        smooth(master?.gain, 0.82, context.currentTime, 0.08);
        if(finished&&!activeCount){if(finishTimer)clearTimeout(finishTimer);finishTimer=setTimeout(()=>{finishTimer=0;if(!alive||activeCount||!context)return;master?.gain.setValueAtTime(0,context.currentTime);racing=false;context.suspend()?.catch?.(()=>{});},1600);}
      }
    }
  }

  function destroy() {
    if (!alive) return;
    alive = false; racing = false; finished = true;
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    if (finishTimer) { clearTimeout(finishTimer); finishTimer = 0; }
    disposeGraph();
    lastSpin.clear(); lastCars.clear(); eventCooldowns.clear();
  }

  const snapshot = () => ({ enabled, racing, finished, contextState: context?.state || 'none',
    finishBurstsPlayed,mergedFinishBursts,peakProtected:!!peakLimiter,activeCount,sampleCount: sampleBuffers.size, sampleErrors: [...sampleErrors], loops: sampleLoops.size,
    engines: controlsSnapshot.map(value => ({ ...value })), transientVoices: effects.size,
    creditsURL: new URL('../assets/race3d-audio/CREDITS.md', import.meta.url).href });
  return { start, update, finish, reset, setSound, destroy, snapshot };
}

export default createRaceAudio;
