import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarDisplayEventKind, publicBookingPresentation, scheduleStartMinutes } from '../src/lib/schedulePresentation.ts';
import { weeklyScheduleBlocks } from '../src/lib/weeklySchedule.ts';
import { sanitizeCalendarCell } from './schedule-privacy.mjs';

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

test('Sunday STCC lessons are regular classes; individual lessons stay VIP', () => {
  assert.deepEqual(publicBookingPresentation('STCC'), { kind: 'group', title: 'Class booked' });
  for (const label of ['Yilan Online 1-1', 'Kunshan 1-on-1 class', 'JAC VIP', '龙柏 - Victoria']) {
    assert.deepEqual(publicBookingPresentation(label), { kind: 'vip', title: 'VIP 1-to-1 booked' });
  }
  assert.equal(calendarDisplayEventKind('井亭大厦 - 二年级 Logan 班'), 'group');
  assert.deepEqual(publicBookingPresentation('Booked'), { kind: 'reserved', title: 'Time booked' });
  assert.deepEqual(publicBookingPresentation('SAS Class'), { kind: 'group', title: 'Class booked' });
  assert.deepEqual(publicBookingPresentation('SHNo.1分享(TMC)'), { kind: 'tmc', title: 'SHNo.1分享(TMC)' });
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
