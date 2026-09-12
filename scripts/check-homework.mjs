import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateHomework,visibleAssignments,shanghaiDate,classHeading,sortedClasses} from '../src/lib/homework.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/homework.json',import.meta.url)));
test('public homework uses approved fields and distinct IDs',()=>{assert.equal(validateHomework(data),data);assert.equal(data.classes.length,7);});
test('Shanghai midnight changes the assignment date independently of viewer timezone',()=>{assert.equal(shanghaiDate(new Date('2026-09-11T15:59:59Z')),'2026-09-11');assert.equal(shanghaiDate(new Date('2026-09-11T16:00:00Z')),'2026-09-12');});
test('latest assignment sorts first, hides future dates, and preserves history',()=>{const a={assignments:[{id:'old',assignedOn:'2026-09-05'},{id:'future',assignedOn:'2026-09-19'},{id:'new',assignedOn:'2026-09-12'}]};assert.deepEqual(visibleAssignments(a,'2026-09-12').map(x=>x.id),['new','old']);assert.equal(a.assignments[0].id,'old');});
test('missing homework stays missing',()=>{assert.deepEqual(visibleAssignments({assignments:[]}),[]);assert.equal(data.classes.filter(x=>!x.assignments.length).length,2);});
test('students see exact dates and times, newest dates first',()=>{assert.equal(classHeading(data.classes.find(g=>g.id==='sat-original-oratory'),'2026-09-12'),'5 September 2026 · 13:00–15:00');assert.equal(classHeading(data.classes.find(g=>g.id==='fri-afternoon'),'2026-09-12'),'11 September 2026 · 15:40–17:40');assert.equal(sortedClasses(data.classes,'2026-09-12')[0].id,'fri-afternoon');assert.ok(data.classes.every(g=>g.classTime));});
test('reject unexpected private columns and invalid calendar dates',()=>{const bad=structuredClone(data);bad.classes[0].studentNames=['test'];assert.throws(()=>validateHomework(bad));const invalid=structuredClone(data);invalid.classes[0].assignments[0].assignedOn='2026-02-31';assert.throws(()=>validateHomework(invalid));});
test('published content contains no private archive identifiers',()=>{const s=JSON.stringify(data);assert.doesNotMatch(s,/SRC-\d|FB-\d|ckcoachkai@gmail|private\\|dictation-archive/i);});

test("authorized rosters are separate from private observations",()=>{assert.deepEqual(data.classes.find(g=>g.id==="sat-introductory").students,["Stacey","Tianyou","Liam","Tongtong"]);assert.ok(data.classes.find(g=>g.id==="fri-later").students.includes("Kaka"));});
