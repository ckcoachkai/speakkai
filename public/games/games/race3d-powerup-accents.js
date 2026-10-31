/** Bounded, actual 3D accents. Visual clock/RNG are isolated from race mechanics. */
export function createPowerupAccents(THREE, {reducedMotion=false, low=false}={}) {
  const group=new THREE.Group(); group.name='race3d-powerup-accents';
  const pose=new THREE.Object3D(), color=new THREE.Color();
  let disposed=false, serial=0;
  function material(glow=false){
    const m=new THREE.MeshStandardMaterial({color:0xffffff,metalness:glow?.25:.62,roughness:glow?.3:.18,transparent:true,opacity:glow?.8:.9,depthWrite:false,vertexColors:true,emissive:glow?0x658b8e:0x000000,emissiveIntensity:glow?.65:0});
    m.onBeforeCompile=s=>{
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float accentAlpha; varying float vAccentAlpha;').replace('#include <begin_vertex>','#include <begin_vertex>\nvAccentAlpha=accentAlpha;');
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vAccentAlpha;').replace('#include <opaque_fragment>','diffuseColor.a *= vAccentAlpha;\n#include <opaque_fragment>');
    };m.customProgramCacheKey=()=>`race3d-accent-${glow}`;return m;
  }
  function pool(name,geometry,capacity,glow){
    const alpha=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1);geometry.setAttribute('accentAlpha',alpha);
    const mesh=new THREE.InstancedMesh(geometry,material(glow),capacity);mesh.name=`race3d-accent-${name}`;mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);
    return {name,mesh,alpha,capacity,cursor:0,particles:Array.from({length:capacity},()=>({live:false,position:new THREE.Vector3(),velocity:new THREE.Vector3()}))};
  }
  // Torus arcs retain thickness from side views, unlike a flat billboard burst.
  const arcs=pool('arcs',new THREE.TorusGeometry(1,.045,5,low?20:32,Math.PI*1.55),low?12:24,true);
  const crystals=pool('crystals',new THREE.OctahedronGeometry(1,0),low?24:64,false);
  const crossShape=new THREE.Shape();crossShape.moveTo(-.16,.55);for(const p of [[.16,.55],[.16,.16],[.55,.16],[.55,-.16],[.16,-.16],[.16,-.55],[-.16,-.55],[-.16,-.16],[-.55,-.16],[-.55,.16],[-.16,.16]])crossShape.lineTo(...p);crossShape.closePath();
  const crosses=pool('repair-crosses',new THREE.ExtrudeGeometry(crossShape,{depth:.16,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1,steps:1}).translate(0,0,-.08),low?8:16,true);
  const pools=[arcs,crystals,crosses];
  const jitter=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
  function spawn(pool,position,opts){const p=pool.particles[pool.cursor];pool.cursor=(pool.cursor+1)%pool.capacity;Object.assign(p,{live:true,age:0,life:.8,size:1,grow:0,spin:0,phase:0,hex:0xffffff,gravity:0,tilt:0},opts);p.position.copy(position);p.velocity.set(opts.vx||0,opts.vy||0,opts.vz||0);}
  function emit(type,position,kind){
    if(disposed||!position||![position.x,position.y,position.z].every(Number.isFinite))return;
    const pickup=type==='item-pickup',heal=kind==='repair'||kind==='cleanse',cold=kind==='freeze',energy=kind==='shield'||kind==='shockwave'||kind==='boost'||kind==='rocket'||kind==='launch';
    if(!pickup&&!heal&&!cold&&!energy)return;
    const hex=heal?0x77ffbb:cold?0xc4f4ff:kind==='shield'?0x70caff:kind==='shockwave'?0xec9bff:kind==='launch'?0xc49aff:0x66f5ed;
    const seed=++serial*41;
    for(let i=0;i<(reducedMotion?1:low?2:3);i++)spawn(arcs,position,{hex,life:reducedMotion?.5:.85+i*.12,size:pickup?.65:1.1,grow:pickup?1.7:2.4,tilt:pickup?Math.PI/2:Math.PI/2+(i-1)*.55,phase:i*2.1,spin:reducedMotion?0:(i%2?-1:1)*1.3,vy:pickup?.6:.2});
    if(reducedMotion||pickup)return;
    const n=low?4:8;
    for(let i=0;i<n;i++){
      const phase=i*Math.PI*2/n+jitter(seed)*.8,radius=heal?1.6:.8,speed=heal?.25:2+jitter(seed+i)*2;
      const p=position.clone();p.x+=Math.cos(phase)*radius;p.z+=Math.sin(phase)*radius;
      spawn(heal?crosses:crystals,p,{hex,life:heal?1.15:.65+jitter(seed+i*2)*.35,size:heal?.28:cold?.2:.13,grow:heal?.35:0,phase,spin:heal?.6:3,tilt:cold?.4:0,vx:Math.cos(phase)*speed,vz:Math.sin(phase)*speed,vy:heal?1.8:1.5+jitter(seed+i)*2,gravity:heal?0:2.5});
    }
  }
  function update(dt=0){if(disposed)return;dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));for(const pool of pools){let n=0;for(const p of pool.particles){if(!p.live)continue;p.age+=dt;if(p.age>=p.life){p.live=false;continue;}p.velocity.y-=p.gravity*dt;p.position.addScaledVector(p.velocity,dt);const t=p.age/p.life,s=p.size*(1+p.grow*t);pose.position.copy(p.position);pose.rotation.set(pool===arcs?p.tilt:p.phase*.4,p.phase+p.age*p.spin,p.age*p.spin*.3);pose.scale.set(s,pool===crystals?s*2.4:s,s);pose.updateMatrix();pool.mesh.setMatrixAt(n,pose.matrix);color.setHex(p.hex);pool.mesh.setColorAt(n,color);pool.alpha.setX(n,(1-t)**1.5);n++;}pool.mesh.count=n;pool.mesh.visible=n>0;pool.mesh.instanceMatrix.needsUpdate=true;pool.alpha.needsUpdate=true;if(pool.mesh.instanceColor)pool.mesh.instanceColor.needsUpdate=true;}}
  function reset(){serial=0;for(const p of pools){p.cursor=0;p.mesh.count=0;p.mesh.visible=false;p.alpha.array.fill(0);p.alpha.needsUpdate=true;for(const item of p.particles)item.live=false;}}
  function snapshot(){return {disposed,reducedMotion,drawCallCap:3,pools:Object.fromEntries(pools.map(p=>[p.name,{capacity:p.capacity,active:p.particles.filter(x=>x.live).length}]))};}
  function dispose(){if(disposed)return;reset();disposed=true;group.removeFromParent();for(const p of pools){p.mesh.geometry.dispose();p.mesh.material.dispose();p.mesh.dispose();}group.clear();}
  return {group,emit,update,reset,dispose,snapshot};
}
