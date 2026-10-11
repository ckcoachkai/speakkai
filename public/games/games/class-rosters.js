// Class membership comes from the existing public feedback document. Portraits
// are an editable presentation choice; names do not determine gender.
export const STUDENT_CELLS = Object.freeze({boy:[0,2,4,6,9,11],girl:[1,3,5,7,8,10],neutral:[0,1,2,3,4,5,6,7,8,9,10,11]});
export const portraitChoice = value => ['boy','girl'].includes(value) ? value : 'neutral';
export function portraitCell(person) {
 const cells=STUDENT_CELLS[portraitChoice(person?.avatar)];
 let hash=2166136261;for(const c of String(person?.id||person?.name||'')){hash=Math.imul(hash^c.codePointAt(0),16777619)>>>0;}
 return cells[hash%cells.length];
}
export function classRosters(document) {
 if(document?.version!==1||!Array.isArray(document.classes))throw new Error('The feedback roster format is unavailable.');
 return document.classes.filter(c=>c&&typeof c.id==='string'&&Array.isArray(c.sessions)).map(c=>{
  const members=new Map(),references=new Map();
  // Stable class-scoped IDs preserve a student's chosen portrait across imports.
  const sessions=c.sessions.filter(s=>s?.status!=='cancelled'&&Array.isArray(s.students)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  for(const session of sessions)for(const student of session.students){
   if(typeof student?.id!=='string'||typeof student.name!=='string')continue;
   const name=student.name.trim();if(!name||name.length>80)continue;
   const refs=references.get(student.id)||new Set();
   // Only explicit subject references in the student's written feedback are
   // used for a suggested fictional portrait. Mixed/absent references stay
   // unspecified; this does not classify a real student's gender identity.
   for(const match of String(student.en||'').matchAll(/(?:^|[.!?\n]\s*)(He|She)(?=\s|['’])/gm))refs.add(match[1]);
   references.set(student.id,refs);
   members.set(student.id,{id:'fb:'+c.id+':'+student.id,name,classId:c.id,studentId:student.id,avatar:'neutral'});
  }
  for(const [id,person] of members){const refs=references.get(id);if(refs?.size===1){person.avatar=refs.has('She')?'girl':'boy';person.portraitSource='feedback-reference';}}
  return {id:c.id,label:String(c.label?.en||c.label?.zh||c.id),members:[...members.values()].slice(0,60)};
 }).filter(c=>c.members.length);
}
