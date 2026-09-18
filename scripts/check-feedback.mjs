import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateFeedback,weekWindows,sessionsInWindow,newestClass,feedbackText,classSectionText,shanghaiDate,sessionCompleteness} from '../src/lib/feedback.mjs';
import {isSafeFeedbackUrl,validateHomework} from '../src/lib/homework.mjs';
import {feedbackLabelParts,feedbackCopyContent,unicodeFeedbackLabel} from '../src/lib/feedback-formatting.mjs';
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
  assert.equal(student('fri-later','2026-09-11','Kaka'),undefined);
  assert.equal(student('sat-introductory','2026-09-12','Tianyou').attendance,'absent');
});
test('calendar week handles Shanghai midnight and hides future sessions',()=>{
  assert.equal(shanghaiDate(new Date('2026-09-12T16:00:00Z')),'2026-09-13');
  const windows=weekWindows(data,'2026-09-13');
  assert.deepEqual(windows[0],{id:'0',start:'2026-09-07',end:'2026-09-13'});
  assert.deepEqual(windows.at(-1),{id:'all',start:'2026-08-26',end:'2026-09-13'});
  assert.equal(newestClass(data,'2026-09-13'),'sun-1500');
  assert.equal(newestClass(data,'2026-09-12'),'sat-introductory');
  const saturday=data.classes.find(g=>g.id==='sat-original-oratory');
  assert.deepEqual(sessionsInWindow(saturday,windows[0],'2026-09-13').map(s=>s.date),['2026-09-12']);
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
  for(const group of hw.classes)for(const session of group.sessions)for(const student of session.students){if(!student.feedbackUrl?.startsWith('/fb/'))continue;assert.equal(isSafeFeedbackUrl(student.feedbackUrl),true);const params=new URL(student.feedbackUrl,'https://speakkai.com').searchParams;const fg=data.classes.find(g=>g.id===params.get('class'));const fs=fg?.sessions.find(s=>s.date===params.get('date'));const match=fs?.students.find(s=>s.id===params.get('student'));assert.equal(match?.name,student.name);assert.ok(match);assert.ok((match.en === null && match.zh === null) || (match.en && match.zh));}
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
      assert.ok(copied.endsWith(feedbackCopyContent(session[kind]?.[language]||'N/A')));
      if(session[kind])assert.match(session[kind].zh,/[\u4e00-\u9fff]/);
    }
  }
  const sunday=data.classes.find(g=>g.id==='sun-1130').sessions[0];
  assert.match(sunday.homework.en,/one to two minutes/);
  assert.match(classSectionText({...sunday,homework:null},'homework').normalize('NFKC'),/Homework\n\nN\/A$/);
  const saturday=data.classes.find(g=>g.id==='sat-original-oratory').sessions;
  assert.match(saturday.find(s=>s.date==='2026-09-05').homework.en,/200–400/);
  assert.match(saturday.find(s=>s.date==='2026-09-12').homework.zh,/300–500/);
  const bad=structuredClone(data);bad.classes[0].sessions[0].homework.zh=null;assert.throws(()=>validateFeedback(bad));
});


test('weekly archive covers boundaries and all history without future records',()=>{
  const fixture={classes:[{sessions:[{date:'2026-09-14',time:'10:00–11:00'},{date:'2026-08-31',time:'10:00–11:00'},{date:'2026-08-30',time:'10:00–11:00'}]}]};
  const windows=weekWindows(fixture,'2026-09-13');
  assert.deepEqual(windows[0],{id:'0',start:'2026-09-07',end:'2026-09-13'});
  assert.deepEqual(windows[1],{id:'1',start:'2026-08-31',end:'2026-09-06'});
  assert.deepEqual(sessionsInWindow(fixture.classes[0],windows[0],'2026-09-13').map(s=>s.date),[]);
  assert.deepEqual(sessionsInWindow(fixture.classes[0],windows.at(-1),'2026-09-13').map(s=>s.date),['2026-08-31','2026-08-30']);
});


