import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL(process.argv.includes('--dist') ? '../dist/maze/index.html' : '../public/maze/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const audioSource = scripts.find(source => source.includes('class MouseMazeAudio {'));
const appSource = scripts.find(source => source.includes('function uniqueNames(raw)'));
assert(audioSource && appSource);
let downloaded;
const sandbox = {
  Blob, Intl, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
  URL: { createObjectURL(blob) { downloaded = blob; return 'blob:qa'; }, revokeObjectURL() {} },
  Audio: class { pause() {} play() { return Promise.resolve(); } },
  document: { readyState: 'loading', addEventListener() {}, body: { appendChild() {} }, createElement() { return { click() {}, remove() {} }; } },
};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
vm.runInContext(audioSource, context);
// Expose private functions only in this isolated test context. The actual
// published script stays unchanged and is exercised by the browser QA too.
const marker = "  if (document.readyState === 'loading')";
assert(appSource.includes(marker));
const hooked = appSource.replace(marker, "  window.qa = { uniqueNames: uniqueNames, exportCsv: exportCsv, setResults: function(value) { results = value; dom.toast = { classList: { add: function(){}, remove: function(){} } }; } };\n" + marker);
vm.runInContext(hooked, context);
const { qa } = sandbox;
assert.equal(qa.uniqueNames('A'.repeat(31) + '🐭').names[0], 'A'.repeat(31) + '🐭');
assert.equal(qa.uniqueNames('👨‍👩‍👧‍👦'.repeat(33)).names[0], '👨‍👩‍👧‍👦'.repeat(32));
assert.equal(qa.uniqueNames(' Alice\nalice\n Bob ').names.length, 2);
qa.setResults(['=1+1', '+SUM(1,1)', '-1+2', '@SUM(1,1)', 'Comma, "Quote"'].map(name => ({ name, outcome: 'exploded', reason: 'went BOOM', time: 30 })));
qa.exportCsv();
const csv = await downloaded.text();
for (const prefix of ['=', '+', '-', '@']) assert(csv.includes('"\'' + prefix), 'Formula prefix must be neutralized');
assert(csv.includes('"Comma, ""Quote"""'));
const audio = new sandbox.MouseMazeAudio();
audio.ctx = { currentTime: 50 }; audio.applyVolume = () => {};
let scheduled = 0;
audio.schedule = () => scheduled++; audio.active = true; audio.paused = true;
await audio.setTrack('broken.mp3'); audio.track.onerror();
assert.equal(audio.track, null); assert.equal(scheduled, 0, 'Speaker pause must survive an audio failure');
audio.paused = false; await audio.setTrack('broken-again.mp3'); audio.track.onerror();
assert.equal(scheduled, 1); assert.equal(audio.nextNote, 50.08);
await audio.setTrack('old.mp3'); const staleError = audio.track.onerror;
await audio.setTrack('new.mp3'); const current = audio.track; staleError();
assert.equal(audio.track, current, 'Stale errors must not replace newer music');
audio.ctx.currentTime = 360; await audio.setTrack(null);
assert.equal(audio.nextNote, 360.08, 'Procedural music must not replay missed scheduling time');
console.log('Maze regressions pass: Unicode names, safe CSV, audio fallback, speaker pause, stale media and score clock.');
