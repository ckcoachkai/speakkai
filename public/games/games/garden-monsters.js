/** Three original garden giants. This renderer owns presentation only: no combat,
 * spawn schedule, forced outcome, or combat random-number consumption.
 * A complete generated silhouette is kept intact while it breathes and sways.
 */
const GM_NUM = (v,fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const GM_CLAMP = (v,a,b) => Math.max(a,Math.min(b,GM_NUM(v,a)));
const GM_TAU = Math.PI*2;
export const GARDEN_MONSTER_TYPES = Object.freeze([
  Object.freeze({id:'mossbell',name:'Mossbell Colossus',height:370,normalHeight:112,color:'#879c4d',glow:'#e7d88d'}),
  Object.freeze({id:'bramblecrab',name:'Bramblecrab',height:370,normalHeight:112,color:'#6c8152',glow:'#dcb76a'}),
  Object.freeze({id:'scrapjaw',name:'Scrapjaw',height:370,normalHeight:112,color:'#8a8d83',glow:'#c6e798'})
]);
function GM_TYPE(id,type,monsterId) {
  const candidate=String(monsterId||type?.monsterId||type?.id||(typeof type==='string'?type:'')||id||'mossbell').toLowerCase().replace(/[^a-z]/g,'');
  return GARDEN_MONSTER_TYPES.find(t=>candidate.includes(t.id))||GARDEN_MONSTER_TYPES[0];
}
function GM_ELLIPSE(ctx,x,y,rx,ry,color,angle=0) {
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,GM_TAU);ctx.fill();
}
function GM_LIMB(ctx,x,y,angle,length,width,color,tip) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length*.53,8);ctx.lineTo(length,0);ctx.stroke();
  GM_ELLIPSE(ctx,length*.53,8,width*.62,width*.62,color);
  if(tip)tip(ctx,length,0);ctx.restore();
}
function GM_FALLBACK(ctx,type,time,bite) {
  // Original procedural silhouettes are the loading/failure fallback. Their
  // separate attached limbs have small joint rotations and remain connected.
  const step=Math.sin(time*1.9),breath=Math.sin(time*1.2),chomp=GM_CLAMP(bite,0,1);
  ctx.strokeStyle='#27352a';ctx.lineWidth=5;
  if(type.id==='mossbell') {
    for(const side of[-1,1]) {
      GM_LIMB(ctx,side*42,-82,side<0?1.96+.04*step:1.18-.04*step,77,28,'#566546');
      GM_ELLIPSE(ctx,side*55,-12,40,14,'#394a35');
      GM_LIMB(ctx,side*68,-226,side<0?2.05-.06*step:1.08+.06*step,107,20,'#6c7850',(c,x,y)=>{
        GM_ELLIPSE(c,x,y,18,25,'#536542');for(let i=0;i<3;i++)GM_LIMB(c,x-5+i*5,y,1.12+i*.21,24,6,'#50623f');
      });
    }
    GM_ELLIPSE(ctx,0,-157,67,125,'#697d48');GM_ELLIPSE(ctx,-14,-169,40,96,'#829158');
    ctx.fillStyle='#536441';ctx.beginPath();ctx.moveTo(-113,-266);ctx.bezierCurveTo(-104,-367,84,-398,111,-270);ctx.quadraticCurveTo(0,-224,-113,-266);ctx.fill();
    GM_ELLIPSE(ctx,0,-270,111,25,'#b9af70');
    for(const[x,y,r]of[[-55,-312,15],[18,-338,20],[66,-304,11]])GM_ELLIPSE(ctx,x,y,r,r*.5,'#b8b38a',-.2);
    GM_ELLIPSE(ctx,0,-245,45,38+chomp*9,'#25392d');
    GM_ELLIPSE(ctx,0,-242,28,21+chomp*7,'#e1d082');
    for(const side of[-1,1])GM_ELLIPSE(ctx,side*25,-278,8,6,'#fff0b4');
    for(let i=0;i<6;i++)GM_ELLIPSE(ctx,-49+i*19,-100+(i%2)*17,5,17,'#adc174',.3);
  } else if(type.id==='bramblecrab') {
    for(const side of[-1,1])for(let i=0;i<4;i++) {
      const originX=side*(36+i*8),originY=-118-i*20;
      GM_LIMB(ctx,originX,originY,side<0?2.28+i*.13+.03*step:1.0-i*.13-.03*step,125-i*8,15,'#5c6841');
    }
    GM_ELLIPSE(ctx,0,-166,124,100,'#596e43');GM_ELLIPSE(ctx,0,-186,105,83,'#7a8652');
    ctx.fillStyle='#566b46';
    for(let i=0;i<7;i++){const x=-90+i*30;ctx.beginPath();ctx.moveTo(x-14,-228);ctx.lineTo(x-4,-285-(i%2)*35);ctx.lineTo(x+17,-227);ctx.fill();}
    for(const side of[-1,1]){
      ctx.save();ctx.translate(side*83,-198);ctx.rotate(side*(.12*step-.1));
      GM_LIMB(ctx,0,0,side<0?2.91:.23,103,28,'#6d7850',(c,x,y)=>{
        c.fillStyle='#8e8051';c.beginPath();c.moveTo(x-18,y+9);c.lineTo(x+43,y-44-chomp*10);c.lineTo(x+24,y+4);c.lineTo(x+45,y+46+chomp*10);c.lineTo(x-17,y+22);c.closePath();c.fill();
      });ctx.restore();
    }
    for(const side of[-1,1]){GM_LIMB(ctx,side*33,-226,-Math.PI/2+side*.1,66,12,'#627644');GM_ELLIPSE(ctx,side*40,-294,17,12,'#e4c778');GM_ELLIPSE(ctx,side*40,-294,5,8,'#273827');}
    GM_ELLIPSE(ctx,0,-131,41,24+chomp*8,'#26352a');
  } else {
    for(const side of[-1,1]) {
      GM_LIMB(ctx,side*34,-87,side<0?1.95+.03*step:1.19-.03*step,70,23,'#5a655e');
      GM_ELLIPSE(ctx,side*49,-12,37,13,'#3b4945');
      GM_LIMB(ctx,side*66,-228,side<0?2.1+.05*step:1.04-.05*step,113,21,'#6d766c',(c,x,y)=>{
        c.fillStyle='#9f9f8d';c.fillRect(x-10,y-20,19,53);
        c.strokeStyle='#b8b5a3';c.lineWidth=6;for(let j=0;j<4;j++){c.beginPath();c.moveTo(x-8+j*7,y-22);c.lineTo(x-9+j*7,y-57);c.stroke();}
      });
    }
    ctx.fillStyle='#707e70';ctx.beginPath();ctx.moveTo(-75,-249);ctx.lineTo(61,-249);ctx.lineTo(76,-100);ctx.lineTo(-62,-83);ctx.closePath();ctx.fill();
    ctx.fillStyle='#9a9b7e';ctx.fillRect(-48,-226,96,101);GM_ELLIPSE(ctx,0,-174,27,30,'#334d42');GM_ELLIPSE(ctx,0,-174,16,19,'#b8d791');
    ctx.fillStyle='#727b69';ctx.beginPath();ctx.moveTo(-62,-262);ctx.lineTo(-48,-340);ctx.lineTo(52,-354);ctx.lineTo(68,-264);ctx.closePath();ctx.fill();
    GM_ELLIPSE(ctx,0,-274,55,24+chomp*13,'#25352f');
    for(let i=0;i<6;i++){ctx.fillStyle='#d2d0aa';ctx.fillRect(-42+i*16,-291,8,12);}
    for(const side of[-1,1])GM_ELLIPSE(ctx,side*23,-321,12,8,'#c5e39d');
    ctx.strokeStyle='#7f9674';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-44,-240);ctx.quadraticCurveTo(-91,-295,-69,-360);ctx.stroke();
    for(let i=0;i<5;i++)GM_ELLIPSE(ctx,-58+i*27,-221+(i%2)*20,4,4,'#3c4e40');
  }
  if(breath>0) {ctx.globalAlpha*=.16;GM_ELLIPSE(ctx,0,-208,18+breath*4,7,type.glow);}
}

