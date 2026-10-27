import {auditStraightCorridor} from './race3d-course-safety.js?v=20261027-midnight';
/** Temporary authored-slot interactions. Never rewrite road geometry. */
export const TRACK_IDS=Object.freeze(['strip','spring','sweeper','foam','beacon','inverter','reclaim','shift']);
export const TRACK_TIMERS=Object.freeze(['padBoost','padBrake','foamSlow','beacon']);
const approvedSlotCache=new WeakMap();
// Intersect the car's whole step with the patch footprint. Endpoint checks
// miss short tiles and lateral crossings; testing axes separately gives hits
// when a car passed alongside a tile and crossed its lane only afterwards.
export function sweptGroundContact(c,p,gap,longRadius,sideRadius){
 const previous=Number.isFinite(c.previousProgress)?c.previousProgress:c.distance;
 const previousLateral=Number.isFinite(c.previousLateral)?c.previousLateral:c.lateral;
 const x0=gap(previous,p.distance),dx=c.distance-previous;
 const y0=previousLateral-p.lateral,dy=c.lateral-previousLateral;
 let enter=0,leave=1;
 for(const [start,delta,radius]of [[x0,dx,longRadius],[y0,dy,sideRadius]]){
  if(Math.abs(delta)<1e-12){if(Math.abs(start)>radius)return null;continue;}
  const a=(-radius-start)/delta,b=(radius-start)/delta;
  enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
  if(enter>leave)return null;
 }
 return enter<=1&&leave>=0?enter:null;
}
export function createTrackItems(ctx,{state,emit,patches,newId}){
 const cars=()=>ctx.cars(),length=ctx.track.totalLength,half=(ctx.track.width||16.5)/2;
 const key=length+':'+half+':'+JSON.stringify(ctx.track.hazards||[]);let cached=approvedSlotCache.get(ctx.track);
 if(!cached||cached.key!==key){const slots=[];for(let d=80;d<length-300;d+=40){const road=auditStraightCorridor(ctx.track,d,{length:14,runup:35,landing:70});if(road.safe)slots.push(Object.freeze({distance:d,spring:auditStraightCorridor(ctx.track,d,{length:14,runup:45,landing:260}).safe}));}cached={key,slots:Object.freeze(slots)};approvedSlotCache.set(ctx.track,cached);}
 const slots=cached.slots;
 const allTraps=()=>[...ctx.hazards().filter(h=>h.type==='banana'&&h.armed&&h.phase==='landed'),...patches.filter(p=>['emp','oil','decoy','foam'].includes(p.type))];
 const occupied=(d,l,r=2.2)=>cars().some(c=>!c.finished&&Math.abs(ctx.gap(c.distance,d))<10&&Math.abs(c.lateral-l)<r);
 const reserved=(at,spring=false)=>ctx.ramps().some(r=>{const start=r.distance+Math.round((at-r.distance)/length)*length;return at+(spring?274:84)>start-100&&at-(spring?45:35)<start+r.length+(r.corridor?.landing||400);});
 const nearby=(c,range=16)=>allTraps().filter(p=>!p.shifting&&Math.abs(ctx.gap(p.distance,c.distance))<range&&Math.abs(p.lateral-c.lateral)<6).sort((a,b)=>Math.abs(ctx.gap(a.distance,c.distance))-Math.abs(ctx.gap(b.distance,c.distance)))[0];
 function choice(c,type){
  if(type==='beacon'){const h=allTraps().find(p=>{const d=ctx.gap(p.distance,c.distance);return d>0&&d<120;});return h?{use:true,reason:'hazard-information'}:{use:false,reason:'no-upcoming-trap'};}
  if(type==='sweeper'){const hits=allTraps().filter(p=>{const d=ctx.gap(p.distance,c.distance);return d>=0&&d<45&&Math.abs(p.lateral-c.lateral)<2+d*.14;});return hits.length?{use:true,reason:'ground-traps-ahead',trapIds:hits.map(p=>p.id)}:{use:false,reason:'no-ground-trap'};}
  if(type==='reclaim'){const p=nearby(c,14);return p?{use:true,reason:'capture-ground-trap',trapId:p.id}:{use:false,reason:'no-capturable-ground-trap'};}
  if(type==='shift'){const p=nearby(c,20);if(!p)return {use:false,reason:'no-ground-trap'};for(const dir of [-1,1]){const l=p.lateral+dir*3.4;if(Math.abs(l)+(p.radius||1.5)>half-1||occupied(p.distance,(l+p.lateral)/2,Math.abs(l-p.lateral)/2+1.5)||reserved(p.distance))continue;return {use:true,reason:'unoccupied-adjacent-slot',trapId:p.id,lateral:l};}return {use:false,reason:'shift-path-occupied'};}
  if(type==='inverter'){const p=patches.find(p=>p.type==='strip'&&Math.abs(ctx.gap(p.distance,c.distance))<90&&!p.inverted&&!p.pendingInvert&&!occupied(p.distance,p.lateral));return p?{use:true,reason:'unoccupied-existing-strip',padId:p.id}:{use:false,reason:'no-eligible-strip'};}
  if(!['strip','spring','foam'].includes(type)||c.flightRemaining>0||c.rampState==='approach'||patches.length>=48)return {use:false,reason:'ground-or-capacity'};
  let target=null;if(type==='foam'){target=cars().find(o=>o.id!==c.id&&!o.finished&&ctx.gap(o.distance,c.distance)>15&&ctx.gap(o.distance,c.distance)<140&&Math.abs(o.lateral-c.lateral)>3);if(!target)return {use:false,reason:'no-other-lane-target'};}
  let best=null;for(const slot of slots){if(type==='spring'&&!slot.spring)continue;let at=slot.distance+Math.round((c.distance-slot.distance)/length)*length;const minGap=Math.max(25,c.speed*.8,target?ctx.gap(target.distance,c.distance)+target.speed*.7+8:0);if(at-c.distance<minGap)at+=length;const d=at-c.distance;if(d>180||reserved(at,type==='spring')||at+(type==='spring'?274:84)>ctx.finishDistance)continue;
   const lane=target?[-4.5,0,4.5].sort((a,b)=>Math.abs(a-target.lateral)-Math.abs(b-target.lateral))[0]:c.lateral< -2?-4.5:c.lateral>2?4.5:0;if(target&&Math.abs(lane-c.lateral)<3||occupied(at,lane,2.5))continue;
   if(!best||d<best.gap)best={use:true,reason:'validated-clear-slot',gap:d,slot:{distance:at,lateral:lane},targetId:target?.id||null};}
  return best||{use:false,reason:'no-clear-approved-slot'};
 }
 function remove(id){let i=patches.findIndex(p=>p.id===id);if(i>=0){patches.splice(i,1);return;}i=ctx.hazards().findIndex(p=>p.id===id);if(i>=0)ctx.hazards().splice(i,1);}
 function activate(c,type,p){
  if(['strip','spring','foam'].includes(type))patches.push({id:newId(),type,ownerId:c.id,distance:p.slot.distance,lateral:p.slot.lateral,age:0,ttl:16,radius:type==='foam'?1.4:2,length:type==='foam'?3:14,hits:[],trackPatch:true,inverted:0});
  else if(type==='beacon')state(c).beacon=10;
  else if(type==='sweeper'){for(const id of p.trapIds)remove(id);}
  else if(type==='inverter'){const pad=patches.find(x=>x.id===p.padId);if(!pad)return false;pad.pendingInvert=.5;}
  else if(type==='reclaim'){const trap=allTraps().find(x=>x.id===p.trapId);if(!trap)return false;remove(trap.id);ctx.claim(c,trap.type);}
  else if(type==='shift'){const trap=allTraps().find(x=>x.id===p.trapId);if(!trap)return false;trap.shifting={from:trap.lateral,to:p.lateral,elapsed:0};trap.armed=false;}
  c._nextExtraUse=ctx.time()+3;emit(type,c);return true;
 }
 function step(dt){
  for(const p of [...ctx.hazards(),...patches])if(p.shifting){const s=p.shifting,mid=(s.from+s.to)/2;if(occupied(p.distance,mid,Math.abs(s.to-s.from)/2+1.5))continue;s.elapsed+=dt;p.lateral=s.from+(s.to-s.from)*Math.min(1,s.elapsed/.5);if(s.elapsed>=.5){p.shifting=null;p.armed=true;}}
  for(const p of patches){if(!p.trackPatch)continue;if(p.pendingInvert){p.pendingInvert=Math.max(0,p.pendingInvert-dt);if(!p.pendingInvert){if(occupied(p.distance,p.lateral))p.pendingInvert=.1;else p.inverted=3;}}else p.inverted=Math.max(0,p.inverted-dt);
   if(p.age<.45)continue;for(const c of cars()){if(c.finished||c.flightRemaining>0||p.hits.includes(c.id)||sweptGroundContact(c,p,ctx.gap,(p.length||3)/2+1.8,p.radius||2)===null)continue;p.hits.push(c.id);const s=state(c);
    if(p.type==='strip'){if(p.inverted>0){if(s.padBrake<=0)s.padBrake=3;}else if(s.padBoost<=0)s.padBoost=1.4;}
    else if(p.type==='spring')ctx.hop(c,Math.max(9,Math.min(14,12*Math.sqrt(1320/c.massKg))),'spring');
    else if(p.type==='foam'){if(ctx.blocked(c,'foam'))continue;c.speed=Math.max(5,c.speed*.78);if(s.foamSlow<=0)s.foamSlow=5;}
    emit(p.type+'-hit',c,{ownerId:p.ownerId,inverted:p.inverted>0});
   }
  }
  for(const c of cars()){if(c.finished||state(c).beacon<=0){c._beaconLaneHint=null;continue;}const h=allTraps().find(p=>{const d=ctx.gap(p.distance,c.distance);return d>0&&d<120;});if(!h){c._beaconLaneHint=null;continue;}const options=[-5,0,5].filter(l=>Math.abs(l-h.lateral)>(h.radius||2)+1.2&&!occupied(c.distance+15,l));options.sort((a,b)=>Math.abs(a-c.lateral)-Math.abs(b-c.lateral));c._beaconLaneHint=options[0]??null;c._beaconDistance=h.distance;}
 }
 function acceleration(c){return state(c).padBoost>0&&!(state(c).emp>0)&&c.flightRemaining<=0?5:0;}
 return {choice,activate,step,acceleration,slots,reserved};
}
