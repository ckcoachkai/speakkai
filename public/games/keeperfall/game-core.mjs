export const VERSION = 21;
export const SAVE_FORMAT = "keeperfall-save";

export const CLASSES = {
  fighter: { name: "Fighter", title: "The Iron Vanguard", hp: 132, mana: 24, attack: 16, armor: 9, elements: ["Earth"], color: "#d6a55f", sigil: "F" },
  paladin: { name: "Paladin", title: "The Dawn Bastion", hp: 120, mana: 42, attack: 13, armor: 11, elements: ["Light", "Fire"], color: "#f3d782", sigil: "P" },
  sorcerer: { name: "Sorcerer", title: "The Storm Scholar", hp: 82, mana: 92, attack: 8, armor: 3, elements: ["Fire", "Frost", "Storm", "Arcane"], color: "#74d6ff", sigil: "S" },
  warlock: { name: "Warlock", title: "The Pact-Bound", hp: 94, mana: 76, attack: 10, armor: 4, elements: ["Shadow", "Fire", "Death"], color: "#c381ff", sigil: "W" },
  necromancer: { name: "Necromancer", title: "The Grave Shepherd", hp: 90, mana: 84, attack: 9, armor: 4, elements: ["Death", "Frost", "Shadow"], color: "#7de0af", sigil: "N" }
};

export const KEEPER_TALENT_BRANCHES = {
  vanguard: {
    name: "Vanguard",
    color: "#e0a75f",
    description: "Endure the Heartway and turn tempered steel into reliable force.",
    talents: ["iron-heart", "battle-honed", "adamant-oath"]
  },
  arcanist: {
    name: "Arcanist",
    color: "#83c8ee",
    description: "Expand the Keeper's spellcraft and read greater potential in every hoard.",
    talents: ["deep-well", "rune-lore", "fortune-sigil"]
  },
  beastkeeper: {
    name: "Beastkeeper",
    color: "#86d3a7",
    description: "Strengthen the living pack through trust, instinct, and shared momentum.",
    talents: ["pack-instinct", "gentle-hand", "alpha-link"]
  }
};

export const KEEPER_TALENTS = {
  "iron-heart": { branch: "vanguard", name: "Iron Heart", tier: 1, maxRank: 3, description: "+12 Keeper health per rank.", bonuses: { maxHp: 12 } },
  "battle-honed": { branch: "vanguard", name: "Battle-Honed", tier: 2, maxRank: 3, description: "+3 Keeper attack per rank.", bonuses: { attack: 3 } },
  "adamant-oath": { branch: "vanguard", name: "Adamant Oath", tier: 3, maxRank: 1, description: "+5 Keeper armor.", bonuses: { armor: 5 } },
  "deep-well": { branch: "arcanist", name: "Deep Well", tier: 1, maxRank: 3, description: "+7 Keeper mana per rank.", bonuses: { maxMana: 7 } },
  "rune-lore": { branch: "arcanist", name: "Rune Lore", tier: 2, maxRank: 3, description: "+2 damage or healing to Keeper spells per rank.", bonuses: { spellPower: 2 } },
  "fortune-sigil": { branch: "arcanist", name: "Fortune Sigil", tier: 3, maxRank: 1, description: "+1 level to all expedition loot.", bonuses: { lootLevel: 1 } },
  "pack-instinct": { branch: "beastkeeper", name: "Pack Instinct", tier: 1, maxRank: 3, description: "+4% health, attack, and armor to bonded creatures per rank.", bonuses: { creatureMult: .04 } },
  "gentle-hand": { branch: "beastkeeper", name: "Gentle Hand", tier: 2, maxRank: 3, description: "+1 creature bond whenever bond is earned per rank.", bonuses: { bondGain: 1 } },
  "alpha-link": { branch: "beastkeeper", name: "Alpha Link", tier: 3, maxRank: 1, description: "Begin every expedition with 2 momentum.", bonuses: { startingMomentum: 2 } }
};

const spellSeeds = {
  Fire: [
    ["Cinder Dart", 8, 15, "burn"], ["Flame Wall", 14, 23, "burn"],
    ["Phoenix Coil", 22, 36, "renew"], ["Furnace Star", 30, 52, "burn"]
  ],
  Frost: [
    ["Rime Needle", 8, 14, "slow"], ["Ice Rampart", 13, 8, "ward"],
    ["Winter's Grasp", 21, 30, "freeze"], ["Absolute Quiet", 32, 48, "freeze"]
  ],
  Storm: [
    ["Static Lash", 7, 13, "shock"], ["Gale Step", 12, 9, "haste"],
    ["Chain Tempest", 20, 31, "shock"], ["Skybreaker", 31, 50, "shock"]
  ],
  Earth: [
    ["Stone Knuckle", 6, 12, "stagger"], ["Earthen Guard", 11, 7, "ward"],
    ["Fault Line", 19, 28, "stagger"], ["Mountain's Verdict", 28, 43, "stagger"]
  ],
  Light: [
    ["Mend", 8, -18, "heal"], ["Sun Lance", 10, 17, "radiant"],
    ["Sanctuary", 18, -32, "heal"], ["Last Dawn", 30, 44, "renew"]
  ],
  Shadow: [
    ["Gloom Bolt", 7, 14, "weaken"], ["Blindside", 12, 19, "blind"],
    ["Hunger Hex", 19, 29, "drain"], ["Night Without End", 29, 46, "weaken"]
  ],
  Death: [
    ["Bone Shard", 7, 13, "bleed"], ["Grave Tax", 12, 18, "drain"],
    ["Corpse Bloom", 20, 30, "poison"], ["Reaper's Due", 31, 49, "execute"]
  ],
  Arcane: [
    ["Force Spark", 6, 12, "pure"], ["Mirror Ward", 12, 6, "ward"],
    ["Fold Space", 18, 27, "haste"], ["Unmake", 30, 47, "pure"]
  ]
};

export const SPELLS = Object.entries(spellSeeds).flatMap(([element, rows]) =>
  rows.map(([name, mana, power, effect], index) => ({
    id: `${element.toLowerCase()}-${index + 1}`,
    name, element, mana, power, effect,
    level: 1 + index * 3,
    cooldown: Math.max(1, index + 1),
    description: spellDescription(effect, power)
  }))
);

function spellDescription(effect, power) {
  const map = {
    burn: `Deal ${power} damage and leave a burning wound.`, slow: `Deal ${power} damage and slow the target.`,
    renew: power < 0 ? `Restore ${-power} health and gain renewal.` : `Deal ${power} damage; recover health on a kill.`,
    ward: `Raise a ward and alter the next exchange.`, freeze: `Deal ${power} damage with a chance to freeze.`,
    shock: `Deal ${power} damage with volatile bonus damage.`, haste: `Deal ${power} damage and quicken your next action.`,
    stagger: `Deal ${power} damage and weaken the next enemy attack.`, heal: `Restore ${-power} health.`,
    radiant: `Deal ${power} radiant damage.`, weaken: `Deal ${power} damage and weaken the target.`,
    blind: `Deal ${power} damage and reduce enemy accuracy.`, drain: `Deal ${power} damage and siphon life.`,
    bleed: `Deal ${power} damage and cause bleeding.`, poison: `Deal ${power} damage and apply poison.`,
    execute: `Deal ${power} damage, increased against wounded enemies.`, pure: `Deal ${power} armor-piercing damage.`
  };
  return map[effect] || `Produce ${power} magical power.`;
}

export const SLOT_LABELS = {
  weapon: "Weapon", offhand: "Off-hand", helmet: "Helmet", face: "Face", neck: "Neck",
  chest: "Upper body", hands: "Hands", belt: "Belt", legs: "Lower body", feet: "Feet",
  ring1: "Ring I", ring2: "Ring II", relic: "Relic"
};

export const CRAFT_RECIPES = {
  weapon: "metal", offhand: "wood", helmet: "metal", face: "crystal", neck: "crystal",
  chest: "cloth", hands: "leather", belt: "leather", legs: "metal", feet: "leather",
  ring: "metal", relic: "crystal"
};

const BASE_ITEMS = [
  ["Iron Longsword", "weapon", "metal", 8, 0], ["Ash Wand", "weapon", "wood", 6, 0],
  ["Grave Scythe", "weapon", "bone", 9, 0], ["Sun Mace", "weapon", "metal", 7, 1],
  ["Round Shield", "offhand", "metal", 1, 7], ["Spell Ledger", "offhand", "ink", 3, 2],
  ["Horned Helm", "helmet", "metal", 1, 5], ["Bone Circlet", "helmet", "bone", 2, 3],
  ["Hexglass Spectacles", "face", "crystal", 2, 1], ["Executioner's Mask", "face", "leather", 3, 2],
  ["Keeper's Chain", "neck", "metal", 2, 2], ["Moonstone Amulet", "neck", "crystal", 1, 3],
  ["Brigandine", "chest", "metal", 1, 9], ["Runed Vestment", "chest", "cloth", 3, 5],
  ["Gripping Gauntlets", "hands", "leather", 3, 3], ["Ironhand Gloves", "hands", "metal", 2, 5],
  ["Provisioner's Belt", "belt", "leather", 1, 3], ["Chain Girdle", "belt", "metal", 0, 5],
  ["Plated Greaves", "legs", "metal", 0, 7], ["Shadow Leggings", "legs", "cloth", 3, 3],
  ["Wayfarer Boots", "feet", "leather", 2, 3], ["Grave-Treader Shoes", "feet", "cloth", 3, 2],
  ["Signet Ring", "ring", "metal", 2, 1], ["Glass Serpent Ring", "ring", "crystal", 3, 0],
  ["Dungeon Heart Shard", "relic", "crystal", 4, 4], ["Bottled Echo", "relic", "essence", 5, 1]
];

export const RARITIES = [
  { name: "Common", color: "#aab0b6", mult: 1, affixes: 0 },
  { name: "Uncommon", color: "#71d69b", mult: 1.18, affixes: 1 },
  { name: "Rare", color: "#6aa7ff", mult: 1.42, affixes: 2 },
  { name: "Epic", color: "#c281ff", mult: 1.75, affixes: 2 },
  { name: "Mythic", color: "#ffbd59", mult: 2.15, affixes: 3 }
];

export const QUALITIES = ["Crude", "Common", "Refined", "Pristine", "Exceptional"];
export const PREFIXES = [
  ["Serrated", { attack: 3, armor: 0 }], ["Reinforced", { attack: 0, armor: 3 }],
  ["Vampiric", { attack: 2, armor: 1 }], ["Stormbound", { attack: 4, armor: 0 }],
  ["Patient", { attack: 2, armor: 2 }], ["Weightless", { attack: 1, armor: 2 }],
  ["Grave-Touched", { attack: 3, armor: 1 }], ["Dawnforged", { attack: 2, armor: 3 }]
];
export const TRAITS = [
  "First strike deals double damage", "Restore health after defeating an enemy", "Ignore the first trap in each raid",
  "Gain armor while below half health", "Spells occasionally refund their mana", "Critical hits leave a burning tile",
  "Defeated enemies strengthen the next spell", "Survive one fatal blow per expedition"
];

export const DUNGEON_PIECES = {
  empty: { name: "Empty Passage", kind: "empty", cost: 0, threat: 0, glyph: "·", description: "A silent stretch of stone." },
  spikes: { name: "Spiked Floor", kind: "trap", cost: 45, threat: 8, damage: 12, glyph: "▲", description: "Reliable opening damage." },
  bolts: { name: "Bolt Gallery", kind: "trap", cost: 80, threat: 14, damage: 19, glyph: "≻", description: "Armor-piercing crossfire." },
  flame: { name: "Furnace Vent", kind: "trap", cost: 125, threat: 21, damage: 27, glyph: "♨", description: "A brutal magical hazard." },
  slime: { name: "Mire Slime", kind: "monster", cost: 55, threat: 9, hp: 34, attack: 8, armor: 1, glyph: "s", description: "Slow, acidic and inexpensive." },
  skeleton: { name: "Bone Guard", kind: "monster", cost: 90, threat: 15, hp: 46, attack: 11, armor: 3, glyph: "k", description: "A disciplined undead sentry." },
  goblin: { name: "Goblin Tinkerer", kind: "monster", cost: 120, threat: 20, hp: 42, attack: 15, armor: 2, glyph: "g", description: "Fast and unpredictably armed." },
  hexer: { name: "Ash Hexer", kind: "monster", cost: 165, threat: 27, hp: 58, attack: 18, armor: 4, glyph: "h", description: "A ranged curse specialist." },
  ogre: { name: "Iron Ogre", kind: "monster", cost: 230, threat: 38, hp: 92, attack: 22, armor: 7, glyph: "O", description: "An expensive living barricade." },
  mimic: { name: "Hoard Mimic", kind: "monster", cost: 145, threat: 23, hp: 50, attack: 17, armor: 2, glyph: "M", description: "A greedy ambusher disguised as recovered treasure." },
  wraith: { name: "Veil Wraith", kind: "monster", cost: 185, threat: 30, hp: 57, attack: 20, armor: 3, glyph: "W", description: "A phasing spirit that slips through heavy armor." },
  golem: { name: "Runestone Golem", kind: "monster", cost: 245, threat: 41, hp: 108, attack: 19, armor: 10, glyph: "G", description: "A seismic construct that punishes the whole formation." }
};

export const CREATURE_SPECIES = {
  slime: { name: "Mire Slime", eggCost: 80, hatchDays: 2, temperament: "Patient", color: "#76d9ae" },
  skeleton: { name: "Bone Guard", eggCost: 115, hatchDays: 3, temperament: "Loyal", color: "#ded1ad" },
  goblin: { name: "Goblin Tinkerer", eggCost: 145, hatchDays: 3, temperament: "Restless", color: "#a6cf72" },
  hexer: { name: "Ash Hexer", eggCost: 190, hatchDays: 4, temperament: "Watchful", color: "#c493e8" },
  ogre: { name: "Iron Ogre", eggCost: 260, hatchDays: 5, temperament: "Stubborn", color: "#d59b72" },
  mimic: { name: "Hoard Mimic", eggCost: 175, hatchDays: 3, temperament: "Covetous", color: "#e4b65f" },
  wraith: { name: "Veil Wraith", eggCost: 220, hatchDays: 4, temperament: "Distant", color: "#a995e8" },
  golem: { name: "Runestone Golem", eggCost: 285, hatchDays: 5, temperament: "Steady", color: "#8bb5ad" }
};

export const CREATURE_TRAITS = {
  stalwart: { name: "Stalwart", description: "+14 health and +1 armor", hp: 14, attack: 0, armor: 1 },
  ferocious: { name: "Ferocious", description: "+4 attack", hp: 0, attack: 4, armor: 0 },
  plated: { name: "Plated", description: "+3 armor", hp: 0, attack: 0, armor: 3 },
  luminous: { name: "Luminous", description: "+8 health and +2 attack", hp: 8, attack: 2, armor: 0 },
  patient: { name: "Patient", description: "+10 health and +1 armor", hp: 10, attack: 0, armor: 1 },
  wild: { name: "Wild", description: "+5 attack, −1 armor", hp: 0, attack: 5, armor: -1 }
};

export const CREATURE_AWAKENINGS = {
  ravager: { name: "Ravager", description: "+7 attack", hp: 0, attack: 7, armor: 0 },
  bastion: { name: "Bastion", description: "+28 health and +3 armor", hp: 28, attack: 0, armor: 3 },
  oracle: { name: "Oracle", description: "+14 health, +4 attack and +1 armor", hp: 14, attack: 4, armor: 1 }
};

export const CREATURE_LINEAGES = {
  "slime-mireheart": { speciesId: "slime", name: "Mireheart", description: "Dense living mire that refuses to break.", hp: 12, attack: 0, armor: 1 },
  "slime-acidbloom": { speciesId: "slime", name: "Acid Bloom", description: "A volatile core that turns patience into corrosive force.", hp: 3, attack: 3, armor: 0 },
  "skeleton-gravewall": { speciesId: "skeleton", name: "Gravewall", description: "Layered bone plates remember every held doorway.", hp: 10, attack: 0, armor: 2 },
  "skeleton-duelist": { speciesId: "skeleton", name: "Bone Duelist", description: "A precise martial memory sharpened across many lives.", hp: 2, attack: 4, armor: 0 },
  "goblin-sparkhand": { speciesId: "goblin", name: "Sparkhand", description: "Improvised coils feed dangerous, brilliant attacks.", hp: 0, attack: 5, armor: 0 },
  "goblin-scraprunner": { speciesId: "goblin", name: "Scraprunner", description: "Scavenged plates and quick instincts keep the tinkerer moving.", hp: 8, attack: 2, armor: 1 },
  "hexer-ashoracle": { speciesId: "hexer", name: "Ash Oracle", description: "Cooled cinders reveal safer paths through incoming harm.", hp: 8, attack: 2, armor: 1 },
  "hexer-cindertongue": { speciesId: "hexer", name: "Cinder Tongue", description: "Every spoken curse leaves a hotter scar.", hp: 0, attack: 5, armor: 0 },
  "ogre-ironbelly": { speciesId: "ogre", name: "Ironbelly", description: "A fortress appetite turns age into plated endurance.", hp: 16, attack: 0, armor: 2 },
  "ogre-gatebreaker": { speciesId: "ogre", name: "Gatebreaker", description: "Nothing survives the second impact.", hp: 5, attack: 5, armor: 0 },
  "mimic-hoardhide": { speciesId: "mimic", name: "Hoardhide", description: "Coins, plates, and stolen buckles fuse into armor.", hp: 10, attack: 1, armor: 2 },
  "mimic-gildedmaw": { speciesId: "mimic", name: "Gilded Maw", description: "The promise of treasure hides a stronger bite.", hp: 0, attack: 6, armor: 0 },
  "wraith-veilborn": { speciesId: "wraith", name: "Veilborn", description: "A quiet spectral body disperses incoming blows.", hp: 7, attack: 2, armor: 2 },
  "wraith-soulthief": { speciesId: "wraith", name: "Soul Thief", description: "Borrowed memories sharpen each spectral cut.", hp: 0, attack: 6, armor: 0 },
  "golem-deeprune": { speciesId: "golem", name: "Deep Rune", description: "Ancient geometry settles into immovable layers.", hp: 14, attack: 0, armor: 2 },
  "golem-quakecore": { speciesId: "golem", name: "Quake Core", description: "A fault-line heart stores force for the next strike.", hp: 4, attack: 5, armor: 0 }
};

export const CREATURE_MEMORIES = {
  hatched: { name: "First Light", description: "Hatched in the Keeper's nursery." },
  familiar: { name: "Known Hand", description: "Reached Familiar bond." },
  veteran: { name: "Veteran", description: "Reached creature level 4." },
  adult: { name: "Full Grown", description: "Reached the Adult life stage." },
  awakened: { name: "Awakened", description: "Chose a permanent awakening." },
  soulbound: { name: "Soulbound", description: "Reached 75 bond with the Keeper." },
  heartbreaker: { name: "Heartbreaker", description: "Survived a rival heart victory." },
  sentinel: { name: "Sentinel", description: "Survived a successful dungeon defense." }
};

export const CONTRACT_TEMPLATES = [
  { key: "raidVictory", title: "Heartbreaker", description: "Break two rival dungeon hearts.", target: 2, reward: { gold: 180, seals: 1 } },
  { key: "hatch", title: "Warm Hands", description: "Hatch a new creature in the nursery.", target: 1, reward: { gold: 110, essence: 2 } },
  { key: "defenseVictory", title: "Hold the Heartway", description: "Defeat an invading hero.", target: 1, reward: { gold: 160, seals: 1 } },
  { key: "dismantle", title: "Nothing Is Waste", description: "Dismantle three recovered items.", target: 3, reward: { gold: 120, essence: 2 } },
  { key: "tinker", title: "A Name with Teeth", description: "Complete two tinkering operations.", target: 2, reward: { gold: 140, essence: 3 } },
  { key: "creatureLevel", title: "Raise the Pack", description: "Help a creature gain a level.", target: 1, reward: { gold: 150, potions: 2 } }
];

export const RIVAL_REGIONS = {
  miredeep: { name: "Miredeep Hollows", keeper: "The Fen Choir", element: "Mire", unlockRenown: 1, color: "#70d3a7", bossId: "slime", sovereignId: "mire-mother", pool: ["slime", "slime", "spikes", "skeleton", "bolts"], description: "A forgiving wetland of slimes, old bones, and simple machinery." },
  cinder: { name: "Cinder Warrens", keeper: "The Brass Widow", element: "Fire", unlockRenown: 2, color: "#ef9b63", bossId: "mimic", sovereignId: "brass-widow", pool: ["spikes", "goblin", "mimic", "flame", "skeleton"], description: "Hot foundries where traps, mimics, and tinkered weapons punish weak armor." },
  saintless: { name: "Saintless Crypt", keeper: "Brother Hollow", element: "Death", unlockRenown: 3, color: "#d7caa7", bossId: "wraith", sovereignId: "brother-hollow", pool: ["skeleton", "wraith", "hexer", "bolts", "flame"], description: "An ossuary of disciplined undead and armor-phasing spirits." },
  stormspire: { name: "Stormglass Spire", keeper: "Mara Vex", element: "Storm", unlockRenown: 4, color: "#75c9ed", bossId: "hexer", sovereignId: "mara-vex", pool: ["goblin", "bolts", "wraith", "hexer", "flame"], description: "A vertical ruin of lightning galleries and volatile spirits." },
  ironcrown: { name: "The Iron Crown", keeper: "Old Knuckle", element: "Earth", unlockRenown: 5, color: "#d59972", bossId: "golem", sovereignId: "old-knuckle", pool: ["skeleton", "goblin", "ogre", "flame", "golem"], description: "A brutal endgame fortress built around seismic living barricades." }
};

