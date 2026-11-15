import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * A cutaway industrial test cell. Geometry and textures are entirely local so
 * the room remains complete when optional imported equipment is unavailable.
 * The three returned wall groups include their fixtures, so crushing can hide
 * the architecture without leaving floating trim, signs, or wall lights.
 */
export function createEnvironment(scene, renderer) {
  const room = { halfWidth: 7, halfDepth: 6, height: 7, floorY: 0 };
  const root = new THREE.Group();
  root.name = 'Industrial test chamber';
  scene.add(root);

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const lights = [];
  const fans = [];
  const batches = new Map();
  const transform = new THREE.Object3D();
  let clock = 0;
  let disposed = false;
  let seed = 0x7a32f105;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const ownGeometry = (geometry) => (geometries.add(geometry), geometry);
  const ownMaterial = (material) => (materials.add(material), material);
  const anisotropy = Math.min(16, renderer?.capabilities?.getMaxAnisotropy?.() || 1);

  function canvasTexture(width, height, paint, color = true) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    paint(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = anisotropy;
    textures.add(texture);
    return texture;
  }

  // Correlated physical channels: R = micro-height, G = roughness,
  // B = exposed metal. A chip therefore changes colour, relief and reflection
  // together. Large stains stay low frequency; pores and scratches stay fine.
  function surfaceMaps(kind, size = 1024) {
    const concrete = kind === 'concrete';
    const wall = kind === 'wall';
    const colors = document.createElement('canvas');
    const physical = document.createElement('canvas');
    colors.width = physical.width = colors.height = physical.height = size;
    const colorContext = colors.getContext('2d');
    const physicalContext = physical.getContext('2d');
    const colorData = colorContext.createImageData(size, size);
    const physicalData = physicalContext.createImageData(size, size);
    const gridSize = 32;
    const field = new Float32Array(gridSize * gridSize);
    for (let index = 0; index < field.length; index++) field[index] = random();
    const noise = (x, y, scale) => {
      const u = x / size * scale, v = y / size * scale;
      const ix = Math.floor(u), iy = Math.floor(v);
      const fx = u - ix, fy = v - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const at = (dx, dy) => field[((iy + dy) % gridSize) * gridSize + (ix + dx) % gridSize];
      return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(0, 0), at(1, 0), sx),
        THREE.MathUtils.lerp(at(0, 1), at(1, 1), sx), sy);
    };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const macro = noise(x, y, 8), mid = noise(x, y, 32);
        const grain = random() - 0.5;
        const pore = concrete && random() > 0.996;
        const base = concrete ? 188 : wall ? 210 : 204;
        const value = base + (macro - 0.5) * (concrete ? 25 : wall ? 17 : 6)
          + (mid - 0.5) * (concrete || wall ? 11 : 5)
          + grain * (concrete ? 25 : 12) - (pore ? 47 : 0);
        colorData.data[i] = value + (concrete ? 1 : 0);
        colorData.data[i + 1] = value;
        colorData.data[i + 2] = value - (concrete ? 9 : 3);
        colorData.data[i + 3] = 255;
        physicalData.data[i] = 131 + grain * (concrete ? 54 : 13) + (mid - 0.5) * 15 - (pore ? 63 : 0);
        physicalData.data[i + 1] = (concrete ? 235 : wall ? 205 : 179)
          + (macro - 0.5) * (concrete ? 23 : wall ? 48 : 26) + grain * 8;
        physicalData.data[i + 2] = concrete ? 0 : wall ? 4 : 230;
        physicalData.data[i + 3] = 255;
      }
    }
    colorContext.putImageData(colorData, 0, 0);
    physicalContext.putImageData(physicalData, 0, 0);
    // Individual short scratches, not giant high-contrast marbling. The floor
    // retains a very fine directional brush visible only in grazing light.
    if (!concrete) {
      for (let i = 0; i < (wall ? 250 : 2300); i++) {
        const x = random() * size, y = random() * size;
        const length = 1.5 + random() ** 3 * (wall ? 55 : 110);
        const dx = wall ? (random() - 0.5) * 7 : length;
        const dy = wall ? length : (random() - 0.5) * 2.4;
        const bright = i % 4 === 0;
        for (const [ctx, color] of [[colorContext, bright ? 'rgba(241,242,231,.16)' : 'rgba(48,52,49,.10)'],
          [physicalContext, bright ? 'rgba(117,125,245,.38)' : 'rgba(113,207,209,.27)']]) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.4 + random() * 0.8;
          ctx.beginPath();ctx.moveTo(x, y);ctx.lineTo(x + dx, y + dy);ctx.stroke();
        }
      }
      // Corrosion follows panel margins and fixing holes. Oxide is dielectric
      // and rough; fresh scuffs expose smoother metal under the paint.
      for (let i = 0; i < (wall ? 160 : 80); i++) {
        const edge = Math.floor(random() * 4);
        const depth = random() ** 2 * (wall ? 34 : 12);
        const x = edge < 2 ? (edge ? size - depth : depth) : random() * size;
        const y = edge >= 2 ? (edge === 3 ? size - depth : depth) : random() * size;
        const radius = 0.35 + random() ** 2 * (wall ? 3.1 : 2.1);
        const chip = Array.from({ length: 7 }, (_, vertex) => {
          const angle = vertex / 7 * Math.PI * 2;
          const ragged = 0.55 + random() * 0.65;
          return [x + Math.cos(angle) * radius * 1.7 * ragged,
            y + Math.sin(angle) * radius * ragged];
        });
        for (const [ctx, color] of [[colorContext, 'rgba(91,57,29,.36)'], [physicalContext, 'rgba(100,239,0,.80)']]) {
          ctx.fillStyle = color;ctx.beginPath();
          chip.forEach(([px, py], vertex) => vertex ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
          ctx.closePath();ctx.fill();
        }
      }
      if (wall) {
        for (let i = 0; i < 28; i++) {
          const x = random() * size, y = random() * size * 0.8;
          const length = 20 + random() * 160, width = 0.5 + random() * 3;
          for (const [ctx, color] of [[colorContext, 'rgba(77,54,30,.16)'], [physicalContext, 'rgba(127,236,0,.2)']]) {
            const gradient = ctx.createLinearGradient(x, y, x, y + length);
            gradient.addColorStop(0, color);gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;ctx.fillRect(x, y, width, length);
          }
        }
      }
    } else {
      for (let i = 0; i < 160; i++) {
        const x = random() * size, y = random() * size, radius = 0.45 + random() * 1.9;
        for (const [ctx, color] of [[colorContext, 'rgba(50,53,46,.28)'], [physicalContext, 'rgba(63,244,0,.65)']]) {
          ctx.fillStyle = color;ctx.beginPath();ctx.ellipse(x, y, radius, radius * 0.65, 0, 0, Math.PI * 2);ctx.fill();
        }
        colorContext.fillStyle = 'rgba(247,243,230,.17)';
        colorContext.fillRect(x - radius, y + radius * 0.7, radius * 2, 0.6);
      }
    }
    const finish = (canvas, colorSpace) => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = colorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy;
      texture.name = kind + (colorSpace === THREE.SRGBColorSpace ? ' fine albedo' : ' height roughness metalness');
      textures.add(texture);
      return texture;
    };
    return { color: finish(colors, THREE.SRGBColorSpace), physical: finish(physical, THREE.NoColorSpace) };
  }
  const metal = surfaceMaps('metal');
  const wall = surfaceMaps('wall');
  const concrete = surfaceMaps('concrete', 512);
  const metalTexture = metal.color;
  const metalRoughness = metal.physical;
  const wallTexture = wall.color;
  const wallRoughness = wall.physical;
  const concreteTexture = concrete.color;
  const stripeTexture = canvasTexture(512, 128, (ctx, width, height) => {
    ctx.fillStyle = '#b79939';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#202824';
    for (let x = -128; x < width + 128; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + 64, height);
      ctx.lineTo(x + 192, 0);
      ctx.lineTo(x + 128, 0);
      ctx.closePath();
      ctx.fill();
    }
    for (let index = 0; index < 1900; index++) {
      ctx.fillStyle = index % 3 === 0 ? 'rgba(223,214,180,.22)' : 'rgba(37,38,32,.17)';
      ctx.fillRect(random() * width, random() * height, random() * 7 + 0.5, random() * 2 + 0.5);
    }
    ctx.fillStyle = 'rgba(16,24,25,.6)';
    ctx.fillRect(0, 0, width, 5);
    ctx.fillRect(0, height - 5, width, 5);
  });

  const material = (name, options) => {
    const result = ownMaterial(new THREE.MeshStandardMaterial(options));
    result.name = name;
    return result;
  };
  const floorMaterial = material('Worn brushed floor steel', {
    color: 0x718084, map: metalTexture, roughnessMap: metalRoughness,
    metalness: 0.63, metalnessMap: metalRoughness, roughness: 0.96,
    bumpMap: metalRoughness, bumpScale: 0.0045, envMapIntensity: 0.72,
  });
  const wallMaterial = material('Weathered blue grey wall enamel', {
    color: 0x61747d, map: wallTexture, roughnessMap: wallRoughness,
    metalness: 0.7, metalnessMap: wallRoughness, roughness: 0.98,
    bumpMap: wallRoughness, bumpScale: 0.006,
    envMapIntensity: 0.68,
  });
  const steelMaterial = material('Graphite structural steel', {
    color: 0x303e46, map: metalTexture, metalness: 0.78, roughness: 0.75,
    metalnessMap: metalRoughness, roughnessMap: metalRoughness,
    bumpMap: metalRoughness, bumpScale: 0.003,
  });
  const edgeMaterial = material('Exposed machined edges', {
    color: 0x8e9c9e, metalness: 0.86, roughness: 0.41, map: metalTexture,
  });
  const darkMaterial = material('Recessed unlit machinery', {
    color: 0x11191c, metalness: 0.45, roughness: 0.84,
  });
  const concreteMaterial = material('Cast concrete foundation', {
    color: 0x7d7e76, map: concreteTexture, roughness: 1, metalness: 0,
    roughnessMap: concrete.physical, bumpMap: concrete.physical, bumpScale: 0.012, envMapIntensity: 0.45,
  });
  const doorMaterial = material('Armored service door enamel', {
    color: 0x71867c, map: wallTexture, roughnessMap: wallRoughness,
    metalness: 0.55, metalnessMap: wallRoughness, roughness: 0.90, bumpMap: wallRoughness, bumpScale: 0.005,
    envMapIntensity: 0.75,
  });
  const brassMaterial = material('Aged brass fixings', {
    color: 0x9c7b43, map: metalTexture, metalness: 0.78, roughness: 0.57,
  });
  const copperMaterial = material('Oxidized service conduit', {
    color: 0x79664b, map: metalTexture, metalness: 0.73, roughness: 0.62,
  });
  const rubberMaterial = material('Black insulated cable', { color: 0x171c20, roughness: 0.93, metalness: 0.02 });
  const yellowMaterial = material('Faded safety ochre', { color: 0xbba74f, roughness: 0.84, metalness: 0.16 });
  const lampMaterial = material('Warm diffused worklight', {
    color: 0xf5ead9, emissive: 0xffead0, emissiveIntensity: 2.05, roughness: 0.55,
  });
  const coolLampMaterial = material('Neutral observation floodlight', {
    color: 0xe7eef0, emissive: 0xd8eaf2, emissiveIntensity: 1.8, roughness: 0.55,
  });
  const cyanMaterial = material('Door status light', {
    color: 0x99e3dc, emissive: 0x5ee5d5, emissiveIntensity: 2.3, roughness: 0.4,
  });
  const amberMaterial = material('Amber rotating warning lamp', {
    color: 0xffb34e, emissive: 0xff6e15, emissiveIntensity: 1.25, roughness: 0.25, metalness: 0.12,
  });
  const redMaterial = material('Red emergency hardware', {
    color: 0x984937, map: metalTexture, metalness: 0.48, roughness: 0.69,
  });

  const boxGeometry = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const cylinderGeometry = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 10));
  const boltGeometry = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 6));
  const sphereGeometry = ownGeometry(new THREE.SphereGeometry(1, 12, 8));
  const planeGeometry = ownGeometry(new THREE.PlaneGeometry(1, 1));
  const floorPanelGeometry = ownGeometry(new RoundedBoxGeometry(1.977, 0.13, 1.977, 1, 0.012));
  const doorPanelGeometry = ownGeometry(new RoundedBoxGeometry(1.435, 3.78, 0.19, 2, 0.022));
  const concreteBoxes = new Map();

  function addInstance(parent, geometry, mat, position, scale, rotation = [0, 0, 0], tint, cast = true) {
    const key = `${parent.uuid}:${geometry.uuid}:${mat.uuid}:${cast}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { parent, geometry, material: mat, instances: [], cast };
      batches.set(key, batch);
    }
    transform.position.set(...position);
    transform.rotation.set(...rotation);
    transform.scale.set(...scale);
    transform.updateMatrix();
    batch.instances.push({ matrix: transform.matrix.clone(), color: tint ? new THREE.Color(tint) : null });
  }
  function box(parent, mat, x, y, z, width, height, depth, rotation, tint, cast = true) {
    if (mat === concreteMaterial) {
      // Keep concrete pores the same physical size on broad slabs, thin cut
      // faces and tall walls. Unit-box UVs would stretch aggregate into lines.
      const key = `${width}:${height}:${depth}`;
      let geometry = concreteBoxes.get(key);
      if (!geometry) {
        geometry = ownGeometry(new THREE.BoxGeometry(width, height, depth));
        const positions = geometry.attributes.position;
        const normals = geometry.attributes.normal;
        const uv = geometry.attributes.uv;
        for (let index = 0; index < positions.count; index++) {
          const nx = Math.abs(normals.getX(index)), ny = Math.abs(normals.getY(index));
          const u = nx > 0.5 ? positions.getZ(index) : positions.getX(index);
          const v = ny > 0.5 ? positions.getZ(index) : positions.getY(index);
          uv.setXY(index, u / 1.5, v / 1.5);
        }
        uv.needsUpdate = true;
        concreteBoxes.set(key, geometry);
      }
      addInstance(parent, geometry, mat, [x, y, z], [1, 1, 1], rotation, tint, cast);
      return;
    }
    addInstance(parent, boxGeometry, mat, [x, y, z], [width, height, depth], rotation, tint, cast);
  }
  function cylinder(parent, mat, x, y, z, radius, length, rotation = [0, 0, 0], bolt = false, cast = true) {
    addInstance(parent, bolt ? boltGeometry : cylinderGeometry, mat, [x, y, z], [radius, length, radius], rotation, null, cast);
  }
  function mesh(parent, geometry, mat, x = 0, y = 0, z = 0, rotation = [0, 0, 0], cast = true) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.rotation.set(...rotation);
    object.castShadow = cast;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function group(name) {
    const result = new THREE.Group();
    result.name = name;
    root.add(result);
    return result;
  }
  function stripe(parent, width, height, x, y, z, rotation = [0, 0, 0]) {
    const map = stripeTexture.clone();
    map.needsUpdate = true;
    map.repeat.set(Math.max(1, width / 2), 1);
    textures.add(map);
    const mat = material('Distressed safety stripe', {
      map, color: 0xffffff, roughness: 0.89, metalness: 0.16,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1,
    });
    const object = mesh(parent, planeGeometry, mat, x, y, z, rotation, false);
    object.scale.set(width, height, 1);
    return object;
  }
  function sign(parent, main, sub, width, height, x, y, z, options = {}) {
    const map = canvasTexture(1024, Math.round(1024 * height / width), (ctx, w, h) => {
      ctx.fillStyle = options.background || '#263437';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = options.color || '#d8dbca';
      ctx.lineWidth = 5;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = options.color || '#d8dbca';
      ctx.font = `700 ${Math.round(h * (sub ? 0.43 : 0.57))}px "Arial Narrow", Arial, sans-serif`;
      ctx.fillText(main, w * 0.5, h * (sub ? 0.4 : 0.53), w * 0.89);
      if (sub) {
        ctx.font = `600 ${Math.round(h * 0.135)}px Arial, sans-serif`;
        ctx.fillText(sub, w * 0.5, h * 0.78, w * 0.86);
      }
      for (let index = 0; index < 240; index++) {
        ctx.fillStyle = 'rgba(20,27,27,.12)';
        ctx.fillRect(random() * w, random() * h, random() * 7, random() * 3);
      }
    });
    const mat = material(`Enamel sign: ${main}`, { map, roughness: 0.82, metalness: 0.14, side: THREE.DoubleSide });
    const object = mesh(parent, planeGeometry, mat, x, y, z, options.rotation || [0, 0, 0], false);
    object.scale.set(width, height, 1);
    return object;
  }
  function light(parent, object, x, y, z) {
    object.position.set(x, y, z);
    lights.push(object);
    parent.add(object);
    return object;
  }

  const floor = group('Plated floor and drainage');
  const backWall = group('Removable rear wall and armored door');
  const leftWall = group('Removable left wall');
  const rightWall = group('Removable right wall');
  const rig = group('Open overhead gantry and lighting');
  const walls = [leftWall, rightWall, backWall];
  // These are geometry-only cutaway groups. Hiding them never removes the
  // seven-metre room boundary, practical light objects or their shadow maps.
  const ceilingStructure = new THREE.Group();
  ceilingStructure.name = 'Cutaway ceiling beams and brackets';
  const ceilingServices = new THREE.Group();
  ceilingServices.name = 'Cutaway ceiling cable trays';
  const ceilingFixtures = new THREE.Group();
  ceilingFixtures.name = 'Cutaway ceiling fixture housings';
  const ceilingBeams = [ceilingStructure, ceilingServices, ceilingFixtures];
  for (const object of ceilingBeams) {
    object.userData.cutawayOccluder = true;
    rig.add(object);
  }

  // Heavy foundation with a deliberately visible front cut face.
  box(floor, concreteMaterial, 0, -0.36, -0.02, 14.68, 0.56, 12.65);
  box(floor, darkMaterial, 0, -0.095, 0, 14.12, 0.11, 12.12);
  box(floor, steelMaterial, 0, -0.31, 6.31, 14.7, 0.39, 0.12);
  box(floor, edgeMaterial, 0, -0.095, 6.34, 14.7, 0.055, 0.16);
  for (let x = -6.8; x <= 6.81; x += 0.8) {
    cylinder(floor, edgeMaterial, x, -0.29, 6.39, 0.045, 0.035, [Math.PI / 2, 0, 0], true, false);
  }
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 7; column++) {
      const x = column * 2 - 6;
      const z = row * 2 - 5;
      const tint = new THREE.Color().setRGB(0.83 + random() * 0.15, 0.87 + random() * 0.11, 0.88 + random() * 0.10);
      addInstance(floor, floorPanelGeometry, floorMaterial, [x, -0.065, z], [1, 1, 1],
        [0, ((row + column) % 4) * Math.PI / 2, 0], tint);
      for (const dx of [-0.87, 0.87]) {
        for (const dz of [-0.87, 0.87]) {
          cylinder(floor, darkMaterial, x + dx, 0.002, z + dz, 0.025, 0.004, undefined, true, false);
        }
      }
    }
  }
  // Thin, irregular deposits collect beside drains and the pressure-door
  // threshold. Their low alpha preserves the metal response beneath them.
  const depositTexture = canvasTexture(256, 256, (ctx, width, height) => {
    for (let index = 0; index < 38; index++) {
      const x = width * (0.15 + random() * 0.70);
      const y = height * (0.17 + random() * 0.66);
      const radius = 9 + random() * 33;
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
      gradient.addColorStop(0, 'rgba(28,26,20,.15)');
      gradient.addColorStop(1, 'rgba(28,26,20,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.strokeStyle = 'rgba(35,31,23,.15)';
    ctx.lineWidth = 0.7;
    for (let index = 0; index < 160; index++) {
      const x = random() * width;
      const y = random() * height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + random() * 11, y - random() * 3);
      ctx.stroke();
    }
  });
  const depositMaterial = material('Drain sediment and rubbed floor grime', {
    map: depositTexture, color: 0x706854, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.72, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1,
  });
  for (const side of [-1, 1]) {
    for (const z of [-4.5, -0.5, 3.5]) {
      addInstance(floor, planeGeometry, depositMaterial, [side * 5.46, 0.016, z],
        [0.65, 1.9, 1], [-Math.PI / 2, 0, side * 0.04], null, false);
    }
  }
  addInstance(floor, planeGeometry, depositMaterial, [0, 0.016, -4.98], [3, 0.7, 1], [-Math.PI / 2, 0, 0], null, false);
  // A few thin oily films beside drainage change the roughness as well as the
  // colour. Their broken contour does not read as a painted rectangular decal.
  const wetFilmTexture = canvasTexture(512, 512, (ctx, width, height) => {
    for (let i = 0; i < 115; i++) {
      const x = width * (0.19 + random() * 0.62);
      const y = height * (0.12 + random() * 0.76);
      const radius = 4 + random() ** 2 * 47;
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
      gradient.addColorStop(0, 'rgba(92,100,96,.31)');
      gradient.addColorStop(0.55, 'rgba(92,100,96,.19)');
      gradient.addColorStop(1, 'rgba(92,100,96,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  });
  const wetFilmMaterial = material('Thin oil and water film at drain edges', {
    map: wetFilmTexture, color: 0xa3aca8, roughness: 0.22, metalness: 0.04,
    envMapIntensity: 0.82, transparent: true, opacity: 0.66, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  });
  for (const side of [-1, 1]) {
    for (const z of [-4.1, 0.3, 3.7]) {
      addInstance(floor, planeGeometry, wetFilmMaterial, [side * 5.48, 0.018, z],
        [0.75, 1.35, 1], [-Math.PI / 2, 0, side * 0.15], null, false);
    }
  }

  // Drainage staining is placed below panel joins rather than spread uniformly
  // across the room. This supplies scale without adding dense mesh detail.
  const wallDepositTexture = canvasTexture(256, 512, (ctx, width, height) => {
    for (let i = 0; i < 95; i++) {
      const x = width * (0.2 + random() * 0.6);
      const y = height * random() * 0.28;
      const length = 25 + random() ** 1.5 * height * 0.7;
      const gradient = ctx.createLinearGradient(x, y, x, y + length);
      gradient.addColorStop(0, 'rgba(89,57,31,.37)');
      gradient.addColorStop(0.45, 'rgba(100,78,49,.18)');
      gradient.addColorStop(1, 'rgba(120,109,87,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, 0.4 + random() ** 2 * 4.5, length);
    }
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(93,61,34,.25)' : 'rgba(219,213,187,.22)';
      ctx.fillRect(width * (0.19 + random() * 0.62), random() * height * 0.2,
        0.5 + random() * 4, 0.5 + random() * 2.5);
    }
  });
  const wallDepositMaterial = material('Rust and mineral seepage below panel seams', {
    map: wallDepositTexture, color: 0xc9b99c, roughness: 0.96, metalness: 0,
    transparent: true, opacity: 0.8, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1,
  });
  for (const x of [-5.25, -1.75, 1.75, 5.25]) {
    addInstance(backWall, planeGeometry, wallDepositMaterial, [x, 2.84, -5.953],
      [1.9, 0.94, 1], [0, 0, 0], null, false);
  }
  for (const [side, owner] of [[-1, leftWall], [1, rightWall]]) {
    for (const z of [-4.75, -2.02]) {
      addInstance(owner, planeGeometry, wallDepositMaterial, [side * 6.907, 2.84, z],
        [1.7, 0.94, 1], [0, -side * Math.PI / 2, 0], null, false);
    }
  }
  // Recessed drain beds, narrow bright rims, and individually spaced grate bars.
  for (const side of [-1, 1]) {
    const x = side * 5.80;
    box(floor, darkMaterial, x, 0.002, -0.05, 0.36, 0.009, 10.7, undefined, null, false);
    for (const edge of [-1, 1]) {
      box(floor, edgeMaterial, x + edge * 0.18, 0.008, -0.05, 0.022, 0.013, 10.73, undefined, null, false);
    }
    for (let z = -5.3; z <= 5.21; z += 0.135) {
      box(floor, steelMaterial, x, 0.009, z, 0.325, 0.012, 0.035, undefined, null, false);
    }
    stripe(floor, 11.55, 0.16, side * 6.58, 0.008, -0.02, [-Math.PI / 2, 0, Math.PI / 2]);
  }
  stripe(floor, 13.35, 0.17, 0, 0.008, -5.56, [-Math.PI / 2, 0, 0]);
  stripe(floor, 13.35, 0.17, 0, 0.008, 5.54, [-Math.PI / 2, 0, 0]);
  // Corner registration marks leave the center entirely free for the hazards.
  for (const x of [-4.9, 4.9]) {
    for (const z of [-4.8, 4.8]) {
      box(floor, yellowMaterial, x - Math.sign(x) * 0.29, 0.006, z, 0.62, 0.004, 0.045, undefined, null, false);
      box(floor, yellowMaterial, x, 0.006, z - Math.sign(z) * 0.29, 0.045, 0.004, 0.62, undefined, null, false);
    }
  }
  // Four inset maintenance covers add recognizable scale and construction.
  for (const x of [-3, 3]) {
    for (const z of [-3, 3]) {
      box(floor, steelMaterial, x, 0.005, z, 0.62, 0.012, 0.42, undefined, null, false);
      box(floor, darkMaterial, x, 0.012, z - 0.1, 0.20, 0.004, 0.035, undefined, null, false);
      for (const dx of [-0.26, 0.26]) {
        for (const dz of [-0.16, 0.16]) {
          cylinder(floor, brassMaterial, x + dx, 0.014, z + dz, 0.017, 0.006, undefined, true, false);
        }
      }
    }
  }

  // Rear wall: deep structural grid, inset enamel panels, seams, and bolt lines.
  box(backWall, concreteMaterial, 0, 3.45, -6.24, 14.60, 6.90, 0.40);
  for (const x of [-5.25, -1.75, 1.75, 5.25]) {
    for (const y of [1.74, 5.02]) {
      box(backWall, wallMaterial, x, y, -6.005, 3.34, 3.11, 0.085, undefined,
        y > 3 ? 0xcbd4d6 : 0xb8c1bd);
      for (const dx of [-1.55, 1.55]) {
        for (const dy of [-1.43, 0, 1.43]) {
          cylinder(backWall, edgeMaterial, x + dx, y + dy, -5.948, 0.032, 0.021, [Math.PI / 2, 0, 0], true, false);
        }
      }
    }
  }
  for (const x of [-7, -3.5, 3.5, 7]) {
    box(backWall, steelMaterial, x, 3.48, -5.90, 0.18, 6.96, 0.23);
    box(backWall, edgeMaterial, x, 3.48, -5.775, 0.046, 6.96, 0.022, undefined, null, false);
    for (const y of [0.26, 0.45, 3.40, 3.60, 6.50, 6.70]) {
      cylinder(backWall, edgeMaterial, x, y, -5.765, 0.038, 0.025, [Math.PI / 2, 0, 0], true, false);
    }
  }
  for (const y of [0.14, 3.40, 6.84]) {
    box(backWall, steelMaterial, 0, y, -5.91, 14.2, y === 0.14 ? 0.28 : 0.13, 0.2);
  }
  stripe(backWall, 13.8, 0.16, 0, 0.42, -5.932);

  // The forward side walls are low observation parapets. Their open upper
  // halves keep a corner camera from hiding the floor or human figures.
  for (const [side, wall] of [[-1, leftWall], [1, rightWall]]) {
    const x = side * 7.14;
    box(wall, concreteMaterial, x, 3.42, -3.38, 0.34, 6.84, 5.64);
    box(wall, concreteMaterial, x, 0.49, 2.63, 0.34, 0.98, 6.40);
    box(wall, steelMaterial, x, 1.03, 2.63, 0.43, 0.10, 6.44);
    box(wall, edgeMaterial, x - side * 0.02, 1.09, 2.63, 0.40, 0.025, 6.44, undefined, null, false);
    for (const z of [-4.75, -2.02]) {
      for (const y of [1.74, 5.02]) {
        box(wall, wallMaterial, x - side * 0.19, y, z, 0.07, 3.11, 2.57, undefined,
          y > 3 ? 0xcbd4d6 : 0xb8c1bd);
        for (const dz of [-1.14, 1.14]) {
          for (const dy of [-1.43, 0, 1.43]) {
            cylinder(wall, edgeMaterial, x - side * 0.24, y + dy, z + dz, 0.031, 0.023,
              [0, 0, Math.PI / 2], true, false);
          }
        }
      }
    }
    for (const z of [-6.02, -3.38, -0.67]) {
      box(wall, steelMaterial, x - side * 0.18, 3.47, z, 0.22, 6.94, 0.16);
      box(wall, edgeMaterial, x - side * 0.30, 3.47, z, 0.02, 6.94, 0.045, undefined, null, false);
    }
    for (const z of [1.1, 3.3, 5.74]) {
      box(wall, steelMaterial, x - side * 0.18, 0.54, z, 0.22, 1.08, 0.15);
      for (const y of [0.23, 0.81]) {
        cylinder(wall, edgeMaterial, x - side * 0.30, y, z, 0.038, 0.025, [0, 0, Math.PI / 2], true, false);
      }
    }
    // A rear-half rub rail and continuous skirting protect the wall panels.
    box(wall, steelMaterial, x - side * 0.22, 0.14, -0.1, 0.18, 0.27, 11.9);
    box(wall, steelMaterial, x - side * 0.22, 3.4, -3.38, 0.18, 0.13, 5.57);
    stripe(wall, 11.6, 0.15, side * 6.947, 0.43, -0.1, [0, -side * Math.PI / 2, 0]);
    // Fine conduits stay close to the wall, clear of imported equipment.
    for (const z of [-5.80, -5.63]) {
      cylinder(wall, copperMaterial, side * 6.91, 2.75, z, 0.032, 4.65);
      for (const y of [0.72, 2.3, 4.52]) {
        box(wall, steelMaterial, side * 6.91, y, z, 0.12, 0.055, 0.12, undefined, null, false);
      }
    }
    // Ventilation shutters with an actual dark cavity and separate fins.
    box(wall, steelMaterial, side * 6.91, 3.94, -2.1, 0.16, 0.94, 1.52);
    box(wall, darkMaterial, side * 6.80, 3.94, -2.1, 0.02, 0.75, 1.32);
    for (let y = 3.64; y <= 4.26; y += 0.105) {
      box(wall, edgeMaterial, side * 6.77, y, -2.1, 0.085, 0.045, 1.31,
        [0, 0, side * 0.3], null, false);
    }
    sign(wall, side < 0 ? 'SECTOR A' : 'SECTOR B', 'RESTRICTED ACCESS', 1.4, 0.47,
      side * 6.906, 5.45, -1.95,
      { rotation: [0, -side * Math.PI / 2, 0], color: '#c8cab5' });
  }

  // Armored sliding bulkhead centered on the rear wall.
  box(backWall, darkMaterial, 0, 1.99, -5.88, 3.20, 3.98, 0.17);
  for (const side of [-1, 1]) {
    box(backWall, steelMaterial, side * 1.59, 2.05, -5.78, 0.24, 4.10, 0.41);
    box(backWall, edgeMaterial, side * 1.61, 2.04, -5.554, 0.055, 4.04, 0.03, undefined, null, false);
    addInstance(backWall, doorPanelGeometry, doorMaterial, [side * 0.73, 1.91, -5.75], [1, 1, 1]);
    box(backWall, steelMaterial, side * 0.73, 1.91, -5.642, 1.22, 3.51, 0.028);
    box(backWall, doorMaterial, side * 0.73, 1.91, -5.617, 1.16, 3.43, 0.03);
    for (const y of [0.63, 1.29, 2.55, 3.2]) {
      box(backWall, steelMaterial, side * 0.73, y, -5.577, 1.16, 0.075, 0.065);
      for (const dx of [-0.48, 0.48]) {
        cylinder(backWall, edgeMaterial, side * 0.73 + dx, y, -5.534, 0.027, 0.02, [Math.PI / 2, 0, 0], true, false);
      }
    }
    box(backWall, cyanMaterial, side * 1.445, 2.06, -5.565, 0.034, 2.95, 0.04, undefined, null, false);
    box(backWall, steelMaterial, side * 1.59, 0.18, -5.68, 0.40, 0.34, 0.45);
    for (const y of [0.4, 1.45, 2.65, 3.8]) {
      cylinder(backWall, brassMaterial, side * 1.59, y, -5.553, 0.042, 0.025, [Math.PI / 2, 0, 0], true, false);
    }
  }
  box(backWall, steelMaterial, 0, 4.02, -5.78, 3.41, 0.29, 0.42);
  box(backWall, darkMaterial, 0, 4.03, -5.55, 2.7, 0.12, 0.035);
  box(backWall, cyanMaterial, 0, 4.035, -5.523, 2.54, 0.04, 0.03, undefined, null, false);
  stripe(backWall, 3.35, 0.20, 0, 4.22, -5.56);
  box(backWall, edgeMaterial, 0, 0.04, -5.53, 3.20, 0.08, 0.50);
  sign(backWall, 'CHAMBER 07', 'AUTOMATED CONTAINMENT FACILITY', 3.55, 0.74, 0, 5.08, -5.945);
  sign(backWall, 'STAND CLEAR', 'INTERLOCKED PRESSURE DOOR', 1.08, 0.33, -0.73, 2.02, -5.588,
    { background: '#bca44d', color: '#27322f' });
  sign(backWall, '07', 'ENGINEERING / LOWER LEVEL', 1.48, 1.10, -5.12, 4.34, -5.949,
    { background: '#596970', color: '#bac0af' });
  sign(backWall, 'DANGER', 'AUTOMATED MACHINERY', 1.52, 0.61, 5.2, 3.9, -5.949,
    { background: '#b7a050', color: '#303834' });

  // Manual lock wheel, raised hub, four diagonal spokes and small locking dogs.
  const wheelGeometry = ownGeometry(new THREE.TorusGeometry(0.255, 0.033, 7, 32));
  mesh(backWall, wheelGeometry, redMaterial, 0.03, 1.88, -5.43);
  cylinder(backWall, steelMaterial, 0.03, 1.88, -5.50, 0.081, 0.23, [Math.PI / 2, 0, 0]);
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    box(backWall, redMaterial, 0.03, 1.88, -5.43, 0.47, 0.036, 0.04, [0, 0, angle]);
  }
  for (const y of [0.84, 2.92]) {
    box(backWall, edgeMaterial, 0.03, y, -5.55, 0.29, 0.12, 0.10);
    cylinder(backWall, darkMaterial, 0.03, y, -5.487, 0.043, 0.025, [Math.PI / 2, 0, 0], true, false);
  }
  // A compact door controller with an illuminated display and physical buttons.
  box(backWall, steelMaterial, 2.17, 1.83, -5.82, 0.59, 0.96, 0.24);
  box(backWall, edgeMaterial, 2.17, 1.83, -5.682, 0.52, 0.89, 0.025);
  box(backWall, darkMaterial, 2.17, 2.04, -5.661, 0.40, 0.28, 0.028);
  sign(backWall, 'SEALED', 'PRESSURE / NOMINAL', 0.35, 0.19, 2.17, 2.04, -5.642,
    { background: '#182d2b', color: '#99c4a5' });
  for (const x of [2.03, 2.17, 2.31]) {
    for (const y of [1.66, 1.80]) {
      cylinder(backWall, x < 2.1 ? amberMaterial : darkMaterial, x, y, -5.631, 0.036, 0.035,
        [Math.PI / 2, 0, 0], false, false);
    }
  }
  box(backWall, copperMaterial, 2.17, 0.74, -5.89, 0.045, 1.35, 0.045);

  // Small guarded emergency beacons; their light remains subtle until a round.
  for (const x of [-2.1, 2.1]) {
    box(backWall, steelMaterial, x, 4.57, -5.82, 0.31, 0.39, 0.23);
    addInstance(backWall, sphereGeometry, amberMaterial, [x, 4.59, -5.64], [0.105, 0.145, 0.09], undefined, null, false);
    for (const dx of [-0.12, 0.12]) {
      box(backWall, darkMaterial, x + dx, 4.59, -5.55, 0.019, 0.33, 0.025, undefined, null, false);
    }
    for (const y of [4.46, 4.72]) {
      box(backWall, darkMaterial, x, y, -5.55, 0.25, 0.018, 0.025, undefined, null, false);
    }
  }
  const doorGlow = light(backWall, new THREE.PointLight(0x72d9cb, 4, 7, 2), 0, 4.03, -5.30);
  doorGlow.name = 'Interlock header practical glow';
  const beaconGlow = light(backWall, new THREE.PointLight(0xff812f, 5, 6, 2), 0, 4.6, -4.9);

  // Guarded extraction fans at the top of the rear wall.
  const fanRingGeometry = ownGeometry(new THREE.TorusGeometry(0.445, 0.035, 6, 36));
  const fanInnerRingGeometry = ownGeometry(new THREE.TorusGeometry(0.287, 0.011, 5, 30));
  const fanDiskGeometry = ownGeometry(new THREE.CircleGeometry(0.43, 32));
  for (const x of [-4.94, 4.94]) {
    box(backWall, steelMaterial, x, 6.12, -5.94, 1.13, 1.13, 0.18);
    mesh(backWall, fanDiskGeometry, darkMaterial, x, 6.12, -5.836, undefined, false);
    const rotor = new THREE.Group();
    rotor.position.set(x, 6.12, -5.804);
    backWall.add(rotor);
    fans.push(rotor);
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      box(rotor, edgeMaterial, Math.cos(angle) * 0.215, Math.sin(angle) * 0.215, 0,
        0.31, 0.12, 0.023, [0.12, 0, angle + 0.4], null, false);
    }
    cylinder(backWall, steelMaterial, x, 6.12, -5.76, 0.092, 0.11, [Math.PI / 2, 0, 0], false, false);
    mesh(backWall, fanRingGeometry, edgeMaterial, x, 6.12, -5.746, undefined, false);
    mesh(backWall, fanInnerRingGeometry, steelMaterial, x, 6.12, -5.726, undefined, false);
    for (let index = 0; index < 8; index++) {
      box(backWall, steelMaterial, x, 6.12, -5.71, 0.87, 0.014, 0.015,
        [0, 0, index * Math.PI / 8], null, false);
    }
    for (const dx of [-0.48, 0.48]) {
      for (const dy of [-0.48, 0.48]) {
        cylinder(backWall, edgeMaterial, x + dx, 6.12 + dy, -5.831, 0.035, 0.03,
          [Math.PI / 2, 0, 0], true, false);
      }
    }
  }

  // Open I-beam roof: no roof sheet or front crossbeam to obstruct the room.
  function longBeam(x, y, z, length, alongX = false) {
    const width = alongX ? length : 0.31;
    const depth = alongX ? 0.31 : length;
    box(ceilingStructure, steelMaterial, x, y, z, alongX ? length : 0.095, 0.26, alongX ? 0.095 : length);
    for (const dy of [-0.145, 0.145]) {
      box(ceilingStructure, steelMaterial, x, y + dy, z, width, 0.055, depth);
    }
    box(ceilingStructure, edgeMaterial, x, y - 0.178, z, width, 0.012, depth, undefined, null, false);
  }
  longBeam(-7.05, 6.90, -0.25, 12.3);
  longBeam(7.05, 6.90, -0.25, 12.3);
  longBeam(0, 6.91, -5.98, 14.35, true);
  longBeam(0, 6.91, -0.64, 14.35, true);
  // Thin front corner uprights frame the cutaway without closing its front.
  for (const x of [-7.05, 7.05]) {
    box(rig, steelMaterial, x, 3.46, 5.76, 0.16, 6.92, 0.16);
    box(rig, steelMaterial, x, 0.10, 5.76, 0.44, 0.20, 0.44);
    for (const z of [-5.98, -0.64]) {
      box(ceilingStructure, steelMaterial, x, 6.61, z, 0.52, 0.43, 0.12);
      for (const dx of [-0.16, 0.16]) {
        cylinder(ceilingStructure, edgeMaterial, x + dx, 6.61, z + 0.08, 0.039, 0.025,
          [Math.PI / 2, 0, 0], true, false);
      }
    }
  }
  // Ladder cable trays with segmented cross-ties and insulated cable runs.
  for (const x of [-3.73, 3.73]) {
    for (const dx of [-0.22, 0.22]) {
      box(ceilingServices, steelMaterial, x + dx, 6.60, -1.6, 0.045, 0.16, 8.8);
    }
    for (let z = -5.9; z <= 2.8; z += 0.43) {
      box(ceilingServices, edgeMaterial, x, 6.53, z, 0.46, 0.035, 0.045, undefined, null, false);
    }
    for (const dx of [-0.11, 0, 0.11]) {
      cylinder(ceilingServices, rubberMaterial, x + dx, 6.59, -1.6, 0.024, 8.75, [Math.PI / 2, 0, 0], false, false);
    }
  }
  // Slight cable sag supplies an organic line against the machined structure.
  for (const z of [-1.06, -1.19, -1.31]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6.87, 6.57, z),
      new THREE.Vector3(-3.3, 6.30, z + 0.08),
      new THREE.Vector3(0.1, 6.13, z + 0.13),
      new THREE.Vector3(3.7, 6.33, z + 0.07),
      new THREE.Vector3(6.87, 6.57, z),
    ]);
    mesh(ceilingServices, ownGeometry(new THREE.TubeGeometry(curve, 28, 0.024, 5, false)), rubberMaterial, 0, 0, 0, undefined, false);
  }
  // Deep fixture housings, bright diffusers and protective grille bars.
  for (const x of [-3.73, 3.73]) {
    for (const z of [-3.75, 1.35]) {
      cylinder(ceilingFixtures, edgeMaterial, x, 6.32, z, 0.028, 0.50, undefined, false, false);
      box(ceilingFixtures, steelMaterial, x, 6.04, z, 1.66, 0.20, 0.52);
      box(ceilingFixtures, darkMaterial, x, 5.928, z, 1.52, 0.025, 0.41, undefined, null, false);
      box(ceilingFixtures, x < 0 ? lampMaterial : coolLampMaterial, x, 5.909, z, 1.40, 0.022, 0.32, undefined, null, false);
      for (const dx of [-0.65, -0.325, 0, 0.325, 0.65]) {
        box(ceilingFixtures, steelMaterial, x + dx, 5.889, z, 0.018, 0.018, 0.38, undefined, null, false);
      }
      for (const dz of [-0.18, 0.18]) {
        box(ceilingFixtures, edgeMaterial, x, 5.895, z + dz, 1.49, 0.023, 0.022, undefined, null, false);
      }
    }
  }

  // Every local light now originates at a visible luminaire. A single oblique
  // key supplies the room's meaningful machinery/person shadows; the remaining
  // lower-energy practicals model faces and separate shoulders from the wall.
  const key = light(rig, new THREE.SpotLight(0xffedda, 220, 23, 0.97, 0.72, 2), -3.73, 5.86, 1.35);
  key.name = 'Chamber primary practical shadow light';
  key.target.position.set(0.0, 0.7, -0.75);
  rig.add(key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.018;
  key.shadow.camera.near = 0.35;
  key.shadow.camera.far = 22;
  key.shadow.focus = 0.86;
  const coolFill = light(rig, new THREE.SpotLight(0xd5e2e9, 112, 22, 1.0, 0.9, 2), 3.73, 5.86, 1.35);
  coolFill.name = 'Right worklight soft fill';
  coolFill.target.position.set(0.7, 1.1, -0.8);
  rig.add(coolFill.target);
  const rearFill = light(rig, new THREE.PointLight(0xffd2a4, 76, 15, 2), -3.73, 5.86, -3.75);
  rearFill.name = 'Rear warm worklight rim';
  const rearRim = light(rig, new THREE.PointLight(0xb6d4e4, 44, 15, 2), 3.73, 5.86, -3.75);
  rearRim.name = 'Rear cool worklight rim';
  const faceFills = [];
  for (const side of [-1, 1]) {
    box(rig, steelMaterial, side * 6.98, 3.70, 5.61, 0.20, 0.12, 0.38);
    const fixture = new THREE.Group();
    fixture.name = 'Shielded observation floodlight';
    fixture.position.set(side * 6.87, 3.55, 5.42);
    fixture.lookAt(0, 1.3, -0.7);
    rig.add(fixture);
    box(fixture, steelMaterial, 0, 0, -0.035, 0.48, 0.32, 0.17);
    box(fixture, darkMaterial, 0, 0, 0.057, 0.43, 0.27, 0.025, undefined, null, false);
    box(fixture, coolLampMaterial, 0, 0, 0.075, 0.37, 0.21, 0.017, undefined, null, false);
    for (const y of [-0.13, 0.13]) box(fixture, steelMaterial, 0, y, 0.083, 0.46, 0.025, 0.08);
    for (const x of [-0.20, 0.20]) box(fixture, steelMaterial, x, 0, 0.083, 0.025, 0.27, 0.08);
    const fill = light(fixture, new THREE.SpotLight(0xf0eee4, 52, 21, 0.96, 0.96, 2), 0, 0, 0.11);
    fill.name = 'Neutral number and face fill';
    fill.target.position.set(0, 0, 8);
    fixture.add(fill.target);
    faceFills.push(fill);
  }
  const neutralRim = new THREE.Color(0xb6d4e4);
  const warmRim = new THREE.Color(0xffd2a4);
  const palettes = Object.fromEntries(Object.entries({
    crushing: 0xe3b575, boiler: 0xf5ab6a, flood: 0x8bc8e6, gas: 0xc7ce98,
    rats: 0xd5bf9f, collapse: 0xd6b180, electric: 0x96b7f3, freeze: 0xb5e2f0,
    spikes: 0xeebc90, lasers: 0xe4a2a0,
  }).map(([id, value]) => [id, new THREE.Color(value)]));
  const rimTarget = new THREE.Color();
  const warmTarget = new THREE.Color();

  // Build one InstancedMesh per material/geometry/owner combination. Hundreds
  // of bolts, bars, panels and cable ties therefore cost few draw calls.
  for (const batch of batches.values()) {
    const instanced = new THREE.InstancedMesh(batch.geometry, batch.material, batch.instances.length);
    instanced.name = `${batch.material.name} (${batch.instances.length})`;
    const hasColors = batch.instances.some((entry) => entry.color);
    for (let index = 0; index < batch.instances.length; index++) {
      instanced.setMatrixAt(index, batch.instances[index].matrix);
      if (hasColors) instanced.setColorAt(index, batch.instances[index].color || new THREE.Color(0xffffff));
    }
    instanced.castShadow = batch.cast;
    instanced.receiveShadow = true;
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    instanced.computeBoundingSphere();
    batch.parent.add(instanced);
  }
  batches.clear();

  return {
    room,
    walls,
    ceilingBeams,
    setCeilingVisibility(visible = true) {
      if (disposed) return;
      for (const object of ceilingBeams) object.visible = !!visible;
    },
    update(dt, state = {}) {
      if (disposed) return;
      const delta = Math.min(0.1, Math.max(0, Number.isFinite(dt) ? dt : 0));
      clock += delta;
      const active = state.phase === 'running' || state.phase === 'reveal';
      const progress = Number.isFinite(state.progress) ? THREE.MathUtils.clamp(state.progress, 0, 1) : 0;
      const pulse = active ? Math.pow(Math.max(0, Math.sin(clock * (3.1 + progress * 3.5))), 5) : 0;
      amberMaterial.emissiveIntensity = 1.0 + pulse * (1.2 + progress * 2.8);
      beaconGlow.intensity = 3 + pulse * (4 + progress * 10);
      lampMaterial.emissiveIntensity = 2.05 + Math.sin(clock * 1.7) * 0.018;
      key.intensity = 220 + Math.sin(clock * 1.7) * 0.5;
      coolFill.intensity = 112;
      rearFill.intensity = 76;
      rearRim.intensity = 44 + (active ? progress * 8 : 0);
      doorGlow.intensity = 4;
      const palette = palettes[state.scenarioId] || neutralRim;
      const strength = active ? 0.16 + progress * 0.29 : 0.12;
      rimTarget.copy(neutralRim).lerp(palette, strength);
      warmTarget.copy(warmRim).lerp(palette, strength * 0.62);
      const blend = 1 - Math.exp(-delta * 2.2);
      rearRim.color.lerp(rimTarget, blend);
      rearFill.color.lerp(warmTarget, blend);
      for (const fill of faceFills) fill.intensity = 52;
      for (let index = 0; index < fans.length; index++) {
        fans[index].rotation.z = clock * (index === 0 ? 1.65 : -1.42);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
      for (const object of lights) {
        if (typeof object.dispose === 'function') object.dispose();
        else object.shadow?.map?.dispose();
      }
      for (const geometry of geometries) geometry.dispose();
      for (const mat of materials) mat.dispose();
      for (const texture of textures) texture.dispose();
      geometries.clear();
      materials.clear();
      textures.clear();
    },
  };
}

export default createEnvironment;