export function createGardenMonsters({artwork={}}={}) {
  let GM_manifest=null,GM_image=null,GM_loading=true,GM_closed=false,GM_error=null,GM_pendingImage=null,GM_finishImage=null;
  let GM_bitmapDraws=0,GM_fallbackDraws=0;
  const GM_frames=new Map();
  const GM_controller=typeof AbortController==='function'?new AbortController():null;
  const GM_url=artwork.gardenMonsters||'assets/garden-monsters.json';
  const GM_base=typeof document!=='undefined'?document.baseURI:'http://localhost/';
  function GM_frameRecords(manifest) {
    return Array.isArray(manifest.frames)?manifest.frames:Object.entries(manifest.frames||{}).map(([id,frame])=>({id,...frame}));
  }
  function GM_acceptFrames(manifest,image) {
    const used=new Set();
    for(const record of GM_frameRecords(manifest)) {
      const type=GM_TYPE(record.id),rect=record.rect;
      if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isFinite)||rect[0]<0||rect[1]<0||rect[2]<=0||rect[3]<=0||rect[0]+rect[2]>image.naturalWidth||rect[1]+rect[3]>image.naturalHeight)throw Error('Invalid giant atlas frame '+record.id);
      if(used.has(type.id))throw Error('Duplicate giant identity '+type.id);
      used.add(type.id);
      const foot=Array.isArray(record.foot)?record.foot:[rect[2]/2,rect[3]];
      const body=Array.isArray(record.bodyBounds)?record.bodyBounds:[0,0,rect[2],rect[3]];
      if(body.length!==4||!body.every(Number.isFinite)||body[0]<0||body[1]<0||body[2]>rect[2]||body[3]>rect[3]||body[2]<=body[0]||body[3]<=body[1])throw Error('Invalid giant body bounds '+record.id);
      GM_frames.set(type.id,{...record,id:type.id,rect:rect.slice(),bodyBounds:body.slice(),height:GM_CLAMP(record.height||type.height,336,448),foot:[GM_CLAMP(foot[0],0,rect[2]),GM_CLAMP(foot[1],0,rect[3])]});
    }
    if(GM_frames.size!==3)throw Error('Giant atlas must contain three distinct complete figures');
  }
  (async()=>{
    try {
      if(typeof Image!=='function')return;
      const manifest=artwork.gardenMonstersManifest||await(await fetch(GM_url,GM_controller?{signal:GM_controller.signal}:{})).json();
      if(GM_closed)return;
      if(manifest.version!==1||(!manifest.image&&!manifest.atlas))throw Error('Invalid giant artwork manifest');
      const image=new Image();GM_pendingImage=image;
      await new Promise((resolve,reject)=>{
        const finish=()=>{GM_finishImage=null;resolve();};GM_finishImage=finish;
        image.onload=()=>{image.onload=image.onerror=null;finish();};
        image.onerror=()=>{image.onload=image.onerror=null;GM_finishImage=null;reject(Error('Giant artwork image failed to load'));};
        image.src=new URL(manifest.image||manifest.atlas,new URL(GM_url,GM_base)).href;
      });
      if(GM_closed)return;
      if(!image.naturalWidth||!image.naturalHeight)throw Error('Giant artwork image is empty');
      GM_acceptFrames(manifest,image);GM_manifest=manifest;GM_image=image;GM_pendingImage=null;
    } catch(e) {if(!GM_closed){GM_error=String(e.message||e);GM_frames.clear();}}
    finally{GM_loading=false;}
  })();
  function draw(ctx,{id,type,monsterId,x=0,y=0,scale=1,time=0,hp=1,maxHp=1,hit=0,bite=0,clip,fitWithinClip=false}={}) {
    if(GM_closed||!ctx)return false;
    const kind=GM_TYPE(id,type,monsterId),frame=GM_frames.get(kind.id);
    const t=GM_NUM(time),ratio=GM_CLAMP(GM_NUM(hp)/Math.max(.001,GM_NUM(maxHp,1)),0,1),stage=ratio>.8?0:ratio>.6?1:ratio>.4?2:ratio>.2?3:4;
    const flash=GM_CLAMP(hit,0,1),chomp=GM_CLAMP(bite,0,1),height=frame?.height||kind.height;
    let s=GM_CLAMP(scale,.005,8),px=GM_NUM(x),py=GM_NUM(y);
    const width=frame?(frame.bodyBounds[2]-frame.bodyBounds[0])*height/(frame.bodyBounds[3]-frame.bodyBounds[1]):kind.id==='bramblecrab'?448:272;
    const region=clip&&[clip.x,clip.y,clip.width,clip.height].every(Number.isFinite)&&clip.width>0&&clip.height>0?clip:null;
    if(region&&fitWithinClip) {
      s=Math.min(s,region.height/(height*1.04),region.width/(width*1.04));
      const half=width*s*.52;
      px=GM_CLAMP(px,region.x+half,region.x+region.width-half);
      py=GM_CLAMP(py,region.y+height*s*1.02,region.y+region.height-2);
    }
    ctx.save();
    if(region){ctx.beginPath();ctx.rect(region.x,region.y,region.width,region.height);ctx.clip();}
    ctx.translate(px,py);ctx.scale(s,s);
    const phase=kind.id==='mossbell'?0:kind.id==='bramblecrab'?2.1:4.3;
    const sway=Math.sin(t*1.15+phase)*.012,breath=Math.sin(t*1.55+phase)*.008;
    GM_ELLIPSE(ctx,0,-2,width*.33,10,'rgba(22,35,25,.22)');
    ctx.rotate(sway-chomp*.015);ctx.scale(1+breath,1-breath*.35);
    ctx.translate(-chomp*7,-Math.abs(Math.sin(t*1.8+phase))*2);
    if(frame&&GM_image) {
      const factor=height/(frame.bodyBounds[3]-frame.bodyBounds[1]);
      ctx.filter=`saturate(${1-stage*.1}) brightness(${1-stage*.045+flash*.65})`;
      // Crop only an authored whole-figure atlas cell; never cut limbs from a
      // body image. Every health stage retains this same identity and source.
      ctx.drawImage(GM_image,...frame.rect,-frame.foot[0]*factor,-frame.foot[1]*factor,frame.rect[2]*factor,frame.rect[3]*factor);
      ctx.filter='none';GM_bitmapDraws++;
    } else {GM_FALLBACK(ctx,kind,t,chomp);GM_fallbackDraws++;}
    if(stage>0) {
      // Readable botanical/metal damage marks, without swapping the monster.
      ctx.strokeStyle=kind.id==='scrapjaw'?'#d0bb85':'#c4b080';ctx.lineWidth=2.1;ctx.lineCap='round';
      for(let i=0;i<stage;i++){const xx=-34+(i*29)%67,yy=-height*(.34+i*.09);ctx.beginPath();ctx.moveTo(xx-7,yy-7);ctx.lineTo(xx+2,yy);ctx.lineTo(xx-3,yy+12);ctx.stroke();}
    }
    if(flash>0) {
      ctx.globalAlpha*=flash*.6;ctx.strokeStyle='#ffe9a0';ctx.lineWidth=3;
      for(let i=0;i<5;i++){const a=i*GM_TAU/5+t*.2,xx=Math.cos(a)*41,yy=-height*.52+Math.sin(a)*35;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+Math.cos(a)*13,yy+Math.sin(a)*13);ctx.stroke();}
    }
    ctx.restore();return true;
  }
  function destroy() {
    if(GM_closed)return;GM_closed=true;GM_controller?.abort();
    for(const image of[GM_image,GM_pendingImage])if(image){image.onload=image.onerror=null;try{image.src='';}catch{}}
    GM_finishImage?.();GM_finishImage=null;GM_pendingImage=null;GM_image=null;GM_manifest=null;GM_frames.clear();
  }
  return {draw,destroy,getState(){return{ready:!GM_closed&&!GM_loading&&!!GM_image&&GM_frames.size===3,loading:!GM_closed&&GM_loading,closed:GM_closed,error:GM_error,types:[...GM_frames.keys()],imageWidth:GM_image?.naturalWidth||0,imageHeight:GM_image?.naturalHeight||0,bitmapDraws:GM_bitmapDraws,fallbackDraws:GM_fallbackDraws,fallbackAvailable:!GM_closed};}};
}
