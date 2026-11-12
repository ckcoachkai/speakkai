import {roadShadowFrame} from './race3d-quality.js?v=20261112-performance-cars';

export function createCarNeon(THREE,{timeOfDay='day',quality='high',reducedMotion=false,sceneScale=.2}={}){
 const group=new THREE.Group();group.name='race3d-car-neon';const capacity=60;
 const PALETTE=Array.from({length:capacity},(_,i)=>new THREE.Color().setHSL((.52+i*.61803398875)%1,.65,.62,THREE.SRGBColorSpace).getHex());
 let rosterKey='';const colorSlots=new Map();
 function assignColors(cars){const ids=[...new Set((cars||[]).map(c=>String(c.id)))].sort().slice(0,capacity),key=JSON.stringify(ids);if(key===rosterKey)return;rosterKey=key;colorSlots.clear();ids.forEach((id,i)=>colorSlots.set(id,i));}
 const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*Math.pow(Math.max(0,1-r),1.25));}
 const tex=new THREE.DataTexture(pixels,32,32);tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;
 const box=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 const panelMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,toneMapped:false});
 const glowMaterial=new THREE.MeshBasicMaterial({color:0xffffff,map:tex,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
 const panels=new THREE.InstancedMesh(box,panelMaterial,capacity*5),glows=new THREE.InstancedMesh(plane,glowMaterial,capacity);
 panels.name='car-neon-cabin-and-sills';glows.name='car-neon-underglow';for(const m of [panels,glows]){m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(m);}
 const lights=Array.from({length:2},()=>{const l=new THREE.PointLight(0xffffff,0,8*sceneScale,2);l.castShadow=false;l.visible=false;group.add(l);return l;});
 const local=new THREE.Object3D(),root=new THREE.Object3D(),matrix=new THREE.Matrix4(),color=new THREE.Color();let disposed=false,night=false,budget=0,count=0;
 const colorIndex=id=>colorSlots.get(String(id))??0;
 function reset(){count=0;panels.count=glows.count=0;for(const l of lights){l.intensity=0;l.visible=false;}group.visible=false;}
 function setMode(v){night=v==='night';reset();}
 function setQuality(v){budget=(v?.id||v)==='high'?2:0;for(const l of lights)l.intensity=0;}
 function update(cars,track,dt,{visualPose,focusId,active=true}={}){
  if(disposed)return;if(!night||!active||!track?.sampleTrack){reset();return;}assignColors(cars);let p=0,g=0;count=0;let focused=null;
  for(const car of cars||[]){if(count>=capacity)break;const v=visualPose?.(car.id)||car;if(car.eliminated||v.finishHidden||car.finished)continue;const s=track.sampleTrack(v.distance||0),frame=roadShadowFrame(THREE,s,(v.heading||0)+(v.spinAngle||0));
   root.position.copy(s.position).addScaledVector(s.right,v.lateral||0);root.position.y+=Math.tan(s.bank||0)*(v.lateral||0)+.035+Math.max(0,v.flightHeight||0)+Math.max(0,v.rampHeight||0);root.quaternion.copy(frame.rotation);root.scale.set(1,1,1);root.updateMatrix();
   const exact=v.exhaustMatrix?.isMatrix4&&v.exhaustMatrix.elements.every(Number.isFinite),base=exact?v.exhaustMatrix:root.matrix,ci=colorIndex(car.id);
   for(const [j,xyz,scale] of [[0,[-1.02,.34,0],[.10,.12,3.3]],[1,[1.02,.34,0],[.10,.12,3.3]],[2,[-.60,1.38,.2],[.085,.07,1.25]],[3,[.60,1.38,.2],[.085,.07,1.25]],[4,[0,1.38,.81],[1.28,.07,.085]]]){local.position.set(...xyz);local.rotation.set(0,0,0);local.scale.set(...scale);local.updateMatrix();matrix.multiplyMatrices(base,local.matrix);panels.setMatrixAt(p,matrix);color.setHex(PALETTE[(ci+(j>=2?20:0))%PALETTE.length]).multiplyScalar(1.1);panels.setColorAt(p++,color);}
   const height=Math.max(0,v.flightHeight||0)+Math.max(0,v.rampHeight||0);if(height<2){local.position.copy(s.position).addScaledVector(s.right,v.lateral||0);local.position.y+=Math.tan(s.bank||0)*(v.lateral||0);local.position.addScaledVector(frame.normal,.06);local.quaternion.copy(frame.rotation);local.scale.set(5*(1-height/2),1,7*(1-height/2));local.updateMatrix();glows.setMatrixAt(g,local.matrix);color.setHex(PALETTE[ci]);glows.setColorAt(g++,color);}
   if(car.id===focusId||focused===null)focused={base:base.clone(),ci,id:car.id};count++;
  }
  panels.count=p;glows.count=g;for(const m of [panels,glows]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
  lights.forEach((l,i)=>{l.intensity=focused&&i<budget?.22:0;l.visible=l.intensity>0;if(focused){l.position.set(i?-.75:.75,.7,0).applyMatrix4(focused.base);l.color.setHex(PALETTE[focused.ci]);}});group.visible=count>0;
 }
 setQuality(quality);setMode(timeOfDay);
 return {group,update,setMode,setQuality,reset,snapshot:()=>({night,disposed,cars:count,panels:panels.count,glows:glows.count,lightBudget:night?budget:0,reducedMotion,animated:false}),dispose(){if(disposed)return;reset();disposed=true;group.removeFromParent();group.clear();for(const r of [box,plane,tex,panelMaterial,glowMaterial])r.dispose();}};
}

