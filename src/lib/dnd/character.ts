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
  schemaVersion:1, name:'Bob', player:'Kai', race:'Dragonborn', characterClass:'Paladin', level:1, background:'Noble', alignment:'Chaotic Neutral',
  xp:0, hp:6, maxHp:11, tempHp:0, ac:16, speed:30, inspiration:false,
  scores:{STR:17,DEX:12,CON:13,INT:8,WIS:10,CHA:14}, proficientSkills:['Athletics','History','Intimidation','Persuasion'], proficientSaves:['WIS','CHA'],
  deathSuccesses:0, deathFailures:0, hitDice:1, gold:120,
  equipment:[
    {id:'greatsword',name:'Greatsword',quantity:1,weight:6,notes:'Two-handed · heavy · 2d6 slashing'},
    {id:'javelins',name:'Javelin',quantity:5,weight:2,notes:'Thrown · range 30/120 ft · 1d6 piercing'},
    {id:'chain',name:'Chain mail',quantity:1,weight:55,notes:'AC 16 · heavy armor · disadvantage on Stealth'},
    {id:'symbol',name:'Holy symbol',quantity:1,weight:0,notes:'Form and weight to confirm'},
    {id:'pack',name:'Explorer’s pack',quantity:1,weight:0,notes:'Contents and weight to confirm'},
    {id:'clothes',name:'Fine clothes',quantity:1,weight:6,notes:'Noble background'},
    {id:'ring',name:'Signet ring',quantity:1,weight:0,notes:'Noble background'},
    {id:'pedigree',name:'Scroll of pedigree',quantity:1,weight:0,notes:'Noble background'},
    {id:'cards',name:'Playing cards',quantity:1,weight:0,notes:'Gaming set proficiency'},
  ], spells:[], slotsUsed:[0,0,0,0,0],
  resources:[
    {id:'breath',name:'Fire Breath',remaining:1,max:1,description:'15 ft cone · Dexterity save · half damage on success.',recharge:'Short or long rest'},
    {id:'sense',name:'Divine Sense',remaining:3,max:3,description:'Sense celestials, fiends and undead within 60 ft, except behind total cover, until the end of your next turn.',recharge:'Long rest'},
    {id:'hands',name:'Lay on Hands',remaining:5,max:5,description:'Touch to restore HP from the pool. Spend 5 points to cure one disease or neutralize one poison.',recharge:'Long rest'},
  ],
  traits:'I proudly introduce myself before every battle: “I am Bob!” I act like a noble hero.', ideals:'Freedom.', bonds:'', flaws:'I rush into danger too quickly.',
  languages:'Common, Draconic, Celestial', proficiencies:'All armor; shields; simple weapons; martial weapons; playing cards.',
  notes:'Imported from the June 17, 2026 character sheet and Greatsword Bob conversation. Uses the 2014 fifth-edition Paladin rules.\n\nDM CHECK — The paper sheet lists 120 gp alongside starting gear. Rolled starting gold normally replaces starting equipment; confirm which method your table uses. Do not automatically add the Noble’s 25 gp.\n\nSecond martial weapon: not confirmed. Greatsword is confirmed.\n\nFire resistance: halve fire damage. Position of Privilege: Noble background feature.\n\nResource counters start full because spent uses were not recorded. XP is set to 0 as a starting placeholder. Equipment weights of 0 mean not recorded, not weightless.',
  custom:[],
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
  {id:'bless',name:'Bless',level:1,casting:'1 action',range:'30 ft',duration:'1 minute',description:'Up to three creatures add 1d4 to attack rolls and saving throws. Higher slots add targets.',prepared:false,concentration:true},
  {id:'cure',name:'Cure Wounds',level:1,casting:'1 action',range:'Touch',duration:'Instantaneous',description:'Restore 1d8 + spellcasting modifier HP. Higher slots add 1d8 healing per slot level.',prepared:false,concentration:false},
  {id:'shield-faith',name:'Shield of Faith',level:1,casting:'1 bonus action',range:'60 ft',duration:'10 minutes',description:'One creature gains +2 AC for the duration.',prepared:false,concentration:true},
  {id:'command',name:'Command',level:1,casting:'1 action',range:'60 ft',duration:'1 round',description:'Give a one-word command. A target that understands it makes a Wisdom save; restrictions apply.',prepared:false,concentration:false},
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
