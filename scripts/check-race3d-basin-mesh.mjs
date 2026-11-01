import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack} from '../public/games/games/race3d-alpine-track.js';
const t=createRaceTrack(THREE),mesh=t.group.getObjectByName('race-course-ground');mesh.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);let minShore=Infinity,maxBed=-Infinity;
for(const b of t.waterBasins)for(let a=0;a<Math.PI*2;a+=.08)for(const radius of [.6,1.05]){
 ray.set(new THREE.Vector3(b.x+Math.cos(a)*b.radiusX*radius,500,b.z+Math.sin(a)*b.radiusZ*radius),down);
 const hits=ray.intersectObject(mesh);assert.equal(hits.length,1,'one continuous terrain surface');const h=hits[0].point.y;
 if(radius<1){maxBed=Math.max(maxBed,h);assert.ok(h<b.y-.5,'inset visible water');}else{minShore=Math.min(minShore,h);assert.ok(h>b.y+.2,'mesh shoreline above water');}
}
assert.ok(mesh.geometry.userData.basinRefinement.addedVertices<4000,'bounded local mesh budget');console.log(JSON.stringify({minShore,maxBed,...mesh.geometry.userData.basinRefinement}));t.dispose();

