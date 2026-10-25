/** Bounded arcade angular dynamics. Contact impulses, not canned flip curves.
 * SI mass/inertia and measured axle geometry; limited air control is a gameplay
 * assist, not a claim that a road car can steer freely in a real ballistic jump. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
export const uprightError=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function launchAttitude(p,support,{verticalVelocity=0,heading=0,yawRate=0,lateralVelocity=0,speed=1,duration=1,pitch=0}={}){
 const left=support.wheels.filter(w=>w.inside&&w.side<0).length/2,right=support.wheels.filter(w=>w.inside&&w.side>0).length/2;
 const pitchInertia=p.massKg*(p.wheelbase*p.wheelbase/12+p.cg*p.cg),rollInertia=p.massKg*(p.track*p.track/12+p.cg*p.cg);
 const impulse=p.massKg*verticalVelocity*.15;
 const pitchRate=clamp(impulse*p.rear/pitchInertia*(left+right)/2,0,5.6);
 const rollRate=clamp(impulse*p.track*.5*(right-left)/rollInertia,-4.5,4.5);
 return {pitch:0,roll:support.roll||0,pitchRate,rollRate,yawRate:clamp(yawRate+lateralVelocity*p.cg/p.wheelbase*.22,-1.6,1.6),
  pitchInertia,rollInertia,coverage:(left+right)/2,elapsed:0,headingAtLaunch:Math.atan2(lateralVelocity,Math.max(1,speed*Math.cos(heading))),
  targetPitch:Math.round((pitchRate*duration-pitch)/TAU)*TAU+pitch};
}
export function advanceAttitude(car,dt){
 const a=car.airAttitude;if(!a)return;
 a.elapsed+=dt;
 const left=Math.max(.12,car.flightDuration-a.elapsed);
 // The assist has finite angular acceleration. An edge launch can remain
 // sideways or under-rotate at impact; it never snaps to a prescribed curve.
 {const authority=a.coverage>.99?1.8:.65;a.pitchRate+=clamp(2*(a.targetPitch-a.pitch-a.pitchRate*left)/(left*left),-authority,authority)*dt;
  a.rollRate+=clamp(-2*(uprightError(a.roll)+a.rollRate*left)/(left*left),-1.1,1.1)*dt;
  a.yawRate+=clamp(-car.heading*.7-a.yawRate*.35,-.6,.6)*dt;}
 a.pitch+=a.pitchRate*dt;a.roll+=a.rollRate*dt;car.heading+=a.yawRate*dt;
 car.trickAngle=a.pitch;car.airRoll=a.roll;car.yawRate=a.yawRate;
}
export function landingAttitude(car){
 const a=car.airAttitude,pitch=uprightError((a?.pitch||0)-car._rampTakeoffPitch),roll=uprightError(a?.roll||0);
 const upright=Math.abs(pitch)<.38&&Math.abs(roll)<.32&&Math.abs(car.heading)<.45;
 return {pitch,roll,upright,flips:upright?Math.max(0,Math.floor(((a?.pitch||0)+.25)/TAU)):0};
}
