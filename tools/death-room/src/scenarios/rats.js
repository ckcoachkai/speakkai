import * as THREE from 'three';

// All animal parts share instanced geometry: a full swarm costs 16 draw calls.
export default function createScenario(ctx) {
  const { group, room, actors } = ctx;
  const low = ctx.quality === 'low' || (typeof ctx.quality === 'number' && ctx.quality < 1);
  const count = low ? 144 : ctx.quality === 'high' ? 320 : 256;
  const floor = room.floorY ?? 0;
  const halfW = room.halfWidth ?? 7;
  const halfD = room.halfDepth ?? 6;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const instances = [];
  const hardwareInstances = [];
  const vents = [];
  const victims = [];
  const living = [];
  const biteLimits = new Map();
  const contactStats = new Map();
  const biteHeights = [0.19, 0.3, 0.44, 0.24, 0.62, 0.38, 0.55];
  const biteInterval = 0.38;
  const protectedActor = actor => actor.invincible || actor.id === 'vip-456';
  let seed = Math.floor((ctx.random || Math.random)() * 4294967296) >>> 0;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const clamp = THREE.MathUtils.clamp;
  const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const geo = g => { geometries.add(g); return g; };
  const mat = settings => { const m = new THREE.MeshStandardMaterial(settings); materials.add(m); return m; };
  const metal = mat({ color: 0x43494a, metalness: 0.82, roughness: 0.49 });
  const trim = mat({ color: 0x747a75, metalness: 0.7, roughness: 0.42 });
  const black = mat({ color: 0x060809, roughness: 0.98 });
  const rust = mat({ color: 0x47372c, metalness: 0.45, roughness: 0.92 });
  const warning = mat({ color: 0xb1a15c, metalness: 0.3, roughness: 0.78 });
  const alarm = mat({ color: 0xb82d17, emissive: 0xff3515, emissiveIntensity: 1.2, roughness: 0.35 });
  // Broad coat variation plus low-contrast directional grain; no glittering coarse bump.
  const furData = new Uint8Array(128 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
    const index = (y * 128 + x) * 4;
    const previous = y ? furData[index - 128 * 4] : 172;
    const mottle = Math.sin(x * 0.13 + Math.sin(y * 0.19)) * 9;
    const value = Math.round(previous * 0.68 + (142 + random() * 48 + mottle) * 0.32);
    furData[index] = value; furData[index + 1] = value; furData[index + 2] = value; furData[index + 3] = 255;
  }
  const furTexture = new THREE.DataTexture(furData, 128, 64);
  furTexture.colorSpace = THREE.SRGBColorSpace;
  furTexture.wrapS = furTexture.wrapT = THREE.RepeatWrapping;
  furTexture.repeat.set(3, 2);
  furTexture.magFilter = THREE.LinearFilter;
  furTexture.minFilter = THREE.LinearMipmapLinearFilter;
  furTexture.generateMipmaps = true;
  furTexture.needsUpdate = true;
  textures.add(furTexture);
  const coat = mat({ color: 0xffffff, map: furTexture, bumpMap: furTexture, bumpScale: 0.0025, roughness: 0.92 });
  const undercoat = mat({ color: 0x7b7367, map: furTexture, bumpMap: furTexture, bumpScale: 0.0015, roughness: 0.96 });
  const skin = mat({ color: 0x704f4a, roughness: 0.83 });
  const innerEar = mat({ color: 0x98665d, roughness: 0.83 });
  const eyeMaterial = mat({ color: 0x080706, roughness: 0.14, metalness: 0.08 });
  const noseMaterial = mat({ color: 0x4b3332, roughness: 0.39 });
  const glintMaterial = mat({ color: 0xddd2b3, emissive: 0x544b38, emissiveIntensity: 0.25, roughness: 0.2 });
  const whiskerMaterial = mat({ color: 0xb5afa2, roughness: 0.9 });
  const sphere = geo(new THREE.SphereGeometry(1, low ? 7 : 8, low ? 5 : 6));
  const bodySphere = geo(new THREE.SphereGeometry(1, low ? 10 : 16, low ? 7 : 10));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 4, 1));
  const taper = geo(new THREE.CylinderGeometry(0.72, 1, 1, low ? 4 : 5, 1));
  const box = geo(new THREE.BoxGeometry(1, 1, 1));
  const boltGeo = geo(new THREE.CylinderGeometry(0.035, 0.035, 0.024, 6));
  const diskGeo = geo(new THREE.CircleGeometry(1, 20));

  function mesh(geometry, material, parent, x, y, z, sx = 1, sy = 1, sz = 1) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  // The open front remains clear; rats enter through five actual barred apertures.
  const ventSpecs = [
    [-halfW + 0.16, -halfD * 0.54, Math.PI / 2],
    [-halfW + 0.16, halfD * 0.36, Math.PI / 2],
    [halfW - 0.16, -halfD * 0.54, -Math.PI / 2],
    [halfW - 0.16, halfD * 0.36, -Math.PI / 2],
    [0, -halfD + 0.16, 0],
  ];
  for (let v = 0; v < ventSpecs.length; v++) {
    const [x, z, angle] = ventSpecs[v];
    const assembly = new THREE.Group();
    assembly.position.set(x, floor, z);
    assembly.rotation.y = angle;
    group.add(assembly);
    mesh(box, black, assembly, 0, 0.39, 0.018, 1.38, 0.73, 0.06);
    mesh(box, metal, assembly, -0.76, 0.43, 0.08, 0.14, 0.86, 0.17);
    mesh(box, metal, assembly, 0.76, 0.43, 0.08, 0.14, 0.86, 0.17);
    mesh(box, metal, assembly, 0, 0.86, 0.08, 1.64, 0.15, 0.17);
    mesh(box, rust, assembly, 0, 0.045, 0.22, 1.66, 0.09, 0.5);
    mesh(box, trim, assembly, 0, 0.082, 0.49, 1.5, 0.025, 0.05);
    for (const side of [-1, 1]) {
      mesh(box, trim, assembly, side * 0.68, 0.44, 0.18, 0.045, 0.75, 0.045);
      for (const y of [0.15, 0.7]) {
        const bolt = mesh(boltGeo, trim, assembly, side * 0.76, y, 0.185);
        bolt.rotation.x = Math.PI / 2;
      }
    }
    for (let stripe = -3; stripe <= 3; stripe++) {
      const piece = mesh(box, warning, assembly, stripe * 0.19, 0.86, 0.174, 0.085, 0.12, 0.009);
      piece.rotation.z = -0.45;
    }
    const grille = new THREE.Group();
    assembly.add(grille);
    for (let bar = -4; bar <= 4; bar++) mesh(box, metal, grille, bar * 0.145, 0.41, 0.115, 0.033, 0.7, 0.04);
    for (const y of [0.15, 0.64]) mesh(box, trim, grille, 0, y, 0.14, 1.3, 0.035, 0.033);
    mesh(box, metal, assembly, 0.59, 1.035, 0.1, 0.26, 0.16, 0.18);
    mesh(sphere, alarm, assembly, 0.59, 1.035, 0.205, 0.052, 0.045, 0.025);
    // A low, grimy apron grounds the opening without covering the chamber floor.
    const apron = mesh(box, rust, assembly, 0, 0.013, 0.59, 1.55, 0.018, 0.75);
    apron.castShadow = false;
    vents.push({ x, z, angle, grille, assembly });
  }

  // Batch bolts, frames and bars too; the moving grilles retain their own transforms.
  function batchHardware(sources, destination, includeAssemblyTransform) {
    const buckets = new Map();
    for (const source of sources) {
      source.updateMatrix();
      const key = `${source.geometry.uuid}/${source.material.uuid}`;
      let bucket = buckets.get(key);
      if (!bucket) { bucket = { geometry: source.geometry, material: source.material, matrices: [] }; buckets.set(key, bucket); }
      const transform = source.matrix.clone();
      if (includeAssemblyTransform) { source.parent.updateMatrix(); transform.premultiply(source.parent.matrix); }
      bucket.matrices.push(transform);
      source.removeFromParent();
    }
    for (const bucket of buckets.values()) {
      const batch = new THREE.InstancedMesh(bucket.geometry, bucket.material, bucket.matrices.length);
      bucket.matrices.forEach((transform, index) => batch.setMatrixAt(index, transform));
      batch.castShadow = true;
      batch.receiveShadow = true;
      batch.frustumCulled = false;
      destination.add(batch);
      hardwareInstances.push(batch);
    }
  }
  const fixedHardware = [];
  for (const vent of vents) {
    fixedHardware.push(...vent.assembly.children.filter(object => object.isMesh));
    batchHardware(vent.grille.children.filter(object => object.isMesh), vent.grille, false);
  }
  batchHardware(fixedHardware, group, true);

  function instanced(geometry, material, multiple = 1, castShadow = true) {
    const object = new THREE.InstancedMesh(geometry, material, count * multiple);
    object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    object.count = 0;
    object.frustumCulled = false;
    object.castShadow = castShadow;
    object.receiveShadow = true;
    group.add(object);
    instances.push({ object, multiple });
    return object;
  }
  const bodies = instanced(bodySphere, coat);
  const haunches = instanced(bodySphere, coat);
  const chests = instanced(sphere, undercoat, 1, false);
  const heads = instanced(bodySphere, coat);
  const muzzles = instanced(sphere, undercoat, 1, false);
  const noses = instanced(sphere, noseMaterial, 1, false);
  const ears = instanced(sphere, skin, 2, false);
  const earCenters = instanced(sphere, innerEar, 2, false);
  const eyes = instanced(sphere, eyeMaterial, 2, false);
  const glints = instanced(sphere, glintMaterial, 2, false);
  const thighs = instanced(sphere, coat, 2, false);
  const legs = instanced(cylinder, coat, 8, false);
  const paws = instanced(sphere, skin, 4, false);
  const tails = instanced(taper, skin, 7, false);
  const whiskers = instanced(cylinder, whiskerMaterial, 6, false);
  const shadowMaterial = mat({ color: 0x050605, transparent: true, opacity: 0.13, depthWrite: false, roughness: 1 });
  const contacts = instanced(diskGeo, shadowMaterial, 1, false);
  contacts.receiveShadow = false;
  const partNames = ['body', 'haunch', 'chest', 'head', 'muzzle', 'nose', 'ears', 'ear-centers', 'eyes', 'glints', 'thighs', 'legs', 'paws', 'tails', 'whiskers', 'contact-shadows'];
  instances.forEach((entry, i) => { entry.object.name = `rats-${partNames[i]}`; });

  const rats = new Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const vent = vents[i % vents.length];
    rats[i] = {
      x: vent.x, z: vent.z, vx: 0, vz: 0, heading: vent.angle,
      age: -1, scale: 0.52 + random() * 0.3, speed: 1.7 + random() * 1.15,
      phase: random() * Math.PI * 2, orbit: random() * Math.PI * 2,
      radius: random(), bias: random(), vent: i % vents.length,
      gait: random() * Math.PI * 2, active: false, travel: 0, turnRate: 0,
      navTimer: 0, navAngle: random() * Math.PI * 2, navRadius: random(), pause: 0,
      targetX: vent.x, targetZ: vent.z, tailReady: false,
      biteCooldown: 0, attackAge: -1, attackVictim: null, attackHeight: 0,
      biteEmitted: false, altitude: 0, impactAge: 1,
      tailX: new Float32Array(8), tailZ: new Float32Array(8),
      tailPreviousX: new Float32Array(8), tailPreviousZ: new Float32Array(8),
    };
    const shade = random();
    color.setHSL(0.065 + random() * 0.035, 0.13 + random() * 0.19, 0.035 + shade * 0.095);
    bodies.setColorAt(i, color);
    haunches.setColorAt(i, color);
    heads.setColorAt(i, color.clone().multiplyScalar(1.11));
    for (let j = 0; j < 2; j++) thighs.setColorAt(i * 2 + j, color);
    for (let j = 0; j < 8; j++) legs.setColorAt(i * 8 + j, color);
  }

  // A fixed linked-cell grid keeps close-neighbor steering linear in the swarm size.
  const cellSize = 0.52;
  const gridWidth = Math.ceil(halfW * 2 / cellSize) + 2;
  const gridDepth = Math.ceil(halfD * 2 / cellSize) + 2;
  const gridHeads = new Int16Array(gridWidth * gridDepth);
  const gridNext = new Int16Array(count);
  const fallbackBounds = { minX: -halfW + 0.4, maxX: halfW - 0.4, minZ: -halfD + 0.4, maxZ: halfD - 0.4 };
  const cellX = x => clamp(Math.floor((x + halfW) / cellSize), 0, gridWidth - 1);
  const cellZ = z => clamp(Math.floor((z + halfD) / cellSize), 0, gridDepth - 1);

  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const localQuaternion = new THREE.Quaternion();
  const rootQuaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const euler = new THREE.Euler();
  let rx = 0, rz = 0, ry = 0, rs = 1, sin = 0, cos = 1;

  function part(object, index, x, y, z, sx, sy, sz, tiltX = 0, tiltY = 0, tiltZ = 0) {
    pos.set(rx + (x * cos + z * sin) * rs, ry + y * rs, rz + (-x * sin + z * cos) * rs);
    scale.set(sx * rs, sy * rs, sz * rs);
    quaternion.copy(rootQuaternion);
    if (tiltX || tiltY || tiltZ) {
      localQuaternion.setFromEuler(euler.set(tiltX, tiltY, tiltZ));
      quaternion.multiply(localQuaternion);
    }
    matrix.compose(pos, quaternion, scale);
    object.setMatrixAt(index, matrix);
  }

  function segment(object, index, ax, ay, az, bx, by, bz, radius) {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    pos.set(rx + (((ax + bx) * cos + (az + bz) * sin) * 0.5) * rs,
      ry + (ay + by) * 0.5 * rs,
      rz + ((-(ax + bx) * sin + (az + bz) * cos) * 0.5) * rs);
    direction.set(dx / length, dy / length, dz / length);
    localQuaternion.setFromUnitVectors(up, direction);
    quaternion.copy(rootQuaternion).multiply(localQuaternion);
    scale.set(radius * rs, length * rs, radius * rs);
    matrix.compose(pos, quaternion, scale);
    object.setMatrixAt(index, matrix);
  }

  function trailTail(rat, dt) {
    const sx = Math.sin(rat.heading), sz = Math.cos(rat.heading);
    const size = rat.scale * smooth(0, 0.24, rat.age);
    const length = Math.max(0.0001, size * 0.48 / 7);
    const baseX = rat.x - sx * 0.263 * size;
    const baseZ = rat.z - sz * 0.263 * size;
    if (!rat.tailReady) {
      for (let j = 0; j < 8; j++) {
        rat.tailX[j] = rat.tailPreviousX[j] = baseX - sx * j * length;
        rat.tailZ[j] = rat.tailPreviousZ[j] = baseZ - sz * j * length;
      }
      rat.tailReady = true;
    }
    if (dt === 0) return;
    rat.tailX[0] = baseX;
    rat.tailZ[0] = baseZ;
    const inertia = Math.pow(0.58, dt * 60);
    const straighten = 1 - Math.exp(-dt * 2.4);
    for (let j = 1; j < 8; j++) {
      const previousX = rat.tailX[j], previousZ = rat.tailZ[j];
      let px = previousX + (previousX - rat.tailPreviousX[j]) * inertia;
      let pz = previousZ + (previousZ - rat.tailPreviousZ[j]) * inertia;
      let dirX = -sx, dirZ = -sz;
      if (j > 1) {
        dirX = rat.tailX[j - 1] - rat.tailX[j - 2];
        dirZ = rat.tailZ[j - 1] - rat.tailZ[j - 2];
        const inverse = 1 / Math.max(0.00001, Math.hypot(dirX, dirZ));
        dirX *= inverse; dirZ *= inverse;
      }
      px += (rat.tailX[j - 1] + dirX * length - px) * straighten;
      pz += (rat.tailZ[j - 1] + dirZ * length - pz) * straighten;
      let dx = px - rat.tailX[j - 1], dz = pz - rat.tailZ[j - 1];
      const distance = Math.hypot(dx, dz);
      if (distance < 0.00001) { dx = dirX; dz = dirZ; } else { dx /= distance; dz /= distance; }
      rat.tailPreviousX[j] = previousX;
      rat.tailPreviousZ[j] = previousZ;
      rat.tailX[j] = rat.tailX[j - 1] + dx * length;
      rat.tailZ[j] = rat.tailZ[j - 1] + dz * length;
    }
  }

  function drawRat(rat, index, time, progress) {
    rx = rat.x; rz = rat.z;
    const speed = Math.hypot(rat.vx, rat.vz);
    const gait = rat.gait;
    const activity = Math.min(1, speed / 0.45);
    const bound = smooth(1.8, 3.4, speed);
    const bob = Math.sin(gait * 2) * 0.006 * activity;
    const sniff = (1 - activity) * Math.sin(time * 9 + rat.phase) * 0.006;
    // The belly loads before the hop, the neck reaches on contact, and the
    // haunches absorb the landing. A short damped tissue response follows an
    // actual bite; normal running stays firm instead of wobbling constantly.
    const attack = rat.attackAge;
    const preload = attack < 0 ? 0 : smooth(0, 0.055, attack) * (1 - smooth(0.065, 0.12, attack));
    const lunge = attack < 0 ? 0 : smooth(0.075, 0.15, attack) * (1 - smooth(0.24, 0.36, attack));
    const recoil = attack < 0 ? 0 : smooth(0.27, 0.335, attack) * (1 - smooth(0.35, 0.51, attack));
    const tissue = rat.impactAge < 0.48 ? Math.sin(rat.impactAge * 28) * Math.exp(-rat.impactAge * 8) * 0.055 : 0;
    const squash = 1 - preload * 0.19 - recoil * 0.14 + lunge * 0.05 + tissue;
    const stretch = 1 + preload * 0.08 + lunge * 0.13 - recoil * 0.075 - tissue * 0.5;
    const neck = lunge * 0.068 - recoil * 0.038;
    const chestDrop = (preload * 0.018 + recoil * 0.014) - lunge * 0.007;
    ry = floor + 0.01 + rat.altitude + Math.max(0, Math.sin(gait)) * 0.012 * bound;
    rs = rat.scale * smooth(0, 0.24, rat.age);
    sin = Math.sin(rat.heading); cos = Math.cos(rat.heading);
    rootQuaternion.setFromAxisAngle(up, rat.heading);
    const flex = Math.sin(gait) * bound * 0.035;
    part(bodies, index, 0, 0.164 + bob - chestDrop, -0.018, 0.116 / Math.sqrt(squash), 0.117 * (1 - flex) * squash, 0.265 * (1 + flex) * stretch, 0, 0, clamp(-rat.turnRate * speed * 0.008, -0.08, 0.08));
    part(haunches, index, 0, 0.159 + bob - chestDrop * 0.6, -0.158 + flex * 0.15 - lunge * 0.025, 0.131 * (1 + preload * 0.07), 0.12 * squash, 0.15 * (1 + recoil * 0.08));
    part(chests, index, 0, 0.112 + bob - chestDrop, 0.128 + neck * 0.45, 0.081 * (1 + recoil * 0.08), 0.072 * squash, 0.13 * stretch);
    part(heads, index, 0, 0.168 + bob + sniff - chestDrop, 0.258 + neck, 0.096, 0.091 * (1 - recoil * 0.06), 0.139 * (1 + lunge * 0.04), -0.06 - lunge * 0.09);
    part(muzzles, index, 0, 0.134 + bob + sniff - chestDrop, 0.367 + neck, 0.056 * (1 + recoil * 0.07), 0.051, 0.108 * (1 - recoil * 0.08), -0.05);
    part(noses, index, 0, 0.14 + bob + sniff - chestDrop, 0.463 + neck, 0.029, 0.021, 0.02);
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      const earTwitch = Math.pow(Math.max(0, Math.sin(time * 2.3 + rat.phase + side)), 14) * 0.18;
      part(ears, index * 2 + side, sign * 0.082, 0.24 + bob + sniff - chestDrop, 0.227 + neck, 0.041, 0.048, 0.013, 0.08, sign * 0.24, sign * (0.38 + earTwitch - lunge * 0.21));
      part(earCenters, index * 2 + side, sign * 0.083, 0.241 + bob + sniff - chestDrop, 0.24 + neck, 0.028, 0.036, 0.005, 0.08, sign * 0.24, sign * (0.38 + earTwitch - lunge * 0.21));
      part(eyes, index * 2 + side, sign * 0.081, 0.189 + bob + sniff - chestDrop, 0.319 + neck, 0.012, 0.014, 0.012);
      part(glints, index * 2 + side, sign * 0.09, 0.194 + bob + sniff - chestDrop, 0.325 + neck, 0.003, 0.004, 0.003);
      const rearCycle = Math.sin(gait + side * Math.PI);
      part(thighs, index * 2 + side, sign * 0.092, 0.109 + bob - chestDrop, -0.157 + rearCycle * 0.019 - lunge * 0.025, 0.059 * (1 + preload * 0.12), 0.068 * squash, 0.084 * stretch);
      for (let leg = 0; leg < 2; leg++) {
        const n = index * 4 + side * 2 + leg;
        // During stance the paw sweeps backwards at ground speed. Only swing lifts it.
        const phase = ((gait + side * Math.PI * (1 - bound * 0.86) + leg * Math.PI) / (Math.PI * 2)) % 1;
        const strideLength = 0.19 + 0.025 * Math.min(speed, 3.4);
        const stance = 0.56;
        const swing = phase < stance ? 0 : (phase - stance) / (1 - stance);
        const stride = strideLength * (phase < stance ? 0.5 - phase / stance : -0.5 + smooth(0, 1, swing));
        const footLift = Math.sin(swing * Math.PI) * (0.052 + bound * 0.024) * activity;
        const z = leg === 0 ? 0.147 : -0.179;
        const footZ = z + stride * (1 - preload * 0.45) + lunge * (leg === 0 ? 0.055 : -0.045);
        const kneeZ = (z + footZ) * 0.5 + (leg === 0 ? 0.035 : -0.045);
        const kneeY = 0.077 + bob * 0.5 + footLift * 0.35 - chestDrop * 0.6;
        segment(legs, n * 2, sign * 0.078, 0.13 + bob - chestDrop, z, sign * (0.113 + preload * 0.012), kneeY, kneeZ, leg === 0 ? 0.018 : 0.024);
        segment(legs, n * 2 + 1, sign * 0.113, kneeY, kneeZ, sign * 0.108, 0.032 + footLift, footZ, leg === 0 ? 0.012 : 0.015);
        part(paws, n, sign * 0.111, 0.024 + footLift, footZ + 0.025, 0.023, 0.013, 0.041, -swing * Math.PI * 0.13);
      }
      for (let whisker = 0; whisker < 3; whisker++) {
        const whiskerZ = 0.35 + whisker * 0.022 + neck;
        segment(whiskers, index * 6 + side * 3 + whisker,
          sign * 0.048, 0.139 + bob + sniff - chestDrop, whiskerZ,
          sign * (0.15 + whisker * 0.008), 0.143 + bob + sniff - chestDrop + (whisker - 1) * 0.014,
          whiskerZ - 0.025 + whisker * 0.019 + sniff * 2, 0.0013);
      }
    }
    let ax = 0, ay = 0.098 + bob, az = -0.263;
    for (let tail = 0; tail < 7; tail++) {
      const t = (tail + 1) / 7;
      const worldDX = rat.tailX[tail + 1] - rx, worldDZ = rat.tailZ[tail + 1] - rz;
      const inverseScale = 1 / Math.max(rs, 0.0001);
      const bx = (worldDX * cos - worldDZ * sin) * inverseScale;
      const by = 0.026 + (1 - t) * (1 - t) * 0.063;
      const bz = (worldDX * sin + worldDZ * cos) * inverseScale;
      // Cylinder +Y is the narrower tip, so the tail narrows away from the rump.
      segment(tails, index * 7 + tail, ax, ay, az, bx, by, bz, 0.023 * (1 - tail / 8));
      ax = bx; ay = by; az = bz;
    }
    const animalY = ry;
    ry = floor + 0.006;
    part(contacts, index, 0, 0, 0.035, 0.18, 0.4, 1, -Math.PI / 2);
    ry = animalY;
  }

  let previousProgress = -1;
  let previousPhase = '';
  let actorClock = 0;
  let simulationTime = 0;
  let lastActiveCount = 0;
  let disposed = false;

  function reset() {
    for (const rat of rats) {
      rat.active = false; rat.age = -1; rat.vx = 0; rat.vz = 0;
      rat.navTimer = 0; rat.pause = 0; rat.tailReady = false; rat.turnRate = 0;
      rat.biteCooldown = 0; rat.attackAge = -1; rat.attackVictim = null;
      rat.biteEmitted = false; rat.altitude = 0; rat.impactAge = 1;
    }
    biteLimits.clear();
    contactStats.clear();
    actorClock = 0;
  }

  function update(dt, state) {
    if (disposed) return;
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const progress = clamp(state.progress ?? 0, 0, 1);
    const phase = state.phase ?? 'preview';
    const isPreview = phase === 'preview';
    if (progress < previousProgress - 0.18 || (phase === 'running' && previousPhase === 'preview')) reset();
    const skipToEnd = progress > 0.8 && (progress - previousProgress > 0.35 || (phase === 'reveal' && previousPhase !== 'reveal'));
    simulationTime += dt;
    const time = simulationTime;
    const bounds = state.bounds ?? fallbackBounds;
    living.length = 0;
    victims.length = 0;
    for (const actor of actors) {
      if (actor.alive !== false) living.push(actor);
      // Every living student is exposed from the first arrival. The central
      // health system alone decides vulnerability and the eventual fatal case.
      if (actor.alive !== false && !protectedActor(actor)) victims.push(actor);
    }
    const focus = isPreview ? 0 : smooth(0.015, 0.075, progress);
    // Reveal still needs real mouth contact to resolve the selected participant.
    const contactPhase = (phase === 'running' || phase === 'reveal') && progress >= 0.055;
    const firstWave = isPreview ? 8 : Math.max(16, victims.length * 3);
    const activeCount = Math.min(count, Math.floor(firstWave + (count - firstWave) * smooth(0.025, 0.65, progress)));
    lastActiveCount = activeCount;
    for (const entry of instances) entry.object.count = activeCount * entry.multiple;
    gridHeads.fill(-1);
    for (let i = 0; i < activeCount; i++) {
      const rat = rats[i];
      if (!rat.active) {
        // Three initial pursuers per student arrive from that student's nearest
        // aperture. Assignment is independent of the chosen speaker.
        const assigned = victims.length ? victims[i % victims.length] : null;
        let vent = vents[rat.vent];
        if (assigned && i < victims.length * 3) {
          for (const candidate of vents) {
            if (Math.hypot(candidate.x - assigned.position.x, candidate.z - assigned.position.z) < Math.hypot(vent.x - assigned.position.x, vent.z - assigned.position.z)) vent = candidate;
          }
        }
        const across = (rat.bias - 0.5) * 1.06;
        rat.x = vent.x + Math.cos(vent.angle) * across + Math.sin(vent.angle) * 0.27;
        rat.z = vent.z - Math.sin(vent.angle) * across + Math.cos(vent.angle) * 0.27;
        rat.heading = vent.angle;
        rat.age = 0;
        rat.active = true;
        rat.tailReady = false;
      }
      rat.age += dt;
      const cell = cellZ(rat.z) * gridWidth + cellX(rat.x);
      gridNext[i] = gridHeads[cell];
      gridHeads[cell] = i;
    }
    for (let v = 0; v < vents.length; v++) {
      const open = smooth(0.015 + v * 0.012, 0.19 + v * 0.012, progress);
      vents[v].grille.position.y = open * 0.62;
      vents[v].grille.rotation.z = Math.sin(time * 26 + v) * 0.009 * (1 - open) * smooth(0, 0.04, progress);
    }
    alarm.emissiveIntensity = 0.9 + (0.5 + 0.5 * Math.sin(time * (progress > 0.75 ? 11 : 5))) * (0.7 + progress * 1.8);

    actorClock -= dt;
    if (phase === 'running' && actorClock <= 0) {
      actorClock = 0.58;
      for (let a = 0; a < living.length; a++) {
        const actor = living[a];
          const angle = a * 2.39996323 + time * 0.19;
          let fleeX = actor.position.x + Math.sin(angle) * 0.75;
          let fleeZ = actor.position.z + Math.cos(angle) * 0.75;
          let nearest = 1.4, nearX = 0, nearZ = 0;
          for (let i = 0; i < activeCount; i++) {
            const dx = actor.position.x - rats[i].x, dz = actor.position.z - rats[i].z;
            const distance = Math.hypot(dx, dz);
            if (distance < nearest) { nearest = distance; nearX = dx; nearZ = dz; }
          }
          if (nearest < 1.15) {
            const inverse = 1 / Math.max(nearest, 0.01);
            fleeX = actor.position.x + nearX * inverse * 1.35;
            fleeZ = actor.position.z + nearZ * inverse * 1.35;
            actor.setReaction?.('fear', 0.3 + (1.15 - nearest) * 0.45, 0.6);
          }
          actor.setTarget(clamp(fleeX, bounds.minX + 0.45, bounds.maxX - 0.45), clamp(fleeZ, bounds.minZ + 0.45, bounds.maxZ - 0.45));
          actor.setAction('run');
      }
    }

    for (let i = 0; i < activeCount; i++) {
      const rat = rats[i];
      const victim = victims.length ? victims[i % victims.length] : null;
      const person = victim;
      const canContact = contactPhase && victim?.alive !== false && victim !== null;
      let contactRecord;
      if (canContact) {
        contactRecord = contactStats.get(victim.id);
        if (!contactRecord) {
          contactRecord = { actorId: victim.id, firstArrivalElapsed: null, firstNoseContactElapsed: null, firstBiteElapsed: null, firstBiteProgress: null, biteCount: 0, damage: 0, lastPosition: null };
          contactStats.set(victim.id, contactRecord);
        }
      }
      rat.biteCooldown = Math.max(0, rat.biteCooldown - dt);
      rat.impactAge += dt;
      if (!canContact || rat.attackVictim !== victim) {
        rat.attackAge = -1;
        rat.attackVictim = null;
      }
      if (rat.attackAge >= 0) {
        rat.attackAge += dt;
        if (rat.attackAge > 0.51) { rat.attackAge = -1; rat.attackVictim = null; }
      }
      if (rat.attackAge >= 0) {
        const lift = smooth(0.055, 0.17, rat.attackAge) * (1 - smooth(0.28, 0.51, rat.attackAge));
        rat.altitude = rat.attackHeight * lift;
      } else rat.altitude = Math.max(0, rat.altitude - dt * 3.4);
      rat.navTimer -= dt;
      rat.pause = Math.max(0, rat.pause - dt);
      if (rat.navTimer <= 0) {
        rat.navTimer = 0.52 + random() * 0.95;
        rat.navAngle += (random() - 0.5) * 2.65;
        rat.navRadius = rat.radius * 0.66 + random() * 0.34;
        if (random() < 0.23 - focus * 0.13) rat.pause = 0.13 + random() * 0.27;
      }
      const orbit = rat.navAngle;
      let targetX, targetZ;
      if (person) {
        const radius = 0.65 + rat.navRadius * 1.2;
        targetX = person.position.x + Math.sin(orbit) * radius;
        targetZ = person.position.z + Math.cos(orbit) * radius;
      } else {
        targetX = Math.sin(orbit) * (halfW - 1.2) * (0.35 + rat.radius * 0.6);
        targetZ = Math.cos(orbit * 1.13) * (halfD - 1.2) * (0.35 + rat.radius * 0.6);
      }
      if (victim && focus > 0) {
        const crowdRadius = Math.min(2.65, 0.36 + Math.sqrt(activeCount / victims.length) * 0.118);
        // Brief coordinated recoil waves make the person's kicks/reactions legible.
        const recoil = smooth(0.78, 0.99, Math.sin(time * 2.05 + (i % victims.length) * 1.7));
        // A small inner group approaches the body; the remainder keeps the moving surround.
        const rank = Math.floor(i / victims.length);
        const seekingContact = canContact && (rank < 3 || (rank + Math.floor(time * 0.7)) % 4 === 0) && rat.biteCooldown <= 0;
        const radius = seekingContact ? 0.34 + rat.bias * 0.08 : 0.65 + Math.sqrt(rat.navRadius) * crowdRadius + recoil * 0.3;
        if (seekingContact) rat.pause = 0;
        const circleX = victim.position.x + Math.sin(orbit) * radius;
        const circleZ = victim.position.z + Math.cos(orbit) * radius * (0.84 + rat.bias * 0.2);
        targetX += (circleX - targetX) * focus;
        targetZ += (circleZ - targetZ) * focus;
      }
      if (canContact && rat.attackAge >= 0) {
        const toActorX = victim.position.x - rat.x, toActorZ = victim.position.z - rat.z;
        const toActorDistance = Math.hypot(toActorX, toActorZ);
        const inverseDistance = 1 / Math.max(toActorDistance, 0.001);
        // The nose reaches the surface while the body's center stays outside it.
        const mouthReach = 0.5 * rat.scale + 0.13;
        targetX = victim.position.x - toActorX * inverseDistance * mouthReach;
        targetZ = victim.position.z - toActorZ * inverseDistance * mouthReach;
        rat.pause = 0;
      }
      targetX = clamp(targetX, bounds.minX + 0.19, bounds.maxX - 0.19);
      targetZ = clamp(targetZ, bounds.minZ + 0.19, bounds.maxZ - 0.19);
      rat.targetX = targetX; rat.targetZ = targetZ;
      if (skipToEnd) {
        rat.x = targetX; rat.z = targetZ; rat.age = Math.max(rat.age, 0.3);
        rat.tailReady = false;
      }
      const dx = targetX - rat.x, dz = targetZ - rat.z;
      const distance = Math.hypot(dx, dz);
      const dart = 0.84 + Math.max(0, Math.sin(time * 2.9 + rat.phase)) * 0.22;
      const desiredSpeed = rat.pause > 0 ? 0 : rat.speed * dart * (1.24 + progress * 0.25) * Math.min(1, distance * 3.4);
      const inverse = distance > 0.0001 ? 1 / distance : 0;
      let desiredVX = dx * inverse * desiredSpeed, desiredVZ = dz * inverse * desiredSpeed;
      const cx = cellX(rat.x), cz = cellZ(rat.z);
      const forwardX = Math.sin(rat.heading), forwardZ = Math.cos(rat.heading);
      for (let gz = Math.max(0, cz - 1); gz <= Math.min(gridDepth - 1, cz + 1); gz++) {
        for (let gx = Math.max(0, cx - 1); gx <= Math.min(gridWidth - 1, cx + 1); gx++) {
          for (let neighbor = gridHeads[gz * gridWidth + gx]; neighbor !== -1; neighbor = gridNext[neighbor]) {
            if (neighbor === i) continue;
            const other = rats[neighbor];
            let offsetX = rat.x - other.x, offsetZ = rat.z - other.z;
            let separation = Math.hypot(offsetX, offsetZ);
            if (separation > 0.5) continue;
            if (separation < 0.001) {
              const sign = i > neighbor ? 1 : -1;
              offsetX = Math.sin((i + neighbor) * 2.4) * sign * 0.01;
              offsetZ = Math.cos((i + neighbor) * 2.4) * sign * 0.01;
              separation = 0.01;
            }
            const nx = offsetX / separation, nz = offsetZ / separation;
            const foreOverlap = (Math.abs(nx * forwardX + nz * forwardZ) + Math.abs(nx * Math.sin(other.heading) + nz * Math.cos(other.heading))) * 0.5;
            const spacing = (0.17 + foreOverlap * 0.18) * (rat.scale + other.scale) / 1.34;
            if (separation < spacing) {
              const repulsion = (spacing - separation) / spacing * 3.2;
              desiredVX += nx * repulsion; desiredVZ += nz * repulsion;
            }
            const aheadX = offsetX + (rat.vx - other.vx) * 0.12;
            const aheadZ = offsetZ + (rat.vz - other.vz) * 0.12;
            if (separation > spacing && Math.hypot(aheadX, aheadZ) < spacing * 0.85) {
              const side = forwardX * nz - forwardZ * nx > 0 ? -1 : 1;
              desiredVX += forwardZ * side * 0.46;
              desiredVZ -= forwardX * side * 0.46;
            }
          }
        }
      }
      for (const actor of living) {
        const offsetX = rat.x - actor.position.x, offsetZ = rat.z - actor.position.z;
        const separation = Math.hypot(offsetX, offsetZ);
        const safeRadius = actor === victim ? 0.21 : protectedActor(actor) ? 0.7 : 0.38;
        if (separation > 0.001 && separation < safeRadius) {
          const force = (safeRadius - separation) / safeRadius * 3.6 / separation;
          desiredVX += offsetX * force; desiredVZ += offsetZ * force;
        }
      }
      const commandSpeed = Math.min(4.2, Math.hypot(desiredVX, desiredVZ));
      let turn = 0;
      if (commandSpeed > 0.035) {
        const desiredHeading = Math.atan2(desiredVX, desiredVZ);
        turn = Math.atan2(Math.sin(desiredHeading - rat.heading), Math.cos(desiredHeading - rat.heading));
        const turnStep = clamp(turn, -dt * 8.5, dt * 8.5);
        rat.heading += turnStep;
        if (dt > 0) rat.turnRate = turnStep / dt;
      } else rat.turnRate *= Math.exp(-dt * 8);
      if (rat.attackAge >= 0 && canContact) {
        const biteHeading = Math.atan2(victim.position.x - rat.x, victim.position.z - rat.z);
        const biteTurn = Math.atan2(Math.sin(biteHeading - rat.heading), Math.cos(biteHeading - rat.heading));
        rat.heading += clamp(biteTurn, -dt * 12, dt * 12);
      }
      const turnBrake = 0.28 + 0.72 * Math.max(0, Math.cos(turn));
      const steering = 1 - Math.exp(-dt * 10);
      rat.vx += (Math.sin(rat.heading) * commandSpeed * turnBrake - rat.vx) * steering;
      rat.vz += (Math.cos(rat.heading) * commandSpeed * turnBrake - rat.vz) * steering;
      const oldX = rat.x, oldZ = rat.z;
      rat.x += rat.vx * dt;
      rat.z += rat.vz * dt;
      rat.x = clamp(rat.x, -halfW + 0.22, halfW - 0.22);
      rat.z = clamp(rat.z, -halfD + 0.22, halfD - 0.22);
      const velocity = Math.hypot(rat.vx, rat.vz);
      rat.travel = Math.hypot(rat.x - oldX, rat.z - oldZ);
      const cycleDistance = (0.19 + 0.025 * Math.min(velocity, 3.4)) * rat.scale / 0.56;
      rat.gait = (rat.gait + rat.travel / cycleDistance * Math.PI * 2) % (Math.PI * 2);
      if (canContact && dt > 0 && rat.attackAge < 0 && rat.biteCooldown <= 0 && rat.age > 0.4) {
        const toActor = Math.hypot(rat.x - victim.position.x, rat.z - victim.position.z);
        if (toActor < 0.72) {
          if (contactRecord.firstArrivalElapsed === null) contactRecord.firstArrivalElapsed = Number.isFinite(state.elapsed) ? state.elapsed : time;
          let limiter = biteLimits.get(victim.id);
          if (!limiter) {
            limiter = { lastAttack: -Infinity, lastBite: -Infinity, sequence: 0 };
            biteLimits.set(victim.id, limiter);
          }
          if (time - limiter.lastAttack >= 0.24 && time - limiter.lastBite >= biteInterval - 0.14) {
            const height = biteHeights[limiter.sequence % biteHeights.length] + smooth(0.35, 0.8, progress) * (limiter.sequence % 3 === 0 ? 0.24 : 0);
            rat.attackHeight = Math.max(0, (victim.position.y ?? floor) + height - floor - 0.01 - 0.14 * rat.scale);
            rat.attackAge = 0;
            rat.attackVictim = victim;
            rat.biteEmitted = false;
            rat.biteCooldown = 0.95 + rat.bias * 0.35;
            limiter.lastAttack = time;
            limiter.sequence++;
          }
        }
      }
      trailTail(rat, dt);
      drawRat(rat, i, time, progress);
      if (canContact && dt > 0 && rat.attackAge >= 0.15 && rat.attackAge <= 0.3 && !rat.biteEmitted) {
        const limiter = biteLimits.get(victim.id);
        noses.getMatrixAt(i, matrix);
        pos.setFromMatrixPosition(matrix);
        group.localToWorld(pos);
        const bodyDistance = Math.hypot(rat.x - victim.position.x, rat.z - victim.position.z);
        const mouthDistance = Math.hypot(pos.x - victim.position.x, pos.z - victim.position.z);
        const mouthTouches = bodyDistance < 0.69 && mouthDistance <= 0.255;
        if (mouthTouches && contactRecord.firstNoseContactElapsed === null) contactRecord.firstNoseContactElapsed = Number.isFinite(state.elapsed) ? state.elapsed : time;
        if (mouthTouches && time - limiter.lastBite >= biteInterval) {
          const inverseDistance = 1 / Math.max(bodyDistance, 0.001);
          const outwardX = (rat.x - victim.position.x) * inverseDistance;
          const outwardZ = (rat.z - victim.position.z) * inverseDistance;
          const upward = 0.34 + rat.bias * 0.2;
          const normalize = 1 / Math.sqrt(1 + upward * upward);
          ctx.effects?.emit?.('bite', {
            actorId: victim.id,
            kind: 'impact',
            damage: 2.6 + progress * 1.5,
            squishApplied: true,
            position: [pos.x, pos.y, pos.z],
            direction: [outwardX * normalize, upward * normalize, outwardZ * normalize],
            intensity: 0.55 + smooth(0.08, 1, progress) * 0.45,
            invincible: false,
            progress,
          });
          victim.setReaction?.('swarm', 0.65 + progress * 0.2, 0.32);
          victim.setExpression?.('scream', 0.7 + progress * 0.2, 0.32);
          victim.setSquish?.('bite', 0.55 + progress * 0.35, 0.34);
          limiter.lastBite = time;
          rat.biteEmitted = true;
          rat.impactAge = 0;
          if (contactRecord.firstBiteElapsed === null) {
            contactRecord.firstBiteElapsed = Number.isFinite(state.elapsed) ? state.elapsed : time;
            contactRecord.firstBiteProgress = progress;
          }
          contactRecord.biteCount++;
          contactRecord.damage += 2.6 + progress * 1.5;
          contactRecord.lastPosition = [pos.x, pos.y, pos.z];
        }
      }
    }
    for (const { object } of instances) object.instanceMatrix.needsUpdate = true;
    previousProgress = progress;
    previousPhase = phase;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    // InstancedMesh.dispose releases its renderer-side instance buffers too.
    for (const { object } of instances) object.dispose();
    for (const object of hardwareInstances) object.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    group.clear();
    biteLimits.clear();
    contactStats.clear();
  }

  return { update, dispose, get stats() { return { activeRats: lastActiveCount, biteInterval, students: [...contactStats.values()].map(record => ({ ...record, lastPosition: record.lastPosition?.slice() ?? null })) }; } };
}

