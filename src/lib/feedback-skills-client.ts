import {skillJourney,skillExcerpt} from './feedback-skills.mjs';
import {formatDate} from './feedback.mjs';

const el=(tag:string,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;n.className=className;return n;};
export function renderSkillJourney(profile:any,mappings:any,language:'en'|'zh') {
 const zh=language==='zh',journey=skillJourney(profile,mappings),root=el('section','','skill-journey');
 root.setAttribute('aria-label',`${profile.name} · ${zh?'技能轨迹':'Skill journey'}`);
 root.append(el('h3',zh?'我的技能轨迹':'My skill journey'),el('p',zh?'按课堂反馈定制。点击日期查看相关原文；练习建议不代表已掌握。':'Tailored to classroom feedback. Choose a date to read the evidence; practice advice does not mean a skill is mastered.','skill-guide'));
 const plot=el('div','','skill-plot');
 const panel=el('div','','skill-evidence');panel.hidden=true;panel.setAttribute('aria-live','polite');
 for(const lane of journey.lanes){
  const row=el('div','','skill-lane');row.dataset.skill=lane.criterion.id;
  const label=el('div','','skill-label');label.append(el('strong',lane.criterion[language]));
  const latest=lane.points.at(-1)!.record.date;
  const lastLesson=profile.records.at(-1);
  if(latest!==lastLesson?.date)label.append(el('small',zh?'后续课未重新评价':'Not reassessed in later lesson'));
  row.append(label);const track=el('div','','skill-track');
  for(const point of lane.points){
   const button=el('button','','skill-point') as HTMLButtonElement;button.type='button';
   button.append(el('span','','skill-dot'),el('span',formatDate(point.record.date,language)));
   button.setAttribute('aria-label',`${lane.criterion[language]} · ${point.record.date} · ${zh?'查看反馈':'Read feedback'}`);
   button.setAttribute('aria-expanded','false');
   button.addEventListener('click',()=>{
    const isOpen=button.getAttribute('aria-expanded')==='true';
    root.querySelectorAll('.skill-point').forEach(b=>b.setAttribute('aria-expanded','false'));
    if(isOpen){panel.hidden=true;return;}
    button.setAttribute('aria-expanded','true');panel.hidden=false;panel.replaceChildren();
    panel.append(el('h4',`${lane.criterion[language]} · ${formatDate(point.record.date,language)}`),el('p',zh?'课堂反馈原文 · 包含观察和练习方向':'From the lesson report · observations and practice directions','skill-guide'),el('p',skillExcerpt(point.record,point.skill,language),'skill-quote'));
    const link=el('a',zh?'查看这次完整反馈 →':'Read this full report →') as HTMLAnchorElement;
    link.href=`/fb/?class=${encodeURIComponent(profile.classId)}&date=${point.record.date}&student=${encodeURIComponent(profile.id)}`;panel.append(link);
   });track.append(button);
  }row.append(track);plot.append(row);
 }
 root.append(plot,panel);
 if(!journey.lanes.length)root.append(el('p',zh?'还没有可展示的已复核技能记录。':'No reviewed skill evidence is available yet.','skill-empty'));
 const exceptions=journey.records.filter((r:any)=>r.state!=='reviewed');
 for(const item of exceptions){
  const label=item.state==='absent'?(zh?'缺席 · 不作为能力变化的证据':'Absent · no assessment of change'):item.state==='missing'?(zh?'未记录个人反馈':'No individual feedback recorded'):(zh?'新增或修改的反馈等待技能复核':'Feedback awaiting skill review');
  root.append(el('p',`${formatDate(item.record.date,language)} · ${label}`,'skill-state'));
 }
 const count=journey.records.filter((r:any)=>r.state==='reviewed').length;
 root.append(el('p',count<2?(zh?'单次课堂记录可以包含多次尝试，但不能说明跨课趋势。':'One lesson may include several attempts; it cannot establish a trend across lessons.'):(zh?'日期表示反馈记录，不是分数。不同任务和支持条件需要分别考虑。':'Dates mark feedback, not scores. Tasks and levels of support may differ.'),'skill-guide'));
 return root;
}
