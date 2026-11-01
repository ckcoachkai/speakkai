import assert from 'node:assert/strict';
import {createRaceSimulation, raceElectricDrive} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity} from '../public/games/games/race3d-roster.js';

const track={totalLength:4000,raceDistance:1800,width:40,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:40})};
const players=['lead','back'].map(id=>({id,...getRacerIdentity('gt3')}));
function make(catchup=true, seed=.314) {
  const s=createRaceSimulation({players,track,random:()=>seed,autoItems:false,driverMode:'equal',catchup});
  s.ramps.length=s.pickups.length=0;
  for(const c of s.cars) Object.assign(c,{distance:c.id==='lead'?700:400,previousProgress:c.id==='lead'?700:400,lateral:c.id==='lead'?-6:6,preferredLane:c.id==='lead'?-6:6,speed:32,_nextDecision:Infinity,_nextMistake:Infinity});
  return s;
}
const on=make(),off=make(false),reordered=make(); reordered.cars.reverse();
let maxStep=0;
for(let n=0;n<1200;n++) for(const sim of [on,off,reordered]) {
  const before=new Map(sim.cars.map(c=>[c.id,c.distance])); sim.update(1/120);
  for(const c of sim.cars) { maxStep=Math.max(maxStep,c.distance-before.get(c.id)); assert.ok(Number.isFinite(c.distance)&&Number.isFinite(c.batteryEnergyJ)); }
}
const get=(s,id)=>s.cars.find(c=>c.id===id), gap=s=>get(s,'lead').distance-get(s,'back').distance;
const gapWithCatchup=gap(on),gapWithoutCatchup=gap(off);
assert.ok(gapWithCatchup<gapWithoutCatchup,`catch-up should close the gap: ${gapWithCatchup} vs ${gapWithoutCatchup}`);
assert.ok(get(on,'lead').raceCatchup.leaderPenalty>0);
assert.equal(get(off,'back').raceCatchup.targetMultiplier,1);
assert.deepEqual(on.cars.map(c=>[c.id,c.distance]).sort(),reordered.cars.map(c=>[c.id,c.distance]).sort());
assert.ok(maxStep<1,'no position teleport');
const frozen=get(on,'back'); Object.assign(frozen,{attackSlowRemaining:3,attackSpeedCap:12,speed:12}); frozen.itemEffects.overdrive=3; on.update(1/120);
assert.ok(frozen.speed<=12.01,'disruption speed cap remains binding with overdrive');
for(const s of [on,off,reordered])s.dispose();
const radius=40, circle={...track,totalLength:2*Math.PI*radius,sampleTrack:d=>{const a=d/radius;return {position:{x:radius*Math.cos(a),y:0,z:radius*Math.sin(a)},tangent:{x:-Math.sin(a),y:0,z:Math.cos(a)},right:{x:-Math.cos(a),y:0,z:-Math.sin(a)},width:40};}};
const bend=createRaceSimulation({players,track:circle,random:()=>.314,autoItems:false,driverMode:'equal'});bend.ramps.length=bend.pickups.length=0;
for(const c of bend.cars)Object.assign(c,{distance:c.id==='lead'?700:400,previousProgress:c.id==='lead'?700:400,lateral:c.id==='lead'?-6:6,speed:20,_nextDecision:Infinity,_nextMistake:Infinity});
get(bend,'back').itemEffects.overdrive=10;
for(let i=0;i<360;i++)bend.update(1/120);
assert.ok(get(bend,'back').targetSpeed<35,'catch-up and overdrive cannot bypass corner braking');bend.dispose();
const spec=players[0].vehicleSpec;
const drive=mult=>raceElectricDrive({vehicleSpec:spec,speed:25,throttle:1,longitudinalAccel:100,raceDriveMultiplier:mult});
assert.ok(drive(1.4).driveN>drive(1).driveN,'vehicle-spec motor responds to race multiplier');
assert.ok(raceElectricDrive({vehicleSpec:spec,speed:25,throttle:1,longitudinalAccel:1,raceDriveMultiplier:2}).driveN<=spec.massKg+1e-6,'traction remains binding');
assert.equal(raceElectricDrive({vehicleSpec:spec,speed:25,brake:1,longitudinalAccel:10,raceDriveMultiplier:1.08}).brakeN,raceElectricDrive({vehicleSpec:spec,speed:25,brake:1,longitudinalAccel:10}).brakeN,'overdrive does not scale brakes');

const found=new Map();
for(let i=0;i<500&&found.size<9;i++){
  const s=createRaceSimulation({players:[players[0]],track,random:()=>i/500,autoItems:false,catchup:false});
  found.set(s.cars[0].driverSkills.tier,i/500); s.dispose();
}
assert.equal(found.size,9,'random selection reaches all tiers');
const times=[];
for(const [tier,seed] of found){
  const s=createRaceSimulation({players:[players[0]],track:{...track,raceDistance:500},random:()=>seed,autoItems:false,catchup:false});
  s.ramps.length=s.pickups.length=0;
  for(let n=0;n<2400&&!s.allFinished;n++)s.update(.25);
  assert.ok(s.allFinished,`tier ${tier} must finish`);
  times.push([tier,s.cars[0].finishTime]);s.dispose();
}
console.log(JSON.stringify({gapWithCatchup,gapWithoutCatchup,maxStep,allTierFinishTimes:times}));
