/**
 * Pooled kart items. Entity positions, lifetimes and hits belong to the race
 * simulation; this module only displays its pickups/hazards/projectiles/events.
 *
 * const items = createRacePowerups(THREE, { track });
 * world.add(items.group);
 * items.handleEvents(simulation.drainEvents(), { cars: simulation.cars });
 * items.update(renderDelta, simulation, { cars: simulation.cars });
 * Call reset after simulation.reset, and dispose with the rest of the scene.
 */
export function createRacePowerups(THREE, { track } = {}) {
  if (typeof track?.sampleTrack !== 'function') throw new TypeError('Kart items require sampleTrack(distance)');
  const group = new THREE.Group();
  group.name = 'race3d-powerups';
  const geometries = new Set(), materials = new Set();
  const batches = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3(), right = new THREE.Vector3(), tangent = new THREE.Vector3();
  const heading = new THREE.Vector3(), offset = new THREE.Vector3();
  const color = new THREE.Color();
  const limits = Object.freeze({ pickups: 96, bananas: 96, bombs: 60, flames: 120, smoke: 120, sparks: 160, trails: 180, shockwaves: 16 });
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, finite(value, low)));
  const TAU = Math.PI * 2;
  let disposed = false, clock = 0, burstSerial = 0, lastTime = null, emissionTime = 0;

  function standard(hex, options = {}) {
    const material = new THREE.MeshStandardMaterial({ color: hex, roughness: .48, metalness: .12, ...options });
    materials.add(material);
    return material;
  }
  function basic(hex, options = {}) {
    const material = new THREE.MeshBasicMaterial({ color: hex, ...options });
    materials.add(material);
    return material;
  }
  function batch(name, geometry, material, capacity) {
    geometries.add(geometry);
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.name = `race3d-item-${name}`;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = !material.isMeshBasicMaterial;
    group.add(mesh);
    batches.push(mesh);
    return mesh;
  }
  // Merge our small component geometries once. No extra scene nodes per item.
  function combine(parts) {
    const positions = [], normals = [];
    for (const part of parts) {
      const expanded = part.index ? part.toNonIndexed() : part;
      const p = expanded.getAttribute('position'), n = expanded.getAttribute('normal');
      for (let i = 0; i < p.count; i++) {
        positions.push(p.getX(i), p.getY(i), p.getZ(i));
        normals.push(n.getX(i), n.getY(i), n.getZ(i));
      }
      if (expanded !== part) expanded.dispose();
      part.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return geometry;
  }
  function box(w, h, d, x, y, z) { return new THREE.BoxGeometry(w, h, d).translate(x, y, z); }
  function sphere(r, x = 0, y = 0, z = 0) { return new THREE.SphereGeometry(r, 12, 8).translate(x, y, z); }

  // Chamfer-like metal corners and raised question marks keep the rotating
  // boxes readable without canvas textures, fonts, or external resources.
  const edges = [];
  for (const a of [-.74, .74]) for (const b of [-.74, .74]) {
    edges.push(box(1.57, .065, .065, 0, a, b));
    edges.push(box(.065, 1.57, .065, a, 0, b));
    edges.push(box(.065, .065, 1.57, a, b, 0));
  }
  const questionCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.24, .23, .795), new THREE.Vector3(-.17, .43, .795),
    new THREE.Vector3(.14, .43, .795), new THREE.Vector3(.26, .25, .795),
    new THREE.Vector3(.12, .06, .795), new THREE.Vector3(0, -.03, .795), new THREE.Vector3(0, -.15, .795)
  ]);
  const question = combine([new THREE.TubeGeometry(questionCurve, 18, .065, 6, false), sphere(.072, 0, -.34, .795)]);
  const glyphs = [];
  for (let face = 0; face < 4; face++) glyphs.push(question.clone().rotateY(face * Math.PI / 2));
  question.dispose();
  const pickupCore = batch('pickup-shell', new THREE.BoxGeometry(1.46, 1.46, 1.46), standard(0xffffff, {
    roughness: .2, metalness: .3, emissive: 0x273f40, emissiveIntensity: .46
  }), limits.pickups);
  const pickupFrame = batch('pickup-frame', combine(edges), standard(0xd9edee, { roughness: .22, metalness: .72 }), limits.pickups);
  const pickupGlyph = batch('pickup-question', combine(glyphs), standard(0xfff6cd, {
    emissive: 0xffd867, emissiveIntensity: .48, roughness: .26, metalness: .35
  }), limits.pickups);
  const pickupHalo = batch('pickup-ground-ring', new THREE.TorusGeometry(1.16, .037, 5, 28).rotateX(Math.PI / 2),
    basic(0x91e6e9, { transparent: true, opacity: .52, depthWrite: false }), limits.pickups);
  const pickupColors = { banana: 0xe4b640, bomb: 0x539fba, boost: 0xd9793c };

  // Three broad, curling flaps and their pale inner skin form an actual peel.
  function peelGeometry(inner = false) {
    const positions = [], indices = [];
    for (let flap = 0; flap < 3; flap++) {
      const angle = flap * TAU / 3;
      const start = positions.length / 3;
      for (let row = 0; row <= 12; row++) {
        const t = row / 12;
        const radius = .09 + 1.14 * t;
        const width = .024 + .31 * Math.pow(Math.sin(Math.PI * t), .7);
        const height = .43 * Math.pow(1 - t, 2) + .31 * Math.pow(t, 5);
        for (let col = 0; col <= 4; col++) {
          const cross = col / 2 - 1;
          const x = radius, z = cross * width;
          positions.push(x * Math.sin(angle) + z * Math.cos(angle),
            height + .065 * cross * cross + (inner ? .025 : 0), x * Math.cos(angle) - z * Math.sin(angle));
        }
      }
      for (let row = 0; row < 12; row++) for (let col = 0; col < 4; col++) {
        const a = start + row * 5 + col, b = a + 5;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  const bananaOuter = batch('banana-peel', peelGeometry(), standard(0xd9ab26, { roughness: .6, metalness: .02, side: THREE.DoubleSide }), limits.bananas);
  const bananaInner = batch('banana-flesh', peelGeometry(true), standard(0xffe696, { roughness: .78, metalness: 0, side: THREE.DoubleSide }), limits.bananas);
  const tips = [new THREE.CylinderGeometry(.09, .15, .28, 8).translate(0, .5, 0)];
  for (let i = 0; i < 3; i++) {
    const angle = i * TAU / 3;
    tips.push(sphere(.068, Math.sin(angle) * 1.225, .34, Math.cos(angle) * 1.225));
  }
  const bananaTips = batch('banana-stem', combine(tips), standard(0x70562e, { roughness: .9, metalness: 0 }), limits.bananas);

  const bombBody = batch('bomb-body', new THREE.SphereGeometry(.66, 18, 12), standard(0x272b2e, { roughness: .32, metalness: .75 }), limits.bombs);
  const bombCollar = batch('bomb-bands', combine([
    new THREE.TorusGeometry(.664, .028, 5, 24),
    new THREE.TorusGeometry(.664, .028, 5, 24).rotateY(Math.PI / 2),
    new THREE.CylinderGeometry(.13, .19, .19, 10).translate(0, .65, 0)
  ]), standard(0xaba17c, { roughness: .34, metalness: .83 }), limits.bombs);
  const fusePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, .73, 0), new THREE.Vector3(.07, .99, 0),
    new THREE.Vector3(.25, 1.1, .01), new THREE.Vector3(.4, 1.04, .03)
  ]);
  const bombFuse = batch('bomb-fuse', new THREE.TubeGeometry(fusePath, 10, .037, 5, false), standard(0x806243, { roughness: 1, metalness: 0 }), limits.bombs);
  const bombEmber = batch('bomb-live-fuse', sphere(.09), basic(0xffb844, { toneMapped: false }), limits.bombs);

  function fadedMaterial(material, key) {
    material.transparent = true;
    material.depthWrite = false;
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aPowerAlpha;\nvarying float vPowerAlpha;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPowerAlpha = aPowerAlpha;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vPowerAlpha;')
        .replace('#include <opaque_fragment>', 'diffuseColor.a *= vPowerAlpha;\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey = () => `race3d-item-alpha-${key}`;
    return material;
  }
  function particlePool(name, capacity, material) {
    const geometry = new THREE.SphereGeometry(1, 7, 5);
    const alpha = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1);
    geometry.setAttribute('aPowerAlpha', alpha);
    const mesh = batch(name, geometry, fadedMaterial(material, name), capacity);
    const particles = Array.from({ length: capacity }, () => ({
      live: false, age: 0, life: 1, size: 1, grow: 0, gravity: 0,
      position: new THREE.Vector3(), velocity: new THREE.Vector3(), color: new THREE.Color()
    }));
    return { mesh, particles, alpha, cursor: 0 };
  }
  const smoke = particlePool('explosion-smoke', limits.smoke, standard(0xffffff, { roughness: 1, metalness: 0, opacity: .58 }));
  const sparks = particlePool('item-sparks', limits.sparks, basic(0xffffff, {
    opacity: .95, toneMapped: false, blending: THREE.AdditiveBlending
  }));
  const trails = particlePool('boost-trail', limits.trails, basic(0xffffff, {
    opacity: .48, toneMapped: false, blending: THREE.AdditiveBlending
  }));
  const shockAlpha = new THREE.InstancedBufferAttribute(new Float32Array(limits.shockwaves), 1);
  const shockGeometry = new THREE.TorusGeometry(1, .026, 5, 48).rotateX(Math.PI / 2);
  shockGeometry.setAttribute('aPowerAlpha', shockAlpha);
  const shockMesh = batch('explosion-shockwave', shockGeometry, fadedMaterial(basic(0xffc46b, {
    opacity: .88, toneMapped: false, blending: THREE.AdditiveBlending
  }), 'shockwave'), limits.shockwaves);
  const shocks = Array.from({ length: limits.shockwaves }, () => ({ live: false, age: 0, radius: 1, position: new THREE.Vector3() }));
  let shockCursor = 0;
  const flameGeometry = new THREE.ConeGeometry(.27, 1.8, 8).rotateX(-Math.PI / 2).translate(0, 0, -.9);
  const flameOuter = batch('boost-jet', flameGeometry, basic(0x48a9ee, {
    transparent: true, opacity: .63, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending
  }), limits.flames);
  const flameCore = batch('boost-hot-core', flameGeometry.clone(), basic(0xfff4bf, {
    transparent: true, opacity: .9, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending
  }), limits.flames);

  function frame(source, lift = 0) {
    const distance = finite(source?.distance);
    const sample = track.sampleTrack(distance);
    tangent.set(finite(sample.tangent?.x), finite(sample.tangent?.y), finite(sample.tangent?.z, 1));
    if (tangent.lengthSq() < 1e-8) tangent.set(0, 0, 1);
    tangent.normalize();
    right.set(finite(sample.right?.x, tangent.z), finite(sample.right?.y), finite(sample.right?.z, -tangent.x));
    if (right.lengthSq() < 1e-8) right.set(tangent.z, 0, -tangent.x);
    right.normalize();
    point.set(finite(sample.position?.x), finite(sample.position?.y), finite(sample.position?.z));
    point.addScaledVector(right, finite(source?.lateral));
    point.y += lift + finite(sample.bank) * finite(source?.lateral);
    dummy.position.copy(point);
    dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
    dummy.scale.setScalar(1);
    return dummy;
  }
  function stamp(mesh, index, transform = dummy) { transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix); }
  function count(meshes, n) { for (const mesh of meshes) { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; } }
  function particle(pool, position, velocity, hex, life, size, grow = 0, gravity = 0) {
    const p = pool.particles[pool.cursor];
    pool.cursor = (pool.cursor + 1) % pool.particles.length;
    p.live = true; p.age = 0; p.life = life; p.size = size; p.grow = grow; p.gravity = gravity;
    p.position.copy(position); p.velocity.copy(velocity); p.color.setHex(hex);
  }
  // Local deterministic variation is deliberately separate from the game RNG.
  function jitter(seed) { const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return value - Math.floor(value); }
  function spray(position, kind, radius = 1) {
    const explosion = kind === 'explosion';
    const seed = ++burstSerial * 83;
    const n = explosion ? 25 : 9;
    for (let i = 0; i < n; i++) {
      const angle = jitter(seed + i * 3) * TAU;
      const speed = explosion ? 4 + jitter(seed + i * 7) * 7 : 1.2 + jitter(seed + i * 7) * 2.4;
      offset.set(Math.sin(angle) * speed, (explosion ? 2 : .5) + jitter(seed + i * 9) * (explosion ? 6 : 2), Math.cos(angle) * speed);
      particle(sparks, position, offset, explosion ? (i % 3 ? 0xffc261 : 0xff693c) : kind === 'boost' ? 0x7ddfff : 0xffe59b,
        explosion ? .36 + jitter(seed + i) * .38 : .32 + jitter(seed + i) * .28, explosion ? .11 : .08, .4, explosion ? 8 : 2);
    }
    if (!explosion) return;
    for (let i = 0; i < 14; i++) {
      const angle = jitter(seed + i * 11) * TAU;
      offset.set(Math.sin(angle) * (1 + jitter(seed + i) * 3), 1.4 + jitter(seed + i * 2) * 3.3, Math.cos(angle) * (1 + jitter(seed + i) * 3));
      particle(smoke, position, offset, i % 3 ? 0x555251 : 0x8d8377, .65 + jitter(seed + i * 5) * .7, .36 + jitter(seed + i * 8) * .36, 2.3);
    }
    const shock = shocks[shockCursor];
    shockCursor = (shockCursor + 1) % shocks.length;
    shock.live = true; shock.age = 0; shock.radius = clamp(radius, 1, 16);
    shock.position.copy(position); shock.position.y -= .55;
  }
  function updateParticles(pool, dt) {
    let n = 0;
    for (const p of pool.particles) {
      if (!p.live) continue;
      p.age += dt;
      if (p.age >= p.life) { p.live = false; continue; }
      p.velocity.y -= p.gravity * dt;
      p.position.addScaledVector(p.velocity, dt);
      const t = p.age / p.life;
      dummy.position.copy(p.position); dummy.rotation.set(0, 0, 0);
      const size = p.size * (1 + t * p.grow);
      if (pool === trails) {
        dummy.rotation.y = Math.atan2(p.velocity.x, p.velocity.z);
        dummy.scale.set(size, size * .5, size * 3.6);
      } else dummy.scale.setScalar(size);
      stamp(pool.mesh, n);
      pool.mesh.setColorAt(n, p.color);
      pool.alpha.array[n] = (1 - t) * (1 - t);
      n++;
    }
    pool.alpha.needsUpdate = true;
    count([pool.mesh], n);
    if (pool.mesh.instanceColor) pool.mesh.instanceColor.needsUpdate = true;
  }

  function handleEvents(events = [], { cars = [] } = {}) {
    if (disposed) return;
    for (const event of events) {
      if (!event) continue;
      if (!['item-pickup', 'banana-hit', 'bomb-explode', 'boost'].includes(event.type)) continue;
      const car = cars.find(car => car.id === event.carId);
      frame({ distance: event.distance ?? car?.distance, lateral: event.lateral ?? car?.lateral }, .65);
      // event coordinates refer to the impact location, not the current shooter.
      if (event.position && typeof event.position === 'object') {
        point.set(finite(event.position.x, point.x), finite(event.position.y, point.y), finite(event.position.z, point.z));
      }
      spray(point, event.type === 'bomb-explode' ? 'explosion' : event.type === 'boost' ? 'boost' : 'pickup', event.radius);
    }
  }

  function update(dt = 0, state = {}, { cars = state.cars || [] } = {}) {
    if (disposed) return;
    const step = clamp(dt, 0, .1);
    const source = state.powerups || state;
    const time = finite(source.time, clock);
    if (lastTime !== null && time < lastTime - .001) reset();
    lastTime = time;
    clock += step;
    emissionTime += step;
    // Keep effect emission bounded during slow frames and background-tab wakes.
    const emitTrail = emissionTime >= 1 / 30;
    if (emitTrail) emissionTime %= 1 / 30;
    let n = 0;
    for (const pickup of source.pickups || []) {
      if (pickup.active === false || n >= limits.pickups) continue;
      frame(pickup, 1.45 + Math.sin(clock * 2.3 + n * 1.7) * .16);
      dummy.rotation.y += clock * 1.25 + n * .47;
      dummy.rotation.z = Math.sin(clock * 1.7 + n) * .07;
      for (const mesh of [pickupCore, pickupFrame, pickupGlyph]) stamp(mesh, n);
      color.setHex(pickupColors[pickup.type] || 0x61b6c4);
      pickupCore.setColorAt(n, color);
      frame(pickup, .08);
      stamp(pickupHalo, n);
      n++;
    }
    count([pickupCore, pickupFrame, pickupGlyph, pickupHalo], n);
    if (pickupCore.instanceColor) pickupCore.instanceColor.needsUpdate = true;

    n = 0;
    for (const hazard of source.hazards || []) {
      if (hazard.type !== 'banana' || hazard.active === false || n >= limits.bananas) continue;
      frame(hazard, .055);
      dummy.rotation.y += finite(hazard.id?.toString?.().length, n) * .73;
      const remaining = Math.max(0, finite(hazard.ttl, 18) - finite(hazard.age));
      dummy.scale.setScalar(Math.min(1, remaining * 2.5));
      for (const mesh of [bananaOuter, bananaInner, bananaTips]) stamp(mesh, n);
      n++;
    }
    count([bananaOuter, bananaInner, bananaTips], n);

    n = 0;
    for (const bomb of source.projectiles || []) {
      if (bomb.type !== 'bomb' || bomb.active === false || n >= limits.bombs) continue;
      // Only height is decorative: X/Z always use the collision entity's exact
      // track coordinates. The short throw arc uses authoritative entity age.
      const age = Math.max(0, finite(bomb.age));
      const toss = age < .65 ? Math.sin(Math.PI * age / .65) * 2.2 : 0;
      frame(bomb, .75 + toss);
      dummy.rotation.y += age * 2.6;
      dummy.rotation.z = Math.sin(age * 5) * .18;
      for (const mesh of [bombBody, bombCollar, bombFuse]) stamp(mesh, n);
      const pulse = .75 + .25 * Math.sin(clock * 42 + n);
      offset.set(.4, 1.04, .03).applyQuaternion(dummy.quaternion);
      dummy.position.add(offset);
      dummy.scale.setScalar(pulse);
      stamp(bombEmber, n);
      if (emitTrail && finite(bomb.fuse, 1) > 0) {
        offset.set(Math.sin(clock * 47 + n) * .7, 1.5, Math.cos(clock * 39 + n) * .7);
        particle(sparks, dummy.position, offset, 0xffc266, .16, .038, 0, 2);
      }
      n++;
    }
    count([bombBody, bombCollar, bombFuse, bombEmber], n);

    n = 0;
    for (const car of cars.slice(0, 60)) {
      if (car.finished || finite(car.boost) <= 0) continue;
      frame(car, .4);
      heading.copy(tangent).applyAxisAngle(UP, finite(car.heading));
      const yaw = Math.atan2(heading.x, heading.z);
      right.set(heading.z, 0, -heading.x).normalize();
      const pulse = 1 + .2 * Math.sin(clock * 41 + n * 1.4);
      for (const side of [-1, 1]) {
        dummy.position.copy(point).addScaledVector(heading, -2.15).addScaledVector(right, side * .58);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(1, .8, pulse);
        stamp(flameOuter, n);
        dummy.scale.set(.54, .45, pulse * .65);
        stamp(flameCore, n);
        if (emitTrail) {
          offset.copy(heading).multiplyScalar(-3);
          offset.y += .14;
          particle(trails, dummy.position, offset, side === -1 ? 0x75c9f3 : 0xa4d6f0, .26, .16, .7);
        }
        n++;
      }
    }
    count([flameOuter, flameCore], n);
    updateParticles(smoke, step);
    updateParticles(sparks, step);
    updateParticles(trails, step);
    n = 0;
    for (const shock of shocks) {
      if (!shock.live) continue;
      shock.age += step;
      if (shock.age >= .58) { shock.live = false; continue; }
      const t = shock.age / .58;
      const radius = .7 + (shock.radius - .7) * (1 - Math.pow(1 - t, 2));
      dummy.position.copy(shock.position); dummy.rotation.set(0, 0, 0);
      dummy.scale.set(radius, 1, radius);
      stamp(shockMesh, n);
      shockAlpha.array[n] = (1 - t) * .8;
      n++;
    }
    shockAlpha.needsUpdate = true;
    count([shockMesh], n);
  }

  function reset() {
    if (disposed) return;
    clock = 0; burstSerial = 0; lastTime = null; shockCursor = 0; emissionTime = 0;
    for (const pool of [smoke, sparks, trails]) {
      pool.cursor = 0;
      for (const p of pool.particles) p.live = false;
      pool.alpha.array.fill(0); pool.alpha.needsUpdate = true;
    }
    for (const shock of shocks) shock.live = false;
    shockAlpha.array.fill(0); shockAlpha.needsUpdate = true;
    for (const mesh of batches) mesh.count = 0;
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    group.removeFromParent();
    for (const mesh of batches) mesh.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    group.clear(); geometries.clear(); materials.clear();
  }
  return { group, update, handleEvents, reset, dispose, limits };
}
