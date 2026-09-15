import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/loaders/GLTFLoader.js";
import { dungeonPath, RIVAL_REGIONS } from "./game-core.mjs";

const gltfLoader = new GLTFLoader();
const modelCache = new Map();
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();
const surfaceTextureCache = new Map();
const isometricSpritePaths = {
  entrance: "./assets/icons/realistic/world-entrance-isometric-v1-runtime.png",
  heart: "./assets/icons/realistic/world-heart-isometric-v1-runtime.png",
  spikes: "./assets/icons/realistic/trap-spikes-v1.png",
  bolts: "./assets/icons/realistic/trap-bolts-isometric-v1-runtime.png",
  flame: "./assets/icons/realistic/trap-furnace-isometric-v1-runtime.png",
  slime: "./assets/icons/realistic/creature-slime-v1.png",
  skeleton: "./assets/icons/realistic/creature-skeleton-v1.png",
  goblin: "./assets/icons/realistic/creature-goblin-v1.png",
  ogre: "./assets/icons/realistic/creature-ogre-v1.png",
  mimic: "./assets/icons/realistic/creature-mimic-v1.png",
  wraith: "./assets/icons/realistic/creature-wraith-v1.png",
  hexer: "./assets/icons/realistic/creature-hexer-v1.png",
  golem: "./assets/icons/realistic/creature-golem-v1.png",
  "hero-fighter": "./assets/icons/realistic/hero-fighter-v1.png"
};
const isometricSpriteHeights = { entrance: 1.76, heart: 1.62, spikes: .94, bolts: 1.08, flame: 1.04, slime: .92, skeleton: 1.12, goblin: 1.02, ogre: 1.35, mimic: 1.06, wraith: 1.16, hexer: 1.14, golem: 1.4, "hero-fighter": 1.16 };
const modelSlug = { flame: "furnace", mimic: "goblin", wraith: "hexer", golem: "ogre" };
const variantTint = { mimic: 0xd79b46, wraith: 0x8e79d8, golem: 0x638f88 };
const modelFit = {
  tile: ["footprint", 1.2], entrance: ["height", 1.45], heart: ["height", 1.05],
  spikes: ["footprint", 1.03], bolts: ["footprint", 1.02], furnace: ["footprint", 1.02],
  slime: ["height", .82], skeleton: ["height", 1.38], goblin: ["height", 1.14],
  hexer: ["height", 1.35], ogre: ["height", 1.72],
  "hero-fighter": ["height", 1.52], "hero-paladin": ["height", 1.52],
  "hero-sorcerer": ["height", 1.52], "hero-warlock": ["height", 1.52],
  "hero-necromancer": ["height", 1.52]
};

function loadModel(id) {
  const slug = modelSlug[id] || id;
  if (!modelCache.has(slug)) {
    modelCache.set(slug, gltfLoader.loadAsync(`./assets/models/${slug}.glb`).then(({ scene }) => scene));
  }
  return modelCache.get(slug);
}

function fittedClone(source, id) {
  const clone = source.clone(true);
  const tint = variantTint[id] ? new THREE.Color(variantTint[id]) : null;
  clone.traverse((object) => {
    if (object.isMesh) {
      object.geometry = object.geometry.clone();
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (tint) materials.forEach((material) => material.color?.lerp(tint, .34));
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  const slug = modelSlug[id] || id;
  const [mode, target] = modelFit[slug] || ["height", 1.2];
  const initialBox = new THREE.Box3().setFromObject(clone);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const measure = mode === "footprint" ? Math.max(initialSize.x, initialSize.z) : initialSize.y;
  clone.scale.setScalar(target / Math.max(measure, .001));
  const box = new THREE.Box3().setFromObject(clone);
  const center = box.getCenter(new THREE.Vector3());
  clone.position.set(-center.x, -box.min.y, -center.z);
  if (slug === "heart" || slug === "slime") clone.userData.pulse = true;
  const wrapper = new THREE.Group();
  wrapper.add(clone);
  return wrapper;
}

function addProductionModel(scene, id, position, onLoaded) {
  let active = true;
  loadModel(id).then((source) => {
    if (!active) return;
    const model = fittedClone(source, id);
    model.position.set(...position);
    scene.add(model);
    onLoaded?.(model);
  }).catch((error) => console.warn(`Keeperfall model fallback: ${id}`, error));
  return () => { active = false; };
}

function loadSpriteTexture(id) {
  const path = isometricSpritePaths[id];
  if (!path) return Promise.reject(new Error(`No isometric sprite for ${id}`));
  if (!textureCache.has(path)) textureCache.set(path, textureLoader.loadAsync(path).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }));
  return textureCache.get(path);
}

function addIsometricSprite(scene, id, position, onLoaded) {
  let active = true;
  loadSpriteTexture(id).then((texture) => {
    if (!active) return;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: .08, depthTest: true, depthWrite: true, toneMapped: false });
    const sprite = new THREE.Sprite(material), height = isometricSpriteHeights[id] || 1.45;
    sprite.center.set(.5, .06); sprite.scale.set(height, height, 1); sprite.position.set(...position); sprite.renderOrder = 2;
    const shadow = mesh(new THREE.CircleGeometry(height * .21, 28), new THREE.MeshBasicMaterial({ color: 0x161914, transparent: true, opacity: .28, depthWrite: false }), [position[0], position[1] + .012, position[2]]);
    shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .55; shadow.renderOrder = 1;
    sprite.userData.shadow = shadow; scene.add(shadow, sprite); onLoaded?.(sprite);
  }).catch((error) => console.warn(`Keeperfall sprite fallback: ${id}`, error));
  return () => { active = false; };
}

