/** Shared, bounded exhaust plume assets. Geometry points along local -Z. */
export function createFlameAssets(THREE, { reducedMotion = false } = {}) {
  // Three intersecting ribbons give the plume volume from common chase and side
  // views without a hard conical surface. The fragment shader shapes the edge.
  const positions = [], uvs = [], indices = [];
  for (let sheet = 0; sheet < 3; sheet++) {
    const angle = sheet * Math.PI / 3, x = Math.cos(angle), y = Math.sin(angle);
    const base = positions.length / 3;
    positions.push(-x, -y, 0, x, y, 0, -x, -y, -1, x, y, -1);
    uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vTint;
      void main() {
        vUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vTint = instanceColor;
        #else
          vTint = vec3(0.1, 0.5, 1.0);
        #endif
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vTint;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      void main() {
        float t = vUv.y;
        float x = vUv.x * 2.0 - 1.0;
        // Slow advected detail changes the outline, not the overall brightness.
        float n = noise(vec2(x * 2.0 + 3.1, t * 6.0 - uTime * 0.65));
        float n2 = noise(vec2(x * 4.0 - 7.0, t * 12.0 - uTime * 0.9));
        // Distinct, slow-moving tongues break up the silhouette on each side.
        float tongues = noise(vec2(x < 0.0 ? 2.3 : 8.7, t * 8.0 - uTime * 0.4));
        float width = (0.23 + 0.72 * sin(3.14159265 * pow(t, 0.8))) * (0.66 + 0.42 * tongues);
        float distanceFromAxis = abs(x + (n - 0.5) * 0.22 * t);
        float edge = 1.0 - smoothstep(width * 0.36, width, distanceFromAxis);
        float endFade = smoothstep(0.0, 0.045, t) * (1.0 - smoothstep(0.68, 1.0, t));
        float body = edge * endFade * (0.58 + 0.42 * n2);
        // Gentle compression cells add structure without rapidly flashing.
        float cells = 0.78 + 0.22 * cos(t * 25.0 - uTime * 0.45);
        float coreWidth = width * (0.27 - 0.12 * t) * cells;
        float core = (1.0 - smoothstep(coreWidth * 0.15, coreWidth, distanceFromAxis))
                   * (1.0 - smoothstep(0.25, 0.72, t)) * endFade * cells;
        float rocket = smoothstep(-0.05, 0.25, vTint.r - vTint.b);
        vec3 root = mix(vec3(0.12, 0.52, 1.0), vec3(0.22, 0.47, 1.0), rocket);
        vec3 fringe = mix(vec3(0.18, 0.58, 1.0), vec3(1.0, 0.22, 0.035), rocket);
        // A faint warm outer edge remains visible on the predominantly blue jet.
        float outer = smoothstep(width * 0.26, width * 0.85, distanceFromAxis);
        fringe = mix(fringe, vec3(1.0, 0.25, 0.035), (1.0 - rocket) * outer * smoothstep(0.15, 0.65, t) * 0.48);
        vec3 color = mix(root, fringe, smoothstep(0.08, 0.72, t));
        color = mix(color, mix(vec3(0.58, 0.83, 1.0), vec3(1.0, 0.82, 0.48), rocket), core * 0.55);
        gl_FragColor = vec4(color, clamp(body * 0.19 + core * 0.07, 0.0, 0.26));
      }
    `
  });
  let disposed = false;
  return {
    geometry, material,
    update(timeSeconds) {
      if (!disposed) material.uniforms.uTime.value = reducedMotion ? 0 :
        (Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0);
    },
    dispose() {
      if (disposed) return;
      disposed = true; geometry.dispose(); material.dispose();
    }
  };
}
