import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { createNitroExhaust } from '../public/games/games/race3d-nitro-exhaust.js';
import { getExhaustMounts } from '../public/games/games/race3d-exhaust-mounts.js';
import { RACER_FORM_TYPES } from '../public/games/games/race3d-racer-forms.js';
import { RACE_VEHICLE_PROFILES } from '../public/games/games/race3d-vehicle-specs.js';

const track = { sampleTrack: () => ({ position: { x: 10, y: 2, z: 20 }, tangent: { x: 0, y: 0, z: 1 }, right: { x: 1, y: 0, z: 0 }, bank: 0 }) };
const car = { id: 7, distance: 0, lateral: 0, nitroAcceleration: 4 };
assert.equal(getExhaustMounts(car).length, 2);
const fx = createNitroExhaust(THREE);
const mesh = fx.group.children[0];
assert.equal(mesh.isInstancedMesh, true);
let geometryDisposals = 0, materialDisposals = 0;
mesh.geometry.addEventListener('dispose', () => geometryDisposals++);
mesh.material.addEventListener('dispose', () => materialDisposals++);
const input = JSON.stringify(car);
fx.update([car], track, .016, { active: true, quality: 'high' });
let state = fx.snapshot();
assert.deepEqual([state.activeCars, state.nitroCars, state.rocketCars, state.instanceCount, state.drawCalls], [1, 1, 0, 2, 1]);
assert.equal(JSON.stringify(car), input);
assert.equal(state.quality, 'high');
assert.equal(state.anchors[0].type, 'nitro');
assert.equal(state.anchors[0].intensity, 1);
assert.ok(Math.abs(state.anchors[0].directionZ + 1) < 1e-9);
state.anchors[0].x = -999;
assert.notEqual(fx.snapshot().anchors[0].x, -999);
const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), quaternion = new THREE.Quaternion();
mesh.getMatrixAt(0, matrix); matrix.decompose(position, quaternion, scale);
const mount = getExhaustMounts(car)[0].position;
assert.ok(Math.abs(position.x - (10 + mount[0])) < 1e-5);
assert.ok(Math.abs(position.y - (2.035 + mount[1])) < 1e-5);
assert.ok(Math.abs(position.z - (20 + mount[2])) < 1e-5);

// The visual pose overrides the simulation location and rotates both mount and plume.
fx.update([car], track, .016, { active: true, visualPose: () => ({ lateral: 3, heading: Math.PI / 2, flightHeight: 5, distance: 0 }) });
state = fx.snapshot();
assert.ok(Math.abs(state.anchors[0].x - (13 + mount[2])) < 1e-5);
assert.ok(state.anchors[0].y > 7);
assert.ok(state.anchors[0].directionX < -.999);

// An exact chassis transform takes precedence over track-derived pose,
// including suspension offset, rotation and model scale.
const modelQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(.2, .6, -.15, 'YXZ'));
const modelMatrix = new THREE.Matrix4().compose(new THREE.Vector3(80, 9, -35), modelQ, new THREE.Vector3(1.2, 1.2, 1.2));
fx.update([car], track, .016, { active: true, visualPose: () => ({ exhaustMatrix: modelMatrix }) });
mesh.getMatrixAt(0, matrix); matrix.decompose(position, quaternion, scale);
const expectedMount = new THREE.Vector3(...mount).applyMatrix4(modelMatrix);
assert.ok(position.distanceTo(expectedMount) < 1e-5);
const expectedDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(modelQ);
assert.ok(new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).distanceTo(expectedDirection) < 1e-5);
state = fx.snapshot();
assert.ok(new THREE.Vector3(state.anchors[0].directionX, state.anchors[0].directionY, state.anchors[0].directionZ).distanceTo(expectedDirection) < 1e-5);
const malformed = modelMatrix.clone(); malformed.elements[0] = NaN;
fx.update([car], track, .016, { active: true, visualPose: () => ({ exhaustMatrix: malformed }) });
assert.ok(Math.abs(fx.snapshot().anchors[0].x - 10) < 1e-5);

