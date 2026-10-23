const STYLE_URL = new URL('./race3d-ui.css', import.meta.url).href;

function ensureStyles() {
  if (document.querySelector('link[data-race3d-ui-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_URL;
  link.dataset.race3dUiStyle = '';
  document.head.appendChild(link);
}

function getId(value, index) {
  if (value == null || typeof value !== 'object') return String(value ?? index);
  return String(value?.id ?? value?.player?.id ?? value?.name ?? value?.player?.name ?? index);
}

function getName(value, fallback = 'Racer') {
  if (typeof value === 'string') return value;
  return String(value?.name ?? value?.player?.name ?? fallback);
}

function getColor(value, fallback = '#7bd8c9') {
  if (value == null || typeof value !== 'object') return fallback;
  return value?.color ?? value?.player?.color ?? fallback;
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Create the race3d overlay. The renderer may add `screen: {x, y, visible}` to
 * each car to show its name above the projected car position.
 */
export function createRaceUI(container, players = [], options = {}) {
  ensureStyles();
  const racers = Array.from(players, (player, index) => ({
    id: getId(player, index),
    name: getName(player),
    color: getColor(player, ['#7bd8c9', '#f8c75a', '#ff735e', '#aeb8ee'][index % 4]),
  }));
  const root = make('section', 'race3d-hud');
  root.setAttribute('aria-label', 'Race controls and live standings');

  const stats = make('div', 'race3d-stats');
  stats.setAttribute('aria-label', 'Live race statistics');
  const makeStat = (key, title, value) => {
    const item = make('div', `race3d-stat race3d-stat-${key}`);
    item.append(make('span', 'race3d-stat-label', title), make('strong', 'race3d-stat-value', value));
    return { item, value: item.querySelector('.race3d-stat-value') };
  };
  const lap = makeStat('lap', 'LAP', `1 / ${options.laps ?? 2}`);
  const speed = makeStat('speed', 'SPEED', '0');
  const position = makeStat('position', 'POSITION', `1 / ${racers.length || 1}`);
  stats.append(lap.item, speed.item, position.item);

  const standings = make('details', 'race3d-standings');
  const summary = make('summary', 'race3d-standings-summary');
  const summaryCopy = make('span', 'race3d-standings-copy');
  summaryCopy.append(make('strong', '', 'STANDINGS'), make('span', 'race3d-leader-summary', 'Grid ready'));
  summary.append(make('span', 'race3d-summary-mark', '▤'), summaryCopy, make('span', 'race3d-chevron', '⌄'));
  standings.append(summary);
  const roster = make('ol', 'race3d-roster');
  roster.setAttribute('aria-label', 'Live racer positions');
  standings.append(roster);

  const camera = make('div', 'race3d-camera');
  camera.setAttribute('role', 'group');
  camera.setAttribute('aria-label', 'Choose the car to follow');
  const cameraTitle = make('span', 'race3d-camera-title', 'CHASE VIEW');
  const cameraName = make('span', 'race3d-camera-name', 'Leader');
  const prev = make('button', 'race3d-camera-button', '‹');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Follow the previous car');
  prev.title = 'Follow previous car';
  const next = make('button', 'race3d-camera-button', '›');
  next.type = 'button';
  next.setAttribute('aria-label', 'Follow the next car');
  next.title = 'Follow next car';
  const cameraActions = make('div', 'race3d-camera-actions');
  cameraActions.append(prev, next);
  const cameraInfo = make('div', 'race3d-camera-info');
  cameraInfo.append(cameraTitle, cameraName);
  camera.append(cameraInfo, cameraActions);

  const labelLayer = make('div', 'race3d-player-labels');
  labelLayer.setAttribute('aria-hidden', 'true');
  const labels = new Map();
  const status = make('div', 'race3d-sr-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  root.append(stats, standings, camera, labelLayer, status);
  container.appendChild(root);

  const rows = new Map();
  for (const racer of racers) {
    const row = make('li', 'race3d-roster-row');
    row.dataset.racerId = racer.id;
    const rank = make('span', 'race3d-roster-rank', '—');
    const swatch = make('span', 'race3d-roster-swatch');
    swatch.style.backgroundColor = racer.color;
    swatch.setAttribute('aria-hidden', 'true');
    const name = make('span', 'race3d-roster-name', racer.name);
    const detail = make('span', 'race3d-roster-detail', 'GRID');
    row.append(rank, swatch, name, detail);
    roster.appendChild(row);
    rows.set(racer.id, { row, rank, swatch, name, detail, racer });
  }

  let cameraIndex = 0;
  let currentPhase = 'idle';
  let winnerId = '';
  let lastBoardOrder = '';
  let boardAt = -Infinity;
  let disposed = false;
  let currentCars = [];
  const laps = Math.max(1, Number(options.laps) || 2);
  const announce = (message) => { status.textContent = message; };

  function orderedCars(cars) {
    return cars.slice().sort((a, b) => {
      const rankA = Number(a.position);
      const rankB = Number(b.position);
      if (Number.isFinite(rankA) && Number.isFinite(rankB) && rankA !== rankB) return rankA - rankB;
      return Number(b.distance || 0) - Number(a.distance || 0);
    });
  }

  function carId(car, index) { return getId(car, index); }

  function getLap(car) {
    const total = Number(options.totalLength ?? car?.totalLength);
    if (Number.isFinite(total) && total > 0) {
      const progress = Math.max(0, Number(car?.distance) || 0);
      return Math.min(laps, Math.floor(progress / total) + 1);
    }
    const given = Number(car?.lap);
    return Number.isFinite(given) ? Math.min(laps, Math.max(1, given + (given === 0 ? 1 : 0))) : 1;
  }

  function getSpeed(car) {
    const kmh = Number(car?.speedKmh);
    if (Number.isFinite(kmh)) return Math.max(0, kmh);
    const kph = Number(car?.speedKph);
    if (Number.isFinite(kph)) return Math.max(0, kph);
    const speedValue = Number(car?.speed ?? car?.velocity);
    if (!Number.isFinite(speedValue)) return 0;
    return Math.max(0, options.speedUnit === 'kmh' ? speedValue : speedValue * 3.6);
  }

  function updateLabels(cars, ranking) {
    const live = new Set();
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const screen = car.screen;
      const id = carId(car, i);
      if (!screen || screen.visible === false || !Number.isFinite(screen.x) || !Number.isFinite(screen.y)) continue;
      live.add(id);
      let label = labels.get(id);
      if (!label) {
        label = make('div', 'race3d-player-label');
        const dot = make('span', 'race3d-player-label-dot');
        const name = make('span', 'race3d-player-label-name');
        label.append(dot, name);
        labelLayer.appendChild(label);
        labels.set(id, { label, dot, name });
      }
      const racer = rows.get(id)?.racer;
      const name = getName(car, racer?.name || 'Racer');
      const rank = Number(car.position) || ranking.findIndex(item => carId(item, 0) === id) + 1;
      const color = getColor(car, racer?.color || '#7bd8c9');
      const entry = labels.get(id);
      entry.name.textContent = name;
      entry.dot.style.backgroundColor = color;
      entry.label.style.transform = `translate3d(${screen.x}px,${screen.y}px,0) translate(-50%,-115%)`;
      entry.label.dataset.rank = String(rank);
      entry.label.hidden = false;
    }
    for (const [id, entry] of labels) {
      if (!live.has(id)) entry.label.hidden = true;
    }
  }

  function update(cars = [], elapsed = 0, phase = 'idle') {
    if (disposed) return;
    currentCars = Array.isArray(cars) ? cars : [];
    const ranking = orderedCars(currentCars);
    const phaseChanged = phase !== currentPhase;
    if (phaseChanged) {
      currentPhase = phase;
      if (phase === 'countdown') announce('Race starting');
      else if (phase === 'running') announce('Race underway');
      else if (phase === 'finished') announce('Race finished');
      else if (phase === 'idle') announce('Race ready');
    }

    const now = Number(elapsed) || 0;
    if (now - boardAt >= 0.35 || phaseChanged) {
      const orderKey = ranking.map((car, index) => carId(car, index)).join('|');
      if (orderKey !== lastBoardOrder || now - boardAt >= 0.35) {
        lastBoardOrder = orderKey;
        for (let i = 0; i < ranking.length; i++) {
          const car = ranking[i];
          const id = carId(car, i);
          let entry = rows.get(id);
          if (!entry) {
            const racer = { id, name: getName(car), color: getColor(car) };
            const row = make('li', 'race3d-roster-row');
            row.dataset.racerId = id;
            const rank = make('span', 'race3d-roster-rank');
            const swatch = make('span', 'race3d-roster-swatch');
            swatch.setAttribute('aria-hidden', 'true');
            const name = make('span', 'race3d-roster-name');
            const detail = make('span', 'race3d-roster-detail');
            row.append(rank, swatch, name, detail);
            entry = { row, rank, swatch, name, detail, racer };
            rows.set(id, entry);
          }
          const rank = Number(car.position) || i + 1;
          entry.rank.textContent = String(rank).padStart(2, '0');
          entry.name.textContent = getName(car, entry.racer.name);
          entry.swatch.style.backgroundColor = getColor(car, entry.racer.color);
          const progress = Number(options.totalLength ?? car.totalLength) > 0
            ? `${Math.min(100, Math.max(0, (Number(car.distance) || 0) / Number(options.totalLength ?? car.totalLength) / laps * 100))}%`
            : '';
          entry.detail.textContent = phase === 'finished' && car.finished ? 'FIN' : `L${getLap(car)}`;
          entry.row.classList.toggle('is-winner', winnerId === id || (phase === 'finished' && !!car.finished));
          if (winnerId === id) entry.detail.textContent = 'WIN';
          entry.row.style.setProperty('--race-progress', progress);
          roster.appendChild(entry.row);
        }
        const leader = ranking[0];
        summary.querySelector('.race3d-leader-summary').textContent = leader ? `P1 · ${getName(leader)}` : 'Grid ready';
        boardAt = now;
      }
    }

    if (ranking.length) cameraIndex = ((cameraIndex % ranking.length) + ranking.length) % ranking.length;
    const target = ranking[cameraIndex] || ranking[0];
    cameraName.textContent = target ? getName(target) : 'Leader';
    prev.disabled = ranking.length < 2;
    next.disabled = ranking.length < 2;
    if (target) {
      lap.value.textContent = `${getLap(target)} / ${laps}`;
      speed.value.textContent = String(Math.round(getSpeed(target)));
      speed.value.setAttribute('aria-label', `${Math.round(getSpeed(target))} kilometers per hour`);
      const rank = Number(target.position) || cameraIndex + 1;
      position.value.textContent = `${rank} / ${ranking.length}`;
    } else {
      lap.value.textContent = `1 / ${laps}`;
      speed.value.textContent = '0';
      position.value.textContent = `— / ${racers.length || 1}`;
    }
    stats.dataset.phase = phase;
    stats.dataset.elapsed = String(Math.max(0, now).toFixed(1));
    updateLabels(currentCars, ranking);
  }

  function moveCamera(direction) {
    if (currentCars.length < 2 || disposed) return;
    const ranking = orderedCars(currentCars);
    cameraIndex = (cameraIndex + direction + ranking.length) % ranking.length;
    const target = ranking[cameraIndex];
    options.onCamera?.(direction);
    if (target) announce(`Following ${getName(target)}`);
    update(currentCars, Number(stats.dataset.elapsed) || 0, currentPhase);
  }
  const onPrevious = () => moveCamera(-1);
  const onNext = () => moveCamera(1);
  prev.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  function setWinner(winner) {
    if (disposed || !winner) return;
    winnerId = String(winner.id ?? winner);
    const winnerCar = currentCars.find((car, index) => carId(car, index) === winnerId);
    const winnerName = getName(winnerCar || winner, rows.get(winnerId)?.racer.name || 'Racer');
    const row = rows.get(winnerId)?.row;
    if (row) {
      row.classList.add('is-winner');
      const detail = row.querySelector('.race3d-roster-detail');
      if (detail) detail.textContent = 'WIN';
    }
    announce(`${winnerName} wins the race`);
  }

  function reset() {
    cameraIndex = 0;
    lastBoardOrder = '';
    boardAt = -Infinity;
    currentPhase = 'idle';
    winnerId = '';
    announce('Race ready');
    standings.open = false;
    update([], 0, 'idle');
  }

  function destroy() {
    if (disposed) return;
    disposed = true;
    prev.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    root.remove();
    labels.clear();
    rows.clear();
  }

  return { update, setWinner, reset, destroy };
}

export default createRaceUI;