export const REGIONAL_SOVEREIGNS = {
  "mire-mother": { regionId: "miredeep", name: "Isolde, Mire Mother", title: "The Drowned Brood", speciesId: "slime", hpMult: 1.55, attackMult: 1.04, armorBonus: 2, rewardSetId: "beastwarden", intentId: "brood-tide", phases: [
    { name: "Broodwake", threshold: 1, description: "The nursery-mire gathers around its mother." },
    { name: "Drowned Crown", threshold: .62, attack: 3, regenPct: .12, description: "Isolde devours the spawning pool and renews herself." },
    { name: "Last Spawn", threshold: .28, attack: 5, partyDamagePct: .08, description: "The final brood erupts beneath the whole formation." }
  ] },
  "brass-widow": { regionId: "cinder", name: "The Brass Widow", title: "Queen of False Treasure", speciesId: "mimic", hpMult: 1.45, attackMult: 1.12, armorBonus: 2, rewardSetId: "ember-court", intentId: "hoard-tax", phases: [
    { name: "Gilded Welcome", threshold: 1, description: "The sovereign waits behind a beautiful lie." },
    { name: "Vault Unlatched", threshold: .66, attack: 4, momentumDrain: 3, description: "The vault opens and swallows the expedition's rhythm." },
    { name: "Molten Appetite", threshold: .3, attack: 6, armor: 2, description: "Brass plates run red as the Widow abandons restraint." }
  ] },
  "brother-hollow": { regionId: "saintless", name: "Brother Hollow", title: "The Saintless Requiem", speciesId: "wraith", hpMult: 1.38, attackMult: 1.08, armorBonus: 4, rewardSetId: "grave-choir", intentId: "requiem", phases: [
    { name: "Procession", threshold: 1, description: "A funeral without a body crosses the crypt." },
    { name: "Unanswered Prayer", threshold: .6, ward: .45, description: "The empty saint wraps itself in a stolen blessing." },
    { name: "Final Requiem", threshold: .25, attack: 7, partyDamagePct: .06, description: "The last hymn cuts through armor and memory." }
  ] },
  "mara-vex": { regionId: "stormspire", name: "Mara Vex", title: "The Stormglass Regent", speciesId: "hexer", hpMult: 1.42, attackMult: 1.15, armorBonus: 1, rewardSetId: "stormglass", intentId: "sky-chain", phases: [
    { name: "Static Audience", threshold: 1, description: "Mara measures the formation through charged glass." },
    { name: "Shattered Horizon", threshold: .64, attack: 5, partyDamagePct: .07, description: "The spire windows burst inward as the storm enters." },
    { name: "Regent Unbound", threshold: .27, attack: 7, momentumDrain: 2, description: "Mara becomes the lightning she once commanded." }
  ] },
  "old-knuckle": { regionId: "ironcrown", name: "Old Knuckle", title: "The Mountain Wearing a Crown", speciesId: "golem", hpMult: 1.7, attackMult: 1.1, armorBonus: 5, rewardSetId: "iron-vigil", intentId: "crownfall", phases: [
    { name: "Stone Audience", threshold: 1, description: "The ancient crown judges every footstep." },
    { name: "Fault Throne", threshold: .58, armor: 3, partyDamagePct: .08, description: "The throne splits and the Heartway buckles." },
    { name: "Crownfall", threshold: .22, attack: 9, momentumDrain: 3, description: "Old Knuckle brings the entire fortress down with him." }
  ] }
};

export const SOVEREIGN_INTENTS = {
  "brood-tide": { id: "brood-tide", label: "Brood Tide", glyph: "❉", multiplier: .52, aoe: true, description: "The living mire rises beneath every expedition member." },
  "hoard-tax": { id: "hoard-tax", label: "Hoard Tax", glyph: "♢", multiplier: 1.18, momentumDrain: 3, description: "A gilded bite steals three points of expedition momentum." },
  requiem: { id: "requiem", label: "Saintless Requiem", glyph: "†", multiplier: 1.06, armorFactor: 0, description: "A hollow hymn passes through all physical armor." },
  "sky-chain": { id: "sky-chain", label: "Sky Chain", glyph: "ϟ", multiplier: .64, aoe: true, description: "Forked stormglass lightning strikes the whole formation." },
  crownfall: { id: "crownfall", label: "Crownfall", glyph: "✹", multiplier: .78, aoe: true, momentumDrain: 2, description: "The Iron Crown collapses across every living target." }
};

export const EXPEDITION_DIFFICULTIES = {
  scout: { name: "Scout", unlockLevel: 1, levelOffset: 0, routeLength: 7, rewardMult: 1, eliteChance: .06, description: "Readable danger and standard heart rewards." },
  delve: { name: "Delve", unlockLevel: 2, levelOffset: 1, routeLength: 8, rewardMult: 1.4, eliteChance: .28, description: "Stronger rooms, richer hoards, and frequent elites." },
  nightmare: { name: "Nightmare", unlockLevel: 5, levelOffset: 3, routeLength: 10, rewardMult: 2, eliteChance: .52, description: "Long lethal routes with the best loot and bond growth." }
};

export const EXPEDITION_MODIFIERS = {
  gilded: { name: "Gilded Heart", description: "+30% gold, but guardians have +12% health.", goldMult: 1.3, enemyHpMult: 1.12 },
  bloodhunt: { name: "Blood Hunt", description: "+18% guardian attack and +3 victory bond.", enemyAttackMult: 1.18, bondBonus: 3 },
  trapstorm: { name: "Trapstorm", description: "+25% trap damage and +20% gold.", trapMult: 1.25, goldMult: 1.2 },
  relicvein: { name: "Relic Vein", description: "+1 loot level and one additional heart item.", lootLevelBonus: 1, extraLoot: 1 },
  warded: { name: "Warded Halls", description: "Guardians gain +1 armor; rewards gain +1 loot level.", enemyArmor: 1, lootLevelBonus: 1 }
};

export const WORLD_CONDITIONS = {
  mirebloom: { name: "Mirebloom Season", regionId: "miredeep", modifierId: "relicvein", description: "The flooded hollows expose relic seams beneath new growth.", rewardMult: 1.16, bountyWins: 2, reward: { gold: 220, essence: 3 } },
  brassfall: { name: "Brassfall Ash", regionId: "cinder", modifierId: "gilded", description: "Hot metal dust turns every false treasure chamber into a richer risk.", rewardMult: 1.18, bountyWins: 2, reward: { gold: 240, seals: 1 } },
  paleprocession: { name: "The Pale Procession", regionId: "saintless", modifierId: "warded", description: "The crypt doors open in sequence and the dead march under renewed wards.", rewardMult: 1.2, bountyWins: 2, reward: { gold: 260, essence: 4 } },
  stormfront: { name: "Glass Stormfront", regionId: "stormspire", modifierId: "trapstorm", description: "Charged weather overloads every gallery mechanism in the Spire.", rewardMult: 1.22, bountyWins: 2, reward: { gold: 280, seals: 1 } },
  crownquake: { name: "Crownquake", regionId: "ironcrown", modifierId: "bloodhunt", description: "Deep tremors wake the oldest barricades and enrage their guardians.", rewardMult: 1.25, bountyWins: 2, reward: { gold: 320, seals: 1, essence: 3 } }
};

export const EXPEDITION_STANCES = {
  balanced: { name: "Balanced", attackMult: 1, armorMult: 1, description: "No stat tradeoff; the formation reacts to each intent normally." },
  assault: { name: "Assault", attackMult: 1.12, armorMult: .9, description: "+12% attack, but −10% armor during the expedition." },
  bulwark: { name: "Bulwark", attackMult: .94, armorMult: 1.2, description: "+20% armor, but −6% attack during the expedition." }
};

export const POTION_POLICIES = {
  conserve: { name: "Conserve", threshold: .24, description: "Drink only below 24% health." },
  standard: { name: "Standard", threshold: .38, description: "Drink below 38% health." },
  early: { name: "Early recovery", threshold: .56, description: "Drink below 56% health." }
};

export const SPELL_POLICIES = {
  preserve: { name: "Preserve mana", castChance: .2, description: "Save damage spells for elites and wounded guardians." },
  balanced: { name: "Balanced casting", castChance: .52, description: "Mix attacks and the strongest available spell." },
  unleash: { name: "Unleash", castChance: 1, description: "Cast the strongest available spell whenever mana permits." }
};

export const KEEPER_POSITIONS = {
  front: { name: "Front", description: "Acts first and is most likely to be targeted." },
  center: { name: "Center", description: "Acts after the first creature with moderate exposure." },
  rear: { name: "Rear", description: "Acts last and is least likely to be targeted." }
};

const CREATURE_NAMES = ["Mossbit", "Rattle", "Pipwick", "Cinder", "Bramble", "Nox", "Pebble", "Morrow", "Tallow", "Wisp"];

function rollCreatureTrait(rng = Math.random) {
  const ids = Object.keys(CREATURE_TRAITS);
  return ids[Math.floor(rng() * ids.length)];
}

function makeCreature(speciesId, level = 1, ageDays = 0, assignment = "reserve", rng = Math.random, traitId = null) {
  return {
    id: uid("beast"), speciesId, name: CREATURE_NAMES[Math.floor(rng() * CREATURE_NAMES.length)], level, xp: 0,
    ageDays, assignment, dungeonCell: null, equipment: {}, spellId: null, potions: 0,
    traitId: traitId || rollCreatureTrait(rng), bond: assignment === "expedition" ? 12 : 6, awakeningId: null,
    lineageId: null, lineageRank: 0, memories: ["hatched"]
  };
}

function makeEgg(speciesId, quality = 0, rng = Math.random) {
  return {
    id: uid("egg"), speciesId, quality, progress: 0,
    hatchDays: Math.max(1, CREATURE_SPECIES[speciesId].hatchDays - quality), traitId: rollCreatureTrait(rng)
  };
}

export const PATH = [0,1,2,3,4,9,8,7,6,5,10,11,12,13,14,19,18,17,16,15,20,21,22,23,24];

export const DUNGEON_LAYOUTS = {
  spine: { name: "The First Spine", rank: 1, goldCost: 0, sealCost: 0, description: "A compact nine-chamber corridor built for readable early defenses.", path: [0,1,2,7,12,17,22,23,24] },
  switchback: { name: "The Crooked Gallery", rank: 2, goldCost: 250, sealCost: 1, description: "Seventeen chambers create more room for layered traps and guardians.", path: [0,1,2,3,4,9,8,7,6,11,12,17,16,21,22,23,24] },
  grand: { name: "The Grand Heartway", rank: 4, goldCost: 600, sealCost: 2, description: "The complete twenty-five chamber serpent with maximum defensive depth.", path: PATH }
};

export const DUNGEON_THEMES = {
  heartland: { name: "Heartland Ruins", rank: 1, goldCost: 0, description: "Weathered stone, moss, and practical ironwork.", ground: "#596747", stone: "#74736b" },
  overgrown: { name: "Overgrown Court", rank: 2, goldCost: 180, description: "Dense roots hide mechanisms and strengthen living guardians.", ground: "#486044", stone: "#687264", guardianHpMult: 1.08 },
  foundry: { name: "Abandoned Foundry", rank: 3, goldCost: 320, description: "Hot channels feed every installed trap.", ground: "#554d43", stone: "#74665b", trapMult: 1.1 },
  ossuary: { name: "Sunken Ossuary", rank: 4, goldCost: 480, description: "Bone-lined chambers harden the garrison and frighten invaders.", ground: "#56594e", stone: "#807b6d", guardianArmor: 2, threat: 8 }
};

export const DUNGEON_ROOMS = {
  killbox: { name: "Killbox", rank: 2, goldCost: 140, sealCost: 0, description: "Channels a chamber's mechanism for +18% trap damage.", trapMult: 1.18, threat: 4 },
  armory: { name: "Garrison Armory", rank: 2, goldCost: 165, sealCost: 0, description: "Supplies the resident guardian with +4 attack and +1 armor.", guardianAttack: 4, guardianArmor: 1, threat: 5 },
  broodnest: { name: "Brood Nest", rank: 3, goldCost: 210, sealCost: 1, description: "A protected den gives its guardian +22% health.", guardianHpMult: 1.22, threat: 6 },
  reliquary: { name: "False Reliquary", rank: 3, goldCost: 240, sealCost: 1, description: "Baits stronger challengers and adds 12% defense gold.", rewardMult: 1.12, threat: -2 }
};

export const ITEM_SETS = {
  "iron-vigil": { name: "Iron Vigil", color: "#d7a76c", slots: ["helmet", "chest", "hands", "legs"], description: "A fortress worn one plate at a time.", bonuses: { 2: { armor: 4 }, 4: { maxHp: 36 } } },
  "grave-choir": { name: "Grave Choir", color: "#9bd0ad", slots: ["weapon", "helmet", "neck", "relic"], description: "Old voices harmonize through bone and steel.", bonuses: { 2: { attack: 5 }, 4: { maxMana: 18 } } },
  "ember-court": { name: "Ember Court", color: "#ee9565", slots: ["weapon", "offhand", "chest", "ring"], description: "Royal cinders answer aggression with heat.", bonuses: { 2: { attack: 4 }, 4: { attack: 9 } } },
  stormglass: { name: "Stormglass", color: "#7ccced", slots: ["face", "neck", "feet", "ring"], description: "Lightning held in cut crystal and quicksilver.", bonuses: { 2: { maxMana: 10 }, 4: { attack: 7, armor: 3 } } },
  beastwarden: { name: "Beastwarden", color: "#7ed0a2", slots: ["belt", "chest", "feet", "relic"], description: "Keeper and companion are guarded by the same promise.", bonuses: { 2: { maxHp: 20 }, 4: { armor: 6 } } }
};

export const CHRONICLE_ACHIEVEMENTS = {
  hatchery: { name: "Keeper of Many Shapes", category: "Bestiary", description: "Record three creature species.", metric: "species", target: 3, reward: { gold: 180, essence: 2 } },
  atlasWalker: { name: "Roads Beneath the World", category: "Atlas", description: "Visit all five rival regions.", metric: "regions", target: 5, reward: { gold: 360, seals: 1 } },
  sovereignHunt: { name: "No Crown Endures", category: "Sovereigns", description: "Defeat all five Regional Sovereigns.", metric: "sovereigns", target: 5, reward: { gold: 700, seals: 3, essence: 8 } },
  setArchive: { name: "Relic Archivist", category: "Relic Sets", description: "Discover all five relic sets.", metric: "sets", target: 5, reward: { gold: 420, essence: 6 } },
  architect: { name: "Rooms with a Purpose", category: "Architecture", description: "Build every specialized room plan at least once.", metric: "rooms", target: 4, reward: { gold: 300, seals: 2 } }
};

export const RUNE_TYPES = {
  fury: { name: "Fury Rune", color: "#eb806d", attack: 4, armor: 0, vitality: 0, description: "+4 attack." },
  ward: { name: "Ward Rune", color: "#76b6dc", attack: 0, armor: 3, vitality: 0, description: "+3 armor." },
  balance: { name: "Balance Rune", color: "#d4b16f", attack: 2, armor: 2, vitality: 0, description: "+2 attack and +2 armor." },
  heart: { name: "Heart Rune", color: "#dc7d9f", attack: 0, armor: 0, vitality: 14, description: "+14 health." },
  fang: { name: "Fang Rune", color: "#a9d17a", attack: 3, armor: 1, vitality: 0, description: "+3 attack and +1 armor." },
  bastion: { name: "Bastion Rune", color: "#b7a8dc", attack: 0, armor: 2, vitality: 8, description: "+2 armor and +8 health." }
};

export function dungeonPath(state) {
  return DUNGEON_LAYOUTS[state?.dungeon?.layoutId]?.path || PATH;
}

