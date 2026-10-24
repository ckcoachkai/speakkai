/** Driving envelopes from authoritative race telemetry; pure and testable. */
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const approach = (a, b, dt, tau) => a + (b - a) * (1 - Math.exp(-dt / tau));
export const AUDIO_PROFILES = Object.freeze({
  electric: { pitch: 1, body: .8, high: 1, idleGain: .012 },
  supercar: { pitch: 1.08, body: .95, high: 1.08, idleGain: .018 },
  muscle: { pitch: .79, body: 1.12, high: .7, idleGain: .022 },
  hypercar: { pitch: 1.17, body: .85, high: 1.15, idleGain: .014 },
});
export function newAudioState() {
  return { id: null, gear: 1, load: 0, rpm: 950, slipLevel: 0, skid: false,
    lastShiftAt: -Infinity, lastBrakeAt: -Infinity, brakeActive: false, previousSpeed: null };
}
export function audioControls(car, state, { dt = 1 / 60, time = 0, focused = true,
  enabled = true, racing = true, profile = 'electric', separation = 0, focusGain = .13 } = {}) {
  dt = clamp(num(dt, 1 / 60), 1 / 240, .1);
  const changed = state.id !== car.id;
  const speed = Math.max(0, num(car.speed));
  const v = clamp(speed / Math.max(20, num(car.topSpeed, 43)), 0, 1.5);
  const limits = [.24, .43, .65, .88, 1.18];
  const airborne = num(car.flightRemaining) > 0 || car.rampState === 'airborne';
  const brake = clamp(num(car.brake));
  const spin = num(car.spin) > .08;
  // slip is an ANGLE IN RADIANS. Sideways lane-following velocity alone is not tire loss.
  const slip = Math.abs(num(car.slip, Math.atan2(num(car.lateralVelocity), Math.max(2, speed)) - num(car.heading)));
  const accel = clamp(num(car.acceleration, state.previousSpeed === null ? 0 : (speed - state.previousSpeed) / dt), -20, 14);
  const boost = num(car.boost) > 0 && !airborne;
  const power = clamp(num(car.motorPowerW) / 180000);
  const targetLoad = clamp(.045 + power * .88 + Math.max(0, accel) * .018 + (boost ? .12 : 0) - brake * .24, .025, 1);
  let shift = 0;
  if (changed) {
    Object.assign(state, newAudioState(), { id: car.id, load: targetLoad });
    while (state.gear < 5 && v > limits[state.gear - 1] * .92) state.gear++;
    state.rpm = 950 + v / limits[state.gear - 1] * 5550;
  } else if (time - state.lastShiftAt > .35) {
    const before = state.gear;
    if (state.gear < 5 && v > limits[state.gear - 1] * .92) state.gear++;
    else if (state.gear > 1 && v < limits[state.gear - 2] * .72) state.gear--;
    if (before !== state.gear) { state.lastShiftAt = time; shift = Math.sign(state.gear - before); }
  }
  state.previousSpeed = speed;
  state.load = approach(state.load, targetLoad, dt, targetLoad > state.load ? .07 : .14);
  const targetRpm = clamp(950 + v / limits[state.gear - 1] * 5550 + state.load * 300 + (boost ? 220 : 0), 900, 7400);
  state.rpm = approach(state.rpm, targetRpm, dt, .07);
  const groundedMoving = !airborne && speed > (state.skid ? 5 : 8);
  const hardTurn = Math.abs(num(car.lateralAcceleration)) > 7 || Math.abs(num(car.yawRate)) > .22;
  const brakeScrub = brake > .52 && hardTurn && slip > .065;
  if (!groundedMoving) state.skid = false;
  else if (state.skid) state.skid = spin || slip > .055 || (brake > .42 && hardTurn && slip > .045);
  else state.skid = spin || slip > .10 || brakeScrub;
  const tireTarget = state.skid ? clamp(Math.max(spin ? .65 : 0, (slip - .055) / .245,
    brakeScrub ? .22 + brake * .2 : 0)) : 0;
  state.slipLevel = approach(state.slipLevel, tireTarget, dt, tireTarget > state.slipLevel ? .035 : .13);
  // A single chirp may accompany onset; it must not be recreated every update.
  let brakeChirp = false;
  const brakeNow = groundedMoving && brakeScrub;
  if (brakeNow && !state.brakeActive && time - state.lastBrakeAt > .8 && !changed) {
    brakeChirp = true; state.lastBrakeAt = time;
  }
  state.brakeActive = brakeNow;
  const p = AUDIO_PROFILES[profile] || AUDIO_PROFILES.electric;
  const gain = focused ? .13 + state.load * .075 : Math.min(.018 / (1 + Math.abs(separation) / 14), Math.max(0, focusGain) * .12);
  const active = enabled && racing && !car.finished;
  return {
    gear: state.gear, load: state.load, rpm: state.rpm,
    pitchHz: state.rpm / 30 * p.pitch,
    engineGain: active ? gain * (speed < 1 ? p.idleGain / .13 : 1) : 0,
    tireGain: active && focused && !airborne ? Math.min(.16, state.slipLevel * .16) * (car.offRoad ? .42 : 1) : 0,
    tireHz: 850 + state.slipLevel * 1600,
    windGain: active && focused ? Math.min(.035, v * v * .022) : 0,
    turboGain: active && focused && num(car.nitroAcceleration) > .05 ? Math.min(.055, num(car.nitroAcceleration) / 9 * .055) : 0,
    rocketGain: active && focused && num(car.rocketRemaining) > 0 ? .10 : 0,
    shift: active && focused && !changed ? shift : 0,
    brakeChirp: active && focused && brakeChirp,
    skidActive: state.skid,
  };
}
