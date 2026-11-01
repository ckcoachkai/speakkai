import assert from 'node:assert/strict';import * as T from '../public/games/assets/vendor/three.module.js';import {createCarNeon} from '../public/games/games/race3d-car-neon.js';
const sample={position:new T.Vector3(10,30,20),tangent:new T.Vector3(0,.06,1).normalize(),right:new T.Vector3(1,0,0),bank:.07};const track={sampleTrack:()=>sample};
const cars=[{id:'a',distance:10,lateral:2},{id:'b',distance:20,lateral:-2}];const original=JSON.stringify(cars);
for(const quality of ['low','high'])for(const reducedMotion of [false,true]){
 const fx=createCarNeon(T,{timeOfDay:'night',quality,reducedMotion});const exact=new T.Matrix4().makeRotationY(.6);exact.setPosition(50,40,60);
 fx.update(cars,track,.01,{focusId:'b',visualPose:id=>id==='b'?{...cars[1],exhaustMatrix:exact}:cars[0]});assert.equal(fx.snapshot().cars,2);assert.equal(fx.snapshot().panels,10);assert.equal(fx.snapshot().glows,2);
 const panels=fx.group.getObjectByName('car-neon-cabin-and-sills'),glows=fx.group.getObjectByName('car-neon-underglow'),m=new T.Matrix4(),p=new T.Vector3();panels.getMatrixAt(5,m);p.setFromMatrixPosition(m);assert.ok(p.distanceTo(new T.Vector3(-1.02,.34,0).applyMatrix4(exact))<1e-5,'exact rendered chassis pose');
 glows.getMatrixAt(0,m);const n=new T.Vector3(0,1,0).transformDirection(m);assert.ok(n.dot(sample.tangent)<.001,'slope-aligned underglow');
 const old=panels.instanceMatrix.array.slice(),colors=panels.instanceColor.array.slice();fx.update(cars,track,.09,{focusId:'b',visualPose:id=>id==='b'?{...cars[1],exhaustMatrix:exact}:cars[0]});assert.deepEqual(panels.instanceMatrix.array,old,'steady no pulse/flicker');assert.deepEqual(panels.instanceColor.array,colors);assert.notDeepEqual(Array.from(colors.slice(0,3)),Array.from(colors.slice(6,9)),'cabin and sill hues differ');
 assert.equal(fx.group.children.filter(c=>c.isPointLight&&c.intensity>0).length,quality==='high'?2:0);
 fx.update([{...cars[0],flightHeight:4}],track,.01);assert.equal(fx.snapshot().glows,0,'no detached airborne road glow');
 fx.update(Array.from({length:100},(_,i)=>({id:i})),track,.01);assert.equal(fx.snapshot().cars,60);assert.equal(fx.snapshot().panels,300);
 fx.setMode('day');fx.update(cars,track,.01);assert.equal(fx.snapshot().cars,0);assert.equal(fx.group.visible,false);fx.setMode('night');fx.setQuality('low');fx.update(cars,track,.01);assert.equal(fx.snapshot().lightBudget,0);fx.reset();assert.equal(fx.snapshot().panels,0);fx.dispose();fx.dispose();fx.update(cars,track,.01);assert.equal(fx.snapshot().disposed,true);assert.equal(fx.group.children.length,0);
}
assert.equal(JSON.stringify(cars),original);console.log('PASS neon: exact chassis pose,road alignment,distinct cabin/sills,steady output,bounded quality lights/capacity,airborne suppression,day/reset/dispose,simulation immutability');
// Stable per-roster colors must not follow racing order or quality settings.
{
 const fx=createCarNeon(T,{timeOfDay:'night',quality:'low'}),roster=Array.from({length:10},(_,i)=>({id:'driver-'+i,distance:i}));
 const capture=list=>{fx.update(list,track,.016);const a=fx.group.getObjectByName('car-neon-cabin-and-sills').instanceColor.array;return Object.fromEntries(list.map((c,i)=>[c.id,{sill:Array.from(a.slice(i*15,i*15+3)),roof:Array.from(a.slice(i*15+6,i*15+9))}]));};
 const before=capture(roster);assert.equal(new Set(Object.values(before).map(x=>JSON.stringify(x.sill))).size,10,'ten unique underglow/sill hues');assert.equal(new Set(Object.values(before).map(x=>JSON.stringify(x.roof))).size,10,'ten unique roof hues');
 assert.deepEqual(capture([...roster].reverse()),before,'reorder cannot change racer colors');fx.reset();fx.setQuality('high');fx.setMode('day');fx.setMode('night');assert.deepEqual(capture(roster),before,'reset/time/quality preserve colors');fx.dispose();
 console.log('PASS neon: ten unique stable racer hues across reorder/reset/time/quality');
}
