/**
 * Deterministic fixed-step arcade racing, not an engineering vehicle model.
 * Bounded, game-balanced vehicle profiles alter speed, grip and durability.
 * Traffic, slipstreams, errors and items determine the actual first crossing.
 */
import { createRampLayout, rampHeightAt, rampSlopeAt } from './race3d-ramps.js?v=20261025-supercars';

const STEP = 1 / 120, MAX_FRAME_DELTA = 0.25, MAX_STEPS_PER_UPDATE = 30;
const MAX_CARS = 60, CAR_LENGTH = 4.4, CAR_WIDTH = 1.9, TOP_SPEED = 43;
const ENGINE_ACCEL = 9.5, BRAKE_ACCEL = 15, SIDE_GRIP = 5.8, CORNER_GRIP = 12.4;
const MAX_EVENTS = 240, MAX_BANANAS = 24, MAX_BOMBS = MAX_CARS, MAX_MISSILES = 12, MAX_WAVES = 16;
const BOOST_DURATION = 25, BLAST_RADIUS = 7.5;
const RAMP_GRAVITY = 9.81, MAX_TRICK_BONUS = 10, TRICK_BONUS_PER_FLIP = 3;
const FLIGHT_DURATION = 25, FLIGHT_HEIGHT = 55, ROCKET_DURATION = 25, SHIELD_DURATION = 30, FREEZE_DURATION = 10;
const REPAIR_DURATION = 25, SPIN_DURATION = 10;
const DAMAGE_LEVELS = 20, REPLACEMENT_DELAY = 2, REPLACEMENT_RECOVERY = 8;
export const RACE_POWER_TYPES = Object.freeze(['launch', 'rocket', 'boost', 'bomb', 'shield', 'banana', 'missile', 'shockwave', 'freeze', 'repair']);
// Fictional competition calibration, never manufacturer specifications. The
// shared force model receives the bounded game profile of each entrant.
const WHEELBASE = 2.72, WHEEL_TRACK = 1.66, CG_HEIGHT = 0.48;
// Fixed measurements of the five authored GLB tyre centers, in track metres.
// Keeping these in physics makes outcomes independent of asset download timing.
export const RACE_CAR_GEOMETRY = Object.freeze({"lamborghini-gallardo":{"wheelbase":2.603420247,"trackWidth":1.650846275,"frontAxle":1.132803034,"rearAxle":-1.470617213,"corners":[{"id":"front-left","longitudinal":1.132803034,"lateral":-0.822556439,"radius":0.328365065},{"id":"front-right","longitudinal":1.132803034,"lateral":0.822502225,"radius":0.328365065},{"id":"rear-left","longitudinal":-1.470617213,"lateral":-0.828344051,"radius":0.328365065},{"id":"rear-right","longitudinal":-1.470617213,"lateral":0.828289836,"radius":0.328365065}]},"tesla-roadster":{"wheelbase":2.968683725,"trackWidth":1.591169129,"frontAxle":1.4892632154999998,"rearAxle":-1.4794205095,"corners":[{"id":"front-left","longitudinal":1.489288389,"lateral":-0.80865614,"radius":0.330251072},{"id":"front-right","longitudinal":1.489238042,"lateral":0.773956954,"radius":0.330251072},{"id":"rear-left","longitudinal":-1.479418701,"lateral":-0.799925824,"radius":0.349751763},{"id":"rear-right","longitudinal":-1.479422318,"lateral":0.799799339,"radius":0.349751763}]},"f1-2026":{"wheelbase":3.215814301,"trackWidth":1.410420294,"frontAxle":1.375160806,"rearAxle":-1.840653495,"corners":[{"id":"front-left","longitudinal":1.375160806,"lateral":-0.722138824,"radius":0.33860667},{"id":"front-right","longitudinal":1.375160806,"lateral":0.722138824,"radius":0.33975281},{"id":"rear-left","longitudinal":-1.840653495,"lateral":-0.68828147,"radius":0.339423789},{"id":"rear-right","longitudinal":-1.840653495,"lateral":0.68828147,"radius":0.339764818}]},"gt3":{"wheelbase":2.572544035,"trackWidth":1.582335626,"frontAxle":1.437528175,"rearAxle":-1.13501586,"corners":[{"id":"front-left","longitudinal":1.437528175,"lateral":-0.805417519,"radius":0.348633288},{"id":"front-right","longitudinal":1.437528175,"lateral":0.805438111,"radius":0.348633288},{"id":"rear-left","longitudinal":-1.13501586,"lateral":-0.776947476,"radius":0.34903286},{"id":"rear-right","longitudinal":-1.13501586,"lateral":0.776868145,"radius":0.348633288}]},"car-concept":{"wheelbase":2.954725545,"trackWidth":2.069653499,"frontAxle":1.31575869,"rearAxle":-1.6389668545,"corners":[{"id":"front-left","longitudinal":1.314854988,"lateral":-1.031054968,"radius":0.403838064},{"id":"front-right","longitudinal":1.316662392,"lateral":1.029807577,"radius":0.405380693},{"id":"rear-left","longitudinal":-1.638966849,"lateral":-1.039008833,"radius":0.403838127},{"id":"rear-right","longitudinal":-1.63896686,"lateral":1.039435619,"radius":0.405380693}]}});
const MASS = 900, BATTERY_J = 180e6, MOTOR_POWER_W = 180000;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const wrap = (d, length) => ((d % length) + length) % length;
const angleDelta = (from, to) => wrap(to - from + Math.PI, Math.PI * 2) - Math.PI;
export const RACE_POWER_DURATIONS = Object.freeze({ launch: FLIGHT_DURATION, rocket: ROCKET_DURATION,
  boost: BOOST_DURATION, shield: SHIELD_DURATION, freeze: FREEZE_DURATION, repair: REPAIR_DURATION,
  banana: SPIN_DURATION, missile: SPIN_DURATION, shockwave: SPIN_DURATION, bomb: SPIN_DURATION });
/** SI force inputs; bounds protect the arcade from incomplete/custom profiles. */
export function normalizeVehicleSpec(spec = {}) {
  return Object.freeze({
    massKg: clamp(finite(spec.massKg, MASS), 650, 2600), powerKW: clamp(finite(spec.powerKW, MOTOR_POWER_W / 1000), 80, 1400),
    torqueNm: clamp(finite(spec.torqueNm, 460), 150, 2200), dragCoefficient: clamp(finite(spec.dragCoefficient, .405), .18, 1.5),
    frontalAreaM2: clamp(finite(spec.frontalAreaM2, 2), 1.2, 3), downforceCoefficient: clamp(finite(spec.downforceCoefficient, .435), 0, 5),
    brakeDecelMps2: clamp(finite(spec.brakeDecelMps2, BRAKE_ACCEL), 7, 28), tireGrip: clamp(finite(spec.tireGrip, 1.12), .8, 2.1),
    topSpeedKph: clamp(finite(spec.topSpeedKph, TOP_SPEED * 3.6), 90, 500), engineType: String(spec.engineType || 'electric'),
    wheelbaseM: clamp(finite(spec.wheelbaseM, WHEELBASE), 2.2, 3.8), rampPreference: clamp(finite(spec.rampPreference, 1), 0, 1),
    priority: String(spec.priority || 'balanced'),
  });
}
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
export function raceForceEnvelope({ speed = 0, curvature = 0, draft = 0, offRoad = false, gripFactor = 1, vehicleSpec } = {}) {
  speed = Math.max(0, finite(speed)); curvature = finite(curvature); draft = finite(draft);
  const q = 0.5 * 1.225 * Math.max(0, speed) ** 2;
  const spec = vehicleSpec || normalizeVehicleSpec(), massKg = spec.massKg;
  const dragN = q * spec.dragCoefficient * spec.frontalAreaM2 * (1 - 0.24 * clamp(draft, 0, 1));
  const downforceN = Math.min(massKg * 9.81 * 2.5, q * spec.downforceCoefficient * spec.frontalAreaM2);
  const gripAccel = spec.tireGrip * clamp(finite(gripFactor, 1), 0.75, 1.25) * (offRoad ? 0.45 : 1) * (9.81 + downforceN / massKg);
  const lateralAccel = speed * speed * Math.abs(curvature);
  const lateralUse = clamp(lateralAccel / gripAccel, 0, 1);
  const longitudinalAccel = gripAccel * Math.sqrt(Math.max(0, 1 - lateralUse * lateralUse));
  return { dragN, downforceN, dragAccel: dragN / massKg,
    rollingAccel: 0.16 + (offRoad ? 2.1 : 0), gripAccel, lateralAccel,
    longitudinalAccel, slip: Math.max(0, lateralAccel / gripAccel - 1) };
}
export function raceElectricDrive({ speed = 0, throttle = 0, brake = 0, energyJ = BATTERY_J * 0.8, dt = STEP, longitudinalAccel = 11, accelerationFactor = 1, vehicleSpec } = {}) {
  speed = Math.max(0, finite(speed)); dt = clamp(finite(dt), 0, 0.1);
  throttle = finite(throttle); brake = finite(brake); energyJ = finite(energyJ);
  const driveFactor = clamp(finite(accelerationFactor, 1), 0.35, 1.3);
  const spec = vehicleSpec || normalizeVehicleSpec(), massKg = spec.massKg;
  const electric = /electric|hybrid/i.test(spec.engineType), energy = clamp(energyJ, 0, BATTERY_J), soc = energy / BATTERY_J;
  const gripN = Math.max(0, finite(longitudinalAccel)) * massKg;
  const availablePower = spec.powerKW * 1000 * driveFactor * (electric ? clamp(soc / 0.08, .3, 1) : 1);
  // A short launch gear translates engine torque to tyre force; beyond it,
  // available wheel power (P/v) naturally limits acceleration.
  const torqueForce = spec.torqueNm * 8 * .92 / .34;
  const driveN = brake > 0 ? 0 : Math.min(torqueForce * driveFactor, availablePower * .92 / Math.max(speed, 1), gripN) * clamp(throttle, 0, 1);
  const brakeN = Math.min(clamp(brake, 0, 1) * spec.brakeDecelMps2 * massKg, gripN);
  const regenW = electric ? Math.min(brakeN * speed, 70000 * clamp((1 - soc) / 0.08, 0, 1), (BATTERY_J - energy) / Math.max(dt * 0.92, 1e-6)) : 0;
  const powerW = driveN * speed / 0.92;
  return { driveN, brakeN, regenW, powerW,
    energyJ: electric ? clamp(energy + (regenW * 0.92 - powerW) * dt, 0, BATTERY_J) : energy,
    acceleration: (driveN - brakeN) / massKg };
}
/** Four tyre normal loads, including fore/aft and lateral weight transfer.
 * Compression is displacement from static ride height, not a cosmetic sine wave.
 */
