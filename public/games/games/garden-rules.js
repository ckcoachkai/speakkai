// Shared, source-backed PvZ 1 reference values. See assets/GARDEN-RULES.md.
// Seconds for durations, original lawn pixels/second for speed, HP for damage.
// These are a browser adaptation of community reconstructions, not binary parity.
const PRIMARY_SHA = 'c4692036c5e11d227c8fb7c593b734dac96da028';
const CORRECTION_SHA = '325b2229a7225d73870bb69322eefcda3a45bf8d';
const primary = path => `https://github.com/Patoke/re-plants-vs-zombies/blob/${PRIMARY_SHA}/${path}`;
const correction = path => `https://github.com/ruslan831/PlantsVsZombies-decompilation/blob/${CORRECTION_SHA}/${path}`;
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const GARDEN_RULES = freeze({
  version: 1,
  ticksPerSecond: 100, fps: 100, secondsPerTick: .01,
  rows: 5, columns: 9, tileWidth: 80, tileHeight: 100, pixelTileWidth: 80, pixelTileHeight: 100,
  defaultPlantHp: 300, peaDamage: 20, peaSpeed: 333,
  launchJitterTicks: 15, launchJitterMaxTicks: 14,
  sunValue: 25, initialSun: 50,
  biteDamage: 4, biteInterval: .04, biteDps: 100,
  slowMove: .5, slowBite: .5, slowDuration: 10,
  butterChance: .25, butterDamage: 40, butterDuration: 4,
  board: { rows: 5, columns: 9, tileWidth: 80, tileHeight: 100, xMin: 40, yMin: 80 },
  sun: {
    value: 25, initial: 50,
    firstSkyMin: 4.25, firstSkyMax: 7,
    skyBaseTicks: 425, skyIncrementTicks: 10, skyBaseMaxTicks: 950,
    skyJitterTicks: 275, skyJitterMaxTicks: 274,
    producerFirstMin: 3, producerFirstMax: 12.5,
    producerIntervalMin: 23.5, producerIntervalMax: 25
  },
  chill: {
    moveFactor: .5, biteFactor: .5, duration: 10,
    fallbackMoveFactor: .4, stacks: false, refreshesDuration: true,
    note: 'Ordinary articulated walkers use half animation rate; .4 applies to fallback/direct velocity and target lead.'
  },
  projectile: {
    peaDamage: 20, snowDamage: 20, peaSpeed: 333,
    melonDamage: 80, melonSplashDamage: 26, kernelDamage: 20, butterDamage: 40,
    cactusDamage: 20, cactusPierces: false,
    melonSplashRows: [-1, 0, 1], melonSplashHitboxWidth: 60, melonSplashHitboxOffset: 20,
    melonSplashDamagePool: 560,
    note: 'Splash uses horizontal collision-rectangle overlap, not a literal 3×3 tile square. The selected crowd cap follows the annotated PC 1.0.0.1051 correction.'
  },
  zombie: {
    biteDamage: 4, biteInterval: .04, biteDps: 100,
    chilledBiteInterval: .08, chilledBiteDps: 50,
    armLossRatio: 2 / 3, headLossRatio: 1 / 3,
    headlessCanBite: false, headlessDecayChancePerTick: .2, headlessBleedExpectedInterval: .05,
    headlessDecayDamage: 1, headlessLargeDecayDamage: 3,
    groundRateScale: 47,
    speedMethod: 'Reconstructed cycle-average ground velocity, with original clip frame counts; smooth motion is an adaptation.'
  },
  waves: {
    firstDelay: 18, intervalMin: 25, intervalMax: 30.99,
    earlyHpFractionMin: .5, earlyHpFractionMax: .65,
    earlyCheckAfter: 4, earlyRemainingDelay: 2, flagWarning: 7.5,
    note: 'Reference countdowns only. Browser classic mode supplies its own finite wave composition and grace period.'
  },
  mowers: { perRow: 1, uses: 1 },
  source: {
    primarySha: PRIMARY_SHA, correctionSha: CORRECTION_SHA,
    readme: 'https://akamai.cdn.ea.com/eadownloads/u/f/manuals/GAME-PVZ/en_US_readme.html',
    plants: primary('Lawn/Plant.cpp'), projectiles: primary('Lawn/Projectile.cpp'),
    zombies: primary('Lawn/Zombie.cpp'), board: primary('Lawn/Board.cpp'),
    projectileCorrections: correction('Lawn/Projectile.cpp'), zombieCorrections: correction('Lawn/Zombie.cpp'),
    caveat: 'Community reconstructed source, including annotated retail-binary corrections; no independent binary comparison was performed.'
  }
});

