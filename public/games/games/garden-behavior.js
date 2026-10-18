/** Local, deterministic perception. No random rolls or changes to picker selection. */
export function perceiveGardenLane(lane, now=0) {
 const enemies=(lane.mobs||lane.zombies||[]).filter(m=>!m.dead&&m.hp>0);
 const defenders=(lane.defenders||[]).filter(d=>!d.eaten&&d.hp>0);
 const nearest=enemies.reduce((a,b)=>!a||b.x<a.x?b:a,null);
 const hp=lane.hp??lane.playerHp??100, max=lane.maxHp??lane.playerMaxHp??100;
 const danger=nearest?Math.max(0,Math.min(1,(.30-nearest.x)/.30)):0;
 return {nearest,enemies,defenders,danger,emotion:hp<max*.25?'terrified':danger>.65?'afraid':danger>.2?'alert':defenders.length?'confident':'watchful',lookDirection:nearest?1:Math.sin(now/3000)>.5?1:0,protecting:defenders.some(d=>d.weapon==='trooper'),targetX:nearest?.x??1};
}
export function chooseTroopIntent({enemyDistance=1,moving=false,shotAge=Infinity,age=0,hurt=0}={}) {
 if(hurt>0)return'react';
 if(shotAge<160)return'fire';
 if(moving)return'walk';
 if(enemyDistance<.30)return'aim';
 return age%7000>6100?'reload':'kneel';
}
export function creatureIntent({distance=1,attacking=false,hurt=0,time=0}={}) {
 return {state:hurt>0?'recoil':attacking?'strike':distance<.25?'stalk':'search',headTurn:Math.max(-.12,Math.min(.12,(distance-.3)*.18)),charge:attacking?1:distance<.25?.55:0,breath:Math.sin(time/230)*.018};
}
