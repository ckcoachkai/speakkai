// Normalized landmarks traced against each existing painted character.
// Continuous skinning keeps the artwork connected across all joints.
const arms = (a,b) => [a,b];
const legs = (a,b) => [a,b];
export const BOSS_RIGS = {
  monkey: {neck:[.49,.365], arms:arms([[.40,.40],[.28,.47],[.17,.43]],[[.61,.42],[.72,.51],[.88,.55]]),legs:legs([[.45,.63],[.36,.77],[.31,.92]],[[.59,.65],[.66,.79],[.71,.91]]),fur:'fur',hair:.15,features:[{from:[.35,.70],to:[.17,.60],radius:.095,angle:.21}]},
  parrot: {neck:[.49,.35],arms:arms([[.36,.39],[.22,.32],[.09,.21]],[[.59,.42],[.77,.45],[.93,.43]]),legs:legs([[.42,.64],[.40,.74],[.38,.82]],[[.54,.66],[.57,.76],[.60,.85]]),fur:'feathers',hair:.16,features:[{from:[.54,.65],to:[.85,.85],radius:.105,angle:.11}],wing:1.4},
  rabbit: {neck:[.47,.36],arms:arms([[.35,.39],[.24,.40],[.13,.39]],[[.61,.43],[.74,.48],[.88,.51]]),legs:legs([[.45,.63],[.40,.78],[.43,.92]],[[.60,.64],[.64,.73],[.73,.81]]),fur:'fur',hair:.12,features:[{from:[.38,.12],to:[.20,.31],radius:.105,angle:.18},{from:[.64,.17],to:[.84,.38],radius:.115,angle:.19}]},
  cat: {neck:[.49,.445],arms:arms([[.36,.48],[.24,.50],[.12,.50]],[[.66,.51],[.77,.54],[.89,.56]]),legs:legs([[.42,.72],[.34,.83],[.26,.94]],[[.60,.72],[.64,.84],[.72,.93]]),fur:'fur',hair:.20,features:[{from:[.73,.83],to:[.89,.70],radius:.09,angle:.22},{from:[.22,.25],to:[.16,.16],radius:.065,angle:.08},{from:[.55,.18],to:[.60,.07],radius:.07,angle:.08}]},
  sock: {neck:[.51,.40],arms:arms([[.46,.45],[.30,.48],[.14,.41]],[[.64,.47],[.76,.54],[.89,.52]]),legs:legs([[.45,.69],[.40,.82],[.33,.93]],[[.56,.69],[.63,.83],[.72,.94]]),fur:'fabric',hair:0,features:[{from:[.57,.17],to:[.62,.04],radius:.20,angle:.06}],stretch:true},
  queen: {neck:[.50,.29],arms:arms([[.34,.33],[.26,.41],[.16,.43]],[[.64,.34],[.73,.43],[.86,.47]]),legs:legs([[.42,.77],[.39,.85],[.32,.95]],[[.57,.77],[.53,.87],[.57,.95]]),fur:'cloth',hair:0,features:[{from:[.52,.16],to:[.51,.06],radius:.23,angle:.045}],hem:.74},
  elton: {neck:[.49,.27],arms:arms([[.34,.30],[.24,.36],[.11,.37]],[[.66,.30],[.76,.39],[.90,.41]]),legs:legs([[.45,.59],[.39,.76],[.35,.90]],[[.59,.59],[.70,.77],[.77,.93]]),fur:'hair',hair:.085,features:[],hem:.58,sparkles:true},
  trump: {neck:[.49,.32],arms:arms([[.34,.35],[.25,.43],[.13,.43]],[[.66,.36],[.74,.45],[.90,.47]]),legs:legs([[.46,.64],[.37,.80],[.30,.94]],[[.59,.64],[.66,.80],[.75,.94]]),fur:'hair',hair:.19,features:[{from:[.53,.35],to:[.58,.59],radius:.045,angle:.07}],hem:.64,flame:true},
  koala: {neck:[.48,.44],arms:arms([[.35,.47],[.25,.49],[.14,.44]],[[.64,.51],[.76,.56],[.88,.57]]),legs:legs([[.41,.73],[.36,.83],[.29,.92]],[[.57,.73],[.61,.82],[.68,.90]]),fur:'fur',hair:.18,features:[{from:[.31,.21],to:[.25,.12],radius:.12,angle:.07},{from:[.71,.27],to:[.81,.20],radius:.15,angle:.085}]},
};
const sideDistance = (points,u) => points[2][0]<points[0][0]?points[0][0]-u:u-points[0][0];
const clamp = x => Math.max(0,Math.min(1,x));
const smooth = x => {x=clamp(x);return x*x*(3-2*x);};
const rotation = a => [Math.cos(a),Math.sin(a)];
function turn(p,pivot,r) {const x=p[0]-pivot[0],y=(p[1]-pivot[1])*1.5;return [pivot[0]+x*r[0]-y*r[1],pivot[1]+(x*r[1]+y*r[0])/1.5];}
function segmentDistance(p,a,b) {const dx=b[0]-a[0],dy=(b[1]-a[1])*1.5,x=p[0]-a[0],y=(p[1]-a[1])*1.5,u=clamp((x*dx+y*dy)/(dx*dx+dy*dy));return Math.hypot(x-u*dx,y-u*dy);}
function chainPoint(p,chain,rotations,k) {let q=p;for(let i=k;i>=0;i--)q=turn(q,chain[i],rotations[i]);return q;}

