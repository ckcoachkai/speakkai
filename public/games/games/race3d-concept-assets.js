const wheelNodes = Object.freeze({ FL:'WheelFrontL', FR:'WheelFrontR', RL:'WheelRearL', RR:'WheelRearR' });
const exactWheelPattern = /^Wheel(Front|Rear)[LR]$/;

// Authored fictional race-car concepts. Dimensions and source axes match each
// pack manifest; meshes stay as separate named objects after GLTF cloning.
export const RACE3D_CONCEPT_ASSETS = Object.freeze([
  { id:'concept-asterion',label:'Asterion Blade',url:new URL('../assets/race3d-concepts/pack-a/concept-asterion.glb',import.meta.url).href,yaw:0,length:4.88,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-helix',label:'Helix Sprint',url:new URL('../assets/race3d-concepts/pack-a/concept-helix.glb',import.meta.url).href,yaw:0,length:4.46,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-ion',label:'Ion Arrow',url:new URL('../assets/race3d-concepts/pack-a/concept-ion.glb',import.meta.url).href,yaw:0,length:5.12,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-vesper',label:'Vesper GT',url:new URL('../assets/race3d-concepts/pack-b/concept-vesper.glb',import.meta.url).href,yaw:0,length:5.308,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-tempest',label:'Tempest R',url:new URL('../assets/race3d-concepts/pack-b/concept-tempest.glb',import.meta.url).href,yaw:0,length:4.988,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-atlas',label:'Atlas Endurance',url:new URL('../assets/race3d-concepts/pack-b/concept-atlas.glb',import.meta.url).href,yaw:0,length:5.248,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-kestrel',label:'Kestrel Formula',url:new URL('../assets/race3d-concepts/pack-c/concept-kestrel.glb',import.meta.url).href,yaw:0,length:5,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-apex',label:'Apex Canopy',url:new URL('../assets/race3d-concepts/pack-c/concept-apex.glb',import.meta.url).href,yaw:0,length:5.025,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-vector',label:'Vector Groundforce',url:new URL('../assets/race3d-concepts/pack-c/concept-vector.glb',import.meta.url).href,yaw:0,length:5.12,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-aurora',label:'Aurora E',url:new URL('../assets/race3d-concepts/pack-d/concept-aurora.glb',import.meta.url).href,yaw:0,length:5.107,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-flux',label:'Flux R',url:new URL('../assets/race3d-concepts/pack-d/concept-flux.glb',import.meta.url).href,yaw:0,length:4.547,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-solstice',label:'Solstice Streamliner',url:new URL('../assets/race3d-concepts/pack-d/concept-solstice.glb',import.meta.url).href,yaw:0,length:5.387,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-obsidian',label:'Obsidian V12',url:new URL('../assets/race3d-concepts/pack-e/concept-obsidian.glb',import.meta.url).href,yaw:0,length:5.24,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-cinder',label:'Cinder Rally GT',url:new URL('../assets/race3d-concepts/pack-e/concept-cinder.glb',import.meta.url).href,yaw:0,length:4.94,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
  { id:'concept-meridian',label:'Meridian Hybrid',url:new URL('../assets/race3d-concepts/pack-e/concept-meridian.glb',import.meta.url).href,yaw:0,length:5.08,wheelPattern:exactWheelPattern,wheelNodes,fictional:true },
]);