export function seededRandom(seed = Date.now()) {
  let s = Math.abs(Number(seed)) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateItem(level = 1, rng = Math.random, forcedSlot = null) {
  const candidates = forcedSlot === "ring" || forcedSlot === "ring1" || forcedSlot === "ring2"
    ? BASE_ITEMS.filter((x) => x[1] === "ring")
    : forcedSlot ? BASE_ITEMS.filter((x) => x[1] === forcedSlot) : BASE_ITEMS;
  const base = candidates[Math.floor(rng() * candidates.length)] || BASE_ITEMS[0];
  const roll = rng() + Math.min(level / 180, 0.18);
  const rarityIndex = roll > 1.04 ? 4 : roll > .91 ? 3 : roll > .7 ? 2 : roll > .4 ? 1 : 0;
  const rarity = RARITIES[rarityIndex];
  const qualityIndex = Math.min(4, Math.floor(rng() * 3 + level / 25));
  const selected = [...PREFIXES].sort(() => rng() - .5).slice(0, rarity.affixes);
  const levelScale = 1 + level * .052 + Math.sqrt(level) * .11;
  const bonus = selected.reduce((out, [, stats]) => ({ attack: out.attack + stats.attack, armor: out.armor + stats.armor }), { attack: 0, armor: 0 });
  const trait = rarityIndex >= 3 || rng() > .93 ? TRAITS[Math.floor(rng() * TRAITS.length)] : null;
  const prefixes = selected.map(([name]) => name);
  const name = `${prefixes.join(" ")}${prefixes.length ? " " : ""}${base[0]}`;
  const eligibleSets = Object.entries(ITEM_SETS).filter(([, set]) => set.slots.includes(base[1]));
  const setId = rarityIndex >= 2 && eligibleSets.length && rng() > .72 ? eligibleSets[Math.floor(rng() * eligibleSets.length)][0] : null;
  return {
    id: uid("item"), baseName: base[0], name, customName: "", slot: base[1], family: base[2], level,
    quality: QUALITIES[qualityIndex], qualityIndex, rarity: rarity.name, rarityIndex, color: rarity.color,
    attack: Math.round((base[3] * levelScale + bonus.attack) * rarity.mult),
    armor: Math.round((base[4] * levelScale + bonus.armor) * rarity.mult),
    prefixes, mods: [], trait, setId, runeSlots: rarityIndex >= 4 ? 2 : rarityIndex >= 2 ? 1 : 0, runes: [], vitality: 0, favorite: false, ascension: Math.floor(Math.max(1, level) / 25), stability: Math.max(25, 100 - rarityIndex * 8), potential: 2 + rarityIndex,
    value: Math.round((18 + level * 7) * rarity.mult * (1 + qualityIndex * .15))
  };
}

export function itemDisplayName(item) {
  return item.customName ? `${item.customName} — ${item.name}` : item.name;
}

function normalizeRelicItem(item) {
  if (!item || typeof item !== "object") return item;
  item.setId = ITEM_SETS[item.setId]?.slots.includes(item.slot) ? item.setId : null;
  item.runeSlots = Math.max(0, Math.min(2, Math.floor(Number(item.runeSlots) || (item.rarityIndex >= 4 ? 2 : item.rarityIndex >= 2 ? 1 : 0))));
  item.runes = Array.isArray(item.runes) ? item.runes.filter((id, index, ids) => RUNE_TYPES[id] && ids.indexOf(id) === index).slice(0, item.runeSlots) : [];
  item.vitality = Math.max(0, Math.floor(Number(item.vitality) || 0));
  return item;
}

export function itemRuneBonuses(item) {
  normalizeRelicItem(item);
  return (item.runes || []).reduce((out, runeId) => {
    const rune = RUNE_TYPES[runeId];
    out.attack += rune.attack; out.armor += rune.armor; out.vitality += rune.vitality;
    return out;
  }, { attack: 0, armor: 0, vitality: item.vitality || 0 });
}

export function equipmentSetBonuses(equipment = {}) {
  const counts = {}, active = [];
  for (const item of Object.values(equipment).filter(Boolean)) if (ITEM_SETS[item.setId]) counts[item.setId] = (counts[item.setId] || 0) + 1;
  const totals = { maxHp: 0, maxMana: 0, attack: 0, armor: 0 };
  for (const [setId, count] of Object.entries(counts)) {
    const set = ITEM_SETS[setId];
    for (const [threshold, bonuses] of Object.entries(set.bonuses)) if (count >= Number(threshold)) {
      for (const [key, value] of Object.entries(bonuses)) totals[key] += value;
      active.push({ setId, name: set.name, count, threshold: Number(threshold), bonuses });
    }
  }
  return { counts, active, ...totals };
}

function createContractSet(seed = 1, renown = 1) {
  const rng = seededRandom(Number(seed) + renown * 97);
  const pool = [...CONTRACT_TEMPLATES];
  const contracts = [];
  while (contracts.length < 3 && pool.length) {
    const index = Math.floor(rng() * pool.length);
    const template = pool.splice(index, 1)[0];
    const scale = 1 + Math.floor((renown - 1) / 3) * .25;
    contracts.push({
      id: uid("contract"), key: template.key, title: template.title, description: template.description,
      target: Math.max(1, Math.round(template.target * scale)), progress: 0, claimed: false,
      reward: Object.fromEntries(Object.entries(template.reward).map(([key, value]) => [key, Math.round(value * scale)]))
    });
  }
  return contracts;
}

function ensureCampaign(state) {
  if (!state.campaign) state.campaign = { renown: 1, completedSets: 0, contracts: createContractSet(state.seed, 1) };
  if (!Array.isArray(state.campaign.contracts) || !state.campaign.contracts.length) state.campaign.contracts = createContractSet(state.seed + state.day, state.campaign.renown || 1);
  state.campaign.sovereignsDefeated = Array.isArray(state.campaign.sovereignsDefeated)
    ? state.campaign.sovereignsDefeated.filter((id, index, ids) => REGIONAL_SOVEREIGNS[id] && ids.indexOf(id) === index)
    : [];
  if (!state.campaign.sovereignVictories || typeof state.campaign.sovereignVictories !== "object" || Array.isArray(state.campaign.sovereignVictories)) state.campaign.sovereignVictories = {};
  for (const sovereignId of Object.keys(REGIONAL_SOVEREIGNS)) state.campaign.sovereignVictories[sovereignId] = Math.max(0, Math.floor(Number(state.campaign.sovereignVictories[sovereignId]) || 0));
  for (const sovereignId of Object.keys(state.campaign.sovereignVictories)) if (!REGIONAL_SOVEREIGNS[sovereignId]) delete state.campaign.sovereignVictories[sovereignId];
  const awakened = state.campaign.sovereignsDefeated.length === Object.keys(REGIONAL_SOVEREIGNS).length;
  const livingHeart = state.campaign.livingHeart && typeof state.campaign.livingHeart === "object" ? state.campaign.livingHeart : {};
  state.campaign.livingHeart = { awakened, claimed: awakened && Boolean(livingHeart.claimed) };
  return state.campaign;
}

export function campaignCompletion(state) {
  const campaign = ensureCampaign(state), total = Object.keys(REGIONAL_SOVEREIGNS).length;
  const defeated = campaign.sovereignsDefeated.length;
  return {
    defeated, total, percent: Math.round(defeated / total * 100),
    awakened: campaign.livingHeart.awakened,
    claimed: campaign.livingHeart.claimed,
    ready: campaign.livingHeart.awakened && !campaign.livingHeart.claimed,
    missing: Object.keys(REGIONAL_SOVEREIGNS).filter((id) => !campaign.sovereignsDefeated.includes(id))
  };
}

export function claimLivingHeart(state) {
  const completion = campaignCompletion(state);
  if (!completion.awakened) return { ok: false, message: `${completion.missing.length} Regional Sovereign${completion.missing.length === 1 ? " remains" : "s remain"}.` };
  if (completion.claimed) return { ok: false, message: "The Living Heart's covenant was already claimed." };
  const reward = { gold: 2000, seals: 5, essence: 20 };
  for (const [resource, amount] of Object.entries(reward)) state[resource] += amount;
  state.campaign.livingHeart.claimed = true;
  state.journal.unshift("The five broken crowns awakened the Living Heart. The complete campaign covenant was claimed.");
  return { ok: true, reward, message: "The Living Heart awakens. Keeperfall's complete campaign is yours." };
}

function ensureLivingAtlas(state) {
  const campaign = ensureCampaign(state), conditionIds = Object.keys(WORLD_CONDITIONS);
  const cycle = Math.max(0, Math.floor((Math.max(1, Number(state.day) || 1) - 1) / 3));
  const conditionId = conditionIds[(Math.abs(Number(state.seed) || 1) + cycle) % conditionIds.length];
  const condition = WORLD_CONDITIONS[conditionId];
  if (!campaign.atlas || campaign.atlas.cycle !== cycle || !WORLD_CONDITIONS[campaign.atlas.conditionId]) {
    campaign.atlas = {
      cycle,
      conditionId,
      bounty: {
        id: `atlas-${cycle}-${condition.regionId}`,
        regionId: condition.regionId,
        target: condition.bountyWins,
        progress: 0,
        claimed: false,
        reward: { ...condition.reward }
      }
    };
  }
  const bounty = campaign.atlas.bounty;
  bounty.regionId = RIVAL_REGIONS[bounty.regionId] ? bounty.regionId : condition.regionId;
  bounty.target = Math.max(1, Math.floor(Number(bounty.target) || condition.bountyWins));
  bounty.progress = Math.max(0, Math.min(bounty.target, Math.floor(Number(bounty.progress) || 0)));
  bounty.claimed = Boolean(bounty.claimed);
  bounty.reward ||= { ...condition.reward };
  return campaign.atlas;
}

export function currentWorldCondition(state) {
  const atlas = ensureLivingAtlas(state), condition = WORLD_CONDITIONS[atlas.conditionId];
  const endDay = atlas.cycle * 3 + 3;
  return { id: atlas.conditionId, ...condition, cycle: atlas.cycle, daysRemaining: Math.max(1, endDay - state.day + 1), bounty: atlas.bounty };
}

export function claimAtlasBounty(state) {
  const condition = currentWorldCondition(state), bounty = condition.bounty;
  if (bounty.claimed) return { ok: false, message: "This atlas bounty has already been claimed." };
  if (bounty.progress < bounty.target) return { ok: false, message: `${RIVAL_REGIONS[bounty.regionId].name} requires ${bounty.target - bounty.progress} more heart victory${bounty.target - bounty.progress === 1 ? "" : "ies"}.` };
  for (const [resource, amount] of Object.entries(bounty.reward)) state[resource] = Math.max(0, Number(state[resource]) || 0) + amount;
  bounty.claimed = true;
  const rewardText = Object.entries(bounty.reward).map(([key, value]) => `${value} ${key}`).join(", ");
  state.journal.unshift(`${condition.name} bounty claimed: ${rewardText}.`);
  return { ok: true, reward: { ...bounty.reward }, message: `Atlas bounty claimed: ${rewardText}.` };
}

function ensureKeeperMastery(state) {
  state.keeperMastery ||= { ranks: {} };
  if (!state.keeperMastery.ranks || typeof state.keeperMastery.ranks !== "object" || Array.isArray(state.keeperMastery.ranks)) state.keeperMastery.ranks = {};
  for (const [talentId, talent] of Object.entries(KEEPER_TALENTS)) {
    const rank = Math.floor(Number(state.keeperMastery.ranks[talentId]) || 0);
    state.keeperMastery.ranks[talentId] = Math.max(0, Math.min(talent.maxRank, rank));
  }
  for (const talentId of Object.keys(state.keeperMastery.ranks)) if (!KEEPER_TALENTS[talentId]) delete state.keeperMastery.ranks[talentId];
  return state.keeperMastery;
}

export function keeperTalentBudget(state) {
  const heroLevel = Math.max(1, Number(state?.heroes?.[state?.selectedClass]?.level) || 1);
  const renown = Math.max(1, Number(state?.campaign?.renown) || 1);
  const earned = 1 + Math.floor((heroLevel - 1) / 2) + Math.floor((renown - 1) / 2);
  const spent = Object.values(ensureKeeperMastery(state).ranks).reduce((sum, rank) => sum + rank, 0);
  return { earned, spent, available: Math.max(0, earned - spent) };
}

export function keeperTalentBonuses(state) {
  const bonuses = { maxHp: 0, maxMana: 0, attack: 0, armor: 0, spellPower: 0, lootLevel: 0, creatureMult: 0, bondGain: 0, startingMomentum: 0 };
  const ranks = ensureKeeperMastery(state).ranks;
  for (const [talentId, rank] of Object.entries(ranks)) {
    const talent = KEEPER_TALENTS[talentId];
    if (!talent || !rank) continue;
    for (const [key, value] of Object.entries(talent.bonuses)) bonuses[key] += value * rank;
  }
  return bonuses;
}

export function keeperBranchProgress(state, branchId) {
  const branch = KEEPER_TALENT_BRANCHES[branchId];
  if (!branch) return 0;
  const ranks = ensureKeeperMastery(state).ranks;
  return branch.talents.reduce((sum, talentId) => sum + (ranks[talentId] || 0), 0);
}

export function learnKeeperTalent(state, talentId) {
  const talent = KEEPER_TALENTS[talentId];
  if (!talent) return { ok: false, message: "Choose a known Keeper talent." };
  const mastery = ensureKeeperMastery(state), rank = mastery.ranks[talentId] || 0;
  if (rank >= talent.maxRank) return { ok: false, message: `${talent.name} is already mastered.` };
  const requiredBranchRanks = talent.tier === 2 ? 2 : talent.tier === 3 ? 5 : 0;
  if (keeperBranchProgress(state, talent.branch) < requiredBranchRanks) return { ok: false, message: `${talent.name} requires ${requiredBranchRanks} ranks in ${KEEPER_TALENT_BRANCHES[talent.branch].name}.` };
  if (keeperTalentBudget(state).available < 1) return { ok: false, message: "Earn another mastery point through Keeper levels or Renown." };
  mastery.ranks[talentId] = rank + 1;
  state.journal ||= [];
  state.journal.unshift(`${KEEPER_TALENT_BRANCHES[talent.branch].name} mastery advanced: ${talent.name} ${rank + 1}/${talent.maxRank}.`);
  return { ok: true, rank: rank + 1, message: `${talent.name} advanced to rank ${rank + 1}.` };
}

export function respecKeeperTalents(state) {
  const mastery = ensureKeeperMastery(state), spent = keeperTalentBudget(state).spent;
  if (!spent) return { ok: false, message: "No Keeper mastery ranks have been assigned." };
  const cost = 90 + spent * 55;
  if (state.gold < cost) return { ok: false, message: `Rekindling ${spent} mastery rank${spent === 1 ? "" : "s"} costs ${cost} gold.` };
  state.gold -= cost;
  mastery.ranks = Object.fromEntries(Object.keys(KEEPER_TALENTS).map((talentId) => [talentId, 0]));
  state.journal ||= [];
  state.journal.unshift(`The Keeper rekindled ${spent} mastery rank${spent === 1 ? "" : "s"} for ${cost} gold.`);
  return { ok: true, cost, refunded: spent, message: `${spent} mastery rank${spent === 1 ? "" : "s"} returned for ${cost} gold.` };
}

function ensureExpedition(state) {
  state.expedition ||= { regionId: "miredeep", difficultyId: "scout" };
  if (!RIVAL_REGIONS[state.expedition.regionId]) state.expedition.regionId = "miredeep";
  if (!EXPEDITION_DIFFICULTIES[state.expedition.difficultyId]) state.expedition.difficultyId = "scout";
  state.expedition.doctrine ||= { stance: "balanced", potionPolicy: "standard", spellPolicy: "balanced", keeperPosition: "front", creatureOrder: [] };
  const doctrine = state.expedition.doctrine;
  if (!EXPEDITION_STANCES[doctrine.stance]) doctrine.stance = "balanced";
  if (!POTION_POLICIES[doctrine.potionPolicy]) doctrine.potionPolicy = "standard";
  if (!SPELL_POLICIES[doctrine.spellPolicy]) doctrine.spellPolicy = "balanced";
  if (!KEEPER_POSITIONS[doctrine.keeperPosition]) doctrine.keeperPosition = "front";
  const assignedIds = (state.creatures || []).filter((creature) => creature.assignment === "expedition").map((creature) => creature.id).slice(0, 3);
  doctrine.creatureOrder = Array.isArray(doctrine.creatureOrder) ? doctrine.creatureOrder.filter((id, index, ids) => assignedIds.includes(id) && ids.indexOf(id) === index) : [];
  for (const id of assignedIds) if (!doctrine.creatureOrder.includes(id)) doctrine.creatureOrder.push(id);
  return state.expedition;
}

export function expeditionDoctrine(state) {
  return ensureExpedition(state).doctrine;
}

export function configureExpeditionDoctrine(state, updates = {}) {
  const doctrine = expeditionDoctrine(state);
  if (updates.stance != null && !EXPEDITION_STANCES[updates.stance]) return { ok: false, message: "Choose a known expedition stance." };
  if (updates.potionPolicy != null && !POTION_POLICIES[updates.potionPolicy]) return { ok: false, message: "Choose a known potion policy." };
  if (updates.spellPolicy != null && !SPELL_POLICIES[updates.spellPolicy]) return { ok: false, message: "Choose a known spell policy." };
  if (updates.keeperPosition != null && !KEEPER_POSITIONS[updates.keeperPosition]) return { ok: false, message: "Choose a known Keeper position." };
  Object.assign(doctrine, Object.fromEntries(Object.entries(updates).filter(([key]) => ["stance", "potionPolicy", "spellPolicy", "keeperPosition"].includes(key))));
  return { ok: true, doctrine, message: `${EXPEDITION_STANCES[doctrine.stance].name} stance prepared with ${SPELL_POLICIES[doctrine.spellPolicy].name.toLowerCase()}.` };
}

export function moveExpeditionCreature(state, creatureId, direction) {
  const doctrine = expeditionDoctrine(state), index = doctrine.creatureOrder.indexOf(creatureId);
  if (index < 0) return { ok: false, message: "That creature is not in the expedition formation." };
  const target = direction === "up" ? index - 1 : direction === "down" ? index + 1 : index;
  if (target < 0 || target >= doctrine.creatureOrder.length || target === index) return { ok: false, message: "That creature is already at the edge of the formation." };
  [doctrine.creatureOrder[index], doctrine.creatureOrder[target]] = [doctrine.creatureOrder[target], doctrine.creatureOrder[index]];
  return { ok: true, message: "Creature formation order updated." };
}

function doctrineAdjustedStats(state, stats) {
  const doctrine = state.raid?.doctrine || expeditionDoctrine(state);
  const stance = EXPEDITION_STANCES[doctrine.stance] || EXPEDITION_STANCES.balanced;
  return { ...stats, attack: Math.max(1, Math.round(stats.attack * stance.attackMult)), armor: Math.max(0, Math.round(stats.armor * stance.armorMult)) };
}

function normalizeRaidV05(state) {
  if (!state.raid) return;
  state.raid.regionId = RIVAL_REGIONS[state.raid.regionId] ? state.raid.regionId : state.expedition.regionId;
  state.raid.difficultyId = EXPEDITION_DIFFICULTIES[state.raid.difficultyId] ? state.raid.difficultyId : state.expedition.difficultyId;
  state.raid.modifierId = EXPEDITION_MODIFIERS[state.raid.modifierId] ? state.raid.modifierId : "gilded";
  state.raid.rewardMult ||= EXPEDITION_DIFFICULTIES[state.raid.difficultyId].rewardMult;
  state.raid.encounters?.forEach((encounter) => { encounter.elite = Boolean(encounter.elite); });
  const finalEncounter = state.raid.encounters?.[state.raid.encounters.length - 1];
  if (finalEncounter) finalEncounter.sovereignId = RIVAL_REGIONS[state.raid.regionId]?.sovereignId || null;
  if (state.raid.enemy && state.raid.position === state.raid.encounters?.length - 1 && finalEncounter?.sovereignId) {
    const sovereign = REGIONAL_SOVEREIGNS[finalEncounter.sovereignId];
    state.raid.enemy.sovereignId = finalEncounter.sovereignId;
    state.raid.enemy.boss = true;
    state.raid.enemy.phaseIndex = Math.max(0, Math.min(sovereign.phases.length - 1, Math.floor(Number(state.raid.enemy.phaseIndex) || 0)));
    state.raid.enemy.name = sovereign.name;
    state.raid.enemy.title = sovereign.title;
  }
  state.raid.doctrine ||= JSON.parse(JSON.stringify(expeditionDoctrine(state)));
}

function ensureDungeonMastery(state, preserveLegacyRoute = false) {
  if (!state.dungeon) return;
  if (!DUNGEON_LAYOUTS[state.dungeon.layoutId]) state.dungeon.layoutId = preserveLegacyRoute ? "grand" : "spine";
  state.dungeon.trapLevels ||= {};
  state.dungeon.cells?.forEach((pieceId, index) => {
    if (DUNGEON_PIECES[pieceId]?.kind === "trap" && !state.dungeon.trapLevels[index]) state.dungeon.trapLevels[index] = 1;
  });
}

function ensureDungeonArchitecture(state) {
  if (!state.dungeon) return;
  state.dungeon.themeId = DUNGEON_THEMES[state.dungeon.themeId] ? state.dungeon.themeId : "heartland";
  state.dungeon.unlockedThemes = Array.isArray(state.dungeon.unlockedThemes)
    ? state.dungeon.unlockedThemes.filter((id, index, ids) => DUNGEON_THEMES[id] && ids.indexOf(id) === index)
    : ["heartland"];
  if (!state.dungeon.unlockedThemes.includes("heartland")) state.dungeon.unlockedThemes.unshift("heartland");
  if (!state.dungeon.unlockedThemes.includes(state.dungeon.themeId)) state.dungeon.themeId = "heartland";
  state.dungeon.rooms = state.dungeon.rooms && typeof state.dungeon.rooms === "object" && !Array.isArray(state.dungeon.rooms) ? state.dungeon.rooms : {};
  const path = dungeonPath(state), endpoints = new Set([path[0], path.at(-1)]);
  for (const [cell, roomId] of Object.entries(state.dungeon.rooms)) if (!DUNGEON_ROOMS[roomId] || !path.includes(Number(cell)) || endpoints.has(Number(cell))) delete state.dungeon.rooms[cell];
}

function pushUniqueKnown(target, values, catalogue) {
  for (const id of values.filter(Boolean)) if (catalogue[id] && !target.includes(id)) target.push(id);
}

function ensureChronicle(state) {
  const source = state.chronicle && typeof state.chronicle === "object" ? state.chronicle : {};
  state.chronicle = {
    species: Array.isArray(source.species) ? source.species.filter((id, index, ids) => CREATURE_SPECIES[id] && ids.indexOf(id) === index) : [],
    regions: Array.isArray(source.regions) ? source.regions.filter((id, index, ids) => RIVAL_REGIONS[id] && ids.indexOf(id) === index) : [],
    sovereigns: Array.isArray(source.sovereigns) ? source.sovereigns.filter((id, index, ids) => REGIONAL_SOVEREIGNS[id] && ids.indexOf(id) === index) : [],
    sets: Array.isArray(source.sets) ? source.sets.filter((id, index, ids) => ITEM_SETS[id] && ids.indexOf(id) === index) : [],
    rooms: Array.isArray(source.rooms) ? source.rooms.filter((id, index, ids) => DUNGEON_ROOMS[id] && ids.indexOf(id) === index) : [],
    claimed: Array.isArray(source.claimed) ? source.claimed.filter((id, index, ids) => CHRONICLE_ACHIEVEMENTS[id] && ids.indexOf(id) === index) : []
  };
  pushUniqueKnown(state.chronicle.species, [...(state.creatures || []).map((entry) => entry.speciesId), ...(state.eggs || []).map((entry) => entry.speciesId)], CREATURE_SPECIES);
  pushUniqueKnown(state.chronicle.regions, [state.expedition?.regionId], RIVAL_REGIONS);
  pushUniqueKnown(state.chronicle.sovereigns, state.campaign?.sovereignsDefeated || [], REGIONAL_SOVEREIGNS);
  pushUniqueKnown(state.chronicle.sets, state.setCodex || [], ITEM_SETS);
  pushUniqueKnown(state.chronicle.rooms, Object.values(state.dungeon?.rooms || {}), DUNGEON_ROOMS);
  return state.chronicle;
}

export function chronicleProgress(state) {
  const chronicle = ensureChronicle(state);
  const categories = {
    species: { name: "Living Bestiary", discovered: chronicle.species.length, total: Object.keys(CREATURE_SPECIES).length, ids: chronicle.species },
    regions: { name: "Rival Atlas", discovered: chronicle.regions.length, total: Object.keys(RIVAL_REGIONS).length, ids: chronicle.regions },
    sovereigns: { name: "Fallen Sovereigns", discovered: chronicle.sovereigns.length, total: Object.keys(REGIONAL_SOVEREIGNS).length, ids: chronicle.sovereigns },
    sets: { name: "Relic Set Archive", discovered: chronicle.sets.length, total: Object.keys(ITEM_SETS).length, ids: chronicle.sets },
    rooms: { name: "Architect's Ledger", discovered: chronicle.rooms.length, total: Object.keys(DUNGEON_ROOMS).length, ids: chronicle.rooms }
  };
  const discovered = Object.values(categories).reduce((sum, category) => sum + category.discovered, 0);
  const total = Object.values(categories).reduce((sum, category) => sum + category.total, 0);
  const achievements = Object.entries(CHRONICLE_ACHIEVEMENTS).map(([id, achievement]) => {
    const progress = categories[achievement.metric].discovered, claimed = chronicle.claimed.includes(id);
    return { id, ...achievement, progress, claimed, ready: progress >= achievement.target && !claimed };
  });
  return { categories, achievements, discovered, total, percent: Math.round(discovered / Math.max(1, total) * 100) };
}

export function claimChronicleReward(state, achievementId) {
  const achievement = CHRONICLE_ACHIEVEMENTS[achievementId];
  if (!achievement) return { ok: false, message: "Choose a known Chronicle achievement." };
  const progress = chronicleProgress(state).achievements.find((entry) => entry.id === achievementId);
  if (progress.claimed) return { ok: false, message: `${achievement.name} was already claimed.` };
  if (!progress.ready) return { ok: false, message: `${achievement.name} is still in progress.` };
  for (const [resource, amount] of Object.entries(achievement.reward)) state[resource] = Math.max(0, Number(state[resource]) || 0) + amount;
  state.chronicle.claimed.push(achievementId);
  state.journal?.unshift(`Chronicle achievement completed: ${achievement.name}.`);
  return { ok: true, reward: achievement.reward, message: `${achievement.name} entered the permanent Chronicle.` };
}

function ownedItems(state) {
  const items = [...(state.inventory || []), ...Object.values(state.heroes?.[state.selectedClass]?.equipment || {}).filter(Boolean)];
  for (const creature of state.creatures || []) items.push(...Object.values(creature.equipment || {}).filter(Boolean));
  for (const loadout of Object.values(state.dungeon?.monsterGear || {})) items.push(...Object.values(loadout?.equipment || {}).filter(Boolean));
  return items;
}

export function recordLootDiscovery(state, items = ownedItems(state)) {
  state.lootCodex ||= { affixes: [], traits: [], rarities: [] };
  state.setCodex ||= [];
  state.lootFilters ||= { search: "", slot: "all", rarity: "all", sort: "power", favoritesOnly: false };
  const affixes = new Set(state.lootCodex.affixes || []), traits = new Set(state.lootCodex.traits || []), rarities = new Set(state.lootCodex.rarities || []);
  for (const item of items.filter(Boolean)) {
    normalizeRelicItem(item);
    item.favorite = Boolean(item.favorite); item.ascension = Math.max(0, Number(item.ascension) || Math.floor(Math.max(1, item.level || 1) / 25));
    item.prefixes ||= []; item.mods ||= [];
    item.prefixes.forEach((name) => affixes.add(name));
    if (item.trait) traits.add(item.trait);
    if (item.rarity) rarities.add(item.rarity);
    if (item.setId && !state.setCodex.includes(item.setId)) state.setCodex.push(item.setId);
  }
  state.lootCodex.affixes = [...affixes]; state.lootCodex.traits = [...traits]; state.lootCodex.rarities = [...rarities];
  ensureChronicle(state);
  return state.lootCodex;
}

function ensureLootEndgame(state) {
  recordLootDiscovery(state);
  const filters = state.lootFilters;
  if (!["all", ...Object.keys(SLOT_LABELS), "ring"].includes(filters.slot)) filters.slot = "all";
  if (!["all", ...RARITIES.map((entry) => entry.name)].includes(filters.rarity)) filters.rarity = "all";
  if (!["power", "level", "value", "name"].includes(filters.sort)) filters.sort = "power";
  filters.search = String(filters.search || "").slice(0, 40); filters.favoritesOnly = Boolean(filters.favoritesOnly);
}

function ensureRelicSets(state) {
  state.runes ||= {};
  for (const runeId of Object.keys(RUNE_TYPES)) state.runes[runeId] = Math.max(0, Math.floor(Number(state.runes[runeId]) || 0));
  state.setCodex = Array.isArray(state.setCodex) ? state.setCodex.filter((id, index, ids) => ITEM_SETS[id] && ids.indexOf(id) === index) : [];
  for (const item of ownedItems(state)) normalizeRelicItem(item);
}

function ensurePresentationSettings(state) {
  state.settings ||= { soundEnabled: true, soundVolume: .42, combatShake: true };
  state.settings.soundEnabled = state.settings.soundEnabled !== false;
  state.settings.soundVolume = Math.max(0, Math.min(1, Number(state.settings.soundVolume) || 0));
  state.settings.combatShake = state.settings.combatShake !== false;
  state.settings.reducedMotion = Boolean(state.settings.reducedMotion);
  state.settings.highContrast = Boolean(state.settings.highContrast);
  if (!["low", "balanced", "high"].includes(state.settings.sceneQuality)) state.settings.sceneQuality = "balanced";
  if (!["fast", "standard", "cinematic"].includes(state.settings.battlePace)) state.settings.battlePace = "standard";
  if (!["2d", "3d"].includes(state.settings.presentationMode)) state.settings.presentationMode = "2d";
  if (!["comfortable", "large"].includes(state.settings.textSize)) state.settings.textSize = "large";
}

function ensureReleaseCandidateState(state, returningKeeper = true) {
  ensurePresentationSettings(state);
  if (!state.onboarding || typeof state.onboarding !== "object") state.onboarding = { complete: returningKeeper, step: 0 };
  state.onboarding.complete = Boolean(state.onboarding.complete);
  state.onboarding.step = Math.max(0, Math.min(3, Math.floor(Number(state.onboarding.step) || 0)));
}

function deterministicTraitId(creature) {
  const ids = Object.keys(CREATURE_TRAITS);
  const value = `${creature.speciesId || "slime"}${creature.name || ""}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ids[value % ids.length];
}

function normalizeCreature(creature) {
  creature.traitId = CREATURE_TRAITS[creature.traitId] ? creature.traitId : deterministicTraitId(creature);
  creature.bond = Math.max(0, Math.min(100, Number.isFinite(creature.bond) ? creature.bond : creature.assignment === "expedition" ? 12 : 6));
  creature.awakeningId = CREATURE_AWAKENINGS[creature.awakeningId] ? creature.awakeningId : null;
  creature.lineageId = CREATURE_LINEAGES[creature.lineageId]?.speciesId === creature.speciesId ? creature.lineageId : null;
  creature.lineageRank = creature.lineageId ? Math.max(1, Math.min(3, Math.floor(Number(creature.lineageRank) || 1))) : 0;
  creature.memories = Array.isArray(creature.memories) ? creature.memories.filter((id, index, ids) => CREATURE_MEMORIES[id] && ids.indexOf(id) === index) : [];
  for (const memoryId of ["hatched", creature.bond >= 25 && "familiar", creature.level >= 4 && "veteran", creature.ageDays >= 18 && "adult", creature.awakeningId && "awakened", creature.bond >= 75 && "soulbound"].filter(Boolean)) if (!creature.memories.includes(memoryId)) creature.memories.push(memoryId);
  creature.equipment ||= {};
  creature.spellId ||= null;
  creature.potions ||= 0;
  return creature;
}

function normalizeEgg(egg) {
  if (!CREATURE_TRAITS[egg.traitId]) {
    const ids = Object.keys(CREATURE_TRAITS);
    const value = `${egg.speciesId || "slime"}${egg.id || ""}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    egg.traitId = ids[value % ids.length];
  }
  return egg;
}

