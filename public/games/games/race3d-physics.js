/**
 * Deterministic fixed-step arcade racing, not an engineering vehicle model.
 * Everyone shares engine/aero/tire/brake limits. Traffic, slipstreams, temporary
 * driving errors and collected items determine the actual first crossing.
 */
const STEP = 1 / 120, MAX_FRAME_DELTA = 0.25, MAX_STEPS_PER_UPDATE = 30;
const MAX_CARS = 60, CAR_LENGTH = 4.4, CAR_WIDTH = 1.9, TOP_SPEED = 43;
const ENGINE_ACCEL = 9.5, BRAKE_ACCEL = 15, SIDE_GRIP = 5.8, CORNER_GRIP = 12.4;
const MAX_EVENTS = 160, MAX_BANANAS = 24, MAX_BOMBS = 12;
const BOOST_DURATION = 6, BLAST_RADIUS = 7.5;
// Fictional competition calibration, never Tesla specifications. All entrants
// use this same electric drive and temporary overdrive/nitro budget.
const MASS = 900, BATTERY_J = 180e6, MOTOR_POWER_W = 180000;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const wrap = (d, length) => ((d % length) + length) % length;
const angleDelta = (from, to) => wrap(to - from + Math.PI, Math.PI * 2) - Math.PI;
function safeVector(value, fallback) {
  const x = finite(value?.x, fallback.x), y = finite(value?.y, fallback.y), z = finite(value?.z, fallback.z);
  const length = Math.hypot(x, y, z);
  return length > 1e-6 ? { x: x / length, y: y / length, z: z / length } : { ...fallback };
}
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Adapted from the independently checked aero_drag, aero_grip, ev_drive and
// nitro_drive proposals. SI units, one force integration, one shared tire budget.
export function raceForceEnvelope({ speed = 0, curvature = 0, draft = 0, offRoad = false } = {}) {
  speed = Math.max(0, finite(speed)); curvature = finite(curvature); draft = finite(draft);
  const q = 0.5 * 1.225 * Math.max(0, speed) ** 2;
  const wing = 0.6;
  const dragN = q * (0.68 + 0.36 * wing ** 2) * (1 - 0.24 * clamp(draft, 0, 1));
  const downforceN = Math.min(MASS * 9.81 * 0.65, q * (0.12 + 1.25 * wing));
  const gripAccel = 1.12 * (offRoad ? 0.45 : 1) * (9.81 + downforceN / MASS);
  const lateralAccel = speed * speed * Math.abs(curvature);
  const lateralUse = clamp(lateralAccel / gripAccel, 0, 1);
  const longitudinalAccel = gripAccel * Math.sqrt(Math.max(0, 1 - lateralUse * lateralUse));
  return { dragN, downforceN, dragAccel: dragN / MASS,
    rollingAccel: 0.16 + (offRoad ? 2.1 : 0), gripAccel, lateralAccel,
    longitudinalAccel, slip: Math.max(0, lateralAccel / gripAccel - 1) };
}
export function raceElectricDrive({ speed = 0, throttle = 0, brake = 0, energyJ = BATTERY_J * 0.8, dt = STEP, longitudinalAccel = 11 } = {}) {
  speed = Math.max(0, finite(speed)); dt = clamp(finite(dt), 0, 0.1);
  throttle = finite(throttle); brake = finite(brake); energyJ = finite(energyJ);
  const energy = clamp(energyJ, 0, BATTERY_J), soc = energy / BATTERY_J;
  const gripN = Math.max(0, finite(longitudinalAccel)) * MASS;
  const availablePower = Math.min(MOTOR_POWER_W * clamp(soc / 0.08, 0, 1), energy * 0.92 / Math.max(dt, 1e-6));
  const driveN = brake > 0 ? 0 : Math.min(ENGINE_ACCEL * MASS, availablePower / Math.max(speed, 1), gripN) * clamp(throttle, 0, 1);
  const brakeN = Math.min(clamp(brake, 0, 1) * BRAKE_ACCEL * MASS, gripN);
  const regenW = Math.min(brakeN * speed, 70000 * clamp((1 - soc) / 0.08, 0, 1), (BATTERY_J - energy) / Math.max(dt * 0.92, 1e-6));
  const powerW = driveN * speed / 0.92;
  return { driveN, brakeN, regenW, powerW,
    energyJ: clamp(energy + (regenW * 0.92 - powerW) * dt, 0, BATTERY_J),
    acceleration: (driveN - brakeN) / MASS };
}
function stepNitro(car, dt, tractionAcceleration) {
  const n = car.nitro;
  const active = Math.min(dt, n.remaining, n.reservoir * BOOST_DURATION);
  let acceleration = 0;
  if (active > 0) {
    acceleration = Math.min(Math.max(0, tractionAcceleration), 8.5 / (1 + (car.speed / 36) ** 2) * (1 - 0.65 * n.heat)) * active / dt;
    n.reservoir = clamp(n.reservoir - active / BOOST_DURATION, 0, 1);
    n.heat = clamp(n.heat + active * 0.12, 0, 1);
    n.remaining = Math.max(0, n.remaining - active);
    if (n.remaining < 1e-8 || n.reservoir < 1e-8) { n.remaining = 0; n.cooldown = 5; }
  }
  const idle = dt - active;
  n.cooldown = Math.max(0, n.cooldown - idle);
  n.heat = clamp(n.heat - idle * 0.1, 0, 1);
  n.reservoir = clamp(n.reservoir + idle * 0.12, 0, 1);
  car.boost = n.remaining;
  return acceleration;
}

