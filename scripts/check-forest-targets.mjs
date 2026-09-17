import {test} from 'node:test';
import assert from 'node:assert/strict';
import hosts from '../src/scripts/forest/hosts.json' with {type: 'json'};
import {
  ATTACK_ZONES,
  REACTION_STYLES,
  attackZoneAt,
  createAttackSequence,
  getAttackTarget,
  getBossLandmarks,
  reactionForTarget,
  targetWorldPoint,
} from '../src/scripts/forest/attack-targets.js';

const HOST_IDS = hosts.map(host => host.id);
const EXPECTED_ZONES = ['stomach', 'head', 'neck', 'arm', 'stomach'];
const BOX = Object.freeze({x: 500, y: 120, w: 1328, h: 1992});

function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

test('all ten bosses expose bounded landmarks and world targets', () => {
  assert.equal(HOST_IDS.length, 10, 'the encounter should cover all ten hosts');
  for (const host of hosts) {
    const landmarks = getBossLandmarks(host);
    for (const zone of ['head', 'neck', 'arm', 'stomach']) {
      assert.ok(finitePoint(landmarks[zone]), `${host.id} ${zone} landmark is finite`);
      assert.ok(landmarks[zone].x >= 0 && landmarks[zone].x <= 1, `${host.id} ${zone} x is normalized`);
      assert.ok(landmarks[zone].y >= 0 && landmarks[zone].y <= 1, `${host.id} ${zone} y is normalized`);
    }

    const target = getAttackTarget(host, 3);
    const world = targetWorldPoint(target, BOX);
    assert.equal(target.hostId, host.id);
    assert.ok(finitePoint(world), `${host.id} world target is finite`);
    assert.ok(world.x >= BOX.x && world.x <= BOX.x + BOX.w, `${host.id} world x stays in boss box`);
    assert.ok(world.y >= BOX.y && world.y <= BOX.y + BOX.h, `${host.id} world y stays in boss box`);
    assert.ok(Number.isFinite(target.radius) && target.radius > 0 && target.radius <= .16, `${host.id} radius is usable`);
  }
});

test('every host gets the same deterministic five-beat attack choreography', () => {
  for (const host of hosts) {
    const sequence = createAttackSequence(host, 10);
    assert.equal(sequence.length, 10, `${host.id} has ten beats`);
    assert.deepEqual(sequence.slice(0, 5).map(target => target.zone), EXPECTED_ZONES, `${host.id} first cycle`);
    assert.deepEqual(sequence.slice(5).map(target => target.zone), EXPECTED_ZONES, `${host.id} second cycle`);
    assert.deepEqual(sequence.map(target => target.beat), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.ok(sequence.every(target => target.hostId === host.id));
    assert.equal(sequence[3].side, 'left');
    assert.equal(sequence[8].side, 'right');
    assert.notEqual(sequence[3].point.x, sequence[8].point.x, `${host.id} arm hits alternate sides`);
  }
});

test('beat indexing and target timing remain stable under scene-clock sampling', () => {
  assert.deepEqual(ATTACK_ZONES, EXPECTED_ZONES);
  assert.equal(attackZoneAt(-4), 'stomach');
  assert.equal(attackZoneAt(2.9), 'neck');
  assert.equal(attackZoneAt(5), 'stomach');
  assert.equal(attackZoneAt(Number.NaN), 'stomach');

  const sequence = createAttackSequence('dog', 5);
  let sceneTime = 12;
  for (const [index, target] of sequence.entries()) {
    const full = reactionForTarget(target, index);
    const gentle = reactionForTarget(target, index, true);
    assert.equal(full.zone, target.zone);
    assert.ok(REACTION_STYLES.includes(full.style));
    assert.ok(full.duration >= .3 && full.duration <= .42, `${target.zone} duration is in the authored timing range`);
    assert.ok(Number.isFinite(full.rotation) && Number.isFinite(full.sway));
    assert.ok(Math.abs(gentle.rotation) <= Math.abs(full.rotation));
    assert.equal(full.reversible, true);
    assert.equal(full.detach, false);
    assert.equal(full.blood, false);
    sceneTime += full.duration;
  }
  assert.ok(sceneTime > 13.7 && sceneTime < 14.1, 'five impacts fit the expected scene-clock window');
});