export function migrateState(saved) {
  if (!saved || typeof saved !== "object") return createInitialState();
  if (saved.version === VERSION) {
    saved.creatures?.forEach(normalizeCreature);
    saved.eggs?.forEach(normalizeEgg);
    ensureCampaign(saved);
    ensureExpedition(saved);
    normalizeRaidV05(saved);
    ensureDungeonMastery(saved);
    ensureDungeonArchitecture(saved);
    ensureLootEndgame(saved);
    ensureRelicSets(saved);
    ensureReleaseCandidateState(saved);
    ensureKeeperMastery(saved);
    ensureLivingAtlas(saved);
    ensureChronicle(saved);
    return saved;
  }
  if (saved.version === 20 || saved.version === 19 || saved.version === 18 || saved.version === 17 || saved.version === 16 || saved.version === 15 || saved.version === 14 || saved.version === 13 || saved.version === 12 || saved.version === 11 || saved.version === 10 || saved.version === 9 || saved.version === 8 || saved.version === 7 || saved.version === 6 || saved.version === 5 || saved.version === 4) {
    const fromVersion = saved.version;
    saved.creatures?.forEach(normalizeCreature);
    saved.eggs?.forEach(normalizeEgg);
    ensureCampaign(saved);
    ensureExpedition(saved);
    normalizeRaidV05(saved);
    ensureDungeonMastery(saved, true);
    ensureDungeonArchitecture(saved);
    ensureLootEndgame(saved);
    ensureRelicSets(saved);
    ensureReleaseCandidateState(saved, true);
    ensureKeeperMastery(saved);
    ensureLivingAtlas(saved);
    ensureChronicle(saved);
    saved.version = VERSION;
    saved.journal ||= [];
    saved.journal.unshift(fromVersion === 20 ? "Keeperfall v2.0 awakened the Living Heart and sealed the complete campaign covenant." : fromVersion === 19 ? "Keeperfall v1.9 passed into release-candidate audit with full-profile regression checks." : fromVersion === 18 ? "Keeperfall v1.8 opened the permanent Chronicle of creatures, regions, rulers, relics, and rooms." : fromVersion === 17 ? "Keeperfall v1.7 opened themed rooms and route architecture throughout the Heartway." : fromVersion === 16 ? "Keeperfall v1.6 fixed the Heartway to an isometric world and awakened the rotating Living Atlas." : fromVersion === 15 ? "Keeperfall v1.5 enthroned five Regional Sovereigns. Every rival heart now has a named, shifting ruler." : fromVersion === 14 ? "Keeperfall v1.4 revealed Relic Sets and rune sockets throughout the hoard." : fromVersion === 13 ? "Keeperfall v1.3 opened Creature Lineages. Every companion now carries a visible life history." : fromVersion === 12 ? "Keeperfall v1.2 prepared Expedition Doctrine. Automatic battles now remember their orders." : fromVersion === 11 ? "Keeperfall v1.1 awakened Keeper Mastery. One path now shapes the whole campaign." : fromVersion === 10 ? "Keeperfall v1 awakened. The Heartway is ready for its first complete campaign." : fromVersion === 9 ? "Keeperfall v0.9 secured this profile with recovery tools and accessible controls." : fromVersion === 8 ? "Keeperfall v0.8 widened the bestiary and tuned the living soundscape." : fromVersion === 7 ? "Keeperfall v0.7 catalogued the hoard and protected favorite relics." : fromVersion === 6 ? "Keeperfall v0.6 preserved the full Heartway and opened dungeon mastery." : fromVersion === 5 ? "Keeperfall opened the rival region atlas." : "Keeperfall preserved this profile and awakened the bond ledger.");
    return saved;
  }
  return createInitialState(saved.seed || Date.now());
}

export function createInitialState(seed = Date.now()) {
  const rng = seededRandom(seed);
  const inventory = [
    generateItem(1, rng, "weapon"), generateItem(1, rng, "chest"), generateItem(1, rng, "helmet"),
    generateItem(2, rng, "ring"), generateItem(2, rng, "feet"), generateItem(3, rng, "offhand")
  ];
  const cells = Array(25).fill("empty");
  cells[2] = "spikes"; cells[7] = "skeleton"; cells[17] = "bolts";
  const companion = makeCreature("slime", 1, 4, "expedition", rng, "patient"); companion.name = "Mossbit";
  const guardian = makeCreature("skeleton", 1, 8, "dungeon", rng, "stalwart"); guardian.name = "Rattle"; guardian.dungeonCell = 7;
  const firstEgg = makeEgg("goblin", 0, rng);
  const state = {
    version: VERSION, seed, day: 1, gold: 950, seals: 6, essence: 16, potions: 3,
    selectedClass: "fighter", party: ["fighter"],
    heroes: { fighter: { level: 1, xp: 0, equipment: {} } },
    creatures: [companion, guardian], eggs: [firstEgg], selectedCreatureId: companion.id,
    expedition: { regionId: "miredeep", difficultyId: "scout" },
    inventory, materials: { metal: [5,2,0,0,0], wood: [3,1,0,0,0], leather: [3,1,0,0,0], cloth: [3,1,0,0,0], bone: [2,1,0,0,0], crystal: [1,0,0,0,0], ink: [2,0,0,0,0], essence: [1,0,0,0,0] },
    dungeon: { cells, selectedPiece: "spikes", rank: 1, levelBand: 1, hoard: 100, published: false, victories: 0, defeats: 0, layoutId: "spine", trapLevels: { 2: 1, 17: 1 }, monsterGear: {}, monsterAssignments: { 7: guardian.id }, themeId: "heartland", unlockedThemes: ["heartland"], rooms: {} },
    raid: null, reports: [], journal: ["Mossbit joins the keeper's first expedition.", "Rattle takes watch in the seventh chamber.", "A goblin egg waits in the warm nursery."],
    selectedInventoryId: inventory[0].id
  };
  state.settings = { soundEnabled: true, soundVolume: .42, combatShake: true, reducedMotion: false, highContrast: false, sceneQuality: "balanced", battlePace: "standard", presentationMode: "2d", textSize: "large" };
  state.onboarding = { complete: false, step: 0 };
  state.campaign = { renown: 1, completedSets: 0, contracts: createContractSet(seed, 1), sovereignsDefeated: [], sovereignVictories: Object.fromEntries(Object.keys(REGIONAL_SOVEREIGNS).map((id) => [id, 0])) };
  state.keeperMastery = { ranks: Object.fromEntries(Object.keys(KEEPER_TALENTS).map((talentId) => [talentId, 0])) };
  state.runes = { fury: 1, ward: 1, balance: 0, heart: 0, fang: 0, bastion: 0 };
  state.setCodex = [];
  ensureExpedition(state);
  ensureLootEndgame(state);
  ensureRelicSets(state);
  ensureLivingAtlas(state);
  ensureDungeonArchitecture(state);
  ensureChronicle(state);
  return state;
}

export function creatureLifeStage(creature) {
  if (creature.ageDays < 5) return "Hatchling";
  if (creature.ageDays < 18) return "Young";
  if (creature.ageDays < 45) return "Adult";
  return "Elder";
}

export function creatureBondTier(creature) {
  const bond = Math.max(0, Math.min(100, creature?.bond || 0));
  if (bond >= 75) return "Soulbound";
  if (bond >= 50) return "Trusted";
  if (bond >= 25) return "Familiar";
  return "Wary";
}

export function creatureStats(state, creatureOrId) {
  const creature = typeof creatureOrId === "string" ? state.creatures.find((entry) => entry.id === creatureOrId) : creatureOrId;
  if (!creature) return { maxHp: 1, attack: 1, armor: 0 };
  const base = DUNGEON_PIECES[creature.speciesId];
  const stageBonus = ({ Hatchling: 0, Young: 2, Adult: 5, Elder: 7 })[creatureLifeStage(creature)];
  normalizeCreature(creature);
  const equipped = Object.values(creature.equipment || {}).filter(Boolean);
  const runeBonus = equipped.reduce((out, item) => { const bonus = itemRuneBonuses(item); out.attack += bonus.attack; out.armor += bonus.armor; out.vitality += bonus.vitality; return out; }, { attack: 0, armor: 0, vitality: 0 });
  const setBonus = equipmentSetBonuses(creature.equipment || {});
  const spell = SPELLS.find((entry) => entry.id === creature.spellId);
  const trait = CREATURE_TRAITS[creature.traitId] || { hp: 0, attack: 0, armor: 0 };
  const awakening = CREATURE_AWAKENINGS[creature.awakeningId] || { hp: 0, attack: 0, armor: 0 };
  const lineage = CREATURE_LINEAGES[creature.lineageId] || { hp: 0, attack: 0, armor: 0 };
  const lineageRank = creature.lineageRank || 0;
  const bondBonus = Math.floor((creature.bond || 0) / 25);
  const creatureMult = 1 + keeperTalentBonuses(state).creatureMult;
  return {
    maxHp: Math.round((base.hp + (creature.level - 1) * 7 + stageBonus * 3 + trait.hp + awakening.hp + lineage.hp * lineageRank + bondBonus * 3 + equipped.reduce((sum,item)=>sum+item.armor*2,0) + runeBonus.vitality + setBonus.maxHp) * creatureMult),
    attack: Math.round((base.attack + (creature.level - 1) * 2 + stageBonus + trait.attack + awakening.attack + lineage.attack * lineageRank + Math.ceil(bondBonus / 2) + equipped.reduce((sum,item)=>sum+item.attack,0) + runeBonus.attack + setBonus.attack + (spell?.power>0?Math.round(spell.power*.16):0)) * creatureMult),
    armor: Math.max(0, Math.round((base.armor + Math.floor((creature.level - 1) * .7) + Math.floor(stageBonus / 2) + trait.armor + awakening.armor + lineage.armor * lineageRank + Math.floor(bondBonus / 2) + equipped.reduce((sum,item)=>sum+item.armor,0) + runeBonus.armor + setBonus.armor) * creatureMult))
  };
}

export function purchaseEgg(state, speciesId, rng = Math.random) {
  const species = CREATURE_SPECIES[speciesId];
  if (!species) return { ok: false, message: "Choose a known creature egg." };
  if (state.gold < species.eggCost) return { ok: false, message: `${species.name} eggs cost ${species.eggCost} gold.` };
  state.gold -= species.eggCost;
  const quality = rng() > .88 ? 1 : 0;
  const egg = makeEgg(speciesId, quality, rng); state.eggs.push(egg);
  state.journal.unshift(`Purchased a ${species.name} egg for the nursery.`);
  return { ok: true, egg, message: `${species.name} egg placed in the nursery.` };
}