export function raceWheelLoads({ acceleration = 0, lateralAcceleration = 0, downforceN = 0, massKg = MASS, wheelbase = WHEELBASE, trackWidth = WHEEL_TRACK, grounded = true, landingImpulse = 0 } = {}) {
  const total = grounded ? Math.max(0, massKg * 9.81 + finite(downforceN)) : 0;
  const front = clamp(.47 - finite(acceleration) * CG_HEIGHT / (9.81 * wheelbase), .12, .85);
  const right = clamp(.5 - finite(lateralAcceleration) * CG_HEIGHT / (9.81 * trackWidth), .1, .9);
  return [['front-left', front * (1-right), .47/2], ['front-right', front * right, .47/2],
    ['rear-left', (1-front)*(1-right), .53/2], ['rear-right', (1-front)*right, .53/2]].map(([id, share, staticShare]) => ({
      id, load: grounded ? share : 0, normalLoadN: total * share,
      compression: grounded ? clamp((total * share - massKg * 9.81 * staticShare) / 38000 + finite(landingImpulse) * .075, -.07, .105) : -.085,
    }));
}

function stepNitro(car, dt, tractionAcceleration) {
  const n = car.nitro;
  const active = Math.min(dt, n.remaining, n.reservoir * BOOST_DURATION);
  let acceleration = 0;
  if (active > 0) {
    acceleration = Math.min(Math.max(0, tractionAcceleration), 8.5 / (1 + (car.speed / 36) ** 2) * (1 - 0.65 * n.heat)) * active / dt;
    n.reservoir = clamp(n.reservoir - active / BOOST_DURATION, 0, 1);
      n.heat = clamp(n.heat + active * 0.12 * 6 / BOOST_DURATION, 0, 1);
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
    return { id: p.id ?? p.name ?? index, name: String(p.name ?? p.id ?? `Car ${index + 1}`), color: p.color ?? '#f4c35e', index,
      racerType: p.racerType || null, vehicleName: p.vehicleName || null, category: p.category || null,
      speedFactor: clamp(finite(p.speedFactor, p.racerType === 'snail' ? 0.42 : 1), 0.38, 1.12),
      accelerationFactor: clamp(finite(p.accelerationFactor, p.racerType === 'snail' ? 0.48 : 1), 0.35, 1.3),
      gripFactor: clamp(finite(p.gripFactor, 1), 0.75, 1.25),
      durabilityFactor: clamp(finite(p.durabilityFactor, 1), 0.7, 1.6),
      vehicleSpec: normalizeVehicleSpec(p.vehicleSpec), hasVehicleSpec: !!p.vehicleSpec,
    };
  });
  const trackLength = Math.max(1, finite(track.totalLength, 1));
  const finishDistance = Math.max(1, finite(track.raceDistance, trackLength * 5));
  const cars = [], pickups = [], hazards = [], projectiles = [], waves = [], results = [];
  const ramps = createRampLayout(trackLength);
  let canonicalCars = [], time = 0, accumulator = 0, winnerId = null;
  let winnerWasReturned = false, disposed = false, events = [], serial = 0;
  let lastCollisionAt = new Map(), hazardHits = new Set(), pickupHits = new Set(), rampHits = new Set();

  // Static road lookup avoids repeated expensive spline sampling per racer.
  const roadCount = clamp(Math.ceil(trackLength / 3), 32, 4096);
  const roadSpacing = trackLength / roadCount;
  const road = Array.from({ length: roadCount }, (_, i) => {
    let source;
    try { source = track.sampleTrack(i * roadSpacing); } catch { source = null; }
    const tangent = safeVector(source?.tangent, { x: 1, y: 0, z: 0 });
    let right = safeVector(source?.right, { x: 0, y: 0, z: 1 });
    if (Math.abs(tangent.x * right.x + tangent.y * right.y + tangent.z * right.z) > 0.96) right = { x: tangent.z, y: 0, z: -tangent.x };
    return { tangent, right, y: finite(source?.position?.y), bank: finite(source?.bank), width: Math.max(4, finite(source?.width, finite(track.width, 16))), curvature: 0 };
  });
  road.forEach((point, i) => {
    const a = road[(i + roadCount - 2) % roadCount].tangent, b = road[(i + 2) % roadCount].tangent;
    point.curvature = ((b.x - a.x) * point.right.x + (b.z - a.z) * point.right.z) / (roadSpacing * 4);
  });
  const sample = d => road[Math.floor(wrap(d, trackLength) / roadSpacing) % roadCount];
  function roadSurfaceAt(distance, lateral = 0) {
    const position = wrap(distance, trackLength) / roadSpacing, index = Math.floor(position), u = position - index;
    const a = road[index % roadCount], b = road[(index + 1) % roadCount];
    const bank = a.bank + (b.bank-a.bank)*u;
    const rightY = a.right.y + (b.right.y-a.right.y)*u;
    return { y: a.y + (b.y-a.y)*u + (Math.tan(bank)+rightY)*lateral + .035,
      grade: Math.asin(clamp(a.tangent.y + (b.tangent.y-a.tangent.y)*u, -.99, .99)), bank };
  }
  const defaultCornerOffsets = [
    {id:'front-left', longitudinal:WHEELBASE/2, lateral:-WHEEL_TRACK/2},
    {id:'front-right', longitudinal:WHEELBASE/2, lateral:WHEEL_TRACK/2},
    {id:'rear-left', longitudinal:-WHEELBASE/2, lateral:-WHEEL_TRACK/2},
    {id:'rear-right', longitudinal:-WHEELBASE/2, lateral:WHEEL_TRACK/2},
  ];
  const curvatureAt = d => sample(d).curvature;
  const courseGap = (a, b) => wrap(a - b + trackLength / 2, trackLength) - trackLength / 2;
  function emit(type, car, extra = {}) {
    events.push({ type, time, carId: car?.id ?? null, distance: finite(car?.distance), lateral: finite(car?.lateral), intensity: 1, ...extra });
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  }
  function createPickups(itemRandom) {
    pickups.length = 0;
    // A reusable row covers the road: EACH driver can collect one item per row
    // per lap. Types and opportunities are identical, with no rank-based gifts.
    const types = [...RACE_POWER_TYPES];
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(itemRandom() * (i + 1)); [types[i], types[j]] = [types[j], types[i]];
    }
    types.forEach((type, gateId) => {
      const distance = trackLength * (0.06 + gateId * 0.09);
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
      const geometry = RACE_CAR_GEOMETRY[p.racerType];
      for (const key of Object.keys(car)) delete car[key];
      Object.assign(car, {
        ...p, gridPosition, distance: -Math.floor(gridPosition / 2) * 6.7,
        lateral: side * 1.55, speed: 0, topSpeed: p.hasVehicleSpec ? p.vehicleSpec.topSpeedKph / 3.6 : TOP_SPEED * p.speedFactor,
        maxSpeed: p.hasVehicleSpec ? p.vehicleSpec.topSpeedKph / 3.6 : TOP_SPEED * p.speedFactor,
        heading: 0, spin: 0, spinAngle: 0, finished: false,
        lateralVelocity: 0, yawRate: 0, slip: 0, targetSpeed: 0,
        length: CAR_LENGTH, width: CAR_WIDTH, massKg: p.vehicleSpec.massKg, wheelbase: geometry?.wheelbase || p.vehicleSpec.wheelbaseM,
        frontAxle: geometry?.frontAxle || p.vehicleSpec.wheelbaseM/2, rearAxle: geometry?.rearAxle || -p.vehicleSpec.wheelbaseM/2,
        wheelOffsets: geometry?.corners || defaultCornerOffsets.map(c=>({...c,longitudinal:c.longitudinal*p.vehicleSpec.wheelbaseM/WHEELBASE})),
        trackWidth: geometry?.trackWidth || WHEEL_TRACK, brakeDecelMps2: p.vehicleSpec.brakeDecelMps2, preferredLane: side * 1.8,
        spinDirection: side, stuckTime: 0, previousProgress: -Math.floor(gridPosition / 2) * 6.7,
        boost: 0, brake: 0, damage: 0, damageLevel: 0, hitPoints: 100,
        replacements: 0, replacementPending: 0, replacementRemaining: 0,
        draft: 0, drafting: 0, drag: 0, acceleration: 0,
        propulsion: p.vehicleSpec.engineType, engineType: p.vehicleSpec.engineType, motorPowerW: 0, regenW: 0, batteryEnergyJ: BATTERY_J * 0.8, batterySOC: 0.8,
        dragN: 0, downforceN: 0, nitroAcceleration: 0,
        nitro: { reservoir: 1, heat: 0, remaining: 0, cooldown: 0 }, strategySeed,
        offRoad: false, mistakeTimer: 0, mistakeType: null, mistake: null, activeItem: null,
        flightHeight: 0, flightRemaining: 0, flightDuration: FLIGHT_DURATION, verticalVelocity: 0, landingImpulse: 0,
        supportHeight: 0, supportY: roadSurfaceAt(-Math.floor(gridPosition / 2) * 6.7, side * 1.55).y, supportPitch: 0, supportRoll: 0, wheelContacts: [],
        rampTargetId: null, rampTargetLateral: 0, rampTargetDistance: 0, rampSeeking: false,
        flightKind: null, rampState: 'ground', rampId: null, rampHeight: 0, rampPitch: 0,
        trickAngle: 0, trickFlips: 0, completedFlips: 0, trickSpeedBonus: 0, rampTakeoffs: 0,
        repairRemaining: 0, _rampFlightElapsed: 0, _rampTakeoffHeight: 0, _rampTakeoffVelocity: 0, _rampTakeoffPitch: 0,
        rocketRemaining: 0, rocketAcceleration: 0, shieldRemaining: 0, freezeRemaining: 0, lateralAcceleration: 0,
        _lostSpeed: 0, _lastShieldEvent: -10,
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
    events = []; lastCollisionAt = new Map(); hazardHits = new Set(); pickupHits = new Set(); rampHits = new Set();
    hazards.length = 0; projectiles.length = 0; waves.length = 0; results.length = 0;
    createPickups(rng(seed ^ 0x72F1C843));
    for (const car of cars) updateWheelSupport(car);
  }
  function startSpin(car, direction, strength = 1, duration = null) {
    if (car.finished || car.spin > 0) return;
    car.spin = duration === null ? clamp(0.6 + strength * 0.12, 0.6, 1.2) : clamp(duration, .6, 12);
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
      // Driver decisions use the SAME distribution for every vehicle profile;
      // names and roster order never grant extra skill or pace bonuses.
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
  function aimForRamp(car, traffic) {
    car.rampSeeking = false; car.rampTargetId = null;
    if (car.flightRemaining > 0 || car.spin > 0 || car.vehicleSpec.rampPreference <= 0) return null;
    let next = null;
    for (const ramp of ramps) {
      let lap = Math.max(0, Math.ceil((car.distance - ramp.distance - ramp.length + car.rearAxle) / trackLength));
      const start = ramp.distance + lap * trackLength;
      if (start > finishDistance || rampHits.has(`${car.gridPosition}:${ramp.id}:${lap}`)) continue;
      const gap = start - car.distance;
      const horizon = Math.max(95, car.speed * (3.6 + car.vehicleSpec.rampPreference * 2));
      if (gap > horizon || gap < -ramp.length+car.rearAxle) continue;
      if (!next || start < next.start) next = { ramp, start, gap };
    }
    if (!next) return null;
    const target = next.ramp.lateral;
    car.rampSeeking = true; car.rampTargetId = next.ramp.id;
    car.rampTargetLateral = target; car.rampTargetDistance = next.gap;
    // Commit early, but wait for a side-by-side car before crossing its lane.
    // Longitudinal following brakes below queue traffic safely onto the deck.
    const crossingBlocked = traffic.near.some(other => Math.abs(other.distance-car.distance) < CAR_LENGTH*1.1 &&
      other.lateral > Math.min(car.lateral,target)+.15 && other.lateral < Math.max(car.lateral,target)-.15);
    if (crossingBlocked && next.gap > 22) return car.lateral;
    return target;
  }
  function laneTargetFor(car, curvature, traffic) {
    const limit = Math.max(0.2, sample(car.distance).width / 2 - CAR_WIDTH * 0.78);
    const rampAim = aimForRamp(car, traffic);
    if (rampAim !== null) return clamp(rampAim, -limit, limit);
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
    const bonusScale = Math.min(1, car.speedFactor);
    let target = car.topSpeed * car._pace + bonusScale * (car.trickSpeedBonus + (car.repairRemaining > 0 ? 5 : 0) + (car.boost > 0 ? 12 : 0) + (car.rocketRemaining > 0 ? 18 : 0));
    const lateBrake = car.mistakeType === 'late-brake';
    const braking = car.brakeDecelMps2 * car._brakeTiming * (lateBrake ? 0.42 : 0.86);
    const cornerGrip = raceForceEnvelope({speed:car.speed,gripFactor:car.hasVehicleSpec?1:car.gripFactor,vehicleSpec:car.vehicleSpec}).gripAccel;
    // Brake before bends throughout the stopping horizon. Tire load still
    // limits the actual turn, including if an error delayed braking.
    for (const offset of [0, 12, 25, 43, 68, 105, 160]) {
      const curve = Math.abs(offset ? curvatureAt(car.distance + offset) : curvature);
      const corner = Math.sqrt(cornerGrip * (lateBrake ? 1.1 : .84) / Math.max(curve, 0.0001));
      target = Math.min(target, Math.sqrt(corner * corner + 2 * braking * offset));
    }
    if (car.mistakeType === 'lift') target *= 0.76;
    if (car.freezeRemaining > 0) target *= 0.42;
    target *= 1 - car.damage * 0.25;
    if (car.replacementPending > 0) target *= 0.35;
    else if (car.replacementRemaining > 0) target *= 0.58 + 0.42 * (1 - car.replacementRemaining / REPLACEMENT_RECOVERY);
    const edge = Math.max(0, Math.abs(car.lateral) + CAR_WIDTH * 0.5 - sample(car.distance).width / 2);
    if (edge > 0) target *= clamp(1 - edge * 0.18, 0.34, 1);
    if (traffic.lead) {
      const safeGap = CAR_LENGTH + 1.2 + car.speed * 0.2;
      if (traffic.gap < safeGap && Math.abs(traffic.lead.lateral - car.lateral) < CAR_WIDTH * 0.95) {
        target = Math.min(target, Math.max(4.5, traffic.lead.speed + (traffic.gap - safeGap) * 1.35));
      }
    }
    return clamp(target, 4.5, speedLimitFor(car));
  }
  function speedLimitFor(car) {
    return car.topSpeed + Math.min(1, car.speedFactor) * (25 + car.trickSpeedBonus);
  }
  function refreshDamageState(car) {
    car.damage = clamp(finite(car.damage), 0, 1);
    const level = car.damage > 0 ? Math.min(DAMAGE_LEVELS, Math.ceil(car.damage * DAMAGE_LEVELS - 1e-8)) : 0;
    car.hitPoints = car.damage === 1 ? 0 : Math.max(1, Math.round((1 - car.damage) * 100));
    if (level !== car.damageLevel) {
      const previousLevel = car.damageLevel;
      car.damageLevel = level;
      emit('damage-stage', car, { previousLevel, damageLevel: level, hitPoints: car.hitPoints, intensity: Math.max(0.2, car.damage) });
    }
    if (level === DAMAGE_LEVELS && car.damage >= 1 && !car.replacementPending && !car.finished) {
      car.replacementPending = REPLACEMENT_DELAY;
      emit('replacement-start', car, { damageLevel: level, duration: REPLACEMENT_DELAY, intensity: 1 });
    }
  }
  function advanceDamageState(car, dt) {
    refreshDamageState(car);
    if (car.finished) return;
    car.replacementRemaining = Math.max(0, car.replacementRemaining - dt);
    if (car.replacementPending > 0) {
      car.replacementPending = Math.max(0, car.replacementPending - dt);
      if (car.replacementPending <= 1e-8) {
        car.replacementPending = 0;
        car.damage = 0; car.damageLevel = 0; car.hitPoints = 100;
        car.replacements++; car.replacementRemaining = REPLACEMENT_RECOVERY;
        car.speed = Math.min(car.speed, car.topSpeed * 0.38);
        car.spin = 0; car.freezeRemaining = 0; car._lostSpeed = 0;
        car.heading *= 0.25; car.lateralVelocity *= 0.25;
        car._hitImmune = Math.max(car._hitImmune, 1.4);
        emit('replacement', car, { replacements: car.replacements, duration: REPLACEMENT_RECOVERY,
          damageLevel: 0, hitPoints: 100, afterSpeed: car.speed, intensity: 0.85 });
      }
    }
  }
  function recordImpact(car, beforeSpeed, amount = 0.1) {
    car._lostSpeed = clamp(car._lostSpeed + Math.max(0, beforeSpeed - car.speed), 0, 22);
    car.damage = clamp(car.damage + amount / car.durabilityFactor, 0, 1);
    refreshDamageState(car);
  }
  function blockedHit(car, attack, immunity = true) {
    if (car.finished || car.flightRemaining > 0 || (immunity && car._hitImmune > 0)) return true;
    if (car.shieldRemaining > 0) {
      if (time - car._lastShieldEvent > 0.25) { car._lastShieldEvent = time; emit('shield-block', car, { attack, intensity: 0.8 }); }
      return true;
    }
    return false;
  }
  function advanceStatus(car, dt) {
    advanceDamageState(car, dt);
    car.rocketRemaining = Math.max(0, car.rocketRemaining - dt);
    car.repairRemaining = Math.max(0, car.repairRemaining - dt);
    car.shieldRemaining = Math.max(0, car.shieldRemaining - dt);
    car.freezeRemaining = Math.max(0, car.freezeRemaining - dt);
    car.landingImpulse = Math.max(0, car.landingImpulse - dt * 0.65);
    if (car.flightRemaining > 0 && car.flightKind === 'ramp') {
      car._rampFlightElapsed += dt;
      const t = car._rampFlightElapsed;
      // A world-height parabola follows the lip velocity under real gravity.
      // Landing is resolved after movement against the actual surface below.
      car._airWorldY = car._rampTakeoffWorldY + car._rampTakeoffVelocity*t - .5*RAMP_GRAVITY*t*t;
      car.verticalVelocity = car._rampTakeoffVelocity - RAMP_GRAVITY*t;
      car.flightRemaining = Math.max(STEP, car.flightDuration - t);
      const phase = clamp(t / Math.max(.1, car.flightDuration * .85), 0, 1);
      const smooth = phase*phase*(3-2*phase);
      car.trickAngle = Math.PI*2*car.trickFlips*smooth;
      car.rampPitch = car._rampTakeoffPitch * (1-smooth);
      car.supportPitch = car.rampPitch;
    } else if (car.flightRemaining > 0) {
      car.flightRemaining = Math.max(0, car.flightRemaining - dt);
      const phase = 1 - car.flightRemaining / car.flightDuration;
      car.flightHeight = FLIGHT_HEIGHT * 4 * phase * (1 - phase);
      car.verticalVelocity = FLIGHT_HEIGHT * 4 * (1 - 2 * phase) / car.flightDuration;
      if (!car.flightRemaining) {
        car.flightHeight = 0; car.verticalVelocity = 0; car.landingImpulse = 1;
        car.lateral = clamp(car.lateral, -sample(car.distance).width * 0.35, sample(car.distance).width * 0.35);
        car.lateralVelocity *= 0.35; car.heading *= 0.3;
        if (!car.finished) car.speed *= 0.94;
        car.flightKind = null;
        emit('launch-land', car, { intensity: 0.8 });
      }
    }
  }
  function updateWheelSupport(car, activeRamp = null, start = 0) {
    const ground = roadSurfaceAt(car.distance, car.lateral);
    const airborne = car.flightRemaining > 0;
    const loads = raceWheelLoads({acceleration:car.acceleration,lateralAcceleration:car.lateralAcceleration,massKg:car.massKg,
      downforceN:car.downforceN,wheelbase:car.wheelbase,trackWidth:car.trackWidth,grounded:!airborne,landingImpulse:car.landingImpulse});
    const cos = Math.cos(car.heading), sin = Math.sin(car.heading);
    const contacts = car.wheelOffsets.map((offset,i) => {
      const longitudinal = offset.longitudinal;
      const distance = car.distance + longitudinal*cos-offset.lateral*sin;
      const lateral = car.lateral + offset.lateral*cos+longitudinal*sin;
      const road = roadSurfaceAt(distance,lateral);
      let surfaceY=road.y, supportY=road.y, grounded=!airborne;
      let rampId=null;
      if(activeRamp) {
        const along=distance-start, u=along/activeRamp.length;
        const withinSide=Math.abs(lateral-activeRamp.lateral)<=activeRamp.width/2;
        if(along>=0 && withinSide) {
          if(u<=1) {surfaceY += rampHeightAt(activeRamp,u); supportY=surfaceY;rampId=activeRamp.id;}
          else {
            // The rear axle still supports the car as the front wheels leave.
            supportY += activeRamp.height + (along-activeRamp.length)*rampSlopeAt(activeRamp,1);
            grounded=false;
          }
        }
      }
      return {...offset,distance,worldLateral:lateral,surfaceY,supportY,rampId,grounded,
        ...loads[i],load:grounded?loads[i].load:0,normalLoadN:grounded?loads[i].normalLoadN:0};
    });
    if (!airborne) {
      const totalLoad=contacts.reduce((sum,c)=>sum+c.load,0);
      if(totalLoad>0) for(const c of contacts) {
        c.load/=totalLoad;c.normalLoadN=c.load*(car.massKg*9.81+car.downforceN);
        const staticShare=c.id.startsWith('front')?.47/2:.53/2;
        c.compression=c.grounded?clamp((c.normalLoadN-car.massKg*9.81*staticShare)/38000+car.landingImpulse*.075,-.07,.105):-.085;
      }

      const front=(contacts[0].supportY+contacts[1].supportY)/2,rear=(contacts[2].supportY+contacts[3].supportY)/2;
      const left=(contacts[0].supportY+contacts[2].supportY)/2,right=(contacts[1].supportY+contacts[3].supportY)/2;
      car.supportPitch=Math.atan2(front-rear,car.wheelbase)-ground.grade;
      car.supportRoll=Math.atan2(right-left,WHEEL_TRACK)-ground.bank;
      car.rampHeight=Math.max(0,car.supportHeight);car.rampPitch=car.supportPitch;
    } else { car.supportY=ground.y+car.flightHeight;car.supportHeight=0;car.supportRoll=0; }
    car.wheelContacts=contacts;
  }
  function landRamp(car) {
    const impactSpeed=Math.abs(car.verticalVelocity);
    car.flightRemaining=0;car.flightHeight=0;car.verticalVelocity=0;
    car.landingImpulse=clamp(impactSpeed/12,.25,1);
    const landedOnRoad=Math.abs(car.lateral)+CAR_WIDTH*.5<=sample(car.distance).width/2;
    const beforeBonus=car.trickSpeedBonus;
    // Count only rotations actually completed before surface contact.
    const fullFlips=landedOnRoad?Math.floor((car.trickAngle+1e-4)/(Math.PI*2)):0;
    car.completedFlips+=fullFlips;
    car.trickSpeedBonus=Math.min(MAX_TRICK_BONUS,beforeBonus+fullFlips*TRICK_BONUS_PER_FLIP);
    car.rampState='ground';car.rampHeight=0;car.rampPitch=0;car.flightKind=null;
    car.trickAngle=0;car.lateralVelocity*=.75;car.heading*=.65;
    car.speed*=landedOnRoad?clamp(1-impactSpeed*.004,.91,.99):.82;
    emit('ramp-land',car,{rampId:car.rampId,fullFlips,successful:landedOnRoad,impactSpeed,
      trickAngle:Math.PI*2*fullFlips,speedBonus:car.trickSpeedBonus,intensity:car.landingImpulse});
    if(fullFlips)emit('trick-complete',car,{rampId:car.rampId,fullFlips,trickAngle:Math.PI*2*fullFlips,beforeBonus,speedBonus:car.trickSpeedBonus,bonusAdded:car.trickSpeedBonus-beforeBonus,intensity:.9});
  }
  function updateRampContact(car) {
    if(car.finished)return;
    if(car.flightRemaining>0) {
      if(car.flightKind==='ramp') {
        const ground=roadSurfaceAt(car.distance,car.lateral);
        car.flightHeight=Math.max(0,car._airWorldY-ground.y);
        if(car.verticalVelocity<0 && car._airWorldY<=ground.y+.025)landRamp(car);
      }
      updateWheelSupport(car);return;
    }
    car.rampHeight=0;car.rampPitch=0;car.rampState='ground';
    let active=null,start=0;
    for(const ramp of ramps) {
      const lap=Math.max(0,Math.floor((car.distance+car.frontAxle-ramp.distance)/trackLength));
      const rampStart=ramp.distance+lap*trackLength,lip=rampStart+ramp.length;
      const key=`${car.gridPosition}:${ramp.id}:${lap}`;
      if(rampHits.has(key)||car.distance+car.frontAxle<rampStart||car.previousProgress+car.rearAxle>lip)continue;
      if(Math.abs(car.lateral-ramp.lateral)>ramp.width/2-CAR_WIDTH*.52)continue;
      // Enter at the flush approach; crossing a tall side cannot teleport the car up.
      const already=car.rampId===ramp.id&&car._rampLap===lap&&car._onRamp;
      if(!already&&car.distance+car.rearAxle>rampStart+2)continue;
      if(!already)emit('ramp-approach',car,{rampId:ramp.id,height:ramp.height,length:ramp.length,intensity:.55});
      car.rampId=ramp.id;car._rampLap=lap;car._onRamp=true;car.rampState='approach';
      active=ramp;start=rampStart;updateWheelSupport(car,active,start);car.trickAngle=0;
      if(car.distance+car.rearAxle<lip)break;
      rampHits.add(key);car._onRamp=false;
      const ground=roadSurfaceAt(car.distance,car.lateral);
      const pitch=ground.grade+Math.atan(rampSlopeAt(ramp,1));
      const velocity=car.speed*Math.sin(pitch);
      const takeoffWorldY=car.supportY;
      car.flightDuration=(velocity+Math.sqrt(Math.max(0,velocity*velocity+2*RAMP_GRAVITY*Math.max(.1,takeoffWorldY-ground.y))))/RAMP_GRAVITY;
      for(let t=.05;t<=5;t+=.025) {
        const projectedDistance=car.distance+car.speed*Math.cos(car.heading)*t;
        const projectedLateral=car.lateral+car.lateralVelocity*(1-Math.exp(-.18*t))/.18;
        const projectedY=takeoffWorldY+velocity*t-.5*RAMP_GRAVITY*t*t;
        if(velocity-RAMP_GRAVITY*t<0&&projectedY<=roadSurfaceAt(projectedDistance,projectedLateral).y) {car.flightDuration=t;break;}
      }
      car.flightRemaining=car.flightDuration;car.flightKind='ramp';car.rampState='airborne';
      car._rampTakeoffHeight=takeoffWorldY-ground.y;car._rampTakeoffWorldY=takeoffWorldY;car._airWorldY=takeoffWorldY;
      car._rampTakeoffVelocity=velocity;car._rampTakeoffPitch=car.rampPitch;car._rampFlightElapsed=0;
      car.flightHeight=takeoffWorldY-ground.y;car.verticalVelocity=velocity;car.rampHeight=0;
      // One controlled stunt requires enough airtime; short/slow jumps stay level.
      car.trickFlips=car.flightDuration>=1.55&&car.speed>=24&&car.spin<=0?1:0;
      car.trickAngle=0;car.rampTakeoffs++;
      car.speed*=Math.cos(Math.atan(rampSlopeAt(ramp,1)));
      car.nitro.reservoir=Math.max(car.nitro.reservoir,.35);car.nitro.remaining=Math.max(car.nitro.remaining,5);car.boost=car.nitro.remaining;
      emit('ramp-takeoff',car,{rampId:ramp.id,duration:car.flightDuration,height:car.flightHeight,
        verticalVelocity:velocity,fullFlips:car.trickFlips,nitroDuration:5,intensity:.9});
      updateWheelSupport(car);return;
    }
    if(!active)car._onRamp=false;
    updateWheelSupport(car,active,start);
  }
  function integrateCar(car, dt, snapshot) {
    advanceStatus(car, dt);
    if (car.finished) return;
    car.previousProgress = car.distance; car.previousLateral = car.lateral; car._finishFraction = null;
    car._hitImmune = Math.max(0, car._hitImmune - dt);
    car._itemTimer = Math.max(0, car._itemTimer - dt); if (!car._itemTimer) car.activeItem = null;
    drivingDecision(car, dt);
    const curvature = curvatureAt(car.distance), roadHalf = sample(car.distance).width / 2, oldSpeed = car.speed, oldSideSpeed = car.lateralVelocity;
    const traffic = trafficFor(car, snapshot);
    car.draft += (traffic.draft - car.draft) * clamp(dt * 4, 0, 1); car.drafting = car.draft;
    const envelope = raceForceEnvelope({ speed: car.speed, curvature, draft: car.draft, offRoad: Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf, gripFactor: car.hasVehicleSpec?1:car.gripFactor, vehicleSpec:car.vehicleSpec });
    car.dragN = envelope.dragN; car.downforceN = envelope.downforceN;
    car.drag = envelope.dragAccel + envelope.rollingAccel;
    car.rocketAcceleration = car.rocketRemaining > 0 ? 9 / (1 + (car.speed / 65) ** 2) : 0;
    if (car.flightRemaining > 0) {
      // A bounded flight follows course progress continuously. Ground contact,
      // tires and pickups cannot teleport it or alter its actual crossing time.
      car.spin = 0; car.spinAngle *= Math.exp(-5 * dt); car.heading *= Math.exp(-.4 * dt);
      car.nitroAcceleration = stepNitro(car, dt, 3.5); car.motorPowerW = 0; car.regenW = 0; car.brake = 0;
      car.speed = clamp(car.speed + (car.rocketAcceleration + car.nitroAcceleration - car.drag * 0.35) * dt, 4, speedLimitFor(car));
      car.lateralVelocity *= Math.exp(-.18*dt);
      car.yawRate = -car.heading * .4;
    } else if (car.spin > 0) {
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
      const driveFactor = car.hasVehicleSpec ? 1 : car.accelerationFactor;
      const engine = Math.min(car.vehicleSpec.torqueNm * 8 * .92 / .34, car.vehicleSpec.powerKW * 1000 * .92 / Math.max(1, car.speed)) * driveFactor / car.massKg;
      const gradient = Math.sin(roadSurfaceAt(car.distance,car.lateral).grade + car.supportPitch) * 9.81;
      let throttle = 0;
      if (error > 0) {
        throttle = clamp(error * 0.65 + car.drag / Math.max(1, engine), 0, 1) * (car.mistakeType === 'lift' ? 0.6 : 1);
        car.brake = 0;
      } else {
        car.brake = clamp(-error * 0.7 / car.brakeDecelMps2, 0, 1);
      }
      const drive = raceElectricDrive({ speed: car.speed, throttle, brake: car.brake,
        energyJ: car.batteryEnergyJ, dt, longitudinalAccel: envelope.longitudinalAccel *
          (car.brake > 0 || /electric/i.test(car.engineType) || car.racerType === 'lamborghini-gallardo' ? 1 :
            clamp(car.wheelContacts[2]?.load + car.wheelContacts[3]?.load || .53, .35, .9)),
        accelerationFactor: driveFactor,vehicleSpec:car.vehicleSpec });
      car.batteryEnergyJ = drive.energyJ; car.batterySOC = drive.energyJ / BATTERY_J;
      car.motorPowerW = drive.powerW; car.regenW = drive.regenW;
      car.nitroAcceleration = stepNitro(car, dt, car.brake > 0 ? 0 : Math.max(0, envelope.longitudinalAccel - drive.driveN / car.massKg));
      car.rocketAcceleration *= car.brake > 0 ? 0.25 : 1;
      car.speed += (drive.acceleration * (1 - car.damage * 0.15) + (error > 0 && car.brake <= 0 ? Math.min(1.8, car.trickSpeedBonus * 0.18) + (car.repairRemaining > 0 ? 1.7 : 0) : 0) + car.nitroAcceleration + car.rocketAcceleration - car.drag - gradient - (car.freezeRemaining > 0 ? 3.5 : 0)) * dt;
      car.speed = clamp(car.speed, 0, speedLimitFor(car));
      const targetLane = laneTargetFor(car, curvature, traffic);
      car.targetLane = targetLane;
      const sideTarget = clamp((targetLane - car.lateral) * 1.2 - car.lateralVelocity * 0.72, -6.5, 6.5);
      const desiredHeading = clamp(Math.atan2(sideTarget, Math.max(5, car.speed)), -0.38, 0.38);
      const demand = car.speed * car.speed * Math.abs(curvature) / envelope.gripAccel;
      const grip = clamp(1 - Math.max(0, demand - 0.92) * 0.7, 0.25, 1);
      const yawLimit = clamp(1.42 - car.speed * 0.009, 0.82, 1.42) * grip;
      car.yawRate = clamp(angleDelta(car.heading, desiredHeading) * 5.2, -yawLimit, yawLimit);
      car.heading = clamp(car.heading + car.yawRate * dt, -0.68, 0.68);
      car.slip = Math.abs(angleDelta(Math.atan2(car.lateralVelocity, Math.max(2, car.speed)), car.heading));
      const offRoad = Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf;
      const lateralGrip = SIDE_GRIP * (car.hasVehicleSpec?car.vehicleSpec.tireGrip/1.12:car.gripFactor) * grip * (offRoad ? 0.42 : 1) * (car.freezeRemaining > 0 ? 0.32 : 1);
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
    car.lateralAcceleration = clamp((car.lateralVelocity - oldSideSpeed) / dt + curvature * car.speed * car.speed, -45, 45);
    car.lateral += car.lateralVelocity * dt;
    const limit = roadHalf + 3.4;
    if (Math.abs(car.lateral) > limit) { car.lateral = Math.sign(car.lateral) * limit; car.lateralVelocity *= -0.22; car.speed *= 0.985; }
    car.offRoad = car.flightRemaining <= 0 && Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf;
    if (car.offRoad && !car._wasOffRoad) emit('offroad', car, { intensity: 0.6 });
    if (!car.offRoad && car._wasOffRoad) emit('recovery', car, { recoveryType: 'offroad', intensity: 0.6 });
    car._wasOffRoad = car.offRoad;
    car.distance += Math.max(0, car.speed * Math.cos(car.heading)) * dt;
    updateRampContact(car);
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
      const a = canonicalCars[i]; if (a.finished || a.flightRemaining > 0) continue;
      for (let j = i + 1; j < canonicalCars.length; j++) {
        const b = canonicalCars[j]; if (b.finished || b.flightRemaining > 0) continue;
        const long = b.distance - a.distance, side = b.lateral - a.lateral;
        if (Math.abs(long) > CAR_LENGTH * 1.08 || Math.abs(side) > CAR_WIDTH * 1.32) continue;
        let nxRaw = long / (CAR_LENGTH * 0.52), nyRaw = side / (CAR_WIDTH * 0.62);
        const ellipse = nxRaw * nxRaw + nyRaw * nyRaw; if (ellipse >= 1) continue;
        if (Math.hypot(nxRaw, nyRaw) < 1e-5) { nxRaw = 0.15; nyRaw = a.preferredLane <= b.preferredLane ? 1 : -1; }
        const normal = Math.hypot(nxRaw, nyRaw), nx = nxRaw / normal, ny = nyRaw / normal;
        const separation = (1 - Math.sqrt(ellipse)) * Math.min(CAR_LENGTH * 0.52, CAR_WIDTH * 0.62) * 0.52;
        const da = shifts.get(a.id), db = shifts.get(b.id);
        const inverseA = 1 / a.massKg, inverseB = 1 / b.massKg, inverseTotal = inverseA + inverseB;
        da.d -= nx * separation * 2 * inverseA / inverseTotal; db.d += nx * separation * 2 * inverseB / inverseTotal;
        da.l -= ny * separation * 2 * inverseA / inverseTotal; db.l += ny * separation * 2 * inverseB / inverseTotal;
        const closing = -((b.speed - a.speed) * nx + (b.lateralVelocity - a.lateralVelocity) * ny);
        if (closing <= 0.25) continue;
        // Shared impulse conserves contact momentum; a heavy car changes speed
        // less than a light car. Arcade safety caps bound violent pile-ups.
        const impulse = Math.min(Math.min(a.massKg,b.massKg) * 12, closing * 1.12 / inverseTotal);
        const shieldA = a.shieldRemaining > 0, shieldB = b.shieldRemaining > 0;
        if (!shieldA) { da.v -= impulse * inverseA * nx + a.speed * 0.015; da.side -= impulse * inverseA * ny * 0.42; }
        if (!shieldB) { db.v += impulse * inverseB * nx - b.speed * 0.015; db.side += impulse * inverseB * ny * 0.42; }
        if (shieldA) blockedHit(a, 'collision', false);
        if (shieldB) blockedHit(b, 'collision', false);
        const key = `${a.gridPosition}:${b.gridPosition}`;
        if (time - (lastCollisionAt.get(key) ?? -10) > 0.38) {
          lastCollisionAt.set(key, time);
          const intensity = clamp(closing / 13, 0.22, 1);
          emit('collision', a, { otherCarId: b.id, intensity, distance: (a.distance + b.distance) / 2, lateral: (a.lateral + b.lateral) / 2 });
          if (closing > 8.8) {
            const hitSide = ny === 0 ? (a.preferredLane < 0 ? 1 : -1) : Math.sign(ny);
            if (!shieldA) da.spin = -hitSide;
            if (!shieldB) db.spin = hitSide;
            da.strength = db.strength = intensity * 5.4;
          }
        }
      }
    }
    for (const car of canonicalCars) {
      if (car.finished) continue;
      const delta = shifts.get(car.id);
      const beforeSpeed = car.speed;
      car.distance += delta.d; car.lateral += delta.l; car.speed = Math.max(0, car.speed + delta.v); car.lateralVelocity += delta.side;
      if (delta.spin) startSpin(car, delta.spin, delta.strength);
      if (car.speed < beforeSpeed - 0.25) recordImpact(car, beforeSpeed, 0.035);
    }
  }
  function useItem(car, pickup) {
    car.activeItem = pickup.type; car._itemTimer = Math.max(25, RACE_POWER_DURATIONS[pickup.type] || 25);
    emit('item-pickup', car, { itemType: pickup.type, pickupId: pickup.id, duration:RACE_POWER_DURATIONS[pickup.type], displayDuration:car._itemTimer, timeScale:5, intensity: 0.6 });
    if (pickup.type === 'launch') {
      if (car.spin > 0 || car.freezeRemaining > 0) emit('recovery', car, { recoveryType: 'launch', intensity: 0.65 });
      car.flightRemaining = car.flightDuration = FLIGHT_DURATION; car.flightKind = 'launch';
      car.rampState = 'ground'; car.rampHeight = 0; car.rampPitch = 0; car.trickAngle = 0;
      car.flightHeight = 0; car.verticalVelocity = FLIGHT_HEIGHT * 4 / FLIGHT_DURATION;
      car.spin = 0; car.freezeRemaining = 0; car.heading *= 0.3;
      emit('launch-activate', car, { duration: FLIGHT_DURATION, height: FLIGHT_HEIGHT, intensity: 1 });
    } else if (pickup.type === 'rocket') {
      car.rocketRemaining = ROCKET_DURATION;
      emit('rocket-activate', car, { duration: ROCKET_DURATION, intensity: 1 });
    } else if (pickup.type === 'shield') {
      car.shieldRemaining = SHIELD_DURATION;
      emit('shield-activate', car, { duration: SHIELD_DURATION, radius: 2.5, intensity: 0.9 });
    } else if (pickup.type === 'repair') {
      const beforeSpeed = car.speed, previousDamage = car.damage;
      if (car.spin > 0 || car.freezeRemaining > 0) emit('recovery', car, { recoveryType: 'repair', intensity: 0.65 });
      car.speed = Math.max(car.speed, Math.min(car.topSpeed + Math.min(1, car.speedFactor) * (car.trickSpeedBonus + 5), car.speed + Math.max(6, Math.min(16, car._lostSpeed))));
      car.repairRemaining = REPAIR_DURATION; car.shieldRemaining = Math.max(car.shieldRemaining, 15);
      car.damage = 0; car.replacementPending = 0; car.replacementRemaining = 0;
      refreshDamageState(car);
      car._lostSpeed = 0; car.spin = 0; car.freezeRemaining = 0;
      car.heading *= 0.25; car.lateralVelocity *= 0.3;
      car.batteryEnergyJ = Math.min(BATTERY_J, car.batteryEnergyJ + BATTERY_J * 0.05);
      car.batterySOC = car.batteryEnergyJ / BATTERY_J;
      emit('repair', car, { beforeSpeed, afterSpeed: car.speed, beforeDamage: previousDamage, afterDamage: car.damage, restoredSpeed: car.speed - beforeSpeed, repairedDamage: previousDamage, duration: car.repairRemaining, protectionDuration: car.shieldRemaining, intensity: 0.8 });
    } else if (pickup.type === 'missile') {
      const target = nearestForwardTarget(car.distance, car.id, 150);
      const projectile = { id: `missile-${++serial}`, type: 'missile', ownerId: car.id, targetId: target?.id ?? null,
        distance: car.distance + CAR_LENGTH * 0.9, lateral: car.lateral, speed: Math.max(72, car.speed + 32), age: 0, ttl: 4.5, height: 1.5, heading: 0 };
      boundProjectile('missile', MAX_MISSILES); projectiles.push(projectile);
      emit('missile-launch', car, { projectileId: projectile.id, targetId: projectile.targetId, distance: projectile.distance, lateral: projectile.lateral, intensity: 0.9 });
    } else if (pickup.type === 'shockwave' || pickup.type === 'freeze') {
      const wave = { id: `${pickup.type}-${++serial}`, type: pickup.type, ownerId: car.id,
        distance: car.distance + CAR_LENGTH, lateral: car.lateral, speed: Math.max(62, car.speed + 25), age: 0, ttl: 3.6,
        radius: pickup.type === 'shockwave' ? 4.2 : 3.8, height: 1.65, previousHeight: 1.65,
        carrier: pickup.type === 'shockwave' ? 'jellyfish' : 'frost', heading: 0, distanceTravelled: 0, maxTravel: 230, hitIds: [] };
      if (waves.length >= MAX_WAVES) waves.shift(); waves.push(wave);
      emit(`${pickup.type}-launch`, car, { waveId: wave.id, distance: wave.distance, lateral: wave.lateral, radius: wave.radius, intensity: 0.9 });
    } else if (pickup.type === 'boost') {
      const n = car.nitro;
      if (n.remaining <= 0 || n.remaining < BOOST_DURATION) {
        n.reservoir = 1; n.cooldown = 0; n.remaining = BOOST_DURATION; car.boost = n.remaining;
        emit('boost', car, { duration: car.boost, intensity: 0.9, propulsion: 'electric-overdrive' });
      }
    } else if (pickup.type === 'banana') {
      const hazard = { id: `banana-${++serial}`, type: 'banana', ownerId: car.id, distance: car.distance + CAR_LENGTH * 0.8, lateral: car.lateral,
        previousDistance: car.distance + CAR_LENGTH * 0.8, previousLateral: car.lateral, age: 0, ttl: 24, armed: false, phase: 'airborne',
        height: 1.5, verticalVelocity: 8.5, speed: Math.max(23, car.speed * 0.8 + 12), heading: 0, landedAt: null }; 
      if (hazards.length >= MAX_BANANAS) hazards.shift(); hazards.push(hazard);
      emit('banana-launch', car, { hazardId: hazard.id, distance: hazard.distance, lateral: hazard.lateral, height: hazard.height, verticalVelocity: hazard.verticalVelocity, speed: hazard.speed, intensity: 0.7 });
    } else if (pickup.type === 'bomb') {
      const speed = Math.max(82, car.speed + 35);
      const projectile = { id: `bomb-${++serial}`, type: 'bomb', ownerId: car.id, distance: car.distance + CAR_LENGTH * 0.8, lateral: car.lateral,
        speed, age: 0, ttl: trackLength / speed + 2, fuse: trackLength / speed,
        distanceTravelled: 0, maxTravel: trackLength, height: 1.6, verticalVelocity: 9, heading: 0 };
      // Every racer can launch at the same gate. Never evict a live bomb before
      // its lap: bombs outrun the maximum car speed, so a driver's previous
      // bomb expires before that driver can collect this gate on the next lap.
      projectiles.push(projectile);
      emit('bomb-launch', car, { projectileId: projectile.id, distance: projectile.distance, lateral: projectile.lateral, intensity: 0.65 });
    }
  }
  function collectItems(car) {
    if (car.finished || car.distance < 0 || car.flightHeight > 2.8) return;
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
    if (car.flightRemaining > 0) return;
    const staticHazards = Array.isArray(track.hazards) ? track.hazards : [];
    for (let i = 0; i < staticHazards.length; i++) {
      const h = staticHazards[i] || {}, base = wrap(finite(h.distance), trackLength);
      const lap = Math.round((car.distance - base) / trackLength), key = `${car.gridPosition}:${i}:${lap}`;
      if (hazardHits.has(key)) continue;
      const radius = Math.max(0.5, finite(h.radius, h.type === 'oil' ? 2.2 : 1.7));
      if (Math.abs(car.distance - (base + lap * trackLength)) > Math.max(1.7, CAR_LENGTH * 0.42)) continue;
      if (Math.abs(car.lateral - finite(h.lateral ?? h.offset)) > radius + CAR_WIDTH * 0.45) continue;
      hazardHits.add(key);
      if (blockedHit(car, String(h.type || 'hazard'), false)) continue;
      const beforeSpeed = car.speed;
      const type = String(h.type || 'debris').toLowerCase(), side = car.lateral >= finite(h.lateral ?? h.offset) ? 1 : -1;
      if (type === 'oil' || type === 'water') {
        car.lateralVelocity += side * (type === 'oil' ? 4.6 : 2.8); car.speed *= type === 'oil' ? 0.78 : 0.88;
        emit('oil', car, { hazardType: type, intensity: 0.85 }); startSpin(car, side, type === 'oil' ? 3.2 : 1.8);
      } else {
        car.speed = Math.max(4, car.speed - (type === 'cone' ? 5.5 : 3.2)); car.lateralVelocity += side * 1.1;
        emit(type === 'cone' ? 'cone' : 'hazard', car, { hazardType: type, intensity: 0.48 });
      }
      recordImpact(car, beforeSpeed, 0.08);
    }
  }
  function nearestForwardTarget(distance, ownerId, range = 150) {
    return canonicalCars.filter(car => !car.finished && car.id !== ownerId && car.flightRemaining <= 0 &&
      courseGap(car.distance, distance) > CAR_LENGTH && courseGap(car.distance, distance) < range)
      .sort((a, b) => courseGap(a.distance, distance) - courseGap(b.distance, distance) || a.gridPosition - b.gridPosition)[0];
  }
  function boundProjectile(type, limit) {
    if (projectiles.filter(p => p.type === type).length >= limit) {
      const oldest = projectiles.findIndex(p => p.type === type);
      if (oldest >= 0) projectiles.splice(oldest, 1);
    }
  }
  function weaponHit(car, type, source, strength = 0.8) {
    if (blockedHit(car, type)) return false;
    const beforeSpeed = car.speed;
    if (type === 'freeze') {
      car.freezeRemaining = FREEZE_DURATION; car.speed *= 0.72; car.lateralVelocity *= 0.45;
    } else {
      const side = Math.sign(car.lateral - source.lateral || (car.gridPosition % 2 ? 1 : -1));
      car.speed *= type === 'shockwave' ? 0.65 : type === 'missile' ? 0.58 : 0.72 - strength * 0.18;
      car.lateralVelocity += side * (2 + strength * 2.5);
      startSpin(car, side, 1.5 + strength * 2.5, SPIN_DURATION);
    }
    car._hitImmune = 1.7; recordImpact(car, beforeSpeed, type === 'freeze' ? 0.06 : 0.18);
    emit(`${type}-hit`, car, { projectileId: source.id, waveId: source.id, ownerId: source.ownerId,
      duration: type === 'freeze' ? FREEZE_DURATION : SPIN_DURATION, beforeSpeed, afterSpeed: car.speed, damage: car.damage, intensity: 0.5 + strength * 0.5 });
    return true;
  }
  // Continuous relative-motion contact in course coordinates, including the
  // seam. A fast projectile cannot tunnel through a car between fixed steps.
  function sweptContact(car, p, longRadius = 2.8, sideRadius = 1.8) {
    const carMove = car.distance - car.previousProgress;
    const x0 = courseGap(car.previousProgress, p.previousDistance) / longRadius;
    const x1 = (courseGap(car.previousProgress, p.previousDistance) + carMove - (p.distance - p.previousDistance)) / longRadius;
    const y0 = (finite(car.previousLateral, car.lateral) - p.previousLateral) / sideRadius, y1 = (car.lateral - p.lateral) / sideRadius;
    const dx = x1 - x0, dy = y1 - y0;
    const a = dx * dx + dy * dy, b = 2 * (x0 * dx + y0 * dy), c = x0 * x0 + y0 * y0 - 1;
    let enter = 0, leave = 1;
    if (a < 1e-12) { if (c > 0) return null; }
    else {
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) return null;
      const root = Math.sqrt(discriminant);
      enter = Math.max(0, (-b - root) / (2 * a));
      leave = Math.min(1, (-b + root) / (2 * a));
    }
    // Intersect the contact interval with the low portion of the bounce. A
    // descending bomb can touch after horizontal entry; closest approach alone
    // misses that hit and can choose a later racer as the first contact.
    const h0 = finite(p.previousHeight, finite(p.height)), dh = finite(p.height) - h0;
    if (Math.abs(dh) < 1e-12) { if (h0 >= 2.8) return null; }
    else if (dh > 0) leave = Math.min(leave, (2.8 - h0) / dh);
    else enter = Math.max(enter, (2.8 - h0) / dh);
    return enter <= leave && enter <= 1 && leave >= 0 ? enter : null;
  }
  function explodeBomb(p) {
    const owner = canonicalCars.find(car => car.id === p.ownerId);
    emit('bomb-explode', owner, { projectileId: p.id, distance: p.distance, lateral: p.lateral,
      distanceTravelled: p.distanceTravelled, maxTravel: p.maxTravel, radius: BLAST_RADIUS, intensity: 1 });
    for (const car of canonicalCars) {
      if (car.finished || (car.id === p.ownerId && p.age < 0.7)) continue;
      const gap = courseGap(car.distance, p.distance), side = car.lateral - p.lateral, radius = Math.hypot(gap, side);
      if (radius > BLAST_RADIUS) continue;
      const strength = 1 - radius / BLAST_RADIUS;
      weaponHit(car, 'bomb', p, strength);
    }
  }
  function updateItems(dt) {
    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i]; h.age += dt; let hit = false;
      h.previousDistance = h.distance; h.previousLateral = h.lateral;
      if (h.phase === 'airborne') {
        h.distance += h.speed * dt; h.verticalVelocity -= 14 * dt; h.height += h.verticalVelocity * dt;
        if (h.height <= 0.18 && h.verticalVelocity < 0) {
          h.height = 0.18; h.verticalVelocity = 0; h.speed = 0; h.phase = 'landed'; h.landedAt = time; h.armed = true;
          emit('banana-land', canonicalCars.find(car => car.id === h.ownerId), { hazardId: h.id, distance: h.distance, lateral: h.lateral, height: h.height, intensity: 0.55 });
        }
      } else if (!h.phase) { h.phase = 'landed'; h.height = 0.18; h.armed = h.age >= 0.28; }
      if (h.phase !== 'landed') continue;
      if (h.armed) {
        const contacts = canonicalCars.filter(car => !car.finished && car.flightRemaining <= 0 && car._hitImmune <= 0 && !(car.id === h.ownerId && h.age < 1.1) &&
          Math.abs(courseGap(car.distance, h.distance)) < CAR_LENGTH * 0.42 + 0.65 && Math.abs(car.lateral - h.lateral) < CAR_WIDTH * 0.5 + 0.8)
          .sort((a, b) => Math.abs(courseGap(a.distance, h.distance)) - Math.abs(courseGap(b.distance, h.distance)) || a.gridPosition - b.gridPosition);
        if (contacts.length) {
          const car = contacts[0];
          if (!blockedHit(car, 'banana')) {
            const beforeSpeed = car.speed; car._hitImmune = 1.7;
            startSpin(car, Math.sign(car.lateral - h.lateral || car.lateralVelocity || 1), 2.8, SPIN_DURATION);
            recordImpact(car, beforeSpeed, 0.12);
            emit('banana-hit', car, { hazardId: h.id, ownerId: h.ownerId, duration:SPIN_DURATION, beforeSpeed, afterSpeed: car.speed, damage: car.damage, intensity: 0.85 });
          }
          hit = true;
        }
      }
      if (hit || h.age >= h.ttl) hazards.splice(i, 1);
    }
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.age += dt;
      p.previousDistance = p.distance; p.previousLateral = p.lateral; p.previousHeight = p.height;
      if (p.type === 'missile') {
        let target = canonicalCars.find(car => car.id === p.targetId && !car.finished && car.flightRemaining <= 0 && courseGap(car.distance, p.distance) > -5);
        if (!target) target = nearestForwardTarget(p.distance, p.ownerId, 180);
        p.targetId = target?.id ?? null;
        const sideSpeed = target ? clamp((target.lateral - p.lateral) * 3, -7.5, 7.5) : 0;
        p.lateral += sideSpeed * dt; p.heading = Math.atan2(sideSpeed, p.speed);
      } else {
        p.verticalVelocity -= 12 * dt; p.height += p.verticalVelocity * dt;
        if (p.height <= 0.3 && p.verticalVelocity < 0) {
          p.height = 0.3; p.verticalVelocity = Math.max(3.5, -p.verticalVelocity * 0.72);
          emit('bomb-bounce', canonicalCars.find(car => car.id === p.ownerId), { projectileId: p.id, distance: p.distance, lateral: p.lateral, height: p.height, intensity: 0.3 });
        }
      }
      p.distance += p.speed * dt;
      if (p.type === 'bomb') { p.distanceTravelled += p.speed * dt; p.fuse = Math.max(0, (p.maxTravel - p.distanceTravelled) / Math.max(p.speed, 1)); }
      const contacts = p.age > 0.2 ? canonicalCars.filter(car => !car.finished && car.flightRemaining <= 0 && car.id !== p.ownerId)
        .map(car => ({ car, fraction: sweptContact(car, p) })).filter(hit => hit.fraction !== null)
        .sort((a, b) => a.fraction - b.fraction || a.car.gridPosition - b.car.gridPosition) : [];
      if (contacts.length) {
        if (p.type === 'bomb') p.distanceTravelled -= p.speed * dt * (1 - contacts[0].fraction);
        p.distance = p.previousDistance + (p.distance - p.previousDistance) * contacts[0].fraction;
        p.lateral = p.previousLateral + (p.lateral - p.previousLateral) * contacts[0].fraction;
        if (p.type === 'bomb') explodeBomb(p); else weaponHit(contacts[0].car, 'missile', p);
        projectiles.splice(i, 1);
      } else if ((p.type === 'bomb' && p.distanceTravelled >= p.maxTravel) || p.age >= p.ttl) {
        if (p.type === 'bomb') explodeBomb(p);
        projectiles.splice(i, 1);
      }
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i]; wave.age += dt; wave.previousDistance = wave.distance; wave.previousLateral = wave.lateral;
      wave.distance += wave.speed * dt; wave.distanceTravelled += wave.speed * dt;
      wave.previousHeight = wave.height; wave.height = 1.65 + Math.sin(wave.age * 5) * 0.24;
      for (const car of canonicalCars) {
        if (car.finished || car.flightRemaining > 0 || car.id === wave.ownerId || wave.hitIds.includes(car.id)) continue;
        if (sweptContact(car, wave, 3.2, wave.radius) === null) continue;
        wave.hitIds.push(car.id); weaponHit(car, wave.type, wave, 0.8);
      }
      if (wave.age >= wave.ttl || wave.distanceTravelled >= wave.maxTravel) waves.splice(i, 1);
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
    for (const car of finishers) {
      car.finishPosition = results.length + 1;
      const result = Object.freeze({ id: car.id, name: car.name, color: car.color, finishTime: car.finishTime,
        position: car.finishPosition, gridPosition: car.gridPosition });
      results.push(result);
      emit('car-finish', car, { finishTime: car.finishTime, position: car.finishPosition, finishDistance });
    }
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
    get pickups() { return pickups; }, get hazards() { return hazards; }, get projectiles() { return projectiles; }, get waves() { return waves; },
    get ramps() { return ramps; },
    get results() { return results; }, get allFinished() { return cars.length > 0 && results.length === cars.length; },
    get powerups() { return { pickups, hazards, projectiles, waves, time }; }, update,
    reset() { if (!disposed) createGrid(); },
    dispose() {
      disposed = true; cars.length = 0; canonicalCars = []; events.length = 0;
      pickups.length = 0; hazards.length = 0; projectiles.length = 0; waves.length = 0; results.length = 0;
      hazardHits.clear(); pickupHits.clear(); rampHits.clear(); lastCollisionAt.clear();
    },
    drainEvents() { const drained = events; events = []; return drained; },
  };
}
export const RACE_PHYSICS = Object.freeze({
  step: STEP, maxFrameDelta: MAX_FRAME_DELTA, maxCars: MAX_CARS,
  carLength: CAR_LENGTH, carWidth: CAR_WIDTH, topSpeed: TOP_SPEED,
  engineAccel: ENGINE_ACCEL, brakeAccel: BRAKE_ACCEL, cornerGrip: CORNER_GRIP,
  massKg: MASS, wheelbase: WHEELBASE, trackWidth: WHEEL_TRACK, centreOfGravityHeight: CG_HEIGHT, batteryJ: BATTERY_J, motorPowerW: MOTOR_POWER_W,
  maxBananas: MAX_BANANAS, maxBombs: MAX_BOMBS, maxMissiles: MAX_MISSILES, maxWaves: MAX_WAVES,
  boostDuration: BOOST_DURATION, blastRadius: BLAST_RADIUS, flightDuration: FLIGHT_DURATION, flightHeight: FLIGHT_HEIGHT,
  rocketDuration: ROCKET_DURATION, shieldDuration: SHIELD_DURATION, freezeDuration: FREEZE_DURATION,
  repairDuration: REPAIR_DURATION, weaponSpinDuration: SPIN_DURATION, powerDurations: RACE_POWER_DURATIONS, timeScale:5,
  damageLevels: DAMAGE_LEVELS, replacementDelay: REPLACEMENT_DELAY, replacementRecovery: REPLACEMENT_RECOVERY,
  maxTrickBonus: MAX_TRICK_BONUS, trickBonusPerFlip: TRICK_BONUS_PER_FLIP, rampGravity: RAMP_GRAVITY,
  powerTypes: RACE_POWER_TYPES,
});
