/** Car pose follows the authoritative road/flight state; only suspension flex is visual. */
export function createCarMotion(THREE, { car, racer, wheelSpin = [], wheelMounts = [], steeringPivots = [], lighting, index = 0 }) {
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, finite(n)));
  const wheelRadius = wheel => {
    const radius = finite(wheel.userData?.rollingRadius, .42);
    return radius > .01 ? radius : .42;
  };
  const chassis = new THREE.Group();
  chassis.name = 'chassis-motion';
  chassis.position.y = .47;
  const wheelSet = new Set(wheelMounts);
  for (const component of [...car.children]) {
    if (wheelSet.has(component)) continue;
    component.position.y -= .47;
    chassis.add(component);
  }
  car.add(chassis);
  const wheelBases = wheelMounts.map(wheel => wheel.position.clone());
  const roadRotation = new THREE.Quaternion(), trickRotation = new THREE.Quaternion();
  const localRight = new THREE.Vector3(1, 0, 0), pivot = new THREE.Vector3(0, .72, 0);
  const roadPivot = new THREE.Vector3(), rotatedPivot = new THREE.Vector3();
  const motion = { heave: 0, pitch: 0, roll: 0, heaveV: 0, pitchV: 0, rollV: 0 };
  let initialized = false, previousDistance = null;
  const pose = { id: racer.id, groundY: 0, modelY: 0, flightHeight: 0, roadPitch: 0, roadBank: 0, bodyHeave: 0, bodyPitch: 0, bodyRoll: 0, steering: 0 };

  function reset() {
    for (const key of Object.keys(motion)) motion[key] = 0;
    initialized = false; previousDistance = null;
    chassis.position.y = .47; chassis.rotation.set(0, 0, 0);
    wheelMounts.forEach((wheel, i) => wheel.position.copy(wheelBases[i]));
  }
  function spring(key, target, frequency, damping, dt) {
    const velocity = `${key}V`, omega = Math.PI * 2 * frequency;
    let remaining = dt;
    while (remaining > 1e-8) {
      const h = Math.min(remaining, 1 / 120);
      motion[velocity] += (omega * omega * (target - motion[key]) - 2 * damping * omega * motion[velocity]) * h;
      motion[key] += motion[velocity] * h;
      remaining -= h;
    }
  }
  function update(track, dt = 1 / 60) {
    if (!track?.sampleTrack) return;
    const distance = finite(racer.distance), speed = Math.max(0, finite(racer.speed));
    if (previousDistance !== null && distance < previousDistance - 2) reset();
    previousDistance = distance;
    const sample = track.sampleTrack(distance);
    if (!sample?.position || !sample?.tangent) return;
    const lateral = finite(racer.lateral), tangent = sample.tangent;
    const right = sample.right || { x: tangent.z || 0, y: 0, z: -(tangent.x || 0) };
    const bank = clamp(sample.bank, -.15, .15);
    const grade = Math.atan2(finite(tangent.y), Math.max(.001, Math.hypot(finite(tangent.x), finite(tangent.z))));
    const groundY = finite(sample.position.y) + finite(right.y) * lateral + bank * lateral + .035;
    const flight = Math.max(0, finite(racer.flightHeight));
    const rampHeight = Math.max(0, finite(racer.rampHeight));
    const airborne = flight > .03 || finite(racer.flightRemaining) > 0;
    const rampPitch = finite(racer.rampPitch);
    // A full somersault belongs to the entire rigid car, including its tyres.
    // The quaternion is composed in the car's local right axis after road bank;
    // rotating around its centre avoids swinging the car around the tyre contact.
    const trickAngle = finite(racer.trickAngle);
    const yaw = Math.atan2(finite(tangent.x), finite(tangent.z, 1)) + finite(racer.heading) + finite(racer.spinAngle);
    car.position.set(finite(sample.position.x) + finite(right.x) * lateral, groundY + rampHeight + flight,
      finite(sample.position.z) + finite(right.z) * lateral);
    car.rotation.set(-grade - rampPitch, yaw, bank, 'YXZ');
    roadRotation.copy(car.quaternion);
    trickRotation.setFromAxisAngle(localRight, trickAngle);
    car.quaternion.multiply(trickRotation);
    roadPivot.copy(pivot).applyQuaternion(roadRotation);
    rotatedPivot.copy(pivot).applyQuaternion(car.quaternion);
    car.position.add(roadPivot).sub(rotatedPivot);

    const acceleration = clamp(racer.acceleration, -22, 16);
    const sideAcceleration = clamp(finite(racer.lateralAcceleration) + speed * speed * finite(sample.curvature), -22, 22);
    const moving = Math.min(1, speed / 25), phase = index * 1.618;
    const roughness = racer.offRoad ? .065 : .012;
    const bump = airborne ? 0 : (Math.sin(distance * .77 + phase) + Math.sin(distance * 1.39 + phase) * .45) * roughness * moving;
    const landing = clamp(racer.landingImpulse, 0, 1);
    const targetHeave = airborne ? .035 : bump - .028 * moving * moving - landing * .16;
    const flightPitch = airborne ? -clamp(Math.atan2(finite(racer.verticalVelocity), Math.max(10, speed)) * .55, -.3, .3) : 0;
    const targetPitch = clamp((airborne ? flightPitch : -acceleration * .0075) + landing * .1, -.26, .26);
    const targetRoll = airborne ? Math.sin(distance * .03 + phase) * .018 : clamp(sideAcceleration * .0065 + Math.sin(finite(racer.spinAngle)) * .035, -.14, .14);
    const step = clamp(dt, 0, .1);
    if (!initialized) {
      motion.heave = targetHeave; motion.pitch = targetPitch; motion.roll = targetRoll; initialized = true;
    } else {
      spring('heave', targetHeave, 3.1, .66, step);
      spring('pitch', targetPitch, 2.2, .73, step);
      spring('roll', targetRoll, 2.4, .74, step);
    }
    chassis.position.y = .47 + clamp(motion.heave, -.2, .13);
    chassis.rotation.set(motion.pitch, 0, motion.roll, 'YXZ');
    wheelMounts.forEach((wheel, i) => {
      const base = wheelBases[i];
      const contactBump = airborne ? -.10 : Math.sin(distance * .88 + i * 1.7 + phase) * roughness * .32 * moving;
      wheel.position.set(base.x, base.y + contactBump, base.z);
    });
    // Authored spin wrappers share car-local +X axles, with their measured
    // tyre radii in track metres. Procedural wheels retain the .42m radius.
    for (const wheel of wheelSpin) wheel.rotation.x = distance / wheelRadius(wheel);
    const steering = clamp(finite(racer.heading) * .68 + finite(racer.yawRate) * .055, -.42, .42);
    for (const wheel of steeringPivots) wheel.rotation.y = steering;
    lighting?.update(racer);
    Object.assign(pose, { groundY, modelY: car.position.y, flightHeight: flight, rampHeight, rampPitch,
      supportY: groundY + rampHeight + flight, rampState: racer.rampState || 'ground', rampId: racer.rampId ?? null,
      flightKind: racer.flightKind || null, trickAngle, trickFlips: finite(racer.trickFlips),
      completedFlips: finite(racer.completedFlips), trickSpeedBonus: finite(racer.trickSpeedBonus),
      spinAngle: finite(racer.spinAngle), worldQuaternion: car.quaternion.toArray(),
      roadPitch: -grade, roadBank: bank,
      bodyHeave: chassis.position.y - .47, bodyPitch: motion.pitch, bodyRoll: motion.roll, steering });
    Object.assign(car.userData, { finished: !!racer.finished, speed, flightHeight: flight, motion: pose });
  }
  return { update, reset, snapshot: () => ({ ...pose, wheelHeights: wheelMounts.map(wheel => wheel.position.y),
    wheelRolling: wheelSpin.map(wheel => ({ radius: wheelRadius(wheel), axis: 'x', axle: wheel.userData?.axle || null,
      authoredWheelName: wheel.userData?.authoredWheelName || null, angle: wheel.rotation.x })) }) };
}
