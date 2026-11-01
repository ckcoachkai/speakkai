/** Localized exhaust heat and fleeting sparks. Add group under the race world.
 * Anchors are world-space plume records ({x,y,z,directionX,directionY,directionZ,
 * intensity,type}). One shared instanced mesh and a fixed pool serve all cars.
 */
export function createExhaustWake(THREE, { reducedMotion = false } = {}) {
  const capacity = 160;
  const group = new THREE.Group();
  group.name = 'race3d-exhaust-wake';
  // Three intersecting soft cards keep the subtle heat visible from chase and
  // side cameras, without screen-space distortion or opaque smoke.
  const geometry = new THREE.BufferGeometry();
  const positions = [], uvs = [], indices = [];
  function card(a, b) {
    const start = positions.length / 3;
    for (const [u, v] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      positions.push(a[0]*u+b[0]*v, a[1]*u+b[1]*v, a[2]*u+b[2]*v);
      uvs.push((u+1)/2, (v+1)/2);
    }
    indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  card([1,0,0], [0,1,0]);
  card([1,0,0], [0,0,1]);
  card([0,1,0], [0,0,1]);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `
      varying vec2 vUv; varying vec3 vColor;
      void main() {
        vUv = uv; vColor = instanceColor;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vColor;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float soft = pow(max(0.0, 1.0 - dot(p,p)), 2.5);
        gl_FragColor = vec4(vColor, soft * 0.105);
      }
    `
  });
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.name = 'exhaust-heat-cards';
  mesh.count = 0; mesh.frustumCulled = false; mesh.renderOrder = 5;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh); group.visible = false;
  const particles = Array.from({length: capacity}, () => ({
    x:0,y:0,z:0,dx:0,dy:0,dz:0,age:0,life:0,size:0,speed:0,intensity:0,rocket:false
  }));
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  const axis = new THREE.Vector3(), up = new THREE.Vector3(0,0,1);
  const finite = n => Number.isFinite(n);
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const sources = new Array(16);
  let count = 0, accumulator = 0, cursor = 0, scanStart = 0, randomState = 0x4f92d;
  let qualityId = 'medium', disposed = false;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  const valid = a => a && finite(a.x) && finite(a.y) && finite(a.z) &&
    finite(a.directionX) && finite(a.directionY) && finite(a.directionZ) &&
    a.directionX*a.directionX + a.directionY*a.directionY + a.directionZ*a.directionZ > 0.000001;
  function setFromAnchor(p, a, stationary = false) {
    const length = Math.hypot(a.directionX,a.directionY,a.directionZ);
    p.dx = a.directionX / length; p.dy = a.directionY / length; p.dz = a.directionZ / length;
    const offset = stationary ? .8 : .65 + random() * .35;
    p.x = a.x + p.dx*offset; p.y = a.y + p.dy*offset; p.z = a.z + p.dz*offset;
    p.age = 0; p.life = stationary ? 1 : .35 + random()*.3;
    p.size = stationary ? .18 : .07 + random()*.11;
    p.speed = stationary ? 0 : 1.1 + random()*1.4;
    p.intensity = clamp(finite(a.intensity) ? a.intensity : 1, 0, 1);
    p.rocket = a.type === 'rocket';
  }
  function render() {
    for (let i = 0; i < count; i++) {
      const p = particles[i], t = p.age / p.life;
      axis.set(p.dx,p.dy,p.dz);
      dummy.position.set(p.x + p.dx*p.speed*p.age, p.y + p.dy*p.speed*p.age, p.z + p.dz*p.speed*p.age);
      dummy.quaternion.setFromUnitVectors(up, axis);
      const s = p.size * (1 + t*.55);
      dummy.scale.set(s,s,s * (reducedMotion ? 1.4 : 1.6));
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      // Fade at both ends; no dark particles that could read as smoke.
      const fade = reducedMotion ? .4 : Math.sin(Math.PI * t);
      const light = fade * p.intensity;
      color.setRGB((p.rocket ? .70 : .22)*light, (p.rocket ? .28 : .53)*light, (p.rocket ? .12 : .75)*light);
      mesh.setColorAt(i, color);
    }
    mesh.count = count;
    if (count) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    group.visible = count > 0;
  }
  function reset() {
    count = 0; accumulator = 0; cursor = 0; scanStart = 0; randomState = 0x4f92d;
    sources.fill(null);
    mesh.count = 0; group.visible = false;
  }
  function update(anchors, dt, {active = false, quality = 'medium'} = {}) {
    if (disposed) return;
    qualityId = typeof quality === 'string' ? quality : quality?.id || 'medium';
    const limit = reducedMotion ? 16 : qualityId === 'low' ? 32 : qualityId === 'high' ? 160 : 80;
    if (!active || !Array.isArray(anchors)) { reset(); return; }
    if (reducedMotion) {
      // A fixed, low-intensity glow follows each outlet without flicker or drift.
      count = 0;
      for (let i = 0; i < anchors.length && count < limit; i++) {
        if (valid(anchors[i])) setFromAnchor(particles[count++], anchors[i], true);
      }
      render(); return;
    }
    const step = clamp(finite(dt) ? dt : 0, 0, .05);
    for (let i = count - 1; i >= 0; i--) {
      particles[i].age += step;
      if (particles[i].age >= particles[i].life) {
        const dead = particles[i]; particles[i] = particles[--count]; particles[count] = dead;
      }
    }
    if (count > limit) count = limit;
    // Scan only a bounded number of sources; round-robin avoids favoring the
    // first racer when the pool is close to its quality limit.
    const sourceCount = Math.min(anchors.length, sources.length);
    let validCount = 0;
    for (let i = 0; i < sourceCount; i++) {
      const candidate = anchors[(scanStart + i) % anchors.length];
      if (valid(candidate)) sources[validCount++] = candidate;
    }
    // Advance across the complete list while keeping per-frame work bounded.
    scanStart = anchors.length ? (scanStart + sourceCount) % anchors.length : 0;
    if (validCount) {
      accumulator = Math.min(accumulator + step * validCount * 11, 16);
      while (accumulator >= 1 && count < limit) {
        setFromAnchor(particles[count++], sources[cursor++ % validCount]);
        accumulator -= 1;
      }
      // A saturated pool must not create a burst when slots become free.
      if (count >= limit) accumulator = Math.min(accumulator, 1);
    }
    render();
  }
  return { group, update, reset,
    snapshot: () => ({active: group.visible, particleCount: count, capacity, quality: qualityId,
      reducedMotion: !!reducedMotion, drawCalls: group.visible ? 1 : 0, disposed}),
    dispose() {
      if (disposed) return;
      reset(); disposed = true; group.removeFromParent(); group.clear(); mesh.dispose(); geometry.dispose(); material.dispose();
    }
  };
}
