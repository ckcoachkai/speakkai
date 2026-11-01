import assert from 'node:assert/strict';
import { createRaceAudio } from '../public/games/games/race3d-audio.js';
import { audioControls, newAudioState } from '../public/games/games/race3d-audio-controls.js';

class Param {
  constructor() { this.value = 0; this.calls = []; }
  setValueAtTime(v, t) { this.value = v; this.calls.push(['set', v, t]); }
  exponentialRampToValueAtTime(v, t) { this.value = v; this.calls.push(['ramp', v, t]); }
  setTargetAtTime(v, t, c) { this.value = v; this.calls.push(['target', v, t, c]); }
}
class Node {
  constructor(kind) { this.kind = kind; this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); this.pan = new Param(); this.playbackRate = new Param(); this.started = false; this.stopped = false; }
  connect(node) { return node; }
  disconnect() { this.disconnected = true; }
  start(time) { this.started = true; this.startTime = time; }
  stop(time) { this.stopped = true; this.stopTime = time; }
  setPeriodicWave() {}
}
const contexts = [];
class AudioContextMock {
  constructor() { this.currentTime = 1; this.sampleRate = 1000; this.state = 'running'; this.destination = new Node('destination'); this.nodes = []; contexts.push(this); }
  node(kind) { const node = new Node(kind); this.nodes.push(node); return node; }
  createGain() { return this.node('gain'); }
  createOscillator() { return this.node('oscillator'); }
  createBufferSource() { return this.node('buffer'); }
  createBiquadFilter() { return this.node('filter'); }
  createStereoPanner() { return this.node('panner'); }
  createWaveShaper() { return this.node('shaper'); }
  createDynamicsCompressor() { const n = this.node('compressor'); for (const k of ['threshold','knee','ratio','attack','release']) n[k] = new Param(); return n; }
  createBuffer(channels, length) { return { duration: length / this.sampleRate, getChannelData: () => new Float32Array(length) }; }
  createPeriodicWave() { return {}; }
  async decodeAudioData(id) { return { id, duration: 1.2 }; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}
globalThis.AudioContext = AudioContextMock;
let sampleFailure = false;
globalThis.fetch = async url => {
  if (sampleFailure) throw new Error('offline');
  return { ok: true, arrayBuffer: async () => url };
};
const flush = () => new Promise(resolve => setImmediate(resolve));
const car = { id: 'focus', distance: 100, lateral: 0, speed: 12 };
const burst = (type, time, distance = 100, lateral = 5) => ({ type, carId: 'focus', time, distance, lateral, intensity: 1 });
const rocketGain = fields => audioControls({ ...car, ...fields }, newAudioState()).rocketGain;
assert.equal(rocketGain({ rocketRemaining: 2 }), 0, 'rocket timer alone is silent');
assert.equal(rocketGain({ rocketRemaining: 2, rocketAcceleration: 3 }), .1);
assert.equal(rocketGain({ rocketRemaining: 2, rocketAcceleration: 3, itemEffects: { emp: 1 } }), 0);
assert.equal(rocketGain({ rocketRemaining: 2, rocketAcceleration: 3, spin: 1 }), 0);
assert.equal(rocketGain({ rocketRemaining: 2, rocketVectorThrust: 2, spin: 1 }), .1);
const audio = createRaceAudio();
assert.equal(contexts.length, 0, 'construction must not create a context');
audio.update([car], 'focus', [burst('bot-explode', 1)]);
assert.equal(contexts.length, 0, 'update must not unlock audio');
audio.start();
await flush(); await flush();
const ctx = contexts.at(-1);
audio.update([car], 'focus', []); // first frame suppresses stale transients
let start = ctx.nodes.length;
audio.update([car], 'focus', [burst('bot-explode', 2)]);
let added = ctx.nodes.slice(start);
assert.equal(audio.snapshot().explosionBurstsPlayed, 1);
const firstLayers = added.filter(n => n.buffer?.id?.includes('explosion-'));
assert.deepEqual(firstLayers.map(n => n.buffer.id.match(/explosion-[^.]+/)[0]), ['explosion-attack', 'explosion-body', 'explosion-debris']);
assert.equal(added.find(n => n.kind === 'panner').pan.value, .5);
const nearGain = added.find(n => n.kind === 'gain' && n.gain.calls.some(c => c[0] === 'ramp')).gain.calls.find(c => c[0] === 'ramp')[1];
start = ctx.nodes.length;
audio.update([car], 'focus', [burst('bomb-explode', 3, 160)]);
added = ctx.nodes.slice(start);
const farGain = added.find(n => n.kind === 'gain' && n.gain.calls.some(c => c[0] === 'ramp')).gain.calls.find(c => c[0] === 'ramp')[1];
assert.ok(farGain < nearGain * .4, 'projectile location attenuates even when the focus owns it');
audio.update([car], 'focus', [burst('bomb-explode', 4, 300)]);
assert.equal(audio.snapshot().explosionBurstsPlayed, 2, 'inaudible distance is skipped');
audio.update([car], 'focus', [burst('bomb-explode', 5), burst('bot-explode', 6), burst('bomb-explode', 7)]);
assert.equal(audio.snapshot().activeExplosions, 3);
assert.equal(audio.snapshot().mergedExplosionBursts, 2);
for (const layer of firstLayers) layer.onended();
assert.equal(audio.snapshot().activeExplosions, 2, 'completed layers release their shared mixer slot');
audio.update([car], 'focus', [burst('bot-explode', 7.1)]);
assert.equal(audio.snapshot().activeExplosions, 3);
audio.reset();
assert.equal(audio.snapshot().activeExplosions, 0);
assert.equal(ctx.state, 'suspended');
audio.start(); audio.update([car], 'focus', []);
start = ctx.nodes.length;
audio.update([car], 'focus', [{ ...burst('bomb-hit', 20), projectileId: 123 }, { ...burst('bomb-explode', 20), projectileId: 123 }]);
assert.equal(ctx.nodes.slice(start).filter(n => n.kind === 'buffer').length, 3, 'bomb-hit must not replay the same projectile as an impact');
audio.reset(); audio.start(); audio.update([car], 'focus', []);
const distant = { id: 'other', distance: 105, lateral: 0, speed: 30, boost: 2, draft: 1 };
audio.update([{ ...car, nitro: { remaining: 1 }, nitroAcceleration: .01, draft: .7 }, distant], 'focus', []);
const [focus, other] = audio.snapshot().engines;
assert.ok(focus.nitroAudioGain >= .045, 'active nitro remains audible near traction-limited top speed');
assert.ok(focus.draftAudioGain > 0, 'focused draft adds airflow');
assert.equal(other.nitroAudioGain, undefined, 'other cars do not add focused thrust');
audio.update([{ ...car, spin: 1, nitro: { remaining: 1 }, nitroAcceleration: 0 }, distant], 'focus', []);
assert.equal(audio.snapshot().engines[0].nitroAudioGain, 0, 'an active timer without delivered thrust does not sustain nitro audio');
audio.update([car], 'focus', [burst('bot-explode', 8)]);
assert.equal(audio.snapshot().activeExplosions, 1);
audio.setSound(false);
assert.equal(audio.snapshot().activeExplosions, 0);
audio.update([car], 'focus', [burst('bot-explode', 9)]);
audio.setSound(true); audio.update([car], 'focus', []);
audio.update([car], 'focus', [burst('bot-explode', 10)]);
assert.equal(audio.snapshot().activeExplosions, 1);
audio.destroy();
assert.equal(ctx.state, 'closed');
assert.equal(audio.snapshot().activeExplosions, 0);

sampleFailure = true;
const fallback = createRaceAudio(); fallback.start(); await flush(); await flush();
const fallbackCtx = contexts.at(-1);
fallback.update([car], 'focus', []);
start = fallbackCtx.nodes.length;
fallback.update([car], 'focus', [burst('bot-explode', 11)]);
added = fallbackCtx.nodes.slice(start);
assert.equal(fallback.snapshot().explosionBurstsPlayed, 1);
assert.equal(added.filter(n => n.kind === 'buffer').length, 2);
assert.equal(added.filter(n => n.kind === 'oscillator').length, 1);
fallback.destroy();
// A winner can celebrate before the last bot is eliminated. The final audio
// update must still arrange shutdown, and a later burst must extend the tail.
sampleFailure = false;
const realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
const timers = new Map(); let timerId = 0;
globalThis.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; };
globalThis.clearTimeout = id => timers.delete(id);
try {
  const finishAudio = createRaceAudio(); finishAudio.start(); await flush(); await flush();
  const finishCtx = contexts.at(-1);
  finishAudio.update([car], 'focus', []);
  finishAudio.finish('focus');
  finishAudio.update([{ ...car, finished: true }], 'focus', [burst('bot-explode', 30)]);
  assert.equal(timers.size, 1, 'last bot elimination schedules shutdown without a finish burst');
  const firstTimer = [...timers.keys()][0];
  assert.equal(timers.get(firstTimer).delay, 1450, 'explosion has time to decay');
  finishCtx.currentTime += .2;
  finishAudio.update([{ ...car, finished: true }], 'focus', [burst('finish-burst', 31)]);
  assert.equal(timers.size, 1);
  assert.ok(!timers.has(firstTimer), 'late celebration extends the shutdown timer');
  const timer = [...timers.values()][0]; timer.fn();
  assert.equal(finishCtx.state, 'suspended');
  assert.equal(finishAudio.snapshot().racing, false);
  finishAudio.destroy();
} finally { globalThis.setTimeout = realSetTimeout; globalThis.clearTimeout = realClearTimeout; }
console.log('PASS: sampled and procedural attack/body/debris; bot and bomb routing and duplicate suppression; spatial gain/pan; three-burst cap; focus nitro and draft; gesture, reset, mute/unmute and destroy');
