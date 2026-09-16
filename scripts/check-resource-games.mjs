import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRound, bodyAt, surface, supported, remaining } from '../public/games/ice-drop/round-core.mjs';
import { createInitialState, validateState, runReleaseAudit } from '../public/games/keeperfall/game-core.mjs';
const require = createRequire(import.meta.url);
const { Round, COLORS, parseNames } = require('../public/games/mouse-house/engine.js');

const wheelSource = readFileSync(new URL('../public/games/wheel-of-doom.html', import.meta.url), 'utf8');
const segmentSource = wheelSource.match(/  function wheelSegments\(entries\) \{[\s\S]*?\n  \}/)[0];
const wheelSegments = runInNewContext(segmentSource + '; wheelSegments;');
for (const weights of [[1], [1, 1], [1, 3, 2], [100, 1, 1, 5]]) {
  const segments = wheelSegments(weights.map(weight => ({weight})));
  assert.ok(Math.abs(segments.at(-1).end - segments[0].start - 360) < 1e-8);
  segments.forEach((segment, i) => {
    if (i) assert.equal(segment.start, segments[i - 1].end, 'Weighted slices must meet without gaps or overlaps');
    assert.equal(segment.center, (segment.start + segment.end) / 2);
  });
}

assert.ok(parseNames('').error);
assert.ok(parseNames(Array(61).fill('Student').join('\n')).error);
assert.deepEqual(parseNames(' Alex \n\n Sam ').names, ['Alex', 'Sam']);
let races = 0;
for (const count of [1, 8, 30, 60]) {
  for (let seed = 1; seed <= 10; seed++) {
    const people = Array.from({ length: count }, (_, id) => ({ id, name: 'Student ' + id, color: COLORS[id % COLORS.length] }));
    const race = new Round(people, seed);
    for (let t = 0; t < 180 && !race.done; t += 0.1) race.update(0.1);
    assert.ok(race.done, 'Mouse House must finish within 180 seconds');
    assert.ok(race.done.time > 5, 'The chase must not collapse into an instant result');
    assert.ok(people.some(p => p.id === race.done.id));
    for (const mouse of race.mice) {
      assert.ok(Number.isFinite(mouse.speed) && mouse.speed <= 6.4);
      assert.ok(mouse.hp >= 0 && mouse.hp <= 20);
    }
    races++;
  }
}
let falls = 0;
for (const count of [1, 8, 40]) {
  for (const duration of [8, 12, 18]) {
    for (let seed = 1; seed <= 30; seed++) {
      const names = Array.from({ length: count }, (_, i) => 'Student ' + i);
      const round = createRound(names, seed, duration);
      const { index, time } = round.hit;
      assert.ok(time > 0 && time <= duration);
      assert.equal(supported(bodyAt(round.bodies[index], time + 0.00001, duration), surface(time + 0.00001, duration)), false);
      assert.ok(round.bodies.every(body => supported(bodyAt(body, Math.max(0, time - 0.00001), duration), surface(Math.max(0, time - 0.00001), duration))));
      assert.equal(remaining(names, [names[index]]).length, count - 1);
      falls++;
    }
  }
}
const state = createInitialState();
const before = JSON.stringify(state);
assert.deepEqual(validateState(state), []);
const audit = runReleaseAudit(state, 365, 12345);
assert.ok(audit.ok, JSON.stringify(audit));
assert.equal(JSON.stringify(state), before, 'Audit must not mutate the player save');
console.log(JSON.stringify({ mouseRaces: races, iceFalls: falls, keeperfall: audit.ok, campaignDays: audit.soak.elapsedDays, stalledRuns: audit.soak.stalledRuns }));
