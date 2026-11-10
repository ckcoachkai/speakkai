import * as THREE from '../assets/vendor/three.module.js';
import { GLTFLoader } from '../assets/vendor/GLTFLoader.js';

const CHARACTERS = new Set(['cat','dog','rabbit','lion','tiger','panda','cheetah','puma','leopard','eagle']);
export const DANCE_STYLES = ['square', 'shuffle', 'hiphop', 'disco'];

/** One short-lived stage per result. Loads only the selected player's character. */
export function createWinnerDance3D({canvas, species='cat', color='#69d9c2', onReady=()=>{}, onError=()=>{}}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'}); }
  catch (error) { onError(error); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 30);
  camera.position.set(1.8, 1.75, 4.3);
  camera.lookAt(0, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x34523f, 2.7));
  const key = new THREE.DirectionalLight(0xffebd0, 3.8);
  key.position.set(-2.5,5,4);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;
  key.shadow.camera.top=3;key.shadow.camera.bottom=-1;key.shadow.normalBias=.025;scene.add(key);
  const rim = new THREE.DirectionalLight(0x63ffe0, 3);rim.position.set(2,3,-2);scene.add(rim);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.82,.91,.09,64),new THREE.MeshStandardMaterial({color:0x1b3536,roughness:.55,metalness:.25}));
  pedestal.position.y=-.04;pedestal.receiveShadow=true;scene.add(pedestal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.84,.012,8,96),new THREE.MeshBasicMaterial({color:0x8be6c5}));
  ring.rotation.x=Math.PI/2;ring.position.y=.009;scene.add(ring);
  let disposed=false, ready=false, mixer=null, model=null, action=null, currentStyle='square';
  let paused=false, frame=0, last=performance.now(), clipTime=0;
  const clips = new Map(), controller = new AbortController();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const size = new THREE.Vector2();
  function resize() {
    if(disposed)return;
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
    renderer.getSize(size);
    if(size.x!==w||size.y!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.zoom=Math.min(1,camera.aspect/.85);camera.updateProjectionMatrix();}
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  function draw(now) {
    if(disposed)return;
    const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    if(!document.hidden&&ready){
      if(!paused&&!reduced.matches){mixer.update(dt);clipTime+=dt;}
      resize();renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(draw);
  }
  function select(style, immediate=false) {
    currentStyle=DANCE_STYLES.includes(style)?style:'square';
    if(!mixer||!clips.has(currentStyle))return;
    const next=mixer.clipAction(clips.get(currentStyle));
    if(next===action)return;
    next.reset();next.setLoop(THREE.LoopRepeat,Infinity);next.play();
    if(action&&!immediate&&!reduced.matches)next.crossFadeFrom(action,.28,true);
    else {action?.stop();next.setEffectiveWeight(1);}
    action=next;
    // An intentional hero pose rather than continuously moving under reduced motion.
    if(reduced.matches)mixer.setTime(.45);
    canvas.dataset.danceStyle=currentStyle;
  }
  function release(root) {
    const geometries=new Set(),materials=new Set(),textures=new Set();
    root.traverse(object=>{
      if(object.geometry)geometries.add(object.geometry);
      for(const mat of (Array.isArray(object.material)?object.material:[object.material]))if(mat){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}
      object.skeleton?.dispose();
    });
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
  }
  function destroy(){
    if(disposed)return;disposed=true;controller.abort();cancelAnimationFrame(frame);observer.disconnect();
    canvas.removeEventListener('webglcontextlost',contextLost);reduced.removeEventListener('change',motionChanged);
    if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model);}
    release(scene);renderer.dispose();canvas.hidden=true;canvas.dataset.danceState='stopped';
  }
  function contextLost(event){event.preventDefault();destroy();onError(new Error('3D context lost'));}
  function motionChanged(){if(ready&&reduced.matches)mixer.setTime(.45);last=performance.now();}
  canvas.addEventListener('webglcontextlost',contextLost);
  reduced.addEventListener('change',motionChanged);
  canvas.dataset.danceState='loading';
  const url=new URL('../assets/dancers/'+(CHARACTERS.has(species)?species:'cat')+'.glb',import.meta.url);
  fetch(url,{signal:controller.signal}).then(response=>{
    if(!response.ok)throw new Error('Dancer unavailable');return response.arrayBuffer();
  }).then(buffer=>new GLTFLoader().parseAsync(buffer,url.href.slice(0,url.href.lastIndexOf('/')+1))).then(gltf=>{
    if(disposed){release(gltf.scene);return;}
    model=gltf.scene;scene.add(model);
    model.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=true;object.receiveShadow=true;object.frustumCulled=false;
      for(const material of (Array.isArray(object.material)?object.material:[object.material])){
        if(material.name.startsWith('Player accent')&&/^#[0-9a-f]{6}$/i.test(color))material.color.set(color);
      }
    });
    for(const clip of gltf.animations){const name=DANCE_STYLES.find(s=>clip.name===s||clip.name.startsWith(s+'.'));if(name)clips.set(name,clip);}
    if(clips.size!==DANCE_STYLES.length)throw new Error('Incomplete dance animation set');
    mixer=new THREE.AnimationMixer(model);select(currentStyle,true);ready=true;
    canvas.hidden=false;canvas.dataset.danceState='ready';onReady();resize();
    frame=requestAnimationFrame(draw);
  }).catch(error=>{if(!disposed){destroy();onError(error);}});
  return {destroy, setStyle:style=>select(style), setPaused:value=>{paused=!!value;canvas.dataset.paused=String(paused);},
    getState:()=>({ready,paused,style:currentStyle,time:clipTime,clips:[...clips.keys()]})};
}
