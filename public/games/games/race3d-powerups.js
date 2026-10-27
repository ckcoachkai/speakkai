import { createRaceItemModels } from './race3d-item-models.js?v=20261027-midnight';
import {inventoryFace} from './race3d-item-rules.js?v=20261027-midnight';
import {createExtraVisuals} from './race3d-extra-visuals.js?v=20261027-midnight';

/**
 * Pooled kart items. Entity positions, lifetimes and hits belong to the race
 * simulation; this module only displays its pickups/hazards/projectiles/events.
 *
 * const items = createRacePowerups(THREE, { track });
 * world.add(items.group);
 * items.handleEvents(simulation.drainEvents(), { cars: simulation.cars });
 * items.update(renderDelta, simulation, { cars: simulation.cars });
 * Call reset after simulation.reset, and dispose with the rest of the scene.
 */
export function createRacePowerups(THREE, { track } = {}) {
  if (typeof track?.sampleTrack !== 'function') throw new TypeError('Kart items require sampleTrack(distance)');
  const group = new THREE.Group();
  const reducedMotion=!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const activeNitroIds=[],activeRocketIds=[];
  group.name = 'race3d-powerups';
  const extraVisuals=createExtraVisuals(THREE,{track,reducedMotion,low:(globalThis.innerWidth||1400)<720});group.add(extraVisuals.group);
  const authoredItems = createRaceItemModels(THREE, { parent: group, capacity: 96 });
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const batches = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3(), right = new THREE.Vector3(), tangent = new THREE.Vector3();
  const heading = new THREE.Vector3(), offset = new THREE.Vector3();
  const color = new THREE.Color();
  const exhaustTime = { value: 0 };
  const exhaustRotation = new THREE.Quaternion(), exhaustScale = new THREE.Vector3();
  const exhaustMatrix = new THREE.Matrix4(), inverseEffects = new THREE.Matrix4();
  const exhaustOrigin = new THREE.Vector3(), exhaustDirection = new THREE.Vector3();
  const itemViewPosition = new THREE.Vector3(), cameraPosition = new THREE.Vector3(), worldItemPosition = new THREE.Vector3();
  let viewCamera = null, viewHeight = 720, worldScale = 1;
  const visibleItems = { bananas: 0, airborneBananas: 0, bombs: 0, missiles: 0, tyreCues: 0, blastCores: 0 };
  const defaultExhaustAnchors = [[-.48, .375, -2.43], [.48, .375, -2.43]];
  const limits = Object.freeze({ pickups: 96, bananas: 96, bombs: 60, missiles: 60, waves: 48, cars: 60, flames: 120, smoke: 120, sparks: 200, trails: 240, shockwaves: 20 });
  const itemTypes = ['launch', 'rocket', 'boost', 'bomb', 'shield', 'banana', 'missile', 'shockwave', 'freeze', 'repair'];
  const itemColors = [0xb68aff, 0x36edbe, 0x38dcea, 0xff994d, 0x5bbcff, 0xffda3b, 0xff6373, 0xe892ff, 0xa0edff, 0x74ef9a];
  const indicators = new Map();
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, finite(value, low)));
  const TAU = Math.PI * 2;
  let disposed = false, clock = 0, burstSerial = 0, lastTime = null, emissionTime = 0;

  function standard(hex, options = {}) {
    const material = new THREE.MeshStandardMaterial({ color: hex, roughness: .48, metalness: .12, ...options });
    materials.add(material);
    return material;
  }
  function basic(hex, options = {}) {
    const material = new THREE.MeshBasicMaterial({ color: hex, ...options });
    materials.add(material);
    return material;
  }
  function batch(name, geometry, material, capacity) {
    geometries.add(geometry);
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.name = `race3d-item-${name}`;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = !material.isMeshBasicMaterial;
    group.add(mesh);
    batches.push(mesh);
    return mesh;
  }
  // Merge our small component geometries once. No extra scene nodes per item.
  function combine(parts) {
    const positions = [], normals = [];
    for (const part of parts) {
      const expanded = part.index ? part.toNonIndexed() : part;
      const p = expanded.getAttribute('position'), n = expanded.getAttribute('normal');
      for (let i = 0; i < p.count; i++) {
        positions.push(p.getX(i), p.getY(i), p.getZ(i));
        normals.push(n.getX(i), n.getY(i), n.getZ(i));
      }
      if (expanded !== part) expanded.dispose();
      part.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return geometry;
  }
  function box(w, h, d, x, y, z) { return new THREE.BoxGeometry(w, h, d).translate(x, y, z); }
  function sphere(r, x = 0, y = 0, z = 0) { return new THREE.SphereGeometry(r, 12, 8).translate(x, y, z); }

  // Chamfer-like metal corners and raised question marks keep the rotating
  // boxes readable without canvas textures, fonts, or external resources.
  const edges = [];
  for (const a of [-.74, .74]) for (const b of [-.74, .74]) {
    edges.push(box(1.57, .065, .065, 0, a, b));
    edges.push(box(.065, 1.57, .065, a, 0, b));
    edges.push(box(.065, .065, 1.57, a, b, 0));
  }
  const questionCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.24, .23, .795), new THREE.Vector3(-.17, .43, .795),
    new THREE.Vector3(.14, .43, .795), new THREE.Vector3(.26, .25, .795),
    new THREE.Vector3(.12, .06, .795), new THREE.Vector3(0, -.03, .795), new THREE.Vector3(0, -.15, .795)
  ]);
  const question = combine([new THREE.TubeGeometry(questionCurve, 18, .065, 6, false), sphere(.072, 0, -.34, .795)]);
  const glyphs = [];
  for (let face = 0; face < 4; face++) glyphs.push(question.clone().rotateY(face * Math.PI / 2));
  question.dispose();
  const pickupCore = batch('pickup-shell', new THREE.BoxGeometry(1.46, 1.46, 1.46), standard(0xffffff, {
    roughness: .11, metalness: .08, emissive: 0x354c69, emissiveIntensity: .6,
    transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide
  }), limits.pickups);
  const pickupFrame = batch('pickup-frame', combine(edges), standard(0xd9edee, { roughness: .22, metalness: .72 }), limits.pickups);
  const pickupGlyph = batch('pickup-question', combine(glyphs), standard(0xfff6cd, {
    emissive: 0xffd867, emissiveIntensity: .48, roughness: .26, metalness: .35
  }), limits.pickups);
  const pickupHalo = batch('pickup-ground-ring', new THREE.TorusGeometry(1.16, .037, 5, 28).rotateX(Math.PI / 2),
    basic(0x91e6e9, { transparent: true, opacity: .52, depthWrite: false }), limits.pickups);
  const pickupPrism=batch('pickup-prism',new THREE.OctahedronGeometry(.45),standard(0x98dfff,{emissive:0x239ed0,emissiveIntensity:1.8,metalness:.5,roughness:.2}),limits.pickups);
  const pickupColors = Object.fromEntries(itemTypes.map((type, index) => [type, itemColors[index]]));

  // Three broad, curling flaps and their pale inner skin form an actual peel.
  function peelGeometry(inner = false) {
    const positions = [], indices = [];
    for (let flap = 0; flap < 3; flap++) {
      const angle = flap * TAU / 3;
      const start = positions.length / 3;
      for (let row = 0; row <= 12; row++) {
        const t = row / 12;
        const radius = .055 + 1.22 * Math.sin(t * 1.18);
        const width = (.018 + .32 * Math.pow(Math.sin(Math.PI * t), .66)) * (inner?.78:1);
        const height = .82 * Math.pow(1 - t, 2.2) + .49 * Math.pow(t, 6);
        for (let col = 0; col <= 4; col++) {
          const cross = col / 2 - 1;
          const x = radius, z = cross * width;
          positions.push(x * Math.sin(angle) + z * Math.cos(angle),
            height + .065 * cross * cross + (inner ? .025 : 0), x * Math.cos(angle) - z * Math.sin(angle));
        }
      }
      for (let row = 0; row < 12; row++) for (let col = 0; col < 4; col++) {
        const a = start + row * 5 + col, b = a + 5;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  const bananaOuter = batch('banana-peel', peelGeometry(), standard(0xffcf12, { roughness: .47, metalness: .02, side: THREE.DoubleSide }), limits.bananas);
  const bananaInner = batch('banana-flesh', combine([peelGeometry(true), new THREE.ConeGeometry(.13,.74,9).translate(0,.78,0)]), standard(0xffedb1, { roughness: .78, metalness: 0, side: THREE.DoubleSide }), limits.bananas);
  const tips = [new THREE.CylinderGeometry(.055, .09, .19, 8).translate(0, 1.1, 0)];
  for (let i = 0; i < 3; i++) {
    const angle = i * TAU / 3;
    tips.push(sphere(.072, Math.sin(angle) * 1.183, .49, Math.cos(angle) * 1.183));
  }
  const bananaTips = batch('banana-stem', combine(tips), standard(0x70562e, { roughness: .9, metalness: 0 }), limits.bananas);
  const bananaMarker = batch('banana-road-warning',new THREE.TorusGeometry(1,.075,6,32).rotateX(Math.PI/2),
    basic(0xffd62d,{transparent:true,opacity:.8,depthWrite:false,toneMapped:false}),limits.bananas);

  const bombBody = batch('bomb-body', new THREE.SphereGeometry(.66, 18, 12), standard(0x272b2e, { roughness: .32, metalness: .75 }), limits.bombs);
  const bombCollar = batch('bomb-bands', combine([
    new THREE.TorusGeometry(.664, .028, 5, 24),
    new THREE.TorusGeometry(.664, .028, 5, 24).rotateY(Math.PI / 2),
    new THREE.CylinderGeometry(.13, .19, .19, 10).translate(0, .65, 0)
  ]), standard(0xaba17c, { roughness: .34, metalness: .83 }), limits.bombs);
  const fusePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, .73, 0), new THREE.Vector3(.07, .99, 0),
    new THREE.Vector3(.25, 1.1, .01), new THREE.Vector3(.4, 1.04, .03)
  ]);
  const bombFuse = batch('bomb-fuse', new THREE.TubeGeometry(fusePath, 10, .037, 5, false), standard(0x806243, { roughness: 1, metalness: 0 }), limits.bombs);
  const bombEmber = batch('bomb-live-fuse', sphere(.09), basic(0xffb844, { toneMapped: false }), limits.bombs);
  // A continuous backward wake makes the fast forward-moving bomb readable
  // between particle emissions. Its transform follows physics, not body spin.
  const bombWake = batch('bomb-forward-wake', new THREE.ConeGeometry(.28, 6, 8).rotateX(-Math.PI / 2).translate(0, 0, -3),
    basic(0xffa442, { transparent: true, opacity: .54, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), limits.bombs);
  const bombMarker=batch('bomb-danger-ring',new THREE.TorusGeometry(1,.065,6,40).rotateX(Math.PI/2),
    basic(0xff7843,{transparent:true,opacity:.85,depthWrite:false,toneMapped:false}),limits.bombs);

  const missileBody = batch('missile-body', combine([
    new THREE.CylinderGeometry(.24,.24,1.8,12).rotateX(Math.PI/2),
    new THREE.ConeGeometry(.26,.65,12).rotateX(Math.PI/2).translate(0,0,1.2)
  ]), standard(0xe8eff1,{metalness:.75,roughness:.24,emissive:0x391319,emissiveIntensity:.2}),limits.missiles);
  const missileFins = batch('missile-fins', combine(Array.from({length:4},(_,i)=>
    box(.09,.9,.65,0,0,-.65).rotateZ(i*Math.PI/2))), standard(0xe64f65,{metalness:.4,roughness:.3}),limits.missiles);
  const missileJet = batch('missile-thrust', exhaustGeometry(.12, 1.15).translate(0, 0, -.9),
    exhaustMaterial('missile', .34), limits.missiles);
  const missileCore = batch('missile-hot-core', exhaustGeometry(.047, .37).translate(0, 0, -.9),
    exhaustMaterial('missile-core', .72, true), limits.missiles);
  const waveArc = batch('forward-wave-arc',new THREE.TorusGeometry(1,.055,6,32,Math.PI).rotateX(Math.PI/2),
    basic(0xffffff,{transparent:true,opacity:.9,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.waves);
  // The thrown wave has a physical carrier: a glowing, pulsing jellyfish.
  // Tentacles share one geometry and shader; no scene nodes are created per wave.
  const jellyTime = { value: 0 };
  const jellyBell = batch('jellyfish-bell', new THREE.SphereGeometry(.92,24,12,0,TAU,0,Math.PI*.56).scale(1,.74,1).translate(0,.32,0),
    standard(0xee9aff,{emissive:0xae38dd,emissiveIntensity:.8,roughness:.12,metalness:.03,transparent:true,opacity:.57,depthWrite:false,side:THREE.DoubleSide}), limits.waves);
  const jellyRim = batch('jellyfish-luminous-rim',new THREE.TorusGeometry(.9,.065,6,32).rotateX(Math.PI/2).translate(0,.19,0),
    basic(0xffc9ff,{transparent:true,opacity:.9,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.waves);
  const tentacleParts=[];
  for(let i=0;i<9;i++){
    const angle=i*TAU/9, length=1.6+(i%3)*.45;
    const curve=new THREE.CatmullRomCurve3(Array.from({length:9},(_,j)=>{
      const t=j/8;
      return new THREE.Vector3(Math.sin(angle)*(.7-.19*t)+Math.sin(t*7+i)*.13*t,.2-t*(1.05+(i%2)*.27),Math.cos(angle)*.66-t*length);
    }));
    tentacleParts.push(new THREE.TubeGeometry(curve,16,i%3===0?.047:.031,5,false));
  }
  const tentacleMaterial=standard(0xf4acff,{emissive:0xb64cef,emissiveIntensity:1.05,roughness:.34,transparent:true,opacity:.8,depthWrite:false});
  tentacleMaterial.onBeforeCompile=shader=>{
    shader.uniforms.uJellyTime=jellyTime;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uJellyTime;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sway = 1.0 - smoothstep(-1.3, 0.15, position.y);\ntransformed.x += sin(uJellyTime * 5.5 + position.z * 3.4 + position.x * 2.0) * 0.2 * sway;\ntransformed.y += sin(uJellyTime * 4.0 + position.z * 4.0) * 0.12 * sway;');
  };
  tentacleMaterial.customProgramCacheKey=()=> 'race3d-jellyfish-tentacles-v1';
  const jellyTentacles=batch('jellyfish-tentacles',combine(tentacleParts),tentacleMaterial,limits.waves);
  const jellyCore=batch('jellyfish-heart',combine([sphere(.29,0,.47,0),sphere(.09,-.26,.41,.71),sphere(.09,.26,.41,.71)]),
    basic(0xfff0ff,{transparent:true,opacity:.9,depthWrite:false,toneMapped:false}),limits.waves);
  const jellyMeshes=[jellyBell,jellyRim,jellyTentacles,jellyCore];
  const shieldBubble = batch('shield-bubble',new THREE.SphereGeometry(2.85,24,16),standard(0x71caff,{
    roughness:.08,metalness:.12,emissive:0x168cde,emissiveIntensity:.45,transparent:true,opacity:.18,depthWrite:false,
    side:THREE.DoubleSide
  }),limits.cars);
  const shieldRim = batch('shield-energy-rings',combine([
    new THREE.TorusGeometry(2.83,.043,5,40),new THREE.TorusGeometry(2.83,.043,5,40).rotateX(Math.PI/2),
    new THREE.TorusGeometry(2.83,.025,5,40).rotateY(Math.PI/2)
  ]),basic(0x71d8ff,{transparent:true,opacity:.76,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  const freezeShell = batch('frozen-car-crystal',new THREE.IcosahedronGeometry(2.7,1),standard(0xa6ecff,{
    roughness:.15,metalness:.1,emissive:0x229cce,emissiveIntensity:.55,transparent:true,opacity:.28,depthWrite:false
  }),limits.cars);
  const freezeEdges = batch('frozen-car-edges',new THREE.IcosahedronGeometry(2.74,1),basic(0xc7f8ff,{
    transparent:true,opacity:.8,depthWrite:false,toneMapped:false,wireframe:true
  }),limits.cars);
  const repairHalo = batch('repair-energy',new THREE.TorusGeometry(1.45,.09,6,32).rotateX(Math.PI/2),
    basic(0x67ffb0,{transparent:true,opacity:.8,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  const repairSweep = batch('repair-restoration-silhouette',combine([
    box(2.75,.065,.065,0,.2,1.73),box(2.75,.065,.065,0,.2,-1.73),
    box(.065,.065,3.46,-1.38,.2,0),box(.065,.065,3.46,1.38,.2,0),
    new THREE.TorusGeometry(.64,.045,5,20).rotateY(Math.PI/2).translate(-1.48,.3,.96),
    new THREE.TorusGeometry(.64,.045,5,20).rotateY(Math.PI/2).translate(1.48,.3,.96),
    new THREE.TorusGeometry(.64,.045,5,20).rotateY(Math.PI/2).translate(-1.48,.3,-.96),
    new THREE.TorusGeometry(.64,.045,5,20).rotateY(Math.PI/2).translate(1.48,.3,-.96)
  ]),basic(0x8bffc0,{transparent:true,opacity:.65,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  const repairCross=batch('repair-restoring-cross',combine([box(.18,.75,.16,0,0,0),box(.75,.18,.16,0,0,0)]),
    basic(0xcaffdc,{transparent:true,opacity:.95,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),limits.cars);
  // Small layered exhaust volumes fade along the jet instead of drawing an
  // opaque cone. Their local -Z axis starts at the measured exhaust outlet.
  function exhaustGeometry(radius, length) {
    const positions = [], uvs = [], indices = [];
    const rings = 15, sides = 12;
    for (let ring = 0; ring <= rings; ring++) {
      const t = ring / rings;
      const r = radius * (.68 + Math.sin(Math.PI * t) * .42) * Math.pow(1 - t, .7);
      for (let side = 0; side <= sides; side++) {
        const angle = side / sides * TAU;
        positions.push(Math.cos(angle) * r, Math.sin(angle) * r, -t * length);
        uvs.push(side / sides, t);
        if (ring < rings && side < sides) {
          const a = ring * (sides + 1) + side, b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  }
  function exhaustMaterial(key, opacity, hot = false) {
    const material = basic(0xffffff, { transparent: true, opacity, depthWrite: false,
      toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide });
    material.onBeforeCompile = shader => {
      shader.uniforms.exhaustTime = exhaustTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float exhaustTime;\nvarying vec2 vExhaustUv;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vExhaustUv = uv;
          float exhaustT = uv.y;
          float exhaustPhase = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * .31;
          transformed.x += sin(exhaustTime * 34.0 - exhaustT * 21.0 + exhaustPhase) * .018 * exhaustT;
          transformed.y += sin(exhaustTime * 27.0 - exhaustT * 17.0 + exhaustPhase) * .014 * exhaustT;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float exhaustTime;\nvarying vec2 vExhaustUv;')
        .replace('#include <opaque_fragment>', `
          float exhaustT = vExhaustUv.y;
          float wisps = .78 + .13 * sin(exhaustT * 39.0 - exhaustTime * 38.0 + sin(vExhaustUv.x * 18.85) * 1.4);
          float softEdge = pow(abs(sin(vExhaustUv.x * 6.28318)), .32) * .5 + .5;
          outgoingLight *= mix(vec3(${hot ? '.94, .98, 1.0' : '.54, .76, 1.0'}), vec3(.19, .36, .71), exhaustT);
          diffuseColor.a *= pow(1.0 - exhaustT, 1.55) * smoothstep(0.0, .035, exhaustT) * wisps * softEdge;
          #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => `race3d-exhaust-${key}-v1`;
    return material;
  }
  const launchPlume = batch('launch-vertical-plume', exhaustGeometry(.28, 2.7).rotateX(-Math.PI / 2),
    exhaustMaterial('launch', .28), limits.cars);
  const launchCore = batch('launch-hot-core', exhaustGeometry(.10, 1.0).rotateX(-Math.PI / 2),
    exhaustMaterial('launch-core', .65, true), limits.cars);

  function fadedMaterial(material, key) {
    material.transparent = true;
    material.depthWrite = false;
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aPowerAlpha;\nvarying float vPowerAlpha;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPowerAlpha = aPowerAlpha;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vPowerAlpha;')
        .replace('#include <opaque_fragment>', 'diffuseColor.a *= vPowerAlpha;\n#include <opaque_fragment>');
      if (key === 'boost-trail') {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vExhaustNormal;\nvarying vec3 vExhaustView;')
          .replace('#include <project_vertex>', `#include <project_vertex>
            vec3 scaleSquared = vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
            vExhaustNormal = normalMatrix * mat3(instanceMatrix) * (normal / max(scaleSquared, vec3(.000001)));
            vExhaustView = -mvPosition.xyz;`);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vExhaustNormal;\nvarying vec3 vExhaustView;')
          .replace('#include <opaque_fragment>', 'diffuseColor.a *= pow(max(0.0, dot(normalize(vExhaustNormal), normalize(vExhaustView))), 1.8);\n#include <opaque_fragment>');
      }
    };
    material.customProgramCacheKey = () => `race3d-item-alpha-${key}`;
    return material;
  }
  function particlePool(name, capacity, material) {
    const geometry = new THREE.SphereGeometry(1, name === 'boost-trail' ? 16 : 7, name === 'boost-trail' ? 10 : 5);
    const alpha = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1);
    geometry.setAttribute('aPowerAlpha', alpha);
    const mesh = batch(name, geometry, fadedMaterial(material, name), capacity);
    const particles = Array.from({ length: capacity }, () => ({
      live: false, age: 0, life: 1, size: 1, grow: 0, gravity: 0,
      position: new THREE.Vector3(), velocity: new THREE.Vector3(), color: new THREE.Color()
    }));
    return { mesh, particles, alpha, cursor: 0 };
  }
  const smoke = particlePool('explosion-smoke', limits.smoke, standard(0xffffff, { roughness: 1, metalness: 0, opacity: .58 }));
  const sparks = particlePool('item-sparks', limits.sparks, basic(0xffffff, {
    opacity: .95, toneMapped: false, blending: THREE.AdditiveBlending
  }));
  const trails = particlePool('boost-trail', limits.trails, basic(0xffffff, {
    opacity: .19, toneMapped: false, blending: THREE.AdditiveBlending
  }));
  const shockAlpha = new THREE.InstancedBufferAttribute(new Float32Array(limits.shockwaves), 1);
  const shockGeometry = new THREE.TorusGeometry(1, .075, 6, 48).rotateX(Math.PI / 2);
  shockGeometry.setAttribute('aPowerAlpha', shockAlpha);
  const shockMesh = batch('explosion-shockwave', shockGeometry, fadedMaterial(basic(0xffc46b, {
    opacity: .88, toneMapped: false, blending: THREE.AdditiveBlending
  }), 'shockwave'), limits.shockwaves);
  const shocks = Array.from({ length: limits.shockwaves }, () => ({ live: false, age: 0, radius: 1, position: new THREE.Vector3() }));
  const blast = particlePool('explosion-fireball',32,basic(0xffffff,{opacity:.84,toneMapped:false}));
  let shockCursor = 0;
  const flameOuter = batch('boost-jet', exhaustGeometry(.18, 1.6), exhaustMaterial('boost', .34), limits.flames);
  const flameCore = batch('boost-hot-core', exhaustGeometry(.073, .55), exhaustMaterial('boost-core', .78, true), limits.flames);
  const nitroStreaks=batch('nitro-energy-streaks',new THREE.PlaneGeometry(.16,3.8).rotateX(-Math.PI/2),basic(0x48eaff,{transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),120);

  // Inventory objects are actual lit geometry, floating above their receiver.
  // Geometry/materials are shared with the thrown objects wherever possible.
  const held = Object.fromEntries(itemTypes.map(type=>[type,[]]));
  function heldPart(type,name,geometry,material){
    const mesh=batch(`held-${type}-${name}`,geometry,material,limits.cars);held[type].push(mesh);return mesh;
  }
  function heldCopy(type,mesh,geometry=mesh.geometry){return heldPart(type,mesh.name,geometry,mesh.material);}
  const silver=standard(0xe2f0ff,{roughness:.2,metalness:.65});
  const whiteHot=basic(0xf4fff4,{toneMapped:false});
  function rocketObject(type,tint,wide=false){
    heldPart(type,'body',combine([new THREE.CylinderGeometry(.24,.3,1.3,12),new THREE.ConeGeometry(.26,.58,12).translate(0,.94,0)]),silver);
    heldPart(type,'fins',combine([box(.12,.65,.96,0,-.54,0),box(.96,.65,.12,0,-.54,0),sphere(.15,0,.34,.24)]),standard(tint,{roughness:.3,metalness:.42,emissive:tint,emissiveIntensity:.15}));
    heldPart(type,'flame',exhaustGeometry(.13,wide?.82:.58).rotateX(-Math.PI/2).translate(0,-.66,0),exhaustMaterial(`held-${type}`,.34));
    heldPart(type,'hot-core',exhaustGeometry(.047,.29).rotateX(-Math.PI/2).translate(0,-.66,0),exhaustMaterial(`held-${type}-core`,.72,true));
  }
  rocketObject('launch',0xb68aff,true);
  heldPart('launch','orbital-ring',new THREE.TorusGeometry(.88,.055,6,28).rotateX(Math.PI*.34),basic(0xe4c7ff,{toneMapped:false}));
  rocketObject('rocket',0x36edbe,true);
  heldPart('rocket','engine-collars',combine([new THREE.TorusGeometry(.3,.075,6,16).rotateX(Math.PI/2).translate(0,-.45,0),new THREE.TorusGeometry(.3,.06,6,16).rotateX(Math.PI/2).translate(0,-.21,0)]),standard(0x1ac38f,{metalness:.6,roughness:.22}));
  function extrudedPolygon(points,depth=.22){
    const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
    return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.045,bevelThickness:.04,bevelSegments:2,steps:1}).translate(0,0,-depth/2);
  }
  const bolt=extrudedPolygon([[.16,1.06],[-.69,-.1],[-.12,-.1],[-.32,-1.03],[.73,.26],[.15,.26]],.27);
  heldPart('boost','lightning',bolt,standard(0x36f4ec,{roughness:.2,metalness:.4,emissive:0x09bcb7,emissiveIntensity:.52}));
  heldPart('boost','power-ring',new THREE.TorusGeometry(.86,.038,5,28).rotateY(.4),basic(0x92fff7,{toneMapped:false}));
  for(const mesh of [bombBody,bombCollar,bombFuse])heldCopy('bomb',mesh);
  heldPart('bomb','lit-fuse',sphere(.115,.4,1.04,.03),basic(0xffc34d,{toneMapped:false}));
  const shieldShape=[[0,1.03],[.79,.72],[.65,-.35],[0,-1.02],[-.65,-.35],[-.79,.72]];
  heldPart('shield','plate',extrudedPolygon(shieldShape,.3),standard(0x369ded,{roughness:.17,metalness:.55,emissive:0x18539a,emissiveIntensity:.4}));
  heldPart('shield','crest',combine([box(.15,1.15,.1,0,.13,.24),box(.85,.15,.1,0,.22,.24)]),standard(0xb9eaff,{roughness:.14,metalness:.75}));
  for(const mesh of [bananaOuter,bananaInner,bananaTips])heldCopy('banana',mesh);
  heldCopy('missile',missileBody,missileBody.geometry.clone().rotateX(-Math.PI/2));
  heldCopy('missile',missileFins,missileFins.geometry.clone().rotateX(-Math.PI/2));
  heldPart('missile','target-ring',new THREE.TorusGeometry(.84,.04,5,28),basic(0xff6475,{toneMapped:false}));
  for(const mesh of jellyMeshes)heldCopy('shockwave',mesh);
  const snowParts=[];
  for(let i=0;i<6;i++){
    const a=i*TAU/6;
    snowParts.push(box(.105,1.65,.13,0,0,0).rotateZ(a));
    for(const side of [-1,1])snowParts.push(box(.09,.37,.12,side*.12,.56,0).rotateZ(side*.65).rotateZ(a));
  }
  heldPart('freeze','snow-crystal',combine(snowParts),standard(0xc6f7ff,{roughness:.18,metalness:.35,emissive:0x4ac8ed,emissiveIntensity:.5}));
  heldPart('freeze','crystal-core',new THREE.IcosahedronGeometry(.29,0),standard(0x65d6ff,{roughness:.1,metalness:.45}));
  heldPart('repair','green-ring',new THREE.TorusGeometry(.76,.15,8,24),standard(0x20cb77,{roughness:.24,metalness:.4,emissive:0x13894f,emissiveIntensity:.5}));
  heldPart('repair','medical-cross',combine([box(.23,1.05,.27,0,0,.06),box(1.05,.23,.27,0,0,.06)]),whiteHot);

  function frame(source, lift = 0) {
    const distance = finite(source?.distance);
    const sample = track.sampleTrack(distance);
    tangent.set(finite(sample.tangent?.x), finite(sample.tangent?.y), finite(sample.tangent?.z, 1));
    if (tangent.lengthSq() < 1e-8) tangent.set(0, 0, 1);
    tangent.normalize();
    right.set(finite(sample.right?.x, tangent.z), finite(sample.right?.y), finite(sample.right?.z, -tangent.x));
    if (right.lengthSq() < 1e-8) right.set(tangent.z, 0, -tangent.x);
    right.normalize();
    point.set(finite(sample.position?.x), finite(sample.position?.y), finite(sample.position?.z));
    point.addScaledVector(right, finite(source?.lateral));
    point.y += lift + finite(sample.bank) * finite(source?.lateral);
    dummy.position.copy(point);
    dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
    dummy.scale.setScalar(1);
    return dummy;
  }
  function stamp(mesh, index, transform = dummy) { transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix); }
  function count(meshes, n) { for (const mesh of meshes) { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; } }
  // Scale only the visual silhouette. Simulation positions, hit radii and
  // trajectories remain untouched. A bounded minimum size survives wide shots.
  function readableScale(base=1,pixels=32,maximum=3.2,nativeSize=2.25) {
    if(!viewCamera?.isPerspectiveCamera)return base;
    worldItemPosition.copy(dummy.position).applyMatrix4(group.matrixWorld);
    const distance=cameraPosition.distanceTo(worldItemPosition);
    const worldPerPixel=2*distance*Math.tan(viewCamera.fov*Math.PI/360)/viewHeight;
    return clamp(pixels*worldPerPixel/(nativeSize*worldScale),base,maximum);
  }
  function particle(pool, position, velocity, hex, life, size, grow = 0, gravity = 0) {
    const p = pool.particles[pool.cursor];
    pool.cursor = (pool.cursor + 1) % pool.particles.length;
    p.live = true; p.age = 0; p.life = life; p.size = size; p.grow = grow; p.gravity = gravity;
    p.position.copy(position); p.velocity.copy(velocity); p.color.setHex(hex);
  }
  // Local deterministic variation is deliberately separate from the game RNG.
  function jitter(seed) { const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return value - Math.floor(value); }
  function spray(position, kind, radius = 1) {
    const explosion = kind === 'explosion';
    const seed = ++burstSerial * 83;
    const n = explosion ? 34 : 12;
    for (let i = 0; i < n; i++) {
      const angle = jitter(seed + i * 3) * TAU;
      const speed = explosion ? 4 + jitter(seed + i * 7) * 7 : 1.2 + jitter(seed + i * 7) * 2.4;
      offset.set(Math.sin(angle) * speed, (explosion ? 2 : .5) + jitter(seed + i * 9) * (explosion ? 6 : 2), Math.cos(angle) * speed);
      const burstColor = {boost:0x42ffe3,launch:0xb68aff,rocket:0x36edbe,repair:0x74ef9a,shield:0x5bbcff,freeze:0xb8f5ff,shockwave:0xe892ff}[kind] || 0xffe59b;
      particle(sparks, position, offset, explosion ? (i % 3 ? 0xffc261 : 0xff693c) : burstColor,
        explosion ? .72 + jitter(seed + i) * .48 : .58 + jitter(seed + i) * .38, explosion ? .20 : .12, .7, explosion ? 8 : 2);
    }
    if (!explosion) return;
    for (let i = 0; i < 14; i++) {
      const angle = jitter(seed + i * 11) * TAU;
      offset.set(Math.sin(angle) * (1 + jitter(seed + i) * 3), 1.4 + jitter(seed + i * 2) * 3.3, Math.cos(angle) * (1 + jitter(seed + i) * 3));
      particle(smoke, position, offset, i % 3 ? 0x555251 : 0x8d8377, 1.2 + jitter(seed + i * 5) * .8, .70 + jitter(seed + i * 8) * .6, 2.3);
    }
    for(let i=0;i<5;i++){offset.set((jitter(seed+i*13)-.5)*3,.8+jitter(seed+i*17)*1.9,(jitter(seed+i*19)-.5)*3);particle(blast,position,offset,i%2?0xff5925:0xffc04a,.42+jitter(seed+i)*.24,1.1+jitter(seed+i*7)*.7,2.5);}
    const shock = shocks[shockCursor];
    shockCursor = (shockCursor + 1) % shocks.length;
    shock.live = true; shock.age = 0; shock.radius = clamp(radius, 1, 16);
    shock.position.copy(position); shock.position.y -= .55;
  }
  function updateParticles(pool, dt) {
    let n = 0;
    for (const p of pool.particles) {
      if (!p.live) continue;
      p.age += dt;
      if (p.age >= p.life) { p.live = false; continue; }
      p.velocity.y -= p.gravity * dt;
      p.position.addScaledVector(p.velocity, dt);
      const t = p.age / p.life;
      dummy.position.copy(p.position); dummy.rotation.set(0, 0, 0);
      const size = p.size * (1 + t * p.grow);
      if (pool === trails) {
        dummy.rotation.y = Math.atan2(p.velocity.x, p.velocity.z);
        dummy.scale.set(size, size * .5, size * 3.6);
      } else dummy.scale.setScalar(size);
      stamp(pool.mesh, n);
      pool.mesh.setColorAt(n, p.color);
      pool.alpha.array[n] = (1 - t) * (1 - t);
      n++;
    }
    pool.alpha.needsUpdate = true;
    count([pool.mesh], n);
    if (pool.mesh.instanceColor) pool.mesh.instanceColor.needsUpdate = true;
  }

  function handleEvents(events = [], { cars = [] } = {}) {
    if (disposed) return;
    for (const event of events) {
      if (!event) continue;
      const car = cars.find(car => car.id === event.carId);
      if (event.type === 'item-pickup' && itemTypes.includes(event.itemType) && event.carId != null) {
        if (!indicators.has(event.carId) && indicators.size >= limits.cars) indicators.delete(indicators.keys().next().value);
        const duration = clamp(finite(event.displayDuration, finite(event.duration, 25)) / Math.max(1, finite(event.timeScale, 5)), 4, 7);
        indicators.set(event.carId, { type: event.itemType, at: clock, until: clock + duration });
      }
      if (!['item-pickup', 'banana-launch', 'banana-land', 'banana-hit', 'bomb-launch', 'bomb-bounce', 'bomb-explode', 'tyre-blowout', 'tire-blowout', 'tyre-recovered', 'trick-complete', 'boost', 'launch-activate', 'rocket-activate', 'shield-activate',
        'missile-launch', 'missile-hit', 'shockwave-launch', 'shockwave-hit', 'freeze-launch', 'freeze-hit',
        'repair', 'launch-land', 'shield-block'].includes(event.type) && !event.type.startsWith('extra-')) continue;
      const groundEvent = ['bomb-explode','bomb-bounce','banana-land','banana-hit','missile-hit','shockwave-hit','freeze-hit','launch-land'].includes(event.type);
      frame({ distance: event.distance ?? car?.distance, lateral: event.lateral ?? car?.lateral }, .65 + (groundEvent ? 0 : Math.max(0,finite(car?.flightHeight))));
      // event coordinates refer to the impact location, not the current shooter.
      if (event.position && typeof event.position === 'object') {
        point.set(finite(event.position.x, point.x), finite(event.position.y, point.y), finite(event.position.z, point.z));
      }
      if(/^(tyre|tire)-blowout$/.test(event.type)){
        // A short pressure pop, rubber fragments and a dense wheel-level puff.
        const wheel=clamp(event.wheelIndex,0,3);point.addScaledVector(right,(wheel%2?1:-1)*1.15).addScaledVector(tangent,wheel<2?1.4:-1.4);point.y-=.35;
        for(let i=0;i<14;i++){const a=i*2.399;offset.set(Math.sin(a)*(2+i%3),1.3+(i%4)*.65,Math.cos(a)*(2+i%3));particle(smoke,point,offset,i%3?0xaeb6bd:0x30363c,.85+i*.025,.5+i%3*.16,3.3);particle(sparks,point,offset,0xffc669,.4,.18,.3,8);}
        const shock=shocks[shockCursor];shockCursor=(shockCursor+1)%shocks.length;shock.live=true;shock.age=0;shock.radius=3;shock.position.copy(point);shock.position.y=Math.max(.09,shock.position.y-.2);
        visibleItems.tyreCues++;continue;
      }
      const kind = event.type === 'bomb-explode' || event.type === 'missile-hit' || event.type==='extra-charge-burst' ? 'explosion'
        : event.type === 'item-pickup' ? event.itemType
          : event.type.startsWith('shield') ? 'shield' : event.type==='tyre-recovered'?'repair':event.type==='trick-complete'?'boost':event.type.startsWith('extra-')?event.itemType:event.type.split('-')[0];
      spray(point, kind, kind==='explosion'?Math.min(16,(event.radius??2.8)*1.8):(event.radius??1));
    }
  }

  function update(dt = 0, state = {}, { cars = state.cars || [], camera = null } = {}) {
    if (disposed) return;
    const step = clamp(dt, 0, .1);
    const source = state.powerups || state;
    const time = finite(source.time, clock);
    if (lastTime !== null && time < lastTime - .001) reset();
    lastTime = time;
    clock += step;
    viewCamera=camera;viewHeight=Math.max(320,globalThis.innerHeight||720);
    group.updateWorldMatrix(true,false);worldScale=Math.max(.001,group.matrixWorld.elements[0]**2+group.matrixWorld.elements[1]**2+group.matrixWorld.elements[2]**2)**.5;
    camera?.getWorldPosition(cameraPosition);
    visibleItems.bananas=visibleItems.airborneBananas=visibleItems.bombs=visibleItems.missiles=0;
    authoredItems.beginFrame(clock);
    jellyTime.value=clock;
    exhaustTime.value=reducedMotion?0:clock;
    emissionTime += step;
    // Keep effect emission bounded during slow frames and background-tab wakes.
    const emitTrail = !reducedMotion&&emissionTime >= 1 / 30;
    if (emitTrail) emissionTime %= 1 / 30;
    let n = 0;
    for (const pickup of source.pickups || []) {
      if (pickup.active === false || n >= limits.pickups) continue;
      frame(pickup, 1.45 + Math.sin(clock * 2.3 + n * 1.7) * .16);
      dummy.rotation.y += clock * 1.25 + n * .47;
      dummy.rotation.z = Math.sin(clock * 1.7 + n) * .07;
      for (const mesh of [pickupCore, pickupFrame, pickupGlyph,pickupPrism]) stamp(mesh, n);
      // All boxes conceal their result. Animated prism faces are original;
      // item selection belongs to each driver's independent inventory.
      color.setHSL((clock*.13+n*.073)%1,.78,.58);
      pickupCore.setColorAt(n, color);
      frame(pickup, .08);
      stamp(pickupHalo, n);
      n++;
    }
    count([pickupCore, pickupFrame, pickupGlyph, pickupHalo,pickupPrism], n);
    if (pickupCore.instanceColor) pickupCore.instanceColor.needsUpdate = true;

    n = 0;
    for (const hazard of source.hazards || []) {
      if (hazard.type !== 'banana' || hazard.active === false || n >= limits.bananas) continue;
      const airborne=hazard.phase==='airborne';
      frame(hazard, Math.max(.055,finite(hazard.height,.055)));
      dummy.rotation.y += finite(hazard.heading) + finite(hazard.id?.toString?.().length, n) * .73 + (airborne?finite(hazard.age)*6:0);
      dummy.rotation.z=airborne?Math.sin(finite(hazard.age)*7)*.22:0;
      const remaining = Math.max(0, finite(hazard.ttl, 18) - finite(hazard.age));
      const size=readableScale(1.5,34,3.4)*Math.min(1,remaining*2.5);
      dummy.scale.setScalar(size);
      if (!authoredItems.stamp('banana','hazard',n,dummy,{grounded:!airborne})) for (const mesh of [bananaOuter, bananaInner, bananaTips]) stamp(mesh, n);
      frame(hazard,.075);dummy.scale.set(1.8+Math.sin(clock*5+n)*.08,1,1.8+Math.sin(clock*5+n)*.08);stamp(bananaMarker,n);
      visibleItems.bananas++;if(airborne)visibleItems.airborneBananas++;
      n++;
    }
    count([bananaOuter, bananaInner, bananaTips], authoredItems.isReady('banana') ? 0 : n);
    count([bananaMarker],n);

    n = 0;
    for (const bomb of source.projectiles || []) {
      if (bomb.type !== 'bomb' || bomb.active === false || n >= limits.bombs) continue;
      // Live bombs use the exact physics bounce height and remain visible until
      // that projectile is removed. The age arc is for legacy states only.
      const age = Math.max(0, finite(bomb.age));
      const toss = finite(bomb.height, finite(bomb.bounceHeight, age < .65 ? Math.sin(Math.PI * age / .65) * 2.2 : 0));
      frame(bomb, finite(bomb.height, .75 + toss));
      dummy.rotation.y += finite(bomb.heading);
      stamp(bombWake, n);
      frame(bomb, finite(bomb.height, .75 + toss));
      dummy.rotation.y += finite(bomb.heading) + age * 2.6;
      dummy.rotation.z = Math.sin(age * 5) * .18;
      const size=readableScale(1.45,36,3.2);dummy.scale.setScalar(size);
      if (!authoredItems.stamp('bomb','projectile',n,dummy,{scale:1})) for (const mesh of [bombBody, bombCollar, bombFuse]) stamp(mesh, n);
      const pulse = .75 + .25 * Math.sin(clock * 42 + n);
      offset.set(.4, 1.04, .03).multiplyScalar(size).applyQuaternion(dummy.quaternion);
      dummy.position.add(offset);
      dummy.scale.setScalar(pulse*size*1.3);
      stamp(bombEmber, n);
      if (emitTrail && finite(bomb.fuse, 1) > 0) {
        offset.set(Math.sin(clock * 47 + n) * .7, 1.5, Math.cos(clock * 39 + n) * .7);
        particle(sparks, dummy.position, offset, 0xffc266, .16, .038, 0, 2);
        offset.copy(tangent).multiplyScalar(-2.5);offset.y=.3;
        particle(trails,point,offset,0xffb66c,.34,.14,.7);
      }
      frame(bomb,.10);const warning=1.9+.12*Math.sin(clock*(finite(bomb.fuse)>1?8:20));dummy.scale.set(warning,1,warning);stamp(bombMarker,n);
      visibleItems.bombs++;
      n++;
    }
    count([bombBody, bombCollar, bombFuse], authoredItems.isReady('bomb') ? 0 : n);
    count([bombEmber,bombWake,bombMarker], n);

    n = 0;
    for (const missile of source.projectiles || []) {
      if (missile.type !== 'missile' || missile.active === false || n >= limits.missiles) continue;
      frame(missile, Math.max(0,finite(missile.height,1.1)));
      dummy.rotation.y += finite(missile.heading);
      dummy.scale.setScalar(readableScale(1.2,32,2.8));
      if(!authoredItems.stamp('missile','projectile',n,dummy,{scale:1.12})){stamp(missileBody,n);stamp(missileFins,n);}
      dummy.scale.set(1,1,1+.065*Math.sin(clock*49+n));stamp(missileJet,n);stamp(missileCore,n);
      if(emitTrail){offset.copy(tangent).applyAxisAngle(UP,finite(missile.heading)).multiplyScalar(-4);point.addScaledVector(offset,.25);particle(trails,point,offset,0x92b1d8,.18,.055,1.1);}
      n++;
      visibleItems.missiles++;
    }
    count([missileBody,missileFins],authoredItems.isReady('missile')?0:n);count([missileJet,missileCore],n);
    n=0;let jellyN=0;
    for(const wave of source.waves || []){
      if(!['shockwave','freeze'].includes(wave.type) || wave.active===false || n>=limits.waves)continue;
      if(wave.type==='shockwave'&&jellyN<limits.waves){
        frame(wave,finite(wave.height,1.65));dummy.rotation.y+=finite(wave.heading);
        const pulse=1+Math.sin(clock*7+finite(wave.age)*2)*.12;
        dummy.scale.set(pulse,1/pulse,pulse);
        if(!authoredItems.stamp('shockwave','wave',jellyN,dummy,{scale:1.2})){stamp(jellyBell,jellyN);stamp(jellyRim,jellyN);stamp(jellyCore,jellyN);dummy.scale.set(1,1,1);stamp(jellyTentacles,jellyN);}jellyN++;
      }
      frame(wave,.14);dummy.rotation.y+=finite(wave.heading);dummy.scale.set(clamp(wave.radius,1,8),1,1.4);
      stamp(waveArc,n);
      color.setHex(wave.type==='freeze'?0x8be7ff:0xe58aff);waveArc.setColorAt(n,color);
      if(emitTrail){offset.copy(tangent).multiplyScalar(-1);offset.y=.8;particle(sparks,point,offset,wave.type==='freeze'?0xbdf8ff:0xeb9dff,.4,.1,1);}
      n++;
    }
    count([waveArc],n);count(jellyMeshes,authoredItems.isReady('shockwave')?0:jellyN);
    if(waveArc.instanceColor)waveArc.instanceColor.needsUpdate=true;

    n = 0;
    // Cars and effects share the scaled course parent. Read rendered poses so
    // outlet position and plume direction also follow suspension, banks/flips.
    const carGroup = group.parent?.children.find(child => child.name === 'race3d-cars');
    const renderedCars = new Map((carGroup?.children || []).map(model => [model.userData.racerId, model]));
    group.updateWorldMatrix(true, false);
    carGroup?.updateWorldMatrix(true, false);
    inverseEffects.copy(group.matrixWorld).invert();
    extraVisuals.update(state,cars,camera,renderedCars);
    if(emitTrail)for(const car of cars){
      if(car.finished||!(car.tyreBlowoutRemaining>0)||car.flightRemaining>0)continue;
      const wheel=clamp(car.tyreBlowoutWheel,0,3),side=wheel%2?1:-1,axle=wheel<2?1:-1,severity=clamp(car.tyreBlowoutSeverity,.15,1);
      const model=renderedCars.get(car.id),dims=model?.userData.assetDimensions;
      if(model){point.set(side*(dims?.width||2)*.48,.18,axle*(dims?.length||4.4)*.31).applyMatrix4(model.matrixWorld).applyMatrix4(inverseEffects);}
      else{frame(car,.14);point.addScaledVector(right,side*1.15).addScaledVector(tangent,axle*1.4);}
      offset.set(0,.8+severity,0);particle(smoke,point,offset,0x8a9297,.65,.25+severity*.23,2.3);
      if(Math.floor(clock*14)%3===0){offset.set(side*1.8,.6,-1);particle(sparks,point,offset,0xffc077,.22,.08,.3,5);}
    }
    activeNitroIds.length=activeRocketIds.length=0;let streakN=0;
    for (const car of cars.slice(0, 60)) {
      const rocketActive=finite(car.rocketRemaining)>0&&!(car.itemEffects?.emp>0);if(rocketActive&&!car.finished)activeRocketIds.push(car.id);
      const rocket=false;
      if (car.finished || (finite(car.boost) <= 0 && !rocket)) continue;
      // A soft charge glow lasts exactly as long as the active effect. Actual
      // thrust changes its length; traction limits never hide activation.
      const thrust = Math.max(0, finite(car.nitroAcceleration));
      const power=clamp(Math.max(.24,thrust/(rocket?9:7)),0,1);
      if(car.boost>0)activeNitroIds.push(car.id);if(rocket)activeRocketIds.push(car.id);
      const jetWidth = Math.sqrt(power), jetLength = .2 + .8 * power;
      frame(car, Math.max(0,finite(car.flightHeight)));
      heading.copy(tangent).applyAxisAngle(UP, finite(car.heading));
      const yaw = Math.atan2(heading.x, heading.z);
      right.set(heading.z, 0, -heading.x).normalize();
      const model = renderedCars.get(car.id);
      const outlets=model?.userData.exhaustAnchors||car.exhaustAnchors||defaultExhaustAnchors;
      const anchors=outlets.length?outlets:[[-.62,.28,-2.1],[.62,.28,-2.1]];
      const chassis = model?.getObjectByName('chassis-motion');
      if (model) {
        (chassis||model).updateWorldMatrix(true,false);
        exhaustMatrix.multiplyMatrices(inverseEffects, (chassis || model).matrixWorld);
        exhaustMatrix.decompose(exhaustOrigin, exhaustRotation, exhaustScale);
      }
      for (const anchor of anchors.slice(0, 2)) {
        if (n >= limits.flames) break;
        const pulse=reducedMotion?1:1+.065*Math.sin(clock*43+n*2.1)+.035*Math.sin(clock*71+n);
        if (model) {
          dummy.position.set(finite(anchor[0]), finite(anchor[1]) - (chassis ? .47 : 0), finite(anchor[2]));
          dummy.position.applyMatrix4(exhaustMatrix);
          dummy.quaternion.copy(exhaustRotation);
          exhaustDirection.set(0, 0, -1).applyQuaternion(exhaustRotation).normalize();
        } else {
          dummy.position.copy(point).addScaledVector(heading, finite(anchor[2])).addScaledVector(right, finite(anchor[0]));
          dummy.position.y += finite(anchor[1]);
          dummy.rotation.set(0, yaw, 0);
          exhaustDirection.copy(heading).negate();
        }
        dummy.scale.set(1.1*jetWidth,1.1*jetWidth,pulse*2.8*jetLength);
        stamp(flameOuter, n);
        dummy.scale.set(1.2*jetWidth,1.2*jetWidth,pulse*2.6*jetLength);
        stamp(flameCore, n);
        if (emitTrail) {
          exhaustOrigin.copy(dummy.position).addScaledVector(exhaustDirection, (rocket ? 1.2 : .65) * jetLength);
          offset.copy(exhaustDirection).multiplyScalar((rocket ? 8 : 5) * jetLength);
          offset.y += .08;
          particle(trails,exhaustOrigin,offset,rocket?0xffbd71:0x48eaff,.32,.12,1.25);
        }
        n++;
      }
      if(car.boost>0&&car.flightRemaining<=0)for(const side of [-1,1]){frame(car,.10);dummy.position.addScaledVector(heading,-2).addScaledVector(right,side*.62);dummy.rotation.y=yaw;dummy.scale.set(1,1,1+power*.65);stamp(nitroStreaks,streakN++);}
    }
    count([flameOuter, flameCore], n);count([nitroStreaks],streakN);
    let shieldN=0,freezeN=0,repairN=0,launchN=0;
    const heldCounts=Object.fromEntries(itemTypes.map(type=>[type,0]));
    function carFrame(car,lift){
      frame(car,lift+Math.max(0,finite(car.flightHeight)));
      const model=renderedCars.get(car.id);
      if(model){model.getWorldPosition(point);point.applyMatrix4(inverseEffects);point.y+=lift;dummy.position.copy(point);}
      return dummy;
    }
    for(const car of cars.slice(0,limits.cars)){
      const height=Math.max(0,finite(car.flightHeight));
      const indicator=indicators.get(car.id);
      if(finite(car.shieldRemaining)>0 && !car.finished){
        carFrame(car,1.15);dummy.scale.set(1,.78,1.08);
        stamp(shieldBubble,shieldN);dummy.rotation.y+=clock*.5;stamp(shieldRim,shieldN);shieldN++;
      }
      if(finite(car.freezeRemaining)>0 && !car.finished){
        carFrame(car,1.1);dummy.scale.set(1,.67,1.06);stamp(freezeShell,freezeN);stamp(freezeEdges,freezeN);freezeN++;
      }
      if(finite(car.repairRemaining)>0&&!car.finished){
        const sweep=(clock*.85+repairN*.19)%1;
        carFrame(car,.2+sweep*2.2);dummy.rotation.y+=finite(car.heading);
        dummy.scale.setScalar(1+.08*Math.sin(clock*10));stamp(repairHalo,repairN);stamp(repairSweep,repairN);
        carFrame(car,2.4+Math.sin(clock*5)*.16);dummy.rotation.y+=clock*.9;stamp(repairCross,repairN);
        if(emitTrail){
          carFrame(car,.35);offset.set(Math.sin(clock*9)*1.2,.9+Math.sin(clock*6)*.3,Math.cos(clock*9)*1.7);point.add(offset);
          offset.set(0,1.8,0);particle(sparks,point,offset,0x80ffba,.55,.075,.9);
        }
        repairN++;
      }
      if(car.flightKind==='launch' && finite(car.launchBlastRemaining)>0 && !car.finished){
        carFrame(car,.3);const pulse=1+.15*Math.sin(clock*43+launchN);dummy.scale.set(pulse,Math.min(1.6,Math.max(.3,height/6)),pulse);
        stamp(launchPlume,launchN);stamp(launchCore,launchN);launchN++;
        if(emitTrail){offset.set(0,-4,0);particle(trails,point,offset,0x9cb6dd,.24,.12,1.1);}
      }
      let type=inventoryFace(car,finite(source.time));
      const remaining={launch:car.flightRemaining,rocket:car.rocketRemaining,boost:car.boost,shield:car.shieldRemaining,freeze:car.freezeRemaining,repair:car.repairRemaining}[type];
      if(indicator && indicator.until<=clock && finite(remaining)<=0)indicators.delete(car.id);
      if(held[type]&&!car.finished){
        const modelHeight=finite(renderedCars.get(car.id)?.userData?.assetDimensions?.height,2.0);
        const revealHeight=clamp(modelHeight+1.8,3.25,5.2);
        carFrame(car,revealHeight+Math.sin(clock*2.3+finite(car.id?.toString?.().length))*.14);
        // Show the broad authored face toward the viewer with a gentle turn.
        // The item stays physically over its car while the camera moves.
        if(camera?.isCamera){camera.getWorldPosition(itemViewPosition);group.worldToLocal(itemViewPosition);dummy.rotation.y=Math.atan2(itemViewPosition.x-dummy.position.x,itemViewPosition.z-dummy.position.z)+Math.sin(clock*.8+heldCounts[type])*.22;}
        else dummy.rotation.y+=Math.PI+Math.sin(clock*.8+heldCounts[type])*.3;
        dummy.rotation.z=Math.sin(clock*1.7)*.045;
        const age=indicator?Math.max(0,clock-indicator.at):1;
        const pop=1+Math.max(0,1-age/.40)*.24;
        dummy.scale.setScalar(pop*readableScale(1.32,34,2.8));
        if(!authoredItems.stamp(type,'held',heldCounts[type],dummy))for(const mesh of held[type])stamp(mesh,heldCounts[type]);heldCounts[type]++;
      }
    }
    for(const [id,value]of indicators)if(value.until<=clock&&!cars.some(car=>car.id===id))indicators.delete(id);
    count([shieldBubble,shieldRim],shieldN);count([freezeShell,freezeEdges],freezeN);count([repairHalo,repairSweep,repairCross],repairN);
    count([launchPlume,launchCore],launchN);for(const type of itemTypes)count(held[type],authoredItems.isReady(type)?0:heldCounts[type]);
    authoredItems.endFrame();
    updateParticles(smoke, step);
    updateParticles(sparks, step);
    updateParticles(trails, step);
    updateParticles(blast, step);visibleItems.blastCores=blast.mesh.count;
    n = 0;
    for (const shock of shocks) {
      if (!shock.live) continue;
      shock.age += step;
      if (shock.age >= .85) { shock.live = false; continue; }
      const t = shock.age / .85;
      const radius = .7 + (shock.radius - .7) * (1 - Math.pow(1 - t, 2));
      dummy.position.copy(shock.position); dummy.rotation.set(0, 0, 0);
      dummy.scale.set(radius, 1, radius);
      stamp(shockMesh, n);
      shockAlpha.array[n] = (1 - t) * .8;
      n++;
    }
    shockAlpha.needsUpdate = true;
    count([shockMesh], n);
  }

  function reset() {
    if (disposed) return;
    activeNitroIds.length=activeRocketIds.length=0;
    for(const key in visibleItems)visibleItems[key]=0;
    clock = 0; burstSerial = 0; lastTime = null; shockCursor = 0; emissionTime = 0; indicators.clear();
    authoredItems.reset();
    extraVisuals.reset();
    for (const pool of [smoke, sparks, trails, blast]) {
      pool.cursor = 0;
      for (const p of pool.particles) p.live = false;
      pool.alpha.array.fill(0); pool.alpha.needsUpdate = true;
    }
    for (const shock of shocks) shock.live = false;
    shockAlpha.array.fill(0); shockAlpha.needsUpdate = true;
    for (const mesh of batches) mesh.count = 0;
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    authoredItems.dispose();
    extraVisuals.dispose();
    group.removeFromParent();
    for (const mesh of batches) mesh.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    group.clear(); geometries.clear(); materials.clear(); textures.clear();
  }
  return { group, update, handleEvents, reset, dispose, limits, assetsReady: authoredItems.ready,
    snapshot: () => ({nitroIds:[...activeNitroIds],rocketIds:[...activeRocketIds],reducedMotion,visible:{...visibleItems,shockwaves:shockMesh.count},extended:extraVisuals.snapshot(),authored:authoredItems.snapshot(),indicators:[...indicators].map(([id,value])=>({id,...value,remaining:Math.max(0,value.until-clock)}))}) };
}
