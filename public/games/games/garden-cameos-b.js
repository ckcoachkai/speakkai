/** Connected, time-driven giant character rigs. Foot origin (0, 0), height 370.
 * Presentation only: never changes combat state or consumes combat randomness.
 * Each limb has a shoulder/hip, elbow/knee and hand/foot; no bitmap body slices.
 */
const CB_INK = '#263044';
const CB_TAU = Math.PI * 2;
const CB_NUMBER = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const CB_CLAMP = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, CB_NUMBER(value)));
function CB_ELLIPSE(c, x, y, rx, ry, fill, stroke = CB_INK, width = 3, angle = 0) {
  c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), angle, 0, CB_TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function CB_POLY(c, points, fill, stroke = CB_INK, width = 3) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineJoin = 'round'; c.stroke(); }
}
function CB_LINE(c, points, color, width = 4, outline = false) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (outline) { c.strokeStyle = CB_INK; c.lineWidth = width + 5; c.stroke(); }
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function CB_SHADE(c, x, y, radius, light, dark) {
  const gradient = c.createRadialGradient(x - radius * .35, y - radius * .35, 1, x, y, radius * 1.4);
  gradient.addColorStop(0, light); gradient.addColorStop(1, dark); return gradient;
}
function CB_LIMB(c, joint, bend, end, width, color, { hand, shoe, angle = 0 } = {}) {
  CB_LINE(c, [joint, bend, end], color, width, true);
  // Small overlap at the hinge keeps both thick segments physically connected.
  CB_ELLIPSE(c, bend[0], bend[1], width * .43, width * .43, color, null);
  c.save(); c.translate(end[0], end[1]); c.rotate(angle);
  if (shoe) CB_ELLIPSE(c, -7, 0, width * .94, width * .47, shoe, CB_INK, 3);
  if (hand) {
    CB_ELLIPSE(c, -2, 1, width * .64, width * .7, hand, CB_INK, 3);
    CB_LINE(c, [[-width * .35, -1], [-width * .2, 7]], 'rgba(38,48,68,.25)', 2);
  }
  c.restore();
}
function CB_BLINK(time, offset = 0) {
  const cycle = ((time + offset) % 4.7 + 4.7) % 4.7;
  return cycle > 4.48 ? Math.max(.1, Math.abs(cycle - 4.59) / .11) : 1;
}
function CB_EYE(c, x, y, rx, ry, blink = 1, color = '#202b38') {
  CB_ELLIPSE(c, x, y, rx, Math.max(1.2, ry * blink), color, null);
  if (blink > .6 && ry > 5) CB_ELLIPSE(c, x - rx * .28, y - ry * .36, rx * .24, ry * .18, '#ffffff', null);
}
function CB_STAR(c, x, y, outer, fill, inner = outer * .45) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer, a = i * Math.PI / 5 - Math.PI / 2;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
  CB_POLY(c, points, fill, '#b18029', 2);
}
function CB_WEAR(c, stage, x = 0, y = -160, tint = '#fff4d7') {
  // Five persistent health appearances, expressed as scuffed fabric/fur, not gore.
  const marks = [[-23, -19, 12], [19, 8, 17], [-9, 33, 13], [29, -31, 18]];
  for (let i = 0; i < stage; i++) {
    const [dx, dy, length] = marks[i];
    CB_LINE(c, [[x + dx - 5, y + dy - 3], [x + dx + length, y + dy + 4]], '#324153', 4);
    CB_LINE(c, [[x + dx - 2, y + dy - 5], [x + dx + length - 3, y + dy + 1]], tint, 2);
  }
  if (stage >= 3) CB_ELLIPSE(c, x + 7, y - 6, 9, 6, 'rgba(45,56,70,.2)', null, 0, -.4);
}

