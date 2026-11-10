import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/games/assets/dancers');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const expected=['cat','dog','rabbit','lion','tiger','panda','cheetah','puma','leopard','eagle'];
assert.deepEqual(manifest.characters.map(c=>c.species),expected);
for(const species of expected){
 const bytes=fs.readFileSync(path.join(root,species+'.glb'));
 assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const jl=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jl).toString()),binary=bytes.subarray(28+jl);
 assert.equal(doc.skins.length,1);assert.equal(doc.skins[0].joints.length,64);
 assert.deepEqual(doc.animations.map(a=>a.name),['square','shuffle','hiphop','disco']);
 const joints=new Set(doc.skins[0].joints);
 function values(index){
  const acc=doc.accessors[index],view=doc.bufferViews[acc.bufferView];
  assert.equal(acc.componentType,5126);assert(!acc.sparse);
  const width=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16})[acc.type],data=[];
  for(let i=0;i<acc.count;i++){const row=[];for(let k=0;k<width;k++)row.push(binary.readFloatLE((view.byteOffset||0)+(acc.byteOffset||0)+i*(view.byteStride||width*4)+k*4));data.push(row);}
  assert(data.flat().every(Number.isFinite),'Non-finite transform');return data;
 }
 for(const clip of doc.animations){
  let motionChannels=0;
  for(const channel of clip.channels){
   const sampler=clip.samplers[channel.sampler],times=values(sampler.input).flat(),samples=values(sampler.output);
   assert(Math.abs(times[0])<1e-5);assert(Math.abs(times.at(-1)-8)<1e-4);
   assert(times.every((t,i)=>i===0||t>times[i-1]));
   const first=samples[0],last=samples.at(-1);
   const direct=Math.max(...first.map((v,k)=>Math.abs(v-last[k])));
   const negated=channel.target.path==='rotation'?Math.max(...first.map((v,k)=>Math.abs(v+last[k]))):Infinity;
   assert(Math.min(direct,negated)<.002,`${species} ${clip.name}: loop seam ${channel.target.path}`);
   if(channel.target.path==='translation'&&joints.has(channel.target.node)&&doc.nodes[channel.target.node].name!=='root'){
    const rest=doc.nodes[channel.target.node].translation||[0,0,0];
    assert(samples.every(row=>row.every((v,k)=>Math.abs(v-rest[k])<.003)),`${species} ${clip.name}: disconnected ${doc.nodes[channel.target.node].name}`);
   }
   if(samples.some(row=>row.some((v,k)=>Math.abs(v-first[k])>.01)))motionChannels++;
  }
  assert(motionChannels>=35,`${species} ${clip.name}: insufficient articulated motion`);
 }
 for(const mesh of doc.meshes)for(const primitive of mesh.primitives){
  assert.notEqual(primitive.attributes.JOINTS_0,undefined);assert.notEqual(primitive.attributes.WEIGHTS_0,undefined);
  const weights=values(primitive.attributes.WEIGHTS_0);
  assert(weights.every(row=>Math.abs(row.reduce((a,b)=>a+b,0)-1)<.001),'Skin weights must sum to one');
 }
 console.log(`${species}: 64 bones, four seamless eight-second clips, connected joints, normalized skin weights`);
}
console.log('Garden dance asset checks passed.');
