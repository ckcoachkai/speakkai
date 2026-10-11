/**
 * Garden Siege. Original procedural artwork and a real, symmetric lane battle.
 * These adjustable health values are custom PvZ-inspired rules, not a claim of
 * exact parity with any edition of Plants vs. Zombies.
 */
export const HEALTH_MODEL = Object.freeze({ label: 'Source-informed baseline; custom combat variants', exactParityVerified: false, plantHealth: 300, studentHealth: 150, normalBodyHealth: 270, coneArmorHealth: 370, bucketArmorHealth: 1100, footballArmorHealth: 1400, peaDamage: 20 });
const ARCHETYPES = [
  { name: 'Walker', hp: 270, speed: .036, bite: 50, cadence: .50 },
  { name: 'Stumbler', hp: 270, speed: .041, bite: 45, cadence: .50 },
  { name: 'Runner', hp: 160, speed: .050, bite: 36, cadence: .40 },
  { name: 'Bruiser', hp: 300, speed: .031, bite: 65, cadence: .60 },
  { name: 'Courier', hp: 220, speed: .044, bite: 48, cadence: .45 },
];
const ARMORS = [
  { name: 'Barehead', hp: 0, resistance: 0 },
  { name: 'Cone', hp: 370, resistance: 0 },
  { name: 'Bucket', hp: 1100, resistance: 0 },
  { name: 'Football', hp: 1400, resistance: 0 },
];
const ABILITIES = [
  { name: 'Steady', regen: 0, dodge: 0, rush: 1, frenzy: 1 },
  { name: 'Mender', regen: 7, dodge: 0, rush: 1, frenzy: 1 },
  { name: 'Rusher', regen: 0, dodge: 0, rush: 1.7, frenzy: 1 },
  { name: 'Dodger', regen: 0, dodge: .18, rush: 1, frenzy: 1 },
  { name: 'Hungry', regen: 0, dodge: 0, rush: 1, frenzy: 1.5 },
];
export const ZOMBIE_CATALOG = Object.freeze(ARCHETYPES.flatMap((base, a) => ARMORS.flatMap((armor, b) => ABILITIES.map((ability, c) => Object.freeze({
  id: 'z' + String(a * 20 + b * 5 + c + 1).padStart(3, '0'),
  name: ability.name + ' ' + armor.name + ' ' + base.name,
  archetype: a, armor: b, ability: c,
  health: base.hp + armor.hp, bodyHealth: base.hp, armorHealth: armor.hp, speed: base.speed, bite: base.bite, biteCadence: base.cadence,
  resistance: armor.resistance, regeneration: ability.regen, dodge: ability.dodge, rush: ability.rush, frenzy: ability.frenzy,
  face: ['#a9ca79', '#94bd7e', '#b8ce87', '#86b68a', '#a1c18a'][a],
  jacket: ['#836045', '#9b6b48', '#755640', '#946a51', '#806749'][b === 0 ? a : (a + b) % 5],
  tie: ['#b94136', '#d27238', '#964944', '#d9a447', '#803f48'][c],
  brow: c, nose: a, buttons: b + 1,
})))));

const WEAPONS = [
  { id: 'pea', name: 'Pea Charm', icon: '●', multiplier: 1, cooldown: 1, count: 1, pierce: 1, radius: 0 },
  { id: 'twin', name: 'Twinbud', icon: '●●', multiplier: .78, cooldown: 1, count: 2, pierce: 1, radius: 0 },
  { id: 'burst', name: 'Threeleaf', icon: '•••', multiplier: .56, cooldown: 1.08, count: 3, pierce: 1, radius: 0 },
  { id: 'frost', name: 'Snowbud', icon: '❄', multiplier: .85, cooldown: 1, count: 1, pierce: 1, radius: 0, slow: .52 },
  { id: 'fire', name: 'Emberpetal', icon: '✦', multiplier: 1, cooldown: 1.05, count: 1, pierce: 1, radius: 0, burn: 6 },
  { id: 'pierce', name: 'Needleleaf', icon: '➤', multiplier: .92, cooldown: 1.03, count: 1, pierce: 3, radius: 0 },
  { id: 'catapult', name: 'Melonpod', icon: '◒', multiplier: 1.7, cooldown: 1.55, count: 1, pierce: 1, radius: .16 },
  { id: 'splash', name: 'Popcorn Pod', icon: '✺', multiplier: 1.13, cooldown: 1.15, count: 1, pierce: 1, radius: .12 },
  { id: 'laser', name: 'Sun Prism', icon: '⚡', multiplier: .48, cooldown: .5, count: 1, pierce: 1, radius: 0 },
  { id: 'thorn', name: 'Thorn Fan', icon: '⋔', multiplier: .60, cooldown: 1.08, count: 3, pierce: 2, radius: 0 },
];
const AFFIXES = [
  { name: 'Fierce', damage: 3, description: '+3 damage' },
  { name: 'Rapid', rate: .94, description: 'faster attacks' },
  { name: 'Vital', maxHp: 3, heal: 16, description: '+16 health' },
  { name: 'Guarded', shield: 9, description: '+9 shield' },
  { name: 'Lucky', crit: .04, description: 'more critical hits' },
  { name: 'Swift', velocity: .15, rate: .98, description: 'faster shots' },
  { name: 'Serrated', penetration: .05, description: 'pierce armor' },
  { name: 'Kind', damage: 1, heal: 7, description: '+damage and health' },
  { name: 'Blooming', splash: .012, description: 'wider splash damage' },
  { name: 'Sturdy', maxHp: 5, damage: 1, description: '+maximum health' },
];
export const LOOT_CATALOG = Object.freeze(WEAPONS.flatMap((weapon, a) => AFFIXES.map((affix, b) => Object.freeze({
  id: 'l' + String(a * 10 + b + 1).padStart(3, '0'), name: affix.name + ' ' + weapon.name,
  weapon: weapon.id, icon: weapon.icon, description: affix.description, effects: Object.freeze({ ...affix }),
}))));
const WEAPON_MAP = Object.fromEntries(WEAPONS.map(item => [item.id, item]));
const STARTERS = ZOMBIE_CATALOG.filter(item => item.armor === 0);
const DEFENDER_POSITIONS = [.14, .28, .42];
const STUDENT_HEALTH = 150;
const TAU = Math.PI * 2;
const C = { navy: '#101b33', mint: '#7bd8c9', coral: '#ff735e', gold: '#f8c75a', cream: '#fff4df' };
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/** A kill can happen once, and always records the owner of the lethal damage. */
export function damageZombie(mob, shot) {
  if (mob.dead || mob.hp <= 0) return { damage: 0, killed: false };
  const armor = Math.max(0, (mob.resistance || 0) - (mob.stage >= 2 ? .05 : 0));
  const damage = Math.max(0, shot.damage || 0) * (1 - armor);
  const actual = Math.min(mob.hp, damage);
  if (typeof mob.armorHp === 'number' && typeof mob.bodyHp === 'number') {
    // Serrated loot really bypasses armor; it can wound/defeat the body while
    // an outer armor piece is still intact. Ordinary peas hit armor first.
    const bypass = damage * clamp(shot.penetration || 0, 0, 1);
    const absorbed = Math.min(mob.armorHp, damage - bypass);
    mob.armorHp = Math.max(0, mob.armorHp - absorbed);
    mob.bodyHp = Math.max(0, mob.bodyHp - (damage - absorbed));
    mob.hp = mob.bodyHp <= 0 ? 0 : mob.armorHp + mob.bodyHp;
  } else mob.hp = Math.max(0, mob.hp - damage);
  if (actual > 0) { mob.lastShooter = shot.ownerId; mob.lastAttacker = shot.attackerId ?? mob.lastAttacker ?? null; }
  const body = mob.bodyHp ?? mob.hp, maximum = mob.maxBodyHp ?? mob.maxHp;
  mob.stage = Math.max(mob.stage || 0, body <= maximum * .25 ? 2 : body <= maximum * .5 ? 1 : 0);
  mob.hurt = .14;
  if (mob.hp <= 0) { mob.dead = true; return { damage: actual, killed: true }; }
  return { damage: actual, killed: false };
}

