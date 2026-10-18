import { createGardenRenderer, drawGardenPlantUpgrade } from './garden-rig.js?v=20261016-lanes';
import { GARDEN_RULES, PLANT_BY_ID, ZOMBIE_BY_ID, getSplashDamage } from './garden-rules.js?v=20261013-garden';
import { createGardenFX } from './garden-fx.js?v=20261013-garden';
import { createGardenMonsters, GARDEN_MONSTER_TYPES, GARDEN_MONSTER_HEIGHT } from './garden-monsters.js?v=20261018-avatars';

/**
 * Plants vs. Zombies. A real, symmetric classroom lane battle.
 * These adjustable health values are custom PvZ-inspired rules, not a claim of
 * exact parity with any edition of Plants vs. Zombies.
 */
export const HEALTH_MODEL = Object.freeze({ label: 'Fixed source-family zombie statistics; larger waves supply difficulty', exactParityVerified: false, plantHealth: 300, studentHealth: 150, normalBodyHealth: 270, coneArmorHealth: 370, bucketArmorHealth: 1100, footballArmorHealth: 1400, peaDamage: 20 });
// One hundred stable roster IDs retain cosmetic identity. Combat statistics
// come from six fixed source families; costumes never add durability or dodge.
const REGULAR_FAMILIES = ['walker', 'cone', 'bucket', 'football', 'pole', 'newspaper'];
export const ZOMBIE_CATALOG = Object.freeze(Array.from({ length: 100 }, (_, index) => {
  const rule = ZOMBIE_BY_ID[REGULAR_FAMILIES[index % REGULAR_FAMILIES.length]];
  return Object.freeze({
    id: 'z' + String(index + 1).padStart(3, '0'), family: rule.id, name: rule.name,
    visualType: rule.visualType || rule.id, archetype: rule.id === 'pole' ? 2 : rule.id === 'newspaper' ? 1 : 0, armor: rule.armor || 0, ability: 0,
    health: rule.hp, bodyHealth: rule.bodyHp, armorHealth: rule.armorHp || 0, shieldHealth: rule.shieldHp || 0,
    speed: rule.speed / (GARDEN_RULES.tileWidth * GARDEN_RULES.columns), bite: rule.biteDamage, biteCadence: rule.biteInterval,
    enragedSpeed: (rule.enragedSpeed || rule.speed) / (GARDEN_RULES.tileWidth * GARDEN_RULES.columns), rageWindup: rule.frenzyWindup || 0,
    resistance: 0, regeneration: 0, dodge: 0, rush: 1, frenzy: 1,
    face: ['#a9ca79', '#94bd7e', '#b8ce87', '#86b68a', '#a1c18a'][index % 5],
    jacket: ['#836045', '#9b6b48', '#755640', '#946a51', '#806749'][index % 5],
    tie: ['#b94136', '#d27238', '#964944', '#d9a447', '#803f48'][Math.floor(index / 5) % 5],
    brow: index % 5, nose: index % 5, buttons: index % 4 + 1,
  });
}));

// Classroom cameos use ordinary health, armor and bite mechanics.
// They are rare members of later waves, never a timed selection shortcut.
export const GIANT_CATALOG = Object.freeze([
  { id: 'labubu', name: 'Labubu', health: 1700, bodyHealth: 1700, armorHealth: 0, speed: .015, bite: 62, biteCadence: .58 },
  { id: 'niulai', name: 'Niulai', health: 2100, bodyHealth: 1800, armorHealth: 300, speed: .011, bite: 105, biteCadence: 1.02 },
  { id: 'duck', name: 'Giant Duck', health: 1550, bodyHealth: 1550, armorHealth: 0, speed: .017, bite: 48, biteCadence: .44 },
  { id: 'mummy', name: 'Mummy', health: 2250, bodyHealth: 1900, armorHealth: 350, speed: .010, bite: 90, biteCadence: .86 },
  { id: 'hellokitty', name: 'Hello Kitty', health: 1650, bodyHealth: 1650, armorHealth: 0, speed: .0145, bite: 55, biteCadence: .52 },
  { id: 'ultraman', name: 'Ultraman', health: 2400, bodyHealth: 1700, armorHealth: 700, speed: .0115, bite: 100, biteCadence: 1 },
  { id: 'teamrocket', name: 'Team Rocket', health: 1950, bodyHealth: 1600, armorHealth: 350, speed: .0125, bite: 75, biteCadence: .70 },
  { id: 'pikachu', name: 'Pikachu', health: 1500, bodyHealth: 1500, armorHealth: 0, speed: .018, bite: 45, biteCadence: .40 },
  { id: 'dogman', name: 'Dog Man', health: 2050, bodyHealth: 1800, armorHealth: 250, speed: .0135, bite: 82, biteCadence: .78 },
  { id: 'pennywise', name: 'Pennywise', health: 1700, bodyHealth: 1700, armorHealth: 0, speed: .017, bite: 55, biteCadence: .7 },
  { id: 'zombieclown', name: 'Zombie Clown', health: 1350, bodyHealth: 1350, armorHealth: 0, speed: .022, bite: 42, biteCadence: .6 },
  { id: 'demolisher', name: 'Demolisher', health: 2200, bodyHealth: 1700, armorHealth: 500, speed: .012, bite: 65, biteCadence: .9, explosionDamage: 260 },
  { id: 'mutated', name: 'Mutated Zombie', health: 1800, bodyHealth: 1800, armorHealth: 0, speed: .014, bite: 75, biteCadence: .8 },
  { id: 'irradiated', name: 'Irradiated Mutant', health: 1500, bodyHealth: 1500, armorHealth: 0, speed: .020, bite: 50, biteCadence: .65 },
].map(monster => Object.freeze({ ...monster, giant: true, monsterId: monster.id, classification: 'cameo', archetype: 0, armor: 0, ability: 0, resistance: 0, regeneration: 0, dodge: 0, rush: 1, frenzy: 1 })));
export const MINI_ZOMBIE = Object.freeze({ id: 'minecraft-zombie', name: 'Mini Minecraft Zombie', health: 180, bodyHealth: 180, armorHealth: 0, speed: .024, bite: 40, biteCadence: .7, giant: true, miniature: true, monsterId: 'minecraft-zombie', classification: 'cameo', archetype: 0, armor: 0, ability: 0, resistance: 0, regeneration: 0, dodge: 0, rush: 1, frenzy: 1 });
export const PICKER_VISUAL_TIMING = Object.freeze({ cherryFuse: 3, cherryBurstWallSeconds: .95, melonVelocityFactor: .53, melonImpactTimeScale: .65 });
const BASE_CADENCE = PLANT_BY_ID.pea.interval;
export const PICKER_PACING = Object.freeze({ peaInterval: BASE_CADENCE, upgradeMinimumInterval: PLANT_BY_ID.pea.intervalMin, projectileTilesPerSecond: 4.16, firstZombie: 3, spawnMinimum: 6.4, spawnMaximum: 8.4, zombieStatScaling: false, melonSplashTileRadius: 1.5, geometry: 'Readable 3-by-3 tile splash adaptation; original damage and crowded-target cap' });
export const PICKER_HORDE = Object.freeze({ firstWindow: 24, minimumWindow: 12, windowStep: 2, initialLive: 12, liveStep: 12, maximumLive: 96, initialBurst: 3, burstStep: 2, maximumBurst: 12, queueBuffer: 64 });
export function getPickerHordePressure(wave) {
  const level = Math.max(0, Math.floor(wave) - 1), cadence = 1 + level * .5;
  return { waveSeconds: Math.max(PICKER_HORDE.minimumWindow, PICKER_HORDE.firstWindow - level * PICKER_HORDE.windowStep),
    liveLimit: Math.min(PICKER_HORDE.maximumLive, PICKER_HORDE.initialLive + level * PICKER_HORDE.liveStep),
    burst: Math.min(PICKER_HORDE.maximumBurst, PICKER_HORDE.initialBurst + level * PICKER_HORDE.burstStep),
    spawnMinimum: Math.max(.12, .45 / cadence), spawnJitter: .25 / cadence };
}
const classicWeapon = (id, icon) => ({ ...PLANT_BY_ID[id], icon, classification: 'classic', sourceHealth: PLANT_BY_ID[id].hp, sourceDamage: PLANT_BY_ID[id].damage, multiplier: PLANT_BY_ID[id].damage / 20, cooldown: PLANT_BY_ID[id].interval / BASE_CADENCE, slow: PLANT_BY_ID[id].slow < 1 ? PLANT_BY_ID[id].slow : undefined, pierce: 1, radius: 0 });
// Keep these ten legacy IDs in order so every existing loot ID remains valid.
const WEAPONS = [
  classicWeapon('pea', '●'), classicWeapon('twin', '●●'), classicWeapon('burst', '•••'), classicWeapon('frost', '❄'),
  { ...classicWeapon('twin', '●●'), id: 'fire', aliasOf: 'twin' },
  classicWeapon('pierce', '➤'), classicWeapon('catapult', '◒'), classicWeapon('splash', '✺'),
  { ...classicWeapon('gatling', '••••'), id: 'laser', aliasOf: 'gatling' },
  { ...classicWeapon('pierce', '➤'), id: 'thorn', aliasOf: 'pierce' },
];
const EXTRA_WEAPONS = [classicWeapon('gatling', '••••'), classicWeapon('wintermelon', '◒❄')];
const SHOOTERS = [...WEAPONS, ...EXTRA_WEAPONS];
const BLOCKERS = [
  { ...PLANT_BY_ID.walnut, classification: 'classic', sourceHealth: PLANT_BY_ID.walnut.hp, modeScaling: 1200 / PLANT_BY_ID.walnut.hp, icon: '◉', blocker: true, hp: 1200, contactDamage: 0, multiplier: 0, cooldown: 1, count: 0, pierce: 0, radius: 0 },
  { ...PLANT_BY_ID.tallnut, classification: 'classic', sourceHealth: PLANT_BY_ID.tallnut.hp, modeScaling: 1800 / PLANT_BY_ID.tallnut.hp, icon: '▣', blocker: true, hp: 1800, contactDamage: 0, multiplier: 0, cooldown: 1, count: 0, pierce: 0, radius: 0 },
  { id: 'chestnut', name: 'Custom Chestnut', classification: 'custom', icon: '✹', blocker: true, hp: 950, contactDamage: 18, multiplier: 0, cooldown: 1, count: 0, pierce: 0, radius: 0 },
];
export const PLANT_CATALOG = Object.freeze([...SHOOTERS, ...BLOCKERS].map(plant => Object.freeze({ ...plant })));
const AFFIXES = [
  { name: 'Fierce', damage: 1, description: '+1 base pea damage' },
  { name: 'Rapid', rate: .99, description: 'slightly faster attacks' },
  { name: 'Vital', maxHp: 3, heal: 16, description: '+16 health' },
  { name: 'Guarded', shield: 9, description: '+9 shield' },
  { name: 'Lucky', crit: .04, description: 'more critical hits' },
  { name: 'Swift', velocity: .10, rate: .995, description: 'slightly faster shots' },
  { name: 'Serrated', penetration: .05, description: 'pierce armor' },
  { name: 'Kind', damage: 1, heal: 7, description: '+damage and health' },
  { name: 'Blooming', splash: .012, description: 'wider splash damage' },
  { name: 'Sturdy', maxHp: 5, damage: 1, description: '+maximum health' },
];
export const LOOT_CATALOG = Object.freeze(WEAPONS.flatMap((weapon, a) => AFFIXES.map((affix, b) => Object.freeze({
  id: 'l' + String(a * 10 + b + 1).padStart(3, '0'), name: affix.name + ' ' + weapon.name,
  weapon: weapon.id, icon: weapon.icon, description: affix.description, effects: Object.freeze({ ...affix }),
}))));
const WEAPON_MAP = Object.fromEntries(PLANT_CATALOG.map(item => [item.id, item]));
const STARTERS = ZOMBIE_CATALOG.filter(item => item.armor === 0);
const DEFENDER_POSITIONS = [.14, .25, .36, .47, .60];
export const LAWNMOWER_RULES = Object.freeze({ home: .05, radius: .026, speed: .88, exit: 1.16 });
/** Continuous relative motion prevents a fast sweep from skipping a zombie. */
export function mowerIntersects(fromX, toX, oldMobX, newMobX, radius = LAWNMOWER_RULES.radius) {
  const from = oldMobX - fromX, to = newMobX - toX;
  return Math.min(from, to) <= radius + 1e-9 && Math.max(from, to) >= -radius - 1e-9;
}
const STUDENT_HEALTH = 150;
const TAU = Math.PI * 2;
const C = { navy: '#101b33', mint: '#7bd8c9', coral: '#ff735e', gold: '#f8c75a', cream: '#fff4df' };
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const plantDamageStage = (hp, maxHp) => clamp(Math.floor((1 - clamp(hp / Math.max(1, maxHp), 0, 1)) * 5 + 1e-8), 0, 4);
const identityHash = value => { let hash = 2166136261; for (const char of String(value)) hash = Math.imul(hash ^ char.codePointAt(0), 16777619) >>> 0; return hash; };
export const STUDENT_EMOTIONS = Object.freeze(['happy', 'attentive', 'concern', 'sad', 'worried', 'fearful', 'scared', 'terrified', 'hurt', 'dazed']);
export function studentEmotionState(lane) {
  const maximum = Math.max(1, lane.maxHp || 150), health = clamp(lane.hp / maximum, 0, 1);
  const nearest = Math.min(1.1, ...(lane.mobs || []).filter(mob => !mob.dead).map(mob => mob.x));
  const threatened = Math.max(lane.wave > 0 ? 1 : 0, clamp(Math.floor((1 - nearest) / .125), 0, 7));
  const stage = health <= 0 ? 9 : health < 1 ? 8 : threatened;
  return { stage, label: STUDENT_EMOTIONS[stage], bruiseStage: health >= 1 ? 0 : health > .65 ? 1 : health > .30 ? 2 : 3 };
}

/** A kill can happen once, and always records the owner of the lethal damage. */
export function damageZombie(mob, shot) {
  if (mob.dead || mob.hp <= 0) return { damage: 0, killed: false };
  const armor = Math.max(0, (mob.resistance || 0) - (mob.stage >= 2 ? .05 : 0));
  const damage = Math.max(0, shot.damage || 0) * (1 - armor);
  let actual = Math.min(mob.hp, damage);
  if (typeof mob.armorHp === 'number' && typeof mob.bodyHp === 'number') {
    // Serrated loot really bypasses armor; it can wound/defeat the body while
    // an outer armor piece is still intact. Ordinary peas hit armor first.
    const before = mob.hp;
    let remaining = damage;
    if (mob.shieldHp > 0 && !shot.bypassesShield) {
      const shieldDamage = Math.min(mob.shieldHp, remaining);
      mob.shieldHp = Math.max(0, mob.shieldHp - shieldDamage);
      if (!shot.hitsShieldAndBody) remaining -= shieldDamage;
    }
    const bypass = remaining * clamp(shot.penetration || 0, 0, 1);
    const absorbed = Math.min(mob.armorHp, remaining - bypass);
    mob.armorHp = Math.max(0, mob.armorHp - absorbed);
    mob.bodyHp = Math.max(0, mob.bodyHp - (remaining - absorbed));
    mob.hp = mob.bodyHp <= 0 ? 0 : mob.armorHp + mob.bodyHp + (mob.shieldHp || 0);
    actual = Math.max(0, before - mob.hp);
  } else mob.hp = Math.max(0, mob.hp - damage);
  if (actual > 0) { mob.lastShooter = shot.ownerId; mob.lastAttacker = shot.attackerId ?? mob.lastAttacker ?? null; }
  const body = mob.bodyHp ?? mob.hp, maximum = mob.maxBodyHp ?? mob.maxHp;
  mob.stage = Math.max(mob.stage || 0, body < maximum * GARDEN_RULES.zombie.headLossRatio ? 2 : body < maximum * GARDEN_RULES.zombie.armLossRatio ? 1 : 0);
  if (!mob.type?.giant && body < maximum * GARDEN_RULES.zombie.headLossRatio) mob.headless = true;
  mob.hurt = .14;
  if (mob.hp <= 0) { mob.dead = true; return { damage: actual, killed: true }; }
  return { damage: actual, killed: false };
}

