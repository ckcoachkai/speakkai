import assert from 'node:assert/strict';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {RACE_ROSTER_TYPES,getRacerIdentity} from '../public/games/games/race3d-roster.js';
import {itemDecision} from '../public/games/games/race3d-strategy.js';
const track={totalLength:4000,raceDistance:2000,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5})};
function run(type,carType,mode,seed=.413,defenderPower=null){
 const sim=createRaceSimulation({players:['owner','target','chaser'].map(id=>({id,name:id,...getRacerIdentity(carType)})),track,random:()=>seed,autoItems:false});sim.ramps.length=sim.pickups.length=0;
 const by=id=>sim.cars.find(c=>c.id===id),target=by('target');sim.awardItem('owner',type);if(defenderPower)sim.awardItem('target',defenderPower);for(let n=0;n<542;n++)sim.update(1/120);
 for(const c of sim.cars)Object.assign(c,{distance:c.id==='owner'?(type==='banana'?170:100):c.id==='target'?155:80,previousProgress:c.id==='owner'?(type==='banana'?170:100):c.id==='target'?155:80,lateral:c.id==='chaser'?3.1:0,preferredLane:c.id==='chaser'?3.1:0,speed:35,topSpeed:38,maxSpeed:38,lateralVelocity:0,heading:0,spin:0,damage:0,_hitImmune:0,_nextDecision:Infinity,_nextMistake:Infinity,_pace:1,_brakeTiming:1});
 if(mode==='shield')target.shieldRemaining=60;
 if(defenderPower)assert.ok(sim.useHeldItem('target'));
 if(mode==='air-miss')for(const c of sim.cars){if(c.id!=='owner')Object.assign(c,{flightKind:'launch',flightDuration:6,flightRemaining:6});}
 if(mode!=='baseline'){assert.ok(sim.useHeldItem('owner'));assert.equal(by('owner').inventoryItem,null);assert.equal(sim.useHeldItem('owner'),false);}
 // An already landed banana fixture isolates its impact from the separately
 // tested rear-drop/arming arc; no production path or hit API is bypassed.
 if(type==='banana'&&mode!=='baseline')Object.assign(sim.hazards[0],{distance:163,previousDistance:163,lateral:0,height:.18,verticalVelocity:0,speed:0,age:2,armed:true,phase:'landed'});
 const start=sim.time,timeline=[];let hit=null,blocks=0;
 for(let n=0;n<22000&&!sim.allFinished;n++){sim.update(1/120);for(const e of sim.drainEvents()){if(e.carId==='target'&&e.type===type+'-hit')hit??={...e,elapsed:e.time-start};if(e.carId==='target'&&e.type==='shield-block')blocks++;}if(target.attackSlowRemaining>0)assert.ok(target.speed<=target.attackSpeedCap+.01,'boost cannot bypass disruption');if(n%30===0)timeline.push({t:sim.time-start,d:target.distance,rank:1+sim.cars.filter(c=>c.distance>target.distance).length,speed:target.speed});}
 const result={hit,blocks,finishTime:target.finishTime,allFinished:sim.allFinished,recovered:target.attackSlowRemaining===0&&target.freezeRemaining===0,timeline};sim.reset();assert.ok(sim.cars.every(c=>!c.attackSlowRemaining&&!c.inventoryItem));sim.dispose();return result;
}
const outcomes=[];
for(const carType of RACE_ROSTER_TYPES)for(const type of ['banana','bomb','missile','shockwave','freeze']){
 const base=run(type,carType,'baseline'),hit=run(type,carType,'hit'),shield=run(type,carType,'shield'),miss=run(type,carType,'air-miss');
 assert.ok(hit.hit,carType+'/'+type+' must physically hit');assert.ok(hit.allFinished&&base.allFinished&&shield.allFinished&&miss.allFinished);assert.ok(hit.recovered);assert.equal(shield.hit,null);assert.ok(shield.blocks>0);assert.equal(miss.hit,null,'airborne miss');
 const t=hit.hit.elapsed+8,a=base.timeline.find(x=>x.t>=t)||base.timeline.at(-1),b=hit.timeline.find(x=>x.t>=t)||hit.timeline.at(-1);
 const row={carType,type,speedLoss:hit.hit.beforeSpeed-hit.hit.afterSpeed,timeLost:hit.finishTime-base.finishTime,metresLostAt8s:a.d-b.d,placeChangeAt8s:b.rank-a.rank,penaltySeconds:hit.hit.duration};
 assert.ok(row.speedLoss>5,JSON.stringify(row));assert.ok(row.timeLost>.7,JSON.stringify(row));assert.ok(row.metresLostAt8s>15,JSON.stringify(row));outcomes.push(row);
}
assert.ok(outcomes.some(x=>x.placeChangeAt8s>0),'an impact can change race position');
const severities=[.13,.54,.87].map(seed=>run('bomb','gt3','hit',seed).hit.duration);assert.equal(new Set(severities).size,3,'seeded impacts vary');
for(const carType of RACE_ROSTER_TYPES)for(const power of ['boost','rocket']){const r=run('bomb',carType,'hit',.413,power);assert.ok(r.hit&&r.allFinished&&r.recovered);}
assert.equal(itemDecision({id:'a',distance:0,speed:30,brake:0,inventoryItem:'boost',attackSlowRemaining:2},[]).use,false);
console.log(JSON.stringify({pairedCases:outcomes.length,shieldAndAirMissCases:outcomes.length*2,boostedDefenders:10,seededImpactDurations:severities,eventualFinish:true,resetCleanup:true,noGuaranteedRankChange:true,outcomes}));


