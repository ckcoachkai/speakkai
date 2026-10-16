/** Connected, deterministic370px cameo rigs. All characters face LEFT.
 * Each leg has hip/knee/ankle joints; arms, ears, jaws and wings move separately.
 * Presentation only: no combat values, spawning, outcomes or random generator.
 */
const CA_TAU=Math.PI*2;
const CA_N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const CA_C=(v,a,b)=>Math.max(a,Math.min(b,CA_N(v,a)));
const CA_IDS=new Set(['labubu','niulai','duck','mummy']);
const CA_COLORS={
 labubu:{base:'#986746',light:'#c9956c',dark:'#513826',outline:'#493124',face:'#f4dfb6'},
 niulai:{base:'#eeb64d',light:'#ffe493',dark:'#ba7c27',outline:'#80512a',face:'#fff0c9'},
 duck:{base:'#f8cf2d',light:'#fff28c',dark:'#d79519',outline:'#a46a16',face:'#ffb347'},
 mummy:{base:'#c7b98e',light:'#f1e4bb',dark:'#8b8166',outline:'#5a5847',face:'#ded2aa'}
};
function CA_GRAD(ctx,x,y,x2,y2,colors){const g=ctx.createLinearGradient(x,y,x2,y2);colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));return g;}
function CA_ELL(ctx,x,y,rx,ry,fill,stroke=null,width=2,angle=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,CA_TAU);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function CA_PATH(ctx,points,fill,stroke,width=2){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}}
function CA_LINE(ctx,points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.stroke();}
function CA_WORLD(p,x,y){const c=Math.cos(p.tilt),s=Math.sin(p.tilt);return{x:p.hip.x+x*c-y*s,y:p.hip.y+x*s+y*c};}
function CA_IK(hip,ankle,a=54,b=55){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=CA_C(Math.hypot(dx,dy),1,a+b-.05),toward=Math.atan2(dy,dx);
 const angle=toward+Math.acos(CA_C((a*a+d*d-b*b)/(2*a*d),-1,1));
 const knee={x:hip.x+Math.cos(angle)*a,y:hip.y+Math.sin(angle)*a};
 return{hip,knee,ankle,hipAngle:angle,kneeAngle:Math.atan2(ankle.y-knee.y,ankle.x-knee.x)-angle};
}
export function getGardenCameoAPose({id='labubu',time=0,walk=1,attack=0,hit=0,death=0}={}){
 if(!CA_IDS.has(id))return null;
 const t=CA_N(time),w=CA_C(walk,0,1),a=CA_C(attack,0,1),h=CA_C(hit,0,1),d=CA_C(death,0,1);
 const phase=t*(id==='mummy'?3.8:5.1),stride=(id==='duck'?32:id==='mummy'?22:28)*w*(1-d);
 const hip={x:Math.sin(phase)*3*w+h*12,y:-105-Math.abs(Math.sin(phase))*7*w+Math.sin(t*1.9)*2+d*66};
 const p={id,time:t,walk:w,attack:a,hit:h,death:d,phase,hip,tilt:Math.sin(phase)*.035*w+h*.09-d*.34,
  blink:((t+(id==='duck'?.63:id==='mummy'?1.17:0))%4.1)<.12,
  headTilt:Math.sin(phase-.4)*.035*w-h*.13+d*.21,earSwing:Math.sin(phase+.8)*.13*w,
  wingAngle:Math.sin(phase*1.5)*(.12+w*.5)-a*.85,droop:d*.8};
 p.legs=[-1,1].map((side,i)=>{
  const q=phase+i*Math.PI,swing=Math.sin(q),lift=Math.max(0,Math.cos(q))*(id==='mummy'?10:20)*w*(1-d);
  return{side,...CA_IK(CA_WORLD(p,side*24,0),{x:side*27+swing*stride,y:-9-lift},54,55)};
 });
 p.arms=[-1,1].map((side,i)=>{
  const shoulder=CA_WORLD(p,side*49,-94),front=side===-1;
  const upper=(front?1.95:1.21)+Math.sin(phase+i*Math.PI)*.55*w*(1-a)-a*(front?-.0: .15)+d*.25;
  const angle=front?upper*(1-a)+Math.PI*.97*a:upper;
  const elbow={x:shoulder.x+Math.cos(angle)*51,y:shoulder.y+Math.sin(angle)*51};
  const fore=angle+(front?-.28:.22)+Math.sin(phase+1)*.16*w-a*.45;
  return{side,shoulder,elbow,hand:{x:elbow.x+Math.cos(fore)*48,y:elbow.y+Math.sin(fore)*48},upperAngle:angle,elbowAngle:fore-angle};
 });
 return p;
}
function CA_BONE(ctx,a,b,width,c,bandaged=false){
 const fill=CA_GRAD(ctx,a.x-width/2,a.y,b.x+width/2,b.y,[c.light,c.base,c.dark]);
 CA_LINE(ctx,[[a.x,a.y],[b.x,b.y]],c.outline,width+4);CA_LINE(ctx,[[a.x,a.y],[b.x,b.y]],fill,width);
 if(bandaged){
  const dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy)),nx=-dy/dist,ny=dx/dist;
  for(let t=.15;t<.98;t+=.18){const x=a.x+dx*t,y=a.y+dy*t;CA_LINE(ctx,[[x-nx*width*.43,y-ny*width*.43-2],[x+nx*width*.43,y+ny*width*.43+2]],'#9d9475',1.6);}
 }
}
function CA_LEG(ctx,leg,c,id,p){
 const width=id==='mummy'?22:id==='duck'?17:27;
 const lc=id==='duck'?{...c,base:'#f1a438',light:'#ffd073',dark:'#c4761e',outline:'#a7671b'}:c;
 CA_BONE(ctx,leg.hip,leg.knee,width+3,lc,id==='mummy');CA_BONE(ctx,leg.knee,leg.ankle,width,lc,id==='mummy');
 CA_ELL(ctx,leg.knee.x,leg.knee.y,width*.52,width*.52,lc.base);
 ctx.save();ctx.translate(leg.ankle.x,leg.ankle.y);ctx.rotate(Math.sin(p.phase+(leg.side<0?0:Math.PI))*.12*p.walk+p.death*.22);
 if(id==='duck'){
  CA_PATH(ctx,[[10,-5],[-7,-12],[-37,-1],[-30,4],[-42,10],[-13,14],[15,6]],CA_GRAD(ctx,-26,-10,2,13,['#ffc36a','#ee982a','#d57a1e']),lc.outline,2.5);
  CA_LINE(ctx,[[-6,-5],[-24,5]],'#df8822',1.4);CA_LINE(ctx,[[2,-3],[-10,8]],'#df8822',1.4);
 }else{
  CA_ELL(ctx,-10,0,id==='mummy'?27:29,12,CA_GRAD(ctx,-28,-10,14,10,[lc.light,lc.base,lc.dark]),lc.outline,2.5);
  if(id==='niulai')CA_LINE(ctx,[[-13,-6],[-15,7]],'#a66c29',2.8);
  if(id==='labubu')for(let i=0;i<3;i++)CA_ELL(ctx,-25+i*8,-2,2.5,4,'#ebcf9c');
  if(id==='mummy')for(let i=0;i<3;i++)CA_LINE(ctx,[[-26+i*10,-5],[-22+i*10,5]],'#938b6d',1.5);
 }
 ctx.restore();
}
function CA_ARM(ctx,arm,c,id,p){
 CA_BONE(ctx,arm.shoulder,arm.elbow,id==='mummy'?22:26,c,id==='mummy');CA_BONE(ctx,arm.elbow,arm.hand,id==='mummy'?19:23,c,id==='mummy');
 CA_ELL(ctx,arm.elbow.x,arm.elbow.y,13,13,c.base);
 ctx.save();ctx.translate(arm.hand.x,arm.hand.y);ctx.rotate(arm.upperAngle+arm.elbowAngle-Math.PI/2);
 CA_ELL(ctx,0,6,id==='mummy'?13:17,20,CA_GRAD(ctx,-15,-8,14,21,[c.light,c.base,c.dark]),c.outline,2);
 if(id==='mummy')for(let i=0;i<4;i++)CA_LINE(ctx,[[-10+i*7,14],[-14+i*7,30]],'#c8bc98',4);
 if(id==='labubu')for(let i=0;i<3;i++)CA_ELL(ctx,-10+i*8,19,3,4,'#ead6af');
 if(id==='niulai')CA_LINE(ctx,[[0,5],[0,23]],'#b87b2d',2.5);
 ctx.restore();
}
function CA_EYE(ctx,x,y,rx,ry,p,iris='#382b20'){
 const open=p.blink? .8:ry;
 CA_ELL(ctx,x,y,rx,open,'#fff9e8','#5c412b',1.8);
 if(!p.blink){CA_ELL(ctx,x-rx*.25,y+1,rx*.5,ry*.76,iris);CA_ELL(ctx,x-rx*.35-2,y-ry*.27,rx*.18,ry*.2,'#ffffff');CA_ELL(ctx,x+2,y+ry*.35,rx*.08,ry*.1,'#fff9d9');}
}
function CA_FUR(ctx,c){
 // Shaped edge tufts retain a soft toy silhouette around the shaded body.
 for(let i=0;i<15;i++){const a=-Math.PI+i*Math.PI*2/15,x=Math.cos(a)*62,y=-65+Math.sin(a)*84;
  CA_PATH(ctx,[[x-7,y-3],[x+Math.cos(a)*12,y+Math.sin(a)*12],[x+8,y+5]],c.base);}
}
function CA_LABUBU(ctx,p,c){
 CA_FUR(ctx,c);CA_ELL(ctx,0,-65,65,91,CA_GRAD(ctx,-60,-140,58,17,[c.light,c.base,c.dark]),c.outline,3);
 CA_ELL(ctx,-10,-50,43,57,'#b88860');
 ctx.save();ctx.translate(-31,-152);ctx.rotate(p.headTilt);
 for(const[side,x]of[[-1,-38],[1,24]]){
  ctx.save();ctx.translate(x,-49);ctx.rotate(side*.09+p.earSwing*side);
  CA_PATH(ctx,[[-18,8],[-15,-31],[0,-67],[17,-24],[16,10]],CA_GRAD(ctx,-17,-50,16,10,[c.light,c.base,c.dark]),c.outline,3);
  CA_PATH(ctx,[[-10,0],[-8,-28],[0,-52],[10,-24],[9,1]],'#ddbd91');ctx.restore();
 }
 CA_ELL(ctx,0,0,82,68,CA_GRAD(ctx,-71,-59,70,66,[c.light,c.base,c.dark]),c.outline,3);
 for(let i=0;i<9;i++){const a=Math.PI*.15+i*Math.PI*.19;CA_PATH(ctx,[[Math.cos(a)*70,Math.sin(a)*58],[Math.cos(a)*88,Math.sin(a)*70],[Math.cos(a+.13)*74,Math.sin(a+.13)*61]],c.base);}
 ctx.beginPath();ctx.moveTo(-72,-24);ctx.bezierCurveTo(-61,-65,-29,-57,-14,-42);ctx.bezierCurveTo(6,-65,44,-44,45,-6);ctx.bezierCurveTo(72,39,20,61,-24,54);ctx.bezierCurveTo(-75,51,-96,16,-72,-24);ctx.fillStyle=CA_GRAD(ctx,-55,-46,30,53,['#fff0cf','#ecd6ae']);ctx.fill();
 CA_EYE(ctx,-46,-15,15,18,p);CA_EYE(ctx,8,-10,14,17,p);
 CA_ELL(ctx,-69,9,10,7,'#473126');CA_ELL(ctx,-72,6,3,2,'#b89979');
 CA_LINE(ctx,[[-60,-41],[-38,-43]],'#6e452c',4);CA_LINE(ctx,[[0,-37],[21,-31]],'#6e452c',4);
 const mouth=10+p.attack*15;CA_ELL(ctx,-20,29,43,mouth,'#563829','#a36c46',1.4,-.03);
 for(let i=0;i<9;i++){const x=-56+i*8;CA_PATH(ctx,[[x,22],[x+7,22],[x+4,31+(i%2)*3]],'#fff9df');}
 if(p.attack>.15)for(let i=0;i<6;i++){const x=-44+i*10;CA_PATH(ctx,[[x,34+p.attack*8],[x+7,34+p.attack*8],[x+3,28+p.attack*4]],'#f8ebcf');}
 CA_ELL(ctx,-61,23,8,4,'#e7b48d');ctx.restore();
}
function CA_NIULAI(ctx,p,c){
 // Tail is a connected joint behind the rounded golden calf body.
 ctx.save();ctx.translate(53,-55);ctx.rotate(Math.sin(p.phase)*.22*p.walk);
 CA_LINE(ctx,[[0,0],[30,-3],[50,-25]],'#d49a39',10);CA_ELL(ctx,51,-29,14,20,'#ad752b',null,2,-.3);ctx.restore();
 CA_ELL(ctx,0,-65,65,91,CA_GRAD(ctx,-55,-140,61,20,[c.light,c.base,c.dark]),c.outline,3);CA_ELL(ctx,-18,-65,39,58,'#ffe4a2');
 ctx.save();ctx.translate(-27,-155);ctx.rotate(p.headTilt);
 for(const[x,side]of[[-39,-1],[28,1]]){
  ctx.save();ctx.translate(x,-52);ctx.rotate(side*.13+p.earSwing*.3);
  ctx.beginPath();ctx.moveTo(-11,6);ctx.quadraticCurveTo(-19,-31,-4,-58);ctx.quadraticCurveTo(-1,-20,13,5);ctx.closePath();ctx.fillStyle=CA_GRAD(ctx,-15,-52,12,10,['#fff8db','#e0c58b','#aa8449']);ctx.fill();ctx.strokeStyle=c.outline;ctx.lineWidth=2;ctx.stroke();ctx.restore();
 }
 for(const[x,side]of[[-57,-1],[48,1]]){
  ctx.save();ctx.translate(x,-33);ctx.rotate(side*(.54+p.earSwing));CA_ELL(ctx,side*15,9,32,19,c.base,c.outline,2);CA_ELL(ctx,side*16,9,22,11,'#eab988');ctx.restore();
 }
 CA_ELL(ctx,0,0,68,71,CA_GRAD(ctx,-63,-61,55,64,[c.light,c.base,c.dark]),c.outline,3);
 CA_PATH(ctx,[[-22,-66],[-5,-88],[2,-65],[23,-77],[14,-55]],'#ffdf83');
 CA_EYE(ctx,-40,-16,22,27,p,'#714320');CA_EYE(ctx,10,-12,20,25,p,'#714320');
 CA_LINE(ctx,[[-60,-47],[-31,-48]],'#b17b2c',3);CA_LINE(ctx,[[-4,-44],[22,-39]],'#b17b2c',3);
 CA_ELL(ctx,-43,31,64,37,CA_GRAD(ctx,-89,2,3,59,['#fff6dc','#f1d9ad']),c.outline,2.5,-.03);
 CA_ELL(ctx,-79,22,6,4,'#9b693c',null,1,-.3);CA_ELL(ctx,-39,20,6,4,'#9b693c',null,1,.25);
 if(p.attack>.1)CA_ELL(ctx,-60,45,23,3+p.attack*12,'#94613d');else{ctx.strokeStyle='#aa7447';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(-62,30,20,.3,1.2);ctx.stroke();}
 ctx.restore();
}
function CA_WING(ctx,p,c,back=false){
 ctx.save();ctx.translate(back?45:-4,back?-100:-74);ctx.rotate((back?-.25:.12)+(back?-1:1)*p.wingAngle);
 ctx.beginPath();ctx.moveTo(14,-26);ctx.bezierCurveTo(-49,-36,-91,10,-48,45);ctx.bezierCurveTo(-21,52,37,14,14,-26);ctx.fillStyle=CA_GRAD(ctx,-60,-30,22,46,[c.light,c.base,c.dark]);ctx.fill();ctx.strokeStyle=c.outline;ctx.lineWidth=2.6;ctx.stroke();
 for(let i=0;i<3;i++){ctx.strokeStyle='#d8a11a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-27-i*10,5+i*9);ctx.quadraticCurveTo(-11-i*9,18+i*8,7-i*5,5+i*8);ctx.stroke();}ctx.restore();
}
function CA_DUCK(ctx,p,c){
 ctx.save();ctx.translate(92,-84);ctx.rotate(Math.sin(p.phase)*.05);CA_PATH(ctx,[[-9,21],[42,-51],[32,9],[16,46]],c.base,c.outline,3);ctx.restore();
 CA_WING(ctx,p,c,true);
 CA_ELL(ctx,-1,-73,111,105,CA_GRAD(ctx,-84,-171,84,26,[c.light,c.base,c.dark]),c.outline,3.3);
 CA_ELL(ctx,-29,-62,60,69,'rgba(255,239,129,.44)');
 ctx.save();ctx.translate(-45,-175);ctx.rotate(p.headTilt*.7);
 CA_ELL(ctx,0,0,74,74,CA_GRAD(ctx,-64,-66,61,71,[c.light,c.base,c.dark]),c.outline,3.3);
 ctx.beginPath();ctx.moveTo(-8,-67);ctx.quadraticCurveTo(22,-104,30,-71);ctx.quadraticCurveTo(11,-82,-8,-67);ctx.fillStyle='#ffe574';ctx.fill();
 CA_ELL(ctx,-31,-15,15,p.blink?1:20,'#312b1e');if(!p.blink){CA_ELL(ctx,-36,-24,5,6,'#fffdeb');CA_ELL(ctx,-25,-7,2,3,'#fff6cf');}
 ctx.save();ctx.translate(-59,21);ctx.rotate(-p.attack*.08);
 CA_ELL(ctx,-29,-1,52,19,CA_GRAD(ctx,-72,-17,17,17,['#ffd37a','#f1a134','#d77f1e']),c.outline,2.5);
 ctx.save();ctx.translate(6,3);ctx.rotate(-p.attack*.23);CA_ELL(ctx,-36,5+p.attack*13,48,10,'#e8982e',c.outline,2.1);ctx.restore();
 CA_LINE(ctx,[[-78,4],[-14,5]],'#ac641c',1.8);CA_ELL(ctx,-46,-6,4,2,'#b77527');ctx.restore();ctx.restore();
 CA_WING(ctx,p,c,false);
}
function CA_STRIP(ctx,x,y,length,time,stage){
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time*2.5+x)*.1);
 ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(30,5+Math.sin(time*3)*11,10,length*.6,35+Math.sin(time*2)*12,length);ctx.lineTo(43+Math.sin(time*2)*12,length-3);ctx.bezierCurveTo(21,length*.5,42,9,8,-2);ctx.closePath();ctx.fillStyle='#d4c79e';ctx.fill();ctx.strokeStyle='#8c856b';ctx.lineWidth=1.1;ctx.stroke();ctx.restore();
}
function CA_MUMMY(ctx,p,c,stage){
 CA_STRIP(ctx,43,-130,68,p.time,stage);CA_STRIP(ctx,33,-36,67,p.time+1,stage);
 CA_ELL(ctx,0,-67,57,91,CA_GRAD(ctx,-48,-148,46,18,[c.light,c.base,c.dark]),c.outline,3);
 ctx.save();ctx.beginPath();ctx.ellipse(0,-67,57,91,0,0,CA_TAU);ctx.clip();
 for(let i=0;i<12;i++){const y=-151+i*16;ctx.strokeStyle=i%2?'#eee1b9':'#9b9273';ctx.lineWidth=i%2?8:2;ctx.beginPath();ctx.moveTo(-72,y-13);ctx.quadraticCurveTo(-5,y+20,72,y-5);ctx.stroke();}ctx.restore();
 ctx.save();ctx.translate(-18,-190);ctx.rotate(p.headTilt-.06);
 CA_ELL(ctx,0,0,51,61,CA_GRAD(ctx,-43,-55,44,55,[c.light,c.base,c.dark]),c.outline,3);
 ctx.save();ctx.beginPath();ctx.ellipse(0,0,51,61,0,0,CA_TAU);ctx.clip();
 for(let i=0;i<9;i++){const y=-62+i*15;CA_LINE(ctx,[[-57,y],[57,y+10]],i%2?'#ede0b5':'#a69b7a',i%2?10:2);}ctx.restore();
 CA_PATH(ctx,[[-47,-17],[31,-12],[32,6],[-47,3]],'#454b38');
 if(!p.blink){CA_ELL(ctx,-32,-5,10,8,'#c6d89b');CA_ELL(ctx,3,-2,9,7,'#c6d89b');CA_ELL(ctx,-35,-4,3,5,'#273327');CA_ELL(ctx,0,-1,3,4,'#273327');}
 CA_ELL(ctx,-28,29,19,5+p.attack*11,'#695e46');
 CA_LINE(ctx,[[-43,16],[27,20]],'#e4d7b0',10);CA_LINE(ctx,[[-40,42],[24,49]],'#e4d7b0',10);
 CA_STRIP(ctx,37,-35,91,p.time+2,stage);CA_PATH(ctx,[[-7,-58],[8,-75],[19,-58]],'#c8bb94');ctx.restore();
}
function CA_WEAR(ctx,p,stage,c){
 if(!stage)return;
 ctx.save();ctx.translate(p.hip.x,p.hip.y);ctx.rotate(p.tilt);
 const tint=p.id==='duck'?'#ca8a29':p.id==='mummy'?'#827961':'#a7754b';
 for(let i=0;i<stage;i++){
  const x=-35+(i*23)%70,y=-100+i*23;
  CA_ELL(ctx,x,y,7+i*1.5,3,'rgba(112,90,54,.18)',null,1,-.4);
  CA_LINE(ctx,[[x-5,y-4],[x+3,y+3],[x+8,y-1]],tint,1.7);
 }
 if(stage>=3){CA_LINE(ctx,[[17,-75],[26,-65],[21,-51]],'#dec59b',2);if(p.id==='mummy')CA_STRIP(ctx,-41,-91,48,p.time+3,stage);}
 ctx.restore();
}
export function drawGardenCameoA(ctx,{id,time=0,walk=1,attack=0,hit=0,damageStage=0,death=0}={}){
 if(!CA_IDS.has(id)||!ctx)return false;
 const p=getGardenCameoAPose({id,time,walk,attack,hit,death}),c=CA_COLORS[id],stage=Math.round(CA_C(damageStage,0,4));
 ctx.save();
 CA_ELL(ctx,0,0,id==='duck'?95:65,11,'rgba(36,39,25,.19)');
 ctx.filter=`saturate(${1-stage*.045}) brightness(${1+p.hit*.42-stage*.018})`;
 const rear=p.legs[1],front=p.legs[0];CA_LEG(ctx,rear,c,id,p);
 if(id!=='duck')CA_ARM(ctx,p.arms[1],c,id,p);
 CA_LEG(ctx,front,c,id,p);
 ctx.save();ctx.translate(p.hip.x,p.hip.y);ctx.rotate(p.tilt);
 if(id==='labubu')CA_LABUBU(ctx,p,c);else if(id==='niulai')CA_NIULAI(ctx,p,c);else if(id==='duck')CA_DUCK(ctx,p,c);else CA_MUMMY(ctx,p,c,stage);
 ctx.restore();
 if(id!=='duck')CA_ARM(ctx,p.arms[0],c,id,p);
 ctx.filter='none';CA_WEAR(ctx,p,stage,c);
 if(p.hit>.05){ctx.globalAlpha*=p.hit*.65;for(let i=0;i<4;i++){const a=i*CA_TAU/4+p.time*.2,x=-29+Math.cos(a)*45,y=-200+Math.sin(a)*36;CA_LINE(ctx,[[x,y],[x+Math.cos(a)*12,y+Math.sin(a)*12]],'#fff4c0',3);}}
 ctx.restore();return true;
}
