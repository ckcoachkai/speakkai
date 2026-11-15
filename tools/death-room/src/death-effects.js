import {createBoilerFarewell} from './boiler-farewell.js';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const MAX_CORPSES = 10;
const MAX_WOUNDS = 160;
const MAX_FACE_PARTICLES = 48;
const MAX_LIVING_SCORCH = .43;
const clamp = THREE.MathUtils.clamp;

/** Visual aftermath only: neither this module nor a visual clone eliminates a player. */
export function createDeathEffects({ scene, actors, room, blood } = {}) {
  if (!scene?.add || !Array.isArray(actors)) throw new TypeError('Death effects require scene and actors.');
  const chamber = room || { halfWidth: 7, halfDepth: 6, height: 7, floorY: 0 };
  const root = new THREE.Group(); root.name = 'death-effects-owned'; scene.add(root);
  const boilerFarewells=new Map();
  const burns = new Map(), prepared = new Map(), bodyByActor = new Map();
  const wounds = [], bodies = [];
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const ownGeometry = g => (geometries.add(g), g);
  const ownMaterial = m => (materials.add(m), m);
  const ownTexture = t => (textures.add(t), t);
  const scratchPosition = new THREE.Vector3(), scratchPosition2 = new THREE.Vector3();
  const scratchQuaternion = new THREE.Quaternion(), scratchQuaternion2 = new THREE.Quaternion();
  const forward = new THREE.Vector3(0, 0, 1);
  const bounds = new THREE.Box3(), center = new THREE.Vector3();
  const raycaster = new THREE.Raycaster(), hits = [];
  const skinA = new THREE.Vector3(), skinB = new THREE.Vector3(), skinC = new THREE.Vector3(), skinNormal = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  let enabled = true, bloodEnabled = true, disposed = false, elapsed = 0, serial = 0;
  let state = { phase: 'preview', progress: 0, victimIds: new Set() };
  let acceptedEvents = 0, ignoredEvents = 0, blockedGuestEvents = 0, ambientCreated = false;
  let floodState = null;
  const gasBursts = new Set(), impaleContacts = new Set(), faceParticles = [];
  const defaultFloodObstacles = [{ id: 'flood-body-0', x: -3.1, z: 1.1, radius: 1.1 }, { id: 'flood-body-1', x: 3.25, z: -1.5, radius: 1.1 }];
  const immune = actor => !actor || actor.invincible || actor.id === 'vip-456';
  const eligible = (actor, givenState = state) => !immune(actor) && (givenState.selectedId != null ? givenState.selectedId === actor.id : givenState.victimIds?.has ? givenState.victimIds.has(actor.id) : actor.isVictim === true);
  const living = actor => !immune(actor) && actor.alive !== false;
  const resolveActor = payload => payload?.actor || actors.find(a => a.id === (payload?.actorId ?? payload?.id));
  const setPoint = (target, value, fallback) => {
    if (Array.isArray(value)) target.set(Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0);
    else if (value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)) target.copy(value);
    else if (fallback) target.copy(fallback);
    else target.set(0, 0, 0);
    return target;
  };

  // Paired punctures with a small irregular bruise. The texture is generated locally.
  const woundSize = 96, woundPixels = new Uint8Array(woundSize * woundSize * 4);
  for (let y = 0; y < woundSize; y++) for (let x = 0; x < woundSize; x++) {
    const nx = (x + 0.5) / woundSize * 2 - 1, ny = (y + 0.5) / woundSize * 2 - 1;
    const radius = Math.hypot(nx * 0.9, ny * 1.18);
    const wobble = Math.sin(nx * 17 + ny * 9) * Math.sin(ny * 21 - nx * 7) * 0.09;
    const bruise = clamp((0.81 - radius + wobble) * 2.5, 0, 1);
    const puncture = Math.max(Math.exp(-((nx - 0.26) ** 2 + ny ** 2 * 1.5) * 82), Math.exp(-((nx + 0.26) ** 2 + ny ** 2 * 1.5) * 82));
    const scratch = Math.exp(-((ny + 0.23 + nx * 0.12) ** 2) * 400) * clamp(1 - Math.abs(nx) * 1.7, 0, 1) * 0.35;
    const p = (y * woundSize + x) * 4;
    woundPixels[p] = Math.round(100 + bruise * 20 - puncture * 77);
    woundPixels[p + 1] = Math.round(18 + bruise * 5 - puncture * 17);
    woundPixels[p + 2] = Math.round(23 + bruise * 4 - puncture * 17);
    woundPixels[p + 3] = Math.round(clamp(bruise * 0.48 + puncture * 0.75 + scratch, 0, 0.98) * 255);
  }
  const woundTexture = ownTexture(new THREE.DataTexture(woundPixels, woundSize, woundSize));
  woundTexture.colorSpace = THREE.SRGBColorSpace; woundTexture.needsUpdate = true;
  const woundGeometry = ownGeometry(new THREE.PlaneGeometry(1, 1));
  const woundMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: woundTexture, color: 0xffffff, roughness: 0.79, transparent: true, opacity: 0.94, alphaTest: 0.035, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
  const streakPixels = new Uint8Array(64 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) {
    const nx = (x + .5) / 64 * 2 - 1, t = (y + .5) / 128;
    const bend = Math.sin(t * 12) * .08, width = .14 + Math.pow(t, 2) * .23;
    const rivulet = clamp((width - Math.abs(nx - bend)) * 14, 0, 1) * clamp((1 - t) * 20, 0, 1);
    const droplet = Math.exp(-((nx - bend) ** 2 * 28 + (t - .12) ** 2 * 260));
    const p = (y * 64 + x) * 4; streakPixels[p] = 90 + Math.round(t * 32); streakPixels[p + 1] = 3; streakPixels[p + 2] = 10; streakPixels[p + 3] = Math.round(clamp(rivulet + droplet * .75, 0, .98) * 255);
  }
  const streakTexture = ownTexture(new THREE.DataTexture(streakPixels, 64, 128)); streakTexture.colorSpace = THREE.SRGBColorSpace; streakTexture.needsUpdate = true;
  const streakMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: streakTexture, color: 0xffffff, roughness: .33, transparent: true, opacity: .96, alphaTest: .035, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
  const faceBurstMesh = new THREE.InstancedMesh(ownGeometry(new THREE.IcosahedronGeometry(1, 1)), ownMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .42 })), MAX_FACE_PARTICLES);
  faceBurstMesh.name = 'bounded-fatal-face-burst'; faceBurstMesh.count = 0; faceBurstMesh.frustumCulled = false; faceBurstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(faceBurstMesh);
  const particleTransform = new THREE.Object3D(), particleColor = new THREE.Color();
  const eyeMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0x101616, depthTest: true }));
  const rippleGeometry = ownGeometry(new THREE.RingGeometry(0.91, 1, 48));
  const rippleMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xb7d6cc, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  const ripples = new THREE.InstancedMesh(rippleGeometry, rippleMaterial, MAX_CORPSES * 2);
  ripples.name = 'aftermath-passive-wakes'; ripples.instanceMatrix.setUsage(THREE.DynamicDrawUsage); ripples.frustumCulled = false; ripples.count = 0; root.add(ripples);
  const rippleTransform = new THREE.Object3D();

  function patchBurnMaterial(material, amount, injury, skin, face = false, delicate = false) {
    if (!material?.isMaterial) return;
    const originalCompile = material.onBeforeCompile;
    const originalKey = material.customProgramCacheKey?.bind(material);
    material.onBeforeCompile = function(shader, renderer) {
      originalCompile?.call(this, shader, renderer);
      shader.uniforms.deathBurnAmount = amount;
      shader.uniforms.deathBruiseAmount = injury.bruise;
      shader.uniforms.deathSweatAmount = injury.sweat;
      shader.uniforms.deathWetAmount = injury.wet;
      shader.uniforms.deathColdAmount = injury.cold;
      shader.uniforms.deathPoisonAmount = injury.poison;
      shader.vertexShader = 'varying vec3 vDeathRest;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvDeathRest = position;');
      shader.fragmentShader = `uniform float deathBurnAmount;
uniform float deathBruiseAmount;
uniform float deathSweatAmount;
uniform float deathWetAmount;
uniform float deathColdAmount;
uniform float deathPoisonAmount;
varying vec3 vDeathRest;
float deathHash(vec3 p){p=fract(p*.3183099+vec3(.13,.37,.71));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float deathNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(deathHash(i),deathHash(i+vec3(1,0,0)),f.x),mix(deathHash(i+vec3(0,1,0)),deathHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(deathHash(i+vec3(0,0,1)),deathHash(i+vec3(1,0,1)),f.x),mix(deathHash(i+vec3(0,1,1)),deathHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec3 deathP=vDeathRest*14.5;
float deathN=pow(.62*deathNoise(deathP)+.27*deathNoise(deathP*2.13)+.11*deathNoise(deathP*4.7),.69);
float injuryPatch=smoothstep(.42,.72,deathNoise(vDeathRest*8.1+vec3(5.2,1.4,8.7)));
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.43,.20,.34),injuryPatch*deathBruiseAmount*${skin ? '0.62' : '0.16'});
float gasFlush=smoothstep(.035,.48,deathPoisonAmount);
float gasBlue=smoothstep(.48,.96,deathPoisonAmount);
float gasFaceLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
vec3 gasFaceTint=mix(diffuseColor.rgb*vec3(1.38,.34,.26),gasFaceLuma*vec3(.38,.67,1.28),gasBlue);
diffuseColor.rgb=mix(diffuseColor.rgb,gasFaceTint,gasFlush*${face ? '.78' : '0.'});
float frostNoise=.65*deathNoise(vDeathRest*18.7+vec3(3.1,7.4,1.8))+.35*deathNoise(vDeathRest*39.3);
float frostGrain=deathNoise(vDeathRest*347.);
float frostBranches=pow(1.-abs(sin(vDeathRest.x*181.+frostNoise*14.2)*sin(vDeathRest.y*253.+vDeathRest.z*197.)),12.);
float frostCoverage=smoothstep(.98-deathColdAmount*.95,1.14-deathColdAmount*.95,.65*frostNoise+.25*frostGrain+.10*frostBranches)*smoothstep(.03,.18,deathColdAmount);
float frostCrackle=1.-smoothstep(.035,.09,abs(frostNoise-.5));
vec3 frostColor=mix(vec3(.64,.79,.86),vec3(.94,.98,1.),.38+.48*frostGrain+.14*frostCrackle);
diffuseColor.rgb=mix(diffuseColor.rgb,frostColor,frostCoverage*${delicate ? '.035' : face ? '.18' : '.94'});
diffuseColor.rgb*=1.-deathWetAmount*.16;
float deathThreshold=.835-deathBurnAmount*.36-smoothstep(.43,1.,deathBurnAmount)*.46;
float deathMask=smoothstep(deathThreshold-.075,deathThreshold+.075,deathN)*smoothstep(.01,.12,deathBurnAmount);
float deathEdge=smoothstep(deathThreshold-.15,deathThreshold-.025,deathN)*(1.-deathMask)*deathBurnAmount;
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.08,.76,.65),deathBurnAmount*.38*(1.-deathMask));
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.25,.15,.075),deathEdge*.85);
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.006,.008,.009)*(0.68+deathN*.7),deathMask);
`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .27, max(deathSweatAmount * ' + (skin ? '.62' : '.12') + ', deathWetAmount * .72));\nroughnessFactor = mix(roughnessFactor, .98, deathMask);\nroughnessFactor = mix(roughnessFactor, .81 + frostGrain * .18, frostCoverage);');
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(normal + vec3(dFdx(frostGrain), dFdy(frostGrain), 0.) * frostCoverage * .10);');
    };
    material.customProgramCacheKey = () => `${originalKey?.() || ''}|death-injury-v6-${delicate ? 'delicate' : face ? 'face' : skin ? 'skin' : 'cloth'}`;
    material.userData.deathInjurySurface = { skin, face, delicate };
    material.needsUpdate = true;
  }

  function burnActor(actor) {
    let record = burns.get(actor.id);
    if (record?.actor === actor) return record;
    if (record) releaseBurn(record);
    const uniform = { value: 0 }, replacements = [], cloned = new Map();
    const injury = Object.fromEntries(['bruise', 'sweat', 'wet', 'cold', 'poison'].map(key => [key, { value: 0 }]));
    actor.root.traverse(object => {
      if (!object.isMesh || !object.material || /shadow/i.test(object.name) || object === actor._shadow) return;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const next = originals.map(original => {
        const skin = /skin|head|face|hand|body/i.test(`${original.name} ${object.name}`) && !/cloth|uniform|hair|eye|shoe|track|pant/i.test(`${original.name} ${object.name}`);
        const face = /head|face/i.test(`${original.name} ${object.name}`) && !/hair|eye|tear/i.test(`${original.name} ${object.name}`);
        const delicate = /eye|iris|cornea|lash|teeth|tongue/i.test(`${original.name} ${object.name}`);
        const regionKey = `${original.uuid}:${delicate ? 'delicate' : face ? 'face' : skin ? 'skin' : 'cloth'}`;
        if (!cloned.has(regionKey)) {
          const copy = original.clone(); copy.onBeforeCompile = original.onBeforeCompile;
          copy.customProgramCacheKey = original.customProgramCacheKey;
          patchBurnMaterial(copy, uniform, injury, skin, face, delicate); cloned.set(regionKey, copy);
        }
        return cloned.get(regionKey);
      });
      const replacement = Array.isArray(object.material) ? next : next[0];
      replacements.push({ object, original: object.material, replacement }); object.material = replacement;
    });
    record = { actor, uniform, injury, injuryTargets: { bruise: 0, sweat: 0, wet: 0, cold: 0, poison: 0 }, faceMarks: new Set(), stage: 'healthy', ratio: 1, replacements, owned: [...cloned.values()], amount: 0, target: 0, strikes: 0, lastStrike: -100, lastWound: -100, woundStage: 0, finalized: false };
    burns.set(actor.id, record); return record;
  }
  function releaseBurn(record) {
    for (const entry of record.replacements) if (entry.object.material === entry.replacement) entry.object.material = entry.original;
    for (const material of record.owned) material.dispose();
    record.replacements.length = 0; record.owned.length = 0;
  }
  function patchCloneInjuries(actor, clone, type) {
    const source = burns.get(actor.id); if (!source) return;
    const amount = { value: type === 'electric-strike' ? 1 : source.amount };
    const injury = Object.fromEntries(Object.keys(source.injury).map(key => [key, { value: type === 'frozen' && key === 'cold' ? 1 : source.injury[key].value }]));
    const seen = new Set();
    clone.root.traverse(object => {
      for (const material of object.material ? Array.isArray(object.material) ? object.material : [object.material] : []) {
        if (seen.has(material)) continue; seen.add(material);
        const region = material.userData.deathInjurySurface;
        if (region) patchBurnMaterial(material, amount, injury, region.skin, region.face, region.delicate);
      }
    });
  }

  // Non-graphic contact cues: one pooled draw call, no lights or texture downloads.
  const cueLimit = 96, cuePool = Array.from({length: cueLimit}, () => ({life:0, duration:1, p:new THREE.Vector3(), v:new THREE.Vector3(), color:new THREE.Color(), size:.03, gravity:0}));
  const cueGeometry = ownGeometry(new THREE.OctahedronGeometry(1,0));
  const cueMaterial = ownMaterial(new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false}));
  const cueMesh = new THREE.InstancedMesh(cueGeometry,cueMaterial,cueLimit);
  cueMesh.name='non-graphic-contact-cues';cueMesh.count=0;cueMesh.frustumCulled=false;root.add(cueMesh);
  const cueDummy=new THREE.Object3D(), cueLast=new Map();let cuesCreated=0;
  const reducedMotion = typeof matchMedia==='function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  function addContactCue(actor, kind='impact', payload={}) {
    if(!enabled||!bloodEnabled||disposed||!living(actor)||reducedMotion?.matches)return;
    const category = /cold|freeze|frost/.test(kind)?'frost':/electric|laser/.test(kind)?'spark':/water|drown/.test(kind)?'water':/heat|fire/.test(kind)?'heat':/gas|poison/.test(kind)?'gas':'dust';
    const key=actor.id+':'+category;if(elapsed-(cueLast.get(key)??-99)<.55)return;cueLast.set(key,elapsed);
    const palette={frost:0xaeeaff,spark:0xffe49a,water:0x77c9ef,heat:0xffb16a,gas:0xb5ccb0,dust:0xd8c6a1};
    setPoint(scratchPosition,payload.position,actor.position);if(!payload.position)scratchPosition.y+=1.15;
    let count=0;for(const c of cuePool){if(c.life>0)continue;const angle=count*2.399963+elapsed;c.duration=c.life=category==='gas'?.8:.55;c.p.copy(scratchPosition);c.v.set(Math.cos(angle)*.65,.3+(count%3)*.14,Math.sin(angle)*.65);c.gravity=category==='spark'?-2.8:category==='gas'?.25:-.6;c.size=category==='spark'?.028:.04;c.color.setHex(palette[category]);count++;cuesCreated++;if(count===6)break;}
  }
  function updateContactCues(dt){let count=0;for(const c of cuePool){if(c.life<=0)continue;c.life=Math.max(0,c.life-dt);if(!c.life)continue;c.v.y+=c.gravity*dt;c.p.addScaledVector(c.v,dt);cueDummy.position.copy(c.p);cueDummy.rotation.set(c.life*2,c.life*3,0);cueDummy.scale.setScalar(c.size*Math.min(1,c.life/.18));cueDummy.updateMatrix();cueMesh.setMatrixAt(count,cueDummy.matrix);cueMesh.setColorAt(count,c.color);count++;}cueMesh.count=count;cueMesh.visible=enabled&&bloodEnabled&&!reducedMotion?.matches;if(count){cueMesh.instanceMatrix.needsUpdate=true;cueMesh.instanceColor.needsUpdate=true;}}

  function applyInjury(actor, info = {}) {
    if (disposed || !living(actor)) return { accepted: false };
    const record = burnActor(actor), kind = info.kind || actor.health?.lastKind || 'impact';
    addContactCue(actor,kind,info);
    const ratio = clamp(Number.isFinite(info.ratio) ? info.ratio : actor.health?.ratio ?? 1, 0, 1);
    const severity = 1 - ratio, intensity = clamp(info.intensity ?? severity, 0, 1);
    const stage = info.stage || actor.health?.stage || (ratio < .28 ? 'critical' : ratio < .6 ? 'wounded' : ratio < .94 ? 'hurt' : 'healthy');
    record.ratio = ratio; record.stage = stage;
    const target = record.injuryTargets;
    target.sweat = Math.max(target.sweat, severity * .82 + intensity * .08);
    if (['bite', 'impact', 'crush', 'laser', 'bruise'].includes(kind) || ['bite', 'impact', 'bruise'].includes(info.type)) target.bruise = Math.max(target.bruise, .08 + severity * .86);
    if (kind === 'heat' || kind === 'electric') record.target = Math.max(record.target, Math.min(MAX_LIVING_SCORCH, .035 + severity * .43));
    if (kind === 'water') target.wet = Math.max(target.wet, .18 + severity * .82);
    if (kind === 'cold') target.cold = Math.max(target.cold, .08 + severity * .92);
    if (kind === 'poison') { target.poison = Math.max(target.poison, .06 + severity * .94); addFaceBleeding(actor, record, severity); }
    const rank = { healthy: 0, hurt: 1, wounded: 2, critical: 3, dead: 4 }[stage] ?? 0;
    // Native contacts own their wound and blood forwarding. Stage callbacks never emit blood.
    if (rank > record.woundStage && rank > 1 && !['bite', 'impact'].includes(info.type) && ['impact', 'crush', 'laser'].includes(kind) && elapsed - record.lastWound > .6) {
      addWound(actor, { ...info, intensity: .28 + severity * .55 }); record.lastWound = elapsed;
    }
    record.woundStage = Math.max(record.woundStage, rank);
    return { accepted: true, stage, ratio };
  }
  function addFaceBleeding(actor, record, severity) {
    const head = actor.headAnchor; if (!head) return;
    const eyes = head.userData.eyes || [[-.035,.035,.112],[.035,.035,.112]];
    const eyeY = (eyes[0][1] + eyes[1][1]) * .5, z = (eyes[0][2] + eyes[1][2]) * .5;
    const marks = [
      { key: 'nose-left', threshold: .28, x: -.012, y: eyeY - .040, z: z + .022, size: .042, width: .016 },
      { key: 'nose-right', threshold: .28, x: .012, y: eyeY - .039, z: z + .022, size: .040, width: .014 },
      { key: 'eye-left', threshold: .5, x: eyes[0][0], y: eyeY - .03, z, size: .065, width: .016 },
      { key: 'eye-right', threshold: .5, x: eyes[1][0], y: eyeY - .028, z, size: .061, width: .016 },
      { key: 'mouth-left', threshold: .72, x: -.024, y: eyeY - .10, z: z + .003, size: .06, width: .026 },
      { key: 'mouth-right', threshold: .72, x: .023, y: eyeY - .095, z: z + .003, size: .052, width: .022 },
    ];
    head.updateWorldMatrix(true, false); head.getWorldQuaternion(scratchQuaternion);
    const direction = forward.clone().applyQuaternion(scratchQuaternion);
    for (const mark of marks) {
      if (severity < mark.threshold || record.faceMarks.has(mark.key)) continue;
      const position = head.localToWorld(new THREE.Vector3(mark.x, mark.y, mark.z));
      const wound = addWound(actor, { facial: true, markKey: mark.key, position, direction, markSize: mark.size, markWidth: mark.width, intensity: severity });
      if (wound) record.faceMarks.add(mark.key);
    }
  }
  function burstFace(actor) {
    if (!enabled || !bloodEnabled || immune(actor) || gasBursts.has(actor.id)) return false;
    gasBursts.add(actor.id);
    const anchor = actor.headAnchor || actor.root; anchor.updateWorldMatrix(true, false); anchor.getWorldQuaternion(scratchQuaternion);
    const origin = anchor.localToWorld(new THREE.Vector3(0, -.015, .15)), direction = forward.clone().applyQuaternion(scratchQuaternion);
    const right = new THREE.Vector3(1,0,0).applyQuaternion(scratchQuaternion), up = new THREE.Vector3(0,1,0).applyQuaternion(scratchQuaternion);
    for (let i = 0; i < MAX_FACE_PARTICLES; i++) {
      const seed = i * 2.399963 + serial * .71, side = Math.sin(seed), rise = Math.cos(seed * 1.73), speed = .62 + (i % 9) * .13;
      const velocity = direction.clone().multiplyScalar(speed).addScaledVector(right, side * .76).addScaledVector(up, rise * .68 + .18);
      faceParticles.push({ position: origin.clone().addScaledVector(right, side * .025), velocity, age: 0, life: .58 + (i % 8) * .085, size: i % 7 === 0 ? .016 : .0045 + (i % 4) * .0015, flesh: i % 7 === 0, spin: seed });
    }
    if (faceParticles.length > MAX_FACE_PARTICLES) faceParticles.splice(0, faceParticles.length - MAX_FACE_PARTICLES);
    blood?.emit?.('impact', { actor, actorId: actor.id, position: origin.toArray(), direction: direction.toArray(), intensity: 1.4, stage: 'dead', ratio: 0, selected: true, fatal: true, invincible: false });
    return true;
  }
  function anchorFor(actor, worldPoint) {
    const head = actor.headAnchor, chest = actor.chestAnchor;
    if (head && worldPoint) {
      head.getWorldPosition(scratchPosition2);
      if (Math.abs(worldPoint.y - scratchPosition2.y) < 0.28) return head;
    }
    return chest || head || actor.root;
  }
  function trackAnchor(item) {
    if (item.surface) {
      const { mesh, indices, bary, sign } = item.surface;
      mesh.updateWorldMatrix(true, false); mesh.skeleton?.update();
      mesh.getVertexPosition(indices[0], skinA); mesh.getVertexPosition(indices[1], skinB); mesh.getVertexPosition(indices[2], skinC);
      item.mesh.position.copy(skinA).multiplyScalar(bary.x).addScaledVector(skinB, bary.y).addScaledVector(skinC, bary.z).applyMatrix4(mesh.matrixWorld);
      skinB.sub(skinA); skinC.sub(skinA); skinNormal.crossVectors(skinB, skinC).normalize().multiplyScalar(sign);
      normalMatrix.getNormalMatrix(mesh.matrixWorld); skinNormal.applyNormalMatrix(normalMatrix);
      item.mesh.position.addScaledVector(skinNormal, 0.0045); item.mesh.quaternion.setFromUnitVectors(forward, skinNormal); return;
    }
    if (!item.anchor) return;
    item.anchor.updateWorldMatrix(true, false);
    item.mesh.position.copy(item.localPosition).applyMatrix4(item.anchor.matrixWorld);
    item.anchor.getWorldQuaternion(scratchQuaternion);
    item.mesh.quaternion.copy(scratchQuaternion).multiply(item.localQuaternion);
  }
  function addWound(actor, payload, copyFrom = null, body = null) {
    const facial = copyFrom?.facial || payload.facial === true;
    if (wounds.length >= MAX_WOUNDS) {
      const old = wounds.shift(); old.mesh.removeFromParent();
    }
    const perActor = wounds.filter(w => w.actor === actor && !w.body && !w.facial);
    if (!body && !facial && perActor.length >= 7) { const old = perActor[0]; old.mesh.removeFromParent(); wounds.splice(wounds.indexOf(old), 1); }
    const mesh = new THREE.Mesh(woundGeometry, facial ? streakMaterial : woundMaterial); mesh.name = facial ? 'attached-facial-blood-streak' : 'small-bite-wound'; mesh.renderOrder = 3; root.add(mesh);
    actor.root.updateWorldMatrix(true, true);
    setPoint(scratchPosition, payload.position, actor.position || actor.root.position);
    if (!payload.position) scratchPosition.y += 1.15;
    const anchor = body ? (copyFrom?.head ? body.clone.headAnchor : body.clone.chestAnchor) || body.clone.root : anchorFor(actor, scratchPosition);
    const localPosition = new THREE.Vector3(), localQuaternion = new THREE.Quaternion();
    let surface = null;
    if (copyFrom) { localPosition.copy(copyFrom.localPosition); localQuaternion.copy(copyFrom.localQuaternion); }
    else {
      anchor.updateWorldMatrix(true, false);
      localPosition.copy(scratchPosition); anchor.worldToLocal(localPosition);
      if (!payload.position) { localPosition.set((serial % 2 ? -1 : 1) * 0.065, -0.02, anchor.userData.frontSurfaceZ || 0.14); scratchPosition.copy(localPosition); anchor.localToWorld(scratchPosition); }
      setPoint(scratchPosition2, payload.direction);
      if (scratchPosition2.lengthSq() < 0.001) { anchor.getWorldQuaternion(scratchQuaternion); scratchPosition2.copy(forward).applyQuaternion(scratchQuaternion); }
      scratchPosition2.normalize();
      scratchQuaternion.setFromUnitVectors(forward, scratchPosition2);
      anchor.getWorldQuaternion(scratchQuaternion2).invert(); localQuaternion.copy(scratchQuaternion2).multiply(scratchQuaternion);
      raycaster.ray.origin.copy(scratchPosition).addScaledVector(scratchPosition2, 0.38);
      raycaster.ray.direction.copy(scratchPosition2).negate(); raycaster.near = 0; raycaster.far = 0.86;
      hits.length = 0; raycaster.intersectObject(actor.root, true, hits);
      let hit = hits.find(h => h.object.isMesh && h.object.visible && h.face && h.barycoord && !/shadow|tear/i.test(h.object.name));
      if (!hit) {
        // A narrow face can sit just inside an approximate contact. Probe inward, never leave a floating mark.
        const contact = scratchPosition.clone(), inward = anchor.getWorldPosition(new THREE.Vector3()).sub(contact);
        inward.addScaledVector(scratchPosition2, -inward.dot(scratchPosition2));
        if (inward.lengthSq() > 0.0001) inward.normalize();
        for (const offset of [0.025, 0.05, 0.075]) {
          raycaster.ray.origin.copy(contact).addScaledVector(inward, offset).addScaledVector(scratchPosition2, 0.38);
          hits.length = 0; raycaster.intersectObject(actor.root, true, hits);
          hit = hits.find(h => h.object.isMesh && h.object.visible && h.face && h.barycoord && !/shadow|tear/i.test(h.object.name));
          if (hit) break;
        }
      }
      if (hit) surface = { mesh: hit.object, indices: [hit.face.a, hit.face.b, hit.face.c], bary: hit.barycoord.clone(), sign: 1 };
      else { mesh.removeFromParent(); return null; }
      // Keep the mark slightly above the contacted surface to avoid depth flicker.
      scratchPosition2.multiplyScalar(0.006); scratchPosition.add(scratchPosition2); localPosition.copy(scratchPosition); anchor.worldToLocal(localPosition);
    }
    if (copyFrom?.surface && body) {
      const mesh = body.clone.root.getObjectByName(copyFrom.surface.mesh.name);
      if (mesh?.isMesh) surface = { ...copyFrom.surface, mesh, bary: copyFrom.surface.bary.clone(), indices: [...copyFrom.surface.indices] };
    }
    const headWound = copyFrom?.head ?? anchor === actor.headAnchor;
    const size = copyFrom?.size || payload.markSize || (headWound ? 0.045 + clamp(payload.intensity ?? 0.7, 0, 1) * 0.02 : 0.085 + clamp(payload.intensity ?? 0.7, 0, 1) * 0.045);
    const width = copyFrom?.width || payload.markWidth || size * 1.2;
    mesh.scale.set(width, size, size);
    const item = { mesh, actor: body ? null : actor, body, anchor, surface, localPosition, localQuaternion, size, width, facial, markKey: copyFrom?.markKey || payload.markKey, head: headWound, serial: serial++ };
    wounds.push(item); trackAnchor(item); mesh.visible = enabled && bloodEnabled; return item;
  }

  // Compatibility for old character builds; normal integration uses the independent clone API.
  function fallbackClone(actor) {
    const cloneRoot = cloneSkeleton(actor.root), geo = new Map(), mats = new Map(), tex = new Map(), skeletons = new Set();
    cloneRoot.traverse(object => {
      if (object.geometry) { if (!geo.has(object.geometry)) geo.set(object.geometry, object.geometry.clone()); object.geometry = geo.get(object.geometry); }
      if (object.material) {
        const cloneMaterial = original => {
          if (!mats.has(original)) {
            const copy = original.clone();
            for (const key of Object.keys(copy)) if (copy[key]?.isTexture) { const originalTexture = copy[key]; if (!tex.has(originalTexture)) { const t = originalTexture.clone(); t.needsUpdate = true; tex.set(originalTexture, t); } copy[key] = tex.get(originalTexture); }
            mats.set(original, copy);
          }
          return mats.get(original);
        };
        object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
      }
      if (object.skeleton) skeletons.add(object.skeleton);
    });
    let headAnchor = actor.headAnchor?.name && cloneRoot.getObjectByName(actor.headAnchor.name);
    let chestAnchor = actor.chestAnchor?.name && cloneRoot.getObjectByName(actor.chestAnchor.name);
    if (!headAnchor) { headAnchor = new THREE.Object3D(); headAnchor.position.set(0, 1.64, 0); cloneRoot.add(headAnchor); }
    if (!chestAnchor) { chestAnchor = new THREE.Object3D(); chestAnchor.position.set(0, 1.1, 0); cloneRoot.add(chestAnchor); }
    let released = false;
    return { root: cloneRoot, headAnchor, chestAnchor, materials: [...mats.values()], setDeadPose() { cloneRoot.rotation.x = -Math.PI / 2; }, setExpression() {}, dispose() { if (released) return; released = true; cloneRoot.removeFromParent(); geo.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); tex.forEach(t => t.dispose()); skeletons.forEach(s => s.dispose()); } };
  }
  function eyeSurfaceGeometry(clone, anchor, eye) {
    const positions = [], indices = [];
    anchor.updateWorldMatrix(true, false); anchor.getWorldQuaternion(scratchQuaternion);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(scratchQuaternion);
    // Eight face projections make each X hug the eyelid/cheek curvature instead of floating or clipping.
    for (const angle of [-Math.PI / 4, Math.PI / 4]) {
      const first = positions.length / 3, c = Math.cos(angle), s = Math.sin(angle);
      for (const [x, y] of [[-.025, -.0045], [.025, -.0045], [.025, .0045], [-.025, .0045]]) {
        scratchPosition.set(eye[0] + x * c - y * s, eye[1] + x * s + y * c, eye[2]); anchor.localToWorld(scratchPosition);
        raycaster.ray.origin.copy(scratchPosition).addScaledVector(normal, .13); raycaster.ray.direction.copy(normal).negate(); raycaster.near = 0; raycaster.far = .3;
        hits.length = 0; raycaster.intersectObject(clone.root, true, hits);
        const hit = hits.find(h => h.object.isMesh && h.object.visible && !/shadow|tear|number/i.test(h.object.name));
        if (hit) scratchPosition.copy(hit.point).addScaledVector(normal, .0035); else scratchPosition.addScaledVector(normal, .018);
        anchor.worldToLocal(scratchPosition); positions.push(scratchPosition.x, scratchPosition.y, scratchPosition.z);
      }
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
    const g = ownGeometry(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }
  function createBody(actor, type, ambient = false) {
    if (immune(actor) || bodies.length >= MAX_CORPSES) return null;
    const clone = actor.cloneVisual?.() || fallbackClone(actor);
    if (!clone?.root?.isObject3D || typeof clone.dispose !== 'function') return null;
    const wrapper = new THREE.Group(); wrapper.name = ambient ? 'unidentified-past-victim' : 'aftermath-body'; wrapper.visible = false;
    wrapper.userData.visualCorpse = true; wrapper.userData.ambient = ambient; root.add(wrapper);
    const holdPose = !ambient && (type === 'frozen' || type === 'impaled');
    const preserveLivePose = holdPose || !ambient && type === 'drowned' && actor._deathPose?.settled === true && ['fall', 'dead'].includes(actor.action);
    if (preserveLivePose) { actor.root.updateWorldMatrix(true, false); actor.root.matrixWorld.decompose(clone.root.position, clone.root.quaternion, clone.root.scale); }
    else { clone.root.position.set(0, 0, 0); clone.root.rotation.set(0, 0, 0); }
    clone.root.visible = true; wrapper.add(clone.root);
    if (!preserveLivePose) { clone.setDeadPose?.(); clone.setExpression?.('dead', 1); }
    if (!ambient) patchCloneInjuries(actor, clone, type);
    clone.root.traverse(object => {
      if (/shadow/i.test(object.name) || (ambient && /number|label|nameplate/i.test(object.name))) object.visible = false;
      if (ambient && object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of list) { if (material.color) material.color.lerp(new THREE.Color(0x788984), 0.55); material.roughness = 0.96; }
      }
    });
    wrapper.updateMatrixWorld(true); bounds.setFromObject(clone.root, true); bounds.getCenter(center);
    clone.root.position.sub(center); clone.root.updateMatrixWorld(true);
    const record = { clone, wrapper, actorId: ambient ? null : actor.id, actor: ambient ? null : actor, type, ambient, revealed: false, revealedAt: null, sinkStartedAt: null, sinkFromY: null, floating: false, sinking: false, heading: actor.root.rotation.y || 0, baseX: actor.position?.x || 0, baseZ: actor.position?.z || 0, seed: serial++ * 1.718, created: elapsed, halfHeight: Math.max(0.12, (bounds.max.y - bounds.min.y) * 0.5), dimensions: [bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z], eyes: [], eyeGeometries: [], sourceScenario: type === 'drowned' ? 'flood' : type === 'electric-strike' ? 'electric' : state.scenarioId };
    if (preserveLivePose) {
      record.posePreserved = true; record.handoffCenter = center.clone(); record.baseX = center.x; record.baseZ = center.z; record.heading = 0;
      if (type === 'drowned') { record.sinkStartedAt = elapsed; record.sinkFromY = center.y; }
      if (holdPose) { record.holdPose = true; record.holdReason = type; }
    }
    if (type === 'drowned') {
      const anchor = clone.headAnchor || clone.root;
      const eyePoints = anchor.userData?.eyes || [[-0.035, 0.035, 0.112], [0.035, 0.035, 0.112]];
      for (const eye of eyePoints) {
        const geometry = eyeSurfaceGeometry(clone, anchor, eye); record.eyeGeometries.push(geometry);
        const mesh = new THREE.Mesh(geometry, eyeMaterial); mesh.name = 'x-eyes'; root.add(mesh);
        const item = { mesh, anchor, localPosition: new THREE.Vector3(), localQuaternion: new THREE.Quaternion() };
        record.eyes.push(item); trackAnchor(item); mesh.visible = false;
      }
    }
    if (type === 'electric-strike') {
      const seen = new Set(); clone.root.traverse(object => {
        const list = object.material ? Array.isArray(object.material) ? object.material : [object.material] : [];
        for (const material of list) if (!seen.has(material)) { seen.add(material); material.color?.setRGB(0.012, 0.014, 0.016); material.emissive?.setRGB(0, 0, 0); material.roughness = 0.98; material.metalness = 0; }
      });
    }
    bodies.push(record);
    if (!ambient) {
      for (const wound of [...wounds]) if (wound.actor === actor && !wound.body) addWound(actor, { intensity: 0.7 }, wound, record);
      bodyByActor.set(actor.id, record);
    }
    return record;
  }

  function emit(type, payload = {}) {
    if (disposed) return { accepted: false };
    if (type === 'flood-start' || type === 'flood-water') {
      floodState = { ...floodState, ...payload };
      addAmbientBodies({ ...state, ...floodState, scenarioId: 'flood' });
      for (const body of bodies) if (body.ambient) updateBody(body, { ...state, ...floodState, scenarioId: 'flood' });
      return { accepted: true, ambientCorpses: bodies.filter(b => b.ambient).length };
    }
    if (!['bite', 'electric-strike', 'drowned', 'impact', 'injury', 'bruise', 'gas-face-burst', 'impale'].includes(type)) return { accepted: false };
    const actor = resolveActor(payload);
    if (immune(actor)) { ignoredEvents++; if (actor) blockedGuestEvents++; return { accepted: false }; }
    if (['drowned', 'impale', 'gas-face-burst'].includes(type) ? !eligible(actor) : !living(actor)) { ignoredEvents++; return { accepted: false }; }
    acceptedEvents++;
    if (!['injury','bruise','gas-face-burst','drowned'].includes(type) && payload.phase !== 'hold') addContactCue(actor,type,payload);
    if (type === 'gas-face-burst') {
      if (state.scenarioId !== 'gas' || actor.health?.current !== 0 || payload.fatal !== true) return { accepted: false };
      return { accepted: true, burst: burstFace(actor) };
    }
    if (type === 'impale') {
      const first = !impaleContacts.has(actor.id) && payload.phase !== 'hold';
      prepared.set(actor.id, { type: 'impaled', contact: { position: payload.position, tip: payload.tip, base: payload.base, penetration: payload.penetration, spikeIndex: payload.spikeIndex } });
      if (first) {
        impaleContacts.add(actor.id);
        const contactNormal = setPoint(scratchPosition2, payload.direction).negate().toArray();
        addWound(actor, { ...payload, direction: contactNormal, intensity: payload.intensity ?? .95, markSize: .12, markWidth: .11 });
        if (enabled && bloodEnabled) blood?.emit?.('impact', { ...payload, actor, actorId: actor.id, stage: actor.health?.stage || 'critical', ratio: actor.health?.ratio ?? 0, selected: true, fatal: actor.health?.current === 0, invincible: false });
      }
      return { accepted: true, firstContact: first, held: true };
    }
    if (type === 'injury' || type === 'bruise') return applyInjury(actor, { ...payload, type, kind: payload.kind || (type === 'bruise' ? 'bruise' : undefined) });
    const intensity = clamp(Number.isFinite(payload.intensity) ? payload.intensity : 0.7, 0, 1);
    if (type === 'electric-strike') {
      const burn = burnActor(actor);
      if (elapsed - burn.lastStrike >= 0.12) {
        burn.strikes++; burn.lastStrike = elapsed;
        const severity = Number.isFinite(actor.health?.ratio) ? 1 - actor.health.ratio : Math.min(.78, burn.strikes * .065);
        burn.target = Math.max(burn.target, Math.min(MAX_LIVING_SCORCH, .055 + severity * .4 + intensity * .025));
        burn.injuryTargets.sweat = Math.max(burn.injuryTargets.sweat, .12 + severity * .7);
      }
      return { accepted: true, scorch: burn.target };
    }
    if (type === 'bite' || type === 'impact') {
      if (!payload.squishApplied) actor.setSquish?.(payload.kind || type, intensity, .55);
      if (type === 'bite' || intensity > 0.4) { addWound(actor, { ...payload, intensity }); burnActor(actor).lastWound = elapsed; }
      if (enabled && bloodEnabled) {
        const position = Array.isArray(payload.position) ? payload.position : setPoint(scratchPosition, payload.position, actor.position).toArray();
        const direction = payload.direction?.isVector3 ? payload.direction.toArray() : payload.direction;
        blood?.emit?.(type, { ...payload, position, direction, actorId: actor.id, actor, intensity: clamp(payload.intensity ?? intensity, 0.25, 3), stage: actor.health?.stage ?? 'hurt', ratio: actor.health?.ratio ?? 1, selected: eligible(actor), fatal: false, invincible: false });
      }
      return { accepted: true };
    }
    const previous = prepared.get(actor.id);
    if (!previous) {
      prepared.set(actor.id, { type, waterLevel: payload.waterLevel });
    } else if (Number.isFinite(payload.waterLevel)) previous.waterLevel = payload.waterLevel;
    return { accepted: true, prepared: true };
  }

  function onEliminated(actor, givenState = state) {
    if (disposed || immune(actor) || !eligible(actor, givenState)) return { accepted: false };
    // A collapsed refuge has no remaining floor. Keep the actual fall below it.
    if (givenState.scenarioId === 'collapse') { prepared.delete(actor.id); return { accepted: true, corpse: null, suppressed: 'below-floor' }; }
    if(givenState.scenarioId==='boiler'){if(!boilerFarewells.has(actor.id)&&boilerFarewells.size<1)boilerFarewells.set(actor.id,createBoilerFarewell({scene:root,actor,floorY:chamber.floorY||0}));prepared.delete(actor.id);return {accepted:true,corpse:null,cinematic:'boiler-farewell'};}
    const pending = prepared.get(actor.id);
    const type = givenState.scenarioId === 'freeze' ? 'frozen' : givenState.scenarioId === 'spikes' ? 'impaled' : pending?.type || (givenState.scenarioId === 'flood' ? 'drowned' : givenState.scenarioId === 'electric' || (burns.get(actor.id)?.target || 0) > .3 ? 'electric-strike' : 'impact');
    if (type === 'electric-strike') { const burn = burnActor(actor); burn.amount = burn.target = 1; burn.uniform.value = enabled ? 1 : 0; burn.finalized = true; }
    if (type === 'frozen') { const injury = burnActor(actor); injury.injuryTargets.cold = injury.injury.cold.value = 1; }
    if (givenState.scenarioId === 'gas') burstFace(actor);
    const body = pending?.body || bodyByActor.get(actor.id) || createBody(actor, type);
    if (!body) return { accepted: false };
    body.revealed = true; body.revealedAt ??= elapsed; body.wrapper.visible = enabled; body.sourceScenario = givenState.scenarioId || body.sourceScenario;
    body.baseX = body.posePreserved ? body.handoffCenter.x : clamp(actor.position?.x || 0, -chamber.halfWidth + 1.1, chamber.halfWidth - 1.1);
    body.baseZ = body.posePreserved ? body.handoffCenter.z : clamp(actor.position?.z || 0, -chamber.halfDepth + 1.1, chamber.halfDepth - 1.1);
    body.waterLevel = Number.isFinite(givenState.waterLevel) ? givenState.waterLevel : pending?.waterLevel;
    prepared.delete(actor.id); updateBody(body, givenState);
    return { accepted: true, corpse: body.wrapper };
  }
  function updateBody(body, current) {
    const flood = current.scenarioId === 'flood';
    const visible = enabled && body.revealed && (body.ambient || current.phase !== 'preview') && (body.type === 'drowned' ? flood : !body.sourceScenario || current.scenarioId === body.sourceScenario);
    body.wrapper.visible = visible;
    if (body.holdPose) { body.wrapper.position.copy(body.handoffCenter); body.wrapper.rotation.set(0, 0, 0); body.wrapper.updateMatrixWorld(true); body.floating = false; body.sinking = false; return; }
    const floor = Number.isFinite(floodState?.floor) ? floodState.floor : chamber.floorY || 0;
    const ceiling = Number.isFinite(floodState?.ceiling) ? floodState.ceiling : floor + (chamber.height || 7);
    const water = Number.isFinite(current.waterLevel) ? current.waterLevel : Number.isFinite(floodState?.waterLevel) ? floodState.waterLevel : Number.isFinite(body.waterLevel) ? body.waterLevel : floor + .035;
    const restingY = floor + body.halfHeight + .016;
    const flotationY = Math.min(ceiling - body.halfHeight - .025, Math.max(restingY, water + body.halfHeight * .16));
    const buoyancy = body.type === 'drowned' ? clamp((flotationY - restingY) / .3, 0, 1) : 0;
    body.floating = buoyancy > 0; body.waterLevel = water; body.floorY = floor;
    let y = body.type === 'drowned' ? flotationY : restingY;
    if (body.type === 'drowned' && !body.ambient && body.revealed && water >= ceiling - .015 && body.sinkStartedAt === null) {
      body.sinkStartedAt = Math.max(elapsed, (body.revealedAt ?? elapsed) + .8); body.sinkFromY = y;
    }
    body.sinking = body.sinkStartedAt !== null && elapsed >= body.sinkStartedAt;
    if (body.sinkStartedAt !== null) y = Math.max(restingY, body.sinkFromY - Math.max(0, elapsed - body.sinkStartedAt) * .38);
    else if (body.ambient) y = clamp(y + Math.sin(elapsed * .88 + body.seed) * .018 * buoyancy, restingY, ceiling - body.halfHeight - .025);
    const drift = body.posePreserved ? 0 : body.ambient ? buoyancy : body.sinking ? .25 : buoyancy;
    body.wrapper.position.set(body.baseX + Math.sin(elapsed * .24 + body.seed) * .13 * drift, y, body.baseZ + Math.cos(elapsed * .19 + body.seed) * .11 * drift);
    body.wrapper.rotation.set(body.sinking ? 0 : Math.sin(elapsed * .67 + body.seed) * .018 * buoyancy, body.heading + (body.ambient ? Math.sin(elapsed * .16 + body.seed) * .07 * buoyancy : 0), body.sinking ? 0 : Math.cos(elapsed * .71 + body.seed) * .02 * buoyancy);
    body.wrapper.updateMatrixWorld(true);
    for (const eye of body.eyes) { trackAnchor(eye); eye.mesh.visible = visible && (body.ambient || elapsed - (body.revealedAt ?? elapsed) < 2.4); }
  }
  function addAmbientBodies(current) {
    if (ambientCreated || current.scenarioId !== 'flood') return;
    const candidates = actors.filter(a => !immune(a) && typeof a.cloneVisual === 'function');
    const descriptors = floodState?.obstacles || defaultFloodObstacles;
    for (let i = 0; i < Math.min(2, candidates.length); i++) {
      const body = createBody(candidates[i], 'drowned', true);
      if (!body) continue;
      const descriptor = descriptors[i] || defaultFloodObstacles[i];
      body.propId = descriptor.id; body.baseX = descriptor.x; body.baseZ = descriptor.z; body.radius = Math.max(descriptor.radius || 1.1, Math.hypot(body.dimensions[0], body.dimensions[2]) * .5); body.heading = i ? Math.PI / 2 : -Math.PI / 2; body.revealed = true; body.revealedAt = elapsed;
      updateBody(body, current);
    }
    ambientCreated = bodies.filter(b => b.ambient).length === 2;
  }
  function getFloodObstacles() {
    const ambient = bodies.filter(b => b.ambient);
    return ambient.length ? ambient.map(b => ({ id: b.propId, x: b.wrapper.position.x, z: b.wrapper.position.z, radius: b.radius, y: b.wrapper.position.y })) : defaultFloodObstacles.map(item => ({ ...item }));
  }
  function update(dt, nextState = {}) {
    if (disposed) return;
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1); elapsed += dt; state = nextState;
    updateContactCues(dt);
    for(const effect of boilerFarewells.values())effect.update(dt,enabled&&state.scenarioId==='boiler');
    for (const burn of burns.values()) {
      if (!burn.finalized) burn.target = Math.min(MAX_LIVING_SCORCH, burn.target);
      burn.amount += (burn.target - burn.amount) * (1 - Math.exp(-dt * 9)); burn.uniform.value = enabled ? burn.amount : 0;
      for (const [key, uniform] of Object.entries(burn.injury)) uniform.value = enabled ? uniform.value + (burn.injuryTargets[key] - uniform.value) * (1 - Math.exp(-dt * 7)) : 0;
    }
    addAmbientBodies(state);
    let rippleCount = 0;
    for (const body of bodies) {
      updateBody(body, state);
      if (body.wrapper.visible && body.type === 'drowned' && body.floating && !body.sinking) {
        const level = body.waterLevel;
        for (let i = 0; i < 2; i++) {
          const expansion = 1 + ((elapsed * 0.2 + body.seed + i * 0.5) % 1) * 0.2;
          rippleTransform.position.set(body.wrapper.position.x, level + 0.012 + i * 0.002, body.wrapper.position.z);
          rippleTransform.rotation.set(-Math.PI / 2, 0, body.heading); rippleTransform.scale.set(0.6 * expansion, 1.1 * expansion, 1);
          rippleTransform.updateMatrix(); ripples.setMatrixAt(rippleCount++, rippleTransform.matrix);
        }
      }
    }
    ripples.count = rippleCount; ripples.instanceMatrix.needsUpdate = true;
    for (let i = faceParticles.length - 1; i >= 0; i--) {
      const particle = faceParticles[i]; particle.age += dt;
      particle.velocity.y -= dt * 2.8; particle.position.addScaledVector(particle.velocity, dt);
      if (particle.age >= particle.life || particle.position.y < (chamber.floorY || 0) - .03) faceParticles.splice(i, 1);
    }
    faceBurstMesh.visible = enabled && bloodEnabled; faceBurstMesh.count = faceParticles.length;
    for (let i = 0; i < faceParticles.length; i++) {
      const particle = faceParticles[i], shrink = Math.min(1, (particle.life - particle.age) * 5);
      particleTransform.position.copy(particle.position); particleTransform.rotation.set(particle.spin + particle.age * 4, particle.spin * .7, particle.age * 3);
      particleTransform.scale.setScalar(particle.size * shrink); particleTransform.scale.y *= particle.flesh ? .6 : 1.9;
      particleTransform.updateMatrix(); faceBurstMesh.setMatrixAt(i, particleTransform.matrix);
      particleColor.setHex(particle.flesh ? 0xa96353 : 0x710718); faceBurstMesh.setColorAt(i, particleColor);
    }
    faceBurstMesh.instanceMatrix.needsUpdate = true; if (faceBurstMesh.instanceColor) faceBurstMesh.instanceColor.needsUpdate = true;
    if (wounds.length) for (const actor of actors) actor.root.updateWorldMatrix(true, true);
    for (const wound of wounds) {
      trackAnchor(wound);
      wound.mesh.visible = enabled && bloodEnabled && (wound.body ? wound.body.wrapper.visible : wound.actor?.root.visible !== false && wound.actor?.alive !== false);
    }
  }
  function setBloodEnabled(value) { bloodEnabled = Boolean(value); if (!bloodEnabled) { for(const c of cuePool)c.life=0;cueMesh.count=0;cueMesh.visible=false; faceParticles.length = 0; faceBurstMesh.count = 0; faceBurstMesh.visible = false; } for (const wound of wounds) wound.mesh.visible = enabled && bloodEnabled && (wound.body ? wound.body.wrapper.visible : wound.actor?.root.visible !== false && wound.actor?.alive !== false); }
  function setEnabled(value) { enabled = Boolean(value); root.visible = enabled; for (const burn of burns.values()) { burn.uniform.value = enabled ? burn.amount : 0; for (const [key, uniform] of Object.entries(burn.injury)) uniform.value = enabled ? burn.injuryTargets[key] : 0; } }
  function reset() {
    for(const effect of boilerFarewells.values())effect.dispose();boilerFarewells.clear();
    for(const c of cuePool)c.life=0;cueMesh.count=0;cueLast.clear();cuesCreated=0;
    for (const burn of burns.values()) releaseBurn(burn); burns.clear();
    for (const wound of wounds) wound.mesh.removeFromParent(); wounds.length = 0;
    for (const body of bodies) { for (const eye of body.eyes) eye.mesh.removeFromParent(); for (const g of body.eyeGeometries) { g.dispose(); geometries.delete(g); } body.clone.dispose(); body.wrapper.removeFromParent(); }
    bodies.length = 0; prepared.clear(); bodyByActor.clear(); ripples.count = 0;
    faceParticles.length = 0; faceBurstMesh.count = 0; gasBursts.clear(); impaleContacts.clear();
    ambientCreated = false; floodState = null; elapsed = 0; serial = 0; acceptedEvents = 0; ignoredEvents = 0; blockedGuestEvents = 0;
    state = { phase: 'preview', progress: 0, victimIds: new Set() };
  }
  function dispose() {
    if (disposed) return; reset(); disposed = true;
    ripples.dispose(); faceBurstMesh.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); root.removeFromParent(); root.clear();
  }
  function getstats() { return { enabled, bloodEnabled, boilerFarewells:[...boilerFarewells.values()].map(e=>e.stats), contactCues:cueMesh.count, contactCueLimit:cueLimit, cuesCreated, reducedMotion:Boolean(reducedMotion?.matches), burns: [...burns.values()].filter(b => b.target > 0).length, wounds: wounds.length, woundsByActor: actors.map(a => ({ actorId: a.id, count: wounds.filter(w => w.actor === a).length, visible: wounds.filter(w => w.actor === a && w.mesh.visible).length })), corpses: bodies.filter(b => b.revealed && !b.ambient).length, ambientCorpses: bodies.filter(b => b.ambient).length, preparedCorpses: prepared.size, acceptedEvents, ignoredEvents, blockedGuestEvents, gasFaceBursts: [...gasBursts], impaleContactActors: [...impaleContacts], activeFaceParticles: faceParticles.length, maxFaceParticles: MAX_FACE_PARTICLES, burnAmounts: [...burns].map(([actorId, b]) => ({ actorId, amount: b.amount, target: b.target, strikes: b.strikes })), injuryActors: [...burns].map(([actorId, b]) => ({ actorId, stage: b.stage, ratio: b.ratio, gasFaceFlush: THREE.MathUtils.smoothstep(b.injury.poison.value,.035,.48), gasFaceBlue: THREE.MathUtils.smoothstep(b.injury.poison.value,.48,.96), facialBleeds: b.faceMarks.size, visibleFacialBleeds: wounds.filter(w => w.actor === b.actor && w.facial && w.mesh.visible).length, faceMaterials: b.owned.filter(m => m.userData.deathInjurySurface?.face).length, frost: b.injury.cold.value, ...Object.fromEntries(Object.entries(b.injury).map(([key, uniform]) => [key, uniform.value])) })), floodObstacles: getFloodObstacles(), bodyDimensions: bodies.map(b => ({ uuid: b.wrapper.uuid, propId: b.propId, actorId: b.actorId, ambient: b.ambient, type: b.type, dimensions: [...b.dimensions], position: b.wrapper.position.toArray(), createdAt: b.created, revealedAt: b.revealedAt, waterLevel: b.waterLevel, floorY: b.floorY, floating: b.floating, sinking: b.sinking, sinkStartedAt: b.sinkStartedAt, posePreserved: Boolean(b.posePreserved), heldPose: Boolean(b.holdPose), holdReason: b.holdReason, handoffCenter: b.handoffCenter?.toArray(), eyesVisible: b.eyes.filter(e => e.mesh.visible).length, visible: b.wrapper.visible })) }; }
  return { getBoilerFarewell(){return boilerFarewells.values().next().value?.stats||null}, emit, applyInjury, update, onEliminated, reset, getFloodObstacles, setEnabled, setBloodEnabled, dispose, getstats, get stats() { return getstats(); } };
}

export default createDeathEffects;
