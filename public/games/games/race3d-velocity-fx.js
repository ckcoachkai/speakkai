/** Camera-local, bounded speed optics. Cosmetic only: no physics or audio changes.
 * The central road stays clear; ribbons and broken perspective hoops live at
 * the edge of the view. No camera shake, flashes, post-processing or textures.
 */
export function createVelocityEffects(THREE, { camera, reducedMotion = false } = {}) {
  const group = new THREE.Group(); group.name = 'race3d-velocity-optics';
  const capacity = 96, hoopCapacity = 3, hoopSegments = 48;
  const positions = new Float32Array(capacity * 18);
  const colors = new Float32Array(capacity * 18);
  const hoopPositions = new Float32Array(hoopCapacity * hoopSegments * 6);
  const hoopColors = new Float32Array(hoopCapacity * hoopSegments * 6);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  const hoopGeometry = new THREE.BufferGeometry();
  hoopGeometry.setAttribute('position', new THREE.BufferAttribute(hoopPositions, 3).setUsage(THREE.DynamicDrawUsage));
  hoopGeometry.setAttribute('color', new THREE.BufferAttribute(hoopColors, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
    opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, toneMapped: false });
  const hoopMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true,
    opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ribbons = new THREE.Mesh(geometry, material), hoops = new THREE.LineSegments(hoopGeometry, hoopMaterial);
  ribbons.name = 'velocity-edge-ribbons'; hoops.name = 'velocity-perspective-hoops';
  for (const mesh of [ribbons, hoops]) { mesh.frustumCulled = false; mesh.renderOrder = 20; group.add(mesh); }
  const cool = new THREE.Color('#71ddff'), warm = new THREE.Color('#ffc887'), white = new THREE.Color('#caeaff'), tint = new THREE.Color();
  let disposed = false, intensity = 0, poweredMix = 0, clock = 0, ribbonCount = 0, hoopCount = 0;
  let source = 'idle', qualityId = 'medium';
  const endVertex = [0, 1, 1, 0, 1, 0], sideVertex = [-1, -1, 1, -1, 1, 1];
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function clear() {
    group.visible = false; intensity = 0; poweredMix = 0; ribbonCount = hoopCount = 0;
    geometry.setDrawRange(0, 0); hoopGeometry.setDrawRange(0, 0); source = 'idle';
  }
  clear();
  function update(dt, { car, active = false, quality = 'medium' } = {}) {
    if (disposed) return;
    qualityId = typeof quality === 'string' ? quality : quality?.id || 'medium';
    const speed = Math.max(0, finite(car?.speed));
    if (reducedMotion || !active || !car || car.finished || car.finishHidden || speed < 6) { clear(); return; }
    const step = clamp(finite(dt), 0, .05);
    const powered = finite(car.boost) > 0 || finite(car.nitro?.remaining) > 0 || finite(car.rocketRemaining) > 0;
    const draft = clamp(finite(car.draft, finite(car.drafting)), 0, 1);
    const speedMix = clamp((speed - 22) / 45, 0, 1);
    const target = clamp(speedMix * .42 + draft * .38 + (powered ? .65 : 0), 0, 1);
    const smoothing = 1 - Math.exp(-step / .3);
    intensity += (target - intensity) * smoothing;
    poweredMix += ((powered ? 1 : 0) - poweredMix) * smoothing;
    if (intensity < .008) { group.visible = false; ribbonCount = hoopCount = 0; return; }
    group.visible = true; clock = (clock + step * (.42 + speed / 75 + poweredMix * .65)) % 1000;
    source = powered ? 'nitro' : draft > .15 ? 'slipstream' : 'speed';
    ribbonCount = qualityId === 'low' ? 28 : qualityId === 'high' ? capacity : 60;
    hoopCount = qualityId === 'low' || (!powered && draft < .3) ? 0 : qualityId === 'high' ? 3 : 2;
    // Use the current projection so optics remain peripheral on portrait screens.
    const halfY = Math.tan(clamp(finite(camera?.fov, 60), 25, 100) * Math.PI / 360);
    const halfX = halfY * clamp(finite(camera?.aspect, 1.6), .3, 4);
    tint.copy(white).lerp(cool, draft).lerp(warm, poweredMix);
    material.opacity = intensity * .46; hoopMaterial.opacity = intensity * .16;
    for (let i = 0; i < ribbonCount; i++) {
      const angle = i * 2.3999632297, a = Math.cos(angle), b = Math.sin(angle);
      const phase = (clock + i * .61803398875) % 1;
      const edge = .76 + phase * .5;
      const stretch = .055 + phase * .12 + poweredMix * .075;
      const thickness = .0015 + (i % 3) * .0007;
      const z = 1.4 + (1 - phase) * 3;
      // Fade in/out at recycling boundaries, avoiding a popping or flashing tunnel.
      const fade = Math.sin(phase * Math.PI) * (.35 + (i % 5) * .13);
      for (let j = 0; j < 6; j++) {
        const o = i * 18 + j * 3, r = edge + stretch * endVertex[j], side = thickness * sideVertex[j];
        positions[o] = (a * r - b * side) * halfX * z;
        positions[o+1] = (b * r + a * side) * halfY * z; positions[o+2] = -z;
        colors[o] = tint.r * fade; colors[o+1] = tint.g * fade; colors[o+2] = tint.b * fade;
      }
    }
    geometry.setDrawRange(0, ribbonCount * 6);
    for (let h = 0; h < hoopCount; h++) {
      const phase = (clock * .28 + h / hoopCount) % 1, radius = .8 + phase * .55, z = 3;
      const fade = Math.sin(phase * Math.PI);
      for (let s = 0; s < hoopSegments; s++) {
        // Deliberate gaps make a segmented propulsion field rather than a screen border.
        const start = s / hoopSegments * Math.PI * 2, end = start + Math.PI * 2 / hoopSegments * .62;
        for (let j = 0; j < 2; j++) {
          const a = j ? end : start, o = (h * hoopSegments * 2 + s * 2 + j) * 3;
          hoopPositions[o] = Math.cos(a) * radius * halfX * z;
          hoopPositions[o+1] = Math.sin(a) * radius * halfY * z; hoopPositions[o+2] = -z;
          hoopColors[o] = tint.r * fade; hoopColors[o+1] = tint.g * fade; hoopColors[o+2] = tint.b * fade;
        }
      }
    }
    hoopGeometry.setDrawRange(0, hoopCount * hoopSegments * 2);
    for (const g of [geometry, hoopGeometry]) { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; }
  }
  return { group, update, snapshot: () => ({ active: group.visible, source, intensity, poweredMix, ribbonCount, hoopCount,
    capacity, hoopCapacity, quality: qualityId, reducedMotion: !!reducedMotion, drawCalls: group.visible ? 1 + (hoopCount > 0 ? 1 : 0) : 0, disposed }),
    dispose() { if (disposed) return; disposed = true; clear(); group.removeFromParent(); group.clear(); geometry.dispose(); hoopGeometry.dispose(); material.dispose(); hoopMaterial.dispose(); }
  };
}
