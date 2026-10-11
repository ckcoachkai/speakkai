import * as THREE from './three.module.js';

// SI units, body axes +X right, +Y up, -Z forward. This is a reduced-order
// practice model, not a flight-certified model or WARDOGS' unpublished solver.
const G = 9.80665, RHO = 1.225;
const clamp = THREE.MathUtils.clamp;
const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, -1);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t*t*(3-2*t); };
const ground = (world, p) => typeof world?.groundHeight === 'function' ? world.groundHeight(p.x, p.z) : Number(world?.groundHeight || 0);
const kindOf = d => d.kind || d.type || 'heli';

export function createFlight(def, spawn, {airborne = false, assisted = true} = {}) {
  const position = new THREE.Vector3();
  const src = spawn?.position || spawn;
  if (src?.isVector3) position.copy(src);
  else position.set(src?.x || 0, src?.y || 0, src?.z || 0);
  position.y += def.gearHeight || 1.5;
  if (airborne) position.y += kindOf(def) === 'heli' ? 100 : 450;
  const yaw = spawn?.yaw || spawn?.heading || 0;
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0, 'YXZ'));
  const velocity = new THREE.Vector3();
  if (airborne && kindOf(def) !== 'heli') velocity.copy(forward).applyQuaternion(quaternion).multiplyScalar(def.cruiseSpeed || (def.stallSpeed || 30)*1.7);
  let trimAlpha=.045, startingPower=0;
  if(airborne && kindOf(def)==='heli') startingPower=(def.hoverPower || .56)*Math.exp(position.y/8500);
  else if(airborne) {
    const mass=def.mass || 1500, rho=RHO*Math.exp(-position.y/8500), stall=def.stallSpeed || 30;
    const area=def.wingArea || mass*G/(.5*RHO*stall*stall*1.5), q=.5*rho*velocity.lengthSq();
    const cl=mass*G/(q*area);
    trimAlpha=clamp((cl-.24)/5,-.12,.15);
    quaternion.setFromEuler(new THREE.Euler(trimAlpha,yaw,0,'YXZ'));
    const thrust=def.maxThrust || mass*G*(kindOf(def)==='jet'?.85:.30);
    const cd0=clamp(thrust/(.5*RHO*(def.maxSpeed || 90)**2*area),.012,.09);
    const prop=kindOf(def)==='prop'?clamp(1-velocity.length()/(def.maxSpeed*1.9),.35,1):1;
    startingPower=clamp(q*area*(cd0+.05*cl*cl+.018)/(thrust*prop),0,1);
  }
  return {position, velocity, quaternion, pitch:airborne && kindOf(def)!=='heli'?trimAlpha:0, roll:0, yaw, power:startingPower,
    rotorRPM:airborne ? 1 : 0, engineRPM:airborne ? 1 : 0, gear:true, flaps:0, brake:false, crashed:false, onGround:!airborne,
    airspeed:velocity.length(), verticalSpeed:0, gForce:1, stall:false, vrs:false, assisted,
    angularVelocity:new THREE.Vector3(), cyclic:new THREE.Vector3(), time:0, angleOfAttack:0, trimAlpha, lift:0, density:RHO};
}

// Segment / expanded AABB test prevents a fast aircraft tunnelling through towers.
function sweepHit(from, to, bounds, radius) {
  let lo = 0, hi = 1;
  for (const axis of ['x','y','z']) {
    const d = to[axis]-from[axis], min=bounds.min[axis]-radius, max=bounds.max[axis]+radius;
    if (Math.abs(d)<1e-10) { if (from[axis]<min || from[axis]>max) return false; }
    else { let a=(min-from[axis])/d, b=(max-from[axis])/d; if(a>b) [a,b]=[b,a]; lo=Math.max(lo,a); hi=Math.min(hi,b); if(lo>hi) return false; }
  }
  return hi>=0 && lo<=1;
}

