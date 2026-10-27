import {surfaceForWheel,wheelLoads,vehicleProfile,unilateralSupportHeight} from './race3d-vehicle.js?v=20261027-midnight';
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
  let wheelBases=[],wheelTravel=[];
  function configureWheels(){wheelBases=wheelMounts.map(w=>w.position.clone());wheelTravel=wheelMounts.map(()=>({angle:0,previous:null,omega:0}));}
  configureWheels();
  const roadRotation = new THREE.Quaternion(), trickRotation = new THREE.Quaternion();
  const localRight = new THREE.Vector3(1, 0, 0), pivot = new THREE.Vector3(0, .72, 0);
  const roadPivot = new THREE.Vector3(), rotatedPivot = new THREE.Vector3();
  const motion = { heave: 0, pitch: 0, roll: 0, heaveV: 0, pitchV: 0, rollV: 0 };
  let initialized = false, previousDistance = null;
  const pose = { id: racer.id, groundY: 0, modelY: 0, flightHeight: 0, roadPitch: 0, roadBank: 0, bodyHeave: 0, bodyPitch: 0, bodyRoll: 0, steering: 0 };

  function reset() {
    for (const key of Object.keys(motion)) motion[key] = 0;
    initialized = false; previousDistance = null;wheelTravel.forEach(w=>{w.angle=0;w.previous=null;w.omega=0;});
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
  function update(track, dt = 1 / 60, {detailed=true}={}) {
    if (!track?.sampleTrack) return;
    const distance = finite(racer.distance), speed = Math.max(0, finite(racer.speed));
    if (previousDistance !== null && distance < previousDistance - 2&&!racer._rewindActive) reset();
    previousDistance = distance;
    const sample = track.sampleTrack(distance);
    if (!sample?.position || !sample?.tangent) return;
    const lateral = finite(racer.lateral), tangent = sample.tangent;
    const right = sample.right || { x: tangent.z || 0, y: 0, z: -(tangent.x || 0) };
    const bank = clamp(sample.bank, -.15, .15);
    const grade = Math.atan2(finite(tangent.y), Math.max(.001, Math.hypot(finite(tangent.x), finite(tangent.z))));
    const groundY = finite(sample.position.y) + finite(right.y) * lateral + Math.tan(bank) * lateral + .035;
    const flight = Math.max(0, finite(racer.flightHeight));
    const rampHeight = Math.max(0, finite(racer.rampHeight));
    const airborne = flight > .03 || finite(racer.flightRemaining) > 0;
    const recovering=finite(racer.recoveryRemaining)>0&&(Math.abs(finite(racer.landingPitch))+Math.abs(finite(racer.landingRoll))>.12);
    const rampPitch = finite(racer.rampPitch);
    if(!detailed){
      // Far proxies need the authoritative pose, not four rendered hub solves.
      car.position.set(finite(sample.position.x)+finite(right.x)*lateral,groundY+rampHeight+flight,finite(sample.position.z)+finite(right.z)*lateral);
      car.rotation.set(-grade-rampPitch+finite(racer.airAttitude?.pitch)+finite(racer.landingPitch),Math.atan2(tangent.x,tangent.z)+finite(racer.heading)+finite(racer.spinAngle),bank+finite(racer.airRoll)+finite(racer.landingRoll),'YXZ');
      initialized=false;for(const travel of wheelTravel)travel.previous=null;
      Object.assign(pose,{supportY:car.position.y,modelY:car.position.y,flightHeight:flight,rampHeight,rampPitch,wheels:[],lod:'proxy'});return;
    }
    const surfaces=wheelBases.map(base=>surfaceForWheel(track,racer,{x:base.x,z:base.z},{extendLip:true}));
    const avg=(test,fn)=>{let n=0,sum=0;wheelBases.forEach((b,i)=>{if(test(b)){sum+=fn(b,i);n++;}});return n?sum/n:0;};
    const frontZ=avg(b=>b.z>0,b=>b.z),rearZ=avg(b=>b.z<0,b=>b.z),wb=Math.max(1,frontZ-rearZ);
    const frontY=avg(b=>b.z>0,(b,i)=>surfaces[i].y),rearY=avg(b=>b.z<0,(b,i)=>surfaces[i].y);
    const trackWidth=Math.max(1,avg(b=>b.x>0,b=>b.x)-avg(b=>b.x<0,b=>b.x));
    const supportPitch=Math.atan2(frontY-rearY,wb),supportRoll=Math.atan2(avg(b=>b.x>0,(b,i)=>surfaces[i].y)-avg(b=>b.x<0,(b,i)=>surfaces[i].y),trackWidth);
    const centerY=(frontY*(-rearZ)+rearY*frontZ)/wb;
    const bottomOffset=avg(()=>true,(b,i)=>b.y-wheelRadius(wheelSpin[i]||{}));
    const supportedY=unilateralSupportHeight(wheelBases.map((b,i)=>({x:b.x,z:b.z,height:surfaces[i].y})),centerY,supportPitch,supportRoll);
    const baseY=airborne?groundY+flight:supportedY-bottomOffset;
    const loads=wheelLoads(racer),p=vehicleProfile(racer);
    // A full somersault belongs to the entire rigid car, including its tyres.
    // The quaternion is composed in the car's local right axis after road bank;
    // rotating around its centre avoids swinging the car around the tyre contact.
    const trickAngle = ['ramp','hop'].includes(racer.flightKind)?0:finite(racer.trickAngle);
    const yaw = Math.atan2(finite(tangent.x), finite(tangent.z, 1)) + finite(racer.heading) + finite(racer.spinAngle);
    car.position.set(finite(sample.position.x) + finite(right.x) * lateral, baseY,
      finite(sample.position.z) + finite(right.z) * lateral);
    car.rotation.set(airborne?-grade-rampPitch+finite(racer.airAttitude?.pitch):-supportPitch+finite(racer.landingPitch),yaw,airborne?bank+finite(racer.airRoll):supportRoll+finite(racer.landingRoll),'YXZ');
    roadRotation.copy(car.quaternion);
    trickRotation.setFromAxisAngle(localRight, trickAngle);
    car.quaternion.multiply(trickRotation);
    roadPivot.copy(pivot).applyQuaternion(roadRotation);
    rotatedPivot.copy(pivot).applyQuaternion(car.quaternion);
    car.position.add(roadPivot).sub(rotatedPivot);

    const acceleration = clamp(racer.acceleration, -22, 16);
    const sideAcceleration = clamp(finite(racer.lateralAcceleration), -22, 22);
    const moving = Math.min(1, speed / 25), phase = index * 1.618;
    const roughness = racer.offRoad ? .065 : .012;
    const bump = 0;
    const landing = clamp(racer.landingImpulse, 0, 1);
    const targetHeave = airborne ? .035 : bump - finite(racer.downforceN)/Math.max(500,p.massKg)*.007 - landing*.12*(3/p.suspensionHz)**2;
    const flightPitch = airborne ? -clamp(Math.atan2(finite(racer.verticalVelocity), Math.max(10, speed)) * .55, -.3, .3) : 0;
    const targetPitch = clamp((airborne ? 0 : -acceleration*p.cg/(9.81*wb)*.6) + landing*.025, -.16, .16);
    const targetRoll = airborne ? 0 : clamp(sideAcceleration*p.cg/(9.81*trackWidth)*.42, -.14, .14);
    const step = clamp(dt, 0, .1);
    if (!initialized) {
      motion.heave = targetHeave; motion.pitch = targetPitch; motion.roll = targetRoll; initialized = true;
    } else {
      spring('heave',targetHeave,p.suspensionHz,p.damping,step);
      spring('pitch',targetPitch,p.suspensionHz*.78,p.damping,step);
      spring('roll',targetRoll,p.suspensionHz*.84,p.damping,step);
    }
    chassis.position.y = .47 + clamp(motion.heave, -.2, .13);
    chassis.rotation.set(motion.pitch, 0, motion.roll, 'YXZ');
    const up=new THREE.Vector3(0,1,0).applyQuaternion(car.quaternion),v=new THREE.Vector3();
    const steering=clamp(racer.steeringAngle??(finite(racer.heading)*.68+finite(racer.yawRate)*.055),-.48,.48),turnRadius=Math.abs(steering)>.0001?wb/Math.tan(steering):Infinity;
    const wheelContacts=[];
    wheelMounts.forEach((wheel,i)=>{
      const base=wheelBases[i],spin=wheelSpin[i],radius=wheelRadius(spin||{}),travel=wheelTravel[i];let surface=surfaces[i];
      wheel.position.copy(base);
      if(!airborne&&!recovering){
        // Iterate the actual rotated hub's horizontal position, rather than
        // sampling an upright footprint underneath a pitched chassis.
        for(let pass=0;pass<(racer.rampState==='approach'?3:1);pass++){
          v.copy(wheel.position).applyQuaternion(car.quaternion);
          const along=(v.x*tangent.x+v.z*tangent.z)/Math.max(.001,Math.hypot(tangent.x,tangent.z)),across=v.x*right.x+v.z*right.z,h=finite(racer.heading);
          surface=surfaceForWheel(track,racer,{x:across*Math.cos(h)-along*Math.sin(h),z:along*Math.cos(h)+across*Math.sin(h)},{extendLip:true});
          wheel.position.y+=(surface.y+radius-v.y-car.position.y)/Math.max(.65,up.y);
          wheel.position.y=clamp(wheel.position.y,base.y-.20,base.y+.20);
        }
      }else wheel.position.y-=.08;
      if(base.z>0)wheel.rotation.y=Number.isFinite(turnRadius)?clamp(Math.atan(wb/(turnRadius-base.x)),-.52,.52):0;
      if(spin){
        if(!airborne&&travel.previous&&step>0){const dd=surface.d-travel.previous.d,dl=surface.l-travel.previous.l,dy=surface.y-travel.previous.y;if(Math.abs(dd)<25){const ds=Math.hypot(dd,dl,dy)*Math.sign(dd||1);travel.angle+=ds/radius;travel.omega=ds/radius/step;}}
        else if(airborne&&step>0){travel.omega*=Math.exp(-.08*step);travel.angle+=travel.omega*step;}
        spin.rotation.x=travel.angle;
      }
      travel.previous={d:surface.d,l:surface.l,y:surface.y};v.copy(wheel.position).applyQuaternion(car.quaternion).add(car.position);
      const load=loads.find(l=>l.side===Math.sign(base.x)&&(l.axle>0)===(base.z>0))||{load:0,compression:0};
      wheelContacts.push({side:Math.sign(base.x),axle:base.z>0?'front':'rear',x:base.x,z:base.z,radius,hubX:v.x,hubY:v.y,hubZ:v.z,surfaceY:surface.y,contactError:airborne||recovering?null:v.y-radius-surface.y,contact:!airborne&&!recovering&&surface.contact&&Math.abs(v.y-radius-surface.y)<.035,load:load.load,compression:load.compression,steering:base.z>0?wheel.rotation.y:0,angle:travel.angle});
    });
    pose.wheels=wheelContacts;pose.wheelbase=wb;pose.trackWidth=trackWidth;
    lighting?.update(racer);
    Object.assign(pose, { groundY, modelY: car.position.y, flightHeight: flight, rampHeight, rampPitch,
      supportY: baseY, rampState: racer.rampState || 'ground', rampId: racer.rampId ?? null,
      flightKind: racer.flightKind || null, trickAngle:finite(racer.trickAngle),airPitch:finite(racer.airAttitude?.pitch),airRoll:finite(racer.airRoll),trickFlips: finite(racer.trickFlips),lod:'detailed',
      completedFlips: finite(racer.completedFlips), trickSpeedBonus: finite(racer.trickSpeedBonus),
      spinAngle: finite(racer.spinAngle), worldQuaternion: car.quaternion.toArray(),
      roadPitch: -supportPitch, roadBank: supportRoll,
      bodyHeave: chassis.position.y - .47, bodyPitch: motion.pitch, bodyRoll: motion.roll, steering });
    Object.assign(car.userData, { finished: !!racer.finished, speed, flightHeight: flight, motion: pose });
  }
  return { update, reset, configureWheels, snapshot: () => ({ ...pose, wheels:(pose.wheels||[]).map(w=>({...w})), wheelHeights: wheelMounts.map(wheel => wheel.position.y),
    wheelRolling: wheelSpin.map(wheel => ({ radius: wheelRadius(wheel), axis: 'x', axle: wheel.userData?.axle || null,
      authoredWheelName: wheel.userData?.authoredWheelName || null, angle: wheel.rotation.x })) }) };
}
