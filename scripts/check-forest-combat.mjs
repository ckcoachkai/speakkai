import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REACTIONS,reaction,stepSkeleton} from '../src/scripts/forest/combat.js';
test('ten distinct finite reactions return to rest',()=>{
 assert.equal(REACTIONS.length,10);
 assert.equal(new Set(REACTIONS.map((_,i)=>JSON.stringify(reaction(2,i)))).size,10);
 for(let i=0;i<10;i++){assert.ok(Object.values(reaction(3,i)).every(Number.isFinite));assert.ok(Object.values(reaction(0,i)).every(v=>v===0));}
});
test('skeleton contact is decorative and freezes during pause',()=>{
 const s={progress:.4,distance:1000};const r={x:2999,p:.4};
 stepSkeleton(s,.016,1,r,true);assert.equal(s.skeleton.hits,1);
 const before=JSON.stringify(s);stepSkeleton(s,0,1,r,true);assert.equal(JSON.stringify(s),before);
 assert.equal(s.progress,.4);assert.equal(s.distance,1000);
});
