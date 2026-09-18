export const DANCE_DURATION=8;
export const MUSIC_BPM=126;
export function dancePose(age,gentle=false){
 const amount=gentle?.2:1,beat=age*MUSIC_BPM/60*Math.PI*2;
 const fade=Math.min(1,Math.max(0,age)*4,Math.max(0,DANCE_DURATION-age)*3);
 const phase=age<2?'shoulders':age<4?'hips':'jump';
 return {phase,amount:amount*fade,beat,jump:phase==='jump'?Math.max(0,Math.sin(beat))*90*amount*fade:0,
  sway:Math.sin(beat*.5)*.16*amount*fade,hip:(age>=2?Math.sin(beat*.5)*.045:0)*amount*fade,
  shoulder:Math.sin(beat)*.025*amount*fade,
  angles:[-1.2+Math.sin(beat)*.65,-.6+Math.cos(beat)*.5,.25,1.2+Math.sin(beat+Math.PI)*.65,.6+Math.cos(beat+Math.PI)*.5,-.25].map(a=>a*amount*fade)};
}
