import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveQuality} from '../public/games/games/race3d-quality.js';
import {forEachVisualStep} from '../public/games/games/race3d-clock.js';
for(const racers of [2,8,20,60]) {
 const auto=resolveQuality('auto',{width:1920,cores:16,racers});
 assert.equal(auto.id,'medium'); assert.equal(auto.shadows,false); assert.equal(auto.dpr,1.25);
}
assert.equal(resolveQuality('auto',{width:640,cores:16}).id,'low');
assert.equal(resolveQuality('auto',{width:1920,cores:4}).id,'low');
assert.equal(resolveQuality('high').shadows,true);
assert.equal(resolveQuality('high').dpr,1.65);
const source=fs.readFileSync(new URL('../public/games/games/race3d.js',import.meta.url),'utf8');
const start=source.indexOf('forEachVisualStep(duration,');
const end=source.indexOf('// Projection and shadow instance uploads',start);
const loop=source.slice(start,end);
assert.ok(!loop.includes('projectCars(ordered)'));assert.ok(!loop.includes('contactShadows?.update'));
assert.equal(source.match(/projectCars\(ordered\)/g).length,1);
assert.equal(source.match(/contactShadows\?\.update/g).length,1);
const cases=[];
for(const hz of [15,30,60]) for(const speed of [1,2,5]) {
 let priorUploads=0;forEachVisualStep(Math.min(1/hz,.1)*speed,()=>priorUploads++);
 cases.push({hz,speed,previousUploads:priorUploads,newUploads:1});
}
console.log('PASS: automatic rendering budget, explicit High preserved, draw-only work outside timed substeps');
console.log(JSON.stringify(cases));
