/**
 * Scenic road course for the Three.js Grand Prix picker.
 * All course geometry is built from the same closed, arc-length sampled spline
 * used by the cars and chase camera.
 */

export function createTrack(THREE) {
  const group = new THREE.Group();
  group.name = 'race3d-track';

  const UP = new THREE.Vector3(0, 1, 0);
  const ROAD_WIDTH = 18;
  const HALF_WIDTH = ROAD_WIDTH / 2;
  const ROAD_LIFT = 0.035;
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const wrap = (d, length) => ((d % length) + length) % length;

  // Prism Grand Circuit: an 11.86 km non-crossing parkland layout. The
  // original start position and +X launch direction are deliberately fixed.
  // The western loop and three hairpins add distance without unsupported
  // overpasses; every visible ribbon and physics sample uses this one spline.
  const layoutScale = 0.74;
  const anchorCoordinates = [
    [-780,2.7,585],
    [-300,2.7,585],
    [300,2.7,585],
    [900,2.7,585],
    [1180,3,550],
    [1350,4,400],
    [1380,5,150],
    [1380,6,-400],
    [1380,6,-900],
    [1280,6,-1110],
    [1080,6,-1200],
    [780,6,-1200],
    [450,6,-1200],
    [-40,6,-1200],
    [-180,6,-1140],
    [-240,6,-1000],
    [-180,6,-860],
    [-40,6,-800],
    [450,6,-800],
    [720,6,-800],
    [860,7,-720],
    [880,9,-560],
    [800,12,-450],
    [640,14,-430],
    [400,17,-430],
    [270,19,-500],
    [150,20,-430],
    [70,18,-280],
    [0,16,-180],
    [-200,13,-180],
    [-400,10,-180],
    [-560,8,-310],
    [-550,7,-530],
    [-650,6,-700],
    [-850,6,-760],
    [-1050,6,-700],
    [-1150,6,-500],
    [-1150,6,-100],
    [-1150,6,200],
    [-1250,5,370],
    [-1450,4,420],
    [-1630,3,330],
    [-1710,3,150],
    [-1710,3,-400],
    [-1710,3,-1000],
    [-1780,3,-1200],
    [-1930,3,-1240],
    [-2070,3,-1140],
    [-2110,3,-950],
    [-2110,3,-300],
    [-2110,3,400],
    [-2040,3,650],
    [-1840,3,800],
    [-1500,3,850],
    [-1350,2.8,830],
    [-1250,2.7,750],
    [-1200,2.7,650],
    [-1100,2.7,600],
    [-950,2.7,585]
];
  // Keep individual straight spline spans below 148 m. Collinear spans then
  // stay exactly straight for drafting and independently validated jump lanes.
  const sourceAnchorIndices = [];
  let splineAnchorCount = 0;
  const splineCoordinates = anchorCoordinates.flatMap((point, index) => {
    sourceAnchorIndices.push(splineAnchorCount);
    const next = anchorCoordinates[(index + 1) % anchorCoordinates.length];
    const steps = Math.ceil(Math.hypot(next[0] - point[0], next[2] - point[2]) / 200);
    splineAnchorCount += steps;
    return Array.from({ length: steps }, (_, step) => point.map((value, axis) => value + (next[axis] - value) * step / steps));
  });
  const anchors = splineCoordinates.map(([x, y, z]) => new THREE.Vector3(
    -780 + (x + 780) * layoutScale, y, 585 + (z - 585) * layoutScale
  ));
  const courseCurve = new THREE.CatmullRomCurve3(anchors, true, 'centripetal');
  courseCurve.arcLengthDivisions = 24000;
  courseCurve.updateArcLengths();
  const totalLength = courseCurve.getLength();
  const arcLengths = courseCurve.getLengths(courseCurve.arcLengthDivisions);
  function anchorDistance(index) {
    const sample = sourceAnchorIndices[index] / anchors.length * courseCurve.arcLengthDivisions;
    const i = Math.floor(sample), f = sample - i;
    return arcLengths[i] + (arcLengths[Math.min(i + 1, arcLengths.length - 1)] - arcLengths[i]) * f;
  }
  const sectorDefinitions = [
    [0, 'Prism launch straight', 'drafting'],
    [4, 'Silver crescent', 'sweeper'],
    [7, 'East express', 'drafting'],
    [9, 'North approach', 'braking'],
    [13, 'Observatory hairpin', 'hairpin'],
    [17, 'Summit straight', 'drafting'],
    [20, 'Ridge climb', 'sweeper'],
    [24, 'Alpine chicane', 'chicane'],
    [28, 'Valley esses', 'technical'],
    [32, 'Cedar carousel', 'sweeper'],
    [36, 'Lake approach', 'drafting'],
    [38, 'Lakeside hairpin', 'hairpin'],
    [42, 'Pine avenue', 'drafting'],
    [44, 'Western hairpin', 'hairpin'],
    [48, 'Sunset express', 'drafting'],
    [51, 'Stadium sweep', 'sweeper'],
    [54, 'Final esses', 'technical']
  ];
  const sectors = sectorDefinitions.map(([anchor, name, type], index) => ({
    id: index + 1, name, type, start: anchorDistance(anchor),
    end: index + 1 < sectorDefinitions.length ? anchorDistance(sectorDefinitions[index + 1][0]) : totalLength
  }));
  const trackBounds = new THREE.Box3().setFromPoints(anchors).expandByScalar(72);

  function frameAt(distance) {
    const d = wrap(distance, totalLength);
    const u = d / totalLength;
    const position = courseCurve.getPointAt(u);
    const tangent = courseCurve.getTangentAt(u).normalize();
    const right = new THREE.Vector3().crossVectors(UP, tangent);
    if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
    else right.normalize();

    // A subtle, signed bank helps the road read as a built circuit while
    // preserving a stable world-up frame for cars and the camera.
    const probe = 3.5;
    const before = courseCurve.getTangentAt(wrap(d - probe, totalLength) / totalLength);
    const after = courseCurve.getTangentAt(wrap(d + probe, totalLength) / totalLength);
    const turn = before.z * after.x - before.x * after.z;
    const curvature = turn / (probe * 2);
    const bank = clamp(-curvature * 2.0, -0.085, 0.085);
    return { position, tangent, right, bank, curvature };
  }

  function sampleTrack(distance) {
    const frame = frameAt(distance);
    return {
      position: frame.position,
      tangent: frame.tangent,
      right: frame.right,
      bank: Math.atan(frame.bank),
      curvature: frame.curvature,
      width: ROAD_WIDTH
    };
  }

  // Surface points follow the course's shallow banking as well as its spline.
  function surfacePoint(distance, lateral, lift = 0) {
    const frame = frameAt(distance);
    const point = frame.position.clone().addScaledVector(frame.right, lateral);
    point.y += frame.bank * lateral + lift;
    return point;
  }

  function makeStandard(color, roughness = 0.85, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, ...extra });
  }

  function makeGrainTexture(base, spread, seed) {
    if (typeof document === 'undefined' || !THREE.CanvasTexture) return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    let state = seed >>> 0;
    const rand = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
    const image = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4;
        const mottled = (rand() - 0.5) * spread + Math.sin(x * 0.031) * 1.1 + Math.sin(y * 0.023) * 1.0;
        const value = clamp(Math.round(base + mottled), 0, 255);
        image.data[i] = value;
        image.data[i + 1] = value;
        image.data[i + 2] = value;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    // Small aggregate flecks catch grazing light without reading as painted noise.
    for (let i = 0; i < 2600; i++) {
      const v = rand() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgba(${v},${v},${v},${0.025 + rand() * 0.045})`;
      const size = rand() * 1.8 + 0.35;
      ctx.fillRect(rand() * 512, rand() * 512, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  function addRibbon({ left, right, start = 0, length = totalLength, step = 2.1, lift = 0, material, uvScale = 1, colors = null, name = 'course-ribbon' }) {
    const segments = Math.max(2, Math.ceil(length / step));
    const positions = [];
    const uvs = [];
    const colorData = [];
    const indices = [];
    for (let i = 0; i <= segments; i++) {
      const d = start + length * i / segments;
      const a = surfacePoint(d, left, lift);
      const b = surfacePoint(d, right, lift);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      uvs.push(d / uvScale, 0, d / uvScale, (right - left) / uvScale);
      if (colors) {
        const c = colors(i, d);
        for (let k = 0; k < 2; k++) colorData.push(c.r, c.g, c.b);
      }
      if (i < segments) {
        const a0 = i * 2, b0 = a0 + 1, a1 = a0 + 2, b1 = a0 + 3;
        indices.push(a0, a1, b1, a0, b1, b0);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    if (colors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorData, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function addQuads(quads, material, name) {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (const quad of quads) {
      const base = positions.length / 3;
      for (let i = 0; i < 4; i++) {
        const p = quad.points[i];
        positions.push(p.x, p.y, p.z);
        uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function ribbonPath(lateral, height, spacing = 2.6) {
    const count = Math.ceil(totalLength / spacing);
    const points = [];
    for (let i = 0; i < count; i++) {
      const d = totalLength * i / count;
      points.push(surfacePoint(d, lateral, height));
    }
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.15);
  }

  // A broad, quiet infield gives the circuit a sense of place. A tapered
  // earthwork ribbon follows the grade so the asphalt never reads as a floating
  // strip above a flat floor.
  const GROUND_Y = -1.35;
  const groundMaterial = makeStandard('#405a3e', 1);
  const groundSize = trackBounds.getSize(new THREE.Vector3());
  const groundCenter = trackBounds.getCenter(new THREE.Vector3());
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize.x + 320, groundSize.z + 320), groundMaterial);
  ground.name = 'race-course-ground';
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(groundCenter.x, GROUND_Y, groundCenter.z);
  ground.receiveShadow = true;
  group.add(ground);

  const earthPositions = [], earthUvs = [], earthColors = [], earthIndices = [];
  const earthSections = [-50, -30, -16, 0, 16, 30, 50];
  const earthSteps = Math.ceil(totalLength / 3.5);
  const earthGrass = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, vertexColors: true });
  const greenIn = new THREE.Color('#344e38');
  const greenOut = new THREE.Color('#486445');
  // Tight inside bends cannot carry a 50 m lateral ribbon: its inner edge
  // would cross the curvature centre. Taper the earthwork there, keeping
  // the road, runoff and rail apron intact and every skirt triangle upright.
  const earthWidths = frame => {
    const outer = clamp(0.78 / Math.max(0.00001, Math.abs(frame.curvature)), 26, 50);
    return { outer, knee: Math.min(30, outer - 8) };
  };
  const earthPoint = (distance, lateral) => {
    const frame = frameAt(distance);
    const { outer, knee } = earthWidths(frame);
    const abs = Math.abs(lateral);
    let drop;
    if (abs <= 16) drop = -0.32;
    else if (abs <= knee) drop = -0.32 - (abs - 16) / (knee - 16) * 0.52;
    else drop = -0.84 + clamp((abs - knee) / (outer - knee), 0, 1) * (GROUND_Y - frame.position.y + 0.84);
    const point = frame.position.clone().addScaledVector(frame.right, lateral);
    point.y += frame.bank * lateral * clamp((knee - abs) / (knee - 16), 0, 1) + drop;
    return point;
  };
  for (let i = 0; i <= earthSteps; i++) {
    const d = totalLength * i / earthSteps;
    const { outer, knee } = earthWidths(frameAt(d));
    for (let j = 0; j < earthSections.length; j++) {
      const section = earthSections[j];
      const lateral = Math.sign(section) * (Math.abs(section) === 50 ? outer : Math.abs(section) === 30 ? knee : Math.abs(section));
      const p = earthPoint(d, lateral);
      earthPositions.push(p.x, p.y, p.z);
      earthUvs.push(d / 34, j / 3);
      const variation = 0.93 + 0.05 * Math.sin(d * 0.035 + j * 1.7);
      const color = greenIn.clone().lerp(greenOut, clamp((Math.abs(lateral) - 12) / 35, 0, 1));
      earthColors.push(color.r * variation, color.g * variation, color.b * variation);
      if (i < earthSteps && j < earthSections.length - 1) {
        const a = i * earthSections.length + j;
        const b = a + earthSections.length;
        earthIndices.push(a, b, b + 1, a, b + 1, a + 1);
      }
    }
  }
  const earthGeometry = new THREE.BufferGeometry();
  earthGeometry.setAttribute('position', new THREE.Float32BufferAttribute(earthPositions, 3));
  earthGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(earthUvs, 2));
  earthGeometry.setAttribute('color', new THREE.Float32BufferAttribute(earthColors, 3));
  earthGeometry.setIndex(earthIndices);
  earthGeometry.computeVertexNormals();
  const earthMesh = new THREE.Mesh(earthGeometry, earthGrass);
  earthMesh.name = 'graded-grass-earthworks';
  earthMesh.receiveShadow = true;
  group.add(earthMesh);

  const gravelTexture = makeGrainTexture(112, 30, 29117);
  const gravelMaterial = makeStandard('#aaa99c', 0.97, gravelTexture ? { map: gravelTexture } : {});
  if (gravelTexture) gravelTexture.repeat.set(1, 1);
  addRibbon({ left: -15.6, right: 15.6, step: 1.3, lift: -0.17, material: gravelMaterial, uvScale: 8, name: 'continuous-gravel-runoff' });

  const asphaltTexture = makeGrainTexture(61, 25, 7813);
  const asphaltMaterial = makeStandard('#b9bcb9', 0.94, asphaltTexture ? { map: asphaltTexture, bumpMap: asphaltTexture, bumpScale: 0.018 } : {});
  addRibbon({ left: -HALF_WIDTH, right: HALF_WIDTH, step: 0.95, lift: ROAD_LIFT, material: asphaltMaterial, uvScale: 3.5, name: 'continuous-asphalt-racing-surface' });

  const white = makeStandard('#e8e8df', 0.74, { emissive: '#111111' });
  const centerPaint = makeStandard('#dfe2dc', 0.72);
  const curbBase = makeStandard('#c7c5bb', 0.75);
  const redCurb = new THREE.Color('#e64b42');
  const ivoryCurb = new THREE.Color('#f4eee0');
  const curbMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, vertexColors: true });

  // Raised alternating curbs and crisp edge paint make the track readable at speed.
  for (const side of [-1, 1]) {
    const inside = side * (HALF_WIDTH - 0.95);
    const outside = side * (HALF_WIDTH - 0.05);
    addRibbon({ left: Math.min(inside, outside), right: Math.max(inside, outside), step: 1.2, lift: 0.06, material: curbBase, name: `curb-bed-${side}` });
    addRibbon({
      left: Math.min(inside, outside), right: Math.max(inside, outside), step: 0.9, lift: 0.095, material: curbMaterial,
      colors: (_i, d) => Math.floor(wrap(d, totalLength) / 5.5) % 2 ? redCurb : ivoryCurb,
      name: `red-white-rumble-strip-${side}`
    });
    const edge = side * (HALF_WIDTH - 1.08);
    addRibbon({ left: edge - 0.075, right: edge + 0.075, step: 1.0, lift: 0.053, material: white, name: `painted-road-edge-${side}` });
  }

  // Bank-following tire deposits and concrete seams are batched into two meshes.
  const rubberQuads = [], curbJoints = [];
  for (let d = 40; d < totalLength; d += 3.1) {
    const f = frameAt(d);
    if (Math.abs(f.bank) < 0.009 || Math.sin(d * 0.031) < -0.42) continue;
    const line = clamp(f.bank * -30, -2.8, 2.8);
    for (const offset of [-0.72, 0.72]) {
      const l = line + offset + Math.sin(d * 0.06) * 0.12;
      rubberQuads.push({ points: [
        surfacePoint(d, l - 0.13, 0.047), surfacePoint(d + 2.6, l - 0.10, 0.047),
        surfacePoint(d + 2.6, l + 0.12, 0.047), surfacePoint(d, l + 0.13, 0.047)
      ] });
    }
  }
  addQuads(rubberQuads, makeStandard('#161918', 0.98, { transparent: true, opacity: 0.24, depthWrite: false }), 'embedded-tire-rubber');
  for (let d = 0; d < totalLength; d += 1.35) {
    for (const side of [-1, 1]) {
      const a = Math.min(side * (HALF_WIDTH - 0.92), side * (HALF_WIDTH - 0.08)), b = Math.max(side * (HALF_WIDTH - 0.92), side * (HALF_WIDTH - 0.08));
      curbJoints.push({ points: [
        surfacePoint(d, a, 0.104), surfacePoint(d + 0.045, a, 0.104),
        surfacePoint(d + 0.045, b, 0.104), surfacePoint(d, b, 0.104)
      ] });
    }
  }
  addQuads(curbJoints, makeStandard('#655f58', 1, { transparent: true, opacity: 0.25, depthWrite: false }), 'curb-expansion-joints');
  // Broken centerline: one batched mesh keeps the marking lightweight.
  const dashes = [];
  for (let d = 8; d < totalLength; d += 22) {
    const a = surfacePoint(d, -0.105, 0.062);
    const b = surfacePoint(d + 7.3, -0.105, 0.062);
    const c = surfacePoint(d + 7.3, 0.105, 0.062);
    const e = surfacePoint(d, 0.105, 0.062);
    dashes.push({ points: [a, b, c, e] });
  }
  addQuads(dashes, centerPaint, 'dashed-white-centerline');

  // Checkered start/finish stripe follows the surface cross-section tile by tile.
  const columns = 24;
  const tileWidth = ROAD_WIDTH / columns;
  const finishWhite = makeStandard('#f7f5ea', 0.68);
  const finishBlack = makeStandard('#171b1c', 0.76);
  // Alternate tile meshes in two batched groups.
  const finishLightQuads = [], finishDarkQuads = [];
  for (let row = 0; row < 2; row++) {
    const d0 = -0.85 + row * 0.85;
    const d1 = d0 + 0.85;
    for (let col = 0; col < columns; col++) {
      const l0 = -HALF_WIDTH + col * tileWidth;
      const l1 = l0 + tileWidth;
      const quad = { points: [
        surfacePoint(d0, l0, 0.075), surfacePoint(d1, l0, 0.075),
        surfacePoint(d1, l1, 0.075), surfacePoint(d0, l1, 0.075)
      ] };
      ((row + col) % 2 ? finishLightQuads : finishDarkQuads).push(quad);
    }
  }
  addQuads(finishLightQuads, finishWhite, 'start-finish-checker-light');
  addQuads(finishDarkQuads, finishBlack, 'start-finish-checker-dark');

  // Galvanized dual-rail barriers with regular supports follow both sides of the apron.
  const railMetal = new THREE.MeshStandardMaterial({ color: '#aeb8b9', metalness: 0.72, roughness: 0.32 });
  const postMaterial = new THREE.MeshStandardMaterial({ color: '#627176', metalness: 0.62, roughness: 0.44 });
  const supportGeo = new THREE.BoxGeometry(0.18, 1.08, 0.32);
  const postCount = Math.ceil(totalLength / 7.8);
  const posts = new THREE.InstancedMesh(supportGeo, postMaterial, postCount * 2);
  posts.name = 'guardrail-supports';
  posts.castShadow = true;
  posts.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let post = 0;
  for (let i = 0; i < postCount; i++) {
    const d = totalLength * i / postCount;
    for (const side of [-1, 1]) {
      const p = surfacePoint(d, side * 14.8, 0.49);
      const frame = frameAt(d);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, Math.atan2(frame.tangent.x, frame.tangent.z), 0);
      dummy.updateMatrix();
      posts.setMatrixAt(post++, dummy.matrix);
    }
  }
  posts.instanceMatrix.needsUpdate = true;
  group.add(posts);
  for (const side of [-1, 1]) {
    for (const height of [0.94, 1.57]) {
      const railPath = ribbonPath(side * 14.8, height, 2.4);
      const rail = new THREE.Mesh(new THREE.TubeGeometry(railPath, Math.ceil(totalLength / 2.5), height > 1 ? 0.115 : 0.095, 7, true), railMetal);
      rail.name = `continuous-steel-guardrail-${side}-${height}`;
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);
    }
  }

  // Sparse pines set the course in a wooded park without obscuring the racing line.
  const treeCount = Math.floor(totalLength / 13.5);
  const trunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 3.6, 7);
  const crownGeo = new THREE.ConeGeometry(2.45, 5.7, 7);
  const crownUpperGeo = new THREE.ConeGeometry(1.72, 4.8, 7);
  const trunkMat = makeStandard('#604c38', 1);
  const crownMats = ['#28543f', '#315d43', '#3b6749'].map(c => makeStandard(c, 0.95));
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crowns = [
    new THREE.InstancedMesh(crownGeo, crownMats[0], treeCount),
    new THREE.InstancedMesh(crownGeo, crownMats[1], treeCount),
    new THREE.InstancedMesh(crownUpperGeo, crownMats[2], treeCount)
  ];
  trunks.name = 'park-pine-trunks';
  crowns.forEach((m, i) => { m.name = `park-pine-crowns-${i}`; m.castShadow = true; m.receiveShadow = true; });
  let rng = 19371;
  const random = () => ((rng = (rng * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < treeCount; i++) {
    const d = totalLength * (i + random() * 0.45) / treeCount;
    const side = i % 2 ? 1 : -1;
    const lateral = side * (23 + random() * 26);
    const frame = frameAt(d);
    const base = frame.position.clone().addScaledVector(frame.right, lateral);
    const scale = 0.72 + random() * 0.76;
    const yaw = random() * TAU;
    const groundY = earthPoint(d, lateral).y - 0.08 + random() * 0.12;
    dummy.position.set(base.x, groundY + 1.8 * scale, base.z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(base.x, groundY + 3.7 * scale, base.z);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    crowns[0].setMatrixAt(i, dummy.matrix);
    dummy.position.set(base.x, groundY + 5.95 * scale, base.z);
    dummy.scale.set(scale * 0.79, scale * 0.86, scale * 0.79);
    dummy.updateMatrix();
    crowns[1].setMatrixAt(i, dummy.matrix);
    dummy.position.set(base.x, groundY + 7.95 * scale, base.z);
    dummy.scale.set(scale * 0.56, scale * 0.63, scale * 0.56);
    dummy.updateMatrix();
    crowns[2].setMatrixAt(i, dummy.matrix);
  }
  trunks.instanceMatrix.needsUpdate = true;
  crowns.forEach(m => { m.instanceMatrix.needsUpdate = true; group.add(m); });
  group.add(trunks);

  // Overhead start marker, set directly above the checkered stripe.
  const start = frameAt(0);
  const startCenter = start.position.clone();
  const gateDark = makeStandard('#202a2b', 0.46, { metalness: 0.35 });
  const gateAccent = makeStandard('#e7ece7', 0.38, { metalness: 0.28 });
  const gateMat = new THREE.Matrix4().makeBasis(start.right, UP, start.tangent);
  const gateQuat = new THREE.Quaternion().setFromRotationMatrix(gateMat);
  function gateBar(name, lateral, y, width, height, depth, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.name = name;
    const p = startCenter.clone().addScaledVector(start.right, lateral);
    p.y += y;
    mesh.position.copy(p);
    mesh.quaternion.copy(gateQuat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  // Keep the chase-camera sightline open rather than filling the horizon with
  // a low, blank beam. This is visual furniture; road/finish physics is unchanged.
  gateBar('start-gantry-left-column', -10.9, 4.0, 0.5, 8.0, 0.5, gateDark);
  gateBar('start-gantry-right-column', 10.9, 4.0, 0.5, 8.0, 0.5, gateDark);
  gateBar('start-gantry-overhead-beam', 0, 7.95, 22.2, 0.55, 0.72, gateDark);
  gateBar('start-gantry-bright-sign-band', 0, 7.35, 14.5, 0.75, 0.76, gateAccent);
  const signCanvas=typeof document!=='undefined'?document.createElement('canvas'):null;if(signCanvas){signCanvas.width=1536;signCanvas.height=96;}
  const signContext=signCanvas?.getContext('2d');
  if(signContext){
    signContext.fillStyle='#12343f';signContext.fillRect(0,0,1536,96);
    signContext.fillStyle='#c7fff0';signContext.font='800 60px system-ui,sans-serif';signContext.textAlign='center';signContext.textBaseline='middle';signContext.fillText('SPEAKKAI  /  PRISM CIRCUIT',768,49);
    const map=new THREE.CanvasTexture(signCanvas);map.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(14.2,.62),new THREE.MeshBasicMaterial({map,toneMapped:false}));
    sign.name='original-prism-circuit-sign';sign.position.copy(startCenter).addScaledVector(start.tangent,-.4);sign.position.y+=7.35;sign.quaternion.copy(gateQuat);sign.rotateY(Math.PI);group.add(sign);
  }

  const lampGeo = new THREE.SphereGeometry(0.18, 12, 8);
  const lampDark = makeStandard('#101617', 0.5, { metalness: 0.3 });
  const redLamp = new THREE.MeshStandardMaterial({ color: '#f23d32', emissive: '#bb1008', emissiveIntensity: 0.65, roughness: 0.32 });
  const amberLamp = new THREE.MeshStandardMaterial({ color: '#ffb23e', emissive: '#b95a0a', emissiveIntensity: 0.45, roughness: 0.32 });
  const greenLamp = new THREE.MeshStandardMaterial({ color: '#64da84', emissive: '#138437', emissiveIntensity: 0.42, roughness: 0.32 });
  for (let cluster = 0; cluster < 3; cluster++) {
    const x = -1.25 + cluster * 1.25;
    gateBar(`start-light-casing-${cluster}`, x, 6.96, 0.63, 1.15, 0.62, lampDark);
    for (let lamp = 0; lamp < 3; lamp++) {
      const mesh = new THREE.Mesh(lampGeo, [redLamp, amberLamp, greenLamp][lamp]);
      mesh.name = `start-light-${cluster}-${lamp}`;
      mesh.position.copy(startCenter).addScaledVector(start.right, x);
      mesh.position.y += 7.29 - lamp * 0.32;
      group.add(mesh);
    }
  }

  function dispose() {
    group.traverse(object => {
      if (!object.isMesh && !object.isInstancedMesh) return;
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        material.map?.dispose?.();
        material.dispose?.();
      }
    });
    group.clear();
  }

  return { group, totalLength, width: ROAD_WIDTH, bounds: trackBounds, sectors, sampleTrack, sampleGround: earthPoint, dispose };
}

export const createRaceTrack = createTrack;
export default createTrack;
