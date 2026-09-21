import {drawHeldNumber} from './six-seven.js';
// Interactive cloth and painted creature rig; all animation uses the scene clock.
export const CRUNCH_BEATS = [0, .37, .79, 1.16, 1.61];
export const ENCOUNTER_DURATION = 2.55;
export const WOLF_SCALE = Math.sqrt(10);
const TAU = Math.PI * 2;
const clamp = x => Math.max(0, Math.min(1, x));
export function punchAt(age) {
  if (age < 0) return 0;
  return Math.max(0, ...CRUNCH_BEATS.map(beat => {
    const p = (age - beat + .10) / .20;
    return p >= 0 && p <= 1 ? Math.sin(p * Math.PI) ** 2 : 0;
  }));
}

export function capeState(phase, moving, leap = 0) {
  if (!moving) return 0;
  if (leap > .02 && leap < .45) return 2;
  if (leap >= .45 && leap < .65) return 3;
  if (leap >= .65) return 4;
  const rise = Math.sin(phase * 2);
  return rise > .45 ? 2 : rise < -.45 ? 4 : Math.cos(phase * 2) < -.75 ? 3 : 1;
}

// Each ribbon shares its edge with the next. Five motion fields are blended
// continuously, so changing jump state never snaps the fabric into a new pose.
export function drawCape(ctx, w, h, phase, moving, gentle, leap = 0, clock = 0, seed = 0, cloth = null) {
  if(cloth){drawPhysicalCape(ctx,cloth,h);return;}
  const motion = gentle ? .25 : 1;
  const lift = moving ? Math.max((1 - Math.cos(phase * 2)) * .5 * (1-leap), Math.sin(leap*Math.PI)) : 0;
  const rising = moving ? (leap > .02 ? Math.cos(leap*Math.PI) : Math.sin(phase * 2)) : 0;
  const apex = moving ? lift ** 5 : 0;
  const fall = Math.max(0, -rising);
  const point = (u, v) => {
    const wind = Math.sin(clock * 3 + seed + v * 6 + u * 2) * .025;
    const ripple = Math.sin(phase * 1.7 - v * 8 + u * 3) * .025 * (moving ? 1 : .15);
    const back = (moving ? .36 + lift * .17 : .10) * v * v;
    const forward = apex * .28 * Math.sin(v * Math.PI) + Math.max(0, rising) * .1 * v;
    return [w * ((u - .5) * (.28 + v * .88) - (back - forward) * motion + (wind + ripple) * v * motion),
      h * (-.79 + v * .69 - lift * .25 * v * motion - Math.max(0, rising) * .17 * v * v * motion + fall * .035 * Math.sin(v * 9) * motion + Math.sin(u * 12 + clock * 4 - v * 7) * .018 * v * motion)];
  };
  ctx.save();
  for (let strip = 0; strip < 12; strip++) {
    const left = strip / 12, right = (strip + 1) / 12;
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) { const p = point(left, j / 12); if (!j) ctx.moveTo(...p); else ctx.lineTo(...p); }
    for (let j = 12; j >= 0; j--) ctx.lineTo(...point(right, j / 12));
    ctx.closePath();
    const light = 28 + Math.sin(strip * 1.8 + clock * 2 + seed) * 8;
    ctx.fillStyle = `hsl(351 76% ${light}%)`; ctx.fill();
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.beginPath(); for (let j = 0; j <= 24; j++) { const p = point(j / 24, 1); if (!j) ctx.moveTo(...p); else ctx.lineTo(...p); }
  ctx.strokeStyle = '#f06a64'; ctx.lineWidth = h * .007; ctx.stroke(); ctx.restore();
}

