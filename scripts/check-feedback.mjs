import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateFeedback,weekWindows,sessionsInWindow,newestClass,feedbackText,classSectionText,shanghaiDate,sessionCompleteness} from '../src/lib/feedback.mjs';
import {isSafeFeedbackUrl,validateHomework} from '../src/lib/homework.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/feedback.json',import.meta.url)));
test('published feedback contains matched bilingual pairs and only public fields',()=>{
  assert.equal(validateFeedback(data),data);
  assert.doesNotMatch(JSON.stringify(data),/SRC-\d|FB-\d|sourceTask|sourceOrdinal|docs\.google|dictation-archive|@gmail/);
  for(const group of data.classes)for(const session of group.sessions)for(const student of session.students)if(student.en){assert.match(student.zh,/[\u4e00-\u9fff]/);assert.ok(student.en.trim());assert.ok(student.zh.trim());}
});

test('overview completeness requires all bilingual sections and names missing feedback',()=>{
  const pair={en:'Recorded',zh:'已记录'};
  const session={status:'held',classContent:pair,homework:pair,students:[{name:'First',...pair},{name:'Second',en:null,zh:null}]};
  assert.deepEqual(sessionCompleteness(session),{state:'missing',missing:['Second: individual feedback incomplete'],completed:1,total:2});
  session.students[1]={name:'Second',...pair};
  assert.equal(sessionCompleteness(session).state,'complete');
  session.homework=null;
  assert.deepEqual(sessionCompleteness(session).missing,['Homework information not recorded']);
  assert.deepEqual(sessionCompleteness(session,'zh').missing,['作业信息未记录']);
  session.classContent={en:'Present',zh:' '};
  assert.equal(sessionCompleteness(session).missing.length,2);
  session.students=[];
  assert.ok(sessionCompleteness(session).missing.includes('Student roster and feedback not recorded'));
  session.status='cancelled';
  assert.deepEqual(sessionCompleteness(session),{state:'cancelled',missing:[],completed:0,total:0});
});

test('full reports retain distinctive source details and later corrections',()=>{
  const session=(id,date)=>data.classes.find(g=>g.id===id).sessions.find(s=>s.date===date);
  const student=(id,date,name)=>session(id,date).students.find(s=>s.name===name);
  const sunday=session('sun-1130','2026-09-13');
  assert.match(sunday.classContent.en,/Technology in my life/);
  assert.match(sunday.classContent.en,/hand gestures and speaking with conviction/);
  assert.match(sunday.classContent.zh,/我生活中的科技/);
  assert.match(student('sun-1130','2026-09-13','Yiyi').en,/reason → explanation → link to her position/);
  assert.match(student('thu-afternoon','2026-09-10','Pinkie').en,/24 seconds/);
  assert.match(student('thu-afternoon','2026-09-10','Charlotte').en,/futuristic city/);
  assert.match(student('sat-introductory','2026-09-12','Liam').en,/second attempt.*memorized/s);
  assert.match(student('sat-introductory','2026-09-12','Tongtong').en,/third invitation.*successfully/s);
  assert.match(student('fri-later','2026-09-11','Peter').en,/pronunciation was clear/);
  assert.equal(student('fri-later','2026-09-11','Kaka').en,null);
  assert.equal(student('sat-introductory','2026-09-12','Tianyou').zh,null);
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


test('class sections preserve their own dated lesson and assignment, including N/A',()=>{
  const hw=JSON.parse(fs.readFileSync(new URL('../public/data/homework.json',import.meta.url)));
  for(const group of data.classes)for(const session of group.sessions){
    const original=hw.classes.find(g=>g.id===group.id)?.sessions.find(s=>s.date===session.date&&s.time===session.time);
    if(session.status==='held')assert.equal(session.classContent?.en||'',original?.classContent.join('\n')||'');
    for(const language of ['en','zh'])for(const kind of ['classContent','homework']){
      const copied=classSectionText(session,kind,language);
      assert.ok(copied.endsWith(session[kind]?.[language]||'N/A'));
      if(session[kind])assert.match(session[kind].zh,/[\u4e00-\u9fff]/);
    }
  }
  const sunday=data.classes.find(g=>g.id==='sun-1130').sessions[0];
  assert.equal(sunday.homework,null);
  assert.match(classSectionText(sunday,'homework'),/Homework\n\nN\/A$/);
  const saturday=data.classes.find(g=>g.id==='sat-original-oratory').sessions;
  assert.match(saturday.find(s=>s.date==='2026-09-05').homework.en,/200–400/);
  assert.match(saturday.find(s=>s.date==='2026-09-12').homework.zh,/300–500/);
  const bad=structuredClone(data);bad.classes[0].sessions[0].homework.zh=null;assert.throws(()=>validateFeedback(bad));
});
