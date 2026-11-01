import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack} from '../public/games/games/race3d-alpine-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const track=createRaceTrack(THREE);let min=Infinity,max=-Infinity,grade=0,minClearance=Infinity;
for(let d=0;d<track.totalLength;d++){const s=track.sampleTrack(d);min=Math.min(min,s.position.y);max=Math.max(max,s.position.y);grade=Math.max(grade,Math.abs(s.tangent.y));minClearance=Math.min(minClearance,s.position.y-track.terrainHeight(s.position.x,s.position.z));assert.ok(Math.abs(s.tangent.length()-1)<1e-6);assert.ok(Math.abs(s.bank)<.15);}
assert.ok(max-min>45);assert.ok(grade<.08,`grade ${grade}`);assert.ok(minClearance>1,`clearance ${minClearance}`);
for(const b of track.waterBasins){
  for(let a=0;a<Math.PI*2;a+=.02)assert.ok(track.terrainHeight(b.x+Math.cos(a)*b.radiusX,b.z+Math.sin(a)*b.radiusZ)>b.y+.5,"raised shoreline");
  for(let d=0;d<track.totalLength;d++){const p=track.sampleTrack(d).position;assert.ok(Math.hypot(p.x-b.x,p.z-b.z)>Math.max(b.radiusX,b.radiusZ)+25,'shoreline road clearance');}
  for(let x=b.x-b.radiusX;x<=b.x+b.radiusX;x++)for(let z=b.z-b.radiusZ;z<=b.z+b.radiusZ;z++)if(Math.hypot((x-b.x)/b.radiusX,(z-b.z)/b.radiusZ)<=.72)assert.ok(track.terrainHeight(x,z)<b.y-.5,'visible water above basin');
}
const sim=createRaceSimulation({players:Array.from({length:10},(_,i)=>({id:'mountain-'+i,name:'Racer '+i,...getRacerIdentity(RACE_ROSTER_TYPES[i%RACE_ROSTER_TYPES.length])})),track,random:()=>.61,autoItems:false});
let ticks=0;for(;ticks<60*1800&&!sim.allFinished;ticks++)sim.update(1/60);
assert.ok(sim.allFinished,JSON.stringify(sim.cars.map(c=>({id:c.id,distance:c.distance,speed:c.speed}))));assert.equal(sim.results.length,10);assert.equal(new Set(sim.results.map(c=>c.id)).size,10);
console.log(JSON.stringify({min,max,grade,minClearance,seconds:ticks/60,finishers:sim.results.length}));sim.dispose();track.dispose();


