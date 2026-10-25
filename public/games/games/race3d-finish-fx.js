/** Decorative finish disassembly. Fixed pools, no physics contacts or result writes. */
export const FINISH_SPIN_SECONDS=.65;
export const FINISH_TAIL_SECONDS=2.35;
export function advanceFinishVisual(state,racer,dt,reducedMotion=false){
 const s=state||{age:0,from:Number(racer.distance)||0,lateral:Number(racer.lateral)||0,height:Number(racer.flightHeight)||0,emitted:false};
 s.age+=Math.max(0,Math.min(.1,Number(dt)||0));const delay=reducedMotion?.15:FINISH_SPIN_SECONDS,u=Math.min(1,s.age/delay),sign=(racer.finishPosition||1)%2?1:-1;
 const burst=!s.emitted&&s.age>=delay;if(burst)s.emitted=true;
 return {state:s,burst,hidden:s.age>=delay,stage:s.age<delay?'spin':s.age<delay+FINISH_TAIL_SECONDS?'burst':'cleared',pose:{distance:s.from+8*(1-(1-u)**3),lateral:s.lateral+sign*.55*Math.sin(u*Math.PI/2),speed:s.age<delay?24*(1-u)**2/delay:0,acceleration:-8,heading:0,spin:0,spinAngle:reducedMotion?0:sign*u*Math.PI*3,flightHeight:s.height*(1-u)**2,flightRemaining:0,verticalVelocity:0,rampHeight:0,rampPitch:0,trickAngle:0,lateralAcceleration:0,brake:1}};
}
/** Transparent below .7; soft ceiling below .9 even for concurrent transients. */
export function audioPeakCurve(){const curve=new Float32Array(4097);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=Math.sign(x)*(a<=.7?a:.7+.2*Math.tanh((a-.7)/.2));}return curve;}
export function createFinishFX(THREE,{quality='high',reducedMotion=false}={}){
 const low=quality==='low',caps=low?[96,288,48]:[240,1152,96],group=new THREE.Group();group.name='finish-explosion-pools';
 const geometries=[],materials=[],pools=[],seen=new Set(),dummy=new THREE.Object3D(),color=new THREE.Color();let bursts=0,peak=0,disposed=false;
 const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial({roughness:.45,metalness:.5});geometries.push(geometry);materials.push(material);
 const fragments=new THREE.InstancedMesh(geometry,material,caps[0]);fragments.frustumCulled=false;fragments.count=0;fragments.name='finish-car-fragments';group.add(fragments);
 pools.push({kind:'fragment',cap:caps[0],mesh:fragments,items:Array.from({length:caps[0]},()=>({life:0})),cursor:0});
 for(const [kind,cap]of [['spark',caps[1]],['smoke',caps[2]]]){
  const g=new THREE.BufferGeometry(),position=new Float32Array(cap*3),colors=new Float32Array(cap*3),alpha=new Float32Array(cap),size=new Float32Array(cap);
  for(const [name,array,n]of [['position',position,3],['color',colors,3],['alpha',alpha,1],['size',size,1]])g.setAttribute(name,new THREE.BufferAttribute(array,n).setUsage(THREE.DynamicDrawUsage));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:kind==='spark'?THREE.AdditiveBlending:THREE.NormalBlending,vertexColors:true,uniforms:{soft:{value:kind==='smoke'?1:0}},vertexShader:'attribute float alpha;attribute float size;varying vec3 c;varying float a;void main(){c=color;a=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*260.*length(modelMatrix[0].xyz)/max(.2,-p.z),1.,160.);}',fragmentShader:'varying vec3 c;varying float a;uniform float soft;void main(){float r=length(gl_PointCoord-.5)*2.;float f=pow(max(0.,1.-r),mix(1.3,2.2,soft));gl_FragColor=vec4(c,a*f);}' });
  const mesh=new THREE.Points(g,m);mesh.name='finish-'+kind;mesh.frustumCulled=false;group.add(mesh);geometries.push(g);materials.push(m);pools.push({kind,cap,mesh,items:Array.from({length:cap},()=>({life:0})),cursor:0});
 }
 function emit(events=[]){
  if(disposed)return [];
  const fresh=events.filter(e=>!seen.has(e.carId)),sounds=[],share=Math.max(low?8:4,fresh.length);
  for(const e of fresh){
   if(seen.has(e.carId))continue;seen.add(e.carId);bursts++;
   let seed=(Number(e.gridPosition)||0)*7919+17;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   for(const pool of pools){
    const count=Math.max(2,Math.floor(pool.cap/share/(reducedMotion?2:1)));
    for(let i=0;i<count;i++){
     const p=pool.items[pool.cursor++%pool.cap],angle=random()*Math.PI*2,speed=(pool.kind==='smoke'?1.7:pool.kind==='fragment'?8:18)*(reducedMotion?.35:1)*(.4+random());
     Object.assign(p,{life:pool.kind==='smoke'?(reducedMotion?.65:2.25):pool.kind==='fragment'?(reducedMotion?.55:1.6):.35+random()*(reducedMotion?.25:1.0),x:e.x,y:e.y,z:e.z,vx:Math.cos(angle)*speed,vy:(pool.kind==='smoke'?2:3+random()*9)*(reducedMotion?.4:1),vz:Math.sin(angle)*speed,size:pool.kind==='smoke'?2+random()*3:pool.kind==='fragment'?.12+random()*.35:.12+random()*.23,spin:random()*(reducedMotion?2:8),rotation:random()*6});p.ttl=p.life;if(pool.kind==="spark"&&i<2&&!reducedMotion){p.size=11;p.life=p.ttl=.45;p.vx=p.vz=p.vy=0;}
     if(pool.kind==='fragment'){
       const across=(random()-.5)*(e.width||1.9),along=(random()-.5)*(e.length||4.4);
       p.x+=across*(e.rightX??1)+along*(e.forwardX??0);p.z+=across*(e.rightZ??0)+along*(e.forwardZ??1);p.y+=(random()-.5)*.6;p.size=.08+random()*.22;
     }
     color.set(pool.kind==='smoke'?0x36424a:pool.kind==='spark'?(random()<.35?0xffecad:0xff7c30):(random()<.55?(e.color||'#e5b656'):random()<.5?0x202b32:0xc3d3dc));p.r=color.r;p.g=color.g;p.b=color.b;
    }
   }
   sounds.push({type:'finish-burst',carId:e.carId,distance:e.distance,lateral:e.lateral,time:e.time,intensity:reducedMotion?.55:1});
  }
  return sounds;
 }
 function update(dt=0){
  if(disposed)return;const h=Math.max(0,Math.min(.1,dt));let alive=0;
  for(const pool of pools){let n=0;
   for(let i=0;i<pool.cap;i++){
    const p=pool.items[i];if(p.life>0){p.life=Math.max(0,p.life-h);p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;p.vy-=(pool.kind==='smoke'?-1:9.81)*h;p.vx*=Math.exp(-h*.8);p.vz*=Math.exp(-h*.8);}
    if(pool.kind==='fragment'){
     if(p.life<=0)continue;const fade=Math.min(1,p.life/.35);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rotation+p.spin*(p.ttl-p.life),p.rotation,p.spin*(p.ttl-p.life));dummy.scale.set(p.size*fade,p.size*.45*fade,p.size*1.7*fade);dummy.updateMatrix();pool.mesh.setMatrixAt(n,dummy.matrix);color.setRGB(p.r,p.g,p.b);pool.mesh.setColorAt(n,color);n++;alive++;
    }else{
     const active=p.life>0,attrs=pool.mesh.geometry.attributes;attrs.position.setXYZ(i,p.x||0,p.y||0,p.z||0);attrs.color.setXYZ(i,p.r||0,p.g||0,p.b||0);attrs.alpha.setX(i,active?(pool.kind==='smoke'?.45:.9)*Math.min(1,p.life/.45):0);attrs.size.setX(i,active?p.size*(pool.kind==='smoke'?1+(p.ttl-p.life)*1.5:1):0);if(active){alive++;n++;}
    }
   }
   pool.mesh.visible=n>0;if(pool.kind==='fragment'){pool.mesh.count=n;pool.mesh.instanceMatrix.needsUpdate=true;if(pool.mesh.instanceColor)pool.mesh.instanceColor.needsUpdate=true;}else for(const a of Object.values(pool.mesh.geometry.attributes))a.needsUpdate=true;
  }
  peak=Math.max(peak,alive);
 }
 function reset(){seen.clear();bursts=peak=0;for(const pool of pools){pool.cursor=0;for(const p of pool.items)p.life=0;}update(0);}
 return {group,emit,update,reset,snapshot:()=>({bursts,seen:seen.size,alive:pools.reduce((n,p)=>n+p.items.filter(i=>i.life>0).length,0),peak,capacity:caps.reduce((a,b)=>a+b,0),caps:[...caps],reducedMotion,disposed}),dispose(){if(disposed)return;reset();disposed=true;group.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();}};
}
