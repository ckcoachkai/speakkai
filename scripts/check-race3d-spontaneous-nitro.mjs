import assert from 'node:assert/strict';
import { createRaceSimulation } from '../public/games/games/race3d-physics.js';
import { RACE_ROSTER_TYPES, getRacerIdentity } from '../public/games/games/race3d-roster.js';
const track = { totalLength: 4000, raceDistance: 1e7, width: 80, hazards: [], sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:80}) };
const players = RACE_ROSTER_TYPES.map((type,i)=>({ id:'car-'+i, name:type, ...getRacerIdentity(type) }));
function make(p=players) { const s=createRaceSimulation({players:p,track,random:()=>.37,autoItems:false});s.pickups.length=0;s.ramps.length=0;return s; }
function tick(s,t,cb=()=>{}) { for(let i=0;i<Math.round(t*120);i++){ s.update(1/120); cb(s); } }
const a=make(), initial=Object.fromEntries(a.cars.map(c=>[c.id,c.spontaneousNitroCooldown]));
const b=make([...players].reverse());
assert.deepEqual(Object.fromEntries(b.cars.map(c=>[c.id,c.spontaneousNitroCooldown])),initial,'roster ordering does not change a car timer');
b.dispose();
const starts=Object.fromEntries(players.map(p=>[p.id,[]])), thrustByCar=Object.fromEntries(players.map(p=>[p.id,0])), ends=[]; let thrustSteps=0;
tick(a,140,()=>{for(const c of a.cars){assert.ok(Number.isFinite(c.speed+c.spontaneousNitroAcceleration));if(c.spontaneousNitroAcceleration>0){thrustSteps++;thrustByCar[c.id]++;assert.equal(c.brake,0);assert.equal(c.spin,0);assert.ok(!(c.itemEffects?.emp>0));assert.equal(c.nitroAcceleration,0);assert.ok(c.spontaneousNitroAcceleration<=4.5);}}for(const e of a.drainEvents()){if(e.type==='spontaneous-nitro-start')starts[e.carId].push(e);if(e.type==='spontaneous-nitro-end')ends.push(e);}});
for(const [id,events] of Object.entries(starts)) {assert.ok(events.length>=2,`${id} has multiple bursts: ${events.length}`);assert.ok(thrustByCar[id]>0,`${id} receives actual thrust`);for(const e of events)assert.ok(e.duration>=.5&&e.duration<.9);for(let i=1;i<events.length;i++)assert.ok(events[i].time-events[i-1].time>=6, 'bounded cooldown');}
assert.ok(thrustSteps>0);a.reset();assert.deepEqual(Object.fromEntries(a.cars.map(c=>[c.id,c.spontaneousNitroCooldown])),initial);assert.ok(a.cars.every(c=>c.spontaneousNitroRemaining===0&&c.spontaneousNitroAcceleration===0));a.dispose();
// The same seed yields identical per-car events with reversed input ordering.
const ordered=make(), reversed=make([...players].reverse()), logs=[[],[]];
for(let i=0;i<30*120;i++) for(const [index,sim] of [ordered,reversed].entries()) {sim.update(1/120);logs[index].push(...sim.drainEvents().filter(e=>e.type.startsWith('spontaneous-nitro-')).map(({type,time,carId,duration,reason})=>({type,time,carId,duration,reason})));}
assert.deepEqual(logs[0],logs[1]);ordered.dispose();reversed.dispose();
// A real force produces a measurable additional speed change from equal states.
const fast=make([players[0]]), control=make([players[0]]);for(const s of [fast,control]){const c=s.cars[0];Object.assign(c,{speed:20,distance:100,previousProgress:100,lateral:0,preferredLane:0,_nextMistake:Infinity,_controlClock:1,_controlThrottle:0,_controlBrake:0});}fast.cars[0].spontaneousNitroCooldown=0;control.cars[0].spontaneousNitroCooldown=Infinity;tick(fast,1/120);tick(control,1/120);assert.ok(fast.cars[0].spontaneousNitroAcceleration>0);assert.ok(fast.cars[0].speed>control.cars[0].speed+.01);fast.dispose();control.dispose();
// Unsafe states cannot start or continue thrust. Post-finish state is cleared.
for(const block of ['emp','spin','brake','item','flight','finish','eliminated']){
 const s=make([players[0]]),c=s.cars[0];Object.assign(c,{speed:20,_nextMistake:Infinity,_controlClock:1,_controlThrottle:0,_controlBrake:0,spontaneousNitroCooldown:0});
 if(block==='emp')c.itemEffects.emp=3;if(block==='spin')c.spin=2;if(block==='brake')c._controlBrake=1;if(block==='item')c.nitro.remaining=4;if(block==='flight'){c.flightRemaining=2;c.flightKind='launch';}if(block==='finish')c.finished=true;if(block==='eliminated'){c.finished=true;c.eliminated=true;}
 tick(s,1/120);assert.equal(c.spontaneousNitroAcceleration,0,block);assert.equal(c.spontaneousNitroRemaining,0,block);s.dispose();
}
const s=make([players[0]]),c=s.cars[0];Object.assign(c,{speed:20,_nextMistake:Infinity,_controlClock:1,_controlThrottle:0,_controlBrake:0,spontaneousNitroCooldown:0});tick(s,1/120);assert.ok(c.spontaneousNitroRemaining>0);c.itemEffects.emp=2;tick(s,1/120);assert.equal(c.spontaneousNitroRemaining,0);assert.equal(c.spontaneousNitroAcceleration,0);assert.ok(s.drainEvents().some(e=>e.type==='spontaneous-nitro-end'&&e.reason==='interrupted'));s.dispose();
console.log(JSON.stringify({roster:players.length,burstCounts:Object.fromEntries(Object.entries(starts).map(([k,v])=>[k,v.length])),thrustSteps,ended:ends.length,deterministicResetAndOrder:true,actualSpeedGain:true,safety:true}));
