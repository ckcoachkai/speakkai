import * as THREE from 'three';

/** Event-driven, stylized liquid effects. Owns no actors, animation or outcomes. */
export function createBloodEffects({ scene, room = {}, quality = 'high' } = {}) {
  if (!scene?.add) throw new TypeError('Blood effects require a Three.js scene.');
  const high = quality !== 'low';
  const floorY = Number.isFinite(room.floorY) ? room.floorY : 0;
  const halfWidth = Number.isFinite(room.halfWidth) ? Math.max(0.5, room.halfWidth) : 7;
  const halfDepth = Number.isFinite(room.halfDepth) ? Math.max(0.5, room.halfDepth) : 6;
  const group = new THREE.Group();
  group.name = 'stylized-blood-effects';
  scene.add(group);
  const budgets = { jets: high ? 48 : 24, segments: 14, droplets: high ? 384 : 192,
    pieces: high ? 72 : 36, puffs: high ? 96 : 48, pools: high ? 64 : 40 };
  const jets = Array.from({ length: budgets.jets }, () => ({ active: false }));
  const droplets = Array.from({ length: budgets.droplets }, () => ({ active: false }));
  const pieces = Array.from({ length: budgets.pieces }, () => ({ active: false }));
  const puffs = Array.from({ length: budgets.puffs }, () => ({ active: false }));
  const pools = Array.from({ length: budgets.pools }, () => ({ active: false }));
  const cursors = { jets: 0, droplets: 0, pieces: 0, puffs: 0 };
  const lastActorEmit = new Map();
  const actorActivity = new Map();
  const tmp = new THREE.Object3D();
  const velocity = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  let enabled = true, disposed = false, clock = 0, poolClock = 0, poolDirty = false;
  let emittedEvents = 0, rejectedInvincible = 0, droppedEvents = 0, recycledParticles = 0, area = 0, serial = 0;
  let seed = 0x74b8c31;
  const random = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const liquidMaterial = new THREE.MeshPhysicalMaterial({ color: 0xaf061c, roughness: 0.21,
    metalness: 0.02, clearcoat: 1, clearcoatRoughness: 0.07 });
  const pieceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.34, metalness: 0.01,
    clearcoat: 0.78, clearcoatRoughness: 0.16 });
  const jetSides = 8;
  const jetVertices = (budgets.segments + 1) * (jetSides + 1);
  const jetPositions = new Float32Array(budgets.jets * jetVertices * 3);
  const jetNormals = new Float32Array(jetPositions.length);
  const jetIndices = [];
  for (let jet = 0; jet < budgets.jets; jet++) for (let ring = 0; ring < budgets.segments; ring++) for (let side = 0; side < jetSides; side++) {
    const a = jet * jetVertices + ring * (jetSides + 1) + side;
    const b = a + jetSides + 1;
    jetIndices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const jetGeometry = new THREE.BufferGeometry();
  jetGeometry.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3).setUsage(THREE.DynamicDrawUsage));
  jetGeometry.setAttribute('normal', new THREE.BufferAttribute(jetNormals, 3).setUsage(THREE.DynamicDrawUsage));
  jetGeometry.setIndex(jetIndices);
  const jetMesh = new THREE.Mesh(jetGeometry, liquidMaterial);
  const dropMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), liquidMaterial, budgets.droplets);
  const pieceGeometry = new THREE.SphereGeometry(1, high ? 16 : 12, high ? 12 : 8);
  const piecePositions = pieceGeometry.attributes.position;
  for (let i = 0; i < piecePositions.count; i++) {
    const x = piecePositions.getX(i), y = piecePositions.getY(i), z = piecePositions.getZ(i);
    const irregularity = 1 + 0.12 * Math.sin(x * 5.1 + z * 3.8) * Math.cos(y * 4.7);
    piecePositions.setXYZ(i, x * irregularity, y * irregularity, z * irregularity);
  }
  pieceGeometry.computeVertexNormals();
  const pieceMesh = new THREE.InstancedMesh(pieceGeometry, pieceMaterial, budgets.pieces);
  jetMesh.name = 'blood-arc-segments'; dropMesh.name = 'blood-spray-droplets'; pieceMesh.name = 'soft-stylized-fragments';
  for (const mesh of [jetMesh, dropMesh, pieceMesh]) {
    if (mesh.isInstancedMesh) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  pieceMesh.castShadow = true;
  pieceMesh.receiveShadow = true;
  for (let i = 0; i < budgets.pieces; i++) {
    tint.setHex([0x8b2b39, 0xaf4c4b, 0x933849, 0xc16a66, 0x78212e][i % 5]);
    pieceMesh.setColorAt(i, tint);
  }

  const puffPositions = new Float32Array(budgets.puffs * 3);
  const puffSizes = new Float32Array(budgets.puffs);
  const puffOpacity = new Float32Array(budgets.puffs);
  const puffGeometry = new THREE.BufferGeometry();
  puffGeometry.setAttribute('position', new THREE.BufferAttribute(puffPositions, 3).setUsage(THREE.DynamicDrawUsage));
  puffGeometry.setAttribute('aSize', new THREE.BufferAttribute(puffSizes, 1).setUsage(THREE.DynamicDrawUsage));
  puffGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(puffOpacity, 1).setUsage(THREE.DynamicDrawUsage));
  const puffMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { pixelScale: { value: 500 } },
    vertexShader: `attribute float aSize; attribute float aOpacity; uniform float pixelScale; varying float alpha;
      void main(){vec4 v=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*v;
      gl_PointSize=clamp(aSize*pixelScale*projectionMatrix[1][1]/max(1.0,-v.z),1.0,160.0);alpha=aOpacity;}`,
    fragmentShader: `varying float alpha;void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);
      float cloud=1.0-smoothstep(.1,1.0,r);float noise=.82+.18*sin(p.x*13.0+sin(p.y*9.0)*2.0);
      gl_FragColor=vec4(.58,.018,.045,cloud*cloud*noise*alpha);if(gl_FragColor.a<.003)discard;}`,
  });
  const puffMesh = new THREE.Points(puffGeometry, puffMaterial);
  const viewport = new THREE.Vector2();
  puffMesh.name = 'blood-impact-puffs'; puffMesh.frustumCulled = false;
  puffMesh.onBeforeRender = renderer => { renderer.getDrawingBufferSize(viewport); puffMaterial.uniforms.pixelScale.value = viewport.y * 0.5; };
  group.add(puffMesh);

  // All puddles are rasterized into one liquid surface. Overlapping splashes
  // merge into the same coverage/height field, never stacked coplanar decals.
  const textureW = high ? 768 : 320;
  const textureH = Math.round(textureW * halfDepth / halfWidth);
  const stampSize = 128, stampExtent = 1.18;
  const poolStamps = Array.from({ length: 8 }, (_, variation) => {
    const stamp = new Float32Array(stampSize * stampSize);
    for (let y = 0; y < stampSize; y++) for (let x = 0; x < stampSize; x++) {
      const dx = (x / (stampSize - 1) * 2 - 1) * stampExtent;
      const dy = (y / (stampSize - 1) * 2 - 1) * stampExtent;
      const distance = Math.hypot(dx, dy), angle = Math.atan2(dy, dx), phase = variation * 2.417;
      const rim = 1 + Math.sin(angle * 5 + phase) * 0.07 + Math.sin(angle * 9 - phase) * 0.035;
      stamp[y * stampSize + x] = distance < rim ? smooth((rim - distance) * 9) * (0.82 + 0.24 * (1 - distance)) : 0;
    }
    return stamp;
  });
  const density = new Float32Array(textureW * textureH);
  const colorData = new Uint8Array(textureW * textureH * 4);
  const heightData = new Uint8Array(textureW * textureH * 4);
  const roughnessData = new Uint8Array(textureW * textureH * 4);
  const poolGrain = new Float32Array(textureW * textureH);
  for (let i = 0; i < poolGrain.length; i++) poolGrain[i] = Math.sin((i % textureW) * 1.71 + Math.floor(i / textureW) * 2.93) * 0.5 + 0.5;
  const poolTexture = new THREE.DataTexture(colorData, textureW, textureH, THREE.RGBAFormat);
  const poolHeight = new THREE.DataTexture(heightData, textureW, textureH, THREE.RGBAFormat);
  const poolRoughness = new THREE.DataTexture(roughnessData, textureW, textureH, THREE.RGBAFormat);
  for (const texture of [poolTexture, poolHeight, poolRoughness]) {
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; texture.needsUpdate = true;
  }
  poolTexture.colorSpace = THREE.SRGBColorSpace;
  const poolMaterial = new THREE.MeshPhysicalMaterial({ color: 0x900c20, map: poolTexture,
    bumpMap: poolHeight, bumpScale: 0.012, roughnessMap: poolRoughness, roughness: 0.95, metalness: 0.01,
    clearcoat: 1, clearcoatRoughness: 0.055, transparent: true, depthWrite: false, alphaTest: 0.02 });
  const poolMesh = new THREE.Mesh(new THREE.PlaneGeometry(halfWidth * 2, halfDepth * 2), poolMaterial);
  poolMesh.rotation.x = -Math.PI / 2;
  poolMesh.position.y = floorY + 0.022;
  poolMesh.name = 'merged-wet-blood-pools'; poolMesh.receiveShadow = true;
  group.add(poolMesh);

  function acquire(array, key, owner = 'environment') {
    const start = cursors[key];
    let ownOldest = null, oldest = null, ownCount = 0;
    for (let n = 0; n < array.length; n++) {
      const index = (start + n) % array.length;
      const item = array[index];
      if (!item.active) {
        cursors[key] = (index + 1) % array.length;
        item.owner = owner; item.serial = ++serial;
        return item;
      }
      if (!oldest || item.serial < oldest.serial) oldest = item;
      if (item.owner === owner) {
        ownCount++;
        if (!ownOldest || item.serial < ownOldest.serial) ownOldest = item;
      }
    }
    // At saturation an actor first replaces its own oldest effect. A late
    // actor can still enter; one spectacular hit cannot erase the whole class.
    const share = Math.max(1, Math.floor(array.length / Math.max(1, actorActivity.size)));
    const item = ownCount >= share && ownOldest ? ownOldest : oldest;
    cursors[key] = (start + 1) % array.length;
    recycledParticles++;
    item.owner = owner; item.serial = ++serial;
    return item;
  }
  function addPool(x, z, amount, stretch = 1, angle = 0) {
    if (!enabled || amount <= 0) return;
    x = clamp(x, -halfWidth + 0.12, halfWidth - 0.12);
    z = clamp(z, -halfDepth + 0.12, halfDepth - 0.12);
    let target = null, nearest = Infinity, empty = null, smallest = pools[0];
    for (const pool of pools) {
      if (!pool.active) { empty ||= pool; continue; }
      const distance = Math.hypot(x - pool.x, z - pool.z);
      if (distance < Math.max(0.12, pool.radius * 0.78) && distance < nearest) { nearest = distance; target = pool; }
      if (!smallest.active || pool.amount < smallest.amount) smallest = pool;
    }
    if (!target) {
      target = empty || smallest;
      Object.assign(target, { active: true, x, z, amount: 0, radius: 0.018, angle: angle || random() * Math.PI,
        stretch: stretch * (0.92 + random() * 0.16), stamp: Math.floor(random() * poolStamps.length), age: 0 });
    }
    target.amount = Math.min(14, target.amount + amount);
    target.goal = Math.min(2.7, 0.045 + Math.sqrt(target.amount) * 0.65);
    target.age = 0;
    poolDirty = true;
  }
  function paintPools() {
    density.fill(0);
    for (const pool of pools) {
      if (!pool.active) continue;
      const radius = pool.radius;
      const radiusX = radius * pool.stretch, radiusZ = radius / pool.stretch;
      const limit = Math.max(radiusX, radiusZ) * 1.18;
      const minX = clamp(Math.floor((pool.x - limit + halfWidth) / (2 * halfWidth) * textureW), 0, textureW - 1);
      const maxX = clamp(Math.ceil((pool.x + limit + halfWidth) / (2 * halfWidth) * textureW), 0, textureW - 1);
      const minZ = clamp(Math.floor((halfDepth - pool.z - limit) / (2 * halfDepth) * textureH), 0, textureH - 1);
      const maxZ = clamp(Math.ceil((halfDepth - pool.z + limit) / (2 * halfDepth) * textureH), 0, textureH - 1);
      const cosine = Math.cos(pool.angle), sine = Math.sin(pool.angle);
      const stamp = poolStamps[pool.stamp], stampScale = (stampSize - 1) / (stampExtent * 2);
      const inverseX = 1 / Math.max(0.02, radiusX), inverseZ = 1 / Math.max(0.02, radiusZ);
      for (let py = minZ; py <= maxZ; py++) for (let px = minX; px <= maxX; px++) {
        const dx = ((px + 0.5) / textureW) * halfWidth * 2 - halfWidth - pool.x;
        const dz = halfDepth - ((py + 0.5) / textureH) * halfDepth * 2 - pool.z;
        const sx = ((dx * cosine + dz * sine) * inverseX + stampExtent) * stampScale;
        const sz = ((-dx * sine + dz * cosine) * inverseZ + stampExtent) * stampScale;
        if (sx < 0 || sz < 0 || sx >= stampSize - 1 || sz >= stampSize - 1) continue;
        // Cached organic kernels remove expensive per-pixel trigonometry from
        // the live pool pass; bilinear sampling keeps close-up edges smooth.
        const ix = Math.floor(sx), iz = Math.floor(sz), fx = sx - ix, fz = sz - iz, at = iz * stampSize + ix;
        const upper = stamp[at] + (stamp[at + 1] - stamp[at]) * fx;
        const lower = stamp[at + stampSize] + (stamp[at + stampSize + 1] - stamp[at + stampSize]) * fx;
        density[py * textureW + px] += upper + (lower - upper) * fz;
      }
    }
    let coverage = 0;
    for (let i = 0; i < density.length; i++) {
      const d = density[i]; const at = i * 4;
      const alpha = smooth(d * 1.25);
      if (d <= 0) {
        colorData[at + 3] = 0;
        heightData[at] = heightData[at + 1] = heightData[at + 2] = 0;
        continue;
      }
      const grain = poolGrain[i];
      const thick = clamp(d * 0.65, 0, 1);
      colorData[at] = 166 - thick * 79;
      colorData[at + 1] = 4 + thick * 3;
      colorData[at + 2] = 20 - thick * 8;
      colorData[at + 3] = alpha * 252;
      heightData[at] = heightData[at + 1] = heightData[at + 2] = Math.min(255, d * (103 + grain * 3));
      heightData[at + 3] = 255;
      // A thick glossy center and a tackier rim read as liquid in grazing light.
      roughnessData[at] = roughnessData[at + 1] = roughnessData[at + 2] = 52 + (1 - thick) * 62 + grain * 6;
      roughnessData[at + 3] = 255;
      coverage += alpha;
    }
    area = coverage / density.length * halfWidth * halfDepth * 4;
    poolTexture.needsUpdate = poolHeight.needsUpdate = poolRoughness.needsUpdate = true;
    poolDirty = false;
  }
  function puffAt(x, y, z, intensity, count = 6, owner = 'environment') {
    for (let i = 0; i < count; i++) {
      const p = acquire(puffs, 'puffs', owner);
      Object.assign(p, { active: true, x, y, z, vx: (random() - 0.5) * 1.6, vy: random() * 1.4,
        vz: (random() - 0.5) * 1.6, age: 0, life: 0.23 + random() * 0.24, size: (0.24 + random() * 0.23) * intensity });
    }
  }
  function floorFlight(x, y, z, vx, vy, vz) {
    const floorTime = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0, y - floorY - 0.05))) / 9.8;
    let time = Math.max(0.03, floorTime);
    if (vx > 0.001) time = Math.min(time, Math.max(0.03, (halfWidth - 0.1 - x) / vx));
    else if (vx < -0.001) time = Math.min(time, Math.max(0.03, (-halfWidth + 0.1 - x) / vx));
    if (vz > 0.001) time = Math.min(time, Math.max(0.03, (halfDepth - 0.1 - z) / vz));
    else if (vz < -0.001) time = Math.min(time, Math.max(0.03, (-halfDepth + 0.1 - z) / vz));
    return time;
  }
  function emit(type, payload = {}) {
    if (disposed || !enabled) return false;
    if (payload.invincible) { rejectedInvincible++; return false; }
    if (!['bite', 'impact', 'crush', 'splatter'].includes(type)) { droppedEvents++; return false; }
    const position = payload.position;
    if (!position || position.length !== 3 || !position.every(Number.isFinite)) { droppedEvents++; return false; }
    const actorKey = payload.actorId == null ? null : `${payload.actorId}:${type}`;
    if (actorKey && clock - (lastActorEmit.get(actorKey) ?? -100) < 0.065) { droppedEvents++; return false; }
    if (actorKey) {
      if (lastActorEmit.size > 48) lastActorEmit.clear();
      lastActorEmit.set(actorKey, clock);
    }
    const owner = String(payload.actorId ?? 'environment');
    if (!actorActivity.has(owner) && actorActivity.size >= 24) actorActivity.delete(actorActivity.keys().next().value);
    actorActivity.set(owner, clock);
    emittedEvents++;
    const intensity = clamp(Number.isFinite(payload.intensity) ? payload.intensity : 1, 0.12, 3);
    const stage = payload.stage || payload.injuryStage || (Number.isFinite(payload.ratio)
      ? payload.ratio <= 0 ? 'dead' : payload.ratio < 0.25 ? 'critical' : payload.ratio < 0.55 ? 'wounded' : 'hurt'
      : type === 'bite' ? 'hurt' : 'wounded');
    const severity = ({ healthy: 0.16, hurt: 0.26, wounded: 0.6, critical: 1, dead: 1.15 })[stage] ?? 0.26;
    const arterial = Boolean(payload.fatal || ((payload.selected || payload.isSelected) && ['critical', 'dead'].includes(stage)));
    const force = Math.sqrt(intensity) * (arterial ? 1 : 0.32 + severity * 0.43);
    const x = clamp(position[0], -halfWidth + 0.12, halfWidth - 0.12);
    const y = clamp(position[1], floorY + 0.08, floorY + 4.5);
    const z = clamp(position[2], -halfDepth + 0.12, halfDepth - 0.12);
    const direction = payload.direction;
    velocity.set(Number.isFinite(direction?.[0]) ? direction[0] : 0,
      Number.isFinite(direction?.[1]) ? direction[1] : 0.7,
      Number.isFinite(direction?.[2]) ? direction[2] : 0.65);
    if (!Number.isFinite(velocity.lengthSq()) || velocity.lengthSq() < 0.001) velocity.set(0, 0.7, 0.65);
    velocity.normalize();
    const dx = velocity.x, dy = velocity.y, dz = velocity.z;
    const jetCount = arterial ? Math.min(6, Math.max(2, Math.round(intensity * (type === 'crush' ? 3 : 2))))
      : severity >= 0.6 ? 1 : 0;
    for (let i = 0; i < jetCount; i++) {
      const jet = acquire(jets, 'jets', owner);
      const speed = arterial ? 3.4 + intensity * 0.85 + random() : 0.65 + force * 1.2;
      const turn = (i - (jetCount - 1) / 2) * 0.36 + (random() - 0.5) * 0.18;
      const vx = (dx * Math.cos(turn) - dz * Math.sin(turn)) * speed + (random() - 0.5) * 0.4;
      const vz = (dx * Math.sin(turn) + dz * Math.cos(turn)) * speed + (random() - 0.5) * 0.4;
      const vy = arterial ? Math.min(7.2, Math.max(2.6, dy * speed + 1.8 + random())) : 0.3 + dy * speed * 0.45;
      Object.assign(jet, { active: true, kind: 'arc', x, y, z, vx, vy, vz, age: 0,
        duration: arterial ? 0.2 + intensity * 0.08 : 0.11 + severity * 0.08,
        radius: arterial ? 0.025 + intensity * 0.016 : 0.009 + severity * 0.008,
        hit: floorFlight(x, y, z, vx, vy, vz), impacted: false, amount: (arterial ? 0.22 : 0.018) * intensity });
    }
    const sprayCount = Math.min(50, Math.max(3, Math.round((arterial ? 22 : 4 + severity * 10) * Math.sqrt(intensity))));
    for (let i = 0; i < sprayCount; i++) {
      const p = acquire(droplets, 'droplets', owner);
      const spread = (type === 'crush' ? 4 : 2.8) * force;
      Object.assign(p, { active: true, x, y, z, vx: dx * force * 1.7 + (random() - 0.5) * spread,
        vy: (0.5 + Math.max(0, dy) * 1.8 + random() * 2.9) * force, vz: dz * force * 1.7 + (random() - 0.5) * spread,
        radius: (0.013 + random() * 0.026) * (0.7 + severity * 0.7), age: 0, life: 1.7 + random() * 0.5,
        amount: (arterial ? 0.01 : 0.0025) * intensity, stuck: false, wall: null });
    }
    // Tiny early bites leave drops/marks; visible soft fragments are reserved
    // for serious wounds and impacts, so 32 classroom bites/second stay clear.
    const pieceCount = severity >= 0.6 ? Math.min(9, Math.max(1, Math.round((arterial ? type === 'crush' ? 5 : 3 : 1) * intensity))) : 0;
    for (let i = 0; i < pieceCount; i++) {
      const p = acquire(pieces, 'pieces', owner);
      Object.assign(p, { active: true, x, y, z, vx: (dx * 1.2 + (random() - 0.5) * 2.3) * force,
        vy: (1 + random() * 2.4) * force, vz: (dz * 1.2 + (random() - 0.5) * 2.3) * force,
        radius: (0.033 + random() * 0.045) * Math.sqrt(intensity), age: 0, life: 4.4 + random() * 1.8,
        spinX: (random() - 0.5) * 8, spinY: (random() - 0.5) * 8, spinZ: (random() - 0.5) * 8,
        rx: random() * 0.8, ry: random() * 6, rz: random() * 0.8,
        compression: 0, compressionV: 0, stretchY: 1, bounces: 0, settled: false, bleedClock: 0 });
    }
    puffAt(x, y, z, (0.25 + severity * 0.35) * Math.sqrt(intensity), arterial ? 6 : 2, owner);
    addPool(x, z, (arterial ? 0.12 : 0.003 + severity * 0.012) * intensity);
    return true;
  }

  function hideInstance(mesh, index) {
    tmp.position.set(0, floorY - 20, 0); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(0); tmp.updateMatrix();
    mesh.setMatrixAt(index, tmp.matrix);
  }
  function update(dt, state = {}) {
    if (disposed || !enabled) return;
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    if (dt === 0 || state.paused || state.phase === 'paused') return;
    clock += dt; poolClock += dt;
    for (const [actor, lastSeen] of actorActivity) if (clock - lastSeen > 4) actorActivity.delete(actor);
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      if (j.active) {
        j.age += dt;
        if (j.kind === 'tether') {
          if (j.age > j.duration || !j.piece.active || j.piece.serial !== j.pieceSerial) j.active = false;
        } else if (!j.impacted && j.age >= j.hit) {
          j.impacted = true;
          const hitX = j.x + j.vx * j.hit, hitZ = j.z + j.vz * j.hit;
          addPool(hitX, hitZ, j.amount, 1.32, Math.atan2(j.vz, j.vx));
          puffAt(hitX, Math.max(floorY + 0.06, j.y + j.vy * j.hit - 4.9 * j.hit * j.hit), hitZ, 0.28, 2, j.owner);
          // A low wet impact crown, not another upward fountain.
          for (let n = 0; n < 3; n++) {
            const p = acquire(droplets, 'droplets', j.owner), turn = random() * Math.PI * 2;
            Object.assign(p, { active: true, x: hitX, y: floorY + 0.07, z: hitZ,
              vx: Math.sin(turn) * 0.65, vy: 0.45 + random() * 0.45, vz: Math.cos(turn) * 0.65,
              radius: j.radius * 0.55, age: 0, life: 0.5, amount: j.amount * 0.035, stuck: false, wall: null });
          }
        }
        if (j.kind !== 'tether' && j.age > j.hit + j.duration) j.active = false;
      }
      const tether = j.kind === 'tether';
      const start = j.active && !tether ? Math.max(0, j.age - j.duration) : 0;
      const end = j.active ? tether ? 1 : Math.min(j.hit, j.age) : 0;
      const vertexOffset = i * jetVertices * 3;
      if (!j.active || end <= start + 0.001) {
        jetPositions.fill(0, vertexOffset, vertexOffset + jetVertices * 3);
        continue;
      }
      // A continuous swept tube follows the ballistic arc. Shared rings avoid
      // the end caps and seams that would make liquid look like linked pipes.
      const arcVX = tether ? j.piece.x - j.x : j.vx;
      const arcVZ = tether ? j.piece.z - j.z : j.vz;
      const horizontal = Math.max(0.0001, Math.hypot(arcVX, arcVZ));
      const sideX = horizontal > 0.0001 ? -arcVZ / horizontal : 1;
      const sideZ = horizontal > 0.0001 ? arcVX / horizontal : 0;
      for (let ring = 0; ring <= budgets.segments; ring++) {
        const fraction = ring / budgets.segments;
        const t = start + (end - start) * fraction;
        const px = j.x + arcVX * t, pz = j.z + arcVZ * t;
        const py = tether ? Math.max(floorY + 0.04, j.y + (j.piece.y - j.y) * t - Math.sin(t * Math.PI) * 0.07)
          : j.y + j.vy * t - 4.9 * t * t;
        const ty = tether ? j.piece.y - j.y - Math.cos(t * Math.PI) * 0.07 * Math.PI : j.vy - 9.8 * t;
        const tangentLength = Math.max(0.0001, Math.hypot(arcVX, ty, arcVZ));
        const binX = -sideZ * ty / tangentLength;
        const binY = (sideZ * arcVX - sideX * arcVZ) / tangentLength;
        const binZ = sideX * ty / tangentLength;
        const taper = tether ? 0.2 + Math.pow(Math.abs(2 * fraction - 1), 2) * 0.8
          : Math.pow(Math.max(0, Math.sin(Math.PI * fraction)), 0.38);
        const radius = j.radius * taper * (tether ? Math.max(0.05, 1 - j.age / j.duration)
          : 0.85 + Math.sin(t * 25 + i) * 0.15);
        for (let side = 0; side <= jetSides; side++) {
          const angle = side / jetSides * Math.PI * 2;
          const cosine = Math.cos(angle), sine = Math.sin(angle);
          const nx = sideX * cosine + binX * sine, ny = binY * sine, nz = sideZ * cosine + binZ * sine;
          const at = vertexOffset + (ring * (jetSides + 1) + side) * 3;
          jetPositions[at] = px + nx * radius; jetPositions[at + 1] = py + ny * radius; jetPositions[at + 2] = pz + nz * radius;
          jetNormals[at] = nx; jetNormals[at + 1] = ny; jetNormals[at + 2] = nz;
        }
      }
    }
    for (let i = 0; i < droplets.length; i++) {
      const p = droplets[i];
      if (!p.active) { hideInstance(dropMesh, i); continue; }
      p.age += dt;
      const drag = Math.exp(-dt * (p.stuck ? 12 : 0.65));
      p.vx *= drag; p.vz *= drag;
      p.vy = p.stuck ? Math.max(-0.22, p.vy - 0.28 * dt) : p.vy - 9.8 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (Math.abs(p.x) > halfWidth - 0.08) {
        p.x = clamp(p.x, -halfWidth + 0.08, halfWidth - 0.08); p.vx = 0; p.vy *= 0.04; p.stuck = true; p.wall = 'x';
      }
      if (Math.abs(p.z) > halfDepth - 0.08) {
        p.z = clamp(p.z, -halfDepth + 0.08, halfDepth - 0.08); p.vz = 0; p.vy *= 0.04; p.stuck = true; p.wall = 'z';
      }
      if (p.y <= floorY + 0.05 || p.age >= p.life) {
        if (p.y <= floorY + 0.05) addPool(p.x, p.z, p.amount, 1.15, Math.atan2(p.vz, p.vx));
        p.active = false; hideInstance(dropMesh, i); continue;
      }
      velocity.set(p.vx, p.vy, p.vz); const speed = velocity.length();
      tmp.position.set(p.x, p.y, p.z);
      tmp.quaternion.setFromUnitVectors(up, velocity.multiplyScalar(1 / Math.max(0.001, speed)));
      const stretch = 1.1 + Math.min(2, speed * 0.2);
      tmp.scale.set(p.radius / Math.sqrt(stretch), p.radius * stretch, p.radius / Math.sqrt(stretch));
      if (p.stuck) {
        tmp.rotation.set(0, 0, 0);
        tmp.scale.set(p.radius * (p.wall === 'x' ? 0.22 : 1.25), p.radius * 2.2, p.radius * (p.wall === 'z' ? 0.22 : 1.25));
      }
      tmp.updateMatrix(); dropMesh.setMatrixAt(i, tmp.matrix);
    }
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (!p.active) { hideInstance(pieceMesh, i); continue; }
      p.age += dt;
      if (p.age >= p.life) { p.active = false; hideInstance(pieceMesh, i); continue; }
      // Substeps keep a real damped soft-body spring stable after a slow frame.
      const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
      for (let step = 0; step < steps; step++) {
        const goal = p.settled ? -0.54 : Math.min(0.2, Math.abs(p.vy) * 0.025);
        p.compressionV += ((goal - p.compression) * 240 - p.compressionV * 25) * h;
        p.compression = clamp(p.compression + p.compressionV * h, -1.05, 0.35);
        p.stretchY = Math.exp(p.compression);
        if (!p.settled) {
          const airDrag = Math.exp(-h * 1.2);
          p.vy -= 10.4 * h; p.vx *= airDrag; p.vz *= airDrag;
          p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
          p.rx += p.spinX * h; p.ry += p.spinY * h; p.rz += p.spinZ * h;
          if (p.y < floorY + 0.024 + p.radius * p.stretchY) {
            const impact = Math.abs(p.vy);
            p.y = floorY + 0.024 + p.radius * p.stretchY;
            p.compression = Math.max(-1.0, -0.35 - impact * 0.11); p.compressionV = -impact * 0.8; p.bounces++;
            p.vy = p.bounces === 1 ? impact * 0.2 : 0;
            p.vx *= 0.38; p.vz *= 0.38;
            p.spinX *= 0.12; p.spinY *= 0.12; p.spinZ *= 0.12;
            addPool(p.x, p.z, 0.018, 1.25, p.ry);
            if (p.bounces === 1 && impact > 1.2) {
              const thread = acquire(jets, 'jets', p.owner);
              Object.assign(thread, { active: true, kind: 'tether', x: p.x - p.vx * 0.12,
                y: floorY + 0.026, z: p.z - p.vz * 0.12, piece: p, pieceSerial: p.serial,
                age: 0, duration: 0.46 + random() * 0.18, radius: 0.025 });
            }
            if (p.bounces >= 2 || p.vy < 0.35) { p.settled = true; p.vy = 0; }
          }
          p.x = clamp(p.x, -halfWidth + 0.12, halfWidth - 0.12); p.z = clamp(p.z, -halfDepth + 0.12, halfDepth - 0.12);
        } else {
          p.y = floorY + 0.023 + p.radius * p.stretchY;
          p.vx *= Math.exp(-h * 18); p.vz *= Math.exp(-h * 18);
          p.x += p.vx * h; p.z += p.vz * h;
        }
        if (p.bounces) {
          // Contact flattens vertically; orientations relax once, never wobble forever.
          p.rx *= Math.exp(-h * 16); p.rz *= Math.exp(-h * 16);
          p.bleedClock += h;
          if (p.bleedClock > 0.2 && p.age < 2.1) { addPool(p.x, p.z, 0.0018); p.bleedClock = 0; }
        }
      }
      const fade = smooth(clamp((p.life - p.age) / 0.65, 0, 1));
      tmp.position.set(p.x, p.y, p.z); tmp.rotation.set(p.rx, p.ry, p.rz);
      const sideScale = 1 / Math.sqrt(p.stretchY);
      // sx * sy * sz = 1 throughout impact/recovery (until deliberate fade).
      tmp.scale.set(p.radius * 1.16 * sideScale * fade, p.radius * p.stretchY * fade,
        p.radius / 1.16 * sideScale * fade);
      tmp.updateMatrix(); pieceMesh.setMatrixAt(i, tmp.matrix);
    }
    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i]; const at = i * 3;
      if (!p.active) { puffOpacity[i] = 0; continue; }
      p.age += dt;
      if (p.age >= p.life) { p.active = false; puffOpacity[i] = 0; continue; }
      puffPositions[at] = p.x + p.vx * p.age;
      puffPositions[at + 1] = p.y + p.vy * p.age;
      puffPositions[at + 2] = p.z + p.vz * p.age;
      puffSizes[i] = p.size * (1 + p.age * 2.8);
      puffOpacity[i] = (1 - p.age / p.life) * 0.64;
    }
    for (const pool of pools) {
      if (!pool.active) continue;
      pool.age += dt;
      const old = pool.radius;
      pool.radius += (pool.goal - pool.radius) * (1 - Math.exp(-dt * 1.55));
      if (Math.abs(pool.radius - old) > 0.0002) poolDirty = true;
    }
    if (poolDirty && poolClock >= 1 / 14) { paintPools(); poolClock = 0; }
    jetGeometry.attributes.position.needsUpdate = jetGeometry.attributes.normal.needsUpdate = true;
    for (const mesh of [dropMesh, pieceMesh]) mesh.instanceMatrix.needsUpdate = true;
    for (const attribute of Object.values(puffGeometry.attributes)) attribute.needsUpdate = true;
  }
  function reset() {
    if (disposed) return;
    for (const array of [jets, droplets, pieces, puffs, pools]) for (const item of array) item.active = false;
    for (const key of Object.keys(cursors)) cursors[key] = 0;
    lastActorEmit.clear(); actorActivity.clear(); density.fill(0); colorData.fill(0); heightData.fill(0); roughnessData.fill(0); puffOpacity.fill(0);
    poolTexture.needsUpdate = poolHeight.needsUpdate = poolRoughness.needsUpdate = true;
    puffGeometry.attributes.aOpacity.needsUpdate = true;
    jetPositions.fill(0); jetNormals.fill(0);
    jetGeometry.attributes.position.needsUpdate = jetGeometry.attributes.normal.needsUpdate = true;
    for (const mesh of [dropMesh, pieceMesh]) {
      for (let i = 0; i < mesh.count; i++) hideInstance(mesh, i);
      mesh.instanceMatrix.needsUpdate = true;
    }
    clock = poolClock = area = emittedEvents = rejectedInvincible = droppedEvents = recycledParticles = serial = 0;
    seed = 0x74b8c31; poolDirty = false;
  }
  function setEnabled(value) {
    if (disposed) return;
    enabled = Boolean(value);
    if (!enabled) reset();
    group.visible = enabled;
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    scene.remove(group);
    const geometries = new Set(), materials = new Set();
    group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
      if (object.isInstancedMesh) object.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    poolTexture.dispose(); poolHeight.dispose(); poolRoughness.dispose(); group.clear();
  }
  reset();
  return { emit, update, reset, setEnabled, dispose,
    get stats() {
      const active = list => list.reduce((count, item) => count + Number(item.active), 0);
      const activeByActor = {};
      for (const list of [jets, droplets, pieces, puffs]) for (const item of list) if (item.active) {
        activeByActor[item.owner] = (activeByActor[item.owner] || 0) + 1;
      }
      return { enabled: enabled && !disposed, disposed, emittedEvents, rejectedInvincible, droppedEvents, recycledParticles,
        activeJets: active(jets), activeDroplets: active(droplets), activePieces: active(pieces), activePuffs: active(puffs),
        activeFilaments: jets.filter(j => j.active && j.kind === 'tether').length,
        settledPieces: pieces.filter(p => p.active && p.settled).length,
        maximumPieceBounces: Math.max(0, ...pieces.filter(p => p.active).map(p => p.bounces)),
        activeByActor, pools: active(pools), pooledArea: area, budgets: { ...budgets } };
    },
  };
}

export default createBloodEffects;
