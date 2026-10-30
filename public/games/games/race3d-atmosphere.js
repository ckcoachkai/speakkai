/** A single atmospheric lighting rig; attach directly to scene, outside scaled world. */
export function createRaceAtmosphere(THREE, { scene, renderer, shadows = true, shadowSize=2048,skyWidth=1024 } = {}) {
  const previous = { background: scene.background, environment: scene.environment, fog: scene.fog };
  // A lower afternoon sun makes the light direction legible on bodywork and road.
  const direction = new THREE.Vector3(-0.59, 0.57, 0.57).normalize();
  const width = Math.max(128, Math.round(Number(skyWidth) || 1024)), height = Math.ceil(width/2);
  // Keep the sun resolvable on the deliberately small low-quality panorama.
  const sunRadius = Math.max(.014, Math.PI * 1.35 / width);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(width, height);
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
  const hash = (x,y) => { const v=Math.sin(x*127.1+y*311.7)*43758.5453; return v-Math.floor(v); };
  function noise(x,y) {
    const ix=Math.floor(x), iy=Math.floor(y), fx=smooth(0,1,x-ix), fy=smooth(0,1,y-iy);
    return (hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx)*(1-fy)+(hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx)*fy;
  }
  // Spherical coordinates match Three's equirectangular reflection lookup.
  for (let y=0;y<height;y++) {
    const latitude=Math.PI*(0.5-y/(height-1)), dy=Math.sin(latitude), radial=Math.cos(latitude);
    for(let x=0;x<width;x++) {
      const longitude=(x/(width-1)-0.5)*Math.PI*2;
      const dx=radial*Math.cos(longitude), dz=radial*Math.sin(longitude);
      const zenith=Math.pow(clamp(dy),0.42);
      // Blue zenith, pale warm horizon, subdued earth hemisphere for metal reflection.
      let r=202+(65-202)*zenith, g=217+(139-217)*zenith, b=223+(195-223)*zenith;
      if(dy<0) { const t=clamp(-dy*8); r=r*(1-t)+78*t; g=g*(1-t)+87*t; b=b*(1-t)+66*t; }
      const dot=dx*direction.x+dy*direction.y+dz*direction.z;
      const aureole=Math.pow(Math.max(0,dot),36)*34;
      r+=aureole; g+=aureole*0.72; b+=aureole*0.28;
      // Thin high-altitude broken cloud sheets, projected continuously across panorama seam.
      if(dy>0.035) {
        const px=dx/(dy+0.22)*3.2, pz=dz/(dy+0.22)*3.2;
        const n=noise(px,pz)*0.62+noise(px*2.1,pz*2.1)*0.25+noise(px*4.3,pz*4.3)*0.13;
        const cloud=smooth(0.54,0.74,n)*smooth(0.035,0.22,dy)*0.76;
        r=r*(1-cloud)+242*cloud; g=g*(1-cloud)+243*cloud; b=b*(1-cloud)+239*cloud;
      }
      const corona=Math.pow(Math.max(0,dot),320)*24;
      r+=corona; g+=corona*.75; b+=corona*.32;
      const disc=smooth(Math.cos(sunRadius*1.4),Math.cos(sunRadius*.75),dot);
      const i=(y*width+x)*4;
      pixels.data[i]=Math.min(255,r*(1-disc)+255*disc);
      pixels.data[i+1]=Math.min(255,g*(1-disc)+253*disc);
      pixels.data[i+2]=Math.min(255,b*(1-disc)+236*disc); pixels.data[i+3]=255;
    }
  }
  ctx.putImageData(pixels,0,0);
  const sky = new THREE.CanvasTexture(canvas);
  sky.colorSpace=THREE.SRGBColorSpace;
  sky.mapping=THREE.EquirectangularReflectionMapping;
  scene.background=sky;
  const fog = new THREE.FogExp2(0xcad9df, 0.0024);
  scene.fog=fog;
  let reflection=null;
  if(renderer) {
    const pmrem=new THREE.PMREMGenerator(renderer);
    try { reflection=pmrem.fromEquirectangular(sky); scene.environment=reflection.texture; }
    finally { pmrem.dispose(); }
  }
  const group=new THREE.Group(); group.name='race-atmosphere-lighting';
  const hemi=new THREE.HemisphereLight(0xc6deef,0x716854,0.58);
  const sun=new THREE.DirectionalLight(0xffe5bb,2.85);
  const sunDistance=120, shadowExtent=32;
  sun.position.copy(direction).multiplyScalar(sunDistance);
  sun.castShadow=shadows;
  const mapSize=Math.max(128,Math.round(Number(shadowSize)||2048));
  sun.shadow.mapSize.set(mapSize,mapSize);
  // World scale is .2: this covers a 320 m patch with twice the old texel detail.
  Object.assign(sun.shadow.camera,{left:-shadowExtent,right:shadowExtent,top:shadowExtent,bottom:-shadowExtent,near:1,far:260});
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias=-0.00008; sun.shadow.normalBias=0.012;
  sun.shadow.radius=1.5;
  group.add(hemi,sun,sun.target); scene.add(group);
  let disposed=false;
  const focus=new THREE.Vector3();
  const lightRight=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
  const lightUp=new THREE.Vector3().crossVectors(direction,lightRight).normalize();
  const texel=shadowExtent*2/mapSize;
  function update(target) {
    if(disposed || !target || !Number.isFinite(target.x) || !Number.isFinite(target.y) || !Number.isFinite(target.z)) return;
    // Input is a scene-space point (e.g. camera position), not unscaled track units.
    // Snap in the light's image plane, including elevation. Snapping world X/Z
    // alone shimmered on hills and kept the shadow volume at sea level.
    const horizontal=Math.round((target.x*lightRight.x+target.y*lightRight.y+target.z*lightRight.z)/texel)*texel;
    const vertical=Math.round((target.x*lightUp.x+target.y*lightUp.y+target.z*lightUp.z)/texel)*texel;
    const depth=target.x*direction.x+target.y*direction.y+target.z*direction.z;
    focus.copy(lightRight).multiplyScalar(horizontal).addScaledVector(lightUp,vertical).addScaledVector(direction,depth);
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(direction,sunDistance);
  }
  function dispose() {
    if(disposed) return; disposed=true;
    scene.remove(group);
    if(scene.background===sky) scene.background=previous.background;
    if(reflection && scene.environment===reflection.texture) scene.environment=previous.environment;
    if(scene.fog===fog) scene.fog=previous.fog;
    sun.shadow.dispose(); reflection?.dispose(); sky.dispose();
  }
  return { group, sun, update, dispose };
}
export default createRaceAtmosphere;

