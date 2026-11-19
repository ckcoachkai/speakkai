(function initSoundFactory() {
  'use strict';
  const cues = ['hover', 'check', 'uncheck', 'navigate', 'open', 'close', 'tap'];
  const path = cue => 'assets/ui-' + cue + '.mp3';

  window.createDiaryUiSounds = function (enabled, onBlockedHover) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    const bytes = new Map();
    const decoded = new Map();
    const fallback = new Audio();
    let context;
    let mediaOnly = !AudioEngine || location.protocol === 'file:';
    let current = null;
    let sequence = 0;
    let lastInteraction = -Infinity;
    let lastHover = -Infinity;
    let gaveUnlockHint = false;

    function hintOnce() {
      if (gaveUnlockHint || !enabled() || document.hidden || navigator.userActivation?.hasBeenActive) return;
      gaveUnlockHint = true;
      onBlockedHover();
    }

    function read(cue) {
      if (!bytes.has(cue)) {
        const request = fetch(path(cue)).then(response => {
          if (!response.ok) throw new Error('Audio unavailable');
          return response.arrayBuffer();
        }).catch(() => { bytes.delete(cue); return null; });
        bytes.set(cue, request);
      }
      return bytes.get(cue);
    }
    function prepare() {
      if (!enabled() || mediaOnly) return;
      cues.forEach(read);
    }
    function getContext() {
      if (!context && !mediaOnly) {
        try { context = new AudioEngine({latencyHint:'interactive'}); }
        catch (_) { mediaOnly = true; }
      }
      return context;
    }
    function unlock() {
      if (!enabled()) return;
      const ctx = getContext();
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    }
    function buffer(cue, ctx) {
      if (!decoded.has(cue)) {
        const pending = read(cue).then(data => {
          if (!data) throw new Error('Missing cue');
          return ctx.decodeAudioData(data.slice(0));
        }).catch(() => { decoded.delete(cue); return null; });
        decoded.set(cue, pending);
      }
      return decoded.get(cue);
    }
    function release() {
      if (current) {
        const voice = current;
        current = null;
        const now = context.currentTime;
        voice.gain.gain.setTargetAtTime(0, now, 0.003);
        voice.source.stop(now + 0.015);
      }
      fallback.pause();
    }
    function stop() { sequence++; release(); }
    function playMedia(cue) {
      fallback.src = path(cue);
      const result = fallback.play();
      if (result) result.catch(error => {
        if (cue === 'hover' && error.name === 'NotAllowedError') hintOnce();
      });
    }
    async function play(cue) {
      if (!enabled() || document.hidden) return;
      const startedAt = performance.now();
      const hover = cue === 'hover';
      if (hover) {
        if (startedAt-lastHover < 135 || startedAt-lastInteraction < 190) return;
        lastHover = startedAt;
      } else lastInteraction = startedAt;
      const ctx = getContext();
      // A blocked hover expires here. It must never replay after a later tap unlocks audio.
      if (hover && ctx && ctx.state !== 'running') { hintOnce(); return; }
      const request = ++sequence;
      try {
        if (!ctx) { release(); playMedia(cue); return; }
        if (ctx.state !== 'running') await ctx.resume();
        const sample = await buffer(cue,ctx);
        if (!enabled() || document.hidden || request !== sequence || performance.now()-startedAt > (hover?350:850)) return;
        release();
        if (!sample) { playMedia(cue); return; }
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = sample;
        source.connect(gain);
        gain.connect(ctx.destination);
        const voice = {source,gain};
        current = voice;
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          if (current === voice) current = null;
        };
        source.start();
      } catch (_) { /* Input must keep working when the browser blocks sound. */ }
    }
    return {prepare,unlock,play,stop};
  };
})();
