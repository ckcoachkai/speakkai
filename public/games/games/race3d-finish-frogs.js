/** Six articulated finish-line cheerleaders. Coordinates inherit the race world's 1/5 scale. */
export function createFinishFrogs(THREE, { track } = {}) {
  const group = new THREE.Group(); group.name = 'race3d-finish-frogs';
  const skeleton = new THREE.Group(), dancers = [], seen = new Set(), batches = new Map();
  const sphere = new THREE.SphereGeometry(1, 14, 10);
  const palette = { skin: 0xffffff, belly: 0xd8ee88, white: 0xfffbe5, ink: 0x173526, blush: 0xeeb45b, web: 0x8dc34a };
  let danceClock = 0, excitement = 0, cheer = 0, disposed = false, lastTime = null, celebrations = 0;
  function joint(parent, x=0, y=0, z=0) { const n = new THREE.Group(); n.position.set(x,y,z); parent.add(n); return n; }
  function part(parent, kind, x,y,z, sx,sy,sz, color) {
    const n = joint(parent,x,y,z); n.scale.set(sx,sy,sz);
    if (!batches.has(kind)) batches.set(kind,{ nodes: [], material: new THREE.MeshStandardMaterial({color:palette[kind],roughness:.69,metalness:0}) });
    batches.get(kind).nodes.push({node:n,color}); return n;
  }
  const frame = track?.sampleTrack?.(0) || {position:new THREE.Vector3(),right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,0,1),width:16.5};
  const halfWidth = (frame.width || 16.5)/2;
  for(let i=0;i<6;i++) {
    const side=i<3?-1:1, rank=i%3, distance=(rank-1)*5.8;
    const f=track?.sampleTrack?.(distance)||frame;
    const anchor=joint(skeleton); anchor.position.copy(f.position).addScaledVector(f.right,side*(halfWidth+5.7));
    const ground=track?.sampleGround?.(distance,side*(halfWidth+5.7));
    if(Number.isFinite(ground?.y))anchor.position.y=ground.y+.10;
    // Each row looks across the road and slightly toward incoming racers.
    anchor.rotation.y=Math.atan2(-f.right.x*side,-f.right.z*side)+side*.2;
    const torso=joint(anchor,0,1.72,0), head=joint(torso,0,1.05,.04);
    const green=new THREE.Color().setHSL(.24+i*.012,.53,.38+(i%3)*.045);
    part(torso,'skin',0,0,0,.81,1.04,.52,green); part(torso,'belly',0,-.03,.43,.61,.80,.16);
    part(head,'skin',0,.08,.04,.97,.63,.60,green);
    part(head,'skin',-.55,.53,.04,.37,.43,.39,green); part(head,'skin',.55,.53,.04,.37,.43,.39,green);
    for(const s of [-1,1]) { part(head,'white',s*.55,.56,.32,.28,.31,.18); part(head,'ink',s*.55+.025,.57,.478,.12,.18,.055); part(head,'white',s*.55-.005,.64,.525,.037,.05,.018); part(head,'blush',s*.66,-.08,.558,.18,.09,.025); }
    // Curved grin made of five small ovals, all in the shared ink instance batch.
    for(let m=-2;m<=2;m++) part(head,'ink',m*.175,-.21+Math.abs(m)*.032,.594,.13,.025,.025);
    const arms=[], legs=[];
    for(const s of [-1,1]) {
      const shoulder=joint(torso,s*.70,.42,0), elbow=joint(shoulder,s*.47,-.54,0), hand=joint(elbow,s*.32,-.48,.06);
      const upper=part(shoulder,'skin',s*.24,-.28,0,.21,.46,.21,green); upper.rotation.z=s*.59;
      const lower=part(elbow,'skin',s*.17,-.25,.02,.16,.35,.16,green); lower.rotation.z=s*.53;
      part(hand,'web',0,0,.03,.28,.18,.14);
      for(let t=-1;t<=1;t++) part(hand,'web',t*.16,-.12,.03,.08,.16,.10);
      arms.push({s,shoulder,elbow,hand});
      const hip=joint(torso,s*.54,-.61,0), knee=joint(hip,s*.28,-.56,.09), ankle=joint(knee,-s*.08,-.47,.08);
      const thigh=part(hip,'skin',s*.15,-.28,.04,.34,.47,.32,green); thigh.rotation.z=s*.41;
      part(knee,'skin',-s*.04,-.24,.04,.18,.36,.19,green);
      part(ankle,'web',0,-.055,.22,.40,.12,.48);
      for(let t=-1;t<=1;t++) {const toe=part(ankle,'web',t*.25,-.05,.53,.14,.10,.28);toe.rotation.y=t*.28;}
      legs.push({s,hip,knee,ankle});
    }
    dancers.push({anchor,torso,head,arms,legs,base:anchor.position.clone(),phase:i*1.13,side});
  }
  for(const [kind,b] of batches) {
    b.mesh=new THREE.InstancedMesh(sphere,b.material,b.nodes.length); b.mesh.name='frog-'+kind; b.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); b.mesh.frustumCulled=false;
    for(let i=0;i<b.nodes.length;i++) if(b.nodes[i].color) b.mesh.setColorAt(i,b.nodes[i].color);
    group.add(b.mesh);
  }
  function celebrate(id) { if(id == null || seen.has(id)) return false; seen.add(id); excitement=Math.min(3.2,excitement+1.65); celebrations++; return true; }
  function reset() { seen.clear();excitement=0;cheer=0;celebrations=0;lastTime=null; }
  function update(dt=0, metadata={}) {
    if(disposed)return;
    dt=Math.max(0,Math.min(.1,Number(dt)||0));
    const source=metadata.simulation||metadata;
    if(Number.isFinite(source.time)) {if(lastTime!==null&&source.time<lastTime-.1)reset();lastTime=source.time;}
    for(const event of metadata.events||source.events||[]) if(event.type==='car-finish'||event.type==='finish') celebrate(event.carId??event.id??event.car?.id);
    for(const car of source.cars||[]) if(car.finished)celebrate(car.id);
    excitement=Math.max(0,excitement-dt*.46);
    cheer+=(Math.min(1,excitement)-cheer)*(1-Math.exp(-dt*7));
    const tempo=2.7+cheer*1.4; danceClock+=dt*tempo;
    for(const d of dancers) {
      const p=danceClock+d.phase, sway=Math.sin(p), double=Math.sin(p*2), lift=Math.pow(Math.max(0,double),2);
      d.anchor.position.copy(d.base).addScaledVector(frame.tangent,.33*sway);
      d.torso.position.y=1.72+.13*double+cheer*.26*lift;
      d.torso.rotation.set(.09*Math.sin(p+.8),.19*sway,.12*sway);
      d.head.rotation.set(.08*Math.sin(p*1.3),-.17*sway,.09*Math.sin(p+.9));
      for(const a of d.arms) {a.shoulder.rotation.z=a.s*(.18+.35*Math.sin(p+a.s*.9)+cheer*.65);a.shoulder.rotation.x=.33*Math.sin(p+a.s);a.elbow.rotation.z=a.s*(.38+.34*Math.sin(p+.7));a.elbow.rotation.x=.28*Math.cos(p+a.s);a.hand.rotation.z=.28*Math.sin(p*1.5+a.s);}
      for(const l of d.legs) {const step=Math.sin(p+l.s*Math.PI/2);l.hip.rotation.z=l.s*.12+.17*sway;l.hip.rotation.x=.19*step;l.knee.rotation.x=.22+Math.max(0,step)*(.33+cheer*.15);l.ankle.rotation.x=-.12-Math.max(0,step)*.28;l.ankle.rotation.z=-.15*sway;}
    }
    skeleton.updateMatrixWorld(true);
    for(const b of batches.values()) {for(let i=0;i<b.nodes.length;i++)b.mesh.setMatrixAt(i,b.nodes[i].node.matrixWorld);b.mesh.instanceMatrix.needsUpdate=true;}
    group.userData.frogCelebrations=celebrations;group.userData.frogExcitement=cheer;
  }
  update(0);
  return {group,update,celebrate,reset,get stats(){return {frogs:6,drawCalls:batches.size,instances:[...batches.values()].reduce((n,b)=>n+b.nodes.length,0),celebrations,seen:[...seen]};},dispose(){if(disposed)return;disposed=true;sphere.dispose();for(const b of batches.values()){b.mesh.dispose();b.material.dispose();}group.clear();skeleton.clear();seen.clear();}};
}
