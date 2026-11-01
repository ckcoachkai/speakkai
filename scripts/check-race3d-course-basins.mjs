import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import * as T from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack as downhill} from '../public/games/games/race3d-track.js';
import {createRaceTrack as alpine} from '../public/games/games/race3d-alpine-track.js';
const results=[];
for(const [name,create] of [['downhill',downhill],['alpine',alpine]]){
 const t=create(T),mesh=t.group.getObjectByName(name==='downhill'?'mountain-terrain':'race-course-ground');mesh.updateMatrixWorld(true);
 if(name==='downhill'){
  const saved={length:14020.017319235258,hash:'f5c75dcd443f0f589ef9692a1d337bf36fbab3b8f4a8a82d5a8736bfe78b54d6'},h=createHash('sha256');
  for(let d=-180;d<t.totalLength+80;d++){const s=t.sampleTrack(d);h.update(JSON.stringify([d,s.position,s.tangent,s.bank]));}
  assert.equal(t.totalLength,saved.length);assert.equal(h.digest('hex'),saved.hash,'published downhill route unchanged');assert.equal(t.closed,false);assert.equal(t.naturalCrests,true);
  const end=t.sampleTrack(t.totalLength),after=t.sampleTrack(t.totalLength+50),start=t.sampleTrack(0);
  assert.ok(after.position.distanceTo(end.position)>49.9);assert.ok(after.position.distanceTo(start.position)>500,'no endpoint wrap');
 }
 let minRoad=Infinity,minShore=Infinity,maxBed=-Infinity,minClearance=Infinity;
 const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
 for(let d=0;d<t.totalLength;d++){const p=t.sampleTrack(d).position;minClearance=Math.min(minClearance,p.y-t.terrainHeight(p.x,p.z));for(const b of t.waterBasins)minRoad=Math.min(minRoad,Math.hypot(p.x-b.x,p.z-b.z)-Math.max(b.radiusX,b.radiusZ));}
 assert.ok(minClearance>1);assert.ok(minRoad>25);
 for(const b of t.waterBasins)for(let a=0;a<Math.PI*2;a+=.08)for(const r of [.55,1.05]){
  ray.set(new T.Vector3(b.x+Math.cos(a)*b.radiusX*r,1000,b.z+Math.sin(a)*b.radiusZ*r),down);const hits=ray.intersectObject(mesh);assert.equal(hits.length,1,'continuous one-surface basin');const y=hits[0].point.y;
  if(r<1){maxBed=Math.max(maxBed,y);assert.ok(y<b.y-.5,'visible inset water');}else{minShore=Math.min(minShore,y);assert.ok(y>b.y+.2,'shore contains water');}
 }
 results.push({name,length:t.totalLength,minClearance,minRoad,minShore,maxBed,meshVertices:mesh.geometry.attributes.position.count});t.dispose();
}
console.log(JSON.stringify(results,null,2));

