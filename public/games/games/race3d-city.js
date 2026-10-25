/** Original fictional closed circuit inspired by Shanghai shopping streets.
 * No map extraction or third-party textures. Nine shared instanced batches;
 * architecture is decorative, with a wide shoulder reserved for race recovery. */
export function createRaceScenery(THREE,track,{id='medium'}={}){
 const group=new THREE.Group();group.name='fictional-shanghai-circuit';
 const parkTrees=[];for(const child of track.group.children)if(child.name.startsWith('park-pine-')){parkTrees.push([child,child.visible]);child.visible=false;}
 const resources=new Set(),dummy=new THREE.Object3D(),color=new THREE.Color();
 const box=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1);resources.add(box);resources.add(plane);
 const standard=(c,rough=.85)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:.05});resources.add(m);return m;};
 const bodyMat=standard('#d6cab3'),trimMat=standard('#ede4d2'),glassMat=standard('#214457',.35),walkMat=standard('#8e9293');
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=256;
 const ctx=signCanvas.getContext('2d');ctx.fillStyle='#233c45';ctx.fillRect(0,0,512,256);
 const signs=['城市赛道 · CITY CIRCUIT','FICTIONAL CLOSED COURSE','南京路灵感 · STREET RACE','SPEAKKAI · GRAND PRIX'];
 for(let n=0;n<4;n++){ctx.fillStyle=['#28584f','#702c37','#2d4b69','#574578'][n];ctx.fillRect(0,n*64,512,64);ctx.fillStyle='#fff1c9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 25px "Microsoft YaHei",system-ui';ctx.fillText(signs[n],256,n*64+32,495);}
 const atlas=new THREE.CanvasTexture(signCanvas);atlas.colorSpace=THREE.SRGBColorSpace;resources.add(atlas);
 const signMat=new THREE.MeshBasicMaterial({map:atlas,side:THREE.DoubleSide});resources.add(signMat);
 // Individual signs use a tiny indexed atlas geometry merged by four rows.
 const batches={};
 function batch(name,geometry,material,cap){const mesh=new THREE.InstancedMesh(geometry,material,cap);mesh.name='city-'+name;mesh.count=0;mesh.frustumCulled=false;group.add(mesh);batches[name]=mesh;return mesh;}
 const segments=Math.ceil(track.totalLength/52),count=segments*2;
 batch('buildings',box,bodyMat,count);batch('cornices',box,trimMat,count*4);batch('windows',box,glassMat,count*48);batch('pavements',box,walkMat,count);batch('shopfronts',box,glassMat,count*3);
 const signBatches=[];for(let i=0;i<4;i++){const geo=plane.clone(),uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setY(j,(uv.getY(j)+3-i)/4);resources.add(geo);signBatches.push(batch('sign-'+i,geo,signMat,Math.ceil(count/4)+1));}
 const palette=['#c3b095','#d5c6a8','#a89d90','#d8d0bd','#b5a599','#b4c5ca'];
 function stamp(mesh,sample,along,across,y,width,height,depth,tint){
  dummy.position.copy(sample.position).addScaledVector(sample.right,across).addScaledVector(sample.tangent,along);dummy.position.y+=y;
  dummy.rotation.set(0,Math.atan2(sample.tangent.x,sample.tangent.z),0);dummy.scale.set(width,height,depth);dummy.updateMatrix();mesh.setMatrixAt(mesh.count,dummy.matrix);if(tint){color.set(tint);mesh.setColorAt(mesh.count,color);}mesh.count++;
 }
 for(let i=0;i<segments;i++)for(const side of [-1,1]){
  const s=track.sampleTrack(i*track.totalLength/segments),variant=(i*7+(side>0?3:0))%6,floors=3+(i%5),height=floors*3.6+3;
  // A 22m clear recovery shoulder separates tyres from decorative buildings.
  const across=side*(s.width/2+30),width=17+(i%3)*2,depth=38;
  stamp(batches.pavements,s,0,side*(s.width/2+14),-.3,28,.6,53);
  stamp(batches.buildings,s,0,across,height/2-1,width,height,depth,palette[variant]);
  for(let k=0;k<3;k++)stamp(batches.cornices,s,0,across,2+k*(height-3)/2,width+.7,.45,depth+.7);
  // One repeated opening material: dark glass, deep wall reveals and warm trim.
  for(let floor=1;floor<floors;floor++)for(let col=0;col<6;col++){
   const along=(col-2.5)*5.4,front=across-side*(width/2+.025);
   stamp(batches.windows,s,along,front,3.4+floor*3.3,.13,1.9,2.0);
  }
  for(let col=0;col<3;col++)stamp(batches.shopfronts,s,(col-1)*11.8,across-side*(width/2+.08),1.6,.18,2.7,10.2);
  const sign=signBatches[(i+(side>0?1:0))%4];
  // Sign planes face across the road, attached above the original shopfronts.
  dummy.position.copy(s.position).addScaledVector(s.right,across-side*(width/2+.2));dummy.position.y+=4.0;dummy.rotation.set(0,Math.atan2(s.tangent.x,s.tangent.z)-side*Math.PI/2,0);dummy.scale.set(30,2.1,1);dummy.updateMatrix();sign.setMatrixAt(sign.count++,dummy.matrix);
 }
 for(const mesh of Object.values(batches)){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.updateMatrix();mesh.matrixAutoUpdate=false;}
 function setQuality(value){batches.windows.visible=true;for(const mesh of signBatches)mesh.visible=value!=='low';}
 setQuality(id);let disposed=false;
 return {group,setQuality,stats:{kind:'original-fictional-Shanghai-inspired',buildings:count,batches:Object.keys(batches).length,externalAssets:0},update(){},dispose(){if(disposed)return;disposed=true;for(const [tree,visible]of parkTrees)tree.visible=visible;group.removeFromParent();group.clear();for(const r of resources)r.dispose();}};
}
