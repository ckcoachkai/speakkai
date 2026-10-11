import * as THREE from './three.module.js';
import {MATERIAL_TEXTURES} from './texture-assets.js?v=20261012-textures';

const UP=new THREE.Vector3(0,1,0);
const TAU=Math.PI*2;
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

// A branching atlas has holes between hundreds of independently oriented
// leaves, rather than painting an opaque green cloud onto a rectangle.
function broadleafAtlas(photoLeaf=null){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d'),rand=seeded(541002);
  function leaf(x,y,size,angle,lobed){
    if(photoLeaf){const aspect=Number(MATERIAL_TEXTURES.leaves?.aspect)||1,h=size*Math.sqrt(1.458/aspect),w=h*aspect;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=.85+rand()*.15;ctx.drawImage(photoLeaf,-w*.5,-h*.5,w,h);ctx.restore();return;}
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size,size);
    const gradient=ctx.createLinearGradient(-.45,-.4,.45,.4);gradient.addColorStop(0,'#90a564');gradient.addColorStop(.48,'#638146');gradient.addColorStop(1,'#3d6035');ctx.fillStyle=gradient;
    ctx.beginPath();
    if(lobed){const points=[[0,.43],[-.13,.18],[-.44,.23],[-.28,-.03],[-.56,-.15],[-.20,-.27],[-.19,-.55],[0,-.41],[.19,-.55],[.20,-.27],[.56,-.15],[.28,-.03],[.44,.23],[.13,.18]];points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
    else{ctx.moveTo(0,-.58);ctx.bezierCurveTo(.47,-.37,.49,.26,0,.55);ctx.bezierCurveTo(-.46,.27,-.43,-.36,0,-.58);}
    ctx.fill();ctx.strokeStyle='rgba(33,64,30,.37)';ctx.lineWidth=.032;ctx.stroke();ctx.strokeStyle='rgba(181,190,125,.63)';ctx.lineWidth=.017;ctx.beginPath();ctx.moveTo(0,.50);ctx.lineTo(0,-.43);ctx.stroke();
    ctx.strokeStyle='rgba(175,186,122,.44)';ctx.lineWidth=.010;for(let i=0;i<4;i++){const y=.29-i*.17;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(.26,y-.20);ctx.moveTo(0,y);ctx.lineTo(-.26,y-.20);ctx.stroke();}
    ctx.restore();
  }
  for(let tile=0;tile<4;tile++){
    const ox=(tile%2)*512,oy=Math.floor(tile/2)*512;ctx.save();ctx.translate(ox,oy);
    const twigs=[];
    function twig(x,y,angle,length,width,depth){
      const dx=Math.sin(angle)*length,dy=-Math.cos(angle)*length,ex=x+dx,ey=y+dy;
      if(depth<3){ctx.strokeStyle=depth>1?'#5a5940':'#69704a';ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dx*.34+8,y+dy*.54,ex,ey);ctx.stroke();}
      twigs.push({x,y,ex,ey,length,depth,angle});
      if(depth>0){twig(ex,ey,angle-.42-rand()*.23,length*.64,width*.57,depth-1);twig(ex,ey,angle+.42+rand()*.21,length*.62,width*.55,depth-1);if(depth>1)twig(x+dx*.67,y+dy*.67,angle+.77*(rand()>.5?1:-1),length*.49,width*.44,depth-1);}
    }
    twig(253,483,(rand()-.5)*.3,165,5,3);
    for(const t of twigs){if(t.depth>1)continue;const n=7+Math.ceil(t.length/13);for(let i=0;i<n;i++){const f=(i+.25)/n,x=t.x+(t.ex-t.x)*f,y=t.y+(t.ey-t.y)*f,side=i%2?1:-1,offset=12+rand()*28;
      leaf(x+Math.cos(t.angle)*offset*side,y+Math.sin(t.angle)*offset*side,17+rand()*17,t.angle+side*(.9+rand()*.6),tile<2);
    }leaf(t.ex,t.ey,20+rand()*16,t.angle,tile<2);}
    ctx.restore();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}

