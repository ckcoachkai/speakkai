import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {WORLD,STRIDE,advanceRunner,runnerPose} from '../src/scripts/forest/motion.js';
import {drawWinner,raceBase} from '../src/scripts/forest/selection.js';

test('draw covers every eligible student equally and rejects biased random tail',()=>{
 const eligible=[5,2,9];const counts=new Map(eligible.map(i=>[i,0]));
 for(let n=0;n<300;n++){const winner=drawWinner(eligible,()=>n);counts.set(winner,counts.get(winner)+1);}
 assert.deepEqual([...counts.values()],[100,100,100]);
 const values=[4294967295,2];assert.equal(drawWinner(eligible,()=>values.shift()),9);
 assert.equal(drawWinner([],()=>0),null);
 const remaining=[0,1,2,3,4,5],order=[];
 while(remaining.length){const winner=drawWinner(remaining,()=>17);order.push(winner);remaining.splice(remaining.indexOf(winner),1);}
 assert.equal(new Set(order).size,6);assert.notDeepEqual(order,[0,1,2,3,4,5]);
});

test('randomly drawn winner reaches mouth first regardless of roster order or starting column',()=>{
 for(const fps of [30,60,120])for(let winner=0;winner<6;winner++){
  const runners=Array.from({length:6},(_,i)=>{const start=160+(i%4)*145;return {...runner(),i,start,base:raceBase(start,WORLD.finishX,i===winner,0.999)};});
  let first=null;
  for(let frame=0;frame<fps*30&&first===null;frame++){
   for(const s of runners){advanceRunner(s,1/fps,frame/fps);if(s.progress>=.27)s.boost=true;}
   first=runners.filter(s=>s.progress>=1).sort((a,b)=>b.progress-a.progress)[0]?.i??null;
  }
  assert.equal(first,winner);
 }
});

const runner = () => ({i:0,start:160,ground:1280,distance:0,phase:0,speed:0,progress:0,base:1,boost:false});
const mouth={x:2744,y:1035};
test('camera halves apparent size and every starting column is on-screen',()=>{
 assert.equal(WORLD.cameraScale,.5);assert.equal(WORLD.width,3200);
 for(let i=0;i<30;i++){const s={...runner(),i,start:160+(i%4)*145};const p=runnerPose(s,mouth);assert.ok(p.x>p.w/2);assert.ok(p.x<WORLD.width*.25);}
});
test('strides follow actual travelled distance; frame rates give comparable movement',()=>{
 const results=[];
 for(const fps of [30,60,120]){
  const s=runner();let contacts=0;
  for(let frame=0;frame<fps*4;frame++)if(advanceRunner(s,1/fps,frame/fps))contacts++;
  assert.ok(s.distance>450);assert.equal(contacts,Math.floor(s.phase/Math.PI));
  assert.ok(Math.abs(s.phase-s.distance/STRIDE*Math.PI*2)<1e-8);results.push(s.distance);
 }
 assert.ok(Math.max(...results)-Math.min(...results)<6);
});
test('banana boost accelerates smoothly instead of teleporting',()=>{
 const normal=runner();for(let i=0;i<120;i++)advanceRunner(normal,1/60,i/60);
 const boosted={...normal,boost:true},before=boosted.speed;
 advanceRunner(boosted,1/60,2);assert.ok(boosted.speed>before&&boosted.speed<before*1.2);
 for(let i=0;i<120;i++){advanceRunner(normal,1/60,2+i/60);advanceRunner(boosted,1/60,2+i/60);}
 assert.ok(boosted.distance>normal.distance*1.3);
});
test('paused poses remain fixed, motion is continuous and redness grows gradually',()=>{
 const s=runner();for(let i=0;i<300;i++)advanceRunner(s,1/60,i/60);
 const pose=runnerPose(s,mouth);assert.deepEqual(runnerPose(s,mouth),pose);
 advanceRunner(s,1/120,5);const next=runnerPose(s,mouth);assert.ok(Math.abs(next.x-pose.x)<6);assert.ok(Math.abs(next.y-pose.y)<12);
 assert.ok(runnerPose({...s,progress:.8},mouth).redness>runnerPose({...s,progress:.2},mouth).redness);
 assert.ok(runnerPose(s,mouth,true).bob<runnerPose(s,mouth,false).bob);
});
test('final approach reaches the mouth and finishes in a bounded time',()=>{
 const s=runner();let age=0;while(s.progress<1&&age<40){advanceRunner(s,1/60,age);if(s.progress>.27)s.boost=true;age+=1/60;}
 assert.ok(age>5&&age<25);const p=runnerPose(s,mouth);assert.equal(p.x,mouth.x);assert.equal(p.leap,1);
});
test('all six effects match the ElevenLabs generation manifest',async()=>{
 const m=JSON.parse(await readFile('docs/forest-sfx-manifest.json','utf8'));
 assert.equal(m.provider,'ElevenLabs');assert.equal(m.effects.length,6);
 for(const effect of m.effects){const bytes=await readFile(`public/forest/sfx/${effect.file}`);assert.equal(createHash('sha256').update(bytes).digest('hex'),effect.sha256);assert.ok(effect.seconds>.2&&effect.seconds<2);const deployed=await readFile(`dist/forest/sfx/${effect.file}`);assert.equal(createHash('sha256').update(deployed).digest('hex'),effect.sha256);}
});
