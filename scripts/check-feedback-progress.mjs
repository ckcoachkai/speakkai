import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {progressProfiles,evidenceSignature,snapshot} from '../src/lib/feedback-progress.mjs';
test('profiles separate namesakes, preserve absent entries and hide future dates',()=>{
 const student={id:'alex',name:'Alex',en:'Observation',zh:'观察'};
 const data={classes:['one','two'].map(id=>({id,label:{en:id,zh:id},sessions:[{id:id+'-old',date:'2026-09-05',time:'10:00–11:00',status:'held',students:[student]},{id:id+'-new',date:'2026-09-12',time:'10:00–11:00',status:'held',students:[{...student,attendance:'absent'}]},{id:id+'-future',date:'2026-09-20',status:'held',students:[student]}]}))};
 const profiles=progressProfiles(data,'2026-09-13');assert.equal(profiles.length,2);assert.notEqual(profiles[0].key,profiles[1].key);assert.equal(profiles[0].records.length,2);assert.equal(profiles[0].records[1].attendance,'absent');
 const before=evidenceSignature(profiles[0].records);profiles[0].records[0].en='Corrected observation';assert.notEqual(evidenceSignature(profiles[0].records),before);
});
test('reviewed comparisons reference existing profiles and bilingual evidence snapshots',()=>{
 const data=JSON.parse(fs.readFileSync('public/data/feedback.json','utf8')),notes=JSON.parse(fs.readFileSync('public/data/feedback-progress.json','utf8'));
 const profiles=progressProfiles(data,'2026-09-13');const keys=new Set();
 for(const review of notes.reviews){assert.ok(!keys.has(review.key));keys.add(review.key);const p=profiles.find(p=>p.key===review.key);assert.ok(p);const snapshot=JSON.parse(review.signature);assert.ok(Array.isArray(snapshot)&&snapshot.length>0);assert.ok(snapshot.every(r=>p.records.some(current=>current.sessionId===r[0])));assert.ok(review.en.trim());assert.match(review.zh,/[\u4e00-\u9fff]/);}
 assert.ok(!keys.has('sat-original-oratory/louis'),'Unresolved attribution cannot receive a trend claim');
});
test('snapshots are concise while underlying reports remain complete',()=>{
 const source='✓ '+('A complete recorded detail. '.repeat(30))+'\n\n➜ Practice suggestion.';
 assert.ok(snapshot(source).length<=251);assert.ok(snapshot(source).endsWith('…'));assert.ok(source.includes('Practice suggestion'));
});