function hatchEggInternal(state, egg) {
  const rng = seededRandom(`${state.seed}${state.day}${egg.id}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  const creature = makeCreature(egg.speciesId, 1 + egg.quality, 0, "reserve", rng, egg.traitId);
  state.creatures.push(creature);
  state.eggs = state.eggs.filter((entry) => entry.id !== egg.id);
  state.journal.unshift(`${creature.name}, a ${CREATURE_SPECIES[egg.speciesId].name} hatchling, joined the menagerie.`);
  progressContracts(state, "hatch", 1);
  return creature;
}

export function incubateEgg(state, eggId) {
  const egg = state.eggs.find((entry) => entry.id === eggId);
  if (!egg) return { ok: false, message: "That egg is no longer in the nursery." };
  if (state.gold < 30) return { ok: false, message: "Focused incubation costs 30 gold." };
  state.gold -= 30; egg.progress += 1;
  if (egg.progress >= egg.hatchDays) {
    const creature = hatchEggInternal(state, egg);
    return { ok: true, hatched: true, creature, message: `${creature.name} hatched and is resting in the menagerie.` };
  }
  return { ok: true, hatched: false, message: `The egg is warmer: ${egg.progress}/${egg.hatchDays} incubation.` };
}

function clearCreatureDungeonPost(state, creature) {
  if (creature.dungeonCell == null) return;
  const cell = creature.dungeonCell;
  delete state.dungeon.monsterGear?.[cell];
  delete state.dungeon.monsterAssignments?.[cell];
  state.dungeon.cells[cell] = "empty";
  creature.dungeonCell = null;
}

export function assignCreature(state, creatureId, assignment, dungeonCell = null) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before moving a dungeon guardian." };
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return { ok: false, message: "Choose a creature from the menagerie." };
  if (assignment === "expedition" && state.creatures.filter((entry) => entry.assignment === "expedition" && entry.id !== creatureId).length >= 3) return { ok: false, message: "Only three creatures can travel with the hero." };
  if (assignment === "dungeon") {
    const cell = Number(dungeonCell);
    const path = dungeonPath(state);
    if (!path.includes(cell) || cell === path[0] || cell === path[path.length - 1] || state.dungeon.cells[cell] !== "empty") return { ok: false, message: "Choose an empty Heartway chamber." };
    clearCreatureDungeonPost(state, creature);
    creature.assignment = "dungeon"; creature.dungeonCell = cell;
    state.dungeon.cells[cell] = creature.speciesId; state.dungeon.monsterAssignments[cell] = creature.id;
    return { ok: true, message: `${creature.name} now guards chamber ${path.indexOf(cell) + 1}.` };
  }
  clearCreatureDungeonPost(state, creature);
  creature.assignment = assignment === "expedition" ? "expedition" : "reserve";
  return { ok: true, message: creature.assignment === "expedition" ? `${creature.name} will travel with the hero.` : `${creature.name} is resting in the menagerie.` };
}

function addCreatureBond(state, creatureId, amount) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return 0;
  normalizeCreature(creature);
  const before = creature.bond;
  const masteryBonus = amount > 0 ? keeperTalentBonuses(state).bondGain : 0;
  creature.bond = Math.max(0, Math.min(100, creature.bond + amount + masteryBonus));
  normalizeCreature(creature);
  return creature.bond - before;
}

export function renameCreature(state, creatureId, name) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  const clean = String(name || "").trim().replace(/\s+/g, " ").slice(0, 22);
  if (!creature) return { ok: false, message: "Choose a creature from the menagerie." };
  if (clean.length < 2) return { ok: false, message: "Creature names need at least two characters." };
  creature.name = clean;
  state.journal.unshift(`${CREATURE_SPECIES[creature.speciesId].name} is now called ${clean}.`);
  return { ok: true, message: `${clean} remembers the new name.` };
}

export function trainCreature(state, creatureId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return { ok: false, message: "Choose a creature from the menagerie." };
  if (creature.assignment !== "reserve") return { ok: false, message: "A creature must rest in the Menagerie before training." };
  if (state.gold < 65) return { ok: false, message: "Focused training costs 65 gold." };
  state.gold -= 65;
  const levelBefore = creature.level;
  addCreatureXp(state, creature.id, 18);
  addCreatureBond(state, creature.id, 3);
  state.journal.unshift(`${creature.name} completed focused training.`);
  return { ok: true, leveled: creature.level > levelBefore, message: `${creature.name} gained 18 XP and 3 bond.` };
}

export function awakenCreature(state, creatureId, awakeningId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  const awakening = CREATURE_AWAKENINGS[awakeningId];
  if (!creature || !awakening) return { ok: false, message: "Choose a creature and a valid awakening." };
  normalizeCreature(creature);
  if (creature.awakeningId) return { ok: false, message: `${creature.name} has already awakened.` };
  if (creature.assignment !== "reserve") return { ok: false, message: "A creature must rest in the Menagerie to awaken." };
  if (creature.level < 4 || creature.ageDays < 18) return { ok: false, message: "Awakening requires level 4 and the Adult life stage." };
  if (state.gold < 220 || state.essence < 5 || state.seals < 1) return { ok: false, message: "Awakening costs 220 gold, 5 essence, and 1 Dungeon Seal." };
  state.gold -= 220; state.essence -= 5; state.seals -= 1; creature.awakeningId = awakeningId;
  creature.bond = Math.min(100, creature.bond + 10);
  normalizeCreature(creature);
  state.journal.unshift(`${creature.name} awakened as a ${awakening.name}.`);
  return { ok: true, message: `${creature.name} awakened as a ${awakening.name}.` };
}

export function creatureLineageOptions(creatureOrSpecies) {
  const speciesId = typeof creatureOrSpecies === "string" ? creatureOrSpecies : creatureOrSpecies?.speciesId;
  return Object.entries(CREATURE_LINEAGES).filter(([, lineage]) => lineage.speciesId === speciesId).map(([id, lineage]) => ({ id, ...lineage }));
}

export function creatureMemoryLedger(creature) {
  normalizeCreature(creature);
  return creature.memories.map((id) => ({ id, ...CREATURE_MEMORIES[id] }));
}

export function advanceCreatureLineage(state, creatureId, lineageId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId), lineage = CREATURE_LINEAGES[lineageId];
  if (!creature || !lineage || lineage.speciesId !== creature.speciesId) return { ok: false, message: "Choose a lineage born from this creature species." };
  normalizeCreature(creature);
  if (creature.assignment !== "reserve") return { ok: false, message: "A creature must rest in the Menagerie to shape its lineage." };
  if (creature.lineageId && creature.lineageId !== lineageId) return { ok: false, message: `${creature.name} permanently follows ${CREATURE_LINEAGES[creature.lineageId].name}.` };
  const nextRank = (creature.lineageRank || 0) + 1;
  if (nextRank > 3) return { ok: false, message: `${lineage.name} is already fully remembered.` };
  const levelRequired = [0, 2, 5, 9][nextRank], goldCost = [0, 100, 180, 300][nextRank], essenceCost = [0, 2, 4, 7][nextRank];
  if (creature.level < levelRequired) return { ok: false, message: `${lineage.name} rank ${nextRank} requires creature level ${levelRequired}.` };
  if (state.gold < goldCost || state.essence < essenceCost) return { ok: false, message: `${lineage.name} rank ${nextRank} costs ${goldCost} gold and ${essenceCost} essence.` };
  state.gold -= goldCost; state.essence -= essenceCost; creature.lineageId = lineageId; creature.lineageRank = nextRank;
  state.journal.unshift(`${creature.name} remembered ${lineage.name} rank ${nextRank}.`);
  return { ok: true, rank: nextRank, message: `${creature.name} shaped ${lineage.name} rank ${nextRank}.` };
}

function recordCreatureMemory(state, creatureId, memoryId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature || !CREATURE_MEMORIES[memoryId]) return false;
  normalizeCreature(creature);
  if (creature.memories.includes(memoryId)) return false;
  creature.memories.push(memoryId);
  state.journal.unshift(`${creature.name} formed a new memory: ${CREATURE_MEMORIES[memoryId].name}.`);
  return true;
}

function progressContracts(state, key, amount = 1) {
  const campaign = ensureCampaign(state);
  for (const contract of campaign.contracts) {
    if (!contract.claimed && contract.key === key) contract.progress = Math.min(contract.target, contract.progress + amount);
  }
}

export function claimContract(state, contractId) {
  const campaign = ensureCampaign(state);
  const contract = campaign.contracts.find((entry) => entry.id === contractId);
  if (!contract) return { ok: false, message: "That Keeper Contract is no longer active." };
  if (contract.claimed) return { ok: false, message: "That contract has already been claimed." };
  if (contract.progress < contract.target) return { ok: false, message: "The contract is not complete yet." };
  for (const [resource, amount] of Object.entries(contract.reward)) state[resource] = (state[resource] || 0) + amount;
  contract.claimed = true;
  const rewardText = Object.entries(contract.reward).map(([resource, amount]) => `${amount} ${resource}`).join(" · ");
  let cycled = false;
  if (campaign.contracts.every((entry) => entry.claimed)) {
    campaign.completedSets += 1; campaign.renown += 1;
    campaign.contracts = createContractSet(state.seed + state.day + campaign.completedSets, campaign.renown);
    state.journal.unshift(`Keeper Renown reached ${campaign.renown}. Three new contracts arrived.`);
    cycled = true;
  }
  return { ok: true, cycled, message: cycled ? `Contract claimed: ${rewardText}. Renown increased and new contracts arrived.` : `Contract claimed: ${rewardText}.` };
}

export function heroStats(state, classId = state.selectedClass) {
  const cls = CLASSES[classId];
  const hero = state.heroes[classId];
  const equipped = Object.values(hero.equipment).filter(Boolean);
  const mastery = keeperTalentBonuses(state);
  const runeBonus = equipped.reduce((out, item) => { const bonus = itemRuneBonuses(item); out.attack += bonus.attack; out.armor += bonus.armor; out.vitality += bonus.vitality; return out; }, { attack: 0, armor: 0, vitality: 0 });
  const setBonus = equipmentSetBonuses(hero.equipment);
  return {
    maxHp: cls.hp + (hero.level - 1) * 9 + equipped.reduce((n, i) => n + i.armor * 2, 0) + mastery.maxHp + runeBonus.vitality + setBonus.maxHp,
    maxMana: cls.mana + (hero.level - 1) * 4 + mastery.maxMana + setBonus.maxMana,
    attack: cls.attack + (hero.level - 1) * 2 + equipped.reduce((n, i) => n + i.attack, 0) + mastery.attack + runeBonus.attack + setBonus.attack,
    armor: cls.armor + Math.floor((hero.level - 1) * 1.2) + equipped.reduce((n, i) => n + i.armor, 0) + mastery.armor + runeBonus.armor + setBonus.armor
  };
}

export function dungeonThreat(state) {
  const path = dungeonPath(state);
  const baseThreat = path.reduce((n, index) => {
    const id = state.dungeon.cells[index];
    const loadout = DUNGEON_PIECES[id].kind === "monster" ? monsterLoadout(state, index) : state.dungeon.monsterGear?.[index];
    const gear = Object.values(loadout?.equipment || {}).filter(Boolean);
    const gearThreat = Math.round(gear.reduce((sum, item) => sum + calculatePower(item), 0) / 6);
    const spell = SPELLS.find((entry) => entry.id === loadout?.spellId);
    const growthThreat = loadout?.speciesId ? loadout.level + Math.floor(loadout.ageDays / 10) : 0;
    const trapLevel = DUNGEON_PIECES[id].kind === "trap" ? state.dungeon.trapLevels?.[index] || 1 : 1;
    return n + DUNGEON_PIECES[id].threat * (1 + (trapLevel - 1) * .45) + gearThreat + (spell ? spell.level + 2 : 0) + (loadout?.potions || 0) * 2 + growthThreat;
  }, 18 + state.dungeon.rank * 8);
  return Math.round(baseThreat + trapSynergies(state).length * 5 + dungeonRoomBonuses(state).threat);
}

export function trapSynergies(state) {
  const path = dungeonPath(state);
  const synergies = [];
  for (let index = 1; index < path.length; index++) {
    const fromCell = path[index - 1], toCell = path[index];
    const from = state.dungeon.cells[fromCell], to = state.dungeon.cells[toCell];
    if (DUNGEON_PIECES[from]?.kind !== "trap" || DUNGEON_PIECES[to]?.kind !== "trap") continue;
    if (from === "spikes" && to === "bolts") synergies.push({ id: `pinned-${toCell}`, name: "Pinned Volley", description: "Spikes hold the target for a 25% stronger Bolt Gallery.", fromCell, toCell, damageMult: 1.25 });
    else if (from === "bolts" && to === "flame") synergies.push({ id: `kindling-${toCell}`, name: "Kindling Barrage", description: "Bolt sparks feed the Furnace Vent for 30% more damage.", fromCell, toCell, damageMult: 1.3 });
    else if (from === to) synergies.push({ id: `echo-${toCell}`, name: "Echo Chain", description: "Repeated mechanisms deal 18% more damage in the second chamber.", fromCell, toCell, damageMult: 1.18 });
  }
  return synergies;
}

function trapDamageForCell(state, cellIndex) {
  const piece = DUNGEON_PIECES[state.dungeon.cells[cellIndex]];
  if (piece?.kind !== "trap") return 0;
  const level = state.dungeon.trapLevels?.[cellIndex] || 1;
  const synergy = trapSynergies(state).find((entry) => entry.toCell === cellIndex);
  return Math.round(piece.damage * (1 + (level - 1) * .42) * (synergy?.damageMult || 1) * dungeonRoomBonuses(state, cellIndex).trapMult);
}

export function upgradeTrap(state, cellIndex) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before upgrading a trap." };
  const cell = Number(cellIndex), piece = DUNGEON_PIECES[state.dungeon.cells[cell]];
  if (!dungeonPath(state).includes(cell) || piece?.kind !== "trap") return { ok: false, message: "Choose a built trap on the active route." };
  const level = state.dungeon.trapLevels?.[cell] || 1;
  if (level >= 3) return { ok: false, message: `${piece.name} is already mastery level 3.` };
  if (state.dungeon.rank < level + 1) return { ok: false, message: `Heart rank ${level + 1} is required for trap mastery ${level + 1}.` };
  const goldCost = Math.round(piece.cost * (.9 + level * .55));
  if (state.gold < goldCost) return { ok: false, message: `Trap mastery ${level + 1} costs ${goldCost} gold.` };
  state.gold -= goldCost; state.dungeon.trapLevels[cell] = level + 1;
  state.journal.unshift(`${piece.name} in chamber ${dungeonPath(state).indexOf(cell) + 1} reached mastery ${level + 1}.`);
  return { ok: true, level: level + 1, message: `${piece.name} upgraded to mastery ${level + 1}.` };
}

export function expandDungeonLayout(state, layoutId) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before reshaping the Heartway." };
  const next = DUNGEON_LAYOUTS[layoutId], current = DUNGEON_LAYOUTS[state.dungeon.layoutId] || DUNGEON_LAYOUTS.spine;
  if (!next) return { ok: false, message: "Choose a known dungeon layout." };
  if (next.path.length <= current.path.length) return { ok: false, message: "The Heartway can expand, but established corridors cannot be collapsed." };
  if (state.dungeon.rank < next.rank) return { ok: false, message: `Heart rank ${next.rank} is required for ${next.name}.` };
  if (state.gold < next.goldCost || state.seals < next.sealCost) return { ok: false, message: `${next.name} costs ${next.goldCost} gold and ${next.sealCost} Dungeon Seals.` };
  state.gold -= next.goldCost; state.seals -= next.sealCost; state.dungeon.layoutId = layoutId;
  state.journal.unshift(`The dungeon expanded into ${next.name} with ${next.path.length} chambers.`);
  return { ok: true, message: `${next.name} opened ${next.path.length - current.path.length} new chambers.` };
}

export function dungeonRoomBonuses(state, cellIndex = null) {
  ensureDungeonArchitecture(state);
  const theme = DUNGEON_THEMES[state.dungeon.themeId] || DUNGEON_THEMES.heartland;
  const totals = { trapMult: theme.trapMult || 1, guardianAttack: 0, guardianArmor: theme.guardianArmor || 0, guardianHpMult: theme.guardianHpMult || 1, rewardMult: 1, threat: theme.threat || 0, roomCount: 0 };
  const rooms = cellIndex === null ? Object.entries(state.dungeon.rooms) : [[String(cellIndex), state.dungeon.rooms[cellIndex]]];
  for (const [, roomId] of rooms) {
    const room = DUNGEON_ROOMS[roomId]; if (!room) continue;
    totals.trapMult *= room.trapMult || 1; totals.guardianAttack += room.guardianAttack || 0; totals.guardianArmor += room.guardianArmor || 0;
    totals.guardianHpMult *= room.guardianHpMult || 1; totals.rewardMult *= room.rewardMult || 1; totals.threat += room.threat || 0; totals.roomCount += 1;
  }
  return totals;
}

export function setDungeonTheme(state, themeId) {
  ensureDungeonArchitecture(state);
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before restyling the dungeon." };
  const theme = DUNGEON_THEMES[themeId];
  if (!theme) return { ok: false, message: "Choose a known dungeon theme." };
  if (state.dungeon.rank < theme.rank) return { ok: false, message: `${theme.name} requires heart rank ${theme.rank}.` };
  if (!state.dungeon.unlockedThemes.includes(themeId)) {
    if (state.gold < theme.goldCost) return { ok: false, message: `${theme.name} costs ${theme.goldCost} gold to establish.` };
    state.gold -= theme.goldCost; state.dungeon.unlockedThemes.push(themeId);
  }
  state.dungeon.themeId = themeId;
  state.journal.unshift(`The Heartway took on the ${theme.name} theme.`);
  return { ok: true, message: `${theme.name} now shapes the dungeon.` };
}

export function buildDungeonRoom(state, cellIndex, roomId) {
  ensureDungeonArchitecture(state);
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before rebuilding a room." };
  const cell = Number(cellIndex), path = dungeonPath(state), position = path.indexOf(cell);
  if (position <= 0 || position >= path.length - 1) return { ok: false, message: "Choose an interior chamber on the active route." };
  const existingId = state.dungeon.rooms[cell];
  if (roomId === "none") {
    if (!existingId) return { ok: false, message: "That chamber is already an ordinary passage." };
    const refund = Math.floor(DUNGEON_ROOMS[existingId].goldCost * .4); delete state.dungeon.rooms[cell]; state.gold += refund;
    return { ok: true, refund, message: `${DUNGEON_ROOMS[existingId].name} dismantled for ${refund} gold.` };
  }
  const room = DUNGEON_ROOMS[roomId];
  if (!room) return { ok: false, message: "Choose a known room plan." };
  if (existingId === roomId) return { ok: false, message: `${room.name} is already built in that chamber.` };
  if (state.dungeon.rank < room.rank) return { ok: false, message: `${room.name} requires heart rank ${room.rank}.` };
  const old = DUNGEON_ROOMS[existingId], goldCost = Math.max(0, room.goldCost - Math.floor((old?.goldCost || 0) * .4)), sealCost = room.sealCost;
  if (state.gold < goldCost || state.seals < sealCost) return { ok: false, message: `${room.name} requires ${goldCost} gold and ${sealCost} seals.` };
  state.gold -= goldCost; state.seals -= sealCost; state.dungeon.rooms[cell] = roomId;
  ensureChronicle(state); pushUniqueKnown(state.chronicle.rooms, [roomId], DUNGEON_ROOMS);
  state.journal.unshift(`${room.name} was built in chamber ${position + 1}.`);
  return { ok: true, message: `${room.name} now modifies chamber ${position + 1}.` };
}

export function availableSpells(state, classId = state.selectedClass) {
  const cls = CLASSES[classId];
  const hero = state.heroes[classId];
  return SPELLS.filter((s) => cls.elements.includes(s.element) && s.level <= hero.level + 4);
}

export function placeDungeonPiece(state, index, pieceId) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before rebuilding this snapshot." };
  const path = dungeonPath(state);
  if (!path.includes(index) || index === path[0] || index === path[path.length - 1]) return { ok: false, message: "The entrance and dungeon heart cannot be replaced." };
  const oldId = state.dungeon.cells[index];
  const old = DUNGEON_PIECES[oldId];
  const next = DUNGEON_PIECES[pieceId];
  if (!next) return { ok: false, message: "Choose a valid dungeon piece." };
  if (next.kind === "monster") return { ok: false, message: "Living guardians must be hatched and stationed from the menagerie." };
  const delta = next.cost - old.cost;
  if (delta > state.gold) return { ok: false, message: "Not enough gold for that construction." };
  state.gold -= delta;
  if (old.kind === "monster" && next.kind !== "monster") {
    const loadout = state.dungeon.monsterGear?.[index];
    if (loadout) state.inventory.push(...Object.values(loadout.equipment || {}).filter(Boolean));
    delete state.dungeon.monsterGear?.[index];
    const creatureId = state.dungeon.monsterAssignments?.[index];
    const creature = state.creatures?.find((entry) => entry.id === creatureId);
    if (creature) { creature.assignment = "reserve"; creature.dungeonCell = null; }
    delete state.dungeon.monsterAssignments?.[index];
  }
  state.dungeon.cells[index] = pieceId;
  if (next.kind === "trap" && oldId !== pieceId) state.dungeon.trapLevels[index] = 1;
  else if (next.kind !== "trap") delete state.dungeon.trapLevels[index];
  state.dungeon.published = false;
  return { ok: true, message: `${next.name} installed.` };
}

export function equipItem(state, itemId) {
  const index = state.inventory.findIndex((i) => i.id === itemId);
  if (index < 0) return false;
  const item = state.inventory.splice(index, 1)[0];
  let slot = item.slot;
  const equipment = state.heroes[state.selectedClass].equipment;
  if (slot === "ring") slot = equipment.ring1 ? "ring2" : "ring1";
  if (equipment[slot]) state.inventory.push(equipment[slot]);
  equipment[slot] = item;
  return true;
}

export function unequipItem(state, slot) {
  const equipment = state.heroes[state.selectedClass].equipment;
  if (!equipment[slot]) return false;
  state.inventory.push(equipment[slot]);
  delete equipment[slot];
  return true;
}

export function carveRuneSocket(state, itemId) {
  const item = state.inventory.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: "Only items on the Forge rack can be carved." };
  normalizeRelicItem(item);
  if (item.runeSlots >= 2) return { ok: false, message: `${itemDisplayName(item)} already has two rune sockets.` };
  const costGold = 100 + item.runeSlots * 90, costEssence = 3 + item.runeSlots * 2;
  if (state.gold < costGold || state.essence < costEssence) return { ok: false, message: `Carving this socket costs ${costGold} gold and ${costEssence} essence.` };
  state.gold -= costGold; state.essence -= costEssence; item.runeSlots += 1;
  return { ok: true, message: `A ${item.runeSlots === 1 ? "first" : "second"} rune socket was carved into ${itemDisplayName(item)}.` };
}

export function socketRune(state, itemId, runeId) {
  const item = state.inventory.find((entry) => entry.id === itemId), rune = RUNE_TYPES[runeId];
  if (!item || !rune) return { ok: false, message: "Choose a Forge item and a known rune." };
  normalizeRelicItem(item); ensureRelicSets(state);
  if (item.runes.length >= item.runeSlots) return { ok: false, message: "Carve an empty socket before setting another rune." };
  if (item.runes.includes(runeId)) return { ok: false, message: "An item cannot hold the same rune twice." };
  if ((state.runes[runeId] || 0) < 1) return { ok: false, message: `No ${rune.name} remains in storage.` };
  state.runes[runeId] -= 1; item.runes.push(runeId);
  return { ok: true, message: `${rune.name} set into ${itemDisplayName(item)}.` };
}

export function unsocketRune(state, itemId, runeId) {
  const item = state.inventory.find((entry) => entry.id === itemId);
  if (!item || !item.runes?.includes(runeId)) return { ok: false, message: "That rune is not set into this item." };
  if (state.gold < 60) return { ok: false, message: "Safe rune removal costs 60 gold." };
  state.gold -= 60; item.runes.splice(item.runes.indexOf(runeId), 1); state.runes[runeId] = (state.runes[runeId] || 0) + 1;
  return { ok: true, message: `${RUNE_TYPES[runeId].name} returned to storage.` };
}

function equipmentSlotFor(item, equipment) {
  if (item.slot !== "ring") return item.slot;
  return equipment.ring1 ? "ring2" : "ring1";
}

function monsterLoadout(state, cellIndex, create = false) {
  if (!state.dungeon.monsterGear) state.dungeon.monsterGear = {};
  const creatureId = state.dungeon.monsterAssignments?.[cellIndex];
  const creature = state.creatures?.find((entry) => entry.id === creatureId);
  if (creature) return creature;
  if (create && !state.dungeon.monsterGear[cellIndex]) state.dungeon.monsterGear[cellIndex] = { equipment: {}, spellId: null, potions: 0 };
  return state.dungeon.monsterGear[cellIndex];
}

function creatureLoadoutLocked(state, creature) {
  if (creature.assignment === "dungeon" && state.dungeon.published) return "Resolve the open invasion before changing this guardian loadout.";
  if (creature.assignment === "expedition" && state.raid && !state.raid.complete) return "Finish or retreat from the active expedition before changing this companion loadout.";
  return "";
}

export function equipCreatureItem(state, itemId, creatureId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return { ok: false, message: "Choose a creature from the Menagerie." };
  const locked = creatureLoadoutLocked(state, creature);
  if (locked) return { ok: false, message: locked };
  const index = state.inventory.findIndex((item) => item.id === itemId);
  if (index < 0) return { ok: false, message: "That item is no longer in inventory." };
  const item = state.inventory.splice(index, 1)[0];
  const slot = equipmentSlotFor(item, creature.equipment);
  if (creature.equipment[slot]) state.inventory.push(creature.equipment[slot]);
  creature.equipment[slot] = item;
  return { ok: true, message: `${creature.name} equipped ${itemDisplayName(item)}.` };
}

export function unequipCreatureItem(state, creatureId, slot) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return { ok: false, message: "Choose a creature from the Menagerie." };
  const locked = creatureLoadoutLocked(state, creature);
  if (locked) return { ok: false, message: locked };
  const item = creature.equipment?.[slot];
  if (!item) return { ok: false, message: "That creature slot is already empty." };
  state.inventory.push(item); delete creature.equipment[slot];
  return { ok: true, message: `${itemDisplayName(item)} returned to inventory.` };
}

export function attuneCreatureSpell(state, creatureId, spellId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  const spell = SPELLS.find((entry) => entry.id === spellId);
  if (!creature || !spell) return { ok: false, message: "Choose a creature and a valid spell." };
  const locked = creatureLoadoutLocked(state, creature);
  if (locked) return { ok: false, message: locked };
  if (creature.spellId === spellId) return { ok: false, message: `${creature.name} already knows ${spell.name}.` };
  if (state.essence < 1) return { ok: false, message: "Attunement requires 1 essence." };
  state.essence -= 1; creature.spellId = spellId;
  return { ok: true, message: `${creature.name} attuned ${spell.name}.` };
}

export function assignCreaturePotion(state, creatureId) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return { ok: false, message: "Choose a creature from the Menagerie." };
  const locked = creatureLoadoutLocked(state, creature);
  if (locked) return { ok: false, message: locked };
  if (creature.potions >= 3) return { ok: false, message: `${creature.name} already carries three potion charges.` };
  if (state.potions < 1) return { ok: false, message: "There are no potions left in storage." };
  state.potions -= 1; creature.potions += 1;
  return { ok: true, message: `${creature.name} received a one-use potion.` };
}

export function equipMonsterItem(state, itemId, cellIndex) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before changing a guardian loadout." };
  const piece = DUNGEON_PIECES[state.dungeon.cells[cellIndex]];
  if (!piece || piece.kind !== "monster") return { ok: false, message: "Choose a chamber containing a monster." };
  const assignedCreature = state.creatures?.find((entry) => entry.id === state.dungeon.monsterAssignments?.[cellIndex]);
  if (assignedCreature) return equipCreatureItem(state, itemId, assignedCreature.id);
  const index = state.inventory.findIndex((item) => item.id === itemId);
  if (index < 0) return { ok: false, message: "That item is no longer in inventory." };
  const item = state.inventory.splice(index, 1)[0];
  const loadout = monsterLoadout(state, cellIndex, true);
  const slot = equipmentSlotFor(item, loadout.equipment);
  if (loadout.equipment[slot]) state.inventory.push(loadout.equipment[slot]);
  loadout.equipment[slot] = item;
  return { ok: true, message: `${piece.name} equipped ${itemDisplayName(item)}.` };
}

export function unequipMonsterItem(state, cellIndex, slot) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before changing a guardian loadout." };
  const assignedCreature = state.creatures?.find((entry) => entry.id === state.dungeon.monsterAssignments?.[cellIndex]);
  if (assignedCreature) return unequipCreatureItem(state, assignedCreature.id, slot);
  const loadout = monsterLoadout(state, cellIndex);
  const item = loadout?.equipment?.[slot];
  if (!item) return { ok: false, message: "That guardian slot is already empty." };
  state.inventory.push(item);
  delete loadout.equipment[slot];
  return { ok: true, message: `${itemDisplayName(item)} returned to inventory.` };
}

export function attuneMonsterSpell(state, cellIndex, spellId) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before changing a guardian loadout." };
  const piece = DUNGEON_PIECES[state.dungeon.cells[cellIndex]];
  const spell = SPELLS.find((entry) => entry.id === spellId);
  if (!piece || piece.kind !== "monster" || !spell) return { ok: false, message: "Choose a guardian and a valid spell." };
  const assignedCreature = state.creatures?.find((entry) => entry.id === state.dungeon.monsterAssignments?.[cellIndex]);
  if (assignedCreature) return attuneCreatureSpell(state, assignedCreature.id, spellId);
  if (state.essence < 1) return { ok: false, message: "Attunement requires 1 essence." };
  const loadout = monsterLoadout(state, cellIndex, true);
  if (loadout.spellId === spellId) return { ok: false, message: `${piece.name} already knows ${spell.name}.` };
  state.essence -= 1;
  loadout.spellId = spellId;
  return { ok: true, message: `${piece.name} attuned ${spell.name}.` };
}

export function assignMonsterPotion(state, cellIndex) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before changing a guardian loadout." };
  const piece = DUNGEON_PIECES[state.dungeon.cells[cellIndex]];
  if (!piece || piece.kind !== "monster") return { ok: false, message: "Choose a chamber containing a monster." };
  const assignedCreature = state.creatures?.find((entry) => entry.id === state.dungeon.monsterAssignments?.[cellIndex]);
  if (assignedCreature) return assignCreaturePotion(state, assignedCreature.id);
  const loadout = monsterLoadout(state, cellIndex, true);
  if (loadout.potions >= 3) return { ok: false, message: "This guardian already carries three potion charges." };
  if (state.potions < 1) return { ok: false, message: "There are no potions left in storage." };
  state.potions -= 1; loadout.potions += 1;
  return { ok: true, message: `${piece.name} received a one-use potion.` };
}

export function monsterStats(state, cellIndex) {
  const piece = DUNGEON_PIECES[state.dungeon.cells[cellIndex]];
  const loadout = monsterLoadout(state, cellIndex);
  const creatureId = state.dungeon.monsterAssignments?.[cellIndex];
  const creature = state.creatures?.find((entry) => entry.id === creatureId);
  const grown = creature ? creatureStats(state, creature) : { maxHp: piece.hp, attack: piece.attack, armor: piece.armor };
  const equipped = creature ? [] : Object.values(loadout?.equipment || {}).filter(Boolean);
  const spell = SPELLS.find((entry) => entry.id === loadout?.spellId) || null;
  const room = dungeonRoomBonuses(state, cellIndex);
  return {
    hp: Math.round((grown.maxHp + equipped.reduce((n, item) => n + item.armor * 2, 0)) * room.guardianHpMult),
    attack: grown.attack + equipped.reduce((n, item) => n + item.attack, 0) + (spell?.power > 0 ? Math.round(spell.power * .16) : 0) + room.guardianAttack,
    armor: grown.armor + equipped.reduce((n, item) => n + item.armor, 0) + room.guardianArmor,
    spell, potions: loadout?.potions || 0, equipment: loadout?.equipment || {}, creature
  };
}

export function dismantleItem(state, itemId) {
  const index = state.inventory.findIndex((i) => i.id === itemId);
  if (index < 0) return null;
  if (state.inventory[index].favorite) return { ok: false, message: "Favorite items are protected. Unfavorite this relic before dismantling it." };
  const item = state.inventory.splice(index, 1)[0];
  ensureRelicSets(state);
  for (const runeId of item.runes || []) state.runes[runeId] = (state.runes[runeId] || 0) + 1;
  const amount = 1 + item.rarityIndex + Math.floor(item.level / 8);
  const tier = Math.min(4, item.qualityIndex);
  if (!state.materials[item.family]) state.materials[item.family] = [0,0,0,0,0];
  state.materials[item.family][tier] += amount;
  const essence = item.rarityIndex >= 2 ? item.rarityIndex - 1 : 0;
  state.essence += essence;
  progressContracts(state, "dismantle", 1);
  return { ok: true, item, family: item.family, tier, amount, essence };
}

export function toggleItemFavorite(state, itemId) {
  const item = state.inventory.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: "Only items on the inventory rack can be favorited." };
  item.favorite = !item.favorite;
  return { ok: true, favorite: item.favorite, message: item.favorite ? `${itemDisplayName(item)} is now protected.` : `${itemDisplayName(item)} is no longer protected.` };
}

export function inventoryView(state, overrides = {}) {
  const filters = { ...(state.lootFilters || {}), ...overrides };
  const search = String(filters.search || "").trim().toLowerCase();
  const items = (state.inventory || []).filter((item) => {
    if (filters.favoritesOnly && !item.favorite) return false;
    if (filters.slot && filters.slot !== "all" && item.slot !== filters.slot) return false;
    if (filters.rarity && filters.rarity !== "all" && item.rarity !== filters.rarity) return false;
    return !search || `${itemDisplayName(item)} ${item.slot} ${item.rarity} ${item.quality} ${(item.prefixes || []).join(" ")}`.toLowerCase().includes(search);
  });
  const sorters = {
    power: (a,b) => calculatePower(b) - calculatePower(a),
    level: (a,b) => b.level - a.level || calculatePower(b) - calculatePower(a),
    value: (a,b) => b.value - a.value,
    name: (a,b) => itemDisplayName(a).localeCompare(itemDisplayName(b))
  };
  return items.sort((a,b) => Number(b.favorite) - Number(a.favorite) || (sorters[filters.sort] || sorters.power)(a,b));
}

export function itemComparison(state, item) {
  if (!item) return { equipped: null, attack: 0, armor: 0, power: 0 };
  const equipment = state.heroes[state.selectedClass].equipment;
  const candidates = item.slot === "ring" ? [equipment.ring1, equipment.ring2].filter(Boolean) : [equipment[item.slot]].filter(Boolean);
  const equipped = candidates.sort((a,b) => calculatePower(a) - calculatePower(b))[0] || null;
  const itemRunes = itemRuneBonuses(item), equippedRunes = equipped ? itemRuneBonuses(equipped) : { attack: 0, armor: 0 };
  return {
    equipped,
    attack: item.attack + itemRunes.attack - ((equipped?.attack || 0) + equippedRunes.attack), armor: item.armor + itemRunes.armor - ((equipped?.armor || 0) + equippedRunes.armor),
    power: Math.round(calculatePower(item) - (equipped ? calculatePower(equipped) : 0))
  };
}

export function lootCodexProgress(state) {
  const codex = recordLootDiscovery(state);
  return {
    affixes: { found: codex.affixes.length, total: PREFIXES.length },
    traits: { found: codex.traits.length, total: TRAITS.length },
    rarities: { found: codex.rarities.length, total: RARITIES.length },
    totalFound: codex.affixes.length + codex.traits.length + codex.rarities.length,
    total: PREFIXES.length + TRAITS.length + RARITIES.length
  };
}

export function craftItem(state, slot, qualityIndex = 0, rng = Math.random) {
  const family = CRAFT_RECIPES[slot];
  const tier = Math.max(0, Math.min(4, Number(qualityIndex) || 0));
  if (!family) return { ok: false, message: "Choose a valid equipment pattern." };
  const materialCost = 3;
  const goldCost = 30 + tier * 35;
  if ((state.materials[family]?.[tier] || 0) < materialCost) return { ok: false, message: `Crafting requires ${materialCost} ${QUALITIES[tier].toLowerCase()} ${family}.` };
  if (state.gold < goldCost) return { ok: false, message: `Crafting requires ${goldCost} gold.` };
  state.materials[family][tier] -= materialCost; state.gold -= goldCost;
  const averageLevel = state.heroes[state.selectedClass].level;
  const item = generateItem(Math.max(1, Math.round(averageLevel + tier * 3)), rng, slot);
  item.family = family; item.qualityIndex = tier; item.quality = QUALITIES[tier];
  const qualityScale = 1 + tier * .12;
  item.attack = Math.round(item.attack * qualityScale); item.armor = Math.round(item.armor * qualityScale);
  item.stability = Math.min(100, item.stability + tier * 3); item.name = `${QUALITIES[tier]}-Forged ${item.name}`;
  state.inventory.push(item); state.selectedInventoryId = item.id;
  recordLootDiscovery(state, [item]);
  return { ok: true, item, message: `${itemDisplayName(item)} assembled from salvaged ${family}.` };
}

export const TINKER_ACTIONS = {
  sharpen: { name: "Sharpen", prefix: "Keen", metal: 2, essence: 0, stability: 9, apply: (i) => { i.attack += 4 + Math.ceil(i.level / 4); i.armor = Math.max(0, i.armor - 1); } },
  reinforce: { name: "Reinforce", prefix: "Bulwark", metal: 2, essence: 0, stability: 8, apply: (i) => { i.armor += 4 + Math.ceil(i.level / 5); i.attack = Math.max(0, i.attack - 1); } },
  rebalance: { name: "Rebalance", prefix: "Weightless", metal: 1, essence: 1, stability: 7, apply: (i) => { i.attack += 2; i.armor += 2; } },
  infuse: { name: "Infuse", prefix: "Ember-Infused", metal: 0, essence: 4, stability: 14, apply: (i) => { i.attack += 6; i.trait = i.trait || "Critical hits leave a burning tile"; } },
  corrupt: { name: "Corrupt", prefix: "Ruinous", metal: 0, essence: 6, stability: 22, apply: (i) => { i.attack += 10; i.armor = Math.max(0, i.armor - 3); i.drawback = "Wielder begins each raid slightly wounded"; } },
  purify: { name: "Purify", prefix: "Hallowed", metal: 1, essence: 4, stability: 10, requiresDrawback: true, apply: (i) => { delete i.drawback; i.armor += 3; } },
  imprint: { name: "Imprint", prefix: "Runescribed", metal: 0, essence: 5, stability: 17, apply: (i,rng) => { i.trait = TRAITS[Math.floor(rng() * TRAITS.length)]; } },
  overcharge: { name: "Overcharge", prefix: "Voltaic", metal: 2, essence: 8, stability: 28, apply: (i) => { i.attack += 12; i.armor += 4; i.drawback = "Overcharged: loses 8 health when its trait activates"; } }
};

export function tinkerItem(state, itemId, actionId, rng = Math.random) {
  const item = state.inventory.find((i) => i.id === itemId);
  const action = TINKER_ACTIONS[actionId];
  if (!item || !action) return { ok: false, message: "Select a valid item and operation." };
  if (action.requiresDrawback && !item.drawback) return { ok: false, message: "Purification requires an item with a drawback." };
  if (item.mods.length >= item.potential) return { ok: false, message: "This item's potential is exhausted." };
  const metal = state.materials.metal?.[0] || 0;
  if (metal < action.metal || state.essence < action.essence) return { ok: false, message: "You lack the required crude metal or essence." };
  state.materials.metal[0] -= action.metal; state.essence -= action.essence;
  const failure = rng() * 100 > item.stability;
  item.stability = Math.max(0, item.stability - action.stability);
  item.mods.push(actionId);
  if (failure) {
    item.attack = Math.max(0, item.attack - 2); item.armor = Math.max(0, item.armor - 2);
    item.name = `Unstable ${item.name}`;
    item.drawback = item.drawback || "Unstable: occasionally loses its next action";
    progressContracts(state, "tinker", 1);
    return { ok: true, failed: true, message: `${item.baseName} destabilized, but survived the operation.` };
  }
  action.apply(item, rng);
  item.name = `${action.prefix} ${item.name}`;
  item.value += 24 + action.essence * 8;
  recordLootDiscovery(state, [item]);
  progressContracts(state, "tinker", 1);
  return { ok: true, failed: false, message: `${action.name} succeeded. The item is now ${item.name}.` };
}

export function raidMemberName(state, member) {
  if (member.kind === "creature") return member.name;
  return CLASSES[member.classId].name;
}

export function raidMemberStats(state, member) {
  const stats = member.kind === "creature" ? creatureStats(state, member.creatureId) : heroStats(state, member.classId);
  return doctrineAdjustedStats(state, stats);
}

export function expeditionPreview(state, regionId = state.expedition?.regionId, difficultyId = state.expedition?.difficultyId) {
  const region = RIVAL_REGIONS[regionId] || RIVAL_REGIONS.miredeep;
  const difficulty = EXPEDITION_DIFFICULTIES[difficultyId] || EXPEDITION_DIFFICULTIES.scout;
  const heroLevel = state.heroes[state.selectedClass].level;
  const renown = state.campaign?.renown || 1;
  const companions = state.creatures.filter((entry) => entry.assignment === "expedition").slice(0, 3);
  const stats = [heroStats(state), ...companions.map((entry) => creatureStats(state, entry))].map((entry) => doctrineAdjustedStats(state, entry));
  const squadPower = stats.reduce((sum, entry) => sum + entry.attack + entry.armor + Math.round(entry.maxHp / 12), 0);
  const recommendedPower = 34 + (region.unlockRenown - 1) * 14 + difficulty.levelOffset * 20;
  const locked = renown < region.unlockRenown || heroLevel < difficulty.unlockLevel;
  const risk = locked ? "Locked" : squadPower >= recommendedPower * 1.18 ? "Favored" : squadPower >= recommendedPower * .88 ? "Matched" : "Dangerous";
  return { regionId, difficultyId, region, difficulty, heroLevel, renown, squadPower, recommendedPower, locked, risk, rewardMult: difficulty.rewardMult };
}

export function configureExpedition(state, regionId, difficultyId) {
  const preview = expeditionPreview(state, regionId, difficultyId);
  if (preview.locked) {
    const reason = preview.renown < preview.region.unlockRenown ? `Renown ${preview.region.unlockRenown}` : `Keeper level ${preview.difficulty.unlockLevel}`;
    return { ok: false, message: `${preview.region.name} on ${preview.difficulty.name} requires ${reason}.`, preview };
  }
  state.expedition.regionId = regionId; state.expedition.difficultyId = difficultyId;
  ensureChronicle(state); pushUniqueKnown(state.chronicle.regions, [regionId], RIVAL_REGIONS);
  return { ok: true, message: `${preview.region.name} · ${preview.difficulty.name} selected.`, preview };
}

export function createRaid(state, seed = Date.now(), options = {}) {
  const rng = seededRandom(seed);
  ensureExpedition(state);
  const doctrine = expeditionDoctrine(state);
  const regionId = options.regionId || state.expedition.regionId;
  const difficultyId = options.difficultyId || state.expedition.difficultyId;
  const preview = expeditionPreview(state, regionId, difficultyId);
  const region = preview.locked ? RIVAL_REGIONS.miredeep : preview.region;
  const difficulty = preview.locked ? EXPEDITION_DIFFICULTIES.scout : preview.difficulty;
  state.expedition.regionId = preview.locked ? "miredeep" : regionId; state.expedition.difficultyId = preview.locked ? "scout" : difficultyId;
  const order = doctrine.creatureOrder;
  const companions = state.creatures.filter((entry) => entry.assignment === "expedition").slice(0, 3).sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
  const levels = [state.heroes[state.selectedClass].level, ...companions.map((entry) => entry.level)];
  const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
  const level = Math.max(1, Math.round(averageLevel + Math.floor(rng() * 3) - 1 + difficulty.levelOffset));
  const encounters = [];
  const pieceIds = region.pool.filter((id) => DUNGEON_PIECES[id]?.threat <= 12 + level * 5);
  const encounterCount = difficulty.routeLength;
  for (let i = 0; i < encounterCount; i++) {
    const id = i === encounterCount - 1 ? region.bossId : (pieceIds.length ? pieceIds[Math.floor(rng() * pieceIds.length)] : "slime");
    const isMonster = DUNGEON_PIECES[id]?.kind === "monster";
    const elite = isMonster && (i === encounterCount - 1 ? difficultyId === "nightmare" : rng() < difficulty.eliteChance);
    encounters.push({ id, cleared: false, elite, sovereignId: i === encounterCount - 1 ? region.sovereignId : null });
  }
  const modifierIds = Object.keys(EXPEDITION_MODIFIERS), worldCondition = currentWorldCondition(state);
  const worldActive = worldCondition.regionId === state.expedition.regionId;
  const modifierId = worldActive ? worldCondition.modifierId : modifierIds[Math.floor(rng() * modifierIds.length)];
  const heroStatsNow = heroStats(state, state.selectedClass);
  const heroMember = { kind: "hero", classId: state.selectedClass, hp: heroStatsNow.maxHp, mana: heroStatsNow.maxMana, maxHp: heroStatsNow.maxHp, maxMana: heroStatsNow.maxMana, guarding: false, cooldowns: {} };
  const party = [];
  for (const creature of companions) {
    const stats = creatureStats(state, creature);
    const spell = SPELLS.find((entry) => entry.id === creature.spellId);
    const maxMana = spell ? Math.max(spell.mana * 2, 24 + creature.level * 3) : 0;
    party.push({ kind: "creature", creatureId: creature.id, speciesId: creature.speciesId, name: creature.name, hp: stats.maxHp, mana: maxMana, maxHp: stats.maxHp, maxMana, spellId: spell?.id || null, guarding: false, cooldowns: {} });
  }
  const keeperIndex = doctrine.keeperPosition === "front" ? 0 : doctrine.keeperPosition === "rear" ? party.length : Math.min(1, party.length);
  party.splice(keeperIndex, 0, heroMember);
  state.raid = {
    seed, name: region.name, keeper: region.keeper, regionId: state.expedition.regionId, difficultyId: state.expedition.difficultyId, modifierId,
    rewardMult: difficulty.rewardMult * (worldActive ? worldCondition.rewardMult : 1), worldConditionId: worldActive ? worldCondition.id : null,
    level, position: -1, encounters, party, activeHeroIndex: 0, actedThisRound: [], momentum: keeperTalentBonuses(state).startingMomentum,
    doctrine: JSON.parse(JSON.stringify(doctrine)),
    enemy: null, log: [`${EXPEDITION_STANCES[doctrine.stance].name} doctrine set: Keeper ${doctrine.keeperPosition}, ${SPELL_POLICIES[doctrine.spellPolicy].name.toLowerCase()}, ${POTION_POLICIES[doctrine.potionPolicy].name.toLowerCase()} potions.`, `The keeper and ${companions.length} bonded creature${companions.length===1?"":"s"} cross the rival gate. Combat will resolve automatically.`], complete: false, won: false, autoPaused: false
  };
  return state.raid;
}

export function advanceRaid(state, rng = Math.random) {
  const raid = state.raid;
  if (!raid || raid.complete || raid.enemy) return { ok: false };
  raid.position += 1;
  if (raid.position >= raid.encounters.length) return resolveRaidVictory(state, rng);
  const encounter = raid.encounters[raid.position];
  const piece = DUNGEON_PIECES[encounter.id];
  const modifier = EXPEDITION_MODIFIERS[raid.modifierId] || {};
  if (piece.kind === "trap") {
    let total = 0;
    for (const member of raid.party.filter((m) => m.hp > 0)) {
      const stats = raidMemberStats(state, member);
      const damage = Math.max(2, Math.round(piece.damage * (modifier.trapMult || 1) * (1 + raid.level * .06) - stats.armor * .25));
      member.hp -= damage; total += damage;
    }
    raid.log.unshift(`${piece.name} tears through the formation for ${total} total damage.`);
    encounter.cleared = true;
    if (!raid.party.some((m) => m.hp > 0)) return resolveRaidDefeat(state, `${piece.name} claimed the entire expedition.`);
    return { ok: true, kind: "trap", damage: total };
  }
  if (piece.kind === "monster") {
    const sovereign = REGIONAL_SOVEREIGNS[encounter.sovereignId];
    const eliteHp = encounter.elite ? 1.36 : 1;
    const eliteAttack = encounter.elite ? 1.2 : 1;
    const maxHp = Math.round(piece.hp * (1 + raid.level * .1) * eliteHp * (modifier.enemyHpMult || 1) * (sovereign?.hpMult || 1));
    raid.enemy = {
      id: encounter.id, elite: Boolean(encounter.elite), boss: Boolean(sovereign), sovereignId: encounter.sovereignId || null, phaseIndex: 0,
      name: sovereign?.name || (encounter.elite ? `Elite ${piece.name}` : piece.name), title: sovereign?.title || "",
      hp: maxHp, maxHp,
      attack: Math.round(piece.attack * (1 + raid.level * .07) * eliteAttack * (modifier.enemyAttackMult || 1) * (sovereign?.attackMult || 1)),
      armor: piece.armor + Math.floor(raid.level / 3) + (encounter.elite ? 2 : 0) + (modifier.enemyArmor || 0) + (sovereign?.armorBonus || 0), status: {}, intent: null
    };
    rollEnemyIntent(raid, rng);
    raid.log.unshift(sovereign ? `${sovereign.name}, ${sovereign.title}, rises in phase I: ${sovereign.phases[0].name}. ${sovereign.phases[0].description}` : `${raid.enemy.name} blocks the path.`);
    return { ok: true, kind: sovereign ? "sovereign" : "monster", sovereignId: encounter.sovereignId || null };
  }
  encounter.cleared = true;
  raid.log.unshift("The chamber is eerily empty.");
  return { ok: true, kind: "empty" };
}

const ENEMY_INTENTS = [
  { id: "strike", label: "Rending Strike", glyph: "⚔", multiplier: 1, description: "A measured attack against the marked hero." },
  { id: "crush", label: "Crushing Blow", glyph: "◆", multiplier: 1.38, description: "A slow, punishing hit. Guarding is especially valuable." },
  { id: "siphon", label: "Siphon Life", glyph: "◉", multiplier: .78, description: "A lighter hit that restores the guardian's health." },
  { id: "fortify", label: "Fortify", glyph: "⬡", multiplier: .62, description: "A guarded attack that raises a ward against the next hit." }
];

export const SIGNATURE_INTENTS = {
  mimic: { id: "ambush", label: "False Treasure", glyph: "✧", multiplier: 1.24, momentumDrain: 2, description: "A sudden bite that devours two points of party momentum." },
  wraith: { id: "phase", label: "Veil Rend", glyph: "◌", multiplier: 1.02, armorFactor: 0, description: "A spectral cut that ignores the target's armor." },
  golem: { id: "quake", label: "Runic Quake", glyph: "✹", multiplier: .58, aoe: true, description: "A seismic pulse damages every living expedition member." }
};

function rollEnemyIntent(raid, rng = Math.random) {
  if (!raid.enemy) return null;
  const living = raid.party.map((member, index) => ({ member, index })).filter(({ member }) => member.hp > 0);
  const signature = SIGNATURE_INTENTS[raid.enemy.id];
  const sovereign = REGIONAL_SOVEREIGNS[raid.enemy.sovereignId];
  const sovereignIntent = sovereign ? SOVEREIGN_INTENTS[sovereign.intentId] : null;
  const base = sovereignIntent && rng() < .6 ? sovereignIntent : signature && rng() < .45 ? signature : ENEMY_INTENTS[Math.floor(rng() * ENEMY_INTENTS.length)];
  const weights = living.map(({ index }) => Math.max(1, raid.party.length - index));
  let targetRoll = rng() * weights.reduce((sum, weight) => sum + weight, 0), target = living[0];
  for (let index = 0; index < living.length; index += 1) { targetRoll -= weights[index]; if (targetRoll <= 0) { target = living[index]; break; } }
  raid.enemy.intent = { ...base, targetIndex: target?.index ?? 0 };
  return raid.enemy.intent;
}

function damageEnemy(raid, amount) {
  let damage = Math.max(1, Math.round(amount));
  if (raid.enemy.status.ward) {
    damage = Math.max(1, Math.ceil(damage * (1 - raid.enemy.status.ward)));
    raid.enemy.status.ward = 0;
  }
  raid.enemy.hp -= damage;
  return damage;
}

export function advanceSovereignPhase(state) {
  const raid = state?.raid, enemy = raid?.enemy, sovereign = REGIONAL_SOVEREIGNS[enemy?.sovereignId];
  if (!enemy || !sovereign || enemy.hp <= 0) return null;
  const nextIndex = (enemy.phaseIndex || 0) + 1, phase = sovereign.phases[nextIndex];
  if (!phase || enemy.hp / enemy.maxHp > phase.threshold) return null;
  enemy.phaseIndex = nextIndex;
  enemy.attack += phase.attack || 0;
  enemy.armor += phase.armor || 0;
  if (phase.regenPct) enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.ceil(enemy.maxHp * phase.regenPct));
  if (phase.ward) enemy.status.ward = Math.max(enemy.status.ward || 0, phase.ward);
  if (phase.momentumDrain) raid.momentum = Math.max(0, (raid.momentum || 0) - phase.momentumDrain);
  let partyDamage = 0;
  if (phase.partyDamagePct) for (const member of raid.party.filter((entry) => entry.hp > 0)) {
    const damage = Math.max(1, Math.ceil(member.maxHp * phase.partyDamagePct));
    member.hp = Math.max(1, member.hp - damage); partyDamage += damage;
  }
  raid.log.unshift(`${sovereign.name} enters phase ${nextIndex + 1}: ${phase.name}. ${phase.description}${partyDamage ? ` The transition deals ${partyDamage} total damage.` : ""}`);
  return { sovereignId: enemy.sovereignId, phaseIndex: nextIndex, phase, partyDamage };
}

function enemyTurn(state, rng) {
  const raid = state.raid, enemy = raid.enemy;
  if (!enemy || enemy.hp <= 0) return null;
  const living = raid.party.filter((m) => m.hp > 0);
  const intent = enemy.intent || rollEnemyIntent(raid, rng);
  const marked = raid.party[intent.targetIndex];
  const target = marked?.hp > 0 ? marked : living[Math.floor(rng() * living.length)];
  const targetIndex = raid.party.indexOf(target);
  const damageMember = (member) => {
    const stats = raidMemberStats(state, member);
    let amount = Math.max(1, Math.round(enemy.attack * intent.multiplier * (1.05 + rng() * .35) - stats.armor * (intent.armorFactor ?? .42)));
    if (member.guarding) amount = Math.ceil(amount * .45);
    if (enemy.status.weaken) amount = Math.ceil(amount * .68);
    member.hp -= amount; return amount;
  };
  let damage = 0;
  if (intent.aoe) for (const member of living) damage += damageMember(member);
  else damage = damageMember(target);
  let healed = 0;
  if (intent.id === "siphon") { healed = Math.min(Math.ceil(damage * .55), enemy.maxHp - enemy.hp); enemy.hp += healed; }
  if (intent.id === "fortify") enemy.status.ward = .38;
  enemy.status.weaken = false;
  raid.momentum = Math.max(0, (raid.momentum || 0) - (intent.momentumDrain || 1));
  raid.party.forEach((m) => m.guarding = false);
  raid.log.unshift(intent.aoe ? `${enemy.name} uses ${intent.label} across the formation for ${damage} total damage.` : `${enemy.name} uses ${intent.label} on ${raidMemberName(state, target)} for ${damage} damage${healed ? ` and restores ${healed} health` : ""}.`);
  if (!raid.party.some((m) => m.hp > 0)) resolveRaidDefeat(state, `${enemy.name} defeated the entire party.`);
  else rollEnemyIntent(raid, rng);
  return { targetIndex, damage, healed, intent: intent.id };
}

function finishEnemy(state) {
  const raid = state.raid;
  const eliteBonus = raid.enemy?.elite ? 8 : 0;
  raid.log.unshift(`${raid.enemy.name} falls. The room yields no loot—the heart holds everything.`);
  raid.encounters[raid.position].cleared = true;
  raid.enemy = null;
  raid.actedThisRound = [];
  for (const member of raid.party) {
    if (member.kind === "creature") addCreatureXp(state, member.creatureId, 8 + raid.level * 2 + eliteBonus);
    else addHeroXp(state, member.classId, 8 + raid.level * 2 + eliteBonus);
  }
}

function activeMember(raid) {
  return raid.party[raid.activeHeroIndex];
}

function advancePartyTurn(state, rng) {
  const raid = state.raid;
  raid.actedThisRound ||= [];
  const living = raid.party.map((member, index) => ({ member, index })).filter(({ member }) => member.hp > 0);
  const ready = living.filter(({ index }) => !raid.actedThisRound.includes(index));
  if (ready.length) {
    const next = ready.find(({ index }) => index > raid.activeHeroIndex) || ready[0];
    raid.activeHeroIndex = next.index;
    return null;
  }
  const response = enemyTurn(state, rng);
  raid.actedThisRound = [];
  const survivors = raid.party.map((member, index) => ({ member, index })).filter(({ member }) => member.hp > 0);
  if (survivors.length) raid.activeHeroIndex = survivors[0].index;
  return response;
}

export function selectRaidHero(state, index) {
  const raid = state.raid;
  const member = raid?.party?.[index];
  if (!raid || raid.complete || !raid.enemy) return { ok: false, message: "There is no active battle." };
  if (!member || member.hp <= 0) return { ok: false, message: "That hero has fallen." };
  raid.actedThisRound ||= [];
  if (raid.actedThisRound.includes(index)) return { ok: false, message: "That hero has already acted this round." };
  raid.activeHeroIndex = index;
  return { ok: true, message: `${raidMemberName(state, member)} is ready.` };
}

export function raidAction(state, action, payload = null, rng = Math.random) {
  const raid = state.raid;
  if (!raid || raid.complete || !raid.enemy) return { ok: false, message: "There is no enemy to fight." };
  const actor = activeMember(raid);
  if (!actor || actor.hp <= 0) return { ok: false, message: "That hero cannot act." };
  const stats = raidMemberStats(state, actor);
  const actorLabel = raidMemberName(state, actor);
  raid.actedThisRound ||= [];
  raid.momentum ||= 0;
  const actorIndex = raid.activeHeroIndex;
  const fx = { action, actorIndex, damage: 0, healed: 0, critical: false, enemy: null };
  Object.keys(actor.cooldowns).forEach((key) => actor.cooldowns[key] = Math.max(0, actor.cooldowns[key] - 1));
  if (action === "attack") {
    const roll = rng();
    fx.critical = roll > .91;
    let damage = stats.attack * (.82 + roll * .35) * (1 + Math.min(5, raid.momentum) * .04) - raid.enemy.armor * .5;
    if (fx.critical) damage *= 1.65;
    damage = damageEnemy(raid, damage); fx.damage = damage;
    raid.momentum = Math.min(6, raid.momentum + 1);
    raid.log.unshift(`${actorLabel} ${fx.critical ? "lands a critical strike" : "strikes"} for ${damage} damage.`);
  } else if (action === "guard") {
    actor.guarding = true; raid.momentum = Math.min(6, raid.momentum + 2); raid.log.unshift(`${actorLabel} braces and builds expedition momentum.`);
  } else if (action === "potion") {
    const creature = actor.kind === "creature" ? state.creatures.find((entry) => entry.id === actor.creatureId) : null;
    const availablePotions = creature ? creature.potions : state.potions;
    if (availablePotions <= 0) return { ok: false, message: "No potions remain." };
    if (actor.hp >= actor.maxHp) return { ok: false, message: "This hero is already at full health." };
    if (creature) creature.potions -= 1; else state.potions -= 1;
    const healed = Math.min(38, actor.maxHp - actor.hp); actor.hp += healed; fx.healed = healed;
    raid.log.unshift(`${actorLabel} drinks a one-use potion and recovers ${healed} health.`);
  } else if (action === "spell") {
    const spell = SPELLS.find((s) => s.id === payload);
    const spellAllowed = actor.kind === "hero"
      ? availableSpells(state, actor.classId).some((entry) => entry.id === spell?.id)
      : actor.spellId === spell?.id;
    if (!spell || !spellAllowed) return { ok: false, message: "That expedition member cannot cast this spell." };
    if (actor.mana < spell.mana) return { ok: false, message: "Not enough mana." };
    if (actor.cooldowns[spell.id] > 0) return { ok: false, message: `That spell is cooling down for ${actor.cooldowns[spell.id]} more turns.` };
    actor.mana -= spell.mana; actor.cooldowns[spell.id] = spell.cooldown;
    fx.element = spell.element;
    if (spell.power < 0) {
      const target = raid.party.filter((m) => m.hp > 0).sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
      const casterLevel = actor.kind === "hero" ? state.heroes[actor.classId].level : state.creatures.find((entry) => entry.id === actor.creatureId)?.level || 1;
      const masteryPower = actor.kind === "hero" ? keeperTalentBonuses(state).spellPower : 0;
      const healed = Math.min(-spell.power + casterLevel * 2 + masteryPower, target.maxHp - target.hp); target.hp += healed; fx.healed = healed;
      raid.log.unshift(`${spell.name} restores ${healed} health to ${raidMemberName(state, target)}.`);
    } else {
      const casterLevel = actor.kind === "hero" ? state.heroes[actor.classId].level : state.creatures.find((entry) => entry.id === actor.creatureId)?.level || 1;
      const masteryPower = actor.kind === "hero" ? keeperTalentBonuses(state).spellPower : 0;
      let damage = spell.power + casterLevel * 2 + masteryPower + Math.floor(rng() * 5);
      if (spell.effect !== "pure") damage = Math.max(1, damage - Math.floor(raid.enemy.armor * .25));
      if (spell.effect === "execute" && raid.enemy.hp < raid.enemy.maxHp / 2) damage = Math.round(damage * 1.5);
      damage = damageEnemy(raid, damage * (1 + Math.min(5, raid.momentum) * .04)); fx.damage = damage;
      if (["weaken", "stagger", "blind"].includes(spell.effect)) raid.enemy.status.weaken = true;
      if (spell.effect === "drain") actor.hp = Math.min(actor.maxHp, actor.hp + Math.ceil(damage * .3));
      raid.log.unshift(`${actorLabel}'s ${spell.name} deals ${damage} ${spell.element.toLowerCase()} damage.`);
    }
    raid.momentum = Math.min(6, raid.momentum + 1);
  }
  if (fx.damage && raid.enemy?.hp > 0) fx.phase = advanceSovereignPhase(state);
  raid.actedThisRound.push(actorIndex);
  if (raid.enemy && raid.enemy.hp <= 0) { finishEnemy(state); return { ok: true, killed: true, fx }; }
  fx.enemy = advancePartyTurn(state, rng);
  return { ok: true, killed: false, fx };
}

