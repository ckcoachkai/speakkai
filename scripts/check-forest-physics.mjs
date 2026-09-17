import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeadHinge,stepHeadHinge,createCape,stepCape,createFur,stepFur} from '../src/scripts/forest/physics.js';

test('hinge reaches the 180-degree stop, receives five impulses and returns upright',()=>{
 for(const fps of [30,60,120]){
  const s=createHeadHinge();
  for(let frame=0;frame<fps*4;frame++)stepHeadHinge(s,1/fps,frame/fps,false);
  assert.equal(s.impacts,5);assert.equal(s.peak,Math.PI);assert.ok(s.angle<.015);assert.ok(Number.isFinite(s.velocity));
  const snapshot={...s};stepHeadHinge(s,0,4,false);assert.deepEqual(s,snapshot);
 }
});
test('gentle hinge motion is limited to a small recoil',()=>{
 const s=createHeadHinge();for(let i=0;i<240;i++)stepHeadHinge(s,1/60,i/60,true);
 assert.ok(s.peak<=.18);assert.equal(s.impacts,5);
});
test('cloth stays pinned, finite and within stretch limits during repeated jumps',()=>{
 const cape=createCape(3);let maxStretch=0;
 for(let frame=0;frame<360;frame++){
  const t=frame/60;stepCape(cape,1/60,{x:300+t*350,y:1400-Math.abs(Math.sin(t*4))*220,h:248},true,false,t);
  for(const p of cape.points){assert.ok([p.x,p.y,p.z].every(Number.isFinite));if(p.pinned){assert.equal(p.x,p.homeX);assert.equal(p.y,0);assert.equal(p.z,0);}}
  for(const c of cape.constraints.filter(c=>c.stiffness>.9)){const a=cape.points[c.a],b=cape.points[c.b];maxStretch=Math.max(maxStretch,Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)/c.rest);}
 }
 assert.ok(maxStretch<1.25,`fabric stretched ${maxStretch} times`);
 assert.ok(cape.points.some(p=>Math.abs(p.z)>.02),'cloth has real depth');
 const snapshot=JSON.stringify(cape);stepCape(cape,0,{x:999,y:999,h:248},true,false,10);assert.equal(JSON.stringify(cape),snapshot);
});
test('charged fur springs remain finite and point upward',()=>{
 const fur=createFur();for(let i=0;i<240;i++)stepFur(fur,1/60,i/60,false);
 assert.ok(fur.every(f=>Number.isFinite(f.velocity)&&Math.sin(f.angle)<-.4));
 const snapshot=JSON.stringify(fur);stepFur(fur,0,10,false);assert.equal(JSON.stringify(fur),snapshot);
});
