export function courseEvidenceSignature(group) {
  return JSON.stringify((group?.sessions || []).map(s => [s.id, s.status, s.classContent ?? null]));
}
export function validateCurricula(doc) {
  if (doc?.version !== 1 || !Array.isArray(doc.classes) || !doc.templates) throw Error('Invalid curriculum document');
  const pair = p => p && ['en','zh'].every(k => typeof p[k] === 'string' && p[k].trim());
  const ids = new Set();
  for (const [key,t] of Object.entries(doc.templates)) {
    if (!pair(t.title) || !pair(t.target) || !t.reference.startsWith('/curriculum-reference/') || !t.lessons.length) throw Error('Invalid template '+key);
    t.lessons.forEach((l,i) => {if(l.number !== i+1 || !['title','skills','activities','check'].every(k=>pair(l[k]))) throw Error('Invalid lesson '+key);});
  }
  for (const c of doc.classes) {
    const t=doc.templates[c.template];
    if(ids.has(c.id) || c.id.startsWith('sun-') || doc.excludedClassIds.includes(c.id) || !t || !pair(c.label) || !pair(c.adjustment) || !pair(c.reason) || !Number.isInteger(c.nextLesson) || !t.lessons[c.nextLesson-1] || typeof c.signature !== 'string' || !Array.isArray(c.alignments)) throw Error('Invalid class plan '+c.id);
    if(c.extension && !doc.templates[c.extension]) throw Error('Unknown extension');
    c.alignments.forEach(a=>{if(!a.sessionId || !a.lessons.every(n=>Number.isInteger(n)&&t.lessons[n-1])) throw Error('Invalid alignment');});
    ids.add(c.id);
  }
  return doc;
}
export function courseReviewCurrent(course, feedback) {
  return course.signature === courseEvidenceSignature(feedback.classes.find(g=>g.id===course.id));
}
export function lessonCopy(template,lesson,lang='en') {
  const zh=lang==='zh';
  return `${zh?'建议课纲（非已布置作业）':'Suggested lesson outline (not assigned homework)'}\n${template.title[lang]}\n${zh?'课次':'Lesson'} ${lesson.number} · ${lesson.title[lang]}\n\n◆ ${zh?'技能重点':'Skill focus'}\n${lesson.skills[lang]}\n\n◆ ${zh?'建议课堂活动':'Suggested activities'}\n${lesson.activities[lang]}\n\n◆ ${zh?'观察与反馈':'Observation and feedback'}\n${lesson.check[lang]}`;
}
