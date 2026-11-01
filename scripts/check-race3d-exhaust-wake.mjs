import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../public/games/assets/vendor/three.module.js';
const source = await readFile(new URL('../public/games/games/race3d-exhaust-wake.js', import.meta.url), 'utf8');
const {createExhaustWake} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const anchors = Array.from({length: 20}, (_, i) => ({carId:i, type:i%2 ? 'nitro' : 'rocket', x:i,y:1,z:2, directionX:0,directionY:0,directionZ:-1,intensity:1}));
const wake = createExhaustWake(THREE);
const parent = new THREE.Group(); parent.add(wake.group);
let geometryDisposed = 0, materialDisposed = 0, meshDisposed = 0;
const mesh = wake.group.children[0];
mesh.addEventListener('dispose', () => meshDisposed++);
mesh.geometry.addEventListener('dispose', () => geometryDisposed++);
mesh.material.addEventListener('dispose', () => materialDisposed++);
for (let i=0; i<600; i++) {
  wake.update(anchors, 1/60, {active:true,quality:'high'});
  assert.ok(wake.snapshot().particleCount <= 160);
  assert.ok(mesh.count <= 160);
}
assert.ok(wake.snapshot().particleCount > 0);
assert.equal(wake.snapshot().drawCalls, 1);
assert.ok(mesh.instanceColor);
// With >16 anchors, the rotating scan must emit from beyond the first window.
const matrix = new THREE.Matrix4();
let sawHigherAnchor = false;
for (let i=0; i<mesh.count; i++) {
  mesh.getMatrixAt(i, matrix);
  if (matrix.elements[12] >= 16) sawHigherAnchor = true;
}
assert.ok(sawHigherAnchor, 'anchors beyond index 15 should emit');
// A sparse valid source must accumulate emission time across empty scan windows.
wake.reset();
const sparse = Array(64).fill(null);
sparse[63] = anchors[19];
let sawSparse = false;
for (let i=0; i<120; i++) {
  wake.update(sparse, 1/60, {active:true,quality:'high'});
  if (wake.snapshot().particleCount) sawSparse = true;
}
assert.ok(sawSparse, 'sparse source should eventually emit');
wake.update(anchors, 1/60, {active:true,quality:'low'});
assert.ok(wake.snapshot().particleCount <= 32);
wake.update([{x:NaN,y:0,z:0,directionX:0,directionY:0,directionZ:0}], 1, {active:true});
for (let i=0; i<30; i++) wake.update([], .05, {active:true});
assert.equal(wake.snapshot().particleCount, 0);
wake.update(anchors, .05, {active:true});
wake.update(anchors, .05, {active:false});
assert.equal(mesh.count, 0);
wake.dispose(); wake.dispose(); wake.update(anchors, .05, {active:true});
assert.equal(meshDisposed, 1); assert.equal(geometryDisposed, 1); assert.equal(materialDisposed, 1);
assert.equal(parent.children.length, 0); assert.equal(wake.snapshot().disposed, true);
const reduced = createExhaustWake(THREE, {reducedMotion:true});
reduced.update(anchors, .05, {active:true,quality:'high'});
assert.equal(reduced.snapshot().particleCount, 16);
const before = Array.from(reduced.group.children[0].instanceMatrix.array);
reduced.update(anchors, 100, {active:true,quality:'high'});
assert.deepEqual(Array.from(reduced.group.children[0].instanceMatrix.array), before);
reduced.reset(); assert.equal(reduced.snapshot().particleCount, 0); reduced.dispose();
console.log('real Three.js: bounded quality budgets, rotating source scan, invalid input, inactive reset, reduced-motion stability, and idempotent disposal passed');