async function photographicLeaf(source){
  function load(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});}
  const [albedo,alpha]=await Promise.all([load(source.albedo),source.alpha?load(source.alpha):Promise.resolve(null)]);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d');ctx.drawImage(albedo,0,0,192,192);
  if(alpha){const pixels=ctx.getImageData(0,0,192,192),mask=document.createElement('canvas');mask.width=mask.height=192;const mc=mask.getContext('2d');mc.drawImage(alpha,0,0,192,192);const maskPixels=mc.getImageData(0,0,192,192);for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]=maskPixels.data[i+1];ctx.putImageData(pixels,0,0);}
  return canvas;
}

function barkFallback(){
  const c=document.createElement('canvas');c.width=256;c.height=1024;const ctx=c.getContext('2d'),rand=seeded(98103);
  ctx.fillStyle='#797161';ctx.fillRect(0,0,256,1024);
  for(let i=0;i<800;i++){const x=rand()*256,y=rand()*1024,h=20+rand()*160,w=1+rand()*9;ctx.strokeStyle=rand()>.5?'rgba(49,43,36,.42)':'rgba(180,170,148,.39)';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-3,y+h*.28,x+4,y+h*.67,x+rand()*4,y+h);ctx.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.4,1.5);t.anisotropy=4;return t;
}

function cardMaterial(texture,alpha=null,atlas=true){
  const mat=new THREE.MeshStandardMaterial({map:texture,alphaMap:alpha,color:0xffffff,roughness:.91,metalness:0,emissive:0x263e18,emissiveIntensity:.12,side:THREE.DoubleSide,alphaTest:.44,transparent:false});
  mat.userData.wind={value:0};
  mat.onBeforeCompile=shader=>{
    shader.uniforms.foliageTime=mat.userData.wind;
    shader.vertexShader='attribute vec2 instanceAtlas; varying vec2 foliageAtlas; uniform float foliageTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n foliageAtlas=instanceAtlas;\n float breeze=sin(foliageTime+instanceMatrix[3].x*.23+instanceMatrix[3].z*.31);\n transformed.x+=breeze*.031*max(0.0,uv.y);\n transformed.z+=sin(foliageTime*.71+instanceMatrix[3].z*.17)*.018*max(0.0,uv.y);');
    if(atlas){shader.fragmentShader='varying vec2 foliageAtlas;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vMapUv*.5+foliageAtlas )'));}
  };
  mat.customProgramCacheKey=()=>`leaf-card-${atlas?'atlas':'photo'}-wind-v1`;
  return mat;
}

function depthMaterial(map,alpha,atlas){
  const mat=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map,alphaMap:alpha,alphaTest:.44,side:THREE.DoubleSide});
  if(atlas){mat.onBeforeCompile=shader=>{shader.vertexShader='attribute vec2 instanceAtlas; varying vec2 foliageAtlas;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n foliageAtlas=instanceAtlas;');shader.fragmentShader='varying vec2 foliageAtlas;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vMapUv*.5+foliageAtlas )'));};mat.customProgramCacheKey=()=> 'leaf-depth-atlas-v1';}
  return mat;
}

