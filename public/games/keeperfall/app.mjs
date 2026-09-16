import {
  CLASSES, SPELLS, SLOT_LABELS, CRAFT_RECIPES, DUNGEON_PIECES, CREATURE_SPECIES, CREATURE_TRAITS, CREATURE_AWAKENINGS, CREATURE_LINEAGES, CREATURE_MEMORIES, KEEPER_TALENT_BRANCHES, KEEPER_TALENTS,
  RIVAL_REGIONS, REGIONAL_SOVEREIGNS, EXPEDITION_DIFFICULTIES, EXPEDITION_MODIFIERS, EXPEDITION_STANCES, POTION_POLICIES, SPELL_POLICIES, KEEPER_POSITIONS, DUNGEON_LAYOUTS, DUNGEON_THEMES, DUNGEON_ROOMS, ITEM_SETS, RUNE_TYPES, CHRONICLE_ACHIEVEMENTS, RARITIES, PREFIXES, TRAITS, QUALITIES, TINKER_ACTIONS,
  createInitialState, heroStats, dungeonThreat, availableSpells, placeDungeonPiece,
  equipItem, unequipItem, dismantleItem, tinkerItem, carveRuneSocket, socketRune, unsocketRune, itemRuneBonuses, equipmentSetBonuses, createRaid, autoRaidStep,
  equipMonsterItem, unequipMonsterItem, attuneMonsterSpell, assignMonsterPotion, monsterStats, craftItem,
  retreatRaid, publishDungeon, upgradeDungeon, simulateDefenseWave, itemDisplayName, calculatePower, validateState,
  creatureLifeStage, creatureBondTier, creatureStats, raidMemberName, purchaseEgg, incubateEgg, assignCreature,
  renameCreature, trainCreature, awakenCreature, creatureLineageOptions, creatureMemoryLedger, advanceCreatureLineage, claimContract, migrateState,
  equipCreatureItem, unequipCreatureItem, attuneCreatureSpell, assignCreaturePotion,
  expeditionPreview, configureExpedition, expeditionDoctrine, configureExpeditionDoctrine, moveExpeditionCreature, dungeonPath, trapSynergies, upgradeTrap, expandDungeonLayout, defenseAnalytics,
  inventoryView, itemComparison, lootCodexProgress, toggleItemFavorite, heroXpToNext, progressionBand,
  exportSaveData, importSaveData, keeperTalentBudget, keeperTalentBonuses, keeperBranchProgress, learnKeeperTalent, respecKeeperTalents, currentWorldCondition, claimAtlasBounty, dungeonRoomBonuses, setDungeonTheme, buildDungeonRoom, chronicleProgress, claimChronicleReward, campaignCompletion, claimLivingHeart
} from "./game-core.mjs";
import { mountDungeon3D, mountRaid3D } from "./scene3d.mjs";
import { createSoundController } from "./sound.mjs";

const SAVE_KEY = "keeperfall-save-v1";
const BACKUP_KEY = "keeperfall-save-v1-backup";
let recoveredAtLoad = false;
let state = loadState();
let view = "keep";
let settingsOpen = false;
let toastTimer = null;
let destroy3D = null;
let combatFx = null;
let autoBattleTimer = null;
const sound = createSoundController(() => state.settings);

function loadState() {
  const primary = readStoredState(SAVE_KEY);
  if (primary) return primary;
  const backup = readStoredState(BACKUP_KEY);
  if (backup) { recoveredAtLoad = true; backup.journal?.unshift("Recovered the last-known good local backup."); return backup; }
  return createInitialState();
}

function readStoredState(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const saved = migrateState(JSON.parse(raw));
    return validateState(saved).length === 0 ? saved : null;
  } catch (_) { return null; }
}

function save() {
  const next = JSON.stringify(state), current = localStorage.getItem(SAVE_KEY);
  if (current && current !== next) {
    try {
      const previous = migrateState(JSON.parse(current));
      if (validateState(previous).length === 0) localStorage.setItem(BACKUP_KEY, current);
    } catch (_) {}
  }
  localStorage.setItem(SAVE_KEY, next);
}

function el(id) { return document.getElementById(id); }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c]));
}
function pct(value, max) { return Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100)); }
function activeDungeonPath() { return dungeonPath(state); }

