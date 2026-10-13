/** Original projectile PNGs and9-cell fruit particle atlas, plus botanical juice.
 * Coordinates are centers; scale follows the engine's logical plant/lawn scale.
 * Effects use a private seeded visual generator and never consume combat RNG.
 */
const GFX_TAU = Math.PI * 2;
const GFX_NUM = (value,fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const GFX_LIMIT = (value,min,max) => Math.max(min,Math.min(max,GFX_NUM(value,min)));
const GFX_KIND = {frost:'snow',snowpea:'snow',catapult:'melon',splash:'kernel',pierce:'spike',cactus:'spike',fireball:'fire'};
// Raw PNG sizes × reference Projectile::Draw scale × the corresponding plant rig scale.
// Winter and ordinary melon share the same original planted world scale.
const GFX_SIZE = {
  pea:[28*1.00715,28*1.00715],snow:[28*1.00355,28*1.00355],
  kernel:[21*.95*.87038,22*.95*.87038],butter:[49*.8*.87038,50*.8*.87038],
  melon:[55*.69586,48*.69586],wintermelon:[55*.69586,48*.69586],
  spike:[30*.86064,16*.86064],fire:[28*1.00715,28*1.00715]
};
const GFX_NORMALIZE = kind => GFX_KIND[String(kind).toLowerCase()] || String(kind||'pea').toLowerCase();
function GFX_RANDOM(seed) {
  let n=2166136261;
  for(const char of String(seed))n=Math.imul(n^char.charCodeAt(0),16777619);
  return () => {n=(n+0x6d2b79f5)|0;let v=Math.imul(n^(n>>>15),1|n);v^=v+Math.imul(v^(v>>>7),61|v);return ((v^(v>>>14))>>>0)/4294967296;};
}

export function drawGardenProjectile(ctx,{kind='pea',x=0,y=0,scale=1,time=0,progress=0,rotation,images,manifest}={}) {
  kind=GFX_NORMALIZE(kind);if(!GFX_SIZE[kind])kind='pea';
  const sizes=GFX_SIZE[kind],s=GFX_LIMIT(scale,.01,12),t=GFX_NUM(time),p=GFX_LIMIT(progress,0,1);
  const angle=rotation==null?(/melon|kernel|butter/.test(kind)?-.7-p*4.8:0):GFX_NUM(rotation);
  ctx.save();ctx.translate(GFX_NUM(x),GFX_NUM(y));ctx.scale(s,s);ctx.rotate(angle);
  const imageName=manifest?.fx?.[kind==='fire'?'pea':kind],img=images?.get(imageName);
  const w=sizes[0],h=sizes[1];
  if(kind==='fire') {
    // PvZ1 fireball is particle-driven. This flame envelope is an explicit
    // procedural fallback; ordinary/gatling/legacy fire shooters use green peas.
    ctx.fillStyle='#ffb837';ctx.beginPath();ctx.moveTo(-w*.15,-h*.3);
    ctx.lineTo(-w*(1.1+.08*Math.sin(t*24)),-h*.12);ctx.lineTo(-w*.65,0);
    ctx.lineTo(-w*.95,h*.17);ctx.lineTo(-w*.13,h*.32);ctx.closePath();ctx.fill();
  }
  if(img) {
    if(kind==='fire')ctx.filter='sepia(.85) saturate(2.3) hue-rotate(330deg)';
    // Full original sprite; no arbitrary rectangular full-body slicing.
    ctx.drawImage(img,-w/2,-h/2,w,h);
  } else {
    const colors={pea:'#78be3b',snow:'#67cdf1',kernel:'#f0c94e',butter:'#ffe995',melon:'#50a341',wintermelon:'#4dbbeb',spike:'#82ac3c',fire:'#ffb83e'};
    ctx.fillStyle=colors[kind];ctx.strokeStyle=kind==='wintermelon'?'#23728e':'#315f29';ctx.lineWidth=1.7;
    ctx.beginPath();ctx.ellipse(0,0,w*.46,h*.44,0,0,GFX_TAU);ctx.fill();ctx.stroke();
    if(kind==='melon'||kind==='wintermelon') {
      ctx.strokeStyle=kind==='melon'?'#236a2f':'#1681b5';ctx.lineWidth=2.2;
      for(const off of[-.24,0,.24]){ctx.beginPath();ctx.ellipse(off*w,0,w*.14,h*.42,0,-1.2,1.2);ctx.stroke();}
    }
    ctx.fillStyle='rgba(255,255,255,.64)';ctx.beginPath();ctx.ellipse(-w*.15,-h*.17,w*.1,h*.07,-.4,0,GFX_TAU);ctx.fill();
  }
  ctx.restore();return true;
}

export function createMelonImpact({x=0,y=0,row,lane,kind='melon',seed=0}={}) {
  kind=GFX_NORMALIZE(kind)==='wintermelon'?'wintermelon':'melon';
  const random=GFX_RANDOM(seed),pieces=[],stains=[];
  // Original emitter specifies15 fragments,9frames and a brief .5second burst.
  // Ballistics below are a deterministic browser adaptation of its choreography.
  for(let i=0;i<15;i++) {
    const theta=random()*GFX_TAU;
    pieces.push({frame:i<9?i:Math.floor(random()*9),vx:Math.cos(theta)*(42+random()*82),vy:-42-random()*112,
      rotation:random()*GFX_TAU,spin:(random()-.5)*17,size:.48+random()*.38,ground:6+random()*10});
  }
  for(let i=0;i<10;i++)stains.push({x:(random()-.5)*70,y:8+(random()-.5)*17,rx:2+random()*10,ry:1+random()*3,rotation:random()*GFX_TAU});
  return {kind,x:GFX_NUM(x),y:GFX_NUM(y),row,lane,seed:String(seed),duration:3,pieces,stains};
}

export function drawMelonImpact(ctx,impact,{x=impact?.x,y=impact?.y,scale=1,age=0,images,manifest}={}) {
  if(!impact?.pieces||!impact?.stains)return false;
  const t=Math.max(0,GFX_NUM(age)),duration=GFX_NUM(impact.duration,3);
  if(t>=duration)return false;
  const winter=impact.kind==='wintermelon',s=GFX_LIMIT(scale,.01,12);
  const sheetName=manifest?.fx?.[winter?'winterParticles':'melonParticles'],sheet=images?.get(sheetName),asset=manifest?.assets?.[sheetName];
  const size=GFX_SIZE[impact.kind]||GFX_SIZE.melon;
  ctx.save();ctx.translate(GFX_NUM(x),GFX_NUM(y));ctx.scale(s,s);
  // Botanical red juice or icy blue juice, kept close to the actual ground hit.
  ctx.globalAlpha*=Math.min(1,(duration-t)/.65)*Math.min(1,.25+t*9);
  for(const stain of impact.stains) {
    ctx.fillStyle=winter?'rgba(74,179,221,.58)':'rgba(157,34,40,.57)';
    ctx.beginPath();ctx.ellipse(stain.x,stain.y,stain.rx,stain.ry,stain.rotation,0,GFX_TAU);ctx.fill();
  }
  ctx.restore();
  if(t>.9)return true;
  ctx.save();ctx.translate(GFX_NUM(x),GFX_NUM(y));ctx.scale(s,s);
  const fade=GFX_LIMIT((.9-t)/.22,0,1);ctx.globalAlpha*=fade;
  if(t<.11) {
    drawGardenProjectile(ctx,{kind:impact.kind,x:0,y:0,scale:1,rotation:0,images,manifest});
    // A short crack overlay precedes distinct original rind/flesh fragments.
    ctx.strokeStyle=winter?'#d3fcff':'#fee6ae';ctx.lineWidth=1.9;
    ctx.beginPath();ctx.moveTo(-size[0]*.2,-size[1]*.4);ctx.lineTo(1,-2);ctx.lineTo(-4,5);ctx.lineTo(size[0]*.26,size[1]*.37);ctx.stroke();
  }
  for(const piece of impact.pieces) {
    const tt=Math.max(0,t-.045),px=piece.vx*tt*Math.exp(-tt*.6);
    const py=Math.min(piece.ground,piece.vy*tt+190*tt*tt);
    ctx.save();ctx.translate(px,py);ctx.rotate(piece.rotation+piece.spin*tt);
    const w=25.7*piece.size;
    if(sheet) {
      const cell=Math.floor(GFX_NUM(asset?.frameWidth,sheet.naturalWidth/9)),h=GFX_NUM(asset?.height,sheet.naturalHeight);
      // Authored9-cell particle atlas, not sliced character artwork. The final
      // padding column stays unused exactly as integer cel-width rendering does.
      ctx.drawImage(sheet,piece.frame*cell,0,cell,h,-w/2,-w/2,w,w);
    } else {
      ctx.fillStyle=piece.frame<7?(winter?'#e1f9ff':'#db4c4a'):(winter?'#72d5eb':'#b82836');
      ctx.strokeStyle=winter?'#229bc2':'#377b35';ctx.lineWidth=2.4;
      ctx.beginPath();ctx.moveTo(-w*.42,-w*.25);ctx.lineTo(w*.28,-w*.4);ctx.lineTo(w*.42,w*.3);ctx.lineTo(-w*.29,w*.43);ctx.closePath();ctx.fill();ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();return true;
}

export function createGardenFX({artwork={}}={}) {
  let GFX_manifest=null,GFX_closed=false,GFX_loading=true,GFX_error=null;
  const GFX_images=new Map(),GFX_failed=new Set(),GFX_pending=new Set();
  const GFX_controller=typeof AbortController==='function'?new AbortController():null;
  const GFX_url=artwork.gardenExtra||'assets/garden-extra.json';
  const GFX_base=typeof document!=='undefined'?document.baseURI:'http://localhost/';
  const GFX_loadImage=name=>new Promise(resolve=>{
    if(GFX_closed||typeof Image!=='function'){resolve();return;}
    const finish=()=>{GFX_pending.delete(finish);resolve();};GFX_pending.add(finish);
    const img=new Image();
    img.onload=()=>{img.onload=img.onerror=null;if(!GFX_closed&&img.naturalWidth>0&&img.naturalHeight>0)GFX_images.set(name,img);else if(!GFX_closed)GFX_failed.add(name);finish();};
    img.onerror=()=>{img.onload=img.onerror=null;if(!GFX_closed)GFX_failed.add(name);finish();};
    // Keep an in-flight reference so destroy clears handlers as well as settled images.
    GFX_inflight.add(img);
    const loaded=img.onload,failed=img.onerror;
    img.onload=()=>{GFX_inflight.delete(img);loaded();};img.onerror=()=>{GFX_inflight.delete(img);failed();};
    try{const a=GFX_manifest.assets[name];img.src=new URL(a.url||name,new URL(GFX_url,GFX_base)).href;}catch{img.onerror();}
  });
  const GFX_inflight=new Set();
  (async()=>{
    try {
      if(typeof Image!=='function')return;
      GFX_manifest=artwork.gardenExtraManifest||await(await fetch(GFX_url,GFX_controller?{signal:GFX_controller.signal}:{})).json();
      if(GFX_closed)return;
      if(!artwork.gardenExtraManifest&&GFX_manifest.assetPacks?.length){const packs=await Promise.all(GFX_manifest.assetPacks.map(async file=>(await fetch(new URL(file,new URL(GFX_url,GFX_base)),GFX_controller?{signal:GFX_controller.signal}:{})).json()));GFX_manifest.assets=Object.assign({},GFX_manifest.assets,...packs.map(pack=>pack.assets));}
      if(GFX_manifest.version!==1||!GFX_manifest.assets||!GFX_manifest.fx)throw Error('Invalid Garden FX manifest');
      await Promise.all([...new Set(Object.values(GFX_manifest.fx))].map(GFX_loadImage));
    }catch(e){if(!GFX_closed)GFX_error=String(e.message||e);}
    finally{GFX_loading=false;}
  })();
  return {
    drawProjectile(ctx,opts={}){if(GFX_closed)return false;return drawGardenProjectile(ctx,{...opts,images:GFX_images,manifest:GFX_manifest});},
    createMelonImpact,
    drawImpact(ctx,impact,opts={}){if(GFX_closed)return false;return drawMelonImpact(ctx,impact,{...opts,images:GFX_images,manifest:GFX_manifest});},
    destroy(){if(GFX_closed)return;GFX_closed=true;GFX_controller?.abort();for(const img of[...GFX_images.values(),...GFX_inflight]){img.onload=img.onerror=null;try{img.src='';}catch{}}for(const finish of GFX_pending)finish();GFX_images.clear();GFX_inflight.clear();GFX_failed.clear();GFX_manifest=null;},
    getState(){return{ready:!GFX_closed&&!GFX_loading&&!!GFX_manifest&&!GFX_error&&GFX_failed.size===0,loading:!GFX_closed&&GFX_loading,closed:GFX_closed,images:GFX_images.size,totalImages:GFX_manifest?.fx?new Set(Object.values(GFX_manifest.fx)).size:0,failed:[...GFX_failed],error:GFX_error};}
  };
}