function CB_KITTY(c, s) {
  const { t, gait: g, walk: w, attack: a, stage, blink } = s;
  const liftA = Math.max(0, g) * 17 * w, liftB = Math.max(0, -g) * 17 * w;
  // Back limbs render first; the torso covers their attached upper ends.
  CB_LIMB(c, [31, -111], [38 - g * 13 * w, -64 - liftB * .45], [35 - g * 24 * w, -15 - liftB], 31, '#f8fbff', { shoe: '#f4f8ff', angle: g * .18 * w });
  CB_LIMB(c, [49, -186], [70 + g * 13 * w, -150], [64 + g * 22 * w - a * 60, -114 - a * 65], 28, '#f7fbff', { hand: '#f9fcff' });
  CB_ELLIPSE(c, -2, -154, 65, 73, CB_SHADE(c, -10, -170, 70, '#66b8ed', '#2864b1'));
  CB_ELLIPSE(c, -23, -184, 17, 32, '#ffe58b', null, 0, -.1);
  CB_ELLIPSE(c, 28, -184, 17, 32, '#ffcf5a', null, 0, .1);
  CB_POLY(c, [[-42, -206], [-26, -206], [-25, -161], [29, -161], [27, -206], [44, -205], [45, -132], [-42, -133]], '#4595d8');
  CB_ELLIPSE(c, -29, -166, 5, 5, '#ffe080', '#836c37', 1.5);
  CB_ELLIPSE(c, 32, -166, 5, 5, '#ffe080', '#836c37', 1.5);
  CB_ELLIPSE(c, 0, -139, 20, 17, '#5aa9e2', '#296cad', 2);
  CB_WEAR(c, stage, 0, -151, '#a0d1f3');
  CB_LIMB(c, [-29, -111], [-36 + g * 13 * w, -63 - liftA * .45], [-34 + g * 24 * w, -15 - liftA], 33, '#ffffff', { shoe: '#ffffff', angle: -g * .18 * w });
  CB_LIMB(c, [-51, -184], [-75 - g * 13 * w - a * 12, -147 - a * 21], [-70 - g * 22 * w - a * 63, -114 - a * 82], 29, '#ffffff', { hand: '#ffffff', angle: -.2 - a * .4 });
  c.save(); c.translate(-8 - a * 6, -267 + Math.sin(t * 2.1) * 2); c.rotate(-.035 + g * .025 * w - a * .04);
  CB_POLY(c, [[-77, -40], [-81, -94], [-28, -69]], '#ffffff');
  CB_POLY(c, [[36, -68], [77, -92], [80, -33]], '#f4f8ff');
  CB_ELLIPSE(c, 0, 0, 95, 76, CB_SHADE(c, -19, -10, 96, '#ffffff', '#e6edf5'), CB_INK, 4);
  CB_EYE(c, -43, -4, 6, 10, blink); CB_EYE(c, 19, -4, 6, 10, blink);
  CB_ELLIPSE(c, -16, 17, 11, 8, '#ffdc53', '#a87b24', 2);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const yy = 3 + i * 15;
    CB_LINE(c, [[side * 71, yy], [side * 109, yy + (i - 1) * 8]], '#354154', 3);
  }
  c.save(); c.translate(63, -57); c.rotate(.16 + Math.sin(t * 3) * .055);
  CB_ELLIPSE(c, -21, -1, 25, 23, CB_SHADE(c, -26, -9, 28, '#ff627a', '#c31e47'), CB_INK, 3, -.25);
  CB_ELLIPSE(c, 20, 0, 25, 23, '#ef3154', CB_INK, 3, .25);
  CB_ELLIPSE(c, 0, 0, 14, 16, '#ff5470', CB_INK, 3); c.restore();
  if (stage > 1) CB_LINE(c, [[-68, 35], [-57, 41], [-53, 35]], '#a5b6c9', 3);
  c.restore();
  if (a > .15) {
    const pulse = .5 + .5 * Math.sin(t * 14);
    c.save(); c.globalAlpha *= a;
    CB_STAR(c, -130 - pulse * 16, -212, 11 + pulse * 4, '#fff4ac');
    CB_STAR(c, -113, -176, 6 + pulse * 3, '#ffc2d0'); c.restore();
  }
}

