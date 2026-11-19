(function startSugarDiary() {
  'use strict';

  const entryPrefix = 'sugar-diary.v1.day.';
  const preferenceKey = 'sugar-diary.v1.sound';
  const screens = [
    ['today', 'heart', '今日打卡'],
    ['stats', 'chart-line', '打卡统计'],
    ['medals', 'crown', '徽章册']
  ];
  const foods = [
    ['tea', '没喝奶茶', '含糖奶茶、果茶'],
    ['cake', '没吃蛋糕', '蛋糕、甜点'],
    ['dessert', '没吃糖水', '糖水、甜汤']
  ];
  const badges = [
    ['first', 'clap', '首日击掌'], ['three', 'trophy', '三日胜利'],
    ['seven', 'crown', '七日皇冠'], ['return', 'heart', '甜妹重生']
  ];
  const main = document.querySelector('#content');
  const popup = document.querySelector('#popup');
  const soundButton = document.querySelector('.sound');
  const notice = document.querySelector('#notice');
  const icon = window.DiaryIcons;
  const model = window.Diary;
  const audio = new Audio();
  audio.preload = 'auto';
  let sound = true;
  let entries = [];
  let today = model.dayKey(new Date());
  let selected = new Set();
  let screen = screenFromHash();
  let offset = 0;
  let rewardKind = null;
  let confirmDate = '';
  let lastFocus = null;
  let toastTimer;
  let midnightTimer;
  let storageFailed = false;

  try {sound = localStorage.getItem(preferenceKey) !== 'off';} catch (_) {}
  function screenFromHash() {
    const id = location.hash.slice(1);
    return screens.some(item => item[0] === id) ? id : 'today';
  }
  function load() {
    try {
      const saved = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(entryPrefix)) saved.push({date:key.slice(entryPrefix.length),time:localStorage.getItem(key)});
      }
      entries = model.normalize(saved);
      storageFailed = false;
    } catch (_) {storageFailed = true;}
  }
  function toast(message) {
    notice.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {notice.textContent = '';}, 3500);
  }
  function todayEntry() {return entries.find(entry => entry.date === today);}
  function readDraft() {
    selected = new Set();
    try {
      const draft = JSON.parse(sessionStorage.getItem('sugar-diary.draft'));
      if (draft && draft.date === today && Array.isArray(draft.ids)) {
        selected = new Set(draft.ids.filter(id => foods.some(food => food[0] === id)));
      }
    } catch (_) {}
  }
  function saveDraft() {
    try {sessionStorage.setItem('sugar-diary.draft', JSON.stringify({date:today,ids:[...selected]}));} catch (_) {}
  }
  function updateSound() {
    soundButton.innerHTML = icon(sound ? 'volume-2' : 'volume-x',16) + `<span>音效${sound ? '开' : '关'}</span>`;
    soundButton.setAttribute('aria-pressed', String(sound));
    soundButton.setAttribute('aria-label',sound ? '关闭音效' : '开启音效');
  }
  function home() {
    const now = new Date(today + 'T12:00:00');
    const monday = model.shiftDay(today,-((now.getDay()+6)%7));
    const week = model.windowDays(entries,model.shiftDay(monday,6),7);
    const summary = model.stats(entries,today);
    const saved = todayEntry();
    const achieved = window.DiaryPages.earned(entries,today);
    const stampCells = week.map((item,idx) => {
      const isToday = item.date === today;
      return `<li class="week-day${isToday?' today':''}${item.time?' active':''}" aria-label="${item.date} ${item.time || '未打卡'}">
        <span class="week-stamp">${item.time ? icon('paw-print',19) : Number(item.date.slice(8))}</span><span>${isToday ? '今天' : '周'+'一二三四五六日'[idx]}</span></li>`;
    }).join('');
    const tasks = foods.map(([id,name,description]) => {
      const checked = Boolean(saved) || selected.has(id);
      return `<button type="button" class="task" role="checkbox" aria-checked="${checked}" aria-label="${name}" data-action="task" data-id="${id}" ${saved ? 'disabled' : ''}>
        <img class="food-icon" src="assets/${id}.png" alt=""><span class="task-copy"><strong class="task-name">${name}</strong><span class="task-sub">${description}</span></span>
        <span class="checkmark">${checked ? icon('check',15) : ''}</span></button>`;
    }).join('');
    const badgeLinks = badges.map(([kind,file,label]) => `<button class="mini-medal${achieved[kind] ? ' earned' : ''}" data-action="view-reward" data-kind="${kind}" aria-label="${label}，${achieved[kind]?'已解锁':'预览'}"><img src="assets/${file}.png" alt=""><small>${label}</small></button>`).join('');
    const dateLabel = `${now.getFullYear()}.${today.slice(5,7)}.${today.slice(8)}　星期${'日一二三四五六'[now.getDay()]}`;
    const quote = saved ? '爪印收到！今天的主角就是你喵！' : '今天的甜度，就交给可爱的你啦！';
    return `<div class="dateline"><strong>Daily Edition</strong><span class="rule"></span><span class="issue-date">${icon('calendar-days',14)} ${dateLabel}</span></div>
      <div class="home-grid">
        <section class="cover" aria-label="今日封面"><div class="cover-frame">
          <img class="cover-plate" src="assets/hero.jpg" alt="戴着爱心宝石皇冠的奶牛猫贝贝，睁着星星眼向你举起双爪">
          <div class="cover-veil"></div>
          <span class="cover-tag">${icon('star',12)} 本日封面</span>
          <div class="cover-copy"><h1><span class="cover-first">今天又是</span><span class="cover-main">控糖甜妹</span></h1><div class="cover-script" lang="en">Sweet Girl!</div></div>
          <span class="issue-no" aria-hidden="true">SUGAR DIARY ✦ ${today.slice(5).replace('-',' / ')}</span>
          <i class="starshine s1"></i><i class="starshine s2"></i><i class="starshine s3"></i>
        </div><div class="cat-quote"><b>贝贝说</b><span>${quote}</span></div></section>
        <section class="paper quest"><div class="section-headline"><div><div class="section-kicker">Daily Check-in</div><h2 class="section-title">今日控糖清单</h2></div><div class="count" aria-label="已勾选 ${saved?3:selected.size} 项"><b>${saved?3:selected.size}</b> / 3</div></div>
          <div class="todo-list">${tasks}</div><button class="primary" data-action="${saved?'today-reward':'request-check'}">${icon(saved?'party-popper':'paw-print',19)} ${saved ? `${saved.time} 已打卡 · 再听夸夸` : '盖下今日爪印'}</button>
        </section>
        <section class="paper week-card"><div class="section-headline"><div><div class="section-kicker">Weekly Streak</div><h2 class="section-title">本周爪印</h2></div><div class="streak-tag">${icon('flame',15)} 连续 <b>${summary.current}</b> 天</div></div><ol class="week-list">${stampCells}</ol></section>
        <section class="paper medal-card"><div class="section-headline"><div><div class="section-kicker">Sticker Club</div><h2 class="section-title">甜妹徽章册</h2></div><a class="text-link" href="#medals" aria-label="查看全部徽章">查看全部 ${icon('chevron-right',15)}</a></div><div class="medal-line">${badgeLinks}</div></section>
      </div><div class="footnote">${icon('heart',12)} 打卡记录保存在这台设备</div>`;
  }
  function draw() {
    for (const nav of document.querySelectorAll('nav')) {
      nav.innerHTML = screens.map(([id,glyph,label]) => `<a class="navlink" href="#${id}" ${id===screen?'aria-current="page"':''}>${icon(glyph,17)}<span>${label}</span></a>`).join('');
    }
    updateSound();
    const args = {entries,today,offset};
    if (screen === 'stats') {
      main.innerHTML = window.DiaryPages.stats(args);
      window.DiaryChart.render(main.querySelector('#time-chart'),model.windowDays(entries,model.shiftDay(today,-offset*7),7));
    } else if (screen === 'medals') main.innerHTML = window.DiaryPages.medals(args);
    else main.innerHTML = home();
  }
  function playSound(kind) {
    if (!sound) return;
    audio.pause();
    audio.src = 'assets/' + kind + '.mp3';
    try {
      const handled = audio.play();
      if (handled) handled.catch(() => {});
    } catch (_) {}
  }
  function stopCelebration() {
    window.DiaryEffects.stop();
    audio.pause();
  }
  function closePopup() {if (popup.open) popup.close();}
  function show(markup) {
    if (!popup.open) lastFocus = document.activeElement;
    popup.innerHTML = markup;
    if (!popup.open) popup.showModal();
    popup.querySelector('.dg-main')?.focus({preventScroll:true});
  }
  function celebrate(kind,preview) {
    rewardKind = kind;
    confirmDate = '';
    const earned = window.DiaryPages.earned(entries,today);
    show(window.DiaryDialog.reward(kind,{preview,unlocked:Boolean(earned[kind])}));
    playSound(kind);
    window.DiaryEffects.play(kind,popup.querySelector('#reward-fx'));
  }
  function refreshDay() {
    const next = model.dayKey(new Date());
    if (next !== today) {
      today = next;
      offset = 0;
      closePopup();
      readDraft();
      load();
      draw();
      return true;
    }
    return false;
  }
  function planMidnight() {
    clearTimeout(midnightTimer);
    const next = new Date();
    next.setHours(24,0,0,30);
    midnightTimer = setTimeout(() => {refreshDay();planMidnight();},Math.max(40,next.getTime()-Date.now()));
  }
  function checkIn() {
    const now = new Date();
    if (!confirmDate || confirmDate !== model.dayKey(now) || selected.size !== foods.length) {
      refreshDay(); closePopup(); return;
    }
    load();
    if (storageFailed) {closePopup();toast('无法读取本机记录，请允许浏览器保存网站数据。');return;}
    let saved = todayEntry();
    if (saved) {closePopup();draw();toast('今天的爪印已经盖好啦。');return;}
    saved = model.makeEntry(now);
    try {localStorage.setItem(entryPrefix + saved.date,saved.time);}
    catch (_) {closePopup();toast('本次保存失败，请检查浏览器储存空间后重试。');return;}
    entries = model.normalize([...entries,saved]);
    draw(); celebrate(model.reward(entries,today),false);
  }

  document.addEventListener('click',event => {
    const el = event.target.closest('[data-action]');
    if (!el || el.disabled) return;
    if (refreshDay()) {toast('新的一天开始啦，请重新确认今天的清单。');return;}
    const action = el.dataset.action;
    switch (action) {
      case 'sound':
        sound = !sound;
        if (!sound) audio.pause();
        try {localStorage.setItem(preferenceKey,sound ? 'on' : 'off');} catch (_) {}
        updateSound(); break;
      case 'task': {
        const id = el.dataset.id;
        if (todayEntry()) break;
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        saveDraft();
        el.setAttribute('aria-checked',String(selected.has(id)));
        el.querySelector('.checkmark').innerHTML = selected.has(id) ? icon('check',15) : '';
        const count = main.querySelector('.count');
        count.querySelector('b').textContent = selected.size;
        count.setAttribute('aria-label','已勾选 '+selected.size+' 项');
        break;
      }
      case 'request-check':
        if (storageFailed) {load();if (storageFailed) {toast('请开启浏览器的网站数据储存，再来盖爪印。');break;}}
        if (selected.size < foods.length) {
          toast('先勾选今天做到的三件事，再盖爪印喵！');
          main.querySelector('[aria-checked=false]')?.focus({preventScroll:true}); break;
        }
        confirmDate = today; rewardKind = null; show(window.DiaryDialog.confirm()); break;
      case 'confirm': checkIn(); break;
      case 'cancel': closePopup(); break;
      case 'view-reward': celebrate(el.dataset.kind,true); break;
      case 'today-reward': celebrate(model.reward(entries,today),false); break;
      case 'replay': if (rewardKind) {playSound(rewardKind);window.DiaryEffects.play(rewardKind,popup.querySelector('#reward-fx'));} break;
      case 'prev-week': offset++; draw(); break;
      case 'next-week': offset=Math.max(0,offset-1); draw(); break;
    }
  });
  popup.addEventListener('close',() => {
    if (popup.open) return;
    confirmDate = '';rewardKind = null;stopCelebration();
    const target = lastFocus?.isConnected ? lastFocus : main.querySelector('[data-action="today-reward"]');
    target?.focus({preventScroll:true});
  });
  popup.addEventListener('click',e => {
    if (e.target !== popup) return;
    const b = popup.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) closePopup();
  });
  window.addEventListener('hashchange',() => {
    screen = screenFromHash();offset = 0;closePopup();refreshDay();draw();window.scrollTo(0,0);
  });
  window.addEventListener('storage',e => {
    if (e.key === preferenceKey) {sound=e.newValue!=='off';if(!sound) audio.pause();updateSound();}
    else if (!e.key || e.key.startsWith(entryPrefix)) {load();draw();}
  });
  function onResume() {
    if (!document.hidden) {refreshDay();load();draw();planMidnight();}
    else stopCelebration();
  }
  window.addEventListener('pageshow',onResume);
  document.addEventListener('visibilitychange',onResume);
  load();readDraft();draw();planMidnight();
  if (window.isSecureContext && /^https?:$/.test(location.protocol) && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