export function createBossDeformer(id,pose,t,gentle=false,hit=0,open=false) {
  const rig=BOSS_RIGS[id];if(!rig)throw new Error(`Missing boss rig: ${id}`);
  const motion=gentle?.25:1;
  const headRotation=rotation(Math.sin(t*1.65)*.035*motion+(pose.recoil??hit*.17)*motion);
  const chains=[...rig.arms,...rig.legs].map((points,i)=>{
    const arm=i<2,side=i%2,phase=t*(arm?2.2:1.6)+side*Math.PI;
    const angle=arm?[
      pose.angles[side*3]*.19*(rig.wing||1)+Math.sin(phase)*.035*motion,
      pose.angles[side*3+1]*.25+Math.sin(phase+1)*.045*motion,
      pose.angles[side*3+2]*.36+Math.sin(phase+2)*.075*motion,
    ]:[Math.sin(phase)*.045*motion,Math.sin(phase+.8)*.055*motion,Math.sin(phase+1.6)*.04*motion];
    return {points,rotations:angle.map(rotation),arm};
  });
  const features=rig.features.map((f,i)=>({...f,rotation:rotation(Math.sin(t*(rig.flame?3.8:2.5)+i*1.4)*f.angle*motion)}));
  return (u,v) => {
    const p=[u,v];let x=u,y=v;
    // Local features: ears, tail, hat, tie, and sleeve/coat motion.
    for(const f of features){const d=segmentDistance(p,f.from,f.to),w=Math.exp(-Math.pow(d/f.radius,4))*smooth(Math.hypot(u-f.from[0],(v-f.from[1])*1.5)/.13);const q=turn(p,f.from,f.rotation);x+=(q[0]-u)*w;y+=(q[1]-v)*w;}
    for(const c of chains){
      const q=c.points,r=c.rotations;
      // Shoulder influence fades into the chest, wrist influence into the hand.
      const width=c.arm?(rig.wing?.25:.16):.13;
      const tip=[q[2][0]+(q[2][0]-q[1][0])*1.4,q[2][1]+(q[2][1]-q[1][1])*1.4];
      const ds=[segmentDistance(p,q[0],q[1]),segmentDistance(p,q[1],q[2]),segmentDistance(p,q[2],tip)];
      const ws=ds.map((d,i)=>Math.exp(-Math.pow(d/(width*(i===2?.85:1)),2)));
      // Keep fingers/paws rigid past the wrist; blend only across the joint.
      const axisX=q[2][0]-q[1][0],axisY=(q[2][1]-q[1][1])*1.5;
      const along=((u-q[2][0])*axisX+(v-q[2][1])*1.5*axisY)/(Math.hypot(axisX,axisY)||1);
      const distal=smooth(along/.035),transfer=(ws[0]+ws[1])*distal;
      ws[0]*=1-distal;ws[1]*=1-distal;ws[2]+=transfer;
      const total=ws.reduce((a,b)=>a+b,0);if(total<.001)continue;
      const rootFade=smooth(Math.hypot(u-q[0][0],(v-q[0][1])*1.5)/.14);
      const zone=c.arm?(rig.wing?smooth((Math.abs(u-.5)-.12)/.15):smooth((v-rig.neck[1]+.015)/.06)):smooth((v-q[0][1]+.015)/.07);
      const sideFade=c.arm?smooth((sideDistance(q,u))/.085):1;
      const influence=Math.min(1,total)*rootFade*zone*sideFade;
      let dx=0,dy=0;
      for(let k=0;k<3;k++){const z=chainPoint(p,q,r,k);dx+=(z[0]-u)*ws[k]/total;dy+=(z[1]-v)*ws[k]/total;}
      x+=dx*influence;y+=dy*influence;
    }
    const head=smooth((rig.neck[1]+.035-v)/.085);
    const hp=turn([x,y],rig.neck,headRotation);x+=(hp[0]-x+hit*.065*motion)*head;y+=(hp[1]-y)*head;
    const hair=smooth((rig.hair-v)/.08);
    x+=Math.sin(t*(rig.flame?7:3.2)+v*28+u*6)*.012*hair*motion;
    y+=Math.sin(t*3.1+u*15)*.005*hair*motion;
    if(rig.hem){const hem=Math.exp(-Math.pow((v-rig.hem)/.08,2));x+=Math.sin(t*3+u*12)*.008*hem*motion;}
    if(rig.stretch)x+=Math.sin(t*2.5-v*10)*.016*Math.sin(v*Math.PI)*motion;
    x+=Math.sin(t*1.4+v*3)*.005*Math.sin(v*Math.PI)*motion;
    y+=Math.sin(t*1.9)*.003*Math.sin(v*Math.PI)*motion;
    // Small jaw deformation follows speech without painting a second mouth.
    const jaw=Math.exp(-Math.pow((u-rig.neck[0])/.10,2)-Math.pow((v-(rig.neck[1]-.055))/.045,2));
    y+=(open?.004:-.003)*jaw*motion;
    if(pose.dance){const d=pose.dance;const shoulders=Math.exp(-Math.pow((v-(rig.neck[1]+.06))/.12,2));y+=d.shoulder*(u<.5?1:-1)*shoulders;x+=d.hip*Math.exp(-Math.pow((v-rig.legs[0][0][1])/.2,2));}
    return {x,y};
  };
}

