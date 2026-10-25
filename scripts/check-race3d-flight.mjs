import assert from 'node:assert/strict';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {RACE_ROSTER_TYPES,getRacerIdentity} from '../public/games/games/race3d-roster.js';
import {vehicleProfile,planRampApproach} from '../public/games/games/race3d-vehicle.js';
import {launchAttitude} from '../public/games/games/race3d-flight.js';
import {createFrameBudget} from '../public/games/games/race3d-frame-budget.js';
const track={totalLength:4000,raceDistance:12000,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},bank:0,curvature:0,width:16.5})};
const outcomes=[];
for(const type of RACE_ROSTER_TYPES)for(const offset of [-2.3,0,2.3])for(const speed of [25,40,55]){
 const sim=createRaceSimulation({players:[{id:'test',...getRacerIdentity(type)}],track,random:()=>.441,autoItems:false}),car=sim.cars[0],r=sim.ramps[0],p=vehicleProfile(car);
 Object.assign(car,{distance:r.distance-p.front-.4,previousProgress:r.distance-p.front-.4,lateral:r.lateral+offset,preferredLane:r.lateral+offset,speed,lateralVelocity:Math.sign(offset)*5.5,heading:Math.sign(offset)*.05,freezeRemaining:offset?1.5:0,topSpeed:speed,_nextDecision:Infinity,_nextMistake:Infinity});
 let takeoff=null,landing=null,peakRoll=0,pitchAtQuarter=null,minCoverage=1;
 for(let n=0;n<2200&&!landing;n++){sim.update(1/120);if(car.airAttitude){if(Math.abs(car.airRoll)>Math.abs(peakRoll))peakRoll=car.airRoll;if(car.airAttitude.elapsed>=.25&&pitchAtQuarter===null)pitchAtQuarter=car.airAttitude.pitch;}for(const e of sim.drainEvents()){if(e.type==='ramp-takeoff')takeoff={coverage:car.airAttitude.coverage,inertia:car.airAttitude.pitchInertia,rate:car.airAttitude.pitchRate,lipError:e.rearAt-e.lip};if(e.type==='ramp-land')landing=e;}}
 assert.ok(takeoff&&landing,`${type}/${offset}/${speed} launch and land`);assert.ok(Number.isFinite(pitchAtQuarter));
 if(!offset){assert.ok(takeoff.coverage>.99);assert.ok(Math.abs(takeoff.lipError)<.6);}
 const d=car.distance;for(let n=0;n<300;n++)sim.update(1/120);assert.ok(car.distance>d+5,'postlanding progress');assert.ok(car.recoveryRemaining===0&&Number.isFinite(car.lateral));
 outcomes.push({type,offset,speed,coverage:takeoff.coverage,peakRoll,pitchAtQuarter,flips:landing.fullFlips,upright:landing.successful,inertia:takeoff.inertia});sim.dispose();
}
assert.ok(outcomes.some(x=>x.flips>0),'feasible full flips occur');assert.ok(outcomes.some(x=>!x.upright),'imperfect landings occur');
for(const type of RACE_ROSTER_TYPES){const a=outcomes.find(x=>x.type===type&&x.offset<0&&x.speed===40),b=outcomes.find(x=>x.type===type&&x.offset>0&&x.speed===40);assert.ok(a.peakRoll*b.peakRoll<0,'opposite edge torque signs');}
assert.ok(new Set(outcomes.filter(x=>x.offset===0).map(x=>x.pitchAtQuarter.toFixed(3))).size>5,'speed and inertia alter rotation');
{const s=createRaceSimulation({players:[{id:'offroad',...getRacerIdentity('gt3')}],track,random:()=>.2}),c=s.cars[0];Object.assign(c,{distance:100,speed:25,lateral:26,flightKind:'launch',flightRemaining:2,flightDuration:6,lateralVelocity:5});s.update(.1);assert.ok(c.lateral>26,'airborne car is not clamped to lane rails');s.dispose();}
{const c={racerType:'gt3'},a=vehicleProfile(c);assert.equal(a,vehicleProfile(c));c.vehicleGeometry={cg:.8};assert.notEqual(a,vehicleProfile(c));assert.equal(vehicleProfile(c).cg,.8);}
{const b=createFrameBudget();for(let n=0;n<1200;n++)b.sample(33,8);assert.ok(b.snapshot().scale>=.7&&b.snapshot().scale<1);b.reset();for(let n=0;n<1200;n++)b.sample(33,20);assert.equal(b.snapshot().scale,1,'CPU-bound load does not blur pixels');assert.ok(b.snapshot().detail<1);b.reset();assert.equal(b.snapshot().scale,1);}
console.log(JSON.stringify({cases:outcomes.length,mirroredEdgeRoll:true,variedAngularMotion:true,offTrack:true,recovery:true,adaptiveBudgets:true,outcomes}));
