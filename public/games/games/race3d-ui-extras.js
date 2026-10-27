import { RACER_CARD_NAMES, racerThumbnail, ITEM_VISUALS, itemThumbnail } from './race3d-ui-catalog.js?v=20261027-midnight';
import { inventoryFace } from './race3d-item-rules.js?v=20261027-midnight';
import {RACE_ROSTER_TYPES,getRacerIdentity} from './race3d-roster.js?v=20261027-midnight';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Small, bounded DOM overlays. This never changes the simulation or chooses winners. */
export function createRaceExtras(root, players = []) {
  const left = make('section', 'race3d-cards race3d-cards-left');
  const right = make('section', 'race3d-cards race3d-cards-right');
  left.setAttribute('aria-label', 'Racer cards, first group');
  right.setAttribute('aria-label', 'Racer cards, second group');
  const cards = new Map(), roster = new Map(players.map((p, i) => [String(p.id ?? i), p]));
  const roulette = make('div', 'race3d-roulette'); roulette.hidden = true;
  const rouletteOwner = make('span', 'race3d-roulette-owner');
  const rouletteCube = make('span', 'race3d-roulette-cube');
  const rouletteIcon = make('span', 'race3d-roulette-icon'); rouletteCube.append(rouletteIcon);
  const rouletteName = make('strong', 'race3d-roulette-name');
  const rouletteTimer = make('span', 'race3d-roulette-timer');
  roulette.append(rouletteOwner, rouletteCube, rouletteName, rouletteTimer);
  const effects = make('div', 'race3d-active-effects'); effects.hidden = true;
  effects.setAttribute('aria-label', 'Active power-up effects');
  const compact = make('section', 'race3d-focus-specs'); compact.setAttribute('aria-label', 'Followed car specifications');
  const selection = make('section', 'race3d-selection'); selection.hidden = true;
  selection.setAttribute('aria-label', 'Random car selection');
  const selectionTitle = make('strong', 'race3d-selection-title', 'YOUR CAR IS…');
  const selectionList = make('div', 'race3d-selection-list');
  selection.append(selectionTitle, selectionList);
  const selectionCards = new Map();
  const finish = make('div', 'race3d-finish-splash'); finish.hidden = true;
  finish.setAttribute('role', 'status'); finish.setAttribute('aria-live', 'polite');
  const finishBurst = make('div', 'race3d-finish-confetti'); finishBurst.setAttribute('aria-hidden', 'true');
  const finishRank = make('strong', 'race3d-finish-rank');
  const finishName = make('span', 'race3d-finish-name');
  const finishCaption = make('span', 'race3d-finish-caption');
  finish.append(finishBurst, finishRank, finishName, finishCaption);
  root.append(left, right, compact, roulette, effects, selection, finish);
  let disposed = false, lastCardsAt = -Infinity, lastLayoutAt = -Infinity, shownItemKey = '';
  let finishTimer = 0, activeFinish = false, visibleFinish = null, finishSequence = 0;
  const finishQueue = [], seenFinish = new Set();
  let effectKey = '', previousPhase = '';

  function cardFor(id, car, index) {
    let entry = cards.get(id);
    if (entry) return entry;
    const card = make('article', 'race3d-racer-card'); card.dataset.racerId = id;
    const head = make('div', 'race3d-card-head');
    const rank = make('span', 'race3d-card-rank');
    const player = make('strong', 'race3d-card-player');
    const item = make('span', 'race3d-card-item'); item.hidden = true;
    head.append(rank, player, item);
    const vehicle = make('div', 'race3d-card-vehicle');
    const thumb = make('span', 'race3d-card-thumb');
    const model = make('span', 'race3d-card-model'); vehicle.append(thumb, model);
    const engine = make('span', 'race3d-card-engine');
    const label = make('span', 'race3d-card-attributes-label', 'GAME SPECS · * SOURCED');
    const attributes = make('dl', 'race3d-card-attributes');
    const fields = ['Mass', 'Engine power', 'Torque', 'Top speed', '0–100 est.', 'Braking', 'Tire grip', 'Drag Cd', 'Downforce Cᴸ'];
    const values = fields.map(title => {
      const pair = make('div', 'race3d-card-attribute');
      const value = make('dd', ''); pair.append(make('dt', '', title), value); attributes.append(pair); return value;
    });
    const priority = make('p', 'race3d-card-priority');
    const provenance = make('details', 'race3d-card-provenance');
    provenance.append(make('summary', '', 'Spec notes & sources'));
    const notes = make('p', ''); const sources = make('div', 'race3d-card-sources'); provenance.append(notes, sources);
    card.append(head, vehicle, engine, label, attributes, priority, provenance);
    (index % 2 ? right : left).append(card);
    entry = { card, rank, player, thumb, model, engine, label, values, priority, provenance, notes, sources, item, type: null, icon: null };
    cards.set(id, entry);
    return entry;
  }

  function updateCards(cars, focusedId, now, simulationTime) {
    if (now - lastCardsAt < 160) return;
    lastCardsAt = now;
    const sources = cars.length ? cars : [...roster.values()];
    // Keep each card's initial side and DOM order stable while rank changes.
    sources.forEach((raw, index) => {
      const id = String(raw.id ?? index), car = { ...roster.get(id), ...raw };
      const requestedType = car.racerType || car.assetId;
      const type = RACE_ROSTER_TYPES.includes(requestedType) ? requestedType : RACE_ROSTER_TYPES[index % RACE_ROSTER_TYPES.length];
      const identity = getRacerIdentity(type), spec = RACE_ROSTER_TYPES.includes(requestedType) ? car.vehicleSpec || identity.vehicleSpec : identity.vehicleSpec;
      const entry = cardFor(id, car, index);
      entry.player.textContent = String(car.name ?? 'Racer');
      entry.player.title = entry.player.textContent;
      entry.rank.textContent = Number.isFinite(car.finishPosition) ? `#${car.finishPosition}` : `P${car.position || index + 1}`;
      entry.card.classList.toggle('is-focused', id === String(focusedId));
      entry.card.classList.toggle('is-finished', Number.isFinite(car.finishTime));
      entry.card.style.setProperty('--racer-color', String(car.color || '#7bd8c9'));
      if (entry.type !== type) {
        entry.type = type; entry.thumb.innerHTML = racerThumbnail(type);
        entry.card.dataset.racerType = type;
      }
      entry.model.textContent = RACER_CARD_NAMES[type];
      entry.model.title = entry.model.textContent;
      const engines = { 'v6-hybrid':'V6 hybrid', v6:'V6', i4:'Turbo inline-four', v8:'V8', v10:'V10', v12:'V12', electric:'Electric' };
      const basis = car.specBasis || identity.specBasis;
      const sourced = new Set(basis?.referenceFields || []);
      const mark = (key, text) => text + (sourced.has(key) ? '*' : '');
      entry.engine.textContent = mark('engineType', engines[spec.engineType] || 'Race engine');
      const estimate = Math.max(27.778 / (finite(spec.tireGrip, 1) * 9.81), .5 * finite(spec.massKg, 1500) * 27.778 ** 2 / (finite(spec.powerKW, 400) * 1000 * .65)) + .4;
      const values = [mark('massKg', `${Math.round(spec.massKg).toLocaleString()} kg`),
        mark('powerKW', `${Math.round(spec.powerKW)} kW`), mark('torqueNm', `${Math.round(spec.torqueNm)} Nm`),
        mark('topSpeedKph', `${Math.round(spec.topSpeedKph)} km/h`), `≈${estimate.toFixed(1)} s`,
        mark('brakeDecelMps2', `${finite(spec.brakeDecelMps2).toFixed(1)} m/s²`),
        mark('tireGrip', `${finite(spec.tireGrip).toFixed(2)} μ`),
        mark('dragCoefficient', finite(spec.dragCoefficient).toFixed(2)),
        mark('downforceCoefficient', finite(spec.downforceCoefficient).toFixed(2))];
      entry.values.forEach((node, i) => { if (node.textContent !== values[i]) node.textContent = values[i]; });
      entry.priority.textContent = `Focus: ${{corners:'corner speed',grip:'grip & endurance',speed:'straight-line speed',balanced:'balanced pace',launch:'electric acceleration'}[spec.priority] || spec.priority} · ramps ${Math.round(finite(spec.rampPreference) * 100)}%`;
      entry.notes.textContent = `${basis?.notes || 'Simulation values.'} 0–100 is a game estimate from power, operating mass and grip, not a measured road-test time. μ = tire grip; Cd = drag coefficient; Cᴸ = downforce coefficient.`;
      if(car.driverSkills){entry.priority.textContent+=' · Driver: '+car.driverSkills.label;entry.priority.title='Fictional skills drawn anew each race, not a student assessment. Reaction '+Math.round(car.driverSkills.reaction*100)+'; control '+Math.round(car.driverSkills.control*100)+'; braking '+Math.round(car.driverSkills.braking*100)+'; ramp '+Math.round(car.driverSkills.ramp*100)+'; items '+Math.round(car.driverSkills.items*100)+'.';entry.notes.textContent+=' '+entry.priority.title;}
      if (entry.sourceType !== type) {
        entry.sourceType = type; entry.sources.replaceChildren();
        for (const source of (car.sources || identity.sources || [])) {
          if (!/^https:\/\//.test(source.url)) continue;
          const link = make('a', '', source.title); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.title = source.notes || ''; entry.sources.append(link);
        }
      }
      entry.card.dataset.damageLevel = String(clamp(Math.floor(finite(car.damageLevel, finite(car.damage) * 20)), 0, 20));
      const item = inventoryFace(car,simulationTime);
      entry.item.hidden = !ITEM_VISUALS[item];
      entry.item.dataset.phase=car.inventoryPhase||'empty';
      entry.item.setAttribute('aria-label',car.inventoryPhase==='rolling'?'Choosing an item':ITEM_VISUALS[item]?.[0]||'No held item');
      if (entry.icon !== item) { entry.icon = item; entry.item.innerHTML = itemThumbnail(item); entry.item.title = ITEM_VISUALS[item]?.[0] || ''; }
    });
    left.hidden = !left.children.length; right.hidden = !right.children.length;
    const focusEntry = cards.get(String(focusedId)) || cards.values().next().value;
    if (focusEntry) {
      const key = `${focusedId}:${focusEntry.type}`;
      if (compact.dataset.key !== key) {
        const copy = focusEntry.card.cloneNode(true); copy.removeAttribute('data-racer-id');
        compact.replaceChildren(copy); compact.dataset.key = key;
      }
      compact.querySelector('.race3d-card-rank').textContent = focusEntry.rank.textContent;
    }

  }

  function layout(now, force = false) {
    if (!force && now - lastLayoutAt < 500) return;
    lastLayoutAt = now;
    const map = root.querySelector('.race3d-minimap'), board = root.querySelector('.race3d-standings');
    const leftTop = map ? map.offsetTop + map.offsetHeight + 12 : 160;
    const rightTop = board ? board.offsetTop + board.offsetHeight + 12 : 160;
    left.style.setProperty('--rail-top', `${leftTop}px`);
    right.style.setProperty('--rail-top', `${rightTop}px`);
    root.style.setProperty('--focus-top', `${Math.max(leftTop,rightTop)}px`);
  }

  function updateRoulette(focusedId, cars, now, simulationTime) {
    const target=cars.find(c=>String(c.id)===String(focusedId))||cars[0];
    if(target?.inventoryItem){
      const item=inventoryFace(target,simulationTime),rolling=target.inventoryPhase==='rolling';
      const key=`${target.id}:${target.inventorySerial}:${item}:${rolling}`;
      roulette.hidden=false;
      if(shownItemKey!==key){shownItemKey=key;rouletteOwner.textContent=String(target.name||'Racer');rouletteIcon.innerHTML=itemThumbnail(item);rouletteName.textContent=rolling?'PRISM DRAW':ITEM_VISUALS[item]?.[0]||'Ready';roulette.dataset.rolling=String(rolling);roulette.dataset.item=rolling?'choosing':item;}
      return;
    }
    roulette.hidden=true;shownItemKey='';
  }

  function updateEffects(focusedId, cars, timeScale = 5) {
    const car = cars.find(car => String(car.id) === String(focusedId)) || cars[0];
    const active = [];
    if (car) {
      for (const [item, field] of [['boost','boost'],['rocket','rocketRemaining'],['shield','shieldRemaining'],['repair','repairRemaining'],['freeze','freezeRemaining'],['launch','flightRemaining']]) {
        if(item==='freeze'&&car.attackSlowRemaining>0)continue;
        if (item === 'launch' && (car.flightKind === 'ramp'||car.flightKind==='hop'&&car.hopSource!=='launch')) continue;
        const remaining = finite(car[field]);
        if (remaining > .01) active.push([item, remaining / timeScale]);
      }
      if(car.attackSlowRemaining>0&&ITEM_VISUALS[car.attackSource])active.push([car.attackSource,car.attackSlowRemaining/timeScale,'Disrupted']);
      for(const [field,remaining]of Object.entries(car.itemEffects||{})){const item={padBoost:'strip',padBrake:'inverter',foamSlow:'foam',pickupBlock:'decoy',slingRelease:'slingshot',capRelease:'capacitor',theftImmune:'theft'}[field]||field;if(remaining>.01&&ITEM_VISUALS[item])active.push([item,remaining/timeScale,['emp','jammer','oil','padBrake','foamSlow','pickupBlock'].includes(field)?'Disrupted · '+ITEM_VISUALS[item][0]:'Active · '+ITEM_VISUALS[item][0]]);}
      if(car.itemCharge)active.push(['charge',car.itemCharge.fuse/timeScale,'Attached charge']);
    }
    const nextKey = active.map(([type, seconds]) => `${type}:${seconds.toFixed(1)}`).join('|');
    if (nextKey === effectKey) return;
    effectKey = nextKey; effects.hidden = !active.length; effects.replaceChildren();
    for (const [item, seconds, label] of active) {
      const pill = make('span', 'race3d-effect-pill');
      const icon = make('span', 'race3d-effect-icon'); icon.innerHTML = itemThumbnail(item);
      pill.append(icon,make('strong','',label||ITEM_VISUALS[item][0]),make('span','',`${seconds.toFixed(1)}s`));effects.append(pill);
    }
  }

  function updateSelection(cars, metadata, phase) {
    selection.hidden = phase !== 'selecting';
    if (selection.hidden) return;
    const progress = clamp(finite(metadata.selectionProgress), 0, 1), locked = progress >= .72;
    selection.dataset.locked = String(locked);
    selectionTitle.textContent = metadata.selectionLoading ? 'GETTING YOUR CARS READY…' : locked ? 'CARS LOCKED IN!' : 'YOUR CAR IS…';
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i], id = String(car.id ?? i);
      let entry = selectionCards.get(id);
      if (!entry) {
        const node = make('div', 'race3d-selection-card'), owner = make('strong', 'race3d-selection-owner');
        const icon = make('span', 'race3d-selection-icon'), name = make('span', 'race3d-selection-model');
        node.append(owner, icon, name); selectionList.append(node); entry = {node,owner,icon,name}; selectionCards.set(id,entry);
      }
      const finalType = RACE_ROSTER_TYPES.includes(car.racerType) ? car.racerType : RACE_ROSTER_TYPES[i % RACE_ROSTER_TYPES.length];
      const type = locked ? finalType : RACE_ROSTER_TYPES[(Math.floor(progress * 36) + i * 2) % RACE_ROSTER_TYPES.length];
      entry.owner.textContent = String(car.name || 'Racer');
      entry.node.style.setProperty('--racer-color', car.color || '#a9eadc');
      if (entry.type !== type) { entry.type = type; entry.icon.innerHTML = racerThumbnail(type); entry.name.textContent = RACER_CARD_NAMES[type]; }
      entry.node.dataset.locked = String(locked);
    }
  }

  function nextFinish() {
    if (disposed || activeFinish || !finishQueue.length) return;
    const result = finishQueue.shift(); activeFinish = true; visibleFinish = result;
    finishSequence++;
    finishRank.textContent = String(result.place);
    finishName.textContent = result.name;
    finishCaption.textContent = result.place === 1 ? 'FIRST SPEAKER' : 'FINISHED';
    finish.dataset.place = String(result.place); finish.dataset.sequence = String(finishSequence);
    finishBurst.replaceChildren();
    const colors = ['#f8d164','#8ee5d2','#f78f82','#b5b4ff','#eaf1fb'];
    for (let i = 0; i < 28; i++) {
      const piece = make('i', 'race3d-confetti-piece');
      const theta = (i * 2.399963) - Math.PI / 2, distance = 75 + (i % 7) * 16;
      piece.style.cssText = `--confetti-x:${Math.cos(theta) * distance}px;--confetti-y:${Math.sin(theta) * distance}px;--confetti-turn:${i * 53}deg;--confetti-delay:${(i % 4) * 25}ms;background:${colors[i % colors.length]}`;
      finishBurst.append(piece);
    }
    finish.hidden = false;
    // Restart the CSS entrance without reading geometry or running a separate RAF.
    finish.classList.remove('is-celebrating');
    void finish.offsetWidth;
    finish.classList.add('is-celebrating');
    finishTimer = window.setTimeout(() => {
      finishTimer = 0; activeFinish = false; visibleFinish = null;
      finish.hidden = true; finish.classList.remove('is-celebrating'); nextFinish();
    }, result.place === 1 ? 1600 : 1000);
  }

  function update(cars = [], focusedId, metadata = {}, phase = 'idle') {
    if (disposed) return;
    const now = performance.now();
    updateCards(cars, focusedId, now, finite(metadata.simulationTime));
    for(const car of cars){const entry=cards.get(String(car.id));if(!entry)continue;const item=inventoryFace(car,finite(metadata.simulationTime));entry.item.hidden=!item;if(entry.icon!==item){entry.icon=item;entry.item.innerHTML=item?itemThumbnail(item):'';}} layout(now); updateRoulette(focusedId, cars, now, finite(metadata.simulationTime));
    const followed=cars.find(car=>String(car.id)===String(focusedId))||cars[0],compactItem=compact.querySelector('.race3d-card-item');
    if(compactItem){const face=followed?inventoryFace(followed,finite(metadata.simulationTime)):null;compactItem.hidden=!face;if(compactItem.dataset.face!==String(face)){compactItem.dataset.face=String(face);compactItem.innerHTML=face?itemThumbnail(face):'';}}
    const phaseChanged=previousPhase!==phase;previousPhase=phase;root.dataset.phase=phase;updateSelection(cars,metadata,phase);updateEffects(focusedId,cars,finite(metadata.effectTimeScale,5));root.dataset.powerup=String(!roulette.hidden||!effects.hidden);
    if (!['idle','selecting','countdown'].includes(phase)) {
      const finishers = cars.filter(car => Number.isFinite(car.finishTime)).slice().sort((a, b) => a.finishTime - b.finishTime || finite(a.finishPosition) - finite(b.finishPosition));
      finishers.forEach((car, index) => {
        const id = String(car.id);
        if (seenFinish.has(id)) return;
        seenFinish.add(id);
        finishQueue.push({ id, name: String(car.name ?? roster.get(id)?.name ?? 'Racer'), place: car.finishPosition || index + 1 });
      });
      nextFinish();
    }
  }

  function reset() {
    clearTimeout(finishTimer); finishTimer = 0; activeFinish = false; visibleFinish = null;
    finishQueue.length = 0; seenFinish.clear(); finishSequence = 0;
    shownItemKey = ''; lastCardsAt = lastLayoutAt = -Infinity;
    finish.hidden = roulette.hidden = true; finishBurst.replaceChildren(); finish.classList.remove('is-celebrating');
    effectKey='';compact.dataset.key='';compact.replaceChildren();effects.hidden=selection.hidden=true;effects.replaceChildren();selectionList.replaceChildren();selectionCards.clear();
    for (const entry of cards.values()) { entry.item.hidden = true; entry.card.classList.remove('is-finished'); }
  }
  // The CSS file can finish loading after the idle frame. Observe only the fixed
  // map/standings blocks, so repositioning cards cannot feed a resize loop.
  const layoutObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (!disposed) layout(performance.now(), true); }) : null;
  for (const selector of ['.race3d-minimap', '.race3d-standings']) {
    const block = root.querySelector(selector); if (block) layoutObserver?.observe(block);
  }
  function destroy() { if (disposed) return; reset(); disposed = true; layoutObserver?.disconnect(); left.remove(); right.remove(); compact.remove(); roulette.remove(); effects.remove(); selection.remove(); finish.remove(); cards.clear(); roster.clear(); }
  return { update, reset, destroy, snapshot: () => ({ cards: cards.size, finishers: [...seenFinish], queued: finishQueue.map(x => x.id), visibleFinish, finishSequence, rouletteItem: roulette.hidden ? null : roulette.dataset.item }) };
}
