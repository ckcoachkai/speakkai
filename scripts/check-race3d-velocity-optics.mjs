import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { createVelocityEffects } from '../public/games/games/race3d-velocity-fx.js';

const camera = new THREE.PerspectiveCamera(62, 16 / 9, .08, 1000);
const fx = createVelocityEffects(THREE, { camera });
camera.add(fx.group);
const car = { speed: 43, draft: 0, boost: 0, nitro: { remaining: 0 }, nitroAcceleration: 0, rocketAcceleration: 0 };
const run = (seconds, quality = 'high') => {
  for (let i = 0; i < seconds * 60; i++) fx.update(1 / 60, { car, active: true, quality });
};
run(2);
const base = fx.snapshot().intensity;
car.draft = .2; run(2);
const draft = fx.snapshot().intensity;
assert.ok(draft > base + .2, 'ordinary partial draft creates visible intensity');
assert.equal(fx.snapshot().source, 'slipstream');
car.draft = 0; car.boost = 3; car.nitroAcceleration = 3; run(2);
assert.ok(fx.snapshot().intensity > draft + .2, 'boost creates a stronger cue');
assert.equal(fx.snapshot().source, 'nitro');
assert.equal(fx.snapshot().ribbonCount, 96);
assert.equal(fx.snapshot().hoopCount, 3);
run(1, 'low');
assert.equal(fx.snapshot().ribbonCount, 40);
assert.equal(fx.snapshot().hoopCount, 1);
assert.equal(fx.snapshot().drawCalls, 2);
const originalCar = JSON.stringify(car);
for (const aspect of [16 / 9, 9 / 16, 1]) {
  camera.aspect = aspect;
  run(1);
  for (const mesh of fx.group.children) {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < mesh.geometry.drawRange.count; i++) {
      const z = -p.getZ(i), hy = Math.tan(camera.fov * Math.PI / 360), hx = hy * aspect;
      assert.ok(Number.isFinite(z) && z > 0);
      assert.ok(Math.hypot(p.getX(i) / (z * hx), p.getY(i) / (z * hy)) >= .759,
        'overlay remains outside the center at every aspect');
    }
  }
}
assert.equal(JSON.stringify(car), originalCar, 'cosmetics never mutate simulation');
car.itemEffects = { emp: 1 }; run(1);
assert.notEqual(fx.snapshot().source, 'nitro', 'EMP suppresses powered cue');
car.itemEffects.emp = 0; car.flightRemaining = 1; run(1);
assert.notEqual(fx.snapshot().source, 'nitro', 'airborne nitro has no traction cue');
car.flightRemaining = 0; car.nitroAcceleration = 0; car.spin = 1; run(1);
assert.notEqual(fx.snapshot().source, 'nitro', 'spinning without thrust suppresses nitro cue');
car.spin = 0; run(1);
assert.notEqual(fx.snapshot().source, 'nitro', 'timer alone does not imply nitro thrust');
car.flightRemaining = 1; car.rocketRemaining = 1; car.rocketAcceleration = 4; run(1);
assert.equal(fx.snapshot().source, 'nitro', 'rocket still works in flight');
car.rocketAcceleration = 0; run(1);
assert.notEqual(fx.snapshot().source, 'nitro', 'rocket timer alone does not imply thrust');
fx.update(1 / 60, { car, active: false });
assert.equal(fx.snapshot().active, false);
assert.equal(fx.snapshot().intensity, 0);
const reduced = createVelocityEffects(THREE, { camera, reducedMotion: true });
reduced.update(1 / 60, { car, active: true });
assert.equal(reduced.snapshot().active, false);
reduced.dispose();
let disposals = 0;
for (const mesh of fx.group.children) {
  mesh.geometry.addEventListener('dispose', () => disposals++);
  mesh.material.addEventListener('dispose', () => disposals++);
}
fx.dispose(); fx.dispose();
assert.equal(disposals, 4);
assert.equal(camera.children.length, 0);
console.log(JSON.stringify({ passed: true, base, draft, checks: ['partial draft', 'boost distinction', 'quality budgets', 'portrait and landscape center clearance', 'simulation immutability', 'EMP and flight', 'inactive', 'reduced motion', 'disposal'], limitation: 'No rendered browser or GPU/FPS measurement.' }, null, 2));
