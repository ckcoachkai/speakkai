/** Fixed fixtures and a small nearest-light pool; no per-fixture shadow pass. */
export function createStreetlights(THREE, track, { timeOfDay = 'day', quality = 'high', sceneScale = .2 } = {}) {
  const group = new THREE.Group(); group.name = 'mountain-streetlights';
  const count = Math.ceil(track.totalLength / 95), sites = [];
  const poleGeometry = new THREE.CylinderGeometry(.14, .2, 9, 5);
  const armGeometry = new THREE.BoxGeometry(3.4, .15, .18);
  const lampGeometry = new THREE.BoxGeometry(1.3, .2, .65);
  const metal = new THREE.MeshStandardMaterial({ color: 0x455363, roughness: .65, metalness: .4 });
  const bulb = new THREE.MeshBasicMaterial({ color: 0xffe3a6, toneMapped: false });
  const poles = new THREE.InstancedMesh(poleGeometry, metal, count);
  const arms = new THREE.InstancedMesh(armGeometry, metal, count);
  const lamps = new THREE.InstancedMesh(lampGeometry, bulb, count);
  poles.name = 'streetlight-poles'; arms.name = 'streetlight-arms'; lamps.name = 'streetlight-lamps';
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(32,32,2,32,32,31);
  gradient.addColorStop(0,'rgba(255,218,145,.30)'); gradient.addColorStop(.45,'rgba(255,218,145,.13)'); gradient.addColorStop(1,'rgba(255,218,145,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
  const texture = new THREE.CanvasTexture(canvas);
  const poolGeometry = new THREE.PlaneGeometry(24,32).rotateX(-Math.PI / 2);
  const poolMaterial = new THREE.MeshBasicMaterial({ map:texture, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, polygonOffset:true, polygonOffsetFactor:-1, toneMapped:false });
  const pools = new THREE.InstancedMesh(poolGeometry,poolMaterial,count); pools.name='streetlight-road-pools';
  const dummy = new THREE.Object3D(), matrix = new THREE.Matrix4(), up = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const distance = i / count * track.totalLength, s = track.sampleTrack(distance), side = i % 2 ? -1 : 1;
    const lateral = (s.width / 2 + 3.2) * side;
    const base = track.sampleGround(distance,lateral);
    dummy.rotation.set(0,Math.atan2(s.tangent.x,s.tangent.z),0);
    dummy.position.copy(base); dummy.position.y += 4.5; dummy.updateMatrix(); poles.setMatrixAt(i,dummy.matrix);
    dummy.position.copy(base).addScaledVector(s.right,-1.6*side); dummy.position.y += 8.9; dummy.updateMatrix(); arms.setMatrixAt(i,dummy.matrix);
    dummy.position.copy(base).addScaledVector(s.right,-3*side); dummy.position.y += 8.75; dummy.updateMatrix(); lamps.setMatrixAt(i,dummy.matrix);
    sites.push({distance,position:dummy.position.clone()});
    const across=s.right.clone(); across.y = Math.tan(s.bank||0); across.addScaledVector(s.tangent,-across.dot(s.tangent)).normalize(); up.crossVectors(s.tangent,across).normalize();
    matrix.makeBasis(across,up,s.tangent);
    dummy.quaternion.setFromRotationMatrix(matrix);
    dummy.position.copy(s.position); dummy.position.y += .09; dummy.updateMatrix(); pools.setMatrixAt(i,dummy.matrix);
  }
  group.add(poles,arms,lamps,pools);
  const lights = Array.from({length:4},()=>{const light=new THREE.PointLight(0xffdc9e,0,sceneScale*34,2);light.castShadow=false;group.add(light);return light;});
  let disposed=false, night=false, budget=0;
  function setQuality(value){const id=value?.id||value;budget=id==='high'?4:id==='medium'?2:0;}
  function setMode(value){night=value==='night'; pools.visible=night; bulb.color.setHex(night?0xffe3a6:0xc7c8bb);for(const light of lights)light.intensity=0;}
  function update(distance=0){if(disposed)return;const closest=sites.map(site=>({site,delta:track.closed===false?Math.abs(site.distance-distance):Math.abs(((site.distance-distance+track.totalLength*1.5)%track.totalLength)-track.totalLength/2)})).sort((a,b)=>a.delta-b.delta);for(let i=0;i<lights.length;i++){lights[i].position.copy(closest[i%closest.length].site.position);lights[i].intensity=night&&i<budget?12:0;}}
  setQuality(quality);setMode(timeOfDay);
  return {group,setQuality,setMode,update,snapshot:()=>({fixtures:count,night,lightBudget:night?budget:0,disposed}),dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const resource of [poleGeometry,armGeometry,lampGeometry,metal,bulb,poolGeometry,poolMaterial,texture])resource.dispose();group.clear();}};
}
