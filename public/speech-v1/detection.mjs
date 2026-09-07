// The pinned model emits SIX classes, as its model card documents. Its
// labels.json and older demo incorrectly list five; do not use their stride.
export const LABELS = ['not_filler', 'uh', 'um', 'hmm', 'and', 'other'];
export const SR = 16000;
export const WINDOW_SECONDS = 6;
export const HOP_SECONDS = 0.4;
export const CONTEXT_SECONDS = 0.2;

// Match the vendor's training feature extractor: normalize actual audio
// before zero padding. Including padding in the variance changes quiet clips.
export function normalizedWindow(samples, length) {
  if (samples.length > length) throw new Error('Audio exceeds the model window.');
  const result = new Float32Array(length);
  if (!samples.length) return result;
  let mean = 0;
  for (const sample of samples) mean += sample;
  mean /= samples.length;
  let squared = 0;
  for (const sample of samples) squared += (sample - mean) ** 2;
  const std = Math.sqrt(squared / Math.max(1, samples.length - 1)) + 1e-7;
  for (let i = 0; i < samples.length; i++) result[i] = (samples[i] - mean) / std;
  return result;
}

export function eventsFromProbs(data, dims, duration, threshold = 0.65) {
  if (dims.length !== 3 || dims[0] !== 1 || dims[2] !== LABELS.length)
    throw new Error(`Unexpected Uhm output shape: ${dims.join(' × ')}`);
  const frames = Math.min(dims[1], Math.floor(duration / 0.02));
  const events = [];
  let start = -1, sum = 0, votes = Array(LABELS.length).fill(0);
  const finish = (end) => {
    if (start >= 0 && end - start >= 6 && sum / (end - start) >= threshold) {
      let label = 1;
      for (let c = 2; c < votes.length; c++) if (votes[c] > votes[label]) label = c;
      events.push({ start: start * 0.02, end: end * 0.02,
        confidence: sum / (end - start), type: LABELS[label] });
    }
    start = -1; sum = 0; votes.fill(0);
  };
  for (let t = 0; t < frames; t++) {
    // Detect hesitation independently of how its probability is split across
    // subtypes. Vendor definition: p(filler) = 1 - p(not_filler).
    let best = 1;
    for (let c = 2; c < dims[2]; c++) if (data[t * dims[2] + c] > data[t * dims[2] + best]) best = c;
    const p = 1 - data[t * dims[2]];
    if (!Number.isFinite(p) || p < 0.5) { finish(t); continue; }
    if (start < 0) start = t;
    sum += p; votes[best]++;
  }
  finish(frames);
  return events;
}

// Commit only completed events with right context. Overlapping windows may
// change a subtype or boundary; one physical span still counts only once.
export class EventLedger {
  seen = [];
  accept(events, offset, end, selected, flush = false) {
    this.seen = this.seen.filter(e => e.end >= offset - 1);
    const accepted = [];
    for (const event of events) {
      const e = { ...event, start: event.start + offset, end: event.end + offset };
      if (!flush && e.end > end - CONTEXT_SECONDS) continue;
      if (offset > 0 && event.start < 0.15) continue;
      if (!selected.has(e.type)) continue;
      if (this.seen.some(prev => e.start < prev.end + 0.1 && e.end > prev.start - 0.1)) continue;
      this.seen.push(e); accepted.push(e);
    }
    return accepted;
  }
}

// Preserve fractional position across microphone callbacks (44.1 kHz included).
export class Resampler {
  position = 0;
  pending = new Float32Array(0);
  constructor(rate) { this.ratio = rate / SR; }
  push(input) {
    const data = new Float32Array(this.pending.length + input.length);
    data.set(this.pending); data.set(input, this.pending.length);
    const output = [];
    while (this.position + this.ratio <= data.length) {
      const end = this.position + this.ratio;
      let total = 0;
      for (let i = Math.floor(this.position); i < Math.ceil(end); i++)
        total += data[i] * (Math.min(i + 1, end) - Math.max(i, this.position));
      output.push(total / this.ratio);
      this.position = end;
    }
    const used = Math.floor(this.position);
    this.pending = data.slice(used); this.position -= used;
    return Float32Array.from(output);
  }
}
