/** Complete bitmap allies; no procedural placeholders or body-strip deformation. */
const GAL_NUM=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const GAL_BOUND=(v,a,b)=>Math.max(a,Math.min(b,GAL_NUM(v,a)));

export function createGardenAllies({artwork={}}={}) {
 let GAL_closed=false,GAL_loading=true,GAL_expected=0,GAL_draws=0,GAL_last=null,GAL_surface=null;
 const GAL_sprites=new Map(),GAL_errors=[],GAL_images=new Set(),GAL_pending=new Set(),GAL_counts={};
 const GAL_abort=typeof AbortController==='function'?new AbortController():null;
 const GAL_url=artwork.gardenAllies||'assets/garden-allies.json';
 const GAL_base=typeof document!=='undefined'?document.baseURI:'http://localhost/';
 const GAL_fail=error=>GAL_errors.push(String(error?.message||error));
 function GAL_load(record){return new Promise(resolve=>{
  if(GAL_closed){resolve();return;}
  if(typeof Image!=='function'){GAL_fail('Image API unavailable');resolve();return;}
  if(!record||typeof record.id!=='string'||!record.id){GAL_fail('Invalid ally id');resolve();return;}
  const img=new Image();GAL_images.add(img);let done=false;
  const finish=()=>{if(done)return;done=true;img.onload=img.onerror=null;GAL_pending.delete(finish);resolve();};GAL_pending.add(finish);
  img.onload=()=>{
   try{
    if(GAL_closed)return;
    const width=GAL_NUM(record.frameWidth),height=GAL_NUM(record.frameHeight),body=GAL_NUM(record.bodyHeight,height);
    if(width<=0||height<=0||body<=0||!Array.isArray(record.frames)||!record.frames.length)throw Error(record.id+': invalid frame dimensions');
    const frames=record.frames.map(frame=>{
     const rect=Array.isArray(frame)?frame:frame.rect;
     if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isFinite)||rect[0]<0||rect[1]<0||rect[2]<=0||rect[3]<=0||rect[0]+rect[2]>img.naturalWidth||rect[1]+rect[3]>img.naturalHeight)throw Error(record.id+': frame outside atlas');
     return{rect,duration:GAL_BOUND(frame.duration??record.frameDuration??100,1,60000)};
    });
    const clips={};
    for(const [name,indices]of Object.entries(record.clips||{})){
     if(Array.isArray(indices)&&indices.length&&indices.every(i=>Number.isInteger(i)&&i>=0&&i<frames.length))clips[name]=indices;
     else throw Error(record.id+': invalid '+name+' clip');
    }
    const fallback=frames.map((_,i)=>i);if(!Object.keys(clips).length)clips.idle=fallback;
    const foot=Array.isArray(record.foot)&&record.foot.length===2&&record.foot.every(Number.isFinite)?record.foot:[width/2,height];
    GAL_sprites.set(record.id,{...record,img,frames,clips,fallback,frameWidth:width,frameHeight:height,bodyHeight:body,foot});GAL_counts[record.id]=0;
   }catch(error){GAL_fail(error);}finally{finish();}
  };
  img.onerror=()=>{if(!GAL_closed)GAL_fail(record.id+': image unavailable');finish();};
  try{img.src=artwork.gardenAlliesImages?.[record.id]||artwork.gardenAlliesImages?.[record.image]||new URL(record.image,new URL(GAL_url,GAL_base)).href;}catch(error){GAL_fail(error);finish();}
 });}
 (async()=>{try{
  let manifest=artwork.gardenAlliesManifest;
  if(!manifest){const response=await fetch(GAL_url,GAL_abort?{signal:GAL_abort.signal}:{});if(!response.ok)throw Error('Allies manifest HTTP '+response.status);manifest=await response.json();}
  if(GAL_closed)return;
  const records=Array.isArray(manifest)?manifest:manifest?.characters||manifest?.allies||manifest?.records;
  if(!Array.isArray(records)||!records.length)throw Error('Allies manifest has no records');
  if(new Set(records.map(r=>r?.id)).size!==records.length)throw Error('Duplicate ally ids');
  GAL_expected=records.length;await Promise.all(records.map(GAL_load));
 }catch(error){if(!GAL_closed)GAL_fail(error);}finally{GAL_loading=false;}})();

 function GAL_frame(sprite,mode,time,progress){
  const clip=sprite.clips[mode]||sprite.clips.idle||sprite.clips.walk||sprite.fallback;
  const total=clip.reduce((sum,i)=>sum+sprite.frames[i].duration,0),once=mode==='attack'&&Number.isFinite(progress);
  let at=once?GAL_BOUND(progress,0,1)*Math.max(0,total-.001):((Math.max(0,time)*1000)%total);
  for(let position=0;position<clip.length;position++){
   const frame=sprite.frames[clip[position]];
   if(at<frame.duration||position===clip.length-1){
    const mix=position===clip.length-1&&once?0:GAL_BOUND((at/frame.duration-.85)/.15,0,1);
    return{index:clip[position],frame,next:sprite.frames[clip[(position+1)%clip.length]],mix};
   }at-=frame.duration;
  }
 }
 function GAL_blend(sprite,pose){
  if(!GAL_surface){
   if(typeof OffscreenCanvas==='function')GAL_surface=new OffscreenCanvas(sprite.frameWidth,sprite.frameHeight);
   else if(typeof document!=='undefined'&&document.createElement)GAL_surface=document.createElement('canvas');
  }
  if(!GAL_surface)return null;
  if(GAL_surface.width!==sprite.frameWidth)GAL_surface.width=sprite.frameWidth;
  if(GAL_surface.height!==sprite.frameHeight)GAL_surface.height=sprite.frameHeight;
  const ctx=GAL_surface.getContext('2d');if(!ctx)return null;
  ctx.clearRect(0,0,GAL_surface.width,GAL_surface.height);ctx.imageSmoothingEnabled=!sprite.pixelArt;
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1-pose.mix;ctx.drawImage(sprite.img,...pose.frame.rect,0,0,sprite.frameWidth,sprite.frameHeight);
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=pose.mix;ctx.drawImage(sprite.img,...pose.next.rect,0,0,sprite.frameWidth,sprite.frameHeight);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;return GAL_surface;
 }
 function draw(ctx,{id,x=0,y=0,scale=1,time=0,attacking=false,attackProgress,clip}={}){
  if(GAL_closed||!ctx)return false;const sprite=GAL_sprites.get(id);if(!sprite)return false;
  const mode=clip||(attacking?'attack':sprite.clips.idle?'idle':'walk');
  const pose=GAL_frame(sprite,mode,GAL_NUM(time),attackProgress),factor=GAL_BOUND(sprite.displayHeight??112,1,2000)/sprite.bodyHeight;
  const dx=-sprite.foot[0]*factor,dy=-sprite.foot[1]*factor,w=sprite.frameWidth*factor,h=sprite.frameHeight*factor;
  ctx.save();ctx.translate(GAL_NUM(x),GAL_NUM(y));const size=GAL_BOUND(scale,.001,20);ctx.scale(size,size);
  if(sprite.flipX)ctx.scale(-1,1);ctx.imageSmoothingEnabled=!sprite.pixelArt;if('imageSmoothingQuality'in ctx)ctx.imageSmoothingQuality='high';
  const blend=pose.mix>0&&sprite.crossfade!==false?GAL_blend(sprite,pose):null;
  if(blend)ctx.drawImage(blend,dx,dy,w,h);else ctx.drawImage(sprite.img,...pose.frame.rect,dx,dy,w,h);
  ctx.restore();GAL_draws++;GAL_counts[id]++;GAL_last={id,mode,frame:pose.index,mix:blend?pose.mix:0};return true;
 }
 function destroy(){
  if(GAL_closed)return;GAL_closed=true;GAL_loading=false;GAL_abort?.abort();
  for(const img of GAL_images){img.onload=img.onerror=null;try{img.src='';}catch{}}
  for(const finish of GAL_pending)finish();GAL_pending.clear();GAL_images.clear();GAL_sprites.clear();
  if(GAL_surface){GAL_surface.width=0;GAL_surface.height=0;GAL_surface=null;}GAL_last=null;
 }
 return{draw,has:id=>!GAL_closed&&GAL_sprites.has(id),destroy,
  dimensions(id){const s=GAL_sprites.get(id);if(!s)return null;const f=GAL_NUM(s.displayHeight,112)/s.bodyHeight;return{width:s.frameWidth*f,height:s.frameHeight*f,bodyHeight:GAL_NUM(s.displayHeight,112)};},
  getState(){return{ready:!GAL_closed&&!GAL_loading&&GAL_expected>0&&GAL_sprites.size===GAL_expected&&!GAL_errors.length,loading:GAL_loading,closed:GAL_closed,errors:[...GAL_errors],types:[...GAL_sprites.keys()],frameCounts:Object.fromEntries([...GAL_sprites].map(([id,s])=>[id,s.frames.length])),bitmapDraws:GAL_draws,drawCounts:{...GAL_counts},lastPose:GAL_last};}
 };
}
