/** Simplified four-contact arcade chassis, in track metres. Not manufacturer data. */
import {createRampLayout,rampHeightAt,rampSlopeAt} from './race3d-ramps.js?v=20261025-fifty1';
import {getRaceVehicleSpec as getVehicleSpec} from './race3d-race-calibration.js?v=20261025-fifty1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
export const VEHICLE_PROFILES=Object.freeze({
 'f1-2026':{wheelbase:3.21581,track:1.44428,front:1.37516,rear:1.84065,cg:.34,frontShare:.45,massKg:760,powerW:140000,brakeFactor:1.06,suspensionHz:3.5,damping:.86},
 gt3:{wheelbase:2.57254,track:1.61088,front:1.43753,rear:1.13501,cg:.48,frontShare:.47,massKg:1250,powerW:190000,brakeFactor:1.20,suspensionHz:3.3,damping:.83},
 'car-concept':{wheelbase:2.95473,track:2.07887,front:1.31576,rear:1.63897,cg:.46,frontShare:.46,massKg:1020,powerW:175000,brakeFactor:1.04,suspensionHz:2.9,damping:.80},
 'lamborghini-gallardo':{wheelbase:2.60342,track:1.65669,front:1.13280,rear:1.47062,cg:.45,frontShare:.44,massKg:1100,powerW:205000,brakeFactor:.97,suspensionHz:3.0,damping:.79},
 'tesla-roadster':{wheelbase:2.96868,track:1.59985,front:1.48926,rear:1.47942,cg:.43,frontShare:.48,massKg:1450,powerW:255000,brakeFactor:.94,suspensionHz:2.6,damping:.88},
});
const profileCache=new WeakMap();
export function vehicleProfile(car={}){
 const spec=car.vehicleSpec||getVehicleSpec(car.racerType),old=profileCache.get(car);
 if(old&&old.type===car.racerType&&old.spec===spec&&old.geometry===car.vehicleGeometry)return old.value;
 const value=Object.freeze({...VEHICLE_PROFILES[car.racerType]||VEHICLE_PROFILES.gt3,...(spec?{massKg:spec.massKg,powerW:spec.powerKW*1000,brakeFactor:spec.brakeDecelMps2/15}:{}),...(car.vehicleGeometry||{})});
 profileCache.set(car,{type:car.racerType,spec,geometry:car.vehicleGeometry,value});return value;
}
export function wheelFootprint(car={}){const p=vehicleProfile(car),h=Number(car.heading)||0,c=Math.cos(h),s=Math.sin(h);return [-1,1].flatMap(side=>[-1,1].map(axle=>{const x=side*p.track/2,z=axle>0?p.front:-p.rear;return {side,axle,x,z,d:z*c-x*s,l:x*c+z*s};}));}
export function wheelLoads(car={}){
 const p=vehicleProfile(car),air=Number(car.flightRemaining)>0;
 const effectiveA=(Number(car.acceleration)||0)+9.81*Math.sin(Number(car.rampPitch)||0);
 const front=clamp(p.frontShare-effectiveA*p.cg/(9.81*p.wheelbase),.20,.75);
 const right=clamp(.5+(Number(car.lateralAcceleration)||0)*p.cg/(9.81*p.track),.16,.84);
 return [-1,1].flatMap(side=>[-1,1].map(axle=>({side,axle,load:air?0:(axle>0?front:1-front)*(side>0?right:1-right),compression:air?-.10:clamp(((axle>0?front:1-front)*(side>0?right:1-right)-.25)*.36+(Number(car.landingImpulse)||0)*.10,-.07,.16)})));
}
/** Both rendering and contact use this exact bank/profile definition. */
export function roadSurface(track,d,l){const s=track.sampleTrack(d);return {sample:s,y:s.position.y+(s.right?.y||0)*l+Math.tan(s.bank||0)*l+.035};}
export function rampAtDistance(ramp,d,length){const lap=Math.round((d-ramp.distance-ramp.length/2)/length);return {start:ramp.distance+lap*length,lap};}
// Unilateral support: a tyre may hang over an edge; a high deck cannot push
// through the chassis when its step exceeds the available suspension travel.
export function unilateralSupportHeight(wheels,center,pitch,roll){return Math.max(center,...wheels.map(w=>w.height-w.x*Math.sin(roll)*Math.cos(pitch)-w.z*Math.sin(pitch)-.15));}
export function rampSupport(car,ramp,start,{extendLip=false}={}){
 const wheels=wheelFootprint(car).map(w=>{
  const d=car.distance+w.d,u=(d-start)/ramp.length,inside=Math.abs(car.lateral+w.l-ramp.lateral)<=ramp.width/2-.08;
  const on=inside&&u>=0&&u<=1;
  const height=inside&&u>=0?(u<=1?rampHeightAt(ramp,u):extendLip?ramp.height+(d-start-ramp.length)*rampSlopeAt(ramp,1):0):0;
  return {...w,height,on,inside,progress:u};
 });
 const front=wheels.filter(w=>w.axle>0).reduce((s,w)=>s+w.height,0)/2,rear=wheels.filter(w=>w.axle<0).reduce((s,w)=>s+w.height,0)/2,p=vehicleProfile(car);
 const pitch=Math.atan2(front-rear,p.wheelbase),center=(front*p.rear+rear*p.front)/p.wheelbase;
 const left=wheels.filter(w=>w.side<0).reduce((s,w)=>s+w.height,0)/2,right=wheels.filter(w=>w.side>0).reduce((s,w)=>s+w.height,0)/2;
 const roll=Math.atan2(right-left,p.track);
 return {wheels,height:unilateralSupportHeight(wheels,center,pitch,roll),pitch,roll,contacts:wheels.filter(w=>w.on).length};
}
/** Plan ahead; never teleport laterally, enter through a side wall or ignore traffic. */
export function planRampApproach(car,ramps,trackLength,traffic=[],curvature=()=>0){
 const p=vehicleProfile(car),speed=Math.max(1,Number(car.speed)||0),look=Math.max(95,speed*4.5);
 for(const ramp of ramps){
  const lap=Math.max(0,Math.ceil((car.distance-ramp.distance-ramp.length-p.rear)/trackLength)),start=ramp.distance+lap*trackLength,ahead=start-car.distance-p.front;
  if(ahead < -ramp.length-p.wheelbase||ahead>look)continue;
  const key=ramp.id+':'+lap,offset=Math.abs(ramp.lateral-car.lateral),clearance=ramp.width/2-p.track/2-.25;
  let reason=null;
  const lipAngle=Math.atan(rampSlopeAt(ramp,1)),vy=speed*Math.sin(lipAngle),airtime=(vy+Math.sqrt(vy*vy+19.62*ramp.height))/9.81;
  const flightRange=speed*Math.cos(lipAngle)*airtime,landingDrift=Math.abs(curvature(start+ramp.length+flightRange*.5))*flightRange*flightRange*.5;
  if(Math.abs(curvature(start))>.018)reason='bend';
  else if(landingDrift>8)reason='landing-bend';
  else if(car.freezeRemaining>0||car.spin>0||car.mistakeType)reason='control';
  else if(speed<9)reason='speed';
  else if(offset>clearance&&ahead<Math.max(18,offset/4.2*speed+speed*.4))reason='unreachable';
  else {
   const horizon=clamp(ahead/speed,.2,3),lo=Math.min(car.lateral,ramp.lateral)-p.track*.6,hi=Math.max(car.lateral,ramp.lateral)+p.track*.6;
   const blocked=traffic.some(o=>{if(o.id===car.id||o.finished||o.lateral<=lo||o.lateral>=hi)return false;const gap=o.distance-car.distance,relative=(o.speed||0)-speed,closest=Math.abs(relative)>.01?clamp(-gap/relative,0,horizon):0;return Math.abs(gap+relative*closest)<Math.max(7,speed*.35);});
   if(blocked)reason='traffic';
  }
  return {id:ramp.id,key,start,lap,ahead,target:ramp.lateral,reachable:!reason,reason,clearance};
 }
 return null;
}
export function surfaceForWheel(track,car,wheel,{extendLip=false}={}){
 const h=Number(car.heading)||0,d=car.distance+wheel.z*Math.cos(h)-wheel.x*Math.sin(h),l=car.lateral+wheel.x*Math.cos(h)+wheel.z*Math.sin(h),base=roadSurface(track,d,l);
 const ramp=(track.ramps||createRampLayout(track)).find(r=>r.id===car.rampId);
 let lift=0,contact=true;
 if(ramp&&car.rampState==='approach'){
  const {start}=rampAtDistance(ramp,car.distance,track.totalLength),u=(d-start)/ramp.length,inside=Math.abs(l-ramp.lateral)<ramp.width/2;
  if(inside&&u>=0){if(u<=1)lift=rampHeightAt(ramp,u);else {contact=false;if(extendLip)lift=ramp.height+(d-start-ramp.length)*rampSlopeAt(ramp,1);}}
 }
 return {d,l,y:base.y+lift,roadY:base.y,lift,contact:contact&&!(car.flightRemaining>0),sample:base.sample};
}
