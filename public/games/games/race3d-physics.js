/**
 * Deterministic fixed-step arcade racing, not an engineering vehicle model.
 * Bounded, game-balanced vehicle profiles alter speed, grip and durability.
 * Traffic, slipstreams, errors and items determine the actual first crossing.
 */
import { createRampLayout, rampHeightAt, rampSlopeAt } from './race3d-ramps.js?v=20261025-city-contact1';
import { ITEM_TYPES, drawItem, ROULETTE_DURATION, ITEM_HOLD_MIN, ITEM_HOLD_MAX } from './race3d-item-rules.js?v=20261025-city-contact1';

import {vehicleProfile,wheelFootprint,wheelLoads,rampSupport,planRampApproach,roadSurface} from './race3d-vehicle.js?v=20261025-city-contact1';

import {itemDecision} from './race3d-strategy.js?v=20261025-city-contact1';
import {getVehicleSpec} from './race3d-vehicle-specs.js?v=20261025-city-contact1';
import {launchAttitude,advanceAttitude,landingAttitude} from './race3d-flight.js?v=20261025-city-contact1';

const STEP = 1 / 120, MAX_FRAME_DELTA = 0.25, MAX_STEPS_PER_UPDATE = 30;
const MAX_CARS = 60, CAR_LENGTH = 4.4, CAR_WIDTH = 1.9, TOP_SPEED = 43;
const ENGINE_ACCEL = 9.5, BRAKE_ACCEL = 15, SIDE_GRIP = 5.8, CORNER_GRIP = 12.4;
const MAX_EVENTS = 240, MAX_BANANAS = 24, MAX_BOMBS = MAX_CARS, MAX_MISSILES = 12, MAX_WAVES = 16;
const BOOST_DURATION = 6, BLAST_RADIUS = 7.5;
const RAMP_GRAVITY = 9.81, MAX_TRICK_BONUS = 10, TRICK_BONUS_PER_FLIP = 3;
const FLIGHT_DURATION = 6, FLIGHT_HEIGHT = 55, ROCKET_DURATION = 6, SHIELD_DURATION = 8, FREEZE_DURATION = 6;
const DAMAGE_LEVELS = 20, REPLACEMENT_DELAY = 2, REPLACEMENT_RECOVERY = 8;
export const RACE_POWER_TYPES = ITEM_TYPES;
// Fictional competition calibration, never manufacturer specifications. The
// shared force model receives the bounded game profile of each entrant.
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
export function raceForceEnvelope({ speed = 0, curvature = 0, draft = 0, offRoad = false, gripFactor = 1, massKg = MASS, vehicleSpec } = {}) {
  massKg=clamp(finite(vehicleSpec?.massKg,massKg),500,2600);
  speed = Math.max(0, finite(speed)); curvature = finite(curvature); draft = finite(draft);
  const q = 0.5 * 1.225 * Math.max(0, speed) ** 2;
  const wing = 0.6;
  const dragN = q * (vehicleSpec ? vehicleSpec.dragCoefficient*vehicleSpec.frontalAreaM2 : .68+.36*wing**2) * (1 - 0.24 * clamp(draft, 0, 1));
  const downforceN = Math.min(massKg*9.81*(vehicleSpec?2.5:.65),q*(vehicleSpec?vehicleSpec.downforceCoefficient*vehicleSpec.frontalAreaM2:.12+1.25*wing));
  const gripAccel = (vehicleSpec?.tireGrip||1.12) * clamp(finite(gripFactor, 1), 0.75, 1.25) * (offRoad ? 0.45 : 1) * (9.81 + downforceN / massKg);
  const lateralAccel = speed * speed * Math.abs(curvature);
  const lateralUse = clamp(lateralAccel / gripAccel, 0, 1);
  const longitudinalAccel = gripAccel * Math.sqrt(Math.max(0, 1 - lateralUse * lateralUse));
  return { dragN, downforceN, dragAccel: dragN / massKg,
    rollingAccel: 0.16 + (offRoad ? 2.1 : 0), gripAccel, lateralAccel,
    longitudinalAccel, slip: Math.max(0, lateralAccel / gripAccel - 1) };
}
export function raceElectricDrive({ speed = 0, throttle = 0, brake = 0, energyJ = BATTERY_J * 0.8, dt = STEP, longitudinalAccel = 11, accelerationFactor = 1, massKg=MASS, motorPowerW=MOTOR_POWER_W, brakeFactor=1, vehicleSpec } = {}) {
  speed = Math.max(0, finite(speed)); dt = clamp(finite(dt), 0, 0.1);
  throttle = finite(throttle); brake = finite(brake); energyJ = finite(energyJ);
  const driveFactor = clamp(finite(accelerationFactor, 1), 0.35, 1.3);
  const energy = clamp(energyJ, 0, BATTERY_J), soc = energy / BATTERY_J;
  massKg=clamp(finite(vehicleSpec?.massKg,massKg),500,2600);
  const electric=!vehicleSpec||/electric|hybrid/i.test(vehicleSpec.engineType);
  if(vehicleSpec){motorPowerW=vehicleSpec.powerKW*1000;brakeFactor=vehicleSpec.brakeDecelMps2/BRAKE_ACCEL;}
  const gripN = Math.max(0, finite(longitudinalAccel)) * massKg;
  const availablePower = motorPowerW*driveFactor*(electric?clamp(soc/.08,0,1):1);
  const launchN=vehicleSpec?vehicleSpec.torqueNm*8*.92/.34:ENGINE_ACCEL*massKg;
  const driveN = brake > 0 ? 0 : Math.min(launchN*driveFactor, availablePower / Math.max(speed, 1), gripN) * clamp(throttle, 0, 1);
  const brakeN = Math.min(clamp(brake, 0, 1) * BRAKE_ACCEL * brakeFactor * massKg, gripN);
  const regenW = electric?Math.min(brakeN * speed, 70000 * clamp((1 - soc) / 0.08, 0, 1), (BATTERY_J - energy) / Math.max(dt * 0.92, 1e-6)):0;
  const powerW = driveN * speed / 0.92;
  return { driveN, brakeN, regenW, powerW,
    energyJ: electric?clamp(energy + (regenW * 0.92 - powerW) * dt, 0, BATTERY_J):energy,
    acceleration: (driveN - brakeN) / massKg };
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

export function createRaceSimulation({ players = [], track, random = Math.random, autoItems = true } = {}) {
  if (!track || typeof track.sampleTrack !== 'function') throw new TypeError('createRaceSimulation requires sampleTrack(distance)');
  const roster = Array.from(players).slice(0, MAX_CARS).map((player, index) => {
    const p = typeof player === 'string' ? { name: player } : (player || {});
    const vehicleSpec=p.vehicleSpec||getVehicleSpec(p.racerType);
    return { id: p.id ?? p.name ?? index, name: String(p.name ?? p.id ?? `Car ${index + 1}`), color: p.color ?? '#f4c35e', index,
      massKg:finite(p.massKg,vehicleProfile(p).massKg),powerW:finite(p.powerW,vehicleProfile(p).powerW),brakeFactor:finite(p.brakeFactor,vehicleProfile(p).brakeFactor),cg:vehicleProfile(p).cg,suspensionHz:vehicleProfile(p).suspensionHz,
      racerType: p.racerType || null, vehicleName: p.vehicleName || null, category: p.category || null,
      vehicleSpec,specBasis:p.specBasis,sources:p.sources,engineType:vehicleSpec?.engineType||'electric',
      speedFactor: clamp(finite(p.speedFactor, 1), 0.38, 1.12),
      accelerationFactor: clamp(finite(p.accelerationFactor, 1), 0.35, 1.3),
      gripFactor: clamp(finite(p.gripFactor, 1), 0.75, 1.25),
      durabilityFactor: clamp(finite(p.durabilityFactor, 1), 0.7, 1.6),
    };
  });
  const trackLength = Math.max(1, finite(track.totalLength, 1));
  const finishDistance = Math.max(1, finite(track.raceDistance, trackLength * 5));
  const cars = [], pickups = [], hazards = [], projectiles = [], waves = [], results = [];
  let trafficSnapshot=[],carsById=new Map();
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
    // Equal box opportunities. The result is drawn from the collecting driver's
    // separate item RNG, never from the row, rank, name or another inventory.
    ITEM_TYPES.forEach((_, gateId) => {
      const distance = trackLength * (0.06 + gateId * 0.09);
      const half = sample(distance).width / 2 - CAR_WIDTH * 0.65;
      const columns = Math.max(2, Math.ceil(half * 2 / 2.8));
      for (let col = 0; col < columns; col++) pickups.push({
        id: `pickup-${gateId}-${col}`, gateId, type: 'box', distance,
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
        lateral: side * 1.55, speed: 0, topSpeed:p.vehicleSpec?p.vehicleSpec.topSpeedKph/3.6:TOP_SPEED*p.speedFactor, maxSpeed:p.vehicleSpec?p.vehicleSpec.topSpeedKph/3.6:TOP_SPEED*p.speedFactor,
        heading: 0, spin: 0, spinAngle: 0, finished: false,
        lateralVelocity: 0, yawRate: 0, slip: 0, targetSpeed: 0,
        length: CAR_LENGTH, width: CAR_WIDTH, preferredLane: side * 1.8,
        spinDirection: side, spinRate:7.2, tractionRecovery:0, _bananaSpin:false, stuckTime: 0, previousProgress: -Math.floor(gridPosition / 2) * 6.7,
        boost: 0, brake: 0, damage: 0, damageLevel: 0, hitPoints: 100,
        replacements: 0, replacementPending: 0, replacementRemaining: 0,
        draft: 0, drafting: 0, drag: 0, acceleration: 0,
        propulsion: 'electric', motorPowerW: 0, regenW: 0, batteryEnergyJ: BATTERY_J * 0.8, batterySOC: 0.8,
        dragN: 0, downforceN: 0, nitroAcceleration: 0,
        nitro: { reservoir: 1, heat: 0, remaining: 0, cooldown: 0 }, strategySeed,
        offRoad: false, mistakeTimer: 0, mistakeType: null, mistake: null, activeItem: null,
        inventoryItem: null, inventoryPhase: 'empty', inventorySerial: 0,
        rouletteRemaining: 0, rouletteDuration: ROULETTE_DURATION, itemUseAt: Infinity,
        lastUsedItem: null, itemsCollected: 0, itemsUsed: 0,
        _itemRandom: rng(strategySeed ^ 0x51C0F17E),
        _impactRandom:rng(strategySeed^0x21B04F37),_timingRandom:rng(strategySeed^0x710FC21B),
        flightHeight: 0, flightRemaining: 0, flightDuration: FLIGHT_DURATION, verticalVelocity: 0, landingImpulse: 0,
        flightKind: null, rampState: 'ground', rampId: null, rampHeight: 0, rampPitch: 0,
        trickAngle: 0, trickFlips: 0, completedFlips: 0, trickSpeedBonus: 0, rampTakeoffs: 0,
        airAttitude:null,airRoll:0,landingPitch:0,landingRoll:0,recoveryRemaining:0,farOffRoadTime:0,
        attackSlowRemaining:0,attackSpeedCap:Infinity,attackSource:null,
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
    createPickups();
  }
  function startSpin(car, direction, strength = 1) {
    if (car.finished || car.spin > 0) return;
    car.spin = clamp(0.6 + strength * 0.12, 0.6, 1.2);car.spinRate=7.2;
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
    return { near, lead, gap, draft, all:snapshot };
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
    const plan=planRampApproach(car,ramps,trackLength,traffic.all,curvatureAt);
    if(car.rampState==='approach') return ramps.find(r=>r.id===car.rampId)?.lateral??target;
    car.rampPlan=plan;
    if(plan){
      if(plan.reachable){target=clamp(plan.target,-limit,limit);car._passUntil=0;}
      else if(car._rampSkipKey!==plan.key+':'+plan.reason){car._rampSkipKey=plan.key+':'+plan.reason;emit('ramp-skip',car,{rampId:plan.id,reason:plan.reason});}
    }
    return clamp(target, -limit - 2.5, limit + 2.5);
  }
  function targetSpeedFor(car, curvature, traffic) {
    const bonusScale = Math.min(1, car.speedFactor);
    let target = car.topSpeed * car._pace + bonusScale * (car.trickSpeedBonus + (car.repairRemaining > 0 ? 5 : 0) + (car.boost > 0 ? 12 : 0) + (car.rocketRemaining > 0 ? 18 : 0));
    const lateBrake = car.mistakeType === 'late-brake';
    const braking = BRAKE_ACCEL * car.brakeFactor * car._brakeTiming * (lateBrake ? 0.42 : 0.86);
    // Brake before bends throughout the stopping horizon. Tire load still
    // limits the actual turn, including if an error delayed braking.
    for (const offset of [0, 12, 25, 43, 68]) {
      const curve = Math.abs(offset ? curvatureAt(car.distance + offset) : curvature);
      const corner = Math.sqrt(CORNER_GRIP * car.gripFactor * (lateBrake ? 1.18 : 0.88) / Math.max(curve, 0.0001));
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
    const normal=car.topSpeed+Math.min(1,car.speedFactor)*(25+car.trickSpeedBonus);
    return car.attackSlowRemaining>0?Math.min(normal,car.attackSpeedCap):normal;
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
    car.attackSlowRemaining=Math.max(0,car.attackSlowRemaining-dt);if(!car.attackSlowRemaining){car.attackSpeedCap=Infinity;car.attackSource=null;}
    car.landingImpulse = Math.max(0, car.landingImpulse - dt * 0.65);car.tractionRecovery=Math.max(0,car.tractionRecovery-dt);
    car.recoveryRemaining=Math.max(0,car.recoveryRemaining-dt);
    if(car.flightRemaining<=0){car.landingPitch*=Math.exp(-4*dt);car.landingRoll*=Math.exp(-4*dt);car.airRoll=0;}
    if (car.flightRemaining > 0 && car.flightKind === 'ramp') {
      car._rampFlightElapsed+=dt;
      const t=car._rampFlightElapsed,roadY=roadSurface(track,car.distance,car.lateral).y;
      const worldY=car._rampTakeoffWorldY+car._rampTakeoffVelocity*t-.5*RAMP_GRAVITY*t*t;
      car.flightHeight=Math.max(0,worldY-roadY);car.verticalVelocity=car._rampTakeoffVelocity-RAMP_GRAVITY*t;
      car.flightRemaining=Math.max(.001,car.flightDuration-t);
      advanceAttitude(car,dt);
      car.rampPitch=car._rampTakeoffPitch;
      if(t>.1&&worldY<=roadY&&car.verticalVelocity<0){
        const impact=-car.verticalVelocity;car.landingImpulse=clamp(impact/16,.2,1);
        car.flightRemaining=0;car.flightHeight=0;car.verticalVelocity=0;
        const landedOnRoad=Math.abs(car.lateral)+car.width*.5<=sample(car.distance).width/2;
        const attitude=landingAttitude(car),settled=attitude.upright,fullFlips=landedOnRoad&&settled?attitude.flips:0,beforeBonus=car.trickSpeedBonus;
        car.landingPitch=attitude.pitch;car.landingRoll=attitude.roll;car.recoveryRemaining=settled?.25:1.3;
        car.airAttitude=null;car.tractionRecovery=Math.max(car.tractionRecovery,settled?.25:1.5);
        car.completedFlips+=fullFlips;car.trickSpeedBonus=Math.min(MAX_TRICK_BONUS,beforeBonus+fullFlips*TRICK_BONUS_PER_FLIP);
        car.trickAngle=fullFlips*Math.PI*2;car.rampState='ground';car.rampHeight=0;car.rampPitch=0;car.flightKind=null;
        car.lateralVelocity*=.65;car.heading*=.65;car.speed*=landedOnRoad&&settled?.985:.80;
        emit('ramp-land',car,{rampId:car.rampId,fullFlips,successful:landedOnRoad&&settled,impactSpeed:impact,trickAngle:car.trickAngle,speedBonus:car.trickSpeedBonus,intensity:car.landingImpulse});
        if(fullFlips)emit('trick-complete',car,{rampId:car.rampId,fullFlips,trickAngle:car.trickAngle,beforeBonus,speedBonus:car.trickSpeedBonus,bonusAdded:car.trickSpeedBonus-beforeBonus,intensity:.9});
      }
    } else if (car.flightRemaining > 0) {
      car.flightRemaining = Math.max(0, car.flightRemaining - dt);
      const phase = 1 - car.flightRemaining / car.flightDuration;
      car.flightHeight = FLIGHT_HEIGHT * 4 * phase * (1 - phase);
      car.verticalVelocity = FLIGHT_HEIGHT * 4 * (1 - 2 * phase) / car.flightDuration;
      if (!car.flightRemaining) {
        car.flightHeight = 0; car.verticalVelocity = 0; car.landingImpulse = 1;
        car.lateralVelocity *= 0.35; car.heading *= 0.3;
        if (!car.finished) car.speed *= 0.94;
        car.flightKind = null;
        emit('launch-land', car, { intensity: 0.8 });
      }
    }
  }
  function updateRampContact(car) {
    if(car.finished||car.flightRemaining>0)return;
    const p=vehicleProfile(car),foot=wheelFootprint(car),front=Math.max(...foot.map(w=>w.d)),rear=Math.min(...foot.map(w=>w.d));
    car.rampHeight=0;car.rampPitch=0;
    for(const ramp of ramps){
      const lap=Math.max(0,Math.floor((car.distance+front-ramp.distance)/trackLength)),start=ramp.distance+lap*trackLength,lip=start+ramp.length,key=car.gridPosition+':'+ramp.id+':'+lap;
      if(rampHits.has(key)||car.distance+front<start||car.distance+rear>lip+car.speed*STEP+.1)continue;
      const inside=foot.filter(w=>Math.abs(car.lateral+w.l-ramp.lateral)<ramp.width/2-.08).length,aligned=inside===4;
      const engaged=car._rampEngagedKey===key;
      if(!engaged){
        if(!inside||car.previousProgress+front>start+.6)continue;
        car._rampEngagedKey=key;car.rampId=ramp.id;car._rampLap=lap;
        emit('ramp-approach',car,{rampId:ramp.id,height:ramp.height,length:ramp.length,intensity:.55});
      }
      let support=rampSupport(car,ramp,start,{extendLip:true});
      if(!support.contacts&&car._lastRampSupport)support=car._lastRampSupport;
      car.rampState='approach';car.rampHeight=support.height;car.rampPitch=support.pitch;car.trickAngle=0;car.rampWheelContacts=support.wheels;
      if(car.distance+rear<lip&&inside){car._lastRampSupport=support;return;}
      rampHits.add(key);
      const coverage=support.wheels.filter(w=>w.inside).length/4;
      const pitch=car.distance+rear>=lip?Math.atan(rampSlopeAt(ramp,1))*coverage:support.pitch;
      const grade=Math.atan2(track.sampleTrack(car.distance).tangent.y,1);
      const velocity=Math.max(0,car.speed*Math.sin(pitch+grade));
      const height=support.height,worldY=roadSurface(track,car.distance,car.lateral).y+height;
      car.flightDuration=(velocity+Math.sqrt(velocity*velocity+2*RAMP_GRAVITY*height))/RAMP_GRAVITY;
      car.flightDuration=Math.max(.15,car.flightDuration);car.flightRemaining=car.flightDuration;car.flightKind='ramp';car.rampState='airborne';
      car._rampTakeoffWorldY=worldY;car._rampTakeoffHeight=height;car._rampTakeoffVelocity=velocity;car._rampTakeoffPitch=pitch;car._rampFlightElapsed=0;
      car.flightHeight=height;car.verticalVelocity=velocity;car.rampHeight=0;car.rampPitch=pitch;car.speed=Math.max(1,car.speed*Math.cos(pitch));
      car.airAttitude=launchAttitude(p,support,{verticalVelocity:velocity,heading:car.heading,yawRate:car.yawRate,lateralVelocity:car.lateralVelocity,speed:car.speed,duration:car.flightDuration,pitch});
      car.airRoll=car.airAttitude.roll;car.trickFlips=0;car.trickAngle=0;car.rampTakeoffs++;car._lastRampSupport=null;
      emit('ramp-takeoff',car,{rampId:ramp.id,duration:car.flightDuration,height,verticalVelocity:velocity,fullFlips:car.trickFlips,rearAt:car.distance+rear,lip,lateralError:car.lateral-ramp.lateral,intensity:.9});
      return;
    }
    if(car.rampState==='approach')car.rampState='ground';
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
    // Normal-load sensitivity couples the four contact loads back into the
    // shared tyre budget. Large load transfers reduce usable combined grip.
    const contactLoads=wheelLoads(car);
    const tireFactor=car.flightRemaining>0?1:clamp(contactLoads.reduce((n,w)=>n+w.load*(1-.10*Math.abs(w.load/.25-1)),0),.78,1);
    car.tireGripFactor=tireFactor;
    const envelope = raceForceEnvelope({ speed: car.speed, curvature, draft: car.draft, offRoad: Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf, gripFactor:(car.vehicleSpec?1:car.gripFactor)*tireFactor,massKg:car.massKg,vehicleSpec:car.vehicleSpec });
    car.dragN = envelope.dragN; car.downforceN = envelope.downforceN;
    car.drag = envelope.dragAccel + envelope.rollingAccel;
    car.rocketAcceleration = car.rocketRemaining > 0 ? 9 / (1 + (car.speed / 65) ** 2) : 0;
    if (car.flightRemaining > 0) {
      // A bounded flight follows course progress continuously. Ground contact,
      // tires and pickups cannot teleport it or alter its actual crossing time.
      car.spin = 0; car.spinAngle *= Math.exp(-5 * dt);
      car.nitroAcceleration = stepNitro(car, dt, 0); car.motorPowerW = 0; car.regenW = 0; car.brake = 0;
      car.speed = clamp(car.speed + (car.rocketAcceleration + car.nitroAcceleration - car.drag * 0.35) * dt, 4, speedLimitFor(car));
      if(car.airAttitude){
        // Rotate velocity into the changing road frame: the airborne car keeps
        // its world momentum instead of magically following a curved rail.
        const turn=curvature*car.speed*Math.cos(car.airAttitude.headingAtLaunch)*dt;
        car.airAttitude.headingAtLaunch-=turn;car.heading-=turn;
        car.lateralVelocity=car.speed*Math.sin(car.airAttitude.headingAtLaunch);
      }else car.lateralVelocity*=Math.exp(-.22*dt);
      car.yawRate = car.airAttitude?.yawRate||0;
    } else if (car.spin > 0) {
      car.spin = Math.max(0, car.spin - dt); car.spinAngle += car.spinDirection * dt * (car.spinRate||7.2);
      car.heading = clamp(car.heading + car.spinDirection * dt * 0.7, -0.65, 0.65);
      car.speed = Math.max(4, car.speed - (5.2 + car.drag * 0.3) * dt);
      car.lateralVelocity *= Math.exp(-1.05 * dt); car.brake = 0;
      car.nitroAcceleration = stepNitro(car, dt, 0); car.motorPowerW = 0; car.regenW = 0;
      if (!car.spin) { if(car._bananaSpin){car.tractionRecovery=2.2;car._bananaSpin=false;}car.heading *= 0.3; emit('recovery', car, { recoveryType: 'spin', intensity: 0.7 }); }
    } else {
      car.spinAngle *= Math.exp(-5 * dt);
      const desiredSpeed = targetSpeedFor(car, curvature, traffic); car.targetSpeed = desiredSpeed;
      const error = desiredSpeed - car.speed;
      const engine=car.vehicleSpec?Math.min(car.vehicleSpec.torqueNm*8*.92/.34,car.powerW*.92/Math.max(1,car.speed))/car.massKg:Math.min(ENGINE_ACCEL*car.accelerationFactor,car.powerW*car.accelerationFactor/Math.max(1,car.speed)/car.massKg);
      const gradient = (sample(car.distance).tangent.y+Math.sin(car.rampState==='approach'?car.rampPitch:0))*9.81;
      let throttle = 0;
      if (error > 0) {
        throttle = clamp(error * 0.65 + car.drag / Math.max(1, engine), 0, 1) * (car.mistakeType === 'lift' ? 0.6 : 1);
        car.brake = 0;
      } else {
        car.brake = clamp(-error * 0.7 / BRAKE_ACCEL, 0, 1);
      }
      car.throttle=throttle;
      if(car.attackSlowRemaining>0)throttle*=.35;
      const drive = raceElectricDrive({ speed: car.speed, throttle, brake: car.brake,
        energyJ: car.batteryEnergyJ, dt, longitudinalAccel: envelope.longitudinalAccel, accelerationFactor: car.accelerationFactor,massKg:car.massKg,motorPowerW:car.powerW,brakeFactor:car.brakeFactor,vehicleSpec:car.vehicleSpec });
      car.batteryEnergyJ = drive.energyJ; car.batterySOC = drive.energyJ / BATTERY_J;
      car.motorPowerW = drive.powerW; car.regenW = drive.regenW;
      car.nitroAcceleration = stepNitro(car, dt, car.brake > 0 ? 0 : Math.max(0, envelope.longitudinalAccel - drive.driveN / car.massKg));
      car.rocketAcceleration *= car.brake > 0 ? 0.25 : 1;
      if(car.attackSlowRemaining>0){car.nitroAcceleration*=.15;car.rocketAcceleration*=.15;}
      car.speed += (drive.acceleration * (1 - car.damage * 0.15) + (error > 0 && car.brake <= 0 ? Math.min(1.8, car.trickSpeedBonus * 0.18) + (car.repairRemaining > 0 ? 1.7 : 0) : 0) + car.nitroAcceleration + car.rocketAcceleration - car.drag - gradient - (car.freezeRemaining > 0 ? 3.5 : 0)) * dt;
      car.speed = clamp(car.speed, 0, speedLimitFor(car));
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
      const lateralGrip = SIDE_GRIP * car.gripFactor * tireFactor * (car.tractionRecovery>0?.62+.38*(1-car.tractionRecovery/2.2):1) * grip * (offRoad ? 0.42 : 1) * (car.freezeRemaining > 0 ? 0.32 : 1);
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
    // Cars may actually leave the course. Only a sustained excursion invokes a
    // visible safety recovery, with lost progress; airborne cars are never railed.
    car.farOffRoadTime=car.flightRemaining<=0&&Math.abs(car.lateral)>roadHalf+22?car.farOffRoadTime+dt:0;
    if(car.farOffRoadTime>3){car.distance=Math.max(0,car.distance-12);car.lateral=Math.sign(car.lateral)*(roadHalf+1.5);car.lateralVelocity=0;car.speed=4;car.heading=-Math.sign(car.lateral)*.18;car.farOffRoadTime=0;emit('recovery',car,{recoveryType:'safety-return',penaltyMetres:12});}
    car.offRoad = car.flightRemaining <= 0 && Math.abs(car.lateral) + CAR_WIDTH * 0.5 > roadHalf;
    if (car.offRoad && !car._wasOffRoad) emit('offroad', car, { intensity: 0.6 });
    if (!car.offRoad && car._wasOffRoad) emit('recovery', car, { recoveryType: 'offroad', intensity: 0.6 });
    car._wasOffRoad = car.offRoad;
    car.distance += Math.max(0,car.speed*Math.cos(car.airAttitude?.headingAtLaunch??car.heading))*(car.rampState==='approach'?Math.cos(car.rampPitch):1)*dt;
    updateRampContact(car);
    car.wheelLoads=wheelLoads(car);
    car.steeringAngle=clamp(Math.atan(vehicleProfile(car).wheelbase*(curvature+car.yawRate/Math.max(3,car.speed))),-.48,.48);
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
        da.d -= nx * separation; db.d += nx * separation; da.l -= ny * separation; db.l += ny * separation;
        const closing = -((b.speed - a.speed) * nx + (b.lateralVelocity - a.lateralVelocity) * ny);
        if (closing <= 0.25) continue;
        const impulse = Math.min(12, closing * 0.56),scaleA=2*b.massKg/(a.massKg+b.massKg),scaleB=2*a.massKg/(a.massKg+b.massKg);
        const shieldA = a.shieldRemaining > 0, shieldB = b.shieldRemaining > 0;
        if (!shieldA) { da.v -= impulse * scaleA * nx + a.speed * 0.015; da.side -= impulse * scaleA * ny * 0.42; }
        if (!shieldB) { db.v += impulse * scaleB * nx - b.speed * 0.015; db.side += impulse * scaleB * ny * 0.42; }
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
  function queueItem(car, type, pickupId = 'test-opportunity') {
    if (!car || car.finished || car.inventoryItem || !ITEM_TYPES.includes(type)) return false;
    car.inventoryItem=type;car.inventoryPhase='rolling';car.rouletteRemaining=ROULETTE_DURATION;
    car.inventorySerial++;car.itemsCollected++;
    car.itemUseAt=time+ROULETTE_DURATION;car._nextItemThink=car.itemUseAt;
    emit('item-pickup',car,{itemType:type,pickupId,inventorySerial:car.inventorySerial,duration:ROULETTE_DURATION});
    return true;
  }
  function deployItem(car) {
    if (!car || car.finished || car.inventoryPhase!=='ready' || !car.inventoryItem) return false;
    const type=car.inventoryItem;
    // Ground-dependent items wait through deck contact and ballistic flight.
    // A launch must not reset height mid-jump; tyres cannot spend nitro in air,
    // and road-level weapons must originate from a supported vehicle.
    if((car.flightRemaining>0||car.rampState==='approach')&&['launch','boost','bomb','missile','banana','shockwave','freeze'].includes(type))return false;
    // A boost is retained until its reservoir/cooldown can accept it; it never
    // disappears as an offered but inert item.
    if(type==='boost' && (car.nitro.remaining>0 || car.nitro.cooldown>0 || car.nitro.reservoir<.35))return false;
    // Capacity never silently deletes another driver's live weapon. Keep the
    // new inventory ready until its pool has room; one live bomb per owner.
    if(type==='bomb'&&projectiles.some(p=>p.type==='bomb'&&p.ownerId===car.id))return false;
    if(type==='missile'&&projectiles.filter(p=>p.type==='missile').length>=MAX_MISSILES)return false;
    if((type==='shockwave'||type==='freeze')&&waves.length>=MAX_WAVES)return false;
    if(type==='banana'&&hazards.length>=MAX_BANANAS)return false;
    car.inventoryItem=null;car.inventoryPhase='empty';car.itemUseAt=Infinity;car.itemsUsed++;car.lastUsedItem=type;
    emit('item-use',car,{itemType:type,inventorySerial:car.inventorySerial});
    useItem(car,{type});car._itemAim=null;return true;
  }
  function advanceInventory(car,dt) {
    if(car.finished)return;
    if(car.inventoryPhase==='rolling') {
      car.rouletteRemaining=Math.max(0,car.rouletteRemaining-dt);
      if(car.rouletteRemaining<=1e-8){car.inventoryPhase='ready';emit('item-ready',car,{itemType:car.inventoryItem,inventorySerial:car.inventorySerial});}
    }
    if(autoItems&&car.inventoryPhase==='ready'&&time>=car.itemUseAt&&time>=(car._nextItemThink||0)){
      car._nextItemThink=time+.16+car._timingRandom()*.12;
      const decision=itemDecision(car,canonicalCars,{trackLength,curvature:curvatureAt,projectiles,waves});car.itemDecision=decision;
      if(decision.use){car._itemAim=decision;deployItem(car);}
    }
  }
  function useItem(car, pickup) {
    car.activeItem = pickup.type; car._itemTimer = 1.1;
    if (pickup.type === 'launch') {
      if (car.spin > 0 || car.freezeRemaining > 0) emit('recovery', car, { recoveryType: 'launch', intensity: 0.65 });
      car.flightRemaining = car.flightDuration = FLIGHT_DURATION; car.flightKind = 'launch';
      car.rampState = 'ground'; car.rampHeight = 0; car.rampPitch = 0; car.trickAngle = 0;car.airAttitude=null;car.airRoll=0;car.landingPitch=car.landingRoll=0;
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
      car.attackSlowRemaining=0;car.attackSpeedCap=Infinity;car.attackSource=null;
      const beforeSpeed = car.speed, previousDamage = car.damage;
      if (car.spin > 0 || car.freezeRemaining > 0) emit('recovery', car, { recoveryType: 'repair', intensity: 0.65 });
      car.speed = Math.max(car.speed, Math.min(car.topSpeed + Math.min(1, car.speedFactor) * (car.trickSpeedBonus + 5), car.speed + Math.max(6, Math.min(16, car._lostSpeed))));
      car.repairRemaining = 4; car.shieldRemaining = Math.max(car.shieldRemaining, 3);
      car.damage = 0; car.replacementPending = 0; car.replacementRemaining = 0;
      refreshDamageState(car);
      car._lostSpeed = 0; car.spin = 0; car.freezeRemaining = 0;
      car.heading *= 0.25; car.lateralVelocity *= 0.3;
      car.batteryEnergyJ = Math.min(BATTERY_J, car.batteryEnergyJ + BATTERY_J * 0.05);
      car.batterySOC = car.batteryEnergyJ / BATTERY_J;
      emit('repair', car, { beforeSpeed, afterSpeed: car.speed, beforeDamage: previousDamage, afterDamage: car.damage, restoredSpeed: car.speed - beforeSpeed, repairedDamage: previousDamage, duration: car.repairRemaining, protectionDuration: car.shieldRemaining, intensity: 0.8 });
    } else if (pickup.type === 'missile') {
      const target = canonicalCars.find(c=>c.id===car._itemAim?.targetId&&!c.finished&&c.flightRemaining<=0)||nearestForwardTarget(car.distance, car.id, 220);
      const projectile = { id: `missile-${++serial}`, type: 'missile', ownerId: car.id, targetId: target?.id ?? null,
        distance: car.distance + CAR_LENGTH * 0.9, lateral: car.lateral, speed: Math.max(82, car.speed + 38), age: 0, ttl: 4.5, height: 1.5, heading: 0 };
      boundProjectile('missile', MAX_MISSILES); projectiles.push(projectile);
      emit('missile-launch', car, { projectileId: projectile.id, targetId: projectile.targetId, distance: projectile.distance, lateral: projectile.lateral, intensity: 0.9 });
    } else if (pickup.type === 'shockwave' || pickup.type === 'freeze') {
      const wave = { id: `${pickup.type}-${++serial}`, type: pickup.type, ownerId: car.id,
        distance: car.distance + CAR_LENGTH, lateral: car.lateral, speed: pickup.type==='shockwave'?Math.max(85,car.speed+42):Math.max(62,car.speed+25), age: 0, ttl: pickup.type==='shockwave'?14:3.6,
        radius: pickup.type === 'shockwave' ? 4.2 : 3.8, height: 1.65, previousHeight: 1.65,
        carrier: pickup.type === 'shockwave' ? 'jellyfish' : 'frost', heading: 0, distanceTravelled: 0, maxTravel: pickup.type==='shockwave'?1000:230, hitIds: [] };
      if (waves.length >= MAX_WAVES) waves.shift(); waves.push(wave);
      emit(`${pickup.type}-launch`, car, { waveId: wave.id, distance: wave.distance, lateral: wave.lateral, radius: wave.radius, intensity: 0.9 });
    } else if (pickup.type === 'boost') {
      const n = car.nitro;
      if (n.remaining <= 0 && n.cooldown <= 0 && n.reservoir >= 0.35) {
        n.remaining = BOOST_DURATION * Math.min(1, n.reservoir); car.boost = n.remaining;
        emit('boost', car, { duration: car.boost, intensity: 0.9, propulsion: 'electric-overdrive' });
      }
    } else if (pickup.type === 'banana') {
      const hazard = { id: `banana-${++serial}`, type: 'banana', ownerId: car.id, distance: car.distance - CAR_LENGTH * 0.8, lateral: car.lateral,
        previousDistance: car.distance - CAR_LENGTH * 0.8, previousLateral: car.lateral, age: 0, ttl: 24, armed: false, phase: 'airborne',
        height: .6, verticalVelocity: 1.7, speed: Math.max(0,car.speed*.15), heading: 0, landedAt: null };
      if (hazards.length >= MAX_BANANAS) hazards.shift(); hazards.push(hazard);
      emit('banana-launch', car, { hazardId: hazard.id, distance: hazard.distance, lateral: hazard.lateral, height: hazard.height, verticalVelocity: hazard.verticalVelocity, speed: hazard.speed, intensity: 0.7 });
    } else if (pickup.type === 'bomb') {
      const speed = Math.max(110, car.speed + 65);
      const projectile = { id: `bomb-${++serial}`, type: 'bomb', ownerId: car.id, distance: car.distance + CAR_LENGTH * 0.8, lateral: car.lateral,
        speed, age: 0, ttl: trackLength * 1.5 / speed + 2, fuse: trackLength * 1.5 / speed,
        distanceTravelled: 0, maxTravel: trackLength*1.5, height: 1.0, verticalVelocity: 3.2, heading: 0,lateralSpeed:car._itemAim?.aimLateralSpeed||0,targetId:car._itemAim?.targetId||null };
      // One live bomb per owner; a second draw stays ready until this one
      // resolves. Never evict a competitor's live shot to fit a new draw.
      projectiles.push(projectile);
      emit('bomb-launch', car, { projectileId: projectile.id, distance: projectile.distance, lateral: projectile.lateral, intensity: 0.65 });
    }
  }
  function collectItems(car) {
    if (car.finished || car.inventoryItem || car.distance < 0 || car.flightHeight > 2.8) return;
    for (const pickup of pickups) {
      if (!pickup.active) continue;
      const lap = Math.round((car.distance - pickup.distance) / trackLength); if (lap < 0) continue;
      const at = pickup.distance + lap * trackLength;
      const swept = at >= Math.min(car.previousProgress, car.distance) - CAR_LENGTH * 0.4 && at <= Math.max(car.previousProgress, car.distance) + CAR_LENGTH * 0.4;
      if (!swept || Math.abs(car.lateral - pickup.lateral) > pickup.radius + CAR_WIDTH * 0.45) continue;
      // Almost every box is far away on each fixed step. Build ownership keys
      // only after the inexpensive spatial rejection, preserving pickup order.
      const key = `${car.gridPosition}:${pickup.gateId}:${lap}`;
      if (pickupHits.has(key)) continue;
      pickupHits.add(key); queueItem(car, drawItem(car._itemRandom), pickup.id);
      break;
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
  function attackPenalty(car,type,beforeSpeed,strength=1){
    const severity=.92+car._impactRandom()*.16,duration={bomb:6,missile:5,shockwave:5.5,freeze:6,banana:8}[type]*severity;
    const factor={bomb:.48,missile:.50,shockwave:.58,freeze:.42,banana:.52}[type];
    car.attackSpeedCap=Math.max(7,beforeSpeed*(1-(1-factor)*(.65+.35*clamp(strength,.35,1)))/severity);
    car.attackSlowRemaining=duration;car.attackSource=type;car.speed=Math.min(car.speed,car.attackSpeedCap);
    car._hitImmune=duration+1.2;return duration;
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
      startSpin(car, side, 1.5 + strength * 2.5);
    }
    const penaltyDuration=attackPenalty(car,type,beforeSpeed,strength);recordImpact(car,beforeSpeed,type==='freeze'?.06:.18);
    emit(`${type}-hit`, car, { projectileId: source.id, waveId: source.id, ownerId: source.ownerId,
      duration:penaltyDuration,beforeSpeed,afterSpeed:car.speed,speedCap:car.attackSpeedCap,damage:car.damage,intensity:.5+strength*.5 });
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
        const contacts = canonicalCars.filter(car => !car.finished && car.flightRemaining <= 0 && car._hitImmune <= 0 && car.id !== h.ownerId &&
          Math.abs(courseGap(car.distance, h.distance)) < CAR_LENGTH * 0.42 + 0.65 && Math.abs(car.lateral - h.lateral) < CAR_WIDTH * 0.5 + 0.8)
          .sort((a, b) => Math.abs(courseGap(a.distance, h.distance)) - Math.abs(courseGap(b.distance, h.distance)) || a.gridPosition - b.gridPosition);
        if (contacts.length) {
          const car = contacts[0];
          if (!blockedHit(car, 'banana')) {
            const beforeSpeed=car.speed;
            startSpin(car,Math.sign(car.lateral-h.lateral||car.lateralVelocity||1),2.8);car.spin=Math.max(car.spin,6.2);car.spinRate=4.5;car._bananaSpin=true;
            const penaltyDuration=attackPenalty(car,'banana',beforeSpeed);
            recordImpact(car, beforeSpeed, 0.12);
            emit('banana-hit',car,{hazardId:h.id,ownerId:h.ownerId,beforeSpeed,afterSpeed:car.speed,duration:penaltyDuration,speedCap:car.attackSpeedCap,damage:car.damage,intensity:.85});
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
      p.distance += p.speed * dt;if(p.type==='bomb')p.lateral+=(p.lateralSpeed||0)*dt;
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
    if(trafficSnapshot.length!==canonicalCars.length||trafficSnapshot.some((s,i)=>s.id!==canonicalCars[i].id)){
      trafficSnapshot=canonicalCars.map(car=>({id:car.id}));carsById=new Map(canonicalCars.map(car=>[car.id,car]));
    }
    const snapshot=trafficSnapshot;
    for(let i=0;i<canonicalCars.length;i++){const car=canonicalCars[i],s=snapshot[i];s.distance=car.distance;s.lateral=car.lateral;s.speed=car.speed;s.finished=car.finished;}
    for (const car of canonicalCars) integrateCar(car, dt, snapshot);
    for (const car of canonicalCars) advanceInventory(car,dt);
    resolveCollisions();
    for (const car of canonicalCars) if (!car.finished) { applyTrackHazards(car); collectItems(car); }
    updateItems(dt);
    const finishers = [], currentById = carsById;
    for (let i = 0; i < canonicalCars.length; i++) {
      const car = canonicalCars[i]; if (car.finished) continue;
      if (car.previousProgress < finishDistance && car.distance >= finishDistance) {
        car._finishFraction = clamp((finishDistance - car.previousProgress) / Math.max(1e-8, car.distance - car.previousProgress), 0, 1);
        car.finished = true; car.finishTime = time - dt + dt * car._finishFraction; finishers.push(car);
        car.inventoryItem=null;car.inventoryPhase='empty';car.rouletteRemaining=0;car.itemUseAt=Infinity;
        car.attackSlowRemaining=0;car.attackSpeedCap=Infinity;car.attackSource=null;car.activeItem=null;car._itemTimer=0;car.freezeRemaining=car.rocketRemaining=car.shieldRemaining=car.repairRemaining=car.boost=0;car.nitro.remaining=0;
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
    if(cars.length&&results.length===cars.length){hazards.length=0;projectiles.length=0;waves.length=0;}
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
    // Shared mechanics entry points for deterministic verification and future
    // human-driver controls. They enforce the same inventory/phase guards.
    awardItem(id,type) { return !disposed && queueItem(cars.find(c=>c.id===id),type); },
    useHeldItem(id) { return !disposed && deployItem(cars.find(c=>c.id===id)); },
    reset() { if (!disposed) createGrid(); },
    dispose() {
      disposed = true; cars.length = 0; canonicalCars = []; events.length = 0;
      trafficSnapshot=[];carsById.clear();
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
  massKg: MASS, batteryJ: BATTERY_J, motorPowerW: MOTOR_POWER_W,
  maxBananas: MAX_BANANAS, maxBombs: MAX_BOMBS, maxMissiles: MAX_MISSILES, maxWaves: MAX_WAVES,
  boostDuration: BOOST_DURATION, blastRadius: BLAST_RADIUS, flightDuration: FLIGHT_DURATION, flightHeight: FLIGHT_HEIGHT,
  rocketDuration: ROCKET_DURATION, shieldDuration: SHIELD_DURATION, freezeDuration: FREEZE_DURATION,
  damageLevels: DAMAGE_LEVELS, replacementDelay: REPLACEMENT_DELAY, replacementRecovery: REPLACEMENT_RECOVERY,
  maxTrickBonus: MAX_TRICK_BONUS, trickBonusPerFlip: TRICK_BONUS_PER_FLIP, rampGravity: RAMP_GRAVITY,
  powerTypes: RACE_POWER_TYPES,
});
