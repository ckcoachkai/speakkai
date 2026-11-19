(function () {
  'use strict';

  const badges = [
    {kind: 'first', art: 'clap', name: '第一枚爪印', goal: '完成首次打卡'},
    {kind: 'three', art: 'trophy', name: '三连胜甜妹', goal: '连续打卡 3 天'},
    {kind: 'seven', art: 'crown', name: '七日公主冠', goal: '连续打卡 7 天'},
    {kind: 'return', art: 'heart', name: '重生之甜妹', goal: '断签后再次打卡'}
  ];
  const icon = (name, size) => window.DiaryIcons(name, size);
  const shortDate = date => Number(date.slice(5, 7)) + '月' + Number(date.slice(8, 10)) + '日';
  function weekday(date) {
    return '周' + '日一二三四五六'[new Date(date + 'T12:00:00Z').getUTCDay()];
  }

  function earned(entries, today) {
    const chronology = window.Diary.normalize(entries).filter(e => e.date <= today);
    const found = {};
    let last = null;
    let run = 0;
    for (const entry of chronology) {
      const contiguous = last && window.Diary.shiftDay(last, 1) === entry.date;
      run = contiguous ? run + 1 : 1;
      if (!last) found.first = entry.date;
      if (last && !contiguous && !found.return) found.return = entry.date;
      if (run === 3 && !found.three) found.three = entry.date;
      if (run === 7 && !found.seven) found.seven = entry.date;
      last = entry.date;
    }
    return found;
  }

  function stats({entries, today, offset = 0}) {
    const diary = window.Diary;
    const end = diary.shiftDay(today, -7 * offset);
    const days = diary.windowDays(entries, end, 7);
    const summary = diary.stats(entries, today);
    const recent = days.filter(day => day.time).reverse();
    const start = days[0].date;
    const range = shortDate(start) + ' — ' + shortDate(end);
    const previousExists = diary.normalize(entries).some(e => e.date < start);
    const summaryItems = [
      [summary.total, '累计打卡'], [summary.current, '当前连签'], [summary.best, '最长连签']
    ].map(([count, label]) => `<div class="pp-metric"><dt>${label}</dt><dd>${count}<span>天</span></dd></div>`).join('');
    const list = recent.map(entry => `<li><span class="pp-day-icon">${icon('paw-print', 17)}</span>
      <span class="pp-entry-date">${shortDate(entry.date)} <small>${weekday(entry.date)}</small></span>
      <time datetime="${entry.date}T${entry.time}">${icon('clock-3', 14)} ${entry.time}</time></li>`).join('');
    return `<div class="pp-page">
      <header class="pp-heading"><p class="section-kicker">SWEET DIARY · STATS</p><h1 class="pp-title">打卡统计</h1></header>
      <section class="paper pp-summary" aria-label="全部打卡统计"><dl>${summaryItems}</dl></section>
      <div class="pp-stats-layout">
        <section class="paper pp-panel">
          <div class="pp-section-head"><h2 class="section-title">打卡时间</h2><span class="pp-count">${recent.length} / 7 天</span></div>
          <div class="pp-week-nav">
            <button class="icon-btn pp-nav-btn" type="button" data-action="prev-week" aria-label="上一周" ${previousExists ? '' : 'disabled'}>${icon('chevron-left', 18)}</button>
            <span><b>${range}</b><small>${start.slice(0, 4) === end.slice(0, 4) ? end.slice(0, 4) : start.slice(0, 4) + ' — ' + end.slice(0, 4)}</small></span>
            <button class="icon-btn pp-nav-btn" type="button" data-action="next-week" aria-label="下一周" ${offset ? '' : 'disabled'}>${icon('chevron-right', 18)}</button>
          </div>
          <div id="time-chart"></div>
        </section>
        <section class="paper pp-panel"><div class="pp-section-head"><h2 class="section-title">打卡明细</h2>${icon('calendar-days', 20)}</div>
          ${recent.length ? `<ul class="pp-entry-list">${list}</ul>` : `<p class="pp-empty-copy">${summary.total ? '这七天没有留下爪印。' : '打下第一枚爪印，这里就会记下那一刻。'}</p>`}
        </section>
      </div>
    </div>`;
  }

  function medals({entries, today}) {
    const found = earned(entries, today);
    const count = Object.keys(found).length;
    const stickers = badges.map(badge => {
      const date = found[badge.kind];
      return `<button type="button" class="paper pp-badge pp-badge-${badge.kind}" data-action="view-reward" data-kind="${badge.kind}" data-earned="${Boolean(date)}" aria-label="${badge.name}，${date ? shortDate(date) + '获得，查看庆祝' : '待解锁，预览庆祝'}">
        <span class="pp-sticker-area"><img src="assets/${badge.art}.png" width="96" height="96" alt=""></span>
        <span class="pp-badge-text"><strong>${badge.name}</strong><small>${badge.goal}</small></span>
        <span class="pp-badge-status">${date ? icon('check', 13) + ' ' + shortDate(date) + '获得' : '待解锁'} ${icon('chevron-right', 13)}</span>
      </button>`;
    }).join('');
    return `<div class="pp-page">
      <header class="pp-heading"><p class="section-kicker">SWEET DIARY · AWARDS</p><h1 class="pp-title">甜妹徽章册</h1></header>
      <section class="paper pp-collection" aria-label="徽章收集进度">
        <span class="pp-collection-icon">${icon('crown', 27)}</span>
        <div><h2>我的收藏</h2><div class="pp-progress" aria-hidden="true">${badges.map(b => `<i class="${found[b.kind] ? 'filled' : ''}"></i>`).join('')}</div></div>
        <p><strong>${count}</strong> / 4 枚</p>
      </section>
      <div class="pp-badges">${stickers}</div>
    </div>`;
  }

  window.DiaryPages = {stats, medals, earned};
})();
