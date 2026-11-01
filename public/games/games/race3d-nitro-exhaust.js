import { createFlameAssets } from './race3d-flame-material.js?v=20261101-flames';
import { getExhaustMounts } from './race3d-exhaust-mounts.js?v=20261101-flames';

/** Car-local propulsion visuals. Cosmetic only; no simulation state is changed. */
export function createNitroExhaust(THREE, { reducedMotion = false } = {}) {
  const capacity = 60, nozzlesPerCar = 7, instanceCapacity = capacity * nozzlesPerCar;
  const group = new THREE.Group();
  group.name = 'race3d-nitro-exhaust';
  const assets = createFlameAssets(THREE, { reducedMotion });
  const plumes = new THREE.InstancedMesh(assets.geometry, assets.material, instanceCapacity);
  plumes.name = 'nitro-exhaust-plumes';
  plumes.count = 0;
  plumes.frustumCulled = false;
  plumes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(plumes);

  const pose = new THREE.Object3D(), anchor = new THREE.Vector3(), local = new THREE.Vector3();
  const nozzle = new THREE.Vector3(), center = new THREE.Vector3(), direction = new THREE.Vector3();
  const worldDirection = new THREE.Vector3(), meanDirection = new THREE.Vector3();
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ'), carRotation = new THREE.Quaternion();
  const modelScale = new THREE.Vector3();
  const roadRotation = new THREE.Quaternion(), tipRotation = new THREE.Quaternion();
  const plumeAxis = new THREE.Vector3(0, 0, -1), rightAxis = new THREE.Vector3(1, 0, 0);
  const pivot = new THREE.Vector3(0, .72, 0), roadPivot = new THREE.Vector3(), rotatedPivot = new THREE.Vector3();
  const nitroColor = new THREE.Color(0x32aaff), rocketColor = new THREE.Color(0xff712b);
  let clock = 0, disposed = false, activeCars = 0, nitroCars = 0, rocketCars = 0, qualityId = 'medium';
  let anchors = [];
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function reset() {
    clock = 0; activeCars = nitroCars = rocketCars = 0; anchors = [];
    plumes.count = 0; group.visible = false; assets.update(0);
  }
  reset();
  /** visualPose optionally supplies the same pose used by car models. */
  function update(cars, track, dt, { quality = 'medium', active = false, visualPose } = {}) {
    if (disposed) return;
    qualityId = typeof quality === 'string' ? quality : quality?.id || 'medium';
    if (!active || !Array.isArray(cars) || !track?.sampleTrack) { reset(); return; }
    clock = (clock + clamp(finite(dt), 0, .1)) % 1000;
    assets.update(clock);
    let count = 0; activeCars = nitroCars = rocketCars = 0; anchors = [];
    for (let i = 0; i < cars.length && activeCars < capacity; i++) {
      const car = cars[i];
      if (!car || car.finished || car.finishHidden || car.eliminated || finite(car.itemEffects?.emp) > 0) continue;
      // Timers can outlive the actual force. The spin branch does not apply
      // rocketAcceleration, although an airborne ramp can apply vector thrust.
      const rocketForce = Math.max(finite(car.rocketVectorThrust),
        (finite(car.spin) <= 0 || finite(car.flightRemaining) > 0) ? finite(car.rocketAcceleration) : 0);
      const nitroForce = Math.max(finite(car.nitroAcceleration), finite(car.spontaneousNitroAcceleration));
      const rocket = rocketForce > .001, nitro = !rocket && nitroForce > .001;
      if (!rocket && !nitro) continue;
      const mounts = getExhaustMounts(car).slice(0, nozzlesPerCar);
      if (!mounts.length) continue;
      const visual = (typeof visualPose === 'function' && visualPose(car.id)) || car;
      if (visual.finishHidden) continue;
      // This maps the original mount frame through the rendered car and sprung
      // chassis into the effects group's race-world coordinates. It follows
      // suspension as well as road, ramp and trick motion.
      const modelMatrix = visual.exhaustMatrix;
      const exactPose = modelMatrix?.isMatrix4 && modelMatrix.elements.every(Number.isFinite);
      if (exactPose) {
        modelMatrix.decompose(anchor, carRotation, modelScale);
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
        carRotation.setFromEuler(rotation);
        // Match the rigid-car trick pivot used by car motion on non-ramp flights.
        const trickAngle = ['ramp', 'hop'].includes(visual.flightKind) ? 0 : finite(visual.trickAngle);
        if (trickAngle) {
          roadRotation.copy(carRotation);
          tipRotation.setFromAxisAngle(rightAxis, trickAngle);
          carRotation.multiply(tipRotation);
          roadPivot.copy(pivot).applyQuaternion(roadRotation);
          rotatedPivot.copy(pivot).applyQuaternion(carRotation);
          anchor.add(roadPivot).sub(rotatedPivot);
        }
      }
      const intensity = clamp((rocket ? rocketForce / 9 : nitroForce / 4), .25, 1);
      // Low amplitude movement avoids strobing; reduced motion is steady.
      const pulse = reducedMotion ? 1 : 1 + .06 * Math.sin(clock * 5 + i * 1.7);
      const length = (rocket ? 2.5 : 1.5) * (.75 + .25 * intensity) * pulse;
      const radius = (rocket ? .25 : .18) * (.85 + .15 * intensity);
      center.set(0, 0, 0); meanDirection.set(0, 0, 0);
      for (const mount of mounts) {
        const p = mount.position, d = mount.direction;
        local.set(finite(p?.[0]), finite(p?.[1]), finite(p?.[2]));
        if (exactPose) nozzle.copy(local).applyMatrix4(modelMatrix);
        else nozzle.copy(anchor).add(local.applyQuaternion(carRotation));
        center.add(nozzle);
        direction.set(finite(d?.[0]), finite(d?.[1]), finite(d?.[2], -1));
        if (direction.lengthSq() < 1e-8) direction.copy(plumeAxis);
        direction.normalize(); tipRotation.setFromUnitVectors(plumeAxis, direction);
        worldDirection.copy(direction).applyQuaternion(carRotation); meanDirection.add(worldDirection);
        pose.position.copy(nozzle); pose.quaternion.copy(carRotation).multiply(tipRotation);
        pose.scale.set(radius, radius, length); pose.updateMatrix();
        plumes.setMatrixAt(count, pose.matrix); plumes.setColorAt(count, rocket ? rocketColor : nitroColor);
        count++;
      }
      center.multiplyScalar(1 / mounts.length);
      if (meanDirection.lengthSq() < 1e-8) meanDirection.copy(plumeAxis).applyQuaternion(carRotation);
      meanDirection.normalize();
      anchors.push({ carId: car.id, type: rocket ? 'rocket' : 'nitro', x: center.x, y: center.y, z: center.z,
        intensity, directionX: meanDirection.x, directionY: meanDirection.y, directionZ: meanDirection.z });
      activeCars++; if (rocket) rocketCars++; else nitroCars++;
    }
    plumes.count = count; group.visible = count > 0;
    plumes.instanceMatrix.needsUpdate = true;
    if (plumes.instanceColor) plumes.instanceColor.needsUpdate = true;
  }
  function snapshot() {
    return { active: group.visible, activeCars, nitroCars, rocketCars, instanceCount: plumes.count,
      capacity, instanceCapacity, drawCalls: group.visible ? 1 : 0, quality: qualityId,
      reducedMotion: !!reducedMotion, disposed, anchors: anchors.map(anchor => ({ ...anchor })) };
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true; group.removeFromParent(); group.clear();
    plumes.dispose(); assets.dispose();
  }
  return { group, update, reset, dispose, snapshot };
}
