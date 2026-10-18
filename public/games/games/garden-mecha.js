// Articulated kit-inspired aerial defenders. No atlas silhouette remains underneath.
const KITS=[
 ['Kyrios','#ec82ad','#792c64',0],['Shadow','#376ad1','#e9bf35',1],['Wing','#eeeefa','#2650a5',2],['Strike','#e9eef8','#cc3441',3],['RX-78','#f1f4fb','#285dd0',4],['Leopard','#548b56','#e6b844',5],['Akatsuki','#e9bb42','#8b5422',6],['Aerial','#f1f7ff','#297fca',7],['Wing Zero','#f9faff','#486cad',8],['Freedom','#80cda3','#172d39',9]
];
const point=(o,a,l)=>({x:o.x+Math.cos(a)*l,y:o.y+Math.sin(a)*l});
export function mechaPose({id,x,y,height=110,time=0,targetX=x+130,targetY=y+100,shotAge=999,bombAge=999}){
 const index=Math.max(0,Math.min(9,Number(String(id).replace('gundam',''))||0)),p=time*2.5+index*.73;
 const s=height/110,torso={x,y:y-height*.54},shoulder={x:torso.x+12*s,y:torso.y-9*s};
 const aim=Math.atan2(targetY-shoulder.y,targetX-shoulder.x),recoil=Math.max(0,1-shotAge/160)*5*s;
 const elbow=point(shoulder,aim+.42,19*s),hand=point(elbow,aim-.22,21*s),muzzle=point(hand,aim,35*s-recoil);
 return{index,p,s,x,y,height,torso,shoulder,aim,elbow,hand,muzzle,recoil,bombAge};
}
export function drawGardenMecha(ctx,options){
 const textured=drawTexturedMecha(ctx,options);if(textured)return textured;
 const q=mechaPose(options),{index,p,s,x,y,torso,shoulder,aim,elbow,hand,muzzle,recoil}=q,[name,base,accent,kind]=KITS[index];
 ctx.save();ctx.translate(torso.x,torso.y);ctx.scale(s,s);
 const poly=(pts,fill,stroke='#152738',lw=1.1)=>{ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();};
 const plate=(pts,color=base)=>{let g=ctx.createLinearGradient(-20,-35,30,45);g.addColorStop(0,'#ffffff');g.addColorStop(.22,color);g.addColorStop(.72,color);g.addColorStop(1,'#344655');poly(pts,g);};
 const joint=(a,r=3)=>{ctx.fillStyle='#172f40';ctx.beginPath();ctx.arc(a.x,a.y,r,0,7);ctx.fill();ctx.strokeStyle='#87a5ae';ctx.lineWidth=.8;ctx.stroke();};
 const bone=(a,b,w,color=base)=>{let dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),nx=-dy/l*w/2,ny=dx/l*w/2;plate([[a.x+nx,a.y+ny],[b.x+nx*.7,b.y+ny*.7],[b.x-nx*.7,b.y-ny*.7],[a.x-nx,a.y-ny]],color);};
 // Backpack wings articulate independently, with different silhouettes by kit.
 for(const side of[-1,1]){ctx.save();ctx.translate(-4,1);ctx.rotate(side*(.17+Math.sin(p+side)*.07));
  if([0,2,3,6,8,9].includes(kind)){
   const reach=kind===8?48:kind===9?42:34;
   for(let i=0;i<(kind===8?5:3);i++){const xx=-12-i*7;plate([[xx,-13],[xx-reach,-35+i*10],[xx-22,18+i*4],[xx,9]],i%2?accent:base);}
  }else{plate([[-19,-20],[-32,-15],[-31,20],[-17,13]],accent);}
  const f=13+Math.sin(p*5+side)*4;let glow=ctx.createLinearGradient(-23,13,-23,40+f);glow.addColorStop(0,'#edffff');glow.addColorStop(.28,'#4acfff');glow.addColorStop(1,'#307bff00');poly([[-28,13],[-19,13],[-23,40+f]],glow,'transparent');ctx.restore();}
 // Bent flight legs: separate hip, knee, ankle and foot, rather than a whole-body sway.
 for(const side of[-1,1]){const hip={x:side*7,y:19},a=1.15+side*.38+Math.sin(p+side)*.13,knee=point(hip,a,20),ankle=point(knee,1.7+Math.sin(p+side)*.22,19);joint(hip);bone(hip,knee,13);joint(knee,3.5);bone(knee,ankle,11);joint(ankle,2.5);plate([[ankle.x-5,ankle.y-2],[ankle.x+6,ankle.y-2],[ankle.x+12,ankle.y+6],[ankle.x-5,ankle.y+7]],accent);}
 // Waist and chest armor contain panel lines, vents and a bright cockpit jewel.
 plate([[-13,11],[13,11],[15,24],[4,21],[0,17],[-7,24],[-16,22]],base);
 plate([[-16,-17],[9,-20],[18,-10],[12,13],[-10,15],[-18,0]],accent);
 plate([[-15,-17],[-2,-12],[-5,-2],[-17,-5]]);plate([[2,-12],[11,-18],[17,-8],[6,-3]]);
 poly([[-4,-7],[3,-8],[6,-2],[0,3],[-5,-1]],'#69ffe8');
 for(let i=0;i<3;i++){ctx.strokeStyle='#f8ce4e';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-11,-3+i*3);ctx.lineTo(-7,-2+i*3);ctx.stroke();}
 // Rear hand opens on bomb release, separate shoulder and elbow articulation.
 let rearShoulder={x:-12,y:-11},rearElbow=point(rearShoulder,1.9+Math.sin(p)*.16,20),rearHand=point(rearElbow,q.bombAge<500?1.3:1.8,18);joint(rearShoulder);bone(rearShoulder,rearElbow,10);joint(rearElbow);bone(rearElbow,rearHand,8);joint(rearHand,4);plate([[-23,-21],[-11,-23],[-7,-11],[-20,-8]],base);
 // Head looks at the target, with an antenna crest and illuminated eye slit.
 ctx.save();ctx.translate(0,-25);ctx.rotate(Math.max(-.15,Math.min(.18,(aim-.6)*.18)));
 plate([[-9,-9],[2,-12],[10,-6],[8,8],[0,12],[-9,6]],base);poly([[-6,-2],[8,-3],[7,1],[-5,2]],'#62ffe7');poly([[0,3],[5,3],[3,10],[-1,8]],accent);
 poly([[-1,-8],[-14,-20],[-7,-6],[2,-5],[14,-19],[8,-5]],kind===6?'#ffe18a':'#f6d75e');ctx.restore();
 // Aimed gun arm and gun share the exact muzzle geometry used by projectile effects.
 const local=a=>({x:(a.x-torso.x)/s,y:(a.y-torso.y)/s}),sh=local(shoulder),el=local(elbow),ha=local(hand);
 joint(sh);bone(sh,el,12);joint(el,3.5);bone(el,ha,10);joint(ha,4);plate([[7,-22],[20,-22],[26,-11],[13,-6]],base);
 ctx.save();ctx.translate(ha.x,ha.y);ctx.rotate(aim);ctx.translate(-recoil/s,0);plate([[-8,-6],[17,-6],[22,-3],[35,-3],[35,3],[14,3],[6,8],[-7,5]],kind===5?'#394c37':'#304654');
 ctx.strokeStyle='#a6c3ce';ctx.lineWidth=1;ctx.strokeRect(-3,-4,15,5);
 if(kind===5)for(let k=0;k<3;k++){ctx.strokeStyle='#849e9e';ctx.beginPath();ctx.moveTo(14,-3+k*3);ctx.lineTo(35,-3+k*3);ctx.stroke();}
 if(options.shotAge<100){ctx.fillStyle='#d1ffff';ctx.beginPath();ctx.moveTo(35,-4);ctx.lineTo(49,0);ctx.lineTo(35,4);ctx.fill();}ctx.restore();
 ctx.restore();return{muzzle,name,index};
}