function CB_ULTRAMAN(c, s) {
  const { t, gait: g, walk: w, attack: a, stage, blink } = s;
  const legA = Math.max(0, g) * 21 * w, legB = Math.max(0, -g) * 21 * w;
  CB_LIMB(c, [24, -143], [34 - g * 20 * w, -80 - legB * .3], [33 - g * 38 * w, -15 - legB], 26, '#c7d3dc', { shoe: '#bdcbd6', angle: g * .2 * w });
  CB_LIMB(c, [46, -244], [66 + g * 18 * w - a * 65, -191 - a * 34], [64 + g * 31 * w - a * 162, -153 - a * 75], 22, '#bdcad6', { hand: '#e7eef3' });
  CB_ELLIPSE(c, 0, -206, 56, 79, CB_SHADE(c, -19, -230, 80, '#f5fafc', '#8da2b4'));
  CB_POLY(c, [[-49, -259], [-21, -240], [0, -208], [22, -242], [48, -259], [49, -226], [13, -189], [21, -145], [-23, -145], [-13, -188], [-48, -226]], '#d43743');
  CB_LIMB(c, [-22, -143], [-36 + g * 20 * w, -80 - legA * .3], [-33 + g * 38 * w, -15 - legA], 28, '#e6edf2', { shoe: '#dae5ec', angle: -g * .2 * w });
  CB_LINE(c, [[-23, -138], [-28 + g * 16 * w, -88 - legA * .2]], '#d93440', 16);
  CB_LINE(c, [[24, -138], [29 - g * 16 * w, -88 - legB * .2]], '#bd2c3c', 15);
  CB_LIMB(c, [-45, -244], [-66 - g * 18 * w + a * 29, -194 - a * 35], [-57 - g * 31 * w - a * 68, -153 - a * 75], 23, '#e4ecf2', { hand: '#f5f8fc' });
  CB_LINE(c, [[-47, -239], [-61 - g * 12 * w + a * 19, -205 - a * 20]], '#e2424e', 13);
  const timerColor = stage >= 3 ? (Math.sin(t * 9) > 0 ? '#ff5c53' : '#932c36') : '#4ae6ff';
  c.save(); c.shadowColor = timerColor; c.shadowBlur = 12;
  CB_ELLIPSE(c, -9, -230, 12, 15, timerColor, '#476277', 4); c.restore();
  CB_WEAR(c, stage, 7, -186, '#eaf3fa');
  c.save(); c.translate(-7 - a * 5, -304 + Math.sin(t * 2) * 1.5); c.rotate(-.045 + g * .025 * w);
  CB_ELLIPSE(c, 0, 0, 47, 58, CB_SHADE(c, -12, -18, 61, '#ffffff', '#8da1b1'), CB_INK, 4);
  CB_POLY(c, [[-9, -44], [1, -66], [13, -47], [9, 38], [-2, 48], [-8, 18]], '#f3f7fa', '#6b8496', 2);
  CB_POLY(c, [[-41, -14], [-12, -22], [-17, 4], [-38, 6]], '#ffe7a4', '#a88c4b', 2);
  CB_POLY(c, [[13, -21], [39, -14], [35, 4], [13, 1]], '#ffe7a4', '#a88c4b', 2);
  if (blink < .4) { CB_LINE(c, [[-40, -6], [-17, -8]], '#99aab5', 4); CB_LINE(c, [[15, -8], [36, -4]], '#99aab5', 4); }
  CB_LINE(c, [[-13, 27], [4, 29], [15, 25]], '#576f81', 3);
  CB_LINE(c, [[-32, 14], [-29, 35], [-17, 45]], '#748c9e', 2);
  c.restore();
  if (a > .22) {
    c.save(); c.globalAlpha *= a; c.shadowColor = '#8ef5ff'; c.shadowBlur = 17;
    const flicker = 4 + Math.sin(t * 40) * 2;
    CB_POLY(c, [[-103, -236], [-265, -242 - flicker], [-273, -224 + flicker], [-103, -219]], '#9cf5ff', null);
    CB_LINE(c, [[-104, -228], [-268, -233]], '#ffffff', 5);
    for (let i = 0; i < 3; i++) CB_LINE(c, [[-111 - i * 43, -232], [-128 - i * 43, -250 + Math.sin(t * 21 + i) * 9]], '#b9f9ff', 2);
    c.restore();
  }
}

