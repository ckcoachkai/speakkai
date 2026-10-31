import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ALL_ITEM_IDS,ITEM_REGISTRY} from '../public/games/games/race3d-item-registry.js';
import {itemThumbnail} from '../public/games/games/race3d-ui-catalog.js';
import {updateInventoryIcons} from '../public/games/games/race3d-inventory-ui.js';
const ids=new Set();
for (const type of ALL_ITEM_IDS) {
  const svg=itemThumbnail(type);
  assert.match(svg,/data-render="extruded-enamel"/);
  assert.match(svg,/aria-hidden="true"/);
  assert.ok(svg.length<16000,`${type}: bounded markup`);
  assert.ok(!/NaN|undefined|https?:|<image|<script/.test(svg));
  const localIds=[...svg.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
  for(const id of localIds){assert.ok(!ids.has(id));ids.add(id);}
  for(const [,id] of svg.matchAll(/url\(#([^\)]+)\)/g))assert.ok(localIds.includes(id));
  const {data,info}=await sharp(Buffer.from(svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" '))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,80);assert.equal(info.height,80);
  let visible=0;for(let i=3;i<data.length;i+=4)if(data[i]>80)visible++;
  assert.ok(visible>350,`${type}: visible silhouette`);
}
// Minimal document adapter exercises lifecycle/ARIA without requiring a browser.
class Element {
  constructor(){this.dataset={};this.children=[];this.attrs={};this.style={setProperty:(k,v)=>{this[k]=v;}};}
  setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k];}
  replaceChildren(){this.children=[];}append(n){this.children.push(n);}querySelector(){return null;}
}
globalThis.document={createElement:()=>new Element()};
const node=new Element();
const car={inventoryItem:'boost',inventoryPhase:'ready',inventorySerial:1,inventoryReserves:['bomb','shield','rocket','freeze'].map((type,i)=>({inventoryItem:type,inventoryPhase:i===0?'rolling':'ready',inventorySerial:i+2}))};
updateInventoryIcons(node,car);assert.equal(node.children.length,5);assert.equal(node.attrs['aria-label'],'5 of 5 power-ups held');
assert.match(node.children[1].attrs['aria-label'],/Slot 2: Bomb, revealing/);
assert.equal(node.children[4].dataset.slot,'5');assert.equal(node.children[4]['--item-color'],ITEM_REGISTRY.freeze.color);
const first=node.children[0];updateInventoryIcons(node,car);assert.equal(node.children[0],first,'No unnecessary DOM churn');
car.inventoryReserves.splice(1,1);updateInventoryIcons(node,car);assert.equal(node.children.length,4);assert.ok(!node.children.some(n=>n.dataset.item==='shield'));
const reserves=new Element();updateInventoryIcons(reserves,car,{reserveOnly:true});assert.equal(reserves.children.length,3);assert.equal(reserves.children[0].dataset.slot,'2');
updateInventoryIcons(node,null);assert.equal(node.hidden,true);assert.equal(node.children.length,0);
updateInventoryIcons(reserves,null,{reserveOnly:true});assert.equal(reserves.hidden,true);assert.equal(reserves.children.length,0);
console.log(JSON.stringify({portraits:ALL_ITEM_IDS.length,uniqueGradientIds:ids.size,rasterizedAll:true,fiveSlots:true,slotLabels:true,immediateClear:true,stableDOM:true}));
