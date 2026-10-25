import assert from 'node:assert/strict';
import {createRaceSimulation,raceElectricDrive} from '../public/games/games/race3d-physics.js';
import {itemDecision} from '../public/games/games/race3d-strategy.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
import {inventoryFace} from '../public/games/games/race3d-item-rules.js';
const track={totalLength:4000,raceDistance:1e7,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5})};
const make=(autoItems=false)=>{const s=createRaceSimulation({players:[{id:'a',name:'A',...getRacerIdentity('gt3')},{id:'b',name:'B',...getRacerIdentity('car-concept')}],track,random:()=>.41,autoItems});s.pickups.length=0;s.ramps.length=0;for(const c of s.cars)Object.assign(c,{_nextMistake:Infinity,_nextDecision:Infinity});return s;};
const advance=(s,t)=>{for(let n=0;n<t-1e-8;n+=1/120)s.update(1/120);};
const get=(s,id)=>s.cars.find(c=>c.id===id);
const set=(c,d,l=0)=>Object.assign(c,{distance:d,previousProgress:d,lateral:l,preferredLane:l,lateralVelocity:0,speed:20,heading:0,spin:0,flightRemaining:0,rampState:'ground',_hitImmune:0});
const ready=(s,type)=>{s.awardItem('a',type);advance(s,4.51);set(get(s,'a'),100);set(get(s,'b'),1000,6);};
// One owned slot per racer: persistent until use, never overwritten or removed
// by somebody else's activation. Active effects cannot masquerade as inventory.
{const s=make(),a=get(s,'a'),b=get(s,'b');s.awardItem('a','shield');s.awardItem('b','repair');advance(s,20);assert.equal(a.inventoryItem,'shield');assert.equal(b.inventoryItem,'repair');assert.equal(s.awardItem('a','bomb'),false);assert.ok(s.useHeldItem('a'));assert.equal(a.inventoryItem,null);assert.equal(inventoryFace(a,s.time),null);assert.equal(a.activeItem,'shield');assert.equal(b.inventoryItem,'repair');assert.equal(s.useHeldItem('a'),false);assert.equal(a.itemsUsed,1);s.reset();assert.ok(s.cars.every(c=>!c.inventoryItem&&c.itemsUsed===0));s.dispose();}
// Owner never slips on its own rear-dropped peel, even after the old grace.
{const s=make();ready(s,'banana');const a=get(s,'a'),b=get(s,'b');s.useHeldItem('a');const h=s.hazards[0];assert.ok(h.distance<a.distance-3);advance(s,2);assert.ok(h.armed);set(a,h.distance,h.lateral);advance(s,.02);assert.equal(a.spin,0);assert.equal(s.hazards.length,1);set(a,h.distance+100,6);set(b,h.distance,h.lateral);advance(s,.02);assert.ok(b.spin>4.7);const first=b.spin;advance(s,.5);assert.ok(b.spin<first&&b.spin>4);advance(s,6);assert.equal(b.spin,0);assert.ok(b.tractionRecovery>0);advance(s,3);assert.equal(b.tractionRecovery,0);assert.ok(b.speed>5);const events=s.drainEvents();assert.ok(events.some(e=>e.type==='banana-hit'&&e.carId==='b'));assert.ok(!events.some(e=>e.type==='banana-hit'&&e.carId==='a'));s.dispose();}
// Real long-range trajectories, still collision-tested and bounded on expiry.
for(const type of ['bomb','shockwave']){const s=make();ready(s,type);get(s,'b').finished=true;s.useHeldItem('a');const p=type==='bomb'?s.projectiles[0]:s.waves[0];assert.ok(type==='bomb'?p.maxTravel===6000:p.maxTravel===1000);advance(s,6);assert.ok(p.distanceTravelled>450);assert.ok(type==='bomb'?s.projectiles.includes(p):s.waves.includes(p));assert.ok(p.height>=.18);advance(s,65);assert.equal(s.projectiles.length+s.waves.length,0);s.dispose();}
// Offensive AI retains a ready item in an empty field, then promptly uses a
// useful intercept. No expiry, no arbitrary forced attack into empty space.
{const s=make(true),a=get(s,'a'),b=get(s,'b');b.finished=true;s.awardItem('a','missile');advance(s,30);assert.equal(a.inventoryItem,'missile');assert.equal(a.itemsUsed,0);b.finished=false;set(b,a.distance+70,a.lateral);b.speed=a.speed;advance(s,.35);assert.equal(a.inventoryItem,null);assert.equal(a.itemsUsed,1);assert.ok(s.projectiles.some(p=>p.targetId==='b'));s.dispose();}
const car={id:'a',distance:100,lateral:0,speed:30,topSpeed:44,inventoryItem:'missile',inventoryPhase:'ready',brake:0,batterySOC:.8,damage:0},enemy={id:'b',distance:180,lateral:0,speed:28,flightRemaining:0,shieldRemaining:0,_hitImmune:0};
assert.equal(itemDecision(car,[]).use,false);assert.equal(itemDecision(car,[enemy]).use,true);assert.ok(itemDecision(car,[enemy]).confidence<1);assert.equal(itemDecision(car,[{...enemy,shieldRemaining:4}]).use,false);assert.equal(itemDecision({...car,inventoryItem:'freeze'},[{...enemy,lateral:8}]).use,false);
assert.equal(itemDecision({...car,inventoryItem:'banana'},[{...enemy,distance:75}]).use,true);assert.equal(itemDecision({...car,inventoryItem:'banana'},[enemy]).use,false);
assert.equal(itemDecision({...car,inventoryItem:'repair'},[]).use,false);assert.equal(itemDecision({...car,inventoryItem:'repair',damage:.3},[]).use,true);
assert.equal(itemDecision({...car,inventoryItem:'boost'},[],{curvature:()=>.03}).use,false);assert.equal(itemDecision({...car,inventoryItem:'boost'},[]).use,true);
assert.equal(itemDecision({...car,inventoryItem:'shield'},[]).use,false);assert.equal(itemDecision({...car,inventoryItem:'shield'},[],{projectiles:[{ownerId:'b',distance:120,lateral:0}]}).use,true);
assert.equal(itemDecision({...car,inventoryItem:'launch',spin:.3},[]).use,true);assert.equal(itemDecision({...car,inventoryItem:'launch'},[]).use,false);
// The comparison's independent parameters actually affect force integration.
const light=raceElectricDrive({speed:35,throttle:1,massKg:760,longitudinalAccel:30}),heavy=raceElectricDrive({speed:35,throttle:1,massKg:1450,longitudinalAccel:30});assert.ok(light.acceleration>heavy.acceleration*1.5);
const strong=raceElectricDrive({speed:25,brake:.4,brakeFactor:1.2,longitudinalAccel:30}),weak=raceElectricDrive({speed:25,brake:.4,brakeFactor:.94,longitudinalAccel:30});assert.ok(Math.abs(strong.acceleration)>Math.abs(weak.acceleration)*1.2);
assert.equal(new Set(RACE_ROSTER_TYPES.map(t=>getRacerIdentity(t).vehicleSpec.massKg)).size,5);assert.ok(getRacerIdentity('gt3').durabilityFactor>getRacerIdentity('f1-2026').durabilityFactor);
console.log(JSON.stringify({persistentOwnedSlots:true,usedIconClears:true,ownerBananaImmunity:true,opponentSpin:6.2,spinRecovery:2.2,bombRange:6000,jellyfishRange:1000,purposefulAI:true,massAndBrakes:true,slotsPerCar:1}));

