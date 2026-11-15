import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// All coordinates are room-local. The water is intentionally translucent so the
// cutaway camera can still read the people as the chamber fills.
export default function createFloodScenario(ctx) {
  const { group, room, actors } = ctx;
  const width = room.halfWidth ?? 7;
  const depth = room.halfDepth ?? 6;
  const floor = room.floorY ?? 0;
  const ceiling = room.height ?? 7;
  const highQuality = ctx.quality !== 'low';
  let clock = 0;
  let fluidEnergy = 0;
  let previousProgress = 0;
  let waterLevel = floor + 0.035;
  let previousPhase = 'preview';
  let initialized = false;
  let roundDuration = 20;
  let disposed = false;
  let randomState = 0x47f10d;
  const random = () => {
    randomState |= 0;
    randomState = (randomState + 0x6d2b79f5) | 0;
    let n = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  const clamp = THREE.MathUtils.clamp;
  const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);
  const current = new THREE.Vector2();
  const surfaceSample = new THREE.Vector3();
  function surfaceAt(x, z, out) {
    // The same directional waves drive the water mesh and the buoyant props.
    const a = x * 1.3 + z * 0.6 + clock * 1.7;
    const b = z * 2.1 - x * 0.35 - clock * 2.25;
    const c = x * 4.1 + z * 3.2 + clock * 3.1;
    // A sealed full chamber has no spare air pocket above its waterline.
    const strength = (0.55 + fluidEnergy * 0.45) * smooth(0, 0.18, ceiling - waterLevel);
    out.set((Math.sin(a) * 0.055 + Math.sin(b) * 0.028 + Math.sin(c) * 0.012) * strength,
      (Math.cos(a) * 0.0715 - Math.cos(b) * 0.0098 + Math.cos(c) * 0.0492) * strength,
      (Math.cos(a) * 0.033 + Math.cos(b) * 0.0588 + Math.cos(c) * 0.0384) * strength);
    return out;
  }
  function currentAt(x, z, out) {
    let vx = -z * 0.038 + Math.sin(z * 0.7 + clock * 0.27) * 0.08;
    let vz = x * 0.031 + Math.cos(x * 0.6 - clock * 0.23) * 0.06;
    for (const mouth of mouths) {
      const dx = x - mouth.end.x;
      const dz = z - mouth.end.z;
      const d2 = dx * dx + dz * dz;
      const strength = 0.38 / (0.35 + d2);
      vx += dx * strength;
      vz += dz * strength;
    }
    return out.set(vx * fluidEnergy, vz * fluidEnergy);
  }
  const material = (color, metalness = 0, roughness = 0.6, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const mats = {
    pipe: material(0x506a70, 0.88, 0.28),
    edge: material(0x82979a, 0.86, 0.23),
    rust: material(0x5c3d2d, 0.65, 0.77),
    dark: material(0x101e25, 0.6, 0.55),
    yellow: material(0xe8ac32, 0.35, 0.43),
    black: material(0x13191b, 0.4, 0.55),
    red: material(0x9e3e29, 0.6, 0.36),
    wood: material(0x795639, 0, 0.93),
    woodLight: material(0xa67a4d, 0, 0.87),
    orange: material(0xe78232, 0, 0.61),
    white: material(0xd8d6bc, 0.1, 0.46),
    dial: material(0xe8e3c9, 0.05, 0.6),
    alarm: material(0xfb543a, 0.2, 0.25, { emissive: 0xee301b, emissiveIntensity: 1.8 }),
  };
  function mesh(geometry, mat, parent = group, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = highQuality && !mat.transparent;
    object.receiveShadow = !mat.transparent;
    parent.add(object);
    return object;
  }
  const box = (x, y, z, mat, parent, px, py, pz) =>
    mesh(new THREE.BoxGeometry(x, y, z), mat, parent, px, py, pz);
  const cylinder = (r, length, mat, parent, x, y, z, radial = 20) =>
    mesh(new THREE.CylinderGeometry(r, r, length, radial), mat, parent, x, y, z);
  function torus(radius, tube, mat, parent, x, y, z) {
    return mesh(new THREE.TorusGeometry(radius, tube, 8, 36), mat, parent, x, y, z);
  }
  function mergeRigidMeshes(root) {
    // Rigid trim shares a handful of materials. Batch it once, preserving the
    // handful of marked parts whose transforms animate independently.
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const buckets = new Map();
    const originals = [];
    root.traverse((object) => {
      if (!object.isMesh || object.isInstancedMesh || Array.isArray(object.material)) return;
      for (let ancestor = object; ancestor && ancestor !== root; ancestor = ancestor.parent) {
        if (ancestor.userData.floodArticulated) return;
      }
      const geometry = object.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      if (!buckets.has(object.material)) buckets.set(object.material, []);
      buckets.get(object.material).push(geometry);
      originals.push(object);
    });
    for (const [mat, geometries] of buckets) {
      const merged = mergeGeometries(geometries, false);
      if (merged) mesh(merged, mat, root);
      for (const geometry of geometries) geometry.dispose();
    }
    for (const object of originals) {
      object.removeFromParent();
      object.geometry.dispose();
    }
  }

  // Flanged supply pipes, pressure gauges, hand wheels and mounting brackets.
  // The openings face into the chamber, leaving the camera-facing wall open.
  const mouths = [];
  const gaugeNeedles = [];
  const valveWheels = [];
  const outletY = ceiling - 1.05;
  const inletDefinitions = [
    { x: -width + 2.15, z: -depth + 0.55, dx: 0.55, dz: 2.6, radius: 0.31, yaw: 0 },
    { x: width - 2.15, z: -depth + 0.55, dx: -0.55, dz: 2.6, radius: 0.31, yaw: 0 },
    { x: -width + 0.55, z: -0.6, dx: 1.9, dz: 0.45, radius: 0.23, yaw: Math.PI / 2 },
    { x: width - 0.55, z: -0.6, dx: -1.9, dz: 0.45, radius: 0.23, yaw: -Math.PI / 2 },
  ];
  for (let index = 0; index < inletDefinitions.length; index += 1) {
    const definition = inletDefinitions[index];
    const assembly = new THREE.Group();
    assembly.position.set(definition.x, outletY, definition.z);
    assembly.rotation.y = definition.yaw;
    group.add(assembly);
    const r = definition.radius;
    const barrel = cylinder(r + 0.09, 1.1, mats.pipe, assembly, 0, 0, 0.18);
    barrel.rotation.x = Math.PI / 2;
    for (const offset of [-0.4, 0.42, 0.67]) {
      torus(r + 0.075, 0.075, mats.edge, assembly, 0, 0, offset);
    }
    torus(r + 0.17, 0.075, mats.rust, assembly, 0, 0, -0.4);
    const inside = mesh(new THREE.CircleGeometry(r, 28), mats.dark, assembly, 0, 0, 0.755);
    inside.material.side = THREE.DoubleSide;
    for (let bolt = 0; bolt < 10; bolt += 1) {
      const angle = (bolt / 10) * Math.PI * 2;
      const screw = cylinder(0.035, 0.09, mats.edge, assembly,
        Math.cos(angle) * (r + 0.17), Math.sin(angle) * (r + 0.17), -0.34, 6);
      screw.rotation.x = Math.PI / 2;
    }
    box(0.16, 1.4, 0.16, mats.dark, assembly, -r - 0.19, 0, -0.47);
    box(0.16, 1.4, 0.16, mats.dark, assembly, r + 0.19, 0, -0.47);
    // An exposed vertical feed and its reinforcing collars.
    cylinder(r * 0.68, 0.84, mats.pipe, assembly, 0, 0.56, -0.32);
    for (const offset of [0.35, 0.65, 0.94]) {
      const collar = torus(r * 0.68, 0.045, mats.edge, assembly, 0, offset, -0.32);
      collar.rotation.x = Math.PI / 2;
    }
    const wheel = new THREE.Group();
    wheel.userData.floodArticulated = true;
    wheel.position.set(0, 0.66, 0.03);
    assembly.add(wheel);
    torus(0.26, 0.035, mats.red, wheel, 0, 0, 0);
    cylinder(0.07, 0.13, mats.edge, wheel, 0, 0, 0).rotation.x = Math.PI / 2;
    for (let spoke = 0; spoke < 4; spoke += 1) {
      const bar = box(0.042, 0.47, 0.04, mats.red, wheel, 0, 0, 0);
      bar.rotation.z = spoke * Math.PI / 4;
    }
    mergeRigidMeshes(wheel);
    valveWheels.push(wheel);
    const dial = new THREE.Group();
    dial.position.set(index < 2 ? 0.64 : -0.56, -0.52, 0.1);
    assembly.add(dial);
    const dialBody = cylinder(0.23, 0.11, mats.edge, dial, 0, 0, 0);
    dialBody.rotation.x = Math.PI / 2;
    mesh(new THREE.CircleGeometry(0.195, 32), mats.dial, dial, 0, 0, 0.059);
    for (let tick = 0; tick < 9; tick += 1) {
      const angle = -2.3 + tick * 0.575;
      const mark = box(0.014, tick % 2 === 0 ? 0.045 : 0.028, 0.006, mats.black, dial,
        Math.sin(angle) * 0.158, Math.cos(angle) * 0.158, 0.065);
      mark.rotation.z = -angle;
    }
    const needle = new THREE.Group();
    needle.userData.floodArticulated = true;
    needle.position.z = 0.078;
    dial.add(needle);
    box(0.016, 0.145, 0.009, mats.red, needle, 0, 0.06, 0);
    gaugeNeedles.push(needle);
    const lip = new THREE.Vector3(0, -0.06, 0.78).applyAxisAngle(new THREE.Vector3(0, 1, 0), definition.yaw);
    mouths.push({
      start: new THREE.Vector3(definition.x + lip.x, outletY + lip.y, definition.z + lip.z),
      end: new THREE.Vector3(definition.x + definition.dx, floor + 0.05, definition.z + definition.dz),
      travelX: definition.dx - lip.x,
      travelZ: definition.dz - lip.z,
      radius: r * 0.75,
      phase: index * 1.73,
    });
  }

  // Flood-depth ruler and bolted drain grilles supply a stable scale reference.
  for (const side of [-1, 1]) {
    const markerX = side * (width - 0.14);
    box(0.07, ceiling - 0.6, 0.32, mats.yellow, group, markerX, ceiling / 2, 2.1);
    for (let mark = 1; mark < 13; mark += 1) {
      box(0.082, 0.026, mark % 2 === 0 ? 0.31 : 0.16, mats.black, group,
        markerX - side * 0.01, mark * 0.5, 2.1);
    }
    box(0.32, 0.1, 5.4, mats.dark, group, side * (width - 0.3), 0.05, -1.2);
    for (let grate = 0; grate < 22; grate += 1) {
      box(0.28, 0.045, 0.075, mats.edge, group, side * (width - 0.3), 0.115, -3.72 + grate * 0.24);
    }
  }
  cylinder(0.17, 0.24, mats.alarm, group, 0, ceiling - 0.6, -depth + 0.3);
  cylinder(0.23, 0.08, mats.dark, group, 0, ceiling - 0.75, -depth + 0.3);
  const emergencyLight = new THREE.PointLight(0xff5530, 0, 6, 2);
  emergencyLight.position.set(0, ceiling - 0.65, -depth + 0.8);
  group.add(emergencyLight);
  mergeRigidMeshes(group);

  const waterUniforms = {
    uTime: { value: 0 },
    uLevel: { value: waterLevel },
    uEnergy: { value: 0 },
    uOpacity: { value: 1 },
    uCeiling: { value: ceiling },
    uImpacts: { value: mouths.map((mouth) => new THREE.Vector2(mouth.end.x, mouth.end.z)) },
  };
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uLevel;
      uniform float uEnergy;
      uniform float uCeiling;
      uniform vec2 uImpacts[4];
      varying vec3 vWorld;
      varying vec2 vSurface;
      varying vec3 vWaterNormal;
      varying float vCrest;
      vec3 surface(vec2 p) {
        float a=p.x*1.3+p.y*0.6+uTime*1.7;
        float b=p.y*2.1-p.x*0.35-uTime*2.25;
        float c=p.x*4.1+p.y*3.2+uTime*3.1;
        float h=sin(a)*0.055+sin(b)*0.028+sin(c)*0.012;
        vec2 slope=vec2(cos(a)*0.0715-cos(b)*0.0098+cos(c)*0.0492,
          cos(a)*0.033+cos(b)*0.0588+cos(c)*0.0384);
        h*=0.55+uEnergy*0.45;
        slope*=0.55+uEnergy*0.45;
        for (int i = 0; i < 4; i++) {
          vec2 offset=p-uImpacts[i];
          float d=max(length(offset),0.025);
          float phase=d*8.8-uTime*8.0;
          float strength=exp(-d*0.85)*uEnergy*0.045;
          h+=sin(phase)*strength;
          slope+=offset/d*(cos(phase)*8.8-sin(phase)*0.85)*strength;
        }
        return vec3(h,slope);
      }
      void main() {
        vec3 p = position;
        vec3 wave=surface(p.xz);
        float waveRoom=smoothstep(0.0,0.18,uCeiling-uLevel);
        wave*=waveRoom;
        p.y=min(uCeiling,uLevel+wave.x);
        vWaterNormal=normalize(mat3(modelMatrix)*vec3(-wave.y,1.0,-wave.z));
        vCrest=wave.x;
        vSurface = p.xz;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uEnergy;
      uniform float uOpacity;
      uniform float uCeiling;
      uniform vec2 uImpacts[4];
      varying vec3 vWorld;
      varying vec2 vSurface;
      varying vec3 vWaterNormal;
      varying float vCrest;
      float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
      float rectangle(vec2 p,vec2 size,float softness){vec2 d=abs(p)-size;return 1.0-smoothstep(-softness,softness,max(d.x,d.y));}
      vec3 ceilingReflection(vec3 direction) {
        float distanceToCeiling=max(uCeiling-vWorld.y,0.1)/max(direction.y,0.08);
        vec2 ceilingPoint=vWorld.xz+direction.xz*distanceToCeiling;
        vec2 tile=mod(ceilingPoint+vec2(2.0,1.8),vec2(4.0,3.6))-vec2(2.0,1.8);
        float light=rectangle(tile,vec2(1.05,0.13),0.085);
        float beam=1.0-smoothstep(0.04,0.11,min(abs(tile.x),abs(tile.y)));
        vec3 room=vec3(0.13,0.235,0.255)*(0.45+max(direction.y,0.0)*0.55);
        return room*(1.0-beam*0.52)+vec3(0.72,0.81,0.75)*light*1.15;
      }
      void main() {
        vec2 p = vSurface;
        vec2 micro=vec2(cos(p.x*14.1+p.y*8.3+uTime*3.9),cos(p.y*17.3-p.x*7.2-uTime*4.8))*0.018;
        vec3 normal=normalize(vWaterNormal+vec3(micro.x,0.0,micro.y));
        vec3 eye = normalize(cameraPosition - vWorld);
        if (!gl_FrontFacing) normal = -normal;
        float fresnel=0.02+0.98*pow(1.0-max(dot(normal,eye),0.0),5.0);
        vec3 reflected = reflect(-eye, normal);
        vec3 halfLight=normalize(eye+normalize(vec3(0.35,1.0,0.65)));
        float specular=pow(max(dot(normal,halfLight),0.0),170.0);
        float glint=pow(max(dot(normal,halfLight),0.0),640.0);
        vec3 deep=mix(vec3(0.02,0.15,0.205),vec3(0.06,0.295,0.32),smoothstep(-0.09,0.09,vCrest));
        vec3 color=mix(deep,ceilingReflection(reflected),0.28+fresnel*0.65);
        color+=vec3(0.76,0.88,0.85)*(specular*0.37+glint*0.46);
        float foam = 0.0;
        for (int i=0;i<4;i++) {
          vec2 d = p-uImpacts[i];
          float radius = length(d);
          float turbulence=noise(d*7.0+vec2(uTime*-0.7,uTime*0.4));
          float ripple=sin(radius*15.0-uTime*8.0+turbulence*4.5);
          float aeration=smoothstep(0.35,0.76,turbulence)*exp(-radius*radius*3.4);
          foam+=(aeration+smoothstep(0.74,0.98,ripple)*smoothstep(0.35,0.7,turbulence)*exp(-radius*1.25)*0.6)*uEnergy;
        }
        color=mix(color,vec3(0.73,0.86,0.81),min(foam*0.75,0.7));
        // Limit transmission opacity even at grazing angles; faces stay legible.
        float alpha=(0.30+fresnel*0.22+min(foam*0.28,0.21))*uOpacity;
        gl_FragColor = vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const waterGeometry = new THREE.PlaneGeometry(width * 2 - 0.12, depth * 2 - 0.12, highQuality ? 92 : 40, highQuality ? 80 : 32);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = mesh(waterGeometry, waterMaterial);
  water.name = 'Flood / animated reflective surface';
  water.renderOrder = 12;
  water.frustumCulled = false; // Vertex displacement reaches almost the ceiling.
  const waterBody = mesh(new THREE.BoxGeometry(width * 2 - 0.2, 1, depth * 2 - 0.2),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.FrontSide,
      uniforms: { uTime: waterUniforms.uTime },
      vertexShader: `varying float vDepth;varying vec3 vLocal;void main(){vDepth=0.5-position.y;vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying float vDepth;varying vec3 vLocal;uniform float uTime;
        void main(){float depth=clamp(vDepth,0.0,1.0);float caustic=pow(0.5+0.5*sin(vLocal.x*4.0+vLocal.z*3.5+sin(vLocal.y*17.0+uTime)),14.0);
          vec3 tint=mix(vec3(0.13,0.39,0.4),vec3(0.035,0.17,0.2),depth);tint+=vec3(0.1,0.25,0.22)*caustic*0.15;
          gl_FragColor=vec4(tint,0.085+depth*0.13);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>}`,
    }));
  waterBody.name = 'Flood / clear underwater volume';
  waterBody.renderOrder = 9;

  // Rippling caustics remain visible on the floor through the transparent water.
  const causticMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform float uTime; uniform float uStrength; varying vec2 vUv;
      void main(){
        vec2 p=vUv*35.0;
        p+=vec2(sin(p.y*0.65+uTime*0.7),cos(p.x*0.7-uTime*0.6))*0.8;
        float v=abs(sin(p.x+sin(p.y+uTime*0.4))*sin(p.y-uTime*0.8));
        float lines=pow(1.0-v,15.0);
        gl_FragColor=vec4(0.25,0.66,0.62,lines*uStrength);
      }`,
  });
  const caustics = mesh(new THREE.PlaneGeometry(width * 2 - 0.22, depth * 2 - 0.22), causticMaterial, group, 0, floor + 0.026, 0);
  caustics.rotation.x = -Math.PI / 2;
  caustics.renderOrder = 2;

  // Four continuous curved jets. Shader displacement creates broken, turbulent
  // ribbons rather than rigid cylinders; endpoints track the rising surface.
  function createJetGeometry() {
    const segments = highQuality ? 32 : 20;
    const radial = 10;
    const vertices = new Float32Array((segments + 1) * (radial + 1) * 3);
    const uv = new Float32Array((segments + 1) * (radial + 1) * 2);
    const indices = [];
    for (let length = 0; length <= segments; length += 1) {
      for (let ring = 0; ring <= radial; ring += 1) {
        const n = length * (radial + 1) + ring;
        vertices[n * 3] = ring / radial;
        vertices[n * 3 + 1] = length / segments;
        uv[n * 2] = ring / radial;
        uv[n * 2 + 1] = length / segments;
        if (length < segments && ring < radial) {
          const next = n + radial + 1;
          indices.push(n, n + 1, next, n + 1, next + 1, next);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    return geometry;
  }
  const jetGeometry = createJetGeometry();
  const jets = mouths.map((mouth) => {
    const jetMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 }, uStart: { value: mouth.start }, uEnd: { value: mouth.end },
        uRadius: { value: mouth.radius }, uAlpha: { value: 0 }, uPhase: { value: mouth.phase },
      },
      vertexShader: `
        uniform float uTime; uniform vec3 uStart; uniform vec3 uEnd;
        uniform float uRadius; uniform float uPhase;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
        void main(){
          vUv=uv; float t=position.y; float a=position.x*6.2831853;
          vec3 center=mix(uStart,uEnd,t);
          center.y=mix(uStart.y,uEnd.y,t*t);
          vec3 tangent=normalize(vec3(uEnd.x-uStart.x,2.0*t*(uEnd.y-uStart.y)-0.02,uEnd.z-uStart.z));
          vec3 side=normalize(cross(tangent,vec3(0.0,1.0,0.001)));
          vec3 up=normalize(cross(side,tangent));
          float distortion=sin(t*31.0-uTime*13.0+uPhase)*0.09+sin(a*4.0+t*18.0-uTime*6.0)*0.08;
          float radius=uRadius*sqrt(0.65/(0.65+t*1.3))*(1.0+t*t*0.9)*(1.0+distortion);
          center+=side*sin(t*15.0-uTime*5.0+uPhase)*t*0.05;
          center+=up*sin(t*23.0-uTime*8.0+uPhase)*t*0.025;
          vec3 radial=side*cos(a)+up*sin(a);
          vec3 p=center+radial*radius;
          vNormal=normalize(mat3(modelMatrix)*radial);
          vWorld=(modelMatrix*vec4(p,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform float uTime; uniform float uAlpha; uniform float uPhase;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
        float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
        void main(){
          vec3 eye=normalize(cameraPosition-vWorld);
          vec3 normal=normalize(vNormal);if(!gl_FrontFacing)normal=-normal;
          float fresnel=pow(1.0-abs(dot(normal,eye)),3.0);
          float pattern=noise(vec2(vUv.x*15.0+uPhase,vUv.y*24.0-uTime*8.0));
          float churn=noise(vec2(vUv.x*31.0-uTime*0.7,vUv.y*48.0-uTime*13.0));
          float aeration=smoothstep(0.53,0.88,pattern)*smoothstep(0.12,0.85,vUv.y);
          float spec=pow(max(dot(normal,normalize(eye+normalize(vec3(0.35,1.0,0.6)))),0.0),90.0);
          vec3 color=mix(vec3(0.065,0.235,0.28),vec3(0.52,0.74,0.75),fresnel*0.65+pattern*0.15);
          color=mix(color,vec3(0.81,0.91,0.88),aeration*0.8+churn*0.12);
          color+=vec3(0.8,0.94,0.9)*spec*0.6;
          gl_FragColor=vec4(color,(0.32+fresnel*0.23+aeration*0.24)*uAlpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const jet = mesh(jetGeometry, jetMaterial);
    jet.name = 'Flood / turbulent inlet';
    jet.frustumCulled = false;
    jet.renderOrder = 11;
    return jet;
  });

  const dummy = new THREE.Object3D();
  const particleCount = highQuality ? 220 : 100;
  const swimmerCapacity = 51;
  const dropsPerSwimmer = highQuality ? 6 : 4;
  const sprayMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4f0ea, metalness: 0.15, roughness: 0.12,
    transparent: true, opacity: 0.65, depthWrite: false,
    emissive: 0x164747, emissiveIntensity: 0.3,
  });
  const spray = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), sprayMaterial, particleCount + swimmerCapacity * dropsPerSwimmer);
  spray.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  spray.frustumCulled = false;
  spray.renderOrder = 13;
  spray.name = 'Flood / ballistic spray';
  group.add(spray);
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    mouth: i % mouths.length, phase: random(), angle: random() * Math.PI * 2,
    speed: 0.4 + random() * 0.9, height: 0.25 + random() * 0.65,
    radius: 0.014 + random() * 0.025,
  }));
  const foamCount = highQuality ? 120 : 60;
  const foamMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: waterUniforms.uTime }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv;varying float vSeed;void main(){vUv=uv;vSeed=instanceMatrix[3].x*2.7+instanceMatrix[3].z*1.7;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uTime;varying vec2 vUv;varying float vSeed;
      float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
      void main(){vec2 p=(vUv-0.5)*2.0;float n=noise(p*6.0+vSeed);float fine=noise(p*17.0+vSeed);float edge=1.0-smoothstep(0.5,1.0,length(p)+n*0.15);float foam=smoothstep(0.24,0.75,n)*edge;float cells=1.0-smoothstep(0.36,0.65,fine);
        gl_FragColor=vec4(vec3(0.73,0.85,0.79),foam*(0.18+cells*0.48));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const foam = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), foamMaterial, foamCount);
  foam.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  foam.frustumCulled = false;
  foam.renderOrder = 14;
  foam.name = 'Flood / advected porous foam';
  group.add(foam);
  const foamData = Array.from({ length: foamCount }, (_, i) => ({
    source: i % 4, phase: random() * Math.PI * 2, distance: 0.2 + random() * 2.1,
    size: 0.065 + random() * 0.16, speed: 0.1 + random() * 0.24,
    x: mouths[i % 4].end.x + (random() - 0.5) * 1.4,
    z: mouths[i % 4].end.z + (random() - 0.5) * 1.4,
    age: random() * 5, life: 3.5 + random() * 3,
  }));
  const crownPositions = [];
  const crownIndices = [];
  for (let ring = 0; ring <= 6; ring += 1) {
    for (let segment = 0; segment <= 64; segment += 1) {
      crownPositions.push(segment / 64, ring / 6, 0);
      if (ring < 6 && segment < 64) {
        const n = ring * 65 + segment;
        crownIndices.push(n, n + 1, n + 65, n + 1, n + 66, n + 65);
      }
    }
  }
  const crownGeometry = new THREE.BufferGeometry();
  crownGeometry.setAttribute('position', new THREE.Float32BufferAttribute(crownPositions, 3));
  crownGeometry.setIndex(crownIndices);
  const crownMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: waterUniforms.uTime, uStrength: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `uniform float uTime;varying vec2 vParam;void main(){float a=position.x*6.2831853;float t=position.y;vParam=position.xy;
      float phase=instanceMatrix[3].x;float ripple=sin(a*9.0-uTime*7.0+phase)*0.5+sin(a*17.0+uTime*5.0)*0.3;
      float r=mix(0.18,0.92,t)+ripple*t*0.08;float height=sin(t*3.1415926)*(0.16+max(ripple,0.0)*0.2);
      vec3 p=vec3(cos(a)*r,height,sin(a)*r);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.0);}`,
    fragmentShader: `uniform float uTime;uniform float uStrength;varying vec2 vParam;void main(){float a=vParam.x*6.2831853;float t=vParam.y;
      float broken=0.5+0.5*sin(a*31.0+t*19.0-uTime*13.0);float edge=sin(t*3.1415926);float foam=smoothstep(0.38,0.9,broken)*edge;
      vec3 color=mix(vec3(0.2,0.47,0.51),vec3(0.77,0.9,0.85),foam);
      gl_FragColor=vec4(color,(0.12+foam*0.42)*edge*uStrength);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, mouths.length);
  crowns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crowns.frustumCulled = false;
  crowns.renderOrder = 13;
  crowns.name = 'Flood / inlet splash crowns';
  group.add(crowns);

  // One wake quad per swimmer plus a few low hand-splash droplets. The centre
  // remains clear rather than laying an opaque disk across a swimmer's face.
  const wakeGeometry = new THREE.PlaneGeometry(2.2, 2.7);
  const wakeAttributes = new THREE.InstancedBufferAttribute(new Float32Array(swimmerCapacity * 3), 3);
  wakeAttributes.setUsage(THREE.DynamicDrawUsage);
  wakeGeometry.setAttribute('aWake', wakeAttributes);
  const wakeMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: waterUniforms.uTime }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec3 aWake;varying vec2 vUv;varying vec3 vWake;void main(){vUv=uv;vWake=aWake;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uTime;varying vec2 vUv;varying vec3 vWake;void main(){
      vec2 p=(vUv-0.5)*2.0;float radius=length(p*vec2(1.0,1.25));float angle=atan(p.y,p.x);
      float phase=uTime*4.7+vWake.z;float ripple=pow(0.5+0.5*sin(radius*21.0-phase+sin(angle*5.0+phase)*0.65),9.0);
      float rim=exp(-pow((radius-0.34)*10.0,2.0));float tail=(1.0-smoothstep(-0.05,0.85,p.y))*exp(-abs(abs(p.x)-(-p.y)*0.55)*12.0);
      float fade=(1.0-smoothstep(0.64,1.02,radius))*smoothstep(0.19,0.3,radius);
      float broken=0.6+0.4*sin(angle*13.0-radius*17.0+phase*1.7);
      float alpha=(ripple*0.15+rim*broken*0.22+tail*vWake.y*0.16)*fade*vWake.x;
      gl_FragColor=vec4(0.73,0.89,0.83,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const wakes = new THREE.InstancedMesh(wakeGeometry, wakeMaterial, swimmerCapacity);
  wakes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  wakes.frustumCulled = false;
  wakes.count = 0;
  wakes.renderOrder = 14;
  wakes.name = 'Flood / swimmer wakes';
  group.add(wakes);
  const bubbleCount = highQuality ? 86 : 40;
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5),
    new THREE.MeshStandardMaterial({ color: 0xafdcd9, metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false }), bubbleCount);
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bubbles.frustumCulled = false;
  bubbles.renderOrder = 10;
  group.add(bubbles);
  const bubbleData = Array.from({ length: bubbleCount }, () => ({
    x: (random() - 0.5) * (width * 2 - 1), z: (random() - 0.5) * (depth * 2 - 1),
    phase: random(), speed: 0.09 + random() * 0.15, size: 0.025 + random() * 0.065,
  }));

  // Recognisable physical debris starts on the floor and becomes buoyant.
  const debris = [];
  function addDebris(object, x, z, floatHeight, size = 1) {
    mergeRigidMeshes(object);
    object.position.set(x, floor + floatHeight, z);
    object.rotation.y = random() * Math.PI * 2;
    group.add(object);
    debris.push({ object, x, z, initialX: x, initialZ: z, floatHeight, phase: random() * Math.PI * 2, yaw: object.rotation.y, initialYaw: object.rotation.y, size });
  }
  for (let i = 0; i < 7; i += 1) {
    const plank = new THREE.Group();
    const length = 0.75 + random() * 0.85;
    box(0.22, 0.055, length, i % 2 ? mats.wood : mats.woodLight, plank, 0, 0, 0);
    for (const end of [-1, 1]) {
      cylinder(0.012, 0.005, mats.dark, plank, 0.05, 0.031, end * length * 0.39, 6);
      cylinder(0.012, 0.005, mats.dark, plank, -0.05, 0.031, end * length * 0.39, 6);
    }
    addDebris(plank, (random() - 0.5) * 10.2, (random() - 0.5) * 8.5, 0.04, length * 0.52);
  }
  for (let i = 0; i < 3; i += 1) {
    const crate = new THREE.Group();
    box(0.62, 0.55, 0.62, mats.wood, crate, 0, 0, 0);
    for (const side of [-1, 1]) {
      for (const offset of [-0.21, 0.21]) {
        box(0.085, 0.57, 0.05, mats.woodLight, crate, offset, 0, side * 0.33);
        box(0.05, 0.57, 0.085, mats.woodLight, crate, side * 0.33, 0, offset);
      }
      box(0.65, 0.035, 0.085, mats.edge, crate, 0, 0.29, side * 0.21);
    }
    addDebris(crate, i === 0 ? -4.3 : i === 1 ? 4.2 : 2.7, i === 2 ? 2.8 : -1.8, 0.29, 0.7);
  }
  const lifering = new THREE.Group();
  const ring = torus(0.37, 0.11, mats.orange, lifering, 0, 0, 0);
  ring.rotation.x = Math.PI / 2;
  for (let band = 0; band < 4; band += 1) {
    const angle = band * Math.PI / 2;
    const stripe = torus(0.37, 0.113, mats.white, lifering, 0, 0, 0);
    // Short white sleeves around the orange flotation ring.
    stripe.geometry.dispose();
    stripe.geometry = new THREE.TorusGeometry(0.37, 0.113, 6, 6, 0.32);
    stripe.rotation.set(Math.PI / 2, 0, angle - 0.16);
  }
  addDebris(lifering, -2.5, 3.2, 0.12, 0.5);

  // Small current eddies are driven by the inlet flow, never by selection.
  const vortexMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform float uTime; uniform float uStrength; varying vec2 vUv;
      void main(){
        vec2 p=(vUv-0.5)*2.0; float r=length(p);
        float a=atan(p.y,p.x); float edge=1.0-smoothstep(0.72,1.0,r);
        float spiral=pow(0.5+0.5*sin(a*6.0+r*20.0-uTime*6.0),8.0);
        float ring=smoothstep(0.18,0.36,r)*edge;
        float foam=spiral*ring;
        vec3 color=mix(vec3(0.015,0.12,0.15),vec3(0.83,0.98,0.92),foam);
        float alpha=(foam*0.43+(1.0-smoothstep(0.05,0.6,r))*0.12)*uStrength*edge;
        gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const vortices = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.55, 2.55), vortexMaterial, mouths.length);
  vortices.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  vortices.count = 0;
  vortices.frustumCulled = false;
  vortices.renderOrder = 15;
  vortices.name = 'Flood / inlet current eddies';
  group.add(vortices);
  const commanded = new Map();
  const actorMotion = new Map();
  const drownedEvents = new Set();
  // Death-effects owns these two existing bodies. Their descriptors make them
  // obstacles from the first preview frame, before either one starts floating.
  const ambientObstacles = [
    { id: 'flood-body-0', x: -3.1, z: 1.1, radius: 1.1 },
    { id: 'flood-body-1', x: 3.25, z: -1.5, radius: 1.1 },
  ];
  function resetState() {
    clock = 0;
    roundDuration = 20;
    commanded.clear();
    actorMotion.clear();
    drownedEvents.clear();
    for (const item of debris) {
      item.x = item.initialX;
      item.z = item.initialZ;
      item.yaw = item.initialYaw;
    }
    for (const f of foamData) f.age = f.life;
  }
  function getObstacles() {
    const bodies = ctx.effects?.getFloodObstacles?.();
    return [...debris.map(item => ({ x: item.x, z: item.z, radius: item.size })),
      ...(Array.isArray(bodies) && bodies.length ? bodies : ambientObstacles)];
  }

  function update(dt, state) {
    if (disposed) return;
    const delta = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const progress = clamp(Number.isFinite(state?.progress) ? state.progress : 0, 0, 1);
    const preview = state?.phase === 'preview';
    const restarting = !initialized || progress < previousProgress - 0.2 || (preview && previousPhase !== 'preview');
    if (restarting) resetState();
    clock += delta;
    previousProgress = progress;
    previousPhase = state?.phase;
    // Smoothly reach the actual ceiling, then retain a completely filled room.
    const fill = preview ? 0 : Math.pow(smooth(0.025, 0.97, progress), 1.04);
    waterLevel = THREE.MathUtils.lerp(floor + 0.035, ceiling, fill);
    const pressure = smooth(0.015, 0.2, progress);
    const surfaceEnergy = pressure * (1 - smooth(0.86, 1, progress) * 0.35);
    fluidEnergy = surfaceEnergy;
    if (restarting) {
      ctx.effects?.emit?.('flood-start', { scenarioId: 'flood', waterLevel, ceiling, floor,
        obstacles: ambientObstacles.map(item => ({ ...item })) });
      initialized = true;
    }
    ctx.effects?.emit?.('flood-water', { scenarioId: 'flood', waterLevel, ceiling, floor,
      progress, phase: state?.phase ?? 'preview', time: clock, currentStrength: fluidEnergy });
    if (state?.phase === 'running' && progress > 0.02 && Number.isFinite(state?.elapsed)) {
      roundDuration = clamp(state.elapsed / progress, 5, 90);
    }
    waterUniforms.uTime.value = clock;
    waterUniforms.uLevel.value = waterLevel;
    waterUniforms.uEnergy.value = surfaceEnergy;
    waterUniforms.uOpacity.value = 0.8 + pressure * 0.2;
    waterBody.scale.y = Math.max(0.01, waterLevel - floor);
    waterBody.position.y = floor + (waterLevel - floor) / 2;
    causticMaterial.uniforms.uTime.value = clock;
    causticMaterial.uniforms.uStrength.value = smooth(0, 0.25, fill) * (0.12 - fill * 0.065);
    const submerged = 1 - smooth(outletY - 0.35, outletY + 0.12, waterLevel);
    const jetStrength = pressure * submerged;
    for (let i = 0; i < jets.length; i += 1) {
      const mouth = mouths[i];
      const flight = Math.sqrt(clamp((mouth.start.y - waterLevel) / (mouth.start.y - floor), 0.005, 1));
      mouth.end.set(mouth.start.x + mouth.travelX * flight + Math.sin(clock * 1.6 + i) * 0.04 * flight,
        Math.min(waterLevel + 0.015, mouth.start.y - 0.04),
        mouth.start.z + mouth.travelZ * flight + Math.cos(clock * 1.3 + i) * 0.035 * flight);
      waterUniforms.uImpacts.value[i].set(mouth.end.x, mouth.end.z);
      jets[i].material.uniforms.uTime.value = clock;
      jets[i].material.uniforms.uAlpha.value = jetStrength;
      jets[i].visible = jetStrength > 0.001;
      gaugeNeedles[i].rotation.z = 2.15 - pressure * 4.0 + Math.sin(clock * 14 + i) * pressure * 0.075;
      valveWheels[i].rotation.z = smooth(0, 0.2, progress) * 2.7 + i * 0.31;
      dummy.position.set(mouth.end.x, waterLevel + 0.015, mouth.end.z);
      dummy.rotation.set(0, i * 1.4, 0);
      dummy.scale.setScalar((0.7 + mouth.radius) * Math.sqrt(submerged));
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
    }
    crowns.instanceMatrix.needsUpdate = true;
    crowns.visible = jetStrength > 0.001;
    crownMaterial.uniforms.uStrength.value = jetStrength;
    const alarmPulse = 0.38 + 0.62 * Math.pow(Math.max(0, Math.sin(clock * 5.2)), 3);
    mats.alarm.emissiveIntensity = 0.6 + pressure * alarmPulse * 2.8;
    emergencyLight.intensity = pressure * alarmPulse * 4.5;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const mouth = mouths[p.mouth];
      const age = (clock * p.speed + p.phase) % 1;
      const radius = age * (0.45 + p.speed * 0.7);
      const horizontal = Math.cos(p.angle) * radius;
      dummy.position.set(mouth.end.x + horizontal, waterLevel + 4 * age * (1 - age) * p.height * submerged,
        mouth.end.z + Math.sin(p.angle) * radius);
      dummy.rotation.set(0, p.angle, horizontal * 0.5);
      const size = p.radius * (1 - age * 0.6) * jetStrength;
      dummy.scale.set(size * 0.75, size * (1.5 + age * 1.2), size * 0.75);
      dummy.updateMatrix();
      spray.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < foamData.length; i += 1) {
      const f = foamData[i];
      const mouth = mouths[f.source];
      f.age += delta;
      if (f.age >= f.life || Math.abs(f.x) > width - 0.25 || Math.abs(f.z) > depth - 0.25) {
        f.age = 0;
        f.x = clamp(mouth.end.x + Math.cos(f.phase + clock * 0.2) * 0.3, -width + 0.3, width - 0.3);
        f.z = clamp(mouth.end.z + Math.sin(f.phase + clock * 0.2) * 0.3, -depth + 0.3, depth - 0.3);
      }
      currentAt(f.x, f.z, current);
      f.x += current.x * delta;
      f.z += current.y * delta;
      const angle = f.phase + clock * f.speed;
      surfaceAt(f.x, f.z, surfaceSample);
      dummy.position.set(f.x, Math.min(ceiling, waterLevel + 0.025 + surfaceSample.x), f.z);
      dummy.rotation.set(-Math.PI / 2, 0, angle);
      const lifecycle = smooth(0, 0.45, f.age) * (1 - smooth(f.life - 1.2, f.life, f.age));
      const size = f.size * pressure * lifecycle;
      dummy.scale.set(size * (1.2 + Math.hypot(current.x, current.y)), size, 1);
      dummy.updateMatrix();
      foam.setMatrixAt(i, dummy.matrix);
    }
    foam.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < bubbleData.length; i += 1) {
      const bubble = bubbleData[i];
      const age = (clock * bubble.speed + bubble.phase) % 1;
      currentAt(bubble.x, bubble.z, current);
      dummy.position.set(bubble.x + Math.sin(clock * 0.7 + i) * 0.12 + current.x * age * 0.6,
        floor + 0.04 + age * Math.max(0, waterLevel - floor - 0.06),
        bubble.z + Math.cos(clock * 0.8 + i) * 0.12 + current.y * age * 0.6);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(bubble.size * smooth(0.1, 0.6, waterLevel - floor) * (0.6 + age * 0.4));
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
    for (const object of debris) {
      const float = smooth(object.floatHeight * 0.65, object.floatHeight * 1.5 + 0.1, waterLevel - floor);
      currentAt(object.x, object.z, current);
      object.x = clamp(object.x + current.x * delta * float * 0.65, -width + 0.75, width - 0.75);
      object.z = clamp(object.z + current.y * delta * float * 0.65, -depth + 0.85, depth - 0.85);
      surfaceAt(object.x, object.z, surfaceSample);
      object.object.position.set(
        object.x,
        Math.min(ceiling - object.floatHeight, Math.max(floor + object.floatHeight,
          waterLevel + object.floatHeight * 0.32 + surfaceSample.x * float)),
        object.z);
      object.yaw += delta * float * (0.05 + Math.sin(clock * 0.5 + object.phase) * 0.035);
      object.object.rotation.set(surfaceSample.z * float * 0.8,
        object.yaw, -surfaceSample.y * float * 0.8);
    }

    vortexMaterial.uniforms.uTime.value = clock;
    vortexMaterial.uniforms.uStrength.value = preview ? 0 : pressure * 0.48 * (1 - fill * 0.6);
    let vortexCount = 0;
    let wakeCount = 0;
    let swimmerDropCount = 0;
    const victimIds = state?.victimIds;
    const obstacles = getObstacles();
    if (!preview && pressure > 0 && fill < 1) {
      for (let i = 0; i < mouths.length; i += 1) {
        const mouth = mouths[i];
        dummy.position.set(mouth.end.x * 0.8, Math.min(ceiling, waterLevel + 0.035), mouth.end.z * 0.8);
        dummy.rotation.set(-Math.PI / 2, 0, clock * 0.13 * (i % 2 ? 1 : -1) + i);
        dummy.scale.setScalar(0.36 + fluidEnergy * 0.12);
        dummy.updateMatrix();
        vortices.setMatrixAt(vortexCount++, dummy.matrix);
      }
    }
    for (let i = 0; i < actors.length; i += 1) {
      const actor = actors[i];
      const protectedGuest = actor.invincible === true || actor.id === 'vip-456';
      const victim = !protectedGuest && (victimIds?.has(actor.id) ?? actor.isVictim === true);
      if (victim && !preview && progress >= 0.985 && waterLevel >= ceiling - 0.0001 &&
          (state?.phase === 'reveal' || actor.health?.current === 0)) {
        // The central health/result flow owns actual death. This event prepares
        // the selected sinking clone only after the chamber is entirely full.
        if (!drownedEvents.has(actor.id) && typeof ctx.effects?.emit === 'function') {
          drownedEvents.add(actor.id);
          ctx.effects.emit('drowned', {
            actorId: actor.id,
            position: [actor.position.x, Math.min(waterLevel, actor.position.y + 1.1), actor.position.z],
            waterLevel,
            ceiling,
            floor,
            sink: true,
            intensity: 1,
          });
        }
      }
      if (actor.alive === false) continue;
      let motion = actorMotion.get(actor.id);
      if (!motion) {
        motion = { x: actor.position.x, z: actor.position.z, vx: 0, vz: 0, targetAt: -1, reactionAt: clock + (i % 7) * 0.12 };
        actorMotion.set(actor.id, motion);
      }
      if (delta > 0) {
        const blend = 1 - Math.exp(-delta * 5);
        motion.vx += (clamp((actor.position.x - motion.x) / delta, -4, 4) - motion.vx) * blend;
        motion.vz += (clamp((actor.position.z - motion.z) / delta, -4, 4) - motion.vz) * blend;
      }
      motion.x = actor.position.x;
      motion.z = actor.position.z;
      const swimSpeed = Math.hypot(motion.vx, motion.vz);
      const facing = swimSpeed > 0.08 ? Math.atan2(motion.vx, motion.vz) : actor.root?.rotation.y ?? 0;
      if (waterLevel > floor + 0.18 && waterLevel < ceiling - 0.015 && wakeCount < swimmerCapacity) {
        surfaceAt(actor.position.x, actor.position.z, surfaceSample);
        dummy.position.set(actor.position.x - motion.vx * 0.16, waterLevel + surfaceSample.x + 0.032,
          actor.position.z - motion.vz * 0.16);
        dummy.rotation.set(-Math.PI / 2, 0, -facing);
        dummy.scale.set(1, 0.85 + Math.min(swimSpeed, 1.2) * 0.3, 1);
        dummy.updateMatrix();
        wakes.setMatrixAt(wakeCount, dummy.matrix);
        wakeAttributes.setXYZ(wakeCount, smooth(0.18, 0.8, waterLevel - floor), Math.min(swimSpeed, 1.2), i * 2.399963);
        wakeCount += 1;
        if (waterLevel > floor + 1.05) {
          for (let drop = 0; drop < dropsPerSwimmer; drop += 1) {
            const age = (clock * 1.65 + i * 0.37 + drop * 0.173) % 1;
            const side = drop % 2 ? 1 : -1;
            const reach = side * (0.34 + age * 0.28);
            const aft = -0.08 - age * 0.15;
            const height = 4 * age * (1 - age) * (0.12 + (i % 4) * 0.025);
            dummy.position.set(actor.position.x + Math.cos(facing) * reach + Math.sin(facing) * aft,
              Math.min(ceiling - 0.01, waterLevel + surfaceSample.x + 0.025 + height),
              actor.position.z - Math.sin(facing) * reach + Math.cos(facing) * aft);
            dummy.rotation.set(age * 0.5, facing, side * age);
            const dropSize = (0.014 + (drop % 3) * 0.003) * Math.sin(age * Math.PI);
            dummy.scale.set(dropSize, dropSize * 1.7, dropSize);
            dummy.updateMatrix();
            spray.setMatrixAt(particleCount + swimmerDropCount++, dummy.matrix);
          }
        }
      }
      if (preview || state?.phase === 'complete') continue;
      if (!protectedGuest && delta > 0 && waterLevel > floor + 0.07) {
        // Cold water, sustained effort and increasingly scarce air affect every
        // student. Selection/vulnerability belongs entirely to central health.
        const immersion = smooth(0.07, 1.7, waterLevel - floor);
        const exertion = 1.9 + immersion * 2.4 + smooth(0.35, 0.98, progress) * 2.2;
        ctx.effects?.emit?.('damage', {
          actorId: actor.id, kind: 'water', amount: exertion * delta * (20 / roundDuration),
          position: [actor.position.x, Math.min(waterLevel, actor.position.y + 1.05), actor.position.z],
          intensity: 0.15 + immersion * 0.45 + smooth(0.5, 1, progress) * 0.25,
          invincible: false,
        });
      }
      const desiredAction = waterLevel > floor + 1.05 ? 'swim' : progress > 0.09 ? 'panic' : 'idle';
      if (commanded.get(actor.id) !== desiredAction) {
        actor.setAction?.(desiredAction);
        commanded.set(actor.id, desiredAction);
      }
      if (!protectedGuest && progress > 0.12 && clock >= motion.reactionAt) {
        const struggling = progress > 0.56 + (i % 4) * 0.065 || (actor.health?.ratio ?? 1) < 0.42;
        actor.setReaction?.(struggling ? 'drown' : 'fear',
          struggling ? 0.3 + smooth(0.56, 1, progress) * 0.52 : 0.18 + pressure * 0.14,
          struggling ? 0.78 : 0.46);
        motion.reactionAt = clock + (struggling ? 1.02 : 2.2) + (i % 5) * 0.075;
      }
      if (clock >= motion.targetAt && progress > 0.12 && progress < 0.98) {
        // Short independent strokes seek clear lanes through flotsam and the
        // already-present bodies. No target or route depends on victim status.
        const a = i * 2.399963 + clock * (0.19 + (i % 3) * 0.025);
        currentAt(actor.position.x, actor.position.z, current);
        const bounds = state?.bounds;
        const minX = bounds?.minX ?? -width + 0.7;
        const maxX = bounds?.maxX ?? width - 0.7;
        const minZ = bounds?.minZ ?? -depth + 0.7;
        const maxZ = bounds?.maxZ ?? depth - 0.7;
        let bestX = actor.position.x, bestZ = actor.position.z, bestScore = -Infinity;
        for (let candidate = 0; candidate < 10; candidate += 1) {
          const angle = a + candidate * 2.399963;
          const reach = 1.25 + (candidate % 3) * 0.55;
          const x = clamp(actor.position.x + Math.cos(angle) * reach + current.x * 0.7, minX, maxX);
          const z = clamp(actor.position.z + Math.sin(angle) * reach + current.y * 0.7, minZ, maxZ);
          const dx = x - actor.position.x, dz = z - actor.position.z;
          const length2 = Math.max(0.01, dx * dx + dz * dz);
          let score = Math.cos(angle - a) * 0.4 + Math.min(2, Math.sqrt(length2)) * 0.25;
          for (const obstacle of obstacles) {
            const t = clamp(((obstacle.x - actor.position.x) * dx + (obstacle.z - actor.position.z) * dz) / length2, 0.25, 1);
            const clearance = Math.hypot(actor.position.x + dx * t - obstacle.x,
              actor.position.z + dz * t - obstacle.z) - obstacle.radius - 0.4;
            if (clearance < 0) score += clearance * 6;
            const destinationClearance = Math.hypot(x - obstacle.x, z - obstacle.z) - obstacle.radius - 0.5;
            if (destinationClearance < 0) score += destinationClearance * 10;
          }
          for (const other of actors) {
            if (other === actor || other.alive === false) continue;
            score -= Math.max(0, 1.2 - Math.hypot(x - other.position.x, z - other.position.z)) * 2;
          }
          if (score > bestScore) { bestScore = score; bestX = x; bestZ = z; }
        }
        actor.setTarget?.(bestX, bestZ);
        motion.targetAt = clock + 0.85 + (i % 6) * 0.12;
      }
    }
    vortices.count = vortexCount;
    vortices.instanceMatrix.needsUpdate = true;
    wakes.count = wakeCount;
    wakes.instanceMatrix.needsUpdate = true;
    wakeAttributes.needsUpdate = true;
    spray.count = particleCount + swimmerDropCount;
    spray.visible = jetStrength > 0.001 || swimmerDropCount > 0;
    spray.instanceMatrix.needsUpdate = true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set();
    const materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const mat of list) materials.add(mat);
      }
      if (object.isInstancedMesh) object.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    for (const mat of materials) mat.dispose();
    emergencyLight.dispose();
    group.clear();
    commanded.clear();
    actorMotion.clear();
    drownedEvents.clear();
  }

  update(0, { progress: 0, phase: 'preview' });
  return { update, dispose, getWaterLevel: () => waterLevel, getObstacles,
    get waterLevel() { return waterLevel; } };
}