function addWorldVisual(scene, id, position, onLoaded) {
  return isometricSpritePaths[id] ? addIsometricSprite(scene, id, position, onLoaded) : addProductionModel(scene, id, position, onLoaded);
}

function loadSurfaceTexture(path, repeat = 1) {
  const key = `${path}:${repeat}`;
  if (!surfaceTextureCache.has(key)) surfaceTextureCache.set(key, textureLoader.loadAsync(path).then((source) => {
    const texture = source.clone(); texture.needsUpdate = true; texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(repeat, repeat);
    texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
    return texture;
  }));
  return surfaceTextureCache.get(key);
}

const palette = {
  stone: 0x30283d, stoneTop: 0x51445e, rock: 0x181321, gold: 0xf0a65c,
  red: 0xff6678, green: 0x72d7aa, blue: 0x75b8ff, violet: 0xb58cff,
  bone: 0xd2c8a9, iron: 0x65706c, leather: 0x5b3924, ember: 0xff6b2c
};

function toon(color, extras = {}) {
  const { metalness, roughness, ...rest } = extras;
  if (metalness !== undefined || roughness !== undefined) return new THREE.MeshStandardMaterial({ color, metalness: metalness ?? 0, roughness: roughness ?? .7, flatShading: true, ...rest });
  return new THREE.MeshToonMaterial({ color, ...rest });
}

function mesh(geometry, material, position = [0, 0, 0]) {
  const value = new THREE.Mesh(geometry, material);
  value.position.set(...position);
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}

function addOutline(target, color = 0x080a09) {
  if (!target.geometry) return;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(target.geometry, 24), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .48 }));
  edges.position.copy(target.position); edges.rotation.copy(target.rotation); edges.scale.copy(target.scale);
  target.parent?.add(edges);
}

function humanoid(kind, color, accent) {
  const g = new THREE.Group();
  const bodyMat = toon(color), accentMat = toon(accent), dark = toon(0x141816);
  const body = mesh(new THREE.CapsuleGeometry(.23, .42, 4, 10), bodyMat, [0, .62, 0]);
  const head = mesh(new THREE.SphereGeometry(.22, 16, 12), accentMat, [0, 1.15, 0]);
  g.add(body, head);
  if (kind === "skeleton") {
    body.scale.set(.62, 1, .62);
    const eyeMat = toon(palette.green, { emissive: palette.green, emissiveIntensity: .8 });
    g.add(mesh(new THREE.SphereGeometry(.025, 8, 6), eyeMat, [-.07, 1.18, .2]), mesh(new THREE.SphereGeometry(.025, 8, 6), eyeMat, [.07, 1.18, .2]));
  }
  if (kind === "goblin") {
    const earGeo = new THREE.ConeGeometry(.11, .35, 8);
    const left = mesh(earGeo, accentMat, [-.23, 1.18, 0]); left.rotation.z = Math.PI / 2;
    const right = mesh(earGeo, accentMat, [.23, 1.18, 0]); right.rotation.z = -Math.PI / 2;
    g.add(left, right);
  }
  if (kind === "hexer") {
    const hood = mesh(new THREE.ConeGeometry(.34, .48, 12), dark, [0, 1.28, 0]);
    const orb = mesh(new THREE.IcosahedronGeometry(.12, 1), toon(palette.violet, { emissive: palette.violet, emissiveIntensity: .9 }), [.38, .78, .18]);
    g.add(hood, orb);
  }
  return g;
}

