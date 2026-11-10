/** Lossless geometry/animation packing + a 768px JPEG material atlas.
 * No runtime compression decoder or network service is required.
 * Usage: node optimize_glb.cjs ASSET_DIR SHARP_MODULE_PATH
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sharp=require(process.argv[3]||'sharp'),root=process.argv[2];
async function optimize(filename){
 const data=fs.readFileSync(filename);assert.equal(data.readUInt32LE(0),0x46546c67);
 const jsonLength=data.readUInt32LE(12),doc=JSON.parse(data.subarray(20,20+jsonLength).toString());
 const binary=data.subarray(28+jsonLength);const chunks=[];let offset=0;
 const imageViews=new Set(doc.images?.map(i=>i.bufferView)||[]);
 const original=doc.bufferViews.map(view=>binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));
 // Blender frame 1 can export as t=1/30. Remove the leading hold for exact eight-second loops.
 const timeAccessors=new Set((doc.animations||[]).flatMap(a=>a.samplers.map(s=>s.input)));
 for(const index of timeAccessors){
   const acc=doc.accessors[index],view=doc.bufferViews[acc.bufferView],bytes=original[acc.bufferView];
   const start=acc.byteOffset||0,step=view.byteStride||4,first=bytes.readFloatLE(start);
   if(first>1e-6){for(let k=0;k<acc.count;k++)bytes.writeFloatLE(bytes.readFloatLE(start+k*step)-first,start+k*step);acc.min=[0];acc.max=[bytes.readFloatLE(start+(acc.count-1)*step)];}
 }
 for(let i=0;i<doc.bufferViews.length;i++){
   const view=doc.bufferViews[i];let bytes=original[i];
   if(imageViews.has(i)&&doc.images.find(x=>x.bufferView===i).mimeType==='image/png'&&doc.images.find(x=>x.bufferView===i).name!=='Fur tangent normal'){bytes=await sharp(bytes).resize(768,768,{fit:'inside',withoutEnlargement:true}).jpeg({quality:88,chromaSubsampling:'4:4:4'}).toBuffer();doc.images.find(x=>x.bufferView===i).mimeType='image/jpeg';}
   view.byteOffset=offset;view.byteLength=bytes.length;chunks.push(bytes);offset+=bytes.length;
   const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
 }
 function append(bytes,target){
   const index=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,...(target?{target}:{})});chunks.push(bytes);offset+=bytes.length;
   const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}return index;
 }
 // Blender's Bump node is not a glTF normal-map node. Convert the scan height to
 // a genuine tangent-space normal image, rather than interpreting brown fur as normals.
 const fur=doc.materials.find(m=>m.name==='Fur'||m.name.startsWith('Fur.'));
 if(fur?.normalTexture&&!doc.images.some(i=>i.name==='Fur tangent normal')){
   const dim=768,{data:height}=await sharp(path.join(root,'material-atlas.png')).resize(dim,dim).greyscale().raw().toBuffer({resolveWithObject:true});
   const normals=Buffer.alloc(dim*dim*3);
   for(let y=0;y<dim;y++)for(let x=0;x<dim;x++){
     const at=(xx,yy)=>height[Math.max(0,Math.min(dim-1,yy))*dim+Math.max(0,Math.min(dim-1,xx))];
     const nx=(at(x-1,y)-at(x+1,y))/128,ny=(at(x,y+1)-at(x,y-1))/128,inv=1/Math.hypot(nx,ny,1),i=(y*dim+x)*3;
     normals[i]=Math.round((nx*inv*.5+.5)*255);normals[i+1]=Math.round((ny*inv*.5+.5)*255);normals[i+2]=Math.round((inv*.5+.5)*255);
   }
   const png=await sharp(normals,{raw:{width:dim,height:dim,channels:3}}).png().toBuffer();
   const imageIndex=doc.images.length;doc.images.push({bufferView:append(png),mimeType:'image/png',name:'Fur tangent normal'});
   doc.textures[fur.normalTexture.index].source=imageIndex;fur.normalTexture.scale=.35;
   const THREE=await import(pathToFileURL(path.resolve(root,'../vendor/three.module.js')).href);
   function readAccessor(index){
     const acc=doc.accessors[index],view=doc.bufferViews[acc.bufferView],bytes=original[acc.bufferView],width=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4})[acc.type];
     const size=acc.componentType===5126?4:acc.componentType===5125?4:2,result=new (acc.componentType===5126?Float32Array:Uint32Array)(acc.count*width);
     for(let i=0;i<acc.count;i++)for(let k=0;k<width;k++){const start=(acc.byteOffset||0)+i*(view.byteStride||size*width)+k*size;result[i*width+k]=acc.componentType===5126?bytes.readFloatLE(start):acc.componentType===5125?bytes.readUInt32LE(start):bytes.readUInt16LE(start);}
     return result;
   }
   for(const mesh of doc.meshes)for(const primitive of mesh.primitives)if(doc.materials[primitive.material]===fur&&!primitive.attributes.TANGENT){
     const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(readAccessor(primitive.attributes.POSITION),3));
     geo.setAttribute('normal',new THREE.BufferAttribute(readAccessor(primitive.attributes.NORMAL),3));geo.setAttribute('uv',new THREE.BufferAttribute(readAccessor(primitive.attributes.TEXCOORD_0),2));
     geo.setIndex(new THREE.BufferAttribute(readAccessor(primitive.indices),1));geo.computeTangents();const tangent=geo.getAttribute('tangent');
     const buffer=Buffer.from(tangent.array.buffer,tangent.array.byteOffset,tangent.array.byteLength);
     primitive.attributes.TANGENT=doc.accessors.length;doc.accessors.push({bufferView:append(buffer,34962),componentType:5126,count:tangent.count,type:'VEC4'});geo.dispose();
   }
 }
 doc.buffers[0].byteLength=offset;
 // Remove constant animation channels equal to the node's rest transform. These carry no motion.
 const removed=[];
 for(const animation of doc.animations||[]){
   animation.channels=animation.channels.filter(channel=>{
     const sampler=animation.samplers[channel.sampler],accessor=doc.accessors[sampler.output];
     const count=accessor.type==='VEC4'?4:accessor.type==='VEC3'?3:1;
     if(accessor.componentType!==5126||accessor.sparse)return true;
     const bytes=original[accessor.bufferView],start=accessor.byteOffset||0;
     const rest=doc.nodes[channel.target.node][channel.target.path]||({translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]})[channel.target.path];
     if(!rest)return true;
     for(let frame=0;frame<accessor.count;frame++)for(let k=0;k<count;k++)if(Math.abs(bytes.readFloatLE(start+(frame*count+k)*4)-rest[k])>1e-5)return true;
     removed.push(channel);return false;
   });
 }
 // Retain data views for straightforward reproducible packing. glTF validator permits unused accessors.
 let json=Buffer.from(JSON.stringify(doc));const jp=(4-json.length%4)%4;if(jp)json=Buffer.concat([json,Buffer.alloc(jp,32)]);
 const bin=Buffer.concat(chunks),header=Buffer.alloc(20),bh=Buffer.alloc(8);
 header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
 bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
 fs.writeFileSync(filename,Buffer.concat([header,json,bh,bin]));
 return {file:path.basename(filename),before:data.length,after:fs.statSync(filename).size,constantChannelsRemoved:removed.length};
}
(async()=>{const result=[];for(const name of fs.readdirSync(root).filter(x=>x.endsWith('.glb')))result.push(await optimize(path.join(root,name)));console.log(JSON.stringify(result,null,2))})().catch(e=>{console.error(e);process.exit(1)});
