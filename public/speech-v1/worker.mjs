import * as ort from './ort.all.min.mjs';
import { eventsFromProbs, normalizedWindow, SR } from './detection.mjs';
let session, backend = 'wasm';
const LENGTH = SR * 6;
const send = (message) => self.postMessage(message);
async function prepare(forceCPU) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('./', import.meta.url).href;
  ort.env.webgpu.powerPreference = 'high-performance';
  ort.env.logLevel = 'error';
  send({ type: 'progress', text: 'Downloading the speech model…' });
  const response = await fetch(new URL('./uhm-6s-v1.onnx', import.meta.url), { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`The speech model could not download (HTTP ${response.status}). Check your connection and try again.`);
  const reader = response.body.getReader(), parts = [];
  let size = 0, last = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    parts.push(value); size += value.length;
    if (performance.now() - last > 100) {
      last = performance.now(); send({ type:'progress', text:`Downloading speech model: ${(size / 1048576).toFixed(1)} / 44.9 MB` });
    }
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  if (size !== 47047128) throw new Error('The speech model download was incomplete. Reload and try again.');
  const options = { enableMemPattern: false, enableCpuMemArena: false, executionMode:'sequential' };
  if (!forceCPU && 'gpu' in navigator) {
    send({ type:'progress', text:'Preparing the speech model on your device…' });
    try { session = await ort.InferenceSession.create(bytes, { ...options, executionProviders:['webgpu'] }); backend = 'webgpu'; }
    catch { send({ type:'progress', text:'Preparing CPU recognition…' }); }
  }
  if (!session) session = await ort.InferenceSession.create(bytes, { ...options, executionProviders:['wasm'] });
  if (session.inputMetadata[0].shape[1] !== LENGTH) throw new Error('Speech model version mismatch. Reload the page.');
  send({ type:'progress', text:'Checking the speech model…' });
  const test = await infer(new Float32Array(LENGTH), 0.7);
  if (test.events.length) throw new Error('The speech model failed its silence check. Try CPU mode.');
  send({ type:'ready', backend, ms:test.ms });
}
async function infer(samples, threshold) {
  if (!session) throw new Error('Speech model is not ready.');
  const input = new ort.Tensor('float32', normalizedWindow(samples, LENGTH), [1,LENGTH]);
  let outputs;
  const started = performance.now();
  try {
    outputs = await session.run({ audio:input });
    const probs = outputs.probs;
    if (!probs || !(probs.data instanceof Float32Array)) throw new Error('Unexpected speech model output. Try CPU mode.');
    return { events:eventsFromProbs(probs.data,probs.dims,samples.length/SR,threshold), ms:performance.now()-started };
  } finally { input.dispose(); if (outputs) for (const output of Object.values(outputs)) output.dispose(); }
}
self.onmessage = async ({ data }) => {
  try {
    if (data.type==='prepare') await prepare(data.forceCPU);
    if (data.type==='infer') send({ type:'result', id:data.id, ...await infer(data.samples,data.threshold) });
  } catch (error) { send({ type:'error', message: error instanceof Error ? error.message : String(error) }); }
};
