/** Car-local propulsion visuals. Cosmetic only; no simulation state is changed. */
export function createNitroExhaust(THREE, { reducedMotion = false } = {}) {
  const capacity = 60, nozzlesPerCar = 2, instanceCapacity = capacity * nozzlesPerCar;
  const group = new THREE.Group();
  group.name = 'race3d-nitro-exhaust';
  // Unit cone has its base at z=0 and points backwards along local -Z.
  const geometry = new THREE.ConeGeometry(1, 1, 12, 1, false).rotateX(-Math.PI / 2).translate(0, 0, -.5);
  const shellMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .76,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const shell = new THREE.InstancedMesh(geometry, shellMaterial, instanceCapacity);
  const core = new THREE.InstancedMesh(geometry, coreMaterial, instanceCapacity);
  shell.name = 'nitro-exhaust-plumes'; core.name = 'nitro-exhaust-cores';
  for (const mesh of [shell, core]) {
    mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
  }
  const pose = new THREE.Object3D(), anchor = new THREE.Vector3(), local = new THREE.Vector3();
  const rotation = new THREE.Euler(0, 0, 0, 'YXZ'), carRotation = new THREE.Quaternion();
  const shellNitro = new THREE.Color(0x32aaff), coreNitro = new THREE.Color(0xb9f8ff);
  const shellRocket = new THREE.Color(0xff712b), coreRocket = new THREE.Color(0xffe3a0);
  let clock = 0, disposed = false, activeCars = 0, nitroCars = 0, rocketCars = 0, qualityId = 'medium';
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function reset() {
    clock = 0; activeCars = nitroCars = rocketCars = 0;
    shell.count = core.count = 0; group.visible = false;
  }
  reset();
  /** visualPose optionally supplies the same pose used by car models. */
  function update(cars, track, dt, { quality = 'medium', active = false, visualPose } = {}) {
    if (disposed) return;
    qualityId = typeof quality === 'string' ? quality : quality?.id || 'medium';
    if (!active || !Array.isArray(cars) || !track?.sampleTrack) { reset(); return; }
    clock = (clock + clamp(finite(dt), 0, .1)) % 1000;
    let count = 0; activeCars = nitroCars = rocketCars = 0;
    for (let i = 0; i < cars.length && activeCars < capacity; i++) {
      const car = cars[i];
      if (!car || car.finished || car.finishHidden || car.eliminated || finite(car.itemEffects?.emp) > 0) continue;
      // A timer can continue while traction is unavailable. Use the actual
      // force outputs; the spin branch does not apply rocketAcceleration, but
      // an airborne ramp may independently apply rocketVectorThrust.
      const rocket = finite(car.rocketVectorThrust) > .001 ||
        (finite(car.rocketAcceleration) > .001 &&
          (finite(car.spin) <= 0 || finite(car.flightRemaining) > 0));
      const nitro = !rocket && finite(car.nitroAcceleration) > .001;
      if (!rocket && !nitro) continue;
      const visual = (typeof visualPose === 'function' && visualPose(car.id)) || car;
      if (visual.finishHidden) continue;
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
      // Low frequency, low amplitude movement avoids strobing; reduced motion is steady.
      const pulse = reducedMotion ? 1 : 1 + .09 * Math.sin(clock * 6 + i * 1.7);
      const length = (rocket ? 5.1 : 4.2) * pulse;
      const radius = rocket ? .44 : .39;
      const rear = car.racerType === 'monster-truck' ? -2.55 : -2.12;
      const height = car.racerType === 'monster-truck' ? .78 : .55;
      for (let side = -1; side <= 1; side += 2) {
        local.set(side * .48, height, rear).applyQuaternion(carRotation);
        pose.position.copy(anchor).add(local); pose.quaternion.copy(carRotation);
        pose.scale.set(radius, radius, length); pose.updateMatrix();
        shell.setMatrixAt(count, pose.matrix); shell.setColorAt(count, rocket ? shellRocket : shellNitro);
        pose.scale.set(radius * .54, radius * .54, length * .7); pose.updateMatrix();
        core.setMatrixAt(count, pose.matrix); core.setColorAt(count, rocket ? coreRocket : coreNitro);
        count++;
      }
      activeCars++; if (rocket) rocketCars++; else nitroCars++;
    }
    shell.count = core.count = count; group.visible = count > 0;
    shell.instanceMatrix.needsUpdate = core.instanceMatrix.needsUpdate = true;
    if (shell.instanceColor) shell.instanceColor.needsUpdate = true;
    if (core.instanceColor) core.instanceColor.needsUpdate = true;
  }
  function snapshot() {
    return { active: group.visible, activeCars, nitroCars, rocketCars, instanceCount: shell.count,
      capacity, instanceCapacity, drawCalls: group.visible ? 2 : 0, quality: qualityId,
      reducedMotion: !!reducedMotion, disposed };
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true; group.removeFromParent(); group.clear();
    shell.dispose(); core.dispose(); geometry.dispose(); shellMaterial.dispose(); coreMaterial.dispose();
  }
  return { group, update, reset, dispose, snapshot };
}

