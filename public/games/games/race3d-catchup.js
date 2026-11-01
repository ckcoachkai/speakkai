/** Bounded, deterministic race-position envelopes. Never changes car state. */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const ease = (current, target, alpha) => current + (target - current) * alpha;
const MAX_GAIN = .65, MAX_LEADER_PENALTY = .04;

/**
 * `distance` is unwrapped race progress, not the modulo track position.
 * update returns a Map keyed by id; inactive cars get neutral factors. Factors
 * describe opportunities only. The caller remains responsible for applying
 * them before corner, braking, traction, damage and item limits.
 */
export function createCatchup({ enabled = true, finishDistance = 1 } = {}) {
  const previous = new Map();
  const finish = Math.max(1, finite(finishDistance, 1));

  function update(cars = [], dt = 1 / 120) {
    const entries = Array.from(cars || []).filter(car => car && car.id != null);
    const active = entries.filter(car => !car.finished && !car.eliminated && Number.isFinite(Number(car.distance)));
    const result = new Map();
    const liveIds = new Set(entries.map(car => car.id));
    for (const id of previous.keys()) if (!liveIds.has(id)) previous.delete(id);
    const leaderDistance = active.length ? Math.max(...active.map(car => Number(car.distance))) : 0;
    const leaders = active.filter(car => Number(car.distance) === leaderDistance);
    const leaderSpeed = leaders.reduce((max, car) => Math.max(max, finite(car.speed)), 0);
    const leaderBase = leaders.reduce((max, car) => Math.max(max, finite(car.topSpeed, finite(car.maxSpeed, 43))), 20);
    const stage = clamp(Math.max(0, leaderDistance) / finish, 0, 1);
    // Fade in after the grid start and as the race reaches driving speed.
    const start = clamp(Math.max(0, leaderDistance) / 100, 0, 1) * clamp(leaderSpeed / 15, 0, 1);
    const gapScale = clamp(leaderBase * 2.5, 50, 250);
    const secondDistance = active.length > leaders.length
      ? Math.max(...active.filter(car => Number(car.distance) < leaderDistance).map(car => Number(car.distance)))
      : leaderDistance;
    const leadGap = leaders.length === 1 ? Math.max(0, leaderDistance - secondDistance) : 0;
    const penaltyGoal = active.length > 1 ? MAX_LEADER_PENALTY * (1 - Math.exp(-leadGap / 45)) * start : 0;
    const alpha = 1 - Math.exp(-clamp(finite(dt), 0, .25) / 1.1);

    for (const car of entries) {
      const inRace = active.includes(car), gap = inRace ? Math.max(0, leaderDistance - Number(car.distance)) : 0;
      const rank = inRace ? 1 + active.filter(other => Number(other.distance) > Number(car.distance)).length : null;
      const isLeader = rank === 1;
      const rankFraction = active.length > 1 && rank != null ? (rank - 1) / (active.length - 1) : 0;
      const lag = 1 - Math.exp(-gap / gapScale);
      const strength = clamp(lag * (.6 + .4 * rankFraction) * start, 0, 1);
      // Convex exponential: small gaps stay competitive, while far-behind
      // racers gain progressively more up to a fixed maximum.
      const gain = MAX_GAIN * Math.expm1(2.5 * strength) / Math.expm1(2.5);
      const targetGoal = isLeader ? 1 - penaltyGoal : 1 + gain;
      const accelerationGoal = isLeader ? 1 : 1 + gain;
      const applies = enabled && inRace && active.length > 1;
      const old = previous.get(car.id) || { targetMultiplier: 1, accelerationMultiplier: 1 };
      let targetMultiplier = applies ? ease(old.targetMultiplier, targetGoal, alpha) : 1;
      let accelerationMultiplier = applies ? ease(old.accelerationMultiplier, accelerationGoal, alpha) : 1;
      // A newly leading car cannot retain an old trailing-car advantage.
      if (isLeader) { targetMultiplier = Math.min(1, targetMultiplier); accelerationMultiplier = Math.min(1, accelerationMultiplier); }
      const value = { targetMultiplier: clamp(targetMultiplier, 1 - MAX_LEADER_PENALTY, 1 + MAX_GAIN),
        accelerationMultiplier: clamp(accelerationMultiplier, 1, 1 + MAX_GAIN), gap, rank,
        leaderPenalty: isLeader ? Math.max(0, 1 - targetMultiplier) : 0, stage };
      result.set(car.id, value);
      if (inRace && applies) previous.set(car.id, { targetMultiplier: value.targetMultiplier, accelerationMultiplier: value.accelerationMultiplier });
      else previous.delete(car.id);
    }
    return result;
  }
  return { update, reset() { previous.clear(); } };
}
