import { drawGardenCameoA } from './garden-cameos-a.js?v=20261016-cameos';
import { drawGardenCameoB } from './garden-cameos-b.js?v=20261016-cameos';

/** Articulated cameo rigs. Rendering never chooses a target, changes combat
 * state or consumes combat RNG. Their370px bodies are3.3x normal112px bodies. */
const GM_FINITE=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const GM_LIMIT=(value,min,max)=>Math.max(min,Math.min(max,GM_FINITE(value,min)));
export const GARDEN_MONSTER_TYPES=Object.freeze([
  {id:'labubu',name:'Labubu',color:'#c29564',width:268,rigHeight:393,rigFoot:10},
  {id:'niulai',name:'Niu Lai',color:'#deb04b',width:300,rigHeight:390,rigFoot:10},
  {id:'duck',name:'Rubber Duck',color:'#ffdf48',width:330,rigHeight:383,rigFoot:10},
  {id:'mummy',name:'Mummy',color:'#d7cbab',width:260,rigHeight:386,rigFoot:10},
  {id:'hellokitty',name:'Hello Kitty',color:'#f2c3d5',width:312,rigHeight:369,rigFoot:3},
  {id:'ultraman',name:'Ultraman',color:'#da4c43',width:246,rigHeight:376,rigFoot:1},
  {id:'teamrocket',name:'Team Rocket',color:'#b176bc',width:390,rigHeight:371,rigFoot:3},
  {id:'pikachu',name:'Pikachu',color:'#f8d142',width:350,rigHeight:421,rigFoot:3},
  {id:'dogman',name:'Dog Man',color:'#468bc6',width:260,rigHeight:382,rigFoot:5},
].map(type=>Object.freeze({...type,height:370,normalHeight:112,articulated:true})));

export function createGardenMonsters() {
  let GM_closed=false,GM_draws=0,GM_lastPose=null;
  const GM_counts=Object.fromEntries(GARDEN_MONSTER_TYPES.map(type=>[type.id,0]));
  function draw(ctx,{id,type,monsterId,x=0,y=0,scale=1,time=0,hp=1,maxHp=1,hit=0,bite=0,walk,death=0,clip}={}) {
    if(GM_closed||!ctx)return false;
    const key=monsterId||type?.monsterId||type?.id||(typeof type==='string'?type:null)||id;
    const kind=GARDEN_MONSTER_TYPES.find(item=>item.id===key);
    if(!kind)return false;
    const t=GM_FINITE(time),s=GM_LIMIT(scale,.005,8),hurt=GM_LIMIT(hit,0,1),fall=GM_LIMIT(death,0,1);
    const ratio=GM_LIMIT(GM_FINITE(hp)/Math.max(.001,GM_FINITE(maxHp,1)),0,1);
    const damageStage=ratio>.8?0:ratio>.6?1:ratio>.4?2:ratio>.2?3:4;
    const attack=GM_LIMIT(bite,0,1),walking=walk==null?(attack>0?0:1):GM_LIMIT(walk,0,1);
    const region=clip&&[clip.x,clip.y,clip.width,clip.height].every(Number.isFinite)&&clip.width>0&&clip.height>0?clip:null;
    ctx.save();
    if(region){ctx.beginPath();ctx.rect(region.x,region.y,region.width,region.height);ctx.clip();}
    ctx.translate(GM_FINITE(x),GM_FINITE(y));ctx.scale(s,s);
    ctx.fillStyle='rgba(23,44,26,.24)';ctx.beginPath();ctx.ellipse(0,-1,kind.width*.31,13,0,0,Math.PI*2);ctx.fill();
    if(hurt>0)ctx.translate(Math.sin(t*61)*hurt*8,-hurt*3);
    if(fall>0){ctx.translate(fall*24,fall*9);ctx.rotate(fall*.95);ctx.scale(1,1-fall*.32);}
    const pose={id:kind.id,time:t,walk:walking,attack,hit:hurt,damageStage,death:fall};
    // Normalize the complete authored head/ears-to-foot silhouette to370px;
    // ordinary zombies retain their independent original renderer scale.
    const rigScale=370/kind.rigHeight;
    ctx.save();ctx.translate(0,-kind.rigFoot*rigScale);ctx.scale(rigScale,rigScale);
    const rendered=drawGardenCameoA(ctx,pose)||drawGardenCameoB(ctx,pose);
    ctx.restore();
    if(rendered&&hurt>.02){ctx.save();ctx.globalAlpha*=hurt*.65;ctx.strokeStyle='#fff4b1';ctx.lineWidth=5;for(let i=0;i<5;i++){const a=i*Math.PI*2/5+t*.3;ctx.beginPath();ctx.moveTo(Math.cos(a)*55,-200+Math.sin(a)*46);ctx.lineTo(Math.cos(a)*78,-200+Math.sin(a)*64);ctx.stroke();}ctx.restore();}
    ctx.restore();
    if(rendered){GM_draws++;GM_counts[kind.id]++;GM_lastPose={...pose,x:GM_FINITE(x),y:GM_FINITE(y),scale:s,height:370*s};}
    return rendered;
  }
  return {draw,destroy(){GM_closed=true;GM_lastPose=null;},getState(){return {ready:!GM_closed,loading:false,closed:GM_closed,error:null,types:GARDEN_MONSTER_TYPES.map(type=>type.id),articulated:true,vectorDraws:GM_draws,bitmapDraws:0,fallbackDraws:0,drawCounts:{...GM_counts},lastPose:GM_lastPose};}};
}
