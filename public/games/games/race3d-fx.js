/**
 * Pooled road-scale visual effects for the Three.js Grand Prix scene.
 *
 * emit({type, position, direction, intensity, color}, {track, cars}) accepts
 * world-space points. If position is omitted, a car/distance plus
 * track.sampleTrack(distance) is used when available. Pools are fixed size;
 * bursts reuse instances and never grow with race duration.
 */
export function createRaceEffects(THREE, { random = Math.random } = {}) {
  const group = new THREE.Group();
  group.name = 'race3d-effects';
  const up = new THREE.Vector3(0, 1, 0);
  const forwardFallback = new THREE.Vector3(0, 0, 1);
  const tempObject = new THREE.Object3D();

  const clip = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(n)) ? Number(n) : min));
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const rand = () => clip(random(), 0, .999999999);
  const vector = (value, fallback = null) => {
    if (value && Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.z))) {
      return new THREE.Vector3(Number(value.x), finite(value.y), Number(value.z));
    }
    return fallback ? fallback.clone() : new THREE.Vector3();
  };

  function pooledMaterial(color, opacity, { roughness = 1, metalness = 0 } = {}) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness, metalness,
      transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
    });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aFxAlpha;\nvarying float vFxAlpha;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFxAlpha = aFxAlpha;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vFxAlpha;')
        .replace('#include <opaque_fragment>', 'diffuseColor.a *= vFxAlpha;\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey = () => `race3d-fx-${color}`;
    return material;
  }

  const shapes = {
    puff: new THREE.SphereGeometry(1, 8, 6),
    spark: new THREE.CylinderGeometry(.016, .009, 1, 5, 1),
    streak: new THREE.CylinderGeometry(.009, .004, 1, 4, 1),
    confetti: new THREE.BoxGeometry(1, .18, .65),
    mark: new THREE.BoxGeometry(1, .012, .15)
  };
  const specs = {
    smoke: { capacity: 84, shape: 'puff', opacity: .34, base: 0x999b9d },
    dust: { capacity: 36, shape: 'puff', opacity: .32, base: 0x9a8065 },
    sparks: { capacity: 48, shape: 'spark', opacity: .9, base: 0xffc064, metalness: .15 },
    speed: { capacity: 28, shape: 'streak', opacity: .22, base: 0xdce7ed },
    celebration: { capacity: 36, shape: 'confetti', opacity: .78, base: 0xf1c66a, metalness: .18 },
    marks: { capacity: 48, shape: 'mark', opacity: .28, base: 0x24272a }
  };
  const pools = {};

  function makePool(name, spec) {
    const geometry = shapes[spec.shape].clone();
    const alpha = new Float32Array(spec.capacity);
    geometry.setAttribute('aFxAlpha', new THREE.InstancedBufferAttribute(alpha, 1));
    const mesh = new THREE.InstancedMesh(geometry, pooledMaterial(spec.base, spec.opacity, spec), spec.capacity);
    mesh.name = `race3d-${name}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.userData.effectsKind = name;
    group.add(mesh);
    for (let i = 0; i < spec.capacity; i++) {
      tempObject.position.set(0, -10000, 0);
      tempObject.scale.setScalar(0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    const particles = Array.from({ length: spec.capacity }, () => ({
      live: false, age: 0, life: 1, position: new THREE.Vector3(), velocity: new THREE.Vector3(),
      direction: new THREE.Vector3(0, 1, 0), color: new THREE.Color(spec.base),
      size: .1, stretch: 1, spin: 0, rotation: new THREE.Vector3(), alpha: 0
    }));
    return { name, spec, mesh, alpha, particles, cursor: 0 };
  }
  for (const [name, spec] of Object.entries(specs)) pools[name] = makePool(name, spec);

  function spawn(name, position, velocity, options = {}) {
    const pool = pools[name];
    if (!pool || !position) return null;
    const index = pool.cursor;
    pool.cursor = (index + 1) % pool.particles.length;
    const particle = pool.particles[index];
    particle.live = true;
    particle.age = 0;
    particle.life = Math.max(.06, finite(options.life, 1));
    particle.position.copy(position);
    particle.velocity.copy(velocity || new THREE.Vector3());
    particle.direction.copy(options.direction || velocity || up).normalize();
    particle.color.set(options.color ?? pool.spec.base);
    particle.size = Math.max(.01, finite(options.size, .1));
    particle.stretch = Math.max(.05, finite(options.stretch, 1));
    particle.spin = finite(options.spin, 0);
    particle.rotation.set(finite(options.rx), finite(options.ry), finite(options.rz));
    particle.gravity = finite(options.gravity, 0);
    particle.drag = clip(options.drag ?? .35, 0, .99);
    particle.grow = finite(options.grow, 0);
    particle.alpha = clip(options.alpha ?? 1, 0, 1);
    return particle;
  }

  function updatePool(pool, dt) {
    const attr = pool.mesh.geometry.getAttribute('aFxAlpha');
    for (let i = 0; i < pool.particles.length; i++) {
      const p = pool.particles[i];
      if (p.live) {
        p.age += dt;
        if (p.age >= p.life) p.live = false;
        else {
          p.velocity.y -= p.gravity * dt;
          p.velocity.multiplyScalar(Math.pow(1 - p.drag, dt));
          p.position.addScaledVector(p.velocity, dt);
          p.rotation.x += p.spin * dt;
          p.rotation.y += p.spin * .61 * dt;
          p.rotation.z += p.spin * .37 * dt;
        }
      }
      if (!p.live) {
        attr.array[i] = 0;
        tempObject.position.set(0, -10000, 0);
        tempObject.scale.setScalar(0);
        tempObject.updateMatrix();
        pool.mesh.setMatrixAt(i, tempObject.matrix);
        continue;
      }

      const t = clip(p.age / p.life, 0, 1);
      const fade = pool.name === 'marks' ? Math.min(1, (1 - t) * 2.7) : (1 - t) * (1 - t * .25);
      attr.array[i] = p.alpha * fade;
      pool.mesh.setColorAt(i, p.color);
      tempObject.position.copy(p.position);
      if (pool.name === 'sparks' || pool.name === 'speed') {
        tempObject.quaternion.setFromUnitVectors(up, p.direction);
        const length = p.size * p.stretch * Math.max(.18, 1 - t * .55);
        tempObject.scale.set(p.size * .12, length, p.size * .12);
      } else if (pool.name === 'marks') {
        tempObject.rotation.set(0, p.rotation.y, 0);
        tempObject.scale.set(p.size * (1 + t * .1), 1, 1);
      } else if (pool.name === 'celebration') {
        tempObject.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
        const scale = p.size * (.86 + Math.sin(Math.PI * t) * .14);
        tempObject.scale.set(scale, scale * .18, scale * .65);
      } else {
        tempObject.rotation.set(0, p.rotation.y, p.rotation.z);
        const scale = p.size * (1 + p.grow * t);
        tempObject.scale.set(scale, scale * .78, scale);
      }
      tempObject.updateMatrix();
      pool.mesh.setMatrixAt(i, tempObject.matrix);
    }
    attr.needsUpdate = true;
    pool.mesh.instanceMatrix.needsUpdate = true;
    if (pool.mesh.instanceColor) pool.mesh.instanceColor.needsUpdate = true;
  }

  function readCar(event, context) {
    if (event?.car && typeof event.car === 'object') return event.car;
    const cars = Array.isArray(context?.cars) ? context.cars : [];
    const id = event?.carId ?? event?.id;
    return cars.find(car => car.id === id) || cars.find(car => car.finished) || null;
  }

  function frameFor(event, context) {
    const car = readCar(event, context);
    const track = context?.track || context;
    const distance = finite(event?.distance, finite(car?.distance, NaN));
    let sample = null;
    if (track && typeof track.sampleTrack === 'function' && Number.isFinite(distance)) {
      try { sample = track.sampleTrack(distance); } catch { sample = null; }
    }
    const point = event?.position || car?.position || sample?.position;
    const position = vector(point, new THREE.Vector3());
    if (!event?.position && !car?.position && sample?.position?.x != null && car) {
      const lateral = finite(car.lateral);
      if (sample.right) position.addScaledVector(vector(sample.right), lateral);
    }
    if (event?.position && event.position.y == null) position.y = finite(sample?.position?.y);
    const tangent = vector(event?.direction || sample?.tangent || car?.direction || forwardFallback, forwardFallback).normalize();
    let right = vector(event?.right || sample?.right);
    if (right.lengthSq() < .001) right.set(tangent.z, 0, -tangent.x).normalize();
    return { position, tangent, right, car };
  }

  function emit(input, context = {}) {
    if (disposed) return;
    const event = typeof input === 'string' ? { type: input } : (input || {});
    const type = String(event.type || event.kind || '').toLowerCase();
    const frame = frameFor(event, context);
    const { position, tangent, right } = frame;
    const intensity = clip(event.intensity ?? 1, .1, 2.2);
    const at = (base, dx = 0, dy = 0, dz = 0) => base.clone().add(new THREE.Vector3(dx, dy, dz));
    const sidePoint = (base, lateral, rear = 0) => base.clone()
      .addScaledVector(right, lateral).addScaledVector(tangent, -rear);

    if (type === 'skid' || type === 'spin' || type === 'tire-smoke') {
      const rear = 1.5;
      for (const side of [-1, 1]) {
        const wheel = sidePoint(position, side * 1.15, rear);
        for (let n = 0, count = Math.round(2 + intensity * 2); n < count; n++) {
          spawn('smoke', at(wheel, 0, .12 + rand() * .08),
            new THREE.Vector3((rand() - .5) * 1.4, .5 + rand() * .8, (rand() - .5) * 1.4),
            { life: .8 + rand() * .6, size: .30 + rand() * .24, grow: 2.7, alpha: .82, drag: .12 });
        }
        wheel.y -= .18;
        spawn('marks', wheel, new THREE.Vector3(), { life: 5.2, size: 1.6 + rand() * .7, stretch: .18,
          alpha: .88, ry: Math.atan2(-tangent.z, tangent.x) });
      }
      return;
    }

    if (type === 'collision') {
      const sparks = Math.round(7 + intensity * 7);
      for (let i = 0; i < sparks; i++) {
        const angle = rand() * Math.PI * 2;
        const upward = .25 + rand() * .85;
        const velocity = new THREE.Vector3(Math.cos(angle) * (1.2 + rand() * 2.2), upward * (1 + intensity),
          Math.sin(angle) * (1.2 + rand() * 2.2));
        spawn('sparks', at(position, (rand() - .5) * .32, .12 + rand() * .36, (rand() - .5) * .32), velocity,
          { life: .16 + rand() * .2, size: .15 + rand() * .13, stretch: 1.8 + rand() * 2.2,
            gravity: 8.5, drag: .18, color: rand() < .68 ? 0xffd27a : 0xf4eee2 });
      }
      for (let i = 0; i < Math.round(3 + intensity * 2); i++) {
        const velocity = new THREE.Vector3((rand() - .5) * .7, .2 + rand() * .45, (rand() - .5) * .7);
        spawn('dust', at(position, (rand() - .5) * .35, .1, (rand() - .5) * .35), velocity,
          { life: .45 + rand() * .3, size: .1 + rand() * .08, grow: 1.6, alpha: .7, drag: .18 });
      }
      return;
    }

    if (type === 'dust' || type === 'recovery') {
      for (let i = 0, count = Math.round(4 + intensity * 4); i < count; i++) {
        const velocity = new THREE.Vector3((rand() - .5) * .8, .2 + rand() * .55, (rand() - .5) * .8);
        spawn('dust', at(position, (rand() - .5) * .6, .08, (rand() - .5) * .6), velocity,
          { life: .5 + rand() * .45, size: .1 + rand() * .12, grow: 1.8, alpha: .72, drag: .15 });
      }
      return;
    }

    if (type === 'speed') {
      const count = Math.round(1 + intensity * 2);
      for (let i = 0; i < count; i++) {
        const offset = (rand() - .5) * .9;
        const start = sidePoint(position, offset, .8 + rand() * .8);
        spawn('speed', at(start, 0, .22 + rand() * .38), tangent.clone().multiplyScalar(2.5 + intensity),
          { life: .12 + rand() * .1, size: .09 + rand() * .05, stretch: 2.2 + rand(), alpha: .8, drag: .08 });
      }
      return;
    }

    if (type === 'celebration' || type === 'finish') {
      const count = Math.round(14 + intensity * 7);
      const colors = [0xe7c36e, 0xe8e8df, 0x9ab9bc, 0xb7a77f];
      for (let i = 0; i < count; i++) {
        const angle = rand() * Math.PI * 2;
        const velocity = new THREE.Vector3(Math.cos(angle) * (.45 + rand() * .9), 1.1 + rand() * 1.5,
          Math.sin(angle) * (.45 + rand() * .9));
        spawn('celebration', at(position, (rand() - .5) * .5, .4 + rand() * .4, (rand() - .5) * .5), velocity,
          { life: 1.2 + rand() * .8, size: .06 + rand() * .045, spin: (rand() - .5) * 8,
            gravity: 2.8, drag: .08, color: colors[Math.floor(rand() * colors.length)], alpha: .92 });
      }
    }
  }

  let disposed = false;
  function update(deltaSeconds) {
    if (disposed) return;
    const dt = clip(deltaSeconds, 0, .05);
    for (const pool of Object.values(pools)) updatePool(pool, dt);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const pool of Object.values(pools)) {
      group.remove(pool.mesh);
      pool.mesh.geometry.dispose();
      pool.mesh.material.dispose();
    }
    for (const geometry of Object.values(shapes)) geometry.dispose();
  }

  return { group, emit, update, dispose };
}

export default createRaceEffects;
