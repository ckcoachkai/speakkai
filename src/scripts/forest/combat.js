// Scene-clock combat: decorative opponents never change the selected winner.
export const REACTIONS=['Backflip','Side snap','Whiplash','Corkscrew','Heavy stagger','Rubber neck','Uppercut','Double wobble','Limp collapse','Spring rebound'];
export function reaction(angle,index,gentle=false){
 const a=gentle?angle*.3:angle,k=index%10;
 return {head:a*[1,-.55,.72,-.85,.4,.6,-.7,.5,.9,-1][k],sway:Math.sin(a)*[.08,-.13,.1,.16,-.18,.07,.12,-.14,.19,-.09][k],drop:Math.sin(a*.5)*[15,25,10,35,70,20,-45,30,90,-20][k]};
}
export function stepSkeleton(s,dt,time,runner,active){
 if(!s.skeleton)s.skeleton={x:3100,hitAt:-1,hits:0};
 const b=s.skeleton;if(!active||dt<=0)return time-(s.skPunch??-100)<.23?Math.sin(Math.min(1,(time-s.skPunch)/.23)*Math.PI):0;
 if(b.hitAt<0){b.x-=230*dt;if(b.x<=runner.x+100){b.hitAt=time;b.hits++;s.skPunch=time;}}
 else if(time-b.hitAt>1.1&&runner.p<.78){b.x=3100;b.hitAt=-1;}
 return time-(s.skPunch??-100)<.23?Math.sin(Math.min(1,(time-s.skPunch)/.23)*Math.PI):0;
}
export function drawSkeleton(ctx,b,y,time,gentle){
 if(!b)return;const age=b.hitAt<0?0:time-b.hitAt;if(age>1.1)return;
 ctx.save();ctx.translate(b.x+(age?age*650:0),y-(age?Math.sin(age/1.1*Math.PI)*220:Math.abs(Math.sin(time*10))*15));
 ctx.rotate(age*(gentle?1:7));ctx.globalAlpha=age?1-age/1.1:1;ctx.strokeStyle='#e9e1cb';ctx.fillStyle='#e9e1cb';ctx.lineWidth=9;ctx.lineCap='round';
 ctx.beginPath();ctx.ellipse(0,-138,26,30,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#263239';for(const x of [-10,10]){ctx.beginPath();ctx.arc(x,-141,6,0,Math.PI*2);ctx.fill();}
 const line=(x,y,u,v)=>{const scatter=age*(gentle?20:100),dx=Math.sin(y*.21+x)*scatter,dy=Math.cos(y*.17+u)*scatter;ctx.save();ctx.translate(dx,dy);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.stroke();ctx.restore();};line(0,-109,0,-55);
 for(let i=0;i<3;i++)line(-19,-98+i*13,19,-98+i*13);
 for(const side of [-1,1]){const swing=Math.sin(time*11+side)*20;line(0,-92,side*30,-73+swing);line(side*30,-73+swing,side*45,-95+swing);line(0,-55,side*20,-30+swing*.5);line(side*20,-30+swing*.5,side*32+swing,0);}
 ctx.restore();
}
