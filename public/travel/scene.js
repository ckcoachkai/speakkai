import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const canvas=document.querySelector('#scene');
try {
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x113b4b,20,45);
const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(10,13,16);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.46;controls.minDistance=8;controls.maxDistance=30;controls.target.set(0,0,0);
scene.add(new THREE.HemisphereLight(0xe8f9ff,0x16382f,3));const sun=new THREE.DirectionalLight(0xffe4b0,3);sun.position.set(-5,12,8);scene.add(sun);
new GLTFLoader().load('/travel/assets/suzhou-route.glb',gltf=>scene.add(gltf.scene),undefined,()=>{document.querySelector('.map-note').textContent='The 3D landscape could not load. The route line and live map remain available.';});
const points=[new THREE.Vector3(6,.18,2),new THREE.Vector3(3,.2,1.7),new THREE.Vector3(1,.22,-.4),new THREE.Vector3(-1.4,.23,-1.5)];
const route=new THREE.CatmullRomCurve3(points);scene.add(new THREE.Mesh(new THREE.TubeGeometry(route,60,.065,8,false),new THREE.MeshStandardMaterial({color:0xf0ba69,emissive:0xa65c22,emissiveIntensity:.3})));
function marker(x,z,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,1.1,12),new THREE.MeshStandardMaterial({color}));m.position.set(x,.65,z);scene.add(m);const dot=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),new THREE.MeshStandardMaterial({color}));dot.position.set(x,1.3,z);scene.add(dot);}
marker(6,2,0xffffff);marker(-1.4,-1.5,0xffcf85);
const car=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.5}));scene.add(car);
function resize(){const w=canvas.parentElement.clientWidth,h=canvas.parentElement.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(canvas.parentElement);resize();
document.querySelector('#reset').onclick=()=>{camera.position.set(10,13,16);controls.target.set(0,0,0);controls.update();};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(t=>{car.position.copy(route.getPointAt(reduced?.5:(t/18000)%1));controls.update();renderer.render(scene,camera);});
}catch(error){document.querySelector('.map-note').textContent='3D view unavailable on this device. Use the live map link for directions.';document.querySelector('#reset').disabled=true;}

