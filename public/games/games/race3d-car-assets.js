import { GLTFLoader } from '../assets/vendor/GLTFLoader.js';
import { createCarFinish } from './race3d-car-finish.js?v=20261030-city';
import { RACE3D_CONCEPT_ASSETS } from './race3d-concept-assets.js?v=20261027-midnight';

// Licensed authored meshes. Templates share their GPU buffers/textures across all racers.
const standardWheelNodes=Object.freeze({FL:'WheelFrontL',FR:'WheelFrontR',RL:'WheelRearL',RR:'WheelRearR'});
export const RACE_CAR_ASSETS = Object.freeze([
  { id:'lamborghini-gallardo', label:'Lamborghini Gallardo 2010', url:new URL('../assets/race3d-cars/lamborghini-gallardo.glb',import.meta.url).href, yaw:0, length:4.45, wheelPattern:/^Wheel(Front|Rear)[LR]$/i, wheelNodes:standardWheelNodes },
  { id:'tesla-roadster', label:'Tesla Roadster 2020 concept', url:new URL('../assets/race3d-cars/tesla-roadster.glb',import.meta.url).href, yaw:0, length:4.7, wheelPattern:/^Wheel(Front|Rear)[LR]$/i, wheelNodes:standardWheelNodes },
  { id:'f1-2026', label:'Qvist 2026 Formula concept', url:new URL('../assets/race3d-cars/f1.glb',import.meta.url).href, yaw:Math.PI/2, length:5.1, wheelPattern:/^(wheel|tyre|tire)[_-]?(fl|fr|rl|rr|front|rear|left|right)|wheel.*(front|rear)|^(front|rear).*wheel/i, wheelNodes:{FL:'front-left-wheel',FR:'front-right-wheel',RL:'rear-left-wheel',RR:'rear-right-wheel'} },
  { id:'gt3', label:'Race Car 01 LMGT3', url:new URL('../assets/race3d-cars/gt3.glb',import.meta.url).href, yaw:0, length:4.7, wheelPattern:/^Wheel(Front|Rear)[LR]$/i, wheelNodes:standardWheelNodes },
  { id:'car-concept', label:'CarConcept sports coupe', url:new URL('../assets/race3d-cars/supercar.glb',import.meta.url).href, yaw:0, length:4.6, wheelPattern:/^Wheel(Front|Rear)[LR]$/i, wheelNodes:standardWheelNodes },
  ...RACE3D_CONCEPT_ASSETS,
]);

