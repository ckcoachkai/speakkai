/** Optional jump lanes. All dimensions and distances use the track's metre units.
 * The enclosing race world supplies the existing 1/5 display scale.
 * Physics and rendered decks share these profile functions, including the lip.
 */
const clamp01 = value => Math.max(0, Math.min(1, value));
const ROAD_TOP = .035;
import {safeRampSites} from './race3d-course-safety.js?v=20261025-fifty1';

export function createRampLayout(track) {
  // A length alone cannot establish geometry safety. Never manufacture an
  // unvalidated deck from an arbitrary percentage of the route.
  return track&&typeof track==='object'?safeRampSites(track):[];
}

/** Progress is normalized from the flush approach (0) to the launch lip (1). */
export function rampHeightAt(ramp, progress) {
  const u = clamp01(progress);
  return ramp.height * u * u;
}

export function rampSlopeAt(ramp, progress) {
  const u = clamp01(progress);
  return 2 * ramp.height / ramp.length * u;
}

/** The tyre contact surface used by both physics and rendered wheel placement.
 * Track metres in, world metres out. Outside a deck there is no invisible lift.
 */
export function sampleRampSurface(track, ramps, distance, lateral = 0) {
  const sample = track.sampleTrack(distance);
  const roadY = (Number(sample?.position?.y) || 0) + (Number(sample?.right?.y) || 0) * lateral + Math.tan(Number(sample?.bank) || 0) * lateral + ROAD_TOP;
  const totalLength = Number(track.totalLength) || 1;
  let rampHeight = 0, rampSlope = 0, rampId = null, progress = 0, deck = null;
  for (const ramp of ramps || []) {
    const lap = Math.floor((distance - ramp.distance) / totalLength);
    if (lap < 0) continue;
    const along = distance - ramp.distance - lap * totalLength;
    if (along < 0 || along > ramp.length || Math.abs(lateral - ramp.lateral) > ramp.width / 2) continue;
    progress = along / ramp.length; deck = ramp; rampId = ramp.id;
    rampHeight = rampHeightAt(ramp, progress); rampSlope = rampSlopeAt(ramp, progress); break;
  }
  return { surfaceY: roadY + rampHeight, roadY, rampHeight, rampSlope, rampId, progress, ramp: deck };
}

