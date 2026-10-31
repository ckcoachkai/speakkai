import {ALL_ITEM_IDS,BASE_ITEM_IDS,ITEM_REGISTRY} from './race3d-item-registry.js?v=20261027-midnight';

// Original miniature props. The recipes contain geometry, not camera-facing
// pictures: their silhouettes, highlights and occlusion change with the view.
export const EXTRA_MODEL_IDS=Object.freeze(ALL_ITEM_IDS.filter(id=>!BASE_ITEM_IDS.includes(id)));
export function extraItemRecipe(id){
 const out=[];
 const p=(shape,role,x,y,z,sx,sy=sx,sz=sx,rx=0,ry=0,rz=0)=>out.push({shape,role,position:[x,y,z],scale:[sx,sy,sz],rotation:[rx,ry,rz]});
 const b=(x,y,z,sx,sy,sz,role=1,rz=0)=>p('box',role,x,y,z,sx,sy,sz,0,0,rz);
 const ball=(x,y,z,r,role=1)=>p('sphere',role,x,y,z,r,r,r);
 const cyl=(x,y,z,r,h,role=0,rz=0)=>p('cylinder',role,x,y,z,r,h,r,0,0,rz);
 const ring=(x,y,z,r,role=0,rx=0,ry=0)=>p('ring',role,x,y,z,r,r,r,rx,ry,0);
 const cone=(x,y,z,r,h,role=1,rz=0)=>p('cone',role,x,y,z,r,h,r,0,0,rz);
 const pod=()=>{b(0,0,0,1.15,1.35,.6,0);b(0,0,.34,.84,.94,.12);b(0,-.44,.43,.58,.11,.09,2);};
 const wheel=(x,y,z,r=.42)=>{ring(x,y,z,r,0);cyl(x,y,z,.15,.25,1,Math.PI/2);};
 switch(id){
  case 'bolt': cyl(0,0,0,.19,1.5,0);cone(0,.93,0,.42,.65,1);b(0,-.58,0,.84,.35,.18,2);break;
  case 'emp': b(0,-.55,0,1.7,.3,.7,0);for(const x of [-.6,0,.6]){cyl(x,.03,0,.13,1.12,1);ring(x,.24,0,.25,2,Math.PI/2);}break;
  case 'oil': cyl(0,-.05,0,.62,1.2,0);cyl(0,.67,0,.3,.28,1);b(.68,.2,0,.55,.24,.32,1,-.5);ball(0,0,.57,.28,2);break;
  case 'ram': b(0,0,0,1.8,.7,.7,0);for(const x of [-.65,.65]){b(x,0,.4,.23,1.2,.25);cone(x,.05,.65,.23,.65,2,Math.PI/2);}break;
  case 'tether': for(const x of [-.63,.63]){b(x,0,0,.5,.9,.65);ring(x,0,.4,.29,0);}for(const x of [-.25,0,.25])ring(x,0,0,.23,2,0,Math.PI/2);break;
  case 'jammer': pod();for(const x of [-.42,.42]){cyl(x,.91,0,.055,.65,0);ball(x,1.24,0,.13,2);}b(0,.1,.44,.65,.14,.1,2,.7);b(0,.1,.44,.65,.14,.1,2,-.7);break;
  case 'smoke': cyl(0,-.35,0,.45,.9,0);b(0,-.35,.43,.48,.42,.1);ball(-.28,.3,0,.42,1);ball(.26,.5,0,.5,1);ball(-.13,.83,0,.4,2);break;
  case 'decoy': b(0,0,0,1.2,1.2,1.2,0);for(const x of [-.47,.47])b(x,0,.63,.12,1,.1,2);ring(0,.2,.64,.25,1);ball(0,-.34,.65,.09,2);break;
  case 'draftbreaker': for(const x of [-.55,0,.55]){b(x,.26,0,.17,.9,.32,1,-.6);b(x,-.26,0,.17,.9,.32,2,.6);}break;
  case 'theft': b(0,-.25,0,.94,.95,.5,0);ring(0,.38,0,.48,1);b(.42,.37,0,.25,.6,.3,2);ball(0,-.25,.32,.18,2);break;
  case 'charge': ball(0,0,0,.65,0);ring(0,0,0,.72,1,Math.PI/2);cyl(0,.71,0,.2,.25,1);ball(.1,.97,0,.16,2);break;
  case 'deflector': b(0,0,0,.38,1.65,.65,0);for(const x of [-.42,.42])b(x,0,.18,.55,1.4,.3,1,x*.6);ring(0,0,.44,.33,2);break;
  case 'flare': cyl(0,-.35,0,.2,1.15,0);cone(0,.45,0,.4,.7,1);ball(0,.88,0,.23,2);for(const x of [-1,1])b(x*.49,.58,0,.14,.55,.12,2,x*.7);break;
  case 'grip': for(const x of [-.46,.46]){ring(x,0,0,.48,0);for(let a=0;a<6;a++){const t=a*Math.PI/3;b(x+Math.cos(t)*.48,Math.sin(t)*.48,.05,.2,.2,.32,1,t);}}break;
  case 'cleanse': ring(0,0,0,.77,0);ring(0,0,.12,.64,1);b(-.16,-.08,.22,.2,.55,.22,2,.65);b(.2,.08,.22,.2,.92,.22,2,-.65);break;
  case 'ghost': ball(0,.2,0,.67,1);b(0,-.28,0,1.25,.55,1.1);for(const x of [-.42,0,.42])cone(x,-.69,0,.23,.4,1,Math.PI);for(const x of [-.23,.23])ball(x,.32,.61,.13,0);break;
  case 'interceptor': ball(0,0,0,.45,0);ring(0,0,0,.9,1,Math.PI*.35);ring(0,0,0,.9,2,0,Math.PI*.35);ball(0,0,.43,.19,2);break;
  case 'brace': cyl(0,.1,0,.15,1.55,0);b(0,.37,0,.85,.18,.25);b(0,-.6,0,1.5,.25,.45);for(const x of [-.67,.67])cone(x,-.32,0,.27,.55,1);ring(0,.94,0,.26,2);break;
  case 'dash': pod();for(const s of [-1,1]){cone(s*.93,0,0,.32,.62,2,-s*Math.PI/2);}break;
  case 'draftcollector': cyl(0,-.37,0,.32,.7,0);cone(0,.2,0,.85,1,1,Math.PI);ring(0,.68,0,.87,2,Math.PI/2);break;
  case 'slingshot': for(const s of [-1,1])b(s*.38,.35,0,.2,1,.3,1,-s*.38);b(0,-.56,0,.25,.7,.35,0);b(0,.66,0,1.2,.09,.1,2);ball(0,.66,.15,.18,0);break;
  case 'airfoil': b(0,0,0,1.9,.18,.65);b(0,.3,0,.24,.9,.35,0);for(const s of [-1,1])b(s*.85,.12,0,.13,.52,.65,2,-s*.25);break;
  case 'overdrive': ring(0,0,0,.78,0);ring(0,0,.12,.62,1);b(.15,.15,.22,.12,.85,.15,2,-.65);for(let a=0;a<5;a++){const t=a*Math.PI/4;b(Math.cos(t)*.6,Math.sin(t)*.6,.24,.11,.2,.1,2,t-Math.PI/2);}break;
  case 'clutch': ring(0,0,0,.7,0);cyl(0,0,0,.42,.4,1,Math.PI/2);for(const x of [-.65,.65])b(x,.6,0,.15,.7,.3);ball(0,0,.39,.18,2);break;
  case 'pivot': b(0,-.4,0,1.4,.3,.75,0);cyl(0,.1,0,.16,.8,1);ring(0,.25,0,.75,2,Math.PI/2);cone(.72,.25,0,.2,.4,1,Math.PI/2);break;
  case 'fasttow': b(-.2,0,0,1.25,.6,.65,1);b(.55,.2,0,.55,1,.65,0);for(const x of [-.6,.55])for(const z of [-.4,.4])wheel(x,-.43,z,.28);b(-.45,.65,0,.14,.7,.2,2,.5);break;
  case 'rewind': for(const x of [-.4,.45])cone(x,0,0,.6,.8,1,Math.PI/2);b(-.97,0,0,.15,1.2,.35,2);break;
  case 'capacitor': for(const x of [-.4,.4]){cyl(x,0,0,.28,1.35,0);cyl(x,.1,0,.3,.65,1);cyl(x,.8,0,.09,.3,2);}b(0,-.55,0,1,.15,.25,2);break;
  case 'airbrake': p('sphere',1,0,.45,0,.92,.4,.75);for(const x of [-.65,.65])b(x*.5,-.07,0,.07,1.05,.07,0,x*.55);b(0,-.65,0,.65,.32,.5,2);break;
  case 'winch': b(0,-.4,0,1.5,.35,.7,0);cyl(0,.1,0,.38,1.05,1,Math.PI/2);for(const x of [-.5,0,.5])ring(x,.1,0,.42,0,0,Math.PI/2);b(.8,.5,0,.1,.9,.15,2);ring(.8,.98,0,.2,1);break;
  case 'jack': b(0,-.65,0,1.4,.22,.7,0);b(0,.65,0,1.1,.22,.65);for(const s of [-1,1]){b(s*.22,0,0,.16,1.3,.24,1,s*.45);}ball(0,0,.2,.15,2);break;
  case 'magnet': p('halfRing',1,0,-.15,0,.65,.65,.65,0,0,Math.PI);for(const s of [-1,1]){b(s*.65,.35,0,.3,.9,.3);b(s*.65,.78,0,.34,.25,.34,2);}break;
  case 'strip': b(0,0,0,1.15,1.7,.25,0);for(const y of [-.5,0,.5])for(const s of [-1,1])b(s*.22,y,.2,.16,.62,.18,2,-s*.65);break;
  case 'spring': for(const y of [-.44,-.15,.14,.43])ring(0,y,0,.55,1,Math.PI/2);b(0,-.7,0,1.4,.2,1.05,0);b(0,.7,0,1.4,.2,1.05,2);break;
  case 'sweeper': b(0,.5,0,.16,1.15,.2,0);b(0,-.27,0,1.45,.32,.55);for(const x of [-.6,-.3,0,.3,.6])b(x,-.61,0,.18,.48,.45,2,x*.2);break;
  case 'foam': for(const x of [-.5,0,.5])for(const y of [-.32,.32])ball(x,y,0,.4,1);b(0,0,.34,1.5,.17,.12,2,-.3);break;
  case 'beacon': cyl(0,-.5,0,.7,.3,0);cyl(0,.05,0,.42,.8,1);ball(0,.45,0,.42,2);ring(0,.2,0,.75,2,Math.PI/2);break;
  case 'inverter': for(const s of [-1,1]){b(0,s*.42,0,1.25,.19,.3,0);cone(s*.7,s*.42,0,.3,.55,2,-s*Math.PI/2);}ball(0,0,0,.2,1);break;
  case 'reclaim': b(0,-.35,0,1.2,.75,.85,0);for(const s of [-1,1])b(s*.55,.25,0,.2,.8,.65,1,-s*.35);cone(0,.5,0,.35,.55,2,Math.PI);break;
  case 'shift': b(0,0,0,.7,.7,.7,1);for(const s of [-1,1]){b(s*.55,s*.5,0,.75,.12,.2,0);cone(s*.94,s*.5,0,.27,.4,2,-s*Math.PI/2);}break;
  default:return null;
 }
 return out;
}

