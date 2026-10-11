/**
 * Garden Siege. Original procedural artwork and a real, symmetric lane battle.
 * These adjustable health values are custom PvZ-inspired rules, not a claim of
 * exact parity with any edition of Plants vs. Zombies.
 */
export const HEALTH_MODEL = Object.freeze({ label: 'Source-informed baseline; custom combat variants', exactParityVerified: false, plantHealth: 300, normalBodyHealth: 270, coneArmorHealth: 370, bucketArmorHealth: 1100, footballArmorHealth: 1400, peaDamage: 20 });
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
  if (actual > 0) mob.lastShooter = shot.ownerId;
  const body = mob.bodyHp ?? mob.hp, maximum = mob.maxBodyHp ?? mob.maxHp;
  mob.stage = Math.max(mob.stage || 0, body <= maximum * .25 ? 2 : body <= maximum * .5 ? 1 : 0);
  mob.hurt = .14;
  if (mob.hp <= 0) { mob.dead = true; return { damage: actual, killed: true }; }
  return { damage: actual, killed: false };
}

export default function createGame({ container, names = [], onPick, random = Math.random, sound = false }) {
  const rng = () => clamp(Number(random()) || 0, 0, 1 - Number.EPSILON);
  const players = names.map((entry, index) => ({ ...entry, name: String(entry.name ?? 'Gardener ' + (index + 1)), color: entry.color || [C.mint, C.coral, C.gold][index % 3] }));
  const root = document.createElement('div');
  root.className = 'garden-siege';
  root.innerHTML = '<style>.garden-siege{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:#101b33;color:#fff4df;position:relative}.garden-siege .garden-window{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#7bd8c955 #101b33}.garden-siege canvas{display:block;width:100%}.garden-siege .garden-note{padding:9px 14px;font:600 10px/1.5 system-ui,sans-serif;border-top:1px solid #ffffff13;background:#142336;color:#b9d8c0;flex-shrink:0}.garden-siege .garden-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style><div class="garden-window"><canvas role="img"></canvas></div><div class="garden-note">100 zombie builds · 100 loot upgrades · Real damage, real defeats. First plant eaten speaks next.</div><div class="garden-live" aria-live="polite"></div>';
  container.appendChild(root);
  const canvas = root.querySelector('canvas'), viewport = root.querySelector('.garden-window');
  const note = root.querySelector('.garden-note'), live = root.querySelector('.garden-live');
  const ctx = canvas.getContext('2d');
  canvas.setAttribute('aria-label', 'Child-faced green plants defend a checkerboard lawn against brown-jacketed cartoon zombies. The first plant eaten is the next speaker.');
  let alive = true, raf = 0, generation = 0, phase = 'idle', reported = false, winner = null;
  let width = 1000, height = 560, laneHeight = 88, boardHeader = 72, lanes = [];
  let simTime = 0, startedAt = 0, resultAt = 0, visualResultAt = null, previous = null, finalWave = false, focused = false, serial = 0;
  let shots = [], effects = [], drops = [], combatLog = [], soundEnabled = Boolean(sound);
  let audio = null, audioTimer = null, master = null, beat = 0, nextBeat = 0;
  const addLog = entry => { combatLog.push({ time: Number(simTime.toFixed(3)), ...entry }); if (combatLog.length > 500) combatLog.shift(); };
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
    width = Math.max(300, Math.round(root.clientWidth || container.clientWidth || 1000));
    const available = Math.max(340, viewport.clientHeight || root.clientHeight || 560);
    const rows = Math.max(1, players.length);
    // One board and one horizontal lane per player. Large rosters scroll down
    // the same lawn rather than becoming a collection of separate mini-games.
    laneHeight = players.length <= 10 ? clamp(Math.floor((available - boardHeader - 20) / Math.max(5, rows)), 62, 94) : 88;
    height = Math.max(available, boardHeader + rows * laneHeight + 20);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.height = height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rail = width < 600 ? 96 : 126;
    for (const lane of lanes) {
      lane.x = 12; lane.y = boardHeader + lane.index * laneHeight;
      lane.w = width - 24; lane.h = laneHeight; lane.rail = rail;
      lane.plantX = lane.x + rail + 28; lane.floor = lane.y + lane.h - 7;
      lane.travel = lane.w - rail - 53;
      lane.spriteScale = clamp((lane.h - 12) / 72, .52, 1);
      lane.zombieScale = clamp((lane.h - 5) / 113, .45, .86);
    }
  }
  function fresh() {
    lanes = players.map((entry, index) => ({ entry, index, x: 0, y: 0, w: 0, h: 0, plantX: 0, floor: 0, travel: 0,
      hp: 300, maxHp: 300, shield: 0, damage: 20, cooldown: .42, velocity: 1.9, penetration: 0, splash: 0, crit: 0,
      weapon: 'pea', power: 0, kills: 0, loot: [], nextShot: .25, nextSpawn: .55, mobs: [], eaten: false, recoil: 0, hurt: 0, lastLoot: null }));
    shots = []; effects = []; drops = []; combatLog = []; simTime = 0; finalWave = false; focused = false; serial = 0;
    layout();
  }
  function particle(lane, position, color, number = 7, big = false) {
    for (let i = 0; i < number; i++) {
      const angle = rng() * TAU, speed = 18 + rng() * (big ? 95 : 46);
      effects.push({ kind: 'particle', lane: lane.index, x: position, y: -35, vx: Math.cos(angle) * speed / Math.max(1, lane.travel), vy: Math.sin(angle) * speed - 20, life: .4 + rng() * .5, color, radius: 1.5 + rng() * (big ? 3 : 2) });
    }
  }
  function float(lane, mob, value, color) { effects.push({ kind: 'text', lane: lane.index, x: mob.x, y: -69, vy: -22, life: .7, color, value: String(value) }); }
  function giveLoot(owner, item) {
    const e = item.effects;
    owner.damage = clamp(owner.damage + (e.damage || 0), 20, 36);
    owner.cooldown = clamp(owner.cooldown * (e.rate || 1), .29, .42);
    owner.maxHp = clamp(owner.maxHp + (e.maxHp || 0), 300, 450);
    owner.hp = Math.min(owner.maxHp, owner.hp + (e.heal || 0) + (e.maxHp || 0));
    owner.shield = clamp(owner.shield + (e.shield || 0), 0, 40);
    owner.crit = clamp(owner.crit + (e.crit || 0), 0, .30);
    owner.velocity = clamp(owner.velocity + (e.velocity || 0), 1.9, 2.8);
    owner.penetration = clamp(owner.penetration + (e.penetration || 0), 0, .35);
    owner.splash = clamp(owner.splash + (e.splash || 0), 0, .06);
    owner.weapon = item.weapon; owner.power = Math.min(10, owner.power + 1); owner.lastLoot = item;
    owner.loot.push(item.id); if (owner.loot.length > 100) owner.loot.shift();
  }
  function killed(lane, mob) {
    mob.deathAt = simTime;
    const owner = lanes.find(player => player.entry.id === mob.lastShooter);
    const item = LOOT_CATALOG[mob.lootIndex];
    if (owner && !owner.eaten) { owner.kills++; giveLoot(owner, item); }
    drops.push({ lane: lane.index, ownerLane: owner?.index ?? lane.index, x: mob.x, age: 0, life: .8, item });
    particle(lane, mob.x, '#c3e19b', 12, true);
    addLog({ type: 'kill', zombieId: mob.uid, variant: mob.type.id, ownerId: mob.lastShooter, lootId: item.id });
    addLog({ type: 'loot', lootId: item.id, ownerId: mob.lastShooter });
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
    }
    if (result.damage <= 0) return;
    if (!dotDamage) {
      float(lane, mob, Math.round(result.damage), shot.critical ? C.gold : '#fff5cd');
      particle(lane, mob.x, shot.weapon === 'frost' ? '#b3edff' : shot.weapon === 'fire' ? '#ffb875' : '#d4f3a4', 3);
      if (shot.slow) { mob.slow = shot.slow; mob.slowUntil = simTime + 1.75; }
      if (shot.burn) mob.burn = { until: simTime + 2, damage: shot.burn, ownerId: shot.ownerId };
    }
    if (result.killed) killed(lane, mob);
  }
  function spawn(lane, starter = false, boss = false) {
    const pool = starter ? STARTERS : ZOMBIE_CATALOG, type = pool[Math.floor(rng() * pool.length)];
    const pressure = Math.max(0, simTime - 12);
    const factor = 1 + pressure * .022, hp = boss ? 5000 : type.health * factor;
    const armorHp = type.armorHealth * factor, bodyHp = hp - armorHp;
    const mob = { uid: ++serial, type, x: boss ? 1.0 + rng() * .08 : 1.02 + rng() * .08,
      hp, maxHp: hp, armorHp, maxArmorHp: armorHp, bodyHp, maxBodyHp: bodyHp, resistance: type.resistance, speed: boss ? .43 + rng() * .12 : type.speed * (1 + pressure * .055),
      bite: boss ? 600 : type.bite, cadence: boss ? .55 : type.biteCadence, nextBite: 0,
      stage: 0, hurt: 0, dodgePose: 0, dead: false, deathAt: 0, lastShooter: null, slow: 1, slowUntil: 0, burn: null,
      boss, lootIndex: Math.floor(rng() * LOOT_CATALOG.length), pose: rng() * TAU };
    if (boss) { lane.mobs = lane.mobs.filter(item => !item.dead); if (lane.mobs.length >= 7) lane.mobs.pop(); }
    lane.mobs.push(mob);
    addLog({ type: 'spawn', zombieId: mob.uid, variant: type.id, health: Math.round(hp), boss, laneId: lane.entry.id });
  }
  function shoot(lane) {
    const targets = lane.mobs.filter(mob => !mob.dead).sort((a, b) => a.x - b.x);
    if (!targets.length) return;
    const weapon = WEAPON_MAP[lane.weapon], target = targets[0];
    const critical = rng() < lane.crit;
    const damage = lane.damage * weapon.multiplier * (critical ? 1.7 : 1);
    lane.recoil = .12;
    lane.nextShot = simTime + lane.cooldown * weapon.cooldown;
    const source = { ownerId: lane.entry.id, damage, penetration: lane.penetration, weapon: weapon.id, slow: weapon.slow, burn: weapon.burn, critical };
    if (weapon.id === 'laser') {
      effects.push({ kind: 'beam', lane: lane.index, x: target.x, life: .13, color: '#fff7ad' });
      hit(lane, target, source);
      if (lane.splash) for (const mob of targets.slice(1)) if (Math.abs(mob.x - target.x) < lane.splash) hit(lane, mob, { ...source, damage: damage * .55 });
    } else {
      for (let n = 0; n < weapon.count; n++) shots.push({ ...source, uid: ++serial, lane: lane.index, x: .025 - n * .055,
        velocity: lane.velocity * (weapon.id === 'catapult' ? .78 : 1), pierce: weapon.pierce,
        radius: weapon.radius + lane.splash, hitIds: new Set(), arc: weapon.id === 'catapult', rotation: n, life: 2.4 });
    }
  }
  function attackPlant(lane, mob, events, dt) {
    const toTouch = Math.max(0, mob.x - .065);
    const wounded = mob.hp < mob.maxHp * .5;
    const rush = mob.type.rush > 1 && (simTime + mob.pose) % 4 < .9 ? mob.type.rush : 1;
    const frenzy = wounded ? mob.type.frenzy : 1;
    const slow = simTime < mob.slowUntil ? mob.slow : 1;
    // Final-wave guests keep a minimum advance speed: upgrades can slow them,
    // but cannot postpone the next speaker indefinitely.
    const speed = mob.boss ? Math.max(.38, mob.speed * slow) : mob.speed * slow * rush * frenzy;
    mob.x = Math.max(.065, mob.x - speed * dt);
    if (mob.x > .065 + 1e-9) return;
    const contact = simTime - dt + Math.min(dt, toTouch / speed);
    if (mob.nextBite < contact) mob.nextBite = contact;
    if (simTime + 1e-9 >= mob.nextBite) {
      const at = mob.nextBite;
      let damage = mob.bite * (wounded && !mob.boss ? mob.type.frenzy : 1);
      const absorbed = Math.min(lane.shield, damage); lane.shield -= absorbed; damage -= absorbed;
      lane.hp = Math.max(0, lane.hp - damage); lane.hurt = .25; mob.nextBite += mob.cadence;
      float(lane, { x: .02 }, '-' + Math.round(damage), C.coral);
      addLog({ type: 'bite', zombieId: mob.uid, laneId: lane.entry.id, damage, remainingHp: lane.hp });
      if (lane.hp <= 0 && !lane.eaten) { lane.eaten = true; events.push({ lane, time: at }); }
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
    particle(winner, .03, C.gold, 28, true);
    note.textContent = winner.entry.name + ' was the first plant eaten and speaks next. A fresh lawn comes next round.';
    live.textContent = winner.entry.name + ' is the next speaker.';
    canvas.setAttribute('aria-label', winner.entry.name + ' was the first plant eaten and is the next speaker.');
    addLog({ type: 'winner', ownerId: winner.entry.id, at: resultAt });
    follow(winner, true);
    stopMusic();
  }
  function step(dt) {
    simTime += dt;
    const deaths = [];
    if (!finalWave && simTime >= 28) {
      finalWave = true;
      for (const lane of lanes) spawn(lane, false, true);
      note.textContent = 'Final hungry wave! Upgrades still deal real damage. Watch the first chomp.';
    }
    for (const lane of lanes) {
      lane.recoil = Math.max(0, lane.recoil - dt); lane.hurt = Math.max(0, lane.hurt - dt);
      if (lane.eaten) continue;
      if (!finalWave && simTime >= lane.nextSpawn && lane.mobs.filter(mob => !mob.dead).length < 6) {
        const starter = lane.mobs.length === 0 && lane.kills === 0;
        spawn(lane, starter);
        lane.nextSpawn = simTime + Math.max(.75, 2.2 + rng() * .95 - Math.max(0, simTime - 12) * .09);
      }
      for (const mob of lane.mobs) {
        mob.hurt = Math.max(0, mob.hurt - dt); mob.dodgePose = Math.max(0, mob.dodgePose - dt);
        if (mob.dead) continue;
        if (mob.burn && simTime < mob.burn.until) hit(lane, mob, { ownerId: mob.burn.ownerId, damage: mob.burn.damage * dt, penetration: .05 }, true);
        if (mob.dead) continue;
        if (mob.type.regeneration) { mob.bodyHp = Math.min(mob.maxBodyHp, mob.bodyHp + mob.type.regeneration * dt); mob.hp = mob.bodyHp + mob.armorHp; }
        attackPlant(lane, mob, deaths, dt);
      }
      lane.mobs = lane.mobs.filter(mob => !mob.dead || simTime - mob.deathAt < .7);
      if (!lane.eaten && simTime >= lane.nextShot) shoot(lane);
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
  function plant(lane, time, age) {
    const x = lane.plantX, floor = lane.floor, bob = Math.sin(time * 3 + lane.index) * 1.2;
    ctx.save(); ctx.translate(x, floor); ctx.scale(lane.spriteScale, lane.spriteScale);
    if (lane.eaten) { const p = clamp(age / .65, 0, 1); ctx.translate(p * 25, -Math.sin(p * Math.PI) * 25); ctx.rotate(p * .8); ctx.scale(Math.max(.001, 1 - p), Math.max(.001, 1 - p)); ctx.globalAlpha = 1 - p; }
    if (lane.hurt) ctx.translate(Math.sin(time * 60) * 2, 0);
    ctx.fillStyle = '#315e3180'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3d9040'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -32); ctx.stroke();
    ctx.fillStyle = '#42a846'; ctx.beginPath(); ctx.ellipse(-13, -8, 15, 6, -.45, 0, TAU); ctx.fill();
    ctx.fillStyle = '#69c251'; ctx.beginPath(); ctx.ellipse(13, -8, 15, 6, .45, 0, TAU); ctx.fill();
    const yy = -44 + bob;
    dot(0, yy, 21, lane.hurt ? '#c3ea8d' : '#9ad574', '#558d3d');
    dot(-20, yy + 1, 4, '#97c96f'); dot(20, yy + 1, 4, '#97c96f');
    // Green children's faces: two human eyes, eyebrows, cheeks, hair and smile.
    ctx.fillStyle = ['#533d29', '#795531', '#3d3529', '#a2793e'][lane.index % 4];
    ctx.beginPath(); ctx.arc(0, yy - 4, 19, Math.PI, TAU); ctx.lineTo(12, yy - 13); ctx.lineTo(7, yy - 7); ctx.lineTo(2, yy - 14); ctx.lineTo(-5, yy - 7); ctx.lineTo(-10, yy - 13); ctx.closePath(); ctx.fill();
    dot(-7, yy, 5, '#fff9df'); dot(8, yy, 5, '#fff9df');
    dot(-5.5, yy + .5, 2.4, '#32452b'); dot(9.5, yy + .5, 2.4, '#32452b');
    dot(-6.1, yy -.5, .9, '#ffffff'); dot(8.9, yy -.5, .9, '#ffffff');
    dot(-13, yy + 7, 3, '#e1a77977'); dot(14, yy + 7, 3, '#e1a77977');
    ctx.strokeStyle = '#5a873b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1, yy + 3); ctx.lineTo(3, yy + 6); ctx.moveTo(-5, yy + 11); ctx.quadraticCurveTo(1, yy + 16, 8, yy + 10); ctx.stroke();
    const weapon = WEAPON_MAP[lane.weapon], recoil = lane.recoil / .12 * 3;
    rr(13 - recoil, -27, 21, 11, 5, weapon.id === 'frost' ? '#a5dcdf' : weapon.id === 'fire' ? '#e39743' : weapon.id === 'laser' ? '#dbc64e' : '#5caa51', '#367742');
    dot(32 - recoil, -21.5, 6, weapon.id === 'laser' ? '#fffbd0' : '#b7e381', '#3c7b3e'); dot(32 - recoil, -21.5, 3.5, '#25532d');
    if (lane.shield > 0) { ctx.strokeStyle = '#d3eaff99'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -34, 28, Math.PI * .8, Math.PI * 2.2); ctx.stroke(); }
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
    if (type.ability === 1 && !mob.dead) text('+', 20, -77, 12, 13, '#ccffb9', 900);
    if (type.ability === 2) { ctx.strokeStyle = '#ffe9a2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, -31); ctx.lineTo(22, -37); ctx.lineTo(19, -32); ctx.lineTo(27, -33); ctx.stroke(); }
    if (type.ability === 3) { dot(-21, -51, 2, '#e3d6fc'); dot(-25, -45, 1.5, '#e3d6fc'); }
    if (type.ability === 4) text('!', 20, -49, 10, 11, '#ffe4a0', 900);
    if (mob.burn && simTime < mob.burn.until && !mob.dead) { dot(-8, -20, 5 + Math.sin(time * 15), '#ffb04a99'); dot(5, -24, 4, '#ffdf6999'); }
    if (simTime < mob.slowUntil && !mob.dead) { ctx.strokeStyle = '#b3e9fa88'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -42, 24, .4, 4); ctx.stroke(); }
    ctx.restore();
    if (!mob.dead) {
      hpBar(x - 19, floor - 85 * scale, 38, mob.hp, mob.maxHp, mob.boss ? '#ffba5c' : mob.stage ? '#ebbc59' : '#8dce64', 4);
      text(Math.ceil(mob.hp), x, floor - 92 * scale, 48, 8, '#f8ffe8', 800, 'center');
      if (mob.boss) text('HUNGRY', x, floor - 105 * scale, 63, 8, '#ffeabc', 900, 'center');
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
    const headingX = width < 480 ? 99 : 111, headingW = Math.min(width - headingX - 70, 350);
    rr(headingX, 8, headingW, 40, 9, '#183c30e6');
    text(phase === 'idle' ? 'THE LAWN IS READY' : phase === 'result' ? 'FIRST CHOMP · NEXT SPEAKER' : finalWave ? 'FINAL HUNGRY WAVE' : 'DEFEND YOUR GARDEN!', headingX + 10, 22, headingW - 20, width < 480 ? 10 : 13, '#fff4df', 900);
    text(phase === 'idle' ? 'Peas · catapults · lasers · loot' : phase === 'running' ? Math.floor(simTime) + 's · defend the lawn' : winner.entry.name, headingX + 10, 37, headingW - 20, 9, '#bee1b3', 600);
    const lawnBottom = boardHeader + Math.max(1, lanes.length) * laneHeight;
    rr(7, boardHeader - 2, width - 14, lawnBottom - boardHeader + 11, 7, '#8c7147');
    ctx.fillStyle = '#78b447'; ctx.fillRect(12, boardHeader, width - 24, lawnBottom - boardHeader);
    const rail = width < 600 ? 96 : 126;
    ctx.fillStyle = '#344f2ae8'; ctx.fillRect(12, boardHeader, rail, lawnBottom - boardHeader);
    ctx.fillStyle = '#bad377'; ctx.fillRect(12 + rail - 3, boardHeader, 3, lawnBottom - boardHeader);
    for (const lane of lanes) {
      if (!visible(lane)) continue;
      const won = phase === 'result' && winner === lane;
      ctx.save(); ctx.beginPath(); ctx.rect(lane.x, lane.y, lane.w, lane.h); ctx.clip();
      const tileStart = lane.x + lane.rail, tileWidth = (lane.w - lane.rail) / 9;
      for (let col = 0; col < 9; col++) {
        ctx.fillStyle = (col + lane.index) % 2 ? '#75b347' : '#88c058'; ctx.fillRect(tileStart + col * tileWidth, lane.y, tileWidth + .5, lane.h);
      }
      if (won) { ctx.fillStyle = '#fff6b32e'; ctx.fillRect(tileStart, lane.y, lane.w - lane.rail, lane.h); }
      ctx.strokeStyle = '#446b2b28'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lane.x, lane.y + lane.h -.5); ctx.lineTo(lane.x + lane.w, lane.y + lane.h -.5); ctx.stroke();
      dot(lane.x + 10, lane.y + 12, 2.5, lane.entry.color);
      text(lane.entry.name, lane.x + 18, lane.y + 12, lane.rail - 26, 11, won ? '#ffe2a0' : C.cream, 800);
      hpBar(lane.x + 9, lane.y + 23, lane.rail - 19, lane.hp, lane.maxHp, lane.hp < 70 ? '#ff947d' : '#b2e282', 4);
      text(Math.ceil(lane.hp) + '/' + lane.maxHp + (lane.shield ? ' +' + Math.round(lane.shield) : '') + ' HP', lane.x + 9, lane.y + 35, lane.rail - 17, 8, '#dfeec6', 650);
      const weapon = WEAPON_MAP[lane.weapon];
      text('P' + lane.power + ' ' + weapon.icon + ' ' + weapon.name, lane.x + 9, lane.y + 47, lane.rail - 17, 8.5, '#fff0b2', 750);
      if (lane.h >= 80) text(lane.lastLoot ? lane.lastLoot.name : 'Ready to defend', lane.x + 9, lane.y + 62, lane.rail - 17, 8, '#b5d0a4', 600);
      for (let g = lane.rail + 8; g < lane.w; g += 53) {
        ctx.strokeStyle = '#47792e77'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lane.x + g + 9, lane.floor + 3); ctx.lineTo(lane.x + g + 7, lane.floor - 2); ctx.lineTo(lane.x + g + 9, lane.floor + 1); ctx.lineTo(lane.x + g + 13, lane.floor - 2); ctx.stroke();
      }
      plant(lane, time, won ? resultAge : 0);
      [...lane.mobs].sort((a, b) => b.x - a.x).forEach(mob => zombie(lane, mob, time));
      if (won && resultAge > .4) { const badgeX = Math.min(lane.x + lane.w - 121, lane.plantX + 36); rr(badgeX, lane.y + lane.h / 2 - 12, 114, 25, 12, '#ffda72'); text('NEXT SPEAKER', badgeX + 57, lane.y + lane.h / 2 + 1, 107, 10, '#3d492f', 900, 'center'); }
      ctx.restore();
    }
    for (const shot of shots) {
      const lane = lanes[shot.lane], x = lane.plantX + shot.x * lane.travel;
      if (!visible(lane)) continue;
      const y = lane.floor - 22 * lane.spriteScale - (shot.arc ? Math.sin(clamp(shot.x, 0, 1) * Math.PI) * 47 * lane.spriteScale : Math.sin(shot.x * 9 + shot.rotation) * 1.5);
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
      else if (effect.kind === 'beam') { ctx.strokeStyle = '#fffad7'; ctx.shadowColor = '#ffde6a'; ctx.shadowBlur = 10; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lane.plantX + 30 * lane.spriteScale, lane.floor - 23 * lane.spriteScale); ctx.lineTo(x, lane.floor - 41 * lane.zombieScale); ctx.stroke(); }
      ctx.restore();
    }
    for (const drop of drops) {
      const lane = lanes[drop.lane], owner = lanes[drop.ownerLane], p = clamp(drop.age / .8, 0, 1);
      if (!visible(lane) && !visible(owner)) continue;
      const fromX = lane.plantX + drop.x * lane.travel, x = fromX + (owner.plantX - fromX) * p;
      const y = lane.floor - 30 * lane.spriteScale + (owner.floor - lane.floor) * p - Math.sin(p * Math.PI) * 45 * lane.spriteScale;
      ctx.save(); ctx.globalAlpha = 1 - p * .5; dot(x, y, 10, '#fff5b9', '#d29334'); text(drop.item.icon, x, y, 19, 12, '#84632c', 900, 'center'); ctx.restore();
    }
    if (!lanes.length) text('Add names to plant your garden.', 24, 125, width - 48, 17, C.cream, 800);
  }
  function scheduleMusic() {
    if (!audio || audio.state !== 'running') return;
    const bass = [130.81, 155.56, 174.61, 196, 155.56, 146.83, 130.81, 98];
    const melody = [523.25, 0, 622.25, 587.33, 0, 523.25, 466.16, 0, 392, 466.16, 0, 523.25, 622.25, 0, 587.33, 466.16];
    while (nextBeat < audio.currentTime + .22) {
      const at = Math.max(nextBeat, audio.currentTime), i = beat++ % 16;
      const play = (frequency, type, gain, duration) => {
        if (!frequency) return;
        const oscillator = audio.createOscillator(), envelope = audio.createGain();
        oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
        envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(gain, at + .015); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(envelope); envelope.connect(master); oscillator.start(at); oscillator.stop(at + duration + .03);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
      };
      if (i % 2 === 0) play(bass[Math.floor(i / 2)], 'triangle', .2, .44);
      play(melody[i], 'sine', .15, .28);
      if (i % 4 === 3) play(1108.73, 'sine', .025, .07);
      nextBeat = at + 60 / 104 / 2;
    }
  }
  function startMusic() {
    if (!soundEnabled || phase !== 'running' || audio) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio = new Audio(); master = audio.createGain(); master.gain.value = .23; master.connect(audio.destination);
      nextBeat = audio.currentTime + .04; beat = 0;
      const current = audio;
      current.resume().then(() => { if (audio === current && alive && soundEnabled) scheduleMusic(); }).catch(() => {});
      audioTimer = setInterval(scheduleMusic, 100);
    } catch { stopMusic(); }
  }
  function stopMusic() {
    if (audioTimer !== null) clearInterval(audioTimer); audioTimer = null;
    if (audio) { const current = audio; audio = null; try { master?.disconnect(); current.close().catch(() => {}); } catch {} }
    master = null;
  }
  function setSound(enabled) { soundEnabled = Boolean(enabled); if (soundEnabled) startMusic(); else stopMusic(); }
  function frame(timestamp) {
    if (!alive) return;
    const token = generation;
    const visualDt = previous === null ? 0 : Math.min(.08, Math.max(0, (timestamp - previous) / 1000)); previous = timestamp;
    const elapsed = phase === 'idle' ? 0 : Math.max(0, (timestamp - startedAt) / 1000);
    if (phase === 'running') {
      const target = Math.min(elapsed, 35);
      // Fixed simulation steps catch up to real time, including a throttled tab.
      while (phase === 'running' && simTime + .04 <= target + 1e-8) step(.04);
    } else if (phase === 'result') advanceEffects(visualDt);
    if (phase === 'result' && visualResultAt === null) visualResultAt = timestamp;
    const resultAge = phase === 'result' ? Math.max(0, (timestamp - visualResultAt) / 1000) : 0;
    scene(timestamp / 1000, resultAge);
    // Even when a hidden tab resumes after the battle, show the actual wilt/
    // cartoon swallow for 700 ms before asking the host to show its pick popup.
    if (phase === 'result' && !reported && resultAge >= .7) {
      reported = true; onPick?.(winner.entry.id);
    }
    if (alive && token === generation) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!alive || phase !== 'idle' || !lanes.length) return;
    startedAt = performance.now(); phase = 'running'; reported = false; winner = null; visualResultAt = null;
    note.textContent = 'Defend the lawn! Every kill drops an upgrade for the plant that lands the final shot.';
    live.textContent = 'The garden battle is starting.';
    startMusic();
  }
  function reset() {
    if (!alive) return;
    generation++; cancelAnimationFrame(raf); previous = null; stopMusic();
    phase = 'idle'; reported = false; winner = null; resultAt = 0; visualResultAt = null;
    fresh(); viewport.scrollTop = 0;
    note.textContent = '100 zombie builds · 100 loot upgrades · Real damage, real defeats. First plant eaten speaks next.';
    live.textContent = ''; canvas.setAttribute('aria-label', 'Fresh garden ready. Every child-faced plant starts with 300 health and the same pea shooter.');
    raf = requestAnimationFrame(frame);
  }
  function destroy() {
    if (!alive) return;
    alive = false; generation++; cancelAnimationFrame(raf); observer?.disconnect(); stopMusic();
    if (!observer) window.removeEventListener('resize', layout);
    shots = []; effects = []; drops = []; lanes = []; root.remove();
  }
  function getState() {
    return { phase, time: simTime, winnerId: winner?.entry.id ?? null, soundEnabled,
      zombieCatalogCount: ZOMBIE_CATALOG.length, lootCatalogCount: LOOT_CATALOG.length, healthModel: HEALTH_MODEL,
      lanes: lanes.map(lane => ({ id: lane.entry.id, hp: lane.hp, maxHp: lane.maxHp, damage: lane.damage, cooldown: lane.cooldown, weapon: lane.weapon, power: lane.power, kills: lane.kills, loot: [...lane.loot], eaten: lane.eaten, shield: lane.shield,
        mobs: lane.mobs.map(mob => ({ id: mob.uid, variant: mob.type.id, hp: mob.hp, maxHp: mob.maxHp, bodyHp: mob.bodyHp, armorHp: mob.armorHp, dead: mob.dead, stage: mob.stage, x: mob.x, lastShooter: mob.lastShooter, boss: mob.boss })) })),
      combatLog: combatLog.map(entry => ({ ...entry })) };
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
  fresh(); observer?.observe(root); if (!observer) window.addEventListener('resize', layout);
  raf = requestAnimationFrame(frame);
  return { start, reset, destroy, setSound, getState };
}