/** Grand Prix — optional 4×3 transparent race atlas, with an error fallback.
 * Identical cars, uniformly shuffled names on the grid, actual first finisher.
 * Fixed-step, accelerated physics: drag, grip, steering, crashes and recovery.
 * This is an arcade car simulation rather than an engineering vehicle model.
 */
export default function createGame({ container, names = [], onPick, random = Math.random, artwork = {} }) {
  const C = { navy:'#101b33', cream:'#fff4df', gold:'#f8c75a', teal:'#7bd8c9', coral:'#ff735e' };
  const rand = () => Math.max(0, Math.min(.999999999999, Number(random()) || 0));
  const clip = (n,a,b) => Math.max(a,Math.min(b,n));
  const players = names.slice(0,60).map((p,i) => ({...p,name:String(p.name ?? ''),color:p.color || [C.teal,C.gold,C.coral,'#b0b8ef'][i%4]}));
  const root = document.createElement('div'); root.className='grand-prix';
  root.innerHTML=`<style>
    .grand-prix{width:100%;height:100%;position:relative;overflow:hidden;background:#101b33;color:#fff4df;font-family:inherit}
    .grand-prix canvas{display:block;width:100%;height:100%}
    .grand-prix .race-timing{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);width:230px;max-width:65%;border:1px solid #fff4df12;background:#101b3390;border-radius:10px;z-index:2;backdrop-filter:blur(8px)}
    .grand-prix .race-timing summary{cursor:pointer;list-style:none;display:flex;gap:12px;align-items:center;padding:8px 11px;font-size:12px;min-height:34px}
    .grand-prix .race-timing summary::-webkit-details-marker{display:none}
    .grand-prix .race-timing summary:focus-visible{outline:2px solid #7bd8c9;outline-offset:3px}
    .grand-prix .race-timing summary:after{content:'⌄';margin-left:auto;color:#7bd8c9;font-size:17px}
    .grand-prix .race-timing[open] summary:after{content:'⌃'}
    .grand-prix .race-timing summary>span{color:#9eb1c5;white-space:nowrap;font-size:11px;font-variant-numeric:tabular-nums}
    .grand-prix .race-leader{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
    .grand-prix .race-roster{padding:0 12px 8px;margin:0;list-style:none;max-height:min(230px,28vh);overflow:auto;scrollbar-width:thin;scrollbar-color:#7bd8c94a transparent}
    .grand-prix .race-row{display:flex;align-items:center;gap:9px;min-height:33px;border-top:1px solid #fff4df0b;font-size:13px}
    .grand-prix .race-rank{width:18px;flex:none;color:#8095ab;font-size:11px;font-variant-numeric:tabular-nums}
    .grand-prix .race-number{width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:6px;color:#101b33;font-size:10px;font-weight:800}
    .grand-prix .race-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .grand-prix .race-row.champion{color:#f8c75a}
    .grand-prix .race-event{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;pointer-events:none}
    .grand-prix.race-compact .race-timing{width:190px}
    .grand-prix.race-compact .race-timing summary{padding:7px 9px;gap:8px;min-height:32px}
    .grand-prix.race-compact .race-timing summary>span{font-size:10px}
    .grand-prix.race-compact .race-leader{font-size:11px}
  </style><canvas role="img" aria-label="Grand Prix. Cars collide, tumble and recover. Oil causes spinouts, cones slow cars, and gas cans give boosts. First finisher chooses the speaker."></canvas><details class="race-timing"><summary aria-label="Open the race timer and named car positions"><span class="race-clock">0.0s</span><strong class="race-leader"></strong></summary><ol class="race-roster" aria-label="Every named car and its live position"></ol></details><div class="race-event" aria-live="off"></div>`;
  container.appendChild(root);
  const canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d'), roster=root.querySelector('.race-roster');
  const leaderText=root.querySelector('.race-leader'), timing=root.querySelector('.race-timing'), eventText=root.querySelector('.race-event');
  const clockText=root.querySelector('.race-clock');
  const rows=players.map((p,i)=>{
    const row=document.createElement('li');row.className='race-row';row.title=p.name;
    const rank=document.createElement('span');rank.className='race-rank';rank.textContent=i+1;
    const number=document.createElement('span');number.className='race-number';number.style.backgroundColor=p.color;number.textContent=i+1;
    const label=document.createElement('span');label.className='race-name';label.textContent=p.name;
    row.append(rank,number,label);roster.appendChild(row);return{row,rank};
  });
  const STEP=1/120, RATE=10, COUNTDOWN=1.1, TAU=Math.PI*2;
  const track={left:260,right:780,radius:150,cy:360}, straight=520, lapLength=1040+TAU*150, finishDistance=lapLength*2;
  const ROAD_HALF=55, EDGE=ROAD_HALF-6;
  const SPECS=Object.freeze({engine:11.4,topSpeed:58,grip:11.8,drag:.00125,rolling:.28,braking:13});
  let alive=true,raf=0,previous=null,accumulator=0,elapsed=0,mode='idle',picked=false,winner=-1,finishElapsed=0;
  let cars=[],order=[],hazards=[],particles=[],smoke=[],skidMarks=[];
  let width=1000,height=700,sx=1,sy=1,xShift=0,yShift=0,small=false,lastBoard=-1,hover=-1,eventUntil=0;
  let atlas=null,atlasState=artwork.race?'loading':'error',cellWidth=0,cellHeight=0;
  let stats={collisions:0,oil:0,cones:0,gas:0,recoveries:0};
  const gap=(a,b)=>((a-b+lapLength*1.5)%lapLength)-lapLength/2;
  function trackPoint(distance,offset=0){
    let s=((distance+straight/2)%lapLength+lapLength)%lapLength;const r=track.radius+offset;
    if(s<=straight)return{x:track.left+s,y:track.cy+r,angle:0,curvature:0};s-=straight;
    if(s<Math.PI*track.radius){const a=Math.PI/2-s/track.radius;return{x:track.right+Math.cos(a)*r,y:track.cy+Math.sin(a)*r,angle:a-Math.PI/2,curvature:1/track.radius};}
    s-=Math.PI*track.radius;if(s<=straight)return{x:track.right-s,y:track.cy-r,angle:-Math.PI,curvature:0};s-=straight;
    const a=-Math.PI/2-s/track.radius;return{x:track.left+Math.cos(a)*r,y:track.cy+Math.sin(a)*r,angle:a-Math.PI/2,curvature:1/track.radius};
  }
  function mapped(p){return{x:p.x*sx+xShift,y:p.y*sy+yShift,angle:Math.atan2(Math.sin(p.angle)*sy,Math.cos(p.angle)*sx)};}
  function text(value,x,y,size=14,color=C.cream,weight=600,align='left',max=Infinity){
    ctx.font=`${weight} ${size}px system-ui, "Segoe UI", sans-serif`;ctx.fillStyle=color;ctx.textBaseline='middle';ctx.textAlign=align;
    let label=String(value);if(Number.isFinite(max)&&ctx.measureText(label).width>max){const chars=Array.from(label);while(chars.length&&ctx.measureText(chars.join('')+'…').width>max)chars.pop();label=chars.join('')+'…';}ctx.fillText(label,x,y);
  }
  function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fillStyle=fill;ctx.fill();}
  function outline(offset=0){const r=track.radius+offset;ctx.beginPath();ctx.moveTo(track.left,track.cy+r);ctx.lineTo(track.right,track.cy+r);ctx.arc(track.right,track.cy,r,Math.PI/2,-Math.PI/2,true);ctx.lineTo(track.left,track.cy-r);ctx.arc(track.left,track.cy,r,-Math.PI/2,-Math.PI*1.5,true);ctx.closePath();}
  function grid(fresh=false){
    const indices=players.map((_,i)=>i);if(fresh)for(let i=indices.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
    // Three broad lanes and long staggered rows avoid a dense pile at the stripe.
    // A uniform shuffle gives every name the same chance of every grid position.
    const cols=Math.min(3,Math.max(1,players.length)),spacing=players.length>24?64:90;
    cars=indices.map((index,slot)=>{const lane=(slot%cols-(cols-1)/2)*36;return{player:players[index],index,slot,distance:-Math.floor(slot/cols)*spacing-(slot%cols)*14,velocity:0,offset:lane,lane,lateralVelocity:0,phase:fresh?rand()*TAU:slot,laneTimer:fresh?.5+rand()*1.5:1,spin:0,spinAngle:0,spinVelocity:0,tumble:0,recovering:0,collisionCooldown:0,boost:0,slow:0,oilCooldown:0,smokeTimer:0,skidTimer:0,brake:0,crashCount:0,tieKey:fresh?rand():slot/60,previousDistance:0};});order=cars.map((_,i)=>i);
  }
  function scatter(fresh=true){
    hazards=[];const add=(type,distance,offset)=>hazards.push({type,distance,offset,active:true,rotation:fresh?rand()*.6-.3:0,vx:0,vy:0,loose:false,life:10});
    // Starter pickups ensure that solo rounds also feature recognisable hazards.
    add('gas',115,0);add('cone',325,0);add('oil',505,0);
    const clusters=players.length>24?6:4;
    for(let i=0;i<clusters;i++){const d=220+(i+(fresh?rand()*.6:.3))*(lapLength-380)/clusters,o=fresh?(rand()-.5)*88:(i%3-1)*36;add('oil',d,o);add('cone',d+82,clip(o+23,-EDGE+4,EDGE-4));add('gas',d+166,fresh?(rand()-.5)*88:-o);}
  }
  function event(message){eventText.textContent=message;eventUntil=elapsed+1.5;eventText.classList.add('visible');}
  function burst(car,color=C.gold,count=13){const p=trackPoint(car.distance,car.offset);for(let i=0;i<count;i++)particles.push({x:p.x,y:p.y,vx:(rand()-.5)*105,vy:(rand()-.5)*100,life:.35+rand()*.45,color,rotation:rand()*TAU});}
  function spinCar(car,strength,reason){
    if(car.spin>0||car.recovering>.6)return;
    car.spin=.44+rand()*.28;car.spinVelocity=(rand()<.5?-1:1)*(11+rand()*9);car.tumble=strength;car.velocity*=.5;car.lateralVelocity+=(rand()-.5)*11;car.crashCount++;burst(car,reason==='oil'?'#a5b6c4':C.gold,11);
  }
  function hitHazards(car,raceTime){
    if(raceTime>18)return;
    for(const h of hazards){
      if(!h.active||Math.abs(gap(car.distance,h.distance))>(h.type==='oil'?22:13)||Math.abs(car.offset-h.offset)>(h.type==='oil'?13:10))continue;
      if(h.type==='oil'){if(car.oilCooldown<=0&&car.spin<=0&&car.recovering<=.6){car.oilCooldown=1.7;spinCar(car,.3,'oil');stats.oil++;event(`${car.player.name} hit an oil slick!`);}}
      else if(h.type==='cone'){h.active=false;h.loose=true;h.life=2.5;h.vx=60+rand()*110;h.vy=(rand()-.5)*70;car.slow=.55;car.velocity*=.7;car.lateralVelocity+=(rand()-.5)*9;burst(car,C.coral,9);stats.cones++;event(`${car.player.name} scattered the cones!`);}
      else{h.active=false;car.boost=1.45;burst(car,C.teal,13);stats.gas++;event(`${car.player.name} got a fuel boost!`);}
    }
  }
  function collide(raceTime){
    if(raceTime<.55||raceTime>18)return;
    for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
      const a=cars[i],b=cars[j];if(a.collisionCooldown>0||b.collisionCooldown>0||a.recovering>.65||b.recovering>.65)continue;
      const long=gap(a.distance,b.distance),sideways=a.offset-b.offset;if(Math.abs(long)>18||Math.abs(sideways)>10)continue;
      const difference=Math.abs(a.velocity-b.velocity),side=sideways===0?(rand()<.5?-1:1):Math.sign(sideways);
      a.collisionCooldown=b.collisionCooldown=.58;a.lateralVelocity+=side*8;b.lateralVelocity-=side*8;a.offset=clip(a.offset+side*3.5,-EDGE,EDGE);b.offset=clip(b.offset-side*3.5,-EDGE,EDGE);
      const shared=(a.velocity+b.velocity)*.43;a.velocity=Math.max(9,shared);b.velocity=Math.max(9,shared);
      if(difference>7||Math.abs(sideways)<6||rand()<.26){spinCar(a,.7+rand()*.5,'collision');spinCar(b,.7+rand()*.5,'collision');event(`${a.player.name} + ${b.player.name}: crash & recover!`);}else{burst(a,C.gold,6);burst(b,C.gold,6);}stats.collisions++;
    }
  }
  function physics(dt){
    const raceTime=elapsed-COUNTDOWN;if(raceTime<0)return;const worldDt=dt*RATE;
    for(const car of cars){
      car.previousDistance=car.distance;for(const key of ['boost','slow','recovering','collisionCooldown','oilCooldown'])car[key]=Math.max(0,car[key]-dt);
      if(car.spin>0){car.spin=Math.max(0,car.spin-dt);car.spinAngle+=car.spinVelocity*dt;if(car.spin===0){car.recovering=1.05;car.tumble=0;car.collisionCooldown=.8;stats.recoveries++;}}
      else{car.spinAngle*=Math.exp(-dt*9);car.spinVelocity*=Math.exp(-dt*8);}
      car.laneTimer-=dt;if(car.laneTimer<=0){car.lane=clip(car.lane+(rand()-.5)*43,-EDGE+6,EDGE-6);car.laneTimer=.8+rand()*1.5;}
      const current=trackPoint(car.distance,car.offset),ahead=trackPoint(car.distance+car.velocity*1.1,car.offset),curve=Math.max(current.curvature,ahead.curvature);
      // Identical specifications: encounters, grid positions and lanes create
      // advantages. No player's identity appears in these forces.
      let desired=SPECS.topSpeed*(car.boost>0?1.43:1),engine=SPECS.engine*(car.boost>0?1.8:1),grip=SPECS.grip;
      if(car.slow>0)desired*=.64;if(car.recovering>0)desired*=.84;if(car.spin>0){desired*=.34;grip*=.65;}
      // Equal end-of-round assistance prevents permanent traffic jams: hazards
      // stop affecting every car after 18s, followed by a uniform safety boost.
      if(raceTime>18){desired=76;engine=19;grip=28;car.spin=0;car.slow=0;car.recovering=0;car.tumble=0;}
      if(raceTime>25){desired=150;engine=45;grip=140;}
      if(curve)desired=Math.min(desired,Math.sqrt(grip/curve)*(car.boost>0?1.07:.99));
      const drag=SPECS.drag*car.velocity*car.velocity+SPECS.rolling,error=desired-car.velocity,force=clip(error*1.8+drag,0,engine),brake=error<-.8?Math.min(SPECS.braking,-error*2.7):0;
      car.brake=brake/SPECS.braking;car.velocity=Math.max(0,car.velocity+(force-drag-brake)*worldDt);car.distance+=car.velocity*worldDt;
      let target=car.lane+Math.sin(raceTime*1.35+car.phase)*6;if(car.spin>0)target+=Math.sin(car.spinAngle)*23;
      const lateral=(target-car.offset)*2.4-car.lateralVelocity*3.05;car.lateralVelocity=clip(car.lateralVelocity+lateral*worldDt,-12,12);car.offset+=car.lateralVelocity*worldDt;
      if(Math.abs(car.offset)>EDGE){car.offset=clip(car.offset,-EDGE,EDGE);car.lateralVelocity*=-.45;car.velocity*=.97;}
      hitHazards(car,raceTime);car.smokeTimer-=dt;car.skidTimer-=dt;
      const slipping=car.spin>0||car.brake>.5||current.curvature&&car.velocity*car.velocity*current.curvature>grip*.96;
      if((slipping||car.boost>0)&&car.smokeTimer<=0){const p=trackPoint(car.distance-11,car.offset);smoke.push({x:p.x,y:p.y,vx:(rand()-.5)*10,vy:-3-rand()*6,life:.4+rand()*.35,size:3+rand()*4,boost:car.boost>0&&!slipping});car.smokeTimer=.085;}
      if(slipping&&car.skidTimer<=0){const p=trackPoint(car.distance,car.offset);skidMarks.push({x:p.x,y:p.y,angle:p.angle+car.spinAngle,life:3.5});car.skidTimer=.075;}
    }
    collide(raceTime);
    // A crossing fraction resolves finishers inside the same fixed update.
    const crossers=cars.filter(c=>c.distance>=finishDistance).sort((a,b)=>{
      const ta=(finishDistance-a.previousDistance)/Math.max(.0001,a.distance-a.previousDistance),tb=(finishDistance-b.previousDistance)/Math.max(.0001,b.distance-b.previousDistance);return ta-tb||a.tieKey-b.tieKey;
    });if(crossers.length)finish(crossers[0]);
  }
  function finish(car){
    if(picked||mode!=='running')return;picked=true;winner=car.index;finishElapsed=elapsed;mode='finished';updateStandings(true);burst(car,C.gold,70);event(`${car.player.name} takes the chequered flag!`);
    canvas.setAttribute('aria-label',`${car.player.name} won the chaos race and is the next speaker.`);onPick?.(car.player.id);
  }
  function updateStandings(force=false){
    if(!force&&elapsed-lastBoard<.3)return;lastBoard=elapsed;order=cars.map((_,i)=>i).sort((a,b)=>cars[b].distance-cars[a].distance||cars[a].slot-cars[b].slot);
    if(mode==='finished')order.sort((a,b)=>Number(cars[b].index===winner)-Number(cars[a].index===winner));
    order.forEach((i,rank)=>{const c=cars[i];rows[c.index].rank.textContent=rank+1;rows[c.index].row.classList.toggle('champion',mode==='finished'&&c.index===winner);roster.appendChild(rows[c.index].row);});leaderText.textContent=cars[order[0]]?.player.name||'Empty grid';
    const lap=Math.min(2,Math.floor(Math.max(0,cars[order[0]]?.distance||0)/lapLength)+1);
    clockText.textContent=mode==='idle'?'0.0s':mode==='finished'?`${Math.max(0,finishElapsed-COUNTDOWN).toFixed(1)}s`:`${Math.max(0,elapsed-COUNTDOWN).toFixed(1)}s · ${lap}/2`;
  }
  function step(dt){
    elapsed+=dt;if(mode==='running')physics(dt);
    if(mode==='finished')for(const car of cars){car.velocity=Math.max(0,car.velocity-18*dt*RATE);car.distance+=car.velocity*dt*RATE;car.spinAngle*=Math.exp(-dt*7);}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*2;p.vy*=1-dt*2;p.life-=dt;p.rotation+=dt*5;}
    for(const p of smoke){p.x+=p.vx*dt;p.y+=p.vy*dt;p.size+=dt*13;p.life-=dt;}for(const p of skidMarks)p.life-=dt;
    for(const h of hazards)if(h.loose){h.distance+=h.vx*dt;h.offset=clip(h.offset+h.vy*dt,-61,61);h.vx*=1-dt*2;h.vy*=1-dt*2;h.rotation+=dt*9;h.life-=dt;}
    particles=particles.filter(p=>p.life>0).slice(-500);smoke=smoke.filter(p=>p.life>0).slice(-460);skidMarks=skidMarks.filter(p=>p.life>0).slice(-800);
    eventText.classList.toggle('visible',elapsed<eventUntil);updateStandings();
  }
  function drawTrack(){
    ctx.save();ctx.transform(sx,0,0,sy,xShift,yShift);
    outline();ctx.strokeStyle='#09141c';ctx.lineWidth=140;ctx.stroke();
    outline();ctx.strokeStyle='#596168';ctx.lineWidth=127;ctx.stroke();
    for(const offset of [-59,59]){outline(offset);ctx.lineWidth=6;ctx.setLineDash([]);ctx.strokeStyle='#cf785f';ctx.stroke();outline(offset);ctx.setLineDash([16,16]);ctx.strokeStyle='#cdcdbf';ctx.stroke();}
    ctx.setLineDash([]);outline();ctx.strokeStyle='#2d343a';ctx.lineWidth=ROAD_HALF*2;ctx.stroke();
    for(const offset of [-51,51]){outline(offset);ctx.lineWidth=1;ctx.strokeStyle='#e1e1d12b';ctx.stroke();}
    outline();ctx.lineWidth=.7;ctx.setLineDash([18,38]);ctx.strokeStyle='#d9dfdd1b';ctx.stroke();ctx.setLineDash([]);
    for(let row=0;row<12;row++)for(let col=0;col<2;col++){ctx.fillStyle=(row+col)%2?'#172027':'#c9cbbf';ctx.fillRect(514+col*6,track.cy+track.radius-54+row*9,6,9);}ctx.restore();
    for(const mark of skidMarks){const p=mapped(mark);ctx.save();ctx.globalAlpha=Math.min(.4,mark.life/5);ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle='#090e12';ctx.lineWidth=small?1:1.4;ctx.beginPath();ctx.moveTo(-10,-4);ctx.lineTo(5,-4);ctx.moveTo(-10,4);ctx.lineTo(5,4);ctx.stroke();ctx.restore();}
  }
  // Source cells retain their aspect ratio; the atlas never affects simulation.
  function sprite(index,x,y,size){
    if(atlasState!=='ready'||!atlas)return false;
    const cell=artwork.raceCells?.[index];
    const sx=cell?.x??(index%4)*cellWidth,sy=cell?.y??Math.floor(index/4)*cellHeight;
    const sw=cell?.width??cellWidth,sh=cell?.height??cellHeight;
    if(!(sw>0&&sh>0&&sx>=0&&sy>=0&&sx+sw<=atlas.naturalWidth&&sy+sh<=atlas.naturalHeight))return false;
    const w=size*sw/sh;
    try{ctx.drawImage(atlas,sx,sy,sw,sh,x-w/2,y-size/2,w,size);return true;}
    catch{atlasState='error';return false;}
  }
  function loadArtwork(){
    if(!artwork.race||typeof Image!=='function'){atlasState='error';return;}
    atlas=new Image();atlas.decoding='async';
    atlas.onload=()=>{
      if(!alive)return;
      if(atlas.naturalWidth<4||atlas.naturalHeight<3){atlasState='error';draw();return;}
      cellWidth=atlas.naturalWidth/4;cellHeight=atlas.naturalHeight/3;atlasState='ready';draw();
    };
    atlas.onerror=()=>{if(!alive)return;atlasState='error';draw();};
    atlas.src=artwork.race;
  }
  function drawHazard(h){
    if(!h.active&&(!h.loose||h.life<=0))return;const p=mapped(trackPoint(h.distance,h.offset)),scale=small?.6:clip(width/1400,.58,.84);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+h.rotation);ctx.scale(scale,scale);if(h.loose)ctx.globalAlpha=Math.min(1,h.life);
    if(sprite(h.type==='oil'?8:h.type==='cone'?9:10,0,0,h.type==='oil'?60:40)||atlasState==='loading'){ctx.restore();return;}
    if(h.type==='oil'){
      ctx.fillStyle='#030710bb';ctx.beginPath();ctx.ellipse(0,0,28,15,.15,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(-12,6,15,10,-.4,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(14,-7,14,9,.4,0,TAU);ctx.fill();
      ctx.strokeStyle='#778ad054';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(2,0,18,7,-.1,.4,Math.PI*1.6);ctx.stroke();ctx.strokeStyle='#7bd8c945';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-3,1,12,4,.1,1,5.2);ctx.stroke();circle(23,14,3,'#020612');circle(-25,-11,4,'#020612');
    }else if(h.type==='cone'){
      rounded(-14,7,29,10,3,'#0a132966');rounded(-13,4,26,11,3,'#fa7947','#a34631');ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(-3,-18);ctx.quadraticCurveTo(0,-22,3,-18);ctx.lineTo(10,8);ctx.closePath();ctx.fillStyle=C.coral;ctx.fill();
      ctx.fillStyle=C.cream;ctx.beginPath();ctx.moveTo(-7,-3);ctx.lineTo(7,-3);ctx.lineTo(5,-10);ctx.lineTo(-5,-10);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffd0b74d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,-17);ctx.lineTo(-7,6);ctx.stroke();
    }else{
      ctx.shadowColor='#7bd8c955';ctx.shadowBlur=15;rounded(-12,-14,24,31,4,C.teal,'#b5ffdf');ctx.shadowBlur=0;rounded(-6,-20,13,8,2,'#223f42',C.teal);rounded(5,-19,8,5,1,C.gold);
      ctx.strokeStyle='#2c8c7c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-7);ctx.lineTo(8,10);ctx.moveTo(8,-7);ctx.lineTo(-8,10);ctx.stroke();ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(1,-9);ctx.lineTo(-5,2);ctx.lineTo(0,2);ctx.lineTo(-1,10);ctx.lineTo(7,-1);ctx.lineTo(2,-1);ctx.closePath();ctx.fill();
    }ctx.restore();
  }
  function drawCar(car){
    const world=trackPoint(car.distance,car.offset),p=mapped(world),length=players.length>24?(small?18:24):(small?22:29),breadth=length*.5;
    const yaw=Math.atan2(car.lateralVelocity,Math.max(8,car.velocity)),spin=car.spin>0?car.spinAngle:car.spinAngle%TAU,lift=car.spin>0&&car.tumble>.5?Math.abs(Math.sin(car.spinAngle*.7))*11*car.tumble:0;
    ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#02081266';ctx.beginPath();ctx.ellipse(3,5,length*.61,breadth*.71,p.angle,0,TAU);ctx.fill();ctx.translate(0,-lift);ctx.rotate(p.angle+yaw+spin);if(lift>0)ctx.scale(1+lift/140,.45+Math.abs(Math.cos(car.spinAngle))*.55);
    if(car.boost>0&&car.spin<=0){ctx.fillStyle='#f8c75ab3';ctx.beginPath();ctx.moveTo(-length*.46,-3);ctx.lineTo(-length*.79-Math.sin(elapsed*70)*3,0);ctx.lineTo(-length*.46,3);ctx.fill();}
    // Atlas cars face up. Quarter-turn into our local forward (+x) direction.
    ctx.save();ctx.rotate(Math.PI/2);sprite(car.index%8,0,0,length*1.28);ctx.restore();
    if(atlasState==='error'){
    for(const side of [-1,1])for(const axle of [-1,1]){ctx.save();ctx.translate(axle*length*.28,side*breadth*.51);if(axle>0)ctx.rotate(-Math.atan(6*world.curvature)+yaw);rounded(-5,-3,10,6,2,'#050d1c');ctx.restore();}
    rounded(-length/2,-breadth/2,length,breadth,5,car.player.color,'#ffffff32');rounded(-length*.15,-breadth*.36,length*.36,breadth*.72,3,'#13243c');ctx.fillStyle='#d8eeed43';ctx.fillRect(1,-breadth*.32,3,breadth*.64);rounded(-length*.57,-breadth*.59,4,breadth*1.18,1,'#19263d');
    ctx.fillStyle='#fff6d6';ctx.fillRect(length*.39,-breadth*.35,2,3);ctx.fillRect(length*.39,breadth*.17,2,3);ctx.fillStyle=car.brake>.2?'#ff493e':'#942b43';ctx.fillRect(-length*.45,-breadth*.34,2,3);ctx.fillRect(-length*.45,breadth*.16,2,3);
    }ctx.restore();
    const leader=order[0]!==undefined&&cars[order[0]]===car,show=players.length<=16||leader||hover===car.index||order.slice(0,3).some(i=>cars[i]===car);
    if(show){const font=small?11:12,max=small?86:120;ctx.font=`600 ${font}px system-ui, "Segoe UI", sans-serif`;const labelWidth=Math.min(max,ctx.measureText(car.player.name).width+12),normal=p.angle+Math.PI/2,outside=car.offset>=0?1:-1;
      const lx=clip(p.x+Math.cos(normal)*outside*(breadth+9),labelWidth/2+4,width-labelWidth/2-4),ly=clip(p.y+Math.sin(normal)*outside*(breadth+9)-lift*.5,14,height-14);
      rounded(lx-labelWidth/2,ly-9,labelWidth,18,4,'#101b3366');text(car.player.name,lx,ly,font,leader?'#ece8ce':'#e0e6e3',600,'center',labelWidth-8);
    }
  }
  function draw(){
    if(!alive)return;ctx.clearRect(0,0,width,height);const bg=ctx.createRadialGradient(width*.5,height*.5,0,width*.5,height*.5,Math.max(width,height)*.7);bg.addColorStop(0,'#172725');bg.addColorStop(.7,'#142121');bg.addColorStop(1,'#101b26');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    drawTrack();hazards.forEach(drawHazard);
    for(const p of smoke){const pos=mapped({...p,angle:0});ctx.save();ctx.globalAlpha=clip(p.life*.3,0,.24);if(!sprite(11,pos.x,pos.y,p.size*(small?2:2.4))&&atlasState==='error')circle(pos.x,pos.y,p.size*(small?.6:.8),p.boost?'#9bceb7':'#b6bfc3');ctx.restore();}
    [...cars].sort((a,b)=>a.distance-b.distance).forEach(drawCar);
    for(const p of particles){const pos=mapped({...p,angle:0});ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(p.rotation);ctx.globalAlpha=Math.min(.75,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(-1.5,-1,3,2);ctx.restore();}
    if(mode==='running'&&elapsed<COUNTDOWN){const lights=Math.min(3,Math.floor(elapsed/(COUNTDOWN/3))+1);for(let i=0;i<3;i++)circle(width/2+(i-1)*18,height*.40,4,i<lights?'#da826b':'#37443f');}
  }
  function resize(){
    if(!alive)return;width=Math.max(1,container.clientWidth||1000);height=Math.max(1,container.clientHeight||700);small=width<650;
    // Outer circuit bounds cover 96.5% of width and 90% of height. The road is
    // wider while sprites remain in screen pixels, leaving room around every car.
    sx=width*.965/960;sy=height*.90/440;xShift=width/2-520*sx;yShift=height/2-track.cy*sy;root.classList.toggle('race-compact',small);
    const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function frame(now){
    if(!alive)return;if(previous===null)previous=now;accumulator+=clip((now-previous)/1000,0,36);previous=now;
    // At most 4320 fixed updates per frame. Hidden tabs catch up a whole round.
    while(accumulator>=STEP&&alive){step(STEP);accumulator-=STEP;if(mode==='finished'&&elapsed>finishElapsed+2){accumulator=0;break;}}
    if(!alive)return;draw();if(mode==='finished'&&elapsed>finishElapsed+2){raf=0;return;}raf=requestAnimationFrame(frame);
  }
  function start(){
    if(!alive||mode==='running'||!players.length)return;cancelAnimationFrame(raf);raf=0;previous=performance.now();accumulator=0;elapsed=0;finishElapsed=0;mode='running';picked=false;winner=-1;lastBoard=-1;hover=-1;particles=[];smoke=[];skidMarks=[];
    stats={collisions:0,oil:0,cones:0,gas:0,recoveries:0};timing.open=false;eventUntil=0;eventText.classList.remove('visible');grid(true);scatter(true);updateStandings(true);
    canvas.setAttribute('aria-label','Chaos Grand Prix in progress. All cars have identical specifications. First finisher chooses the speaker.');draw();raf=requestAnimationFrame(frame);
  }
  function reset(){
    if(!alive)return;cancelAnimationFrame(raf);raf=0;previous=null;elapsed=0;accumulator=0;mode='idle';picked=false;winner=-1;lastBoard=-1;hover=-1;particles=[];smoke=[];skidMarks=[];eventUntil=0;stats={collisions:0,oil:0,cones:0,gas:0,recoveries:0};eventText.classList.remove('visible');timing.open=false;
    grid();scatter(false);updateStandings(true);canvas.setAttribute('aria-label','Chaos Grand Prix starting grid. Every named car begins with identical specifications and zero speed.');draw();
  }
  function pointerMove(e){const b=canvas.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;hover=-1;let nearest=28;for(const car of cars){const p=mapped(trackPoint(car.distance,car.offset)),d=Math.hypot(x-p.x,y-p.y);if(d<nearest){nearest=d;hover=car.index;}}canvas.title=hover>=0?players[hover].name:'';if(mode==='idle'||raf===0)draw();}
  function pointerLeave(){hover=-1;canvas.title='';if(mode==='idle'||raf===0)draw();}
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerleave',pointerLeave);
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(container);window.addEventListener('resize',resize);grid();scatter(false);updateStandings(true);resize();loadArtwork();
  return{start,reset,destroy(){if(!alive)return;alive=false;cancelAnimationFrame(raf);raf=0;observer?.disconnect();window.removeEventListener('resize',resize);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',pointerLeave);if(atlas){atlas.onload=null;atlas.onerror=null;atlas.src='';atlas=null;}cars=[];hazards=[];particles=[];smoke=[];skidMarks=[];root.remove();}};
}