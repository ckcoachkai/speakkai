import * as THREE from 'three';

// The front half is a real open girder construction: it exposes the descending
// spikes and the people beneath them to the chamber's cutaway camera.
export default function createScenario(ctx) {
  const { group, actors } = ctx;
  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  let seed = 0x7ce11a9;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };

  const geometry = new Set();
  const materials = new Set();
  const textures = new Set();
  const ownGeometry = (value) => { geometry.add(value); return value; };
  const ownMaterial = (value) => { materials.add(value); return value; };
  const ownTexture = (value) => { textures.add(value); return value; };
  const standard = (options) => ownMaterial(new THREE.MeshStandardMaterial(options));
  const unitBox = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);

  function box(parent, material, x, y, z, width, height, depth) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function mesh(parent, shape, material, x, y, z) {
    const item = new THREE.Mesh(shape, material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }

  function instances(parent, shape, material, count) {
    const item = new THREE.InstancedMesh(shape, material, count);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }

  function matrixAt(target, index, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    target.setMatrixAt(index, dummy.matrix);
  }

  // Local, deterministic surface textures keep the scenario self-contained.
  const metalPixels = new Uint8Array(64 * 64 * 4);
  for (let i = 0; i < 64 * 64; i += 1) {
    const scratch = i % 64 < 2 ? -15 : 0;
    const value = 204 + Math.floor(random() * 40) + scratch;
    metalPixels[i * 4] = value;
    metalPixels[i * 4 + 1] = value;
    metalPixels[i * 4 + 2] = value;
    metalPixels[i * 4 + 3] = 255;
  }
  const metalTexture = ownTexture(new THREE.DataTexture(metalPixels, 64, 64));
  metalTexture.wrapS = metalTexture.wrapT = THREE.RepeatWrapping;
  metalTexture.repeat.set(3, 2);
  metalTexture.colorSpace = THREE.SRGBColorSpace;
  metalTexture.needsUpdate = true;
  const stripePixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const i = (y * 32 + x) * 4;
      const yellow = ((x + y) % 32) < 16;
      stripePixels[i] = yellow ? 238 : 23;
      stripePixels[i + 1] = yellow ? 168 : 29;
      stripePixels[i + 2] = yellow ? 32 : 32;
      stripePixels[i + 3] = 255;
    }
  }
  const stripeTexture = ownTexture(new THREE.DataTexture(stripePixels, 32, 32));
  stripeTexture.wrapS = stripeTexture.wrapT = THREE.RepeatWrapping;
  stripeTexture.repeat.set(14, 1);
  stripeTexture.colorSpace = THREE.SRGBColorSpace;
  stripeTexture.needsUpdate = true;

  const body = standard({ color: 0x3d4951, metalness: 0.82, roughness: 0.48, map: metalTexture, roughnessMap: metalTexture, bumpMap: metalTexture, bumpScale: 0.012 });
  const panel = standard({ color: 0x68737a, metalness: 0.8, roughness: 0.51, map: metalTexture, roughnessMap: metalTexture, bumpMap: metalTexture, bumpScale: 0.009 });
  const dark = standard({ color: 0x151d23, metalness: 0.72, roughness: 0.54 });
  const black = standard({ color: 0x080e12, metalness: 0.35, roughness: 0.74 });
  const steel = standard({ color: 0xb9c6cf, metalness: 0.95, roughness: 0.26 });
  const spikeSteel = standard({ color: 0x8c9da7, metalness: 0.93, roughness: 0.27 });
  const rust = standard({ color: 0x7d4a2b, metalness: 0.55, roughness: 0.78 });
  const warning = standard({ map: stripeTexture, color: 0xffffff, metalness: 0.48, roughness: 0.53 });
  const amber = standard({ color: 0xffa51d, emissive: 0xff6412, emissiveIntensity: 1.8, roughness: 0.25 });
  const red = standard({ color: 0xff5739, emissive: 0xff2608, emissiveIntensity: 1, roughness: 0.32 });
  const safe = standard({ color: 0x67e1c3, emissive: 0x29bc91, emissiveIntensity: 0.85, roughness: 0.5 });
  const safeFloor = standard({ color: 0x174a40, metalness: 0.12, roughness: 0.87 });
  const drain = standard({ color: 0x293b3f, metalness: 0.76, roughness: 0.57 });
  const rubber = standard({ color: 0x11191b, metalness: 0.08, roughness: 0.91 });

  const fixed = new THREE.Group();
  fixed.name = 'spike-ceiling-stationary-frame';
  const moving = new THREE.Group();
  moving.name = 'descending-spiked-ceiling';
  group.add(fixed, moving);
  moving.position.y = 6.05;

  // Four escape recesses connect into side lanes and a wide front refuge.
  // They remain outside the actual spike footprint (x +/-5.1, z <=2.9).
  box(fixed, safeFloor, 0, 0.026, 4.65, 12.8, 0.012, 1.9);
  for (const side of [-1, 1]) {
    box(fixed, safeFloor, side * 6.05, 0.027, -0.5, 1.25, 0.014, 8.5);
    box(fixed, safe, side * 5.42, 0.04, -0.5, 0.045, 0.018, 8.5);
    box(fixed, safe, side * 6.65, 0.04, -0.5, 0.04, 0.018, 8.5);
    box(fixed, safe, side * 3.9, 0.043, 3.68, 4.8, 0.025, 0.055);
    for (const pocketZ of [-3.65, 1.55]) {
      // Low cutaway backs preserve the refuge shape while exposing bodies and
      // the real edge-contact beat from front/side classroom camera angles.
      box(fixed, dark, side * 6.74, 0.42, pocketZ, 0.14, 0.8, 1.75);
      // Open refuge canopy: solid side slabs hid the real shoulder contact.
      for (const end of [-1, 1]) box(fixed, body, side * 6.4, 1.98, pocketZ + end * 0.81, 0.85, 0.14, 0.12);
      box(fixed, body, side * 6.76, 1.98, pocketZ, 0.12, 0.14, 1.75);
      box(fixed, warning, side * 6.4, 1.88, pocketZ + 0.88, 0.85, 0.12, 0.035);
      box(fixed, safe, side * 6.61, 0.17, pocketZ, 0.045, 0.065, 1.5);
    }
    // Chevron markings point out of the danger field and into each side lane.
    for (let z = -3.8; z <= 2.5; z += 1.5) {
      const a = box(fixed, safe, side * 6.05, 0.045, z - 0.12, 0.34, 0.02, 0.055);
      const b = box(fixed, safe, side * 6.05, 0.045, z + 0.12, 0.34, 0.02, 0.055);
      a.rotation.y = side * -0.65;
      b.rotation.y = side * 0.65;
    }
  }

  // A soft, height-dependent contact shadow supplements the host's real shadow
  // map. Its rear plate and front slat mask match the cutaway construction.
  const contactMaterial = ownMaterial(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    uniforms: { uStrength: { value: 0.11 }, uBlur: { value: 0.11 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec2 vUv; uniform float uStrength; uniform float uBlur;
      void main(){
        float edge=smoothstep(0.0,uBlur,vUv.x)*smoothstep(0.0,uBlur,1.0-vUv.x)
          *smoothstep(0.0,uBlur,vUv.y)*smoothstep(0.0,uBlur,1.0-vUv.y);
        float rear=smoothstep(0.50,0.58,vUv.y);
        float beams=1.0-smoothstep(0.09,0.09+uBlur*2.0,abs(fract(vUv.y*7.0)-0.5));
        gl_FragColor=vec4(0.015,0.022,0.026,edge*uStrength*mix(0.28+0.72*beams,1.0,rear));
      }`,
  }));
  const contactShadow = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(10.75, 8.15)), contactMaterial);
  contactShadow.name = 'height-dependent-ceiling-contact-shadow';
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.024, -0.85);
  fixed.add(contactShadow);
  for (let x = -5.4; x <= 5.4; x += 1.2) {
    box(fixed, safe, x, 0.045, 5.55, 0.65, 0.02, 0.045);
  }
  // Hazard perimeter, drainage channels, and sockets make the footprint legible.
  box(fixed, warning, 0, 0.037, 3.18, 10.5, 0.02, 0.16);
  for (const side of [-1, 1]) {
    box(fixed, warning, side * 5.3, 0.036, -0.8, 0.14, 0.02, 8.1);
    box(fixed, black, side * 5.05, 0.028, -0.85, 0.16, 0.012, 7.9);
    for (let i = 0; i < 28; i += 1) {
      box(fixed, drain, side * 5.05, 0.041, -4.65 + i * 0.28, 0.2, 0.025, 0.055);
    }
  }

  // The rear has real armored panels; the front is an open inspection lattice.
  box(moving, dark, 0, 0.16, -2.8, 10.2, 0.34, 3.65);
  for (let col = 0; col < 5; col += 1) {
    for (let row = 0; row < 2; row += 1) {
      box(moving, panel, -4.08 + col * 2.04, 0.37, -3.66 + row * 1.75, 1.94, 0.14, 1.65);
      box(moving, body, -4.08 + col * 2.04, 0.465, -3.66 + row * 1.75, 0.08, 0.05, 1.4);
    }
  }

  function crossGirder(z, heavy) {
    const depth = heavy ? 0.28 : 0.19;
    const height = heavy ? 0.44 : 0.25;
    box(moving, body, 0, 0.18, z, 10.5, height, depth);
    box(moving, steel, 0, 0.18 + height / 2, z, 10.52, 0.045, depth + 0.14);
    box(moving, dark, 0, 0.18 - height / 2, z, 10.52, 0.06, depth + 0.16);
  }
  crossGirder(-4.7, true);
  crossGirder(2.93, true);
  for (const z of [-3.8, -2.7, -1.6, -0.5, 0.6, 1.7, 2.72]) crossGirder(z, false);
  for (const side of [-1, 1]) {
    box(moving, body, side * 5.13, 0.17, -0.87, 0.36, 0.48, 7.94);
    box(moving, steel, side * 5.13, 0.43, -0.87, 0.55, 0.06, 7.94);
    box(moving, dark, side * 5.13, -0.08, -0.87, 0.55, 0.07, 7.94);
    box(moving, warning, side * 5.325, 0.19, -0.87, 0.035, 0.3, 7.94);
    box(moving, body, side * 2.6, 0.18, 0.83, 0.17, 0.25, 4.15);
    // Diagonal bracing is confined to the side of the assembly.
    for (let i = 0; i < 7; i += 1) {
      const brace = box(moving, steel, side * 5.32, 0.17, -4.15 + i * 1.05, 0.05, 0.075, 1.0);
      brace.rotation.x = (i % 2 ? -1 : 1) * 0.32;
    }
  }
  box(moving, warning, 0, 0.18, 3.085, 10.5, 0.29, 0.035);
  box(moving, dark, 0, 0.45, 3.02, 2.0, 0.16, 0.16);
  for (let i = -3; i <= 3; i += 1) {
    box(moving, red, i * 0.22, 0.45, 3.11, 0.12, 0.06, 0.028);
  }

  // Forged, faceted, physically pointed spikes with individually bolted collars.
  const spikePositions = [];
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      spikePositions.push([-4.65 + col * 0.93, -3.8 + row * 1.1]);
    }
  }
  const spikeCount = spikePositions.length;
  const coneShape = ownGeometry(new THREE.ConeGeometry(0.17, 1.13, 8));
  const socketShape = ownGeometry(new THREE.CylinderGeometry(0.22, 0.22, 0.085, 10));
  const shaftShape = ownGeometry(new THREE.CylinderGeometry(0.105, 0.13, 0.23, 8));
  const spikeCones = instances(moving, coneShape, spikeSteel, spikeCount);
  spikeCones.name = '77-solid-metal-spikes';
  const sockets = instances(moving, socketShape, dark, spikeCount);
  const shafts = instances(moving, shaftShape, steel, spikeCount);
  const polishedTips = instances(moving, ownGeometry(new THREE.ConeGeometry(0.0552, 0.36, 8)), steel, spikeCount);
  for (let i = 0; i < spikeCount; i += 1) {
    const [x, z] = spikePositions[i];
    matrixAt(sockets, i, x, -0.035, z);
    matrixAt(shafts, i, x, -0.17, z);
    matrixAt(spikeCones, i, x, -0.805, z, 1, 1, 1, Math.PI, (i % 3) * 0.2, 0);
    matrixAt(polishedTips, i, x, -1.19, z, 1, 1, 1, Math.PI, (i % 3) * 0.2, 0);
    // Subtle floor sockets anticipate the final descending alignment.
    box(fixed, dark, x, 0.028, z, 0.19, 0.008, 0.19);
  }

  const boltShape = ownGeometry(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 6));
  const bolts = instances(moving, boltShape, steel, 106);
  let boltIndex = 0;
  for (let i = 0; i < 32; i += 1) {
    const x = -4.95 + i * (9.9 / 31);
    matrixAt(bolts, boltIndex++, x, 0.29, 3.115, 1, 1, 1, Math.PI / 2);
    matrixAt(bolts, boltIndex++, x, 0.065, 3.115, 1, 1, 1, Math.PI / 2);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 21; i += 1) {
      matrixAt(bolts, boltIndex++, side * 5.13, 0.482, -4.5 + i * 0.365);
    }
  }

  // Hydraulic sleeves, chrome extending rods, guide shoes, and paying-out chains.
  const cylinderShape = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 14));
  const ringShape = ownGeometry(new THREE.TorusGeometry(0.2, 0.045, 6, 16));
  const chainShape = ownGeometry(new THREE.TorusGeometry(0.084, 0.022, 5, 9));
  const rams = [];
  const chains = [];
  const pulleys = [];
  const lampCages = [];
  const dynamicChainMatrix = new THREE.Matrix4();
  const chainQuaternion = new THREE.Quaternion();
  const chainPosition = new THREE.Vector3();
  const chainScale = new THREE.Vector3(0.83, 1.28, 1);
  const ramBottom = new THREE.Vector3();
  const ramTop = new THREE.Vector3();
  const ramDirection = new THREE.Vector3();
  for (const x of [-5.47, 5.47]) {
    for (const z of [-3.98, 2.18]) {
      box(fixed, dark, x, 0.15, z, 0.55, 0.29, 0.6);
      box(fixed, warning, x, 0.31, z, 0.52, 0.08, 0.58);
      box(fixed, steel, x, 3.51, z, 0.105, 6.55, 0.13);
      box(fixed, body, x, 6.8, z, 0.64, 0.3, 0.75);
      box(moving, body, x, 0.22, z, 0.41, 0.63, 0.47);
      box(moving, rust, x, 0.23, z + 0.25, 0.28, 0.35, 0.04);
      const cylinder = mesh(fixed, cylinderShape, body, x - Math.sign(x) * 0.28, 6.45, z);
      cylinder.scale.set(0.22, 0.86, 0.22);
      for (const y of [6.06, 6.72, 6.85]) {
        const ring = mesh(fixed, ringShape, steel, cylinder.position.x, y, z);
        ring.rotation.x = Math.PI / 2;
      }
      const rod = mesh(fixed, cylinderShape, steel, cylinder.position.x, 5.85, z);
      rod.name = 'articulated-hydraulic-piston';
      rod.scale.set(0.105, 0.2, 0.105);
      rams.push({ rod, x: cylinder.position.x, z });
      box(moving, steel, cylinder.position.x, 0.35, z, 0.42, 0.15, 0.42);

      const chainX = x - Math.sign(x) * 0.93;
      const chainZ = z - 0.25;
      const chain = instances(fixed, chainShape, steel, 40);
      chain.name = 'paying-out-support-chain';
      chain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      chain.frustumCulled = false;
      chains.push({ mesh: chain, x: chainX, z: chainZ });
      const anchor = mesh(moving, ringShape, dark, chainX, 0.56, chainZ);
      anchor.scale.setScalar(0.7);
      box(fixed, dark, chainX, 6.75, chainZ, 0.5, 0.17, 0.6);
      const wheel = new THREE.Group();
      wheel.position.set(chainX, 6.62, chainZ);
      fixed.add(wheel);
      const drum = mesh(wheel, cylinderShape, dark, 0, 0, 0);
      drum.scale.set(0.22, 0.24, 0.22);
      drum.rotation.x = Math.PI / 2;
      for (const end of [-1, 1]) {
        const flange = mesh(wheel, cylinderShape, body, 0, 0, end * 0.16);
        flange.scale.set(0.31, 0.05, 0.31);
        flange.rotation.x = Math.PI / 2;
      }
      for (let i = 0; i < 4; i += 1) {
        const spoke = box(wheel, steel, 0, 0, 0.19, 0.53, 0.04, 0.025);
        spoke.rotation.z = i * Math.PI / 4;
      }
      pulleys.push(wheel);
      // Visible rigid hydraulic pipe follows the stationary frame.
      box(fixed, dark, x + Math.sign(x) * 0.2, 5.75, z, 0.08, 1.9, 0.08);
      box(fixed, steel, x + Math.sign(x) * 0.1, 6.65, z, 0.32, 0.075, 0.075);
    }
  }

  const hoseSegments = 12;
  const hoses = instances(fixed, cylinderShape, rubber, rams.length * hoseSegments);
  hoses.name = 'flexing-hydraulic-return-hoses';
  hoses.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  hoses.frustumCulled = false;
  const hoseA = new THREE.Vector3();
  const hoseB = new THREE.Vector3();
  const hoseEnd = new THREE.Vector3();
  const hoseDirection = new THREE.Vector3();
  const hoseQuaternion = new THREE.Quaternion();
  const hoseScale = new THREE.Vector3();
  const hoseMatrix = new THREE.Matrix4();
  function pointOnHose(t, target, side, z, bow, flutter) {
    const arc = Math.sin(t * Math.PI);
    target.set(
      lerp(side * 5.7, hoseEnd.x, t) + side * arc * bow,
      lerp(6.3, hoseEnd.y, t) - arc * 0.16,
      lerp(z, hoseEnd.z, t) + arc * flutter,
    );
  }

  // Spring-loaded stop shoes compress visibly when the final press lands.
  const stops = [];
  const springShape = ownGeometry(new THREE.TorusGeometry(0.145, 0.023, 5, 12));
  for (const x of [-5.47, 5.47]) {
    for (const z of [-3.98, 2.18]) {
      const stop = new THREE.Group();
      stop.name = 'compressing-ceiling-end-stop';
      stop.position.set(x, 0.33, z);
      fixed.add(stop);
      const spring = instances(stop, springShape, steel, 6);
      for (let i = 0; i < 6; i += 1) {
        matrixAt(spring, i, 0, 0.06 + i * 0.23, 0, 1, 1, 1, Math.PI / 2);
      }
      const shoe = box(stop, rubber, 0, 1.31, 0, 0.39, 0.13, 0.43);
      stops.push({ spring, shoe });
    }
  }

  // Industrial caged warning lamps. Their emissive surfaces, not shadow lights,
  // provide most of the blinking appearance.
  const globeShape = ownGeometry(new THREE.SphereGeometry(0.13, 10, 7));
  for (const x of [-4.8, 4.8]) {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0.45, 3.16);
    moving.add(lamp);
    mesh(lamp, globeShape, amber, 0, 0, 0);
    box(lamp, dark, 0, -0.16, 0, 0.3, 0.07, 0.24);
    box(lamp, dark, 0, 0.16, 0, 0.3, 0.055, 0.24);
    for (const dx of [-0.11, 0.11]) {
      box(lamp, steel, dx, 0, 0.13, 0.022, 0.31, 0.025);
    }
    lampCages.push(lamp);
  }
  const warningLight = new THREE.PointLight(0xff6d24, 1.3, 12, 2);
  warningLight.position.set(0, 4.5, 3.45);
  warningLight.castShadow = false;
  fixed.add(warningLight);

  // Two floor indicators show rising danger without covering the safe lanes.
  for (const x of [-3.9, 3.9]) {
    box(fixed, black, x, 0.08, 3.3, 1.0, 0.13, 0.13);
    for (let i = 0; i < 5; i += 1) {
      box(fixed, red, x - 0.38 + i * 0.19, 0.15, 3.31, 0.11, 0.025, 0.08);
    }
  }

  // Trim, grilles, refuge markings, and sockets share one box geometry. Batch
  // them per material after construction, retaining moving parent transforms.
  function batchBoxes(parent) {
    const batches = new Map();
    for (const child of parent.children) {
      if (!child.isMesh || child.isInstancedMesh || child.geometry !== unitBox) continue;
      if (!batches.has(child.material)) batches.set(child.material, []);
      batches.get(child.material).push(child);
    }
    for (const [material, children] of batches) {
      if (children.length < 2) continue;
      const batch = instances(parent, unitBox, material, children.length);
      for (let i = 0; i < children.length; i += 1) {
        children[i].updateMatrix();
        batch.setMatrixAt(i, children[i].matrix);
        parent.remove(children[i]);
      }
      batch.computeBoundingSphere();
    }
  }
  batchBoxes(fixed);
  batchBoxes(moving);
  for (const pulley of pulleys) batchBoxes(pulley);
  for (const lamp of lampCages) batchBoxes(lamp);

  const dustPixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const i = (y * 32 + x) * 4;
      const distance = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
      dustPixels[i] = dustPixels[i + 1] = dustPixels[i + 2] = 255;
      dustPixels[i + 3] = Math.round(Math.pow(Math.max(0, 1 - distance), 2.2) * 255);
    }
  }
  const dustTexture = ownTexture(new THREE.DataTexture(dustPixels, 32, 32));
  dustTexture.needsUpdate = true;
  const dustCount = ctx.quality === 'low' ? 100 : 190;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = new Float32Array(dustCount * 5);
  for (let i = 0; i < dustCount; i += 1) {
    dustSeeds[i * 5] = (random() - 0.5) * 10.0;
    dustSeeds[i * 5 + 1] = -4.3 + random() * 7.3;
    dustSeeds[i * 5 + 2] = random();
    dustSeeds[i * 5 + 3] = random() * Math.PI * 2;
    dustSeeds[i * 5 + 4] = 0.4 + random() * 0.8;
  }
  const dustGeometry = ownGeometry(new THREE.BufferGeometry());
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const dustMaterial = ownMaterial(new THREE.PointsMaterial({
    color: 0xb7b7ac, size: 0.16, map: dustTexture, transparent: true,
    opacity: 0, depthWrite: false, sizeAttenuation: true,
  }));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  dust.name = 'ceiling-grit-and-final-impact-dust';
  fixed.add(dust);

  const impactCount = ctx.quality === 'low' ? 70 : 130;
  const impactPositions = new Float32Array(impactCount * 3);
  const impactSeeds = new Float32Array(impactCount * 5);
  for (let i = 0; i < impactCount; i += 1) {
    impactSeeds[i * 5] = (random() - 0.5) * 9.6;
    impactSeeds[i * 5 + 1] = -3.9 + random() * 6.7;
    impactSeeds[i * 5 + 2] = random() * Math.PI * 2;
    impactSeeds[i * 5 + 3] = 0.4 + random();
    impactSeeds[i * 5 + 4] = random();
  }
  const impactGeometry = ownGeometry(new THREE.BufferGeometry());
  impactGeometry.setAttribute('position', new THREE.BufferAttribute(impactPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const impactMaterial = ownMaterial(new THREE.PointsMaterial({
    color: 0xc5b89f, size: 0.7, map: dustTexture, transparent: true,
    opacity: 0, depthWrite: false, sizeAttenuation: true,
  }));
  const impactDust = new THREE.Points(impactGeometry, impactMaterial);
  impactDust.name = 'non-graphic-floor-impact-cloud';
  impactDust.frustumCulled = false;
  fixed.add(impactDust);

  // One of the existing spikes rides a physical two-axis telescoping carriage.
  // It only deploys in the final descent and tracks the person's actual body;
  // the participant is never relocated to a prepared contact point.
  const carriage = new THREE.Group();
  carriage.name = 'late-contact-spike-carriage';
  carriage.visible = false;
  moving.add(carriage);
  mesh(carriage, socketShape, dark, 0, -0.035, 0);
  mesh(carriage, shaftShape, steel, 0, -0.17, 0);
  const contactSteel = standard({ color: 0xd0dbe2, metalness: 0.86, roughness: 0.22, emissive: 0x24333b, emissiveIntensity: 0.16 });
  const contactCone = mesh(carriage, coneShape, contactSteel, 0, -0.805, 0);
  contactCone.rotation.x = Math.PI;
  const contactTip = mesh(carriage, polishedTips.geometry, steel, 0, -1.19, 0);
  contactTip.rotation.x = Math.PI;
  box(carriage, body, 0, 0.12, 0, 0.46, 0.24, 0.44);
  box(carriage, warning, 0, 0.12, 0.231, 0.44, 0.12, 0.022);
  const railX = box(moving, body, 0, 0.28, 0, 1, 0.16, 0.18);
  const railZ = box(moving, steel, 0, 0.2, 0, 0.14, 0.12, 1);
  const actuator = mesh(moving, cylinderShape, steel, 0, 0, 0);
  railX.visible = railZ.visible = actuator.visible = false;
  const hiddenSpikeMatrices = [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()];
  const spikeInstances = [spikeCones, polishedTips, sockets, shafts];
  const impaleRay = new THREE.Raycaster();
  const impaleHits = [];
  const aimPoint = new THREE.Vector3();
  const rayStart = new THREE.Vector3();
  const actorRight = new THREE.Vector3();
  const bodyQuaternion = new THREE.Quaternion();
  const parentQuaternion = new THREE.Quaternion();
  const actualTip = new THREE.Vector3();
  const actualBase = new THREE.Vector3();
  const shaftDirection = new THREE.Vector3(0, -1, 0);
  const localBase = new THREE.Vector3();
  const entryPoint = new THREE.Vector3();
  const penetrationVector = new THREE.Vector3();
  let impalement = null;

  function clearImpalement() {
    if (impalement) {
      for (let i = 0; i < spikeInstances.length; i += 1) {
        spikeInstances[i].setMatrixAt(impalement.spikeIndex, hiddenSpikeMatrices[i]);
        spikeInstances[i].instanceMatrix.needsUpdate = true;
      }
      if (impalement.holdPose) impalement.actor.clearFreezing?.();
    }
    impalement = null;
    carriage.visible = railX.visible = railZ.visible = actuator.visible = false;
  }

  function bodyHitAt(actor, x, z, meshes) {
    actor.root.updateWorldMatrix(true, true);
    rayStart.set(x, (ctx.room?.height || 7) + 0.7, z);
    impaleRay.set(rayStart, shaftDirection);
    impaleRay.near = 0;
    impaleRay.far = 9;
    impaleHits.length = 0;
    impaleRay.intersectObjects(meshes, false, impaleHits);
    return impaleHits.find(hit => hit.point.y > actor.position.y + 0.28) || null;
  }

  function surfaceAim(actor, meshes) {
    actor.root.updateWorldMatrix(true, true);
    if (actor.chestAnchor?.getWorldPosition) actor.chestAnchor.getWorldPosition(aimPoint);
    else { actor.root.getWorldPosition(aimPoint); aimPoint.y += 1.12; }
    actor.root.getWorldQuaternion(bodyQuaternion);
    actorRight.set(1, 0, 0).applyQuaternion(bodyQuaternion);
    const chestX = aimPoint.x, chestZ = aimPoint.z;
    // Shoulder-side candidates avoid simply aiming through the face. Every
    // candidate still requires an actual intersection with rendered body mesh.
    for (const offset of [0.17, -0.17, 0.11, -0.11, 0]) {
      const x = chestX + actorRight.x * offset;
      const z = chestZ + actorRight.z * offset + 0.025;
      const hit = bodyHitAt(actor, x, z, meshes);
      if (hit) { aimPoint.copy(hit.point); return hit; }
    }
    return null;
  }

  function beginImpalement(state) {
    const selected = actors.find(actor => actor.alive !== false && !actor.invincible
      && (state.selectedId != null ? actor.id === state.selectedId : state.victimIds?.has?.(actor.id)));
    if (!selected) return;
    const meshes = [];
    selected.root.traverse(object => { if (object.isSkinnedMesh) meshes.push(object); });
    if (!meshes.length) selected.root.traverse(object => {
      if (object.isMesh && object.geometry && !/shadow|number|patch|label/i.test(object.name || '')) meshes.push(object);
    });
    if (!meshes.length || !surfaceAim(selected, meshes)) return;
    moving.updateWorldMatrix(true, false);
    localBase.copy(aimPoint);
    moving.worldToLocal(localBase);
    let nearest = 0, best = Infinity;
    for (let i = 0; i < spikePositions.length; i += 1) {
      const [x, z] = spikePositions[i];
      const distance = (x - localBase.x) ** 2 + (z - localBase.z) ** 2;
      if (distance < best) { best = distance; nearest = i; }
    }
    for (let i = 0; i < spikeInstances.length; i += 1) {
      spikeInstances[i].getMatrixAt(nearest, hiddenSpikeMatrices[i]);
      matrixAt(spikeInstances[i], nearest, 0, 0, 0, 0, 0, 0);
      spikeInstances[i].instanceMatrix.needsUpdate = true;
    }
    const home = spikePositions[nearest];
    actualBase.set(home[0], 0, home[1]).applyMatrix4(moving.matrixWorld);
    impalement = {
      actor: selected, actorId: selected.id, meshes, spikeIndex: nearest,
      spikeId: `ceiling-spike-${String(nearest + 1).padStart(2, '0')}`,
      homeX: home[0], homeZ: home[1], x: actualBase.x, z: actualBase.z,
      tipY: Math.max(actualBase.y - 1.37, aimPoint.y + 0.35),
      holdPose: false, ready: false, penetration: 0, contactAge: 0,
      penetrationHoldTime: 0, firstContactTime: null, firstContactProgress: null,
      bodyMesh: null, bodyRegion: 'upper-body surface', eventTime: 0,
    };
    carriage.visible = railX.visible = railZ.visible = actuator.visible = true;
    carriage.name = impalement.spikeId;
    contactCone.name = `${impalement.spikeId}-cone`;
    contactTip.name = `${impalement.spikeId}-polished-tip`;
    contactCone.rotation.y = contactTip.rotation.y = (nearest % 3) * 0.2;
  }

  function contactSnapshot() {
    if (!impalement) return null;
    return Object.freeze({
      actorId: impalement.actorId, spikeId: impalement.spikeId, spikeIndex: impalement.spikeIndex,
      objectName: carriage.name, tipObjectName: contactTip.name,
      tipLocal: Object.freeze([0, 0.18, 0]), baseLocal: Object.freeze([0, 0, 0]),
      bodyMesh: impalement.bodyMesh, bodyRegion: impalement.bodyRegion,
      position: Object.freeze(entryPoint.toArray()), entryPoint: Object.freeze(entryPoint.toArray()),
      tip: Object.freeze(actualTip.toArray()), base: Object.freeze(actualBase.toArray()),
      direction: Object.freeze(shaftDirection.toArray()), penetration: impalement.penetration,
      firstContactTime: impalement.firstContactTime, firstContactProgress: impalement.firstContactProgress,
      contactAge: impalement.contactAge, penetrationHoldTime: impalement.penetrationHoldTime,
      ready: impalement.ready, holdPose: impalement.holdPose,
    });
  }

  function emitImpale(phase) {
    const contact = contactSnapshot();
    ctx.effects?.emit?.('impale', {
      ...contact, phase, holdSeconds: 0.65, intensity: 0.95, damage: 0,
      invincible: false, source: 'spike-ceiling',
    });
  }

  function updateImpalement(dt, state, progress) {
    if (state.phase === 'preview') return;
    if (!impalement && progress >= 0.875) beginImpalement(state);
    if (!impalement) return;
    const record = impalement;
    const step = state.paused ? 0 : clamp(dt, 0, 0.1);
    moving.updateWorldMatrix(true, false);
    if (!record.holdPose) {
      const hit = surfaceAim(record.actor, record.meshes);
      if (!hit) return;
      const travel = 4.8 * step;
      const dx = aimPoint.x - record.x, dz = aimPoint.z - record.z;
      const distance = Math.hypot(dx, dz);
      const alpha = distance > 0 ? Math.min(1, travel / distance) : 1;
      record.x += dx * alpha;
      record.z += dz * alpha;
      const aligned = Math.hypot(aimPoint.x - record.x, aimPoint.z - record.z) < 0.045;
      const baseTip = moving.getWorldPosition(actualBase).y - 1.37;
      const targetTip = aligned ? baseTip : Math.max(baseTip, aimPoint.y + 0.27);
      record.tipY += clamp(targetTip - record.tipY, -2.8 * step, 4 * step);
    } else {
      const baseTip = moving.getWorldPosition(actualBase).y - 1.37;
      // Keep a visible embedded section; never drag the frozen body after contact.
      const targetTip = Math.max(baseTip, entryPoint.y - 0.48);
      record.tipY += clamp(targetTip - record.tipY, -1.8 * step, 1.8 * step);
      record.contactAge += step;
    }
    localBase.set(record.x, record.tipY + 1.37, record.z);
    moving.worldToLocal(localBase);
    carriage.position.copy(localBase);
    moving.getWorldQuaternion(parentQuaternion);
    carriage.quaternion.copy(parentQuaternion).invert();
    carriage.updateWorldMatrix(false, true);
    actualTip.set(0, -1.37, 0).applyMatrix4(carriage.matrixWorld);
    actualBase.set(0, 0, 0).applyMatrix4(carriage.matrixWorld);
    shaftDirection.subVectors(actualTip, actualBase).normalize();
    railX.position.set((record.homeX + localBase.x) / 2, 0.28, record.homeZ);
    railX.scale.x = Math.max(0.3, Math.abs(localBase.x - record.homeX) + 0.35);
    railZ.position.set(localBase.x, 0.2, (record.homeZ + localBase.z) / 2);
    railZ.scale.z = Math.max(0.3, Math.abs(localBase.z - record.homeZ) + 0.35);
    actuator.position.set(localBase.x, (0.3 + localBase.y + 0.12) / 2, localBase.z);
    actuator.scale.set(0.12, Math.max(0.16, Math.abs(localBase.y - 0.18)), 0.12);

    if (!record.holdPose && step > 0) {
      const hit = bodyHitAt(record.actor, actualTip.x, actualTip.z, record.meshes);
      const aligned = Math.hypot(aimPoint.x - actualTip.x, aimPoint.z - actualTip.z) < 0.05;
      if (hit && aligned) {
        const depth = penetrationVector.subVectors(actualTip, hit.point).dot(shaftDirection);
        if (depth >= 0.015 && depth < 1.05 && actualBase.y > hit.point.y + 0.08) {
          entryPoint.copy(hit.point);
          record.holdPose = true;
          record.bodyMesh = hit.object.name || hit.object.type;
          record.firstContactTime = state.elapsed;
          record.firstContactProgress = progress;
          record.penetration = depth;
          record.actor.freezeInPlace?.('impale');
          emitImpale('contact');
          // Health and blood are deliberately separate streams: this physical
          // contact dose has no duplicate native visual/blood side effect.
          ctx.effects?.emit?.('damage', {
            actorId: record.actorId, kind: 'crush', amount: 18,
            position: entryPoint.toArray(), intensity: 0.95, invincible: false,
          });
        }
      }
    }
    if (record.holdPose) {
      record.penetration = Math.max(0, penetrationVector.subVectors(actualTip, entryPoint).dot(shaftDirection));
      if (record.penetration >= 0.18) record.penetrationHoldTime += step;
      else record.penetrationHoldTime = 0;
      record.ready ||= record.penetrationHoldTime >= 0.65;
      record.eventTime += step;
      if (record.eventTime >= 0.1 && state.phase !== 'complete') { emitImpale('hold'); record.eventTime = 0; }
    }
  }

  const safeSlots = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 14; col += 1) safeSlots.push([-5.45 + col * (10.9 / 13), 4.1 + row * 1.03]);
  }
  for (let row = 0; row < 11; row += 1) {
    safeSlots.push([-6.05, -4.7 + row * 0.77], [6.05, -4.7 + row * 0.77]);
  }
  safeSlots.push([-6.05, 3.72], [6.05, 3.72]);
  const lurches = [
    { start: 0.286, end: 0.308, depth: 0.44 },
    { start: 0.438, end: 0.46, depth: 0.4 },
    { start: 0.855, end: 0.879, depth: 0.46 },
  ];
  const escapeAlarm = 0.78;
  let actorTimer = 0;
  let previousPhase = '';
  let previousProgress = -1;
  let disposed = false;
  const refugeRoutes = new Map();
  const huddleRoutes = new Map();
  const squishTimes = new Map();
  let exposureTime = 0;

  function canCommand(actor) {
    return actor.alive !== false && actor.action !== 'fall' && actor.action !== 'dead'
      && actor.health?.stage !== 'dead' && !(impalement?.holdPose && impalement.actorId === actor.id);
  }

  function assignHuddle() {
    if (huddleRoutes.size && actors.every(actor => !canCommand(actor) || huddleRoutes.has(actor.id))) return;
    huddleRoutes.clear();
    let index = 0;
    for (const actor of actors) {
      if (!canCommand(actor)) continue;
      // Every participant shares the same pressure field. IDs and selected
      // status never affect these positions or the subsequent escape route.
      huddleRoutes.set(actor.id, {
        x: -3.25 + (index % 3) * 3.25 + Math.sin(index * 1.7) * 0.16,
        z: 0.8 + Math.floor(index / 3) * 0.68 + Math.cos(index * 2.1) * 0.12,
        side: index % 2 ? 1 : -1,
      });
      index += 1;
    }
  }

  function assignRefuges(state) {
    const survivors = actors.filter(canCommand);
    if (refugeRoutes.size === survivors.length && survivors.every(actor => refugeRoutes.has(actor.id))) return;
    refugeRoutes.clear();
    const rows = survivors.length;
    const cols = safeSlots.length;
    if (!rows) return;
    const costs = new Float64Array(rows * cols);
    for (let i = 0; i < rows; i += 1) {
      const position = survivors[i].position || survivors[i].root.position;
      for (let j = 0; j < cols; j += 1) {
        let x = safeSlots[j][0], z = safeSlots[j][1];
        if (state.bounds) {
          x = clamp(x, state.bounds.minX + 0.38, state.bounds.maxX - 0.38);
          z = clamp(z, state.bounds.minZ + 0.38, state.bounds.maxZ - 0.38);
        }
        costs[i * cols + j] = (x - position.x) ** 2 + (z - position.z) ** 2;
      }
    }
    // At the late alarm everyone gets the same chance to seek nearby clearance.
    // The shared health system, not a scripted victim route, controls fatality.
    const u = new Float64Array(rows + 1), v = new Float64Array(cols + 1);
    const matching = new Int32Array(cols + 1), previous = new Int32Array(cols + 1);
    const distances = new Float64Array(cols + 1), visited = new Uint8Array(cols + 1);
    for (let row = 1; row <= Math.min(rows, cols); row += 1) {
      matching[0] = row;
      distances.fill(Infinity);
      visited.fill(0);
      let column = 0;
      do {
        visited[column] = 1;
        const activeRow = matching[column];
        let delta = Infinity, next = 0;
        for (let candidate = 1; candidate <= cols; candidate += 1) {
          if (visited[candidate]) continue;
          const cost = costs[(activeRow - 1) * cols + candidate - 1] - u[activeRow] - v[candidate];
          if (cost < distances[candidate]) { distances[candidate] = cost; previous[candidate] = column; }
          if (distances[candidate] < delta) { delta = distances[candidate]; next = candidate; }
        }
        for (let candidate = 0; candidate <= cols; candidate += 1) {
          if (visited[candidate]) { u[matching[candidate]] += delta; v[candidate] -= delta; }
          else distances[candidate] -= delta;
        }
        column = next;
      } while (matching[column] !== 0);
      do {
        const predecessor = previous[column];
        matching[column] = matching[predecessor];
        column = predecessor;
      } while (column !== 0);
    }
    for (let column = 1; column <= cols; column += 1) {
      if (matching[column]) refugeRoutes.set(survivors[matching[column] - 1].id, safeSlots[column - 1]);
    }
  }

  function commandActors(state, progress) {
    if (state.phase === 'preview' || state.phase === 'complete' || progress < 0.025) return;
    assignHuddle();
    if (progress >= escapeAlarm) assignRefuges(state);
    const bounds = state.bounds;
    for (const actor of actors) {
      if (!canCommand(actor)) continue;
      let targetX;
      let targetZ;
      if (progress < escapeAlarm) {
        const anchor = huddleRoutes.get(actor.id);
        const shift = progress > 0.46 ? 0.32 : progress > 0.308 ? -0.36 : 0;
        targetX = anchor.x + anchor.side * shift;
        targetZ = anchor.z + Math.sin(progress * 11 + anchor.side) * 0.12;
      } else {
        const slot = refugeRoutes.get(actor.id) || safeSlots[0];
        targetX = slot[0];
        targetZ = slot[1];
      }
      if (bounds) {
        targetX = clamp(targetX, bounds.minX, bounds.maxX);
        targetZ = clamp(targetZ, bounds.minZ, bounds.maxZ);
      }
      actor.setTarget(targetX, targetZ);
      const position = actor.position || actor.root.position;
      const distance = Math.hypot(position.x - targetX, position.z - targetZ);
      if (progress < escapeAlarm) {
        actor.setAction(distance > 0.27 ? 'run' : progress > 0.48 ? 'crouch' : 'idle');
      } else {
        const clear = Math.abs(position.x) > 5.3 || position.z > 3.45;
        actor.setAction(clear && distance < 0.6 ? 'crouch' : 'panic');
      }
    }
  }

  function damageActors(dt, state, progress, ceilingY, mechanicalImpulse) {
    if (dt <= 0 || state.paused === true || !['running', 'reveal'].includes(state.phase) || progress < 0.025) return;
    const declaredDuration = state.durationSeconds ?? state.duration ?? state.roundDuration;
    const duration = Number.isFinite(declaredDuration) ? clamp(declaredDuration, 8, 40)
      : state.elapsed > 0 && progress > 0 ? clamp(state.elapsed / progress, 8, 40) : 20;
    // Shared health accepts actual HP units. Pace room exposure consistently
    // across the selectable round lengths; discrete mechanical jolts stay fixed.
    const timeScale = 10 / duration;
    exposureTime += dt;
    const flush = exposureTime >= 0.24;
    const stepTime = flush ? exposureTime : 0;
    if (flush) exposureTime = 0;
    const jolt = lurches.some(beat => progress >= beat.start && previousProgress < beat.start);
    for (const actor of actors) {
      if (actor.invincible || !canCommand(actor)) continue;
      const position = actor.position || actor.root.position;
      const underCeiling = Math.abs(position.x) < 5.08 && position.z > -4.65 && position.z < 3.04;
      const contact = underCeiling && ceilingY - 1.37 < 1.7 && progress > 0.84;
      if (flush) {
        // The grating and guide rails shake from the first descent: stumbling,
        // thrown grit and minor scrapes injure all students before the midpoint.
        // Clear refuges greatly reduce exposure; health owns floors/vulnerability.
        const roomExposure = progress < escapeAlarm || underCeiling ? 1 : 0.16;
        const rate = (2.8 + progress * 2.2 + mechanicalImpulse * 3) * timeScale * roomExposure;
        ctx.effects?.emit?.('damage', {
          actorId: actor.id, kind: contact ? 'crush' : 'impact',
          amount: stepTime * (rate + (contact ? 16 * timeScale : 0)),
          position: [position.x, contact ? 1.05 : 0.6, position.z],
          intensity: contact ? 0.82 : 0.2 + progress * 0.3, invincible: false,
        });
      }
      if (jolt) {
        ctx.effects?.emit?.('damage', {
          actorId: actor.id, kind: 'impact', amount: underCeiling ? 4.6 : 1.2,
          position: [position.x, 0.65, position.z], intensity: 0.58, invincible: false,
        });
      }
      if (contact && state.elapsed - (squishTimes.get(actor.id) ?? -10) >= 0.55) {
        actor.setSquish?.('crush', 0.36 + smooth(0.9, 1, progress) * 0.28, 0.5);
        actor.setReaction?.('brace', 0.8, 0.45);
        squishTimes.set(actor.id, state.elapsed);
      }
    }
  }

  function update(dt, state) {
    if (disposed) return;
    const progress = clamp(Number.isFinite(state.progress) ? state.progress : 0, 0, 1);
    const elapsed = Number.isFinite(state.elapsed) ? state.elapsed : 0;
    const preview = state.phase === 'preview';
    if (progress < previousProgress || (preview && previousPhase !== 'preview')) {
      clearImpalement();
      refugeRoutes.clear(); huddleRoutes.clear(); squishTimes.clear(); exposureTime = 0;
    }
    // The brake catches between three heavy ratchet drops. Motion is derived
    // from progress, so pause, random seeks, and reveal cannot accumulate drift.
    let ceilingY;
    if (preview) {
      ceilingY = 6.05 - 1.3 * smooth(0, 0.45, progress);
    } else {
      ceilingY = 6.05 - 0.35 * smooth(0, 0.2, progress)
        - 0.96 * smooth(0.2, 0.58, progress) - 0.34 * smooth(0.58, 0.78, progress)
        - 0.25 * smooth(0.89, 0.93, progress)
        - 0.15 * smooth(0.82, 0.93, progress) - 1.18 * smooth(0.93, 0.989, progress);
      for (const lurch of lurches) ceilingY -= lurch.depth * smooth(lurch.start, lurch.end, progress);
    }
    let mechanicalImpulse = 0;
    let rebound = 0;
    if (!preview) {
      for (const lurch of lurches) {
        const t = (progress - lurch.start) / (lurch.end - lurch.start);
        if (t > 0 && t < 1) mechanicalImpulse = Math.max(mechanicalImpulse, Math.sin(t * Math.PI));
        const age = progress - lurch.end;
        if (age >= 0 && age < 0.06) {
          const decay = Math.exp(-age * 75);
          rebound += 0.065 * Math.sin(age * 330) * decay;
          mechanicalImpulse = Math.max(mechanicalImpulse, decay * 0.65);
        }
      }
      const finalAge = progress - 0.989;
      if (finalAge > 0) rebound += 0.024 * Math.sin(finalAge * 660) * (1 - smooth(0.989, 1, progress));
    }
    const pressure = preview ? 0.2 : smooth(0.5, 0.94, progress);
    const vibration = 0.011 * pressure * Math.sin(elapsed * 41) * (1 - smooth(0.985, 1, progress));
    moving.position.y = ceilingY + vibration + rebound;
    moving.rotation.z = (Math.sin(elapsed * 23) * pressure * 0.0008 + mechanicalImpulse * Math.sin(elapsed * 18) * 0.003) * (1 - smooth(0.98, 1, progress));
    moving.rotation.x = mechanicalImpulse * Math.sin(elapsed * 21 + 1.1) * 0.002;
    moving.updateMatrix();
    contactMaterial.uniforms.uStrength.value = 0.1 + 0.33 * (1 - smooth(1.5, 5.9, ceilingY));
    contactMaterial.uniforms.uBlur.value = lerp(0.035, 0.12, smooth(1.5, 5.9, ceilingY));
    const blinkRate = lerp(5, 17, smooth(0.3, 0.94, progress));
    const blink = Math.sin(elapsed * blinkRate) > -0.1 ? 1 : 0.07;
    const flicker = 0.9 + 0.1 * Math.sin(elapsed * 61) * Math.sin(elapsed * 43);
    amber.emissiveIntensity = (0.4 + 3.0 * blink) * flicker;
    red.emissiveIntensity = 0.5 + 2.7 * blink * smooth(0.45, 0.94, progress);
    warningLight.intensity = (0.35 + 2.7 * blink) * (preview ? 0.35 : 0.4 + pressure) + mechanicalImpulse * 1.5;
    warningLight.position.y = Math.max(1.9, ceilingY - 0.5);
    safe.emissiveIntensity = (progress >= escapeAlarm && !preview ? 1.5 : 0.45) + 0.15 * Math.sin(elapsed * 1.8);

    for (const ram of rams) {
      ramBottom.set(ram.x, 0.38, ram.z).applyMatrix4(moving.matrix);
      ramTop.set(ram.x, 6.48, ram.z);
      ramDirection.subVectors(ramTop, ramBottom);
      ram.rod.scale.y = Math.max(0.02, ramDirection.length());
      ram.rod.position.copy(ramTop).add(ramBottom).multiplyScalar(0.5);
      ram.rod.quaternion.setFromUnitVectors(up, ramDirection.normalize());
    }
    for (let r = 0; r < rams.length; r += 1) {
      const ram = rams[r];
      const side = Math.sign(ram.x);
      hoseEnd.set(side * 5.47, 0.16, ram.z - 0.23).applyMatrix4(moving.matrix);
      const bow = 0.34 + (6.05 - ceilingY) * 0.025;
      const flutter = Math.sin(elapsed * 8 + r) * mechanicalImpulse * 0.08;
      for (let i = 0; i < hoseSegments; i += 1) {
        pointOnHose(i / hoseSegments, hoseA, side, ram.z, bow, flutter);
        pointOnHose((i + 1) / hoseSegments, hoseB, side, ram.z, bow, flutter);
        hoseDirection.subVectors(hoseB, hoseA);
        hoseScale.set(0.047, Math.max(0.001, hoseDirection.length()) + 0.018, 0.047);
        hoseQuaternion.setFromUnitVectors(up, hoseDirection.normalize());
        hoseA.add(hoseB).multiplyScalar(0.5);
        hoseMatrix.compose(hoseA, hoseQuaternion, hoseScale);
        hoses.setMatrixAt(r * hoseSegments + i, hoseMatrix);
      }
    }
    hoses.instanceMatrix.needsUpdate = true;
    const compression = 1 - 0.215 * clamp((1.8 - moving.position.y) / 0.28, 0, 1);
    for (const stop of stops) {
      stop.spring.scale.y = compression;
      stop.shoe.position.y = 1.31 * compression;
    }
    for (const chain of chains) {
      chainPosition.set(chain.x, 0.65, chain.z).applyMatrix4(moving.matrix);
      const bottom = chainPosition.y;
      const bottomX = chainPosition.x;
      const bottomZ = chainPosition.z;
      const distance = Math.max(0.01, 6.58 - bottom);
      const count = clamp(Math.ceil(distance / 0.145), 1, 40);
      chain.mesh.count = count;
      for (let i = 0; i < count; i += 1) {
        const alpha = count === 1 ? 0 : i / (count - 1);
        const sway = Math.sin(elapsed * 6.3 + alpha * 3 + chain.x) * (0.012 * pressure + mechanicalImpulse * 0.07) * Math.sin(alpha * Math.PI);
        chainPosition.set(lerp(bottomX, chain.x, alpha) + sway, bottom + distance * alpha, lerp(bottomZ, chain.z, alpha) + sway * 0.4);
        chainQuaternion.setFromAxisAngle(up, (i % 2 ? Math.PI / 2 : 0) + sway * 2);
        dynamicChainMatrix.compose(chainPosition, chainQuaternion, chainScale);
        chain.mesh.setMatrixAt(i, dynamicChainMatrix);
      }
      chain.mesh.instanceMatrix.needsUpdate = true;
    }
    for (const pulley of pulleys) pulley.rotation.z = (6.05 - ceilingY) / 0.24;

    const gritAmount = preview ? 0.08 : 0.12 + 0.88 * smooth(0.025, 0.75, progress);
    dustMaterial.opacity = Math.min(0.72, 0.34 * gritAmount + mechanicalImpulse * 0.38);
    for (let i = 0; i < dustCount; i += 1) {
      const s = i * 5;
      const j = i * 3;
      const cycle = (elapsed * (0.12 + dustSeeds[s + 4] * 0.06) + dustSeeds[s + 2]) % 1;
      dustPositions[j] = dustSeeds[s] + Math.sin(elapsed * 0.65 + dustSeeds[s + 3]) * cycle * 0.15;
      dustPositions[j + 1] = Math.max(0.07, (ceilingY - 0.15) * (1 - cycle));
      dustPositions[j + 2] = dustSeeds[s + 1] + Math.cos(elapsed + dustSeeds[s + 3]) * cycle * 0.1;
    }
    dustGeometry.attributes.position.needsUpdate = true;

    const impact = preview ? 0 : smooth(0.94, 0.99, progress);
    impactMaterial.opacity = 0.82 * impact;
    impactMaterial.size = 0.3 + impact * 0.92;
    impactDust.visible = impact > 0.001;
    if (impact > 0) {
      for (let i = 0; i < impactCount; i += 1) {
        const s = i * 5;
        const j = i * 3;
        const spread = impact * impactSeeds[s + 3];
        impactPositions[j] = impactSeeds[s] + Math.cos(impactSeeds[s + 2]) * spread * 0.65;
        impactPositions[j + 1] = 0.09 + Math.sin(impactSeeds[s + 4] * Math.PI) * impact * 0.82;
        impactPositions[j + 2] = impactSeeds[s + 1] + Math.sin(impactSeeds[s + 2]) * spread * 0.65;
      }
      impactGeometry.attributes.position.needsUpdate = true;
    }

    actorTimer -= clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const thresholdChanged = (progress >= escapeAlarm) !== (previousProgress >= escapeAlarm);
    if (actorTimer <= 0 || state.phase !== previousPhase || progress < previousProgress || thresholdChanged) {
      commandActors(state, progress);
      actorTimer = 0.22;
    }
    // Additive reactions are event driven, not refreshed every render frame.
    // An invincible guest remains a survivor even if an erroneous set includes it.
    const reactionBeat = lurches.some(lurch => progress >= lurch.start && previousProgress < lurch.start)
      || (progress >= 0.93 && previousProgress < 0.93);
    const initialFear = progress >= 0.08 && previousProgress < 0.08;
    if (!preview && state.phase !== 'complete' && progress >= previousProgress && (reactionBeat || initialFear)) {
      for (const actor of actors) {
        if (!canCommand(actor) || actor.invincible) continue;
        actor.setReaction?.(initialFear ? 'fear' : 'brace', initialFear ? 0.58 : 0.82, initialFear ? 0.85 : 0.65);
      }
    }
    updateImpalement(clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1), state, progress);
    damageActors(clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1), state, progress, ceilingY, mechanicalImpulse);
    previousProgress = progress;
    previousPhase = state.phase;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearImpalement();
    group.remove(fixed, moving);
    for (const item of geometry) item.dispose();
    for (const item of materials) item.dispose();
    for (const item of textures) item.dispose();
    geometry.clear();
    materials.clear();
    textures.clear();
    refugeRoutes.clear();
    huddleRoutes.clear();
    squishTimes.clear();
    fixed.clear();
    moving.clear();
  }

  update(0, { progress: 0, elapsed: 0, phase: 'preview', victimIds: new Set() });
  return {
    update, dispose,
    get cinematicReady() { return impalement?.ready === true; },
    get fatalReady() { return impalement?.ready === true; },
    getFatalContact(actor) {
      const actorId = typeof actor === 'object' ? actor?.id : actor;
      return impalement?.holdPose && impalement.actorId === actorId ? contactSnapshot() : null;
    },
    get stats() { return Object.freeze({ impalement: contactSnapshot() }); },
  };
}