export function prepareBossRig(image,id) {
  const width=image.width,height=image.height,ctx=image.getContext('2d'),rgba=ctx.getImageData(0,0,width,height).data;
  const alpha=(x,y)=>rgba[(Math.max(0,Math.min(height-1,y))*width+Math.max(0,Math.min(width-1,x)))*4+3];
  const cols=18,rows=30,vertices=[],triangles=[],strands=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)vertices.push([x/cols,y/rows]);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    let visible=false;
    // Sample the whole cell before dropping it; retain thin whiskers and toes.
    for(let py=Math.floor(y*height/rows);py<=Math.min(height-1,Math.ceil((y+1)*height/rows))&&!visible;py+=3)
      for(let px=Math.floor(x*width/cols);px<=Math.min(width-1,Math.ceil((x+1)*width/cols));px+=3)if(alpha(px,py)>5){visible=true;break;}
    if(!visible)continue;
    const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;triangles.push([a,b,c],[b,d,c]);
  }
  const rig=BOSS_RIGS[id];
  if(rig.fur!=='cloth')for(let y=12;y<height-12;y+=9){
    if(rig.fur==='hair'&&y/height>rig.hair)continue;
    for(const direction of [-1,1]){
      let x=direction<0?0:width-1;
      while(x>=0&&x<width&&alpha(x,y)<180)x-=direction;
      if(x<0||x>=width)continue;
      const inside=Math.max(0,Math.min(width-1,x-direction*3)),n=(y*width+inside)*4;
      strands.push({u:x/width,v:y/height,side:direction,color:`rgba(${rgba[n]},${rgba[n+1]},${rgba[n+2]},.75)`,length:(rig.fur==='feathers'?13:rig.fur==='fabric'?3:6)+(y%7)});
    }
  }
  return {vertices,triangles,strands};
}

