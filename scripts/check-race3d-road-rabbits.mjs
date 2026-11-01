import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRoadRabbits} from '../public/games/games/race3d-road-rabbits.js';
const track={totalLength:960,width:18,sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},bank:0,width:18})};
const make=opts=>createRoadRabbits(THREE,{track,random:()=>.5,...opts});
const f=make(), twin=make(); assert.deepEqual(f.snapshot().placements,twin.snapshot().placements);
assert.equal(f.snapshot().capacity,192); assert.equal(f.snapshot().renderCapacity,96);
const firstCluster=f.snapshot().placements.slice(0,8);
assert.ok(firstCluster.every(p=>p.distance>=90&&p.distance<=150), 'first cluster near the grid');
assert.ok(Math.max(...firstCluster.map(p=>p.distance))-Math.min(...firstCluster.map(p=>p.distance))>=40);
assert.ok(new Set(firstCluster.map(p=>p.lateral.toFixed(1))).size>=5, 'lane variety'); const r=f.snapshot().placements[0];
const car={id:1,distance:r.distance-8,lateral:r.lateral,speed:60};
f.update([car],.1,{active:true,quality:'high'}); assert.equal(f.snapshot().hits,0);
car.distance=r.distance+8; f.update([car],.1,{active:true,quality:'high'});assert.ok(f.snapshot().hits>=1); assert.equal(f.snapshot().decals,f.snapshot().hits);assert.equal(f.snapshot().placements[0].alive,false);
const hitCount=f.snapshot().hits; f.update([car],.1,{active:true,quality:'high'}); assert.equal(f.snapshot().hits,hitCount,'contact is not repeated');
for(let i=0;i<13;i++)f.update([], .25, {active:true,quality:'high'});assert.equal(f.snapshot().decals,0);
f.reset();assert.equal(f.snapshot().alive,192);assert.equal(f.snapshot().hits,0);
const wrapped=f.snapshot().placements.reduce((a,b)=>a.distance>b.distance?a:b);const inlow=f.snapshot().placements.findIndex(x=>x.distance===wrapped.distance);
car.distance=wrapped.distance-4;car.lateral=wrapped.lateral;f.update([car],.1,{active:true,quality:'high'});car.distance=(wrapped.distance+4)%track.totalLength;f.update([car],.1,{active:true,quality:'high'});assert.equal(f.snapshot().placements[inlow].alive,false,'wrapped crossing');
f.reset();car.distance=r.distance-8;car.lateral=r.lateral;car.flightHeight=3;car.flightRemaining=1;f.update([car],.1,{active:true,quality:'high'});car.distance=r.distance+8;f.update([car],.1,{active:true,quality:'high'});assert.equal(f.snapshot().hits,0,'airborne pass');car.flightHeight=0;car.flightRemaining=0;f.update([car],.1,{active:true,quality:'high'});assert.equal(f.snapshot().placements[0].alive,true,'no swept contact after landing');
f.reset();car.distance=r.distance;car.finished=true;f.update([car],.1,{active:true,quality:'high'});assert.equal(f.snapshot().hits,0);car.finished=false;car.eliminated=true;f.update([car],.1,{active:true,quality:'high'});assert.equal(f.snapshot().hits,0);car.eliminated=false;
f.reset();car.distance=r.distance;f.update([car],.1,{active:false});assert.equal(f.snapshot().hits,0);assert.equal(f.group.visible,false);
f.reset(); car.distance=120; car.lateral=100; f.update([car],.1,{active:true,quality:'high'}); assert.ok(f.snapshot().visible>=8,'cluster visible near grid');
const still=make({reducedMotion:true});car.distance=r.distance+3.5;still.update([car],.1,{active:true,quality:'low'});assert.ok(still.snapshot().visible<=48);assert.ok(still.snapshot().drawCalls<=4);
const body=still.group.getObjectByName('rabbit-bodies'), a=new THREE.Matrix4(),b=new THREE.Matrix4();assert.ok(body.count>0);body.getMatrixAt(0,a);still.update([car],.1,{active:true,quality:'low'});body.getMatrixAt(0,b);assert.deepEqual(a.elements,b.elements,'reduced motion remains still');
f.dispose();f.dispose();f.update([car],.1,{active:true});assert.equal(f.snapshot().disposed,true);still.dispose();twin.dispose();
console.log('PASS: deterministic 192 clustered placements, swept and wrapped contact, decal lifetime, airborne and finished exclusions, reset, budgets, reduced motion, dispose');




