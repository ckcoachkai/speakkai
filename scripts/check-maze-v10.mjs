import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const htmlPath = new URL(process.argv.includes('--dist') ? '../dist/maze/index.html' : '../public/maze/index.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const engineSource = scripts.find(source => source.includes('class Game {'));
const rendererSource = scripts.find(source => source.includes('drawForegroundCrawler'));
assert(engineSource, 'Packaged v10 engine is present');
assert(rendererSource, 'Packaged v10 renderer is present');

const context = vm.createContext({});
vm.runInContext(engineSource, context);
const { Game } = context.MouseMazeEngine || {};
assert.equal(typeof Game, 'function');

const names = count => Array.from({ length: count }, (_, index) => `Mouse ${index + 1}`);
const eventsOf = (game, type) => game.drainEvents().filter(event => event.type === type);
const makeGame = (count = 4, options = {}) => {
  const game = new Game({
    names: names(count),
    seed: 20261006,
    insectsEnabled: false,
    liceEnabled: false,
    ...options,
  });
  game.start();
  return game;
};
const holdMice = (game, point = null) => {
  const target = point || { x: game.mice[0].x, y: game.mice[0].y };
  for (const mouse of game.mice) {
    mouse.dragging = true;
    mouse.x = target.x;
    mouse.y = target.y;
    mouse._cell = { x: Math.floor(target.x), y: Math.floor(target.y) };
  }
  return target;
};
const addManualBomb = (game, point, id = 'qa-floor-bomb') => {
  const bomb = { id, x: point.x, y: point.y, spawnedAt: 5, explodeAt: 15 };
  game.floorBombs = [bomb];
  game._floorBombTickMarks.set(bomb.id, new Set());
  return bomb;
};

// The new hazard is opt-out rather than opt-in. The packaged constructor must
// preserve this default even when the carried bomb is configured separately.
const defaults = makeGame(1, { bombInterval: 120 });
assert.equal(defaults.floorBombsEnabled, true, 'Floor bombs default to enabled');
const defaultMouse = defaults.mice[0];
defaultMouse.dragging = true;
const safeDefaultCell = defaults._floorCells.at(-1);
assert(safeDefaultCell, 'Default fixture has a safe floor cell');
const safeDefaultPoint = { x: safeDefaultCell.x + 0.5, y: safeDefaultCell.y + 0.5 };
defaults.update(5);
const spawnAtFive = eventsOf(defaults, 'floor-bomb-spawned');
assert.equal(defaults.time, 5);
assert.equal(spawnAtFive.length, 1, 'A floor bomb spawns at five seconds');
assert.equal(spawnAtFive[0].spawnedAt, 5);
assert.equal(spawnAtFive[0].explodeAt, 15, 'Floor bomb fuse is ten seconds');
for (const bomb of defaults.floorBombs) { bomb.x = safeDefaultPoint.x; bomb.y = safeDefaultPoint.y; }
defaults.update(5);
assert.equal(eventsOf(defaults, 'floor-bomb-spawned').length, 1, 'A second bomb spawns at ten seconds');
for (const bomb of defaults.floorBombs) { bomb.x = safeDefaultPoint.x; bomb.y = safeDefaultPoint.y; }
defaults.update(5);
const default15Events = defaults.drainEvents();
assert(default15Events.some(event => event.type === 'floor-bomb-exploded'), 'The first floor bomb detonates at fifteen seconds');

// Fuse ticks are emitted once at exactly 3, 2, and 1 seconds remaining.
const ticksGame = makeGame(1, { bombInterval: 120 });
const tickPoint = holdMice(ticksGame);
ticksGame.update(5);
const spawnedTickBomb = ticksGame.floorBombs[0];
assert(spawnedTickBomb, 'Tick fixture receives a floor bomb');
spawnedTickBomb.x = tickPoint.x;
spawnedTickBomb.y = tickPoint.y;
ticksGame.drainEvents();
ticksGame.update(7);
assert.equal(ticksGame.time, 12);
assert.deepEqual(Array.from(eventsOf(ticksGame, 'floor-bomb-tick'), event => event.secondsLeft), [3]);
ticksGame.update(1);
assert.deepEqual(Array.from(eventsOf(ticksGame, 'floor-bomb-tick'), event => event.secondsLeft), [2]);
ticksGame.update(1);
assert.deepEqual(Array.from(eventsOf(ticksGame, 'floor-bomb-tick'), event => event.secondsLeft), [1]);
assert.equal(ticksGame.time, 14);

// Explicit pause and the speaker hold must freeze both simulation time and
// floor-bomb state. Continue is the only release from a selection hold.
const pauseGame = makeGame(2, { bombInterval: 120 });
pauseGame.update(5);
pauseGame.drainEvents();
pauseGame.pause();
const pausedAt = pauseGame.time;
const pausedBombCount = pauseGame.floorBombs.length;
pauseGame.update(20);
assert.equal(pauseGame.time, pausedAt);
assert.equal(pauseGame.floorBombs.length, pausedBombCount);
pauseGame.resume();
pauseGame.update(7);
assert.equal(pauseGame.time, 12);
assert.equal(eventsOf(pauseGame, 'floor-bomb-tick').length, 1);

// A blast can hit several mice but presents one speaker at a time. The clock
// remains frozen while the two queued casualties are acknowledged.
const queued = makeGame(3, { floorBombsEnabled: true, bombInterval: 120 });
const queuePoint = holdMice(queued);
const queueBomb = addManualBomb(queued, queuePoint, 'qa-floor-bomb-queue');
queued.time = 15;
queued._explodeFloorBomb(queueBomb);
assert.equal(queued.status, 'awaiting');
assert.equal(queued.selections.length, 1);
assert.equal(queued._floorBombSelectionQueue.length, 2);
const frozenTime = queued.time;
assert.equal(queued.continueSelection(), 'awaiting');
assert.equal(queued.selections.length, 2);
assert.equal(queued.time, frozenTime);
assert.equal(queued.continueSelection(), 'awaiting');
assert.equal(queued.selections.length, 3);
assert.equal(queued.time, frozenTime);
assert.equal(queued.continueSelection(), 'finished');
assert.equal(queued.selections.length, 3);
assert.equal(new Set(queued.selections.map(selection => selection.id)).size, 3);
assert.deepEqual(Array.from(queued.selections, selection => selection.cause), ['floor-bomb', 'floor-bomb', 'floor-bomb']);

// A cat inside the BFS blast radius is teleported to the valid maze start and
// replanned. This uses the same packaged engine method that the live event loop
// calls, so a renderer-only reset cannot satisfy the gate.
const catGame = makeGame(3, { floorBombsEnabled: true, bombInterval: 120 });
catGame._spawnCat();
const catOrigin = catGame._floorCells.find(cell => cell.x !== catGame._startCell.x || cell.y !== catGame._startCell.y);
assert(catOrigin, 'Cat reset fixture has a second floor cell');
catGame.cat.x = catOrigin.x + 0.5;
catGame.cat.y = catOrigin.y + 0.5;
const catBomb = addManualBomb(catGame, { x: catGame.cat.x, y: catGame.cat.y }, 'qa-floor-bomb-cat');
catGame.time = 15;
catGame._explodeFloorBomb(catBomb);
const catHit = eventsOf(catGame, 'cat-bomb-hit')[0];
assert(catHit, 'Bomb hit emits a cat reset event');
assert.equal(catHit.id, 'cat');
assert.equal(catGame.cat.x, catGame.start.x);
assert.equal(catGame.cat.y, catGame.start.y);
assert.equal(catGame.grid[Math.floor(catGame.cat.y)][Math.floor(catGame.cat.x)], 0);
assert.equal(catGame.cat._route.length, 0);

// The carried bomb remains a separate 30-second speaker cadence when floor
// bombs are disabled for an isolated fixture. Continue advances the deadline
// once and does not reset it for the new carrier.
const carried = makeGame(2, { floorBombsEnabled: false, bombInterval: 30 });
for (const mouse of carried.mice) mouse.dragging = true;
carried.update(30);
assert.equal(carried.status, 'awaiting');
assert.equal(carried.pendingSelection?.outcome, 'exploded');
assert.equal(carried.pendingSelection?.time, 30);
assert.equal(carried.nextExplosion, 60);
assert.equal(carried.continueSelection(), 'running');
assert.equal(carried.nextExplosion, 60);
carried.update(30);
assert.equal(carried.status, 'awaiting');
assert.equal(carried.pendingSelection?.time, 60);

// The bundle must expose the crawler atlas and all four art frames. The
// renderer review remains visual, but these assertions catch a missing asset,
// truncated atlas, or accidental fallback-only integration in CI.
const assetMatch = html.match(/window\.MOUSE_MAZE_ASSETS=(\{.*?\});(?=window\.MOUSE_MAZE_CHARACTER_ART=)/s);
assert(assetMatch, 'Packaged v10 asset manifest is present');
const assets = JSON.parse(assetMatch[1]);
assert(assets.crawlers, 'Crawler atlas is packaged');
assert.match(rendererSource, /this\.assets\s*&&\s*this\.assets\.crawlers/);
for (const type of ['centipede', 'millipede', 'bedbug', 'leech', 'worm']) {
  assert(rendererSource.includes(type), `Crawler species ${type} is integrated`);
}
assert.match(rendererSource, /const rects\s*=\s*\[\[/);
assert.equal((rendererSource.match(/const rects\s*=\s*\[\[/g) || []).length, 1);
assert.match(rendererSource, /rects\s*=\s*\[\[[\s\S]*?\],\s*\[[\s\S]*?\],\s*\[[\s\S]*?\],\s*\[[\s\S]*?\]\]/);
assert.match(rendererSource, /fullImpact\s*\?\s*3\.4\s*:\s*\.54/);
assert.match(rendererSource, /freezeLocked/);
assert.match(rendererSource, /foregroundPieces/);
assert.match(rendererSource, /const largeNames\s*=\s*namedDebris\.slice\(\)/);
assert.match(rendererSource, /const crawlerTypes\s*=\s*\[[\s\S]*?centipede[\s\S]*?millipede[\s\S]*?bedbug[\s\S]*?leech[\s\S]*?worm/);
const namedDebrisBlock = rendererSource.match(/const namedDebris\s*=\s*\[([\s\S]*?)\];/)?.[1] || '';
const crawlerTypesBlock = rendererSource.match(/const crawlerTypes\s*=\s*\[([\s\S]*?)\];/)?.[1] || '';
assert.equal((namedDebrisBlock.match(/\{\s*type:/g) || []).length, 14, 'Foreground has 14 named anatomy pieces');
assert.equal((crawlerTypesBlock.match(/['"][a-z]+['"]/g) || []).length, 14, 'Foreground has 14 crawler pieces');
assert.match(rendererSource, /largeNames\.length\s*\+\s*crawlerTypes\.length/);
assert.match(rendererSource, /length:\s*this\.reducedMotion\s*\?\s*1\.25\s*:\s*3\.55/);

for (const marker of ['floor-bomb-spawned', 'floor-bomb-tick', 'floor-bomb-exploded', 'cat-bomb-hit', 'bombIntervalInput', 'BACKGROUND_TRACK_DATA']) {
  assert.match(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `v10 UI/event marker: ${marker}`);
}

console.log('Maze v10 packaged checks pass: default 5s floor-bomb spawn/10s fuse, exact 3/2/1 ticks, pause and queued speaker holds, cat reset, retained 30s carrier fuse, crawler atlas frames, and 3.4s impact freeze contract.');
