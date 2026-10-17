/** Internet-sourced character artwork. This module draws downloaded pixels;
 * it does not recreate a character with procedural shapes or generated art. */
const GM_FINITE=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const GM_LIMIT=(value,min,max)=>Math.max(min,Math.min(max,GM_FINITE(value,min)));
export const GARDEN_MONSTER_HEIGHT=224;
export const GARDEN_MONSTER_TYPES=Object.freeze([
 {id:'labubu',name:'Labubu',width:330},{id:'niulai',name:'Niu Lai',width:380},
 {id:'duck',name:'Rubber Duck',width:430},{id:'mummy',name:'Mummy',width:300},
 {id:'hellokitty',name:'Hello Kitty',width:380},{id:'ultraman',name:'Ultraman',width:350},
 {id:'teamrocket',name:'Team Rocket',width:470},{id:'pikachu',name:'Pikachu',width:470},
 {id:'dogman',name:'Dog Man',width:330},
 {id:'minecraft-zombie',name:'Minecraft Zombie',width:155,height:72},{id:'minecraft-villager',name:'Minecraft Villager',width:145,height:64},
 {id:'pennywise',name:'Pennywise',width:365},{id:'zombieclown',name:'Zombie Clown',width:365},
 {id:'demolisher',name:'Demolisher',width:350},{id:'mutated',name:'Mutated Zombie',width:350},{id:'irradiated',name:'Irradiated Zombie',width:320}
].map(type=>Object.freeze({...type,width:type.width*(type.height||GARDEN_MONSTER_HEIGHT)/370,height:type.height||GARDEN_MONSTER_HEIGHT,normalHeight:112,sourced:true})));

