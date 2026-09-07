import assert from 'node:assert/strict';
import { test } from 'node:test';
import { eventsFromProbs, EventLedger, Resampler, normalizedWindow } from '../public/speech-v1/detection.mjs';

function probabilities(labels, score = 0.9) {
  const data = new Float32Array(labels.length * 6);
  labels.forEach((label, i) => {
    data[i * 6 + label] = score;
    data[i * 6 + (label === 0 ? 1 : 0)] = 1 - score;
  });
  return [data, [1, labels.length, 6]];
}
test('uses all six observed output classes and rejects stale five-class schema', () => {
  const args = probabilities([0, ...Array(8).fill(5), 0]);
  assert.equal(eventsFromProbs(...args, 1)[0].type, 'other');
  assert.throws(() => eventsFromProbs(new Float32Array(50), [1, 10, 5], 1), /Unexpected/);
});
test('rejects short noises and low-confidence events', () => {
  assert.deepEqual(eventsFromProbs(...probabilities([0, 1, 1, 0]), 1), []);
  assert.deepEqual(eventsFromProbs(...probabilities(Array(10).fill(1), 0.6), 1, 0.65), []);
  assert.equal(eventsFromProbs(...probabilities(Array(10).fill(1), 0.6), 1, 0.5).length, 1);
});
test('ignores filler predictions in zero padding beyond recorded audio', () => {
  assert.deepEqual(eventsFromProbs(...probabilities([...Array(10).fill(0), ...Array(10).fill(1)]), 0.2), []);
});
test('detects a hesitation when probability is split across sound subtypes', () => {
  const data = Float32Array.from(Array.from({length:10},()=>[.25,.25,.3,.2,0,0]).flat());
  const result = eventsFromProbs(data,[1,10,6],.2,.65);
  assert.equal(result.length,1); assert.equal(result[0].type,'um');
  assert.ok(Math.abs(result[0].confidence-.75)<1e-6);
});
test('normalizes quiet speech before padding and removes DC offset', () => {
  const samples = Float32Array.from([-.2,.1,.3,-.1,.2]);
  const a = normalizedWindow(samples,10);
  const b = normalizedWindow(samples.map(x=>x*.05+.02),10);
  for(let i=0;i<samples.length;i++) assert.ok(Math.abs(a[i]-b[i])<0.00003);
  assert.deepEqual([...a.slice(samples.length)],Array(5).fill(0));
  const mean=a.slice(0,5).reduce((s,x)=>s+x,0)/5;
  const variance=a.slice(0,5).reduce((s,x)=>s+(x-mean)**2,0)/4;
  assert.ok(Math.abs(mean)<1e-6); assert.ok(Math.abs(variance-1)<0.00001);
  assert.deepEqual([...normalizedWindow(new Float32Array(4),8)],Array(8).fill(0));
  assert.throws(()=>normalizedWindow(samples,2),/exceeds/);
});
test('overlap revisions and label changes count one sound only', () => {
  const ledger = new EventLedger(), chosen = new Set(['um','uh']);
  assert.equal(ledger.accept([{start:1,end:1.3,type:'um'}],0,2,chosen).length,1);
  assert.equal(ledger.accept([{start:.23,end:.6,type:'uh'}],.75,2.75,chosen).length,0);
  assert.equal(ledger.accept([{start:1,end:1.3,type:'um'}],.75,2.75,chosen).length,1);
});
test('waits for right context and allows explicit final file flush', () => {
  const events = [{start:1,end:1.4,type:'um'}], selected = new Set(['um']);
  const ledger = new EventLedger();
  assert.equal(ledger.accept(events,0,1.5,selected).length,0);
  assert.equal(ledger.accept(events,0,1.5,selected,true).length,1);
});
test('unselected sounds do not alert and old history stays bounded', () => {
  const ledger = new EventLedger();
  assert.equal(ledger.accept([{start:1,end:1.4,type:'other'}],0,2,new Set(['um'])).length,0);
  for(let n=0;n<200;n++) ledger.accept([{start:1,end:1.4,type:'um'}],n*2,n*2+2,new Set(['um']));
  assert.ok(ledger.seen.length <= 2);
});
test('resampling preserves timing and callback-boundary continuity at 44.1/48 kHz', () => {
  for (const rate of [44100,48000,16000]) {
    const input = Float32Array.from({length:rate*2}, (_,i)=>Math.sin(i/rate*2*Math.PI*400));
    const whole = new Resampler(rate).push(input);
    const split = new Resampler(rate), chunks = [];
    for(let i=0;i<input.length;i+=4096) chunks.push(...split.push(input.subarray(i,i+4096)));
    assert.ok(Math.abs(chunks.length-32000)<=1);
    assert.ok(Math.abs(chunks.length-whole.length)<=1);
    let max=0; for(let i=0;i<Math.min(chunks.length,whole.length);i++) max=Math.max(max,Math.abs(chunks[i]-whole[i]));
    assert.ok(max<0.00001, `boundary error ${max} at ${rate}`);
  }
});
