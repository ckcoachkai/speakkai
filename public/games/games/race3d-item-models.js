import { GLTFLoader } from '../assets/vendor/GLTFLoader.js';

export const RACE_ITEM_MODELS = Object.freeze(['banana','bomb','boost','shield','repair','freeze','missile','rocket','launch','shockwave']);

/** Original Blender models, flattened to shared instanced primitives. No textures,
 * per-frame clones, or per-entity materials. Failed/late loads leave fallback art. */
export function createRaceItemModels(THREE, { parent, capacity = 60, urls = null } = {}) {
  const group = new THREE.Group(); group.name = 'race3d-authored-items'; parent?.add(group);
  const loader = new GLTFLoader(), templates = new Map(), pools = new Map();
  const resources = { geometry: new Set(), material: new Set(), texture: new Set() };
  const errors = [], time = { value: 0 }, transform = new THREE.Matrix4(), correction = new THREE.Matrix4();
  const partPose = new THREE.Object3D();
  let disposed = false;
  const max = Math.min(96, Math.max(1, capacity));

  function collectMaterial(material) {
    resources.material.add(material);
    for (const value of Object.values(material)) if (value?.isTexture) resources.texture.add(value);
  }
  function releaseScene(scene) {
    scene.traverse(node => { if (node.isMesh) { node.geometry.dispose(); for (const material of Array.isArray(node.material) ? node.material : [node.material]) { for (const value of Object.values(material)) if (value?.isTexture) value.dispose(); material.dispose(); } } });
  }
  function joinedGeometry(parts) {
    const positions = [], normals = [];
    for (const geometry of parts) {
      const raw = geometry.index ? geometry.toNonIndexed() : geometry;
      const p = raw.attributes.position, n = raw.attributes.normal;
      for (let i=0; i<p.count; i++) { positions.push(p.getX(i),p.getY(i),p.getZ(i)); normals.push(n.getX(i),n.getY(i),n.getZ(i)); }
      if (raw !== geometry) raw.dispose(); geometry.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geometry.computeBoundingBox(); geometry.computeBoundingSphere(); resources.geometry.add(geometry); return geometry;
  }
  function animateMaterial(material, part) {
    if (part !== 'tentacle') return;
    material.onBeforeCompile = shader => {
      shader.uniforms.itemClock = time;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float itemClock;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float tailWeight = 1.0 - smoothstep(-1.2, 0.1, position.y);
          transformed.x += sin(itemClock * 4.6 + position.y * 5.3 + position.z * 2.8) * 0.13 * tailWeight;
          transformed.z += cos(itemClock * 3.7 + position.y * 4.7 + position.x * 3.0) * 0.11 * tailWeight;`);
    };
    material.customProgramCacheKey = () => 'speakkai-authored-jelly-tentacles-v1';
  }
  async function load(type) {
    try {
      const url = urls?.[type] || new URL(`../assets/race3d-items/${type}.glb?v=20261025-authored-items1`, import.meta.url).href;
      const gltf = await loader.loadAsync(url);
      if (disposed) { releaseScene(gltf.scene); return; }
      gltf.scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(gltf.scene), size = bounds.getSize(new THREE.Vector3());
      if (!size.toArray().every(Number.isFinite) || Math.max(size.x,size.y,size.z) <= .01) throw new Error('Invalid item bounds');
      const scale = 2.25 / Math.max(size.x,size.y,size.z), center = bounds.getCenter(new THREE.Vector3());
      const anchorOffset = center.clone().multiplyScalar(scale);
      correction.makeScale(scale,scale,scale); correction.setPosition(anchorOffset.clone().negate());
      const bins = new Map();
      gltf.scene.traverse(node => {
        if (!node.isMesh) return;
        resources.geometry.add(node.geometry);
        const sourceMaterial = Array.isArray(node.material) ? node.material[0] : node.material;
        collectMaterial(sourceMaterial);
        const rawPart = node.name.split('__')[1] || node.userData.item_part || 'body';
        const part = rawPart.startsWith('tentacle') ? 'tentacle' : rawPart;
        const key = `${part}:${sourceMaterial.uuid}`;
        if (!bins.has(key)) {
          const material = sourceMaterial.clone(); material.roughness = Math.max(.18,material.roughness || .3);
          // Glow accents retain a lit PBR surface. Transparent bell remains soft.
          if (material.emissiveIntensity > 2) material.emissiveIntensity = 1.65;
          material.depthWrite = !material.transparent; collectMaterial(material); animateMaterial(material,part);
          bins.set(key,{ part, material, geometries:[] });
        }
        const geometry = node.geometry.clone(); transform.multiplyMatrices(correction,node.matrixWorld); geometry.applyMatrix4(transform);
        bins.get(key).geometries.push(geometry);
      });
      const primitives = [...bins.values()].map(bin=>({part:bin.part,material:bin.material,geometry:joinedGeometry(bin.geometries)}));
      templates.set(type,{primitives,bottom:-size.y*scale/2,anchorOffset,triangles:primitives.reduce((n,p)=>n+p.geometry.attributes.position.count/3,0)});
      group.userData.loaded = [...templates.keys()];
    } catch (error) { if (!disposed) errors.push({type,message:String(error.message || error)}); }
  }
  const ready = Promise.all(RACE_ITEM_MODELS.map(load));
  function poolFor(type, role) {
    const template = templates.get(type); if (!template || disposed) return null;
    const key = `${type}:${role}`;
    if (!pools.has(key)) {
      const meshes = template.primitives.map((primitive,i)=>{
        const mesh = new THREE.InstancedMesh(primitive.geometry,primitive.material,max);
        mesh.name = `authored-item-${role}-${type}-${primitive.part}-${i}`; mesh.count=0;
        mesh.userData.itemType=type; mesh.userData.itemPart=primitive.part;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled=false;
        mesh.castShadow=!primitive.material.transparent;mesh.receiveShadow=true;group.add(mesh);return mesh;
      });
      pools.set(key,{meshes,template,count:0});
    }
    return pools.get(key);
  }
  function beginFrame(clock=0) { time.value=clock; for (const pool of pools.values()) { pool.count=0; for(const mesh of pool.meshes)mesh.count=0; } }
  function stamp(type, role, index, pose, {grounded=false, scale=1}={}) {
    const pool=poolFor(type,role); if(!pool || index<0 || index>=max)return false;
    pose.updateMatrix();
    for(let i=0;i<pool.meshes.length;i++) {
      const part=pool.template.primitives[i].part;
      partPose.position.set(0,grounded?-pool.template.bottom:0,0);partPose.rotation.set(0,0,0);partPose.scale.setScalar(scale);
      // Held items use their visual center. Flying effects retain the authored
      // physical origin (bomb shell center / missile fuselage / jelly bell).
      if(!grounded && (role==='projectile'||role==='wave'))partPose.position.copy(pool.template.anchorOffset).multiplyScalar(scale);
      if(type==='missile' && role==='held')partPose.rotation.x=-Math.PI/2;
      if(part==='spark')partPose.scale.multiplyScalar(.84+.20*Math.sin(time.value*37+index*1.7));
      if(part==='orbit')partPose.rotation.y=Math.sin(time.value*1.6+index)*.45;
      if(part==='heart')partPose.scale.multiplyScalar(1+.07*Math.sin(time.value*5.2+index));
      if(part==='bell')partPose.scale.set(1+.035*Math.sin(time.value*4.2+index),1-.025*Math.sin(time.value*4.2+index),1+.035*Math.sin(time.value*4.2+index)).multiplyScalar(scale);
      partPose.updateMatrix();transform.multiplyMatrices(pose.matrix,partPose.matrix);pool.meshes[i].setMatrixAt(index,transform);
    }
    pool.count=Math.max(pool.count,index+1);return true;
  }
  function endFrame() { for(const pool of pools.values())for(const mesh of pool.meshes){mesh.count=pool.count;mesh.instanceMatrix.needsUpdate=true;} }
  function reset() { beginFrame(0);endFrame(); }
  function snapshot() { return {loaded:[...templates.keys()],errors:[...errors],pools:pools.size,drawCalls:[...pools.values()].reduce((n,p)=>n+(p.count?p.meshes.length:0),0),instances:[...pools.values()].reduce((n,p)=>n+p.count,0),capacity:max,textures:resources.texture.size,geometries:resources.geometry.size,materials:resources.material.size,triangles:Object.fromEntries([...templates].map(([type,t])=>[type,t.triangles]))}; }
  function dispose() { if(disposed)return;disposed=true;group.removeFromParent();for(const pool of pools.values())for(const mesh of pool.meshes)mesh.dispose();for(const g of resources.geometry)g.dispose();for(const m of resources.material)m.dispose();for(const t of resources.texture)t.dispose();pools.clear();templates.clear();group.clear(); }
  return {group,ready,beginFrame,stamp,endFrame,reset,dispose,snapshot,isReady:type=>templates.has(type)};
}
