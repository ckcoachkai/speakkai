// Lane-owned airborne allies and readable, jointed cartoon crawlers.
export function createGardenSupport({allies,damage,launch,log,cue}) {
 const bursts=[];
 const live=lane=>lane.mobs.filter(m=>!m.dead);
 function blast(lane,x,radius,amount,wall,kind){
  for(const mob of live(lane))if(Math.abs(mob.x-x)<=radius){launch(mob,wall);damage(lane,mob,amount,kind);}
  bursts.push({lane:lane.index,x,wall,kind});cue(lane,kind);log({type:kind,laneId:lane.entry.id,x,radius,damage:amount});
 }
 function update(lane,sim,wall,dt){
  lane.airSupport??={next:8,index:lane.index%10,flyer:null,bombs:[],beams:[],crawlers:[],nextCrawler:10};
  const a=lane.airSupport;
  if(lane.eaten){a.flyer=null;a.crawlers=[];a.bombs=[];return;}
  if(!a.flyer&&sim>=a.next&&live(lane).length){const id='gundam'+a.index;a.index=(a.index+1)%10;if(allies.has(id))a.flyer={id,born:wall,nextLaser:wall+500,nextBomb:wall+2300,x:.38};a.next=sim+24;}
  const f=a.flyer;
  if(f){
   f.x=.40+Math.sin((wall-f.born)/2400)*.10;
   const target=live(lane).filter(m=>m.x>f.x+.04).sort((x,y)=>x.x-y.x)[0];
   if(target&&wall>=f.nextLaser){f.nextLaser=wall+650;a.beams.push({id:f.id,x:f.x,target:target.x,wall});damage(lane,target,9,'gundamLaser');cue(lane,'laser');}
   if(target&&wall>=f.nextBomb){f.nextBomb=wall+4300;a.bombs.push({id:f.id,x:f.x,target:target.x,wall});}
   if(wall-f.born>11000)a.flyer=null;
  }
  a.beams=a.beams.filter(b=>wall-b.wall<150);
  a.bombs=a.bombs.filter(b=>{if(wall-b.wall<850)return true;blast(lane,b.target,.065,80,wall,'gundamBomb');return false;});
  if(sim>=a.nextCrawler&&live(lane).length&&a.crawlers.length<2){a.nextCrawler=sim+28;a.crawlers.push({x:(-35-lane.plantX)/lane.travel,phase:0,born:wall,charging:null});}
  for(const c of a.crawlers){
   const target=live(lane).filter(m=>m.x>=c.x-.025).sort((x,y)=>x.x-y.x)[0];
   if(c.charging!==null){if(wall-c.charging>=1100){blast(lane,c.x,1.5/9,1800,wall,'crawlerCherry');c.done=true;}continue;}
   if(!target)continue;
   const speed=(target.type.family==='newspaper'&&target.enragedAt!==null?target.type.enragedSpeed:target.speed)*(sim<target.slowUntil?target.slow:1);
   c.speed=2*speed;c.phase+=dt*c.speed*lane.travel/7;c.x=Math.min(target.x-.022,c.x+c.speed*dt);
   if(target.x-c.x<=.024)c.charging=wall;
  }
  a.crawlers=a.crawlers.filter(c=>!c.done&&c.x<1.2);
 }
 function geometry(lane,id,x,wall){const size=allies.dimensions(id),scale=lane.zombieScale*.82;return{x:lane.plantX+x*lane.travel,y:Math.max(36+(size?.bodyHeight||60)*scale,lane.floor-95*lane.spriteScale)+Math.sin(wall/330)*2,scale,w:(size?.width||60)*scale,h:(size?.bodyHeight||60)*scale};}
 function crawler(ctx,c,lane,wall){
  const scale=Math.max(.45,lane.spriteScale*.72),x=lane.plantX+c.x*lane.travel;
  ctx.save();ctx.translate(x,lane.floor);ctx.scale(scale,scale);
  const charge=c.charging!==null,phase=charge?0:c.phase,skin='#f2c3a3',line='#785c58';
  if(charge){ctx.shadowColor=Math.sin(wall/85)>0?'#ff303d':'#63ff62';ctx.shadowBlur=20;ctx.fillStyle=ctx.shadowColor;ctx.globalAlpha=.28;ctx.beginPath();ctx.arc(0,-16,30+Math.sin(wall/90)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;}
  function limb(points,color,width){ctx.strokeStyle=line;ctx.lineWidth=width+2;ctx.lineCap='round';for(const w of[width+2,width]){ctx.lineWidth=w;ctx.strokeStyle=w===width?color:line;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}}
  // Opposite hand/knee advance together; stance half stays on the floor.
  for(const side of[-1,1]){const p=phase+(side===1?0:Math.PI),stride=Math.cos(p)*6,lift=Math.max(0,Math.sin(p))*5;
   limb([[-15,-17],[-23-stride,-3-lift],[-33-stride,-1-lift]],side===1?skin:'#c99b80',7);
   limb([[0,-18],[9+stride*.4,-11-lift],[18+stride,-2-lift]],side===1?skin:'#c99b80',6);
   if(side===-1){ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(-9,-19,19,11,.10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f8fbff';ctx.beginPath();ctx.ellipse(-21,-18,10,11,-.2,0,Math.PI*2);ctx.fill();}
  }
  ctx.fillStyle=skin;ctx.strokeStyle=line;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(15,-28,12,12,.15,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#503c32';ctx.beginPath();ctx.arc(19,-30,1.8,0,7);ctx.fill();ctx.strokeStyle='#704535';ctx.beginPath();ctx.arc(19,-25,4,0,.9);ctx.stroke();ctx.beginPath();ctx.moveTo(10,-39);ctx.quadraticCurveTo(11,-46,17,-40);ctx.stroke();ctx.restore();
 }
 function draw(ctx,lanes,wall){
  for(const lane of lanes){const a=lane.airSupport;if(!a)continue;
   for(const c of a.crawlers)crawler(ctx,c,lane,wall);
   if(a.flyer){const g=geometry(lane,a.flyer.id,a.flyer.x,wall);allies.draw(ctx,{id:a.flyer.id,...g,time:wall/1000});}
   for(const b of a.beams){const g=geometry(lane,b.id,b.x,b.wall);ctx.save();ctx.globalAlpha=1-(wall-b.wall)/150;ctx.strokeStyle='#9af8ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(g.x+g.w*.40,g.y-g.h*.12);ctx.lineTo(lane.plantX+b.target*lane.travel,lane.floor-24*lane.zombieScale);ctx.stroke();ctx.restore();}
   for(const b of a.bombs){const g=geometry(lane,b.id,b.x,b.wall),p=Math.min(1,(wall-b.wall)/850),x=g.x+(lane.plantX+b.target*lane.travel-g.x)*p,y=g.y+(lane.floor-g.y)*p*p;ctx.save();ctx.fillStyle='#313c4b';ctx.strokeStyle='#ffdd61';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,5,8,-.3,0,7);ctx.fill();ctx.stroke();ctx.restore();}
  }
  for(let i=bursts.length-1;i>=0;i--){const b=bursts[i],p=(wall-b.wall)/650;if(p>=1){bursts.splice(i,1);continue;}const lane=lanes[b.lane];if(!lane)continue;const x=lane.plantX+b.x*lane.travel,y=lane.floor,reach=Math.min(155,Math.max(50,lane.travel*(b.kind==='goblin'?.11:.065)));ctx.save();ctx.globalAlpha=(1-p)*.65;const glow=ctx.createRadialGradient(x,y-12,0,x,y-12,15+reach*p);glow.addColorStop(0,'#fff4b0');glow.addColorStop(.35,'#ff9d36');glow.addColorStop(1,'#ff4a1400');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y-12,15+reach*p,0,7);ctx.fill();ctx.globalAlpha=1-p;ctx.strokeStyle=b.kind==='crawlerCherry'?'#ffcc58':'#a4ecff';ctx.lineWidth=5*(1-p)+1;ctx.beginPath();ctx.ellipse(x,y-4,15+reach*p,6+14*p,0,0,7);ctx.stroke();for(let j=0;j<8;j++){const t=j*Math.PI/4;ctx.fillStyle=j%2?'#ff745a':'#fff2af';ctx.beginPath();ctx.arc(x+Math.cos(t)*p*reach,y-12-Math.abs(Math.sin(t))*p*reach*.7,5*(1-p),0,7);ctx.fill();}ctx.restore();}
 }
 function sky(ctx,width,height,wall){
  const ids=['sky-haku','sky-spirit','sky-haku','sky-spirit','sky-haku','sky-spirit'];
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
  for(let i=0;i<ids.length;i++){const size=[.65,.40,.95,.62,.45,.85][i],x=((wall/1000*(9+i*2)+i*width/6)%(width+180))-90,y=height*(.40+(i%3)*.16)+Math.sin(wall/1000+i)*3;
   if(!allies.has(ids[i]))continue;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(wall/1700+i)*.055);allies.draw(ctx,{id:ids[i],x:0,y:height*.24,scale:size*height/64,time:wall/1000});ctx.restore();
  }ctx.restore();
 }
 return{update,draw,sky,burst(lane,x,wall,kind){bursts.push({lane:lane.index,x,wall,kind});},destroy(){bursts.length=0;}};
}
