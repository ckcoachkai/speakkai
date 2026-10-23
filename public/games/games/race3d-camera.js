/** Smooth third-person chase camera for the race3d course. */
export function createChaseCamera({ THREE, camera, track }) {
  if (!THREE?.Vector3 || !camera || !track?.sampleTrack) {
    throw new TypeError('createChaseCamera needs THREE, a camera, and a track sampler');
  }

  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const wantedPosition = new THREE.Vector3();
  const wantedTarget = new THREE.Vector3();
  const positionVelocity = new THREE.Vector3();
  const targetVelocity = new THREE.Vector3();
  const samplePosition = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const right = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const lateral = new THREE.Vector3();
  const straightAhead = new THREE.Vector3();
  const curveAhead = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const fallbackOrigin = new THREE.Vector3();
  const fallbackTangent = new THREE.Vector3(0, 0, 1);
  const fallbackRight = new THREE.Vector3(1, 0, 0);
  const lookRight = new THREE.Vector3();
  const springChange = new THREE.Vector3();
  const springTemporary = new THREE.Vector3();
  const springCorrection = new THREE.Vector3();
  let initialized = false;
  let fov = Number.isFinite(camera.fov) ? camera.fov : 50;

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const read = (out, value, fallback) => {
    if (value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) {
      out.set(value.x, value.y, value.z);
    } else {
      out.copy(fallback);
    }
    return out;
  };

  // Analytic critically damped spring. The bounded exponential keeps large
  // frame times stable while preserving an easy, premium-feeling glide.
  function springVector(current, velocity, goal, smoothTime, dt) {
    if (dt <= 0) return;
    const omega = 2 / Math.max(0.05, smoothTime);
    const x = omega * dt;
    const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = springChange.copy(current).sub(goal);
    const temporary = springTemporary.copy(velocity).addScaledVector(change, omega).multiplyScalar(dt);
    velocity.sub(springCorrection.copy(temporary).multiplyScalar(omega)).multiplyScalar(decay);
    current.copy(goal).add(change.add(temporary).multiplyScalar(decay));
  }

  function smoothScalar(current, goal, smoothTime, dt) {
    if (dt <= 0) return current;
    const amount = 1 - Math.exp(-dt / Math.max(0.05, smoothTime));
    return current + (goal - current) * amount;
  }

  function update(focusCar, dt = 1 / 60) {
    if (!focusCar) return;
    const step = clamp(finite(dt), 0, 0.05);
    const distance = finite(focusCar.distance);
    const sample = track.sampleTrack(distance) || {};
    read(samplePosition, sample.position, fallbackOrigin);
    read(tangent, sample.tangent, fallbackTangent);
    read(right, sample.right, fallbackRight);
    if (tangent.lengthSq() < 1e-5) tangent.set(0, 0, 1);
    if (right.lengthSq() < 1e-5) right.set(1, 0, 0);
    tangent.normalize();
    right.normalize();

    const heading = finite(focusCar.heading);
    // Physics defines heading as radians relative to the course tangent;
    // positive values turn toward the course's right vector.
    forward.copy(tangent).multiplyScalar(Math.cos(heading))
      .addScaledVector(right, Math.sin(heading)).normalize();
    lateral.copy(right).multiplyScalar(finite(focusCar.lateral));
    samplePosition.add(lateral);

    const width = clamp(finite(sample.width, finite(track.width, 16)), 8, 40);
    const topSpeed = Math.max(1, finite(focusCar.maxSpeed, 55));
    const speed = Math.max(0, finite(focusCar.speed));
    const speedRatio = clamp(speed / topSpeed, 0, 1);

    // Keep the car visibly in front of the camera while opening the shot a
    // little at speed. The low mount gives a road-level view and a steady horizon.
    const trailing = clamp(width * (0.86 + speedRatio * 0.13), 12, 22);
    const cameraHeight = clamp(width * (0.30 + speedRatio * 0.035), 4.2, 7.4);
    wantedPosition.copy(samplePosition)
      .addScaledVector(forward, -trailing)
      .addScaledVector(up, cameraHeight);

    // Aim through the road ahead. Blending the projected heading with a
    // sampled point on the bend anticipates curvature without swinging overhead.
    const lookDistance = clamp(width * (0.50 + speedRatio * 0.60), 8, 22);
    straightAhead.copy(samplePosition).addScaledVector(forward, lookDistance);
    const lookSample = track.sampleTrack(distance + lookDistance) || {};
    read(curveAhead, lookSample.position, straightAhead);
    read(lookRight, lookSample.right, right);
    curveAhead.addScaledVector(lookRight, finite(focusCar.lateral) * 0.28);
    desiredLook.copy(straightAhead).lerp(curveAhead, 0.58);
    desiredLook.y += 1.35;
    wantedTarget.copy(desiredLook);

    const wantedFov = 49 + speedRatio * 3.2;
    if (!initialized) {
      position.copy(wantedPosition);
      target.copy(wantedTarget);
      fov = wantedFov;
      initialized = true;
    } else {
      springVector(position, positionVelocity, wantedPosition, 0.52, step);
      springVector(target, targetVelocity, wantedTarget, 0.43, step);
      fov = smoothScalar(fov, wantedFov, 0.68, step);
    }

    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(target);
    if (Number.isFinite(camera.fov) && Math.abs(camera.fov - fov) > 0.025) {
      camera.fov = fov;
      camera.updateProjectionMatrix?.();
    }
  }

  function reset() {
    initialized = false;
    positionVelocity.set(0, 0, 0);
    targetVelocity.set(0, 0, 0);
  }

  function dispose() {
    initialized = false;
  }

  return { update, reset, dispose };
}

export default createChaseCamera;