function buildPiece(id) {
  const g = new THREE.Group();
  const variantBase = { mimic: "goblin", wraith: "hexer", golem: "ogre" }[id];
  if (variantBase) {
    const base = buildPiece(variantBase), tint = new THREE.Color(variantTint[id]);
    base.traverse((object) => { if (object.material?.color) object.material.color.lerp(tint,.42); });
    g.add(base); return g;
  }
  if (id === "spikes") {
    const mat = toon(palette.iron, { metalness: .45, roughness: .55 });
    for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) {
      const spike = mesh(new THREE.ConeGeometry(.1, .52, 8), mat, [x * .27, .29, z * .27]);
      spike.rotation.y = (x + z) * .18; g.add(spike);
    }
  } else if (id === "bolts") {
    const wall = mesh(new THREE.BoxGeometry(.18, .78, 1.05), toon(palette.leather), [-.35, .42, 0]); g.add(wall);
    for (let i = -1; i <= 1; i++) {
      const bolt = mesh(new THREE.CylinderGeometry(.035, .035, .78, 8), toon(palette.iron), [.08, .38 + i * .18, i * .22]);
      bolt.rotation.z = Math.PI / 2; g.add(bolt);
    }
  } else if (id === "flame") {
    const brazier = mesh(new THREE.CylinderGeometry(.34, .24, .2, 12), toon(palette.iron), [0, .15, 0]);
    const flame = mesh(new THREE.ConeGeometry(.24, .8, 10), toon(palette.ember, { emissive: palette.ember, emissiveIntensity: 1.3 }), [0, .62, 0]);
    flame.userData.pulse = true; g.add(brazier, flame);
  } else if (id === "slime") {
    const slime = mesh(new THREE.SphereGeometry(.43, 20, 14), toon(0x54a76b, { transparent: true, opacity: .9 }), [0, .43, 0]);
    slime.scale.y = .72; slime.userData.pulse = true; g.add(slime);
    const eyeMat = toon(0xe9f4d7); g.add(mesh(new THREE.SphereGeometry(.06, 8, 6), eyeMat, [-.14,.52,.36]), mesh(new THREE.SphereGeometry(.06,8,6),eyeMat,[.14,.52,.36]));
  } else if (id === "skeleton") g.add(humanoid("skeleton", palette.bone, palette.bone));
  else if (id === "goblin") g.add(humanoid("goblin", 0x466d44, 0x74945f));
  else if (id === "hexer") g.add(humanoid("hexer", 0x3c294b, 0x807080));
  else if (id === "ogre") {
    const ogre = humanoid("ogre", 0x56634f, 0x73816b); ogre.scale.set(1.45,1.45,1.45); ogre.position.y = -.05; g.add(ogre);
  }
  return g;
}

function createHeart() {
  const g = new THREE.Group();
  const cage = mesh(new THREE.TorusGeometry(.4,.055,8,20), toon(palette.gold,{metalness:.7,roughness:.3}), [0,.6,0]); cage.rotation.x=Math.PI/2;
  const core = mesh(new THREE.DodecahedronGeometry(.3,1), toon(palette.red,{emissive:palette.red,emissiveIntensity:1.3}),[0,.62,0]); core.userData.pulse=true;
  g.add(cage,core); return g;
}

function createEntrance() {
  const g = new THREE.Group(), mat = toon(palette.gold,{metalness:.55,roughness:.4});
  g.add(mesh(new THREE.BoxGeometry(.16,1.05,.16),mat,[-.43,.55,0]),mesh(new THREE.BoxGeometry(.16,1.05,.16),mat,[.43,.55,0]));
  const arch=mesh(new THREE.TorusGeometry(.43,.08,8,20,Math.PI),mat,[0,1.03,0]); arch.rotation.z=Math.PI; g.add(arch); return g;
}

