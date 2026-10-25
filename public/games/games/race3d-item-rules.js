/** Original Circuit Prism rules. Seconds here are simulation seconds (5x wall time). */
export const ITEM_TYPES = Object.freeze(['launch','rocket','boost','bomb','shield','banana','missile','shockwave','freeze','repair']);
export const ROULETTE_DURATION = 4.5;
export const ITEM_HOLD_MIN = 2.5;
export const ITEM_HOLD_MAX = 5;
export function itemWeights({position=1,count=1,gap=0}={}){
 const trailing=Math.max(0,Math.min(1,Math.max(count>1?(position-1)/(count-1):0,gap/180)));
 return ITEM_TYPES.map(type=>['boost','rocket','missile','shockwave'].includes(type)?1+trailing*1.5:['banana','shield'].includes(type)?1.45-trailing*.75:type==='repair'?1+trailing*.4:1);
}
export function drawItem(random = Math.random,context) {
  const n=Number(random());
  const value=Math.max(0,Math.min(.999999999,Number.isFinite(n)?n:.5));
  if(!context)return ITEM_TYPES[Math.floor(value*ITEM_TYPES.length)];
  const weights=itemWeights(context);let target=value*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<weights.length;i++){target-=weights[i];if(target<0)return ITEM_TYPES[i];}return ITEM_TYPES.at(-1);
}
export function inventoryFace(car, time = 0) {
  if(!car || car.finished)return null;
  if(car.inventoryPhase==='rolling')return ITEM_TYPES[(Math.floor((Number(time)||0)*2.4)+(car.inventorySerial||0)*3+(car.gridPosition||0))%ITEM_TYPES.length];
  return car.inventoryItem || null;
}
