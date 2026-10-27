import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack} from '../public/games/games/race3d-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {ALL_ITEM_IDS,ITEM_REGISTRY,DRAW_ITEM_IDS} from '../public/games/games/race3d-item-registry.js';
import {IMPLEMENTED_EXTRA_IDS} from '../public/games/games/race3d-extra-items.js';
import {EXTRA_ICON_PATHS} from '../public/games/games/race3d-item-icons.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
import {inventoryFace} from '../public/games/games/race3d-item-rules.js';
assert.equal(ALL_ITEM_IDS.length,50);assert.equal(new Set(ALL_ITEM_IDS).size,50);assert.equal(DRAW_ITEM_IDS.length,50);assert.equal(IMPLEMENTED_EXTRA_IDS.length,40);
for(const id of ALL_ITEM_IDS.slice(10)){assert.ok(EXTRA_ICON_PATHS[id]);assert.ok(IMPLEMENTED_EXTRA_IDS.includes(id));assert.ok(ITEM_REGISTRY[id].mechanic.length>15);}
const track=createRaceTrack(THREE);track.raceDistance=track.totalLength;
const runs=[];
function run(seed,chunk=.25,offset=0){
 let state=seed>>>0;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
 const s=createRaceSimulation({players:Array.from({length:24},(_,i)=>({id:'generic-'+i,name:'Generic '+i,...getRacerIdentity(RACE_ROSTER_TYPES[(i+offset)%RACE_ROSTER_TYPES.length])})),track,random});
 assert.equal(new Set(s.cars.map(c=>c.racerType)).size,Math.min(s.cars.length,RACE_ROSTER_TYPES.length),'all available roster types participate');
 const gateRows=new Set(s.pickups.map(p=>p.distance));assert.equal(gateRows.size,10);assert.ok([...gateRows].every(d=>d>=0&&d<track.totalLength));
 const used=new Set(),drawn=new Set();let peak=0,takeoffs=0,landings=0;
 for(let t=0;t<600&&!s.allFinished;t+=chunk){s.update(chunk);for(const c of s.cars){if(c.inventoryItem)drawn.add(c.inventoryItem);assert.ok(Number.isFinite(c.distance+c.speed+c.lateral+c.flightHeight));assert.equal(inventoryFace(c,s.time),c.finished?null:c.inventoryPhase==='ready'?c.inventoryItem:inventoryFace(c,s.time));}for(const e of s.drainEvents()){if(e.type==='item-use')used.add(e.itemType);if(e.type==='ramp-takeoff')takeoffs++;if(e.type==='ramp-land')landings++;}peak=Math.max(peak,s.effectActors.patches.length+s.effectActors.shots.length+s.effectActors.links.length);assert.ok(peak<=96);}
 assert.ok(s.allFinished,'all racers eventually finish without timeout placement');assert.equal(s.results.length,24);assert.equal(new Set(s.results.map(c=>c.id)).size,24);assert.ok(s.cars.every(c=>!c.inventoryItem&&Object.values(c.itemEffects||{}).every(x=>x===0)));assert.equal(s.effectActors.patches.length+s.effectActors.shots.length+s.effectActors.links.length,0);assert.ok(takeoffs>0&&landings>0);
 const result=s.results.map(r=>({id:r.id,time:r.time??r.finishTime,position:r.position}));const summary={seed,chunk,winner:result[0].id,winnerType:s.cars.find(c=>c.id===result[0].id).racerType,drawn:[...drawn].sort(),used:[...used].sort(),peak,takeoffs,landings,lastTime:s.time,result};
 s.reset();assert.ok(s.cars.every(c=>!c.inventoryItem&&!c.itemCharge));assert.equal(s.effectActors.patches.length+s.effectActors.shots.length+s.effectActors.links.length,0);s.dispose();return summary;
}
for(const [i,seed] of [89173,43119,203807].entries()){const r=run(seed,.25,i);runs.push(r);console.log(JSON.stringify({...r,result:undefined,stage:'complete'}));}
const replay=run(89173,1/60);assert.deepEqual(replay.result,runs[0].result,'same seed remains identical across frame chunking / visual quality pacing');assert.deepEqual(replay.used,runs[0].used);track.dispose();
console.log(JSON.stringify({registry:50,workingExtraHandlers:40,uniqueOriginalIcons:40,races:runs.length,replay:true,qualityIndependentSimulation:true,allFinish:true,drawn:new Set(runs.flatMap(r=>r.drawn)).size,used:new Set(runs.flatMap(r=>r.used)).size,peakActors:Math.max(...runs.map(r=>r.peak)),statisticalLimit:'Three course races plus one replay are regressions, not proof of balance.'}));
