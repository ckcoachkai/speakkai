import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const htmlPath = new URL(process.argv.includes('--dist') ? '../dist/maze/index.html' : '../public/maze/index.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const engineSource = scripts.find(source => source.includes('class Game {'));
const rendererSource = scripts.find(source => source.includes('drawAnatomyLabels'));
assert(engineSource, 'Packaged v9 engine is present');
assert(rendererSource, 'Packaged v9 renderer is present');

const context = vm.createContext({});
vm.runInContext(engineSource, context);
const { Game } = context.MouseMazeEngine || {};
assert.equal(typeof Game, 'function');

// Keep the previous release contract in the v9 gate. These are intentionally
// API-level assertions; browser interaction and pixel-level review remain
// separate checks.
for (const method of [
  'beginMouseDrag', 'endMouseDrag', 'cancelMouseDrag', 'getMouseDropPoint',
  'continueSelection', '_unstickMouse', '_attachInsect',
  '_refreshMouseInsectDamage', '_resolveInsectContact',
]) {
  assert.equal(typeof Game.prototype[method], 'function', `v8 engine API: ${method}`);
}
assert.equal(typeof Game.prototype._resolveBugTransfers, 'function', 'v9 engine API: _resolveBugTransfers');
assert.equal(typeof Game.prototype._transferAttachedBugs, 'function', 'v9 engine API: _transferAttachedBugs');

const groundTypes = ['ant', 'beetle', 'maggot', 'roach', 'spider'];
const createGame = seed => {
  const game = new Game({
    names: ['Fast courier', 'Slow target'],
    seed,
    liceEnabled: true,
    insectsEnabled: true,
    insectAttachChance: 1,
  });
  game.start();
  const fast = game.mice[0];
  const slow = game.mice[1];
  assert(fast && slow, 'Transfer fixture has two mice');
  const cell = game._floorCells.find(candidate => game._floorCells.some(neighbor =>
    Math.abs(neighbor.x - candidate.x) + Math.abs(neighbor.y - candidate.y) === 1));
  assert(cell, 'Transfer fixture has a walkable cell');
  const routeCell = game._floorCells.find(candidate =>
    Math.abs(candidate.x - cell.x) + Math.abs(candidate.y - cell.y) === 1);
  const point = { x: cell.x + 0.5, y: cell.y + 0.5 };
  fast.x = point.x;
  fast.y = point.y;
  slow.x = point.x;
  slow.y = point.y;
  fast._cell = { ...cell };
  slow._cell = { ...cell };
  fast._route = [{ ...routeCell }];
  slow._route = [{ ...routeCell }];
  fast.baseSpeed = fast.speed = 2.4;
  slow.baseSpeed = slow.speed = .7;
  // The initial bomb is irrelevant to a bug-transfer fixture and would add
  // an unrelated carrier multiplier to one participant.
  for (const mouse of game.mice) mouse.hasBomb = false;
  game.bombCarrierId = null;
  return { game, fast, slow, point };
};

const attachAllBugs = (game, mouse) => {
  for (const type of groundTypes) {
    const insect = game._spawnInsect();
    assert(insect, `Can create ${type} fixture`);
    insect.type = type;
    assert.equal(game._attachInsect(insect, mouse), true, `Attach ${type} fixture`);
  }
  assert.equal(typeof game._spawnLouse, 'function', 'Louse fixture API is present');
  assert.equal(typeof game._attachLouse, 'function', 'Louse attachment API is present');
  const louse = game._spawnLouse();
  assert(louse, 'Can create louse fixture');
  assert.equal(game._attachLouse(louse, mouse), true, 'Attach louse fixture');
};

// A same-speed contact must not transfer. This catches accidental transfer on
// proximity alone and protects the faster-source rule.
const equalFixture = createGame(9141);
equalFixture.fast.baseSpeed = equalFixture.fast.speed = 1;
equalFixture.slow.baseSpeed = equalFixture.slow.speed = 1;
const equalBug = equalFixture.game._spawnInsect();
assert(equalBug);
equalBug.type = 'beetle';
assert.equal(equalFixture.game._attachInsect(equalBug, equalFixture.fast), true);
equalFixture.game.drainEvents();
equalFixture.game.update(.05);
assert.equal(equalFixture.game._attachedInsectsFor(equalFixture.fast).length, 1, 'Equal-speed contact does not transfer');
assert.equal(equalFixture.game._attachedInsectsFor(equalFixture.fast).length, 1);
assert.equal(equalFixture.game._attachedInsectsFor(equalFixture.slow).length, 0);
assert(!equalFixture.game.drainEvents().some(event => event.type === 'bugs-transferred'));

// A swept contact from the faster mouse transfers one of every bug class.
const { game, fast, slow, point } = createGame(9142);
attachAllBugs(game, fast);
const sourceInsectIds = game.insects.filter(insect => insect.attachedTo === fast.id || insect.targetId === fast.id).map(insect => insect.id);
const sourceLouseIds = game.lice.filter(item => item.attached && item.targetId === fast.id).map(item => item.id);
assert.equal(sourceInsectIds.length, groundTypes.length);
assert.equal(sourceLouseIds.length, 1);
game.drainEvents();
game.update(.05);

const movedInsects = game.insects.filter(insect => insect.attachedTo === slow.id || insect.targetId === slow.id);
const movedLice = game.lice.filter(item => item.attached && item.targetId === slow.id);
const remainingSourceInsects = game.insects.filter(insect => insect.attachedTo === fast.id || insect.targetId === fast.id);
const remainingSourceLice = game.lice.filter(item => item.attached && item.targetId === fast.id);
assert.equal(remainingSourceInsects.length, 0, 'Source mouse has no attached ground bugs after transfer');
assert.equal(remainingSourceLice.length, 0, 'Source mouse has no attached lice after transfer');
assert.equal(movedInsects.length, groundTypes.length, 'All five ground species transfer');
assert.equal(movedLice.length, 1, 'Lice transfer with ground bugs');
assert.deepEqual([...new Set(movedInsects.map(insect => insect.type))].sort(), [...groundTypes].sort());
assert.equal(new Set([...movedInsects.map(insect => insect.id), ...movedLice.map(item => item.id)]).size, groundTypes.length + 1, 'No duplicate transferred attachments');
assert.equal(slow.insectCount, groundTypes.length, 'Target ground-bug accounting is updated');
assert.deepEqual([...slow.insectTypes].sort(), [...groundTypes].sort());
assert.equal(slow.liceCount, 1, 'Target louse accounting is updated');
assert.equal(fast.insectCount, 0, 'Source ground-bug accounting is cleared');
assert.equal(fast.liceCount, 0, 'Source louse accounting is cleared');

const transferEvent = game.drainEvents().find(event => event.type === 'bugs-transferred');
assert(transferEvent, 'Bug transfer emits the bugs-transferred event');
assert.equal(transferEvent.sourceId, fast.id);
assert.equal(transferEvent.recipientId, slow.id);
assert.deepEqual([...transferEvent.insectIds].sort(), [...sourceInsectIds].sort());
assert.equal(transferEvent.insectCount, groundTypes.length);
assert.equal(transferEvent.liceCount, sourceLouseIds.length);
assert.equal(transferEvent.count, groundTypes.length + sourceLouseIds.length);
assert(Number.isFinite(transferEvent.x) && Number.isFinite(transferEvent.y), 'Transfer event includes contact coordinates');
assert(Math.abs(transferEvent.x - point.x) < .31 && Math.abs(transferEvent.y - point.y) < .01, 'Transfer event coordinates locate the contact');

// The v9 impact set is intentionally enumerated so a new art atlas cannot be
// wired into the build while silently dropping one of the visible labels.
const anatomyLabels = [
  'liver', 'heart', 'stomach', 'kidney-left', 'kidney-right',
  'eye-left', 'eye-right', 'foot-left', 'foot-right', 'tail',
  'alien-nebula', 'alien-void', 'alien-echo', 'alien-plasma',
];
for (const label of anatomyLabels) assert(rendererSource.includes(label), `Renderer declares ${label} anatomy label`);
assert.match(rendererSource, /awaiting.*finished|finished.*awaiting/s, 'Labels have a hold/finished visibility state');
const labelRenderer = rendererSource.match(/drawAnatomyLabels\(ctx, splats\)\s*\{([\s\S]*?)\n\s{4}\}\n\n\s{4}drawBloodDecal/)?.[1] || '';
assert(labelRenderer, 'Direct anatomy-label renderer is present');
assert.match(labelRenderer, /fontPx[\s\S]*?fillText/, 'Anatomy labels use compact direct text');
assert.match(labelRenderer, /shadowColor[\s\S]*?shadowBlur/, 'Anatomy labels retain a subtle glow');
assert.doesNotMatch(labelRenderer, /ctx\.(?:moveTo|lineTo|stroke)\s*\(/, 'Anatomy labels do not draw connecting lines or rails');

const assetMatch = html.match(/window\.MOUSE_MAZE_ASSETS=(\{.*?\});(?=window\.MOUSE_MAZE_CHARACTER_ART=)/s);
assert(assetMatch, 'Packaged v9 asset manifest is present');
const assets = JSON.parse(assetMatch[1]);
assert(assets.anatomy && assets.alienAnatomy, 'Both anatomy atlases are packaged');

for (const marker of [
  'devoured', 'mouse-unstuck', 'insect-attached', 'BACKGROUND_TRACK_DATA',
  'bombIntervalInput', 'Scroll to zoom', 'focus-mode',
]) assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `v8 UI marker: ${marker}`);

console.log('Maze v9 packaged checks pass: all bug classes transfer with accounting/events, 14 anatomy labels and both atlases are present, and v8 controls remain wired.');
