/** Original Circuit Prism rules. Seconds here are simulation seconds (5x wall time). */
export const ITEM_TYPES = Object.freeze(['launch','rocket','boost','bomb','shield','banana','missile','shockwave','freeze','repair']);
export const ROULETTE_DURATION = 4.5;
export const ITEM_HOLD_MIN = 2.5;
export const ITEM_HOLD_MAX = 5;
export function drawItem(random = Math.random) {
  const n=Number(random());
  return ITEM_TYPES[Math.floor(Math.max(0,Math.min(.999999999,Number.isFinite(n)?n:.5))*ITEM_TYPES.length)];
}
export function inventoryFace(car, time = 0) {
  if(!car || car.finished)return null;
  if(car.inventoryPhase==='rolling')return ITEM_TYPES[(Math.floor((Number(time)||0)*2.4)+(car.inventorySerial||0)*3+(car.gridPosition||0))%ITEM_TYPES.length];
  return car.inventoryItem || null;
}
