import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL(process.argv.includes('--dist') ? '../dist/maze/index.html' : '../public/maze/index.html', import.meta.url), 'utf8');
const engine = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(source => source.includes('class Game {'));
assert(engine, 'Packaged game engine is present');
const context = vm.createContext({});
vm.runInContext(engine, context);
const { Game } = context.MouseMazeEngine;

for (const rate of [1, 25, 100]) {
  const game = new Game({ names: ['A', 'B'], seed: 7304, cheeseBoost: rate, insectsEnabled: false, liceEnabled: false });
  const mouse = game.mice[0];
  let previous = 1, previousGain = Infinity;
  for (let i = 0; i < 500; i++) {
    game.cheese = [{ id: `fixture-${i}`, x: mouse.x, y: mouse.y }];
    assert(game._collectCheese(mouse, 'mouse'));
    const current = mouse.cheeseMultiplier, gain = current - previous;
    assert(current >= previous && current <= 3, 'Cheese growth stays monotonic and capped');
    assert(gain <= previousGain + 1e-12, 'Later bites add less speed');
    if (i === 0) assert(Math.abs(current - (1 + rate / 100)) < 1e-12, 'First bite matches the slider');
    if (rate === 100 && i === 1) assert.equal(current, 2.5);
    if (rate === 100 && i === 2) assert.equal(current, 2.75);
    previous = current; previousGain = gain;
  }
  const collected = mouse.cheeseMultiplier;
  game.setCheeseBoost(rate === 1 ? 100 : 1);
  assert.equal(mouse.cheeseMultiplier, collected, 'Slider cannot rewrite collected boosts');
}

const game = new Game({ names: ['A', 'B'], seed: 7315, liceEnabled: false });
for (const mouse of game.mice) mouse.speed = 0;
game.start(); game.update(6);
assert(game.insects.length >= 200 && game.insects.length <= 320, 'Hundreds of bounded ground creatures');
assert.deepEqual([...new Set(game.insects.map(insect => insect.type))].sort(), ['ant', 'beetle', 'maggot', 'roach', 'spider']);
for (const insect of game.insects) assert.equal(game.grid[Math.floor(insect.y)][Math.floor(insect.x)], 0, 'Bugs stay on floor');
const mouse = game.mice[0];
game.insects.push({id:'qa-crunch',type:'beetle',x:mouse.x+.1,y:mouse.y,angle:0,phase:0});
game._rebuildInsectBuckets();
game.drainEvents();
const start = {x:mouse.x-.2,y:mouse.y}, end = {x:mouse.x+.2,y:mouse.y};
game._crushInsectsOnSegment(mouse,start,end);
game._crushInsectsOnSegment(mouse,start,end);
assert.equal(game.drainEvents().filter(event=>event.type==='insect-crushed' && event.insectId==='qa-crunch').length,1,'One insect, one crush');
assert(!game.insects.some(insect=>insect.id==='qa-crunch'));
game.pause();
const paused = JSON.stringify({time:game.time,insects:game.insects,owner:game.bombCarrierId});
game.update(60);
assert.equal(JSON.stringify({time:game.time,insects:game.insects,owner:game.bombCarrierId}),paused,'Pause freezes insects and fuse');
assert.match(html,/First bite · smaller gains after/);
console.log('V7 packaged checks pass: diminishing cheese, stable collected boosts, five bounded ground species, one-shot crushes, pause and clear slider copy.');
