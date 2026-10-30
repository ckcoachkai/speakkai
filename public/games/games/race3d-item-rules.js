/** Original Circuit Prism rules. Seconds here are simulation seconds (5x wall time). */
import {ALL_ITEM_IDS,BASE_ITEM_IDS,DRAW_ITEM_IDS,ITEM_REGISTRY,EXPANDED_DRAWS} from './race3d-item-registry.js?v=20261027-midnight';
export const ITEM_TYPES = ALL_ITEM_IDS;
export const INVENTORY_CAPACITY = 5;
export const inventoryCount = car => Number(!!car?.inventoryItem)+(car?.inventoryReserves?.length||0);
export const ROULETTE_DURATION = 4.5;
export const ITEM_HOLD_MIN = 2.5;
export const ITEM_HOLD_MAX = 5;
export function itemWeights({position=1,count=1,gap=0}={}){
 const trailing=Math.max(0,Math.min(1,Math.max(count>1?(position-1)/(count-1):0,gap/180)));
 // Familiar, immediately useful items remain the majority of actual draws.
 // Forty situational extras previously diluted a banana/bomb to about 3% each.
 // Rank changes opportunities only; no draw changes progress or the winner.
 if(EXPANDED_DRAWS){const base=new Set(BASE_ITEM_IDS),share={offense:.30,defense:.20,mobility:.25,recovery:.15,track:.10},totals={};for(const id of DRAW_ITEM_IDS){if(base.has(id))continue;const r=ITEM_REGISTRY[id];totals[r.category]=(totals[r.category]||0)+r.weight;}return DRAW_ITEM_IDS.map(id=>{const r=ITEM_REGISTRY[id],catchup=r.category==='mobility'?1+trailing*.4:r.category==='defense'?1.15-trailing*.25:r.category==='recovery'?1+trailing*.2:1;return (base.has(id)?.70/BASE_ITEM_IDS.length:.30*share[r.category]*r.weight/totals[r.category])*catchup;});}
 return DRAW_ITEM_IDS.map(type=>['boost','rocket','missile','shockwave'].includes(type)?1+trailing*1.5:['banana','shield'].includes(type)?1.45-trailing*.75:type==='repair'?1+trailing*.4:1);
}
export function drawItem(random = Math.random,context) {
  const n=Number(random());
  const value=Math.max(0,Math.min(.999999999,Number.isFinite(n)?n:.5));
  if(!context)return DRAW_ITEM_IDS[Math.floor(value*DRAW_ITEM_IDS.length)];
  const weights=itemWeights(context);let target=value*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<weights.length;i++){target-=weights[i];if(target<0)return DRAW_ITEM_IDS[i];}return DRAW_ITEM_IDS.at(-1);
}
export function inventoryFace(car, time = 0) {
  if(!car || car.finished)return null;
  if(car.inventoryPhase==='rolling')return DRAW_ITEM_IDS[(Math.floor((Number(time)||0)*2.4)+(car.inventorySerial||0)*3+(car.gridPosition||0))%DRAW_ITEM_IDS.length];
  return car.inventoryItem || null;
}
