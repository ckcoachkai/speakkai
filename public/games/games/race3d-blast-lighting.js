/**
 * One shadowless, road-local explosion light. Add group to the scaled race
 * world (the same parent as race3d-effects); positions are simulation-space.
 * PointLight distance is in rendered scene units, hence sceneScale.
 * A fixed light count avoids shader churn and bounds the low-quality budget.
 */
export function createBlastLighting(THREE, {
  sceneScale = .2,
  reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false
} = {}) {
  const group = new THREE.Group();
  group.name = 'race3d-blast-lighting';
  const scale = Number.isFinite(Number(sceneScale)) && Number(sceneScale) > 0 ? Number(sceneScale) : .2;
  const light = new THREE.PointLight(0xff9a45, 0, 14 * scale, 2);
  light.name = 'race3d-blast-light';
  light.castShadow = false;
  group.add(light);

  let disposed = false, age = 0, life = 0, peak = 0, cooldown = 0, lowQuality = false;
  let accepted = 0, suppressed = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const qualityId = quality => typeof quality === 'string' ? quality : quality?.id;
  const clearLight = () => { age = 0; life = 0; peak = 0; light.intensity = 0; };

  function emit({ position, intensity = 1 } = {}, { quality } = {}) {
    if (disposed) return false;
    if (!position || !Number.isFinite(Number(position.x)) || !Number.isFinite(Number(position.z))) return false;
    // Do not repeatedly restart the envelope when several cars are hit by one
    // bomb. Reduced motion also has a cooldown to avoid a train of flashes.
    if (life > 0 || cooldown > 0) { suppressed++; return false; }
    const strength = clamp(finite(intensity, 1), .1, 2.2);
    lowQuality = qualityId(quality) === 'low';
    light.position.set(Number(position.x), finite(position.y, 0) + 1.2, Number(position.z));
    light.distance = (lowQuality ? 11 : 14) * scale;
    // Inverse-square light uses scene-space distances. Scaling peak by the
    // square of the world scale preserves brightness if that scale changes.
    peak = 18 * (scale / .2) ** 2 * strength * (reducedMotion ? .22 : 1);
    life = reducedMotion ? .8 : .52;
    age = 0;
    light.intensity = 0;
    accepted++;
    return true;
  }

  function update(deltaSeconds, { active = true, quality } = {}) {
    if (disposed) return;
    if (!active) { clearLight(); cooldown = 0; return; }
    const dt = clamp(finite(deltaSeconds, 0), 0, 10);
    cooldown = Math.max(0, cooldown - dt);
    if (!life) return;
    age += dt;
    if (age >= life) {
      clearLight();
      if (reducedMotion) cooldown = .7;
      return;
    }
    // Smooth, single rise and fall, with no flicker or oscillation.
    const t = age / life;
    const attack = reducedMotion ? .3 : .16;
    const envelope = t < attack ? Math.sin((t / attack) * Math.PI / 2) :
      Math.cos(((t - attack) / (1 - attack)) * Math.PI / 2) ** 2;
    // Quality can change during an active burst; immediately respect its range.
    if (quality !== undefined) lowQuality = qualityId(quality) === 'low';
    light.distance = (lowQuality ? 11 : 14) * scale;
    light.intensity = peak * envelope * (lowQuality ? 13 / 18 : 1);
  }

  function reset() { if (disposed) return; clearLight(); cooldown = 0; accepted = 0; suppressed = 0; }
  function dispose() { if (disposed) return; reset(); disposed = true; group.removeFromParent(); }
  function snapshot() {
    return { disposed, capacity: 1, active: life > 0 ? 1 : 0, accepted, suppressed,
      reducedMotion: !!reducedMotion, intensity: light.intensity, distance: light.distance, cooldown };
  }
  return { group, emit, update, reset, dispose, snapshot };
}

export default createBlastLighting;
