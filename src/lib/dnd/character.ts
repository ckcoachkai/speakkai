export const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
export type Ability = typeof abilities[number];
export const skillAbilities: Record<string, Ability> = { Acrobatics:'DEX', 'Animal Handling':'WIS', Arcana:'INT', Athletics:'STR', Deception:'CHA', History:'INT', Insight:'WIS', Intimidation:'CHA', Investigation:'INT', Medicine:'WIS', Nature:'INT', Perception:'WIS', Performance:'CHA', Persuasion:'CHA', Religion:'INT', 'Sleight of Hand':'DEX', Stealth:'DEX', Survival:'WIS' };
export type Equipment = { id:string; name:string; quantity:number; weight:number; notes:string };
export type Spell = { id:string; name:string; level:number; casting:string; range:string; duration:string; description:string; prepared:boolean; concentration:boolean };
export type Character = {
  schemaVersion:1; name:string; player:string; race:string; characterClass:string; level:number; background:string; alignment:string;
  xp:number; hp:number; maxHp:number; tempHp:number; ac:number; speed:number; inspiration:boolean;
  scores:Record<Ability,number>; proficientSkills:string[]; proficientSaves:Ability[];
  deathSuccesses:number; deathFailures:number; hitDice:number; gold:number;
  equipment:Equipment[]; spells:Spell[]; slotsUsed:number[];
  resources:{id:string; name:string; remaining:number; max:number; description:string; recharge:string}[];
  traits:string; ideals:string; bonds:string; flaws:string; languages:string; proficiencies:string; notes:string;
  custom:{id:string; label:string; value:string}[];
};
export const seed:Character = {
  "schemaVersion": 1,
  "name": "Bob",
  "player": "Kai",
  "race": "Dragonborn",
  "characterClass": "Paladin",
  "level": 2,
  "background": "Noble",
  "alignment": "Chaotic Neutral",
  "xp": 0,
  "hp": 13,
  "maxHp": 20,
  "tempHp": 0,
  "ac": 16,
  "speed": 30,
  "inspiration": false,
  "scores": {
    "STR": 17,
    "DEX": 12,
    "CON": 13,
    "INT": 8,
    "WIS": 10,
    "CHA": 14
  },
  "proficientSkills": [
    "Athletics",
    "History",
    "Intimidation",
    "Persuasion"
  ],
  "proficientSaves": [
    "WIS",
    "CHA"
  ],
  "deathSuccesses": 0,
  "deathFailures": 0,
  "hitDice": 2,
  "gold": 120,
  "equipment": [
    {
      "id": "greatsword",
      "name": "Greatsword",
      "quantity": 0,
      "weight": 6,
      "notes": "Lost; not carried. Two-handed, heavy; 2d6 slashing."
    },
    {
      "id": "javelins",
      "name": "Javelin",
      "quantity": 4,
      "weight": 2,
      "notes": "Thrown · range 30/120 ft · 1d6 piercing"
    },
    {
      "id": "chain",
      "name": "Chain mail",
      "quantity": 1,
      "weight": 55,
      "notes": "AC 16 · heavy armor · disadvantage on Stealth"
    },
    {
      "id": "symbol",
      "name": "Holy symbol",
      "quantity": 1,
      "weight": 0,
      "notes": "Form and weight to confirm"
    },
    {
      "id": "pack",
      "name": "Explorer’s pack",
      "quantity": 1,
      "weight": 0,
      "notes": "Contents and weight to confirm"
    },
    {
      "id": "clothes",
      "name": "Fine clothes",
      "quantity": 1,
      "weight": 6,
      "notes": "Noble background"
    },
    {
      "id": "ring",
      "name": "Signet ring",
      "quantity": 1,
      "weight": 0,
      "notes": "Noble background"
    },
    {
      "id": "pedigree",
      "name": "Scroll of pedigree",
      "quantity": 1,
      "weight": 0,
      "notes": "Noble background"
    },
    {
      "id": "cards",
      "name": "Playing cards",
      "quantity": 1,
      "weight": 0,
      "notes": "Gaming set proficiency"
    }
  ],
  "spells": [
    {
      "id": "command",
      "name": "Command",
      "level": 1,
      "casting": "1 action",
      "range": "60 ft",
      "duration": "1 round",
      "description": "School & components: 1st-level enchantment. Verbal (V) only: you must be able to speak the magic words. No somatic gesture, material, or focus is required. Not a ritual. No concentration.\n\nTarget & save: Choose one creature you can see within 60 ft, with a clear path to it (no total cover). Speak a one-word command in a language it understands. The target makes a Wisdom saving throw against your spell save DC. On success, nothing happens; on failure, it follows the command on its next turn. You do not make a spell attack roll.\n\nNo-effect restrictions: Undead are unaffected. The spell also has no effect if the target does not understand your language or the command would directly harm it. If it cannot follow the command, the spell ends. It does not grant ongoing control, extra commands, or a multi-step instruction. A failed effect or successful save does not refund your slot.\n\nApproach: The target takes the shortest, most direct route toward you. If it gets within 5 ft of you, it ends its turn.\n\nDrop: The target drops what it is holding, then ends its turn. This does not automatically remove worn armor or other worn equipment.\n\nFlee: The target spends its turn moving away from you by the fastest means it has available.\n\nGrovel: The target falls prone, then ends its turn. Prone means its attacks have disadvantage; attacks against it have advantage within 5 ft and disadvantage from farther away. Standing later costs half its speed.\n\nHalt: The target stays in place and takes no actions. A flying target remains aloft if it can; if it must keep moving to stay airborne, it moves only the minimum necessary.\n\nOther words & rulings: Other one-word commands are allowed, but the DM decides how the target responds and what counts as directly harmful. The spell does not impose the charmed condition, so immunity to being charmed alone is not a stated exclusion; other creature traits can still affect the saving throw or magic.\n\nHigher slots: A slot of 2nd level or higher adds one target per slot level above 1st. Each target must meet the normal requirements and make its own save. All chosen targets must be within 30 ft of one another when selected. Bob has no higher-level slots at level 2.\n\nSource: https://www.dnd5eapi.co/api/2014/spells/command",
      "prepared": true,
      "concentration": false
    },
    {
      "id": "purify-food-and-drink",
      "name": "Purify Food and Drink",
      "level": 1,
      "casting": "1 action",
      "range": "10 ft",
      "duration": "Instantaneous",
      "prepared": true,
      "concentration": false,
      "description": "School & components: 1st-level transmutation. Verbal and somatic (V, S): you must be able to speak and have free use of at least one hand. No material or focus is required. No concentration. No saving throw or spell attack roll.\n\nArea & effect: Choose a point within 10 ft. All nonmagical food and drink inside a 5-ft-radius sphere around that point becomes free of poison and disease. The 10-ft limit applies to the center; the sphere extends 5 ft from it in every direction, including the center itself.\n\nTargeting restrictions: You need a clear path to the point; total cover blocks targeting and blocks the area spreading through it. Seeing the point is not an explicit spell requirement. Whether a closed container blocks the magic depends on whether it provides total cover, so resolve that with the DM.\n\nWhat it does not do: It does not affect magical food or drink, cure a poisoned or diseased creature, create food or water, detect poison, or make every non-food substance edible. It only removes poison and disease from qualifying food and drink. Other contamination, spoilage, and whether something counts as food or drink may require a DM ruling.\n\nDuration: The purification happens immediately. You do not maintain it, and dispelling magic afterward does not undo an instantaneous purification. The food or drink can be contaminated again later; it gains no lasting protective ward.\n\nRitual restriction: The spell has a ritual tag, but the 2014 Paladin class does not grant ritual casting. Bob must prepare it and spend 1 spell slot for his normal 1-action cast. Only a separate feature that actually permits this spell as a ritual would allow a slot-free casting with 10 additional minutes.\n\nHigher slots: You may spend a higher-level slot if available, but this spell lists no increase in radius, range, or effect. Bob has only 1st-level slots at level 2.\n\nSource: https://www.dnd5eapi.co/api/2014/spells/purify-food-and-drink"
    },
    {
      "id": "bless",
      "name": "Bless",
      "level": 1,
      "casting": "1 action",
      "range": "30 ft",
      "duration": "Up to 1 minute",
      "description": "School & components: 1st-level enchantment. Verbal, somatic, and material (V, S, M): a sprinkling of holy water. This spell states no component cost and does not say the material is consumed. A component pouch or your Paladin holy-symbol focus can replace that material. You still need speech and the required hand access; the hand used for the material or focus can also perform the somatic gesture. Not a ritual.\n\nTargets: Choose up to three creatures within 30 ft, including yourself if desired. You need a clear path to each target; total cover blocks targeting. The spell does not explicitly require sight or a willing target, and lists no creature-type exclusion. No saving throw or spell attack is required.\n\nBenefit: Until the spell ends, each target can roll 1d4 and add it whenever it makes an attack roll or saving throw. Roll the bonus for each eligible roll; it is not used up after one roll. This includes death saving throws. It does not add to damage, AC, ability checks, skill checks, or initiative.\n\nDuration & range: Concentration, up to 1 minute (normally 10 combat rounds). Once cast, targets can move beyond 30 ft without losing the spell. You cannot transfer the benefit to new targets without casting again. Multiple Bless castings on one target do not stack into extra d4s.\n\nConcentration limits: You may concentrate on only one spell at a time. Casting another concentration spell, being incapacitated, or dying ends Bless. You may end it voluntarily at any time without an action. Ordinary movement and attacks do not break it. Casting Command or Purify Food and Drink does not itself break Bless because neither requires concentration.\n\nDamage checks: Each separate source of damage requires your Constitution saving throw: DC 10 or half the damage actually taken, whichever is higher (round fractions down). Failure ends Bless for every target. Your Constitution save bonus is shown in the casting reference below. If you included yourself in Bless, its d4 applies to this save while the spell is still active. The DM can also call for a DC 10 check for severe environmental disruption.\n\nHigher slots: Add one target for each slot level above 1st: four targets with a 2nd-level slot, five with a 3rd-level slot, and so on. Each starts within 30 ft of you; there is no additional distance-between-targets restriction. Higher slots do not increase the d4 or duration. Bob cannot upcast at level 2.\n\nSource: https://www.dnd5eapi.co/api/2014/spells/bless",
      "prepared": true,
      "concentration": true
    }
  ],
  "slotsUsed": [
    1,
    0,
    0,
    0,
    0
  ],
  "resources": [
    {
      "id": "breath",
      "name": "Fire Breath",
      "remaining": 1,
      "max": 1,
      "description": "15 ft cone · Dexterity save · half damage on success.",
      "recharge": "Short or long rest"
    },
    {
      "id": "sense",
      "name": "Divine Sense",
      "remaining": 3,
      "max": 3,
      "description": "Sense celestials, fiends and undead within 60 ft, except behind total cover, until the end of your next turn.",
      "recharge": "Long rest"
    },
    {
      "id": "hands",
      "name": "Lay on Hands",
      "remaining": 10,
      "max": 10,
      "description": "Touch to restore HP from the pool. Spend 5 points to cure one disease or neutralize one poison.",
      "recharge": "Long rest"
    }
  ],
  "traits": "I proudly introduce myself before every battle: “I am Bob!” I act like a noble hero.",
  "ideals": "Freedom.",
  "bonds": "",
  "flaws": "I rush into danger too quickly.",
  "languages": "Common, Draconic, Celestial",
  "proficiencies": "All armor; shields; simple weapons; martial weapons; playing cards.",
  "notes": "Imported from the June 17, 2026 character sheet and Greatsword Bob conversation. Uses the 2014 fifth-edition Paladin rules.\n\nDM CHECK — The paper sheet lists 120 gp alongside starting gear. Rolled starting gold normally replaces starting equipment; confirm which method your table uses. Do not automatically add the Noble’s 25 gp.\n\nSecond martial weapon: not confirmed. Greatsword was confirmed in the starting equipment; now lost.\n\nFire resistance: halve fire damage. Position of Privilege: Noble background feature.\n\nResource counters start full because spent uses were not recorded. XP is set to 0 as a starting placeholder. Equipment weights of 0 mean not recorded, not weightless.\n\nInventory update — September 13, 2026: greatsword lost (0 carried); javelins reduced from 5 to 4, per Kai.\n\nEncounter update — September 13, 2026 (Kai): initiative 19 (rolled 18 + 1). Cast Bless on the druid, Cat, and Taric, spending one 1st-level spell slot; 1 of 2 slots remains. Bob maintains concentration, up to 1 minute (10 rounds), unless it ends earlier. These three targets add 1d4 to attack rolls and saving throws; Bob is not a target. Pulled right arm; Kai confirmed no HP damage, so HP remains 15/20. No mechanical penalty was specified; any penalty needs a DM ruling.\n\nFalling rocks — September 13, 2026 (Kai): took 2 damage, reducing HP from 15/20 to 13/20. Kai clarified that Bless had already ended. The druid, Cat, and Taric no longer receive its bonus; no concentration save was needed for this damage. One 1st-level spell slot remains.",
  "custom": [
    {
      "id": "great-weapon-fighting",
      "label": "Fighting style — Great Weapon Fighting",
      "value": "When a damage die for your two-handed melee weapon rolls 1 or 2, reroll it once. You must use the new result. Applies to both of your greatsword’s 2d6 weapon damage dice."
    },
    {
      "id": "divine-smite",
      "label": "Divine Smite",
      "value": "When you hit with a melee weapon attack, you may expend a 1st-level spell slot to deal 2d8 extra radiant damage, or 3d8 against an undead or fiend. Decide after the hit. Uses the same two spell slots as your prepared spells; slots return on a long rest. Great Weapon Fighting rerolls only the weapon damage dice, not Divine Smite dice."
    },
    {
      "id": "spellcasting-rules",
      "label": "Spellcasting rules — 2014",
      "value": "Preparation: Your prepared-spell limit is Charisma modifier + half Paladin level rounded down, minimum 1 once spellcasting starts at level 2. Choose Paladin spells of levels for which you have slots. You can change the list after a long rest, with at least 1 minute of prayer and meditation per spell level for every spell on the new list. Bob's three 1st-level spells take at least 3 minutes to prepare. Casting a spell does not unprepare it.\n\nSlots & recovery: Every normal cast uses one slot of the spell's level or higher. Command, Purify Food and Drink, Bless, and Divine Smite share Bob's two 1st-level slots at level 2. Two uses total, in any combination. A long rest restores spent slots; a short rest does not. A target succeeding on its save or a spell ending early does not refund a spent slot.\n\nActions & armor: All three recorded spells take 1 action, so they normally use the action you could otherwise use to attack. Under 2014 rules, casting any bonus-action spell on your turn limits other spells that turn to a cantrip with a casting time of 1 action. This is not a blanket one-spell-per-turn rule. Bob can cast in his chain mail because he is proficient with it; wearing armor you lack proficiency in prevents spellcasting.\n\nSpeech & hands: All three spells need verbal components, so being gagged or inside magical silence prevents their casting. Purify and Bless also require somatic gestures. A hand holding a weapon cannot freely perform those gestures unless another rule permits it. A focus can replace only eligible material components, not verbal or somatic requirements. Purify has no material component, so merely holding a focus does not remove its free-hand requirement.\n\nHoly symbol: A Paladin can use a holy symbol as a spellcasting focus, holding it, wearing it visibly, or bearing it on a shield. Bob has a holy symbol recorded, but its form is unconfirmed. Bless's material can be replaced by this focus; a separately specified costly or consumed material would still have to be supplied. Neither Command nor Purify needs a material component.\n\nChoosing targets: At casting, obey the spell's range, target type, sight requirement if stated, and clear-path rule. Total cover blocks targeting, even when a target is visible through an obstruction. Effects normally continue beyond casting range unless the spell says otherwise. Areas spread from their origin in unblocked straight lines; total cover excludes the blocked part.\n\nConcentration: Only Bless among Bob's three spells needs it. Keep one concentration effect at a time. Damage checks use Constitution, not Charisma and not your spell save DC. Each damage source has its own check, DC max(10, half damage taken rounded down). Incapacitation, death, a new concentration spell, voluntary ending, or a failed required check ends it.\n\nSaves versus attacks: Command makes its target roll Wisdom against your spell save DC. Bless and Purify require neither a save nor a spell attack roll. Your spell attack modifier therefore is not rolled for any of these three spells. Divine Smite is a class feature triggered by a melee weapon hit, not a separate spell attack; a thrown javelin does not qualify, but a melee javelin hit can.\n\nRules sources: 2014 SRD 5.1 spell and spellcasting rules, paraphrased with practical notes. Sources: https://www.dnd5eapi.co/api/2014/rule-sections/casting-a-spell ; https://www.dnd5eapi.co/api/2014/rule-sections/what-is-a-spell ; https://www.dnd5eapi.co/api/2014/classes/paladin . Source text: https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf . SRD 5.1 by Wizards of the Coast LLC is licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Specific creature traits and your DM's rulings can change an interaction."
    }
  ]
};

