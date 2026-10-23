/**
 * Fixed-step arcade racing simulation for the 3D Grand Prix.
 *
 * Cars share one set of engine, grip, brake and steering limits. Names are
 * shuffled onto the starting grid, then the winner is the first car whose
 * simulated distance crosses the finish line.
 */
const STEP = 1 / 120;
const MAX_FRAME_DELTA = 0.25;
const MAX_STEPS_PER_UPDATE = 30;
const MAX_CARS = 60;
const CAR_LENGTH = 4.4;
const CAR_WIDTH = 1.9;
const TOP_SPEED = 43;
const ENGINE_ACCEL = 9.5;
const BRAKE_ACCEL = 15;
const SIDE_GRIP = 5.8;
const MAX_EVENTS = 80;

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function angleDelta(from, to) {
  let delta = (to - from + Math.PI) % (Math.PI * 2);
  if (delta < 0) delta += Math.PI * 2;
  return delta - Math.PI;
}

function safeVector(vector, fallback) {
  const x = finite(vector?.x, fallback.x);
  const y = finite(vector?.y, fallback.y);
  const z = finite(vector?.z, fallback.z);
  const length = Math.hypot(x, y, z);
  if (length < 1e-6) return { ...fallback };
  return { x: x / length, y: y / length, z: z / length };
}