export function mountDungeon3D(container, state, onCellClick) {
  if (!container || !THREE.WebGLRenderer) return () => {};
  const quality = state.settings?.sceneQuality || "balanced", reducedMotion = Boolean(state.settings?.reducedMotion);
  const pixelRatio = quality === "high" ? 1.8 : quality === "low" ? 1 : 1.35;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8e9589);
  scene.fog = new THREE.Fog(0x8e9589, 24, 44);
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 80);
  camera.position.set(10.5, 11.5, 10.5);
  camera.lookAt(0, .15, 0);
  let cameraZoom = 1;
  const renderer = new THREE.WebGLRenderer({ antialias: quality !== "low", alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, pixelRatio));
  renderer.shadowMap.enabled = quality !== "low"; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.domElement.setAttribute("aria-label", "Fixed isometric dungeon construction grid");
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xe8eadb, 0x4d4738, 1.45));
  const key = new THREE.DirectionalLight(0xfff1d2, 2.25);
  key.position.set(7, 12, 8); key.castShadow = quality !== "low";
  key.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
  key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  key.shadow.bias = -.00035; scene.add(key);
  const fill = new THREE.DirectionalLight(0xb8c8c1, .65); fill.position.set(-8, 5, -4); scene.add(fill);

  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xb0b49f, roughness: .98, metalness: 0 });
  const foundation = mesh(new THREE.BoxGeometry(10.8, .45, 10.8), groundMaterial, [0, -.43, 0]);
  foundation.receiveShadow = true; scene.add(foundation);
  const apron = mesh(new THREE.BoxGeometry(12.2, .22, 12.2), new THREE.MeshStandardMaterial({ color: 0x454638, roughness: 1 }), [0, -.72, 0]);
  apron.receiveShadow = true; scene.add(apron);
  const tiles = [], pendingModels = [], pathTileMaterials = [], soilTileMaterials = [];
  const activePath = dungeonPath(state), pathSet = new Set(activePath);
  const entranceCell = activePath[0], heartCell = activePath.at(-1);
  let disposed=false, hoveredTile=null;
  const stoneColors = [0xd0ccc1, 0xc4c4bb, 0xd5cec0, 0xbdbfb7];
  const soilColors = [0x9aa584, 0x8f9c79, 0xa3aa89, 0x899674];
  state.dungeon.cells.forEach((id,index) => {
    const col=index%5,row=Math.floor(index/5),x=(col-2)*1.42,z=(row-2)*1.42;
    const isPath = pathSet.has(index);
    const tileMaterial = new THREE.MeshStandardMaterial({
      color: isPath ? stoneColors[index % stoneColors.length] : soilColors[(index * 3) % soilColors.length],
      roughness: isPath ? .87 : 1,
      metalness: 0
    });
    const tile = mesh(new THREE.BoxGeometry(1.35,isPath ? .17 : .11,1.35),tileMaterial,[x,isPath?-.02:-.09,z]);
    tile.rotation.y = (index % 4) * Math.PI / 2;
    tile.userData.cellIndex=index; tile.userData.baseY=tile.position.y; tile.userData.baseColor=tileMaterial.color.clone(); tiles.push(tile); scene.add(tile);
    (isPath ? pathTileMaterials : soilTileMaterials).push(tileMaterial);
    if (isPath) {
      for (let mark = 0; mark < 3; mark++) {
        const pebble = mesh(
          new THREE.DodecahedronGeometry(.025 + ((index + mark) % 3) * .012, 0),
          new THREE.MeshStandardMaterial({ color: 0x4f514c, roughness: 1 }),
          [x + (((index * 17 + mark * 11) % 9) - 4) * .085, .08, z + (((index * 7 + mark * 5) % 9) - 4) * .085]
        );
        pebble.scale.y = .38; scene.add(pebble);
      }
    } else if ((index + row) % 3 === 0) {
      const rock = mesh(new THREE.DodecahedronGeometry(.11 + (index % 3) * .025, 0), new THREE.MeshStandardMaterial({ color: 0x68695f, roughness: 1 }), [x + .28, .055, z - .2]);
      rock.scale.set(1.25, .58, .88); rock.rotation.y = index * .41; scene.add(rock);
    } else if ((index + col) % 4 === 0) {
      const trunk = mesh(new THREE.CylinderGeometry(.035, .055, .42, 7), new THREE.MeshStandardMaterial({ color: 0x514636, roughness: 1 }), [x + .26, .17, z + .2]);
      trunk.rotation.z = .35; scene.add(trunk);
      for (let branch = 0; branch < 3; branch++) {
        const stem = mesh(new THREE.CylinderGeometry(.012, .018, .28, 6), trunk.material, [x + .22 + branch * .05, .34 + branch * .03, z + .2]);
        stem.rotation.z = -.8 + branch * .72; scene.add(stem);
      }
    }
    if (isPath) {
      const productionId = index===entranceCell ? "entrance" : index===heartCell ? "heart" : id;
      let fallback;
      if(index===entranceCell) fallback=createEntrance(); else if(index===heartCell) fallback=createHeart(); else fallback=buildPiece(id);
      fallback.position.set(x,.07,z); fallback.userData.cellIndex=index; scene.add(fallback);
      if (productionId !== "empty") {
        pendingModels.push(addWorldVisual(scene, productionId, [x, .07, z], (model) => {
          model.traverse((object) => {
            const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
            materials.forEach((material) => {
              if ("roughness" in material) material.roughness = Math.max(material.roughness ?? .5, .48);
              if ("emissiveIntensity" in material) material.emissiveIntensity = Math.min(material.emissiveIntensity ?? 0, .22);
            });
          });
          scene.remove(fallback);
          fallback.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()});
        }));
      }
    }
  });

  loadSurfaceTexture("./assets/textures/ground-neglected-grass-v1.png", 4).then((texture) => { if (!disposed) { groundMaterial.map = texture; groundMaterial.needsUpdate = true; } });
  loadSurfaceTexture("./assets/textures/ground-neglected-grass-v1.png", 1).then((texture) => { if (!disposed) soilTileMaterials.forEach((material) => { material.map = texture; material.needsUpdate = true; }); });
  loadSurfaceTexture("./assets/textures/path-weathered-stone-v1.png", 1).then((texture) => { if (!disposed) pathTileMaterials.forEach((material) => { material.map = texture; material.needsUpdate = true; }); });

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x716d61, roughness: .96, metalness: 0 });
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0x57564f, roughness: .9, metalness: 0 });
  function wallSegment(x, z, horizontal = true, broken = false) {
    const wall = mesh(new THREE.BoxGeometry(horizontal ? 1.36 : .18, broken ? .42 : .68, horizontal ? .18 : 1.36), wallMaterial, [x, broken ? .13 : .26, z]);
    wall.rotation.y = broken ? .015 : 0; scene.add(wall);
    const cap = mesh(new THREE.BoxGeometry(horizontal ? 1.4 : .22, .08, horizontal ? .22 : 1.4), capMaterial, [x, broken ? .36 : .64, z]); scene.add(cap);
  }
  for (let edge = -2; edge <= 2; edge++) {
    wallSegment(edge * 1.42, -3.57, true, edge === 0);
    wallSegment(-3.57, edge * 1.42, false, edge === 1);
  }
  const iron = new THREE.MeshStandardMaterial({ color: 0x424741, roughness: .62, metalness: .5 });
  for (let post = -2; post <= 2; post++) {
    const p = mesh(new THREE.CylinderGeometry(.035, .045, .82, 8), iron, [3.58, .24, post * 1.42]); scene.add(p);
    const rail = mesh(new THREE.BoxGeometry(.04, .04, 1.33), iron, [3.58, .45, post * 1.42]); scene.add(rail);
  }

  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let frame=0;
  function pick(e) {
    const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(tiles,false)[0]?.object || null;
  }
  function move(e) {
    const hit = pick(e);
    if (hoveredTile && hoveredTile !== hit) hoveredTile.material.color.copy(hoveredTile.userData.baseColor);
    hoveredTile = hit && pathSet.has(hit.userData.cellIndex) ? hit : null;
    if (hoveredTile) hoveredTile.material.color.copy(hoveredTile.userData.baseColor).lerp(new THREE.Color(0xc9b98d), .42);
    renderer.domElement.style.cursor = hoveredTile ? "pointer" : "default";
  }
  function up(e){const hit=pick(e);if(hit&&pathSet.has(hit.userData.cellIndex))onCellClick?.(hit.userData.cellIndex)}
  function wheel(e){e.preventDefault();cameraZoom=Math.max(.72,Math.min(1.45,cameraZoom-e.deltaY*.00075));camera.zoom=cameraZoom;camera.updateProjectionMatrix()}
  function resize(){
    const w=container.clientWidth||600,h=container.clientHeight||480,aspect=w/h,viewHeight=9.2;
    renderer.setSize(w,h,false);camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.zoom=cameraZoom;camera.updateProjectionMatrix();
  }
  renderer.domElement.addEventListener("pointermove",move);renderer.domElement.addEventListener("pointerup",up);renderer.domElement.addEventListener("wheel",wheel,{passive:false});
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function animate(t){if(disposed)return;frame=requestAnimationFrame(animate);if(!reducedMotion)scene.traverse(o=>{if(o.userData.pulse){const s=1+Math.sin(t*.003+o.id)*.045;o.scale.setScalar(s);o.rotation.y+=.004}});renderer.render(scene,camera)}requestAnimationFrame(animate);
  return ()=>{disposed=true;pendingModels.forEach(cancel=>cancel());cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener("pointermove",move);renderer.domElement.removeEventListener("pointerup",up);renderer.domElement.removeEventListener("wheel",wheel);scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()});renderer.dispose();container.replaceChildren();};
}

