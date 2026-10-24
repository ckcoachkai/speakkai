import { RACER_CARD_NAMES, racerThumbnail, ITEM_VISUALS, itemThumbnail } from './race3d-ui-catalog.js?v=20261024-race3d-realism2';

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
  roulette.append(rouletteOwner, rouletteCube, rouletteName);
  const finish = make('div', 'race3d-finish-splash'); finish.hidden = true;
  finish.setAttribute('role', 'status'); finish.setAttribute('aria-live', 'polite');
  const finishBurst = make('div', 'race3d-finish-confetti'); finishBurst.setAttribute('aria-hidden', 'true');
  const finishRank = make('strong', 'race3d-finish-rank');
  const finishName = make('span', 'race3d-finish-name');
  const finishCaption = make('span', 'race3d-finish-caption');
  finish.append(finishBurst, finishRank, finishName, finishCaption);
  root.append(left, right, roulette, finish);
  let disposed = false, lastCardsAt = -Infinity, lastLayoutAt = -Infinity, shownItemKey = '';
  let finishTimer = 0, activeFinish = false, visibleFinish = null, finishSequence = 0;
  const finishQueue = [], seenFinish = new Set(), pickups = new Map(), seenItems = new Set();
  let itemSerial = 0;

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
    const label = make('span', 'race3d-card-attributes-label', 'GAME ATTRIBUTES');
    const attributes = make('dl', 'race3d-card-attributes');
    const fields = ['Top speed', 'Acceleration', 'Grip', 'Durability', 'Health', 'Replacements'];
    const values = fields.map(title => {
      const pair = make('div', 'race3d-card-attribute');
      const value = make('dd', ''); pair.append(make('dt', '', title), value); attributes.append(pair); return value;
    });
    card.append(head, vehicle, label, attributes);
    (index % 2 ? right : left).append(card);
    entry = { card, rank, player, thumb, model, values, item, type: null, icon: null };
    cards.set(id, entry);
    return entry;
  }

  function updateCards(cars, focusedId, now) {
    if (now - lastCardsAt < 160) return;
    lastCardsAt = now;
    const sources = cars.length ? cars : [...roster.values()];
    // Keep each card's initial side and DOM order stable while rank changes.
    sources.forEach((raw, index) => {
      const id = String(raw.id ?? index), car = { ...roster.get(id), ...raw };
      const entry = cardFor(id, car, index), type = car.racerType || car.assetId || ['f1-2026','gt3','car-concept'][index % 3];
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
      entry.model.textContent = String(car.vehicleName || RACER_CARD_NAMES[type] || 'Racing car');
      entry.model.title = entry.model.textContent;
      const topSpeed = finite(car.topSpeed ?? car.maxSpeed, NaN);
      const acceleration = finite(car.accelerationFactor, 1), grip = finite(car.gripFactor, 1), durability = finite(car.durabilityFactor, 1);
      const hp = clamp(finite(car.hitPoints, (1 - clamp(finite(car.damage), 0, 1)) * 100), 0, 100);
      const values = [Number.isFinite(topSpeed) ? `${Math.round(topSpeed * 3.6)} km/h` : '—',
        `${acceleration.toFixed(2)}×`, `${grip.toFixed(2)}×`, `${durability.toFixed(2)}×`, `${Math.round(hp)} / 100`, String(Math.max(0, Math.floor(finite(car.replacements))))];
      entry.values.forEach((node, i) => { if (node.textContent !== values[i]) node.textContent = values[i]; });
      entry.card.dataset.damageLevel = String(clamp(Math.floor(finite(car.damageLevel, finite(car.damage) * 20)), 0, 20));
      const pickup = pickups.get(id), item = pickup && now < pickup.until ? pickup.item : car.activeItem;
      entry.item.hidden = !ITEM_VISUALS[item];
      if (entry.icon !== item) { entry.icon = item; entry.item.innerHTML = itemThumbnail(item); entry.item.title = ITEM_VISUALS[item]?.[0] || ''; }
    });
    left.hidden = !left.children.length; right.hidden = !right.children.length;
  }

  function layout(now, force = false) {
    if (!force && now - lastLayoutAt < 500) return;
    lastLayoutAt = now;
    const map = root.querySelector('.race3d-minimap'), board = root.querySelector('.race3d-standings');
    const leftTop = map ? map.offsetTop + map.offsetHeight + 12 : 160;
    const rightTop = board ? board.offsetTop + board.offsetHeight + 12 : 160;
    left.style.setProperty('--rail-top', `${leftTop}px`);
    right.style.setProperty('--rail-top', `${rightTop}px`);
  }

  function processPickups(events, cars, now) {
    for (const event of events) {
      if (event.type !== 'item-pickup' || !ITEM_VISUALS[event.itemType]) continue;
      const id = String(event.carId ?? event.id), key = `${id}:${event.pickupId || ''}:${event.time ?? ''}:${event.itemType}`;
      if (seenItems.has(key)) continue;
      seenItems.add(key);
      pickups.set(id, { id, item: event.itemType, at: now, until: now + 2400, serial: ++itemSerial });
    }
    // A snapshot-only caller may not forward events; an active item still gets a reveal.
    for (const car of cars) {
      const id = String(car.id), prior = pickups.get(id);
      if (ITEM_VISUALS[car.activeItem] && prior?.item !== car.activeItem) {
        pickups.set(id, { id, item: car.activeItem, at: now, until: now + 2400, serial: ++itemSerial });
      }
    }
    if (seenItems.size > 400) {
      const oldest = [...seenItems].slice(0, seenItems.size - 300);
      oldest.forEach(key => seenItems.delete(key));
    }
  }

  function updateRoulette(focusedId, cars, now) {
    const id = String(focusedId ?? cars[0]?.id), entry = pickups.get(id);
    if (!entry || now >= entry.until) { roulette.hidden = true; shownItemKey = ''; return; }
    const age = now - entry.at, rolling = age < 950;
    const types = Object.keys(ITEM_VISUALS);
    const item = rolling ? (age < 140 ? '?' : types[Math.floor(age / 75) % types.length]) : entry.item;
    const key = `${id}:${entry.serial}:${item}:${rolling}`;
    roulette.hidden = false;
    if (shownItemKey === key) return;
    shownItemKey = key;
    const owner = cars.find(car => String(car.id) === id) || roster.get(id);
    rouletteOwner.textContent = String(owner?.name || 'Racer');
    rouletteIcon.innerHTML = itemThumbnail(item);
    rouletteName.textContent = rolling ? 'Choosing item…' : ITEM_VISUALS[item][0];
    roulette.dataset.rolling = String(rolling);
    roulette.dataset.item = rolling ? 'choosing' : entry.item;
    roulette.setAttribute('aria-label', `${rouletteOwner.textContent}: ${rouletteName.textContent}`);
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
    const now = performance.now(), events = Array.isArray(metadata.events) ? metadata.events : [];
    processPickups(events, cars, now);
    updateCards(cars, focusedId, now); layout(now); updateRoulette(focusedId, cars, now);
    if (phase !== 'idle' && phase !== 'countdown') {
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
    finishQueue.length = 0; seenFinish.clear(); pickups.clear(); seenItems.clear(); finishSequence = 0;
    itemSerial = 0; shownItemKey = ''; lastCardsAt = lastLayoutAt = -Infinity;
    finish.hidden = roulette.hidden = true; finishBurst.replaceChildren(); finish.classList.remove('is-celebrating');
    for (const entry of cards.values()) { entry.item.hidden = true; entry.card.classList.remove('is-finished'); }
  }
  // The CSS file can finish loading after the idle frame. Observe only the fixed
  // map/standings blocks, so repositioning cards cannot feed a resize loop.
  const layoutObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (!disposed) layout(performance.now(), true); }) : null;
  for (const selector of ['.race3d-minimap', '.race3d-standings']) {
    const block = root.querySelector(selector); if (block) layoutObserver?.observe(block);
  }
  function destroy() { if (disposed) return; reset(); disposed = true; layoutObserver?.disconnect(); left.remove(); right.remove(); roulette.remove(); finish.remove(); cards.clear(); roster.clear(); }
  return { update, reset, destroy, snapshot: () => ({ cards: cards.size, finishers: [...seenFinish], queued: finishQueue.map(x => x.id), visibleFinish, finishSequence, rouletteItem: roulette.hidden ? null : roulette.dataset.item }) };
}
