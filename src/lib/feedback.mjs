import { shanghaiDate } from './homework.mjs';
export { shanghaiDate };
const isText = value => typeof value === 'string' && value.trim().length > 0;
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function validateFeedback(data) {
  if (!exact(data,['version','updatedAt','timeZone','classes']) || data.version !== 1 || data.timeZone !== 'Asia/Shanghai' || !Number.isFinite(Date.parse(data.updatedAt)) || !Array.isArray(data.classes)) throw Error('Invalid feedback document');
  const groups = new Set(), sessions = new Set();
  for (const group of data.classes) {
    if (!exact(group,['id','label','sessions']) || !/^[a-z0-9-]+$/.test(group.id) || groups.has(group.id) || !exact(group.label,['en','zh']) || !isText(group.label.en) || !isText(group.label.zh) || !Array.isArray(group.sessions)) throw Error('Invalid class');
    groups.add(group.id);
    const dates = new Set();
    for (const session of group.sessions) {
      if (!exact(session,['id','date','time','status','students']) || !isText(session.id) || sessions.has(session.id) || !validDate(session.date) || !/^([01]\d|2[0-3]):[0-5]\d–([01]\d|2[0-3]):[0-5]\d$/.test(session.time) || session.time.slice(0,5) >= session.time.slice(6) || !['held','cancelled'].includes(session.status) || !Array.isArray(session.students)) throw Error('Invalid session');
      if (dates.has(session.date+'|'+session.time)) throw Error('Duplicate session');
      dates.add(session.date+'|'+session.time); sessions.add(session.id);
      if (session.status === 'cancelled' && session.students.length) throw Error('Cancelled sessions cannot contain student evaluations');
      const names = new Set(), ids = new Set();
      for (const student of session.students) {
        if (!exact(student,['id','name','en','zh']) || !/^[a-z0-9-]+$/.test(student.id) || !isText(student.name) || names.has(student.name) || ids.has(student.id) || !((student.en === null && student.zh === null) || (isText(student.en) && isText(student.zh)))) throw Error('Invalid bilingual feedback');
        names.add(student.name); ids.add(student.id);
      }
    }
  }
  return data;
}
export function addDays(date, days) { const value = new Date(date+'T12:00:00Z'); value.setUTCDate(value.getUTCDate()+days); return value.toISOString().slice(0,10); }
export function weekWindows(data, today=shanghaiDate()) {
  const dates = data.classes.flatMap(group => group.sessions.map(session => session.date)).filter(date => date <= today);
  const offsets = [...new Set(dates.map(date => Math.floor((Date.parse(today)-Date.parse(date))/604800000)))].sort((a,b)=>a-b);
  if (!offsets.includes(0)) offsets.unshift(0);
  return offsets.map(offset => ({id:String(offset),start:addDays(today,-offset*7-6),end:addDays(today,-offset*7)}));
}
export function sessionsInWindow(group, window, today=shanghaiDate()) {
  return [...group.sessions].filter(session => session.date >= window.start && session.date <= window.end && session.date <= today).sort((a,b)=>b.date.localeCompare(a.date)||a.time.localeCompare(b.time));
}
export function newestClass(data, today=shanghaiDate()) {
  const entries=data.classes.flatMap(group => group.sessions.filter(session=>session.date<=today&&session.status==='held').map(session=>({group,session})));
  entries.sort((a,b)=>b.session.date.localeCompare(a.session.date)||b.session.time.localeCompare(a.session.time));
  return entries[0]?.group.id || 'all';
}
export function formatDate(date,language='en') { return new Date(date+'T12:00:00+08:00').toLocaleDateString(language==='zh'?'zh-CN':'en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:language==='zh'?'long':'short',day:'numeric'}); }
export function feedbackText(session,student,language='en') {
  const content=student[language];
  if (!content) return '';
  return `${formatDate(session.date,language)} · ${session.time}\n${student.name}\n\n${content}`;
}