const heroColors = { fighter:0xb74b3f,paladin:0xe4c66d,sorcerer:0x4a82c2,warlock:0x7c3fa1,necromancer:0x3f8a63 };

function createHero(classId, active = false) {
  const g=new THREE.Group(), main=toon(heroColors[classId]||0x888888), skin=toon(0xe8b28d), dark=toon(0x1b2020), gold=toon(palette.gold,{metalness:.55,roughness:.38});
  const body=mesh(new THREE.CapsuleGeometry(.22,.43,5,12),main,[0,.67,0]);
  const head=mesh(new THREE.SphereGeometry(.27,20,16),skin,[0,1.28,0]);
  const hair=mesh(new THREE.SphereGeometry(.285,16,10,0,Math.PI*2,0,Math.PI*.53),classId==="paladin"?toon(0xe9d8a8):toon(0x242625),[0,1.36,0]);
  g.add(body,head,hair);
  const eye=toon(classId==="warlock"?palette.violet:classId==="necromancer"?palette.green:0x9ed9ff,{emissive:classId==="warlock"?palette.violet:classId==="necromancer"?palette.green:0x5a9ccc,emissiveIntensity:.7});
  g.add(mesh(new THREE.SphereGeometry(.025,8,6),eye,[-.08,1.3,.25]),mesh(new THREE.SphereGeometry(.025,8,6),eye,[.08,1.3,.25]));
  if(classId==="fighter"){
    const blade=mesh(new THREE.BoxGeometry(.07,.85,.04),toon(palette.iron,{metalness:.7,roughness:.25}),[.36,.82,.02]);blade.rotation.z=-.32;g.add(blade);
  }else if(classId==="paladin"){
    const shield=mesh(new THREE.CylinderGeometry(.32,.32,.08,8),gold,[-.35,.7,.08]);shield.rotation.x=Math.PI/2;g.add(shield);
  }else if(classId==="sorcerer"){
    const orb=mesh(new THREE.IcosahedronGeometry(.16,1),toon(palette.blue,{emissive:palette.blue,emissiveIntensity:1}),[.38,.88,.05]);orb.userData.pulse=true;g.add(orb);
  }else if(classId==="warlock"){
    const hornGeo=new THREE.ConeGeometry(.07,.32,8);const l=mesh(hornGeo,dark,[-.17,1.54,0]),r=mesh(hornGeo,dark,[.17,1.54,0]);l.rotation.z=.3;r.rotation.z=-.3;g.add(l,r);
  }else if(classId==="necromancer"){
    const staff=mesh(new THREE.CylinderGeometry(.025,.035,1.35,8),toon(0x4c3322),[.38,.75,0]);staff.rotation.z=-.08;const skull=mesh(new THREE.DodecahedronGeometry(.12,0),toon(palette.bone),[.43,1.42,0]);g.add(staff,skull);
  }
  g.userData.active=active;
  return g;
}

