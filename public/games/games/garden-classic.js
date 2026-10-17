import { createGardenRenderer } from './garden-rig.js?v=20261013-garden';
import { createGardenFX } from './garden-fx.js?v=20261013-garden';
import { CLASSIC_PLANTS, PLANT_BY_ID, CLASSIC_ZOMBIES, ZOMBIE_BY_ID, GARDEN_RULES, getSplashDamage } from './garden-rules.js?v=20261013-garden';

// A playable daytime lawn using the shared source-backed combat rules.
// The three-wave level is authored for this browser game; it is not a ROM.
const ROWS = 5, COLS = 9, STEP = .04, TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const damageStage = (hp, maximum) => clamp(Math.floor((1 - hp / maximum) * 5 + 1e-8), 0, 4);
const SEED_ORDER = ['sunflower','pea','walnut','potato','frost','twin','burst','splash','pierce','catapult','tallnut','gatling','wintermelon','cherrybomb','torchwood'];
const SOUND_GAP = {shot:.08,hit:.10,armor:.22,bite:.22,growl:3,plant:.15,death:.2,intro:5,outro:5};
const SOUND_GAIN = {shot:.32,hit:.3,armor:.4,bite:.35,growl:.56,plant:.48,death:.45,intro:.6,outro:.62};
const MAX_LIVE_ZOMBIES=120;
export const getEndlessWaveCount = number => number<=1?5:Math.min(Number.MAX_SAFE_INTEGER,50*2**(Math.max(2,Math.floor(number))-2));
const projectileKind = shot => ({pea:'pea',twin:'pea',burst:'pea',gatling:'pea',frost:'snow',splash:'kernel',catapult:'melon',wintermelon:'wintermelon',pierce:'spike'}[shot.kind]||shot.kind);

/** Armor damage changes equipment health, never a zombie's identity. */
export function damageClassicZombie(mob, damage, options={}) {
  if (mob.dead || damage <= 0) return {damage:0,killed:false};
  const before=mob.hp,oldShield=mob.shieldHp||0;
  let remaining=damage;
  if(!options.bypassesShield&&oldShield>0){const shieldDamage=Math.min(oldShield,damage);mob.shieldHp=oldShield-shieldDamage;if(!options.hitsShieldAndBody)remaining-=shieldDamage;}
  const chillEligible=remaining>0,absorbed = Math.min(mob.armorHp, remaining);
  mob.armorHp = Math.max(0, mob.armorHp - absorbed);
  mob.bodyHp = Math.max(0, mob.bodyHp - (remaining - absorbed));
  mob.hp = mob.bodyHp + mob.armorHp + (mob.shieldHp||0);
  const actual=before-mob.hp;
  mob.hurt = .13;
  if (oldShield>0&&!mob.shieldHp&&/newspaper/.test(mob.visualType)) mob.enraged = true;
  if (mob.bodyHp <= 0) {mob.dead = true; return {damage:actual,killed:true,chillEligible};}
  return {damage:actual,killed:false,chillEligible};
}

export function classicSplashTargets(mobs, impact, directId) {
  // Readable 3×3 lawn area is this browser adaptation; damage and crowd cap
  // use the reconstructed original values rather than its pixel hitboxes.
  return mobs.filter(mob => !mob.dead && mob.id !== directId && Math.abs(mob.row-impact.row)<=1 && Math.abs(mob.x-impact.x)<=1.5);
}

