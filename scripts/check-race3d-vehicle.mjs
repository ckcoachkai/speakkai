import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {createRaceRamps} from '../public/games/games/race3d-ramps.js';
import {createCarMotion} from '../public/games/games/race3d-car-motion.js';
import {VEHICLE_PROFILES,vehicleProfile,wheelLoads,planRampApproach} from '../public/games/games/race3d-vehicle.js';
import {assignRacerTypes,RACE_ROSTER_TYPES,getRacerIdentity} from '../public/games/games/race3d-roster.js';
import {RACER_CARD_NAMES} from '../public/games/games/race3d-ui-catalog.js';
const track={totalLength:4000,raceDistance:12000,width:16.5,hazards:[],sampleTrack:d=>({position:new THREE.Vector3(0,0,d),tangent:new THREE.Vector3(0,0,1),right:new THREE.Vector3(1,0,0),bank:0,curvature:0,width:16.5})};
const decks=createRaceRamps(THREE,{track});decks.group.updateMatrixWorld(true);
const deck=decks.group.getObjectByName('race3d-ramps-composite-driving-decks'),ray=new THREE.Raycaster();
assert.ok(deck);
const migrated=assignRacerTypes(Array.from({length:60},(_,i)=>({id:i,name:'Car '+i,racerType:['snail','bear','cheese-brie','x-wing'][i%4]})),()=>.43);
assert.equal(migrated.length,60);assert.equal(new Set(migrated.map(c=>c.racerType)).size,5);assert.ok(migrated.every(c=>c.category==='car'));assert.deepEqual(Object.keys(RACER_CARD_NAMES).sort(),[...RACE_ROSTER_TYPES].sort());
function fixture(type='gt3',side=1,speed=28,rampIndex=0){
 const s=createRaceSimulation({players:[{id:'test',name:'Test',...getRacerIdentity(type)}],track,random:()=>.441,autoItems:false});s.pickups.length=0;
 const c=s.cars[0],r=s.ramps[rampIndex];Object.assign(c,{distance:r.distance-170,previousProgress:r.distance-170,lateral:side*7,preferredLane:side*7,speed,topSpeed:speed,_nextDecision:Infinity,_nextMistake:Infinity});
 const p=vehicleProfile(c),car=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(1.8,.7,4),new THREE.MeshBasicMaterial());body.position.y=.8;car.add(body);
 const mounts=[],spin=[],steer=[];for(const sx of [-1,1])for(const az of [-1,1]){const m=new THREE.Group();m.position.set(sx*p.track/2,.35,az>0?p.front:-p.rear);const w=new THREE.Group();w.userData.rollingRadius=.35;m.add(w);car.add(m);mounts.push(m);spin.push(w);if(az>0)steer.push(m);}
 const motion=createCarMotion(THREE,{car,racer:c,wheelMounts:mounts,wheelSpin:spin,steeringPivots:steer});
 return {s,c,r,car,motion};
}
let cases=0,contacts=0,maxDeckError=0,flips=0,maxLandingStep=0;const approachEvents=[];
for(const type of Object.keys(VEHICLE_PROFILES))for(const rampIndex of [0,1])for(const side of [-1,1])for(const speed of [12,25,40]){
 const f=fixture(type,side,speed,rampIndex),{s,c,r,motion}=f;let approach=false,takeoff=false,landed=false,lastY=null,fullDeck=false;
 for(let i=0;i<3600&&!landed;i++){
  s.update(1/120);motion.update(track,1/120);const pose=motion.snapshot();
  if(c.rampState==='approach'){
   approach=true;
   if(pose.wheels.every(w=>w.contact)&&c.distance>r.distance+4&&c.distance<r.distance+r.length-4)fullDeck=true;
   for(const w of pose.wheels){
    if(!w.contact||w.surfaceY<.04)continue;
    ray.set(new THREE.Vector3(w.hubX,w.hubY+2,w.hubZ),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(deck,false)[0];assert.ok(hit,'tyre must be above actual rendered deck');
    const error=Math.abs(w.hubY-w.radius-hit.point.y);maxDeckError=Math.max(maxDeckError,error);assert.ok(error<.085,'deck ray error '+error);contacts++;
   }
  }
  for(const e of s.drainEvents()){
   if(e.type==='ramp-takeoff'){
    takeoff=true;assert.ok(approach&&fullDeck,'must ride full deck before flight');assert.ok(e.rearAt>=e.lip-.01&&e.rearAt-e.lip<.6,'rear axle leaves actual lip');assert.ok(Math.abs(e.lateralError)<1.5,'launch within ramp');
    assert.ok(e.verticalVelocity>=0&&e.verticalVelocity<=c.speed*.7,'speed/orientation launch, no arbitrary impulse');approachEvents.push({type,side,speed,actualSpeed:c.speed,flips:e.fullFlips});
   }
   if(e.type==='ramp-land'){
    landed=true;assert.equal(typeof e.successful,'boolean');assert.ok(takeoff);flips+=e.fullFlips;
    const delta=Math.abs(pose.supportY-(lastY??pose.supportY));maxLandingStep=Math.max(maxLandingStep,delta);assert.ok(delta<.45,'landing continuity '+delta);
    // Imperfect angular landings are now intentional; verify bounded recovery
    // restores physical tyre contact rather than forcing upright at impact.
    for(let settle=0;settle<300;settle++){s.update(1/120);motion.update(track,1/120);}
    assert.ok(motion.snapshot().wheels.every(w=>w.contact&&Math.abs(w.contactError)<.02),'four wheel contact restored after recovery');
   }
  }
  lastY=pose.supportY;
 }
 assert.ok(landed,type+' '+side+' '+speed+' finishes ramp');assert.equal(c.flightRemaining,0);assert.ok(c.distance>r.distance+r.length);s.dispose();cases++;
}
// Pure lane planner: both sides, infeasible late approach, crossing traffic,
// hidden slow leader, freeze and tight-bend cases have explicit skip reasons.
const r=track.ramps[0],base={id:'a',racerType:'gt3',distance:r.distance-150,lateral:4.25,speed:35};
assert.ok(planRampApproach(base,[r],track.totalLength).reachable);
assert.ok(planRampApproach({...base,lateral:-7},[r],track.totalLength).reachable);
assert.equal(planRampApproach({...base,distance:r.distance-5},[r],track.totalLength).reason,'unreachable');
assert.equal(planRampApproach(base,[r],track.totalLength,[{id:'b',distance:base.distance+40,lateral:0,speed:10}]).reason,'traffic');
assert.equal(planRampApproach(base,[r],track.totalLength,[{id:'b',distance:base.distance-20,lateral:0,speed:50}]).reason,'traffic');
assert.equal(planRampApproach({...base,freezeRemaining:1},[r],track.totalLength).reason,'control');
assert.equal(planRampApproach(base,[r],track.totalLength,[],()=>.03).reason,'bend');
// Neither starting beside the middle nor too late across the road may jump.
for(const late of [true,false]){const {s,c,r}=fixture();Object.assign(c,{distance:r.distance+(late?-3:10),previousProgress:r.distance+(late?-3:10),lateral:4.25,preferredLane:4.25});for(let i=0;i<500;i++)s.update(1/120);assert.equal(c.rampTakeoffs,0);s.dispose();}
// Weight transfer conserves normal load and responds with the right signs.
const groundItems=['boost','launch','bomb','missile','banana','shockwave','freeze'];
for(const type of [...groundItems,'rocket','shield','repair']){
 const {s,c}=fixture('gt3',1,40);assert.ok(s.awardItem(c.id,type));let e=[];
 for(let i=0;i<2000;i++){s.update(1/120);if(c.inventoryPhase==='ready')s.useHeldItem(c.id);e.push(...s.drainEvents());}
 const use=e.findIndex(x=>x.type==='item-use'&&x.itemType===type),land=e.findIndex(x=>x.type==='ramp-land');assert.ok(use>=0,'item still executes: '+type);assert.ok(land>=0,'jump completes with held '+type);
 if(groundItems.includes(type))assert.ok(use>land,'ground item waits without interrupting jump: '+type);
 assert.ok(Number.isFinite(c.flightHeight)&&Number.isFinite(c.distance));s.dispose();
}
const mass=car=>wheelLoads(car).reduce((n,w)=>n+w.load,0),front=car=>wheelLoads(car).filter(w=>w.axle>0).reduce((n,w)=>n+w.load,0),right=car=>wheelLoads(car).filter(w=>w.side>0).reduce((n,w)=>n+w.load,0);
assert.ok(front({acceleration:8})<front({acceleration:0}));assert.ok(front({acceleration:-8})>front({acceleration:0}));assert.ok(right({lateralAcceleration:8})>.5);assert.ok(Math.abs(mass({acceleration:8,lateralAcceleration:8})-1)<1e-12);assert.equal(mass({flightRemaining:1}),0);
// Actual rolling circumference, stopped wheels, opposite front steering,
// rear wheels fixed, and sprung body responding to acceleration/braking.
{const {s,c,motion}=fixture();c.distance=0;c.lateral=0;c.rampState='ground';c.rampId=null;c.speed=12;c.acceleration=7;motion.reset();motion.update(track,1/60);c.distance=2;motion.update(track,1/60);let p=motion.snapshot();assert.ok(p.wheels.every(w=>Math.abs(w.angle-2/.35)<.001));const old=p.wheels[0].angle;motion.update(track,1/60);assert.equal(motion.snapshot().wheels[0].angle,old);assert.ok(p.bodyPitch<0);c.steeringAngle=.3;motion.update(track,1/60);p=motion.snapshot();assert.ok(p.wheels.filter(w=>w.axle==='front').every(w=>w.steering>0));assert.ok(p.wheels.filter(w=>w.axle==='rear').every(w=>!w.steering));c.acceleration=-8;for(let i=0;i<100;i++)motion.update(track,1/60);assert.ok(motion.snapshot().bodyPitch>0);s.dispose();}
decks.dispose();
console.log(JSON.stringify({carsOnly:60,rampCases:cases,actualDeckRayContacts:contacts,maxDeckError,maxLandingStep,completedFlips:flips,plannerGuards:7,rampItemInteractions:10,fourWheelLoads:true,rollingAndSteering:true,speeds:approachEvents.map(e=>Number(e.actualSpeed.toFixed(1)))}));
