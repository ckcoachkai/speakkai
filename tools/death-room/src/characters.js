import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

// Every fallback figure is a complete 3-D articulated person. Detail is merged
// into rigid body parts, so buttons, facial features and shoelaces do not each
// cost a separate draw call. All artwork in this file is original procedural art.
export const characterQuality = {
  kind: 'articulated-human',
  proportions: 'adult',
  localAssetsOnly: true,
  actions: ['run', 'idle', 'panic', 'crouch', 'swim', 'fall', 'dead', 'frozen', 'celebrate'],
  reactions: ['heat', 'cough', 'shiver', 'shock', 'dodge', 'brace', 'swarm', 'drown', 'stumble', 'fear'],
  expressions: ['neutral', 'fear', 'cry', 'scream', 'dead'],
};

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const color = new THREE.Color();
const matrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
const euler = new THREE.Euler();
const v3 = new THREE.Vector3();
const scale3 = new THREE.Vector3();

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < String(text).length; i++) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(value, amount) {
  return new THREE.Color(value).multiplyScalar(amount);
}

function createPartBuilder(material) {
  const geometries = [];
  const add = (geometry, tint, position = [0, 0, 0], size = [1, 1, 1], rotation = [0, 0, 0]) => {
    // One shared shaded vertex-color material avoids dozens of materials/person.
    geometry.deleteAttribute('uv');
    if (geometry.index) {
      const old = geometry;
      geometry = geometry.toNonIndexed();
      old.dispose();
    }
    euler.set(...(rotation || [0, 0, 0]));
    quaternion.setFromEuler(euler);
    matrix.compose(v3.set(...position), quaternion, scale3.set(...size));
    geometry.applyMatrix4(matrix);
    const p = geometry.getAttribute('position');
    const n = geometry.getAttribute('normal');
    const colors = new Float32Array(p.count * 3);
    color.set(tint);
    for (let i = 0; i < p.count; i++) {
      // Subtle baked occlusion rounds clothes and facial contours without noise.
      const light = 0.91 + Math.max(0, n.getY(i)) * 0.07 + Math.max(0, n.getZ(i)) * 0.02;
      colors[i * 3] = color.r * light;
      colors[i * 3 + 1] = color.g * light;
      colors[i * 3 + 2] = color.b * light;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometries.push(geometry);
  };
  const ellipsoid = (tint, position, size, rotation, detail = 12) =>
    add(new THREE.SphereGeometry(1, detail, Math.max(8, detail - 4)), tint, position, size, rotation);
  const box = (tint, position, size, rotation) =>
    add(new THREE.BoxGeometry(1, 1, 1), tint, position, size, rotation);
  const tube = (tint, a, b, radius, endRadius = radius, sides = 8) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const geometry = new THREE.CylinderGeometry(endRadius, radius, direction.length(), sides, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    const mid = start.add(end).multiplyScalar(0.5);
    geometry.applyQuaternion(q);
    add(geometry, tint, mid.toArray());
  };
  // Rings describe a tailored limb or torso instead of a stack of capsules.
  const loft = (tint, rings, segments = 16) => {
    const vertices = [], indices = [];
    for (const [y, rx, rz, cz = 0] of rings) {
      for (let j = 0; j < segments; j++) {
        const angle = j / segments * TAU;
        vertices.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz + cz);
      }
    }
    for (let k = 0; k < rings.length - 1; k++) {
      for (let j = 0; j < segments; j++) {
        const next = (j + 1) % segments, a = k * segments + j, b = k * segments + next;
        indices.push(a, b + segments, b, a, a + segments, b + segments);
      }
    }
    const bottom = vertices.length / 3;
    vertices.push(0, rings[0][0], rings[0][3] || 0);
    const top = vertices.length / 3;
    vertices.push(0, rings.at(-1)[0], rings.at(-1)[3] || 0);
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      indices.push(bottom, j, next);
      const offset = (rings.length - 1) * segments;
      indices.push(top, offset + next, offset + j);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    add(geo, tint);
  };
  const finish = (parent) => {
    if (!geometries.length) return null;
    const merged = mergeGeometries(geometries, false);
    for (const geo of geometries) geo.dispose();
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  return { add, ellipsoid, box, tube, loft, finish };
}

const tracksuit = { top: '#145b47', pants: '#115440', accent: '#e4dec6', shirt: '#e7e2cd', kind: 'jacket' };
// Fictional performance profiles are assigned by roster slot, independently
// of the cast's cultural background labels.
const personalityProfiles = [
  { name: 'watchful', bravery: 0.62, pace: 0.94, interval: 4.4, look: 0.82 },
  { name: 'restless', bravery: 0.46, pace: 1.10, interval: 2.9, look: 0.92 },
  { name: 'resolute', bravery: 0.84, pace: 1.03, interval: 5.4, look: 0.58 },
  { name: 'guarded', bravery: 0.33, pace: 0.93, interval: 3.8, look: 0.72 },
  { name: 'swift', bravery: 0.67, pace: 1.12, interval: 4.5, look: 0.66 },
  { name: 'measured', bravery: 0.73, pace: 0.97, interval: 5.8, look: 0.53 },
  { name: 'reactive', bravery: 0.28, pace: 1.06, interval: 2.7, look: 0.88 },
  { name: 'expressive', bravery: 0.40, pace: 1.00, interval: 3.2, look: 0.77 },
];
const skins = ['#d7aa88', '#b6805f', '#8c5c43', '#e2b99a', '#684434', '#bc9272', '#d4ad86'];
const hairs = ['#241d19', '#453125', '#221d1c', '#776143', '#b69a63', '#382b26', '#62605b'];

function createRig(seed, index, bodyMaterial) {
  const partBuilder = () => createPartBuilder(bodyMaterial);
  const random = rng(seed);
  const root = new THREE.Group();
  root.name = 'human';
  const motion = new THREE.Group();
  root.add(motion);
  const body = new THREE.Group();
  motion.add(body);
  const outfit = tracksuit;
  const skin = skins[Math.floor(random() * skins.length)];
  const hair = hairs[Math.floor(random() * hairs.length)];
  const slim = index % 3 === 1;
  const width = slim ? 0.91 : 0.97 + random() * 0.10;
  const height = 0.94 + random() * 0.10;
  root.scale.set(width * height, height, height);
  const hips = new THREE.Group();
  hips.position.y = 0.90;
  body.add(hips);
  const chest = new THREE.Group();
  chest.position.y = 0.105;
  hips.add(chest);

  let b = partBuilder();
  b.loft(outfit.pants, [
    [-0.085, 0.125, 0.094], [-0.055, 0.168, 0.106], [0.04, 0.17, 0.102], [0.14, 0.148, 0.091],
  ]);
  b.loft(shade(outfit.pants, 0.77), [[0.097, 0.152, 0.096], [0.128, 0.151, 0.096]]);
  for (const side of [-1, 1]) {
    b.tube(shade(outfit.pants, 0.78), [side * 0.065, 0.07, 0.097], [side * 0.135, 0.015, 0.09], 0.003);
    b.box(outfit.accent, [side * 0.164, 0.015, 0], [0.009, 0.17, 0.028]);
  }
  b.finish(hips);

  b = partBuilder();
  const jacket = outfit.kind === 'jacket';
  b.loft(outfit.top, [
    [0.005, 0.153, 0.095], [0.06, 0.151, 0.102], [0.16, 0.147, 0.103],
    [0.29, slim ? 0.166 : 0.184, 0.116, 0.008], [0.395, 0.192, 0.105], [0.442, 0.161, 0.084],
    [0.456, 0.080, 0.069],
  ]);
  // Hem, side seams, sewn shoulder yoke and fine center opening.
  b.loft(shade(outfit.top, 0.78), [[0.005, 0.154, 0.097], [0.024, 0.154, 0.098]]);
  b.tube('#163c31', [0, 0.036, 0.106], [0, 0.383, 0.117], 0.005);
  b.tube('#8b957e', [0.002, 0.036, 0.111], [0.002, 0.378, 0.121], 0.0017);
  b.box('#b8b69f', [0.004, 0.364, 0.126], [0.009, 0.018, 0.005]);
  b.box(outfit.shirt, [0, 0.390, 0.085], [0.074, 0.115, 0.045]);
  for (const side of [-1, 1]) {
    b.tube(shade(outfit.top, 1.12), [side * 0.16, 0.026, 0.028], [side * 0.179, 0.364, 0.035], 0.002);
    b.box(shade(outfit.top, 0.85), [side * 0.061, 0.414, 0.106], [0.053, 0.078, 0.012], [0, 0, side * -0.34]);
    b.box(outfit.accent, [side * 0.142, 0.438, 0.001], [0.105, 0.012, 0.040], [0, 0, side * -0.10]);
    if (jacket) {
      b.tube(shade(outfit.top, 0.60), [side * 0.108, 0.064, 0.093], [side * 0.123, 0.156, 0.101], 0.005);
    }
  }
  // Slight fabric wrinkles below the chest and under both arms.
  for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
    b.tube(shade(outfit.top, 0.89), [side * 0.042, 0.08 + k * 0.034, 0.106], [side * 0.13, 0.062 + k * 0.036, 0.087], 0.0025);
  }
  b.finish(chest);

  const neck = new THREE.Group();
  neck.position.set(0, 0.455, 0);
  chest.add(neck);
  b = partBuilder();
  b.loft(skin, [[0, 0.054, 0.052], [0.10, 0.052, 0.049]]);
  b.finish(neck);
  const head = new THREE.Group();
  head.position.set(0, 0.061, 0.008);
  neck.add(head);
  b = partBuilder();
  // Sculpted jaw, cheeks, temples and cranial dome: no spherical toy head.
  b.loft(skin, [
    [-0.018, 0.042, 0.041, 0.014], [0.008, 0.068, 0.061, 0.009],
    [0.054, 0.083, 0.070, 0.003], [0.106, 0.092, 0.075],
    [0.160, 0.090, 0.076, -0.005], [0.207, 0.078, 0.070, -0.009],
    [0.240, 0.049, 0.051, -0.010], [0.250, 0.007, 0.010, -0.010],
  ], 20);
  for (const side of [-1, 1]) {
    b.ellipsoid(skin, [side * 0.091, 0.093, -0.002], [0.018, 0.034, 0.019]);
    b.ellipsoid(shade(skin, 0.72), [side * 0.102, 0.096, 0.008], [0.007, 0.020, 0.006], null, 8);
    // Eyelids keep the eye whites small enough for natural adult proportions.
    b.ellipsoid(shade(skin, 0.77), [side * 0.035, 0.119, 0.065], [0.023, 0.013, 0.010]);
    b.ellipsoid('#cfcdc0', [side * 0.035, 0.120, 0.074], [0.0165, 0.0065, 0.005]);
    b.ellipsoid('#4b4435', [side * 0.034, 0.120, 0.079], [0.005, 0.0056, 0.0028], null, 8);
    b.ellipsoid('#181817', [side * 0.034, 0.120, 0.081], [0.0026, 0.0032, 0.0016], null, 8);
    b.tube(shade(hair, 0.9), [side * 0.017, 0.142, 0.070], [side * 0.056, 0.139, 0.068], 0.0037, 0.0023);
    b.ellipsoid(shade(skin, 1.025), [side * 0.044, 0.081, 0.064], [0.028, 0.025, 0.012]);
  }
  b.ellipsoid(shade(skin, 0.98), [0, 0.106, 0.078], [0.0125, 0.030, 0.017]);
  b.ellipsoid(shade(skin, 1.06), [0, 0.085, 0.089], [0.016, 0.011, 0.014]);
  for (const side of [-1, 1]) b.ellipsoid(shade(skin, 0.64), [side * 0.009, 0.079, 0.091], [0.004, 0.0025, 0.003], null, 8);
  b.ellipsoid(shade(skin, 0.70), [0, 0.046, 0.068], [0.025, 0.0038, 0.006], null, 12);
  b.ellipsoid(shade(skin, 0.88), [0, 0.041, 0.069], [0.022, 0.0045, 0.006], null, 12);
  b.ellipsoid(shade(skin, 1.015), [0, 0.017, 0.058], [0.031, 0.012, 0.014]);
  if (index % 7 === 3) {
    b.ellipsoid(shade(hair, 1.4), [0, 0.011, 0.053], [0.051, 0.021, 0.031]);
    for (const side of [-1, 1]) b.tube(hair, [side * 0.066, 0.070, 0.037], [side * 0.046, 0.017, 0.054], 0.007);
  }
  // Individually shaped hair cap; a high forehead and temple cuts remain visible.
  const hairGeo = new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, 1.45);
  b.add(hairGeo, hair, [0, 0.142, -0.011], [0.095, 0.116, 0.080]);
  for (const side of [-1, 1]) {
    b.ellipsoid(hair, [side * 0.084, 0.133, -0.029], [0.012, 0.045, 0.043]);
    b.tube(hair, [side * 0.081, 0.157, 0.009], [side * 0.082, 0.110, 0.005], 0.008, 0.005);
  }
  if (slim) {
    b.ellipsoid(hair, [0, 0.141, -0.093], [0.049, 0.042, 0.037]);
    b.ellipsoid(hair, [0.012, 0.080, -0.112], [0.028, 0.079, 0.026], [-0.25, 0, -0.10]);
    b.tube(outfit.accent, [-0.022, 0.142, -0.100], [0.022, 0.142, -0.100], 0.005);
  } else {
    // Combed locks are sculpted in small overlapping volumes, not random spikes.
    for (let i = 0; i < 5; i++) b.ellipsoid(shade(hair, 1.04 + i * 0.018), [-0.052 + i * 0.022, 0.232, 0.014], [0.024, 0.023, 0.063], [0.10, 0.12, -0.15], 10);
  }
  if (index % 9 === 5) {
    for (const side of [-1, 1]) {
      b.add(new THREE.TorusGeometry(0.022, 0.002, 5, 12), '#342f29', [side * 0.036, 0.122, 0.083], [1, 0.72, 1]);
      b.tube('#342f29', [side * 0.058, 0.125, 0.083], [side * 0.093, 0.127, 0.005], 0.002);
    }
    b.tube('#342f29', [-0.015, 0.123, 0.086], [0.015, 0.123, 0.086], 0.002);
  }
  b.finish(head);

  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const upper = new THREE.Group();
    upper.position.set(side * 0.096, 0, 0);
    hips.add(upper);
    b = partBuilder();
    b.loft(outfit.pants, [[-0.410, 0.057, 0.061], [-0.35, 0.064, 0.067], [-0.20, 0.079, 0.080], [-0.065, 0.086, 0.086], [0.027, 0.073, 0.080]]);
    b.tube(shade(outfit.pants, 1.12), [side * 0.080, -0.09, -0.008], [side * 0.056, -0.39, -0.008], 0.0025);
    b.box(outfit.accent, [side * 0.076, -0.183, 0], [0.010, 0.315, 0.027], [0, 0, side * 0.072]);
    b.tube(shade(outfit.pants, 0.78), [-0.025, -0.340, 0.063], [0.042, -0.359, 0.059], 0.003);
    b.finish(upper);
    const lower = new THREE.Group();
    lower.position.y = -0.40;
    upper.add(lower);
    b = partBuilder();
    b.loft(outfit.pants, [[-0.385, 0.043, 0.046], [-0.33, 0.048, 0.052], [-0.19, 0.056, 0.064, -0.010], [-0.065, 0.061, 0.064], [0.018, 0.057, 0.059]]);
    b.ellipsoid(shade(outfit.pants, 1.04), [0, -0.007, 0.024], [0.057, 0.061, 0.039]);
    b.loft(shade(outfit.pants, 0.80), [[-0.386, 0.046, 0.049], [-0.362, 0.046, 0.050]]);
    b.tube(shade(outfit.pants, 1.10), [side * 0.058, -0.043, 0], [side * 0.046, -0.36, 0], 0.0025);
    b.box(outfit.accent, [side * 0.053, -0.194, 0], [0.010, 0.359, 0.027], [0, 0, side * 0.035]);
    b.finish(lower);
    const foot = new THREE.Group();
    foot.position.y = -0.385;
    lower.add(foot);
    b = partBuilder();
    const shoe = index % 3 === 0 ? '#50473b' : '#343638';
    b.ellipsoid('#242627', [0, -0.066, 0.044], [0.061, 0.028, 0.126]);
    b.ellipsoid(shade(shoe, 1.1), [0, -0.044, 0.055], [0.059, 0.038, 0.115]);
    b.ellipsoid(shoe, [0, -0.009, -0.010], [0.051, 0.064, 0.060]);
    b.ellipsoid(shade(shoe, 1.2), [0, -0.027, 0.108], [0.054, 0.028, 0.055]);
    b.box('#85867b', [0, -0.066, 0.056], [0.110, 0.014, 0.195]);
    b.ellipsoid('#252829', [0, -0.078, 0.051], [0.059, 0.014, 0.120]);
    b.box(shade(shoe, 0.7), [0, 0.006, 0.043], [0.041, 0.014, 0.061], [-0.34, 0, 0]);
    for (let i = 0; i < 3; i++) b.tube('#b2b0a1', [-0.020, 0.014 - i * 0.008, 0.029 + i * 0.017], [0.020, 0.014 - i * 0.008, 0.037 + i * 0.017], 0.002);
    b.finish(foot);
    legs.push({ upper, lower, foot, side });

    const arm = new THREE.Group();
    arm.position.set(side * 0.193, 0.394, 0.003);
    chest.add(arm);
    b = partBuilder();
    b.ellipsoid(outfit.top, [side * 0.018, -0.038, 0], [0.071, 0.091, 0.075]);
    b.loft(outfit.top, [[-0.280, 0.045, 0.049], [-0.18, 0.057, 0.063], [-0.065, 0.064, 0.067], [0.012, 0.047, 0.052]]);
    b.tube(shade(outfit.top, 1.15), [side * 0.057, -0.035, -0.025], [side * 0.044, -0.265, -0.015], 0.0025);
    b.box(outfit.accent, [side * 0.064, -0.138, 0], [0.009, 0.25, 0.032], [0, 0, side * 0.068]);
    b.ellipsoid(outfit.accent, [side * 0.045, 0.016, 0], [0.043, 0.012, 0.021]);
    b.finish(arm);
    const elbow = new THREE.Group();
    elbow.position.y = -0.275;
    arm.add(elbow);
    b = partBuilder();
    const rolled = false;
    b.ellipsoid(outfit.top, [0, -0.005, 0], [0.048, 0.053, 0.053]);
    if (rolled) {
      b.loft(skin, [[-0.237, 0.029, 0.030], [-0.17, 0.037, 0.038], [-0.06, 0.045, 0.046], [0.010, 0.042, 0.043]]);
      b.loft(shade(outfit.top, 1.1), [[-0.055, 0.048, 0.052], [-0.020, 0.050, 0.053]]);
    } else {
      b.loft(outfit.top, [[-0.236, 0.033, 0.034], [-0.195, 0.037, 0.040], [-0.08, 0.045, 0.048], [0.010, 0.044, 0.047]]);
      b.loft(shade(outfit.top, 0.77), [[-0.239, 0.034, 0.035], [-0.211, 0.035, 0.037]]);
      b.ellipsoid(outfit.accent, [0, -0.226, 0.038], [0.004, 0.004, 0.003], null, 8);
      b.box(outfit.accent, [side * 0.042, -0.113, 0], [0.008, 0.20, 0.029], [0, 0, side * 0.043]);
    }
    if (side === -1 && index % 3 === 0) {
      b.loft('#252c2b', [[-0.239, 0.036, 0.037], [-0.219, 0.037, 0.039]]);
      b.box('#a8b4ac', [0, -0.228, 0.040], [0.026, 0.029, 0.006]);
      b.box('#202b29', [0, -0.228, 0.044], [0.020, 0.023, 0.003]);
    }
    b.finish(elbow);
    const hand = new THREE.Group();
    hand.position.y = -0.240;
    elbow.add(hand);
    b = partBuilder();
    b.ellipsoid(skin, [0, -0.037, 0.006], [0.032, 0.046, 0.022]);
    for (let finger = 0; finger < 4; finger++) {
      const fx = -0.022 + finger * 0.014;
      const length = finger === 0 || finger === 3 ? 0.030 : 0.037;
      b.tube(skin, [fx, -0.055, 0.011], [fx, -0.055 - length, 0.020], 0.007, 0.006);
      b.ellipsoid(shade(skin, 0.94), [fx, -0.055 - length, 0.024], [0.007, 0.010, 0.010], null, 8);
    }
    b.ellipsoid(skin, [-side * 0.031, -0.027, 0.016], [0.012, 0.026, 0.013], [0.3, 0, side * -0.3]);
    b.finish(hand);
    arms.push({ upper: arm, lower: elbow, hand, side });
  }
  return { root, motion, body, hips, chest, neck, head, legs, arms, height, seed };
}

