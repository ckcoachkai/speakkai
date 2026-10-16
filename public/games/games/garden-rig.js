/**
 * Original transparent parts and .reanim keyframes, rendered as independent
 * joints with their original draw order. No rectangular full-body slicing.
 * Parts/animation provenance and original blob hashes live in manifest.json.
 */
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, finite(v, lo)));
const TAU = Math.PI * 2, RAD = Math.PI / 180;
const PLANT_RIG = {pea:'pea',twin:'twin',burst:'burst',frost:'frost',fire:'twin',pierce:'cactus',catapult:'catapult',splash:'splash',laser:'gatling',thorn:'cactus',walnut:'walnut',tallnut:'tallnut',chestnut:'walnut',gatling:'gatling',sunflower:'sunflower',cactus:'cactus',wintermelon:'wintermelon',potato:'potato',potatomine:'potato',cherrybomb:'cherrybomb',cherry:'cherrybomb',torchwood:'torchwood'};

// Picker evolutions are connected parts of the plant, rather than floating
// badges. Classic never calls this custom-upgrade renderer.
export function drawGardenPlantUpgrade(ctx,{weapon='pea',defender={},time=0}={}) {
  const power=clamp(defender.power,0,10),tier=power>=9?4:power>=6?3:power>=3?2:power>0?1:0;
  if(!tier||defender.eaten)return;
  const id=typeof weapon==='string'?weapon:weapon.id,key=PLANT_RIG[id]||'pea';
  const ice=key==='frost'||key==='wintermelon',nut=key==='walnut'||key==='tallnut';
  const leaf=ice?'#82cfe0':'#64aa43',dark=ice?'#33798e':nut?'#79552f':'#346332';
  const edge=ice?'#ddfaff':nut?'#d7b780':'#b7d77a';
  const oval=(x,y,rx,ry,color,angle=0)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,TAU);ctx.fill();};
  const line=(points,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  if(nut) {
    // Upright shell plates get wider, heavier and ribbed. No spinning tracks.
    const top=key==='tallnut'?-66:-51;
    for(const side of[-1,1]) {
      ctx.fillStyle=tier<3?'#a87c46':'#8b663c';ctx.strokeStyle=dark;ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(side*17,top+8);ctx.lineTo(side*(24+tier*2),top+14);ctx.lineTo(side*(25+tier*2),-12);ctx.lineTo(side*15,-5);ctx.closePath();ctx.fill();ctx.stroke();
      if(tier>=2)line([[side*23,top+17],[side*24,-15]],edge,2.5);
    }
    if(tier>=3){line([[-22,-11],[22,-11]],'#705333',7);line([[-23,top+7],[23,top+7]],edge,5);}
    if(tier===4)for(const side of[-1,1])for(let n=0;n<3;n++) {
      ctx.fillStyle='#e6cf9b';ctx.beginPath();ctx.moveTo(side*27,top+17+n*12);ctx.lineTo(side*37,top+12+n*12);ctx.lineTo(side*29,top+24+n*12);ctx.fill();
    }
  } else if(key==='catapult'||key==='wintermelon'||key==='splash') {
    // A substantial wicker cradle and braced throwing arm develop together.
    oval(0,-7,25+tier*2,8,dark);oval(0,-9,22+tier*2,6,leaf);
    line([[-24,-9],[-18,-28],[12,-28],[24,-9]],dark,4+tier);
    if(tier>=2)for(let n=-18;n<=18;n+=9)line([[n,-24],[n+4,-10]],edge,2.5);
    if(tier>=3){line([[-17,-11],[12,-43],[19,-50]],dark,5);line([[-14,-12],[13,-40]],edge,2);}
    if(tier===4){oval(-25,-10,9,13,leaf,-.5);oval(26,-10,9,13,leaf,.5);line([[-20,-6],[20,-6]],edge,3);}
  } else if(key==='cactus') {
    // Successive real cactus arms enlarge the silhouette without fake icons.
    for(const side of[-1,1]) {
      line([[side*12,-13],[side*(22+tier*2),-20],[side*(22+tier*2),-29-tier*5]],dark,10);
      line([[side*12,-14],[side*(22+tier*2),-21],[side*(22+tier*2),-29-tier*5]],leaf,6);
      for(let n=0;n<tier;n++)line([[side*(24+tier*2),-25-n*6],[side*(31+tier*2),-28-n*6]],edge,2);
    }
    if(tier>=3)oval(0,-6,17,7,'#a5bf62');
  } else if(['pea','twin','burst','frost','gatling'].includes(key)) {
    // Broad roots and a thick connected stem are visible even on compact rows.
    for(const side of[-1,1])oval(side*(16+tier),-5,15+tier*2,6+tier*.8,leaf,side*.32);
    line([[0,-8],[0,-26]],dark,6+tier);line([[-2,-9],[-2,-25]],leaf,3+tier*.5);
    const heads=key==='burst'?[[-1,-56],[10,-38],[-1,-22]]:key==='twin'?[[0,-46]]:[[0,key==='gatling'?-42:-46]];
    for(const [hx,hy]of heads) {
      // Reinforce the existing snout, retaining the original number of guns.
      line([[hx+16,hy+5],[hx+34+tier,hy+5]],dark,8+tier*1.5);
      line([[hx+18,hy+2],[hx+34+tier,hy+2]],ice?'#b6edfa':'#8eb75c',4+tier*.7);
      if(tier>=2)for(const x of[hx+19,hx+30])line([[x,hy-2],[x,hy+11]],edge,3);
      if(tier>=3) {
        oval(hx-19,hy+12,9,13,leaf,-.65);
        line([[hx-18,hy+13],[hx-5,hy+20]],dark,4);
      }
      if(tier===4) {
        if(ice)for(let i=0;i<4;i++) {
          const x=hx-16+i*9;ctx.fillStyle=i%2?'#a3e5f7':'#e2fcff';ctx.beginPath();ctx.moveTo(x-4,hy-15);ctx.lineTo(x,hy-25-(i%2)*6);ctx.lineTo(x+5,hy-14);ctx.fill();
        } else {
          // Leaf armor wraps the cheek; the eye stays uncovered.
          line([[hx-22,hy+2],[hx-25,hy+14],[hx-8,hy+22],[hx+12,hy+16]],'#416d35',6);
          line([[hx-24,hy+14],[hx-7,hy+20],[hx+10,hy+15]],edge,2);
        }
      }
    }
    if(key==='gatling'&&tier>=2){oval(-19,-24,10+tier,13,'#516348');line([[-27,-26],[-12,-26]],'#b8cd85',3);}
  }
  // A shield is real fitted armor, large enough to read without a HUD symbol.
  if(defender.shield>0&&!nut){line([[-18,-10],[-21,-24],[-10,-29]],'#c7eaff',5);line([[-17,-11],[-19,-22],[-10,-26]],'#4c8592',2);}
  ctx.restore();
}

