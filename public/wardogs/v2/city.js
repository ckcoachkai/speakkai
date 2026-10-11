import * as THREE from './three.module.js';
import {createPhotoMaterials} from './materials.js?v=20261012-textures';
import {createFoliage} from './foliage.js?v=20261012-textures';

// Shanghai architectural study. Landmark dimensions follow architect / operator
// sources; OSM footprints and waterways form the selected core, not a surveyed map.
// The flight facilities and target range are deliberately fictional.
export function createCity(scene) {
  const root = new THREE.Group(); root.name = 'Shanghai • architectural study'; scene.add(root);
  const colliders = [], landmarks = [], targets = [], boats = [], beacons = [];
  const batches = new Map();
  const geoData=scene.userData.shanghaiGeo||scene.userData.shanghaiGeoData||null;
  const waterShaders=[];
  const photographic=createPhotoMaterials();
  const geoWater=(geoData?.water||[]).filter(w=>w.polygon?.length>=3).map(w=>({...w,minX:Math.min(...w.polygon.map(p=>p[0])),maxX:Math.max(...w.polygon.map(p=>p[0])),minZ:Math.min(...w.polygon.map(p=>p[1])),maxZ:Math.max(...w.polygon.map(p=>p[1]))}));
  const geoParks=(geoData?.parks||[]).filter(w=>w.polygon?.length>=3).map(w=>({...w,minX:Math.min(...w.polygon.map(p=>p[0])),maxX:Math.max(...w.polygon.map(p=>p[0])),minZ:Math.min(...w.polygon.map(p=>p[1])),maxZ:Math.max(...w.polygon.map(p=>p[1]))}));
  function insideRing(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function inGeoWater(x,z){return geoWater.some(w=>x>=w.minX&&x<=w.maxX&&z>=w.minZ&&z<=w.maxZ&&insideRing(x,z,w.polygon)&&!(w.holes||[]).some(h=>insideRing(x,z,h)));}
  function polygonShape(points,holes=[]){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();for(const ring of holes){if(ring.length<3)continue;const h=new THREE.Path();ring.forEach((p,i)=>i?h.lineTo(p[0],-p[1]):h.moveTo(p[0],-p[1]));h.closePath();s.holes.push(h);}return s;}
  let seed = 17419;
  function rand() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...opts });
  const concrete = mat(0xa7a59d), stone = mat(0xb3aaa0), metal = mat(0x879da5, { metalness: .55, roughness: .3 });
  const black = mat(0x202a30), asphalt = mat(0x3b4449), grass = mat(0x687653), white = mat(0xdfe5de), yellow = mat(0xeab545);
  const warmGlass = facadeMaterial(0x9baeb4, 0); const blueGlass = facadeMaterial(0x789bac, 1);
  const silverGlass = facadeMaterial(0xa5b5bb, 2); const brownGlass = facadeMaterial(0xb5a99a, 3);
  const residentialFacade=facadeMaterial(0xf0f0e9,4),historicFacade=facadeMaterial(0xcec8bb,5),towerGlass=facadeMaterial(0xa5b7c0,6);
  const residentialVariants=[residentialFacade,facadeMaterial(0xd5dde0,4),facadeMaterial(0xe5decf,4)];
  const red = mat(0x974853, { metalness: .48, roughness: .37 });
  const roof = mat(0x616b6c);
  const urbanGround=mat(0x777d78,{roughness:.93}),roofVariants=[mat(0x626968,{roughness:.78}),mat(0x8f8a7c,{roughness:.82}),mat(0x718176,{roughness:.80})];
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
  concrete.map=grainTexture([204,204,193],27,3);
  urbanGround.map=grainTexture([188,192,184],41,4);
  for(const m of roofVariants)m.map=roof.map;
  // Embedded licensed surface photographs; all repeats are measured in metres.
  photographic.applySurface(concrete,'concrete',1.8,.24);
  photographic.applySurface(stone,'concrete',1.8,.22);
  asphalt.color.set(0xc0c1bb);photographic.applySurface(asphalt,'asphalt',3.0,.23);
  grass.color.set(0xc6d2a9);photographic.applySurface(grass,'grass',2.51,.32);
  photographic.applySurface(urbanGround,'concrete',1.8,.18);
  photographic.applySurface(roof,'roof',1.5,.30);
  for(const m of roofVariants)photographic.applySurface(m,'roof',1.5,.30);
  for(const m of residentialVariants)photographic.applyMasonry(m,'plaster',1.0,.20);
  photographic.applyMasonry(historicFacade,'masonry',1.0,.32);
  const unitBox = new THREE.BoxGeometry(1, 1, 1), unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
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
    const shape=Math.abs(Math.floor(x*.13+z*.19))%7;
    // Office podium / shaft / crown massing rather than one extrusion per tower.
    let roofW=w,roofD=d;
    if(h>95&&shape<3){
      const podium=h*.17,shaftTop=h*.85;roofW=w*.70;roofD=d*.72;
      box(material,x,podium*.5,z,w,podium,d,rotation);
      box(material,x,(podium+shaftTop)*.5,z,w*.86,shaftTop-podium,d*.87,rotation);
      box(material,x,(shaftTop+h)*.5,z,roofW,h-shaftTop,roofD,rotation);
      box(metal,x,shaftTop,z,w*.87,1,d*.88,rotation);
    }else if(h>110&&shape===3){
      box(material,x,h*.42,z,w,h*.84,d,rotation);roofW=w*.65;roofD=d*.65;
      box(silverGlass,x,h*.92,z,roofW,h*.16,roofD,rotation);
    }else{box(material,x,h/2,z,w,h,d,rotation);}
    box(roof, x, h+.9, z, roofW*.94, 1.8, roofD*.94, rotation);
    // Balconies and cornices are architectural ledges, independently instanced.
    if(material===residentialFacade){
      for(let floor=2;floor<h/3.2;floor+=4){box(concrete,x,floor*3.2,z+d*.5+.45,w*.92,.28,1.1,rotation);box(concrete,x,floor*3.2,z-d*.5-.45,w*.92,.28,1.1,rotation);}
    }else if(material===historicFacade){box(stone,x,h-1.5,z,w+2,1.8,d+2,rotation);box(stone,x,4,z,w+1,.8,d+1,rotation);}
    if (h > 65) {
      box(metal, x+4, h+3.5, z-3, roofW*.23, 5, roofD*.25, rotation);
      for(let j=0;j<2;j++){batch(unitCylinder,metal,x-roofW*.3+j*roofW*.20,h+3,z+roofD*.25,1.1,4,1.1);}
      box(concrete,x-roofW*.48,h+1.5,z,1,3,roofD);box(concrete,x+roofW*.48,h+1.5,z,1,3,roofD);
      box(concrete,x,h+1.5,z-roofD*.48,roofW,3,1);box(concrete,x,h+1.5,z+roofD*.48,roofW,3,1);
    }
    collision(x, z, w, d, h+5);
  }
  function facadeMaterial(color, variant) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d'),solid=variant===4||variant===5;
    ctx.fillStyle=solid?(variant===5?'#c4b9a3':'#c3c2b9'):'#7b8c95';ctx.fillRect(0,0,256,256);
    for (let row=0; row<8; row++) for(let col=0;col<8;col++) {
      // Muted irregular blinds and pane reflections; no large checkerboard pattern.
      const noise=((row*73+col*41+row*col*19+variant*53)%17)/17;
      const v=Math.floor(138+noise*29);
      ctx.fillStyle=`rgb(${v-7},${v+4},${v+10})`;
      if(solid)ctx.fillRect(col*32+8,row*32+7,16,20);else ctx.fillRect(col*32+1,row*32+1,30,25);
      if(noise>.80){ctx.fillStyle=solid?'rgba(195,191,165,.40)':'rgba(191,193,183,.19)';ctx.fillRect(col*32+(solid?9:3),row*32+(solid?8:2),solid?14:26,8+Math.floor(noise*6));}
      ctx.fillStyle='rgba(223,234,237,.16)';ctx.fillRect(col*32+(solid?9:2),row*32+(solid?8:2),solid?14:28,2);
      ctx.fillStyle='rgba(39,55,65,.22)';ctx.fillRect(col*32+(solid?9:2),row*32+25,solid?14:28,2);
      if(solid){ctx.fillStyle='rgba(67,76,81,.55)';ctx.fillRect(col*32+15,row*32+7,1,20);}
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const material = mat(color, { map: tex, metalness: solid?.05:.48, roughness: solid?.68:.23 });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 cityWorld;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 cityPosition=vec4(position,1.0);\n#ifdef USE_INSTANCING\ncityPosition=instanceMatrix*cityPosition;\n#endif\ncityWorld=(modelMatrix*cityPosition).xyz;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 cityWorld;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        vec3 cityNormal=abs(normalize(cross(dFdx(cityWorld),dFdy(cityWorld))));
        vec2 cityUV=${variant===6?'vMapUv*vec2(11.84,30.8)':'(cityNormal.x>cityNormal.z?vec2(cityWorld.z,cityWorld.y):vec2(cityWorld.x,cityWorld.y))'};
        vec2 cityPitch=vec2(${solid?'3.0,3.2':'1.48,3.85'});
        vec2 cityCells=cityUV/cityPitch;
        vec4 cityTex=texture2D(map,cityCells/8.0);
        vec2 cityFraction=fract(cityCells);
        vec2 cityAA=max(fwidth(cityCells)*.65,vec2(.008));
        float cityMullion=smoothstep(.014-cityAA.x,.014+cityAA.x,cityFraction.x)*smoothstep(.014-cityAA.x,.014+cityAA.x,1.0-cityFraction.x);
        float cityFloor=smoothstep(.03-cityAA.y,.03+cityAA.y,cityFraction.y);
        float cityDetail=min(1.0,1.0/(1.0+max(cityAA.x,cityAA.y)*3.0));
        cityTex.rgb*=mix(1.0,${solid?'0.91':'0.64'}+(1.0-${solid?'0.91':'0.64'})*cityMullion*cityFloor,cityDetail);
        if(cityNormal.y>.7)cityTex=vec4(.57,.60,.60,1.0);
        diffuseColor*=cityTex;
      `);
    };
    material.customProgramCacheKey = () => 'city-facade-v3-'+variant;
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
  let navigableRiver=riverCurve;
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
  let outerGrass=grass;
  if(geoData){
    outerGrass=grass.clone();photographic.applySurface(outerGrass,'grass',2.51,.32);const exteriorShader=outerGrass.onBeforeCompile;
    outerGrass.onBeforeCompile=shader=>{exteriorShader(shader);shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif(length(citySurfaceWorld.xz)<${Number(geoData.radius)||4000}.0)discard;`);};
    outerGrass.customProgramCacheKey=()=> 'photo-grass-exterior-v1';
  }
  mesh(landShape([[16000,-16000],[16000,16000],...east.slice().reverse().map(p=>[p.x,p.z])]), outerGrass);
  mesh(landShape([[-16000,16000],[-16000,-16000],...west.map(p=>[p.x,p.z])]), outerGrass);
  const waterPositions=[], waterUV=[], waterIndices=[];
  banks.forEach((b,i)=>{ b.forEach((p,j)=>{waterPositions.push(p.x,-.24,p.z);waterUV.push(j,i*.8);});if(i<180){const n=i*2;waterIndices.push(n,n+1,n+2,n+1,n+3,n+2);} });
  const waterGeometry=new THREE.BufferGeometry();waterGeometry.setAttribute('position',new THREE.Float32BufferAttribute(waterPositions,3));waterGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(waterUV,2));waterGeometry.setIndex(waterIndices);waterGeometry.computeVertexNormals();
  const water=mat(0x496f75,{metalness:.38,roughness:.21,side:THREE.DoubleSide});
  function configureWater(material,clipCore=false){material.onBeforeCompile=shader=>{
    shader.uniforms.cityTime={value:0};waterShaders.push(shader);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 waterWorld;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float cityTime; varying vec3 waterWorld;');
    if(clipCore&&geoData)shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif(length(waterWorld.xz)<${Number(geoData.radius)||4000}.0)discard;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat waterRipples=sin(waterWorld.x*.23+waterWorld.z*.31+cityTime*.72)*sin(waterWorld.z*.19-waterWorld.x*.11-cityTime*.48);\nroughnessFactor=clamp(roughnessFactor+.08*waterRipples,.10,.34);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat riverGrain=sin(waterWorld.x*.46+waterWorld.z*.33+cityTime*.4)*sin(waterWorld.x*.14-waterWorld.z*.25-cityTime*.3);diffuseColor.rgb*=.97+riverGrain*.05;');
  };material.customProgramCacheKey=()=>clipCore?'water-outer-v2':'water-core-v2';}
  configureWater(water,true);mesh(waterGeometry,water);
  mesh(new THREE.PlaneGeometry(40000,40000), mat(0x516964),new THREE.Vector3(0,-9,0)).rotation.x=-Math.PI/2;

  function geographicCore(data){
    const merged=new Map();let built=0,estimated=0;
    const base=mesh(new THREE.CircleGeometry(Number(data.radius)||4000,96),grass,new THREE.Vector3(0,-.02,0));base.rotation.x=-Math.PI/2;
    // Polygon water replaces the old approximate river inside the geographic core.
    const actualWaterMaterial=water.clone();configureWater(actualWaterMaterial,false);
    const waterVertices=[];
    for(const w of geoWater){
      const geo=new THREE.ShapeGeometry(polygonShape(w.polygon,w.holes||[]));geo.rotateX(-Math.PI/2);
      const flat=geo.index?geo.toNonIndexed():geo,positions=flat.getAttribute('position');
      for(let i=0;i<positions.count;i++)waterVertices.push(positions.getX(i),.20,positions.getZ(i));
      if(flat!==geo)flat.dispose();geo.dispose();
    }
    const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(waterVertices,3));wg.computeVertexNormals();mesh(wg,actualWaterMaterial);
    function mergeGeometry(geometry,material,capMaterial=null){
      const g=geometry.index?geometry.toNonIndexed():geometry;
      const position=g.getAttribute('position'),normal=g.getAttribute('normal'),uv=g.getAttribute('uv');
      for(const range of g.groups.length?g.groups:[{start:0,count:position.count,materialIndex:1}]){
        const selected=range.materialIndex===0&&capMaterial?capMaterial:material;
        if(!merged.has(selected.uuid))merged.set(selected.uuid,{material:selected,positions:[],normals:[],uvs:[]});
        const group=merged.get(selected.uuid);
        for(let i=range.start;i<range.start+range.count;i++){group.positions.push(position.getX(i),position.getY(i),position.getZ(i));group.normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));group.uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}
      }
      if(g!==geometry)g.dispose();geometry.dispose();
    }
    // Urban ground follows river exclusions. Real roads replace the invented grid.
    const radius=Math.min(4200,Number(data.radius)||4000);
    for(let x=-radius;x<radius;x+=160)for(let z=-radius;z<radius;z+=160){
      if(Math.hypot(x,z)>radius||inGeoWater(x,z))continue;
      const park=Math.hypot(x-450,z+470)<180||(Math.abs(x-550)<100&&Math.abs(z-1000)<150);
      box(park?grass:urbanGround,x,.01,z,160,.02,160);
    }
    // Actual park polygons retain courtyards and lakes; no guessed green street grid.
    const parkVertices=[],parkUvs=[];
    for(const park of geoParks){
      const g=new THREE.ShapeGeometry(polygonShape(park.polygon,park.holes||[]));g.rotateX(-Math.PI/2);const flat=g.index?g.toNonIndexed():g,p=flat.getAttribute('position'),uv=flat.getAttribute('uv');
      for(let i=0;i<p.count;i++){parkVertices.push(p.getX(i),.04,p.getZ(i));parkUvs.push(uv.getX(i),uv.getY(i));}if(flat!==g)flat.dispose();g.dispose();
    }
    if(parkVertices.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(parkVertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(parkUvs,2));g.computeVertexNormals();mesh(g,grass);}
    for(const item of data.buildings||[]){
      let points=(item.polygon||[]).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
      if(points.length<3)continue;if(points.length>3&&points[0][0]===points.at(-1)[0]&&points[0][1]===points.at(-1)[1])points=points.slice(0,-1);
      const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minZ=Math.min(...points.map(p=>p[1])),maxZ=Math.max(...points.map(p=>p[1]));
      const x=(minX+maxX)*.5,z=(minZ+maxZ)*.5,w=maxX-minX,d=maxZ-minZ;
      if(w<2||d<2||w>800||d>800)continue;
      if(Math.abs(x-550)<115&&Math.abs(z-1000)<160)continue;
      if([[-404.6,-216.8],[-234.1,-331.4],[-389.9,-406.4],[-973.2,-926.6]].some(([lx,lz])=>Math.hypot(x-lx,z-lz)<160))continue;
      let h=Number(item.height),wasEstimated=!!item.estimated;
      if(!Number.isFinite(h)||h<=0){h=Number(item.levels)>0?Number(item.levels)*3.25:(x<-1900?18:30);wasEstimated=true;}
      h=Math.max(4,Math.min(400,h));const minHeight=Math.max(0,Number(item.minHeight)||0);
      const id=Number(String(item.id||built).match(/\d+/)?.[0])||built;
      // Most residential exteriors use light weathered plaster. Individual
      // facade materials are inferred; mapped footprints/heights are preserved.
      let material=h>65?[warmGlass,blueGlass,silverGlass][id%3]:residentialVariants[id%3];
      if(h<45&&id%10<3)material=historicFacade;
      const shape=polygonShape(points,item.holes||[]);
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:Math.max(2,h-minHeight),bevelEnabled:false,curveSegments:1,steps:1});geometry.rotateX(-Math.PI/2);geometry.translate(0,minHeight,0);
      mergeGeometry(geometry,material,roofVariants[id%roofVariants.length]);
      collision(x,z,w,d,h);batch(contactGeometry,contactShadow,x,.045,z,w*1.22,1,d*1.22);
      // Small rooftop machinery gives silhouettes without duplicating entire roofs.
      if(h>45&&w>14&&d>14&&insideRing(x,z,points)&&!(item.holes||[]).some(hole=>insideRing(x,z,hole))){box(roof,x,h+.65,z,Math.min(w*.28,13),1.3,Math.min(d*.25,10));box(metal,x,h+1.8,z,Math.min(w*.20,9),1.8,Math.min(d*.2,7));}
      if(wasEstimated)estimated++;built++;
    }
    for(const group of merged.values()){
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(group.positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(group.normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(group.uvs,2));geometry.computeBoundingSphere();mesh(geometry,group.material);
    }
    for(const road of data.roads||[]){
      const points=road.points||[],width=Math.max(2,Math.min(42,Number(road.width)||(['motorway','trunk','primary'].includes(road.kind)?17:road.kind==='secondary'?11:6)));
      for(let i=0;i<points.length-1;i++){
        const a=points[i],b=points[i+1];if(!a||!b||![...a,...b].every(Number.isFinite))continue;
        const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<1||length>1500)continue;
        const x=(a[0]+b[0])*.5,z=(a[1]+b[1])*.5,yaw=Math.atan2(dx,dz);
        if(Math.abs(x-550)<80&&Math.abs(z-1000)<120)continue;
        if(inGeoWater(x,z)&&!road.bridge)continue;
        const roadY=road.bridge?Math.max(2,Number(road.layer||1)*4):0;
        box(concrete,x,roadY+.055,z,width+3,.07,length+2,yaw);box(asphalt,x,roadY+.115,z,width,.07,length+1,yaw);
        if(width>=11){for(let distance=12;distance<length;distance+=28){const t=distance/length;box(white,a[0]+dx*t,roadY+.16,a[1]+dz*t,.20,.018,5,yaw);}}
      }
    }
    root.userData.geography={source:data.source||'OpenStreetMap / Geofabrik',radius,buildingCount:built,estimatedHeightCount:estimated,roadCount:(data.roads||[]).length,waterPolygonCount:geoWater.length,parkPolygonCount:geoParks.length};
    // Derive a shipping route from the broadest real river cross-sections.
    const route=[];
    for(let z=-3600;z<=3600;z+=240){
      let best=null;
      for(const w of geoWater){
        if(z<w.minZ||z>w.maxZ)continue;const crossings=[];
        for(let i=0,j=w.polygon.length-1;i<w.polygon.length;j=i++){
          const a=w.polygon[i],b=w.polygon[j];if((a[1]>z)!==(b[1]>z))crossings.push(a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]));
        }
        crossings.sort((a,b)=>a-b);
        for(let i=0;i<crossings.length-1;i+=2){const span=crossings[i+1]-crossings[i],x=(crossings[i+1]+crossings[i])*.5;if(span>120&&span<1300&&Math.hypot(x,z)<radius&&(!best||span>best.span)&&inGeoWater(x,z))best={x,span};}
      }
      if(best)route.push(new THREE.Vector3(best.x,0,z));
    }
    if(route.length>4)navigableRiver=new THREE.CatmullRomCurve3(route);
  }
  if(geoData)geographicCore(geoData);

  // Downtown road blocks, sidewalks, park gaps; common instancing avoids thousands of draw calls.
  for(let x=-4900;x<=3600;x+=220) for(let z=-2900;z<=3900;z+=220) {
    if(geoData&&Math.hypot(x,z)<(Number(geoData.radius)||4000)+100)continue;
    if(riverDistance(x,z)<385) continue;
    box(concrete,x,.04,z,196,.07,196); box(asphalt,x+106,.09,z,23,.06,220);box(asphalt,x,.1,z+106,220,.06,23);
    box(stone,x+92,.125,z,1.1,.09,194);box(stone,x,.125,z+92,194,.09,1.1);
    for(let s=-80;s<=80;s+=40){box(white,x+106,.14,z+s,.7,.02,13);box(white,x+s,.14,z+106,13,.02,.7);}
    if(Math.abs(x)<1800&&Math.abs(z)<1500){for(let stripe=0;stripe<5;stripe++){box(white,x+100+stripe*2.6,.16,z+82,1.2,.015,6);box(white,x+82,.16,z+100+stripe*2.6,6,.015,1.2);}}
    const isGreen = ((x===600 || x===820) && z>=-700 && z<=180) || rand()<.07;
    if(isGreen){box(grass,x,.13,z,176,.15,176);continue;}
    for(let bx=-1;bx<=1;bx+=2) for(let bz=-1;bz<=1;bz+=2) {
      const px=x+bx*46+(rand()-.5)*14,pz=z+bz*46+(rand()-.5)*14;
      if(Math.hypot(px,pz)<145 || Math.hypot(px-190,pz+323)<135 || Math.hypot(px+57,pz+390)<120 || Math.hypot(px+541,pz+678)<145) continue;
      if(Math.abs(px-550)<110&&Math.abs(pz-1000)<150) continue;
      const central=Math.exp(-Math.hypot(px-300,pz+150)/1600);
      let h=15+rand()*65+central*rand()*rand()*210;const w=32+rand()*35,d=32+rand()*35;
      const choice=rand();let facade=[warmGlass,blueGlass,silverGlass,brownGlass][Math.floor(rand()*4)];
      if(px<-2000){h=Math.min(h,22+choice*36);facade=choice<.65?historicFacade:residentialFacade;}
      else if((px>1700||Math.abs(pz)>1800)&&choice<.72){h=32+choice*95;facade=residentialFacade;}
      else if(h<65&&choice<.35){facade=historicFacade;}
      building(px,pz,w,d,h,facade);
      if(rand()<.23&&h>100)box(brownGlass,px,h*.06,pz,w+6,h*.12,d+6);
    }
  }
  // Cluster of specifically placed secondary towers around the Lujiazui triad.
  if(!geoData){
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
  }

  function landmark(name,x,z,h,w,d) { landmarks.push({name,position:new THREE.Vector3(x,h*.55,z)});collision(x,z,w,d,h); }
  function landmarkStart(){return{children:root.children.length,colliders:colliders.length,landmarks:landmarks.length,batches:new Map([...batches.entries()].map(([key,b])=>[key,b.matrices.length]))};}
  function locateLandmark(start,dx,dz){
    if(!geoData)return;const delta=new THREE.Vector3(dx,0,dz),translation=new THREE.Matrix4().makeTranslation(dx,0,dz);
    for(let i=start.children;i<root.children.length;i++)root.children[i].position.add(delta);
    for(let i=start.colliders;i<colliders.length;i++)colliders[i].translate(delta);
    for(let i=start.landmarks;i<landmarks.length;i++)landmarks[i].position.add(delta);
    for(const [key,b] of batches)for(let i=start.batches.get(key)||0;i<b.matrices.length;i++)b.matrices[i].premultiply(translation);
  }
  // Shanghai Tower: 120-degree spiral, rounded three-lobed plan, exponential taper.
  let landmarkMark=landmarkStart();
  const towerPositions=[],towerUV=[],towerIndices=[],segments=72,levels=132;
  for(let j=0;j<=levels;j++){
    const t=j/levels, angle=t*Math.PI*2/3, r=47*Math.pow(.55,t);
    for(let k=0;k<=segments;k++){
      const a=k/segments*Math.PI*2, radius=r*(1+.085*Math.cos(3*a));
      towerPositions.push(Math.cos(a+angle)*radius,t*632,Math.sin(a+angle)*radius);
      towerUV.push(k/segments*24,t*127/8);
      if(j<levels&&k<segments){const n=j*(segments+1)+k;towerIndices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
    }
  }
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(towerPositions,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(towerUV,2));tg.setIndex(towerIndices);tg.computeVertexNormals();mesh(tg,towerGlass);
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
  locateLandmark(landmarkMark,-404.6,-216.8);landmarkMark=landmarkStart();

  // SWFC: tapered trapezoid + real open aperture at the top, not a black decal.
  const sw=new THREE.Group();sw.position.set(190,0,-323);sw.rotation.y=.16;root.add(sw);
  function wedge(widthBase,widthTop,height,y,depth,material,parent=sw){const sh=new THREE.Shape();sh.moveTo(-widthBase/2,0);sh.lineTo(widthBase/2,0);sh.lineTo(widthTop/2,height);sh.lineTo(-widthTop/2,height);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false});g.translate(0,y,-depth/2);return mesh(g,material,null,parent);}
  wedge(91,54,425,0,55,blueGlass);wedge(11,8,60,425,55,silverGlass).position.x=-22;
  wedge(11,8,60,425,55,silverGlass).position.x=22;box(metal,190,489,-323,60,6,55,.16);
  // Aperture side edges and crown: the sky remains visible through the 35x55m opening.
  box(concrete,190,5,-323,130,10,90);landmark('World Financial Center · 492 m',190,-323,492,100,65);
  locateLandmark(landmarkMark,-424.1,-8.4);landmarkMark=landmarkStart();
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
  locateLandmark(landmarkMark,-332.9,-16.4);landmarkMark=landmarkStart();
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
  locateLandmark(landmarkMark,-432.2,-248.6);

  // Historic Bund sandstone frontage west of Huangpu, a recognizable architectural contrast.
  const bundX=-2090;
  for(let i=0;i<(geoData?0:15);i++){
    const z=-1300+i*130,h=30+(i%4)*8,w=90,d=85;
    building(bundX,z,w,d,h,historicFacade);box(stone,bundX,h*.5,z+46,w,h,4);
    box(stone,bundX,h+2,z,w+6,4,d+6);
    for(let col=-36;col<=36;col+=12)box(concrete,bundX+col,h*.48,z+49,2.7,h*.9,3);
    if(i===6||i===9){mesh(new THREE.SphereGeometry(15,20,12,0,Math.PI*2,0,Math.PI/2),mat(0x4e796b),new THREE.Vector3(bundX,h+5,z));}
  }
  if(!geoData){box(concrete,-1950,.3,-360,58,.6,2350);box(asphalt,-2020,.21,-360,32,.1,2350);}
  landmarks.push({name:'The Bund · historic waterfront',position:new THREE.Vector3(-2090,45,-360)});
  // River-bank promenades and retaining walls in one batch.
  banks.forEach((b,i)=>{if(i===banks.length-1)return;for(let side=0;side<2;side++){
    const a=b[side],c=banks[i+1][side],dist=a.distanceTo(c),yaw=Math.atan2(c.x-a.x,c.z-a.z);
    if(geoData&&Math.hypot((a.x+c.x)*.5,(a.z+c.z)*.5)<Number(geoData.radius||4000))continue;
    box(concrete,(a.x+c.x)/2,-.1,(a.z+c.z)/2,9,1,dist+2,yaw);
  }});
  // Trees with individual canopies, roads at ground scale, rooftop mechanical details.
  const treePositions=[];
  const cityRoads=(geoData?.roads||[]).filter(r=>['primary','secondary','tertiary','residential','unclassified','service'].includes(r.kind)&&r.points?.length>1);
  for(let i=0;i<1600;i++){
    let x=-4500+rand()*8300,z=-2800+rand()*6700;
    if(geoData){
      if(geoParks.length&&i<1100){
        const park=geoParks[Math.floor(rand()*geoParks.length)];let found=false;
        for(let attempt=0;attempt<4;attempt++){x=park.minX+rand()*(park.maxX-park.minX);z=park.minZ+rand()*(park.maxZ-park.minZ);if(insideRing(x,z,park.polygon)&&!(park.holes||[]).some(h=>insideRing(x,z,h))){found=true;break;}}
        if(!found)continue;
      }else if(cityRoads.length){
        const road=cityRoads[Math.floor(rand()*cityRoads.length)];if(road.bridge)continue;
        const j=Math.floor(rand()*(road.points.length-1)),a=road.points[j],b=road.points[j+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<4)continue;
        const offset=(Number(road.width)||6)*.5+2.2,t=rand(),side=rand()<.5?-1:1;
        x=a[0]+dx*t+dz/len*offset*side;z=a[1]+dz*t-dx/len*offset*side;
      }
      if(inGeoWater(x,z))continue;
    }else{
      if(riverDistance(x,z)<325||Math.hypot(x,z)<110)continue;
      const isRoad=Math.min(Math.abs((x+4900)%220-106),Math.abs((z+2900)%220-106))<18;if(!isRoad)continue;
    }
    if(Math.abs(x-550)<42&&Math.abs(z-1000)<42)continue;
    if(geoData&&colliders.some(b=>x>b.min.x-3&&x<b.max.x+3&&z>b.min.z-3&&z<b.max.z+3))continue;
    const growth=.65+rand()*.6;treePositions.push({x,z,y:0,height:10*growth});
  }
  const foliage=createFoliage(root,treePositions);root.userData.treeCount=treePositions.length;
  root.userData.treePositions=treePositions.map(t=>[t.x,t.y,t.z,t.height]);
  const carMats=[mat(0xc6cdd0),mat(0x22364c),mat(0x9e3f36),mat(0xd4b779)];
  for(let i=0;i<160;i++){
    let x=-4900+Math.floor(rand()*36)*220+106,z=-2900+rand()*6200,y=0,yaw=0;
    if(geoData&&cityRoads.length){
      const road=cityRoads[Math.floor(rand()*cityRoads.length)],j=Math.floor(rand()*(road.points.length-1)),a=road.points[j],b=road.points[j+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<6)continue;
      const t=rand();x=a[0]+dx*t+dz/length*1.5;z=a[1]+dz*t-dx/length*1.5;yaw=Math.atan2(dx,dz);y=road.bridge?Math.max(2,Number(road.layer||1)*4):0;
      if(inGeoWater(x,z)&&!road.bridge)continue;
    }else{if(riverDistance(x,z)<330)continue;x+=5;}
    if(Math.abs(x-550)<46&&Math.abs(z-1000)<46)continue;
    box(carMats[i%4],x,y+1,z,2,1.8,4.5,yaw);box(black,x,y+2,z,1.8,.5,2.8,yaw);
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
  const heliTex=canvasTexture(1024,1024,ctx=>{
    ctx.strokeStyle='#e5dfb8';ctx.lineWidth=18;ctx.beginPath();ctx.arc(512,512,422,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f2f0dc';ctx.font='bold 380px sans-serif';ctx.textAlign='center';ctx.fillText('H',512,642);ctx.font='54px sans-serif';ctx.fillText('LUJIAZUI FLIGHT PARK',512,898);
    // Thin chipped paint reveals the photographic asphalt below. Wear is
    // deterministic and affects only existing markings, never covers the pad.
    let wear=8172;ctx.globalCompositeOperation='destination-out';
    for(let i=0;i<4500;i++){wear=(Math.imul(wear,1664525)+1013904223)>>>0;const x=wear/4294967296*1024;wear=(Math.imul(wear,1664525)+1013904223)>>>0;const y=wear/4294967296*1024;ctx.fillStyle=i%5?'rgba(0,0,0,.17)':'rgba(0,0,0,.70)';ctx.fillRect(x,y,1+i%3,1+i%4);}
    ctx.globalCompositeOperation='source-over';
  });
  const padPaint=mat(0xffffff,{map:heliTex,transparent:true,alphaTest:.03,depthWrite:false,roughness:.86});
  photographic.applySurface(padPaint,'asphalt',3.0,.16,{paintMap:heliTex});
  const hp=mesh(new THREE.PlaneGeometry(68,68),padPaint,new THREE.Vector3(heliX,1.53,heliZ));hp.rotation.x=-Math.PI/2;
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
  root.userData.surfaceReady=photographic.ready;
  root.userData.surfaceReady.then(()=>{root.userData.materialFailures=photographic.failures;});
  // Flush instances after all content is assembled.
  for(const {geometry,material,matrices} of batches.values()){
    const inst=new THREE.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.receiveShadow=true;inst.castShadow=false;inst.computeBoundingSphere();root.add(inst);
  }
  function groundHeight(x,z){ if(Math.abs(x-heliX)<46&&Math.abs(z-heliZ)<46)return 1.53;if(Math.abs(x-airportX)<28&&Math.abs(z-airportZ)<1200)return .26;if(geoData&&Math.hypot(x,z)<(Number(geoData.radius)||4000))return inGeoWater(x,z)?-.25:0;if(riverDistance(x,z)<277)return -5;return 0; }
  function update(time,dt){
    for(const shader of waterShaders)shader.uniforms.cityTime.value=time;
    for(const boat of boats){const t=(boat.t+time*.000012)%1,p=navigableRiver.getPoint(t),d=navigableRiver.getTangent(t);boat.mesh.visible=!geoData||Math.hypot(p.x,p.z)>(Number(geoData.radius)||4000)||inGeoWater(p.x,p.z);boat.mesh.position.set(p.x,.15,p.z);boat.mesh.rotation.y=Math.atan2(d.x,d.z);}
  }
  return {groundHeight,runwaySpawn:new THREE.Vector3(airportX,.26,airportZ+900),heliSpawn:new THREE.Vector3(heliX,1.53,heliZ),airSpawn:new THREE.Vector3(geoData?-275:120,380,1450),rangeSpawn:new THREE.Vector3(rangeX,80,rangeZ+1050),targets,colliders,update,landmarks,root};
}

function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
