const stage = document.querySelector<HTMLElement>('.smiley-stage');
const canvas = stage?.querySelector<HTMLCanvasElement>('.smiley-arms');
const face = stage?.querySelector<HTMLButtonElement>('.smiley-face');
const sparks = stage?.querySelector<HTMLElement>('.smiley-sparks');
const pen = canvas?.getContext('2d');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (stage && canvas && face && pen && sparks) {
  const scene = { stage, canvas, face, pen, sparks };
  const targets = [...stage.querySelectorAll<HTMLAnchorElement>('[data-arm]')];
  const glove = new Path2D('M 0 -8 Q 4 -15 10 -14 Q 16 -13 18 -7 L 39 -7 Q 46 -7 46 -2 Q 46 3 39 4 L 22 4 Q 25 9 20 12 Q 19 17 13 16 Q 9 20 4 15 Q 0 12 -2 7 L -3 -3 Z');
  const cuff = new Path2D('M -9 -9 Q -6 -12 1 -10 L 2 10 Q -5 13 -9 9 Z');
  const seams = new Path2D('M 8 -8 L 10 -3 M 12 -9 L 14 -4 M 17 6 Q 13 10 9 7');
  const shoulderAngles = [-52, -19, 19, 52];
  let frame = 0;
  let wiggleUntil = 0;
  let audio: AudioContext | undefined;

  function drawArm(target: HTMLAnchorElement, bounds: DOMRect, mascot: DOMRect, index: number, now: number) {
    const { pen } = scene;
    const box = target.getBoundingClientRect();
    const side = target.dataset.side === 'left' ? -1 : 1;
    const angle = shoulderAngles[Number(target.dataset.row) - 1] * Math.PI / 180;
    const radius = mascot.width * .46;
    const x = mascot.left - bounds.left + mascot.width / 2 + side * Math.cos(angle) * radius;
    const y = mascot.top - bounds.top + mascot.height / 2 + Math.sin(angle) * radius;
    const compact = bounds.width < 650;
    const scale = compact ? Math.max(.39, bounds.width / 780) : .86;
    const ink = target.matches(':hover,:focus-visible') ? '#382255' : '#181211';
    const edge = (side === -1 ? box.right : box.left) - bounds.left;
    const tip = edge - side * (compact ? 5 : 11);
    const wrist = tip - side * 46 * scale;
    const targetY = box.top - bounds.top + box.height / 2;
    const active = !motion.matches && now < wiggleUntil;
    const bounce = active ? Math.sin(now / 49 + index * .8) * 12 * (wiggleUntil - now) / 530 : 0;

    pen.save();
    pen.strokeStyle = ink;
    pen.lineWidth = compact ? 7 : 13;
    pen.lineCap = 'round';
    pen.beginPath();
    pen.moveTo(x, y);
    pen.bezierCurveTo(
      x + side * (compact ? 13 : 66), y + (targetY - y) * .28 + bounce,
      wrist - side * (compact ? 22 : 80), targetY + bounce,
      wrist, targetY
    );
    pen.stroke();
    pen.translate(wrist, targetY);
    pen.scale(side * scale, scale);
    pen.lineWidth = 2.7;
    pen.lineJoin = 'round';
    pen.fillStyle = '#ffffff';
    for (const shape of [cuff, glove]) {
      pen.fill(shape);
      pen.stroke(shape);
    }
    pen.lineWidth = 1.6;
    pen.stroke(seams);
    pen.restore();
  }

  function render(now: number) {
    frame = 0;
    const bounds = scene.stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(bounds.width * dpr);
    const height = Math.round(bounds.height * dpr);
    if (scene.canvas.width !== width || scene.canvas.height !== height) {
      scene.canvas.width = width;
      scene.canvas.height = height;
    }
    scene.pen.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.pen.clearRect(0, 0, bounds.width, bounds.height);
    const mascot = scene.face.getBoundingClientRect();
    targets.forEach((target, index) => drawArm(target, bounds, mascot, index, now));
    if (now < wiggleUntil) invalidate();
  }

  function invalidate() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function sparkle(x: number, y: number, count: number) {
    const bounds = scene.stage.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const star = document.createElement('i');
      const angle = Math.random() * Math.PI * 2;
      const distance = 18 + Math.random() * 45;
      star.style.cssText = `--x:${x - bounds.left}px;--y:${y - bounds.top}px;--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance}px;--size:${10 + 9 * Math.random()}px;--tint:${['#ffd22e', '#a581fa', '#ff9e42'][i % 3]}`;
      scene.sparks.append(star);
      star.addEventListener('animationend', () => star.remove(), { once: true });
    }
  }

  async function woo() {
    try {
      audio ||= new AudioContext();
      if (audio.state !== 'running') await audio.resume();
      [[350, 440], [440, 530]].forEach(([from, to], i) => {
        const start = audio!.currentTime + .03 + i * .27;
        const voice = audio!.createOscillator();
        const volume = audio!.createGain();
        voice.type = 'triangle';
        voice.frequency.setValueAtTime(from, start);
        voice.frequency.exponentialRampToValueAtTime(to, start + .11);
        voice.frequency.exponentialRampToValueAtTime(from * .9, start + .23);
        volume.gain.setValueAtTime(.001, start);
        volume.gain.exponentialRampToValueAtTime(.12, start + .07);
        volume.gain.exponentialRampToValueAtTime(.001, start + .23);
        voice.connect(volume).connect(audio!.destination);
        voice.onended = () => { voice.disconnect(); volume.disconnect(); };
        voice.start(start);
        voice.stop(start + .25);
      });
    } catch {
      // The visual interaction still works when sound is unavailable.
    }
  }

  scene.face.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse' && !motion.matches) sparkle(event.clientX, event.clientY, 5);
  });

  scene.face.addEventListener('click', (event) => {
    if (!motion.matches) {
      const box = scene.face.getBoundingClientRect();
      sparkle(event.detail ? event.clientX : box.left + box.width / 2,
        event.detail ? event.clientY : box.top + box.height / 2, 12);
      wiggleUntil = performance.now() + 530;
      invalidate();
    }
    void woo();
  });

  targets.forEach((target) => {
    for (const event of ['pointerenter', 'pointerleave', 'focus', 'blur', 'transitionend']) {
      target.addEventListener(event, invalidate);
    }
  });
  const resize = new ResizeObserver(invalidate);
  resize.observe(scene.stage);
  targets.forEach((target) => resize.observe(target));
  window.addEventListener('hashchange', invalidate);
  invalidate();
}
