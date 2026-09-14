import raw from '../data/topics.json';
export interface TopicSource { url:string; publisher:string; title:string; published:string; read:boolean; primary:boolean; evidence?:string; recheck_status?:number|string; recheck_note?:string; }
export interface Topic { number:number; id:string; title:string; date:string; dateBasis:string; country:string; category:string; summary:string; plainSummary:string; caveat:string; imageKey:string; imageAlt:string; concepts:string[]; referenceOnly?:boolean; sources:TopicSource[]; evidenceStatus:string; ageMin?:number; sensitivity?:string; speech?:{ expository:string; oratory:string; objection:string; response:string; younger:string; question:string; impact:string; unusual:string }; scores?:Record<string,number>; ranks?:Record<string,number>; }
export const topics=raw as Topic[];
export const topicPeriod='September 1–14, 2026';
export const topicHref=(n:number)=>`/topic/${n}/`;
export const illustrationHref=(key:string)=>`/topic/art/${key}.webp`;
export const displayDate=(date:string)=>new Intl.DateTimeFormat('en',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
