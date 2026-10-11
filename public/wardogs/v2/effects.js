import * as THREE from './three.module.js';

// Fixed visual budgets: 76 smoke/fire sprites, 8 flares, 6 shockwaves,
// 2 instanced debris meshes and one pooled tracer draw. No remote imagery.
export function createEffects(scene) {
  const root=new THREE.Group();root.name='Flight effects · pooled smoke / fire / debris';scene.add(root);
  const smokeTexture=makeSmokeTexture(),fireTexture=makeFireTexture(),glowTexture=makeGlowTexture(),ringTexture=makeRingTexture();
  const particles=[],emitters=[],flares=[],tracers=[],waves=[],pieces=[];
  const smokeMaterial=new THREE.SpriteMaterial({map:smokeTexture,color:0xb8b5ab,transparent:true,depthWrite:false,opacity:0});
  const fireMaterial=new THREE.SpriteMaterial({map:fireTexture,color:0xffaa58,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0});
  for(let i=0;i<76;i++){
    const sprite=new THREE.Sprite((i<52?smokeMaterial:fireMaterial).clone());sprite.visible=false;root.add(sprite);
    particles.push({sprite,kind:i<52?'smoke':'fire',life:0,maxLife:1,velocity:new THREE.Vector3(),size:1,growth:1,rotation:0,rotationSpeed:0});
  }
  const flareMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffecbb,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const flarePool=[];for(let i=0;i<8;i++){const s=new THREE.Sprite(flareMaterial.clone());s.visible=false;root.add(s);flarePool.push(s);}
  const waveMaterial=new THREE.SpriteMaterial({map:ringTexture,color:0xffc87c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  for(let i=0;i<6;i++){const sprite=new THREE.Sprite(waveMaterial.clone());sprite.visible=false;root.add(sprite);waves.push({sprite,life:0,maxLife:.8,size:1});}
  const metal=new THREE.MeshStandardMaterial({color:0x8f938f,metalness:.72,roughness:.49});
  const shardGeometry=new THREE.BufferGeometry();
  shardGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-.5,1,0,-.5,.3,0,1,-1,.09,-.5,1,.09,-.5,.3,.09,1],3));
  shardGeometry.setIndex([0,2,1,3,4,5,0,1,4,0,4,3,1,2,5,1,5,4,2,0,3,2,3,5]);shardGeometry.computeVertexNormals();
  const shards=new THREE.InstancedMesh(shardGeometry,metal,64);shards.count=0;shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);shards.frustumCulled=false;root.add(shards);
  const body=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,10,1,true),metal,12);body.count=0;body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);body.frustumCulled=false;root.add(body);
  const debris={shards,body,pieces};
  const tracerPositions=new Float32Array(64*6),tracerColors=new Float32Array(64*6);
  const tracerGeometry=new THREE.BufferGeometry();tracerGeometry.setAttribute('position',new THREE.BufferAttribute(tracerPositions,3).setUsage(THREE.DynamicDrawUsage));tracerGeometry.setAttribute('color',new THREE.BufferAttribute(tracerColors,3).setUsage(THREE.DynamicDrawUsage));tracerGeometry.setDrawRange(0,0);
  const tracerMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  const tracerMesh=new THREE.LineSegments(tracerGeometry,tracerMaterial);tracerMesh.frustumCulled=false;root.add(tracerMesh);
  const dummy=new THREE.Object3D(),vector=new THREE.Vector3();let serial=0;
  function allocate(kind) {
    const matching=particles.filter(p=>p.kind===kind);return matching.find(p=>p.life<=0)||matching.reduce((a,b)=>a.life<b.life?a:b);
  }
  function particle(kind,position,velocity,size,life,growth=1) {
    const p=allocate(kind);p.sprite.position.copy(position);p.sprite.visible=true;p.velocity.copy(velocity);p.life=p.maxLife=life;p.size=size;p.growth=growth;p.rotation=Math.random()*Math.PI*2;p.rotationSpeed=(Math.random()-.5)*.25;p.sprite.material.rotation=p.rotation;p.sprite.material.opacity=kind==='fire'?.8:.0;p.sprite.scale.setScalar(size);return p;
  }
  function addDebris(position,scale,velocity,crash) {
    const count=crash?27:7;
    for(let i=0;i<count;i++){
      if(pieces.length>=76)pieces.shift();
      const v=new THREE.Vector3((Math.random()-.5)*26,8+Math.random()*17,(Math.random()-.5)*26).multiplyScalar(Math.sqrt(scale));
      if(velocity)v.addScaledVector(velocity,.32);
      pieces.push({position:position.clone().add(new THREE.Vector3((Math.random()-.5)*scale,scale*.3,(Math.random()-.5)*scale)),velocity:v,rotation:new THREE.Euler(Math.random()*6,Math.random()*6,Math.random()*6),spin:new THREE.Vector3((Math.random()-.5)*5,(Math.random()-.5)*5,(Math.random()-.5)*5),size:new THREE.Vector3((.4+Math.random()*1.3)*scale,.3+Math.random()*.3,(.4+Math.random()*1.7)*scale),life:16,bounces:0,type:crash&&i<5?'body':'shard'});
    }
  }
  function explode(position,scale=1,velocity=null) {
    scale=Math.max(.3,Math.min(12,scale));const crash=scale>=2.8;
    const pos=position.clone();
    for(let i=0;i<(crash?18:9);i++){
      const dir=new THREE.Vector3(Math.random()-.5,Math.random()*.65+.1,Math.random()-.5).normalize();
      particle('smoke',pos.clone().addScaledVector(dir,scale*.7),dir.multiplyScalar((2+Math.random()*4)*scale),3.5*scale,7+Math.random()*6,3.2);
    }
    for(let i=0;i<(crash?15:8);i++){
      const dir=new THREE.Vector3(Math.random()-.5,Math.random()*.8,Math.random()-.5);
      particle('fire',pos.clone().addScaledVector(dir,scale),dir.multiplyScalar(7*scale),4.5*scale,.6+Math.random()*1.1,1.6);
    }
    const wave=waves.find(w=>w.life<=0)||waves[serial++%waves.length];wave.sprite.visible=true;wave.sprite.position.copy(pos);wave.life=wave.maxLife=.65;wave.size=scale*36;wave.sprite.material.opacity=.75;
    addDebris(pos,scale,velocity,crash);
    if(crash){if(emitters.length>=3)emitters.shift();emitters.push({position:pos,scale,life:18,smokeTimer:0,fireTimer:0});}
  }
  function tracer(start,end,color=0xffd58d) {
    if(tracers.length>=64)tracers.shift();tracers.push({start:start.clone(),end:end.clone(),color:new THREE.Color(color),life:.085,maxLife:.085});
  }
  function flare(position,velocity=new THREE.Vector3()) {
    if(flares.length>=8){const old=flares.shift();old.sprite.visible=false;old.life=0;}
    const sprite=flarePool.find(s=>!s.visible)||flarePool[0];sprite.visible=true;sprite.scale.setScalar(2.7);
    const f={position:position.clone(),velocity:velocity.clone(),life:6,maxLife:6,smokeTimer:0,sprite};sprite.position.copy(f.position);flares.push(f);return f;
  }
  function update(dt,time=0) {
    dt=Math.min(.06,Math.max(0,dt));
    for(const p of particles){
      if(p.life<=0)continue;p.life-=dt;if(p.life<=0){p.sprite.visible=false;continue;}
      const age=1-p.life/p.maxLife;p.sprite.position.addScaledVector(p.velocity,dt);
      if(p.kind==='smoke'){
        p.velocity.multiplyScalar(Math.exp(-dt*.35));p.velocity.y+=dt*.55;p.velocity.x+=dt*.22;
        p.sprite.material.opacity=Math.min(1,age*5)*Math.min(1,(1-age)*3)*.43;
        p.sprite.material.color.setRGB(.52+age*.20,.52+age*.19,.51+age*.17);
      }else{
        p.velocity.multiplyScalar(Math.exp(-dt*1.25));p.velocity.y+=dt*2.3;p.sprite.material.opacity=(1-age)*.86;
        p.sprite.material.color.setRGB(1,.45+.3*(1-age),.16+.3*(1-age));
      }
      p.sprite.scale.setScalar(p.size*(1+age*p.growth));p.rotation+=p.rotationSpeed*dt;p.sprite.material.rotation=p.rotation;
    }
    for(let i=emitters.length-1;i>=0;i--){const e=emitters[i];e.life-=dt;if(e.life<=0){emitters.splice(i,1);continue;}
      e.smokeTimer-=dt;e.fireTimer-=dt;
      if(e.smokeTimer<=0){e.smokeTimer=.38;particle('smoke',e.position.clone().add(new THREE.Vector3((Math.random()-.5)*e.scale,e.scale*.5,(Math.random()-.5)*e.scale)),new THREE.Vector3(.8,3+Math.random()*2,.2),e.scale*3.5,8,2.8);}
      if(e.fireTimer<=0&&e.life>8){e.fireTimer=.18;particle('fire',e.position.clone().add(new THREE.Vector3((Math.random()-.5)*e.scale*1.5,e.scale*.4,(Math.random()-.5)*e.scale*1.5)),new THREE.Vector3(0,3,0),e.scale*2.7,1.1,1.2);}
    }
    for(let i=flares.length-1;i>=0;i--){const f=flares[i];f.life-=dt;if(f.life<=0){f.sprite.visible=false;flares.splice(i,1);continue;}
      f.velocity.y-=dt*5.2;f.velocity.multiplyScalar(Math.exp(-dt*.16));f.position.addScaledVector(f.velocity,dt);f.sprite.position.copy(f.position);
      f.sprite.material.opacity=Math.min(1,f.life*1.3);f.sprite.scale.setScalar((2.1+Math.sin(time*40)*.18)*Math.min(1,f.life));
      f.smokeTimer-=dt;if(f.smokeTimer<=0){f.smokeTimer=.20;particle('smoke',f.position,new THREE.Vector3(.4,1.2,0),.9,3.2,3);}
    }
    for(const w of waves){if(w.life<=0)continue;w.life-=dt;if(w.life<=0){w.sprite.visible=false;continue;}const age=1-w.life/w.maxLife;w.sprite.scale.setScalar(1+age*w.size);w.sprite.material.opacity=(1-age)*(1-age)*.6;}
    let n=0,bn=0;
    for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];p.life-=dt;if(p.life<=0){pieces.splice(i,1);continue;}
      p.velocity.y-=9.81*dt;p.position.addScaledVector(p.velocity,dt);
      if(p.position.y<p.size.y*.5){p.position.y=p.size.y*.5;if(p.velocity.y<0)p.velocity.y*=-.26;p.velocity.x*=Math.exp(-dt*3);p.velocity.z*=Math.exp(-dt*3);p.spin.multiplyScalar(Math.exp(-dt*3));p.bounces++;}
      p.rotation.x+=p.spin.x*dt;p.rotation.y+=p.spin.y*dt;p.rotation.z+=p.spin.z*dt;
      dummy.position.copy(p.position);dummy.rotation.copy(p.rotation);dummy.scale.copy(p.size);dummy.updateMatrix();
      if(p.type==='body'&&bn<12){body.setMatrixAt(bn++,dummy.matrix);}else if(n<64){shards.setMatrixAt(n++,dummy.matrix);}
    }
    shards.count=n;body.count=bn;shards.instanceMatrix.needsUpdate=true;body.instanceMatrix.needsUpdate=true;
    let tn=0;
    for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.life-=dt;if(t.life<=0){tracers.splice(i,1);continue;}
      t.start.toArray(tracerPositions,tn*6);t.end.toArray(tracerPositions,tn*6+3);const fade=Math.min(1,t.life/t.maxLife*1.7);
      for(let j=0;j<2;j++){const k=tn*6+j*3;tracerColors[k]=t.color.r*fade;tracerColors[k+1]=t.color.g*fade;tracerColors[k+2]=t.color.b*fade;}tn++;
    }
    tracerGeometry.setDrawRange(0,tn*2);tracerGeometry.attributes.position.needsUpdate=true;tracerGeometry.attributes.color.needsUpdate=true;
  }
  function reset(){for(const p of particles){p.life=0;p.sprite.visible=false;}for(const w of waves){w.life=0;w.sprite.visible=false;}for(const f of flares){f.life=0;f.sprite.visible=false;}flares.length=emitters.length=tracers.length=pieces.length=0;shards.count=body.count=0;tracerGeometry.setDrawRange(0,0);}
  function dispose(){reset();scene.remove(root);root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});for(const texture of[smokeTexture,fireTexture,glowTexture,ringTexture])texture.dispose();smokeMaterial.dispose();fireMaterial.dispose();flareMaterial.dispose();waveMaterial.dispose();}
  return {explode,tracer,flare,update,reset,dispose,debris,flares,root};
}

