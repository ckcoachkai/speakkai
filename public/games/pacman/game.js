(function () {
  'use strict';
  const { MAP, DIRS, COLORS, W, H, Engine }=PacEngine;
  const $=id=>document.getElementById(id), canvas=$('maze'),ctx=canvas.getContext('2d');
  const T=24, STORAGE='pacman-classroom-v1', PREFS='kaiman-arcade-v2';
  let students=[],picked=[],engine=null,mode='setup',score=0,soundOn=true,lastTime=0;
  let lastChomp=0,toastTimer,gameTime=0,countdownStarted=0;
  let gameMode='picker',character='kai',skin='neon',normalScore=0,highScore=0,lives=3,level=1,extraLife=false;
  let openEdge=null,pinned=false,panelTimer=0,pausedCountdown=0,normalPellets=null;
  const particles=[],floats=[],trail=[],reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kaiSprite=new Image();kaiSprite.src='assets/kai-sprite.png';
  const trumpSprite=new Image();trumpSprite.src='assets/trump-sprite.png';
  const characterName=()=>character==='trump'?'TRUMP-MAN':character==='pacman'?'PAC-MAN':'KAI-MAN';
  const sounds={};
  for(const name of ['beginning','chomp','eatghost','eatfruit','extrapac','intermission','death']) {
    const a=new Audio(`assets/pacman_${name}.wav`);a.preload='auto';a.volume=name==='chomp'?.27:.5;sounds[name]=a;
  }
  function audio(name) {if(!soundOn)return;const a=sounds[name];if(!a)return;a.currentTime=0;a.play().catch(()=>{});}
  function stopAudio() {Object.values(sounds).forEach(a=>{a.pause();a.currentTime=0;});}
  function toast(msg) {$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
  function announce(msg){$('announcement').textContent=msg;}
  function totalScore(){return (gameMode==='normal'?normalScore:score)+((mode==='playing'||mode==='paused'||mode==='countdown')&&engine?engine.score:0);}
  function save() {try{localStorage.setItem(STORAGE,JSON.stringify({students,picked,soundOn,score}));localStorage.setItem(PREFS,JSON.stringify({character,gameMode,skin,highScore}));}catch{}}
  function restore() {
    try{const s=JSON.parse(localStorage.getItem(STORAGE));if(s&&Array.isArray(s.students)&&s.students.length<=60){
      students=s.students.filter(v=>typeof v.name==='string'&&typeof v.id==='string');
      picked=Array.isArray(s.picked)?s.picked.filter(v=>students.some(a=>a.id===v.id)).filter((v,i,all)=>all.findIndex(x=>x.id===v.id)===i):[];
      score=Number.isFinite(s.score)?s.score:0;soundOn=s.soundOn!==false;$('names').value=students.map(s=>s.name).join('\n');}
      const p=JSON.parse(localStorage.getItem(PREFS));if(p){character=['pacman','trump'].includes(p.character)?p.character:'kai';gameMode=p.gameMode==='normal'?'normal':'picker';skin=p.skin==='classic'?'classic':'neon';highScore=Number.isFinite(p.highScore)?p.highScore:0;}
      // Reuse a class entered in the main SpeakKai Games arcade when there is no saved class here.
      if(!students.length){const hub=JSON.parse(localStorage.getItem('speaker-arcade-v1'));if(hub&&Array.isArray(hub.roster)&&hub.roster.length<=60){students=hub.roster.filter(s=>s&&typeof s.name==='string'&&typeof s.id==='string').map(s=>({id:s.id,name:s.name}));$('names').value=students.map(s=>s.name).join('\n');}}
    }catch{}
    const params=new URLSearchParams(location.search);if(['pacman','kai','trump'].includes(params.get('character')))character=params.get('character');if(params.get('mode')==='normal'||params.get('mode')==='picker')gameMode=params.get('mode');
  }
  function parseNames() {return $('names').value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);}
  function validateNames() {const names=parseNames();$('nameCount').textContent=`${names.length} student${names.length===1?'':'s'}`;
    const error=names.length>60?'Please use up to 60 students.':names.some(n=>n.length>120)?'Please shorten names to 120 characters or fewer.':'';
    $('rosterError').textContent=error;$('rosterError').hidden=!error;$('start').disabled=!names.length||!!error;return !error&&names.length>0;}
  function remaining(){const ids=new Set(picked.map(s=>s.id));return students.filter(s=>!ids.has(s.id));}
  function ghostSVG(color) {const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 14 14');svg.setAttribute('aria-hidden','true');
    [['path',{fill:color,d:'M0 14V7C0-2 14-2 14 7V14L11 12L9 14L7 12L5 14L3 12Z'}],['path',{fill:'white',d:'M3 4h3v5H3zM9 4h3v5H9z'}],['path',{fill:'#2424ff',d:'M4 6h2v2H4zM10 6h2v2h-2z'}]].forEach(([tag,atts])=>{const p=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(atts).forEach(([k,v])=>p.setAttribute(k,v));svg.append(p);});return svg;}
  function renderLists() {
    const ids=new Set(picked.map(s=>s.id));$('students').replaceChildren();students.forEach((s,i)=>{
      const row=document.createElement('div');row.className='student'+(ids.has(s.id)?' picked':'');row.title=s.name;row.append(ghostSVG(COLORS[i%COLORS.length]));
      const name=document.createElement('span');name.textContent=s.name;row.append(name);const n=document.createElement('small');n.textContent=ids.has(s.id)?'✓':String(i+1).padStart(2,'0');row.append(n);$('students').append(row);});
    $('remainingCount').textContent=remaining().length;$('pickedCount').textContent=picked.length;$('historyEmpty').hidden=picked.length>0;$('history').replaceChildren();
    picked.forEach((s,i)=>{const li=document.createElement('li'),n=document.createElement('b'),name=document.createElement('span'),tag=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');name.textContent=s.name;tag.textContent=i===picked.length-1?'JUST PICKED':'';li.append(n,name,tag);$('history').append(li);});$('copy').hidden=!picked.length;updateHUD();
  }
  function updateHUD(){
    document.querySelectorAll('[data-dir]').forEach(b=>{b.disabled=!engine||!['playing','countdown'].includes(mode)||!!openEdge;b.classList.toggle('active',!!engine&&engine.pac.queued===b.dataset.dir);b.setAttribute('aria-pressed',String(!!engine&&engine.pac.queued===b.dataset.dir));});
    $('score').textContent=String(totalScore()).padStart(2,'0');$('round').textContent=String(gameMode==='normal'?level:Math.min(picked.length+1,students.length||1)).padStart(2,'0');
    $('highScore').textContent=String(Math.max(highScore,gameMode==='normal'?totalScore():0)).padStart(2,'0');$('levelStat').textContent=String(level).padStart(2,'0');$('livesStat').textContent=lives;
    $('lifeDisplay').hidden=gameMode!=='normal';$('lifeDisplay').setAttribute('aria-label',lives+' lives');if($('lifeDisplay').childElementCount!==lives){$('lifeDisplay').replaceChildren();for(let i=0;i<lives;i++)$('lifeDisplay').append(document.createElement('i'));}
  }
  function updateAppearance(){
    $('app').classList.toggle('pac-character',character==='pacman');$('app').classList.toggle('classic',skin==='classic');
    $('app').classList.toggle('trump-character',character==='trump');
    $('brandName').replaceChildren(document.createTextNode(characterName()));const sub=document.createElement('small');sub.textContent='SPEAKKAI ARCADE';$('brandName').append(sub);
    $('modeLabel').textContent=gameMode==='normal'?'NORMAL GAME':'NAME CHOOSER';$('machineTitle').textContent=gameMode==='normal'?'THE ARCADE CLASSIC':'CLASSROOM CHASE';$('roundLabel').textContent=gameMode==='normal'?'LEVEL':'ROUND';
    $('pickerSettings').hidden=gameMode!=='picker';$('pickerResults').hidden=gameMode!=='picker';$('normalSettings').hidden=gameMode!=='normal';$('normalResults').hidden=gameMode!=='normal';
    $('leftTitle').textContent=gameMode==='normal'?'How to play':'Meet the ghosts';$('leftHandleText').textContent=gameMode==='normal'?'Settings':'Names';$('rightTitle').textContent=gameMode==='normal'?'Arcade records':'The turn list';$('rightHandleText').textContent=gameMode==='normal'?'Records':'Turn list';
    for(const [id,on] of [['chooseKai',character==='kai'],['choosePac',character==='pacman'],['chooseTrump',character==='trump'],['chooseNormal',gameMode==='normal'],['choosePicker',gameMode==='picker'],['skinNeon',skin==='neon'],['skinClassic',skin==='classic']]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on));}
    document.title=characterName()+' · '+(gameMode==='normal'?'Normal game':'Name chooser')+' · SpeakKai';updateHUD();
  }
  function overlay(title,text,action,handler,winner=false){$('overlay').hidden=false;$('overlayTitle').textContent=title;$('overlayTitle').className=winner?'winner-name':'pixel';$('overlayText').textContent=text;$('overlayAction').hidden=!action;$('overlayAction').textContent=action||'';$('overlayAction').onclick=handler||null;announce(title+'. '+text);}
  function status(){return gameMode==='normal'?'EAT THE DOTS. CLEAR THE MAZE.':'POWER UP. CATCH A BLUE GHOST.';}
  function closePanel({resume=true,focus=false}={}){clearTimeout(panelTimer);if(!openEdge)return;const edge=openEdge,hadFocus=$(edge+'Panel').contains(document.activeElement);$(edge+'Panel').hidden=true;document.querySelector('[data-panel="'+edge+'"]').setAttribute('aria-expanded','false');openEdge=null;pinned=false;$('panelBackdrop').hidden=true;
    if(mode==='countdown')countdownStarted=performance.now()-pausedCountdown;updateHUD();
    if(resume&&(mode==='playing'||mode==='countdown'))canvas.focus({preventScroll:true});else if(focus||hadFocus)document.querySelector('[data-panel="'+edge+'"]').focus({preventScroll:true});lastTime=0;
  }
  function openPanel(edge,{pin=false}={}){clearTimeout(panelTimer);if(openEdge!==edge){const already=!!openEdge;if(openEdge)$(openEdge+'Panel').hidden=true;document.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded','false'));if(mode==='countdown'&&!already)pausedCountdown=performance.now()-countdownStarted;openEdge=edge;$(edge+'Panel').hidden=false;$('panelBackdrop').hidden=false;document.querySelector('[data-panel="'+edge+'"]').setAttribute('aria-expanded','true');stopAudio();}pinned=pin||pinned;updateHUD();}
  function deferClose(){clearTimeout(panelTimer);panelTimer=setTimeout(()=>{if(openEdge&&!pinned&&!$(openEdge+'Panel').contains(document.activeElement)&&!$(openEdge+'Panel').matches(':hover')&&!document.querySelector('[data-panel="'+openEdge+'"]').matches(':hover'))closePanel();},500);}
  function showRoster(){$('setupPanel').hidden=true;$('rosterPanel').hidden=false;renderLists();}
  function startFromRoster(){if(!validateNames())return;const names=parseNames(),same=names.length===students.length&&names.every((n,i)=>n===students[i].name);
    if(!same){students=names.map((name,i)=>({name,id:`student-${i}`}));picked=[];score=0;}if(!remaining().length){picked=[];score=0;}save();showRoster();startRound();}
  function countdownRound(){closePanel({resume:false});particles.length=0;trail.length=0;floats.length=0;mode='countdown';countdownStarted=performance.now();$('pause').disabled=true;$('next').hidden=true;$('boost').hidden=true;$('gameStatus').textContent='GET READY';overlay('READY!',gameMode==='normal'?'Clear the maze. Watch the ghosts.':'Big pellet first. Blue ghost next!');audio('beginning');canvas.focus({preventScroll:true});updateHUD();}
  function startRound(){if(!remaining().length){complete();return;}stopAudio();engine=new Engine(remaining().map(s=>({...s,color:COLORS[students.findIndex(v=>v.id===s.id)%COLORS.length]})));countdownRound();}
  function startNormal(fresh=true){if(fresh){normalScore=0;lives=3;level=1;extraLife=false;normalPellets=null;}stopAudio();engine=new Engine([{id:'blinky',name:'Blinky'},{id:'pinky',name:'Pinky'},{id:'inky',name:'Inky'},{id:'clyde',name:'Clyde'}],Math.random,{mode:'normal',level,pellets:normalPellets});countdownRound();}
  function burst(x,y,color,count=14){if(reducedMotion)return;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=20+Math.random()*70;particles.push({x:(x+.5)*T,y:(y+.5)*T,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.65,color});}}
  function caught(s){if(picked.some(p=>p.id===s.id))return;picked.push({id:s.id,name:s.name});score+=engine.score;mode='caught';stopAudio();audio('eatghost');burst(engine.pac.x,engine.pac.y,'#ffe56b',42);save();renderLists();$('pause').disabled=true;$('boost').hidden=true;const hasMore=remaining().length>0;$('next').hidden=false;$('next').textContent=hasMore?'NEXT CHASE →':'PLAY A NEW ROUND →';$('gameStatus').textContent=hasMore?'YOUR NEXT STUDENT!':'EVERYONE HAD A TURN!';overlay(s.name,`#${picked.length} in the turn list. ${hasMore?'You’re up next!':'The class is complete!'}`,hasMore?'NEXT CHASE →':'NEW ROUND →',()=>hasMore?startRound():resetTurns(),true);}
  function complete(){mode='complete';engine=null;$('pause').disabled=true;$('next').hidden=false;overlay('ALL DONE!','Every student has a place in the turn list.','NEW ROUND →',resetTurns);}
  function record(){if(gameMode!=='normal')return;const n=totalScore();if(n>highScore){highScore=n;save();}if(n>=10000&&!extraLife){extraLife=true;lives++;audio('extrapac');toast('10,000 points! Extra life.');}}
  function died(){stopAudio();audio('death');mode='dead';$('pause').disabled=true;$('boost').hidden=true;
    if(gameMode==='normal'){normalScore+=engine.score;lives--;normalPellets=[...engine.pellets];record();updateHUD();$('gameStatus').textContent=lives?'ONE LIFE DOWN':'GAME OVER';overlay(character==='kai'?'Kai died':'CAUGHT!',lives?`${lives} ${lives===1?'life':'lives'} left. Your cleared dots are kept.`:'That was your last life. Try for a new high score.',lives?'NEXT LIFE →':'PLAY AGAIN →',()=>startNormal(!lives));}
    else{score+=engine.score;save();renderLists();$('next').hidden=false;$('next').textContent='TRY AGAIN →';$('gameStatus').textContent='KAI DIED — TRY AGAIN';overlay('Kai died','That ghost wasn’t blue. Nobody was picked. Eat a large power pellet, then catch a blue ghost.','TRY AGAIN →',startRound);}}
  function levelComplete(){normalScore+=engine.score;mode='level';normalPellets=null;record();stopAudio();audio('intermission');$('pause').disabled=true;updateHUD();$('gameStatus').textContent='MAZE CLEARED!';overlay('LEVEL CLEAR!',`Level ${level} complete. Ready for a faster chase?`,'NEXT LEVEL →',()=>{level++;startNormal(false);});}
  function resetTurns(){picked=[];score=0;save();renderLists();showRoster();startRound();}
  function pause(){if(openEdge)closePanel();if(mode==='playing'){mode='paused';stopAudio();$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');overlay('PAUSED','The ghosts can wait.','RESUME →',pause);$('gameStatus').textContent='PAUSED';}else if(mode==='paused'){mode='playing';$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');$('gameStatus').textContent=status();canvas.focus({preventScroll:true});}updateHUD();}
  function edit(){mode='setup';stopAudio();engine=null;$('setupPanel').hidden=false;$('rosterPanel').hidden=true;$('pause').disabled=true;$('names').value=students.map(s=>s.name).join('\n');validateNames();overlay('READY!','Update your class, then start the chase.');openPanel('left',{pin:true});$('names').focus({preventScroll:true});}
  function setGameMode(value){if(gameMode===value)return;closePanel({resume:false});stopAudio();gameMode=value;engine=null;mode='setup';normalPellets=null;updateAppearance();save();setupReady();}
  function setCharacter(value){character=value;updateAppearance();save();const u=new URL(location.href);u.searchParams.set('character',value);u.searchParams.set('mode',gameMode);history.replaceState(null,'',u);}
  function setupReady(){mode='setup';$('pause').disabled=true;$('gameStatus').textContent=status();if(gameMode==='normal')overlay('READY!','Three lives. Four ghosts. A maze full of dots.','START GAME →',()=>startNormal());else{if(students.length)showRoster();else{$('setupPanel').hidden=false;$('rosterPanel').hidden=true;}overlay('READY!',students.length?`${remaining().length} students ready for the chase.`:'Give every ghost a student’s name.',students.length?'START CHASE →':'ADD STUDENTS →',()=>students.length?(remaining().length?startRound():resetTurns()):openPanel('left',{pin:true}));}}
  const wallCanvas=document.createElement('canvas');wallCanvas.width=canvas.width;wallCanvas.height=canvas.height;
  const wc=wallCanvas.getContext('2d');
  function buildWalls() {
    // Trace component boundaries, then round their corners like the arcade maze.
    wc.clearRect(0,0,canvas.width,canvas.height);wc.shadowBlur=skin==='neon'?7:0;wc.shadowColor='#278eff';
    const edges=[];const wall=(x,y)=>y>=0&&y<H&&x>=0&&x<W&&MAP[y][x]==='#';
    MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='#')return;
      if(!wall(x,y-1))edges.push([[x,y],[x+1,y]]);
      if(!wall(x+1,y))edges.push([[x+1,y],[x+1,y+1]]);
      if(!wall(x,y+1))edges.push([[x+1,y+1],[x,y+1]]);
      if(!wall(x-1,y))edges.push([[x,y+1],[x,y]]);
    }));
    const byStart=new Map();edges.forEach((e,i)=>{const k=e[0].join(',');if(!byStart.has(k))byStart.set(k,[]);byStart.get(k).push(i);});
    const used=new Set();wc.strokeStyle=skin==='neon'?'#348cfa':'#2424ff';wc.lineWidth=skin==='neon'?2.5:3;wc.lineJoin='round';
    edges.forEach((e,start)=>{if(used.has(start))return;
      let current=start;const points=[];
      while(!used.has(current)){used.add(current);points.push(edges[current][0]);const next=byStart.get(edges[current][1].join(','))||[];const n=next.find(i=>!used.has(i));if(n===undefined)break;current=n;}
      const corners=points.filter((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return(p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);});
      if(corners.length<3)return;
      const rr=5, pairs=corners.map((p,i)=>{const a=corners[(i+corners.length-1)%corners.length],b=corners[(i+1)%corners.length];
        const x=p[0]*T,y=p[1]*T;return{x,y,ax:x+Math.sign(a[0]-p[0])*rr,ay:y+Math.sign(a[1]-p[1])*rr,bx:x+Math.sign(b[0]-p[0])*rr,by:y+Math.sign(b[1]-p[1])*rr};});
      wc.beginPath();wc.moveTo(pairs[0].ax,pairs[0].ay);pairs.forEach((p,i)=>{if(i)wc.lineTo(p.ax,p.ay);wc.quadraticCurveTo(p.x,p.y,p.bx,p.by);});wc.closePath();wc.stroke();
    });
    wc.strokeStyle='#ffb8ff';wc.lineWidth=4;wc.beginPath();wc.moveTo(13*T,12*T);wc.lineTo(15*T,12*T);wc.stroke();
  }
  const ghostMask=['00000111100000','00011111111000','00111111111100','01111111111110','01111111111110','11111111111111','11111111111111','11111111111111','11111111111111','11111111111111','11111111111111','11111111111111','11011100111011','10001100110001'];
  function drawGhost(g,t,labels=true) {
    const px=(g.x+.5)*T,py=(g.y+.5)*T,S=2.15,x=px-7*S,y=py-7*S;
    const frightened=!!engine&&engine.boost>0&&!g.returning;
    const flash=frightened&&engine.boost<2&&Math.floor(t*5)%2===0;
    ctx.save();ctx.shadowBlur=skin==='neon'?8:0;ctx.shadowColor=frightened?'#537dff':g.color;
    ctx.fillStyle=frightened?(flash?'#fff':'#2424ff'):g.color;
    if(!g.returning)ghostMask.forEach((r,iy)=>[...r].forEach((v,ix)=>{let yes=v==='1';if(iy>=12&&Math.floor(t*8)%2)yes=((ix+iy)%5)<3;if(yes)ctx.fillRect(Math.round(x+ix*S),Math.round(y+iy*S),Math.ceil(S),Math.ceil(S));}));
    if(frightened){ctx.fillStyle=flash?'#ff4242':'#fff';[4,9].forEach(ex=>ctx.fillRect(x+ex*S,y+5*S,2*S,2*S));
      ctx.strokeStyle=flash?'#ff4242':'#fff';ctx.lineWidth=S;ctx.beginPath();ctx.moveTo(x+2*S,y+10*S);for(let i=3;i<=11;i++)ctx.lineTo(x+i*S,y+(i%2?9:10)*S);ctx.stroke();
    }else{const d=DIRS[g.dir]||[0,0];
      [3,9].forEach(ex=>{ctx.fillStyle='#fff';ctx.fillRect(Math.round(x+ex*S),Math.round(y+4*S),4*S,5*S);
        ctx.fillStyle='#2424ff';ctx.fillRect(Math.round(x+(ex+1+d[0])*S),Math.round(y+(6+d[1])*S),2*S,2*S);});}
    ctx.restore();
    if(labels&&g.name){ctx.font='600 17px Arial, sans-serif';let name=g.name;while(ctx.measureText(name).width>134&&name.length>1)name=name.slice(0,-2)+'…';
      const tw=ctx.measureText(name).width,padding=6,lx=Math.max(tw/2+padding,Math.min(canvas.width-tw/2-padding,px)),ly=Math.max(20,py-23);
      ctx.fillStyle='#000e';ctx.fillRect(lx-tw/2-padding,ly-16,tw+padding*2,22);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(name,lx,ly);}
  }
  function drawPac(p,t) {
    const x=(p.x+.5)*T,y=(p.y+.5)*T,angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
    ctx.save();ctx.translate(x,y);
    const powered=!!engine&&engine.boost>0;
    if(skin==='neon'){ctx.shadowColor=powered?'#64eadf':'#ffe56b';ctx.shadowBlur=powered?17:6;}
    const sprite=character==='trump'?trumpSprite:kaiSprite;
    if(character!=='pacman'&&sprite.complete&&sprite.naturalWidth){
      if(powered){ctx.strokeStyle='#64eadf';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,19+Math.sin(t*9)*1.5,0,Math.PI*2);ctx.stroke();}
      const frame=reducedMotion||mode!=='playing'||openEdge||!engine||engine.pac.remaining<=0?0:Math.floor(t*8)%2,sw=sprite.naturalWidth/2;
      const size=42;if(p.dir==='left')ctx.scale(-1,1);else ctx.rotate(angles[p.dir]);
      ctx.imageSmoothingEnabled=true;ctx.drawImage(sprite,frame*sw,0,sw,sprite.naturalHeight,-size/2,-size/2,size,size);
    }else{ctx.rotate(angles[p.dir]);const mouth=.12+Math.abs(Math.sin(t*12))*.7;ctx.fillStyle='#ffe500';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,15,mouth,Math.PI*2-mouth);ctx.closePath();ctx.fill();}
    ctx.restore();
  }
  function draw(t) {
    ctx.fillStyle=skin==='neon'?'#030714':'#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(wallCanvas,0,0);
    const pellets=engine?engine.pellets:demoEngine.pellets;
    for(const [key,c] of pellets){const[x,y]=key.split(',').map(Number);ctx.fillStyle=skin==='neon'?'#ffcf86':'#ffb8aa';if(c==='o'){if(Math.floor(t*3)%2===0||mode==='setup'){ctx.beginPath();ctx.arc((x+.5)*T,(y+.5)*T,6,0,Math.PI*2);ctx.fill();}}
      else ctx.fillRect((x+.5)*T-1.8,(y+.5)*T-1.8,3.6,3.6);}
    const e=engine||demoEngine;
    if(e.fruit){ctx.fillStyle='#ff496f';ctx.shadowBlur=8;ctx.shadowColor='#ff496f';ctx.beginPath();ctx.arc((e.fruit.x+.3)*T,(e.fruit.y+.5)*T,5,0,Math.PI*2);ctx.arc((e.fruit.x+.7)*T,(e.fruit.y+.5)*T,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#8bfa9c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((e.fruit.x+.5)*T,(e.fruit.y+.4)*T);ctx.lineTo((e.fruit.x+.6)*T,(e.fruit.y+.05)*T);ctx.stroke();}
    e.ghosts.forEach(g=>drawGhost(g,t,!!engine&&gameMode==='picker'));drawPac(e.pac,t);
    if(e.pac.x<0)drawPac({...e.pac,x:e.pac.x+W},t);if(e.pac.x>W-1)drawPac({...e.pac,x:e.pac.x-W},t);
    $('boost').hidden=mode!=='playing'||!engine||engine.boost<=0;
    if(engine&&engine.boost>0)$('boostTime').textContent=Math.ceil(engine.boost)+'s';
  }
  function drawEffects(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=p.life/.65;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.life-=dt;if(f.life<=0){floats.splice(i,1);continue;}f.y-=dt*20;ctx.font='bold 19px Arial';ctx.textAlign='center';ctx.fillStyle='#64eadf';ctx.globalAlpha=f.life;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;}
  let demoEngine;
  function frame(now){const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;gameTime+=dt;
    if(mode==='countdown'&&!openEdge){const countdown=3.6-(now-countdownStarted)/1000;$('overlayText').textContent=countdown>1.1?'The ghosts are getting ready…':gameMode==='normal'?'Ready to clear the maze?':'Big pellet first. Blue ghost next!';if(countdown<=0){mode='playing';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');$('gameStatus').textContent=status();}}
    if(mode==='playing'&&engine&&!openEdge){for(const e of engine.step(dt)){
      if(e.type==='catch')caught(e.student);else if(e.type==='death')died();else if(e.type==='level')levelComplete();else if(e.type==='ghost'){audio('eatghost');burst(e.x,e.y,'#64eadf',22);floats.push({x:(e.x+.5)*T,y:(e.y+.5)*T,text:String(e.points),life:1});}
      else if(e.type==='power'){audio('eatfruit');burst(engine.pac.x,engine.pac.y,'#ffe56b',25);}else if(e.type==='fruit'){audio('eatfruit');toast('Fruit bonus +'+e.points);}else if(e.type==='pellet'){if(now-lastChomp>150){audio('chomp');lastChomp=now;}if(skin==='neon')burst(engine.pac.x,engine.pac.y,'#ffc36b',2);}}
      if(mode==='playing')record();updateHUD();}
    draw(gameTime);drawEffects(openEdge?0:dt);requestAnimationFrame(frame);
  }
  $('names').addEventListener('input',validateNames);$('start').onclick=startFromRoster;$('demo').onclick=()=>{$('names').value='Alex\nEmma\nOliver\nSofia\nLiam\nMia';validateNames();toast('Demo class loaded. Press Let’s play!');};
  $('next').onclick=()=>remaining().length?startRound():resetTurns();$('pause').onclick=pause;$('edit').onclick=edit;$('restart').onclick=()=>{startRound();toast('Chase restarted. Your turn list is kept.');};$('reset').onclick=resetTurns;$('normalStart').onclick=()=>startNormal();
  $('chooseNormal').onclick=()=>setGameMode('normal');$('choosePicker').onclick=()=>setGameMode('picker');$('chooseKai').onclick=()=>setCharacter('kai');$('choosePac').onclick=()=>setCharacter('pacman');$('chooseTrump').onclick=()=>setCharacter('trump');
  function setSkin(s){skin=s;buildWalls();updateAppearance();save();}$('skinNeon').onclick=()=>setSkin('neon');$('skinClassic').onclick=()=>setSkin('classic');
  for(const edge of ['top','left','right']){const panel=$(edge+'Panel'),handle=document.querySelector('[data-panel="'+edge+'"]'),zone=document.querySelector('[data-edge="'+edge+'"]');for(const el of [zone,handle]){el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&(!pinned||openEdge===edge))openPanel(edge);});el.addEventListener('pointerleave',deferClose);}handle.onclick=()=>{if(openEdge===edge&&pinned)closePanel({focus:true});else openPanel(edge,{pin:true});};panel.addEventListener('pointerenter',()=>clearTimeout(panelTimer));panel.addEventListener('pointerleave',deferClose);panel.addEventListener('focusin',()=>clearTimeout(panelTimer));panel.addEventListener('focusout',deferClose);document.querySelector('[data-close="'+edge+'"]').onclick=()=>closePanel({focus:true});}
  $('panelBackdrop').onclick=()=>closePanel({focus:true});
  function steer(dir){if(!engine||openEdge||!['playing','countdown'].includes(mode))return;engine.setDirection(dir);$('directionHint').textContent=dir.toUpperCase()+' '+{up:'↑',down:'↓',left:'←',right:'→'}[dir]+' · turns at the next opening';updateHUD();canvas.focus({preventScroll:true});}
  document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',()=>steer(b.dataset.dir));b.addEventListener('click',()=>steer(b.dataset.dir));});
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
  document.addEventListener('keydown',e=>{if(e.target.matches('textarea,input')||$('credits').open)return;if(e.key==='Escape'&&openEdge){e.preventDefault();closePanel({focus:true});return;}const dir=keys[e.key]||keys[e.key.toLowerCase()];if(dir&&engine&&!openEdge&&(mode==='playing'||mode==='countdown')){e.preventDefault();steer(dir);}if(e.code==='Space'&&!openEdge&&(mode==='playing'||mode==='paused')&&!e.target.matches('button')){e.preventDefault();pause();}});
  let touchStart;canvas.addEventListener('pointerdown',e=>{if(openEdge)return;touchStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(!touchStart||!engine)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))>10)engine.setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});canvas.addEventListener('pointercancel',()=>touchStart=null);
  $('sound').onclick=()=>{soundOn=!soundOn;updateSound();if(!soundOn)stopAudio();else audio('eatfruit');save();};function updateSound(){$('sound').querySelector('span').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',soundOn);}
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Full screen is unavailable here. Try opening the game in a browser.');}};document.addEventListener('fullscreenchange',()=>{const label=document.fullscreenElement?'Exit full screen':'Full screen';$('fullscreen').querySelector('span').textContent=label;$('fullscreen').setAttribute('aria-label',label);});
  $('copy').onclick=async()=>{const text=picked.map((s,i)=>`${i+1}. ${s.name}`).join('\n');try{await navigator.clipboard.writeText(text);toast('Turn list copied!');}catch{toast('Copy is unavailable. Your turn list is shown here.');}};
  $('creditsButton').onclick=()=>{if(mode==='playing')pause();closePanel({resume:false});$('credits').showModal();};$('closeCredits').onclick=()=>$('credits').close();document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mode==='playing')pause();stopAudio();}lastTime=0;});
  restore();buildWalls();validateNames();renderLists();updateSound();updateAppearance();
  demoEngine=new Engine([{id:'demo1',name:''},{id:'demo2',name:''},{id:'demo3',name:''},{id:'demo4',name:''}]);demoEngine.ghosts.forEach((g,i)=>{g.x=11+i*2;g.y=11;g.dir='left';});setupReady();requestAnimationFrame(frame);
})();
