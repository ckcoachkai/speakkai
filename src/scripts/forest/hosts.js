// Animated image cutouts: body, shoulder and elbow regions share one pose.
function fire(ctx,x,y,t,size=1){
 ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='screen';ctx.shadowColor='#ff1800';ctx.shadowBlur=22;
 for(let k=0;k<5;k++){const dx=(k-2)*4*size;ctx.fillStyle=k%2?'#ff911c':'#ff2208';ctx.beginPath();ctx.moveTo(dx-6*size,4);ctx.quadraticCurveTo(dx-10,-15,dx+Math.sin(t*12+k)*9,-(24+Math.sin(t*9+k)*12)*size);ctx.quadraticCurveTo(dx+12,-9,dx+6*size,4);ctx.fill();}
 ctx.fillStyle='#ff1600';ctx.beginPath();ctx.ellipse(0,0,11*size,6*size,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff5b5';ctx.beginPath();ctx.ellipse(0,0,4*size,5*size,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
export function drawHost(ctx,img,host,box,pose,open,t){
 const {x,y,w,h}=box;const origin={x:x+w*.5,y:y+h-pose.jump};ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(pose.sway);
 const left=-w/2,top=-h;
 // A continuous deforming image mesh keeps limbs attached as joints move.
 const cols=10,rows=16;
 function vertex(u,v){const side=u<.5?0:1;const outer=Math.max(0,(Math.abs(u-.5)-.18)/.32);const band=v>.34&&v<.79?Math.sin((v-.34)/.45*Math.PI):0;const a=pose.angles[side*3],b=pose.angles[side*3+1],c=pose.angles[side*3+2];return {sx:u*w,sy:v*h,x:left+u*w+outer*band*Math.sin(b)*w*.055,y:top+v*h+outer*band*(Math.sin(a)*h*.075+Math.sin(b+c)*h*.035)};}
 function triangle(p,q,r){const den=(q.sx-p.sx)*(r.sy-p.sy)-(r.sx-p.sx)*(q.sy-p.sy);const aa=((q.x-p.x)*(r.sy-p.sy)-(r.x-p.x)*(q.sy-p.sy))/den,bb=((q.y-p.y)*(r.sy-p.sy)-(r.y-p.y)*(q.sy-p.sy))/den,cc=((r.x-p.x)*(q.sx-p.sx)-(q.x-p.x)*(r.sx-p.sx))/den,dd=((r.y-p.y)*(q.sx-p.sx)-(q.y-p.y)*(r.sx-p.sx))/den;ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,p.x-aa*p.sx-cc*p.sy,p.y-bb*p.sx-dd*p.sy);ctx.drawImage(img,0,0,w,h);ctx.restore();}
 for(let iy=0;iy<rows;iy++)for(let ix=0;ix<cols;ix++){const p=vertex(ix/cols,iy/rows),q=vertex((ix+1)/cols,iy/rows),r=vertex(ix/cols,(iy+1)/rows),s=vertex((ix+1)/cols,(iy+1)/rows);triangle(p,q,r);triangle(q,s,r);}
 for(const [ex,ey] of host.eyes)fire(ctx,left+ex*w,top+ey*h,t,.8);
 const mx=left+host.mouth[0]*w,my=top+host.mouth[1]*h;
 if(open){ctx.fillStyle='#2d0920';ctx.beginPath();ctx.ellipse(mx,my,w*.037,h*.021,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f17d98';ctx.beginPath();ctx.ellipse(mx,my+h*.009,w*.023,h*.008,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();return {x:origin.x+mx*Math.cos(pose.sway)-my*Math.sin(pose.sway),y:origin.y+mx*Math.sin(pose.sway)+my*Math.cos(pose.sway)};
}