const shooter = (id, name, cost, damage = 20, launchRateTicks = 150, extra = {}) => ({
  id, name, original: true, role: 'shooter', cost, recharge: 7.5, rechargeTicks: 750,
  initialRecharge: 0, hp: 300, sourceHp: 300, damage, splashDamage: 0,
  launchRateTicks, launchMinTicks: launchRateTicks - 14, launchMaxTicks: launchRateTicks,
  interval: (launchRateTicks - 7) / 100,
  intervalMin: (launchRateTicks - 14) / 100, intervalMax: launchRateTicks / 100,
  firstLaunchMin: 0, firstLaunchMax: launchRateTicks / 100,
  count: 1, burstGap: 0, burstOffsets: [0], rows: [0],
  slow: 1, slowDuration: 0, stunChance: 0, stunDuration: 0,
  projectileSpeed: 333, motion: 'straight', pierce: false,
  bypassesShield: false, hitsShieldAndBody: false, upgradeFrom: null,
  ...extra
});
const blocker = (id, name, cost, hp, extra = {}) => ({
  id, name, original: true, role: 'blocker', cost, recharge: 30, rechargeTicks: 3000,
  initialRecharge: 20, hp, sourceHp: hp, damage: 0, splashDamage: 0,
  launchRateTicks: 0, launchMinTicks: 0, launchMaxTicks: 0,
  interval: 0, intervalMin: 0, intervalMax: 0, count: 0, burstGap: 0,
  burstOffsets: [], rows: [], slow: 1, slowDuration: 0,
  stunChance: 0, stunDuration: 0, upgradeFrom: null,
  ...extra
});
const melon = {
  motion: 'lobbed', projectileSpeed: null, splashDamage: 26,
  splashRows: [-1, 0, 1], splashHitboxWidth: 60, splashHitboxOffset: 20,
  splashDamagePool: 560, hitsShieldAndBody: true,
  shootingDelay: .35, shootingDelayTicks: 35
};

