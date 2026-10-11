/** Chaos Grand Prix — original canvas art, no external assets.
 * Identical cars, uniformly shuffled names on the grid, actual first finisher.
 * Fixed-step, accelerated physics: drag, grip, steering, crashes and recovery.
 * This is an arcade car simulation rather than an engineering vehicle model.
 */
export default function createGame({ container, names = [], onPick, random = Math.random }) {
  const C = { navy:'#101b33', cream:'#fff4df', gold:'#f8c75a', teal:'#7bd8c9', coral:'#ff735e' };
  const rand = () => Math.max(0, Math.min(.999999999999, Number(random()) || 0));
  const clip = (n,a,b) => Math.max(a,Math.min(b,n));
  const players = names.slice(0,60).map((p,i) => ({...p,name:String(p.name ?? ''),color:p.color || [C.teal,C.gold,C.coral,'#b0b8ef'][i%4]}));
  const root = document.createElement('div'); root.className='grand-prix';
  root.innerHTML=`<style>
    .grand-prix{width:100%;height:100%;position:relative;overflow:hidden;background:#101b33;color:#fff4df;font-family:inherit}
    .grand-prix canvas{display:block;width:100%;height:100%}
    .grand-prix .race-timing{position:absolute;left:50%;top:57%;transform:translateX(-50%);width:250px;max-width:65%;border:1px solid #fff4df1f;background:#101b33e8;border-radius:13px;box-shadow:0 8px 30px #0002;z-index:2}
    .grand-prix .race-timing summary{cursor:pointer;list-style:none;display:flex;gap:10px;align-items:center;padding:10px 13px;font-size:12px;min-height:40px}
    .grand-prix .race-timing summary::-webkit-details-marker{display:none}
    .grand-prix .race-timing summary:focus-visible{outline:2px solid #7bd8c9;outline-offset:3px}
    .grand-prix .race-timing summary:after{content:'⌄';margin-left:auto;color:#7bd8c9;font-size:17px}
    .grand-prix .race-timing[open] summary:after{content:'⌃'}
    .grand-prix .race-timing summary>span{color:#9eb1c5;white-space:nowrap;font-size:11px}
    .grand-prix .race-leader{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
    .grand-prix .race-roster{padding:0 12px 8px;margin:0;list-style:none;max-height:min(230px,28vh);overflow:auto;scrollbar-width:thin;scrollbar-color:#7bd8c94a transparent}
    .grand-prix .race-row{display:flex;align-items:center;gap:9px;min-height:33px;border-top:1px solid #fff4df0b;font-size:13px}
    .grand-prix .race-rank{width:18px;flex:none;color:#8095ab;font-size:11px;font-variant-numeric:tabular-nums}
    .grand-prix .race-number{width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:6px;color:#101b33;font-size:10px;font-weight:800}
    .grand-prix .race-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .grand-prix .race-row.champion{color:#f8c75a}
    .grand-prix .race-event{position:absolute;bottom:15%;left:50%;transform:translateX(-50%);max-width:80%;padding:8px 14px;border-radius:30px;background:#101b33d9;color:#fff4df;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;opacity:0;transition:opacity .15s}
    .grand-prix .race-event.visible{opacity:1}
    .grand-prix.race-compact .race-timing{top:58%;width:205px}
    .grand-prix.race-compact .race-timing summary{padding:8px 10px;gap:7px;min-height:35px}
    .grand-prix.race-compact .race-timing summary>span{font-size:10px}
    .grand-prix.race-compact .race-leader{font-size:11px}
  </style><canvas role="img" aria-label="Chaos Grand Prix. Cars collide, tumble and recover. Oil causes spinouts, cones slow cars, and gas cans give boosts. First finisher chooses the speaker."></canvas><details class="race-timing"><summary><span>Live positions</span><strong class="race-leader"></strong></summary><ol class="race-roster" aria-label="Every named car and its live position"></ol></details><div class="race-event" aria-live="off"></div>`;
  container.appendChild(root);
  const canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d'), roster=root.querySelector('.race-roster');
  const leaderText=root.querySelector('.race-leader'), timing=root.querySelector('.race-timing'), eventText=root.querySelector('.race-event');
  const rows=players.map((p,i)=>{
    const row=document.createElement('li');row.className='race-row';row.title=p.name;
    const rank=document.createElement('span');rank.className='race-rank';rank.textContent=i+1;
    const number=document.createElement('span');number.className='race-number';number.style.backgroundColor=p.color;number.textContent=i+1;
    const label=document.createElement('span');label.className='race-name';label.textContent=p.name;
    row.append(rank,number,label);roster.appendChild(row);return{row,rank};
  });
  const STEP=1/120, RATE=10, COUNTDOWN=1.1, TAU=Math.PI*2;
  const track={left:260,right:780,radius:150,cy:360}, straight=520, lapLength=1040+TAU*150, finishDistance=lapLength*2;
  const SPECS=Object.freeze({engine:11.4,topSpeed:58,grip:11.8,drag:.00125,rolling:.28,braking:13});
  let alive=true,raf=0,previous=null,accumulator=0,elapsed=0,mode='idle',picked=false,winner=-1,finishElapsed=0;
  let cars=[],order=[],hazards=[],particles=[],smoke=[],skidMarks=[];
  let width=1000,height=700,sx=1,sy=1,yShift=0,small=false,lastBoard=-1,hover=-1,eventUntil=0;
  let stats={collisions:0,oil:0,cones:0,gas:0,recoveries:0};
  const gap=(a,b)=>((a-b+lapLength*1.5)%lapLength)-lapLength/2;
  function trackPoint(distance,offset=0){
    let s=((distance+straight/2)%lapLength+lapLength)%lapLength;const r=track.radius+offset;
    if(s<=straight)return{x:track.left+s,y:track.cy+r,angle:0,curvature:0};s-=straight;
    if(s<Math.PI*track.radius){const a=Math.PI/2-s/track.radius;return{x:track.right+Math.cos(a)*r,y:track.cy+Math.sin(a)*r,angle:a-Math.PI/2,curvature:1/track.radius};}
    s-=Math.PI*track.radius;if(s<=straight)return{x:track.right-s,y:track.cy-r,angle:-Math.PI,curvature:0};s-=straight;
    const a=-Math.PI/2-s/track.radius;return{x:track.left+Math.cos(a)*r,y:track.cy+Math.sin(a)*r,angle:a-Math.PI/2,curvature:1/track.radius};
  }
  function mapped(p){return{x:p.x*sx,y:p.y*sy+yShift,angle:Math.atan2(Math.sin(p.angle)*sy,Math.cos(p.angle)*sx)};}
  function text(value,x,y,size=14,color=C.cream,weight=600,align='left',max=Infinity){
    ctx.font=`${weight} ${size}px system-ui, "Segoe UI", sans-serif`;ctx.fillStyle=color;ctx.textBaseline='middle';ctx.textAlign=align;
    let label=String(value);if(Number.isFinite(max)&&ctx.measureText(label).width>max){const chars=Array.from(label);while(chars.length&&ctx.measureText(chars.join('')+'…').width>max)chars.pop();label=chars.join('')+'…';}ctx.fillText(label,x,y);
  }
  function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fillStyle=fill;ctx.fill();}
  function outline(offset=0){const r=track.radius+offset;ctx.beginPath();ctx.moveTo(track.left,track.cy+r);ctx.lineTo(track.right,track.cy+r);ctx.arc(track.right,track.cy,r,Math.PI/2,-Math.PI/2,true);ctx.lineTo(track.left,track.cy-r);ctx.arc(track.left,track.cy,r,-Math.PI/2,-Math.PI*1.5,true);ctx.closePath();}
  function grid(fresh=false){
    const indices=players.map((_,i)=>i);if(fresh)for(let i=indices.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
    const cols=Math.min(6,Math.max(1,players.length));
    cars=indices.map((index,slot)=>{const lane=(slot%cols-(cols-1)/2)*14;return{player:players[index],index,slot,distance:-Math.floor(slot/cols)*30,velocity:0,offset:lane,lane,lateralVelocity:0,phase:fresh?rand()*TAU:slot,laneTimer:fresh?.5+rand()*1.5:1,spin:0,spinAngle:0,spinVelocity:0,tumble:0,recovering:0,collisionCooldown:0,boost:0,slow:0,oilCooldown:0,smokeTimer:0,skidTimer:0,brake:0,crashCount:0,tieKey:fresh?rand():slot/60,previousDistance:0};});order=cars.map((_,i)=>i);
  }
  function scatter(fresh=true){
    hazards=[];const add=(type,distance,offset)=>hazards.push({type,distance,offset,active:true,rotation:fresh?rand()*.6-.3:0,vx:0,vy:0,loose:false,life:10});
    // Starter pickups ensure that solo rounds also feature recognisable hazards.
    add('gas',115,0);add('cone',325,0);add('oil',505,0);
    const clusters=players.length>24?11:8;
    for(let i=0;i<clusters;i++){const d=180+(i+(fresh?rand()*.6:.3))*(lapLength-310)/clusters,o=fresh?(rand()-.5)*65:(i%3-1)*25;add('oil',d,o);add('cone',d+48,clip(o+17,-36,36));add('cone',d-34,clip(o-18,-36,36));add('gas',d+110,fresh?(rand()-.5)*68:-o);}
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
      if(!h.active||Math.abs(gap(car.distance,h.distance))>(h.type==='oil'?27:18)||Math.abs(car.offset-h.offset)>(h.type==='oil'?15:12))continue;
      if(h.type==='oil'){if(car.oilCooldown<=0&&car.spin<=0&&car.recovering<=.6){car.oilCooldown=1.7;spinCar(car,.3,'oil');stats.oil++;event(`${car.player.name} hit an oil slick!`);}}
      else if(h.type==='cone'){h.active=false;h.loose=true;h.life=2.5;h.vx=60+rand()*110;h.vy=(rand()-.5)*70;car.slow=.55;car.velocity*=.7;car.lateralVelocity+=(rand()-.5)*9;burst(car,C.coral,9);stats.cones++;event(`${car.player.name} scattered the cones!`);}
      else{h.active=false;car.boost=1.45;burst(car,C.teal,13);stats.gas++;event(`${car.player.name} got a fuel boost!`);}
    }
  }
  function collide(raceTime){
    if(raceTime<.55||raceTime>18)return;
    for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
      const a=cars[i],b=cars[j];if(a.collisionCooldown>0||b.collisionCooldown>0||a.recovering>.65||b.recovering>.65)continue;
      const long=gap(a.distance,b.distance),sideways=a.offset-b.offset;if(Math.abs(long)>25||Math.abs(sideways)>12)continue;
      const difference=Math.abs(a.velocity-b.velocity),side=sideways===0?(rand()<.5?-1:1):Math.sign(sideways);
      a.collisionCooldown=b.collisionCooldown=.58;a.lateralVelocity+=side*8;b.lateralVelocity-=side*8;a.offset=clip(a.offset+side*3.5,-43,43);b.offset=clip(b.offset-side*3.5,-43,43);
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
      car.laneTimer-=dt;if(car.laneTimer<=0){car.lane=clip(car.lane+(rand()-.5)*43,-35,35);car.laneTimer=.8+rand()*1.5;}
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
      if(Math.abs(car.offset)>43){car.offset=clip(car.offset,-43,43);car.lateralVelocity*=-.45;car.velocity*=.97;}
      hitHazards(car,raceTime);car.smokeTimer-=dt;car.skidTimer-=dt;
      const slipping=car.spin>0||car.brake>.5||current.curvature&&car.velocity*car.velocity*current.curvature>grip*.96;
      if((slipping||car.boost>0)&&car.smokeTimer<=0){const p=trackPoint(car.distance-16,car.offset);smoke.push({x:p.x,y:p.y,vx:(rand()-.5)*14,vy:-4-rand()*8,life:.6+rand()*.5,size:5+rand()*7,boost:car.boost>0&&!slipping});car.smokeTimer=.045;}
      if(slipping&&car.skidTimer<=0){const p=trackPoint(car.distance,car.offset);skidMarks.push({x:p.x,y:p.y,angle:p.angle+car.spinAngle,life:4.8});car.skidTimer=.045;}
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
    ctx.save();ctx.transform(sx,0,0,sy,0,yShift);outline();ctx.strokeStyle='#203e35';ctx.lineWidth=126;ctx.stroke();outline();ctx.strokeStyle='#071425';ctx.lineWidth=103;ctx.stroke();
    for(const offset of [-46,46]){outline(offset);ctx.lineWidth=9;ctx.setLineDash([]);ctx.strokeStyle=C.coral;ctx.stroke();outline(offset);ctx.setLineDash([13,13]);ctx.strokeStyle=C.cream;ctx.stroke();}
    ctx.setLineDash([]);outline();ctx.strokeStyle='#354254';ctx.lineWidth=85;ctx.stroke();for(const offset of [-19,19]){outline(offset);ctx.lineWidth=1;ctx.setLineDash([13,18]);ctx.strokeStyle='#d6e0e321';ctx.stroke();}ctx.setLineDash([]);
    for(let row=0;row<10;row++)for(let col=0;col<3;col++){ctx.fillStyle=(row+col)%2?C.navy:C.cream;ctx.fillRect(508+col*8,465+row*9,8,9);}
    for(let i=0;i<14;i++){const p=trackPoint(i*lapLength/14,(i%3-1)*25);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle='#111d2e26';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,-5);ctx.lineTo(26,-5);ctx.moveTo(-17,5);ctx.lineTo(26,5);ctx.stroke();ctx.restore();}ctx.restore();
    for(const mark of skidMarks){const p=mapped(mark);ctx.save();ctx.globalAlpha=Math.min(.65,mark.life/4);ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle='#08111f';ctx.lineWidth=small?1.8:2.5;ctx.beginPath();ctx.moveTo(-16,-7);ctx.lineTo(8,-7);ctx.moveTo(-16,7);ctx.lineTo(8,7);ctx.stroke();ctx.restore();}
  }
  function drawHazard(h){
    if(!h.active&&(!h.loose||h.life<=0))return;const p=mapped(trackPoint(h.distance,h.offset)),scale=small?.83:clip(width/1100,.92,1.25);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+h.rotation);ctx.scale(scale,scale);if(h.loose)ctx.globalAlpha=Math.min(1,h.life);
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
    const world=trackPoint(car.distance,car.offset),p=mapped(world),length=players.length>24?(small?23:34):(small?29:43),breadth=length*.52;
    const yaw=Math.atan2(car.lateralVelocity,Math.max(8,car.velocity)),spin=car.spin>0?car.spinAngle:car.spinAngle%TAU,lift=car.spin>0&&car.tumble>.5?Math.abs(Math.sin(car.spinAngle*.7))*17*car.tumble:0;
    ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#02081266';ctx.beginPath();ctx.ellipse(3,5,length*.61,breadth*.71,p.angle,0,TAU);ctx.fill();ctx.translate(0,-lift);ctx.rotate(p.angle+yaw+spin);if(lift>0)ctx.scale(1+lift/140,.45+Math.abs(Math.cos(car.spinAngle))*.55);
    if(car.boost>0&&car.spin<=0){ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(-length*.46,-5);ctx.lineTo(-length*.93-Math.sin(elapsed*70)*6,0);ctx.lineTo(-length*.46,5);ctx.fill();ctx.fillStyle=C.coral;ctx.beginPath();ctx.moveTo(-length*.47,-3);ctx.lineTo(-length*.7,0);ctx.lineTo(-length*.47,3);ctx.fill();}
    for(const side of [-1,1])for(const axle of [-1,1]){ctx.save();ctx.translate(axle*length*.28,side*breadth*.51);if(axle>0)ctx.rotate(-Math.atan(6*world.curvature)+yaw);rounded(-5,-3,10,6,2,'#050d1c');ctx.restore();}
    rounded(-length/2,-breadth/2,length,breadth,5,car.player.color,'#ffffff32');rounded(-length*.15,-breadth*.36,length*.36,breadth*.72,3,'#13243c');ctx.fillStyle='#d8eeed43';ctx.fillRect(1,-breadth*.32,3,breadth*.64);rounded(-length*.57,-breadth*.59,4,breadth*1.18,1,'#19263d');
    ctx.fillStyle='#fff6d6';ctx.fillRect(length*.39,-breadth*.35,3,4);ctx.fillRect(length*.39,breadth*.17,3,4);ctx.fillStyle=car.brake>.2?'#ff493e':'#942b43';ctx.fillRect(-length*.45,-breadth*.34,2,4);ctx.fillRect(-length*.45,breadth*.16,2,4);text(car.index+1,-length*.27,0,small?8:10,C.navy,900,'center');ctx.restore();
    const leader=order[0]!==undefined&&cars[order[0]]===car,show=players.length<=16||leader||hover===car.index||order.slice(0,5).some(i=>cars[i]===car);
    if(show){const font=small?11:13,max=small?90:135;ctx.font=`700 ${font}px system-ui, "Segoe UI", sans-serif`;const labelWidth=Math.min(max,ctx.measureText(car.player.name).width+19),normal=p.angle+Math.PI/2,outside=car.offset>=0?1:-1;
      const lx=clip(p.x+Math.cos(normal)*outside*(breadth+13),labelWidth/2+4,width-labelWidth/2-4),ly=clip(p.y+Math.sin(normal)*outside*(breadth+13)-lift*.5,86,height-90);
      rounded(lx-labelWidth/2,ly-12,labelWidth,24,7,'#101b33ed',leader?C.gold:'#ffffff2b');text(car.player.name,lx,ly,font,leader?C.gold:C.cream,700,'center',labelWidth-12);
    }
  }
  function legend(type,label,x,y){
    if(type==='oil'){ctx.fillStyle='#080e1e';ctx.beginPath();ctx.ellipse(x,y,9,5,-.2,0,TAU);ctx.fill();ctx.strokeStyle='#7e97ac';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,6,2,-.2,0,Math.PI);ctx.stroke();}
    else if(type==='cone'){ctx.fillStyle=C.coral;ctx.beginPath();ctx.moveTo(x-6,y+7);ctx.lineTo(x,y-9);ctx.lineTo(x+6,y+7);ctx.fill();ctx.fillStyle=C.cream;ctx.fillRect(x-3,y-1,6,3);}
    else{rounded(x-6,y-7,12,15,2,C.teal);ctx.fillStyle=C.gold;ctx.fillRect(x-2,y-10,5,3);text('ϟ',x,y+1,12,C.navy,900,'center');}text(label,x+14,y+1,small?10:12,'#a4b6bb',500);
  }
  function draw(){
    if(!alive)return;ctx.clearRect(0,0,width,height);const bg=ctx.createRadialGradient(width*.5,height*.45,0,width*.5,height*.45,Math.max(width,height)*.7);bg.addColorStop(0,'#224436');bg.addColorStop(.58,'#152f2d');bg.addColorStop(1,C.navy);ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let i=0;i<20;i++){ctx.fillStyle=i%2?'#7bd8c903':'#00000003';ctx.fillRect(0,i*height/20,width,height/20);}ctx.strokeStyle='#7bd8c90a';ctx.lineWidth=1;for(let i=1;i<18;i++){ctx.beginPath();ctx.moveTo(i*width/18,0);ctx.lineTo(i*width/18,height);ctx.stroke();}
    drawTrack();hazards.forEach(drawHazard);
    for(const p of smoke){const pos=mapped({...p,angle:0});ctx.save();ctx.globalAlpha=clip(p.life*.4,0,.36);circle(pos.x,pos.y,p.size*(small?.75:1),p.boost?C.teal:'#c2cbd1');ctx.restore();}
    [...cars].sort((a,b)=>a.distance-b.distance).forEach(drawCar);
    for(const p of particles){const pos=mapped({...p,angle:0});ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(p.rotation);ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(-3,-1.7,6,3.4);ctx.restore();}
    const center=width/2; text('CHAOS GRAND PRIX',center,height*.30,small?19:clip(width/39,24,36),C.cream,800,'center');
    const legendWidth=small?205:292;legend('oil','Spin out',center-legendWidth/2,height*.355);legend('cone','Slow down',center-(small?30:38),height*.355);legend('gas','Boost!',center+(small?49:67),height*.355);
    if(!players.length){text('The grid is empty',center,height*.445,small?24:36,C.cream,800,'center');text('Add names to race',center,height*.505,13,'#b3c4c8',500,'center');}
    else if(mode==='idle'){text('READY TO RUMBLE',center,height*.445,small?22:39,C.gold,800,'center');text(`${players.length} identical cars · 2 chaotic laps`,center,height*.507,small?11:14,'#b3c4c8',500,'center');}
    else if(mode==='running'&&elapsed<COUNTDOWN){const lights=Math.min(3,Math.floor(elapsed/(COUNTDOWN/3))+1);for(let i=0;i<3;i++)circle(center+(i-1)*33,height*.445,10,i<lights?C.coral:'#36574c');text('LIGHTS OUT…',center,height*.507,15,C.cream,700,'center');}
    else if(mode==='finished'){text('CHEQUERED FLAG!',center,height*.445,small?22:40,C.gold,800,'center');text(players[winner]?.name||'',center,height*.505,small?18:26,C.cream,800,'center',width*.42);}
    else{const lead=cars[order[0]],lap=Math.min(2,Math.floor(Math.max(0,lead?.distance||0)/lapLength)+1);text(`LAP ${lap} / 2`,center,height*.445,small?35:59,C.cream,800,'center');text(`${Math.max(0,elapsed-COUNTDOWN).toFixed(1)}s  ·  ${Math.round((lead?.velocity||0)*3.6)} km/h  ·  ${stats.collisions} bumps`,center,height*.51,small?11:14,C.teal,600,'center');}
    if(!small)text('SAME SPECS. WILD ENCOUNTERS. FIRST FINISHER SPEAKS.',center,height-24,10,'#8ba5ae',600,'center');
  }
  function resize(){
    if(!alive)return;width=Math.max(1,container.clientWidth||1000);height=Math.max(1,container.clientHeight||700);small=width<650;sx=width/1040;sy=height*.28/track.radius;yShift=height*.45-track.cy*sy;root.classList.toggle('race-compact',small);
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
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(container);window.addEventListener('resize',resize);grid();scatter(false);updateStandings(true);resize();
  return{start,reset,destroy(){if(!alive)return;alive=false;cancelAnimationFrame(raf);raf=0;observer?.disconnect();window.removeEventListener('resize',resize);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',pointerLeave);cars=[];hazards=[];particles=[];smoke=[];skidMarks=[];root.remove();}};
}