(function (global) {
  'use strict';

  const gold = ['#fff9ed', '#fae7c8', '#efd4aa', '#caa377'];
  const silver = ['#ffffff', '#eaf9ff', '#c3dce9', '#8b9bb5'];
  const pink = ['#fff2f8', '#f6d9e6', '#e8acc9', '#bc829f'];
  const jewel = ['#f7e6d0', '#efd2e1', '#c9e2ef', '#d6d2e7'];
  const tau = 2 * Math.PI;
  let active = null;

  // Positions favor the perimeter so particles frame the modal on narrow phones.
  const scenes = {
    first: [
      [0, .16, .5, 'clap'], [.12, .84, .5, 'paw'],
      [.53, .1, .27, 'paw'], [.63, .9, .3, 'clap'],
      [.97, .24, .8, 'sparkle'], [1.04, .76, .78, 'sparkle']
    ],
    three: [
      [0, .14, .3, 'gold'], [.28, .88, .22, 'gold'],
      [.64, .48, .12, 'gold'], [1, .18, .75, 'sparkle'],
      [1.1, .82, .79, 'sparkle']
    ],
    seven: [
      [0, .18, .26, 'gold'], [.12, .85, .33, 'silver'],
      [.5, .77, .12, 'gold'], [.74, .12, .74, 'silver'],
      [.97, .9, .65, 'gold'], [1.3, .35, .13, 'silver'],
      [1.56, .1, .38, 'gold'], [1.6, .9, .41, 'silver'],
      [1.84, .62, .18, 'crown'], [1.92, .27, .83, 'sparkle'],
      [1.98, .75, .82, 'sparkle']
    ],
    return: [
      [0, .12, .78, 'hearts'], [.23, .87, .76, 'hearts'],
      [.57, .15, .47, 'hearts'], [.81, .85, .5, 'hearts'],
      [1.05, .43, .21, 'sparkle']
    ],
    daily: [[0, .16, .37, 'sparkle'], [.24, .84, .3, 'sparkle']]
  };

  const between = (low, high) => low + Math.random() * (high - low);
  const pick = items => items[Math.floor(Math.random() * items.length)];
  const isFirework = style => style === 'gold' || style === 'silver' || style === 'crown';

  function stop() {
    if (!active) return;
    const scene = active;
    active = null;
    global.cancelAnimationFrame(scene.frame);
    global.clearTimeout(scene.timeout);
    document.removeEventListener('visibilitychange', scene.onHide);
    global.removeEventListener('pagehide', stop);
    scene.canvas.remove();
  }

  function star(ctx, radius, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = Math.PI * i / points - Math.PI / 2;
      const length = i % 2 ? radius * (points === 4 ? .22 : .46) : radius;
      const x = Math.cos(angle) * length;
      const y = Math.sin(angle) * length;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function diamond(ctx, radius, face, glint) {
    // A brilliant cut with a wide table, short girdle and cool, shaded pavilion.
    ctx.save();
    ctx.scale(radius, radius);
    ctx.beginPath();
    ctx.moveTo(-1, -.19);
    ctx.lineTo(-.55, -.66);
    ctx.lineTo(.55, -.66);
    ctx.lineTo(1, -.19);
    ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.fillStyle = '#8b94af';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1, -.19);
    ctx.lineTo(-.55, -.66);
    ctx.lineTo(.55, -.66);
    ctx.lineTo(1, -.19);
    ctx.closePath();
    ctx.fillStyle = '#f1faff';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-.55, -.66);
    ctx.lineTo(-.4, -.19);
    ctx.lineTo(.4, -.19);
    ctx.lineTo(.55, -.66);
    ctx.closePath();
    ctx.fillStyle = face;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-.4, -.19);
    ctx.lineTo(.4, -.19);
    ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(.4, -.19);
    ctx.lineTo(1, -.19);
    ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.fillStyle = '#b8cde0';
    ctx.fill();
    if (glint > 0) {
      ctx.translate(.58, -.51);
      ctx.fillStyle = '#ffffff';
      star(ctx, .95 * glint, 4);
    }
    ctx.restore();
  }

  function makeParticle(x, y, vx, vy, life, size, shape, color, gravity) {
    return {
      x, y, vx, vy, life, size, shape, color, gravity,
      tilt: between(-.5, .5), spin: between(-2.2, 2.2), phase: between(0, tau)
    };
  }

  function burst(scene, event, time) {
    const [, rx, ry, style] = event;
    const x = scene.width * rx;
    const y = scene.height * ry;
    const scale = scene.scale;
    const particles = [];
    if (isFirework(style)) {
      const palette = style === 'silver' ? silver : gold;
      const amount = style === 'crown' ? 40 : 27;
      const offset = between(0, tau);
      for (let i = 0; i < amount; i++) {
        const angle = offset + (i + between(-.2, .2)) * tau / amount;
        const speed = between(95, 180) * scale;
        const crystal = i % (scene.finale ? 4 : 8) === 1;
        const shape = crystal ? 'diamond' : i % 4 === 0 ? 'star' : 'streak';
        const size = crystal ? between(4.3, 6.5) : between(2, 4.6);
        particles.push(makeParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
          between(.8, 1.6), size * scale, shape, pick(palette), 93 * scale));
      }
      particles.push(makeParticle(x, y, 0, 0, .34, 14 * scale, 'spark', '#fff4e5', 0));
    } else if (style === 'hearts') {
      for (let i = 0; i < 9; i++) {
        particles.push(makeParticle(x + between(-15, 15), y, between(-39, 39) * scale,
          between(-122, -63) * scale, between(1, 1.9), between(5, 13) * scale,
          i === 6 ? 'diamond' : i % 3 ? 'heart' : 'spark', pick(pink), -12 * scale));
      }
    } else {
      const clap = style !== 'sparkle';
      for (let i = 0; i < (clap ? 13 : 10); i++) {
        const angle = between(-Math.PI, .12);
        const speed = between(30, 98) * scale;
        particles.push(makeParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
          between(.6, 1.15), between(3, 6) * scale, i % 6 === 1 ? 'diamond' : 'spark',
          pick(jewel), 36 * scale));
      }
      if (clap) {
        particles.push(makeParticle(x, y, rx < .5 ? 12 : -12, -56 * scale,
          1.05, 24 * scale, style, '#fff', 10 * scale));
      }
    }
    for (const particle of particles) {
      particle.born = time;
      scene.particles.push(particle);
    }
  }

  function drawParticle(ctx, p, age) {
    const progress = age / p.life;
    const drag = 1.55;
    const motion = (1 - Math.exp(-drag * age)) / drag;
    const sway = p.shape === 'heart' ? Math.sin(4 * age + p.phase) * age * 8 : 0;
    const x = p.x + p.vx * motion + sway;
    const y = p.y + p.vy * motion + p.gravity * age * age / 2;
    const fade = Math.min(1, (1 - progress) * 2.2);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = fade;
    ctx.fillStyle = p.color;
    if (p.shape === 'streak') {
      const visibleTrail = .067 * (1 - progress);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(.75, p.size * .66 * (1 - .48 * progress));
      ctx.beginPath();
      ctx.moveTo(-p.vx * Math.exp(-drag * age) * visibleTrail,
        -(p.vy * Math.exp(-drag * age) + p.gravity * age) * visibleTrail);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = '#fffafa';
      ctx.fillRect(-.6, -.6, 1.2, 1.2);
    } else if (p.shape === 'diamond') {
      ctx.rotate(p.tilt + p.spin * age * .26);
      // Facets roll gently through a narrow reflection rather than flashing in unison.
      const roll = Math.cos(age * 4.4 + p.phase);
      ctx.scale(.8 + .2 * roll, 1);
      diamond(ctx, p.size, p.color, Math.max(0, (roll - .6) / .4));
    } else if (p.shape === 'heart' || p.shape === 'clap' || p.shape === 'paw') {
      ctx.rotate(p.tilt * .5 + Math.sin(age * 7) * .14);
      ctx.font = Math.round(p.size * (p.shape === 'heart' ? 1.65 : 1.35)) +
        'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.shape === 'heart' ? '♥' : p.shape === 'clap' ? '👏' : '🐾', 0, 0);
    } else {
      ctx.rotate(p.tilt + p.spin * age);
      const radius = p.size * (.82 + .18 * Math.cos(age * 11 + p.phase));
      star(ctx, radius, p.shape === 'star' ? 5 : 4);
      ctx.fillStyle = '#fff';
      star(ctx, radius * .46, 4);
    }
    ctx.restore();
  }

  function drawComet(scene, event, elapsed) {
    const [time, rx, ry, style] = event;
    const duration = .25;
    const flight = (elapsed - time + duration) / duration;
    if (!isFirework(style) || flight <= 0 || flight >= 1) return;
    const ctx = scene.ctx;
    const remaining = 1 - flight;
    const x = scene.width * rx + (rx < .5 ? -1 : 1) * 24 * remaining;
    const y = scene.height * ry + scene.scale * 98 * remaining;
    ctx.save();
    ctx.globalAlpha = Math.min(1, flight * 4);
    ctx.strokeStyle = style === 'silver' ? '#d8eaf5' : '#f6e1c5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + (rx < .5 ? -5 : 5), y + 16);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.translate(x, y);
    ctx.fillStyle = '#fff';
    star(ctx, 4 * scene.scale, 4);
    ctx.restore();
  }

  function drawStill(scene, kind) {
    const ctx = scene.ctx;
    const marks = [[.15,.29], [.84,.27], [.1,.66], [.91,.64], [.27,.82], [.71,.14]];
    marks.slice(0, kind === 'seven' ? 6 : 4).forEach(([x,y], i) => {
      ctx.save();
      ctx.translate(scene.width * x, scene.height * y);
      const face = kind === 'return' ? pink[i % pink.length] : (i % 2 ? silver : gold)[2];
      if (i % 2 === 0) {
        diamond(ctx, 7 * scene.scale, face, .9);
      } else {
        ctx.fillStyle = face;
        star(ctx, 7 * scene.scale, 4);
        ctx.fillStyle = '#fff';
        star(ctx, 3 * scene.scale, 4);
      }
      ctx.restore();
    });
  }

  function play(kind, element) {
    stop();
    if (!element || !element.isConnected) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bounds = element.getBoundingClientRect();
    const width = bounds.width || global.innerWidth;
    const height = bounds.height || global.innerHeight;
    if (!(width > 0 && height > 0)) return;
    const density = Math.min(global.devicePixelRatio || 1, 2, Math.sqrt(2500000 / (width * height)));
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none';
    canvas.setAttribute('aria-hidden', 'true');
    element.appendChild(canvas);
    ctx.scale(density, density);
    ctx.lineCap = 'round';
    const events = Object.prototype.hasOwnProperty.call(scenes, kind) ? scenes[kind] : scenes.daily;
    const scene = {
      canvas, ctx, width, height, events, finale: kind === 'seven', particles: [], frame: 0, timeout: 0,
      scale: Math.max(.72, Math.min(1.55, width / 390, height / 670)),
      onHide: () => { if (document.hidden) stop(); }
    };
    active = scene;
    global.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', scene.onHide);
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawStill(scene, kind);
      scene.timeout = global.setTimeout(stop, 1700);
      return;
    }
    let next = 0;
    const started = global.performance.now();
    function frame(now) {
      if (active !== scene) return;
      if (!element.isConnected || document.hidden) { stop(); return; }
      const elapsed = (now - started) / 1000;
      ctx.clearRect(0, 0, width, height);
      while (next < events.length && events[next][0] <= elapsed) {
        burst(scene, events[next], events[next][0]);
        next++;
      }
      for (let i = next; i < events.length && events[i][0] < elapsed + .25; i++) {
        drawComet(scene, events[i], elapsed);
      }
      scene.particles = scene.particles.filter(p => elapsed - p.born < p.life);
      for (const particle of scene.particles) drawParticle(ctx, particle, elapsed - particle.born);
      if (next === events.length && scene.particles.length === 0) { stop(); return; }
      scene.frame = global.requestAnimationFrame(frame);
    }
    scene.frame = global.requestAnimationFrame(frame);
  }

  global.DiaryEffects = {play, stop};
})(window);