// Force outputs, not timers, drive the visuals; EMP and the spin branch suppress them.
const show = value => { fx.update([value], track, .016, { active: true }); return fx.snapshot(); };
assert.equal(show({ ...car, nitroAcceleration: 0, spontaneousNitroAcceleration: 2 }).nitroCars, 1);
assert.equal(show({ ...car, nitroAcceleration: 0, rocketRemaining: 3 }).activeCars, 0);
assert.equal(show({ ...car, nitroAcceleration: 0, rocketAcceleration: 5, spin: 1 }).activeCars, 0);
assert.equal(show({ ...car, nitroAcceleration: 0, rocketAcceleration: 5, spin: 1, flightRemaining: 1 }).rocketCars, 1);
assert.equal(show({ ...car, nitroAcceleration: 0, rocketVectorThrust: 4, spin: 1 }).rocketCars, 1);
const rocketColor = new THREE.Color(); mesh.getColorAt(0, rocketColor);
assert.ok(rocketColor.r > rocketColor.b);
assert.equal(show({ ...car, racerType: 'f1-2026' }).instanceCount, 1);
assert.ok(show({ ...car, racerType: 'tesla-roadster' }).instanceCount > 0);
assert.equal(show({ ...car, racerType: 'falcon' }).instanceCount, 7);
for (const racerType of [...RACER_FORM_TYPES, ...Object.keys(RACE_VEHICLE_PROFILES)]) {
  const count = show({ ...car, racerType }).instanceCount;
  assert.ok(count > 0 && count <= 7, `${racerType}: ${count} outlets`);
}
assert.equal(show({ ...car, itemEffects: { emp: 1 } }).activeCars, 0);
assert.equal(show({ ...car, finished: true }).activeCars, 0);
assert.equal(show({ ...car, eliminated: true }).activeCars, 0);
assert.equal(show({ ...car, finishHidden: true }).activeCars, 0);
fx.update(Array.from({ length: 80 }, (_, id) => ({ ...car, id })), track, .016, { active: true });
assert.equal(fx.snapshot().instanceCount, 120);
assert.equal(fx.snapshot().activeCars, 60);
fx.update(Array.from({ length: 80 }, (_, id) => ({ ...car, id, racerType: 'falcon' })), track, .016, { active: true });
assert.equal(fx.snapshot().instanceCount, 420);
fx.update([car], track, .016, { active: false });
assert.equal(fx.snapshot().instanceCount, 0);
assert.deepEqual(fx.snapshot().anchors, []);
fx.dispose(); fx.dispose(); fx.update([car], track, .016, { active: true });
assert.equal(fx.snapshot().disposed, true);
assert.equal(geometryDisposals, 1); assert.equal(materialDisposals, 1);

const stable = createNitroExhaust(THREE, { reducedMotion: true });
stable.update([car], track, .01, { active: true });
const first = new THREE.Matrix4(); stable.group.children[0].getMatrixAt(0, first);
first.decompose(position, quaternion, scale);
assert.ok(Math.abs(scale.z - 1.5) < 1e-5 && Math.abs(scale.x - .18) < 1e-5, 'full nitro plume stays compact');
stable.update([car], track, .1, { active: true });
const second = new THREE.Matrix4(); stable.group.children[0].getMatrixAt(0, second);
assert.deepEqual(first.elements, second.elements);
assert.equal(stable.group.children[0].material.uniforms.uTime.value, 0);
stable.update([{ ...car, nitroAcceleration: 1 }], track, .01, { active: true });
stable.group.children[0].getMatrixAt(0, second); second.decompose(position, quaternion, scale);
assert.ok(scale.z >= 1.2 && scale.z < 1.5 && scale.x < .18, 'lower thrust produces a smaller plume');
stable.update([{ ...car, nitroAcceleration: 0, rocketAcceleration: 9 }], track, .01, { active: true });
stable.group.children[0].getMatrixAt(0, second); second.decompose(position, quaternion, scale);
assert.ok(Math.abs(scale.z - 2.5) < 1e-5 && Math.abs(scale.x - .25) < 1e-5, 'full rocket plume stays bounded');
stable.reset(); assert.equal(stable.snapshot().active, false); stable.dispose();
console.log('PASS: actual-force gating, bounded instances, visual pose, immutable snapshots, reduced motion and disposal with real Three.js');