export function stepFlight(state, def, input = {}, dt, world = {}, conditions = {}) {
  if (state.crashed || !Number.isFinite(dt) || dt<=0) return state;
  // Bounded catch-up avoids a tab-resume leap. Fixed small substeps keep the
  // force/rotation integration consistent across frame rates.
  const duration=Math.min(dt,.1), steps=Math.ceil(duration/(1/120)), h=duration/steps;
  for(let n=0;n<steps;n++) integrate(state,def,input,h,world,conditions);
  return state;
}

function integrate(s,d,input,h,world,conditions) {
  const heli=kindOf(d)==='heli', mass=d.mass || (heli?2200:1500), gearHeight=s.gear ? (d.gearHeight || 1.5) : .55;
  const assisted=conditions.assisted ?? s.assisted;
  s.assisted=assisted; s.time+=h;
  s.power=clamp(s.power+(input.powerChange || 0)*h*.24,0,1);
  s.brake=Boolean(input.brake);
  const running=input.engineRunning !== false;
  const spool=1-Math.exp(-h/(running?3.3:5));
  s.engineRPM+=(Number(running)-s.engineRPM)*spool;
  s.rotorRPM+=(s.engineRPM-s.rotorRPM)*(1-Math.exp(-h/1.5));
  const floor=ground(world,s.position), agl=Math.max(0,s.position.y-floor-gearHeight);
  const wind=conditions.wind || 0;
  const windVector=typeof wind==='number' ? new THREE.Vector3(wind,0,wind*.22) : new THREE.Vector3(wind.x || 0,wind.y || 0,wind.z || 0);
  const air=s.velocity.clone().sub(windVector);
  const speed=air.length(), inverse=s.quaternion.clone().invert();
  const localAir=air.clone().applyQuaternion(inverse), bodyUp=up.clone().applyQuaternion(s.quaternion), bodyForward=forward.clone().applyQuaternion(s.quaternion);
  const density=RHO*Math.exp(-Math.max(0,s.position.y)/8500); s.density=density;
  const euler=new THREE.Euler().setFromQuaternion(s.quaternion,'YXZ');
  s.cyclic.lerp(new THREE.Vector3(clamp(input.pitch || 0,-1,1),clamp(input.yaw || 0,-1,1),clamp(input.roll || 0,-1,1)),1-Math.exp(-h/.13));
  const acceleration=new THREE.Vector3(0,-G,0), rates=new THREE.Vector3();

  if(heli) {
    const rotorRadius=d.rotorRadius || 5, hoverPower=d.hoverPower || .56;
    const horizontal=Math.hypot(air.x,air.z);
    const translational=1+.14*smooth(5,18,horizontal);
    const groundEffect=1+.11*Math.exp(-agl/Math.max(rotorRadius*.6,1))*(1-smooth(10,25,horizontal));
    // Vortex-ring susceptibility: powered descent and little horizontal airspeed.
    const vrsFactor=smooth(1.5,5,-air.y)*(1-smooth(5,13,horizontal))*smooth(.2,.45,s.power)*smooth(2,rotorRadius*1.5,agl);
    s.vrs=vrsFactor>.22;
    const vne=d.maxSpeed || 80;
    const speedLoss=1-.15*smooth(vne*.8,vne*1.35,horizontal);
    const thrust=mass*G*(s.power/hoverPower)*s.rotorRPM*s.rotorRPM*translational*groundEffect*(1-.48*vrsFactor)*speedLoss*(density/RHO);
    s.lift=thrust; s.angleOfAttack=0; s.stall=false;
    acceleration.addScaledVector(bodyUp,thrust/mass);
    const frontal=Math.max(2,(d.length || 8)*.4);
    const dragLocal=new THREE.Vector3(-localAir.x*Math.abs(localAir.x)*.5*density*frontal*1.4/mass,
      -localAir.y*Math.abs(localAir.y)*.5*density*frontal*2/mass,
      -localAir.z*Math.abs(localAir.z)*.5*density*frontal*.7/mass);
    acceleration.add(dragLocal.applyQuaternion(s.quaternion));
    // Soft high-speed rotor/profile drag rather than an artificial speed clamp.
    // It only becomes appreciable near VNE and preserves translational inertia.
    if(speed>.01) acceleration.addScaledVector(air,-G*.45*(speed/vne)**3/speed);
    s.overspeed=horizontal>vne;
    // Rotor tilt commands apply angular acceleration, with momentum retained.
    const agility=clamp(1800/mass,.32,1.5), rotorAuthority=s.rotorRPM*s.rotorRPM;
    rates.set(s.cyclic.x*.55, s.cyclic.y*.65, s.cyclic.z*.72).multiplyScalar(rotorAuthority*Math.sqrt(agility));
    if(assisted) {
      if(Math.abs(s.cyclic.x)<.03) rates.x-=euler.x*.75;
      if(Math.abs(s.cyclic.z)<.03) rates.z-=euler.z*.85;
    } else {
      // Small uncancelled main-rotor torque makes manual pedal work meaningful.
      if(d.id!=='ch47') rates.y-=(s.power/hoverPower)*rotorAuthority*.10;
    }
    // The fin aligns the nose to relative airflow; not to ground velocity.
    if(horizontal>3) rates.y-=clamp(Math.atan2(localAir.x,Math.max(2,-localAir.z)),-1,1)*smooth(3,40,horizontal)*.5;
  } else {
    const stallSpeed=d.stallSpeed || 30;
    const wingArea=d.wingArea || mass*G/(.5*RHO*stallSpeed*stallSpeed*1.5);
    const dynamic=.5*density*speed*speed;
    const alpha= Math.atan2(-localAir.y,Math.max(1,-localAir.z));
    // The cockpit uses four detents: 0, 10, 20, 30 degrees.
    const flap=clamp((Number(s.flaps)||0)/3,0,1);
    const stallAngle=.28+flap*.025;
    const attached=1-smooth(stallAngle,stallAngle+.38,Math.abs(alpha));
    const cl=clamp(.24+5.0*alpha+flap*.55,-1.6,1.8)*attached+Math.sin(2*alpha)*.5*(1-attached);
    const thrustMax=d.maxThrust || mass*G*(kindOf(d)==='jet'?.85:.30);
    // Parasite drag calibrates to the type's top speed; induced drag rises with lift.
    const cd0=clamp(thrustMax/(.5*RHO*(d.maxSpeed || 90)**2*wingArea),.012,.09);
    const cd=cd0+.05*cl*cl+flap*.065+(s.gear?.018:0)+(1-attached)*.65;
    const liftDirection=bodyUp.clone();
    if(speed>.01) liftDirection.addScaledVector(air,-bodyUp.dot(air)/(speed*speed)).normalize();
    const lift=dynamic*wingArea*cl;
    s.lift=lift; s.angleOfAttack=alpha; s.stall=(Math.abs(alpha)>stallAngle || speed<stallSpeed*.94) && !s.onGround;
    acceleration.addScaledVector(liftDirection,lift/mass);
    if(speed>.01) acceleration.addScaledVector(air,-dynamic*wingArea*cd/(mass*speed));
    const engineThrust=thrustMax*s.power*s.engineRPM*(kindOf(d)==='prop'?clamp(1-speed/(d.maxSpeed*1.9),.35,1):1);
    acceleration.addScaledVector(bodyForward,engineThrust/mass);
    const authority=clamp((speed/stallSpeed)**2*.65,.03,1.6);
    rates.set(s.cyclic.x*.40,s.cyclic.y*.20,s.cyclic.z*(kindOf(d)==='jet'?1.5:.72)).multiplyScalar(authority);
    // Natural pitch stability about a small trimmed positive angle of attack.
    rates.x-=clamp(alpha-s.trimAlpha,-.6,.6)*(assisted?1.2:.55)*authority;
    if(assisted && Math.abs(s.cyclic.z)<.03) rates.z-=euler.z*.34;
    rates.y-=clamp(Math.atan2(localAir.x,Math.max(2,-localAir.z)),-1,1)*authority*.65;
    // Coordinated turn yaw rate is bank-dependent, scales inversely with speed.
    rates.y+=Math.sin(euler.z)*G/Math.max(20,speed)*.75;
    if(s.onGround) rates.y+=s.cyclic.y*clamp(speed/12,0,1)*.35;
  }

  const response=heli?1.8:2.5;
  s.angularVelocity.lerp(rates,1-Math.exp(-h*response));
  if(s.onGround && heli && s.power<.35) s.angularVelocity.multiplyScalar(Math.exp(-h*12));
  const angularSpeed=s.angularVelocity.length();
  if(angularSpeed>1e-8) s.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(s.angularVelocity.clone().divideScalar(angularSpeed),angularSpeed*h)).normalize();
  const previous=s.position.clone();
  s.velocity.addScaledVector(acceleration,h);
  s.position.addScaledVector(s.velocity,h);
  const nextFloor=ground(world,s.position), contactY=nextFloor+gearHeight;
  if(s.position.y<=contactY) {
    const sink=-s.velocity.y, bank=Math.abs(euler.z), pitch=Math.abs(euler.x);
    const contactSpeed=Math.hypot(s.velocity.x,s.velocity.z);
    if(sink>(heli?5:5.5) || bank>.6 || pitch>.5 || (!s.gear && contactSpeed>12)) {
      s.crashed=true; s.crashReason='Hard landing'; s.velocity.set(0,0,0); s.angularVelocity.set(0,0,0);
    } else {
      s.velocity.y=Math.max(0,s.velocity.y);
      s.position.y=contactY;
      s.onGround=true;
      // Tyre/skid resistance, with strong braking; aircraft can accelerate on a runway.
      const friction=(heli?1.3:.022)+(s.brake?1.5:0);
      const decel=friction*G*h;
      const v=Math.hypot(s.velocity.x,s.velocity.z);
      const factor=v>0?Math.max(0,1-decel/v):0;
      s.velocity.x*=factor; s.velocity.z*=factor;
      if(!running && s.engineRPM<.01 && v<.5) s.velocity.set(0,0,0);
      // Wheels constrain pitch/roll while the lift still carries less than weight.
      if(!heli && s.lift<mass*G*.92) {
        const grounded=new THREE.Euler().setFromQuaternion(s.quaternion,'YXZ');
        grounded.x*=Math.exp(-h*5); grounded.z*=Math.exp(-h*8);
        s.quaternion.setFromEuler(grounded); s.angularVelocity.x*=Math.exp(-h*6); s.angularVelocity.z*=Math.exp(-h*8);
      }
    }
  } else s.onGround=false;
  const radius=Math.min(2.2,(d.length || 8)*.10);
  for(const collider of world.colliders || []) {
    const bounds=collider.isBox3?collider:(collider.box || collider.bounds || collider);
    if(!bounds?.min || !bounds?.max) continue;
    // The horizontal roof is a landing surface; side faces remain solid.
    if(previous.y>=bounds.max.y+gearHeight-.12 && s.position.y>=bounds.max.y+gearHeight-.12) continue;
    if(sweepHit(previous,s.position,bounds,radius)) {
      s.crashed=true; s.crashReason='Structure collision'; s.position.copy(previous); s.velocity.set(0,0,0); s.angularVelocity.set(0,0,0); break;
    }
  }
  const angles=new THREE.Euler().setFromQuaternion(s.quaternion,'YXZ');
  s.pitch=angles.x; s.roll=angles.z; s.yaw=angles.y;
  s.airspeed=air.length(); s.verticalSpeed=s.velocity.y;
  s.gForce=s.onGround?1:acceleration.clone().addScaledVector(up,G).dot(bodyUp)/G;
}