function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
function makeSmokeTexture(){return canvasTexture(256,(ctx,s)=>{
  ctx.clearRect(0,0,s,s);let seed=4242;
  const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<48;i++){const a=rnd()*Math.PI*2,d=rnd()*61,x=128+Math.cos(a)*d,y=128+Math.sin(a)*d,r=28+rnd()*40;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(215,214,205,.18)');g.addColorStop(.42,'rgba(169,171,171,.12)');g.addColorStop(1,'rgba(130,136,139,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
});}
function makeFireTexture(){return canvasTexture(256,(ctx,s)=>{
  ctx.clearRect(0,0,s,s);for(let i=0;i<7;i++){const x=128+Math.sin(i*2.7)*37,y=150-i*11,r=62-i*4,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,253,208,.92)');g.addColorStop(.17,'rgba(255,229,139,.9)');g.addColorStop(.38,'rgba(255,137,40,.66)');g.addColorStop(.67,'rgba(216,45,9,.22)');g.addColorStop(1,'rgba(93,10,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
});}
function makeGlowTexture(){return canvasTexture(128,(ctx,s)=>{const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,244,1)');g.addColorStop(.07,'rgba(255,255,213,1)');g.addColorStop(.22,'rgba(255,184,78,.86)');g.addColorStop(.49,'rgba(255,95,27,.24)');g.addColorStop(1,'rgba(255,77,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);});}
function makeRingTexture(){return canvasTexture(256,(ctx,s)=>{const g=ctx.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,244,195,.05)');g.addColorStop(.65,'rgba(255,222,139,0)');g.addColorStop(.73,'rgba(255,202,91,.36)');g.addColorStop(.78,'rgba(255,235,174,.68)');g.addColorStop(.86,'rgba(255,143,48,.15)');g.addColorStop(1,'rgba(255,144,48,0)');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);});}