export const CLASSIC_PLANTS = freeze([
  {
    id: 'sunflower', name: 'Sunflower', original: true, role: 'producer', cost: 50,
    recharge: 7.5, rechargeTicks: 750, initialRecharge: 0, hp: 300, sourceHp: 300,
    damage: 0, splashDamage: 0, interval: 0, intervalMin: 0, intervalMax: 0,
    launchRateTicks: 2500, count: 0, burstGap: 0, burstOffsets: [], rows: [],
    slow: 1, slowDuration: 0, stunChance: 0, stunDuration: 0, upgradeFrom: null,
    sunValue: 25, sunCount: 1, sunInterval: 24.25,
    sunIntervalMin: 23.5, sunIntervalMax: 25, firstSunMin: 3, firstSunMax: 12.5
  },
  shooter('pea', 'Peashooter', 100, 20, 150, { shootingDelay: .28, shootingDelayTicks: 28 }),
  shooter('twin', 'Repeater', 200, 20, 150, {
    count: 2, burstGap: .25, burstOffsets: [0, .25], shootingDelay: .28,
    shootingDelayTicks: 28, secondTriggerRemainingTicks: 25,
    note: 'Steady paired shots are .25s apart across the launch-counter rollover; the first ever cycle has a different phase.'
  }),
  shooter('burst', 'Threepeater', 325, 20, 150, {
    count: 3, rows: [-1, 0, 1], burstOffsets: [0, 0, 0],
    shootingDelay: .34, shootingDelayTicks: 34, clipsAtRowEdges: true
  }),
  shooter('frost', 'Snow Pea', 175, 20, 150, {
    slow: .5, slowDuration: 10, slowBite: .5, chillRequiresBodyOrHelmHit: true,
    shootingDelay: .28, shootingDelayTicks: 28
  }),
  shooter('gatling', 'Gatling Pea', 250, 20, 150, {
    recharge: 50, rechargeTicks: 5000, initialRecharge: 35, upgradeFrom: 'twin',
    count: 4, burstGap: .1666666667, burstOffsets: [0, .17, .33, .5],
    shootingOffsets: [.32, .49, .65, .82], shootingOffsetsTicks: [32, 49, 65, 82],
    shootingDelay: .32, shootingDelayTicks: 32
  }),
  shooter('catapult', 'Melon-pult', 300, 80, 300, melon),
  shooter('wintermelon', 'Winter Melon', 200, 80, 300, {
    ...melon, recharge: 50, rechargeTicks: 5000, initialRecharge: 35,
    upgradeFrom: 'catapult', slow: .5, slowBite: .5, slowDuration: 10,
    renderer: 'catapult', rendererTint: 'blue',
    artworkNote: 'This browser adaptation reuses the original Melon-pult rig with a blue tint, rather than the original Winter Melon asset.'
  }),
  shooter('splash', 'Kernel-pult', 100, 20, 300, {
    motion: 'lobbed', projectileSpeed: null, bypassesShield: true,
    stunChance: .25, stunDuration: 4, stunDamage: 40,
    butterChance: .25, butterDamage: 40, butterDuration: 4,
    shootingDelay: .29, shootingDelayTicks: 29,
    note: 'Legacy ID splash refers to Kernel-pult; kernel and butter do not cause area splash damage.'
  }),
  shooter('pierce', 'Cactus', 125, 20, 150, {
    projectile: 'spike', shootingDelay: .34, shootingDelayTicks: 34,
    balloonPriority: true, pierce: false,
    note: 'Legacy ID pierce refers to Cactus. Its original spike stops at one target; this is not a multi-target piercing weapon.'
  }),
  blocker('walnut', 'Wall-nut', 50, 4000),
  blocker('tallnut', 'Tall-nut', 125, 8000, { blocksVault: true })
]);
export const PLANT_BY_ID = freeze(Object.fromEntries(CLASSIC_PLANTS.map(plant => [plant.id, plant])));

