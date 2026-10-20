// Equipment effects attach to the existing illustrated hands; no duplicate limbs.
export function drawGardenWeapons(ctx,{id,x,y,scale=1,time=0,action='',attack=0,cast=null}){
 if(!['gandalf','zeus','hobbit','hellokitty','pennywise','zombieclown'].includes(id))return false;
 const active=Boolean(cast||action==='charge'||attack>0),p=time*4;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineCap='round';
 const line=(pts,c,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.stroke();};
 const glow=(x,y,r,c)=>{ctx.shadowColor=c;ctx.shadowBlur=active?15:5;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;};
 if(id==='gandalf'){ctx.globalAlpha=active?.65:.22;glow(-38,-83,active?5:3,'#55cfff');if(active)for(let i=0;i<3;i++){ctx.globalAlpha=.3;ctx.strokeStyle='#67d9ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(-38+Math.sin(p+i)*2,-86-i*3,3,6,Math.sin(p+i)*.3,0,Math.PI*2);ctx.stroke();}}
 if(id==='zeus'&&active){ctx.globalAlpha=.45;line([[-57,-76],[-47,-61],[-54,-62],[-40,-44]],'#fff3aa',2);}
 if(id==='hobbit'){if(active){ctx.globalAlpha=.6;line([[-13,-48],[8,-41]],'#9de9ff',2);}for(let i=0;i<3;i++){ctx.globalAlpha=.12;ctx.strokeStyle='#93d880';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-7+i*10,-6-Math.sin(p+i)*3,4,7,Math.sin(p+i)*.4,0,Math.PI*2);ctx.stroke();}}
 if(id==='pennywise'){ctx.fillStyle='#485968';ctx.strokeStyle='#b5c4ce';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-32,-49,18,9,3);ctx.fill();ctx.stroke();if(active)glow(-32,-44.5,3,'#ffc66f');}
 if(id==='zombieclown'&&active){ctx.globalAlpha=.55;glow(36,-30,4,'#ffc66f');}
 if(id==='hellokitty'){const mx=-30,my=-50;line([[-12,-43],[mx+4,my+13]],'#d9a8c6',4);line([[mx,my+8],[mx,my+20]],'#e2b951',2);ctx.strokeStyle='#e9c774';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,my,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d6f9ff44';ctx.fill();if(active){ctx.globalAlpha=.6;line([[mx+18,my-22],[mx,my]],'#fff4a3',1);glow(mx,my,2,'#fff9d0');}}
 ctx.restore();return true;
}
export function gardenWeaponOrigin(id,{x,y,scale=1}){const offsets={gandalf:[-38,-83],zeus:[-48,-63],hobbit:[-13,-48],hellokitty:[-30,-50],pennywise:[-32,-44.5],zombieclown:[-36,-30]};const o=offsets[id]??[0,-45];return{x:x+o[0]*scale,y:y+o[1]*scale};}

