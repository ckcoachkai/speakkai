import assert from 'node:assert/strict';
import {RACE_PLAYBACK_SPEED,FIXED_CLOCK_EPSILON,raceFrameSeconds,visualFrameSeconds,forEachVisualStep} from '../public/games/games/race3d-clock.js';
const STEP=1/60,SIMULATION_RATE=5;
function clock(hz,seconds=10){let accumulator=0,ticks=0,simulation=0,raceElapsed=0,visual=0,maxSteps=0;
 for(let frame=0;frame<hz*seconds;frame++){
  const dt=1/hz;accumulator+=raceFrameSeconds(dt,'running');let steps=0;
  while(accumulator+FIXED_CLOCK_EPSILON>=STEP){accumulator=Math.max(0,accumulator-STEP);ticks++;steps++;simulation+=STEP*SIMULATION_RATE;raceElapsed+=STEP*SIMULATION_RATE/(SIMULATION_RATE*RACE_PLAYBACK_SPEED);}
  maxSteps=Math.max(maxSteps,steps);forEachVisualStep(visualFrameSeconds(dt,'running'),s=>{assert.ok(s<=.05);visual+=s;});
 }
 return{ticks,simulation,raceElapsed,visual,maxSteps,accumulator};
}
for(const hz of [15,30,60,120,144]){const result=clock(hz);assert.equal(result.ticks,1200,`${hz}Hz tick count`);assert.ok(Math.abs(result.simulation-100)<1e-8);assert.ok(Math.abs(result.raceElapsed-10)<1e-8);assert.ok(Math.abs(result.visual-20)<1e-8);}
assert.equal(clock(10,.1).maxSteps,12,'100ms hitch uses at most 12 unchanged physics ticks');
for(const phase of ['idle','selecting','countdown','finished'])assert.equal(raceFrameSeconds(.1,phase),0);
for(const phase of ['idle','selecting','countdown'])assert.equal(visualFrameSeconds(.1,phase),.1);
assert.equal(visualFrameSeconds(.1,'finished'),.2,'finish celebration continues the visual clock');
let consumed=0,calls=0;const finalFrame=visualFrameSeconds(.1,'finishing');
// A physics tick changes phase halfway through this frame. Its visual budget is retained.
forEachVisualStep(finalFrame,(dt,fraction)=>{assert.ok(dt<=.05);consumed+=dt;calls++;assert.equal(fraction,.25);});
assert.equal(calls,4);assert.ok(Math.abs(consumed-.2)<1e-12);
let zero=0;forEachVisualStep(0,dt=>{assert.equal(dt,0);zero++;});assert.equal(zero,1,'zero-time warm/reset renders still place objects');
console.log('PASS: 1200 ticks/10s at15/30/60/120/144Hz; 12 ticks/100ms; 10s displayed and20s visual; normal selection/countdown; bounded complete final-frame visuals; zero-time placement');
