import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const htmlPath = new URL(process.argv.includes('--dist') ? '../dist/maze/index.html' : '../public/maze/index.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const engineSource = scripts.find(source => source.includes('class Game {'));
assert(engineSource, 'Packaged v8 engine is present');

const context = vm.createContext({});
vm.runInContext(engineSource, context);
const { Game } = context.MouseMazeEngine;
assert.equal(typeof Game, 'function');

// Keep these assertions close to the behavior contract. They catch a bundle
// that still contains v7 even when the page itself loads successfully.
for (const method of [
  'beginMouseDrag', 'endMouseDrag', 'cancelMouseDrag', 'getMouseDropPoint',
  'continueSelection', '_unstickMouse', '_attachInsect',
  '_refreshMouseInsectDamage', '_resolveInsectContact',
]) {
  assert.equal(typeof Game.prototype[method], 'function', `v8 engine API: ${method}`);
}

// A held mouse can be dropped onto a walkable cell, with a deterministic
// relocation event and no wall placement.
const dragGame = new Game({ names: ['Dragged'], seed: 8128, liceEnabled: false, insectsEnabled: false });
const dragged = dragGame.mice[0];
const targetCell = dragGame._floorCells.find(cell => Math.hypot(cell.x + 0.5 - dragged.x, cell.y + 0.5 - dragged.y) > 4.5)
  || dragGame._floorCells[dragGame._floorCells.length - 1];
const targetPoint = { x: targetCell.x + 0.5, y: targetCell.y + 0.5 };
assert.equal(dragGame.beginMouseDrag(dragged.id), true, 'Drag begins for a living mouse');
assert.equal(dragged.dragging, true);
const drop = dragGame.endMouseDrag(dragged.id, targetPoint.x, targetPoint.y);
assert(drop && drop.valid, 'Drag ends on a valid floor point');
assert.equal(dragged.dragging, false);
assert.equal(dragGame.grid[dragged._cell.y][dragged._cell.x], 0, 'Relocation never drops onto a wall');
const relocation = dragGame.drainEvents().find(event => event.type === 'mouse-relocated');
assert(relocation && relocation.actorId === dragged.id);
assert.equal(relocation.cellX, targetCell.x);
assert.equal(relocation.cellY, targetCell.y);
assert.equal(dragGame.beginMouseDrag(dragged.id), true);
assert.equal(dragGame.cancelMouseDrag(dragged.id), true, 'A held mouse can be cancelled safely');
assert.equal(dragged.dragging, false);

// Recovery is bounded and observable. The internal method is exercised here
// because the automatic watchdog invokes the same method after a loop or a
// stationary route; this avoids waiting multiple simulated seconds in QA.
const unstuckGame = new Game({ names: ['Stuck'], seed: 8129, liceEnabled: false, insectsEnabled: false });
unstuckGame.start();
const stuck = unstuckGame.mice[0];
stuck._route = [];
assert.equal(unstuckGame._unstickMouse(stuck, 'qa'), true, 'A living mouse with an available neighbor can recover');
assert.equal(stuck.lastTurnState, 'unstuck');
assert.equal(stuck.mood, 'determined');
assert(stuck._route.length >= 1, 'Recovery chooses a next route');
assert(unstuckGame.drainEvents().some(event => event.type === 'mouse-unstuck' && event.actorId === stuck.id));
assert.equal(unstuckGame._unstickMouse(stuck, 'qa-dragging'), true);
assert.equal(stuck.lastTurnState, 'unstuck');

// Contact can attach a ground insect, damage advances over time, and the
// terminal damage state selects the mouse through the new devoured outcome.
const damageGame = new Game({ names: ['Bugged'], seed: 8130, liceEnabled: false, insectsEnabled: true, insectAttachChance: 1, insectFatal: false });
damageGame.start();
const bugged = damageGame.mice[0];
const bug = damageGame._spawnInsect();
assert(bug, 'A ground insect can be created for the contact fixture');
bug.x = bugged.x;
bug.y = bugged.y;
bug._route = [];
assert.equal(damageGame._resolveInsectContact(bug, bugged), true, 'Contact attaches when attachment chance is 100%');
assert.equal(bug.attachedTo, bugged.id);
assert.equal(bugged.insectCount, 1);
assert(damageGame.drainEvents().some(event => event.type === 'insect-attached' && event.actorId === bugged.id));
damageGame._refreshMouseInsectDamage(bugged, 20);
assert(bugged.insectDamage > 0 && bugged.damageStage >= 0);
assert(damageGame.drainEvents().some(event => event.type === 'insect-bite' && event.actorId === bugged.id));

const fatalGame = new Game({ names: ['Devoured'], seed: 8131, liceEnabled: false, insectsEnabled: true, insectAttachChance: 1, insectFatal: true });
fatalGame.start();
const devoured = fatalGame.mice[0];
const fatalBug = fatalGame._spawnInsect();
fatalBug.x = devoured.x;
fatalBug.y = devoured.y;
assert.equal(fatalGame._attachInsect(fatalBug, devoured), true);
devoured.insectDamage = 0.99;
fatalGame._refreshMouseInsectDamage(devoured, 2);
assert.equal(fatalGame.status, 'awaiting', 'Fatal insect damage creates the same speaker hold as other outcomes');
assert.equal(fatalGame.pendingSelection?.outcome, 'devoured');
assert.equal(fatalGame.pendingSelection?.name, 'Devoured');
assert.equal(devoured.alive, false);
assert.equal(fatalGame.selections.length, 1);
assert(fatalGame.drainEvents().some(event => event.type === 'selected' && event.outcome === 'devoured'));
assert.equal(fatalGame.continueSelection(), 'finished');

// Preserve the prior timed-game contract: the default carried fuse remains 30
// seconds and Continue is the only way out of its speaker hold. Cat entry is
// checked in a separate no-carrier fixture below so a simultaneous 60-second
// carried detonation cannot hide the independent cat-entry contract.
const timed = new Game({ names: ['A', 'B', 'C'], seed: 8132, liceEnabled: false, insectsEnabled: false, floorBombsEnabled: false });
assert.equal(timed.bombInterval, 30);
for (const mouse of timed.mice) mouse.speed = 0;
timed.start();
timed.update(30);
assert.equal(timed.status, 'awaiting');
assert.equal(timed.pendingSelection?.outcome, 'exploded');
assert.equal(timed.time, 30);
assert.equal(timed.continueSelection(), 'running');
const catTimed = new Game({ names: ['Cat target', 'Cat decoy'], seed: 8133, liceEnabled: false, insectsEnabled: false, floorBombsEnabled: false, bombInterval: 120 });
for (const mouse of catTimed.mice) mouse.speed = 0;
catTimed.start();
catTimed.update(60);
assert(Math.abs(catTimed.time - 60) < 1e-8, 'Cat-entry fixture reaches the 60-second boundary');
assert.equal(catTimed.status, 'running');
assert(catTimed.cat, 'Cat enters at 60 seconds when no carried fuse competes at the same boundary');
assert.equal(catTimed.cat.speed, 1.3, 'Cat uses the v10 30% speed increase');

// UI and accessibility/report contracts for the new interactions and preserved
// controls. These strings are intentionally cheap smoke checks; browser QA
// remains responsible for pointer, touch, visual, and audio behavior.
assert.match(html, /Hold a mouse to move/);
assert.match(html, /mouse-unstuck/);
assert.match(html, /insect-attached/);
assert.match(html, /insect-bite/);
assert.match(html, /devoured/);
assert.match(html, /id="bombIntervalInput"/);
assert.match(html, /Cat at <strong>01:00<\/strong>/);
assert.match(html, /focus-mode/);
assert.match(html, /Scroll to zoom/);
assert.match(html, /BACKGROUND_TRACK_DATA/);

console.log('Maze v8 packaged checks pass: relocation/cancel, unstuck recovery, insect attachment and progressive damage, devoured selection hold, preserved 30s fuse/60s cat, and UI smoke contracts.');
