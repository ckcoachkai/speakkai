import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {createRaceCars} from '../public/games/games/race3d-cars.js';
import {createFinishFX,advanceFinishVisual,audioPeakCurve} from '../public/games/games/race3d-finish-fx.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const track={totalLength:4000,raceDistance:100,width:16.5,hazards:[],sampleTrack:d=>({position:new THREE.Vector3(0,0,d),tangent:new THREE.Vector3(0,0,1),right:new THREE.Vector3(1,0,0),bank:0,width:16.5})};
const curve=audioPeakCurve();assert.ok([...curve].every(v=>Math.abs(v)<.9));assert.ok(Math.abs(curve[2048])<1e-8);assert.ok(Math.abs(curve[3072]-.5)<.001);
for(const reduced of [false,true]){const racer=Object.freeze({id:'a',distance:100,lateral:0,speed:30,finished:true,finishTime:4,finishPosition:1});let state=null,bursts=0,spinSeen=false;for(let i=0;i<500;i++){const f=advanceFinishVisual(state,racer,1/120,reduced);state=f.state;bursts+=Number(f.burst);spinSeen||=Math.abs(f.pose.spinAngle)>.1;if(i===499){assert.ok(f.hidden);assert.equal(f.stage,'cleared');}}assert.equal(bursts,1);assert.equal(spinSeen,!reduced);assert.equal(racer.distance,100);}
const summaries=[];
for(const [count,quality,reducedMotion]of [[24,'high',false],[60,'low',false],[24,'low',true]]){
 const s=createRaceSimulation({players:Array.from({length:count},(_,i)=>({id:'f'+i,name:'Finisher '+i,...getRacerIdentity(RACE_ROSTER_TYPES[i%5])})),track,random:()=>.61,autoItems:false});s.pickups.length=0;s.ramps.length=0;
 for(const [i,c]of s.cars.entries())Object.assign(c,{distance:99.9-i*.0001,previousProgress:99.9-i*.0001,lateral:(i%2?1:-1)*5.7,speed:35,_nextMistake:Infinity});
 const models=createRaceCars(THREE,s.cars,{id:quality,authoredModels:false,reducedMotion}),recordsBefore=new Map();let sounds=0;
 for(let i=0;i<600;i++){
  s.update(1/120);for(const r of s.results)if(!recordsBefore.has(r.id))recordsBefore.set(r.id,JSON.stringify(r));
  models.update(track,1/120,{focusedId:s.cars[0].id,lodDistance:1000,detailedCars:60});sounds+=models.drainFinishEvents().length;
 }
 assert.ok(s.allFinished);assert.equal(s.results.length,count);assert.equal(sounds,count);assert.ok(models.finishSnapshot().complete);assert.equal(models.finishSnapshot().alive,0);assert.equal(models.finishSnapshot().hidden,count);assert.ok(models.snapshot().every(c=>c.finishHidden&&c.finishStage==='cleared'));
 for(const r of s.results)assert.equal(JSON.stringify(r),recordsBefore.get(r.id));
 assert.ok(models.finishSnapshot().peak<=models.finishSnapshot().capacity);summaries.push({count,quality,bursts:sounds,capacity:models.finishSnapshot().capacity,peak:models.finishSnapshot().peak});
 models.reset();assert.equal(models.finishSnapshot().seen,0);assert.equal(models.finishSnapshot().alive,0);models.dispose();s.dispose();
}
for(const quality of ['low','high'])for(const reducedMotion of [false,true]){
 const fx=createFinishFX(THREE,{quality,reducedMotion}),events=Array.from({length:60},(_,i)=>({carId:i,gridPosition:i,x:0,y:1,z:0}));
 assert.equal(fx.emit(events).length,60);assert.equal(fx.emit(events).length,0);fx.update(.01);assert.ok(fx.snapshot().alive<=fx.snapshot().capacity);
 for(let i=0;i<400;i++)fx.update(1/120);assert.equal(fx.snapshot().alive,0);fx.reset();assert.equal(fx.snapshot().bursts,0);fx.dispose();assert.equal(fx.emit(events).length,0);assert.equal(fx.group.children.length,0);
}
console.log(JSON.stringify({immutableFinishOrder:true,exactlyOnce:true,stress:summaries,reducedMotion:true,poolsExpire:true,resetDisposes:true,peakCurveMax:Math.max(...curve)}));