// Mean cycle speed derived from UpdateAnimSpeed + GetTrackVelocity. Instantaneous
// speed still varies with the ground-track spacing and is not reproduced here.
export function getGroundSpeedPxPerSecond(nominalVelocityPerTick, frameCount = 47) {
  if (!Number.isFinite(nominalVelocityPerTick) || nominalVelocityPerTick < 0 || !Number.isFinite(frameCount) || frameCount <= 1) return 0;
  return nominalVelocityPerTick * 47 * frameCount / (frameCount - 1);
}
const zombie = (id, name, bodyHp, nominalMin, nominalMax, frames = 47, extra = {}) => {
  const armorHp = extra.armorHp || 0, shieldHp = extra.shieldHp || 0;
  return {
    id, name, original: true, visualType: id, hp: bodyHp + armorHp + shieldHp, bodyHp,
    armorHp, armor: 0, shieldHp, shield: null,
    speed: getGroundSpeedPxPerSecond((nominalMin + nominalMax) / 2, frames),
    speedMin: getGroundSpeedPxPerSecond(nominalMin, frames),
    speedMax: getGroundSpeedPxPerSecond(nominalMax, frames), speedUnits: 'original lawn pixels/second',
    nominalVelocityMin: nominalMin, nominalVelocityMax: nominalMax,
    nominalVelocityPerTick: (nominalMin + nominalMax) / 2, walkFrameCount: frames,
    biteDamage: 4, biteInterval: .04, biteDps: 100, slowBiteInterval: .08,
    armLossRatio: 2 / 3, headLossRatio: 1 / 3, headlessCanBite: false,
    headlessBleedDamage: bodyHp >= 500 ? 3 : 1, headlessBleedChancePerTick: .2,
    headlessBleedExpectedInterval: .05, collisionOffset: 36, collisionWidth: 42,
    ...extra
  };
};
export const CLASSIC_ZOMBIES = freeze([
  zombie('walker', 'Zombie', 270, .23, .37),
  zombie('flag', 'Flag Zombie', 270, .45, .45, 47, { visualType: 'walker' }),
  zombie('cone', 'Conehead Zombie', 270, .23, .37, 47, { armorHp: 370, armor: 1, armorKind: 'cone' }),
  zombie('bucket', 'Buckethead Zombie', 270, .23, .37, 47, { armorHp: 1100, armor: 2, armorKind: 'bucket' }),
  zombie('football', 'Football Zombie', 270, .66, .68, 30, {
    armorHp: 1400, armor: 3, armorKind: 'football', collisionOffset: 50, collisionWidth: 57
  }),
  zombie('newspaper', 'Newspaper Zombie', 270, .23, .37, 47, {
    shieldHp: 150, shield: 'newspaper',
    frenzySpeed: getGroundSpeedPxPerSecond(.9, 47), enragedSpeed: getGroundSpeedPxPerSecond(.9, 47),
    frenzySpeedMin: getGroundSpeedPxPerSecond(.89, 47),
    frenzySpeedMax: getGroundSpeedPxPerSecond(.91, 47),
    frenzyNominalVelocityMin: .89, frenzyNominalVelocityMax: .91,
    frenzyWindup: 1.625,
    note: 'Paper is a shield, not a helmet; original gasp animation (13 frames at8fps) precedes the faster walk.'
  }),
  zombie('pole', 'Pole Vaulting Zombie', 500, .66, .68, 37, {
    visualType: 'runner', vaults: true, vaultUses: 1,
    afterVaultSpeed: getGroundSpeedPxPerSecond(.3, 45), postVaultSpeed: getGroundSpeedPxPerSecond(.3, 45),
    afterVaultSpeedMin: getGroundSpeedPxPerSecond(.23, 45),
    afterVaultSpeedMax: getGroundSpeedPxPerSecond(.37, 45), afterVaultFrameCount: 45
  })
]);
export const ZOMBIE_BY_ID = freeze(Object.fromEntries(CLASSIC_ZOMBIES.map(zombie => [zombie.id, zombie])));

// C++ uses integer division. additionalTargets excludes the direct hit target.
// Retail correction pool is originalDamage*7, or originalDamage for Torchwood fire.
export function getSplashDamage(damage, additionalTargets, fireball = false) {
  if (!Number.isFinite(damage) || damage <= 0) return 0;
  const direct = Math.floor(damage), base = Math.floor(direct / 3);
  const targets = Math.max(0, Math.floor(Number.isFinite(additionalTargets) ? additionalTargets : 0));
  const pool = direct * (fireball ? 1 : 7), total = base * targets;
  if (!base || total <= pool) return base;
  return Math.max(1, Math.floor(direct * pool / (total * 3)));
}

export const CUSTOM_PICKER_EXTENSIONS = freeze({
  fire: { originalPlant: false, note: 'Custom fire shooter; PvZ1 fire peas come from Torchwood converting ordinary peas.' },
  laser: { originalPlant: false, note: 'Custom laser shooter.' },
  thorn: { originalPlant: false, note: 'Custom thorn shooter; not the PvZ1 ground Spikeweed mechanic.' },
  chestnut: { originalPlant: false, note: 'Custom chestnut blocker.' },
  picker: { originalMode: false, note: 'Names, children protected by plants, last-hit loot, automatic reinforcements, five damage stages, shortened blockers and speaker selection are classroom-picker adaptations.' }
});