// Synchronous integration: each original geographic placement is preserved.
// position may be THREE.Vector3 or {x,z,y?:ground,height?:9,scale?:1}.
export function createFoliage(parent,positions){
  const group=new THREE.Group();group.name='Mapped broadleaf and evergreen trees';parent.add(group);
  const atlas=broadleafAtlas(),loader=new THREE.TextureLoader(),bark=barkFallback();
  const barkMat=new THREE.MeshStandardMaterial({map:bark,color:0xd3c5ae,roughness:.94,metalness:0});
  const textureSet=MATERIAL_TEXTURES?.bark;
  if(textureSet?.albedo){const t=loader.load(textureSet.albedo);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1.5);t.anisotropy=4;barkMat.map=t;}
  if(textureSet?.normal){const t=loader.load(textureSet.normal);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1.5);barkMat.normalMap=t;barkMat.normalScale=new THREE.Vector2(.43,.43);}
  if(textureSet?.roughness){const t=loader.load(textureSet.roughness);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1.5);barkMat.roughnessMap=t;}
  const photoSet=MATERIAL_TEXTURES?.leaves;
  if(photoSet?.kind==='leaf'&&photoSet.albedo&&typeof Image!=='undefined'){
    photographicLeaf(photoSet).then(leaf=>{const photoAtlas=broadleafAtlas(leaf);atlas.image=photoAtlas.image;atlas.needsUpdate=true;photoAtlas.dispose();group.userData.photographicLeaves=true;}).catch(()=>{group.userData.photographicLeaves=false;});
  }
  let photoMat=null,photoMap=null,photoAlpha=null;
  if(photoSet?.albedo&&photoSet.kind==='branch'){
    photoMap=loader.load(photoSet.albedo);photoMap.colorSpace=THREE.SRGBColorSpace;photoMap.anisotropy=8;
    photoAlpha=photoSet.alpha?loader.load(photoSet.alpha):null;
    photoMat=cardMaterial(photoMap,photoAlpha,false);
  }
  const branchMatrices=[],leafMatrices=[],photoMatrices=[],leafOffsets=[],photoOffsets=[],leafColors=[],photoColors=[];
  const treePositions=[],branchOwners=[],branchPriority=[],leafOwners=[],photoOwners=[],leafLod=[],photoLod=[];
  let currentTree=0,currentRadius=.1,branchIndex=0;
  const rand=seeded(81430),matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),scale=new THREE.Vector3(),color=new THREE.Color();
  function branch(a,b,r){const d=b.clone().sub(a);quat.setFromUnitVectors(UP,d.clone().normalize());matrix.compose(a.clone().add(b).multiplyScalar(.5),quat,new THREE.Vector3(r,d.length(),r));branchMatrices.push(matrix.clone());branchOwners.push(currentTree);branchPriority.push(branchIndex++<3?2:r>=currentRadius*.35?1:0);}
  function card(p,w,h,angle,tilt,photo=false,lod=0){
    quat.setFromEuler(new THREE.Euler(tilt,angle,(rand()-.5)*.32,'YXZ'));scale.set(w,h,1);matrix.compose(p,quat,scale);
    const matrices=photo?photoMatrices:leafMatrices,offsets=photo?photoOffsets:leafOffsets,colors=photo?photoColors:leafColors;
    matrices.push(matrix.clone());const tile=Math.floor(rand()*4);offsets.push((tile%2)*.5,Math.floor(tile/2)*.5);
    const light=.81+rand()*.19;color.setRGB(light,light*(.94+rand()*.06),light*(.77+rand()*.18));colors.push(color.r,color.g,color.b);
    (photo?photoOwners:leafOwners).push(currentTree);(photo?photoLod:leafLod).push(lod);
  }
  for(const source of positions){
    const x=Number(source.x)||0,z=Number(source.z)||0,ground=Number(source.y)||0,height=(source.height||9)*(source.scale||1),pine=Boolean(photoMat&&photoSet.species==='pine'&&rand()<.14),yaw=rand()*TAU;
    const base=new THREE.Vector3(x,ground,z),radius=height*(.014+rand()*.005),width=height*(pine?.31:.42);
    currentTree=treePositions.length;treePositions.push(base.clone().add(new THREE.Vector3(0,height*.6,0)));currentRadius=radius;branchIndex=0;
    const stem1=base.clone().add(new THREE.Vector3(Math.sin(yaw)*.10,height*.30,Math.cos(yaw)*.10));
    const stem2=base.clone().add(new THREE.Vector3(Math.sin(yaw+.2)*.17,height*.53,Math.cos(yaw+.2)*.17));
    const tip=base.clone().add(new THREE.Vector3(Math.sin(yaw+.2)*.22,height*.88,Math.cos(yaw+.2)*.22));
    branch(base,stem1,radius);branch(stem1,stem2,radius*.73);branch(stem2,tip,radius*.43);
    if(pine){
      for(let layer=0;layer<5;layer++){
        const y=height*(.35+layer*.13),r=width*(1-layer*.16),count=layer<3?5:4;
        for(let i=0;i<count;i++){const a=yaw+i/count*TAU+(layer%2)*.5,outer=base.clone().add(new THREE.Vector3(Math.cos(a)*r,y+.12,Math.sin(a)*r));branch(base.clone().add(new THREE.Vector3(0,y-.14,0)),outer,radius*.19);
          const p=base.clone().add(new THREE.Vector3(Math.cos(a)*r*.61,y+.12,Math.sin(a)*r*.61));card(p,r*1.23,height*.22,a+Math.PI/2,.06,true);
          card(p.clone().add(new THREE.Vector3(0,height*.02,0)),r*1.1,height*.20,a,-.42,true);
        }
      }
      card(base.clone().add(new THREE.Vector3(0,height*.9,0)),width*.6,height*.26,yaw,0,true);
    }else{
      const crownTips=[];
      for(let arm=0;arm<5;arm++){
        const a=yaw+arm/5*TAU+(rand()-.5)*.23,r=width*(.69+rand()*.24),joint=base.clone().add(new THREE.Vector3(Math.cos(a)*r*.43,height*(.49+rand()*.08),Math.sin(a)*r*.43)),end=base.clone().add(new THREE.Vector3(Math.cos(a)*r,height*(.66+rand()*.12),Math.sin(a)*r));
        branch(stem1,joint,radius*.48);branch(joint,end,radius*.28);crownTips.push(end);
        for(let side=-1;side<=1;side+=2){const ba=a+side*.48,leafPoint=base.clone().add(new THREE.Vector3(Math.cos(ba)*r*.80,height*(.73+rand()*.16),Math.sin(ba)*r*.80));branch(joint,leafPoint,radius*.14);crownTips.push(leafPoint);}
      }
      crownTips.push(base.clone().add(new THREE.Vector3(0,height*.90,0)),base.clone().add(new THREE.Vector3(.3,height*.76,.1)),base.clone().add(new THREE.Vector3(-width*.22,height*.65,width*.16)),base.clone().add(new THREE.Vector3(width*.20,height*.64,-width*.17)));
      // Two differently tilted branch cards at each leafy branch endpoint give
      // an irregular three-dimensional crown without a solid canopy shell.
      for(let i=0;i<crownTips.length;i++){
        const point=crownTips[i],w=width*(.84+rand()*.24),h=height*(.44+rand()*.10),a=yaw+i*2.399;
        const photographic=Boolean(photoMat&&currentTree%5!==0);
        card(point,w,h,a,(rand()-.5)*.49,photographic);
        if(i%2===0)card(point.clone().add(new THREE.Vector3(.12,height*.04,-.13)),w*.88,h*.88,a+Math.PI/2,.31+(rand()-.5)*.33,photographic);
      }
      // A distant crown needs only four broader, still transparent leafy
      // silhouettes. Detailed branch cards are restored as the pilot approaches.
      const photographic=Boolean(photoMat&&currentTree%5!==0);
      for(let i=0;i<4;i++)card(base.clone().add(new THREE.Vector3(Math.cos(yaw+i*Math.PI/2)*width*.16,height*(.76+(i%2)*.04),Math.sin(yaw+i*Math.PI/2)*width*.16)),width*2.0,height*.59,yaw+i*Math.PI/4,(i%2?1:-1)*.13,photographic,1);
    }
  }
  const trunkGeo=new THREE.CylinderGeometry(.72,1,1,6,1),trunks=new THREE.InstancedMesh(trunkGeo,barkMat,branchMatrices.length);
  trunks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  branchMatrices.forEach((m,i)=>trunks.setMatrixAt(i,m));trunks.castShadow=true;trunks.receiveShadow=true;trunks.computeBoundingSphere();group.add(trunks);
  const distances=new Float32Array(treePositions.length);distances.fill(0);let lodTime=-Infinity;const cameraPosition=new THREE.Vector3(),lastCamera=new THREE.Vector3(Infinity,Infinity,Infinity);
  function refreshDistances(camera){const now=typeof performance!=='undefined'?performance.now():Date.now();camera.getWorldPosition(cameraPosition);if(now-lodTime<900&&lastCamera.distanceToSquared(cameraPosition)<180*180)return false;lodTime=now;lastCamera.copy(cameraPosition);for(let i=0;i<treePositions.length;i++)distances[i]=cameraPosition.distanceTo(treePositions[i]);return true;}
  let revision=0,branchRevision=-1;
  trunks.onBeforeRender=(renderer,scene,camera)=>{if(refreshDistances(camera))revision++;if(branchRevision===revision)return;branchRevision=revision;let count=0;for(let i=0;i<branchMatrices.length;i++){const distance=distances[branchOwners[i]];if(distance>1500?branchPriority[i]<2:distance>650&&branchPriority[i]<1)continue;trunks.instanceMatrix.array.set(branchMatrices[i].elements,count++*16);}trunks.count=count;trunks.instanceMatrix.needsUpdate=true;};
  const leafMat=cardMaterial(atlas,null,true);
  function installCards(matrices,offsets,colors,owners,lods,material,map,alpha,atlasMode){
    if(!matrices.length)return;
    const geo=new THREE.PlaneGeometry(1,1);geo.setAttribute('instanceAtlas',new THREE.InstancedBufferAttribute(new Float32Array(offsets),2));
    const cards=new THREE.InstancedMesh(geo,material,matrices.length);matrices.forEach((m,i)=>cards.setMatrixAt(i,m));
    cards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);geo.attributes.instanceAtlas.setUsage(THREE.DynamicDrawUsage);
    cards.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(colors),3);
    cards.instanceColor.setUsage(THREE.DynamicDrawUsage);
    cards.castShadow=true;cards.receiveShadow=true;cards.customDepthMaterial=depthMaterial(map,alpha,atlasMode);cards.computeBoundingSphere();
    let cardRevision=-1;
    cards.onBeforeRender=(renderer,scene,camera)=>{material.userData.wind.value=(typeof performance!=='undefined'?performance.now():Date.now())*.00068;if(refreshDistances(camera))revision++;if(cardRevision===revision)return;cardRevision=revision;let count=0;
      for(let i=0;i<matrices.length;i++){const distance=distances[owners[i]],coarse=lods[i]===1;if(distance>1500?!coarse:coarse)continue;if(!coarse&&distance>700&&i%2)continue;
        cards.instanceMatrix.array.set(matrices[i].elements,count*16);cards.instanceColor.array[count*3]=colors[i*3];cards.instanceColor.array[count*3+1]=colors[i*3+1];cards.instanceColor.array[count*3+2]=colors[i*3+2];geo.attributes.instanceAtlas.array[count*2]=offsets[i*2];geo.attributes.instanceAtlas.array[count*2+1]=offsets[i*2+1];count++;
      }cards.count=count;cards.instanceMatrix.needsUpdate=cards.instanceColor.needsUpdate=geo.attributes.instanceAtlas.needsUpdate=true;
    };
    group.add(cards);
  }
  installCards(leafMatrices,leafOffsets,leafColors,leafOwners,leafLod,leafMat,atlas,null,true);
  if(photoMat)installCards(photoMatrices,photoOffsets,photoColors,photoOwners,photoLod,photoMat,photoMap,photoAlpha,false);
  group.userData.treeCount=positions.length;group.userData.leafCardCount=leafMatrices.length+photoMatrices.length;group.userData.branchCount=branchMatrices.length;
  group.userData.dispose=()=>{group.traverse(o=>{o.geometry?.dispose();o.customDepthMaterial?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.alphaMap?.dispose();m.normalMap?.dispose();m.roughnessMap?.dispose();m.dispose();}}});atlas.dispose();bark.dispose();group.removeFromParent();};
  return group;
}
