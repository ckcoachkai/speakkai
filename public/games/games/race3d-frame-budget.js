/** Render-only governor. Fixed simulation steps and item decisions never change. */
export function createFrameBudget(){
 let intervals=[],cpu=[],count=0,scale=1,detail=1,stable=0;
 return {reset(){intervals=[];cpu=[];count=0;scale=detail=1;stable=0;},sample(ms,cpuMs){
  if(!Number.isFinite(ms)||ms<=0||ms>250)return null;
  intervals.push(ms);cpu.push(cpuMs);if(intervals.length>120){intervals.shift();cpu.shift();}if(++count%120||intervals.length<120)return null;
  const times=[...intervals].sort((a,b)=>a-b),cost=[...cpu].sort((a,b)=>a-b),p95=times[114],medianCpu=cost[60];
  if(p95>25){stable=0;detail=.7;if(medianCpu<14)scale=Math.max(.7,scale-.1);}
  else if(p95<19){if(++stable>=3){scale=Math.min(1,scale+.05);detail=1;stable=0;}}else stable=0;
  return {scale,detail,p95,medianCpu};
 },snapshot(){return {scale,detail,samples:count};}};
}
