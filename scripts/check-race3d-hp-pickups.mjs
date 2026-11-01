import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {inventoryCount} from '../public/games/games/race3d-item-rules.js';
import {createRaceTrack} from '../public/games/games/race3d-track.js';
import {createRaceTrack as createAlpineTrack} from '../public/games/games/race3d-alpine-track.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const flat=()=>({totalLength:4000,raceDistance:1e7,width:18,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:18})});
const advance=(s,t)=>{for(let n=0;n<t-1e-8;n+=1/120)s.update(Math.min(1/120,t-n));};
const place=(c,d,l=0)=>Object.assign(c,{distance:d,previousProgress:d,lateral:l,preferredLane:l,lateralVelocity:0,speed:25,heading:0,spin:0,flightRemaining:0,flightHeight:0,rampState:'ground',_hitImmune:0,_nextDecision:Infinity,_nextMistake:Infinity});
function make(bot=false){const track=flat(),s=createRaceSimulation({players:[{id:'a',name:'A',isBot:bot},{id:'b',name:'B'}],track,random:()=>.41,autoItems:false});s.pickups.length=s.ramps.length=0;return {s,track,a:s.cars.find(c=>c.id==='a'),b:s.cars.find(c=>c.id==='b')};}
function gate(s,id,d){s.pickups.push({id,gateId:id,distance:d,lateral:0,radius:3,active:true});}
const slots=c=>[c,...c.inventoryReserves].filter(s=>s.inventoryItem).map(s=>({item:s.inventoryItem,serial:s.inventorySerial}));
for(const bot of [false,true])for(const leading of [false,true])for(const held of [0,4,5]){
 const {s,a,b}=make(bot);for(let i=0;i<held;i++)assert.ok(s.awardItem('a','shield'));const before=slots(a);
 place(a,199);place(b,leading?100:300,6);gate(s,'gate',200);advance(s,.02);
 const expected=Math.min(5,held+(leading?1:2));assert.equal(inventoryCount(a),expected,JSON.stringify({bot,leading,held}));assert.deepEqual(slots(a).slice(0,held),before,'held inventory preserved');
 advance(s,.1);assert.equal(inventoryCount(a),expected,'same gate cannot award twice');s.dispose();
}
// Rank is recomputed at each new gate, including a leader who has finished.
{const {s,a,b}=make();place(a,199);place(b,300,6);gate(s,'first',200);advance(s,.02);assert.equal(inventoryCount(a),2);
place(a,399);place(b,300,6);gate(s,'second',400);advance(s,.02);assert.equal(inventoryCount(a),3);
b.finished=true; b.finishTime=s.time;place(a,599);gate(s,'third',600);advance(s,.02);assert.equal(inventoryCount(a),5,'finished leader still occupies first');s.dispose();}
// Physical track incident causes triple the former .08 damage, independently
// scaled by durability. Repair remains a genuine held-item activation.
for(const bot of [false,true]){const {s,track,a,b}=make(bot);b.finished=true;s.awardItem('a','repair');advance(s,4.6);place(a,199);a.damage=0;track.hazards.push({type:'cone',distance:200,lateral:0,radius:2});advance(s,.02);
 const expected=.24/a.durabilityFactor;assert.ok(a.damage>=expected-1e-8&&a.damage<expected+.001,`${bot}: damage ${a.damage} expected ${expected}`);assert.ok(a.hitPoints<85,'condition falls visibly');
 assert.ok(s.useHeldItem('a'),'repair activates');assert.equal(a.damage,0);assert.equal(a.hitPoints,100);assert.equal(a.replacementPending,0);assert.equal(inventoryCount(a),0);s.dispose();}
// Both actual routes with automatic items and current catch-up/driver defaults.
const outcomes=[];
for(const [course,create] of [['downhill',createRaceTrack],['alpine',createAlpineTrack]]){
const track=create(THREE),sim=createRaceSimulation({players:Array.from({length:10},(_,i)=>({id:'mountain-'+i,name:'Racer '+i,...getRacerIdentity(RACE_ROSTER_TYPES[i%RACE_ROSTER_TYPES.length])})),track,random:()=>.61,autoItems:true});
let ticks=0;for(;ticks<60*2400&&!sim.allFinished;ticks++){sim.update(1/60);for(const c of sim.cars){assert.ok(inventoryCount(c)<=5);assert.ok(Number.isFinite(c.distance));}}
assert.ok(sim.allFinished,JSON.stringify(sim.cars.map(c=>({id:c.id,distance:c.distance,speed:c.speed,damage:c.damage}))));assert.equal(sim.results.length,10);assert.equal(new Set(sim.results.map(c=>c.id)).size,10);
outcomes.push({course,closed:track.closed!==false,finishDistance:sim.finishDistance,finishers:10,seconds:ticks/60,itemsCollected:sim.cars.reduce((n,c)=>n+c.itemsCollected,0),replacements:sim.cars.reduce((n,c)=>n+c.replacements,0)});sim.dispose();track.dispose();
}
console.log(JSON.stringify({pickupCases:12,rankChanges:true,finishedLeader:true,noOverwrite:true,cap:5,incidentMultiplier:3,repair:true,autoItems:true,outcomes}));
