import {createFinishFX,advanceFinishVisual} from './race3d-finish-fx.js?v=20261025-fifty1';
import { createAuthoredCarAssets } from './race3d-car-assets.js?v=20261025-fifty1';
import { REAL_GT_PROFILE, addRealGT } from './race3d-real-gt.js?v=20261025-fifty1';
import { createCarMotion } from './race3d-car-motion.js?v=20261025-fifty1';
import { createDamageVisuals } from './race3d-damage-visuals.js?v=20261025-fifty1';
import { vehicleProfile } from './race3d-vehicle.js?v=20261025-fifty1';

/**
 * Sculpted low-slung GT cars for race3d. All car geometry is authored around
 * local +Z forward, with Y up; the track module supplies world placement.
 */
export function createRaceCars(THREE, racers = [], options = {}) {
  const group = new THREE.Group();
  group.name = 'race3d-cars';
  const reducedMotion=options.reducedMotion??!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finishFX=createFinishFX(THREE,{quality:options.id,reducedMotion});group.add(finishFX.group);let finishEvents=[];
  const meshes = new Map();
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const geometryCache = new Map();
  const materialCache = new Map();
  let disposed = false;
  const lateDisposedResources=new WeakSet();
  const authoredAssets = createAuthoredCarAssets(THREE, {prepareAsset:options.prepareAsset,isDisposed:()=>disposed,registerResource(type,resource){if(!resource)return;if(disposed){if(!lateDisposedResources.has(resource)){lateDisposedResources.add(resource);resource.dispose?.();resource.image?.close?.();}return;}({geometry:geometries,material:materials,texture:textures})[type].add(resource);}});

  const damageVisuals=createDamageVisuals(THREE,group,(type,resource)=>({geometry:geometries,material:materials,texture:textures})[type].add(resource));

  const cacheGeometry = (key, make) => {
    if (!geometryCache.has(key)) {
      const geometry = make();
      geometry.computeVertexNormals?.();
      geometryCache.set(key, geometry);
      geometries.add(geometry);
    }
    return geometryCache.get(key);
  };
  const box = (w, h, d) => cacheGeometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d));
  const cylinder = (r1, r2, h, sides = 24) => cacheGeometry(`cyl:${r1}:${r2}:${h}:${sides}`, () => new THREE.CylinderGeometry(r1, r2, h, sides));
  const sphere = (w, h, d) => cacheGeometry(`sphere:${w}:${h}:${d}`, () => {
    const geo = new THREE.SphereGeometry(1, 20, 14);
    geo.scale(w, h, d);
    return geo;
  });
  const torus = (radius, tube, arcs = 32) => cacheGeometry(`torus:${radius}:${tube}:${arcs}`, () => new THREE.TorusGeometry(radius, tube, 8, arcs));
  const plane = (w, h) => cacheGeometry(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h));
  const mat = (key, color, roughness = .42, metalness = .12, extra = {}) => {
    if (!materialCache.has(key)) {
      const Material = Object.hasOwn(extra, 'clearcoat') ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
      const m = new Material({ color, roughness, metalness, ...extra });
      materialCache.set(key, m);
      materials.add(m);
    }
    return materialCache.get(key);
  };
  const mesh = (parent, geometry, material, name, position, rotation, scale) => {
    const item = new THREE.Mesh(geometry, material);
    item.name = name;
    item.castShadow = true;
    item.receiveShadow = true;
    if (position) item.position.set(...position);
    if (rotation) item.rotation.set(...rotation);
    if (scale) item.scale.set(...scale);
    parent.add(item);
    return item;
  };
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const setBetween = (object, a, b) => {
    const delta = b.clone().sub(a);
    object.position.copy(a).addScaledVector(delta, .5);
    object.scale.y = delta.length();
    object.quaternion.setFromUnitVectors(v3(0, 1, 0), delta.normalize());
  };
  const link = (parent, a, b, radius, material, name) => {
    const item = mesh(parent, cylinder(radius, radius, 1, 10), material, name);
    setBetween(item, a, b);
    return item;
  };
  const safeColor = (value, fallback) => {
    try {
      const c = new THREE.Color(value || fallback);
      if (!Number.isFinite(c.r + c.g + c.b)) return new THREE.Color(fallback);
      return c;
    } catch { return new THREE.Color(fallback); }
  };
  const contrastColor = color => {
    const c = safeColor(color, '#00c5a5');
    return c.getHSL({ h: 0, s: 0, l: 0 }).l > .52 ? '#122237' : '#f6f0d6';
  };

  // Coalesce fixed trim, spokes and lights by material inside each rigid group.
  // Wheel groups remain separate so their spin and steering stay animated.
  function mergeStaticMeshes(parent) {
    const byMaterial = new Map();
    for (const child of [...parent.children]) {
      if (child.isGroup) {
        mergeStaticMeshes(child);
      } else if (child.isMesh && child.geometry?.getAttribute('position')) {
        const key = child.material;
        if (!byMaterial.has(key)) byMaterial.set(key, []);
        byMaterial.get(key).push(child);
      }
    }
    for (const [material, parts] of byMaterial) {
      if (parts.length < 2) continue;
      const positions = [], normals = [], uvs = [], indices = [];
      let offset = 0;
      for (const part of parts) {
        part.updateMatrix();
        const geo = part.geometry, pos = geo.getAttribute('position'), norm = geo.getAttribute('normal'), uv = geo.getAttribute('uv');
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(part.matrix);
        const p = new THREE.Vector3(), n = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          p.fromBufferAttribute(pos, i).applyMatrix4(part.matrix);
          positions.push(p.x, p.y, p.z);
          if (norm) {
            n.fromBufferAttribute(norm, i).applyNormalMatrix(normalMatrix);
            normals.push(n.x, n.y, n.z);
          } else normals.push(0, 1, 0);
          uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
        }
        if (geo.index) for (let i = 0; i < geo.index.count; i++) indices.push(geo.index.getX(i) + offset);
        else for (let i = 0; i < pos.count; i++) indices.push(i + offset);
        offset += pos.count;
        parent.remove(part);
      }
      const merged = new THREE.BufferGeometry();
      merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      merged.setIndex(indices);
      merged.computeBoundingSphere();
      geometries.add(merged);
      mesh(parent, merged, material, `merged-${parts[0].name}`);
    }
  }

  let bodySurface, bodySurfaceY;
  function createBodyGeometry(profile = null) {
    // Longitudinal profile: a tapered nose, muscular wheel shoulders and a
    // gently pinched tail. The dense loft keeps reflections flowing cleanly.
    const stations = profile?.stations || [
      [-2.30, .77, .70], [-2.16, .91, .77], [-1.84, 1.00, .87],
      [-1.38, 1.04, .91], [-.70, .96, .86], [0, .90, .86],
      [.72, .96, .88], [1.25, 1.04, .91], [1.72, .98, .85],
      [2.04, .82, .70], [2.24, .73, .62], [2.28, .70, .59],
    ];
    const sample = (z, column) => {
      let i = 0;
      while (i < stations.length - 2 && z > stations[i + 1][0]) i++;
      const a = stations[Math.max(0, i - 1)][column], b = stations[i][column];
      const c = stations[i + 1][column], d = stations[Math.min(stations.length - 1, i + 2)][column];
      const t = THREE.MathUtils.clamp((z - stations[i][0]) / (stations[i + 1][0] - stations[i][0]), 0, 1);
      return .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    };
    const countZ = 64, countU = 20, z0 = stations[0][0], z1 = stations[stations.length - 1][0];
    const archHeight = z => {
      const distance = Math.min(Math.abs(z - 1.39), Math.abs(z + 1.39));
      return distance < .55 ? .47 + Math.sqrt(Math.max(0, .55 * .55 - distance * distance)) : .34;
    };
    const shoulder = z => (profile?.shoulderAmplitude ?? .20) * Math.exp(-Math.pow((Math.abs(z) - 1.39) / .48, 2));
    const edgeTop = z => sample(z, 2) - .12 + shoulder(z);
    const edgeBottom = z => Math.min(edgeTop(z) - .025, archHeight(z));
    bodySurface = z => ({half: Math.max(.008,sample(z,1)),top:sample(z,2)});
    bodySurfaceY = (z,u) => sample(z,2)-.12*Math.pow(Math.abs(u),2.3)+shoulder(z)*Math.pow(Math.abs(u),4);
    const makeLayer = (top) => {
      const positions = [], indices = [];
      for (let iz = 0; iz <= countZ; iz++) {
        const z = z0 + (z1 - z0) * iz / countZ, half = Math.max(.008, sample(z, 1));
        const topY = sample(z, 2);
        for (let iu = 0; iu <= countU; iu++) {
          const u = -1 + 2 * iu / countU;
          const x = half * u;
          const edge = Math.pow(Math.abs(u), 2.3);
          const y = top ? bodySurfaceY(z,u) : .29 + (edgeBottom(z) - .29) * Math.pow(Math.abs(u), 8);
          positions.push(x, y, z);
          if (iz < countZ && iu < countU) {
            const a = iz * (countU + 1) + iu, b = a + countU + 1;
            if (top) indices.push(a, b, a + 1, a + 1, b, b + 1);
            else indices.push(a, a + 1, b, a + 1, b + 1, b);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    };
    const top = makeLayer(true), bottom = makeLayer(false);
    // Close both long sidewalls using the loft boundary rows.
    const positions = [], indices = [];
    for (const sign of [-1, 1]) {
      const sideOffset = positions.length / 3;
      for (let iz = 0; iz <= countZ; iz++) {
        const z = z0 + (z1 - z0) * iz / countZ, half = Math.max(.008, sample(z, 1));
        positions.push(sign * half, edgeBottom(z), z, sign * half, edgeTop(z), z);
        if (iz < countZ) {
          const a = sideOffset + iz * 2, b = a + 2;
          if (sign > 0) indices.push(a, b, a + 1, a + 1, b, b + 1);
          else indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const sides = new THREE.BufferGeometry();
    sides.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    sides.setIndex(indices);
    sides.computeVertexNormals();
    // A group geometry is represented by a single buffer so disposal is easy.
    const mergedPositions = [], mergedIndices = [];
    let offset = 0;
    for (const geometry of [top, bottom, sides]) {
      const p = geometry.getAttribute('position').array;
      for (const value of p) mergedPositions.push(value);
      const idx = geometry.index?.array;
      if (idx) for (const value of idx) mergedIndices.push(value + offset);
      offset += p.length / 3;
      geometry.dispose();
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(mergedPositions, 3));
    result.setIndex(mergedIndices);
    result.computeVertexNormals();
    return result;
  }
  const bodyGeometry = cacheGeometry('sculpted-body-v2', () => createBodyGeometry(REAL_GT_PROFILE));
 const gtSurface=bodySurface, gtSurfaceY=bodySurfaceY;
 const hyperBody=cacheGeometry('aster-body-v1',()=>createBodyGeometry(hypercarProfile));
 const hyperSurface=bodySurface, hyperSurfaceY=bodySurfaceY;

  const addCockpit = createCockpitBuilder(THREE,{cacheGeometry,mat,mesh,box,sphere,torus,link,v3});

  function addWheel(car, side, axle, wheelSpin, steering, mats) {
    const x = side * .99, z = axle * 1.39;
    const mount = new THREE.Group();
    mount.name = `${side > 0 ? 'right' : 'left'}-${axle > 0 ? 'front' : 'rear'}-wheel`;
    mount.position.set(x, .423, z);
    mount.userData.wheelId=`${axle>0?'front':'rear'}-${side<0?'left':'right'}`;
    mount.userData.rollingRadius=.423;
    mount.rotation.y = axle > 0 ? steering : 0;
    car.add(mount);
    const spinning = new THREE.Group();
    spinning.userData.rollingRadius=.423;
    spinning.userData.axle=axle>0?'front':'rear';
    spinning.position.x = side * .12;
    mount.add(spinning);
    wheelSpin.push(spinning);
    // Hollow rounded carcass: the rim aperture stays genuinely open.
    // Profile coordinates are radius and axle distance, revolved around Y then X.
    const tireGeo = cacheGeometry('performance-tire:rounded-hollow-v2', () => {
      const profile = [[.275,-.135],[.33,-.147],[.385,-.132],[.416,-.103],
        [.423,-.075],[.423,-.06],[.417,-.055],[.417,-.043],[.423,-.038],
        [.423,.038],[.417,.043],[.417,.055],[.423,.06],[.423,.075],
        [.416,.103],[.385,.132],[.33,.147],[.275,.135],[.275,-.135]];
      const geo = new THREE.LatheGeometry(profile.map(([r,a]) => new THREE.Vector2(r,a)), 32);
      geo.rotateZ(Math.PI / 2);
      return geo;
    });
    mesh(spinning, tireGeo, mats.rubber, 'rounded-performance-tire');
    const rotorGeo = cacheGeometry('ventilated-rotor-annulus-v2', () => {
      const geo = new THREE.RingGeometry(.10, .235, 32);
      geo.rotateY(Math.PI / 2);
      return geo;
    });
    // Only outward face needs polished details; inward face remains dark barrel.
    const f = side;
    mesh(spinning, torus(.267,.018,32), mats.rim, 'forged-open-rim-lip', [f*.151,0,0], [0,Math.PI/2,0]);
    mesh(spinning, torus(.27,.014,32), mats.rimDark, 'inner-rim-lip', [-f*.125,0,0], [0,Math.PI/2,0]);
    mesh(spinning, torus(.345,.006,32), mats.rubberDetail, 'moulded-sidewall-ring', [f*.146,0,0], [0,Math.PI/2,0]);
    mesh(spinning, rotorGeo, mats.rimDark, 'brake-disc-visible-through-spokes', [f*.105,0,0], f < 0 ? [0,Math.PI,0] : [0,0,0]);
    for (let spoke=0;spoke<5;spoke++) {
      const angle = spoke*Math.PI*2/5;
      for (const split of [-.11,.11]) {
        const a = angle+split;
        mesh(spinning, box(.035,.19,.022), mats.rim, 'split-forged-spoke', [f*.158,Math.cos(a)*.167,Math.sin(a)*.167], [a,0,0]);
      }
    }
    mesh(spinning, cylinder(.078,.078,.04,16), mats.rim, 'wheel-hub', [f*.16,0,0], [0,0,Math.PI/2]);
    mesh(spinning, cylinder(.038,.038,.05,12), mats.accentMetal, 'center-lock', [f*.18,0,0], [0,0,Math.PI/2]);
    // Caliper steers with the knuckle but never rotates with the tire.
    mesh(mount, box(.065,.15,.085), mats.caliper, 'fixed-brake-caliper', [side*.24,.065,-.18]);
    for (const fore of [-1,1]) {
      link(car,v3(side*.56,.40,z+fore*.25),v3(x-side*.10,.43,z),.021,mats.suspension,'wishbone-lower');
      link(car,v3(side*.65,.64,z+fore*.17),v3(x-side*.10,.59,z),.018,mats.suspension,'wishbone-upper');
    }
    link(car,v3(x-side*.12,.46,z),v3(x-side*.27,.77,z),.032,mats.suspension,'coilover-damper');
    return mount;
  }

  function doorTexture(number, name) {
    if (typeof document === 'undefined' || !THREE.CanvasTexture) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const c = canvas.getContext('2d');
    if (!c) return null;
    c.fillStyle = '#f1eee4'; c.fillRect(0, 0, 256, 128);
    c.fillStyle = '#151b24'; c.font = '900 74px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(number), 128, 53);
    c.fillStyle = '#536070'; c.font = '700 17px system-ui, sans-serif';
    let label = String(name || '').toUpperCase().slice(0, 16);
    c.fillText(label, 128, 105);
    const texture = new THREE.CanvasTexture(canvas);
    if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    return texture;
  }

  function buildCar(racer, index) {
    const primary = safeColor(racer.color, ['#ef594f', '#20b8a4', '#f2b83d', '#527de6', '#d75ca9', '#8bbf54'][index % 6]);
    const primaryHex = `#${primary.getHexString()}`;
    const accent = contrastColor(primaryHex);
    const palette = ['#e9b94e', '#52d4c4', '#ed765d', '#a9b9ef'];
    const liveryColor = palette[index % palette.length];
    const mats = {
      body: mat(`body:${primaryHex}`, primaryHex, .25, .55, { clearcoat: .8, clearcoatRoughness: .22 }),
      accent: mat(`accent:${accent}`, accent, .28, .25, { clearcoat: .5 }),
      stripe: mat(`stripe:${liveryColor}`, liveryColor, .27, .35, { clearcoat: .65 }),
      glass: mat('glass:blueblack', '#152c3d', .16, .36, { transparent: true, opacity: .68, side: THREE.DoubleSide, depthWrite: false, clearcoat: .9 }),
      rubber: mat('rubber:black', '#111820', .78, .02),
      rubberDetail: mat('rubber:detail', '#252c31', .66, .02),
      rim: mat('rim:alloy', '#aeb8bd', .24, .8),
      rimDark: mat('rim:dark', '#39454d', .31, .66),
      metal: mat('metal:dark', '#26333a', .31, .68),
      accentMetal: mat('metal:bright', '#e1c879', .22, .84),
      suspension: mat('suspension:steel', '#68757b', .34, .74),
      caliper: mat('brake:caliper', liveryColor, .34, .28),
      interior: mat('interior:carbon', '#101820', .55, .1),
      seat: mat('interior:seat', '#283844', .55, .14),
      helmet: mat(`helmet:${primaryHex}`, primaryHex, .2, .42, { clearcoat: 1 }),
      visor: mat('helmet:visor', '#102d40', .12, .34, { transparent: true, opacity: .74, side: THREE.DoubleSide }),
      whiteLamp: mat('lamp:white', '#fff5d0', .18, .08, { emissive: '#fff0bd', emissiveIntensity: 1.3 }),
      redLamp: mat('lamp:red', '#f3444f', .2, .08, { emissive: '#ff263b', emissiveIntensity: 1.0 }),
      dark: mat('trim:black', '#111921', .42, .3),
      carbon: mat('trim:carbon', '#202a30', .4, .48),
    };
    const car = new THREE.Group();
    car.name = `car-${racer.id ?? index}`;
    car.userData.racerId = racer.id;
 const profile=({'gt3':0,'lamborghini-gallardo':1,'tesla-roadster':2,'f1-2026':3,'car-concept':4})[racer.racerType]??0;
 car.userData.cosmeticProfile=['glass-gt','aster-h','electric-canopy','vector-e','vision'][profile];
 const api={cacheGeometry,mesh,box,sphere,cylinder,mat};
 let lighting={update(){}};
 if(profile===2) addEVSilhouette(THREE,car,mats,api);
 else if(profile===3) buildOpenWheel(THREE,car,mats,api);
 else {
    const body = mesh(car, profile===1?hyperBody:bodyGeometry, mats.body, 'sculpted-unibody');
    body.material = mats.body;
    // Side sills and deep front/rear aero pieces visually anchor the shell.
    for (const side of [-1, 1]) {
      mesh(car, box(.10, .14, 1.54), mats.carbon, 'carbon-side-sill', [side * .91, .35, -.08]);
      mesh(car, box(.08, .07, .42), mats.dark, 'side-air-intake', [side * .98, .57, -.76]);
      mesh(car, sphere(.20, .09, .18), mats.body, 'side-mirror', [side * .62, 1.01, .51]);
    }
    mesh(car, box(1.35, .105, .48), mats.carbon, 'front-splitter', [0, .32, 2.12]);
    mesh(car, box(1.35, .12, .34), mats.carbon, 'rear-diffuser', [0, .31, -2.11]);
    addCockpit(car,mats,index);
    lighting = addCarLighting({car,key:index,mesh,box,cylinder,torus,mat,mats});
    // Sculpted rear wing, uprights, roof fin, and a few restrained aero details.
    mesh(car, box(1.36, .065, .21), mats.body, 'rear-wing', [0, 1.05, -1.91], [-.08, 0, 0]);
    for (const side of [-1, 1]) mesh(car, box(.055, .28, .17), mats.carbon, 'rear-wing-upright', [side * .50, .91, -1.83], [-.08, 0, 0]);
    mesh(car, box(.12, .055, .48), mats.stripe, 'shark-fin', [0, 1.02, -.90], [.14, 0, 0]);
    mesh(car, box(.30, .028, .12), mats.accentMetal, 'fuel-cap', [sideSafe(index) * .73, .87, -1.20]);

    if(profile===1) {
 for(const child of [...car.children]) if(['rear-wing','rear-wing-upright','shark-fin'].includes(child.name))car.remove(child);
 addHypercarAero(THREE,car,mats,api);
 }
 if(profile===0) addGlassGT(THREE,car,mats,api);
 }
 const number = (index + 1).toString().padStart(2, '0');
    const tex = doorTexture(number, racer.name);
    if (tex && profile!==3) {
      const numberMat = new THREE.MeshStandardMaterial({ map: tex, roughness: .42, metalness: .05, side: THREE.DoubleSide });
      materials.add(numberMat);
      for (const side of [-1, 1]) {
        mesh(car, plane(.48, .24), numberMat, 'door-number-decal', [side * .991, .67, -.24], [0, side * Math.PI / 2, 0]);
      }
    } else if(profile!==3) {
      for (const side of [-1, 1]) mesh(car, box(.018, .20, .36), mats.stripe, 'door-number-panel', [side * .99, .68, -.24]);
    }

    const wheelSpin = [], steeringPivots = [], wheelMounts = [];
    for (const side of [-1, 1]) for (const axle of [-1, 1]) {
      const wheel = addWheel(car, side, axle, wheelSpin, 0, mats);
      const footprint=vehicleProfile(racer);wheel.position.x=side*footprint.track/2;wheel.position.z=axle>0?footprint.front:-footprint.rear;
      wheelMounts.push(wheel);
      if (axle > 0) steeringPivots.push(wheel);
      if(profile===2 || profile===3) continue;
      // Fender lips follow the upper shoulder of each wheel opening.
      const points = [];
      for (let j = 0; j <= 16; j++) {
        const a = Math.PI * j / 16;
        points.push(v3(side * 1.015, .47 + Math.sin(a) * .48, axle * 1.39 + Math.cos(a) * .53));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const fender = cacheGeometry(`arch:${side}:${axle}`, () => new THREE.TubeGeometry(curve, 28, .043, 7, false));
      mesh(car, fender, mats.body, 'painted-wheel-arch-lip');
    }
    if(profile!==2 && profile!==3) addRaceCarDetails(THREE,car,index,mats,{cacheGeometry,mesh,box,sphere,mat,sampleBody:profile===1?hyperSurface:gtSurface,surfaceY:(x,z)=>(profile===1?hyperSurfaceY:gtSurfaceY)(z,x/(profile===1?hyperSurface:gtSurface)(z).half)});
    if(profile===4) addVisionVariant(THREE,car,mats,api);
    if(profile===0) addRealGT(THREE,car,mats,api);
    mergeStaticMeshes(car);
    const visualRacer=Object.create(racer);
    const motion = createCarMotion(THREE, { car, racer:visualRacer, wheelSpin, wheelMounts, steeringPivots, lighting, index });
    group.add(car);
    const state={ car, racer, visualRacer, wheelSpin, wheelMounts, steeringPivots, primaryHex, lighting, motion };
    meshes.set(racer.id ?? index, state);
    damageVisuals.add(state);
    state.assetsReady=options.authoredModels===false?Promise.resolve(false):authoredAssets.attach(state,index).catch(error=>{authoredAssets.errors.push({id:car.userData.racerId,message:String(error.message||error)});return false;});
  }

  function sideSafe(index) { return index % 2 ? 1 : -1; }
  racers.forEach((racer, index) => buildCar(racer, index));
  const lodBody=cacheGeometry('lod-body',()=>new THREE.BoxGeometry(1.85,.62,4.25).translate(0,.63,0));
  const lodCabin=cacheGeometry('lod-cabin',()=>new THREE.BoxGeometry(1.35,.55,1.7).translate(0,1.15,-.1));
  const lodTire=cacheGeometry('lod-tire',()=>new THREE.CylinderGeometry(.44,.44,.25,8).rotateZ(Math.PI/2));
  for(const state of meshes.values())if(!state.form){
    const proxy=new THREE.Group();proxy.name='distance-lod';
    const shell=new THREE.Mesh(lodBody,mat('lod:'+state.primaryHex,state.primaryHex,.35,.45));proxy.add(shell);
    if(state.racer.racerType!=='f1-2026')proxy.add(new THREE.Mesh(lodCabin,mat('lod-glass','#294653',.18,.3)));
    for(const side of [-1,1])for(const axle of [-1,1]){const w=new THREE.Mesh(lodTire,mat('lod-rubber','#101820',.8,0));w.position.set(side*.94,.44,axle*1.4);proxy.add(w);}
    const detail=new THREE.Group();detail.name='detailed-racer';for(const child of [...state.car.children])detail.add(child);state.car.add(detail);
    proxy.visible=false;state.detailGroup=detail;state.proxy=proxy;state.car.add(proxy);
  }

  // Finishing is immutable in physics; spin and disassembly are render-only.
  function resetVisual(state){for(const key of Object.keys(state.visualRacer))delete state.visualRacer[key];state.finishAnimation=null;state.finishHidden=false;state.finishStage=null;state.car.visible=true;}
  function updateFinishPose(state,track,dt){
    if(!state.racer.finished){if(state.finishAnimation)resetVisual(state);return null;}
    const f=advanceFinishVisual(state.finishAnimation,state.racer,dt,reducedMotion);state.finishAnimation=f.state;state.finishHidden=f.hidden;state.finishStage=f.stage;state.car.visible=!f.hidden;Object.assign(state.visualRacer,f.pose,{finishHidden:f.hidden});
    return f.burst?state:null;
  }
  function update(track, dt = 1 / 60, view = {}) {
    if (disposed || !track?.sampleTrack) return;
    const focus=meshes.get(view.focusedId)?.racer;
    const gap=state=>{const raw=Math.abs(state.racer.distance-(focus?.distance??state.racer.distance))%track.totalLength;return Math.min(raw,track.totalLength-raw);};
    const detailed=new Set([...meshes.values()].filter(s=>s.proxy).sort((a,b)=>gap(a)-gap(b)||a.racer.gridPosition-b.racer.gridPosition).slice(0,view.detailedCars||6));
    const bursts=[];for (const state of meshes.values()) {
      const distance=gap(state),far=!!state.proxy&&(distance>(view.lodDistance||120)||(distance>35&&!detailed.has(state)));const burst=updateFinishPose(state,track,dt);state.motion.update(track,dt,{detailed:!far||!!state.finishAnimation});if(burst){const f=new THREE.Vector3(0,0,1).applyQuaternion(state.car.quaternion),r=new THREE.Vector3(1,0,0).applyQuaternion(state.car.quaternion),d=state.car.userData.assetDimensions||{};bursts.push({length:d.length||4.4,width:d.width||1.9,forwardX:f.x,forwardZ:f.z,rightX:r.x,rightZ:r.z,carId:state.racer.id,gridPosition:state.racer.gridPosition,color:state.primaryHex,x:state.car.position.x,y:state.car.position.y+.75,z:state.car.position.z,distance:state.visualRacer.distance,lateral:state.visualRacer.lateral,time:state.finishAnimation.age});}if(!far){state.form?.update(dt,state.visualRacer);state.authoredVisuals?.update(state.visualRacer);}
      if(state.proxy){state.proxy.visible=far;state.detailGroup.visible=!far;state.car.userData.lod=far?'distant':'detailed';}
    }
    finishEvents.push(...finishFX.emit(bursts));finishFX.update(dt);
    damageVisuals.update(dt);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    finishFX.dispose();finishEvents=[];damageVisuals.dispose();
    for(const state of meshes.values())state.form?.dispose();
    group.removeFromParent();
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) { texture.dispose(); texture.image?.close?.(); }
    for (const material of materials) material.dispose();
    group.clear();
    meshes.clear(); geometries.clear(); textures.clear(); materials.clear(); geometryCache.clear(); materialCache.clear();
  }

  return { group, update, dispose, assetsReady:Promise.all([...meshes.values()].map(state=>state.assetsReady)), assetErrors:authoredAssets.errors,
    reset() { finishFX.reset();finishEvents=[];damageVisuals.reset(); for (const state of meshes.values()) {state.car.scale.setScalar(1);state.car.visible=true;resetVisual(state);state.motion.reset();} },
    drainFinishEvents(){const events=finishEvents;finishEvents=[];return events;},
    finishSnapshot(){const states=[...meshes.values()].filter(s=>s.racer.finished);return {...finishFX.snapshot(),hidden:states.filter(s=>s.finishHidden).length,pending:states.filter(s=>!s.finishHidden).length,complete:states.every(s=>s.finishStage==='cleared')&&finishFX.snapshot().alive===0};},
    selectionPose(id, { x, y, rotation, scale = 1 }) {
      const state=meshes.get(id);if(!state)return;
      state.car.visible=true;state.car.position.set(x,y,0);state.car.rotation.set(.18,rotation,0);state.car.scale.setScalar(scale);
    },
    visualPose(id) {return meshes.get(id)?.visualRacer||null;},
    damageSnapshot() {return damageVisuals.snapshot();},
    snapshot() { return [...meshes.values()].map(state => ({...state.motion.snapshot(),visualDistance:state.visualRacer.distance,visualLateral:state.visualRacer.lateral,visualSpeed:state.visualRacer.speed,finishHidden:!!state.finishHidden,finishStage:state.finishStage||null,racerType:state.racer.racerType||null,vehicleName:state.racer.vehicleName||state.car.userData.assetLabel,form:state.form?.meta||null,assetId:state.car.userData.assetId||null,assetLoaded:!!state.car.userData.assetLoaded,assetDimensions:state.car.userData.assetDimensions||null,authoredWheelCount:state.car.userData.authoredWheelCount||0,finish:state.authoredVisuals?.snapshot()||null})); },
    assetSnapshot() {return {errors:[...authoredAssets.errors],cars:[...meshes.values()].map(s=>({id:s.racer.id,...s.car.userData,authoredWheelCount:s.car.userData.authoredWheelCount||0}))};},
    setHiddenId(id) { for (const state of meshes.values()) state.car.visible = !state.finishHidden&&(id === null || state.racer.id !== id); },
  };
}

export default createRaceCars;

/** Shared, disposal-safe cockpit. Call once per car factory, then builder(car,mats,index).
 * Replaces old curved-cockpit-glass AND old driver meshes. +Z is forward.
 */
function createCockpitBuilder(THREE, {cacheGeometry, mat, mesh, box, sphere, torus, link, v3}) {
  const glazing = mat('cockpit:laminated-glass', '#9fbec8', .12, .05, {
    transparent: true, opacity: .25, depthWrite: false, side: THREE.FrontSide,
    clearcoat: 1, clearcoatRoughness: .08,
  });
  const rubber = mat('cockpit:window-seal', '#172027', .72, .03);
  const fabric = mat('cockpit:seat-fabric', '#24313b', .94, 0);
  const suit = mat('cockpit:ivory-suit', '#d7d5c9', .83, 0);
  const harness = mat('cockpit:red-harness', '#b53a32', .76, 0);
  const visor = mat('cockpit:opaque-visor', '#192932', .12, .48, {clearcoat: 1});
  // No transmission pass or per-car render target: transparent single-sided panes.
  function pane(key, corners) {
    return cacheGeometry(`cockpit:${key}:v2`, () => {
      const g = new THREE.BufferGeometry();
      const a = corners[0], b = corners[1], c = corners[2], d = corners[3];
      const positions = [], indices = [], n = 6;
      for (let y=0;y<=n;y++) for(let x=0;x<=n;x++) {
        const u=x/n,v=y/n;
        for(let k=0;k<3;k++) positions.push((1-v)*((1-u)*a[k]+u*b[k])+v*((1-u)*d[k]+u*c[k]));
      }
      for(let y=0;y<n;y++) for(let x=0;x<n;x++) {
        const i=y*(n+1)+x; indices.push(i,i+1,i+n+1,i+1,i+n+2,i+n+1);
      }
      g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      g.setIndex(indices); g.computeVertexNormals(); return g;
    });
  }
  const lf=[-.55,.92,.86],rf=[.55,.92,.86],lt=[-.43,1.60,.17],rt=[.43,1.60,.17];
  const lr=[-.55,.92,-.85],rr=[.55,.92,-.85],lb=[-.43,1.60,-.46],rb=[.43,1.60,-.46];
  const panes=[pane('windshield',[lf,rf,rt,lt]),pane('rear',[rr,lr,lb,rb]),
    pane('left',[lr,lf,lt,lb]),pane('right',[rf,rr,rb,rt])];
  return function addCockpit(car, mats, index=0) {
    for(let i=0;i<panes.length;i++) {
      const window=mesh(car,panes[i],glazing,['laminated-windshield','rear-window','left-window','right-window'][i]);
      window.castShadow=false; window.receiveShadow=false;
    }
    mesh(car,box(.88,.045,.66),mats.body,'painted-cabin-roof',[0,1.615,-.145]);
    for(const [a,b] of [[lf,lt],[rf,rt],[lr,lb],[rr,rb],[lt,rt],[lb,rb],[lt,lb],[rt,rb],[lf,rf],[lr,rr],[lf,lr],[rf,rr]])
      link(car,v3(...a),v3(...b),.022,rubber,'bonded-window-seal');
    mesh(car,box(.89,.025,1.31),mats.interior,'cockpit-dark-floor',[0,.88,-.04]);
    mesh(car,box(.8,.12,.24),mats.interior,'dashboard',[0,1.02,.62]);
    mesh(car,box(.47,.40,.12),fabric,'bucket-seat-back',[0,1.12,-.33],[-.12,0,0]);
    mesh(car,sphere(.25,.19,.18),suit,'driver-torso',[0,1.17,-.08]);
    mesh(car,sphere(.16,.17,.16),mats.helmet,'driver-helmet',[0,1.38,-.02]);
    mesh(car,sphere(.145,.068,.057),visor,'driver-visor',[0,1.40,.125]);
    for(const side of [-1,1]) {
      link(car,v3(side*.10,1.32,.045),v3(side*.065,1.03,.10),.018,harness,'shoulder-harness');
      link(car,v3(side*.21,1.26,-.02),v3(side*.19,1.15,.32),.048,suit,'driver-arm');
    }
    mesh(car,torus(.15,.018,20),rubber,'steering-wheel',[0,1.17,.35],[-.35,0,0]);
    link(car,v3(.25,.945,.81),v3(-.28,1.12,.66),.012,rubber,'windshield-wiper');
  };
}


/** Call inside buildCar before mergeStaticMeshes. All resources use owner's caches.
 * sampleBody(z) returns {half, top}; surfaceY(x,z) can override for custom shells.
 * Replaces original livery block; remove original mirror-signal meshes.
 */
function addRaceCarDetails(THREE, car, index, mats, api) {
  const {cacheGeometry, mesh, box, sphere, mat, sampleBody, surfaceY} = api;
  if (!sampleBody) throw new Error('addRaceCarDetails requires sampleBody(z)');
  const yAt = (x,z) => surfaceY ? surfaceY(x,z) : sampleBody(z).top - .19 * Math.pow(Math.abs(x / sampleBody(z).half), 2.3);
  const paint = mat(`decal-paint:${index % 4}`, ['#e9b94e','#52d4c4','#ed765d','#a9b9ef'][index % 4], .30, .18, {clearcoat:.82, clearcoatRoughness:.19});
  const gap = mat('panel-gap', '#101519', .74, .03);
  const lens = mat('mirror-lens', '#9bafb8', .11, .92);
  // Thin ribbons follow every shell station; no raised rectangular stripe bars.
  function ribbon(key, z0, z1, left, right, material, lift=.003) {
    const geometry = cacheGeometry(`detail:${key}`, () => {
      const positions=[], indices=[], steps=24;
      for(let i=0;i<=steps;i++) {
        const z=z0+(z1-z0)*i/steps;
        for(const x of [left(z),right(z)]) positions.push(x,yAt(x,z)+lift,z);
        if(i<steps) {const a=i*2; indices.push(a,a+2,a+1,a+1,a+2,a+3);}
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      g.setIndex(indices); g.computeVertexNormals(); return g;
    });
    mesh(car,geometry,material,key);
  }
  const style=index%4;
  const centers=style===0?[-.17,.17]:style===1?[-.48,.48]:style===2?[0]:[.34];
  const width=style===2?.16:style===1?.035:.085;
  for(const [j,c] of centers.entries()) {
    ribbon(`hood-stripe-${style}-${j}`,.83,1.88,()=>c-width/2,()=>c+width/2,paint);
    ribbon(`deck-stripe-${style}-${j}`,-1.93,-1.22,()=>c-width/2,()=>c+width/2,paint);
  }
  // Restrained seams are ribbons, not thick tubing; two hood shut lines.
  for(const side of [-1,1]) {
    ribbon(`hood-shutline-${side}`,.80,1.86, z=>side*.61*sampleBody(z).half-.0035,z=>side*.61*sampleBody(z).half+.0035,gap,.004);
    // A carbon stalk and rear-facing reflective insert give mirrors construction.
    mesh(car,box(.17,.026,.04),mats.carbon,'mirror-stalk',[side*.65,.975,.51],[0,0,side*.16]);
    mesh(car,sphere(.139,.052,.009),lens,'mirror-reflective-insert',[side*.65,1.012,.354]);
    mesh(car,box(.025,.16,.30),mats.carbon,'wing-endplate',[side*.69,1.07,-1.91],[-.08,0,0]);
  }
  mesh(car,box(1.34,.024,.018),mats.carbon,'wing-gurney-lip',[0,1.096,-2.008]);
}

/** Use before mergeStaticMeshes(car); all resources use the host caches/disposal.
 * Replace old lamp/exhaust loop; remove old white mirror-signal meshes.
 * Save return as state.lighting; call state.lighting.update(racer) each update.
 */
function addCarLighting({ car, key, mesh, box, cylinder, torus, mat, mats }) {
  const housing = mats.dark;
  const chrome = mats.rim;
  const white = mat('lamp:projector-white', '#e8f2ff', .17, .25,
    { emissive: '#d8e9ff', emissiveIntensity: 1.55 });
  const amber = mat('lamp:amber-lens', '#bf580e', .22, .1,
    { emissive: '#ff7a08', emissiveIntensity: .15 });
  // A separate material per car is necessary: one braking car must not light all 60.
  const red = mat(`lamp:brake:${key}`, '#b10c18', .2, .15,
    { emissive: '#ff1627', emissiveIntensity: .42 });
  const soot = mat('exhaust:soot', '#080a0b', .96, 0);
  const highBrake = mat(`lamp:high-brake:${key}`, '#54060a', .25, .1,
    { emissive: '#ff1627', emissiveIntensity: .02 });
  for (const s of [-1, 1]) {
    // Deep black pockets and alloy projector bezels give the lamp an optical depth.
    mesh(car, box(.43, .125, .11), housing, 'headlamp-recess', [s * .57, .57, 2.24]);
    for (const offset of [-.105, .105]) {
      const x = s * .57 + offset;
      mesh(car, cylinder(.043, .043, .018, 12), chrome, 'projector-bezel', [x, .575, 2.305], [Math.PI / 2, 0, 0]);
      mesh(car, cylinder(.031, .031, .020, 12), white, 'projector-optic', [x, .575, 2.318], [Math.PI / 2, 0, 0]);
    }
    mesh(car, box(.35, .014, .012), white, 'led-running-strip', [s * .57, .617, 2.305]);
    mesh(car, box(.035, .055, .016), amber, 'front-amber-marker', [s * .765, .57, 2.302]);
    mesh(car, box(.51, .12, .09), housing, 'rear-light-pocket', [s * .53, .57, -2.31]);
    for (const y of [.55, .588]) mesh(car, box(.43, .018, .014), red, 'rear-led-blade', [s * .53, y, -2.363]);
    mesh(car, box(.03, .055, .014), amber, 'rear-amber-marker', [s * .765, .57, -2.363]);
    // Dark bore, metallic ring, no bright solid cylinder masquerading as an opening.
    mesh(car, cylinder(.067, .067, .12, 16), mats.metal, 'exhaust-sleeve', [s * .48, .375, -2.36], [Math.PI / 2, 0, 0]);
    mesh(car, torus(.057, .010, 16), chrome, 'exhaust-rolled-rim', [s * .48, .375, -2.429]);
    mesh(car, cylinder(.050, .050, .006, 16), soot, 'exhaust-dark-bore', [s * .48, .375, -2.423], [Math.PI / 2, 0, 0]);
  }
  mesh(car, box(.32, .022, .018), highBrake, 'high-mounted-brake-strip', [0, .79, -1.98]);
  mesh(car, box(.78, .155, .065), housing, 'front-central-grille', [0, .425, 2.25]);
  for (const y of [.378, .424, .470]) mesh(car, box(.74, .012, .012), mats.metal, 'grille-horizontal-slat', [0, y, 2.288]);
  for (const x of [-.29, -.145, 0, .145, .29]) mesh(car, box(.012, .125, .012), mats.metal, 'grille-vertical-web', [x, .424, 2.288]);
  return {
    update(racer) {
      const value = Number(racer.brake);
      const brake = Number.isFinite(value) && !racer.finished ? Math.max(0, Math.min(1, value)) : 0;
      red.emissiveIntensity = .42 + brake * 2.5;
      highBrake.emissiveIntensity = .02 + brake * 3;
    },
  };
}


/** Original Aster H endurance silhouette; +Z forward, compatible race3d helper contract. */
const hypercarProfile = Object.freeze({
  name: 'Aster H', wheelbase: 2.78,
  // [z, half width, central deck height]. Keep wheel centers at +/-1.39.
  stations: [[-2.30,.86,.69],[-2.16,.96,.75],[-1.84,1.02,.83],[-1.38,1.04,.86],[-.70,.91,.79],[0,.86,.76],[.72,.92,.73],[1.25,1.04,.77],[1.72,1.00,.70],[2.04,.88,.57],[2.24,.77,.49],[2.28,.73,.47]],
  shoulderAmplitude: .29,
  cockpit: {widthScale:.80,heightScale:.86,depthScale:1.08, baseY:.76},
});

/** Call instead of standard wing/fin trim, before mergeStaticMeshes.
 * All geometry acquired through cacheGeometry/box; material lifetime remains caller-owned.
 * This deliberately creates no lights, textures, listeners, animations, or dispose hooks.
 */
function addHypercarAero(THREE, car, mats, {mesh, box, cacheGeometry}) {
  const fin = cacheGeometry('aster-h:fin:v1', () => {
    // Closed thin prism, swept spine drops from cockpit to rear deck.
    const yz = [[1.40,-.50],[1.07,-1.95],[.80,-1.95],[.79,-.50]];
    const p = []; for (const x of [-.025,.025]) for (const [y,z] of yz) p.push(x,y,z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);
    g.computeVertexNormals(); return g;
  });
  mesh(car,fin,mats.body,'aster-swept-spine');
  mesh(car,box(1.98,.055,.34),mats.carbon,'aster-upper-wing',[0,1.34,-2.03],[-.08,0,0]);
  mesh(car,box(1.85,.045,.18),mats.body,'aster-lower-aero-plane',[0,.94,-2.14]);
  for (const side of [-1,1]) {
    mesh(car,box(.045,.48,.39),mats.body,'aster-wing-endplate',[side*.98,1.12,-2.02]);
    mesh(car,box(.04,.39,.10),mats.carbon,'aster-wing-support',[side*.54,1.12,-1.96],[-.18,0,0]);
    mesh(car,box(.26,.035,.59),mats.carbon,'aster-front-shoulder-vent',[side*.80,.95,1.34],[.04,0,side*.08]);
    mesh(car,box(.12,.09,.62),mats.dark,'aster-side-tunnel-mouth',[side*.91,.48,-.22]);
  }
  for (const x of [-.65,-.32,0,.32,.65]) mesh(car,box(.028,.17,.48),mats.carbon,'aster-diffuser-strake',[x,.33,-2.03],[.12,0,0]);
  return hypercarProfile;
}

/** Original fictional EV silhouette; +Z forward, Y up. All resources owned by caller caches. */
const EV_PROFILE = Object.freeze({
  id: 'electric-canopy', label: 'Electric canopy prototype',
  // z, half width, shoulder height, crown height
  stations: [[-2.04,.56,.48,.57],[-1.65,.83,.67,.73],[-.90,.79,.67,.76],[0,.73,.59,.68],[.95,.77,.56,.62],[1.65,.68,.48,.52],[2.07,.43,.40,.43]],
  wheelbase: 2.5, track: 1.58, roofHeight: 1.38
});

function createEVBodyGeometry(THREE) {
  const p=[], idx=[], stations=EV_PROFILE.stations, slices=12;
  // Closed rounded six-sided transverse section with flat underside.
  for (const [z,w,shoulder,crown] of stations) {
    for(let k=0;k<slices;k++) {
      const a=k/slices*Math.PI*2;
      const x=Math.sin(a)*w;
      const y=Math.cos(a)>=0 ? shoulder+(crown-shoulder)*Math.cos(a) : shoulder+(shoulder-.28)*Math.cos(a);
      p.push(x,y,z);
    }
  }
  for(let s=0;s<stations.length-1;s++) for(let k=0;k<slices;k++) {
    const a=s*slices+k,b=s*slices+(k+1)%slices,c=a+slices,d=b+slices;
    idx.push(a,c,b,b,c,d);
  }
  // Correct winding at each end; caps share outline vertices.
  for(let k=1;k<slices-1;k++) {idx.push(0,k,k+1); const n=(stations.length-1)*slices;idx.push(n,n+k+1,n+k);}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;
}

/** Replace generic body/cockpit/wing/light branches for EV cars; retain wheels and lifecycle. */
function addEVSilhouette(THREE,car,mats,api) {
  const {cacheGeometry,mesh,box,sphere,mat}=api;
  mesh(car,cacheGeometry('ev:body:v1',()=>createEVBodyGeometry(THREE)),mats.body,'ev-sculpted-shell');
  // Low continuous smoked glass canopy; deliberately fictional, not a Tesla replica.
  const glass=mat('ev:smoked-canopy','#163a4a',.12,.45,{clearcoat:1});
  mesh(car,sphere(.57,.53,.99),glass,'ev-glass-canopy',[0,.85,-.20]);
  for(const side of [-1,1]) {
    mesh(car,box(.075,.05,1.22),mats.body,'ev-roof-rail',[side*.43,1.23,-.22],[side*.08,0,0]);
    mesh(car,box(.11,.12,2.4),mats.carbon,'ev-aero-sill',[side*.75,.36,-.02]);
    mesh(car,box(.035,.24,.72),mats.dark,'ev-side-intake',[side*.795,.53,-.70],[0,side*.10,0]);
    mesh(car,box(.33,.035,.075),mats.whiteLamp,'ev-front-led',[side*.40,.48,1.85],[0,side*.18,0]);
  }
  mesh(car,box(1.12,.042,.07),mats.redLamp,'ev-full-width-rear-light',[0,.58,-2.045]);
  mesh(car,box(1.23,.09,.50),mats.carbon,'ev-rear-diffuser',[0,.31,-1.84],[-.14,0,0]);
  for(const x of [-.48,-.24,0,.24,.48]) mesh(car,box(.025,.16,.53),mats.dark,'ev-diffuser-strake',[x,.32,-1.84],[-.14,0,0]);
  mesh(car,box(1.36,.045,.19),mats.body,'ev-integrated-ducktail',[0,.75,-1.76],[-.16,0,0]);
  mesh(car,box(1.13,.045,.30),mats.carbon,'ev-front-splitter',[0,.30,1.88]);
  return car;
}

/** Original Vector-E single seater. +Z forward; no team marks or copied CAD.
 * Called INSTEAD of GT shell/cockpit/fenders/decorations. Existing addWheel,
 * mergeStaticMeshes, state map and disposal remain owned by createRaceCars.
 */
function buildOpenWheel(THREE, car, mats, api) {
  const {cacheGeometry, mesh, box, sphere, cylinder} = api;
  const part=(g,m,n,p,r)=>mesh(car,g,m,n,p,r);
  const rod=(a,b,r=.035)=>{
    const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b), d=end.sub(start);
    const item=part(cylinder(r,r,1,8),mats.carbon,'openwheel-link');
    item.position.copy(start).addScaledVector(d,.5);
    item.scale.y=d.length();
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  };
  const hull=cacheGeometry('openwheel:loft:v1',()=>{
    const stations=[[-2.05,.19,.59],[-1.5,.28,.85],[-.7,.36,.93],[0,.34,.70],[.75,.24,.65],[1.7,.13,.48],[2.13,.10,.39]];
    const p=[],ix=[];
    for(const [z,w,y] of stations) p.push(-w,.30,z,w,.30,z,w,y,z,-w,y,z);
    for(let i=0;i<stations.length-1;i++) for(let j=0;j<4;j++){
      const a=i*4+j,b=i*4+(j+1)%4,c=b+4,d=a+4;ix.push(a,b,d,b,c,d);
    }
    ix.push(0,2,1,0,3,2,24,25,26,24,26,27);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
  });
  part(hull,mats.body,'openwheel-tapered-monocoque');
  part(box(1.45,.075,2.35),mats.carbon,'openwheel-floor',[0,.28,-.25]);
  part(sphere(.28,.085,.43),mats.interior,'openwheel-cockpit-well',[0,.73,.02]);
  part(sphere(.16,.19,.17),mats.helmet,'openwheel-helmet',[0,.92,-.10]);
  part(sphere(.145,.067,.027),mats.visor,'openwheel-visor',[0,.95,.045]);
  for(const s of [-1,1]) {
    part(sphere(.23,.20,.65),mats.body,'openwheel-sidepod',[s*.51,.53,-.35]);
    part(box(.30,.17,.035),mats.dark,'openwheel-sidepod-inlet',[s*.50,.57,.27]);
    part(box(.055,.25,.48),mats.body,'openwheel-front-endplate',[s*.91,.39,1.98]);
    part(box(.055,.34,.49),mats.body,'openwheel-rear-endplate',[s*.73,1.09,-1.98]);
    rod([s*.28,.6,-1.55],[s*.35,1.08,-1.98],.04);
    for(const z of [-1.39,1.39]) for(const dz of [-.28,.28]) rod([s*.23,.46,z+dz],[s*.91,.47,z],.025);
    rod([s*.28,.77,-.44],[s*.27,1.15,-.34]);
    rod([s*.27,1.15,-.34],[s*.24,1.15,.31]);
    rod([s*.24,1.15,.31],[0,1.09,.52]);
  }
  rod([0,1.09,.52],[0,.68,.64]);
  for(const z of [1.86,2.10]) part(box(1.79,.055,.18),mats.carbon,'openwheel-front-wing',[0,.29,z],[.13,0,0]);
  for(const y of [1.0,1.16]) part(box(1.43,.055,.32),mats.carbon,'openwheel-rear-wing',[0,y,-1.98],[-.15,0,0]);
  part(box(.11,.055,.032),mats.redLamp,'openwheel-rain-light',[0,.45,-2.08]);
  return {wheelSpin:[],steeringPivots:[],lighting:{update(){}},profile:'vector-e'};
}

/** Original 'Aster Vision' canopy/aero variant. +Z forward; Y up.
 * Call AFTER existing cockpit/details, BEFORE mergeStaticMeshes.
 * Owner cache helpers own all resources; this helper never disposes shared data.
 */
function addVisionVariant(THREE, car, mats, h) {
  const {cacheGeometry, mesh, box, mat} = h;
  const replace = new Set(['laminated-windshield','rear-window','left-window','right-window',
    'painted-cabin-roof','bonded-window-seal','windshield-wiper',
    'rear-wing','rear-wing-upright','wing-endplate','wing-gurney-lip']);
  for (const part of [...car.children]) if (replace.has(part.name)) car.remove(part);
  const glass = mat('vision:smoked-canopy','#5e8495',.12,.12,
    {transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide,clearcoat:1});
  const canopy = cacheGeometry('vision:arched-canopy:v1',()=> {
    const p=[],idx=[],rows=24,cols=20;
    for(let j=0;j<=rows;j++) {
      const t=j/rows,z=-.92+1.94*t;
      const profile=Math.pow(Math.sin(Math.PI*t),.60);
      for(let i=0;i<=cols;i++) {
        const a=Math.PI*i/cols;
        p.push(.55*Math.cos(a)*Math.max(.06,profile), .94+.72*profile*Math.sin(a),z);
      }
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++) {
      const a=j*(cols+1)+i,b=a+cols+1;
      idx.push(a,b,a+1,a+1,b,b+1);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);
    g.computeVertexNormals();return g;
  });
  const c=mesh(car,canopy,glass,'vision-enclosed-canopy');c.castShadow=false;
  // Segmented painted dorsal spine follows the canopy arch, not a box roof.
  for(let i=0;i<16;i++) {
    const t=(i+.5)/16,z=-.92+1.94*t,y=.96+.72*Math.pow(Math.sin(Math.PI*t),.60);
    const derivative=.72*.6*Math.PI*Math.cos(Math.PI*t)*Math.pow(Math.sin(Math.PI*t),-.4)/1.94;
    mesh(car,box(.045,.025,.126),mats.body,'vision-canopy-spine',[0,y,z],[-Math.atan(derivative),0,0]);
  }
  for(const side of [-1,1]) {
    mesh(car,box(.045,.49,.13),mats.carbon,'vision-swan-neck',[side*.46,1.10,-1.69],[.24,0,0]);
    mesh(car,box(.035,.24,.42),mats.body,'vision-wing-tip',[side*.80,1.34,-1.89],[0,0,side*.12]);
    mesh(car,box(.21,.035,.55),mats.carbon,'vision-front-diveplane',[side*.68,.57,1.58],[-.12,side*.15,side*.08]);
  }
  mesh(car,box(1.63,.055,.29),mats.carbon,'vision-main-airfoil',[0,1.28,-1.86],[-.09,0,0]);
  mesh(car,box(1.61,.032,.13),mats.body,'vision-upper-airfoil',[0,1.39,-2.04],[-.16,0,0]);
  car.userData.designVariant='Aster Vision (original fictional design)';
}

function addGlassGT(THREE,car,mats,{mesh,box}) {
for(const side of [-1,1]) {
mesh(car,box(.065,.07,1.15),mats.carbon,'gt-exoskeleton',[side*.44,1.40,-.04],[.08,0,0]);
mesh(car,box(.13,.14,.72),mats.body,'gt-buttress',[side*.48,1.10,-1.02],[.35,0,side*.18]);
}}
