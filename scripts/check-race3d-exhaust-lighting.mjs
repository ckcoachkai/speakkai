import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { createExhaustLighting } from '../public/games/games/race3d-exhaust-lighting.js';
import { getExhaustMounts } from '../public/games/games/race3d-exhaust-mounts.js';
import { createNitroExhaust } from '../public/games/games/race3d-nitro-exhaust.js';

const track = { sampleTrack: () => ({ position: new THREE.Vector3(10, 2, 20), tangent: new THREE.Vector3(0, 0, 1), right: new THREE.Vector3(1, 0, 0), bank: 0 }) };
const car = { id: 1, racerType: 'concept-asterion', lateral: 3, nitroAcceleration: 4 };
const options = { active: true, quality: 'high' };
const fx = createExhaustLighting(THREE, { sceneScale: .2 });
const tick = (cars, dt = .1, opts = options) => fx.update(cars, track, dt, opts);
const mount = getExhaustMounts(car);
assert.ok(mount.length);
tick([car]);
let state = fx.snapshot();
assert.equal(state.active, 1);
assert.equal(fx.group.children.length, 2);
assert.ok(fx.group.children.every(l => l.isPointLight && !l.castShadow));
const average = k => mount.reduce((s, m) => s + m.position[k], 0) / mount.length;
assert.ok(Math.abs(state.lights[0].position.x - (13 + average(0))) < 1e-8);
assert.ok(Math.abs(state.lights[0].position.y - (2.035 + average(1))) < 1e-8);
assert.ok(Math.abs(state.lights[0].position.z - (20 + average(2))) < 1e-8);
const plumes = createNitroExhaust(THREE);
const angled = {...car, trickAngle: .8, heading: .4, flightHeight: 3, airRoll: .2};
tick([angled]); plumes.update([angled], track, .1, options);
const plumeAnchor = plumes.snapshot().anchors[0], lampPosition = fx.snapshot().lights[0].position;
for (const axis of ['x', 'y', 'z']) assert.ok(Math.abs(plumeAnchor[axis] - lampPosition[axis]) < 1e-8, `plume and light ${axis}`);
const falcon = {...angled, racerType: 'falcon'};
assert.equal(getExhaustMounts(falcon).length, 7);
tick([falcon]); plumes.update([falcon], track, .1, options);
const falconAnchor = plumes.snapshot().anchors[0], falconLight = fx.snapshot().lights[0].position;
for (const axis of ['x', 'y', 'z']) assert.ok(Math.abs(falconAnchor[axis] - falconLight[axis]) < 1e-8, `seven-nozzle ${axis}`);
const matrix = new THREE.Matrix4().compose(new THREE.Vector3(90, 8, -20),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(.3, .7, -.2)), new THREE.Vector3(1, 1, 1));
const visualPose = () => ({exhaustMatrix: matrix});
tick([falcon], .1, {...options, visualPose});
plumes.update([falcon], track, .1, {...options, visualPose});
const expected = new THREE.Vector3(...getExhaustMounts(falcon).reduce((a, m) => a.map((v, i) => v + m.position[i] / 7), [0, 0, 0])).applyMatrix4(matrix);
const transformed = fx.snapshot().lights[0].position;
const renderedAnchor = plumes.snapshot().anchors[0];
for (const axis of ['x', 'y', 'z']) {
  assert.ok(Math.abs(expected[axis] - transformed[axis]) < 1e-8, `rendered matrix ${axis}`);
  assert.ok(Math.abs(renderedAnchor[axis] - transformed[axis]) < 1e-8, `rendered plume and light ${axis}`);
}
plumes.dispose();
const prior = state.lights[0].level;
tick([car]); assert.ok(fx.snapshot().lights[0].level > prior);
tick([{...car, nitroAcceleration: 0, boost: 1}]);
assert.ok(fx.snapshot().lights[0].level < state.lights[0].level + .3, 'timer does not hold light on');
for (let i = 0; i < 40; i++) tick([]);
assert.equal(fx.snapshot().active, 0);
tick([{...car, nitroAcceleration: 0, spontaneousNitroAcceleration: 2}]);
assert.equal(fx.snapshot().lights[0].type, 'nitro');
fx.reset();
tick([{...car, nitroAcceleration: 0, rocketAcceleration: 4, spin: 1}]);
assert.equal(fx.snapshot().active, 0);
tick([{...car, nitroAcceleration: 0, rocketVectorThrust: 3, spin: 1}]);
assert.equal(fx.snapshot().lights[0].type, 'rocket');
fx.reset();
tick([{...car, itemEffects: {emp: 1}}]); assert.equal(fx.snapshot().active, 0);
tick(Array.from({length: 60}, (_, i) => ({...car, id: i})), .1, {active: true, quality: 'low'});
assert.equal(fx.snapshot().active, 1);
tick(Array.from({length: 60}, (_, i) => ({...car, id: i}))); assert.equal(fx.snapshot().active, 2);
assert.ok(Math.abs(fx.snapshot().lights[0].distance - .64) < 1e-8);
assert.ok(fx.snapshot().lights[0].intensity <= 1.8, 'bounded gentle glow');
tick([car], .1, {active:false}); assert.equal(fx.snapshot().active, 0);
fx.dispose(); fx.dispose(); tick([car]); assert.equal(fx.snapshot().disposed, true);

const reduced = createExhaustLighting(THREE, {sceneScale: .2, reducedMotion: true});
let previous = 0;
for (let i = 0; i < 40; i++) {
  reduced.update([car], track, .1, options);
  const level = reduced.snapshot().lights[0].level;
  assert.ok(level >= previous, 'reduced-motion rise is monotonic');
  previous = level;
}
assert.ok(reduced.snapshot().lights[0].intensity <= .81);
for (let i = 0; i < 40; i++) {
  reduced.update([], track, .1, options);
  const level = reduced.snapshot().lights[0].level;
  assert.ok(level <= previous, 'reduced-motion fall is monotonic');
  previous = level;
}
reduced.dispose();
console.log('PASS: bounded lights, shared mount position, force gating, quality, smooth envelopes, reset and disposal');
