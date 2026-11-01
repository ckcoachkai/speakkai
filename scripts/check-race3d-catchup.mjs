import assert from 'node:assert/strict';
import { createCatchup } from '../public/games/games/race3d-catchup.js';

const car = (id, distance, extra = {}) => ({ id, distance, speed: 43, topSpeed: 43, ...extra });
const settle = (cars, options = {}) => {
  const system = createCatchup({ finishDistance: 5000, ...options });
  let result;
  for (let i = 0; i < 1200; i++) result = system.update(cars, 1 / 120);
  return result;
};
const pack = [car('leader', 1500), car('near', 1450), car('mid', 1250), car('far', 500)];
const before = JSON.stringify(pack), r = settle(pack);
assert.equal(JSON.stringify(pack), before, 'does not mutate cars');
assert.deepEqual([...r.values()].map(v => v.rank), [1, 2, 3, 4]);
assert.ok(r.get('leader').targetMultiplier < 1 && r.get('leader').targetMultiplier >= .96);
assert.ok(r.get('leader').leaderPenalty > 0 && r.get('leader').leaderPenalty <= .04);
for (const key of ['targetMultiplier', 'accelerationMultiplier']) {
  assert.ok(r.get('near')[key] > 1 && r.get('near')[key] < r.get('mid')[key]);
  assert.ok(r.get('mid')[key] < r.get('far')[key] && r.get('far')[key] <= 1.65);
}
assert.ok(.82 * .85 * r.get('far').targetMultiplier > 1.1, 'weak bot has meaningful far-behind opportunity');
assert.deepEqual([...settle([...pack].reverse())].sort(), [...r].sort(), 'input order independent');
const ties = settle([car('a', 1200), car('b', 1200), car('c', 1100)]);
assert.equal(ties.get('a').rank, 1); assert.equal(ties.get('b').rank, 1);
assert.deepEqual(ties.get('a'), ties.get('b'));
assert.equal(ties.get('a').leaderPenalty, 0);
assert.equal(ties.get('c').rank, 3);
const start = settle([car('a', 0, { speed: 0 }), car('b', -7, { speed: 0 })]);
assert.equal(start.get('a').targetMultiplier, 1); assert.equal(start.get('b').targetMultiplier, 1);
assert.equal(settle([car('alone', 400)]).get('alone').targetMultiplier, 1);
const lapped = settle([car('leader', 2200), car('lapped', 1150)]);
assert.equal(lapped.get('lapped').gap, 1050, 'unwrapped progress does not confuse laps');
const excluded = settle([car('a', 2000, { finished: true }), car('b', 1900, { eliminated: true }), car('c', 1000), car('d', 900)]);
assert.equal(excluded.get('a').rank, null); assert.equal(excluded.get('a').targetMultiplier, 1);
assert.equal(excluded.get('b').rank, null); assert.equal(excluded.get('c').rank, 1);
const disabled = settle(pack, { enabled: false });
for (const v of disabled.values()) assert.equal(v.targetMultiplier, 1), assert.equal(v.accelerationMultiplier, 1);
const invalid = settle([car('a', NaN), car('b', 20, { speed: NaN, topSpeed: Infinity })]);
for (const v of invalid.values()) for (const [k, n] of Object.entries(v)) if (k !== 'rank' || n !== null) assert.ok(Number.isFinite(n), `${k} is finite`);
const system = createCatchup({ finishDistance: 5000 });
let v = system.update(pack, 1 / 120);
assert.ok(v.get('far').targetMultiplier > 1 && v.get('far').targetMultiplier < r.get('far').targetMultiplier, 'smooth rise');
for (let i = 0; i < 1200; i++) v = system.update(pack, 1 / 120);
const swapped = pack.map(c => ({ ...c, distance: c.id === 'far' ? 1600 : c.distance }));
v = system.update(swapped, 1 / 120);
assert.ok(v.get('far').targetMultiplier <= 1, 'new leader does not retain trailing advantage');
system.reset(); v = system.update(pack, 0);
assert.equal(v.get('far').targetMultiplier, 1, 'reset clears smoothing state');
console.log(JSON.stringify({ passed: true, settled: Object.fromEntries(r), tests: ['monotonic and bounded gains', 'leader penalty', 'weak-bot opportunity', 'input immutability and order independence', 'ties', 'start', 'solo', 'unwrapped laps', 'inactive and invalid inputs', 'opt-out', 'smoothing and leader changes'] }, null, 2));