function smoothCurve(ctx,points,move=false){
  if(move)ctx.moveTo(points[0].x,points[0].y);else ctx.lineTo(points[0].x,points[0].y);
  for(let i=0;i<points.length-1;i++){
    const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
    ctx.bezierCurveTo(b.x+(c.x-a.x)/6,b.y+(c.y-a.y)/6,c.x-(d.x-b.x)/6,c.y-(d.y-b.y)/6,c.x,c.y);
  }
}
export function drawPhysicalCape(ctx,cloth,h){
  const {cols,rows,points}=cloth;
  const point=(i,j)=>{const p=points[j*(cols+1)+i];return {x:(p.x+p.z*.30)*h,y:(p.y-.79-p.z*.15)*h};};
  const column=i=>Array.from({length:rows+1},(_,j)=>point(i,j));
  const light=i=>{
    const j=Math.floor(rows*.55),left=points[j*(cols+1)+Math.max(0,i-1)],right=points[j*(cols+1)+Math.min(cols,i+1)];
    const slope=(right.z-left.z)/(Math.hypot(right.x-left.x,right.y-left.y)+.01);
    return Math.max(23,Math.min(47,31+9*Math.sin(i/cols*Math.PI)+slope*8));
  };
  ctx.save();
  for(let i=0;i<cols;i++){
    const left=column(i),right=column(i+1);
    ctx.beginPath();smoothCurve(ctx,left,true);smoothCurve(ctx,right.reverse());ctx.closePath();
    const a=point(i,Math.floor(rows/2)),b=point(i+1,Math.floor(rows/2));
    const gradient=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
    gradient.addColorStop(0,`hsl(350 76% ${light(i)}%)`);gradient.addColorStop(1,`hsl(350 76% ${light(i+1)}%)`);
    ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=gradient;ctx.lineWidth=.6;ctx.stroke();
  }
  // A continuous curved hem and soft central highlight replace hard ribbon seams.
  ctx.beginPath();smoothCurve(ctx,Array.from({length:cols+1},(_,i)=>point(i,rows)),true);
  ctx.strokeStyle='#e96b70';ctx.lineWidth=h*.004;ctx.stroke();
  ctx.beginPath();smoothCurve(ctx,column(0),true);ctx.strokeStyle='#5c1029';ctx.lineWidth=h*.003;ctx.stroke();
  ctx.restore();
}

export function drawHood(ctx, h, clock = 0) {
  ctx.save();
  const sway = Math.sin(clock * 2) * h * .003;
  const gradient = ctx.createLinearGradient(-h * .18, -h, h * .17, -h * .76);
  gradient.addColorStop(0, '#650e27'); gradient.addColorStop(.48, '#e1404d'); gradient.addColorStop(1, '#9d1632');
  ctx.fillStyle = gradient; ctx.strokeStyle = '#f77d75'; ctx.lineWidth = h * .007;
  ctx.beginPath(); ctx.moveTo(-h * .17, -h * .75);
  ctx.bezierCurveTo(-h * .20, -h * .94, -h * .12, -h * 1.09, sway, -h * 1.07);
  ctx.bezierCurveTo(h * .16, -h * 1.08, h * .20, -h * .91, h * .16, -h * .75);
  ctx.lineTo(h * .09, -h * .78);
  ctx.bezierCurveTo(h * .16, -h * .93, h * .085, -h * 1.005, 0, -h * 1.005);
  ctx.bezierCurveTo(-h * .1, -h * 1.005, -h * .15, -h * .91, -h * .09, -h * .78);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2c176'; ctx.beginPath(); ctx.arc(0, -h * .765, h * .022, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#f35661'; ctx.lineWidth = h * .015; ctx.beginPath(); ctx.moveTo(0, -h * .75); ctx.quadraticCurveTo(-h * .08, -h * .7, -h * .04, -h * .64); ctx.moveTo(0, -h * .75); ctx.quadraticCurveTo(h * .1, -h * .7, h * .06, -h * .66); ctx.stroke();
  ctx.restore();
}

