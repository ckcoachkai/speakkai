// A reversible paper cutout effect on the boss layer, never on the scenery.
let body,patch;
export function impactShift(radius,power,gentle=false){
 return radius*Math.max(0,Math.min(1,power))*(gentle?.12:1);
}
function tear(ctx,x,y,r){
 ctx.beginPath();
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,edge=r*(i%2?.90:1.04);
  const px=x+Math.cos(a)*edge,py=y+Math.sin(a)*edge*.83;
  i?ctx.lineTo(px,py):ctx.moveTo(px,py);
 }
 ctx.closePath();
}
export function drawPaperImpact(ctx,paint,point,radius,power,gentle=false){
 if(power<.015)return paint(ctx);
 body ||= document.createElement('canvas');patch ||= document.createElement('canvas');
 for(const c of [body,patch])if(c.width!==ctx.canvas.width||c.height!==ctx.canvas.height){c.width=ctx.canvas.width;c.height=ctx.canvas.height;}
 const b=body.getContext('2d'),p=patch.getContext('2d'),transform=ctx.getTransform();
 for(const c of [b,p]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,body.width,body.height);c.setTransform(transform);}
 const target=paint(b),{x,y}=point,shift=impactShift(radius,power,gentle);
 // Copy just the jagged local patch before cutting its original position out.
 p.save();tear(p,x,y,radius);p.clip();p.setTransform(1,0,0,1,0,0);p.drawImage(body,0,0);p.restore();
 b.save();b.globalCompositeOperation='destination-out';tear(b,x,y,radius);b.fill();b.restore();
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(body,0,0);ctx.restore();
 ctx.save();ctx.translate(shift,0);ctx.shadowColor='#101c1c99';ctx.shadowBlur=10*power;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(patch,shift*transform.a,shift*transform.b);ctx.restore();
 ctx.shadowBlur=0;ctx.globalAlpha=power*.75;ctx.strokeStyle='#ffe3a6';ctx.lineWidth=3;tear(ctx,x,y,radius);ctx.stroke();ctx.restore();
 return target;
}
