/** Per-car PBR tuning preserves the authored maps, UVs and vertex normals. */
export function createCarFinish(THREE, root, spec, primaryHex, registerResource) {
  const cache=new Map(), paint=[], brake=[], headlights=[];
  const identity=new THREE.Color(primaryHex), damage={value:0};
  const isPaint=m=>/paint|candy|basecoat|bodycolor|bodywork|carpaint|Nose & chassis finish/i.test(m.name)||spec.id==='gt3'&&m.name==='BODY';
  const isRubber=m=>/tire|tyre|rubber|wheel finish/i.test(m.name);
  function finish(source) {
    if(cache.has(source))return cache.get(source);
    let material=source;
    if(isPaint(source)) {
      material=source.isMeshPhysicalMaterial?source.clone():new THREE.MeshPhysicalMaterial();
      if(!source.isMeshPhysicalMaterial)THREE.MeshStandardMaterial.prototype.copy.call(material,source);
      // Paint 2 is the coupe's dark carbon trim; retain its original material.
      if(/Paint 2/i.test(source.name)){material.color.copy(source.color);material.roughness=.37;material.clearcoat=.34;}
      else {material.color.copy(identity);material.roughness=spec.id==='gt3'?.38:.27;material.metalness=spec.id==='gt3'?.32:.48;material.clearcoat=.92;}
      material.clearcoatRoughness=.16;
      material.envMapIntensity=1.15;
      // Surface scuffs appear with physics damage and vanish immediately after repair.
      // The source maps remain visible; no geometry or normal displacement is used.
      material.onBeforeCompile=shader=>{
        shader.uniforms.carDamage=damage;
        shader.vertexShader='varying vec3 vCarPaintPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarPaintPosition=position;');
        shader.fragmentShader='uniform float carDamage; varying vec3 vCarPaintPosition;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          float carStreak=step(.90,fract(vCarPaintPosition.y*47.0+sin(vCarPaintPosition.z*14.0)*.14));
          float carPatch=smoothstep(.25,.78,sin(vCarPaintPosition.x*16.0+vCarPaintPosition.z*5.0)*.5+.5);
          float carScuff=carStreak*carPatch*carDamage;
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.20,.21,.22),carScuff*.67);
        `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=min(1.0,roughnessFactor+carScuff*.55);');
      };
      material.customProgramCacheKey=()=> 'race-car-paint-scuff-v1';
      paint.push(material);
    } else if(isRubber(source)) {
      material=source.clone();material.roughness=Math.max(.73,source.roughness);material.metalness=0;material.envMapIntensity=.45;
    } else if(/glass/i.test(source.name)) {
      material=source.clone();material.transmission=0;material.transparent=true;
      material.opacity=spec.id==='car-concept'?.46:.70;material.depthWrite=false;material.roughness=.09;
      material.color.set('#637d8d');material.envMapIntensity=1.15;
    } else if(/brakelight|headlight/i.test(source.name)) {
      material=source.clone();
      if(/brake/i.test(source.name)){material.emissiveIntensity=.65;brake.push(material);}
      else {material.emissiveIntensity=3.2;headlights.push(material);}
    } else if(/suspension finish/i.test(source.name)) {
      material=source.clone();material.color.set('#343b40');material.roughness=.43;material.metalness=.62;
    }
    if(material!==source)registerResource('material',material);
    cache.set(source,material);return material;
  }
  root.traverse(node=>{if(node.isMesh)node.material=Array.isArray(node.material)?node.material.map(finish):finish(node.material);});
  return {
    update(racer) {
      damage.value=THREE.MathUtils.clamp(Number(racer.damage)||0,0,1);
      const braking=Number(racer.brake)>.08||Number(racer.acceleration)<-3;
      for(const material of brake)material.emissiveIntensity=braking?4.0:.65;
    },
    snapshot(){return {paintMaterials:paint.length,rubberMaterials:[...cache.keys()].filter(isRubber).length,brakeMaterials:brake.length,headlightMaterials:headlights.length,damage:damage.value};},
  };
}