export function autoRaidStep(state, rng = Math.random) {
  const raid = state.raid;
  if (!raid || raid.complete || raid.autoPaused) return { ok: false, paused: Boolean(raid?.autoPaused), message: "The automatic expedition is not running." };
  if (!raid.enemy) {
    const result = advanceRaid(state, rng);
    return { ...result, fx: result.kind ? { action: result.kind, kind: result.kind, damage: result.damage || 0 } : null };
  }
  const actor = activeMember(raid);
  if (!actor || actor.hp <= 0) { advancePartyTurn(state, rng); return { ok: true, skipped: true }; }
  const doctrine = raid.doctrine || expeditionDoctrine(state);
  const potionThreshold = (POTION_POLICIES[doctrine.potionPolicy] || POTION_POLICIES.standard).threshold;
  const spellPolicy = SPELL_POLICIES[doctrine.spellPolicy] || SPELL_POLICIES.balanced;
  const targeted = raid.enemy.intent?.targetIndex === raid.activeHeroIndex;
  let action = "attack", payload = null;
  if (actor.kind === "hero") {
    if (actor.hp / actor.maxHp < potionThreshold && state.potions > 0) action = "potion";
    else if (doctrine.stance === "bulwark" && targeted && raid.enemy.intent?.id === "crush") action = "guard";
    else {
      const spells = availableSpells(state, actor.classId).filter((spell) => actor.mana >= spell.mana && !(actor.cooldowns[spell.id] > 0));
      const injured = raid.party.some((member) => member.hp > 0 && member.hp / member.maxHp < Math.max(.48, potionThreshold));
      const healing = spells.find((spell) => spell.power < 0);
      const damaging = spells.filter((spell) => spell.power > 0).sort((a,b) => b.power - a.power)[0];
      const preserveWindow = raid.enemy.elite || raid.enemy.hp / raid.enemy.maxHp < .4;
      const chosen = injured && healing ? healing : (doctrine.spellPolicy !== "preserve" || preserveWindow) && rng() > 1 - spellPolicy.castChance ? damaging : null;
      if (chosen) { action = "spell"; payload = chosen.id; }
    }
  } else {
    const creature = state.creatures.find((entry) => entry.id === actor.creatureId);
    const spell = SPELLS.find((entry) => entry.id === actor.spellId);
    if (actor.hp / actor.maxHp < Math.max(.16, potionThreshold - .06) && (creature?.potions || 0) > 0) action = "potion";
    else if (doctrine.stance === "bulwark" && targeted && ["crush", "strike"].includes(raid.enemy.intent?.id)) action = "guard";
    else if (spell && actor.mana >= spell.mana && !(actor.cooldowns[spell.id] > 0) && (doctrine.spellPolicy !== "preserve" || raid.enemy.elite || raid.enemy.hp / raid.enemy.maxHp < .4) && rng() > 1 - spellPolicy.castChance) { action = "spell"; payload = spell.id; }
    else if (raid.enemy.intent?.id === "crush" && targeted && doctrine.stance !== "assault") action = "guard";
  }
  const result = raidAction(state, action, payload, rng);
  return { ...result, automatic: true };
}

