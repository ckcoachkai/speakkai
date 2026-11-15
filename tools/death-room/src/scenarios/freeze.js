import * as THREE from 'three';

/** Shared cold exposure: every student shivers, loses health, and gradually ices over. */
export default function createScenario(ctx) {
  const { group, actors, room = {} } = ctx;
  const halfWidth = room.halfWidth ?? 7;
  const halfDepth = room.halfDepth ?? 6;
  const floorY = room.floorY ?? 0;
  const highQuality = ctx.quality !== 'low';
  const resources = new Set();
  const own = resource => (resources.add(resource), resource);
  let seed = (Math.floor((ctx.random || Math.random)() * 4294967296) >>> 0) || 0x6d2b79f5;
  const random = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const material = options => own(new THREE.MeshStandardMaterial(options));
  const steel = material({ color: 0x637685, metalness: 0.78, roughness: 0.36 });
  const paleSteel = material({ color: 0xc1d1d8, metalness: 0.7, roughness: 0.31 });
  const dark = material({ color: 0x111e28, metalness: 0.65, roughness: 0.43 });
  const black = material({ color: 0x142027, roughness: 0.8 });
  const yellow = material({ color: 0xe5b94e, roughness: 0.56 });
  const copper = material({ color: 0x92745b, metalness: 0.78, roughness: 0.3 });
  const coolant = material({ color: 0x82e2ef, emissive: 0x28b8d0, emissiveIntensity: 0.45, metalness: 0.22, roughness: 0.24 });
  // Dense hoarfrost is a rough white solid, not a glass transmission shell.
  // No material here needs a second scene render for refraction.
  const ice = material({ color: 0xdcebf0, metalness: 0.015, roughness: 0.69,
    emissive: 0x122c33, emissiveIntensity: 0.035, flatShading: true });
  ice.customProgramCacheKey = () => 'freeze-opaque-rime-v6';
  ice.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vIceLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvIceLocal=position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vIceLocal;
        float iceHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float iceGrain=iceHash(floor(vIceLocal*174.));
        float iceBand=.5+.5*sin(vIceLocal.y*93.+sin(vIceLocal.x*29.)*.9+vIceLocal.z*13.);
        diffuseColor.rgb*=.82+iceGrain*.13+pow(iceBand,17.)*.05;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+iceGrain*.12-pow(iceBand,17.)*.21,.42,.92);
      `);
  };
  const unitBox = own(new THREE.BoxGeometry(1, 1, 1));
  const unitCylinder = own(new THREE.CylinderGeometry(1, 1, 1, 14));
  const unitRing = own(new THREE.TorusGeometry(1, 0.045, 6, 32));
  const boltGeometry = own(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 6));
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const temporary = new THREE.Object3D();
  const fanRotors = [];
  const addMesh = (geometry, mat, x, y, z, sx = 1, sy = 1, sz = 1, parent = group) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };
  const box = (mat, x, y, z, w, h, d, parent = group) => addMesh(unitBox, mat, x, y, z, w, h, d, parent);
  const ring = (mat, x, y, z, radius, parent = group) => addMesh(unitRing, mat, x, y, z, radius, radius, radius, parent);
  const pipe = (a, b, radius = 0.075, mat = steel, joints = true) => {
    direction.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const length = direction.length();
    const mesh = addMesh(unitCylinder, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, radius, length, radius);
    mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    if (joints) {
      for (const amount of [0.1, 0.9]) {
        const collar = addMesh(unitCylinder, paleSteel, a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount, radius * 1.42, 0.085, radius * 1.42);
        collar.quaternion.copy(mesh.quaternion);
      }
    }
    return mesh;
  };
  const bolt = (x, y, z) => {
    const mesh = addMesh(boltGeometry, paleSteel, x, y, z);
    mesh.rotation.x = Math.PI / 2;
  };
  const backZ = -halfDepth + 0.47;
  const cabinetX = halfWidth - 2.25;
  const ventSources = [];

  // High-mounted evaporator cassettes leave the floor and the entire front open.
  for (const sign of [-1, 1]) {
    const x = sign * cabinetX;
    const housing = box(steel, x, 4.75, backZ, 3.45, 1.72, 0.72);
    housing.castShadow = true;
    box(paleSteel, x, 5.60, backZ + 0.02, 3.56, 0.09, 0.79);
    box(paleSteel, x, 3.89, backZ + 0.02, 3.56, 0.09, 0.79);
    box(dark, x, 4.78, backZ + 0.373, 3.23, 1.40, 0.035);
    for (const side of [-1, 1]) {
      box(paleSteel, x + side * 1.69, 4.75, backZ + 0.39, 0.07, 1.72, 0.06);
      for (let j = 0; j < 5; j++) bolt(x + side * 1.64, 4.07 + j * 0.34, backZ + 0.44);
      const fanX = x + side * 0.82;
      const rotor = new THREE.Group();
      rotor.position.set(fanX, 4.83, backZ + 0.41);
      group.add(rotor);
      fanRotors.push({ rotor, direction: sign * side });
      for (let j = 0; j < 7; j++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = j * Math.PI * 2 / 7;
        rotor.add(bladePivot);
        const blade = box(paleSteel, 0.1, 0.29, 0, 0.2, 0.53, 0.035, bladePivot);
        blade.rotation.z = -0.27;
        blade.rotation.y = 0.28;
      }
      for (const radius of [0.19, 0.33, 0.47, 0.61]) ring(steel, fanX, 4.83, backZ + 0.48, radius);
      for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]) {
        const guard = box(paleSteel, fanX, 4.83, backZ + 0.49, 1.28, 0.018, 0.023);
        guard.rotation.z = angle;
      }
      const hub = addMesh(unitCylinder, dark, fanX, 4.83, backZ + 0.5, 0.12, 0.09, 0.12);
      hub.rotation.x = Math.PI / 2;
      ring(paleSteel, fanX, 4.83, backZ + 0.51, 0.64);
    }
    // Drain tray, adjustable louvers, luminous running indicator, warning strips.
    box(dark, x, 4.04, backZ + 0.43, 3.02, 0.21, 0.24);
    for (let j = 0; j < 13; j++) {
      const louver = box(steel, x - 1.43 + j * 0.238, 4.04, backZ + 0.57, 0.17, 0.17, 0.05);
      louver.rotation.x = -0.35;
    }
    box(coolant, x, 5.47, backZ + 0.425, 1.03, 0.034, 0.035);
    for (let j = 0; j < 9; j++) {
      const stripe = box(j % 2 ? black : yellow, x - 0.57 + j * 0.143, 3.90, backZ + 0.43, 0.145, 0.065, 0.025);
      stripe.rotation.z = -0.16;
    }
    ventSources.push([x - 0.65, 3.96, backZ + 0.66], [x + 0.65, 3.96, backZ + 0.66]);

    // A serviceable compressor skid: receiver, motor, lines, gauge, and shutoff wheel.
    const sx = sign * (halfWidth - 0.66);
    const sz = -halfDepth + 1.58;
    box(dark, sx, 0.14, sz, 1.08, 0.22, 1.96);
    for (const offset of [-0.43, 0.43]) {
      box(steel, sx + offset, 0.35, sz, 0.08, 0.56, 1.73);
      box(yellow, sx + offset, 0.39, sz + 0.9, 0.1, 0.25, 0.065);
    }
    addMesh(unitCylinder, paleSteel, sx, 0.95, sz - 0.31, 0.37, 1.24, 0.37);
    for (const y of [0.37, 0.58, 1.32, 1.55]) addMesh(unitCylinder, steel, sx, y, sz - 0.31, 0.39, 0.07, 0.39);
    const motor = addMesh(unitCylinder, dark, sx, 0.62, sz + 0.48, 0.31, 0.58, 0.31);
    motor.rotation.x = Math.PI / 2;
    for (let j = 0; j < 8; j++) {
      const fin = ring(steel, sx, 0.62, sz + 0.22 + j * 0.07, 0.32);
      fin.scale.z *= 0.6;
    }
    box(steel, sx, 1.17, sz + 0.48, 0.69, 0.40, 0.45);
    box(dark, sx, 1.18, sz + 0.72, 0.55, 0.29, 0.02);
    for (let j = 0; j < 4; j++) box(coolant, sx - 0.19 + j * 0.125, 1.18, sz + 0.74, 0.058, 0.11 + j * 0.025, 0.018);
    pipe([sx, 1.59, sz - 0.31], [sx, 3.36, sz - 0.31], 0.095);
    pipe([sx, 3.36, sz - 0.31], [x + sign * 1.36, 3.36, backZ + 0.05], 0.095);
    pipe([x + sign * 1.36, 3.36, backZ + 0.05], [x + sign * 1.36, 4.03, backZ + 0.05], 0.095);
    pipe([sx - sign * 0.27, 1.57, sz - 0.31], [sx - sign * 0.27, 2.77, sz - 0.31], 0.046, copper);
    pipe([sx - sign * 0.27, 2.77, sz - 0.31], [x, 2.77, backZ + 0.1], 0.046, copper);
    pipe([x, 2.77, backZ + 0.1], [x, 3.91, backZ + 0.1], 0.046, copper);
    const wheel = ring(yellow, sx, 2.05, sz - 0.14, 0.18);
    wheel.rotation.y = -sign * 0.2;
    for (const angle of [0, Math.PI / 3, Math.PI * 2 / 3]) {
      const spoke = box(yellow, sx, 2.05, sz - 0.14, 0.34, 0.027, 0.027);
      spoke.rotation.z = angle;
    }
    const dial = addMesh(unitCylinder, dark, sx - sign * 0.23, 1.79, sz + 0.12, 0.16, 0.07, 0.16);
    dial.rotation.x = Math.PI / 2;
    ring(paleSteel, sx - sign * 0.23, 1.79, sz + 0.165, 0.17);
    for (let j = 0; j < 9; j++) {
      const angle = (j / 8 * 1.5 + 0.75) * Math.PI;
      const tick = box(paleSteel, sx - sign * 0.23 + Math.cos(angle) * 0.119, 1.79 + Math.sin(angle) * 0.119, sz + 0.172, 0.026, 0.008, 0.008);
      tick.rotation.z = angle;
    }
    const needle = box(coolant, sx - sign * 0.23 + 0.025, 1.82, sz + 0.18, 0.09, 0.012, 0.012);
    needle.rotation.z = 0.9;
    ventSources.push([sx, 0.32, sz + 0.9]);
  }

  // Batch static refrigeration parts so bolts and panels stay inexpensive.
  const machineryBatches = [];
  const machineParts = new Map();
  for (const part of [...group.children]) {
    if (!part.isMesh || part.isInstancedMesh) continue;
    const key = `${part.geometry.uuid}:${part.material.uuid}:${part.castShadow}`;
    if (!machineParts.has(key)) machineParts.set(key, []);
    machineParts.get(key).push(part);
  }
  for (const parts of machineParts.values()) {
    const batch = new THREE.InstancedMesh(parts[0].geometry, parts[0].material, parts.length);
    batch.name = 'freeze-refrigeration-parts';
    batch.castShadow = parts[0].castShadow;
    batch.receiveShadow = true;
    for (let i = 0; i < parts.length; i++) {
      parts[i].updateMatrix();
      batch.setMatrixAt(i, parts[i].matrix);
      group.remove(parts[i]);
    }
    batch.instanceMatrix.needsUpdate = true;
    group.add(batch);
    machineryBatches.push(batch);
  }
  machineParts.clear();

  const dewMaterial = own(new THREE.MeshPhysicalMaterial({
    color: 0xc1e4ed, metalness: 0.1, roughness: 0.055,
    clearcoat: 1, clearcoatRoughness: 0.035, transparent: true, opacity: 0,
    depthWrite: false,
  }));
  const dewCount = highQuality ? 104 : 56;
  const dew = new THREE.InstancedMesh(own(new THREE.SphereGeometry(1, 6, 5)), dewMaterial, dewCount);
  dew.name = 'freeze-machine-condensation';
  for (let i = 0; i < dewCount; i++) {
    const sign = i % 2 ? -1 : 1;
    const droplet = 0.008 + random() * 0.012;
    temporary.position.set(sign * cabinetX + (random() * 2 - 1) * 1.6, 5.43 + random() * 0.12, backZ + 0.434);
    temporary.rotation.set(0, 0, 0);
    temporary.scale.set(droplet, droplet * (1.1 + random()), droplet * 0.6);
    temporary.updateMatrix();
    dew.setMatrixAt(i, temporary.matrix);
  }
  dew.instanceMatrix.needsUpdate = true;
  group.add(dew);

  const frostUniforms = { uProgress: { value: 0 }, uTime: { value: 0 } };
  const frostFragment = /* glsl */`
    uniform float uProgress;
    uniform float uTime;
    uniform float uWall;
    varying vec2 vUv;
    varying vec3 vFrostView;
    varying vec3 vFrostNormal;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
    }
    vec2 cells(vec2 p) {
      vec2 cell=floor(p),f=fract(p);
      float first=10.,second=10.;
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
        vec2 offset=vec2(float(x),float(y));
        vec2 point=offset+vec2(hash(cell+offset),hash(cell+offset+37.2))*.78+.11-f;
        float d=dot(point,point);
        if(d<first){second=first;first=d;}else{second=min(second,d);}
      }
      return vec2(sqrt(first),sqrt(second));
    }
    void main() {
      vec2 world=vUv*vec2(14.,12.);
      float detail = noise(world*3.7);
      float grain = hash(floor(world*145.));
      float edge = min(min(vUv.x,1.-vUv.x), min(vUv.y,1.-vUv.y));
      float advance = mix(edge, vUv.y*.64, uWall);
      float front = -.10 + .70*smoothstep(.015,.94,uProgress);
      float covered = 1.-smoothstep(front-.022,front+.035,advance+detail*.072);
      vec2 facet=cells(world*1.25+vec2(detail*.17));
      float crack=1.-smoothstep(.005,.036,facet.y-facet.x);
      vec2 sprig=fract(world*2.6)-.5;
      float armAngle=atan(sprig.y,sprig.x);
      float dendrite=pow(abs(cos(armAngle*3.)),48.)*(1.-smoothstep(.14,.46,length(sprig)));
      dendrite*=smoothstep(.32,.65,noise(floor(world*2.6)*.71));
      float rim=exp(-abs(advance+detail*.072-front)*105.)*.12;
      float facing=abs(dot(normalize(vFrostNormal),normalize(vFrostView)));
      float reflection=pow(1.-facing,3.)*(.04+facet.x*.07);
      // Dew collects just ahead of the freeze front, with a tiny offset glint.
      vec2 bead=fract(world*18.)-.5;
      float beadMask=1.-smoothstep(.065,.115,length(bead));
      float beadGlint=(1.-smoothstep(.012,.05,length(bead-vec2(-.03,.035))));
      float condensation=(1.-covered)*(1.-smoothstep(front,front+.12,advance+detail*.072))*smoothstep(.01,.14,uProgress);
      float rime=smoothstep(.40,.73,detail*.45+noise(world*8.3)*.35+noise(world*19.1)*.20);
      float alpha=covered*(.075+detail*.11+grain*.035+crack*.19+dendrite*.18+rime*.32+reflection*.4)+rim;
      alpha+=condensation*(beadMask*.065+beadGlint*.26);
      alpha *= smoothstep(.01,.12,uProgress) * mix(1.,.65,uWall);
      vec3 color=mix(vec3(.47,.66,.73),vec3(.89,.96,.98),clamp(crack*.63+dendrite*.4+rime*.75+grain*.08+beadGlint*.7,0.,1.));
      gl_FragColor = vec4(color, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  const frostMaterial = wall => own(new THREE.ShaderMaterial({
    uniforms: { ...frostUniforms, uWall: { value: wall ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vFrostView; varying vec3 vFrostNormal; void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vFrostView=-mv.xyz;vFrostNormal=normalMatrix*normal;gl_Position=projectionMatrix*mv;}',
    fragmentShader: frostFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  const floorFrost = addMesh(own(new THREE.PlaneGeometry(halfWidth * 2 - 0.18, halfDepth * 2 - 0.18)), frostMaterial(false), 0, floorY + 0.025, 0);
  floorFrost.rotation.x = -Math.PI / 2;
  floorFrost.renderOrder = 1;
  const wallMat = frostMaterial(true);
  addMesh(own(new THREE.PlaneGeometry(halfWidth * 2 - 0.18, 6.65)), wallMat, 0, 3.35, -halfDepth + 0.045);
  for (const sign of [-1, 1]) {
    const wall = addMesh(own(new THREE.PlaneGeometry(halfDepth * 2 - 0.25, 6.65)), wallMat, sign * (halfWidth - 0.045), 3.35, -0.04);
    wall.rotation.y = -sign * Math.PI / 2;
  }

  // Flat-shaded, irregular hexagonal prisms catch light as genuine solid ice facets.
  function crystalGeometry() {
    const positions = [];
    const radius = [0.76, 0.9, 0.7, 0.94, 0.77, 0.85];
    const point = (i, top) => {
      const angle = i / 6 * Math.PI * 2;
      return [Math.cos(angle) * radius[i] * (top ? 0.71 : 1), top ? 0.72 + (i % 2) * 0.06 : 0, Math.sin(angle) * radius[i] * (top ? 0.71 : 1)];
    };
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const a = point(i, false), b = point(j, false), c = point(j, true), d = point(i, true);
      positions.push(...a, ...d, ...b, ...b, ...d, ...c, ...d, 0.1, 1, -0.07, ...c, ...b, 0, 0, 0, ...a);
    }
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }
  const shardGeometry = crystalGeometry();
  const crystalCount = highQuality ? 420 : 250;
  const crystals = new THREE.InstancedMesh(shardGeometry, ice, crystalCount);
  crystals.name = 'freeze-growing-crystals';
  crystals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crystals.frustumCulled = false;
  group.add(crystals);
  const crystalData = [];
  const shardVertex = new THREE.Vector3();
  const crystalRoll = new THREE.Quaternion();
  const shardVertices = shardGeometry.getAttribute('position');
  for (let i = 0; i < crystalCount; i++) {
    const boundary = i < crystalCount * 0.66;
    const wall = i < crystalCount * 0.27;
    let x = (random() * 2 - 1) * (halfWidth - 0.3);
    let z = (random() * 2 - 1) * (halfDepth - 0.3);
    let y = floorY + 0.031;
    let rx = (random() - 0.5) * 0.48;
    let rz = (random() - 0.5) * 0.48;
    const side = i % 3;
    if (boundary) {
      if (side === 0) z = -halfDepth + 0.13 + random() * 0.6;
      else x = (side === 1 ? -1 : 1) * (halfWidth - 0.13 - random() * 0.6);
    }
    if (wall) {
      y = 0.1 + random() * 4.1;
      if (side === 0) z = -halfDepth + 0.026;
      else x = (side === 1 ? -1 : 1) * (halfWidth - 0.026);
    }
    // The open foreground remains sparse; interior shards stay below the knees.
    const height = wall ? 0.10 + random() * 0.30 : boundary ? 0.12 + random() * 0.51 : 0.035 + random() * 0.14;
    const width = height * (0.16 + random() * 0.2);
    const centerDistance = Math.min(halfWidth - Math.abs(x), halfDepth - Math.abs(z));
    const birth = wall ? 0.17 + y * 0.105 + random() * 0.15 : 0.07 + centerDistance * 0.09 + random() * 0.15;
    const ry = random() * Math.PI * 2;
    temporary.position.set(0, 0, 0);
    temporary.rotation.set(rx, ry, rz);
    if (wall) {
      direction.set(side === 0 ? 0 : side === 1 ? 1 : -1, 0, side === 0 ? 1 : 0);
      temporary.quaternion.setFromUnitVectors(up, direction).multiply(crystalRoll.setFromAxisAngle(up, ry));
    }
    temporary.scale.set(width, height, width);
    temporary.updateMatrix();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let vertex = 0; vertex < shardVertices.count; vertex++) {
      shardVertex.fromBufferAttribute(shardVertices, vertex).applyMatrix4(temporary.matrix);
      minX = Math.min(minX, shardVertex.x); maxX = Math.max(maxX, shardVertex.x);
      minY = Math.min(minY, shardVertex.y);
      minZ = Math.min(minZ, shardVertex.z); maxZ = Math.max(maxZ, shardVertex.z);
    }
    x = Math.max(-halfWidth - minX + 0.025, Math.min(halfWidth - maxX - 0.025, x));
    z = Math.max(-halfDepth - minZ + 0.025, Math.min(halfDepth - maxZ - 0.025, z));
    if (wall) y = Math.max(y, floorY - minY + 0.031);
    crystalData.push({ x, y, z, qx: temporary.quaternion.x, qy: temporary.quaternion.y, qz: temporary.quaternion.z, qw: temporary.quaternion.w,
      width, height, birth, footLift: wall ? 0 : Math.max(0, -minY) });
    temporary.position.set(x, y, z); temporary.scale.setScalar(0); temporary.updateMatrix();
    crystals.setMatrixAt(i, temporary.matrix);
  }
  crystals.instanceMatrix.needsUpdate = true;

  const snowCount = highQuality ? 1450 : 780;
  const snowPositions = new Float32Array(snowCount * 3);
  const snowSeeds = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (random() * 2 - 1) * (halfWidth - 0.24);
    snowPositions[i * 3 + 1] = random() * 6.6;
    snowPositions[i * 3 + 2] = (random() * 2 - 1) * (halfDepth - 0.24);
    snowSeeds[i * 3] = random(); snowSeeds[i * 3 + 1] = random(); snowSeeds[i * 3 + 2] = random();
  }
  const snowGeometry = own(new THREE.BufferGeometry());
  snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  snowGeometry.setAttribute('aSeed', new THREE.BufferAttribute(snowSeeds, 3));
  const snowUniforms = { uTime: { value: 0 }, uProgress: { value: 0 }, uHalfWidth: { value: halfWidth - 0.2 }, uHalfDepth: { value: halfDepth - 0.2 } };
  const snowMaterial = own(new THREE.ShaderMaterial({
    uniforms: snowUniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aSeed;
      uniform float uTime, uProgress, uHalfWidth, uHalfDepth;
      varying float vAlpha, vSpin, vStreak;
      varying vec2 vWind;
      void main() {
        vec3 p=position;
        float storm=smoothstep(.19,.86,uProgress);
        float gust=.73+.27*sin(uTime*.72);
        float speed=.18+storm*.74;
        // A shared forward/downward fan stream carries fine flakes in the same
        // direction; broad waves supply turbulence without independent jitter.
        p.z=mod(p.z+uTime*(.22+storm*1.65)+uHalfDepth,uHalfDepth*2.)-uHalfDepth;
        float wave=sin(p.z*.66-uTime*.94);
        p.x+=wave*storm*gust*.95+sin(p.y*.76+uTime*.63)*storm*.28;
        p.x=mod(p.x+uHalfWidth,uHalfWidth*2.)-uHalfWidth;
        p.y=mod(p.y-uTime*speed*(.65+aSeed.z*.48)+sin(p.z*.58-uTime*.42)*storm*.36,6.5)+.08;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        vec3 flow=vec3(cos(p.z*.66-uTime*.94)*storm*.58,-speed,.22+storm*1.65);
        vec4 next=projectionMatrix*modelViewMatrix*vec4(p+flow*.1,1.);
        vec2 delta=next.xy/next.w-gl_Position.xy/gl_Position.w;
        vWind=normalize(delta+vec2(.000001));
        gl_PointSize=clamp((3.+aSeed.y*7.)*(.75+storm*.25)*22./max(2.,-mv.z),1.,11.);
        float density=.045+storm*.86;
        vAlpha=(1.-smoothstep(density-.04,density,aSeed.x))*smoothstep(.04,.23,uProgress)*(.27+aSeed.z*.38);
        vSpin=aSeed.y*6.283+uTime*(aSeed.z-.5);
        vStreak=storm*(.5+aSeed.z*.5);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha,vSpin,vStreak;
      varying vec2 vWind;
      void main(){
        vec2 p=gl_PointCoord-.5;
        float r=length(p);
        float angle=atan(p.y,p.x)+vSpin;
        float core=1.-smoothstep(.025,.18,r);
        float arms=pow(abs(cos(angle*3.)),19.)*(1.-smoothstep(.1,.33,r));
        vec2 aligned=vec2(dot(p,vWind),dot(p,vec2(-vWind.y,vWind.x)));
        float streak=(1.-smoothstep(.055,.12,abs(aligned.y)))*(1.-smoothstep(.12,.46,abs(aligned.x)));
        float alpha=max(core,arms*.34)*(1.-vStreak*.5)+streak*vStreak*.46;
        alpha*=vAlpha;
        if(alpha<.015)discard;
        gl_FragColor=vec4(.82,.95,1.,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }));
  const snow = new THREE.Points(snowGeometry, snowMaterial);
  snow.frustumCulled = false;
  snow.renderOrder = 3;
  group.add(snow);

  const vaporCount = highQuality ? 112 : 64;
  const vaporPositions = new Float32Array(vaporCount * 3);
  const vaporSeeds = new Float32Array(vaporCount * 3);
  for (let i = 0; i < vaporCount; i++) {
    vaporPositions.set(ventSources[i % ventSources.length], i * 3);
    vaporSeeds.set([random(), random(), random()], i * 3);
  }
  const vaporGeometry = own(new THREE.BufferGeometry());
  vaporGeometry.setAttribute('position', new THREE.BufferAttribute(vaporPositions, 3));
  vaporGeometry.setAttribute('aSeed', new THREE.BufferAttribute(vaporSeeds, 3));
  const vaporMaterial = own(new THREE.ShaderMaterial({
    uniforms: snowUniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aSeed;
      uniform float uTime,uProgress,uHalfWidth,uHalfDepth;
      varying float vAlpha,vNoise;
      void main(){
        float life=fract(aSeed.x+uTime*(.09+aSeed.y*.045));
        float strength=smoothstep(.025,.72,uProgress);
        vec3 p=position;
        p.x+=sin(life*5.+aSeed.z*19.)*life*(.35+strength*.8);
        p.z+=life*(1.4+strength*2.6);
        p.y=max(.18,p.y-life*(3.6+aSeed.y)+sin(life*8.)*.15);
        p.x=clamp(p.x,-uHalfWidth,uHalfWidth);
        p.z=min(p.z,uHalfDepth);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp((.4+life*1.5)*750./max(3.,-mv.z),8.,180.);
        vAlpha=sin(life*3.14159)*strength*.045;
        vNoise=aSeed.y*9.+uTime*.08;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha,vNoise;
      void main(){
        vec2 p=gl_PointCoord-.5;
        float edge=1.-smoothstep(.12,.5,length(p));
        float cloud=.73+.27*sin(p.x*14.+vNoise)*cos(p.y*13.-vNoise);
        float a=edge*edge*cloud*vAlpha;
        if(a<.002)discard;
        gl_FragColor=vec4(.65,.86,.95,a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }));
  const vapor = new THREE.Points(vaporGeometry, vaporMaterial);
  vapor.frustumCulled = false;
  vapor.renderOrder = 2;
  group.add(vapor);

  // Small solid branches grow from actual animated mesh triangles. Continuous
  // surface frost belongs to the shared injury shader; there is no outer cage.
  const actorCapacity = 8;
  const anchorsPerActor = highQuality ? 24 : 14;
  const branchPositions = [];
  for (let twig = 0; twig < 5; twig++) {
    const angle = twig * Math.PI * 0.67;
    temporary.position.set(0, twig ? 0.2 + twig * 0.12 : 0, 0);
    temporary.rotation.set(twig ? Math.cos(angle) * 0.65 : 0, angle, twig ? Math.sin(angle) * 0.65 : 0);
    temporary.scale.set(twig ? 0.14 : 0.29, twig ? 0.48 : 1, twig ? 0.14 : 0.29);
    temporary.updateMatrix();
    for (let i = 0; i < shardVertices.count; i++) {
      shardVertex.fromBufferAttribute(shardVertices, i).applyMatrix4(temporary.matrix);
      branchPositions.push(shardVertex.x, shardVertex.y, shardVertex.z);
    }
  }
  const branchGeometry = own(new THREE.BufferGeometry());
  branchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(branchPositions, 3));
  branchGeometry.computeVertexNormals();
  const bodyIce = new THREE.InstancedMesh(branchGeometry, ice, actorCapacity * anchorsPerActor);
  bodyIce.name = 'freeze-attached-body-ice';
  bodyIce.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bodyIce.frustumCulled = false;
  bodyIce.receiveShadow = true;
  bodyIce.count = 0;
  group.add(bodyIce);
  const groundIce = new THREE.InstancedMesh(shardGeometry, ice, actorCapacity * 6 * 5);
  groundIce.name = 'freeze-grounded-deposits';
  groundIce.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  groundIce.frustumCulled = false;
  groundIce.receiveShadow = true;
  groundIce.count = 0;
  group.add(groundIce);
  const frostRecords = new Map();
  const meshA = new THREE.Vector3(), meshB = new THREE.Vector3(), meshC = new THREE.Vector3();
  const surfacePoint = new THREE.Vector3(), surfaceNormal = new THREE.Vector3(), surfaceEdge = new THREE.Vector3();
  const groupInverse = new THREE.Matrix4();
  const branchRoll = new THREE.Quaternion();

  const breathPositions = new Float32Array(actorCapacity * 3);
  const breathDirections = new Float32Array(actorCapacity * 3);
  const breathStrength = new Float32Array(actorCapacity);
  const breathPhase = Float32Array.from({ length: actorCapacity }, (_, i) => (i * 0.193) % 1);
  const breathGeometry = own(new THREE.BufferGeometry());
  breathGeometry.setAttribute('position', new THREE.BufferAttribute(breathPositions, 3).setUsage(THREE.DynamicDrawUsage));
  breathGeometry.setAttribute('aDirection', new THREE.BufferAttribute(breathDirections, 3).setUsage(THREE.DynamicDrawUsage));
  breathGeometry.setAttribute('aCold', new THREE.BufferAttribute(breathStrength, 1).setUsage(THREE.DynamicDrawUsage));
  breathGeometry.setAttribute('aPhase', new THREE.BufferAttribute(breathPhase, 1));
  breathGeometry.setDrawRange(0, 0);
  const breathMaterial = own(new THREE.ShaderMaterial({
    uniforms: snowUniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aDirection; attribute float aCold, aPhase;
      uniform float uTime; varying float vAlpha;
      void main(){
        float age=fract(uTime*.47+aPhase);
        vec3 p=position+aDirection*(.09+age*.41);
        p.y+=age*.08;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp((.085+age*.23)*620./max(2.,-mv.z),1.,72.);
        vAlpha=sin(age*3.14159)*(.025+aCold*.035);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha;
      void main(){vec2 p=gl_PointCoord-.5;float r=length(p*vec2(1.,1.22));float a=pow(1.-smoothstep(.08,.5,r),2.)*vAlpha;if(a<.002)discard;gl_FragColor=vec4(.72,.88,.95,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }
    `,
  }));
  const breath = new THREE.Points(breathGeometry, breathMaterial);
  breath.name = 'freeze-student-breath';
  breath.frustumCulled = false;
  breath.renderOrder = 3;
  group.add(breath);
  const headPosition = new THREE.Vector3();
  const freezingLight = new THREE.PointLight(0x98e6ff, 0, 15, 2);
  freezingLight.position.set(0, 4.2, -halfDepth + 1.2);
  freezingLight.castShadow = false;
  group.add(freezingLight);
  const freezingActors = new Set();
  let animationTime = 0;
  let reactionClock = 0;
  let damageClock = 0;
  let lastPhase = 'preview';
  let previousProgress = -1;
  let disposed = false;

  const isDying = actor => actor.alive === false || actor.action === 'fall' || actor.action === 'dead' || actor.health?.current === 0;
  const coldSeverity = (actor, p) => {
    const health = actor.health;
    const ratio = Number.isFinite(health?.ratio) ? health.ratio
      : Number.isFinite(health?.current) ? health.current / Math.max(1, health.max || 100) : null;
    // The fallback supplies visuals only when no health adapter was supplied.
    return ratio === null ? smooth(0.025, 0.98, p) * 0.78 : clamp(1 - ratio);
  };
  function readSurface(anchor) {
    const mesh = anchor.mesh;
    mesh.getVertexPosition(anchor.indices[0], meshA).applyMatrix4(mesh.matrixWorld);
    mesh.getVertexPosition(anchor.indices[1], meshB).applyMatrix4(mesh.matrixWorld);
    mesh.getVertexPosition(anchor.indices[2], meshC).applyMatrix4(mesh.matrixWorld);
    surfacePoint.copy(meshA).multiplyScalar(anchor.bary.x).addScaledVector(meshB, anchor.bary.y).addScaledVector(meshC, anchor.bary.z);
    surfaceEdge.subVectors(meshB, meshA);
    surfaceNormal.subVectors(meshC, meshA).crossVectors(surfaceEdge, surfaceNormal);
    const area = surfaceNormal.length();
    if (area < 1e-10) return false;
    surfaceNormal.multiplyScalar(1 / area);
    return true;
  }

  function makeFrostRecord(actor) {
    const record = { actor, anchors: [], meshes: [], skeletons: [], deposits: [], depositCursor: 0,
      nextDeposit: 0, frost: 0, freezeAmount: 0, attached: 0, grounded: 0, visible: false };
    if (!actor.root?.traverse) return record;
    actor.root.updateWorldMatrix(true, true);
    actor.root.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry?.attributes?.position || !mesh.getVertexPosition) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const name = `${mesh.name} ${materials.map(m => m?.name || '').join(' ')}`;
      if (/shadow|eye|lash|hair|head|face|number|patch|tear|mouth/i.test(name)) return;
      if (mesh.geometry.attributes.position.count < 80) return;
      record.meshes.push(mesh);
    });
    record.skeletons = [...new Set(record.meshes.map(m => m.skeleton).filter(Boolean))];
    for (const skeleton of record.skeletons) skeleton.update();
    const baseY = actor.position?.y || floorY;
    let faceLimit = baseY + 1.4;
    if (actor.headAnchor?.getWorldPosition) {
      actor.headAnchor.getWorldPosition(headPosition);
      faceLimit = Math.max(baseY + 1.1, headPosition.y - 0.29);
    }
    for (let attempt = 0; attempt < anchorsPerActor * 36 && record.anchors.length < anchorsPerActor && record.meshes.length; attempt++) {
      const mesh = record.meshes[Math.floor(random() * record.meshes.length)];
      const index = mesh.geometry.index, position = mesh.geometry.attributes.position;
      const triangle = Math.floor(random() * Math.floor((index ? index.count : position.count) / 3)) * 3;
      const indices = [0, 1, 2].map(i => index ? index.getX(triangle + i) : triangle + i);
      const r = Math.sqrt(random()), s = random();
      const anchor = { mesh, indices, bary: new THREE.Vector3(1 - r, r * (1 - s), r * s),
        birth: 0, size: 0.035 + random() * 0.035, roll: random() * Math.PI * 2 };
      if (!readSurface(anchor) || surfacePoint.y < baseY + 0.045 || surfacePoint.y > faceLimit) continue;
      const relativeHeight = surfacePoint.y - baseY;
      // Low legs frost first. The anchored shader covers the broader silhouette.
      const zone = record.anchors.length % 3;
      if (zone === 0 && relativeHeight > 0.59 || zone === 1 && (relativeHeight < 0.42 || relativeHeight > 1.12) || zone === 2 && relativeHeight < 0.95) continue;
      anchor.birth = 0.025 + relativeHeight * 0.20 + random() * 0.055;
      record.anchors.push(anchor);
    }
    return record;
  }

  function syncAttachments() {
    if (disposed) return;
    group.updateWorldMatrix(true, false);
    groupInverse.copy(group.matrixWorld).invert();
    let attached = 0, grounded = 0;
    for (const record of frostRecords.values()) {
      record.attached = record.grounded = 0;
      if (!record.visible || record.actor.invincible) continue;
      record.actor.root?.updateWorldMatrix?.(true, true);
      for (const skeleton of record.skeletons) skeleton.update();
      for (const anchor of record.anchors) {
        const growth = smooth(anchor.birth, anchor.birth + 0.30, record.frost);
        if (growth <= 0.002 || !readSurface(anchor)) continue;
        // Two millimetres of overlap joins the solid crystal base to skin/cloth.
        surfacePoint.addScaledVector(surfaceNormal, -0.002).applyMatrix4(groupInverse);
        surfaceNormal.transformDirection(groupInverse);
        temporary.position.copy(surfacePoint);
        temporary.quaternion.setFromUnitVectors(up, surfaceNormal).multiply(branchRoll.setFromAxisAngle(up, anchor.roll));
        temporary.scale.setScalar(anchor.size * growth);
        temporary.updateMatrix();
        bodyIce.setMatrixAt(attached++, temporary.matrix);
        record.attached++;
      }
      for (const deposit of record.deposits) {
        const growth = smooth(0, 0.8, animationTime - deposit.time) * (0.6 + record.frost * 0.4);
        for (let chip = 0; chip < 5; chip++) {
          const angle = chip * Math.PI * 0.4 + deposit.angle;
          const radius = chip ? 0.045 + chip * 0.008 : 0;
          temporary.position.set(deposit.x + Math.cos(angle) * radius, floorY + 0.027, deposit.z + Math.sin(angle) * radius);
          temporary.rotation.set(0, angle, 0);
          temporary.scale.set((0.055 + (chip % 2) * 0.025) * growth, (0.018 + (chip % 3) * 0.015) * growth, 0.058 * growth);
          temporary.updateMatrix();
          groundIce.setMatrixAt(grounded++, temporary.matrix);
          record.grounded++;
        }
      }
    }
    bodyIce.count = attached;
    groundIce.count = grounded;
    if (attached) bodyIce.instanceMatrix.needsUpdate = true;
    if (grounded) groundIce.instanceMatrix.needsUpdate = true;
  }

  function clearBodyFreeze() {
    for (const actor of freezingActors) actor.clearFreezing?.();
    freezingActors.clear();
    frostRecords.clear();
    bodyIce.count = groundIce.count = 0;
    breathGeometry.setDrawRange(0, 0);
  }

  function addFootDeposit(record, x, z, yaw) {
    if (record.deposits.length && Math.hypot(x - record.deposits[record.deposits.length - 1].centerX, z - record.deposits[record.deposits.length - 1].centerZ) < 0.10) return;
    for (const side of [-1, 1]) {
      const deposit = { x: x + Math.cos(yaw) * side * 0.115 + Math.sin(yaw) * 0.045,
        z: z - Math.sin(yaw) * side * 0.115 + Math.cos(yaw) * 0.045,
        centerX: x, centerZ: z, angle: random() * Math.PI * 2, time: animationTime };
      if (record.deposits.length < 6) record.deposits.push(deposit);
      else { record.deposits[record.depositCursor] = deposit; record.depositCursor = (record.depositCursor + 1) % 6; }
    }
  }

  return {
    update(dt, state = {}) {
      if (disposed) return;
      const paused = state.phase === 'paused' || state.paused === true;
      const step = !paused && Number.isFinite(dt) ? Math.max(0, Math.min(0.1, dt)) : 0;
      animationTime += step;
      const p = clamp(Number.isFinite(state.progress) ? state.progress : 0);
      const active = !paused && (state.phase === 'running' || state.phase === 'reveal');
      const showExposure = state.phase !== 'preview' && state.phase !== undefined;
      lastPhase = state.phase || 'preview';
      const storm = smooth(0.19, 0.86, p);
      frostUniforms.uProgress.value = p;
      frostUniforms.uTime.value = animationTime;
      snowUniforms.uTime.value = animationTime;
      snowUniforms.uProgress.value = p;
      coolant.emissiveIntensity = 0.35 + p * 1.15 + Math.sin(animationTime * 3) * 0.08;
      dewMaterial.opacity = smooth(0.025, 0.21, p) * (0.33 + p * 0.22);
      dewMaterial.roughness = 0.055 + smooth(0.27, 0.76, p) * 0.24;
      freezingLight.intensity = p * 8;
      for (const fan of fanRotors) fan.rotor.rotation.z = animationTime * fan.direction * (1.5 + storm * 12);
      if (Math.abs(previousProgress - p) > 0.0001) {
        for (let i = 0; i < crystalCount; i++) {
          const d = crystalData[i];
          const growth = smooth(d.birth, Math.min(0.99, d.birth + 0.27), p);
          temporary.position.set(d.x, d.y + d.footLift * growth, d.z);
          temporary.quaternion.set(d.qx, d.qy, d.qz, d.qw);
          temporary.scale.set(d.width * growth, d.height * growth, d.width * growth);
          temporary.updateMatrix();
          crystals.setMatrixAt(i, temporary.matrix);
        }
        crystals.instanceMatrix.needsUpdate = true;
        previousProgress = p;
      }
      // Identical ambient exposure for all students. Selection and fatal timing
      // live exclusively in the shared health system, never in this room.
      if ((!active && !paused) || p < 0.015) damageClock = 0;
      else if (active && step > 0) {
        damageClock += step;
        if (damageClock >= 0.099) {
          const exposureDt = damageClock;
          damageClock = 0;
          const rate = (3.9 + 5.4 * smooth(0.10, 0.90, p)) * smooth(0.015, 0.08, p);
          for (const actor of actors) {
            if (actor.invincible || isDying(actor)) continue;
            const position = actor.position || actor.root?.position;
            if (!position) continue;
            ctx.effects?.emit?.('damage', {
              actorId: actor.id, kind: 'cold', amount: rate * exposureDt,
              position: [position.x, (position.y || floorY) + 0.95, position.z],
              intensity: 0.18 + storm * 0.82, invincible: false,
            });
          }
        }
      }

      const frostOnset = showExposure ? smooth(0.025, 0.25, p) : 0;
      if (!showExposure || p < 0.015) clearBodyFreeze();
      for (const record of frostRecords.values()) record.visible = false;

      if ((!active && !paused) || p < 0.025) reactionClock = 0;
      else if (active) {
        reactionClock += step;
        if (reactionClock >= 0.36) {
          reactionClock %= 0.36;
          for (const actor of actors) {
            if (actor.invincible || isDying(actor)) continue;
            const frozen = frostRecords.get(actor.id)?.freezeAmount || 0;
            if (frozen >= 0.98) continue;
            const intensity = clamp(0.18 + storm * 0.12 + coldSeverity(actor, p) * 0.72) * (1 - frozen * 0.8);
            actor.setReaction?.('shiver', intensity, 0.62);
          }
        }
      }

      let exposed = 0;
      let breathCount = 0;
      if (frostOnset > 0) {
        for (const actor of actors) {
          const chosen = state.victimIds?.has(actor.id);
          if (exposed >= actorCapacity || actor.invincible || (actor.alive === false && !chosen)) continue;
          const position = actor.position || actor.root?.position;
          if (!position) continue;
          const x = position.x, z = position.z;
          const y = Math.max(floorY, position.y || floorY);
          const severity = coldSeverity(actor, p);
          const yaw = actor.root?.rotation?.y || 0;
          let record = frostRecords.get(actor.id);
          if (!record || record.actor !== actor) {
            if (record) { record.actor.clearFreezing?.(); freezingActors.delete(record.actor); }
            record = makeFrostRecord(actor);
            frostRecords.set(actor.id, record);
          }
          record.visible = true;
          record.frost = frostOnset * clamp(0.18 + severity * 0.78 + smooth(0.55, 0.98, p) * 0.15);
          record.freezeAmount = actor.health?.current === 0 ? 1 : Math.max(
            smooth(0.05, 0.98, p) * (0.86 + severity * 0.14), smooth(0.88, 0.985, p));
          if (active && step > 0 && actor.alive !== false) {
            actor.setFreezing?.(record.freezeAmount);
            freezingActors.add(actor);
          }
          if (active && step > 0 && record.frost > 0.25 && animationTime >= record.nextDeposit) {
            addFootDeposit(record, x, z, yaw);
            record.nextDeposit = animationTime + 0.8;
          }
          if (!isDying(actor) && record.freezeAmount < 0.995) {
            if (actor.headAnchor?.getWorldPosition) actor.headAnchor.getWorldPosition(headPosition);
            else headPosition.set(x, y + 1.64, z);
            breathPositions[breathCount * 3] = headPosition.x + Math.sin(yaw) * 0.14;
            breathPositions[breathCount * 3 + 1] = headPosition.y - 0.065;
            breathPositions[breathCount * 3 + 2] = headPosition.z + Math.cos(yaw) * 0.14;
            breathDirections[breathCount * 3] = Math.sin(yaw);
            breathDirections[breathCount * 3 + 1] = 0;
            breathDirections[breathCount * 3 + 2] = Math.cos(yaw);
            breathStrength[breathCount] = frostOnset * (0.15 + severity * 0.85);
            breathCount++;
          }
          exposed++;
        }
      }
      breathGeometry.setDrawRange(0, breathCount);
      if (breathCount) {
        breathGeometry.attributes.position.needsUpdate = true;
        breathGeometry.attributes.aDirection.needsUpdate = true;
        breathGeometry.attributes.aCold.needsUpdate = true;
      }
    },
    // Call after characters.update so deposits follow the current skinned pose.
    syncAttachments,
    get stats() {
      return Object.freeze({ phase: lastPhase, attachmentMode: 'skinned-surface',
        bodyIceCount: bodyIce.count, groundIceCount: groundIce.count,
        materialOpacity: ice.opacity, transmission: 0,
        actors: Object.freeze([...frostRecords.values()].filter(record => record.visible).map(record => Object.freeze({
          id: record.actor.id, frost: record.frost, freezeAmount: record.freezeAmount,
          attached: record.attached, grounded: record.grounded, surfaceAnchors: record.anchors.length,
        }))),
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearBodyFreeze();
      group.clear();
      for (const batch of machineryBatches) batch.dispose();
      dew.dispose();
      crystals.dispose();
      bodyIce.dispose();
      groundIce.dispose();
      for (const resource of resources) resource.dispose();
      resources.clear();
    },
  };
}
