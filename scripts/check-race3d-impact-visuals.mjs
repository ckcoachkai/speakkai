import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { createRaceEffects } from '../public/games/games/race3d-fx.js';

const media = globalThis.matchMedia;
const mesh = (fx, name) => fx.group.children.find(child => child.name === `race3d-${name}`);
const liveTransforms = (m) => {
  const alpha = m.geometry.getAttribute('aFxAlpha');
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
  const result = [];
  for (let i = 0; i < m.count; i++) {
    if (!alpha.array[i]) continue;
    m.getMatrixAt(i, matrix); matrix.decompose(position, quaternion, scale);
    result.push({ position: position.clone(), scale: scale.clone(), alpha: alpha.array[i] });
  }
  return result;
};
const advance = (fx, seconds) => { for (let t = 0; t < seconds - 1e-8; t += .05) fx.update(Math.min(.05, seconds - t)); };
const fx = createRaceEffects(THREE, { random: () => .42 });
fx.emit({ type: 'explosion', position: { x: 12, y: 2, z: -8 }, intensity: 1 }, { quality: { id: 'high' } });
advance(fx, .2);
const fire = liveTransforms(mesh(fx, 'fire'));
const rings = liveTransforms(mesh(fx, 'blast'));
assert.equal(fire.length, 8);
assert.equal(rings.length, 2);
assert.ok(Math.max(...fire.map(p => p.scale.x)) > 2.5, 'fireball lobes should be car-scale');
assert.ok(Math.max(...rings.map(p => p.scale.x)) > 3.5, 'shockwave should visibly expand');
assert.ok(new Set(fire.map(p => `${p.position.x.toFixed(2)},${p.position.z.toFixed(2)}`)).size > 5, 'lobes should spread even with constant random');
for (const name of ['debris', 'sparks', 'smoke']) assert.ok(liveTransforms(mesh(fx, name)).length, `${name} layer`);
const shard = liveTransforms(mesh(fx, 'debris'))[0];
assert.ok(Math.abs(shard.scale.y - shard.scale.x) < .001, 'shards retain their modeled thickness');
advance(fx, .6);
assert.equal(liveTransforms(mesh(fx, 'fire')).length, 0, 'fire clears promptly');
assert.ok(liveTransforms(mesh(fx, 'smoke')).length > 0, 'smoke remains briefly after the fire');
advance(fx, 2);
assert.ok(Object.values(fx.snapshot().pools).every(pool => pool.active === 0), 'all particles expire');
let disposedResources = 0;
for (const child of fx.group.children) for (const resource of [child.geometry, child.material]) resource.addEventListener('dispose', () => disposedResources++);
const resourceCount = fx.group.children.length * 2;
fx.dispose(); fx.dispose();
assert.equal(disposedResources, resourceCount, 'every mesh resource disposed once');
fx.emit('explosion'); fx.update(.05);
assert.equal(fx.group.children.length, 0);

for (const [quality, reduced, expected] of [['low', false, [5, 1, 8, 5]], [{ id: 'high' }, true, [2, 1, 4, 3]]]) {
  globalThis.matchMedia = () => ({ matches: reduced });
  const variant = createRaceEffects(THREE, { random: () => .42 });
  variant.emit({ type: 'explosion', position: { x: 0, y: 0, z: 0 } }, { quality });
  assert.deepEqual(['fire', 'blast', 'debris', 'smoke'].map(name => variant.snapshot().pools[name].active), expected);
  for (let i = 0; i < 100; i++) variant.emit({ type: 'explosion', position: { x: i, y: 0, z: 0 } }, { quality });
  assert.ok(Object.values(variant.snapshot().pools).every(pool => pool.active <= pool.capacity));
  variant.reset();
  assert.ok(Object.values(variant.snapshot().pools).every(pool => pool.active === 0));
  variant.dispose();
}
if (media === undefined) delete globalThis.matchMedia; else globalThis.matchMedia = media;
console.log(JSON.stringify({ geometry: 'car-scale and spread', phases: 'fire clears before smoke', quality: 'low and reduced motion', pools: 'bounded', lifecycle: 'reset and dispose' }));
