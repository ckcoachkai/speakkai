import {courseReviewCurrent,lessonCopy} from './class-curricula.mjs';
type Lang='en'|'zh';
const node=(tag:string,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;};
export function curriculumPanel(doc:any,feedback:any,classId:string,lang:Lang){
 const c=doc.classes.find((c:any)=>c.id===classId);if(!c)return null;
 const zh=lang==='zh',t=doc.templates[c.template],current=courseReviewCurrent(c,feedback);
 const panel=node('section','','curriculum-panel');panel.id='course-outline';
 panel.append(node('h2',zh?'课程与建议课纲':'Course and suggested lesson outline'));
 panel.append(node('p',`${t.title[lang]} · ${t.lessons.length} ${zh?'课次':'lessons'} · ${zh?'最终目标':'Final target'}: ${t.target[lang]}`));
 panel.append(node('p',zh?'以下为可调整的教学建议，不代表已经上过的课程或已经布置的作业。实际课堂内容与完整反馈保留在下方。课次按教学进度调整，不按日历自动推进。':'These are adaptable teaching proposals, not records of lessons delivered or homework assigned. Actual class content and full feedback remain below. Lesson numbers follow reviewed teaching progress, not calendar weeks.','curriculum-note'));
 if(c.extension)panel.append(node('p',(zh?'混合班：共同基础如上；可根据准备情况使用延伸课程：':'Mixed group: use the shared base above; extend according to readiness with ')+doc.templates[c.extension].title[lang]));
 const next=node('div','','curriculum-next');next.append(node('h3',zh?'下一课建议':'Suggested next lesson'));
 if(current){const lesson=t.lessons[c.nextLesson-1];next.append(node('p',`${zh?'课次':'Lesson'} ${lesson.number} · ${lesson.title[lang]}`),node('p',c.adjustment[lang]),node('p',(zh?'调整依据：':'Why this fits: ')+c.reason[lang]),node('small',`${zh?'复核日期':'Reviewed'}: ${c.reviewedAt}`));}
 else next.append(node('p',zh?'实际课堂记录已有变化，下一课建议与历史对应关系等待周度复核。下方基础课纲仍可作为参考。':'Recorded class content has changed. The next-lesson recommendation and historical alignment are awaiting weekly review. The base outline below remains available as a reference.','curriculum-pending'));
 panel.append(next);
 const list=node('details','','curriculum-sequence');list.append(node('summary',zh?`查看完整 ${t.lessons.length} 课课纲`:`View all ${t.lessons.length} lesson outlines`));
 function addLessons(template:any,parent:HTMLElement,prefix:string){for(const lesson of template.lessons){const item=node('details','','curriculum-lesson');item.id=`${prefix}-${lesson.number}`;item.append(node('summary',`${zh?'课次':'Lesson'} ${lesson.number} · ${lesson.title[lang]}`));item.append(node('h4',zh?'技能重点':'Skill focus'),node('p',lesson.skills[lang]),node('h4',zh?'建议课堂活动':'Suggested activities'),node('p',lesson.activities[lang]),node('h4',zh?'观察与反馈':'Observation and feedback'),node('p',lesson.check[lang]));const btn=node('button',zh?'复制课纲':'Copy outline') as HTMLButtonElement;btn.type='button';const status=node('p','','curriculum-copy-status');status.setAttribute('role','status');btn.addEventListener('click',async()=>{const value=lessonCopy(template,lesson,lang);try{await navigator.clipboard.writeText(value);status.textContent=zh?'已复制':'Copied';}catch{status.textContent=zh?'请选择并复制下方文字。':'Select and copy the text below.';let area=item.querySelector('textarea');if(!area){area=document.createElement('textarea');area.readOnly=true;area.setAttribute('aria-label',zh?'课纲复制文本':'Lesson outline to copy');item.append(area);}area.value=value;area.focus();area.select();}});item.append(btn,status);parent.append(item);}}
 addLessons(t,list,'course-lesson');panel.append(list);
 if(c.extension){const ext=node('details');ext.append(node('summary',zh?'查看混合班延伸课纲':'View mixed-grade extension outline'));addLessons(doc.templates[c.extension],ext,'extension-lesson');panel.append(ext);}
 const reference=node('a',zh?'详细教师参考（英文） →':'Detailed teacher reference (English) →') as HTMLAnchorElement;reference.href=t.reference;panel.append(reference);
 return panel;
}
export function curriculumAlignment(doc:any,feedback:any,classId:string,session:any,lang:Lang){
 const c=doc.classes.find((c:any)=>c.id===classId);if(!c)return null;
 const zh=lang==='zh',box=node('details','','curriculum-alignment');box.append(node('summary',zh?'本次记录与课纲的对应':'How this record relates to the outline'));
 if(session.status==='cancelled'){box.append(node('p',zh?'本次取消；不推进课纲。':'Class cancelled; the outline does not advance.'));return box;}
 const a=c.alignments.find((a:any)=>a.sessionId===session.id);
 if(!courseReviewCurrent(c,feedback)||!a){box.append(node('p',zh?'对应关系等待复核，不自动推断完成了哪些课程。':'Alignment awaits review; completed lessons are not inferred automatically.'));return box;}
 const t=doc.templates[c.template];box.append(node('p',zh?'以下是与已记录内容有关的课纲技能，不代表这些课次已经全部完成：':'These outline skills relate to the recorded content; this does not mean each lesson has been completed:'));
 for(const n of a.lessons){const l=t.lessons[n-1];box.append(node('p',`◆ ${zh?'课次':'Lesson'} ${n} · ${l.title[lang]}\n${l.skills[lang]}`));}
 return box;
}