function advanceWorldDay(state) {
  state.day += 1;
  for (const creature of state.creatures) { creature.ageDays += 1; normalizeCreature(creature); }
  for (const egg of [...state.eggs]) {
    egg.progress += 1;
    if (egg.progress >= egg.hatchDays) hatchEggInternal(state, egg);
  }
  ensureLivingAtlas(state);
}

function resolveRaidVictory(state, rng) {
  const raid = state.raid; raid.complete = true; raid.won = true;
  const modifier = EXPEDITION_MODIFIERS[raid.modifierId] || {};
  const difficulty = EXPEDITION_DIFFICULTIES[raid.difficultyId] || EXPEDITION_DIFFICULTIES.scout;
  const rewardMult = (raid.rewardMult || 1) * (modifier.goldMult || 1);
  const gold = Math.round((90 + raid.level * 34 + Math.floor(rng() * 45)) * rewardMult);
  const seals = 1 + Math.floor(raid.level / 4) + (raid.difficultyId === "nightmare" ? 1 : 0);
  const lootLevelBonus = (modifier.lootLevelBonus || 0) + keeperTalentBonuses(state).lootLevel;
  const endgameLootBonus = progressionBand(state.heroes[state.selectedClass].level).lootBonus;
  const lootCount = 3 + (modifier.extraLoot || 0) + (raid.difficultyId === "nightmare" ? 1 : 0);
  const loot = Array.from({ length: lootCount }, (_, index) => generateItem(raid.level + 1 + lootLevelBonus + endgameLootBonus + (index % 2), rng));
  const region = RIVAL_REGIONS[raid.regionId] || RIVAL_REGIONS.miredeep;
  const sovereign = REGIONAL_SOVEREIGNS[region.sovereignId];
  let sovereignItem = null;
  if (sovereign) {
    const set = ITEM_SETS[sovereign.rewardSetId], forcedSlot = set.slots[Math.floor(rng() * set.slots.length)];
    sovereignItem = generateItem(raid.level + 3 + lootLevelBonus + endgameLootBonus, rng, forcedSlot);
    if (sovereignItem.rarityIndex < 2) {
      const rarity = RARITIES[2];
      sovereignItem.rarityIndex = 2; sovereignItem.rarity = rarity.name; sovereignItem.color = rarity.color; sovereignItem.runeSlots = Math.max(1, sovereignItem.runeSlots); sovereignItem.value = Math.round(sovereignItem.value * 1.35);
    }
    sovereignItem.setId = sovereign.rewardSetId;
    sovereignItem.customName = `${sovereign.name}'s Tribute`;
    loot.push(sovereignItem);
  }
  const atlas = ensureLivingAtlas(state);
  if (atlas.bounty.regionId === raid.regionId && !atlas.bounty.claimed) atlas.bounty.progress = Math.min(atlas.bounty.target, atlas.bounty.progress + 1);
  state.gold += gold; state.seals += seals; state.inventory.push(...loot); state.potions += rng() > .45 ? 1 : 0;
  recordLootDiscovery(state, loot);
  for (const member of raid.party) {
    if (member.kind === "creature") {
      addCreatureXp(state, member.creatureId, 35 + raid.level * 7);
      addCreatureBond(state, member.creatureId, (member.hp > 0 ? 7 : 3) + (modifier.bondBonus || 0));
      if (member.hp > 0) recordCreatureMemory(state, member.creatureId, "heartbreaker");
    }
    else addHeroXp(state, member.classId, 35 + raid.level * 7);
  }
  const speciesIds = region.pool.filter((id) => CREATURE_SPECIES[id]);
  const eggSpecies = speciesIds.length ? speciesIds[Math.floor(rng() * speciesIds.length)] : Object.keys(CREATURE_SPECIES)[Math.floor(rng() * Object.keys(CREATURE_SPECIES).length)];
  const qualityChance = raid.difficultyId === "nightmare" ? .65 : raid.difficultyId === "delve" ? .3 : .1;
  const egg = makeEgg(eggSpecies, rng() < qualityChance ? 1 : 0, rng); state.eggs.push(egg);
  ensureRelicSets(state);
  const runeIds = Object.keys(RUNE_TYPES), runeId = runeIds[Math.floor(rng() * runeIds.length)];
  state.runes[runeId] += 1;
  const campaign = ensureCampaign(state), firstSovereignDefeat = sovereign && !campaign.sovereignsDefeated.includes(region.sovereignId);
  if (sovereign) {
    if (firstSovereignDefeat) campaign.sovereignsDefeated.push(region.sovereignId);
    campaign.sovereignVictories[region.sovereignId] += 1;
    ensureCampaign(state);
  }
  raid.rewards = { gold, seals, loot, egg, runeId, sovereignItem, sovereignId: region.sovereignId };
  raid.log.unshift(`The ${difficulty.name.toLowerCase()} heart breaks under ${EXPEDITION_MODIFIERS[raid.modifierId].name}. The hoard yields ${gold} gold, ${seals} seals, ${loot.length} items, a ${CREATURE_SPECIES[egg.speciesId].name} egg, and a ${RUNE_TYPES[runeId].name}.`);
  state.journal.unshift(firstSovereignDefeat ? `${sovereign.name} fell for the first time. ${ITEM_SETS[sovereign.rewardSetId].name} entered the Keeper's codex.` : `Conquered ${raid.name}, ruled by ${raid.keeper}.`);
  progressContracts(state, "raidVictory", 1);
  advanceWorldDay(state);
  return { ok: true, victory: true };
}

function resolveRaidDefeat(state, reason) {
  const raid = state.raid; raid.complete = true; raid.won = false;
  for (const member of raid.party) if (member.kind === "creature") addCreatureBond(state, member.creatureId, 2);
  raid.log.unshift(reason); state.journal.unshift(`The expedition into ${raid.name} ended in defeat.`);
  advanceWorldDay(state);
  return { ok: true, defeat: true };
}

export function retreatRaid(state) {
  if (!state.raid || state.raid.complete) return false;
  state.raid.complete = true; state.raid.won = false; state.raid.log.unshift("You retreat. The rival hoard remains sealed.");
  for (const member of state.raid.party) if (member.kind === "creature") addCreatureBond(state, member.creatureId, 1);
  advanceWorldDay(state);
  return true;
}

function addCreatureXp(state, creatureId, amount) {
  const creature = state.creatures.find((entry) => entry.id === creatureId);
  if (!creature) return;
  creature.xp += amount;
  let needed = creature.level * 55;
  while (creature.xp >= needed) {
    creature.xp -= needed; creature.level += 1;
    state.journal.unshift(`${creature.name} reached level ${creature.level} and grew stronger.`);
    progressContracts(state, "creatureLevel", 1);
    needed = creature.level * 55;
  }
  normalizeCreature(creature);
}

export function heroXpToNext(level) {
  const value = Math.max(1, Math.min(999, Number(level) || 1));
  return Math.round(85 + Math.pow(value, 1.32) * 22);
}

