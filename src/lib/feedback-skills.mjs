import {evidenceSignature} from './feedback-progress.mjs';

// Descriptive criteria shared by the course assessment guides. These are not levels or scores.
export const skillCriteria = [
 {id:'ideas',en:'Ideas & reasoning',zh:'想法与推理'},
 {id:'structure',en:'Organization & endings',zh:'结构与结尾'},
 {id:'voice',en:'Voice & clarity',zh:'声音与清晰度'},
 {id:'timing',en:'Timing & pacing',zh:'时长与节奏'},
 {id:'movement',en:'Gestures & posture',zh:'手势与站姿'},
 {id:'audience',en:'Audience connection',zh:'听众联系'},
 {id:'language',en:'Language choices',zh:'语言选择'},
 {id:'preparation',en:'Preparation & recovery',zh:'准备与应变'},
 {id:'listening',en:'Listening & participation',zh:'倾听与参与'},
];

export function skillJourney(profile, mappings) {
 const reviewed=mappings?.profiles?.find(p=>p.key===profile.key);
 const records=profile.records.map(record=>{
  if(record.attendance==='absent')return {record,state:'absent',skills:[]};
  if(!record.en||!record.zh)return {record,state:'missing',skills:[]};
  const saved=reviewed?.records?.find(r=>r.sessionId===record.sessionId);
  // An old quote cannot survive an edited report or a reassigned identity.
  if(!saved||saved.signature!==evidenceSignature([record]))return {record,state:'pending',skills:[]};
  return {record,state:'reviewed',skills:saved.skills};
 });
 const lanes=skillCriteria.flatMap(criterion=>{
  const points=records.flatMap(r=>r.skills.filter(s=>s.criterion===criterion.id).map(skill=>({...r,skill})));
  return points.length?[{criterion,points}]:[];
 });
 return {records,lanes};
}

export function skillExcerpt(record, skill, language) {
 const paragraphs=record[language].split(/\n\s*\n/);
 // Mapping stores reviewed, language-specific paragraph indexes; quotes come from the full report.
 const index=skill[language];
 return Number.isInteger(index)&&paragraphs[index]!==undefined?paragraphs[index]:record[language];
}
