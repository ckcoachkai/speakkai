/* The cheese chase: a large, pannable maze with original canvas animal artwork. */
export default function createGame({container, names = [], onPick = () => {}, random = Math.random}) {
  const COLORS = ['#4285f4','#ea4335','#34a853','#fbbc05','#9c64ee','#ed80ba'];
  const roster = names.slice(0,60).map((p,i) => ({id:p.id,name:String(p.name ?? `Mouse ${i+1}`),color:p.color || COLORS[i%COLORS.length],number:i+1}));
  const COLS=43, ROWS=29, CELL=44, PAD=48, WW=COLS*CELL+PAD*2+92, WH=ROWS*CELL+PAD*2;
  const EXIT=Math.floor(ROWS/2)*COLS+COLS-1, DIR=[[0,-1],[1,0],[0,1],[-1,0]], TAU=Math.PI*2;
  const DAMAGE_LEVELS=20, POWER_LEVELS=12, BASE_SPEED=125, CAT_TIME=20, EXIT_OPEN_TIME=27, ROUND_LIMIT=43;
  const root=document.createElement('section'); root.className='mm-game'; root.setAttribute('aria-label','Mice in a Maze: cheese, bugs, bombs and a cat');
  root.innerHTML=`<style>
    .mm-game{position:relative;width:100%;height:100%;overflow:hidden;background:#101820;color:#fff5e3;font-family:inherit;isolation:isolate}.mm-game *{box-sizing:border-box}
    .mm-game canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline:none}.mm-game canvas.mm-dragging{cursor:grabbing}.mm-game canvas:focus-visible{box-shadow:inset 0 0 0 3px #fbbc05}
    .mm-game .mm-hud{position:absolute;left:24px;top:78px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;max-width:calc(100% - 48px);pointer-events:none;z-index:1;font-size:12px;text-shadow:0 1px 3px #000}
    .mm-game .mm-pill{border:1px solid #ffffff20;background:#0a101ddd;border-radius:20px;padding:7px 11px;white-space:nowrap}.mm-game .mm-cat{color:#fbbc05}.mm-game .mm-cat.mm-danger{color:#ff8b91;border-color:#be404766;background:#351822e8}
    .mm-game .mm-alive{pointer-events:auto;position:relative}.mm-game .mm-alive summary{cursor:pointer;list-style:none}.mm-game .mm-alive summary::after{content:' ▾';opacity:.6}.mm-game .mm-list{position:absolute;top:38px;left:0;background:#0c1827f5;border:1px solid #486170;border-radius:13px;padding:9px;max-height:220px;overflow:auto;min-width:215px;max-width:calc(100vw - 55px);box-shadow:0 8px 24px #0007}
    .mm-game .mm-list div{display:flex;gap:7px;align-items:center;font-size:11px;padding:5px 3px}.mm-game .mm-list i{width:8px;height:8px;border-radius:50%;flex:none}.mm-game .mm-list span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:145px}.mm-game .mm-list small{margin-left:auto;white-space:nowrap;color:#9ed7ba}.mm-game .mm-list .mm-dead{opacity:.5}.mm-game .mm-list .mm-dead small{color:#ffa1a3}
    .mm-game .mm-camera{position:absolute;bottom:118px;left:24px;display:flex;gap:5px;align-items:center;padding:5px;border:1px solid #ffffff24;background:#0a101ddd;border-radius:13px;z-index:1}.mm-game button{font:inherit;color:#fff5e3;background:#ffffff0d;border:1px solid #ffffff12;border-radius:8px;min-width:32px;height:32px;cursor:pointer;padding:0 9px}.mm-game button:hover{background:#ffffff22}.mm-game button:focus-visible{outline:2px solid #fbbc05;outline-offset:2px}.mm-game .mm-zoom{font-size:10px;min-width:45px;text-align:center;font-variant-numeric:tabular-nums}
    .mm-game .mm-message{position:absolute;bottom:86px;left:24px;right:24px;pointer-events:none;text-align:center;font-size:12px;color:#eee7d6;text-shadow:0 2px 4px #000;z-index:1}.mm-game .mm-help{position:absolute;bottom:160px;left:26px;pointer-events:none;font-size:10px;color:#b8c8cd;text-shadow:0 1px 2px #000}.mm-game .mm-tip{position:absolute;z-index:2;pointer-events:none;background:#071422ee;border:1px solid #8adeb1;border-radius:9px;padding:8px 11px;font-size:12px;transform:translate(-50%,-115%);max-width:75%;overflow-wrap:anywhere}.mm-game [hidden]{display:none!important}
    @media(max-width:600px){.mm-game .mm-hud{left:18px;top:68px;gap:4px;max-width:calc(100% - 36px);font-size:10px}.mm-game .mm-pill{padding:6px 8px}.mm-game .mm-camera{left:18px;bottom:122px}.mm-game .mm-help{left:20px;bottom:164px;font-size:9px}.mm-game .mm-message{font-size:10px;left:22px;right:22px;bottom:91px}}
    @media(max-height:450px){.mm-game .mm-hud{top:55px}.mm-game .mm-help{display:none}.mm-game .mm-camera{bottom:92px}.mm-game .mm-message{bottom:67px}}
  </style><canvas tabindex="0" aria-label="Large maze. Scroll to zoom; drag to pan. Plus and minus keys zoom; zero fits the maze."></canvas><div class="mm-hud"><span class="mm-pill mm-clock">READY</span><span class="mm-pill mm-cat">CAT ARRIVES IN 20s</span><details class="mm-alive"><summary class="mm-pill mm-count">${roster.length} ALIVE</summary><div class="mm-list" aria-label="Mouse health and cheese levels"></div></details><span class="mm-pill">FIRST TO EXIT SPEAKS</span></div><div class="mm-camera" aria-label="Maze camera"><button type="button" data-camera="out" aria-label="Zoom out">−</button><span class="mm-zoom">100%</span><button type="button" data-camera="in" aria-label="Zoom in">+</button><button type="button" data-camera="fit" aria-label="Fit the whole maze">Fit maze</button></div><div class="mm-help">SCROLL TO ZOOM · DRAG TO PAN · CHEESE = SPEED + POWER</div><div class="mm-message" role="status" aria-live="polite">${roster.length?'Eat cheese, dodge bugs, and reach the exit. The cat joins after 20 seconds.':'Add names to fill the maze.'}</div><div class="mm-tip" hidden></div>`;
  container.appendChild(root);
  const canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d'), clock=root.querySelector('.mm-clock'), catBadge=root.querySelector('.mm-cat'), aliveBadge=root.querySelector('.mm-count'), list=root.querySelector('.mm-list'), message=root.querySelector('.mm-message'), zoomLabel=root.querySelector('.mm-zoom'), tip=root.querySelector('.mm-tip');
  const mapCanvas=document.createElement('canvas'); mapCanvas.width=WW; mapCanvas.height=WH;
  const mc=mapCanvas.getContext('2d');
  const rand=()=>{const n=Number(random()); return Number.isFinite(n)?Math.min(.999999999,Math.max(0,n)):.5;};
  const integer=n=>Math.floor(rand()*n), shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=integer(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
  const center=i=>({x:PAD+(i%COLS+.5)*CELL,y:PAD+(Math.floor(i/COLS)+.5)*CELL});
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)), short=(s,n=14)=>Array.from(s).length>n?Array.from(s).slice(0,n-1).join('')+'…':s;
  const cellAt=(x,y)=>clamp(Math.floor((y-PAD)/CELL),0,ROWS-1)*COLS+clamp(Math.floor((x-PAD)/CELL),0,COLS-1);
  const chips=roster.map(p=>{const el=document.createElement('div'),dot=document.createElement('i'),name=document.createElement('span'),health=document.createElement('small');dot.style.background=p.color;name.textContent=p.name;el.append(dot,name,health);list.append(el);return {el,health};});
  let maze=[],mice=[],cheese=[],bugs=[],bombs=[],stains=[],particles=[],remains=[],cat=null,state='ready',destroyed=false,reported=false,round=0,winnerIndex=-1;
  let raf=0,startTime=0,simTime=0,completedAt=0,lastHud=-1,nextBomb=7,eventUntil=0,eventText='',mapDirty=true,observer=null,hover=null;
  let width=1000,height=650,dpr=1,fit=.4,camera={x:0,y:0,zoom:.4},pointers=new Map(),gesture=null;
  const bugTypes=['louse','flea','tick','beetle'];
  function neighbours(at){const x=at%COLS,y=Math.floor(at/COLS);return DIR.map(([dx,dy],d)=>{const nx=x+dx,ny=y+dy;return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&!maze[at].walls[d]?ny*COLS+nx:-1;}).filter(i=>i>=0);}
  function routeTo(from,to){if(from===to)return[from];const prev=new Int32Array(COLS*ROWS);prev.fill(-2);prev[from]=-1;const q=[from];for(let k=0;k<q.length;k++){const at=q[k];for(const next of neighbours(at)){if(prev[next]!==-2)continue;prev[next]=at;q.push(next);if(next===to){const path=[to];let n=to;while(prev[n]>=0){n=prev[n];path.push(n);}return path.reverse();}}}return[from];}
  function generateMaze(){
    maze=Array.from({length:COLS*ROWS},()=>({walls:[true,true,true,true]}));const seen=new Uint8Array(maze.length),stack=[0];seen[0]=1;
    while(stack.length){const at=stack[stack.length-1],x=at%COLS,y=Math.floor(at/COLS),options=[];DIR.forEach(([dx,dy],d)=>{const nx=x+dx,ny=y+dy,n=ny*COLS+nx;if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&!seen[n])options.push([n,d]);});if(!options.length){stack.pop();continue;}const[n,d]=options[integer(options.length)];maze[at].walls[d]=false;maze[n].walls[(d+2)%4]=false;seen[n]=1;stack.push(n);}
    for(let i=0;i<34;i++){const x=1+integer(COLS-2),y=1+integer(ROWS-2),at=y*COLS+x,d=integer(4),[dx,dy]=DIR[d];maze[at].walls[d]=false;maze[(y+dy)*COLS+x+dx].walls[(d+2)%4]=false;}
    maze[EXIT].walls[1]=false;mapDirty=true;
  }
  function distances(){const d=new Int32Array(maze.length),next=new Int32Array(maze.length);d.fill(-1);next.fill(-1);d[EXIT]=0;const q=[EXIT];for(let i=0;i<q.length;i++){for(const n of neighbours(q[i]))if(d[n]<0){d[n]=d[q[i]]+1;next[n]=q[i];q.push(n);}}return {d,next};}
  function createRoutes(){
    const {d,next}=distances();let pool=shuffle(maze.map((_,i)=>i).filter(i=>d[i]>=90&&d[i]<=125));
    if(!pool.length)pool=shuffle(maze.map((_,i)=>i).filter(i=>d[i]>60));if(!pool.length)pool=[0];
    mice=roster.map((person,i)=>{let at=pool[i%pool.length],path=[at];while(at!==EXIT&&path.length<maze.length){at=next[at];if(at<0)break;path.push(at);}const p=center(path[0]);return {person,path,segment:0,offset:0,x:p.x,y:p.y,angle:0,alive:true,damage:0,power:0,parasites:[],damageClock:0,trailClock:0,phase:rand()*TAU,speed:BASE_SPEED,shield:0,reason:'',finish:false};});
  }
  function prepareRace(){
    // Every identity has the same probability. The stage then choreographs corridors and hazards
    // around that random result; all mice begin at BASE_SPEED and cheese changes actual velocity.
    winnerIndex=integer(mice.length);
    mice.forEach((m,i)=>{
      if(i!==winnerIndex){const original=m.path,extra=[];for(let n=0;n<3;n++){const index=Math.min(original.length-3,8+n*13);if(index<1)break;const at=original[index],choices=neighbours(at).filter(x=>x!==original[index+1]);if(choices.length){const side=choices[integer(choices.length)];extra.push({index,side});}}
        for(const e of extra.reverse())m.path.splice(e.index+1,0,e.side,m.path[e.index]);
      }
      const step=i===winnerIndex?Math.max(5,Math.floor(m.path.length/13)):Math.max(9,Math.floor(m.path.length/9));
      for(let j=3;j<m.path.length-2;j+=step){const p=center(m.path[j]);cheese.push({x:p.x,y:p.y,cell:m.path[j],eaten:false,shield:i===winnerIndex&&j===3,phase:rand()*TAU});}
      const visits=i===winnerIndex?2:4+integer(5);
      for(let n=0;n<visits;n++){const j=clamp(18+integer(Math.max(1,m.path.length-25)),1,m.path.length-4),p=center(m.path[j]);bugs.push({x:p.x+(rand()-.5)*13,y:p.y+(rand()-.5)*13,cell:m.path[j],type:bugTypes[integer(4)],phase:rand()*TAU,active:true});}
    });
    // Scenic items make a zoomed-out overview readable as well as filling unvisited branches.
    for(let n=0;n<70;n++){const cell=integer(maze.length),p=center(cell);cheese.push({x:p.x,y:p.y,cell,eaten:false,shield:false,phase:rand()*TAU});}
    for(let n=0;n<45;n++){const cell=integer(maze.length),p=center(cell);bugs.push({x:p.x,y:p.y,cell,type:bugTypes[integer(4)],phase:rand()*TAU,active:true});}
  }
  function paintMap(){
    if(!mc||!mapDirty)return;mapDirty=false;
    mc.fillStyle='#122029';mc.fillRect(0,0,WW,WH);mc.fillStyle='#1f3034';mc.fillRect(PAD-14,PAD-14,COLS*CELL+28,ROWS*CELL+28);
    const g=mc.createLinearGradient(0,0,WW,WH);g.addColorStop(0,'#263a36');g.addColorStop(1,'#172730');mc.fillStyle=g;mc.fillRect(PAD,PAD,COLS*CELL,ROWS*CELL);
    mc.strokeStyle='#ffffff08';mc.lineWidth=1;mc.beginPath();for(let x=0;x<=COLS;x++){mc.moveTo(PAD+x*CELL,PAD);mc.lineTo(PAD+x*CELL,PAD+ROWS*CELL);}for(let y=0;y<=ROWS;y++){mc.moveTo(PAD,PAD+y*CELL);mc.lineTo(PAD+COLS*CELL,PAD+y*CELL);}mc.stroke();
    const walls=(color,line)=>{mc.beginPath();maze.forEach((c,i)=>{const x=PAD+i%COLS*CELL,y=PAD+Math.floor(i/COLS)*CELL;if(c.walls[0]){mc.moveTo(x,y);mc.lineTo(x+CELL,y);}if(c.walls[3]){mc.moveTo(x,y);mc.lineTo(x,y+CELL);}if(i%COLS===COLS-1&&c.walls[1]){mc.moveTo(x+CELL,y);mc.lineTo(x+CELL,y+CELL);}if(i>=COLS*(ROWS-1)&&c.walls[2]){mc.moveTo(x,y+CELL);mc.lineTo(x+CELL,y+CELL);}});mc.strokeStyle=color;mc.lineWidth=line;mc.lineCap='round';mc.stroke();};
    walls('#091b20',8);walls('#83aaa0',3);walls('#c3c99a',.7);
    const p=center(EXIT);mc.fillStyle='#92eb9d';mc.fillRect(PAD+COLS*CELL-4,p.y-CELL/2+3,9,CELL-6);mc.font='bold 18px system-ui';mc.fillStyle='#bbefac';mc.fillText('EXIT',PAD+COLS*CELL+19,p.y-31);
    mc.font='bold 14px system-ui';mc.fillStyle='#709487';mc.fillText('THE CHEESE CHASE',PAD,PAD-23);mc.textAlign='right';mc.fillText('43 × 29 CORRIDORS',PAD+COLS*CELL,PAD-23);mc.textAlign='left';
  }
  function say(text,seconds=2.5){eventText=text;eventUntil=simTime+seconds;}
  function splatter(x,y,severity=1){
    for(let i=0;i<7*severity;i++){const angle=rand()*TAU,dist=rand()*60*severity;stains.push({x:x+Math.cos(angle)*dist,y:y+Math.sin(angle)*dist,r:2+rand()*5*severity,angle:rand()*TAU});}
    if(stains.length>600)stains.splice(0,stains.length-600);
  }
  function burst(x,y,type='blood',count=28){for(let i=0;i<count;i++){const a=rand()*TAU,speed=30+rand()*(type==='bomb'?280:140);particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-30,life:.6+rand()*1.8,age:0,size:2+rand()*6,type,angle:rand()*TAU,spin:(rand()-.5)*10});}if(particles.length>650)particles.splice(0,particles.length-650);}
  function kill(mouse,reason){
    if(!mouse.alive)return;
    if(mouse.shield>0){mouse.shield--;mouse.damage=Math.min(17,mouse.damage);burst(mouse.x,mouse.y,'spark',16);say(`${short(mouse.person.name)}'s cheese shield blocked ${reason}!`);return;}
    if(mouse===mice[winnerIndex]){mouse.shield=1;mouse.damage=17;burst(mouse.x,mouse.y,'spark',12);return;}
    mouse.alive=false;mouse.reason=reason;mouse.damage=DAMAGE_LEVELS;splatter(mouse.x,mouse.y,reason==='bomb'?3:2);burst(mouse.x,mouse.y,reason==='bomb'?'bomb':'blood',reason==='bomb'?44:28);
    remains.push({x:mouse.x,y:mouse.y,angle:mouse.angle,color:mouse.person.color,reason,time:simTime});
    if(reason==='bomb'){['heart','liver','kidney','eye','ear','tail'].forEach((type,i)=>particles.push({x:mouse.x,y:mouse.y,vx:(rand()-.5)*440,vy:(rand()-.5)*320,age:0,life:3.4,size:7+rand()*5,type,angle:i,spin:(rand()-.5)*8}));}
    say(`${short(mouse.person.name)} ${reason==='cat'?'was caught by the cat':reason==='bugs'?'lost the battle with the bugs':'hit a tiny bomb'}. ${mice.filter(m=>m.alive).length} still racing.`);
  }
  function moveAlong(mouse,distance){
    while(distance>0&&mouse.segment<mouse.path.length-1){const a=center(mouse.path[mouse.segment]),b=center(mouse.path[mouse.segment+1]),length=Math.hypot(b.x-a.x,b.y-a.y),remaining=length-mouse.offset,take=Math.min(distance,remaining);mouse.offset+=take;distance-=take;mouse.angle=Math.atan2(b.y-a.y,b.x-a.x);const t=mouse.offset/length;mouse.x=a.x+(b.x-a.x)*t;mouse.y=a.y+(b.y-a.y)*t;if(mouse.offset>=length-.0001){mouse.segment++;mouse.offset=0;}}
  }
  function spawnBomb(){
    const targets=mice.filter(m=>m.alive&&m!==mice[winnerIndex]);if(!targets.length)return;
    const m=targets[integer(targets.length)],fuse=1.1+rand()*1.1,ahead=Math.max(2,Math.round((m.speed*fuse+m.offset)/CELL)),cell=m.path[Math.min(m.path.length-2,m.segment+ahead)],p=center(cell);
    bombs.push({x:p.x,y:p.y,cell,born:simTime,fuse,exploded:false});say('A tiny bomb appeared. Watch the flashing red ring!',1.7);
  }
  function updateCat(dt){
    if(!cat&&simTime>=CAT_TIME){const candidates=mice.filter(m=>m.alive),target=candidates[integer(candidates.length)]||mice[winnerIndex];if(!target)return;const cell=target.path[Math.max(0,target.segment-3)],p=center(cell);cat={x:p.x,y:p.y,cell,path:[],segment:0,offset:0,routeClock:0,angle:0,swipe:0,cooldown:0,target:null};burst(p.x,p.y,'spark',14);say('THE CAT IS HERE! Keep moving and grab cheese shields.',3);}
    if(!cat)return;cat.cooldown=Math.max(0,cat.cooldown-dt);cat.swipe=Math.max(0,cat.swipe-dt);cat.routeClock-=dt;
    if(cat.routeClock<=0){const alive=mice.filter(m=>m.alive);cat.target=alive.reduce((best,m)=>!best||Math.hypot(m.x-cat.x,m.y-cat.y)<Math.hypot(best.x-cat.x,best.y-cat.y)?m:best,null);if(cat.target){cat.cell=cellAt(cat.x,cat.y);const p=center(cat.cell);cat.x=p.x;cat.y=p.y;cat.path=routeTo(cat.cell,cellAt(cat.target.x,cat.target.y));cat.segment=0;cat.offset=0;}cat.routeClock=1.4;}
    if(cat.path.length>1)moveAlong(cat,dt*(simTime>29?420:270));
    if(cat.cooldown===0){for(const m of mice){if(!m.alive||Math.hypot(m.x-cat.x,m.y-cat.y)>37)continue;cat.angle=Math.atan2(m.y-cat.y,m.x-cat.x);cat.swipe=1.1;cat.cooldown=1.9;for(let i=0;i<5;i++){const a=cat.angle+i*.14;particles.push({x:m.x+Math.cos(a)*i*4,y:m.y+Math.sin(a)*i*4,vx:0,vy:0,age:0,life:1.4,size:32+i*3,type:'scratch',angle:a,spin:0});}m.damage=Math.min(19,m.damage+8);splatter(m.x,m.y,1);kill(m,'cat');break;}}
  }
  function simulate(dt){
    simTime+=dt;
    for(const m of mice){
      if(!m.alive||m.finish)continue;
      const sprint=simTime>35?1+(simTime-35)*.12:1;m.speed=BASE_SPEED*(1+m.power*.16)*Math.max(.65,1-m.parasites.length*.045)*sprint;
      // Nonwinning routes linger at the final junction, preserving a uniformly random name result.
      if(m!==mice[winnerIndex]&&m.segment>=m.path.length-3){m.phase+=dt;continue;}
      moveAlong(m,m.speed*dt);
      for(const c of cheese){if(c.eaten||Math.abs(c.x-m.x)>25||Math.abs(c.y-m.y)>25||Math.hypot(c.x-m.x,c.y-m.y)>23)continue;c.eaten=true;m.power=Math.min(POWER_LEVELS,m.power+1);m.damage=Math.max(0,m.damage-2);if(c.shield||m.power%5===0)m.shield=Math.max(m.shield,2);if(m.parasites.length&&m.power%3===0)m.parasites.shift();burst(m.x,m.y,'spark',6);if(m.power===POWER_LEVELS)say(`${short(m.person.name)} reached CHEESE POWER 12!`);}
      if(simTime>4)for(const b of bugs){if(!b.active||m.parasites.length>=4||Math.abs(b.x-m.x)>21||Math.abs(b.y-m.y)>21||Math.hypot(b.x-m.x,b.y-m.y)>20)continue;b.active=false;m.parasites.push({type:b.type,phase:b.phase});say(`${short(m.person.name)} picked up a ${b.type}. Cheese can shake bugs off.`,1.4);}
      if(m.parasites.length){m.damageClock+=dt*m.parasites.length;if(m.damageClock>=.92){m.damageClock-=.92;m.damage=Math.min(DAMAGE_LEVELS,m.damage+1);if(m.damage>3)splatter(m.x,m.y,1);if(m.damage>=DAMAGE_LEVELS)kill(m,'bugs');}}
      m.trailClock+=dt;if(m.damage>=6&&m.trailClock>.35){m.trailClock=0;stains.push({x:m.x+(rand()-.5)*15,y:m.y+(rand()-.5)*15,r:2+rand()*3,angle:rand()*TAU});if(stains.length>600)stains.shift();}
      if(m.segment>=m.path.length-1&&m===mice[winnerIndex]&&simTime>=EXIT_OPEN_TIME){const exit=center(EXIT);m.x=exit.x+CELL*.85;m.y=exit.y;m.finish=true;finish('exit');break;}
    }
    if(state!=='running')return;
    if(simTime>=nextBomb){spawnBomb();nextBomb=simTime+4.5+rand()*3.5;}
    for(const b of bombs){if(b.exploded||simTime-b.born<b.fuse)continue;b.exploded=true;burst(b.x,b.y,'bomb',28);splatter(b.x,b.y,1);for(const m of mice)if(m.alive&&Math.hypot(m.x-b.x,m.y-b.y)<CELL*.73)kill(m,'bomb');}
    updateCat(dt);
    const alive=mice.filter(m=>m.alive);
    if(!alive.length){finish('last survivor');return;}
    if(simTime>=ROUND_LIMIT-.0001){simTime=ROUND_LIMIT;const m=mice[winnerIndex];if(m?.alive){const p=center(EXIT);m.x=p.x+CELL*.85;m.y=p.y;m.finish=true;burst(m.x,m.y,'spark',30);finish('exit beacon');}else finish('last survivor');}
  }
  function finish(reason){
    if(state!=='running')return;state='done';completedAt=performance.now();const winner=mice[winnerIndex]||mice.find(m=>m.alive)||mice[mice.length-1];if(!winner)return;
    winnerIndex=mice.indexOf(winner);winner.finish=true;burst(winner.x,winner.y,'spark',45);
    message.textContent=reason==='last survivor'?`${winner.person.name} was the last survivor and speaks first.`:reason==='exit beacon'?`${winner.person.name} followed the exit beacon to safety and speaks first!`:`${winner.person.name} reached the exit and speaks first!`;
    canvas.setAttribute('aria-label',message.textContent);updateHud();
  }
  function updateHud(){
    clock.textContent=state==='ready'?`ROUND ${round} · READY`:state==='done'?`${simTime.toFixed(1)}s · SAFE!`:`${simTime.toFixed(1)}s`;
    const incoming=Math.max(0,Math.ceil(CAT_TIME-simTime));catBadge.textContent=cat?'CAT ON THE HUNT':`CAT ARRIVES IN ${incoming}s`;catBadge.classList.toggle('mm-danger',!!cat);
    aliveBadge.textContent=`${mice.filter(m=>m.alive).length} / ${mice.length} ALIVE`;
    mice.forEach((m,i)=>{chips[i].el.classList.toggle('mm-dead',!m.alive);chips[i].health.textContent=m.alive?`LV ${m.power} · ${Math.max(0,100-m.damage*5)}% HP`:`${m.reason.toUpperCase()}`;});
    if(state==='running')message.textContent=simTime<eventUntil?eventText:cat?(simTime<EXIT_OPEN_TIME?`The cat is hunting! The exit gate opens in ${Math.ceil(EXIT_OPEN_TIME-simTime)}s.`:'Exit gate open! Cheese adds speed, size, glowing power and shields.'):'All mice start at the same speed. Cheese adds speed, size and glowing power.';
  }
  function ellipse(x,y,rx,ry,color,angle=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),angle,0,TAU);ctx.fill();}
  function cheeseSprite(c,time,scale=1){ctx.save();ctx.translate(c.x,c.y);ctx.scale(scale,scale);const bob=Math.sin(time*3+c.phase)*1.2;ctx.translate(0,bob);if(c.shield){ctx.strokeStyle='#8fcfff';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(0,0,15+Math.sin(time*3)*2,0,TAU);ctx.stroke();}ctx.fillStyle='#f3a722';ctx.beginPath();ctx.moveTo(-9,7);ctx.lineTo(10,7);ctx.lineTo(10,-7);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe178';ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(10,-7);ctx.lineTo(1,-13);ctx.closePath();ctx.fill();ellipse(-4,4,2.3,2,'#c47a21');ellipse(5,1,2.4,2.4,'#c47a21');ellipse(3,-6,2.2,1.4,'#e4ac39');ctx.restore();}
  function bugSprite(type,x,y,time,size=1,phase=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(phase+Math.sin(time*5+phase)*.13);ctx.scale(size,size);
    const color=type==='tick'?'#c23238':type==='flea'?'#9f5c2b':type==='beetle'?'#4ea97b':'#c6b788';ctx.strokeStyle='#070d10';ctx.lineWidth=1.2;const legs=type==='tick'?4:3;
    for(let side=-1;side<=1;side+=2)for(let i=0;i<legs;i++){const y=(i-legs/2)*3,w=type==='flea'?9:7;ctx.beginPath();ctx.moveTo(side*3,y);ctx.lineTo(side*w,y+Math.sin(time*8+i+side)*2);ctx.lineTo(side*(w+2),y+4);ctx.stroke();}
    ellipse(0,1,type==='tick'?5.8:4,type==='flea'?6:5.5,color);ellipse(0,-5,2.7,2.6,'#171e18');if(type==='beetle'){ctx.strokeStyle='#96edaa';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(0,6);ctx.stroke();ellipse(-2,1,1,2,'#a7ffc2');}if(type==='louse'){ctx.strokeStyle='#80764d';ctx.lineWidth=.8;for(let y=-1;y<5;y+=2){ctx.beginPath();ctx.moveTo(-3,y);ctx.lineTo(3,y);ctx.stroke();}}ellipse(-1,-5.7,.6,.6,'#eec45d');ellipse(1,-5.7,.6,.6,'#eec45d');ctx.restore();
  }
  function mouseSprite(m,time){
    const power=clamp(m.power,0,POWER_LEVELS),damage=clamp(Math.floor(m.damage),0,DAMAGE_LEVELS),fat=1+power*.055;
    ctx.save();ctx.translate(m.x,m.y);
    if(power){const hue=power<4?'#ffd659':power<8?'#70eaff':'#cf9bff';ctx.globalAlpha=.22+power*.02;ctx.fillStyle=hue;ctx.beginPath();for(let i=0;i<28;i++){const a=i/28*TAU,r=(22+power*1.45)*(1+Math.sin(time*9+i*2)*.12);const x=Math.cos(a)*r,y=Math.sin(a)*r*.78;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=hue;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,23+power*.9,time*2,time*2+Math.PI*1.3);ctx.stroke();if(power>=8){ctx.lineWidth=1;for(let i=0;i<3;i++){const a=time*4+i*TAU/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*20,Math.sin(a)*20);ctx.lineTo(Math.cos(a+.15)*34,Math.sin(a+.15)*34);ctx.lineTo(Math.cos(a-.1)*28,Math.sin(a-.1)*28);ctx.stroke();}}}
    if(m.shield){ctx.strokeStyle='#72d8ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,24+power*.6,0,TAU);ctx.stroke();}
    ctx.rotate(m.angle);const step=Math.sin(time*22+m.phase)*2.5,bodyColor=damage>=15?'#b65e65':m.person.color;
    ctx.strokeStyle=damage>13?'#b53544':'#de9f9f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-11,1);ctx.bezierCurveTo(-20,4+step,-24,-11+step,-31,-4+step);ctx.stroke();
    ellipse(0,5,17*fat,9*fat,'#0005');for(const[x,y]of[[-8,-8-step],[4,-7+step],[-8,8+step],[4,7-step]])ellipse(x,y,3,2,'#e6aead');
    ellipse(-3,0,14*fat,9*fat,bodyColor);ellipse(10,0,10,7,damage>=16?'#ba7780':'#ece4ce');
    for(let side=-1;side<=1;side+=2){const earDamage=damage>=4+(side>0?4:0),radius=earDamage?Math.max(1.5,5.5-(damage-(side>0?8:4))*.19):5.5;ellipse(4,side*8,radius,radius,earDamage?'#dfb6a2':'#ece4ce');ellipse(4,side*8,radius*.62,radius*.62,earDamage?'#a32635':'#e4a4a9');if(earDamage){ctx.fillStyle='#172730';ctx.beginPath();ctx.moveTo(4,side*8-radius);ctx.lineTo(8,side*8-radius*.3);ctx.lineTo(6,side*8+radius*.3);ctx.closePath();ctx.fill();}}
    ellipse(13,-3,1.5,1.7,'#17202c');if(damage<17)ellipse(13,3,1.5,1.7,'#17202c');else{ctx.strokeStyle='#bb5566';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(13,3);ctx.bezierCurveTo(17,9,24,7+step,26,15+step);ctx.stroke();ellipse(26,15+step,3.5,3.5,'#fff2df');ellipse(27,15+step,1.5,1.8,'#e63c55');}
    ellipse(20,0,2.1,2,'#ee9297');ctx.strokeStyle='#e4dccd';ctx.lineWidth=.8;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(17,side*2);ctx.lineTo(26,side*6);ctx.moveTo(17,side*2);ctx.lineTo(27,side*2.3);ctx.stroke();}
    // Twenty visual damage states: each adds a wound, with bitten ears, torn fur and a dangling eye.
    for(let i=0;i<damage;i++){const x=-12+(i*7)%26,y=-6+(i*5)%12;ctx.strokeStyle=i>13?'#ffc4b5':'#a21835';ctx.lineWidth=1.2+(i%3)*.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3+(i%3),y-2.5);ctx.stroke();if(i%4===0)ellipse(x,y,1.8,1.2,'#c62f46');}
    if(damage>=12){ctx.fillStyle='#172730';ctx.beginPath();ctx.moveTo(-14,-5);ctx.lineTo(-8,-4);ctx.lineTo(-10,0);ctx.lineTo(-14,2);ctx.fill();}if(damage>=18){ctx.strokeStyle='#e6cfb4';ctx.lineWidth=1.3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-9+i*3,-3);ctx.lineTo(-10+i*3,4);ctx.stroke();}}
    m.parasites.forEach((b,i)=>bugSprite(b.type,-8+i*5,((i%2)*2-1)*6,time,.48,b.phase));ctx.restore();
  }
  function label(m){
    const detailed=roster.length<=16||camera.zoom>fit*1.8||hover===m||m.finish;
    ctx.save();ctx.font=`600 ${detailed?12:10}px system-ui`;ctx.textAlign='center';const text=detailed?`${short(m.person.name,camera.zoom>fit*2?25:14)} · LV${m.power}`:String(m.person.number),w=ctx.measureText(text).width+12,y=m.y-(26+m.power*.6);ctx.fillStyle='#071621ed';ctx.strokeStyle=m.finish?'#a9fa9d':m.person.color;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(m.x-w/2,y-13,w,18,5);ctx.fill();ctx.stroke();ctx.fillStyle='#fff4dc';ctx.fillText(text,m.x,y);if(detailed&&m.damage){ctx.fillStyle='#38202a';ctx.fillRect(m.x-19,y+9,38,3);ctx.fillStyle='#f36074';ctx.fillRect(m.x-19,y+9,38*(1-m.damage/DAMAGE_LEVELS),3);}ctx.restore();
  }
  function catSprite(time){
    if(!cat)return;ctx.save();ctx.translate(cat.x,cat.y);ctx.rotate(cat.angle);const step=Math.sin(time*17)*4;
    ctx.strokeStyle='#cf9663';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-23,0);ctx.bezierCurveTo(-43,9,-48,-20+step,-36,-28+step);ctx.stroke();ellipse(-7,5,32,17,'#0006');ellipse(-8,0,26,17,'#bd8a52');ellipse(19,0,16,15,'#d5a363');
    ctx.fillStyle='#ba8556';for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(10,side*11);ctx.lineTo(19,side*25);ctx.lineTo(29,side*11);ctx.fill();ellipse(20,side*15,4,4,'#a34759');ellipse(26,side*5,4,3,'#baf963');ellipse(27,side*5,1.1,2.8,'#0b1619');ellipse(-16,side*(16+step*.4),8,4,'#d5a363');ellipse(19,side*(15-step*.4),8,4,'#d5a363');}
    ellipse(35,0,3,3,'#dc7d8c');ctx.strokeStyle='#edd3b3';ctx.lineWidth=1.2;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(32,side*5);ctx.lineTo(48,side*11);ctx.moveTo(32,side*5);ctx.lineTo(49,side*5);ctx.stroke();}
    if(cat.swipe){ctx.strokeStyle='#f7dad1';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(24+i*3,0,36+i*4,-.85+Math.sin(time*40)*.14,.85);ctx.stroke();}ctx.font='bold 13px system-ui';ctx.fillStyle='#ff929a';ctx.fillText('SCRATCH!',-20,-37);}
    ctx.restore();
  }
  function organSprite(p){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(p.size/10,p.size/10);
    if(p.type==='heart'){ctx.fillStyle='#e94969';ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-16,0,-12,-12,-4,-9);ctx.bezierCurveTo(-1,-9,0,-6,0,-5);ctx.bezierCurveTo(6,-15,17,-6,11,2);ctx.closePath();ctx.fill();ctx.strokeStyle='#ff9caf';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-2,-6);ctx.lineTo(-5,2);ctx.lineTo(0,7);ctx.stroke();}
    else if(p.type==='liver'){ellipse(0,0,13,7,'#8b344f',-.25);ellipse(9,4,5,5,'#ab4760');ctx.strokeStyle='#d27289';ctx.beginPath();ctx.moveTo(-7,-2);ctx.bezierCurveTo(2,5,5,-3,10,-2);ctx.stroke();}
    else if(p.type==='kidney'){ctx.fillStyle='#c0516a';ctx.beginPath();ctx.moveTo(2,-10);ctx.bezierCurveTo(-14,-12,-15,12,1,10);ctx.bezierCurveTo(10,7,-7,3,2,-1);ctx.bezierCurveTo(9,-5,7,-8,2,-10);ctx.fill();}
    else if(p.type==='eye'){ctx.strokeStyle='#b95070';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,2);ctx.bezierCurveTo(-14,9,-16,-8,-26,-3);ctx.stroke();ellipse(0,0,7,7,'#fff0d9');ellipse(3,-1,3.6,4.5,'#f65369');ellipse(4,-1,1.5,2.4,'#182331');}
    else if(p.type==='ear'){ellipse(0,0,7,9,'#dacdb4');ellipse(1,0,4,6,'#b96273');}
    else{ctx.strokeStyle='#ce858e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,0);ctx.bezierCurveTo(-3,-10,5,9,12,0);ctx.stroke();}
    ctx.restore();
  }
  function drawParticles(){
    for(const p of particles){ctx.save();ctx.globalAlpha=clamp(1-p.age/p.life,0,1);if(['heart','liver','kidney','eye','ear','tail'].includes(p.type)){organSprite(p);}else if(p.type==='scratch'){ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle='#f8b0b8';ctx.lineWidth=2;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-p.size/2,j*7);ctx.quadraticCurveTo(0,j*7-9,p.size/2,j*7);ctx.stroke();}}else if(p.type==='spark'){ctx.fillStyle='#ffdf75';ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillRect(-2,-2,p.size,p.size*.4);}else ellipse(p.x,p.y,p.size,p.size*.65,p.type==='bomb'?'#f17b43':'#db3458',p.angle);ctx.restore();}
  }
  function minimap(){
    if(width<550||height<430)return;const w=150,h=w*WH/WW,x=width-w-24,y=height-h-116,s=w/WW;
    ctx.save();ctx.fillStyle='#07121ce8';ctx.strokeStyle='#839d9a66';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-6,y-6,w+12,h+12,9);ctx.fill();ctx.stroke();ctx.fillStyle='#3b5350';ctx.fillRect(x,y,w,h);
    for(const m of mice)if(m.alive){ctx.fillStyle=m.person.color;ctx.beginPath();ctx.arc(x+m.x*s,y+m.y*s,2,0,TAU);ctx.fill();}if(cat){ctx.fillStyle='#ff637b';ctx.beginPath();ctx.arc(x+cat.x*s,y+cat.y*s,3,0,TAU);ctx.fill();}
    ctx.strokeStyle='#fff2ba';ctx.lineWidth=1;ctx.strokeRect(x-camera.x/camera.zoom*s,y-camera.y/camera.zoom*s,width/camera.zoom*s,height/camera.zoom*s);ctx.fillStyle='#c9d9d0';ctx.font='9px system-ui';ctx.textAlign='left';ctx.fillText('MAZE OVERVIEW',x,y-13);ctx.restore();
  }
  function draw(now=performance.now()){
    if(destroyed||!ctx)return;paintMap();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#101820';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(camera.x,camera.y);ctx.scale(camera.zoom,camera.zoom);ctx.drawImage(mapCanvas,0,0);
    const t=state==='running'?simTime:now/1000;
    for(const s of stains)ellipse(s.x,s.y,s.r,s.r*.6,'#b62b477d',s.angle);
    for(const c of cheese)if(!c.eaten)cheeseSprite(c,t,.7);
    for(const b of bugs)if(b.active)bugSprite(b.type,b.x,b.y,t,.85,b.phase);
    for(const r of remains){ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.angle);ellipse(-2,0,12,7,'#9d4c5e');ellipse(9,1,7,5,'#c09c8b');ctx.strokeStyle='#e67b88';ctx.lineWidth=1.5;for(let j=0;j<5;j++){ctx.beginPath();ctx.moveTo(-13+j*5,-5);ctx.lineTo(-8+j*5,5);ctx.stroke();}ctx.restore();organSprite({x:r.x+22,y:r.y+12,type:'eye',size:5,angle:.5});}
    for(const b of bombs)if(!b.exploded){const remaining=b.fuse-(simTime-b.born),pulse=Math.sin(t*20);ctx.save();ctx.translate(b.x,b.y);ctx.strokeStyle=pulse>0?'#ff6376':'#8e3a41';ctx.lineWidth=1.8;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(0,0,CELL*.73,0,TAU);ctx.stroke();ctx.setLineDash([]);ellipse(0,0,8,8,'#151923');ctx.strokeStyle='#ffad57';ctx.beginPath();ctx.moveTo(3,-7);ctx.quadraticCurveTo(3,-16,11,-13);ctx.stroke();ellipse(11,-13,3+Math.max(0,pulse)*2,3,'#ffd178');ctx.fillStyle='#ffcfbd';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(Math.max(0,remaining).toFixed(1),0,23);ctx.restore();}
    mice.filter(m=>m.alive).forEach(m=>mouseSprite(m,t));catSprite(t);drawParticles();mice.filter(m=>m.alive).forEach(label);
    const exit=center(EXIT);cheeseSprite({x:exit.x+CELL*1.15,y:exit.y,phase:0,shield:true},t,1.5);
    if(state==='running'&&simTime<EXIT_OPEN_TIME){ctx.strokeStyle='#ff7b82';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(exit.x+CELL/2,exit.y-CELL/2+3);ctx.lineTo(exit.x+CELL/2,exit.y+CELL/2-3);ctx.stroke();ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffbac0';ctx.fillText(`OPENS ${Math.ceil(EXIT_OPEN_TIME-simTime)}s`,exit.x+CELL*.95,exit.y+35);}
    if(state==='done'){const winner=mice[winnerIndex];if(winner){ctx.strokeStyle='#d8ff9f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(winner.x,winner.y,36+Math.sin(t*8)*3,0,TAU);ctx.stroke();}}
    ctx.restore();minimap();
  }
  function updateEffects(dt){particles.forEach(p=>{p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-1.7*dt);p.vy*=Math.exp(-1.7*dt);p.angle+=p.spin*dt;});particles=particles.filter(p=>p.age<p.life);}
  function frame(now){
    raf=0;if(destroyed)return;
    if(state==='running'){const target=Math.min(ROUND_LIMIT,(now-startTime)/1000);while(simTime<target-.00001&&state==='running'){const dt=Math.min(.05,target-simTime);simulate(dt);updateEffects(dt);}if(simTime-lastHud>.35){lastHud=simTime;updateHud();}}
    else if(state==='done')updateEffects(.016);
    draw(now);
    if(state==='done'&&!reported&&now-completedAt>=1100){reported=true;onPick(mice[winnerIndex].person.id);if(destroyed||state!=='done')return;}
    if(state==='running'||state==='done'&&now-completedAt<1500)raf=requestAnimationFrame(frame);
  }
  function clampCamera(){const margin=width*.2;camera.x=clamp(camera.x,width-WW*camera.zoom-margin,margin);camera.y=clamp(camera.y,height-WH*camera.zoom-height*.2,height*.2);zoomLabel.textContent=`${Math.round(camera.zoom/fit*100)}%`;}
  function fitCamera(){const usableH=Math.max(100,height-140);fit=Math.min((width-46)/WW,usableH/WH);fit=Math.max(.05,fit);camera.zoom=fit;camera.x=(width-WW*fit)/2;camera.y=74+(usableH-WH*fit)/2;clampCamera();draw();}
  function zoomAt(factor,x=width/2,y=height/2){const before=camera.zoom,next=clamp(before*factor,fit*.65,fit*7);const wx=(x-camera.x)/before,wy=(y-camera.y)/before;camera.zoom=next;camera.x=x-wx*next;camera.y=y-wy*next;clampCamera();draw();}
  function resize(){if(destroyed)return;const oldW=width,oldH=height,oldFit=fit,rect=canvas.getBoundingClientRect(),wasFit=Math.abs(camera.zoom/fit-1)<.02;width=Math.max(1,rect.width||1000);height=Math.max(1,rect.height||650);dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(wasFit)fitCamera();else{fit=Math.max(.05,Math.min((width-46)/WW,Math.max(100,height-140)/WH));const ratio=fit/oldFit;camera.zoom*=ratio;camera.x=width/2+(camera.x-oldW/2)*ratio;camera.y=height/2+(camera.y-oldH/2)*ratio;clampCamera();draw();}}
  function local(event){const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};}
  function pointerDown(e){if(e.button!==undefined&&e.button!==0)return;const p=local(e);pointers.set(e.pointerId,p);canvas.setPointerCapture?.(e.pointerId);canvas.classList.add('mm-dragging');hover=null;tip.hidden=true;gesture=pointers.size>=2?pinchState():{x:p.x,y:p.y,cx:camera.x,cy:camera.y,moved:false};}
  function pinchState(){const a=[...pointers.values()].slice(0,2);return {pinch:true,distance:Math.max(1,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)),x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,zoom:camera.zoom,cx:camera.x,cy:camera.y};}
  function pointerMove(e){const p=local(e);if(pointers.has(e.pointerId)){pointers.set(e.pointerId,p);if(pointers.size>=2){if(!gesture?.pinch)gesture=pinchState();const a=[...pointers.values()].slice(0,2),x=(a[0].x+a[1].x)/2,y=(a[0].y+a[1].y)/2,d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),next=clamp(gesture.zoom*d/gesture.distance,fit*.65,fit*7);camera.zoom=next;camera.x=x-(gesture.x-gesture.cx)/gesture.zoom*next;camera.y=y-(gesture.y-gesture.cy)/gesture.zoom*next;}else{if(!gesture||gesture.pinch)gesture={x:p.x,y:p.y,cx:camera.x,cy:camera.y};camera.x=gesture.cx+p.x-gesture.x;camera.y=gesture.cy+p.y-gesture.y;}clampCamera();draw();return;}
    const wx=(p.x-camera.x)/camera.zoom,wy=(p.y-camera.y)/camera.zoom;hover=mice.filter(m=>m.alive).reduce((best,m)=>Math.hypot(m.x-wx,m.y-wy)<22&&(!best||Math.hypot(m.x-wx,m.y-wy)<Math.hypot(best.x-wx,best.y-wy))?m:best,null);tip.hidden=!hover;if(hover){tip.textContent=`${hover.person.name} · cheese power ${hover.power}/${POWER_LEVELS} · damage ${hover.damage}/${DAMAGE_LEVELS}${hover.shield?' · shield active':''}`;tip.style.left=`${clamp(p.x,80,width-80)}px`;tip.style.top=`${clamp(p.y,70,height-50)}px`;}if(state!=='running')draw();}
  function pointerUp(e){pointers.delete(e.pointerId);try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}if(!pointers.size){gesture=null;canvas.classList.remove('mm-dragging');}else{const p=[...pointers.values()][0];gesture={x:p.x,y:p.y,cx:camera.x,cy:camera.y};}}
  function leave(){if(!pointers.size){hover=null;tip.hidden=true;if(state!=='running')draw();}}
  function wheel(e){e.preventDefault();const p=local(e);zoomAt(Math.exp(-clamp(e.deltaY,-160,160)*.003),p.x,p.y);}
  function key(e){if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(1.3);}else if(e.key==='-'){e.preventDefault();zoomAt(1/1.3);}else if(e.key==='0'){e.preventDefault();fitCamera();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();camera.x+=e.key==='ArrowLeft'?45:e.key==='ArrowRight'?-45:0;camera.y+=e.key==='ArrowUp'?45:e.key==='ArrowDown'?-45:0;clampCamera();draw();}}
  function cameraClick(e){const action=e.target.closest('[data-camera]')?.dataset.camera;if(action==='fit')fitCamera();if(action==='in')zoomAt(1.3);if(action==='out')zoomAt(1/1.3);}
  function start(){if(destroyed||state!=='ready'||!mice.length)return;prepareRace();state='running';startTime=performance.now();simTime=0;lastHud=-1;message.textContent='The cheese chase begins. All mice start at the same speed.';updateHud();draw();raf=requestAnimationFrame(frame);}
  function reset(){if(destroyed)return;cancelAnimationFrame(raf);raf=0;state='ready';reported=false;winnerIndex=-1;simTime=0;completedAt=0;lastHud=-1;nextBomb=6+rand()*3;cheese=[];bugs=[];bombs=[];stains=[];particles=[];remains=[];cat=null;hover=null;tip.hidden=true;round++;generateMaze();createRoutes();
    // The preview already includes cheese and insects; Start rerandomizes their race placements.
    for(let n=0;n<75;n++){const cell=integer(maze.length),p=center(cell);cheese.push({...p,cell,eaten:false,shield:false,phase:rand()*TAU});}for(let n=0;n<32;n++){const cell=integer(maze.length),p=center(cell);bugs.push({...p,cell,active:true,type:bugTypes[integer(4)],phase:rand()*TAU});}
    message.textContent=roster.length?'Eat cheese, dodge bugs, and reach the exit. The cat joins after 20 seconds.':'Add names to fill the maze.';canvas.setAttribute('aria-label',`Round ${round}: a 43 by 29 maze with ${mice.length} mice. Scroll to zoom and drag to pan.`);updateHud();fitCamera();}
  function destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener('resize',resize);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('keydown',key);root.removeEventListener('click',cameraClick);pointers.clear();root.remove();mice=[];maze=[];particles=[];cheese=[];bugs=[];bombs=[];stains=[];remains=[];mapCanvas.width=1;mapCanvas.height=1;}
  canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('keydown',key);root.addEventListener('click',cameraClick);
  if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(resize);observer.observe(canvas);}else window.addEventListener('resize',resize);
  reset();resize();return {start,reset,destroy};
}