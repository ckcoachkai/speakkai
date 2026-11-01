import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import { createTrack } from '../public/games/games/race3d-track.js';
import { safeRampSites } from '../public/games/games/race3d-course-safety.js';
const track = createTrack(THREE), { totalLength: length } = track;
assert.equal(track.closed, false);
const first = track.sampleTrack(0), last = track.sampleTrack(length);
assert(first.position.y > last.position.y + 300);
let minGrade = Infinity, maxGrade = -Infinity, minClearance = Infinity, maxCurvature = 0;
for (let i = 0; i <= 3000; i++) {
  const frame = track.sampleTrack(length * i / 3000);
  assert(frame.position.toArray().every(Number.isFinite));
  assert(Math.abs(frame.tangent.length() - 1) < 1e-6);
  minGrade = Math.min(minGrade, -frame.tangent.y); maxGrade = Math.max(maxGrade, -frame.tangent.y);
  minClearance = Math.min(minClearance, frame.position.y - track.terrainHeight(frame.position.x, frame.position.z));
  for (const side of [-9, -4.5, 0, 4.5, 9]) {
    const p = frame.position.clone().addScaledVector(frame.right, side);
    const surfaceY = p.y + Math.tan(frame.bank) * side;
    assert(surfaceY > track.terrainHeight(p.x, p.z), `terrain intersects road at ${i} lateral ${side}`);
  }
  maxCurvature = Math.max(maxCurvature, Math.abs(frame.curvature));
}
assert(minGrade > .025 && maxGrade < .055, `grade ${minGrade}–${maxGrade}`);
assert(minClearance > 1, `terrain clearance ${minClearance}`);
assert(maxCurvature < .01, `turn curvature ${maxCurvature}`);
assert(track.sampleTrack(-100).position.distanceTo(first.position) > 99);
assert(track.sampleTrack(length + 70).position.distanceTo(last.position) > 69);
assert(track.sampleTrack(-1).position.distanceTo(track.sampleTrack(length - 1).position) > 100);
const asphalt = track.group.getObjectByName('continuous-asphalt-racing-surface');
const pos = asphalt.geometry.getAttribute('position');
const midpoint = index => new THREE.Vector3().fromBufferAttribute(pos,index).add(new THREE.Vector3().fromBufferAttribute(pos,index+1)).multiplyScalar(.5);
assert(midpoint(0).distanceTo(track.sampleTrack(-180).position) < .1);
assert(midpoint(pos.count - 2).distanceTo(track.sampleTrack(length + 80).position) < .1);
assert(track.group.getObjectByName('mountain-terrain'));
const sites = safeRampSites(track); assert(sites.length >= 5, `safe ramp sites: ${sites.length}`);
console.log(JSON.stringify({ length, startY:first.position.y, finishY:last.position.y, minGrade, maxGrade, minClearance, maxCurvature, rampSites:sites.length }, null, 2));
track.dispose();
