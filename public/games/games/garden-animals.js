/** Small, original Canvas animal avatars. Local origin is between the feet.
 * No portrait/gender inference, external assets, random numbers, or timers. */
export const GARDEN_ANIMALS = Object.freeze(['cat','dog','rabbit','lion','tiger','panda','cheetah','puma','leopard','eagle']);

const GA_TAU = Math.PI * 2;
const GA_CLAMP = (n,a,b) => Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):a));
const GA_PALETTES = Object.freeze({
 cat:{fur:'#b9c9d8',light:'#e7f0f7',shade:'#8198b1',ink:'#3b5065',muzzle:'#f6f7ef',ear:'#dfacb4'},
 dog:{fur:'#ba794b',light:'#e4b580',shade:'#8d543b',ink:'#604031',muzzle:'#fff2d7',ear:'#9b5e40'},
 rabbit:{fur:'#e8e5df',light:'#fffaf0',shade:'#bbb9bd',ink:'#646376',muzzle:'#fffdf5',ear:'#e8adbd'},
 lion:{fur:'#e9b257',light:'#ffe0a0',shade:'#c78a3c',ink:'#765133',muzzle:'#ffe8ba',ear:'#bc7b4d'},
 tiger:{fur:'#ec9f3c',light:'#ffd27e',shade:'#c67930',ink:'#473b35',muzzle:'#fff4db',ear:'#ca8b79'},
 panda:{fur:'#eeeade',light:'#fffdf2',shade:'#c7c7c0',ink:'#34414b',muzzle:'#fffdf3',ear:'#39434d'},
 cheetah:{fur:'#e6c36c',light:'#ffe4a5',shade:'#b99a51',ink:'#594c39',muzzle:'#fff2d2',ear:'#c39773'},
 puma:{fur:'#bca286',light:'#e7cfad',shade:'#907d6e',ink:'#594f49',muzzle:'#f6e9d5',ear:'#c98f92'},
 leopard:{fur:'#d9b164',light:'#f7d78f',shade:'#b58d4f',ink:'#564635',muzzle:'#fff0cd',ear:'#c89685'},
 eagle:{fur:'#f3f0df',light:'#fffef2',shade:'#caccc6',ink:'#4c4742',muzzle:'#ffcb56',ear:'#6c5140'}
});

