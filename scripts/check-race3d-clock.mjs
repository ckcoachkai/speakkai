import assert from 'node:assert/strict';
import {RACE_PLAYBACK_SPEED,PLAYBACK_SPEEDS,resolvePlaybackSpeed,FIXED_CLOCK_EPSILON,raceFrameSeconds,visualFrameSeconds,forEachVisualStep} from '../public/games/games/race3d-clock.js';
const STEP=1/60,SIMULATION_RATE=5;
function clock(hz,seconds=10,speed=RACE_PLAYBACK_SPEED){let accumulator=0,ticks=0,simulation=0,raceElapsed=0,visual=0,maxSteps=0;
 for(let frame=0;frame<hz*seconds;frame++){
  const dt=1/hz;accumulator+=raceFrameSeconds(dt,'running',speed);let steps=0;
  while(accumulator+FIXED_CLOCK_EPSILON>=STEP){accumulator=Math.max(0,accumulator-STEP);ticks++;steps++;simulation+=STEP*SIMULATION_RATE;raceElapsed+=STEP*SIMULATION_RATE/(SIMULATION_RATE*speed);}
  maxSteps=Math.max(maxSteps,steps);forEachVisualStep(visualFrameSeconds(dt,'running',speed),s=>{assert.ok(s<=.05);visual+=s;});
 }
 return{ticks,simulation,raceElapsed,visual,maxSteps,accumulator};
}
for(const speed of PLAYBACK_SPEEDS)for(const hz of [15,30,60,120,144]){const result=clock(hz,10,speed);assert.equal(result.ticks,600*speed,`${hz}Hz at${speed}x tick count`);assert.ok(Math.abs(result.simulation-50*speed)<1e-8);assert.ok(Math.abs(result.raceElapsed-10)<1e-8);assert.ok(Math.abs(result.visual-10*speed)<1e-8);}
for(const speed of PLAYBACK_SPEEDS)assert.equal(clock(10,.1,speed).maxSteps,6*speed,'100ms hitch preserves unchanged ticks at every speed');
assert.equal(clock(60).ticks,1200,'default remains2x');
for(const invalid of [undefined,null,0,-1,6,2.5,'garbage',Infinity])assert.equal(resolvePlaybackSpeed(invalid),2);
for(const speed of PLAYBACK_SPEEDS)assert.equal(resolvePlaybackSpeed(String(speed)),speed);
for(const phase of ['idle','selecting','countdown','finished'])assert.equal(raceFrameSeconds(.1,phase),0);
for(const phase of ['idle','selecting','countdown'])assert.equal(visualFrameSeconds(.1,phase),.1);
assert.equal(visualFrameSeconds(.1,'finished'),.2,'finish celebration continues the visual clock');
let consumed=0,calls=0;const finalFrame=visualFrameSeconds(.1,'finishing');
// A physics tick changes phase halfway through this frame. Its visual budget is retained.
forEachVisualStep(finalFrame,(dt,fraction)=>{assert.ok(dt<=.05);consumed+=dt;calls++;assert.equal(fraction,.25);});
assert.equal(calls,4);assert.ok(Math.abs(consumed-.2)<1e-12);
let zero=0;forEachVisualStep(0,dt=>{assert.equal(dt,0);zero++;});assert.equal(zero,1,'zero-time warm/reset renders still place objects');
console.log('PASS: speeds1-5 at15/30/60/120/144Hz; exact fixed ticks and displayed time;6-30ticks/100ms;default2;invalid values;normal selection/countdown;bounded complete final-frame visuals');