export function createRaceRamps(THREE, { track }) {
  const group = new THREE.Group();
  group.name = 'race3d-ramps';
  const layout = createRampLayout(track);
  track.ramps=layout;
  group.userData.ramps = layout;
  const materials = [], geometries = [], batches = new Map();
  const material = (color, extra = {}) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .35, ...extra });
    materials.push(result);
    return result;
  };
  const deck = material(0x233e4d, { roughness: .5, metalness: .48, emissive: 0x093741, emissiveIntensity: .12 });
  const steel = material(0x96a8b0, { roughness: .32, metalness: .82 });
  const dark = material(0x101c25, { roughness: .66, metalness: .66, side: THREE.DoubleSide });
  const cyan = material(0x60e8ed, { roughness: .28, metalness: .45, emissive: 0x1b8c9a, emissiveIntensity: .62 });
  const amber = material(0xf8bf52, { roughness: .35, metalness: .5, emissive: 0xb66a14, emissiveIntensity: .16 });
  const white = material(0xd9e9e7, { roughness: .6, metalness: .15 });
  const beacon = material(0xa6f9ff, { roughness: .22, emissive: 0x3be8ff, emissiveIntensity: 1.7 });

  function batch(name, mat) {
    if (!batches.has(name)) batches.set(name, { name, mat, positions: [], indices: [] });
    return batches.get(name);
  }
  function quad(target, a, b, c, d) {
    const i = target.positions.length / 3;
    for (const point of [a, b, c, d]) target.positions.push(point.x, point.y, point.z);
    target.indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  function point(distance, lateral, height = 0) {
    const sample = track.sampleTrack(distance);
    const result = sample.position.clone().addScaledVector(sample.right, lateral);
    result.y += Math.tan(sample.bank || 0) * lateral + ROAD_TOP + height;
    return result;
  }
  function onRamp(ramp, u, across, lift = 0) {
    return point(ramp.distance + ramp.length * u, ramp.lateral + across, rampHeightAt(ramp, u) + lift);
  }
  function ribbon(target, ramp, u0, u1, left, right, lift = 0, steps = null) {
    const count = steps || Math.max(1, Math.ceil((u1 - u0) * ramp.length / .5));
    for (let i = 0; i < count; i++) {
      const a = u0 + (u1 - u0) * i / count, b = u0 + (u1 - u0) * (i + 1) / count;
      quad(target, onRamp(ramp, a, left, lift), onRamp(ramp, b, left, lift),
        onRamp(ramp, b, right, lift), onRamp(ramp, a, right, lift));
    }
  }
  function box(target, ramp, u, lateral, w, h, depth, lift) {
    const du = depth / ramp.length / 2;
    const p = [
      onRamp(ramp, u - du, lateral - w / 2, lift), onRamp(ramp, u + du, lateral - w / 2, lift),
      onRamp(ramp, u + du, lateral + w / 2, lift), onRamp(ramp, u - du, lateral + w / 2, lift)
    ];
    const q = p.map(vertex => vertex.clone().add(new THREE.Vector3(0, h, 0)));
    quad(target, ...q);
    for (let i = 0; i < 4; i++) quad(target, p[i], p[(i + 1) % 4], q[(i + 1) % 4], q[i]);
  }
  const deckBatch = batch('composite-driving-decks', deck);
  const shellBatch = batch('grounded-steel-wedges', dark);
  const trimBatch = batch('brushed-metal-frames-and-ribs', steel);
  const nitroBatch = batch('inlaid-nitro-lanes', cyan);
  const amberBatch = batch('amber-edge-markings', amber);
  const arrowBatch = batch('launch-direction-chevrons', white);
  const beaconBatch = batch('edge-beacons', beacon);

  for (const ramp of layout) {
    const half = ramp.width / 2;
    ribbon(deckBatch, ramp, 0, 1, -half, half);
    // A flush dashed landing corridor makes the trajectory and bypass lane
    // legible without adding a collision or changing the shared road profile.
    for(let offset=30;offset<100;offset+=10)for(const side of [-1,1]){
      const a=ramp.distance+ramp.length+offset,b=a+5,l=ramp.lateral+side*(half-.2);
      quad(arrowBatch,point(a,l-.07,.025),point(b,l-.07,.025),point(b,l+.07,.025),point(a,l+.07,.025));
    }
    // The shell meets the road at every section; no horizontal floating wedge
    // approximation, even over the course's changing grade and banking.
    const segments = Math.ceil(ramp.length / .5);
    for (const side of [-1, 1]) {
      for (let i = 0; i < segments; i++) {
        const u = i / segments, v = (i + 1) / segments;
        quad(shellBatch, point(ramp.distance + u * ramp.length, ramp.lateral + side * half),
          point(ramp.distance + v * ramp.length, ramp.lateral + side * half),
          onRamp(ramp, v, side * half), onRamp(ramp, u, side * half));
      }
      ribbon(trimBatch, ramp, 0, 1, Math.min(side * (half - .13), side * half), Math.max(side * (half - .13), side * half), .012);
      ribbon(nitroBatch, ramp, .035, .98, side * 1.53 - .085, side * 1.53 + .085, .016);
      // Low edge furniture sits outside the usable 5.4 m deck, never across it.
      for (const u of [.18, .42, .66, .9]) {
        box(trimBatch, ramp, u, side * (half + .07), .18, .13, .36, 0);
        box(beaconBatch, ramp, u, side * (half + .07), .115, .045, .23, .13);
      }
      for (let i = 1; i < 9; i++) {
        const u = i / 10;
        ribbon(amberBatch, ramp, u, u + .032,
          Math.min(side * (half - .31), side * (half - .17)),
          Math.max(side * (half - .31), side * (half - .17)), .02);
      }
    }
    quad(shellBatch, point(ramp.distance + ramp.length, ramp.lateral - half),
      point(ramp.distance + ramp.length, ramp.lateral + half), onRamp(ramp, 1, half), onRamp(ramp, 1, -half));
    // Exposed launch face: inset steel ribs articulate the solid volume.
    for (const lateral of [-2.3, -1.15, 0, 1.15, 2.3]) {
      const d = ramp.distance + ramp.length + .012;
      quad(trimBatch, point(d, ramp.lateral + lateral - .055, .08),
        point(d, ramp.lateral + lateral + .055, .08),
        point(d, ramp.lateral + lateral + .055, ramp.height - .09),
        point(d, ramp.lateral + lateral - .055, ramp.height - .09));
    }
    // Flush metal seams and inset traction ribs avoid a visual/physical step.
    for (let i = 1; i <= 9; i++) ribbon(trimBatch, ramp, i / 10, i / 10 + .0028, -half + .16, half - .16, .009);
    ribbon(trimBatch, ramp, .991, 1, -half, half, .012);
    for (const center of [.27, .5, .73]) {
      const a = center - .035, b = center + .035;
      quad(arrowBatch, onRamp(ramp, a, -1.12, .021), onRamp(ramp, b, 0, .021),
        onRamp(ramp, b - .024, 0, .021), onRamp(ramp, a - .024, -1.12, .021));
      quad(arrowBatch, onRamp(ramp, b, 0, .021), onRamp(ramp, a, 1.12, .021),
        onRamp(ramp, a - .024, 1.12, .021), onRamp(ramp, b - .024, 0, .021));
    }
  }
  for (const { name, mat, positions, indices } of batches.values()) {
    if (!positions.length) continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = `race3d-ramps-${name}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  let disposed = false;
  return {
    group, layout,
    update(time = 0) {
      if (!disposed) beacon.emissiveIntensity = 1.4 + Math.sin((Number(time) || 0) * 3) * .3;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(mat => mat.dispose());
      group.clear();
    }
  };
}

export default createRaceRamps;
