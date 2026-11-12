import fs from 'node:fs';
import * as T from '../public/games/assets/vendor/three.module.js';
const root=new URL('../public/games/assets/race3d-familiar/',import.meta.url);fs.mkdirSync(root,{recursive:true});
const types=[['sedan','Family sedan',4.6,1.8,1.45],['suv','SUV',4.7,1.92,1.85],['hatchback','Sports hatchback',4.1,1.78,1.48],['pickup','Pickup truck',5.1,1.95,1.8],['taxi','Taxi',4.6,1.8,1.45],['police','Police car',4.6,1.8,1.45],['van','Family van',4.9,1.94,1.95]];
const palette=[['Body paint',[.65,.12,.07,1]],['Window glass',[.08,.19,.25,1]],['Tire rubber',[.025,.03,.035,1]],['Wheel metal',[.6,.65,.7,1]],['Trim',[.08,.09,.1,1]],['Headlight',[1,.94,.7,1]],['Tail light',[.8,.025,.015,1]],['Police blue',[.03,.25,.85,1]],['Taxi yellow',[1,.72,.02,1]],['White stripe',[.95,.95,.91,1]]];
const output=[];
for(const [id,label,L,W,H] of types){
 const nodes=[],meshes=[],accessors=[],bufferViews=[],chunks=[];let offset=0;const bins=new Map();
 function add(name,mat,geo,x,y,z){if(geo.index)geo=geo.toNonIndexed();geo.translate(x,y,z);const key=name+':'+mat;if(!bins.has(key))bins.set(key,{name,mat,parts:[]});bins.get(key).parts.push(geo);}
 function box(name,mat,x,y,z,w,h,l){add(name,mat,new T.BoxGeometry(w,h,l),x,y,z);}
 function prism(name,mat,x,y,z,w,h,l,roof=.75){const g=new T.BoxGeometry(w,h,l).toNonIndexed();const a=g.attributes.position;for(let i=0;i<a.count;i++){if(a.getY(i)>0){a.setX(i,a.getX(i)*.85);a.setZ(i,a.getZ(i)*roof);}}g.computeVertexNormals();add(name,mat,g,x,y,z);}
 const axle=L*.295,r=id==='suv'||id==='pickup'?.38:.33;
 box('Body',0,0,.58,0,W,.47,L*.94);box('FrontBumper',4,0,.46,L*.49,W*.95,.17,.12);box('RearBumper',4,0,.46,-L*.49,W*.95,.17,.12);
 const cabZ=id==='pickup'?.5:id==='hatchback'||id==='van'?-.12:0;const cabL=id==='pickup'?L*.36:id==='van'?L*.73:id==='hatchback'||id==='suv'?L*.63:L*.53;
 prism('Body',0,0,(.8+H)/2,cabZ,W*.94,H-.8,cabL,id==='van'?.92:.75);
 prism('Windows',1,0,(.91+H-.1)/2,cabZ,W*.945,H-1.01,cabL*1.025,id==='van'?.92:.75);
 box('Body',0,0,H-.035,cabZ,W*.79,.08,cabL*(id==='van'?.91:.73));
 for(const side of [-1,1]){box('Body',0,side*W*.456,1.1,cabZ,.045,H-.83,.12);box('Mirrors',4,side*(W/2+.07),1.04,cabZ+cabL*.32,.19,.13,.22);for(const dz of [-.4,.4])box('Trim',3,side*(W/2+.006),.82,cabZ+dz,.025,.035,.16);}
 if(id==='pickup'){box('Bed',4,0,.82,-L*.30,W*.78,.045,L*.31);for(const side of [-1,1])box('Body',0,side*W*.46,1.01,-L*.31,.12,.42,L*.34);box('Body',0,0,1.01,-L*.47,W,.42,.12);}
 for(const s of [-1,1]){box('Headlights',5,s*W*.32,.7,L*.477,W*.23,.16,.045);box('TailLights',6,s*W*.36,.7,-L*.477,W*.16,.19,.045);}
 box('Grille',4,0,.62,L*.482,W*.37,.17,.05);
 if(id==='taxi'){box('TaxiSign',8,0,H+.12,0,.62,.22,.22);box('TaxiSign',4,0,H+.12,.116,.4,.07,.015);}
 if(id==='police'){box('Lightbar',4,0,H+.07,0,1.15,.08,.28);for(const s of [-1,1])box('Lightbar',s<0?6:7,s*.36,H+.17,0,.45,.14,.24);for(const s of [-1,1])box('Stripe',9,s*(W/2+.01),.65,0,.02,.16,L*.55);}
 const wheelNames=[];for(const [slot,x,z]of [['FL',-W*.48,axle],['FR',W*.48,axle],['RL',-W*.48,-axle],['RR',W*.48,-axle]]){
 const name={FL:'WheelFrontL',FR:'WheelFrontR',RL:'WheelRearL',RR:'WheelRearR'}[slot];wheelNames.push(name);
 const tire=new T.CylinderGeometry(r,r,.24,16);tire.rotateZ(Math.PI/2);add(name,2,tire,0,0,0);const hub=new T.CylinderGeometry(r*.62,r*.62,.255,12);hub.rotateZ(Math.PI/2);add(name,3,hub,0,0,0);}
 function attribute(array,size){const data=Buffer.from(array.buffer,array.byteOffset,array.byteLength);const view=bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.length})-1;chunks.push(data);offset+=data.length;const min=Array(size).fill(Infinity),max=Array(size).fill(-Infinity);for(let i=0;i<array.length;i++){min[i%size]=Math.min(min[i%size],array[i]);max[i%size]=Math.max(max[i%size],array[i]);}return accessors.push({bufferView:view,componentType:5126,count:array.length/size,type:size===3?'VEC3':'VEC2',min,max})-1;}
 const grouped=new Map();for(const b of bins.values()){const attrs={};for(const n of ['position','normal']){const data=new Float32Array(b.parts.reduce((s,g)=>s+g.attributes[n].array.length,0));let at=0;for(const g of b.parts){data.set(g.attributes[n].array,at);at+=g.attributes[n].array.length;}attrs[n==='position'?'POSITION':'NORMAL']=attribute(data,3);}if(!grouped.has(b.name))grouped.set(b.name,[]);grouped.get(b.name).push({attributes:attrs,material:b.mat});}
 for(const [name,primitives]of grouped){const node={name,mesh:meshes.push({name,primitives})-1};if(wheelNames.includes(name))node.translation=[name.endsWith('L')?-W*.48:W*.48,r,name.includes('Front')?axle:-axle];nodes.push(node);}
 const doc={asset:{version:'2.0',generator:'SpeakKai original familiar vehicle generator'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials:palette.map(([name,color])=>({name,pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:name.includes('metal')?.65:.1,roughnessFactor:.45}})),accessors,bufferViews,buffers:[{byteLength:offset}]};let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);let bin=Buffer.concat(chunks);const hdr=Buffer.alloc(20);hdr.writeUInt32LE(0x46546c67,0);hdr.writeUInt32LE(2,4);hdr.writeUInt32LE(28+json.length+bin.length,8);hdr.writeUInt32LE(json.length,12);hdr.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(new URL(id+'.glb',root),Buffer.concat([hdr,json,bh,bin]));output.push({id:'familiar-'+id,label,length:L,wheelbase:axle*2*L/(.98*L+.12),front:axle*L/(.98*L+.12),rear:axle*L/(.98*L+.12),track:W*.96*L/(.98*L+.12)});
}
fs.writeFileSync(new URL('manifest.json',root),JSON.stringify(output,null,2));console.log(output);


