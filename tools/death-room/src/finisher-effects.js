import * as THREE from 'three';

// Adult fictional game finishers. Purely visual: never changes health or actor transforms.
export const FINISHER_IDS=Object.freeze(['crushing','boiler','flood','gas','rats','collapse','electric','freeze','spikes','lasers']);
const CAP=256,MAX=4,TAU=Math.PI*2;
const COLORS={blood:0x9c071b,ice:0xa7eaff,spark:0x79dcff,stone:0x84766b,gas:0x8fb84d,water:0x63b6d4,laser:0xff246c,rat:0x352b30,ember:0xffae35};
export function createFinisherEffects({scene,room={}}={}){
 if(!scene?.add)throw new TypeError('Finishers require a scene');
 const root=new THREE.Group();root.name='adult-cinematic-finishers';scene.add(root);
 const geometry=new THREE.OctahedronGeometry(1,0),meshes={},materials=[];
 for(const [kind,color] of Object.entries(COLORS)){const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false});materials.push(material);const m=new THREE.InstancedMesh(geometry,material,CAP);m.name=`finisher-${kind}`;m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(m);meshes[kind]=m;}
 const pool=Array.from({length:CAP},()=>({on:false,p:new THREE.Vector3(),v:new THREE.Vector3(),scale:new THREE.Vector3(),age:0,life:1,gravity:0,kind:'blood',spin:0}));
 const dummy=new THREE.Object3D(),sequences=[],seen=new Set(),media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 let enabled=true,bloodEnabled=true,disposed=false,accepted=0,dropped=0,peak=0,delegated=0;
 const floor=room.floorY??0;
 function particle(kind,origin,x,y,z,vx,vy,vz,scale=.06,life=1.5,gravity=-3,stretch=[1,1,1]){
  if(kind==='blood'&&!bloodEnabled)return;
  const p=pool.find(p=>!p.on);if(!p){dropped++;return;}p.on=true;p.kind=kind;p.p.copy(origin).add(new THREE.Vector3(x,y,z));p.v.set(vx,vy,vz);p.scale.set(...stretch).multiplyScalar(scale);p.age=0;p.life=life;p.gravity=gravity;p.spin=x*17+z*11;
 }
 function ring(s,kind,n,radius,y,speed,vertical,stretch=[1,1,1]){for(let i=0;i<n;i++){const a=i/n*TAU;particle(kind,s.origin,Math.cos(a)*radius,y,Math.sin(a)*radius,Math.cos(a)*speed,vertical,Math.sin(a)*speed,.06,1.55,-2.5,stretch);}}
 function stage(s,k){
  if(media?.matches){if(k===0)ring(s,s.id==='freeze'?'ice':'spark',6,.22,.8,.1,.08);return;}
  switch(s.id){
   case 'crushing': // Compressing outline -> broad horizontal impact -> settling floor spray.
    if(k===0){for(let i=0;i<14;i++)particle('stone',s.origin,(i%2?1:-1)*.65,.25+i*.095,0,(i%2?-1:1)*1.7,0,0,.065,.45,0,[.5,1.5,.5]);}
    else ring(s,k===1?'blood':'stone',k===1?36:18,.12,.18,k===1?3.1:1.0,k===1?.6:.2,[2,.45,1]);break;
   case 'spikes': // Narrow upward fountain, hanging arc then downward pin rain.
    if(k<2){for(let i=0;i<24;i++){const a=i/24*TAU;particle(k?'blood':'spark',s.origin,Math.cos(a)*.14,.2,Math.sin(a)*.14,Math.cos(a)*.6,3.1+k*.8,Math.sin(a)*.6,.045,2,-4,[.55,2.4,.55]);}}
    else ring(s,'blood',20,.55,1.8,.5,-1,[.5,2,.5]);break;
   case 'lasers': // Three staggered cut planes, followed by opposite-direction red ribbons.
    for(let i=0;i<24;i++){const x=(i/23-.5)*1.8;particle(k===2?'blood':'laser',s.origin,x,.4+k*.55,Math.sin(i)*.05,k===2?(i%2?2:-2):.1,.08,0,.045,1.1, k===2?-2:0,[3,.25,.25]);}break;
   case 'rats': // Encircling dark swarm converges, recoils, then disperses.
    if(k===0){for(let i=0;i<24;i++){const a=i/24*TAU;particle('rat',s.origin,Math.cos(a)*1.2,.12,Math.sin(a)*1.2,-Math.cos(a)*2,.1,-Math.sin(a)*2,.065,.55,0,[1.6,.6,.7]);}}
    else ring(s,k===1?'blood':'rat',26,.2,.22,k===1?2.2:1.3,.7,[1.5,.7,.7]);break;
   case 'electric': // Rising conductive helix, angular star discharge, falling red sparks.
    for(let i=0;i<30;i++){const a=i/30*TAU*3;particle(k===2?'blood':'spark',s.origin,Math.cos(a)*.4,i/30*1.7,Math.sin(a)*.4,Math.cos(a)*(k?2:.15),k===0?.6:.1,Math.sin(a)*(k?2:.15),.045,.65,k===2?-3:0,[k?3:1,.25,.25]);}break;
   case 'freeze': // Crystalline shell opens into chunky shards, then cold ground ring.
    if(k<2){for(let i=0;i<30;i++){const a=i/30*TAU;particle('ice',s.origin,Math.cos(a)*.35,(i%6)*.28+.1,Math.sin(a)*.35,Math.cos(a)*(k?2:.05),k?1:.04,Math.sin(a)*(k?2:.05),k?.12:.06,k?1.8:.5,k?-3:0,[.6,2,.8]);}}
    else ring(s,'ice',24,.6,.1,1,.3,[1,.3,2]);break;
   case 'flood': // Blood tinted rising bubbles, vertical water crown then widening surface ripples.
    for(let i=0;i<26;i++){const a=i/26*TAU;particle(k===0?'blood':'water',s.origin,Math.cos(a)*(.15+k*.25),.25+k*.3,Math.sin(a)*(.15+k*.25),Math.cos(a)*k*.65,k===0?1.4:k===1?2:.1,Math.sin(a)*k*.65,.055,1.6,k===0?.4:-2,k===2?[2,.2,1]:[1,1.3,1]);}break;
   case 'gas': // Staggered mouth cough jets, descending cloud, floor-hugging haze.
    if(k===0){for(let i=0;i<18;i++)particle(i%3?'gas':'blood',s.origin,(i%3-1)*.08,1.45,.2,(i%3-1)*.35,.2,1.2+i*.025,.055,1.2,-.6);}
    else ring(s,'gas',24,.2+k*.12,k===1?.7:.15,.6,k===1?-.35:.08,[2,1,2]);break;
   case 'collapse': // Falling rubble curtain, ground impact corona and airborne dust fragments.
    if(k===0){for(let i=0;i<22;i++)particle('stone',s.origin,Math.sin(i*3.7)*.7,2+i%3*.15,Math.cos(i*2.1)*.6,0,-3,0,.11,.6,-4,[1.8,1,.8]);}
    else ring(s,k===1?'blood':'stone',30,.15,.16,k===1?2.7:1.3,k===1?.55:1.2,[1.5,.6,1]);break;
  }
 }
 function render(){const counts=Object.fromEntries(Object.keys(meshes).map(k=>[k,0]));let active=0;for(const p of pool){if(!p.on)continue;active++;dummy.position.copy(p.p);dummy.rotation.set(p.spin+p.age,p.spin*.7,p.age*.4);dummy.scale.copy(p.scale).multiplyScalar(Math.min(1,(p.life-p.age)*3));dummy.updateMatrix();meshes[p.kind].setMatrixAt(counts[p.kind]++,dummy.matrix);}for(const [k,m]of Object.entries(meshes)){m.count=counts[k];m.visible=m.count>0;m.instanceMatrix.needsUpdate=true;}peak=Math.max(peak,active);}
 function emit(actor,info={}){const id=info.scenarioId||info.hazard||info.kind;if(disposed||!enabled||!actor||actor.invincible||actor.id==='vip-456'||!FINISHER_IDS.includes(id))return false;if(seen.has(actor))return false;if(id==='boiler'){seen.add(actor);delegated++;return 'boiler-delegated';}if(sequences.length>=MAX){dropped++;return false;}seen.add(actor);const origin=new THREE.Vector3().copy(actor.position||actor.root?.position||new THREE.Vector3());origin.y=floor;sequences.push({id,origin,age:0,step:0});accepted++;return id;}
 function update(dt,state={}){if(disposed||!enabled||state.paused||state.phase==='paused')return;dt=Math.max(0,Math.min(Number(dt)||0,.05));for(let j=sequences.length-1;j>=0;j--){const s=sequences[j];s.age+=dt;while(s.step<3&&s.age>=[0,.38,.83][s.step])stage(s,s.step++);if(s.age>1.1)sequences.splice(j,1);}for(const p of pool){if(!p.on)continue;p.age+=dt;if(p.age>=p.life){p.on=false;continue;}p.v.y+=p.gravity*dt;p.p.addScaledVector(p.v,dt);if(p.p.y<floor+.02){p.p.y=floor+.02;p.v.multiplyScalar(.8);p.v.y=0;if(p.kind==='blood')p.scale.set(.14,.008,.09);}}render();}
 function reset(){sequences.length=0;seen.clear();for(const p of pool)p.on=false;render();}
 function setEnabled(value){enabled=!!value;if(!enabled)reset();}
 function setBloodEnabled(value){bloodEnabled=!!value;if(!bloodEnabled){for(const p of pool)if(p.kind==='blood')p.on=false;render();}}
 function dispose(){if(disposed)return;reset();disposed=true;root.removeFromParent();geometry.dispose();for(const m of materials)m.dispose();for(const mesh of Object.values(meshes))mesh.dispose();}
 return {emit,update,reset,setEnabled,setBloodEnabled,dispose,get stats(){return {enabled,bloodEnabled,disposed,accepted,delegated,dropped,peak,active:pool.filter(p=>p.on).length,sequences:sequences.length,capacity:CAP,maxSequences:MAX,duration:2.9};}};
}

