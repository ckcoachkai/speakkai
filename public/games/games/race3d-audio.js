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
  let engines = [], effects = new Set(), closeTimer = 0, finishTimer = 0;
  let lastGear = null, lastSpeed = 0, lastSpin = new Map(), lastCars = new Map();
  let lastCrashAt = -Infinity, lastShiftAt = -Infinity, raceStartedAt = 0;
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
    low.type = 'sawtooth'; high.type = 'triangle'; pulse.type = 'square';
    lowFilter.type = 'lowpass'; lowFilter.Q.value = 0.65;
    highFilter.type = 'bandpass'; highFilter.Q.value = 0.9;
    lowGain.gain.value = 0.62; highGain.gain.value = 0.24;
    bus.gain.value = 0;
    low.connect(lowFilter).connect(lowGain).connect(bus);
    high.connect(highFilter).connect(highGain).connect(bus);
    // A separate pulse layer gives the engine a four-cylinder edge without
    // adding recorded samples.
    const pulseGain = ctx.createGain(); pulseGain.gain.value = 0.08;
    const pulseFilter = ctx.createBiquadFilter(); pulseFilter.type = 'lowpass'; pulseFilter.frequency.value = 280;
    pulse.connect(pulseFilter).connect(pulseGain).connect(bus);
    if (pan) bus.connect(pan).connect(destination); else bus.connect(destination);
    const now = ctx.currentTime;
    low.frequency.value = 34; high.frequency.value = 68; pulse.frequency.value = 34;
    low.start(now); high.start(now); pulse.start(now);
    return { low, high, pulse, lowFilter, highFilter, pulseFilter, lowGain, highGain, pulseGain, bus, pan };
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
    for (const node of [windFilter, windGain, skidFilter, skidGain, master, compressor]) { try { node?.disconnect(); } catch {} }
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

  function tone(frequency, duration = 0.11, { type = 'sine', volume = 0.09, delay = 0, endFrequency = frequency } = {}) {
    if (!context || !master || !enabled || effects.size >= MAX_FX) return;
    try {
      const now = context.currentTime + Math.max(0, delay), osc = context.createOscillator(), gain = context.createGain();
      osc.type = type; osc.frequency.setValueAtTime(frequency, now);
      if (endFrequency !== frequency) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(master);
      if (!addEffect([osc], [osc, gain])) return;
      osc.start(now); osc.stop(now + duration + 0.015);
    } catch {}
  }

  function noiseHit(duration = 0.16, volume = 0.18, cutoff = 1200) {
    if (!context || !noiseBuffer || !master || !enabled || effects.size >= MAX_FX) return;
    try {
      const now = context.currentTime, source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = noiseBuffer; filter.type = 'lowpass'; filter.frequency.value = cutoff;
      gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter).connect(gain).connect(master);
      if (!addEffect([source], [source, filter, gain])) return;
      source.start(now); source.stop(now + duration + 0.01);
    } catch {}
  }

  function crash(intensity = 1) {
    const now = context?.currentTime ?? 0;
    if (!context || now - lastCrashAt < 0.18) return;
    lastCrashAt = now;
    const strength = clamp(Number(intensity) || 1, 0.35, 1.6);
    noiseHit(0.22, 0.14 * strength, 780);
    tone(92 + Math.random() * 22, 0.19, { type: 'triangle', volume: 0.095 * strength, endFrequency: 42 });
    tone(410, 0.055, { type: 'square', volume: 0.035 * strength, endFrequency: 170 });
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
    const flags = ['crash', 'collision', 'gearshift', 'shift', 'skid'];
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

  function normalizeEvents(events, cars) {
    let crashEvent = false, shiftEvent = false;
    for (const event of eventList(events)) {
      const type = eventType(event);
      if (/crash|collision|impact|hit|spinout/.test(type)) { crashEvent = true; crash(event?.intensity ?? event?.strength ?? 1); }
      if (/gear|shift/.test(type)) { shiftEvent = true; shift(event?.direction ?? 1); }
      if (/skid|drift/.test(type)) tone(1320, 0.13, { type: 'sine', volume: 0.035, endFrequency: 920 });
    }
    // Simulation state is also a useful fallback if an event queue was drained
    // between rendered frames.
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i], id = carId(car, i), old = lastCars.get(id), speed = carSpeed(car), spin = carSpin(car);
      if (!crashEvent && ((spin > 0.08 && (lastSpin.get(id) ?? 0) <= 0.08) || (old && old.speed - speed > 7))) {
        crash(clamp((old ? old.speed - speed : 8) / 12, 0.45, 1.4)); crashEvent = true;
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

  function updateEngines(cars, focusId, time) {
    if (!context || !master) return;
    const selected = chooseEngines(cars, focusId);
    const primary = selected[0];
    let primarySpeed = primary ? carSpeed(primary) : 0;
    if (primary?.finished) primarySpeed *= 0.18;
    const speedLimit = Math.max(35, Number(primary?.topSpeed ?? primary?.maxSpeed) || 72);
    const ratio = clamp(primarySpeed / speedLimit, 0, 1);
    const gearCount = 6;
    const gearPosition = Math.min(gearCount - 0.0001, ratio * gearCount);
    const gear = Math.floor(gearPosition) + 1;
    const throttle = clamp(0.22 + (primarySpeed - lastSpeed) * 0.05, 0.08, 1);
    if (racing && !finished && lastGear != null && gear !== lastGear && time - lastShiftAt > 0.12) shift(gear > lastGear ? 1 : -1);
    lastGear = gear;
    lastSpeed = primarySpeed;

    for (let i = 0; i < engines.length; i++) {
      const engine = engines[i], car = selected[i];
      if (!car) { smooth(engine.bus.gain, 0, time); continue; }
      const speed = carSpeed(car), normalized = clamp(speed / Math.max(35, Number(car?.topSpeed ?? car?.maxSpeed) || 72), 0, 1);
      const localPosition = Math.min(gearCount - 0.0001, normalized * gearCount);
      const localRpm = 900 + (localPosition - Math.floor(localPosition)) * 5450;
      const hz = localRpm / 30;
      engine.low.frequency.setTargetAtTime(hz, time, 0.07);
      engine.high.frequency.setTargetAtTime(hz * 2.02, time, 0.07);
      engine.pulse.frequency.setTargetAtTime(hz * 0.5, time, 0.07);
      engine.lowFilter.frequency.setTargetAtTime(270 + normalized * 1700, time, 0.1);
      engine.highFilter.frequency.setTargetAtTime(430 + normalized * 2100, time, 0.1);
      engine.pulseFilter.frequency.setTargetAtTime(130 + normalized * 330, time, 0.1);
      const gain = i === 0 ? 0.19 + normalized * 0.05 : 0.075 / (i + 0.25 + Math.abs(scalarDistance(car) - scalarDistance(primary)) * 0.03);
      const slip = clamp(Math.max(carSpin(car) * 0.65, carSideSpeed(car) / 10, Number(car?.skid ?? car?.drift) || 0), 0, 1);
      engine.bus.gain.setTargetAtTime(gain * (0.6 + throttle * 0.4) * (racing ? 1 : 0), time, 0.09);
      if (engine.pan) engine.pan.pan.setTargetAtTime(clamp((scalarSide(car) - scalarSide(primary)) / 14, -0.85, 0.85), time, 0.12);
      if (i === 0) {
        smooth(windFilter.frequency, 180 + normalized * 1800, time, 0.12);
        smooth(windGain.gain, racing ? 0.015 + normalized * 0.11 : 0, time, 0.16);
        smooth(skidFilter.frequency, 650 + slip * 1900, time, 0.05);
        smooth(skidGain.gain, racing ? Math.pow(slip, 1.25) * 0.22 : 0, time, 0.045);
      }
    }
  }

  function playCountdown(time) {
    if (!racing || finished || !context) return;
    const elapsed = time - raceStartedAt;
    const step = Math.floor(elapsed / 0.65);
    if (step < 0 || step > 3 || step === previousCountdown) return;
    previousCountdown = step;
    if (step < 3) tone(510, 0.09, { type: 'square', volume: 0.055 });
    else { tone(820, 0.15, { type: 'triangle', volume: 0.085 }); tone(1040, 0.12, { type: 'sine', volume: 0.035, delay: 0.045 }); }
  }

  function start() {
    if (!alive) return;
    if (finishTimer) { clearTimeout(finishTimer); finishTimer = 0; }
    racing = true; finished = false; lastGear = null; lastSpeed = 0;
    lastSpin.clear(); lastCars.clear(); lastCrashAt = -Infinity; lastShiftAt = -Infinity; previousCountdown = -1;
    if (!enabled || !unlockFromGesture()) return;
    const now = context.currentTime;
    raceStartedAt = now;
    smooth(master?.gain, 0.82, now, 0.07);
    // Three dry warning beeps and a higher release tone match the simulation's
    // start lights; they never loop or play outside the race.
    playCountdown(now);
  }

  function update(cars = [], focusId = null, events = []) {
    if (!alive || !racing || !enabled || !context || context.state !== 'running') return;
    const list = Array.isArray(cars) ? cars : [];
    const now = context.currentTime;
    normalizeEvents(events, list);
    for (let i = 0; i < list.length; i++) {
      const car = list[i], id = carId(car, i);
      lastCars.set(id, { speed: carSpeed(car), gear: car?.gear == null ? null : Number(car.gear) });
    }
    while (lastCars.size > 64) lastCars.delete(lastCars.keys().next().value);
    playCountdown(now);
    updateEngines(list, focusId, now);
  }

  function finish(winner) {
    if (!alive || finished) return;
    finished = true; racing = false;
    if (!enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    for (const engine of engines) smooth(engine.bus.gain, 0, now, 0.12);
    smooth(windGain?.gain, 0, now, 0.12); smooth(skidGain?.gain, 0, now, 0.08);
    tone(590, 0.18, { type: 'triangle', volume: 0.08, delay: 0.06 });
    tone(790, 0.22, { type: 'sine', volume: 0.07, delay: 0.24 });
    tone(990, 0.32, { type: 'triangle', volume: 0.055, delay: 0.46 });
    if (finishTimer) clearTimeout(finishTimer);
    finishTimer = setTimeout(() => { finishTimer = 0; if (context && master && !racing) smooth(master.gain, 0, context.currentTime, 0.2); }, 950);
  }

  function reset() {
    if (!alive) return;
    if (finishTimer) { clearTimeout(finishTimer); finishTimer = 0; }
    racing = false; finished = false; lastGear = null; lastSpeed = 0;
    previousCountdown = -1; lastSpin.clear(); lastCars.clear();
    cancelEffects();
    if (context && master) {
      const now = context.currentTime;
      try { master.gain.setValueAtTime(0, now); } catch { master.gain.value = 0; }
      for (const engine of engines) { try { engine.bus.gain.setValueAtTime(0, now); } catch { engine.bus.gain.value = 0; } }
      try { windGain?.gain.setValueAtTime(0, now); skidGain?.gain.setValueAtTime(0, now); } catch {}
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
    lastSpin.clear(); lastCars.clear();
  }

  return { start, update, finish, reset, setSound, destroy };
}

export default createRaceAudio;
