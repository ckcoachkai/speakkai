import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack} from '../public/games/games/race3d-track.js';
import {createRaceSimulation,raceElectricDrive} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
import {getVehicleSpec} from '../public/games/games/race3d-vehicle-specs.js';
import {createDriverSkills,driverControls} from '../public/games/games/race3d-drivers.js';
import {itemWeights,drawItem,ITEM_TYPES} from '../public/games/games/race3d-item-rules.js';
import {itemDecision} from '../public/games/games/race3d-strategy.js';
const track=createRaceTrack(THREE);track.raceDistance=track.totalLength;
const make=(name='Generic',type='gt3',seed=.314)=>createRaceSimulation({players:[{id:'stable-id',name,...getRacerIdentity(type)}],track,random:()=>seed,autoItems:false});
const a=make('One'),b=make('Renamed'),c=make('Other','tesla-roadster'),d=make('One','gt3',.317);
assert.deepEqual(a.cars[0].driverSkills,b.cars[0].driverSkills);assert.deepEqual(a.cars[0].driverSkills,c.cars[0].driverSkills);assert.notDeepEqual(a.cars[0].driverSkills,d.cars[0].driverSkills);
const before=a.cars[0].driverSkills;a.reset();assert.deepEqual(a.cars[0].driverSkills,before,'same supplied random reproduces race, not a name hash');
for(const s of [a,b,c,d])s.dispose();
const seeded=Array.from({length:80},(_,i)=>createDriverSkills(()=>((i*7919)%65521)/65521));assert.ok(new Set(seeded.map(s=>s.control.toFixed(3))).size>50);
const low={reaction:.4,control:.4,braking:.4,ramp:.4,items:.4,equal:false,label:'QA'},high={reaction:.98,control:.98,braking:.98,ramp:.98,items:.98,equal:false,label:'QA'};
assert.ok(driverControls(high).reactionSeconds<driverControls(low).reactionSeconds);assert.ok(driverControls(high).rampError<driverControls(low).rampError);
const traces=[];
for(const skills of [low,high]){const s=make(),car=s.cars[0];Object.assign(car,{driverSkills:skills,driverControl:driverControls(skills),_nextDecision:0,_nextMistake:5});s.pickups.length=0;const trace=[];for(let t=0;t<240&&!s.allFinished;t+=.25){s.update(.25);if(trace.length<80)trace.push([car.distance,car.lateral,car.brake,car.heading,car._rampAimError]);}assert.ok(s.allFinished,'bounded driver errors recover and finish');traces.push({top:car.topSpeed,trace,time:car.finishTime});s.dispose();}
assert.equal(traces[0].top,traces[1].top,'skills never modify engine speed ceiling');assert.notDeepEqual(traces[0].trace,traces[1].trace,'actual braking, steering and ramp decisions vary');
const attacker={id:'a',distance:0,lateral:0,speed:20,inventoryItem:'freeze',inventoryPhase:'ready',flightRemaining:0},target={id:'b',distance:40,lateral:2.8,speed:20,flightRemaining:0};
const cautious=itemDecision({...attacker,driverControl:driverControls(low)},[target]),confident=itemDecision({...attacker,driverControl:driverControls(high)},[target]);assert.equal(cautious.use,false);assert.equal(confident.use,true);
const lead=itemWeights({position:1,count:24,gap:0}),back=itemWeights({position:24,count:24,gap:300});assert.ok(back[ITEM_TYPES.indexOf('boost')]>lead[ITEM_TYPES.indexOf('boost')]);assert.ok(back.every(w=>w>0));for(const ctx of [{position:1,count:24},{position:24,count:24,gap:300}])assert.equal(new Set(Array.from({length:10000},(_,i)=>drawItem(()=>i/10000,ctx))).size,10,'no item or winner forced');
const top=[],ratios=[];for(const type of RACE_ROSTER_TYPES){const p=getRacerIdentity(type),s=p.vehicleSpec;assert.ok(s.raceCalibration);assert.notEqual(s,getVehicleSpec(type));assert.equal(s.massKg,getVehicleSpec(type).massKg);top.push(s.topSpeedKph);ratios.push(s.powerKW/s.massKg);const drive=raceElectricDrive({speed:0,throttle:1,longitudinalAccel:30,vehicleSpec:s,accelerationFactor:1.3});assert.ok(drive.acceleration<=s.launchAccelMps2+.01);}
assert.ok(Math.max(...top)/Math.min(...top)<1.1);assert.ok(Math.max(...ratios)/Math.min(...ratios)<1.15);
track.dispose();console.log(JSON.stringify({tests:'driver independence/actions/recovery/item confidence/weighted odds/calibration/launch caps',driverTraceFinishTimes:traces.map(t=>t.time),topSpeedKph:top,powerToMassKWperKg:ratios,slots:1}));
