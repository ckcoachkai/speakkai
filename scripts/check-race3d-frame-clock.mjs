import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as clock from '../public/games/games/race3d-clock.js';
const source=readFileSync(new URL('../public/games/games/race3d.js',import.meta.url),'utf8');
const renderSource=source.slice(source.indexOf('  const render ='),source.indexOf('  const warmScene ='));
const frameSource=source.slice(source.indexOf('  const frame ='),source.indexOf('  let finishAt ='));
function run(initialPhase,finishTick=Infinity){
 const log={draws:0,audio:0,ui:0,steps:0,visual:[],car:[],camera:[],timeScale:null};
 const visual={update(dt){log.visual.push(dt);}},noop=()=>{};
 const cars=[{id:'a'}],simulation={cars,time:0,allFinished:false,update(dt){assert.equal(dt,1/12);this.time+=dt;log.steps++;if(log.steps===finishTick){this.allFinished=true;return 'a';}return null;},drainEvents:()=>[]};
 const context={...clock,Math,performance:{now:()=>100},STEP:1/60,SIMULATION_RATE:5,SCENE_SCALE:.2,
  alive:true,shaderReady:true,previous:0,elapsed:0,visualElapsed:0,raceElapsed:0,accumulator:0,raf:0,mode:initialPhase,playbackRate:5,cinematicRamps:false,
  camera:{position:{multiplyScalar:noop},updateMatrixWorld:noop},scene:{},simulation,standings:()=>cars,focusCar:()=>cars[0],focusedId:null,
  quality:{lodDistance:100,detailedCars:3},detailScale:1,qualityMode:'high',audioEvents:[],uiEvents:[],winnerId:null,finishAt:0,
  renderer:{render(){log.draws++;}},carModels:{update(track,dt){log.car.push(dt);},visualPose:()=>cars[0],drainFinishEvents:()=>[],finishSnapshot:()=>({complete:true}),setHiddenId:noop},
  effects:visual,velocityEffects:null,blastLighting:null,propulsionHud:null,scenery:null,water:null,streetlights:null,ramps:null,frogs:null,
  nitroExhaust:null,exhaustLighting:null,exhaustWake:null,slipstreamTrails:null,roadRabbits:null,contactShadows:null,festival:null,atmosphere:null,skySpirit:null,powerups:null,
  track:{},chaseCamera:{update(car,dt){log.camera.push(dt);},mode:'chase'},projectCars:noop,
  ui:{update(a,b,c,d,timing){log.ui++;log.timeScale=timing.timeScale;}},audio:{update(){log.audio++;}},
  selection:{update:noop},size:{},selectionAt:null,selectionProgress:0,SELECTION_SECONDS:3,COUNTDOWN:3,countdownAt:0,countdownElapsed:0,countdownCue:3,goAt:0,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),advancePlaybackRate:()=>5,reportEffects:noop,requestAnimationFrame:()=>1,
 };
 context.finish=id=>{context.winnerId=id;context.mode='finishing';};context.setPhase=phase=>{context.mode=phase;};
 vm.runInNewContext(renderSource+'\n'+frameSource+'\nframe(100);',context);
 return{context,log};
}
for(const phase of ['running','finishing']){const{log,context}=run(phase);assert.equal(log.steps,12);assert.equal(log.draws,1);assert.equal(log.audio,1);assert.equal(log.ui,1);assert.equal(log.timeScale,10);assert.equal(log.car.length,4);assert.ok(log.car.every(dt=>dt<=.05));assert.ok(Math.abs(log.car.reduce((a,b)=>a+b,0)-.2)<1e-12);assert.ok(Math.abs(context.raceElapsed-.1)<1e-12);assert.ok(Math.abs(log.camera.reduce((a,b)=>a+b,0)-1)<1e-10);}
const final=run('running',3);assert.equal(final.context.mode,'finished');assert.equal(final.log.steps,3);assert.equal(final.log.car.length,4);assert.equal(final.context.visualElapsed,.2);assert.ok(Math.abs(final.log.camera.reduce((a,b)=>a+b,0)-.25)<1e-10,'final camera frame is not multiplied by5 again');
for(const phase of ['selecting','countdown','idle']){const{context,log}=run(phase);assert.equal(log.steps,0);assert.ok(Math.abs(context.visualElapsed-.1)<1e-12);assert.equal(log.draws,1);assert.equal(log.audio,1);}
const finished=run('finished');assert.equal(finished.log.steps,0);assert.equal(finished.context.visualElapsed,.2);
console.log('PASS: actual main frame/render bodies preserve fixed simulation dt,12ticks/100ms,4visual substeps,one draw/UI/audio,normal selection/countdown,complete final frame and correct camera units');
