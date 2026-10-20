/** Niu Lai (牛来): original procedural pose adaptations, generated reference artwork.
 * See assets/niulai-poses/provenance.json. Not movie-native animation frames. */
const names=['standing','sitting','dancing','sleeping','running','surprised','waving','cheering','thinking','stretching','tiptoeing','jumping','reading','clapping','bowing','balancing','shy','laughing','peeking','relaxing'];
export const NIULAI_VARIANTS=Object.freeze(names.map((pose,i)=>Object.freeze({id:'niulai-'+pose,name:'牛来 · '+pose,label:'Niu Lai · '+pose,pose,index:i,width:160,height:224,normalHeight:112,sourced:true,sourceKind:'generated-reference-adaptation'})));
export function niulaiPose(id,time=0){
 const k=String(id).replace(/^niulai-/,''),t=Number.isFinite(+time)?+time:0,s=Math.sin(t*4),c=Math.cos(t*4);
 const p={hip:[0,-72],head:[0,-168],tilt:0,body:0,leftHand:[-40,-70],rightHand:[40,-70],leftFoot:[-17,-5],rightFoot:[17,-5],prop:null,eyes:'normal'};
 switch(k){
 case 'sitting':p.hip=[0,-37];p.head=[0,-130];p.leftHand=[-30,-34];p.rightHand=[30,-34];p.leftFoot=[-34,-5];p.rightFoot=[34,-5];break;
 case 'dancing':p.hip=[8*s,-65+3*c];p.head=[8*s,-161+3*c];p.tilt=.07*s;p.leftHand=[-45,-105-22*s];p.rightHand=[45,-105+22*s];p.leftFoot=[-20,-5-8*Math.max(0,-s)**2];p.rightFoot=[20,-5-8*Math.max(0,s)**2];break;
 case 'sleeping':p.hip=[0,-32];p.head=[-28,-62];p.body=-.9;p.tilt=-.6;p.leftHand=[-45,-20];p.rightHand=[-18,-20];p.leftFoot=[35,-7];p.rightFoot=[51,-7];p.eyes='closed';p.prop='zzz';break;
 case 'running':p.hip=[0,-69-3*c];p.head=[-8,-163-3*c];p.body=-.13;p.leftHand=[-35-12*s,-95];p.rightHand=[35+12*s,-112];p.leftFoot=[-20-19*s,-5-22*Math.max(0,c)**2];p.rightFoot=[20+19*s,-5-22*Math.max(0,-c)**2];break;
 case 'surprised':p.leftHand=[-50,-134-3*s];p.rightHand=[50,-134-3*s];p.head[1]-=3;p.prop='surprise';break;
 case 'waving':p.rightHand=[49+9*s,-159+4*c];p.tilt=-.05;break;
 case 'cheering':p.leftHand=[-45,-164-5*s];p.rightHand=[45,-164-5*s];p.hip[1]-=3*s;p.head[1]-=3*s;break;
 case 'thinking':p.rightHand=[13,-137];p.leftHand=[-20,-78];p.tilt=.09;p.prop='thought';break;
 case 'stretching':p.leftHand=[-20,-181-3*s];p.rightHand=[20,-181-3*s];p.head[1]-=4;p.hip[1]-=3;break;
 case 'tiptoeing':p.leftFoot=[-16,-15];p.rightFoot=[17,-15-6*s];p.hip[1]-=8;p.head[1]-=8;p.leftHand=[-52,-104];p.rightHand=[52,-104];break;
 case 'jumping':{const h=22*(.5+.5*s);p.hip[1]-=h;p.head[1]-=h;p.leftFoot=[-26,-5-h];p.rightFoot=[26,-5-h];p.leftHand=[-48,-147-h];p.rightHand=[48,-147-h];break;}
 case 'reading':p.leftHand=[-22,-104];p.rightHand=[22,-104];p.head[1]+=5;p.tilt=.03;p.prop='book';break;
 case 'clapping':p.leftHand=[-9-10*(1+c),-107];p.rightHand=[9+10*(1+c),-107];break;
 case 'bowing':p.head=[-25,-139+5*s];p.body=-.3;p.tilt=-.2;p.leftHand=[-23,-62];p.rightHand=[21,-62];break;
 case 'balancing':p.leftHand=[-57,-112];p.rightHand=[57,-112];p.leftFoot=[-3,-5];p.rightFoot=[35,-39+4*s];p.hip[0]=-9;p.head[0]=-9;p.tilt=.04*s;break;
 case 'shy':p.leftHand=[-8,-88];p.rightHand=[8,-88];p.head[1]+=7;p.tilt=.12+.02*s;break;
 case 'laughing':p.leftHand=[-20,-86];p.rightHand=[20,-86];p.head[1]+=3*s;p.tilt=.08*s;p.prop='laugh';break;
 case 'peeking':p.leftHand=[-18,-137];p.rightHand=[18,-137];p.head[0]=5*s;p.tilt=.05*s;break;
 case 'relaxing':p.hip=[0,-35];p.head=[15,-119];p.leftHand=[-31,-124];p.rightHand=[39,-124];p.leftFoot=[-43,-5];p.rightFoot=[43,-5];p.tilt=.12;break;
 default:p.head[1]+=Math.sin(t*2)*1.2;
 }
 const breath=Math.sin(t*1.8)*.7; p.hip[1]+=breath;p.head[1]+=breath;p.leftHand[1]+=breath;p.rightHand[1]+=breath;
 return p;
}
function ellipse(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function bone(ctx,a,b,width){const g=ctx.createLinearGradient(a[0]-width/2,a[1],a[0]+width/2,b[1]);g.addColorStop(0,'#a34e0c');g.addColorStop(.4,'#f39422');g.addColorStop(.75,'#e97b15');g.addColorStop(1,'#bb570c');ctx.strokeStyle=g;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
function limb(ctx,a,b,upper,lower,bend,width){const dx=b[0]-a[0],dy=b[1]-a[1],raw=Math.hypot(dx,dy)||.01,d=Math.max(Math.abs(upper-lower)+.01,Math.min(raw,upper+lower-.1)),ux=dx/raw,uy=dy/raw;const along=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-along*along))*bend,j=[a[0]+ux*along-uy*h,a[1]+uy*along+ux*h],end=[a[0]+ux*d,a[1]+uy*d];bone(ctx,a,j,width);bone(ctx,j,end,width*.9);ellipse(ctx,...end,width*.6,width*.43,'#633b27');return end;}
export function createNiuLaiRenderer({imageURL=new URL('../assets/niulai-poses/rig.png',import.meta.url).href}={}){
 let image=null,ready=false,closed=false,error=null,draws=0;
 if(typeof Image==='function'){image=new Image();image.onload=()=>{ready=!closed;};image.onerror=()=>{error='Niu Lai rig image failed to load';};image.src=imageURL;}else error='Image API unavailable';
 function draw(ctx,id,{x=0,y=0,height=224,time=0,flipX=false,reducedMotion=false}={}){
  if(!ready||closed||!NIULAI_VARIANTS.some(v=>v.id===id))return false;
  const p=niulaiPose(id,reducedMotion?0:time),scale=height/224;
  ctx.save();ctx.translate(x,y);ctx.scale(flipX?-scale:scale,scale);
  // The joint rig is intentionally continuous; no limb images drift apart.
  const hip=p.hip,shoulder=[hip[0],hip[1]-42],left=limb(ctx,[hip[0]-12,hip[1]],p.leftFoot,34,33,1,17),right=limb(ctx,[hip[0]+12,hip[1]],p.rightFoot,34,33,-1,17);
  ctx.save();ctx.translate(...hip);ctx.rotate(p.body);ctx.save();ctx.beginPath();ctx.ellipse(0,-24,29,43,0,0,Math.PI*2);ctx.clip();ctx.drawImage(image,285,590,460,570,-31,-68,62,86);ctx.restore();ctx.restore();
  limb(ctx,[shoulder[0]-22,shoulder[1]],p.leftHand,31,29,1,14);limb(ctx,[shoulder[0]+22,shoulder[1]],p.rightHand,31,29,-1,14);
  // Detailed generated raster head, reference-matched to the orange movie calf.
  ctx.save();ctx.translate(...p.head);ctx.rotate(p.tilt);
  const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
  ctx.beginPath();ctx.moveTo(-55,-42);ctx.lineTo(-39,-38);ctx.quadraticCurveTo(-16,-70,33,-45);ctx.lineTo(55,-41);ctx.lineTo(48,-21);ctx.lineTo(36,-16);ctx.lineTo(28,28);ctx.quadraticCurveTo(0,49,-28,28);ctx.lineTo(-36,-16);ctx.lineTo(-49,-23);ctx.closePath();ctx.clip();
  ctx.drawImage(image,180,65,670,585,-57,-57,114,100);
  if(p.eyes==='closed'||(!reducedMotion&&((time%5)+5)%5<.12)){
   ellipse(ctx,-20,-21,11,6,'#e67b1d');ellipse(ctx,20,-21,11,6,'#e67b1d');
   ctx.strokeStyle='#69401c';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-29,-21);ctx.quadraticCurveTo(-20,-17,-11,-21);ctx.moveTo(11,-21);ctx.quadraticCurveTo(20,-17,29,-21);ctx.stroke();
  }
  ctx.restore();
  ctx.font='bold 18px sans-serif';ctx.fillStyle='#325c76';
  if(p.prop==='book'){ctx.fillStyle='#217d88';ctx.fillRect(-27,-115,54,30);ctx.fillStyle='#fff2cf';ctx.fillRect(-24,-112,21,23);ctx.fillRect(3,-112,21,23);}
  if(p.prop==='zzz')ctx.fillText('z Z',30,-74-2*Math.sin(time*2));
  if(p.prop==='surprise')ctx.fillText('!',51,-198);
  if(p.prop==='thought')ctx.fillText('?',36,-190);
  if(p.prop==='laugh')ctx.fillText('♪',47,-174);
  ctx.restore();draws++;return true;
 }
 return{draw,getState:()=>({ready:ready&&!closed,closed,error,draws,types:NIULAI_VARIANTS.map(x=>x.id),sourceKind:'generated-reference-adaptation'}),destroy(){closed=true;ready=false;if(image){image.onload=image.onerror=null;image.src='';}image=null;}};
}
