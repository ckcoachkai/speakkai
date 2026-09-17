// Wider framing holds the enlarged wolf while preserving runner world-space size.
export const WORLD = { width: 3911.111111111111, height: 2200, cameraScale: 1600 / 3911.111111111111, finishX: 3000 };
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const smoothstep = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const STRIDE = 230;

export function advanceRunner(s, dt, age) {
  const target = Math.min(390, 105 + age * 16) * s.base * (s.boost ? 2 : 1);
  // Exponential damping is stable at both 30 and 120 FPS.
  s.speed = mix(s.speed, target, 1 - Math.exp(-dt * 3.5));
  const previousStep = Math.floor(s.phase / Math.PI);
  const distance = s.speed * dt;
  s.distance += distance;
  s.phase += distance / STRIDE * Math.PI * 2;
  s.progress = s.distance / (WORLD.finishX - s.start);
  return Math.floor(s.phase / Math.PI) > previousStep;
}

export function runnerPose(s, mouth, gentle = false) {
  const p = clamp(s.progress);
  const leap = smoothstep((p - 0.87) / 0.13);
  const h = 248;
  const travelled = Math.min(s.distance, WORLD.finishX - s.start);
  const amplitude = gentle ? 9 : 50 + Math.min(s.speed, 650) * 0.09;
  // Both bob and zigzag follow distance, so pausing freezes the entire pose.
  const bob = s.distance > 0 ? (1 - Math.cos(s.phase * 2)) * 0.5 * amplitude * (1 - leap) : 0;
  const zigzag = Math.sin(travelled / 210 + s.i * 1.9) * (gentle ? 12 : 95) * smoothstep(p / 0.08) * (1 - leap);
  const ground = s.ground + zigzag;
  return {
    p, leap, h, w: h * 2 / 3,
    x: mix(s.start + travelled, mouth.x - h * .29, leap),
    y: mix(ground, mouth.y + h * 0.73, leap) - bob - Math.sin(leap * Math.PI) * 140,
    ground, bob,
    lean: s.distance > 0 ? (0.06 + Math.min(s.speed, 650) / 650 * 0.10 + Math.sin(s.phase) * 0.035) * (gentle ? 0.3 : 1) * (1 - leap) : 0,
    redness: smoothstep((p - 0.12) / 0.75) * 0.42,
  };
}