function paintTriangle(ctx,img,points,source) {
  const [p,q,r]=points,[s,t,u]=source;
  const den=(t[0]-s[0])*(u[1]-s[1])-(u[0]-s[0])*(t[1]-s[1]);
  const a=((q.x-p.x)*(u[1]-s[1])-(r.x-p.x)*(t[1]-s[1]))/den;
  const b=((q.y-p.y)*(u[1]-s[1])-(r.y-p.y)*(t[1]-s[1]))/den;
  const c=((r.x-p.x)*(t[0]-s[0])-(q.x-p.x)*(u[0]-s[0]))/den;
  const d=((r.y-p.y)*(t[0]-s[0])-(q.y-p.y)*(u[0]-s[0]))/den;
  ctx.save();ctx.beginPath();
  // A subpixel overlap closes antialiased mesh cracks.
  const cx=(p.x+q.x+r.x)/3,cy=(p.y+q.y+r.y)/3;
  points.forEach((v,i)=>{const len=Math.hypot(v.x-cx,v.y-cy)||1,x=v.x+(v.x-cx)*.002/len,y=v.y+(v.y-cy)*.002/len;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,p.x-a*s[0]-c*s[1],p.y-b*s[0]-d*s[1]);
  const minX=Math.max(0,Math.floor(Math.min(...source.map(v=>v[0]))*img.width)-1),minY=Math.max(0,Math.floor(Math.min(...source.map(v=>v[1]))*img.height)-1);
  const maxX=Math.min(img.width,Math.ceil(Math.max(...source.map(v=>v[0]))*img.width)+1),maxY=Math.min(img.height,Math.ceil(Math.max(...source.map(v=>v[1]))*img.height)+1);
  ctx.drawImage(img,minX,minY,maxX-minX,maxY-minY,minX/img.width,minY/img.height,(maxX-minX)/img.width,(maxY-minY)/img.height);ctx.restore();
}

export function drawBoss(ctx,img,host,mesh,box,pose,open,t,gentle,hit,magic) {
  const deform=createBossDeformer(host.id,pose,t,gentle,hit,open),vertices=mesh.vertices.map(([u,v])=>deform(u,v));
  const sway=pose.sway*.20;
  ctx.save();ctx.translate(box.x+box.w*.5,box.y+box.h-pose.jump);ctx.rotate(sway);ctx.translate(-box.w*.5,-box.h);ctx.scale(box.w,box.h);
  mesh.triangles.forEach(indices=>paintTriangle(ctx,img,indices.map(i=>vertices[i]),indices.map(i=>mesh.vertices[i])));
  for(let i=0;i<mesh.strands.length;i++){
    const f=mesh.strands[i],root=deform(f.u,f.v),wind=Math.sin(t*3.3+i*.8)*(gentle?.2:1);
    ctx.strokeStyle=f.color;ctx.lineWidth=.0008;ctx.beginPath();ctx.moveTo(root.x,root.y);
    ctx.quadraticCurveTo(root.x+f.side*.003+wind*.005,root.y+.003,root.x+f.side*f.length/1024+wind*.008,root.y+.009);ctx.stroke();
  }
  const eyes=host.eyes.map(([u,v])=>{const p=deform(u,v);return [p.x,p.y,.008];});
  // Magic shares the same deformed eye anchors, so beams never slide off faces.
  ctx.save();ctx.scale(1/1024,1/1536);magic.eyes(ctx,t,eyes.map(([x,y,r])=>[x*1024,y*1536,r*1024]));ctx.restore();
  if(BOSS_RIGS[host.id].sparkles)for(let i=0;i<12;i++){const p=deform(.34+(i%4)*.08,.30+Math.floor(i/4)*.1),size=(.001+Math.max(0,Math.sin(t*2+i))*.003);ctx.fillStyle='#fff4a7';ctx.fillRect(p.x-size,p.y-size*.3,size*2,size*.6);ctx.fillRect(p.x-size*.3,p.y-size,size*.6,size*2);}
  const contact=[host.mouth[0]-.055,host.mouth[1]];
  const resting=createBossDeformer(host.id,pose,t,gentle,0,open)(...contact);
  if(hit>.2){const p=deform(...contact);ctx.save();ctx.globalAlpha=hit;ctx.strokeStyle='#ffe6a3';ctx.lineWidth=.002;for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*.022,p.y+Math.sin(a)*.016);ctx.lineTo(p.x+Math.cos(a)*.046,p.y+Math.sin(a)*.031);ctx.stroke();}ctx.restore();}
  ctx.restore();
  const x=(resting.x-.5)*box.w,y=(resting.y-1)*box.h;
  return {x:box.x+box.w*.5+x*Math.cos(sway)-y*Math.sin(sway),y:box.y+box.h-pose.jump+x*Math.sin(sway)+y*Math.cos(sway)};
}
