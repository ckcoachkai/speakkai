import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const canvas=document.querySelector('#scene'),wrap=canvas.parentElement,note=document.querySelector('.map-note');
try{
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xd9e0cf);
 const camera=new THREE.PerspectiveCamera(38,1,.1,120);camera.position.set(-13,16,19);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.46;controls.minDistance=4;controls.maxDistance=32;controls.enablePan=false;controls.target.set(0,0,0);controls.enableZoom=false;
 // Prevent the map from trapping page scroll; pinch and explicit focus views remain available.
 controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;canvas.addEventListener('touchstart',e=>{controls.enableZoom=e.touches.length>1;},{passive:true});canvas.addEventListener('touchend',()=>{controls.enableZoom=false;},{passive:true});
 scene.add(new THREE.HemisphereLight(0xfff7df,0x55734f,2.8));const sun=new THREE.DirectionalLight(0xffebc9,3.3);sun.position.set(-7,14,8);scene.add(sun);const fill=new THREE.DirectionalLight(0xd6efef,1);fill.position.set(8,6,-9);scene.add(fill);
 let loaded=false,visible=false,active=true,goal=null;
 new GLTFLoader().load('/travel/assets/suzhou-route.glb',g=>{scene.add(g.scene);loaded=true;wrap.querySelector('.map-poster').hidden=true;note.textContent='Artist’s route sketch · Drag to explore · Pinch to zoom';},undefined,()=>{canvas.hidden=true;note.textContent='Explore the illustrated route or open the live map for directions.';document.querySelectorAll('[data-view],#reset').forEach(b=>b.disabled=true);});
 const route=new THREE.CatmullRomCurve3([new THREE.Vector3(6.2,.23,3.5),new THREE.Vector3(5,.23,2.8),new THREE.Vector3(4,.23,1),new THREE.Vector3(2.7,.23,-.2),new THREE.Vector3(1.4,.23,-1.6),new THREE.Vector3(.5,.23,-2.3)]);
 const car=new THREE.Mesh(new THREE.SphereGeometry(.085,16,12),new THREE.MeshStandardMaterial({color:0xfff1d5,emissive:0xd6a253,emissiveIntensity:.25}));scene.add(car);
 const views={overview:{p:[-13,16,19],t:[0,0,0]},home:{p:[10,6,11],t:[6.5,.5,3]},stay:{p:[-6,6,4],t:[-.1,.4,-1.8]}};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function focus(key){const v=views[key];goal={p:new THREE.Vector3(...v.p),t:new THREE.Vector3(...v.t)};if(reduced.matches){camera.position.copy(goal.p);controls.target.copy(goal.t);goal=null;}document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));}
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>focus(b.dataset.view));document.querySelector('#reset').onclick=()=>focus('overview');controls.addEventListener('start',()=>goal=null);
 function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(wrap);resize();
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;},{rootMargin:'150px'}).observe(wrap);document.addEventListener('visibilitychange',()=>active=!document.hidden);
 renderer.setAnimationLoop(t=>{if(!visible||!active)return;if(goal){camera.position.lerp(goal.p,.065);controls.target.lerp(goal.t,.065);if(camera.position.distanceTo(goal.p)<.015)goal=null;}car.position.copy(route.getPointAt(reduced.matches?.5:(t/18000)%1));controls.update();if(loaded)renderer.render(scene,camera);});
}catch{canvas.hidden=true;note.textContent='3D is unavailable here. The illustrated route and live map are still available.';document.querySelectorAll('[data-view],#reset').forEach(b=>b.disabled=true);}
