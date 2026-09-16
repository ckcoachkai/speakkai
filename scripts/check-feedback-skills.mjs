import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {progressProfiles,evidenceSignature} from '../src/lib/feedback-progress.mjs';
import {skillJourney,skillExcerpt,skillCriteria} from '../src/lib/feedback-skills.mjs';
const data=JSON.parse(fs.readFileSync('public/data/feedback.json','utf8'));
const mappings=JSON.parse(fs.readFileSync('public/data/feedback-skills.json','utf8'));
function reviewedProfile(key){
 const saved=mappings.profiles.find(p=>p.key===key);
 return {key,records:saved.records.map(r=>{const [sessionId,attendance,en,zh]=JSON.parse(r.signature)[0];return {sessionId,attendance,en,zh,date:sessionId.match(/\d{4}-\d{2}-\d{2}/)[0]};})};
}

test('reviewed mappings have class-scoped keys and valid bilingual source paragraphs, allowing pending updates',()=>{
 const keys=new Set();
 for(const saved of mappings.profiles){
  assert.match(saved.key,/^[a-z0-9-]+\/[a-z0-9-]+$/);assert.ok(!keys.has(saved.key));keys.add(saved.key);
  const sessions=new Set();
  for(const mapping of saved.records){
   assert.ok(!sessions.has(mapping.sessionId));sessions.add(mapping.sessionId);
   const snapshot=JSON.parse(mapping.signature);assert.equal(snapshot.length,1);
   const [id,attendance,en,zh]=snapshot[0];assert.equal(id,mapping.sessionId);assert.notEqual(attendance,'absent');assert.ok(en&&zh);
   const record={en,zh};assert.ok(mapping.skills.length);
   const used=new Set();
   for(const skill of mapping.skills){
    assert.ok(skillCriteria.some(c=>c.id===skill.criterion));assert.ok(!used.has(skill.criterion));used.add(skill.criterion);
    assert.deepEqual(Object.keys(skill).sort(),['criterion','en','zh']);
    for(const lang of ['en','zh']){assert.ok(Number.isInteger(skill[lang]));assert.ok(record[lang].split(/\n\s*\n/)[skill[lang]]);assert.ok(record[lang].includes(skillExcerpt(record,skill,lang)));}
   }
  }
 }
 assert.equal(keys.size,mappings.profiles.length);
 assert.equal(mappings.profiles.find(p=>p.key==='sat-original-oratory/louis').records.length,0);
});

test('new and edited comments become pending; unchanged earlier evidence stays visible',()=>{
 const p=reviewedProfile('sat-original-oratory/jennifer');
 assert.equal(skillJourney(p,mappings).records.filter(r=>r.state==='reviewed').length,2);
 p.records[1].en+=' Corrected observation.';
 assert.deepEqual(skillJourney(p,mappings).records.map(r=>r.state),['reviewed','pending']);
 p.records.push({...p.records[1],sessionId:'new',date:'2026-09-19'});
 assert.equal(skillJourney(p,mappings).records.at(-1).state,'pending');
 // A changed translation also invalidates the previous bilingual skill assignment.
 p.records[0].zh+=' 更新';assert.equal(skillJourney(p,mappings).lanes.length,0);
});

test('absence, missing feedback and namesakes cannot become skill assessments',()=>{
 const p=reviewedProfile('tue-later/jayden');
 p.records.push({sessionId:'absent',date:'2026-09-15',attendance:'absent',en:'Absent',zh:'缺席'});
 assert.equal(skillJourney(p,mappings).records.at(-1).state,'absent');
 p.records[0].en=null;assert.equal(skillJourney(p,mappings).records[0].state,'missing');
 p.records[0].en='A comment';p.key='another-class/jayden';assert.equal(skillJourney(p,mappings).lanes.length,0);
});

test('skills are individualized and chronological without invented levels',()=>{
 const j=skillJourney(reviewedProfile('sat-original-oratory/jennifer'),mappings);
 const k=skillJourney(reviewedProfile('sat-original-oratory/kenny'),mappings);
 assert.notDeepEqual(j.lanes.map(l=>l.criterion.id),k.lanes.map(l=>l.criterion.id));
 assert.equal(j.lanes.find(l=>l.criterion.id==='timing').points.length,1);
 assert.equal(j.lanes.find(l=>l.criterion.id==='audience').points.length,2);
 for(const lane of j.lanes)assert.deepEqual(lane.points.map(p=>p.record.date),lane.points.map(p=>p.record.date).sort());
});
