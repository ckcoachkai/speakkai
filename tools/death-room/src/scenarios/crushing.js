import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** A pair of hydraulic presses closes the rear chamber, leaving a front refuge. */
export default function createScenario(ctx) {
  const { group, room, actors = [], quality } = ctx;
  const halfWidth = room?.halfWidth ?? 7;
  const halfDepth = room?.halfDepth ?? 6;
  const floorY = room?.floorY ?? 0;
  const ceiling = room?.height ?? 7;
  const height = Math.min(6.25, ceiling - 0.5);
  const rearZ = -halfDepth + 0.2;
  const frontZ = halfDepth - 3.45;
  const length = frontZ - rearZ;
  const centerZ = (frontZ + rearZ) / 2;
  const initialFace = halfWidth - 0.9;
  const anchorX = halfWidth - 0.08;
  const resources = { geometries: new Set(), materials: new Set(), textures: new Set() };
  const owned = new THREE.Group();
  owned.name = 'Crushing hydraulic chamber';
  group.add(owned);
  let seed = 0x72a18b3d;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const geom = (g) => { resources.geometries.add(g); return g; };
  const material = (opts) => {
    const m = new THREE.MeshStandardMaterial(opts);
    resources.materials.add(m);
    return m;
  };
  const texture = (t) => { resources.textures.add(t); return t; };
  const metalPixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const mottling = Math.sin(x * 0.13 + Math.cos(y * 0.08) * 3) * Math.sin(y * 0.11);
      const rust = Math.max(0, mottling - 0.56) * 0.3;
      const n = random() * 14 + 144 + Math.sin(y * 1.83) * 3;
      metalPixels[i] = n + rust * 45;
      metalPixels[i + 1] = n - rust * 12;
      metalPixels[i + 2] = n - rust * 35;
      metalPixels[i + 3] = 255;
    }
  }
  const steelMap = texture(new THREE.DataTexture(metalPixels, 128, 128));
  steelMap.colorSpace = THREE.SRGBColorSpace;
  steelMap.wrapS = steelMap.wrapT = THREE.RepeatWrapping;
  steelMap.magFilter = THREE.LinearFilter;
  steelMap.minFilter = THREE.LinearMipmapLinearFilter;
  steelMap.generateMipmaps = true;
  steelMap.needsUpdate = true;
  const stripePixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      const yellow = (x + y) % 64 < 32;
      const wear = 0.83 + random() * 0.17;
      stripePixels[i] = (yellow ? 227 : 22) * wear;
      stripePixels[i + 1] = (yellow ? 160 : 25) * wear;
      stripePixels[i + 2] = (yellow ? 30 : 26) * wear;
      stripePixels[i + 3] = 255;
    }
  }
  const stripeMap = texture(new THREE.DataTexture(stripePixels, 64, 64));
  stripeMap.colorSpace = THREE.SRGBColorSpace;
  stripeMap.wrapS = stripeMap.wrapT = THREE.RepeatWrapping;
  stripeMap.magFilter = THREE.LinearFilter;
  stripeMap.needsUpdate = true;

  const steel = material({ color: 0x657b85, map: steelMap, bumpMap: steelMap, bumpScale: 0.009, roughness: 0.65, metalness: 0.75 });
  const plate = material({ color: 0x9ba8ab, map: steelMap, bumpMap: steelMap, bumpScale: 0.008, roughness: 0.47, metalness: 0.82 });
  const dark = material({ color: 0x202b30, roughness: 0.82, metalness: 0.68 });
  const trim = material({ color: 0x5a6870, roughness: 0.47, metalness: 0.88 });
  const chrome = material({ color: 0xb8c7d0, roughness: 0.23, metalness: 0.95 });
  const bronze = material({ color: 0x967447, roughness: 0.48, metalness: 0.82 });
  const rubber = material({ color: 0x12171b, roughness: 0.96, metalness: 0.05 });
  const caution = material({ color: 0xffffff, map: stripeMap, roughness: 0.8, metalness: 0.33 });
  const glow = material({ color: 0x961c0c, emissive: 0xff2b08, emissiveIntensity: 1.5, roughness: 0.32 });
  const safe = material({ color: 0x17544b, emissive: 0x1ed6af, emissiveIntensity: 0.8, roughness: 0.45 });
  const gaugeFace = material({ color: 0x0b1114, roughness: 0.7 });
  const gaugeMark = material({ color: 0xc1c5b9, roughness: 0.8 });
  const boxGeometry = geom(new THREE.BoxGeometry(1, 1, 1));
  const cylinderGeometry = geom(new THREE.CylinderGeometry(1, 1, 1, 16));
  const sphereGeometry = geom(new THREE.SphereGeometry(1, 16, 10));
  const boltGeometry = geom(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 6));
  const dummy = new THREE.Object3D();

  function box(parent, mat, sx, sy, sz, x, y, z) {
    const mesh = new THREE.Mesh(boxGeometry, mat);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, floorY + y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, mat, radius, span, x, y, z, axis = 'y') {
    const mesh = new THREE.Mesh(cylinderGeometry, mat);
    mesh.scale.set(radius, span, radius);
    mesh.position.set(x, floorY + y, z);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function stripePlane(parent, width, tall, x, y, z, rotationY = 0) {
    const geometry = geom(new THREE.PlaneGeometry(width, tall));
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width * 2, uv.getY(i) * tall * 2);
    const mesh = new THREE.Mesh(geometry, caution);
    mesh.position.set(x, floorY + y, z);
    mesh.rotation.y = rotationY;
    parent.add(mesh);
    return mesh;
  }

  // The apron remains open to the camera and gives surviving people a refuge.
  box(owned, dark, halfWidth * 2 - 0.1, 0.028, 0.20, 0, 0.016, frontZ + 0.33);
  for (let i = 0; i < 24; i++) {
    box(owned, caution, 0.3, 0.012, 0.18, -halfWidth + 0.32 + i * (halfWidth * 2 - 0.64) / 23, 0.036, frontZ + 0.33);
  }
  for (const side of [-1, 1]) {
    for (let j = 0; j < 3; j++) {
      const arrow = box(owned, safe, 0.08, 0.014, 0.40, side * 3.5, 0.026, frontZ + 0.78 + j * 0.43);
      arrow.rotation.y = side * 0.65;
    }
  }
  // hideWalls also hides the stock back wall in the host, so the press needs
  // its own closed rear enclosure instead of an opening into black space.
  box(owned, dark, halfWidth * 2, height + 0.15, 0.18, 0, height / 2 + 0.02, rearZ - 0.24);
  for (let bay = 0; bay < 4; bay++) {
    const x = -halfWidth + (bay + 0.5) * halfWidth / 2;
    box(owned, steel, halfWidth / 2 - 0.14, height - 0.45, 0.045, x, height / 2, rearZ - 0.129);
    for (let slat = 0; slat < 6; slat++) box(owned, dark, halfWidth / 2 - 0.50, 0.045, 0.028, x, height - 1.1 - slat * 0.13, rearZ - 0.092);
  }
  for (let rib = 0; rib <= 4; rib++) box(owned, trim, 0.12, height + 0.1, 0.12, -halfWidth + rib * halfWidth / 2, height / 2, rearZ - 0.14);
  for (const y of [0.28, 3.05, height - 0.13]) box(owned, trim, halfWidth * 2, 0.13, 0.12, 0, y, rearZ - 0.14);
  // Recessed rail channels continue beneath the moving banks.
  for (const z of [rearZ + 1.2, frontZ - 0.85]) {
    box(owned, rubber, halfWidth * 2, 0.045, 0.33, 0, 0.026, z);
    for (const offset of [-0.13, 0.13]) box(owned, chrome, halfWidth * 2, 0.065, 0.035, 0, 0.044, z + offset);
    for (let i = 0; i < 22; i++) box(owned, trim, 0.065, 0.035, 0.17, -halfWidth + 0.32 + i * (halfWidth * 2 - 0.64) / 21, 0.057, z);
    box(owned, dark, halfWidth * 2, 0.20, 0.28, 0, height + 0.23, z);
    box(owned, chrome, halfWidth * 2, 0.055, 0.16, 0, height + 0.10, z);
  }

  const banks = [];
  const hydraulic = [];
  const needles = [];
  const beaconLights = [];
  const sleeveLength = 0.72;
  const sleeveCount = 10;
  const collarMesh = new THREE.InstancedMesh(cylinderGeometry, bronze, 8 * sleeveCount);
  collarMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  collarMesh.castShadow = true;
  collarMesh.frustumCulled = false;
  owned.add(collarMesh);
  const panelGeometry = geom(new RoundedBoxGeometry(0.075, 2.68, length / 5 - 0.26, 2, 0.025));
  for (const side of [-1, 1]) {
    // Stationary load frame with footings and rear enclosure.
    for (const z of [rearZ + 0.15, frontZ - 0.12]) {
      box(owned, dark, 0.24, height + 0.4, 0.34, side * anchorX, (height + 0.4) / 2, z);
      box(owned, steel, 0.70, 0.18, 0.72, side * (anchorX - 0.18), 0.09, z);
      box(owned, trim, 0.37, 0.16, 0.53, side * (anchorX - 0.03), height + 0.32, z);
    }
    box(owned, dark, 0.13, height + 0.08, length, side * (halfWidth + 0.03), height / 2, centerZ);
    const bank = new THREE.Group();
    bank.position.x = side * initialFace;
    bank.name = side < 0 ? 'Left moving press' : 'Right moving press';
    bank.userData.frontZ = frontZ;
    owned.add(bank);
    banks.push({ bank, side });
    box(bank, dark, 0.72, height, length, side * 0.36, height / 2 + 0.08, centerZ);
    box(bank, trim, 0.80, 0.20, length + 0.12, side * 0.36, 0.19, centerZ);
    box(bank, trim, 0.80, 0.20, length + 0.12, side * 0.36, height - 0.02, centerZ);
    const modules = 5;
    const moduleLength = length / modules;
    const boltPositions = [];
    for (let j = 0; j < modules; j++) {
      const z = rearZ + moduleLength * (j + 0.5);
      box(bank, steel, 0.14, height - 0.43, moduleLength - 0.055, -side * 0.015, height / 2 + 0.07, z);
      // Two stamped steel panels per bay, inset inside thick perimeter ribs.
      for (let k = 0; k < 2; k++) {
        const y = 1.63 + k * 2.92;
        const panel = new THREE.Mesh(panelGeometry, plate);
        panel.position.set(-side * 0.104, floorY + y, z);
        panel.castShadow = panel.receiveShadow = true;
        bank.add(panel);
        box(bank, dark, 0.016, 0.026, moduleLength - 0.33, -side * 0.138, y - 1.20, z);
        for (const dz of [-moduleLength / 2 + 0.19, moduleLength / 2 - 0.19]) {
          for (const dy of [-1.21, 0, 1.21]) boltPositions.push([-side * 0.15, y + dy, z + dz]);
        }
      }
      for (const dz of [-moduleLength / 2 + 0.065, moduleLength / 2 - 0.065]) {
        box(bank, trim, 0.16, height - 0.27, 0.10, -side * 0.115, height / 2 + 0.06, z + dz);
      }
      box(bank, trim, 0.17, 0.13, moduleLength - 0.12, -side * 0.12, 3.08, z);
      // Vent slots and scuffed weld seams break up the large metal faces.
      for (let k = 0; k < 6; k++) {
        box(bank, dark, 0.02, 0.035, 0.68, -side * 0.146, height - 0.75 - k * 0.085, z);
      }
      for (let k = 0; k < 4; k++) {
        const scar = box(bank, trim, 0.009, 0.012, 0.18 + random() * 0.55, -side * 0.149, 0.55 + random() * 3.9, z + (random() - 0.5) * 0.8);
        scar.rotation.x = (random() - 0.5) * 0.17;
      }
    }
    const bolts = new THREE.InstancedMesh(boltGeometry, bronze, boltPositions.length);
    for (let i = 0; i < boltPositions.length; i++) {
      dummy.position.set(boltPositions[i][0], floorY + boltPositions[i][1], boltPositions[i][2]);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bolts.setMatrixAt(i, dummy.matrix);
    }
    bolts.castShadow = true;
    bank.add(bolts);

    // The front end of each bank is a narrow, highly readable safety cap.
    box(bank, dark, 0.80, height + 0.02, 0.14, side * 0.36, height / 2 + 0.05, frontZ + 0.015);
    stripePlane(bank, 0.66, height - 0.20, side * 0.36, height / 2 + 0.05, frontZ + 0.091);
    stripePlane(bank, length - 0.15, 0.19, -side * 0.20, 0.44, centerZ, side < 0 ? Math.PI / 2 : -Math.PI / 2);
    stripePlane(bank, length - 0.15, 0.15, -side * 0.20, height - 0.30, centerZ, side < 0 ? Math.PI / 2 : -Math.PI / 2);
    box(bank, dark, 0.57, 0.64, 0.055, side * 0.36, 4.36, frontZ + 0.12);
    const ring = new THREE.Mesh(geom(new THREE.TorusGeometry(0.225, 0.026, 8, 32)), trim);
    ring.position.set(side * 0.36, floorY + 4.36, frontZ + 0.16);
    bank.add(ring);
    const face = new THREE.Mesh(geom(new THREE.CircleGeometry(0.205, 32)), gaugeFace);
    face.position.set(side * 0.36, floorY + 4.36, frontZ + 0.163);
    bank.add(face);
    for (let j = 0; j < 9; j++) {
      const angle = -2.25 + j * 4.5 / 8;
      const tick = box(bank, gaugeMark, 0.014, 0.037, 0.008, side * 0.36 + Math.sin(angle) * 0.169, 4.36 + Math.cos(angle) * 0.169, frontZ + 0.173);
      tick.rotation.z = -angle;
    }
    const needlePivot = new THREE.Group();
    needlePivot.position.set(side * 0.36, floorY + 4.36, frontZ + 0.183);
    const needle = new THREE.Mesh(boxGeometry, glow);
    needle.scale.set(0.014, 0.16, 0.012);
    needle.position.y = 0.065;
    needlePivot.add(needle);
    bank.add(needlePivot);
    needles.push(needlePivot);
    box(bank, dark, 0.56, 0.32, 0.12, side * 0.36, 5.39, frontZ + 0.14);
    for (let j = 0; j < 3; j++) {
      const lens = new THREE.Mesh(sphereGeometry, glow);
      lens.scale.set(0.064, 0.083, 0.036);
      lens.position.set(side * 0.36 - 0.17 + j * 0.17, floorY + 5.39, frontZ + 0.22);
      bank.add(lens);
    }
    cylinder(bank, dark, 0.19, 0.08, side * 0.36, height + 0.11, frontZ - 0.3);
    const dome = new THREE.Mesh(sphereGeometry, glow);
    dome.scale.set(0.155, 0.19, 0.155);
    dome.position.set(side * 0.36, floorY + height + 0.24, frontZ - 0.3);
    bank.add(dome);
    const beacon = new THREE.PointLight(0xff3813, 9, 5.2, 2);
    beacon.position.set(-side * 0.43, floorY + height - 0.3, frontZ + 0.18);
    bank.add(beacon);
    beaconLights.push(beacon);

    for (const z of [rearZ + 1.2, frontZ - 0.85]) {
      for (const y of [1.32, height - 1.32]) {
        cylinder(owned, bronze, 0.34, 0.10, side * anchorX, y, z, 'x');
        // Fixed-length nested sleeves slide out of each other. Their diameters
        // and lengths never stretch as the ram extends.
        const stages = [];
        for (let k = 0; k < sleeveCount; k++) {
          const radius = 0.29 - k * 0.019;
          stages.push(cylinder(owned, k === 0 ? steel : chrome, radius, sleeveLength, side * anchorX, y, z, 'x'));
        }
        hydraulic.push({ side, y, z, stages });
        box(bank, dark, 0.18, 0.67, 0.64, side * 0.80, y, z);
        cylinder(bank, bronze, 0.26, 0.16, side * 0.87, y, z, 'x');
      }
      // Rolling shoes above and below the face follow their guide rails.
      box(bank, dark, 0.84, 0.25, 0.54, side * 0.37, 0.17, z);
      box(bank, dark, 0.84, 0.22, 0.54, side * 0.37, height + 0.12, z);
    }
    // Flexible black hoses and ringed supply pipes travel with the press.
    const hosePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.80, floorY + 1.45, frontZ - 1.1),
      new THREE.Vector3(side * 0.99, floorY + 2.0, frontZ - 0.8),
      new THREE.Vector3(side * 0.98, floorY + 3.8, frontZ - 0.8),
      new THREE.Vector3(side * 0.80, floorY + height - 1.45, frontZ - 1.1),
    ]);
    const hose = new THREE.Mesh(geom(new THREE.TubeGeometry(hosePath, 24, 0.05, 8, false)), rubber);
    bank.add(hose);
    cylinder(bank, bronze, 0.045, height - 2, side * 0.82, height / 2, rearZ + 0.55);
    for (let j = 0; j < 7; j++) cylinder(bank, trim, 0.068, 0.07, side * 0.82, 1.1 + j * (height - 2.2) / 6, rearZ + 0.55);
  }

  const particleCount = quality === 'low' ? 64 : 132;
  const particlePosition = new Float32Array(particleCount * 3);
  const particleColor = new Float32Array(particleCount * 3);
  const particleFade = new Float32Array(particleCount);
  const particleData = new Float32Array(particleCount * 5);
  for (let i = 0; i < particleCount; i++) {
    const k = i * 5;
    particleData[k] = random();
    particleData[k + 1] = random();
    particleData[k + 2] = random();
    particleData[k + 3] = random();
    particleData[k + 4] = random();
    const tone = 0.13 + random() * 0.075;
    particleColor[i * 3] = tone;
    particleColor[i * 3 + 1] = tone * 0.87;
    particleColor[i * 3 + 2] = tone * 0.73;
  }
  const dustPixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const radius = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
      const i = (y * 32 + x) * 4;
      dustPixels[i] = dustPixels[i + 1] = dustPixels[i + 2] = 255;
      dustPixels[i + 3] = Math.pow(Math.max(0, 1 - radius), 2) * 205;
    }
  }
  const dustMap = texture(new THREE.DataTexture(dustPixels, 32, 32));
  dustMap.magFilter = THREE.LinearFilter;
  dustMap.needsUpdate = true;
  const dustGeometry = geom(new THREE.BufferGeometry());
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(particlePosition, 3).setUsage(THREE.DynamicDrawUsage));
  dustGeometry.setAttribute('color', new THREE.BufferAttribute(particleColor, 3));
  dustGeometry.setAttribute('lifeFade', new THREE.BufferAttribute(particleFade, 1).setUsage(THREE.DynamicDrawUsage));
  const dustMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, vertexColors: true,
    uniforms: { opacity: { value: 0 }, size: { value: 0.8 }, dustMap: { value: dustMap } },
    vertexShader: `attribute float lifeFade; varying float vFade; varying vec3 vColor;
      uniform float size; void main(){vFade=lifeFade; vColor=color;
      vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
      gl_PointSize=clamp(size*550.0/max(0.1,-viewPosition.z),1.0,100.0);
      gl_Position=projectionMatrix*viewPosition;}`,
    fragmentShader: `uniform sampler2D dustMap; uniform float opacity;
      varying float vFade; varying vec3 vColor;
      void main(){vec2 p=gl_PointCoord*2.0-1.0;
      float wisps=0.73+0.27*sin(p.x*13.0+p.y*7.0)*sin(p.y*11.0-p.x*4.0);
      float alpha=texture2D(dustMap,gl_PointCoord).a*opacity*vFade*wisps;
      if(alpha<0.003)discard;gl_FragColor=vec4(vColor,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  resources.materials.add(dustMaterial);
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  owned.add(dust);

  // Short ballistic streaks originate at the actual guide shoes, not across
  // the whole room. The scrapes remain after each moving bank has passed.
  const railZs = [rearZ + 1.2, frontZ - 0.85];
  const scrapeMaterial = material({ color: 0x827968, metalness: 0.86, roughness: 0.26 });
  const scrapes = [];
  for (const side of [-1, 1]) for (const z of railZs) {
    const scrape = box(owned, scrapeMaterial, 0.01, 0.008, 0.045, side * initialFace, 0.084, z);
    scrape.castShadow = false;
    scrapes.push({ mesh: scrape, side });
  }
  const sparkCount = quality === 'low' ? 24 : 60;
  const sparkPositions = new Float32Array(sparkCount * 6);
  const sparkColors = new Float32Array(sparkCount * 6);
  const sparkSeeds = Float32Array.from({ length: sparkCount * 4 }, random);
  const sparkGeometry = geom(new THREE.BufferGeometry());
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3).setUsage(THREE.DynamicDrawUsage));
  sparkGeometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3).setUsage(THREE.DynamicDrawUsage));
  const sparkMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  resources.materials.add(sparkMaterial);
  const sparks = new THREE.LineSegments(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  owned.add(sparks);
  const chips = new THREE.InstancedMesh(geom(new THREE.DodecahedronGeometry(0.045, 0)), steel, 24);
  const chipSeeds = Float32Array.from({ length: 24 * 4 }, random);
  chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  chips.castShadow = true;
  chips.frustumCulled = false;
  owned.add(chips);

  let lastElapsed = -1;
  let nextActorCommand = -1;
  let nextReaction = -1;
  let effectTime = 0;
  let facePosition = initialFace;
  let previousPhase = 'preview';
  const survivorSlots = new Map();
  const chamberSlots = new Map();
  const caughtPositions = new Map();
  const impactedActors = new Set();
  let rushStartedAt = null;
  let rushStartProgress = null;
  let roundDuration = 20;
  let releaseProgress = 0.865;
  let survivorsClear = false;
  const impacts = [
    { face: initialFace - (initialFace - 0.24) * 0.38 + 0.015, at: -1000, armed: true },
    { face: initialFace - (initialFace - 0.24) * 0.88 + 0.015, at: -1000, armed: true },
    { face: 0.255, at: -1000, armed: true },
  ];
  let disposed = false;
  function update(dt, state = {}) {
    if (disposed) return;
    const p = clamp(Number.isFinite(state.progress) ? state.progress : 0, 0, 1);
    const elapsed = Number.isFinite(state.elapsed) ? state.elapsed : 0;
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const phase = state.phase || 'preview';
    if (elapsed < lastElapsed - 0.01 || (phase === 'preview' && previousPhase !== 'preview')) {
      effectTime = elapsed;
      nextActorCommand = nextReaction = -1;
      survivorSlots.clear();
      chamberSlots.clear();
      caughtPositions.clear();
      impactedActors.clear();
      rushStartedAt = null;
      rushStartProgress = null;
      survivorsClear = false;
      facePosition = initialFace;
      for (const impact of impacts) { impact.at = -1000; impact.armed = true; }
    }
    previousPhase = phase;
    lastElapsed = elapsed;
    // Reveal deliberately freezes state.elapsed in the game. This local clock
    // lets evacuation, pressure release and settling finish during that phase.
    if (step > 0) effectTime = Math.max(effectTime + step, elapsed);
    const time = effectTime;
    const victims = state.victimIds;
    const victim = (actor) => !actor.invincible && (victims?.has(actor.id) ?? actor.isVictim);
    const active = phase === 'running' || phase === 'reveal';
    if (Number.isFinite(state.duration) && state.duration > 0) roundDuration = state.duration;
    else if (phase === 'running' && p > 0 && elapsed > 0) roundDuration = elapsed / p;
    // Longer experiments must still escape at the last second, rather than
    // granting a twenty-percent head start that becomes six whole seconds.
    releaseProgress = Math.max(0.78, 1 - 2.7 / Math.max(1, roundDuration));
    const rushing = active && (p >= releaseProgress || phase === 'reveal');
    if (rushing && rushStartedAt === null) {
      rushStartedAt = time;
      rushStartProgress = p;
    }
    const rushAge = rushStartedAt === null ? 0 : time - rushStartedAt;
    // Most travel happens with the whole group still inside. The final stroke
    // cannot run ahead of real evacuation, including a ten-second round/Skip.
    const travel = 0.28 * smooth(0.10, 0.43, p)
      + 0.48 * smooth(0.43, 0.78, p) + 0.24 * smooth(0.84, 0.995, p);
    const requestedFace = initialFace - (initialFace - 0.24) * travel;
    let clearance = 0.24;
    // A hydraulic interlock follows living people until their shoulders clear
    // the front caps. It also makes immediate Reveal safe without teleporting.
    survivorsClear = true;
    if (active || phase === 'preview') {
      for (const actor of actors) {
        if (actor.alive === false || !actor.position) continue;
        const inside = actor.position.z < frontZ + 0.72;
        if (inside && !victim(actor)) survivorsClear = false;
        const caughtLate = victim(actor) && rushing && p >= 0.94 && rushAge >= 1.2;
        if (inside && !caughtLate) {
          // Include one frame of lateral movement and the inward panel ribs.
          const lateralLead = Math.abs(actor._vx || 0) * step;
          clearance = Math.max(clearance, Math.abs(actor.position.x) + 0.91 + lateralLead);
        }
      }
    }
    const targetFace = Math.max(requestedFace, clearance);
    const previousFace = facePosition;
    const maxMove = step * (phase === 'reveal' ? 4.4 : 3.2);
    facePosition += clamp(targetFace - facePosition, -maxMove, maxMove);
    facePosition = Math.max(facePosition, clearance);
    const velocity = step > 0 ? (facePosition - previousFace) / step : 0;
    for (const impact of impacts) {
      if (facePosition > impact.face + 0.25) impact.armed = true;
      if (impact.armed && previousFace > impact.face && facePosition <= impact.face) {
        impact.at = time;
        impact.armed = false;
      }
    }
    let impactEnergy = 0;
    let shudder = 0;
    let latestImpact = -1000;
    for (const impact of impacts) {
      const age = time - impact.at;
      latestImpact = Math.max(latestImpact, impact.at);
      impactEnergy += Math.exp(-Math.max(0, age) * 4.3);
      shudder += Math.sin(age * 57) * Math.exp(-Math.max(0, age) * 8) * 0.027;
    }
    const pressure = smooth(0.85, 0.99, p) * (1 - smooth(0.3, 1.5, facePosition));
    const face = Math.max(clearance, facePosition + shudder);
    for (const { bank, side } of banks) bank.position.x = side * face;
    let collarIndex = 0;
    for (const item of hydraulic) {
      const extension = Math.max(0, anchorX - (face + 0.11) - sleeveLength);
      for (let i = 0; i < sleeveCount; i++) {
        const offset = extension * i / (sleeveCount - 1);
        item.stages[i].position.x = item.side * (anchorX - sleeveLength / 2 - offset);
        const radius = 0.304 - i * 0.019;
        dummy.position.set(item.side * (anchorX - sleeveLength - offset + 0.028), floorY + item.y, item.z);
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.scale.set(radius, 0.045, radius);
        dummy.updateMatrix();
        collarMesh.setMatrixAt(collarIndex++, dummy.matrix);
      }
    }
    collarMesh.instanceMatrix.needsUpdate = true;
    const strobe = Math.pow(Math.max(0, Math.sin(time * (7 + p * 9))), 8);
    glow.emissiveIntensity = 0.85 + strobe * 3.2 + impactEnergy;
    for (let i = 0; i < beaconLights.length; i++) beaconLights[i].intensity = 2.0 + strobe * (10 + p * 10) + impactEnergy * 4;
    for (const needle of needles) needle.rotation.z = 2.25 - travel * 4.5 + (pressure * 0.015 + impactEnergy * 0.12) * Math.sin(time * 32);
    safe.emissiveIntensity = 0.25 + smooth(0.74, 0.80, p) * 1.15;

    const drive = Math.min(1, Math.abs(velocity) * 0.8);
    const dustLevel = smooth(0.16, 0.26, p) * (drive * 0.55 + impactEnergy * 1.25);
    dustMaterial.uniforms.opacity.value = dustLevel;
    dustMaterial.uniforms.size.value = 0.85 + impactEnergy * 0.9;
    dust.visible = dustLevel > 0.005;
    for (let i = 0; i < particleCount; i++) {
      const k = i * 5;
      const side = i % 2 === 0 ? -1 : 1;
      const life = (time * (0.38 + particleData[k + 1] * 0.22) + particleData[k]) % 1;
      const fromTop = i % 4 === 0;
      const frontRoll = i % 3 === 0 && !fromTop;
      const drift = Math.sin(time * 0.72 + particleData[k + 3] * 12) * life * 0.22;
      particlePosition[i * 3] = side * (face + 0.50 + life * (0.7 + impactEnergy)) + drift;
      particlePosition[i * 3 + 1] = floorY + (fromTop ? height - life * 1.9 : 0.08 + life * (0.4 + particleData[k + 2] * 0.7));
      particlePosition[i * 3 + 2] = (frontRoll ? frontZ + 0.08 : railZs[i % 3 === 0 ? 0 : 1]) + (particleData[k + 4] - 0.5) * 0.5 + life * 0.4;
      particleFade[i] = Math.sin(life * Math.PI) * (1 - life);
    }
    dustGeometry.attributes.position.needsUpdate = true;
    dustGeometry.attributes.lifeFade.needsUpdate = true;
    for (const { mesh, side } of scrapes) {
      const span = Math.max(0.005, initialFace - face);
      mesh.scale.x = span;
      mesh.position.x = side * (face + span / 2 + 0.45);
    }
    sparkMaterial.opacity = Math.min(1, drive * 0.75 + impactEnergy);
    sparks.visible = sparkMaterial.opacity > 0.02;
    for (let i = 0; i < sparkCount; i++) {
      const k = i * 4;
      const side = i % 2 === 0 ? -1 : 1;
      const life = (time * (2.8 + sparkSeeds[k]) + sparkSeeds[k + 1]) % 1;
      const age = life * 0.42;
      const top = i % 5 === 0;
      const sourceY = top ? height + 0.07 : 0.12;
      const vy = top ? -0.2 : 0.55 + sparkSeeds[k + 2];
      for (let end = 0; end < 2; end++) {
        const at = Math.max(0, age - end * 0.026);
        const j = i * 6 + end * 3;
        sparkPositions[j] = side * (face + 0.46 + at * (0.5 + sparkSeeds[k + 2] * 2));
        sparkPositions[j + 1] = floorY + Math.max(0.065, sourceY + vy * at - 4.8 * at * at);
        sparkPositions[j + 2] = railZs[i % 3 === 0 ? 0 : 1] + (sparkSeeds[k + 3] - 0.5) * at * 3;
        const fade = (1 - life) * (end ? 0.3 : 1);
        sparkColors[j] = fade * 2.5;
        sparkColors[j + 1] = fade * (0.38 + (1 - life) * 0.6);
        sparkColors[j + 2] = fade * 0.035;
      }
    }
    sparkGeometry.attributes.position.needsUpdate = true;
    sparkGeometry.attributes.color.needsUpdate = true;
    const chipAge = Math.max(0, time - latestImpact);
    chips.visible = chipAge < 1.3;
    if (chips.visible) {
      for (let i = 0; i < 24; i++) {
        const k = i * 4;
        const side = i % 2 === 0 ? -1 : 1;
        const age = Math.min(1.3, chipAge);
        dummy.position.set(side * (face + 0.55 + age * (0.3 + chipSeeds[k])), floorY + Math.max(0.05, 0.15 + age * (0.8 + chipSeeds[k + 1]) - 3.3 * age * age), frontZ - 0.85 + (chipSeeds[k + 2] - 0.4) * age * 2.2);
        dummy.rotation.set(age * 8 + i, age * 4, chipSeeds[k + 3] * 6);
        dummy.scale.setScalar((0.6 + chipSeeds[k + 3]) * (1 - smooth(0.8, 1.3, age)));
        dummy.updateMatrix();
        chips.setMatrixAt(i, dummy.matrix);
      }
      chips.instanceMatrix.needsUpdate = true;
    }

    if (active && step > 0) {
      for (const actor of actors) {
        if (actor.invincible || !actor.position) continue;
        const inside = actor.position.z < frontZ + 0.72;
        if (actor.alive !== false && inside && p > 0.08) {
          const contact = clamp(1 - (face - Math.abs(actor.position.x) - 0.55) / 1.2, 0, 1);
          // Floor vibration and crowd pressure hurt everybody before the rush;
          // central health owns vulnerability, survival floors and the fatality.
          ctx.effects?.emit?.('damage', {
            actorId: actor.id, kind: 'crush', amount: step * (1.8 + travel * 3.3 + contact * 5.0),
            position: [actor.position.x, floorY + 0.95, actor.position.z],
            intensity: 0.16 + travel * 0.24 + contact * 0.35, invincible: false,
          });
        }
        if (victim(actor) && inside && p >= 0.94 && rushAge >= 1.2 && survivorsClear
          && face <= Math.abs(actor.position.x) + 0.62 && !impactedActors.has(actor.id)) {
          impactedActors.add(actor.id);
          actor.setSquish?.('crush', 0.95, 1.15);
          ctx.effects?.emit?.('impact', {
            actorId: actor.id, kind: 'crush', damage: 20, intensity: 0.95,
            position: [actor.position.x, floorY + 0.95, actor.position.z],
            direction: [actor.position.x < 0 ? 1 : -1, 0.12, 0], invincible: false,
          });
        }
      }
    }

    if ((active || phase === 'preview') && time >= nextActorCommand) {
      nextActorCommand = time + 0.10;
      const minX = Math.max(-halfWidth + 1.1, (state.bounds?.minX ?? -halfWidth) + 0.48);
      const maxX = Math.min(halfWidth - 1.1, (state.bounds?.maxX ?? halfWidth) - 0.48);
      const safeFront = Math.min(halfDepth - 0.8, (state.bounds?.maxZ ?? halfDepth) - 0.4);
      const living = actors.filter((actor) => actor.alive !== false);
      if (!chamberSlots.size || living.some((actor) => !chamberSlots.has(actor.id))) {
        chamberSlots.clear();
        const ordered = [...living].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
        const columns = Math.max(1, Math.ceil(ordered.length / 3));
        for (let column = 0; column < columns; column++) {
          const columnActors = ordered.slice(column * 3, column * 3 + 3).sort((a, b) => (b.position?.z ?? 0) - (a.position?.z ?? 0));
          for (let row = 0; row < columnActors.length; row++) {
            const actor = columnActors[row];
            const lane = columns === 1 ? 0 : column / (columns - 1) * 2 - 1;
            chamberSlots.set(actor.id, {
              lane, row, startX: actor.position?.x ?? lane * 2,
              startZ: Math.min(frontZ - 0.85, actor.position?.z ?? -row),
            });
            survivorSlots.set(actor.id, { x: clamp(lane * 3.8, minX, maxX), z: safeFront - row * 0.50 });
          }
        }
      }
      const react = time >= nextReaction;
      if (react) nextReaction = time + 0.65;
      for (let i = 0; i < actors.length; i++) {
        const actor = actors[i];
        if (actor.alive === false) continue;
        const slot = chamberSlots.get(actor.id);
        const released = rushing && rushAge >= slot.row * 0.18;
        if (!released) {
          // Identical rules for all nine people: brace, shuffle and compress
          // with the walls, but keep every target behind the front safety caps.
          const squeeze = smooth(0.16, 0.76, p);
          const wiggle = (1 - squeeze * 0.75) * 0.13;
          const tx = slot.startX * (1 - squeeze) + slot.lane * 0.73 * squeeze
            + Math.sin(time * 1.4 + i * 2.4) * wiggle;
          const tz = slot.startZ * (1 - squeeze) + (frontZ - 0.92 - slot.row * 0.93) * squeeze
            + Math.cos(time * 1.15 + i * 1.7) * wiggle;
          const roomToMove = Math.max(0.05, face - 0.96);
          actor.setTarget?.(clamp(tx, -roomToMove, roomToMove), Math.min(frontZ - 0.76, tz));
          const shifting = !actor.position || Math.hypot(actor.position.x - tx, actor.position.z - tz) > 0.15;
          actor.setAction?.(shifting ? 'run' : (p > 0.52 && i % 3 === 0 ? 'crouch' : 'idle'));
          if (react) actor.setReaction?.(p > 0.42 ? 'brace' : 'fear', 0.28 + squeeze * 0.35, 0.62);
        } else if (victim(actor)) {
          // The unlucky person loses footing only when the group breaks for
          // the exit. Keep their real position; never march them to a kill spot.
          if (!caughtPositions.has(actor.id)) {
            caughtPositions.set(actor.id, { x: actor.position?.x ?? 0, z: actor.position?.z ?? 0 });
            actor.setReaction?.('stumble', 0.85, 1.0);
            actor.setSquish?.('crush', 0.28, 0.6);
          }
          const caught = caughtPositions.get(actor.id);
          actor.setTarget?.(caught.x, caught.z);
          actor.setAction?.('crouch');
          if (react) actor.setReaction?.('brace', 0.78, 0.65);
        } else {
          // Run straight through the opening before fanning out. Turning while
          // beside the end caps would push shoulders into the moving steel.
          const { x, z } = survivorSlots.get(actor.id);
          const escaped = actor.position && actor.position.z > frontZ + 0.85;
          const tx = escaped ? x : clamp(actor.position?.x ?? x, -Math.max(0.2, face - 0.96), Math.max(0.2, face - 0.96));
          actor.setTarget?.(tx, escaped ? z : Math.max(z, frontZ + 1.25));
          const reached = escaped && Math.hypot(actor.position.x - x, actor.position.z - z) < 0.20;
          actor.setAction?.(reached ? (pressure > 0.5 && i % 3 === 0 ? 'crouch' : 'idle') : 'panic');
          if (react) actor.setReaction?.(escaped ? 'brace' : 'fear', escaped ? 0.4 : 0.25, 0.60);
        }
      }
    }
  }

  update(0, { progress: 0, elapsed: 0, phase: 'preview' });
  return {
    hideWalls: true,
    get cinematicReady() { return survivorsClear && facePosition <= 0.28; },
    get stats() {
      return {
        pressFrontZ: frontZ, interiorTargetLimitZ: frontZ - 0.76,
        safeBandStartZ: frontZ + 0.72, releaseProgress, roundDuration,
        rushStartProgress, rushStartedAt, survivorsClear,
        facePosition: banks[1].bank.position.x,
        caughtActorIds: [...caughtPositions.keys()], impactedActorIds: [...impactedActors],
      };
    },
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      owned.removeFromParent();
      owned.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
      for (const geometry of resources.geometries) geometry.dispose();
      for (const mat of resources.materials) mat.dispose();
      for (const tex of resources.textures) tex.dispose();
      for (const light of beaconLights) light.dispose();
      owned.clear();
      survivorSlots.clear();
      chamberSlots.clear();
      caughtPositions.clear();
      impactedActors.clear();
      resources.geometries.clear();
      resources.materials.clear();
      resources.textures.clear();
    },
  };
}