export function createRaceSimulation({ players = [], track, random = Math.random } = {}) {
  if (!track || typeof track.sampleTrack !== 'function') throw new TypeError('createRaceSimulation requires sampleTrack(distance)');
  const roster = Array.from(players).slice(0, MAX_CARS).map((player, index) => {
    const p = typeof player === 'string' ? { name: player } : (player || {});
    return { id: p.id ?? p.name ?? index, name: String(p.name ?? p.id ?? `Car ${index + 1}`), color: p.color ?? '#f4c35e', index };
  });
  const trackLength = Math.max(1, finite(track.totalLength, 1));
  const finishDistance = Math.max(1, finite(track.raceDistance, trackLength * 2));
  const cars = [], pickups = [], hazards = [], projectiles = [];
  let canonicalCars = [], time = 0, accumulator = 0, winnerId = null;
  let winnerWasReturned = false, disposed = false, events = [], serial = 0;
  let lastCollisionAt = new Map(), hazardHits = new Set(), pickupHits = new Set();

  // Static road lookup avoids repeated expensive spline sampling per racer.
  const roadCount = clamp(Math.ceil(trackLength / 3), 32, 4096);
  const roadSpacing = trackLength / roadCount;
  const road = Array.from({ length: roadCount }, (_, i) => {
    let source;
    try { source = track.sampleTrack(i * roadSpacing); } catch { source = null; }
    const tangent = safeVector(source?.tangent, { x: 1, y: 0, z: 0 });
    let right = safeVector(source?.right, { x: 0, y: 0, z: 1 });
    if (Math.abs(tangent.x * right.x + tangent.y * right.y + tangent.z * right.z) > 0.96) right = { x: tangent.z, y: 0, z: -tangent.x };
    return { tangent, right, width: Math.max(4, finite(source?.width, finite(track.width, 16))), curvature: 0 };
  });
  road.forEach((point, i) => {
    const a = road[(i + roadCount - 2) % roadCount].tangent, b = road[(i + 2) % roadCount].tangent;
    point.curvature = ((b.x - a.x) * point.right.x + (b.z - a.z) * point.right.z) / (roadSpacing * 4);
  });
  const sample = d => road[Math.floor(wrap(d, trackLength) / roadSpacing) % roadCount];
  const curvatureAt = d => sample(d).curvature;
  const courseGap = (a, b) => wrap(a - b + trackLength / 2, trackLength) - trackLength / 2;
  function emit(type, car, extra = {}) {
    events.push({ type, time, carId: car?.id ?? null, distance: finite(car?.distance), lateral: finite(car?.lateral), intensity: 1, ...extra });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  }
  function createPickups() {
    pickups.length = 0;
    // A reusable row covers the road: EACH driver can collect one item per row
    // per lap. Types and opportunities are identical, with no rank-based gifts.
    ['banana', 'bomb', 'boost', 'banana', 'bomb', 'boost'].forEach((type, gateId) => {
      const distance = trackLength * (0.12 + gateId * 0.145);
      const half = sample(distance).width / 2 - CAR_WIDTH * 0.65;
      const columns = Math.max(2, Math.ceil(half * 2 / 2.8));
      for (let col = 0; col < columns; col++) pickups.push({
        id: `pickup-${gateId}-${col}`, gateId, type, distance,
        lateral: -half + (col + 0.5) * half * 2 / columns, radius: 1.5, active: true,
      });
    });
  }
  function createGrid() {
    const existing = new Map(cars.map(car => [car.id, car]));
    const rawSeed = Number(random());
    const seed = (clamp(Number.isFinite(rawSeed) ? rawSeed : 0, 0, 0.999999999999) * 4294967296) >>> 0;
    const gridRandom = rng(seed ^ 0x93AB2F41);
    const order = [...roster].sort((a, b) => String(a.id).localeCompare(String(b.id)) || a.index - b.index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(gridRandom() * (i + 1)); [order[i], order[j]] = [order[j], order[i]];
    }
    const laneSwap = gridRandom() < 0.5 ? -1 : 1;
    const fresh = order.map((p, gridPosition) => {
      const side = (gridPosition % 2 ? 1 : -1) * laneSwap;
      const strategySeed = Math.floor(gridRandom() * 4294967296) >>> 0;
      const driverRandom = rng(strategySeed);
      const car = existing.get(p.id) || {};
      for (const key of Object.keys(car)) delete car[key];
      Object.assign(car, {
        ...p, gridPosition, distance: -Math.floor(gridPosition / 2) * 6.7,
        lateral: side * 1.55, speed: 0, topSpeed: TOP_SPEED, maxSpeed: TOP_SPEED,
        heading: 0, spin: 0, spinAngle: 0, finished: false,
        lateralVelocity: 0, yawRate: 0, slip: 0, targetSpeed: 0,
        length: CAR_LENGTH, width: CAR_WIDTH, preferredLane: side * 1.8,
        spinDirection: side, stuckTime: 0, previousProgress: -Math.floor(gridPosition / 2) * 6.7,
        boost: 0, brake: 0, damage: 0, draft: 0, drafting: 0, drag: 0, acceleration: 0,
        propulsion: 'electric', motorPowerW: 0, regenW: 0, batteryEnergyJ: BATTERY_J * 0.8, batterySOC: 0.8,
        dragN: 0, downforceN: 0, nitroAcceleration: 0,
        nitro: { reservoir: 1, heat: 0, remaining: 0, cooldown: 0 }, strategySeed,
        offRoad: false, mistakeTimer: 0, mistakeType: null, mistake: null, activeItem: null,
        _finishFraction: null, _random: driverRandom,
        _nextDecision: 0.7 + driverRandom() * 2, _pace: 1, _brakeTiming: 1,
        _nextMistake: 7 + driverRandom() * 14, _itemTimer: 0, _hitImmune: 0,
        _lastPassEvent: -10, _wasOffRoad: false, _passUntil: 0, _passLane: 0, _passingId: null,
      });
      return car;
    });
    cars.splice(0, cars.length, ...fresh);
    canonicalCars = [...cars].sort((a, b) => a.gridPosition - b.gridPosition);
    time = 0; accumulator = 0; winnerId = null; winnerWasReturned = false; serial = 0;
    events = []; lastCollisionAt = new Map(); hazardHits = new Set(); pickupHits = new Set();
    hazards.length = 0; projectiles.length = 0; createPickups();
  }
  function startSpin(car, direction, strength = 1) {
    if (car.finished || car.spin > 0) return;
    car.spin = clamp(0.6 + strength * 0.12, 0.6, 1.2);
    car.spinDirection = direction < 0 ? -1 : 1; car.speed *= 0.68;
    car.lateralVelocity += car.spinDirection * clamp(1 + strength * 0.32, 1, 5.2);
    car.heading += car.spinDirection * 0.12;
    emit('spin', car, { intensity: clamp(strength / 8, 0.25, 1), duration: car.spin });
  }
  function drivingDecision(car, dt) {
    car.mistakeTimer = Math.max(0, car.mistakeTimer - dt);
    if (!car.mistakeTimer) car.mistakeType = null;
    if (time >= car._nextDecision) {
      car._nextDecision = time + 1.8 + car._random() * 2.8;
      // Temporary choices from the SAME distribution, no permanent skill,
      // top-speed or roster-order bonuses.
      car._pace = 0.955 + car._random() * 0.06;
      car._brakeTiming = 0.85 + car._random() * 0.3;
    }
    if (time >= car._nextMistake && car.speed > 12 && car.spin <= 0) {
      car._nextMistake = time + 13 + car._random() * 17;
      const curve = curvatureAt(car.distance + car.speed * 0.5), roll = car._random();
      car.mistakeType = Math.abs(curve) > 0.004 ? (roll < 0.5 ? 'late-brake' : 'wide') : (roll < 0.45 ? 'wide' : 'lift');
      car.mistakeTimer = car.mistakeType === 'lift' ? 1.1 : 1.8 + car._random() * 0.7;
      car._mistakeSide = Math.abs(curve) > 0.002 ? -Math.sign(curve) : (car._random() < 0.5 ? -1 : 1);
      emit('mistake', car, { mistakeType: car.mistakeType, duration: car.mistakeTimer, intensity: 0.55 });
    }
    car.mistake = car.mistakeType;
  }
  function trafficFor(car, snapshot) {
    const near = []; let draft = 0, lead = null, gap = Infinity;
    for (const other of snapshot) {
      if (other.id === car.id || other.finished) continue;
      const longitudinal = other.distance - car.distance;
      if (Math.abs(longitudinal) < 35) near.push(other);
      const side = Math.abs(other.lateral - car.lateral);
      if (longitudinal > CAR_LENGTH && longitudinal < 31 && side < CAR_WIDTH * 1.1) {
        draft = Math.max(draft, clamp((31 - longitudinal) / 22, 0, 1) * (1 - side / (CAR_WIDTH * 1.1)));
      }
      if (longitudinal > 0 && longitudinal < gap && longitudinal < Math.max(13, car.speed * 0.72) && side < CAR_WIDTH * 1.05) {
        lead = other; gap = longitudinal;
      }
    }
    return { near, lead, gap, draft };
  }
  function laneTargetFor(car, curvature, traffic) {
    const limit = Math.max(0.2, sample(car.distance).width / 2 - CAR_WIDTH * 0.78);
    let target = clamp(car.preferredLane, -limit, limit);
    if (Math.abs(curvature) > 0.003) target += Math.sign(curvature) * Math.min(1.15, Math.abs(curvature) * 35);
    const passingCar = traffic.near.find(other => other.id === car._passingId);
    const holdingPass = time < car._passUntil && passingCar && passingCar.distance > car.distance - CAR_LENGTH * 1.6;
    if (holdingPass) target = clamp(car._passLane, -limit, limit);
    const lead = traffic.lead;
    if (!holdingPass && lead && car.speed >= lead.speed - 0.8 && traffic.gap < Math.max(18, car.speed * 0.8)) {
      const left = clamp(lead.lateral - CAR_WIDTH * 1.75, -limit, limit);
      const right = clamp(lead.lateral + CAR_WIDTH * 1.75, -limit, limit);
      const clearance = lane => {
        let score = Math.min(limit - Math.abs(lane), 2) * 0.1;
        for (const other of traffic.near) {
          const ahead = other.distance - car.distance;
          // From race_strategy: check relative-speed prediction AND the lateral
          // path, including a fast car coming from behind. An empty destination
          // alone does not make a lane change safe.
          const predicted = ahead + (other.speed - car.speed) * 0.8;
          if (Math.abs(other.lateral - lane) < CAR_WIDTH * 1.25) {
            score -= 18 / Math.max(1, Math.abs(predicted));
            if (predicted > -7 && predicted < Math.max(8, car.speed * 0.36)) score -= 30;
          }
          if (Math.abs(ahead) < CAR_LENGTH * 1.3 && other.lateral > Math.min(car.lateral, lane) - CAR_WIDTH * 0.8 && other.lateral < Math.max(car.lateral, lane) + CAR_WIDTH * 0.8) score -= 60;
        }
        return score;
      };
      const leftScore = clearance(left), rightScore = clearance(right);
      if (leftScore < -45 && rightScore < -45) return clamp(car.lateral, -limit, limit);
      target = leftScore === rightScore ? (car.gridPosition % 2 ? right : left) : (leftScore > rightScore ? left : right);
      car._passLane = target; car._passUntil = time + 4.5; car._passingId = lead.id;
    }
    if (car.mistakeType === 'wide') target = car._mistakeSide * (limit + 2.1);
    return clamp(target, -limit - 2.5, limit + 2.5);
  }
  function targetSpeedFor(car, curvature, traffic) {
    let target = TOP_SPEED * car._pace + (car.boost > 0 ? 12 : 0);
    const lateBrake = car.mistakeType === 'late-brake';
    const braking = BRAKE_ACCEL * car._brakeTiming * (lateBrake ? 0.42 : 0.86);
    // Brake before bends throughout the stopping horizon. Tire load still
    // limits the actual turn, including if an error delayed braking.
    for (const offset of [0, 12, 25, 43, 68]) {
      const curve = Math.abs(offset ? curvatureAt(car.distance + offset) : curvature);
      const corner = Math.sqrt(CORNER_GRIP * (lateBrake ? 1.18 : 0.88) / Math.max(curve, 0.0001));
      target = Math.min(target, Math.sqrt(corner * corner + 2 * braking * offset));
    }
    if (car.mistakeType === 'lift') target *= 0.76;
    const edge = Math.max(0, Math.abs(car.lateral) + CAR_WIDTH * 0.5 - sample(car.distance).width / 2);
    if (edge > 0) target *= clamp(1 - edge * 0.18, 0.34, 1);
    if (traffic.lead) {
      const safeGap = CAR_LENGTH + 1.2 + car.speed * 0.2;
      if (traffic.gap < safeGap && Math.abs(traffic.lead.lateral - car.lateral) < CAR_WIDTH * 0.95) {
        target = Math.min(target, Math.max(4.5, traffic.lead.speed + (traffic.gap - safeGap) * 1.35));
      }
    }
    return clamp(target, 4.5, TOP_SPEED + 13);
  }
  function integrateCar(car, dt, snapshot) {
    if (car.finished) return;
    car.previousProgress = car.distance; car._finishFraction = null;
    car._hitImmune = Math.max(0, car._hitImmune - dt);
    car._itemTimer = Math.max(0, car._itemTimer - dt); if (!car._itemTimer) car.activeItem = null;
    drivingDecision(car, dt);
    const curvature = curvatureAt(car.distance), roadHalf = sample(car.distance).width / 2, oldSpeed = car.speed;
    const traffic = trafficFor(car, snapshot);
    car.draft += (traffic.draft - car.draft) * clamp(dt * 4, 0, 1); car.drafting = car.draft;
    const envelope = raceForceEnvelope({ speed: car.speed, curvature, draft: car.draft, offRoad: Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf });
    car.dragN = envelope.dragN; car.downforceN = envelope.downforceN;
    car.drag = envelope.dragAccel + envelope.rollingAccel;
    if (car.spin > 0) {
      car.spin = Math.max(0, car.spin - dt); car.spinAngle += car.spinDirection * dt * 7.2;
      car.heading = clamp(car.heading + car.spinDirection * dt * 0.7, -0.65, 0.65);
      car.speed = Math.max(4, car.speed - (5.2 + car.drag * 0.3) * dt);
      car.lateralVelocity *= Math.exp(-1.05 * dt); car.brake = 0;
      car.nitroAcceleration = stepNitro(car, dt, 0); car.motorPowerW = 0; car.regenW = 0;
      if (!car.spin) { car.heading *= 0.3; emit('recovery', car, { recoveryType: 'spin', intensity: 0.7 }); }
    } else {
      car.spinAngle *= Math.exp(-5 * dt);
      const desiredSpeed = targetSpeedFor(car, curvature, traffic); car.targetSpeed = desiredSpeed;
      const error = desiredSpeed - car.speed;
      const engine = Math.min(ENGINE_ACCEL, MOTOR_POWER_W / Math.max(1, car.speed) / MASS);
      const gradient = sample(car.distance).tangent.y * 9.8;
      let throttle = 0;
      if (error > 0) {
        throttle = clamp(error * 0.65 + car.drag / Math.max(1, engine), 0, 1) * (car.mistakeType === 'lift' ? 0.6 : 1);
        car.brake = 0;
      } else {
        car.brake = clamp(-error * 0.7 / BRAKE_ACCEL, 0, 1);
      }
      const drive = raceElectricDrive({ speed: car.speed, throttle, brake: car.brake,
        energyJ: car.batteryEnergyJ, dt, longitudinalAccel: envelope.longitudinalAccel });
      car.batteryEnergyJ = drive.energyJ; car.batterySOC = drive.energyJ / BATTERY_J;
      car.motorPowerW = drive.powerW; car.regenW = drive.regenW;
      car.nitroAcceleration = stepNitro(car, dt, car.brake > 0 ? 0 : Math.max(0, envelope.longitudinalAccel - drive.driveN / MASS));
      car.speed += (drive.acceleration + car.nitroAcceleration - car.drag - gradient) * dt;
      car.speed = clamp(car.speed, 0, TOP_SPEED + 15);
      const targetLane = laneTargetFor(car, curvature, traffic);
      const sideTarget = clamp((targetLane - car.lateral) * 1.2 - car.lateralVelocity * 0.72, -6.5, 6.5);
      const desiredHeading = clamp(Math.atan2(sideTarget, Math.max(5, car.speed)), -0.38, 0.38);
      const demand = car.speed * car.speed * Math.abs(curvature) / envelope.gripAccel;
      const grip = clamp(1 - Math.max(0, demand - 0.92) * 0.7, 0.25, 1);
      const yawLimit = clamp(1.42 - car.speed * 0.009, 0.82, 1.42) * grip;
      car.yawRate = clamp(angleDelta(car.heading, desiredHeading) * 5.2, -yawLimit, yawLimit);
      car.heading = clamp(car.heading + car.yawRate * dt, -0.68, 0.68);
      car.slip = Math.abs(angleDelta(Math.atan2(car.lateralVelocity, Math.max(2, car.speed)), car.heading));
      const offRoad = Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf;
      const lateralGrip = SIDE_GRIP * grip * (offRoad ? 0.42 : 1);
      car.lateralVelocity += (car.speed * Math.sin(car.heading) - car.lateralVelocity) * clamp(lateralGrip * dt, 0, 1);
      // Excess corner load pushes outward and scrubs actual speed/progress.
      car.lateralVelocity -= Math.sign(curvature) * Math.max(0, car.speed * car.speed * Math.abs(curvature) - envelope.gripAccel) * 0.55 * dt;
      if (offRoad) {
        car.speed = Math.max(3.8, car.speed - (4.8 + car.speed * 0.12) * dt);
        car.lateralVelocity -= Math.sign(car.lateral) * 1.4 * dt;
      }
      if (demand > 1.55 && car.slip > 0.18 && car.speed > 17) startSpin(car, -Math.sign(curvature || car.heading || 1), clamp((demand - 1.3) * 2.1, 1.2, 4.5));
    }
    car.acceleration = (car.speed - oldSpeed) / dt;
    car.lateral += car.lateralVelocity * dt;
    const limit = roadHalf + 3.4;
    if (Math.abs(car.lateral) > limit) { car.lateral = Math.sign(car.lateral) * limit; car.lateralVelocity *= -0.22; car.speed *= 0.985; }
    car.offRoad = Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf;
    if (car.offRoad && !car._wasOffRoad) emit('offroad', car, { intensity: 0.6 });
    if (!car.offRoad && car._wasOffRoad) emit('recovery', car, { recoveryType: 'offroad', intensity: 0.6 });
    car._wasOffRoad = car.offRoad;
    car.distance += Math.max(0, car.speed * Math.cos(car.heading)) * dt;
    if (car.speed < 0.65 && car.distance - car.previousProgress < 0.2) car.stuckTime += dt;
    else car.stuckTime = Math.max(0, car.stuckTime - dt * 2.5);
    if (car.stuckTime > 3.25) {
      car.stuckTime = 0; car.speed = Math.max(car.speed, 6.8);
      car.lateral = clamp(car.lateral, -roadHalf * 0.55, roadHalf * 0.55); car.lateralVelocity *= 0.2; car.heading *= 0.35;
      emit('recovery', car, { recoveryType: 'unstuck', intensity: 0.6 });
    }
  }
  function resolveCollisions() {
    // Contacts accumulate against the same post-motion state. Public array
    // iteration order cannot grant an earlier AI/collision update advantage.
    const shifts = new Map(canonicalCars.map(car => [car.id, { d: 0, l: 0, v: 0, side: 0 }]));
    for (let i = 0; i < canonicalCars.length; i++) {
      const a = canonicalCars[i]; if (a.finished) continue;
      for (let j = i + 1; j < canonicalCars.length; j++) {
        const b = canonicalCars[j]; if (b.finished) continue;
        const long = b.distance - a.distance, side = b.lateral - a.lateral;
        if (Math.abs(long) > CAR_LENGTH * 1.08 || Math.abs(side) > CAR_WIDTH * 1.32) continue;
        let nxRaw = long / (CAR_LENGTH * 0.52), nyRaw = side / (CAR_WIDTH * 0.62);
        const ellipse = nxRaw * nxRaw + nyRaw * nyRaw; if (ellipse >= 1) continue;
        if (Math.hypot(nxRaw, nyRaw) < 1e-5) { nxRaw = 0.15; nyRaw = a.preferredLane <= b.preferredLane ? 1 : -1; }
        const normal = Math.hypot(nxRaw, nyRaw), nx = nxRaw / normal, ny = nyRaw / normal;
        const separation = (1 - Math.sqrt(ellipse)) * Math.min(CAR_LENGTH * 0.52, CAR_WIDTH * 0.62) * 0.52;
        const da = shifts.get(a.id), db = shifts.get(b.id);
        da.d -= nx * separation; db.d += nx * separation; da.l -= ny * separation; db.l += ny * separation;
        const closing = -((b.speed - a.speed) * nx + (b.lateralVelocity - a.lateralVelocity) * ny);
        if (closing <= 0.25) continue;
        const impulse = Math.min(12, closing * 0.56);
        da.v -= impulse * nx + a.speed * 0.015; db.v += impulse * nx - b.speed * 0.015;
        da.side -= impulse * ny * 0.42; db.side += impulse * ny * 0.42;
        const key = `${a.gridPosition}:${b.gridPosition}`;
        if (time - (lastCollisionAt.get(key) ?? -10) > 0.38) {
          lastCollisionAt.set(key, time);
          const intensity = clamp(closing / 13, 0.22, 1);
          emit('collision', a, { otherCarId: b.id, intensity, distance: (a.distance + b.distance) / 2, lateral: (a.lateral + b.lateral) / 2 });
          if (closing > 8.8) {
            const hitSide = ny === 0 ? (a.preferredLane < 0 ? 1 : -1) : Math.sign(ny);
            da.spin = -hitSide; db.spin = hitSide; da.strength = db.strength = intensity * 5.4;
          }
        }
      }
    }
    for (const car of canonicalCars) {
      if (car.finished) continue;
      const delta = shifts.get(car.id);
      car.distance += delta.d; car.lateral += delta.l; car.speed = Math.max(0, car.speed + delta.v); car.lateralVelocity += delta.side;
      if (delta.spin) startSpin(car, delta.spin, delta.strength);
    }
  }
  function useItem(car, pickup) {
    car.activeItem = pickup.type; car._itemTimer = 1.1;
    emit('item-pickup', car, { itemType: pickup.type, pickupId: pickup.id, intensity: 0.6 });
    if (pickup.type === 'boost') {
      const n = car.nitro;
      if (n.remaining <= 0 && n.cooldown <= 0 && n.reservoir >= 0.35) {
        n.remaining = BOOST_DURATION * Math.min(1, n.reservoir); car.boost = n.remaining;
        emit('boost', car, { duration: car.boost, intensity: 0.9, propulsion: 'electric-overdrive' });
      }
    } else if (pickup.type === 'banana') {
      const hazard = { id: `banana-${++serial}`, type: 'banana', ownerId: car.id, distance: car.distance - CAR_LENGTH * 1.2, lateral: car.lateral, age: 0, ttl: 22, armed: false };
      if (hazards.length >= MAX_BANANAS) hazards.shift(); hazards.push(hazard);
      emit('banana-drop', car, { hazardId: hazard.id, distance: hazard.distance, lateral: hazard.lateral, intensity: 0.6 });
    } else if (pickup.type === 'bomb') {
      const projectile = { id: `bomb-${++serial}`, type: 'bomb', ownerId: car.id, distance: car.distance + CAR_LENGTH * 0.8, lateral: car.lateral, speed: Math.max(23, car.speed + 18), age: 0, ttl: 3.6, fuse: 3 };
      if (projectiles.length >= MAX_BOMBS) projectiles.shift(); projectiles.push(projectile);
      emit('bomb-launch', car, { projectileId: projectile.id, distance: projectile.distance, lateral: projectile.lateral, intensity: 0.65 });
    }
  }
  function collectItems(car) {
    if (car.finished || car.distance < 0) return;
    for (const pickup of pickups) {
      if (!pickup.active) continue;
      const lap = Math.round((car.distance - pickup.distance) / trackLength); if (lap < 0) continue;
      const at = pickup.distance + lap * trackLength, key = `${car.gridPosition}:${pickup.gateId}:${lap}`;
      if (pickupHits.has(key)) continue;
      const swept = at >= Math.min(car.previousProgress, car.distance) - CAR_LENGTH * 0.4 && at <= Math.max(car.previousProgress, car.distance) + CAR_LENGTH * 0.4;
      if (!swept || Math.abs(car.lateral - pickup.lateral) > pickup.radius + CAR_WIDTH * 0.45) continue;
      pickupHits.add(key); useItem(car, pickup);
    }
  }
  function applyTrackHazards(car) {
    const staticHazards = Array.isArray(track.hazards) ? track.hazards : [];
    for (let i = 0; i < staticHazards.length; i++) {
      const h = staticHazards[i] || {}, base = wrap(finite(h.distance), trackLength);
      const lap = Math.round((car.distance - base) / trackLength), key = `${car.gridPosition}:${i}:${lap}`;
      if (hazardHits.has(key)) continue;
      const radius = Math.max(0.5, finite(h.radius, h.type === 'oil' ? 2.2 : 1.7));
      if (Math.abs(car.distance - (base + lap * trackLength)) > Math.max(1.7, CAR_LENGTH * 0.42)) continue;
      if (Math.abs(car.lateral - finite(h.lateral ?? h.offset)) > radius + CAR_WIDTH * 0.45) continue;
      hazardHits.add(key);
      const type = String(h.type || 'debris').toLowerCase(), side = car.lateral >= finite(h.lateral ?? h.offset) ? 1 : -1;
      if (type === 'oil' || type === 'water') {
        car.lateralVelocity += side * (type === 'oil' ? 4.6 : 2.8); car.speed *= type === 'oil' ? 0.78 : 0.88;
        emit('oil', car, { hazardType: type, intensity: 0.85 }); startSpin(car, side, type === 'oil' ? 3.2 : 1.8);
      } else {
        car.speed = Math.max(4, car.speed - (type === 'cone' ? 5.5 : 3.2)); car.lateralVelocity += side * 1.1;
        emit(type === 'cone' ? 'cone' : 'hazard', car, { hazardType: type, intensity: 0.48 });
      }
    }
  }
  function explodeBomb(p) {
    const owner = canonicalCars.find(car => car.id === p.ownerId);
    emit('bomb-explode', owner, { projectileId: p.id, distance: p.distance, lateral: p.lateral, radius: BLAST_RADIUS, intensity: 1 });
    for (const car of canonicalCars) {
      if (car.finished || car._hitImmune > 0 || (car.id === p.ownerId && p.age < 0.7)) continue;
      const gap = courseGap(car.distance, p.distance), side = car.lateral - p.lateral, radius = Math.hypot(gap, side);
      if (radius > BLAST_RADIUS) continue;
      const strength = 1 - radius / BLAST_RADIUS;
      car.speed *= 0.72 - strength * 0.18; car.lateralVelocity += Math.sign(side || (car.gridPosition % 2 ? 1 : -1)) * (2.2 + strength * 2.5);
      car._hitImmune = 1.7; startSpin(car, Math.sign(side || 1), 1.5 + strength * 2.5);
      emit('bomb-hit', car, { projectileId: p.id, ownerId: p.ownerId, intensity: 0.5 + strength * 0.5 });
    }
  }
  function updateItems(dt) {
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i]; h.age += dt; h.armed = h.age >= 0.28; let hit = false;
      if (h.armed) {
        const contacts = canonicalCars.filter(car => !car.finished && car._hitImmune <= 0 && !(car.id === h.ownerId && h.age < 1.1) &&
          Math.abs(courseGap(car.distance, h.distance)) < CAR_LENGTH * 0.42 + 0.65 && Math.abs(car.lateral - h.lateral) < CAR_WIDTH * 0.5 + 0.8)
          .sort((a, b) => Math.abs(courseGap(a.distance, h.distance)) - Math.abs(courseGap(b.distance, h.distance)) || a.gridPosition - b.gridPosition);
        if (contacts.length) {
          const car = contacts[0]; car._hitImmune = 1.7;
          startSpin(car, Math.sign(car.lateral - h.lateral || car.lateralVelocity || 1), 2.8);
          emit('banana-hit', car, { hazardId: h.id, ownerId: h.ownerId, intensity: 0.85 }); hit = true;
        }
      }
      if (hit || h.age >= h.ttl) hazards.splice(i, 1);
    }
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.age += dt; p.fuse -= dt; p.distance += p.speed * dt;
      const hit = p.age > 0.2 && canonicalCars.some(car => !car.finished && car.id !== p.ownerId && Math.abs(courseGap(car.distance, p.distance)) < 2.6 && Math.abs(car.lateral - p.lateral) < 1.55);
      if (hit || p.fuse <= 0 || p.age >= p.ttl) { explodeBomb(p); projectiles.splice(i, 1); }
    }
  }
  function fixedStep(dt) {
    time += dt;
    const snapshot = canonicalCars.map(car => ({ id: car.id, distance: car.distance, lateral: car.lateral, speed: car.speed, finished: car.finished }));
    for (const car of canonicalCars) integrateCar(car, dt, snapshot);
    resolveCollisions();
    for (const car of canonicalCars) if (!car.finished) { applyTrackHazards(car); collectItems(car); }
    updateItems(dt);
    const finishers = [], currentById = new Map(canonicalCars.map(car => [car.id, car]));
    for (let i = 0; i < canonicalCars.length; i++) {
      const car = canonicalCars[i]; if (car.finished) continue;
      if (car.previousProgress < finishDistance && car.distance >= finishDistance) {
        car._finishFraction = clamp((finishDistance - car.previousProgress) / Math.max(1e-8, car.distance - car.previousProgress), 0, 1);
        car.finished = true; car.finishTime = time - dt + dt * car._finishFraction; finishers.push(car);
      }
      if (car.speed < 7 || time - car._lastPassEvent < 0.7) continue;
      const before = snapshot[i];
      const passed = snapshot.find(other => other.id !== car.id && !other.finished && other.distance > before.distance && currentById.get(other.id).distance < car.distance);
      if (passed) { car._lastPassEvent = time; emit('overtake', car, { otherCarId: passed.id, intensity: 0.55 }); }
    }
    finishers.sort((a, b) => a._finishFraction - b._finishFraction || a.gridPosition - b.gridPosition);
    if (finishers.length && winnerId === null) {
      winnerId = finishers[0].id; emit('finish', finishers[0], { finishDistance, finishTime: finishers[0].finishTime });
    }
  }
  function update(dt) {
    if (disposed) return null;
    accumulator = Math.min(MAX_FRAME_DELTA, accumulator + clamp(finite(dt), 0, MAX_FRAME_DELTA));
    let steps = 0;
    while (accumulator + 1e-10 >= STEP && steps < MAX_STEPS_PER_UPDATE) { fixedStep(STEP); accumulator -= STEP; steps++; }
    if (steps >= MAX_STEPS_PER_UPDATE) accumulator = 0;
    if (winnerId !== null && !winnerWasReturned) { winnerWasReturned = true; return winnerId; }
    return null;
  }
  createGrid();
  return {
    get cars() { return cars; }, get time() { return time; }, get winner() { return winnerId; }, get finishDistance() { return finishDistance; },
    get pickups() { return pickups; }, get hazards() { return hazards; }, get projectiles() { return projectiles; },
    get powerups() { return { pickups, hazards, projectiles, time }; }, update,
    reset() { if (!disposed) createGrid(); },
    dispose() {
      disposed = true; cars.length = 0; canonicalCars = []; events.length = 0;
      pickups.length = 0; hazards.length = 0; projectiles.length = 0; hazardHits.clear(); pickupHits.clear(); lastCollisionAt.clear();
    },
    drainEvents() { const drained = events; events = []; return drained; },
  };
}
export const RACE_PHYSICS = Object.freeze({
  step: STEP, maxFrameDelta: MAX_FRAME_DELTA, maxCars: MAX_CARS,
  carLength: CAR_LENGTH, carWidth: CAR_WIDTH, topSpeed: TOP_SPEED,
  engineAccel: ENGINE_ACCEL, brakeAccel: BRAKE_ACCEL, cornerGrip: CORNER_GRIP,
  massKg: MASS, batteryJ: BATTERY_J, motorPowerW: MOTOR_POWER_W,
  maxBananas: MAX_BANANAS, maxBombs: MAX_BOMBS, boostDuration: BOOST_DURATION, blastRadius: BLAST_RADIUS,
});
