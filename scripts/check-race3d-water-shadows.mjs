import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { roadShadowFrame } from '../public/games/games/race3d-quality.js';
import { createRaceWater } from '../public/games/games/race3d-water.js';
for (const grade of [-.08, 0, .08]) for (const bank of [-.08, 0, .08]) {
  const tangent = new THREE.Vector3(0, grade, 1).normalize(), right = new THREE.Vector3(1, 0, 0);
  const across = right.clone().add(new THREE.Vector3(0, Math.tan(bank), 0));
  for (const heading of [-.4, 0, .4]) {
    const f = roadShadowFrame(THREE, { tangent, right, bank }, heading);
    assert.ok(Math.abs(f.normal.dot(tangent)) < 1e-10);
    assert.ok(Math.abs(f.normal.dot(across)) < 1e-10);
    assert.ok(new THREE.Vector3(0, 1, 0).applyQuaternion(f.rotation).distanceTo(f.normal) < 1e-10);
  }
}
const track = {waterBasins:[{x:10,z:20,y:3,radiusX:12,radiusZ:8}]};
for (const reducedMotion of [true, false]) {
  const water = createRaceWater(THREE, track, {reducedMotion});
  const mesh = water.group.children[0];
  assert.equal(mesh.position.y, 3); assert.equal(mesh.scale.x, 12);
  const normal = mesh.material.normalMap.image.data;
  for (let i=2;i<normal.length;i+=4) assert.ok(normal[i]>250, 'encoded normals point up');
  water.update(.1); assert.equal(water.snapshot().offset>0, !reducedMotion);
  water.setMode('night'); assert.equal(water.snapshot().timeOfDay,'night');
  let disposed=0; for(const r of [mesh.geometry,mesh.material,mesh.material.normalMap]) r.addEventListener('dispose',()=>disposed++);
  water.dispose(); water.dispose(); water.update(1);
  assert.equal(disposed,3); assert.equal(water.group.children.length,0);
}
console.log('PASS: shadows follow grade/bank at all headings; water normal encoding, static reduced motion, mode and disposal');
