import { GLTFLoader } from '../assets/vendor/GLTFLoader.js';
import { createCarFinish } from './race3d-car-finish.js?v=20261024-race3d-release1';

// Licensed authored meshes. Templates share their GPU buffers/textures across all racers.
export const RACE_CAR_ASSETS = [
  { id:'f1-2026', label:'Qvist 2026 Formula concept', url:new URL('../assets/race3d-cars/f1.glb',import.meta.url).href, yaw:Math.PI/2, length:5.1, wheelPattern:/^(wheel|tyre|tire)[_-]?(fl|fr|rl|rr|front|rear|left|right)|wheel.*(front|rear)|^(front|rear).*wheel/i },
  { id:'gt3', label:'Race Car 01 LMGT3', url:new URL('../assets/race3d-cars/gt3.glb',import.meta.url).href, yaw:0, length:4.7, wheelPattern:/^Wheel(Front|Rear)[LR]$/i },
  { id:'car-concept', label:'CarConcept sports coupe', url:new URL('../assets/race3d-cars/supercar.glb',import.meta.url).href, yaw:0, length:4.6, wheelPattern:/^Wheel(Front|Rear)[LR]$/i },
];

export function createAuthoredCarAssets(THREE, { isDisposed, registerResource }) {
  const loader=new GLTFLoader(), pending=new Map(), errors=[];
  function collect(root) {
    root.traverse(node=>{
      if(!node.isMesh)return;
      registerResource('geometry',node.geometry);
      for(const material of Array.isArray(node.material)?node.material:[node.material]) {
        registerResource('material',material);
        for(const value of Object.values(material))if(value?.isTexture)registerResource('texture',value);
      }
    });
  }
  function template(spec) {
    if(!pending.has(spec.id))pending.set(spec.id,loader.loadAsync(spec.url).then(gltf=>{
      const root=gltf.scene;
      // Cars use ordinary PBR at race scale; avoid a transmission render for each clone.
      root.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;for(const m of Array.isArray(node.material)?node.material:[node.material]) {if(m.transmission){m.transmission=0;m.transparent=true;m.opacity=.35;m.depthWrite=false;} if(m.map)m.map.anisotropy=4;}}});
      collect(root);
      return root;
    }).catch(error=>{errors.push({id:spec.id,message:String(error.message||error)});return null;}));
    return pending.get(spec.id);
  }
  // Loading starts once per race; failures leave the complete procedural car visible.
  const ready=Promise.all(RACE_CAR_ASSETS.map(template));
  async function attach(state,index) {
    const spec=RACE_CAR_ASSETS[index%RACE_CAR_ASSETS.length], source=await template(spec);
    if(!source||isDisposed())return false;
    const normalized=new THREE.Group();normalized.name='authored-'+spec.id;
    const model=source.clone(true);model.rotation.y=spec.yaw;normalized.add(model);
    normalized.updateMatrixWorld(true);
    let bounds=new THREE.Box3().setFromObject(normalized), size=bounds.getSize(new THREE.Vector3());
    const scale=spec.length/Math.max(size.z,.001);model.scale.multiplyScalar(scale);
    normalized.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(normalized);
    model.position.x-=(bounds.min.x+bounds.max.x)/2;model.position.z-=(bounds.min.z+bounds.max.z)/2;model.position.y-=bounds.min.y;
    normalized.updateMatrixWorld(true);
    bounds=new THREE.Box3().setFromObject(normalized);size=bounds.getSize(new THREE.Vector3());
    const wheelRoots=[];
    normalized.traverse(node=>{if(spec.wheelPattern.test(node.name)&&!wheelRoots.some(p=>{let a=node.parent;while(a){if(a===p)return true;a=a.parent;}return false;}))wheelRoots.push(node);});
    const spins=[],steering=[];
    for(const wheel of wheelRoots) {
      // Keep the authored axle origin. A mesh bounding-box centre can differ
      // from the true hub (calipers and asymmetric spokes are not axle pivots).
      const wb=new THREE.Box3().setFromObject(wheel), wheelSize=wb.getSize(new THREE.Vector3());
      const center=normalized.worldToLocal(wheel.getWorldPosition(new THREE.Vector3()));
      const steer=new THREE.Group();steer.name='authored-wheel-steer';steer.position.copy(center);normalized.add(steer);
      const spin=new THREE.Group();spin.name='authored-wheel-spin';steer.add(spin);normalized.updateMatrixWorld(true);spin.attach(wheel);
      spin.userData.rollingRadius=Math.max(.12,wheelSize.y*.5);
      spin.userData.axle=center.z>0?'front':'rear';
      spin.userData.authoredWheelName=wheel.name;
      // The coupe's brake caliper follows steering, while its disc and rim roll.
      for(const child of [...wheel.children])if(/brakepad/i.test(child.name))steer.attach(child);
      spins.push(spin);if(center.z>0)steering.push(steer);
    }
    const finish=createCarFinish(THREE,normalized,spec,state.primaryHex,registerResource);
    const chassis=state.car.getObjectByName('chassis-motion');
    if(!chassis)return false;
    for(const child of chassis.children)child.visible=false;
    for(const wheel of state.wheelMounts)wheel.visible=false;
    normalized.position.y=-.47;chassis.add(normalized);
    state.wheelSpin.splice(0,state.wheelSpin.length,...spins);
    state.steeringPivots.splice(0,state.steeringPivots.length,...steering);
    state.authoredVisuals=finish;finish.update(state.racer);
    // Anchors are car-local, measured from the normalized source shell. Formula
    // has one central high exhaust; the road cars use low rear outlet pairs.
    const exhaustAnchors=spec.id==='f1-2026'?[[0,size.y*.56,-size.z*.45]]:
      [[-size.x*.22,size.y*.25,-size.z*.485],[size.x*.22,size.y*.25,-size.z*.485]];
    const lampAnchors={front:[],rear:[]};
    // Existing authored lamp geometry supplies exact placement, including the
    // coupe's raised rear lenses. No floating procedural lights are added.
    normalized.updateMatrixWorld(true);
    const inverseRoot=normalized.matrixWorld.clone().invert();
    normalized.traverse(node=>{if(!node.isMesh||!/Headlights|Taillights/i.test(node.name))return;
      node.geometry.computeBoundingBox();
      const relative=new THREE.Matrix4().multiplyMatrices(inverseRoot,node.matrixWorld);
      const box=node.geometry.boundingBox.clone().applyMatrix4(relative),c=box.getCenter(new THREE.Vector3());
      const key=/Headlights/i.test(node.name)?'front':'rear';
      lampAnchors[key]=[[-(box.max.x-box.min.x)*.39,c.y,c.z],[(box.max.x-box.min.x)*.39,c.y,c.z]];
    });
    Object.assign(state.car.userData,{assetId:spec.id,assetLabel:spec.label,assetLoaded:true,authoredWheelCount:spins.length,assetDimensions:{width:size.x,height:size.y,length:size.z},driverEye:[0,Math.min(1.15,size.y*.74),.25],exhaustAnchors,lampAnchors,paintIdentity:state.primaryHex,wheelRadii:spins.map(w=>w.userData.rollingRadius)});
    return true;
  }
  return {attach,ready,errors};
}
