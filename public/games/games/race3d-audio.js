/** Procedural race audio. All audio creation and resume calls stay on start/setSound
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
  let context = null, master = null, compressor = null, noiseBuffer = null;
  let noiseSource = null, windFilter = null, windGain = null, skidFilter = null, skidGain = null;
  let thrustFilter = null, thrustGain = null;
  let engines = [], effects = new Set(), closeTimer = 0, finishTimer = 0;
  let lastSpin = new Map(), lastCars = new Map(), eventCooldowns = new Map();
  let lastCrashAt = -Infinity, lastShiftAt = -Infinity;
  let lastUpdateAt = 0;
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
    // constant buzz of an unfiltered sawtooth or any recorded engine samples.
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
      carId: null, gear: 1, rpm: 950, speed: 0, load: 0.15, shiftUntil: 0 };
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
      master.connect(compressor).connect(ctx.destination);
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
      noiseSource.start();
      engines = Array.from({ length: MAX_ENGINES }, () => makeEngine(ctx, master));
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
    context = null;
    cancelEffects();
    if (noiseSource) { try { noiseSource.stop(); } catch {} try { noiseSource.disconnect(); } catch {} }
    noiseSource = null;
    for (const engine of engines) {
      for (const node of [engine.low, engine.high, engine.pulse]) { try { node.stop(); } catch {} }
      for (const node of Object.values(engine)) { try { node.disconnect(); } catch {} }
    }
    engines = [];
    for (const node of [windFilter, windGain, skidFilter, skidGain, thrustFilter, thrustGain, master, compressor]) { try { node?.disconnect(); } catch {} }
    thrustFilter = thrustGain = null;
    windFilter = windGain = skidFilter = skidGain = master = compressor = noiseBuffer = null;
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
    noiseHit(0.22, 0.14 * strength * volume, 780, { pan });
    tone(92 + Math.random() * 22, 0.19, { type: 'triangle', volume: 0.095 * strength * volume, endFrequency: 42, pan });
    tone(410, 0.055, { type: 'square', volume: 0.035 * strength * volume, endFrequency: 170, pan });
  }

  function shift(direction = 1) {
    const now = context?.currentTime ?? 0;
    if (!context || now - lastShiftAt < 0.12) return;
    lastShiftAt = now;
    tone(direction > 0 ? 210 : 145, 0.105, { type: 'sawtooth', volume: 0.045, endFrequency: direction > 0 ? 105 : 225 });
    noiseHit(0.055, 0.032, 1900);
  }

  function eventList(events) {
    if (!events) return [];
    if (Array.isArray(events)) return events;
    if (Array.isArray(events.events)) return events.events;
    const flags = ['crash', 'collision', 'gearshift', 'shift', 'skid', 'pickup', 'boost', 'banana-drop', 'banana-hit', 'bomb-launch', 'bomb-explode'];
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
    if (type === 'item-pickup' || type === 'pickup') {
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
    } else if (/^(launch|rocket|shield|missile|shockwave|freeze|repair)(-|$)/.test(type)) {
      const ability = type.split('-')[0];
      const cues = {
        launch: [160, 680, 0.36, 'triangle', 850], rocket: [190, 760, 0.55, 'sawtooth', 1800],
        shield: [520, 1040, 0.48, 'sine', 3200], missile: [1800, 420, 0.32, 'triangle', 2400],
        shockwave: [140, 32, 0.55, 'triangle', 550], freeze: [3200, 1600, 0.5, 'sine', 6000],
        repair: [660, 1320, 0.42, 'sine', 1200],
      };
      const [pitch, end, duration, wave, cutoff] = cues[ability];
      tone(pitch, duration, { type: wave, endFrequency: end, volume: 0.065 * volume, pan });
      noiseHit(duration, 0.075 * volume, cutoff, { type: 'bandpass', endCutoff: cutoff / 2, pan });
    } else if (type === 'boost') {
      noiseHit(0.7, 0.15 * volume, 450, { endCutoff: 4400, type: 'bandpass', attack: 0.045, pan });
      tone(160, 0.48, { type: 'triangle', volume: 0.07 * volume, endFrequency: 440, pan });
    } else if (type === 'banana-drop') {
      tone(310, 0.12, { volume: 0.065 * volume, endFrequency: 125, pan });
      noiseHit(0.055, 0.035 * volume, 700, { pan });
    } else if (type === 'banana-hit' || type === 'spin' || type === 'skid') {
      // Filtered rubber scrape and descending squeal distinguish a slip from
      // the low, hard body impact used for collisions and bomb damage.
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

  function normalizeEvents(events, cars, primary) {
    let crashEvent = false, shiftEvent = false;
    const now = context.currentTime;
    // Nearby explosions take voice priority over the numerous item boxes in a
    // large grid. Every one-shot still uses the same twelve-voice ceiling.
    const focusedPickup = event => primary && event?.carId === primary.id && /^(item-pickup|pickup)$/.test(eventType(event));
    const priority = event => (focusedPickup(event) ? 200 : eventType(event) === 'bomb-explode' ? 100 : 0) + eventSpace(event, primary).volume * 10;
    const list = eventList(events).sort((a, b) => priority(b) - priority(a)).slice(0, 80);
    for (const event of list) {
      const type = eventType(event);
      const space = eventSpace(event, primary);
      if (space.volume < 0.04) continue;
      const isSkid = /^(banana-hit|spin|skid|drift|spinout)$/.test(type);
      const isPower = /^(item-pickup|pickup|boost|banana-drop|banana-hit|bomb-launch|bomb-explode)$/.test(type) || /^(launch|rocket|shield|missile|shockwave|freeze|repair)(-|$)/.test(type);
      const group = isSkid ? 'skid' : type;
      const key = `${group}:${event?.carId ?? 'all'}`;
      const interval = isSkid ? 0.55 : type === 'boost' ? 0.7 : 0.14;
      // Explicit impacts suppress state fallbacks even when another event from
      // this car was just heard; a single slip must not become a second crash.
      if (isSkid || type === 'bomb-hit' || type === 'bomb-explode') crashEvent = true;
      if (now - (eventCooldowns.get(key) ?? -Infinity) < interval) continue;
      eventCooldowns.set(key, now);
      if (focusedPickup(event)) {
        // Reserve two voices even if earlier frames filled the transient pool.
        reserveEffects(2);
      }
      if (isPower || isSkid) powerSound(isSkid ? 'skid' : type, space, event?.itemType);
      else if (/crash|collision|impact|hit/.test(type)) { crashEvent = true; crash(event?.intensity ?? event?.strength ?? 1, space); }
      else if (/gear|shift/.test(type)) { shiftEvent = true; if (space.volume > 0.5) shift(event?.direction ?? 1); }
    }
    while (eventCooldowns.size > 256) eventCooldowns.delete(eventCooldowns.keys().next().value);
    // Simulation state is also a useful fallback if an event queue was drained
    // between rendered frames.
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i], id = carId(car, i), old = lastCars.get(id), speed = carSpeed(car), spin = carSpin(car);
      const space = eventSpace({ carId: id, distance: scalarDistance(car), lateral: scalarSide(car) }, primary);
      if (!crashEvent && space.volume > 0.1 && spin > 0.08 && (lastSpin.get(id) ?? 0) <= 0.08) {
        powerSound('skid', space); crashEvent = true;
      } else if (!crashEvent && space.volume > 0.1 && old && old.speed - speed > 7) {
        crash(clamp((old.speed - speed) / 12, 0.45, 1.4), space); crashEvent = true;
      }
      if (!shiftEvent && old && old.gear != null && car?.gear != null && Number(car.gear) !== old.gear) {
        shift(Number(car.gear) > old.gear ? 1 : -1); shiftEvent = true;
      }
      lastSpin.set(id, spin);
    }
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
    const thrust = racing && Number(primary?.rocketRemaining ?? 0) > 0;
    smooth(thrustGain?.gain, thrust ? 0.16 : 0, time, 0.04);
    smooth(thrustFilter?.frequency, 1100 + Math.min(50, carSpeed(primary)) * 30, time, 0.08);
    const gearLimits = [0.24, 0.43, 0.65, 0.88, 1.18];
    if (!primary) { smooth(windGain.gain, 0, time); smooth(skidGain.gain, 0, time); }
    for (let i = 0; i < engines.length; i++) {
      const engine = engines[i], car = selected[i];
      if (!car) { smooth(engine.bus.gain, 0, time); continue; }
      const speed = carSpeed(car), limit = Math.max(20, Number(car?.topSpeed ?? car?.maxSpeed) || 43);
      const normalized = clamp(speed / limit, 0, 1.3), boosted = Number(car?.boost) > 0;
      const changedCar = engine.carId !== carId(car, i);
      if (changedCar) {
        engine.carId = carId(car, i); engine.speed = speed; engine.gear = 1;
        while (engine.gear < 5 && normalized > gearLimits[engine.gear - 1] * 0.91) engine.gear++;
        engine.shiftUntil = 0;
      }
      const oldGear = engine.gear;
      // Separate up/down thresholds keep the engine from hunting between gears
      // through corners. A short load dip makes each upshift audible.
      if (engine.gear < 5 && normalized > gearLimits[engine.gear - 1] * 0.92) engine.gear++;
      else if (engine.gear > 1 && normalized < gearLimits[engine.gear - 2] * 0.72) engine.gear--;
      if (engine.gear !== oldGear && !changedCar) {
        engine.shiftUntil = time + 0.11;
        if (i === 0 && !finished) shift(engine.gear > oldGear ? 1 : -1);
      }
      const acceleration = clamp((speed - engine.speed) / dt, -20, 14);
      engine.speed = speed;
      const braking = clamp(Number(car?.brake) || 0, 0, 1);
      const load = clamp(0.42 + acceleration * 0.05 - braking * 0.4 + (boosted ? 0.25 : 0), 0.08, 1);
      engine.load += (load - engine.load) * (1 - Math.exp(-dt * 9));
      const targetRpm = clamp(950 + normalized / gearLimits[engine.gear - 1] * 5550 + (boosted ? 260 : 0), 900, 7300);
      engine.rpm += (targetRpm - engine.rpm) * (1 - Math.exp(-dt * 14));
      const relativeSpeed = i === 0 ? 0 : speed - carSpeed(primary);
      const approach = scalarDistance(car) < scalarDistance(primary) ? 1 : -1;
      const doppler = clamp(1 + relativeSpeed * approach / 340, 0.94, 1.06);
      const idleFlutter = speed < 3 ? Math.sin(time * 31 + i * 1.7) * 1.4 : 0;
      const hz = (engine.rpm / 30 + idleFlutter) * doppler;
      smooth(engine.low.frequency, hz, time, 0.025);
      smooth(engine.high.frequency, hz * 2.01, time, 0.035);
      smooth(engine.pulse.frequency, hz * 0.5, time, 0.03);
      smooth(engine.lowFilter.frequency, 330 + normalized * 1350 + engine.load * 600, time, 0.08);
      smooth(engine.highFilter.frequency, 480 + normalized * 1800, time, 0.08);
      smooth(engine.pulseFilter.frequency, 140 + normalized * 270, time, 0.08);
      smooth(engine.highGain.gain, 0.09 + engine.load * 0.14 + (boosted ? 0.06 : 0), time, 0.08);
      const gain = i === 0 ? 0.2 + normalized * 0.035 : 0.08 / (i + 0.25 + Math.abs(scalarDistance(car) - scalarDistance(primary)) * 0.03);
      const slip = clamp(Math.max(carSpin(car) * 0.65, carSideSpeed(car) / 10, Number(car?.slip ?? car?.skid ?? car?.drift) || 0), 0, 1);
      const shiftLoad = time < engine.shiftUntil ? 0.55 : 1;
      smooth(engine.bus.gain, gain * (0.52 + engine.load * 0.48) * shiftLoad * (racing ? 1 : 0), time, 0.045);
      if (engine.pan) engine.pan.pan.setTargetAtTime(clamp((scalarSide(car) - scalarSide(primary)) / 14, -0.85, 0.85), time, 0.12);
      if (i === 0) {
        smooth(windFilter.frequency, 180 + normalized * 1800, time, 0.12);
        smooth(windGain.gain, racing ? normalized * normalized * 0.1 + (boosted ? 0.07 : 0) : 0, time, 0.16);
        smooth(skidFilter.frequency, 650 + slip * 1900, time, 0.05);
        smooth(skidGain.gain, racing ? Math.pow(slip, 1.25) * 0.22 : 0, time, 0.045);
      }
    }
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
    lastSpin.clear(); lastCars.clear(); eventCooldowns.clear(); lastCrashAt = -Infinity; lastShiftAt = -Infinity; previousCountdown = -1;
    for (const engine of engines) { engine.carId = null; engine.rpm = 950; engine.load = 0.15; }
    if (!enabled || !unlockFromGesture()) return;
    const now = context.currentTime;
    smooth(master?.gain, 0.82, now, 0.07);
  }

  function update(cars = [], focusId = null, events = []) {
    if (!alive || !racing || !enabled || !context || context.state !== 'running') return;
    const list = Array.isArray(cars) ? cars : [];
    const now = context.currentTime;
    const selected = chooseEngines(list, focusId);
    const dt = clamp(lastUpdateAt ? now - lastUpdateAt : 1 / 60, 1 / 240, 0.1);
    lastUpdateAt = now;
    const pending = eventList(events);
    for (const event of pending) if (eventType(event) === 'countdown') playCountdown(event.value);
    normalizeEvents(pending.filter(event => eventType(event) !== 'countdown'), list, selected[0]);
    for (let i = 0; i < list.length; i++) {
      const car = list[i], id = carId(car, i);
      lastCars.set(id, { speed: carSpeed(car), gear: car?.gear == null ? null : Number(car.gear) });
    }
    while (lastCars.size > 64) lastCars.delete(lastCars.keys().next().value);
    updateEngines(selected, now, dt);
  }

  function finish(winner) {
    if (!alive || finished) return;
    finished = true; racing = false;
    if (!enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    for (const engine of engines) smooth(engine.bus.gain, 0, now, 0.12);
    smooth(windGain?.gain, 0, now, 0.12); smooth(skidGain?.gain, 0, now, 0.08);
    smooth(thrustGain?.gain, 0, now, 0.06);
    tone(590, 0.18, { type: 'triangle', volume: 0.08, delay: 0.06 });
    tone(790, 0.22, { type: 'sine', volume: 0.07, delay: 0.24 });
    tone(990, 0.32, { type: 'triangle', volume: 0.055, delay: 0.46 });
    if (finishTimer) clearTimeout(finishTimer);
    finishTimer = setTimeout(() => { finishTimer = 0; if (context && master && !racing) smooth(master.gain, 0, context.currentTime, 0.2); }, 950);
  }

  function reset() {
    if (!alive) return;
    if (finishTimer) { clearTimeout(finishTimer); finishTimer = 0; }
    racing = false; finished = false; lastUpdateAt = 0;
    previousCountdown = -1; lastSpin.clear(); lastCars.clear(); eventCooldowns.clear();
    cancelEffects();
    if (context && master) {
      const now = context.currentTime;
      try { master.gain.setValueAtTime(0, now); } catch { master.gain.value = 0; }
      for (const engine of engines) { try { engine.bus.gain.setValueAtTime(0, now); } catch { engine.bus.gain.value = 0; } }
      try { windGain?.gain.setValueAtTime(0, now); skidGain?.gain.setValueAtTime(0, now); } catch {}
      try { thrustGain?.gain.setValueAtTime(0, now); } catch {}
      try { context.suspend()?.catch?.(() => {}); } catch {}
    }
  }

  function setSound(value) {
    if (!alive) return;
    enabled = Boolean(value);
    if (!enabled) {
      if (context && master) smooth(master.gain, 0, context.currentTime, 0.04);
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { closeTimer = 0; disposeGraph(); }, 120);
      return;
    }
    // Host invokes this from its sound-button click. This is the second and only
    // other place where a suspended context may be resumed.
    if (racing) {
      if (unlockFromGesture()) smooth(master?.gain, 0.82, context.currentTime, 0.08);
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

  return { start, update, finish, reset, setSound, destroy };
}

export default createRaceAudio;