export function progressionBand(level) {
  const value = Math.max(1, Number(level) || 1);
  if (value >= 100) return { name: "Eternal", color: "#ffbd59", lootBonus: 5 };
  if (value >= 50) return { name: "Mythic", color: "#c281ff", lootBonus: 3 };
  if (value >= 25) return { name: "Master", color: "#6aa7ff", lootBonus: 2 };
  if (value >= 10) return { name: "Veteran", color: "#71d69b", lootBonus: 1 };
  return { name: "Initiate", color: "#aab0b6", lootBonus: 0 };
}

function addHeroXp(state, classId, amount) {
  const hero = state.heroes[classId];
  hero.xp += amount;
  let needed = heroXpToNext(hero.level);
  while (hero.xp >= needed && hero.level < 999) {
    hero.xp -= needed; hero.level += 1; state.gold += 60; state.potions += 1;
    state.journal.unshift(`${CLASSES[classId].name} reached level ${hero.level}.`);
    needed = heroXpToNext(hero.level);
  }
  if (hero.level >= 999) hero.xp = Math.min(hero.xp, heroXpToNext(999));
}

export function publishDungeon(state) {
  if (state.dungeon.published) return { ok: false, message: "This dungeon snapshot is already open." };
  if (state.dungeon.levelBand > state.dungeon.rank) return { ok: false, message: `Heart rank ${state.dungeon.levelBand} is required for that challenger band.` };
  const hoard = Math.max(50, Math.min(Number(state.dungeon.hoard) || 50, 5000));
  if (state.gold < hoard) return { ok: false, message: "You cannot fund that Boss Hoard." };
  state.gold -= hoard; state.dungeon.hoard = hoard; state.dungeon.published = true;
  state.journal.unshift(`Opened the gates with a ${hoard} gold Boss Hoard.`);
  return { ok: true, message: "The dungeon snapshot is open to challengers." };
}

export function upgradeDungeon(state) {
  if (state.dungeon.published) return { ok: false, message: "Resolve the open invasion before upgrading the heart." };
  const rank = state.dungeon.rank || 1;
  if (rank >= 5) return { ok: false, message: "The dungeon heart is already rank 5." };
  const goldCost = 250 + rank * 200, sealCost = rank;
  if (state.gold < goldCost || state.seals < sealCost) return { ok: false, message: `Heart rank ${rank + 1} requires ${goldCost} gold and ${sealCost} Dungeon Seals.` };
  state.gold -= goldCost; state.seals -= sealCost; state.dungeon.rank = rank + 1;
  state.journal.unshift(`The dungeon heart reached rank ${state.dungeon.rank}. Challenger band ${state.dungeon.rank} is now unlocked.`);
  return { ok: true, message: `Dungeon heart upgraded to rank ${state.dungeon.rank}.` };
}

export function simulateDefense(state, seed = Date.now()) {
  if (!state.dungeon.published) return { ok: false, message: "Publish the dungeon before inviting a challenger." };
  const rng = seededRandom(seed);
  const threat = dungeonThreat(state);
  const band = state.dungeon.levelBand;
  const heroName = ["Aldren", "Mira", "Voss", "Juniper", "Brother Hale", "Cassia"][Math.floor(rng() * 6)];
  let heroHp = 78 + band * 27 + Math.floor(rng() * 35), kills = 0;
  const startHp = heroHp;
  const events = [];
  let trapDamageTotal = 0, guardianDamageTotal = 0;
  for (const cellIndex of dungeonPath(state)) {
    const cellId = state.dungeon.cells[cellIndex];
    const piece = DUNGEON_PIECES[cellId];
    if (piece.kind === "trap") {
      const level = state.dungeon.trapLevels?.[cellIndex] || 1;
      const d = Math.max(2, Math.round(trapDamageForCell(state, cellIndex) * (.72 + rng() * .5))); heroHp -= d; trapDamageTotal += d;
      events.push(`${piece.name} M${level} dealt ${d}.`);
    } else if (piece.kind === "monster") {
      const stats = monsterStats(state, cellIndex);
      if (stats.creature) addCreatureXp(state, stats.creature.id, 5 + band * 2);
      let monsterPower = stats.hp * .25 + stats.attack * 1.3 + stats.armor * 2;
      if (stats.spell) {
        const spellDamage = stats.spell.power > 0 ? Math.max(1, Math.round(stats.spell.power * .24 + band)) : 0;
        if (spellDamage) { heroHp -= spellDamage; guardianDamageTotal += spellDamage; events.push(`${piece.name} cast ${stats.spell.name} for ${spellDamage}.`); }
        else monsterPower += Math.abs(stats.spell.power) * .35;
      }
      const loadout = monsterLoadout(state, cellIndex);
      if (loadout?.potions > 0) { loadout.potions -= 1; monsterPower += 18; events.push(`${piece.name} consumed a garrison potion.`); }
      const heroPower = 24 + band * 11 + rng() * 24;
      if (monsterPower * (.75 + rng() * .55) > heroPower) {
        const d = Math.round(stats.attack * (1.1 + rng())); heroHp -= d; guardianDamageTotal += d; events.push(`${piece.name} dealt ${d}.`);
      } else { kills += 1; events.push(`${piece.name} was defeated.`); }
    }
    if (heroHp <= 0) break;
  }
  const bossDamage = Math.round(threat * (.2 + rng() * .12)); heroHp -= bossDamage;
  const defended = heroHp <= 0;
  let reward = 0;
  if (defended) {
    reward = Math.round((state.dungeon.hoard + 45 + band * 24 + threat * .18) * dungeonRoomBonuses(state).rewardMult);
    state.gold += reward; state.seals += 1 + Math.floor(band / 2); state.dungeon.victories += 1;
  } else state.dungeon.defeats += 1;
  const report = {
    id: uid("report"), day: state.day, heroName, heroLevel: band * 3, startHp, remainingHp: Math.max(0, heroHp),
    kills, defended, reward, lost: defended ? 0 : state.dungeon.hoard, threat, layoutId: state.dungeon.layoutId,
    trapDamage: trapDamageTotal, guardianDamage: guardianDamageTotal, synergyCount: trapSynergies(state).length, roomCount: dungeonRoomBonuses(state).roomCount, themeId: state.dungeon.themeId, events: events.slice(-5)
  };
  state.reports.unshift(report); state.reports = state.reports.slice(0, 12); state.dungeon.published = false;
  for (const creature of state.creatures.filter((entry) => entry.assignment === "dungeon")) { addCreatureBond(state, creature.id, defended ? 4 : 2); if (defended) recordCreatureMemory(state, creature.id, "sentinel"); }
  if (defended) progressContracts(state, "defenseVictory", 1);
  state.journal.unshift(defended ? `${heroName} fell. The dungeon earned ${reward} gold.` : `${heroName} broke the heart and claimed ${state.dungeon.hoard} gold.`);
  advanceWorldDay(state);
  return { ok: true, report };
}

export function simulateDefenseWave(state, seed = Date.now(), waveSize = 3) {
  if (!state.dungeon.published) return { ok: false, message: "Publish the dungeon before inviting a defense wave." };
  const count = Math.max(1, Math.min(5, Number(waveSize) || 3));
  const reports = [], startingGold = state.gold, hoard = state.dungeon.hoard;
  for (let index = 0; index < count; index++) {
    const result = simulateDefense(state, Number(seed) + index * 101);
    if (!result.ok) break;
    result.report.waveIndex = index + 1; result.report.waveSize = count; reports.push(result.report);
    if (!result.report.defended) break;
    if (index < count - 1) {
      state.gold -= hoard;
      state.dungeon.published = true;
    }
  }
  state.dungeon.published = false;
  const defendedAll = reports.length === count && reports.every((report) => report.defended);
  state.journal.unshift(defendedAll ? `The dungeon survived all ${count} challengers in a defense wave.` : `The defense wave ended after ${reports.length} challenger${reports.length===1?"":"s"}.`);
  return { ok: true, reports, defendedAll, netGold: state.gold - startingGold };
}

export function defenseAnalytics(state) {
  const reports = state.reports || [];
  const wins = reports.filter((report) => report.defended);
  const total = reports.length;
  return {
    total,
    winRate: total ? Math.round(wins.length / total * 100) : 0,
    averageKills: total ? Number((reports.reduce((sum, report) => sum + report.kills, 0) / total).toFixed(1)) : 0,
    trapDamage: reports.reduce((sum, report) => sum + (report.trapDamage || 0), 0),
    guardianDamage: reports.reduce((sum, report) => sum + (report.guardianDamage || 0), 0),
    goldEarned: wins.reduce((sum, report) => sum + report.reward, 0),
    bestThreat: reports.reduce((best, report) => Math.max(best, report.threat || 0), 0)
  };
}

export function calculatePower(item) {
  const runes = itemRuneBonuses(item);
  return (item.attack + runes.attack) * 1.2 + item.armor + runes.armor + runes.vitality * .25 + item.rarityIndex * 4 + (item.trait ? 8 : 0) + (item.setId ? 3 : 0) - (item.drawback ? 3 : 0);
}

export function validateState(state) {
  const errors = [];
  if (state.version !== VERSION) errors.push("Save version mismatch");
  if (!CLASSES[state.selectedClass] || !state.heroes?.[state.selectedClass] || state.party?.length !== 1) errors.push("Invalid keeper hero");
  if (!Array.isArray(state.creatures) || !Array.isArray(state.eggs)) errors.push("Creature roster missing");
  if (state.creatures?.some((creature) => !CREATURE_TRAITS[creature.traitId] || creature.bond < 0 || creature.bond > 100 || (creature.awakeningId && !CREATURE_AWAKENINGS[creature.awakeningId]) || (creature.lineageId && CREATURE_LINEAGES[creature.lineageId]?.speciesId !== creature.speciesId) || !Number.isInteger(creature.lineageRank) || creature.lineageRank < 0 || creature.lineageRank > 3 || !Array.isArray(creature.memories) || creature.memories.some((id) => !CREATURE_MEMORIES[id]))) errors.push("Creature growth data invalid");
  if (!Array.isArray(state.inventory)) errors.push("Inventory missing");
  if (!state.lootCodex || !Array.isArray(state.lootCodex.affixes) || !Array.isArray(state.lootCodex.traits) || !Array.isArray(state.lootCodex.rarities)) errors.push("Loot codex missing");
  if (!state.runes || Object.keys(RUNE_TYPES).some((id) => !Number.isInteger(state.runes[id]) || state.runes[id] < 0) || !Array.isArray(state.setCodex) || state.setCodex.some((id) => !ITEM_SETS[id]) || ownedItems(state).some((item) => !Number.isInteger(item.runeSlots) || item.runeSlots < 0 || item.runeSlots > 2 || !Array.isArray(item.runes) || item.runes.length > item.runeSlots || item.runes.some((id) => !RUNE_TYPES[id]) || (item.setId && !ITEM_SETS[item.setId]))) errors.push("Relic set or rune data invalid");
  if (!state.lootFilters || typeof state.lootFilters.search !== "string") errors.push("Loot filters missing");
  if (!state.settings || typeof state.settings.soundEnabled !== "boolean" || state.settings.soundVolume < 0 || state.settings.soundVolume > 1 || typeof state.settings.combatShake !== "boolean" || typeof state.settings.reducedMotion !== "boolean" || typeof state.settings.highContrast !== "boolean" || !["low", "balanced", "high"].includes(state.settings.sceneQuality) || !["fast", "standard", "cinematic"].includes(state.settings.battlePace) || !["2d", "3d"].includes(state.settings.presentationMode) || !["comfortable", "large"].includes(state.settings.textSize)) errors.push("Presentation settings invalid");
  if (!state.onboarding || typeof state.onboarding.complete !== "boolean" || !Number.isInteger(state.onboarding.step) || state.onboarding.step < 0 || state.onboarding.step > 3) errors.push("Onboarding state invalid");
  if (!state.keeperMastery || !state.keeperMastery.ranks || Object.entries(state.keeperMastery.ranks).some(([talentId, rank]) => !KEEPER_TALENTS[talentId] || !Number.isInteger(rank) || rank < 0 || rank > KEEPER_TALENTS[talentId].maxRank) || keeperTalentBudget(state).spent > keeperTalentBudget(state).earned) errors.push("Keeper mastery invalid");
  if (ownedItems(state).some((item) => typeof item.favorite !== "boolean" || !Number.isInteger(item.ascension) || item.ascension < 0)) errors.push("Loot endgame data invalid");
  if (!state.campaign || !Array.isArray(state.campaign.contracts) || state.campaign.contracts.length !== 3 || !Array.isArray(state.campaign.sovereignsDefeated) || state.campaign.sovereignsDefeated.some((id) => !REGIONAL_SOVEREIGNS[id]) || !state.campaign.sovereignVictories || Object.keys(REGIONAL_SOVEREIGNS).some((id) => !Number.isInteger(state.campaign.sovereignVictories[id]) || state.campaign.sovereignVictories[id] < 0) || !state.campaign.livingHeart || typeof state.campaign.livingHeart.awakened !== "boolean" || typeof state.campaign.livingHeart.claimed !== "boolean" || state.campaign.livingHeart.claimed && !state.campaign.livingHeart.awakened) errors.push("Keeper campaign progress missing");
  const atlas = state.campaign?.atlas;
  if (!atlas || !Number.isInteger(atlas.cycle) || !WORLD_CONDITIONS[atlas.conditionId] || !atlas.bounty || !RIVAL_REGIONS[atlas.bounty.regionId] || !Number.isInteger(atlas.bounty.progress) || atlas.bounty.progress < 0 || atlas.bounty.progress > atlas.bounty.target || typeof atlas.bounty.claimed !== "boolean") errors.push("Living Atlas progress invalid");
  const chronicle = state.chronicle;
  if (!chronicle || !Array.isArray(chronicle.species) || chronicle.species.some((id) => !CREATURE_SPECIES[id]) || !Array.isArray(chronicle.regions) || chronicle.regions.some((id) => !RIVAL_REGIONS[id]) || !Array.isArray(chronicle.sovereigns) || chronicle.sovereigns.some((id) => !REGIONAL_SOVEREIGNS[id]) || !Array.isArray(chronicle.sets) || chronicle.sets.some((id) => !ITEM_SETS[id]) || !Array.isArray(chronicle.rooms) || chronicle.rooms.some((id) => !DUNGEON_ROOMS[id]) || !Array.isArray(chronicle.claimed) || chronicle.claimed.some((id) => !CHRONICLE_ACHIEVEMENTS[id])) errors.push("Chronicle progress invalid");
  if (!RIVAL_REGIONS[state.expedition?.regionId] || !EXPEDITION_DIFFICULTIES[state.expedition?.difficultyId]) errors.push("Expedition atlas selection invalid");
  if (!state.expedition?.doctrine || !EXPEDITION_STANCES[state.expedition.doctrine.stance] || !POTION_POLICIES[state.expedition.doctrine.potionPolicy] || !SPELL_POLICIES[state.expedition.doctrine.spellPolicy] || !KEEPER_POSITIONS[state.expedition.doctrine.keeperPosition] || !Array.isArray(state.expedition.doctrine.creatureOrder)) errors.push("Expedition doctrine invalid");
  if (state.dungeon?.cells?.length !== 25) errors.push("Dungeon must contain 25 cells");
  if (!DUNGEON_LAYOUTS[state.dungeon?.layoutId]) errors.push("Dungeon layout invalid");
  if (!state.dungeon?.trapLevels || typeof state.dungeon.trapLevels !== "object") errors.push("Trap mastery missing");
  if (Object.entries(state.dungeon?.trapLevels || {}).some(([cell, level]) => !dungeonPath(state).includes(Number(cell)) || !Number.isInteger(level) || level < 1 || level > 3)) errors.push("Trap mastery invalid");
  if (!state.dungeon?.monsterGear || typeof state.dungeon.monsterGear !== "object") errors.push("Guardian loadouts missing");
  if (!state.dungeon?.monsterAssignments || typeof state.dungeon.monsterAssignments !== "object") errors.push("Guardian assignments missing");
  if (!DUNGEON_THEMES[state.dungeon?.themeId] || !Array.isArray(state.dungeon?.unlockedThemes) || state.dungeon.unlockedThemes.some((id) => !DUNGEON_THEMES[id]) || !state.dungeon?.rooms || Object.entries(state.dungeon.rooms).some(([cell, roomId]) => !DUNGEON_ROOMS[roomId] || !dungeonPath(state).includes(Number(cell)))) errors.push("Dungeon architecture invalid");
  if (!Number.isInteger(state.dungeon?.rank) || state.dungeon.rank < 1 || state.dungeon.rank > 5) errors.push("Dungeon rank invalid");
  if (state.gold < 0 || state.seals < 0 || state.essence < 0) errors.push("Resources cannot be negative");
  if (SPELLS.length < 20 || SPELLS.length > 50) errors.push("Spell count outside requested range");
  return errors;
}

export function exportSaveData(state) {
  const errors = validateState(state);
  if (errors.length) return { ok: false, message: `This profile cannot be exported: ${errors.join("; ")}`, errors };
  return { ok: true, filename: `keeperfall-keeper-day-${state.day}.json`, data: JSON.stringify({ format: SAVE_FORMAT, version: VERSION, state }, null, 2) };
}

export function importSaveData(payload) {
  try {
    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    if (!parsed || typeof parsed !== "object") return { ok: false, message: "The selected file does not contain a Keeperfall profile." };
    if (parsed.format && parsed.format !== SAVE_FORMAT) return { ok: false, message: "The selected file uses an unknown save format." };
    const source = parsed.format === SAVE_FORMAT ? parsed.state : parsed;
    const restored = migrateState(JSON.parse(JSON.stringify(source)));
    const errors = validateState(restored);
    if (errors.length) return { ok: false, message: `The selected profile failed validation: ${errors.join("; ")}`, errors };
    return { ok: true, state: restored, message: `Keeper day ${restored.day} restored safely.` };
  } catch (_) {
    return { ok: false, message: "The selected file is not valid Keeperfall JSON." };
  }
}

export function simulateCampaignDays(source, days = 30, seed = 90909) {
  const state = migrateState(JSON.parse(JSON.stringify(source)));
  const requestedDays = Math.max(1, Math.min(365, Math.floor(Number(days) || 30)));
  const startDay = state.day, targetDay = startDay + requestedDays;
  const startGold = state.gold, startInventory = state.inventory.length;
  const rng = seededRandom(seed);
  let victories = 0, defeats = 0, stalledRuns = 0, runs = 0, steps = 0;
  state.raid = null;
  while (state.day < targetDay) {
    createRaid(state, Math.floor(rng() * 2147483647));
    let safety = 0;
    while (!state.raid.complete && safety++ < 600) { autoRaidStep(state, rng); steps += 1; }
    if (!state.raid.complete) { retreatRaid(state); stalledRuns += 1; }
    if (state.raid.won) victories += 1; else defeats += 1;
    state.raid = null; runs += 1;
  }
  const errors = validateState(state);
  return {
    ok: errors.length === 0 && stalledRuns === 0,
    requestedDays,
    elapsedDays: state.day - startDay,
    runs, victories, defeats, stalledRuns, steps,
    goldDelta: state.gold - startGold,
    lootDelta: state.inventory.length - startInventory,
    heroLevel: state.heroes[state.selectedClass].level,
    creatureLevels: state.creatures.map((creature) => creature.level),
    errors
  };
}

export function releaseReadiness(state) {
  const gates = [
    { id: "profile", name: "Validated profile", description: "Current save schema and resources pass every invariant.", passed: validateState(state).length === 0 },
    { id: "keeper", name: "One-Keeper rule", description: "Exactly one persistent hero leads every expedition.", passed: state.party?.length === 1 && Object.keys(state.heroes || {}).length === 1 },
    { id: "content", name: "Content matrix", description: "Spells, species, regions, Sovereigns, sets, and rooms meet the v2 target.", passed: SPELLS.length === 32 && Object.keys(CREATURE_SPECIES).length === 8 && Object.keys(RIVAL_REGIONS).length === 5 && Object.keys(REGIONAL_SOVEREIGNS).length === 5 && Object.keys(ITEM_SETS).length === 5 && Object.keys(DUNGEON_ROOMS).length === 4 },
    { id: "construction", name: "Dungeon construction", description: "All three permanent route sizes resolve across the 25-cell visual grid.", passed: state.dungeon?.cells?.length === 25 && Object.keys(DUNGEON_LAYOUTS).length === 3 && Object.values(DUNGEON_LAYOUTS).every((layout) => layout.path.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < 25)) },
    { id: "automation", name: "Automatic expedition", description: "Doctrine, party limits, and simulated rivals are available without action clicking.", passed: Boolean(state.expedition?.doctrine) && state.creatures.filter((entry) => entry.assignment === "expedition").length <= 3 },
    { id: "accessibility", name: "Presentation controls", description: "Large text, reduced motion, contrast, sound, pace, and 2D/isometric choices persist.", passed: Boolean(state.settings) && ["comfortable", "large"].includes(state.settings.textSize) && typeof state.settings.reducedMotion === "boolean" && typeof state.settings.highContrast === "boolean" && ["2d", "3d"].includes(state.settings.presentationMode) },
    { id: "archive", name: "Persistent Chronicle", description: "All permanent discovery categories and claim history are valid.", passed: Boolean(state.chronicle) && Object.keys(chronicleProgress(state).categories).length === 5 }
    ,{ id: "finale", name: "Living Heart finale", description: "The five-Sovereign completion covenant and one-time reward are present.", passed: Boolean(state.campaign?.livingHeart) && typeof campaignCompletion(state).ready === "boolean" }
  ];
  return { ready: gates.every((gate) => gate.passed), passed: gates.filter((gate) => gate.passed).length, total: gates.length, gates };
}

export function runReleaseAudit(source, days = 365, seed = 200020) {
  const readiness = releaseReadiness(source);
  const exported = exportSaveData(source);
  const restored = exported.ok ? importSaveData(exported.data) : { ok: false };
  const soak = simulateCampaignDays(source, days, seed);
  const roundTrip = exported.ok && restored.ok && validateState(restored.state).length === 0;
  return { ok: readiness.ready && roundTrip && soak.ok, readiness, roundTrip, soak };
}
