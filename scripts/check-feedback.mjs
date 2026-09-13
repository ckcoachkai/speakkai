import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateFeedback,weekWindows,sessionsInWindow,newestClass,feedbackText,shanghaiDate} from '../src/lib/feedback.mjs';
import {isSafeFeedbackUrl,validateHomework} from '../src/lib/homework.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/feedback.json',import.meta.url)));
test('published feedback contains matched bilingual pairs and only public fields',()=>{
  assert.equal(validateFeedback(data),data);
  assert.doesNotMatch(JSON.stringify(data),/SRC-\d|FB-\d|sourceTask|sourceOrdinal|docs\.google|dictation-archive|@gmail/);
  for(const group of data.classes)for(const session of group.sessions)for(const student of session.students)if(student.en){assert.match(student.zh,/[\u4e00-\u9fff]/);assert.equal((student.en.match(/➜/g)||[]).length,1);assert.equal((student.zh.match(/➜/g)||[]).length,1);}
});
test('latest seven-day view handles Shanghai midnight and hides future sessions',()=>{
  assert.equal(shanghaiDate(new Date('2026-09-12T16:00:00Z')),'2026-09-13');
  const windows=weekWindows(data,'2026-09-13');
  assert.deepEqual(windows[0],{id:'0',start:'2026-09-07',end:'2026-09-13'});
  assert.deepEqual(windows[1],{id:'1',start:'2026-08-31',end:'2026-09-06'});
  assert.equal(newestClass(data,'2026-09-13'),'sun-1130');
  assert.equal(newestClass(data,'2026-09-12'),'sat-introductory');
  const saturday=data.classes.find(g=>g.id==='sat-original-oratory');
  assert.deepEqual(sessionsInWindow(saturday,windows[1],'2026-09-13').map(s=>s.date),['2026-09-05']);
});
test('copy keeps selected student, date and language without another student or source metadata',()=>{
  const group=data.classes.find(g=>g.id==='sun-1130'),session=group.sessions[0],student=session.students.find(s=>s.name==='Berlingo');
  assert.match(feedbackText(session,student,'en'),/13 Sept? 2026 · 11:30–13:00\nBerlingo/);
  assert.match(feedbackText(session,student,'zh'),/2026年9月13日/);
  assert.doesNotMatch(feedbackText(session,student,'zh'),/Charles|James|sourceOrdinals/);
  assert.equal(feedbackText(session,{en:null,zh:null,name:'Missing'},'en'),'');
});
test('reject incomplete translation, impossible dates, duplicate identities and evaluated cancellation',()=>{
  for(const change of [d=>{d.classes[0].sessions[0].students[0].zh=null;},d=>{d.classes[0].sessions[0].date='2026-02-31';},d=>{d.classes[0].sessions[0].students.push(d.classes[0].sessions[0].students[0]);},d=>{d.classes[0].sessions[0].status='cancelled';},d=>{d.classes[0].sessions[0].privateNotes='hidden';}]){const bad=structuredClone(data);change(bad);assert.throws(()=>validateFeedback(bad));}
});
test('homework links resolve to exact published feedback and preserve history',()=>{
  const hw=JSON.parse(fs.readFileSync(new URL('../public/data/homework.json',import.meta.url)));validateHomework(hw);
  for(const group of hw.classes)for(const session of group.sessions)for(const student of session.students){if(!student.feedbackUrl?.startsWith('/fb/'))continue;assert.equal(isSafeFeedbackUrl(student.feedbackUrl),true);const params=new URL(student.feedbackUrl,'https://speakkai.com').searchParams;const fg=data.classes.find(g=>g.id===params.get('class'));const fs=fg?.sessions.find(s=>s.date===params.get('date'));const match=fs?.students.find(s=>s.id===params.get('student'));assert.equal(match?.name,student.name);assert.ok(match?.en&&match?.zh);}
  assert.equal(isSafeFeedbackUrl('/fb/?class=test&date=2026-02-31&student=someone'),false);
  assert.equal(isSafeFeedbackUrl('/fb/?class=test&date=2026-09-13&student=someone&next=https://evil.example'),false);
});
