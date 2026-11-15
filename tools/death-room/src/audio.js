/**
 * Synthesized chamber audio and licensed local human reactions. Audio is
 * gesture-unlocked; the game drives timing and health through update/react.
 */
const MASTER_LEVEL = 0.58;
const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

// Layer levels are deliberately restrained. Each threat has its own spectral
// balance; the round's progress changes density, pitch, and pulse speed.
const PROFILES = {
  crushing: { base: 46, rumble: .19, cutoff: 155, noise: .032, band: 460, q: .7, air: .003, machine: .038, hz: 87, lowpass: 320, shimmer: .002, note: 174, pulse: .022, rate: .65, interval: 1.22 },
  boiler:   { base: 55, rumble: .12, cutoff: 210, noise: .055, band: 1180, q: .6, air: .016, machine: .023, hz: 110, lowpass: 390, shimmer: .006, note: 330, pulse: .016, rate: .55, interval: 1.62 },
  flood:    { base: 49, rumble: .14, cutoff: 260, noise: .067, band: 480, q: .45, air: .007, machine: .008, hz: 98, lowpass: 240, shimmer: .006, note: 294, pulse: .008, rate: .38, interval: .91 },
  gas:      { base: 52, rumble: .07, cutoff: 115, noise: .039, band: 1750, q: .4, air: .013, machine: .008, hz: 104, lowpass: 240, shimmer: .009, note: 311, pulse: .008, rate: .40, interval: 2.35 },
  rats:     { base: 58, rumble: .06, cutoff: 175, noise: .016, band: 780, q: .6, air: .003, machine: .007, hz: 116, lowpass: 290, shimmer: .002, note: 233, pulse: .012, rate: .88, interval: .65 },
  collapse: { base: 42, rumble: .22, cutoff: 180, noise: .040, band: 330, q: .4, air: .007, machine: .025, hz: 84, lowpass: 250, shimmer: .002, note: 168, pulse: .029, rate: .65, interval: 1.32 },
  electric: { base: 60, rumble: .08, cutoff: 180, noise: .018, band: 2200, q: .8, air: .005, machine: .034, hz: 120, lowpass: 820, shimmer: .012, note: 480, pulse: .014, rate: 1.1, interval: .88 },
  freeze:   { base: 49, rumble: .09, cutoff: 130, noise: .042, band: 690, q: .6, air: .014, machine: .005, hz: 98, lowpass: 220, shimmer: .014, note: 587, pulse: .005, rate: .28, interval: 2.25 },
  spikes:   { base: 48, rumble: .12, cutoff: 170, noise: .018, band: 510, q: .8, air: .003, machine: .035, hz: 96, lowpass: 420, shimmer: .005, note: 288, pulse: .025, rate: .73, interval: 1.1 },
  lasers:   { base: 65, rumble: .06, cutoff: 130, noise: .008, band: 1600, q: 1, air: .003, machine: .017, hz: 130, lowpass: 470, shimmer: .014, note: 520, pulse: .012, rate: .80, interval: 1.42 },
};

