import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dancePose,DANCE_DURATION} from '../src/scripts/forest/dance.js';
test('dance progresses from shoulders through hips to jumps and settles',()=>{
 assert.equal(dancePose(1).phase,'shoulders');assert.equal(dancePose(3).phase,'hips');assert.equal(dancePose(5).phase,'jump');
 assert.equal(dancePose(1).hip,0);assert.equal(dancePose(1).jump,0);
 assert.equal(dancePose(DANCE_DURATION).amount,0);
 for(let t=0;t<=DANCE_DURATION;t+=.013){const p=dancePose(t);assert.ok(p.angles.every(Number.isFinite));assert.ok(p.jump>=0&&p.jump<=90);assert.ok(Math.abs(dancePose(t,true).shoulder)<=Math.abs(p.shoulder)+1e-9);}
});
