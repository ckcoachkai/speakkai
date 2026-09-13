import {shanghaiDate} from './feedback.mjs';
export function progressProfiles(data,today=shanghaiDate()){
 const profiles=[];
 for(const group of data.classes){
  const students=new Map();
  for(const session of [...group.sessions].filter(s=>s.date<=today&&s.status==='held').sort((a,b)=>a.date.localeCompare(b.date))){
   for(const student of session.students){
    if(!students.has(student.id))students.set(student.id,{key:group.id+'/'+student.id,classId:group.id,label:group.label,id:student.id,name:student.name,records:[]});
    students.get(student.id).records.push({date:session.date,time:session.time,sessionId:session.id,attendance:student.attendance||null,en:student.en,zh:student.zh});
   }
  }
  profiles.push(...students.values());
 }
 return profiles;
}
export function snapshot(text,limit=250){
 if(!text)return '';
 const value=text.split('\n\n').find(t=>t.trim())?.replace(/^[✓✅🔎➜💬→◆•!]+\s*/u,'')||'';
 if(value.length<=limit)return value;
 const cut=value.slice(0,limit);return cut.slice(0,Math.max(cut.lastIndexOf(' '),Math.floor(limit*.85)))+'…';
}
export function evidenceSignature(records){
 return JSON.stringify(records.map(r=>[r.sessionId,r.attendance,r.en,r.zh]));
}