export function createGardenMonsters({artwork={}}={}) {
 let GM_closed=false,GM_loading=true,GM_manifest=null,GM_draws=0,GM_lastPose=null;
 const GM_sprites=new Map(),GM_errors=[],GM_images=new Set(),GM_pending=new Set(),GM_playheads=new Map();
 const GM_controller=typeof AbortController==='function'?new AbortController():null;
 const GM_url=artwork.gardenMonsters||'assets/garden-sourced/manifest.json';
 const GM_base=typeof document!=='undefined'?document.baseURI:'http://localhost/';
 const GM_counts=Object.fromEntries(GARDEN_MONSTER_TYPES.map(type=>[type.id,0]));
 function loadSprite(record){return new Promise(resolve=>{
  if(GM_closed||typeof Image!=='function'){resolve();return;}
  const img=new Image();GM_images.add(img);let settled=false;
  const finish=()=>{if(settled)return;settled=true;GM_pending.delete(finish);img.onload=img.onerror=null;resolve();};GM_pending.add(finish);
  img.onload=()=>{
   if(!GM_closed&&img.naturalWidth&&img.naturalHeight){
    const frames=record.frames||[];
    if(frames.length&&frames.every(f=>f.rect?.length===4&&f.rect.every(Number.isFinite)&&f.rect[2]>0&&f.rect[3]>0)){
     const durations=frames.map(f=>Math.max(1,GM_FINITE(f.duration,100)));
     let surface=null;
     if(typeof OffscreenCanvas==='function')surface=new OffscreenCanvas(record.frameWidth,record.frameHeight);
     else if(typeof document!=='undefined'&&document.createElement){surface=document.createElement('canvas');surface.width=record.frameWidth;surface.height=record.frameHeight;}
     GM_sprites.set(record.id,{...record,img,frames,durations,surface,total:durations.reduce((a,b)=>a+b,0)});
    }else GM_errors.push(record.id+': invalid source frames');
   }
   finish();
  };
  img.onerror=()=>{if(!GM_closed)GM_errors.push(record.id+': source image unavailable');finish();};
  try{img.src=artwork.gardenMonsterImages?.[record.id]||new URL(record.image,new URL(GM_url,GM_base)).href;}catch(e){GM_errors.push(record.id+': '+e.message);finish();}
 });}
 (async()=>{try{
  if(typeof Image!=='function')return;
  const manifest=artwork.gardenMonstersManifest||await(await fetch(GM_url,GM_controller?{signal:GM_controller.signal}:{})).json();
  if(GM_closed)return;
  if(manifest.version!==2||!Array.isArray(manifest.characters))throw Error('Invalid sourced character manifest');
  GM_manifest=manifest;
  await Promise.all(manifest.characters.map(loadSprite));
 }catch(e){if(!GM_closed)GM_errors.push(String(e.message||e));}finally{GM_loading=false;}})();
 function frameAt(sprite,time,mode){
  const clip=sprite.clips?.[mode]||sprite.clips?.walk||sprite.frames.map((_,i)=>i);
  const total=clip.reduce((sum,i)=>sum+sprite.durations[i],0);
  let at=((Math.max(0,time)*1000)%Math.max(1,total));
  for(const index of clip){if(at<sprite.durations[index])return{frame:sprite.frames[index],index};at-=sprite.durations[index];}
  return{frame:sprite.frames[clip[0]],index:clip[0]};
 }
 function draw(ctx,{id,type,monsterId,instanceId,x=0,y=0,scale=1,time=0,hp=1,maxHp=1,hit=0,bite=0,walk,death=0,clip}={}){
  if(GM_closed||!ctx)return false;
  const key=monsterId||type?.monsterId||type?.id||(typeof type==='string'?type:null)||id,sprite=GM_sprites.get(key);
  if(!sprite)return false;
  const mode=death>0?'death':hit>0?'hurt':bite>0?'attack':walk===false||walk===0?'idle':'walk';
  const clock=GM_FINITE(time),entity=instanceId||key;
  let playhead=GM_playheads.get(entity);
  if(!playhead||clock<playhead.lastTime){playhead={mode,start:clock,lastTime:clock,previous:null,selected:null};GM_playheads.set(entity,playhead);if(GM_playheads.size>2048)GM_playheads.delete(GM_playheads.keys().next().value);}
  if(playhead.mode!==mode){playhead.previous=playhead.selected;playhead.mode=mode;playhead.start=clock;}
  playhead.lastTime=clock;
  const localTime=sprite.clips?.[mode]?Math.max(0,clock-playhead.start):clock;
  let selected=frameAt(sprite,localTime,mode);
  if(death>0&&sprite.clips?.death?.length){const clip=sprite.clips.death,index=clip[Math.min(clip.length-1,Math.floor(GM_LIMIT(death,0,1)*clip.length))];selected={frame:sprite.frames[index],index};}
  const frame=selected.frame;
  const s=GM_LIMIT(scale,.005,8),hurt=GM_LIMIT(hit,0,1),fall=GM_LIMIT(death,0,1);
  const ratio=GM_LIMIT(GM_FINITE(hp)/Math.max(.001,GM_FINITE(maxHp,1)),0,1),stage=ratio>.8?0:ratio>.6?1:ratio>.4?2:ratio>.2?3:4;
  const displayHeight=sprite.displayHeight||GARDEN_MONSTER_HEIGHT, factor=displayHeight/sprite.bodyHeight,foot=sprite.foot||[sprite.frameWidth/2,sprite.frameHeight];
  ctx.save();
  if(clip&&[clip.x,clip.y,clip.width,clip.height].every(Number.isFinite)&&clip.width>0&&clip.height>0){ctx.beginPath();ctx.rect(clip.x,clip.y,clip.width,clip.height);ctx.clip();}
  ctx.translate(GM_FINITE(x),GM_FINITE(y));ctx.scale(s,s);
  if(sprite.flipX)ctx.scale(-1,1);
  if(hurt>0)ctx.translate(Math.sin(GM_FINITE(time)*61)*hurt*6,-hurt*2);
  if(fall>0&&!sprite.clips?.death){ctx.rotate(fall*.9);ctx.globalAlpha*=1-fall*.75;}
  ctx.filter='saturate('+(1-stage*.07)+') brightness('+(1+hurt*.45-stage*.015)+')';
  ctx.imageSmoothingEnabled=!sprite.pixelArt;
  // Radiation is a clearly documented game effect on the original full-body
  // mutant artwork; it does not substitute a cropped Screamer torso.
  if(sprite.radiation){ctx.shadowColor='#99ff38';ctx.shadowBlur=15+Math.sin(clock*4)*3;ctx.filter+=' saturate(1.4) hue-rotate(24deg)';}
  const mix=GM_LIMIT((clock-playhead.start)/.10,0,1);
  const paint=(source,alpha=1)=>{ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(sprite.img,...source.rect,-foot[0]*factor,-foot[1]*factor,sprite.frameWidth*factor,sprite.frameHeight*factor);ctx.restore();};
  if(playhead.previous&&mix<1&&mode!=='death'&&sprite.surface){
   const blend=sprite.surface.getContext('2d');blend.clearRect(0,0,sprite.frameWidth,sprite.frameHeight);
   blend.globalCompositeOperation='source-over';blend.globalAlpha=1-mix;blend.drawImage(sprite.img,...playhead.previous.frame.rect,0,0,sprite.frameWidth,sprite.frameHeight);
   blend.globalCompositeOperation='lighter';blend.globalAlpha=mix;blend.drawImage(sprite.img,...frame.rect,0,0,sprite.frameWidth,sprite.frameHeight);
   blend.globalCompositeOperation='source-over';blend.globalAlpha=1;
   ctx.drawImage(sprite.surface,-foot[0]*factor,-foot[1]*factor,sprite.frameWidth*factor,sprite.frameHeight*factor);
  }else paint(frame);
  playhead.selected=selected;
  ctx.restore();GM_draws++;GM_counts[key]++;
  GM_lastPose={id:key,time:GM_FINITE(time),mode,sourceFrame:selected.index,sourceFrameCount:sprite.frames.length,scale:s,height:displayHeight*s};return true;
 }
 function destroy(){if(GM_closed)return;GM_closed=true;GM_controller?.abort();for(const img of GM_images){img.onload=img.onerror=null;try{img.src='';}catch{}}for(const done of GM_pending)done();GM_images.clear();GM_sprites.clear();GM_playheads.clear();GM_lastPose=null;}
 return{draw,destroy,has:id=>!GM_closed&&GM_sprites.has(id),dimensions(id){const s=GM_sprites.get(id);return s?{height:s.displayHeight||GARDEN_MONSTER_HEIGHT,width:s.frameWidth*(s.displayHeight||GARDEN_MONSTER_HEIGHT)/s.bodyHeight}:null;},getState(){return{ready:!GM_closed&&!GM_loading&&GM_sprites.size===(GM_manifest?.characters.length||0)&&GM_errors.length===0,loading:!GM_closed&&GM_loading,closed:GM_closed,errors:[...GM_errors],types:[...GM_sprites.keys()],sourceAssets:true,animatedTypes:[...GM_sprites.values()].filter(s=>s.frames.length>1).map(s=>s.id),staticTypes:[...GM_sprites.values()].filter(s=>s.frames.length===1).map(s=>s.id),interpolatedTypes:[...GM_sprites.values()].filter(s=>s.interpolation).map(s=>s.id),frameCounts:Object.fromEntries([...GM_sprites.values()].map(s=>[s.id,s.frames.length])),bitmapDraws:GM_draws,vectorDraws:0,drawCounts:{...GM_counts},lastPose:GM_lastPose};}};
}
