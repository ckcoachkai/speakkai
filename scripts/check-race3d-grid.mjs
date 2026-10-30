import assert from 'node:assert/strict';
import {createRaceGrid} from '../public/games/games/race3d-grid.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
const people=n=>Array.from({length:n},(_,i)=>({id:'student-'+i,name:'Student '+i}));
for(const n of [0,11,20])assert.throws(()=>createRaceGrid(people(n)),/1–10/);
for(const n of [1,9,10]){const grid=createRaceGrid(people(n));assert.equal(grid.length,10);assert.equal(grid.filter(p=>p.isBot).length,10-n);assert.deepEqual(grid.filter(p=>!p.isBot).map(p=>p.id),people(n).map(p=>p.id));assert.equal(new Set(grid.map(p=>p.id)).size,10);}
assert.throws(()=>createRaceGrid([{id:'same'},{id:'same'}]),/unique/);
assert.equal(new Set(createRaceGrid([{id:'race-bot-1'}]).map(p=>p.id)).size,10);
const track={totalLength:4000,raceDistance:4000,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5})};
const runs=[];
for(const count of [1,9,10]){const s=createRaceSimulation({players:createRaceGrid(people(count)),track,random:()=>.41});const human=s.cars.find(c=>!c.isBot),bots=s.cars.filter(c=>c.isBot);for(const bot of bots){assert.ok(bot.topSpeed<human.topSpeed);assert.ok(bot.durabilityFactor<human.durabilityFactor);}let explosions=0;for(let t=0;t<700&&!s.allFinished;t+=.25){s.update(.25);explosions+=s.drainEvents().filter(e=>e.type==='bot-explode').length;assert.ok(s.cars.every(c=>!c.eliminated||c.isBot));}assert.ok(s.allFinished);assert.ok(s.cars.find(c=>c.id===s.winner&&!c.isBot));assert.equal(s.results.length+s.cars.filter(c=>c.eliminated).length,10);assert.ok(s.cars.every(c=>!c.inventoryItem&&!c.inventoryReserves.length));assert.ok(count!==1||explosions>0);runs.push({students:count,bots:bots.length,explosions,finishers:s.results.length,time:s.time});s.reset();assert.ok(s.cars.every(c=>!c.eliminated&&!c.finished&&c.inventoryReserves.length===0));s.dispose();}
// A bot can cross first without becoming the classroom's selected speaker.
{const s=createRaceSimulation({players:createRaceGrid(people(1)),track,random:()=>.41,autoItems:false});s.pickups.length=0;s.ramps.length=0;const bot=s.cars.find(c=>c.isBot),student=s.cars.find(c=>!c.isBot);Object.assign(bot,{distance:3999.9,previousProgress:3999.9,speed:25,damage:0});s.update(.1);assert.equal(bot.finished,true);assert.equal(s.winner,null);for(const c of s.cars.filter(c=>c.isBot&&!c.finished))c.damage=1;s.update(.05);Object.assign(student,{distance:3999.9,previousProgress:3999.9,speed:25});s.update(.1);assert.equal(s.winner,student.id);assert.ok(s.allFinished);assert.equal(s.results[0].id,bot.id);s.dispose();}
console.log(JSON.stringify({gridSize:10,zeroAndOverLimitExplicit:true,noSilentExclusion:true,firstSpeakerAlwaysStudent:true,runs}));