/** Create the simulation consumed by race3d.js. */
export function createRaceSimulation({ players = [], track, random = Math.random } = {}) {
  if (!track || typeof track.sampleTrack !== 'function') {
    throw new TypeError('createRaceSimulation requires a track with sampleTrack(distance)');
  }

  const roster = Array.from(players).slice(0, MAX_CARS).map((player, index) => {
    const source = typeof player === 'string' ? { name: player } : (player || {});
    return {
      id: source.id ?? source.name ?? index,
      name: String(source.name ?? source.id ?? `Car ${index + 1}`),
      color: source.color ?? '#f4c35e',
    };
  });
  const trackLength = Math.max(1, finite(track.totalLength, 1));
  const finishDistance = Math.max(1, finite(track.raceDistance, trackLength * 2));
  const randomValue = () => {
    const value = Number(random());
    return Number.isFinite(value) ? clamp(value, 0, 0.999999999999) : 0;
  };

  let cars = [];
  let time = 0;
  let accumulator = 0;
  let winnerId = null;
  let winnerWasReturned = false;
  let disposed = false;
  let events = [];
  let lastCollisionAt = new Map();
  const hazardHits = new Set();

  function sample(distance) {
    let value;
    try {
      value = track.sampleTrack(distance);
    } catch {
      value = null;
    }
    const tangent = safeVector(value?.tangent, { x: 1, y: 0, z: 0 });
    let right = safeVector(value?.right, { x: 0, y: 0, z: 1 });
    // Keep the supplied handedness, but repair a degenerate vector that points
    // along the road rather than across it.
    const tangentRightDot = tangent.x * right.x + tangent.y * right.y + tangent.z * right.z;
    if (Math.abs(tangentRightDot) > 0.96) right = { x: -tangent.z, y: 0, z: tangent.x };
    return {
      position: value?.position || { x: 0, y: 0, z: 0 },
      tangent,
      right,
      width: Math.max(4, finite(value?.width, finite(track.width, 16))),
    };
  }

  function curvatureAt(distance, span = 12) {
    const a = sample(distance - span * 0.5).tangent;
    const b = sample(distance + span * 0.5).tangent;
    // Tangent angle in the horizontal plane; positive values turn toward right.
    const ax = a.x, az = a.z, bx = b.x, bz = b.z;
    const cross = ax * bz - az * bx;
    const dot = ax * bx + az * bz;
    return Math.atan2(cross, dot) / span;
  }

  function emit(type, car, extra = {}) {
    const base = {
      type,
      time,
      carId: car?.id ?? null,
      distance: finite(car?.distance),
      lateral: finite(car?.lateral),
      intensity: 1,
    };
    events.push({ ...base, ...extra });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  }

  function createGrid() {
    const existingById = new Map();
    for (const car of cars) {
      if (!existingById.has(car.id)) existingById.set(car.id, []);
      existingById.get(car.id).push(car);
    }
    const order = roster.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(randomValue() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const laneSwap = randomValue() < 0.5 ? -1 : 1;
    const rowSpacing = Math.max(6.4, CAR_LENGTH * 1.52);
    const newCars = order.map((rosterIndex, gridIndex) => {
      const player = roster[rosterIndex];
      const row = Math.floor(gridIndex / 2);
      const laneSide = (gridIndex % 2 === 0 ? -1 : 1) * laneSwap;
      const car = {
        id: player.id,
        name: player.name,
        color: player.color,
        index: rosterIndex,
        gridPosition: gridIndex,
        distance: -row * rowSpacing,
        lateral: laneSide * 1.55,
        speed: 0,
        topSpeed: TOP_SPEED,
        maxSpeed: TOP_SPEED,
        heading: 0,
        spin: 0,
        spinAngle: 0,
        finished: false,
        lateralVelocity: 0,
        yawRate: 0,
        slip: 0,
        targetSpeed: 0,
        length: CAR_LENGTH,
        width: CAR_WIDTH,
        preferredLane: laneSide * 1.8,
        spinDirection: laneSide,
        stuckTime: 0,
        previousProgress: -row * rowSpacing,
        boost: 0,
        brake: 0,
        damage: 0,
        _finishFraction: null,
      };
      return car;
    });
    const stableCars = newCars.map(fresh => {
      const existing = existingById.get(fresh.id)?.shift();
      if (!existing) return fresh;
      for (const key of Object.keys(existing)) delete existing[key];
      Object.assign(existing, fresh);
      return existing;
    });
    cars.splice(0, cars.length, ...stableCars);
    time = 0;
    accumulator = 0;
    winnerId = null;
    winnerWasReturned = false;
    events = [];
    lastCollisionAt = new Map();
    hazardHits.clear();
  }

  function startSpin(car, direction, strength = 1) {
    if (car.finished || car.spin > 0) return;
    car.spin = clamp(0.65 + strength * 0.12, 0.65, 1.35);
    car.spinDirection = direction < 0 ? -1 : 1;
    car.speed *= 0.66;
    car.lateralVelocity += car.spinDirection * clamp(1 + strength * 0.32, 1, 7);
    car.heading += car.spinDirection * 0.12;
    emit('spin', car, { intensity: clamp(strength / 8, 0.25, 1), duration: car.spin });
  }

  function laneTargetFor(car, currentCurvature) {
    const roadHalf = sample(car.distance).width * 0.5;
    const limit = Math.max(0.2, roadHalf - CAR_WIDTH * 0.78);
    let target = clamp(car.preferredLane, -limit, limit);

    // A car closing on a slower car chooses the freer side before contact.
    let nearestGap = Infinity;
    let blocking = null;
    for (const other of cars) {
      if (other === car || other.finished) continue;
      const gap = other.distance - car.distance;
      if (gap <= 0 || gap > Math.max(12, car.speed * 0.62)) continue;
      if (Math.abs(other.lateral - car.lateral) > CAR_WIDTH * 1.7) continue;
      if (other.speed > car.speed + 1.2 || gap >= nearestGap) continue;
      nearestGap = gap;
      blocking = other;
    }
    if (blocking) {
      const leftRoom = limit + car.lateral;
      const rightRoom = limit - car.lateral;
      const side = leftRoom > rightRoom ? -1 : 1;
      const urgency = clamp(1 - nearestGap / Math.max(12, car.speed * 0.62), 0, 1);
      target = clamp(target + side * urgency * 2.8, -limit, limit);
    }

    // A small inside-line bias keeps cars from riding the outside edge through
    // a bend. This is shared by every car and does not change its performance.
    if (Math.abs(currentCurvature) > 0.012) {
      target -= Math.sign(currentCurvature) * Math.min(0.45, Math.abs(currentCurvature) * 12);
    }
    return clamp(target, -limit, limit);
  }

  function targetSpeedFor(car, curvature) {
    const lookAhead = clamp(car.speed * 0.9 + 11, 14, 48);
    const aheadCurve = curvatureAt(car.distance + lookAhead, 14);
    const curve = Math.max(Math.abs(curvature), Math.abs(aheadCurve) * 0.84);
    const cornerSpeed = curve < 0.001 ? TOP_SPEED : Math.sqrt(12.4 / curve);
    const roadHalf = sample(car.distance).width * 0.5;
    const edge = Math.max(0, Math.abs(car.lateral) - (roadHalf - CAR_WIDTH * 0.7));
    const offRoadFactor = edge > 0 ? clamp(1 - edge * 0.16, 0.36, 1) : 1;
    let target = Math.min(TOP_SPEED, cornerSpeed) * offRoadFactor;

    let leadGap = Infinity;
    let lead = null;
    for (const other of cars) {
      if (other === car || other.finished) continue;
      const gap = other.distance - car.distance;
      if (gap <= 0 || gap >= leadGap || gap > Math.max(11, car.speed * 0.5)) continue;
      if (Math.abs(other.lateral - car.lateral) > CAR_WIDTH * 1.2) continue;
      leadGap = gap;
      lead = other;
    }
    if (lead) {
      const safeGap = 4.8 + car.speed * 0.24;
      const follow = lead.speed + Math.max(0, leadGap - safeGap) * 0.45;
      target = Math.min(target, Math.max(6.5, follow));
    }
    return clamp(target, 6.5, TOP_SPEED);
  }

  function applyHazards(car) {
    const hazards = Array.isArray(track.hazards) ? track.hazards : [];
    if (!hazards.length) return;
    for (let index = 0; index < hazards.length; index++) {
      const hazard = hazards[index] || {};
      const baseDistance = ((finite(hazard.distance) % trackLength) + trackLength) % trackLength;
      const lap = Math.round((car.distance - baseDistance) / trackLength);
      const hazardDistance = baseDistance + lap * trackLength;
      const key = `${car.gridPosition}:${index}:${lap}`;
      if (hazardHits.has(key)) continue;
      const radius = Math.max(0.5, finite(hazard.radius, hazard.type === 'oil' ? 2.2 : 1.7));
      if (Math.abs(car.distance - hazardDistance) > Math.max(1.7, CAR_LENGTH * 0.42)) continue;
      if (Math.abs(car.lateral - finite(hazard.lateral ?? hazard.offset)) > radius + CAR_WIDTH * 0.45) continue;
      hazardHits.add(key);
      const type = String(hazard.type || 'debris').toLowerCase();
      const side = car.lateral >= finite(hazard.lateral ?? hazard.offset) ? 1 : -1;
      if (type === 'oil' || type === 'water') {
        car.lateralVelocity += side * (type === 'oil' ? 4.6 : 2.8);
        car.speed *= type === 'oil' ? 0.78 : 0.88;
        emit('oil', car, { hazardType: type, intensity: 0.85 });
        startSpin(car, side, type === 'oil' ? 3.2 : 1.8);
      } else {
        car.speed = Math.max(5, car.speed - (type === 'cone' ? 5.5 : 3.2));
        car.lateralVelocity += side * 1.1;
        emit(type === 'cone' ? 'cone' : 'hazard', car, { hazardType: type, intensity: 0.48 });
      }
    }
  }

  function integrateCar(car, dt) {
    if (car.finished) return;
    car.previousProgress = car.distance;
    car._finishFraction = null;
    car.boost = Math.max(0, car.boost - dt);
    const curvature = curvatureAt(car.distance, 12);

    if (car.spin > 0) {
      const oldSpin = car.spin;
      car.spin = Math.max(0, car.spin - dt);
      car.spinAngle += car.spinDirection * dt * (5.4 + (oldSpin - car.spin) * 4);
      car.heading += car.spinDirection * dt * 1.7;
      car.speed = Math.max(5.5, car.speed - 6.5 * dt);
      car.lateralVelocity *= Math.exp(-0.75 * dt);
      if (car.spin === 0) {
        car.heading = clamp(car.heading, -0.42, 0.42);
        emit('recovery', car, { intensity: 0.7 });
      }
    } else {
      car.spinAngle *= Math.exp(-5 * dt);
      const desiredSpeed = targetSpeedFor(car, curvature);
      car.targetSpeed = desiredSpeed;
      const speedError = desiredSpeed - car.speed;
      if (speedError >= 0) {
        car.speed += Math.min(speedError, ENGINE_ACCEL * dt * (1 - 0.12 * car.speed / TOP_SPEED));
        car.brake = 0;
      } else {
        const braking = Math.min(-speedError, BRAKE_ACCEL * dt);
        car.speed -= braking;
        car.brake = clamp(braking / (BRAKE_ACCEL * dt), 0, 1);
      }

      const targetLane = laneTargetFor(car, curvature);
      const sideSpeedTarget = clamp((targetLane - car.lateral) * 0.82 - car.lateralVelocity * 0.58, -6.5, 6.5);
      const desiredHeading = clamp(Math.atan2(sideSpeedTarget, Math.max(5, car.speed)), -0.34, 0.34);
      const gripDemand = car.speed * car.speed * Math.abs(curvature) / 12.4;
      const grip = clamp(1 - Math.max(0, gripDemand - 0.9) * 0.85, 0.3, 1);
      const yawLimit = clamp(1.42 - car.speed * 0.009, 0.82, 1.42) * grip;
      const yawCommand = clamp(angleDelta(car.heading, desiredHeading) * 5.2, -yawLimit, yawLimit);
      car.yawRate = yawCommand;
      car.heading += yawCommand * dt;

      const tireSlip = Math.abs(angleDelta(Math.atan2(car.lateralVelocity, Math.max(2, car.speed)), car.heading));
      car.slip = tireSlip;
      const lateralGrip = SIDE_GRIP * grip * (Math.abs(car.lateral) > sample(car.distance).width * 0.5 - CAR_WIDTH * 0.65 ? 0.44 : 1);
      const desiredLateralVelocity = car.speed * Math.sin(car.heading);
      car.lateralVelocity += (desiredLateralVelocity - car.lateralVelocity) * clamp(lateralGrip * dt, 0, 1);
      const offRoad = Math.abs(car.lateral) > sample(car.distance).width * 0.5 - CAR_WIDTH * 0.55;
      if (offRoad) {
        car.speed = Math.max(4.5, car.speed - 4.8 * dt);
        car.lateralVelocity += -Math.sign(car.lateral) * 1.5 * dt;
      }

      if (gripDemand > 1.7 && tireSlip > 0.22 && car.speed > 17) {
        startSpin(car, Math.sign(car.heading || curvature || 1), clamp((gripDemand - 1.3) * 2.1, 1.2, 4.5));
      }
    }

    car.lateral += car.lateralVelocity * dt;
    const roadLimit = Math.max(1.2, sample(car.distance).width * 0.5 + 3.6);
    if (Math.abs(car.lateral) > roadLimit) {
      car.lateral = Math.sign(car.lateral) * roadLimit;
      car.lateralVelocity *= -0.28;
      car.speed *= 0.9;
      if (!car._edgeEventAt || time - car._edgeEventAt > 1.1) {
        car._edgeEventAt = time;
        emit('offroad', car, { intensity: 0.55 });
      }
    }

    const forwardSpeed = Math.max(0, car.speed * Math.cos(car.heading));
    car.distance += forwardSpeed * dt;
    if (car.speed < 0.65 && car.distance - car.previousProgress < 0.2) car.stuckTime += dt;
    else car.stuckTime = Math.max(0, car.stuckTime - dt * 2.5);
    if (car.stuckTime > 3.25) {
      car.stuckTime = 0;
      car.distance += 1.6;
      car.speed = Math.max(car.speed, 6.8);
      car.lateral = clamp(car.lateral, -sample(car.distance).width * 0.28, sample(car.distance).width * 0.28);
      car.lateralVelocity *= 0.2;
      car.heading *= 0.35;
      emit('recovery', car, { recoveryType: 'unstuck', intensity: 0.6 });
    }

    applyHazards(car);
    if (car.distance >= finishDistance && car.previousProgress < finishDistance) {
      const distance = car.distance - car.previousProgress;
      car._finishFraction = distance > 1e-6 ? clamp((finishDistance - car.previousProgress) / distance, 0, 1) : 1;
    }
  }

  function resolveCollisions() {
    const n = cars.length;
    for (let i = 0; i < n; i++) {
      const a = cars[i];
      if (a.finished) continue;
      for (let j = i + 1; j < n; j++) {
        const b = cars[j];
        if (b.finished) continue;
        let longitudinal = b.distance - a.distance;
        if (Math.abs(longitudinal) > CAR_LENGTH * 1.08) continue;
        let lateral = b.lateral - a.lateral;
        if (Math.abs(lateral) > CAR_WIDTH * 1.32) continue;
        const halfLength = CAR_LENGTH * 0.52;
        const halfWidth = CAR_WIDTH * 0.62;
        let nxRaw = longitudinal / halfLength;
        let nyRaw = lateral / halfWidth;
        const ellipse = nxRaw * nxRaw + nyRaw * nyRaw;
        if (ellipse >= 1) continue;
        let normalLength = Math.hypot(nxRaw, nyRaw);
        if (normalLength < 1e-5) {
          nxRaw = (a.gridPosition < b.gridPosition ? 1 : -1) * 0.15;
          nyRaw = a.preferredLane <= b.preferredLane ? 1 : -1;
          normalLength = Math.hypot(nxRaw, nyRaw);
        }
        const nx = nxRaw / normalLength;
        const ny = nyRaw / normalLength;
        const penetration = (1 - Math.sqrt(ellipse)) * Math.min(halfLength, halfWidth);
        const separation = penetration * 0.52;
        a.distance -= nx * separation;
        b.distance += nx * separation;
        a.lateral -= ny * separation;
        b.lateral += ny * separation;

        const rvLong = b.speed - a.speed;
        const rvSide = b.lateralVelocity - a.lateralVelocity;
        const closing = -(rvLong * nx + rvSide * ny);
        if (closing > 0.25) {
          const impulse = Math.min(12, closing * 0.56);
          a.speed = Math.max(0, a.speed - impulse * nx);
          b.speed = Math.max(0, b.speed + impulse * nx);
          a.lateralVelocity -= impulse * ny * 0.42;
          b.lateralVelocity += impulse * ny * 0.42;
          a.speed *= 0.985;
          b.speed *= 0.985;
          const key = `${Math.min(a.gridPosition, b.gridPosition)}:${Math.max(a.gridPosition, b.gridPosition)}`;
          if (time - (lastCollisionAt.get(key) ?? -10) > 0.38) {
            lastCollisionAt.set(key, time);
            const intensity = clamp(closing / 13, 0.22, 1);
            emit('collision', a, { otherCarId: b.id, intensity, distance: (a.distance + b.distance) * 0.5, lateral: (a.lateral + b.lateral) * 0.5 });
            if (closing > 8.8) {
              const hitSide = ny === 0 ? (a.preferredLane < 0 ? 1 : -1) : Math.sign(ny);
              startSpin(a, -hitSide, intensity * 5.4);
              startSpin(b, hitSide, intensity * 5.4);
            }
          }
        }
      }
    }
  }

  function fixedStep(dt) {
    time += dt;
    for (const car of cars) integrateCar(car, dt);
    resolveCollisions();
    for (const car of cars) {
      if (car.finished || car.previousProgress >= finishDistance) continue;
      if (car._finishFraction === null && car.distance >= finishDistance) {
        const distance = car.distance - car.previousProgress;
        car._finishFraction = distance > 1e-6 ? clamp((finishDistance - car.previousProgress) / distance, 0, 1) : 1;
      }
      if (car._finishFraction !== null) {
        car.distance = Math.max(car.distance, finishDistance);
        car.finished = true;
      }
    }
    const finishers = cars
      .filter(car => car._finishFraction !== null)
      .sort((a, b) => a._finishFraction - b._finishFraction || a.gridPosition - b.gridPosition);
    if (finishers.length) {
      const first = finishers[0];
      if (winnerId === null) {
        winnerId = first.id;
        emit('finish', first, { intensity: 1, finishDistance });
      }
      // Cars that cross in the same fixed step still receive their truthful
      // finish state, while winner selection uses their interpolated crossing.
    }
  }

  function update(dt) {
    if (disposed) return null;
    const frameDelta = clamp(finite(dt), 0, MAX_FRAME_DELTA);
    accumulator = Math.min(MAX_FRAME_DELTA, accumulator + frameDelta);
    let steps = 0;
    while (accumulator + 1e-10 >= STEP && steps < MAX_STEPS_PER_UPDATE) {
      fixedStep(STEP);
      accumulator -= STEP;
      steps++;
    }
    if (steps >= MAX_STEPS_PER_UPDATE) accumulator = 0;
    if (winnerId !== null && !winnerWasReturned) {
      winnerWasReturned = true;
      return winnerId;
    }
    return null;
  }

  function reset() {
    if (disposed) return;
    createGrid();
  }

  function dispose() {
    disposed = true;
    cars = [];
    events = [];
    hazardHits.clear();
    lastCollisionAt.clear();
  }

  createGrid();
  return {
    get cars() { return cars; },
    get time() { return time; },
    get winner() { return winnerId; },
    get finishDistance() { return finishDistance; },
    update,
    reset,
    dispose,
    drainEvents() {
      const drained = events;
      events = [];
      return drained;
    },
  };
}

export const RACE_PHYSICS = Object.freeze({
  step: STEP,
  maxFrameDelta: MAX_FRAME_DELTA,
  maxCars: MAX_CARS,
  carLength: CAR_LENGTH,
  carWidth: CAR_WIDTH,
  topSpeed: TOP_SPEED,
});