export function createGardenRenderer({artwork = {}} = {}) {
  let manifest = null, closed = false, loading = true, error = null, extraError = null, extraLoaded = false;
  const images = new Map(), failed = new Set(), ready = new Set(), required = new Map(), pending = new Set();
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const manifestURL = artwork.gardenRig || 'assets/garden-rig/manifest.json';
  const extraURL = artwork.gardenExtra || 'assets/garden-extra.json';
  const embedded = artwork.gardenRigImages || {};
  const base = typeof document !== 'undefined' ? document.baseURI : 'http://localhost/';
  let drawnPlants = 0, drawnZombies = 0;

  function imageURL(name) {
    if (embedded[name]) return embedded[name];
    const asset = manifest.assets[name];
    return new URL(asset.url || name, new URL(manifestURL, base)).href;
  }
  function loadImage(name) {
    return new Promise(resolve => {
      if (closed || typeof Image !== 'function') {resolve(); return;}
      const finish = () => {pending.delete(finish); resolve();};
      pending.add(finish);
      const img = new Image();
      images.set(name, img);
      img.onload = () => {
        img.onload = img.onerror = null;
        if (!closed && img.naturalWidth > 0 && img.naturalHeight > 0) ready.add(name);
        else if (!closed) failed.add(name);
        finish();
      };
      img.onerror = () => {img.onload = img.onerror = null; if (!closed) failed.add(name); finish();};
      try {img.src = imageURL(name);} catch {img.onerror();}
    });
  }
  async function load() {
    try {
      if (typeof Image !== 'function') {loading = false; return;}
      const initial = artwork.gardenRigManifest || await (await fetch(manifestURL, controller ? {signal:controller.signal} : {})).json();
      manifest = {...initial,assets:{...initial.assets},rigs:{...initial.rigs}};
      if (closed) return;
      if (manifest.version !== 1 || !manifest.assets || !manifest.rigs) throw new Error('Invalid Garden rig manifest');
      for (const [key,rig] of Object.entries(manifest.rigs)) {
        const set = new Set();
        for (const tracks of Object.values(rig.clips)) for (const track of tracks) for (const f of track.frames) if (f[8] && f[6] >= 0 && f[7] > 0) set.add(f[8]);
        required.set(key,set);
      }
      const queue = Object.keys(manifest.assets);
      let index = 0;
      await Promise.all(Array.from({length:Math.min(10,queue.length)}, async () => {
        while (!closed && index < queue.length) await loadImage(queue[index++]);
      }));
      if (closed) return;
      // The optional extra pack never rewrites the original base manifest.
      // Failure leaves all existing rigs usable and reports a separate error.
      try {
        const extra = artwork.gardenExtraManifest || await (await fetch(extraURL, controller ? {signal:controller.signal} : {})).json();
        if (closed) return;
        if(!artwork.gardenExtraManifest&&extra.assetPacks?.length){const packs=await Promise.all(extra.assetPacks.map(async file=>(await fetch(new URL(file,new URL(extraURL,base)),controller?{signal:controller.signal}:{})).json()));extra.assets=Object.assign({},extra.assets,...packs.map(pack=>pack.assets));}
        if (extra.version !== 1 || !extra.assets || !extra.rigs) throw new Error('Invalid Garden extra manifest');
        Object.assign(manifest.rigs,extra.rigs);
        for(const [name,asset]of Object.entries(extra.assets)) if(!manifest.assets[name]) {
          manifest.assets[name]={...asset,url:new URL(asset.url||name,new URL(extraURL,base)).href};
        }
        for(const [key,rig]of Object.entries(extra.rigs)) {
          const set=new Set();
          for(const tracks of Object.values(rig.clips)) for(const track of tracks) for(const f of track.frames) if(f[8]&&f[6]>=0&&f[7]>0)set.add(f[8]);
          required.set(key,set);
        }
        const newParts=Object.keys(extra.assets).filter(name=>!images.has(name));let next=0;
        await Promise.all(Array.from({length:Math.min(8,newParts.length)},async()=>{while(!closed&&next<newParts.length)await loadImage(newParts[next++]);}));
        extraLoaded=true;
      } catch(e) {if(!closed)extraError=String(e.message||e);}
    } catch (e) {if (!closed) error = String(e.message || e);}
    finally {loading = false;}
  }
  load();

  function available(key) {
    if (closed || !manifest?.rigs[key]) return false;
    const set = required.get(key);
    return set && [...set].every(name => ready.has(name));
  }
  function sampled(track, t) {
    const frames = track.frames;
    if (!frames.length) return null;
    const f = ((finite(t) % frames.length) + frames.length) % frames.length;
    const i = Math.floor(f), a = frames[i], b = frames[(i+1)%frames.length], mix = f-i;
    if (a[6] < 0 || a[7] <= 0 || !a[8]) return null;
    const out = a.slice();
    if (b[6] >= 0 && b[8] === a[8]) for (let j=0;j<6;j++) {
      let next = b[j];
      if (j === 2 || j === 3) {while (next-a[j] > 180) next -= 360; while (next-a[j] < -180) next += 360;}
      out[j] = a[j] + (next-a[j])*mix;
    }
    if (b[6] >= 0) out[7] = a[7] + (b[7]-a[7])*mix;
    return out;
  }
  function armorImage(name, mob) {
    const ratio = finite(mob.armorHp,1)/Math.max(1,finite(mob.maxArmorHp,finite(mob.type?.armorHealth,1)));
    const stage = ratio > .66 ? 1 : ratio > .33 ? 2 : 3;
    // Cracked hats retain the same body family. Football upperbody2/3 are
    // shoulder-pad OVERLAYS, not replacement torsos; their separate tracks
    // must always keep the complete original jersey underneath.
    const candidate = name.replace(/(cone|bucket|helmet)1?(\.png)$/i, '$1'+stage+'$2');
    return ready.has(candidate) ? candidate : name;
  }
  function visibleZombie(track, mob, key) {
    const name = track.name.toLowerCase();
    if(mob.headless&&/head|hair|helmet|cone|bucket|glasses/.test(name))return false;
    if(key==='newspaper'&&name==='zombie_paper_paper'&&mob.enraged)return false;
    const visual = String(mob.visualType || '').toLowerCase();
    const armor = finite(mob.type?.armor);
    const hasArmor = finite(mob.armorHp,finite(mob.type?.armorHealth,1)) > 0;
    if (name === 'anim_cone') return hasArmor && (visual.includes('cone') || armor === 1);
    if (name === 'anim_bucket') return hasArmor && (visual.includes('bucket') || armor === 2);
    if (name.includes('helmet')) return hasArmor;
    if (name === 'anim_hair' && key === 'walker') return !(hasArmor && (armor===1||armor===2||/cone|bucket/.test(visual)));
    return true;
  }
  function drawTracks(ctx, key, clipName, frame, opts={}) {
    const rig = manifest.rigs[key];
    const tracks = rig.clips[clipName] || Object.values(rig.clips)[0];
    ctx.save();
    ctx.scale(rig.scale,rig.scale);
    ctx.translate(-rig.origin[0],-rig.origin[1]);
    const opacity = ctx.globalAlpha;
    for (const tr of tracks) {
      if (opts.mob && !visibleZombie(tr,opts.mob,key)) continue;
      const f = sampled(tr,frame);
      if (!f) continue;
      let name = f[8];
      if (opts.mob) name = armorImage(name,opts.mob);
      if (key === 'walnut' || key === 'tallnut') {
        const n = opts.stage >= 3 ? 2 : opts.stage >= 1 ? 1 : 0;
        if (n && /_body\.png$/i.test(name)) {const p=name.replace(/_body\.png$/i,'_cracked'+n+'.png'); if (ready.has(p)) name=p;}
      }
      const img = images.get(name);
      if (!img || !ready.has(name)) continue;
      const x=f[0],y=f[1],rx=f[2]*RAD,ry=f[3]*RAD,sx=f[4],sy=f[5];
      ctx.save();
      ctx.globalAlpha = opacity*clamp(f[7],0,1);
      ctx.transform(Math.cos(rx)*sx,Math.sin(rx)*sx,-Math.sin(ry)*sy,Math.cos(ry)*sy,x,y);
      // Low health droops a leaf at its pivot instead of masking away the body.
      if (opts.stage >= 2 && /leaf.*tip|husktip/i.test(tr.name)) ctx.rotate((opts.stage-1)*.075);
      ctx.drawImage(img,0,0);
      ctx.restore();
    }
    ctx.restore();
  }
  function botanicalDamage(ctx,rig,stage,seed) {
    if (!stage) return;
    const [x,y] = rig.faceCenter || [0,-42];
    ctx.save();
    ctx.strokeStyle = stage<3 ? '#556c27' : '#75412d';
    ctx.lineWidth = .95 + stage*.25;
    ctx.lineCap = 'round';
    for (let i=0;i<stage;i++) {
      const xx=x-14+(i*13+finite(seed)*.17)%26,yy=y-8+i*6;
      ctx.beginPath();ctx.moveTo(xx-3,yy-2);ctx.lineTo(xx,yy+3);ctx.lineTo(xx+4,yy-1);ctx.stroke();
    }
    if (stage>=2) {
      ctx.fillStyle = '#aa3e36';
      for(let i=0;i<stage-1;i++) {ctx.beginPath();ctx.ellipse(x+8-i*7,y+9+i*3,1.4+stage*.1,2.2+stage*.5,.3,0,TAU);ctx.fill();}
    }
    if(stage===4) {ctx.fillStyle='#d55842';ctx.beginPath();ctx.ellipse(x+2,-3,5,1.8,0,0,TAU);ctx.fill();}
    ctx.restore();
  }
  function drawPlant(ctx,{weapon='pea',time=0,simTime=time,hp=1,maxHp=1,recoil=0,seed=0,defender={}}={}) {
    const weaponId=typeof weapon==='string'?weapon:weapon.id;
    const key=PLANT_RIG[weaponId] || 'pea';
    if (!available(key)) return false;
    const rig=manifest.rigs[key],t=finite(simTime,finite(time)),ratio=clamp(hp/Math.max(1,finite(maxHp,1)),0,1);
    const stage=Number.isInteger(defender.damageStage)?clamp(defender.damageStage,0,4):ratio>.8?0:ratio>.6?1:ratio>.4?2:ratio>.2?3:4;
    const attack=clamp(recoil,0,.16),shooting=attack>0&&rig.clips.shoot;
    let clip=shooting?'shoot':'idle';
    const armDelay=finite(defender.armDelay,finite(rig.armDelay,15));
    const riseDuration=Math.max(.001,finite(defender.riseDuration,finite(rig.riseDuration,19/18)));
    const armingAge=defender.armingAge==null?clamp(defender.armProgress,0,1)*(armDelay+riseDuration):finite(defender.armingAge);
    if(key==='potato') {
      clip=defender.armed?'armed':armingAge>=armDelay?'rise':'unarmed';
      if(defender.exploding)clip='mashed';
    }
    if(key==='cherrybomb'&&defender.exploding)return true;
    const frames=Math.max(...rig.clips[clip].map(track=>track.frames.length),1);
    let frame=shooting?(1-clamp(attack/.12,0,1))*(frames-1):t*finite(rig.fps,12)+finite(seed)*1.137;
    // Wallnut's original anim_face track makes a complete360° roll. A planted
    // blocker holds the upright first frame, as does Tall-nut and Chestnut.
    if(key==='walnut'||key==='tallnut')frame=0;
    if(key==='potato'&&clip==='rise') {
      frame=clamp((armingAge-armDelay)/riseDuration,0,1)*(frames-1);
    }
    if(key==='potato'&&(clip==='unarmed'||clip==='mashed'))frame=0;
    if(key==='cherrybomb')frame=clamp(finite(defender.fuseAge)/Math.max(.001,finite(defender.fuseDuration,1)),0,1)*(frames-1);
    ctx.save();
    if (weaponId==='chestnut') ctx.filter='sepia(.28) saturate(1.2)';
    drawTracks(ctx,key,clip,frame,{stage});
    ctx.filter='none';
    if(key!=='potato'&&key!=='cherrybomb')botanicalDamage(ctx,rig,stage,seed);
    if(weaponId==='chestnut') {
      ctx.strokeStyle='#59401e';ctx.lineWidth=2.8;ctx.lineCap='round';
      for(let i=0;i<9;i++){const a=Math.PI+(i/8)*Math.PI;const x=Math.cos(a)*27,y=-35+Math.sin(a)*30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7);ctx.stroke();}
    }
    ctx.restore();
    drawnPlants++;
    return true;
  }
  function zombieKey(mob) {
    // Losing armor changes an overlay only, keeping the same original body.
    const visual=String(mob.visualType || '').toLowerCase();
    if(visual.includes('football')||finite(mob.type?.armor)===3)return 'football';
    if(visual.includes('newspaper')||visual.includes('paper'))return 'newspaper';
    if(visual.includes('runner')||visual.includes('pole'))return 'runner';
    return 'walker';
  }
  function drawZombie(ctx,{mob={},time=0,simTime=time}={}) {
    const key=zombieKey(mob);
    if(!available(key))return false;
    const rig=manifest.rigs[key],t=finite(simTime,finite(time));
    const clip=mob.attacking?'eat':'walk';
    const rate=mob.attacking?18:12*clamp(finite(mob.speed,.036)/Math.max(.001,finite(mob.type?.speed,.036)),.7,1.7);
    const frames=rig.clips[clip][0].frames.length;
    // Original knee, foot, forearm, jaw and head keyframes provide the drag gait.
    const frame=t*rate+finite(mob.pose)*frames/TAU;
    drawTracks(ctx,key,clip,frame,{mob});
    drawnZombies++;
    return true;
  }
  function destroy() {
    if(closed)return;
    closed=true;controller?.abort();
    for(const img of images.values()){img.onload=img.onerror=null;try{img.src='';}catch{}}
    for(const finish of pending)finish();
    images.clear();ready.clear();failed.clear();required.clear();manifest=null;
  }
  return {drawPlant,drawZombie,destroy,getState(){return {ready:!closed&&!!manifest&&!loading&&failed.size===0,loading:!closed&&loading,closed,parts:ready.size,totalParts:manifest?Object.keys(manifest.assets).length:0,failed:[...failed],error,extraError,extraLoaded,rigs:manifest?Object.keys(manifest.rigs).filter(available):[],drawnPlants,drawnZombies};}};
}
