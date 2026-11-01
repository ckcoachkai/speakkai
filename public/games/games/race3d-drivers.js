/** Fictional race-only ability. These levels do not assess real people. */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const definitions = [
  // id, label, skill center, speed, acceleration, durability, grip, line error, ramp error
  ['legend', 'Legend', .94, 1.04, 1.05, 1.08, 1.05, .55, .65],
  ['elite', 'Elite', .88, 1.03, 1.04, 1.06, 1.04, .65, .72],
  ['expert', 'Expert', .82, 1.02, 1.03, 1.04, 1.03, .75, .80],
  ['skilled', 'Skilled', .76, 1.01, 1.02, 1.02, 1.02, .85, .90],
  ['steady', 'Steady', .70, 1, 1, 1, 1, 1, 1],
  ['nervous', 'Nervous', .61, .98, .98, .98, .98, 1.35, 1.10],
  ['rookie', 'Rookie', .52, .96, .96, .95, .96, 1.85, 1.20],
  ['reckless', 'Reckless', .43, .94, .94, .92, .93, 2.60, 1.35],
  ['chaos', 'Chaos', .34, .91, .91, .88, .90, 3.65, 1.50],
];
export const DRIVER_LEVELS = Object.freeze(definitions.map(([id, name, skillCenter, speedFactor, accelerationFactor, durabilityFactor, gripFactor, lineErrorScale, rampErrorScale], i) => Object.freeze({
  tier: i + 1, id, name, label: `${name} (fictional race level ${i + 1})`, skillCenter,
  speedFactor, accelerationFactor, durabilityFactor, gripFactor, lineErrorScale, rampErrorScale,
})));

// Clamp invalid sources and the inclusive upper endpoint before indexing.
function unit(random) {
  let value;
  try { value = Number(typeof random === 'function' ? random() : Math.random()); } catch { value = .5; }
  return Number.isFinite(value) ? clamp(value, 0, 1 - Number.EPSILON) : .5;
}

export function createDriverSkills(random, mode = 'varied') {
  if (mode === 'equal') return Object.freeze({
    reaction: .75, control: .75, braking: .75, ramp: .75, items: .75,
    equal: true, tier: null, id: 'equal', label: 'Equal test driver',
    speedFactor: 1, accelerationFactor: 1, durabilityFactor: 1, gripFactor: 1,
    lineErrorScale: 1, rampErrorScale: 1,
  });
  const level = DRIVER_LEVELS[Math.floor(unit(random) * DRIVER_LEVELS.length)];
  const axis = () => clamp(level.skillCenter + (unit(random) - .5) * .08, .20, .99);
  const reaction = axis(), control = axis(), braking = axis(), ramp = axis(), items = axis();
  return Object.freeze({ ...level, reaction, control, braking, ramp, items, equal: false });
}

export function driverControls(s) {
  return {
    reactionSeconds: .62 - .45 * s.reaction,
    steerResponse: 3.8 + 2.1 * s.control,
    lineError: s.equal ? 0 : (1 - s.control) * .85 * (s.lineErrorScale ?? 1),
    brakeMargin: .82 + .17 * s.braking,
    lookAhead: .77 + .30 * s.braking,
    itemConfidence: .67 - .15 * s.items,
    itemThink: .42 - .27 * s.reaction,
    rampError: s.equal ? 0 : (1 - s.ramp) * .75 * (s.rampErrorScale ?? 1),
    mistakeInterval: 15 + 23 * s.control,
    // Equal-driver tests retain exactly constant pace.
    paceVariation: s.equal ? 0 : .10,
    paceInterval: 5 + 5 * s.control,
  };
}