function patch(image, points, rounded=false) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1536;
  const x = c.getContext('2d'); x.beginPath();
  if(rounded){const last=points.at(-1),first=points[0];x.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);points.forEach(([a,b],i)=>{const n=points[(i+1)%points.length];x.quadraticCurveTo(a,b,(a+n[0])/2,(b+n[1])/2);});}
  else points.forEach(([a,b], i) => i ? x.lineTo(a,b) : x.moveTo(a,b));
  x.closePath(); x.clip(); x.drawImage(image, 0, 0, 1024, 1536); return c;
}
export function prepareWolf(art) {
  const image = art['dog-base-v3'];
  const neck=document.createElement('canvas');neck.width=320;neck.height=220;const n=neck.getContext('2d');n.beginPath();n.ellipse(160,110,160,110,0,0,Math.PI*2);n.clip();n.drawImage(image,240,640,300,280,0,0,320,220);
  return {neck,
    torso: patch(image, [[160,600],[475,515],[660,615],[824,1040],[809,1310],[675,1390],[285,1370],[122,980],[100,650]]),
    head: patch(image, [[55,209],[160,158],[327,123],[500,163],[565,420],[481,586],[222,634],[91,496],[70,319]],true),
    closed: patch(art['dog-closed'], [[55,209],[160,158],[327,123],[500,163],[565,420],[481,586],[222,634],[91,496],[70,319]],true),
    ears: [patch(image, [[155,201],[217,0],[290,0],[335,184]]), patch(image, [[314,186],[407,0],[491,0],[518,244]])],
    jaw: patch(image, [[105,409],[212,468],[299,379],[291,531],[210,574],[135,529]]),
    tail: patch(image, [[705,1115],[991,1185],[1024,1370],[992,1536],[644,1536],[568,1452],[605,1305]]),
    thigh: patch(image, [[622,953],[771,936],[891,1060],[845,1250],[737,1337],[577,1267],[568,1091]]),
    shin: patch(image, [[620,1160],[791,1160],[798,1373],[633,1399],[590,1280]]),
    paw: patch(image, [[571,1312],[764,1292],[807,1378],[652,1421],[516,1402],[512,1363]]),
  };
}

function oval(ctx, x, y, rx, ry, color) { ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); }
function fur(ctx, t, gentle) {
  // Overlapping tapered locks plus fine tips catch the light along the chest/back.
  for (let j=0;j<100;j++) {
    const side=j%2, row=Math.floor(j/2), y=480+row*16;
    const x=side ? 550+(y-480)*.29 : 155+(y-480)*.09;
    const length=22+(j*17%38), wind=Math.sin(t*3.1+j*.71)*(gentle?3:13);
    ctx.strokeStyle=side?'#a7b5bf88':'#e6d1a199'; ctx.lineWidth=1.2+j%3*.7;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+wind+12,y+length*.6,x+wind+(side?24:-13),y+length);ctx.stroke();
  }
}

