import * as THREE from 'three';

// A failed extraction system floods the chamber from its perimeter. The mist
// remains translucent and low enough to preserve the human performances.
export default function createScenario(ctx) {
  const { group, room, actors } = ctx;
  const halfWidth = room.halfWidth ?? 7;
  const halfDepth = room.halfDepth ?? 6;
  const floorY = room.floorY ?? 0;
  const lowQuality = ctx.quality === 'low';
  const resources = new Set();
  const fans = [];
  const valveWheels = [];
  const needles = [];
  const warningLenses = [];
  const reactionState = new Map();
  const avoidanceState = new Map();
  let time = 0;
  let previousProgress = -1;
  let previousPhase = 'preview';
  let disposed = false;
  let rngState = 0x6a5c091;
  const random = () => {
    rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
    return rngState / 4294967296;
  };
  const own = resource => { resources.add(resource); return resource; };
  const smooth = (a, b, value) => {
    const n = THREE.MathUtils.clamp((value - a) / (b - a), 0, 1);
    return n * n * (3 - 2 * n);
  };
  const material = (color, extra = {}) => own(new THREE.MeshStandardMaterial({
    color, roughness: 0.58, metalness: 0.64, ...extra,
  }));
  const steel = material(0x505e61);
  const edge = material(0x889b9e, { roughness: 0.36 });
  const dark = material(0x172325, { roughness: 0.86 });
  const green = material(0x5f7250, { roughness: 0.7, metalness: 0.44 });
  const yellow = material(0xcead36, { roughness: 0.7 });
  const black = material(0x18201d);
  const brass = material(0xb59a55, { roughness: 0.34 });
  const amber = material(0xff8a28, { emissive: 0xe75b0a, emissiveIntensity: 0.5 });
  const pale = material(0xd7e2c8, { roughness: 0.8, metalness: 0.1 });
  const boxGeometry = own(new THREE.BoxGeometry(1, 1, 1));
  const cylinderGeometry = own(new THREE.CylinderGeometry(1, 1, 1, 24));
  const sphereGeometry = own(new THREE.SphereGeometry(1, 20, 12));
  const ringGeometry = own(new THREE.TorusGeometry(1, 0.07, 8, 32));
  const boltGeometry = own(new THREE.CylinderGeometry(1, 1, 1, 6));

  function mesh(geometry, mat, parent = group) {
    const result = new THREE.Mesh(geometry, mat);
    parent.add(result);
    return result;
  }
  function box(x, y, z, sx, sy, sz, mat, parent = group) {
    const result = mesh(boxGeometry, mat, parent);
    result.position.set(x, y, z);
    result.scale.set(sx, sy, sz);
    return result;
  }
  function cylinder(x, y, z, radius, length, mat, parent = group) {
    const result = mesh(cylinderGeometry, mat, parent);
    result.position.set(x, y, z);
    result.scale.set(radius, length, radius);
    return result;
  }
  function ring(x, y, z, radius, mat, parent = group) {
    const result = mesh(ringGeometry, mat, parent);
    result.position.set(x, y, z);
    result.scale.setScalar(radius);
    return result;
  }
  function pipe(from, to, radius, mat = steel, parent = group) {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const delta = end.sub(start);
    const result = cylinder(0, 0, 0, radius, delta.length(), mat, parent);
    result.position.copy(start).addScaledVector(delta, 0.5);
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return result;
  }
  function frontBolt(x, y, z, radius = 0.035, parent = group) {
    const result = mesh(boltGeometry, edge, parent);
    result.position.set(x, y, z);
    result.rotation.x = Math.PI / 2;
    result.scale.set(radius, 0.03, radius);
    return result;
  }
  function placard(title, subtitle, width, height, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 256;
    const draw = canvas.getContext('2d');
    draw.fillStyle = '#c8b64d'; draw.fillRect(0, 0, 768, 256);
    draw.fillStyle = '#172326';
    draw.fillRect(14, 14, 740, 228);
    draw.strokeStyle = '#ccb84c'; draw.lineWidth = 6;
    draw.strokeRect(26, 26, 716, 204);
    draw.textAlign = 'center'; draw.textBaseline = 'middle';
    draw.fillStyle = '#e2d06b'; draw.font = 'bold 62px sans-serif';
    draw.fillText(title, 384, 94, 675);
    draw.fillStyle = '#b6c4bb'; draw.font = '30px sans-serif';
    draw.fillText(subtitle, 384, 174, 675);
    const texture = own(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = material(0xffffff, { map: texture, roughness: 0.92, metalness: 0 });
    box(x, y, z - 0.035, width + 0.07, height + 0.07, 0.05, edge);
    const board = mesh(own(new THREE.PlaneGeometry(width, height)), mat);
    board.position.set(x, y, z);
  }

  // Extraction fans: deep housings, nine grille ribs, bolted rims and physical
  // swept blades. They sit high on the rear wall, outside character silhouettes.
  const rearZ = -halfDepth + 0.24;
  const fanY = Math.min(room.height - 1.55, 5.45);
  [-3.8, 3.8].forEach((x, index) => {
    box(x, fanY, rearZ, 2.6, 2.25, 0.34, dark);
    box(x, fanY - 1.09, rearZ + 0.23, 2.78, 0.12, 0.15, edge);
    box(x, fanY + 1.09, rearZ + 0.23, 2.78, 0.12, 0.15, edge);
    box(x - 1.31, fanY, rearZ + 0.23, 0.12, 2.15, 0.15, edge);
    box(x + 1.31, fanY, rearZ + 0.23, 0.12, 2.15, 0.15, edge);
    const shroud = cylinder(x, fanY, rearZ + 0.17, 0.99, 0.22, black);
    shroud.rotation.x = Math.PI / 2;
    ring(x, fanY, rearZ + 0.35, 0.97, edge);
    ring(x, fanY, rearZ + 0.36, 0.83, steel);
    const rotor = new THREE.Group();
    rotor.position.set(x, fanY, rearZ + 0.31);
    group.add(rotor);
    for (let i = 0; i < 7; i++) {
      const blade = new THREE.Group();
      blade.rotation.z = i / 7 * Math.PI * 2;
      rotor.add(blade);
      const fin = box(0.36, 0.14, 0, 0.65, 0.29, 0.065, steel, blade);
      fin.rotation.z = -0.38;
      fin.rotation.x = 0.22;
    }
    const hub = cylinder(0, 0, 0.06, 0.16, 0.12, edge, rotor);
    hub.rotation.x = Math.PI / 2;
    fans.push({ rotor, direction: index ? -1 : 1 });
    for (let i = -4; i <= 4; i++) {
      const y = i * 0.205;
      box(x, fanY + y, rearZ + 0.47, 2 * Math.sqrt(0.94 ** 2 - y ** 2), 0.028, 0.032, dark);
    }
    [-1, 1].forEach(a => [-1, 1].forEach(b => frontBolt(x + a * 1.2, fanY + b * 0.97, rearZ + 0.33)));
    box(x, fanY - 1.35, rearZ + 0.2, 1.15, 0.21, 0.14, black);
    const lens = box(x, fanY - 1.35, rearZ + 0.28, 0.79, 0.09, 0.035, amber);
    warningLenses.push(lens);
  });
  placard('VENTILATION PURGE', 'SECTOR 07  /  EXTRACTION SYSTEM', 3.2, 0.9, 0, fanY, rearZ + 0.24);
  placard('TOXIC GAS', 'PRESSURIZED  /  KEEP CLEAR', 2.5, 0.77, 0, 2.75, rearZ + 0.24);

  // A cross-wall header feeds three unmistakable downward leaking nozzles.
  const headerY = 3.55;
  pipe([-5.85, headerY, rearZ + 0.37], [5.85, headerY, rearZ + 0.37], 0.14);
  for (let x = -5.5; x <= 5.5; x += 1.1) {
    const collar = ring(x, headerY, rearZ + 0.37, 0.17, edge);
    collar.rotation.y = Math.PI / 2;
    box(x, headerY, rearZ + 0.16, 0.075, 0.43, 0.18, dark);
  }
  [-4.4, 0, 4.4].forEach(x => {
    pipe([x, headerY, rearZ + 0.37], [x, 1.05, rearZ + 0.37], 0.105);
    pipe([x, 1.05, rearZ + 0.37], [x, 1.05, rearZ + 0.8], 0.12);
    ring(x, 1.05, rearZ + 0.86, 0.18, brass);
    const outlet = cylinder(x, 1.05, rearZ + 0.85, 0.11, 0.03, black);
    outlet.rotation.x = Math.PI / 2;
    [-1, 1].forEach(sign => frontBolt(x + sign * 0.155, 1.05, rearZ + 0.88, 0.025));
  });

  // Six restrained, full-height industrial cylinders leave the open front clear.
  [-1, 1].forEach(side => {
    const x = side * (halfWidth - 0.64);
    [-4.25, -2.62, -0.99].forEach((z, index) => {
      const rack = new THREE.Group(); rack.position.set(x, floorY, z); group.add(rack);
      box(0, 0.1, 0, 1.02, 0.18, 1.02, dark, rack);
      const body = cylinder(0, 1.27, 0, 0.38, 2.15, green, rack);
      body.castShadow = true; body.receiveShadow = true;
      const shoulder = mesh(sphereGeometry, green, rack);
      shoulder.position.set(0, 2.31, 0); shoulder.scale.set(0.38, 0.29, 0.38);
      cylinder(0, 0.23, 0, 0.4, 0.11, dark, rack);
      cylinder(0, 2.44, 0, 0.13, 0.23, brass, rack);
      cylinder(0, 2.64, 0, 0.075, 0.18, brass, rack);
      [0.69, 1.79].forEach(y => {
        cylinder(0, y, 0, 0.392, 0.095, steel, rack);
        box(side * 0.43, y, -0.1, 0.08, 0.11, 0.77, dark, rack);
      });
      cylinder(0, 1.21, 0, 0.386, 0.38, yellow, rack);
      box(0, 1.21, 0.388, 0.39, 0.18, 0.015, black, rack);
      box(0, 1.21, 0.4, 0.035, 0.11, 0.01, yellow, rack);
      const wheel = new THREE.Group(); wheel.position.set(0, 2.71, 0); rack.add(wheel);
      const rim = ring(0, 0, 0, 0.18, amber, wheel); rim.rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++) {
        const spoke = box(0, 0, 0, 0.34, 0.028, 0.035, brass, wheel);
        spoke.rotation.y = i * Math.PI / 3;
      }
      valveWheels.push({ wheel, offset: index * 0.37 + side });
      pipe([x, 2.55, z], [x - side * 0.47, 2.55, z], 0.045, brass);
      pipe([x - side * 0.47, 2.55, z], [x - side * 0.47, 0.43, z], 0.055, dark);
      // Gauges have a moving red needle and an actual bezel behind the glass.
      const gauge = cylinder(0.17, 2.51, 0.2, 0.12, 0.045, pale, rack);
      gauge.rotation.x = Math.PI / 2;
      ring(0.17, 2.51, 0.232, 0.127, edge, rack);
      const needleRoot = new THREE.Group(); needleRoot.position.set(0.17, 2.51, 0.238); rack.add(needleRoot);
      box(0, 0.04, 0, 0.013, 0.09, 0.01, amber, needleRoot);
      needles.push(needleRoot);
    });
    const ventX = side * (halfWidth - 0.18);
    [-3.42, -0.1].forEach(z => {
      const housing = box(ventX, 0.48, z, 0.22, 0.65, 0.9, dark);
      for (let i = 0; i < 6; i++) box(ventX - side * 0.13, 0.25 + i * 0.09, z, 0.035, 0.035, 0.76, edge);
      housing.userData.gasOutlet = true;
    });
  });

  // These two small practical lights also illuminate the real props and people.
  // Their positions/intensities feed the vapor scattering shader below.
  const leakLight = new THREE.PointLight(0xbed77d, 0, 7, 2);
  leakLight.position.set(0, 1.65, rearZ + 1.12);
  const alarmLight = new THREE.PointLight(0xffa340, 0, 7.5, 2);
  alarmLight.position.set(-3.8, fanY - 1.35, rearZ + 0.7);
  group.add(leakLight, alarmLight);
  const outlets = [
    [-4.4, 1.05, rearZ + 0.89, 0.04, 0, 1],
    [0, 1.05, rearZ + 0.89, 0, 0, 1],
    [4.4, 1.05, rearZ + 0.89, -0.04, 0, 1],
    [-halfWidth + 0.4, 0.47, -3.42, 1, 0, 0.12],
    [halfWidth - 0.4, 0.47, -3.42, -1, 0, 0.12],
    [-halfWidth + 0.4, 0.47, -0.1, 1, 0, 0.12],
    [halfWidth - 0.4, 0.47, -0.1, -1, 0, 0.12],
  ];
  const noiseGLSL = `
    float hash(vec3 p) {
      p = fract(p * .3183099 + vec3(.11,.37,.73));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x+p.y+p.z));
    }
    float noise3(vec3 p) {
      vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                     mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                     mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    float fbm(vec3 p) {
      return noise3(p)*.57 + noise3(p*2.07+4.1)*.28 + noise3(p*4.13+9.2)*.15;
    }
  `;
  const smokeUniforms = {
    uTime: { value: 0 }, uBuild: { value: 0 }, uFinal: { value: 0 },
    uBounds: { value: new THREE.Vector2(halfWidth - 0.3, halfDepth - 0.25) },
    uFloor: { value: floorY }, uTargeted: { value: 0 },
    uLamp: { value: 0 },
    uLeakPosition: { value: leakLight.position.clone() },
    uAlarmPosition: { value: alarmLight.position.clone() },
  };
  const smokeVertex = `
    attribute vec3 aOrigin;
    attribute vec3 aFlow;
    attribute vec4 aSeed;
    uniform float uTime, uBuild, uFloor, uTargeted;
    uniform vec2 uBounds;
    varying vec2 vUv;
    varying float vAge, vSeed, vFront;
    varying vec3 vRoomPosition;
    void main() {
      float speed=uTargeted>1.5 ? .29+aSeed.y*.08 : .055+aSeed.y*.045;
      float age=fract(uTime*speed+aSeed.x);
      float angle=aSeed.z*6.28318;
      vec3 center=aOrigin;
      if(uTargeted < .5) {
        center += aFlow*age*(1.45+uBuild*4.8);
        center.x += sin(angle+age*5.3)*age*(.4+uBuild*.95);
        center.z += sin(angle+age*4.1)*age*.7;
        center.y = mix(aOrigin.y, uFloor+.26+uBuild*.33, age)+sin(age*3.14159)*.2;
      } else if(uTargeted < 1.5) {
        center.x += sin(age*5.0+angle)*.27;
        center.z += cos(age*4.0+angle)*.24;
        center.y += age*(.65+uBuild*.25);
      } else {
        float pressure=.78+.22*sin(uTime*3.7+aSeed.z*3.0);
        center += aFlow*age*(1.6+uBuild*.9)*pressure;
        center.x += sin(age*9.0+angle)*age*.12;
        center.z += cos(age*8.0+angle)*age*.1;
        center.y -= age*.2;
        center.y += sin(age*8.0+angle)*age*.11;
      }
      center.x=clamp(center.x,-uBounds.x,uBounds.x);
      center.z=clamp(center.z,-uBounds.y,uBounds.y-.35);
      vec4 viewCenter=modelViewMatrix*vec4(center,1.0);
      float size=(.32+age*(1.05+uBuild*.55))*(.72+aSeed.w*.55);
      if(uTargeted>.5) size*=.55;
      if(uTargeted>1.5) size=(.085+age*.46)*(.8+aSeed.w*.25);
      float turn=angle+age*.8;
      mat2 rotation=mat2(cos(turn),-sin(turn),sin(turn),cos(turn));
      vec2 corner=rotation*position.xy*size;
      corner*=vec2(1.3,uTargeted>1.5 ? .82 : .67);
      viewCenter.xy+=corner;
      vec3 right=vec3(modelViewMatrix[0][0],modelViewMatrix[1][0],modelViewMatrix[2][0]);
      vec3 up=vec3(modelViewMatrix[0][1],modelViewMatrix[1][1],modelViewMatrix[2][1]);
      vRoomPosition=center+right*corner.x+up*corner.y;
      gl_Position=projectionMatrix*viewCenter;
      vUv=uv; vAge=age; vSeed=aSeed.z;
      vFront=1.0-smoothstep(2.5,5.8,center.z)*.45;
    }
  `;
  const smokeFragment = `
    uniform float uTime,uBuild,uFinal,uTargeted,uFloor,uLamp;
    uniform vec2 uBounds;
    uniform vec3 uLeakPosition,uAlarmPosition;
    varying vec2 vUv;
    varying float vAge,vSeed,vFront;
    varying vec3 vRoomPosition;
    ${noiseGLSL}
    void main() {
      vec2 p=(vUv-.5)*2.0;
      float r=length(p);
      if(r>=1.0) discard;
      // Integrate a rotating 3D density field through each soft ellipsoid.
      // Separate bright filaments and self-shadowed cores give actual depth
      // cues as puffs turn, rather than uniformly coloring a flat noise card.
      float depth=sqrt(max(0.0,1.0-r*r));
      float optical=0.0;
      vec3 scattering=vec3(0.0);
      float lampFalloff=1.0/(1.0+length(vRoomPosition-uAlarmPosition)*.34);
      float leakFalloff=1.0/(1.0+length(vRoomPosition-uLeakPosition)*.25);
      float spin=uTime*.19+vSeed*6.28;
      mat2 curl=mat2(cos(spin),-sin(spin),sin(spin),cos(spin));
      for(int layer=0;layer<${lowQuality ? 3 : 5};layer++) {
        float z=mix(-depth,depth,(float(layer)+.5)/${lowQuality ? '3.0' : '5.0'});
        vec3 q=vec3(p,z);
        q.xz=curl*q.xz;
        q.xy+=vec2(sin(q.z*3.4+uTime*.31),cos(q.x*3.0-uTime*.27))*.24;
        vec3 advected=q*2.1+vec3(vSeed*19.0,uTime*-.16,vSeed*9.0);
        float filaments=fbm(advected);
        float density=smoothstep(.3,.72,filaments)*(1.0-smoothstep(.5,1.05,length(q)));
        float shade=.46+.54*(float(layer)+1.0)/${lowQuality ? '3.0' : '5.0'};
        vec3 lit=mix(vec3(.11,.19,.045),vec3(.38,.54,.16),shade);
        lit+=vec3(.10,.15,.025)*leakFalloff;
        lit+=vec3(.30,.115,.02)*uLamp*lampFalloff*(.3+z*z);
        scattering+=lit*density*exp(-optical*.65);
        optical+=density;
      }
      vec3 color=scattering/max(optical,.001);
      optical*=depth*${lowQuality ? '1.67' : '1.0'};
      float edge=1.0-smoothstep(.76,1.0,r);
      float life=smoothstep(0.0,.13,vAge)*(1.0-smoothstep(.7,1.0,vAge));
      float density=.065+uBuild*.13+uFinal*.025;
      if(uTargeted>.5) density*=.85;
      if(uTargeted>1.5) density*=2.4;
      float roomFade=(1.0-smoothstep(uBounds.x-.65,uBounds.x,abs(vRoomPosition.x)))
        *(1.0-smoothstep(uBounds.y-.4,uBounds.y,abs(vRoomPosition.z)))
        *smoothstep(uFloor-.05,uFloor+.14,vRoomPosition.y);
      // A soft height ceiling keeps faces readable even at full buildup.
      float faceClear=1.0-smoothstep(uFloor+1.05,uFloor+1.62,vRoomPosition.y);
      float alpha=(1.0-exp(-optical*density))*edge*life*vFront*roomFade*faceClear;
      gl_FragColor=vec4(color,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  function makeSmoke(count, mode = 0) {
    const base = new THREE.PlaneGeometry(2, 2);
    const geometry = own(new THREE.InstancedBufferGeometry());
    geometry.index = base.index.clone();
    geometry.setAttribute('position', base.attributes.position.clone());
    geometry.setAttribute('uv', base.attributes.uv.clone());
    base.dispose();
    const origins = new Float32Array(count * 3);
    const flows = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const outlet=outlets[i % outlets.length];
      origins[i * 3] = outlet[0];
      origins[i * 3 + 1] = floorY + outlet[1];
      origins[i * 3 + 2] = outlet[2];
      for (let j = 0; j < 3; j++) flows[i * 3 + j] = outlet[j + 3];
      for (let j = 0; j < 4; j++) seeds[i * 4 + j] = random();
    }
    const originAttribute = new THREE.InstancedBufferAttribute(origins, 3);
    if (mode === 1) originAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aOrigin', originAttribute);
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
    geometry.setAttribute('aFlow', new THREE.InstancedBufferAttribute(flows, 3));
    geometry.instanceCount = mode === 1 ? 0 : count;
    const uniforms = mode ? { ...smokeUniforms, uTargeted: { value: mode } } : smokeUniforms;
    const mat = own(new THREE.ShaderMaterial({
      uniforms, vertexShader: smokeVertex, fragmentShader: smokeFragment,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    const cloud = mesh(geometry, mat);
    cloud.frustumCulled = false;
    cloud.renderOrder = mode === 1 ? 3 : 2;
    return { cloud, origins, originAttribute, geometry };
  }
  const vapor = makeSmoke(lowQuality ? 56 : 91);
  const jets = makeSmoke(lowQuality ? 35 : 56, 2);
  // These ground eddies follow every exposed person, never a selected victim.
  // The density shader clears the face region even when the chamber is full.
  const exposureVapor = makeSmoke(Math.max(2, actors.length * 2), 1);

  // Very thin ground wisps connect the separate vapor plumes without masking feet.
  const floorMaterial = own(new THREE.ShaderMaterial({
    uniforms: smokeUniforms,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime,uBuild;
      ${noiseGLSL}
      void main(){
        vec2 p=vUv*2.0-1.0;
        float n=fbm(vec3(p*3.5+vec2(uTime*.035,-uTime*.055),uTime*.09));
        float border=(1.0-smoothstep(.78,1.0,abs(p.x)))*(1.0-smoothstep(.72,1.0,abs(p.y)));
        float folds=smoothstep(.37,.73,n);
        gl_FragColor=vec4(.38,.49,.20,folds*border*uBuild*.16);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  const groundMist = mesh(own(new THREE.PlaneGeometry(halfWidth * 2 - 0.3, halfDepth * 2 - 0.3)), floorMaterial);
  groundMist.rotation.x = -Math.PI / 2;
  groundMist.position.y = floorY + 0.035;
  groundMist.renderOrder = 1;

  // Sparse particulate flecks give the mist depth without a confetti effect.
  const moteCount = lowQuality ? 48 : 92;
  const motePositions = new Float32Array(moteCount * 3);
  const moteSeeds = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    moteSeeds[i * 3] = (random() * 2 - 1) * (halfWidth - 0.6);
    moteSeeds[i * 3 + 1] = random();
    moteSeeds[i * 3 + 2] = (random() * 2 - 1) * (halfDepth - 0.7);
  }
  const moteGeometry = own(new THREE.BufferGeometry());
  const moteAttribute = new THREE.BufferAttribute(motePositions, 3).setUsage(THREE.DynamicDrawUsage);
  moteGeometry.setAttribute('position', moteAttribute);
  const moteMaterial = own(new THREE.PointsMaterial({
    color: 0xb2c878, size: 0.026, transparent: true, opacity: 0,
    depthWrite: false, sizeAttenuation: true,
  }));
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  motes.frustumCulled = false; group.add(motes);

  function clearAvoidance() {
    for (const actor of actors) {
      if (avoidanceState.get(actor.id)?.owned) actor.clearTarget?.();
    }
    avoidanceState.clear();
  }

  function reset() {
    clearAvoidance();
    reactionState.clear();
    time = 0;
    previousProgress = -1;
    previousPhase = 'preview';
    smokeUniforms.uTime.value = 0;
    smokeUniforms.uBuild.value = 0;
    smokeUniforms.uFinal.value = 0;
    smokeUniforms.uLamp.value = 0;
    leakLight.intensity = alarmLight.intensity = 0;
    vapor.cloud.visible = jets.cloud.visible = groundMist.visible = false;
    exposureVapor.cloud.visible = false;
    exposureVapor.geometry.instanceCount = 0;
    moteMaterial.opacity = 0;
    amber.emissiveIntensity = 0.25;
    fans.forEach(({ rotor }) => { rotor.rotation.z = 0; });
    valveWheels.forEach(({ wheel }) => { wheel.rotation.y = 0; });
    needles.forEach(needle => { needle.rotation.z = 1.1; });
    warningLenses.forEach(lens => { lens.scale.x = 0.79 * 0.92; });
  }

  function concentrationAt(position, build) {
    // Recirculation distributes a low dose throughout the room immediately.
    // Real distance from the seven leaking vents adds local concentration;
    // the draw/selected ID never affects exposure, choreography or vapor.
    let plume = 0;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const outlet of outlets) {
      const dx = position.x - outlet[0];
      const dz = position.z - outlet[2];
      const distance = Math.hypot(dx, dz);
      plume += Math.exp(-(distance * distance) / (3.3 + build * 8.5));
      if (distance < nearestDistance) { nearest = outlet; nearestDistance = distance; }
    }
    return {
      density: THREE.MathUtils.clamp(0.24 + build * 0.66 + plume * 0.19, 0.24, 1.35),
      nearest, nearestDistance,
    };
  }

  function update(dt, state) {
    if (disposed) return;
    if (state.phase === 'paused') return;
    const delta = THREE.MathUtils.clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    const p = THREE.MathUtils.clamp(state.progress || 0, 0, 1);
    const active = state.phase === 'running' || state.phase === 'reveal';
    if (p + 0.15 < previousProgress || (previousPhase !== 'preview' && state.phase === 'preview') ||
      (previousPhase === 'preview' && state.phase === 'running')) reset();
    time += delta;
    previousProgress = p; previousPhase = state.phase;
    const build = smooth(0.025, 0.83, p);
    const finalBeat = smooth(0.79, 0.96, p);
    smokeUniforms.uTime.value = time;
    smokeUniforms.uBuild.value = build;
    smokeUniforms.uFinal.value = finalBeat;
    const alarmPulse = .5 + .5 * Math.sin(time * (4 + finalBeat * 3));
    smokeUniforms.uLamp.value = alarmPulse * build;
    leakLight.intensity = 3.2 * build * (.86 + .14 * Math.sin(time * 3.7));
    alarmLight.intensity = build * (.45 + alarmPulse * 2.25);
    vapor.cloud.visible = p > 0.025;
    jets.cloud.visible = p > 0.035;
    groundMist.visible = p > 0.055;
    fans.forEach(({ rotor, direction }) => {
      rotor.rotation.z += delta * direction * (7.5 - build * 5.3 + Math.sin(time * 7) * finalBeat * 0.8);
    });
    valveWheels.forEach(({ wheel, offset }) => { wheel.rotation.y = smooth(0.07 + offset * 0.025, 0.33, p) * 4.7; });
    needles.forEach((needle, i) => { needle.rotation.z = 1.1 - build * 2.5 + Math.sin(time * 12 + i) * build * 0.045; });
    amber.emissiveIntensity = 0.25 + build * 0.45 + (0.5 + Math.sin(time * (4 + finalBeat * 5))) * build;
    warningLenses.forEach((lens, i) => { lens.scale.x = 0.79 * (0.92 + Math.sin(time * 5 + i) * build * 0.08); });
    moteMaterial.opacity = build * 0.25;
    for (let i = 0; i < moteCount; i++) {
      const offset = i * 3;
      motePositions[offset] = moteSeeds[offset] + Math.sin(time * 0.23 + i) * 0.16;
      motePositions[offset + 1] = floorY + 0.12 + ((moteSeeds[offset + 1] + time * 0.027) % 1) * (0.7 + build * 1.5);
      motePositions[offset + 2] = moteSeeds[offset + 2] + Math.sin(time * 0.16 + i * 0.7) * 0.2;
    }
    moteAttribute.needsUpdate = true;
    let vaporCount = 0;
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      // Health and death belong to the central system. The VIP never receives
      // poison, coughing, avoidance commands or convulsions from this hazard.
      if (!active || actor.alive === false || actor.invincible) continue;
      const exposure = concentrationAt(actor.position, build);
      const onset = smooth(0.025, 0.085, p);
      if (onset > 0 && delta > 0) {
        ctx.effects?.emit?.('damage', {
          actorId: actor.id, kind: 'poison',
          amount: (3.1 + build * 5.2) * (0.76 + exposure.density * 0.32) * onset * delta,
          position: [actor.position.x, actor.position.y + 1.15, actor.position.z],
          intensity: THREE.MathUtils.clamp(onset * (0.2 + exposure.density * 0.53), 0, 1),
          invincible: false,
        });
      }
      if (p > 0.055 && delta > 0 && typeof actor.setReaction === 'function') {
        let schedule = reactionState.get(actor.id);
        if (!schedule) {
          schedule = { next: time + 0.05 + (i % 9) * 0.085, type: null, coughs: 0 };
          reactionState.set(actor.id, schedule);
        }
        const type = p > 0.11 + (i % 4) * 0.012 ? 'cough' : 'fear';
        if (schedule.type !== type) {
          schedule.type = type;
          schedule.next = Math.min(schedule.next, time + 0.12 + (i % 7) * 0.085);
        }
        if (time >= schedule.next) {
          const strength = THREE.MathUtils.clamp(0.27 + exposure.density * 0.41 + build * 0.13, 0, 0.86);
          actor.setReaction(type, strength, type === 'cough' ? 0.62 + (i % 3) * 0.09 : 0.7);
          if (type === 'cough') {
            schedule.coughs++;
            // Short torso compression accompanies an exhalation. This never
            // triggers a fall/death action or asks for flailing arms.
            actor.setSquish?.('cough', 0.12 + build * 0.12, 0.28);
            if (schedule.coughs % 3 === 0) actor.setReaction('fear', strength * 0.65, 0.8);
          }
          schedule.next = time + 1.55 + (i % 5) * 0.23 + Math.sin(i * 2.1 + schedule.coughs) * 0.12;
        }
      }
      if (p > 0.085 && vaporCount + 2 <= exposureVapor.origins.length / 3) {
        for (let j = 0; j < 2; j++) {
          const at = vaporCount++ * 3;
          exposureVapor.origins[at] = actor.position.x + (j ? 0.23 : -0.23);
          exposureVapor.origins[at + 1] = floorY + 0.17;
          exposureVapor.origins[at + 2] = actor.position.z;
        }
      }
      // Normally the character controller keeps its own wandering and personal
      // space. Only someone physically close to a live vent briefly steps away.
      // Release that local detour promptly; there is no shared safe destination.
      let avoidance = avoidanceState.get(actor.id);
      if (avoidance?.owned && (time >= avoidance.releaseAt || !active)) {
        actor.clearTarget?.();
        avoidance.owned = false;
      }
      if (delta > 0 && p > 0.06 && exposure.nearestDistance < 1.7 &&
        (!avoidance || time >= avoidance.next) && typeof actor.setTarget === 'function') {
        const outlet = exposure.nearest;
        let dx = actor.position.x - outlet[0], dz = actor.position.z - outlet[2];
        const distance = Math.hypot(dx, dz);
        if (distance < 0.04) { dx = outlet[3]; dz = outlet[5]; }
        const length = Math.max(0.01, Math.hypot(dx, dz));
        dx /= length; dz /= length;
        const sidestep = Math.sin(i * 2.4 + time * 0.3) * 0.45;
        actor.setTarget(
          THREE.MathUtils.clamp(actor.position.x + dx * 2.05 - dz * sidestep, -halfWidth + 1.15, halfWidth - 1.15),
          THREE.MathUtils.clamp(actor.position.z + dz * 2.05 + dx * sidestep, -halfDepth + 1.15, halfDepth - 1.15),
        );
        avoidance = { owned: true, releaseAt: time + 0.85, next: time + 2.15 + (i % 3) * 0.2 };
        avoidanceState.set(actor.id, avoidance);
      }
    }
    exposureVapor.geometry.instanceCount = vaporCount;
    exposureVapor.cloud.visible = vaporCount > 0;
    if (vaporCount) exposureVapor.originAttribute.needsUpdate = true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    // All resources are module-owned, including canvas label textures.
    resources.forEach(resource => resource.dispose());
    resources.clear(); clearAvoidance(); reactionState.clear();
    group.clear();
  }
  reset();
  return { update, reset, dispose };
}
