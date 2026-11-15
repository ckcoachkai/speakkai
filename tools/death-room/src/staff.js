import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Four permanent observers; deliberately independent from the character system. */
export async function createStaff({ scene, room = {} } = {}) {
  if (!scene?.add) throw new TypeError('createStaff requires a THREE.Scene');
  const group = new THREE.Group();
  group.name = 'Four pink-suited observation staff';
  group.userData.role = 'staff';
  group.userData.excludedFromDraw = true;
  scene.add(group);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const meshes = new Map();
  const staff = [];
  let elapsed = 0, disposed = false;
  const makeMaterial = (name, properties) => {
    const material = new THREE.MeshStandardMaterial(properties);
    material.name = name; materials.add(material); return material;
  };
  const pink = makeMaterial('Vivid pink woven coverall fabric', { color: 0xd0174c, roughness: .96, metalness: 0 });
  const seamPink = makeMaterial('Raised pink seams and folded pocket edges', { color: 0xbf1744, roughness: .98 });
  const trimPink = makeMaterial('Pink seam highlights', { color: 0xdc2756, roughness: .95 });
  const rubber = makeMaterial('Black rubber gloves and boots', { color: 0x101317, roughness: .7, metalness: .02 });
  const webbing = makeMaterial('Black woven utility belt and zipper', { color: 0x0b0d12, roughness: .94 });
  const face = makeMaterial('Featureless black faceted mask', { color: 0x101217, roughness: .72, metalness: .06, flatShading: true });
  const metal = makeMaterial('Gunmetal hardware', { color: 0x31383d, roughness: .42, metalness: .84 });
  const sole = makeMaterial('Boot outsole', { color: 0x080b10, roughness: .97 });
  const steel = makeMaterial('Observation platform graphite steel', { color: 0x283641, roughness: .65, metalness: .75 });
  const railMat = makeMaterial('Observation deck railing', { color: 0x677784, roughness: .48, metalness: .8 });
  const darkSteel = makeMaterial('Catwalk understructure', { color: 0x101b24, roughness: .78, metalness: .65 });
  const amber = makeMaterial('Amber safety markings', { color: 0xbd7921, roughness: .77, metalness: .25 });
  const lamp = makeMaterial('Catwalk soft white lamps', { color: 0xb0d5de, emissive: 0xa7d4e3, emissiveIntensity: 1.7, roughness: .4 });

  // This small repeating normal texture adds woven cloth without external files.
  const weavePixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    weavePixels[i] = 128 + Math.round(Math.sin(x * Math.PI / 2) * 17);
    weavePixels[i + 1] = 128 + Math.round(Math.sin(y * Math.PI / 2 + (x % 4 > 1 ? Math.PI : 0)) * 17);
    weavePixels[i + 2] = 252; weavePixels[i + 3] = 255;
  }
  const weave = new THREE.DataTexture(weavePixels, 128, 128);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(8, 11);
  weave.magFilter = THREE.LinearFilter; weave.minFilter = THREE.LinearMipmapLinearFilter;
  weave.generateMipmaps = true; weave.needsUpdate = true; textures.add(weave);
  pink.normalMap = weave; pink.normalScale.set(.17, .17);
  seamPink.normalMap = weave; seamPink.normalScale.set(.12, .12);

  // Geometry is accumulated per rigid body part and material, keeping four
  // detailed suits inexpensive to render. Only the torso and hood move at idle.
  function add(parent, geometry, material, position, rotation, scale) {
    const transform = new THREE.Object3D();
    if (position) transform.position.set(...position);
    if (rotation) transform.rotation.set(...rotation);
    if (scale) transform.scale.set(...scale);
    transform.updateMatrix(); geometry.applyMatrix4(transform.matrix);
    if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
    const key = `${parent.uuid}:${material.uuid}`;
    if (!meshes.has(key)) meshes.set(key, { parent, material, parts: [] });
    meshes.get(key).parts.push(geometry);
  }
  const box = (p, m, pos, size, rot) => add(p, new THREE.BoxGeometry(...size), m, pos, rot);
  const softBox = (p, m, pos, size, rot) => add(p, new RoundedBoxGeometry(...size, 2, Math.min(...size) * .22), m, pos, rot);
  const ellipsoid = (p, m, pos, size, segments = 24) => add(p, new THREE.SphereGeometry(1, segments, Math.max(12, segments / 2)), m, pos, null, size);
  function tube(parent, material, points, radius = .003, segments = 20, radial = 6) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    add(parent, new THREE.TubeGeometry(curve, segments, radius, radial, false), material);
  }
  function rod(parent, material, a, b, radius = .025, radial = 10) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const direction = vb.clone().sub(va);
    const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), radial);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
    geometry.translate(...va.add(vb).multiplyScalar(.5).toArray());
    add(parent, geometry, material);
  }

  // Soft anatomical lofts: section = [y, centerX, centerZ, radiusX, radiusZ].
  // Folds follow diagonals and gather near joints instead of forming rings.
  function loft(sections, segments = 32, fold = .005, phase = 0, hipSide = 0) {
    const positions = [], uvs = [], indices = [];
    // Extra rows let folds curve through the garment, rather than faceting
    // at the coarse anatomical section boundaries.
    const dense = [];
    for (let j = 0; j < sections.length - 1; j++) {
      const p0 = sections[Math.max(0, j - 1)], p1 = sections[j];
      const p2 = sections[j + 1], p3 = sections[Math.min(sections.length - 1, j + 2)];
      for (let step = 0; step < 3; step++) {
        const t = step / 3, row = [THREE.MathUtils.lerp(p1[0], p2[0], t)];
        for (let k = 1; k < 5; k++) row.push(.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t));
        dense.push(row);
      }
    }
    dense.push(sections.at(-1)); sections = dense;
    const low = sections[0][0], high = sections.at(-1)[0];
    for (let j = 0; j < sections.length; j++) {
      const [y, x, z, rx, rz] = sections[j];
      const height = (y - low) / (high - low || 1);
      for (let i = 0; i <= segments; i++) {
        const theta = i / segments * Math.PI * 2;
        const taper = Math.pow(Math.max(0, Math.sin(height * Math.PI)), .35);
        const gather = Math.exp(-(((y - .49) / .061) ** 2)) * .85 + Math.exp(-(((y - .19) / .036) ** 2)) * .75 + Math.exp(-(((y - 1.11) / .065) ** 2)) * .9;
        const wrinkles = fold * taper * (Math.sin(theta * 7 + y * 8 + phase) * .34 + Math.sin(theta * 5 - y * 25) * .22 + Math.cos(theta * 3 + y * 79) * gather * .62);
        let px = x + Math.cos(theta) * (rx + wrinkles);
        let py = y + Math.sin(theta * 4 + y * 41 + phase) * fold * .26 * taper;
        let pz = z + Math.sin(theta) * (rz + wrinkles);
        if (hipSide && y > .74) {
          // Each upper leg opens into one half of the hip ellipse. Matching
          // medial vertices produce a genuine joined trouser silhouette, with
          // a curved crotch instead of an overlapping pelvis primitive.
          const blend = THREE.MathUtils.smoothstep(y, .74, .835);
          const waist = THREE.MathUtils.smoothstep(y, .88, 1.005);
          const hipWidth = THREE.MathUtils.lerp(.215, .177, waist);
          const hipDepth = THREE.MathUtils.lerp(.130, .117, waist);
          const crease = fold * .35 * Math.sin(theta * 5 + y * 37) * Math.sin(height * Math.PI);
          const outer = Math.max(0, hipSide * Math.cos(theta));
          px = THREE.MathUtils.lerp(px, hipSide * outer * (hipWidth + crease), blend);
          py = THREE.MathUtils.lerp(py, y, blend);
          pz = THREE.MathUtils.lerp(pz, -.004 + Math.sin(theta) * (hipDepth + crease), blend);
        }
        positions.push(px, py, pz);
        uvs.push(i / segments, height);
      }
    }
    for (let j = 0; j < sections.length - 1; j++) for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i, b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    // Caps use duplicated centre vertices; their UVs do not stretch the cloth.
    for (const end of [0, sections.length - 1]) {
      const section = sections[end], center = positions.length / 3;
      positions.push(section[1], section[0], section[2]); uvs.push(.5, end ? 1 : 0);
      for (let i = 0; i < segments; i++) {
        const base = end * (segments + 1) + i;
        if (end === 0) indices.push(center, base, base + 1);
        else indices.push(center, base + 1, base);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    if (hipSide) {
      // Match normals across the concealed centre seam of the half ellipses.
      const normals = geometry.attributes.normal;
      for (let j = 0; j < sections.length; j++) if (sections[j][0] >= .835) {
        for (const i of [segments / 4, segments * 3 / 4]) normals.setXYZ(j * (segments + 1) + i, 0, .03, i === segments / 4 ? 1 : -1);
      }
    }
    return geometry;
  }

  const torsoProfile = [
    [.976, 0, -.002, .176, .116], [1.035, 0, -.002, .180, .121],
    [1.105, 0, -.007, .194, .132], [1.19, 0, -.011, .205, .137],
    [1.28, 0, -.014, .217, .132], [1.35, 0, -.016, .223, .118],
    [1.405, 0, -.018, .202, .101], [1.45, 0, -.018, .143, .078],
    [1.485, 0, -.016, .077, .061], [1.515, 0, -.014, .069, .058],
  ];
  const sleeveProfile = [
    [.882, .260, .009, .040, .044], [.922, .266, .005, .046, .050],
    [.98, .274, -.003, .055, .057], [1.045, .279, -.012, .059, .060],
    [1.11, .280, -.022, .061, .064], [1.175, .270, -.027, .066, .069],
    [1.24, .257, -.026, .073, .076], [1.30, .243, -.025, .079, .082],
    [1.35, .224, -.023, .081, .084], [1.397, .202, -.021, .066, .070],
    [1.435, .179, -.020, .029, .039],
  ];
  function garmentDistance(x, y, z, profile, side = 0) {
    let row = 0;
    const sy = THREE.MathUtils.clamp(y, profile[0][0], profile.at(-1)[0]);
    while (row < profile.length - 2 && profile[row + 1][0] < sy) row++;
    const a = profile[row], b = profile[row + 1], t = (sy - a[0]) / (b[0] - a[0]);
    const previous = profile[Math.max(0, row - 1)], next = profile[Math.min(profile.length - 1, row + 2)];
    const sample = k => .5 * (2 * a[k] + (-previous[k] + b[k]) * t + (2 * previous[k] - 5 * a[k] + 4 * b[k] - next[k]) * t * t + (-previous[k] + 3 * a[k] - 3 * b[k] + next[k]) * t * t * t);
    const cx = sample(1) * (side || 1), cz = sample(2), rx = sample(3), rz = sample(4);
    const angle = Math.atan2((z - cz) / rz, (x - cx) / rx);
    const elbow = Math.exp(-(((y - 1.11) / .063) ** 2));
    const cuff = Math.exp(-(((y - .938) / .034) ** 2));
    const waist = Math.exp(-(((y - 1.065) / .052) ** 2));
    const fold = side
      ? .0017 * Math.sin(angle * 6 + y * 9) + .0035 * (elbow + cuff * .65) * Math.sin(angle * 2.4 + y * 87)
      : .0015 * Math.sin(angle * 7 + y * 12) + .0033 * waist * Math.sin(angle * 3 + y * 68) + .0014 * Math.sin(angle * 4 - y * 26);
    const radial = (Math.hypot((x - cx) / rx, (z - cz) / rz) - 1) * Math.min(rx, rz) - fold;
    return Math.max(radial, profile[0][0] - y, y - profile.at(-1)[0]);
  }
  function smoothUnion(a, b, k) {
    const h = Math.max(0, k - Math.abs(a - b)) / k;
    return Math.min(a, b) - h * h * k * .25;
  }
  function suitField(x, y, z) {
    const torso = garmentDistance(x, y, z, torsoProfile);
    const left = garmentDistance(x, y, z, sleeveProfile, -1);
    const right = garmentDistance(x, y, z, sleeveProfile, 1);
    return smoothUnion(smoothUnion(torso, left, .018), right, .018);
  }
  function garmentFront(x, y, clearance = .0015) {
    let outer = .24, inner = outer;
    while (inner > -.17 && suitField(x, y, inner) > 0) inner -= .004;
    if (inner <= -.17) return .045;
    outer = inner + .004;
    for (let n = 0; n < 12; n++) {
      const middle = (outer + inner) * .5;
      if (suitField(x, y, middle) > 0) outer = middle; else inner = middle;
    }
    return (inner + outer) * .5 + clearance;
  }
  function suitSeam(parent, points, radius = .00115) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const projected = curve.getPoints(36).map(p => [p.x, p.y, garmentFront(p.x, p.y, radius * .72)]);
    tube(parent, seamPink, projected, radius, 44, 6);
  }
  function joinedUpperGarment() {
    // An isosurface joins the shoulder/arm volumes before triangulation. There
    // are no intersecting sleeve caps or hidden surfaces casting ragged seams.
    const step = .012, min = [-.366, .873, -.174], counts = [62, 57, 31];
    const [nx, ny, nz] = counts, count = nx * ny * nz;
    const values = new Float32Array(count), points = new Float32Array(count * 3);
    const id = (x, y, z) => (z * ny + y) * nx + x;
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const i = id(x, y, z), px = min[0] + x * step, py = min[1] + y * step, pz = min[2] + z * step;
      points.set([px, py, pz], i * 3); values[i] = suitField(px, py, pz);
    }
    const positions = [], normals = [], uvs = [], indices = [], edges = new Map();
    const tetrahedra = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
    function crossing(a, b) {
      const low = Math.min(a, b), high = Math.max(a, b), key = low * count + high;
      if (edges.has(key)) return edges.get(key);
      const t = values[a] / (values[a] - values[b]);
      const x = THREE.MathUtils.lerp(points[a * 3], points[b * 3], t);
      const y = THREE.MathUtils.lerp(points[a * 3 + 1], points[b * 3 + 1], t);
      const z = THREE.MathUtils.lerp(points[a * 3 + 2], points[b * 3 + 2], t), h = .00045;
      const normal = new THREE.Vector3(suitField(x + h, y, z) - suitField(x - h, y, z), suitField(x, y + h, z) - suitField(x, y - h, z), suitField(x, y, z + h) - suitField(x, y, z - h)).normalize();
      const vertex = positions.length / 3;
      positions.push(x, y, z); normals.push(...normal.toArray()); uvs.push(x * 1.8, y * 1.8); edges.set(key, vertex); return vertex;
    }
    function triangle(a, b, c) {
      const ax = positions[b * 3] - positions[a * 3], ay = positions[b * 3 + 1] - positions[a * 3 + 1], az = positions[b * 3 + 2] - positions[a * 3 + 2];
      const bx = positions[c * 3] - positions[a * 3], by = positions[c * 3 + 1] - positions[a * 3 + 1], bz = positions[c * 3 + 2] - positions[a * 3 + 2];
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
      if (cx * cx + cy * cy + cz * cz < 1e-19) return;
      if (cx * normals[a * 3] + cy * normals[a * 3 + 1] + cz * normals[a * 3 + 2] < 0) indices.push(a, c, b); else indices.push(a, b, c);
    }
    for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
      const cube = [id(x, y, z), id(x + 1, y, z), id(x + 1, y + 1, z), id(x, y + 1, z), id(x, y, z + 1), id(x + 1, y, z + 1), id(x + 1, y + 1, z + 1), id(x, y + 1, z + 1)];
      if (cube.every(i => values[i] >= 0) || cube.every(i => values[i] < 0)) continue;
      for (const tet of tetrahedra) {
        const inside = [], outside = [];
        for (const corner of tet) (values[cube[corner]] < 0 ? inside : outside).push(cube[corner]);
        if (inside.length === 1) triangle(...outside.map(b => crossing(inside[0], b)));
        else if (inside.length === 3) triangle(...inside.map(a => crossing(a, outside[0])));
        else if (inside.length === 2) {
          const a = crossing(inside[0], outside[0]), b = crossing(inside[0], outside[1]);
          const c = crossing(inside[1], outside[0]), d = crossing(inside[1], outside[1]);
          triangle(a, b, c); triangle(b, d, c);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
    geometry.userData.continuousShoulders = true; return geometry;
  }
  const garmentTemplate = joinedUpperGarment();

  function boot(parent, x) {
    const outline = new THREE.Shape();
    outline.moveTo(-.048, .078); outline.lineTo(.048, .078);
    outline.quadraticCurveTo(.061, .068, .061, .03); outline.lineTo(.069, -.08);
    outline.quadraticCurveTo(.074, -.164, .022, -.181);
    outline.quadraticCurveTo(0, -.188, -.022, -.181);
    outline.quadraticCurveTo(-.074, -.164, -.069, -.08); outline.lineTo(-.061, .03);
    outline.quadraticCurveTo(-.061, .068, -.048, .078); outline.closePath();
    const outsole = new THREE.ExtrudeGeometry(outline, { depth: .025, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2, steps: 1, curveSegments: 8 });
    outsole.rotateX(-Math.PI / 2); add(parent, outsole, sole, [x, .008, 0]);
    const rows = [[-.078, .025, .077], [-.059, .054, .106], [-.015, .060, .128], [.04, .065, .124], [.10, .065, .105], [.15, .053, .083], [.177, .026, .061], [.183, .002, .044]];
    const positions = [], uvs = [], indices = [], segments = 32;
    for (let j = 0; j < rows.length; j++) {
      const [z, width, top] = rows[j];
      for (let i = 0; i <= segments; i++) {
        const a = i / segments * Math.PI, elevation = Math.sin(a);
        positions.push(x + Math.cos(a) * width, .034 + Math.pow(elevation, .85) * (top - .034), z);
        uvs.push(i / segments, j / (rows.length - 1));
      }
    }
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i, b = a + segments + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    for (const j of [0, rows.length - 1]) {
      const center = positions.length / 3; positions.push(x, .034, rows[j][0]); uvs.push(.5, j / (rows.length - 1));
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        if (j === 0) indices.push(center, a + 1, a); else indices.push(center, a, a + 1);
      }
    }
    const upper = new THREE.BufferGeometry(); upper.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    upper.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); upper.setIndex(indices); upper.computeVertexNormals(); add(parent, upper, rubber);
    add(parent, loft([[.083, x, -.013, .052, .057], [.115, x, 0, .049, .048], [.16, x, 0, .047, .046], [.205, x, 0, .046, .045]], 24, .001), rubber);
    for (let n = 0; n < 5; n++) softBox(parent, sole, [x, .007, -.055 + n * .046], [.106, .009, .017]);
    tube(parent, webbing, [[x - .058, .055, .105], [x - .041, .058, .157], [x, .060, .174], [x + .041, .058, .157], [x + .058, .055, .105]], .0012, 24);
    for (let n = 0; n < 3; n++) {
      const y = .126 + n * .013, z = .032 - n * .016;
      tube(parent, webbing, [[x - .027, y - .004, z], [x, y + .003, z + .005], [x + .027, y - .004, z]], .0023, 10);
      for (const side of [-1, 1]) ellipsoid(parent, metal, [x + side * .030, y - .003, z], [.0034, .002, .0034], 10);
    }
  }

  function hoodGeometry() {
    const rings = [
      [.145, .101, .143, 1.646], [.139, .110, .153, 1.65],
      [.119, .121, .169, 1.649], [.07, .134, .177, 1.646],
      [0, .138, .175, 1.643], [-.064, .122, .158, 1.636],
      [-.112, .088, .121, 1.627], [-.134, .038, .067, 1.619],
      [-.139, .002, .002, 1.615],
    ];
    const positions = [], uvs = [], indices = [], segments = 48;
    for (let j = 0; j < rings.length; j++) {
      const [z, rx, ry, cy] = rings[j];
      for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2;
        const wrinkle = j > 1 && j < 7 ? Math.sin(angle * 7 + j * .8) * .0017 : 0;
        const jaw = .94 + Math.sin(angle) * .06;
        positions.push(Math.cos(angle) * (rx + wrinkle) * jaw * .96, 1.659 + (cy - 1.646 + Math.sin(angle) * (ry + wrinkle)) * .86, z * .96);
        uvs.push(i / segments, j / (rings.length - 1));
      }
    }
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i, b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices); g.computeVertexNormals(); return g;
  }

  function pocket(parent, x, y, z, w, h, side = false) {
    const patch = new THREE.Shape();
    patch.moveTo(-w * .5, h * .5); patch.lineTo(w * .5, h * .5);
    patch.lineTo(w * .48, -h * .36); patch.quadraticCurveTo(w * .47, -h * .49, w * .3, -h * .5);
    patch.quadraticCurveTo(0, -h * .55, -w * .3, -h * .5); patch.quadraticCurveTo(-w * .47, -h * .49, -w * .48, -h * .36);
    patch.closePath();
    const panel = new THREE.ExtrudeGeometry(patch, { depth: .008, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .0025, bevelThickness: .002 });
    if (side) {
      const sideSurface = (py, pz) => Math.sign(x) * (.114 + (.104 + (py - .70) * .04) * Math.sqrt(Math.max(.1, 1 - ((pz + .005) / .114) ** 2)) + .003);
      const vertices = panel.attributes.position;
      for (let i = 0; i < vertices.count; i++) vertices.setZ(i, vertices.getZ(i) + Math.abs(sideSurface(y + vertices.getY(i), z - Math.sign(x) * vertices.getX(i))) - Math.abs(x));
      panel.computeVertexNormals();
      add(parent, panel, pink, [x, y, z], [0, Math.sign(x) * Math.PI / 2, 0]);
      const flap = new RoundedBoxGeometry(.008, h * .24, w * 1.05, 3, .002);
      const fp = flap.attributes.position;
      for (let i = 0; i < fp.count; i++) fp.setX(i, fp.getX(i) + sideSurface(y + h * .38 + fp.getY(i), z + fp.getZ(i)) - x + Math.sign(x) * .012);
      flap.computeVertexNormals(); add(parent, flap, trimPink, [x, y + h * .38, z]);
      const outline = [[0, y + h * .21, z - w * .47], [0, y - h * .40, z - w * .45], [0, y - h * .49, z], [0, y - h * .40, z + w * .45], [0, y + h * .21, z + w * .47]];
      const seam = new THREE.CatmullRomCurve3(outline.map(p => new THREE.Vector3(...p))).getPoints(30).map(p => [sideSurface(p.y, p.z) + Math.sign(x) * .01, p.y, p.z]);
      tube(parent, seamPink, seam, .0009, 30, 5);
    } else {
      const vertices = panel.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        vertices.setZ(i, vertices.getZ(i) + garmentFront(x + vertices.getX(i), y + vertices.getY(i), .0028) - z);
      }
      panel.computeVertexNormals();
      add(parent, panel, pink, [x, y, z]);
      const flap = new RoundedBoxGeometry(w * 1.04, h * .24, .007, 3, .002);
      const flapPosition = flap.attributes.position;
      for (let i = 0; i < flapPosition.count; i++) flapPosition.setZ(i, flapPosition.getZ(i) + garmentFront(x + flapPosition.getX(i), y + h * .38 + flapPosition.getY(i), .013) - z);
      flap.computeVertexNormals(); add(parent, flap, trimPink, [x, y + h * .38, z]);
      const outline = [[x - w * .46, y + h * .26, 0], [x - w * .46, y - h * .38, 0], [x, y - h * .49, 0], [x + w * .46, y - h * .38, 0], [x + w * .46, y + h * .26, 0]];
      const stitch = new THREE.CatmullRomCurve3(outline.map(p => new THREE.Vector3(...p))).getPoints(32).map(p => [p.x, p.y, garmentFront(p.x, p.y, .012)]);
      tube(parent, seamPink, stitch, .0009, 32, 5);
      ellipsoid(parent, metal, [x, y + h * .37, garmentFront(x, y + h * .37, .018)], [.004, .004, .0015], 12);
    }
  }

  function buildHuman(index, side, z) {
    const root = new THREE.Group(); root.name = `Observation staff ${index + 1}`;
    root.userData = { role: 'staff', excludedFromDraw: true, invincible: true, reference: 'pink hooded coveralls, plain faceted black face mask' };
    root.position.set(side * 8.4, room.floorY || 0, z);
    root.rotation.y = side < 0 ? .50 : -.50;
    const size = [1, .985, 1.012, .992][index]; root.scale.setScalar(size);
    group.add(root);
    const lower = new THREE.Group(); lower.name = 'Coverall trousers and boots'; root.add(lower);
    const upper = new THREE.Group(); upper.name = 'Breathing coverall torso'; root.add(upper);
    const head = new THREE.Group(); head.name = 'Hood and faceted mask'; root.add(head);

    // Natural pant volumes, slightly separated feet, gathered ankles and knees.
    for (const sideLeg of [-1, 1]) {
      const x = sideLeg * .113;
      add(lower, loft([
        [.115, x * 1.22, .006, .052, .060], [.15, x * 1.21, .004, .057, .063],
        [.19, x * 1.20, .003, .070, .071], [.245, x * 1.18, .001, .078, .074],
        [.31, x * 1.17, -.004, .082, .079], [.38, x * 1.14, -.012, .085, .086],
        [.45, x * 1.1, -.018, .091, .087], [.50, x * 1.08, -.015, .090, .089],
        [.55, x * 1.06, -.008, .088, .092], [.61, x * 1.05, -.004, .097, .103],
        [.68, x * 1.03, -.004, .103, .109], [.75, x * 1.01, -.007, .108, .116],
        [.82, x, -.006, .111, .122], [.89, x, -.006, .109, .119],
        [.96, x * .96, -.004, .102, .114], [1.005, x * .94, -.004, .098, .110],
      ], 32, .0065, sideLeg * 1.7, sideLeg), pink);
      const hem = [];
      for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; hem.push([x * 1.216 + Math.cos(a) * .054, .137, .005 + Math.sin(a) * .062]); }
      tube(lower, seamPink, hem, .0011, 40, 6);
      tube(lower, seamPink, [[x + sideLeg * .099, .91, -.005], [x + sideLeg * .104, .74, -.012], [x * 1.08 + sideLeg * .085, .51, -.013], [x * 1.16 + sideLeg * .077, .32, .001], [x * 1.21 + sideLeg * .055, .16, .008]], .0024, 32);
      pocket(lower, sideLeg * .225, .705, -.005, .135, .18, true);
      const fx = x * 1.22;
      boot(lower, fx);
    }

    add(upper, garmentTemplate.clone(), pink);
    // A continuous dark front zipper and understated metallic pull.
    tube(upper, webbing, [[0, .865, .127], [0, .98, .122], [0, 1.105, .137], [0, 1.28, .13], [0, 1.41, .09], [0, 1.50, .055]], .006, 36, 8);
    for (const dx of [-.008, .008]) suitSeam(upper, [[dx, 1.04, .13], [dx, 1.25, .141], [dx, 1.41, .096]]);
    softBox(upper, metal, [0, 1.405, garmentFront(0, 1.405, .008)], [.014, .034, .007], [-.12, 0, 0]);
    // Belt wraps the full waist, with separate buckle and fabric belt loops.
    add(upper, loft([[.976, 0, 0, .180, .124], [1.031, 0, 0, .183, .126]], 48, .0008), webbing);
    softBox(upper, metal, [0, 1.003, .130], [.055, .052, .012]);
    softBox(upper, webbing, [0, 1.003, .138], [.035, .032, .007]);
    for (const dx of [-.145, -.070, .070, .145]) softBox(upper, pink, [dx, 1.005, Math.sqrt(Math.max(0, 1 - dx * dx / .184 ** 2)) * .128 + .003], [.014, .073, .009]);
    pocket(upper, -.113, 1.259, .137, .113, .128);
    // Fabric panels on front and shoulder; no insignia or participant number.
    suitSeam(upper, [[-.067, 1.465, .047], [-.15, 1.411, .082], [-.221, 1.349, .055]]);
    suitSeam(upper, [[.067, 1.465, .047], [.15, 1.411, .082], [.221, 1.349, .055]]);
    for (const s of [-1, 1]) {
      suitSeam(upper, [[s * .16, 1.107, .092], [s * .135, 1.079, .118], [s * .085, 1.059, .125]]);
      const cuffHem = [];
      for (let i = 0; i <= 36; i++) { const a = i / 36 * Math.PI * 2; cuffHem.push([s * .263 + Math.cos(a) * .0437, .898, .007 + Math.sin(a) * .0475]); }
      tube(upper, seamPink, cuffHem, .001, 36, 6);
      suitSeam(upper, [[s * .259, 1.35, .045], [s * .301, 1.22, .017], [s * .32, 1.09, -.001], [s * .301, .96, .02], [s * .281, .916, .035]], .001);
      // Closed black gloves: palm, four naturally curled fingers, opposed thumb.
      ellipsoid(upper, rubber, [s * .260, .853, .016], [.038, .056, .027]);
      for (let f = 0; f < 4; f++) {
        const fx = s * (.233 + f * .017);
        const length = [.058, .066, .062, .048][f];
        tube(upper, rubber, [[fx, .839, .024], [fx + s * .004, .815, .030], [fx + s * .003, .839 - length, .049]], .0092, 12, 8);
        ellipsoid(upper, rubber, [fx + s * .003, .839 - length, .049], [.0092, .0096, .0092], 14);
        ellipsoid(upper, rubber, [fx, .837, .030], [.010, .014, .010], 16);
        tube(upper, webbing, [[fx - .006, .817, .040], [fx, .815, .041], [fx + .006, .817, .040]], .0007, 6, 5);
      }
      tube(upper, rubber, [[s * .229, .871, .02], [s * .212, .846, .043], [s * .218, .822, .052]], .011, 14, 8);
      for (let f = 0; f < 3; f++) tube(upper, webbing, [[s * (.239 + f * .017), .871, .038], [s * (.238 + f * .017), .844, .043]], .0009, 8, 5);
    }

    add(head, hoodGeometry(), pink);
    const rim = [];
    for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; rim.push([Math.cos(a) * .100 * (.94 + Math.sin(a) * .06), 1.659 + Math.sin(a) * .125, .142]); }
    tube(head, seamPink, rim, .0038, 64, 8);
    const innerRim = rim.map(([x, y, z]) => [x * .976, 1.659 + (y - 1.659) * .982, z - .002]);
    tube(head, webbing, innerRim, .002, 64, 6);
    // Flat polygon planes form a tapered full-face mask, with no eyes or symbols.
    const mask = new THREE.IcosahedronGeometry(1, 2);
    const maskVertices = mask.attributes.position;
    for (let i = 0; i < maskVertices.count; i++) {
      const y = maskVertices.getY(i);
      maskVertices.setXYZ(i, maskVertices.getX(i) * .098 * (.94 + y * .06), 1.659 + y * .124, .105 + maskVertices.getZ(i) * .051);
    }
    mask.computeVertexNormals(); add(head, mask, face);
    tube(head, seamPink, [[0, 1.811, -.008], [0, 1.784, -.072], [0, 1.705, -.127], [0, 1.56, -.108]], .0015, 32);
    for (const s of [-1, 1]) {
      tube(head, webbing, [[s * .070, 1.553, .132], [s * .066, 1.518, .109], [s * .070, 1.486, .074]], .002, 20);
      rod(head, metal, [s * .070, 1.486, .074], [s * .071, 1.475, .073], .0028, 8);
    }
    staff.push({ root, upper, head, phase: index * 1.73 });
  }

  function catwalk(side) {
    const deck = new THREE.Group(); deck.name = side < 0 ? 'Left staff observation catwalk' : 'Right staff observation catwalk';
    deck.position.y = room.floorY || 0; group.add(deck);
    const x = side * 8.4, z0 = .05, z1 = 5.48, inner = side * 7.66, outer = side * 9.14;
    box(deck, darkSteel, [x, -.10, (z0 + z1) / 2], [1.52, .18, z1 - z0]);
    for (const dx of [-.71, .71]) box(deck, steel, [x + dx, -.015, (z0 + z1) / 2], [.09, .09, z1 - z0 + .12]);
    for (let z = z0; z < z1; z += .10) box(deck, steel, [x, -.018, z], [1.40, .035, .045]);
    for (const dx of [-.38, 0, .38]) box(deck, darkSteel, [x + dx, -.05, (z0 + z1) / 2], [.027, .06, z1 - z0]);
    for (const z of [z0, 1.83, 3.65, z1]) {
      for (const rx of [inner, outer]) {
        rod(deck, railMat, [rx, .02, z], [rx, .98, z], .025);
        box(deck, steel, [rx, .035, z], [.13, .05, .13]);
        for (const dz of [-.039, .039]) ellipsoid(deck, metal, [rx, .062, z + dz], [.014, .006, .014], 10);
      }
      box(deck, steel, [x, -.24, z], [1.49, .12, .1]);
      // Triangular brackets visibly anchor the deck to the outside chamber wall.
      rod(deck, darkSteel, [side * 7.12, -.61, z], [side * 8.98, -.13, z], .055);
      box(deck, darkSteel, [side * 7.16, -.29, z], [.14, .69, .20]);
    }
    for (const rx of [inner, outer]) {
      rod(deck, railMat, [rx, .98, z0], [rx, .98, z1], .027);
      rod(deck, steel, [rx, .48, z0], [rx, .48, z1], .015);
      box(deck, steel, [rx, .09, (z0 + z1) / 2], [.04, .16, z1 - z0]);
    }
    for (const z of [z0, z1]) {
      rod(deck, railMat, [inner, .98, z], [outer, .98, z], .027);
      rod(deck, steel, [inner, .48, z], [outer, .48, z], .015);
      for (let i = 0; i < 5; i++) box(deck, amber, [x - .56 + i * .28, .012, z + (z === z0 ? .05 : -.05)], [.15, .006, .08]);
    }
    // Shielded low-energy deck lamps illuminate pink cloth, with no added shadows.
    for (const z of [1.3, 4.2]) {
      box(deck, darkSteel, [outer, .47, z], [.10, .19, .16]);
      box(deck, lamp, [outer - side * .056, .49, z], [.008, .10, .11]);
      const fill = new THREE.PointLight(0xc9ddec, 2.2, 3.4, 2);
      fill.position.set(x + side * .5, 1.50, z + .42); deck.add(fill);
    }
  }

  catwalk(-1); catwalk(1);
  buildHuman(0, -1, 1.3); buildHuman(1, -1, 4.2);
  buildHuman(2, 1, 1.3); buildHuman(3, 1, 4.2);
  garmentTemplate.dispose();
  for (const batch of meshes.values()) {
    // All builders supply the same position/normal/uv attributes.
    const merged = mergeGeometries(batch.parts, false);
    if (!merged) throw new Error('Could not assemble staff geometry');
    for (const part of batch.parts) part.dispose();
    merged.computeBoundingSphere(); geometries.add(merged);
    const mesh = new THREE.Mesh(merged, batch.material);
    mesh.name = batch.material.name; mesh.castShadow = true; mesh.receiveShadow = true;
    batch.parent.add(mesh);
  }
  meshes.clear();
  for (const person of staff) {
    for (const object of person.upper.children) object.geometry.translate(0, -1, 0);
    for (const object of person.head.children) object.geometry.translate(0, -1.51, 0);
    person.upper.position.y = 1; person.head.position.y = 1.51;
  }
  group.userData.staffCount = staff.length;
  group.userData.staffRoots = staff.map(s => s.root);
  group.userData.modelVersion = 2;
  group.userData.continuousShoulders = true;

  return {
    group,
    update(dt, _state = {}) {
      if (disposed) return;
      elapsed += Math.min(.1, Math.max(0, Number.isFinite(dt) ? dt : 0));
      for (const person of staff) {
        const breath = Math.sin(elapsed * (1.15 + Math.sin(person.phase) * .07) + person.phase);
        const weight = Math.sin(elapsed * .22 + person.phase) * .006 + Math.sin(elapsed * .091 + person.phase * .7) * .002;
        person.upper.scale.z = 1 + breath * .008;
        person.upper.position.set(weight * .25, 1 + breath * .0014, 0);
        person.upper.rotation.z = weight;
        const watchTime = elapsed + person.phase * 3.2, watchCycle = Math.floor(watchTime / 8.6);
        const t = THREE.MathUtils.clamp((watchTime % 8.6 - 4.2) / 2.1, 0, 1), ease = t * t * (3 - 2 * t);
        const from = Math.sin((watchCycle - 1) * 1.618 + person.phase) * .105;
        const to = Math.sin(watchCycle * 1.618 + person.phase) * .105;
        person.head.rotation.y = THREE.MathUtils.lerp(from, to, ease);
        person.head.rotation.x = Math.sin(elapsed * .27 + person.phase) * .012;
        person.head.rotation.z = weight * .45;
        person.head.position.set(weight * .25 - Math.sin(weight) * .51, 1.51 + breath * .0014 + (Math.cos(weight) - 1) * .51, 0);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true; group.removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      group.traverse(object => { if (object.isLight && typeof object.dispose === 'function') object.dispose(); });
      geometries.clear(); materials.clear(); textures.clear(); staff.length = 0;
      delete group.userData.staffRoots;
    },
  };
}

export default createStaff;