export default function createGame({ container, names = [], onPick, random = Math.random, sound = false, speed = 1, artwork = {} }) {
  const rng = () => clamp(Number(random()) || 0, 0, 1 - Number.EPSILON);
  const players = names.map((entry, index) => ({ ...entry, avatar: ['boy', 'girl', 'neutral'].includes(entry.avatar) ? entry.avatar : 'neutral', avatarIndex: identityHash(entry.id || entry.name || ''), name: String(entry.name ?? 'Gardener ' + (index + 1)), color: entry.color || [C.mint, C.coral, C.gold][index % 3] }));
  const root = document.createElement('div');
  root.className = 'garden-siege';
  root.innerHTML = '<style>.garden-siege{width:100%;height:100%;min-height:0;overflow:hidden;background:#101b33;color:#fff4df;position:relative}.garden-siege .garden-window{position:absolute;inset:0;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#7bd8c955 #101b33}.garden-siege canvas{display:block;outline:none}.garden-siege .garden-note{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}.garden-siege .garden-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style><div class="garden-window"><canvas role="img" tabindex="0"></canvas></div><div class="garden-note">Plants vs. Zombies: sunshine grows your defenders. Each student has one single-use lawnmower.</div><div class="garden-live" aria-live="polite"></div>';
  container.appendChild(root);
  const canvas = root.querySelector('canvas'), viewport = root.querySelector('.garden-window');
  const note = root.querySelector('.garden-note'), live = root.querySelector('.garden-live');
  const ctx = canvas.getContext('2d');
  const renderer = createGardenRenderer({ artwork });
  const fx = createGardenFX({ artwork });
  const monsters = createGardenMonsters({ artwork });
  canvas.setAttribute('aria-label', 'Plants vs. Zombies name picker. Each student starts behind a pea shooter, a front Tall-nut, and one single-use lawnmower. Suns recruit shooters, Potato Mines, Torchwood, and Cherry Bombs. Every lane faces 5, then 50, 100, 200, and doubling zombie quotas; excess zombies wait behind the live limit. The first student out of health speaks next.');
  let alive = true, raf = 0, generation = 0, phase = 'idle', reported = false, winner = null, winnerSnapshot = null;
  let width = 1000, height = 560, laneHeight = 88, boardHeader = 64, boardFooter = 12, viewportHeight = 560, lanes = [];
  let simTime = 0, startedAt = 0, resultAt = 0, visualResultAt = null, previous = null, focused = false, serial = 0;
  let renderFraction = 1, renderTime = 0;
  const visualBetween = (before, value) => Number.isFinite(before) ? before + (value - before) * renderFraction : value;
  const visualMob = mob => renderFraction < 1 ? { ...mob, x: visualBetween(mob.renderPreviousX, mob.x), animationTime: visualBetween(mob.renderPreviousAnimation, mob.animationTime) } : mob;
  const validSpeed = value => clamp(Number.isFinite(Number(value)) ? Number(value) : 1, 1, 100);
  let playbackRate = validSpeed(speed), clockRate = playbackRate, clockAt = null, simulationBudget = 0;
  let waveIndex = 0, nextWaveAt = PICKER_PACING.firstZombie;
  let impacts = [], pickupFlights = [], wallTime = 0;
  let shots = [], pendingShots = [], effects = [], drops = [], combatLog = [], soundEnabled = Boolean(sound);
  let audio = null, audioTimer = null, master = null, sfxMaster = null, beat = 0, nextBeat = 0, audioEpoch = 0, audioLoadController = null;
  const sampleBuffers = new Map(), sfxVoices = new Set(), musicVoices = new Set(), lastSfx = new Map(), sfxRotation = new Map();
  const soundGaps = { shot: .085, gatling: 0, sun: .10, hit: .075, armor: .22, growl: 1.65, bite: .16, plant: .28, pickup: .16, death: .25, intro: 5, villager: 12, villagerYes: 4 };
  const soundGains = { shot: .42, gatling: .35, hit: .36, armor: .50, growl: .66, bite: .48, plant: .54, pickup: .52, death: .57, intro: .68, villager: .62, villagerYes: .55 };
  const sampleURLs = Object.fromEntries(Object.keys(soundGaps).map(key => [key, (Array.isArray(artwork?.gardenSounds?.[key]) ? artwork.gardenSounds[key] : [artwork?.gardenSounds?.[key]]).filter(url => typeof url === 'string' && url.length > 0)]));
  if (!sampleURLs.gatling.length) sampleURLs.gatling = [...sampleURLs.shot];
  let rewards = [], nextReward = 1.30;
  let introPlayed = false, nextVillagerSoundWall = 0;
  let mowerArt = null, mowerLoadController = null;
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
  function loadMowerArtwork() {
    const ImageType = window.Image || globalThis.Image;
    if (typeof ImageType !== 'function') return;
    const accept = manifest => {
      if (!alive || !manifest?.assets || !Array.isArray(manifest.tracks) || !Array.isArray(manifest.origin)) return;
      const filenames = [...new Set(manifest.tracks.map(track => track.image).filter(name => manifest.assets[name]?.url))];
      if (!filenames.length) return;
      const record = { manifest, images: new Map(), ready: false, failed: false }; mowerArt = record;
      let loaded = 0;
      for (const name of filenames) {
        const image = new ImageType(); record.images.set(name, image);
        image.onload = () => {
          if (!alive || mowerArt !== record) return;
          if (!image.naturalWidth || !image.naturalHeight) record.failed = true;
          if (++loaded === filenames.length) record.ready = !record.failed;
        };
        image.onerror = () => { if (alive && mowerArt === record) record.failed = true; };
        image.src = manifest.assets[name].url;
      }
    };
    if (artwork?.gardenMowerManifest) { accept(artwork.gardenMowerManifest); return; }
    if (!artwork?.gardenMower || typeof fetch !== 'function') return;
    const controller = typeof AbortController === 'function' ? new AbortController() : null; mowerLoadController = controller;
    fetch(artwork.gardenMower, controller ? { signal: controller.signal } : undefined).then(response => response.ok ? response.json() : null).then(accept).catch(() => {}).finally(() => { if (mowerLoadController === controller) mowerLoadController = null; });
  }
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
    // Measure the host, rather than a canvas-inflated scroll area. Observing
    // all three boxes also corrects the first frame when flex layout settles.
    const hostRect = container.getBoundingClientRect?.();
    width = Math.max(620, Math.round(container.clientWidth || hostRect?.width || root.clientWidth || 1000));
    const measured = [container.clientHeight, hostRect?.height, root.clientHeight, viewport.clientHeight].filter(value => Number.isFinite(value) && value > 0);
    const available = Math.max(1, Math.floor(measured.length ? Math.min(...measured) : 560));
    viewportHeight = available;
    const rows = Math.max(1, players.length);
    // One board and one horizontal lane per player. Large rosters scroll down
    // the same lawn rather than becoming a collection of separate mini-games.
    boardHeader = available >= 650 ? 64 : available >= 580 ? 36 : 24;
    const desiredFooter = available >= 650 ? 88 : available >= 580 ? 56 : 24;
    boardFooter = players.length <= 10 ? Math.min(desiredFooter, Math.max(0, available - boardHeader - rows * 80)) : 12;
    laneHeight = players.length <= 10 ? Math.max(1, (available - boardHeader - boardFooter) / Math.max(2, rows)) : 100;
    height = players.length <= 10 ? available : Math.max(available, boardHeader + rows * laneHeight + boardFooter);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const lane of lanes) {
      lane.x = 12; lane.y = boardHeader + lane.index * laneHeight;
      lane.w = width - 24; lane.h = laneHeight; lane.rail = 88;
      // Keep the student's portrait beside its quiet name/health tag. The
      // five defenders occupy separate tiles immediately to the right.
      lane.plantX = lane.x + 73; lane.floor = lane.y + lane.h - 5;
      lane.travel = lane.w - 95;
      lane.spriteScale = Math.min(clamp((lane.h - 12) / 110, .12, 1.2), lane.travel * .11 / 85);
      // Ordinary enemies retain their original size. Giants share this scale
      // and extend across the lawn behind foreground students and defenders.
      lane.zombieScale = clamp((lane.h - 4) / 113, .20, 1);
      lane.nameWidth = Math.max(76, Math.min(174, .14 * lane.travel - 7));
    }
  }
  function newDefender(slot, weapon = 'pea', recruited = false) {
    const health = WEAPON_MAP[weapon].hp || 300;
    return { uid: 'd' + (++serial), slot, position: DEFENDER_POSITIONS[slot], weapon, hp: health, maxHp: health, shield: 0,
      power: 0, nextShot: recruited ? simTime + .50 : .50, bornAt: recruited ? simTime : -1, eaten: false, eatenAt: 0,
      recoil: 0, hurt: 0, shotsFired: 0, kills: 0 };
  }
  function fresh() {
    serial = 0;
    // Random placement makes each name equally likely to occupy every lane;
    // every lane still uses identical starting statistics and threat rules.
    const placement = [...players];
    for (let i = placement.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [placement[i], placement[j]] = [placement[j], placement[i]]; }
    lanes = placement.map((entry, index) => ({ entry, index, x: 0, y: 0, w: 0, h: 0, plantX: 0, floor: 0, travel: 0,
      hp: STUDENT_HEALTH, maxHp: STUDENT_HEALTH, damage: 20, cooldown: BASE_CADENCE, velocity: PICKER_PACING.projectileTilesPerSecond, penetration: 0, splash: 0, crit: 0,
      power: 0, kills: 0, loot: [], suns: 0, stars: 0, shotsFired: 0, nextSpawn: PICKER_PACING.firstZombie, nextWave: PICKER_PACING.firstZombie, wave: 0, waveSize: 0, waveTarget: 0, waveSpawned: 0, deferredSpawns: 0, queuedSpawns: 0, nextGrowl: 5 + index % 5, mobs: [], defenders: [newDefender(0), newDefender(4, 'tallnut')], emotionStage: 0, bruiseStage: 0,
      mower: { uid: 'mower-' + index, status: 'ready', x: LAWNMOWER_RULES.home, previousX: LAWNMOWER_RULES.home, activations: 0, kills: 0, killIds: [], activatedAt: null, spentAt: null, triggeredBy: null },
      trap: null, torchwood: null, bomb: null, collectionAt: -Infinity, collectedKind: null, eaten: false, hurt: 0, lastLoot: null }));
    shots = []; pendingShots = []; effects = []; impacts = []; pickupFlights = []; drops = []; rewards = []; nextReward = 1.30; combatLog = []; simTime = 0; focused = false; introPlayed = false;
    waveIndex = 0; nextWaveAt = PICKER_PACING.firstZombie;
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
  function pickupFlight(lane, owner, source) {
    pickupFlights.push({ ...source, lane: lane.index, ownerLane: owner.index, startedWall: performance.now(), duration: Math.max(.6, 1.1 / playbackRate), completed: false });
    pickupFlights = pickupFlights.slice(-180);
  }
  function recruitDefender(lane, weapon, source) {
    // A new plant grows between the student and approaching zombies. It cannot
    // spring up behind a zombie that has already passed that lawn tile.
    if (lane.eaten) return null;
    const nearest = Math.min(1.2, ...lane.mobs.filter(mob => !mob.dead).map(mob => mob.x));
    const blocker = Boolean(WEAPON_MAP[weapon].blocker);
    const slot = DEFENDER_POSITIONS.findIndex((position, index) => (blocker ? index === 4 : index < 4) && !lane.defenders.some(defender => defender.slot === index && !defender.eaten) && position + .04 < nearest);
    if (slot < 0) return null;
    const defender = newDefender(slot, weapon, true), old = lane.defenders.findIndex(item => item.slot === slot);
    if (old >= 0) lane.defenders[old] = defender; else lane.defenders.push(defender);
    particle(lane, defender.position, '#e2f98f', 16, true);
    effects.push({ kind: 'text', lane: lane.index, x: defender.position, y: -65, vy: -14, life: .85, color: '#fff3ab', value: '+ ' + WEAPON_MAP[weapon].icon });
    addLog({ type: 'recruit', source, ownerId: lane.entry.id, defenderId: defender.uid, weapon, slot, role: blocker ? 'blocker' : 'shooter', health: defender.hp });
    playSfx('plant', lane);
    return defender;
  }
  function newShooterType(lane) {
    const current = new Set(livingDefenders(lane).map(defender => defender.weapon));
    const pool = SHOOTERS.filter(weapon => !current.has(weapon.id));
    return (pool.length ? pool : SHOOTERS)[Math.floor(rng() * (pool.length || SHOOTERS.length))].id;
  }
  function nextPlantType(lane, allowBlocker = true) {
    const living = livingDefenders(lane), blockers = living.filter(defender => WEAPON_MAP[defender.weapon].blocker);
    if (allowBlocker && living.length - blockers.length >= 2 && rng() < (blockers.length ? .14 : .34)) return BLOCKERS[Math.floor(rng() * BLOCKERS.length)].id;
    return newShooterType(lane);
  }
  function evolveDefender(defender, weapon) {
    const before = WEAPON_MAP[defender.weapon], after = WEAPON_MAP[weapon];
    if (Boolean(before.blocker) !== Boolean(after.blocker)) return;
    const ratio = defender.hp / Math.max(1, defender.maxHp), bonus = Math.max(0, defender.maxHp - (before.hp || 300));
    defender.weapon = weapon; defender.maxHp = (after.hp || 300) + bonus; defender.hp = Math.min(defender.maxHp, defender.maxHp * ratio);
  }
  function promoteDefender(lane, defender, source) {
    if (!defender || defender.eaten) return false;
    const before = defender.weapon, rank = defender.power;
    const next = before === 'pea' ? rank >= 6 ? 'gatling' : rank >= 3 ? 'twin' : before
      : ['twin', 'fire'].includes(before) && rank >= 6 ? 'gatling'
      : before === 'catapult' && rank >= 6 ? 'wintermelon'
      : ['walnut', 'chestnut'].includes(before) && rank >= 3 ? 'tallnut' : before;
    if (next === before) return false;
    // A complete source model changes only when its actual attack/defense
    // changes too. Health fraction and earned health bonuses survive growth.
    evolveDefender(defender, next);
    addLog({ type: 'plantEvolution', ownerId: lane.entry.id, defenderId: defender.uid, from: before, to: next, power: rank, source });
    return true;
  }
  function giveLoot(owner, item) {
    const e = item.effects;
    owner.damage = clamp(owner.damage + (e.damage || 0), 20, 24);
    owner.cooldown = clamp(owner.cooldown * (e.rate || 1), PICKER_PACING.upgradeMinimumInterval, BASE_CADENCE);
    owner.crit = clamp(owner.crit + (e.crit || 0), 0, .12);
    owner.velocity = clamp(owner.velocity + (e.velocity || 0), PICKER_PACING.projectileTilesPerSecond, 4.8);
    owner.penetration = clamp(owner.penetration + (e.penetration || 0), 0, .15);
    owner.splash = clamp(owner.splash + (e.splash || 0), 0, .025);
    const living = livingDefenders(owner);
    let target = null, action = 'upgrade';
    const defensiveLoot = Boolean(e.shield || e.maxHp);
    let weapon = defensiveLoot && living.filter(defender => !WEAPON_MAP[defender.weapon].blocker).length >= 2 && rng() < .45 ? BLOCKERS[Math.floor(rng() * BLOCKERS.length)].id : item.weapon;
    if (living.length < DEFENDER_POSITIONS.length && rng() < .38) { target = recruitDefender(owner, weapon, 'loot'); if (target) action = 'recruit'; }
    const eligible = living.filter(defender => Boolean(WEAPON_MAP[defender.weapon].blocker) === Boolean(WEAPON_MAP[weapon].blocker));
    target ||= eligible[Math.floor(rng() * eligible.length)];
    if (!target && living.length) { target = living[Math.floor(rng() * living.length)]; weapon = WEAPON_MAP[target.weapon].blocker ? target.weapon : item.weapon; }
    if (target) {
      evolveDefender(target, weapon); target.power = Math.min(10, target.power + 1);
      if (promoteDefender(owner, target, 'loot') && action !== 'recruit') action = 'evolve';
      const baseHp = WEAPON_MAP[target.weapon].hp || 300;
      target.maxHp = clamp(target.maxHp + (e.maxHp || 0), baseHp, baseHp + 150);
      target.hp = Math.min(target.maxHp, target.hp + (e.heal || 0) + (e.maxHp || 0));
      target.shield = clamp(target.shield + (e.shield || 0), 0, 40);
      effects.push({ kind: 'text', lane: owner.index, x: 0, y: -65, vy: -15, life: .8, color: '#fff2ac', value: item.name });
    }
    owner.power = Math.min(10, owner.power + 1); owner.lastLoot = item;
    owner.loot.push(item.id); if (owner.loot.length > 100) owner.loot.shift();
    return { action, defenderId: target?.uid ?? null, weapon: target?.weapon ?? weapon };
  }
  function killed(lane, mob, method = 'plant') {
    mob.deathAt = simTime;
    const owner = method !== 'plant' ? null : lanes.find(player => player.entry.id === mob.lastShooter);
    const item = LOOT_CATALOG[mob.lootIndex];
    if (owner && !owner.eaten) {
      owner.kills++; const attacker = owner.defenders.find(defender => defender.uid === mob.lastAttacker); if (attacker) attacker.kills++;
    }
    if (method !== 'plant') (lanes.find(player => player.entry.id === mob.lastShooter) || lane).kills++;
    else if (owner && !owner.eaten) {
      drops.push({ lane: lane.index, ownerLane: owner.index, ownerId: owner.entry.id, attackerId: mob.lastAttacker, zombieId: mob.uid, x: mob.x, age: 0, life: 1.1, item });
      pickupFlight(lane, owner, { kind: 'loot', x: mob.x, y: -30 * lane.spriteScale, item });
    }
    particle(lane, mob.x, '#c3e19b', 12, true);
    addLog({ type: 'kill', zombieId: mob.uid, variant: mob.type.id, ownerId: mob.lastShooter, attackerId: mob.lastAttacker, method, lootId: method !== 'plant' ? null : item.id });
    playSfx('death', lane);
  }
  function hit(lane, mob, shot, dotDamage = false) {
    if (mob.dead) return;
    const hadArmor = mob.armorHp > 0, hadShield = mob.shieldHp > 0, previousStage = mob.stage;
    const result = damageZombie(mob, shot);
    if (hadShield && mob.shieldHp <= 0 && mob.type.family === 'newspaper') { mob.enragedAt = simTime + mob.type.rageWindup; addLog({ type: 'newspaperLost', zombieId: mob.uid, rageAt: mob.enragedAt }); }
    if (previousStage < 1 && mob.stage >= 1) mob.armDropAt = simTime;
    if (previousStage < 2 && mob.stage >= 2) mob.headDropAt = simTime;
    if (hadArmor && mob.armorHp <= 0) {
      particle(lane, mob.x, '#d1c7a5', 9, true);
      float(lane, mob, 'ARMOR OFF', '#fff0bf');
      addLog({ type: 'armorBreak', zombieId: mob.uid, ownerId: shot.ownerId });
      playSfx('armor', lane);
    }
    if (result.damage <= 0) return;
    addLog({ type: 'damage', weapon: shot.weapon ?? 'damage-over-time', ownerId: shot.ownerId, attackerId: shot.attackerId, zombieId: mob.uid, laneId: lane.entry.id, damage: result.damage, remainingHp: mob.hp });
    if (!dotDamage) {
      playSfx('hit', lane);
      float(lane, mob, Math.round(result.damage), shot.critical ? C.gold : '#fff5cd');
      particle(lane, mob.x, shot.projectileStyle === 'fire' ? '#ffb875' : shot.slow < 1 ? '#b3edff' : shot.stunDuration ? '#fff19c' : '#d4f3a4', 3);
      if (shot.slow && shot.slow < 1) {
        const previousSlow = simTime < mob.slowUntil ? mob.slow : 1;
        mob.slow = Math.min(previousSlow, shot.slow); mob.slowUntil = Math.max(mob.slowUntil, simTime + (shot.slowDuration || 10));
        if (mob.nextBite > simTime && previousSlow !== mob.slow) mob.nextBite = simTime + (mob.nextBite - simTime) * previousSlow / mob.slow;
        mob.chewSlow = mob.slow;
        addLog({ type: 'chill', zombieId: mob.uid, laneId: lane.entry.id, ownerId: shot.ownerId, walkMultiplier: mob.slow, biteMultiplier: mob.slow, expires: mob.slowUntil });
      }
      if (shot.stunDuration) { mob.stunnedUntil = Math.max(mob.stunnedUntil || 0, simTime + shot.stunDuration); mob.nextBite = Math.max(mob.nextBite, mob.stunnedUntil); float(lane, mob, 'BUTTER!', '#fff3a3'); addLog({ type: 'butterStun', zombieId: mob.uid, laneId: lane.entry.id, ownerId: shot.ownerId, expires: mob.stunnedUntil }); }
      if (shot.burn) mob.burn = { until: simTime + 2, damage: shot.burn, ownerId: shot.ownerId, attackerId: shot.attackerId };
    }
    if (result.killed) killed(lane, mob);
  }
  function spawn(lane, starter = false) {
    const availableGiants = GIANT_CATALOG.filter(type => monsters.has(type.id));
    const giantEligible = !starter && lane.wave >= 2 && availableGiants.length > 0 && !lane.mobs.some(mob => !mob.dead && mob.type.giant && !mob.type.miniature);
    const pool = giantEligible && rng() < .03 ? availableGiants : starter ? [ZOMBIE_CATALOG[0]] : ZOMBIE_CATALOG;
    const type = !starter && pool === ZOMBIE_CATALOG && monsters.has(MINI_ZOMBIE.id) && rng() < .08 ? MINI_ZOMBIE : pool[Math.floor(rng() * pool.length)];
    // More zombies increase difficulty; elapsed time never changes their stats.
    const hp = type.health, armorHp = type.armorHealth || 0, shieldHp = type.shieldHealth || 0, bodyHp = type.bodyHealth;
    const uid = ++serial;
    let visualType = type.archetype === 2 ? 'runner' : type.archetype === 1 ? 'newspaper' : type.archetype === 3 ? 'bruiser' : type.archetype === 4 ? 'courier' : 'walker';
    if (type.ability === 1) visualType = 'mender';
    if (type.ability === 2) visualType = 'dancer';
    if (type.ability === 3) visualType = 'construction';
    if (type.armor > 0) visualType = ['walker', 'cone', 'bucket', 'football'][type.armor];
    if (type.visualType) visualType = type.visualType;
    if (type.giant) visualType = type.monsterId;
    const mob = { uid, type, x: 1.02 + rng() * .08,
      hp, maxHp: hp, armorHp, maxArmorHp: armorHp, shieldHp, maxShieldHp: shieldHp, bodyHp, maxBodyHp: bodyHp, resistance: type.resistance, speed: type.speed, enragedAt: null,
      bite: type.bite, cadence: type.biteCadence, nextBite: 0,
      stage: 0, hurt: 0, dodgePose: 0, dead: false, deathAt: 0, headless: false, bleedAccumulator: 0, lastShooter: null, slow: 1, slowUntil: 0, chewSlow: 1, stunnedUntil: 0, burn: null,
      lootIndex: Math.floor(rng() * LOOT_CATALOG.length), pose: rng() * TAU, animationTime: simTime, attacking: false };
    Object.defineProperties(mob, { visualType: { value: visualType, enumerable: true }, monsterId: { value: type.monsterId || null, enumerable: true }, rigIdentity: { value: type.id + '-' + uid, enumerable: true } });
    lane.mobs.push(mob);
    addLog({ type: 'spawn', zombieId: mob.uid, variant: type.id, visualType, giant: Boolean(type.giant), rigIdentity: mob.rigIdentity, health: Math.round(hp), damage: mob.bite, speed: mob.speed, laneId: lane.entry.id });
    if (type.giant) {
      live.textContent = type.name + ' has appeared in ' + lane.entry.name + "'s lane.";
      addLog({ type: 'giantAppeared', zombieId: mob.uid, monsterId: mob.monsterId, ownerId: lane.entry.id, name: type.name, health: hp, armorHealth: armorHp, speed: mob.speed, bite: mob.bite, biteCadence: mob.cadence });
    }
    playSfx('growl', lane);
  }
  function shoot(lane, defender) {
    const weapon = WEAPON_MAP[defender.weapon];
    const attackType = weapon.aliasOf || weapon.id;
    if (weapon.blocker) return;
    // Picker defenders protect only the student who owns this lane. The
    // three-headed shooter fires three muzzles into this same lane.
    const rows = [lane.index];
    const rowTargets = rows.map(index => ({ lane: lanes[index], targets: lanes[index].mobs.filter(mob => !mob.dead && mob.x >= defender.position - .035).sort((a, b) => a.x - b.x) }));
    if (!rowTargets.some(row => row.targets.length)) return;
    const critical = lane.crit > 0 && rng() < lane.crit;
    const damage = weapon.damage * lane.damage / 20 * (critical ? 1.7 : 1);
    defender.nextShot = simTime + Math.max(weapon.intervalMin || weapon.interval * .95, weapon.interval * lane.cooldown / BASE_CADENCE);
    const source = { ownerId: lane.entry.id, ownerLane: lane.index, attackerId: defender.uid, origin: defender.position, damage, penetration: lane.penetration, weapon: weapon.id, attackType, bypassesShield: Boolean(weapon.bypassesShield), hitsShieldAndBody: Boolean(weapon.hitsShieldAndBody), slow: weapon.slow, slowDuration: weapon.slowDuration, critical };
    {
      const count = weapon.id === 'burst' ? 3 : weapon.count || 1;
      const offsets = attackType === 'gatling' ? weapon.shootingOffsets || [.32, .49, .65, .82] : Array.from({ length: count }, (_, index) => (weapon.shootingDelay || 0) + index * (weapon.burstGap || 0));
      for (const row of rowTargets) for (let index = 0; index < count; index++) {
        const butter = weapon.id === 'splash' && rng() < (weapon.stunChance ?? .25);
        pendingShots.push({ ...source, lane: row.lane.index, fireAt: simTime + offsets[index], rotation: index,
          damage: butter ? (weapon.butterDamage || 40) * lane.damage / 20 * (critical ? 1.7 : 1) : damage,
          stunDuration: butter ? weapon.stunDuration || 4 : 0, projectileStyle: butter ? 'butter' : attackType === 'splash' ? 'kernel' : ['catapult', 'wintermelon'].includes(attackType) ? 'melon' : attackType === 'frost' ? 'ice' : attackType === 'pierce' ? 'thorn' : 'pea',
          splashDamage: weapon.splashDamage ? weapon.splashDamage * lane.damage / 20 * (critical ? 1.7 : 1) : 0,
          splashTiles: weapon.splashDamage ? PICKER_PACING.melonSplashTileRadius : 0, bonusRadius: lane.splash,
          velocity: lane.velocity / 9 * (['catapult', 'wintermelon'].includes(weapon.id) ? PICKER_VISUAL_TIMING.melonVelocityFactor : weapon.id === 'splash' ? .88 : 1), pierce: weapon.pierce,
          arc: ['catapult', 'wintermelon', 'splash'].includes(weapon.id) });
      }
    }
  }
  function emitPendingShots() {
    const waiting = [];
    for (const event of pendingShots) {
      const owner = lanes[event.ownerLane], defender = owner.defenders.find(item => item.uid === event.attackerId);
      if (!defender || defender.eaten || owner.eaten || lanes[event.lane].eaten) continue;
      if (event.fireAt > simTime + 1e-9) { waiting.push(event); continue; }
      defender.recoil = .12; defender.shotsFired++; owner.shotsFired++; playSfx(event.attackType === 'gatling' ? 'gatling' : 'shot', owner);
      shots.push({ ...event, uid: ++serial, x: event.origin + .025, hitIds: new Set(), life: event.projectileStyle === 'melon' ? 6 : 4.2 });
      addLog({ type: 'shot', weapon: event.weapon, ownerId: event.ownerId, attackerId: event.attackerId, targetLaneId: lanes[event.lane].entry.id, damage: event.damage, projectileStyle: event.projectileStyle, fireAt: Number(event.fireAt.toFixed(3)) });
    }
    pendingShots = waiting;
  }
  function splashImpact(shot, primaryLane, primary) {
    impacts.push({ ...fx.createMelonImpact({ x: primary.x, y: 0, row: primaryLane.index, lane: primaryLane.index, kind: shot.weapon === 'wintermelon' ? 'wintermelon' : 'melon', seed: shot.uid }), lane: primaryLane.index, position: primary.x, createdWall: performance.now(), firstSeenWall: null, age: 0 });
    const hitRows = [primaryLane.index - 1, primaryLane.index, primaryLane.index + 1].filter(index => index >= 0 && index < lanes.length);
    const radius = shot.splashTiles / 9;
    const nearby = [];
    for (const index of hitRows) {
      const lane = lanes[index];
      effects.push({ kind: 'splash', lane: index, x: primary.x, y: -20, radius, life: .55, color: shot.weapon === 'wintermelon' ? '#b6edff' : '#d6ee92' });
      for (const mob of lane.mobs) if (!mob.dead && mob.uid !== primary.uid && !shot.hitIds.has(mob.uid) && Math.abs(mob.x - primary.x) <= radius + 1e-9) nearby.push({ lane, mob });
    }
    const amount = getSplashDamage(shot.damage, nearby.length);
    for (const { lane, mob } of nearby) { shot.hitIds.add(mob.uid); hit(lane, mob, { ...shot, damage: amount, stunDuration: 0 }); }
    addLog({ type: 'melonSplash', ownerId: shot.ownerId, attackerId: shot.attackerId, primaryId: primary.uid, targetLaneId: primaryLane.entry.id, directDamage: shot.damage, splashDamage: amount, additionalTargets: nearby.length, hitIds: nearby.map(entry => entry.mob.uid), tileRadius: shot.splashTiles, rows: hitRows });
  }
  function activateMower(lane, mob) {
    const mower = lane.mower;
    if (mower.status !== 'ready') return;
    mower.status = 'sweeping'; mower.activations++; mower.activatedAt = simTime; mower.triggeredBy = mob.uid; mower.previousX = mower.x;
    addLog({ type: 'mowerActivate', laneId: lane.entry.id, mowerId: mower.uid, zombieId: mob.uid, x: mower.x, studentHp: lane.hp, defendersRemaining: livingDefenders(lane).length });
    particle(lane, mower.x, '#e9f2b5', 12, true);
    float(lane, { x: mower.x }, 'SECOND CHANCE!', '#fff1a2');
    live.textContent = lane.entry.name + "'s single-use lawnmower is sweeping the lane.";
  }
  function crushWithMower(lane, mob, previousMobX) {
    const mower = lane.mower;
    if (mower.status !== 'sweeping' || mob.dead || !mowerIntersects(mower.previousX, mower.x, previousMobX, mob.x)) return false;
    // A mower is a lethal contact hazard, not a projectile that can be dodged.
    // Damage armor and body together, retaining the frozen zombie identity.
    // The mower is the final killer and grants no shooter loot or plant credit.
    const resistance = Math.max(0, (mob.resistance || 0) - (mob.stage >= 2 ? .05 : 0));
    const result = damageZombie(mob, { damage: mob.hp / Math.max(.001, 1 - resistance) + 1, ownerId: lane.entry.id, attackerId: mower.uid, penetration: 0 });
    if (!result.killed) return false;
    mower.kills++; mower.killIds.push(mob.uid);
    mob.armDropAt ??= simTime; mob.headDropAt ??= simTime;
    addLog({ type: 'mowerKill', laneId: lane.entry.id, mowerId: mower.uid, zombieId: mob.uid, variant: mob.type.id, visualType: mob.visualType, rigIdentity: mob.rigIdentity, x: mob.x, damage: result.damage, armorHp: mob.armorHp, bodyHp: mob.bodyHp });
    killed(lane, mob, 'mower');
    return true;
  }
  function attackTeam(lane, mob, events, dt) {
    const targets = livingDefenders(lane);
    if (lane.torchwood && !lane.torchwood.eaten) targets.push(lane.torchwood);
    const defender = targets.sort((a, b) => b.position - a.position)[0];
    const mower = lane.mower;
    const contactPosition = defender ? defender.position + .036 : mower.status === 'ready' ? mower.x + LAWNMOWER_RULES.radius : .025;
    const previousMobX = mob.x;
    mob.previousX = mob.x;
    const toTouch = Math.max(0, mob.x - contactPosition);
    const slow = simTime < mob.slowUntil ? mob.slow : 1;
    const stunned = simTime < (mob.stunnedUntil || 0) || mob.enragedAt !== null && simTime < mob.enragedAt;
    const movement = mob.type.family === 'newspaper' && mob.enragedAt !== null && simTime >= mob.enragedAt ? mob.type.enragedSpeed : mob.speed;
    const speed = stunned ? 0 : movement * slow;
    mob.x = Math.max(contactPosition, mob.x - speed * dt);
    if (!defender && mower.status === 'ready' && mob.x <= contactPosition + 1e-9) activateMower(lane, mob);
    if (crushWithMower(lane, mob, previousMobX)) { mob.attacking = false; return; }
    // An active first-breach sweep always finishes before student bites. The
    // spent mower provides no protection when the next wave breaks through.
    if (!defender && mower.status === 'sweeping') { mob.attacking = false; return; }
    if (stunned || mob.headless) { mob.attacking = false; return; }
    mob.attacking = mob.x <= contactPosition + 1e-9;
    if (!mob.attacking) return;
    if (mob.type.explosionDamage && defender) {
      mob.fuseAt ??= simTime + 3;
      if (simTime >= mob.fuseAt) {
        for (const target of targets.filter(target => Math.abs(target.position - mob.x) <= .17)) {
          const absorbed = Math.min(target.shield || 0, mob.type.explosionDamage);
          target.shield = Math.max(0, (target.shield || 0) - absorbed);
          target.hp = Math.max(0, target.hp - (mob.type.explosionDamage - absorbed)); target.hurt = .4;
          if (target.hp === 0) { target.eaten = true; target.eatenAt = simTime; }
        }
        effects.push({ kind: 'mineBlast', lane: lane.index, x: mob.x, y: -8, life: .6, color: '#ffe8a2' });
        addLog({ type: 'demolisherExplosion', zombieId: mob.uid, laneId: lane.entry.id, damage: mob.type.explosionDamage, radius: .17 });
        mob.hp = mob.bodyHp = mob.armorHp = mob.shieldHp = 0; mob.dead = true; killed(lane, mob, 'explosion'); return;
      }
    }
    const previousChew = mob.chewSlow || 1;
    if (previousChew !== slow && mob.nextBite > simTime) mob.nextBite = simTime + (mob.nextBite - simTime) * previousChew / slow;
    mob.chewSlow = slow;
    const contact = simTime - dt + Math.min(dt, toTouch / speed);
    if (mob.nextBite < contact) mob.nextBite = contact;
    if (simTime + 1e-9 >= mob.nextBite) {
      const at = mob.nextBite;
      let damage = mob.bite;
      mob.nextBite += mob.cadence / slow;
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
        const blocker = WEAPON_MAP[defender.weapon] || PLANT_BY_ID[defender.weapon];
        if (blocker.blocker && blocker.contactDamage > 0 && !mob.dead) {
          const reflected = blocker.contactDamage + defender.power * .6;
          hit(lane, mob, { ownerId: lane.entry.id, attackerId: defender.uid, damage: reflected, penetration: blocker.id === 'chestnut' ? .12 : 0, weapon: blocker.id });
          addLog({ type: 'blockerContact', ownerId: lane.entry.id, defenderId: defender.uid, zombieId: mob.uid, weapon: blocker.id, damage: reflected });
        }
      } else {
        lane.hp = Math.max(0, lane.hp - damage); lane.hurt = .25;
        float(lane, { x: 0 }, '-' + Math.round(damage), C.coral);
        addLog({ type: 'bite', target: 'student', zombieId: mob.uid, laneId: lane.entry.id, damage, remainingHp: lane.hp, defendersRemaining: 0, mowerStatus: mower.status });
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
    for (const drop of drops) {
      drop.age += dt; drop.life -= dt;
      if (drop.life <= 0 && !drop.collected) {
        drop.collected = true;
        const owner = lanes[drop.ownerLane];
        if (owner && owner.entry.id === drop.ownerId && !owner.eaten) {
          const upgrade = giveLoot(owner, drop.item);
          particle(owner, 0, '#fff2a7', 12, true);
          addLog({ type: 'loot', lootId: drop.item.id, ownerId: drop.ownerId, attackerId: drop.attackerId, zombieId: drop.zombieId, collectedBy: 'student', ...upgrade });
          playSfx('pickup', owner);
        }
      }
    }
    drops = drops.filter(drop => drop.life > 0);
  }
  function recruitMine(lane) {
    if (lane.trap || lane.eaten) return;
    const rule = PLANT_BY_ID.potato;
    lane.trap = { uid: 'mine-' + (++serial), position: .74, bornAt: simTime, armAt: simTime + rule.armDelay + rule.riseDuration, armed: false, spent: false, explodedAt: null, kills: 0 };
    addLog({ type: 'minePlanted', ownerId: lane.entry.id, mineId: lane.trap.uid, armAt: lane.trap.armAt });
    playSfx('plant', lane);
  }
  function updateMine(lane) {
    const mine = lane.trap; if (!mine || mine.spent) return;
    if (!mine.armed && simTime >= mine.armAt) { mine.armed = true; addLog({ type: 'mineArmed', ownerId: lane.entry.id, mineId: mine.uid }); }
    if (!mine.armed) return;
    const touching = lane.mobs.find(mob => !mob.dead && Math.min(mob.previousX ?? mob.x, mob.x) <= mine.position + .03 && Math.max(mob.previousX ?? mob.x, mob.x) >= mine.position - .03);
    if (!touching) return;
    mine.spent = true; mine.explodedAt = simTime;
    const rule = PLANT_BY_ID.potato, radius = rule.blastRadius / GARDEN_RULES.tileWidth / 9;
    for (const mob of lane.mobs) if (!mob.dead && (mob.uid === touching.uid || Math.abs(mob.x - mine.position) <= radius)) {
      const result = damageZombie(mob, { damage: rule.explosionDamage, ownerId: lane.entry.id, attackerId: mine.uid, penetration: 0 });
      mob.armDropAt ??= simTime; mob.headDropAt ??= simTime;
      addLog({ type: 'mineDamage', ownerId: lane.entry.id, mineId: mine.uid, zombieId: mob.uid, damage: result.damage, remainingHp: mob.hp });
      if (result.killed) { mine.kills++; killed(lane, mob, 'mine'); }
    }
    particle(lane, mine.position, '#fff2bb', 26, true);
    effects.push({ kind: 'mineBlast', lane: lane.index, x: mine.position, y: -8, life: .6, color: '#ffe8a2' });
    addLog({ type: 'mineExploded', ownerId: lane.entry.id, mineId: mine.uid, kills: mine.kills, radiusTiles: radius * 9 });
  }
  function beginWave() {
    waveIndex++; const target = waveIndex === 1 ? 5 : 50 * 2 ** Math.min(waveIndex - 2, 30);
    const pressure = getPickerHordePressure(waveIndex);
    nextWaveAt = simTime + pressure.waveSeconds;
    for (const lane of lanes) {
      // Reinforcements overlap living enemies and retain every unreleased
      // zombie from earlier waves. Large quotas stay as numeric backlog.
      const carried = lane.queuedSpawns + lane.deferredSpawns;
      lane.wave = waveIndex; lane.waveSize = target; lane.waveTarget = target + carried; lane.waveSpawned = 0;
      lane.queuedSpawns = Math.min(PICKER_HORDE.queueBuffer, lane.waveTarget); lane.deferredSpawns = lane.waveTarget - lane.queuedSpawns; lane.nextSpawn = simTime; lane.nextWave = nextWaveAt;
      addLog({ type: 'wave', laneId: lane.entry.id, wave: waveIndex, count: target, carried, queued: lane.queuedSpawns, deferred: lane.deferredSpawns, liveLimit: pressure.liveLimit, burst: pressure.burst, nextWaveAt });
    }
  }
  function updateWaveClock() {
    if (!lanes.length) return;
    const clear = waveIndex === 0 || lanes.every(lane => !lane.eaten && lane.waveSpawned === lane.waveTarget && lane.queuedSpawns === 0 && lane.deferredSpawns === 0 && !lane.mobs.some(mob => !mob.dead));
    // Clearing early earns a short pause; surviving enemies cannot hold the
    // next wave back while plants keep collecting upgrades.
    if (clear && waveIndex > 0) { nextWaveAt = Math.min(nextWaveAt, simTime + 3); lanes.forEach(lane => lane.nextWave = nextWaveAt); }
    if (simTime >= nextWaveAt) beginWave();
  }
  function recruitTorchwood(lane) {
    if (lane.torchwood || lane.eaten) return;
    const hp = PLANT_BY_ID.torchwood.hp;
    lane.torchwood = { uid: 'torch-' + (++serial), weapon: 'torchwood', position: .53, hp, maxHp: hp, shield: 0, power: 0, hurt: 0, eaten: false, eatenAt: null, bornAt: simTime };
    addLog({ type: 'torchwoodPlanted', ownerId: lane.entry.id, utilityId: lane.torchwood.uid }); playSfx('plant', lane);
  }
  function convertThroughTorch(lane, shot, previousX) {
    const torch = lane.torchwood;
    if (!torch || torch.eaten || previousX > torch.position || shot.x < torch.position) return;
    shot.torchIds ??= new Set(); if (shot.torchIds.has(torch.uid)) return;
    const from = shot.projectileStyle, rule = PLANT_BY_ID.torchwood;
    if (from === 'ice') { shot.projectileStyle = 'pea'; shot.slow = undefined; shot.slowDuration = 0; }
    else if (from === 'pea') { shot.fireSplashDamage = rule.fireSplashDamage * shot.damage / 20; shot.damage *= rule.fireDamage / 20; shot.projectileStyle = 'fire'; }
    else return;
    shot.torchIds.add(torch.uid);
    addLog({ type: 'torchConversion', ownerId: shot.ownerId, attackerId: shot.attackerId, utilityId: torch.uid, from, to: shot.projectileStyle, damage: shot.damage, fireSplashDamage: shot.fireSplashDamage || 0 });
  }
  function recruitCherry(lane) {
    if (lane.eaten || (lane.bomb && !lane.bomb.spent)) return;
    const nearest = lane.mobs.filter(mob => !mob.dead).sort((a, b) => a.x - b.x)[0];
    lane.bomb = { uid: 'cherry-' + (++serial), position: clamp(nearest?.x ?? .76, .54, .94), bornAt: simTime, fuseAt: simTime + PICKER_VISUAL_TIMING.cherryFuse, fuseFirstSeenWall: null, spent: false, explodedAt: null, burstFirstSeenWall: null, kills: 0 };
    addLog({ type: 'cherryPlanted', ownerId: lane.entry.id, bombId: lane.bomb.uid, fuseAt: lane.bomb.fuseAt }); playSfx('plant', lane);
  }
  function updateCherry(lane) {
    const bomb = lane.bomb; if (!bomb || bomb.spent || simTime + 1e-9 < bomb.fuseAt) return;
    bomb.spent = true; bomb.explodedAt = simTime;
    const rule = PLANT_BY_ID.cherrybomb, radius = rule.blastRadius / GARDEN_RULES.tileWidth / 9;
    for (const victim of lanes) if (Math.abs(victim.index - lane.index) <= rule.rowRadius) {
      for (const mob of victim.mobs) if (!mob.dead && Math.abs(mob.x - bomb.position) <= radius) {
        const result = damageZombie(mob, { damage: rule.explosionDamage, ownerId: lane.entry.id, attackerId: bomb.uid, penetration: 0 });
        mob.armDropAt ??= simTime; mob.headDropAt ??= simTime;
        addLog({ type: 'cherryDamage', ownerId: lane.entry.id, bombId: bomb.uid, zombieId: mob.uid, laneId: victim.entry.id, damage: result.damage, remainingHp: mob.hp });
        if (result.killed) { bomb.kills++; killed(victim, mob, 'cherrybomb'); }
      }
      particle(victim, bomb.position, '#fff2bb', 18, true);
      effects.push({ kind: 'mineBlast', lane: victim.index, x: bomb.position, y: -8, life: .6, color: '#ffe8a2' });
    }
    addLog({ type: 'cherryExploded', ownerId: lane.entry.id, bombId: bomb.uid, kills: bomb.kills });
  }
  function endRound(event) {
    if (phase !== 'running' || !event?.lane?.eaten || event.lane.hp > 0) return;
    winner = event.lane; resultAt = event.time; phase = 'result';
    winnerSnapshot = Object.freeze({ id: winner.entry.id, name: winner.entry.name, laneIndex: winner.index, studentHp: winner.hp, at: resultAt });
    particle(winner, 0, C.gold, 28, true);
    note.textContent = winner.entry.name + "'s defenses fell. They speak next!";
    live.textContent = winner.entry.name + ' is the next speaker.';
    canvas.setAttribute('aria-label', 'Plants vs. Zombies. ' + winner.entry.name + "'s student ran out of health after the defenders fell and the single-use lawnmower was spent, and is the next speaker.");
    addLog({ type: 'winner', ownerId: winner.entry.id, at: resultAt });
    follow(winner, true);
    try { canvas.focus?.({ preventScroll: true }); } catch {}
    stopMusic();
  }
  function step(dt) {
    // Keep combat deterministic at 25 Hz, and interpolate presentation at the
    // display's refresh rate. Render copies never feed back into collisions.
    for (const lane of lanes) for (const mob of lane.mobs) { mob.renderPreviousX = mob.x; mob.renderPreviousAnimation = mob.animationTime; }
    for (const shot of shots) shot.renderPreviousX = shot.x;
    simTime += dt;
    const deaths = [];
    const studentBefore = new Map(lanes.map(lane => [lane, { hp: lane.hp, hurt: lane.hurt, emotionStage: lane.emotionStage }]));
    updateRewards(dt);
    updateWaveClock();
    for (const lane of lanes) {
      lane.hurt = Math.max(0, lane.hurt - dt);
      if (lane.torchwood) lane.torchwood.hurt = Math.max(0, lane.torchwood.hurt - dt);
      for (const defender of lane.defenders) { defender.recoil = Math.max(0, defender.recoil - dt); defender.hurt = Math.max(0, defender.hurt - dt); }
      if (lane.eaten) continue;
      const mower = lane.mower;
      mower.previousX = mower.x;
      if (mower.status === 'sweeping') mower.x += LAWNMOWER_RULES.speed * dt;
      const pressure = getPickerHordePressure(lane.wave);
      const refill = Math.min(PICKER_HORDE.queueBuffer - lane.queuedSpawns, lane.deferredSpawns);
      lane.queuedSpawns += refill; lane.deferredSpawns -= refill;
      const liveCount = lane.mobs.filter(mob => !mob.dead).length;
      if (lane.queuedSpawns > 0 && simTime >= lane.nextSpawn && liveCount < pressure.liveLimit) {
        const release = Math.min(pressure.burst, lane.queuedSpawns, pressure.liveLimit - liveCount);
        for (let index = 0; index < release; index++) { spawn(lane, lane.wave === 1); lane.queuedSpawns--; lane.waveSpawned++; }
        lane.nextSpawn = simTime + pressure.spawnMinimum + rng() * pressure.spawnJitter;
      }
      for (const mob of lane.mobs) {
        mob.hurt = Math.max(0, mob.hurt - dt); mob.dodgePose = Math.max(0, mob.dodgePose - dt);
        if (mob.dead) continue;
        if (simTime >= (mob.stunnedUntil || 0) && (mob.enragedAt === null || simTime >= mob.enragedAt)) mob.animationTime += dt * (simTime < mob.slowUntil ? mob.slow : 1);
        if (mob.burn && simTime < mob.burn.until) hit(lane, mob, { ownerId: mob.burn.ownerId, attackerId: mob.burn.attackerId, damage: mob.burn.damage * dt, penetration: .05 }, true);
        if (mob.dead) continue;
        if (mob.headless && !mob.type.giant) {
          mob.bleedAccumulator += dt;
          while (mob.bleedAccumulator + 1e-8 >= GARDEN_RULES.secondsPerTick) {
            mob.bleedAccumulator -= GARDEN_RULES.secondsPerTick;
            if (rng() < GARDEN_RULES.zombie.headlessDecayChancePerTick) mob.bodyHp = Math.max(0, mob.bodyHp - (mob.maxBodyHp >= 500 ? GARDEN_RULES.zombie.headlessLargeDecayDamage : GARDEN_RULES.zombie.headlessDecayDamage));
          }
          mob.hp = mob.bodyHp <= 0 ? 0 : mob.bodyHp + mob.armorHp + mob.shieldHp;
          if (mob.bodyHp <= 0) { mob.dead = true; killed(lane, mob); continue; }
        }
        attackTeam(lane, mob, deaths, dt);
      }
      updateMine(lane);
      updateCherry(lane);
      if (mower.status === 'sweeping' && mower.x >= LAWNMOWER_RULES.exit) {
        mower.status = 'spent'; mower.spentAt = simTime;
        addLog({ type: 'mowerSpent', laneId: lane.entry.id, mowerId: mower.uid, x: mower.x, activationKills: mower.kills, studentHp: lane.hp });
        live.textContent = lane.entry.name + "'s lawnmower rescue is spent. " + (livingDefenders(lane).length ? 'Remaining plants protect the student.' : 'Later zombies can now reach the student.');
      }
      lane.mobs = lane.mobs.filter(mob => !mob.dead || simTime - mob.deathAt < .7);
      if (simTime >= lane.nextGrowl && lane.mobs.some(mob => !mob.dead)) { playSfx('growl', lane); lane.nextGrowl = simTime + 7 + lane.index % 4; }
      if (!lane.eaten) for (const defender of livingDefenders(lane)) if (simTime >= defender.nextShot) shoot(lane, defender);
    }
    emitPendingShots();
    for (const shot of shots) {
      const lane = lanes[shot.lane], previousX = shot.x; shot.x += shot.velocity * dt; shot.life -= dt;
      if (lane.eaten || shot.life <= 0) continue;
      convertThroughTorch(lane, shot, previousX);
      const targets = lane.mobs.filter(mob => !mob.dead && !shot.hitIds.has(mob.uid) && shot.x >= mob.x - .012).sort((a, b) => a.x - b.x);
      for (const mob of targets) {
        if (shot.pierce <= 0) break;
        shot.hitIds.add(mob.uid); shot.pierce--;
        hit(lane, mob, shot);
        if (shot.splashDamage > 0) splashImpact(shot, lane, mob);
        else if (shot.fireSplashDamage > 0) for (const other of lane.mobs) if (!other.dead && other.uid !== mob.uid && !shot.hitIds.has(other.uid) && Math.abs(other.x - mob.x) <= 1 / 9) { shot.hitIds.add(other.uid); hit(lane, other, { ...shot, damage: shot.fireSplashDamage, slow: undefined, stunDuration: 0 }); }
        else if (shot.bonusRadius > 0) for (const other of lane.mobs) if (other.uid !== mob.uid && !other.dead && !shot.hitIds.has(other.uid) && Math.abs(other.x - mob.x) < shot.bonusRadius) { hit(lane, other, { ...shot, damage: shot.damage * .30, stunDuration: 0 }); shot.hitIds.add(other.uid); }
      }
    }
    shots = shots.filter(shot => shot.life > 0 && shot.x < 1.15 && shot.pierce > 0 && !lanes[shot.lane].eaten);
    advanceEffects(dt);
    for (const lane of lanes) { const emotion = studentEmotionState(lane); lane.emotionStage = Math.max(lane.emotionStage, emotion.stage); lane.bruiseStage = emotion.bruiseStage; }
    if (deaths.length) {
      const firstTime = Math.min(...deaths.map(event => event.time));
      const tied = deaths.filter(event => Math.abs(event.time - firstTime) < 1e-8);
      const chosen = tied[Math.floor(rng() * tied.length)];
      // End this tiny physics interval at its first lethal contact. Other
      // students retain their pre-contact state instead of looking selected.
      const frozen = new Set();
      for (const event of deaths) if (event !== chosen) {
        const before = studentBefore.get(event.lane);
        event.lane.hp = before.hp; event.lane.hurt = before.hurt; event.lane.eaten = false;
        event.lane.emotionStage = before.emotionStage; event.lane.bruiseStage = studentEmotionState(event.lane).bruiseStage;
        frozen.add(event.lane.entry.id);
      }
      combatLog = combatLog.filter(entry => !(entry.time === Number(simTime.toFixed(3)) && entry.type === 'bite' && entry.target === 'student' && entry.remainingHp === 0 && frozen.has(entry.laneId)));
      endRound(chosen);
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
      lane.suns++; lane.damage = Math.min(24, lane.damage + .35);
      if (lane.suns === 2) recruitMine(lane);
      if (lane.suns === 3) recruitTorchwood(lane);
      if (lane.suns >= 4 && lane.suns % 4 === 0) recruitCherry(lane);
      lane.cooldown = Math.max(PICKER_PACING.upgradeMinimumInterval, lane.cooldown * .997);
      const living = livingDefenders(lane);
      // The first sun always tries to add a separate shooter. Later suns can
      // recruit a different type or evolve an existing defender.
      const weapon = nextPlantType(lane, lane.suns > 1);
      if (lane.suns === 1 || living.length < DEFENDER_POSITIONS.length && rng() < .62) defender = recruitDefender(lane, weapon, 'sun');
      if (defender) action = 'recruit';
      else {
        const matching = living.filter(member => Boolean(WEAPON_MAP[member.weapon].blocker) === Boolean(WEAPON_MAP[weapon].blocker));
        const eligible = matching.length ? matching : living;
        defender = eligible[Math.floor(rng() * eligible.length)];
        if (defender) { evolveDefender(defender, weapon); defender.hp = Math.min(defender.maxHp, defender.hp + 15); }
      }
    } else {
      lane.stars++; lane.crit = Math.min(.12, lane.crit + .01);
      lane.splash = Math.min(.025, lane.splash + .004);
      const living = livingDefenders(lane);
      for (const member of living) { member.shield = Math.min(40, member.shield + 4); member.power = Math.min(10, member.power + 1); }
      defender = living[Math.floor(rng() * living.length)];
      if (defender) evolveDefender(defender, WEAPON_MAP[defender.weapon].blocker ? BLOCKERS[Math.floor(rng() * BLOCKERS.length)].id : newShooterType(lane));
    }
    if (defender && reward.kind === 'sun') defender.power = Math.min(10, defender.power + 1);
    if (reward.kind === 'sun') for (const member of livingDefenders(lane)) if (member !== defender) member.power = Math.min(10, member.power + 1);
    for (const member of livingDefenders(lane)) if (promoteDefender(lane, member, reward.kind) && member === defender && action !== 'recruit') action = 'evolve';
    particle(lane, 0, reward.kind === 'sun' ? '#ffe982' : '#caf0ff', 12, true);
    if (action !== 'recruit') effects.push({ kind: 'text', lane: lane.index, x: 0, y: -65, vy: -16, life: .65, color: reward.kind === 'sun' ? '#fff2a2' : '#d8f2ff', value: reward.kind === 'sun' ? 'SUN +' : 'TEAM +' });
    addLog({ type: 'resource', kind: reward.kind, ownerId: lane.entry.id, collectedBy: 'student', weapon: defender?.weapon ?? null, defenderId: defender?.uid ?? null, action, power: lane.power });
    playSfx(reward.kind === 'sun' ? 'sun' : 'pickup', lane);
  }
  function updateRewards(dt) {
    if (simTime >= nextReward && lanes.length) {
      const eligible = lanes.filter(lane => !lane.eaten);
      if (eligible.length) {
        const lane = eligible[Math.floor(rng() * eligible.length)];
        rewards.push({ kind: rng() < .62 ? 'sun' : 'star', lane: lane.index, x: .18 + rng() * .73,
          y: -Math.max(78, lane.h + 14), velocity: 38 + rng() * 20, age: 0, landed: false, collectAge: 0, phase: rng() * TAU, collected: false });
      }
      nextReward = simTime + Math.max(.40, 2.8 / Math.sqrt(lanes.length)) + rng() * .24;
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
        if (reward.collectAge >= .32 && !reward.flightStarted) { reward.flightStarted = true; pickupFlight(lane, lane, { kind: reward.kind, x: reward.x, y: reward.y, phase: reward.phase }); }
        if (reward.collectAge >= 1.10) { reward.collected = true; collectReward(lane, reward); }
      }
    }
    rewards = rewards.filter(reward => !reward.collected);
  }
  function plant(lane, defender, time) {
    const x = lane.plantX + defender.position * lane.travel, floor = lane.floor, bob = Math.sin(time * 3 + lane.index + defender.slot) * 1.2;
    const age = defender.eaten ? Math.max(0, simTime - defender.eatenAt) : 0;
    if (defender.eaten && age > .7) return;
    ctx.save(); ctx.translate(x, floor); ctx.scale(lane.spriteScale, lane.spriteScale);
    if (defender.eaten) { const p = clamp(age / .65, 0, 1); ctx.translate(p * 25, -Math.sin(p * Math.PI) * 25); ctx.rotate(p * .8); ctx.scale(Math.max(.001, 1 - p), Math.max(.001, 1 - p)); ctx.globalAlpha = 1 - p; }
    else if (defender.bornAt >= 0) { const p = clamp((simTime - defender.bornAt) / .6, 0, 1); ctx.translate(0, (1 - p) * 16); ctx.scale(.2 + .8 * p, .2 + .8 * p); }
    if (defender.hurt) ctx.translate(Math.sin(time * 60) * 2, 0);
    ctx.fillStyle = '#315e3180'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, TAU); ctx.fill();
    const spec = WEAPON_MAP[defender.weapon], weapon = spec.aliasOf ? { ...spec, id: spec.aliasOf } : spec, recoil = defender.recoil / .12 * 3;
    defender.damageStage = plantDamageStage(defender.hp, defender.maxHp);
    const rigged = renderer.drawPlant(ctx, { weapon: weapon.id, time, simTime: time, hp: defender.hp, maxHp: defender.maxHp, recoil: defender.recoil, seed: identityHash(defender.uid), rank: defender.power, level: defender.power + 1, upgrades: defender.power, defender });
    if (!rigged) ctx.translate(-recoil, bob);
    const illustrated = rigged || (!weapon.blocker && Number.isInteger(plantCells[weapon.id]) && atlasSprite('plants', plantCells[weapon.id], -40, -75, 84, 76));
    if (!illustrated) {
      const stage = defender.damageStage;
      if (!weapon.blocker) {
        ctx.strokeStyle = '#3d9040'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(-stage * 2, -19, stage * 2, -32); ctx.stroke();
        if (stage < 4) { ctx.fillStyle = '#42a846'; ctx.beginPath(); ctx.ellipse(-13, -8 + stage, 15 - stage * 2, 6, -.45 + stage * .2, 0, TAU); ctx.fill(); }
        if (stage < 3) { ctx.fillStyle = '#69c251'; ctx.beginPath(); ctx.ellipse(13, -8 + stage, 15 - stage * 2, 6, .45 - stage * .2, 0, TAU); ctx.fill(); }
      }
      // Classic bulb, large side eyes, tubular snout and leafy feet. Names,
      // rather than human faces or hairstyles, identify the students.
      const peaHead = (hx, hy, color = '#79c944', mouth = '#245d27', scale = 1) => {
        ctx.save(); ctx.translate(hx + stage * 1.2, hy + stage * 1.5); ctx.rotate(stage * .055); ctx.scale(scale, scale);
        ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, 0, 22, 18, -.10, 0, TAU); ctx.fill();
        rr(9, -6, 25, 15, 5, color); ctx.beginPath(); ctx.ellipse(33, 1, 10, 11, 0, 0, TAU); ctx.fillStyle = color; ctx.fill();
        ctx.beginPath(); ctx.ellipse(35, 1, 5.6, 7.3, 0, 0, TAU); ctx.fillStyle = mouth; ctx.fill();
        ctx.beginPath(); ctx.ellipse(-7, -6, 6, 8, -.16, 0, TAU); ctx.fillStyle = '#f9ffda'; ctx.fill();
        dot(-5, -5, 3, '#233c20'); dot(-6, -7, 1.2, '#ffffff');
        ctx.strokeStyle = '#4c9b30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, -17); ctx.quadraticCurveTo(-22, -29, -11, -31); ctx.stroke();
        ctx.fillStyle = '#6ab747'; ctx.beginPath(); ctx.ellipse(-13, -29, 6, 3, .6, 0, TAU); ctx.fill();
        ctx.restore();
      };
      if (weapon.blocker) {
        const tall = weapon.id === 'tallnut', chestnut = weapon.id === 'chestnut';
        const nutHeight = tall ? 70 : 47, nutWidth = tall ? 39 : 47;
        if (chestnut) { ctx.strokeStyle = '#638138'; ctx.lineWidth = 3; for (let n = 0; n < 14; n++) { const a = n * TAU / 14; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 24, -26 + Math.sin(a) * 25); ctx.lineTo(Math.cos(a) * 31, -26 + Math.sin(a) * 31); ctx.stroke(); } }
        rr(-nutWidth / 2, -nutHeight, nutWidth, nutHeight, tall ? 13 : 21, chestnut ? '#9cac48' : '#c89658', '#816035');
        ctx.strokeStyle = chestnut ? '#667d35' : '#ae7845'; ctx.lineWidth = 1;
        for (let n = 0; n < 7; n++) { ctx.beginPath(); ctx.moveTo(-15 + n * 5, -nutHeight + 7); ctx.quadraticCurveTo(-23 + n * 6, -nutHeight / 2, -14 + n * 5, -6); ctx.stroke(); }
        const eyeY = -nutHeight * .61; dot(-8, eyeY, 5.6, '#fff0c4'); dot(8, eyeY, 5.6, '#fff0c4'); dot(-7, eyeY + stage * .35, 2.3, '#3b3928'); dot(7, eyeY + stage * .35, 2.3, '#3b3928');
        ctx.strokeStyle = '#60472d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, eyeY + 13); ctx.quadraticCurveTo(0, eyeY + (stage > 2 ? 7 : 18), 6, eyeY + 13); ctx.stroke();
      } else if (weapon.id === 'twin') { peaHead(-5, -51, '#6ec245', '#245d27', .86); peaHead(3, -29, '#83ce4d', '#245d27', .86); }
      else if (weapon.id === 'burst') { peaHead(-5, -53, '#65b93f', '#245d27', .72); peaHead(5, -37, '#81cc46', '#245d27', .75); peaHead(-4, -21, '#96d25c', '#245d27', .72); }
      else if (weapon.id === 'frost') { peaHead(0, -39, '#98d8ee', '#2b657b'); ctx.strokeStyle = '#d5f6ff'; ctx.lineWidth = 3; for (let n = 0; n < 5; n++) { ctx.beginPath(); ctx.moveTo(-17 + n * 7, -56); ctx.lineTo(-19 + n * 7, -64); ctx.stroke(); } }
      else if (weapon.id === 'fire') { for (let n = 0; n < 7; n++) { const a = n * TAU / 7; ctx.fillStyle = '#f2a735'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 17, -39 + Math.sin(a) * 17); ctx.lineTo(Math.cos(a + .15) * 29, -39 + Math.sin(a + .15) * 28); ctx.lineTo(Math.cos(a + .35) * 18, -39 + Math.sin(a + .35) * 18); ctx.fill(); } peaHead(0, -39, '#eeae40', '#994622'); }
      else if (['catapult', 'wintermelon'].includes(weapon.id)) {
        ctx.fillStyle = weapon.id === 'wintermelon' ? '#77bcce' : '#529944'; ctx.beginPath(); ctx.ellipse(0, -24, 27, 19, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8ec751'; ctx.lineWidth = 3; for (let n = -14; n < 20; n += 8) { ctx.beginPath(); ctx.moveTo(n, -39); ctx.quadraticCurveTo(n - 7, -20, n + 2, -7); ctx.stroke(); }
        ctx.strokeStyle = '#477b34'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(10, -21); ctx.lineTo(27, -56 + recoil * 3); ctx.stroke();
        dot(26, -57 + recoil * 3, 11, weapon.id === 'wintermelon' ? '#b1e5f3' : '#9bcf57', '#3a7333'); dot(-9, -28, 3.5, '#1d4025');
      } else if (weapon.id === 'gatling') {
        peaHead(0, -39, '#6a9c55'); rr(-21, -63, 41, 13, 5, '#596c44', '#31452f');
        for (let n = 0; n < 4; n++) { rr(16 + n % 2 * 8, -46 + Math.floor(n / 2) * 10, 21, 7, 3, '#a0b56c'); dot(37 + n % 2 * 8, -42.5 + Math.floor(n / 2) * 10, 3.5, '#243f2c'); }
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
    if (!rigged && defender.damageStage > 0) {
      // Five visible fallback damage states also cover missing/failed art.
      ctx.strokeStyle = weapon.blocker ? '#725136' : '#6d793d'; ctx.lineWidth = 1.8;
      for (let n = 0; n < defender.damageStage; n++) { const x = -14 + n * 8, y = -55 + n % 2 * 17; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 6); ctx.lineTo(x + 1, y + 10); ctx.lineTo(x + 5, y + 15); ctx.stroke(); }
      if (defender.damageStage >= 3 && !weapon.blocker) { ctx.fillStyle = '#9ca55c'; ctx.beginPath(); ctx.ellipse(23, -2, 10, 3, -.2, 0, TAU); ctx.fill(); }
    }
    drawGardenPlantUpgrade(ctx, { weapon: weapon.id, defender, time });
    if (defender.shield > 0) { ctx.strokeStyle = '#d3eaff99'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -34, 28, Math.PI * .8, Math.PI * 2.2); ctx.stroke(); }
    ctx.restore();
    if (!defender.eaten) hpBar(x - 19 * lane.spriteScale, floor - 72 * lane.spriteScale, 38 * lane.spriteScale, defender.hp, defender.maxHp, defender.hp < 90 ? '#ffd082' : '#d1ed86', 2.5);
  }
  function studentTagGeometry(lane) {
    const scale = clamp((lane.h - 29) / 84, .12, .76), chipHeight = lane.h < 36 ? 11 : 18;
    const right = lane.plantX + 31 * scale + 7;
    const beforePlant = lane.plantX + DEFENDER_POSITIONS[0] * lane.travel - 35 * lane.spriteScale - 5;
    const room = beforePlant - right, besideRight = room >= 62;
    const x = besideRight ? right : lane.x + 3;
    const width = besideRight ? Math.min(lane.nameWidth, room) : Math.max(32, lane.plantX - 31 * scale - 8 - x);
    const y = clamp(lane.floor - 34 * scale - chipHeight / 2, lane.y + 2, lane.floor - chipHeight - 10);
    return { x, y, width, height: chipHeight, side: besideRight ? 'right' : 'left' };
  }
  function drawStudentTag(lane, won) {
    const tag = studentTagGeometry(lane), tiny = lane.h < 36, fontSize = tiny ? 8 : width < 800 ? 11 : 12;
    rr(tag.x, tag.y, tag.width, tag.height, 4, won ? '#745b25' : '#264d2ef2');
    text(lane.entry.name, tag.x + 5, tag.y + tag.height / 2, tag.width - 10, fontSize, won ? '#ffe2a0' : C.cream, 750);
    hpBar(tag.x + 4, tag.y + tag.height + 4, Math.max(24, tag.width - 8), lane.hp, lane.maxHp, lane.hp < 70 ? '#ff947d' : '#c1e689', tiny ? 2 : 3);
  }
  function studentCell(entry) {
    const configured = artwork?.studentCells?.[entry.avatar] ?? artwork?.studentCells?.neutral;
    const cells = (Array.isArray(configured) ? configured : [configured]).filter(cell => Number.isInteger(Number(cell)) && Number(cell) >= 0 && Number(cell) <= 11).map(Number);
    return cells.length ? cells[entry.avatarIndex % cells.length] : entry.avatarIndex % 12;
  }
  function student(lane, time, resultAge) {
    const x = lane.plantX, scale = clamp((lane.h - 29) / 84, .12, .76), floor = lane.floor;
    const p = lane.eaten ? clamp(resultAge / .7, 0, 1) : 0;
    ctx.save(); ctx.translate(x, floor); ctx.scale(scale, scale);
    if (lane.hurt && !lane.eaten) ctx.translate(Math.sin(time * 32) * 2, 0);
    if (lane.eaten) { ctx.rotate(-p * .15); ctx.translate(0, p * 5); ctx.globalAlpha = 1 - p * .55; }
    dot(0, 0, 22, '#2e573933');
    const skins = ['#f4c692', '#ad754e', '#dfab7a', '#78513d', '#ebcba2', '#bd906d'];
    const skin = skins[studentCell(lane.entry) % skins.length], sway = Math.sin(time * 2 + lane.entry.avatarIndex % 23);
    // Arms bend at connected shoulder/elbow anchors. The single procedural
    // head sways at its neck, with no baked portrait face or duplicate body.
    // Full, connected silhouettes: shoes, trouser legs and layered clothing.
    const outfit = lane.entry.avatarIndex % 4;
    for (const side of [-1, 1]) {
      rr(side * 8 - 5, -17, 10, 16, 4, outfit === 2 ? '#526b81' : '#35465c');
      rr(side * 8 - 7, -6, 15, 7, 3, '#f4eee0', '#354052');
      rr(side * 8 - 7, -1, 15, 2, 1, '#a1aab2');
    }
    rr(-16, -29, 32, 21, 7, lane.entry.color, '#24344b66');
    if (outfit === 0) { rr(-3, -28, 6, 19, 2, '#ffffff77'); dot(0, -20, 1, '#35465c'); dot(0, -14, 1, '#35465c'); }
    if (outfit === 1) { rr(-14, -19, 28, 4, 1, '#fff5dbcc'); rr(-14, -12, 28, 2, 1, '#fff5db88'); }
    if (outfit === 2) { rr(-11, -25, 4, 16, 1, '#415b75'); rr(7, -25, 4, 16, 1, '#415b75'); rr(-10, -19, 20, 10, 3, '#526b81'); }
    if (outfit === 3) { rr(-10, -17, 20, 7, 3, '#ffffff44'); ctx.strokeStyle = '#fff1d4'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-4, -27); ctx.lineTo(-5, -19); ctx.moveTo(4, -27); ctx.lineTo(5, -19); ctx.stroke(); }
    for (const side of [-1, 1]) {
      const elbowX = side * 25, elbowY = -14 + sway * side * 2, handX = side * 25, handY = -4 + sway * side * 4;
      ctx.strokeStyle = lane.entry.color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(side * 13, -21); ctx.lineTo(elbowX, elbowY); ctx.stroke();
      ctx.strokeStyle = skin; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(elbowX, elbowY); ctx.lineTo(handX, handY); ctx.stroke(); dot(handX, handY, 3.1, skin);
    }
    ctx.save(); ctx.translate(0, -25); ctx.rotate(sway * .024); ctx.translate(0, 25);
    const index = lane.entry.avatarIndex, hair = ['#543323', '#241e24', '#b17739', '#6e442c'][index % 4];
    const styles = lane.entry.avatar === 'boy' ? [0, 1, 2] : lane.entry.avatar === 'girl' ? [3, 4, 5] : [0, 1, 2, 3, 4, 5];
    const hairstyle = styles[index % styles.length];
    // Stable recorded avatar choices select a style; names never infer gender.
    if (hairstyle === 3) { rr(-26, -72, 12, 48, 7, hair); rr(14, -72, 12, 48, 7, hair); }
    if (hairstyle === 4) { dot(25, -62, 12, hair); rr(23, -64, 12, 28, 7, hair); dot(23, -57, 3, '#d88968'); }
    if (hairstyle === 5) { dot(-26, -49, 9, hair); dot(26, -49, 9, hair); dot(-24, -58, 3, '#d88968'); dot(24, -58, 3, '#d88968'); }
    rr(-6, -31, 12, 13, 4, skin);
    ctx.fillStyle = skin; ctx.strokeStyle = '#735d4240'; ctx.lineWidth = 1;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 22, -46, 4.5, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -49, 22, 27, 0, 0, TAU); ctx.fill(); ctx.stroke();
    const faceLight = ctx.createRadialGradient(-8, -57, 2, 0, -49, 27);
    faceLight.addColorStop(0, '#fff9e52b'); faceLight.addColorStop(.7, '#ffffff00'); faceLight.addColorStop(1, '#79452b20');
    ctx.fillStyle = faceLight; ctx.fill();
    dot(-14, -42, 4, '#ed97782b'); dot(14, -42, 4, '#ed97782b');
    ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(0, -67, 23, 12, 0, Math.PI, TAU); ctx.fill();
    if (hairstyle === 1 || hairstyle === 4) { ctx.beginPath(); ctx.moveTo(-21, -67); ctx.quadraticCurveTo(-5, -84, 20, -68); ctx.quadraticCurveTo(3, -59, -13, -62); ctx.closePath(); ctx.fill(); }
    else if (hairstyle === 2) { for (let n = 0; n < 6; n++) dot(-18 + n * 7, -73 - n % 2 * 3, 7, hair); }
    else if (hairstyle >= 3) { ctx.beginPath(); ctx.moveTo(-22, -66); ctx.lineTo(-9, -61); ctx.lineTo(-3, -68); ctx.lineTo(8, -62); ctx.lineTo(22, -68); ctx.closePath(); ctx.fill(); }
    studentExpression(lane, time, skin);
    if (index % 7 === 2) {
      ctx.strokeStyle = '#435268'; ctx.lineWidth = 1.4;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 8, -50, 7, 6, 0, 0, TAU); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-1, -51); ctx.lineTo(1, -51); ctx.stroke();
    }
    ctx.restore();
    if (lane.eaten || lane.hurt) {
      for (let n = 0; n < 3; n++) { const a = time * 4 + n * TAU / 3; text('★', Math.cos(a) * 28, -78 + Math.sin(a) * 6, 12, 12, '#fff0a0', 900, 'center'); }
    }
    ctx.restore();
  }
  function studentExpression(lane, time, skin) {
    const stage = lane.emotionStage, scared = stage >= 5, dazed = stage === 9;
    // This is the only face: eye opening, pupil direction, hinged brows and
    // mouth follow the emotional state on a freshly painted full head.
    const eyeHeight = dazed ? 3 : stage === 0 ? 3.5 : 4 + stage * .45;
    for (const side of [-1, 1]) {
      const eyeX = side * 7;
      ctx.fillStyle = '#fffdf0'; ctx.beginPath(); ctx.ellipse(eyeX, -50, 5, eyeHeight, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3e3731'; ctx.lineWidth = 1.5;
      if (dazed) { ctx.beginPath(); ctx.arc(eyeX, -50, 2.5, time, time + Math.PI * 1.8); ctx.stroke(); }
      else dot(eyeX + (scared ? Math.sin(time * 2) * .6 : 0), -50 + (stage === 3 ? 1 : 0), scared ? 2.1 : 2.5, '#39362d');
      const tilt = stage === 0 ? 0 : stage <= 2 ? -.5 : stage === 3 ? side * 2 : -side * (stage >= 6 ? 3 : 1.5);
      ctx.beginPath(); ctx.moveTo(eyeX - 4, -59 + tilt); ctx.quadraticCurveTo(eyeX, -61 - (scared ? 1 : 0), eyeX + 4, -59 - tilt); ctx.stroke();
    }
    ctx.strokeStyle = '#ae806380'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(3, -44, 0, -43); ctx.stroke();
    ctx.strokeStyle = '#965e50'; ctx.lineWidth = 1.8; ctx.beginPath();
    if (stage <= 1) { ctx.moveTo(-5, -39); ctx.quadraticCurveTo(0, stage === 0 ? -33 : -36, 5, -39); ctx.stroke(); }
    else if (stage <= 4) { ctx.moveTo(-5, -38); ctx.quadraticCurveTo(0, -40 - (stage - 2), 5, -38); ctx.stroke(); }
    else { ctx.fillStyle = '#89554b'; ctx.ellipse(0, -37, stage === 9 ? 3 : 3.5 + (stage - 5) * .4, stage === 9 ? 2 : 3 + (stage - 5) * .5, 0, 0, TAU); ctx.fill(); }
    if (lane.hp < lane.maxHp) {
      dot(-12, -40, 2.7, '#997d9d66');
      if (lane.bruiseStage >= 2) { ctx.fillStyle = '#b5e5f1cc'; ctx.beginPath(); ctx.ellipse(12, -41, 1.8, 3.4, -.1, 0, TAU); ctx.fill(); }
      if (lane.bruiseStage >= 3) dot(10, -36, 2, '#997d9d55');
    }
  }
  function lawnmower(lane, time) {
    const mower = lane.mower;
    if (mower.status === 'spent') return;
    const running = mower.status === 'sweeping', x = lane.plantX + visualBetween(mower.previousX, mower.x) * lane.travel;
    const naturalWidth = mowerArt?.ready ? Number(mowerArt.manifest.naturalWidth) || 82.8 : 82.8;
    const size = Math.min(lane.spriteScale * .72 * 82.8, lane.travel * .072);
    ctx.save(); ctx.translate(x, lane.floor); ctx.scale(size / naturalWidth, size / naturalWidth);
    ctx.fillStyle = '#26482755'; ctx.beginPath(); ctx.ellipse(0, -2, 37, 7, 0, 0, TAU); ctx.fill();
    if (mowerArt?.ready) {
      const manifest = mowerArt.manifest;
      ctx.save(); ctx.translate(-manifest.origin[0], -manifest.origin[1]);
      for (const track of manifest.tracks) {
        const image = mowerArt.images.get(track.image);
        if (!image) continue;
        const kx = (track.kx || 0) * Math.PI / 180, ky = (track.ky || 0) * Math.PI / 180;
        ctx.save(); ctx.transform(Math.cos(kx) * track.sx, Math.sin(kx) * track.sx, -Math.sin(ky) * track.sy, Math.cos(ky) * track.sy, track.x, track.y);
        if (running && track.shakeEngine) ctx.translate(Math.sin(time * 71) * .45, Math.cos(time * 67) * .3);
        if (running && track.rotateWheel) { const pivot = track.pivot || manifest.assets[track.image].pivot || [image.naturalWidth / 2, image.naturalHeight / 2]; ctx.translate(pivot[0], pivot[1]); ctx.rotate(time * 26); ctx.translate(-pivot[0], -pivot[1]); }
        ctx.drawImage(image, 0, 0); ctx.restore();
      }
      ctx.restore();
    } else {
      // Connected handle, engine, metal deck and rotating wheels remain fully
      // usable while the optional original multipart artwork is loading.
      ctx.strokeStyle = '#364143'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-21, -21); ctx.lineTo(-33, -60); ctx.lineTo(-16, -63); ctx.stroke();
      ctx.strokeStyle = '#9ba8a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, -23); ctx.lineTo(-31, -59); ctx.stroke();
      rr(-37, -27, 75, 22, 8, '#c72f29', '#713d32'); rr(-32, -29, 66, 8, 4, '#e74e37');
      ctx.save(); if (running) ctx.translate(Math.sin(time * 71) * .45, Math.cos(time * 67) * .3);
      rr(-19, -44, 36, 21, 6, '#364444', '#263233'); rr(-15, -44, 27, 7, 3, '#77827b');
      for (let n = 0; n < 5; n++) rr(-13 + n * 5, -33, 2, 6, 1, '#adb2a0');
      dot(22, -32, 5, '#efcc77', '#a97237'); ctx.restore();
      for (const wheelX of [-27, 27]) {
        dot(wheelX, -8, 12, '#253032', '#131e22'); dot(wheelX, -8, 7, '#818b7f', '#bec5af');
        const angle = running ? time * 26 : 0;
        ctx.strokeStyle = '#ced3bd'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wheelX + Math.cos(angle) * 6, -8 + Math.sin(angle) * 6); ctx.lineTo(wheelX - Math.cos(angle) * 6, -8 - Math.sin(angle) * 6); ctx.stroke(); dot(wheelX, -8, 2.4, '#34413a');
      }
    }
    if (running) {
      ctx.strokeStyle = '#dbec92'; ctx.lineWidth = 2;
      for (let n = 0; n < 7; n++) { const phase = (time * 6 + n * .23) % 1, grassX = -25 - phase * 32, grassY = -6 - Math.sin(phase * Math.PI) * (8 + n % 3 * 6); ctx.beginPath(); ctx.moveTo(grassX, grassY); ctx.lineTo(grassX - 4, grassY - 4); ctx.stroke(); }
    }
    ctx.restore();
  }
  function potatoMine(lane) {
    const mine = lane.trap; if (!mine || (mine.spent && simTime - mine.explodedAt > .7)) return;
    const rule = PLANT_BY_ID.potato, age = simTime - mine.bornAt;
    ctx.save(); ctx.translate(lane.plantX + mine.position * lane.travel, lane.floor); ctx.scale(lane.spriteScale, lane.spriteScale);
    const rigged = renderer.drawPlant(ctx, { weapon: 'potato', time: simTime, simTime, hp: 300, maxHp: 300, seed: identityHash(mine.uid), defender: { armed: mine.armed, armingAge: age, armDelay: rule.armDelay, riseDuration: rule.riseDuration, armProgress: clamp(age / (rule.armDelay + rule.riseDuration), 0, 1), exploding: mine.spent } });
    if (!rigged) {
      const rise = mine.spent ? 0 : mine.armed ? 1 : .25;
      ctx.fillStyle = '#826747'; ctx.beginPath(); ctx.ellipse(0, -2, 22, 5, 0, 0, TAU); ctx.fill();
      rr(-15, -28 * rise, 31, 26 * rise + 2, 10, '#bc965e', '#6d563c'); dot(0, -30 * rise, 6, mine.armed ? '#e85038' : '#b28f68');
      if (mine.armed) { dot(-7, -15, 3, '#fff0c5'); dot(7, -15, 3, '#fff0c5'); dot(-6, -15, 1.5, '#463c2c'); dot(6, -15, 1.5, '#463c2c'); }
    }
    ctx.restore();
  }
  function extraPlants(lane) {
    const torch = lane.torchwood;
    if (torch && (!torch.eaten || simTime - torch.eatenAt < .65)) {
      const age = torch.eaten ? simTime - torch.eatenAt : 0;
      ctx.save(); ctx.translate(lane.plantX + torch.position * lane.travel, lane.floor); ctx.scale(lane.spriteScale, lane.spriteScale);
      if (torch.eaten) { ctx.rotate(age); ctx.globalAlpha = Math.max(0, 1 - age / .65); }
      if (torch.hurt) ctx.translate(Math.sin(simTime * 50) * 2, 0);
      if (!renderer.drawPlant(ctx, { weapon: 'torchwood', time: simTime, simTime, hp: torch.hp, maxHp: torch.maxHp, seed: identityHash(torch.uid), defender: torch })) {
        rr(-15, -46, 30, 44, 7, '#95673b', '#664827');
        for (let n = 0; n < 4; n++) { ctx.fillStyle = n % 2 ? '#ffdb6b' : '#f29b42'; ctx.beginPath(); ctx.ellipse(-10 + n * 7, -47, 7, 16 + Math.sin(simTime * 5 + n) * 3, .15, 0, TAU); ctx.fill(); }
        dot(-6, -27, 3, '#352b24'); dot(6, -27, 3, '#352b24');
      }
      ctx.restore();
    }
    const bomb = lane.bomb;
    if (bomb && !bomb.spent && bomb.fuseFirstSeenWall === null) bomb.fuseFirstSeenWall = wallTime;
    if (bomb?.spent && bomb.burstFirstSeenWall === null) bomb.burstFirstSeenWall = wallTime;
    const burstAge = bomb?.spent ? Math.max(0, (wallTime - bomb.burstFirstSeenWall) / 1000) : 0;
    if (bomb && (!bomb.spent || burstAge < PICKER_VISUAL_TIMING.cherryBurstWallSeconds)) {
      ctx.save(); ctx.translate(lane.plantX + bomb.position * lane.travel, lane.floor); ctx.scale(lane.spriteScale, lane.spriteScale);
      if (bomb.spent) {
        const p = clamp(burstAge / PICKER_VISUAL_TIMING.cherryBurstWallSeconds, 0, 1);
        ctx.globalAlpha = 1 - p; ctx.fillStyle = '#fff2b4aa'; ctx.strokeStyle = '#fff2bf'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, -17, 24 + p * 65, 19 + p * 35, 0, 0, TAU); ctx.fill(); ctx.stroke();
        for (let n = 0; n < 9; n++) { const a = n * TAU / 9; dot(Math.cos(a) * p * 76, -20 + Math.sin(a) * p * 39, 5 * (1 - p) + 1, n % 2 ? '#ffbd68' : '#fff5ba'); }
      }
      const fuseAge = Math.max(0, simTime - bomb.bornAt) * PLANT_BY_ID.cherrybomb.fuse / PICKER_VISUAL_TIMING.cherryFuse;
      if (!renderer.drawPlant(ctx, { weapon: 'cherrybomb', time: simTime, simTime, hp: 300, maxHp: 300, seed: identityHash(bomb.uid), defender: { exploding: bomb.spent, fuseAge } })) {
        dot(-10, -16, 15, '#d64b3d', '#8b4938'); dot(13, -15, 14, '#e25842', '#8b4938');
        ctx.strokeStyle = '#6f9e46'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.quadraticCurveTo(-4, -48, 12, -29); ctx.stroke(); dot(-12, -18, 2.5, '#ffeac8'); dot(10, -17, 2.5, '#ffeac8');
      }
      ctx.restore();
      if (!bomb.spent) {
        const x = lane.plantX + bomb.position * lane.travel, remaining = Math.max(1, Math.ceil(bomb.fuseAt - simTime - 1e-8));
        const pulse = 1 + Math.sin((simTime - bomb.bornAt) * TAU * 2) * .10;
        ctx.save(); ctx.strokeStyle = '#fff2ae'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, lane.floor - 4, 24 * lane.spriteScale * pulse, 7 * lane.spriteScale, 0, 0, TAU); ctx.stroke();
        rr(x - 12, lane.floor - 69 * lane.spriteScale - 10, 24, 22, 11, '#9d4939', '#ffe2a0');
        text(remaining, x, lane.floor - 69 * lane.spriteScale + 1, 20, 14, '#fff2b4', 900, 'center'); ctx.restore();
      }
    }
  }
  function giantGeometry(lane, mob = { x: .75 }) {
    const top = Math.max(boardHeader, viewport.scrollTop || 0);
    const bottom = Math.min(height - boardFooter, (viewport.scrollTop || 0) + viewportHeight);
    const clip = { x: lane.plantX + 42, y: top, width: width - lane.plantX - 54, height: Math.max(1, bottom - top) };
    // Only an arena physically shorter than a full giant can limit its size;
    // lane height never does. The foot may move down while its lane stays fixed.
    const displayHeight = monsters.dimensions(mob.monsterId)?.height || GARDEN_MONSTER_TYPES.find(type => type.id === mob.monsterId)?.height || GARDEN_MONSTER_HEIGHT;
    const scale = Math.min(lane.zombieScale, Math.max(.02, (clip.height - 16) / displayHeight));
    const typeWidth = monsters.dimensions(mob.monsterId)?.width || GARDEN_MONSTER_TYPES.find(type => type.id === mob.monsterId)?.width || GARDEN_MONSTER_HEIGHT * 470 / 370;
    const halfWidth = (typeWidth / 2 + 28) * scale;
    const x = clamp(lane.plantX + mob.x * lane.travel, clip.x + halfWidth, clip.x + clip.width - halfWidth);
    const y = clamp(lane.floor, clip.y + displayHeight * scale + 8, clip.y + clip.height - 8);
    return { x, y, scale, height: displayHeight * scale, clip, laneFloor: lane.floor, laneX: lane.plantX + mob.x * lane.travel };
  }
  function giantLaneMarker(lane, mob) {
    if (mob.dead || mob.type.miniature) return;
    const giant = giantGeometry(lane, mob), anchorX = clamp(giant.laneX, giant.clip.x + 20, width - 28);
    ctx.save(); ctx.strokeStyle = '#fff1a9b0'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(giant.x, giant.y - 3); ctx.lineTo(anchorX, lane.floor - 3); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffe18a40'; ctx.strokeStyle = '#ffe89f'; ctx.beginPath(); ctx.ellipse(anchorX, lane.floor - 3, 24, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    const label = mob.type.name + ' → ' + lane.entry.name, labelWidth = Math.min(205, Math.max(125, label.length * 6 + 14));
    const labelX = clamp(anchorX - labelWidth / 2, giant.clip.x + 4, width - labelWidth - 16);
    rr(labelX, lane.floor - 25, labelWidth, 18, 8, '#35452ee6', '#e9ce85');
    text(label, labelX + labelWidth / 2, lane.floor - 16, labelWidth - 12, 10, '#fff0bb', 850, 'center'); ctx.restore();
  }
  function zombie(lane, mob, time) {
    const deadAge = mob.dead ? simTime - mob.deathAt : 0;
    const x = lane.plantX + mob.x * lane.travel, floor = lane.floor;
    const scale = lane.zombieScale, type = mob.type;
    if (type.giant) {
      const giant = giantGeometry(lane, mob), animationTime = mob.animationTime ?? simTime;
      const biteInterval = mob.cadence / (simTime < mob.slowUntil ? mob.slow : 1);
      const bite = mob.attacking ? .5 + .5 * Math.cos((simTime - mob.nextBite) / Math.max(.1, biteInterval) * TAU) : 0;
      ctx.save(); if (mob.dead) ctx.globalAlpha = Math.max(0, 1 - deadAge / .7);
      monsters.draw(ctx, { id: mob.monsterId, instanceId: mob.uid, x: giant.x, y: giant.y, scale: giant.scale, time: animationTime, hp: mob.hp, maxHp: mob.maxHp, hit: mob.hurt, bite, walk: !mob.dead && !mob.attacking && simTime >= mob.stunnedUntil, death: mob.dead ? clamp(deadAge / .7, 0, 1) : 0, clip: giant.clip });
      ctx.restore();
      if (!mob.dead) { const barY = giant.y - giant.height + 5; hpBar(giant.x - 35, barY, 70, mob.hp, mob.maxHp, '#dfb66c', 5); if (!type.miniature) text(type.name + ' · ' + Math.ceil(mob.hp), giant.x, barY + 14, 145, 10, '#fff5cf', 850, 'center'); }
      if (!mob.dead && mob.fuseAt) {
        const remaining = Math.max(1, Math.ceil(mob.fuseAt - simTime));
        rr(giant.x - 18, giant.y - giant.height * .58, 36, 25, 8, '#a43f2d', '#ffe69b');
        text(remaining, giant.x, giant.y - giant.height * .58 + 12, 30, 15, '#fff2bd', 900, 'center');
      }
      return;
    }
    ctx.save(); ctx.translate(x, floor); ctx.scale(scale, scale);
    if (mob.dead) { ctx.rotate(-Math.min(1, deadAge / .45) * 1.5); ctx.globalAlpha = Math.max(0, 1 - deadAge / .7); ctx.translate(0, 5); }
    else if (mob.dodgePose) ctx.rotate(.22);
    else if (mob.hurt) ctx.translate(3, 0);
    const animationTime = mob.animationTime ?? simTime;
    const walk = Math.sin(animationTime * (mob.stage ? 5 : 7) + mob.pose), bob = Math.abs(walk) * 2;
    ctx.fillStyle = '#24482655'; ctx.beginPath(); ctx.ellipse(0, 0, 21, 5, 0, 0, TAU); ctx.fill();
    // The rig chosen at spawn remains the same zombie through every wound.
    // Armor is an independent layer; damage never selects another body atlas.
    const illustrated = renderer.drawZombie(ctx, { mob, time: animationTime, simTime: animationTime });
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
    if (simTime < mob.slowUntil && !mob.dead) {
      rr(-24, -91, 49, 89, 9, '#b5edff28'); ctx.strokeStyle = '#b3e9fabb'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -42, 26, .4, 4); ctx.stroke();
      for (let n = 0; n < 4; n++) { ctx.fillStyle = '#d5f4ffd9'; ctx.beginPath(); ctx.moveTo(-18 + n * 12, -4); ctx.lineTo(-15 + n * 12, -14 - n % 2 * 4); ctx.lineTo(-12 + n * 12, -4); ctx.fill(); } text('❄', 22, -81, 15, 14, '#e1f8ff', 900);
    }
    if (simTime < (mob.stunnedUntil || 0) && !mob.dead) { rr(-14, -86, 26, 12, 3, '#ffe373', '#c7a746'); dot(-8, -83, 2, '#fff5c0'); text('★', 21, -73, 15, 12, '#fff3a7', 900); }
    ctx.restore();
    if (!mob.dead) {
      hpBar(x - 19, floor - 130 * scale, 38, mob.hp, mob.maxHp, mob.stage ? '#ebbc59' : '#8dce64', 3);
      text(Math.ceil(mob.hp), x, floor - 130 * scale - 6, 48, 8, '#f8ffe8', 800, 'center');
    }
  }
  function scene(time, resultAge) {
    const top = viewport.scrollTop || 0, bottom = top + (viewport.clientHeight || height);
    const visible = lane => lane.y + lane.h >= top - 64 && lane.y <= bottom + 64;
    ctx.fillStyle = '#5f853b'; ctx.fillRect(0, 0, width, height);
    const sky = ctx.createLinearGradient(0, 0, 0, boardHeader); sky.addColorStop(0, '#8dc9dc'); sky.addColorStop(1, '#c1e4c8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, boardHeader);
    ctx.save(); ctx.scale(1, boardHeader / 64);
    dot(width - 43, 28, 18, '#ffd46e'); dot(width - 43, 28, 27, '#ffe69833');
    for (let i = 0; i < 4; i++) { const x = (i * 270 + time * 3) % (width + 80) - 45; dot(x, 21, 13, '#fffaf299'); dot(x + 17, 18, 18, '#fffaf299'); dot(x + 37, 24, 12, '#fffaf299'); }
    // A little house, fence, sun and one soil border make this a single garden.
    rr(18, 29, 69, 38, 2, '#e6d3a2', '#a49165');
    ctx.fillStyle = '#b96d48'; ctx.beginPath(); ctx.moveTo(10, 31); ctx.lineTo(52, 4); ctx.lineTo(95, 31); ctx.closePath(); ctx.fill();
    rr(25, 36, 15, 13, 1, '#92c8d1', '#c9b079'); rr(44, 42, 19, 25, 2, '#9c7857'); dot(59, 55, 1.2, '#e9d498');
    for (let x = 0; x < width; x += 26) { rr(x + 3, 58, 17, 14, 2, '#e2dda9'); ctx.fillStyle = '#f4edc2'; ctx.beginPath(); ctx.moveTo(x + 3, 58); ctx.lineTo(x + 11.5, 51); ctx.lineTo(x + 20, 58); ctx.fill(); }
    rr(0, 63, width, 5, 0, '#cbc493');
    ctx.restore();
    // A friendly villager watches from the house, outside every combat lane.
    if (monsters.has('minecraft-villager')) monsters.draw(ctx, { id: 'minecraft-villager', instanceId: 'resident-villager', x: Math.min(width - 70, 135) + Math.sin(wallTime / 2500) * 8, y: boardHeader - 3, scale: Math.min(.78, boardHeader / 78), time: wallTime / 1000, walk: phase === 'running' });
    const lawnBottom = Math.max(boardHeader + Math.max(1, lanes.length) * laneHeight, height - boardFooter);
    rr(7, boardHeader - 2, width - 14, lawnBottom - boardHeader + 11, 7, '#8c7147');
    ctx.fillStyle = '#78b447'; ctx.fillRect(12, boardHeader, width - 24, lawnBottom - boardHeader);
    for (const lane of lanes) {
      if (!visible(lane)) continue;
      const won = phase === 'result' && winner === lane;
      const tileStart = lane.x, tileWidth = lane.w / 9;
      for (let col = 0; col < 9; col++) {
        ctx.fillStyle = (col + lane.index) % 2 ? '#75b347' : '#88c058'; ctx.fillRect(tileStart + col * tileWidth, lane.y, tileWidth + .5, lane.h);
      }
      if (won) { ctx.fillStyle = '#fff6b32e'; ctx.fillRect(tileStart, lane.y, lane.w, lane.h); }
      ctx.strokeStyle = '#446b2b28'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lane.x, lane.y + lane.h -.5); ctx.lineTo(lane.x + lane.w, lane.y + lane.h -.5); ctx.stroke();
    }
    // All lawn tiles are painted before actors. Original joint motions can
    // extend above a row without a later row background erasing their parts.
    ctx.save(); ctx.beginPath(); ctx.rect(7, 0, width - 14, height); ctx.clip();
    for (const lane of lanes) {
      if (!visible(lane)) continue;
      const won = phase === 'result' && winner === lane;
      const tiny = lane.h < 36;
      const team = livingDefenders(lane), teamIcons = team.map(defender => WEAPON_MAP[defender.weapon].icon).join(' ') + (lane.power ? ' · ' + lane.power : '');
      if (lane.h >= 50) text(teamIcons, lane.plantX + .09 * lane.travel, lane.y + 10, Math.max(60, lane.travel * .36), 9, '#355b30', 850);
      for (let g = lane.rail + 8; g < lane.w; g += 53) {
        ctx.strokeStyle = '#47792e77'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lane.x + g + 9, lane.floor + 3); ctx.lineTo(lane.x + g + 7, lane.floor - 2); ctx.lineTo(lane.x + g + 9, lane.floor + 1); ctx.lineTo(lane.x + g + 13, lane.floor - 2); ctx.stroke();
      }
      [...lane.mobs].filter(mob => !mob.type.giant).sort((a, b) => b.x - a.x).forEach(mob => zombie(lane, visualMob(mob), time));
      lane.defenders.forEach(defender => plant(lane, defender, time));
      student(lane, time, won ? resultAge : 0);
      potatoMine(lane);
      extraPlants(lane);
      lawnmower(lane, time);
      lane.mobs.filter(mob => mob.type.giant).forEach(mob => giantLaneMarker(lane, visualMob(mob)));
      const collectionAge = Math.max(0, (wallTime - lane.collectionAt) / 1000);
      if (collectionAge < .65) {
        ctx.save(); ctx.globalAlpha = 1 - collectionAge / .65;
        const color = lane.collectedKind === 'star' ? '#c5edff' : '#ffec88';
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(lane.plantX, lane.floor - 30 * Math.min(.76, (lane.h - 29) / 84), 14 + collectionAge * 28, 20 + collectionAge * 15, 0, 0, TAU); ctx.stroke();
        text(lane.collectedKind === 'star' ? '★' : lane.collectedKind === 'sun' ? '☀' : '+', lane.plantX, lane.floor - 40, 26, 21, color, 900, 'center'); ctx.restore();
      }
      if (won && resultAge > .4) { const badgeX = Math.min(lane.x + lane.w - 121, lane.plantX + 36); rr(badgeX, lane.y + lane.h / 2 - 12, 114, 25, 12, '#ffda72'); text('NEXT SPEAKER', badgeX + 57, lane.y + lane.h / 2 + 1, 107, 10, '#3d492f', 900, 'center'); }
    }
    ctx.restore();
    // Special creatures paint in front of the lawn actors. Player tags are
    // the final actor pass, so each student remains easy to identify.
    for (const lane of lanes) if (visible(lane)) {
      [...lane.mobs].filter(mob => mob.type.giant).sort((a,b) => b.x-a.x).forEach(mob => zombie(lane, visualMob(mob), time));
    }
    for (const lane of lanes) if (visible(lane)) drawStudentTag(lane, phase === 'result' && winner === lane);
    for (const originalShot of shots) {
      const shot = { ...originalShot, x: visualBetween(originalShot.renderPreviousX, originalShot.x) };
      const lane = lanes[shot.lane], x = lane.plantX + shot.x * lane.travel;
      if (!visible(lane)) continue;
      const headOffset = shot.weapon === 'burst' ? 51 - shot.rotation % 3 * 16 : 38;
      const progress = clamp((shot.x - shot.origin) / Math.max(.01, 1 - shot.origin), 0, 1);
      const originLane = lanes[shot.ownerLane], rowProgress = clamp((shot.x - shot.origin) / .12, 0, 1);
      const rowFloor = originLane.floor + (lane.floor - originLane.floor) * rowProgress;
      const y = rowFloor - headOffset * lane.spriteScale - (shot.arc ? Math.sin(progress * Math.PI) * 47 * lane.spriteScale : Math.sin(shot.x * 9 + shot.rotation) * 1.5);
      const kind = shot.weapon === 'wintermelon' ? 'wintermelon' : { ice: 'snow', thorn: 'spike', pea: 'pea', fire: 'fire', melon: 'melon', kernel: 'kernel', butter: 'butter' }[shot.projectileStyle] || 'pea';
      if (fx.drawProjectile(ctx, { kind, x, y, scale: lane.spriteScale, time: simTime, progress, rotation: shot.rotation })) continue;
      const color = shot.projectileStyle === 'ice' || shot.weapon === 'wintermelon' ? '#b6edff' : shot.projectileStyle === 'fire' ? '#ffcc6b' : '#a9e56e';
      if (shot.weapon === 'thorn' || shot.weapon === 'pierce') { ctx.fillStyle = '#dfef9a'; ctx.beginPath(); ctx.moveTo(x + 5, y); ctx.lineTo(x - 5, y - 3); ctx.lineTo(x - 5, y + 3); ctx.fill(); }
      else if (shot.projectileStyle === 'butter') { ctx.save(); ctx.translate(x, y); ctx.rotate(shot.x * 7); rr(-6, -4, 12, 8, 2, '#ffe887', '#bca145'); rr(-4, -3, 8, 2, 1, '#fff5be'); ctx.restore(); }
      else if (shot.projectileStyle === 'kernel') { dot(x, y, 4, '#ffe277', '#bca145'); dot(x - 1, y - 1, 1, '#fff3bb'); }
      else { dot(x - 6, y, 3, color + '55'); dot(x, y, shot.arc ? 8 : 4.6, color, '#598d3f'); if (shot.arc) { ctx.strokeStyle = '#598d3f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 2, y - 7); ctx.quadraticCurveTo(x - 6, y, x - 2, y + 7); ctx.moveTo(x + 3, y - 7); ctx.quadraticCurveTo(x - 1, y, x + 3, y + 7); ctx.stroke(); } dot(x - 1.5, y - 1.5, 1.4, '#f5ffd9'); }
    }
    for (const impact of impacts) {
      const lane = lanes[impact.lane]; if (!visible(lane)) continue;
      impact.firstSeenWall ??= wallTime;
      impact.age = Math.max(0, (wallTime - impact.firstSeenWall) / 1000) * PICKER_VISUAL_TIMING.melonImpactTimeScale;
      fx.drawImpact(ctx, impact, { x: lane.plantX + impact.position * lane.travel, y: lane.floor, scale: lane.spriteScale, age: impact.age });
    }
    impacts = impacts.filter(impact => impact.age <= 3 && wallTime - impact.createdWall < 15000).slice(-120);
    for (const effect of effects) {
      const lane = lanes[effect.lane], x = lane.plantX + effect.x * lane.travel, y = lane.floor + (effect.y || 0) * lane.spriteScale;
      if (!visible(lane)) continue;
      ctx.save(); ctx.globalAlpha = clamp(effect.life * 3, 0, 1);
      if (effect.kind === 'particle') dot(x, y, effect.radius, effect.color);
      else if (effect.kind === 'text') text(effect.value, x, y, 78, 10, effect.color, 900, 'center');
      else if (effect.kind === 'beam') { ctx.strokeStyle = '#fffad7'; ctx.shadowColor = '#ffde6a'; ctx.shadowBlur = 10; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lane.plantX + (effect.origin || 0) * lane.travel + 25 * lane.spriteScale, lane.floor - 38 * lane.spriteScale); ctx.lineTo(x, lane.floor - 41 * lane.zombieScale); ctx.stroke(); }
      else if (effect.kind === 'splash') { const growth = .65 + (1 - effect.life / .55) * .35; ctx.fillStyle = effect.color + '22'; ctx.strokeStyle = effect.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, lane.floor - 8, effect.radius * lane.travel * growth, Math.max(8, lane.h * .38), 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (effect.kind === 'mineBlast') { const p = 1 - effect.life / .6; ctx.fillStyle = '#fff1b144'; ctx.strokeStyle = '#fff1b1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, lane.floor - 7, (14 + p * 37) * lane.spriteScale, (10 + p * 15) * lane.spriteScale, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    for (const drop of pickupFlights) {
      const lane = lanes[drop.lane], owner = lanes[drop.ownerLane], p = clamp((wallTime - drop.startedWall) / 1000 / drop.duration, 0, 1);
      if (!visible(lane) && !visible(owner)) continue;
      const fromX = lane.plantX + drop.x * lane.travel, toX = owner.plantX, x = fromX + (toX - fromX) * p;
      const targetY = owner.floor - 32 * clamp((owner.h - 29) / 84, .12, .76);
      const fromY = lane.floor + drop.y, y = fromY + (targetY - fromY) * p - Math.sin(p * Math.PI) * 40;
      ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = drop.kind === 'star' ? '#b9e5ff' : '#ffdf74';
      dot(x, y, drop.kind === 'loot' ? 10 : 12, drop.kind === 'star' ? '#c8eaff' : '#ffe486', '#d29334');
      text(drop.item?.icon || (drop.kind === 'sun' ? '☀' : '★'), x, y, 24, drop.kind === 'loot' ? 12 : 17, '#84632c', 900, 'center'); ctx.restore();
      if (p >= 1 && !drop.completed) { drop.completed = true; owner.collectionAt = wallTime; owner.collectedKind = drop.kind; }
    }
    pickupFlights = pickupFlights.filter(drop => !drop.completed && wallTime - drop.startedWall < 10000);
    for (const reward of rewards) {
      if (reward.flightStarted) continue;
      const lane = lanes[reward.lane], drift = reward.landed ? clamp((reward.collectAge - .32) / .78, 0, 1) : 0;
      const eased = drift * drift * (3 - 2 * drift);
      const startX = lane.plantX + reward.x * lane.travel, toX = lane.plantX, x = startX + (toX - startX) * eased + Math.sin(time * 2 + reward.phase) * (1 - eased) * 3;
      const y = lane.floor + reward.y - eased * 25 * clamp((lane.h - 29) / 84, .12, .76) - Math.sin(drift * Math.PI) * 22;
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
    if (!lanes.length) text('Add names to play Plants vs. Zombies.', 24, 125, width - 48, 17, C.cream, 800);
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
    if (key === 'mower') return; // Always silent, including any future fallback.
    if (!alive || !soundEnabled || !audio || audio.state !== 'running' || !sfxMaster || !lane) return;
    const top = viewport.scrollTop || 0, bottom = top + (viewport.clientHeight || height);
    if (lane.y + lane.h < top || lane.y > bottom || sfxVoices.size >= 12) return;
    const at = audio.currentTime, last = lastSfx.get(key) ?? -Infinity;
    if (at - last < soundGaps[key]) return;
    if (key === 'sun') {
      if (sfxVoices.size > 8) return;
      lastSfx.set(key, at);
      for (const [index, frequency] of [523.25, 659.25, 783.99, 1046.5].entries()) {
        let voice = null;
        try {
          const source = audio.createOscillator(), gain = audio.createGain(); voice = { source, gain }; source.type = 'sine';
          const startAt = at + index * .07; source.frequency.setValueAtTime(frequency, startAt);
          gain.gain.setValueAtTime(0, startAt); gain.gain.linearRampToValueAtTime(.10, startAt + .012); gain.gain.exponentialRampToValueAtTime(.0001, startAt + .21);
          source.connect(gain); gain.connect(sfxMaster); source.onended = () => { sfxVoices.delete(voice); source.disconnect(); gain.disconnect(); };
          sfxVoices.add(voice); source.start(startAt); source.stop(startAt + .23);
        } catch { if (voice) { sfxVoices.delete(voice); try { voice.source.stop(); voice.source.disconnect(); voice.gain.disconnect(); } catch {} } }
      }
      return true;
    }
    const available = (sampleURLs[key] || []).filter(url => sampleBuffers.has(url));
    if (!available.length) return;
    // Sound variations rotate independently of gameplay randomness. Muting,
    // asset failures and audio timing cannot change any combat outcome.
    const rotation = sfxRotation.get(key) || 0, url = available[rotation % available.length];
    let voice = null;
    try {
      const source = audio.createBufferSource(), gain = audio.createGain(); voice = { source, gain };
      source.buffer = sampleBuffers.get(url); source.playbackRate.value = 1;
      gain.gain.value = soundGains[key]; source.connect(gain); gain.connect(sfxMaster);
      source.onended = () => { sfxVoices.delete(voice); source.disconnect(); gain.disconnect(); };
      sfxVoices.add(voice); source.start(at); lastSfx.set(key, at); sfxRotation.set(key, rotation + 1); return true;
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
      const loaded = loadSamples(current, epoch);
      const resumed = current.resume().then(() => { if (audio === current && audioEpoch === epoch && alive && soundEnabled) scheduleMusic(); });
      Promise.allSettled([loaded, resumed]).then(() => {
        if (audio === current && audioEpoch === epoch && alive && soundEnabled && phase === 'running' && simTime < 3 && !introPlayed) introPlayed = Boolean(playSfx('intro', lanes[0]));
      }).catch(() => {});
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
  function setSpeed(rate) {
    if (!alive) return;
    const at = performance.now();
    if (phase === 'running' && clockAt !== null) simulationBudget += Math.max(0, (at - clockAt) / 1000) * Math.min(clockRate, effectiveTempo());
    clockAt = at; playbackRate = validSpeed(rate); clockRate = effectiveTempo();
  }
  function effectiveTempo() { return playbackRate; }
  function frame(timestamp) {
    if (!alive) return;
    wallTime = timestamp;
    if (phase === 'running' && wallTime >= nextVillagerSoundWall && monsters.has('minecraft-villager') && playSfx('villager', lanes[0])) nextVillagerSoundWall = wallTime + 14000;
    const token = generation;
    const visualDt = previous === null ? 0 : Math.min(.08, Math.max(0, (timestamp - previous) / 1000)); previous = timestamp;
    if (phase === 'running') {
      simulationBudget += Math.max(0, (timestamp - (clockAt ?? timestamp)) / 1000) * Math.min(clockRate, effectiveTempo()); clockAt = timestamp;
      // Rate only changes the clock, never attack statistics or RNG. Hot speed
      // changes preserve the previous interval and cannot jump past old time.
      while (phase === 'running' && simulationBudget + 1e-8 >= .04) {
        simulationBudget -= .04; step(.04);
      }
      clockRate = effectiveTempo();
      if (phase !== 'running') simulationBudget = 0;
    } else if (phase === 'result') advanceEffects(visualDt);
    if (phase === 'result' && visualResultAt === null) visualResultAt = timestamp;
    const resultAge = phase === 'result' ? Math.max(0, (timestamp - visualResultAt) / 1000) : 0;
    renderFraction = phase === 'running' ? clamp(simulationBudget / .04, 0, 1) : 1;
    renderTime = phase === 'idle' ? timestamp / 1000 : phase === 'running' ? Math.max(0, simTime - .04 + renderFraction * .04) : simTime + resultAge;
    scene(renderTime, resultAge);
    // A returning background tab still shows the student's gentle stun/fade
    // for 700 ms before asking the host to show its pick popup.
    if (phase === 'result' && !reported && resultAge >= .7) {
      reported = true; stopAudio(); onPick?.(winnerSnapshot.id);
    }
    if (alive && token === generation) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!alive || phase !== 'idle' || !lanes.length) return;
    startedAt = performance.now(); phase = 'running'; reported = false; winner = null; winnerSnapshot = null; visualResultAt = null;
    nextVillagerSoundWall = 0;
    clockAt = startedAt; clockRate = effectiveTempo(); simulationBudget = 0;
    note.textContent = 'Plants vs. Zombies: collect sunshine to grow defenders. Each student has one single-use lawnmower.';
    live.textContent = 'Plants vs. Zombies is starting. Each student has one single-use lawnmower for a second chance.';
    startMusic();
  }
  function reset() {
    if (!alive) return;
    generation++; cancelAnimationFrame(raf); previous = null; stopAudio();
    nextVillagerSoundWall = 0;
    phase = 'idle'; reported = false; winner = null; winnerSnapshot = null; resultAt = 0; visualResultAt = null; clockAt = null; clockRate = playbackRate; simulationBudget = 0;
    fresh(); viewport.scrollTop = 0;
    note.textContent = 'Plants vs. Zombies: sunshine grows your defenders. Protect your student with one single-use lawnmower.';
    live.textContent = ''; canvas.setAttribute('aria-label', 'Fresh Plants vs. Zombies round ready. Every student starts with 150 health behind a pea shooter with 300 health, a front Tall-nut with 1800 picker health, and one ready single-use lawnmower.');
    raf = requestAnimationFrame(frame);
  }
  function destroy() {
    if (!alive) return;
    alive = false; generation++; cancelAnimationFrame(raf); observer?.disconnect(); stopAudio();
    if (!observer) window.removeEventListener('resize', layout);
    for (const key of Object.keys(atlases)) { if (atlases[key]) { atlases[key].image.onload = null; atlases[key].image.onerror = null; } atlases[key] = null; }
    mowerLoadController?.abort(); mowerLoadController = null;
    if (mowerArt) for (const image of mowerArt.images.values()) { image.onload = null; image.onerror = null; }
    mowerArt = null;
    for (const lane of lanes) { lane.queuedSpawns = lane.deferredSpawns = lane.waveTarget = lane.waveSpawned = 0; lane.trap = lane.torchwood = lane.bomb = null; lane.mobs = []; }
    waveIndex = 0; nextWaveAt = Infinity;
    shots = []; pendingShots = []; effects = []; impacts = []; pickupFlights = []; drops = []; rewards = []; lanes = []; sampleBuffers.clear(); renderer.destroy(); fx.destroy(); monsters.destroy(); root.remove();
  }
  function getState() {
    return { phase, time: simTime, winnerId: winnerSnapshot?.id ?? null, winner: winnerSnapshot ? { ...winnerSnapshot } : null, soundEnabled, speed: playbackRate, effectiveSpeed: effectiveTempo(), wave: waveIndex, nextWaveAt,
      sizing: { width, height, viewportHeight, laneHeight, boardHeader, boardFooter, fitsAllRows: players.length <= 10 && boardHeader + lanes.length * laneHeight <= viewportHeight + .01 },
      presentation: { interpolated: true, combatStep: .04, time: renderTime, fraction: renderFraction },
      visualTiming: PICKER_VISUAL_TIMING, monsters: monsters.getState(), giantCatalogCount: GIANT_CATALOG.length, residentVillager: { ready: monsters.has('minecraft-villager'), audio: sampleURLs.villager.length, combatant: false },
      pickupFlights: pickupFlights.map(flight => ({ kind: flight.kind, sourceLane: flight.lane, ownerId: lanes[flight.ownerLane]?.entry.id, target: 'student', targetX: lanes[flight.ownerLane]?.plantX, duration: flight.duration, progress: clamp((performance.now() - flight.startedWall) / 1000 / flight.duration, 0, 1) })),
      audioEffects: { loadedSamples: sampleBuffers.size, activeVoices: sfxVoices.size, contextActive: Boolean(audio), loading: Boolean(audioLoadController) },
      renderer: renderer.getState(), fx: fx.getState(), melonImpacts: impacts.map(impact => ({ lane: impact.lane, x: impact.position, age: impact.age, kind: impact.kind })), plantCatalogCount: PLANT_CATALOG.length, ruleVersion: GARDEN_RULES.version, pickerPacing: PICKER_PACING,
      zombieCatalogCount: ZOMBIE_CATALOG.length, lootCatalogCount: LOOT_CATALOG.length, healthModel: HEALTH_MODEL,
      artworkLoaded: { plants: Boolean(atlases.plants?.ready), zombies: Boolean(atlases.zombies?.ready), students: Boolean(atlases.students?.ready), mower: Boolean(mowerArt?.ready), monsters: monsters.getState().ready }, fallingResources: rewards.map(reward => ({ kind: reward.kind, lane: reward.lane, landed: reward.landed, x: reward.x, y: reward.y, target: 'student' })),
      lanes: lanes.map(lane => ({ id: lane.entry.id, avatar: lane.entry.avatar, avatarCell: studentCell(lane.entry), hp: lane.hp, maxHp: lane.maxHp, studentHp: lane.hp, studentMaxHp: lane.maxHp, emotionStage: lane.emotionStage, emotionLabel: STUDENT_EMOTIONS[lane.emotionStage], bruiseStage: lane.bruiseStage, wave: lane.wave, waveSize: lane.waveSize, waveTarget: lane.waveTarget, waveSpawned: lane.waveSpawned, spawned: lane.waveSpawned, deferredSpawns: lane.deferredSpawns, deferred: lane.deferredSpawns, queuedSpawns: lane.queuedSpawns, pendingCount: lane.queuedSpawns + lane.deferredSpawns, nextWave: lane.nextWave, liveZombieCount: lane.mobs.filter(mob => !mob.dead).length, damage: lane.damage, cooldown: lane.cooldown, weapon: livingDefenders(lane)[0]?.weapon ?? null, power: lane.power, kills: lane.kills, loot: [...lane.loot], suns: lane.suns, stars: lane.stars, eaten: lane.eaten, shotsFired: lane.shotsFired, shield: livingDefenders(lane).reduce((total, defender) => total + defender.shield, 0),
        mower: { id: lane.mower.uid, status: lane.mower.status, x: lane.mower.x, previousX: lane.mower.previousX, home: LAWNMOWER_RULES.home, speed: LAWNMOWER_RULES.speed, activations: lane.mower.activations, activationKills: lane.mower.kills, kills: lane.mower.kills, killIds: [...lane.mower.killIds], activatedAt: lane.mower.activatedAt, spentAt: lane.mower.spentAt, triggeredBy: lane.mower.triggeredBy },
        trap: lane.trap ? { id: lane.trap.uid, type: 'potato', position: lane.trap.position, armAt: lane.trap.armAt, armRemaining: Math.max(0, lane.trap.armAt - simTime), armed: lane.trap.armed, spent: lane.trap.spent, kills: lane.trap.kills, damage: PLANT_BY_ID.potato.explosionDamage, explodedAt: lane.trap.explodedAt } : null,
        torchwood: lane.torchwood ? { id: lane.torchwood.uid, position: lane.torchwood.position, hp: lane.torchwood.hp, maxHp: lane.torchwood.maxHp, eaten: lane.torchwood.eaten, fireDamage: PLANT_BY_ID.torchwood.fireDamage, fireSplashDamage: PLANT_BY_ID.torchwood.fireSplashDamage } : null,
        geometry: { y: lane.y, height: lane.h, floor: lane.floor, studentX: lane.plantX, nameTag: studentTagGeometry(lane), nameWidth: lane.nameWidth, nameFontSize: lane.h < 36 ? 8 : width < 800 ? 11 : 12, plantScale: lane.spriteScale, zombieScale: lane.zombieScale, normalZombieHeight: 112 * lane.zombieScale, normalHeight: 112 * lane.zombieScale, giantScale: giantGeometry(lane).scale, giantHeight: giantGeometry(lane).height, giantFootY: giantGeometry(lane).y, giantClip: giantGeometry(lane).clip },
        cherryBomb: lane.bomb ? { id: lane.bomb.uid, position: lane.bomb.position, fuseAt: lane.bomb.fuseAt, fuseSeconds: PICKER_VISUAL_TIMING.cherryFuse, remaining: Math.max(0, lane.bomb.fuseAt - simTime), countdown: lane.bomb.spent ? 0 : Math.max(1, Math.ceil(lane.bomb.fuseAt - simTime - 1e-8)), spent: lane.bomb.spent, kills: lane.bomb.kills, damage: PLANT_BY_ID.cherrybomb.explosionDamage, burstAge: lane.bomb.burstFirstSeenWall === null ? null : Math.max(0, (wallTime - lane.bomb.burstFirstSeenWall) / 1000) } : null,
        defenders: lane.defenders.map(defender => ({ id: defender.uid, slot: defender.slot, position: defender.position, weapon: defender.weapon, name: WEAPON_MAP[defender.weapon].name, classification: WEAPON_MAP[defender.weapon].classification, sourceHealth: WEAPON_MAP[defender.weapon].sourceHealth ?? null, modeScaling: WEAPON_MAP[defender.weapon].modeScaling ?? 1, sourceDamage: WEAPON_MAP[defender.weapon].sourceDamage ?? null, role: WEAPON_MAP[defender.weapon].blocker ? 'blocker' : 'shooter', hp: defender.hp, maxHp: defender.maxHp, damageStage: plantDamageStage(defender.hp, defender.maxHp), damage: WEAPON_MAP[defender.weapon].blocker ? WEAPON_MAP[defender.weapon].contactDamage > 0 ? WEAPON_MAP[defender.weapon].contactDamage + defender.power * .6 : 0 : lane.damage * WEAPON_MAP[defender.weapon].multiplier, interval: WEAPON_MAP[defender.weapon].blocker ? null : Math.max(WEAPON_MAP[defender.weapon].intervalMin || 0, WEAPON_MAP[defender.weapon].interval * lane.cooldown / BASE_CADENCE), attackPattern: WEAPON_MAP[defender.weapon].blocker ? WEAPON_MAP[defender.weapon].contactDamage > 0 ? 'contact' : 'block' : defender.weapon, shield: defender.shield, power: defender.power, eaten: defender.eaten, bornAt: defender.bornAt, shotsFired: defender.shotsFired, kills: defender.kills })),
        mobs: lane.mobs.map(mob => ({ id: mob.uid, variant: mob.type.id, family: mob.type.family || null, giant: Boolean(mob.type.giant), monsterId: mob.monsterId, name: mob.type.name, biteCadence: mob.cadence, visualType: mob.visualType, rigIdentity: mob.rigIdentity, hp: mob.hp, maxHp: mob.maxHp, bodyHp: mob.bodyHp, maxBodyHp: mob.maxBodyHp, shieldHp: mob.shieldHp, maxShieldHp: mob.maxShieldHp, armorHp: mob.armorHp, maxArmorHp: mob.maxArmorHp, damage: mob.bite, speed: mob.speed, baseDamage: mob.type.bite, baseSpeed: mob.type.speed, dead: mob.dead, headless: mob.headless, stage: mob.stage, attacking: mob.attacking, x: mob.x, lastShooter: mob.lastShooter, slowMultiplier: simTime < mob.slowUntil ? mob.slow : 1, slowUntil: mob.slowUntil, biteMultiplier: simTime < mob.slowUntil ? mob.slow : 1, stunnedUntil: mob.stunnedUntil, nextBite: mob.nextBite, animationTime: mob.animationTime })) })),
      pendingProjectiles: pendingShots.map(shot => ({ ownerId: shot.ownerId, attackerId: shot.attackerId, weapon: shot.weapon, targetLane: shot.lane, fireAt: shot.fireAt, damage: shot.damage, style: shot.projectileStyle })),
      projectiles: shots.map(shot => ({ id: shot.uid, ownerId: shot.ownerId, attackerId: shot.attackerId, weapon: shot.weapon, targetLane: shot.lane, sourceLane: shot.ownerLane, x: shot.x, damage: shot.damage, style: shot.projectileStyle, splashDamage: shot.splashDamage, splashTiles: shot.splashTiles, slow: shot.slow, slowDuration: shot.slowDuration, stunDuration: shot.stunDuration })),
      combatLog: combatLog.map(entry => ({ ...entry })) };
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
  loadAtlas('plants', artwork?.gardenPlants);
  loadAtlas('zombies', artwork?.gardenZombies);
  loadAtlas('students', artwork?.students);
  loadMowerArtwork();
  fresh(); for (const target of [container, root, viewport]) observer?.observe(target); if (!observer) window.addEventListener('resize', layout);
  raf = requestAnimationFrame(frame);
  return { start, reset, destroy, setSound, setSpeed, getState };
}
