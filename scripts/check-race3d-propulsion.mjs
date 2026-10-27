import assert from 'node:assert/strict';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {getRacerIdentity,RACE_ROSTER_TYPES} from '../public/games/games/race3d-roster.js';
const track={totalLength:4000,raceDistance:1e7,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5,bank:0})};
const advance=(s,t,observe=()=>{})=>{for(let n=0;n<t-1e-8;n+=1/120){s.update(1/120);observe(s.cars[0]);}};
function ready(type,item){const s=createRaceSimulation({players:[{id:'test',name:'Generic test',...getRacerIdentity(type)}],track,random:()=>.37,autoItems:false});s.pickups.length=s.ramps.length=0;const c=s.cars[0];c._nextMistake=c._nextDecision=Infinity;assert.ok(s.awardItem(c.id,item));advance(s,4.51);Object.assign(c,{distance:100,previousProgress:100,lateral:0,preferredLane:0,heading:0,speed:30});assert.ok(s.useHeldItem(c.id));assert.equal(c.inventoryItem,null);return {s,c};}
const samples=[];
for(const type of RACE_ROSTER_TYPES){
 const {s,c}=ready(type,'launch');
 let peak=0,flight=0,motorInAir=0,land=null;
 const vy=c.verticalVelocity;
 assert.ok(c.launchBlastRemaining>0);
 // The stronger launch uses a bounded mass-dependent vertical impulse.
 // Its measured apex must follow gravity rather than an arbitrary animation.
 assert.ok(vy>=22&&vy<=26,type+' bounded launch velocity');
 advance(s,12,c=>{
  peak=Math.max(peak,c.flightHeight);
  if(c.flightRemaining>0){flight+=1/120;motorInAir=Math.max(motorInAir,Math.abs(c.motorPowerW));}
  assert.ok(Number.isFinite(c.flightHeight+c.speed+c.verticalVelocity));
  for(const e of s.drainEvents())if(e.type==='extra-launch-land')land=e;
 });
 assert.ok(peak>24.5&&peak<35,type+' launch apex stays within physical safety bounds');
 assert.ok(Math.abs(peak-vy*vy/(2*9.81))<.03,type+' ballistic apex follows gravity');
 assert.ok(flight>4.4&&flight<5.4,type+' bounded ballistic airtime');
 assert.ok(Math.abs(flight-2*vy/9.81)<.03,type+' ballistic airtime follows gravity');
 assert.equal(motorInAir,0,'tyre propulsion disabled in air');
 assert.ok(land?.successful&&land.fullFlips>=1,type+' launch earns flips through a safe landing');
 assert.ok(c.completedFlips>=1&&c.trickSpeedBonus>0&&c.trickSpeedBonus<=10);
 assert.equal(c.flightRemaining,0);assert.equal(c.launchBlastRemaining,0);
 assert.equal(c.rampState,'ground');assert.equal(c.airAttitude,null);
 samples.push({type,launchVelocity:vy,peak,flight,fullFlips:land.fullFlips,motorInAir});
 s.reset();assert.equal(s.cars[0].launchBlastRemaining,0);s.dispose();

 const r=ready(type,'rocket');
 let impulse=0,thrust=false,maxHeight=0,rocketMotorInAir=0,rocketLand=null;
 advance(r.s,12,c=>{
  impulse+=Math.max(0,c.rocketVectorThrust||0)/120;thrust||=c.rocketVectorThrust>0;
  assert.ok((c.rocketVectorThrust||0)<=4.00001,'bounded instantaneous rocket lift');
  maxHeight=Math.max(maxHeight,c.flightHeight);
  if(c.flightRemaining>0)rocketMotorInAir=Math.max(rocketMotorInAir,Math.abs(c.motorPowerW));
  assert.ok(Number.isFinite(c.speed+c.flightHeight+c.verticalVelocity));
  for(const e of r.s.drainEvents())if(e.type==='extra-rocket-land')rocketLand=e;
 });
 assert.ok(thrust);assert.ok(impulse>9.9&&impulse<=10.00001,'finite ten metre-per-second lift budget');
 assert.ok(maxHeight>16&&maxHeight<30,type+' bounded stronger rocket height');
 assert.equal(rocketMotorInAir,0,'rocket never applies tyre engine force in air');
 assert.ok(rocketLand?.successful,type+' rocket lands safely');
 assert.equal(r.c.flightRemaining,0);assert.equal(r.c.rocketRemaining,0);assert.equal(r.c.rocketVectorThrust,0);
 assert.equal(r.c.rampState,'ground');assert.equal(r.c.airAttitude,null);
 Object.assign(samples.at(-1),{rocketPeak:maxHeight,rocketImpulse:impulse,rocketMotorInAir});
 r.s.dispose();
}
// EMP suppresses both rendered force fields and the actual extra lift budget.
{const {s,c}=ready('gt3','rocket');c.itemEffects.emp=2;const budget=c._rocketLiftBudget;advance(s,.5);assert.equal(c.rocketVectorThrust,0);assert.equal(c.rocketAcceleration,0);assert.equal(c._rocketLiftBudget,budget);s.dispose();}
console.log(JSON.stringify({types:samples,finiteRocketImpulse:10,gravity:9.81,expiryAndReset:true,safeLandings:true,noAirborneTyrePropulsion:true,empSuppressesActualThrust:true}));
