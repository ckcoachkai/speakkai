// Keep targeting stable without allocating and sorting an array for each query.
export function nearestLivingMob(mobs, minX = -Infinity, maxX = Infinity) {
  let nearest;
  for (const mob of mobs) {
    if (!mob.dead && mob.x >= minX && mob.x <= maxX && (!nearest || mob.x < nearest.x)) nearest = mob;
  }
  return nearest;
}

// Keep every queued combat tick, but return control to input/painting regularly.
// Under heavy load requested fast-forward may run slower, never skip collisions.
export function runSimulationSlice(budget, step, running, now = () => performance.now()) {
  const deadline = now() + 8;
  let steps = 0;
  while (running() && budget + 1e-8 >= .04 && steps < 64) {
    budget -= .04;
    step(.04);
    steps++;
    if (now() >= deadline) break;
  }
  return budget;
}

