import * as THREE from './three.module.js';

// Shanghai architectural study. Landmark dimensions follow architect / operator
// sources; coordinates and Huangpu banks are approximations, not a surveyed map.
// The flight facilities and target range are deliberately fictional.
export function createCity(scene) {
  const root = new THREE.Group(); root.name = 'Shanghai • architectural study'; scene.add(root);
  const colliders = [], landmarks = [], targets = [], boats = [], beacons = [];
  const batches = new Map();
  let seed = 17419;
  function rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...opts });
  const concrete = mat(0xc0bbb0), stone = mat(0xb3aaa0), metal = mat(0x879da5, { metalness: .55, roughness: .3 });
  const black = mat(0x202a30), asphalt = mat(0x3b4449), grass = mat(0x687653), white = mat(0xdfe5de), yellow = mat(0xeab545);
  const warmGlass = facadeMaterial(0x9baeb4, 0); const blueGlass = facadeMaterial(0x789bac, 1);
  const silverGlass = facadeMaterial(0xa5b5bb, 2); const brownGlass = facadeMaterial(0xb5a99a, 3);
  const red = mat(0x974853, { metalness: .48, roughness: .37 });
  const roof = mat(0x616b6c);
  // Locally generated aggregate and roof grain avoid flat, uniform ground slabs.
  function grainTexture(base,spread,repeat) {
    const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
    let grainSeed=8391;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      grainSeed=(Math.imul(grainSeed,1664525)+1013904223)>>>0;
      const delta=(grainSeed/4294967296-.5)*spread;
      ctx.fillStyle=`rgb(${base[0]+delta},${base[1]+delta},${base[2]+delta})`;ctx.fillRect(x,y,1,1);
    }
    const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(repeat,repeat);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
  }
  grass.map=grainTexture([171,177,149],38,1/85);
  asphalt.map=grainTexture([195,198,193],37,3);
  roof.map=grainTexture([192,194,185],33,3);
  const unitBox = new THREE.BoxGeometry(1, 1, 1), unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const unitSphere = new THREE.SphereGeometry(1, 10, 7);
  const roundTowerGeometry=new THREE.CylinderGeometry(1,1,1,32);
  const contactGeometry=new THREE.PlaneGeometry(1,1);contactGeometry.rotateX(-Math.PI/2);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const shadowContext=shadowCanvas.getContext('2d'),shadowGradient=shadowContext.createRadialGradient(64,64,5,64,64,64);
  shadowGradient.addColorStop(0,'rgba(12,22,25,.55)');shadowGradient.addColorStop(.66,'rgba(12,22,25,.34)');shadowGradient.addColorStop(1,'rgba(12,22,25,0)');shadowContext.fillStyle=shadowGradient;shadowContext.fillRect(0,0,128,128);
  const contactShadow=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.65,color:0xffffff});
  const dummy = new THREE.Object3D();
  function box(material, x, y, z, sx, sy, sz, rotation = 0) { batch(unitBox, material, x, y, z, sx, sy, sz, rotation); }
  function batch(geometry, material, x, y, z, sx, sy, sz, rotation = 0) {
    const key = geometry.uuid + material.uuid;
    if (!batches.has(key)) batches.set(key, { geometry, material, matrices: [] });
    dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(0, rotation, 0); dummy.updateMatrix();
    batches.get(key).matrices.push(dummy.matrix.clone());
  }
  function mesh(geo, material, position, group = root) { const m = new THREE.Mesh(geo, material); if (position) m.position.copy(position); m.receiveShadow = true; group.add(m); return m; }
  function collision(x, z, w, d, h) { colliders.push(new THREE.Box3(new THREE.Vector3(x-w/2, 0, z-d/2), new THREE.Vector3(x+w/2, h, z+d/2))); }
  function building(x, z, w, d, h, material, rotation = 0) {
    batch(contactGeometry,contactShadow,x,.175,z,w*1.4,1,d*1.4,rotation);
    box(material, x, h/2, z, w, h, d, rotation);
    box(roof, x, h+.9, z, w*.94, 1.8, d*.94, rotation);
    if (h > 65) {
      box(metal, x+4, h+3.5, z-3, w*.23, 5, d*.25, rotation);
      for(let j=0;j<3;j++){batch(unitCylinder,metal,x-w*.3+j*w*.16,h+3,z+d*.25,1.6,4,1.6);}
      box(concrete,x-w*.48,h+1.5,z,1,3,d);box(concrete,x+w*.48,h+1.5,z,1,3,d);
      box(concrete,x,h+1.5,z-d*.48,w,3,1);box(concrete,x,h+1.5,z+d*.48,w,3,1);
    }
    collision(x, z, w, d, h+5);
  }
  function facadeMaterial(color, variant) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#516270'; ctx.fillRect(0, 0, 128, 128);
    for (let row=0; row<4; row++) for(let col=0;col<4;col++) {
      const shades = ['#748a98','#96adb7','#536974','#b7bdb8','#667f8c','#c4c4ae'];
      ctx.fillStyle = shades[(row*3+col*7+variant)%shades.length]; ctx.fillRect(col*32+2,row*32+3,27,26);
      ctx.fillStyle = 'rgba(233,242,242,.17)'; ctx.fillRect(col*32+3,row*32+4,25,4);
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const material = mat(color, { map: tex, metalness: .34, roughness: .28 });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 cityWorld;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 cityPosition=vec4(position,1.0);\n#ifdef USE_INSTANCING\ncityPosition=instanceMatrix*cityPosition;\n#endif\ncityWorld=(modelMatrix*cityPosition).xyz;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 cityWorld;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', 'vec3 cityNormal=abs(normalize(cross(dFdx(cityWorld),dFdy(cityWorld))));\nvec2 cityUV=cityNormal.x>cityNormal.z?vec2(cityWorld.z,cityWorld.y):vec2(cityWorld.x,cityWorld.y);\nvec4 cityTex=texture2D(map,cityUV/vec2(14.0,16.0));\ndiffuseColor*=cityTex;');
    };
    material.customProgramCacheKey = () => 'city-world-facade-v1';
    return material;
  }
  // North-to-south centreline, metre coordinates relative to Shanghai Tower.
  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(7600,0,-12000), new THREE.Vector3(5100,0,-6000),
    new THREE.Vector3(1700,0,-3100), new THREE.Vector3(-450,0,-2100),
    new THREE.Vector3(-1330,0,-1300), new THREE.Vector3(-1600,0,-400),
    new THREE.Vector3(-1660,0,900), new THREE.Vector3(-1450,0,2300),
    new THREE.Vector3(-1900,0,3900), new THREE.Vector3(-3900,0,7200), new THREE.Vector3(-7000,0,12000)
  ]);
  const river = riverCurve.getPoints(180), banks = river.map((p,i) => {
    const tangent = riverCurve.getTangent(i/180), n = new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
    return [p.clone().addScaledVector(n,285), p.clone().addScaledVector(n,-285)];
  });
  function riverDistance(x,z) {
    let closest = Infinity;
    for(let i=0;i<river.length-1;i++) {
      const a=river[i], b=river[i+1], dx=b.x-a.x,dz=b.z-a.z;
      const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
      closest=Math.min(closest,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
    } return closest;
  }
  function landShape(points) { const s=new THREE.Shape(); points.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1])); s.closePath(); const g=new THREE.ShapeGeometry(s); g.rotateX(-Math.PI/2); return g; }
  // Two actual river-bank polygons so the river is recessed instead of painted on land.
  const east = banks.map(b=> b[0].x>b[1].x?b[0]:b[1]);
  const west = banks.map(b=> b[0].x<b[1].x?b[0]:b[1]);
  mesh(landShape([[16000,-16000],[16000,16000],...east.slice().reverse().map(p=>[p.x,p.z])]), grass);
  mesh(landShape([[-16000,16000],[-16000,-16000],...west.map(p=>[p.x,p.z])]), grass);
  const waterPositions=[], waterUV=[], waterIndices=[];
  banks.forEach((b,i)=>{ b.forEach((p,j)=>{waterPositions.push(p.x,-.24,p.z);waterUV.push(j,i*.8);});if(i<180){const n=i*2;waterIndices.push(n,n+1,n+2,n+1,n+3,n+2);} });
  const waterGeometry=new THREE.BufferGeometry();waterGeometry.setAttribute('position',new THREE.Float32BufferAttribute(waterPositions,3));waterGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(waterUV,2));waterGeometry.setIndex(waterIndices);waterGeometry.computeVertexNormals();
  const water=mat(0x396f78,{metalness:.45,roughness:.23,side:THREE.DoubleSide});
  water.onBeforeCompile=shader=>{
    shader.uniforms.cityTime={value:0};water.userData.shader=shader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float cityTime;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor += .12*sin(vViewPosition.x*.045+cityTime*.9)*sin(vViewPosition.z*.037-cityTime*.3);');
  };mesh(waterGeometry,water);
  mesh(new THREE.PlaneGeometry(40000,40000), mat(0x516964),new THREE.Vector3(0,-9,0)).rotation.x=-Math.PI/2;

  // Downtown road blocks, sidewalks, park gaps; common instancing avoids thousands of draw calls.
  for(let x=-4900;x<=3600;x+=220) for(let z=-2900;z<=3900;z+=220) {
    if(riverDistance(x,z)<385) continue;
    box(concrete,x,.04,z,196,.07,196); box(asphalt,x+106,.09,z,23,.06,220);box(asphalt,x,.1,z+106,220,.06,23);
    for(let s=-80;s<=80;s+=40){box(white,x+106,.14,z+s,.7,.02,13);box(white,x+s,.14,z+106,13,.02,.7);}
    const isGreen = ((x===600 || x===820) && z>=-700 && z<=180) || rand()<.07;
    if(isGreen){box(grass,x,.13,z,176,.15,176);continue;}
    for(let bx=-1;bx<=1;bx+=2) for(let bz=-1;bz<=1;bz+=2) {
      const px=x+bx*46+(rand()-.5)*14,pz=z+bz*46+(rand()-.5)*14;
      if(Math.hypot(px,pz)<145 || Math.hypot(px-190,pz+323)<135 || Math.hypot(px+57,pz+390)<120 || Math.hypot(px+541,pz+678)<145) continue;
      if(Math.abs(px-550)<110&&Math.abs(pz-1000)<150) continue;
      const central=Math.exp(-Math.hypot(px-300,pz+150)/1600);
      const h=15+rand()*65+central*rand()*rand()*210, w=32+rand()*35,d=32+rand()*35;
      building(px,pz,w,d,h,[warmGlass,blueGlass,silverGlass,brownGlass][Math.floor(rand()*4)]);
      if(rand()<.35)box(concrete,px,h*.20,pz,w+10,h*.40,d+10);
    }
  }
  // Cluster of specifically placed secondary towers around the Lujiazui triad.
  building(-330,-370,93,75,250,blueGlass); building(-460,-330,70,63,260,warmGlass);
  building(-190,-680,72,70,230,blueGlass);building(-330,210,85,71,203,warmGlass);
  building(840,-360,82,90,190,silverGlass);building(1050,-150,100,83,180,warmGlass);
  building(-740,45,73,80,180,blueGlass);
  // Rounded curtain-wall towers and stepped crowns break up the rectilinear blocks.
  for(const [x,z,r,h] of [[930,-850,39,215],[1130,-740,31,187],[1510,-360,38,180],[-430,-1160,35,205],[-650,-1390,31,164],[710,250,29,173]]){
    batch(roundTowerGeometry,blueGlass,x,h*.5,z,r,h,r);
    batch(roundTowerGeometry,metal,x,h-1,z,r+1,2,r+1);
    batch(roundTowerGeometry,silverGlass,x,h+10,z,r*.63,20,r*.63);
    batch(contactGeometry,contactShadow,x,.175,z,r*3,1,r*3);
    collision(x,z,r*2,r*2,h+20);
  }
  for(const [x,z,w,h] of [[380,-1100,61,230],[1370,-1030,70,195],[-930,280,54,135]]){
    building(x,z,w,w*.75,h,warmGlass);
    box(blueGlass,x,h+9,z,w*.76,18,w*.59);box(silverGlass,x,h+25,z,w*.49,15,w*.4);
  }

  function landmark(name,x,z,h,w,d) { landmarks.push({name,position:new THREE.Vector3(x,h*.55,z)});collision(x,z,w,d,h); }
  // Shanghai Tower: 120-degree spiral, rounded three-lobed plan, exponential taper.
  const towerPositions=[],towerUV=[],towerIndices=[],segments=72,levels=132;
  for(let j=0;j<=levels;j++){
    const t=j/levels, angle=t*Math.PI*2/3, r=47*Math.pow(.55,t);
    for(let k=0;k<=segments;k++){
      const a=k/segments*Math.PI*2, radius=r*(1+.085*Math.cos(3*a));
      towerPositions.push(Math.cos(a+angle)*radius,t*632,Math.sin(a+angle)*radius);
      towerUV.push(k/segments*18,t*127);
      if(j<levels&&k<segments){const n=j*(segments+1)+k;towerIndices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
    }
  }
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(towerPositions,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(towerUV,2));tg.setIndex(towerIndices);tg.computeVertexNormals();mesh(tg,silverGlass);
  mesh(new THREE.CylinderGeometry(25,26,5,48),metal,new THREE.Vector3(0,630,0));
  const ribs=new THREE.BufferGeometry(),ribPos=[];
  for(let k=0;k<36;k++)for(let j=0;j<levels;j++)for(let step=0;step<2;step++){
    const t=(j+step)/levels,a=k/36*Math.PI*2,r=47*Math.pow(.55,t)*(1+.085*Math.cos(3*a))+.35;
    ribPos.push(Math.cos(a+t*Math.PI*2/3)*r,t*632,Math.sin(a+t*Math.PI*2/3)*r);
  }
  ribs.setAttribute('position',new THREE.Float32BufferAttribute(ribPos,3));root.add(new THREE.LineSegments(ribs,new THREE.LineBasicMaterial({color:0xc4d0d1,transparent:true,opacity:.47})));
  // Nine stacked mechanical / sky-lobby belts.
  for(let j=1;j<=9;j++){const t=j/10;mesh(new THREE.CylinderGeometry(47*Math.pow(.55,t)+.5,47*Math.pow(.55,t)+.5,3,48),metal,new THREE.Vector3(0,t*632,0));}
  box(concrete,0,6,0,135,12,110);landmark('Shanghai Tower · 632 m',0,0,632,105,105);

  // SWFC: tapered trapezoid + real open aperture at the top, not a black decal.
  const sw=new THREE.Group();sw.position.set(190,0,-323);sw.rotation.y=.16;root.add(sw);
  function wedge(widthBase,widthTop,height,y,depth,material,parent=sw){const sh=new THREE.Shape();sh.moveTo(-widthBase/2,0);sh.lineTo(widthBase/2,0);sh.lineTo(widthTop/2,height);sh.lineTo(-widthTop/2,height);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false});g.translate(0,y,-depth/2);return mesh(g,material,null,parent);}
  wedge(91,54,425,0,55,blueGlass);wedge(11,8,60,425,55,silverGlass).position.x=-22;
  wedge(11,8,60,425,55,silverGlass).position.x=22;box(metal,190,489,-323,60,6,55,.16);
  // Aperture side edges and crown: the sky remains visible through the 35x55m opening.
  box(concrete,190,5,-323,130,10,90);landmark('World Financial Center · 492 m',190,-323,492,100,65);
  // Jin Mao: eightfold pagoda setbacks and tiered spire.
  let y=0;const jinX=-57,jinZ=-390;
  const tiers=[ [54,50],[53,47],[51,44],[48,42],[45,39],[41,35],[37,31],[33,27],[28,23],[24,18],[19,15],[15,12],[10,10] ];
  const total=tiers.reduce((a,t)=>a+t[1],0), scale=382/total;
  for(const [radius,height] of tiers){const h=height*scale;
    mesh(new THREE.CylinderGeometry(radius*.96,radius,h,8),silverGlass,new THREE.Vector3(jinX,y+h/2,jinZ)).rotation.y=Math.PI/8;
    mesh(new THREE.CylinderGeometry(radius+1.5,radius+3.5,3.5,8),metal,new THREE.Vector3(jinX,y+h-1.5,jinZ)).rotation.y=Math.PI/8;y+=h;
  }
  mesh(new THREE.CylinderGeometry(.5,9,38.5,8),metal,new THREE.Vector3(jinX,401.25,jinZ));
  box(concrete,jinX,6,jinZ,145,12,105);landmark('Jin Mao Tower · 420.5 m',jinX,jinZ,420.5,115,115);
  // Oriental Pearl's tripod, three main spheres, observation belts and slender mast.
  const opX=-541,opZ=-678,op=new THREE.Group();op.position.set(opX,0,opZ);root.add(op);
  function beam(a,b,r,material,parent=root){const dir=new THREE.Vector3().subVectors(b,a),m=mesh(new THREE.CylinderGeometry(r,r,dir.length(),10),material,a.clone().add(b).multiplyScalar(.5),parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;}
  for(let k=0;k<3;k++){const a=k/3*Math.PI*2;beam(new THREE.Vector3(Math.cos(a)*50,0,Math.sin(a)*50),new THREE.Vector3(Math.cos(a)*18,118,Math.sin(a)*18),8,concrete,op);beam(new THREE.Vector3(Math.cos(a)*17,118,Math.sin(a)*17),new THREE.Vector3(Math.cos(a)*8,295,Math.sin(a)*8),5,concrete,op);}
  for(const [h,r] of [[118,25],[295,22.5],[350,7]]){
    mesh(new THREE.SphereGeometry(r,36,22),red,new THREE.Vector3(0,h,0),op);
    for(let dy=-7;dy<=7;dy+=7)mesh(new THREE.CylinderGeometry(Math.sqrt(r*r-dy*dy)+.1,Math.sqrt(r*r-dy*dy)+.1,2,36),silverGlass,new THREE.Vector3(0,h+dy,0),op);
  }
  mesh(new THREE.CylinderGeometry(3,7,126,16),concrete,new THREE.Vector3(0,400,0),op);mesh(new THREE.CylinderGeometry(.45,2,10,8),metal,new THREE.Vector3(0,463,0),op);
  box(concrete,opX,5,opZ,145,10,125);landmark('Oriental Pearl · 468 m',opX,opZ,468,135,135);

  // Historic Bund sandstone frontage west of Huangpu, a recognizable architectural contrast.
  const bundX=-2090;
  for(let i=0;i<15;i++){
    const z=-1300+i*130,h=30+(i%4)*8,w=90,d=85;
    building(bundX,z,w,d,h,brownGlass);box(stone,bundX,h*.5,z+46,w,h,4);
    box(stone,bundX,h+2,z,w+6,4,d+6);
    for(let col=-36;col<=36;col+=12)box(concrete,bundX+col,h*.48,z+49,2.7,h*.9,3);
    if(i===6||i===9){mesh(new THREE.SphereGeometry(15,20,12,0,Math.PI*2,0,Math.PI/2),mat(0x4e796b),new THREE.Vector3(bundX,h+5,z));}
  }
  box(concrete,-1950,.3,-360,58,.6,2350);box(asphalt,-2020,.21,-360,32,.1,2350);
  landmarks.push({name:'The Bund · historic waterfront',position:new THREE.Vector3(-2090,45,-360)});
  // River-bank promenades and retaining walls in one batch.
  banks.forEach((b,i)=>{if(i===banks.length-1)return;for(let side=0;side<2;side++){
    const a=b[side],c=banks[i+1][side],dist=a.distanceTo(c),yaw=Math.atan2(c.x-a.x,c.z-a.z);
    box(concrete,(a.x+c.x)/2,-.1,(a.z+c.z)/2,9,1,dist+2,yaw);
  }});
  // Trees with individual canopies, roads at ground scale, rooftop mechanical details.
  const leaves=mat(0x46694b), trunks=mat(0x655949);
  for(let i=0;i<1600;i++){
    const x=-4500+rand()*8300,z=-2800+rand()*6700;
    if(riverDistance(x,z)<325||Math.hypot(x,z)<110)continue;
    const isRoad=Math.min(Math.abs((x+4900)%220-106),Math.abs((z+2900)%220-106))<18;
    if(!isRoad)continue;
    batch(unitCylinder,trunks,x,3,z,.6,6,.6);batch(unitSphere,leaves,x,8,z,3+rand()*2,5,3+rand()*2);
  }
  const carMats=[mat(0xc6cdd0),mat(0x22364c),mat(0x9e3f36),mat(0xd4b779)];
  for(let i=0;i<160;i++){
    const x=-4900+Math.floor(rand()*36)*220+106,z=-2900+rand()*6200;
    if(riverDistance(x,z)<330)continue;box(carMats[i%4],x+5,1,z,2,1.8,4.5);box(black,x+5,2,z-.2,1.8,.5,2.8);
  }
  // Boats are non-combat scenery with slow visible river movement.
  const boatMat=mat(0xe0ded3),cargoMat=mat(0x637c8b);
  for(let i=0;i<7;i++){
    const b=new THREE.Group();root.add(b);
    const hull=mesh(new THREE.BoxGeometry(15,5,55),boatMat,new THREE.Vector3(0,2.4,0),b);
    const cabin=mesh(new THREE.BoxGeometry(10,9,15),white,new THREE.Vector3(0,8,15),b);
    mesh(new THREE.BoxGeometry(12,5,23),cargoMat,new THREE.Vector3(0,6,-9),b);
    boats.push({mesh:b,t:.27+i*.064});
  }
  // Fictional north-facing practice airport away from the architectural centre.
  const airportX=4500,airportZ=2500;
  box(grass,airportX,.02,airportZ,1550,.03,3000);
  box(asphalt,airportX,.13,airportZ,55,.22,2400);
  box(concrete,airportX+250,.12,airportZ+200,320,.2,1000);
  box(asphalt,airportX+115,.14,airportZ,24,.22,2340);
  const runwayMark=canvasTexture(512,1024,ctx=>{
    ctx.fillStyle='#343c41';ctx.fillRect(0,0,512,1024);ctx.strokeStyle='#e8e9df';ctx.lineWidth=7;ctx.strokeRect(22,12,468,1000);
    ctx.setLineDash([50,50]);ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(256,115);ctx.lineTo(256,910);ctx.stroke();ctx.setLineDash([]);
    for(let side=0;side<2;side++)for(let j=0;j<5;j++){ctx.fillStyle='#ededdf';ctx.fillRect(47+j*29+side*273,34,14,48);ctx.fillRect(47+j*29+side*273,939,14,48);}
    ctx.font='bold 76px sans-serif';ctx.textAlign='center';ctx.fillStyle='#eeefe4';ctx.fillText('36',256,156);ctx.save();ctx.translate(256,870);ctx.rotate(Math.PI);ctx.fillText('18',0,0);ctx.restore();
  });
  const runwayPlane=mesh(new THREE.PlaneGeometry(55,2400),mat(0xffffff,{map:runwayMark,roughness:.95}),new THREE.Vector3(airportX,.26,airportZ));runwayPlane.rotation.x=-Math.PI/2;
  for(let z=airportZ-1180;z<airportZ+1190;z+=60)for(let side=-1;side<=1;side+=2){box(white,airportX+side*30,.7,z,.8,.7,.8);}
  for(let i=0;i<4;i++) {box(concrete,airportX+350,17,airportZ-300+i*190,100,34,130);box(blueGlass,airportX+298,15,airportZ-300+i*190,1,28,98);collision(airportX+350,airportZ-300+i*190,100,130,34);}
  building(airportX+240,airportZ+760,30,30,52,concrete);box(blueGlass,airportX+240,54,airportZ+760,45,10,45);
  const signTex=canvasTexture(1024,128,ctx=>{ctx.fillStyle='#153239';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#dceee8';ctx.font='bold 51px sans-serif';ctx.textAlign='center';ctx.fillText('SHANGHAI  /  PRACTICE FIELD',512,85);});
  mesh(new THREE.PlaneGeometry(140,17.5),mat(0xffffff,{map:signTex}),new THREE.Vector3(airportX+350,30,airportZ+695));
  landmarks.push({name:'Practice Field · fictional runway 18 / 36',position:new THREE.Vector3(airportX,8,airportZ)});
  // Elevated heli pad in a kept-clear landscaped flight park. No opaque bottom HUD.
  const heliX=550,heliZ=1000;
  box(concrete,heliX,.7,heliZ,92,1.4,92);box(asphalt,heliX,1.45,heliZ,74,.1,74);
  const heliTex=canvasTexture(512,512,ctx=>{ctx.fillStyle='#454f53';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#e5dfb8';ctx.lineWidth=9;ctx.beginPath();ctx.arc(256,256,211,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f2f0dc';ctx.font='bold 190px sans-serif';ctx.textAlign='center';ctx.fillText('H',256,321);ctx.font='27px sans-serif';ctx.fillText('LUJIAZUI FLIGHT PARK',256,449);});
  const hp=mesh(new THREE.PlaneGeometry(68,68),mat(0xffffff,{map:heliTex}),new THREE.Vector3(heliX,1.53,heliZ));hp.rotation.x=-Math.PI/2;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(yellow,heliX+Math.cos(a)*37,2.1,heliZ+Math.sin(a)*37,1,.8,1);}
  landmarks.push({name:'Flight Park · fictional helipad',position:new THREE.Vector3(heliX,3,heliZ)});
  // Dedicated uninhabited target field: no targets on actual city landmarks.
  const rangeX=6500,rangeZ=-600;box(mat(0x877e65),rangeX,.12,rangeZ,1250,.2,1800);
  box(yellow,rangeX,.25,rangeZ+930,1250,.1,9);
  const targetTexture=canvasTexture(256,256,ctx=>{ctx.fillStyle='#e0dccb';ctx.fillRect(0,0,256,256);for(let r=110;r>0;r-=22){ctx.fillStyle=Math.round(r/22)%2?'#ad4c38':'#e7dec8';ctx.beginPath();ctx.arc(128,128,r,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#2c3331';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(128,5);ctx.lineTo(128,251);ctx.moveTo(5,128);ctx.lineTo(251,128);ctx.stroke();});
  const targetMaterial=mat(0xffffff,{map:targetTexture,side:THREE.DoubleSide});
  for(let i=0;i<12;i++){
    const x=rangeX-360+(i%4)*240,z=rangeZ+400-Math.floor(i/4)*400,y=i<4?9:14;
    const target=mesh(new THREE.PlaneGeometry(18,18),targetMaterial,new THREE.Vector3(x,y,z));
    box(metal,x,y/2,z,2,y,2);box(concrete,x,1,z,24,2,8);
    targets.push({position:new THREE.Vector3(x,y,z),label:`Range target ${i+1}`,mesh:target,radius:11});
    const ring=mesh(new THREE.RingGeometry(13,15,32),yellow,new THREE.Vector3(x,.27,z));ring.rotation.x=-Math.PI/2;
  }
  landmarks.push({name:'Aim Practice Range · fictional / uninhabited',position:new THREE.Vector3(rangeX,14,rangeZ)});
  const rangeSignTex=canvasTexture(1024,256,ctx=>{ctx.fillStyle='#26332f';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#f1c461';ctx.textAlign='center';ctx.font='bold 62px sans-serif';ctx.fillText('AIM PRACTICE RANGE',512,104);ctx.font='33px sans-serif';ctx.fillText('FICTIONAL TRAINING TARGETS ONLY',512,180);});
  mesh(new THREE.PlaneGeometry(120,30),mat(0xffffff,{map:rangeSignTex}),new THREE.Vector3(rangeX,24,rangeZ+890));
  // Flush instances after all content is assembled.
  for(const {geometry,material,matrices} of batches.values()){
    const inst=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.receiveShadow=true;inst.castShadow=false;inst.computeBoundingSphere();root.add(inst);
  }
  function groundHeight(x,z){ if(Math.abs(x-heliX)<46&&Math.abs(z-heliZ)<46)return 1.53;if(Math.abs(x-airportX)<28&&Math.abs(z-airportZ)<1200)return .26;if(riverDistance(x,z)<277)return -5;return 0; }
  function update(time,dt){
    if(water.userData.shader)water.userData.shader.uniforms.cityTime.value=time;
    for(const boat of boats){const t=(boat.t+time*.000012)%1,p=riverCurve.getPoint(t),d=riverCurve.getTangent(t);boat.mesh.position.set(p.x,-.1,p.z);boat.mesh.rotation.y=Math.atan2(d.x,d.z);}
  }
  return {groundHeight,runwaySpawn:new THREE.Vector3(airportX,.26,airportZ+900),heliSpawn:new THREE.Vector3(heliX,1.53,heliZ),airSpawn:new THREE.Vector3(120,380,1450),rangeSpawn:new THREE.Vector3(rangeX,80,rangeZ+1050),targets,colliders,update,landmarks,root};
}

function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}

