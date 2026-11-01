/** Small terrain-owned basins. Reflections use the scene sky, never mirrored cars. */
export function createRaceWater(THREE, track, { timeOfDay = 'day', reducedMotion = false } = {}) {
  const group = new THREE.Group(); group.name = 'mountain-water';
  const size = 64, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const a = x / size * Math.PI * 2, b = y / size * Math.PI * 2;
    const nx = .18 * Math.cos(a * 3 + b * 2), ny = .12 * Math.sin(b * 4 - a);
    const nz = Math.sqrt(1 - nx * nx - ny * ny), i = (y * size + x) * 4;
    pixels[i] = (nx * .5 + .5) * 255; pixels[i + 1] = (ny * .5 + .5) * 255;
    pixels[i + 2] = (nz * .5 + .5) * 255; pixels[i + 3] = 255;
  }
  const normalMap = new THREE.DataTexture(pixels, size, size);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.magFilter = normalMap.minFilter = THREE.LinearFilter;
  normalMap.repeat.set(2, 2); normalMap.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({ color: 0x327e86, roughness: .3,
    metalness: .4, normalMap, normalScale: new THREE.Vector2(.065, .065),
    transparent: false, envMapIntensity: 1.1 });
  const geometry = new THREE.CircleGeometry(1, 64); geometry.rotateX(-Math.PI / 2);
  const basins = track.waterBasins || [];
  for (const basin of basins) {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = 'alpine-pond';
    mesh.position.set(basin.x, basin.y, basin.z);
    mesh.scale.set(basin.radiusX, 1, basin.radiusZ); mesh.receiveShadow = true;
    group.add(mesh);
  }
  let disposed = false;
  function setMode(mode) {
    timeOfDay = mode === 'night' ? 'night' : 'day';
    material.color.set(timeOfDay === 'night' ? 0x285b70 : 0x327e86);
    material.envMapIntensity = timeOfDay === 'night' ? 1.45 : 1.1;
    material.emissive.set(timeOfDay === 'night' ? 0x06131c : 0x000000);
  }
  setMode(timeOfDay);
  return { group, setMode,
    update(dt) { if (!disposed && !reducedMotion) { normalMap.offset.x = (normalMap.offset.x + Math.min(.1, Math.max(0, dt)) * .009) % 1; normalMap.offset.y = normalMap.offset.x * .47; } },
    snapshot() { return { basins: basins.map(b => ({ ...b })), timeOfDay, reducedMotion, reflection: 'sky environment only', disposed, offset: normalMap.offset.x }; },
    dispose() { if (disposed) return; disposed = true; group.removeFromParent(); group.clear(); geometry.dispose(); material.dispose(); normalMap.dispose(); }
  };
}