export const clone = <T,>(value:T):T => structuredClone(value);
export const modifier = (score:number) => Math.floor((score-10)/2);
export const signed = (n:number) => `${n>=0?'+':''}${n}`;
export const proficiency = (level:number) => 2+Math.floor((level-1)/4);
const slotTable = [[0,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],[4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
export const slots = (level:number) => [...slotTable[Math.max(0,Math.min(19,level-1))]];
export const preparedLimit = (c:Character) => c.level<2?0:Math.max(1,modifier(c.scores.CHA)+Math.floor(c.level/2));
export const breathDice = (level:number) => level>=16?5:level>=11?4:level>=6?3:2;
export const skillBonus = (c:Character,skill:string) => modifier(c.scores[skillAbilities[skill]])+(c.proficientSkills.includes(skill)?proficiency(c.level):0);
export const spellLibrary:Spell[] = [
  {"id": "purify-food-and-drink", "name": "Purify Food and Drink", "level": 1, "casting": "1 action", "range": "10 ft", "duration": "Instantaneous", "prepared": false, "concentration": false, "description": "School & components: 1st-level transmutation. Verbal and somatic (V, S): you must be able to speak and have free use of at least one hand. No material or focus is required. No concentration. No saving throw or spell attack roll.\n\nArea & effect: Choose a point within 10 ft. All nonmagical food and drink inside a 5-ft-radius sphere around that point becomes free of poison and disease. The 10-ft limit applies to the center; the sphere extends 5 ft from it in every direction, including the center itself.\n\nTargeting restrictions: You need a clear path to the point; total cover blocks targeting and blocks the area spreading through it. Seeing the point is not an explicit spell requirement. Whether a closed container blocks the magic depends on whether it provides total cover, so resolve that with the DM.\n\nWhat it does not do: It does not affect magical food or drink, cure a poisoned or diseased creature, create food or water, detect poison, or make every non-food substance edible. It only removes poison and disease from qualifying food and drink. Other contamination, spoilage, and whether something counts as food or drink may require a DM ruling.\n\nDuration: The purification happens immediately. You do not maintain it, and dispelling magic afterward does not undo an instantaneous purification. The food or drink can be contaminated again later; it gains no lasting protective ward.\n\nRitual restriction: The spell has a ritual tag, but the 2014 Paladin class does not grant ritual casting. Bob must prepare it and spend 1 spell slot for his normal 1-action cast. Only a separate feature that actually permits this spell as a ritual would allow a slot-free casting with 10 additional minutes.\n\nHigher slots: You may spend a higher-level slot if available, but this spell lists no increase in radius, range, or effect. Bob has only 1st-level slots at level 2.\n\nSource: https://www.dnd5eapi.co/api/2014/spells/purify-food-and-drink"},
  {"id": "bless", "name": "Bless", "level": 1, "casting": "1 action", "range": "30 ft", "duration": "Up to 1 minute", "description": "School & components: 1st-level enchantment. Verbal, somatic, and material (V, S, M): a sprinkling of holy water. This spell states no component cost and does not say the material is consumed. A component pouch or your Paladin holy-symbol focus can replace that material. You still need speech and the required hand access; the hand used for the material or focus can also perform the somatic gesture. Not a ritual.\n\nTargets: Choose up to three creatures within 30 ft, including yourself if desired. You need a clear path to each target; total cover blocks targeting. The spell does not explicitly require sight or a willing target, and lists no creature-type exclusion. No saving throw or spell attack is required.\n\nBenefit: Until the spell ends, each target can roll 1d4 and add it whenever it makes an attack roll or saving throw. Roll the bonus for each eligible roll; it is not used up after one roll. This includes death saving throws. It does not add to damage, AC, ability checks, skill checks, or initiative.\n\nDuration & range: Concentration, up to 1 minute (normally 10 combat rounds). Once cast, targets can move beyond 30 ft without losing the spell. You cannot transfer the benefit to new targets without casting again. Multiple Bless castings on one target do not stack into extra d4s.\n\nConcentration limits: You may concentrate on only one spell at a time. Casting another concentration spell, being incapacitated, or dying ends Bless. You may end it voluntarily at any time without an action. Ordinary movement and attacks do not break it. Casting Command or Purify Food and Drink does not itself break Bless because neither requires concentration.\n\nDamage checks: Each separate source of damage requires your Constitution saving throw: DC 10 or half the damage actually taken, whichever is higher (round fractions down). Failure ends Bless for every target. Your Constitution save bonus is shown in the casting reference below. If you included yourself in Bless, its d4 applies to this save while the spell is still active. The DM can also call for a DC 10 check for severe environmental disruption.\n\nHigher slots: Add one target for each slot level above 1st: four targets with a 2nd-level slot, five with a 3rd-level slot, and so on. Each starts within 30 ft of you; there is no additional distance-between-targets restriction. Higher slots do not increase the d4 or duration. Bob cannot upcast at level 2.\n\nSource: https://www.dnd5eapi.co/api/2014/spells/bless", "prepared": false, "concentration": true},
  {id:'cure',name:'Cure Wounds',level:1,casting:'1 action',range:'Touch',duration:'Instantaneous',description:'Restore 1d8 + spellcasting modifier HP. Higher slots add 1d8 healing per slot level.',prepared:false,concentration:false},
  {id:'shield-faith',name:'Shield of Faith',level:1,casting:'1 bonus action',range:'60 ft',duration:'10 minutes',description:'One creature gains +2 AC for the duration.',prepared:false,concentration:true},
  {"id": "command", "name": "Command", "level": 1, "casting": "1 action", "range": "60 ft", "duration": "1 round", "description": "School & components: 1st-level enchantment. Verbal (V) only: you must be able to speak the magic words. No somatic gesture, material, or focus is required. Not a ritual. No concentration.\n\nTarget & save: Choose one creature you can see within 60 ft, with a clear path to it (no total cover). Speak a one-word command in a language it understands. The target makes a Wisdom saving throw against your spell save DC. On success, nothing happens; on failure, it follows the command on its next turn. You do not make a spell attack roll.\n\nNo-effect restrictions: Undead are unaffected. The spell also has no effect if the target does not understand your language or the command would directly harm it. If it cannot follow the command, the spell ends. It does not grant ongoing control, extra commands, or a multi-step instruction. A failed effect or successful save does not refund your slot.\n\nApproach: The target takes the shortest, most direct route toward you. If it gets within 5 ft of you, it ends its turn.\n\nDrop: The target drops what it is holding, then ends its turn. This does not automatically remove worn armor or other worn equipment.\n\nFlee: The target spends its turn moving away from you by the fastest means it has available.\n\nGrovel: The target falls prone, then ends its turn. Prone means its attacks have disadvantage; attacks against it have advantage within 5 ft and disadvantage from farther away. Standing later costs half its speed.\n\nHalt: The target stays in place and takes no actions. A flying target remains aloft if it can; if it must keep moving to stay airborne, it moves only the minimum necessary.\n\nOther words & rulings: Other one-word commands are allowed, but the DM decides how the target responds and what counts as directly harmful. The spell does not impose the charmed condition, so immunity to being charmed alone is not a stated exclusion; other creature traits can still affect the saving throw or magic.\n\nHigher slots: A slot of 2nd level or higher adds one target per slot level above 1st. Each target must meet the normal requirements and make its own save. All chosen targets must be within 30 ft of one another when selected. Bob has no higher-level slots at level 2.\n\nSource: https://www.dnd5eapi.co/api/2014/spells/command", "prepared": false, "concentration": false},
  {id:'favor',name:'Divine Favor',level:1,casting:'1 bonus action',range:'Self',duration:'1 minute',description:'Your weapon attacks deal an extra 1d4 radiant damage.',prepared:false,concentration:true},
  {id:'heroism',name:'Heroism',level:1,casting:'1 action',range:'Touch',duration:'1 minute',description:'A willing creature is immune to being frightened and gains temporary HP equal to your spellcasting modifier at the start of each turn.',prepared:false,concentration:true},
  {id:'detect',name:'Detect Magic',level:1,casting:'1 action',range:'Self (30 ft)',duration:'10 minutes',description:'Sense nearby magic; an action can reveal an aura around a visible magical creature or object. Barriers can block detection.',prepared:false,concentration:true},
  {id:'protection',name:'Protection from Evil and Good',level:1,casting:'1 action',range:'Touch',duration:'10 minutes',description:'Protect one willing creature against specified creature types. Check your rules for material components and exact effects.',prepared:false,concentration:true},
];
// All imports and cloud reads cross this boundary. Reject malformed or excessive data.
export function validateCharacter(raw:unknown):Character {
  if(!raw || typeof raw!=='object') throw new Error('This is not a Bob character backup.');
  const c=raw as Character;
  const fail=()=>{throw new Error('The character data contains an invalid or missing field.');};
  const str=(x:unknown,max=12000)=>typeof x==='string' && x.length<=max;
  const num=(x:unknown,min=0,max=1000000)=>typeof x==='number' && Number.isFinite(x) && x>=min && x<=max;
  const int=(x:unknown,min=0,max=1000000)=>num(x,min,max)&&Number.isInteger(x);
  const list=(x:unknown,max=150):x is unknown[]=>Array.isArray(x)&&x.length<=max;
  if(c.schemaVersion!==1) fail();
  for(const key of ['name','player','race','characterClass','background','alignment','traits','ideals','bonds','flaws','languages','proficiencies','notes'] as const) if(!str(c[key])) fail();
  if(!c.name?.trim()||!int(c.level,1,20)||!int(c.hp)||!int(c.maxHp,1)||c.hp>c.maxHp||!int(c.tempHp)||!int(c.ac,0,100)||!int(c.speed)||!int(c.xp)||!num(c.gold)||!int(c.hitDice,0,c.level)||typeof c.inspiration!=='boolean') fail();
  if(!int(c.deathSuccesses,0,3)||!int(c.deathFailures,0,3)||!c.scores) fail();
  for(const a of abilities) if(!int(c.scores[a],1,30)) fail();
  if(!list(c.proficientSkills,18)||!c.proficientSkills.every(s=>Object.hasOwn(skillAbilities,s))||!list(c.proficientSaves,6)||!c.proficientSaves.every(s=>abilities.includes(s))) fail();
  if(!list(c.slotsUsed,5)||c.slotsUsed.length!==5||!c.slotsUsed.every((s,i)=>int(s,0,slots(c.level)[i]))) fail();
  if(!list(c.equipment)||!c.equipment.every(e=>e&&str(e.id,100)&&str(e.name,200)&&int(e.quantity,0,10000)&&num(e.weight,0,100000)&&str(e.notes))) fail();
  if(!list(c.spells)||!c.spells.every(s=>s&&str(s.id,100)&&str(s.name,200)&&int(s.level,0,9)&&str(s.casting,200)&&str(s.range,200)&&str(s.duration,200)&&str(s.description)&&typeof s.prepared==='boolean'&&typeof s.concentration==='boolean')) fail();
  if(!list(c.resources,40)||!c.resources.every(r=>r&&str(r.id,100)&&str(r.name,200)&&int(r.max,0,10000)&&int(r.remaining,0,r.max)&&str(r.description)&&str(r.recharge,200))) fail();
  if(!list(c.custom,100)||!c.custom.every(r=>r&&str(r.id,100)&&str(r.label,200)&&str(r.value))) fail();
  for(const rows of [c.equipment,c.spells,c.resources,c.custom]) if(new Set(rows.map(r=>r.id)).size!==rows.length) fail();
  return clone(c);
}
