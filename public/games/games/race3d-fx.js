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

  function pooledMaterial(color, opacity, { roughness = 1, metalness = 0, glow = false, shape } = {}) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness, metalness,
      transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
      emissive:glow?color:0x000000,emissiveIntensity:glow?.65:0,blending:glow?THREE.AdditiveBlending:THREE.NormalBlending
    });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aFxAlpha;\nvarying float vFxAlpha;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFxAlpha = aFxAlpha;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vFxAlpha;')
        .replace('#include <opaque_fragment>', 'diffuseColor.a *= vFxAlpha'+(shape==='puff'?' * pow(max(0.0, dot(normal, normalize(vViewPosition))), 1.5)':'')+';\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey = () => `race3d-fx-${color}`;
    return material;
  }

  const shapes = {
    puff: new THREE.SphereGeometry(1, 8, 6),
    spark: new THREE.CylinderGeometry(.016, .009, 1, 5, 1),
    streak: new THREE.CylinderGeometry(.009, .004, 1, 4, 1),
    confetti: new THREE.BoxGeometry(1, .18, .65),
    mark: new THREE.BoxGeometry(1, .008, .24),
    ring: new THREE.RingGeometry(.82,1,32).rotateX(-Math.PI/2),
    shard: new THREE.BoxGeometry(1,.3,.55)
  };
  const specs = {
    fire: {capacity:32,shape:'puff',opacity:.95,base:0xff7825,glow:true},
    blast: {capacity:8,shape:'ring',opacity:.85,base:0xffd494,glow:true},
    debris: {capacity:64,shape:'shard',opacity:1,base:0x586671,metalness:.6},
    smoke: { capacity: 84, shape: 'puff', opacity: .34, base: 0x999b9d },
    dust: { capacity: 36, shape: 'puff', opacity: .32, base: 0x9a8065 },
    sparks: { capacity: 48, shape: 'spark', opacity: .9, base: 0xffc064, metalness: .15 },
    speed: { capacity: 28, shape: 'streak', opacity: .22, base: 0xdce7ed },
    celebration: { capacity: 36, shape: 'confetti', opacity: .78, base: 0xf1c66a, metalness: .18 },
    marks: { capacity: 192, shape: 'mark', opacity: .60, base: 0x171b20 }
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
      size: .1, stretch: 1, spin: 0, rotation: new THREE.Vector3(), alpha: 0,
      orientation: new THREE.Quaternion()
    }));
    return { name, spec, mesh, alpha, particles, cursor: 0 };
  }
  for (const [name, spec] of Object.entries(specs)) pools[name] = makePool(name, spec);
  const emitted = Object.fromEntries(Object.keys(specs).map(name => [name, 0]));
  // Only nearby emitters are retained; this map never grows with laps or resets.
  const tyreHistory = new Map();

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
    if (options.orientation) particle.orientation.copy(options.orientation);
    else particle.orientation.identity();
    emitted[name]++;
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
        tempObject.quaternion.copy(p.orientation);
        tempObject.scale.set(p.size, 1, 1);
      } else if (pool.name === 'celebration'||pool.name==='debris') {
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
    return cars.find(car => car.id === id) || null;
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
    return { position, tangent, right, car, sample };
  }

  const grounded = car => car && !car.finished && finite(car.flightHeight) < .03 &&
    finite(car.rampHeight) < .03 && finite(car.flightRemaining) <= 0 && car.rampState !== 'airborne';

  function tyreBurst(car, track, intensity, length = 1.8, smokeCount = 1) {
    if (!grounded(car) || !track?.sampleTrack) return;
    const heading = finite(car.heading) + (finite(car.spin) > 0 ? finite(car.spinAngle) : 0);
    // Rear axle location projected into course coordinates. Each tyre samples its
    // own road height, so marks follow both uphill gradients and signed banking.
    for (const side of [-1, 1]) {
      const along = -1.35 * Math.cos(heading) - side * .88 * Math.sin(heading);
      const across = finite(car.lateral) - 1.35 * Math.sin(heading) + side * .88 * Math.cos(heading);
      const sample = track.sampleTrack(finite(car.distance) + along - length / 2);
      if (!sample?.position || Math.abs(across) > finite(sample.width, 18) / 2 - .2) continue;
      const tangent = vector(sample.tangent, forwardFallback).normalize();
      const right = vector(sample.right, new THREE.Vector3(1,0,0));
      const wheel = vector(sample.position).addScaledVector(right, across);
      wheel.y += Math.tan(finite(sample.bank)) * across + .052;
      right.y = Math.tan(finite(sample.bank));right.normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();
      const acrossAxis = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const orientation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent, normal, acrossAxis));
      spawn('marks', wheel, null, { life: 9, size: length, alpha: clip(.45 + intensity * .4, .45, .95), orientation });
      // Smoke is attached to the current axle, not the middle of a long deposit.
      const smokeAt = wheel.clone().addScaledVector(tangent, length / 2);smokeAt.y += .15;
      for (let n=0;n<smokeCount;n++) spawn('smoke', smokeAt,
        new THREE.Vector3((rand()-.5)*.8,.65+rand()*.5,(rand()-.5)*.8),
        {life:.8+rand()*.5,size:.20+intensity*.16,grow:2.1,alpha:.52+intensity*.2,drag:.12});
    }
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

    if(type==='explosion'){
      const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const count=reduced?4:context.quality?.id==='low'?8:14;
      spawn('blast',at(position,0,.15),new THREE.Vector3(),{life:reduced?.45:.8,size:1,grow:7,alpha:.8,color:0xffe1a2});
      for(let i=0;i<(reduced?2:5);i++)spawn('fire',at(position,(rand()-.5)*2,.6+rand(),(rand()-.5)*2),new THREE.Vector3((rand()-.5)*2,2+rand()*2,(rand()-.5)*2),{life:.35+rand()*.5,size:.8+rand(),grow:2,color:i?0xff7722:0xffe6a2,drag:.4});
      for(let i=0;i<count;i++){
        const a=rand()*Math.PI*2,v=3+rand()*6;
        spawn('debris',at(position,0,.9),new THREE.Vector3(Math.cos(a)*v,3+rand()*5,Math.sin(a)*v),{life:1.2+rand()*.8,size:.18+rand()*.4,spin:4+rand()*8,gravity:10,drag:.12,color:i%3?0x4e5e69:0xe7a03c});
        spawn('sparks',at(position,0,1),new THREE.Vector3(Math.cos(a)*v*1.5,2+rand()*6,Math.sin(a)*v*1.5),{life:.3+rand()*.5,size:.4,stretch:4,gravity:8,color:0xffdc82});
      }
      for(let i=0;i<(reduced?3:8);i++)spawn('smoke',at(position,(rand()-.5)*3,.8,(rand()-.5)*3),new THREE.Vector3((rand()-.5),1.8+rand(),(rand()-.5)),{life:1.8+rand(),size:.7+rand()*.7,grow:2.8,color:0x353c46,alpha:.9,drag:.1});
      return;
    }

    if (type === 'skid' || type === 'spin' || type === 'tire-smoke') {
      if (frame.car && context.track?.sampleTrack) {
        tyreBurst(frame.car, context.track, intensity, 1.8, 2);
        return;
      }
      // Without a known grounded car, smoke remains safe but a road deposit is
      // not fabricated at an unverified height (e.g. an airborne event).
      const rear = 1.5;
      for (const side of [-1, 1]) {
        const wheel = sidePoint(position, side * 1.15, rear);
        for (let n = 0, count = Math.round(2 + intensity * 2); n < count; n++) {
          spawn('smoke', at(wheel, 0, .12 + rand() * .08),
            new THREE.Vector3((rand() - .5) * 1.4, .5 + rand() * .8, (rand() - .5) * 1.4),
            { life: .8 + rand() * .6, size: .30 + rand() * .24, grow: 2.7, alpha: .82, drag: .12 });
        }
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
  function update(deltaSeconds, context = {}) {
    if (disposed) return;
    const dt = clip(deltaSeconds, 0, .05);
    if (context.active && context.track?.sampleTrack && context.focusCar && dt > 0) {
      const low = context.quality === 'low' || context.quality?.id === 'low';
      const focus = context.focusCar, length = finite(context.track.totalLength, Infinity);
      const distanceTo = car => {const d=Math.abs(finite(car.distance)-finite(focus.distance));return Math.min(d, Number.isFinite(length)?Math.abs(d%length):d, Number.isFinite(length)?length-d%length:d);};
      const nearby = (context.cars || []).filter(car => distanceTo(car)<110)
        .sort((a,b)=>distanceTo(a)-distanceTo(b)).slice(0,low?2:4);
      const kept = new Set(nearby.map(car=>car.id));
      for(const id of tyreHistory.keys()) if(!kept.has(id))tyreHistory.delete(id);
      for(const car of nearby) {
        const intensity = Math.max(finite(car.brake)>.4?finite(car.brake)*.75:0,
          clip((Math.abs(finite(car.slip))-.045)*6,0,1),finite(car.spin)>0?1:0);
        if(!grounded(car)||finite(car.speed)<6||intensity<.12){tyreHistory.delete(car.id);continue;}
        const prior=tyreHistory.get(car.id)||{distance:finite(car.distance),clock:0};prior.clock+=dt;
        const interval=low?.075:.04;
        if(prior.clock>=interval){
          const travel=Math.abs(finite(car.distance)-prior.distance);
          tyreBurst(car,context.track,intensity,clip(travel+.25,1.2,12),intensity>.35?1:0);
          prior.clock=0;prior.distance=finite(car.distance);
        }
        tyreHistory.set(car.id,prior);
      }
    } else tyreHistory.clear();
    for (const pool of Object.values(pools)) updatePool(pool, dt);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    tyreHistory.clear();group.removeFromParent();
    for (const pool of Object.values(pools)) {
      group.remove(pool.mesh);
      pool.mesh.geometry.dispose();
      pool.mesh.material.dispose();
    }
    for (const geometry of Object.values(shapes)) geometry.dispose();
  }

  function reset() {
    if (disposed) return;
    tyreHistory.clear();
    for (const [name, pool] of Object.entries(pools)) {
      pool.cursor = 0;emitted[name] = 0;
      for (const particle of pool.particles) {
        particle.live = false;particle.age = 0;particle.alpha = 0;
      }
      // Upload zero-alpha, zero-scale instances immediately; no render tick or
      // pool replacement is needed when returning to the idle starting grid.
      updatePool(pool, 0);
    }
  }

  function snapshot(){return {disposed,emitters:tyreHistory.size,emitted:{...emitted},pools:Object.fromEntries(Object.entries(pools).map(([name,p])=>[name,{capacity:p.spec.capacity,active:p.particles.filter(p=>p.live).length}]))};}
  return { group, emit, update, snapshot, reset, dispose };
}

export default createRaceEffects;
