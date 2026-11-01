import { getExhaustMounts } from './race3d-exhaust-mounts.js?v=20261101-flames';

/** Fixed-cost, shadowless propulsion glow. Add to the scaled race world. */
export function createExhaustLighting(THREE, { sceneScale = 1, reducedMotion = false } = {}) {
  const group = new THREE.Group();
  group.name = 'race3d-exhaust-lighting';
  const scale = Number.isFinite(Number(sceneScale)) && Number(sceneScale) > 0 ? Number(sceneScale) : 1;
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const slots = Array.from({ length: 2 }, (_, i) => {
    const light = new THREE.PointLight(0x64c8ff, 0, 3.2 * scale, 2);
    light.name = `race3d-exhaust-light-${i}`;
    light.castShadow = false;
    group.add(light);
    return { light, id: null, level: 0, type: null };
  });
  const local = new THREE.Vector3(), anchor = new THREE.Vector3(), rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  const roadQ = new THREE.Quaternion(), trickQ = new THREE.Quaternion(), localRight = new THREE.Vector3(1, 0, 0);
  let disposed = false, qualityId = 'medium';

  function reset() {
    for (const slot of slots) { slot.id = null; slot.type = null; slot.level = 0; slot.light.intensity = 0; }
    group.visible = false;
  }
  reset();

  function update(cars, track, dt, { active = false, quality = 'medium', visualPose } = {}) {
    if (disposed) return;
    qualityId = typeof quality === 'string' ? quality : quality?.id || 'medium';
    if (!active || !Array.isArray(cars) || !track?.sampleTrack) { reset(); return; }
    const delta = clamp(finite(dt), 0, .1);
    const capacity = qualityId === 'low' ? 1 : 2;
    const candidates = [];
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      if (!car || car.finished || car.finishHidden || car.eliminated || finite(car.itemEffects?.emp) > 0) continue;
      const rocketForce = Math.max(finite(car.rocketVectorThrust),
        (finite(car.spin) <= 0 || finite(car.flightRemaining) > 0) ? finite(car.rocketAcceleration) : 0);
      const nitroForce = Math.max(finite(car.nitroAcceleration), finite(car.spontaneousNitroAcceleration));
      const rocket = rocketForce > .001;
      if (!rocket && nitroForce <= .001) continue;
      const mounts = getExhaustMounts(car).slice(0, 7);
      if (!mounts.length) continue;
      const visual = (typeof visualPose === 'function' && visualPose(car.id)) || car;
      if (visual.finishHidden) continue;
      // The model can supply the actual sprung body transform in race-world
      // coordinates. It includes shell offsets and suspension movement.
      const matrix = visual.exhaustMatrix;
      const hasMatrix = matrix?.isMatrix4 && matrix.elements?.length === 16 &&
        matrix.elements.every(Number.isFinite);
      local.set(0, 0, 0);
      for (const mount of mounts) {
        local.x += finite(mount.position[0]) / mounts.length;
        local.y += finite(mount.position[1]) / mounts.length;
        local.z += finite(mount.position[2]) / mounts.length;
      }
      if (hasMatrix) {
        anchor.copy(local).applyMatrix4(matrix);
      } else {
        const sample = track.sampleTrack(finite(visual.distance));
        if (!sample?.position || !sample?.tangent) continue;
        const tangent = sample.tangent, right = sample.right || { x: finite(tangent.z, 1), y: 0, z: -finite(tangent.x) };
        const lateral = finite(visual.lateral), bank = clamp(finite(sample.bank), -.15, .15);
        const grade = Math.atan2(finite(tangent.y), Math.max(.001, Math.hypot(finite(tangent.x), finite(tangent.z, 1))));
        anchor.set(finite(sample.position.x) + finite(right.x) * lateral,
          finite(sample.position.y) + finite(right.y) * lateral + Math.tan(bank) * lateral + .035 +
            Math.max(0, finite(visual.flightHeight)) + Math.max(0, finite(visual.rampHeight)),
          finite(sample.position.z) + finite(right.z) * lateral);
        rotation.set(-grade - finite(visual.rampPitch) + finite(visual.airAttitude?.pitch) + finite(visual.landingPitch),
          Math.atan2(finite(tangent.x), finite(tangent.z, 1)) + finite(visual.heading) + finite(visual.spinAngle),
          bank + finite(visual.airRoll) + finite(visual.landingRoll), 'YXZ');
        roadQ.setFromEuler(rotation);
        const trick = ['ramp', 'hop'].includes(visual.flightKind) ? 0 : finite(visual.trickAngle);
        trickQ.setFromAxisAngle(localRight, trick);
        // Mean nozzle position, including the body's local somersault pivot.
        local.y -= .72; local.applyQuaternion(trickQ); local.y += .72;
        local.applyQuaternion(roadQ); anchor.add(local);
      }
      candidates.push({ id: car.id ?? i, type: rocket ? 'rocket' : 'nitro',
        intensity: clamp((rocket ? rocketForce / 9 : nitroForce / 4), .25, 1),
        x: anchor.x, y: anchor.y, z: anchor.z });
    }
    candidates.sort((a, b) => b.intensity - a.intensity);
    const claimed = new Set();
    // Keep the same car in its slot until its light fades, avoiding flashes or
    // instant teleports when the priority of a busy field changes.
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      let candidate = i < capacity ? candidates.find(c => c.id === slot.id && !claimed.has(c.id)) : null;
      if (!candidate && slot.level < .015) {
        slot.id = null;
        candidate = i < capacity ? candidates.find(c => !claimed.has(c.id) && !slots.some(s => s !== slot && s.id === c.id)) : null;
        if (candidate) slot.id = candidate.id;
      }
      if (candidate) {
        claimed.add(candidate.id); slot.type = candidate.type;
        slot.light.position.set(candidate.x, candidate.y, candidate.z);
        slot.light.color.setHex(candidate.type === 'rocket' ? 0xff873e : 0x69caff);
      }
      const target = candidate ? candidate.intensity : 0;
      // Exponential smoothing has no oscillation; reduced motion is dimmer and slower.
      const rate = target > slot.level ? (reducedMotion ? 2.5 : 5) : (reducedMotion ? 2 : 4);
      slot.level += (target - slot.level) * (1 - Math.exp(-rate * delta));
      if (slot.level < .001 && !candidate) { slot.level = 0; slot.id = null; slot.type = null; }
      // A small pool of reflected colour supports the plume without washing
      // out the road or the nozzle immediately beside the light.
      slot.light.distance = (qualityId === 'low' ? 2.4 : 3.2) * scale;
      slot.light.intensity = slot.level * (qualityId === 'low' ? .7 : 1) * (reducedMotion ? .45 : 1) * 1.8 * (scale / .2) ** 2;
    }
    group.visible = slots.some(slot => slot.level > .001);
  }
  function snapshot() {
    return { disposed, capacity: 2, active: slots.filter(slot => slot.level > .001).length, quality: qualityId,
      reducedMotion: !!reducedMotion, lights: slots.map(slot => ({ carId: slot.id, type: slot.type,
        level: slot.level, intensity: slot.light.intensity, distance: slot.light.distance,
        position: { x: slot.light.position.x, y: slot.light.position.y, z: slot.light.position.z } })) };
  }
  function dispose() { if (disposed) return; reset(); disposed = true; group.removeFromParent(); group.clear(); }
  return { group, update, reset, dispose, snapshot };
}

export default createExhaustLighting;
