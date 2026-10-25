import * as THREE from '../public/games/assets/vendor/three.module.js';
import assert from 'node:assert/strict';
import {createRaceTrack} from '../public/games/games/race3d-track.js';
import {createRaceSimulation} from '../public/games/games/race3d-physics.js';
import {RACE_ROSTER_TYPES,getRacerIdentity} from '../public/games/games/race3d-roster.js';
const real=createRaceTrack(THREE),straight={totalLength:1000,raceDistance:1000,width:16.5,hazards:[],sampleTrack:d=>({position:{x:0,y:0,z:d},tangent:{x:0,y:0,z:1},right:{x:1,y:0,z:0},width:16.5})};
const scale=.55,technical={totalLength:real.totalLength*scale,raceDistance:real.totalLength*scale,width:16.5,hazards:[],sampleTrack:d=>real.sampleTrack(d/scale)};
const durability={...real,raceDistance:real.totalLength,hazards:Array.from({length:18},(_,i)=>({id:'contact-'+i,type:'cone',distance:(i+1)*real.totalLength/20,lateral:0,radius:20}))};
real.raceDistance=real.totalLength;
const courses=[['straight1000m',straight],['productionCircuit',real],['technical55percent',technical],['contactEndurance',durability]],baseline={};
for(const [name,track]of courses){baseline[name]={};for(const type of RACE_ROSTER_TYPES){const s=createRaceSimulation({players:[{id:'paired',name:'Probe',...getRacerIdentity(type)}],track,random:()=>.42,autoItems:false});s.pickups.length=0;s.ramps.length=0;const c=s.cars[0];Object.assign(c,{lateral:0,preferredLane:0,_nextMistake:Infinity,_nextDecision:Infinity,_pace:1,_brakeTiming:1});let to30=null;for(let t=0;t<600&&!s.allFinished;t+=1/60){s.update(1/60);if(to30===null&&c.speed>=30)to30=s.time;}baseline[name][type]={finish:Number(c.finishTime?.toFixed(3)),to30:to30===null?null:Number(to30.toFixed(3)),damage:Number(c.damage.toFixed(3)),replacements:c.replacements};s.dispose();}}
const competitive=[];
for(let seed=0;seed<40;seed++){
 const s=createRaceSimulation({players:RACE_ROSTER_TYPES.map((_,i)=>({id:'driver-'+i,name:'Driver '+i,...getRacerIdentity(RACE_ROSTER_TYPES[(i+seed)%5])})),track:real,random:()=>((Math.imul(seed+1,2654435761)>>>0)+.5)/4294967296});
 for(let t=0;t<500&&!s.allFinished;t+=.25)s.update(.25);
 competitive.push({seed,complete:s.allFinished,order:s.results.map(r=>s.cars.find(c=>c.id===r.id).racerType),times:s.results.map(r=>Number(r.finishTime.toFixed(2)))});s.dispose();
}
const wins=Object.fromEntries(RACE_ROSTER_TYPES.map(t=>[t,competitive.filter(r=>r.order[0]===t).length]));
const courseWinners=Object.values(baseline).map(table=>Object.entries(table).sort((a,b)=>a[1].finish-b[1].finish)[0][0]);
console.log(JSON.stringify({baseline,competitive,wins,courseWinners,allCompleted:competitive.every(r=>r.complete),slots:1,limitations:['Reference-informed cars span different classes; solo speed parity is not claimed.','40 item-enabled seeds are a limited sample, not proof of equal win odds.','One held slot each; no automatic weakest-car designation or untested double-slot advantage.']},null,2));
assert.ok(competitive.every(r=>r.complete));assert.ok(Math.max(...Object.values(wins))<competitive.length*.75,'no car wins 75% of sampled races');
// Class references changed the old fictional-tuning ranking. Test observable
// tradeoffs rather than requiring a named manufacturer's concept to beat F1.
assert.ok(new Set(Object.values(baseline.straight1000m).map(c=>c.to30)).size>1,'acceleration differs');
const wear=Object.values(baseline.contactEndurance).map(c=>c.damage+c.replacements);assert.ok(Math.min(...wear)<Math.max(...wear)*.8,'durability affects endurance wear');
real.dispose();
