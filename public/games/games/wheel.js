const TAU = Math.PI * 2;
const PALETTE = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
const INK = '#101b33';

/** One equal slice per name; the random result is chosen before the visual spin. */
export default function createGame({ container, names = [], onPick, random }) {
  const players = names.map((person, index) => ({
    ...person,
    name: String(person.name ?? `Player ${index + 1}`),
    // Wheel colors deliberately stay vivid even when the shared roster uses pastels.
    color: PALETTE[index % PALETTE.length],
    labelColor: index % PALETTE.length === 2 ? INK : '#ffffff',
  }));
  const rng = () => {
    const value = typeof random === 'function' ? Number(random()) : crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
  };
  const root = document.createElement('div');
  Object.assign(root.style, { width: '100%', height: '100%', minHeight: '300px', position: 'relative', overflow: 'hidden', background: INK, borderRadius: 'inherit' });
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `Name wheel with ${players.length} equal slices. ${players.map(p => p.name).join(', ')}`);
  const live = document.createElement('div');
  live.setAttribute('aria-live', 'polite');
  Object.assign(live.style, { position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' });
  root.append(canvas, live);
  container.append(root);
  const ctx = canvas.getContext('2d');
  let width = 1000;
  let height = 560;
  let destroyed = false;
  let frame = 0;
  let phase = 'idle';
  let rotation = 0;
  let chosen = -1;
  let startAt = 0;
  let spinTime = 0;
  let fromRotation = 0;
  let travel = 0;
  let burstAt = 0;
  let particles = [];
  let reported = false;
  let layout;
  const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

  function font(size, weight = 700) {
    return `${weight} ${size}px "Aptos", "Segoe UI", system-ui, sans-serif`;
  }
  function fit(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const letters = graphemes ? Array.from(graphemes.segment(text), item => item.segment) : Array.from(text);
    while (letters.length && ctx.measureText(`${letters.join('')}…`).width > maxWidth) letters.pop();
    return `${letters.join('')}…`;
  }
  function roundRect(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function text(textValue, x, y, size, color = '#fff1d5', weight = 700, align = 'left') {
    ctx.font = font(size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(textValue, x, y);
  }
  function size() {
    if (destroyed) return;
    const bounds = root.getBoundingClientRect();
    width = Math.max(260, bounds.width || 1000);
    height = Math.max(300, bounds.height || 560);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const compact = width < 710;
    const radius = Math.max(55, Math.min(width * .415, (height - 138) * .45));
    layout = { compact, radius, cx: width / 2, cy: Math.max(radius + 38, (height - 65) / 2) };
    draw(performance.now());
  }
  function background() {
    ctx.clearRect(0, 0, width, height);
    const wash = ctx.createRadialGradient(layout.cx, layout.cy, 0, layout.cx, layout.cy, Math.max(width, height) * .62);
    wash.addColorStop(0, '#23252b'); wash.addColorStop(1, '#0e0f12');
    ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
    if (!players.length) text('Add names to begin', width / 2, layout.cy + layout.radius + 30, 12, '#a1a1aa', 500, 'center');
  }
  function wheel(time) {
    const { cx, cy, radius: r } = layout;
    const segment = TAU / Math.max(1, players.length);
    const exploding = phase === 'burst' || phase === 'done';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 13;
    ctx.beginPath(); ctx.arc(cx, cy, r + 15, 0, TAU); ctx.fillStyle = '#091426'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r + 11, 0, TAU); ctx.strokeStyle = '#8e9099'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, TAU); ctx.strokeStyle = '#303137'; ctx.lineWidth = 8; ctx.stroke();
    for (let dot = 0; dot < 36; dot++) {
      const angle = dot * TAU / 36 - Math.PI / 2;
      const active = phase === 'spin' ? ((dot + Math.floor(time / 65)) % 5 < 2) : dot % 3 === 0;
      ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * (r + 11), cy + Math.sin(angle) * (r + 11), Math.max(1.5, r * .008), 0, TAU);
      ctx.fillStyle = active ? '#f5f5f7' : '#55565e'; ctx.fill();
    }
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rotation - Math.PI / 2);
    if (!players.length) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#22344d'; ctx.fill();
    }
    players.forEach((player, index) => {
      if (index === chosen && exploding) return;
      const a = index * segment, b = a + segment, middle = (a + b) / 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a, b); ctx.closePath();
      ctx.fillStyle = player.color; ctx.fill();
      const gloss = ctx.createRadialGradient(0, 0, r * .2, 0, 0, r);
      gloss.addColorStop(0, 'rgba(255,255,255,.06)'); gloss.addColorStop(.8, 'rgba(255,255,255,0)'); gloss.addColorStop(1, 'rgba(0,0,0,.13)');
      ctx.fillStyle = gloss; ctx.fill();
      ctx.strokeStyle = 'rgba(16,27,51,.32)'; ctx.lineWidth = players.length > 30 ? 1 : 2; ctx.stroke();
      ctx.save();
      ctx.rotate(middle);
      const worldAngle = middle + rotation - Math.PI / 2;
      const flip = Math.cos(worldAngle) < 0;
      if (flip) ctx.rotate(Math.PI);
      const fontSize = Math.max(7, Math.min(16, r * .077, r * .8 * segment * .7));
      ctx.font = font(fontSize, 800); ctx.fillStyle = player.labelColor;
      ctx.textBaseline = 'middle'; ctx.textAlign = flip ? 'left' : 'right';
      const maxLabel = players.length > 2 ? r * .57 : r * .68;
      ctx.fillText(fit(player.name, maxLabel), (flip ? -1 : 1) * r * .875, 0);
      ctx.restore();
    });
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = '#fff1d5'; ctx.lineWidth = 2; ctx.stroke();
    const hubRadius = Math.max(21, r * .16);
    ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(0,0,0,.27)';
    ctx.beginPath(); ctx.arc(cx, cy, hubRadius + 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, hubRadius, 0, TAU); ctx.fillStyle = '#fff1d5'; ctx.fill(); ctx.restore();
    text(phase === 'idle' ? 'SPIN' : exploding ? '★' : '?', cx, cy + 1, phase === 'spin' ? hubRadius * 1.1 : hubRadius * .59, INK, 900, 'center');
    // The stationary gold pointer touches the middle of the winning slice.
    ctx.save(); ctx.translate(cx, cy - r - 8);
    const bounce = phase === 'spin' ? Math.sin(time / 38) * 1.8 : 0;
    ctx.rotate(bounce * Math.PI / 180);
    ctx.shadowColor = '#f8c75a'; ctx.shadowBlur = 13;
    ctx.beginPath(); ctx.moveTo(-13, -22); ctx.lineTo(13, -22); ctx.lineTo(0, 12); ctx.closePath();
    ctx.fillStyle = '#f8c75a'; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff1d5'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();

  }
  function makeBurst() {
    particles = [];
    for (let i = 0; i < 125; i++) {
      const angle = -Math.PI / 2 + (rng() - .5) * 2.25;
      const radius = layout.radius * (.16 + rng() * .78);
      const speed = 80 + rng() * 300;
      particles.push({
        ox: Math.cos(angle) * radius,
        oy: Math.sin(angle) * radius,
        vx: Math.cos(angle) * speed + (rng() - .5) * 150,
        vy: Math.sin(angle) * speed - 30,
        size: 3 + rng() * 8,
        twist: (rng() - .5) * 13,
        angle: rng() * TAU,
        color: i % 5 === 0 ? '#fff1d5' : i % 4 === 0 ? '#f8c75a' : i % 3 === 0 ? '#7bd8c9' : players[chosen].color,
        life: .7 + rng() * .8,
      });
    }
  }
  function burst(time) {
    if (phase !== 'burst') return;
    const age = (time - burstAt) / 1000;
    const { cx, cy, radius } = layout;
    if (age < .46) {
      ctx.save(); ctx.globalAlpha = (1 - age / .46) * .7;
      ctx.beginPath(); ctx.arc(cx, cy - radius * .72, age * 290 + 10, 0, TAU);
      ctx.strokeStyle = '#fff1d5'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    for (const p of particles) {
      if (age > p.life) continue;
      ctx.save();
      ctx.translate(cx + p.ox + p.vx * age, cy + p.oy + p.vy * age + 195 * age * age);
      ctx.rotate(p.angle + p.twist * age);
      ctx.globalAlpha = Math.min(1, Math.max(0, (p.life - age) * 2.3));
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.moveTo(-p.size, -p.size * .5); ctx.lineTo(p.size, -p.size * .7); ctx.lineTo(p.size * .45, p.size); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function draw(time) {
    if (!layout || destroyed) return;
    background(time); wheel(time); burst(time);
  }
  function tick(time) {
    if (destroyed || phase === 'idle' || phase === 'done') return;
    if (phase === 'spin') {
      const progress = Math.min(1, Math.max(0, (time - startAt) / spinTime));
      const eased = 1 - Math.pow(1 - progress, 4);
      rotation = fromRotation + travel * eased;
      if (progress >= 1) {
        rotation = (fromRotation + travel) % TAU;
        phase = 'burst'; burstAt = time; makeBurst();
        live.textContent = `${players[chosen].name} is the next speaker!`;
        canvas.setAttribute('aria-label', `${players[chosen].name} is the next speaker. Their winning slice exploded into confetti.`);
      }
    }
    if (phase === 'burst' && time - burstAt >= 1550) {
      phase = 'done'; particles = [];
      draw(time);
      frame = 0;
      if (!reported) { reported = true; onPick?.(players[chosen].id); }
      return;
    }
    draw(time);
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (destroyed || phase === 'spin' || phase === 'burst' || !players.length) return;
    chosen = Math.floor(rng() * players.length);
    reported = false;
    particles = [];
    fromRotation = rotation % TAU;
    const destination = ((-(chosen + .5) * TAU / players.length) % TAU + TAU) % TAU;
    travel = TAU * (5 + Math.floor(rng() * 2)) + (destination - fromRotation + TAU) % TAU;
    spinTime = 5100 + rng() * 1100;
    startAt = performance.now();
    phase = 'spin';
    live.textContent = 'The name wheel is spinning.';
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    if (destroyed) return;
    cancelAnimationFrame(frame); frame = 0;
    phase = 'idle'; chosen = -1; particles = []; reported = false; rotation = 0;
    live.textContent = '';
    canvas.setAttribute('aria-label', `Ready to spin. ${players.length} equal name slices.`);
    draw(performance.now());
  }
  function clickHub(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    if (Math.hypot(x - layout.cx, y - layout.cy) < Math.max(26, layout.radius * .2)) start();
  }
  // Starting through the shared Play button preserves the roster and round state.
  function sharedStart(event) {
    const bounds = canvas.getBoundingClientRect();
    if (Math.hypot(event.clientX - bounds.left - layout.cx, event.clientY - bounds.top - layout.cy) < Math.max(26, layout.radius * .2)) {
      const play = document.getElementById('playButton');
      if (play) play.click(); else clickHub(event);
    }
  }
  canvas.addEventListener('click', sharedStart);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(size) : null;
  observer?.observe(root);
  if (!observer) window.addEventListener('resize', size);
  size();
  return {
    start,
    reset,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', size);
      canvas.removeEventListener('click', sharedStart);
      particles = [];
      root.remove();
    },
  };
}