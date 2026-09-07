import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Transpile in memory so this also runs on the deployment's Node 20.
const source = ts.transpileModule(readFileSync(new URL('../src/scripts/speak/engine-v1.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
function harness() {
  const workers = [], timers = new Map(); let next = 0;
  class Worker {
    constructor() { workers.push(this); this.messages = []; }
    postMessage(message) { this.messages.push(message); }
    terminate() { this.terminated = true; }
    emit(data) { this.onmessage({ data }); }
  }
  const context = { exports: {}, Worker, Error, window: { setTimeout: (fn, ms) => { timers.set(++next, { fn, ms }); return next; } }, clearTimeout: id => timers.delete(id) };
  vm.runInNewContext(source, context);
  const engine = new context.exports.AcousticEngine();
  return { engine, workers, timers, async ready() { const prepared = engine.prepare(false, () => {}); workers.at(-1).emit({ type: 'ready', backend: 'webgpu' }); await prepared; } };
}
test('cancel preparation terminates worker and ignores stale ready/error callbacks', async () => {
  const h = harness(), preparing = h.engine.prepare(false, () => {}), rejected = assert.rejects(preparing, /cancelled/);
  const old = h.workers[0]; h.engine.dispose(); await rejected; await h.ready();
  old.emit({ type: 'ready', backend: 'stale' }); old.onerror();
  assert.equal(old.terminated, true); assert.equal(h.engine.ready, true); assert.equal(h.engine.backend, 'webgpu');
  h.engine.dispose(); assert.equal(h.timers.size, 0);
});
test('download failure is actionable and a new preparation can succeed', async () => {
  const h = harness(), preparing = h.engine.prepare(false, () => {}), rejected = assert.rejects(preparing, /HTTP 404/);
  h.workers[0].emit({ type: 'error', message: 'Model download HTTP 404' }); await rejected;
  assert.equal(h.engine.ready, false); assert.equal(h.timers.size, 0); await h.ready(); h.engine.dispose();
});
test('inference serializes requests, matches response IDs, and clears its timer', async () => {
  const h = harness(); await h.ready(); const worker = h.workers[0];
  const pending = h.engine.infer(new Float32Array(16000), .7);
  await assert.rejects(h.engine.infer(new Float32Array(100), .7), /not ready/);
  const id = worker.messages.at(-1).id;
  worker.emit({ type: 'result', id: id + 1, events: [], ms: 1 }); assert.equal(h.timers.size, 1);
  worker.emit({ type: 'result', id, events: [], ms: 120 }); assert.equal((await pending).ms, 120);
  assert.equal(h.timers.size, 0); h.engine.dispose();
});
test('stop rejects pending inference and a late result cannot affect restart', async () => {
  const h = harness(); await h.ready(); const old = h.workers[0], pending = h.engine.infer(new Float32Array(100), .7);
  const rejected = assert.rejects(pending, /cancelled/); h.engine.dispose(); await rejected; await h.ready();
  old.emit({ type: 'result', id: 1, events: [], ms: 1 }); assert.equal(h.engine.ready, true); h.engine.dispose();
});
test('bounded preparation and inference timeouts terminate stalled workers', async () => {
  const h = harness(), preparing = h.engine.prepare(false, () => {}), rejected = assert.rejects(preparing, /timed out/);
  [...h.timers.values()].find(t => t.ms === 180000).fn(); await rejected; assert.equal(h.workers[0].terminated, true);
  await h.ready(); const pending = h.engine.infer(new Float32Array(100), .7), stalled = assert.rejects(pending, /too long/);
  [...h.timers.values()].find(t => t.ms === 15000).fn(); await stalled; assert.equal(h.engine.ready, false);
});
