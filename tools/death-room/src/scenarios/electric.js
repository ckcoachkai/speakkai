import * as THREE from 'three';

// A self-contained industrial switching chamber. The host owns actor life/death.
export default function createScenario(ctx) {
  const { group, actors, room } = ctx;
  const root = new THREE.Group();
  root.name = 'electric-switching-chamber';
  group.add(root);
  const floorY = room.floorY || 0;
  const geometries = new Set();
  const materials = new Set();
  const geometry = (g) => { geometries.add(g); return g; };
  const standard = (p) => { const m = new THREE.MeshStandardMaterial(p); materials.add(m); return m; };
  const basic = (p) => { const m = new THREE.MeshBasicMaterial(p); materials.add(m); return m; };
  const metal = standard({ color: 0x343d49, metalness: 0.88, roughness: 0.32 });
  const darkMetal = standard({ color: 0x111923, metalness: 0.78, roughness: 0.4 });
  const steel = standard({ color: 0xa2adb7, metalness: 0.94, roughness: 0.24 });
  const copper = standard({ color: 0xaa6942, metalness: 0.9, roughness: 0.27 });
  const porcelain = standard({ color: 0xc9d6cc, metalness: 0.04, roughness: 0.23 });
  const cabinetPaint = standard({ color: 0x53616a, metalness: 0.64, roughness: 0.39 });
  const black = standard({ color: 0x050b11, metalness: 0.32, roughness: 0.65 });
  const yellow = standard({ color: 0xe4b836, metalness: 0.36, roughness: 0.46 });
  const amber = standard({ color: 0xf9a522, emissive: 0xff9308, emissiveIntensity: 0.3, roughness: 0.3 });
  const cyan = standard({ color: 0x9bd8ff, emissive: 0x338bff, emissiveIntensity: 0.4, metalness: 0.35, roughness: 0.25 });
  const red = standard({ color: 0xa80c12, emissive: 0xff1711, emissiveIntensity: 0.25 });
  const glowMaterial = basic({ color: 0x448aff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
  const arcGlowMaterial = basic({ color: 0x168dff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
  const arcCoreMaterial = basic({ color: 0xcaf5ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const panelLightMaterial = basic({ color: 0xffffff, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false });
  const panelWarningMaterial = basic({ color: 0xffffff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const dummy = new THREE.Object3D();
  const vecA = new THREE.Vector3();
  const axis = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  let randomState = 0x367b26c1;
  const random = () => { randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5; return (randomState >>> 0) / 4294967296; };
  const boxGeometry = geometry(new THREE.BoxGeometry(1, 1, 1));
  const cylinderGeometry = geometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const boltGeometry = geometry(new THREE.CylinderGeometry(0.035, 0.035, 0.028, 6));
  const mesh = (g, m, x, y, z, sx = 1, sy = 1, sz = 1, parent = root) => {
    const object = new THREE.Mesh(g, m);
    object.position.set(x, y, z); object.scale.set(sx, sy, sz);
    object.castShadow = true; object.receiveShadow = true;
    parent.add(object); return object;
  };
  const box = (m, x, y, z, sx, sy, sz, parent = root) => mesh(boxGeometry, m, x, y, z, sx, sy, sz, parent);
  const cylinder = (m, x, y, z, r, h, parent = root) => mesh(cylinderGeometry, m, x, y, z, r, h, r, parent);
  const instanced = (g, m, count) => { const object = new THREE.InstancedMesh(g, m, count); object.castShadow = false; object.receiveShadow = true; root.add(object); return object; };
  const setInstance = (object, index, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
    dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); object.setMatrixAt(index, dummy.matrix);
  };
  const pipe = (points, radius, material = copper) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const result = mesh(geometry(new THREE.TubeGeometry(curve, Math.max(16, points.length * 10), radius, 7, false)), material, 0, 0, 0);
    return result;
  };

  // Thirty insulated tiles have separate conductor grids and individually pulsing edges.
  const columns = 6, rows = 5, panelCount = columns * rows;
  const panels = new Float32Array(panelCount * 2);
  const tileBases = instanced(boxGeometry, darkMetal, panelCount);
  const tilePlates = instanced(boxGeometry, metal, panelCount);
  const tileConductors = instanced(boxGeometry, steel, panelCount * 6);
  const tileEdges = instanced(boxGeometry, panelLightMaterial, panelCount * 4);
  const floorBolts = instanced(boltGeometry, steel, panelCount * 4);
  const edgeColors = new Float32Array(panelCount);
  let panel = 0;
  for (let zIndex = 0; zIndex < rows; zIndex++) for (let xIndex = 0; xIndex < columns; xIndex++) {
    const x = (xIndex - 2.5) * 1.96, z = (zIndex - 2) * 1.92 + 0.26;
    panels[panel * 2] = x; panels[panel * 2 + 1] = z;
    setInstance(tileBases, panel, x, floorY + 0.012, z, 1.91, 0.024, 1.87);
    setInstance(tilePlates, panel, x, floorY + 0.025, z, 1.77, 0.018, 1.73);
    for (let stripe = 0; stripe < 6; stripe++) setInstance(tileConductors, panel * 6 + stripe, x + (stripe - 2.5) * 0.245, floorY + 0.037, z, 0.035, 0.009, 1.46);
    setInstance(tileEdges, panel * 4, x - 0.865, floorY + 0.041, z, 0.022, 0.012, 1.73);
    setInstance(tileEdges, panel * 4 + 1, x + 0.865, floorY + 0.041, z, 0.022, 0.012, 1.73);
    setInstance(tileEdges, panel * 4 + 2, x, floorY + 0.041, z - 0.865, 1.73, 0.012, 0.022);
    setInstance(tileEdges, panel * 4 + 3, x, floorY + 0.041, z + 0.865, 1.73, 0.012, 0.022);
    for (let b = 0; b < 4; b++) setInstance(floorBolts, panel * 4 + b, x + (b % 2 ? 0.8 : -0.8), floorY + 0.043, z + (b < 2 ? -0.8 : 0.8), 1, 0.6, 1);
    panel++;
  }
  // Hazard tape borders stop before the open camera side.
  const hazardStripes = instanced(boxGeometry, yellow, 44);
  let hazardIndex = 0;
  for (const side of [-1, 1]) for (let i = 0; i < 22; i++) {
    setInstance(hazardStripes, hazardIndex++, side * 6.02, floorY + 0.03, -4.65 + i * 0.43, 0.25, 0.025, 0.14, 0, side * -0.52, 0);
  }
  box(darkMetal, -6.02, floorY + 0.016, 0, 0.38, 0.025, 9.8);
  box(darkMetal, 6.02, floorY + 0.016, 0, 0.38, 0.025, 9.8);

  const terminals = [];
  const coronas = [];
  const needles = [];
  const gapRotors = [];
  const toroidGeometry = geometry(new THREE.TorusGeometry(0.65, 0.175, 12, 36));
  const insulatorGeometry = geometry(new THREE.CylinderGeometry(0.42, 0.31, 0.12, 20));
  const ringGeometry = geometry(new THREE.TorusGeometry(0.34, 0.025, 6, 20));
  const sphereGeometry = geometry(new THREE.SphereGeometry(1, 16, 12));
  const coronaGeometry = geometry(new THREE.IcosahedronGeometry(1, 2));
  const cabinetBolts = [];
  for (const side of [-1, 1]) {
    const x = side * 5.3, z = -4.52;
    box(darkMetal, x, 0.19, z, 1.5, 0.38, 1.48);
    box(steel, x, 0.405, z, 1.36, 0.05, 1.34);
    box(cabinetPaint, x, 0.94, z, 1.11, 1.03, 1.08);
    box(black, x, 0.94, z + 0.55, 0.91, 0.75, 0.025);
    for (let vent = 0; vent < 8; vent++) box(steel, x, 0.65 + vent * 0.083, z + 0.572, 0.84, 0.017, 0.018);
    for (const bx of [-0.58, 0.58]) for (const bz of [-0.58, 0.58]) cabinetBolts.push([x + bx, 0.44, z + bz, 0]);
    cylinder(copper, x, 2.8, z, 0.19, 2.67);
    cylinder(porcelain, x, 2.6, z, 0.255, 2.35);
    for (let fin = 0; fin < 15; fin++) {
      mesh(insulatorGeometry, porcelain, x, 1.54 + fin * 0.154, z);
      const ring = mesh(ringGeometry, copper, x, 1.6 + fin * 0.154, z);
      ring.rotation.x = Math.PI / 2;
    }
    cylinder(steel, x, 3.92, z, 0.27, 0.24);
    const toroid = mesh(toroidGeometry, steel, x, 4.19, z); toroid.rotation.x = Math.PI / 2;
    mesh(sphereGeometry, steel, x, 4.32, z, 0.25, 0.25, 0.25);
    cylinder(copper, x, 4.58, z, 0.045, 0.46);
    mesh(sphereGeometry, cyan, x, 4.84, z, 0.09, 0.09, 0.09);
    const terminal = new THREE.Vector3(x, 4.86, z);
    terminals.push(terminal);
    const corona = mesh(coronaGeometry, glowMaterial, x, 4.86, z, 0.28, 0.28, 0.28);
    corona.castShadow = false; coronas.push(corona);
    // Grounding braids and a ceramic-mounted spark gap flank each tower.
    pipe([[x, 0.6, z - 0.55], [x + side * 0.58, 0.35, z - 0.55], [x + side * 0.75, 0.11, z], [x + side * 0.75, 0.1, z + 1.0]], 0.036);
    const gapX = x - side * 0.9;
    cylinder(porcelain, gapX, 0.47, z + 0.32, 0.13, 0.8);
    const rotor = new THREE.Group(); rotor.position.set(gapX, 0.94, z + 0.32); root.add(rotor);
    for (let spoke = 0; spoke < 6; spoke++) {
      const angle = spoke * Math.PI / 3;
      box(copper, Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2, 0.42, 0.035, 0.035, rotor).rotation.y = -angle;
    }
    gapRotors.push(rotor);
    // Oil-filled transformer, cooling fins and glazed bushings along each side wall.
    const tx = side * 6.27, tz = -1.92;
    box(darkMetal, tx, 0.15, tz, 0.94, 0.3, 1.66);
    box(cabinetPaint, tx, 0.9, tz, 0.76, 1.36, 1.42);
    for (let fin = 0; fin < 10; fin++) box(steel, tx - side * 0.43, 0.92, tz - 0.62 + fin * 0.138, 0.2, 1.08, 0.044);
    for (const oz of [-0.43, 0.43]) {
      cylinder(copper, tx, 1.94, tz + oz, 0.055, 0.65);
      for (let b = 0; b < 4; b++) cylinder(porcelain, tx, 1.67 + b * 0.13, tz + oz, 0.14, 0.075);
    }
    pipe([[tx, 2.25, tz - 0.43], [tx, 3.06, tz - 0.72], [x + side * 0.4, 3.31, z + 0.52], [x, 3.57, z]], 0.04, black);
  }

  // Three switchgear cabinets: recesses, gauges, bus bars, handles, vents and warning plates.
  const gaugeGeometry = geometry(new THREE.CylinderGeometry(0.18, 0.18, 0.035, 24));
  const lightningShape = new THREE.Shape();
  lightningShape.moveTo(0.02, 0.25); lightningShape.lineTo(-0.13, 0.015); lightningShape.lineTo(-0.015, 0.015);
  lightningShape.lineTo(-0.06, -0.24); lightningShape.lineTo(0.15, 0.055); lightningShape.lineTo(0.04, 0.055); lightningShape.closePath();
  const lightningGeometry = geometry(new THREE.ShapeGeometry(lightningShape));
  const panelWarnings = instanced(geometry(new THREE.PlaneGeometry(1.69, 1.65)), panelWarningMaterial, panelCount);
  const panelSymbols = instanced(lightningGeometry, panelLightMaterial, panelCount);
  for (let i = 0; i < panelCount; i++) {
    setInstance(panelWarnings, i, panels[i * 2], floorY + 0.045, panels[i * 2 + 1], 1, 1, 1, -Math.PI / 2);
    setInstance(panelSymbols, i, panels[i * 2] + 0.59, floorY + 0.049, panels[i * 2 + 1] + 0.49, 0.58, 0.58, 0.58, -Math.PI / 2);
  }
  const lightGeometry = geometry(new THREE.SphereGeometry(0.055, 10, 8));
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 1.78, z = -5.55;
    box(darkMetal, x, 0.14, z, 1.62, 0.28, 0.77);
    box(cabinetPaint, x, 1.62, z, 1.51, 2.72, 0.63);
    box(steel, x, 3.01, z, 1.6, 0.065, 0.73);
    box(darkMetal, x, 1.61, z + 0.326, 1.36, 2.49, 0.03);
    box(cabinetPaint, x, 1.62, z + 0.35, 1.29, 2.4, 0.035);
    box(black, x, 2.38, z + 0.381, 1.08, 0.59, 0.022);
    for (const gx of [-0.28, 0.28]) {
      const gauge = mesh(gaugeGeometry, steel, x + gx, 2.4, z + 0.4); gauge.rotation.x = Math.PI / 2;
      const face = mesh(gaugeGeometry, porcelain, x + gx, 2.4, z + 0.423, 0.83, 0.8, 0.83); face.rotation.x = Math.PI / 2;
      const needlePivot = new THREE.Group(); needlePivot.position.set(x + gx, 2.4, z + 0.45); root.add(needlePivot);
      box(red, 0, 0.055, 0, 0.012, 0.125, 0.012, needlePivot); needles.push(needlePivot);
      for (let tick = 0; tick < 7; tick++) {
        const a = (tick / 6 * 1.5 - 0.75) * Math.PI;
        const mark = box(darkMetal, x + gx + Math.sin(a) * 0.118, 2.4 + Math.cos(a) * 0.118, z + 0.443, 0.012, 0.027, 0.008); mark.rotation.z = -a;
      }
    }
    for (let lamp = 0; lamp < 4; lamp++) {
      const lx = x - 0.41 + lamp * 0.27;
      const bezel = cylinder(steel, lx, 1.94, z + 0.41, 0.078, 0.045); bezel.rotation.x = Math.PI / 2;
      mesh(lightGeometry, lamp === 3 ? red : cyan, lx, 1.94, z + 0.447);
    }
    box(black, x + 0.47, 1.43, z + 0.41, 0.085, 0.44, 0.04);
    box(steel, x + 0.47, 1.43, z + 0.46, 0.055, 0.32, 0.06);
    box(yellow, x - 0.1, 1.35, z + 0.383, 0.54, 0.62, 0.013);
    mesh(lightningGeometry, black, x - 0.1, 1.35, z + 0.397);
    for (let vent = 0; vent < 7; vent++) box(black, x, 0.52 + vent * 0.058, z + 0.381, 0.92, 0.024, 0.012);
    for (const bx of [-0.59, 0.59]) for (const by of [0.52, 2.7]) cabinetBolts.push([x + bx, by, z + 0.392, Math.PI / 2]);
    cylinder(porcelain, x, 3.22, z, 0.125, 0.35);
    cylinder(copper, x, 3.5, z, 0.055, 0.36);
    pipe([[x, 3.63, z], [x, 3.92, z], [x + 0.25, 4.03, z], [3.92, 4.03, z], [4.38, 4.14, z + 0.31]], 0.032);
  }
  const cabinetFasteners = instanced(boltGeometry, steel, cabinetBolts.length);
  cabinetBolts.forEach((p, i) => setInstance(cabinetFasteners, i, p[0], p[1], p[2], 1, 1, 1, p[3]));
  // Back wall bus rails and warning beacons leave the open front unobstructed.
  for (const y of [4.57, 4.84]) {
    pipe([[-4.25, y, -5.65], [-2.8, y, -5.65], [2.8, y, -5.65], [4.25, y, -5.65]], 0.045, copper);
    for (const x of [-3.7, 0, 3.7]) {
      const insulator = cylinder(porcelain, x, y, -5.77, 0.095, 0.22); insulator.rotation.x = Math.PI / 2;
    }
  }
  for (const x of [-3.2, 3.2]) {
    box(darkMetal, x, 3.35, -5.51, 0.44, 0.075, 0.42);
    cylinder(steel, x, 3.43, -5.51, 0.17, 0.13);
    cylinder(amber, x, 3.61, -5.51, 0.14, 0.24);
    mesh(sphereGeometry, amber, x, 3.73, -5.51, 0.14, 0.09, 0.14);
  }

  // Consolidate repeated static fittings; dozens of bolts/fins need only a few draws.
  const batches = new Map();
  for (const object of root.children) {
    if (!object.isMesh || object.isInstancedMesh || coronas.includes(object)) continue;
    const key = `${object.geometry.uuid}/${object.material.uuid}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  }
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const batch = instanced(objects[0].geometry, objects[0].material, objects.length);
    batch.castShadow = true;
    objects.forEach((object, i) => { object.updateMatrix(); batch.setMatrixAt(i, object.matrix); root.remove(object); });
  }

  // Instanced tapered segments give real width to the arcs on every renderer.
  const maxSegments = ctx.quality === 'low' ? 420 : 680;
  const arcGeometry = geometry(new THREE.CylinderGeometry(0.72, 1, 1, 5, 1));
  const arcGlow = instanced(arcGeometry, arcGlowMaterial, maxSegments);
  const arcCore = instanced(arcGeometry, arcCoreMaterial, maxSegments);
  arcGlow.name = 'electric-arc-glow'; arcCore.name = 'electric-arc-core';
  arcGlow.frustumCulled = false; arcCore.frustumCulled = false;
  arcGlow.instanceMatrix.setUsage(THREE.DynamicDrawUsage); arcCore.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  arcGlow.count = 0; arcCore.count = 0;
  let segmentCount = 0;
  const arcPoints = new Float32Array(25 * 3);
  const addSegment = (x1, y1, z1, x2, y2, z2, width) => {
    if (segmentCount >= maxSegments) return;
    vecA.set(x2 - x1, y2 - y1, z2 - z1);
    const length = vecA.length();
    if (length < 0.001) return;
    dummy.position.set((x1 + x2) * 0.5, (y1 + y2) * 0.5, (z1 + z2) * 0.5);
    dummy.quaternion.setFromUnitVectors(axis, vecA.multiplyScalar(1 / length));
    dummy.scale.set(width * 4.3, length * 1.035, width * 4.3); dummy.updateMatrix(); arcGlow.setMatrixAt(segmentCount, dummy.matrix);
    dummy.scale.set(width, length * 1.03, width); dummy.updateMatrix(); arcCore.setMatrixAt(segmentCount, dummy.matrix);
    segmentCount++;
  };
  const addArc = (sx, sy, sz, ex, ey, ez, power, branches = true) => {
    const dx = ex - sx, dy = ey - sy, dz = ez - sz;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const count = Math.min(24, Math.max(5, Math.ceil(length * 3.1)));
    // Two perpendicular directions produce sharp lateral kinks rather than a noisy tube.
    const inverseLength = 1 / Math.max(length, 0.001);
    const ux = dx * inverseLength, uy = dy * inverseLength, uz = dz * inverseLength;
    const planar = Math.sqrt(ux * ux + uz * uz);
    const px = planar > 0.01 ? -uz / planar : 1;
    const pz = planar > 0.01 ? ux / planar : 0;
    const qx = uy * pz, qy = uz * px - ux * pz, qz = -uy * px;
    for (let j = 0; j <= count; j++) {
      const t = j / count, wobble = Math.sin(t * Math.PI) * Math.min(0.39, length * 0.066);
      const side = (random() - 0.5) * wobble * 2;
      const depth = (random() - 0.5) * wobble * 1.6;
      const index = j * 3;
      arcPoints[index] = sx + dx * t + px * side + qx * depth;
      arcPoints[index + 1] = sy + dy * t + qy * depth;
      arcPoints[index + 2] = sz + dz * t + pz * side + qz * depth;
      if (j > 0) addSegment(arcPoints[index - 3], arcPoints[index - 2], arcPoints[index - 1], arcPoints[index], arcPoints[index + 1], arcPoints[index + 2], 0.009 + power * 0.012);
    }
    if (!branches) return;
    for (let b = 0; b < 4; b++) {
      const p = (2 + Math.floor(random() * Math.max(1, count - 4))) * 3;
      const bx = arcPoints[p], by = arcPoints[p + 1], bz = arcPoints[p + 2];
      const spread = 0.43 + random() * 0.7, direction = random() < 0.5 ? -1 : 1;
      const ox = px * spread * direction + qx * (random() - 0.5) * spread;
      const oy = qy * (random() - 0.5) * spread + uy * 0.13;
      const oz = pz * spread * direction + qz * (random() - 0.5) * spread;
      const mx = bx + ox * 0.48, my = Math.max(0.08, by + oy * 0.42), mz = bz + oz * 0.48;
      const fx = bx + ox * 0.77 + ux * 0.12, fy = Math.max(0.07, by + oy * 0.73), fz = bz + oz * 0.77 + uz * 0.12;
      const tx = bx + ox, ty = Math.max(0.065, by + oy), tz = bz + oz;
      addSegment(bx, by, bz, mx, my, mz, 0.0075);
      addSegment(mx, my, mz, fx, fy, fz, 0.0048);
      addSegment(fx, fy, fz, tx, ty, tz, 0.0028);
      // A thinner tertiary fork and a few detached ion sparks finish each streamer.
      if (b % 2 === 0) {
        addSegment(mx, my, mz, mx + qx * 0.24 + ux * 0.15, Math.max(0.065, my + qy * 0.24 + 0.1), mz + qz * 0.24 + uz * 0.15, 0.0034);
        if (power > 0.7 && random() > 0.65) emitSparks(tx, ty, tz, 1, 0.23);
      }
    }
  };

  const sparkCount = ctx.quality === 'low' ? 140 : 300;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkColors = new Float32Array(sparkCount * 3);
  const sparkVelocities = new Float32Array(sparkCount * 3);
  const sparkLife = new Float32Array(sparkCount);
  const sparkWarmth = new Float32Array(sparkCount);
  const streakPositions = new Float32Array(sparkCount * 6);
  const streakColors = new Float32Array(sparkCount * 6);
  sparkPositions.fill(-100);
  const sparkGeometry = geometry(new THREE.BufferGeometry());
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3).setUsage(THREE.DynamicDrawUsage));
  sparkGeometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3).setUsage(THREE.DynamicDrawUsage));
  const sparkMaterial = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.96, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  materials.add(sparkMaterial);
  const sparks = new THREE.Points(sparkGeometry, sparkMaterial); sparks.frustumCulled = false; root.add(sparks);
  const streakGeometry = geometry(new THREE.BufferGeometry());
  streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3).setUsage(THREE.DynamicDrawUsage));
  streakGeometry.setAttribute('color', new THREE.BufferAttribute(streakColors, 3).setUsage(THREE.DynamicDrawUsage));
  const streakMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false });
  materials.add(streakMaterial);
  const streaks = new THREE.LineSegments(streakGeometry, streakMaterial); streaks.frustumCulled = false; root.add(streaks);
  let sparkCursor = 0;
  const emitSparks = (x, y, z, count, power = 1, warmth = 0) => {
    for (let s = 0; s < count; s++) {
      const n = sparkCursor++ % sparkCount, i = n * 3;
      sparkPositions[i] = x; sparkPositions[i + 1] = y; sparkPositions[i + 2] = z;
      sparkVelocities[i] = (random() - 0.5) * 5 * power;
      sparkVelocities[i + 1] = (1.1 + random() * 3.4) * power;
      sparkVelocities[i + 2] = (random() - 0.5) * 5 * power;
      sparkLife[n] = 0.23 + random() * 0.5;
      sparkWarmth[n] = warmth;
    }
  };
  const contactGeometry = geometry(new THREE.RingGeometry(0.26, 0.37, 24));
  const contactMaterial = basic({ color: 0x77cfff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const contacts = instanced(contactGeometry, contactMaterial, 50); contacts.frustumCulled = false; contacts.count = 0;
  contacts.name = 'electric-ground-contacts';
  contacts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const impactMaterial = basic({ color: 0x72caff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
  const impacts = instanced(coronaGeometry, impactMaterial, 50); impacts.frustumCulled = false; impacts.count = 0;
  impacts.name = 'electric-impact-coronas';
  impacts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const electricalLight = new THREE.PointLight(0x4b9dff, 0, 17, 2);
  electricalLight.position.set(0, 3.8, -1.0); root.add(electricalLight);
  const flashLight = new THREE.PointLight(0xaedcff, 0, 11, 2);
  flashLight.position.set(0, 1.8, 0); root.add(flashLight);
  const exposedActors = [];
  const warnedActors = new Set();
  const reactionTimes = new Map();
  const activeContacts = new Map();
  const contactPoint = new THREE.Vector3();
  let arcClock = 0, tick = 0, lastProgress = 0, lastElapsed = 0, contactCursor = 0, nextContactTime = 0, lastPhase = 'preview', disposed = false;
  const canContact = actor => actor.alive !== false && !actor.invincible && actor.id !== 'vip-456'
    && actor.action !== 'fall' && actor.action !== 'dead' && actor.position
    && Number.isFinite(actor.position.x) && Number.isFinite(actor.position.y) && Number.isFinite(actor.position.z);
  const chestPosition = actor => {
    if (actor.chestAnchor?.localToWorld) {
      contactPoint.set(0, 0, actor.chestAnchor.userData?.frontSurfaceZ ?? 0.14);
      actor.chestAnchor.localToWorld(contactPoint);
    } else contactPoint.copy(actor.position).addScaledVector(axis, 1.08);
    contactPoint.y = Math.max(floorY + 0.3, contactPoint.y);
    return contactPoint;
  };

  function update(dt, state) {
    if (disposed || state.phase === 'paused' || state.paused === true) return;
    dt = Math.max(0, Math.min(0.1, Number.isFinite(dt) ? dt : 0));
    const p = THREE.MathUtils.clamp(state.progress || 0, 0, 1);
    const time = Number.isFinite(state.elapsed) ? state.elapsed : 0;
    const running = state.phase === 'running';
    const preview = state.phase === 'preview';
    const advancing = dt > 0 && time > lastElapsed + 0.00001;
    const charge = THREE.MathUtils.smoothstep(p, 0.015, 0.72);
    const strike = preview ? 0 : THREE.MathUtils.smoothstep(p, 0.025, 0.12) * (0.3 + 0.7 * THREE.MathUtils.smoothstep(p, 0.12, 0.88));
    const warning = preview ? 0 : THREE.MathUtils.smoothstep(p, 0.01, 0.13);
    const afterglow = state.phase === 'complete' ? 0.22 : state.phase === 'reveal' ? 0.62 : 1;
    const pulse = 0.5 + Math.sin(time * (2.5 + charge * 1.1)) * 0.5;
    // Smooth 1.16 Hz discharge envelopes; topology moves quickly, room brightness does not.
    const cyclePosition = ((time + 0.16) % 0.86) / 0.86;
    const discharge = cyclePosition < 0.69 ? Math.sin(cyclePosition / 0.69 * Math.PI) ** 2 : 0;
    const shimmer = 0.92 + Math.sin(time * 22.1) * 0.04 + Math.sin(time * 31.7) * 0.025;
    if (p < lastProgress - 0.15 || time < lastElapsed - 0.1 || (running && lastPhase === 'preview')) {
      warnedActors.clear(); reactionTimes.clear(); activeContacts.clear(); sparkLife.fill(0); contactCursor = 0; nextContactTime = time;
      arcCore.count = 0; arcGlow.count = 0;
      arcClock = 1 / 18; tick = 0;
    }
    if (Math.abs(p - lastProgress) > 0.05) arcClock = 1 / 18;
    lastProgress = p; lastElapsed = time; lastPhase = state.phase;
    exposedActors.length = 0;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      // Exposure is shared. Selection and vulnerability belong to central health.
      // Deliberately never consult victimIds, even if malformed or containing 456.
      if (canContact(actor)) exposedActors.push(actor);
    }
    for (const [id, contact] of activeContacts) if (time > contact.until || !canContact(contact.actor) || preview) activeContacts.delete(id);
    amber.emissiveIntensity = 0.25 + pulse * (0.6 + charge * 1.8);
    cyan.emissiveIntensity = 0.35 + charge * 2.4 + strike * discharge * 1.7;
    red.emissiveIntensity = 0.2 + pulse * charge * 1.8;
    glowMaterial.opacity = (0.06 + charge * 0.15 + strike * discharge * 0.045) * afterglow;
    arcGlowMaterial.opacity = (0.16 + strike * discharge * 0.12) * afterglow;
    arcCoreMaterial.opacity = (0.73 + discharge * 0.15) * shimmer * afterglow;
    electricalLight.intensity = (charge * 4.4 + strike * (1.6 + discharge * 4)) * afterglow;
    flashLight.intensity = strike * discharge * 12 * afterglow;
    for (let i = 0; i < coronas.length; i++) {
      const radius = 0.2 + charge * 0.22 + discharge * strike * 0.06;
      coronas[i].scale.setScalar(radius); coronas[i].rotation.y = time * 0.9;
    }
    for (let i = 0; i < gapRotors.length; i++) gapRotors[i].rotation.y += dt * (2 + charge * 25);
    for (let i = 0; i < needles.length; i++) needles[i].rotation.z = 1.1 - charge * 2.15 + Math.sin(time * 15 + i) * charge * 0.14;

    edgeColors.fill(0);
    contacts.count = Math.min(50, exposedActors.length);
    impacts.count = activeContacts.size;
    contacts.visible = strike > 0.01;
    impacts.visible = strike > 0.01;
    for (let i = 0; i < exposedActors.length; i++) {
      const a = exposedActors[i].position;
      if (!a) continue;
      const col = Math.max(0, Math.min(columns - 1, Math.round(a.x / 1.96 + 2.5)));
      const row = Math.max(0, Math.min(rows - 1, Math.round((a.z - 0.26) / 1.92 + 2)));
      edgeColors[row * columns + col] = warning;
      if (i < 50) {
        const radius = 0.9 + Math.sin(time * 4 + i) * 0.08 + strike * 0.4;
        setInstance(contacts, i, a.x, floorY + 0.06, a.z, radius, radius, radius, -Math.PI / 2);
      }
    }
    contacts.instanceMatrix.needsUpdate = true;
    impacts.instanceMatrix.needsUpdate = true;
    impactMaterial.opacity = strike * discharge * 0.16 * afterglow;
    contactMaterial.opacity = strike * (0.23 + discharge * 0.3) * afterglow;
    for (let i = 0; i < panelCount; i++) {
      const wave = 0.5 + Math.sin(time * (2.1 + charge * 1.8) - i * 0.68) * 0.5;
      const active = edgeColors[i];
      if (active > 0.01 && strike > 0.12) tint.setRGB(0.14 + discharge * 0.3, 0.58 + discharge * 0.2, 1);
      else if (active > 0.01) tint.setRGB(1, 0.32 + pulse * 0.22, 0.015);
      else if (charge > 0.6 && wave > 0.77) tint.setRGB(0.05, 0.24 + charge * 0.3, 0.7);
      else tint.setRGB(0.15 + wave * 0.7, 0.045 + wave * 0.29, 0.004);
      tint.multiplyScalar(afterglow * (0.25 + 0.75 * Math.max(wave, active)));
      for (let e = 0; e < 4; e++) tileEdges.setColorAt(i * 4 + e, tint);
      panelSymbols.setColorAt(i, tint);
      tint.multiplyScalar(active > 0.01 ? 0.44 + discharge * strike * 0.2 : 0.1);
      panelWarnings.setColorAt(i, tint);
    }
    tileEdges.instanceColor.needsUpdate = true;
    panelWarnings.instanceColor.needsUpdate = true; panelSymbols.instanceColor.needsUpdate = true;

    arcClock += dt;
    // Refresh shape at 18 Hz; slow discharge envelopes control ignition and brightness.
    if (arcClock >= 1 / 18 || tick === 0) {
      arcClock %= 1 / 18; tick++; segmentCount = 0;
      if (charge > 0.04) {
        for (let i = 0; i < terminals.length; i++) {
          const t = terminals[i], side = i ? 1 : -1;
          const az = time * 7 + i * 2;
          addArc(t.x, t.y, t.z, t.x + Math.cos(az) * (0.25 + charge * 0.55), t.y + Math.sin(az * 0.73) * 0.35, t.z + Math.sin(az) * 0.5, charge * 0.5, false);
          if (charge > 0.4 && discharge > 0.3) addArc(t.x, t.y, t.z, t.x - side * 0.9, 0.96, t.z + 0.32, charge * 0.65, true);
        }
      }
      if (charge > 0.52 && discharge > 0.36 && tick % 2 === 0) {
        const t = terminals[Math.floor(tick / 2) % 2];
        const index = Math.floor(random() * panelCount);
        const x = panels[index * 2], z = panels[index * 2 + 1];
        let occupied = false;
        for (let i = 0; i < actors.length; i++) {
          const a = actors[i].position;
          if (a && actors[i].alive !== false && (a.x - x) ** 2 + (a.z - z) ** 2 < 1.05) { occupied = true; break; }
        }
        if (!occupied) {
          addArc(t.x, t.y, t.z, x, floorY + 0.09, z, charge, true);
          emitSparks(x, floorY + 0.09, z, 7, 0.6, 0.8);
        }
      }
      if (strike > 0.02 && exposedActors.length && discharge > 0.1 && running && advancing && time >= nextContactTime) {
        // At most one new contact per 0.20 s, spread across the living roster.
        // This reaches all eight students early without an eight-voice burst.
        for (let attempt = 0; attempt < exposedActors.length; attempt++) {
          const actor = exposedActors[contactCursor % exposedActors.length];
          contactCursor = (contactCursor + 1) % exposedActors.length;
          if (time - (reactionTimes.get(actor.id) ?? -10) < 1.7) continue;
          activeContacts.set(actor.id, {actor, until: time + 0.32});
          reactionTimes.set(actor.id, time); nextContactTime = time + 0.2;
          const pos = chestPosition(actor);
          if (!warnedActors.has(actor.id)) { actor.setAction?.('panic'); warnedActors.add(actor.id); }
          actor.setReaction?.('shock', 0.25 + strike * 0.55, 0.26);
          actor.setExpression?.('scream', 0.35 + strike * 0.5, 0.32);
          ctx.effects?.emit?.('electric-strike', {actorId: actor.id, position: [pos.x, pos.y, pos.z], intensity: 0.3 + strike * 0.7, progress: p, damageHP: 6 + strike * 6, kind: 'electric', invincible: false});
          break;
        }
      }
      if (strike > 0.02 && activeContacts.size) {
        let impactIndex = 0;
        for (const {actor} of activeContacts.values()) {
          const pos = chestPosition(actor), t = terminals[pos.x < 0 ? 0 : 1];
          addArc(t.x, t.y, t.z, pos.x, pos.y, pos.z, strike * (0.55 + discharge * 0.45), true);
          // Current visibly grounds beside the character, without altering their root transform.
          addArc(pos.x, pos.y, pos.z, actor.position.x + 0.25, floorY + 0.07, actor.position.z + 0.12, strike * 0.6, false);
          emitSparks(pos.x, pos.y, pos.z, 3, 0.62);
          emitSparks(pos.x + 0.25, floorY + 0.07, pos.z + 0.12, 2, 0.42, 0.65);
          const impactRadius = 0.12 + discharge * 0.12;
          setInstance(impacts, impactIndex++, pos.x, pos.y, pos.z, impactRadius, impactRadius * 1.45, impactRadius);
          if (impactIndex === 1) flashLight.position.set(pos.x, pos.y + 0.5, pos.z);
        }
      } else if (charge > 0.78 && discharge > 0.38) {
        addArc(terminals[0].x, terminals[0].y, terminals[0].z, terminals[1].x, terminals[1].y, terminals[1].z, charge, true);
      }
      arcCore.count = segmentCount; arcGlow.count = segmentCount;
      impacts.count = activeContacts.size; impacts.instanceMatrix.needsUpdate = true;
      arcCore.instanceMatrix.needsUpdate = true; arcGlow.instanceMatrix.needsUpdate = true;
    }
    for (let n = 0; n < sparkCount; n++) {
      const i = n * 3;
      if (sparkLife[n] > 0) {
        sparkLife[n] -= dt;
        sparkVelocities[i + 1] -= dt * 7.7;
        sparkPositions[i] += sparkVelocities[i] * dt;
        sparkPositions[i + 1] += sparkVelocities[i + 1] * dt;
        sparkPositions[i + 2] += sparkVelocities[i + 2] * dt;
        sparkPositions[i] = THREE.MathUtils.clamp(sparkPositions[i], -room.halfWidth + 0.1, room.halfWidth - 0.1);
        sparkPositions[i + 1] = Math.min(sparkPositions[i + 1], room.height - 0.1);
        sparkPositions[i + 2] = THREE.MathUtils.clamp(sparkPositions[i + 2], -room.halfDepth + 0.1, room.halfDepth - 0.1);
        if (sparkPositions[i + 1] < floorY + 0.06) { sparkPositions[i + 1] = floorY + 0.06; sparkVelocities[i + 1] *= -0.27; }
        const fade = Math.min(1, Math.max(0, sparkLife[n] * 3));
        const warmth = sparkWarmth[n];
        sparkColors[i] = fade * (0.6 + warmth * 0.4); sparkColors[i + 1] = fade * (0.85 - warmth * 0.3); sparkColors[i + 2] = fade * (1 - warmth * 0.92);
      } else { sparkPositions[i + 1] = -100; sparkColors[i] = 0; sparkColors[i + 1] = 0; sparkColors[i + 2] = 0; }
      const si = n * 6;
      const tail = Math.min(0.045, Math.max(0, sparkLife[n]) * 0.12);
      for (let a = 0; a < 3; a++) {
        streakPositions[si + a] = sparkPositions[i + a];
        streakPositions[si + a + 3] = sparkPositions[i + a] - sparkVelocities[i + a] * tail;
        streakColors[si + a] = sparkColors[i + a]; streakColors[si + a + 3] = sparkColors[i + a] * 0.12;
      }
    }
    sparkGeometry.attributes.position.needsUpdate = true; sparkGeometry.attributes.color.needsUpdate = true;
    streakGeometry.attributes.position.needsUpdate = true; streakGeometry.attributes.color.needsUpdate = true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    root.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    root.removeFromParent(); root.clear();
    exposedActors.length = 0; warnedActors.clear(); reactionTimes.clear(); activeContacts.clear();
  }
  return { update, dispose };
}
