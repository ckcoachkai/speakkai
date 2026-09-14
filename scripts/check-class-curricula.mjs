import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCurricula,courseEvidenceSignature,courseReviewCurrent,lessonCopy} from '../src/lib/class-curricula.mjs';
const data=JSON.parse(fs.readFileSync('public/data/class-curricula.json','utf8'));
const fb=JSON.parse(fs.readFileSync('public/data/feedback.json','utf8'));
test('all active non-STCC group classes have valid bilingual plans',()=>{
 validateCurricula(data);assert.equal(data.classes.length,11);
 for(const g of fb.classes.filter(g=>!g.id.startsWith('sun-')&&!g.id.includes('summer')))assert.ok(data.classes.some(c=>c.id===g.id));
 for(const c of data.classes){assert.ok(!c.id.startsWith('sun-'));for(const a of c.alignments){const s=fb.classes.find(g=>g.id===c.id)?.sessions.find(s=>s.id===a.sessionId);assert.ok(s);if(s.status==='cancelled')assert.deepEqual(a.lessons,[]);}}
 assert.ok(data.classes.some(c=>c.id==='mon-later'));assert.equal(data.templates['grade-1'].lessons.length,20);assert.equal(data.templates['grades-5-6'].lessons.length,16);
});
test('new, corrected and cancelled class content invalidates reviewed recommendations',()=>{
 const c=data.classes.find(c=>c.id==='sat-foundations'),copy=structuredClone(fb),g=copy.classes.find(g=>g.id===c.id);
 c.signature=courseEvidenceSignature(g);assert.ok(courseReviewCurrent(c,copy));g.sessions[0].classContent.en+=' Changed.';assert.equal(courseReviewCurrent(c,copy),false);
 const missing={...c,signature:'[]',id:'unrecorded'};assert.ok(courseReviewCurrent(missing,fb));
 const studentOnly=structuredClone(fb),sc=studentOnly.classes.find(g=>g.id===c.id);c.signature=courseEvidenceSignature(sc);sc.sessions[0].students[0].en+=' Advice.';assert.ok(courseReviewCurrent(c,studentOnly));
});
test('copy is explicitly suggested and uses literal Unicode bullets',()=>{for(const t of Object.values(data.templates)){for(const l of t.lessons){for(const lang of ['en','zh']){const s=lessonCopy(t,l,lang);assert.ok(s.includes(l.skills[lang]));assert.ok(s.includes('◆'));assert.ok(!/^[-*] /m.test(s));assert.match(s,lang==='en'?/not assigned homework/:/非已布置作业/);}}assert.ok(fs.existsSync('public'+t.reference));}});
test('STCC cannot be added accidentally to this curriculum',()=>{const bad=structuredClone(data);bad.classes[0].id='sun-1130';assert.throws(()=>validateCurricula(bad));});
