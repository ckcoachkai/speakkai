import assert from 'node:assert/strict';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
const makeTrack=(closed,grade=0)=>({closed,totalLength:1000,raceDistance:5000,width:20,hazards:[{type:'cone',distance:0,lateral:0}],sampleTrack:d=>({position:{x:0,y:grade*d,z:d},tangent:{x:0,y:grade,z:1},right:{x:1,y:0,z:0},width:20})});
const make=track=>{const s=createRaceSimulation({track,players:[{id:'a'},{id:'b'}],random:()=>.3,autoItems:false,driverMode:'equal',catchup:false});s.ramps.length=s.pickups.length=0;return s;};
const open=make(makeTrack(false)),closed=make(makeTrack(true));
assert.equal(open.finishDistance,1000);assert.equal(closed.finishDistance,5000);
for(const s of [open,closed]){
 const a=s.cars.find(c=>c.id==='a'),b=s.cars.find(c=>c.id==='b');
 Object.assign(a,{distance:985,previousProgress:985,lateral:0,speed:20,inventoryItem:'missile',inventoryPhase:'ready'});
 Object.assign(b,{distance:15,previousProgress:15,lateral:0,speed:20});
}
assert.equal(open.itemOpportunity('a').use,false,'no missile target across open endpoints');
assert.equal(closed.itemOpportunity('a').use,true,'closed loop retains seam targeting');
for(const s of [open,closed]){
 const a=s.cars.find(c=>c.id==='a');Object.assign(a,{distance:999,previousProgress:999,lateral:0,speed:0});
 s.update(1/120);
}
assert.equal(open.cars.find(c=>c.id==='a').damage,0,'no phantom endpoint hazard');
assert.ok(closed.cars.find(c=>c.id==='a').damage>0,'closed loop retains seam hazard');
open.dispose();closed.dispose();
// Force a runoff position solely to test that a start-line box is never
// recreated at the equivalent position one route length later.
const pickupOpen=make(makeTrack(false)),pickupClosed=make(makeTrack(true));
for(const s of [pickupOpen,pickupClosed]){
 s.pickups.push({id:'test-box',gateId:'test',distance:60,lateral:0,radius:2,active:true});
 const a=s.cars.find(c=>c.id==='a'),b=s.cars.find(c=>c.id==='b');
 Object.assign(a,{distance:1059,previousProgress:1059,lateral:0,preferredLane:0,speed:0});Object.assign(b,{distance:300,previousProgress:300,lateral:8});
 s.update(1/120);
}
assert.equal(pickupOpen.cars.find(c=>c.id==='a').itemsCollected,0,'open course does not repeat pickups');
assert.equal(pickupClosed.cars.find(c=>c.id==='a').itemsCollected,1,'closed course retains per-lap pickups');
pickupOpen.dispose();pickupClosed.dispose();
const flat=make(makeTrack(false)),down=make(makeTrack(false,-.04));
for(const s of [flat,down])for(const c of s.cars)Object.assign(c,{distance:200,previousProgress:200,lateral:c.id==='a'?-4:4,preferredLane:c.id==='a'?-4:4,speed:20,_nextMistake:Infinity,_nextDecision:Infinity});
for(let i=0;i<240;i++)for(const s of [flat,down])s.update(1/120);
assert.ok(down.cars.find(c=>c.id==='a').speed>flat.cars.find(c=>c.id==='a').speed,'downhill grade contributes bounded gravity');
for(const s of [flat,down]) {assert.ok(s.cars.every(c=>Number.isFinite(c.distance)&&Number.isFinite(c.speed)));s.dispose();}
console.log('PASS: open finish, endpoint targeting and hazards; closed seam behavior; downhill gravity');
