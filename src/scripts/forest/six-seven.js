export const SIX_SEVEN_DURATION = 4;
export const SIX_SEVEN_STYLES = 9;

// Crop only the numerals from the supplied sheet, excluding captions and labels.
export function prepareSixSeven(sheet) {
  return Array.from({length:9}, (_, style) => [0,1].map(row => {
    const c=document.createElement('canvas');c.width=142;c.height=194;
    const x=c.getContext('2d');
    const sx=20+style*170,sy=row?648:136;
    x.drawImage(sheet,sx*sheet.width/1536,sy*sheet.height/1024,142*sheet.width/1536,194*sheet.height/1024,0,0,142,194);
    // Background colour is sampled per row, preserving each number's gradient.
    const pixels=x.getImageData(0,0,142,194),d=pixels.data;
    for(let y=0;y<194;y++){
      const b=(y*142)*4,bg=[d[b],d[b+1],d[b+2]];
      for(let col=0;col<142;col++){
        const p=(y*142+col)*4;
        const delta=Math.max(...bg.map((v,k)=>Math.abs(d[p+k]-v)));
        d[p+3]=Math.round(255*Math.max(0,Math.min(1,(delta-24)/28)));
      }
    }
    x.putImageData(pixels,0,0);return c;
  }));
}

export function sixSevenPose(age,gentle=false) {
  const beat=age*Math.PI*2*1.05,amount=gentle?.2:1;
  const pop=Math.min(1,Math.max(0,age)*5,Math.max(0,SIX_SEVEN_DURATION-age)*5);
  return {pop,angles:[-1.8+Math.sin(beat)*.55*amount,-.7,.1,1.8+Math.sin(beat)*.55*amount,.7,-.1]};
}

export function drawHeldNumber(ctx,sprite,x,y,width,height,pop) {
  ctx.save();ctx.translate(x,y);ctx.scale(pop,pop);
  ctx.shadowColor='rgba(255,255,255,.9)';ctx.shadowBlur=8;
  ctx.drawImage(sprite,-width/2,-height,width,height);ctx.restore();
}