/** Shared instancing keeps all forty distinct miniatures within 18 draw calls. */
export function createExtraItemModels(THREE,{parent,capacity=60,low=false}={}){
 const group=new THREE.Group();group.name='race3d-volumetric-extra-items';parent?.add(group);
 const segment=low?8:12;
 const geometry={box:new THREE.BoxGeometry(1,1,1,3,3,3),sphere:new THREE.SphereGeometry(1,segment,low?6:8),cylinder:new THREE.CylinderGeometry(1,1,1,segment),cone:new THREE.ConeGeometry(1,1,segment),ring:new THREE.TorusGeometry(1,.16,6,low?16:24),halfRing:new THREE.TorusGeometry(1,.22,6,low?12:18,Math.PI)};
 // A bevel gives even tiny boxes a visible highlight instead of a flat card edge.
 const positions=geometry.box.attributes.position,v=new THREE.Vector3(),inner=new THREE.Vector3();for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i);inner.copy(v).clampScalar(-.39,.39);v.sub(inner).normalize().multiplyScalar(.11).add(inner);positions.setXYZ(i,v.x,v.y,v.z);}geometry.box.computeVertexNormals();
 const materials=[new THREE.MeshStandardMaterial({color:0x536375,metalness:.72,roughness:.24}),new THREE.MeshStandardMaterial({color:0xffffff,metalness:.38,roughness:.25}),new THREE.MeshStandardMaterial({color:0xffffff,metalness:.15,roughness:.2,emissive:0x8392a4,emissiveIntensity:.55})];
 const pools=new Map(),recipes=new Map(),part=new THREE.Object3D(),matrix=new THREE.Matrix4(),tint=new THREE.Color(),white=new THREE.Color(0xffffff);let disposed=false,count=0;
 const maxParts=Math.max(1,Math.min(60,capacity))*18;
 for(const id of EXTRA_MODEL_IDS)recipes.set(id,extraItemRecipe(id).map(p=>{part.position.fromArray(p.position);part.rotation.fromArray([...p.rotation,'XYZ']);part.scale.fromArray(p.scale);part.updateMatrix();return {...p,matrix:part.matrix.clone()};}));
 function poolFor(shape,role){const key=shape+role;if(!pools.has(key)){const mesh=new THREE.InstancedMesh(geometry[shape],materials[role],maxParts);mesh.name='powerup-miniature-'+shape+'-'+role;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;group.add(mesh);pools.set(key,mesh);}return pools.get(key);}
 function beginFrame(){count=0;for(const mesh of pools.values())mesh.count=0;}
 function stamp(id,pose){if(disposed||count>=capacity)return false;const recipe=recipes.get(id);if(!recipe)return false;pose.updateMatrix();tint.set(ITEM_REGISTRY[id].color);for(const p of recipe){const mesh=poolFor(p.shape,p.role),i=mesh.count++;matrix.multiplyMatrices(pose.matrix,p.matrix);mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,p.role===0?white:tint);}count++;return true;}
 function endFrame(){for(const mesh of pools.values()){mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
 function reset(){beginFrame();endFrame();}
 function snapshot(){return {items:count,types:recipes.size,pools:pools.size,drawCalls:[...pools.values()].filter(m=>m.count).length,drawCallCap:18,parts:[...pools.values()].reduce((n,m)=>n+m.count,0),capacity,disposed};}
 function dispose(){if(disposed)return;reset();disposed=true;group.removeFromParent();for(const mesh of pools.values())mesh.dispose();Object.values(geometry).forEach(g=>g.dispose());materials.forEach(m=>m.dispose());pools.clear();group.clear();}
 return {group,beginFrame,stamp,endFrame,reset,snapshot,dispose};
}