export function mountRaid3D(container,state,fx=null){
  if(!container||!state.raid)return()=>{};
  const quality=state.settings?.sceneQuality||"balanced",reducedMotion=Boolean(state.settings?.reducedMotion),pixelRatio=quality==="high"?1.6:quality==="low"?1:1.3,moteCount=quality==="high"?14:quality==="low"?4:8;
  const raid=state.raid,region=RIVAL_REGIONS[raid.regionId]||RIVAL_REGIONS.miredeep,regionColor=new THREE.Color(region.color),scene=new THREE.Scene();
  scene.background=regionColor.clone().lerp(new THREE.Color(0xaaa99a),.72);scene.fog=new THREE.Fog(scene.background,12,25);
  const camera=new THREE.OrthographicCamera(-5,5,3,-3,.1,60),cameraBase=new THREE.Vector3(7.8,8.6,7.8);camera.position.copy(cameraBase);camera.lookAt(0,.35,0);
  const renderer=new THREE.WebGLRenderer({antialias:quality!=="low",powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatio));renderer.shadowMap.enabled=quality!=="low";renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.domElement.setAttribute("aria-label","Fixed isometric automatic battle");container.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xe9eadf,0x494333,2.05));const key=new THREE.DirectionalLight(0xffeed2,3);key.position.set(7,11,8);key.castShadow=quality!=="low";key.shadow.mapSize.set(quality==="high"?1536:1024,quality==="high"?1536:1024);scene.add(key);const rim=new THREE.DirectionalLight(regionColor.clone().lerp(new THREE.Color(0xffffff),.48),.75);rim.position.set(-6,4,-4);scene.add(rim);
  const terrain=mesh(new THREE.BoxGeometry(9.5,.35,6.2),new THREE.MeshStandardMaterial({color:0x556048,roughness:1}),[0,-.32,0]);scene.add(terrain);
  const routeMat=new THREE.MeshStandardMaterial({color:0x74736b,roughness:.92});
  for(let x=-3.6;x<=3.6;x+=1.2){const route=mesh(new THREE.BoxGeometry(1.16,.14,2.55),routeMat,[x,-.07,.15]);scene.add(route);for(let p=0;p<2;p++){const stone=mesh(new THREE.DodecahedronGeometry(.035+(p*.014),0),new THREE.MeshStandardMaterial({color:0x4f524e,roughness:1}),[x-.3+p*.5,.035,-.48+p*.7]);stone.scale.y=.35;scene.add(stone)}}
  const wallMat=new THREE.MeshStandardMaterial({color:0x6b685e,roughness:.96});
  for(let x=-3.6;x<=3.6;x+=1.2){const wall=mesh(new THREE.BoxGeometry(1.14,.48,.16),wallMat,[x,.09,-1.65]);scene.add(wall)}
  const motes=[];for(let i=0;i<moteCount;i++){const mote=mesh(new THREE.SphereGeometry(.014+(i%3)*.006,6,5),new THREE.MeshStandardMaterial({color:regionColor,transparent:true,opacity:.22,roughness:1}),[-4+(i*1.73)%8,.25+(i*.47)%2,-2+(i*2.17)%4]);mote.userData.drift=i*.37;motes.push(mote);scene.add(mote)}
  const partyModels=[],cancelHeroes=[],partyBases=[];
  raid.party.forEach((member,i)=>{
    const position=[-2.35+(i%3)*.88,.05,1.1+Math.floor(i/3)*.82];
    if(i===raid.activeHeroIndex&&member.hp>0)position[2]-=.4;
    partyBases[i]=new THREE.Vector3(...position);
    const modelId=member.kind==="creature"?member.speciesId:`hero-${member.classId}`;
    const fallback=member.kind==="creature"?buildPiece(member.speciesId):createHero(member.classId,i===raid.activeHeroIndex);fallback.position.set(...position);fallback.rotation.y=.72;
    if(member.hp<=0){fallback.rotation.z=Math.PI/2;fallback.position.y=.22;fallback.traverse(o=>{if(o.material)o.material.opacity=.35,o.material.transparent=true})}else if(i===raid.activeHeroIndex){fallback.scale.setScalar(1.12)}
    scene.add(fallback);partyModels.push(fallback);
    cancelHeroes.push(addWorldVisual(scene,modelId,position,model=>{
      if(disposed)return;
      scene.remove(fallback);fallback.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()});
      model.rotation.y=.72;
      if(member.hp<=0){if(model.isSprite)model.material.rotation=Math.PI/2;else model.rotation.z=Math.PI/2;model.position.y=.22;model.traverse(o=>{if(o.material)o.material.opacity=.35,o.material.transparent=true})}else if(i===raid.activeHeroIndex){model.scale.multiplyScalar(1.12)}
      partyModels[i]=model;
    }));
  });
  let enemyModel=null,disposed=false,frame=0;
  const resolvedEncounter=raid.position>=0?raid.encounters[raid.position]?.id:null;
  const enemyId=raid.complete?"heart":raid.enemy?.id||resolvedEncounter||"entrance";
  const fallback=enemyId==="heart"?createHeart():enemyId==="entrance"?createEntrance():buildPiece(enemyId);fallback.position.set(2.05,.05,-.15);fallback.scale.setScalar(["ogre","golem"].includes(raid.enemy?.id)?1.3:1.5);fallback.rotation.y=-.35;scene.add(fallback);enemyModel=fallback;
  const cancelEnemy=addWorldVisual(scene,enemyId,[2.05,.05,-.15],model=>{if(disposed)return;scene.remove(fallback);fallback.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()});enemyModel=model;enemyModel.rotation.y=-.35});
  const burst=new THREE.Group(),burstColor=fx?.action==="guard"?palette.blue:(fx?.healed||fx?.action==="potion")?palette.green:fx?.element?({Fire:0xff704c,Frost:0x75d7ff,Storm:0xb39cff,Earth:0xc5a06c,Light:0xffe58e,Shadow:0xb47bda,Death:0x73d19b,Arcane:0xf08bd5}[fx.element]||palette.violet):palette.gold;
  if(fx){
    const partyFx=fx.action==="guard"||fx.action==="potion"||(fx.healed&&!fx.damage);const burstPosition=partyFx?partyBases[fx.actorIndex||0]:new THREE.Vector3(2.05,.8,-.15);burst.position.copy(burstPosition);burst.position.y+=.55;
    for(let i=0;i<14;i++){const spark=mesh(new THREE.SphereGeometry(.028+(i%3)*.008,6,5),toon(burstColor,{transparent:true,opacity:.95}));const angle=i*Math.PI*2/14;spark.userData.velocity=new THREE.Vector3(Math.cos(angle)*(.45+(i%4)*.1),(i%2?.45:.15)+((i%3)*.12),Math.sin(angle)*(.3+(i%4)*.08));burst.add(spark)}
    scene.add(burst);
  }
  const actionLight=new THREE.PointLight(burstColor,fx?18:0,5,2);actionLight.position.set(1.5,1.4,.2);scene.add(actionLight);
  const started=performance.now(),enemyBase=new THREE.Vector3(2.05,.05,-.15);
  function resize(){const w=container.clientWidth||700,h=container.clientHeight||310,aspect=w/h,viewHeight=6.4;renderer.setSize(w,h,false);camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix()}const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function animate(t){
    if(disposed)return;frame=requestAnimationFrame(animate);const elapsed=t-started;
    camera.position.copy(cameraBase);
    partyModels.forEach((m,i)=>{if(!m)return;m.position.copy(partyBases[i])});if(enemyModel)enemyModel.position.copy(enemyBase);
    if(!reducedMotion){
      motes.forEach((mote,i)=>{mote.position.y+=Math.sin(t*.0012+mote.userData.drift)*.0008;mote.material.opacity=.28+Math.sin(t*.0015+i)*.16});
      partyModels.forEach((m,i)=>{if(!m)return;const base=partyBases[i];if(raid.party[i].hp>0)m.position.y=base.y+Math.sin(t*.002+i)*.025;m.rotation.y=.25+Math.sin(t*.001+i)*.04});
      if(enemyModel){enemyModel.position.y=enemyBase.y+Math.sin(t*.0017+1)*.035;enemyModel.rotation.y=-.35+Math.sin(t*.0012)*.05}
    }
    if(fx&&elapsed<1050&&!reducedMotion){
      const actor=partyModels[fx.actorIndex];
      if(actor&&["attack","spell"].includes(fx.action)){const p=Math.min(1,elapsed/230),back=Math.max(0,Math.min(1,(elapsed-230)/260)),s=Math.sin(Math.min(1,p+back)*Math.PI);actor.position.x+=s*.9;actor.position.z-=s*.38;actor.rotation.z=-s*.12}
      if(actor&&fx.action==="guard"){const p=Math.sin(Math.min(1,elapsed/520)*Math.PI);actor.position.y+=p*.11;actor.rotation.y-=p*.35}
      if(enemyModel&&fx.damage&&elapsed<520){const recoil=Math.sin(Math.min(1,elapsed/430)*Math.PI);enemyModel.position.x+=recoil*.32;enemyModel.rotation.z=-recoil*.13}
      if(fx.enemy&&elapsed>500&&elapsed<980){const p=Math.sin(Math.min(1,(elapsed-500)/420)*Math.PI);if(enemyModel)enemyModel.position.x-=p*.72;const target=partyModels[fx.enemy.targetIndex];if(target){target.position.x-=p*.24;target.rotation.z=p*.16}}
      if(state.settings?.combatShake&&fx.enemy&&elapsed>500&&elapsed<820){const shake=(1-(elapsed-500)/320)*.045;camera.position.x=cameraBase.x+Math.sin(elapsed*.13)*shake;camera.position.y=cameraBase.y+Math.cos(elapsed*.11)*shake}
      const life=Math.max(0,1-elapsed/850);burst.children.forEach((spark,i)=>{spark.position.copy(spark.userData.velocity).multiplyScalar(elapsed*.0015);spark.material.opacity=life; spark.scale.setScalar(.7+elapsed*.002)});actionLight.intensity=18*life;
    }
    if(!reducedMotion)scene.traverse(o=>{if(o.userData.pulse){const s=1+Math.sin(t*.003+o.id)*.04;o.scale.setScalar(s)}});renderer.render(scene,camera)
  }requestAnimationFrame(animate);
  return()=>{disposed=true;cancelEnemy();cancelHeroes.forEach(cancel=>cancel());cancelAnimationFrame(frame);observer.disconnect();scene.traverse(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.()});renderer.dispose();container.replaceChildren()};
}
