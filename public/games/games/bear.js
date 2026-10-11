const C = { navy: '#101b33', deep: '#0b1429', cream: '#fff3d8', gold: '#f8c75a', coral: '#ff735e', teal: '#7bd8c9', fur: '#ae7254', light: '#cd9470', ink: '#201b29' };
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const ease = n => 1 - Math.pow(1 - clamp(n), 3);

export default function createGame({ container, names = [], onPick = () => {}, random = Math.random, bearMode = 'pg', artwork = {} }) {
  const players = names.slice(0, 60);
  const horror = bearMode === 'horror';
  const profile = horror ? { left: .39, right: .62, top: .50, bottom: .735 } : { left: .23, right: .77, top: .50, bottom: .67 };
  const image = new Image();
  let imageState = 'loading', photoRect = { x: 85, y: -135, width: 670, height: 670 };
  const root = document.createElement('div');
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#101b33;';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${horror ? 'A frightening zombie bear' : 'A plush candy bear'} with cartoon students holding its ${horror ? 'teeth' : 'candies'}. The first student to tumble is the next speaker.`);
  root.append(canvas);
  container.append(root);
  const ctx = canvas.getContext('2d');
  let dead = false, running = false, frame = 0, started = 0, elapsed = 0, winner = -1, hover = -1, picked = false;
  let scale = 1, ox = 0, oy = 0, pulseIndex = -1;
  let fakeouts = [];
  const duration = 8500;
  const small = players.length > 16;
  let rows = 1, columns = 1, dollScale = .8, slots = [], gap = 70;
  function layout(fallback = false) {
    if (fallback) {
      rows = players.length > 28 ? 3 : players.length > 6 ? 2 : 1;
      columns = Math.max(1, Math.ceil(players.length / rows));
      gap = Math.min(82, 500 / columns);
      dollScale = Math.min(1.02, 45 / columns) * (players.length > 28 ? .48 : players.length > 16 ? .64 : players.length > 10 ? .78 : .94);
    } else {
      rows = horror ? players.length > 40 ? 6 : players.length > 24 ? 4 : players.length > 12 ? 3 : players.length > 5 ? 2 : 1 : players.length > 28 ? 3 : players.length > 6 ? 2 : 1;
      columns = Math.max(1, Math.ceil(players.length / rows));
      gap = Math.min(horror ? 60 : 82, (profile.right - profile.left) * photoRect.width / columns);
      dollScale = Math.min(horror ? .59 : rows === 1 ? .9 : .82, gap / 48);
    }
    const center = fallback ? 420 : photoRect.x + (profile.left + profile.right) / 2 * photoRect.width;
    const top = photoRect.y + profile.top * photoRect.height;
    // Reserve space below each root for the student. Horror adds compact rows inside its taller mouth.
    const bottom = photoRect.y + (horror ? profile.bottom : rows === 3 ? .70 : profile.bottom) * photoRect.height;
    slots = players.map((p, i) => {
      const row = Math.floor(i / columns), column = i % columns;
      const count = Math.min(columns, players.length - row * columns);
      const y = fallback ? rows === 1 ? 269 : rows === 2 ? players.length <= 16 ? 235 + row * 114 : 247 + row * 98 : 249 + row * 68 : rows === 1 ? photoRect.y + (horror ? .59 : .57) * photoRect.height : top + (bottom - top) * row / (rows - 1);
      return { x: center + (column - (count - 1) / 2) * gap, y, row, p, i };
    });
  }
  layout();

  function rr(x, y, w, h, r = 10, fill, stroke, line = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
  }
  function ellipse(x, y, rx, ry, fill, stroke, line = 1) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
  }
  function path(points, stroke, width = 2) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
    ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function label(txt, x, y, size = 12, fill = C.cream, align = 'center', weight = 600) {
    ctx.font = `${weight} ${size}px "DM Sans", system-ui, sans-serif`; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
  }
  function short(txt, width, size = 13) {
    ctx.font = `600 ${size}px "DM Sans", system-ui, sans-serif`;
    const a = Array.from(String(txt));
    if (ctx.measureText(a.join('')).width <= width) return a.join('');
    while (a.length && ctx.measureText(a.join('') + '…').width > width) a.pop();
    return a.join('') + '…';
  }
  function star(x, y, size, color, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? size * .45 : size; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function drawBackground(t) {
    ctx.fillStyle = C.navy; ctx.fillRect(0, 0, 1000, 560);
    const glow = ctx.createRadialGradient(410, 300, 70, 410, 300, 540); glow.addColorStop(0, horror ? '#482536' : '#304457'); glow.addColorStop(1, C.navy); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1000, 560);
    for (let i = 0; i < 22; i++) { const x = 35 + (i * 139) % 940, y = 70 + (i * 79) % 415; ellipse(x, y, 1.4, 1.4, '#536076'); }
    star(55, 179, 7, '#f8c75a70', .3); star(733, 99, 6, '#7bd8c960', -.2); star(711, 472, 6, '#f8c75a80');
    rr(28, 22, 136, 31, 15, '#ffffff0b', '#ffffff12'); ellipse(43, 37, 3, 3, running ? C.coral : C.teal); label(running ? 'HOLD ON TIGHT' : horror ? 'NIGHTMARE TEETH' : 'SWEET TOOTH', 56, 38, 9, '#d2d7de', 'left', 700);
    label(horror ? 'One loose tooth. One brave speaker.' : 'One loose candy. One lucky speaker.', 427, 40, 13, '#c7cbd5', 'center', 500);
  }
  function drawGround() {
    ctx.fillStyle = '#091226'; ctx.fillRect(0, 504, 1000, 56);
    ctx.fillStyle = '#ffffff08'; ctx.fillRect(0, 504, 1000, 2);
    ellipse(420, 501, 286, 15, '#080e1d88');
    rr(313, 489, 219, 16, 8, '#5f9590'); rr(315, 489, 215, 8, 6, '#8fe1cd');
    label('FIRST TO TUMBLE → FIRST TO SPEAK', 420, 534, 10, '#8392a9', 'center', 700);
  }
  function drawBear(t) {
    if (imageState === 'ready') {
      // The source is a transparent photograph; preserve its ratio and crop only the upper close-up.
      ctx.save(); ctx.beginPath(); ctx.rect(0, 56, 777, 448); ctx.clip();
      ctx.shadowColor = horror ? '#000000aa' : '#c98a5840'; ctx.shadowBlur = 26;
      ctx.drawImage(image, photoRect.x, photoRect.y, photoRect.width, photoRect.height);
      ctx.restore();
      return;
    }
    if (imageState !== 'error') {
      rr(285, 192, 270, 136, 22, '#ffffff06', '#ffffff15');
      label(horror ? 'Waking the nightmare…' : 'Unwrapping the candy bear…', 420, 248, 17, C.cream);
      label('The arena is loading.', 420, 279, 11, '#9aabc1');
      return;
    }
    const breathe = running ? Math.sin(t / 410) * 1.6 : 0;
    const surprised = t >= 6600;
    ctx.save(); ctx.translate(0, breathe);
    ellipse(172, 131, 65, 67, C.fur, '#251d29', 8); ellipse(172, 131, 37, 38, '#e1af85'); ellipse(172, 131, 22, 25, '#794f47');
    ellipse(668, 131, 65, 67, C.fur, '#251d29', 8); ellipse(668, 131, 37, 38, '#e1af85'); ellipse(668, 131, 22, 25, '#794f47');
    ellipse(420, 282, 302, 221, C.fur, '#251d29', 8);
    const furGlow = ctx.createLinearGradient(0, 70, 0, 483); furGlow.addColorStop(0, '#d39b73'); furGlow.addColorStop(.6, '#ae7254'); furGlow.addColorStop(1, '#8b5746'); ellipse(420, 280, 296, 214, furGlow);
    ctx.beginPath(); ctx.moveTo(388, 68); ctx.quadraticCurveTo(373, 47, 408, 58); ctx.quadraticCurveTo(407, 38, 428, 57); ctx.quadraticCurveTo(445, 41, 451, 67); ctx.fillStyle = C.light; ctx.fill();
    for (const x of [257, 581]) {
      path([[x - 22, 153], [x - 11, 147], [x + 12, 151]], '#704739', 5);
      ellipse(x, 180, 32, surprised ? 34 : 26, '#f6d9ad'); ellipse(x + (surprised ? 0 : 3), 184, surprised ? 9 : 12, surprised ? 11 : 13, C.ink); ellipse(x + 4, 180, 3.4, 4, '#fff9e9');
    }
    if (!running) { path([[235, 179], [248, 186], [262, 186], [278, 179]], C.ink, 4); path([[561, 179], [575, 186], [589, 186], [603, 179]], C.ink, 4); }
    else if (t < 6600 && Math.floor(t / 2000) % 2 === 1 && t % 2000 < 145) { ellipse(257, 180, 31, 25, '#ba805c'); ellipse(581, 180, 31, 25, '#ba805c'); path([[235, 180], [277, 180]], C.ink, 4); path([[559, 180], [603, 180]], C.ink, 4); }
    ellipse(200, 222, 31, 18, '#dc8f6b88'); ellipse(640, 222, 31, 18, '#dc8f6b88');
    ellipse(420, 291, 241, 143, '#e9b689');
    ellipse(344, 236, 69, 43, '#f6d1a3'); ellipse(496, 236, 69, 43, '#f6d1a3');
    ctx.beginPath(); ctx.moveTo(381, 200); ctx.bezierCurveTo(391, 186, 450, 186, 459, 202); ctx.bezierCurveTo(462, 226, 437, 239, 420, 241); ctx.bezierCurveTo(401, 238, 376, 220, 381, 200); ctx.fillStyle = '#30222b'; ctx.fill(); ellipse(406, 201, 15, 5, '#6d4d4b');
    path([[420, 238], [420, 250]], '#4b2a33', 5);
    ellipse(420, 340, 258, 125, '#371b2c', '#5c3036', 12);
    const mouthGradient = ctx.createLinearGradient(0, 220, 0, 467); mouthGradient.addColorStop(0, '#251b2b'); mouthGradient.addColorStop(1, '#603043'); ellipse(420, 340, 249, 117, mouthGradient);
    ellipse(420, 438, 145, 23, '#bf6770'); ellipse(420, 438, 96, 14, '#d48386'); path([[420, 428], [420, 446]], '#a45766', 2);
    ctx.beginPath(); ctx.moveTo(195, 269); ctx.bezierCurveTo(225, 224, 331, 219, 420, 228); ctx.bezierCurveTo(512, 219, 613, 231, 645, 271); ctx.strokeStyle = '#c97c79'; ctx.lineWidth = 16; ctx.stroke();
    // Two outsized canines make the close-up read as a bear mouth.
    ctx.beginPath(); ctx.moveTo(196, 259); ctx.quadraticCurveTo(180, 286, 206, 314); ctx.quadraticCurveTo(227, 287, 222, 253); ctx.closePath(); ctx.fillStyle = C.cream; ctx.fill();
    ctx.beginPath(); ctx.moveTo(621, 253); ctx.quadraticCurveTo(615, 288, 635, 314); ctx.quadraticCurveTo(660, 286, 645, 259); ctx.closePath(); ctx.fillStyle = C.cream; ctx.fill();
    // Short cheek strokes, a soft muzzle and a comic drool sparkle.
    path([[167, 306], [160, 313]], '#825039', 4); path([[171, 323], [165, 329]], '#825039', 3);
    path([[666, 306], [674, 312]], '#825039', 4); path([[668, 323], [674, 329]], '#825039', 3);
    if (running && t < 6000) { ellipse(682, 296, 4, 7, '#7bd8c960'); }
    ctx.restore();
  }
  function tooth(index = 0) {
    if (!horror) {
      const candyColors = ['#e95a73', '#f6ac44', '#9ac75f', '#ab86d5', '#eea1bf', '#5dbfc4'];
      const candy = candyColors[index % candyColors.length];
      ctx.beginPath(); ctx.moveTo(-19, 1); ctx.quadraticCurveTo(0, -7, 19, 1); ctx.lineTo(19, 24); ctx.quadraticCurveTo(17, 42, 0, 41); ctx.quadraticCurveTo(-18, 41, -19, 25); ctx.closePath();
      ctx.fillStyle = candy; ctx.fill(); ctx.strokeStyle = '#ffffff80'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.clip();
      if (index % 3 === 0) {
        // Peppermint bands follow the rounded candy rather than a pointed fang.
        for (let i = -2; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-27 + i * 20, -5); ctx.lineTo(-13 + i * 20, -5); ctx.lineTo(16 + i * 20, 49); ctx.lineTo(2 + i * 20, 49); ctx.closePath(); ctx.fillStyle = '#fff4e9'; ctx.fill(); }
      } else {
        for (let i = 0; i < 17; i++) ellipse(-15 + (i * 13 % 31), 5 + (i * 17 % 31), .7, .9, '#fff2d7bb');
      }
      ctx.restore();
      path([[-11, 7], [-11, 22]], '#ffffff88', 3);
      return;
    }
    ctx.beginPath(); ctx.moveTo(-19, 0); ctx.quadraticCurveTo(0, -6, 19, 0); ctx.lineTo(16, 27); ctx.quadraticCurveTo(12, 46, 1, 39); ctx.quadraticCurveTo(-9, 47, -15, 29); ctx.closePath();
    ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = '#bca87f'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.save(); ctx.clip();
    // Stains stay on the tooth surface, away from the cartoon student.
    ellipse(-5, 2, 20, 7, '#6f182c'); ellipse(12, 10, 5, 7, '#962d35');
    path([[-9, 5], [-4, 12], [-7, 19]], '#6c2430', 1.7); path([[7, 0], [5, 11], [12, 18]], '#84313b', 1.4);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(-11, 22, -8, 30); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
  }
  function kid(slot, s, scared = false, sitting = false) {
    const color = slot.p.color || C.teal;
    const skins = ['#f1b991', '#d89166', '#f6d2ae', '#ba7954', '#e2a47d'];
    const skin = skins[slot.i % skins.length];
    const hair = ['#3d2932', '#8b4c32', '#332f40', '#b47b3b'][slot.i % 4];
    ctx.save(); ctx.scale(s, s);
    // Hands hook over the tooth; long arms visibly suspend the student.
    path([[-8, 65], [-18, 44], [-19, 27]], skin, 5); path([[8, 65], [19, 44], [19, 27]], skin, 5);
    ellipse(-19, 28, 4.5, 5.5, skin); ellipse(19, 28, 4.5, 5.5, skin);
    rr(-10, 62, 20, 22, 6, color, '#152039', 1.3);
    path([[-5, 83], [-7, sitting ? 87 : 95], [-13, sitting ? 87 : 98]], '#29374b', 5);
    path([[5, 83], [sitting ? 13 : 7, sitting ? 87 : 95], [sitting ? 18 : 13, sitting ? 87 : 98]], '#29374b', 5);
    path([[-14, sitting ? 87 : 98], [-8, sitting ? 87 : 98]], C.cream, 3); path([[sitting ? 15 : 8, sitting ? 87 : 98], [sitting ? 21 : 15, sitting ? 87 : 98]], C.cream, 3);
    ellipse(0, 51, 12.5, 13, skin, '#503143', 1.2); ellipse(-12, 53, 2, 3, skin); ellipse(12, 53, 2, 3, skin);
    ctx.beginPath(); ctx.moveTo(-12, 49); ctx.quadraticCurveTo(-15, 34, -1, 36); ctx.quadraticCurveTo(13, 35, 13, 47); ctx.quadraticCurveTo(5, 43, 2, 42); ctx.quadraticCurveTo(-1, 48, -12, 49); ctx.fillStyle = hair; ctx.fill();
    ellipse(-4, 52, 1.3, scared ? 2.2 : 1.6, C.ink); ellipse(4, 52, 1.3, scared ? 2.2 : 1.6, C.ink);
    if (scared) ellipse(0, 58, 2.8, 3.5, '#79474b'); else { ctx.beginPath(); ctx.arc(0, 55, 4, .1, Math.PI - .1); ctx.strokeStyle = '#79474b'; ctx.lineWidth = 1.3; ctx.stroke(); }
    if (slot.i % 5 === 2) { rr(-8, 48, 7, 7, 2, null, '#322b38', 1.3); rr(1, 48, 7, 7, 2, null, '#322b38', 1.3); path([[-1, 51], [1, 51]], '#322b38', 1); }
    ctx.restore();
  }
  function currentWobble(t) {
    if (!running && elapsed === 0) return { index: hover, strength: .04 };
    if (t >= 5930) return { index: winner, strength: t < 6600 ? .17 + (t - 5930) / 670 * .13 : .28 };
    if (t < 850) return { index: -1, strength: 0 };
    const phase = Math.floor((t - 850) / 630);
    const wave = Math.sin(clamp(((t - 850) % 630) / 520) * Math.PI);
    return { index: fakeouts[phase % fakeouts.length] ?? -1, strength: wave * .17 };
  }
  function drawToothStudents(t) {
    const w = currentWobble(t); pulseIndex = w.index;
    const nameLabels = [];
    for (const slot of slots) {
      const selected = slot.i === winner && t >= 6600;
      if (selected && t >= 7240) {
        ellipse(slot.x, slot.y + 4, 22 * dollScale, 9 * dollScale, '#1b1327', '#eaa889', 2);
        continue;
      }
      const active = w.index === slot.i;
      const a = active ? Math.sin(t / (selected ? 35 : 53)) * w.strength : Math.sin(t / (horror ? 43 : 340) + slot.i) * (running ? horror ? .035 : .012 : 0);
      const pull = selected ? ease((t - 6600) / 640) * 19 : 0;
      const x = slot.x + (active ? Math.sin(t / 28) * w.strength * 5 : 0), y = slot.y + pull;
      if (active && (running || hover === slot.i)) {
        ellipse(slot.x, slot.y + 45 * dollScale, 35 * dollScale, 58 * dollScale, '#f8c75a15', '#f8c75a90', 1.5);
        if (running) { path([[slot.x - 32 * dollScale, slot.y + 8], [slot.x - 38 * dollScale, slot.y - 1]], C.gold, 2); path([[slot.x + 32 * dollScale, slot.y + 8], [slot.x + 38 * dollScale, slot.y - 1]], C.gold, 2); }
      }
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(dollScale, dollScale); tooth(slot.i); ctx.restore();
      ctx.save(); ctx.translate(x + (horror && running ? Math.sin(t / 24 + slot.i) * .6 : 0), y); ctx.rotate(a); kid(slot, dollScale, horror || active && running); ctx.restore();
      const size = small ? 8 : horror ? 11 : 12;
      const text = small ? String(slot.i + 1).padStart(2, '0') : short(slot.p.name, Math.min(76, gap - 5), size);
      // Large rosters number the tooth itself, preserving the face and eye area in compact rows.
      const ly = small ? y + 5 : y + 109 * dollScale;
      ctx.font = `600 ${size}px "DM Sans", system-ui, sans-serif`;
      const width = small ? Math.max(14, ctx.measureText(text).width + 2) : Math.max(20, ctx.measureText(text).width + 12);
      nameLabels.push({ x, ly, width, text, active, size });
    }
    // Paint names last so a lower row's tooth never hides an upper student's label.
    for (const { x, ly, width, text, active, size } of nameLabels) {
      const height = small ? 11 : 18;
      rr(x - width / 2, ly - height / 2, width, height, small ? 3 : 7, active ? C.gold : '#142039e8');
      label(text, x, ly, size, active ? C.navy : C.cream, 'center', 600);
    }
    if (winner >= 0 && t >= 7240) drawTumble(slots[winner], t);
  }
  function drawTumble(slot, t) {
    const q = clamp((t - 7240) / 650), landed = q === 1;
    const x = slot.x + (420 - slot.x) * ease(q), y = slot.y + 20 + (391 - slot.y) * q * q;
    const bounce = landed ? Math.max(0, Math.sin((t - 7890) / 100)) * 12 * Math.exp(-(t - 7890) / 360) : 0;
    const s = dollScale + (1.04 - dollScale) * ease(q);
    // The whole tooth detaches first; the student lets go as it tumbles down.
    if (!landed) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(q * TAU * .65); ctx.scale(s, s); tooth(slot.i); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.rotate(q * TAU * .65); kid(slot, s, true); ctx.restore();
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = (1 - q) * .6; path([[x - 38 - i * 8, y - 13 - i * 12], [x - 52 - i * 8, y - 25 - i * 12]], C.cream, 2); ctx.globalAlpha = 1; }
    } else {
      const since = t - 7890;
      ctx.save(); ctx.translate(481, 461 - bounce); ctx.rotate(.65 + Math.min(since / 300, 1) * .45); ctx.scale(.77, .77); tooth(slot.i); ctx.restore();
      ctx.save(); ctx.translate(420, 398 - bounce); kid(slot, 1, false, true); ctx.restore();
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8, r = 20 + Math.min(since, 450) / 13;
        ctx.globalAlpha = Math.max(0, 1 - since / 670); ellipse(420 + Math.cos(a) * r * 1.4, 480 + Math.sin(a) * r / 3, 6, 4, C.cream); ctx.globalAlpha = 1;
      }
      star(386, 439, 7, C.gold, since / 500); star(453, 432, 5, C.teal, -since / 400);
      const name = short(slot.p.name, 228, 15);
      ctx.font = '700 15px "DM Sans", system-ui, sans-serif'; const width = Math.max(145, ctx.measureText(name).width + 30);
      rr(420 - width / 2, 347, width, 37, 12, C.gold, '#101b3366', 2); label(name, 420, 365, 15, C.navy, 'center', 700);
      label('YOU’RE UP!', 420, 397, 10, C.cream, 'center', 700);
    }
  }
  function wrapName(value, x, y, max = 149) {
    ctx.font = '700 20px "DM Sans", system-ui, sans-serif';
    const chars = Array.from(String(value)); const lines = []; let line = '';
    for (const ch of chars) { if (ctx.measureText(line + ch).width > max && line) { lines.push(line); line = ch; } else line += ch; }
    if (line) lines.push(line);
    const count = Math.min(3, lines.length);
    for (let i = 0; i < count; i++) { const last = i === 2 && lines.length > 3; label(last ? short(lines[i] + '…', max, 20) : lines[i], x, y + i * 25, 20, C.cream, 'left', 700); }
    return count * 25;
  }
  function drawPanel(t) {
    rr(785, 82, 190, 371, 20, '#091326b0', '#ffffff15');
    label(horror ? 'TOOTH WATCH' : 'CANDY WATCH', 805, 108, 10, horror ? C.coral : C.teal, 'left', 700);
    label(String(players.length).padStart(2, '0'), 805, 160, 38, C.cream, 'left', 600); label('HOLDING ON', 805, 194, 9, '#9aabc1', 'left', 700);
    path([[805, 216], [954, 216]], '#ffffff17', 1);
    const chosen = t >= 5930 && winner >= 0 ? winner : hover >= 0 ? hover : running ? pulseIndex : -1;
    if (chosen >= 0 && players[chosen]) {
      const p = players[chosen]; label(t >= 7890 ? 'THE NEXT SPEAKER' : `${horror ? 'TOOTH' : 'CANDY'} ${String(chosen + 1).padStart(2, '0')}`, 805, 240, 9, t >= 7890 ? C.gold : '#aebbcf', 'left', 700);
      const count = wrapName(p.name, 805, 270);
      ellipse(814, 277 + count, 4, 4, p.color || C.teal); label(t >= 7890 ? 'A spectacular tumble.' : t >= 5930 ? 'Something feels wobbly…' : 'Still hanging in there.', 825, 277 + count, 9, '#9aabc1', 'left', 500);
    } else {
      label(players.length ? 'THE RULE IS SIMPLE' : 'NO TEETH CLAIMED', 805, 240, 9, '#aebbcf', 'left', 700);
      label(players.length ? 'Hold on…' : 'Add some names', 805, 275, 20, C.cream, 'left', 700);
      label(players.length ? 'or take the mic.' : 'to wake the bear.', 805, 303, 16, C.cream, 'left', 500);
      label('The first student to fall', 805, 341, 10, '#9aabc1', 'left', 500); label('gets the first turn to speak.', 805, 357, 10, '#9aabc1', 'left', 500);
    }
    rr(803, 402, 154, 31, 8, '#ffffff07');
    label(running ? t < 5930 ? 'WHO WILL IT BE?' : t < 7240 ? horror ? 'UH-OH… THAT TOOTH!' : 'UH-OH… THAT CANDY!' : 'HELLO, GRAVITY.' : small ? 'HOVER A NUMBER FOR A NAME' : horror ? 'THE BEAR IS WAKING UP…' : 'A LITTLE SWEET SUSPENSE…', 880, 418, small && !running ? 7 : 8, t >= 5930 && running ? C.gold : '#bac5d7', 'center', 600);
    if (running) { rr(805, 464, 147, 4, 2, '#ffffff17'); rr(805, 464, Math.max(4, 147 * clamp(t / duration)), 4, 2, C.coral); }
  }
  function render(t = elapsed) {
    if (dead || !ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.navy; ctx.fillRect(0, 0, w, h);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    drawBackground(t); drawBear(t); drawGround(); drawToothStudents(t); drawPanel(t);
    if (running && t < 850) { const n = t < 300 ? '3' : t < 575 ? '2' : '1'; rr(376, 322, 88, 70, 20, '#101b33c9', '#f8c75a80', 2); label(n, 420, 358, 40, C.gold); }
    if (!players.length) { rr(309, 313, 223, 44, 14, '#101b33dd'); label('Who’s hanging on today?', 420, 335, 14, C.cream); }
  }
  function resize() {
    if (dead) return;
    const r = root.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round((r.width || 1000) * dpr)); canvas.height = Math.max(1, Math.round((r.height || 560) * dpr));
    scale = Math.min(canvas.width / 1000, canvas.height / 560); ox = (canvas.width - 1000 * scale) / 2; oy = (canvas.height - 560 * scale) / 2;
    render();
  }
  function tick(now) {
    if (dead || !running) return;
    elapsed = Math.min(now - started, duration); render(elapsed);
    if (elapsed >= duration) {
      running = false; frame = 0;
      canvas.setAttribute('aria-label', `${players[winner].name} had the loose ${horror ? 'tooth' : 'candy'} and is the next speaker.`);
      if (!picked) { picked = true; onPick(players[winner].id); }
    } else frame = requestAnimationFrame(tick);
  }
  function point(event) {
    if (dead || running) return;
    const r = canvas.getBoundingClientRect();
    const x = ((event.clientX - r.left) * canvas.width / Math.max(1, r.width) - ox) / scale;
    const y = ((event.clientY - r.top) * canvas.height / Math.max(1, r.height) - oy) / scale;
    let closest = -1, distance = Infinity;
    slots.forEach(slot => { const dx = x - slot.x, dy = y - (slot.y + 55 * dollScale), d = dx * dx + dy * dy; if (Math.abs(dx) < Math.max(15, 24 * dollScale) && Math.abs(dy) < 54 * dollScale && d < distance) { closest = slot.i; distance = d; } });
    if (closest !== hover) { hover = closest; canvas.title = closest >= 0 ? `Tooth ${closest + 1}: ${players[closest].name}` : ''; render(); }
  }
  function leave() { hover = -1; canvas.title = ''; if (!running) render(); }
  canvas.addEventListener('pointermove', point); canvas.addEventListener('pointerdown', point); canvas.addEventListener('pointerleave', leave);
  image.onload = () => {
    if (dead) return;
    const width = image.naturalWidth || 1, height = image.naturalHeight || 1, fit = (horror ? 545 : 670) / Math.max(width, height);
    photoRect = { x: 420 - width * fit / 2, y: 535 - height * fit, width: width * fit, height: height * fit };
    imageState = 'ready'; layout(); render();
  };
  image.onerror = () => {
    if (dead) return;
    imageState = 'error'; layout(true); render();
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  observer?.observe(root); window.addEventListener('resize', resize); resize();
  image.src = artwork[horror ? 'horror' : 'pg'] || new URL(`../assets/bear-${horror ? 'horror' : 'pg'}.png`, import.meta.url).href;
  return {
    start() {
      if (dead || running || !players.length) return;
      cancelAnimationFrame(frame); picked = false; hover = -1;
      winner = Math.min(players.length - 1, Math.max(0, Math.floor(random() * players.length)));
      fakeouts = Array.from({ length: 9 }, () => Math.min(players.length - 1, Math.max(0, Math.floor(random() * players.length))));
      elapsed = 0; running = true; started = performance.now();
      canvas.setAttribute('aria-label', `The students are holding on as random ${horror ? 'teeth' : 'candies'} wobble. The loose ${horror ? 'tooth' : 'candy'} will choose the next speaker.`);
      frame = requestAnimationFrame(tick);
    },
    reset() {
      if (dead) return;
      cancelAnimationFrame(frame); frame = 0; running = false; elapsed = 0; winner = -1; hover = -1; picked = false; fakeouts = [];
      canvas.title = ''; canvas.setAttribute('aria-label', `${horror ? 'A frightening zombie bear' : 'A plush candy bear'} with cartoon students holding its ${horror ? 'teeth' : 'candies'}. The first student to tumble is the next speaker.`); render();
    },
    destroy() {
      if (dead) return;
      dead = true; running = false; cancelAnimationFrame(frame); frame = 0; image.onload = null; image.onerror = null; observer?.disconnect(); window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', point); canvas.removeEventListener('pointerdown', point); canvas.removeEventListener('pointerleave', leave); root.remove();
    }
  };
}