export function createAuthoredCarAssets(THREE, { isDisposed, registerResource, prepareAsset }) {
  const loader=new GLTFLoader(), pending=new Map(), errors=[];
  const wheelSlots=['FL','FR','RL','RR'];
  const semanticRules=[
    ['body',/(?:body|chassis|shell|monocoque|unibody)/i],['calipers',/caliper|brakepad/i],
    ['suspension',/suspension|wishbone|damper|shock|strut|spring/i],
    ['hood',/hood|bonnet/i],['frontBumper',/(front.*bumper|bumper.*front|front.*splitter)/i],
    ['rearBumper',/(rear.*bumper|bumper.*rear)/i],['wings',/wing|airfoil/i],['doors',/door/i],
  ];
  const slotIndex={FL:0,FR:1,RL:2,RR:3};
  const tyreStateBySpin=new WeakMap();
  const tyreTargetsFor=spin=>tyreStateBySpin.get(spin)?.targets||[];
  function setTyreTargets(spin,targets){tyreStateBySpin.set(spin,{targets,visualSeverity:Number(spin.userData.visualBlowoutSeverity)||0});spin.userData.tyreDeformationAvailable=targets.length>0;}

  function partSide(name) {
    if(/left|frontl|rearl|ftl|bkl|(?:door|wheel|wing|tire|tyre|caliper|mirror)[_\s-]*l(?:$|[^a-z])/i.test(name))return 'left';
    if(/right|frontr|rearr|ftr|bkr|(?:door|wheel|wing|tire|tyre|caliper|mirror)[_\s-]*r(?:$|[^a-z])/i.test(name))return 'right';
    return null;
  }
  function slotFromName(name){
    const axle=/front|ft[lr]|(?:^|[^a-z])ft|wheelft/i.test(name)?'F':/rear|bk[lr]|(?:^|[^a-z])bk|wheelbk/i.test(name)?'R':null,side=partSide(name);
    return axle&&side?`${axle}${side==='left'?'L':'R'}`:null;
  }
  function registryKey(kind,name,index) {
    const side=partSide(name), lower=name.toLowerCase(),slot=slotFromName(name);
    if(kind==='hood')return 'hood';
    if(kind==='frontBumper')return 'front';
    if(kind==='rearBumper')return 'rear';
    if(kind==='doors')return side?`door-${side}`:`door-${index+1}`;
    if(kind==='calipers')return slot?`caliper-${slot}`:'caliper-assembly';
    if(kind==='suspension')return slot?`suspension-${slot}`:side?`suspension-${side}`:`suspension-${index+1}`;
    if(kind==='body')return 'body-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if(kind==='wings'){
      const axle=/front/i.test(lower)?'front':/rear/i.test(lower)?'rear':'main';
      return side?`${axle}-wing-${side}`:`${axle}-wing`;
    }
    return `${kind}-${index+1}`;
  }
  function createPartRegistry(modelId,root,wheels,byKind,register) {
    const categories={wheels:wheels.map(part=>({modelId,kind:'wheel',key:part.slot,name:part.name,slot:part.slot,axle:part.slot[0]==='F'?'front':'rear',side:part.slot[1]==='L'?'left':'right',node:part.node,nodes:[part.node],sourceNames:[part.sourceSlot],initialSourceNames:[part.sourceSlot],spin:part.spin,assembly:part.assembly,initialAssembly:part.assembly,initialTyres:tyreTargetsFor(part.spin),rollingRadius:part.spin.userData.rollingRadius,width:part.width,initialWidth:part.width,initialVisible:part.node.visible}))};
    for(const [kind,nodes] of Object.entries(byKind)){
      const groups=new Map();
      nodes.forEach((node,index)=>{
        const key=registryKey(kind,node.name,index);
        if(!groups.has(key))groups.set(key,{modelId,kind,key,name:key,side:partSide(node.name),slot:slotFromName(node.name),node:null,nodes:[],sourceNames:[],initialVisibility:[]});
        const part=groups.get(key);part.nodes.push(node);part.sourceNames.push(node.name);if(!part.node)part.node=node;
        part.initialVisibility.push(node.visible);
      });
      categories[kind]=[...groups.values()];
    }
    const allKinds=['body','hood','frontBumper','rearBumper','wings','doors','wheels','calipers','suspension'];
    for(const kind of allKinds)categories[kind]||=[];
    function find(kind,key){return (categories[kind]||[]).find(part=>part.key===key)||null;}
    function setVisible(kind,key,visible){const part=find(kind,key);if(!part)return false;part.visible=!!visible;
      if(kind==='wheels')part.node.visible=!!visible;
      else {for(const node of part.nodes)node.visible=part.replacementGroup?false:!!visible;if(part.replacementGroup)part.replacementGroup.visible=!!visible;}
      return true;
    }
    function reset(kind,key){const part=find(kind,key);if(!part)return false;
      if(kind==='wheels'){
        const spin=part.spin;writeTyreGeometry(spin,0);resetTyreTargets(part.initialTyres);
        if(part.assembly!==part.initialAssembly){part.assembly.removeFromParent();part.spin.add(part.initialAssembly);part.assembly=part.initialAssembly;setTyreTargets(spin,part.initialTyres);spin.userData.rollingRadius=part.rollingRadius;spin.userData.authoredWheelName=part.initialSourceNames[0];spin.userData.visualBlowoutSeverity=0;part.node.userData.rollingRadius=part.rollingRadius;part.node.userData.authoredWheelName=part.initialSourceNames[0];part.width=part.initialWidth;part.sourceNames=[...part.initialSourceNames];}
        part.replacement=null;part.visible=undefined;part.node.visible=part.initialVisible;return true;
      }
      part.replacementGroup?.removeFromParent();part.replacementGroup=null;part.replacement=null;
      part.nodes.forEach((node,index)=>node.visible=part.initialVisibility[index]??true);part.visible=undefined;return true;
    }
    function swapWheel(target,source){
      if(!target||!source||target.kind!=='wheel'||source.kind!=='wheel'||target.slot!==source.slot)return {ok:false,reason:'Wheel swaps require the same physical FL/FR/RL/RR slot.'};
      const r0=target.spin.userData.rollingRadius,r1=source.spin.userData.rollingRadius;
      if(Math.abs(r0-r1)>.045||Math.abs(target.width-source.width)>.12)return {ok:false,reason:'Wheel dimensions exceed the fit tolerance for this slot.'};
      const sourceSeverity=Number(source.spin.userData.visualBlowoutSeverity)||0;
      writeTyreGeometry(source.spin,0);
      const clone=source.assembly.clone(true);clone.name=`${target.slot}-replacement-from-${source.spin.userData.authoredWheelName||source.slot}`;
      clone.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
      target.assembly.removeFromParent();target.spin.add(clone);target.assembly=clone;
      setTyreTargets(target.spin,[]);target.spin.userData.visualBlowoutSeverity=0;
      target.spin.userData.rollingRadius=r1;target.spin.userData.authoredWheelName=source.spin.userData.authoredWheelName;
      target.node.userData.rollingRadius=r1;target.node.userData.authoredWheelName=source.spin.userData.authoredWheelName;
      root.updateMatrixWorld(true);tyreTargets(target.spin,clone,register);applyTyreSeverity(source.spin,sourceSeverity);
      target.spin.userData.visualBlowoutSeverity=0;target.sourceNames=[source.spin.userData.authoredWheelName||source.slot];target.width=source.width;
      target.replacement={sourceModelId:source.modelId,sourceKey:source.slot,sourceNames:[...target.sourceNames]};
      return {ok:true,from:source.slot,sourceModelId:source.modelId,sourceNames:[...target.sourceNames]};
    }
    function swap(kind,key,sourceRegistry,sourceKey=key){
      const target=find(kind,key),source=sourceRegistry?.get(kind,sourceKey);if(!target||!source)return {ok:false,reason:'Part group is not available in both assets.'};
      if(kind==='wheels')return swapWheel(target,source);
      if(!['body','hood','frontBumper','rearBumper','wings','doors'].includes(kind))return {ok:false,reason:'This part group is visibility-only.'};
      if(!target.nodes.length||!source.nodes.length)return {ok:false,reason:'This model has no authored mesh for that part group.'};
      target.replacementGroup?.removeFromParent();root.updateMatrixWorld(true);sourceRegistry.root.updateMatrixWorld(true);
      const inverse=sourceRegistry.root.matrixWorld.clone().invert(),replacement=new THREE.Group();replacement.name=`${kind}-${key}-replacement`;replacement.visible=target.visible??true;
      for(const node of source.nodes){node.updateWorldMatrix(true,false);const relative=new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld),copy=node.clone(true);relative.decompose(copy.position,copy.quaternion,copy.scale);copy.matrixAutoUpdate=true;copy.updateMatrix();replacement.add(copy);}
      for(const node of target.nodes)node.visible=false;root.add(replacement);target.replacementGroup=replacement;target.replacement={sourceModelId:sourceRegistry.modelId,sourceKey,nodeNames:[...source.sourceNames]};
      return {ok:true,kind,key,sourceModelId:sourceRegistry.modelId,sourceKey,nodes:[...source.sourceNames]};
    }
    return {
      modelId,root,categories,get:find,setVisible,swap,reset,
      snapshot(){return Object.fromEntries(allKinds.map(kind=>[kind,categories[kind].map(({key,name,side,slot,axle,sourceNames,replacement})=>({key,name,side:side||null,slot:slot||null,axle:axle||null,sourceNames:[...sourceNames],available:true,replacement:replacement||null}))]));},
    };
  }

  function tyreTargets(spin,wheel,register) {
    const meshes=[];wheel.traverse(node=>{if(node.isMesh)meshes.push(node);});
    const named=meshes.filter(node=>/(tire|tyre|rubber|black[_ -]?rough)/i.test(node.name)||
      (Array.isArray(node.material)?node.material:[node.material]).some(material=>/(tire|tyre|rubber)/i.test(material?.name||'')));
    let chosen=named;
    if(!chosen.length){
      const clear=meshes.filter(node=>!/(brake|caliper|disc|rotor|pad|spoke|hub|rim|bolt|logo|suspension)/i.test(node.name));
      const candidates=clear.length?clear:meshes;
      const radialSize=node=>{node.geometry.computeBoundingBox();const s=node.geometry.boundingBox?.getSize(new THREE.Vector3());return s?([s.x,s.y,s.z].sort((a,b)=>b-a)[1]||0):0;};
      let largest=0;for(const node of candidates)largest=Math.max(largest,radialSize(node));
      chosen=candidates.filter(node=>radialSize(node)>=largest*.88&&largest>0);
    }
    const deformTargets=[];
    for(const mesh of chosen){
      const geometry=mesh.geometry.clone();geometry.computeBoundingBox();mesh.geometry=geometry;register('geometry',geometry);
      const position=geometry.getAttribute('position');if(!position)continue;
      const base=new Float32Array(position.count*3),spinPoints=new Float32Array(position.count*3),point=new THREE.Vector3();
      const spinFromMesh=new THREE.Matrix4().copy(spin.matrixWorld).invert().multiply(mesh.matrixWorld);
      const meshFromSpin=new THREE.Matrix4().copy(mesh.matrixWorld).invert().multiply(spin.matrixWorld);
      const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<position.count;i++){
        const o=i*3,x=position.getX(i),y=position.getY(i),z=position.getZ(i);base[o]=x;base[o+1]=y;base[o+2]=z;
        point.set(x,y,z).applyMatrix4(spinFromMesh);spinPoints[o]=point.x;spinPoints[o+1]=point.y;spinPoints[o+2]=point.z;
        lo[0]=Math.min(lo[0],point.x);lo[1]=Math.min(lo[1],point.y);lo[2]=Math.min(lo[2],point.z);hi[0]=Math.max(hi[0],point.x);hi[1]=Math.max(hi[1],point.y);hi[2]=Math.max(hi[2],point.z);
      }
      const matrix=meshFromSpin.elements;
      mesh.userData.carPartSemantic='tire';deformTargets.push({mesh,geometry,position,base,spinPoints,matrix:Array.from(matrix),count:position.count,
        centerX:(lo[0]+hi[0])*.5,centerY:(lo[1]+hi[1])*.5,centerZ:(lo[2]+hi[2])*.5,
        radiusY:Math.max(.01,(hi[1]-lo[1])*.5),radiusZ:Math.max(.01,(hi[2]-lo[2])*.5),lastSeverity:0});
    }
    setTyreTargets(spin,deformTargets);
  }

  function applyTyreSeverity(spin,severity) {
    const amount=Math.max(0,Math.min(1,Number(severity)||0)),old=tyreStateBySpin.get(spin)?.visualSeverity||0;
    if(Math.abs(amount-old)<.0005&&amount>=.0005)return;
    writeTyreGeometry(spin,amount<.0005?0:amount);
  }

  function writeTyreGeometry(spin,severity){
    const amount=Math.max(0,Math.min(1,Number(severity)||0));
    for(const target of tyreTargetsFor(spin)){
      if(amount<.0005){
        for(let i=0;i<target.count;i++)target.position.setXYZ(i,target.base[i*3],target.base[i*3+1],target.base[i*3+2]);
      }else{
        const e=target.matrix,radialScale=1-.20*amount;
        for(let i=0;i<target.count;i++){
          const o=i*3,x=target.spinPoints[o],y=target.centerY+(target.spinPoints[o+1]-target.centerY)*radialScale,z=target.centerZ+(target.spinPoints[o+2]-target.centerZ)*radialScale;
          target.position.setXYZ(i,e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]);
        }
      }
      target.position.needsUpdate=true;target.geometry.computeVertexNormals();target.geometry.computeBoundingBox();target.geometry.computeBoundingSphere();target.lastSeverity=amount;
    }
    spin.userData.visualBlowoutSeverity=amount;const state=tyreStateBySpin.get(spin);if(state)state.visualSeverity=amount;
  }

  function resetTyreTargets(targets){for(const target of targets||[]){for(let i=0;i<target.count;i++)target.position.setXYZ(i,target.base[i*3],target.base[i*3+1],target.base[i*3+2]);target.position.needsUpdate=true;target.geometry.computeVertexNormals();target.geometry.computeBoundingBox();target.geometry.computeBoundingSphere();}}

  function updateTyres(wheels,racer,dt) {
    const active=Number.isInteger(Number(racer.tyreBlowoutWheel))?Number(racer.tyreBlowoutWheel):-1;
    const severity=Math.max(0,Math.min(1,Number(racer.tyreBlowoutSeverity)||0)),step=Math.max(0,Math.min(.1,Number(dt)||0));
    const blend=step>0?1-Math.exp(-6*step):0;
    for(const spin of wheels){
      const target=spin.userData.wheelIndex===active?severity:0,previous=tyreStateBySpin.get(spin)?.visualSeverity||0;
      applyTyreSeverity(spin,previous+(target-previous)*blend);
    }
  }
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
  // Failed loads leave the procedural car available until a matching authored model attaches.
  const ready=Promise.resolve();
  async function attach(state,index) {
    if(state.form||state.racer.racerType==='monster-truck')return false;
    const spec=RACE_CAR_ASSETS.find(s=>s.id===state.racer.racerType)||(!state.racer.racerType?RACE_CAR_ASSETS[(index%3)+2]:null);
    if(!spec)return false;
    const source=await template(spec);
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
    const rootByName=new Map();normalized.traverse(node=>{if(Object.values(spec.wheelNodes||{}).includes(node.name))rootByName.set(node.name,node);});
    const sourceWheelNodes=wheelSlots.map(sourceSlot=>({sourceSlot,name:spec.wheelNodes?.[sourceSlot],node:rootByName.get(spec.wheelNodes?.[sourceSlot])}));
    if(sourceWheelNodes.length!==4||sourceWheelNodes.some(w=>!w.node)||new Set(sourceWheelNodes.map(w=>w.node)).size!==4){
      errors.push({id:spec.id,message:`Expected four unique authored wheel pivot nodes (${wheelSlots.map(s=>spec.wheelNodes?.[s]||s).join(', ')}).`});
      return false;
    }
    const orderedWheelNodes=sourceWheelNodes.map(w=>{const center=normalized.worldToLocal(w.node.getWorldPosition(new THREE.Vector3()));const physicalSlot=`${center.z>0?'F':'R'}${center.x<0?'L':'R'}`;return {...w,center,slot:physicalSlot};}).sort((a,b)=>slotIndex[a.slot]-slotIndex[b.slot]);
    const spins=[],steering=[],mounts=[],wheelPartEntries=[];
    for(const {slot,name:sourceName,node:wheel,center:measuredCenter} of orderedWheelNodes) {
      // Keep the authored axle origin. A mesh bounding-box centre can differ
      // from the true hub (calipers and asymmetric spokes are not axle pivots).
      const wb=new THREE.Box3().setFromObject(wheel), wheelSize=wb.getSize(new THREE.Vector3());
      const center=measuredCenter;
      const steer=new THREE.Group();steer.name=sourceName;steer.position.copy(center);steer.userData.carPartSemantic='wheel-pivot';normalized.add(steer);
      const spin=new THREE.Group();spin.name=`${sourceName}-spin`;steer.add(spin);normalized.updateMatrixWorld(true);
      spin.attach(wheel);wheel.name=`${sourceName}-wheel-assembly`;
      normalized.updateMatrixWorld(true);
      spin.userData.rollingRadius=Math.max(.12,wheelSize.y*.5);
      spin.userData.axle=center.z>0?'front':'rear';
      spin.userData.authoredWheelName=sourceName;
      spin.userData.wheelIndex=slotIndex[slot];
      steer.userData.wheelId=`${center.z>0?'front':'rear'}-${center.x<0?'left':'right'}`;
      steer.userData.rollingRadius=spin.userData.rollingRadius;
      steer.userData.authoredWheelName=sourceName;steer.userData.wheelSlot=slot;steer.userData.sourceWheelPosition=[center.x,center.y,center.z];
      tyreTargets(spin,wheel,registerResource);
      steer.userData.tyreTargetNames=tyreTargetsFor(spin).map(target=>target.mesh.name);
      spins.push(spin);mounts.push(steer);wheelPartEntries.push({node:steer,name:sourceName,sourceSlot:sourceName,slot,kind:'wheel',spin,assembly:wheel,width:wheelSize.x});if(center.z>0)steering.push(steer);
    }
    // Reparent each individually authored brake caliper to its nearest measured
    // hub. They stay outside the rolling wheel assembly and retain world pose.
    normalized.updateMatrixWorld(true);
    const unassignedCalipers=[];
    const namedCalipers=[];normalized.traverse(node=>{if(node.isMesh&&/caliper|brakepad/i.test(node.name))namedCalipers.push(node);});
    for(const caliper of namedCalipers){
      caliper.updateWorldMatrix(true,false);
      const box=new THREE.Box3().setFromObject(caliper),size=box.getSize(new THREE.Vector3()),center=normalized.worldToLocal(box.getCenter(new THREE.Vector3()));
      const maxSize=Math.max(size.x,size.y,size.z),slots=wheelPartEntries;
      let target=slots.find(part=>part.slot===slotFromName(caliper.name));
      const nearest=slots.map(part=>({part,distance:Math.hypot(center.x-part.node.userData.sourceWheelPosition[0],center.z-part.node.userData.sourceWheelPosition[2])})).sort((a,b)=>a.distance-b.distance)[0];
      // A single mesh spanning multiple brakes/body panels is kept as one
      // authored assembly; it cannot be assigned honestly to one wheel.
      if(maxSize>1.2){unassignedCalipers.push(caliper.name);continue;}
      if(nearest&&nearest.distance<.85)target=nearest.part;
      if(!target&&nearest&&nearest.distance<.95)target=nearest.part;
      if(!target){unassignedCalipers.push(caliper.name);continue;}
      target.node.attach(caliper);caliper.userData.carPartSemantic='caliper';caliper.userData.wheelSlot=target.slot;
      target.calipers||=[];target.calipers.push(caliper);
    }
    for(const part of wheelPartEntries){
      part.node.userData.caliperNames=(part.calipers||[]).map(node=>node.name);
      part.node.userData.caliperCount=(part.calipers||[]).length;
    }
    normalized.updateMatrixWorld(true);
    const byKind=Object.fromEntries(semanticRules.map(([kind])=>[kind,[]]));
    const wheelRoots=new Set(orderedWheelNodes.map(w=>w.node));
    normalized.traverse(node=>{
      if(!node.isMesh)return;
      let parent=node.parent,insideWheel=false;while(parent){if(wheelRoots.has(parent)){insideWheel=true;break;}parent=parent.parent;}if(insideWheel)return;
      for(const [kind,pattern] of semanticRules){if(pattern.test(node.name)){node.userData.carPartSemantic=kind;byKind[kind].push(node);}}
    });
    const authoredParts={modelId:spec.id,wheels:wheelPartEntries,byKind};
    authoredParts.registry=createPartRegistry(spec.id,normalized,wheelPartEntries,byKind,registerResource);
    authoredParts.update=(racer,dt)=>updateTyres(spins,racer,dt);
    authoredParts.snapshot=()=>authoredParts.registry.snapshot();
    const authoredPartNames=Object.fromEntries(Object.entries(byKind).map(([kind,nodes])=>[kind,nodes.map(node=>node.name)]));
    const finish=createCarFinish(THREE,normalized,spec,state.primaryHex,registerResource);
    const chassis=state.car.getObjectByName('chassis-motion');
    if(!chassis)return false;
    // Leave the procedural car visible while an authored shader variant links.
    // Slow or missing assets never prevent the existing car from racing.
    await prepareAsset?.(normalized);
    if (isDisposed()) return false;
    for(const child of chassis.children)child.visible=false;
    for(const wheel of state.wheelMounts)wheel.visible=false;
    // Unsprung tyres belong to the rigid car frame, not the sprung shell.
    // The old hierarchy made all four tyres rise and tilt with body weight
    // transfer, leaving them visibly floating above the deck in acceleration.
    for(const mount of mounts){normalized.remove(mount);state.car.add(mount);}
    normalized.position.y=-.47;chassis.add(normalized);
    // Real hubs leave the sprung body so its load-transfer flex cannot float tyres.
    for(const mount of mounts){const center=mount.position.clone();(state.detailGroup||state.car).add(mount);mount.position.copy(center);}
    state.wheelMounts.splice(0,state.wheelMounts.length,...mounts);
    state.wheelSpin.splice(0,state.wheelSpin.length,...spins);
    state.steeringPivots.splice(0,state.steeringPivots.length,...steering);
    state.motion.configureWheels();
    state.authoredVisuals=finish;state.authoredParts=authoredParts;finish.update(state.racer);
    // Anchors are car-local, measured from the normalized source shell. Formula
    // has one central high exhaust; the road cars use low rear outlet pairs.
    const exhaustAnchors=spec.id==='tesla-roadster'?[]:spec.id==='f1-2026'?[[0,size.y*.56,-size.z*.45]]:
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
    Object.assign(state.car.userData,{assetId:spec.id,assetLabel:spec.label,assetLoaded:true,authoredWheelCount:spins.length,assetDimensions:{width:size.x,height:size.y,length:size.z},driverEye:[0,Math.min(1.15,size.y*.74),.25],exhaustAnchors,lampAnchors,paintIdentity:state.primaryHex,wheelRadii:spins.map(w=>w.userData.rollingRadius),wheelPivots:mounts.map(w=>({slot:w.userData.wheelSlot,name:w.name,hub:w.userData.sourceWheelPosition})),calipers:{attached:wheelPartEntries.reduce((n,p)=>n+(p.calipers?.length||0),0),unassigned:unassignedCalipers},authoredPartNames});
    return true;
  }
  return {attach,ready,errors};
}
