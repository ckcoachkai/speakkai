// Original superhero-inspired vector rigs; no official character artwork.
export const FLIERS=['armor-flier','hammer-flier'];
export function drawFlier(ctx,{id,x=0,y=0,scale=1,time=0,action,bite=0,death=0,hit=0}){
 const armor=id==='armor-flier',pulse=Math.sin(time*7),thrust=action?1.3:1;ctx.save();ctx.translate(x,y-32+Math.sin(time*3)*7);ctx.scale(scale,scale);ctx.globalAlpha*=1-death*.8;ctx.rotate(death*.8);ctx.lineCap='round';ctx.lineJoin='round';
 const limb=(a,b,c,d,color,w)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();};
 const body=armor?'#b52f35':'#586e8a',gold=armor?'#f5bd50':'#d7e6f2';
 if(!armor){ctx.fillStyle='#b83f50';ctx.beginPath();ctx.moveTo(-12,-104);ctx.lineTo(30,-100);ctx.lineTo(42,-22+pulse*5);ctx.lineTo(6,-40);ctx.fill();}
 for(const side of [-1,1]){limb(side*10,-45,side*15+pulse*3,-15,body,14);limb(side*15+pulse*3,-15,side*19+8,-1,gold,11);if(armor){ctx.fillStyle='#83eaff';ctx.beginPath();ctx.moveTo(side*19,-1);ctx.lineTo(side*19+5,20+pulse*4);ctx.lineTo(side*19+10,-1);ctx.fill();}}
 limb(0,-90,0,-42,body,37);ctx.fillStyle=gold;ctx.beginPath();ctx.ellipse(0,-119,16,20,0,0,7);ctx.fill();limb(-11,-121,9,-121,'#b5f8ff',4);
 const reach=action||bite>0?-44:-23;limb(-14,-89,reach,-81-pulse*thrust,gold,12);limb(14,-89,25,-64+pulse*4,body,12);
 if(armor){ctx.fillStyle='#b5f8ff';ctx.beginPath();ctx.arc(0,-78,6+Number(Boolean(action))*2,0,7);ctx.fill();ctx.beginPath();ctx.arc(reach-5,-81,5,0,7);ctx.fill();}
 else{limb(reach,-82,reach-8,-112,'#9d7650',6);ctx.fillStyle='#c7d8e1';ctx.fillRect(reach-25,-127,32,20);if(action){ctx.strokeStyle='#d8faff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(reach-12,-128);ctx.lineTo(reach-3,-147);ctx.lineTo(reach-16,-143);ctx.lineTo(reach-6,-165);ctx.stroke();}}
 if(hit){ctx.fillStyle='#fff9';ctx.beginPath();ctx.arc(0,-77,23,0,7);ctx.fill();}ctx.restore();return true;
}
