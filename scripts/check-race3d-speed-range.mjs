import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack as downhill} from '../public/games/games/race3d-track.js';
import {createRaceTrack as alpine} from '../public/games/games/race3d-alpine-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
import {FIXED_CLOCK_EPSILON,raceFrameSeconds,visualFrameSeconds,forEachVisualStep} from '../public/games/games/race3d-clock.js';
const STEP=1/60,SIMULATION_RATE=5;
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const players=Array.from({length:4},(_,i)=>({id:'playback-'+i,name:'Racer '+i,...getRacerIdentity(RACE_ROSTER_TYPES[i*3])}));
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,`${message}: ${a} versus ${b}`);
function run(sim,hz,rate,{hitches=false}={}){
 const hash=createHash('sha256');let events=0,updates=0,frames=0,accumulator=0,visual=0,admittedSeconds=0,rawSeconds=0,maxPhysicsTicks=0,maxVisualSteps=0;
 const drain=()=>{for(const event of sim.drainEvents()){hash.update(JSON.stringify(event)+'\n');events++;}};drain();
 while(!sim.allFinished&&updates<2000/(STEP*SIMULATION_RATE)){
  // Mirror the production100ms admission cap. Every admitted millisecond must
  // reach both clocks, even when a raw250ms hitch was capped before scaling.
  const rawDelta=hitches&&frames%37===0?.25:1/hz,dt=Math.min(.1,rawDelta);
  rawSeconds+=rawDelta;admittedSeconds+=dt;frames++;
  const visualBudget=visualFrameSeconds(dt,'running',rate);
  accumulator+=raceFrameSeconds(dt,'running',rate);let tickCount=0;
  while(accumulator+FIXED_CLOCK_EPSILON>=STEP&&!sim.allFinished){
   sim.update(STEP*SIMULATION_RATE);updates++;tickCount++;accumulator=Math.max(0,accumulator-STEP);drain();
  }
  maxPhysicsTicks=Math.max(maxPhysicsTicks,tickCount);
  let consumed=0;const steps=forEachVisualStep(visualBudget,(delta,fraction)=>{assert.ok(delta<=.05+1e-12);assert.ok(fraction>0);consumed+=delta;});
  maxVisualSteps=Math.max(maxVisualSteps,steps);close(consumed,visualBudget,'complete final-frame visual budget');visual+=consumed;
 }
 assert.ok(sim.allFinished,`${hz}Hz/${rate}x failed to finish`);assert.equal(sim.results.length,players.length);
 close(visual,admittedSeconds*rate,'all admitted scaled cosmetic time');
 close(updates*STEP+accumulator,admittedSeconds*rate,'no admitted simulation time dropped');
 assert.ok(maxPhysicsTicks<=Math.ceil(.1*rate/STEP)+1,'bounded physics work per admitted hitch');
 assert.ok(maxVisualSteps<=Math.ceil(.1*rate/.05)+1,'bounded visual substeps');
 const result={events,eventHash:hash.digest('hex'),updates,results:sim.results.map(r=>({...r})),cars:sim.cars.map(c=>({id:c.id,distance:c.distance,damage:c.damage,itemsCollected:c.itemsCollected,itemsUsed:c.itemsUsed,replacements:c.replacements}))};
 return {result,frames,admittedSeconds,rawSeconds,visual,maxPhysicsTicks,maxVisualSteps};
}
const outcomes=[];
for(const [course,create] of [['downhill',downhill],['alpine',alpine]]){
 const track=create(THREE);track.raceDistance=track.totalLength;
 // Reset normally draws a new race seed. Hold that external seed constant here
 // so reset cleanup can be compared independently of deliberate rerandomization.
 const make=()=>createRaceSimulation({players,track,random:()=>seeded(71319)(),autoItems:true});
 const initial=make(),reference=run(initial,60,1);initial.reset();
 const resetRun=run(initial,60,1);assert.deepEqual(resetRun.result,reference.result,`${course} reset reproduces race state`);initial.dispose();
 const cases=[];
 for(const rate of [1,2,3,4,5])for(const hz of [30,60,120]){
  const sim=make(),candidate=run(sim,hz,rate);sim.dispose();
  assert.deepEqual(candidate.result,reference.result,`${course} ${hz}Hz/${rate}x exact events/results/final state`);
  assert.ok(Math.abs(candidate.admittedSeconds-reference.admittedSeconds/rate)<=1/hz+1/60,'wall duration reflects selected speed');
  cases.push({hz,rate,admittedSeconds:candidate.admittedSeconds,maxPhysicsTicks:candidate.maxPhysicsTicks,maxVisualSteps:candidate.maxVisualSteps});
 }
 for(const rate of [1,3,5]){
  const sim=make(),candidate=run(sim,60,rate,{hitches:true});sim.dispose();
  assert.deepEqual(candidate.result,reference.result,`${course} ${rate}x admitted hitch sequence`);
  assert.ok(candidate.rawSeconds>candidate.admittedSeconds,'raw hitch time above100ms intentionally capped');
  cases.push({hz:60,rate,hitches:true,admittedSeconds:candidate.admittedSeconds,rawSeconds:candidate.rawSeconds,maxPhysicsTicks:candidate.maxPhysicsTicks,maxVisualSteps:candidate.maxVisualSteps});
 }
 outcomes.push({course,finishers:reference.result.results.length,events:reference.result.events,eventHash:reference.result.eventHash,updates:reference.result.updates,reset:true,cases});
 console.log(JSON.stringify(outcomes.at(-1)));track.dispose();
}
const report={physicsDelta:STEP*SIMULATION_RATE,step:STEP,autoItems:true,seed:71319,admissionCapSeconds:.1,limitation:'Raw frame time above100ms is intentionally omitted by the production frame admission cap; no admitted scaled simulation or cosmetic time is additionally dropped.',outcomes};
writeFileSync(new URL('../qa-playback-1to5.json',import.meta.url),JSON.stringify(report,null,2));
console.log('PASS: all1–5x at30/60/120Hz on both actual courses; exact fixed-update event streams/results, complete admitted visual time, capped hitches and deterministic reset');
