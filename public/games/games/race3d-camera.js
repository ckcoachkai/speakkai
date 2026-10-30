/** Smooth third-person chase camera for the race3d course. */
export function createChaseCamera({ THREE, camera, track, timeScale = 5 }) {
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
  const previousCarPosition = new THREE.Vector3();
  const carMovement = new THREE.Vector3();
  let previousCarId = null;
  let initialized = false;
  let fov = Number.isFinite(camera.fov) ? camera.fov : 50;
  const modes = ['overhead', 'chase', 'first-person'];
  let modeIndex = 1, overheadMix = 0, firstPersonMix = 0;
  let supportHeight = 0;
  let overview={ids:[],height:0};

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

  function update(focusCar, dt = 1 / 60, cars = []) {
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
    const flightHeight = Math.max(0, finite(focusCar.flightHeight));
    supportHeight = flightHeight + Math.max(0, finite(focusCar.rampHeight));
    // Follow the authoritative climb and flight, while retaining a level horizon
    // during somersaults and banana spinouts in all three camera modes.
    samplePosition.y += supportHeight + finite(sample.bank) * finite(focusCar.lateral);

    const width = clamp(finite(sample.width, finite(track.width, 16)), 8, 40);
    const topSpeed = Math.max(1, finite(focusCar.maxSpeed, 55));
    const speed = Math.max(0, finite(focusCar.speed));
    const speedRatio = clamp(speed / topSpeed, 0, 1);
    const modeAlpha = 1 - Math.exp(-step / Math.max(1, timeScale) / .36);
    overheadMix += ((modeIndex === 0 ? 1 : 0) - overheadMix) * modeAlpha;
    firstPersonMix += ((modeIndex === 2 ? 1 : 0) - firstPersonMix) * modeAlpha;
    const chaseMix = Math.max(0, 1 - overheadMix - firstPersonMix);

    // Keep the car visibly in front of the camera while opening the shot a
    // little at speed. The low mount gives a road-level view and a steady horizon.
    const trailing = clamp(width * (0.70 + speedRatio * 0.10), 10.5, 18) * chaseMix + 7 * overheadMix - .48 * firstPersonMix;
    const cameraHeight = clamp(width * (0.255 + speedRatio * 0.025), 3.8, 6.3) * chaseMix + (width * 2.65 + speedRatio * 3) * overheadMix + 1.29 * firstPersonMix;
    wantedPosition.copy(samplePosition)
      .addScaledVector(forward, -trailing)
      .addScaledVector(up, cameraHeight);
    // A trailing camera can cross an uphill section before its target does.
    // Keep its lens above the road at the camera's own longitudinal station.
    const cameraRoad = track.sampleTrack(distance - trailing);
    if (cameraRoad?.position && flightHeight < 1) {
      const roadY = finite(cameraRoad.position.y) + finite(cameraRoad.bank) * finite(focusCar.lateral);
      wantedPosition.y = Math.max(wantedPosition.y, roadY + .9);
    }

    // Aim through the road ahead. Blending the projected heading with a
    // sampled point on the bend anticipates curvature without swinging overhead.
    const lookDistance = clamp(width * (0.50 + speedRatio * 0.60), 8, 22) * chaseMix + 3 * overheadMix + 30 * firstPersonMix;
    straightAhead.copy(samplePosition).addScaledVector(forward, lookDistance);
    const lookSample = track.sampleTrack(distance + lookDistance) || {};
    read(curveAhead, lookSample.position, straightAhead);
    curveAhead.y += supportHeight;
    read(lookRight, lookSample.right, right);
    curveAhead.addScaledVector(lookRight, finite(focusCar.lateral) * 0.28);
    desiredLook.copy(straightAhead).lerp(curveAhead, .58 * chaseMix + .38 * overheadMix + .24 * firstPersonMix);
    desiredLook.y += 1.35;
    wantedTarget.copy(desiredLook);

    if(overheadMix>.001){
      // Fit a nearby group, not the entire circuit. North-up framing avoids
      // swinging the overview when one racer spins or changes heading.
      const points=(cars.length?cars:[focusCar]).filter(c=>!c.eliminated).map(c=>{
        const s=track.sampleTrack(finite(c.distance));
        const p=new THREE.Vector3().copy(s.position).addScaledVector(s.right,finite(c.lateral));
        p.y+=Math.max(0,finite(c.flightHeight))+Math.max(0,finite(c.rampHeight))+1;
        return {id:c.id,p,d:p.distanceTo(samplePosition)};
      }).filter(c=>c.d<95||c.id===focusCar.id).sort((a,b)=>a.d-b.d||String(a.id).localeCompare(String(b.id))).slice(0,8);
      if(points.length){
        const min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
        for(const {p} of points){min.min(p);max.max(p);}
        const center=min.clone().add(max).multiplyScalar(.5),tan=Math.tan(58*Math.PI/360);
        const height=clamp(Math.max((max.z-min.z+20)/(2*tan*.58),(max.x-min.x+18)/(2*tan*Math.max(.3,camera.aspect)*.62))+max.y-min.y,55,190);
        wantedPosition.lerp(center.clone().add(new THREE.Vector3(0,height,-height*.12)),overheadMix);
        wantedTarget.lerp(center,overheadMix);
        overview={ids:points.map(p=>p.id),height};
      }
    }

    const powered=Number(focusCar.boost)>0||Number(focusCar.rocketRemaining)>0;
    const wantedFov = (52 + speedRatio * 8 + (powered?3:0)) * chaseMix + 58 * overheadMix + (67+(powered?2:0)) * firstPersonMix;
    if (!initialized) {
      position.copy(wantedPosition);
      target.copy(wantedTarget);
      fov = wantedFov;
      initialized = true;
    } else {
      // Follow translation immediately, then spring the camera's offset. Without
      // this feed-forward, a cockpit camera trails several car lengths at speed
      // and falls below a flying car as its altitude changes.
      if (previousCarId === focusCar.id) {
        carMovement.copy(samplePosition).sub(previousCarPosition);
        position.add(carMovement);
        target.add(carMovement);
      }
      springVector(position, positionVelocity, wantedPosition, 0.52, step);
      springVector(target, targetVelocity, wantedTarget, 0.43, step);
      if (modeIndex === 2 && firstPersonMix > .98) {
        position.copy(wantedPosition);
        target.copy(wantedTarget);
        positionVelocity.set(0, 0, 0);
        targetVelocity.set(0, 0, 0);
      }
      fov = smoothScalar(fov, wantedFov, 0.68, step);
    }
    previousCarPosition.copy(samplePosition);
    previousCarId = focusCar.id;

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
    previousCarId = null;
    positionVelocity.set(0, 0, 0);
    targetVelocity.set(0, 0, 0);
  }

  function changeMode(direction) {
    const next = clamp(modeIndex + Math.sign(finite(direction)), 0, modes.length - 1);
    if (next === modeIndex) return false;
    modeIndex = next;
    return true;
  }

  function dispose() {
    initialized = false;
  }

  return { update, reset, dispose, changeMode,
    snapshot: () => ({
      position: { x: position.x, y: position.y, z: position.z },
      target: { x: target.x, y: target.y, z: target.z }, supportHeight,
      overview,
      horizonUp: { x: up.x, y: up.y, z: up.z },
      ignoresTrickRotation: true, ignoresSpinRotation: true,
    }),
    get mode() { return modes[modeIndex]; },
    get hideFocusedCar() { return modeIndex === 2 || firstPersonMix > .04; },
    get transition() { return { overhead: overheadMix, firstPerson: firstPersonMix }; },
  };
}

export default createChaseCamera;
