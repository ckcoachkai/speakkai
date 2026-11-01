/** World-space wake ribbons for actual drafting pairs. Cosmetic only.
 * One fixed geometry/material serves all pairs; no geometry is allocated in update.
 */
export function createSlipstreamTrails(THREE, { reducedMotion = false } = {}) {
  const group = new THREE.Group();
  group.name = 'race3d-slipstream-trails';
  const maxPairs = 8, maxStreaksPerPair = 8, capacity = maxPairs * maxStreaksPerPair;
  const positions = new Float32Array(capacity * 18);
  const colors = new Float32Array(capacity * 18);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setDrawRange(0, 0);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .8,
    depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'slipstream-world-ribbons'; mesh.frustumCulled = false; mesh.renderOrder = 4;
  group.add(mesh); group.visible = false;
  // Reuse selection records rather than making collections for every frame.
  const pairs = Array.from({ length: maxPairs }, () => ({ follower: null, leader: null, score: 0, gap: 0, draft: 0 }));
  const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  let disposed = false, clock = 0, pairCount = 0, streakCount = 0, qualityId = 'medium';
  const ends = [0, 1, 1, 0, 1, 0], sides = [-1, -1, 1, -1, 1, 1];
  function reset() {
    clock = 0; pairCount = 0; streakCount = 0; group.visible = false;
    geometry.setDrawRange(0, 0);
    for (const p of pairs) { p.follower = null; p.leader = null; p.score = 0; }
  }
  function update(cars, track, dt, { quality = 'medium', active = false } = {}) {
    if (disposed) return;
    qualityId = typeof quality === 'string' ? quality : quality?.id || 'medium';
    if (!active || !Array.isArray(cars) || !track || typeof track.sampleTrack !== 'function') { reset(); return; }
    const pairBudget = reducedMotion ? 2 : qualityId === 'low' ? 3 : qualityId === 'high' ? 8 : 5;
    const slots = reducedMotion || qualityId === 'low' ? 2 : qualityId === 'high' ? 4 : 3;
    pairCount = 0; streakCount = 0;
    if (!reducedMotion) clock = (clock + clamp(finite(dt), 0, .05) * .48) % 1;
    // Match the strongest eligible source using the physics trafficFor rule.
    for (const follower of cars) {
      const draft = clamp(finite(follower?.draft, finite(follower?.drafting)), 0, 1);
      if (!follower || follower.finished || follower.eliminated || follower.finishHidden ||
          finite(follower.itemEffects?.ghost) > 0 || finite(follower.speed) < 6 || draft < .025 ||
          !Number.isFinite(follower.distance)) continue;
      const width = 1.9 * (finite(follower.itemEffects?.draftcollector) > 0 ? 2.8 : 1.65);
      let leader = null, best = 0, gap = 0;
      for (const other of cars) {
        if (!other || other.id === follower.id || other.finished || other.eliminated || other.finishHidden ||
            finite(other.itemEffects?.ghost) > 0 || finite(other.itemEffects?.draftbreaker) > 0 || !Number.isFinite(other.distance)) continue;
        const d = other.distance - follower.distance, side = Math.abs(finite(other.lateral) - finite(follower.lateral));
        if (d <= 4.4 || d >= 65 || side >= width) continue;
        const score = clamp((65 - d) / 48, 0, 1) * (1 - side / width);
        if (score > best) { best = score; leader = other; gap = d; }
      }
      if (!leader || best < .015) continue;
      const priority = draft * best;
      // Keep only the strongest bounded set, in stable input order on ties.
      let at = 0;
      while (at < pairCount && pairs[at].score >= priority) at++;
      if (at >= pairBudget) continue;
      const last = Math.min(pairCount, pairBudget - 1);
      for (let j = last; j > at; j--) Object.assign(pairs[j], pairs[j - 1]);
      const chosen = pairs[at]; chosen.follower = follower; chosen.leader = leader;
      chosen.gap = gap; chosen.draft = draft; chosen.score = priority;
      pairCount = Math.min(pairCount + 1, pairBudget);
    }
    for (let p = 0; p < pairCount; p++) {
      const { follower, leader, gap, draft } = pairs[p];
      // Leave space around both cars. Pairing persists only while an eligible source exists.
      const available = Math.max(.2, gap - 5);
      const length = Math.min(6, available / slots * .7);
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < slots; i++) {
          const phase = reducedMotion ? .5 : (clock + (side > 0 ? .19 : 0)) % 1;
          const progress = (i + phase) / slots;
          const behind = 2.5 + progress * available;
          const a = clamp(behind - length / 2, 2.25, gap - 2.25);
          const b = clamp(behind + length / 2, 2.25, gap - 2.25);
          if (b - a < .1) continue;
          const start = track.sampleTrack(leader.distance - a), endSample = track.sampleTrack(leader.distance - b);
          if (!start?.position || !start?.right || !endSample?.position || !endSample?.right) continue;
          const fade = Math.sin(Math.PI * progress) * (.35 + .65 * Math.sqrt(draft));
          const width = .19 + .11 * draft;
          for (let v = 0; v < 6; v++) {
            const end = ends[v], sample = end ? endSample : start, along = end ? b : a;
            const t = clamp(along / gap, 0, 1);
            const lateral = finite(leader.lateral) * (1 - t) + finite(follower.lateral) * t + side * (1.65 + .45 * t) + sides[v] * width;
            const height = finite(leader.flightHeight) * (1 - t) + finite(follower.flightHeight) * t;
            const o = streakCount * 18 + v * 3;
            positions[o] = finite(sample.position.x) + finite(sample.right.x) * lateral;
            positions[o + 1] = finite(sample.position.y) + Math.tan(finite(sample.bank)) * lateral + .55 + height;
            positions[o + 2] = finite(sample.position.z) + finite(sample.right.z) * lateral;
            // Cyan-white airflow; the dimmer ends keep recycling unobtrusive.
            const light = fade * (v % 3 === 0 ? .75 : 1);
            colors[o] = .34 * light; colors[o + 1] = .88 * light; colors[o + 2] = light;
          }
          streakCount++;
        }
      }
    }
    geometry.setDrawRange(0, streakCount * 6);
    geometry.attributes.position.needsUpdate = true; geometry.attributes.color.needsUpdate = true;
    group.visible = streakCount > 0;
  }
  return { group, update, reset,
    snapshot: () => ({ active: group.visible, pairCount, streakCount, capacity, quality: qualityId,
      reducedMotion: !!reducedMotion, drawCalls: group.visible ? 1 : 0, disposed }),
    dispose() { if (disposed) return; reset(); disposed = true; group.removeFromParent(); group.clear(); geometry.dispose(); material.dispose(); }
  };
}