export function createWolfMagic() {
  let nextLaser=3, nextWeb=1.4, laserUntil=0, laserStart=0;
  const webs=[]; const stats={lasers:0,webs:0};
  return {
    stats,
    reset(t=0){webs.length=0;nextLaser=t+3;nextWeb=t+1.4;laserUntil=0;},
    update(t,gentle,encounter){
      // Eye beams removed; glowing eyes and rear webs remain.
      if(t>=nextWeb){nextWeb=t+2.5+Math.random()*4;webs.push({born:t,seed:Math.random()*TAU});stats.webs++;}
      while(webs.length&&t-webs[0].born>3.2)webs.shift();
      if(gentle||encounter)laserUntil=0;
    },
    back(ctx,box,t,gentle){
      ctx.save();ctx.strokeStyle='#e3f8ff';ctx.lineWidth=2.5;
      for(const web of webs){const age=t-web.born,p=clamp(age/3.2),r=(35+p*180)*(gentle?.6:1),x=box.x+box.w*.73+p*260,y=box.y+box.h*.5-p*330;
        ctx.save();ctx.globalAlpha=Math.sin(p*Math.PI)*.8;ctx.translate(x,y);ctx.rotate(web.seed+p*.45);
        for(let n=0;n<8;n++){const a=n*TAU/8;ctx.beginPath();ctx.moveTo(-p*180,p*150);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}
        for(let ring=1;ring<=4;ring++){ctx.beginPath();for(let n=0;n<=8;n++){const a=n*TAU/8,rr=r*ring/4;if(!n)ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else{const mid=a-TAU/16;ctx.quadraticCurveTo(Math.cos(mid)*rr*.73,Math.sin(mid)*rr*.73,Math.cos(a)*rr,Math.sin(a)*rr);}}ctx.stroke();}ctx.restore();
      }ctx.restore();
    },
    eyes(ctx,t,anchors=[[283,226,9],[183,211,5]]){
      for(const [x,y,r] of anchors){ctx.save();ctx.shadowColor='#ff3217';ctx.shadowBlur=16;oval(ctx,x,y,r*1.7,r,'#ff3d1c');oval(ctx,x,y,r*.4,r*.65,'#fff6cf');ctx.restore();}
      if(t>=laserUntil)return;
      const a=clamp((t-laserStart)/.12)*clamp((laserUntil-t)/.16);
      ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';ctx.shadowColor='#ff190d';ctx.shadowBlur=25;
      for(const [x,y] of anchors){const endX=-1100,endY=y-90-Math.sin((t-laserStart)*4)*200;ctx.strokeStyle='#f5262d';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.stroke();ctx.strokeStyle='#fff6bc';ctx.lineWidth=3;ctx.stroke();}ctx.restore();
    }
  };
}

export function drawWolf(ctx, parts, arms, box, pose, open, t, gentle, hit, magic, hinge, chargedFur) {
  const sx=box.w/1024, sy=box.h/1536;
  ctx.save();ctx.translate(box.x+box.w*.5,box.y+box.h-pose.jump);ctx.scale(sx,sy);ctx.rotate(pose.sway*.3);ctx.translate(-512,-1536);
  const breath=Math.sin(t*1.7)*(gentle?1:4), hip=Math.sin(t*1.4)*.025+(pose.dance?.hip||0)*3;
  const limb=(part,x,y,angle)=>{ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(part,-x,-y);ctx.restore();};
  limb(parts.tail,746,1220,Math.sin(t*2)* (gentle?.025:.13));
  ctx.save();ctx.translate(690,1070);ctx.rotate(hip);ctx.drawImage(parts.thigh,-690,-1070);ctx.translate(0,150);ctx.rotate(-hip*1.8);ctx.drawImage(parts.shin,-690,-1220);ctx.translate(0,145);ctx.rotate(Math.sin(t*2)*.035);ctx.drawImage(parts.paw,-690,-1365);ctx.restore();
  ctx.save();ctx.translate(370,1090);ctx.rotate(-hip);ctx.scale(.78,.97);ctx.drawImage(parts.thigh,-690,-1070);ctx.translate(0,150);ctx.rotate(hip*1.8);ctx.drawImage(parts.shin,-690,-1220);ctx.translate(0,145);ctx.rotate(-Math.sin(t*2)*.035);ctx.drawImage(parts.paw,-690,-1365);ctx.restore();
  ctx.save();ctx.translate((pose.dance?.hip||0)*1024,breath);
  for(let row=370;row<1390;row+=12){const bend=Math.sin(t*1.4+(row-370)/400)*(gentle?1:5);ctx.drawImage(parts.torso,0,row,1024,12,bend,row,1024,12.5);}
  ctx.drawImage(parts.neck,205,445);
  fur(ctx,t,gentle);if(chargedFur)drawChargedFur(ctx,chargedFur,false);
  // The original painted arm textures rotate at shoulder, elbow and wrist.
  for(let n=1;n>=0;n--){ctx.save();ctx.translate(n?552:294,(n?716:720)+(pose.dance?.shoulder||0)*1536*(n?1:-1));ctx.rotate(pose.angles[n*3]*.5+Math.sin(t*1.8+n)*.06);ctx.drawImage(arms.upper,-86,-36,172,226);ctx.translate(0,180);ctx.rotate(pose.angles[n*3+1]*.65);ctx.drawImage(arms.lower,-74,-32,148,224);ctx.translate(0,177);ctx.rotate(pose.angles[n*3+2]+Math.sin(t*2+n)*.05);ctx.drawImage(arms.paw,-85,-25,178,125);if(pose.sixSeven)drawHeldNumber(ctx,pose.sixSeven.sprites[n],0,0,140,210,pose.sixSeven.pop);ctx.restore();}
  // Head recoil pivots at the neck; ears, jaw and the attached eyes follow it.
  ctx.save();ctx.translate(365,500);ctx.rotate(Math.sin(t*1.6)*.035+(hinge?.angle||0));ctx.translate(-365,-500);
  for(let n=0;n<2;n++)limb(parts.ears[n],n?408:252,184,Math.sin(t*2.6+n*1.7)*(gentle?.018:.06));
  ctx.drawImage(open?parts.head:parts.closed,0,0);
  if(open)limb(parts.jaw,277,402,Math.sin(t*8)*.025);
  if(chargedFur)drawChargedFur(ctx,chargedFur,true);
  magic.eyes(ctx,t);
  ctx.restore();
  if(hit>.2){ctx.save();ctx.globalAlpha=hit;ctx.strokeStyle='#ffe6a3';ctx.lineWidth=5;for(let i=0;i<7;i++){const a=i*TAU/7;ctx.beginPath();ctx.moveTo(90+Math.cos(a)*36,305+Math.sin(a)*36);ctx.lineTo(90+Math.cos(a)*75,305+Math.sin(a)*75);ctx.stroke();}ctx.restore();}
  ctx.restore();ctx.restore();
  // Stable contact mark at the muzzle; the head moves away from the child's fist.
  return {x:box.x+box.w*.10,y:box.y+box.h*.21-pose.jump};
}