function CB_ROCKET_PERSON(c, { x, female, t, gait, walk, attack, stage }) {
  const g = gait, w = walk, a = attack, skin = female ? '#ffe2cc' : '#f6dccd';
  const uniform = female ? '#fffaf6' : '#e9eff8';
  c.save(); c.translate(x, 0);
  if (female) {
    // Jessie's swept magenta hair remains one connected shape behind her head.
    c.beginPath(); c.moveTo(-16, -342); c.bezierCurveTo(55, -400, 133, -321, 87, -262);
    c.bezierCurveTo(72, -233, 126 + Math.sin(t * 3) * 9, -218, 107 + Math.sin(t * 2) * 9, -184);
    c.bezierCurveTo(31, -197, 16, -237, 33, -291); c.closePath();
    c.fillStyle = CB_SHADE(c, 26, -305, 100, '#eb73bf', '#92216c'); c.fill(); c.strokeStyle = CB_INK; c.lineWidth = 3; c.stroke();
  }
  const lift1 = Math.max(0, g) * 16 * w, lift2 = Math.max(0, -g) * 16 * w;
  CB_LIMB(c, [15, -133], [24 - g * 10 * w, -79 - lift2 * .4], [20 - g * 20 * w, -12 - lift2], 18, '#353b52', { shoe: '#292d45', angle: g * .22 * w });
  CB_LIMB(c, [31, -246], [46 + g * 11 * w - a * 13, -198 - a * 15], [48 + g * 19 * w - a * 80, -158 - a * 73], 17, uniform, { hand: '#34394b' });
  CB_POLY(c, [[-30, -260], [29, -260], [35, -190], [25, -158], [-27, -158], [-36, -190]], uniform);
  CB_ELLIPSE(c, -1, -191, 29, 41, uniform, CB_INK, 3);
  if (female) {
    CB_ELLIPSE(c, 0, -159, 25, 18, skin, CB_INK, 3);
    CB_POLY(c, [[-29, -153], [29, -153], [36, -119], [-36, -119]], '#f6f4f8');
  } else CB_POLY(c, [[-29, -163], [29, -163], [28, -124], [-30, -124]], '#f2f4fa');
  CB_LIMB(c, [-16, -125], [-25 + g * 10 * w, -77 - lift1 * .4], [-22 + g * 20 * w, -12 - lift1], 19, female ? skin : '#f1f2f8', { shoe: '#292d45', angle: -g * .22 * w });
  CB_LINE(c, [[-23 + g * 10 * w, -77 - lift1 * .4], [-22 + g * 20 * w, -12 - lift1]], '#30354a', 21, true);
  CB_LIMB(c, [-31, -244], [-51 - g * 11 * w - a * 14, -198 - a * 15], [-48 - g * 19 * w - a * 61, -155 - a * 92], 18, uniform, { hand: '#34394b' });
  c.save(); c.fillStyle = '#dd2d47'; c.strokeStyle = '#9d1731'; c.lineWidth = 1.3; c.font = '900 49px Arial, sans-serif'; c.textAlign = 'center';
  c.strokeText('R', -2, -207); c.fillText('R', -2, -207); c.restore();
  CB_WEAR(c, stage, -3, -181, '#ffffff');
  CB_LINE(c, [[0, -267], [-1, -285]], skin, 16, true);
  c.save(); c.translate(-5 - a * 4, -311); c.rotate(-.05 + g * .025 * w);
  if (!female) {
    c.beginPath(); c.moveTo(-32, -27); c.bezierCurveTo(-19, -63, 44, -58, 49, -13); c.lineTo(44, 28); c.lineTo(21, 13); c.lineTo(-38, 19); c.closePath();
    c.fillStyle = CB_SHADE(c, 3, -32, 59, '#bea9ec', '#7563a6'); c.fill(); c.strokeStyle = CB_INK; c.lineWidth = 3; c.stroke();
  }
  CB_ELLIPSE(c, -4, 0, 29, 39, CB_SHADE(c, -12, -14, 43, '#fff0de', skin), CB_INK, 3);
  CB_ELLIPSE(c, 22, 2, 8, 12, skin, CB_INK, 2);
  CB_POLY(c, [[-29, -30], [-12, -44], [20, -40], [27, -18], [9, -24], [-13, -14]], female ? '#bf337f' : '#9e87ce', CB_INK, 2);
  const blink = CB_BLINK(t, female ? .3 : 1.7);
  CB_EYE(c, -19, 0, 5, 8, blink, '#336f75'); CB_EYE(c, 5, -1, 4.5, 8, blink, '#45747d');
  CB_LINE(c, [[-25, -12], [-14, -16]], '#6f3c53', 2.5); CB_LINE(c, [[0, -16], [10, -13]], '#6f3c53', 2.5);
  CB_POLY(c, [[-27, 6], [-34, 12], [-24, 14]], skin, '#ae8b83', 1.3);
  CB_ELLIPSE(c, -11, 23, 9, 2 + a * 5, female ? '#c3566e' : '#925b63', null);
  if (female) { CB_ELLIPSE(c, 23, 15, 4, 7, '#54b29b', '#246a60', 1.5); CB_LINE(c, [[-24, -4], [-30, -8]], CB_INK, 2); }
  c.restore(); c.restore();
}
function CB_MEOWTH(c, s) {
  const { t, gait: g, walk: w, attack: a, stage } = s;
  c.save(); c.translate(-11, -3 + Math.sin(t * 4.8) * w * 2);
  // Curled tail unwinds a little during the team's attack.
  c.beginPath(); c.moveTo(22, -39); c.bezierCurveTo(70, -35, 78 + a * 10, -80, 52, -84); c.bezierCurveTo(31, -88, 33, -59, 51, -63);
  c.strokeStyle = CB_INK; c.lineWidth = 15; c.stroke(); c.strokeStyle = '#c89460'; c.lineWidth = 10; c.stroke();
  CB_LIMB(c, [15, -38], [28 - g * 6 * w, -20], [25 - g * 10 * w, -3], 13, '#f1d3a0', { shoe: '#e6c18f' });
  CB_ELLIPSE(c, 0, -57, 29, 41, '#ffe1a7');
  CB_LIMB(c, [-13, -38], [-26 + g * 6 * w, -20], [-24 + g * 10 * w, -3], 14, '#ffe1a7', { shoe: '#f7d39d' });
  CB_LIMB(c, [23, -74], [38, -67 - a * 8], [41 - a * 15, -49 - a * 42], 11, '#ffe3ad', { hand: '#ffebbe' });
  CB_LIMB(c, [-23, -75], [-37, -70 - a * 15], [-40 - a * 20, -53 - a * 45], 12, '#ffe3ad', { hand: '#ffebbe' });
  c.save(); c.translate(-3, -112); c.rotate(Math.sin(t * 3.1) * .045);
  CB_POLY(c, [[-36, -13], [-37, -50], [-10, -27]], '#453a47');
  CB_POLY(c, [[16, -28], [42, -48], [36, -7]], '#453a47');
  CB_POLY(c, [[-30, -24], [-31, -42], [-17, -29]], '#cf8e83', null);
  CB_POLY(c, [[24, -29], [37, -41], [33, -23]], '#cf8e83', null);
  CB_ELLIPSE(c, 0, 0, 42, 34, CB_SHADE(c, -10, -10, 45, '#fff0bf', '#e6bd88'));
  CB_ELLIPSE(c, -4, -31, 10, 23, '#e9bf51', '#9b7536', 2);
  CB_LINE(c, [[-4, -47], [-4, -18]], '#fff2a8', 2);
  CB_EYE(c, -20, -2, 5, 10, CB_BLINK(t, 2.4)); CB_EYE(c, 13, -2, 5, 10, CB_BLINK(t, 2.4));
  CB_ELLIPSE(c, -5, 11, 4, 3, '#85595a', null);
  CB_ELLIPSE(c, -4, 22, 12, 4 + a * 5, '#724b4e', '#724b4e', 1);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) CB_LINE(c, [[side * 32, 9 + i * 7], [side * (58 + i * 3), -3 + i * 17]], '#765946', 2);
  c.restore(); if (stage > 2) CB_WEAR(c, stage - 2, 0, -58, '#ffe8ba'); c.restore();
}
function CB_ROCKET(c, s) {
  CB_ROCKET_PERSON(c, { x: 57, female: false, t: s.t, gait: -s.gait, walk: s.walk, attack: s.attack, stage: s.stage });
  CB_ROCKET_PERSON(c, { x: -51, female: true, t: s.t, gait: s.gait, walk: s.walk, attack: s.attack, stage: s.stage });
  CB_MEOWTH(c, s);
  if (s.attack > .12) {
    const fraction = ((s.t * 1.65) % 1 + 1) % 1, x = -125 - fraction * 135, y = -243 - Math.sin(fraction * Math.PI) * 36;
    c.save(); c.globalAlpha *= s.attack; c.translate(x, y); c.rotate(-fraction * 9);
    CB_ELLIPSE(c, 0, 0, 13, 13, '#fcfaf6');
    c.save(); c.beginPath(); c.rect(-15, -15, 30, 15); c.clip(); CB_ELLIPSE(c, 0, 0, 13, 13, '#ef4b54'); c.restore();
    CB_LINE(c, [[-12, 0], [12, 0]], CB_INK, 3); CB_ELLIPSE(c, 0, 0, 4, 4, '#ffffff', CB_INK, 2); c.restore();
  }
}

