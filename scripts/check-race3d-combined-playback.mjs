import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack as downhill} from '../public/games/games/race3d-track.js';
import {createRaceTrack as alpine} from '../public/games/games/race3d-alpine-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const STEP=1/60;
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const players=Array.from({length:4},(_,i)=>({id:'playback-'+i,name:'Racer '+i,...getRacerIdentity(RACE_ROSTER_TYPES[i*3])}));
function run(track,hz,rate){
 const sim=createRaceSimulation({players,track,random:seeded(71319),autoItems:true});
 const hash=createHash('sha256');let events=0,updates=0,frames=0,accumulator=0;
 const drain=()=>{for(const event of sim.drainEvents()){hash.update(JSON.stringify(event)+'\n');events++;}};drain();
 while(!sim.allFinished&&updates<2000/(STEP*5)){
  accumulator+=(1/hz)*rate;frames++;
  while(accumulator>=STEP&&!sim.allFinished){sim.update(STEP*5);updates++;accumulator-=STEP;drain();}
 }
 assert.ok(sim.allFinished,`${hz}Hz/${rate}x failed to finish`);assert.equal(sim.results.length,players.length);
 const result={events,eventHash:hash.digest('hex'),updates,results:sim.results.map(r=>({...r})),cars:sim.cars.map(c=>({id:c.id,distance:c.distance,damage:c.damage,itemsCollected:c.itemsCollected,itemsUsed:c.itemsUsed,replacements:c.replacements}))};
 sim.dispose();return {result,frames,wallSeconds:frames/hz};
}
const outcomes=[];
for(const [course,create] of [['downhill',downhill],['alpine',alpine]]){
 const track=create(THREE);track.raceDistance=track.totalLength;
 const reference=run(track,60,1),cases=[];
 for(const [hz,rate] of [[30,1],[30,2],[60,2]]){const candidate=run(track,hz,rate);assert.deepEqual(candidate.result,reference.result,`${course} ${hz}Hz/${rate}x events, results and final state`);if(rate===2)assert.ok(Math.abs(candidate.wallSeconds-reference.wallSeconds/2)<.05);cases.push({hz,rate,wallSeconds:candidate.wallSeconds});}
 outcomes.push({course,finishers:reference.result.results.length,events:reference.result.events,eventHash:reference.result.eventHash,updates:reference.result.updates,referenceWallSeconds:reference.wallSeconds,cases});track.dispose();
}
console.log(JSON.stringify({physicsDelta:STEP*5,step:STEP,autoItems:true,seed:71319,outcomes}));
