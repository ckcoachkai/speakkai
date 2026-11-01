import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { createChaseCamera } from '../public/games/games/race3d-camera.js';

const track = { width: 18, sampleTrack(d) { return {
  position: new THREE.Vector3(0, 5 + Math.max(0, d - 90) * .05, d),
  tangent: new THREE.Vector3(0, 0, 1), right: new THREE.Vector3(1, 0, 0), width: 18, bank: .02,
}; } };
const source = { id: 'focus', distance: 100, lateral: 0, speed: 50, maxSpeed: 50, heading: 0, draft: 0, nitroAcceleration: 0 };
const car = Object.create(source); // Mirrors carModels.visualPose's prototype linkage.
const make = (reducedMotion = false) => {
  const camera = new THREE.PerspectiveCamera(50, 1.6, .08, 1000);
  return { camera, rig: createChaseCamera({ THREE, camera, track, reducedMotion, timeScale: 1 }) };
};
const tick = (rig, car, seconds = 8, cars = [car]) => {
  for (let i = 0; i < seconds * 60; i++) rig.update(car, 1 / 60, cars);
};
const { camera, rig } = make();
tick(rig, car); const baseline = camera.fov;
source.draft = .25; tick(rig, car); const draft = camera.fov;
assert(draft - baseline > .9 && draft - baseline < 1.1);
source.nitroAcceleration = 2; const before = camera.fov;
rig.update(car, 1 / 60); assert(camera.fov > before && camera.fov - before < .2);
tick(rig, car); const powered = camera.fov;
assert(powered - draft > 4.9 && powered <= 67.01);
source.nitroAcceleration = 0; tick(rig, car); assert(Math.abs(camera.fov - draft) < .04);
source.rocketRemaining = 2; source.itemEffects = { emp: 1 }; tick(rig, car); assert(Math.abs(camera.fov - draft) < .04);
source.itemEffects.emp = 0; tick(rig, car); assert(camera.fov > draft + 4.9);
source.rocketRemaining = 0; source.nitroAcceleration = 2; source.flightRemaining = 1; tick(rig, car); assert(Math.abs(camera.fov - draft) < .04);
source.flightRemaining = 0;
rig.changeMode(1); tick(rig, car); assert.equal(rig.mode, 'first-person'); assert(camera.fov > 70 && camera.fov < 71.6); assert(rig.hideFocusedCar);
rig.changeMode(-1); tick(rig, car); assert.equal(rig.mode, 'chase'); assert(!rig.hideFocusedCar);
const cars = Array.from({ length: 8 }, (_, i) => ({ ...source, id: i === 0 ? 'focus' : `car${i}`, distance: 100 + i * 6, lateral: i % 2 ? 3 : -3 }));
cars.push({ ...source, id: 'far', distance: 500 });
rig.changeMode(-1); tick(rig, car, 8, cars); const view = rig.snapshot();
assert.equal(rig.mode, 'overhead'); assert(view.overview.ids.length >= 5); assert(!view.overview.ids.includes('far')); assert(view.overview.height >= 55 && view.overview.height <= 190); assert(Math.abs(camera.fov - 58) < .05);
car.flightHeight = 8; car.rampHeight = 2; tick(rig, car, 1, cars); assert.equal(rig.snapshot().supportHeight, 10); assert(camera.position.toArray().every(Number.isFinite));
rig.reset(); rig.update(car, 1 / 60, cars); assert(camera.position.toArray().every(Number.isFinite));
rig.dispose();
const quiet = make(true); source.draft = 0; source.nitroAcceleration = 0; source.speed = 5; delete car.flightHeight; delete car.rampHeight;
tick(quiet.rig, car); const quietFov = quiet.camera.fov; const quietPosition = quiet.camera.position.clone();
source.speed = 50; source.draft = 1; source.nitroAcceleration = 3; tick(quiet.rig, car);
assert.equal(quiet.camera.fov, quietFov); assert(quiet.camera.position.distanceTo(quietPosition) < 1e-8);
quiet.rig.changeMode(1); tick(quiet.rig, car); assert(Math.abs(quiet.camera.fov - 67) < .05);
quiet.rig.reset(); quiet.rig.update(car); assert(quiet.camera.position.toArray().every(Number.isFinite));
quiet.rig.dispose();
const priorMatchMedia = globalThis.matchMedia;
try {
  globalThis.matchMedia = query => ({ matches: query === '(prefers-reduced-motion: reduce)' });
  const defaultCamera = new THREE.PerspectiveCamera(50, 1.6, .08, 1000);
  const defaultRig = createChaseCamera({ THREE, camera: defaultCamera, track });
  tick(defaultRig, car); assert.equal(defaultCamera.fov, 52); defaultRig.dispose();
} finally {
  if (priorMatchMedia === undefined) delete globalThis.matchMedia;
  else globalThis.matchMedia = priorMatchMedia;
}
console.log(JSON.stringify({ baseline, draft, powered, checks: ['live inherited signals', 'smooth FOV rise and decay', 'EMP and flight suppression', 'chase and first-person', 'mode transitions', 'overview cluster and far limit', 'ramp and flight support', 'reset', 'reduced motion and media preference'] }, null, 2));