function CB_PIKACHU(c, s) {
  const { t, gait: g, walk: w, attack: a, stage, blink } = s;
  const yellow = '#ffd54a', dark = '#c59129';
  // Tail's base stays attached at the lower back while its joints flex.
  c.save(); c.translate(53, -103); c.rotate(Math.sin(t * 3.9) * .15 * (.35 + w) + a * .22);
  CB_POLY(c, [[0, 18], [39, -1], [23, -35], [62, -53], [47, -92], [111, -123], [111, -67], [81, -50], [92, -13], [52, 7], [66, 35], [13, 49]], CB_SHADE(c, 62, -53, 110, '#fff17e', '#e5ae2b'), CB_INK, 4);
  CB_POLY(c, [[0, 18], [20, 9], [32, 24], [17, 43], [13, 49]], '#aa7035', CB_INK, 2); c.restore();
  CB_LIMB(c, [37, -64], [51 - g * 11 * w, -38], [55 - g * 20 * w, -12 - Math.max(0, -g) * 12 * w], 25, yellow, { shoe: '#f8cc49', angle: g * .2 * w });
  CB_ELLIPSE(c, 0, -133, 78, 101, CB_SHADE(c, -20, -165, 110, '#fff17b', '#dfaa29'), CB_INK, 4);
  for (let i = 0; i < 2; i++) CB_LINE(c, [[48, -153 + i * 36], [69, -144 + i * 32]], '#a46b34', 14);
  CB_LIMB(c, [56, -181], [76 + g * 11 * w, -148 - a * 24], [66 + g * 16 * w - a * 75, -112 - a * 65], 24, '#f6cc48', { hand: '#ffdd5d' });
  CB_LIMB(c, [-35, -64], [-50 + g * 11 * w, -37], [-55 + g * 20 * w, -12 - Math.max(0, g) * 12 * w], 26, '#ffde54', { shoe: '#ffdf62', angle: -g * .2 * w });
  CB_LIMB(c, [-58, -181], [-81 - g * 11 * w - a * 17, -151 - a * 24], [-69 - g * 16 * w - a * 48, -115 - a * 75], 25, '#ffdc54', { hand: '#ffe575' });
  CB_WEAR(c, stage, -6, -129, '#fff098');
  c.save(); c.translate(-10 - a * 4, -250 + Math.sin(t * 3) * 2); c.rotate(g * .035 * w - a * .035);
  // Independently pivoting ears, with their black tips drawn in the ear frame.
  for (const side of [-1, 1]) {
    c.save(); c.translate(side * 44, -48); c.rotate(side * (.25 + Math.sin(t * 4 + side) * .08 + a * .15));
    CB_ELLIPSE(c, 0, -38, 19, 77, side < 0 ? '#ffdf5d' : '#f3c83c', CB_INK, 4);
    c.save(); c.beginPath(); c.rect(-25, -122, 50, 52); c.clip(); CB_ELLIPSE(c, 0, -38, 19, 77, '#30333f', null); c.restore(); c.restore();
  }
  CB_ELLIPSE(c, 0, 0, 85, 71, CB_SHADE(c, -22, -24, 94, '#fff17d', '#e6b32f'), CB_INK, 4);
  CB_POLY(c, [[-78, 2], [-94, 19], [-72, 30]], '#ffdc53', CB_INK, 2);
  CB_EYE(c, -36, -6, 10, 14, blink); CB_EYE(c, 25, -7, 8.5, 13, blink);
  CB_ELLIPSE(c, -64, 22, 17, 15, '#ee534e', '#c6403f', 2); CB_ELLIPSE(c, 54, 22, 16, 15, '#ef5d4e', '#c6403f', 2);
  CB_POLY(c, [[-19, 14], [-6, 14], [-13, 21]], '#34303a', null);
  if (a > .2) {
    CB_ELLIPSE(c, -15, 37, 16, 9 + a * 5, '#9c4b42', '#593e3e', 2); CB_ELLIPSE(c, -14, 42, 10, 4, '#f5a18a', null);
  } else {
    c.beginPath(); c.moveTo(-30, 29); c.quadraticCurveTo(-22, 39, -14, 31); c.quadraticCurveTo(-4, 40, 4, 29); c.strokeStyle = '#6b4e31'; c.lineWidth = 3; c.stroke();
  }
  if (stage > 1) CB_LINE(c, [[-49, -31], [-32, -36]], '#ac7d2b', 3);
  c.restore();
  if (a > .12) {
    c.save(); c.globalAlpha *= a; c.shadowColor = '#fff05a'; c.shadowBlur = 18;
    for (let i = 0; i < 4; i++) {
      const yy = -200 - i * 29, jitter = Math.sin(t * 37 + i * 7) * 10;
      CB_LINE(c, [[-91, yy], [-128, yy - 22 + jitter], [-144, yy + 5], [-181, yy - 18 - jitter], [-228, yy - 5]], '#fff8ad', 5);
      CB_LINE(c, [[-91, yy], [-128, yy - 22 + jitter], [-144, yy + 5], [-181, yy - 18 - jitter], [-228, yy - 5]], '#fffad7', 2);
    }
    c.restore();
  }
}

