import * as THREE from 'three';

// The room's permanent floor stays in place. This opaque void covers it, while
// falling steel disappears through its surface like pieces dropping into a shaft.
export default function createScenario(ctx) {
  const { group, actors = [], room = {} } = ctx;
  const floorY = room.floorY || 0;
  const halfWidth = room.halfWidth || 7;
  const halfDepth = room.halfDepth || 6;
  const columns = 7;
  const rows = 6;
  const tileW = (halfWidth * 2) / columns;
  const tileD = (halfDepth * 2) / rows;
  const tiles = [];
  const refuges = [];
  const refugeLeaves = [];
  const actorCommands = new Map();
  const safeAssignments = new Map();
  const reactionUntil = new Map();
  const impactUntil = new Map();
  const footImpacts = new Map();
  const refugeCapacity = Math.max(1, Math.ceil(actors.filter(actor => actor.alive !== false).length / 6));
  const slotColumns = refugeCapacity <= 3 ? 1 : refugeCapacity <= 6 ? 2 : 3;
  const slotRows = Math.ceil(refugeCapacity / slotColumns);
  const slotSpacing = 0.78;
  const finalRefugeW = Math.max(1.45, (slotColumns - 1) * slotSpacing + 0.96);
  const finalRefugeD = Math.max(1.7, (slotRows - 1) * slotSpacing + 0.96);
  const refugeW = finalRefugeW + 0.55;
  const refugeD = finalRefugeD + 0.58;
  // Character movement reserves .38 m inside main's +-6.1 m bounds. Even the
  // outermost crowd slot must remain inside that reachable +-5.72 m interval.
  const refugeX = slotColumns === 3 ? 4.9 : slotColumns === 2 ? 5.25 : 5.35;
  const tmp = new THREE.Object3D();
  const localMatrix = new THREE.Matrix4();
  const combinedMatrix = new THREE.Matrix4();
  let lastRosterSignature = null;
  let lastProgress = -1;
  let previousPhase = null;
  let exposureAccumulator = 0;
  let lateFailure = null;
  let disposed = false;
  let seed = 0x6f327a91;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const steel = new THREE.MeshStandardMaterial({ color: 0x46545b, roughness: 0.77, metalness: 0.82 });
  const frames = new THREE.MeshStandardMaterial({ color: 0x1c282e, roughness: 0.64, metalness: 0.9 });
  const bolts = new THREE.MeshStandardMaterial({ color: 0x879399, roughness: 0.42, metalness: 0.94 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe4ad33, roughness: 0.66, metalness: 0.36 });
  const refugeSteel = new THREE.MeshStandardMaterial({ color: 0x3a484c, roughness: 0.78, metalness: 0.82 });
  const warning = new THREE.MeshStandardMaterial({ color: 0xff5b1b, emissive: 0xf44609, emissiveIntensity: 1.4, roughness: 0.5 });
  const safeLight = new THREE.MeshStandardMaterial({ color: 0x77d4ad, emissive: 0x3aa477, emissiveIntensity: 1, roughness: 0.5 });
  // Fine brushed grain and pitted coating remain fully local and work offline.
  const grainData = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const noise = ((x * 73856093 ^ y * 19349663) >>> 0) % 37;
    const scratch = (y * 11 + x * 3) % 53 === 0 ? 34 : 0;
    const value = 214 + noise - scratch;
    const at = (y * 128 + x) * 4;
    grainData[at] = grainData[at + 1] = grainData[at + 2] = value;
    grainData[at + 3] = 255;
  }
  const steelGrain = new THREE.DataTexture(grainData, 128, 128, THREE.RGBAFormat);
  steelGrain.wrapS = steelGrain.wrapT = THREE.RepeatWrapping;
  steelGrain.repeat.set(3, 3);
  steelGrain.magFilter = THREE.LinearFilter;
  steelGrain.minFilter = THREE.LinearMipmapLinearFilter;
  steelGrain.generateMipmaps = true;
  steelGrain.needsUpdate = true;
  for (const material of [steel, refugeSteel]) {
    material.roughnessMap = steelGrain;
    material.bumpMap = steelGrain;
    material.bumpScale = 0.009;
  }
  const pitMaterial = new THREE.MeshBasicMaterial({ color: 0x020509 });
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(halfWidth * 2 + 0.04, halfDepth * 2 + 0.04), pitMaterial);
  pit.rotation.x = -Math.PI / 2;
  pit.position.y = floorY + 0.041;
  pit.name = 'collapse-dark-shaft';
  group.add(pit);

  // A barely visible moving haze gives the black shaft depth without replacing
  // the scene fog or imposing postprocessing on other hazards.
  const hazeMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { time: { value: 0 }, strength: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec2 vUv; uniform float time; uniform float strength;
      void main(){vec2 p=vUv*2.0-1.0; float n=sin(p.x*12.0+sin(p.y*9.0+time*.23)*2.0+time*.16);
      n*=sin(p.y*15.0-p.x*4.0-time*.15); float edge=1.0-smoothstep(.2,1.2,length(p));
      gl_FragColor=vec4(.10,.145,.17, max(0.0,n)*edge*strength*.18);}`,
  });
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(halfWidth * 2, halfDepth * 2), hazeMaterial);
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = floorY + 0.047;
  group.add(haze);

  // Merge boxes into one draw call. All dimensions are local to the assembly.
  function boxAssembly(parts) {
    const positions = [];
    const normals = [];
    for (const [w, h, d, x, y, z] of parts) {
      const indexed = new THREE.BoxGeometry(w, h, d);
      const source = indexed.toNonIndexed();
      indexed.dispose();
      source.translate(x, y, z);
      positions.push(...source.attributes.position.array);
      normals.push(...source.attributes.normal.array);
      source.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return geometry;
  }
  const edgeX = tileW / 2 - 0.045;
  const edgeZ = tileD / 2 - 0.045;
  const seam = [-0.04, 0.07, -0.06, 0.09, -0.025, 0.045, -0.05];
  function deckHalf(left) {
    const shape = new THREE.Shape();
    const outer = left ? -edgeX : edgeX;
    shape.moveTo(outer, -edgeZ);
    for (let i = 0; i < seam.length; i++) {
      shape.lineTo(seam[i] + (left ? -0.012 : 0.012), -edgeZ + (i / (seam.length - 1)) * edgeZ * 2);
    }
    shape.lineTo(outer, edgeZ);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.075, bevelEnabled: true, bevelSize: 0.008,
      bevelThickness: 0.007, bevelSegments: 1, steps: 1, curveSegments: 1,
    });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(left ? edgeX : -edgeX, 0, 0);
    return geometry;
  }
  const leftGeometry = deckHalf(true);
  const rightGeometry = deckHalf(false);
  const plateBaselines = [leftGeometry, rightGeometry].map(geometry => ({
    position: geometry.attributes.position.array, normal: geometry.attributes.normal.array,
  }));
  function bendPlate(mesh, amount, baseline) {
    const positions = mesh.geometry.attributes.position.array;
    const normals = mesh.geometry.attributes.normal.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = baseline.position[i];
      const u = Math.min(1, Math.abs(x) / edgeX);
      const wave = Math.sin(u * Math.PI * 0.5);
      positions[i + 1] = baseline.position[i + 1] - amount * wave * wave;
      const gradient = Math.abs(x) < edgeX ? -amount * Math.PI * 0.5 / edgeX * Math.sin(u * Math.PI) * Math.sign(x) : 0;
      const nx = baseline.normal[i] - gradient * baseline.normal[i + 1];
      const ny = baseline.normal[i + 1], nz = baseline.normal[i + 2];
      const inverse = 1 / Math.max(0.0001, Math.hypot(nx, ny, nz));
      normals[i] = nx * inverse; normals[i + 1] = ny * inverse; normals[i + 2] = nz * inverse;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.attributes.normal.needsUpdate = true;
  }
  const frameGeometry = boxAssembly([
    [tileW - 0.04, 0.12, 0.065, 0, -0.08, -edgeZ],
    [tileW - 0.04, 0.12, 0.065, 0, -0.08, edgeZ],
    [0.065, 0.12, tileD - 0.04, -edgeX, -0.08, 0],
    [0.065, 0.12, tileD - 0.04, edgeX, -0.08, 0],
    [tileW - 0.14, 0.13, 0.055, 0, -0.145, -tileD * 0.23],
    [tileW - 0.14, 0.13, 0.055, 0, -0.145, tileD * 0.23],
  ]);
  const treadParts = [];
  for (let i = 0; i < 6; i++) treadParts.push([tileW * 0.32, 0.009, 0.027, 0, 0.016, (i - 2.5) * tileD * 0.125]);
  const treadGeometry = boxAssembly(treadParts);
  const deckTreads = new THREE.InstancedMesh(treadGeometry, bolts, columns * rows * 2);
  deckTreads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  deckTreads.frustumCulled = false;
  group.add(deckTreads);
  const rivets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.026, 0.026, 0.018, 6), bolts, columns * rows * 8);
  rivets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rivets.frustumCulled = false;
  group.add(rivets);
  const stripes = new THREE.InstancedMesh(new THREE.BoxGeometry(tileW * 0.09, 0.012, 0.045), yellow, columns * rows * 6);
  stripes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  stripes.frustumCulled = false;
  group.add(stripes);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const root = new THREE.Group();
      root.position.set(-halfWidth + (column + 0.5) * tileW, floorY + 0.123, -halfDepth + (row + 0.5) * tileD);
      root.name = `collapse-panel-${column}-${row}`;
      const left = new THREE.Mesh(leftGeometry.clone(), steel);
      const right = new THREE.Mesh(rightGeometry.clone(), steel);
      left.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
      left.geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
      right.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
      right.geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
      left.frustumCulled = right.frustumCulled = false;
      left.position.x = -edgeX;
      right.position.x = edgeX;
      left.castShadow = right.castShadow = true;
      left.receiveShadow = right.receiveShadow = true;
      root.add(left, right, new THREE.Mesh(frameGeometry, frames));
      group.add(root);
      const center = column >= 2 && column <= 4;
      tiles.push({
        root, left, right, halves: [left, right], row, column,
        x: root.position.x, z: root.position.z,
        baseDrop: center ? 0.55 + rand() * 0.16 : 0.28 + rand() * 0.29,
        drop: 0, plannedDrop: 0, protectedUntil: 0, snapped: false, lastBend: -1,
        turn: (rand() < 0.5 ? -1 : 1) * (0.4 + rand() * 0.65),
        roll: (rand() - 0.5) * 1.8, phase: rand() * Math.PI * 2,
      });
    }
  }
  leftGeometry.dispose();
  rightGeometry.dispose();

  const leafW = refugeW / slotColumns;
  const leafD = refugeD / slotRows;
  const refugeGeometry = boxAssembly([
    [leafW - 0.022, 0.13, leafD - 0.022, 0, 0.063, 0],
    [leafW - 0.06, 0.18, 0.065, 0, -0.05, -leafD / 2 + 0.11],
    [leafW - 0.06, 0.18, 0.065, 0, -0.05, leafD / 2 - 0.11],
  ]);
  const refugeTrimGeometry = boxAssembly([
    [refugeW, 0.025, 0.045, 0, 0.14, -refugeD / 2 + 0.012],
    [refugeW, 0.025, 0.045, 0, 0.14, refugeD / 2 - 0.012],
    [0.045, 0.025, refugeD, -refugeW / 2 + 0.012, 0.14, 0],
    [0.045, 0.025, refugeD, refugeW / 2 - 0.012, 0.14, 0],
  ]);
  const grilleParts = [];
  for (let i = 0; i < 7; i++) grilleParts.push([leafW - 0.22, 0.012, 0.027, 0, 0.14, (i - 3) * (leafD - 0.24) / 6]);
  const refugeGrilleGeometry = boxAssembly(grilleParts);
  const safeLampGeometry = new THREE.BoxGeometry(0.4, 0.025, 0.065);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 3; row++) {
      const pad = new THREE.Group();
      pad.position.set(side * refugeX, floorY + 0.045, (row - 1) * halfDepth * 0.565);
      pad.name = 'collapse-shrinking-refuge';
      pad.userData.collapseWalkable = { width: refugeW, depth: refugeD };
      pad.add(new THREE.Mesh(refugeTrimGeometry, yellow));
      for (let slotRow = 0; slotRow < slotRows; slotRow++) for (let slotColumn = 0; slotColumn < slotColumns; slotColumn++) {
        const leaf = new THREE.Group();
        leaf.position.set((slotColumn + 0.5) * leafW - refugeW / 2, 0, (slotRow + 0.5) * leafD - refugeD / 2);
        leaf.name = 'collapse-refuge-leaf';
        leaf.userData.collapseWalkable = { width: leafW - 0.022, depth: leafD - 0.022 };
        leaf.userData.failed = false;
        leaf.add(new THREE.Mesh(refugeGeometry, refugeSteel), new THREE.Mesh(refugeGrilleGeometry, frames));
        const lamp = new THREE.Mesh(safeLampGeometry, safeLight);
        lamp.position.set(0, 0.15, -leafD / 2 + 0.12);
        leaf.add(lamp); pad.add(leaf);
        refugeLeaves.push({ root: leaf, pad, x: leaf.position.x, z: leaf.position.z, slotRow, slotColumn,
          quakePhase: refugeLeaves.length * 0.83, failed: false });
      }
      group.add(pad);
      refuges.push(pad);
    }
  }

  const warningLampGeometry = new THREE.BoxGeometry(0.2, 0.06, 0.075);
  const warningLamps = new THREE.InstancedMesh(warningLampGeometry, warning, 24);
  for (let i = 0; i < 24; i++) {
    tmp.position.set(i < 12 ? -halfWidth + 0.1 : halfWidth - 0.1, floorY + 0.085, -halfDepth + 0.5 + (i % 12) * (halfDepth * 2 - 1) / 11);
    tmp.rotation.set(0, 0, 0);
    tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    warningLamps.setMatrixAt(i, tmp.matrix);
  }
  group.add(warningLamps);

  const dustCount = ctx.quality === 'low' ? 360 : 720;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColors = new Float32Array(dustCount * 3);
  const dustSizes = new Float32Array(dustCount);
  const dustOpacity = new Float32Array(dustCount);
  const dustData = [];
  for (let i = 0; i < dustCount; i++) {
    dustData.push({ tile: i % tiles.length, x: (rand() - 0.5) * tileW, z: (rand() - 0.5) * tileD,
      vx: (rand() - 0.5) * 1.4, vz: (rand() - 0.5) * 1.4, vy: 0.7 + rand() * 1.7,
      delay: rand() * 0.16, life: 0.8 + rand() * 1.3, shade: 0.37 + rand() * 0.25 });
    dustPositions[i * 3 + 1] = -10;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3).setUsage(THREE.DynamicDrawUsage));
  dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3).setUsage(THREE.DynamicDrawUsage));
  dustGeometry.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1).setUsage(THREE.DynamicDrawUsage));
  dustGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(dustOpacity, 1).setUsage(THREE.DynamicDrawUsage));
  const dustMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexColors: true,
    uniforms: { pixelScale: { value: 525 } },
    vertexShader: `attribute float aSize; attribute float aOpacity; uniform float pixelScale; varying vec3 tint; varying float alpha;
      void main(){vec4 view=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*view;
      gl_PointSize=clamp(aSize*pixelScale*projectionMatrix[1][1]/max(1.0,-view.z),1.0,140.0); tint=color; alpha=aOpacity;}`,
    fragmentShader: `varying vec3 tint; varying float alpha;
      void main(){vec2 p=gl_PointCoord*2.0-1.0; float r=length(p);
      float soft=1.0-smoothstep(.12,1.0,r); float wisps=.82+.18*sin(p.x*11.0+sin(p.y*9.0)*2.0);
      gl_FragColor=vec4(tint,soft*soft*wisps*alpha); if(gl_FragColor.a<.004) discard;}`,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  const dustViewport = new THREE.Vector2();
  dust.onBeforeRender = renderer => {
    renderer.getDrawingBufferSize(dustViewport);
    dustMaterial.uniforms.pixelScale.value = dustViewport.y * 0.5;
  };
  dust.frustumCulled = false;
  dust.name = 'collapse-impact-dust';
  group.add(dust);

  const fragmentCount = tiles.length * 4;
  const fragmentGeometry = new THREE.IcosahedronGeometry(0.7, 0);
  const fragments = new THREE.InstancedMesh(fragmentGeometry, steel, fragmentCount);
  fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fragments.frustumCulled = false;
  fragments.castShadow = true;
  const fragmentData = [];
  for (let i = 0; i < fragmentCount; i++) fragmentData.push({ tile: i % tiles.length,
    x: (rand() - 0.5) * tileW, z: (rand() - 0.5) * tileD,
    vx: (rand() - 0.5) * 2.4, vz: (rand() - 0.5) * 2.4, vy: 0.7 + rand() * 2.7,
    w: 0.04 + rand() * 0.16, h: 0.025 + rand() * 0.08, d: 0.08 + rand() * 0.28,
    spin: (rand() - 0.5) * 13, delay: rand() * 0.12 });
  group.add(fragments);

  function configureRoutes() {
    // Routing never reads the centrally selected ID. Everyone seeks the same
    // nearest safe positions, so the eventual fatal case is not telegraphed.
    const signature = actors.filter(actor => actor.alive !== false).map(actor => String(actor.id)).join('\u0000');
    if (signature === lastRosterSignature) return;
    lastRosterSignature = signature;
    safeAssignments.clear();
    actorCommands.clear();
    reactionUntil.clear();
    impactUntil.clear(); footImpacts.clear(); exposureAccumulator = 0;
    for (const tile of tiles) {
      tile.plannedDrop = tile.baseDrop;
      tile.drop = tile.plannedDrop;
      tile.protectedUntil = 0;
      tile.snapped = false;
    }
    const slots = [];
    for (const refuge of refuges) {
      for (let row = 0; row < slotRows; row++) for (let column = 0; column < slotColumns; column++) {
        const leaf = refugeLeaves.find(leaf => leaf.pad === refuge && leaf.slotRow === row && leaf.slotColumn === column);
        slots.push({ refuge, leaf, x: refuge.position.x + (column - (slotColumns - 1) / 2) * slotSpacing,
          z: refuge.position.z + (row - (slotRows - 1) / 2) * slotSpacing });
      }
    }
    const remaining = actors.filter(actor => actor.alive !== false);
    // Assign nearest available positions globally so opposing crowds don't
    // unnecessarily cross the shaft, and every person gets a distinct space.
    while (remaining.length && slots.length) {
      let best = Infinity, bestActor = 0, bestSlot = 0;
      for (let a = 0; a < remaining.length; a++) for (let s = 0; s < slots.length; s++) {
        const dx = remaining[a].position.x - slots[s].x;
        const dz = remaining[a].position.z - slots[s].z;
        const distance = dx * dx + dz * dz;
        if (distance < best) { best = distance; bestActor = a; bestSlot = s; }
      }
      safeAssignments.set(remaining.splice(bestActor, 1)[0].id, slots.splice(bestSlot, 1)[0]);
    }
    actors.forEach((actor, index) => footImpacts.set(actor.id, { age: 10, x: actor.position.x, z: actor.position.z, index }));
  }

  function supportedByRefuge(actor, refuge, margin = 0.15) {
    return refugeLeaves.some(leaf => leaf.pad === refuge && !leaf.failed && supportedByLeaf(actor, leaf, margin));
  }

  function supportedByLeaf(actor, leaf, margin = 0.06) {
    const x = leaf.pad.position.x + leaf.x * leaf.pad.scale.x;
    const z = leaf.pad.position.z + leaf.z * leaf.pad.scale.z;
    return Math.abs(actor.position.x - x) < leafW * leaf.pad.scale.x / 2 - margin &&
      Math.abs(actor.position.z - z) < leafD * leaf.pad.scale.z / 2 - margin;
  }

  function pathCrossesTile(x0, z0, x1, z1, tile) {
    // Segment/AABB clipping, widened to include shoulders and avoidance steps.
    const dx = x1 - x0, dz = z1 - z0;
    const left = tile.x - tileW / 2 - 0.65, right = tile.x + tileW / 2 + 0.65;
    const back = tile.z - tileD / 2 - 0.65, front = tile.z + tileD / 2 + 0.65;
    let lo = 0, hi = 1;
    if (Math.abs(dx) < 0.00001) { if (x0 < left || x0 > right) return false; }
    else {
      const a = (left - x0) / dx, b = (right - x0) / dx;
      lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b));
    }
    if (Math.abs(dz) < 0.00001) { if (z0 < back || z0 > front) return false; }
    else {
      const a = (back - z0) / dz, b = (front - z0) / dz;
      lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b));
    }
    return lo <= hi;
  }

  function command(actor, action, x, z, key) {
    if (actorCommands.get(actor.id) === key) return;
    actorCommands.set(actor.id, key);
    if (x !== undefined) actor.setTarget?.(x, z);
    actor.setAction?.(action);
    if (key === 'survivor-braces') actor.setReaction?.('brace', actor.invincible ? 0.25 : 0.6, 0.7);
  }

  function update(dt, state) {
    if (disposed) return;
    const rawProgress = clamp(Number.isFinite(state.progress) ? state.progress : 0);
    const progress = state.phase === 'preview' ? Math.min(0.21, rawProgress * 0.4) : rawProgress;
    const time = Number.isFinite(state.elapsed) ? state.elapsed : 0;
    const active = (state.phase === 'running' || state.phase === 'reveal') && state.paused !== true;
    const step = active ? clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1) : 0;
    if (progress < lastProgress || state.phase !== previousPhase) actorCommands.clear();
    if (progress < lastProgress || state.phase === 'running' && (previousPhase === 'preview' || previousPhase === 'complete' || previousPhase === null)) {
      for (const tile of tiles) { tile.protectedUntil = 0; tile.drop = tile.plannedDrop; tile.snapped = false; }
      reactionUntil.clear(); lastRosterSignature = null; lateFailure = null;
      for (const leaf of refugeLeaves) { leaf.failed = false; leaf.root.userData.failed = false; }
    }
    lastProgress = progress;
    previousPhase = state.phase;
    configureRoutes();
    const shrinking = smooth(0.42, 0.95, progress);
    for (const refuge of refuges) refuge.scale.set(
      1 - shrinking * (1 - finalRefugeW / refugeW), 1,
      1 - shrinking * (1 - finalRefugeD / refugeD));
    // Keep evacuation routes intact until their last person reaches refuge.
    // This is progress-independent, so short rounds and large crowds stay
    // physically supported without teleporting any actor or changing bounds.
    if (active) {
      for (const actor of actors) {
        const slot = safeAssignments.get(actor.id);
        if (!actor.alive || !slot || lateFailure?.actorId === actor.id || supportedByRefuge(actor, slot.refuge)) continue;
        for (const tile of tiles) {
          if (pathCrossesTile(actor.position.x, actor.position.z, slot.x, slot.z, tile)) {
            tile.protectedUntil = Math.max(tile.protectedUntil, progress + 0.035);
          }
        }
      }
    }
    for (const tile of tiles) tile.drop = Math.max(tile.plannedDrop, tile.protectedUntil);
    for (const foot of footImpacts.values()) foot.age += step;

    // Early floor shock affects every ordinary participant, including those
    // already on refuge. The central health system owns vulnerability/fatality.
    if (state.phase === 'running' && progress >= 0.055 && progress < 0.98 && step > 0) {
      exposureAccumulator += step;
      if (exposureAccumulator >= 0.2) {
        const interval = Math.min(exposureAccumulator, 0.3);
        exposureAccumulator = 0;
        const roundSeconds = clamp(progress > 0.02 ? time / progress : 20, 8, 60);
        const amount = (70 / roundSeconds) * (0.9 + progress * 0.4) * interval;
        for (const actor of actors) {
          if (!actor.alive || actor.invincible || lateFailure?.actorId === actor.id) continue;
          ctx.effects?.emit?.('damage', { actorId: actor.id, kind: 'impact', amount,
            position: [actor.position.x, floorY + 0.12, actor.position.z], intensity: 0.35 + progress * 0.4, invincible: false });
          if ((impactUntil.get(actor.id) || 0) <= time) {
            const slot = safeAssignments.get(actor.id);
            const braced = slot && supportedByRefuge(actor, slot.refuge);
            actor.setReaction?.(braced ? 'brace' : 'stumble', 0.38 + progress * 0.32, 0.48);
            actor.setSquish?.('impact', 0.24 + progress * 0.3, 0.38);
            const foot = footImpacts.get(actor.id);
            if (foot) { foot.age = 0; foot.x = actor.position.x; foot.z = actor.position.z; }
            impactUntil.set(actor.id, time + 0.95 + (foot?.index || 0) * 0.035);
          }
        }
      }
    }

    // Only the authoritative late fatal result can release a leaf. The failed
    // support is located under the actor's actual feet; nobody walks to a trap.
    if (!lateFailure && active && progress >= 0.97) {
      const selected = actors.find(actor => actor.alive !== false && !actor.invincible && state.victimIds?.has(actor.id) &&
        (actor.health ? actor.health.current <= 0 : state.phase === 'reveal' && progress >= 1));
      if (selected) {
        const leaf = refugeLeaves.find(leaf => !leaf.failed && supportedByLeaf(selected, leaf, 0));
        const tile = leaf ? null : tiles.find(tile => Math.abs(selected.position.x - tile.x) <= tileW / 2 && Math.abs(selected.position.z - tile.z) <= tileD / 2);
        if (leaf || tile) {
          lateFailure = { actorId: selected.id, leaf, tile, age: 0, x: selected.position.x, z: selected.position.z };
          if (leaf) { leaf.failed = true; leaf.root.userData.failed = true; }
          selected.setReaction?.('stumble', 0.95, 0.55);
          selected.setSquish?.('impact', 0.75, 0.6);
          const foot = footImpacts.get(selected.id);
          if (foot) { foot.age = 0; foot.x = selected.position.x; foot.z = selected.position.z; }
        }
      }
    }
    if (lateFailure) lateFailure.age += step;
    for (const leaf of refugeLeaves) {
      const age = lateFailure?.leaf === leaf ? lateFailure.age : 0;
      const quake = state.phase !== 'preview' && progress > 0.055 ? Math.sin(time * 27 + leaf.quakePhase) * (0.006 + progress * 0.009) : 0;
      leaf.root.position.set(leaf.x, age > 0 ? Math.sin(Math.min(1, age / 0.22) * Math.PI) * 0.06 - Math.pow(Math.max(0, age - 0.06), 2) * 7.5 : quake, leaf.z);
      leaf.root.rotation.set(age > 0 ? Math.min(age * 2.6, 1.5) : quake * 0.3, 0, age > 0 ? Math.min(age * 0.35, 0.32) : quake * 0.45);
      leaf.root.visible = age < 1.1;
    }
    const shake = smooth(0.04, 0.21, progress);
    const alarmPulse = Math.pow(Math.max(0, Math.sin(time * (7 + progress * 9))), 8);
    warning.emissiveIntensity = 0.55 + alarmPulse * (1.4 + progress * 4.2);
    safeLight.emissiveIntensity = 0.65 + progress * 1.2;
    hazeMaterial.uniforms.time.value = time;
    hazeMaterial.uniforms.strength.value = smooth(0.24, 0.75, progress);

    let rivetIndex = 0;
    let stripeIndex = 0;
    let treadIndex = 0;
    for (const tile of tiles) {
      // Occupied escape routes flex only slightly; full failure waits until clear.
      const held = tile.protectedUntil > progress;
      const preCrack = smooth(tile.drop - 0.2, tile.drop, progress) * (held ? 0.14 : 1);
      const fall = lateFailure?.tile === tile ? lateFailure.age * 1.8 : Math.max(0, (progress - tile.drop) / 0.12);
      const rattle = Math.sin(time * 28 + tile.phase) * 0.008 * shake * (1 - clamp(fall));
      const releaseKick = Math.sin(Math.min(1, fall * 3.5) * Math.PI) * 0.065;
      tile.root.position.set(tile.x, floorY + 0.123 + rattle + releaseKick - fall * fall * 5.7, tile.z);
      tile.root.rotation.set(fall * tile.turn + Math.sin(time * 23 + tile.phase) * preCrack * 0.009,
        Math.sin(time * 19 + tile.phase) * 0.002 * preCrack + fall * tile.turn * 0.12, fall * tile.roll);
      tile.root.visible = fall < 1.75;
      const snap = smooth(0, 0.22, fall);
      const recoil = Math.sin(fall * 19) * Math.exp(-fall * 4) * snap * 0.15;
      const fold = preCrack * preCrack * 0.045 + snap * 0.6 + Math.min(fall, 1) * 0.22 + recoil;
      const bend = preCrack * preCrack * 0.028 + snap * 0.11;
      tile.left.rotation.z = -fold;
      tile.right.rotation.z = fold * (0.78 + 0.12 * Math.sin(tile.phase));
      tile.left.position.x = -edgeX - preCrack * 0.02 - snap * 0.08;
      tile.right.position.x = edgeX + preCrack * 0.02 + snap * 0.12;
      if (tile.root.visible && Math.abs(bend - tile.lastBend) > 0.00015) {
        bendPlate(tile.left, bend, plateBaselines[0]);
        bendPlate(tile.right, bend * 0.8, plateBaselines[1]);
        tile.lastBend = bend;
      }
      if (!tile.snapped && progress >= tile.drop && active) {
        tile.snapped = true;
        for (const actor of actors) {
          if (!actor.alive || actor.invincible || (reactionUntil.get(actor.id) || 0) > time) continue;
          if (Math.hypot(actor.position.x - tile.x, actor.position.z - tile.z) > 3) continue;
          const safeSlot = safeAssignments.get(actor.id);
          const braced = safeSlot && supportedByRefuge(actor, safeSlot.refuge);
          actor.setReaction?.(braced ? 'brace' : 'stumble', braced ? 0.7 : 0.85, 0.7);
          actor.setSquish?.('impact', braced ? 0.3 : 0.5, 0.4);
          reactionUntil.set(actor.id, time + 0.85);
        }
      }
      tile.root.updateMatrix();
      // Instance matrices are relative to the scenario group, just like panels.
      for (const half of tile.halves) {
        half.updateMatrix();
        tmp.position.set(half === tile.left ? edgeX * 0.48 : -edgeX * 0.48,
          -bend * (half === tile.left ? 0.47 : 0.376), 0);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.setScalar(tile.root.visible ? 1 : 0);
        tmp.updateMatrix();
        localMatrix.multiplyMatrices(half.matrix, tmp.matrix);
        combinedMatrix.multiplyMatrices(tile.root.matrix, localMatrix);
        deckTreads.setMatrixAt(treadIndex++, combinedMatrix);
      }
      for (let i = 0; i < 8; i++) {
        const alongX = i < 4;
        tmp.position.set(alongX ? ((i % 2) * 2 - 1) * edgeX * 0.73 : ((i % 2) * 2 - 1) * edgeX,
          0.018, alongX ? (i < 2 ? -edgeZ : edgeZ) : (i < 6 ? -edgeZ : edgeZ) * 0.72);
        tmp.rotation.set(0, 0, 0);
        tmp.scale.setScalar(tile.root.visible ? 1 : 0);
        tmp.updateMatrix();
        combinedMatrix.multiplyMatrices(tile.root.matrix, tmp.matrix);
        rivets.setMatrixAt(rivetIndex++, combinedMatrix);
      }
      for (let i = 0; i < 6; i++) {
        tmp.position.set(((i % 3) - 1) * tileW * 0.16, 0.012, i < 3 ? -edgeZ : edgeZ);
        tmp.rotation.set(0, -0.35, 0);
        tmp.scale.setScalar(tile.root.visible ? 1 : 0);
        tmp.updateMatrix();
        combinedMatrix.multiplyMatrices(tile.root.matrix, tmp.matrix);
        stripes.setMatrixAt(stripeIndex++, combinedMatrix);
      }
    }
    deckTreads.instanceMatrix.needsUpdate = true;
    rivets.instanceMatrix.needsUpdate = true;
    stripes.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < dustCount; i++) {
      const data = dustData[i];
      const tile = tiles[data.tile];
      const age = (progress - tile.drop) * 15 - data.delay;
      const at = i * 3;
      if (age <= 0 || age > data.life) {
        dustPositions[at + 1] = -10;
        dustOpacity[i] = 0;
        continue;
      }
      const fade = 1 - age / data.life;
      const spread = 1 - Math.exp(-age * 1.7);
      dustPositions[at] = tile.x + data.x + data.vx * spread + Math.sin(age * 2.7 + i) * age * 0.06;
      dustPositions[at + 1] = floorY + 0.14 + data.vy * (1 - Math.exp(-age)) * 0.57;
      dustPositions[at + 2] = tile.z + data.z + data.vz * spread;
      dustColors[at] = data.shade * 1.1;
      dustColors[at + 1] = data.shade * 1.05;
      dustColors[at + 2] = data.shade;
      dustSizes[i] = 0.22 + age * 0.5 + data.shade * 0.25;
      dustOpacity[i] = Math.min(1, age * 8) * fade * fade * 0.55;
    }
    for (const foot of footImpacts.values()) {
      if (foot.age >= 0.72) continue;
      for (let part = 0; part < 3; part++) {
        const index = dustCount - 1 - foot.index * 3 - part;
        if (index < 0) continue;
        const angle = part * Math.PI * 2 / 3 + foot.index;
        const spread = 0.035 + foot.age * 0.48;
        const at = index * 3;
        dustPositions[at] = foot.x + Math.cos(angle) * spread;
        dustPositions[at + 1] = floorY + 0.16 + foot.age * 0.3;
        dustPositions[at + 2] = foot.z + Math.sin(angle) * spread;
        dustColors[at] = 0.48; dustColors[at + 1] = 0.46; dustColors[at + 2] = 0.42;
        dustSizes[index] = 0.18 + foot.age * 0.38;
        dustOpacity[index] = Math.pow(1 - foot.age / 0.72, 2) * 0.52;
      }
    }
    dustGeometry.attributes.position.needsUpdate = true;
    dustGeometry.attributes.color.needsUpdate = true;
    dustGeometry.attributes.aSize.needsUpdate = true;
    dustGeometry.attributes.aOpacity.needsUpdate = true;
    for (let i = 0; i < fragmentCount; i++) {
      const data = fragmentData[i];
      const tile = tiles[data.tile];
      const finalFragment = lateFailure && i >= fragmentCount - 8;
      const age = finalFragment ? lateFailure.age - data.delay : (progress - tile.drop) * 15 - data.delay;
      const visible = age > 0 && age < 1.2;
      tmp.position.set((finalFragment ? lateFailure.x : tile.x) + data.x * (finalFragment ? 0.35 : 1) + data.vx * Math.max(0, age),
        floorY + 0.18 + data.vy * age - 5 * age * age, (finalFragment ? lateFailure.z : tile.z) + data.z * (finalFragment ? 0.35 : 1) + data.vz * Math.max(0, age));
      tmp.rotation.set(age * data.spin, age * data.spin * 0.61, age * data.spin * 0.37);
      tmp.scale.set(visible ? data.w : 0, visible ? data.h : 0, visible ? data.d : 0);
      tmp.updateMatrix();
      fragments.setMatrixAt(i, tmp.matrix);
    }
    fragments.instanceMatrix.needsUpdate = true;

    if (!active) return;
    for (const actor of actors) {
      if (!actor.alive) continue;
      if (lateFailure?.actorId === actor.id) {
        command(actor, 'fall', undefined, undefined, 'support-fails-underfoot');
      } else {
        const slot = safeAssignments.get(actor.id);
        if (!slot) continue;
        const arrived = Math.hypot(actor.position.x - slot.x, actor.position.z - slot.z) < 0.18;
        if (arrived && supportedByRefuge(actor, slot.refuge)) command(actor, 'crouch', slot.x, slot.z, 'survivor-braces');
        else command(actor, progress < 0.18 ? 'run' : 'panic', slot.x, slot.z, progress < 0.18 ? 'nearby-refuge' : 'survivor-to-refuge');
      }
    }
  }

  function reset() {
    if (disposed) return;
    lastRosterSignature = null; lastProgress = -1; previousPhase = null;
    exposureAccumulator = 0; lateFailure = null;
    actorCommands.clear(); reactionUntil.clear(); impactUntil.clear(); footImpacts.clear();
    for (const leaf of refugeLeaves) { leaf.failed = false; leaf.root.userData.failed = false; }
    update(0, { progress: 0, elapsed: 0, phase: 'preview', victimIds: new Set() });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      if (object.isInstancedMesh) object.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      material.dispose();
    }
    for (const texture of textures) texture.dispose();
    group.clear();
    actorCommands.clear();
    safeAssignments.clear();
    reactionUntil.clear();
    impactUntil.clear(); footImpacts.clear(); lateFailure = null;
  }

  // Initialize all instance matrices immediately, before the first render.
  update(0, { progress: 0, elapsed: 0, phase: 'preview', victimIds: new Set() });
  return { update, reset, dispose, get cinematicReady() { return !lateFailure || lateFailure.age >= 1.1; } };
}
