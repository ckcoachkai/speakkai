import { PacEngine } from './pacman-engine.js?v=20261013-garden';

// Native Speaker Arcade adapter. The maze, movement, power rules and collision
// outcomes stay in the verified original engine; this module owns only its UI.
const {MAP,DIRS,COLORS,W,H,Engine}=PacEngine;
const PM_TILE=24,PM_MARGIN=8,PM_STEP=1/60,PM_TAU=Math.PI*2;
const PM_SOUND_NAMES=['beginning','chomp','eatghost','eatfruit','extrapac','intermission','death'];
const PM_GHOST_MASK=['00000111100000','00011111111000','00111111111100','01111111111110','01111111111110','11111111111111','11111111111111','11111111111111','11111111111111','11111111111111','11111111111111','11111111111111','11011100111011','10001100110001'];
const PM_KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
const PM_CLAMP=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

export default function createGame({container,names=[],onPick,onStart,onFinish,random=Math.random,sound=false,mode='picker',character='kai',artwork={}}={}){
  const normal=mode==='normal',chosenCharacter=character==='pacman'?'pacman':'kai';
  const seen=new Set(),students=[];
  for(const item of Array.isArray(names)?names:[]){
    if(!item||item.id===null||item.id===undefined)continue;
    const id=String(item.id),name=String(item.name??'').trim().slice(0,120);
    if(!id||!name||seen.has(id)||students.length>=60)continue;
    seen.add(id);students.push({id,name,color:COLORS[students.length%COLORS.length]});
  }
  const rng=()=>PM_CLAMP(Number(random())||0,0,1-Number.EPSILON);
  const normalGhosts=[{id:'blinky',name:'Blinky'},{id:'pinky',name:'Pinky'},{id:'inky',name:'Inky'},{id:'clyde',name:'Clyde'}];
  const root=document.createElement('div');root.className='pacman-native';
  root.innerHTML='<style>.pacman-native{position:relative;display:flex;flex-direction:column;width:100%;height:100%;min-height:0;overflow:hidden;background:#030611;color:#f3f5ff;font:13px system-ui,sans-serif}.pacman-native [hidden]{display:none!important}.pm-hud{height:39px;flex-shrink:0;display:flex;align-items:center;gap:16px;padding:0 24px;background:#030611;font-variant-numeric:tabular-nums}.pm-score{font-size:15px;font-weight:750;letter-spacing:.04em}.pm-score small,.pm-roster small{font-size:10px;letter-spacing:.12em;color:#8692ab;margin-right:6px}.pm-roster{font-size:12px;color:#adb9d2}.pm-status{flex:1;font-size:11px;color:#96a5c3;min-width:0}.pm-power{color:#8ccaff;font-size:11px;white-space:nowrap}.pm-pause{background:#ffffff09;border:1px solid #ffffff20;color:#e6ecff;border-radius:7px;padding:5px 9px;font:11px system-ui;cursor:pointer}.pm-pause:disabled{opacity:.3;cursor:default}.pm-stage{position:relative;flex:1;min-height:0;overflow:hidden}.pm-maze{display:block;width:100%;height:100%;outline:0;touch-action:none}.pm-maze:focus-visible{outline:1px solid #638aff88;outline-offset:-4px}.pm-overlay{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;pointer-events:none}.pm-overlay-card{text-align:center;max-width:270px;border:1px solid #7ba3ff44;border-radius:15px;padding:22px 27px;background:#091122ec;box-shadow:0 18px 70px #0008;backdrop-filter:blur(6px);pointer-events:auto}.pm-overlay-card h2{font-size:23px;font-weight:750;letter-spacing:-.02em;margin:0 0 9px;color:#ffe56b}.pm-overlay-card p{font-size:12px;line-height:1.5;color:#bbc7df;margin:0}.pm-action{display:block;margin:17px auto 0;border:0;background:#ffe56b;color:#111e32;border-radius:8px;padding:10px 18px;font:750 13px system-ui;cursor:pointer}.pm-dpad{display:none;grid-template-columns:repeat(3,44px);grid-template-rows:repeat(2,44px);gap:4px;align-self:center;padding:5px 0 14px;flex-shrink:0}.pm-direction{border:1px solid #7ba3ff44;border-radius:8px;background:#18233a;color:#dce6ff;font:20px system-ui;touch-action:manipulation;cursor:pointer}.pm-direction[aria-pressed=true]{background:#35517d;color:#fff}.pm-direction:disabled{opacity:.28;cursor:default}.pm-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(pointer:coarse),(max-width:700px){.pm-dpad{display:grid}.pm-hud{padding:0 12px;gap:9px}.pm-roster{font-size:10px}.pm-status{font-size:10px}.pm-score{font-size:13px}.pm-power{font-size:10px}.pm-overlay-card{max-width:210px;padding:18px}.pm-overlay-card h2{font-size:21px}}</style><div class="pm-hud"><span class="pm-score"><small>SCORE</small><span class="pm-score-value">0</span></span><span class="pm-roster"></span><span class="pm-status"></span><span class="pm-power" hidden></span><button class="pm-pause" type="button" aria-label="Pause game">Pause</button></div><div class="pm-stage"><canvas class="pm-maze" tabindex="0" role="application" aria-label="Pac-Man maze. Use arrow keys or W A S D to steer."></canvas><div class="pm-overlay"><div class="pm-overlay-card"><h2></h2><p></p><button type="button" class="pm-action"></button></div></div></div><div class="pm-dpad" role="group" aria-label="Direction controls"></div><div class="pm-live" aria-live="polite"></div>';
  container.appendChild(root);
  const q=selector=>root.querySelector(selector),canvas=q('.pm-maze'),ctx=canvas.getContext('2d'),stage=q('.pm-stage');
  const scoreLabel=q('.pm-score-value'),rosterLabel=q('.pm-roster'),status=q('.pm-status'),power=q('.pm-power'),pauseButton=q('.pm-pause');
  const overlay=q('.pm-overlay'),title=q('.pm-overlay-card h2'),detail=q('.pm-overlay-card p'),action=q('.pm-action'),live=q('.pm-live'),dpad=q('.pm-dpad');
  const listeners=[],directions=new Map(),audioChannels=new Map();
  let alive=true,phase='idle',pausedPhase='running',engine=null,preview=null,capturedId=null,roundNotified=false,countdown=0,time=0,lastFrame=null,accumulator=0,raf=null;
  let committedScore=0,lives=3,extraLife=false,remainingPellets=null,soundEnabled=Boolean(sound),kaiReady=false,kaiSprite=null,touchStart=null,lastChomp=-Infinity;
  let width=1000,height=600,scale=1,offsetX=0,offsetY=0,effects=[];
  const walls=document.createElement('canvas');walls.width=W*PM_TILE+PM_MARGIN*2;walls.height=H*PM_TILE+PM_MARGIN*2;
  const wc=walls.getContext('2d');
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function listen(element,event,callback,options){element.addEventListener(event,callback,options);listeners.push(()=>element.removeEventListener(event,callback,options));}
  function announce(text){status.textContent=text;live.textContent=text;}
  function show(titleText,bodyText,buttonText=null){title.textContent=titleText;detail.textContent=bodyText;action.hidden=!buttonText;action.textContent=buttonText||'';overlay.hidden=false;}
  function engineFor(players,randomSource,pellets=null){return new Engine(players,randomSource,{mode:normal?'normal':'picker',level:1,pellets});}
  function buildPreview(){
    let seed=14917;const visualRandom=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    preview=engineFor(normal?normalGhosts:students.length?students:normalGhosts,visualRandom);
  }
  function totalScore(){return committedScore+(engine?.score||0);}
  function ensureAudio(){
    if(!soundEnabled||typeof Audio!=='function')return;
    for(const name of PM_SOUND_NAMES)if(!audioChannels.has(name)){
      const src=artwork.pacmanSounds?.[name]||'assets/pacman/pacman_'+name+'.wav';
      const channel=new Audio(src);channel.preload='auto';channel.volume=name==='chomp'?.25:.5;audioChannels.set(name,channel);
    }
  }
  function playSound(name){
    if(!alive||!soundEnabled)return false;ensureAudio();const channel=audioChannels.get(name);if(!channel)return false;
    try{channel.currentTime=0;const promise=channel.play();promise?.catch(()=>{});return true;}catch{return false;}
  }
  function stopAudio(){for(const channel of audioChannels.values()){try{channel.pause();channel.currentTime=0;}catch{}}}
  function setSound(enabled){soundEnabled=Boolean(enabled);if(!soundEnabled)stopAudio();else ensureAudio();}
  if(chosenCharacter==='kai'&&typeof Image==='function'){
    kaiSprite=new Image();kaiSprite.onload=()=>{if(alive)kaiReady=kaiSprite.naturalWidth>0&&kaiSprite.naturalHeight>0;};kaiSprite.onerror=()=>{kaiReady=false;};kaiSprite.src=artwork.pacmanKai||'assets/pacman/kai-sprite.png';
  }
  function buildWalls(){
    wc.clearRect(0,0,walls.width,walls.height);wc.save();wc.translate(PM_MARGIN,PM_MARGIN);
    const edges=[],wall=(x,y)=>y>=0&&y<H&&x>=0&&x<W&&MAP[y][x]==='#';
    MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='#')return;if(!wall(x,y-1))edges.push([[x,y],[x+1,y]]);if(!wall(x+1,y))edges.push([[x+1,y],[x+1,y+1]]);if(!wall(x,y+1))edges.push([[x+1,y+1],[x,y+1]]);if(!wall(x-1,y))edges.push([[x,y+1],[x,y]]);}));
    const starts=new Map();edges.forEach((edge,index)=>{const key=edge[0].join(',');if(!starts.has(key))starts.set(key,[]);starts.get(key).push(index);});
    const used=new Set();wc.strokeStyle='#3474f6';wc.lineWidth=2.5;wc.lineJoin='round';
    edges.forEach((edge,start)=>{
      if(used.has(start))return;let current=start;const points=[];
      while(!used.has(current)){used.add(current);points.push(edges[current][0]);const next=(starts.get(edges[current][1].join(','))||[]).find(index=>!used.has(index));if(next===undefined)break;current=next;}
      const corners=points.filter((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return(p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);});if(corners.length<3)return;
      const pairs=corners.map((p,i)=>{const a=corners[(i+corners.length-1)%corners.length],b=corners[(i+1)%corners.length],x=p[0]*PM_TILE,y=p[1]*PM_TILE;return{x,y,ax:x+Math.sign(a[0]-p[0])*5,ay:y+Math.sign(a[1]-p[1])*5,bx:x+Math.sign(b[0]-p[0])*5,by:y+Math.sign(b[1]-p[1])*5};});
      wc.beginPath();wc.moveTo(pairs[0].ax,pairs[0].ay);pairs.forEach((p,i)=>{if(i)wc.lineTo(p.ax,p.ay);wc.quadraticCurveTo(p.x,p.y,p.bx,p.by);});wc.closePath();wc.stroke();
    });
    wc.strokeStyle='#ffb8ff';wc.lineWidth=3;wc.beginPath();wc.moveTo(13*PM_TILE,12*PM_TILE);wc.lineTo(15*PM_TILE,12*PM_TILE);wc.stroke();wc.restore();
  }
  function drawGhost(g,clock,source){
    const px=(g.x+.5)*PM_TILE,py=(g.y+.5)*PM_TILE,S=1.85,x=px-7*S,y=py-7*S;
    const frightened=source.boost>0&&!g.returning,flash=frightened&&source.boost<2&&Math.floor(clock*5)%2===0;
    ctx.save();ctx.fillStyle=frightened?(flash?'#fff':'#2424ff'):g.color;
    if(!g.returning)PM_GHOST_MASK.forEach((row,iy)=>[...row].forEach((pixel,ix)=>{let yes=pixel==='1';if(iy>=12&&Math.floor(clock*8)%2)yes=(ix+iy)%5<3;if(yes)ctx.fillRect(Math.round(x+ix*S),Math.round(y+iy*S),Math.ceil(S),Math.ceil(S));}));
    if(frightened){ctx.fillStyle=flash?'#ff4242':'#fff';for(const ex of[4,9])ctx.fillRect(x+ex*S,y+5*S,2*S,2*S);ctx.strokeStyle=flash?'#ff4242':'#fff';ctx.lineWidth=S;ctx.beginPath();ctx.moveTo(x+2*S,y+10*S);for(let i=3;i<=11;i++)ctx.lineTo(x+i*S,y+(i%2?9:10)*S);ctx.stroke();}
    else{const direction=DIRS[g.dir]||[0,0];for(const ex of[3,9]){ctx.fillStyle='#fff';ctx.fillRect(x+ex*S,y+4*S,4*S,5*S);ctx.fillStyle='#2424ff';ctx.fillRect(x+(ex+1+direction[0])*S,y+(6+direction[1])*S,2*S,2*S);}}
    ctx.restore();
    if(!normal&&students.length&&g.name){
      ctx.font='600 13px system-ui';let label=g.name;if(ctx.measureText(label).width>112){while(label.length>1&&ctx.measureText(label+'…').width>112)label=label.slice(0,-1);label+='…';}
      const tw=ctx.measureText(label).width,lx=PM_CLAMP(px,tw/2+5,W*PM_TILE-tw/2-5),ly=Math.max(18,py-18);ctx.fillStyle='#030611df';ctx.fillRect(lx-tw/2-4,ly-12,tw+8,16);ctx.fillStyle='#edf3ff';ctx.textAlign='center';ctx.fillText(label,lx,ly);
    }
  }
  function drawPac(p,clock,source){
    const x=(p.x+.5)*PM_TILE,y=(p.y+.5)*PM_TILE,angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[p.dir]||0;
    ctx.save();ctx.translate(x,y);const active=phase==='running',powered=source.boost>0;
    if(chosenCharacter==='kai'&&kaiReady){
      if(powered){ctx.strokeStyle='#78cfff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,19+Math.sin(clock*9),0,PM_TAU);ctx.stroke();}
      const frame=active&&!reduced&&p.remaining>0?Math.floor(clock*8)%2:0,sw=kaiSprite.naturalWidth/2,size=37;
      if(p.dir==='left')ctx.scale(-1,1);else ctx.rotate(angle);ctx.imageSmoothingEnabled=true;ctx.drawImage(kaiSprite,frame*sw,0,sw,kaiSprite.naturalHeight,-size/2,-size/2,size,size);
    }else{ctx.rotate(angle);const mouth=active&&!reduced?.12+Math.abs(Math.sin(clock*12))*.7:.35;ctx.fillStyle='#ffe500';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,13.5,mouth,PM_TAU-mouth);ctx.closePath();ctx.fill();}
    ctx.restore();
  }
  function draw(){
    if(!alive)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='#030611';ctx.fillRect(0,0,width,height);
    ctx.save();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);ctx.drawImage(walls,0,0);ctx.translate(PM_MARGIN,PM_MARGIN);
    const source=engine||preview;
    if(source){
      for(const[key,value]of source.pellets){const[x,y]=key.split(',').map(Number);ctx.fillStyle='#ffc894';if(value==='o'){if(phase==='idle'||Math.floor(time*3)%2===0){ctx.beginPath();ctx.arc((x+.5)*PM_TILE,(y+.5)*PM_TILE,5.3,0,PM_TAU);ctx.fill();}}else ctx.fillRect((x+.5)*PM_TILE-1.6,(y+.5)*PM_TILE-1.6,3.2,3.2);}
      if(source.fruit){const{x,y}=source.fruit;ctx.fillStyle='#ff4563';ctx.beginPath();ctx.arc((x+.3)*PM_TILE,(y+.5)*PM_TILE,4.5,0,PM_TAU);ctx.arc((x+.7)*PM_TILE,(y+.5)*PM_TILE,4.5,0,PM_TAU);ctx.fill();ctx.strokeStyle='#85d982';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((x+.5)*PM_TILE,(y+.4)*PM_TILE);ctx.lineTo((x+.6)*PM_TILE,(y+.05)*PM_TILE);ctx.stroke();}
      for(const ghost of source.ghosts)drawGhost(ghost,time,source);drawPac(source.pac,time,source);
      if(source.pac.x<0)drawPac({...source.pac,x:source.pac.x+W},time,source);if(source.pac.x>W-1)drawPac({...source.pac,x:source.pac.x-W},time,source);
      for(const effect of effects){ctx.save();ctx.globalAlpha=PM_CLAMP(1-effect.age/.55,0,1);ctx.fillStyle=effect.color;for(let i=0;i<16;i++){const a=i*PM_TAU/16;ctx.fillRect((effect.x+.5)*PM_TILE+Math.cos(a)*effect.age*82,(effect.y+.5)*PM_TILE+Math.sin(a)*effect.age*82,3,3);}ctx.restore();}
    }
    ctx.restore();
  }
  function resize(){
    width=Math.max(240,stage.clientWidth||container.clientWidth||1000);height=Math.max(180,stage.clientHeight||container.clientHeight-42||600);
    const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    scale=Math.min((width-12)/walls.width,(height-8)/walls.height);offsetX=(width-walls.width*scale)/2;offsetY=(height-walls.height*scale)/2;draw();
  }
  function syncUI(){
    scoreLabel.textContent=String(totalScore());rosterLabel.textContent=normal?'♥'.repeat(lives):students.length+' names';
    power.hidden=!engine||engine.boost<=0||!['running','paused'].includes(phase);if(!power.hidden)power.textContent='POWER '+Math.ceil(engine.boost)+'s';
    pauseButton.disabled=!['running','countdown','paused'].includes(phase);pauseButton.textContent=phase==='paused'?'Resume':'Pause';pauseButton.setAttribute('aria-label',phase==='paused'?'Resume game':'Pause game');
    for(const[direction,button]of directions){button.disabled=!['running','countdown'].includes(phase);button.setAttribute('aria-pressed',String(Boolean(engine&&engine.pac.queued===direction)));}
  }
  function recordExtraLife(){if(normal&&!extraLife&&totalScore()>=10000){extraLife=true;lives++;playSound('extrapac');announce('10,000 points · extra life');}}
  function notifyFinish(outcome){if(roundNotified)return;roundNotified=true;onFinish?.({outcome,mode:normal?'normal':'picker',score:totalScore(),lives,picked:false});}
  function caught(student){
    if(normal||capturedId!==null||!seen.has(String(student?.id)))return;
    capturedId=String(student.id);phase='result';engine.active=false;stopAudio();playSound('eatghost');effects.push({x:engine.pac.x,y:engine.pac.y,age:0,color:'#ffe56b'});
    announce(student.name+' goes next.');overlay.hidden=true;syncUI();onPick?.(capturedId);
  }
  function died(){
    stopAudio();playSound('death');phase=normal?'life':'retry';announce(normal?'Caught!':'Eat a power pellet before catching a ghost.');
    if(normal){
      committedScore+=engine.score;engine.score=0;lives--;remainingPellets=[...engine.pellets];recordExtraLife();
      if(lives>0)show('One life down',lives+' '+(lives===1?'life remains.':'lives remain.')+' Your cleared dots are kept.','Continue');
      else{phase='result';show('Game over','Try again for a higher score.','Play again');notifyFinish('lost');}
    }else{show('That ghost was not blue','No name was chosen. Try another chase.');notifyFinish('lost');}
    syncUI();
  }
  function won(){
    if(!normal||phase==='result')return;phase='result';stopAudio();playSound('intermission');show('Maze cleared','Every dot collected.','Play again');announce('You won! The maze is clear.');syncUI();notifyFinish('won');
  }
  function consumeEvents(events){
    for(const event of events){
      if(!alive)return;
      if(event.type==='catch'){caught(event.student);return;}
      if(event.type==='death'){died();return;}
      if(event.type==='level'){won();return;}
      if(event.type==='ghost'){playSound('eatghost');if(!reduced)effects.push({x:event.x,y:event.y,age:0,color:'#8ccaff'});}
      else if(event.type==='power')playSound('eatfruit');
      else if(event.type==='fruit')playSound('eatfruit');
      else if(event.type==='pellet'&&time-lastChomp>.15){playSound('chomp');lastChomp=time;}
    }
    recordExtraLife();
  }
  function step(dt){
    if(!['running','countdown'].includes(phase))return;
    time+=dt;
    if(phase==='countdown'){countdown=Math.max(0,countdown-dt);if(countdown<=1e-8){phase='running';overlay.hidden=true;announce(normal?'Clear the maze. Watch the ghosts.':'Power up, then catch a blue ghost.');}}
    else if(engine)consumeEvents(engine.step(dt));
    for(const effect of effects)effect.age+=dt;effects=effects.filter(effect=>effect.age<.55);
  }
  function beginEngine(pellets=null){
    engine=engineFor(normal?normalGhosts:students,rng,pellets);countdown=3.6;phase='countdown';lastFrame=null;accumulator=0;stopAudio();playSound('beginning');show('Ready!',normal?'Clear the maze. Watch the ghosts.':'Big pellet first. Blue ghost next.');
    canvas.focus({preventScroll:true});syncUI();
  }
  function nextLife(){if(!normal||phase!=='life'||lives<=0)return false;beginEngine(remainingPellets);return true;}
  function start(){
    if(!alive)return false;if(phase==='paused')return resume();if(phase==='running'||phase==='countdown')return false;if(normal&&phase==='life')return nextLife();
    if(!normal&&!students.length){announce('Add names to begin.');return false;}
    committedScore=0;lives=3;extraLife=false;remainingPellets=null;capturedId=null;roundNotified=false;time=0;effects=[];lastChomp=-Infinity;beginEngine();onStart?.();return true;
  }
  function pause(){
    if(!['running','countdown'].includes(phase))return false;pausedPhase=phase;phase='paused';lastFrame=null;accumulator=0;stopAudio();show('Paused','The chase will wait.',normal?'Resume':null);announce('Paused');syncUI();return true;
  }
  function resume(){
    if(phase!=='paused')return false;phase=pausedPhase;lastFrame=null;accumulator=0;overlay.hidden=phase==='running';
    if(phase==='countdown')show('Ready!',normal?'Clear the maze.':'Catch a blue ghost after a power pellet.');
    announce(normal?'Clear the maze. Watch the ghosts.':'Power up, then catch a blue ghost.');canvas.focus({preventScroll:true});syncUI();return true;
  }
  function reset(){
    if(!alive)return;stopAudio();phase='idle';engine=null;committedScore=0;lives=3;extraLife=false;remainingPellets=null;capturedId=null;roundNotified=false;time=0;countdown=0;lastFrame=null;accumulator=0;effects=[];touchStart=null;buildPreview();
    if(normal)show('Pac-Man','Three lives. Four ghosts. Clear the maze.','Start game');
    else{overlay.hidden=true;action.hidden=true;action.textContent='';announce(students.length?'Power up, then catch a blue ghost · arrows or W A S D.':'Add names to begin.');}
    if(normal)announce('Arrows or W A S D to steer');syncUI();draw();
  }
  function steer(direction){
    if(!alive||!engine||!['running','countdown'].includes(phase)||!DIRS[direction])return false;
    engine.setDirection(direction);canvas.focus({preventScroll:true});syncUI();return true;
  }
  listen(pauseButton,'click',()=>phase==='paused'?resume():pause());
  listen(action,'click',()=>phase==='paused'?resume():phase==='life'?nextLife():start());
  listen(root,'keydown',event=>{
    if(!alive||event.altKey||event.ctrlKey||event.metaKey||event.target?.isContentEditable||event.target?.matches?.('input,textarea,select,[contenteditable=true]'))return;
    const direction=PM_KEYS[event.key]||PM_KEYS[String(event.key).toLowerCase()];
    if(direction&&['running','countdown'].includes(phase)){event.preventDefault();steer(direction);}
    else if(event.target===canvas&&(event.code==='Space'||String(event.key).toLowerCase()==='p')&&['running','countdown','paused'].includes(phase)){event.preventDefault();phase==='paused'?resume():pause();}
  });
  const directionPositions={up:['↑',1,2],left:['←',2,1],down:['↓',2,2],right:['→',2,3]};
  for(const[direction,[symbol,row,col]]of Object.entries(directionPositions)){
    const button=document.createElement('button');button.type='button';button.className='pm-direction';button.textContent=symbol;button.setAttribute('aria-label','Move '+direction);button.style.gridRow=String(row);button.style.gridColumn=String(col);directions.set(direction,button);dpad.appendChild(button);listen(button,'click',()=>steer(direction));
  }
  listen(canvas,'pointerdown',event=>{if(!['running','countdown'].includes(phase))return;canvas.focus({preventScroll:true});touchStart={x:event.clientX,y:event.clientY,id:event.pointerId};try{canvas.setPointerCapture(event.pointerId);}catch{}});
  listen(canvas,'pointerup',event=>{if(!touchStart||event.pointerId!==touchStart.id)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))>10)steer(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});
  listen(canvas,'pointercancel',()=>{touchStart=null;});
  if(typeof document.addEventListener==='function')listen(document,'visibilitychange',()=>{if(document.hidden&&['running','countdown'].includes(phase))pause();});
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(stage);listen(window,'resize',resize);
  function frame(timestamp){
    raf=null;if(!alive)return;
    const elapsed=lastFrame===null?0:PM_CLAMP((timestamp-lastFrame)/1000,0,.05);lastFrame=timestamp;
    if(['running','countdown'].includes(phase)){accumulator+=elapsed;while(accumulator+1e-8>=PM_STEP&&alive&&['running','countdown'].includes(phase)){step(PM_STEP);accumulator-=PM_STEP;}}
    if(!alive)return;syncUI();draw();raf=requestAnimationFrame(frame);
  }
  function getState(){
    return{phase,mode:normal?'normal':'picker',character:chosenCharacter,time,countdown,score:totalScore(),lives,capturedId,soundEnabled,eligibleIds:students.map(s=>s.id),kaiReady,
      engine:engine?{active:engine.active,elapsed:engine.elapsed,boost:engine.boost,pac:{...engine.pac},ghosts:engine.ghosts.map(g=>({...g})),pellets:[...engine.pellets],fruit:engine.fruit?{...engine.fruit}:null}:null,
      audio:{channels:audioChannels.size,playing:[...audioChannels.values()].filter(channel=>!channel.paused).length},layout:{width,height,scale,offsetX,offsetY,mazeWidth:walls.width,mazeHeight:walls.height},notified:roundNotified};
  }
  function destroy(){
    if(!alive)return;alive=false;if(raf!==null)cancelAnimationFrame(raf);raf=null;observer?.disconnect();for(const remove of listeners)remove();listeners.length=0;stopAudio();
    for(const channel of audioChannels.values()){try{channel.removeAttribute?.('src');channel.load?.();}catch{}}audioChannels.clear();
    if(kaiSprite){kaiSprite.onload=kaiSprite.onerror=null;try{kaiSprite.src='';}catch{}}kaiSprite=null;kaiReady=false;engine=preview=null;touchStart=null;effects=[];root.remove();
  }
  buildWalls();reset();resize();raf=requestAnimationFrame(frame);
  return {start,reset,destroy,setSound,getState,pause,resume};
}