function CB_DOGMAN(c, s) {
  const { t, gait: g, walk: w, attack: a, stage, blink } = s;
  const lift1 = Math.max(0, g) * 21 * w, lift2 = Math.max(0, -g) * 21 * w;
  c.beginPath(); c.moveTo(44, -119); c.quadraticCurveTo(103 + Math.sin(t * 7) * 13, -134, 88, -165);
  c.strokeStyle = CB_INK; c.lineWidth = 19; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#b2814f'; c.lineWidth = 13; c.stroke();
  CB_LIMB(c, [23, -122], [36 - g * 17 * w, -70 - lift2 * .3], [33 - g * 31 * w, -13 - lift2], 31, '#2862af', { shoe: '#192a43', angle: g * .22 * w });
  CB_LIMB(c, [50, -233], [74 + g * 14 * w - a * 30, -185 - a * 13], [69 + g * 23 * w - a * 114, -139 - a * 74], 26, '#2971bf', { hand: '#b88b55' });
  CB_ELLIPSE(c, 0, -193, 62, 83, CB_SHADE(c, -17, -219, 88, '#4b98e5', '#1e559e'), CB_INK, 4);
  CB_POLY(c, [[-24, -265], [2, -245], [24, -264], [20, -235], [-24, -235]], '#8bc1ef', '#244b80', 2);
  CB_LINE(c, [[-4, -234], [-4, -139]], '#153e76', 2.5);
  CB_POLY(c, [[-54, -145], [53, -145], [52, -123], [-53, -123]], '#25364a');
  CB_POLY(c, [[-14, -143], [7, -143], [7, -126], [-14, -126]], '#dfb74a', '#987a2f', 2);
  CB_STAR(c, -30, -224, 14, '#ffe280');
  CB_POLY(c, [[11, -222], [39, -222], [36, -197], [14, -197]], '#2f72bc', '#204c87', 2);
  CB_LIMB(c, [-24, -123], [-36 + g * 17 * w, -70 - lift1 * .3], [-34 + g * 31 * w, -13 - lift1], 33, '#307ac7', { shoe: '#22344c', angle: -g * .22 * w });
  CB_LIMB(c, [-49, -232], [-77 - g * 14 * w - a * 18, -185 - a * 22], [-69 - g * 23 * w - a * 69, -137 - a * 92], 28, '#3e8ad2', { hand: '#d3a364', angle: -a * .3 });
  CB_WEAR(c, stage, 5, -187, '#9fc8ee');
  c.save(); c.translate(-9 - a * 6, -295 + Math.sin(t * 2.3) * 2); c.rotate(-.055 + g * .035 * w - a * .045);
  for (const side of [-1, 1]) {
    c.save(); c.translate(side * 44, -12); c.rotate(side * .1 + Math.sin(t * 4.7 + side) * (.08 + w * .11));
    CB_ELLIPSE(c, side * 9, 15, 22, 43, side < 0 ? '#9b6d42' : '#825b3b', CB_INK, 3, side * .17); c.restore();
  }
  CB_ELLIPSE(c, -2, -3, 57, 59, CB_SHADE(c, -20, -18, 68, '#e3bb79', '#b27f4b'), CB_INK, 4);
  CB_ELLIPSE(c, -31, 23, 43, 29, '#edcc8f', CB_INK, 3);
  CB_ELLIPSE(c, -58, 13, 17, 13, '#303849', CB_INK, 2, -.12);
  CB_ELLIPSE(c, -63, 8, 5, 3, '#6c7685', null);
  CB_EYE(c, -24, -16, 6, 9, blink); CB_EYE(c, 12, -19, 6, 9, blink);
  CB_LINE(c, [[-31, -31], [-17, -35]], '#795936', 3);
  CB_LINE(c, [[5, -36], [20, -32]], '#795936', 3);
  c.beginPath(); c.moveTo(-49, 36); c.quadraticCurveTo(-22, 53 + a * 7, -5, 31); c.strokeStyle = '#775539'; c.lineWidth = 3; c.stroke();
  if (a > .22) CB_ELLIPSE(c, -21, 43, 9, 13, '#e7a193', '#9a6960', 2, -.18);
  // Attached police cap, with a broad bill that points in the travel direction.
  CB_ELLIPSE(c, 0, -48, 57, 25, '#327cc7', CB_INK, 3);
  CB_POLY(c, [[-53, -62], [-35, -75], [37, -75], [53, -56], [43, -40], [-45, -40]], '#3283d3', CB_INK, 3);
  CB_ELLIPSE(c, -20, -40, 57, 9, '#183f72', CB_INK, 2, -.08);
  CB_STAR(c, -14, -61, 10, '#f8d476');
  if (stage > 1) CB_LINE(c, [[28, 8], [39, 15], [35, 21]], '#9b754e', 3);
  c.restore();
  if (a > .15) {
    c.save(); c.globalAlpha *= a;
    const pulse = .5 + .5 * Math.sin(t * 15);
    CB_LINE(c, [[-142, -240], [-159 - pulse * 12, -258]], '#b8ddff', 4);
    CB_LINE(c, [[-148, -225], [-172 - pulse * 12, -227]], '#f5dc8b', 4); c.restore();
  }
}