function GA_ELL(ctx,x,y,rx,ry,fill,stroke,width=1) {
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,GA_TAU);
 if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function GA_PATH(ctx,points,fill,stroke,width=1) {
 ctx.beginPath();for(const [op,...values] of points)ctx[op](...values);
 if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function GA_FUR(ctx,p,x,y,r) {
 const g=ctx.createRadialGradient(x-r*.35,y-r*.4,1,x,y,r*1.3);
 g.addColorStop(0,p.light);g.addColorStop(.55,p.fur);g.addColorStop(1,p.shade);return g;
}
function GA_LINE(ctx,x1,y1,x2,y2,color,width=1) {
 ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function GA_ROSETTE(ctx,x,y,r,ink) {
 ctx.strokeStyle=ink;ctx.lineWidth=1.25;
 for(let i=0;i<3;i++){const a=i*GA_TAU/3;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.45,y+Math.sin(a)*r*.45,r*.65,r*.45,a,0,Math.PI*1.65);ctx.stroke();}
}
function GA_MARKS(ctx,s,p) {
 // Markings are attached to the head and body, not separate power-up badges.
 if(s==='cat') {
  for(const x of [-7,0,7])GA_PATH(ctx,[['moveTo',x-2,-65],['quadraticCurveTo',x,-58,x+2,-63]],null,p.shade,2);
  for(const side of [-1,1])for(let j=0;j<2;j++)GA_LINE(ctx,side*18,-49+j*4,side*14,-47+j*4,p.shade,1.4);
 } else if(s==='tiger') {
  for(const side of [-1,1])for(let j=0;j<3;j++)GA_PATH(ctx,[['moveTo',side*19,-58+j*5],['quadraticCurveTo',side*12,-56+j*5,side*(j===1?10:14),-54+j*5]],null,p.ink,2.5);
  GA_PATH(ctx,[['moveTo',-6,-66],['lineTo',-3,-60],['moveTo',0,-67],['lineTo',0,-59],['moveTo',6,-66],['lineTo',3,-60]],null,p.ink,2);
 } else if(s==='cheetah'||s==='leopard') {
  const spots=[[-13,-61,1.6],[-7,-64,1.3],[7,-64,1.4],[14,-59,1.5],[-17,-53,1.2],[17,-51,1.5],[-15,-43,1.2],[14,-42,1.3]];
  for(const [x,y,r] of spots)if(s==='leopard')GA_ROSETTE(ctx,x,y,r,p.ink);else GA_ELL(ctx,x,y,r,r,p.ink);
 } else if(s==='dog') {
  GA_ELL(ctx,-10,-52,8,11,p.shade);GA_ELL(ctx,2,-63,3.2,6,p.muzzle);
 } else if(s==='panda') {
  ctx.save();ctx.translate(-10,-51);ctx.rotate(.25);GA_ELL(ctx,0,0,7,9,p.ink);ctx.restore();
  ctx.save();ctx.translate(10,-51);ctx.rotate(-.25);GA_ELL(ctx,0,0,7,9,p.ink);ctx.restore();
 }
}
function GA_EARS(ctx,s,p,t,stage) {
 const droop=stage>=5?2:0;
 if(s==='rabbit') {
  for(const side of [-1,1]){
   ctx.save();ctx.translate(side*9,-63);ctx.rotate(side*(.08+Math.sin(t*2.1+side)*.045+droop*.045));
   GA_ELL(ctx,0,-9,5.5,11,GA_FUR(ctx,p,0,-10,12),p.ink,.9);GA_ELL(ctx,0,-10,2.65,7.2,p.ear);ctx.restore();
  }
 } else if(s==='cat'||s==='puma') {
  for(const side of [-1,1])GA_PATH(ctx,[['moveTo',side*6,-64],['quadraticCurveTo',side*11,-71,side*18,-74+droop],['quadraticCurveTo',side*23,-64,side*18,-56],['closePath']],GA_FUR(ctx,p,side*15,-65,13),p.ink,.9);
  for(const side of [-1,1])GA_PATH(ctx,[['moveTo',side*11,-64],['lineTo',side*17,-69+droop],['lineTo',side*18,-61],['closePath']],p.ear);
 } else if(s==='dog') {
  for(const side of [-1,1]){ctx.save();ctx.translate(side*17,-59);ctx.rotate(side*(.12+Math.sin(t*3)*.07));GA_ELL(ctx,side*2,7,7,15,p.ear,p.ink,1);GA_ELL(ctx,side*2,10,3.4,7,'#b77964');ctx.restore();}
 } else if(s!=='eagle') {
  for(const side of [-1,1]){GA_ELL(ctx,side*16,-64,6.6,7,s==='panda'?p.ink:GA_FUR(ctx,p,side*16,-65,8),p.ink,.9);GA_ELL(ctx,side*16,-64,3.4,4,s==='panda'?'#626a70':p.ear);}
 }
}
function GA_TAIL(ctx,s,p,t) {
 if(s==='rabbit'){GA_ELL(ctx,17,-17,7,7,p.light,p.shade,.8);return;}
 if(s==='eagle'){
  for(let i=-1;i<=1;i++)GA_PATH(ctx,[['moveTo',i*4,-17],['lineTo',i*6,-4],['quadraticCurveTo',i*3,-1,i*2-3,-5],['lineTo',-5,-18],['closePath']],'#735541',p.ink,.8);return;
 }
 if(s==='panda')return;
 const sw=Math.sin(t*3.1)*2;
 ctx.lineCap='round';
 GA_PATH(ctx,[['moveTo',11,-19],['bezierCurveTo',24,-17,27,-25+sw,23,-34+sw]],null,p.ink,s==='lion'?5:6);
 GA_PATH(ctx,[['moveTo',11,-19],['bezierCurveTo',24,-17,27,-25+sw,23,-34+sw]],null,p.fur,s==='lion'?3.2:4.2);
 if(s==='lion')GA_ELL(ctx,23,-34+sw,3.3,4.4,'#a86b38',p.ink,.6);
 if(s==='tiger')for(let i=0;i<2;i++)GA_LINE(ctx,23+i,-25-i*4+sw,27-i,-26-i*4+sw,p.ink,1.4);
}
function GA_BODY(ctx,s,p,t,stage,hurt) {
 GA_TAIL(ctx,s,p,t);
 const body=s==='eagle'?'#816147':s==='panda'?p.ink:GA_FUR(ctx,p,0,-20,23);
 GA_ELL(ctx,0,-23,15.5,20,body,p.ink,1.05);
 GA_ELL(ctx,0,-23,9,13.5,s==='eagle'?'#c3a783':p.muzzle);
 if(s==='cheetah'||s==='leopard')for(const [x,y]of[[-11,-28],[10,-28],[-10,-18],[10,-14]]){
  if(s==='leopard')GA_ROSETTE(ctx,x,y,1.4,p.ink);else GA_ELL(ctx,x,y,1.1,1.5,p.ink);
 }
 if(s==='tiger')for(const side of[-1,1])for(let j=0;j<3;j++)GA_LINE(ctx,side*14,-31+j*6,side*10,-28+j*6,p.ink,2);
 const paw=s==='panda'?p.ink:s==='eagle'?'#f5bd49':p.fur;
 for(const side of [-1,1]){
  const wave=Math.sin(t*2.8+side)*.065+((stage>=5)?side*.16:0);
  ctx.save();ctx.translate(side*13,-31);ctx.rotate(side*.12+wave-hurt*side*.1);
  if(s==='eagle'){
   GA_PATH(ctx,[['moveTo',0,0],['quadraticCurveTo',side*14,6,side*12,22],['quadraticCurveTo',side*4,20,-side*2,10],['closePath']],GA_FUR(ctx,{fur:'#795a43',light:'#aa8963',shade:'#553f32'},side*4,10,17),p.ink,1);
   for(let j=0;j<3;j++)GA_LINE(ctx,side*4,7+j*4,side*(10-j),14+j*2,'#c2a478',.7);
  }else{
   GA_ELL(ctx,side*3,7,5.8,10,s==='panda'?p.ink:GA_FUR(ctx,p,side*3,5,12),p.ink,.8);GA_ELL(ctx,side*3,13,4.7,4.4,paw);GA_LINE(ctx,side*2,14,side*2,16,p.shade,.65);
  }ctx.restore();
 }
 for(const side of [-1,1]){
  GA_ELL(ctx,side*8,-6,6,5.6,paw,p.ink,.8);
  for(let j=-1;j<=1;j++)GA_LINE(ctx,side*8+j*2,-4.8,side*8+j*2,-2.6,s==='eagle'?'#9c7132':p.shade,.7);
 }
}
function GA_FACE(ctx,s,p,t,stage,bruise,hurt,eaten) {
 if(s==='lion') {
  // A continuous mane silhouette stays attached behind the face.
  ctx.beginPath();for(let i=0;i<28;i++){const a=i*GA_TAU/28,r=i%2?24:26;const x=Math.cos(a)*r,y=-49+Math.sin(a)*r*.91;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();
  const g=ctx.createRadialGradient(-5,-55,2,0,-49,29);g.addColorStop(0,'#d69a4b');g.addColorStop(1,'#9d6036');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.stroke();
 }
 GA_EARS(ctx,s,p,t,stage);
 if(s==='eagle'){
  GA_PATH(ctx,[['moveTo',-18,-38],['bezierCurveTo',-26,-52,-13,-70,2,-69],['bezierCurveTo',17,-70,24,-55,19,-40],['lineTo',14,-30],['lineTo',7,-34],['lineTo',0,-29],['lineTo',-6,-34],['lineTo',-14,-31],['closePath']],GA_FUR(ctx,p,0,-50,26),p.ink,1);
 }else GA_ELL(ctx,0,-49,20.5,20,GA_FUR(ctx,p,0,-50,24),p.ink,1.05);
 GA_MARKS(ctx,s,p);
 if(s==='cheetah')for(const side of [-1,1])GA_PATH(ctx,[['moveTo',side*9,-50],['quadraticCurveTo',side*10,-44,side*11,-40]],null,p.ink,1.8);
 const eyeY=-51+(stage>=8?1:0), blink=Math.sin(t*1.7+.4)>.993||eaten>.5;
 for(const side of [-1,1]) {
  const x=side*8.2;
  if(blink||stage===8||stage===1){GA_PATH(ctx,[['moveTo',x-3.6,eyeY],['quadraticCurveTo',x,eyeY+(stage===1?-4:stage===8?1.5:2),x+3.6,eyeY]],null,p.ink,1.4);continue;}
  const frightened=stage===5||stage===6||stage===9;
  GA_ELL(ctx,x,eyeY,frightened?4.5:4,frightened?6:5,s==='panda'?'#faf8ee':'#fffdf5');
  const pupilX=x-side*.3+(stage===2?1.2:0);
  GA_ELL(ctx,pupilX,eyeY+.4,stage===6?2:2.6,stage===6?3:3.8,p.ink);GA_ELL(ctx,pupilX-.8,eyeY-1.1,.9,1.15,'#ffffff');
  if(stage===7){GA_PATH(ctx,[['moveTo',x-4.2,eyeY-2],['quadraticCurveTo',x,eyeY-3,x+4.2,eyeY-2]],null,p.fur,3.4);GA_LINE(ctx,x-3.9,eyeY-1,x+3.9,eyeY-1,p.ink,.8);}
  if(stage===7||bruise>1)GA_ELL(ctx,x,eyeY+6,3.7,.8,'#b4a1ad');
 }
 // Eyebrows change with the expression while the species remains recognizable.
 for(const side of [-1,1]){
  const x=side*8.2,tilt=stage>=4?side*1.7:stage===3?-side*.9:0,lift=stage===2&&side===1?-2:0;
  GA_PATH(ctx,[['moveTo',x-3,-59+tilt+lift],['quadraticCurveTo',x,-60-(stage>=5?1:0)+lift,x+3,-59-tilt+lift]],null,p.ink,1.1);
 }
 if(s==='eagle') {
  GA_PATH(ctx,[['moveTo',-5,-45],['quadraticCurveTo',0,-50,5,-45],['lineTo',7,-39],['quadraticCurveTo',0,-33,-7,-39],['closePath']],'#efb53c','#996a30',.85);
  GA_PATH(ctx,[['moveTo',-5,-40],['quadraticCurveTo',0,-38,5,-40]],null,'#a57232',.8);GA_ELL(ctx,-2,-44,.65,.7,'#8b6536');
 }else{
  GA_ELL(ctx,-5.6,-39,7.5,5.8,p.muzzle);GA_ELL(ctx,5.6,-39,7.5,5.8,p.muzzle);
  GA_PATH(ctx,[['moveTo',-3.4,-44],['quadraticCurveTo',0,-46,3.4,-44],['quadraticCurveTo',2,-40,0,-40],['quadraticCurveTo',-2,-40,-3.4,-44]],s==='rabbit'?'#c7889c':p.ink);
  GA_LINE(ctx,0,-40,0,-37,p.ink,.85);
  if(stage>=5&&stage!==7&&stage!==8){GA_ELL(ctx,0,-35,2.6,stage===9?3.7:2.7,p.ink);GA_ELL(ctx,.3,-34,1.7,1.1,'#d899a4');}
  else GA_PATH(ctx,[['moveTo',-4,-36],['quadraticCurveTo',0,stage>=4?-39:stage===3?-35:-32.5,4,-36]],null,p.ink,1.1);
  if(s==='dog'&&stage<=2){GA_ELL(ctx,0,-34,3,4.6,'#d68f9f');GA_LINE(ctx,0,-35,0,-31.5,'#b77286',.65);}
  if(s!=='dog'&&s!=='panda')for(const side of[-1,1])for(let j=0;j<2;j++)GA_LINE(ctx,side*12,-39+j*3,side*20,-40+j*4,p.ink,.55);
 }
 if(stage===0||stage===1||stage===2)for(const side of[-1,1]){ctx.save();ctx.globalAlpha=.22;GA_ELL(ctx,side*14,-43,3.5,1.9,'#df8b91');ctx.restore();}
 if(stage===9)for(const side of[-1,1]){GA_PATH(ctx,[['moveTo',side*12,-47],['quadraticCurveTo',side*15,-41,side*12,-40],['quadraticCurveTo',side*9,-41,side*12,-47]],'#9cd9ec');GA_ELL(ctx,side*12-.5,-42,.6,1.1,'#e9fbff');}
 // A small bruise/ruffled-fur mark is deliberately non-graphic.
 if(bruise>0){ctx.save();ctx.globalAlpha=.16+bruise*.065;GA_ELL(ctx,-15,-42,2.8+bruise*.25,2.1,'#9d8aa8');ctx.restore();for(let j=0;j<Math.min(3,bruise);j++)GA_LINE(ctx,-17+j*2,-43,-16+j*2,-41,p.shade,.7);}
 if(hurt>.2){ctx.save();ctx.globalAlpha=hurt*.45;GA_ELL(ctx,14,-43,3.2,2.1,'#f1b1a6');ctx.restore();}
}

/** Draw one complete connected animal. emotionStage is 0–9, bruiseStage 0–4.
 * Stages: calm, happy, curious, focused, worried, startled, scared, tired,
 * eyes closed, teary. Damage is cosmetic and never changes the species. */
export function drawGardenAnimal(ctx,{species='cat',time=0,emotionStage,bruiseStage=0,hp=1,maxHp=1,color,hurt=0,eaten=0}={}) {
 if(!ctx||!Object.prototype.hasOwnProperty.call(GA_PALETTES,species))return false;
 const p=GA_PALETTES[species],t=Number.isFinite(Number(time))?Number(time):0;
 const ratio=GA_CLAMP(Number(hp)/Math.max(.001,Number(maxHp)||1),0,1);
 const stage=Math.round(GA_CLAMP(emotionStage??Math.floor((1-ratio)*9),0,9));
 const bruise=Math.round(GA_CLAMP(bruiseStage,0,4)),hit=GA_CLAMP(hurt,0,1),gone=GA_CLAMP(eaten,0,1);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 GA_ELL(ctx,0,-1.7,19,1.65,'rgba(30,42,46,.12)');
 ctx.translate(Math.sin(t*34)*hit*1.4,-Math.abs(Math.sin(t*2.8))*.6);
 GA_BODY(ctx,species,p,t,stage,hit);
 // A collar is an integrated wearable accent, never a floating name badge.
 if(typeof color==='string'&&/^#[\da-f]{3}([\da-f]{3})?$/i.test(color)&&species!=='eagle')GA_PATH(ctx,[['moveTo',-9,-33],['quadraticCurveTo',0,-29,9,-33]],null,color,2.3);
 GA_FACE(ctx,species,p,t,stage,bruise,hit,gone);
 ctx.restore();return true;
}
