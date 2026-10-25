/** Bounded deterministic item choices. Scores estimate opportunities, never guarantee hits. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const GROUND_ITEMS=Object.freeze(['launch','boost','bomb','missile','banana','shockwave','freeze']);
export const ATTACK_LIMITS=Object.freeze({missile:{range:220,speed:82,ttl:4.5,width:8},bomb:{range:700,speed:110,ttl:14,width:7.5},shockwave:{range:480,speed:85,ttl:14,width:4.2},freeze:{range:115,speed:62,ttl:3.6,width:3.8},banana:{range:70,speed:0,ttl:24,width:2.1}});
export function itemDecision(car,cars,{trackLength=1e6,curvature=()=>0,projectiles=[],waves=[]}={}){
 const type=car.inventoryItem,hold=reason=>({use:false,reason,targetId:null});
 if(!type||car.inventoryPhase!=='ready'||car.finished)return hold('not-ready');
 if(GROUND_ITEMS.includes(type)&&(car.flightRemaining>0||car.rampState==='approach'))return hold('needs-contact');
 const gap=o=>{const n=(o.distance-car.distance)%trackLength;return n>trackLength/2?n-trackLength:n< -trackLength/2?n+trackLength:n;};
 const opponents=cars.filter(c=>c.id!==car.id&&!c.finished);
 if(ATTACK_LIMITS[type]){
  const p=ATTACK_LIMITS[type],speed=type==='bomb'?Math.max(p.speed,car.speed+65):type==='missile'?Math.max(p.speed,car.speed+38):type==='shockwave'?Math.max(p.speed,car.speed+42):Math.max(p.speed,car.speed+25);
  const candidates=opponents.filter(o=>o.flightRemaining<=0&&(o.shieldRemaining||0)<=.1&&(o._hitImmune||0)<=.15).map(o=>{
   const d=gap(o),behind=type==='banana',closing=behind?Math.max(3,o.speed):speed-o.speed;
   if((behind?(d>=-5||d< -p.range):(d<=5||d>p.range))||closing<=2)return null;
   const t=behind?Math.max(0,(-d-4)/closing):d/closing;
   if(behind&&(t<.5||t>4))return null;
   if(t>p.ttl*.82)return null;
   const side=o.lateral+(o.lateralVelocity||0)*Math.min(t,1.5)-car.lateral;
   const steerable=type==='missile'?7.5*t:type==='bomb'?4*t:0;
   const miss=Math.max(0,Math.abs(side)-steerable),confidence=clamp(.94-miss/(p.width+1)*.58-Math.min(.35,Math.abs(o.lateralVelocity||0)*t*.055)-t*.012,0,.95);
   if(confidence<(car.driverControl?.itemConfidence??.53))return null;
   return {targetId:o.id,confidence,intercept:t,aimLateralSpeed:type==='bomb'?clamp(side/Math.max(.3,t),-4,4):0,score:confidence+.12*(d>0?1:0)-Math.abs(d)*.0002};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||String(a.targetId).localeCompare(String(b.targetId)));
  return candidates[0]?{use:true,reason:'intercept',...candidates[0]}:hold('no-useful-target');
 }
 const bend=Math.max(...[0,25,55,85].map(d=>Math.abs(curvature(car.distance+d))));
 if(type==='repair')return car.damage>.09||car.spin>0||car.freezeRemaining>0||car.attackSlowRemaining>0||car.replacementPending>0||car.batterySOC<.74?{use:true,reason:'restore-condition'}:hold('healthy');
 if(type==='shield'){
  const threat=[...projectiles,...waves].some(p=>p.ownerId!==car.id&&Math.abs(p.distance-car.distance)<100&&Math.abs(p.lateral-car.lateral)<7)||opponents.some(o=>Math.abs(gap(o))<14&&Math.abs(o.lateral-car.lateral)<3);
  return threat&&(car.shieldRemaining||0)<.3?{use:true,reason:'incoming-threat'}:hold('no-threat');
 }
 if(type==='boost'||type==='rocket')return (car.attackSlowRemaining||0)<=0&&(car.spin||0)<=0&&(car.freezeRemaining||0)<=0&&(car.brake||0)<.15&&bend<.0065&&car.speed>5?{use:true,reason:'clear-acceleration-window'}:hold('braking-or-turning-or-disrupted');
 if(type==='launch'){
  const traffic=opponents.some(o=>gap(o)>4&&gap(o)<75);
  return (car.spin>0||car.freezeRemaining>0||traffic)&&bend<.009?{use:true,reason:car.spin>0||car.freezeRemaining>0?'recover-control':'overfly-traffic'}:hold('no-safe-gain');
 }
 return hold('no-benefit');
}
