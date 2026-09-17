// Fixed-step angular dynamics and position-based 3D cloth. Units for the
// cloth are runner heights; masses are equal except for the pinned neckline.
import {CRUNCH_BEATS} from './storybook.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const STEP=1/120;

export function createHeadHinge(){return {angle:0,velocity:0,previousAge:-1,impacts:0,peak:0};}
export function stepHeadHinge(state,dt,age,gentle=false){
  if(dt<=0)return;
  const limit=gentle?.18:Math.PI;
  for(const beat of CRUNCH_BEATS)if(state.previousAge<beat&&age>=beat){
    // An impulse adds angular momentum; the neck spring brings the head home.
    state.velocity+=gentle?4:74;state.impacts++;
  }
  state.previousAge=age;
  let remaining=Math.min(dt,.05);
  while(remaining>1e-8){const h=Math.min(STEP,remaining);remaining-=h;
    const torque=-80*state.angle-11*state.velocity;
    state.velocity+=torque*h;state.angle+=state.velocity*h;
    if(state.angle>limit){state.angle=limit;state.velocity=-Math.abs(state.velocity)*.06;}
    if(state.angle<0){state.angle=0;state.velocity=Math.max(0,-state.velocity*.08);}
    state.peak=Math.max(state.peak,state.angle);
  }
}

export function createCape(seed=0){
  const cols=7,rows=9,points=[],constraints=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows,x=(u-.5)*(.18+v*.58),y=v*.69,z=Math.sin(u*Math.PI)*v*.025;
    points.push({x,y,z,px:x,py:y,pz:z,homeX:x,pinned:j===0});
  }
  const link=(a,b,stiffness)=>{const p=points[a],q=points[b];constraints.push({a,b,rest:Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z),stiffness});};
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const k=j*(cols+1)+i;
    if(i<cols)link(k,k+1,.98);
    if(j<rows)link(k,k+cols+1,.99);
    if(i<cols&&j<rows){link(k,k+cols+2,.5);link(k+1,k+cols+1,.5);}
    if(j<rows-1)link(k,k+2*(cols+1),.13);
  }
  return {points,constraints,cols,rows,seed,accumulator:0,anchor:null,vx:0,vy:0,ax:0,ay:0};
}

export function stepCape(cape,dt,anchor,moving,gentle,time){
  if(dt<=0)return;
  if(!cape.anchor){cape.anchor={...anchor};return;}
  const dx=(anchor.x-cape.anchor.x)/anchor.h,dy=(anchor.y-cape.anchor.y)/anchor.h;
  const vx=clamp(dx/dt,-9,9),vy=clamp(dy/dt,-10,10);
  cape.ax=clamp(-(vx-cape.vx)/dt,-24,24);cape.ay=clamp(-(vy-cape.vy)/dt,-24,24);
  cape.vx=vx;cape.vy=vy;cape.anchor={...anchor};
  const strength=gentle?.3:1;
  cape.accumulator+=Math.min(dt,.05);
  const h=1/60,hh=h*h;
  while(cape.accumulator>=h){cape.accumulator-=h;
    for(let k=0;k<cape.points.length;k++){
      const p=cape.points[k];if(p.pinned)continue;
      const row=Math.floor(k/(cape.cols+1))/cape.rows,col=(k%(cape.cols+1))/cape.cols;
      // Aerodynamic drag, lift, inertia and a spatially varying gust field.
      const gust=Math.sin(time*3.4+row*5+cape.seed)*.8;
      const fx=(cape.ax-(moving?2.8:0)-Math.abs(vx)*1.3+gust)*strength;
      const fy=4.3+(cape.ay-Math.min(6,Math.abs(vx)*1.25)-vy*.7)*strength;
      const fz=(Math.sin(time*4.2-row*7+col*3+cape.seed)*2.2+Math.cos(time*2.1+col*9)*.8)*row*strength;
      const ox=p.x,oy=p.y,oz=p.z;
      p.x+=(p.x-p.px)*.968+fx*hh;p.y+=(p.y-p.py)*.968+fy*hh;p.z+=(p.z-p.pz)*.962+fz*hh;
      p.px=ox;p.py=oy;p.pz=oz;
    }
    for(let iteration=0;iteration<7;iteration++){
      for(const c of cape.constraints){
        const a=cape.points[c.a],b=cape.points[c.b],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
        const distance=Math.hypot(dx,dy,dz)||1;
        const wa=a.pinned?0:1,wb=b.pinned?0:1,total=wa+wb;if(!total)continue;
        const correction=(distance-c.rest)/distance*c.stiffness/total;
        a.x+=dx*correction*wa;a.y+=dy*correction*wa;a.z+=dz*correction*wa;
        b.x-=dx*correction*wb;b.y-=dy*correction*wb;b.z-=dz*correction*wb;
      }
      for(const p of cape.points){
        if(p.pinned){p.x=p.homeX;p.y=0;p.z=0;}
        // Back/shoulder contact: cloth cannot pass through the torso.
        else if(Math.abs(p.x)<.15&&p.y<.42){const surface=-.025*clamp((.15-Math.abs(p.x))/.08,0,1);if(p.z>surface)p.z=surface;}
      }
    }
  }
}

export function createFur(){return Array.from({length:96},(_,i)=>({angle:-Math.PI/2+(i%2?1:-1)*.52,velocity:0}));}
export function stepFur(fur,dt,time,gentle){
  if(dt<=0)return;
  for(let i=0;i<fur.length;i++){
    const f=fur[i],side=i%2?1:-1;
    const target=-Math.PI/2+side*.52+Math.sin(time*2.3+i*.73)*(gentle?.03:.25);
    let remaining=Math.min(dt,.05);
    while(remaining>1e-8){const h=Math.min(STEP,remaining);remaining-=h;
      // Torsional strand stiffness, air damping and an upward static-charge bias.
      f.velocity+=((target-f.angle)*48-f.velocity*7+Math.sin(time*5+i)*2)*h;
      f.angle+=f.velocity*h;
    }
  }
}