export default function createGame({ container, names = [], onPick, random = Math.random, sound = false, artwork = {} }) {
  const rng = () => clamp(Number(random()) || 0, 0, 1 - Number.EPSILON);
  const players = names.map((entry, index) => ({ ...entry, avatarIndex: index, name: String(entry.name ?? 'Gardener ' + (index + 1)), color: entry.color || [C.mint, C.coral, C.gold][index % 3] }));
  const root = document.createElement('div');
  root.className = 'garden-siege';
  root.innerHTML = '<style>.garden-siege{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:#101b33;color:#fff4df;position:relative}.garden-siege .garden-window{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#7bd8c955 #101b33}.garden-siege canvas{display:block}.garden-siege .garden-note{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}.garden-siege .garden-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style><div class="garden-window"><canvas role="img"></canvas></div><div class="garden-note">Sunshine grows your defenders. Protect your student!</div><div class="garden-live" aria-live="polite"></div>';
  container.appendChild(root);
  const canvas = root.querySelector('canvas'), viewport = root.querySelector('.garden-window');
  const note = root.querySelector('.garden-note'), live = root.querySelector('.garden-live');
  const ctx = canvas.getContext('2d');
  canvas.setAttribute('aria-label', 'Students sit behind classic plant defenders. Suns recruit shooters and stars enhance the team. Zombies must defeat every defender before reaching a student. The first student out of health speaks next.');
  let alive = true, raf = 0, generation = 0, phase = 'idle', reported = false, winner = null;
  let width = 1000, height = 560, laneHeight = 88, boardHeader = 64, lanes = [];
  let simTime = 0, startedAt = 0, resultAt = 0, visualResultAt = null, previous = null, focused = false, serial = 0;
  let shots = [], effects = [], drops = [], combatLog = [], soundEnabled = Boolean(sound);
  let audio = null, audioTimer = null, master = null, sfxMaster = null, beat = 0, nextBeat = 0, audioEpoch = 0, audioLoadController = null;
  const sampleBuffers = new Map(), sfxVoices = new Set(), musicVoices = new Set(), lastSfx = new Map(), sfxRotation = new Map();
  const soundGaps = { shot: .085, hit: .075, armor: .22, growl: 1.65, bite: .16, plant: .28, pickup: .16, death: .25 };
  const soundGains = { shot: .42, hit: .36, armor: .50, growl: .66, bite: .48, plant: .54, pickup: .52, death: .57 };
  const sampleURLs = Object.fromEntries(Object.keys(soundGaps).map(key => [key, (Array.isArray(artwork?.gardenSounds?.[key]) ? artwork.gardenSounds[key] : [artwork?.gardenSounds?.[key]]).filter(url => typeof url === 'string' && url.length > 0)]));
  let rewards = [], nextReward = .65;
  const atlases = { plants: null, zombies: null, students: null };
  const plantCells = { pea: 0, twin: 1, burst: 2, frost: 3, fire: 4, pierce: 5, catapult: 6, splash: 7, laser: 8, thorn: 9, sunflower: 10, shield: 11, ...(artwork?.gardenPlantCells || {}) };
  const zombieCells = { walker: 0, cone: 1, bucket: 2, football: 3, runner: 4, newspaper: 5, dancer: 6, construction: 7, bruiser: 8, courier: 9, mender: 10, gargantuar: 11, ...(artwork?.gardenZombieCells || {}) };
  const loadAtlas = (key, source) => {
    const ImageType = window.Image || globalThis.Image;
    if (!source || typeof source !== 'string' || typeof ImageType !== 'function') return;
    const record = { image: new ImageType(), ready: false, failed: false };
    atlases[key] = record;
    record.image.onload = () => { if (alive && atlases[key] === record) record.ready = record.image.naturalWidth > 0 && record.image.naturalHeight > 0; };
    record.image.onerror = () => { if (alive && atlases[key] === record) { record.failed = true; record.ready = false; } };
    record.image.src = source;
  };
  function atlasSprite(key, cell, x, y, w, h) {
    const atlas = atlases[key];
    if (!atlas?.ready) return false;
    const index = clamp(Number(cell) || 0, 0, 11), sw = atlas.image.naturalWidth / 4, sh = atlas.image.naturalHeight / 3;
    try { ctx.drawImage(atlas.image, index % 4 * sw, Math.floor(index / 4) * sh, sw, sh, x, y, w, h); return true; }
    catch { atlas.failed = true; atlas.ready = false; return false; }
  }
  const addLog = entry => { combatLog.push({ time: Number(simTime.toFixed(3)), ...entry }); if (combatLog.length > 5000) combatLog.shift(); };
  function rr(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function dot(x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function text(value, x, y, max, size = 11, color = C.cream, weight = 700, align = 'left') {
    ctx.font = weight + ' ' + size + 'px "Segoe UI",system-ui,sans-serif';
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    const chars = Array.from(String(value)); let display = chars.join('');
    while (chars.length && ctx.measureText(display).width > max) { chars.pop(); display = chars.join('') + '…'; }
    ctx.fillText(display, x, y);
  }
  function hpBar(x, y, w, hp, max, color, h = 5) {
    rr(x, y, w, h, h / 2, '#132b27bb');
    if (hp > 0) rr(x, y, w * clamp(hp / max, 0, 1), h, h / 2, color);
  }
  function layout() {
    if (!alive) return;
    width = Math.max(620, Math.round(root.clientWidth || container.clientWidth || 1000));
    const available = Math.max(260, viewport.clientHeight || root.clientHeight || 560);
    const rows = Math.max(1, players.length);
    // One board and one horizontal lane per player. Large rosters scroll down
    // the same lawn rather than becoming a collection of separate mini-games.
    laneHeight = players.length <= 10 ? Math.max(18, Math.floor((available - boardHeader - 12) / Math.max(5, rows))) : 88;
    height = Math.max(available, boardHeader + rows * laneHeight + 12);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const lane of lanes) {
      lane.x = 12; lane.y = boardHeader + lane.index * laneHeight;
      lane.w = width - 24; lane.h = laneHeight; lane.rail = width < 480 ? 75 : 88;
      // Keep the student's portrait beside its quiet name/health tag. The
      // three defenders occupy separate tiles immediately to the right.
      lane.plantX = lane.x + 73; lane.floor = lane.y + lane.h - 5;
      lane.travel = lane.w - 95;
      lane.spriteScale = Math.min(clamp((lane.h - 8) / 72, .28, 1.2), lane.travel * .14 / 85);
      lane.zombieScale = clamp((lane.h - 4) / 113, .20, 1);
    }
  }
  function newDefender(slot, weapon = 'pea', recruited = false) {
    return { uid: 'd' + (++serial), slot, position: DEFENDER_POSITIONS[slot], weapon, hp: 300, maxHp: 300, shield: 0,
      power: 0, nextShot: recruited ? simTime + .30 : .25, bornAt: recruited ? simTime : -1, eaten: false, eatenAt: 0,
      recoil: 0, hurt: 0, shotsFired: 0, kills: 0 };
  }
  function fresh() {
    serial = 0;
    // Random placement makes each name equally likely to occupy every lane;
    // every lane still uses identical starting statistics and threat rules.
    const placement = [...players];
    for (let i = placement.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [placement[i], placement[j]] = [placement[j], placement[i]]; }
    lanes = placement.map((entry, index) => ({ entry, index, x: 0, y: 0, w: 0, h: 0, plantX: 0, floor: 0, travel: 0,
      hp: STUDENT_HEALTH, maxHp: STUDENT_HEALTH, damage: 20, cooldown: .42, velocity: 1.9, penetration: 0, splash: 0, crit: 0,
      power: 0, kills: 0, loot: [], suns: 0, stars: 0, shotsFired: 0, nextSpawn: .55, nextGrowl: 3 + index % 5, mobs: [], defenders: [newDefender(0)], eaten: false, hurt: 0, lastLoot: null }));
    shots = []; effects = []; drops = []; rewards = []; nextReward = .65; combatLog = []; simTime = 0; focused = false;
    layout();
  }
  function particle(lane, position, color, number = 7, big = false) {
    for (let i = 0; i < number; i++) {
      const angle = rng() * TAU, speed = 18 + rng() * (big ? 95 : 46);
      effects.push({ kind: 'particle', lane: lane.index, x: position, y: -35, vx: Math.cos(angle) * speed / Math.max(1, lane.travel), vy: Math.sin(angle) * speed - 20, life: .4 + rng() * .5, color, radius: 1.5 + rng() * (big ? 3 : 2) });
    }
  }
  function float(lane, mob, value, color) { effects.push({ kind: 'text', lane: lane.index, x: mob.x, y: -69, vy: -22, life: .7, color, value: String(value) }); }
  function livingDefenders(lane) { return lane.defenders.filter(defender => !defender.eaten); }
  function recruitDefender(lane, weapon, source) {
    // A new plant grows between the student and approaching zombies. It cannot
    // spring up behind a zombie that has already passed that lawn tile.
    if (lane.eaten) return null;
    const nearest = Math.min(1.2, ...lane.mobs.filter(mob => !mob.dead).map(mob => mob.x));
    const slot = DEFENDER_POSITIONS.findIndex((position, index) => !lane.defenders.some(defender => defender.slot === index && !defender.eaten) && position + .04 < nearest);
    if (slot < 0) return null;
    const defender = newDefender(slot, weapon, true), old = lane.defenders.findIndex(item => item.slot === slot);
    if (old >= 0) lane.defenders[old] = defender; else lane.defenders.push(defender);
    particle(lane, defender.position, '#e2f98f', 16, true);
    effects.push({ kind: 'text', lane: lane.index, x: defender.position, y: -65, vy: -14, life: .85, color: '#fff3ab', value: '+ ' + WEAPON_MAP[weapon].icon });
    addLog({ type: 'recruit', source, ownerId: lane.entry.id, defenderId: defender.uid, weapon, slot });
    playSfx('plant', lane);
    return defender;
  }
  function newShooterType(lane) {
    const current = new Set(livingDefenders(lane).map(defender => defender.weapon));
    const pool = WEAPONS.filter(weapon => !current.has(weapon.id));
    return (pool.length ? pool : WEAPONS)[Math.floor(rng() * (pool.length || WEAPONS.length))].id;
  }
  function giveLoot(owner, item) {
    const e = item.effects;
    owner.damage = clamp(owner.damage + (e.damage || 0), 20, 36);
    owner.cooldown = clamp(owner.cooldown * (e.rate || 1), .29, .42);
    owner.crit = clamp(owner.crit + (e.crit || 0), 0, .30);
    owner.velocity = clamp(owner.velocity + (e.velocity || 0), 1.9, 2.8);
    owner.penetration = clamp(owner.penetration + (e.penetration || 0), 0, .35);
    owner.splash = clamp(owner.splash + (e.splash || 0), 0, .06);
    const living = livingDefenders(owner);
    let target = null, action = 'upgrade';
    if (living.length < DEFENDER_POSITIONS.length && rng() < .38) { target = recruitDefender(owner, item.weapon, 'loot'); if (target) action = 'recruit'; }
    target ||= living[Math.floor(rng() * living.length)];
    if (target) {
      target.weapon = item.weapon; target.power = Math.min(10, target.power + 1);
      target.maxHp = clamp(target.maxHp + (e.maxHp || 0), 300, 450);
      target.hp = Math.min(target.maxHp, target.hp + (e.heal || 0) + (e.maxHp || 0));
      target.shield = clamp(target.shield + (e.shield || 0), 0, 40);
      particle(owner, target.position, '#fff2a7', 5);
      effects.push({ kind: 'text', lane: owner.index, x: target.position, y: -65, vy: -15, life: .8, color: '#fff2ac', value: item.name });
    }
    owner.power = Math.min(10, owner.power + 1); owner.lastLoot = item;
    owner.loot.push(item.id); if (owner.loot.length > 100) owner.loot.shift();
    return { action, defenderId: target?.uid ?? null, weapon: item.weapon };
  }
  function killed(lane, mob) {
    mob.deathAt = simTime;
    const owner = lanes.find(player => player.entry.id === mob.lastShooter);
    const item = LOOT_CATALOG[mob.lootIndex];
    let upgrade = null;
    if (owner && !owner.eaten) {
      owner.kills++; const attacker = owner.defenders.find(defender => defender.uid === mob.lastAttacker); if (attacker) attacker.kills++;
      upgrade = giveLoot(owner, item);
    }
    drops.push({ lane: lane.index, ownerLane: owner?.index ?? lane.index, x: mob.x, age: 0, life: .8, item });
    particle(lane, mob.x, '#c3e19b', 12, true);
    addLog({ type: 'kill', zombieId: mob.uid, variant: mob.type.id, ownerId: mob.lastShooter, attackerId: mob.lastAttacker, lootId: item.id });
    addLog({ type: 'loot', lootId: item.id, ownerId: mob.lastShooter, attackerId: mob.lastAttacker, ...upgrade });
    playSfx('death', lane); if (owner) playSfx('pickup', owner);
  }
  function hit(lane, mob, shot, dotDamage = false) {
    if (mob.dead) return;
    if (!dotDamage && mob.type.dodge && rng() < mob.type.dodge * (shot.weapon === 'laser' ? .5 : 1)) {
      float(lane, mob, 'DODGE', '#e8edc8'); mob.dodgePose = .22; return;
    }
    const hadArmor = mob.armorHp > 0, previousStage = mob.stage;
    const result = damageZombie(mob, shot);
    if (previousStage < 1 && mob.stage >= 1) mob.armDropAt = simTime;
    if (previousStage < 2 && mob.stage >= 2) mob.headDropAt = simTime;
    if (hadArmor && mob.armorHp <= 0) {
      particle(lane, mob.x, '#d1c7a5', 9, true);
      float(lane, mob, 'ARMOR OFF', '#fff0bf');
      addLog({ type: 'armorBreak', zombieId: mob.uid, ownerId: shot.ownerId });
      playSfx('armor', lane);
    }
    if (result.damage <= 0) return;
    if (!dotDamage) {
      playSfx('hit', lane);
      float(lane, mob, Math.round(result.damage), shot.critical ? C.gold : '#fff5cd');
      particle(lane, mob.x, shot.weapon === 'frost' ? '#b3edff' : shot.weapon === 'fire' ? '#ffb875' : '#d4f3a4', 3);
      if (shot.slow) { mob.slow = shot.slow; mob.slowUntil = simTime + 1.75; }
      if (shot.burn) mob.burn = { until: simTime + 2, damage: shot.burn, ownerId: shot.ownerId, attackerId: shot.attackerId };
    }
    if (result.killed) killed(lane, mob);
  }
  function spawn(lane, starter = false) {
    const pool = starter ? STARTERS : ZOMBIE_CATALOG, type = pool[Math.floor(rng() * pool.length)];
    const pressure = Math.max(0, simTime - 20);
    // Ordinary variants gradually arrive more often and move a little faster.
    // There is no timed boss, one-hit assault or deadline that selects a name.
    const factor = 1 + pressure * .016, hp = type.health * factor;
    const armorHp = type.armorHealth * factor, bodyHp = hp - armorHp;
    const mob = { uid: ++serial, type, x: 1.02 + rng() * .08,
      hp, maxHp: hp, armorHp, maxArmorHp: armorHp, bodyHp, maxBodyHp: bodyHp, resistance: type.resistance, speed: type.speed * (1 + pressure * .024),
      bite: type.bite * 1.08, cadence: type.biteCadence, nextBite: 0,
      stage: 0, hurt: 0, dodgePose: 0, dead: false, deathAt: 0, lastShooter: null, slow: 1, slowUntil: 0, burn: null,
      lootIndex: Math.floor(rng() * LOOT_CATALOG.length), pose: rng() * TAU };
    lane.mobs.push(mob);
    addLog({ type: 'spawn', zombieId: mob.uid, variant: type.id, health: Math.round(hp), laneId: lane.entry.id });
    playSfx('growl', lane);
  }
  function shoot(lane, defender) {
    const targets = lane.mobs.filter(mob => !mob.dead && mob.x >= defender.position - .035).sort((a, b) => a.x - b.x);
    if (!targets.length) return;
    const weapon = WEAPON_MAP[defender.weapon], target = targets[0];
    const critical = rng() < lane.crit;
    const damage = lane.damage * weapon.multiplier * (critical ? 1.7 : 1);
    defender.recoil = .12; defender.shotsFired += weapon.id === 'laser' ? 1 : weapon.count; lane.shotsFired += weapon.id === 'laser' ? 1 : weapon.count;
    defender.nextShot = simTime + lane.cooldown * weapon.cooldown;
    const source = { ownerId: lane.entry.id, attackerId: defender.uid, origin: defender.position, damage, penetration: lane.penetration, weapon: weapon.id, slow: weapon.slow, burn: weapon.burn, critical };
    playSfx('shot', lane);
    if (weapon.id === 'laser') {
      effects.push({ kind: 'beam', lane: lane.index, x: target.x, origin: defender.position, life: .13, color: '#fff7ad' });
      hit(lane, target, source);
      if (lane.splash) for (const mob of targets.slice(1)) if (Math.abs(mob.x - target.x) < lane.splash) hit(lane, mob, { ...source, damage: damage * .55 });
    } else {
      for (let n = 0; n < weapon.count; n++) shots.push({ ...source, uid: ++serial, lane: lane.index, x: defender.position + .025 - n * .025,
        velocity: lane.velocity * (weapon.id === 'catapult' ? .78 : 1), pierce: weapon.pierce,
        radius: weapon.radius + lane.splash, hitIds: new Set(), arc: weapon.id === 'catapult', rotation: n, life: 2.4 });
    }
  }
  function attackTeam(lane, mob, events, dt) {
    const defender = livingDefenders(lane).sort((a, b) => b.position - a.position)[0];
    const contactPosition = defender ? defender.position + .036 : .025;
    const toTouch = Math.max(0, mob.x - contactPosition);
    const wounded = mob.hp < mob.maxHp * .5;
    const rush = mob.type.rush > 1 && (simTime + mob.pose) % 4 < .9 ? mob.type.rush : 1;
    const frenzy = wounded ? mob.type.frenzy : 1;
    const slow = simTime < mob.slowUntil ? mob.slow : 1;
    const speed = mob.speed * slow * rush * frenzy;
    mob.x = Math.max(contactPosition, mob.x - speed * dt);
    if (mob.x > contactPosition + 1e-9) return;
    const contact = simTime - dt + Math.min(dt, toTouch / speed);
    if (mob.nextBite < contact) mob.nextBite = contact;
    if (simTime + 1e-9 >= mob.nextBite) {
      const at = mob.nextBite;
      let damage = mob.bite * (wounded ? mob.type.frenzy : 1);
      mob.nextBite += mob.cadence;
      playSfx('bite', lane);
      if (defender) {
        const absorbed = Math.min(defender.shield, damage); defender.shield -= absorbed; damage -= absorbed;
        defender.hp = Math.max(0, defender.hp - damage); defender.hurt = .25;
        float(lane, { x: defender.position }, '-' + Math.round(damage), C.coral);
        addLog({ type: 'bite', target: 'defender', defenderId: defender.uid, zombieId: mob.uid, laneId: lane.entry.id, damage, remainingHp: defender.hp });
        if (defender.hp <= 0) {
          defender.eaten = true; defender.eatenAt = simTime;
          particle(lane, defender.position, '#d0e989', 9, true);
          addLog({ type: 'defenderEaten', ownerId: lane.entry.id, defenderId: defender.uid, weapon: defender.weapon });
        }
      } else {
        lane.hp = Math.max(0, lane.hp - damage); lane.hurt = .25;
        float(lane, { x: 0 }, '-' + Math.round(damage), C.coral);
        addLog({ type: 'bite', target: 'student', zombieId: mob.uid, laneId: lane.entry.id, damage, remainingHp: lane.hp, defendersRemaining: 0 });
        if (lane.hp <= 0 && !lane.eaten) { lane.eaten = true; events.push({ lane, time: at }); }
      }
    }
  }
  function advanceEffects(dt) {
    for (const effect of effects) {
      effect.life -= dt;
      if (effect.kind === 'particle') { effect.x += effect.vx * dt; effect.y += effect.vy * dt; effect.vy += 100 * dt; }
      if (effect.kind === 'text') effect.y += effect.vy * dt;
    }
    effects = effects.filter(effect => effect.life > 0).slice(-1800);
    for (const drop of drops) { drop.age += dt; drop.life -= dt; }
    drops = drops.filter(drop => drop.life > 0);
  }
  function endRound(event) {
    winner = event.lane; resultAt = event.time; phase = 'result';
    particle(winner, 0, C.gold, 28, true);
    note.textContent = winner.entry.name + "'s defenses fell. They speak next!";
    live.textContent = winner.entry.name + ' is the next speaker.';
    canvas.setAttribute('aria-label', winner.entry.name + "'s student ran out of health after every defender was defeated, and is the next speaker.");
    addLog({ type: 'winner', ownerId: winner.entry.id, at: resultAt });
    follow(winner, true);
    stopMusic();
  }
  function step(dt) {
    simTime += dt;
    const deaths = [];
    updateRewards(dt);
    for (const lane of lanes) {
      lane.hurt = Math.max(0, lane.hurt - dt);
      for (const defender of lane.defenders) { defender.recoil = Math.max(0, defender.recoil - dt); defender.hurt = Math.max(0, defender.hurt - dt); }
      if (lane.eaten) continue;
      if (simTime >= lane.nextSpawn && lane.mobs.filter(mob => !mob.dead).length < 6) {
        const starter = lane.mobs.length === 0 && lane.kills === 0;
        spawn(lane, starter);
        lane.nextSpawn = simTime + Math.max(1.05, 2.6 + rng() * .9 - Math.max(0, simTime - 20) * .034);
      }
      for (const mob of lane.mobs) {
        mob.hurt = Math.max(0, mob.hurt - dt); mob.dodgePose = Math.max(0, mob.dodgePose - dt);
        if (mob.dead) continue;
        if (mob.burn && simTime < mob.burn.until) hit(lane, mob, { ownerId: mob.burn.ownerId, attackerId: mob.burn.attackerId, damage: mob.burn.damage * dt, penetration: .05 }, true);
        if (mob.dead) continue;
        if (mob.type.regeneration) { mob.bodyHp = Math.min(mob.maxBodyHp, mob.bodyHp + mob.type.regeneration * dt); mob.hp = mob.bodyHp + mob.armorHp; }
        attackTeam(lane, mob, deaths, dt);
      }
      lane.mobs = lane.mobs.filter(mob => !mob.dead || simTime - mob.deathAt < .7);
      if (simTime >= lane.nextGrowl && lane.mobs.some(mob => !mob.dead)) { playSfx('growl', lane); lane.nextGrowl = simTime + 7 + lane.index % 4; }
      if (!lane.eaten) for (const defender of livingDefenders(lane)) if (simTime >= defender.nextShot) shoot(lane, defender);
    }
    for (const shot of shots) {
      const lane = lanes[shot.lane]; shot.x += shot.velocity * dt; shot.life -= dt;
      if (lane.eaten || shot.life <= 0) continue;
      const targets = lane.mobs.filter(mob => !mob.dead && !shot.hitIds.has(mob.uid) && shot.x >= mob.x - .012).sort((a, b) => a.x - b.x);
      for (const mob of targets) {
        if (shot.pierce <= 0) break;
        shot.hitIds.add(mob.uid); shot.pierce--;
        hit(lane, mob, shot);
        if (shot.radius > 0) for (const other of lane.mobs) if (other.uid !== mob.uid && !other.dead && Math.abs(other.x - mob.x) < shot.radius) {
          hit(lane, other, { ...shot, damage: shot.damage * .55 }); shot.hitIds.add(other.uid);
        }
      }
    }
    shots = shots.filter(shot => shot.life > 0 && shot.x < 1.15 && shot.pierce > 0 && !lanes[shot.lane].eaten);
    advanceEffects(dt);
    if (deaths.length) {
      const firstTime = Math.min(...deaths.map(event => event.time));
      const tied = deaths.filter(event => Math.abs(event.time - firstTime) < 1e-8);
      endRound(tied[Math.floor(rng() * tied.length)]);
    } else if (!focused && simTime > 12) {
      const weakest = [...lanes].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (weakest && weakest.hp < weakest.maxHp * .6) { follow(weakest); focused = true; }
    }
  }
  function follow(lane, instant = false) {
    if (lane.y < viewport.scrollTop || lane.y + lane.h > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTo({ top: Math.max(0, lane.y - viewport.clientHeight / 2 + lane.h / 2), behavior: instant ? 'instant' : 'smooth' });
    }
  }
  function collectReward(lane, reward) {
    lane.power = Math.min(10, lane.power + 1);
    let action = 'upgrade', defender = null;
    if (reward.kind === 'sun') {
      lane.suns++; lane.damage = Math.min(36, lane.damage + 1.4);
      lane.cooldown = Math.max(.29, lane.cooldown * .988);
      const living = livingDefenders(lane);
      // The first sun always tries to add a separate shooter. Later suns can
      // recruit a different type or evolve an existing defender.
      if (lane.suns === 1 || living.length < DEFENDER_POSITIONS.length && rng() < .62) defender = recruitDefender(lane, newShooterType(lane), 'sun');
      if (defender) action = 'recruit';
      else {
        defender = living[Math.floor(rng() * living.length)];
        if (defender) { defender.weapon = newShooterType(lane); defender.hp = Math.min(defender.maxHp, defender.hp + 15); }
      }
    } else {
      lane.stars++; lane.crit = Math.min(.30, lane.crit + .025);
      lane.splash = Math.min(.06, lane.splash + .008);
      const living = livingDefenders(lane);
      for (const member of living) { member.shield = Math.min(40, member.shield + 4); member.power = Math.min(10, member.power + 1); }
      defender = living[Math.floor(rng() * living.length)];
      if (defender) defender.weapon = newShooterType(lane);
    }
    if (defender && reward.kind === 'sun') defender.power = Math.min(10, defender.power + 1);
    const position = defender?.position ?? .14;
    particle(lane, position, reward.kind === 'sun' ? '#ffe982' : '#caf0ff', 12, true);
    if (action !== 'recruit') effects.push({ kind: 'text', lane: lane.index, x: position, y: -65, vy: -16, life: .65, color: reward.kind === 'sun' ? '#fff2a2' : '#d8f2ff', value: reward.kind === 'sun' ? 'SUN +' : 'TEAM +' });
    addLog({ type: 'resource', kind: reward.kind, ownerId: lane.entry.id, weapon: defender?.weapon ?? null, defenderId: defender?.uid ?? null, action, power: lane.power });
    playSfx('pickup', lane);
  }
  function updateRewards(dt) {
    if (simTime >= nextReward && lanes.length) {
      const eligible = lanes.filter(lane => !lane.eaten);
      if (eligible.length) {
        const lane = eligible[Math.floor(rng() * eligible.length)];
        rewards.push({ kind: rng() < .62 ? 'sun' : 'star', lane: lane.index, x: .18 + rng() * .73,
          y: -Math.max(78, lane.h + 14), velocity: 38 + rng() * 20, age: 0, landed: false, collectAge: 0, phase: rng() * TAU, collected: false });
      }
      nextReward = simTime + Math.max(.25, 1.75 / Math.sqrt(lanes.length)) + rng() * .24;
    }
    for (const reward of rewards) {
      const lane = lanes[reward.lane];
      if (lane.eaten) { reward.collected = true; continue; }
      reward.age += dt;
      if (!reward.landed) {
        reward.y = Math.min(-7, reward.y + reward.velocity * dt);
        if (reward.y >= -7) reward.landed = true;
      } else {
        reward.collectAge += dt;
        if (reward.collectAge >= 1.10) { reward.collected = true; collectReward(lane, reward); }
      }
    }
    rewards = rewards.filter(reward => !reward.collected);
  }
  function plant(lane, defender, time) {
    const x = lane.plantX + defender.position * lane.travel, floor = lane.floor, bob = Math.sin(time * 3 + lane.index + defender.slot) * 1.2;
    const age = defender.eaten ? Math.max(0, time - startedAt / 1000 - defender.eatenAt) : 0;
    if (defender.eaten && age > .7) return;
    ctx.save(); ctx.translate(x, floor); ctx.scale(lane.spriteScale, lane.spriteScale);
    if (defender.eaten) { const p = clamp(age / .65, 0, 1); ctx.translate(p * 25, -Math.sin(p * Math.PI) * 25); ctx.rotate(p * .8); ctx.scale(Math.max(.001, 1 - p), Math.max(.001, 1 - p)); ctx.globalAlpha = 1 - p; }
    else if (defender.bornAt >= 0) { const p = clamp((simTime - defender.bornAt) / .6, 0, 1); ctx.translate(0, (1 - p) * 16); ctx.scale(.2 + .8 * p, .2 + .8 * p); }
    if (defender.hurt) ctx.translate(Math.sin(time * 60) * 2, 0);
    ctx.fillStyle = '#315e3180'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, TAU); ctx.fill();
    if (!atlases.plants?.ready) {
    ctx.strokeStyle = '#3d9040'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -32); ctx.stroke();
    ctx.fillStyle = '#42a846'; ctx.beginPath(); ctx.ellipse(-13, -8, 15, 6, -.45, 0, TAU); ctx.fill();
    ctx.fillStyle = '#69c251'; ctx.beginPath(); ctx.ellipse(13, -8, 15, 6, .45, 0, TAU); ctx.fill();
    }
    const weapon = WEAPON_MAP[defender.weapon], recoil = defender.recoil / .12 * 3;
    ctx.translate(-recoil, bob);
    const illustrated = atlasSprite('plants', plantCells[weapon.id], -40, -75, 84, 76);
    if (!illustrated) {
      // Classic bulb, large side eyes, tubular snout and leafy feet. Names,
      // rather than human faces or hairstyles, identify the students.
      const peaHead = (hx, hy, color = '#79c944', mouth = '#245d27', scale = 1) => {
        ctx.save(); ctx.translate(hx, hy); ctx.scale(scale, scale);
        ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, 22, 18, -.10, 0, TAU); ctx.fill();
        rr(9, -6, 25, 15, 5, color); ctx.beginPath(); ctx.ellipse(33, 1, 10, 11, 0, 0, TAU); ctx.fillStyle = color; ctx.fill();
        ctx.beginPath(); ctx.ellipse(35, 1, 5.6, 7.3, 0, 0, TAU); ctx.fillStyle = mouth; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-7, -6, 6, 8, -.16, 0, TAU); ctx.fillStyle = '#f9ffda'; ctx.fill();
        dot(-5, -5, 3, '#233c20'); dot(-6, -7, 1.2, '#ffffff');
        ctx.strokeStyle = '#4c9b30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, -17); ctx.quadraticCurveTo(-22, -29, -11, -31); ctx.stroke();
        ctx.fillStyle = '#6ab747'; ctx.beginPath(); ctx.ellipse(-13, -29, 6, 3, .6, 0, TAU); ctx.fill();
        ctx.restore();
      };
      if (weapon.id === 'twin') { peaHead(-5, -51, '#6ec245', '#245d27', .86); peaHead(3, -29, '#83ce4d', '#245d27', .86); }
      else if (weapon.id === 'burst') { peaHead(-5, -53, '#65b93f', '#245d27', .72); peaHead(5, -37, '#81cc46', '#245d27', .75); peaHead(-4, -21, '#96d25c', '#245d27', .72); }
      else if (weapon.id === 'frost') { peaHead(0, -39, '#98d8ee', '#2b657b'); ctx.strokeStyle = '#d5f6ff'; ctx.lineWidth = 3; for (let n = 0; n < 5; n++) { ctx.beginPath(); ctx.moveTo(-17 + n * 7, -56); ctx.lineTo(-19 + n * 7, -64); ctx.stroke(); } }
      else if (weapon.id === 'fire') { for (let n = 0; n < 7; n++) { const a = n * TAU / 7; ctx.fillStyle = '#f2a735'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 17, -39 + Math.sin(a) * 17); ctx.lineTo(Math.cos(a + .15) * 29, -39 + Math.sin(a + .15) * 28); ctx.lineTo(Math.cos(a + .35) * 18, -39 + Math.sin(a + .35) * 18); ctx.fill(); } peaHead(0, -39, '#eeae40', '#994622'); }
      else if (weapon.id === 'catapult') {
        ctx.fillStyle = '#529944'; ctx.beginPath(); ctx.ellipse(0, -24, 27, 19, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8ec751'; ctx.lineWidth = 3; for (let n = -14; n < 20; n += 8) { ctx.beginPath(); ctx.moveTo(n, -39); ctx.quadraticCurveTo(n - 7, -20, n + 2, -7); ctx.stroke(); }
        ctx.strokeStyle = '#477b34'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(10, -21); ctx.lineTo(27, -56 + recoil * 3); ctx.stroke();
        dot(26, -57 + recoil * 3, 11, '#9bcf57', '#3a7333'); dot(-9, -28, 3.5, '#1d4025');
      } else if (weapon.id === 'laser') {
        for (let n = 0; n < 6; n++) { const a = n * TAU / 6; ctx.fillStyle = '#edca54'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 17, -38 + Math.sin(a) * 17, 11, 5, a, 0, TAU); ctx.fill(); }
        dot(0, -38, 16, '#fff3b8', '#d8ba4b'); dot(22, -38, 8, '#ffffdc', '#e7d672'); dot(-4, -42, 3, '#574a29'); dot(5, -42, 3, '#574a29');
      } else if (weapon.id === 'splash') {
        rr(-13, -61, 28, 44, 12, '#f7d867', '#b89b39'); for (let col = 0; col < 3; col++) for (let row = 0; row < 4; row++) dot(-8 + col * 8, -53 + row * 9, 3, '#ffe893');
        dot(-4, -32, 3, '#4f5429'); dot(7, -32, 3, '#4f5429');
      } else if (weapon.id === 'thorn') {
        ctx.fillStyle = '#3e9245'; ctx.beginPath(); ctx.ellipse(0, -32, 20, 29, .15, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#e1eea2'; ctx.lineWidth = 3; for (let n = 0; n < 5; n++) { ctx.beginPath(); ctx.moveTo(12, -54 + n * 11); ctx.lineTo(29, -58 + n * 12); ctx.stroke(); } dot(-4, -38, 4, '#1f4329');
      } else { peaHead(0, -39, weapon.id === 'pierce' ? '#589e48' : '#7dcc48'); if (weapon.id === 'pierce') { ctx.fillStyle = '#deedb5'; ctx.beginPath(); ctx.moveTo(30, -45); ctx.lineTo(48, -39); ctx.lineTo(31, -32); ctx.fill(); } }
    }
    if (defender.shield > 0) { ctx.strokeStyle = '#d3eaff99'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -34, 28, Math.PI * .8, Math.PI * 2.2); ctx.stroke(); }
    ctx.restore();
    if (!defender.eaten) hpBar(x - 19 * lane.spriteScale, floor - 72 * lane.spriteScale, 38 * lane.spriteScale, defender.hp, defender.maxHp, defender.hp < 90 ? '#ffd082' : '#d1ed86', 2.5);
  }
  function student(lane, time, resultAge) {
    const x = lane.plantX, scale = clamp((lane.h - 28) / 73, .18, .76), floor = lane.floor;
    const p = lane.eaten ? clamp(resultAge / .7, 0, 1) : 0;
    ctx.save(); ctx.translate(x, floor); ctx.scale(scale, scale);
    if (lane.hurt && !lane.eaten) ctx.translate(Math.sin(time * 32) * 2, 0);
    if (lane.eaten) { ctx.rotate(-p * .15); ctx.translate(0, p * 5); ctx.globalAlpha = 1 - p * .55; }
    dot(0, 0, 22, '#2e573933');
    if (!atlasSprite('students', lane.entry.avatarIndex % 12, -38, -75, 76, 76)) {
      const skins = ['#f4c692', '#ad754e', '#dfab7a', '#78513d', '#ebcba2', '#bd906d'];
      const hair = ['#543323', '#241e24', '#b17739', '#6e442c'][lane.entry.avatarIndex % 4];
      const skin = skins[lane.entry.avatarIndex % skins.length];
      rr(-19, -32, 38, 34, 10, lane.entry.color);
      dot(0, -48, 22, skin, '#735d4280');
      ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(0, -62, 23, 11, 0, Math.PI, TAU); ctx.fill();
      rr(-23, -65, 8, 27, 4, hair); rr(15, -65, 8, 20, 4, hair);
      dot(-7, -49, 2.2, '#292c30'); dot(8, -49, 2.2, '#292c30');
      ctx.strokeStyle = '#875347'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1, -43, 7, .1, Math.PI - .1); ctx.stroke();
    }
    if (lane.eaten || lane.hurt) {
      for (let n = 0; n < 3; n++) { const a = time * 4 + n * TAU / 3; text('★', Math.cos(a) * 28, -78 + Math.sin(a) * 6, 12, 12, '#fff0a0', 900, 'center'); }
    }
    ctx.restore();
  }
  function zombie(lane, mob, time) {
    const deadAge = mob.dead ? simTime - mob.deathAt : 0;
    const x = lane.plantX + mob.x * lane.travel, floor = lane.floor;
    const scale = lane.zombieScale, type = mob.type;
    ctx.save(); ctx.translate(x, floor); ctx.scale(scale, scale);
    if (mob.dead) { ctx.rotate(-Math.min(1, deadAge / .45) * 1.5); ctx.globalAlpha = Math.max(0, 1 - deadAge / .7); ctx.translate(0, 5); }
    else if (mob.dodgePose) ctx.rotate(.22);
    else if (mob.hurt) ctx.translate(3, 0);
    const walk = Math.sin(time * (mob.stage ? 5 : 7) + mob.pose), bob = Math.abs(walk) * 2;
    ctx.fillStyle = '#24482655'; ctx.beginPath(); ctx.ellipse(0, 0, 21, 5, 0, 0, TAU); ctx.fill();
    let illustrationKey = type.archetype === 2 ? 'runner' : type.archetype === 1 ? 'newspaper' : type.archetype === 3 ? 'bruiser' : type.archetype === 4 ? 'courier' : 'walker';
    if (type.ability === 1) illustrationKey = 'mender';
    if (type.ability === 2) illustrationKey = 'dancer';
    if (type.ability === 3) illustrationKey = 'construction';
    if (mob.armorHp > 0 && type.armor > 0) illustrationKey = ['walker', 'cone', 'bucket', 'football'][type.armor];
    let illustrated = false;
    if (atlases.zombies?.ready) {
      ctx.save(); ctx.translate(Math.sin(time * 6 + mob.pose) * .8, -bob);
      const cell = zombieCells[illustrationKey], w = 78, h = 112;
      if (mob.stage >= 2) {
        ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h * .52, w, h * .55); ctx.clip();
        illustrated = atlasSprite('zombies', cell, -w / 2, -h, w, h); ctx.restore();
        const fall = clamp((simTime - (mob.headDropAt ?? simTime)) / .55, 0, 1);
        ctx.save(); ctx.translate(24 * fall, 64 * fall); ctx.beginPath(); ctx.rect(-w / 2, -h, w, h * .49); ctx.clip();
        atlasSprite('zombies', cell, -w / 2, -h, w, h); ctx.restore();
      } else {
        if (mob.stage >= 1) { ctx.beginPath(); ctx.rect(-w / 2, -h, w, h + 3); ctx.rect(-w / 2, -65, 17, 27); ctx.clip('evenodd'); }
        illustrated = atlasSprite('zombies', cell, -w / 2, -h, w, h);
      }
      ctx.restore();
    }
    if (!illustrated) {
    ctx.strokeStyle = '#6c7666'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-10 + walk * 4, -5); ctx.moveTo(6, -21); ctx.lineTo(8 - walk * 4, -5); ctx.stroke();
    rr(-17 + walk * 4, -7, 15, 7, 3, '#383b2d'); rr(2 - walk * 4, -7, 16, 7, 3, '#383b2d');
    rr(-15, -46 - bob, 29, 26, 5, type.jacket, '#513e2f');
    ctx.fillStyle = '#e4dec0'; ctx.beginPath(); ctx.moveTo(-8, -46 - bob); ctx.lineTo(8, -46 - bob); ctx.lineTo(0, -29 - bob); ctx.fill();
    ctx.fillStyle = type.tie; ctx.beginPath(); ctx.moveTo(-2, -43 - bob); ctx.lineTo(3, -43 - bob); ctx.lineTo(5, -28 - bob); ctx.lineTo(1, -23 - bob); ctx.lineTo(-3, -28 - bob); ctx.fill();
    ctx.strokeStyle = type.jacket; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-12, -40 - bob); ctx.lineTo(-25, -33 - bob + walk); if (mob.stage < 1) { ctx.moveTo(12, -39 - bob); ctx.lineTo(22, -26 - bob); } ctx.stroke();
    ctx.strokeStyle = type.face; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-26, -33 - bob + walk); ctx.lineTo(-34, -32 - bob + walk); if (mob.stage < 1) { ctx.moveTo(22, -26 - bob); ctx.lineTo(26, -24 - bob); } ctx.stroke();
    if (mob.stage >= 1 && simTime - (mob.armDropAt ?? 0) < .65) {
      const p = clamp((simTime - mob.armDropAt) / .65, 0, 1);
      ctx.save(); ctx.translate(21 + p * 12, -30 + p * 30); ctx.rotate(p * 2.5);
      rr(-3, -8, 7, 17, 3, type.jacket); dot(0, 9, 3.5, type.face); ctx.restore();
    }
    for (let button = 0; button < type.buttons; button++) dot(9, -35 + button * 3 - bob, 1, '#d3b78b');
    const headFall = mob.stage >= 2 ? clamp((simTime - (mob.headDropAt ?? simTime)) / .55, 0, 1) : 0;
    ctx.save(); ctx.translate((mob.dead ? -deadAge * 24 : 0) + headFall * 24, -61 - bob + (mob.dead ? deadAge * 10 : 0) + headFall * 64); if (mob.stage > 0) ctx.rotate(-.09 - mob.stage * .06 - (mob.dead ? deadAge * 3 : 0) + headFall * 2);
    rr(-17, -19, 33, 34, 11, mob.hurt ? '#d0e5a1' : type.face, '#577c49');
    dot(-9, -5, 6, '#fff8d2'); dot(7, -5, 6, '#fff8d2');
    dot(-11, -5, 2.5, '#394732'); dot(5, -5, 2.5, '#394732');
    ctx.strokeStyle = '#597444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, -13 + type.brow % 2); ctx.lineTo(-3, -12); ctx.moveTo(1, -12); ctx.lineTo(13, -14 + type.brow % 3); ctx.stroke();
    rr(-2, -1, 4 + type.nose, 4, 2, '#8ea55b');
    rr(-8, 6, 18, mob.stage > 0 ? 8 : 6, 3, '#3d5230'); rr(-5, 6, 5, 3, 1, '#fff4d2'); rr(4, 6, 4, 3, 1, '#fff4d2');
    ctx.fillStyle = '#536d3f'; ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-7, -27); ctx.lineTo(-1, -20); ctx.lineTo(5, -25); ctx.lineTo(8, -17); ctx.fill();
    if (type.armor === 1 && mob.armorHp > 0) {
      ctx.fillStyle = '#eb902f'; ctx.beginPath(); ctx.moveTo(-19, -19); ctx.lineTo(-5, -50); ctx.lineTo(11, -19); ctx.closePath(); ctx.fill();
      rr(-22, -20, 36, 5, 2, '#dc7828'); ctx.strokeStyle = '#ffeac7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-13, -31); ctx.lineTo(3, -31); ctx.stroke();
    } else if (type.armor === 2 && mob.armorHp > 0) {
      rr(-20, -41, 37, 26, 4, '#b8bec0', '#5c7375'); rr(-23, -18, 43, 5, 2, '#d1d6d3'); ctx.strokeStyle = '#e3e8df'; ctx.beginPath(); ctx.moveTo(-13, -35); ctx.lineTo(-13, -23); ctx.stroke();
    } else if (type.armor === 3 && mob.armorHp > 0) {
      ctx.fillStyle = '#846553'; ctx.beginPath(); ctx.ellipse(-1, -19, 23, 15, 0, Math.PI, TAU); ctx.fill(); rr(-25, -19, 49, 5, 2, '#5d5548'); rr(-4, -30, 7, 9, 2, '#c5ae70');
    }
    if (mob.stage > 0) { ctx.strokeStyle = '#567840'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-15, 1); ctx.lineTo(-8, 3); ctx.moveTo(-13, -25); ctx.lineTo(-9, -19); ctx.lineTo(-11, -15); ctx.stroke(); }
    ctx.restore();
    }
    if (type.ability === 1 && !mob.dead) text('+', 20, -77, 12, 13, '#ccffb9', 900);
    if (type.ability === 2) { ctx.strokeStyle = '#ffe9a2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, -31); ctx.lineTo(22, -37); ctx.lineTo(19, -32); ctx.lineTo(27, -33); ctx.stroke(); }
    if (type.ability === 3) { dot(-21, -51, 2, '#e3d6fc'); dot(-25, -45, 1.5, '#e3d6fc'); }
    if (type.ability === 4) text('!', 20, -49, 10, 11, '#ffe4a0', 900);
    if (mob.burn && simTime < mob.burn.until && !mob.dead) { dot(-8, -20, 5 + Math.sin(time * 15), '#ffb04a99'); dot(5, -24, 4, '#ffdf6999'); }
    if (simTime < mob.slowUntil && !mob.dead) { ctx.strokeStyle = '#b3e9fa88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -42, 24, .4, 4); ctx.stroke(); }
    ctx.restore();
    if (!mob.dead) {
      hpBar(x - 19, floor - 85 * scale, 38, mob.hp, mob.maxHp, mob.stage ? '#ebbc59' : '#8dce64', 4);
      text(Math.ceil(mob.hp), x, floor - 92 * scale, 48, 8, '#f8ffe8', 800, 'center');
    }
  }
  function scene(time, resultAge) {
    const top = viewport.scrollTop || 0, bottom = top + (viewport.clientHeight || height);
    const visible = lane => lane.y + lane.h >= top - 24 && lane.y <= bottom + 24;
    ctx.fillStyle = '#5f853b'; ctx.fillRect(0, 0, width, height);
    const sky = ctx.createLinearGradient(0, 0, 0, boardHeader); sky.addColorStop(0, '#8dc9dc'); sky.addColorStop(1, '#c1e4c8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, boardHeader);
    dot(width - 43, 28, 18, '#ffd46e'); dot(width - 43, 28, 27, '#ffe69833');
    for (let i = 0; i < 4; i++) { const x = (i * 270 + time * 3) % (width + 80) - 45; dot(x, 21, 13, '#fffaf299'); dot(x + 17, 18, 18, '#fffaf299'); dot(x + 37, 24, 12, '#fffaf299'); }
    // A little house, fence, sun and one soil border make this a single garden.
    rr(18, 29, 69, 38, 2, '#e6d3a2', '#a49165');
    ctx.fillStyle = '#b96d48'; ctx.beginPath(); ctx.moveTo(10, 31); ctx.lineTo(52, 4); ctx.lineTo(95, 31); ctx.closePath(); ctx.fill();
    rr(25, 36, 15, 13, 1, '#92c8d1', '#c9b079'); rr(44, 42, 19, 25, 2, '#9c7857'); dot(59, 55, 1.2, '#e9d498');
    for (let x = 0; x < width; x += 26) { rr(x + 3, 58, 17, 14, 2, '#e2dda9'); ctx.fillStyle = '#f4edc2'; ctx.beginPath(); ctx.moveTo(x + 3, 58); ctx.lineTo(x + 11.5, 51); ctx.lineTo(x + 20, 58); ctx.fill(); }
    rr(0, 63, width, 5, 0, '#cbc493');
    const lawnBottom = boardHeader + Math.max(1, lanes.length) * laneHeight;
    rr(7, boardHeader - 2, width - 14, lawnBottom - boardHeader + 11, 7, '#8c7147');
    ctx.fillStyle = '#78b447'; ctx.fillRect(12, boardHeader, width - 24, lawnBottom - boardHeader);
    for (const lane of lanes) {
      if (!visible(lane)) continue;
      const won = phase === 'result' && winner === lane;
      ctx.save(); ctx.beginPath(); ctx.rect(lane.x, lane.y, lane.w, lane.h); ctx.clip();
      const tileStart = lane.x, tileWidth = lane.w / 9;
      for (let col = 0; col < 9; col++) {
        ctx.fillStyle = (col + lane.index) % 2 ? '#75b347' : '#88c058'; ctx.fillRect(tileStart + col * tileWidth, lane.y, tileWidth + .5, lane.h);
      }
      if (won) { ctx.fillStyle = '#fff6b32e'; ctx.fillRect(tileStart, lane.y, lane.w, lane.h); }
      ctx.strokeStyle = '#446b2b28'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lane.x, lane.y + lane.h -.5); ctx.lineTo(lane.x + lane.w, lane.y + lane.h -.5); ctx.stroke();
      const tiny = lane.h < 36, chipHeight = tiny ? 11 : 15;
      rr(lane.x + 29, lane.y + 4, lane.rail - 8, chipHeight, 4, '#264d2eaa');
      text(lane.entry.name, lane.x + 34, lane.y + 4 + chipHeight / 2, lane.rail - 19, tiny ? 8 : 10, won ? '#ffe2a0' : C.cream, 750);
      hpBar(lane.x + 32, lane.y + (tiny ? 17 : 24), 24, lane.hp, lane.maxHp, lane.hp < 70 ? '#ff947d' : '#c1e689', tiny ? 2 : 3);
      if (!tiny) text(Math.ceil(lane.hp), lane.x + 32, lane.y + 35, 24, 8, '#244c2c', 700);
      const team = livingDefenders(lane), teamIcons = team.map(defender => WEAPON_MAP[defender.weapon].icon).join(' ') + (lane.power ? ' · ' + lane.power : '');
      if (lane.h >= 50) text(teamIcons, lane.plantX + .09 * lane.travel, lane.y + 10, Math.max(60, lane.travel * .36), 9, '#355b30', 850);
      for (let g = lane.rail + 8; g < lane.w; g += 53) {
        ctx.strokeStyle = '#47792e77'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lane.x + g + 9, lane.floor + 3); ctx.lineTo(lane.x + g + 7, lane.floor - 2); ctx.lineTo(lane.x + g + 9, lane.floor + 1); ctx.lineTo(lane.x + g + 13, lane.floor - 2); ctx.stroke();
      }
      student(lane, time, won ? resultAge : 0);
      lane.defenders.forEach(defender => plant(lane, defender, time));
      [...lane.mobs].sort((a, b) => b.x - a.x).forEach(mob => zombie(lane, mob, time));
      if (won && resultAge > .4) { const badgeX = Math.min(lane.x + lane.w - 121, lane.plantX + 36); rr(badgeX, lane.y + lane.h / 2 - 12, 114, 25, 12, '#ffda72'); text('NEXT SPEAKER', badgeX + 57, lane.y + lane.h / 2 + 1, 107, 10, '#3d492f', 900, 'center'); }
      ctx.restore();
    }
    for (const shot of shots) {
      const lane = lanes[shot.lane], x = lane.plantX + shot.x * lane.travel;
      if (!visible(lane)) continue;
      const headOffset = shot.weapon === 'twin' ? (shot.rotation % 2 ? 28 : 50) : shot.weapon === 'burst' ? 51 - shot.rotation % 3 * 16 : 38;
      const progress = clamp((shot.x - shot.origin) / Math.max(.01, 1 - shot.origin), 0, 1);
      const y = lane.floor - headOffset * lane.spriteScale - (shot.arc ? Math.sin(progress * Math.PI) * 47 * lane.spriteScale : Math.sin(shot.x * 9 + shot.rotation) * 1.5);
      const color = shot.weapon === 'frost' ? '#b6edff' : shot.weapon === 'fire' ? '#ffcc6b' : '#a9e56e';
      if (shot.weapon === 'thorn' || shot.weapon === 'pierce') { ctx.fillStyle = '#dfef9a'; ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x - 5, y - 3); ctx.lineTo(x - 5, y + 3); ctx.fill(); }
      else { dot(x - 6, y, 3, color + '55'); dot(x, y, shot.arc ? 7 : 4.6, color, '#598d3f'); dot(x - 1.5, y - 1.5, 1.4, '#f5ffd9'); }
    }
    for (const effect of effects) {
      const lane = lanes[effect.lane], x = lane.plantX + effect.x * lane.travel, y = lane.floor + (effect.y || 0) * lane.spriteScale;
      if (!visible(lane)) continue;
      ctx.save(); ctx.globalAlpha = clamp(effect.life * 3, 0, 1);
      if (effect.kind === 'particle') dot(x, y, effect.radius, effect.color);
      else if (effect.kind === 'text') text(effect.value, x, y, 78, 10, effect.color, 900, 'center');
      else if (effect.kind === 'beam') { ctx.strokeStyle = '#fffad7'; ctx.shadowColor = '#ffde6a'; ctx.shadowBlur = 10; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lane.plantX + (effect.origin || 0) * lane.travel + 25 * lane.spriteScale, lane.floor - 38 * lane.spriteScale); ctx.lineTo(x, lane.floor - 41 * lane.zombieScale); ctx.stroke(); }
      ctx.restore();
    }
    for (const drop of drops) {
      const lane = lanes[drop.lane], owner = lanes[drop.ownerLane], p = clamp(drop.age / .8, 0, 1);
      if (!visible(lane) && !visible(owner)) continue;
      const fromX = lane.plantX + drop.x * lane.travel, toX = owner.plantX + .14 * owner.travel, x = fromX + (toX - fromX) * p;
      const y = lane.floor - 30 * lane.spriteScale + (owner.floor - lane.floor) * p - Math.sin(p * Math.PI) * 45 * lane.spriteScale;
      ctx.save(); ctx.globalAlpha = 1 - p * .5; dot(x, y, 10, '#fff5b9', '#d29334'); text(drop.item.icon, x, y, 19, 12, '#84632c', 900, 'center'); ctx.restore();
    }
    for (const reward of rewards) {
      const lane = lanes[reward.lane], drift = reward.landed ? clamp((reward.collectAge - .32) / .78, 0, 1) : 0;
      const eased = drift * drift * (3 - 2 * drift);
      const target = livingDefenders(lane)[0]?.position ?? .14;
      const startX = lane.plantX + reward.x * lane.travel, toX = lane.plantX + target * lane.travel, x = startX + (toX - startX) * eased + Math.sin(time * 2 + reward.phase) * (1 - eased) * 3;
      const y = lane.floor + reward.y - eased * 34 * lane.spriteScale - Math.sin(drift * Math.PI) * 22;
      if (y < top - 24 || y > bottom + 24) continue;
      const r = (reward.kind === 'sun' ? 12 : 11) * (1 - eased * .35);
      ctx.save(); ctx.translate(x, y); ctx.rotate(time * .35 + reward.phase);
      ctx.shadowBlur = reward.kind === 'sun' ? 16 : 12; ctx.shadowColor = reward.kind === 'sun' ? '#ffdf74' : '#a0dbff';
      const points = reward.kind === 'sun' ? 12 : 5;
      ctx.beginPath();
      for (let p = 0; p < points * 2; p++) { const a = p * Math.PI / points - Math.PI / 2, size = p % 2 ? r * (reward.kind === 'sun' ? .76 : .46) : r * (reward.kind === 'sun' ? 1.34 : 1.16); if (!p) ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size); else ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size); }
      ctx.closePath(); ctx.fillStyle = reward.kind === 'sun' ? '#ffd95c' : '#b9e5ff'; ctx.strokeStyle = reward.kind === 'sun' ? '#e5a433' : '#eef9ff'; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke();
      if (reward.kind === 'sun') dot(0, 0, r * .8, '#ffe98a', '#edb844');
      else { ctx.fillStyle = '#effbff'; ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(1, -6); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    if (!lanes.length) text('Add names to plant your garden.', 24, 125, width - 48, 17, C.cream, 800);
  }
  function scheduleMusic() {
    if (!audio || audio.state !== 'running' || phase !== 'running' || !master) return;
    const bass = [130.81, 155.56, 174.61, 196, 155.56, 146.83, 130.81, 98];
    const melody = [523.25, 0, 622.25, 587.33, 0, 523.25, 466.16, 0, 392, 466.16, 0, 523.25, 622.25, 0, 587.33, 466.16];
    while (nextBeat < audio.currentTime + .22) {
      const at = Math.max(nextBeat, audio.currentTime), i = beat++ % 16;
      const play = (frequency, type, gain, duration) => {
        if (!frequency) return;
        const oscillator = audio.createOscillator(), envelope = audio.createGain();
        oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
        envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(gain, at + .015); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
        const voice = { source: oscillator, gain: envelope }; musicVoices.add(voice);
        oscillator.connect(envelope); envelope.connect(master); oscillator.start(at); oscillator.stop(at + duration + .03);
        oscillator.onended = () => { musicVoices.delete(voice); oscillator.disconnect(); envelope.disconnect(); };
      };
      if (i % 2 === 0) play(bass[Math.floor(i / 2)], 'triangle', .2, .44);
      play(melody[i], 'sine', .15, .28);
      if (i % 4 === 3) play(1108.73, 'sine', .025, .07);
      nextBeat = at + 60 / 104 / 2;
    }
  }
  async function loadSamples(current, epoch) {
    if (typeof fetch !== 'function') return;
    const urls = [...new Set(Object.values(sampleURLs).flat())].filter(url => !sampleBuffers.has(url));
    if (!urls.length) return;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    audioLoadController = controller;
    await Promise.allSettled(urls.map(async url => {
      const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (!response.ok) throw new Error('Sound unavailable');
      const bytes = await response.arrayBuffer();
      if (!alive || audio !== current || audioEpoch !== epoch || !soundEnabled) return;
      const buffer = await current.decodeAudioData(bytes);
      if (alive && audio === current && audioEpoch === epoch && soundEnabled) sampleBuffers.set(url, buffer);
    }));
    if (audio === current && audioEpoch === epoch && audioLoadController === controller) audioLoadController = null;
  }
  function playSfx(key, lane) {
    if (!alive || !soundEnabled || !audio || audio.state !== 'running' || !sfxMaster || !lane) return;
    const top = viewport.scrollTop || 0, bottom = top + (viewport.clientHeight || height);
    if (lane.y + lane.h < top || lane.y > bottom || sfxVoices.size >= 12) return;
    const available = (sampleURLs[key] || []).filter(url => sampleBuffers.has(url));
    if (!available.length) return;
    const at = audio.currentTime, last = lastSfx.get(key) ?? -Infinity;
    if (at - last < soundGaps[key]) return;
    // Sound variations rotate independently of gameplay randomness. Muting,
    // asset failures and audio timing cannot change any combat outcome.
    const rotation = sfxRotation.get(key) || 0, url = available[rotation % available.length];
    let voice = null;
    try {
      const source = audio.createBufferSource(), gain = audio.createGain(); voice = { source, gain };
      source.buffer = sampleBuffers.get(url); source.playbackRate.value = 1;
      gain.gain.value = soundGains[key]; source.connect(gain); gain.connect(sfxMaster);
      source.onended = () => { sfxVoices.delete(voice); source.disconnect(); gain.disconnect(); };
      sfxVoices.add(voice); source.start(at); lastSfx.set(key, at); sfxRotation.set(key, rotation + 1);
    } catch {
      if (voice) { sfxVoices.delete(voice); try { voice.source.disconnect(); voice.gain.disconnect(); } catch {} }
    }
  }
  function startMusic() {
    if (!soundEnabled || phase !== 'running' || audio) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio = new Audio(); master = audio.createGain(); master.gain.value = .065; master.connect(audio.destination);
      sfxMaster = audio.createGain(); sfxMaster.gain.value = .58; sfxMaster.connect(audio.destination);
      nextBeat = audio.currentTime + .04; beat = 0;
      const current = audio, epoch = ++audioEpoch;
      loadSamples(current, epoch).catch(() => {});
      current.resume().then(() => { if (audio === current && audioEpoch === epoch && alive && soundEnabled) scheduleMusic(); }).catch(() => {});
      audioTimer = setInterval(scheduleMusic, 100);
    } catch { stopAudio(); }
  }
  function stopMusic() {
    if (audioTimer !== null) clearInterval(audioTimer); audioTimer = null;
    for (const voice of musicVoices) { voice.source.onended = null; try { voice.source.stop(); voice.source.disconnect(); voice.gain.disconnect(); } catch {} }
    musicVoices.clear(); try { master?.disconnect(); } catch {}
    master = null;
  }
  function stopAudio() {
    stopMusic(); audioEpoch++; audioLoadController?.abort(); audioLoadController = null;
    for (const voice of sfxVoices) { voice.source.onended = null; try { voice.source.stop(); voice.source.disconnect(); voice.gain.disconnect(); } catch {} }
    sfxVoices.clear(); lastSfx.clear(); sfxRotation.clear();
    try { sfxMaster?.disconnect(); } catch {} sfxMaster = null;
    if (audio) { const current = audio; audio = null; try { current.close().catch(() => {}); } catch {} }
  }
  function setSound(enabled) { soundEnabled = Boolean(enabled); if (soundEnabled) startMusic(); else stopAudio(); }
  function frame(timestamp) {
    if (!alive) return;
    const token = generation;
    const visualDt = previous === null ? 0 : Math.min(.08, Math.max(0, (timestamp - previous) / 1000)); previous = timestamp;
    const elapsed = phase === 'idle' ? 0 : Math.max(0, (timestamp - startedAt) / 1000);
    if (phase === 'running') {
      const target = elapsed;
      // Fixed simulation steps catch up to real time, including a throttled tab.
      while (phase === 'running' && simTime + .04 <= target + 1e-8) step(.04);
    } else if (phase === 'result') advanceEffects(visualDt);
    if (phase === 'result' && visualResultAt === null) visualResultAt = timestamp;
    const resultAge = phase === 'result' ? Math.max(0, (timestamp - visualResultAt) / 1000) : 0;
    scene(timestamp / 1000, resultAge);
    // A returning background tab still shows the student's gentle stun/fade
    // for 700 ms before asking the host to show its pick popup.
    if (phase === 'result' && !reported && resultAge >= .7) {
      reported = true; stopAudio(); onPick?.(winner.entry.id);
    }
    if (alive && token === generation) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!alive || phase !== 'idle' || !lanes.length) return;
    startedAt = performance.now(); phase = 'running'; reported = false; winner = null; visualResultAt = null;
    note.textContent = 'Collect sunshine to grow your defenders. Stars boost the team!';
    live.textContent = 'The garden battle is starting.';
    startMusic();
  }
  function reset() {
    if (!alive) return;
    generation++; cancelAnimationFrame(raf); previous = null; stopAudio();
    phase = 'idle'; reported = false; winner = null; resultAt = 0; visualResultAt = null;
    fresh(); viewport.scrollTop = 0;
    note.textContent = 'Sunshine grows your defenders. Protect your student!';
    live.textContent = ''; canvas.setAttribute('aria-label', 'Fresh garden ready. Every student starts with 150 health behind a pea shooter with 300 health.');
    raf = requestAnimationFrame(frame);
  }
  function destroy() {
    if (!alive) return;
    alive = false; generation++; cancelAnimationFrame(raf); observer?.disconnect(); stopAudio();
    if (!observer) window.removeEventListener('resize', layout);
    for (const key of Object.keys(atlases)) { if (atlases[key]) { atlases[key].image.onload = null; atlases[key].image.onerror = null; } atlases[key] = null; }
    shots = []; effects = []; drops = []; rewards = []; lanes = []; sampleBuffers.clear(); root.remove();
  }
  function getState() {
    return { phase, time: simTime, winnerId: winner?.entry.id ?? null, soundEnabled,
      audioEffects: { loadedSamples: sampleBuffers.size, activeVoices: sfxVoices.size, contextActive: Boolean(audio), loading: Boolean(audioLoadController) },
      zombieCatalogCount: ZOMBIE_CATALOG.length, lootCatalogCount: LOOT_CATALOG.length, healthModel: HEALTH_MODEL,
      artworkLoaded: { plants: Boolean(atlases.plants?.ready), zombies: Boolean(atlases.zombies?.ready), students: Boolean(atlases.students?.ready) }, fallingResources: rewards.map(reward => ({ kind: reward.kind, lane: reward.lane, landed: reward.landed, x: reward.x, y: reward.y })),
      lanes: lanes.map(lane => ({ id: lane.entry.id, hp: lane.hp, maxHp: lane.maxHp, studentHp: lane.hp, studentMaxHp: lane.maxHp, damage: lane.damage, cooldown: lane.cooldown, weapon: livingDefenders(lane)[0]?.weapon ?? null, power: lane.power, kills: lane.kills, loot: [...lane.loot], suns: lane.suns, stars: lane.stars, eaten: lane.eaten, shotsFired: lane.shotsFired, shield: livingDefenders(lane).reduce((total, defender) => total + defender.shield, 0),
        defenders: lane.defenders.map(defender => ({ id: defender.uid, slot: defender.slot, position: defender.position, weapon: defender.weapon, hp: defender.hp, maxHp: defender.maxHp, shield: defender.shield, power: defender.power, eaten: defender.eaten, bornAt: defender.bornAt, shotsFired: defender.shotsFired, kills: defender.kills })),
        mobs: lane.mobs.map(mob => ({ id: mob.uid, variant: mob.type.id, hp: mob.hp, maxHp: mob.maxHp, bodyHp: mob.bodyHp, armorHp: mob.armorHp, dead: mob.dead, stage: mob.stage, x: mob.x, lastShooter: mob.lastShooter })) })),
      combatLog: combatLog.map(entry => ({ ...entry })) };
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
  loadAtlas('plants', artwork?.gardenPlants);
  loadAtlas('zombies', artwork?.gardenZombies);
  loadAtlas('students', artwork?.students);
  fresh(); observer?.observe(root); if (!observer) window.addEventListener('resize', layout);
  raf = requestAnimationFrame(frame);
  return { start, reset, destroy, setSound, getState };
}