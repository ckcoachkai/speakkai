import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ANIMATED_BOSSES,bossFrameIndex} from '../src/scripts/forest/animated-bosses.js';
test('reference bosses ship vector animation and distinct game-clock frames',async()=>{
 for(const [id,spec]of Object.entries(ANIMATED_BOSSES).filter(([,s])=>s.frames===24)){
  const svg=await readFile(`public/forest/animations/${id}.svg`,'utf8');
  assert.match(svg,/<animateTransform/);assert.doesNotMatch(svg,/<image|data:image/);
  const hashes=new Set();
  for(let i=0;i<spec.frames;i++)hashes.add(createHash('sha256').update(await readFile(`public/forest/art/${id}/${i}.webp`)).digest('hex'));
  assert.ok(hashes.size>12,`${id} has distinct articulated poses`);
  assert.equal(bossFrameIndex(id,10,true,false),0);
  assert.equal(bossFrameIndex(id,10,false,true),0);
  assert.equal(bossFrameIndex(id,0,false,false),bossFrameIndex(id,spec.duration,false,false));
 }
});
