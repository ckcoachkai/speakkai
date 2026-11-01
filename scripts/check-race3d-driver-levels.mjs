import assert from 'node:assert/strict';
import { DRIVER_LEVELS, createDriverSkills, driverControls } from '../public/games/games/race3d-drivers.js';

function rng(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
assert(Object.isFrozen(DRIVER_LEVELS)); assert.equal(DRIVER_LEVELS.length, 9);
for (let i = 0; i < 9; i++) {
  const level = DRIVER_LEVELS[i]; assert(Object.isFrozen(level)); assert.equal(level.tier, i + 1);
  assert.match(level.label, /fictional race level/i);
  const selected = createDriverSkills(() => (i + .5) / 9);
  assert.equal(selected.tier, i + 1); assert(Object.isFrozen(selected));
  for (const axis of ['reaction', 'control', 'braking', 'ramp', 'items']) assert(selected[axis] >= .20 && selected[axis] <= .99);
  for (const field of ['speedFactor', 'accelerationFactor', 'durabilityFactor', 'gripFactor']) assert(selected[field] >= .88 && selected[field] <= 1.08);
  const control = driverControls(selected); assert(control.lineError >= 0 && control.lineError < 2.3); assert(control.rampError >= 0 && control.rampError < .85);
  if (i) { assert(level.skillCenter < DRIVER_LEVELS[i-1].skillCenter); assert(level.speedFactor <= DRIVER_LEVELS[i-1].speedFactor); }
}
assert(driverControls(createDriverSkills(() => .999)).lineError > 1.9);
const a = rng(314159), b = rng(314159), counts = Array(9).fill(0);
for (let i = 0; i < 9000; i++) { const one = createDriverSkills(a), two = createDriverSkills(b); assert.deepEqual(one, two); counts[one.tier - 1]++; }
assert(counts.every(n => n > 850 && n < 1150));
for (const bad of [NaN, Infinity, -Infinity, -7, 1, 50, undefined]) {
  const result = createDriverSkills(() => bad); assert(result.tier >= 1 && result.tier <= 9);
  for (const value of Object.values(driverControls(result))) assert(Number.isFinite(value));
}
assert.equal(createDriverSkills(() => { throw Error('bad rng'); }).tier, 5);
const equal = createDriverSkills(() => { throw Error('must not sample'); }, 'equal');
assert.equal(equal.tier, null); assert.equal(equal.label, 'Equal test driver');
for (const factor of ['speedFactor', 'accelerationFactor', 'durabilityFactor', 'gripFactor']) assert.equal(equal[factor], 1);
assert.deepEqual(driverControls(equal), { reactionSeconds: .62 - .45 * .75, steerResponse: 3.8 + 2.1 * .75, lineError: 0, brakeMargin: .82 + .17 * .75, lookAhead: .77 + .30 * .75, itemConfidence: .67 - .15 * .75, itemThink: .42 - .27 * .75, rampError: 0, mistakeInterval: 15 + 23 * .75, paceVariation: 0, paceInterval: 5 + 5 * .75 });
console.log(JSON.stringify({ counts, checks: ['nine frozen fictional levels', 'deterministic distribution', 'axis and multiplier bounds', 'invalid RNG', 'equal compatibility', 'line and ramp error bounds'] }, null, 2));
