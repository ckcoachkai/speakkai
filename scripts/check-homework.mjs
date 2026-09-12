import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateHomework, visibleSessions, sessionNavigation, serializeSession, isSafeFeedbackUrl, shanghaiDate } from '../src/lib/homework.mjs';

const fixture = {
  version: 2,
  updatedAt: '2026-09-12T10:00:00+08:00',
  timeZone: 'Asia/Shanghai',
  classes: [{ id: 'class-a', sessions: [
    { id: 'class-a-older', date: '2026-09-05', time: '13:00–15:00', students: [{ name: 'A Student', feedbackUrl: null }], classContent: ['Story shape'], homework: null },
    { id: 'class-a-current', date: '2026-09-12', time: '13:00–15:00', students: [{ name: 'A Student', feedbackUrl: 'https://docs.google.com/spreadsheets/d/example/edit#gid=1&range=A1' }], classContent: ['Opening and ending'], homework: { title: 'Short speech', steps: ['Draft an opening', 'Say it aloud'], prepareFor: 'the next class', note: 'Bring your notes.' } },
    { id: 'class-a-future', date: '2026-09-19', time: '13:00–15:00', students: [{ name: 'A Student', feedbackUrl: null }], classContent: ['Future lesson'], homework: null },
  ] }],
};

test('fixture validates the v2 dated-session contract', () => {
  assert.equal(validateHomework(fixture), fixture);
  assert.equal(fixture.classes[0].sessions.length, 3);
});

test('Shanghai date filters future sessions and navigation keeps older/newer direction stable', () => {
  const group = fixture.classes[0];
  assert.deepEqual(visibleSessions(group, '2026-09-12').map((session) => session.id), ['class-a-current', 'class-a-older']);
  const nav = sessionNavigation(group, 'class-a-current', '2026-09-12');
  assert.equal(nav.older.id, 'class-a-older');
  assert.equal(nav.newer, null);
  const older = sessionNavigation(group, nav.older.id, '2026-09-12');
  assert.equal(older.newer.id, 'class-a-current');
  assert.equal(older.older, null);
});

test('copy serialization is plain text, current-session scoped, and clearly separated', () => {
  const session = fixture.classes[0].sessions[1];
  const both = serializeSession(session, 'both');
  assert.match(both, /12 September 2026 · 13:00–15:00/);
  assert.match(both, /Class content\n- Opening and ending/);
  assert.match(both, /Homework\nShort speech\n1\. Draft an opening\n2\. Say it aloud/);
  assert.match(both, /Preparation: the next class/);
  assert.doesNotMatch(both, /<|>/);
  assert.equal(serializeSession(session, 'content').includes('Short speech'), false);
  assert.match(serializeSession({ ...session, homework: null }, 'homework'), /Not recorded for this class/);
});

test('feedback links allow private Google links and reject unsafe destinations', () => {
  assert.equal(isSafeFeedbackUrl(null), true);
  assert.equal(isSafeFeedbackUrl('https://docs.google.com/spreadsheets/d/example/edit#gid=1&range=A1'), true);
  assert.equal(isSafeFeedbackUrl('javascript:alert(1)'), false);
  assert.equal(isSafeFeedbackUrl('http://docs.google.com/spreadsheets/d/example'), false);
  assert.equal(isSafeFeedbackUrl('https://example.com/feedback'), false);
  const bad = structuredClone(fixture);
  bad.classes[0].sessions[0].students[0].feedbackUrl = 'javascript:alert(1)';
  assert.throws(() => validateHomework(bad));
});

test('unexpected fields and impossible calendar dates are rejected', () => {
  const extra = structuredClone(fixture);
  extra.classes[0].privateNote = 'do not publish';
  assert.throws(() => validateHomework(extra));
  const invalid = structuredClone(fixture);
  invalid.classes[0].sessions[0].date = '2026-02-31';
  assert.throws(() => validateHomework(invalid));
  const duplicate = structuredClone(fixture);
  duplicate.classes[0].sessions[1].id = 'another-id';
  duplicate.classes[0].sessions[1].date = duplicate.classes[0].sessions[0].date;
  duplicate.classes[0].sessions[1].time = duplicate.classes[0].sessions[0].time;
  assert.throws(() => validateHomework(duplicate));
  const backwards = structuredClone(fixture);
  backwards.classes[0].sessions[0].time = '15:00–13:00';
  assert.throws(() => validateHomework(backwards));
});

test('published data is the v2 contract and contains no archive identifiers', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../public/data/homework.json', import.meta.url)));
  assert.equal(data.version, 2);
  validateHomework(data);
  assert.doesNotMatch(JSON.stringify(data), /SRC-\d|FB-\d|ckcoachkai@gmail|private\\|dictation-archive/i);
});

test('Shanghai midnight is evaluated in the published timezone', () => {
  assert.equal(shanghaiDate(new Date('2026-09-11T15:59:59Z')), '2026-09-11');
  assert.equal(shanghaiDate(new Date('2026-09-11T16:00:00Z')), '2026-09-12');
});
