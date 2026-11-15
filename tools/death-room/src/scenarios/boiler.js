import * as THREE from 'three';

// A pressurised, coal-fired plant room. All moving parts and effects belong to
// the supplied group; the coordinator retains ownership of the human figures.
export default function createScenario(ctx) {
  const { group } = ctx;
  const TAU = Math.PI * 2;
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const dummy = new THREE.Object3D();
  const boltMatrices = [];
  const rotors = [];
  const gauges = [];
  const reliefStems = [];
  const steamJets = [];
  const floorPlates = [];
  const actorExposure = new Map();
  const lowQuality = ctx.quality === 'low';
  const heatUniforms = { uTime: { value: 0 }, uHeat: { value: 0 } };
  let time = 0;
  let disposed = false;
  let previousProgress = -1;
  let previousPhase = '';
  let seed = Math.floor((ctx.random || Math.random)() * 4294967296) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);
  const materials = {
    iron: new THREE.MeshStandardMaterial({ color: 0x333c3c, metalness: 0.82, roughness: 0.5 }),
    jacket: new THREE.MeshStandardMaterial({ color: 0x55615b, metalness: 0.69, roughness: 0.48 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x10181a, metalness: 0.8, roughness: 0.64 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x70452d, metalness: 0.56, roughness: 0.8 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb69b56, metalness: 0.83, roughness: 0.3 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9b352b, metalness: 0.67, roughness: 0.47 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xc6c5ae, metalness: 0.13, roughness: 0.7 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xc39c26, metalness: 0.45, roughness: 0.6 }),
    hot: new THREE.MeshStandardMaterial({ color: 0x7f2d0e, emissive: 0xff4b05, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.4 }),
    redLamp: new THREE.MeshStandardMaterial({ color: 0x8b0e09, emissive: 0xff1808, emissiveIntensity: 0.3, roughness: 0.3 }),
  };
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20);
  const sphereGeometry = new THREE.SphereGeometry(1, 20, 12);
  const boltGeometry = new THREE.CylinderGeometry(0.038, 0.038, 0.042, 6);
  const resources = new Set([boxGeometry, cylinderGeometry, sphereGeometry, boltGeometry]);
  const mesh = (geometry, material, parent = group) => {
    const result = new THREE.Mesh(geometry, material);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  };
  const box = (x, y, z, sx, sy, sz, material, parent = group) => {
    const result = mesh(boxGeometry, material, parent);
    result.position.set(x, y, z);
    result.scale.set(sx, sy, sz);
    return result;
  };
  const cylinder = (x, y, z, radius, height, material, parent = group) => {
    const result = mesh(cylinderGeometry, material, parent);
    result.position.set(x, y, z);
    result.scale.set(radius, height, radius);
    return result;
  };
  const sphere = (x, y, z, sx, sy, sz, material, parent = group) => {
    const result = mesh(sphereGeometry, material, parent);
    result.position.set(x, y, z);
    result.scale.set(sx, sy, sz);
    return result;
  };
  const tube = (points, radius, material) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
    const geometry = new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), radius, 10, false);
    resources.add(geometry);
    return mesh(geometry, material);
  };
  const pipe = (a, b, radius, material = materials.iron, parent = group) => {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    direction.set(bx - ax, by - ay, bz - az);
    const result = cylinder((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, radius, direction.length(), material, parent);
    result.quaternion.setFromUnitVectors(up, direction.normalize());
    return result;
  };
  const torus = (x, y, z, radius, width, material, parent = group) => {
    const geometry = new THREE.TorusGeometry(radius, width, 8, 36);
    resources.add(geometry);
    const result = mesh(geometry, material, parent);
    result.position.set(x, y, z);
    return result;
  };
  const bolt = (x, y, z, nx = 0, ny = 0, nz = 1) => {
    dummy.position.set(x, y, z);
    dummy.scale.set(1, 1, 1);
    direction.set(nx, ny, nz).normalize();
    dummy.quaternion.setFromUnitVectors(up, direction);
    dummy.updateMatrix();
    boltMatrices.push(dummy.matrix.clone());
  };
  const flange = (x, y, z, radius, orientation = 'vertical') => {
    const result = cylinder(x, y, z, radius, 0.1, materials.iron);
    if (orientation === 'front') result.rotation.x = Math.PI / 2;
    if (orientation === 'side') result.rotation.z = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      const c = Math.cos(a) * radius * 0.76, s = Math.sin(a) * radius * 0.76;
      if (orientation === 'front') bolt(x + c, y + s, z + 0.068);
      else if (orientation === 'side') bolt(x + 0.068, y + c, z + s, 1, 0, 0);
      else bolt(x + c, y + 0.068, z + s, 0, 1, 0);
    }
    return result;
  };

  function valve(x, y, z, radius = 0.36) {
    pipe([x, y, z - 0.22], [x, y, z + 0.08], 0.07, materials.brass);
    const rotor = new THREE.Group();
    rotor.position.set(x, y, z + 0.1);
    group.add(rotor);
    torus(0, 0, 0, radius, 0.04, materials.red, rotor);
    const hub = cylinder(0, 0, 0, 0.095, 0.13, materials.brass, rotor);
    hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5;
      pipe([0, 0, 0], [Math.cos(a) * radius, Math.sin(a) * radius, 0], 0.022, materials.red, rotor);
    }
    rotors.push({ mesh: rotor, offset: random() * TAU, speed: 0.7 + random() });
  }

  function gauge(x, y, z, radius = 0.31) {
    const housing = cylinder(x, y, z, radius, 0.1, materials.brass);
    housing.rotation.x = Math.PI / 2;
    const face = cylinder(x, y, z + 0.06, radius * 0.86, 0.018, materials.cream);
    face.rotation.x = Math.PI / 2;
    torus(x, y, z + 0.07, radius * 0.91, 0.018, materials.iron);
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (1.25 - i * 1.5 / 14);
      const tick = box(x + Math.cos(a) * radius * 0.68, y + Math.sin(a) * radius * 0.68, z + 0.078,
        i % 2 ? 0.015 : 0.022, radius * (i % 2 ? 0.12 : 0.2), 0.012, i > 10 ? materials.red : materials.dark);
      tick.rotation.z = a - Math.PI / 2;
    }
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z + 0.098);
    group.add(pivot);
    box(radius * 0.23, 0, 0, radius * 0.65, 0.022, 0.02, materials.red, pivot);
    sphere(0, 0, 0.015, 0.035, 0.035, 0.015, materials.dark, pivot);
    gauges.push(pivot);
  }

  // The large back-wall furnace is recessed behind its door, mesh and handrails.
  box(0, 1.42, -4.85, 3.95, 2.84, 1.4, materials.dark);
  box(0, 0.16, -4.18, 4.3, 0.28, 1.65, materials.iron);
  box(0, 2.7, -4.12, 4.12, 0.2, 0.2, materials.iron);
  box(-1.89, 1.4, -4.08, 0.2, 2.55, 0.22, materials.iron);
  box(1.89, 1.4, -4.08, 0.2, 2.55, 0.22, materials.iron);
  box(0, 1.54, -4.075, 3.45, 1.65, 0.035, materials.hot);

  const fireMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHeat: { value: 0.2 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uHeat;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p), f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 q=vUv; float t=uTime*(1.4+uHeat);
        float n=noise(vec2(q.x*8.0,q.y*5.0-t));
        n+=0.5*noise(vec2(q.x*17.0+2.1,q.y*9.0-t*1.9));
        float flame=clamp((1.0-q.y)*(1.1+uHeat*0.8)+n*0.6-0.5,0.0,1.0);
        vec3 col=mix(vec3(0.12,0.006,0.001),vec3(1.0,0.16,0.006),smoothstep(0.04,0.36,flame));
        col=mix(col,vec3(1.0,0.79,0.26),smoothstep(0.36,0.94,flame));
        col*=0.8+uHeat*1.4; gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
  const fireGeometry = new THREE.PlaneGeometry(3.32, 1.53);
  resources.add(fireGeometry);
  const fire = mesh(fireGeometry, fireMaterial);
  fire.position.set(0, 1.55, -4.04);
  fire.castShadow = false;
  for (let i = 0; i < 15; i++) box(-1.55 + i * 0.22, 1.5, -3.98, 0.045, 1.63, 0.07, materials.dark);
  for (const y of [0.78, 2.27]) box(0, y, -3.94, 3.6, 0.09, 0.13, materials.iron);
  for (const x of [-1.78, 1.78]) for (let i = 0; i < 5; i++) bolt(x, 0.55 + i * 0.45, -3.93);
  for (const x of [-1.38, 1.38]) box(x, 0.52, -3.88, 0.37, 0.12, 0.15, materials.rust);
  box(0, 0.43, -3.94, 1.45, 0.22, 0.12, materials.dark);
  for (let i = 0; i < 10; i++) box(-0.6 + i * 0.134, 0.43, -3.86, 0.025, 0.16, 0.025, materials.iron);

  // Steam drum, welded ribs, front manifold and two insulated pressure vessels.
  const drum = cylinder(0, 3.46, -4.72, 0.66, 4.9, materials.jacket);
  drum.rotation.z = Math.PI / 2;
  for (const x of [-2.48, 2.48]) sphere(x, 3.46, -4.72, 0.24, 0.66, 0.66, materials.iron);
  for (const x of [-1.95, -0.72, 0.72, 1.95]) {
    const rib = cylinder(x, 3.46, -4.72, 0.69, 0.085, materials.iron);
    rib.rotation.z = Math.PI / 2;
  }
  gauge(0, 3.53, -3.97, 0.39);
  gauge(-1.08, 3.48, -4.02, 0.24);
  valve(1.11, 3.44, -3.9, 0.32);
  pipe([-2.35, 2.93, -4.22], [2.35, 2.93, -4.22], 0.11, materials.rust);
  for (const x of [-1.45, 1.45]) pipe([x, 2.85, -4.22], [x, 2.52, -4.22], 0.08, materials.brass);

  for (const side of [-1, 1]) {
    const x = side * 4.66;
    cylinder(x, 2.28, -4.62, 0.82, 3.35, materials.jacket);
    sphere(x, 3.95, -4.62, 0.82, 0.43, 0.82, materials.jacket);
    sphere(x, 0.6, -4.62, 0.82, 0.28, 0.82, materials.iron);
    for (const y of [0.74, 1.37, 2.33, 3.3, 3.88]) cylinder(x, y, -4.62, 0.846, 0.065, materials.iron);
    for (const dx of [-0.53, 0.53]) box(x + dx, 0.31, -4.62, 0.16, 0.62, 0.8, materials.iron);
    pipe([x, 4.18, -4.62], [x, 5.02, -4.62], 0.16, materials.rust);
    flange(x, 4.46, -4.62, 0.28);
    tube([[x, 4.9, -4.62], [x, 5.15, -4.62], [x - side * 0.3, 5.36, -4.62], [side * 3.2, 5.36, -4.62], [side * 2.92, 5.1, -4.62], [side * 2.92, 3.48, -4.62]], 0.16, materials.iron);
    gauge(x, 2.86, -3.76, 0.29);
    box(x, 1.99, -3.782, 0.53, 0.25, 0.025, materials.brass);
    for (let i = 0; i < 3; i++) box(x, 2.055 - i * 0.065, -3.762, 0.35 - i * 0.045, 0.013, 0.008, materials.dark);
    valve(x, 1.3, -3.71, 0.39);
    flange(x, 1.3, -3.88, 0.23, 'front');
    tube([[x + side * 0.73, 2.2, -4.62], [side * 5.78, 2.2, -4.62], [side * 6.12, 2.0, -4.62], [side * 6.12, 0.66, -4.62], [side * 6.12, 0.54, -3.9], [side * 6.12, 0.54, 3.65]], 0.15, materials.rust);
    for (const z of [-3.5, -1.2, 1.4, 3.5]) {
      const ring = cylinder(side * 6.12, 0.54, z, 0.21, 0.1, materials.iron);
      ring.rotation.x = Math.PI / 2;
      box(side * 6.12, 0.25, z, 0.43, 0.47, 0.14, materials.dark);
    }
    pipe([side * 6.35, 4.75, -5.35], [side * 6.35, 4.75, 2.65], 0.105, materials.iron);
    for (const z of [-4.6, -1.8, 1.2]) {
      box(side * 6.65, 4.75, z, 0.6, 0.09, 0.12, materials.iron);
      const ring = cylinder(side * 6.35, 4.75, z, 0.15, 0.12, materials.brass);
      ring.rotation.x = Math.PI / 2;
    }
    // Spring-loaded relief cap visibly lifts as the chamber overpressurises.
    cylinder(side * 2.05, 4.23, -4.72, 0.14, 0.61, materials.brass);
    flange(side * 2.05, 4.49, -4.72, 0.23);
    const stem = new THREE.Group();
    stem.position.set(side * 2.05, 4.55, -4.72);
    group.add(stem);
    cylinder(0, 0.12, 0, 0.065, 0.28, materials.brass, stem);
    cylinder(0, 0.29, 0, 0.24, 0.07, materials.red, stem);
    const springAssembly = new THREE.Group();
    springAssembly.position.set(side * 2.05, 4.54, -4.72);
    group.add(springAssembly);
    reliefStems.push({ mesh: stem, spring: springAssembly, base: 4.55, side, lift: 0 });
    for (let j = 0; j < 5; j++) {
      const spring = torus(0, 0.04 + j * 0.045, 0, 0.115, 0.016, materials.iron, springAssembly);
      spring.rotation.x = Math.PI / 2;
    }
  }

  // A low service grate, caution curb, and bolted heat shields remain below faces.
  for (let i = 0; i < 19; i++) box(-2.25 + i * 0.25, 0.048, -3.18, 0.065, 0.055, 1.1, materials.iron);
  for (const z of [-3.7, -2.65]) box(0, 0.04, z, 4.72, 0.07, 0.1, materials.dark);
  for (let i = 0; i < 18; i++) {
    const stripe = box(-2.32 + i * 0.273, 0.035, -2.49, 0.15, 0.045, 0.28, i % 2 ? materials.dark : materials.yellow);
    stripe.rotation.y = -0.42;
  }
  for (const x of [-2.65, 2.65]) {
    pipe([x, 0.08, -3.37], [x, 0.98, -3.37], 0.045, materials.iron);
    pipe([x, 0.08, -2.48], [x, 0.98, -2.48], 0.045, materials.iron);
    pipe([x, 0.98, -3.37], [x, 0.98, -2.48], 0.045, materials.yellow);
  }
  const hotSpots = [];
  for (const side of [-1, 1]) for (let index = 0; index < 3; index++) {
    const z = -1.7 + index * 2;
    const x = side * 3.85;
    hotSpots.push({ x, z, side });
    box(side * 6.02, 0.57, z, 0.32, 0.34, 0.47, materials.iron);
    pipe([side * 6.12, 0.6, z], [side * 5.72, 0.71, z], 0.1, materials.brass);
    flange(side * 5.78, 0.7, z, 0.19, 'side');
    const mouth = cylinder(side * 5.68, 0.73, z, 0.11, 0.035, materials.dark);
    mouth.rotation.z = Math.PI / 2;
    const plateMaterial = materials.hot.clone();
    plateMaterial.color.setHex(0x35291c);
    plateMaterial.emissiveIntensity = 0;
    const plate = cylinder(x, 0.025, z, 0.6, 0.035, plateMaterial);
    floorPlates.push(plate);
    const ring = torus(x, 0.05, z, 0.61, 0.025, materials.iron);
    ring.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) box(x, 0.05, z - 0.4 + i * 0.2, 0.87, 0.027, 0.036, materials.dark);
    for (const dx of [-0.45, 0.45]) bolt(x + dx, 0.07, z, 0, 1, 0);
  }
  for (const x of [-2.9, 2.9]) {
    box(x, 4.23, -4.36, 0.22, 0.41, 0.24, materials.dark);
    sphere(x, 4.29, -4.2, 0.125, 0.16, 0.12, materials.redLamp);
    torus(x, 4.29, -4.07, 0.13, 0.016, materials.iron);
  }

  // Seeded GPU steam: every point grows and softens as it exits a real nozzle.
  // No textures, network assets, per-frame geometry allocations or scene fog.
  // Thin refractive volumes perturb the furnace grille behind them. Three's
  // transmission pass supplies the background; no scene/camera mutation or
  // private framebuffer access is necessary. Low quality skips this pass.
  const hazeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff6e9, metalness: 0, roughness: 0.015, transmission: 1,
    thickness: 0.72, ior: 1.12, transparent: true, opacity: 0.4,
    depthWrite: false, side: THREE.DoubleSide,
  });
  hazeMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, heatUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vHeatUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeatUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime, uHeat; varying vec2 vHeatUv;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 heatEdge=sin(clamp(vHeatUv,0.0,1.0)*3.14159265);
        diffuseColor.a*=pow(max(0.0,heatEdge.x*heatEdge.y),1.5)*uHeat;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 h=vHeatUv*vec2(10.0,15.0);float rise=uTime*2.8;
        float wave=sin(h.y-rise+sin(h.x*1.7+uTime))*sin(h.x*2.0+h.y*0.5);
        normal=normalize(normal+vec3(wave,sin(h.y*1.8-rise*1.4+h.x),0.0)*uHeat*0.19);`);
  };
  hazeMaterial.customProgramCacheKey = () => 'boiler-heat-refraction-v2';
  const hazeGeometry = new THREE.PlaneGeometry(1, 1);
  resources.add(hazeGeometry);
  const heatHaze = mesh(hazeGeometry, hazeMaterial);
  heatHaze.position.set(0, 2.08, -3.72);
  heatHaze.scale.set(3.75, 3.05, 1);
  heatHaze.castShadow = false;
  heatHaze.receiveShadow = false;
  heatHaze.visible = !lowQuality;
  heatHaze.renderOrder = 1;

  const steamCount = lowQuality ? 80 : 160;
  const steamGeometry = new THREE.BufferGeometry();
  const seeds = new Float32Array(steamCount * 4);
  for (let i = 0; i < steamCount; i++) {
    seeds[i * 4] = random();
    seeds[i * 4 + 1] = random() * TAU;
    seeds[i * 4 + 2] = Math.sqrt(random());
    seeds[i * 4 + 3] = 0.5 + random() * 0.5;
  }
  steamGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(steamCount * 3), 3));
  steamGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  // Animated shader positions extend beyond the all-zero base attribute.
  steamGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, 0), 5);
  resources.add(steamGeometry);
  const steamVertex = `
    attribute vec4 aSeed; uniform float uTime,uFlow,uPower,uLength,uPhase;
    uniform vec3 uRise;
    varying float vAlpha,vAge,vSeed;
    void main(){
      float age=fract(aSeed.x+uFlow+uPhase);
      float spread=(0.035+age*age*(0.56+uPower*0.34))*aSeed.z;
      vec3 p=vec3(cos(aSeed.y)*spread,age*uLength,sin(aSeed.y)*spread);
      p.x+=sin(age*9.0+aSeed.y+uTime*1.6)*age*0.17;
      p.z+=cos(age*7.0+aSeed.y*2.0+uTime)*age*0.18;
      p+=uRise*age*age*(0.42+uPower*0.5);
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_Position=projectionMatrix*mv;
      float size=(0.16+age*1.42)*aSeed.w*(0.55+uPower*0.45);
      gl_PointSize=clamp(size*1050.0/max(0.5,-mv.z),1.0,180.0);
      vAlpha=smoothstep(0.0,0.075,age)*(1.0-smoothstep(0.48,1.0,age))*uPower*0.17;
      vAge=age;vSeed=aSeed.x;
    }`;
  const steamFragment = `
    uniform float uHeat,uTime;varying float vAlpha,vAge,vSeed;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){
      vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);
      if(r>1.0)discard;
      float cloud=noise(q*3.0+vec2(vSeed*19.0,uTime*0.16));
      cloud+=noise(q*7.0+vSeed*31.0)*0.35;
      float soft=pow(max(0.0,1.0-r*(0.85+cloud*0.22)),2.5);
      float billow=0.58+cloud*0.42;
      float lighting=0.72+0.23*smoothstep(-0.8,0.9,q.y)+cloud*0.13;
      vec3 cool=mix(vec3(0.49,0.57,0.59),vec3(0.9,0.94,0.92),vAge)*lighting;
      vec3 warm=mix(vec3(0.95,0.56,0.23),vec3(0.92,0.86,0.73),vAge)*lighting;
      gl_FragColor=vec4(mix(cool,warm,uHeat*0.42),soft*vAlpha*billow);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  function steam(origin, vector, length, type, index) {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlow: { value: 0 }, uPower: { value: 0 }, uLength: { value: length }, uPhase: { value: random() }, uHeat: { value: 0 }, uRise: { value: new THREE.Vector3() } },
      vertexShader: steamVertex, fragmentShader: steamFragment,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(steamGeometry, material);
    points.position.set(...origin);
    direction.set(...vector).normalize();
    points.quaternion.setFromUnitVectors(up, direction);
    material.uniforms.uRise.value.copy(up).applyQuaternion(points.quaternion.clone().invert()).multiplyScalar(type === 'relief' ? 0.16 : type === 'floor' ? 0.5 : 1);
    points.renderOrder = 3;
    group.add(points);
    const jet = { points, material, length, type, index, flow: 0, power: 0, core: null };
    if (type === 'blast') {
      const coreGeometry = new THREE.CylinderGeometry(0.23, 0.035, 1, 12, 1, true);
      resources.add(coreGeometry);
      const coreMaterial = new THREE.ShaderMaterial({
        uniforms: { uPower: material.uniforms.uPower, uTime: material.uniforms.uTime },
        vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'varying vec2 vUv;uniform float uPower,uTime;void main(){float edge=pow(abs(sin(vUv.x*6.283185)),2.0);float a=(1.0-smoothstep(0.2,1.0,vUv.y))*edge*uPower*0.13;gl_FragColor=vec4(0.83,0.9,0.91,a*(0.92+0.08*sin(vUv.y*60.0-uTime*30.0)));}',
        side: THREE.DoubleSide, transparent: true, depthWrite: false,
      });
      jet.core = mesh(coreGeometry, coreMaterial, points);
      jet.core.castShadow = false;
      jet.core.receiveShadow = false;
    }
    steamJets.push(jet);
  }
  for (let i = 0; i < hotSpots.length; i++) {
    const p = hotSpots[i];
    steam([p.side * 5.62, 0.73, p.z], [-p.side, 0.16, 0], 3.7, 'blast', i);
    steam([p.x, 0.1, p.z], [p.side * 0.05, 1, 0.05], 2.5, 'floor', i);
  }
  for (const side of [-1, 1]) steam([side * 2.05, 4.67, -4.72], [side * 0.16, 1, 0.12], 1.85, 'relief', side);

  const emberCount = lowQuality ? 50 : 110;
  const emberGeometry = new THREE.InstancedBufferGeometry();
  const emberSeeds = new Float32Array(emberCount * 4);
  for (let i = 0; i < emberCount * 4; i++) emberSeeds[i] = random();
  emberGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  emberGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  emberGeometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(emberSeeds, 4));
  emberGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  emberGeometry.instanceCount = emberCount;
  resources.add(emberGeometry);
  const emberMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: heatUniforms.uTime, uHeat: heatUniforms.uHeat, uBurst: { value: 0 } },
    vertexShader: `
      attribute vec4 aSeed;uniform float uTime,uHeat,uBurst;varying vec2 vUv;varying float vLife,vHeat;
      vec3 flight(float age){
        float reach=1.5+aSeed.z*1.25+uHeat*0.55;
        return vec3((aSeed.y-0.5)*3.1+sin(age*8.0+aSeed.z*6.283)*age*0.2,
          0.88+age*reach-age*age*0.53,-3.91+age*(0.27+aSeed.w*0.55+uBurst*0.6));
      }
      void main(){
        float age=fract(aSeed.x+uTime*(0.22+aSeed.w*0.15));
        vec4 mv=modelViewMatrix*vec4(flight(age),1.0);
        vec4 previous=modelViewMatrix*vec4(flight(max(0.0,age-0.025)),1.0);
        vec2 tangent=normalize(mv.xy-previous.xy+vec2(0.0001,0.0002));
        vec2 side=vec2(-tangent.y,tangent.x);
        mv.xy+=side*position.x*(0.006+aSeed.z*0.008)+tangent*position.y*(0.025+aSeed.w*0.05)*(1.0+uBurst);
        gl_Position=projectionMatrix*mv;vUv=uv;
        vLife=smoothstep(0.0,0.04,age)*(1.0-smoothstep(0.5,1.0,age));vHeat=age;
      }`,
    fragmentShader: `varying vec2 vUv;varying float vLife,vHeat;
      void main(){vec2 q=vUv*2.0-1.0;float a=max(0.0,1.0-dot(q,q));
        vec3 c=mix(vec3(1.0,0.91,0.47),vec3(1.0,0.19,0.01),vHeat);
        gl_FragColor=vec4(c*2.2,a*a*vLife);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const embers = new THREE.Mesh(emberGeometry, emberMaterial);
  embers.frustumCulled = false;
  embers.renderOrder = 4;
  group.add(embers);

  const bolts = new THREE.InstancedMesh(boltGeometry, materials.brass, boltMatrices.length);
  for (let i = 0; i < boltMatrices.length; i++) bolts.setMatrixAt(i, boltMatrices[i]);
  bolts.instanceMatrix.needsUpdate = true;
  bolts.castShadow = true;
  bolts.receiveShadow = true;
  group.add(bolts);
  const furnaceLight = new THREE.PointLight(0xff7829, 12, 13, 2);
  furnaceLight.position.set(0, 1.7, -3.52);
  group.add(furnaceLight);
  const warningLight = new THREE.PointLight(0xff250e, 0, 11, 2);
  warningLight.position.set(0, 4.4, -2.1);
  group.add(warningLight);

  // Batch repeated static primitives. Animated wheels, springs and needles
  // stay independent; reducing opaque draws pays for the refraction pass.
  const batches = new Map();
  for (const object of group.children.slice()) {
    if (!object.isMesh || object.isInstancedMesh || floorPlates.includes(object)) continue;
    if (object.geometry !== boxGeometry && object.geometry !== cylinderGeometry && object.geometry !== sphereGeometry) continue;
    const key = object.geometry.uuid + ':' + object.material.uuid;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  }
  for (const objects of batches.values()) {
    if (objects.length < 3) continue;
    const batch = new THREE.InstancedMesh(objects[0].geometry, objects[0].material, objects.length);
    for (let i = 0; i < objects.length; i++) {
      objects[i].updateMatrix();
      batch.setMatrixAt(i, objects[i].matrix);
      group.remove(objects[i]);
    }
    batch.instanceMatrix.needsUpdate = true;
    batch.castShadow = true;
    batch.receiveShadow = true;
    batch.computeBoundingSphere();
    group.add(batch);
  }

  function releaseAvoidance() {
    for (const record of actorExposure.values()) {
      if (record.ownsTarget) record.actor.clearTarget?.();
    }
    actorExposure.clear();
  }

  function updateActors(dt, state, progress, active, heat) {
    // This room does not inspect selected IDs. Health, injury thresholds and
    // the first fatal case are centrally owned; every student feels the heat.
    if (!active || dt <= 0) return;
    const actors = ctx.actors || [];
    const bounds = state.bounds || { minX: -6, maxX: 6, minZ: -5, maxZ: 5 };
    const inferredDuration = progress > 0.001 && Number.isFinite(state.elapsed) && state.elapsed > 0 ? state.elapsed / progress : 20;
    const declaredDuration = state.durationSeconds ?? state.duration ?? state.roundDuration;
    const duration = THREE.MathUtils.clamp(Number.isFinite(declaredDuration) ? declaredDuration : inferredDuration, 10, 30);
    const durationScale = 20 / duration;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      if (actor.alive === false || actor.invincible || actor.id === 'vip-456' || actor.action === 'fall' || actor.action === 'dead') continue;
      const id = actor.id ?? i;
      const position = actor.position;
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) continue;
      let record = actorExposure.get(id);
      if (!record || record.actor !== actor) {
        if (record?.ownsTarget) record.actor.clearTarget?.();
        // Index-based variation is stable when the draw's selected ID changes.
        const variation = random();
        record = { actor, variation, nextReaction: time + (i % 8) * 0.065, nextAvoid: time + variation,
          avoidUntil: 0, ownsTarget: false, damage: 0, nextDamage: time, reactions: 0, nextImpact: time };
        actorExposure.set(id, record);
      }
      if (record.ownsTarget && time >= record.avoidUntil) {
        actor.clearTarget?.();
        record.ownsTarget = false;
      }

      const furnaceDistance = Math.hypot(position.x, position.z + 3.9);
      const radiant = heat * Math.max(0, 1 - furnaceDistance / 7.8);
      let steamExposure = 0;
      let avoidX = 0, avoidZ = 0;
      for (let j = 0; j < hotSpots.length; j++) {
        const vent = hotSpots[j];
        const along = 5.62 - vent.side * position.x;
        const cross = Math.abs(position.z - vent.z);
        const width = 0.2 + Math.max(0, along) * 0.18;
        const lateral = along >= 0 && along < 4.3
          ? steamJets[j * 2].power * (1 - smooth(width * 0.45, width + 0.45, cross)) : 0;
        const dx = position.x - vent.x, dz = position.z - vent.z;
        const floor = steamJets[j * 2 + 1].power * Math.exp(-(dx * dx + dz * dz) / 1.35);
        const exposure = Math.max(lateral, floor);
        if (exposure > steamExposure) {
          steamExposure = exposure;
          // A brief sidestep out of the nearest plume, never a rendezvous with
          // a numbered grate or a common safe spot at the front of the room.
          avoidX = lateral >= floor ? -vent.side * 0.3 : dx;
          avoidZ = Math.abs(dz) > 0.12 ? dz : record.variation < 0.5 ? -0.8 : 0.8;
        }
      }
      const intensity = THREE.MathUtils.clamp(0.19 + heat * 0.51 + radiant * 0.2 + steamExposure * 0.38, 0.12, 1);
      const rate = (1.9 + heat * 4 + radiant * 1.6 + steamExposure * 3.8) * durationScale;
      record.damage += rate * dt;
      if (time >= record.nextDamage) {
        ctx.effects?.emit?.('damage', {
          actorId: id, kind: 'heat', amount: record.damage,
          position: [position.x, (Number.isFinite(position.y) ? position.y : 0) + 1.1, position.z],
          intensity, invincible: false,
        });
        record.damage = 0;
        record.nextDamage = time + 0.16 + (i % 3) * 0.025;
      }

      if (time >= record.nextReaction) {
        const cough = (steamExposure > 0.16 || progress > 0.24) && (record.reactions + i) % 3 === 0;
        actor.setReaction?.(cough ? 'cough' : 'heat', intensity * (0.53 + record.variation * 0.25), 0.46 + record.variation * 0.3);
        record.reactions++;
        record.nextReaction = time + 0.85 + random() * 1.2;
      }
      if (steamExposure > 0.72 && time >= record.nextImpact) {
        actor.setSquish?.('impact', 0.1 + steamExposure * 0.13, 0.28);
        record.nextImpact = time + 2.0 + random() * 1.8;
      }
      if (radiant > 0.43 && position.z < -2.3 && steamExposure < 0.32) {
        avoidX = record.variation < 0.5 ? -0.45 : 0.45;
        avoidZ = 0.9;
      }
      const needsSidestep = steamExposure > 0.32 || (radiant > 0.43 && position.z < -2.3);
      if (needsSidestep && !record.ownsTarget && time >= record.nextAvoid && actor.setTarget && actor.clearTarget) {
        const length = Math.hypot(avoidX, avoidZ) || 1;
        const distance = 0.8 + record.variation * 0.35;
        actor.setTarget(
          THREE.MathUtils.clamp(position.x + avoidX / length * distance, bounds.minX + 0.4, bounds.maxX - 0.4),
          THREE.MathUtils.clamp(position.z + avoidZ / length * distance, bounds.minZ + 0.4, bounds.maxZ - 0.4));
        record.ownsTarget = true;
        record.avoidUntil = time + 0.55 + record.variation * 0.3;
        record.nextAvoid = time + 3.2 + record.variation * 1.6;
      }
    }
  }

  function update(dt, state) {
    if (disposed) return;
    const paused = state?.paused === true || state?.phase === 'paused';
    const step = paused ? 0 : THREE.MathUtils.clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    time += step;
    const progress = THREE.MathUtils.clamp(state?.progress || 0, 0, 1);
    const phase = state?.phase || 'preview';
    const active = !paused && (phase === 'running' || phase === 'reveal');
    const restarted = progress < previousProgress - 0.2 || (phase === 'running' && previousPhase !== 'running');
    if (restarted) {
      releaseAvoidance();
      for (const jet of steamJets) { jet.flow = 0; jet.power = 0; }
      for (const stem of reliefStems) stem.lift = 0;
    }
    if ((phase === 'preview' || phase === 'complete') && (previousPhase === 'running' || previousPhase === 'reveal')) releaseAvoidance();
    previousProgress = progress;
    previousPhase = phase;
    const heat = phase === 'preview' ? 0.12 + progress * 0.55 : 0.24 + smooth(0.025, 0.86, progress) * 0.76;
    const pressure = phase === 'preview' ? progress * 0.6 : smooth(0.04, 0.92, progress);
    const discharge = smooth(0.37, 0.89, progress) * (phase === 'preview' ? 0.2 : 1);
    const finalBeat = smooth(0.89, 0.965, progress);
    const flicker = 0.94 + Math.sin(time * 17.3) * 0.035 + Math.sin(time * 29.7) * 0.025;
    heatUniforms.uTime.value = time;
    heatUniforms.uHeat.value = heat;
    heatHaze.visible = !lowQuality && heat > 0.4;
    emberMaterial.uniforms.uBurst.value = finalBeat;
    fireMaterial.uniforms.uTime.value = time;
    fireMaterial.uniforms.uHeat.value = heat;
    materials.hot.emissiveIntensity = (0.3 + heat * 2.2) * flicker;
    furnaceLight.intensity = (8 + heat * 29 + finalBeat * 10) * flicker;
    const warningPhase = (time * (0.62 + pressure * 0.3)) % 1;
    const doubleFlash = Math.exp(-Math.pow((warningPhase - 0.1) * 24, 2)) + Math.exp(-Math.pow((warningPhase - 0.32) * 24, 2));
    const warning = smooth(0.08, 0.3, progress);
    warningLight.intensity = warning * (0.15 + doubleFlash * 7);
    materials.redLamp.emissiveIntensity = 0.18 + warning * (0.4 + doubleFlash * 4.2);
    let relievedPressure = 0;
    for (const stem of reliefStems) {
      const chatter = Math.pow(Math.max(0, Math.sin(time * (5.7 + pressure) + stem.side)), 3);
      const liftTarget = smooth(0.1, 0.76, progress) * (0.025 + chatter * 0.105) + finalBeat * 0.035;
      stem.lift = THREE.MathUtils.lerp(stem.lift, liftTarget, 1 - Math.exp(-step * 17));
      stem.mesh.position.y = stem.base + stem.lift;
      stem.spring.scale.y = 1 + stem.lift / 0.24;
      relievedPressure += stem.lift * 0.2;
    }
    for (let i = 0; i < gauges.length; i++) {
      const needle = Math.PI * (1.25 - (pressure - relievedPressure) * 1.5) + Math.sin(time * (27 + i) + i) * pressure * 0.018;
      gauges[i].rotation.z = restarted || previousProgress === 0 ? needle : THREE.MathUtils.lerp(gauges[i].rotation.z, needle, 1 - Math.exp(-step * 11));
    }
    for (const rotor of rotors) {
      rotor.mesh.rotation.z = rotor.offset + discharge * 0.88 + finalBeat * 0.34 + pressure * Math.sin(time * 19 + rotor.offset) * 0.018;
    }
    for (let i = 0; i < floorPlates.length; i++) floorPlates[i].material.emissiveIntensity = discharge * (0.25 + finalBeat * 0.8) * (0.9 + Math.sin(time * 3 + i) * 0.1);
    for (const jet of steamJets) {
      let power;
      if (jet.type === 'relief') {
        const stem = reliefStems[jet.index < 0 ? 0 : 1];
        power = 0.035 + smooth(0.08, 0.72, progress) * 0.28 + stem.lift * 2.8;
      } else if (jet.type === 'floor') power = 0.025 + smooth(0.08, 0.45, progress) * 0.12 + smooth(0.7, 0.95, progress) * (0.4 + finalBeat * 0.42);
      else {
        const sector = smooth(0.56 + (jet.index % 3) * 0.035, 0.81 + (jet.index % 3) * 0.025, progress);
        const pulse = 0.78 + Math.sin(time * 4.3 + jet.index * 1.3) * 0.12;
        const earlyLeak = 0.055 + smooth(0.02, 0.35, progress) * 0.14;
        power = earlyLeak + sector * pulse * 0.8 + finalBeat * 0.16;
      }
      if (phase === 'preview' && jet.type !== 'relief') power *= 0.18;
      jet.power = THREE.MathUtils.lerp(jet.power, power, 1 - Math.exp(-step * 12));
      jet.flow += step * (0.28 + jet.power * 0.62);
      jet.material.uniforms.uTime.value = time;
      jet.material.uniforms.uFlow.value = jet.flow;
      jet.material.uniforms.uPower.value = jet.power;
      jet.material.uniforms.uHeat.value = heat;
      jet.material.uniforms.uLength.value = jet.length * (0.7 + jet.power * 0.3);
      jet.points.visible = jet.power > 0.012;
      if (jet.core) {
        jet.core.scale.y = 0.6 + jet.power * 1.9;
        jet.core.position.y = jet.core.scale.y * 0.5;
      }
    }
    updateActors(step, state || {}, progress, active, heat);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    const ownedMaterials = new Set(Object.values(materials));
    group.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      if (Array.isArray(object.material)) object.material.forEach(material => ownedMaterials.add(material));
      else if (object.material) ownedMaterials.add(object.material);
      if (object.isInstancedMesh) object.dispose();
      if (object.isLight && object.shadow) object.shadow.dispose();
    });
    for (const geometry of resources) geometry.dispose();
    for (const material of ownedMaterials) material.dispose();
    group.clear();
    releaseAvoidance();
  }

  update(0, { progress: 0, phase: 'preview' });
  return { update, dispose };
}
