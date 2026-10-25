import assert from 'node:assert/strict';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const track={totalLength:4000,raceDistance:1e7,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5,bank:0})};
const advance=(s,t,observe=()=>{})=>{for(let n=0;n<t-1e-8;n+=1/120){s.update(1/120);observe(s.cars[0]);}};
function ready(type,item){const s=createRaceSimulation({players:[{id:'test',name:'Generic test',...getRacerIdentity(type)}],track,random:()=>.37,autoItems:false});s.pickups.length=s.ramps.length=0;const c=s.cars[0];c._nextMistake=c._nextDecision=Infinity;assert.ok(s.awardItem(c.id,item));advance(s,4.51);Object.assign(c,{distance:100,previousProgress:100,lateral:0,preferredLane:0,heading:0,speed:30});assert.ok(s.useHeldItem(c.id));assert.equal(c.inventoryItem,null);return {s,c};}
const samples=[];
for(const type of RACE_ROSTER_TYPES){
 const {s,c}=ready(type,'launch');let peak=0,flight=0;const vy=c.verticalVelocity;assert.ok(c.launchBlastRemaining>0);advance(s,8,c=>{peak=Math.max(peak,c.flightHeight);if(c.flightRemaining>0)flight+=1/120;assert.ok(Number.isFinite(c.flightHeight+c.speed+c.verticalVelocity));});assert.ok(peak>8&&peak<27);assert.ok(flight<5);assert.equal(c.flightRemaining,0);assert.equal(c.launchBlastRemaining,0);samples.push({type,launchVelocity:vy,peak,flight});s.reset();assert.equal(s.cars[0].launchBlastRemaining,0);s.dispose();
 const r=ready(type,'rocket');let impulse=0,thrust=false,maxHeight=0;advance(r.s,10,c=>{impulse+=Math.max(0,c.rocketVectorThrust||0)/120;thrust||=c.rocketVectorThrust>0;maxHeight=Math.max(maxHeight,c.flightHeight);assert.ok(Number.isFinite(c.speed+c.flightHeight+c.verticalVelocity));});assert.ok(thrust);assert.ok(impulse<=4.00001);assert.ok(maxHeight<8);assert.equal(r.c.flightRemaining,0);assert.equal(r.c.rocketRemaining,0);assert.equal(r.c.rocketVectorThrust,0);r.s.dispose();
}
// EMP suppresses both rendered force fields and the actual extra lift budget.
{const {s,c}=ready('gt3','rocket');c.itemEffects.emp=2;const budget=c._rocketLiftBudget;advance(s,.5);assert.equal(c.rocketVectorThrust,0);assert.equal(c.rocketAcceleration,0);assert.equal(c._rocketLiftBudget,budget);s.dispose();}
console.log(JSON.stringify({types:samples,finiteRocketImpulse:4,gravity:9.81,expiryAndReset:true,empSuppressesActualThrust:true}));
