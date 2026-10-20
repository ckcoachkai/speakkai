// Local combat abilities: visible intent, real projectiles, lane-owned damage.
export function createGardenSpells({damageDefender,log,cue,random=Math.random}) {
 const effects=[];let flashAt=-Infinity,lastFlash=-Infinity;
 const plants=lane=>[...lane.defenders,...(lane.torchwood?[lane.torchwood]:[])].filter(d=>!d.eaten&&d.hp>0&&!['trooper','clonesword'].includes(d.weapon));
 const casterId=m=>m.monsterId||m.type?.id;
 const rules={'armor-flier':{kind:'repulsor',damage:42,cooldown:5},'hammer-flier':{kind:'lightning',damage:85,cooldown:11},zeus:{kind:'lightning',damage:70,cooldown:10},pikachu:{kind:'lightning',damage:45,cooldown:8},zombieclown:{kind:'cannon',damage:48,cooldown:7},hobbit:{kind:'sword',damage:65,cooldown:5},gandalf:{kind:'bluefire',damage:55,cooldown:8},hellokitty:{kind:'sunlaser',damage:40,cooldown:7}};
 function update(lane,sim,wall,dt,shots=[]){
  lane.magic??={projectiles:[],lastWall:wall};const a=lane.magic,visualDt=Math.min(.06,Math.max(0,(wall-a.lastWall)/1000));a.lastWall=wall;
  if(lane.eaten){a.projectiles=[];return;}
  for(const mob of lane.mobs){
   if(mob.dead)continue;const id=casterId(mob),rule=rules[id]||mob.type?.spell;
   if(['pennywise','zombieclown'].includes(id)){
    mob.nextEvade??=sim+3;
    if(sim>=mob.nextEvade&&wall>=(mob.evadeReadyWall||0)&&shots.some(p=>p.lane===lane.index&&p.x<mob.x&&mob.x-p.x<.22)){
     mob.nextEvade=sim+5+random()*4;mob.evadeReadyWall=wall+2800;
     if(random()<.65){const from=mob.x,dir=random()<.5?-1:1;mob.x=Math.max(.13,Math.min(1.06,mob.x+dir*(.055+random()*.045)));mob.renderPreviousX=mob.x;mob.evadeUntilWall=wall+240;mob.teleportWall=wall;effects.push({kind:'blink',lane:lane.index,x:from,wall},{kind:'blink',lane:lane.index,x:mob.x,wall});cue(lane,'teleport');log({type:'clownEvade',laneId:lane.entry.id,zombieId:mob.uid,from,to:mob.x});}
    }
   }
   if(id==='zombiemonkey'&&sim>=(mob.nextMonkeyCall??0)){mob.nextMonkeyCall=sim+12;cue(lane,'monkey');log({type:'monkeyCall',zombieId:mob.uid,laneId:lane.entry.id});}
   if(!rule)continue;
   mob.spellReady??=sim+2;mob.spellWallReady??=wall+900;
   const cast=mob.cast;
   if(cast&&!cast.resolved&&wall>=cast.strikeWall){
    cast.resolved=true;mob.casting=false;
    if(['lightning','sunlaser','sword'].includes(cast.kind)){
     const target=plants(lane).find(d=>d.uid===cast.targetId);
     if(target){const dealt=damageDefender(lane,target,rule.damage,cast.kind);effects.push({kind:cast.kind==='lightning'?'strike':cast.kind==='sunlaser'?'sunbeam':'slash',lane:lane.index,x:target.position,from:mob.weaponOrigin?.x??mob.x,fromY:mob.weaponOrigin?.y,wall});if(wall-lastFlash>900){flashAt=wall;lastFlash=wall;}cue(lane,cast.kind==='lightning'?'thunder':'laser');log({type:cast.kind==='lightning'?'lightningStrike':'abilityStrike',zombieId:mob.uid,laneId:lane.entry.id,defenderId:target.uid,damage:dealt});}
    }else{
     a.projectiles.push({kind:cast.kind,x:mob.weaponOrigin?.x??mob.x-.025,previousX:mob.weaponOrigin?.x??mob.x-.025,y:mob.weaponOrigin?.y,source:mob.uid,damage:rule.damage,wall,life:0});cue(lane,cast.kind==='heart'?'heart':'fireball');
    }
   }
   if(cast&&wall-cast.strikeWall>650)mob.cast=null;
   if(!mob.cast&&sim>=mob.spellReady&&wall>=mob.spellWallReady){
    const candidates=plants(lane).filter(d=>d.position<mob.x-.04);
    if(id==='hobbit'&&candidates.every(d=>mob.x-d.position>.19))continue;
    if(candidates.length){const kind=id==='gandalf'?(mob.gandalfLightning===false?'bluefire':'lightning'):rule.kind;const target=kind==='lightning'?candidates[Math.floor(random()*candidates.length)]:candidates.reduce((a,b)=>a.position>b.position?a:b);
     if(id==='gandalf')mob.gandalfLightning=kind!=='lightning';mob.cast={kind,targetId:target.uid,targetX:target.position,castWall:wall,strikeWall:wall+(kind==='lightning'?1150:650),resolved:false};mob.casting=true;mob.spellReady=sim+rule.cooldown;mob.spellWallReady=wall+(rule.kind==='heart'?1800:4000);log({type:'spellCharge',kind,zombieId:mob.uid,laneId:lane.entry.id,targetId:target.uid});cue(lane,'charge');
    }else mob.spellReady=sim+1;
   }
  }
  for(const p of a.projectiles){
   p.previousX=p.x;p.x-=visualDt*(p.kind==='heart'?.40:.52);p.life+=visualDt;
   const hit=plants(lane).filter(d=>d.position<=p.previousX+.015&&d.position>=p.x-.015).sort((a,b)=>b.position-a.position)[0];
   if(hit){p.done=true;const amount=damageDefender(lane,hit,p.damage,p.kind);effects.push({kind:p.kind==='heart'?'love':'fireHit',lane:lane.index,x:hit.position,wall});cue(lane,p.kind==='heart'?'heart':'fireImpact');const splash=[];
    if(['fireball','bluefire'].includes(p.kind))for(const other of plants(lane)){if(other.uid!==hit.uid&&Math.abs(other.position-hit.position)<=.055){const damage=damageDefender(lane,other,18,'fireballSplash');splash.push({id:other.uid,damage});}}
    log({type:'spellHit',kind:p.kind,laneId:lane.entry.id,zombieId:p.source,defenderId:hit.uid,damage:amount,splash});
   }
  }
  a.projectiles=a.projectiles.filter(p=>!p.done&&p.x>-.04&&p.life<6);
 }
 function bolt(ctx,x1,y1,x2,y2,time,color='#d9faff',width=3){
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.shadowColor=color;ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(x1,y1);for(let i=1;i<=9;i++){const p=i/9,j=i===9?0:Math.sin(i*13+Math.floor(time/55))*9;ctx.lineTo(x1+(x2-x1)*p+j,y1+(y2-y1)*p);}ctx.stroke();ctx.restore();
 }
 function heart(ctx,x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.beginPath();ctx.moveTo(0,3);ctx.bezierCurveTo(-12,-4,-5,-12,0,-5);ctx.bezierCurveTo(5,-12,12,-4,0,3);ctx.fill();ctx.restore();}
 function draw(ctx,lanes,wall,width,height,reducedMotion=false){
  for(const lane of lanes){
   for(const mob of lane.mobs){const c=mob.cast;if(!c||mob.dead)continue;const x=lane.plantX+mob.x*lane.travel,y=lane.floor-65*lane.zombieScale,tx=lane.plantX+c.targetX*lane.travel,ty=lane.floor-35*lane.spriteScale,progress=Math.min(1,(wall-c.castWall)/(c.strikeWall-c.castWall));
    ctx.save();ctx.strokeStyle=c.kind==='heart'?'#ff87ba':c.kind==='fireball'?'#ffba57':'#b7edff';ctx.fillStyle=ctx.strokeStyle;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=10;
    if(!c.resolved){ctx.lineWidth=2;ctx.globalAlpha=.4+progress*.5;ctx.beginPath();ctx.arc(x,y,5+progress*13,0,7);ctx.stroke();if(c.kind==='lightning'){ctx.beginPath();ctx.ellipse(tx,lane.floor-2,15+progress*15,5+progress*3,0,0,7);ctx.stroke();if(progress>.42)bolt(ctx,x,y,x-12,Math.max(5,lane.y-10),wall,'#c6f5ff',2);}}
    else if(c.kind==='lightning'&&wall-c.strikeWall<240)bolt(ctx,tx-16,Math.max(0,lane.y-15),tx,ty,wall,'#f5fdff',4);
    ctx.restore();
   }
   for(const p of lane.magic?.projectiles||[]){const x=lane.plantX+p.x*lane.travel,y=p.y??lane.floor-40*lane.spriteScale;ctx.save();
    if(p.kind==='bluefire'){ctx.fillStyle='#65dfff';ctx.shadowColor='#2e7dff';ctx.shadowBlur=17;ctx.beginPath();ctx.arc(x,y,10*lane.spriteScale,0,7);ctx.fill();ctx.fillStyle='#e4fcff';ctx.beginPath();ctx.arc(x-2,y,4*lane.spriteScale,0,7);ctx.fill();}
    else if(p.kind==='cannon'){ctx.fillStyle='#d6e4ec';ctx.strokeStyle='#607987';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,7*lane.spriteScale,0,7);ctx.fill();ctx.stroke();}
    else if(p.kind==='heart'){ctx.fillStyle='#ff5d9d';ctx.shadowColor='#ff9bc7';ctx.shadowBlur=8;heart(ctx,x,y+Math.sin(wall/160)*3,.9*lane.spriteScale);}
    else if(p.kind==='repulsor'){ctx.strokeStyle='#a8faff';ctx.lineWidth=6*lane.spriteScale;ctx.shadowColor='#40dfff';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+25*lane.spriteScale,y);ctx.stroke();}
    else{const r=9*Math.max(.6,lane.spriteScale),g=ctx.createRadialGradient(x,y,0,x,y,r*2.2);g.addColorStop(0,'#fff8cd');g.addColorStop(.3,'#ffc34c');g.addColorStop(.7,'#fb5421');g.addColorStop(1,'#fb542100');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.2,0,7);ctx.fill();ctx.fillStyle='#ffad4055';ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+38*lane.spriteScale,y+Math.sin(wall/60)*3);ctx.lineTo(x,y+r);ctx.fill();}
    ctx.restore();
   }
  }
  for(let i=effects.length-1;i>=0;i--){const e=effects[i],age=(wall-e.wall)/650;if(age>=1){effects.splice(i,1);continue;}const l=lanes[e.lane];if(!l)continue;const x=l.plantX+e.x*l.travel,y=l.floor-24*l.spriteScale;ctx.save();ctx.globalAlpha=1-age;if(e.kind==='sunbeam'){ctx.strokeStyle='#fff2a0';ctx.lineWidth=(1-age)*8;ctx.shadowColor='#ffe943';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(l.plantX+e.from*l.travel,e.fromY??l.floor-40*l.spriteScale);ctx.lineTo(x,y);ctx.stroke();}if(e.kind==='slash'){ctx.strokeStyle='#eaffb0';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,25+age*15,-2,.8);ctx.stroke();}ctx.strokeStyle=e.kind==='blink'?'#cda4ff':e.kind==='love'?'#ff7bb2':e.kind==='strike'?'#e2f8ff':'#ffb35b';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,10+age*35,20+age*20,0,0,7);ctx.stroke();for(let n=0;n<7;n++){ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(x+Math.cos(n)*age*42,y+Math.sin(n)*age*28,3*(1-age),0,7);ctx.fill();}ctx.restore();}
  if(!reducedMotion&&wall-flashAt<100){ctx.save();ctx.globalAlpha=.055*(1-(wall-flashAt)/100);ctx.fillStyle='#e9faff';ctx.fillRect(0,0,width,height);ctx.restore();}
 }
 return {update,draw,clear(){effects.length=0;flashAt=-Infinity;},getState:()=>({effects:effects.length})};
}
