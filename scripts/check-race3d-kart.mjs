import assert from 'node:assert/strict';
import {createRaceSimulation,RACE_PHYSICS} from '../public/games/games/race3d-physics.js';
import {ITEM_TYPES,drawItem} from '../public/games/games/race3d-item-rules.js';
import {resolveQuality} from '../public/games/games/race3d-quality.js';
import {RACE_ROSTER_TYPES,getRacerIdentity} from '../public/games/games/race3d-roster.js';
const track={totalLength:40000,raceDistance:1e7,width:16.5,hazards:[],sampleTrack:d=>({position:{x:d,y:0,z:0},tangent:{x:1,y:0,z:0},right:{x:0,y:0,z:1},width:16.5})};
const make=(count=2)=>{const s=createRaceSimulation({players:Array.from({length:count},(_,i)=>({id:'p'+i,name:'Test '+i})),track,random:()=>.374,autoItems:false});s.pickups.length=0;for(const c of s.cars){c._nextMistake=Infinity;c._nextDecision=Infinity;}return s;};
const advance=(s,seconds)=>{for(let t=0;t<seconds-1e-8;t+=1/60)s.update(Math.min(1/60,seconds-t));};
const car=(s,id='p0')=>s.cars.find(c=>c.id===id);
const place=(s)=>{s.cars.forEach((c,i)=>Object.assign(c,{distance:100+i*30,previousProgress:100+i*30,lateral:0,lateralVelocity:0,heading:0,speed:20,preferredLane:0,spin:0,_hitImmune:0}));};
const ready=(s,type,id='p0')=>{assert.ok(s.awardItem(id,type));assert.equal(s.useHeldItem(id),false);advance(s,4.51);assert.equal(car(s,id).inventoryPhase,'ready');};
const outcomes=[];
// Same opportunity permits duplicate results but never forces a shared result.
assert.equal(drawItem(()=>0),'launch');assert.equal(ITEM_TYPES.length,50);assert.equal(drawItem(()=>.999),ITEM_TYPES.at(-1));
assert.equal(resolveQuality('auto',{width:390}).id,'low');assert.equal(resolveQuality('auto',{width:1440,cores:8,racers:24}).id,'medium');assert.equal(resolveQuality('high').detailedCars,6);
{const s=make(24);for(const c of s.cars)assert.ok(s.awardItem(c.id,drawItem(c._itemRandom)));assert.ok(new Set(s.cars.map(c=>c.inventoryItem)).size>1);assert.ok(new Set(s.cars.map(c=>c.inventoryItem)).size<24);const first=s.cars[0].inventoryItem;assert.equal(s.awardItem(s.cars[0].id,'bomb'),true);assert.equal(s.awardItem(s.cars[0].id,'shield'),false);assert.equal(s.cars[0].inventoryItem,first);advance(s,4.51);const phases=s.cars.map(c=>c.inventoryPhase);assert.ok(phases.every(p=>p==='ready'));s.reset();assert.ok(s.cars.every(c=>!c.inventoryItem&&c.itemsUsed===0));s.dispose();assert.equal(s.awardItem('p0','boost'),false);}
for(const type of ['boost','rocket','shield','launch','repair']){
 const s=make();ready(s,type);place(s);const c=car(s);
 if(type==='repair')Object.assign(c,{damage:.7,hitPoints:30,spin:.4,freezeRemaining:2,_lostSpeed:12});
 assert.ok(s.useHeldItem(c.id));assert.equal(c.inventoryItem,null);assert.equal(s.useHeldItem(c.id),false);
 if(type==='boost')assert.ok(c.nitro.remaining>0);
 if(type==='rocket')assert.ok(c.rocketRemaining>0);
 if(type==='shield')assert.ok(c.shieldRemaining>0);
 if(type==='launch')assert.ok(c.flightRemaining>0);
 if(type==='repair'){assert.equal(c.damage,0);assert.equal(c.hitPoints,100);assert.equal(c.spin,0);assert.equal(c.freezeRemaining,0);assert.ok(c.shieldRemaining>0);}
 advance(s,10);assert.equal(c.rocketRemaining,0);assert.equal(c.shieldRemaining,0);assert.equal(c.flightRemaining,0);assert.equal(c.repairRemaining,0);assert.equal(c.boost,0);outcomes.push(type);s.dispose();
}
for(const type of ['missile','bomb','shockwave','freeze','banana']){
 const s=make();ready(s,type);place(s);if(type==='bomb')Object.assign(car(s,'p1'),{distance:210,previousProgress:210,speed:0});assert.ok(s.useHeldItem('p0'));
 if(type==='missile')assert.equal(s.projectiles[0].targetId,'p1');
 if(type==='banana'){advance(s,1.6);const h=s.hazards[0];assert.ok(h&&h.armed&&h.phase==='landed');Object.assign(car(s,'p1'),{distance:h.distance,lateral:h.lateral,previousProgress:h.distance,speed:0,_hitImmune:0});}
 advance(s,2);const events=s.drainEvents();assert.ok(events.some(e=>e.type===type+'-hit'),type+' actually hits');
 if(type==='freeze'){assert.ok(car(s,'p1').freezeRemaining>0);advance(s,7);assert.equal(car(s,'p1').freezeRemaining,0);}
 advance(s,60);assert.equal(s.projectiles.length,0);assert.equal(s.waves.length,0);assert.equal(s.hazards.length,0);outcomes.push(type);s.dispose();
}
// Shields counter every offered offensive family, not just a visual bubble.
for(const type of ['missile','bomb','shockwave','freeze','banana']){
 const s=make();assert.ok(s.awardItem('p0',type));assert.ok(s.awardItem('p1','shield'));advance(s,4.51);place(s);if(type==='bomb')Object.assign(car(s,'p1'),{distance:210,previousProgress:210,speed:0});s.useHeldItem('p1');s.useHeldItem('p0');
 if(type==='banana'){advance(s,1.6);const h=s.hazards[0];Object.assign(car(s,'p1'),{distance:h.distance,lateral:h.lateral,previousProgress:h.distance,speed:0});}
 advance(s,2);const events=s.drainEvents();assert.ok(events.some(e=>e.type==='shield-block'&&e.attack===type),'shield counters '+type);assert.ok(!events.some(e=>e.type===type+'-hit'));s.dispose();
}
// The actual shared profile is continuous and produces takeoff + safe landing.
{const s=make(1),c=car(s),r=s.ramps[0];Object.assign(c,{distance:r.distance-5,previousProgress:r.distance-5,lateral:r.lateral,preferredLane:r.lateral,speed:36});advance(s,6);const e=s.drainEvents();assert.ok(e.some(x=>x.type==='ramp-takeoff'));assert.ok(e.some(x=>x.type==='ramp-land'&&x.successful));assert.ok(c.completedFlips>0);assert.equal(c.flightRemaining,0);assert.ok(Number.isFinite(c.distance));s.dispose();}
// Replay and public iteration order must not change item choices/outcome.
{const a=make(8),b=make(8);b.cars.reverse();for(const s of [a,b]){for(const c of s.cars)s.awardItem(c.id,drawItem(c._itemRandom));advance(s,12);}for(const x of a.cars){const y=car(b,x.id);assert.equal(x.lastUsedItem,y.lastUsedItem);assert.ok(Math.abs(x.distance-y.distance)<1e-7);}a.dispose();b.dispose();}
// A full pool retains the new item and never evicts an existing owner's shot.
{const s=make();ready(s,'bomb');place(s);s.useHeldItem('p0');s.projectiles[0].height=20;s.projectiles[0].distance=10000;s.projectiles[0].previousDistance=10000;const original=s.projectiles[0].id;ready(s,'bomb');assert.equal(s.useHeldItem('p0'),false);assert.equal(car(s).inventoryItem,'bomb');assert.ok(s.projectiles.some(p=>p.id===original));s.projectiles.length=0;assert.equal(s.useHeldItem('p0'),true);s.dispose();}
// Real box collection, not a test-only award path, draws independent results.
{const s=createRaceSimulation({players:Array.from({length:24},(_,i)=>({id:'gate-'+i,name:'Racer '+i})),track,random:()=>.71});const gate=s.pickups[0].distance;for(const [i,c]of s.cars.entries())Object.assign(c,{distance:gate-2-i*.1,speed:30,lateral:i%2?-2:2,preferredLane:i%2?-2:2,_nextMistake:Infinity});advance(s,1);const held=s.cars.filter(c=>c.inventoryItem);assert.ok(held.length>5);assert.ok(new Set(held.map(c=>c.inventoryItem)).size>1);s.dispose();}
// Maximum roster completes without a timeout rule and clears all weapon state.
{const longTrack={...track,totalLength:4000,raceDistance:4000};const s=createRaceSimulation({players:Array.from({length:60},(_,i)=>({id:'soak-'+i,name:'Racer '+i,...getRacerIdentity(RACE_ROSTER_TYPES[i%RACE_ROSTER_TYPES.length])})),track:longTrack,random:()=>.613});for(let t=0;t<700&&!s.allFinished;t+=.25)s.update(.25);assert.ok(s.allFinished);assert.equal(s.results.length,60);assert.equal(new Set(s.results.map(r=>r.id)).size,60);assert.equal(s.projectiles.length+s.waves.length+s.hazards.length,0);assert.ok(s.cars.every(c=>!c.inventoryItem&&Number.isFinite(c.distance)));s.reset();assert.equal(s.results.length,0);assert.ok(s.cars.every(c=>c.inventoryPhase==='empty'));s.dispose();}
console.log(JSON.stringify({workingItems:outcomes,shieldCounters:5,independentInventories:24,ramps:true,replay:true,limits:RACE_PHYSICS.maxCars}));
