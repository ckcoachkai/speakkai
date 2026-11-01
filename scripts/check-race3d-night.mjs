import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceAtmosphere} from '../public/games/games/race3d-atmosphere.js';
import {createStreetlights} from '../public/games/games/race3d-streetlights.js';
const originalDocument=globalThis.document;
const canvases=[];
globalThis.document={createElement(){const canvas={width:0,height:0,getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(p){canvas.pixels=p.data;},createRadialGradient(){return {addColorStop(){}};},fillRect(){}};}};canvases.push(canvas);return canvas;}};
try{
  for(const width of [256,1024]){
    const scene=new THREE.Scene(), old=new THREE.Color('red');scene.background=old;
    const day=createRaceAtmosphere(THREE,{scene,skyWidth:width,shadows:false});
    const daySky=canvases.at(-1).pixels.slice();day.dispose();assert.equal(scene.background,old);assert.equal(scene.children.length,0);
    const night=createRaceAtmosphere(THREE,{scene,skyWidth:width,timeOfDay:'night',shadows:false});
    const nightSky=canvases.at(-1).pixels;
    const sum=p=>p.reduce((a,v,i)=>a+(i%4===3?0:v),0);
    assert.ok(sum(nightSky)<sum(daySky)*.55,'night visibly differs from day');
    let moonPixels=0;for(let i=0;i<nightSky.length;i+=4)if(nightSky[i]>180&&nightSky[i+1]>180&&nightSky[i+2]>180)moonPixels++;
    assert.ok(moonPixels>0,'moon resolves even on low quality');
    assert.ok(night.sun.intensity>1,'moon light retains road detail');
    night.update(new THREE.Vector3(10,40,10));assert.ok(night.sun.target.position.y>30,'light follows elevated track');
    night.dispose();night.dispose();assert.equal(scene.children.length,0);assert.equal(scene.background,old);
  }
  const tangent=new THREE.Vector3(0,.12,1).normalize();
  const track={totalLength:1000,sampleTrack(d){return {position:new THREE.Vector3(0,d*.12,d),right:new THREE.Vector3(1,0,0),tangent,bank:.03,width:18};},sampleGround(d,l){return new THREE.Vector3(l,d*.12-.2,d);}};
  const lamps=createStreetlights(THREE,track,{timeOfDay:'night',quality:'high'});
  lamps.update(999);assert.equal(lamps.snapshot().lightBudget,4);
  assert.equal(lamps.group.children.filter(c=>c.isPointLight&&c.intensity>0).length,4);
  const pools=lamps.group.getObjectByName('streetlight-road-pools'),m=new THREE.Matrix4();pools.getMatrixAt(1,m);
  const normal=new THREE.Vector3(0,1,0).transformDirection(m);
  assert.ok(Math.abs(normal.dot(tangent))<1e-6,'illumination conforms to road grade');
  assert.ok(normal.x<-.02,'illumination conforms to road bank');
  lamps.setQuality('low');lamps.update(0);assert.ok(pools.visible);assert.equal(lamps.group.children.filter(c=>c.isPointLight&&c.intensity>0).length,0);
  lamps.setMode('day');assert.equal(pools.visible,false);
  lamps.dispose();lamps.dispose();lamps.update(12);assert.equal(lamps.group.children.length,0);
  console.log('PASS: low/high moon resolution, day/night distinction, elevated shadow volume, restoration/disposal, bounded light pool, slope/bank road illumination');
}finally{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;}
