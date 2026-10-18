import { shanghaiDate } from './homework.mjs';

// William's Monday class is distinct from the William in Saturday's class.
export function williamMondayLesson(data, today = shanghaiDate()) {
  const group = data.classes.find(group => group.id === 'mon-afternoon');
  const session = group?.sessions
    .filter(session => session.status === 'held' && session.date <= today
      && session.students.some(student => student.id === 'william'))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))[0];
  if (!session) return null;
  return {
    date: session.date,
    time: session.time,
    classContent: session.classContent ?? null,
    homework: session.homework ?? null,
  };
}
