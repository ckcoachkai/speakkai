/** Small original coachwork details, fitted to the actual authored surfaces.
 * They remain children of their source panels: panel hiding/swapping also hides
 * the fittings. Wheel assemblies and source geometry are never modified. */
export function createCarDetails(THREE, root, spec, registerResource) {
  const ids=['lamborghini-gallardo','tesla-roadster','f1-2026','gt3','car-concept','concept-asterion','concept-helix','concept-ion','concept-vesper','concept-tempest','concept-atlas','concept-kestrel','concept-apex','concept-vector','concept-aurora','concept-flux','concept-solstice','concept-obsidian','concept-cinder','concept-meridian'];
  const index=Math.max(0,ids.indexOf(spec.id));
  const electric=/^(tesla-roadster|concept-(aurora|flux|solstice|ion))$/.test(spec.id);
  const formula=/f1-|kestrel|vector/.test(spec.id);
  const rally=/cinder/.test(spec.id);
  const style=electric?'pixel-light-and-thermal-slot':formula?'race-fastener-and-aero-comb':rally?'rally-guard-and-stud':'sculpted-light-and-extractor';
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert(),bounds=new THREE.Box3().setFromObject(root).applyMatrix4(inverse),size=bounds.getSize(new THREE.Vector3());
  const candidates=[];
  root.traverse(n=>{
    if(!n.isMesh)return;
    for(let p=n;p&&p!==root;p=p.parent)if(/wheel|tyre|tire|rim|caliper|brake|suspension/i.test(p.name))return;
    if(/glass|window|light|lamp|exhaust|mirror/i.test(n.name))return;
    candidates.push(n);
  });
  const own=(kind,r)=>(registerResource(kind,r),r);
  const carbon=own('material',new THREE.MeshStandardMaterial({name:'coachwork satin carbon',color:0x131c22,roughness:.46,metalness:.28}));
  const metal=own('material',new THREE.MeshStandardMaterial({name:'coachwork machined titanium',color:[0x8b9eab,0xd7b877,0xabb6bd,0xce7354][index%4],roughness:.3,metalness:.82}));
  const lamp=own('material',new THREE.MeshStandardMaterial({name:'coachwork rear signature',color:0xff314b,emissive:0xff1028,emissiveIntensity:.8,roughness:.22}));
  const materials=[carbon,metal,lamp],buckets=new Map(),features=[];
  const unitBox=new THREE.BoxGeometry(1,1,1),unitBolt=new THREE.CylinderGeometry(1,1,1,6);
  // Ray hits preserve the surface shape and avoid guessed model-specific heights.
  const ray=new THREE.Raycaster(),normalMatrix=new THREE.Matrix3(),outward=new THREE.Vector3(),point=new THREE.Vector3();
  function surface(x,y,z,dx,dy,dz){
    const origin=root.localToWorld(new THREE.Vector3(x,y,z)),direction=new THREE.Vector3(dx,dy,dz).transformDirection(root.matrixWorld);
    ray.set(origin,direction);
    const hit=ray.intersectObjects(candidates,false).find(h=>h.face&&h.distance>0);
    if(!hit)return null;
    normalMatrix.getNormalMatrix(hit.object.matrixWorld);outward.copy(hit.face.normal).applyMatrix3(normalMatrix).normalize();
    if(outward.dot(direction)>0)outward.negate();
    point.copy(hit.point).addScaledVector(outward,.009);
    return {node:hit.object,point:point.clone(),normal:outward.clone()};
  }
  function part(hit,name,mat,x,y,z,w,h,d,angle=0,bolt=false){
    if(!hit)return;
    const mount=new THREE.Object3D();mount.position.copy(hit.point);mount.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),hit.normal);mount.updateMatrix();
    const shape=new THREE.Object3D();shape.position.set(x,y,z);shape.rotation.z=angle;if(bolt)shape.rotation.x=Math.PI/2;shape.scale.set(w,h,d);shape.updateMatrix();
    hit.node.updateWorldMatrix(true,false);
    const transform=hit.node.matrixWorld.clone().invert().multiply(mount.matrix).multiply(shape.matrix);
    const g=(bolt?unitBolt:unitBox).clone().applyMatrix4(transform);
    const expanded=g.toNonIndexed();g.dispose();
    if(!buckets.has(hit.node))buckets.set(hit.node,[[],[],[]]);buckets.get(hit.node)[mat].push(expanded);features.push(name);
  }
  for(const side of [-1,1]){
    const rear=surface(side*size.x*(formula?.17:.28),bounds.min.y+size.y*(formula?.26:.40),bounds.min.z-1,0,0,1);
    const count=formula?3:electric?5:3+index%3,span=formula?.18:.31;
    part(rear,'recessed-rear-signature-bezel',0,0,0,0,span+.045,.105,.021);
    for(let k=0;k<count;k++){
      const x=(k-(count-1)/2)*span/count,angle=electric?0:side*(index%3-1)*.28;
      part(rear,'individual-optic-'+k,2,x,Math.abs(x)*(index%2?.18:0),.014,span/count*.66,electric?.032:.064,.018,angle);
    }
    for(const x of [-span/2,span/2])part(rear,'bezel-titanium-fastener',1,x,0,.02,.012,.012,.012,0,true);
    const hood=surface(side*size.x*(formula?.11:.18),bounds.max.y+1,size.z*(formula?.22:.27),0,-1,0);
    const slats=electric?2:formula?3:4+index%3;
    part(hood,electric?'thermal-channel-surround':'heat-extractor-pocket',0,0,0,0,.12,.26,.015);
    for(let k=0;k<slats;k++)part(hood,'machined-extractor-louver-'+k,1,0,(k-(slats-1)/2)*.21/slats,.012,.105,.013,.016,side*(index%3)*.09);
    if(rally){for(const y of [-.12,.12])part(hood,'rally-panel-captive-stud',1,0,y,.02,.022,.022,.013,0,true);}
  }
  const meshes=[];
  for(const [node,sets]of buckets)sets.forEach((parts,mat)=>{
    if(!parts.length)return;
    const geometry=new THREE.BufferGeometry();
    for(const name of ['position','normal']){const count=parts.reduce((n,g)=>n+g.attributes[name].array.length,0),a=new Float32Array(count);let at=0;for(const g of parts){a.set(g.attributes[name].array,at);at+=g.attributes[name].array.length;}geometry.setAttribute(name,new THREE.BufferAttribute(a,3));}
    for(const g of parts)g.dispose();geometry.computeBoundingSphere();own('geometry',geometry);
    const mesh=new THREE.Mesh(geometry,materials[mat]);mesh.name=`coachwork-${style}-${mat}`;mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.originalCoachwork=true;node.add(mesh);meshes.push(mesh);
  });
  unitBox.dispose();unitBolt.dispose();
  return {update(braking){lamp.emissiveIntensity=braking?2.8:.8;},snapshot(){return {style,model:spec.id,features:features.length,drawCalls:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),surfaceMounted:true};}};
}
