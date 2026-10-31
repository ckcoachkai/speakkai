import {updateInventoryIcons} from './race3d-inventory-ui.js?v=20261031-dimensional';
import {addCarGuide} from "./race3d-car-guide.js?v=20261031-dimensional";
import { createRaceExtras } from './race3d-ui-extras.js?v=20261031-dimensional';


const STYLE_URL = new URL('./race3d-ui.css?v=20261031-dimensional', import.meta.url).href;
import {RACE_ROSTER_TYPES,getRacerIdentity} from './race3d-roster.js?v=20261027-midnight';

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
  const lap = makeStat('lap', 'LAP', `1 / ${options.laps ?? 5}`);
  const speed = makeStat('speed', 'SPEED', '0');
  const position = makeStat('position', 'POSITION', `1 / ${racers.length || 1}`);
  stats.append(lap.item, speed.item, position.item);
  const condition = make('div', 'race3d-condition');
  const conditionLabel = make('span', 'race3d-condition-label', 'CONDITION');
  const conditionMeter = make('span', 'race3d-condition-meter');
  conditionMeter.setAttribute('role', 'meter');
  conditionMeter.setAttribute('aria-label', 'Followed car condition');
  conditionMeter.setAttribute('aria-valuemin', '0'); conditionMeter.setAttribute('aria-valuemax', '100');
  const conditionFill = make('span', 'race3d-condition-fill'); conditionMeter.append(conditionFill);
  const conditionValue = make('strong', 'race3d-condition-value', '100%');
  const trickBonus = make('span', 'race3d-trick-bonus'); trickBonus.hidden = true;
  condition.append(conditionLabel, conditionMeter, conditionValue, trickBonus);
  const effectFeedback = make('div', 'race3d-effect-feedback');
  effectFeedback.hidden = true; effectFeedback.setAttribute('role', 'status');
  effectFeedback.setAttribute('aria-live', 'polite');
  stats.append(condition, effectFeedback);

  const standings = make('section', 'race3d-standings');
  standings.setAttribute('aria-label', 'All racers and finish times');
  const summary = make('div', 'race3d-standings-summary');
  const summaryCopy = make('span', 'race3d-standings-copy');
  summaryCopy.append(make('strong', '', 'STANDINGS'), make('span', 'race3d-leader-summary', 'Grid ready'));
  summary.append(make('span', 'race3d-summary-mark', '▤'), summaryCopy);
  standings.append(summary);
  const roster = make('ol', 'race3d-roster');
  roster.setAttribute('aria-label', 'Live racer positions');
  roster.tabIndex = 0;
  standings.append(roster);
  const continueButton = make('button', 'race3d-continue', 'Continue with first speaker');
  continueButton.type = 'button'; continueButton.hidden = true; standings.append(continueButton);

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
  const viewUp = make('button', 'race3d-camera-button', '↑');
  const viewDown = make('button', 'race3d-camera-button', '↓');
  viewUp.type = viewDown.type = 'button';
  viewUp.setAttribute('aria-label', 'View up toward overhead');
  viewDown.setAttribute('aria-label', 'View down toward first person');
  const onViewUp = () => options.onView?.(-1);
  const onViewDown = () => options.onView?.(1);
  viewUp.addEventListener('click', onViewUp); viewDown.addEventListener('click', onViewDown);
  cameraActions.append(prev, next, viewUp, viewDown);
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
  const map = make('div', 'race3d-minimap');
  map.setAttribute('aria-label', 'Track map and racer positions');
  map.append(make('strong', '', 'TRACK MAP'));
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 200 150'); map.append(svg);
  const control = make('label', 'race3d-lap-control', 'Laps ');
  const select = make('select', 'race3d-lap-select'); select.setAttribute('aria-label', 'Number of laps');
  for (const n of [1,3,5,10]) { const o = make('option', '', String(n)); o.value = String(n); select.append(o); }
  select.value = String(options.laps ?? 5); control.append(select); map.append(control);
  const graphics=make('label','race3d-lap-control','Graphics '),qualitySelect=make('select','race3d-lap-select');qualitySelect.setAttribute('aria-label','Graphics quality');
  for(const [value,label] of [['auto','Auto'],['low','Performance'],['medium','Balanced'],['high','Detailed']]){const o=make('option','',label);o.value=value;qualitySelect.append(o);}
  qualitySelect.value=options.qualityMode||'auto';graphics.append(qualitySelect);map.append(graphics);
  const destroyGuide=addCarGuide(root,map,options);
  let qualityMode=qualitySelect.value;
  const onQuality=()=>{const next=qualitySelect.value;if(qualitySelect.disabled||options.onQuality?.(next)===false)qualitySelect.value=qualityMode;else qualityMode=next;};
  qualitySelect.addEventListener('change',onQuality);
  const dots = new Map(); let projectMap;
  if (options.track) {
    const points = Array.from({length:201}, (_,i) => options.track.sampleTrack(i / 200 * options.track.totalLength).position);
    const xs = points.map(p => p.x), zs = points.map(p => p.z);
    const minX = Math.min(...xs), minZ = Math.min(...zs), dx = Math.max(...xs)-minX, dz = Math.max(...zs)-minZ;
    const scale = Math.min(176/(dx||1),126/(dz||1));
    projectMap = p => ({ x:(200-dx*scale)/2+(p.x-minX)*scale, y:(150-dz*scale)/2+(p.z-minZ)*scale });
    const path = document.createElementNS(ns,'path'); path.setAttribute('class','race3d-map-track');
    path.setAttribute('d', points.map((p,i) => { const q=projectMap(p); return `${i?'L':'M'}${q.x},${q.y}`; }).join(' ')+' Z'); svg.append(path);
    racers.forEach((r,i) => {
      const g=document.createElementNS(ns,'g'); g.dataset.racerId=r.id;
      const c=document.createElementNS(ns,'circle'); c.setAttribute('r','5'); c.setAttribute('fill',r.color);
      const t=document.createElementNS(ns,'text'); t.textContent=String(i+1); t.setAttribute('y','-7');
      const title=document.createElementNS(ns,'title'); title.textContent=`${i+1}. ${r.name}`;
      g.append(title,c,t); svg.append(g); dots.set(r.id,g);
    });
  }
  const countdown = make('div', 'race3d-countdown');
  countdown.hidden = true;
  countdown.setAttribute('role', 'status');
  countdown.setAttribute('aria-live', 'assertive');
  countdown.setAttribute('aria-atomic', 'true');
  root.append(stats, standings, camera, labelLayer, status, map, countdown);
  container.appendChild(root);
  const extras = createRaceExtras(root, players);

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
    const item=make('span','race3d-row-item');item.hidden=true;
    row.append(rank, swatch, name, detail,item);
    roster.appendChild(row);
    rows.set(racer.id, { row, rank, swatch, name, detail, racer,item });
  }

  let continued = false, timing = {}, finishKey = '';
  let cameraIndex = 0;
  let currentPhase = 'idle';
  let winnerId = null;
  let lastBoardOrder = '';
  let boardAt = -Infinity;
  let disposed = false;
  let currentCars = [];
  let mapFocusId;
  let laps = Math.max(1, Number(options.laps) || 5);
  const announce = (message) => { status.textContent = message; };
  let feedbackUntil = 0, feedbackCar = null, lastConditionId = null;
  const effectState = new Map(), seenEffectEvents = new Set();
  function updateCondition(target, events = []) {
    const wallNow = performance.now();
    const id = target ? carId(target, 0) : null;
    const damage = Math.min(1, Math.max(0, Number(target?.damage) || 0));
    // Use the simulation's health value, including its 1 HP floor before
    // replacement. Rounding damage alone can show a premature 0%.
    const percent = Number.isFinite(target?.hitPoints)
      ? Math.round(Math.min(100, Math.max(0, target.hitPoints)))
      : damage === 1 ? 0 : Math.max(1, Math.round((1 - damage) * 100));
    conditionValue.textContent = `${percent}%`;
    conditionMeter.setAttribute('aria-valuenow', String(percent));
    conditionMeter.setAttribute('aria-label', `${target ? getName(target) : 'Car'} condition`);
    conditionFill.style.width = `${percent}%`;
    condition.dataset.level = percent < 40 ? 'low' : percent < 75 ? 'worn' : 'good';
    condition.dataset.repairing = String(Number(target?.repairRemaining) > 0);
    const bonus = Math.max(0, Number(target?.trickSpeedBonus) || 0) * 3.6;
    trickBonus.hidden = bonus < 0.05;
    trickBonus.textContent = `+${Math.round(bonus)} km/h`;
    trickBonus.title = 'Speed earned from completed flips';
    let message = '';
    for (const event of events) {
      if (!['repair', 'trick-complete'].includes(event.type)) continue;
      const key = `${event.type}:${event.carId}:${event.time}:${event.rampId ?? ''}`;
      if (seenEffectEvents.has(key)) continue;
      seenEffectEvents.add(key);
      if (String(event.carId) !== id) continue;
      if (event.type === 'repair') {
        const restored = Math.round(Math.max(0, Number(event.restoredSpeed) || 0) * 3.6);
        message = `Repaired · ${Math.round((1 - Math.min(1, Math.max(0, Number(event.afterDamage) || 0))) * 100)}%${restored ? ` · +${restored} km/h` : ''}`;
      } else {
        const flips = Math.max(0, Math.floor(Number(event.fullFlips) || 0));
        if (flips) message = `${flips}× flip landed · +${Math.round(Math.max(0, Number(event.bonusAdded) || 0) * 3.6)} km/h`;
      }
    }
    // Keep feedback useful for callers that only provide car snapshots.
    const previous = effectState.get(id);
    if (!message && previous && target && lastConditionId === id) {
      if (Number(target.repairRemaining) > previous.repairRemaining + 0.1) message = `Repaired · ${percent}%`;
      else if (Number(target.completedFlips) > previous.completedFlips) message = `${Number(target.completedFlips) - previous.completedFlips}× flip landed · +${Math.round(Math.max(0, bonus - previous.bonus))} km/h`;
    }
    if (message) {
      effectFeedback.textContent = message; feedbackUntil = wallNow + 2600; feedbackCar = id;
    }
    effectFeedback.hidden = !target || feedbackCar !== id || wallNow >= feedbackUntil;
    if (seenEffectEvents.size > 240) seenEffectEvents.delete(seenEffectEvents.values().next().value);
    if (target) effectState.set(id, { repairRemaining: Number(target.repairRemaining) || 0, completedFlips: Number(target.completedFlips) || 0, bonus });
    lastConditionId = id;
  }

  function orderedCars(cars) {
    return cars.slice().sort((a, b) => {
      if(a.eliminated!==b.eliminated)return a.eliminated?1:-1;
      if (Number.isFinite(a.finishTime) || Number.isFinite(b.finishTime)) {
        if (!Number.isFinite(a.finishTime)) return 1;
        if (!Number.isFinite(b.finishTime)) return -1;
        return a.finishTime - b.finishTime || (a.finishPosition || a.gridPosition || 0) - (b.finishPosition || b.gridPosition || 0);
      }
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
        label.dataset.racerId = id;
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
      if (currentPhase === 'selecting') {
        const progress = Math.max(0, Math.min(1, Number(timing.selectionProgress) || 0));
        const type = progress >= .72 && RACE_ROSTER_TYPES.includes(car.racerType) ? car.racerType : RACE_ROSTER_TYPES[(Math.floor(progress * 36) + i * 2) % RACE_ROSTER_TYPES.length];
        entry.name.textContent = `${name} · ${getRacerIdentity(type).vehicleName}`;
      } else entry.name.textContent = name;
      entry.dot.style.backgroundColor = color;
      entry.label.style.transform = `translate3d(${screen.x}px,${screen.y}px,0) translate(-50%,-115%)`;
      entry.label.dataset.rank = String(rank);
      entry.label.hidden = false;
    }
    for (const [id, entry] of labels) {
      if (!live.has(id)) entry.label.hidden = true;
    }
  }

  function update(cars = [], elapsed = 0, phase = 'idle', focusedId, metadata) {
    if (disposed) return;
    if (metadata) timing = metadata;
    root.dataset.cameraMode=timing.cameraMode||'chase';
    const countdownText = timing.countdownStep == null ? '' : String(timing.countdownStep);
    const showCountdown = ['3', '2', '1', 'GO'].includes(countdownText);
    countdown.hidden = !showCountdown;
    if (countdown.textContent !== (showCountdown ? countdownText : '')) countdown.textContent = showCountdown ? countdownText : '';
    countdown.dataset.step = showCountdown ? countdownText : '';
    cameraTitle.textContent = ({overhead:'OVERHEAD',chase:'CHASE VIEW','first-person':'FIRST PERSON'})[timing.cameraMode] || 'CHASE VIEW';
    viewUp.disabled = timing.cameraMode === 'overhead';
    viewDown.disabled = timing.cameraMode === 'first-person';
    if (focusedId !== undefined) mapFocusId = focusedId;
    select.disabled = ['selecting','countdown','running','finishing','finished'].includes(phase);
    qualitySelect.disabled=phase!=='idle';
    if (winnerId !== null) {
      const allFinished = timing.allFinished === true || (cars.length > 0 && cars.every(car => Number.isFinite(car.finishTime)));
      const celebrationReady=timing.finishCelebrationComplete!==false;continueButton.disabled=continued||!allFinished||!celebrationReady;
      continueButton.textContent=allFinished?(celebrationReady?'Continue with first speaker':'Finishing celebrations…'):'Waiting for all racers…';
    }
    currentCars = Array.isArray(cars) ? cars : [];
    if (projectMap) for (const car of currentCars) {
      const dot=dots.get(String(car.id)); if (!dot) continue;
      const s=options.track.sampleTrack(car.distance), lateral=Number(car.lateral)||0;
      const q=projectMap({x:s.position.x+s.right.x*lateral,z:s.position.z+s.right.z*lateral});
      dot.setAttribute('transform',`translate(${q.x},${q.y})`);
      dot.classList.toggle('is-focused',String(car.id)===String(mapFocusId));
      dot.setAttribute('aria-label',`${getName(car)}, position ${car.position||1}`);
    }
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
    const newFinishKey = ranking.map(c => c.finishTime ?? '').join('|');
    const finishesChanged = newFinishKey !== finishKey; finishKey = newFinishKey;
    const timeScale = Number(timing.timeScale) > 0 ? Number(timing.timeScale) : 1;
    const crossingTime = car => Number.isFinite(car.finishTimeReal) ? car.finishTimeReal : car.finishTime / timeScale;
    const clock = seconds => { const ms = Math.round(Math.max(0, seconds) * 1000); return Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0') + '.' + String(ms % 1000).padStart(3, '0'); };
    if (now - boardAt >= 0.1 || phaseChanged || finishesChanged) {
      const orderKey = ranking.map((car, index) => carId(car, index)).join('|');
      if (orderKey !== lastBoardOrder || now - boardAt >= 0.1 || phaseChanged || finishesChanged) {
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
          const rank = i + 1;
          entry.rank.textContent = String(rank).padStart(2, '0');
          entry.name.textContent = getName(car, entry.racer.name);
          entry.swatch.style.backgroundColor = getColor(car, entry.racer.color);
          const progress = Number(options.totalLength ?? car.totalLength) > 0
            ? `${Math.min(100, Math.max(0, (Number(car.distance) || 0) / Number(options.totalLength ?? car.totalLength) / laps * 100))}%`
            : '';
          const finished = Number.isFinite(car.finishTime), leaderTime = ranking[0]?.finishTime;
          const gap = finished && Number.isFinite(leaderTime) && i > 0 ? ' +' + Math.max(0, crossingTime(car) - crossingTime(ranking[0])).toFixed(3) + 's' : '';
          entry.detail.textContent = car.eliminated ? 'OUT · exploded' : finished ? clock(crossingTime(car)) + gap : clock(now) + ' · L' + getLap(car);
          entry.row.dataset.finished = String(finished);
          entry.row.setAttribute('aria-label', rank + '. ' + getName(car, entry.racer.name) + (finished ? ', finished in ' : ', elapsed ') + entry.detail.textContent + (winnerId === id ? ', winner and first speaker' : ''));
          entry.name.title = getName(car, entry.racer.name);
          entry.row.classList.toggle('is-winner', winnerId === id);
          if(!entry.item){entry.item=make('span','race3d-row-item');entry.row.append(entry.item);}
          updateInventoryIcons(entry.item,car);
          entry.row.style.setProperty('--race-progress', progress);
          // Keep stable rows attached: repeatedly appending the whole board
          // churns the DOM even when no racer has changed position.
          if (roster.children[i] !== entry.row) roster.insertBefore(entry.row, roster.children[i] || null);
        }
        const leader = ranking[0];
        summary.querySelector('.race3d-leader-summary').textContent = leader ? `${winnerId === carId(leader, 0) ? 'FIRST SPEAKER' : 'P1'} · ${getName(leader)}` : 'Grid ready';
        boardAt = now;
      }
    }

    if (ranking.length) cameraIndex = ((cameraIndex % ranking.length) + ranking.length) % ranking.length;
    const target = ranking.find((car, index) => carId(car, index) === String(mapFocusId)) || ranking[cameraIndex] || ranking[0];
    updateCondition(target, Array.isArray(metadata?.events) ? metadata.events : []);
    cameraName.textContent = target ? getName(target) : 'Leader';
    prev.disabled = ranking.length < 2;
    next.disabled = ranking.length < 2;
    if (target) {
      lap.value.textContent = `${getLap(target)} / ${laps}`;
      speed.value.textContent = String(Math.round(getSpeed(target)));
      speed.value.setAttribute('aria-label', `${Math.round(getSpeed(target))} kilometers per hour`);
      const rank = ranking.indexOf(target) + 1;
      position.value.textContent = `${rank} / ${ranking.length}`;
    } else {
      lap.value.textContent = `1 / ${laps}`;
      speed.value.textContent = '0';
      position.value.textContent = `— / ${racers.length || 1}`;
    }
    stats.dataset.phase = phase;
    stats.dataset.elapsed = String(Math.max(0, now).toFixed(1));
    updateLabels(currentCars, ranking);
    // Ownership changes cannot wait for the standings text refresh throttle.
    for(const car of currentCars){const entry=rows.get(carId(car,0));if(entry?.item&&!car.inventoryItem)entry.item.hidden=true;}
    extras.update(currentCars, target?.id, metadata || {}, phase);
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
  const onLaps = () => {
    const n=Number(select.value), old=laps;
    if (select.disabled || ![1,3,5,10].includes(n)) { select.value=String(laps); return; }
    laps=n; if (options.onLaps?.(n)===false) laps=old;
    select.value=String(laps); update(currentCars,0,currentPhase);
  };
  select.addEventListener('change',onLaps);
  const onPrevious = () => moveCamera(-1);
  const onNext = () => moveCamera(1);
  prev.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  function setWinner(winner) {
    if (disposed || !winner) return;
    if (winnerId !== null) return;
    winnerId = String(winner.id ?? winner);
    continueButton.hidden = false;
    continueButton.disabled = true;
    continueButton.textContent = 'Waiting for all racers…';
    boardAt = -Infinity;
    const winnerCar = currentCars.find((car, index) => carId(car, index) === winnerId);
    const winnerName = getName(winnerCar || winner, rows.get(winnerId)?.racer.name || 'Racer');
    const row = rows.get(winnerId)?.row;
    if (row) {
      row.classList.add('is-winner');
      row.dataset.firstSpeaker = 'true';
    }
    announce(`${winnerName} wins and is the first speaker. Other racers are still finishing.`);
  }

  const onContinue = () => { if (winnerId === null || continueButton.disabled || continued || disposed) return; continued = true; continueButton.disabled = true; options.onContinue?.(); };
  continueButton.addEventListener('click', onContinue);
  function reset() {
    extras.reset();
    effectState.clear(); seenEffectEvents.clear(); feedbackUntil = 0; feedbackCar = null; lastConditionId = null; effectFeedback.textContent = '';
    continued = false; timing = {}; finishKey = ''; continueButton.hidden = true; continueButton.disabled = false;
    cameraIndex = 0;
    lastBoardOrder = '';
    boardAt = -Infinity;
    currentPhase = 'idle';
    winnerId = null;
    mapFocusId = undefined;
    for (const entry of rows.values()) {
      entry.rank.textContent = '—'; entry.detail.textContent = 'GRID';
      entry.row.classList.remove('is-winner');
      delete entry.row.dataset.firstSpeaker; delete entry.row.dataset.finished;
      entry.row.removeAttribute('aria-label');
    }
    announce('Race ready');

    update([], 0, 'idle');
  }

  function destroy() {
    if (disposed) return;
    disposed = true;
    select.removeEventListener('change',onLaps);
    destroyGuide();qualitySelect.removeEventListener('change',onQuality);
    prev.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    continueButton.removeEventListener('click', onContinue);
    viewUp.removeEventListener('click', onViewUp); viewDown.removeEventListener('click', onViewDown);
    extras.destroy();
    root.remove();
    labels.clear();
    rows.clear();
  }

  return { update, setWinner, reset, destroy, extrasSnapshot: extras.snapshot };
}

export default createRaceUI;
