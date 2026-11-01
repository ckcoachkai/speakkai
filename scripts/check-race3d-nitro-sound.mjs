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
const focus = { id: 'focus', distance: 100, lateral: 0, speed: 12 };
const other = { id: 'other', distance: 160, lateral: 5, speed: 12 };
const event = id => ({ type: 'spontaneous-nitro-start', carId: id, duration: 1, intensity: 1 });
const audio = createRaceAudio(); audio.start(); await flush(); await flush();
const ctx = contexts.at(-1); audio.update([focus, other], 'focus', []);
let at = ctx.nodes.length;
audio.update([focus, other], 'focus', [event('other')]);
let added = ctx.nodes.slice(at);
assert.equal(audio.snapshot().nitroBurstsPlayed, 1);
assert.equal(added.find(n => n.kind === 'panner').pan.value, .5);
const remote = added.find(n => n.kind === 'gain' && n.gain.calls.some(c => c[0] === 'ramp')).gain.calls.find(c => c[0] === 'ramp')[1];
assert.ok(remote > 0 && remote < .02);
ctx.currentTime += .3; at = ctx.nodes.length;
audio.update([focus, other], 'focus', Array.from({ length: 9 }, () => event('other')).concat(event('focus')));
added = ctx.nodes.slice(at);
const own = added.find(n => n.kind === 'gain' && n.gain.calls.some(c => c[0] === 'ramp')).gain.calls.find(c => c[0] === 'ramp')[1];
assert.equal(own, .05); assert.equal(added.find(n => n.kind === 'panner').pan.value, 0);
assert.equal(audio.snapshot().nitroBurstsPlayed, 2); assert.equal(audio.snapshot().mergedNitroBursts, 9);
assert.ok(audio.snapshot().transientVoices <= 12);
ctx.currentTime += .3; audio.update([focus, { ...other, distance: 400 }], 'focus', [event('other')]);
audio.update([focus], 'focus', [event('missing')]); assert.equal(audio.snapshot().nitroBurstsPlayed, 2);
audio.setSound(false); assert.equal(audio.snapshot().transientVoices, 0);
audio.update([focus], 'focus', [event('focus')]); assert.equal(audio.snapshot().nitroBurstsPlayed, 2);
audio.setSound(true); audio.update([focus], 'focus', []); audio.update([focus], 'focus', [event('focus')]);
assert.equal(audio.snapshot().nitroBurstsPlayed, 3);
audio.finish('focus'); ctx.currentTime += .3; audio.update([focus], 'focus', [event('focus')]);
assert.equal(audio.snapshot().nitroBurstsPlayed, 4);
audio.reset(); assert.equal(audio.snapshot().transientVoices, 0); assert.equal(audio.snapshot().nitroBurstsPlayed, 0);
audio.destroy(); assert.equal(ctx.state, 'closed');
console.log('PASS: spatial attenuation/pan, focused priority, ten-start coalescing, voice cap, mute/resume, finish, reset, destroy');
