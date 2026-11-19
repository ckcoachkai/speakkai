/* Shared by the iPhone web app and WeChat. Entries store the local wall clock
 * seen at check-in, so travelling never changes the date or time of a memory. */
(function (build) {
  var diary = build();
  if (typeof module !== 'undefined' && module.exports) module.exports = diary;
  else if (typeof window !== 'undefined') window.Diary = diary;
})(function () {
  'use strict';

  var DAY_MS = 86400000;
  var DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
  var TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

  function pad(value, width) {
    return (Array(width + 1).join('0') + value).slice(-width);
  }

  function validInstant(value) {
    return value instanceof Date && isFinite(value.getTime());
  }

  function formatDay(year, month, day) {
    if (year < 1 || year > 9999) throw new RangeError('Year outside diary range');
    return pad(year, 4) + '-' + pad(month, 2) + '-' + pad(day, 2);
  }

  function dayKey(date) {
    if (!validInstant(date)) throw new TypeError('Expected a valid Date');
    return formatDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  // Perform day arithmetic on calendar fields. Local days can be 23 or 25 hours.
  function ordinal(key) {
    var parts = typeof key === 'string' && DATE_PATTERN.exec(key);
    if (!parts) return NaN;
    var year = Number(parts[1]), month = Number(parts[2]), day = Number(parts[3]);
    var midnight = new Date(0);
    midnight.setUTCFullYear(year, month - 1, day);
    if (year < 1 || midnight.getUTCFullYear() !== year || midnight.getUTCMonth() + 1 !== month || midnight.getUTCDate() !== day) return NaN;
    return midnight.getTime() / DAY_MS;
  }

  function shiftDay(key, n) {
    var start = ordinal(key);
    if (!isFinite(start) || !Number.isInteger(n)) throw new TypeError('Expected a calendar date and whole-day offset');
    var target = new Date((start + n) * DAY_MS);
    if (!validInstant(target)) throw new RangeError('Date outside diary range');
    return formatDay(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate());
  }

  function stamp(date) {
    if (!validInstant(date)) throw new TypeError('Expected a valid Date');
    return pad(date.getHours(), 2) + ':' + pad(date.getMinutes(), 2);
  }

  function makeEntry(date) {
    return { date: dayKey(date), time: stamp(date) };
  }

  function normalize(entries) {
    var byDate = Object.create(null);
    if (!Array.isArray(entries)) return [];
    entries.forEach(function (entry) {
      if (!entry || !isFinite(ordinal(entry.date)) || typeof entry.time !== 'string' || !TIME_PATTERN.test(entry.time)) return;
      // A retried check-in still represents the first recorded minute that day.
      if (!byDate[entry.date] || entry.time < byDate[entry.date].time) byDate[entry.date] = { date: entry.date, time: entry.time };
    });
    return Object.keys(byDate).sort().map(function (date) { return byDate[date]; });
  }

  function through(entries, today) {
    if (!isFinite(ordinal(today))) throw new TypeError('Expected a calendar date');
    return normalize(entries).filter(function (entry) { return entry.date <= today; });
  }

  function summarize(history, today) {
    var run = 0, best = 0, previous = -Infinity;
    history.forEach(function (entry) {
      var index = ordinal(entry.date);
      run = index === previous + 1 ? run + 1 : 1;
      best = Math.max(best, run);
      previous = index;
    });
    return { total: history.length, current: ordinal(today) - previous <= 1 ? run : 0, best: best };
  }

  function stats(entries, today) {
    return summarize(through(entries, today), today);
  }

  function reward(entriesAfter, today) {
    var history = through(entriesAfter, today);
    if (!history.length || history[history.length - 1].date !== today) return 'daily';
    if (history.length === 1) return 'first';
    var streak = summarize(history, today).current;
    if (streak === 1) return 'return';
    if (streak === 3) return 'three';
    if (streak % 7 === 0) return 'seven';
    return 'daily';
  }

  function windowDays(entries, endKey, n) {
    if (!Number.isInteger(n) || n < 0) throw new TypeError('Expected a nonnegative day count');
    var byDate = Object.create(null);
    through(entries, endKey).forEach(function (entry) { byDate[entry.date] = entry.time; });
    var days = [];
    for (var offset = 1 - n; offset <= 0; offset++) {
      var date = shiftDay(endKey, offset);
      var time = byDate[date] || null;
      var minutes = time === null ? null : Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
      days.push({ date: date, time: time, minutes: minutes });
    }
    return days;
  }

  return { dayKey: dayKey, shiftDay: shiftDay, stamp: stamp, makeEntry: makeEntry,
    normalize: normalize, stats: stats, reward: reward, windowDays: windowDays };
});
