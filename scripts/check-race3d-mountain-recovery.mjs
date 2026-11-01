import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack} from '../public/games/games/race3d-alpine-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {createChaseCamera} from '../public/games/games/race3d-camera.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const track=createRaceTrack(THREE);let steep=0,grade=0;for(let d=0;d<track.totalLength;d++){const s=track.sampleTrack(d);if(s.tangent.y>grade){grade=s.tangent.y;steep=d;}}
const recovery=[];
for(const type of RACE_ROSTER_TYPES){
 const sim=createRaceSimulation({players:[{id:type,name:type,...getRacerIdentity(type)}],track,random:()=>.61,autoItems:false});sim.pickups.length=0;sim.ramps.length=0;
 const c=sim.cars[0];Object.assign(c,{distance:steep,previousProgress:steep,speed:0,lateral:0,damage:.95,damageLevel:19,batteryEnergyJ:180e6*.02,batterySOC:.02,_nextMistake:Infinity});
 for(let i=0;i<900;i++)sim.update(1/60);
 assert.ok(c.distance>steep+15,`${type} uphill restart failed: ${c.distance-steep}`);recovery.push({type,progress:c.distance-steep,speed:c.speed});sim.dispose();
}
let minimum=Infinity;
for(const mode of ['chase','first-person','overhead']){
 const camera=new THREE.PerspectiveCamera(60,1,.08,2000),rig=createChaseCamera({THREE,camera,track});if(mode==='first-person')rig.changeMode(1);if(mode==='overhead')rig.changeMode(-1);
 for(let d=0;d<track.totalLength;d+=3){rig.update({id:'probe',distance:d,lateral:8,speed:45,maxSpeed:50},1/60,[]);const clearance=camera.position.y-track.terrainHeight(camera.position.x,camera.position.z);minimum=Math.min(minimum,clearance);assert.ok(clearance>=.899,`${mode} terrain clipping`);}
 rig.dispose();
}
console.log(JSON.stringify({steep,grade,recovery,cameraMinimumTerrainClearance:minimum}));track.dispose();

