/** Bounded fixed-step item mechanics. Rendering/audio never decide outcomes. */
import {createMobilityItems,MOBILITY_IDS,MOBILITY_TIMERS} from './race3d-mobility-items.js?v=20261027-midnight';
import {createTrackItems,TRACK_IDS,TRACK_TIMERS,sweptGroundContact} from './race3d-track-items.js?v=20261027-midnight';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const timers=['ram','deflector','flare','grip','ghost','interceptor','brace','draftbreaker','emp','jammer','pickupBlock','oil','theftImmune','tether',...MOBILITY_TIMERS,...TRACK_TIMERS];
export const IMPLEMENTED_EXTRA_IDS=Object.freeze(['bolt','emp','oil','ram','tether','jammer','smoke','decoy','draftbreaker','theft','charge','deflector','flare','grip','cleanse','ghost','interceptor','brace',...MOBILITY_IDS,...TRACK_IDS]);
export function createExtendedItems(ctx){
 const patches=[],shots=[],links=[];let serial=0,peak=0;
 const cars=()=>ctx.cars(),time=()=>ctx.time(),gap=(a,b)=>ctx.gap(a,b);
 const state=c=>c.itemEffects||(c.itemEffects=Object.fromEntries(timers.map(k=>[k,0])));
 const mobility=createMobilityItems(ctx,{state,emit});
 const trackItems=createTrackItems(ctx,{state,emit,patches,newId:()=>'extra-'+(++serial)});
 const opponents=c=>cars().filter(o=>o.id!==c.id&&!o.finished);
 const ahead=(c,range=120)=>opponents(c).filter(o=>{const d=gap(o.distance,c.distance);return d>5&&d<range&&Math.abs(o.lateral-c.lateral)<4&&o.flightRemaining<=0&&o.shieldRemaining<=0&&o._hitImmune<=0;}).sort((a,b)=>gap(a.distance,c.distance)-gap(b.distance,c.distance))[0];
 const clearCorridor=d=>!ctx.ramps().some(r=>{const n=gap(d,r.distance);return n>-100&&n<r.length+400;});
 const straightPath=(c,t)=>{const d=gap(t.distance,c.distance);return [0,.25,.5,.75,1].every(f=>Math.abs(ctx.curvature(c.distance+d*f)*d)<.12);};
 const near=(c,r=18)=>opponents(c).some(o=>Math.abs(gap(o.distance,c.distance))<r&&Math.abs(o.lateral-c.lateral)<4);
 const threat=c=>ctx.projectiles().some(p=>p.ownerId!==c.id&&Math.abs(gap(p.distance,c.distance))<100&&Math.abs(p.lateral-c.lateral)<6);
 function lockClear(from,to){const d=gap(to.distance,from.distance);if(Math.abs(d)<1)return true;return !patches.some(p=>p.type==='smoke'&&Math.abs(gap(p.distance,from.distance))<=Math.abs(d)&&gap(p.distance,from.distance)*d>=0&&Math.abs(p.lateral-(from.lateral+(to.lateral-from.lateral)*gap(p.distance,from.distance)/d))<p.radius);}
 function decision(c,type){
  const s=state(c),hold=reason=>({use:false,reason,targetId:null}),yes=(reason,target)=>({use:true,reason,targetId:target?.id||null});
  if(!IMPLEMENTED_EXTRA_IDS.includes(type)||c.finished||time()<(c._nextExtraUse||0))return hold('cooldown-or-unimplemented');
  if(s.jammer>0&&type!=='cleanse')return hold('jammed');
  if(MOBILITY_IDS.includes(type))return mobility.decision(c,type);
  if(TRACK_IDS.includes(type))return trackItems.choice(c,type);
  if(['emp','oil','smoke','decoy'].includes(type))return c.flightRemaining<=0&&clearCorridor(c.distance-5)&&patches.length<48&&!patches.some(p=>p.ownerId===c.id&&p.type===type)?yes('rear-road-clear'):hold('ground-or-capacity');
  if(type==='tether'&&links.length>=16)return hold('link-capacity');
  if(['bolt','theft','jammer','tether'].includes(type)){const t=ahead(c,type==='tether'?45:type==='jammer'?100:260);return t&&lockClear(c,t)&&straightPath(c,t)&&(!['bolt','theft'].includes(type)||shots.length<32)&&(type!=='theft'||(t.inventoryPhase==='ready'&&t.inventoryItem&&state(t).theftImmune<=0))?yes('aligned-opponent',t):hold('no-eligible-target');}
  if(type==='cleanse')return c.spin>0||c.freezeRemaining>0||c.attackSlowRemaining>0||s.emp>0||s.jammer>0||s.oil>0||s.pickupBlock>0?yes('existing-debuff'):hold('healthy');
  if(s[type]>0||type==='charge'&&c.itemCharge)return hold('already-active');
  if(type==='grip')return s.oil>0||ctx.hazards().some(h=>Math.abs(gap(h.distance,c.distance))<55)||patches.some(p=>p.type==='oil'&&Math.abs(gap(p.distance,c.distance))<55)?yes('surface-threat'):hold('dry-road');
  if(type==='draftbreaker')return opponents(c).some(o=>gap(c.distance,o.distance)>5&&gap(c.distance,o.distance)<40&&Math.abs(o.lateral-c.lateral)<4)?yes('break-following-wake'):hold('no-follower');
  if(type==='flare')return ctx.projectiles().some(p=>p.type==='missile'&&p.targetId===c.id)?yes('locked-missile'):hold('no-lock');
  if(type==='deflector'||type==='interceptor')return threat(c)?yes('incoming-projectile'):hold('no-projectile');
  if(['ram','charge','ghost','brace'].includes(type))return c.flightRemaining<=0&&near(c)?yes('contact-opportunity'):hold('no-nearby-body');
  return hold('no-benefit');
 }
 function emit(type,c,data={}){ctx.emit('extra-'+type,c,{itemType:type.split('-')[0],...data});}
 function patch(c,type){const p={id:'extra-'+(++serial),type,ownerId:c.id,distance:c.distance-5,lateral:c.lateral,age:0,ttl:type==='smoke'?10:16,radius:type==='emp'?2.4:type==='oil'?2.6:type==='smoke'?4:1.8,hits:[]};patches.push(p);return p;}
 function shot(c,type,target){const p={id:'extra-'+(++serial),type,ownerId:c.id,targetId:target?.id||null,distance:c.distance+3,lateral:c.lateral,previousDistance:c.distance+3,previousLateral:c.lateral,height:1.4,previousHeight:1.4,heading:target?Math.atan2(target.lateral-c.lateral,Math.max(5,gap(target.distance,c.distance))):c.heading||0,speed:Math.max(140,c.speed+70),ttl:4,age:0,hits:[],remaining:type==='bolt'?2:1};shots.push(p);return p;}
 function activate(c,type,choice=decision(c,type)){
  if(!choice.use)return false;const s=state(c),target=cars().find(o=>o.id===choice.targetId&&!o.finished);
  if(MOBILITY_IDS.includes(type))return mobility.activate(c,type,choice);
  if(TRACK_IDS.includes(type))return trackItems.activate(c,type,choice);
  if(['emp','oil','smoke','decoy'].includes(type))patch(c,type);
  else if(type==='bolt'||type==='theft')shot(c,type,target);
  else if(type==='jammer'){if(!target||ctx.blocked(target,type))return false;state(target).jammer=7.5;target._hitImmune=Math.max(target._hitImmune,3.5);emit('jammer-hit',target,{ownerId:c.id,duration:7.5});}
  else if(type==='tether'){if(!target)return false;s.tether=2.4;links.push({id:'extra-'+(++serial),type,ownerId:c.id,targetId:target.id,age:0,ttl:2.4});}
  else if(type==='charge')c.itemCharge={ownerId:c.id,fuse:5,grace:.5};
  else if(type==='cleanse')cleanse(c);
  else {s[type]={ram:6,deflector:5,flare:8,grip:10,ghost:4,interceptor:6,brace:4,draftbreaker:8}[type]||0;if(type==='interceptor')c._interceptions=2;if(type==='ghost')c._ghostGrace=0;}
  c._nextExtraUse=time()+(['theft','charge'].includes(type)?8:3);emit(type,c,{targetId:target?.id||null});return true;
 }
 function guardProjectile(c,type,p){
  const s=state(c);if(type!=='missile'&&type!=='bomb'&&type!=='bolt'&&type!=='theft')return false;
  if(s.deflector>0&&gap(p.distance,c.distance)<4&&p.ownerId!==c.id){s.deflector=0;if(shots.length<32){const reflected=shot(c,'bolt',cars().find(o=>o.id===p.ownerId));reflected.speed=-140;reflected.ttl=2;reflected.reflected=true;}emit('deflector-block',c,{ownerId:p.ownerId});return true;}return false;
 }
 function intercept(p){for(const c of cars()){const s=state(c);if(!c.finished&&s.interceptor>0&&c._interceptions>0&&p.ownerId!==c.id&&Math.hypot(gap(p.distance,c.distance),p.lateral-c.lateral)<12){if(--c._interceptions<=0)s.interceptor=0;emit('interceptor-block',c);return true;}}return false;}
 function redirect(p,dt){if(p.type!=='missile')return false;if(p._flared){p.lateral+=p._flared*7*dt;return true;}const c=cars().find(c=>c.id===p.targetId&&!c.finished);if(c&&state(c).flare>0&&Math.abs(gap(p.distance,c.distance))<100){state(c).flare=0;p._flared=c.lateral>=0?-1:1;p.targetId=null;p.ttl=Math.min(p.ttl,p.age+1.4);emit('flare-divert',c);return true;}return false;}
 function contact(a,b){
  if(!(state(a).ram>0)&&!(state(b).ram>0)&&!a.itemCharge&&!b.itemCharge)return;
  for(const [owner,target]of [[a,b],[b,a]]){const s=state(owner);if(s.ram>0){s.ram=0;if(!ctx.blocked(target,'ram')){const resistance=state(target).brace>0?.2:1;target.lateralVelocity+=Math.sign(target.lateral-owner.lateral||1)*4.5*resistance;target.speed=Math.max(4,target.speed-5);target._hitImmune=Math.max(target._hitImmune,1.5);emit('ram-hit',target,{ownerId:owner.id});}}
   if(owner.itemCharge&&owner.itemCharge.grace<=0&&!target.itemCharge&&!ctx.blocked(target,'charge')){target.itemCharge=owner.itemCharge;owner.itemCharge=null;target.itemCharge.grace=.7;emit('charge-pass',target,{ownerId:owner.id});}
  }
 }
 function step(dt){
  for(const c of cars()){
   const s=state(c);if(c.finished){if(!c._extrasCleared)clearCar(c);continue;}
   for(const k of timers)s[k]=Math.max(0,s[k]-dt);
   if(s.ghost<=0&&c._ghostGrace<1&&near(c,5)){s.ghost=.05;c._ghostGrace+=.05;c.speed=Math.max(3,c.speed-dt*5);}
   if(c.itemCharge){c.itemCharge.fuse-=dt;c.itemCharge.grace-=dt;if(c.itemCharge.fuse<=0){const source={id:'charge-'+(++serial),ownerId:c.itemCharge.ownerId,distance:c.distance,lateral:c.lateral};c.itemCharge=null;ctx.hit(c,'bomb',source,.7);emit('charge-burst',c,{ownerId:source.ownerId});}}
  }
  mobility.step(dt);
  for(let i=links.length-1;i>=0;i--){const l=links[i],o=cars().find(c=>c.id===l.ownerId&&!c.finished),t=cars().find(c=>c.id===l.targetId&&!c.finished);l.age+=dt;if(!o||!t||t.shieldRemaining>0||t.flightRemaining>0||l.age>l.ttl||gap(t.distance,o.distance)<5||gap(t.distance,o.distance)>55||Math.abs(t.lateral-o.lateral)>5||!lockClear(o,t)||!straightPath(o,t)){links.splice(i,1);continue;}o.speed=Math.min(o.attackSpeedCap||Infinity,o.topSpeed+8,o.speed+2*dt);if(t._tetherFrame!==time()){t.speed=Math.max(5,t.speed-2.5*dt);t._tetherFrame=time();}}
  for(let i=patches.length-1;i>=0;i--){const p=patches[i];p.age+=dt;const owner=cars().find(c=>c.id===p.ownerId);if(p.age>=p.ttl||!owner){patches.splice(i,1);continue;}if(p.type==='smoke'||p.trackPatch||p.shifting||p.age<.45)continue;for(const c of cars()){if(c.finished||c.id===p.ownerId||c.flightRemaining>0||p.hits.includes(c.id)||sweptGroundContact(c,p,gap,4,p.radius)===null)continue;const s=state(c);p.hits.push(c.id);if(ctx.blocked(c,p.type))continue;const duration=p.type==='oil'?5:7.5;if(p.type==='oil')s.oil=Math.max(s.oil,duration);else if(p.type==='emp')s.emp=Math.max(s.emp,duration);else if(p.type==='decoy')s.pickupBlock=Math.max(s.pickupBlock,duration);emit(p.type+'-hit',c,{ownerId:p.ownerId,duration});}}
  for(let i=shots.length-1;i>=0;i--){const p=shots[i];p.age+=dt;p.previousDistance=p.distance;p.previousLateral=p.lateral;p.previousHeight=p.height;p.heading-=ctx.curvature(p.distance)*p.speed*Math.cos(p.heading)*dt;p.distance+=p.speed*Math.cos(p.heading)*dt;p.lateral+=p.speed*Math.sin(p.heading)*dt;const owner=cars().find(c=>c.id===p.ownerId);if(p.age>=p.ttl||Math.abs(p.lateral)>ctx.track.width*.5+2||!owner||intercept(p)){shots.splice(i,1);continue;}
   const contacts=[];for(const c of cars()){if(c.finished||c.id===p.ownerId||c.flightRemaining>0||p.hits.includes(c.id))continue;const f=ctx.sweep(c,p,2.8,1.3);if(f!==null)contacts.push({c,f});}contacts.sort((a,b)=>a.f-b.f||a.c.gridPosition-b.c.gridPosition);
   for(const {c}of contacts){p.hits.push(c.id);if(guardProjectile(c,p.type,p)||c.shieldRemaining>0){p.remaining=0;break;}if(p.type==='theft'){if(!owner.finished&&ctx.canClaim(owner)&&c.inventoryItem&&c.inventoryPhase==='ready'&&state(c).theftImmune<=0&&!ctx.blocked(c,'theft')){const item=c.inventoryItem;if(ctx.claim(owner,item)){ctx.removeHeld(c);state(c).theftImmune=5;emit('theft-hit',c,{ownerId:owner.id,stolen:item});}}}else if(ctx.hit(c,'missile',p,.65))emit(p.type+'-hit',c,{ownerId:owner.id});if(--p.remaining<=0)break;}
   if(p.remaining<=0)shots.splice(i,1);
  }
  trackItems.step(dt);
  peak=Math.max(peak,patches.length+shots.length+links.length);
 }
 function clearCar(c){c.itemEffects=Object.fromEntries(timers.map(k=>[k,0]));mobility.clear(c);c.itemCharge=null;c._ghostGrace=1;c._extrasCleared=!!c.finished;}
 function cleanse(c){const s=state(c);for(const k of ['emp','jammer','pickupBlock','oil','padBrake','foamSlow'])s[k]=0;c.attackSlowRemaining=0;c.attackSpeedCap=Infinity;c.attackSource=null;c.spin=0;c.freezeRemaining=0;c.tractionRecovery=0;c.heading*=.3;if(c.itemCharge?.ownerId!==c.id)c.itemCharge=null;}
 function reset(){patches.length=shots.length=links.length=0;serial=peak=0;for(const c of cars())clearCar(c);}
 return {decision,activate,step,contact,guardProjectile,intercept,redirect,lockClear,clearCar,cleanse,reset,beforeMotion:mobility.beforeMotion,acceleration(c,dt,envelope,drive){const m=mobility.acceleration(c,dt,envelope,drive),room=Math.max(0,envelope.longitudinalAccel-Math.max(0,drive.acceleration)-c.nitroAcceleration-c.rocketAcceleration-m);c._mobilityAcceleration=m;return m+Math.min(room,trackItems.acceleration(c));},onHit:mobility.onHit,finishAll(){patches.length=shots.length=links.length=0;},patches,shots,links,snapshot:()=>({patches:patches.map(p=>({...p})),shots:shots.map(p=>({...p})),links:links.map(p=>({...p})),peak,capacity:96,implemented:[...IMPLEMENTED_EXTRA_IDS],approvedTrackSlots:trackItems.slots.length})};
}
