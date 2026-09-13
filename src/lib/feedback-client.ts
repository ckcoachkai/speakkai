import {validateFeedback,weekWindows,sessionsInWindow,formatDate,feedbackText,classSectionText,shanghaiDate,sessionCompleteness,addDays} from './feedback.mjs';
import type {FeedbackDocument,FeedbackSession,FeedbackLanguage,FeedbackStudent} from './feedback-types';

if (location.pathname === '/FB/') history.replaceState(null, '', '/fb/' + location.search + location.hash);

let data:FeedbackDocument=validateFeedback(JSON.parse(document.querySelector('#fb-initial')!.textContent!));
const classPicker=document.querySelector<HTMLSelectElement>('#fb-class')!;
const weekPicker=document.querySelector<HTMLSelectElement>('#fb-week')!;
const content=document.querySelector<HTMLElement>('#fb-content')!;
const status=document.querySelector<HTMLElement>('#fb-status')!;
const older=document.querySelector<HTMLButtonElement>('#fb-older')!;
const newer=document.querySelector<HTMLButtonElement>('#fb-newer')!;
const refreshButton=document.querySelector<HTMLButtonElement>('#fb-refresh')!;
const dialog=document.querySelector<HTMLDialogElement>('#fb-copy-dialog')!;
const fallback=dialog.querySelector('textarea')!;
let language:FeedbackLanguage='en';
try {if(localStorage.getItem('speakkai-feedback-language')==='zh')language='zh';}catch{}
let selectedClass='all', selectedWeek='0', selectedDate='', busy=false, manualRefreshRequested=false;
let lastPayload='', lastCopyButton:HTMLButtonElement|null=null;
const words={en:{classContent:'Class content',homework:'Homework',title:'Student feedback',class:'Class',all:'All classes',week:'Dates',latest:'Latest 14 days',older:'← Earlier',newer:'Later →',refresh:'Refresh',copy:'Copy',missing:'No individual feedback recorded for this class.',cancelled:'Class cancelled.',empty:'No feedback recorded for this class in this date range.',copied:'Copied',failed:'Could not check for updates. The last loaded feedback is still shown.',updated:'Showing the latest published feedback.',fallbackTitle:'Copy feedback',fallbackHelp:'Clipboard access was unavailable. The text is selected below; press Ctrl+C or use your device’s copy command.',done:'Done'},zh:{classContent:'课堂内容',homework:'课后作业',title:'学生课堂反馈',class:'班级',all:'全部班级',week:'日期范围',latest:'最近14天',older:'← 更早',newer:'更近 →',refresh:'刷新',copy:'复制',missing:'本次课堂暂无该学生的个人反馈记录。',cancelled:'本次课程已取消。',empty:'该班级在此日期范围内暂无反馈记录。',copied:'已复制',failed:'暂时无法检查更新，仍显示上次载入的反馈。',updated:'当前显示最新发布的反馈。',fallbackTitle:'复制反馈',fallbackHelp:'暂时无法使用剪贴板。下方文字已选中，请按 Ctrl+C 或使用设备的复制功能。',done:'完成'}};
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className=''):HTMLElementTagNameMap[K]{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
function applyLink(){const params=new URLSearchParams(location.search),id=params.get('class'),date=params.get('date');selectedClass=id&&data.classes.some(g=>g.id===id)?id:'all';selectedDate='';selectedWeek=params.get('week')||'0';if(date&&date<=shanghaiDate()){const window=weekWindows(data).find(w=>date>=w.start&&date<=w.end);if(window){selectedWeek=window.id;selectedDate=date;}}}
function syncLink(){const params=new URLSearchParams();if(selectedClass!=='all')params.set('class',selectedClass);if(selectedDate)params.set('date',selectedDate);else if(selectedWeek!=='0')params.set('week',selectedWeek);history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));}
function windowChoices(){return weekWindows(data);}
function render(){
  const text=words[language], windows=windowChoices();
  if(selectedClass!=='all'&&!data.classes.some(g=>g.id===selectedClass))selectedClass='all';
  if(!windows.some(w=>w.id===selectedWeek))selectedWeek='0';
  const current=windows.find(w=>w.id===selectedWeek)!;
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.querySelector('#page-title')!.textContent=text.title;
  document.querySelector('#fb-intro')!.textContent=language==='zh'?'选择班级，查看课堂内容、作业及学生个人反馈。':'Choose a class to see its lesson, homework and individual feedback.';
  document.querySelector('#class-label')!.textContent=text.class;
  document.querySelector('#week-label')!.textContent=text.week;
  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  classPicker.replaceChildren(new Option(text.all,'all'));
  for(const group of data.classes)classPicker.add(new Option(group.label[language],group.id));
  classPicker.value=selectedClass;
  weekPicker.replaceChildren();
  for(const window of windows)weekPicker.add(new Option(`${window.id==='all'?(language==='zh'?'全部历史':'All history'):window.id==='0'?text.latest+' · ':''}${window.id==='all'?'':formatDate(window.start,language)+' – '+formatDate(window.end,language)}`,window.id));
  weekPicker.value=selectedWeek;
  const index=windows.findIndex(w=>w.id===selectedWeek);
  older.disabled=index>=windows.length-1;newer.disabled=index===0;older.textContent=text.older;newer.textContent=text.newer;refreshButton.textContent=text.refresh;
  document.querySelector('#fallback-heading')!.textContent=text.fallbackTitle;document.querySelector('#fallback-help')!.textContent=text.fallbackHelp;document.querySelector('#fb-close-copy')!.textContent=text.done;
  const entries=data.classes.filter(group=>selectedClass==='all'||group.id===selectedClass).flatMap(group=>(sessionsInWindow(group,current) as FeedbackSession[]).filter(session=>!selectedDate||session.date===selectedDate).map(session=>({group,session})));
  entries.sort((a,b)=>b.session.date.localeCompare(a.session.date)||a.session.time.localeCompare(b.session.time));
  const fragment=document.createDocumentFragment();
  if(selectedClass==='all'){
    const zh=language==='zh',stats=el('div','','overview-stats');
    const counts=entries.map(({session})=>sessionCompleteness(session));
    stats.append(el('span',`${entries.length} ${zh?'节课':'classes'}`),el('span',`${counts.filter(s=>s.state==='complete').length} ${zh?'已完整记录':'complete'}`),el('span',`${counts.filter(s=>s.state==='missing').length} ${zh?'信息待补充':'need information'}`));
    fragment.append(stats,el('p',zh?'状态表示报告是否完整，不代表学生表现。缺失作业信息不代表学生未完成作业。':'Status describes report completeness, not student performance. Missing homework information does not mean a student missed homework.','overview-help'));
    const grid=el('div','','overview-grid');
    for(let day=current.end;day>=current.start;day=addDays(day,-1)){
      const dayEntries=entries.filter(entry=>entry.session.date===day);
      grid.append(el('h2',formatDate(day,language),'timeline-date'));
      if(!dayEntries.length)grid.append(el('p',zh?'暂无该日期的课堂报告。':'No class reports recorded for this date.','timeline-empty'));
    for(const {group,session} of dayEntries){
      const progress=sessionCompleteness(session,language),card=el('section','',`overview-card ${progress.state}`),main=el('div');card.dataset.session=session.id;
      main.append(el('span',progress.state==='complete'?(zh?'✓ 已完整记录':'✓ Complete'):progress.state==='cancelled'?(zh?'已取消':'Cancelled'):(zh?'! 信息待补充':'! Missing information'),`completion-badge ${progress.state}`));
      const link=`?class=${encodeURIComponent(group.id)}&date=${session.date}`,heading=el('h2'),title=el('a',group.label[language]);title.href=link;heading.append(title);main.append(heading,el('p',`${formatDate(session.date,language)} · ${session.time}`));
      const roster=el('p','','roster');
      session.students.forEach((student,index)=>{if(index)roster.append(document.createTextNode(' · '));const anchor=el('a',student.name,`student-link${!student.en||!student.zh?' missing-feedback':''}`);anchor.href=link+`&student=${encodeURIComponent(student.id)}`;roster.append(anchor);});
      if(!session.students.length)roster.textContent=progress.state==='cancelled'?(zh?'本次未上课':'No class held'):(zh?'学生名单未记录':'No roster recorded');
      const open=el('a',zh?'查看详情 →':'View class →','open-class');open.href=link;main.append(roster,open);
      const note=el('aside','','completion-note');note.append(el('strong',progress.state==='missing'?(zh?'缺少哪些信息':'What is missing'):progress.state==='cancelled'?(zh?'无需课堂报告':'No report required'):(zh?'全部已记录':'All recorded')));
      if(progress.missing.length){const list=el('ul');progress.missing.forEach((item:string)=>list.append(el('li',item)));note.append(list);}else note.append(el('p',progress.state==='cancelled'?text.cancelled:(zh?'课堂内容、作业及所有已列学生的反馈均有中英文记录。':'Class content, homework and feedback for every listed student are available in both languages.')));
      if(progress.total)note.append(el('p',zh?`个人反馈：${progress.completed}/${progress.total}`:`Individual feedback: ${progress.completed}/${progress.total}`));
      card.append(main,note);grid.append(card);
    }
    }
    fragment.append(grid);if(!entries.length)fragment.append(el('p',text.empty,'fb-empty'));content.replaceChildren(fragment);return;
  }
  const back=el('button',language==='zh'?'← 返回班级概览':'← All classes','back-overview');back.type='button';back.addEventListener('click',()=>{selectedClass='all';selectedDate='';syncLink();render();document.querySelector<HTMLElement>('#page-title')?.scrollIntoView();});fragment.append(back);
  for(const {session} of entries){
    const section=el('section','','fb-session');section.dataset.session=session.id;
    const heading=el('header');heading.append(el('h2',`${formatDate(session.date,language)} · ${session.time}`));section.append(heading);
    const summary=el('div','','class-summary');
    for(const kind of ['classContent','homework'] as const){
      const card=el('section','','class-section');card.dataset.section=kind;
      const top=el('div','','student-heading'),button=el('button',text.copy);
      button.type='button';button.dataset.copySection=kind;button.dataset.session=session.id;
      button.setAttribute('aria-label',`${text.copy} ${text[kind]}`);
      top.append(el('h3',text[kind]),button);
      const body=el('p',session[kind]?.[language]||'N/A','feedback-text');body.lang=language;
      card.append(top,body);summary.append(card);
    }
    section.append(summary);
    if(session.status==='cancelled'){section.append(el('p',text.cancelled,'fb-empty'));fragment.append(section);continue;}
    const grid=el('div','','feedback-grid');
    for(const student of session.students){const card=el('article','',student[language]?'':'missing-feedback');card.id=`student-${session.id}-${student.id}`;const top=el('div','','student-heading');const button=el('button',text.copy);button.type='button';button.dataset.copy=student.id;button.dataset.session=session.id;button.disabled=!student[language];button.setAttribute('aria-label',`${text.copy} ${student.name}`);top.append(el('h3',student.name),button);const body=el('p',student[language]||text.missing,'feedback-text');body.lang=language;card.append(top,body);grid.append(card);}
    section.append(grid);fragment.append(section);
  }
  if(!entries.length)fragment.append(el('p',text.empty,'fb-empty'));
  content.replaceChildren(fragment);
}
async function copyStudent(button:HTMLButtonElement){
  const session=data.classes.flatMap(group=>group.sessions).find(item=>item.id===button.dataset.session);
  if(!session)return;
  const kind=button.dataset.copySection;
  const student:FeedbackStudent|undefined=session.students.find(item=>item.id===button.dataset.copy);
  if(!kind&&(!student||!student[language]))return;
  const sectionKind=kind==='classContent'?'classContent':'homework';
  const label=kind?words[language][sectionKind]:student!.name;
  const value=kind?classSectionText(session,sectionKind,language):feedbackText(session,student!,language);lastCopyButton=button;
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);status.textContent=`${words[language].copied} · ${label} · ${formatDate(session.date,language)}`;}
  catch{fallback.value=value;if(!dialog.open)dialog.showModal();fallback.focus();fallback.select();status.textContent=words[language].fallbackHelp;}
}
content.addEventListener('click',event=>{const button=event.target instanceof Element?event.target.closest<HTMLButtonElement>('button[data-copy],button[data-copy-section]'):null;if(button)void copyStudent(button);});
document.querySelector('#fb-close-copy')!.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>lastCopyButton?.focus());
classPicker.addEventListener('change',()=>{selectedClass=classPicker.value;selectedDate='';syncLink();status.textContent='';render();});
weekPicker.addEventListener('change',()=>{selectedWeek=weekPicker.value;selectedDate='';syncLink();status.textContent='';render();});
for(const [button,direction] of [[older,1],[newer,-1]] as const)button.addEventListener('click',()=>{const options=windowChoices(),index=options.findIndex(w=>w.id===selectedWeek);if(options[index+direction])selectedWeek=options[index+direction].id;selectedDate='';syncLink();status.textContent='';render();});
document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language==='zh'?'zh':'en';try{localStorage.setItem('speakkai-feedback-language',language);}catch{}status.textContent='';render();}));
async function refresh(manual=false){manualRefreshRequested ||= manual;if(busy)return;busy=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);try{const response=await fetch('/data/feedback.json',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Unavailable');const next:FeedbackDocument=validateFeedback(await response.json());const fingerprint=JSON.stringify(next)+shanghaiDate();if(fingerprint!==lastPayload){data=next;render();lastPayload=fingerprint;}status.textContent=manualRefreshRequested?words[language].updated:'';}catch{status.textContent=words[language].failed;}finally{clearTimeout(timeout);busy=false;manualRefreshRequested=false;}}
applyLink();render();
const requestedStudent=new URLSearchParams(location.search).get('student');
if(requestedStudent){const target=[...content.querySelectorAll<HTMLElement>('article')].find(card=>card.id.endsWith('-'+requestedStudent));target?.scrollIntoView({block:'center'});}
refreshButton.addEventListener('click',()=>void refresh(true));void refresh();setInterval(()=>{if(!document.hidden)void refresh();},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
