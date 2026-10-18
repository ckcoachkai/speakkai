/** Six articulated actions, 48 smoothly interpolated phase poses per action.
 * Coordinates and muzzle share one pose, so projectile emission cannot drift.
 * Original vector armor rig, not an official film sprite sheet. Time is milliseconds.
 */
export const TROOP_ACTIONS=Object.freeze(['walk','kneel','aim','fire','reload','react']);
export const TROOP_POSES_PER_ACTION=48;
const tau=Math.PI*2;
export function troopPose({time=0,state='kneel',shotAge=Infinity}={}) {
 const phase=(time%1200)/1200, wave=Math.sin(phase*tau), walk=state==='walk';
 const crouch=walk?0:14, recoil=state==='fire'?Math.max(0,1-shotAge/150)*3:0;
 const hip=[-3,-39+crouch], shoulder=[-4-recoil,-70+crouch+Math.sin(time/320)*.7];
 const gun=[13-recoil,shoulder[1]+11], angle=state==='reload'?-.4-.18*Math.sin(phase*tau):state==='react'?.12:0;
 const rotate=([x,y])=>[gun[0]+Math.cos(angle)*x-Math.sin(angle)*y,gun[1]+Math.sin(angle)*x+Math.cos(angle)*y];
 return {phase,frame:Math.floor(phase*48),hip,shoulder,gun,angle,head:[shoulder[0]+2,shoulder[1]-16],
 legs:walk?[[hip,[-11+wave*9,-20],[-13+wave*15,-2]],[hip,[8-wave*9,-19],[11-wave*15,-2]]]:[[hip,[-17,-11],[-25,-2]],[hip,[16,-24],[22,-2]]],
 hands:[rotate([7,3]),rotate([24,3])],muzzle:rotate([42,-3]),flash:state==='fire'&&shotAge<75};
}
export function troopMuzzle(options={}){const p=troopPose(options),s=options.scale??1;return{x:(options.x??0)+p.muzzle[0]*s,y:(options.y??0)+p.muzzle[1]*s};}
export function drawGardenTrooper(ctx,options={}) {
 const {x=0,y=0,scale=1}=options,p=troopPose(options); if(troopTexture)return drawTexturedTrooper(ctx,p,options);
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineJoin='round';ctx.lineCap='round';
 const plate=(points,color='#586b5c')=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle=color;ctx.strokeStyle='#19252b';ctx.lineWidth=2;ctx.fill();ctx.stroke();};
 const bone=(a,b,width,color)=>{ctx.strokeStyle='#19252b';ctx.lineWidth=width+3;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.strokeStyle='#a2afa0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a[0]-2,a[1]);ctx.lineTo(b[0]-2,b[1]);ctx.stroke();};
 ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(0,0,28,4,0,0,tau);ctx.fill();
 p.legs.forEach((l,i)=>{bone(l[0],l[1],11,i?'#687a67':'#3e5048');bone(l[1],l[2],9,i?'#647763':'#34483f');plate([[l[2][0]-5,-7],[l[2][0]+6,-7],[l[2][0]+11,0],[l[2][0]-6,0]],'#273436');});
 const [sx,sy]=p.shoulder,[hx,hy]=p.hip;
 const grad=ctx.createLinearGradient(sx-14,sy,sx+14,sy+30);grad.addColorStop(0,'#a9b39b');grad.addColorStop(.4,'#667c63');grad.addColorStop(1,'#34483b');
 plate([[sx-13,sy],[sx+12,sy-2],[hx+12,hy],[hx-12,hy]],grad);
 plate([[sx-8,sy+4],[sx+8,sy+3],[sx+7,sy+16],[sx-8,sy+17]],'#7c8c70');
 for(let i=0;i<3;i++)plate([[hx-11+i*8,hy-7],[hx-5+i*8,hy-7],[hx-5+i*8,hy],[hx-11+i*8,hy]],'#475044');
 const [ax,ay]=p.head;ctx.fillStyle='#c89d75';ctx.beginPath();ctx.ellipse(ax+3,ay+3,8,10,0,0,tau);ctx.fill();
 plate([[ax-10,ay+1],[ax-11,ay-7],[ax-4,ay-13],[ax+8,ay-11],[ax+12,ay-3],[ax+12,ay+2]],'#677e69');
 plate([[ax+1,ay-3],[ax+13,ay-3],[ax+12,ay+2],[ax+2,ay+3]],'#20343b');ctx.strokeStyle='#8ed9dd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax+3,ay-1);ctx.lineTo(ax+10,ay-1);ctx.stroke();
 p.hands.forEach((h,i)=>{const sh=[sx+(i?9:-10),sy+3],el=[sh[0]+(i?9:2),sh[1]+17];bone(sh,el,9,i?'#798d70':'#41584a');bone(el,h,7,'#6e8067');ctx.fillStyle='#273539';ctx.beginPath();ctx.arc(...h,4,0,tau);ctx.fill();});
 ctx.save();ctx.translate(...p.gun);ctx.rotate(p.angle);plate([[-10,-5],[24,-5],[29,-2],[38,-2],[38,1],[15,4],[-10,3]],'#283339');plate([[10,3],[17,3],[15,11],[10,11]],'#414c4b');ctx.fillStyle='#72817d';ctx.fillRect(0,-5,21,2);ctx.fillStyle='#151e24';ctx.fillRect(35,-5,7,5);ctx.fillRect(-3,-9,9,4);ctx.restore();
 if(p.flash){const[mx,my]=p.muzzle;plate([[mx,my-2],[mx+12,my-6],[mx+8,my],[mx+18,my+2],[mx+5,my+4]],'#ffe986');}
 ctx.restore();return troopMuzzle(options);
}
let troopTexture=null;
export function setTroopTexture(url='assets/garden-allies/trooper-parts.png') {if(typeof Image==='undefined')return;const im=new Image();im.onload=()=>{troopTexture=im;};im.src=url;}
// Explicit silhouette polygons isolate the generated painted armor for joint animation.
const TP=[
[[18,288],[34,167],[81,86],[192,57],[292,65],[358,121],[382,181],[372,217],[375,267],[363,293],[378,335],[361,374],[330,389],[280,374],[268,425],[219,462],[151,431],[74,395],[53,346]],
[[431,192],[466,134],[497,107],[511,69],[573,52],[663,62],[707,100],[708,133],[748,155],[786,235],[777,334],[788,413],[769,463],[731,468],[700,446],[675,466],[597,474],[517,451],[477,450],[458,411],[445,315]],
[[881,153],[916,100],[967,59],[1010,54],[1048,78],[1080,153],[1091,215],[1046,255],[1055,310],[1049,344],[1043,394],[1036,437],[1009,466],[965,472],[937,448],[931,397],[925,357],[929,290],[899,258]],
[[1257,91],[1280,53],[1320,41],[1359,50],[1379,87],[1371,119],[1389,175],[1400,263],[1398,299],[1415,344],[1418,369],[1443,409],[1438,445],[1412,473],[1382,482],[1348,465],[1329,436],[1320,401],[1325,367],[1310,315],[1289,292],[1283,234],[1270,188]],
[[63,598],[84,548],[149,523],[222,541],[256,576],[268,652],[264,755],[245,845],[253,900],[232,949],[192,971],[140,959],[104,931],[100,884],[84,823],[76,743]],
[[408,620],[436,551],[481,534],[531,547],[554,595],[552,682],[534,763],[531,844],[543,905],[518,950],[469,960],[430,942],[412,908],[412,860],[421,788],[420,703]],
[[607,689],[648,647],[726,631],[752,650],[759,724],[794,775],[832,819],[881,845],[910,872],[915,901],[893,919],[825,927],[753,917],[695,927],[637,915],[597,906],[594,879],[607,831]],
[[915,700],[1065,687],[1112,658],[1130,627],[1161,625],[1182,664],[1347,673],[1353,689],[1417,689],[1442,713],[1511,717],[1517,745],[1447,751],[1423,785],[1321,787],[1298,772],[1258,784],[1253,825],[1225,893],[1193,901],[1173,819],[1155,784],[1110,782],[1080,835],[1052,855],[1017,838],[1046,783],[1035,766],[956,764],[931,803],[910,798]]];
const TB=TP.map(ps=>{const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);return[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];});
function texturePart(c,i,x,y,w,h,angle=0){const b=TB[i];c.save();c.translate(x,y);c.rotate(angle);c.scale(w/b[2],h/b[3]);c.translate(-b[0]-b[2]/2,-b[1]);c.beginPath();TP[i].forEach((p,n)=>n?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.drawImage(troopTexture,0,0);c.restore();}
function drawTexturedTrooper(c,p,o){const{x=0,y=0,scale=1}=o;c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#0003';c.beginPath();c.ellipse(0,0,27,4,0,0,Math.PI*2);c.fill();const bone=(i,a,b,w)=>texturePart(c,i,a[0],a[1]-2,w,Math.hypot(b[0]-a[0],b[1]-a[1])+5,Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/2);p.legs.forEach(l=>{bone(4,l[0],l[1],14);bone(5,l[1],l[2],12);texturePart(c,6,l[2][0]+2,-9,20,10);});texturePart(c,1,p.shoulder[0],p.shoulder[1]-3,31,p.hip[1]-p.shoulder[1]+9);texturePart(c,0,p.head[0]+2,p.head[1]-15,29,30);p.hands.forEach((h,i)=>{const sh=[p.shoulder[0]+(i?9:-10),p.shoulder[1]+3],el=[sh[0]+(i?9:2),sh[1]+17];bone(2,sh,el,15);bone(3,el,h,11);});c.save();c.translate(...p.gun);c.rotate(p.angle);texturePart(c,7,14,-11,56,25);c.restore();if(p.flash){c.fillStyle='#fff5ad';c.beginPath();c.moveTo(...p.muzzle);c.lineTo(p.muzzle[0]+16,p.muzzle[1]-5);c.lineTo(p.muzzle[0]+9,p.muzzle[1]+1);c.lineTo(p.muzzle[0]+17,p.muzzle[1]+5);c.closePath();c.fill();}c.restore();return troopMuzzle(o);}
if(typeof Image!=='undefined')setTroopTexture();