export default function createGame({container, artwork={}, random=Math.random, sound=false, speed=1, onFinish, onStart}={}) {
  const rng = () => clamp(Number(random()) || 0, 0, 1-Number.EPSILON);
  const root = document.createElement('div');
  root.className = 'garden-classic';
  root.innerHTML = '<style>.garden-classic{position:relative;display:flex;flex-direction:column;width:100%;height:100%;min-height:0;background:#304f28;color:#fff7de;font:14px system-ui,sans-serif;overflow:hidden}.gc-toolbar{display:flex;align-items:center;gap:10px;padding:8px 22px 3px;min-height:30px;background:linear-gradient(#283b29,#26392a)}.gc-budget{display:flex;align-items:center;gap:6px;font-weight:800;font-size:18px;min-width:73px;color:#ffe16f;font-variant-numeric:tabular-nums}.gc-message{flex:1;min-width:0;font-size:12px;opacity:.88}.gc-progress{width:110px;accent-color:#dbe896;flex-shrink:0}.gc-wave{font-size:11px;white-space:nowrap}.gc-tool{border:1px solid #e5eabd44;border-radius:8px;color:#fff9e4;background:#40513a;padding:7px 11px;cursor:pointer;font:inherit}.gc-tool[aria-pressed=true]{background:#f3cf66;color:#2d3e27}.gc-tool:disabled{opacity:.35;cursor:default}.gc-seeds{display:flex;gap:6px;padding:7px 22px 10px;overflow-x:auto;flex-shrink:0;background:#26392a;scrollbar-width:thin;scrollbar-color:#a8ba7a55 #26392a}.gc-seed{position:relative;flex:0 0 70px;height:86px;background:linear-gradient(#f5eec7,#dfd69e);color:#354523;border:2px solid #a39d67;border-radius:8px;padding:0;cursor:pointer;overflow:hidden}.gc-seed canvas{position:absolute;inset:13px 5px 18px;pointer-events:none}.gc-seed-name{position:absolute;top:3px;left:1px;right:1px;font-size:9px;font-weight:750;white-space:nowrap}.gc-seed-cost{position:absolute;bottom:2px;left:2px;right:2px;font-size:12px;font-weight:850}.gc-seed .gc-recharge{position:absolute;left:0;right:0;bottom:0;background:#25331ead;pointer-events:none;transition:height .08s linear}.gc-seed:disabled{cursor:default}.gc-seed.is-poor{filter:saturate(.35);opacity:.7}.gc-seed.is-selected{border-color:#fffac0;box-shadow:0 0 0 2px #eacf6f,0 0 16px #f2ce6777}.gc-stage{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:manipulation}.gc-lawn-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.gc-grid{position:absolute;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));z-index:2}.gc-cell{background:transparent;border:0;padding:0;border-radius:5px;cursor:default;touch-action:manipulation}.gc-grid.is-placing .gc-cell{cursor:crosshair}.gc-grid.is-placing .gc-cell:hover,.gc-cell:focus-visible{background:#ffe78b33;outline:2px solid #fff8b9;outline-offset:-3px}.gc-sun{position:absolute;z-index:5;width:43px;height:43px;margin:-21.5px;border:0;padding:0;background:transparent;color:#ffd544;cursor:pointer;filter:drop-shadow(0 0 9px #ffe376);font-size:43px;line-height:43px;touch-action:manipulation}.gc-sun:focus-visible{outline:2px solid #fff;border-radius:50%}.gc-overlay[hidden]{display:none}.gc-overlay{position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;pointer-events:none}.gc-panel{pointer-events:auto;text-align:center;background:#253622ee;border:1px solid #e5dfa455;border-radius:18px;padding:25px 32px;max-width:330px;box-shadow:0 18px 70px #13201466;backdrop-filter:blur(8px)}.gc-panel h2{margin:0 0 10px;font-size:25px;font-weight:750}.gc-panel p{margin:0 0 18px;font-size:13px;line-height:1.5;color:#e9eccf}.gc-panel button{border:0;border-radius:9px;padding:11px 22px;background:#f3d67b;color:#294022;font:750 14px system-ui;cursor:pointer}.gc-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:600px){.gc-toolbar{padding:6px 12px 3px;gap:6px}.gc-seeds{padding-left:12px;padding-right:12px;gap:5px}.gc-seed{flex-basis:61px;height:79px}.gc-seed-name{font-size:8px}.gc-budget{min-width:58px;font-size:16px}.gc-message{font-size:10px}.gc-progress{width:58px}.gc-wave{display:none}.gc-tool{font-size:11px;padding:6px 8px}.gc-panel{max-width:240px;padding:20px}.gc-panel h2{font-size:21px}}</style><div class="gc-toolbar"><span class="gc-budget" aria-label="Sun balance">☀ <span class="gc-sun-count">50</span></span><span class="gc-message">Collect sun. Choose a seed, then a lawn square.</span><progress class="gc-progress" max="1" value="0" aria-label="Wave progress"></progress><span class="gc-wave">Wave 1 / 3</span><button class="gc-tool gc-shovel" type="button" aria-pressed="false" aria-label="Shovel: remove a plant">Shovel</button><button class="gc-tool gc-pause" type="button">Pause</button></div><div class="gc-seeds" role="group" aria-label="Plant seeds"></div><div class="gc-stage"><canvas class="gc-lawn-canvas" role="img" aria-label="Daytime garden lawn"></canvas><div class="gc-grid" role="group" aria-label="Five rows and nine columns of lawn squares"></div><div class="gc-suns"></div><div class="gc-overlay"><div class="gc-panel"><h2>Protect the garden</h2><p>Collect sunshine and build your defense. Survive three waves.</p><button type="button" class="gc-begin">Start game</button></div></div></div><div class="gc-live" aria-live="polite"></div>';
  container.appendChild(root);
  const q = selector => root.querySelector(selector);
  const stage=q('.gc-stage'),canvas=q('.gc-lawn-canvas'),ctx=canvas.getContext('2d'),grid=q('.gc-grid'),tray=q('.gc-seeds'),sunLayer=q('.gc-suns');
  const balance=q('.gc-sun-count'),message=q('.gc-message'),progress=q('.gc-progress'),waveLabel=q('.gc-wave'),shovel=q('.gc-shovel'),pauseButton=q('.gc-pause');
  const overlay=q('.gc-overlay'),title=q('.gc-panel h2'),description=q('.gc-panel p'),begin=q('.gc-begin'),live=q('.gc-live');
  const levelControl=document.createElement('select');
  levelControl.className='gc-level';levelControl.setAttribute('aria-label','Level mode');
  for(const [value,label] of [['finite','Three waves'],['endless','Endless Survival']]){const option=document.createElement('option');option.value=value;option.textContent=label;levelControl.appendChild(option);}
  levelControl.value='finite';
  Object.assign(levelControl.style,{width:'112px',maxWidth:'28vw',border:'1px solid #e5eabd44',borderRadius:'8px',background:'#40513a',color:'#fff9e4',padding:'7px 4px',font:'12px system-ui'});
  q('.gc-toolbar').style.flexWrap='wrap';q('.gc-toolbar').appendChild(levelControl);
  const renderer=createGardenRenderer({artwork});
  const fx=createGardenFX({artwork});
  const listeners=[],seedButtons=new Map(),cells=[],sunButtons=new Map();
  let alive=true,phase='idle',time=0,sun=50,selected=null,hover=null,plants=[],mobs=[],shots=[],suns=[],effects=[],scheduledShots=[];
  let mowers=[],wavePlan=[],spawnIndex=0,kills=0,serial=0,nextSky=6,skyCount=0,frameId=null,lastFrame=null,accumulator=0,finished=false,wave=1;
  let endless=false,waveTarget=48,totalSpawned=0,nextGroupAt=30,pendingGroup=0,groupSize=5,groupGap=4,simulationSpeed=Number.isFinite(Number(speed))?clamp(Number(speed),1,100):1;
  let width=1000,height=500,lawn={x:60,y:20,w:890,h:445,cw:98.89,rh:89},soundEnabled=Boolean(sound),mowerArt=null,mowerAbort=null;
  const cooldowns=new Map(),events=[];
  let audio=null,audioEpoch=0,audioAbort=null,introPlayed=false;
  const buffers=new Map(),voices=new Set(),lastSfx=new Map(),rotations=new Map();
  const sounds={...artwork.gardenSounds,intro:artwork.gardenCues?.intro,outro:artwork.gardenCues?.outro};delete sounds.mower;delete sounds.pickup;
  function listen(element,event,callback,options){element.addEventListener(event,callback,options);listeners.push(()=>element.removeEventListener(event,callback,options));}
  function log(type,data={}){events.push({type,time:Number(time.toFixed(3)),...data});if(events.length>1200)events.shift();}
  function announce(text){message.textContent=text;live.textContent=text;}
  function newPlant(id,row,col){
    const rule=PLANT_BY_ID[id];
    return {id:'plant-'+(++serial),seedId:id,rule,row,col,x:col+.5,hp:rule.hp,maxHp:rule.hp,recoil:0,nextAttack:time+.3,bornAt:time,armed:false,
      nextSun:time+(rule.firstSunMin??3)+rng()*((rule.firstSunMax??12.5)-(rule.firstSunMin??3))};
  }
  function buildPlan(){
    const basic=CLASSIC_ZOMBIES.find(z=>z.id==='walker'||z.id==='basic')?.id||CLASSIC_ZOMBIES[0].id;
    const cone=CLASSIC_ZOMBIES.find(z=>/cone/i.test(z.id))?.id||basic;
    const bucket=CLASSIC_ZOMBIES.find(z=>/bucket/i.test(z.id))?.id||cone;
    const paper=CLASSIC_ZOMBIES.find(z=>/newspaper/i.test(z.id))?.id||cone;
    const runner=CLASSIC_ZOMBIES.find(z=>/pole|runner/i.test(z.id))?.id||basic;
    const football=CLASSIC_ZOMBIES.find(z=>/football/i.test(z.id))?.id||bucket;
    const plan=[];
    const addWave=(number,start,count,gap,pool,initialWalkers=0)=>{let order=[0,1,2,3,4];for(let i=4;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}for(let i=0;i<count;i++)plan.push({at:start+i*gap,wave:number,row:order[i%ROWS],type:i<initialWalkers?basic:pool[Math.floor(rng()*pool.length)]});};
    // First expose one ordinary walker per row, then introduce equipment.
    // The breathing room funds a real sunflower economy without free plants.
    addWave(1,30,9,11,[basic,basic,basic,basic,cone],5);
    addWave(2,155,15,7.5,[basic,basic,basic,cone,cone,paper,runner,bucket],5);
    addWave(3,295,24,5.4,[basic,basic,basic,cone,cone,cone,bucket,bucket,paper,runner,football]);
    // Real row-wide groups raise the final wave's pressure without changing HP.
    for(const item of plan)if(item.wave===3)item.at=295+Math.floor((item.at-295+1e-7)/5.4/5)*27;
    return plan.sort((a,b)=>a.at-b.at);
  }
  function fresh(){
    time=0;sun=GARDEN_RULES.initialSun;selected=null;hover=null;plants=[];mobs=[];shots=[];suns=[];effects=[];scheduledShots=[];
    mowers=Array.from({length:ROWS},(_,row)=>({row,status:'ready',x:-.35,previousX:-.35,kills:0,activations:0}));
    spawnIndex=0;kills=0;serial=0;skyCount=0;finished=false;wave=1;introPlayed=false;events.length=0;cooldowns.clear();
    wavePlan=endless?[]:buildPlan();waveTarget=endless?getEndlessWaveCount(1):wavePlan.length;totalSpawned=0;pendingGroup=0;groupSize=5;groupGap=4;nextGroupAt=30;
    nextSky=GARDEN_RULES.sun.firstSkyMin+rng()*(GARDEN_RULES.sun.firstSkyMax-GARDEN_RULES.sun.firstSkyMin);
    for(const id of SEED_ORDER)if(PLANT_BY_ID[id].initialRecharge)cooldowns.set(id,PLANT_BY_ID[id].initialRecharge);
    for(const button of sunButtons.values())button.remove();sunButtons.clear();accumulator=0;lastFrame=null;
  }
  function chooseSeed(id){
    if(phase!=='running')return false;
    const rule=PLANT_BY_ID[id];if(!rule)return false;
    if(time<(cooldowns.get(id)||0)){announce(rule.name+' is recharging.');return false;}
    if(sun<rule.cost){announce('Collect more sun for '+rule.name+'.');return false;}
    selected=selected===id?null:id;announce(selected?'Plant '+rule.name+' on a lawn square.':'Choose a seed, then a lawn square.');syncUI(true);return true;
  }
  function place(row,col){
    if(phase!=='running'||row<0||row>=ROWS||col<0||col>=COLS||!selected)return false;
    const old=plants.find(p=>p.row===row&&p.col===col&&p.hp>0);
    if(selected==='shovel'){
      if(!old)return false;old.hp=0;log('shovel',{plantId:old.id,row,col});selected=null;playSfx('plant');syncUI(true);return true;
    }
    const rule=PLANT_BY_ID[selected];if(sun<rule.cost||time<(cooldowns.get(selected)||0))return false;
    if(rule.upgradeFrom){if(!old||old.seedId!==rule.upgradeFrom){announce('Place '+PLANT_BY_ID[rule.upgradeFrom].name+' first.');return false;}}
    else if(old){announce('That square already has a plant.');return false;}
    if(old)old.hp=0;
    const plant=newPlant(selected,row,col);plants.push(plant);sun-=rule.cost;cooldowns.set(selected,time+rule.recharge);
    log('plant',{plantId:plant.id,seedId:selected,row,col,cost:rule.cost,sun});selected=null;playSfx('plant');
    announce(rule.name+' planted.');syncUI(true);return true;
  }
  function addSun(x,y,source='sky'){
    if(suns.length>=24)return;
    const item={id:'sun-'+(++serial),x,y:source==='sky'?-.3:y-.1,targetY:y,age:0,landed:source!=='sky',value:GARDEN_RULES.sunValue??25,source};
    suns.push(item);log('sunDrop',{sunId:item.id,source,value:item.value});syncSunButtons();
  }
  function collectSun(id){
    if(phase!=='running')return false;
    const index=suns.findIndex(item=>item.id===id);if(index<0)return false;
    const item=suns.splice(index,1)[0];sun+=item.value;sunButtons.get(id)?.remove();sunButtons.delete(id);
    log('sunCollect',{sunId:id,value:item.value,sun});playPickupChime();announce('+'+item.value+' sun');syncUI(true);return true;
  }
  function spawn(id,row,x=9.35){
    const rule=ZOMBIE_BY_ID[id]||CLASSIC_ZOMBIES[0],body=rule.bodyHp??rule.bodyHealth??270,armor=rule.armorHp??rule.armorHealth??0;
    const speed=rule.speedMin+rng()*(rule.speedMax-rule.speedMin),visualType=rule.visualType||rule.id,shield=rule.shieldHp||0;
    const mob={id:'zombie-'+(++serial),type:rule,visualType,rigIdentity:rule.rig||visualType,row,x,bodyHp:body,armorHp:armor,shieldHp:shield,maxBodyHp:body,maxArmorHp:armor,hp:body+armor+shield,maxHp:body+armor+shield,
      speed,bite:rule.biteDamage??rule.bite??50,biteInterval:rule.biteInterval??rule.biteCadence??.5,biteAt:time,slowUntil:0,stunUntil:0,hurt:0,dead:false,deathAt:0,attacking:false,pose:rng()*TAU,animationTime:time,enraged:false,
      vaulted:false,frenzyAt:0,headless:false,bleedAccumulator:0};
    mobs.push(mob);log('spawn',{zombieId:mob.id,type:rule.id,row,speed,hp:mob.hp});playSfx('growl');return mob;
  }
  function kill(mob,method){
    if(mob.counted)return;
    mob.dead=true;mob.hp=mob.bodyHp=mob.armorHp=mob.shieldHp=0;mob.deathAt=time;mob.counted=true;kills++;log('kill',{zombieId:mob.id,type:mob.type.id,row:mob.row,method});if(method!=='mower')playSfx('death');
  }
  function hit(mob,damage,options={}){
    const wasEnraged=mob.enraged,result=damageClassicZombie(mob,damage,options);
    if(result.damage>0){
      if(options.kind==='fire'&&options.clearCold!==false&&mob.slowUntil>time){mob.slowUntil=0;if(mob.biteAt>time)mob.biteAt=time+(mob.biteAt-time)*.5;}
      if(options.slow&&result.chillEligible){const newlyChilled=mob.slowUntil<=time;mob.slowUntil=Math.max(mob.slowUntil,time+(options.slowDuration||10));if(newlyChilled&&mob.biteAt>time)mob.biteAt=time+(mob.biteAt-time)*2;}
      if(options.stun){mob.stunUntil=Math.max(mob.stunUntil,time+options.stun);}
      if(!wasEnraged&&mob.enraged)mob.frenzyAt=time+(mob.type.frenzyWindup||0);
      log('hit',{zombieId:mob.id,damage:result.damage,armorHp:mob.armorHp,bodyHp:mob.bodyHp,slowUntil:mob.slowUntil,stunUntil:mob.stunUntil});playSfx(mob.armorHp>0?'armor':'hit');
      effects.push({kind:'hit',row:mob.row,x:mob.x,age:0,color:options.slow?'#b6eafb':options.stun?'#ffe283':'#d1e483'});
      if(result.killed)kill(mob,'projectile');
    }
    return result;
  }
  function impact(shot){
    const primary=mobs.find(m=>m.id===shot.targetId&&!m.dead);
    const point={x:primary?.x??shot.targetX,row:shot.row};
    if(primary)hit(primary,shot.damage,shot);
    if(shot.splashDamage){
      const targets=classicSplashTargets(mobs,point,primary?.id).filter(mob=>shot.kind!=='fire'||mob.row===point.row);
      const amount=getSplashDamage(shot.damage,targets.length,shot.kind==='fire');
      for(const mob of targets)hit(mob,amount,shot.kind==='fire'?{...shot,clearCold:false}:shot);
      if(['catapult','wintermelon'].includes(shot.kind))effects.push({kind:'melonImpact',row:point.row,x:point.x,age:0,impact:fx.createMelonImpact({x:point.x,y:0,row:point.row,kind:projectileKind(shot),seed:shot.id})});
      else effects.push({kind:'splash',row:point.row,x:point.x,age:0,color:'#f4bc58'});
    }
  }
  function launch(plant,row,target){
    const rule=plant.rule,isLob=['catapult','splash','wintermelon'].includes(plant.seedId);
    const butter=plant.seedId==='splash'&&rng()<(rule.stunChance??.25);
    const shot={id:'shot-'+(++serial),row,x:plant.x+.32,startX:plant.x+.32,targetX:target.x,targetId:target.id,age:0,duration:.9,damage:butter?(rule.butterDamage??40):rule.damage,
      splashDamage:rule.splashDamage||0,slow:rule.slow<1,slowDuration:rule.slowDuration||10,stun:butter?(rule.stunDuration??4):0,kind:butter?'butter':plant.seedId,lob:isLob,
      velocity:(rule.projectileSpeed||GARDEN_RULES.peaSpeed)/GARDEN_RULES.tileWidth,bypassesShield:rule.bypassesShield,hitsShieldAndBody:rule.hitsShieldAndBody};
    shots.push(shot);plant.recoil=.12;if(plant.seedId!=='gatling')playSfx('shot');log('shot',{plantId:plant.id,seedId:plant.seedId,row,damage:shot.damage,kind:shot.kind});
  }
  function targetFor(plant,row){
    return mobs.filter(m=>!m.dead&&m.row===row&&m.x>=plant.x-.15&&m.x<=9.55).sort((a,b)=>a.x-b.x)[0];
  }
  function explodePlant(plant){
    if(plant.hp<=0)return false;
    const rule=plant.rule,radius=rule.blastRadius/GARDEN_RULES.tileWidth;
    for(const mob of mobs)if(!mob.dead&&Math.abs(mob.row-plant.row)<=rule.rowRadius&&Math.abs(mob.x-plant.x)<=radius){
      const result=damageClassicZombie(mob,rule.explosionDamage,{bypassesShield:true});
      log('blastHit',{plantId:plant.id,seedId:plant.seedId,zombieId:mob.id,damage:result.damage});
      if(result.killed)kill(mob,plant.seedId==='potato'?'mine':'bomb');
    }
    plant.hp=0;log('plantExplode',{plantId:plant.id,seedId:plant.seedId,row:plant.row,x:plant.x});
    effects.push({kind:'blast',row:plant.row,x:plant.x,age:0,radius});
    return true;
  }
  function convertTorchwood(shot,before){
    if(shot.lob||!['pea','twin','burst','gatling','frost','snow'].includes(shot.kind))return;
    const torches=plants.filter(p=>p.hp>0&&p.seedId==='torchwood'&&p.row===shot.row&&p.x>=before-.12&&p.x<=shot.x+.12).sort((a,b)=>a.x-b.x);
    for(const torch of torches){
      if(shot.lastTorch===torch.id)continue;shot.lastTorch=torch.id;
      if(shot.slow){shot.slow=false;shot.slowDuration=0;shot.kind='pea';shot.damage=20;shot.splashDamage=0;}
      else{shot.kind='fire';shot.damage=torch.rule.fireDamage;shot.splashDamage=torch.rule.fireSplashDamage;shot.hitsShieldAndBody=true;}
      log('torchConvert',{shotId:shot.id,torchId:torch.id,kind:shot.kind,damage:shot.damage});
      if(shot.kind==='fire')break;
    }
  }
  function advanceEndlessWave(){
    wave++;waveTarget=getEndlessWaveCount(wave);spawnIndex=0;pendingGroup=0;
    groupSize=Math.min(25,5+Math.max(0,wave-2)*5);groupGap=Math.max(1.6,4-(wave-2)*.35);nextGroupAt=time+18;
    log('wave',{wave,target:waveTarget});announce('Wave '+wave+' · '+waveTarget.toLocaleString()+' zombies');
  }
  function spawnEndless(){
    let count=mobs.filter(m=>!m.dead).length;
    while(spawnIndex<waveTarget&&time+1e-8>=nextGroupAt){
      if(!pendingGroup)pendingGroup=Math.min(groupSize,waveTarget-spawnIndex);
      if(count>=MAX_LIVE_ZOMBIES)break;
      const pool=wave===1?['walker']:wave===2?['walker','walker','cone','cone','newspaper']:wave===3?['walker','cone','cone','bucket','newspaper','pole']:['cone','bucket','bucket','football','football','newspaper','pole'];
      spawn(pool[Math.floor(rng()*pool.length)],spawnIndex%ROWS,9.35+(spawnIndex%groupSize)*.025);
      spawnIndex++;totalSpawned++;count++;pendingGroup--;
      if(!pendingGroup)nextGroupAt+=groupGap;
    }
  }
  function fire(plant){
    const rule=plant.rule;if(!rule.damage||['mine','bomb','support'].includes(rule.role))return false;
    const rows=plant.seedId==='burst'?[plant.row-1,plant.row,plant.row+1].filter(row=>row>=0&&row<ROWS):[plant.row];
    if(!rows.some(row=>targetFor(plant,row)))return false;
    const count=plant.seedId==='burst'?1:(rule.count||1),gap=rule.burstGap??.12;
    for(const row of rows){const target=targetFor(plant,row);if(!target)continue;for(let i=0;i<count;i++)scheduledShots.push({at:time+(rule.shootingDelay||0)+(rule.burstOffsets?.[i]??i*gap),plantId:plant.id,row,targetId:target.id});}
    plant.nextAttack=time+(rule.intervalMin??rule.interval??1.43)+rng()*Math.max(0,(rule.intervalMax??rule.interval??1.43)-(rule.intervalMin??rule.interval??1.43));
    if(plant.seedId==='gatling')playGatlingRattle();
    return true;
  }
  function finish(outcome){
    if(finished||phase!=='running'||endless&&outcome==='won')return;
    finished=true;phase='result';selected=null;log('finish',{outcome,kills,spawns:spawnIndex});playSfx(outcome==='won'?'outro':'growl',true);
    title.textContent=outcome==='won'?'Garden protected':'The zombies got through';
    description.textContent=outcome==='won'?'All three waves defeated.':endless?'Survived to wave '+wave+'. Try a stronger defense.':'Build more sunflowers and protect your shooters with nuts.';
    begin.textContent='Play again';overlay.hidden=false;announce(outcome==='won'?'You won! The garden is safe.':'The zombies reached the house.');
    syncUI(true);onFinish?.({outcome,time,kills,waves:wave,endless,spawned:totalSpawned,totalZombies:endless?waveTarget:wavePlan.length});
  }
  function step(dt){
    if(phase!=='running')return;
    time+=dt;
    if(endless)spawnEndless();
    else while(spawnIndex<wavePlan.length&&time+1e-8>=wavePlan[spawnIndex].at){const item=wavePlan[spawnIndex++];wave=item.wave;spawn(item.type,item.row);totalSpawned++;}
    if(time>=nextSky){addSun(.5+rng()*8,.5+rng()*4);skyCount++;nextSky=time+(Math.min(GARDEN_RULES.sun.skyBaseMaxTicks,GARDEN_RULES.sun.skyBaseTicks+skyCount*GARDEN_RULES.sun.skyIncrementTicks)+rng()*GARDEN_RULES.sun.skyJitterTicks)/GARDEN_RULES.ticksPerSecond;}
    for(const plant of plants){
      if(plant.hp<=0)continue;plant.recoil=Math.max(0,plant.recoil-dt);
      if(plant.seedId==='potato'){
        plant.armed=time-plant.bornAt>=plant.rule.armDelay+plant.rule.riseDuration;
        if(plant.armed&&mobs.some(m=>!m.dead&&m.row===plant.row&&Math.abs(m.x-plant.x)<=.65))explodePlant(plant);
        continue;
      }
      if(plant.seedId==='cherrybomb'){if(time-plant.bornAt+1e-8>=plant.rule.fuse)explodePlant(plant);continue;}
      if(plant.seedId==='sunflower'&&time>=plant.nextSun){addSun(plant.x,plant.row+.40,'sunflower');plant.nextSun=time+(plant.rule.sunIntervalMin??23.5)+rng()*((plant.rule.sunIntervalMax??25)-(plant.rule.sunIntervalMin??23.5));}
      if(time>=plant.nextAttack)fire(plant);
    }
    for(let i=scheduledShots.length-1;i>=0;i--){
      const item=scheduledShots[i];if(time+1e-8<item.at)continue;scheduledShots.splice(i,1);
      const plant=plants.find(p=>p.id===item.plantId&&p.hp>0),target=mobs.find(m=>m.id===item.targetId&&!m.dead)||plant&&targetFor(plant,item.row);
      if(plant&&target)launch(plant,item.row,target);
    }
    for(const mower of mowers){mower.previousX=mower.x;if(mower.status==='sweeping')mower.x+=5.6*dt;}
    for(const mob of mobs){
      mob.hurt=Math.max(0,mob.hurt-dt);if(mob.dead)continue;
      mob.headless=mob.bodyHp<=mob.maxBodyHp*(mob.type.headLossRatio??GARDEN_RULES.zombie.headLossRatio);
      if(mob.headless){
        mob.bleedAccumulator+=dt;
        while(mob.bleedAccumulator+1e-8>=GARDEN_RULES.secondsPerTick){mob.bleedAccumulator-=GARDEN_RULES.secondsPerTick;if(rng()<GARDEN_RULES.zombie.headlessDecayChancePerTick){mob.bodyHp=Math.max(0,mob.bodyHp-(mob.maxBodyHp>=500?GARDEN_RULES.zombie.headlessLargeDecayDamage:GARDEN_RULES.zombie.headlessDecayDamage));mob.hp=mob.bodyHp+mob.armorHp+mob.shieldHp;}}
        if(mob.bodyHp<=0){kill(mob,'headless');continue;}
      }
      const oldX=mob.x,mower=mowers[mob.row],slow=mob.slowUntil>time?GARDEN_RULES.slowMove:1,stunned=mob.stunUntil>time||(mob.enraged&&time<mob.frenzyAt);
      mob.animationTime+=stunned?0:dt*slow;mob.attacking=false;
      const ahead=plants.filter(p=>p.hp>0&&p.row===mob.row&&p.x<=mob.x+.1).sort((a,b)=>b.x-a.x)[0];
      const contact=ahead?ahead.x+.48:-.2;
      if(!stunned){
        const speed=mob.enraged?(mob.type.frenzySpeed||mob.speed):mob.vaulted?(mob.type.afterVaultSpeed||mob.speed):mob.speed;
        if(mob.x>contact){mob.x=Math.max(contact,mob.x-speed/GARDEN_RULES.tileWidth*slow*dt);}
        if(ahead&&mob.x<=contact+1e-8){
          if(!mob.headless&&mob.type.vaults&&!mob.vaulted&&!ahead.rule.blocksVault){
            mob.x=ahead.x-.65;mob.vaulted=true;log('vault',{zombieId:mob.id,plantId:ahead.id});
          }else{
            mob.attacking=!mob.headless;
            if(!mob.headless&&time+1e-8>=mob.biteAt){ahead.hp=Math.max(0,ahead.hp-mob.bite);mob.biteAt=time+mob.biteInterval/slow;playSfx('bite');log('bite',{zombieId:mob.id,plantId:ahead.id,hp:ahead.hp,damage:mob.bite});}
          }
        }
      }
      if(mower.status==='ready'&&mob.x<=.02){mower.status='sweeping';mower.activations++;log('mowerActivate',{row:mob.row,zombieId:mob.id});}
      if(mower.status==='sweeping'){
        const previous=oldX-mower.previousX,current=mob.x-mower.x;
        if(Math.min(previous,current)<=.38&&Math.max(previous,current)>=-.38){kill(mob,'mower');mower.kills++;continue;}
      }
      if(mob.x<=-.15&&mower.status==='spent'){finish('lost');break;}
    }
    if(phase!=='running')return;
    for(const mower of mowers)if(mower.status==='sweeping'&&mower.x>9.8){mower.status='spent';log('mowerSpent',{row:mower.row,kills:mower.kills});}
    for(let i=shots.length-1;i>=0;i--){
      const shot=shots[i];shot.age+=dt;
      if(shot.lob){shot.x=shot.startX+(shot.targetX-shot.startX)*clamp(shot.age/shot.duration,0,1);if(shot.age>=shot.duration){impact(shot);shots.splice(i,1);}}
      else{
        const before=shot.x;shot.x+=shot.velocity*dt;
        convertTorchwood(shot,before);
        const target=mobs.filter(m=>!m.dead&&m.row===shot.row&&m.x>=before-.18&&m.x<=shot.x+.18).sort((a,b)=>a.x-b.x)[0];
        if(target){if(shot.kind==='fire')impact({...shot,targetId:target.id,targetX:target.x});else hit(target,shot.damage,shot);shots.splice(i,1);}else if(shot.x>10)shots.splice(i,1);
      }
    }
    for(let i=suns.length-1;i>=0;i--){const item=suns[i];if(!item.landed){item.y=Math.min(item.targetY,item.y+dt*.7);if(item.y>=item.targetY)item.landed=true;}else item.age+=dt;if(item.age>10){sunButtons.get(item.id)?.remove();sunButtons.delete(item.id);suns.splice(i,1);}}
    for(const effect of effects)effect.age+=dt;
    effects=effects.filter(e=>e.age<(e.kind==='melonImpact'?3:e.kind==='blast'?.8:.5)).slice(-360);mobs=mobs.filter(m=>!m.dead||time-m.deathAt<.65);plants=plants.filter(p=>p.hp>0);
    if(phase==='running'&&!mobs.some(m=>!m.dead)){
      if(endless&&spawnIndex===waveTarget)advanceEndlessWave();
      else if(!endless&&spawnIndex===wavePlan.length)finish('won');
    }
  }
  function makeButton(className,label){const button=document.createElement('button');button.className=className;button.type='button';button.setAttribute('aria-label',label);return button;}
  for(const id of SEED_ORDER){
    const rule=PLANT_BY_ID[id];if(!rule)continue;
    const button=makeButton('gc-seed',rule.name+', '+rule.cost+' sun'+(rule.upgradeFrom?', upgrade '+PLANT_BY_ID[rule.upgradeFrom].name:''));
    const label=document.createElement('span');label.className='gc-seed-name';label.textContent=rule.name;
    const icon=document.createElement('canvas');icon.width=60;icon.height=50;icon.setAttribute('aria-hidden','true');
    const cost=document.createElement('span');cost.className='gc-seed-cost';cost.textContent='☀ '+rule.cost;
    const recharge=document.createElement('span');recharge.className='gc-recharge';recharge.setAttribute('aria-hidden','true');
    button.appendChild(label);button.appendChild(icon);button.appendChild(cost);button.appendChild(recharge);tray.appendChild(button);
    seedButtons.set(id,{button,icon,recharge,rule});listen(button,'click',()=>chooseSeed(id));
  }
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
    const button=makeButton('gc-cell','Row '+(row+1)+', column '+(col+1)+', empty');button.dataset.row=String(row);button.dataset.col=String(col);
    grid.appendChild(button);cells.push(button);listen(button,'click',()=>place(row,col));
    listen(button,'pointerenter',()=>{hover={row,col};});listen(button,'pointerleave',()=>{hover=null;});
    listen(button,'focus',()=>{hover={row,col};});
    listen(button,'keydown',event=>{
      const delta={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[event.key];
      if(delta){event.preventDefault();cells[clamp(row+delta[0],0,ROWS-1)*COLS+clamp(col+delta[1],0,COLS-1)].focus();}
    });
  }
  listen(shovel,'click',()=>{if(phase!=='running')return;selected=selected==='shovel'?null:'shovel';announce(selected?'Choose a plant to remove.':'Choose a seed, then a lawn square.');syncUI(true);});
  listen(pauseButton,'click',()=>phase==='paused'?resume():pause());
  listen(begin,'click',()=>phase==='paused'?resume():start());
  listen(levelControl,'change',()=>{if(phase==='running'||phase==='paused')return;endless=levelControl.value==='endless';reset();});
  listen(root,'contextmenu',event=>{event.preventDefault();selected=null;syncUI(true);});
  listen(root,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();selected=null;syncUI(true);}});
  if(typeof document.addEventListener==='function')listen(document,'visibilitychange',()=>{if(document.hidden&&phase==='running')pause();});
  function syncSunButtons(){
    for(const item of suns){
      let button=sunButtons.get(item.id);
      if(!button){button=makeButton('gc-sun','Collect '+item.value+' sun');button.textContent='☀';sunLayer.appendChild(button);sunButtons.set(item.id,button);listen(button,'click',()=>collectSun(item.id));}
      button.style.left=(lawn.x+item.x*lawn.cw)+'px';button.style.top=(lawn.y+item.y*lawn.rh)+'px';button.disabled=phase!=='running';
      button.style.opacity=item.age>8?String(clamp((10-item.age)/2,.15,1)):'1';
    }
  }
  function syncUI(force=false){
    balance.textContent=String(sun);progress.value=spawnIndex/Math.max(1,endless?waveTarget:wavePlan.length);waveLabel.textContent=endless?'Wave '+wave+' · '+waveTarget.toLocaleString():'Wave '+wave+' / 3';
    levelControl.disabled=phase==='running'||phase==='paused';
    shovel.disabled=phase!=='running';shovel.setAttribute('aria-pressed',String(selected==='shovel'));pauseButton.disabled=phase==='idle'||phase==='result';pauseButton.textContent=phase==='paused'?'Resume':'Pause';
    grid.classList.toggle('is-placing',Boolean(selected));overlay.hidden=phase==='running';
    for(const [id,item] of seedButtons){
      const remaining=Math.max(0,(cooldowns.get(id)||0)-time);
      item.button.disabled=phase!=='running'||remaining>0||sun<item.rule.cost;
      item.button.classList.toggle('is-poor',sun<item.rule.cost);item.button.classList.toggle('is-selected',selected===id);item.button.setAttribute('aria-pressed',String(selected===id));
      item.recharge.style.height=(remaining/Math.max(.1,item.rule.recharge)*100)+'%';
    }
    for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
      const plant=plants.find(p=>p.row===row&&p.col===col&&p.hp>0),button=cells[row*COLS+col];button.disabled=phase!=='running';
      if(force||plant?.lastLabelHp!==Math.ceil(plant?.hp??0)){button.setAttribute('aria-label','Row '+(row+1)+', column '+(col+1)+', '+(plant?plant.rule.name+', '+Math.ceil(plant.hp)+' health':'empty'));if(plant)plant.lastLabelHp=Math.ceil(plant.hp);}
    }
    syncSunButtons();
  }
  function resize(){
    width=Math.max(280,stage.clientWidth||container.clientWidth||1000);height=Math.max(160,stage.clientHeight||container.clientHeight-125||500);
    const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    const left=clamp(width*.065,32,76),right=clamp(width*.065,22,75),top=clamp(height*.04,7,20),bottom=clamp(height*.06,12,30);
    lawn={x:left,y:top,w:width-left-right,h:height-top-bottom,cw:(width-left-right)/COLS,rh:(height-top-bottom)/ROWS};
    grid.style.left=lawn.x+'px';grid.style.top=lawn.y+'px';grid.style.width=lawn.w+'px';grid.style.height=lawn.h+'px';syncSunButtons();draw();
  }
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(stage);listen(window,'resize',resize);
  function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
  function roundRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);ctx.fill();}
  function fallbackPlant(id){
    if(id==='walnut'||id==='tallnut'){ellipse(0,-29,23,id==='tallnut'?45:29,'#b88c47');ellipse(-7,-35,2,3,'#fff');ellipse(7,-35,2,3,'#fff');return;}
    ctx.strokeStyle='#52793c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,-35);ctx.stroke();ellipse(-10,-8,17,7,'#719d3f');ellipse(12,-8,16,7,'#86a94e');
    ellipse(0,-44,24,22,id==='frost'?'#97ced3':id==='sunflower'?'#edc65d':'#7fbc52');ellipse(22,-43,13,13,'#537b33');ellipse(-7,-50,3,5,'#233c24');
  }
  function drawSeedIcons(){
    for(const [id,item] of seedButtons){const c=item.icon.getContext('2d');c.clearRect(0,0,60,50);c.save();c.translate(28,48);c.scale(.49,.49);if(!renderer.drawPlant(c,{weapon:id,time,hp:1,maxHp:1,seed:0,defender:{armed:true,fuseAge:.15}})){if(id==='sunflower'){c.fillStyle='#e4bc54';c.beginPath();c.arc(0,-45,23,0,TAU);c.fill();}else{c.fillStyle='#7eab49';c.beginPath();c.ellipse(0,-37,22,27,0,0,TAU);c.fill();}}c.restore();}
  }
  function drawMower(mower){
    if(mower.status==='spent')return;
    const x=lawn.x+mower.x*lawn.cw,y=lawn.y+(mower.row+.91)*lawn.rh,size=Math.min(lawn.cw*.58,lawn.rh*.58),manifest=mowerArt?.manifest;
    ctx.save();ctx.translate(x,y);ctx.scale(size/82.8,size/82.8);
    if(mowerArt?.ready){
      ctx.translate(-manifest.origin[0],-manifest.origin[1]);
      for(const track of manifest.tracks){const image=mowerArt.images.get(track.image);if(!image)continue;const ax=(track.kx||0)*Math.PI/180,ay=(track.ky||0)*Math.PI/180;ctx.save();ctx.transform(Math.cos(ax)*track.sx,Math.sin(ax)*track.sx,-Math.sin(ay)*track.sy,Math.cos(ay)*track.sy,track.x,track.y);if(mower.status==='sweeping'&&track.rotateWheel){const p=track.pivot||[image.naturalWidth/2,image.naturalHeight/2];ctx.translate(p[0],p[1]);ctx.rotate(time*26);ctx.translate(-p[0],-p[1]);}if(mower.status==='sweeping'&&track.shakeEngine)ctx.translate(Math.sin(time*71)*.4,0);ctx.drawImage(image,0,0);ctx.restore();}
    }else{ctx.strokeStyle='#849382';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-15);ctx.lineTo(-35,-55);ctx.lineTo(-13,-58);ctx.stroke();roundRect(-32,-24,64,20,5,'#ca4135');roundRect(-16,-39,30,18,5,'#4b534b');ellipse(-24,-7,10,10,'#202d27');ellipse(24,-7,10,10,'#202d27');}
    ctx.restore();
  }
  function draw(){
    if(!alive)return;
    ctx.clearRect(0,0,width,height);const bg=ctx.createLinearGradient(0,0,width,height);bg.addColorStop(0,'#527541');bg.addColorStop(1,'#354e31');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    roundRect(lawn.x-7,lawn.y-7,lawn.w+14,lawn.h+14,14,'#334b2b');
    for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
      const x=lawn.x+col*lawn.cw,y=lawn.y+row*lawn.rh;ctx.fillStyle=(row+col)%2?'#739746':'#7d9f4c';ctx.fillRect(x,y,lawn.cw,lawn.rh);
      ctx.strokeStyle='#527b3b22';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,lawn.cw-1,lawn.rh-1);
      for(let n=0;n<3;n++){const gx=x+(col*17+row*31+n*37)%Math.max(1,lawn.cw),gy=y+(col*29+row*13+n*23)%Math.max(1,lawn.rh);ctx.strokeStyle='#92ad5744';ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+3,gy-5);ctx.stroke();}
    }
    ctx.fillStyle='#213522';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText('HOUSE',lawn.x*.42,lawn.y+8);
    const plantScale=Math.min(lawn.cw*.9/90,lawn.rh*.86/80),zombieScale=Math.min(lawn.cw/90,lawn.rh*.98/105);
    for(const mower of mowers)drawMower(mower);
    for(let row=0;row<ROWS;row++){
      for(const plant of plants.filter(p=>p.row===row&&p.hp>0)){
        const x=lawn.x+plant.x*lawn.cw,y=lawn.y+(row+.92)*lawn.rh;ellipse(x,y-2,24*plantScale,6*plantScale,'#335b2a44');ctx.save();ctx.translate(x,y);ctx.scale(plantScale,plantScale);
        if(!renderer.drawPlant(ctx,{weapon:plant.seedId,simTime:time,hp:plant.hp,maxHp:plant.maxHp,recoil:plant.recoil,seed:plant.col+plant.row*3,defender:{damageStage:damageStage(plant.hp,plant.maxHp),armed:plant.armed,armingAge:time-plant.bornAt,armDelay:plant.rule.armDelay,riseDuration:plant.rule.riseDuration,fuseAge:time-plant.bornAt}}))fallbackPlant(plant.seedId);ctx.restore();
        if(plant.hp<plant.maxHp){roundRect(x-17*plantScale,y+2,34*plantScale,3,2,'#32492b77');roundRect(x-17*plantScale,y+2,34*plantScale*plant.hp/plant.maxHp,3,2,plant.hp>plant.maxHp*.4?'#daeb95':'#d6b35c');}
      }
      for(const mob of mobs.filter(m=>m.row===row)){
        const x=lawn.x+mob.x*lawn.cw,y=lawn.y+(row+.94)*lawn.rh;ctx.save();ctx.translate(x,y);ctx.scale(zombieScale,zombieScale);
        if(mob.dead){const age=clamp((time-mob.deathAt)/.65,0,1);ctx.globalAlpha=1-age;ctx.rotate(age*.85);ctx.translate(age*18,age*12);}
        if(mob.slowUntil>time)ctx.filter='hue-rotate(125deg) saturate(.8)';if(mob.hurt>0)ctx.globalAlpha*=.72;
        if(!renderer.drawZombie(ctx,{mob,simTime:mob.animationTime})){ctx.fillStyle='#687c45';ctx.fillRect(-16,-69,31,51);ellipse(0,-85,17,21,'#a6b17d');ctx.strokeStyle='#56654a';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-9,-18);ctx.lineTo(-9,0);ctx.moveTo(8,-18);ctx.lineTo(14,0);ctx.stroke();}
        ctx.filter='none';if(mob.stunUntil>time){roundRect(-13,-97,27,13,3,'#f8d577');ctx.fillStyle='#fff7c0';ctx.fillRect(-9,-94,5,3);}ctx.restore();
      }
    }
    for(const shot of shots){
      let x=lawn.x+shot.x*lawn.cw,y=lawn.y+(shot.row+.49)*lawn.rh;
      if(shot.lob)y-=Math.sin(clamp(shot.age/shot.duration,0,1)*Math.PI)*lawn.rh*1.18;
      const kind=projectileKind(shot),scale=Math.min(lawn.cw*.9/90,lawn.rh*.86/80);
      if(fx.drawProjectile(ctx,{kind,x,y,scale,time,progress:clamp(shot.age/shot.duration,0,1),rotation:shot.lob?shot.age*3:0})!==false)continue;
      if(shot.kind==='butter'){roundRect(x-5,y-4,10,8,2,'#ffe088');}
      else if(['catapult','wintermelon'].includes(shot.kind)){ellipse(x,y,10,8,shot.slow?'#89cbd5':'#629c43');ctx.strokeStyle='#cbe69a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-4,y-6);ctx.lineTo(x-4,y+6);ctx.moveTo(x+3,y-6);ctx.lineTo(x+3,y+6);ctx.stroke();}
      else if(shot.kind==='splash')ellipse(x,y,4,4,'#f6db83');
      else if(shot.kind==='pierce'){ctx.fillStyle='#49733b';ctx.beginPath();ctx.moveTo(x+7,y);ctx.lineTo(x-6,y-3);ctx.lineTo(x-6,y+3);ctx.closePath();ctx.fill();}
      else{ellipse(x,y,5,5,shot.slow?'#aee2e8':'#a8d657');ellipse(x-1,y-1,1.4,1.4,'#e9f7c4');}
    }
    for(const effect of effects){
      const x=lawn.x+effect.x*lawn.cw,y=lawn.y+(effect.row+.94)*lawn.rh;
      if(effect.kind==='melonImpact'){fx.drawImpact(ctx,effect.impact,{x,y,scale:plantScale,age:effect.age});continue;}
      ctx.save();ctx.globalAlpha=clamp(1-effect.age/(effect.kind==='blast'?.8:.5),0,1);
      if(effect.kind==='blast'){ellipse(x,y-lawn.rh*.28,(.1+effect.age)*effect.radius*lawn.cw,(.1+effect.age)*lawn.rh*.65,'#ffc364aa');}
      else for(let i=0;i<7;i++){const a=i*TAU/7;ellipse(x+Math.cos(a)*effect.age*60,y-lawn.rh*.4+Math.sin(a)*effect.age*30,2.5,2.5,effect.color);}
      ctx.restore();
    }
    if(selected&&selected!=='shovel'&&hover){ctx.save();ctx.globalAlpha=.38;ctx.translate(lawn.x+(hover.col+.5)*lawn.cw,lawn.y+(hover.row+.92)*lawn.rh);ctx.scale(plantScale,plantScale);if(!renderer.drawPlant(ctx,{weapon:selected,time,hp:1,maxHp:1}))fallbackPlant(selected);ctx.restore();}
    drawSeedIcons();
  }
  async function loadMower(){
    const ImageType=window.Image||globalThis.Image;if(typeof ImageType!=='function')return;
    try{
      mowerAbort=typeof AbortController==='function'?new AbortController():null;
      const manifest=artwork.gardenMowerManifest||(artwork.gardenMower?await(await fetch(artwork.gardenMower,mowerAbort?{signal:mowerAbort.signal}:undefined)).json():null);
      if(!alive||!manifest?.assets||!manifest?.tracks)return;
      const record={manifest,images:new Map(),ready:false};mowerArt=record;
      const names=[...new Set(manifest.tracks.map(t=>t.image))];
      await Promise.all(names.map(name=>new Promise(resolve=>{const image=new ImageType();record.images.set(name,image);image.onload=()=>{image.onload=image.onerror=null;resolve(true);};image.onerror=()=>{image.onload=image.onerror=null;resolve(false);};image.src=manifest.assets[name].url;}))).then(results=>{if(alive&&mowerArt===record)record.ready=results.every(Boolean);});
    }catch{}finally{mowerAbort=null;}
  }
  async function startAudio(){
    if(!soundEnabled||!alive||audio)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    try{
      const current=new Audio(),epoch=++audioEpoch;audio=current;audioAbort=typeof AbortController==='function'?new AbortController():null;
      const urls=[...new Set(Object.values(sounds).flat().filter(Boolean))];
      const loaded=Promise.allSettled(urls.filter(url=>!buffers.has(url)).map(async url=>{const response=await fetch(url,audioAbort?{signal:audioAbort.signal}:undefined);if(!response.ok)return;const bytes=await response.arrayBuffer();if(!alive||audio!==current||audioEpoch!==epoch)return;const buffer=await current.decodeAudioData(bytes);if(alive&&audio===current&&audioEpoch===epoch)buffers.set(url,buffer);}));
      await Promise.allSettled([loaded,current.resume()]);
      if(alive&&audio===current&&audioEpoch===epoch&&phase==='running'&&time<8&&!introPlayed)introPlayed=Boolean(playSfx('intro',true));
    }catch{stopAudio();}
  }
  function playSfx(key,force=false){
    if(key==='mower'||key==='pickup')return false;
    if(!soundEnabled||!audio||audio.state!=='running'||voices.size>=12)return false;
    const at=audio.currentTime;if(!force&&at-(lastSfx.get(key)??-Infinity)<(SOUND_GAP[key]||.15))return false;
    const raw=sounds[key],urls=(Array.isArray(raw)?raw:[raw]).filter(url=>buffers.has(url));if(!urls.length)return false;
    const index=rotations.get(key)||0,url=urls[index%urls.length],source=audio.createBufferSource(),gain=audio.createGain(),voice={source,gain};
    source.buffer=buffers.get(url);gain.gain.value=SOUND_GAIN[key]||.4;source.connect(gain);gain.connect(audio.destination);
    source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};voices.add(voice);source.start(at);lastSfx.set(key,at);rotations.set(key,index+1);return true;
  }
  function playTones(key,frequencies,gap,duration,gainValue,type='sine'){
    if(!soundEnabled||!audio||audio.state!=='running'||voices.size+frequencies.length>12)return false;
    const at=audio.currentTime;if(at-(lastSfx.get(key)??-Infinity)<.12)return false;lastSfx.set(key,at);
    for(let index=0;index<frequencies.length;index++){
      const start=at+index*gap,source=audio.createOscillator(),gain=audio.createGain(),voice={source,gain};
      source.type=type;source.frequency.setValueAtTime(frequencies[index],start);gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(gainValue,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      source.connect(gain);gain.connect(audio.destination);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};voices.add(voice);source.start(start);source.stop(start+duration+.01);
    }
    return true;
  }
  function playPickupChime(){return playTones('sunChime',[880,1174.66,1567.98],.065,.12,.10);}
  function playGatlingRattle(){return playTones('gatling',[190,210,185,200],.038,.028,.095,'triangle');}
  function stopAudio(){
    audioEpoch++;audioAbort?.abort();audioAbort=null;
    for(const voice of voices){voice.source.onended=null;try{voice.source.stop();voice.source.disconnect();voice.gain.disconnect();}catch{}}voices.clear();lastSfx.clear();
    if(audio){const old=audio;audio=null;try{old.close().catch(()=>{});}catch{}}
  }
  function setSound(enabled){soundEnabled=Boolean(enabled);if(soundEnabled&&phase==='running')startAudio();else if(!soundEnabled)stopAudio();}
  function setSpeed(value){const next=Number(value);if(Number.isFinite(next))simulationSpeed=clamp(next,1,100);return simulationSpeed;}
  function pause(){
    if(phase!=='running')return false;phase='paused';lastFrame=null;accumulator=0;stopAudio();
    title.textContent='Paused';description.textContent='Your garden will wait.';begin.textContent='Resume';announce('Game paused.');syncUI(true);return true;
  }
  function resume(){if(phase!=='paused')return false;phase='running';lastFrame=null;accumulator=0;announce('Protect the garden.');startAudio();syncUI(true);return true;}
  function start(){
    if(!alive)return false;if(phase==='paused')return resume();if(phase==='running')return false;
    stopAudio();fresh();phase='running';announce('Collect sun. Choose a seed, then a lawn square.');syncUI(true);startAudio();onStart?.();return true;
  }
  function reset(){
    if(!alive)return;stopAudio();fresh();phase='idle';title.textContent=endless?'Endless Survival':'Protect the garden';description.textContent=endless?'Build your defense. Each cleared wave brings a larger horde.':'Collect sunshine and build your defense. Survive three waves.';begin.textContent='Start game';
    announce('Collect sun. Choose a seed, then a lawn square.');syncUI(true);draw();
  }
  function frame(timestamp){
    frameId=null;if(!alive)return;
    if(phase==='running'){
      const elapsed=lastFrame===null?0:clamp((timestamp-lastFrame)/1000,0,.16);accumulator+=elapsed*simulationSpeed;
      while(accumulator+1e-8>=STEP&&phase==='running'){step(STEP);accumulator-=STEP;}
    }
    lastFrame=timestamp;syncUI();draw();frameId=requestAnimationFrame(frame);
  }
  function getState(){
    return {mode:'classic',phase,time,sun,selectedSeed:selected,wave,endless,speed:simulationSpeed,totalWaves:endless?null:3,spawned:spawnIndex,spawnedTotal:totalSpawned,totalZombies:endless?waveTarget:wavePlan.length,waveTarget,queued:endless?waveTarget-spawnIndex:wavePlan.length-spawnIndex,liveZombies:mobs.filter(m=>!m.dead).length,maxLiveZombies:MAX_LIVE_ZOMBIES,kills,soundEnabled,finished,
      grid:plants.filter(p=>p.hp>0).map(p=>({id:p.id,seedId:p.seedId,row:p.row,col:p.col,hp:p.hp,maxHp:p.maxHp,damageStage:damageStage(p.hp,p.maxHp),nextAttack:p.nextAttack,armed:p.armed,armingAge:time-p.bornAt})),
      suns:suns.map(s=>({id:s.id,value:s.value,x:s.x,y:s.y,source:s.source,landed:s.landed})),
      seeds:SEED_ORDER.filter(id=>PLANT_BY_ID[id]).map(id=>({id,name:PLANT_BY_ID[id].name,cost:PLANT_BY_ID[id].cost,recharge:PLANT_BY_ID[id].recharge,remaining:Math.max(0,(cooldowns.get(id)||0)-time),upgradeFrom:PLANT_BY_ID[id].upgradeFrom||null})),
      zombies:mobs.map(m=>({id:m.id,type:m.type.id,visualType:m.visualType,rigIdentity:m.rigIdentity,row:m.row,x:m.x,hp:m.hp,armorHp:m.armorHp,shieldHp:m.shieldHp,bodyHp:m.bodyHp,speed:m.speed,bite:m.bite,slowUntil:m.slowUntil,stunUntil:m.stunUntil,enraged:m.enraged,vaulted:m.vaulted,headless:m.headless,dead:m.dead})),
      mowers:mowers.map(m=>({...m})),combatLog:events.map(event=>({...event})),renderer:renderer.getState(),fx:fx.getState(),audio:{voices:voices.size,decoded:buffers.size,active:Boolean(audio)},layout:{...lawn,width,height}};
  }
  function destroy(){
    if(!alive)return;alive=false;if(frameId!==null)cancelAnimationFrame(frameId);frameId=null;observer?.disconnect();for(const remove of listeners)remove();listeners.length=0;renderer.destroy();fx.destroy();mowerAbort?.abort();stopAudio();buffers.clear();
    if(mowerArt)for(const image of mowerArt.images.values()){image.onload=image.onerror=null;try{image.src='';}catch{}}mowerArt=null;root.remove();
  }
  fresh();syncUI(true);resize();loadMower();frameId=requestAnimationFrame(frame);
  return { start, reset, destroy, setSound, setSpeed, getState, pause, resume };
}
