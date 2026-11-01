import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRoadRabbits} from '../public/games/games/race3d-road-rabbits.js';
import {createRaceEffects} from '../public/games/games/race3d-fx.js';
import {createRaceCars} from '../public/games/games/race3d-cars.js';
const sampleTrack=d=>({position:new THREE.Vector3(0,0,d),tangent:new THREE.Vector3(0,0,1),right:new THREE.Vector3(1,0,0),bank:0,width:18});
const track={totalLength:960,width:18,sampleTrack}, open={...track,closed:false};
const closedRabbits=createRoadRabbits(THREE,{track,random:()=>.5}), openRabbits=createRoadRabbits(THREE,{track:open,random:()=>.5});
assert.ok(openRabbits.snapshot().placements.every(p=>p.distance>=0&&p.distance<=open.totalLength));
const target=closedRabbits.snapshot().placements[0], location={id:'test',distance:target.distance-track.totalLength,lateral:target.lateral,speed:0};
closedRabbits.update([location],.05,{active:true});assert.equal(closedRabbits.snapshot().placements[0].alive,false,'closed course aliases neighbouring laps');
openRabbits.update([location],.05,{active:true});assert.equal(openRabbits.snapshot().hits,0,'open course does not alias end to start');assert.equal(openRabbits.snapshot().visible,0,'open course does not render across ends');
const targetOpen=openRabbits.snapshot().placements[0];location.distance=targetOpen.distance-8;location.lateral=targetOpen.lateral;location.speed=50;openRabbits.update([location],.05,{active:true});location.distance=targetOpen.distance+8;openRabbits.update([location],.05,{active:true});assert.equal(openRabbits.snapshot().placements[0].alive,false,'open course swept collision');
closedRabbits.dispose();openRabbits.dispose();
const focus={id:'focus',distance:5,lateral:0,speed:0},other={id:'other',distance:955,lateral:0,speed:20,slip:1};
for(const [testTrack,expected] of [[track,1],[open,0]]){const fx=createRaceEffects(THREE);fx.update(.05,{active:true,track:testTrack,focusCar:focus,cars:[focus,other],quality:'high'});assert.equal(fx.snapshot().emitters,expected,'tyre effect proximity');fx.dispose();}
const racers=[{...focus,name:'Focus',gridPosition:0},{...other,name:'Other',gridPosition:1}];
for(const [testTrack,expected] of [[track,'detailed'],[open,'distant']]){const models=createRaceCars(THREE,racers,{authoredModels:false});models.update(testTrack,.016,{focusedId:'focus',lodDistance:120,detailedCars:2});const model=models.group.getObjectByName('car-other');assert.equal(model.userData.lod,expected,'car detail proximity');models.dispose();}
console.log('PASS: open course placements and swept contacts, no end/start aliasing for rabbits, tyre emitters or car LOD; closed loop retained');
