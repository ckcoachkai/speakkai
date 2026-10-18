import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { williamMondayLesson } from '../src/lib/william-homework.mjs';

const data = JSON.parse(readFileSync(new URL('../public/data/feedback.json', import.meta.url)));
test('William page preserves the full paired sections of his Monday lesson', () => {
  const actual = williamMondayLesson(data, '2026-10-18');
  const session = data.classes.find(c => c.id === 'mon-afternoon').sessions.find(s => s.date === '2026-10-12');
  assert.deepEqual(actual, { date: session.date, time: session.time, classContent: session.classContent, homework: session.homework });
  assert.deepEqual(Object.keys(actual).sort(), ['classContent', 'date', 'homework', 'time']);
});
test('Saturday namesake, future classes and cancellations cannot replace Monday homework', () => {
  const pair = text => ({ en: text, zh: text });
  const session = (date, status = 'held') => ({ date, time: '15:30–17:30', status, students: [{ id: 'william', name: 'William' }], classContent: pair(date), homework: pair(date) });
  const fixture = { classes: [
    { id: 'sat-foundations', sessions: [session('2026-10-17')] },
    { id: 'mon-afternoon', sessions: [session('2026-10-12'), session('2026-10-19'), session('2026-10-15', 'cancelled')] },
  ] };
  assert.equal(williamMondayLesson(fixture, '2026-10-18').date, '2026-10-12');
  assert.equal(williamMondayLesson(fixture, '2026-10-19').date, '2026-10-19');
});
test('Missing homework stays missing instead of carrying forward another week', () => {
  const fixture = structuredClone(data);
  const group = fixture.classes.find(c => c.id === 'mon-afternoon');
  const current = group.sessions.find(s => s.date === '2026-10-12');
  current.homework = null;
  assert.equal(williamMondayLesson(fixture, '2026-10-18').homework, null);
  assert.equal(williamMondayLesson({ classes: [] }, '2026-10-18'), null);
});