test('recorded absence is not a missing evaluation',()=>{
 const session=data.classes.find(g=>g.id==='sat-introductory').sessions.find(s=>s.date==='2026-09-12');
 const progress=sessionCompleteness(session);
 assert.equal(progress.total,4);
 assert.equal(progress.completed,4);
 assert.equal(progress.state,'complete');
 const invalid=structuredClone(data);invalid.classes[0].sessions[0].students[0].attendance='guessed';
 assert.throws(()=>validateFeedback(invalid));
});


test('new Monday appears without recorded lessons and archive weeks are contiguous',()=>{
  const sunday=shanghaiDate(new Date('2026-09-13T15:59:59Z'));
  const monday=shanghaiDate(new Date('2026-09-13T16:00:00Z'));
  assert.deepEqual(weekWindows(data,sunday)[0],{id:'0',start:'2026-09-07',end:'2026-09-13'});
  const windows=weekWindows(data,monday);
  assert.deepEqual(windows[0],{id:'0',start:'2026-09-14',end:'2026-09-20'});
  assert.deepEqual(windows[1],{id:'1',start:'2026-09-07',end:'2026-09-13'});
  for(let i=1;i<windows.length-1;i++)assert.equal(Date.parse(windows[i-1].start)-Date.parse(windows[i].end),86400000);
  assert.deepEqual(weekWindows({classes:[]},'2027-01-01')[0],{id:'0',start:'2026-12-28',end:'2027-01-03'});
  const future={sessions:[{date:'2026-09-20',time:'10:00–11:00'}]};
  assert.deepEqual(sessionsInWindow(future,windows[0],monday),[]);
});

test('Kiran spelling is corrected while previously shared student links still resolve',()=>{
  const student=data.classes.find(g=>g.id==='mon-afternoon').sessions.find(s=>s.date==='2026-09-07').students.find(s=>s.id==='kieran');
  assert.equal(student.name,'Kiran');
  assert.match(student.en,/Kiran/);assert.match(student.zh,/Kiran/);
  assert.doesNotMatch(JSON.stringify(data),/Kieran/);
});

test('feedback labels retain bold italic Unicode when copied as plain text',()=>{
  const source='✓ Content and energy: Full observation.\n\n➜ Practice: Keep every detail.\n\nNormal prose: https://example.com';
  assert.equal(feedbackCopyContent('➜ Practice: Keep every detail.'),'➜ 𝑷𝒓𝒂𝒄𝒕𝒊𝒄𝒆: Keep every detail.');
  assert.equal(feedbackCopyContent(source).normalize('NFKC'),source);
  assert.equal(feedbackLabelParts(source).map(p=>p.text).join(''),source);
  assert.equal(feedbackCopyContent('https://example.com\n15:30–17:30\nA full sentence. More: details.'),'https://example.com\n15:30–17:30\nA full sentence. More: details.');
  assert.equal(feedbackCopyContent('➜ 练习建议：完整保留。'),'➜ 【练习建议】：完整保留。');
  assert.equal(unicodeFeedbackLabel('Homework'),'𝑯𝒐𝒎𝒆𝒘𝒐𝒓𝒌');
  assert.equal(feedbackCopyContent(feedbackCopyContent(source)),feedbackCopyContent(source));
  const session={date:'2026-09-15',time:'15:30–17:30',homework:{en:'➜ Practice: Full task.',zh:'➜ 练习建议：完整作业。'}};
  assert.equal(feedbackText(session,{name:'Kiran',en:source}).split('\n')[1],'Kiran');
  assert.ok(classSectionText(session,'homework').includes('𝑯𝒐𝒎𝒆𝒘𝒐𝒓𝒌\n\n➜ 𝑷𝒓𝒂𝒄𝒕𝒊𝒄𝒆: Full task.'));
});
