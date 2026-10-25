/** Rendering choices never alter simulation, odds, inventory or race timing. */
export const QUALITY_MODES=Object.freeze(['auto','low','medium','high']);
// Medium retains the instanced tire-contact shadows below, avoiding the second
// geometry pass of dynamic sun shadows. High remains an explicit visual option.
export function resolveQuality(mode='auto',{width=1280,cores=8,racers=8}={}){
  const id=mode==='auto'?(width<700||cores<=4?'low':racers>16?'medium':'high'):QUALITY_MODES.includes(mode)?mode:'medium';
  return Object.freeze({id,...({low:{dpr:1,shadows:false,shadowSize:512,lodDistance:65,detailedCars:2,authoredModels:false,skyWidth:256},medium:{dpr:1.25,shadows:false,shadowSize:1024,lodDistance:120,detailedCars:3,authoredModels:true,skyWidth:512},high:{dpr:1.65,shadows:true,shadowSize:2048,lodDistance:210,detailedCars:6,authoredModels:true,skyWidth:1024}}[id])});
}

/** One instanced, soft contact-shadow pass keeps tires grounded on every tier. */
export function createContactShadows(THREE,track,cars){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,3,32,32,31);g.addColorStop(0,'rgba(5,12,18,.58)');g.addColorStop(.45,'rgba(5,12,18,.32)');g.addColorStop(1,'rgba(5,12,18,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas),geometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false});
  const mesh=new THREE.InstancedMesh(geometry,material,Math.max(1,cars.length));mesh.name='race3d-contact-shadows';mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.renderOrder=1;
  const d=new THREE.Object3D();let disposed=false;
  return {group:mesh,update(visualPose){if(disposed)return;let n=0;for(const raw of cars){const c=visualPose?.(raw.id)||raw;if(c.finishHidden)continue;const s=track.sampleTrack(c.distance),h=Math.max(0,c.flightHeight||0);d.position.copy(s.position).addScaledVector(s.right,c.lateral||0);d.position.y+=.07+(s.bank||0)*(c.lateral||0);d.rotation.set(0,Math.atan2(s.tangent.x,s.tangent.z)+(c.heading||0),0);const fade=Math.max(.15,1-h/24);d.scale.set((c.racerType==='monster-truck'?3.8:3.1)*fade,1,5.8*fade);d.updateMatrix();mesh.setMatrixAt(n++,d.matrix);}mesh.count=n;mesh.instanceMatrix.needsUpdate=true;},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();geometry.dispose();material.dispose();texture.dispose();}};
}
