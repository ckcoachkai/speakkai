import './check-fall-schedule-overrides.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarDisplayEventKind, publicBookingPresentation, scheduleStartMinutes, bookingGrade, publicScheduleCell, internalBookingLabel } from '../src/lib/schedulePresentation.ts';
import { weeklyScheduleBlocks } from '../src/lib/weeklySchedule.ts';
import { sanitizeCalendarCell } from './schedule-privacy.mjs';

test('sharing and named sessions retain their approved labels', () => {
  for (const [label,kind] of [['Sharing at DPS','reserved'],['Sharing at Zhangjiang Toastmasters Club','tmc'],['CAT TMC meeting','tmc']]) {
    assert.deepEqual(publicBookingPresentation(label),{kind,title:label});
    assert.equal(calendarDisplayEventKind(label),kind);
    assert.equal(publicScheduleCell(`20\nLimited availability\n20:30–21:30 · ${label}`),`20\nLimited availability\n20:30–21:30 · ${label}`);
  }
  assert.equal(publicBookingPresentation('Sharing with Lily Online 1-1').title,'Sharing with Lily Online 1-1');
});

test('holiday boot camps retain their names and group category', () => {
  for (const label of ['Grade 1 SDG boot camp', 'Grades 6–7 competition boot camp']) {
    assert.equal(calendarDisplayEventKind(label), 'group');
    assert.deepEqual(publicBookingPresentation(label), {kind: 'group', title: label});
  }
});

test('explicit all-day availability replaces Sunday windows without masking a booking', () => {
  const free = sanitizeCalendarCell('20\nFree all day\nMake-up workday: September 25-27 holiday');
  assert.equal(free, '20\nFree all day');
  assert.deepEqual(weeklyScheduleBlocks(0, free.split('\n'), 'September 2026'), [{kind:'free',timeText:'',title:'Free all day'}]);
  const booked = sanitizeCalendarCell('20\nFree all day\n10:00-11:30 STCC');
  assert.equal(booked, '20\nLimited availability\n10:00–11:30 · STCC');
});

test('rescheduled Sunday classes retain the notice and override holiday unavailability', () => {
  const moved = 'Schedule notice: Classes moved to September 27 - make-up workday for the September 25-27 holiday.';
  const makeup = 'Schedule notice: Make-up classes from September 20.';
  const cancelled = sanitizeCalendarCell(`20\n${moved}\nMake-up workday: September 25-27 holiday`);
  assert.ok(cancelled.includes(moved));
  assert.doesNotMatch(cancelled, /\d{2}:\d{2}/);
  const day = sanitizeCalendarCell(`27\n${makeup}\n10:00-11:30 STCC\n11:30-13:00 STCC\n13:30-15:00 STCC\n15:00-16:30 STCC\nHoliday: Mid-Autumn Festival`);
  assert.ok(day.includes(makeup));
  assert.doesNotMatch(day, /Holiday|Unavailable/);
  assert.equal(day.split('\n').filter(line => line.includes(' · STCC')).length, 4);
  assert.equal(weeklyScheduleBlocks(0, day.split('\n'), 'September 2026').length, 2);
  assert.equal(sanitizeCalendarCell('25\nHoliday\nHoliday: Mid-Autumn Festival'), '25\nHoliday');
  assert.equal(sanitizeCalendarCell('20\nSchedule notice: unapproved private note'), '20\nLimited availability');
});

test('class and private-session details remain visible with their categories', () => {
  for (const label of ['Yilan Online 1-1', 'Kunshan 1-on-1 class', 'JAC VIP', '龙柏 - Victoria']) {
    assert.deepEqual(publicBookingPresentation(label), {kind:'vip', title:label});
  }
  for (const [raw, title] of [
    ['SAS - 五年级', 'SAS · 华漕 - 五年级'],
    ['井亭大厦 - 二年级 Logan 班', '龙柏 - 二年级 Logan 班'],
    ['古北1699 - 八九年级', '古北 - 八九年级'],
    ['STCC', 'STCC · 威宁路'],
  ]) {
    assert.deepEqual(publicBookingPresentation(raw), {kind:'group',title});
    assert.deepEqual(publicBookingPresentation(title), {kind:'group',title});
  }
  assert.deepEqual(publicBookingPresentation('Booked'), {kind:'reserved',title:'Booked'});
  assert.deepEqual(publicBookingPresentation('SHNo.1分享(TMC)'), {kind:'tmc',title:'SHNo.1分享(TMC)'});
  const cell = publicScheduleCell('26\nHoliday\n19:00–20:00 · Claire Online 1-1\n20:00–21:00 · 井亭大厦 二年级 Logan 班');
  assert.match(cell, /Claire Online 1-1/);
  assert.match(cell, /龙柏 二年级 Logan 班/);
  assert.equal(publicScheduleCell(cell), cell);
  assert.equal(bookingGrade('十一年级'),'G11');
  assert.equal(bookingGrade('G12'),'G12');
  assert.equal(bookingGrade('古北1699'),'');
});

test('showing event titles does not expose contact details or meeting links', () => {
  const result = publicBookingPresentation('Claire Online 1-1 claire@example.com https://meet.example.com/private +86 138 0013 8000');
  assert.equal(result.title, 'Claire Online 1-1');
  assert.equal(result.kind, 'vip');
});

test('explicit online all-day availability overrides a holiday and excludes Claire booking', () => {
  const free = sanitizeCalendarCell('25\nOnline free all day\nHoliday: Mid-Autumn Festival');
  assert.equal(free,'25\nOnline free all day');
  assert.deepEqual(weeklyScheduleBlocks(5,free.split('\n'),'September 2026'),[{kind:'free',timeText:'',title:'Online free all day'}]);
  const booked=sanitizeCalendarCell('26\nOnline free all day\n19:00-20:00 Claire Online 1-1\nHoliday: Mid-Autumn Festival');
  assert.deepEqual(weeklyScheduleBlocks(6,booked.split('\n'),'September 2026'),[
    {kind:'free',timeText:'00:00–19:00',title:'Online free'},
    {kind:'free',timeText:'20:00–24:00',title:'Online free'},
  ]);
  assert.match(booked,/19:00–20:00 · Claire Online 1-1/);
});

test('Sunday availability fits chronologically around the four lessons', () => {
  const lessons = ['10:00–11:30', '11:30–13:00', '13:30–15:00', '15:00–16:30'];
  const lines = ['13', 'Limited availability', ...lessons.map(time => `${time} · STCC`)];
  const free = weeklyScheduleBlocks(0, lines, 'September 2026');
  const times = [...free.map(block => block.timeText), ...lessons];
  times.sort((a, b) => scheduleStartMinutes(a) - scheduleStartMinutes(b));
  assert.deepEqual(times, ['07:00–09:00', ...lessons, '17:00–22:00']);
  assert.equal(scheduleStartMinutes('09:05-10:30'), 545);
  assert.equal(scheduleStartMinutes(''), -1);
});