/** Draws a recognized character and returns true; leaves unknown IDs untouched.
 * time: seconds; walk/attack/hit/death: 0..1; damageStage: 0..4.
 */
export function drawGardenCameoB(ctx, { id, time = 0, walk = 1, attack = 0, hit = 0, damageStage = 0, death = 0 } = {}) {
  const type = String(id || '').toLowerCase().replace(/[^a-z]/g, '');
  const rigs = { hellokitty: CB_KITTY, ultraman: CB_ULTRAMAN, teamrocket: CB_ROCKET, pikachu: CB_PIKACHU, dogman: CB_DOGMAN };
  const rig = rigs[type];
  if (!rig) return false;
  const t = CB_NUMBER(time), w = CB_CLAMP(walk), a = CB_CLAMP(attack), hurt = CB_CLAMP(hit), fallen = CB_CLAMP(death);
  const gait = Math.sin(t * 5.3), bob = Math.abs(Math.sin(t * 5.3)) * 4.2 * w;
  const stage = Math.round(CB_CLAMP(damageStage, 0, 4));
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // Collapse is pivoted at the feet; the connected character falls as a whole,
  // while the visible articulated gait flails during the first half of the fall.
  ctx.translate(-fallen * 31 - hurt * 8, -bob * (1 - fallen));
  ctx.rotate(-fallen * 1.28 + hurt * .065 + Math.sin(t * 2.5) * .012 * w);
  ctx.scale(1, 1 - fallen * .14);
  ctx.globalAlpha *= 1 - fallen * .38;
  if (hurt > .04) { ctx.shadowColor = '#fff3cb'; ctx.shadowBlur = 7 + hurt * 11; }
  rig(ctx, { t, gait, walk: w * (1 - fallen * .7), attack: a, stage, blink: CB_BLINK(t), death: fallen });
  ctx.restore();
  return true;
}