function appShell() {
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">K</div><div><strong>KEEPERFALL</strong><span>V2.0 · The Living Heart</span></div></div>
        <nav aria-label="Game sections">
          ${navButton("keep", "Dungeon", "⌂")}
          ${navButton("raid", "Raid", "⚔")}
          ${navButton("hero", "Keeper", "♙")}
          ${navButton("forge", "Forge", "◇")}
          ${navButton("spells", "Spellbook", "✦")}
          ${navButton("chronicle", "Chronicle", "◈")}
          ${navButton("reports", "Reports", "≡")}
        </nav>
        <div class="keeper-card">
          <span class="eyebrow">KEEPER DAY ${state.day}</span>
          <div class="resource"><span>Gold</span><strong>${state.gold.toLocaleString()}</strong></div>
          <div class="resource"><span>Dungeon Seals</span><strong>${state.seals}</strong></div>
          <div class="resource"><span>Essence</span><strong>${state.essence}</strong></div>
          <div class="resource"><span>Potions</span><strong>${state.potions}</strong></div>
        </div>
        <div class="sound-controls"><button data-action="toggle-sound" aria-pressed="${state.settings.soundEnabled}">${state.settings.soundEnabled?"♪ Sound":"♩ Muted"}</button><button data-action="open-settings">⚙ Settings</button></div>
        <button class="quiet reset" data-action="reset">Reset save</button>
      </aside>
      <main>
        <header class="topbar">
          <div><span class="eyebrow">${sectionEyebrow()}</span><h1>${sectionTitle()}</h1></div>
          <div class="hero-chip">${heroSigil()}<div><span>Level ${state.heroes[state.selectedClass].level}</span><strong>${CLASSES[state.selectedClass].name}</strong></div></div>
        </header>
        <section class="view">${renderView()}</section>
      </main>
      <input id="save-import" type="file" accept="application/json,.json" hidden />
      ${settingsOpen ? renderSettingsPanel() : ""}
      ${state.onboarding.complete ? "" : renderOnboarding()}
      <div id="toast" role="status" aria-live="polite"></div>
    </div>`;
}

function renderSettingsPanel() {
  const hasBackup = Boolean(localStorage.getItem(BACKUP_KEY));
  return `<div class="modal-scrim" data-action="close-settings"><section class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" data-modal-stop>
    <header><div><span class="eyebrow">PROFILE & ACCESSIBILITY</span><h2 id="settings-title">Keeper Settings</h2></div><button class="icon-button" data-action="close-settings" aria-label="Close settings">×</button></header>
    <div class="settings-grid">
      <label class="setting-row"><span><strong>Sound effects</strong><small>Synthesized combat and interface cues.</small></span><button data-action="toggle-sound" aria-pressed="${state.settings.soundEnabled}">${state.settings.soundEnabled?"Enabled":"Muted"}</button></label>
      <label class="setting-slider"><span><strong>Sound volume</strong><small>${Math.round(state.settings.soundVolume*100)}%</small></span><input id="sound-volume" aria-label="Sound volume" type="range" min="0" max="100" value="${Math.round(state.settings.soundVolume*100)}" /></label>
      <label class="setting-row"><span><strong>Impact motion</strong><small>Camera shake on heavy enemy hits.</small></span><button data-action="toggle-shake" aria-pressed="${state.settings.combatShake}">${state.settings.combatShake?"Enabled":"Disabled"}</button></label>
      <label class="setting-row"><span><strong>Reduced motion</strong><small>Stops idle drift, lunges, and decorative animation.</small></span><button data-action="toggle-reduced-motion" aria-pressed="${state.settings.reducedMotion}">${state.settings.reducedMotion?"Enabled":"Disabled"}</button></label>
      <label class="setting-row"><span><strong>High contrast</strong><small>Brightens text, borders, and focus indicators.</small></span><button data-action="toggle-contrast" aria-pressed="${state.settings.highContrast}">${state.settings.highContrast?"Enabled":"Disabled"}</button></label>
      <label class="setting-select"><span><strong>Visual style</strong><small>Choose the clean tactical board or the fixed-camera isometric world.</small></span><select id="presentation-mode" aria-label="Visual style"><option value="2d" ${state.settings.presentationMode==="2d"?"selected":""}>Polished 2D</option><option value="3d" ${state.settings.presentationMode==="3d"?"selected":""}>Isometric world</option></select></label>
      <label class="setting-select"><span><strong>Text size</strong><small></small></span><select id="text-size" aria-label="Text size"><option value="comfortable" ${state.settings.textSize==="comfortable"?"selected":""}>Comfortable</option><option value="large" ${state.settings.textSize==="large"?"selected":""}>Large</option></select></label>
      <label class="setting-select"><span><strong>3D quality</strong><small>Controls resolution, shadows, and particle count.</small></span><select id="scene-quality" aria-label="3D quality"><option value="low" ${state.settings.sceneQuality==="low"?"selected":""}>Low</option><option value="balanced" ${state.settings.sceneQuality==="balanced"?"selected":""}>Balanced</option><option value="high" ${state.settings.sceneQuality==="high"?"selected":""}>High</option></select></label>
      <label class="setting-select"><span><strong>Auto-battle pace</strong><small>Changes only the presentation delay between decisions.</small></span><select id="battle-pace" aria-label="Auto-battle pace"><option value="fast" ${state.settings.battlePace==="fast"?"selected":""}>Fast</option><option value="standard" ${state.settings.battlePace==="standard"?"selected":""}>Standard</option><option value="cinematic" ${state.settings.battlePace==="cinematic"?"selected":""}>Cinematic</option></select></label>
    </div>
    <div class="save-tools"><span class="eyebrow">SAVE SAFETY</span><p>Every change keeps one automatic local backup. Export a portable profile before moving browsers or devices.</p><div><button data-action="export-save">Export profile</button><button data-action="import-save">Import profile</button><button data-action="restore-backup" ${hasBackup?"":"disabled"}>Restore backup</button><button data-action="restart-tutorial">Replay guide</button></div></div>
  </section></div>`;
}

function renderOnboarding() {
  const steps = [
    { icon:"♥", eyebrow:"WELCOME, KEEPER", title:"Build a dungeon that remembers.", copy:"You command exactly one persistent hero. Everything else grows around that choice: a living Heartway, a bonded menagerie, and a hoard worth defending." },
    { icon:"⌂", eyebrow:"SHAPE THE HEARTWAY", title:"Traps create a defensive language.", copy:"Click route chambers to place traps. Ordered mechanisms discover combos; hatched creatures can instead guard a specific chamber with their own gear, spell, and potions." },
    { icon:"◇", eyebrow:"RAISE YOUR BONDS", title:"Eggs become lifelong companions.", copy:"Incubate eggs in the Menagerie, then assign up to three creatures to the expedition. They age, level, bond, awaken, and fight automatically beside your hero." },
    { icon:"⚔", eyebrow:"BREAK RIVAL HEARTS", title:"Watch the expedition decide.", copy:"Choose a rival region and risk tier. Combat is fully automatic; victory returns the heart's loot, gold, seals, and often a new egg to hatch or dismantle into the next build." }
  ];
  const step = state.onboarding.step, content = steps[step];
  return `<div class="onboarding-scrim"><section class="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <div class="onboarding-art"><i>${content.icon}</i><span>${step+1} / ${steps.length}</span></div>
    <div class="onboarding-copy"><span class="eyebrow">${content.eyebrow}</span><h2 id="onboarding-title">${content.title}</h2><p>${content.copy}</p><div class="onboarding-dots">${steps.map((_,index)=>`<i class="${index<=step?"active":""}"></i>`).join("")}</div><footer><button class="quiet" data-action="skip-onboarding">Skip guide</button><div>${step?`<button data-action="onboarding-back">Back</button>`:""}<button class="primary" data-action="onboarding-next">${step===steps.length-1?"Enter the Heartway":"Continue"}</button></div></footer></div>
  </section></div>`;
}

function navButton(id, label, icon) {
  return `<button data-view="${id}" class="nav-button ${view === id ? "active" : ""}"><span>${icon}</span>${label}</button>`;
}
function heroSigil() { const c = CLASSES[state.selectedClass]; return `<img class="hero-avatar" src="${heroPortraitSrc(state.selectedClass)}" alt="${c.name}" />`; }
function itemIconSlot(slot) { return slot === "ring" ? "ring1" : slot; }
function itemIcon(item, className = "item-icon") { return `<img class="${className}" src="assets/icons/equipment-${itemIconSlot(item.slot)}.png" alt="" />`; }
const REALISTIC_ENTITY_ICONS = new Set(["slime","skeleton","goblin","ogre","mimic","wraith","hexer","golem","spikes"]);
function realisticEntityIcon(id, className = "entity-art", alt = "") { return REALISTIC_ENTITY_ICONS.has(id) ? `<img class="${className}" src="assets/icons/realistic/${DUNGEON_PIECES[id]?.kind === "trap" ? "trap" : "creature"}-${id}-v1.png" alt="${escapeHtml(alt)}" />` : `<i class="${className} fallback-art">${DUNGEON_PIECES[id]?.glyph || "·"}</i>`; }
function heroPortraitSrc(classId) { return classId === "fighter" ? "assets/icons/realistic/hero-fighter-v1.png" : `assets/icons/hero-${classId}.png`; }
function sectionTitle() { return ({ keep: "The Living Dungeon", raid: "Rival Expeditions", hero: "Keeper & Menagerie", forge: "Salvage & Tinkering", spells: "The Eightfold Grimoire", chronicle: "The Keeper's Chronicle", reports: "Keeper's Ledger" })[view]; }
function sectionEyebrow() { return ({ keep: "SHAPE THE HUNGER", raid: "WATCH THEM HUNT", hero: "ONE HERO · MANY BONDS", forge: "NOTHING IS WASTE", spells: `${SPELLS.length} RECORDED SPELLS`, chronicle: "EVERY DISCOVERY ENDURES", reports: "LEARN FROM EVERY DEATH" })[view]; }
function renderView() {
  if (view === "keep") return renderKeep();
  if (view === "raid") return renderRaid();
  if (view === "hero") return renderHero();
  if (view === "forge") return renderForge();
  if (view === "spells") return renderSpells();
  if (view === "chronicle") return renderChronicle();
  return renderReports();
}

function renderKeep() {
  const threat = dungeonThreat(state);
  const piece = DUNGEON_PIECES[state.dungeon.selectedPiece];
  const layout = DUNGEON_LAYOUTS[state.dungeon.layoutId];
  return `
    <div class="dashboard-grid keep-layout">
      <section class="panel dungeon-panel">
        <div class="panel-head"><div><span class="eyebrow">EDITABLE DEFENSE · ${layout.path.length} CHAMBERS</span><h2>${layout.name}</h2></div><div class="threat"><span>THREAT</span><strong>${threat}</strong></div></div>
        ${state.settings.presentationMode==="3d"?`<div class="dungeon-viewport"><div id="dungeon-3d"></div></div><details class="blueprint"><summary>Open tactical blueprint</summary><div class="dungeon-grid" aria-label="Dungeon construction grid">${state.dungeon.cells.map((id, index) => dungeonCell(id, index)).join("")}</div></details>`:renderDungeonBoard2D(layout)}
        <div class="legend"><span><i class="entry-dot"></i>Entrance</span><span><i class="heart-dot"></i>Dungeon heart</span></div>
      </section>
      <aside class="panel build-panel">
        <div class="panel-head"><div><span class="eyebrow">BUILD PALETTE</span><h2>${piece.name}</h2></div><strong class="cost">${piece.cost}g</strong></div>
        <p class="muted">${piece.description}</p>
        <div class="piece-list">${Object.entries(DUNGEON_PIECES).filter(([,p])=>p.kind!=="monster").map(([id, p]) => `
          <button class="piece ${state.dungeon.selectedPiece === id ? "selected" : ""}" data-piece="${id}">
            ${realisticEntityIcon(id,"piece-art",p.name)}<span><strong>${p.name}</strong><small>${p.kind} · ${p.threat} threat</small></span><b>${p.cost}g</b>
          </button>`).join("")}
        </div><p class="muted small beast-build-note">Living guardians are not construction pieces. Hatch them in the Menagerie, then choose the chamber they will defend.</p>
      </aside>
    </div>
    <section class="panel gate-panel">
      <div><span class="eyebrow">ASYNCHRONOUS DEFENSE · HEART RANK ${state.dungeon.rank}</span><h2>${state.dungeon.published ? "The gates are open" : "Fund the Boss Hoard"}</h2><p class="muted">Your published snapshot fights while you are away. Slain challengers pay; victorious heroes claim only the hoard you commit.</p><button class="quiet rank-up" data-action="upgrade-dungeon">Upgrade heart · ${250+state.dungeon.rank*200}g · ${state.dungeon.rank} seals</button></div>
      <label>Hero band<select id="level-band">${[1,2,3,4,5].map(n => `<option value="${n}" ${state.dungeon.levelBand===n?"selected":""} ${n>state.dungeon.rank?"disabled":""}>Tier ${n} · hero levels ${n*3-2}–${n*3+1}${n>state.dungeon.rank?" · LOCKED":""}</option>`).join("")}</select></label>
      <label>Boss Hoard<input id="hoard" type="number" min="50" max="5000" step="25" value="${state.dungeon.hoard}" /></label>
      ${state.dungeon.published ? `<button class="primary" data-action="simulate-wave">Resolve 3-hero wave</button>` : `<button class="primary" data-action="publish">Open the gates</button>`}
    </section>
    ${renderDungeonMastery()}
    ${renderGarrison()}`;
}

function monsterCells() {
  const path = new Set(activeDungeonPath());
  return state.dungeon.cells.map((id,index)=>({id,index,piece:DUNGEON_PIECES[id]})).filter(({piece,index})=>path.has(index)&&piece.kind==="monster");
}

function renderDungeonMastery() {
  const activePath = activeDungeonPath(), current = DUNGEON_LAYOUTS[state.dungeon.layoutId];
  const synergies = trapSynergies(state), synergyTargets = new Map(synergies.map(entry=>[entry.toCell,entry]));
  const traps = activePath.map((cell,index)=>({cell,index,piece:DUNGEON_PIECES[state.dungeon.cells[cell]]})).filter(({piece})=>piece.kind==="trap");
  return `<section class="panel mastery-panel"><div class="panel-head"><div><span class="eyebrow">DUNGEON MASTERY</span><h2>Shape a defense with a memory.</h2><p class="muted">Expand the route permanently, deepen individual mechanisms, and place traps in sequences that create combo damage.</p></div><div class="mastery-total"><strong>${synergies.length}</strong><span>ACTIVE COMBOS</span></div></div>
    <div class="layout-progression">${Object.entries(DUNGEON_LAYOUTS).map(([id,layout])=>{const active=id===state.dungeon.layoutId,owned=layout.path.length<current.path.length,locked=state.dungeon.rank<layout.rank;return `<article class="layout-card ${active?"active":""} ${locked?"locked":""}"><span>HEART RANK ${layout.rank}</span><h3>${layout.name}</h3><p>${layout.description}</p><small>${layout.path.length} chambers · ${layout.goldCost}g · ${layout.sealCost} seals</small><button data-action="expand-layout" data-layout="${id}" ${active||owned||locked?"disabled":""}>${active?"Current route":owned?"Established":locked?`Rank ${layout.rank} required`:"Expand route"}</button></article>`;}).join("")}</div>
    ${renderDungeonArchitecture()}
    <div class="trap-workshop"><div class="workshop-heading"><span class="eyebrow">TRAP WORKSHOP</span><strong>${traps.length} mechanisms on the active route</strong></div>${traps.length?`<div class="trap-mastery-grid">${traps.map(({cell,index,piece})=>{const level=state.dungeon.trapLevels?.[cell]||1,combo=synergyTargets.get(cell),nextCost=Math.round(piece.cost*(.9+level*.55));return `<article class="trap-mastery ${combo?"combo":""}"><div>${realisticEntityIcon(state.dungeon.cells[cell],"trap-art",piece.name)}<span><small>CHAMBER ${index+1}</small><strong>${piece.name}</strong></span><b>M${level}</b></div><p>${combo?`<em>${combo.name}</em> · ${combo.description}`:`${piece.damage} base damage · place directly after another trap to discover a combo.`}</p><button data-action="upgrade-trap" data-cell="${cell}" ${level>=3||state.dungeon.rank<level+1?"disabled":""}>${level>=3?"Mastered":state.dungeon.rank<level+1?`Rank ${level+1} required`:`Upgrade · ${nextCost}g`}</button></article>`;}).join("")}</div>`:`<div class="empty-state">Install a trap on an active chamber to begin mastering it.</div>`}</div>
  </section>`;
}

function renderDungeonArchitecture(){
  const path=activeDungeonPath(),rooms=Object.entries(state.dungeon.rooms||{}),bonuses=dungeonRoomBonuses(state),interior=path.slice(1,-1);
  return `<section class="architect-workshop"><header><div><span class="eyebrow">DUNGEON ARCHITECT</span><h3>${DUNGEON_THEMES[state.dungeon.themeId].name}</h3><p>Rooms coexist with traps and guardians, modifying the real defense simulation.</p></div><strong>${rooms.length} SPECIAL ROOMS · ${bonuses.threat>=0?"+":""}${bonuses.threat} THREAT</strong></header>
    <div class="theme-grid">${Object.entries(DUNGEON_THEMES).map(([id,theme])=>{const active=id===state.dungeon.themeId,owned=state.dungeon.unlockedThemes.includes(id),locked=state.dungeon.rank<theme.rank;return `<button data-action="set-dungeon-theme" data-theme="${id}" class="${active?"active":""}" ${active||locked?"disabled":""} style="--theme-ground:${theme.ground};--theme-stone:${theme.stone}"><i></i><span><strong>${theme.name}</strong><small>${theme.description}</small></span><b>${active?"ACTIVE":locked?`RANK ${theme.rank}`:owned?"APPLY":`${theme.goldCost}g`}</b></button>`;}).join("")}</div>
    <div class="room-builder"><label>Chamber<select id="architect-cell">${interior.map((cell,index)=>`<option value="${cell}">Chamber ${index+2} · ${DUNGEON_PIECES[state.dungeon.cells[cell]].name}${state.dungeon.rooms[cell]?` · ${DUNGEON_ROOMS[state.dungeon.rooms[cell]].name}`:""}</option>`).join("")}</select></label><label>Room plan<select id="architect-room">${Object.entries(DUNGEON_ROOMS).map(([id,room])=>`<option value="${id}">${room.name} · rank ${room.rank} · ${room.goldCost}g${room.sealCost?` · ${room.sealCost}s`:""}</option>`).join("")}</select></label><button data-action="build-dungeon-room">Build or replace room</button></div>
    <div class="built-rooms">${rooms.length?rooms.map(([cell,roomId])=>{const room=DUNGEON_ROOMS[roomId],position=path.indexOf(Number(cell))+1;return `<article><span><small>CHAMBER ${position}</small><strong>${room.name}</strong><em>${room.description}</em></span><button data-action="remove-dungeon-room" data-cell="${cell}">Dismantle</button></article>`;}).join(""):`<span>No special rooms built. Heart rank 2 unlocks the first plans.</span>`}</div>
  </section>`;
}

function renderGarrison() {
  const monsters=monsterCells();
  return `<section class="panel garrison-panel"><div class="panel-head"><div><span class="eyebrow">ARM THE DEFENDERS</span><h2>Guardian Garrison</h2></div><strong>${monsters.length} stationed</strong></div>
    <p class="muted">Give each placed monster persistent equipment, one attuned spell, and up to three one-use potions. Every loadout changes Threat and simulated defense.</p>
    <div class="garrison-grid">${monsters.length?monsters.map(({index,piece})=>guardianCard(index,piece)).join(""):`<div class="empty-state">Place a monster in the dungeon to unlock its loadout.</div>`}</div>
  </section>`;
}

function guardianCard(cell,piece) {
  const stats=monsterStats(state,cell),loadout=stats.creature||state.dungeon.monsterGear[cell]||{equipment:{},spellId:null,potions:0};
  const gear=Object.entries(loadout.equipment||{}).filter(([,item])=>item);
  return `<article class="guardian-card"><header>${realisticEntityIcon(stats.creature?.speciesId||state.dungeon.cells[cell],"guardian-art",piece.name)}<div><span>CHAMBER ${activeDungeonPath().indexOf(cell)+1}${stats.creature?` · LV ${stats.creature.level} ${creatureLifeStage(stats.creature).toUpperCase()}`:""}</span><h3>${stats.creature?escapeHtml(stats.creature.name):piece.name}</h3><small>${piece.name}</small></div><b>${stats.hp} HP · ${stats.attack} ATK · ${stats.armor} ARM</b></header>
    <div class="guardian-gear">${gear.length?gear.map(([slot,item])=>`<button data-action="unequip-monster" data-cell="${cell}" data-slot="${slot}" title="Return to inventory"><span>${SLOT_LABELS[slot]||slot}</span><strong style="color:${item.color}">${escapeHtml(itemDisplayName(item))}</strong></button>`).join(""):`<span>No equipment assigned. Use the Forge.</span>`}</div>
    <div class="guardian-controls"><select id="guardian-spell-${cell}" aria-label="Spell for ${piece.name}">${SPELLS.map(spell=>`<option value="${spell.id}" ${loadout.spellId===spell.id?"selected":""}>${spell.name} · ${spell.element} · ${spell.power<0?"heal "+(-spell.power):spell.power+" power"}</option>`).join("")}</select><button data-action="attune-guardian" data-cell="${cell}">${stats.spell?"Re-attune":"Attune"} · 1 essence</button><button data-action="potion-guardian" data-cell="${cell}">Potion charges · ${loadout.potions||0}/3</button></div>
  </article>`;
}

function dungeonCell(id, index) {
  const path = activeDungeonPath(), pathIndex = path.indexOf(index), isPath = pathIndex >= 0;
  const endpoint = pathIndex === 0 ? "entry" : pathIndex === path.length - 1 ? "heart" : "";
  const p = DUNGEON_PIECES[id];
  return `<button class="dungeon-cell ${isPath ? "path" : "rock"} ${p.kind} ${endpoint}" ${isPath ? `data-cell="${index}"` : "disabled"} title="${endpoint || p.name}">
    ${endpoint === "entry" ? `<b>IN</b>` : endpoint === "heart" ? `<b>♥</b>` : p.kind === "empty" ? `<b>·</b>` : `${realisticEntityIcon(id,"cell-art",p.name)}<small>${p.name.split(" ")[0]}</small>`}
  </button>`;
}

function renderDungeonBoard2D(layout) {
  return `<div class="dungeon-board-2d"><header><span><b>TACTICAL HEARTWAY</b><small>Click any lit chamber to install the selected defense.</small></span><em>${layout.path.length} CHAMBERS</em></header><div class="dungeon-board-frame"><div class="board-runes" aria-hidden="true">✦　◇　✦</div><div class="dungeon-grid" aria-label="Dungeon construction grid">${state.dungeon.cells.map((id,index)=>dungeonCell(id,index)).join("")}</div></div><footer><span>IN <i></i> entry</span><span>♥ <i></i> dungeon heart</span></footer></div>`;
}

function renderRaid() {
  if (!state.raid) return renderRaidLanding();
  const r = state.raid;
  const active = r.party[r.activeHeroIndex];
  return `
    <section class="raid-banner panel">
      <div><span class="eyebrow">${EXPEDITION_DIFFICULTIES[r.difficultyId]?.name.toUpperCase()} · KEEPER ${escapeHtml(r.keeper)} · LEVEL ${r.level}</span><h2>${escapeHtml(r.name)}</h2><small class="raid-modifier">${EXPEDITION_MODIFIERS[r.modifierId]?.name} · ${EXPEDITION_MODIFIERS[r.modifierId]?.description}</small></div>
      <div class="raid-track">${r.encounters.map((e, i) => `<i class="${e.cleared ? "cleared" : ""} ${i === r.position ? "current" : ""} ${e.elite?"elite":""}">${i === r.encounters.length - 1 ? "♥" : e.elite?"★":i + 1}</i>`).join("")}</div>
      ${!r.complete ? `<div class="raid-controls"><button data-action="auto-toggle">${r.autoPaused?"Resume":"Pause"} auto-battle</button><button class="danger-text" data-action="retreat">Retreat</button></div>` : `<button class="quiet" data-action="new-raid">Find another dungeon</button>`}
    </section>
    <div class="combat-layout">
      <section class="panel combat-stage ${combatFx ? `fx-${combatFx.action || combatFx.kind}` : ""}">
        <div class="combat-rhythm"><div><span class="eyebrow">AUTOMATIC FORMATION</span><strong>${r.autoPaused?"Battle paused":"Watching the keeper and bonded creatures fight"}</strong></div><div class="momentum" title="The expedition builds momentum automatically as its members act."><span>MOMENTUM</span><b>${Array.from({length:6},(_,i)=>`<i class="${i<(r.momentum||0)?"lit":""}"></i>`).join("")}</b></div></div>
        <div class="raid-party">${r.party.map((member,index)=>partyMember(member,index,r)).join("")}</div>
        ${state.settings.presentationMode==="3d"?`<div id="raid-3d" class="raid-3d" aria-label="Three-dimensional automatic battle">${combatFx ? combatFloat(combatFx) : ""}</div>`:renderRaidBoard2D(r)}
        <div class="combatant hero-combatant">${activeHeroSigil(active)}<div><span>${r.complete ? "EXPEDITION SURVIVORS" : active.kind==="hero"?`KEEPER HERO · ${CLASSES[active.classId].title}`:`BONDED ${CREATURE_SPECIES[active.speciesId].name.toUpperCase()}`}</span><h3>${r.complete ? `${r.party.filter(m=>m.hp>0).length} expedition members standing` : escapeHtml(raidMemberName(state,active))}</h3>${bar(active.hp,active.maxHp,"hp",`${Math.max(0,active.hp)} / ${active.maxHp} HP`)}${active.maxMana?bar(active.mana,active.maxMana,"mana",`${active.mana} / ${active.maxMana} MANA`):""}</div></div>
        <div class="versus">${r.complete ? (r.won ? "VICTORY" : "DEFEAT") : "VS"}</div>
        ${r.enemy ? enemyCard(r.enemy) : `<div class="combatant unknown"><i>${r.complete ? (r.won ? "♛" : "☠") : "?"}</i><div><span>${r.complete ? "EXPEDITION ENDED" : "NEXT CHAMBER"}</span><h3>${r.complete ? (r.won ? "Heart Broken" : "Hoard Lost") : "Unknown"}</h3><p>${r.complete ? r.log[0] : "Advance when you are ready."}</p></div></div>`}
        <div class="combat-actions">${combatActions(r)}</div>
      </section>
      <aside class="panel combat-log"><span class="eyebrow">EXPEDITION LOG</span>${r.log.slice(0,9).map((line,i)=>`<p class="${i===0?"latest":""}">${escapeHtml(line)}</p>`).join("")}</aside>
    </div>`;
}

function memberVisual(member){return member.kind==="creature"?{name:member.name,color:CREATURE_SPECIES[member.speciesId].color,sigil:DUNGEON_PIECES[member.speciesId].glyph,speciesId:member.speciesId}:{name:CLASSES[member.classId].name,color:CLASSES[member.classId].color,sigil:CLASSES[member.classId].sigil,classId:member.classId};}
function activeHeroSigil(member) { const c=memberVisual(member); return member.kind==="creature"?realisticEntityIcon(c.speciesId,"sigil-art",c.name):`<img class="sigil-art" src="${heroPortraitSrc(c.classId)}" alt="${escapeHtml(c.name)}" />`; }
function partyMember(member,index,raid) { const c=memberVisual(member),spent=(raid.actedThisRound||[]).includes(index),art=member.kind==="creature"?realisticEntityIcon(c.speciesId,"party-art",c.name):`<img class="party-art" src="${heroPortraitSrc(c.classId)}" alt="" />`; return `<div class="party-member ${index===raid.activeHeroIndex?"active":""} ${member.hp<=0?"fallen":""} ${spent?"spent":""}" style="--class:${c.color}" aria-label="${escapeHtml(c.name)}">${art}<span><strong>${escapeHtml(c.name)}</strong><small>${spent?"ACTED":`${Math.max(0,member.hp)}/${member.maxHp} HP`}</small></span></div>`; }

function combatFloat(fx) {
  const enemyText = fx.damage ? `<b class="float-number enemy-float ${fx.critical?"critical":""}">−${fx.damage}${fx.critical?" CRIT":""}</b>` : "";
  const heroText = fx.healed ? `<b class="float-number hero-float heal">+${fx.healed}</b>` : fx.enemy?.damage ? `<b class="float-number hero-float">−${fx.enemy.damage}</b>` : "";
  return `<div class="combat-floats" aria-hidden="true">${heroText}${enemyText}</div>`;
}

function renderRaidBoard2D(raid) {
  const region=RIVAL_REGIONS[raid.regionId]||RIVAL_REGIONS.miredeep,enemy=raid.enemy,sovereign=REGIONAL_SOVEREIGNS[enemy?.sovereignId];
  const party=raid.party.map((member,index)=>{const visual=memberVisual(member),art=member.kind==="hero"?`<img src="${heroPortraitSrc(member.classId)}" alt="" />`:realisticEntityIcon(member.speciesId,"battle-art",visual.name);return `<div class="battle-token ${member.hp<=0?"fallen":""} ${index===raid.activeHeroIndex?"active":""}" style="--token:${visual.color}">${art}<span><strong>${escapeHtml(visual.name)}</strong><small>${Math.max(0,member.hp)} HP</small></span></div>`;}).join("");
  return `<div class="raid-board-2d ${sovereign?"sovereign-board":""}" style="--region:${region.color}"><div class="arena-depth" aria-hidden="true"><i></i><i></i><i></i></div><div class="battle-side party-side"><span class="board-label">KEEPER EXPEDITION</span><div>${party}</div></div><div class="battle-center"><span>${sovereign?`PHASE ${(enemy.phaseIndex||0)+1}`:`CHAMBER ${Math.max(1,raid.position+1)}`}</span><b>⚔</b><small>${enemy?"AUTOMATIC BATTLE":"SCOUTING"}</small></div><div class="battle-side enemy-side"><span class="board-label">${sovereign?"REGIONAL SOVEREIGN":"HEART GUARDIAN"}</span>${enemy?`<div class="boss-token">${realisticEntityIcon(enemy.id,"boss-art",enemy.name)}<span><strong>${escapeHtml(enemy.name)}</strong><small>${sovereign?escapeHtml(sovereign.phases[enemy.phaseIndex||0].name):`${Math.max(0,enemy.hp)} HP`}</small></span></div>`:`<div class="boss-token unknown-token"><i>?</i><span><strong>Unseen chamber</strong><small>The party advances automatically</small></span></div>`}</div>${combatFx?combatFloat(combatFx):""}</div>`;
}

function renderRaidLanding() {
  const companions=state.creatures.filter(creature=>creature.assignment==="expedition").slice(0,3),preview=expeditionPreview(state),condition=currentWorldCondition(state),bounty=condition.bounty,conditionRegion=RIVAL_REGIONS[condition.regionId],bountyReady=bounty.progress>=bounty.target&&!bounty.claimed;
  return `<section class="panel atlas-panel"><div class="atlas-head"><div><span class="eyebrow">RIVAL ATLAS · RENOWN ${state.campaign.renown}</span><h2>Choose where the bonds are tested.</h2><p class="muted">Each region ends with a named three-phase Sovereign and a guaranteed relic-set tribute. Higher risk increases every other heart reward.</p></div><div class="atlas-sigil" style="--region:${preview.region.color}">♜</div></div>
    <article class="world-condition" style="--region:${conditionRegion.color}"><i>${conditionRegion.element.slice(0,1)}</i><div><span>LIVING ATLAS · ${condition.daysRemaining} DAY${condition.daysRemaining===1?"":"S"} REMAIN</span><h3>${condition.name}</h3><p>${condition.description}</p><small>${conditionRegion.name} carries ${EXPEDITION_MODIFIERS[condition.modifierId].name} · ×${condition.rewardMult.toFixed(2)} total rewards</small></div><aside><strong>REGIONAL BOUNTY</strong><span>Break ${bounty.target} ${conditionRegion.name} hearts</span><div><b style="width:${Math.min(100,bounty.progress/bounty.target*100)}%"></b></div><small>${bounty.progress}/${bounty.target} · ${Object.entries(bounty.reward).map(([key,value])=>`${value} ${key}`).join(" · ")}</small><button data-action="claim-atlas-bounty" ${bountyReady?"": "disabled"}>${bounty.claimed?"Claimed":bountyReady?"Claim bounty":"In progress"}</button></aside></article>
    <div class="region-grid">${Object.entries(RIVAL_REGIONS).map(([id,region])=>{const locked=state.campaign.renown<region.unlockRenown,sovereign=REGIONAL_SOVEREIGNS[region.sovereignId],wins=state.campaign.sovereignVictories?.[region.sovereignId]||0;return `<button data-action="select-region" data-region="${id}" class="region-card ${state.expedition.regionId===id?"selected":""} ${locked?"locked":""}" style="--region:${region.color}"><i>${region.element.slice(0,1)}</i><span><small>${locked?`RENOWN ${region.unlockRenown} REQUIRED`:region.element.toUpperCase()}</small><strong>${region.name}</strong><em>${region.description}</em></span><b>${locked?"SEALED":`${escapeHtml(sovereign.name)} · ${wins} DEFEATS`}</b></button>`;}).join("")}</div>
    <div class="difficulty-grid">${Object.entries(EXPEDITION_DIFFICULTIES).map(([id,difficulty])=>{const locked=state.heroes[state.selectedClass].level<difficulty.unlockLevel;return `<button data-action="select-difficulty" data-difficulty="${id}" class="difficulty-card ${state.expedition.difficultyId===id?"selected":""} ${locked?"locked":""}"><span>${locked?`LEVEL ${difficulty.unlockLevel}`:`×${difficulty.rewardMult.toFixed(1)} REWARDS`}</span><strong>${difficulty.name}</strong><small>${difficulty.description}</small></button>`;}).join("")}</div>
    ${renderExpeditionDoctrine(companions)}
    <div class="expedition-brief"><div><span>Selected route</span><strong style="color:${preview.region.color}">${preview.region.name} · ${preview.difficulty.name}</strong><small>${preview.difficulty.routeLength} chambers · ${preview.regionId===condition.regionId?condition.name:"random dungeon mutator"} · ${Math.round(preview.difficulty.eliteChance*100)}% elite chance</small></div><div><span>Risk reading</span><strong class="risk-${preview.risk.toLowerCase()}">${preview.risk}</strong><small>${preview.squadPower} squad power · ${preview.recommendedPower} recommended</small></div><div><span>Formation</span><strong>1 + ${companions.length}</strong><small>Keeper and bonded creatures</small></div><button class="primary large" data-action="begin-raid" ${preview.locked?"disabled":""}>Enter ${preview.region.name}</button></div>
  </section>`;
}

function renderExpeditionDoctrine(companions){
  const doctrine=expeditionDoctrine(state),ordered=[...companions].sort((a,b)=>doctrine.creatureOrder.indexOf(a.id)-doctrine.creatureOrder.indexOf(b.id));
  const formation=ordered.map(creature=>({kind:"creature",id:creature.id,name:creature.name,color:CREATURE_SPECIES[creature.speciesId].color,sigil:DUNGEON_PIECES[creature.speciesId].glyph}));
  const hero={kind:"hero",name:CLASSES[state.selectedClass].name,color:CLASSES[state.selectedClass].color,sigil:CLASSES[state.selectedClass].sigil};
  formation.splice(doctrine.keeperPosition==="front"?0:doctrine.keeperPosition==="rear"?formation.length:Math.min(1,formation.length),0,hero);
  return `<section class="doctrine-panel"><div class="doctrine-head"><div><span class="eyebrow">V1.2 · EXPEDITION DOCTRINE</span><h3>Give the automatic party its orders.</h3><p>Front positions attract more enemy intents and act earlier. Policies decide when the simulation guards, drinks, and casts.</p></div><b>${EXPEDITION_STANCES[doctrine.stance].name.toUpperCase()}</b></div>
    <div class="doctrine-controls"><label>Stance<select id="doctrine-stance">${Object.entries(EXPEDITION_STANCES).map(([id,item])=>`<option value="${id}" ${id===doctrine.stance?"selected":""}>${item.name} · ${item.description}</option>`).join("")}</select></label><label>Spell policy<select id="doctrine-spell">${Object.entries(SPELL_POLICIES).map(([id,item])=>`<option value="${id}" ${id===doctrine.spellPolicy?"selected":""}>${item.name} · ${item.description}</option>`).join("")}</select></label><label>Potion policy<select id="doctrine-potion">${Object.entries(POTION_POLICIES).map(([id,item])=>`<option value="${id}" ${id===doctrine.potionPolicy?"selected":""}>${item.name} · ${item.description}</option>`).join("")}</select></label><label>Keeper position<select id="doctrine-position">${Object.entries(KEEPER_POSITIONS).map(([id,item])=>`<option value="${id}" ${id===doctrine.keeperPosition?"selected":""}>${item.name} · ${item.description}</option>`).join("")}</select></label><button data-action="save-doctrine">Prepare doctrine</button></div>
    <div class="formation-order"><span>ACTING ORDER · FRONT TO REAR</span><div>${formation.map((member,index)=>`<article style="--member:${member.color}"><i>${member.sigil}</i><span><small>${index+1} · ${member.kind.toUpperCase()}</small><strong>${escapeHtml(member.name)}</strong></span>${member.kind==="creature"?`<b><button data-action="formation-up" data-id="${member.id}" aria-label="Move ${escapeHtml(member.name)} forward">↑</button><button data-action="formation-down" data-id="${member.id}" aria-label="Move ${escapeHtml(member.name)} backward">↓</button></b>`:"<em>POSITIONED</em>"}</article>`).join("")}</div></div></section>`;
}

function enemyCard(enemy) {
  const intent=enemy.intent, target=intent ? state.raid.party[intent.targetIndex] : null,sovereign=REGIONAL_SOVEREIGNS[enemy.sovereignId],phase=sovereign?.phases[enemy.phaseIndex||0];
  return `<div class="combatant enemy-combatant ${enemy.elite?"elite-enemy":""} ${sovereign?"sovereign-enemy":""}">${realisticEntityIcon(enemy.id,"combatant-art",enemy.name)}<div><span>${sovereign?`${enemy.title} · PHASE ${(enemy.phaseIndex||0)+1}/${sovereign.phases.length}`:enemy.elite?"ELITE GUARDIAN":"DUNGEON GUARDIAN"}</span><h3>${enemy.name}</h3>${phase?`<strong class="phase-name">${phase.name}</strong>`:""}${bar(enemy.hp,enemy.maxHp,"enemy-hp",`${Math.max(0,enemy.hp)} / ${enemy.maxHp} HP`)}<p>${enemy.attack} attack · ${enemy.armor} armor${enemy.status?.ward?" · warded":""}</p></div>${intent?`<div class="enemy-intent intent-${intent.id}"><i>${intent.glyph}</i><span><small>NEXT INTENT</small><strong>${intent.label}</strong><em>${intent.aoe?"Targets the whole expedition":`Targets ${target?escapeHtml(raidMemberName(state,target)):"the expedition"}`}</em></span><p>${intent.description}</p></div>`:""}</div>`;
}
function bar(value,max,kind,label) { return `<div class="bar ${kind}"><i style="width:${pct(value,max)}%"></i><span>${label}</span></div>`; }
function combatActions(r) {
  if (r.complete) return r.won && r.rewards ? `<div class="reward-strip"><span>${EXPEDITION_DIFFICULTIES[r.difficultyId]?.name} hoard claimed automatically</span><strong>${r.rewards.gold}g · ${r.rewards.seals} seals · ${r.rewards.loot.length} items · ${CREATURE_SPECIES[r.rewards.egg.speciesId].name} egg${r.rewards.runeId?` · ${RUNE_TYPES[r.rewards.runeId].name}`:""}</strong>${r.rewards.sovereignItem?`<small>SOUL-TROPHY · ${escapeHtml(itemDisplayName(r.rewards.sovereignItem))}</small>`:""}</div>` : "";
  return `<div class="auto-battle-status ${r.autoPaused?"paused":""}"><i>${r.autoPaused?"Ⅱ":"▶"}</i><span><strong>${r.autoPaused?"Expedition paused":"Auto-battle in progress"}</strong><small>${r.enemy?`${escapeHtml(raidMemberName(state,r.party[r.activeHeroIndex]))} is choosing the next move.`:`Scouting chamber ${r.position+2}…`}</small></span></div>`;
}

function renderHero() {
  const stats = heroStats(state), current = CLASSES[state.selectedClass], hero = state.heroes[state.selectedClass];
  const nextLevel = heroXpToNext(hero.level), band = progressionBand(hero.level);
  return `<div class="hero-layout">
    <section class="panel class-panel"><span class="eyebrow">YOUR ONE PERSISTENT HERO</span>
      <div class="hero-summary keeper-hero" style="--class:${current.color}"><img class="portrait" src="${heroPortraitSrc(state.selectedClass)}" alt="${current.name}" /><div><span class="eyebrow">LEVEL ${hero.level} · <b style="color:${band.color}">${band.name.toUpperCase()}</b> KEEPER</span><h2>${current.name}</h2><p>${current.title} · ${current.elements.join(" · ")}</p><div class="xp"><i style="width:${pct(hero.xp,nextLevel)}%"></i></div><small>${hero.xp} / ${nextLevel} XP · progression supports level 999</small></div></div>
      <div class="stat-grid"><div><span>Health</span><strong>${stats.maxHp}</strong></div><div><span>Mana</span><strong>${stats.maxMana}</strong></div><div><span>Attack</span><strong>${stats.attack}</strong></div><div><span>Armor</span><strong>${stats.armor}</strong></div></div>
      <p class="muted">This is the only hero you control and equip. Creatures provide the changing roster and can move between travel, defense, and rest.</p>
    </section>
    <section class="panel equipment-panel"><div class="panel-head"><div><span class="eyebrow">KEEPER EQUIPMENT</span><h2>Thirteen slots</h2></div></div><div class="equipment-grid">${Object.entries(SLOT_LABELS).map(([slot,label])=>equipmentSlot(slot,label)).join("")}</div>${renderActiveSets(state.heroes[state.selectedClass].equipment)}</section>
    ${renderKeeperMastery()}
    <section class="panel menagerie-panel">${renderMenagerie()}</section>
  </div>`;
}

function renderKeeperMastery(){
  const budget=keeperTalentBudget(state),bonuses=keeperTalentBonuses(state),respecCost=90+budget.spent*55;
  const effects=[bonuses.maxHp&&`+${bonuses.maxHp} HP`,bonuses.maxMana&&`+${bonuses.maxMana} mana`,bonuses.attack&&`+${bonuses.attack} attack`,bonuses.armor&&`+${bonuses.armor} armor`,bonuses.spellPower&&`+${bonuses.spellPower} spell power`,bonuses.lootLevel&&`+${bonuses.lootLevel} loot level`,bonuses.creatureMult&&`+${Math.round(bonuses.creatureMult*100)}% pack stats`,bonuses.bondGain&&`+${bonuses.bondGain} bond gain`,bonuses.startingMomentum&&`+${bonuses.startingMomentum} starting momentum`].filter(Boolean);
  return `<section class="panel keeper-mastery"><div class="panel-head"><div><span class="eyebrow">V1.1 · KEEPER MASTERY</span><h2>One Keeper. Three disciplines.</h2><p class="muted">Gain one point now, another every two Keeper levels, and another every two Renown ranks. Deeper talents require two, then five ranks in their branch.</p></div><div class="mastery-budget"><strong>${budget.available}</strong><span>POINT${budget.available===1?"":"S"} READY</span><small>${budget.spent} / ${budget.earned} assigned</small></div></div>
    <div class="keeper-branches">${Object.entries(KEEPER_TALENT_BRANCHES).map(([branchId,branch])=>`<article class="keeper-branch" style="--branch:${branch.color}"><header><div><span>${branch.name.toUpperCase()}</span><h3>${keeperBranchProgress(state,branchId)} ranks</h3></div><i>${branch.name.slice(0,1)}</i></header><p>${branch.description}</p><div class="talent-stack">${branch.talents.map(talentId=>talentCard(talentId)).join("")}</div></article>`).join("")}</div>
    <footer class="mastery-footer"><span>${effects.length?`Active: ${effects.join(" · ")}`:"Assign your first point to shape this Keeper."}</span><button class="danger-text" data-action="respec-mastery" ${budget.spent?"":"disabled"}>Rekindle all · ${respecCost}g</button></footer></section>`;
}

function talentCard(talentId){
  const talent=KEEPER_TALENTS[talentId],rank=state.keeperMastery.ranks[talentId]||0,branchRanks=keeperBranchProgress(state,talent.branch),gate=talent.tier===2?2:talent.tier===3?5:0,budget=keeperTalentBudget(state),locked=branchRanks<gate,maxed=rank>=talent.maxRank;
  return `<button class="talent-card ${locked?"locked":""} ${maxed?"maxed":""}" data-action="learn-mastery" data-talent="${talentId}" ${locked||maxed||!budget.available?"disabled":""}><i>${talent.tier}</i><span><strong>${talent.name}</strong><small>${talent.description}</small>${locked?`<em>Requires ${gate} branch ranks</em>`:""}</span><b>${rank}/${talent.maxRank}</b></button>`;
}

function renderMenagerie(){
  return `<div class="panel-head"><div><span class="eyebrow">LIVING ROSTER</span><h2>The Menagerie</h2><p class="muted">Traits make every hatchling different. Time, shared victories, training, and an eventual awakening turn each creature into a persistent companion.</p></div><div class="menagerie-count"><strong>${state.creatures.length}</strong><span>HATCHED</span></div></div>
    <div class="nursery"><div><span class="eyebrow">NURSERY</span><h3>${state.eggs.length} egg${state.eggs.length===1?"":"s"} incubating</h3></div><div class="egg-list">${state.eggs.length?state.eggs.map(eggCard).join(""):`<p class="muted">No eggs are waiting. Buy one or recover one from a rival dungeon heart.</p>`}</div></div>
    <div class="egg-shop"><span class="eyebrow">EGG BROKER</span>${Object.entries(CREATURE_SPECIES).map(([id,species])=>`<button data-action="buy-egg" data-species="${id}"><i style="--egg:${species.color}"></i><span><strong>${species.name}</strong><small>${species.hatchDays} days · ${species.temperament}</small></span><b>${species.eggCost}g</b></button>`).join("")}</div>
    <div class="creature-grid">${state.creatures.map(creatureCard).join("")}</div>`;
}

function eggCard(egg){const species=CREATURE_SPECIES[egg.speciesId],trait=CREATURE_TRAITS[egg.traitId];return `<article class="egg-card" style="--egg:${species.color}"><i></i><div><span>${egg.quality?"VIGOROUS ":""}${species.name.toUpperCase()} EGG</span><strong>${egg.progress}/${egg.hatchDays} warmth</strong><small>${trait?`Omen: ${trait.name} · `:""}Advances after every expedition or defense day.</small></div><button data-action="incubate" data-id="${egg.id}">Warm now · 30g</button></article>`;}

function creatureCard(creature){
  const species=CREATURE_SPECIES[creature.speciesId],stats=creatureStats(state,creature),stage=creatureLifeStage(creature),needed=creature.level*55;
  const trait=CREATURE_TRAITS[creature.traitId],awakening=CREATURE_AWAKENINGS[creature.awakeningId],bondTier=creatureBondTier(creature),canAwaken=!awakening&&creature.level>=4&&creature.ageDays>=18&&creature.assignment==="reserve",lineage=CREATURE_LINEAGES[creature.lineageId],lineageOptions=creatureLineageOptions(creature),memories=creatureMemoryLedger(creature);
  const path=activeDungeonPath();
  const openCells=path.filter((cell,index)=>index>0&&index<path.length-1&&(state.dungeon.cells[cell]==="empty"||cell===creature.dungeonCell));
  const current=creature.assignment==="dungeon"?`dungeon:${creature.dungeonCell}`:creature.assignment;
  const gear=Object.entries(creature.equipment||{}).filter(([,item])=>item),spell=SPELLS.find(entry=>entry.id===creature.spellId);
  return `<article class="creature-card" style="--beast:${species.color}"><header>${realisticEntityIcon(creature.speciesId,"creature-art",species.name)}<div><span>LV ${creature.level} · ${stage.toUpperCase()} · AGE ${creature.ageDays} DAYS</span><h3>${escapeHtml(creature.name)}</h3><small>${species.name} · ${species.temperament}</small></div><b>${creature.assignment.toUpperCase()}</b></header>
    <div class="creature-identity"><span><b>${trait.name}</b><small>${trait.description}</small></span><span><b>${awakening?awakening.name:bondTier}</b><small>${awakening?awakening.description:`${creature.bond}/100 bond`}</small></span></div>
    <div class="lineage-block"><div class="lineage-heading"><span><small>SPECIES LINEAGE</small><strong>${lineage?`${lineage.name} · R${creature.lineageRank}`:"Unshaped memory"}</strong></span><em>${lineage?lineage.description:"At level 2, rest this creature and choose one permanent species path."}</em></div><div class="lineage-options">${(lineage?[{id:creature.lineageId,...lineage}]:lineageOptions).map(path=>{const next=(creature.lineageRank||0)+1,req=[0,2,5,9][next]||9,costGold=[0,100,180,300][next]||300,costEssence=[0,2,4,7][next]||7,ready=creature.assignment==="reserve"&&creature.level>=req&&next<=3;return `<button data-action="advance-lineage" data-id="${creature.id}" data-lineage="${path.id}" ${ready?"":"disabled"}><span><strong>${path.name}${lineage?` · rank ${next}`:""}</strong><small>+${path.hp} HP · +${path.attack} ATK · +${path.armor} ARM per rank</small></span><b>${next>3?"MASTERED":`LV ${req} · ${costGold}g · ${costEssence}e`}</b></button>`;}).join("")}</div><div class="memory-ledger"><span>LIFE MEMORIES</span>${memories.map(memory=>`<i title="${memory.description}">${memory.name}</i>`).join("")}</div></div>
    <div class="bond-track" title="Bond grows through shared expeditions, defense, and training"><i style="width:${creature.bond}%"></i></div>
    <div class="creature-stats"><span>${stats.maxHp}<small>HP</small></span><span>${stats.attack}<small>ATK</small></span><span>${stats.armor}<small>ARM</small></span></div><div class="xp creature-xp"><i style="width:${pct(creature.xp,needed)}%"></i></div><small class="xp-copy">${creature.xp}/${needed} XP · grows older whenever a game day passes</small>
    <div class="creature-name"><input id="creature-name-${creature.id}" maxlength="22" value="${escapeHtml(creature.name)}" aria-label="Name for ${escapeHtml(creature.name)}"/><button data-action="rename-creature" data-id="${creature.id}">Rename</button><button data-action="train-creature" data-id="${creature.id}" ${creature.assignment==="reserve"?"":"disabled"}>Train · 65g</button></div>
    <div class="creature-loadout"><div class="creature-gear">${gear.length?gear.map(([slot,item])=>`<button data-action="unequip-creature" data-id="${creature.id}" data-slot="${slot}" title="Return to inventory"><span>${SLOT_LABELS[slot]||slot}</span><strong style="color:${item.color}">${escapeHtml(itemDisplayName(item))}</strong></button>`).join(""):`<span>No creature equipment · assign gear in the Forge</span>`}</div><select id="creature-spell-${creature.id}" aria-label="Spell for ${escapeHtml(creature.name)}">${SPELLS.map(entry=>`<option value="${entry.id}" ${entry.id===creature.spellId?"selected":""}>${entry.name} · ${entry.element}</option>`).join("")}</select><button data-action="attune-creature" data-id="${creature.id}">${spell?"Re-attune":"Attune spell"} · 1 essence</button><button data-action="potion-creature" data-id="${creature.id}">Potions · ${creature.potions}/3</button></div>
    ${awakening?`<div class="awakening-mark"><span>AWAKENED ${awakening.name.toUpperCase()}</span><strong>${awakening.description}</strong></div>`:`<div class="awakening-row"><select id="awakening-${creature.id}" ${canAwaken?"":"disabled"}>${Object.entries(CREATURE_AWAKENINGS).map(([id,path])=>`<option value="${id}">${path.name} · ${path.description}</option>`).join("")}</select><button data-action="awaken-creature" data-id="${creature.id}" ${canAwaken?"":"disabled"}>Awaken · 220g · 5 essence · 1 seal</button><small>${canAwaken?"Choose a permanent path.":"Requires level 4, Adult age, and rest."}</small></div>`}
    <div class="creature-assignment"><select id="creature-role-${creature.id}" aria-label="Assignment for ${escapeHtml(creature.name)}"><option value="reserve" ${current==="reserve"?"selected":""}>Rest in Menagerie</option><option value="expedition" ${current==="expedition"?"selected":""}>Travel with hero</option>${openCells.map(cell=>`<option value="dungeon:${cell}" ${current===`dungeon:${cell}`?"selected":""}>Guard chamber ${path.indexOf(cell)+1}</option>`).join("")}</select><button data-action="assign-creature" data-id="${creature.id}">Confirm role</button></div></article>`;
}

function equipmentSlot(slot,label) {
  const item = state.heroes[state.selectedClass].equipment[slot];
  return `<button class="equipment-slot ${item?"filled":""}" ${item?`data-unequip="${slot}"`:"disabled"}>${item?itemIcon(item,"slot-icon"):`<span class="slot-placeholder">${label.slice(0,1)}</span>`}<span class="slot-copy"><span>${label}</span>${item?`<strong style="color:${item.color}">${escapeHtml(itemDisplayName(item))}</strong><small>+${item.attack} ATK · +${item.armor} ARM</small>`:`<strong>Empty</strong><small>Equip from the Forge</small>`}</span></button>`;
}

function renderForge() {
  const visible = inventoryView(state), selected = visible.find(i=>i.id===state.selectedInventoryId) || visible[0] || null;
  if (selected) state.selectedInventoryId = selected.id;
  return `<div class="forge-layout">
    <section class="panel inventory-panel"><div class="panel-head"><div><span class="eyebrow">INVENTORY</span><h2>${visible.length} of ${state.inventory.length} items</h2></div></div>${renderInventoryFilters()}<div class="inventory-list">${visible.length?visible.map(item=>itemRow(item,selected?.id===item.id)).join(""):`<div class="empty-state">No items match these rack filters.</div>`}</div>${renderLootCodex()}</section>
    <section class="panel workbench"><span class="eyebrow">THE NAME REMEMBERS</span>${selected?renderWorkbench(selected):`<h2>No item selected</h2><p class="muted">Select recovered equipment to inspect and alter it.</p>`}</section>
    <section class="panel materials"><span class="eyebrow">SALVAGED MATERIALS</span><div class="material-grid">${Object.entries(state.materials).map(([family,tiers])=>`<div><strong>${family}</strong>${tiers.map((n,i)=>`<span title="${QUALITIES[i]}"><i style="--q:${i}"></i>${n}</span>`).join("")}</div>`).join("")}</div><p class="muted small">Dots run from crude to exceptional quality. Current tinkering consumes crude metal and essence.</p>${renderCrafting()}</section>
  </div>`;
}

function renderInventoryFilters() {
  const filters=state.lootFilters;
  return `<div class="inventory-filters"><input id="loot-search" value="${escapeHtml(filters.search)}" placeholder="Search the hoard" aria-label="Search inventory" /><select id="loot-slot" aria-label="Filter by equipment slot"><option value="all">All slots</option>${[...new Set(Object.keys(CRAFT_RECIPES).map(slot=>slot.startsWith("ring")?"ring":slot))].map(slot=>`<option value="${slot}" ${filters.slot===slot?"selected":""}>${SLOT_LABELS[slot]||slot}</option>`).join("")}</select><select id="loot-rarity" aria-label="Filter by rarity"><option value="all">All rarities</option>${RARITIES.map(rarity=>`<option value="${rarity.name}" ${filters.rarity===rarity.name?"selected":""}>${rarity.name}</option>`).join("")}</select><select id="loot-sort" aria-label="Sort inventory"><option value="power" ${filters.sort==="power"?"selected":""}>Power</option><option value="level" ${filters.sort==="level"?"selected":""}>Level</option><option value="value" ${filters.sort==="value"?"selected":""}>Value</option><option value="name" ${filters.sort==="name"?"selected":""}>Name</option></select><label class="favorite-filter"><input id="loot-favorites" type="checkbox" ${filters.favoritesOnly?"checked":""}/> ★ Protected only</label></div>`;
}

function renderLootCodex() {
  const progress=lootCodexProgress(state), codex=state.lootCodex;
  const discovered=(values,found)=>values.map(value=>`<span class="${found.includes(value)?"found":"unknown"}">${found.includes(value)?escapeHtml(value):"Unknown"}</span>`).join("");
  return `<details class="loot-codex"><summary><span><b>Hoard Codex</b><small>${progress.totalFound}/${progress.total} discoveries</small></span><i style="--codex:${pct(progress.totalFound,progress.total)}%"></i></summary><div class="codex-section"><strong>AFFIXES · ${progress.affixes.found}/${progress.affixes.total}</strong><div>${discovered(PREFIXES.map(([name])=>name),codex.affixes)}</div></div><div class="codex-section"><strong>UNIQUE TRAITS · ${progress.traits.found}/${progress.traits.total}</strong><div>${discovered(TRAITS,codex.traits)}</div></div><div class="codex-section"><strong>RARITIES · ${progress.rarities.found}/${progress.rarities.total}</strong><div>${discovered(RARITIES.map(entry=>entry.name),codex.rarities)}</div></div></details>`;
}

function renderCrafting() {
  return `<div class="crafting-bench"><div><span class="eyebrow">REASSEMBLY</span><h3>Forge a new item</h3><p>Consumes 3 matching materials from the chosen quality tier.</p></div><label>Pattern<select id="craft-slot">${Object.entries(CRAFT_RECIPES).map(([slot,family])=>`<option value="${slot}">${SLOT_LABELS[slot]||slot} · ${family}</option>`).join("")}</select></label><label>Quality<select id="craft-quality">${QUALITIES.map((quality,index)=>`<option value="${index}">${quality} · ${30+index*35}g</option>`).join("")}</select></label><button class="primary" data-action="craft">Assemble item</button></div>`;
}

function itemRow(item,selected) {
  const set=ITEM_SETS[item.setId];return `<button class="item-row ${selected?"selected":""} ${item.favorite?"favorite":""} ${set?"set-item":""}" data-item="${item.id}" style="--set:${set?.color||item.color}">${itemIcon(item)}<span><strong style="color:${item.color}">${item.favorite?"★ ":""}${escapeHtml(itemDisplayName(item))}</strong><small>Lv ${item.level}${item.ascension?` · Ascension ${item.ascension}`:""} · ${item.quality} ${item.rarity} · ${item.slot}${set?` · ${set.name}`:""}</small></span><b>${Math.round(calculatePower(item))}</b></button>`;
}
function renderWorkbench(item) {
  const creatures=state.creatures, comparison=itemComparison(state,item), delta=(value)=>`${value>0?"+":""}${value}`,runes=itemRuneBonuses(item),set=ITEM_SETS[item.setId];
  return `<div class="item-focus">${itemIcon(item,"item-orb")}<div><span>${item.quality} ${item.rarity}${item.ascension?` · ASCENSION ${item.ascension}`:""}</span><h2 style="color:${item.color}">${item.favorite?"★ ":""}${escapeHtml(itemDisplayName(item))}</h2><small>Level ${item.level} · ${item.slot} · ${item.value}g value</small></div></div>
    ${set?`<div class="set-banner" style="--set:${set.color}"><span><small>RELIC SET</small><strong>${set.name}</strong></span><p>${set.description}</p></div>`:""}
    <div class="item-stats"><div><span>Attack</span><strong>${item.attack+runes.attack}</strong></div><div><span>Armor</span><strong>${item.armor+runes.armor}</strong></div><div><span>Vitality</span><strong>${runes.vitality}</strong></div><div><span>Potential</span><strong>${item.mods.length}/${item.potential}</strong></div></div>
    <div class="item-comparison ${comparison.equipped?"":"empty"}"><div><span>${comparison.equipped?"COMPARED WITH EQUIPPED":"OPEN HERO SLOT"}</span><strong>${comparison.equipped?escapeHtml(itemDisplayName(comparison.equipped)):`${SLOT_LABELS[item.slot]||item.slot} is empty`}</strong></div><b class="${comparison.power>=0?"better":"worse"}">${delta(comparison.power)} power</b><small>${delta(comparison.attack)} ATK · ${delta(comparison.armor)} ARM</small></div>
    ${item.trait?`<p class="trait">✦ ${escapeHtml(item.trait)}</p>`:""}${item.drawback?`<p class="drawback">◆ ${escapeHtml(item.drawback)}</p>`:""}
    <label>Personal name<input id="custom-name" value="${escapeHtml(item.customName||"")}" maxlength="28" placeholder="e.g. Problem Solver" /></label>
    <div class="work-actions"><button class="primary" data-action="rename">Inscribe name</button><button data-action="equip" data-id="${item.id}">Equip to ${CLASSES[state.selectedClass].name}</button><button data-action="favorite-item" data-id="${item.id}">${item.favorite?"★ Protected":"☆ Protect"}</button><button class="danger-text" data-action="dismantle" data-id="${item.id}" ${item.favorite?"disabled title=\"Protected items cannot be dismantled\"":""}>Dismantle</button></div>
    ${renderRuneForge(item)}
    <div class="guardian-assignment"><label>Bonded creature<select id="creature-target" ${creatures.length?"":"disabled"}>${creatures.length?creatures.map(creature=>`<option value="${creature.id}">${escapeHtml(creature.name)} · ${creature.assignment}</option>`).join(""):`<option>No creatures hatched</option>`}</select></label><button data-action="equip-creature" data-id="${item.id}" ${creatures.length?"":"disabled"}>Equip to creature</button></div>
    <div class="tinker-grid">${Object.entries(TINKER_ACTIONS).map(([id,a])=>`<button data-action="tinker" data-tinker="${id}" data-id="${item.id}"><strong>${a.name}</strong><small>${a.metal} metal · ${a.essence} essence · −${a.stability} stability</small></button>`).join("")}</div>`;
}

function renderRuneForge(item){
  return `<section class="rune-forge"><header><div><span class="eyebrow">RUNEWORK</span><h3>${item.runes.length}/${item.runeSlots} sockets filled</h3></div><button data-action="carve-socket" data-id="${item.id}" ${item.runeSlots>=2?"disabled":""}>Carve socket · ${100+item.runeSlots*90}g · ${3+item.runeSlots*2}e</button></header><div class="socket-row">${Array.from({length:item.runeSlots},(_,index)=>{const runeId=item.runes[index],rune=RUNE_TYPES[runeId];return rune?`<button data-action="unsocket-rune" data-id="${item.id}" data-rune="${runeId}" style="--rune:${rune.color}" title="Remove for 60 gold"><i>◆</i><span><strong>${rune.name}</strong><small>${rune.description}</small></span></button>`:`<span class="empty-socket">EMPTY SOCKET</span>`;}).join("")}${item.runeSlots?"":`<span class="empty-socket locked">NO SOCKETS CARVED</span>`}</div><div class="rune-storage">${Object.entries(RUNE_TYPES).map(([id,rune])=>`<button data-action="socket-rune" data-id="${item.id}" data-rune="${id}" style="--rune:${rune.color}" ${state.runes[id]&&item.runes.length<item.runeSlots&&!item.runes.includes(id)?"":"disabled"}><i>◆</i><span><strong>${rune.name}</strong><small>${rune.description}</small></span><b>×${state.runes[id]}</b></button>`).join("")}</div></section>`;
}

function renderActiveSets(equipment){
  const sets=equipmentSetBonuses(equipment),owned=Object.entries(sets.counts);
  return `<div class="active-sets"><span>RELIC SET HARMONIES</span>${owned.length?owned.map(([id,count])=>{const set=ITEM_SETS[id];return `<i style="--set:${set.color}"><b>${set.name} ${count}/4</b><small>${sets.active.filter(entry=>entry.setId===id).length?sets.active.filter(entry=>entry.setId===id).map(entry=>`${entry.threshold}pc active`).join(" · "):"Next bonus at 2 pieces"}</small></i>`;}).join(""):`<em>No set pieces equipped.</em>`}</div>`;
}

function renderSpells() {
  const usable = new Set(availableSpells(state).map(s=>s.id));
  return `<div class="spell-intro panel"><div><span class="eyebrow">EIGHT FAMILIES · FOUR TIERS</span><h2>Magic is equipment for the mind.</h2></div><p>Spells unlock through hero level and class affinity. Each has mana, power, cooldown and a tactical effect.</p></div>
    <div class="spell-families">${[...new Set(SPELLS.map(s=>s.element))].map(element=>`<section class="panel spell-family element-${element.toLowerCase()}"><div class="panel-head"><div><span class="eyebrow">ELEMENT</span><h2>${element}</h2></div><img class="element-icon" src="assets/icons/element-${element.toLowerCase()}.png" alt="${element}" /></div>${SPELLS.filter(s=>s.element===element).map(s=>`<article class="spell ${usable.has(s.id)?"usable":"locked"}"><div><strong>${s.name}</strong><small>Level ${s.level} · ${s.mana} mana · ${s.cooldown} turn cooldown</small></div><b>${s.power<0?`+${-s.power}`:s.power}</b><p>${s.description}</p><span>${usable.has(s.id)?"USABLE":"LOCKED OR OUTSIDE CLASS AFFINITY"}</span></article>`).join("")}</section>`).join("")}</div>`;
}

function chronicleEntryArt(type, id, known) {
  if (!known) return `<i class="chronicle-unknown" aria-hidden="true">?</i>`;
  if (type === "species") return `<img src="assets/icons/realistic/creature-${id}-v1.png" alt="" />`;
  if (type === "sovereigns") return `<img src="assets/icons/realistic/creature-${REGIONAL_SOVEREIGNS[id].speciesId}-v1.png" alt="" />`;
  if (type === "regions") return `<i class="chronicle-region" style="--entry-color:${RIVAL_REGIONS[id].color}">${RIVAL_REGIONS[id].element.slice(0,1)}</i>`;
  if (type === "sets") return `<i class="chronicle-relic" style="--entry-color:${ITEM_SETS[id].color}">◇</i>`;
  return `<i class="chronicle-room">⌂</i>`;
}

function chronicleEntryCopy(type, id) {
  if (type === "species") return [CREATURE_SPECIES[id].name, CREATURE_SPECIES[id].temperament, `${CREATURE_SPECIES[id].hatchDays} day incubation`];
  if (type === "regions") return [RIVAL_REGIONS[id].name, RIVAL_REGIONS[id].keeper, RIVAL_REGIONS[id].description];
  if (type === "sovereigns") return [REGIONAL_SOVEREIGNS[id].name, REGIONAL_SOVEREIGNS[id].title, REGIONAL_SOVEREIGNS[id].phases.map((phase) => phase.name).join(" · ")];
  if (type === "sets") return [ITEM_SETS[id].name, `${ITEM_SETS[id].slots.length}-piece set`, ITEM_SETS[id].description];
  return [DUNGEON_ROOMS[id].name, `Heart rank ${DUNGEON_ROOMS[id].rank}`, DUNGEON_ROOMS[id].description];
}

function renderChronicleCategory(type, catalogue, discovered, eyebrow) {
  const known = new Set(discovered);
  return `<section class="panel chronicle-category"><header><div><span class="eyebrow">${eyebrow}</span><h2>${({species:"Living Bestiary",regions:"Rival Atlas",sovereigns:"Fallen Sovereigns",sets:"Relic Set Archive",rooms:"Architect's Ledger"})[type]}</h2></div><strong>${known.size}/${Object.keys(catalogue).length}</strong></header><div class="chronicle-entry-grid">${Object.keys(catalogue).map((id) => {
    const seen = known.has(id), copy = seen ? chronicleEntryCopy(type,id) : ["Unknown entry","UNDISCOVERED","Continue the campaign to reveal this record."];
    return `<article class="chronicle-entry ${seen?"discovered":"undiscovered"}">${chronicleEntryArt(type,id,seen)}<div><small>${escapeHtml(copy[1])}</small><strong>${escapeHtml(copy[0])}</strong><p>${escapeHtml(copy[2])}</p></div></article>`;
  }).join("")}</div></section>`;
}

function renderChronicle() {
  const progress = chronicleProgress(state);
  return `<section class="panel chronicle-hero"><div><span class="eyebrow">PERMANENT CAMPAIGN RECORD</span><h2>What the dungeon remembers cannot be taken.</h2><p>Creatures raised, roads traveled, rulers defeated, relic sets found, and specialized rooms built remain recorded even when your current loadout changes.</p></div><div class="chronicle-seal" style="--completion:${progress.percent * 3.6}deg"><strong>${progress.percent}%</strong><span>${progress.discovered}/${progress.total} entries</span></div></section>
    ${renderLivingHeart()}
    <section class="chronicle-summary">${Object.values(progress.categories).map((category)=>`<article><span>${escapeHtml(category.name)}</span><strong>${category.discovered}<small> / ${category.total}</small></strong><i><b style="width:${pct(category.discovered,category.total)}%"></b></i></article>`).join("")}</section>
    <section class="panel chronicle-achievements"><div class="panel-head"><div><span class="eyebrow">CHRONICLE ACHIEVEMENTS</span><h2>Permanent rewards for a complete history</h2></div><strong>${progress.achievements.filter((entry)=>entry.claimed).length}/${Object.keys(CHRONICLE_ACHIEVEMENTS).length} claimed</strong></div><div class="achievement-grid">${progress.achievements.map((entry)=>`<article class="chronicle-achievement ${entry.ready?"ready":""} ${entry.claimed?"claimed":""}"><span>${entry.category}</span><h3>${escapeHtml(entry.name)}</h3><p>${escapeHtml(entry.description)}</p><i><b style="width:${pct(entry.progress,entry.target)}%"></b></i><small>${entry.progress}/${entry.target} · ${Object.entries(entry.reward).map(([resource,amount])=>`${amount} ${resource}`).join(" · ")}</small><button data-action="claim-chronicle" data-id="${entry.id}" ${entry.ready?"":"disabled"}>${entry.claimed?"Recorded":entry.ready?"Claim reward":"In progress"}</button></article>`).join("")}</div></section>
    <div class="chronicle-columns">${renderChronicleCategory("species",CREATURE_SPECIES,progress.categories.species.ids,"HATCHED OR ACQUIRED")}${renderChronicleCategory("regions",RIVAL_REGIONS,progress.categories.regions.ids,"ROADS TRAVELED")}</div>
    ${renderChronicleCategory("sovereigns",REGIONAL_SOVEREIGNS,progress.categories.sovereigns.ids,"RULERS BROKEN")}
    <div class="chronicle-columns">${renderChronicleCategory("sets",ITEM_SETS,progress.categories.sets.ids,"RELICS IDENTIFIED")}${renderChronicleCategory("rooms",DUNGEON_ROOMS,progress.categories.rooms.ids,"PLANS REALIZED")}</div>`;
}

function renderLivingHeart() {
  const completion = campaignCompletion(state);
  return `<section class="panel living-heart ${completion.awakened?"awakened":"sleeping"}"><img src="assets/icons/realistic/world-heart-isometric-v1-runtime.png" alt="The Living Heart" /><div><span class="eyebrow">V2.0 CAMPAIGN COVENANT</span><h2>${completion.claimed?"The Living Heart remembers your name.":completion.awakened?"Five crowns lie broken. The Heart awakens.":"The Living Heart is still dreaming."}</h2><p>${completion.claimed?"The complete campaign covenant has been claimed. The world remains open for higher levels, new lineages, stronger rooms, and perfected relic sets.":completion.awakened?"Claim the final covenant, then continue the endless campaign at your own pace.":`${completion.defeated}/${completion.total} Regional Sovereigns defeated. Every first victory leaves a permanent mark here.`}</p><div class="heart-crowns">${Object.entries(REGIONAL_SOVEREIGNS).map(([id,boss])=>`<i class="${completion.missing.includes(id)?"missing":"broken"}" title="${escapeHtml(boss.name)}">${completion.missing.includes(id)?"◇":"◆"}</i>`).join("")}</div></div><aside><strong>${completion.percent}%</strong><span>Campaign</span><button data-action="claim-living-heart" ${completion.ready?"":"disabled"}>${completion.claimed?"Covenant claimed":completion.ready?"Claim final covenant":"Defeat every Sovereign"}</button></aside></section>`;
}

function renderReports() {
  const wins=state.dungeon.victories, losses=state.dungeon.defeats, analytics=defenseAnalytics(state);
  return `${renderContracts()}<section class="panel report-summary"><div><span class="eyebrow">DEFENSIVE RECORD</span><h2>${wins} victories · ${losses} breaches</h2><p class="muted">The latest twelve challengers reveal which half of the dungeon is carrying the defense.</p></div><div class="summary-number"><span>Success rate</span><strong>${analytics.winRate}%</strong></div></section>
    <section class="defense-analytics"><article><span>RECORDED RUNS</span><strong>${analytics.total}</strong></article><article><span>AVG GUARDIANS SLAIN</span><strong>${analytics.averageKills}</strong></article><article><span>TRAP DAMAGE</span><strong>${analytics.trapDamage}</strong></article><article><span>GUARDIAN DAMAGE</span><strong>${analytics.guardianDamage}</strong></article><article><span>GOLD EARNED</span><strong>${analytics.goldEarned}</strong></article></section>
    <div class="report-list">${state.reports.length?state.reports.map(r=>`<article class="panel report ${r.defended?"win":"loss"}"><div class="report-mark">${r.defended?"W":"L"}</div><div><span class="eyebrow">DAY ${r.day} · LEVEL ${r.heroLevel} CHALLENGER${r.waveIndex?` · WAVE ${r.waveIndex}/${r.waveSize}`:""}</span><h3>${escapeHtml(r.heroName)}</h3><p>${r.defended?`Fell after defeating ${r.kills} monsters. Your dungeon earned ${r.reward} gold.`:`Survived with ${r.remainingHp} health and claimed the ${r.lost} gold hoard.`}</p><small>${r.events.map(escapeHtml).join(" · ")}</small><div class="damage-ledger"><span>Traps <b>${r.trapDamage||0}</b></span><span>Guardians <b>${r.guardianDamage||0}</b></span><span>Combos <b>${r.synergyCount||0}</b></span></div></div><strong>Threat ${r.threat}</strong></article>`).join(""):`<section class="panel empty-state">No challengers have entered yet. Build your route, fund a Boss Hoard, and open the gates.</section>`}</div>
    <section class="panel journal"><span class="eyebrow">KEEPER JOURNAL</span>${state.journal.slice(0,8).map(x=>`<p>${escapeHtml(x)}</p>`).join("")}</section>`;
}

function renderContracts(){
  const campaign=state.campaign;
  return `<section class="panel contracts-panel"><div class="panel-head"><div><span class="eyebrow">KEEPER CONTRACTS · RENOWN ${campaign.renown}</span><h2>Three reasons to open the gates</h2><p class="muted">Contracts turn every part of the dungeon loop into progress. Claim all three to raise Renown and receive a fresh set.</p></div><div class="renown-mark"><strong>${campaign.renown}</strong><span>RENOWN</span></div></div><div class="contract-grid">${campaign.contracts.map(contract=>{
    const ready=contract.progress>=contract.target&&!contract.claimed;
    const rewards=Object.entries(contract.reward).map(([resource,amount])=>`${amount} ${resource}`).join(" · ");
    return `<article class="contract ${ready?"ready":""} ${contract.claimed?"claimed":""}"><span>${contract.key.replace(/([A-Z])/g," $1").toUpperCase()}</span><h3>${escapeHtml(contract.title)}</h3><p>${escapeHtml(contract.description)}</p><div class="contract-progress"><i style="width:${pct(contract.progress,contract.target)}%"></i></div><small>${contract.progress}/${contract.target} · ${rewards}</small><button data-action="claim-contract" data-id="${contract.id}" ${ready?"":"disabled"}>${contract.claimed?"Claimed":ready?"Claim reward":"In progress"}</button></article>`;
  }).join("")}</div></section>`;
}

function render() {
  clearTimeout(autoBattleTimer); autoBattleTimer = null;
  destroy3D?.(); destroy3D = null;
  document.body.classList.toggle("reduced-motion",state.settings.reducedMotion);
  document.body.classList.toggle("high-contrast",state.settings.highContrast);
  document.body.dataset.quality=state.settings.sceneQuality;
  document.body.dataset.presentation=state.settings.presentationMode;
  document.body.dataset.textSize=state.settings.textSize;
  document.title = `${sectionTitle()} — Keeperfall`;
  el("app").innerHTML = appShell();
  bindEvents();
  if (view === "keep" && state.settings.presentationMode === "3d") {
    destroy3D = mountDungeon3D(el("dungeon-3d"), state, (index) => {
      const result = placeDungeonPiece(state, index, state.dungeon.selectedPiece);
      toast(result.message, result.ok ? "good" : "bad"); render();
    });
  } else if (view === "raid" && state.raid) {
    if (state.settings.presentationMode === "3d") destroy3D = mountRaid3D(el("raid-3d"), state, combatFx);
    if (combatFx) setTimeout(()=>{ combatFx=null; }, 1100);
    scheduleAutoBattle();
  }
  save();
}

function scheduleAutoBattle(){
  const raid=state.raid;
  if(view!=="raid"||!raid||raid.complete||raid.autoPaused)return;
  const delay={fast:520,standard:1150,cinematic:1750}[state.settings.battlePace]||1150;
  autoBattleTimer=setTimeout(()=>{const result=autoRaidStep(state);if(result.ok){combatFx=result.fx||null;if(result.fx)sound.play(result.fx);}render();},delay);
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{view=b.dataset.view;render();}));
  document.querySelectorAll("[data-piece]").forEach(b=>b.addEventListener("click",()=>{state.dungeon.selectedPiece=b.dataset.piece;render();}));
  document.querySelectorAll(".dungeon-cell[data-cell]").forEach(b=>b.addEventListener("click",()=>{const result=placeDungeonPiece(state,Number(b.dataset.cell),state.dungeon.selectedPiece);toast(result.message,result.ok?"good":"bad");render();}));
  document.querySelectorAll("[data-item]").forEach(b=>b.addEventListener("click",()=>{state.selectedInventoryId=b.dataset.item;render();}));
  document.querySelectorAll("[data-unequip]").forEach(b=>b.addEventListener("click",()=>{unequipItem(state,b.dataset.unequip);render();}));
  const band=el("level-band"); if(band) band.addEventListener("change",()=>{state.dungeon.levelBand=Math.min(state.dungeon.rank,Number(band.value));render();});
  const hoard=el("hoard"); if(hoard) hoard.addEventListener("change",()=>{state.dungeon.hoard=Number(hoard.value);save();});
  const lootSearch=el("loot-search"); if(lootSearch) lootSearch.addEventListener("change",()=>{state.lootFilters.search=lootSearch.value;render();});
  const lootSlot=el("loot-slot"); if(lootSlot) lootSlot.addEventListener("change",()=>{state.lootFilters.slot=lootSlot.value;render();});
  const lootRarity=el("loot-rarity"); if(lootRarity) lootRarity.addEventListener("change",()=>{state.lootFilters.rarity=lootRarity.value;render();});
  const lootSort=el("loot-sort"); if(lootSort) lootSort.addEventListener("change",()=>{state.lootFilters.sort=lootSort.value;render();});
  const lootFavorites=el("loot-favorites"); if(lootFavorites) lootFavorites.addEventListener("change",()=>{state.lootFilters.favoritesOnly=lootFavorites.checked;render();});
  const soundVolume=el("sound-volume"); if(soundVolume) soundVolume.addEventListener("input",()=>{state.settings.soundVolume=Number(soundVolume.value)/100;sound.sync();save();});
  const sceneQuality=el("scene-quality"); if(sceneQuality) sceneQuality.addEventListener("change",()=>{state.settings.sceneQuality=sceneQuality.value;render();});
  const presentationMode=el("presentation-mode"); if(presentationMode) presentationMode.addEventListener("change",()=>{state.settings.presentationMode=presentationMode.value;render();});
  const textSize=el("text-size"); if(textSize) textSize.addEventListener("change",()=>{state.settings.textSize=textSize.value;render();});
  const battlePace=el("battle-pace"); if(battlePace) battlePace.addEventListener("change",()=>{state.settings.battlePace=battlePace.value;render();});
  const saveImport=el("save-import"); if(saveImport) saveImport.addEventListener("change",()=>handleSaveImport(saveImport));
  document.querySelectorAll("[data-modal-stop]").forEach(node=>node.addEventListener("click",event=>event.stopPropagation()));
  document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>handleAction(b.dataset.action,b)));
}

async function handleSaveImport(input) {
  const file=input.files?.[0]; if(!file)return;
  const result=importSaveData(await file.text());
  if(!result.ok){toast(result.message,"bad");input.value="";return;}
  const current=localStorage.getItem(SAVE_KEY); if(current)localStorage.setItem(BACKUP_KEY,current);
  state=result.state; state.onboarding.complete=true; settingsOpen=false; view="keep"; render(); toast(result.message,"good");
}

function downloadProfile() {
  const result=exportSaveData(state);
  if(!result.ok){toast(result.message,"bad");return;}
  const url=URL.createObjectURL(new Blob([result.data],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download=result.filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast(`Exported ${result.filename}.`,"good");
}

function handleAction(action,b) {
  let result;
  if(action==="publish") { state.dungeon.hoard=Number(el("hoard")?.value||100); result=publishDungeon(state); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="open-settings") { settingsOpen=true; }
  else if(action==="close-settings") { settingsOpen=false; }
  else if(action==="toggle-sound") { state.settings.soundEnabled=!state.settings.soundEnabled;sound.sync();toast(state.settings.soundEnabled?"Sound effects enabled.":"Sound effects muted.",state.settings.soundEnabled?"good":""); }
  else if(action==="toggle-shake") { state.settings.combatShake=!state.settings.combatShake;toast(state.settings.combatShake?"Combat impact motion enabled.":"Combat impact motion disabled.","good"); }
  else if(action==="toggle-reduced-motion") { state.settings.reducedMotion=!state.settings.reducedMotion; if(state.settings.reducedMotion)state.settings.combatShake=false; toast(state.settings.reducedMotion?"Reduced motion enabled.":"Reduced motion disabled.","good"); }
  else if(action==="toggle-contrast") { state.settings.highContrast=!state.settings.highContrast; toast(state.settings.highContrast?"High contrast enabled.":"High contrast disabled.","good"); }
  else if(action==="export-save") { downloadProfile(); return; }
  else if(action==="import-save") { el("save-import")?.click(); return; }
  else if(action==="restore-backup") { const raw=localStorage.getItem(BACKUP_KEY), restored=raw?importSaveData(raw):{ok:false,message:"No local backup is available."}; if(!restored.ok)toast(restored.message,"bad");else if(confirm(`Restore the backup from Keeper day ${restored.state.day}? Your current profile will become the new backup.`)){const current=localStorage.getItem(SAVE_KEY);state=restored.state;if(current)localStorage.setItem(BACKUP_KEY,current);settingsOpen=false;view="keep";toast("Local backup restored.","good");} }
  else if(action==="restart-tutorial") { state.onboarding={complete:false,step:0};settingsOpen=false; }
  else if(action==="skip-onboarding") { state.onboarding.complete=true;state.onboarding.step=3;toast("Guide dismissed. You can replay it from Settings.","good"); }
  else if(action==="onboarding-back") { state.onboarding.step=Math.max(0,state.onboarding.step-1); }
  else if(action==="onboarding-next") { if(state.onboarding.step<3)state.onboarding.step+=1;else{state.onboarding.complete=true;view="keep";toast("The Heartway is yours.","good");} }  else if(action==="learn-mastery") { result=learnKeeperTalent(state,b.dataset.talent); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="respec-mastery") { const spent=keeperTalentBudget(state).spent,cost=90+spent*55;if(confirm(`Rekindle all ${spent} assigned mastery ranks for ${cost} gold?`)){result=respecKeeperTalents(state);toast(result.message,result.ok?"good":"bad");} }
  else if(action==="upgrade-dungeon") { result=upgradeDungeon(state); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="simulate-wave") { result=simulateDefenseWave(state); if(result.ok){view="reports";toast(result.defendedAll?"The dungeon survived the full wave.":`The wave ended after ${result.reports.length} challenger${result.reports.length===1?"":"s"}.`,result.defendedAll?"good":"bad");}else toast(result.message,"bad"); }
  else if(action==="upgrade-trap") { result=upgradeTrap(state,Number(b.dataset.cell)); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="expand-layout") { result=expandDungeonLayout(state,b.dataset.layout); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="set-dungeon-theme") { result=setDungeonTheme(state,b.dataset.theme); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="build-dungeon-room") { result=buildDungeonRoom(state,Number(el("architect-cell")?.value),el("architect-room")?.value); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="remove-dungeon-room") { result=buildDungeonRoom(state,Number(b.dataset.cell),"none"); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="new-raid") { state.raid=null; view="raid"; }
  else if(action==="begin-raid") { createRaid(state); view="raid"; }
  else if(action==="select-region") { result=configureExpedition(state,b.dataset.region,state.expedition.difficultyId); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="select-difficulty") { result=configureExpedition(state,state.expedition.regionId,b.dataset.difficulty); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="save-doctrine") { result=configureExpeditionDoctrine(state,{stance:el("doctrine-stance")?.value,potionPolicy:el("doctrine-potion")?.value,spellPolicy:el("doctrine-spell")?.value,keeperPosition:el("doctrine-position")?.value});toast(result.message,result.ok?"good":"bad"); }
  else if(action==="formation-up"||action==="formation-down") { result=moveExpeditionCreature(state,b.dataset.id,action==="formation-up"?"up":"down");toast(result.message,result.ok?"good":"bad"); }
  else if(action==="auto-toggle") { state.raid.autoPaused=!state.raid.autoPaused; toast(state.raid.autoPaused?"Automatic battle paused.":"Automatic battle resumed.","good"); }
  else if(action==="retreat") { retreatRaid(state); }
  else if(action==="buy-egg") { result=purchaseEgg(state,b.dataset.species); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="incubate") { result=incubateEgg(state,b.dataset.id); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="assign-creature") { const value=el(`creature-role-${b.dataset.id}`)?.value||"reserve"; const [role,cell]=value.split(":"); result=assignCreature(state,b.dataset.id,role,cell); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="rename-creature") { result=renameCreature(state,b.dataset.id,el(`creature-name-${b.dataset.id}`)?.value); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="train-creature") { result=trainCreature(state,b.dataset.id); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="awaken-creature") { result=awakenCreature(state,b.dataset.id,el(`awakening-${b.dataset.id}`)?.value); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="advance-lineage") { result=advanceCreatureLineage(state,b.dataset.id,b.dataset.lineage);toast(result.message,result.ok?"good":"bad"); }
  else if(action==="claim-contract") { result=claimContract(state,b.dataset.id); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="claim-atlas-bounty") { result=claimAtlasBounty(state); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="claim-chronicle") { result=claimChronicleReward(state,b.dataset.id); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="claim-living-heart") { result=claimLivingHeart(state); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="equip-creature") { result=equipCreatureItem(state,b.dataset.id,el("creature-target")?.value); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="unequip-creature") { result=unequipCreatureItem(state,b.dataset.id,b.dataset.slot); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="attune-creature") { result=attuneCreatureSpell(state,b.dataset.id,el(`creature-spell-${b.dataset.id}`)?.value); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="potion-creature") { result=assignCreaturePotion(state,b.dataset.id); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="equip") { equipItem(state,b.dataset.id); toast("Equipment assigned to the hero.","good"); }
  else if(action==="equip-monster") { result=equipMonsterItem(state,b.dataset.id,Number(el("monster-target")?.value)); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="unequip-monster") { result=unequipMonsterItem(state,Number(b.dataset.cell),b.dataset.slot); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="attune-guardian") { const cell=Number(b.dataset.cell);result=attuneMonsterSpell(state,cell,el(`guardian-spell-${cell}`)?.value);toast(result.message,result.ok?"good":"bad"); }
  else if(action==="potion-guardian") { result=assignMonsterPotion(state,Number(b.dataset.cell));toast(result.message,result.ok?"good":"bad"); }
  else if(action==="craft") { result=craftItem(state,el("craft-slot")?.value,Number(el("craft-quality")?.value));toast(result.message,result.ok?"good":"bad"); }
  else if(action==="favorite-item") { result=toggleItemFavorite(state,b.dataset.id); toast(result.message,result.ok?"good":"bad"); }
  else if(action==="carve-socket") { result=carveRuneSocket(state,b.dataset.id);toast(result.message,result.ok?"good":"bad"); }
  else if(action==="socket-rune") { result=socketRune(state,b.dataset.id,b.dataset.rune);toast(result.message,result.ok?"good":"bad"); }
  else if(action==="unsocket-rune") { result=unsocketRune(state,b.dataset.id,b.dataset.rune);toast(result.message,result.ok?"good":"bad"); }
  else if(action==="dismantle") { const d=dismantleItem(state,b.dataset.id); if(d?.ok===false) toast(d.message,"bad"); else if(d){state.selectedInventoryId=state.inventory[0]?.id;toast(`Recovered ${d.amount} ${QUALITIES[d.tier].toLowerCase()} ${d.family}${d.essence?` and ${d.essence} essence`:""}.`,"good");} }
  else if(action==="tinker") { result=tinkerItem(state,b.dataset.id,b.dataset.tinker); toast(result.message,result.ok?(result.failed?"warn":"good"):"bad"); }
  else if(action==="rename") { const item=state.inventory.find(i=>i.id===state.selectedInventoryId); if(item){item.customName=el("custom-name").value.trim();toast(item.customName?`The item is now known as ${item.customName}.`:"The personal inscription was removed.","good");} }
  else if(action==="reset") { if(confirm("Erase this Keeperfall save and its local backup, then begin again?")){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(BACKUP_KEY);state=createInitialState();settingsOpen=false;view="keep";} }
  render();
}

function toast(message,kind="") {
  clearTimeout(toastTimer);
  if(kind) sound.play(kind);
  requestAnimationFrame(()=>{const node=el("toast");if(!node)return;node.textContent=message;node.className=`show ${kind}`;toastTimer=setTimeout(()=>node.className="",2600);});
}

render();
if(recoveredAtLoad)setTimeout(()=>toast("The main save was unreadable, so Keeperfall restored the last-known good backup.","warn"),120);
