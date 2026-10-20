// Original articulated designs inspired by familiar anime/cartoon archetypes.
export const GARDEN_ANIME_TYPES=Object.freeze([
{id:'orange-ninja',name:'Orange ninja inspired original',color:'#ef8d2b',power:'spiral',damage:44,cooldown:7},
{id:'straw-pirate',name:'Straw pirate inspired original',color:'#d7443c',power:'rubberPunch',damage:55,cooldown:8},
{id:'solar-fighter',name:'Solar fighter inspired original',color:'#f38b31',power:'energyWave',damage:62,cooldown:9},
{id:'moon-guardian',name:'Moon guardian inspired original',color:'#d964a7',power:'moonRibbon',damage:38,cooldown:6},
{id:'storm-fox',name:'Storm fox inspired original',color:'#f4cc4e',power:'electricFork',damage:42,cooldown:7},
{id:'pocket-cat',name:'Pocket robot cat inspired original',color:'#409bd0',power:'airCannon',damage:48,cooldown:8}
]);
const TYPES=new Map(GARDEN_ANIME_TYPES.map(t=>[t.id,t]));
export function drawGardenAnime(ctx,{id,x,y,height=100,time=0,attack=0,death=0}){
 const t=TYPES.get(id);if(!t)return false;const p=time*5,bob=Math.sin(p)*2,a=Math.max(0,Math.min(1,attack)),s=height/100;
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha*=1-death;ctx.rotate(death*.7);ctx.lineCap='round';ctx.lineJoin='round';
 const line=(pts,color,w)=>{ctx.strokeStyle='#203143';ctx.lineWidth=w+3;ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();};
 const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.strokeStyle='#203143';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
 for(const side of[-1,1]){let hip=side*7,knee=hip+Math.sin(p+side)*7,ankle=side*10+Math.sin(p+side)*10;line([[hip,-36+bob],[knee,-19],[ankle,-4]],t.color,10);ellipse(ankle-3,-3,9,4,'#253e65');}
 ellipse(0,-50+bob,15,22,t.color);
 let fist=-25-a*(id==='straw-pirate'?65:18),fy=-57-a*8;
 line([[9,-62+bob],[18,-49+Math.sin(p)*4],[6,-40]],t.color,8);line([[-10,-63+bob],[-20-a*8,-51-a*12],[fist,fy]],t.color,8);ellipse(fist,fy,5,6,'#ffe1b1');
 ellipse(0,-82+bob,13,15,id==='pocket-cat'?'#62bde7':id==='storm-fox'?'#f4cc4e':'#ffe1b1');
 if(id==='storm-fox'){line([[-8,-92],[-15,-108]],t.color,8);line([[8,-92],[13,-108]],t.color,8);line([[12,-48],[34,-59],[25,-69],[41,-77]],t.color,9);}
 if(id==='pocket-cat'){ellipse(-10,-94,6,6,t.color);ellipse(10,-94,6,6,t.color);ellipse(-3,-79,9,10,'#f3fbff');ellipse(-12,-80,3,3,'#e75c57');ellipse(0,-48,10,11,'#f3fbff');line([[-8,-42],[8,-42]],'#5097bd',2);}
 if(id==='straw-pirate'){ellipse(0,-95,24,5,'#e8cb72');ellipse(2,-100,14,8,'#e8cb72');line([[-12,-96],[14,-96]],'#c64a43',3);}
 if(id==='orange-ninja'){line([[-13,-88],[13,-88]],'#334f73',6);line([[10,-87],[25,-80-Math.sin(p)*5],[37,-84]],'#334f73',4);}
 if(id==='solar-fighter'){line([[-10,-94],[-7,-106],[-1,-96],[6,-109],[9,-94]],'#1f2d3d',6);line([[-11,-56],[9,-44]],'#244b87',5);}
 if(id==='moon-guardian'){line([[-10,-92],[-18,-99],[-23,-89],[-23,-65+Math.sin(p)*5]],'#efd675',7);line([[10,-92],[20,-99],[25,-89],[24,-65-Math.sin(p)*5]],'#efd675',7);line([[-13,-40],[0,-49],[14,-40]],'#3b5d9a',9);ellipse(0,-65,5,4,'#e96192');}
 line([[-9,-83],[-5,-83]],'#203143',2);ellipse(-10,-77,2,1,'#203143');
 if(a>0){ctx.strokeStyle=id==='storm-fox'?'#fff49b':'#98f7ff';ctx.fillStyle=t.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(fist-5,fy,6+a*9,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const q=p+i*Math.PI/2;line([[fist+Math.cos(q)*(8+a*9),fy+Math.sin(q)*(8+a*9)],[fist+Math.cos(q)*(14+a*12),fy+Math.sin(q)*(14+a*12)]],'#dcfcff',2);}}
 ctx.restore();return true;
}
export function createGardenAnime({damageDefender,log=()=>{},cue=()=>{}}){
 return {update(lane,sim,wall){if(lane.eaten)return;for(const mob of lane.mobs){const t=TYPES.get(mob.monsterId||mob.type?.id);if(!t||mob.dead)continue;mob.animeReady??=sim+2;if(mob.animeCast){if(wall>=mob.animeCast.strike){const target=lane.defenders.find(d=>d.uid===mob.animeCast.target&&!d.eaten&&d.hp>0);if(target){damageDefender(lane,target,t.damage,mob);log({type:t.power,laneId:lane.entry.id,damage:t.damage});cue(lane,'fireball');}mob.animeCast=null;}continue;}if(sim<mob.animeReady)continue;const target=lane.defenders.filter(d=>!d.eaten&&d.hp>0&&!['trooper','clonesword'].includes(d.weapon)).sort((a,b)=>b.position-a.position)[0];if(!target)continue;mob.animeReady=sim+t.cooldown;mob.animeCast={target:target.uid,born:wall,strike:wall+650};mob.animeAttackUntil=wall+900;}},draw(ctx,lanes,wall){for(const lane of lanes)for(const mob of lane.mobs){const t=TYPES.get(mob.monsterId||mob.type?.id),cast=mob.animeCast;if(!t||!cast||mob.dead)continue;const target=lane.defenders.find(d=>d.uid===cast.target);if(!target)continue;const p=Math.min(1,(wall-cast.born)/650),x=lane.plantX+mob.x*lane.travel,y=lane.floor-55*lane.zombieScale,tx=lane.plantX+target.position*lane.travel,ty=lane.floor-38*lane.zombieScale;ctx.save();ctx.strokeStyle=t.color;ctx.fillStyle=t.color;ctx.lineWidth=t.power==="energyWave"?12:4;ctx.shadowColor=t.color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(x,y);if(t.power==="electricFork")for(let i=1;i<=8;i++)ctx.lineTo(x+(tx-x)*p*i/8,y+(ty-y)*p*i/8+(i%2?9:-9));else if(t.power==="moonRibbon")ctx.quadraticCurveTo((x+tx)/2,y-65, x+(tx-x)*p,y+(ty-y)*p);else if(t.power==="rubberPunch"){ctx.lineWidth=9;ctx.lineTo(x+(tx-x)*p,y+(ty-y)*p);}else{ctx.arc(x+(tx-x)*p,y+(ty-y)*p,t.power==="airCannon"?10+p*15:8,0,Math.PI*2);}ctx.stroke();ctx.restore();}},destroy(){}};
}

