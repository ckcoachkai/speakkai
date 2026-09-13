import {validateFeedback,weekWindows,newestClass,sessionsInWindow,formatDate,feedbackText,classSectionText,shanghaiDate} from './feedback.mjs';
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
let selectedClass=newestClass(data), followLatestClass=true, selectedWeek='0', busy=false;
let lastPayload='', lastCopyButton:HTMLButtonElement|null=null;
const words={en:{classContent:'Class content',homework:'Homework',title:'Student feedback',class:'Class',all:'All classes',week:'Week',latest:'Latest 7 days',older:'← Earlier',newer:'Later →',refresh:'Refresh',copy:'Copy',missing:'No individual feedback recorded for this class.',cancelled:'Class cancelled.',empty:'No feedback recorded for this class in this week.',copied:'Copied',failed:'Could not check for updates. The last loaded feedback is still shown.',updated:'Showing the latest published feedback.',fallbackTitle:'Copy feedback',fallbackHelp:'Clipboard access was unavailable. The text is selected below; press Ctrl+C or use your device’s copy command.',done:'Done'},zh:{classContent:'课堂内容',homework:'课后作业',title:'学生课堂反馈',class:'班级',all:'全部班级',week:'日期范围',latest:'最近7天',older:'← 更早',newer:'更近 →',refresh:'刷新',copy:'复制',missing:'本次课堂暂无该学生的个人反馈记录。',cancelled:'本次课程已取消。',empty:'该班级在此日期范围内暂无反馈记录。',copied:'已复制',failed:'暂时无法检查更新，仍显示上次载入的反馈。',updated:'当前显示最新发布的反馈。',fallbackTitle:'复制反馈',fallbackHelp:'暂时无法使用剪贴板。下方文字已选中，请按 Ctrl+C 或使用设备的复制功能。',done:'完成'}};
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className=''):HTMLElementTagNameMap[K]{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
function applyLink(){const params=new URLSearchParams(location.search),id=params.get('class'),date=params.get('date');if(id&&data.classes.some(g=>g.id===id)){selectedClass=id;followLatestClass=false;}if(date&&date<=shanghaiDate()){const window=weekWindows(data).find(w=>date>=w.start&&date<=w.end);if(window)selectedWeek=window.id;}}
function windowChoices(){return weekWindows(data);}
function render(){
  const text=words[language], windows=windowChoices();
  if(followLatestClass)selectedClass=newestClass(data);
  if(selectedClass!=='all'&&!data.classes.some(g=>g.id===selectedClass)){selectedClass=newestClass(data);followLatestClass=true;}
  if(!windows.some(w=>w.id===selectedWeek))selectedWeek='0';
  const current=windows.find(w=>w.id===selectedWeek)!;
  document.documentElement.lang=language==='zh'?'zh-CN':'en';
  document.querySelector('#page-title')!.textContent=text.title;
  document.querySelector('#class-label')!.textContent=text.class;
  document.querySelector('#week-label')!.textContent=text.week;
  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  classPicker.replaceChildren(new Option(text.all,'all'));
  for(const group of data.classes)classPicker.add(new Option(group.label[language],group.id));
  classPicker.value=selectedClass;
  weekPicker.replaceChildren();
  for(const window of windows)weekPicker.add(new Option(`${window.id==='0'?text.latest+' · ':''}${formatDate(window.start,language)} – ${formatDate(window.end,language)}`,window.id));
  weekPicker.value=selectedWeek;
  const index=windows.findIndex(w=>w.id===selectedWeek);
  older.disabled=index>=windows.length-1;newer.disabled=index===0;older.textContent=text.older;newer.textContent=text.newer;refreshButton.textContent=text.refresh;
  document.querySelector('#fallback-heading')!.textContent=text.fallbackTitle;document.querySelector('#fallback-help')!.textContent=text.fallbackHelp;document.querySelector('#fb-close-copy')!.textContent=text.done;
  const entries=data.classes.filter(group=>selectedClass==='all'||group.id===selectedClass).flatMap(group=>(sessionsInWindow(group,current) as FeedbackSession[]).map(session=>({group,session})));
  entries.sort((a,b)=>b.session.date.localeCompare(a.session.date)||a.session.time.localeCompare(b.session.time));
  const fragment=document.createDocumentFragment();
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
    for(const student of session.students){const card=el('article');card.id=`student-${session.id}-${student.id}`;const top=el('div','','student-heading');const button=el('button',text.copy);button.type='button';button.dataset.copy=student.id;button.dataset.session=session.id;button.disabled=!student[language];button.setAttribute('aria-label',`${text.copy} ${student.name}`);top.append(el('h3',student.name),button);const body=el('p',student[language]||text.missing,'feedback-text');body.lang=language;card.append(top,body);grid.append(card);}
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
classPicker.addEventListener('change',()=>{selectedClass=classPicker.value;followLatestClass=false;history.replaceState(null,'',selectedClass==='all'?location.pathname:`?class=${encodeURIComponent(selectedClass)}`);status.textContent='';render();});
weekPicker.addEventListener('change',()=>{selectedWeek=weekPicker.value;status.textContent='';render();});
for(const [button,direction] of [[older,1],[newer,-1]] as const)button.addEventListener('click',()=>{const options=windowChoices(),index=options.findIndex(w=>w.id===selectedWeek);if(options[index+direction])selectedWeek=options[index+direction].id;status.textContent='';render();});
document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language==='zh'?'zh':'en';try{localStorage.setItem('speakkai-feedback-language',language);}catch{}status.textContent='';render();}));
async function refresh(manual=false){if(busy)return;busy=true;try{const response=await fetch('/data/feedback.json',{cache:'no-store'});if(!response.ok)throw Error('Unavailable');const next:FeedbackDocument=validateFeedback(await response.json());const fingerprint=JSON.stringify(next)+shanghaiDate();if(fingerprint!==lastPayload){data=next;render();lastPayload=fingerprint;}status.textContent=manual?words[language].updated:'';}catch{status.textContent=words[language].failed;}finally{busy=false;}}
applyLink();render();
const requestedStudent=new URLSearchParams(location.search).get('student');
if(requestedStudent){const target=[...content.querySelectorAll<HTMLElement>('article')].find(card=>card.id.endsWith('-'+requestedStudent));target?.scrollIntoView({block:'center'});}
refreshButton.addEventListener('click',()=>void refresh(true));void refresh();setInterval(()=>{if(!document.hidden)void refresh();},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
