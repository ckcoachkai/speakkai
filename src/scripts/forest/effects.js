const EFFECTS = ['step-leaves', 'step-dirt', 'chomp', 'crack', 'splat', 'banana-pop'];
export function createForestEffects() {
  let audio, gain, loading, enabled = true, lastStep = -1, lastPop = -1;
  const buffers = {}, active = new Set();
  const stats = { ready: false, footsteps: 0, chomps: 0, pickups: 0 };
  async function load(context, destination) {
    if (loading) return loading;
    audio = context;
    if (!gain) { gain = audio.createGain(); gain.gain.value = enabled ? 0.85 : 0; gain.connect(destination); }
    loading = Promise.all(EFFECTS.map(async id => {
      const response = await fetch(`/forest/sfx/${id}.mp3?v=foley-1`);
      if (!response.ok) throw new Error(`Could not load effect: ${id}`);
      buffers[id] = await audio.decodeAudioData(await response.arrayBuffer());
    })).then(() => { stats.ready = true; }).catch(error => { loading = null; throw error; });
    return loading;
  }
  function play(id, volume, pan = 0, delay = 0, rate = 1) {
    if (!enabled || !stats.ready || audio.state !== 'running') return;
    const source = audio.createBufferSource(), level = audio.createGain();
    source.buffer = buffers[id]; source.playbackRate.value = rate;
    level.gain.value = volume; source.connect(level);
    let panner;
    if (audio.createStereoPanner) { panner = audio.createStereoPanner(); panner.pan.value = Math.max(-0.8, Math.min(0.8, pan)); level.connect(panner); panner.connect(gain); }
    else level.connect(gain);
    active.add(source);
    source.onended = () => { active.delete(source); source.disconnect(); level.disconnect(); panner?.disconnect(); };
    source.start(audio.currentTime + delay);
  }
  function footstep(x, width, count) {
    if (!audio || !enabled || !stats.ready || audio.currentTime - lastStep < 0.065) return;
    lastStep = audio.currentTime; stats.footsteps++;
    play(Math.random() < 0.5 ? 'step-leaves' : 'step-dirt', 0.36 / Math.sqrt(Math.max(1, count)), x / width * 2 - 1, 0, 0.9 + Math.random() * 0.2);
  }
  function bite(x, width, fromAge = 0) {
    stats.chomps++;
    const pan = x / width * 2 - 1;
    // Five irregular chews make a longer cartoon crunch, with twice the old gain.
    [0, 0.37, 0.79, 1.16, 1.61].forEach((delay, i) => {
      if(delay >= fromAge) play(i % 2 === 0 ? 'crack' : 'chomp', 1.65, pan, delay - fromAge, 0.84 + Math.random() * 0.16);
    });

  }
  function pickup(x, width) {
    if (!audio || audio.currentTime - lastPop < 0.15) return;
    lastPop = audio.currentTime; stats.pickups++;
    play('banana-pop', 0.24, x / width * 2 - 1, 0, 0.94 + Math.random() * 0.12);
  }
  function stop() { for (const source of active) { try { source.stop(); } catch {} } active.clear(); }
  function setEnabled(value) { enabled = value; if (gain) gain.gain.setTargetAtTime(value ? 0.85 : 0, audio.currentTime, 0.025); if (!value) stop(); }
  return { load, footstep, bite, pickup, stop, setEnabled, stats };
}

export function createKetchupParticles() {
  const particles = [];
  function splash(x, y, count = 2, burst = false) {
    for (let i = 0; i < count && particles.length < 220; i++) {
      particles.push({ x, y, vx: (Math.random() - 0.6) * (burst ? 420 : 100), vy: -70 - Math.random() * (burst ? 290 : 100),
        radius: 4 + Math.random() * (burst ? 10 : 5), age: 0, life: 0.6 + Math.random() * 0.55 });
    }
  }
  function draw(ctx, dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.age += dt;
      if (p.age >= p.life) { particles.splice(i, 1); continue; }
      p.vy += 460 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.save(); ctx.globalAlpha = Math.min(1, (p.life - p.age) * 3);
      ctx.fillStyle = '#ee3825'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.radius, p.radius * 1.3, Math.atan2(p.vy, p.vx), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffac73'; ctx.beginPath(); ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  return { splash, draw, clear: () => { particles.length = 0; }, get count() { return particles.length; } };
}
