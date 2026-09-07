import { AcousticEngine, type Inference, type FillerEvent } from './engine-v1';
import { PracticeAudio } from './capture-v1';
// @ts-ignore Shared with the worker and Node regression tests.
import { EventLedger, Resampler, SR, HOP_SECONDS, WINDOW_SECONDS } from '../../../public/speech-v1/detection.mjs';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const start = $<HTMLButtonElement>('start'), stop = $<HTMLButtonElement>('stop');
const sensitivity = $<HTMLSelectElement>('sensitivity'), microphone = $<HTMLSelectElement>('microphone');
const clip = $<HTMLInputElement>('clip'), player = $<HTMLAudioElement>('clip-player');
const siren = $<HTMLInputElement>('siren'), volume = $<HTMLInputElement>('volume');
const red = $<HTMLInputElement>('red-alert'), cpu = $<HTMLInputElement>('force-cpu');
const engine = new AcousticEngine();
const bars = Array.from($('level').children) as HTMLElement[];
const audio = new PracticeAudio(level => {
  bars.forEach((bar, i) => {
    bar.style.height = String(5 + level * 33 * (0.45 + Math.sin(i * 1.6) ** 2 * 0.55)) + 'px';
    bar.style.opacity = String(0.25 + level * 0.75);
  });
  if (mode === 'live') $('level').setAttribute('aria-label', 'Microphone level ' + Math.round(level * 100) + ' percent');
});
type Mode = 'idle' | 'preparing' | 'permission' | 'live' | 'file' | 'finishing';
let mode: Mode = 'idle', epoch = 0, timer = 0, flashTimer = 0, lastAlert = -Infinity;
let received = 0, lastSubmitted = 0, seconds = 0, total = 0, lastAudible = 0;
let ring: Float32Array = new Float32Array(0), ledger = new EventLedger();
let current: Promise<void> | null = null, objectURL = '';
const chosen = () => new Set(Array.from(document.querySelectorAll<HTMLInputElement>('#sound-selection input:checked'), el => el.value));
const clock = (s: number) => String(Math.floor(s / 60)).padStart(2,'0') + ':' + String(Math.floor(s % 60)).padStart(2,'0');
const say = (text: string) => { $('status').textContent = text; $('status').classList.toggle('is-live', mode === 'live'); };
function controls() {
  const idle = mode === 'idle';
  start.hidden = !idle; stop.hidden = idle; stop.disabled = mode === 'finishing';
  sensitivity.disabled = !idle; microphone.disabled = !idle; cpu.disabled = !idle; clip.disabled = !idle;
  ($('sound-selection') as HTMLFieldSetElement).disabled = !idle;
  $('clear').hidden = !idle || (!total && !seconds);
}
function stats() {
  $('elapsed').textContent = clock(seconds); $('total').textContent = String(total).padStart(2,'0');
  $('rate').textContent = seconds >= 10 ? (total / seconds * 60).toFixed(1) : '—';
}
function clearFlash() {
  clearTimeout(flashTimer); document.body.classList.remove('has-alert'); audio.silence();
  $('stage-title').textContent = 'Speak with intention.'; $('stage-kicker').textContent = 'MAKE ROOM FOR THE PAUSE';
}
function reset() {
  clearFlash(); ring = new Float32Array(0); ledger = new EventLedger();
  received = 0; lastSubmitted = 0; seconds = 0; total = 0; lastAudible = 0; lastAlert = -Infinity;
  $('events').replaceChildren(); $('empty-events').hidden = false; $('error').hidden = true; $('mic-warning').hidden = true;
  $('session-summary').textContent = 'Sound labels are estimates. Some hesitations may be missed.';
  $('delay').textContent = 'Alert delay will appear after a detection.'; stats();
}
function releaseClip() {
  player.pause(); player.removeAttribute('src'); player.hidden = true;
  if (objectURL) URL.revokeObjectURL(objectURL); objectURL = '';
}
function shutdown(message: string) {
  epoch++; clearInterval(timer); mode = 'idle'; current = null;
  audio.releaseMicrophone(); engine.dispose(); ring = new Float32Array(0); clearFlash();
  $('level').setAttribute('aria-label','Microphone inactive'); $('mic-warning').hidden = true;
  $('permission-note').textContent = 'Microphone is off. No audio was saved.';
  controls(); say(message); stats();
}
function failure(error: unknown) {
  let message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError') message = 'Microphone access was blocked. Allow the microphone in your browser’s site settings, then start again.';
  if (name === 'NotFoundError') message = 'No microphone was found. Connect a microphone and try again.';
  if (name === 'NotReadableError') message = 'The microphone is unavailable. Close other apps using it or choose another microphone.';
  if (name === 'OverconstrainedError') { microphone.value = ''; message = 'That microphone is no longer available. The system default is selected; try again.'; }
  shutdown('Practice stopped'); $('error').textContent = message; $('error').hidden = false;
  $('stage-help').textContent = 'Check the message below, then try again.';
}
async function devices() {
  try {
    const list = await navigator.mediaDevices.enumerateDevices(), previous = microphone.value;
    microphone.replaceChildren(new Option('System default',''));
    list.filter(d => d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications')
      .forEach((device,i) => microphone.add(new Option(device.label || 'Microphone ' + (i+1),device.deviceId)));
    if (Array.from(microphone.options).some(o => o.value === previous)) microphone.value = previous;
    $('microphone-note').textContent = 'Choose a microphone between sessions. Speak normally and check that the meter moves.';
  } catch { /* Default microphone remains available if enumeration is restricted. */ }
}
function alarm(test = false) {
  if (!test && performance.now() - lastAlert < 2000) return;
  lastAlert = performance.now(); clearTimeout(flashTimer);
  if (red.checked) document.body.classList.add('has-alert');
  $('stage-title').textContent = test ? 'This is your alert.' : 'Take a pause.';
  $('stage-kicker').textContent = test ? 'ALERT TEST' : 'HESITATION DETECTED';
  $('alert-announcement').textContent = test ? 'Test alert' : 'Hesitation detected. Take a pause.';
  if (siren.checked) audio.siren(Number(volume.value) / 100);
  flashTimer = window.setTimeout(clearFlash,1100);
}
function results(result: Inference, offset: number, end: number, flush = false, live = false) {
  $('performance').textContent = (engine.backend === 'webgpu' ? 'GPU' : 'CPU') + ' · latest processing pass ' + Math.round(result.ms) + ' ms · on-device model 1.0';
  const events: FillerEvent[] = ledger.accept(result.events,offset,end,chosen(),flush);
  for (const event of events) {
    total++;
    const row = document.createElement('li'), time = document.createElement('span'), word = document.createElement('span'), score = document.createElement('span');
    time.className = 'event-time'; time.textContent = clock(event.start);
    word.className = 'event-word'; word.textContent = event.type === 'other' ? 'Hesitation' : event.type + ' · estimated';
    score.className = 'event-score'; score.textContent = 'score ' + Math.round(event.confidence * 100) + '%';
    row.append(time,word,score); $('events').prepend(row); $('empty-events').hidden = true;
    while ($('events').children.length > 100) $('events').lastElementChild?.remove();
    if (live) {
      const lag = Math.max(0, received / SR - event.end);
      $('delay').textContent = 'Latest feedback arrived about ' + lag.toFixed(1) + ' seconds after the sound.'; alarm();
    }
  }
  stats();
}
async function processLive(token: number) {
  if (mode !== 'live' || current || received < SR || received - lastSubmitted < SR * HOP_SECONDS) return;
  const samples = ring.slice(), end = received / SR, offset = end - samples.length / SR; lastSubmitted = received;
  current = (async () => {
    try {
      const result = await engine.infer(samples,Number(sensitivity.value));
      if (token !== epoch) return;
      results(result,offset,end,false,mode === 'live');
      if (mode === 'live') say(result.ms > 1500 ? 'Listening · feedback is delayed on this device' : 'Listening on your device');
    } catch (error) { if (token === epoch) failure(error); }
    finally { if (token === epoch) current = null; }
  })();
}
async function begin(fileMode = false) {
  if (!chosen().size) { $('error').textContent = 'Select at least one sound to flag.'; $('error').hidden = false; return null; }
  reset(); releaseClip(); const token = ++epoch; mode = 'preparing'; controls();
  $('session-kind').textContent = fileMode ? 'Audio recording' : 'Live practice';
  $('stage-help').textContent = 'Preparing recognition. You can stop at any time.'; say('Preparing your session…');
  await audio.unlock(); if (token !== epoch) return null;
  await engine.prepare(cpu.checked,text => { if (token === epoch) { say(text); $('permission-note').textContent = text; } });
  return token === epoch ? token : null;
}
start.addEventListener('click',async () => {
  if (mode !== 'idle') return; let token = epoch + 1;
  try {
    const started = await begin(); if (started === null) return; token = started;
    mode = 'permission'; say('Allow microphone access'); controls(); $('stage-help').textContent = 'Allow your microphone when the browser asks.';
    const resampler = new Resampler(audio.context!.sampleRate);
    await audio.startCapture(microphone.value,(data) => {
      if (token !== epoch || mode !== 'live') return;
      const samples = resampler.push(data); received += samples.length; seconds = received / SR;
      const joined = new Float32Array(ring.length + samples.length); joined.set(ring); joined.set(samples,ring.length);
      ring = joined.slice(-SR * WINDOW_SECONDS);
      let squared = 0; for (const sample of samples) squared += sample * sample;
      if (samples.length && Math.sqrt(squared / samples.length) > 0.003) lastAudible = seconds;
    });
    if (token !== epoch) { audio.releaseMicrophone(); return; }
    mode = 'live'; controls(); say('Listening on your device'); void devices();
    $('stage-help').textContent = 'One thought at a time. A quiet pause is welcome.';
    $('permission-note').textContent = 'Microphone is on. Use headphones for the siren.';
    timer = window.setInterval(() => {
      stats(); $('mic-warning').hidden = seconds - lastAudible < 8;
      $('mic-warning').textContent = 'Very little sound is reaching the microphone. If you are speaking, stop and choose another microphone or move closer.';
      void processLive(token);
    },100);
  } catch (error) { if (token === epoch) failure(error); }
});
stop.addEventListener('click',async () => {
  if (mode === 'finishing') return;
  if (mode !== 'live') { shutdown('Stopped'); $('stage-help').textContent = 'Start again whenever you are ready.'; return; }
  const token = epoch;
  audio.releaseMicrophone(); clearInterval(timer); clearFlash(); $('mic-warning').hidden = true;
  mode = 'finishing'; controls(); say('Microphone off · finishing your results…');
  try {
    if (current) await current; if (token !== epoch) return;
    if (engine.ready && ring.length >= 400) {
      const result = await engine.infer(ring.slice(),Number(sensitivity.value));
      if (token !== epoch) return;
      results(result,seconds - ring.length / SR,seconds,true,false);
    }
    $('session-summary').textContent = total + ' detected sounds in ' + clock(seconds) + '. ' + (total > 100 ? 'Showing the latest 100. ' : '') + 'Treat this as practice feedback.';
    shutdown('Session complete'); $('stage-help').textContent = 'Take a breath. Start again whenever you are ready.';
    $('permission-note').textContent = 'Microphone is off. No audio was saved.';
  } catch (error) { if (token === epoch) failure(error); }
});
clip.addEventListener('change',async () => {
  const file = clip.files?.[0]; if (!file || mode !== 'idle') return;
  if (file.size > 20 * 1024 * 1024) { $('error').textContent = 'Choose a recording smaller than 20 MB.'; $('error').hidden = false; clip.value = ''; return; }
  let token = epoch + 1;
  try {
    const started = await begin(true); if (started === null) return; token = started;
    mode = 'file'; controls(); say('Reading your recording locally…');
    const decoded = await audio.context!.decodeAudioData(await file.arrayBuffer());
    if (token !== epoch) return;
    if (decoded.duration > 60 || decoded.duration < 0.1) throw new Error('Choose a recording between 0.1 and 60 seconds long.');
    const context = new OfflineAudioContext(1,Math.ceil(decoded.duration * SR),SR), source = context.createBufferSource();
    source.buffer = decoded; source.connect(context.destination); source.start();
    const samples = (await context.startRendering()).getChannelData(0);
    if (token !== epoch) return;
    objectURL = URL.createObjectURL(file); player.src = objectURL; player.hidden = false;
    for (let end = Math.min(samples.length,SR);; end = Math.min(samples.length,end + SR * HOP_SECONDS)) {
      if (token !== epoch) return;
      const from = Math.max(0,end - SR * WINDOW_SECONDS); received = end; seconds = end / SR;
      say('Checking recording: ' + Math.round(end / samples.length * 100) + '%');
      const result = await engine.infer(samples.slice(from,end),Number(sensitivity.value));
      if (token !== epoch) return;
      results(result,from / SR,end / SR,end === samples.length,false);
      if (end === samples.length) break;
    }
    $('session-summary').textContent = total + ' detected sounds. Play your recording to compare them with what you hear.';
    shutdown('Recording checked'); $('stage-help').textContent = 'Compare the detections with your recording below.';
    $('permission-note').textContent = 'Your recording stayed on your device. Nothing was uploaded.';
  } catch (error) { if (token === epoch) failure(error); }
  finally { clip.value = ''; }
});
$('test-alert').addEventListener('click',async () => {
  try { await audio.unlock(); alarm(true); } catch { failure(new Error('Audio playback could not start. Check your browser sound settings.')); }
});
siren.addEventListener('change',() => { if (!siren.checked) audio.silence(); });
red.addEventListener('change',() => { if (!red.checked) document.body.classList.remove('has-alert'); });
volume.addEventListener('input',() => { $('volume-value').textContent = volume.value + '%'; audio.silence(); });
$('clear').addEventListener('click',() => { if (mode === 'idle') { reset(); releaseClip(); controls(); say('Ready when you are'); } });
document.addEventListener('visibilitychange',() => {
  if (document.hidden && mode !== 'idle') { shutdown('Paused because this tab was hidden'); $('permission-note').textContent = 'Microphone is off. Start again to resume.'; }
});
window.addEventListener('pagehide',() => { shutdown('Stopped'); releaseClip(); audio.dispose(); });
navigator.mediaDevices?.addEventListener('devicechange',() => { if (mode === 'idle') void devices(); });
if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.Worker || !window.WebAssembly) {
  start.disabled = true; clip.disabled = true;
  $('error').textContent = 'Use the secure SpeakKai website in a current Chrome, Edge, Safari, or Firefox browser with microphone support.';
  $('error').hidden = false;
}
