/**
 * Sculpted low-slung GT cars for race3d. All car geometry is authored around
 * local +Z forward, with Y up; the track module supplies world placement.
 */
export function createRaceCars(THREE, racers = []) {
  const group = new THREE.Group();
  group.name = 'race3d-cars';
  const meshes = new Map();
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const geometryCache = new Map();
  const materialCache = new Map();
  let disposed = false;

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

  function createBodyGeometry() {
    // Longitudinal profile: a tapered nose, muscular wheel shoulders and a
    // gently pinched tail. The dense loft keeps reflections flowing cleanly.
    const stations = [
      [-2.30, .07, .40], [-2.16, .74, .69], [-1.84, .98, .79],
      [-1.38, 1.03, .84], [-.70, .96, .86], [0, .90, .86],
      [.72, .96, .88], [1.25, 1.01, .84], [1.72, .86, .72],
      [2.04, .56, .62], [2.24, .17, .53], [2.28, .015, .48],
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
    const makeLayer = (top) => {
      const positions = [], indices = [];
      for (let iz = 0; iz <= countZ; iz++) {
        const z = z0 + (z1 - z0) * iz / countZ, half = Math.max(.008, sample(z, 1));
        const topY = sample(z, 2);
        for (let iu = 0; iu <= countU; iu++) {
          const u = -1 + 2 * iu / countU;
          const x = half * u;
          const edge = Math.pow(Math.abs(u), 2.3);
          const y = top ? topY - .19 * edge : .29 + .11 * edge;
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
      for (let iz = 0; iz <= countZ; iz++) {
        const z = z0 + (z1 - z0) * iz / countZ, half = Math.max(.008, sample(z, 1));
        positions.push(sign * half, .29 + .11, z, sign * half, sample(z, 2) - .19, z);
        if (iz < countZ) {
          const a = iz * 2, b = a + 2;
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
  const bodyGeometry = cacheGeometry('sculpted-body-v1', createBodyGeometry);

  function canopyGeometry() {
    const stations = [
      [-1.18, .39, .97], [-1.02, .57, 1.10], [-.70, .66, 1.43],
      [-.26, .64, 1.53], [.12, .59, 1.50], [.49, .50, 1.22],
      [.76, .32, .96],
    ];
    const verts = [], indices = [], nz = 30, nu = 12;
    const interp = (z, col) => {
      let i = 0; while (i < stations.length - 2 && z > stations[i + 1][0]) i++;
      const a = stations[i], b = stations[i + 1], t = THREE.MathUtils.clamp((z - a[0]) / (b[0] - a[0]), 0, 1);
      return a[col] + (b[col] - a[col]) * t;
    };
    for (let iz = 0; iz <= nz; iz++) {
      const z = stations[0][0] + (stations.at(-1)[0] - stations[0][0]) * iz / nz;
      const width = interp(z, 1), roof = interp(z, 2);
      for (let iu = 0; iu <= nu; iu++) {
        const u = -1 + 2 * iu / nu;
        verts.push(width * u, roof - .075 * u * u, z);
        if (iz < nz && iu < nu) {
          const a = iz * (nu + 1) + iu, b = a + nu + 1;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
  const glassRoofGeometry = cacheGeometry('canopy-glass-v1', canopyGeometry);

  function addWheel(car, side, axle, wheelSpin, steering, mats) {
    const x = side * .99, z = axle * 1.39, y = .47;
    const mount = new THREE.Group();
    mount.name = `${side > 0 ? 'right' : 'left'}-${axle > 0 ? 'front' : 'rear'}-wheel`;
    mount.position.set(x, y, z);
    mount.rotation.y = axle > 0 ? steering : 0;
    car.add(mount);
    const spinning = new THREE.Group();
    spinning.position.x = side * .12;
    mount.add(spinning);
    wheelSpin.push(spinning);

    const tire = mesh(spinning, cylinder(.42, .42, .28, 32), mats.rubber, 'performance-tire', [0, 0, 0], [0, 0, Math.PI / 2]);
    tire.castShadow = true;
    // Sidewall shoulder rings, shallow tread ribs and a forged five-spoke rim.
    for (const face of [-1, 1]) {
      const xFace = face * .151;
      mesh(spinning, torus(.345, .018), mats.rubberDetail, 'tire-sidewall-ridge', [xFace, 0, 0], [0, Math.PI / 2, 0]);
      mesh(spinning, cylinder(.29, .29, .026, 32), mats.rimDark, 'brake-rotor', [face * .132, 0, 0], [0, 0, Math.PI / 2]);
      mesh(spinning, cylinder(.257, .257, .035, 32), mats.rim, 'forged-rim-lip', [face * .16, 0, 0], [0, 0, Math.PI / 2]);
      for (let spoke = 0; spoke < 5; spoke++) {
        const angle = spoke * Math.PI * 2 / 5 + .13;
        mesh(spinning, box(.045, .31, .065), mats.rim, 'forged-rim-spoke', [face * .181, Math.cos(angle) * .09, Math.sin(angle) * .09], [angle, 0, 0]);
      }
      mesh(spinning, cylinder(.095, .095, .055, 24), mats.rimDark, 'wheel-hub', [face * .196, 0, 0], [0, 0, Math.PI / 2]);
      mesh(spinning, cylinder(.046, .046, .059, 18), mats.accentMetal, 'center-lock', [face * .228, 0, 0], [0, 0, Math.PI / 2]);
    }
    // Fixed caliper behind each rotor and paired suspension links under the sill.
    mesh(mount, box(.09, .19, .15), mats.caliper, 'brake-caliper', [side * .075, .03, -.16]);
    const inner = v3(side * .57, .40, z), hubTop = v3(x - side * .08, .58, z - .03);
    link(car, inner, v3(x - side * .17, .43, z + .25), .027, mats.suspension, 'lower-control-arm');
    link(car, inner, v3(x - side * .17, .43, z - .25), .027, mats.suspension, 'lower-control-arm');
    link(car, hubTop, v3(x - side * .19, .73, z + .04), .032, mats.suspension, 'coilover-strut');
    // Fine grooves catch light around the tire without a high-polygon tread mesh.
    for (let rib = 0; rib < 3; rib++)
      mesh(spinning, torus(.414 - rib * .026, .009), mats.rubberDetail, 'tread-circumferential-groove', [0, 0, 0], [0, Math.PI / 2, 0]);
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
    const body = mesh(car, bodyGeometry, mats.body, 'sculpted-unibody');
    body.material = mats.body;
    // Side sills and deep front/rear aero pieces visually anchor the shell.
    for (const side of [-1, 1]) {
      mesh(car, box(.10, .14, 1.54), mats.carbon, 'carbon-side-sill', [side * .91, .35, -.08]);
      mesh(car, box(.07, .13, .96), mats.body, 'rear-quarter-fender', [side * .91, .51, -1.45]);
      mesh(car, box(.065, .11, .92), mats.body, 'front-fender-shoulder', [side * .92, .52, 1.42]);
      mesh(car, box(.08, .07, .42), mats.dark, 'side-air-intake', [side * .98, .57, -.76]);
      mesh(car, sphere(.20, .09, .18), mats.body, 'side-mirror', [side * .62, 1.01, .51]);
      mesh(car, sphere(.035, .035, .21), mats.whiteLamp, 'mirror-signal', [side * .76, 1.035, .51]);
    }
    mesh(car, box(1.35, .105, .48), mats.carbon, 'front-splitter', [0, .32, 2.12]);
    mesh(car, box(1.35, .12, .34), mats.carbon, 'rear-diffuser', [0, .31, -2.11]);
    // Tapered translucent cockpit glazing over a detailed driver and harness.
    mesh(car, glassRoofGeometry, mats.glass, 'curved-cockpit-glass');
    mesh(car, sphere(.47, .22, .58), mats.interior, 'cockpit-bucket-seat', [0, 1.06, -.25]);
    mesh(car, sphere(.31, .17, .27), mats.seat, 'driver-shoulders', [0, 1.22, .11]);
    const driverColor = index % 2 ? '#e3dfd1' : '#252e3a';
    const suit = mat(`driver-suit:${driverColor}`, driverColor, .52, .06);
    mesh(car, sphere(.205, .205, .19), mats.helmet, 'visible-driver-helmet', [0, 1.43, .11]);
    mesh(car, sphere(.137, .080, .12), mats.visor, 'helmet-dark-visor', [0, 1.45, .252]);
    mesh(car, box(.035, .31, .035), mats.accentMetal, 'driver-harness', [-.17, 1.25, .16], [0, 0, -.34]);
    mesh(car, box(.035, .31, .035), mats.accentMetal, 'driver-harness', [.17, 1.25, .16], [0, 0, .34]);
    mesh(car, sphere(.14, .07, .19), suit, 'driver-suit', [0, 1.14, .07]);

    // The hood and rear deck carry a rotating set of coherent race liveries.
    const style = index % 4;
    if (style === 0 || style === 2) {
      const stripeWidth = style === 0 ? .085 : .16;
      for (const side of style === 0 ? [-1, 1] : [0]) {
        mesh(car, box(stripeWidth, .018, style === 0 ? .70 : .88), mats.stripe, 'hood-racing-stripe', [side * (style === 0 ? .20 : 0), .906, .96]);
        mesh(car, box(stripeWidth, .018, .48), mats.stripe, 'rear-deck-racing-stripe', [side * (style === 0 ? .20 : 0), .856, -1.42]);
      }
    } else if (style === 1) {
      for (const side of [-1, 1]) mesh(car, box(.055, .018, .78), mats.stripe, 'hood-pinstripe', [side * .68, .906, .96]);
      mesh(car, box(1.50, .025, .13), mats.stripe, 'rear-racing-band', [0, .856, -1.42]);
    } else {
      for (const side of [-1, 1]) {
        mesh(car, box(.07, .08, .78), mats.stripe, 'side-swoosh', [side * .98, .67, .07], [0, 0, side * -.14]);
      }
    }
    // Slim lamps sit in shaped fascia recesses; emissive surfaces remain legible
    // in a chase view without flooding the circuit with fake point lights.
    for (const side of [-1, 1]) {
      mesh(car, box(.46, .075, .035), mats.whiteLamp, 'front-led-headlamp', [side * .63, .67, 2.13], [0, side * .12, 0]);
      mesh(car, box(.52, .075, .035), mats.redLamp, 'rear-led-lightbar', [side * .57, .69, -2.16], [0, -side * .1, 0]);
      mesh(car, cylinder(.075, .075, .08, 16), mats.metal, 'exhaust-tip', [side * .48, .41, -2.17], [Math.PI / 2, 0, 0]);
      mesh(car, cylinder(.049, .049, .086, 12), mats.accentMetal, 'exhaust-inner', [side * .48, .41, -2.19], [Math.PI / 2, 0, 0]);
    }
    // Sculpted rear wing, uprights, roof fin, and a few restrained aero details.
    mesh(car, box(1.36, .065, .21), mats.body, 'rear-wing', [0, 1.05, -1.91], [-.08, 0, 0]);
    for (const side of [-1, 1]) mesh(car, box(.055, .28, .17), mats.carbon, 'rear-wing-upright', [side * .50, .91, -1.83], [-.08, 0, 0]);
    mesh(car, box(.12, .055, .48), mats.stripe, 'shark-fin', [0, 1.02, -.90], [.14, 0, 0]);
    mesh(car, box(.30, .028, .12), mats.accentMetal, 'fuel-cap', [sideSafe(index) * .73, .87, -1.20]);

    const number = (index + 1).toString().padStart(2, '0');
    const tex = doorTexture(number, racer.name);
    if (tex) {
      const numberMat = new THREE.MeshStandardMaterial({ map: tex, roughness: .42, metalness: .05, side: THREE.DoubleSide });
      materials.add(numberMat);
      for (const side of [-1, 1]) {
        mesh(car, plane(.48, .24), numberMat, 'door-number-decal', [side * .991, .67, -.24], [0, side * Math.PI / 2, 0]);
      }
    } else {
      for (const side of [-1, 1]) mesh(car, box(.018, .20, .36), mats.stripe, 'door-number-panel', [side * .99, .68, -.24]);
    }

    const wheelSpin = [], steeringPivots = [];
    for (const side of [-1, 1]) for (const axle of [-1, 1]) {
      addWheel(car, side, axle, wheelSpin, 0, mats);
      const wheel = car.children.at(-1);
      if (axle > 0) steeringPivots.push(wheel);
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
    mergeStaticMeshes(car);
    group.add(car);
    meshes.set(racer.id ?? index, { car, racer, wheelSpin, steeringPivots, primaryHex });
  }

  function sideSafe(index) { return index % 2 ? 1 : -1; }
  racers.forEach((racer, index) => buildCar(racer, index));

  function update(track) {
    if (disposed || !track?.sampleTrack) return;
    for (const state of meshes.values()) {
      const racer = state.racer;
      const sample = track.sampleTrack(Number(racer.distance) || 0);
      if (!sample?.position || !sample?.tangent) continue;
      const right = sample.right || { x: sample.tangent.z || 0, y: 0, z: -(sample.tangent.x || 0) };
      const lateral = Number(racer.lateral) || 0;
      const yaw = Math.atan2(sample.tangent.x || 0, sample.tangent.z || 0) + (Number(racer.heading) || 0);
      state.car.position.set(
        sample.position.x + (right.x || 0) * lateral,
        (sample.position.y || 0) + .035 + Math.sin((Number(racer.distance) || 0) * .16) * Math.min(.012, Math.abs(Number(racer.speed) || 0) * .00025),
        sample.position.z + (right.z || 0) * lateral,
      );
      state.car.rotation.set(0, yaw, Math.sin((Number(racer.distance) || 0) * .11) * .008, 'YXZ');
      const roll = (Number(racer.distance) || 0) / .42;
      for (const wheel of state.wheelSpin) wheel.rotation.x = roll;
      const steering = THREE.MathUtils.clamp(Number(racer.heading) || 0, -.45, .45) * .52;
      for (const wheel of state.steeringPivots) wheel.rotation.y = steering;
      state.car.userData.finished = Boolean(racer.finished);
      state.car.userData.speed = Number(racer.speed) || 0;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    group.clear();
    meshes.clear(); geometries.clear(); textures.clear(); materials.clear(); geometryCache.clear(); materialCache.clear();
  }

  return { group, update, dispose };
}

export default createRaceCars;
