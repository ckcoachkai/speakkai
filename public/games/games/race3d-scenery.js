import { addScenicArt } from './race3d-scenic-art.js?v=20261025-supercars';
import { createRoadsideBuildings } from './race3d-buildings.js?v=20261025-supercars';
import { addLandscapeTerrain } from './race3d-terrain.js?v=20261025-supercars';
/**
 * Warm-day circuit scenery for race3d.
 *
 * The module owns every object it creates and receives Three.js from the caller
 * so the game uses one shared Three instance. Vegetation and small trackside
 * details are instanced to keep the environment inexpensive to render.
 */
export function createRaceScenery(THREE, track) {
  const group = new THREE.Group();
  group.name = 'race3d-scenery';
  const replacedTrees = [];
  track.group?.traverse(object => {
    if (object.name.startsWith('park-pine-')) { replacedTrees.push([object, object.visible]); object.visible = false; }
  });
  const total = Math.max(1, Number(track?.totalLength) || 1);
  const TAU = Math.PI * 2;
  let seed = 0x1a2b3c4d;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const v3 = (v, fallback = { x: 0, y: 0, z: 0 }) => new THREE.Vector3(
    Number.isFinite(Number(v?.x)) ? Number(v.x) : fallback.x,
    Number.isFinite(Number(v?.y)) ? Number(v.y) : fallback.y,
    Number.isFinite(Number(v?.z)) ? Number(v.z) : fallback.z,
  );
  const horizontal = (v) => {
    v.y = 0;
    if (v.lengthSq() < 1e-8) v.set(1, 0, 0);
    return v.normalize();
  };
  const sample = (distance) => {
    const d = ((distance % total) + total) % total;
    const s = track.sampleTrack(d);
    const p = v3(s?.position);
    const tangent = horizontal(v3(s?.tangent, { x: 1, y: 0, z: 0 }));
    let right = horizontal(v3(s?.right, { x: -tangent.z, y: 0, z: tangent.x }));
    if (Math.abs(right.dot(tangent)) > 0.5) right.set(-tangent.z, 0, tangent.x).normalize();
    return { p, tangent, right, width: Math.max(8, Number(s?.width) || 18) };
  };

  const sampleCount = clamp(Math.ceil(total / 18), 128, 512);
  const route = Array.from({ length: sampleCount }, (_, i) => sample(total * i / sampleCount));
  const center = new THREE.Vector3();
  for (const q of route) center.add(q.p);
  center.multiplyScalar(1 / route.length);
  // Keep the meadow under the full graded course ribbon. The track module
  // builds its earthworks below the sampled road surface, so using the route's
  // average elevation here would put grass through low sections of the road.
  const lowestRoadY = Math.min(...route.map(q => q.p.y));
  const groundY = lowestRoadY - 2.4;
  let radius = 0;
  for (const q of route) {
    const dx = q.p.x - center.x;
    const dz = q.p.z - center.z;
    radius = Math.max(radius, Math.hypot(dx, dz) + q.width * 0.5);
  }
  radius = Math.max(radius, 160);
  const unit = clamp((route.reduce((n, q) => n + q.width, 0) / route.length) / 20, 0.72, 2.2);
  const far = radius + 760 * unit;

  const mat = (color, roughness = 1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const addMesh = (geometry, material, name, parent = group) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const setYaw = (object, tangent) => {
    object.rotation.y = Math.atan2(-tangent.z, tangent.x);
  };
  const orientAndPlace = (object, at, offset, side = 1) => {
    setYaw(object, at.tangent);
    const localRight = new THREE.Vector3(-at.tangent.z, 0, at.tangent.x);
    const sign = localRight.dot(at.right) >= 0 ? side : -side;
    object.position.set(
      at.p.x + at.right.x * offset * side,
      groundY,
      at.p.z + at.right.z * offset * side,
    );
    return sign;
  };

  // A fine, warm meadow texture keeps the large ground plane from reading as a
  // flat green card. It is generated locally and tiled over the circuit area.
  function makeGrassTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#778b52';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3600; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const light = rand();
      ctx.strokeStyle = light > 0.54 ? `rgba(190,190,112,${0.05 + rand() * 0.12})` : `rgba(33,67,38,${0.05 + rand() * 0.1})`;
      ctx.lineWidth = 0.4 + rand() * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 2, y - 1 - rand() * 4);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(12, radius / 30), Math.max(12, radius / 30));
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  const grassTexture = makeGrassTexture();
  const meadowMat = mat('#b2a96a', 1, { map: grassTexture, color: '#c1bd84' });
  const meadow = addMesh(new THREE.PlaneGeometry(far * 2.4, far * 2.4), meadowMat, 'meadow');
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.set(center.x, groundY - 0.3, center.z);

  // Distant, layered foothills and mountains around the full course horizon.
  function makeRidge(name, innerPad, outerPad, height, tint, phase) {
    const segments = 192;
    const rings = [0, 1, 2];
    const positions = [];
    const colors = [];
    const indices = [];
    const baseColor = new THREE.Color(tint);
    for (const ring of rings) {
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * TAU;
        const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        let circuitEdge = 0;
        for (const q of route) circuitEdge = Math.max(circuitEdge, (q.p.x - center.x) * dir.x + (q.p.z - center.z) * dir.z + q.width * 0.5);
        const wav = 0.5 + 0.24 * Math.sin(a * 5 + phase) + 0.17 * Math.sin(a * 11 - phase * 1.7) + 0.09 * Math.sin(a * 19 + 0.7);
        const innerR = Math.max(radius, circuitEdge) + innerPad;
        const outerR = innerR + outerPad;
        const r = ring === 0 ? innerR : ring === 1 ? (innerR + outerR) * 0.5 : outerR;
        const h = ring === 0 ? 2 + wav * height * 0.22 : ring === 1 ? height * (0.52 + wav * 0.7) : height * (0.17 + wav * 0.28);
        positions.push(center.x + dir.x * r, groundY + h, center.z + dir.z * r);
        const shade = ring === 0 ? 0.92 : ring === 1 ? (0.78 + wav * 0.13) : 0.9;
        const color = baseColor.clone().multiplyScalar(shade);
        colors.push(color.r, color.g, color.b);
      }
    }
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < segments; i++) {
        const a = ring * segments + i;
        const b = ring * segments + ((i + 1) % segments);
        const c = (ring + 1) * segments + i;
        const d = (ring + 1) * segments + ((i + 1) % segments);
        indices.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const ridge = addMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), name);
    ridge.receiveShadow = true;
    return ridge;
  }
  makeRidge('olive-foothills', 70 * unit, 250 * unit, 64 * unit, '#789166', 0.4);
  makeRidge('blue-distance-mountains', 300 * unit, 470 * unit, 118 * unit, '#71889a', 1.6);

  const terrain = addLandscapeTerrain({ THREE, group, route, groundY, unit, center, radius });

  const buildings = createRoadsideBuildings(THREE, track, { heightAt: terrain.heightAt, roadClearance: terrain.roadClearance, groundY });
  group.add(buildings.group);

  // Low scrub remains close to the route while trees sit farther back. The
  // lateral margins keep every instance outside the defined track surface.
  const dummy = new THREE.Object3D();
  const trunkGeo = new THREE.CylinderGeometry(0.32 * unit, 0.58 * unit, 5.5 * unit, 7);
  const crownGeo = new THREE.IcosahedronGeometry(3.45 * unit, 1);
  crownGeo.translate(0, 3.8 * unit, 0);
  const trunkMat = mat('#65513a', 1);
  const foliageMats = [mat('#48663b', 1), mat('#5f783e', 1), mat('#6e8047', 1)];
  const shrubGeo = new THREE.IcosahedronGeometry(2.3 * unit, 1);
  const shrubMats = [mat('#5c7442', 1), mat('#74824b', 1), mat('#859056', 1)];
  const treeCount = clamp(Math.round(total / 15), 100, 460);
  const trees = Array.from({ length: treeCount }, (_, i) => {
    const d = total * (i + rand() * 0.72) / treeCount;
    const side = i % 2 ? 1 : -1;
    const at = sample(d);
    const offset = at.width * 0.5 + (25 + rand() * 105) * unit;
    const p = at.p.clone().addScaledVector(at.right, side * offset);
    const scale = 0.7 + rand() * 0.8;
    return { p, scale, type: Math.floor(rand() * foliageMats.length) };
  }).filter(tree => terrain.roadClearance(tree.p.x, tree.p.z) > 16 * unit);
  const trunkInstances = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length);
  trunkInstances.name = 'roadside-tree-trunks';
  const canopyInstances = foliageMats.map((material, type) => {
    const mesh = new THREE.InstancedMesh(crownGeo, material, trees.filter(t => t.type === type).length || 1);
    mesh.name = `roadside-foliage-${type}`;
    return mesh;
  });
  const canopySlots = [0, 0, 0];
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    dummy.position.set(tree.p.x, terrain.heightAt(tree.p.x, tree.p.z) + 2.75 * unit * tree.scale, tree.p.z);
    dummy.rotation.set(0, rand() * TAU, 0);
    dummy.scale.set(tree.scale, tree.scale, tree.scale);
    dummy.updateMatrix();
    trunkInstances.setMatrixAt(i, dummy.matrix);
    const canopy = canopyInstances[tree.type];
    const slot = canopySlots[tree.type]++;
    canopy.setMatrixAt(slot, dummy.matrix);
    canopy.setColorAt(slot, new THREE.Color(['#668346', '#78934b', '#879a55'][tree.type]).multiplyScalar(0.82 + rand() * 0.34));
  }
  trunkInstances.instanceMatrix.needsUpdate = true;
  trunkInstances.visible = false;
  canopyInstances.forEach(mesh => { mesh.visible = false; });
  group.add(trunkInstances, ...canopyInstances);

  const shrubCount = clamp(Math.round(total / 5.5), 240, 1000);
  const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMats[0], shrubCount);
  shrubs.name = 'roadside-low-scrub';
  shrubs.instanceColor = null;
  for (let i = 0; i < shrubCount; i++) {
    const d = total * (i + rand()) / shrubCount;
    const at = sample(d);
    const side = i % 2 ? 1 : -1;
    const offset = at.width * 0.5 + (11 + rand() * 24) * unit;
    const p = at.p.clone().addScaledVector(at.right, side * offset);
    const s = terrain.roadClearance(p.x, p.z) > 6 * unit ? (0.5 + rand() * 0.75) * unit : 0;
    dummy.position.set(p.x, terrain.heightAt(p.x, p.z) + s * 0.55, p.z);
    dummy.rotation.set(0, rand() * TAU, 0);
    dummy.scale.set(s, s * (0.6 + rand() * 0.55), s);
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
    if (typeof shrubs.setColorAt === 'function') shrubs.setColorAt(i, new THREE.Color(['#536b3b', '#718046', '#879151'][i % 3]));
  }
  shrubs.instanceMatrix.needsUpdate = true;
  if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
  group.add(shrubs);

  // Compact red-white safety wall sections near the grandstand end of the
  // straights provide circuit detail without extending onto the driving lane.
  const barrierGeo = new THREE.BoxGeometry(7 * unit, 1.15 * unit, 0.85 * unit);
  const barrierMats = [mat('#e7e0d2', 0.76), mat('#c7563d', 0.78)];
  const barrierCount = clamp(Math.floor(total / 38), 36, 180);
  const barriers = barrierMats.map((material, colorIndex) => new THREE.InstancedMesh(barrierGeo, material, Math.ceil(barrierCount / 2)));
  barriers.forEach((mesh, i) => { mesh.name = `safety-barrier-${i}`; });
  const barrierSlots = [0, 0];
  for (let i = 0; i < barrierCount; i++) {
    const d = total * i / barrierCount;
    const at = sample(d);
    const side = i % 2 ? -1 : 1;
    const offset = at.width * 0.5 + 8.2 * unit;
    const p = at.p.clone().addScaledVector(at.right, side * offset);
    const mesh = barriers[i % 2];
    // Elevated sections have graded earthworks above the meadow. Rest the
    // barrier on that shoulder so walls do not disappear under the banking.
    const shoulderY = track.sampleGround?.(d, side * offset)?.y;
    const barrierY = Math.max(terrain.heightAt(p.x, p.z), Number.isFinite(shoulderY) ? shoulderY : groundY);
    dummy.position.set(p.x, barrierY + 0.58 * unit, p.z);
    setYaw(dummy, at.tangent);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(barrierSlots[i % 2]++, dummy.matrix);
  }
  barriers.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; group.add(mesh); });

  // Grandstand on one outside shoulder: concrete terraces, colored seats,
  // canopy and slim supports make a readable landmark from the chase view.
  const standAt = sample(total * 0.22);
  const stand = new THREE.Group();
  stand.name = 'grandstand';
  const standSide = -1;
  const localSide = orientAndPlace(stand, standAt, standAt.width * 0.5 + 47 * unit, standSide);
  group.add(stand);
  const length = 108 * unit;
  const depth = 30 * unit;
  const concrete = mat('#b6b8b1', 0.88);
  const darkConcrete = mat('#777f7e', 0.92);
  const seatMaterials = [mat('#1c4e76', 0.7), mat('#b84c32', 0.7), mat('#d5a849', 0.72)];
  function box(parent, name, x, y, z, sx, sy, sz, material) {
    const mesh = addMesh(new THREE.BoxGeometry(sx, sy, sz), material, name, parent);
    mesh.position.set(x, y, z);
    return mesh;
  }
  box(stand, 'grandstand-footing', 0, 0.35 * unit, localSide * 1.7 * unit, length, 0.7 * unit, depth + 6 * unit, darkConcrete);
  for (let row = 0; row < 8; row++) {
    const z = localSide * (-10 + row * 2.35) * unit;
    const y = (1.0 + row * 0.72) * unit;
    box(stand, `terrace-${row}`, 0, y, z, length * (1 - row * 0.012), 0.62 * unit, 2.55 * unit, concrete);
    const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(2.45 * unit, 0.7 * unit, 0.72 * unit), seatMaterials[row % seatMaterials.length], 38);
    seats.name = `grandstand-seats-${row}`;
    for (let i = 0; i < 38; i++) {
      dummy.position.set((i - 18.5) * 2.72 * unit, y + 0.64 * unit, z + localSide * 0.2 * unit);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      seats.setMatrixAt(i, dummy.matrix);
    }
    seats.instanceMatrix.needsUpdate = true;
    stand.add(seats);
  }
  const roofY = 8.3 * unit;
  box(stand, 'stand-roof', 0, roofY, localSide * 9.1 * unit, length + 9 * unit, 0.75 * unit, 15 * unit, mat('#e8e2d4', 0.52, { metalness: 0.12 }));
  for (const x of [-length * 0.46, -length * 0.15, length * 0.15, length * 0.46]) {
    box(stand, 'roof-support', x, roofY * 0.5, localSide * 9.2 * unit, 0.7 * unit, roofY, 0.7 * unit, darkConcrete);
  }
  box(stand, 'grandstand-front-sign', 0, 7.1 * unit, -localSide * 12.3 * unit, length * 0.82, 1.7 * unit, 0.55 * unit, mat('#315471', 0.54));

  // Low pit garages and apron on the opposite shoulder. Their position is
  // behind the roadside safety margin and stays outside the racing surface.
  const pitAt = sample(total * 0.035);
  const pits = new THREE.Group();
  pits.name = 'pit-garages';
  const pitSide = 1;
  const pitLocalSide = orientAndPlace(pits, pitAt, pitAt.width * 0.5 + 29 * unit, pitSide);
  group.add(pits);
  const pitLength = 118 * unit;
  box(pits, 'pit-apron', 0, 0.08 * unit, pitLocalSide * -3 * unit, pitLength + 18 * unit, 0.16 * unit, 21 * unit, mat('#777d7e', 0.92));
  box(pits, 'garage-body', 0, 4.2 * unit, pitLocalSide * 9.2 * unit, pitLength, 8.4 * unit, 14.8 * unit, mat('#d6d3c9', 0.82));
  box(pits, 'garage-roof', 0, 8.55 * unit, pitLocalSide * 9.2 * unit, pitLength + 2 * unit, 0.7 * unit, 16.5 * unit, mat('#586b77', 0.5, { metalness: 0.16 }));
  box(pits, 'pit-accent-band', 0, 6.65 * unit, pitLocalSide * 1.63 * unit, pitLength, 0.75 * unit, 0.35 * unit, mat('#b64d38', 0.55));
  const bayCount = 8;
  for (let i = 0; i < bayCount; i++) {
    const x = (i - (bayCount - 1) / 2) * (pitLength / bayCount);
    box(pits, `garage-bay-${i}`, x, 2.5 * unit, pitLocalSide * 1.58 * unit, pitLength / bayCount - 0.9 * unit, 4.55 * unit, 0.22 * unit, mat('#a7c1c8', 0.38, { metalness: 0.1, emissive: '#18252a', emissiveIntensity: 0.15 }));
    box(pits, `garage-pillar-${i}`, x - pitLength / (bayCount * 2) + 0.4 * unit, 2.5 * unit, pitLocalSide * 1.35 * unit, 0.7 * unit, 5.4 * unit, 0.65 * unit, mat('#e4e0d7', 0.78));
  }
  box(pits, 'pit-timing-tower', -pitLength * 0.41, 13.5 * unit, pitLocalSide * 10 * unit, 8 * unit, 10 * unit, 8 * unit, mat('#e3ded1', 0.65));
  box(pits, 'pit-timing-window', -pitLength * 0.41, 15.5 * unit, pitLocalSide * 5.9 * unit, 6.6 * unit, 2.1 * unit, 0.2 * unit, mat('#243e52', 0.3, { metalness: 0.25 }));

  addScenicArt(THREE, { group, track, terrain, unit });
  let disposed = false;
  return {
    group,
    update(elapsed = 0) {
      if (disposed) return;

    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [object, visible] of replacedTrees) object.visible = visible;
      const resources = new Set();
      group.traverse((object) => {
        if (object.geometry) resources.add(object.geometry);
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            for (const value of Object.values(material)) {
              if (value && value.isTexture) resources.add(value);
            }
            resources.add(material);
          }
        }
      });
      for (const resource of resources) resource.dispose?.();
      group.clear();
    },
  };
}

export default createRaceScenery;





