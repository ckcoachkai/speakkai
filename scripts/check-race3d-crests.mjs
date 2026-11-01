import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createTrack} from '../public/games/games/race3d-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
const track=createTrack(THREE), crest=track.totalLength/11;
let prev=track.sampleTrack(0).position.y,min=Infinity,max=-Infinity;
for(let d=1;d<=track.totalLength;d+=1){let p=track.sampleTrack(d);assert.ok(p.position.y<prev,`course must descend at ${d}`);prev=p.position.y;min=Math.min(min,-p.tangent.y);max=Math.max(max,-p.tangent.y);}
function crossing(speed){const s=createRaceSimulation({players:[{id:'car'}],track,random:()=>.3,autoItems:false,catchup:false});s.ramps.length=0;s.pickups.length=0;const c=s.cars[0];Object.assign(c,{distance:crest-35,previousProgress:crest-35,speed,lateral:0,preferredLane:0,heading:0,_nextMistake:Infinity,_controlClock:Infinity,_controlThrottle:0,_controlBrake:0,spontaneousNitroCooldown:Infinity});let peak=0,duration=0,takeoff=[],land=[];for(let i=0;i<720;i++){s.update(1/120);if(c.flightKind==='crest'){peak=Math.max(peak,c.flightHeight);duration+=1/120;}for(const e of s.drainEvents()){if(e.type==='crest-takeoff')takeoff.push(e);if(e.type==='crest-land')land.push(e);}assert.ok(Number.isFinite(c.speed+c.flightHeight+c.verticalVelocity));if(c.distance>crest+75)break;}assert.equal(c.flightRemaining,0);s.dispose();return {speed,peak,duration,takeoff,land};}
const slow=crossing(20),fast=crossing(55);
assert.equal(slow.takeoff.length,0,'slow crossing remains grounded');assert.equal(fast.takeoff.length,1,'fast crossing detaches exactly once');assert.equal(fast.land.length,1,'fast crossing lands');assert.ok(fast.peak>.01&&fast.peak<1,`bounded height ${fast.peak}`);assert.ok(fast.duration>.05&&fast.duration<2.5,`bounded airtime ${fast.duration}`);assert.ok(fast.takeoff[0].verticalVelocity<0,'initial vertical velocity follows downhill tangent');
const race=createRaceSimulation({players:[{id:'a'},{id:'b'},{id:'c'}],track,random:()=>.42,autoItems:false});race.ramps.length=0;race.pickups.length=0;let peak=0,crestEvents=0;
for(let t=0;t<1000&&!race.allFinished;t+=.25){race.update(.25);for(const c of race.cars){peak=Math.max(peak,c.flightKind==='crest'?c.flightHeight:0);assert.ok(Number.isFinite(c.distance+c.speed+c.flightHeight));}crestEvents+=race.drainEvents().filter(e=>e.type==='crest-takeoff').length;}
assert.ok(race.allFinished,'AI racers complete the course');assert.ok(peak<1.5);assert.ok(crestEvents<=30,'at most one per crest per racer');
const finish=createRaceSimulation({players:[{id:'finish'}],track,random:()=>.42,autoItems:false});finish.ramps.length=0;finish.pickups.length=0;
const fc=finish.cars[0],finishY=track.sampleTrack(finish.finishDistance-.01).position.y;
Object.assign(fc,{distance:finish.finishDistance-.01,previousProgress:finish.finishDistance-.01,speed:40,lateral:0,heading:0,flightKind:'crest',flightHeight:1,flightDuration:2.5,flightRemaining:2.5,verticalVelocity:-1,rampState:'airborne',_rampFlightElapsed:0,_rampTakeoffWorldY:finishY+1,_rampTakeoffVelocity:-1,_rocketLiftHeight:0,_rocketLiftVelocity:0});
finish.update(1/120);assert.equal(fc.finished,true);assert.equal(fc.flightRemaining,0);assert.equal(fc.flightHeight,0);assert.equal(fc.flightKind,null);assert.ok(finish.drainEvents().some(e=>e.type==='crest-land'&&e.reason==='finish'));finish.dispose();
console.log(JSON.stringify({minGrade:min,maxGrade:max,slow,fast,ai:{finishers:race.results.length,time:race.time,crestEvents,peak},finishDuringFlight:true}));race.dispose();track.dispose();
