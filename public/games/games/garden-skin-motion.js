// A 96-pose continuous texture mesh, not 96 duplicate bitmap frames.
// Six-by-six vertices = 50 triangles; max eight warped actors / 16ms bucket.
const POSES=96,GRID=5,LIMIT=8;
const SIN=Float64Array.from({length:POSES+1},(_,i)=>Math.sin(i/POSES*Math.PI*2));
function wave(t){const p=((t%(Math.PI*2))+Math.PI*2)%(Math.PI*2)*POSES/(Math.PI*2),i=Math.floor(p);return SIN[i]+(SIN[i+1]-SIN[i])*(p-i);}
function hash(id){let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return h;}
export function skinVertices({id='',time=0,x=0,y=0,width=100,height=100,mode='walk',action,hit=0}){
 const seed=hash(id),phase=time*(2.8+(seed%7)*.13)+(seed%19),walking=mode==='walk',attack=mode==='attack'||Boolean(action),recoil=Math.min(1,Math.max(0,hit));
 const pts=[];
 for(let row=0;row<=GRID;row++)for(let col=0;col<=GRID;col++){
  const u=col/GRID,v=row/GRID,leg=Math.max(0,(v-.58)/.42),upper=Math.sin(Math.PI*Math.min(1,v/.65)),edge=Math.sin(Math.PI*u),side=u<.5?-1:1;
  // Keep face area a rigid translation; both sides of face move together.
  const head=v<.28?1:Math.max(0,1-(v-.28)/.18);
  const stride=walking?wave(phase+side*Math.PI)*leg*.014:0;
  const lean=attack?(Math.max(0,wave(phase*1.35))*.019):0;
  const dx=width*(stride+wave(phase*.5)*.004*upper+head*(wave(phase*.6)*.003-lean)-recoil*.009*upper);
  const dy=height*((walking?Math.max(0,wave(phase+side*Math.PI))*leg*.009:0)+wave(phase*.8)*edge*.003*(1-head));
  pts.push({u,v,x:x+u*width+dx,y:y+v*height+dy});
 }return pts;
}
export function createSkinMotion(){
 let bucket=-1,used=0,warped=0,fallback=0;
 function draw(ctx,img,rect,options){
  const now=typeof performance!=='undefined'?performance.now():Date.now(),next=Math.floor(now/16);
  if(next!==bucket){bucket=next;used=0;}
  // Preserve genuinely dense native animation and exact pixel-art contours.
  if(options.nativeFrames>=50||options.pixelArt||options.width<35||options.mode==='death'||used>=LIMIT){fallback++;return false;}
  used++;const verts=skinVertices(options),stride=GRID+1;
  function triangle(a,b,c){
   const det=(b.u-a.u)*(c.v-a.v)-(c.u-a.u)*(b.v-a.v);
   const ax=((b.x-a.x)*(c.v-a.v)-(c.x-a.x)*(b.v-a.v))/det;
   const ay=((b.y-a.y)*(c.v-a.v)-(c.y-a.y)*(b.v-a.v))/det;
   const bx=((c.x-a.x)*(b.u-a.u)-(b.x-a.x)*(c.u-a.u))/det;
   const by=((c.y-a.y)*(b.u-a.u)-(b.y-a.y)*(c.u-a.u))/det;
   const cx=(a.x+b.x+c.x)/3,cy=(a.y+b.y+c.y)/3;
   ctx.save();ctx.beginPath();for(const [i,p]of[a,b,c].entries()){
    // Subpixel coverage closes antialiased triangle seams, not body duplication.
    const l=Math.hypot(p.x-cx,p.y-cy)||1,px=p.x+(p.x-cx)/l*.25,py=p.y+(p.y-cy)/l*.25;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
   }ctx.closePath();ctx.clip();ctx.transform(ax,ay,bx,by,a.x-ax*a.u-bx*a.v,a.y-ay*a.u-by*a.v);ctx.drawImage(img,...rect,0,0,1,1);ctx.restore();
  }
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){const i=r*stride+c;triangle(verts[i],verts[i+1],verts[i+stride]);triangle(verts[i+1],verts[i+stride+1],verts[i+stride]);}
  warped++;return true;
 }
 return{draw,getState:()=>({poseSamples:POSES,trianglesPerActor:50,maxActorsPer16ms:LIMIT,warped,fallback}),clear(){bucket=-1;used=warped=fallback=0;}};
}