function shortestAngle(a, b) {
  return ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

function approachRotation(object, x, y, z, alpha) {
  object.rotation.x = lerp(object.rotation.x, x, alpha);
  object.rotation.y = lerp(object.rotation.y, y, alpha);
  object.rotation.z = lerp(object.rotation.z, z, alpha);
}

function updateReactions(actor, dt, now) {
  let active = false;
  for (const type of characterQuality.reactions) {
    const reaction = actor._reactions[type];
    const remaining = reaction.until - now;
    const target = actor.alive && remaining > 0 ? reaction.intensity * clamp(remaining / 0.18, 0, 1) : 0;
    reaction.weight = lerp(reaction.weight, target, 1 - Math.exp(-dt * (target > reaction.weight ? 21 : 10)));
    if (reaction.weight < 0.001) reaction.weight = 0;
    actor._reactionWeights[type] = reaction.weight;
    active ||= reaction.weight > 0;
  }
  actor._hasReaction = active;
}

function updateInjuryMotion(actor, dt, now) {
  const injury = actor._injury, health = actor.health;
  const ratio = Number.isFinite(health?.ratio) ? clamp(health.ratio, 0, 1)
    : Number.isFinite(health?.current) ? clamp(health.current / Math.max(1, health.max || 100), 0, 1) : 1;
  const target = actor.invincible ? 0 : clamp((1 - ratio - 0.02) / 0.78, 0, 1);
  injury.severity = lerp(injury.severity, target, 1 - Math.exp(-dt * 5));
  if (injury.severity < 0.0001) injury.severity = 0;
  injury.ratio = ratio;
  injury.stage = health?.stage || 'healthy';
  injury.kind = health?.lastKind || 'impact';
  if (!actor.alive || actor.action === 'fall' || actor.action === 'dead' || actor.invincible) return;
  if (ratio < injury.previousRatio - 0.055) injury.nextPainAt = Math.min(injury.nextPainAt, now + actor._random() * 0.25);
  injury.previousRatio = ratio;
  if (injury.severity > 0.12 && now >= injury.nextPainAt) {
    const severity = injury.severity;
    injury.nextPainAt = now + 1.5 + actor._random() * 2.2 + actor.personality.bravery * 0.8;
    const kind = injury.kind;
    let reaction = kind === 'poison' || kind === 'water' ? 'cough' : kind === 'cold' ? 'shiver'
      : kind === 'heat' ? 'heat' : severity > 0.60 && actor._random() < 0.34 ? 'stumble' : 'fear';
    // Pain is additive. A hazard's refuge target and commanded posture retain
    // control, including the late escape from closing walls.
    if (actor._hasTarget && (reaction === 'stumble' || reaction === 'cough')) reaction = 'fear';
    actor.setReaction(reaction, 0.18 + severity * 0.44, 0.45 + actor._random() * 0.38);
    if (actor._expression.type === 'neutral' || actor._expression.type === 'fear') {
      const choice = actor._random();
      const expression = severity > 0.65 && choice < 0.18 ? 'scream' : severity > 0.45 && choice < 0.40 ? 'cry' : 'fear';
      actor.setExpression(expression, 0.25 + severity * 0.65, expression === 'scream' ? 0.60 : 1.35);
    }
  }
  const spring = actor._squish;
  const frequencyScale = 0.55 / clamp(spring.duration, 0.30, 0.90);
  let remaining = dt;
  while (remaining > 0) {
    const h = Math.min(remaining, 1 / 120);
    const held = spring.kind === 'crush' && now < spring.until ? spring.intensity * 0.45 : 0;
    spring.velocity += ((held - spring.value) * 185 * frequencyScale ** 2 - spring.velocity * 18 * frequencyScale) * h;
    spring.value = clamp(spring.value + spring.velocity * h, -0.24, 1);
    remaining -= h;
  }
  if (now > spring.until && Math.abs(spring.value) + Math.abs(spring.velocity) < 0.0005) spring.value = spring.velocity = 0;
}

function restoreSecondaryPose(rig) {
  if (!rig.secondaryPose?.active) return;
  for (const pose of rig.secondaryPose.joints) {
    pose.object.position.copy(pose.p); pose.object.quaternion.copy(pose.q); pose.object.scale.copy(pose.s);
  }
  rig.secondaryPose.active = false;
}

function saveSecondaryPose(rig) {
  if (rig.secondaryPose?.active) return;
  if (!rig.secondaryPose) {
    const objects = rig.realistic ? Object.values(rig.bones) : [rig.hips, rig.chest, rig.head, ...rig.arms.flatMap(a => [a.upper, a.lower, a.hand]), ...rig.legs.flatMap(a => [a.upper, a.lower, a.foot])];
    rig.secondaryPose = { active: false, joints: objects.map(object => ({ object, p: object.position.clone(), q: object.quaternion.clone(), s: object.scale.clone() })) };
  }
  for (const pose of rig.secondaryPose.joints) {
    pose.p.copy(pose.object.position); pose.q.copy(pose.object.quaternion); pose.s.copy(pose.object.scale);
  }
  rig.secondaryPose.active = true;
}

function applyInjuryPose(actor) {
  const rig = actor._rig, injury = actor._injury, severity = injury.severity, spring = actor._squish;
  if (severity < 0.001 && Math.abs(spring.value) < 0.0001 || actor.invincible) return;
  saveSecondaryPose(rig);
  const side = injury.side, now = actor._animationClock;
  const moving = actor.action === 'run' || actor.action === 'panic';
  const swimming = actor.action === 'swim';
  const gait = rig.realistic ? (rig.run?.time || 0) / rig.gait.duration * TAU : actor._phase;
  const stance = Math.max(0, Math.cos(gait + (side < 0 ? Math.PI : 0))) ** 2;
  const limp = moving && !swimming ? severity * (actor._hasTarget ? 0.34 : 0.85) : 0;
  const guard = severity * (swimming ? 0.25 : 1);
  const breath = Math.sin(now * (2.5 + severity * 1.2) + actor._seed % 11) * severity;
  const squeeze = spring.value;
  if (rig.realistic) {
    const b = rig.bones, arm = side > 0 ? 'l' : 'r';
    poseBone(rig, b.bip01spine1 || b.bip01spine, 'x', guard * 0.22 + breath * 0.013 + squeeze * 0.035);
    poseBone(rig, b.bip01spine2, 'z', side * guard * 0.045 + side * limp * stance * 0.035);
    poseBone(rig, b.bip01neck, 'x', -guard * 0.065);
    poseBone(rig, b.bip01head, 'x', -guard * 0.055);
    poseBone(rig, b[`bip01${arm}upperarm`], 'x', -guard * (moving ? 0.26 : 0.40));
    poseBone(rig, b[`bip01${arm}upperarm`], 'z', -side * guard * 0.22);
    poseBone(rig, b[`bip01${arm}forearm`], 'x', -guard * (moving ? 0.36 : 0.98));
    poseBone(rig, b[`bip01${arm}forearm`], 'y', -side * guard * (moving ? 0.20 : 0.50));
    poseBone(rig, b[`bip01${arm}hand`], 'y', side * guard * 0.12);
    for (const [leg, sign] of [['l', 1], ['r', -1]]) {
      const hurt = sign === side;
      poseBone(rig, b[`bip01${leg}thigh`], 'x', limp * (hurt ? -0.11 * stance : 0.035 * stance));
      poseBone(rig, b[`bip01${leg}calf`], 'x', limp * (hurt ? 0.19 * stance : 0.04));
      poseBone(rig, b[`bip01${leg}clavicle`], 'z', sign * guard * 0.035);
    }
  } else {
    rig.chest.rotation.x += guard * 0.22 + breath * 0.013 + squeeze * 0.035;
    rig.chest.rotation.z += side * guard * 0.045 + side * limp * stance * 0.035;
    rig.head.rotation.x -= guard * 0.08;
    for (let i = 0; i < rig.arms.length; i++) {
      const arm = rig.arms[i], leg = rig.legs[i];
      if (arm.side === side) { arm.upper.rotation.x -= guard * 0.32; arm.upper.rotation.z += arm.side * guard * 0.22; arm.lower.rotation.x -= guard * 0.92; arm.lower.rotation.y += arm.side * guard * 0.50; }
      if (leg.side === side) { leg.upper.rotation.x -= limp * stance * 0.11; leg.lower.rotation.x += limp * stance * 0.19; }
    }
  }
  applyTorsoCompression(rig, squeeze, spring.side, spring.kind === 'crush');
  spring.renderedValue = spring.kind === 'crush' ? squeeze : 0;
  spring.pending = false;
}

function applyTorsoCompression(rig, amount, side, crushing) {
  if (Math.abs(amount) < 0.00001) return;
  // Compression is localized to weighted torso segments. The stronger crush
  // envelope shortens the torso by up to9.3cm, with modest lateral spreading;
  // faces, feet and all transform scales retain their original proportions.
  const length = crushing ? 3 : 1, width = crushing ? 1.9 : 1;
  if (rig.realistic) {
    const b = rig.bones, frame = rig.pivot;
    rig.root.updateMatrixWorld(true);
    translateFaceBone(rig, b.bip01spine1 || b.bip01spine, 0, -0.017 * amount * length, 0, frame);
    translateFaceBone(rig, b.bip01spine2, side * amount * 0.006, -0.014 * amount * length, 0.003 * amount, frame);
    translateFaceBone(rig, b.bip01lclavicle, 0.008 * amount * width, 0, 0, frame);
    translateFaceBone(rig, b.bip01rclavicle, -0.008 * amount * width, 0, 0, frame);
  } else {
    rig.chest.position.y -= amount * 0.031 * length;
    rig.chest.position.x += side * amount * 0.006;
    for (const arm of rig.arms) arm.upper.position.x += arm.side * amount * 0.008 * width;
  }
}

function updatePersonality(actor, state, now) {
  if (!actor.alive || actor._frozenPose || actor.action === 'fall' || actor.action === 'dead') return;
  if (actor._autoActionUntil && now >= actor._autoActionUntil) {
    if (actor.action === actor._autoAction) actor.action = 'run';
    actor._autoActionUntil = 0;
  }
  const pressure = state.phase === 'running' || state.phase === 'reveal' ? clamp(state.progress || 0, 0, 1) : 0.08;
  if (now >= actor._lookAt) {
    actor._gazeTarget = (actor._random() - 0.5) * (0.21 + pressure * 0.26);
    actor._lookAt = now + 1.5 + actor._random() * 3.5;
  }
  if (now < actor._gestureAt || !['run', 'idle'].includes(actor.action)) return;
  actor._gestureAt = now + actor.personality.gestureInterval * (0.75 + actor._random() * 0.65);
  if (actor.invincible || pressure < 0.30) return;
  const anxiety = clamp(pressure * (1.15 - actor.personality.bravery * 0.55), 0, 1);
  actor.setReaction('fear', anxiety * 0.65, 0.8 + actor._random() * 0.6);
  // Explicit hazard commands keep control of travel and posture. Independent
  // expression timing is safe while moving toward a commanded refuge.
  if (actor._expression.type === 'neutral') {
    const choice = actor._random();
    const expression = anxiety > 0.58 && choice < 0.20 ? 'scream' : anxiety > 0.58 && choice < 0.45 ? 'cry' : 'fear';
    actor.setExpression(expression, anxiety, expression === 'scream' ? 0.65 : 1.3);
  }
  if (!actor._hasTarget && !actor._awareness.behavior && actor._freezing.amount < 0.10 && now > actor._explicitActionUntil && pressure > 0.55 && actor._random() < 0.22) {
    actor._autoAction = 'crouch'; actor.action = 'crouch';
    actor._autoActionUntil = now + 0.35 + actor._random() * 0.40;
    actor.setReaction('brace', anxiety * 0.45, 0.45);
  } else if (!actor._hasTarget && actor._random() < 0.28) {
    actor.setReaction('shiver', anxiety * 0.38, 0.7);
  }
}

const dangerBehaviors = {
  gas: 'cover-face', poison: 'cover-face', collapse: 'shield-head', impact: 'shield-head',
  rats: 'ward-off', bite: 'ward-off', boiler: 'heat-recoil', heat: 'heat-recoil',
  freeze: 'cold-hug', cold: 'cold-hug', electric: 'brace', crushing: 'brace', crush: 'brace',
  spikes: 'duck', impale: 'duck', lasers: 'duck', laser: 'duck',
};

function updateAwareness(actor, dt, state, actors, bounds) {
  const awareness = actor._awareness, now = actor._clock;
  if (!actor.alive || actor.invincible || actor._frozenPose || ['fall', 'dead', 'celebrate'].includes(actor.action)) return;
  const activeRound = state.phase === 'running' || state.phase === 'reveal';
  const contact = now < awareness.contactUntil;
  const scenario = contact ? awareness.contactKind : activeRound ? state.scenarioId : null;
  const behavior = dangerBehaviors[scenario] || null;
  const pressure = activeRound ? clamp(state.progress || 0, 0, 1) : 0;
  if (awareness.scenario !== scenario) {
    awareness.scenario = scenario; awareness.nextAt = contact ? now : now + actor._random() * 0.40;
    awareness.moveUntil = 0;
  }
  if (behavior && now >= awareness.nextAt) {
    awareness.behavior = behavior;
    awareness.side = actor._random() > 0.5 ? 1 : -1;
    awareness.variant = actor._random();
    const urgent = contact ? awareness.intensity : Math.max(pressure * 0.7, actor._injury.severity * 0.65);
    awareness.strength = clamp(0.55 + urgent * 0.43 - actor.personality.bravery * 0.10, 0.48, 0.98);
    awareness.protectUntil = now + (behavior === 'cover-face' || behavior === 'cold-hug' ? 1.6 : 0.65) + actor._random() * 0.75;
    awareness.nextAt = awareness.protectUntil + (behavior === 'cover-face' || behavior === 'cold-hug' ? 0.10 : 0.35) + actor._random() * 0.85;
    awareness.decisions++;
    actor._gazeTarget = awareness.side * (0.11 + actor._random() * 0.14);
    actor._lookAt = now + 0.7 + actor._random() * 0.7;
    // Short, crowd-aware escape steps belong to autonomous movement only. A
    // hazard's explicit refuge always retains its original target and pace.
    if (!actor._hasTarget && ['run', 'panic'].includes(actor.action) && behavior !== 'cold-hug') {
      let away = actor.root.rotation.y;
      if (contact && awareness.hasSource) away = Math.atan2(actor.position.x - awareness.sourceX, actor.position.z - awareness.sourceZ);
      const distance = (contact ? 1.2 : 0.65) + actor._random() * 0.85;
      let best = -Infinity;
      for (const offset of [0, -0.48, 0.48, -0.95, 0.95, -1.5, 1.5]) {
        const heading = away + offset;
        const x = clamp(actor.position.x + Math.sin(heading) * distance, bounds.minX, bounds.maxX);
        const z = clamp(actor.position.z + Math.cos(heading) * distance, bounds.minZ, bounds.maxZ);
        const travel = Math.hypot(x - actor.position.x, z - actor.position.z);
        let score = travel - Math.abs(offset) * 0.18;
        for (const other of actors) {
          if (other === actor || !other.alive) continue;
          const clearance = Math.hypot(x - other.position.x, z - other.position.z);
          score -= Math.max(0, 1.05 - clearance) * 3;
        }
        if (score > best) { best = score; awareness.moveX = x; awareness.moveZ = z; }
      }
      awareness.moveUntil = now + (contact ? 1.25 : 0.90) + actor._random() * 0.6;
      actor._locomotion.pauseUntil = Math.min(actor._locomotion.pauseUntil, now);
    }
  }
  const target = behavior && now < awareness.protectUntil && actor.action !== 'swim' ? awareness.strength : 0;
  awareness.weight = lerp(awareness.weight, target, 1 - Math.exp(-dt * (target > awareness.weight ? 11 : 7)));
  if (!behavior && awareness.weight < 0.001) awareness.behavior = null;
}

// Two-bone arm placement keeps the hand near the actual mouth/head/upper arm,
// independently of the imported rig's axes or where its run cycle currently is.
const armIK = Object.fromEntries(['shoulder', 'elbow', 'wrist', 'target', 'pole', 'direction', 'bend', 'desiredElbow', 'from', 'to'].map(name => [name, new THREE.Vector3()]));
const armIKDelta = new THREE.Quaternion(), armIKParent = new THREE.Quaternion(), armIKGoal = new THREE.Quaternion();
function aimBoneAt(bone, child, point, weight) {
  bone.getWorldPosition(armIK.from); child.getWorldPosition(armIK.to);
  armIK.to.sub(armIK.from).normalize(); armIK.from.copy(point).sub(bone.getWorldPosition(armIK.wrist)).normalize();
  armIKDelta.setFromUnitVectors(armIK.to, armIK.from);
  bone.parent.getWorldQuaternion(armIKParent);
  armIKGoal.copy(armIKParent).invert().multiply(armIKDelta).multiply(armIKParent).multiply(bone.quaternion);
  bone.quaternion.slerp(armIKGoal, weight); bone.updateMatrixWorld(true);
}
function protectArm(actor, side, anchor, x, y, z, weight, elbowForward = 0.20) {
  const rig = actor._rig, key = side > 0 ? 'l' : 'r';
  const upper = rig.bones[`bip01${key}upperarm`], lower = rig.bones[`bip01${key}forearm`], hand = rig.bones[`bip01${key}hand`];
  if (!upper || !lower || !hand) return;
  upper.getWorldPosition(armIK.shoulder); lower.getWorldPosition(armIK.elbow); hand.getWorldPosition(armIK.wrist);
  const a = armIK.shoulder.distanceTo(armIK.elbow), b = armIK.elbow.distanceTo(armIK.wrist);
  armIK.target.set(x, y, z); anchor.localToWorld(armIK.target);
  armIK.direction.copy(armIK.target).sub(armIK.shoulder);
  const distance = clamp(armIK.direction.length(), Math.abs(a - b) + 0.015, (a + b) * 0.97);
  armIK.direction.normalize(); armIK.target.copy(armIK.shoulder).addScaledVector(armIK.direction, distance);
  armIK.pole.set(side * 0.42, 0.98, elbowForward); rig.root.localToWorld(armIK.pole);
  armIK.bend.copy(armIK.pole).sub(armIK.shoulder);
  armIK.bend.addScaledVector(armIK.direction, -armIK.bend.dot(armIK.direction)).normalize();
  const along = (a * a - b * b + distance * distance) / (2 * distance);
  armIK.desiredElbow.copy(armIK.shoulder).addScaledVector(armIK.direction, along).addScaledVector(armIK.bend, Math.sqrt(Math.max(0, a * a - along * along)));
  aimBoneAt(upper, lower, armIK.desiredElbow, weight);
  aimBoneAt(lower, hand, armIK.target, weight);
  const neutralHand = rig.neutralTransforms.get(hand.name);
  if (neutralHand) hand.quaternion.slerp(neutralHand.q, weight * 0.65);
  hand.updateMatrixWorld(true);
}

function applyAwarenessPose(actor) {
  const awareness = actor._awareness, rig = actor._rig, weight = awareness.weight;
  if (weight < 0.002 || !awareness.behavior || actor.invincible || actor.action === 'swim') return;
  saveSecondaryPose(rig);
  const side = awareness.side, t = actor._animationClock, variant = awareness.variant;
  const behavior = awareness.behavior;
  const hunch = behavior === 'cover-face' ? 0.12 : behavior === 'shield-head' || behavior === 'duck' ? 0.18 : behavior === 'cold-hug' ? 0.11 : behavior === 'heat-recoil' ? -0.045 : 0.08;
  if (rig.realistic) {
    poseBone(rig, rig.bones.bip01spine2, 'x', hunch * weight);
    poseBone(rig, rig.bones.bip01head, 'x', (behavior === 'ward-off' ? 0.12 : -hunch * 0.48) * weight);
    poseBone(rig, rig.bones.bip01spine2, 'y', side * Math.sin(t * 1.2 + variant * 6) * 0.035 * weight);
    rig.root.updateMatrixWorld(true);
    const head = rig.headAnchor, chest = rig.chestAnchor;
    if (behavior === 'cover-face') {
      protectArm(actor, side, head, side * 0.025, -0.105, 0.17, weight);
      protectArm(actor, -side, chest, side * 0.06, -0.19, 0.16, weight * 0.76);
    } else if (behavior === 'shield-head' || behavior === 'duck') {
      protectArm(actor, side, head, side * 0.09, 0.14, 0.025, weight, 0.26);
      if (variant > 0.22 || behavior === 'duck') protectArm(actor, -side, head, -side * 0.09, 0.09, 0.09, weight * 0.94, 0.30);
    } else if (behavior === 'cold-hug') {
      protectArm(actor, side, chest, -side * 0.15, 0.05, 0.15, weight);
      protectArm(actor, -side, chest, side * 0.13, -0.04, 0.19, weight);
      poseBone(rig, rig.bones.bip01spine2, 'z', Math.sin(t * 22 + actor._phase) * 0.012 * weight);
    } else if (behavior === 'heat-recoil') {
      protectArm(actor, side, head, side * 0.11, -0.025, 0.19, weight);
      protectArm(actor, -side, chest, -side * 0.22, -0.07, 0.38, weight * 0.83);
    } else if (behavior === 'ward-off') {
      const swat = Math.sin(t * 5.2 + actor._seed % 7);
      protectArm(actor, side, chest, side * (0.20 + swat * 0.08), -0.31 + swat * 0.04, 0.32, weight);
      protectArm(actor, -side, chest, -side * 0.16, -0.09, 0.20, weight * 0.68);
    } else {
      protectArm(actor, side, chest, side * 0.17, 0.055, 0.40, weight);
      protectArm(actor, -side, chest, -side * 0.17, 0.005, 0.36, weight * 0.88);
    }
  } else {
    rig.chest.rotation.x += hunch * weight;
    for (const arm of rig.arms) {
      const raised = behavior === 'shield-head' || behavior === 'duck';
      arm.upper.rotation.x = lerp(arm.upper.rotation.x, raised ? -1.5 : -0.58, weight);
      arm.upper.rotation.z = lerp(arm.upper.rotation.z, arm.side * (raised ? 0.32 : 0.10), weight);
      arm.lower.rotation.x = lerp(arm.lower.rotation.x, raised ? -1.2 : -1.7, weight);
      if (behavior === 'cold-hug') arm.upper.rotation.y = lerp(arm.upper.rotation.y, -arm.side * 0.8, weight);
    }
  }
}

const boneAxis = new THREE.Vector3();
const frameRotation = new THREE.Quaternion();
const parentRotation = new THREE.Quaternion();
const deltaRotation = new THREE.Quaternion();
function poseBone(rig, bone, axis, angle) {
  if (!bone || Math.abs(angle) < 0.0001) return;
  // Imported bones have artist-defined axes. Express pose rotations in the
  // character's frame, then transform that axis into each bone parent's space.
  rig.pivot.getWorldQuaternion(frameRotation);
  bone.parent.getWorldQuaternion(parentRotation).invert();
  boneAxis.set(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
    .applyQuaternion(frameRotation).applyQuaternion(parentRotation).normalize();
  deltaRotation.setFromAxisAngle(boneAxis, angle);
  bone.quaternion.premultiply(deltaRotation);
  bone.updateMatrixWorld(true);
}

function createNumberTexture(number) {
  let texture;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#123d2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#315b46';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.strokeStyle = '#51705a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    ctx.setLineDash([]);
    ctx.fillStyle = '#eee7cf';
    ctx.font = '700 168px "Arial Narrow", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, 192, 120, 338);
    texture = new THREE.CanvasTexture(canvas);
  } else {
    // A tiny local pixel font keeps the fallback number defined in non-DOM
    // environments as well as in the browser; no external fonts are required.
    const glyphs = ['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001010010010','111101111101111','111101111001111'];
    const w = 128, h = 72, data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const pos = (y * w + x) * 4;
      data[pos] = 18; data[pos + 1] = 61; data[pos + 2] = 47; data[pos + 3] = 255;
    }
    for (let d = 0; d < 3; d++) for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) {
      if (glyphs[Number(number[d]) || 0][gy * 3 + gx] !== '1') continue;
      for (let oy = 0; oy < 9; oy++) for (let ox = 0; ox < 9; ox++) {
        const pos = ((14 + gy * 9 + oy) * w + 17 + d * 34 + gx * 9 + ox) * 4;
        data[pos] = 238; data[pos + 1] = 231; data[pos + 2] = 207;
      }
    }
    texture = new THREE.DataTexture(data, w, h);
    texture.needsUpdate = true;
  }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addNumberPatches(rig, number, asset) {
  const texture = createNumberTexture(number);
  const patchMaterial = new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.92, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  rig.numberTexture = texture;
  rig.numberMaterial = patchMaterial;
  const makePatch = (width, height) => {
    const geometry = new THREE.PlaneGeometry(width, height, 8, 4);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) positions.setZ(i, -(positions.getX(i) ** 2) * 1.8);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, patchMaterial);
    mesh.name = `uniform-number-${number}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const front = makePatch(0.135, 0.079);
  const back = makePatch(0.215, 0.125);
  back.rotation.y = Math.PI;
  if (rig.realistic) {
    const h = asset?.characterMeta?.heightMeters || 1.82;
    const frontAnchor = asset?.characterMeta?.frontPatch;
    const backAnchor = asset?.characterMeta?.backPatch;
    const frontY = frontAnchor?.[1] ?? h * 0.735;
    const frontX = frontAnchor?.[0] ?? 0.105;
    const backY = backAnchor?.[1] ?? h * 0.75;
    rig.root.updateMatrixWorld(true);
    const sample = new THREE.Vector3();
    const rootInverse = rig.root.matrixWorld.clone().invert();
    const cloth = [], surfaces = [];
    rig.model.traverse((mesh) => {
      if (!mesh.isSkinnedMesh || !mesh.geometry.getAttribute('skinIndex')) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!/tracksuit|garment|uniform/i.test(mesh.name) && !materials.some(mat => /uniform|fabric/i.test(mat.name))) return;
      mesh.skeleton.update();
      const toRoot = new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld);
      const count = mesh.geometry.getAttribute('position').count;
      const points = new Array(count);
      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(i, sample).applyMatrix4(toRoot);
        if (Math.abs(sample.x) < 0.34 && Math.abs(sample.y - h * 0.74) < 0.23) {
          points[i] = sample.clone(); cloth.push({ mesh, index: i, point: points[i] });
        }
      }
      const index = mesh.geometry.index, countIndices = index ? index.count : count;
      for (let i = 0; i < countIndices; i += 3) {
        const ids = [index ? index.getX(i) : i, index ? index.getX(i + 1) : i + 1, index ? index.getX(i + 2) : i + 2];
        if (ids.every(id => points[id])) surfaces.push({ mesh, ids, points: ids.map(id => points[id]) });
      }
    });
    const skinPatch = (patch, cx, cy, backFacing) => {
      const candidates = cloth.filter(entry => backFacing ? entry.point.z < -0.025 : entry.point.z > 0.025);
      if (!candidates.length) return false;
      const source = candidates[0].mesh;
      const toSource = source.matrixWorld.clone().invert().multiply(rig.root.matrixWorld);
      const position = patch.geometry.getAttribute('position');
      const indices = new Uint16Array(position.count * 4);
      const weights = new Float32Array(position.count * 4);
      const weightedSkin = new THREE.Matrix4();
      const deformation = new THREE.Matrix4();
      const target = new THREE.Vector3();
      const jointWeights = new Map();
      for (let i = 0; i < position.count; i++) {
        const x = cx + position.getX(i) * (backFacing ? -1 : 1), y = cy + position.getY(i);
        let surface = null, surfaceZ = backFacing ? Infinity : -Infinity;
        for (const triangle of surfaces) {
          const [a, b, c] = triangle.points;
          const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
          if (Math.abs(denominator) < 1e-8) continue;
          const u = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / denominator;
          const v = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / denominator, w = 1 - u - v;
          if (Math.min(u, v, w) < -0.00001) continue;
          const z = a.z * u + b.z * v + c.z * w;
          if (backFacing ? z < surfaceZ && z < 0 : z > surfaceZ && z > 0) { surface = { triangle, barycentric: [u, v, w] }; surfaceZ = z; }
        }
        const nearest = [];
        for (const entry of candidates) {
          const d2 = (entry.point.x - x) ** 2 + (entry.point.y - y) ** 2;
          if (nearest.length < 4 || d2 < nearest.at(-1).d2) {
            nearest.push({ entry, d2 }); nearest.sort((a, b) => a.d2 - b.d2); nearest.length = Math.min(4, nearest.length);
          }
        }
        let total = 0, z = 0;
        jointWeights.clear();
        const contributions = surface ? surface.triangle.ids.map((id, j) => ({ entry: { mesh: surface.triangle.mesh, index: id, point: surface.triangle.points[j] }, weight: surface.barycentric[j] })) : nearest.map(({ entry, d2 }) => ({ entry, weight: 1 / Math.max(d2, 0.00001) }));
        for (const { entry, weight } of contributions) {
          total += weight; z += entry.point.z * weight;
          const si = entry.mesh.geometry.getAttribute('skinIndex'), sw = entry.mesh.geometry.getAttribute('skinWeight');
          for (let j = 0; j < 4; j++) {
            const bone = si.getComponent(entry.index, j), influence = sw.getComponent(entry.index, j) * weight;
            jointWeights.set(bone, (jointWeights.get(bone) || 0) + influence);
          }
        }
        const strongest = [...jointWeights].sort((a, b) => b[1] - a[1]).slice(0, 4);
        const sum = strongest.reduce((value, pair) => value + pair[1], 0) || 1;
        weightedSkin.elements.fill(0);
        for (let j = 0; j < strongest.length; j++) {
          const [bone, value] = strongest[j], weight = value / sum;
          indices[i * 4 + j] = bone; weights[i * 4 + j] = weight;
          for (let k = 0; k < 16; k++) weightedSkin.elements[k] += source.skeleton.boneMatrices[bone * 16 + k] * weight;
        }
        // Invert the current deformation to place the new vertices in bind
        // space. They then deform with exactly the same garment weights.
        deformation.copy(source.bindMatrixInverse).multiply(weightedSkin).multiply(source.bindMatrix).invert();
        target.set(x, y, z / total + (backFacing ? -0.006 : 0.006)).applyMatrix4(toSource).applyMatrix4(deformation);
        position.setXYZ(i, target.x, target.y, target.z);
      }
      patch.geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
      patch.geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
      patch.geometry.computeVertexNormals();
      const skinned = new THREE.SkinnedMesh(patch.geometry, patchMaterial);
      skinned.name = patch.name; skinned.castShadow = true; skinned.receiveShadow = true; skinned.frustumCulled = false;
      skinned.position.copy(source.position); skinned.quaternion.copy(source.quaternion); skinned.scale.copy(source.scale);
      source.parent.add(skinned);
      skinned.bindMode = source.bindMode;
      skinned.bind(source.skeleton, source.bindMatrix);
      return true;
    };
    if (skinPatch(front, frontX, frontY, false) && skinPatch(back, backAnchor?.[0] ?? 0, backY, true)) {
      rig.skinnedNumbers = true;
    } else {
      // Unknown third-party models can still display readable rigid patches.
      front.position.set(frontX, frontY, frontAnchor?.[2] ?? 0.15);
      back.position.set(0, backY, backAnchor?.[2] ?? -0.135);
      rig.root.add(front, back);
      rig.root.updateMatrixWorld(true);
      const attachment = rig.bones.bip01spine2 || rig.bones.bip01spine1;
      if (attachment) { attachment.attach(front); attachment.attach(back); }
    }
  } else {
    front.position.set(0.096, 0.306, 0.136);
    back.position.set(0, 0.30, -0.122);
    rig.chest.add(front, back);
  }
}

function measureRunGait(asset) {
  const clip = asset.animations.find(item => /run/i.test(item.name));
  const bones = {};
  asset.scene.traverse(object => { if (object.isBone) bones[object.name.replace(/[^a-z0-9]/gi, '').toLowerCase()] = object; });
  const feet = [bones.bip01ltoe0 || bones.bip01lfoot, bones.bip01rtoe0 || bones.bip01rfoot];
  if (!clip || !feet.every(Boolean)) return { speed: 2, duration: 1, contacts: [new Uint8Array(96), new Uint8Array(96)] };
  const mixer = new THREE.AnimationMixer(asset.scene);
  mixer.clipAction(clip).play();
  const samples = [[], []], count = 96, step = clip.duration / count;
  for (let i = 0; i < count; i++) {
    mixer.setTime(i * step); asset.scene.updateMatrixWorld(true);
    for (let foot = 0; foot < 2; foot++) samples[foot].push(feet[foot].getWorldPosition(new THREE.Vector3()));
  }
  const speeds = [], contacts = [new Uint8Array(count), new Uint8Array(count)];
  for (let foot = 0; foot < 2; foot++) {
    const low = Math.min(...samples[foot].map(point => point.y));
    const high = Math.max(...samples[foot].map(point => point.y));
    for (let i = 0; i < count; i++) {
      const previous = samples[foot][(i + count - 1) % count], next = samples[foot][(i + 1) % count];
      const backwardSpeed = (previous.z - next.z) / (2 * step);
      if (samples[foot][i].y < low + Math.min(0.075, (high - low) * 0.28) && backwardSpeed > 0.45) {
        contacts[foot][i] = 1; speeds.push(backwardSpeed);
      }
    }
  }
  speeds.sort((a, b) => a - b);
  const speed = speeds.length ? speeds[Math.floor(speeds.length * 0.50)] : 2;
  mixer.stopAllAction(); mixer.uncacheRoot(asset.scene);
  return { speed: clamp(speed, 0.8, 4.5), duration: clip.duration, contacts };
}

function createRealRig(asset, seed, index) {
  asset.gaitProfile ||= measureRunGait(asset);
  const random = rng(seed);
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.name = 'human-pose-pivot';
  pivot.position.y = 0.90;
  root.add(pivot);
  const model = cloneSkeleton(asset.scene);
  model.position.y = -0.90;
  pivot.add(model);
  const height = 0.94 + random() * 0.10;
  root.scale.set(height * (0.94 + random() * 0.12), height, height);
  const ownedMaterials = [];
  const ownedSkeletons = new Set();
  const bones = {};
  const faceMorphs = [];
  const morphMeshes = [];
  model.traverse((object) => {
    if (object.isBone) bones[object.name.replace(/[^a-z0-9]/gi, '').toLowerCase()] = object;
    if (!object.isMesh) return;
    if (object.morphTargetDictionary) {
      object.morphTargetInfluences.fill(0);
      morphMeshes.push(object);
      for (const [name, morphIndex] of Object.entries(object.morphTargetDictionary)) {
        const normalized = name.replace(/[^a-z]/gi, '').toLowerCase();
        const kind = normalized === 'blink' || normalized === 'eyesclosed' ? 'blink'
          : /^eyeblink(left|right)$/.test(normalized) ? 'blinkSide'
          : normalized === 'jawopen' ? 'jaw'
          : /browfurrow|browdown/.test(normalized) ? 'browDown'
          : normalized === 'browinnerup' ? 'browUp'
          : /mouthfrown/.test(normalized) ? 'frown'
          : normalized === 'scream' ? 'scream' : normalized === 'cry' ? 'cry' : normalized === 'fear' ? 'fear' : normalized === 'dead' ? 'dead' : null;
        if (kind) faceMorphs.push({ mesh: object, index: morphIndex, kind });
      }
    }
    if (object.isSkinnedMesh) ownedSkeletons.add(object.skeleton);
    object.castShadow = true;
    object.receiveShadow = true;
    // Skinned bounds differ during a running stride. Small people must never
    // disappear at the edge of the chamber due to bind-pose frustum bounds.
    object.frustumCulled = false;
    const customize = (source) => {
      const copy = source.clone();
      copy.roughness = Number.isFinite(source.roughness) ? source.roughness : 0.76;
      copy.metalness = 0;
      if (/opacity|hair|lash/i.test(source.name)) {
        copy.transparent = false;
        copy.alphaTest = 0.43;
        copy.depthWrite = true;
        copy.side = THREE.DoubleSide;
      }
      ownedMaterials.push(copy);
      return copy;
    };
    object.material = Array.isArray(object.material) ? object.material.map(customize) : customize(object.material);
  });
  const mixer = new THREE.AnimationMixer(model);
  const idleClip = asset.animations.find((clip) => /idle/i.test(clip.name)) || asset.animations[0];
  const runClip = asset.animations.find((clip) => /run/i.test(clip.name)) || idleClip;
  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  const run = runClip ? mixer.clipAction(runClip) : null;
  idle?.play();
  idle?.setEffectiveWeight(1);
  if (run && run !== idle) run.play().setEffectiveWeight(0);
  if (idle) idle.time = random() * idle.getClip().duration;
  if (run) run.time = random() * run.getClip().duration;
  mixer.update(0);
  for (const mesh of morphMeshes) mesh.morphTargetInfluences.fill(0);
  const neutralTransforms = new Map();
  model.traverse(object => { if (object.name) neutralTransforms.set(object.name, { p: object.position.clone(), q: object.quaternion.clone(), s: object.scale.clone() }); });
  const footLocks = ['l', 'r'].map(side => ({ bone: bones[`bip01${side}toe0`] || bones[`bip01${side}foot`], locked: false, point: new THREE.Vector3(), target: new THREE.Vector3() }));
  return { realistic: true, root, pivot, model, mixer, idle, run, bones, faceMorphs, morphMeshes, neutralTransforms, ownedMaterials, ownedSkeletons, height, gait: asset.gaitProfile, footLocks, plantX: 0, plantZ: 0, pose: 0 };
}

function createVisualAnchors(rig, asset) {
  const head = new THREE.Group(), chest = new THREE.Group();
  head.name = 'human-head-anchor'; chest.name = 'human-chest-anchor';
  head.userData = { faceForward: '+Z', localUnits: 'meters', eyes: [[-0.035, 0.035, 0.112], [0.035, 0.035, 0.112]] };
  chest.userData = { faceForward: '+Z', localUnits: 'meters', frontSurfaceZ: 0.14 };
  if (rig.realistic) {
    const h = asset?.characterMeta?.heightMeters || 1.82;
    rig.root.updateMatrixWorld(true);
    const left = rig.bones.bip01leye, right = rig.bones.bip01reye;
    if (left && right) {
      const l = rig.root.worldToLocal(left.getWorldPosition(new THREE.Vector3()));
      const r = rig.root.worldToLocal(right.getWorldPosition(new THREE.Vector3()));
      head.position.copy(l).add(r).multiplyScalar(0.5);
      head.position.y -= 0.035; head.position.z -= 0.10;
      head.userData.eyes = [l.sub(head.position).add(new THREE.Vector3(0, 0, 0.012)).toArray(), r.sub(head.position).add(new THREE.Vector3(0, 0, 0.012)).toArray()];
    } else head.position.set(0, h * 0.90, 0);
    chest.position.set(0, h * 0.735, 0);
    rig.root.add(head, chest); rig.root.updateMatrixWorld(true);
    rig.bones.bip01head?.attach(head);
    (rig.bones.bip01spine2 || rig.bones.bip01spine1)?.attach(chest);
  } else {
    rig.hips.name = 'human-pose-pivot';
    head.position.set(0, 0.085, -0.018); rig.head.add(head);
    chest.position.set(0, 0.30, 0); rig.chest.add(chest);
    let index = 0;
    rig.root.traverse(object => { if (object.isGroup && !object.name) object.name = `procedural-joint-${index++}`; });
    rig.neutralTransforms = new Map();
    rig.root.traverse(object => { if (object.isGroup) rig.neutralTransforms.set(object.name, { p: object.position.clone(), q: object.quaternion.clone(), s: object.scale.clone() }); });
  }
  rig.headAnchor = head; rig.chestAnchor = chest;
  const tearMaterial = new THREE.MeshStandardMaterial({ color: '#c5e0e6', roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0, depthWrite: false });
  rig.tearMaterial = tearMaterial;
  rig.tears = head.userData.eyes.map((eye, index) => {
    const tear = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), tearMaterial);
    tear.name = `human-tear-${index}`; tear.position.fromArray(eye); tear.scale.set(0.002, 0.004, 0.002); tear.visible = false;
    head.add(tear); return tear;
  });
}

function restoreNeutralPose(rig) {
  rig.root.traverse(object => {
    const pose = rig.neutralTransforms.get(object.name);
    if (pose && object !== rig.root) {
      object.position.copy(pose.p); object.quaternion.copy(pose.q); object.scale.copy(pose.s);
    }
  });
}

// Both the live fall and the independent corpse end at this same relaxed pose.
// Start from the recorded idle skeleton, never from a running/swimming frame.
function setRestingDeathPose(rig, side = 1) {
  restoreNeutralPose(rig);
  const pivot = rig.pivot || rig.hips;
  pivot.position.set(0, 0.90, 0); pivot.rotation.set(0, 0, 0);
  rig.root.updateMatrixWorld(true);
  if (rig.realistic) {
    const b = rig.bones;
    for (const [limb, sign] of [['l', 1], ['r', -1]]) {
      poseBone(rig, b[`bip01${limb}upperarm`], 'z', sign * (limb === 'l' ? 0.13 : 0.08));
      poseBone(rig, b[`bip01${limb}forearm`], 'x', limb === 'l' ? -0.08 : -0.13);
      poseBone(rig, b[`bip01${limb}hand`], 'y', sign * 0.055);
      poseBone(rig, b[`bip01${limb}thigh`], 'z', sign * 0.035);
      poseBone(rig, b[`bip01${limb}calf`], 'x', limb === 'l' ? 0.045 : 0.075);
    }
    poseBone(rig, b.bip01head, 'y', side * 0.09);
    poseBone(rig, b.bip01head, 'z', side * 0.025);
  } else {
    for (let i = 0; i < (rig.arms?.length || 0); i++) {
      const arm = rig.arms[i], leg = rig.legs[i];
      arm.upper.rotation.set(0, 0, -arm.side * (i ? 0.08 : 0.13));
      arm.lower.rotation.set(i ? -0.13 : -0.08, 0, 0);
      arm.hand.rotation.set(0, arm.side * 0.055, 0);
      leg.upper.rotation.set(0, 0, -leg.side * 0.035);
      leg.lower.rotation.set(i ? 0.075 : 0.045, 0, 0);
    }
    if (rig.head) rig.head.rotation.set(0, side * 0.09, side * 0.025);
  }
  pivot.position.y = 0.19; pivot.rotation.set(-1.47, 0, side * 0.06);
  rig.root.updateMatrixWorld(true);
}

function deadMorphWeights(mesh) {
  const weights = mesh.morphTargetInfluences.map(() => 0), names = mesh.morphTargetDictionary;
  const keys = Object.keys(names);
  const dead = keys.find(name => /^dead$/i.test(name));
  const blink = keys.find(name => /^blink$|^eyesclosed$/i.test(name));
  if (dead) weights[names[dead]] = 0.90;
  else if (blink) weights[names[blink]] = 0.96;
  else for (const name of keys) if (/^eyeblink(left|right)$/i.test(name)) weights[names[name]] = 0.96;
  return weights;
}

function beginDeathPose(actor) {
  const rig = actor._rig, pivot = rig.pivot || rig.hips, joints = [], faces = [];
  rig.root.traverse(object => {
    if (object !== rig.root && (rig.neutralTransforms.has(object.name) || object === pivot)) {
      joints.push({ object, fromP: object.position.clone(), fromQ: object.quaternion.clone(), fromS: object.scale.clone() });
    }
    if (object.morphTargetDictionary) faces.push({ mesh: object, from: [...object.morphTargetInfluences], to: deadMorphWeights(object) });
    if (/^human-tear-/.test(object.name)) object.visible = false;
  });
  setRestingDeathPose(rig, actor._fallSide);
  for (const joint of joints) {
    joint.toP = joint.object.position.clone(); joint.toQ = joint.object.quaternion.clone(); joint.toS = joint.object.scale.clone();
    joint.object.position.copy(joint.fromP); joint.object.quaternion.copy(joint.fromQ); joint.object.scale.copy(joint.fromS);
  }
  const spring = actor._squish;
  // Fatal HP can arrive before the first impact frame or a few frames later.
  // Carry the still-active contact into one death beat in either ordering.
  const crush = spring.kind === 'crush' && spring.intensity > 0 && spring.until >= actor._clock
    ? { strength: spring.intensity, side: spring.side, start: spring.renderedValue || 0 } : null;
  spring.pending = false;
  actor._deathPose = { joints, faces, pivot, startY: actor.position.y, settled: false, crush, compression: 0 };
  actor._fallTime = 0;
  actor._swimAutomatic = false;
  actor._autoActionUntil = 0;
  actor.setExpression('dead', 1);
  if (rig.footLocks) for (const foot of rig.footLocks) foot.locked = false;
  rig.plantX = rig.plantZ = 0;
}

// A single authored collapse: the current pose loses tension, the body falls,
// then makes one small contact settle. No animation mixer, gait, gaze or
// additive reaction is evaluated after death begins, even while still visible.
function animateDeathPose(actor, dt, state) {
  if (!actor._deathPose) beginDeathPose(actor);
  const death = actor._deathPose, rig = actor._rig;
  actor._fallTime += dt;
  const time = actor._fallTime;
  const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  if (!death.settled) {
    const limbBlend = smooth(time / 0.84);
    const bodyBlend = death.crush ? smooth((time - 0.22) / 0.62) : smooth((time - 0.10) / 0.66);
    for (const joint of death.joints) {
      const blend = joint.object === death.pivot ? bodyBlend : limbBlend;
      joint.object.position.lerpVectors(joint.fromP, joint.toP, blend);
      joint.object.quaternion.slerpQuaternions(joint.fromQ, joint.toQ, blend);
      joint.object.scale.lerpVectors(joint.fromS, joint.toS, blend);
    }
    if (death.crush) {
      const compress = smooth(time / 0.13) * (1 - smooth((time - 0.19) / 0.29));
      const rebound = time > 0.48 && time < 0.68 ? -0.12 * Math.sin((time - 0.48) / 0.20 * Math.PI) : 0;
      death.compression = death.crush.start * (1 - smooth(time / 0.13)) + death.crush.strength * (compress + rebound);
      // The captured starting pose may already be compressed. Replace its
      // decaying offset with this envelope instead of adding a second squeeze.
      applyTorsoCompression(rig, death.compression - death.crush.start * (1 - limbBlend), death.crush.side, true);
    }
    // One damped impact displacement, not a periodic limb animation.
    const contactAt = death.crush ? 0.84 : 0.76;
    if (time > contactAt && time < 0.96) death.pivot.position.y += 0.018 * Math.sin((time - contactAt) / (0.96 - contactAt) * Math.PI);
    const faceBlend = smooth(time / 0.36);
    for (const face of death.faces) for (let i = 0; i < face.to.length; i++) face.mesh.morphTargetInfluences[i] = lerp(face.from[i], face.to[i], faceBlend);
    if (time >= 0.96) {
      for (const joint of death.joints) {
        joint.object.position.copy(joint.toP); joint.object.quaternion.copy(joint.toQ); joint.object.scale.copy(joint.toS);
      }
      for (const face of death.faces) face.mesh.morphTargetInfluences.splice(0, face.to.length, ...face.to);
      death.settled = true;
    }
  }
  const water = Number.isFinite(state.waterLevel) ? state.waterLevel : 0;
  const collapse = state.scenarioId === 'collapse' && actor.isVictim && !actor.invincible;
  const drowning = state.scenarioId === 'flood' && water > 1.05;
  const sink = drowning ? Math.max(0, time - 0.50) * 0.38 : 0;
  const targetY = collapse ? -Math.min(5.2, Math.max(0, time - 0.10) ** 2 * 5.5) : water > 1.05 ? Math.max(0.03, water - 0.18 * rig.height - sink) : 0;
  actor.position.y = collapse ? lerp(actor.position.y, targetY, 1 - Math.exp(-dt * 6)) : lerp(death.startY, targetY, smooth(time / 0.84));
  actor._shadow.material.opacity = water > 1.05 ? 0.025 : 0.13;
  actor._shadow.position.y = 0.018 - actor.position.y;
}

function releaseDeathPose(actor) {
  if (!actor._deathPose) return;
  const rig = actor._rig;
  restoreNeutralPose(rig);
  const pivot = rig.pivot || rig.hips;
  pivot.position.set(0, 0.90, 0); pivot.rotation.set(0, 0, 0);
  rig.pose = 0; rig.plantX = rig.plantZ = 0;
  if (rig.secondaryPose) rig.secondaryPose.active = false;
  actor._deathPose = null; actor._fallTime = 0;
  actor.clearReactions();
  Object.keys(actor._face).forEach(key => { actor._face[key] = 0; });
}

function cloneActorVisual(actor) {
  const root = cloneSkeleton(actor.root);
  const geometryCopies = new Map(), materialCopies = new Map(), textureCopies = new Map(), skeletons = new Set();
  const bones = {}, morphMeshes = [];
  const shadows = [];
  root.traverse(object => {
    if (object.name === 'participant-contact-shadow') shadows.push(object);
    if (object.isBone) bones[object.name.replace(/[^a-z0-9]/gi, '').toLowerCase()] = object;
    if (!object.isMesh || object.name === 'participant-contact-shadow') return;
    if (!geometryCopies.has(object.geometry)) geometryCopies.set(object.geometry, object.geometry.clone());
    object.geometry = geometryCopies.get(object.geometry);
    if (object.skeleton) skeletons.add(object.skeleton);
    const cloneMaterial = (source) => {
      if (materialCopies.has(source)) return materialCopies.get(source);
      const copy = source.clone();
      for (const [key, value] of Object.entries(copy)) if (value?.isTexture) {
        if (!textureCopies.has(value)) { const tex = value.clone(); tex.needsUpdate = true; textureCopies.set(value, tex); }
        copy[key] = textureCopies.get(value);
      }
      materialCopies.set(source, copy); return copy;
    };
    object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
    if (object.morphTargetDictionary) morphMeshes.push(object);
  });
  for (const shadow of shadows) shadow.removeFromParent();
  const headAnchor = root.getObjectByName('human-head-anchor'), chestAnchor = root.getObjectByName('human-chest-anchor');
  const pivot = root.getObjectByName('human-pose-pivot') || root;
  const neutralTransforms = new Map([...actor._rig.neutralTransforms].map(([name, pose]) => [name, { p: pose.p.clone(), q: pose.q.clone(), s: pose.s.clone() }]));
  const cloneRig = { root, pivot, bones, neutralTransforms, realistic: actor._rig.realistic };
  if (!cloneRig.realistic) {
    const find = object => root.getObjectByName(object.name);
    cloneRig.head = find(actor._rig.head);
    cloneRig.arms = actor._rig.arms.map(arm => ({ side: arm.side, upper: find(arm.upper), lower: find(arm.lower), hand: find(arm.hand) }));
    cloneRig.legs = actor._rig.legs.map(leg => ({ side: leg.side, upper: find(leg.upper), lower: find(leg.lower), foot: find(leg.foot) }));
  }
  const fallSide = actor._fallSide;
  const ownedGeometries = [...geometryCopies.values()], ownedMaterials = [...materialCopies.values()], ownedTextures = [...textureCopies.values()];
  geometryCopies.clear(); materialCopies.clear(); textureCopies.clear();
  let disposed = false;
  const setExpression = (type, intensity = 1) => {
    const strength = clamp(Number.isFinite(intensity) ? intensity : 0, 0, 1);
    for (const mesh of morphMeshes) {
      mesh.morphTargetInfluences.fill(0);
      const names = mesh.morphTargetDictionary;
      const find = term => Object.keys(names).find(name => name.toLowerCase() === term);
      const compound = find(type);
      if (compound) mesh.morphTargetInfluences[names[compound]] = strength * (type === 'scream' ? 0.8 : type === 'cry' ? 0.7 : 0.9);
      else if (type === 'dead') {
        for (const name of Object.keys(names)) if (/^blink$|^eyeblink(left|right)$/i.test(name)) mesh.morphTargetInfluences[names[name]] = strength;
      } else if (type === 'scream' && find('jawopen')) mesh.morphTargetInfluences[names[find('jawopen')]] = strength * 0.65;
      else if (type === 'fear' && find('browfurrow')) mesh.morphTargetInfluences[names[find('browfurrow')]] = strength * 0.35;
    }
    root.traverse(object => { if (/^human-tear-/.test(object.name)) object.visible = false; });
  };
  return {
    root, headAnchor, chestAnchor, bones, materials: ownedMaterials, setExpression,
    setDeadPose() {
      setRestingDeathPose(cloneRig, fallSide);
      setExpression('dead', 1);
    },
    dispose() {
      if (disposed) return;
      for (const geometry of ownedGeometries) geometry.dispose();
      for (const material of ownedMaterials) material.dispose();
      for (const texture of ownedTextures) texture.dispose();
      for (const skeleton of skeletons) skeleton.dispose();
      root.removeFromParent(); disposed = true;
    },
  };
}

const translatedAxis = new THREE.Vector3();
const translatedFrame = new THREE.Matrix4();
const translatedLinear = new THREE.Matrix3();
function translateFaceBone(rig, bone, x, y, z, frame = rig.root) {
  if (!bone) return;
  translatedFrame.copy(bone.parent.matrixWorld).invert().multiply(frame.matrixWorld);
  translatedLinear.setFromMatrix4(translatedFrame);
  translatedAxis.set(x, y, z).applyMatrix3(translatedLinear);
  bone.position.add(translatedAxis);
  bone.updateMatrixWorld(true);
}

function animateFace(actor, dt, falling, bonesLocked = false) {
  const rig = actor._rig, face = actor._face, reactions = actor._reactionWeights;
  const now = actor._animationClock;
  if (!falling && now >= actor._blinkAt) {
    actor._blinkStart = now;
    actor._blinkDuration = 0.17 + actor._random() * 0.07;
    actor._blinkAt = now + 2.0 + actor._random() * 4.3;
    if (actor._random() < 0.10) actor._blinkAt = now + 0.32;
  }
  const blinkPhase = (now - actor._blinkStart) / actor._blinkDuration;
  face.blink = falling || actor._expression.type === 'dead' ? 0.88 : blinkPhase >= 0 && blinkPhase < 1 ? Math.sin(Math.PI * blinkPhase) ** 0.7 : 0;
  if (actor._expression.until < actor._clock) actor.setExpression('neutral', 0);
  const explicit = actor._expression;
  const fear = Math.max(reactions.fear, reactions.drown * 0.7, reactions.shock * 0.5, actor._injury.severity * 0.48, explicit.type === 'fear' ? explicit.intensity : 0);
  const coughPulse = Math.max(0, Math.sin((now - actor._reactions.cough.motionStart) * 13)) ** 3;
  const targetJaw = falling ? 0.08 : reactions.cough * coughPulse * 0.35 + reactions.heat * 0.17 + reactions.drown * 0.30 + fear * 0.13 + actor._injury.severity * 0.045;
  const blend = 1 - Math.exp(-dt * 13);
  face.fear = lerp(face.fear, fear, blend);
  face.scream = lerp(face.scream, explicit.type === 'scream' ? explicit.intensity * 0.8 : 0, blend);
  face.cry = lerp(face.cry, explicit.type === 'cry' ? explicit.intensity * 0.7 : 0, blend);
  face.dead = lerp(face.dead, explicit.type === 'dead' || actor.action === 'dead' || !actor.alive ? 0.88 : 0, blend);
  face.jaw = lerp(face.jaw, targetJaw, blend);
  face.brow = lerp(face.brow, fear * 0.7 + reactions.heat * 0.25 + reactions.brace * 0.22, blend);
  const expressivePose = ['dead', 'scream', 'cry'].includes(explicit.type) && explicit.intensity > 0.2;
  const gazeSide = expressivePose ? 0 : clamp(actor._headingError * 0.35, -0.15, 0.15) + actor._gazeTarget + Math.sin(now * actor.personality.lookRate + actor._seed % 31) * (fear > 0.1 ? 0.14 : 0.025);
  face.gazeY = lerp(face.gazeY, falling ? 0 : gazeSide, 1 - Math.exp(-dt * 5));
  face.gazeX = lerp(face.gazeX, reactions.swarm * 0.12 - reactions.drown * 0.10 + face.cry * 0.09 - face.scream * 0.04 + (expressivePose ? 0 : Math.sin(now * 0.48 + actor._seed % 9) * 0.018), blend);
  const morphKinds = rig.faceMorphs;
  const hasBlink = morphKinds.some(morph => morph.kind === 'blink');
  const hasScream = morphKinds.some(morph => morph.kind === 'scream');
  const hasCry = morphKinds.some(morph => morph.kind === 'cry');
  const hasDead = morphKinds.some(morph => morph.kind === 'dead');
  const hasFear = morphKinds.some(morph => morph.kind === 'fear');
  const mainCompound = Math.max(hasScream ? face.scream : 0, hasCry ? face.cry : 0, hasDead ? face.dead : 0);
  const fearCompound = hasFear ? face.fear * 0.82 * (1 - mainCompound) : 0;
  const compound = Math.max(mainCompound, fearCompound);
  const componentScale = compound > 0.05 ? 0 : 1;
  for (const mesh of rig.morphMeshes) mesh.morphTargetInfluences.fill(0);
  let morphBlink = false, morphJaw = hasScream && face.scream > 0.01, morphBrow = compound > 0.01;
  for (const morph of morphKinds) {
    let value = 0;
    if (morph.kind === 'blink') value = hasDead && face.dead > 0.05 || hasCry && face.cry > 0.2 ? 0 : face.blink;
    else if (morph.kind === 'blinkSide') value = hasBlink || hasDead && face.dead > 0.05 || hasCry && face.cry > 0.2 ? 0 : face.blink;
    else if (morph.kind === 'jaw') value = clamp((face.jaw + (hasScream ? 0 : face.scream * 0.85)) * componentScale, 0, 0.7);
    else if (morph.kind === 'scream') value = face.scream;
    else if (morph.kind === 'cry') value = face.cry;
    else if (morph.kind === 'dead') value = face.dead;
    else if (morph.kind === 'frown') value = hasCry ? 0 : face.cry;
    else if (morph.kind === 'browUp') value = (face.fear * 0.65 + (hasCry ? 0 : face.cry * 0.75)) * componentScale;
    else if (morph.kind === 'browDown') value = face.brow * 0.35 * componentScale;
    else if (morph.kind === 'fear') value = fearCompound;
    morph.mesh.morphTargetInfluences[morph.index] = clamp(value, 0, 1);
    morphBlink ||= morph.kind === 'blink' || morph.kind === 'blinkSide'; morphJaw ||= morph.kind === 'jaw'; morphBrow ||= morph.kind === 'browDown' || morph.kind === 'browUp';
  }
  if (!bonesLocked) {
  poseBone(rig, rig.bones.bip01head, 'y', face.gazeY);
  poseBone(rig, rig.bones.bip01head, 'x', face.gazeX);
  for (const side of ['l', 'r']) {
    poseBone(rig, rig.bones[`bip01${side}eye`], 'y', clamp(face.gazeY * 0.25, -0.045, 0.045));
    poseBone(rig, rig.bones[`bip01${side}eye`], 'x', clamp(face.gazeX * 0.30, -0.025, 0.025));
    if (!morphBlink && face.blink > 0) {
      translateFaceBone(rig, rig.bones[`bip01${side}eyeblinktop`], 0, -0.0045 * face.blink, 0.0005 * face.blink);
      translateFaceBone(rig, rig.bones[`bip01${side}eyeblinkbottom`], 0, 0.0015 * face.blink, 0.0003 * face.blink);
    }
    if (!morphBrow && face.brow > 0.01) {
      translateFaceBone(rig, rig.bones[`bip01${side}innereyebrow`], 0, 0.0017 * face.brow, 0);
      translateFaceBone(rig, rig.bones[`bip01${side}outereyebrow`], 0, 0.0006 * face.brow, 0);
    }
  }
  if (!morphJaw) poseBone(rig, rig.bones.bip01mjaw, 'x', face.jaw * 0.11);
  }
  rig.tearMaterial.opacity = face.cry * 0.62;
  for (let i = 0; i < rig.tears.length; i++) {
    const tear = rig.tears[i], eye = rig.headAnchor.userData.eyes[i];
    const travel = (now * 0.62 + i * 0.47 + actor._seed % 5) % 1;
    tear.visible = face.cry > 0.08;
    tear.position.set(eye[0] * 1.07, eye[1] - travel * 0.092, eye[2] + 0.008 - travel * 0.012);
    tear.scale.set(0.0018, 0.0025 + Math.sin(travel * Math.PI) * 0.0025, 0.0018);
  }
}

const footCorrection = new THREE.Vector3();
const footFrameInverse = new THREE.Quaternion();
function correctPlantedFoot(actor, dt, enabled) {
  const rig = actor._rig;
  const sample = Math.floor(((rig.run?.time || 0) / rig.gait.duration % 1) * rig.gait.contacts[0].length);
  let support = null;
  rig.root.updateMatrixWorld(true);
  for (let i = 0; i < 2; i++) {
    const foot = rig.footLocks[i];
    if (!foot.bone) continue;
    foot.bone.getWorldPosition(foot.point);
    const contacting = enabled && Boolean(rig.gait.contacts[i][sample]);
    if (contacting && !foot.locked) foot.target.copy(foot.point);
    foot.locked = contacting;
    if (contacting && (!support || foot.point.y < support.point.y)) support = foot;
  }
  let x = 0, z = 0;
  if (support) {
    rig.root.getWorldQuaternion(footFrameInverse).invert();
    footCorrection.copy(support.target).sub(support.point).applyQuaternion(footFrameInverse);
    x = clamp(rig.plantX + footCorrection.x / rig.root.scale.x, -0.085, 0.085);
    z = clamp(rig.plantZ + footCorrection.z / rig.root.scale.z, -0.10, 0.10);
  }
  const blend = 1 - Math.exp(-dt * (support ? 38 : 13));
  rig.plantX = lerp(rig.plantX, x, blend); rig.plantZ = lerp(rig.plantZ, z, blend);
  rig.pivot.position.x = rig.plantX; rig.pivot.position.z = rig.plantZ;
}

function applyRealReactions(actor) {
  const rig = actor._rig, r = actor._reactionWeights, b = rig.bones;
  rig.reactionLower = 0;
  if (!actor._hasReaction || !actor.alive || actor.action === 'fall' || actor.action === 'dead') return;
  const t = actor._animationClock, side = actor._reactionSide;
  const cough = Math.max(0, Math.sin((t - actor._reactions.cough.motionStart) * 13)) ** 3 * r.cough;
  const tremor = Math.sin(t * 39 + actor._seed % 11) * r.shiver;
  const shock = Math.sin(t * 29) * r.shock;
  const swipe = Math.sin(t * 12 + actor._seed % 7) * r.swarm;
  const stumble = r.stumble * (0.7 + 0.3 * Math.sin((t - actor._reactions.stumble.motionStart) * 9));
  const spineX = clamp(cough * 0.23 + r.brace * 0.15 + stumble * 0.27 - r.heat * 0.045 + shock * 0.035, -0.12, 0.37);
  const spineZ = clamp(tremor * 0.025 + shock * 0.055 + r.dodge * side * 0.15 + swipe * 0.045, -0.22, 0.22);
  poseBone(rig, b.bip01spine1 || b.bip01spine, 'x', spineX);
  poseBone(rig, b.bip01spine2, 'z', spineZ);
  poseBone(rig, b.bip01neck, 'x', cough * 0.12 + r.swarm * 0.09 - r.drown * 0.09 - spineX * 0.30);
  poseBone(rig, b.bip01head, 'z', -spineZ * 0.40 + tremor * 0.012);
  const defensive = r.brace * 0.55 + stumble * 0.55;
  poseBone(rig, b.bip01lupperarm, 'x', clamp(-r.heat * 0.48 - defensive - r.drown * 0.55 + swipe * 0.30, -1.0, 0.45));
  poseBone(rig, b.bip01rupperarm, 'x', clamp(-r.cough * 0.60 - defensive - r.drown * 0.55 - swipe * 0.30, -1.05, 0.45));
  poseBone(rig, b.bip01lupperarm, 'z', clamp(r.heat * 0.17 + r.swarm * 0.25 + shock * 0.19 - r.fear * 0.05, -0.25, 0.40));
  poseBone(rig, b.bip01rupperarm, 'z', clamp(-r.swarm * 0.25 - shock * 0.19 + r.fear * 0.05, -0.40, 0.25));
  poseBone(rig, b.bip01lforearm, 'x', clamp(-r.heat * 0.72 - r.brace * 0.55 - r.drown * 0.17 - r.fear * 0.13, -1.0, 0));
  poseBone(rig, b.bip01rforearm, 'x', clamp(-r.cough * 0.92 - r.brace * 0.55 - r.drown * 0.17 - r.fear * 0.13, -1.05, 0));
  poseBone(rig, b.bip01lclavicle, 'z', r.fear * 0.055 + r.shiver * 0.04);
  poseBone(rig, b.bip01rclavicle, 'z', -r.fear * 0.055 - r.shiver * 0.04);
  poseBone(rig, b.bip01lhand, 'y', r.heat * Math.sin(t * 15) * 0.16 + swipe * 0.12);
  poseBone(rig, b.bip01rhand, 'y', -swipe * 0.12);
  for (const [leg, sign] of [['l', 1], ['r', -1]]) {
    const stamp = Math.max(0, Math.sin(t * 11 + (sign < 0 ? Math.PI : 0))) * r.swarm;
    const knee = r.brace * 0.19 + stumble * (sign === side ? 0.30 : 0.12) + stamp * 0.18;
    poseBone(rig, b[`bip01${leg}thigh`], 'x', -knee * 0.53);
    poseBone(rig, b[`bip01${leg}calf`], 'x', knee);
  }
  rig.reactionLower = -r.brace * 0.065 - stumble * 0.04 + shock * 0.006;
}

function animateRealRig(actor, dt, elapsed, state) {
  const rig = actor._rig;
  const action = actor.action;
  const moving = action === 'run' || action === 'panic';
  const swimming = action === 'swim';
  const speed = actor._motionSpeed ?? Math.hypot(actor._vx, actor._vz);
  const alpha = 1 - Math.exp(-dt * 10);
  const runWeight = moving ? clamp((speed - 0.04) / 0.55, 0, 1) : 0;
  if (rig.run && rig.run !== rig.idle) {
    rig.run.setEffectiveWeight(lerp(rig.run.getEffectiveWeight(), runWeight, alpha));
    const strideScale = rig.gait.speed * rig.height * Math.max(0.30, rig.run.getEffectiveWeight());
    // Cold scales mixer time; compensate the locomotion track so its stride
    // still covers the actual ground distance instead of slowing twice.
    rig.run.setEffectiveTimeScale(moving ? clamp(speed / strideScale, 0.035, 1.9) / Math.max(0.001, actor._freezing.animationScale) : 0.15);
    rig.idle?.setEffectiveWeight(1 - rig.run.getEffectiveWeight());
  }
  rig.mixer.update(dt);
  rig.model.updateMatrixWorld(true);
  actor._phase += dt * 4.3;
  const p = actor._phase;
  let lower = 0, tilt = 0, sideTilt = 0;
  const spine = rig.bones.bip01spine1 || rig.bones.bip01spine;
  const leftArm = rig.bones.bip01lupperarm;
  const rightArm = rig.bones.bip01rupperarm;
  const leftForearm = rig.bones.bip01lforearm;
  const rightForearm = rig.bones.bip01rforearm;
  const special = ['crouch', 'swim', 'celebrate'].includes(action);
  rig.pose = lerp(rig.pose, special ? 1 : 0, alpha);
  const amount = rig.pose;
  if (moving) {
    const lean = clamp(-actor._turnRate * speed * 0.025, -0.17, 0.17);
    sideTilt = lean * 0.55;
    tilt = clamp(actor._acceleration * 0.014, -0.055, 0.065);
    poseBone(rig, spine, 'z', lean * 0.45);
    poseBone(rig, rig.bones.bip01spine2, 'y', clamp(-actor._headingError * 0.09, -0.075, 0.075));
    poseBone(rig, rig.bones.bip01head, 'z', -lean * 0.60);
    poseBone(rig, rig.bones.bip01lclavicle, 'y', clamp(actor._turnRate * 0.016, -0.045, 0.045));
    poseBone(rig, rig.bones.bip01rclavicle, 'y', clamp(actor._turnRate * 0.016, -0.045, 0.045));
  }
  if (action === 'crouch') {
    lower = -0.34;
    poseBone(rig, spine, 'x', 0.34 * amount);
    for (const side of ['l', 'r']) {
      poseBone(rig, rig.bones[`bip01${side}thigh`], 'x', -0.87 * amount);
      poseBone(rig, rig.bones[`bip01${side}calf`], 'x', 1.57 * amount);
      poseBone(rig, rig.bones[`bip01${side}foot`], 'x', -0.68 * amount);
    }
    poseBone(rig, leftArm, 'x', -0.68 * amount);
    poseBone(rig, rightArm, 'x', -0.68 * amount);
    poseBone(rig, leftForearm, 'x', -0.72 * amount);
    poseBone(rig, rightForearm, 'x', -0.72 * amount);
  } else if (swimming) {
    lower = -0.08 + Math.sin(p) * 0.025;
    tilt = 0.16;
    poseBone(rig, leftArm, 'x', (-0.80 + Math.sin(p) * 0.45) * amount);
    poseBone(rig, rightArm, 'x', (-0.80 - Math.sin(p) * 0.45) * amount);
    poseBone(rig, leftArm, 'z', 0.85 * amount);
    poseBone(rig, rightArm, 'z', -0.85 * amount);
    poseBone(rig, leftForearm, 'x', -0.75 * amount);
    poseBone(rig, rightForearm, 'x', -0.75 * amount);
    poseBone(rig, rig.bones.bip01lthigh, 'x', Math.sin(p) * 0.20);
    poseBone(rig, rig.bones.bip01rthigh, 'x', -Math.sin(p) * 0.20);
  } else if (action === 'celebrate') {
    lower = Math.abs(Math.sin(p * 1.2)) * 0.08;
    poseBone(rig, leftArm, 'z', (2.45 + Math.sin(p) * 0.16) * amount);
    poseBone(rig, rightArm, 'z', (-2.45 - Math.cos(p) * 0.16) * amount);
    poseBone(rig, leftForearm, 'x', -0.3 * amount);
    poseBone(rig, rightForearm, 'x', -0.3 * amount);
  }
  applyRealReactions(actor);
  animateFace(actor, dt, false);
  rig.pivot.position.y = lerp(rig.pivot.position.y, 0.90 + lower + (rig.reactionLower || 0), alpha);
  approachRotation(rig.pivot, tilt, 0, sideTilt, alpha);
  const water = Number.isFinite(state.waterLevel) ? state.waterLevel : 0;
  const lift = swimming ? Math.max(0, water - 1.05 * rig.height) : 0;
  actor.position.y = lerp(actor.position.y, lift, 1 - Math.exp(-dt * 6));
  const contactSafe = moving && runWeight > 0.8 && Math.abs(actor._turnRate) < 2.1 && actor._reactionWeights.stumble + actor._reactionWeights.swarm + actor._reactionWeights.brace < 0.15;
  correctPlantedFoot(actor, dt, contactSafe);
  actor._shadow.material.opacity = Math.max(0.03, 0.17 - lift * 0.06);
  actor._shadow.position.y = 0.018 - actor.position.y;
}

function animateRig(actor, dt, elapsed, state) {
  const rig = actor._rig;
  if (actor._frozenPose) {
    if (actor._frozenPose.reason === 'impale' && rig.realistic) animateFace(actor, dt, false, true);
    return;
  }
  if (!actor.alive || actor.action === 'fall' || actor.action === 'dead') {
    animateDeathPose(actor, dt, state);
    constrainFloodHeight(actor, state);
    return;
  }
  releaseDeathPose(actor);
  restoreSecondaryPose(rig);
  if (rig.realistic) {
    animateRealRig(actor, dt, elapsed, state);
    applyInjuryPose(actor);
    applyAwarenessPose(actor);
    constrainFloodHeight(actor, state);
    return;
  }
  const speed = Math.hypot(actor._vx, actor._vz);
  const action = actor.action;
  const swimming = action === 'swim';
  actor._phase += dt * (swimming ? 4.2 : 6.8 + speed * 2.0);
  const p = actor._phase;
  const move = action === 'run' || action === 'panic';
  const intensity = move ? clamp(speed / 1.9, 0.20, 1) : 0;
  const alpha = 1 - Math.exp(-dt * 12);
  let hipY = 0.90, bodyX = 0, bodyZ = 0, chestX = 0, chestZ = 0, headX = 0;
  let bodyY = 0;
  const sin = Math.sin(p), cos = Math.cos(p);

  if (move) {
    hipY += Math.abs(cos) * 0.040 * intensity;
    chestX = 0.10 + intensity * 0.10;
    chestZ = sin * 0.035 * intensity;
    headX = -chestX * 0.70;
    bodyY = Math.abs(Math.sin(p * 2)) * 0.012 * intensity;
  } else if (action === 'crouch') {
    hipY = 0.53;
    chestX = 0.48;
    headX = -0.38;
  } else if (swimming) {
    hipY = 0.72;
    chestX = 0.22;
    bodyX = 0.40;
    headX = -0.38;
    bodyY = Math.sin(p * 1.1) * 0.035;
  } else if (action === 'celebrate') {
    hipY += Math.abs(Math.sin(p * 0.8)) * 0.085;
    chestZ = Math.sin(p * 0.5) * 0.10;
    headX = -0.15;
  } else {
    hipY += Math.sin(elapsed * 2.0 + actor._phase) * 0.005;
    headX = Math.sin(elapsed * 0.7 + actor._phase) * 0.025;
  }
  const reaction = actor._reactionWeights;
  const cough = Math.max(0, Math.sin((actor._animationClock - actor._reactions.cough.motionStart) * 13)) ** 3 * reaction.cough;
  {
    hipY -= reaction.brace * 0.065 + reaction.stumble * 0.04;
    chestX += cough * 0.23 + reaction.brace * 0.15 + reaction.stumble * 0.22;
    chestZ += Math.sin(actor._animationClock * 39) * reaction.shiver * 0.025 + reaction.dodge * actor._reactionSide * 0.15;
    chestZ += clamp(-actor._turnRate * speed * 0.025, -0.14, 0.14);
    headX += cough * 0.10 + reaction.swarm * 0.08 - reaction.drown * 0.10;
  }
  rig.hips.position.y = lerp(rig.hips.position.y, hipY, alpha);
  rig.motion.position.y = lerp(rig.motion.position.y, bodyY, alpha);
  approachRotation(rig.hips, bodyX, 0, bodyZ, alpha);
  approachRotation(rig.chest, chestX, Math.sin(p) * 0.07 * intensity, chestZ, alpha);
  approachRotation(rig.head, headX, move ? Math.sin(elapsed * 0.8 + actor._phase * 0.1) * 0.09 : Math.sin(elapsed * 0.35 + actor._seed) * 0.12, 0, alpha);

  for (let i = 0; i < 2; i++) {
    const leg = rig.legs[i], arm = rig.arms[i];
    const cycle = p + i * Math.PI, swing = Math.sin(cycle);
    let thigh = 0, knee = 0.06, ankle = 0, legZ = leg.side * 0.035;
    let shoulder = 0.06, elbow = -0.15, armZ = arm.side * -0.08, armY = 0, handX = 0;
    if (move) {
      thigh = swing * 0.77 * intensity - 0.06;
      knee = 0.14 + Math.max(0, Math.sin(cycle - 0.35)) * 1.19 * intensity;
      ankle = -thigh * 0.25 - knee * 0.30;
      shoulder = -swing * 0.68 * intensity - 0.05;
      elbow = -1.14 - Math.cos(cycle) * 0.18;
      armZ = arm.side * -0.14;
      if (action === 'panic') {
        shoulder -= 0.32;
        elbow -= 0.20;
        armZ = arm.side * -0.27;
      }
    } else if (action === 'crouch') {
      thigh = -0.94;
      knee = 1.77;
      ankle = -0.83;
      legZ = leg.side * 0.11;
      shoulder = -1.00;
      elbow = -1.00;
      armZ = arm.side * -0.22;
    } else if (swimming) {
      thigh = 0.15 + swing * 0.28;
      knee = 0.30 + Math.max(0, -swing) * 0.35;
      shoulder = -1.0 + swing * 0.55;
      elbow = -0.72 + Math.cos(cycle) * 0.22;
      armZ = arm.side * (-0.95 + Math.cos(cycle) * 0.18);
      armY = arm.side * 0.15;
      handX = -0.25;
    } else if (action === 'celebrate') {
      thigh = -0.1 + swing * 0.06;
      knee = 0.17;
      shoulder = -2.75 + Math.sin(p) * 0.20;
      elbow = -0.18 - Math.max(0, Math.cos(cycle)) * 0.5;
      armZ = arm.side * -0.27;
    } else {
      shoulder = Math.sin(elapsed * 1.7 + i + actor._phase) * 0.018;
      elbow = -0.10;
    }
    {
      shoulder -= reaction.brace * 0.55 + reaction.stumble * 0.55 + reaction.drown * 0.40;
      if (i === 0) { shoulder -= reaction.heat * 0.48; elbow -= reaction.heat * 0.65; }
      else { shoulder -= reaction.cough * 0.60; elbow -= reaction.cough * 0.85; }
      shoulder += Math.sin(actor._animationClock * 12 + i * Math.PI) * reaction.swarm * 0.30;
      armZ += arm.side * (reaction.swarm * 0.25 + Math.sin(actor._animationClock * 29) * reaction.shock * 0.19);
      knee += reaction.brace * 0.19 + reaction.stumble * 0.20;
    }
    approachRotation(leg.upper, thigh, 0, legZ, alpha);
    approachRotation(leg.lower, knee, 0, 0, alpha);
    approachRotation(leg.foot, ankle, 0, 0, alpha);
    approachRotation(arm.upper, shoulder, armY, armZ, alpha);
    approachRotation(arm.lower, elbow, 0, 0, alpha);
    approachRotation(arm.hand, handX, 0, 0, alpha);
  }
  const water = Number.isFinite(state.waterLevel) ? state.waterLevel : 0;
  // A treading swimmer keeps shoulders and head above the surface; automatically
  // use swimming gait in deep water even when a scenario only publishes level.
  const lift = swimming ? Math.max(0, water - 1.0 * rig.height) : 0;
  actor.root.position.y = lerp(actor.root.position.y, lift, 1 - Math.exp(-dt * 6));
  if (actor._shadow) {
    actor._shadow.material.opacity = Math.max(0.03, 0.17 - lift * 0.06);
    actor._shadow.position.y = 0.018 - actor.root.position.y;
  }
  applyInjuryPose(actor);
  applyAwarenessPose(actor);
  constrainFloodHeight(actor, state);
}

const floodHeightPoint = new THREE.Vector3();
function constrainFloodHeight(actor, state) {
  if (state.scenarioId !== 'flood') return;
  const ceiling = Number.isFinite(state.ceilingY) ? state.ceilingY : Number.isFinite(state.ceilingHeight) ? state.ceilingHeight : 7;
  const rig = actor._rig;
  actor.root.updateWorldMatrix(true, true);
  let highest = actor.headAnchor.getWorldPosition(floodHeightPoint).y + 0.20 * rig.height;
  const hands = rig.realistic ? [rig.bones.bip01lhand, rig.bones.bip01rhand] : rig.arms.map(arm => arm.hand);
  for (const hand of hands) if (hand) highest = Math.max(highest, hand.getWorldPosition(floodHeightPoint).y + 0.09 * rig.height);
  if (highest > ceiling - 0.045) actor.position.y = Math.max(0, actor.position.y - (highest - ceiling + 0.045));
  actor._shadow.position.y = 0.018 - actor.position.y;
}

function createShadowTexture() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot((x + 0.5 - size / 2) / (size / 2), (y + 0.5 - size / 2) / (size / 2));
    const p = (y * size + x) * 4;
    data[p] = data[p + 1] = data[p + 2] = 0;
    data[p + 3] = Math.round(Math.pow(Math.max(0, 1 - d), 1.6) * 255);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

export async function createCharacterSystem({ scene, maxActors = 9, assetBase = '/assets/' } = {}) {
  if (!scene?.add) throw new TypeError('createCharacterSystem requires a Three.js scene.');
  const actors = [];
  const group = new THREE.Group();
  group.name = 'participants';
  scene.add(group);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.76, metalness: 0.015,
  });
  const shadowTexture = createShadowTexture();
  const shadowGeometry = new THREE.PlaneGeometry(0.85, 0.85);
  const actorGeometry = new Set();
  const sharedGeometry = new Set();
  const sharedMaterials = new Set();
  const sharedTextures = new Set();
  const realAssets = [];
  let vipAsset = null;
  let castKind = 'procedural';
  // Assets are optional and same-origin. Network loss or a missing downloaded
  // model always leaves the self-contained articulated fallback available.
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const base = new URL(assetBase, window.location.href);
      const loader = new GLTFLoader();
      const loadRosterManifest = async (relative, requiredCount = 0) => {
        try {
          const url = new URL(relative, base);
          const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
          if (!response.ok || !response.headers.get('content-type')?.includes('json')) return [];
          const manifest = await response.json();
          const entries = (manifest.models || []).slice(0, 8);
          if (!entries.length || requiredCount && entries.length !== requiredCount) return [];
          if (requiredCount && new Set(entries.map(entry => entry.id)).size !== requiredCount) return [];
          const loaded = await Promise.allSettled(entries.map(async entry => {
            const modelUrl = new URL(entry.file, url);
            if (modelUrl.origin !== window.location.origin) throw new Error('Character assets must be local.');
            const asset = await loader.loadAsync(modelUrl.href); asset.characterMeta = entry; return asset;
          }));
          const usable = loaded.filter(result => result.status === 'fulfilled').map(result => result.value);
          return requiredCount && usable.length !== requiredCount ? [] : usable;
        } catch { return []; }
      };
      const cast = await loadRosterManifest('cast/manifest.json', 8);
      if (cast.length === 8) { realAssets.push(...cast); castKind = 'individual-cast'; }
      else { realAssets.push(...await loadRosterManifest('uniforms/manifest.json')); if (realAssets.length) castKind = 'uniform-fallback'; }
        // The guest is optional; if its distinct asset is unavailable, the male
        // uniform model still gives the permanent NPC the correct clothes.
        try {
          const vipManifestUrl = new URL('player456/manifest.json', base);
          const vipResponse = await fetch(vipManifestUrl, { signal: AbortSignal.timeout(5000) });
          if (vipResponse.ok && vipResponse.headers.get('content-type')?.includes('json')) {
            const vipMeta = await vipResponse.json();
            const vipUrl = new URL(vipMeta.file || vipMeta.models?.[0]?.file || 'player456.glb', vipManifestUrl);
            if (vipUrl.origin === window.location.origin) {
              vipAsset = await loader.loadAsync(vipUrl.href);
              vipAsset.characterMeta = vipMeta.models?.[0] || vipMeta;
            }
          }
        } catch { /* A procedural or regular uniform male remains available. */ }
        for (const asset of [...realAssets, ...(vipAsset ? [vipAsset] : [])]) asset.scene.traverse((object) => {
          if (object.geometry) sharedGeometry.add(object.geometry);
          const materials = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
          for (const mat of materials) {
            sharedMaterials.add(mat);
            for (const value of Object.values(mat)) if (value?.isTexture) sharedTextures.add(value);
          }
        });
    } catch {
      // The procedural system does not depend on downloading or loading assets.
    }
  }
  const quality = { ...characterQuality, kind: realAssets.length ? 'skinned-realistic-human' : 'articulated-human', modelCount: realAssets.length, cast: castKind, uniforms: true, uniqueNumbers: true, dedicatedGuest: Boolean(vipAsset) };
  let disposed = false;
  let simulationTime = 0;

  function removeActor(actor) {
    actor._rig.tearMaterial?.dispose();
    actor._rig.numberMaterial?.dispose();
    actor._rig.numberTexture?.dispose();
    if (actor._rig.realistic) {
      actor._rig.mixer.stopAllAction();
      actor._rig.mixer.uncacheRoot(actor._rig.model);
      for (const mat of actor._rig.ownedMaterials) mat.dispose();
      for (const skeleton of actor._rig.ownedSkeletons) skeleton.dispose();
    }
    actor.root.traverse((object) => {
      if (object.geometry && object.geometry !== shadowGeometry && !sharedGeometry.has(object.geometry)) {
        object.geometry.dispose();
        actorGeometry.delete(object.geometry);
      }
    });
    actor._shadow.material.dispose();
    group.remove(actor.root);
  }

  function setRoster(players) {
    if (disposed) return;
    for (const actor of actors) removeActor(actor);
    actors.length = 0;
    const chosen = Array.isArray(players) ? players.slice(0, maxActors) : [];
    const columns = Math.ceil(Math.sqrt(chosen.length * 1.35));
    const rows = Math.ceil(chosen.length / Math.max(1, columns));
    for (let i = 0; i < chosen.length; i++) {
      const player = chosen[i];
      const id = player.id ?? `player-${i + 1}`;
      const seed = hash(`${id}:${i}`);
      const random = rng(hash(`${id}:${i}:${Math.random()}`));
      const invincible = Boolean(player.invincible);
      const number = String(player.number ?? i + 1).replace(/\D/g, '').padStart(3, '0').slice(-3);
      const asset = invincible ? vipAsset || realAssets[0] : realAssets[i % realAssets.length];
      const profile = personalityProfiles[i % personalityProfiles.length];
      const rig = asset ? createRealRig(asset, seed, i) : createRig(seed, i, bodyMaterial);
      addNumberPatches(rig, number, asset);
      createVisualAnchors(rig, asset);
      const root = rig.root;
      root.name = `participant-${String(id)}`;
      const spacing = Math.min(1.35, 9.6 / Math.max(1, columns - 1));
      root.position.set((i % columns - (columns - 1) * 0.5) * spacing + (random() - 0.5) * 0.15, 0,
        (Math.floor(i / columns) - (rows - 1) * 0.5) * Math.min(1.4, 7.7 / Math.max(1, rows - 1)) + (random() - 0.5) * 0.15);
      root.rotation.y = random() * TAU;
      const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({
        map: shadowTexture, transparent: true, opacity: 0.17, depthWrite: false,
      }));
      shadow.name = 'participant-contact-shadow';
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.018;
      shadow.renderOrder = 1;
      root.add(shadow);
      const actor = {
        id, name: String(player.name ?? `Player ${i + 1}`), root, position: root.position,
        alive: true, isVictim: false, action: 'run', invincible, number,
        castId: invincible ? 'player456' : asset?.characterMeta?.id || `uniform-${i % Math.max(1, realAssets.length)}`,
        background: invincible ? null : asset?.characterMeta?.background || null,
        identity: {
          id: invincible ? '456' : asset?.characterMeta?.id || `uniform-${i % Math.max(1, realAssets.length)}`,
          label: invincible ? 'Player 456' : asset?.characterMeta?.label || asset?.characterMeta?.name || `Participant ${number}`,
          background: asset?.characterMeta?.background || null,
          gender: asset?.characterMeta?.gender || null,
        },
        headAnchor: rig.headAnchor, chestAnchor: rig.chestAnchor,
        cloneVisual() { return cloneActorVisual(this); },
        personality: {
          name: invincible ? 'unshaken' : profile.name,
          bravery: invincible ? 0.95 : clamp(profile.bravery + (random() - 0.5) * 0.08, 0.1, 0.9),
          pace: invincible ? 1.01 : profile.pace + (random() - 0.5) * 0.025,
          turnSpeed: 3.3 + random() * 1.2,
          personalSpace: 0.66 + random() * 0.14,
          gestureInterval: profile.interval + random() * 0.4,
          lookRate: profile.look,
        },
        onReaction: null, onExpression: null,
        _rig: rig, _seed: seed, _random: random, _phase: random() * TAU,
        _vx: 0, _vz: 0, _targetX: 0, _targetZ: 0, _hasTarget: false,
        _locomotion: { nextAt: 0, pace: 1, targetPace: 1, pauseUntil: 0 },
        _wanderAt: 0, _fallTime: 0, _fallSide: random() > 0.5 ? 1 : -1, _deathPose: null,
        _shadow: shadow, _swimAutomatic: false,
        _clock: simulationTime, _animationClock: simulationTime, _turnRate: 0, _headingError: 0, _acceleration: 0, _motionSpeed: 0,
        _freezing: { amount: 0, motionScale: 1, animationScale: 1 }, _frozenPose: null,
        _awareness: { scenario: null, behavior: null, weight: 0, strength: 0, side: 1, variant: random(), nextAt: 0, protectUntil: 0, decisions: 0, contactKind: null, contactUntil: 0, intensity: 0, hasSource: false, sourceX: 0, sourceZ: 0, moveUntil: 0, moveX: 0, moveZ: 0 },
        _reactionWeights: Object.fromEntries(characterQuality.reactions.map(type => [type, 0])),
        _reactions: Object.fromEntries(characterQuality.reactions.map(type => [type, { weight: 0, intensity: 0, until: 0, start: 0, motionStart: 0 }])),
        _hasReaction: false, _reactionSide: random() > 0.5 ? 1 : -1,
        _injury: { severity: 0, ratio: 1, previousRatio: 1, stage: 'healthy', kind: 'impact', side: random() > 0.5 ? 1 : -1, nextPainAt: simulationTime + 0.3 + random() * 2.0 },
        _squish: { kind: 'impact', value: 0, renderedValue: 0, velocity: 0, intensity: 0, duration: 0.55, until: 0, lastImpulse: -100, pending: false, side: random() > 0.5 ? 1 : -1 },
        _blinkAt: simulationTime + 0.8 + random() * 3.8, _blinkStart: -100, _blinkDuration: 0.2,
        _face: { blink: 0, jaw: 0, brow: 0, fear: 0, scream: 0, cry: 0, dead: 0, gazeX: 0, gazeY: 0 },
        _expression: { type: 'neutral', intensity: 0, until: Infinity },
        _gazeTarget: 0, _lookAt: simulationTime + random() * 2, _gestureAt: simulationTime + 1.0 + random() * 4.0,
        _autoAction: null, _autoActionUntil: 0, _explicitActionUntil: 0,
        reactToDanger(kind, position, intensity = 1, duration = 0.9) {
          if (this.invincible || !this.alive || this._frozenPose || ['fall', 'dead'].includes(this.action) || !Number.isFinite(intensity) || !Number.isFinite(duration)) return;
          const awareness = this._awareness, type = String(kind);
          const freshContact = simulationTime >= awareness.contactUntil;
          awareness.contactKind = type; awareness.intensity = clamp(intensity, 0, 1);
          awareness.contactUntil = simulationTime + clamp(duration, 0.18, 3);
          const x = Array.isArray(position) ? position[0] : position?.x;
          const z = Array.isArray(position) ? position[2] : position?.z;
          awareness.hasSource = Number.isFinite(x) && Number.isFinite(z);
          if (awareness.hasSource) { awareness.sourceX = x; awareness.sourceZ = z; }
          // Repeated contact extends protection without resetting the pose
          // every frame or overwriting a commanded destination.
          awareness.nextAt = Math.min(awareness.nextAt, simulationTime);
          let reaction = this._hasTarget ? 'fear' : type === 'rats' || type === 'bite' ? 'swarm'
            : type === 'gas' || type === 'poison' ? 'cough' : type === 'boiler' || type === 'heat' ? 'heat'
              : type === 'freeze' || type === 'cold' ? 'shiver' : type === 'electric' ? 'shock' : 'brace';
          if (!this._hasTarget && freshContact && intensity > 0.55 && ['collapse', 'impact', 'crushing'].includes(type) && this._random() < 0.30) reaction = 'stumble';
          this.setReaction(reaction, awareness.intensity * 0.50, Math.min(duration, 0.75));
        },
        setFreezing(intensity) {
          if (this.invincible || !this.alive || this._deathPose || this._frozenPose?.reason === 'impale' || !Number.isFinite(intensity)) return;
          const amount = clamp(intensity, 0, 1);
          this._freezing.amount = amount;
          this._freezing.motionScale = (1 - amount) ** 1.45;
          this._freezing.animationScale = (1 - amount) ** 1.25;
          if (amount >= 1) this.freezeInPlace('cold');
        },
        clearFreezing() {
          this._frozenPose = null;
          this._freezing.amount = 0; this._freezing.motionScale = this._freezing.animationScale = 1;
          if (this.action === 'frozen') this.action = 'run';
          this._locomotion.pauseUntil = 0;
        },
        freezeInPlace(reason = 'cold') {
          if (this.invincible || this._frozenPose || !this.alive) return;
          this._frozenPose = { reason: reason === 'impale' ? 'impale' : 'cold', lockedAt: simulationTime };
          this.action = 'frozen'; this._vx = this._vz = this._motionSpeed = this._turnRate = this._acceleration = 0;
          this._autoActionUntil = 0;
          if (reason !== 'impale') this._freezing.amount = 1;
          this._freezing.motionScale = this._freezing.animationScale = 0;
        },
        setSquish(kind = 'impact', intensity = 1, duration = 0.55) {
          if (this.invincible || !this.alive || this._frozenPose || this.action === 'fall' || this.action === 'dead' || !Number.isFinite(intensity) || !Number.isFinite(duration)) return;
          const spring = this._squish;
          spring.kind = String(kind); spring.intensity = clamp(intensity, 0, 1); spring.duration = clamp(duration, 0.18, 1.2);
          spring.until = simulationTime + spring.duration;
          if (simulationTime - spring.lastImpulse >= 0.10 && spring.intensity > 0) {
            spring.side = this._random() > 0.5 ? 1 : -1;
            spring.value = Math.min(0.90, spring.value + spring.intensity * 0.42);
            spring.velocity = clamp(spring.velocity + spring.intensity * 6.5, -4, 9);
            spring.lastImpulse = simulationTime;
            spring.pending = true;
          }
        },
        setReaction(type, intensity = 1, duration = 0.65) {
          const reaction = this._reactions[type];
          if (!reaction || !Number.isFinite(intensity) || !Number.isFinite(duration) || !this.alive || this._frozenPose || this.action === 'fall' || this.action === 'dead') return;
          const onset = (reaction.until <= simulationTime || reaction.intensity <= 0.05) && intensity > 0.05;
          if (onset) {
            reaction.start = simulationTime;
            reaction.motionStart = this._animationClock;
            if (type === 'dodge' || type === 'stumble') this._reactionSide = this._random() > 0.5 ? 1 : -1;
            if (type === 'shock' || type === 'heat') this._blinkAt = Math.min(this._blinkAt, this._animationClock + 0.04);
          }
          reaction.intensity = clamp(intensity, 0, 1);
          reaction.until = simulationTime + clamp(duration, 0.06, 4);
          if (onset && reaction.intensity > 0.05 && (!this.invincible || ['fear', 'brace', 'dodge'].includes(type))) this.onReaction?.(type, reaction.intensity);
        },
        setExpression(type, intensity = 1, duration = Infinity) {
          if (!characterQuality.expressions.includes(type) || !Number.isFinite(intensity) || this.invincible && type === 'dead') return;
          if ((!this.alive || this.action === 'fall' || this.action === 'dead') && type !== 'dead' && type !== 'neutral') return;
          const nextIntensity = type === 'neutral' ? 0 : clamp(intensity, 0, 1);
          const changed = this._expression.type !== type || this._expression.intensity <= 0.05 && nextIntensity > 0.05;
          this._expression.type = type; this._expression.intensity = nextIntensity;
          this._expression.until = Number.isFinite(duration) ? simulationTime + clamp(duration, 0.06, 8) : Infinity;
          if (changed && (!this.invincible || type === 'neutral' || type === 'fear')) this.onExpression?.(type, nextIntensity);
        },
        clearReactions() {
          if (this._autoActionUntil > simulationTime && this.action === this._autoAction) this.action = 'run';
          for (const type of characterQuality.reactions) {
            this._reactions[type].weight = this._reactions[type].intensity = this._reactions[type].until = 0;
            this._reactionWeights[type] = 0;
          }
          this._hasReaction = false;
          this._squish.value = this._squish.renderedValue = this._squish.velocity = this._squish.intensity = this._squish.until = 0;
          this._squish.lastImpulse = -100;
          this._squish.pending = false;
          this._autoActionUntil = 0;
          this._awareness.weight = this._awareness.contactUntil = this._awareness.moveUntil = this._awareness.protectUntil = 0;
          this._awareness.behavior = this._awareness.scenario = null;
          this._awareness.nextAt = 0;
          this._gazeTarget = 0;
          this.setExpression('neutral', 0);
        },
        setAction(action) {
          if (!characterQuality.actions.includes(action)) return;
          if (this.invincible && (action === 'fall' || action === 'dead')) return;
          if (action === 'frozen') { this.freezeInPlace(); return; }
          if (this._frozenPose && action !== 'run') return;
          if (!this.alive && action !== 'fall' && action !== 'dead') return;
          this._autoActionUntil = 0;
          this._explicitActionUntil = simulationTime + 0.4;
          if (action === 'run') {
            this.clearFreezing();
            this._swimAutomatic = false;
            // Explicit run is also the host's room/reset command. Remove the
            // previous water/pit elevation immediately, even before a frame.
            this.position.y = 0;
          }
          // fall→dead (or repeated fall commands from a hazard) continues the
          // same collapse. A living actor can still be reset for the next draw.
          this.action = action;
          if (action !== 'fall' && action !== 'dead') releaseDeathPose(this);
        },
        setTarget(x, z) {
          if (!Number.isFinite(x) || !Number.isFinite(z)) return;
          this._targetX = x;
          this._targetZ = z;
          this._hasTarget = true;
          if (this._autoActionUntil > simulationTime && this.action === this._autoAction) this.action = 'run';
          this._autoActionUntil = 0;
        },
        clearTarget() {
          this._hasTarget = false;
          this._wanderAt = 0;
        },
      };
      root.traverse((object) => {
        if (object.geometry && object.geometry !== shadowGeometry) actorGeometry.add(object.geometry);
      });
      actors.push(actor);
      group.add(root);
    }
  }

  function update(dt, state = {}) {
    if (disposed) return;
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    if (!dt) return;
    simulationTime += dt;
    const bounds = state.bounds || {};
    // Half a shoulder-width remains between a person and moving chamber walls.
    let minX = Number.isFinite(bounds.minX) ? bounds.minX + 0.38 : -6.45;
    let maxX = Number.isFinite(bounds.maxX) ? bounds.maxX - 0.38 : 6.45;
    let minZ = Number.isFinite(bounds.minZ) ? bounds.minZ + 0.38 : -5.40;
    let maxZ = Number.isFinite(bounds.maxZ) ? bounds.maxZ - 0.38 : 5.40;
    if (minX > maxX) minX = maxX = (minX + maxX) * 0.5;
    if (minZ > maxZ) minZ = maxZ = (minZ + maxZ) * 0.5;
    for (const actor of actors) {
      actor._clock = simulationTime;
      if (actor.invincible) {
        actor.alive = true;
        actor.isVictim = false;
        actor.root.visible = true;
        if (actor.action === 'fall' || actor.action === 'dead') actor.setAction('run');
      }
      if (actor._frozenPose) {
        animateRig(actor, dt, actor._animationClock, state);
        continue;
      }
      const animationDt = dt * actor._freezing.animationScale;
      actor._animationClock += animationDt;
      updateInjuryMotion(actor, animationDt, simulationTime);
      updateReactions(actor, animationDt, simulationTime);
      updateAwareness(actor, animationDt, state, actors, { minX, maxX, minZ, maxZ });
      updatePersonality(actor, state, simulationTime);
      if (actor.alive && state.waterLevel > 1.05 && (actor.action === 'run' || actor.action === 'panic')) {
        actor.action = 'swim';
        actor._swimAutomatic = true;
      } else if (actor.alive && actor._swimAutomatic && actor.action === 'swim' && !(state.waterLevel > 1.05)) {
        actor.action = 'run';
        actor._swimAutomatic = false;
      }
      const movable = actor.alive && ['run', 'panic', 'swim'].includes(actor.action);
      let desiredX = 0, desiredZ = 0;
      if (movable) {
        const externalTarget = actor._hasTarget;
        const awareness = actor._awareness;
        const localEscape = !externalTarget && simulationTime < awareness.moveUntil;
        const dx = actor._targetX - actor.position.x, dz = actor._targetZ - actor.position.z;
        if (!externalTarget && !localEscape && (simulationTime > actor._wanderAt || Math.hypot(dx, dz) < 0.55)) {
          actor._targetX = lerp(minX + 0.3, maxX - 0.3, actor._random());
          actor._targetZ = lerp(minZ + 0.3, maxZ - 0.3, actor._random());
          actor._wanderAt = simulationTime + 2.4 + actor._random() * 3.4;
        }
        const tx = clamp(localEscape ? awareness.moveX : actor._targetX, minX, maxX) - actor.position.x;
        const tz = clamp(localEscape ? awareness.moveZ : actor._targetZ, minZ, maxZ) - actor.position.z;
        const dist = Math.hypot(tx, tz);
        const reactionSlowdown = 1 - actor._reactionWeights.stumble * 0.42 - actor._reactionWeights.brace * 0.25 - actor._reactionWeights.cough * 0.16;
        const injuryPace = externalTarget ? 1 : 1 - actor._injury.severity * 0.24;
        const gait = actor._locomotion;
        if (!externalTarget && actor.action !== 'swim' && simulationTime >= gait.nextAt) {
          const urgency = state.phase === 'preview' ? 0 : clamp(state.progress || 0,0,1);
          gait.targetPace = 0.48 + actor._random() * 0.52 + urgency * 0.12;
          gait.nextAt = simulationTime + 1.1 + actor._random() * 2.8;
          if (actor._random() < 0.28 - urgency * 0.20) gait.pauseUntil = simulationTime + 0.18 + actor._random() * 0.48;
        }
        const naturalPace = externalTarget || actor.action === 'swim' ? 1 : simulationTime < gait.pauseUntil ? 0.05 : gait.targetPace;
        gait.pace = lerp(gait.pace,naturalPace,1-Math.exp(-dt*5));
        const speed = (actor.action === 'swim' ? 0.85 : actor.action === 'panic' ? 2.7 : 1.9) * Math.max(0.35, reactionSlowdown) * (externalTarget ? 1 : actor.personality.pace) * injuryPace * (externalTarget ? 1 : gait.pace) * actor._freezing.motionScale;
        if (dist > 0.10) {
          desiredX = tx / dist * speed;
          desiredZ = tz / dist * speed;
          if (externalTarget && dist < 0.7) {
            desiredX *= dist / 0.7;
            desiredZ *= dist / 0.7;
          }
        }
        // Local repulsion supplies actual human-to-human avoidance, including
        // stationary survivors; it has a deterministic direction for overlap.
        for (const other of actors) {
          if (other === actor || !other.alive) continue;
          let sx = actor.position.x - other.position.x, sz = actor.position.z - other.position.z;
          const d2 = sx * sx + sz * sz;
          const space = (actor.personality.personalSpace + other.personality.personalSpace) * 0.5;
          if (d2 > space * space) continue;
          if (d2 < 0.00001) {
            sx = Math.cos(actor._phase) * 0.01;
            sz = Math.sin(actor._phase) * 0.01;
          }
          const distance = Math.max(0.01, Math.hypot(sx, sz));
          const force = (space - distance) / space * 3.7;
          desiredX += sx / distance * force;
          desiredZ += sz / distance * force;
        }
        if (actor._reactionWeights.dodge > 0.01) {
          const evasive = actor._reactionWeights.dodge * actor._reactionSide * 1.05;
          desiredX += Math.cos(actor.root.rotation.y) * evasive;
          desiredZ -= Math.sin(actor.root.rotation.y) * evasive;
        }
        const desiredSpeed = Math.hypot(desiredX, desiredZ);
        if (desiredSpeed > speed * 1.2) {
          desiredX *= speed * 1.2 / desiredSpeed;
          desiredZ *= speed * 1.2 / desiredSpeed;
        }
      }
      const previousSpeed = actor._motionSpeed;
      const previousX = actor.position.x, previousZ = actor.position.z;
      const smooth = 1 - Math.exp(-dt * (movable ? 7 : 12));
      if (movable && Math.hypot(desiredX, desiredZ) > 0.1) {
        const heading = Math.atan2(desiredX, desiredZ);
        actor._headingError = shortestAngle(actor.root.rotation.y, heading);
        const turn = clamp(actor._headingError * (1 - Math.exp(-dt * 8)), -actor.personality.turnSpeed * dt, actor.personality.turnSpeed * dt);
        actor.root.rotation.y += turn;
        actor._turnRate = lerp(actor._turnRate, turn / dt, 1 - Math.exp(-dt * 10));
        // Slow into sharp turns rather than running sideways while the torso
        // catches up. The authored stride then follows actual travelled speed.
        const turnSpeed = 0.28 + Math.max(0, Math.cos(actor._headingError)) * 0.72;
        desiredX *= turnSpeed; desiredZ *= turnSpeed;
      } else {
        actor._headingError = 0;
        actor._turnRate = lerp(actor._turnRate, 0, smooth);
      }
      let accelX = (desiredX - actor._vx) * smooth, accelZ = (desiredZ - actor._vz) * smooth;
      const maxStep = dt * (Math.hypot(desiredX, desiredZ) < previousSpeed ? 7.5 : 5.5);
      const accelerationStep = Math.hypot(accelX, accelZ);
      if (accelerationStep > maxStep) { accelX *= maxStep / accelerationStep; accelZ *= maxStep / accelerationStep; }
      actor._vx += accelX; actor._vz += accelZ;
      if (movable) {
        actor.position.x = clamp(actor.position.x + actor._vx * dt, minX, maxX);
        actor.position.z = clamp(actor.position.z + actor._vz * dt, minZ, maxZ);
        actor._vx = (actor.position.x - previousX) / dt;
        actor._vz = (actor.position.z - previousZ) / dt;
      }
      actor._motionSpeed = Math.hypot(actor.position.x - previousX, actor.position.z - previousZ) / dt;
      actor._acceleration = lerp(actor._acceleration, (actor._motionSpeed - previousSpeed) / dt, 1 - Math.exp(-dt * 7));
      animateRig(actor, animationDt, actor._animationClock, state);
    }
  }

  function dispose() {
    if (disposed) return;
    for (const actor of actors) removeActor(actor);
    actors.length = 0;
    actorGeometry.clear();
    shadowGeometry.dispose();
    shadowTexture.dispose();
    bodyMaterial.dispose();
    for (const geometry of sharedGeometry) geometry.dispose();
    for (const mat of sharedMaterials) mat.dispose();
    for (const texture of sharedTextures) texture.dispose();
    scene.remove(group);
    disposed = true;
  }

  return { actors, setRoster, update, dispose, quality, assetBase };
}

export default createCharacterSystem;
