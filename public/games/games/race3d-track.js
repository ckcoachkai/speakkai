/**
 * Scenic road course for the Three.js Grand Prix picker.
 * All course geometry is built from the same closed, arc-length sampled spline
 * used by the cars and chase camera.
 */

export function createTrack(THREE) {
  const group = new THREE.Group();
  group.name = 'race3d-track';

  const UP = new THREE.Vector3(0, 1, 0);
  const ROAD_WIDTH = 16.5;
  const HALF_WIDTH = ROAD_WIDTH / 2;
  const ROAD_LIFT = 0.035;
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const wrap = (d, length) => ((d % length) + length) % length;

  // The route has a fast start straight, a tightening north hairpin, a long
  // back straight, then a flowing pair of elevation-changing esses.
  const anchors = [
    [-220, 0.55, 244], [-112, 0.50, 269], [22, 0.58, 278],
    [150, 0.80, 267], [237, 1.10, 230], [270, 1.62, 166],
    [258, 2.08, 95], [207, 2.24, 41], [174, 2.00, -22],
    [194, 1.50, -91], [260, 1.08, -160], [268, 0.72, -218],
    [227, 0.60, -267], [145, 0.88, -281], [61, 1.30, -260],
    [-18, 1.73, -231], [-116, 2.10, -244], [-225, 2.22, -275],
    [-300, 1.70, -237], [-326, 1.15, -162], [-302, 0.72, -96],
    [-240, 0.52, -43], [-222, 0.63, 7], [-265, 1.04, 62],
    [-318, 1.43, 130], [-309, 1.55, 193], [-267, 1.10, 232]
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  const courseCurve = new THREE.CatmullRomCurve3(anchors, true, 'catmullrom', 0.45);
  courseCurve.arcLengthDivisions = 12000;
  courseCurve.updateArcLengths();
  const totalLength = courseCurve.getLength();

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
    return { position, tangent, right, bank };
  }

  function sampleTrack(distance) {
    const frame = frameAt(distance);
    return {
      position: frame.position,
      tangent: frame.tangent,
      right: frame.right,
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

  function addRibbon({ left, right, start = 0, length = totalLength, step = 1.4, lift = 0, material, uvScale = 1, colors = null, name = 'course-ribbon' }) {
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1900, 1550), groundMaterial);
  ground.name = 'race-course-ground';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.receiveShadow = true;
  group.add(ground);

  const earthPositions = [], earthUvs = [], earthColors = [], earthIndices = [];
  const earthSections = [-46, -28, -14, 0, 14, 28, 46];
  const earthSteps = Math.ceil(totalLength / 2.5);
  const earthGrass = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, vertexColors: true });
  const greenIn = new THREE.Color('#344e38');
  const greenOut = new THREE.Color('#486445');
  const earthBankFactor = lateral => clamp((28 - Math.abs(lateral)) / 14, 0, 1);
  const earthPoint = (distance, lateral) => {
    const frame = frameAt(distance);
    const abs = Math.abs(lateral);
    let drop;
    if (abs <= 14) drop = -0.32;
    else if (abs <= 28) drop = -0.32 - (abs - 14) / 14 * 0.52;
    else drop = -0.84 + (abs - 28) / 18 * (GROUND_Y - frame.position.y + 0.84);
    const point = frame.position.clone().addScaledVector(frame.right, lateral);
    point.y += frame.bank * lateral * earthBankFactor(lateral) + drop;
    return point;
  };
  for (let i = 0; i <= earthSteps; i++) {
    const d = totalLength * i / earthSteps;
    for (let j = 0; j < earthSections.length; j++) {
      const lateral = earthSections[j];
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
  addRibbon({ left: -12.9, right: 12.9, step: 1.3, lift: -0.17, material: gravelMaterial, uvScale: 8, name: 'continuous-gravel-runoff' });

  const asphaltTexture = makeGrainTexture(61, 25, 7813);
  const asphaltMaterial = makeStandard('#747d80', 0.94, asphaltTexture ? { map: asphaltTexture } : {});
  addRibbon({ left: -HALF_WIDTH, right: HALF_WIDTH, step: 0.95, lift: 0, material: asphaltMaterial, uvScale: 9, name: 'continuous-asphalt-racing-surface' });

  const white = makeStandard('#e8e8df', 0.74, { emissive: '#111111' });
  const centerPaint = makeStandard('#dfe2dc', 0.72);
  const curbBase = makeStandard('#c7c5bb', 0.75);
  const redCurb = new THREE.Color('#e64b42');
  const ivoryCurb = new THREE.Color('#f4eee0');
  const curbMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, vertexColors: true });

  // Raised alternating curbs and crisp edge paint make the track readable at speed.
  for (const side of [-1, 1]) {
    const inside = side < 0 ? -7.15 : 7.15;
    const outside = side < 0 ? -8.12 : 8.12;
    addRibbon({ left: Math.min(inside, outside), right: Math.max(inside, outside), step: 1.2, lift: 0.018, material: curbBase, name: `curb-bed-${side}` });
    addRibbon({
      left: Math.min(inside, outside), right: Math.max(inside, outside), step: 0.9, lift: 0.045, material: curbMaterial,
      colors: (_i, d) => Math.floor(wrap(d, totalLength) / 5.5) % 2 ? redCurb : ivoryCurb,
      name: `red-white-rumble-strip-${side}`
    });
    const edge = side * 6.96;
    addRibbon({ left: edge - 0.075, right: edge + 0.075, step: 1.0, lift: 0.055, material: white, name: `painted-road-edge-${side}` });
  }

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
      const p = surfacePoint(d, side * 12.35, 0.49);
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
      const railPath = ribbonPath(side * 12.35, height, 2.4);
      const rail = new THREE.Mesh(new THREE.TubeGeometry(railPath, Math.ceil(totalLength / 1.6), height > 1 ? 0.115 : 0.095, 7, true), railMetal);
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
    const lateral = side * (19 + random() * 26);
    const frame = frameAt(d);
    const base = frame.position.clone().addScaledVector(frame.right, lateral);
    const scale = 0.72 + random() * 0.76;
    const yaw = random() * TAU;
    const abs = Math.abs(lateral);
    const terrainDrop = abs <= 14 ? -0.32 : abs <= 28 ? -0.32 - (abs - 14) / 14 * 0.52 : -0.84 + (abs - 28) / 18 * (GROUND_Y - frame.position.y + 0.84);
    const groundY = frame.position.y + frame.bank * lateral * earthBankFactor(lateral) + terrainDrop - 0.08 + random() * 0.12;
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
  gateBar('start-gantry-left-column', -10.9, 2.65, 0.5, 5.3, 0.5, gateDark);
  gateBar('start-gantry-right-column', 10.9, 2.65, 0.5, 5.3, 0.5, gateDark);
  gateBar('start-gantry-overhead-beam', 0, 5.25, 22.2, 0.55, 0.72, gateDark);
  gateBar('start-gantry-bright-sign-band', 0, 4.82, 14.5, 0.48, 0.76, gateAccent);

  const lampGeo = new THREE.SphereGeometry(0.18, 12, 8);
  const lampDark = makeStandard('#101617', 0.5, { metalness: 0.3 });
  const redLamp = new THREE.MeshStandardMaterial({ color: '#f23d32', emissive: '#bb1008', emissiveIntensity: 0.65, roughness: 0.32 });
  const amberLamp = new THREE.MeshStandardMaterial({ color: '#ffb23e', emissive: '#b95a0a', emissiveIntensity: 0.45, roughness: 0.32 });
  const greenLamp = new THREE.MeshStandardMaterial({ color: '#64da84', emissive: '#138437', emissiveIntensity: 0.42, roughness: 0.32 });
  for (let cluster = 0; cluster < 3; cluster++) {
    const x = -1.25 + cluster * 1.25;
    gateBar(`start-light-casing-${cluster}`, x, 4.36, 0.63, 1.15, 0.62, lampDark);
    for (let lamp = 0; lamp < 3; lamp++) {
      const mesh = new THREE.Mesh(lampGeo, [redLamp, amberLamp, greenLamp][lamp]);
      mesh.name = `start-light-${cluster}-${lamp}`;
      mesh.position.copy(startCenter).addScaledVector(start.right, x);
      mesh.position.y += 4.69 - lamp * 0.32;
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

  return { group, totalLength, sampleTrack, dispose };
}

export const createRaceTrack = createTrack;
export default createTrack;
