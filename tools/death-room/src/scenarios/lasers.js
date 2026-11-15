import * as THREE from 'three';

// Everything is local to this scenario's group; the game owns life/death state.
export default function createScenario({ group, room, actors, quality, effects }) {
  const hw = room.halfWidth;
  const hd = room.halfDepth;
  const floor = room.floorY || 0;
  const resources = new Set();
  const own = (resource) => { resources.add(resource); return resource; };
  const geometry = {
    box: own(new THREE.BoxGeometry(1, 1, 1)),
    cylinder: own(new THREE.CylinderGeometry(1, 1, 1, 12)),
    sphere: own(new THREE.SphereGeometry(1, 12, 8)),
    ring: own(new THREE.TorusGeometry(1, 0.065, 6, 28)),
    bolt: own(new THREE.CylinderGeometry(0.027, 0.027, 0.025, 6)),
    plane: own(new THREE.PlaneGeometry(1, 1)),
  };
  const standard = (color, metalness, roughness, extra = {}) => own(new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra }));
  const additive = (color, opacity) => own(new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false,
  }));
  function beamMaterial(color, opacity, softness) {
    return own(new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: opacity }, uSoftness: { value: softness } },
      vertexShader: `varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
        void main(){vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;vNormal=normalize(normalMatrix*normal);vUv=uv;gl_Position=projectionMatrix*p;}`,
      fragmentShader: `uniform vec3 uColor; uniform float uPower,uTime,uOpacity,uSoftness; varying vec3 vNormal,vView; varying vec2 vUv;
        void main(){float facing=pow(abs(dot(normalize(vNormal),normalize(vView))),uSoftness);
        float travel=.86+.14*sin(vUv.y*85.-uTime*23.);float taper=smoothstep(0.,.025,vUv.y)*(1.-smoothstep(.975,1.,vUv.y));
        gl_FragColor=vec4(uColor*(1.+uPower*.8),facing*travel*taper*uOpacity*uPower);}`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    }));
  }
  const radialPixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const radius = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
    const offset = (y * 32 + x) * 4;
    radialPixels[offset] = radialPixels[offset + 1] = radialPixels[offset + 2] = 255;
    radialPixels[offset + 3] = Math.round(Math.exp(-radius * radius * 5.8) * Math.max(0, 1 - radius) * 255);
  }
  const radialTexture = own(new THREE.DataTexture(radialPixels, 32, 32));
  radialTexture.needsUpdate = true;
  const materials = {
    dark: standard(0x17212c, 0.88, 0.32),
    steel: standard(0x6d8290, 0.82, 0.29),
    edge: standard(0xa6b9c4, 0.91, 0.23),
    black: standard(0x080e15, 0.45, 0.62),
    yellow: standard(0xe3a52d, 0.57, 0.4),
    red: standard(0x75131d, 0.67, 0.28),
    glass: standard(0x193b47, 0.4, 0.19, { emissive: 0x136c82, emissiveIntensity: 0.65 }),
    teal: standard(0x2398a4, 0.5, 0.28, { emissive: 0x1acece, emissiveIntensity: 1.5 }),
    amber: standard(0xb86912, 0.5, 0.32, { emissive: 0xffab25, emissiveIntensity: 1.2 }),
    channel: additive(0xe93936, 0.18),
    panel: additive(0x21c9dc, 0.4),
  };
  function mesh(parent, shape, material, x, y, z, sx = 1, sy = 1, sz = 1) {
    const object = new THREE.Mesh(geometry[shape], material);
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    parent.add(object);
    return object;
  }
  const up = new THREE.Vector3(0, 1, 0);
  const forward = new THREE.Vector3(0, 0, 1);
  const delta = new THREE.Vector3();
  const muzzle = new THREE.Vector3();
  const beamDirection = new THREE.Vector3();
  const localDirection = new THREE.Vector3();
  const scratchQuaternion = new THREE.Quaternion();
  const surfaceQuaternion = new THREE.Quaternion();
  const stampTransform = new THREE.Object3D();
  const victims = [];
  const participants = [];
  const emitters = [];
  const channelNodes = [];
  const actorCueTimes = new Map();
  const reactionTimes = new Map();
  const damageLedger = new Map();
  let time = 0;
  let lastPhase = '';
  let previousProgress = 0;
  let disposed = false;

  // Recessed, armored power channels lead the eye through the chamber.
  const channelZ = [-hd + 1.7, -1.1, 2.0, hd - 1.7];
  for (let lane = 0; lane < channelZ.length; lane++) {
    const z = channelZ[lane];
    mesh(group, 'box', materials.black, 0, floor + 0.018, z, hw * 2 - 0.6, 0.03, 0.24);
    mesh(group, 'box', materials.steel, 0, floor + 0.04, z - 0.14, hw * 2 - 0.6, 0.04, 0.035);
    mesh(group, 'box', materials.steel, 0, floor + 0.04, z + 0.14, hw * 2 - 0.6, 0.04, 0.035);
    mesh(group, 'box', materials.channel, 0, floor + 0.025, z, hw * 2 - 0.7, 0.006, 0.09);
    for (let step = 0; step < 21; step++) {
      const x = -hw + 0.65 + step * (hw * 2 - 1.3) / 20;
      mesh(group, 'box', materials.dark, x, floor + 0.052, z, 0.075, 0.045, 0.26);
      const node = mesh(group, 'box', materials.teal, x + 0.12, floor + 0.052, z, 0.13, 0.025, 0.045);
      channelNodes.push({ node, lane, step });
    }
  }
  // Back-wall control cabinet, heat sink slots, diagnostic lights and hazard trim.
  const cabinet = new THREE.Group();
  cabinet.position.set(0, floor + 3.8, -hd + 0.25);
  group.add(cabinet);
  mesh(cabinet, 'box', materials.dark, 0, 0, 0, 2.3, 1.0, 0.32);
  mesh(cabinet, 'box', materials.steel, 0, 0.46, 0.18, 2.38, 0.05, 0.09);
  mesh(cabinet, 'box', materials.steel, 0, -0.46, 0.18, 2.38, 0.05, 0.09);
  mesh(cabinet, 'box', materials.glass, -0.35, 0.06, 0.17, 1.12, 0.54, 0.028);
  for (let i = 0; i < 7; i++) {
    mesh(cabinet, 'box', materials.panel, -0.8 + i * 0.145, -0.10, 0.19, 0.055, 0.09 + (i % 3) * 0.10, 0.012);
    mesh(cabinet, 'box', materials.black, 0.55, -0.30 + i * 0.09, 0.18, 0.60, 0.035, 0.04);
  }
  for (let i = 0; i < 3; i++) mesh(cabinet, 'sphere', materials.teal, -0.72 + i * 0.24, -0.35, 0.19, 0.04, 0.04, 0.02);

  const DASHES = 22;
  const sparkCount = quality === 'low' ? 6 : 10;
  function addEmitter(side, station, x, y, z, ordinal) {
    const inward = new THREE.Vector3(side === 'left' ? 1 : side === 'right' ? -1 : 0, 0, side === 'back' ? 1 : 0);
    const mount = new THREE.Group();
    mount.name = `laser-rail-${ordinal}`;
    mount.position.set(x, y, z);
    mount.quaternion.setFromUnitVectors(forward, inward);
    group.add(mount);
    // A long sliding rail makes the moving weapon a physical machine.
    mesh(mount, 'box', materials.black, 0, 0, -0.14, 0.54, 3.2, 0.12);
    for (const sign of [-1, 1]) {
      mesh(mount, 'box', materials.steel, sign * 0.24, 0, -0.03, 0.065, 3.3, 0.13);
      mesh(mount, 'box', materials.yellow, sign * 0.24, 1.52, 0.05, 0.11, 0.16, 0.05);
      mesh(mount, 'box', materials.yellow, sign * 0.24, -1.52, 0.05, 0.11, 0.16, 0.05);
    }
    for (let i = 0; i < 12; i++) mesh(mount, 'box', materials.dark, 0, -1.37 + i * 0.25, -0.03, 0.32, 0.055, 0.13);
    const carriage = new THREE.Group();
    mount.add(carriage);
    mesh(carriage, 'box', materials.steel, 0, 0, 0.04, 0.65, 0.55, 0.22);
    mesh(carriage, 'box', materials.dark, 0, 0, 0.19, 0.53, 0.43, 0.14);
    for (const px of [-0.25, 0.25]) for (const py of [-0.19, 0.19]) {
      const bolt = mesh(carriage, 'bolt', materials.edge, px, py, 0.17);
      bolt.rotation.x = Math.PI / 2;
    }
    const yawRig = new THREE.Group();
    yawRig.name = `laser-yaw-yoke-${ordinal}`;
    yawRig.position.z = 0.28;
    carriage.add(yawRig);
    for (const sign of [-1, 1]) {
      mesh(yawRig, 'box', materials.steel, sign * 0.35, -0.10, -0.035, 0.09, 0.34, 0.22);
      const bearing = mesh(yawRig, 'cylinder', materials.edge, sign * 0.38, 0, 0, 0.11, 0.08, 0.11);
      bearing.rotation.z = Math.PI / 2;
      const cap = mesh(yawRig, 'cylinder', materials.yellow, sign * 0.425, 0, 0, 0.065, 0.025, 0.065);
      cap.rotation.z = Math.PI / 2;
    }
    mesh(yawRig, 'box', materials.dark, 0, -0.27, -0.03, 0.78, 0.10, 0.26);
    const pivot = new THREE.Group();
    pivot.name = `laser-emitter-${ordinal}`;
    group.add(pivot);
    mesh(pivot, 'sphere', materials.dark, 0, 0, -0.03, 0.32, 0.32, 0.29);
    const gimbal = mesh(pivot, 'ring', materials.steel, 0, 0, 0.02, 0.36, 0.36, 0.36);
    gimbal.rotation.y = Math.PI / 2;
    const barrel = mesh(pivot, 'cylinder', materials.dark, 0, 0, 0.25, 0.19, 0.54, 0.19);
    barrel.rotation.x = Math.PI / 2;
    for (const bz of [0.06, 0.21, 0.37, 0.48]) mesh(pivot, 'ring', materials.edge, 0, 0, bz, 0.20, 0.20, 0.20);
    for (let fin = 0; fin < 6; fin++) {
      const angle = fin * Math.PI / 3;
      const rib = mesh(pivot, 'box', materials.steel, Math.sin(angle) * 0.19, Math.cos(angle) * 0.19, 0.25, 0.045, 0.07, 0.34);
      rib.rotation.z = -angle;
    }
    mesh(pivot, 'ring', materials.red, 0, 0, 0.53, 0.21, 0.21, 0.21);
    const lensMaterial = standard(0xc42922, 0.3, 0.15, { emissive: 0xff281b, emissiveIntensity: 1.5 });
    const lens = mesh(pivot, 'sphere', lensMaterial, 0, 0, 0.53, 0.14, 0.14, 0.04);
    const indicator = mesh(pivot, 'box', materials.amber, 0, 0.25, 0.12, 0.1, 0.045, 0.22);

    const coreMat = additive(0xffe0b9, 0.98);
    coreMat.color.setRGB(2.8, 1.05, 0.64);
    const shellMat = beamMaterial(0xff382a, 0.34, 1.25);
    const auraMat = beamMaterial(0xff3019, 0.13, 2.4);
    const core = mesh(group, 'cylinder', coreMat, 0, 0, 0);
    core.name = `laser-core-${ordinal}`;
    const shell = mesh(group, 'cylinder', shellMat, 0, 0, 0);
    const aura = mesh(group, 'cylinder', auraMat, 0, 0, 0);
    shell.name = `laser-envelope-${ordinal}`;
    aura.name = `laser-aura-${ordinal}`;
    core.renderOrder = 4;
    shell.renderOrder = 3;
    aura.renderOrder = 2;
    const dashPositions = new Float32Array(DASHES * 6);
    const dashGeometry = own(new THREE.BufferGeometry());
    dashGeometry.setAttribute('position', new THREE.BufferAttribute(dashPositions, 3).setUsage(THREE.DynamicDrawUsage));
    const dashMaterial = own(new THREE.LineBasicMaterial({ color: 0xffbd3b, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    const warning = new THREE.LineSegments(dashGeometry, dashMaterial);
    warning.name = `laser-warning-${ordinal}`;
    warning.frustumCulled = false;
    group.add(warning);
    const impactMat = additive(0xff7945, 0.7);
    const impact = mesh(group, 'sphere', impactMat, 0, 0, 0, 0.11, 0.11, 0.11);
    const impactRingMat = additive(0xff4a33, 0.4);
    const impactRing = mesh(group, 'ring', impactRingMat, 0, 0, 0, 0.18, 0.18, 0.18);
    const glowMat = own(new THREE.MeshBasicMaterial({ color: 0xff5c24, map: radialTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const surfaceGlow = mesh(group, 'plane', glowMat, 0, 0, 0, 0.85, 0.85, 1);
    surfaceGlow.name = `laser-surface-glow-${ordinal}`;
    const flareMaterial = own(new THREE.SpriteMaterial({ color: 0xff9e50, map: radialTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const muzzleFlare = new THREE.Sprite(flareMaterial);
    muzzleFlare.position.z = 0.56;
    pivot.add(muzzleFlare);
    const source = new THREE.Vector3(x, y, z).addScaledVector(inward, 0.28);
    const end = new THREE.Vector3();
    const normal = side === 'back' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(side === 'left' ? -1 : 1, 0, 0);
    emitters.push({ side, station, ordinal, y, mount, carriage, yawRig, pivot, source, end, inward, normal, start: new THREE.Vector3(), idealEnd: new THREE.Vector3(), initialized: false, core, shell, aura, warning, dashGeometry, dashPositions, dashMaterial, lens, lensMaterial, indicator, impact, impactRing, impactMat, impactRingMat, surfaceGlow, glowMat, muzzleFlare, flareMaterial, lastScorch: -100, active: 0, threat: 0 });
  }
  let ordinal = 0;
  for (let station = 0; station < 4; station++) {
    const z = channelZ[station];
    addEmitter('left', station, -hw + 0.28, floor + 2.2 + (station % 2) * 0.55, z, ordinal++);
    addEmitter('right', station, hw - 0.28, floor + 2.65 - (station % 2) * 0.4, z, ordinal++);
  }
  for (let station = 0; station < 4; station++) addEmitter('back', station, -4.6 + station * 3.05, floor + 2.25 + (station % 2) * 0.9, -hd + 0.28, ordinal++);

  // Tiny additive sprite sparks are machine light, never blood or body debris.
  const spritePixels = new Uint8Array(16 * 16 * 4);
  for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
    const d = Math.hypot((px - 7.5) / 7.5, (py - 7.5) / 7.5);
    const i = (py * 16 + px) * 4;
    spritePixels[i] = spritePixels[i + 1] = spritePixels[i + 2] = 255;
    spritePixels[i + 3] = Math.round(Math.max(0, 1 - d) ** 2 * 255);
  }
  const spriteTexture = own(new THREE.DataTexture(spritePixels, 16, 16));
  spriteTexture.needsUpdate = true;
  const particlePositions = new Float32Array(emitters.length * sparkCount * 3);
  const particleColors = new Float32Array(particlePositions.length);
  const particleGeometry = own(new THREE.BufferGeometry());
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3).setUsage(THREE.DynamicDrawUsage));
  const particleMaterial = own(new THREE.PointsMaterial({ size: 0.13, map: spriteTexture, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const sparks = new THREE.Points(particleGeometry, particleMaterial);
  sparks.name = 'laser-impact-sparks';
  sparks.frustumCulled = false;
  group.add(sparks);
  const sparkTrails = new Float32Array(particlePositions.length * 2);
  const sparkTrailColors = new Float32Array(sparkTrails.length);
  const trailGeometry = own(new THREE.BufferGeometry());
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(sparkTrails, 3).setUsage(THREE.DynamicDrawUsage));
  trailGeometry.setAttribute('color', new THREE.BufferAttribute(sparkTrailColors, 3).setUsage(THREE.DynamicDrawUsage));
  const trailMaterial = own(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const trails = new THREE.LineSegments(trailGeometry, trailMaterial);
  trails.name = 'laser-spark-streaks';
  trails.frustumCulled = false;
  group.add(trails);

  // Persistent marks are placed only on room surfaces, never on a participant.
  const STAMPS = quality === 'low' ? 48 : 96;
  const stampGeometry = own(new THREE.PlaneGeometry(1, 1));
  const stampBirths = new Float32Array(STAMPS).fill(-100);
  stampGeometry.setAttribute('aBirth', new THREE.InstancedBufferAttribute(stampBirths, 1).setUsage(THREE.DynamicDrawUsage));
  const scorchMaterial = own(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float aBirth;uniform float uTime;varying vec2 vUv;varying float vAge;
      void main(){vUv=uv;vAge=uTime-aBirth;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;varying float vAge;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float noise=hash(floor(vUv*40.));
        float edge=1.-smoothstep(.48+noise*.10,.94,r);float fade=1.-smoothstep(5.,8.,vAge);
        float ember=exp(-vAge*2.2)*exp(-pow((r-.48)*10.,2.));vec3 ash=vec3(.013,.009,.006);
        gl_FragColor=vec4(ash+vec3(1.5,.29,.035)*ember,edge*fade*.72);}`,
    transparent: true, depthWrite: false, toneMapped: false,
  }));
  const scorchMarks = own(new THREE.InstancedMesh(stampGeometry, scorchMaterial, STAMPS));
  scorchMarks.name = 'laser-surface-scorch-marks';
  scorchMarks.frustumCulled = false;
  scorchMarks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < STAMPS; i++) {
    stampTransform.position.set(0, -5, 0);
    stampTransform.scale.setScalar(0.001);
    stampTransform.updateMatrix();
    scorchMarks.setMatrixAt(i, stampTransform.matrix);
  }
  group.add(scorchMarks);
  let stampIndex = 0;
  function leaveScorch(emitter, power) {
    stampTransform.position.copy(emitter.end).addScaledVector(emitter.normal, 0.014);
    stampTransform.quaternion.setFromUnitVectors(forward, emitter.normal);
    surfaceQuaternion.setFromAxisAngle(forward, Math.sin(stampIndex * 2.399) * 0.65);
    stampTransform.quaternion.multiply(surfaceQuaternion);
    stampTransform.scale.set(0.18 + power * 0.13, 0.29 + power * 0.17, 1);
    stampTransform.updateMatrix();
    scorchMarks.setMatrixAt(stampIndex, stampTransform.matrix);
    stampBirths[stampIndex] = time;
    stampIndex = (stampIndex + 1) % STAMPS;
    scorchMarks.instanceMatrix.needsUpdate = true;
    stampGeometry.attributes.aBirth.needsUpdate = true;
    emitter.lastScorch = time;
  }

  // Reticles are pooled; one marks every selected actor without touching its rig.
  const targetPool = [];
  const targetMaterial = additive(0xff4231, 0.75);
  const targetFillMaterial = additive(0xff371f, 0.07);
  for (let i = 0; i < 50; i++) {
    const reticle = new THREE.Group();
    reticle.visible = false;
    group.add(reticle);
    const ring = mesh(reticle, 'ring', targetMaterial, 0, 0, 0, 0.47, 0.47, 0.47);
    ring.rotation.x = Math.PI / 2;
    const fill = mesh(reticle, 'cylinder', targetFillMaterial, 0, -0.012, 0, 0.43, 0.008, 0.43);
    for (let tick = 0; tick < 4; tick++) {
      const angle = tick * Math.PI / 2;
      const mark = mesh(reticle, 'box', targetMaterial, Math.sin(angle) * 0.59, 0, Math.cos(angle) * 0.59, 0.045, 0.012, 0.19);
      mark.rotation.y = angle;
    }
    targetPool.push({ reticle, ring, fill });
  }

  // Batch repeated hardware while preserving the independently animated parts.
  function instanceHardware(parent, excluded = new Set()) {
    const batches = new Map();
    for (const child of parent.children) {
      if (!child.isMesh || child.isInstancedMesh || excluded.has(child)) continue;
      const key = `${child.geometry.uuid}/${child.material.uuid}`;
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(child);
    }
    for (const batch of batches.values()) {
      if (batch.length < 2) continue;
      const instanced = own(new THREE.InstancedMesh(batch[0].geometry, batch[0].material, batch.length));
      for (let i = 0; i < batch.length; i++) {
        batch[i].updateMatrix();
        instanced.setMatrixAt(i, batch[i].matrix);
        parent.remove(batch[i]);
      }
      instanced.computeBoundingSphere();
      parent.add(instanced);
    }
  }
  const animatedMeshes = new Set(channelNodes.map(({ node }) => node));
  for (const emitter of emitters) {
    for (const item of [emitter.core, emitter.shell, emitter.aura, emitter.impact, emitter.impactRing, emitter.surfaceGlow]) animatedMeshes.add(item);
    instanceHardware(emitter.mount);
    instanceHardware(emitter.carriage);
    instanceHardware(emitter.yawRig);
    instanceHardware(emitter.pivot, new Set([emitter.lens, emitter.indicator]));
  }
  instanceHardware(cabinet);
  instanceHardware(group, animatedMeshes);
  for (const item of targetPool) instanceHardware(item.reticle);

  const clamp = THREE.MathUtils.clamp;
  const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);
  function placeBeam(object, width, length, visible) {
    object.visible = visible;
    object.position.copy(muzzle).addScaledVector(delta, length * 0.5);
    object.quaternion.setFromUnitVectors(up, delta);
    object.scale.set(width, length, width);
  }
  const isChosen = (actor, state) => !actor.invincible && actor.id !== 'vip-456'
    && (state.victimIds ? state.victimIds.has(actor.id) : actor.isVictim);
  function selectVictims(state) {
    victims.length = 0;
    participants.length = 0;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      if (actor.alive !== false && !actor.invincible && actor.id !== 'vip-456') participants.push(actor);
      if (isChosen(actor, state)) victims.push(actor);
    }
  }
  function poseActors(state, progress) {
    if (state.phase !== 'running' && state.phase !== 'reveal') return;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      if (!actor.alive) continue;
      const oldTime = actorCueTimes.get(actor.id) ?? -100;
      if (time - oldTime < 0.65) continue;
      // Every participant keeps escaping independently. Shared health and main
      // decide fatality; this module never pins or walks a chosen actor into fire.
      if (progress > 0.025 && progress < 0.98) {
        actor.setAction?.('run');
        if (Math.floor(time / 2.3) % 2 === 0) {
          const bounds = state.bounds || { minX: -hw + 0.8, maxX: hw - 0.8, minZ: -hd + 0.8, maxZ: hd - 0.8 };
          const x = clamp(Math.sin(i * 2.399 + time * 0.52) * (hw - 1.2), bounds.minX, bounds.maxX);
          const z = clamp(Math.cos(i * 1.79 + time * 0.44) * (hd - 1.1), bounds.minZ, bounds.maxZ);
          actor.setTarget?.(x, z);
        }
      } else if (progress >= 0.98) {
        actor.setAction?.('crouch');
      }
      actorCueTimes.set(actor.id, time);
    }
  }
  function reactActors(state, progress) {
    if (state.phase !== 'running' && state.phase !== 'reveal') return;
    for (const actor of actors) {
      if (!actor.alive || time - (reactionTimes.get(actor.id) ?? -100) < 0.85) continue;
      let nearest = null;
      let closest = 1.42;
      let beamY = 0;
      for (const emitter of emitters) {
        if (emitter.threat < 0.15) continue;
        const vx = emitter.end.x - emitter.start.x;
        const vy = emitter.end.y - emitter.start.y;
        const vz = emitter.end.z - emitter.start.z;
        const px = actor.position.x - emitter.start.x;
        const py = floor + 1.05 - emitter.start.y;
        const pz = actor.position.z - emitter.start.z;
        const t = clamp((px * vx + py * vy + pz * vz) / Math.max(0.01, vx * vx + vy * vy + vz * vz), 0, 1);
        const distance = Math.hypot(px - vx * t, py - vy * t, pz - vz * t);
        if (distance < closest) { closest = distance; nearest = emitter; beamY = emitter.start.y + vy * t; }
      }
      if (!nearest) continue;
      const intensity = clamp(1.15 - closest * 0.45, 0.3, 1);
      actor.setReaction?.('dodge', intensity, 0.55 + intensity * 0.25);
      actor.setAction?.(beamY > floor + 0.85 ? 'crouch' : 'run');
      if (progress < 0.99) {
        const vx = nearest.end.x - nearest.start.x;
        const vz = nearest.end.z - nearest.start.z;
        const length = Math.max(0.01, Math.hypot(vx, vz));
        const side = (actor.position.x - nearest.start.x) * vz - (actor.position.z - nearest.start.z) * vx >= 0 ? 1 : -1;
        const bounds = state.bounds;
        actor.setTarget?.(
          clamp(actor.position.x + side * vz / length * 1.15, bounds?.minX ?? -hw + 0.8, bounds?.maxX ?? hw - 0.8),
          clamp(actor.position.z - side * vx / length * 1.15, bounds?.minZ ?? -hd + 0.8, bounds?.maxZ ?? hd - 0.8),
        );
      }
      reactionTimes.set(actor.id, time);
    }
  }

  // Aim through a moving subject to a real chamber boundary. These rays can
  // glance other people on the way; damage is measured against the rendered ray.
  function traceAim(emitter, x, y, z) {
    const vx = x - emitter.source.x, vy = y - emitter.source.y, vz = z - emitter.source.z;
    let distance = Infinity;
    emitter.normal.set(0, 1, 0);
    emitter.boundary = 'floor';
    if (Math.abs(vx) > 0.0001) {
      const t = ((vx > 0 ? hw - 0.028 : -hw + 0.028) - emitter.source.x) / vx;
      if (t > 0 && t < distance) { distance = t; emitter.normal.set(vx > 0 ? -1 : 1, 0, 0); emitter.boundary = 'wall'; }
    }
    if (Math.abs(vz) > 0.0001) {
      const t = ((vz > 0 ? hd - 0.12 : -hd + 0.028) - emitter.source.z) / vz;
      if (t > 0 && t < distance) { distance = t; emitter.normal.set(0, 0, vz > 0 ? -1 : 1); emitter.boundary = vz > 0 ? 'open' : 'wall'; }
    }
    if (Math.abs(vy) > 0.0001) {
      const t = ((vy > 0 ? room.height - 0.04 : floor + 0.028) - emitter.source.y) / vy;
      if (t > 0 && t < distance) { distance = t; emitter.normal.set(0, vy > 0 ? -1 : 1, 0); emitter.boundary = vy > 0 ? 'open' : 'floor'; }
    }
    if (!Number.isFinite(distance)) distance = 1;
    emitter.idealEnd.set(emitter.source.x + vx * distance, emitter.source.y + vy * distance, emitter.source.z + vz * distance);
  }

  function damageActors(step, state, progress) {
    if (step <= 0 || (state.phase !== 'running' && state.phase !== 'reveal')) return;
    // Declared HP doses are literal; keep the injury arc comparable across the
    // 10/20/30-second room settings. Only shared health applies vulnerability.
    const configuredDuration = state.durationSeconds ?? state.duration ?? state.roundDuration;
    const roundSeconds = Number.isFinite(configuredDuration) && configuredDuration > 0
      ? clamp(configuredDuration, 5, 120)
      : progress > 0.02 && state.elapsed > 0 ? clamp(state.elapsed / progress, 10, 60) : 20;
    const exposureRate = (12 + progress * 7) * 20 / roundSeconds;
    for (const actor of participants) {
      let record = damageLedger.get(actor.id);
      if (!record) {
        record = { amount: 0, intensity: 0, emitTime: time, reactionTime: -100, impactTime: -100, x: 0, y: 0, z: 0, distance: Infinity };
        damageLedger.set(actor.id, record);
      }
      let strongest = 0;
      let hitX = 0, hitY = 0, hitZ = 0, hitDistance = Infinity;
      const crouching = actor.action === 'crouch';
      const actorBase = Number.isFinite(actor.position.y) ? actor.position.y : floor;
      for (const emitter of emitters) {
        if (emitter.active < 0.025) continue;
        const vx = emitter.end.x - emitter.start.x, vy = emitter.end.y - emitter.start.y, vz = emitter.end.z - emitter.start.z;
        const lengthSq = Math.max(0.001, vx * vx + vy * vy + vz * vz);
        // Three overlapping body capsules include knees, torso and shoulders.
        for (let sample = 0; sample < 3; sample++) {
          const sampleY = actorBase + (crouching ? 0.34 + sample * 0.30 : 0.42 + sample * 0.47);
          const px = actor.position.x - emitter.start.x, py = sampleY - emitter.start.y, pz = actor.position.z - emitter.start.z;
          const t = clamp((px * vx + py * vy + pz * vz) / lengthSq, 0, 1);
          const x = emitter.start.x + vx * t, y = emitter.start.y + vy * t, z = emitter.start.z + vz * t;
          const distance = Math.hypot(actor.position.x - x, sampleY - y, actor.position.z - z);
          // A narrow thermal halo allows visible grazing burns; a warning ray
          // or an unrelated room location never counts as laser contact.
          const proximity = 1 - smooth(0.24, 0.68, distance);
          const strength = proximity * emitter.active;
          if (strength > strongest) { strongest = strength; hitX = x; hitY = y; hitZ = z; hitDistance = distance; }
        }
      }
      if (strongest > 0.015) {
        record.amount += exposureRate * strongest * step;
        record.intensity = Math.max(record.intensity, strongest);
        record.x = hitX; record.y = hitY; record.z = hitZ; record.distance = hitDistance;
        if (time - record.reactionTime > 0.62 && strongest > 0.22) {
          actor.setReaction?.('heat', 0.25 + strongest * 0.65, 0.55);
          actor.setSquish?.('impact', 0.14 + strongest * 0.19, 0.22);
          record.reactionTime = time;
        }
        if (hitDistance < 0.30 && strongest > 0.35 && time - record.impactTime > 1.1) {
          // Central effects own the small wet contact, wounds and audio. This
          // native visual hit adds zero HP damage: the dose is emitted below.
          effects?.emit?.('impact', {
            actorId: actor.id, kind: 'laser', damage: 0,
            position: [hitX, hitY, hitZ], direction: [actor.position.x - hitX, 0.18, actor.position.z - hitZ],
            intensity: 0.25 + strongest * 0.29, invincible: false, fatal: false, squishApplied: true,
            contactDistance: hitDistance,
          });
          record.impactTime = time;
        }
      }
      if (record.amount > 0 && time - record.emitTime >= 0.16) {
        effects?.emit?.('damage', {
          actorId: actor.id, kind: 'laser', amount: record.amount,
          position: [record.x, record.y, record.z], intensity: clamp(record.intensity, 0, 1), invincible: false,
          contactDistance: record.distance,
        });
        record.amount = 0; record.intensity = 0; record.emitTime = time;
      }
    }
  }

  function update(dt, state) {
    if (disposed) return;
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    time += step;
    const preview = state.phase === 'preview';
    const progress = clamp(Number.isFinite(state.progress) ? state.progress : 0, 0, 1);
    if (lastPhase !== state.phase || progress < previousProgress - 0.2) {
      actorCueTimes.clear();
      reactionTimes.clear();
      if (state.phase === 'preview' || progress < previousProgress - 0.2) {
        stampBirths.fill(-100);
        stampGeometry.attributes.aBirth.needsUpdate = true;
        for (const emitter of emitters) emitter.initialized = false;
        damageLedger.clear();
      }
    }
    lastPhase = state.phase;
    previousProgress = progress;
    selectVictims(state);
    poseActors(state, progress);
    const lock = preview ? 0 : smooth(0.91, 0.99, progress);
    const finale = preview ? 0 : smooth(0.94, 1, progress);
    const complete = state.phase === 'complete';
    const activity = complete ? 0.08 : 1;
    const speed = 0.46 + progress * 1.1;
    const pulseClock = time * speed;
    scorchMaterial.uniforms.uTime.value = time;

    materials.channel.opacity = 0.13 + progress * 0.21 + Math.sin(time * 3.5) * 0.025;
    materials.panel.opacity = 0.3 + Math.sin(time * 2.5) * 0.15;
    for (const entry of channelNodes) {
      const chase = (entry.step - Math.floor(time * (3.5 + progress * 6)) + entry.lane * 4 + 1000) % 12;
      entry.node.visible = chase < 4;
      entry.node.material = progress > 0.70 && !preview ? materials.amber : materials.teal;
    }
    for (let i = 0; i < targetPool.length; i++) {
      const item = targetPool[i];
      const actor = victims[i];
      item.reticle.visible = Boolean(actor && lock > 0.015 && !complete);
      if (!item.reticle.visible) continue;
      item.reticle.position.set(actor.position.x, floor + 0.045, actor.position.z);
      item.reticle.rotation.y = time * 0.65 * (i % 2 ? -1 : 1);
      const size = (0.95 + Math.sin(time * 8) * 0.055) * (1 + (1 - lock) * 1.4);
      item.reticle.scale.setScalar(size);
    }
    targetMaterial.opacity = 0.25 + lock * (0.45 + Math.sin(time * 9) * 0.17);

    for (let i = 0; i < emitters.length; i++) {
      const e = emitters[i];
      const sweep = Math.sin(time * (0.45 + progress * 0.75) + i * 0.73);
      const vertical = Math.sin(time * 0.67 + i * 1.13) * (0.30 + progress * 0.22);
      e.carriage.position.y += (vertical - e.carriage.position.y) * (e.initialized ? 1 - Math.exp(-step * 5.8) : 1);
      e.source.y = e.y + e.carriage.position.y;
      e.pivot.position.copy(e.source);
      e.boundary = e.side === 'back' ? 'floor' : 'wall';
      e.normal.set(e.side === 'left' ? -1 : e.side === 'right' ? 1 : 0, e.side === 'back' ? 1 : 0, 0);
      if (e.side === 'back') {
        e.idealEnd.set(clamp(e.source.x + sweep * 3.5, -hw + 0.5, hw - 0.5), floor + 0.028, hd - 1.0 - (Math.sin(time * 0.39 + i) + 1) * 0.75);
      } else {
        e.idealEnd.set(e.side === 'left' ? hw - 0.028 : -hw + 0.028, floor + 0.48 + (e.station % 3) * 0.7 + (sweep + 1) * 0.32, clamp(channelZ[e.station] + sweep * (0.9 + progress * 2.25), -hd + 0.5, hd - 0.5));
      }
      const classTarget = !preview && i < 8 && participants.length ? participants[i % participants.length] : null;
      if (classTarget) {
        const vx = classTarget.position.x - e.source.x, vz = classTarget.position.z - e.source.z;
        const planLength = Math.max(0.1, Math.hypot(vx, vz));
        const glance = Math.sin(time * (1.1 + progress * 0.7) + i * 1.31) * 0.48;
        traceAim(e,
          classTarget.position.x - vz / planLength * glance,
          floor + 0.92 + Math.sin(time * 0.95 + i * 0.7) * 0.29,
          classTarget.position.z + vx / planLength * glance,
        );
      }
      const target = victims.length ? victims[i % victims.length] : null;
      if (target && lock > 0) {
        const targetY = floor + 0.82 + (i % 3) * 0.23;
        e.idealEnd.x += (target.position.x - e.idealEnd.x) * lock;
        e.idealEnd.y += (targetY - e.idealEnd.y) * lock;
        e.idealEnd.z += (target.position.z - e.idealEnd.z) * lock;
      }
      e.end.lerp(e.idealEnd, !e.initialized || classTarget || lock >= 0.99 ? 1 : 1 - Math.exp(-step * (7 + progress * 8)));
      e.initialized = true;
      beamDirection.subVectors(e.end, e.source).normalize();
      e.pivot.quaternion.setFromUnitVectors(forward, beamDirection);
      scratchQuaternion.copy(e.mount.quaternion).invert();
      localDirection.copy(beamDirection).applyQuaternion(scratchQuaternion);
      e.yawRig.rotation.y = Math.atan2(localDirection.x, localDirection.z);
      muzzle.copy(e.source).addScaledVector(beamDirection, 0.57);
      e.start.copy(muzzle);
      delta.subVectors(e.end, muzzle);
      const length = delta.length();
      delta.multiplyScalar(1 / Math.max(0.001, length));
      const cycle = (pulseClock + i * 0.157) % 1;
      const enabled = progress > 0.025 + (i % 4) * 0.008 || preview;
      let warning = enabled && cycle < 0.42 ? Math.sin(cycle / 0.42 * Math.PI) : 0;
      let firing = enabled && cycle >= 0.42 && cycle < 0.72 ? Math.min(1, (cycle - 0.42) * 25, (0.72 - cycle) * 22) : 0;
      // The last beat has a readable warning lock followed by simultaneous crossfire.
      if (lock > 0.05) {
        warning = progress < 0.97 ? 0.55 + Math.sin(time * 11) * 0.25 : 0;
        firing *= 1 - lock;
        if (progress >= 0.97) firing = 0.65 + Math.sin(time * 19 + i * 0.6) * 0.23;
      }
      firing *= activity;
      warning *= complete ? 0 : 1;
      e.active = firing;
      e.threat = Math.max(firing, warning * 0.65);
      const radius = (0.012 + progress * 0.008 + finale * 0.009) * (0.85 + firing * 0.15);
      placeBeam(e.core, radius, length, firing > 0.015);
      placeBeam(e.shell, radius * 3.2, length, firing > 0.015);
      placeBeam(e.aura, radius * 8.5, length, firing > 0.015);
      e.core.material.opacity = firing * 0.95;
      e.shell.material.uniforms.uPower.value = firing;
      e.shell.material.uniforms.uTime.value = time;
      e.aura.material.uniforms.uPower.value = firing;
      e.aura.material.uniforms.uTime.value = time;
      e.flareMaterial.opacity = warning * 0.22 + firing * 0.9;
      e.muzzleFlare.scale.setScalar(0.30 + firing * 0.35);
      e.lensMaterial.emissiveIntensity = 0.7 + warning * 2 + firing * 5;
      e.indicator.material = firing > 0.05 ? materials.red : warning > 0.05 ? materials.amber : materials.teal;
      e.warning.visible = warning > 0.01;
      e.dashMaterial.opacity = warning * 0.85;
      if (e.warning.visible) {
        for (let dash = 0; dash < DASHES; dash++) {
          const a = dash / DASHES;
          const b = (dash + 0.53) / DASHES;
          const offset = dash * 6;
          e.dashPositions[offset] = muzzle.x + (e.end.x - muzzle.x) * a;
          e.dashPositions[offset + 1] = muzzle.y + (e.end.y - muzzle.y) * a;
          e.dashPositions[offset + 2] = muzzle.z + (e.end.z - muzzle.z) * a;
          e.dashPositions[offset + 3] = muzzle.x + (e.end.x - muzzle.x) * b;
          e.dashPositions[offset + 4] = muzzle.y + (e.end.y - muzzle.y) * b;
          e.dashPositions[offset + 5] = muzzle.z + (e.end.z - muzzle.z) * b;
        }
        e.dashGeometry.attributes.position.needsUpdate = true;
      }
      e.impact.visible = e.impactRing.visible = firing > 0.015;
      e.impact.position.copy(e.end);
      e.impact.scale.setScalar((0.06 + firing * 0.065) * (1 + finale * 0.8));
      e.impactMat.opacity = firing * 0.85;
      e.impactRing.position.copy(e.end);
      e.impactRing.quaternion.setFromUnitVectors(forward, beamDirection);
      e.impactRing.scale.setScalar(0.10 + ((time * 2 + i * 0.2) % 1) * 0.19);
      e.impactRingMat.opacity = firing * 0.4;
      const surfaceHit = (!target || lock < 0.001) && e.boundary !== 'open';
      e.surfaceGlow.visible = surfaceHit && firing > 0.015;
      e.surfaceGlow.position.copy(e.end).addScaledVector(e.normal, 0.018);
      e.surfaceGlow.quaternion.setFromUnitVectors(forward, e.normal);
      e.surfaceGlow.scale.setScalar(0.85 + firing * 0.60);
      e.glowMat.opacity = firing * 0.7;
      if (surfaceHit && firing > 0.35 && time - e.lastScorch > 0.22 && !complete) leaveScorch(e, firing);
      const nx = surfaceHit ? e.normal.x : -beamDirection.x;
      const ny = surfaceHit ? e.normal.y : -beamDirection.y;
      const nz = surfaceHit ? e.normal.z : -beamDirection.z;
      for (let spark = 0; spark < sparkCount; spark++) {
        const p = (i * sparkCount + spark) * 3;
        const age = (time * (1.6 + (spark % 3) * 0.2) + spark * 0.618 + i * 0.231) % 1;
        const angle = spark * 2.399 + i * 1.71;
        const rx = Math.cos(angle), ry = 0.35 + (spark % 3) * 0.13, rz = Math.sin(angle);
        const dot = rx * nx + ry * ny + rz * nz;
        const outward = 0.38 + (spark % 4) * 0.13;
        const vx = (rx - nx * dot) * 0.42 + nx * outward;
        const vy = (ry - ny * dot) * 0.42 + ny * outward + 0.30;
        const vz = (rz - nz * dot) * 0.42 + nz * outward;
        const ageTail = Math.max(0, age - 0.065);
        particlePositions[p] = e.end.x + vx * age;
        particlePositions[p + 1] = Math.max(floor + 0.035, e.end.y + vy * age - age * age * 0.55);
        particlePositions[p + 2] = e.end.z + vz * age;
        const brightness = firing * (1 - age) ** 2 * 1.8;
        particleColors[p] = brightness;
        particleColors[p + 1] = brightness * (0.30 + 0.55 * (1 - age));
        particleColors[p + 2] = brightness * 0.18;
        const trail = p * 2;
        sparkTrails[trail] = particlePositions[p];
        sparkTrails[trail + 1] = particlePositions[p + 1];
        sparkTrails[trail + 2] = particlePositions[p + 2];
        sparkTrails[trail + 3] = e.end.x + vx * ageTail;
        sparkTrails[trail + 4] = Math.max(floor + 0.035, e.end.y + vy * ageTail - ageTail * ageTail * 0.55);
        sparkTrails[trail + 5] = e.end.z + vz * ageTail;
        sparkTrailColors[trail] = brightness;
        sparkTrailColors[trail + 1] = brightness * 0.50;
        sparkTrailColors[trail + 2] = brightness * 0.12;
        sparkTrailColors[trail + 3] = brightness * 0.12;
        sparkTrailColors[trail + 4] = brightness * 0.035;
        sparkTrailColors[trail + 5] = 0;
      }
    }
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
    sparks.visible = trails.visible = !complete;
    damageActors(step, state, progress);
    reactActors(state, progress);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    group.clear();
    for (const resource of resources) resource.dispose();
    resources.clear();
    actorCueTimes.clear();
    reactionTimes.clear();
    damageLedger.clear();
  }
  // Avoid showing construction-time unit beams before the first integration tick.
  update(0, { phase: 'preview', progress: 0, victimIds: new Set() });
  return { update, dispose };
}
