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
    const radius = compact
      ? Math.max(70, Math.min(width * .37, (height - 172) * .45))
      : Math.min(height * .373, width * .273);
    layout = {
      compact,
      radius,
      cx: compact ? width / 2 : width * .335,
      cy: compact ? 60 + radius : height * .53,
      infoX: compact ? width / 2 : width * .662,
      infoY: compact ? 91 + radius * 2 : Math.min(height * .38, height - 215),
      infoW: compact ? width - 36 : width * .295,
    };
    draw(performance.now());
  }
  function background(time) {
    ctx.clearRect(0, 0, width, height);
    const wash = ctx.createRadialGradient(layout.cx, layout.cy, 10, layout.cx, layout.cy, width * .73);
    wash.addColorStop(0, '#243853');
    wash.addColorStop(.58, '#14223c');
    wash.addColorStop(1, '#0d172c');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(123,216,201,.1)';
    for (let y = 18; y < height; y += 26) {
      for (let x = 18; x < width; x += 26) {
        if (Math.hypot(x - layout.cx, y - layout.cy) > layout.radius + 27) {
          ctx.beginPath(); ctx.arc(x, y, .85, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(123,216,201,.07)';
    ctx.lineWidth = 1;
    for (const extra of [37, 65]) {
      ctx.beginPath(); ctx.arc(layout.cx, layout.cy, layout.radius + extra, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    text('CHANCE, WITH A LITTLE DRAMA.', 24, 28, width < 410 ? 9 : 10, '#7bd8c9', 800);
    if (!layout.compact) {
      roundRect(width - 126, 17, 102, 26, 13, 'rgba(123,216,201,.09)', 'rgba(123,216,201,.25)');
      text(`${players.length} NAMES`, width - 75, 30, 10, '#bceee5', 800, 'center');
    }
    const stars = [[.11,.2],[.52,.15],[.075,.79],[.59,.84]];
    for (let i = 0; i < stars.length; i++) {
      const [x, y] = stars[i];
      const sx = width * x, sy = height * y;
      const scale = phase === 'idle' ? 1 : 1 + .16 * Math.sin(time / 400 + i);
      ctx.strokeStyle = i % 2 ? '#f8c75a' : '#7bd8c9'; ctx.globalAlpha = .65;
      ctx.beginPath(); ctx.moveTo(sx - 4 * scale, sy); ctx.lineTo(sx + 4 * scale, sy); ctx.moveTo(sx, sy - 4 * scale); ctx.lineTo(sx, sy + 4 * scale); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function wheel(time) {
    const { cx, cy, radius: r } = layout;
    const segment = TAU / Math.max(1, players.length);
    const exploding = phase === 'burst' || phase === 'done';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 13;
    ctx.beginPath(); ctx.arc(cx, cy, r + 15, 0, TAU); ctx.fillStyle = '#091426'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r + 11, 0, TAU); ctx.strokeStyle = '#7bd8c9'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, TAU); ctx.strokeStyle = '#25364e'; ctx.lineWidth = 8; ctx.stroke();
    for (let dot = 0; dot < 36; dot++) {
      const angle = dot * TAU / 36 - Math.PI / 2;
      const active = phase === 'spin' ? ((dot + Math.floor(time / 65)) % 5 < 2) : dot % 3 === 0;
      ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * (r + 11), cy + Math.sin(angle) * (r + 11), Math.max(1.5, r * .008), 0, TAU);
      ctx.fillStyle = active ? '#fff1d5' : '#36516b'; ctx.fill();
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
    if (!layout.compact) text('ONE EQUAL SLICE. ONE SURPRISE.', cx, Math.min(height - 21, cy + r + 47), 10, '#a0b4ce', 700, 'center');
  }
  function wrapName(value, x, y, available, fontSize, align) {
    const chars = graphemes ? Array.from(graphemes.segment(value), item => item.segment) : Array.from(value);
    ctx.font = font(fontSize, 900);
    const lines = [];
    let line = '';
    for (const char of chars) {
      if (ctx.measureText(line + char).width > available && line) { lines.push(line.trim()); line = char; }
      else line += char;
    }
    if (line) lines.push(line.trim());
    const drawn = lines.slice(0, 3);
    if (lines.length > 3) drawn[2] = fit(`${drawn[2]}…`, available);
    drawn.forEach((lineValue, index) => text(lineValue, x, y + index * fontSize * 1.15, fontSize, '#fff1d5', 900, align));
    return drawn.length * fontSize * 1.15;
  }
  function info(time) {
    const { compact, infoX: x, infoY: y, infoW: w } = layout;
    const align = compact ? 'center' : 'left';
    const won = phase === 'burst' || phase === 'done';
    if (won) {
      text('NEXT SPEAKER', x, y - (compact ? 8 : 26), 11, '#7bd8c9', 900, align);
      const big = compact ? 23 : Math.min(40, w * .142, height * .071);
      const nameHeight = wrapName(players[chosen].name, x, y + (compact ? 17 : 15), w, big, align);
      if (!compact) {
        const lowerY = y + nameHeight + 48;
        roundRect(x, lowerY, 151, 32, 16, 'rgba(248,199,90,.1)', 'rgba(248,199,90,.25)');
        text('CHOSEN BY CHANCE', x + 75.5, lowerY + 16, 9, '#f8c75a', 800, 'center');
        text('A spectacular entrance.', x, lowerY + 69, 14, '#a0b4ce', 500);
      }
    } else {
      text(phase === 'spin' ? 'ROUND IN MOTION' : 'WHO SPEAKS NEXT?', x, y - (compact ? 8 : 26), 11, '#7bd8c9', 900, align);
      if (compact) {
        text(players.length ? (phase === 'spin' ? 'Round and round we go…' : 'Give the wheel a spin.') : 'Add names to play.', x, y + 18, 21, '#fff1d5', 800, align);
      } else {
        text(phase === 'spin' ? 'Here comes' : 'Let chance', x, y + 14, Math.min(40, w * .136), '#fff1d5', 900);
        text(phase === 'spin' ? 'the surprise.' : 'take a turn.', x, y + 60, Math.min(40, w * .136), '#fff1d5', 900);
        text(players.length ? (phase === 'spin' ? 'Watch the golden pointer.' : 'Spin. Land. Boom.') : 'Add names to play.', x, y + 117, 15, '#a0b4ce', 500);
        text(`${players.length} equal ${players.length === 1 ? 'chance' : 'chances'} to be first.`, x, y + 143, 13, '#a0b4ce', 500);
        if (phase === 'spin') {
          const progress = Math.min(1, (time - startAt) / spinTime);
          roundRect(x, y + 185, w * .75, 5, 2.5, '#273852');
          if (progress > 0) roundRect(x, y + 185, w * .75 * progress, 5, 2.5, '#7bd8c9');
        } else {
          roundRect(x, y + 177, 120, 30, 15, 'rgba(255,115,94,.1)', 'rgba(255,115,94,.25)');
          text('SLICE EXPLOSION', x + 60, y + 192, 9, '#ff9b8b', 800, 'center');
        }
      }
    }
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
    background(time); wheel(time); burst(time); info(time);
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
      particles = [];
      root.remove();
    },
  };
}