function drawChargedFur(ctx,strands,head){
  for(let i=head?64:0;i<(head?strands.length:64);i++){
    const f=strands[i],side=i%2?1:-1,row=Math.floor(i/2);
    const x=(head?480+Math.sin(i*1.7)*14:side>0?550+row*6.9:147+row*2.2)+Math.sin(i*2.4)*9;
    const y=(head?190+(i-64)*10:490+row*23)+Math.cos(i*2)*7;
    const length=(head?23:30)+(i*13%24),width=2.5+i%3*1.3;
    const angle=(head?f.angle*.45-.50:f.angle)+Math.sin(i*1.7)*.15,dx=Math.cos(angle)*length,dy=Math.sin(angle)*length;
    const nx=-Math.sin(angle)*width,ny=Math.cos(angle)*width;
    const gradient=ctx.createLinearGradient(x,y,x+dx,y+dy);
    gradient.addColorStop(0,side>0?'#5b5c60':'#77634e');gradient.addColorStop(.62,side>0?'#828388':'#a58f73');gradient.addColorStop(1,side>0?'#aaa9a3':'#c5b297');
    ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(x-nx,y-ny);
    ctx.quadraticCurveTo(x+dx*.6-nx*.9,y+dy*.6-ny*.9,x+dx,y+dy);
    ctx.quadraticCurveTo(x+dx*.65+nx*.6,y+dy*.65+ny*.6,x+nx,y+ny);ctx.closePath();ctx.fill();
    ctx.strokeStyle=side>0?'#b4b5b688':'#d2c3a888';ctx.lineWidth=.9;
    for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(x+j*nx*.3,y+j*ny*.3);ctx.quadraticCurveTo(x+dx*.6+j*nx*.25,y+dy*.6+j*ny*.25,x+dx+j*2,y+dy-j*2);ctx.stroke();}
  }
}
