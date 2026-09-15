import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
import {HDRLoader} from './vendor/HDRLoader.js';
const canvas=document.querySelector('#scene'),wrap=canvas.parentElement,note=document.querySelector('.map-note');
const labelLayer=document.createElement('div');labelLayer.className='scene-labels';wrap.append(labelLayer);
const language=()=>window.travelI18n.language;
const messages={ready:['Photo-based resort study · Drag to orbit · Pinch to zoom','照片参考重建 · 拖动旋转 · 双指缩放'],loading:['Loading the detailed resort…','正在加载精细酒店模型…'],error:['3D is unavailable. Explore the 4K render or open the live map.','三维暂不可用，可查看4K效果图或打开实时地图。']};
let message='loading';function setNote(key){message=key;note.removeAttribute('data-i18n');note.textContent=messages[key][language()==='zh'?1:0];}
const anchors=[
 {en:'HUALUXE guest wings',zh:'华邑酒店客房楼',p:[-15,27,-31],view:'stay',priority:0},
 {en:'Water garden',zh:'水景花园',p:[-20,5,23],view:'stay',priority:1},
 {en:'Arrival lobby',zh:'抵达大堂',p:[88,13,-6],view:'home',priority:2},
 {en:'East Taihu Lake',zh:'东太湖',p:[-155,3,-37],view:'hero',priority:3},
 {en:'Garden suites',zh:'花园别墅',p:[-28,13,85],view:'hero',priority:4},
 {en:'Event hall',zh:'宴会厅',p:[77,17,56],view:'overview',priority:5}
];
let labelsEnabled=true,loaded=false,visible=false,active=!document.hidden;
function translate(){setNote(message);anchors.forEach(a=>{if(a.el)a.el.textContent=language()==='zh'?a.zh:a.en;});const button=document.querySelector('#map-labels');button.textContent=language()==='zh'?'地点标注':'Labels';}
try{
 const compact=()=>wrap.clientWidth<760;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,compact()?1.25:1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xc6d0d2);scene.fog=new THREE.Fog(0xc6d0d2,650,1650);
 const camera=new THREE.PerspectiveCamera(33,1,.5,3200);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.465;controls.minDistance=80;controls.maxDistance=700;controls.enablePan=false;controls.enableZoom=false;
 controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;canvas.addEventListener('touchstart',e=>{controls.enableZoom=e.touches.length>1;},{passive:true});canvas.addEventListener('touchend',()=>controls.enableZoom=false,{passive:true});
 scene.add(new THREE.HemisphereLight(0xdbe9f3,0x6c7054,.5));
 const sun=new THREE.DirectionalLight(0xffddb4,3.0);sun.position.set(-160,160,230);sun.target.position.set(-5,0,0);sun.castShadow=true;sun.shadow.mapSize.setScalar(compact()?1024:2048);Object.assign(sun.shadow.camera,{left:-220,right:220,top:220,bottom:-220,near:5,far:700});sun.shadow.bias=-.00015;sun.shadow.normalBias=.14;sun.shadow.radius=2;scene.add(sun,sun.target);
 const views={hero:{p:[-205,178,255],t:[-5,1,0]},overview:{p:[-180,355,255],t:[-5,0,-12]},stay:{p:[-92,53,123],t:[-13,9,-14]},home:{p:[176,82,82],t:[85,4,-5]}};
 let goal=null,currentView='hero',requested=false,lastFrame=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function positionFor(key){const v=views[key],target=new THREE.Vector3(...v.t),position=new THREE.Vector3(...v.p);if(compact())position.sub(target).multiplyScalar(key==='stay'?1.15:1.25).add(target);return {p:position,t:target};}
 function focus(key,instant=false){if(!views[key])return;currentView=key;document.querySelector('#map-render').href='/travel/assets/resort-'+(key==='overview'?'overview':key==='stay'?'courtyard':'hero')+'-4k.jpg';goal=positionFor(key);if(instant||reduced.matches){camera.position.copy(goal.p);controls.target.copy(goal.t);goal=null;controls.update();}document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));}
 for(const a of anchors){a.el=document.createElement('button');a.el.type='button';a.el.className='scene-pin';a.el.onclick=()=>focus(a.view);a.vector=new THREE.Vector3(...a.p);labelLayer.append(a.el);}
 translate();
 function updateLabels(){
  labelLayer.hidden=!loaded||!labelsEnabled;const placed=[];const w=wrap.clientWidth,h=wrap.clientHeight;
  for(const a of anchors){const projected=a.vector.clone().project(camera);const x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h;const width=Math.min(155,a.el.textContent.length*6.4+28);const box={x:x-width/2,y:y-32,w:width,h:40};
   const hide=projected.z<0||projected.z>1||x<width/2+10||x>w-width/2-10||y<120||y>h-(compact()?320:220)||(compact()&&a.priority>2)||placed.some(b=>box.x<b.x+b.w+12&&box.x+box.w+12>b.x&&box.y<b.y+b.h+12&&box.y+box.h+12>b.y);
   a.el.hidden=hide;if(!hide){placed.push(box);a.el.style.left=x+'px';a.el.style.top=y+'px';}
  }
 }
 const decoder=new DRACOLoader();decoder.setDecoderPath('/travel/vendor/');decoder.setDecoderConfig({type:'wasm'});decoder.setWorkerLimit(2);
 function load(){requested=true;setNote('loading');
  const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
  new HDRLoader().load('/travel/assets/resort-sky-1k.hdr',texture=>{const env=pmrem.fromEquirectangular(texture).texture;scene.environment=env;scene.environmentIntensity=.65;texture.dispose();pmrem.dispose();},undefined,()=>pmrem.dispose());
  new GLTFLoader().setDRACOLoader(decoder).load('/travel/assets/suzhou-bay-realistic.glb',g=>{
   g.scene.traverse(o=>{if(o.isMesh){const isWater=/water|reflections/i.test(o.material?.name||'');o.castShadow=!isWater;o.receiveShadow=!isWater;if(o.material){o.material.envMapIntensity=.9;if(o.material.map)o.material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});
   scene.add(g.scene);loaded=true;wrap.querySelector('.map-poster').hidden=true;setNote('ready');canvas.dataset.modelLoaded='true';decoder.dispose();
  },undefined,()=>{canvas.hidden=true;labelLayer.hidden=true;setNote('error');document.querySelectorAll('[data-view],#reset,#map-labels').forEach(b=>b.disabled=true);decoder.dispose();});
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>focus(b.dataset.view));document.querySelector('#reset').onclick=()=>focus('hero');
 document.querySelector('#map-labels').onclick=()=>{labelsEnabled=!labelsEnabled;document.querySelector('#map-labels').setAttribute('aria-pressed',String(labelsEnabled));updateLabels();};
 controls.addEventListener('start',()=>goal=null);
 function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=compact()?52:33;camera.updateProjectionMatrix();focus(currentView,true);updateLabels();}
 new ResizeObserver(resize).observe(wrap);resize();
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!requested)load();},{rootMargin:'250px'}).observe(wrap);
 document.addEventListener('visibilitychange',()=>active=!document.hidden);
 renderer.setAnimationLoop(time=>{if(!visible||!active||time-lastFrame<(compact()?32:16))return;lastFrame=time;if(goal){camera.position.lerp(goal.p,.10);controls.target.lerp(goal.t,.10);if(camera.position.distanceTo(goal.p)<.08)goal=null;}controls.update();if(loaded){renderer.render(scene,camera);updateLabels();}});
}catch{canvas.hidden=true;setNote('error');document.querySelectorAll('[data-view],#reset,#map-labels').forEach(b=>b.disabled=true);}
document.addEventListener('travel-language',translate);