// Textured components are transformed individually: no fixed whole-character layer.
let armorImage=null;
if(typeof Image!=='undefined'){armorImage=new Image();armorImage.src=new URL('../assets/garden-allies/mecha-parts.png',import.meta.url).href;}
let armorRegions=null;
if(typeof fetch!=='undefined')fetch(new URL('../assets/garden-allies/mecha-parts.json',import.meta.url)).then(r=>r.json()).then(r=>armorRegions=r).catch(()=>{});
export function setMechaArmorForPreview(image,regions){armorImage=image;armorRegions=regions;}
function drawTexturedMecha(ctx,o){
 const q=mechaPose(o),{index,p,s,torso,shoulder,elbow,hand,aim,recoil}=q;
 if(!armorImage||!armorRegions||!armorImage.width)return null;
 const part=(n,x,y,w,h,a=0)=>{const r=armorRegions[n];ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.filter=`hue-rotate(${[80,0,0,140,0,-100,180,0,0,-75][index]}deg)`;ctx.translate(x,y);ctx.rotate(a);ctx.drawImage(armorImage,r.x,r.y,r.w,r.h,-w/2,-h/2,w,h);ctx.restore();};
 const limb=(n,a,b,w)=>{const l=Math.hypot(b.x-a.x,b.y-a.y);part(n,(a.x+b.x)/2,(a.y+b.y)/2,w,l+5,Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);};
 ctx.save();ctx.translate(torso.x,torso.y);ctx.scale(s,s);
 const local=a=>({x:(a.x-torso.x)/s,y:(a.y-torso.y)/s});
 // Different pack breadth, wing count and armament produce readable silhouettes.
 const winged=[0,2,3,6,8,9].includes(index),count=index===8?3:index===9?2:1;
 if(winged)for(let i=0;i<count;i++)part(8,-18-i*9,1+i*9,index===8?53:43,67+i*7,-.28+Math.sin(p+i)*.07-i*.2);
 else part(4,-22,0,17,43,-.15);
 for(const side of[-1,1]){const xx=-19+side*5,flame=18+Math.sin(p*5+side)*5;const g=ctx.createLinearGradient(xx,16,xx,45+flame);g.addColorStop(0,'#f1ffff');g.addColorStop(.3,'#51d5ff');g.addColorStop(1,'#348aff00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(xx-4,15);ctx.lineTo(xx+4,15);ctx.lineTo(xx,45+flame);ctx.fill();}
 for(const side of[-1,1]){const hip={x:side*7,y:16},knee=point(hip,1.15+side*.38+Math.sin(p+side)*.13,21),ankle=point(knee,1.7+Math.sin(p+side)*.22,20);limb(5,hip,knee,13);limb(6,knee,ankle,12);part(7,ankle.x+3,ankle.y+3,19,11);}
 const back={x:-12,y:-11},be=point(back,1.9+Math.sin(p)*.16,20),bh=point(be,q.bombAge<500?1.3:1.8,18);limb(3,back,be,11);limb(4,be,bh,10);part(10,bh.x,bh.y,10,10);
 part(11,0,17,31,23);part(0,0,-4,[35,33,37,39,37,44,37,34,37,36][index],39);part(2,-14,-13,23,21);
 part(1,0,-28,26,29,Math.max(-.15,Math.min(.18,(aim-.6)*.18)));
 const sh=local(shoulder),el=local(elbow),ha=local(hand);limb(3,sh,el,12);limb(4,el,ha,11);part(10,ha.x,ha.y,11,11);part(2,14,-15,24,23);
 // Rifle muzzle at hand + aim * (35 - recoil), exactly matching mechaPose.
 const gunCenter=point(ha,aim,13-recoil/s);part(9,gunCenter.x,gunCenter.y,44,15,aim);
 if(index===5){const second=point(gunCenter,aim+Math.PI/2,5);part(9,second.x,second.y,44,8,aim);}
 if(o.shotAge<100){const m=local(q.muzzle);ctx.save();ctx.translate(m.x,m.y);ctx.rotate(aim);ctx.fillStyle='#dbffff';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(15,0);ctx.lineTo(0,4);ctx.fill();ctx.restore();}
 ctx.restore();return{muzzle:q.muzzle,name:KITS[index][0],index};
}

export function setMechaTexture(url,regions){
 if(regions)armorRegions=regions;
 if(typeof Image!=='undefined'){const next=new Image();next.onload=()=>{armorImage=next;};next.src=url;}
}

