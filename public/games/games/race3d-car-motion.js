import { createRampLayout, sampleRampSurface } from './race3d-ramps.js?v=20261025-supercars';

/** Rigid tyre frame plus a damped sprung shell. Distances are track metres. */
export function createCarMotion(THREE, { car, racer, wheelSpin = [], wheelMounts = [], steeringPivots = [], lighting, index = 0 }) {
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, finite(n)));
  const wheelRadius = wheel => Math.max(.08, finite(wheel.userData?.rollingRadius, .423));
  const wheelId = wheel => wheel.userData?.wheelId || `${wheel.position.z>0?'front':'rear'}-${wheel.position.x<0?'left':'right'}`;
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
  let wheelBases = [], wheelStates = [], ramps = [], rampTrack = null;
  const roadRotation = new THREE.Quaternion(), trickRotation = new THREE.Quaternion();
  const localRight = new THREE.Vector3(1, 0, 0), pivot = new THREE.Vector3(0, .72, 0);
  const roadPivot = new THREE.Vector3(), rotatedPivot = new THREE.Vector3(), localPoint = new THREE.Vector3();
  const motion = { heave: 0, pitch: 0, roll: 0, heaveV: 0, pitchV: 0, rollV: 0 };
  let initialized = false, previousDistance = null;
  const pose = { id: racer.id, groundY: 0, modelY: 0, flightHeight: 0, roadPitch: 0, roadBank: 0, bodyHeave: 0, bodyPitch: 0, bodyRoll: 0, steering: 0, wheelContacts: [] };

  function refreshWheels() {
    wheelBases = wheelMounts.map(wheel => wheel.position.clone());
    wheelStates = wheelMounts.map(wheel => ({id:wheelId(wheel),angle:0,angularVelocity:0,steering:0}));
  }
  refreshWheels();
  function reset() {
    for (const key of Object.keys(motion)) motion[key] = 0;
    initialized = false; previousDistance = null;
    chassis.position.y = .47; chassis.rotation.set(0, 0, 0);
    wheelMounts.forEach((wheel, i) => {wheel.position.copy(wheelBases[i]);wheel.rotation.y=0;});
    wheelSpin.forEach(wheel=>{wheel.rotation.x=0;});
    for(const state of wheelStates){state.angle=0;state.angularVelocity=0;state.steering=0;}
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
    if(rampTrack!==track){ramps=createRampLayout(track.totalLength);rampTrack=track;}
    const distance = finite(racer.distance), speed = Math.max(0, finite(racer.speed));
    if (previousDistance !== null && distance < previousDistance - 2) reset();
    const deltaDistance=previousDistance===null?0:Math.max(0,distance-previousDistance);
    previousDistance = distance;
    const sample = track.sampleTrack(distance);
    if (!sample?.position || !sample?.tangent) return;
    const lateral = finite(racer.lateral), tangent = sample.tangent;
    const right = sample.right || { x: tangent.z || 0, y: 0, z: -(tangent.x || 0) };
    const bank = clamp(sample.bank, -.25, .25);
    const grade = Math.atan2(finite(tangent.y), Math.max(.001, Math.hypot(finite(tangent.x), finite(tangent.z))));
    const groundY = finite(sample.position.y) + finite(right.y) * lateral + Math.tan(bank) * lateral + .035;
    const flight = Math.max(0, finite(racer.flightHeight));
    const rampHeight = Math.max(0, finite(racer.supportHeight,racer.rampHeight));
    const airborne = flight > .03 || finite(racer.flightRemaining) > 0;
    const rampPitch = finite(racer.supportPitch,racer.rampPitch);
    const trickAngle = finite(racer.trickAngle);
    const heading=finite(racer.heading),yaw = Math.atan2(finite(tangent.x), finite(tangent.z, 1)) + heading + finite(racer.spinAngle);
    car.position.set(finite(sample.position.x) + finite(right.x) * lateral, groundY + rampHeight + flight,
      finite(sample.position.z) + finite(right.z) * lateral);
    car.rotation.set(-grade - rampPitch, yaw, bank+finite(racer.supportRoll), 'YXZ');
    roadRotation.copy(car.quaternion);
    trickRotation.setFromAxisAngle(localRight, trickAngle);
    car.quaternion.multiply(trickRotation);
    roadPivot.copy(pivot).applyQuaternion(roadRotation);
    rotatedPivot.copy(pivot).applyQuaternion(car.quaternion);
    car.position.add(roadPivot).sub(rotatedPivot);

    const contacts=Array.isArray(racer.wheelContacts)?racer.wheelContacts:[];
    const compression=id=>finite(contacts.find(c=>c.id===id)?.compression);
    const wheelbase=Math.max(1.8,finite(racer.wheelbase,2.72)), trackWidth=Math.max(1.2,finite(racer.trackWidth,1.66));
    const acceleration = clamp(racer.acceleration, -22, 16);
    const sideAcceleration = clamp(finite(racer.lateralAcceleration,speed*speed*finite(sample.curvature)), -30, 30);
    const landing = clamp(racer.landingImpulse, 0, 1);
    const frontCompression=(compression('front-left')+compression('front-right'))*.5;
    const rearCompression=(compression('rear-left')+compression('rear-right'))*.5;
    const leftCompression=(compression('front-left')+compression('rear-left'))*.5;
    const rightCompression=(compression('front-right')+compression('rear-right'))*.5;
    // These are load-driven spring targets, with no free-running sine wobble.
    const targetHeave=airborne?.025:contacts.length?-(frontCompression+rearCompression)*.5:-landing*.12;
    const targetPitch=airborne?0:clamp(contacts.length?(frontCompression-rearCompression)/wheelbase:-acceleration*.005,-.13,.13);
    const targetRoll=airborne?0:clamp(contacts.length?(leftCompression-rightCompression)/trackWidth:sideAcceleration*.004,-.12,.12);
    const step = clamp(dt, 0, .1);
    if (!initialized) {
      motion.heave = targetHeave; motion.pitch = targetPitch; motion.roll = targetRoll; initialized = true;
    } else {
      spring('heave', targetHeave, 3.1, .78, step);
      spring('pitch', targetPitch, 2.5, .80, step);
      spring('roll', targetRoll, 2.7, .82, step);
    }
    chassis.position.y = .47 + clamp(motion.heave, -.16, .10);
    chassis.rotation.set(motion.pitch, 0, motion.roll, 'YXZ');

    const rotationUp = new THREE.Vector3(0,1,0).applyQuaternion(car.quaternion);
    const steeringYaw=speed*finite(sample.curvature)+finite(racer.yawRate);
    const turnRadius=Math.abs(steeringYaw)>.001&&speed>.5?speed/steeringYaw:Infinity;
    const centreSteering=Number.isFinite(turnRadius)?clamp(Math.atan(wheelbase/turnRadius),-.48,.48):0;
    const wheelContactSnapshots=[];
    wheelMounts.forEach((wheel, i) => {
      const base=wheelBases[i],state=wheelStates[i],radius=wheelRadius(wheel);
      const telemetry=contacts.find(c=>c.id===state.id);
      const horizontalLength=Math.max(.001,Math.hypot(tangent.x,tangent.z));
      // Sample beneath the rotated tyre patch, not beneath its unrotated hub.
      // On a bank or slope the hub is one radius along the road normal, so a
      // simple world-Y radius offset would bury the tyre in the inclined deck.
      const contactSurface=offset=>{
        localPoint.set(base.x,base.y+offset-radius,base.z).applyQuaternion(car.quaternion);
        const along=(localPoint.x*tangent.x+localPoint.z*tangent.z)/horizontalLength;
        const across=lateral+localPoint.x*right.x+localPoint.z*right.z;
        const surface=sampleRampSurface(track,ramps,distance+along,across);
        return {surfaceY:finite(surface?.surfaceY,groundY),contactY:car.position.y+localPoint.y};
      };
      let contact=contactSurface(0);
      // Once the front axle has left the lip it extends slightly instead of
      // being snapped through several metres of air to the road below.
      const grounded=!airborne&&(telemetry?.grounded!==false)&&Math.abs(contact.surfaceY-contact.contactY)<.36;
      let supportOffset=-.045;
      if(grounded){
        supportOffset=0;
        // Iteration also follows the tiny horizontal patch shift as a spring
        // compresses along the car's inclined local-up axis.
        for(let j=0;j<5;j++){
          contact=contactSurface(supportOffset);
          supportOffset+=(contact.surfaceY-contact.contactY)/Math.max(.2,rotationUp.y);
        }
      }
      wheel.position.set(base.x,base.y+supportOffset,base.z);
      contact=contactSurface(supportOffset);
      const front=state.id.startsWith('front');
      const desiredSteering=front&&Number.isFinite(turnRadius)?clamp(Math.atan(wheelbase/(turnRadius-base.x)),-.5,.5):0;
      // Ackermann: the inside front tyre turns more sharply than the outside.
      const blend=1-Math.exp(-step*18);
      state.steering+=(desiredSteering-state.steering)*blend;
      if(steeringPivots.includes(wheel))wheel.rotation.y=state.steering;
      const spin=wheelSpin[i];
      if(spin){
        if(grounded){state.angularVelocity=step>0?deltaDistance/step/radius:0;state.angle+=deltaDistance/radius;}
        else{state.angularVelocity*=Math.exp(-step*.08);state.angle+=state.angularVelocity*step;}
        if(racer.parked){state.angularVelocity=0;}
        spin.rotation.x=state.angle;
      }
      localPoint.copy(wheel.position).applyQuaternion(car.quaternion);
      const hubY=car.position.y+localPoint.y;
      wheelContactSnapshots.push({id:state.id,grounded,load:grounded?finite(telemetry?.load,.25):0,
        compression:finite(telemetry?.compression),surfaceY:contact.surfaceY,contactPointY:contact.contactY,hubY,radius,
        contactError:grounded?contact.contactY-contact.surfaceY:null,
        suspensionTravel:wheel.position.y-base.y,steering:state.steering,angularVelocity:state.angularVelocity});
    });
    lighting?.update(racer);
    Object.assign(pose, { groundY, modelY: car.position.y, flightHeight: flight, rampHeight, rampPitch,
      supportY: groundY + rampHeight + flight, rampState: racer.rampState || 'ground', rampId: racer.rampId ?? null,
      flightKind: racer.flightKind || null, trickAngle, trickFlips: finite(racer.trickFlips),
      completedFlips: finite(racer.completedFlips), trickSpeedBonus: finite(racer.trickSpeedBonus),
      spinAngle: finite(racer.spinAngle), worldQuaternion: car.quaternion.toArray(),
      roadPitch: -grade, roadBank: bank, wheelContacts:wheelContactSnapshots,
      bodyHeave: chassis.position.y - .47, bodyPitch: motion.pitch, bodyRoll: motion.roll, steering:centreSteering });
    Object.assign(car.userData, { finished: !!racer.finished, speed, flightHeight: flight, motion: pose });
  }
  return { update, reset, refreshWheels, snapshot: () => ({ ...pose, wheelHeights: wheelMounts.map(wheel => wheel.position.y),
    wheelRolling: wheelSpin.map(wheel => ({ radius: wheelRadius(wheel), axis: 'x', axle: wheel.userData?.axle || null,
      authoredWheelName: wheel.userData?.authoredWheelName || null, angle: wheel.rotation.x })) }) };
}
