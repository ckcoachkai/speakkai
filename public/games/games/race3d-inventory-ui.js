import {ITEM_VISUALS,itemThumbnail} from './race3d-ui-catalog.js?v=20261027-midnight';
export function updateInventoryIcons(node,car,{reserveOnly=false}={}){
  const slots=car?.inventoryItem?[car,...(car.inventoryReserves||[])]:[];
  const shown=reserveOnly?slots.slice(1):slots;
  const key=shown.map(s=>`${s.inventorySerial}:${s.inventoryItem}:${s.inventoryPhase}`).join('|');
  node.hidden=!shown.length;
  node.setAttribute('role','group');node.setAttribute('aria-label',reserveOnly?'Additional power-ups':`${slots.length} of 5 power-ups held`);
  if(node.dataset.inventoryKey===key)return;
  node.dataset.inventoryKey=key;node.replaceChildren();
  for(const [i,slot] of shown.entries()){
    const icon=document.createElement('span'),position=i+(reserveOnly?2:1),name=ITEM_VISUALS[slot.inventoryItem]?.[0]||slot.inventoryItem;
    icon.className=position===1?'race3d-item-main':'race3d-item-small';icon.dataset.item=slot.inventoryItem;icon.dataset.phase=slot.inventoryPhase;
    icon.setAttribute('role','img');icon.setAttribute('aria-label',`Slot ${position}: ${name}, ${slot.inventoryPhase==='ready'?'ready':'revealing'}`);icon.title=icon.getAttribute('aria-label');
    icon.innerHTML=itemThumbnail(slot.inventoryItem);icon.querySelector('svg')?.setAttribute('aria-hidden','true');node.append(icon);
  }
}
