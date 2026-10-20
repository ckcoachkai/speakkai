import {drawGardenWeapons} from './garden-weapon-motion.js';
import {GARDEN_ANIME_TYPES,drawGardenAnime} from './garden-anime.js';
import {NIULAI_VARIANTS,createNiuLaiRenderer} from './garden-niulai.js';
import {FLIERS,drawFlier} from './garden-fliers.js';
import {createSkinMotion} from './garden-skin-motion.js';
/** Sourced cameo artwork plus explicitly labeled generated zombie variants.
 * Cosmetic undead treatment and gait never change combat statistics. */
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
 const GM_skin=createSkinMotion(),GM_niu=createNiuLaiRenderer();
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
     const fallback=frames.map((_,i)=>i),clips={};
     for(const [name,indices] of Object.entries({...record.clips,default:fallback})){
      const valid=indices.filter(i=>Number.isInteger(i)&&i>=0&&i<frames.length);
      if(valid.length)clips[name]={indices:valid,total:valid.reduce((sum,i)=>sum+durations[i],0)};
     }
     GM_sprites.set(record.id,{...record,img,frames,durations,compiledClips:clips});
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
  const compiled=sprite.compiledClips[mode]||sprite.compiledClips.walk||sprite.compiledClips.default;
  const clip=compiled.indices,total=compiled.total;
  let at=((Math.max(0,time)*1000)%Math.max(1,total));
  for(let n=0;n<clip.length;n++){const index=clip[n];if(at<sprite.durations[index])return{frame:sprite.frames[index],index};at-=sprite.durations[index];}
  return{frame:sprite.frames[clip[0]],index:clip[0]};
 }
 function draw(ctx,{id,type,monsterId,instanceId,x=0,y=0,scale=1,time=0,hp=1,maxHp=1,hit=0,bite=0,walk,death=0,clip,action}={}){
  if(GM_closed||!ctx)return false;
  const key=monsterId||type?.monsterId||type?.id||(typeof type==='string'?type:null)||id,sprite=GM_sprites.get(key);
  if(GARDEN_ANIME_TYPES.some(t=>t.id===key))return drawGardenAnime(ctx,{id:key,x,y,height:224*scale,time,attack:action?1:bite,death});if(NIULAI_VARIANTS.some(t=>t.id===key))return GM_niu.draw(ctx,key,{x,y,height:224*scale,time});if(FLIERS.includes(key))return drawFlier(ctx,{id:key,x,y,scale,time,action,bite,death,hit});if(!sprite)return false;
  const mode=death>0?'death':hit>0?'hurt':action?action:bite>0?'attack':walk===false||walk===0?'idle':'walk';
  const clock=GM_FINITE(time),entity=instanceId||key;
  let playhead=GM_playheads.get(entity);
  if(!playhead||clock<playhead.lastTime){playhead={mode,start:clock,lastTime:clock};GM_playheads.set(entity,playhead);if(GM_playheads.size>2048)GM_playheads.delete(GM_playheads.keys().next().value);}
  if(playhead.mode!==mode){playhead.mode=mode;playhead.start=clock;}
  playhead.lastTime=clock;
  const visualClock=sprite.undead ? clock*.58+Math.sin(clock*2)*.075 : clock;
  const localTime=sprite.clips?.[mode]?Math.max(0,visualClock-(sprite.undead?playhead.start*.58:playhead.start)):visualClock;
  let selected=frameAt(sprite,localTime,mode);
  if(death>0&&sprite.clips?.death?.length){const clip=sprite.clips.death,index=clip[Math.min(clip.length-1,Math.floor(GM_LIMIT(death,0,1)*clip.length))];selected={frame:sprite.frames[index],index};}
  const frame=selected.frame;
  const s=GM_LIMIT(scale,.005,8),hurt=GM_LIMIT(hit,0,1),fall=GM_LIMIT(death,0,1);

  const displayHeight=sprite.displayHeight||GARDEN_MONSTER_HEIGHT, factor=displayHeight/sprite.bodyHeight,foot=sprite.foot||[sprite.frameWidth/2,sprite.frameHeight];
  ctx.save();
  if(clip&&[clip.x,clip.y,clip.width,clip.height].every(Number.isFinite)&&clip.width>0&&clip.height>0){ctx.beginPath();ctx.rect(clip.x,clip.y,clip.width,clip.height);ctx.clip();}
  ctx.translate(GM_FINITE(x),GM_FINITE(y));ctx.scale(s,s);
  if(sprite.flipX)ctx.scale(-1,1);
  if(sprite.undead&&fall===0){const phase=clock*3.2;ctx.translate(Math.sin(phase)*1.8,-Math.max(0,Math.sin(phase))*2.5);ctx.rotate(Math.sin(phase)*.018);}
  // A sourced toy profile rocks as a whole; this is not a native walk cycle.
  if(sprite.motion==='waddle'&&fall===0){const phase=clock*6;ctx.translate(0,-Math.abs(Math.sin(phase))*3);ctx.rotate(Math.sin(phase)*.035);}
  if(!sprite.clips?.[mode]&&fall===0){const t=Math.max(0,clock-playhead.start);if(mode==='charge'){ctx.translate(-Math.min(1,t*3)*5,-Math.sin(t*9)*2);ctx.rotate(-.045*Math.min(1,t*3));ctx.shadowColor='#b7edff';ctx.shadowBlur=12+Math.sin(t*13)*5;}else if(mode==='attack'){const thrust=Math.pow(Math.max(0,Math.sin(t*8)),2);ctx.translate(-thrust*16,-thrust*3);ctx.rotate(-thrust*.075);}}
  if(hurt>0)ctx.translate(Math.sin(GM_FINITE(time)*61)*hurt*6,-hurt*2);
  if(fall>0&&!sprite.clips?.death){ctx.rotate(fall*.9);ctx.globalAlpha*=1-fall*.75;}
  // Keep source colors and shading intact, including at low health.
  ctx.filter=hurt>0?'brightness('+(1+hurt*.25)+')':'none';
  ctx.imageSmoothingEnabled=!sprite.pixelArt;
  ctx.imageSmoothingQuality='high';
  // Radiation is a clearly documented game effect on the original full-body
  // mutant artwork; it does not substitute a cropped Screamer torso.
  if(sprite.radiation){ctx.shadowColor='#99ff38';ctx.shadowBlur=15+Math.sin(clock*4)*3;}
  const paint=source=>{
   ctx.save();
   // A single continuous transform preserves crisp contours; slicing the
   // artwork into horizontal strips made silhouettes look jagged.
   if(sprite.undead&&!sprite.generatedZombie){
    ctx.transform(1,0,(sprite.flipX?-1:1)*.045,.96,0,0);
   }
   if(sprite.radiation||!GM_skin.draw(ctx,sprite.img,source.rect,{id:key,time:clock,x:-foot[0]*factor,y:-foot[1]*factor,width:sprite.frameWidth*factor,height:sprite.frameHeight*factor,mode,action,hit:hurt,nativeFrames:sprite.frames.length,pixelArt:sprite.pixelArt}))ctx.drawImage(sprite.img,...source.rect,-foot[0]*factor,-foot[1]*factor,sprite.frameWidth*factor,sprite.frameHeight*factor);
   ctx.restore();
  };
  // Exactly one silhouette per actor: alpha crossfades produce ghost bodies.
  paint(frame);
  drawGardenWeapons(ctx,{id:key,x:0,y:0,scale:2.24,time:clock,action,attack:bite});
  ctx.restore();GM_draws++;GM_counts[key]=(GM_counts[key]||0)+1;
  GM_lastPose={id:key,time:GM_FINITE(time),mode,sourceFrame:selected.index,sourceFrameCount:sprite.frames.length,scale:s,height:displayHeight*s};return true;
 }
 function destroy(){if(GM_closed)return;GM_closed=true;GM_niu.destroy();GM_skin.clear();GM_controller?.abort();for(const img of GM_images){img.onload=img.onerror=null;try{img.src='';}catch{}}for(const done of GM_pending)done();GM_images.clear();GM_sprites.clear();GM_playheads.clear();GM_lastPose=null;}
 return{draw,destroy,release(instanceId){GM_playheads.delete(instanceId);},has:id=>!GM_closed&&(GM_sprites.has(id)||FLIERS.includes(id)||GARDEN_ANIME_TYPES.some(t=>t.id===id)||NIULAI_VARIANTS.some(t=>t.id===id)),dimensions(id){if(GARDEN_ANIME_TYPES.some(t=>t.id===id)||NIULAI_VARIANTS.some(t=>t.id===id))return {height:224,width:150};if(FLIERS.includes(id))return {height:190,width:90};const s=GM_sprites.get(id);return s?{height:s.displayHeight||GARDEN_MONSTER_HEIGHT,width:s.frameWidth*(s.displayHeight||GARDEN_MONSTER_HEIGHT)/s.bodyHeight}:null;},getState(){return{ready:!GM_closed&&!GM_loading&&GM_sprites.size===(GM_manifest?.characters.length||0)&&GM_errors.length===0,loading:!GM_closed&&GM_loading,closed:GM_closed,errors:[...GM_errors],types:[...GM_sprites.keys()],sourceAssets:true,animatedTypes:[...GM_sprites.values()].filter(s=>s.frames.length>1).map(s=>s.id),staticTypes:[...GM_sprites.values()].filter(s=>s.frames.length===1).map(s=>s.id),interpolatedTypes:[],proceduralMotion:GM_skin.getState(),frameCounts:Object.fromEntries([...GM_sprites.values()].map(s=>[s.id,s.frames.length])),bitmapDraws:GM_draws,vectorDraws:0,drawCounts:{...GM_counts},lastPose:GM_lastPose};}};
}