export function createAudio({ voiceBase = import.meta.env.BASE_URL + 'assets/voices/' } = {}) {
  let context = null;
  let graph = null;
  let disposed = false;
  let muted = false;
  let musicLevel = 0;
  let scenarioId = 'crushing';
  let phase = 'preview';
  let phaseAge = 0;
  let progress = 0;
  let elapsed = 0;
  let nextAccent = 0;
  let lastUpdate = -Infinity;
  let pendingCue = null;
  let randomState = 0x5c72af19;
  const permanent = new Set();
  const voices = new Set();
  const paramTargets = new Map();
  const cueTimes = new Map();
  const humanVoices = new Set();
  const reactionEffects = new Set();
  const humanSamples = new Map();
  const actorVoices = new Map();
  const reactionTimes = new Map();
  const impactTimes = new Map();
  const actorHealth = new Map();
  const reactionRequests = new Map();
  const impactRequests = new Map();
  let voiceLoadState = 'idle';
  let voiceErrors = [];
  let voiceAssetCount = 0;
  let voiceController = null;
  let voiceTimer = null;
  let voiceReady = Promise.resolve(false);
  let lastHumanTime = -Infinity;
  let lastImpactTime = -Infinity;
  let recentHumanStarts = [];
  let recentImpactStarts = [];
  const voiceHistory = [];
  const impactHistory = [];
  const voiceStats = { requests: 0, started: 0, impacts: 0, impactLayers: 0, suppressed: 0, maxConcurrent: 0 };

  const random = () => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 4294967296;
  };
  const keep = node => { permanent.add(node); return node; };
  const gainNode = level => {
    const node = keep(context.createGain());
    node.gain.value = level;
    return node;
  };
  const filterNode = (type, frequency, q = .7) => {
    const node = keep(context.createBiquadFilter());
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    return node;
  };
  function target(param, value, timeConstant = .18) {
    if (!param || !Number.isFinite(value)) return;
    const old = paramTargets.get(param);
    if (old !== undefined && Math.abs(old - value) < Math.max(.00004, Math.abs(value) * .004)) return;
    paramTargets.set(param, value);
    param.setTargetAtTime(value, context.currentTime, timeConstant);
  }
  function connectPosition(node, pan = 0, destination = graph.bus) {
    if (!context.createStereoPanner) {
      node.connect(destination);
      return null;
    }
    const panner = context.createStereoPanner();
    panner.pan.value = clamp(pan, -.75, .75);
    node.connect(panner);
    panner.connect(destination);
    return panner;
  }
  function continuousTone(type, frequency, destination, detune = 0) {
    const oscillator = keep(context.createOscillator());
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    oscillator.connect(destination);
    oscillator.start();
    return oscillator;
  }
  function noiseBuffer(brown) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 6.71), context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) {
      const white = random() * 2 - 1;
      previous = (previous + .025 * white) / 1.025;
      data[i] = brown ? clamp(previous * 3.8, -1, 1) : white;
    }
    // Brown noise's loop boundary should not introduce a periodic click.
    if (brown) {
      const blend = Math.min(4096, Math.floor(data.length / 8));
      for (let i = 0; i < blend; i++) {
        const mix = i / (blend - 1);
        const index = data.length - blend + i;
        data[index] = data[index] * (1 - mix) + data[0] * mix;
      }
    }
    return buffer;
  }
  function loopNoise(buffer, destination) {
    const source = keep(context.createBufferSource());
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start();
    return source;
  }
  function chamberImpulse() {
    const length = Math.ceil(context.sampleRate * 1.3);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const seconds = i / context.sampleRate;
        const onset = clamp((seconds - .012) / .022);
        samples[i] = (random() * 2 - 1) * Math.exp(-seconds * 5.9) * onset;
      }
      for (const [delay, level] of [[.024, .85], [.047, .53], [.081, .32]]) {
        samples[Math.round((delay + channel * .003) * context.sampleRate)] += level;
      }
    }
    return impulse;
  }
  function buildGraph() {
    const bus = gainNode(1);
    const highpass = filterNode('highpass', 29, .5);
    const compressor = keep(context.createDynamicsCompressor());
    compressor.threshold.value = -19;
    compressor.knee.value = 15;
    compressor.ratio.value = 5;
    compressor.attack.value = .012;
    compressor.release.value = .24;
    const master = gainNode(0);
    bus.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);
    graph = { bus, master, white: noiseBuffer(false), brown: noiseBuffer(true) };

    // A short, dark stereo room tail puts all synthesized sources in the
    // same physical chamber. The direct path retains crisp, readable cues.
    const chamber = keep(context.createConvolver());
    chamber.buffer = chamberImpulse();
    const reflections = filterNode('lowpass', 1900, .45);
    const roomLevel = gainNode(.17);
    bus.connect(chamber);
    chamber.connect(reflections);
    reflections.connect(roomLevel);
    roomLevel.connect(highpass);

    const drone = gainNode(0);
    const droneOvertone = gainNode(.32);
    droneOvertone.connect(drone);
    drone.connect(bus);
    const droneA = continuousTone('sine', 46, drone);
    const droneB = continuousTone('sine', 92.3, droneOvertone, 3);

    const rumble = gainNode(0);
    const rumbleFilter = filterNode('lowpass', 155, .4);
    rumbleFilter.connect(rumble);
    rumble.connect(bus);
    loopNoise(graph.brown, rumbleFilter);

    const noise = gainNode(0);
    const noiseFilter = filterNode('bandpass', 460, .7);
    noiseFilter.connect(noise);
    const noisePan = connectPosition(noise, -.17);
    if (noisePan) keep(noisePan);
    const white = loopNoise(graph.white, noiseFilter);

    const air = gainNode(0);
    const airFilter = filterNode('highpass', 2600, .45);
    white.connect(airFilter);
    airFilter.connect(air);
    const airPan = connectPosition(air, .22);
    if (airPan) keep(airPan);

    const machine = gainNode(0);
    const machineFilter = filterNode('lowpass', 320, .65);
    machineFilter.connect(machine);
    machine.connect(bus);
    const machineA = continuousTone('sawtooth', 87, machineFilter, -4);
    const machineBLevel = gainNode(.3);
    machineBLevel.connect(machineFilter);
    const machineB = continuousTone('triangle', 87.6, machineBLevel, 4);

    const shimmer = gainNode(0);
    const shimmerPan = connectPosition(shimmer, .12);
    if (shimmerPan) keep(shimmerPan);
    const shimmerTone = continuousTone('sine', 174, shimmer);

    const pulse = gainNode(0);
    pulse.connect(bus);
    const pulseTone = continuousTone('sine', 70, pulse);
    Object.assign(graph, { drone, droneA, droneB, rumble, rumbleFilter, noise, noiseFilter, air, machine, machineFilter, machineA, machineB, shimmer, shimmerTone, pulse, pulseTone });
    target(master.gain, muted ? 0 : MASTER_LEVEL, .12);
  }

  function releaseVoice(voice) {
    if (!voices.delete(voice)) return;
    humanVoices.delete(voice);
    reactionEffects.delete(voice);
    for (const node of voice.nodes) {
      try { node.disconnect(); } catch { /* Already disconnected. */ }
    }
  }
  function registerVoice(source, nodes, end, extra = {}) {
    const voice = { source, nodes, ...extra };
    voices.add(voice);
    source.onended = () => releaseVoice(voice);
    source.stop(end + .03);
    return voice;
  }

  async function loadVoiceAssets() {
    if (disposed || !context) return false;
    voiceLoadState = 'loading';
    voiceController = new AbortController();
    const controller = voiceController;
    voiceTimer = setTimeout(() => controller.abort(), 20000);
    try {
      const base = new URL(voiceBase.endsWith('/') ? voiceBase : `${voiceBase}/`, globalThis.location?.href || 'http://localhost/');
      const manifestResponse = await fetch(new URL('manifest.json', base), { signal: controller.signal });
      if (!manifestResponse.ok) throw new Error(`Voice manifest: HTTP ${manifestResponse.status}`);
      const manifest = await manifestResponse.json();
      const entries = Array.isArray(manifest.samples) ? manifest.samples.slice(0, 12) : [];
      voiceAssetCount = entries.length;
      if (!entries.length) throw new Error('No recorded voice samples are listed.');
      await Promise.all(entries.map(async entry => {
        try {
          if (!entry.file || !entry.id || !['scream', 'gasp', 'pain', 'cry'].includes(entry.category)) throw new Error('Invalid sample metadata');
          const response = await fetch(new URL(entry.file, base), { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const encoded = await response.arrayBuffer();
          if (disposed) return;
          const buffer = await context.decodeAudioData(encoded);
          if (disposed) return;
          if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > 8) throw new Error('Unexpected reaction duration');
          humanSamples.set(entry.id, { ...entry, buffer });
        } catch (error) {
          if (!disposed) voiceErrors.push(`${entry.id || 'sample'}: ${error?.message || 'Decode failed'}`);
        }
      }));
      if (!disposed) voiceLoadState = humanSamples.size ? voiceErrors.length ? 'partial' : 'ready' : 'error';
      return !disposed && humanSamples.size > 0;
    } catch (error) {
      if (!disposed) {
        voiceErrors.push(error?.name === 'AbortError' ? 'Voice asset loading timed out.' : error?.message || 'Recorded voices unavailable.');
        voiceLoadState = 'error';
      }
      return false;
    } finally {
      if (voiceTimer !== null) clearTimeout(voiceTimer);
      voiceTimer = null;
      if (voiceController === controller) voiceController = null;
    }
  }

  function stopHumanVoices(fade = .025) {
    if (!context) return;
    for (const voice of new Set([...humanVoices, ...reactionEffects])) {
      try {
        voice.amp.gain.cancelScheduledValues(context.currentTime);
        voice.amp.gain.setTargetAtTime(0, context.currentTime, Math.max(.004, fade / 4));
        voice.source.stop(context.currentTime + fade);
      } catch { releaseVoice(voice); }
    }
  }
  function resetReactions() {
    stopHumanVoices();
    reactionTimes.clear();
    impactTimes.clear();
    actorHealth.clear();
    reactionRequests.clear();
    impactRequests.clear();
    recentHumanStarts = [];
    recentImpactStarts = [];
    lastHumanTime = lastImpactTime = -Infinity;
  }
  function actorVoice(actorId, requested) {
    if (actorVoices.has(actorId)) return actorVoices.get(actorId);
    let hash = 2166136261;
    for (const char of actorId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    const gender = ['male', 'female'].includes(requested) ? requested : hash % 2 ? 'female' : 'male';
    const rosterNumber = Number(actorId.match(/\d+$/)?.[0]);
    const paletteIndex = Number.isFinite(rosterNumber) ? rosterNumber % 8 : hash % 8;
    const profile = { gender, rate: .94 + ((paletteIndex * 3) % 8) * .015, shade: (hash >>> 9) % 4 };
    // The game currently has eight students; keep recycled roster IDs bounded.
    if (actorVoices.size >= 8) actorVoices.delete(actorVoices.keys().next().value);
    actorVoices.set(actorId, profile);
    return profile;
  }
  function reactionImpact(type, pan, strength) {
    const level = strength * (1 - .2 * clamp(musicLevel / .25));
    if (/bite|blood|squish|splat|wet/.test(type)) {
      noiseHit(580, .12, .057 * level, { pan, q: .5, endFrequency: 250, reaction: true });
      tone(120, 72, .13, .026 * level, { type: 'triangle', pan, reaction: true });
      noiseHit(150, .17, .026 * level, { brown: true, type: 'lowpass', delay: .055, pan, reaction: true });
    } else if (/electric|shock/.test(type)) {
      noiseHit(2400, .07, .032 * level, { pan, reaction: true });
      tone(310, 85, .15, .025 * level, { type: 'triangle', pan, reaction: true });
    } else {
      noiseHit(210, .25, .087 * level, { brown: true, type: 'lowpass', pan, reaction: true });
      tone(82, 43, .18, .031 * level, { pan, reaction: true });
      noiseHit(115, .18, .022 * level, { brown: true, type: 'lowpass', delay: .065, pan, reaction: true });
    }
  }

  function rememberRequest(map, actorId, time) {
    map.set(actorId, time);
    if (map.size > 8) map.delete(map.keys().next().value);
  }
  function fairTurn(actorId, requests, accepted, time) {
    const own = accepted.get(actorId)?.time ?? -Infinity;
    for (const [otherId, requestedAt] of requests) {
      if (otherId !== actorId && time - requestedAt < 2.5 && (accepted.get(otherId)?.time ?? -Infinity) < own) return false;
    }
    return true;
  }
  function healthFor(event, actorId) {
    const suppliedStage = String(event.stage || event.health?.stage || '').toLowerCase();
    const ratioValue = event.ratio ?? event.healthRatio ?? event.health?.ratio
      ?? (Number.isFinite(event.health?.current) && event.health?.max > 0 ? event.health.current / event.health.max : undefined);
    const suppliedRatio = Number.isFinite(ratioValue) ? clamp(ratioValue) : null;
    const knownStage = ['healthy', 'hurt', 'wounded', 'critical', 'dead'].includes(suppliedStage);
    if (knownStage || suppliedRatio !== null) {
      const ratio = suppliedRatio ?? ({ healthy: 1, hurt: .7, wounded: .45, critical: .2, dead: 0 })[suppliedStage];
      const stage = knownStage ? suppliedStage : ratio <= 0 ? 'dead' : ratio <= .25 ? 'critical' : ratio <= .55 ? 'wounded' : ratio <= .8 ? 'hurt' : 'healthy';
      actorHealth.set(actorId, { stage, ratio });
      if (actorHealth.size > 8) actorHealth.delete(actorHealth.keys().next().value);
    }
    return actorHealth.get(actorId) || { stage: 'unknown', ratio: null };
  }

  /** Short adult-recorded reactions; returns whether a voice or impact started. */
  function react(event = {}) {
    voiceStats.requests++;
    const type = String(event.type || '').toLowerCase().replace(/_/g, '-');
    const actorId = String(event.actorId ?? event.id ?? 'room');
    const kind = String(event.kind || event.health?.lastKind || '').toLowerCase();
    const invincible = event.invincible === true || /^(?:vip-?456|player-?456|456)$/i.test(actorId.replace(/\s/g, ''));
    if (disposed || invincible || type === 'damage' || /^flood-(?:water|start)$/.test(type)) {
      voiceStats.suppressed++; return false;
    }
    // Cache bounded health notifications even while muted. Later expression
    // callbacks can omit HP without accidentally reverting to a healthy voice.
    const health = healthFor(event, actorId);
    if (muted || !context || !graph || context.state !== 'running' || !['running', 'reveal'].includes(phase)) {
      voiceStats.suppressed++; return false;
    }
    // Calm/happy/focused expressions never masquerade as distress.
    if (!/fear|panic|cry|sad|gasp|drown|cough|heat|pain|hurt|injury|wound|critical|shock|electric|bite|blood|squish|splat|wet|death|dead|fatal|eliminat|impact|hit|crush|fall|stumble|brace|dodge|swarm|shiver|scream|terror|surpris/.test(type)) return false;
    const intensity = clamp(finite(event.intensity, .7));
    if (intensity < .12) return false;
    const position = event.position || [0, 0, 0];
    const x = finite(position[0], finite(position.x));
    const z = finite(position[2], finite(position.z));
    const pan = clamp(x / 8, -.72, .72);
    const distance = .72 + .28 * clamp((z + 6) / 12);
    const time = context.currentTime;
    const pressure = clamp(finite(event.progress, progress));
    const early = pressure < .45;
    const critical = health.stage === 'critical' || health.stage === 'dead' || (health.ratio !== null && health.ratio <= .25);
    const wounded = critical || health.stage === 'wounded' || (health.ratio !== null && health.ratio <= .55);
    const fatal = /^(?:death|dead|fatal|eliminated|elimination)$/.test(type) && (pressure >= .9 || phase === 'reveal');
    const contact = `${type}:${kind}`;
    const wet = /bite|blood|squish|splat|wet|water/.test(contact);
    const physical = /bite|blood|squish|splat|wet|electric-strike|body-impact|death|dead|crush|fall|impact/.test(type)
      || (type === 'hit' && (!kind || /impact|crush|laser|electric|bite|water/.test(kind)));
    let started = false;
    if (physical) {
      rememberRequest(impactRequests, actorId, time);
      recentImpactStarts = recentImpactStarts.filter(value => time - value < 5);
      const previousImpact = impactTimes.get(actorId);
      const strength = (.27 + intensity * .43 + (early ? 0 : .15)) * distance;
      if (wet && previousImpact?.flavor === 'body' && time - previousImpact.time < .09) {
        // Health's generic hit can precede the native bite in the same frame.
        // Add just one quiet wet follow-through to that same contact.
        noiseHit(610, .105, .026 * strength, { pan, q: .45, endFrequency: 240, reaction: true });
        previousImpact.flavor = 'wet';
        const recorded = impactHistory.findLast(entry => entry.actorId === actorId && entry.time === previousImpact.time);
        if (recorded) { recorded.flavor = 'wet'; recorded.followThrough = true; }
        voiceStats.impactLayers++;
        started = true;
      } else if (time - lastImpactTime >= .18 && time - (previousImpact?.time ?? -Infinity) >= .85
        && recentImpactStarts.length < 14 && voices.size < 38 && fairTurn(actorId, impactRequests, impactTimes, time)) {
        reactionImpact(wet ? 'wet' : contact, pan, strength);
        lastImpactTime = time;
        impactTimes.set(actorId, { time, flavor: wet ? 'wet' : /electric|shock|laser/.test(contact) ? 'electric' : 'body' });
        if (impactTimes.size > 8) impactTimes.delete(impactTimes.keys().next().value);
        recentImpactStarts.push(time);
        impactHistory.push({ actorId, type, kind, flavor: impactTimes.get(actorId).flavor, pan, strength, time });
        if (impactHistory.length > 16) impactHistory.shift();
        voiceStats.impacts++;
        started = true;
      }
    }
    // Wet particle emissions can be frequent. Only their physical hit sounds,
    // not another scream, are accepted; an associated bite/death supplies voice.
    if (/^(?:blood|splat|squish|wet-impact)$/.test(type)) return started;
    if (actorId === 'room') return started;
    const acute = /scream|electric|crush|laser|bite|impact|death|dead|fatal|eliminat/.test(contact)
      || (type === 'hit' && physical && kind !== 'water');
    const severe = fatal || (!early && pressure >= .62 && critical && acute && intensity >= .35);
    const emotional = /fear|panic|cry|sad|terror/.test(type);
    const cry = !early && critical && (emotional || !acute);
    const category = severe ? 'scream' : cry ? 'cry'
      : (/pain|hurt|heat|bite|hit|impact|shock|swarm|injury|wound|critical/.test(type) || (!early && wounded)) ? 'pain' : 'gasp';
    rememberRequest(reactionRequests, actorId, time);
    const previous = reactionTimes.get(actorId);
    recentHumanStarts = recentHumanStarts.filter(value => time - value < 10);
    const actorWait = previous ? time - previous.time < (previous.category === 'cry' ? 3.1 : 2.2) : false;
    const canEscalate = severe && previous && previous.category !== 'scream' && time - previous.time > 1.15;
    if ((actorWait && !canEscalate) || time - lastHumanTime < (severe ? .58 : .86) || humanVoices.size >= 2 || recentHumanStarts.length >= 7 || voices.size >= 40
      || (!severe && !fairTurn(actorId, reactionRequests, reactionTimes, time))) {
      voiceStats.suppressed++; return started;
    }
    const profile = actorVoice(actorId, event.voice || event.gender);
    const matching = [...humanSamples.values()].filter(sample => sample.category === category);
    let sample = matching.find(candidate => candidate.gender === profile.gender) || matching[0];
    // A healthy student's effort must never reuse the male scream just because
    // that is the only lower-register pain asset in the six-file collection.
    if (category === 'pain' && profile.gender === 'male') sample = humanSamples.get('male-gasp') || sample;
    if (!sample) { voiceStats.suppressed++; return started; }
    const rate = category === 'cry' && profile.gender === 'male' ? clamp(profile.rate * .96, .9, 1.02) : profile.rate;
    const duration = Math.min(sample.buffer.duration / rate, early ? .86 : category === 'cry' ? 1.85 : severe ? 1.65 : 1);
    let replacedPrevious = false;
    if (canEscalate) {
      for (const voice of humanVoices) {
        if (voice.actorId !== actorId) continue;
        voice.amp.gain.cancelScheduledValues(time);
        voice.amp.gain.setTargetAtTime(0, time, .006);
        try { voice.source.stop(time + .025); } catch { releaseVoice(voice); }
        replacedPrevious = true;
      }
    }
    const start = time + (replacedPrevious ? .032 : .006);
    const source = context.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = rate;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = profile.gender === 'male' ? 4700 + profile.shade * 220 : 5500 + profile.shade * 180;
    const amp = context.createGain();
    const level = (early ? .40 + intensity * .12 : .50 + intensity * .17) * distance * (1 - .18 * clamp(musicLevel / .25)) * (category === 'cry' ? .8 : 1);
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(level, start + .018);
    amp.gain.setValueAtTime(level, start + Math.max(.025, duration - .09));
    amp.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(filter); filter.connect(amp);
    const panner = connectPosition(amp, pan);
    source.start(start);
    const voice = registerVoice(source, panner ? [source, filter, amp, panner] : [source, filter, amp], start + duration, { human: true, amp, actorId });
    humanVoices.add(voice);
    reactionTimes.set(actorId, { time, category });
    if (reactionTimes.size > 16) reactionTimes.delete(reactionTimes.keys().next().value);
    lastHumanTime = time;
    recentHumanStarts.push(time);
    voiceStats.started++;
    voiceStats.maxConcurrent = Math.max(voiceStats.maxConcurrent, humanVoices.size);
    voiceHistory.push({ actorId, type, kind, stage: health.stage, ratio: health.ratio, pressure, early,
      sampleId: sample.id, category, rate, pan, gain: level, replacedPrevious, time });
    if (voiceHistory.length > 12) voiceHistory.shift();
    return true;
  }
  function envelope(gain, time, duration, level, attack = .018) {
    const peak = time + Math.min(attack, duration * .3);
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(level, peak);
    gain.exponentialRampToValueAtTime(.0001, time + duration);
    gain.setValueAtTime(0, time + duration + .01);
  }
  function tone(frequency, endFrequency, duration, level, options = {}) {
    if (!graph || !context || voices.size >= 42) return;
    const start = context.currentTime + .012 + (options.delay || 0);
    const oscillator = context.createOscillator();
    const amp = context.createGain();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope(amp.gain, start, duration, level, options.attack || .018);
    oscillator.connect(amp);
    const panner = connectPosition(amp, options.pan || 0);
    if (panner && Number.isFinite(options.endPan)) panner.pan.linearRampToValueAtTime(clamp(options.endPan, -.75, .75), start + duration);
    oscillator.start(start);
    const voice = registerVoice(oscillator, panner ? [oscillator, amp, panner] : [oscillator, amp], start + duration, { amp });
    if (options.reaction) reactionEffects.add(voice);
  }
  function noiseHit(frequency, duration, level, options = {}) {
    if (!graph || !context || voices.size >= 42) return;
    const start = context.currentTime + .012 + (options.delay || 0);
    const source = context.createBufferSource();
    source.buffer = options.brown ? graph.brown : graph.white;
    const filter = context.createBiquadFilter();
    filter.type = options.type || 'bandpass';
    filter.frequency.setValueAtTime(frequency, start);
    if (options.endFrequency) filter.frequency.exponentialRampToValueAtTime(options.endFrequency, start + duration);
    filter.Q.value = options.q || .7;
    const amp = context.createGain();
    envelope(amp.gain, start, duration, level, options.attack || .016);
    source.connect(filter);
    filter.connect(amp);
    const panner = connectPosition(amp, options.pan || 0);
    source.start(start, random() * 3);
    const voice = registerVoice(source, panner ? [source, filter, amp, panner] : [source, filter, amp], start + duration, { amp });
    if (options.reaction) reactionEffects.add(voice);
  }
  function accent(intensity, climax = false) {
    const strength = .5 + intensity * .5;
    const pan = (random() - .5) * 1.1;
    const level = climax ? 1.05 : .72 * (1 - .23 * clamp(musicLevel / .25));
    const a = strength * level;
    switch (scenarioId) {
      case 'crushing':
        noiseHit(360, .43, .095 * a, { brown: true, type: 'lowpass', pan });
        tone(88, 45, .32, .060 * a, { type: 'triangle', pan });
        noiseHit(1450, .11, .020 * a, { delay: .075, pan: -pan });
        break;
      case 'boiler':
        noiseHit(900 + intensity * 1400, .65, .075 * a, { endFrequency: 850, attack: .11, pan });
        tone(147, 105, .29, .025 * a, { type: 'triangle', delay: .04 });
        break;
      case 'flood':
        noiseHit(440, .55, .085 * a, { q: .4, endFrequency: 850, pan });
        tone(220 + random() * 160, 90 + random() * 40, .16, .030 * a, { delay: .08, pan: -pan });
        tone(350, 125, .19, .018 * a, { delay: .19, pan });
        break;
      case 'gas':
        noiseHit(2300, .9, .058 * a, { q: .45, endFrequency: 1200, attack: .18, pan });
        tone(156, 143, .20, .019 * a, { type: 'triangle', pan });
        break;
      case 'rats':
        for (let i = 0; i < 3; i++) {
          noiseHit(550 + random() * 1100, .065 + random() * .05, .027 * a, { delay: i * .073, pan: clamp(pan + i * .12, -.7, .7), q: .5 });
        }
        if (random() > .68 || climax) tone(1250, 820, .11, .008 * a, { delay: .045, pan, attack: .03 });
        break;
      case 'collapse':
        noiseHit(250, .85, .16 * a, { brown: true, type: 'lowpass', endFrequency: 95, pan });
        tone(71, 34, .51, .065 * a, { pan });
        noiseHit(710, .27, .033 * a, { delay: .16, pan: -pan });
        break;
      case 'electric':
        noiseHit(1950, .10, .042 * a, { q: .8, pan });
        tone(180 + random() * 80, 73, .16, .025 * a, { type: 'triangle', pan });
        noiseHit(2900, .06, .025 * a, { delay: .12, pan: -pan });
        break;
      case 'freeze':
        tone(1175, 1168, .8, .017 * a, { attack: .045, pan });
        tone(1760, 1750, .65, .009 * a, { delay: .11, pan: -pan });
        noiseHit(850, .7, .024 * a, { attack: .18, pan });
        break;
      case 'spikes':
        noiseHit(610, .16, .075 * a, { pan });
        tone(288, 238, .27, .040 * a, { type: 'triangle', pan });
        tone(720, 665, .3, .012 * a, { delay: .03, pan: -pan });
        break;
      case 'lasers':
        tone(280 + intensity * 150, 690 + intensity * 500, .34, .034 * a, { attack: .055, pan: -.55, endPan: .55 });
        tone(830, 410, .23, .018 * a, { delay: .15, pan: .45, endPan: -.45 });
        break;
    }
  }

  function playCue(name) {
    if (!context || context.state !== 'running' || !graph || muted || disposed) return;
    const now = context.currentTime;
    if (now - (cueTimes.get(name) ?? -Infinity) < (name === 'tick' ? .12 : .3)) return;
    cueTimes.set(name, now);
    if (name === 'start') {
      resetReactions();
      [147, 196, 247].forEach((note, i) => tone(note, note, .55, .042, { delay: i * .075, attack: .035, pan: (i - 1) * .18 }));
      noiseHit(280, .45, .08, { brown: true, type: 'lowpass', attack: .055 });
      nextAccent = now + .65;
    } else if (name === 'tick') {
      tone(660, 560, .085, .027, { attack: .008 });
    } else if (name === 'reveal') {
      accent(1, true);
      tone(98, 49, .95, .075, { attack: .045 });
      tone(294, 196, .65, .022, { delay: .07, attack: .055, pan: -.18 });
      nextAccent = now + 2;
    } else if (name === 'win') {
      [196, 261.63, 329.63, 392].forEach((note, i) => tone(note, note, 1.65, .033, { delay: i * .115, attack: .09, pan: (i - 1.5) * .17 }));
      tone(783.99, 783.99, 1.1, .012, { delay: .5, attack: .07 });
      nextAccent = now + 3;
    }
  }

  async function unlock() {
    if (disposed) return false;
    try {
      if (!context) {
        const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContextClass) return false;
        context = new AudioContextClass({ latencyHint: 'interactive' });
        try {
          buildGraph();
        } catch (error) {
          for (const node of permanent) {
            try { node.stop?.(); } catch { /* Partially created source. */ }
            try { node.disconnect(); } catch { /* Partially created graph. */ }
          }
          permanent.clear();
          paramTargets.clear();
          graph = null;
          try { Promise.resolve(context.close()).catch(() => {}); } catch { /* Device unavailable. */ }
          context = null;
          throw error;
        }
      }
      if (context.state === 'closed') return false;
      if (context.state !== 'running') await context.resume();
      if (disposed || context.state !== 'running') return false;
      if (voiceLoadState === 'idle') voiceReady = loadVoiceAssets();
      if (pendingCue && Date.now() - pendingCue.created < 1500) playCue(pendingCue.name);
      pendingCue = null;
      return true;
    } catch {
      // Audio is an enhancement: unavailable/denied devices never block play.
      return false;
    }
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (context && graph && context.state !== 'closed' && !disposed) {
      target(graph.master.gain, muted ? 0 : MASTER_LEVEL, .055);
    }
    if (muted) { pendingCue = null; stopHumanVoices(); }
  }

  // Pass music.status.level each frame. Only the continuous bed and incidental
  // accents duck; countdown, reveal, and winner cues retain clear articulation.
  function setMusicLevel(value) {
    musicLevel = clamp(finite(Number(value)));
  }

  function update(dt, state = {}) {
    if (disposed) return;
    const step = clamp(finite(dt), 0, .1);
    if (state.phase && state.phase !== phase) {
      phase = state.phase;
      phaseAge = 0;
      if (phase === 'paused' || phase === 'preview' || phase === 'complete') stopHumanVoices();
    } else phaseAge += step;
    if (Object.hasOwn(PROFILES, state.scenarioId) && state.scenarioId !== scenarioId) {
      scenarioId = state.scenarioId;
      if (context) nextAccent = context.currentTime + .55;
    }
    progress = clamp(finite(state.progress, progress));
    elapsed = finite(state.elapsed, elapsed + step);
    if (Number.isFinite(state.musicLevel)) setMusicLevel(state.musicLevel);
    if (!context || !graph || context.state !== 'running') return;
    const now = context.currentTime;
    // ~25 control updates/sec are enough for smoothed audio parameters.
    if (now - lastUpdate < .035) return;
    lastUpdate = now;
    const p = PROFILES[scenarioId];
    const pressure = progress * progress * (3 - 2 * progress);
    const phaseLevel = phase === 'running' ? 1
      : phase === 'reveal' ? .66 * Math.exp(-phaseAge * 1.55) + .035
      : phase === 'preview' ? .16
      : phase === 'paused' ? .065 : .025;
    const energy = phaseLevel * (.34 + pressure * .66) * (1 - .55 * clamp(musicLevel / .25)) * (humanVoices.size ? .72 : 1);
    const breath = .92 + .08 * Math.sin(elapsed * .71);
    const rise = 1 + pressure * .12;
    target(graph.drone.gain, .050 * energy * breath, .25);
    target(graph.droneA.frequency, p.base * (1 + pressure * .025), .4);
    target(graph.droneB.frequency, p.base * 2.004 * (1 + pressure * .025), .4);
    target(graph.rumble.gain, p.rumble * energy, .28);
    target(graph.rumbleFilter.frequency, p.cutoff * (1 + pressure * .65), .3);
    target(graph.noise.gain, p.noise * energy * breath, .25);
    target(graph.noiseFilter.frequency, p.band * (1 + pressure * .42 + .04 * Math.sin(elapsed * .8)), .28);
    target(graph.noiseFilter.Q, p.q, .3);
    target(graph.air.gain, p.air * energy, .3);
    target(graph.machine.gain, p.machine * energy, .23);
    target(graph.machineA.frequency, p.hz * rise, .3);
    target(graph.machineB.frequency, p.hz * 1.007 * rise, .3);
    target(graph.machineFilter.frequency, p.lowpass * (1 + pressure * .9), .3);
    target(graph.shimmer.gain, p.shimmer * energy * (.7 + pressure * .3), .3);
    target(graph.shimmerTone.frequency, p.note * (1 + .003 * Math.sin(elapsed * 1.3)), .3);
    const pulse = Math.pow(.5 + .5 * Math.sin(TAU * elapsed * p.rate * (1 + pressure * 1.6)), 5);
    target(graph.pulse.gain, p.pulse * energy * pulse, .045);
    target(graph.pulseTone.frequency, p.base * 1.5, .25);
    if (phase === 'running' && !muted && now >= nextAccent) {
      accent(pressure);
      nextAccent = now + p.interval * (1.4 - pressure * .69) * (.86 + random() * .28);
    }
  }

  function cue(name) {
    if (disposed || muted || !['start', 'tick', 'reveal', 'win'].includes(name)) return;
    if (!context || context.state !== 'running') {
      pendingCue = { name, created: Date.now() };
      return;
    }
    playCue(name);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    pendingCue = null;
    voiceController?.abort();
    voiceController = null;
    if (voiceTimer !== null) clearTimeout(voiceTimer);
    voiceTimer = null;
    voiceLoadState = 'disposed';
    for (const voice of [...voices]) {
      try { voice.source.stop(); } catch { /* Source may already have ended. */ }
      releaseVoice(voice);
    }
    for (const node of permanent) {
      if (typeof node.stop === 'function') {
        try { node.stop(); } catch { /* Source may already have ended. */ }
      }
      try { node.disconnect(); } catch { /* Context may already be closed. */ }
    }
    permanent.clear();
    paramTargets.clear();
    cueTimes.clear();
    humanVoices.clear();
    reactionEffects.clear();
    humanSamples.clear();
    actorVoices.clear();
    reactionTimes.clear();
    impactTimes.clear();
    actorHealth.clear();
    reactionRequests.clear();
    impactRequests.clear();
    recentHumanStarts = [];
    recentImpactStarts = [];
    if (context && context.state !== 'closed') {
      try { Promise.resolve(context.close()).catch(() => {}); } catch { /* Optional audio cleanup. */ }
    }
    graph = null;
  }

  return { unlock, setMuted, setMusicLevel, update, cue, react, resetReactions, dispose,
    get voiceReady() { return voiceReady; },
    get voiceStatus() { return { state: voiceLoadState, loaded: humanSamples.size, expected: voiceAssetCount,
      playing: humanVoices.size, activeImpactNodes: reactionEffects.size, errors: [...voiceErrors], ...voiceStats,
      samples: [...humanSamples.values()].map(sample => ({ id: sample.id, category: sample.category, gender: sample.gender, duration: sample.buffer.duration })),
      history: voiceHistory.map(entry => ({ ...entry })), impactHistory: impactHistory.map(entry => ({ ...entry })),
      health: [...actorHealth].map(([actorId, health]) => ({ actorId, ...health })), requestedActors: [...reactionRequests.keys()] }; } };
}
