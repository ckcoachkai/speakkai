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
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const batches = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3(), right = new THREE.Vector3(), tangent = new THREE.Vector3();
  const heading = new THREE.Vector3(), offset = new THREE.Vector3();
  const color = new THREE.Color();
  const limits = Object.freeze({ pickups: 96, bananas: 96, bombs: 60, missiles: 60, waves: 48, cars: 60, flames: 120, smoke: 120, sparks: 200, trails: 240, shockwaves: 20 });
  const itemTypes = ['launch', 'rocket', 'boost', 'bomb', 'shield', 'banana', 'missile', 'shockwave', 'freeze', 'repair'];
  const itemLabels = ['SPACE LAUNCH', 'ROCKET', 'NITRO', 'BOMB', 'SHIELD', 'BANANA', 'MISSILE', 'SHOCKWAVE', 'FREEZE', 'REPAIR'];
  const itemColors = [0xb68aff, 0x36edbe, 0x38dcea, 0xff994d, 0x5bbcff, 0xffda3b, 0xff6373, 0xe892ff, 0xa0edff, 0x74ef9a];
  const indicators = new Map();
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
  const pickupColors = Object.fromEntries(itemTypes.map((type, index) => [type, itemColors[index]]));

  // One small local atlas supplies ten crisp icons and real item names. The
  // cards are instanced, billboarded and follow the car that received the item.
  function makeItemAtlas() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    for (let i = 0; i < itemTypes.length; i++) {
      const x = i % 2 * 512, y = Math.floor(i / 2) * 204.8;
      const tint = `#${itemColors[i].toString(16).padStart(6, '0')}`;
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(7,17,30,.94)';
      ctx.strokeStyle = tint; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.roundRect(10, 9, 492, 185, 24); ctx.fill(); ctx.stroke();
      ctx.shadowColor = tint; ctx.shadowBlur = 13; ctx.strokeStyle = tint; ctx.fillStyle = tint;
      ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save(); ctx.translate(256, 77);
      const line = (points, close = false, fill = false) => {
        ctx.beginPath(); ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p);
        if (close) ctx.closePath(); if (fill) ctx.fill(); else ctx.stroke();
      };
      const circle = (r, px = 0, py = 0, fill = false) => { ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); if (fill) ctx.fill(); else ctx.stroke(); };
      const type = itemTypes[i];
      if (type === 'launch' || type === 'rocket' || type === 'missile') {
        line([[0,-46],[21,-12],[18,30],[-18,30],[-21,-12]], true, true);
        line([[-18,8],[-38,36],[-18,29]], true, true); line([[18,8],[38,36],[18,29]], true, true);
        ctx.fillStyle = '#eaffff'; circle(7, 0, -6, true);
        if (type === 'launch') { line([[-34,-33],[-45,-45]]); line([[34,-33],[45,-45]]); line([[0,39],[0,53]]); }
        else if (type === 'rocket') { line([[-10,38],[-15,52]]); line([[10,38],[15,52]]); }
        else { ctx.strokeStyle = '#fff3cf'; line([[-37,-30],[-25,-30]]); line([[25,-30],[37,-30]]); }
      } else if (type === 'boost') line([[8,-45],[-29,9],[-2,9],[-13,47],[30,-10],[3,-10]], true, true);
      else if (type === 'bomb') { circle(31, 0, 9, true); line([[5,-22],[13,-39],[28,-40],[33,-50]]); ctx.fillStyle='#fff6bd';circle(6,33,-50,true); }
      else if (type === 'shield') { line([[0,-45],[37,-31],[31,10],[0,46],[-31,10],[-37,-31]], true);ctx.strokeStyle='#e8fbff';line([[-14,0],[-2,13],[20,-14]]); }
      else if (type === 'banana') { line([[0,-40],[6,-3],[43,31],[9,21],[0,2],[-9,21],[-43,31],[-6,-3]],true,true); }
      else if (type === 'shockwave') { for(const r of [14,29,44]){ctx.beginPath();ctx.arc(0,0,r,-2.7,2.7);ctx.stroke();} }
      else if (type === 'freeze') { for(let axis=0;axis<3;axis++){ctx.save();ctx.rotate(axis*Math.PI/3);line([[0,-44],[0,44]]);line([[-13,-29],[0,-16],[13,-29]]);line([[-13,29],[0,16],[13,29]]);ctx.restore();} }
      else if (type === 'repair') line([[-12,-40],[12,-40],[12,-12],[40,-12],[40,12],[12,12],[12,40],[-12,40],[-12,12],[-40,12],[-40,-12],[-12,-12]],true,true);
      ctx.restore(); ctx.shadowBlur = 0; ctx.fillStyle = '#f5fbff';
      ctx.font = '900 38px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(itemLabels[i], 256, 164, 456); ctx.restore();
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4; textures.add(texture); return texture;
  }
  const atlas = makeItemAtlas();
  const labelGeometry = new THREE.PlaneGeometry(5.2, 2.08);
  const labelUV = new THREE.InstancedBufferAttribute(new Float32Array(limits.cars * 2), 2);
  labelGeometry.setAttribute('aItemCell', labelUV);
  const labelMaterial = basic(0xffffff, { map: atlas, transparent: true, opacity: .98, depthWrite: false, depthTest: false, toneMapped: false });
  labelMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aItemCell;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = (vMapUv + aItemCell) / vec2(2.0, 5.0);\n#endif');
  };
  labelMaterial.customProgramCacheKey = () => 'race3d-item-label-atlas-v1';
  const itemCards = batch('received-item-label', labelGeometry, labelMaterial, limits.cars);
  itemCards.renderOrder = 9;

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
  // A continuous backward wake makes the fast forward-moving bomb readable
  // between particle emissions. Its transform follows physics, not body spin.
  const bombWake = batch('bomb-forward-wake', new THREE.ConeGeometry(.28, 6, 8).rotateX(-Math.PI / 2).translate(0, 0, -3),
    basic(0xffa442, { transparent: true, opacity: .54, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), limits.bombs);

  const missileBody = batch('missile-body', combine([
    new THREE.CylinderGeometry(.24,.24,1.8,12).rotateX(Math.PI/2),
    new THREE.ConeGeometry(.26,.65,12).rotateX(Math.PI/2).translate(0,0,1.2)
  ]), standard(0xe8eff1,{metalness:.75,roughness:.24,emissive:0x391319,emissiveIntensity:.2}),limits.missiles);
  const missileFins = batch('missile-fins', combine(Array.from({length:4},(_,i)=>
    box(.09,.9,.65,0,0,-.65).rotateZ(i*Math.PI/2))), standard(0xe64f65,{metalness:.4,roughness:.3}),limits.missiles);
  const missileJet = batch('missile-thrust',new THREE.ConeGeometry(.22,2.3,8).rotateX(-Math.PI/2).translate(0,0,-2.05),
    basic(0xffaa69,{transparent:true,opacity:.83,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.missiles);
  const waveArc = batch('forward-wave-arc',new THREE.TorusGeometry(1,.055,6,32,Math.PI).rotateX(Math.PI/2),
    basic(0xffffff,{transparent:true,opacity:.9,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.waves);
  const waveWall = batch('forward-wave-front',new THREE.PlaneGeometry(2,1.35).translate(0,.62,0),
    basic(0xffffff,{transparent:true,opacity:.28,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),limits.waves);
  const shieldBubble = batch('shield-bubble',new THREE.SphereGeometry(2.85,24,16),standard(0x71caff,{
    roughness:.08,metalness:.12,emissive:0x168cde,emissiveIntensity:.45,transparent:true,opacity:.18,depthWrite:false,
    side:THREE.DoubleSide
  }),limits.cars);
  const shieldRim = batch('shield-energy-rings',combine([
    new THREE.TorusGeometry(2.83,.043,5,40),new THREE.TorusGeometry(2.83,.043,5,40).rotateX(Math.PI/2),
    new THREE.TorusGeometry(2.83,.025,5,40).rotateY(Math.PI/2)
  ]),basic(0x71d8ff,{transparent:true,opacity:.76,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  const freezeShell = batch('frozen-car-crystal',new THREE.IcosahedronGeometry(2.7,1),standard(0xa6ecff,{
    roughness:.15,metalness:.1,emissive:0x229cce,emissiveIntensity:.55,transparent:true,opacity:.28,depthWrite:false
  }),limits.cars);
  const freezeEdges = batch('frozen-car-edges',new THREE.IcosahedronGeometry(2.74,1),basic(0xc7f8ff,{
    transparent:true,opacity:.8,depthWrite:false,toneMapped:false,wireframe:true
  }),limits.cars);
  const repairHalo = batch('repair-energy',new THREE.TorusGeometry(1.45,.09,6,32).rotateX(Math.PI/2),
    basic(0x67ffb0,{transparent:true,opacity:.8,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  const launchPlume = batch('launch-vertical-plume',new THREE.ConeGeometry(.8,7,12).translate(0,-3.5,0),
    basic(0x52efda,{transparent:true,opacity:.65,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  const launchCore = batch('launch-hot-core',new THREE.ConeGeometry(.4,5,10).translate(0,-2.5,0),
    basic(0xdcfff7,{transparent:true,opacity:.9,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);

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
  const flameGeometry = new THREE.ConeGeometry(.56, 5.2, 9).rotateX(-Math.PI / 2).translate(0, 0, -2.6);
  const flameOuter = batch('boost-jet', flameGeometry, basic(0xffffff, {
    transparent: true, opacity: .82, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending
  }), limits.flames);
  const flameCore = batch('boost-hot-core', flameGeometry.clone(), basic(0xc8ffff, {
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
      const burstColor = {boost:0x42ffe3,launch:0xb68aff,rocket:0x36edbe,repair:0x74ef9a,shield:0x5bbcff,freeze:0xb8f5ff,shockwave:0xe892ff}[kind] || 0xffe59b;
      particle(sparks, position, offset, explosion ? (i % 3 ? 0xffc261 : 0xff693c) : burstColor,
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
      const car = cars.find(car => car.id === event.carId);
      if (event.type === 'item-pickup' && itemTypes.includes(event.itemType) && event.carId != null) {
        if (!indicators.has(event.carId) && indicators.size >= limits.cars) indicators.delete(indicators.keys().next().value);
        indicators.set(event.carId, { type: event.itemType, until: clock + 2.1 });
      }
      if (!['item-pickup', 'banana-hit', 'bomb-explode', 'boost', 'launch-activate', 'rocket-activate', 'shield-activate',
        'missile-launch', 'missile-hit', 'shockwave-launch', 'shockwave-hit', 'freeze-launch', 'freeze-hit',
        'repair', 'launch-land', 'shield-block'].includes(event.type)) continue;
      const groundEvent = ['bomb-explode','missile-hit','shockwave-hit','freeze-hit','launch-land'].includes(event.type);
      frame({ distance: event.distance ?? car?.distance, lateral: event.lateral ?? car?.lateral }, .65 + (groundEvent ? 0 : Math.max(0,finite(car?.flightHeight))));
      // event coordinates refer to the impact location, not the current shooter.
      if (event.position && typeof event.position === 'object') {
        point.set(finite(event.position.x, point.x), finite(event.position.y, point.y), finite(event.position.z, point.z));
      }
      const kind = event.type === 'bomb-explode' || event.type === 'missile-hit' ? 'explosion'
        : event.type === 'item-pickup' ? event.itemType
          : event.type.startsWith('shield') ? 'shield' : event.type.split('-')[0];
      spray(point, kind, event.radius ?? (event.type === 'missile-hit' ? 2.8 : 1));
    }
  }

  function update(dt = 0, state = {}, { cars = state.cars || [], camera = null } = {}) {
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
      // Live bombs use the exact physics bounce height and remain visible until
      // that projectile is removed. The age arc is for legacy states only.
      const age = Math.max(0, finite(bomb.age));
      const toss = finite(bomb.height, finite(bomb.bounceHeight, age < .65 ? Math.sin(Math.PI * age / .65) * 2.2 : 0));
      frame(bomb, finite(bomb.height, .75 + toss));
      dummy.rotation.y += finite(bomb.heading);
      stamp(bombWake, n);
      frame(bomb, finite(bomb.height, .75 + toss));
      dummy.rotation.y += finite(bomb.heading) + age * 2.6;
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
        offset.copy(tangent).multiplyScalar(-2.5);offset.y=.3;
        particle(trails,point,offset,0xffb66c,.34,.14,.7);
      }
      n++;
    }
    count([bombBody, bombCollar, bombFuse, bombEmber, bombWake], n);

    n = 0;
    for (const missile of source.projectiles || []) {
      if (missile.type !== 'missile' || missile.active === false || n >= limits.missiles) continue;
      frame(missile, Math.max(0,finite(missile.height,1.1)));
      dummy.rotation.y += finite(missile.heading);
      stamp(missileBody,n);stamp(missileFins,n);
      dummy.scale.set(1,1,1+.15*Math.sin(clock*49+n));stamp(missileJet,n);
      if(emitTrail){offset.copy(tangent).multiplyScalar(-4);particle(trails,point,offset,0xffb08b,.35,.15,.6);}
      n++;
    }
    count([missileBody,missileFins,missileJet],n);
    n=0;
    for(const wave of source.waves || []){
      if(!['shockwave','freeze'].includes(wave.type) || wave.active===false || n>=limits.waves)continue;
      frame(wave,.14);dummy.scale.set(clamp(wave.radius,1,8),1,1.4);
      stamp(waveArc,n);stamp(waveWall,n);
      color.setHex(wave.type==='freeze'?0x8be7ff:0xe58aff);waveArc.setColorAt(n,color);waveWall.setColorAt(n,color);
      if(emitTrail){offset.copy(tangent).multiplyScalar(-1);offset.y=.8;particle(sparks,point,offset,wave.type==='freeze'?0xbdf8ff:0xeb9dff,.4,.1,1);}
      n++;
    }
    count([waveArc,waveWall],n);
    if(waveArc.instanceColor)waveArc.instanceColor.needsUpdate=true;
    if(waveWall.instanceColor)waveWall.instanceColor.needsUpdate=true;

    n = 0;
    for (const car of cars.slice(0, 60)) {
      const rocket=finite(car.rocketRemaining)>0;
      if (car.finished || (finite(car.boost) <= 0 && !rocket)) continue;
      frame(car, .4 + Math.max(0,finite(car.flightHeight)));
      heading.copy(tangent).applyAxisAngle(UP, finite(car.heading));
      const yaw = Math.atan2(heading.x, heading.z);
      right.set(heading.z, 0, -heading.x).normalize();
      const pulse = 1 + .2 * Math.sin(clock * 41 + n * 1.4);
      for (const side of [-1, 1]) {
        dummy.position.copy(point).addScaledVector(heading, -2.15).addScaledVector(right, side * .58);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(rocket?1.35:1, rocket?1.05:.8, pulse*(rocket?2.05:1));
        stamp(flameOuter, n);
        color.setHex(side === -1 ? 0x18ffad : 0x21bfff);
        flameOuter.setColorAt(n, color);
        dummy.scale.set(rocket ? .72 : .54, rocket ? .6 : .45, pulse*(rocket ? 1.4 : .65));
        stamp(flameCore, n);
        if (emitTrail) {
          offset.copy(heading).multiplyScalar(-3);
          offset.y += .14;
          particle(trails, dummy.position, offset, side === -1 ? 0x37f6ba : 0x77eaff, rocket ? .42 : .3, rocket ? .24 : .18, .7);
        }
        n++;
      }
    }
    count([flameOuter, flameCore], n);
    if (flameOuter.instanceColor) flameOuter.instanceColor.needsUpdate = true;
    let shieldN=0,freezeN=0,repairN=0,launchN=0,labelN=0;
    for(const car of cars.slice(0,limits.cars)){
      const height=Math.max(0,finite(car.flightHeight));
      const indicator=indicators.get(car.id);
      if(finite(car.shieldRemaining)>0 && !car.finished){
        frame(car,1.15+height);dummy.scale.set(1,.78,1.08);
        stamp(shieldBubble,shieldN);dummy.rotation.y+=clock*.5;stamp(shieldRim,shieldN);shieldN++;
      }
      if(finite(car.freezeRemaining)>0 && !car.finished){
        frame(car,1.1+height);dummy.scale.set(1,.67,1.06);stamp(freezeShell,freezeN);stamp(freezeEdges,freezeN);freezeN++;
      }
      if(indicator?.type==='repair' && indicator.until>clock){
        frame(car,.35+height+Math.sin(clock*5)*.12);stamp(repairHalo,repairN);repairN++;
      }
      if(finite(car.flightRemaining)>0 && height>.1 && finite(car.flightRemaining)>finite(car.flightDuration)*.46 && !car.finished){
        frame(car,height+.3);const pulse=1+.15*Math.sin(clock*43+launchN);dummy.scale.set(pulse,Math.min(1.6,Math.max(.3,height/6)),pulse);
        stamp(launchPlume,launchN);stamp(launchCore,launchN);launchN++;
        if(emitTrail){offset.set(0,-4,0);particle(trails,point,offset,0x76ffdb,.55,.35,2);}
      }
      let type=indicator?.type || (itemTypes.includes(car.activeItem)?car.activeItem:null);
      const remaining={launch:car.flightRemaining,rocket:car.rocketRemaining,boost:car.boost,shield:car.shieldRemaining,freeze:car.freezeRemaining}[type];
      if(indicator && indicator.until<=clock && finite(remaining)<=0){indicators.delete(car.id);type=itemTypes.includes(car.activeItem)?car.activeItem:null;}
      const typeIndex=itemTypes.indexOf(type);
      if(typeIndex>=0){
        frame(car,5.4+height);
        if(camera?.quaternion)dummy.quaternion.copy(camera.quaternion);
        else dummy.rotation.set(0,Math.PI,0);
        const pop=indicator?1+Math.max(0,indicator.until-clock-1.8)*.55:1;dummy.scale.setScalar(pop);
        stamp(itemCards,labelN);labelUV.setXY(labelN,typeIndex%2,4-Math.floor(typeIndex/2));labelN++;
      }
    }
    for(const [id,value]of indicators)if(value.until<=clock&&!cars.some(car=>car.id===id))indicators.delete(id);
    count([shieldBubble,shieldRim],shieldN);count([freezeShell,freezeEdges],freezeN);count([repairHalo],repairN);
    count([launchPlume,launchCore],launchN);count([itemCards],labelN);labelUV.needsUpdate=true;
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
    clock = 0; burstSerial = 0; lastTime = null; shockCursor = 0; emissionTime = 0; indicators.clear();
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
    for (const texture of textures) texture.dispose();
    group.clear(); geometries.clear(); materials.clear(); textures.clear();
  }
  return { group, update, handleEvents, reset, dispose, limits };
}
