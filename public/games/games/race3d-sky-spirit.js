/** Haku-inspired river spirit. All geometry lives in world metres, outside scaled race world. */
export function createSkySpirit(THREE, {scene} = {}) {
  const root = new THREE.Group(); root.name = 'haku-sky-spirit'; scene.add(root);
  const ivory = new THREE.MeshStandardMaterial({color:0xf2f3e8, roughness:0.77});
  const teal = new THREE.MeshStandardMaterial({color:0x63a9a2, roughness:0.85});
  const horn = new THREE.MeshStandardMaterial({color:0xd4c2b0, roughness:0.9});
  const dark = new THREE.MeshStandardMaterial({color:0x293b45, roughness:0.4});
  const rose = new THREE.MeshStandardMaterial({color:0xb988a4, roughness:0.8});
  const geometries = new Set(), materials = new Set([ivory,teal,horn,dark,rose]);
  const sphere = new THREE.SphereGeometry(1,12,8); geometries.add(sphere);
  function oval(parent, mat, x,y,z, sx,sy,sz) {
    const m = new THREE.Mesh(sphere,mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); parent.add(m); return m;
  }
  function branch(parent, points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve,20,radius,5,false); geometries.add(geo);
    const m = new THREE.Mesh(geo,mat); parent.add(m); return m;
  }
  // Continuous skin with 65 independently moving rings, rather than rigid body beads.
  const rings=65, sides=10, positions=new Float32Array(rings*sides*3), indices=[];
  for(let i=0;i<rings-1;i++) for(let j=0;j<sides;j++) {
    const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;
    // The ring runs clockwise viewed from the head; wind outward so the
    // opaque FrontSide skin catches sunlight instead of showing its interior.
    indices.push(a,c,b,b,c,d);
  }
  const skin = new THREE.BufferGeometry(); skin.setAttribute('position',new THREE.BufferAttribute(positions,3)); skin.setIndex(indices); geometries.add(skin);
  const body = new THREE.Mesh(skin,ivory); body.frustumCulled=false; root.add(body);
  const head = new THREE.Group(); root.add(head);
  oval(head,ivory,0.25,0,0,1.1,.68,.63);
  oval(head,ivory,1.15,-.16,0,.95,.32,.39);
  oval(head,ivory,1.36,-.37,0,.72,.13,.34);
  oval(head,rose,1.67,-.27,0,.3,.055,.32);
  oval(head,dark,1.93,-.10,0,.14,.13,.3);
  for(const s of [-1,1]) {
    oval(head,teal,.66,.25,s*.5,.35,.18,.13);
    oval(head,dark,.81,.24,s*.6,.12,.12,.035);
    oval(head,ivory,.84,.28,s*.625,.04,.045,.02);
    const ear=oval(head,teal,-.42,.56,s*.59,.5,.15,.32); ear.rotation.x=s*.5; ear.rotation.z=.4;
    branch(head,[[-.3,.44,s*.38],[-.65,1.15,s*.5],[-.93,1.65,s*.61],[-.68,1.93,s*.7]],.10,horn);
    branch(head,[[-.68,1.25,s*.54],[-1.02,1.45,s*.74],[-1.18,1.7,s*.75]],.065,horn);
  }
  const whiskers=[];
  for(const s of [-1,1]) {
    const g=new THREE.Group(); head.add(g);
    branch(g,[[1.34,-.11,s*.30],[.72,-.25,s*1.12],[-.55,-.1,s*1.8],[-2.0,.25,s*2.05],[-3,.55,s*1.7]],.033,ivory);
    whiskers.push(g);
  }
  const mane=[];
  for(let i=0;i<30;i++) {
    const g=new THREE.Group(); root.add(g);
    branch(g,[[0,0,0],[-.3,.5,0],[-.8,.85,.08],[-1.25,.7,.13]],.13*(1-i/38),teal);
    mane.push(g);
  }
  const legs=[];
  for(const u of [.17,.49]) for(const s of [-1,1]) {
    const g=new THREE.Group(); root.add(g);
    branch(g,[[0,0,0],[.3,-.65,s*.5],[.95,-1.0,s*.7],[1.45,-.85,s*.82]],.16,ivory);
    for(let toe=0;toe<3;toe++) branch(g,[[1.3,-.85,s*.8],[1.75,-.88,s*(.6+toe*.22)],[1.84,-1.02,s*(.6+toe*.22)]],.045,horn);
    legs.push({g,u,s});
  }
  // Thin teal tail tufts carry the silhouette after the body tapers away.
  const tail=new THREE.Group(); root.add(tail);
  for(let k=-2;k<=2;k++) branch(tail,[[0,0,0],[-1,.2,k*.16],[-2.6,.4,k*.28],[-3.8,.15,k*.22]],.09,teal);
  const mistMat=new THREE.MeshBasicMaterial({color:0xe0eeed,transparent:true,opacity:.075,depthWrite:false}); materials.add(mistMat);
  const mist=[];
  for(let i=0;i<9;i++) mist.push(oval(root,mistMat,-23-i*1.5,0,0,1.2,.3,.55));
  let time=0, disposed=false;
  function spine(u,out) {
    const envelope=Math.sin(Math.PI*u*.85);
    out.set(-u*22, Math.sin(time*1.6-u*9)*1.5*envelope, Math.sin(time*1.05-u*7)*1.25*envelope);
    return out;
  }
  const p=new THREE.Vector3(), next=new THREE.Vector3(), tangent=new THREE.Vector3(), axis=new THREE.Vector3(1,0,0);
  function pose(g,u) {
    spine(u,g.position); spine(Math.min(1,u+.008),next); tangent.subVectors(g.position,next).normalize();
    if(u<1) g.quaternion.setFromUnitVectors(axis,tangent);
  }
  function update(dt=0) {
    if(disposed) return;
    time+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
    // Background flight is world-anchored, independent of the followed car.
    const phase=time*.023;
    root.position.set(Math.sin(phase)*105,49+Math.sin(time*.075)*7,Math.cos(phase)*92);
    root.rotation.set(0,phase+Math.PI/2,Math.sin(time*.12)*.06);
    for(let i=0;i<rings;i++) {
      const u=i/(rings-1); spine(u,p);
      const radius=(.57*Math.pow(1-u,.58)+.025)*(1+.12*Math.sin(u*Math.PI));
      for(let j=0;j<sides;j++) {
        const angle=j/sides*Math.PI*2, k=(i*sides+j)*3;
        positions[k]=p.x; positions[k+1]=p.y+Math.cos(angle)*radius; positions[k+2]=p.z+Math.sin(angle)*radius;
      }
    }
    skin.attributes.position.needsUpdate=true; skin.computeVertexNormals();
    pose(head,0);
    mane.forEach((g,i)=>{pose(g,i/31);g.position.y+=.48*Math.pow(1-i/31,.55);g.rotation.x+=Math.sin(time*2-i*.4)*.18;});
    legs.forEach(({g,u,s})=>{pose(g,u);g.rotation.x+=s*(.2+Math.sin(time*1.6-u*9)*.12);});
    pose(tail,1); tail.rotation.x=Math.sin(time*1.5)*.2;
    whiskers.forEach((g,i)=>{g.rotation.x=Math.sin(time*1.8+i)*.13;g.rotation.y=Math.sin(time*1.2+i)*.1;});
    mist.forEach((m,i)=>{m.position.y=Math.sin(time*.8-i*.8)*.8;m.position.z=Math.cos(time*.7-i)*.5;});
  }
  update(0);
  return {group:root,update,dispose(){if(disposed)return;disposed=true;scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear();}};
}
