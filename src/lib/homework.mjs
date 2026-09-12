export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function visibleAssignments(group, date = shanghaiDate()) {
  return [...group.assignments].filter(a=>a.assignedOn<=date).sort((a,b)=>b.assignedOn.localeCompare(a.assignedOn)||b.id.localeCompare(a.id));
}
export function classHeading(group, date = shanghaiDate()) {
  const latest=visibleAssignments(group,date)[0];
  const day=latest?.assignedOn||group.classDate;
  const formatted=new Date(day+'T12:00:00+08:00').toLocaleDateString('en-GB',{timeZone:'Asia/Shanghai',day:'numeric',month:'long',year:'numeric'});
  return formatted+' · '+(group.classTime||'Time not confirmed');
}
export function sortedClasses(groups,date=shanghaiDate()) {
  const day=g=>visibleAssignments(g,date)[0]?.assignedOn||g.classDate;
  return [...groups].sort((a,b)=>day(b).localeCompare(day(a))||(a.classTime||'99').localeCompare(b.classTime||'99'));
}
export function validateHomework(data) {
  const exact=(obj,keys)=>Object.keys(obj).every(k=>keys.includes(k));
  if(!exact(data,['version','updatedAt','timeZone','classes'])||data.version!==1||data.timeZone!=='Asia/Shanghai'||!Number.isFinite(Date.parse(data.updatedAt))||!Array.isArray(data.classes))throw Error('Invalid homework document');
  const ids=new Set(), assignments=new Set();
  const text=s=>typeof s==='string'&&s.trim().length>0;
  for(const g of data.classes){
    if(!exact(g,['id','label','schedule','assignments','classDate','classTime'])||!text(g.id)||!/^[a-z0-9-]+$/.test(g.id)||ids.has(g.id)||!text(g.label)||!text(g.schedule)||!Array.isArray(g.assignments)||!/^\d{4}-\d{2}-\d{2}$/.test(g.classDate)||(g.classTime!==null&&!/^\d{2}:\d{2}–\d{2}:\d{2}$/.test(g.classTime)))throw Error('Invalid or duplicate class');
    ids.add(g.id);
    for(const a of g.assignments){
      if(!exact(a,['id','assignedOn','title','steps','prepareFor','note'])||!text(a.id)||assignments.has(a.id)||!/^\d{4}-\d{2}-\d{2}$/.test(a.assignedOn)||!Number.isFinite(Date.parse(a.assignedOn))||new Date(a.assignedOn).toISOString().slice(0,10)!==a.assignedOn||!text(a.title)||!text(a.prepareFor)||!Array.isArray(a.steps)||!a.steps.length||!a.steps.every(text)||(a.note!==undefined&&!text(a.note)))throw Error('Invalid assignment');
      assignments.add(a.id);
    }
  }
  return data;
}
