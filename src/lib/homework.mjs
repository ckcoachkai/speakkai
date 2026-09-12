const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}–\d{2}:\d{2}$/;
const ID_RE = /^[a-z0-9-]+$/;

export const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every((key) => keys.includes(key));
}

function text(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validDate(value) {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00+08:00`);
  return Number.isFinite(parsed.getTime())
    && new Intl.DateTimeFormat('en-CA', { timeZone: SHANGHAI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed) === value;
}

function validTime(value) {
  if (!TIME_RE.test(value)) return false;
  const [start, end] = value.split('–');
  const minutes = (item) => {
    const [hour, minute] = item.split(':').map(Number);
    return hour * 60 + minute;
  };
  return [start, end].every((item) => {
    const [hour, minute] = item.split(':').map(Number);
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }) && minutes(end) > minutes(start);
}

export function isSafeFeedbackUrl(value) {
  if (value === null) return true;
  if (!text(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && !url.username && !url.password
      && url.hostname.toLowerCase() === 'docs.google.com'
      && /^\/spreadsheets\/d\/[^/]+\/edit\/?$/.test(url.pathname)
      && /(?:^|[&#?])gid=/.test(`${url.search}${url.hash}`)
      && /(?:^|[&#?])range=/.test(`${url.search}${url.hash}`);
  } catch {
    return false;
  }
}

export function validateHomework(data) {
  if (!exactKeys(data, ['version', 'updatedAt', 'timeZone', 'classes'])
    || data.version !== 2
    || !text(data.updatedAt)
    || !Number.isFinite(Date.parse(data.updatedAt))
    || data.timeZone !== SHANGHAI_TIME_ZONE
    || !Array.isArray(data.classes)) throw Error('Invalid homework document');

  const classIds = new Set();
  const sessionIds = new Set();
  for (const group of data.classes) {
    if (!exactKeys(group, ['id', 'sessions'])
      || !text(group.id) || !ID_RE.test(group.id) || classIds.has(group.id)
      || !Array.isArray(group.sessions)) throw Error('Invalid or duplicate class');
    classIds.add(group.id);
    for (const session of group.sessions) {
      if (!exactKeys(session, ['id', 'date', 'time', 'students', 'classContent', 'homework'])
        || !text(session.id) || !ID_RE.test(session.id) || sessionIds.has(session.id)
        || !validDate(session.date) || !validTime(session.time)
        || !Array.isArray(session.students) || !Array.isArray(session.classContent)) throw Error('Invalid session');
      sessionIds.add(session.id);
      if (!session.classContent.every(text)) throw Error('Invalid class content');
      if (new Set(group.sessions.map((item) => `${item.date}|${item.time}`)).size !== group.sessions.length) throw Error('Duplicate session date and time');
      const names = new Set();
      for (const student of session.students) {
        if (!exactKeys(student, ['name', 'feedbackUrl']) || !text(student.name)
          || names.has(student.name) || !isSafeFeedbackUrl(student.feedbackUrl)) throw Error('Invalid student feedback');
        names.add(student.name);
      }
      if (session.homework !== null) {
        const homework = session.homework;
        if (!exactKeys(homework, ['title', 'steps', 'prepareFor', 'note'])
          || !text(homework.title) || !Array.isArray(homework.steps) || !homework.steps.length
          || !homework.steps.every(text) || !text(homework.prepareFor)
          || (homework.note !== undefined && !text(homework.note))) throw Error('Invalid homework');
      }
    }
  }
  return data;
}

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SHANGHAI_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function formatSessionDate(value) {
  if (!validDate(value)) return 'Date not recorded';
  return new Date(`${value}T12:00:00+08:00`).toLocaleDateString('en-GB', {
    timeZone: SHANGHAI_TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric',
  });
}

function compareSessionsNewest(a, b) {
  return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
}

export function visibleSessions(group, date = shanghaiDate()) {
  return [...group.sessions].filter((session) => session.date <= date).sort(compareSessionsNewest);
}

export function latestVisibleSession(group, date = shanghaiDate()) {
  return visibleSessions(group, date)[0] ?? null;
}

export function classHeading(group, date = shanghaiDate()) {
  const session = latestVisibleSession(group, date);
  return session ? `${formatSessionDate(session.date)} · ${session.time}` : 'No dated session recorded';
}

export function sortedClasses(groups, date = shanghaiDate()) {
  return [...groups].sort((a, b) => {
    const aSession = latestVisibleSession(a, date);
    const bSession = latestVisibleSession(b, date);
    if (!aSession && !bSession) return a.id.localeCompare(b.id);
    if (!aSession) return 1;
    if (!bSession) return -1;
    return bSession.date.localeCompare(aSession.date)
      || aSession.time.localeCompare(bSession.time)
      || a.id.localeCompare(b.id);
  });
}

export function sessionNavigation(group, selectedId, date = shanghaiDate()) {
  const sessions = visibleSessions(group, date);
  const index = Math.max(0, sessions.findIndex((session) => session.id === selectedId));
  return {
    selected: sessions[index] ?? null,
    older: sessions[index + 1] ?? null,
    newer: sessions[index - 1] ?? null,
    sessions,
  };
}

function listText(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : 'Not recorded for this class.';
}

export function serializeSession(session, kind = 'both') {
  if (!session) return '';
  const sections = [`${formatSessionDate(session.date)} · ${session.time}`];
  if (kind === 'content' || kind === 'both') {
    sections.push(`Class content\n${listText(session.classContent)}`);
  }
  if (kind === 'homework' || kind === 'both') {
    if (session.homework) {
      const homework = [session.homework.title, session.homework.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'), `Preparation: ${session.homework.prepareFor}`];
      if (session.homework.note) homework.push(`Note: ${session.homework.note}`);
      sections.push(`Homework\n${homework.join('\n')}`);
    } else {
      sections.push('Homework\nNot recorded for this class.');
    }
  }
  return sections.join('\n\n');
}
