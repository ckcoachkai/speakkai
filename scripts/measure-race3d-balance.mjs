import fs from 'node:fs';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createRaceTrack} from '../public/games/games/race3d-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {RACE_ROSTER_TYPES as types,getRacerIdentity} from '../public/games/games/race3d-roster.js';
const out=process.argv[2]||'balance-measure.json',count=Number(process.argv[3]||20),modes=process.argv[4]==='baseline'?['equal']:['equal','varied'];
const real=createRaceTrack(THREE);real.raceDistance=real.totalLength;
const straight={totalLength:1600,raceDistance:1600,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5})};
const technical={...real,totalLength:real.totalLength*.62,raceDistance:real.totalLength*.62,sampleTrack:d=>real.sampleTrack(d/.62)};
const tracks=[['straight',straight],['circuit',real],['technical',technical]],rows=[];
const rand=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
const save=()=>fs.writeFileSync(out,JSON.stringify({count,modes,rows},null,2));
for(const mode of modes)for(const [course,track]of tracks){
 for(let seed=0;seed<count;seed++){
  const rng=rand(seed*7919+314159),deck=[...types];for(let i=4;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const sim=createRaceSimulation({players:deck.map((t,i)=>({id:'slot-'+i,name:'Generic '+i,...getRacerIdentity(t)})),track,random:rng,driverMode:mode});
  if(course==='straight')sim.ramps.length=0;
  for(const c of sim.cars)if(mode==='equal')Object.assign(c,{_nextMistake:Infinity,_nextDecision:Infinity,_pace:1,_brakeTiming:1});
  for(let t=0;t<300&&!sim.allFinished;t+=.25)sim.update(.25);
  rows.push({mode,course,seed,complete:sim.allFinished,results:sim.results.map(r=>{const c=sim.cars.find(c=>c.id===r.id);return {type:c.racerType,grid:c.gridPosition,time:r.finishTime,driver:c.driverSkills||null};})});sim.dispose();
 }
 save();console.log(JSON.stringify({mode,course,complete:rows.filter(r=>r.mode===mode&&r.course===course).every(r=>r.complete),wins:Object.fromEntries(types.map(t=>[t,rows.filter(r=>r.mode===mode&&r.course===course&&r.results[0]?.type===t).length]))}));
}
real.dispose();save();
