import * as THREE from './three.module.js';
import {MATERIAL_TEXTURES} from './texture-assets.js?v=20261012-textures';

// Photographic CC0 PBR surfaces. World-space projection keeps aggregate, brick
// courses and seams the same physical size on merged geometry and instances.
export function createPhotoMaterials(){
  const loader=new THREE.TextureLoader(),cache=new Map(),pending=[],failures=[];
  function texture(family,channel){
    const key=family+'/'+channel;if(cache.has(key))return cache.get(key);
    const url=MATERIAL_TEXTURES[family]?.[channel];if(!url)return null;
    let resolve;const promise=new Promise(r=>resolve=r);pending.push(promise);
    const t=loader.load(url,()=>resolve(true),undefined,()=>{failures.push(key);resolve(false);});
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;
    t.colorSpace=channel==='albedo'?THREE.SRGBColorSpace:THREE.NoColorSpace;
    cache.set(key,t);return t;
  }
  function maps(material,family,strength){
    material.normalMap=texture(family,'normal');material.roughnessMap=texture(family,'roughness');
    material.normalScale.set(strength,strength);material.roughness=1;material.needsUpdate=true;
  }
  function remapNormalRoughness(shader,mask=null){
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',THREE.ShaderChunk.normal_fragment_begin.replaceAll('vNormalMapUv','citySurfaceUV'));
    let normalChunk=THREE.ShaderChunk.normal_fragment_maps.replaceAll('vNormalMapUv','citySurfaceUV');
    if(mask)normalChunk=normalChunk.replace('mapN.xy *= normalScale;',`mapN.xy *= normalScale * (1.0-${mask});`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',normalChunk);
    let roughnessChunk=THREE.ShaderChunk.roughnessmap_fragment.replaceAll('vRoughnessMapUv','citySurfaceUV');
    if(mask)roughnessChunk+=`\nroughnessFactor=mix(max(.64,roughnessFactor),.24,${mask});`;
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',roughnessChunk);
  }
  function applySurface(material,family,metres=3,strength=.3,{paintMap=null}={}){
    const albedo=texture(family,'albedo');if(!albedo)return material;
    material.map=paintMap||albedo;maps(material,family,strength);
    material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 citySurfaceWorld;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec4 citySurfacePosition=vec4(position,1.0);
        #ifdef USE_INSTANCING
        citySurfacePosition=instanceMatrix*citySurfacePosition;
        #endif
        citySurfaceWorld=(modelMatrix*citySurfacePosition).xyz;
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 citySurfaceWorld;');
      let colorChunk=THREE.ShaderChunk.map_fragment.replaceAll('vMapUv',paintMap?'vMapUv':'citySurfaceUV');
      // Pale painted plaster retains photographic weathering and relief while
      // bringing the source's aged tan tint toward a neutral exterior coating.
      if(family==='plaster')colorChunk=colorChunk.replace('diffuseColor *= sampledDiffuseColor;',`sampledDiffuseColor.rgb=mix(vec3(dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722))),sampledDiffuseColor.rgb,.30)*2.0; diffuseColor *= sampledDiffuseColor;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        vec3 citySurfaceAxis=abs(normalize(cross(dFdx(citySurfaceWorld),dFdy(citySurfaceWorld))));
        vec2 citySurfaceUV=citySurfaceAxis.y>.5?citySurfaceWorld.xz:(citySurfaceAxis.x>citySurfaceAxis.z?citySurfaceWorld.zy:citySurfaceWorld.xy);
        citySurfaceUV/= ${Number(metres).toFixed(3)};
        ${colorChunk}
      `);
      remapNormalRoughness(shader);
    };
    material.customProgramCacheKey=()=>`photo-${paintMap?'paint':'surface'}-v2-${family}-${metres}`;
    return material;
  }
  function applyMasonry(material,family='masonry',metres=2,strength=.32){
    const albedo=texture(family,'albedo');if(!albedo)return material;
    maps(material,family,strength);const prior=material.onBeforeCompile;
    material.onBeforeCompile=shader=>{
      prior(shader);
      shader.uniforms.cityMasonryColor={value:albedo};
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D cityMasonryColor;');
      shader.fragmentShader=shader.fragmentShader.replace('vec2 cityCells=cityUV/cityPitch;',`vec2 cityCells=cityUV/cityPitch; vec2 citySurfaceUV=cityUV/${Number(metres).toFixed(3)};`);
      shader.fragmentShader=shader.fragmentShader.replace('diffuseColor*=cityTex;',`
        float cityWindowMask=step(.245,cityFraction.x)*step(cityFraction.x,.755)*step(.205,cityFraction.y)*step(cityFraction.y,.845);
        vec3 masonryColor=texture2D(cityMasonryColor,citySurfaceUV).rgb;
        ${family==='plaster'?'masonryColor=mix(vec3(dot(masonryColor,vec3(.2126,.7152,.0722))),masonryColor,.30)*2.0;':''}
        cityTex.rgb=mix(masonryColor,cityTex.rgb,cityWindowMask);
        diffuseColor*=cityTex;
      `);
      remapNormalRoughness(shader,'cityWindowMask');
    };
    material.customProgramCacheKey=()=>`photo-masonry-v2-${family}-${metres}`;
    return material;
  }
  return {applySurface,applyMasonry,get ready(){return Promise.all(pending);},get failures(){return [...failures];},dispose(){for(const t of cache.values())t.dispose();}};
}
