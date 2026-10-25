/** One shared simulation clock: ramp close-ups slow every racer equally. */
export function rampPlaybackTarget(car, normalRate = 5) {
  if (!car || car.finished) return normalRate;
  const climbing = car.rampState === 'approach';
  const flying = car.flightKind === 'ramp' && car.flightRemaining > 0;
  const approaching = car.rampSeeking && car.rampTargetDistance >= 0 &&
    car.rampTargetDistance < Math.max(16, car.speed * .5) &&
    Math.abs(car.lateral - car.rampTargetLateral) < 2.3;
  return climbing || flying || approaching ? 1.25 : normalRate;
}

export function advancePlaybackRate(rate, target, realSeconds) {
  return target + (rate - target) * Math.exp(-Math.max(0, realSeconds) * 9);
}
