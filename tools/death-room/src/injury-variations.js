import * as THREE from 'three';
import {INJURY_RECIPES,INJURY_CATALOG_DESCRIPTION,validateInjuryCatalog} from './injury-variation-catalog.js';
export {INJURY_RECIPES,INJURY_CATALOG_DESCRIPTION,validateInjuryCatalog};
const LIMIT=192, MAX_SEQUENCES=8, TAU=Math.PI*2;
const FAMILY={
 crushing:{color:0xc4b4a1,gravity:-1.8,drag:2.2,life:.75,scale:.044,shape:'box',stretch:[1.3,.65,1],opacity:.62},
 boiler:{color:0xffb876,gravity:.8,drag:1.2,life:1.05,scale:.052,shape:'sphere',stretch:[1,1.6,1],opacity:.36},
 flood:{color:0x8cdbff,gravity:-2.8,drag:.5,life:.8,scale:.046,shape:'sphere',stretch:[.6,1.8,.6],opacity:.66},
 gas:{color:0xb5d4ad,gravity:.28,drag:2.8,life:1.3,scale:.063,shape:'sphere',stretch:[1.4,.9,1.4],opacity:.27},
 rats:{color:0xe7d9ad,gravity:-1.2,drag:1.5,life:.65,scale:.045,shape:'star',stretch:[1,1,1],opacity:.72},
 collapse:{color:0xaaa9a5,gravity:-3.1,drag:.6,life:.85,scale:.045,shape:'tetra',stretch:[1.5,.7,1],opacity:.67},
 electric:{color:0x9be8ff,gravity:0,drag:1.8,life:.46,scale:.08,shape:'box',stretch:[1.8,.15,.16],opacity:.9},
 freeze:{color:0xb0edff,gravity:-.35,drag:2.3,life:1.1,scale:.052,shape:'octa',stretch:[.7,1.6,.7],opacity:.73},
 spikes:{color:0xf0d39a,gravity:-2.3,drag:.9,life:.6,scale:.05,shape:'tetra',stretch:[1.6,.4,.5],opacity:.8},
 blood:{color:0x8f0712,gravity:-4.4,drag:.35,life:2.1,scale:.044,shape:'sphere',stretch:[.7,1.65,.7],opacity:.94},
 lasers:{color:0xf29dff,gravity:0,drag:3.3,life:.52,scale:.067,shape:'box',stretch:[.2,1.9,.08],opacity:.85},
};
const REGIONS={head:[0,1.68,0],chest:[0,1.1,0],shoulders:[0,1.43,0],leftHand:[-.42,1.1,.12],rightHand:[.42,1.1,.12],leftFoot:[-.17,.12,.08],rightFoot:[.17,.12,.08],feet:[0,.1,0]};
const BONE_NAMES={head:['bip01head'],chest:['bip01spine2','bip01spine1'],shoulders:['bip01neck'],leftHand:['bip01lhand'],rightHand:['bip01rhand'],leftFoot:['bip01lfoot'],rightFoot:['bip01rfoot']};
const PATTERNS=new Set(['ring','fan','jet','spiral','orbit','scatter','ripple','column','cross','zigzag','sheet','trail','halo','split','burst','sweep','funnel','arc','ladder','pinwheel','ray','comet']);
const FAMILIES=Object.keys(FAMILY),clamp=THREE.MathUtils.clamp;
function starGeometry(){const p=[];for(let i=0;i<10;i++){const a=i/10*TAU,b=(i+1)/10*TAU,r=i%2?.42:1,s=(i+1)%2?.42:1;p.push(0,0,0,Math.cos(a)*r,Math.sin(a)*r,0,Math.cos(b)*s,Math.sin(b)*s,0);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;}
export function createInjuryVariations({scene,actors=[],room={}}={}){
 if(!scene?.add)throw new TypeError('Injury variations require scene');
 const group=new THREE.Group();group.name='injury-variations';scene.add(group);
 const geometries={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,6,4),tetra:new THREE.TetrahedronGeometry(1),octa:new THREE.OctahedronGeometry(1),star:starGeometry()};
 const materials=[],meshes={};for(const hazard of FAMILIES){const f=FAMILY[hazard],m=new THREE.MeshBasicMaterial({color:f.color,transparent:true,opacity:f.opacity,depthWrite:false,side:THREE.DoubleSide});materials.push(m);const mesh=new THREE.InstancedMesh(geometries[f.shape],m,LIMIT);mesh.name=hazard+'-feedback';mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);meshes[hazard]=mesh;}
 const pool=Array.from({length:LIMIT},()=>({active:false,age:0,life:0,family:'crushing',pattern:'ring',phase:0,origin:new THREE.Vector3(),p:new THREE.Vector3(),v:new THREE.Vector3(),direction:new THREE.Vector3(),scale:1}));
 const scratch=new THREE.Object3D(),origin=new THREE.Vector3(),offset=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0),counts=Object.fromEntries(FAMILIES.map(h=>[h,0]));
 const catalog=Object.fromEntries(FAMILIES.map(h=>[h,INJURY_RECIPES.filter(r=>r.hazard===h)]));
 const bags=new Map(),lastRecipe=new Map(),cooldown=new Map(),sequences=[],history=[];
 const media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 let clock=0,enabled=true,disposed=false,accepted=0,rejected=0,spawned=0,dropped=0,peakParticles=0;
 const immune=a=>!a||a.invincible||a.id==='vip-456';
 function nextRecipe(h){let bag=bags.get(h);if(!bag?.length){bag=[...catalog[h]];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(bag.length>1&&bag.at(-1).id===lastRecipe.get(h))[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];bags.set(h,bag);}const r=bag.pop();lastRecipe.set(h,r.id);return r;}
 function worldPoint(actor,region){const boneNames=BONE_NAMES[region]||[];let bone;for(const name of boneNames){bone=actor._rig?.bones?.[name];if(bone)break;}if(bone?.getWorldPosition){bone.getWorldPosition(origin);return origin;}const base=REGIONS[region]||REGIONS.chest;origin.copy(actor.position||actor.root?.position||new THREE.Vector3());offset.set(...base).applyAxisAngle(axis,actor.root?.rotation.y||0);origin.add(offset);return origin;}
 function emit(actor,info={}){
  const hazard=info.scenarioId||info.hazard;
  if(disposed||!enabled||immune(actor)||actor.alive===false||info.stage==='dead'||info.fatal||Number(info.ratio)===0||!catalog[hazard]?.length||clock<(cooldown.get(actor.id)||0)||sequences.length>=MAX_SEQUENCES){rejected++;return false;}
  const recipe=nextRecipe(hazard);cooldown.set(actor.id,clock+1.85);const severity=clamp(1-(Number.isFinite(info.ratio)?info.ratio:.7),0,1);
  sequences.push({actor,recipe,start:clock,step:0,intensity:.4+severity*.48,severity});accepted++;history.push(recipe.id);if(history.length>64)history.shift();return recipe.id;
 }
 function burst(sequence,step){
  const {actor,recipe}=sequence,f=FAMILY[recipe.hazard],reduced=!!media?.matches;
  if(immune(actor)||actor.alive===false||actor.health?.current===0)return;
  if(!actor._frozenPose&&!reduced){actor.setReaction?.(step.reaction,sequence.intensity,.48);actor.setInjuryAccent?.(step.region,step.pattern,sequence.intensity,.48);}
  worldPoint(actor,step.region);const heading=actor.root?.rotation.y||0,n=reduced?3:8;
  let created=0;for(const p of pool){if(p.active)continue;const i=created,angle=i/n*TAU;p.active=true;p.age=0;p.life=f.life*(reduced?.65:1);p.family=recipe.hazard;p.pattern=reduced?'ripple':step.pattern;p.phase=angle;p.scale=f.scale*(reduced?.65:1);p.origin.copy(origin);p.p.copy(origin);p.v.set(Math.cos(angle),.35+Math.sin(angle)*.18,Math.sin(angle));
   switch(p.pattern){
    case 'ring':p.v.set(Math.cos(angle)*1.1,.12,Math.sin(angle)*1.1);break;
    case 'ripple':p.p.y=Math.max(.04,origin.y);p.v.set(Math.cos(angle)*.5,.025,Math.sin(angle)*.5);break;
    case 'fan':p.v.set(Math.sin((i/(n-1)-.5)*1.8)*1.2,.45,Math.cos((i/(n-1)-.5)*1.8));break;
    case 'jet':p.v.set((i%3-1)*.10,.18+(i%2)*.08,1.55);break;
    case 'column':p.p.x+=(i%2?1:-1)*.06;p.v.set(Math.cos(angle)*.1,1.15+i*.03,Math.sin(angle)*.1);break;
    case 'cross':p.v.set(i%2?(i%4<2?1:-1):0,i%2?0:(i%4<2?1:-1),.16);break;
    case 'sheet':p.p.x+=(i/(n-1)-.5)*.65;p.v.set(0,.25,-.6);break;
    case 'trail':p.p.z-=i*.06;p.v.set((i%2?1:-1)*.15,.2,-1.0);break;
    case 'halo':p.p.set(origin.x+Math.cos(angle)*.22,origin.y+.15,origin.z+Math.sin(angle)*.22);p.v.set(Math.cos(angle)*.2,.38,Math.sin(angle)*.2);break;
    case 'split':p.v.set((i%2?1:-1)*1.2,.22+(i%3)*.12,(i%4<2?1:-1)*.18);break;
    case 'scatter':p.v.set(Math.sin(i*12.989)*1.4,.15+Math.abs(Math.cos(i*7.31))*.7,Math.cos(i*8.18)*1.4);break;
    case 'burst':p.v.set(Math.cos(angle)*1.3,.4+Math.sin(angle)*.6,Math.sin(angle)*1.3);break;
    case 'sweep':p.p.x+=(i/(n-1)-.5)*.4;p.v.set(1.3,.08,-.2);break;
    case 'funnel':p.p.x+=Math.cos(angle)*.28;p.p.z+=Math.sin(angle)*.28;p.v.set(-Math.cos(angle)*.45,.9,-Math.sin(angle)*.45);break;
    case 'arc':p.v.set((i/(n-1)-.5)*1.5,.65+Math.sin(i/n*Math.PI)*.55,.3);break;
    case 'ladder':p.p.y+=i*.055;p.v.set(i%2?.4:-.4,.42,0);break;
    case 'ray':p.v.set(.95,.5+(i%3)*.045,.95);p.p.addScaledVector(p.v,i*.02);break;
    case 'comet':p.v.set(-1.1,.4,.65);p.p.addScaledVector(p.v,-i*.045);p.scale*=1-i/n*.65;break;
    case 'zigzag':p.v.set(i%2?1:-1,.25,.8);break;
    case 'spiral':case 'orbit':case 'pinwheel':p.v.set(0,p.pattern==='spiral'?.5:.08,0);break;
   }
   p.v.applyAxisAngle(axis,heading);p.direction.copy(p.v);created++;spawned++;if(created===n)break;
  }if(created<n)dropped+=n-created;
  if(!reduced&&['crushing','rats','collapse','spikes','lasers'].includes(recipe.hazard))bloodBurst(sequence,step);
  else if(!reduced&&sequence.severity>.65&&['boiler','electric','gas'].includes(recipe.hazard))bloodBurst(sequence,step,2);
 }

 function bloodBurst(sequence,step,amount=5){
  const actor=sequence.actor;worldPoint(actor,step.region);const heading=actor.root?.rotation.y||0;let n=0;
  for(const p of pool){if(p.active)continue;const angle=n/amount*TAU;p.active=true;p.age=0;p.life=FAMILY.blood.life;p.family='blood';p.pattern='blood-'+step.pattern;p.phase=angle;p.scale=FAMILY.blood.scale*(.7+sequence.severity*.8);p.origin.copy(origin);p.p.copy(origin);
   // Cuts spray directional streaks; blunt contacts throw a wider radial shower.
   const narrow=['ray','jet','comet','trail'].includes(step.pattern);p.v.set(narrow?(n-amount/2)*.12:Math.cos(angle)*(1+sequence.severity),.55+(n%3)*.22,narrow?1.5:Math.sin(angle)*(1+sequence.severity));p.v.applyAxisAngle(axis,heading);p.direction.copy(p.v);n++;spawned++;if(n===amount)break;
  }if(n<amount)dropped+=amount-n;
 }
 function update(dt,state={}){
  if(disposed||!enabled||state.phase==='paused'||state.paused)return;dt=clamp(Number.isFinite(dt)?dt:0,0,.1);clock+=dt;
  for(let i=sequences.length-1;i>=0;i--){const q=sequences[i];if(q.actor.alive===false||q.actor.health?.current===0||immune(q.actor)){sequences.splice(i,1);continue;}while(q.step<q.recipe.steps.length&&clock-q.start>=q.recipe.steps[q.step].at){burst(q,q.recipe.steps[q.step++]);}if(q.step===q.recipe.steps.length)sequences.splice(i,1);}
  for(const h of FAMILIES)counts[h]=0;let active=0;
  for(const p of pool){if(!p.active)continue;p.age+=dt;if(p.age>=p.life){p.active=false;continue;}const f=FAMILY[p.family],t=p.age;
   if(p.pattern==='spiral'||p.pattern==='orbit'||p.pattern==='pinwheel'){const speed=p.pattern==='pinwheel'?11:6,radius=p.pattern==='orbit'?.25:.06+t*.55;p.p.set(p.origin.x+Math.cos(p.phase+t*speed)*radius,p.origin.y+(p.pattern==='spiral'?t*.7:Math.sin(p.phase+t*speed)*.035),p.origin.z+Math.sin(p.phase+t*speed)*radius);}
   else{p.v.multiplyScalar(Math.exp(-f.drag*dt));p.v.y+=f.gravity*dt;p.p.addScaledVector(p.v,dt);if(p.pattern==='zigzag')p.p.x+=Math.sin(t*28+p.phase)*dt*.45;}
   const splat=p.family==='blood'&&p.p.y<=(room.floorY||0)+.014;if(splat){p.p.y=(room.floorY||0)+.014;p.v.set(0,0,0);}const life=Math.min(1,(p.life-p.age)/.22),size=p.scale*life;scratch.position.copy(p.p);scratch.rotation.set(t*3+p.phase,t*2,p.phase);scratch.scale.set(size*f.stretch[0],size*f.stretch[1],size*f.stretch[2]);if(splat){scratch.rotation.set(0,p.phase,0);scratch.scale.set(size*2.8,size*.035,size*1.8);}scratch.updateMatrix();const mesh=meshes[p.family];mesh.setMatrixAt(counts[p.family]++,scratch.matrix);active++;
  }
  peakParticles=Math.max(peakParticles,active);for(const h of FAMILIES){const mesh=meshes[h];mesh.count=counts[h];mesh.visible=counts[h]>0;if(counts[h])mesh.instanceMatrix.needsUpdate=true;}
 }
 function reset(){for(const p of pool)p.active=false;sequences.length=0;cooldown.clear();for(const m of Object.values(meshes)){m.count=0;m.visible=false;}/* Bags intentionally survive room resets so recipes do not immediately repeat. */}
 function setEnabled(value){enabled=!!value;group.visible=enabled;if(!enabled)reset();}
 function dispose(){if(disposed)return;reset();disposed=true;group.removeFromParent();Object.values(geometries).forEach(g=>g.dispose());materials.forEach(m=>m.dispose());Object.values(meshes).forEach(m=>m.dispose());bags.clear();cooldown.clear();}
 return {emit,update,setEnabled,reset,dispose,get stats(){return {catalogCount:INJURY_RECIPES.length,description:INJURY_CATALOG_DESCRIPTION,activeSequences:sequences.length,maxSequences:MAX_SEQUENCES,particles:pool.reduce((n,p)=>n+Number(p.active),0),particleLimit:LIMIT,peakParticles,drawCalls:Object.values(meshes).filter(m=>m.visible).length,accepted,rejected,spawned,dropped,enabled,disposed,reducedMotion:!!media?.matches,lastRecipes:[...history],counts:validateInjuryCatalog().counts};}};
}
export default createInjuryVariations;
