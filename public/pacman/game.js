(function () {
  'use strict';
  const { MAP, DIRS, COLORS, W, H, Engine }=PacEngine;
  const $=id=>document.getElementById(id), canvas=$('maze'),ctx=canvas.getContext('2d');
  const T=24, STORAGE='pacman-classroom-v1';
  let students=[],picked=[],engine=null,mode='setup',score=0,soundOn=true,countdown=0,lastTime=0;
  let countdownToken=0,lastChomp=0,toastTimer,gameTime=0,countdownStarted=0;
  const sounds={};
  for(const name of ['beginning','chomp','eatghost','eatfruit','extrapac','intermission','death']) {
    const a=new Audio(`assets/pacman_${name}.wav`);a.preload='auto';a.volume=name==='chomp'?.32:.55;sounds[name]=a;
  }
  function audio(name) {
    if(!soundOn)return;
    const a=sounds[name];if(!a)return;
    a.currentTime=0;a.play().catch(()=>{});
  }
  function stopAudio() {Object.values(sounds).forEach(a=>{a.pause();a.currentTime=0;});}
  function toast(msg) {$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
  function save() {try{localStorage.setItem(STORAGE,JSON.stringify({students,picked,soundOn,score}));}catch{/* Private storage can be unavailable. */}}
  function restore() {
    try {
      const s=JSON.parse(localStorage.getItem(STORAGE));
      if(s&&Array.isArray(s.students)&&s.students.length<=60) {
        students=s.students.filter(v=>typeof v.name==='string'&&typeof v.id==='string');
        picked=Array.isArray(s.picked)?s.picked.filter(v=>students.some(a=>a.id===v.id)).filter((v,i,all)=>all.findIndex(x=>x.id===v.id)===i):[];
        score=Number.isFinite(s.score)?s.score:0;soundOn=s.soundOn!==false;
        $('names').value=students.map(s=>s.name).join('\n');
      }
    } catch{/* A corrupt save should not prevent play. */}
  }
  function parseNames() {return $('names').value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);}
  function validateNames() {
    const names=parseNames();$('nameCount').textContent=`${names.length} student${names.length===1?'':'s'}`;
    const error=names.length>60?'Please use up to 60 students per class.':names.some(n=>n.length>120)?'Please shorten names to 120 characters or fewer.':'';
    $('rosterError').textContent=error;$('rosterError').hidden=!error;$('start').disabled=!names.length||!!error;
    return !error&&names.length>0;
  }
  function remaining(){const ids=new Set(picked.map(s=>s.id));return students.filter(s=>!ids.has(s.id));}
  function ghostSVG(color) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 14 14');svg.setAttribute('aria-hidden','true');
    [['path',{fill:color,d:'M0 14V7C0-2 14-2 14 7V14L11 12L9 14L7 12L5 14L3 12Z'}],['path',{fill:'white',d:'M3 4h3v5H3zM9 4h3v5H9z'}],['path',{fill:'#2424ff',d:'M4 6h2v2H4zM10 6h2v2h-2z'}]].forEach(([tag,atts])=>{const p=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(atts).forEach(([k,v])=>p.setAttribute(k,v));svg.append(p);});
    return svg;
  }
  function renderLists() {
    const ids=new Set(picked.map(s=>s.id));$('students').replaceChildren();
    students.forEach((s,i)=>{
      const row=document.createElement('div');row.className='student'+(ids.has(s.id)?' picked':'');row.title=s.name;
      row.append(ghostSVG(COLORS[i%COLORS.length]));const name=document.createElement('span');name.textContent=s.name;row.append(name);
      const n=document.createElement('small');n.textContent=ids.has(s.id)?'✓':String(i+1).padStart(2,'0');row.append(n);$('students').append(row);
    });
    $('remainingCount').textContent=remaining().length;$('pickedCount').textContent=picked.length;$('round').textContent=String(Math.min(picked.length+1,students.length||1)).padStart(2,'0');
    $('historyEmpty').hidden=picked.length>0;$('history').replaceChildren();
    picked.forEach((s,i)=>{const li=document.createElement('li'),n=document.createElement('b'),name=document.createElement('span'),tag=document.createElement('small');
      n.textContent=String(i+1).padStart(2,'0');name.textContent=s.name;tag.textContent=i===picked.length-1?'JUST PICKED':'';li.append(n,name,tag);$('history').append(li);
    });$('copy').hidden=!picked.length;$('score').textContent=String(score).padStart(2,'0');
  }
  function overlay(title, text, action, handler, winner=false) {
    $('overlay').hidden=false;$('overlayTitle').textContent=title;$('overlayTitle').className=winner?'winner-name':'pixel';
    $('overlayText').textContent=text;$('overlayAction').hidden=!action;$('overlayAction').textContent=action||'';$('overlayAction').onclick=handler||null;
  }
  function showRoster() {$('setupPanel').hidden=true;$('rosterPanel').hidden=false;renderLists();}
  function startFromRoster() {
    if(!validateNames())return;
    const names=parseNames(),same=names.length===students.length&&names.every((n,i)=>n===students[i].name);
    if(!same){students=names.map((name,i)=>({name,id:`student-${i}`}));picked=[];score=0;}
    if(!remaining().length){picked=[];score=0;}
    save();showRoster();startRound();
  }
  function startRound() {
    if(!remaining().length){complete();return;}
    countdownToken++;const token=countdownToken;
    stopAudio();engine=new Engine(remaining().map(s=>({...s,color:COLORS[students.findIndex(v=>v.id===s.id)%COLORS.length]})));mode='countdown';countdown=3.6;countdownStarted=performance.now();
    $('pause').disabled=true;$('next').hidden=true;$('boost').hidden=true;$('gameStatus').textContent='GET READY TO CHASE';
    overlay('READY!','Eat a large power pellet. Catch a blue ghost.');audio('beginning');
    canvas.focus({preventScroll:true});
    // Wall time keeps the intro short when an embedded browser throttles animation frames.
    engine.roundToken=token;
  }
  function caught(s) {
    if(picked.some(p=>p.id===s.id))return;
    picked.push({id:s.id,name:s.name});score+=engine.score;mode='caught';stopAudio();audio('eatghost');save();renderLists();
    $('pause').disabled=true;$('boost').hidden=true;
    const hasMore=remaining().length>0;
    $('next').hidden=false;$('next').textContent=hasMore?'NEXT CHASE →':'PLAY A NEW ROUND →';
    $('gameStatus').textContent=hasMore?'WE HAVE OUR NEXT STUDENT!':'EVERYONE HAS HAD A TURN!';
    overlay(s.name,`#${picked.length} in the turn list. ${hasMore?'You’re up next!':'You’re up next — the class is complete!'}`,
      hasMore?'NEXT CHASE →':'NEW ROUND →',()=>hasMore?startRound():resetTurns(),true);
  }
  function complete() {mode='complete';engine=null;$('pause').disabled=true;$('next').hidden=false;overlay('ALL DONE!','Every student has a place in the turn list.','NEW ROUND →',resetTurns);}
  function died() {
    score+=engine.score;mode='dead';stopAudio();audio('death');save();renderLists();
    $('pause').disabled=true;$('boost').hidden=true;$('next').hidden=false;$('next').textContent='TRY AGAIN →';
    $('gameStatus').textContent='KAI DIED — TRY AGAIN';
    overlay('Kai died','That ghost wasn’t blue. No student was picked. Eat a large power pellet, then try to catch a blue ghost.','TRY AGAIN →',startRound);
  }
  function resetTurns() {picked=[];score=0;save();renderLists();showRoster();startRound();}
  function pause() {
    if(mode==='playing') {mode='paused';stopAudio();$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');overlay('PAUSED','Take your time. The ghosts can wait.','RESUME →',pause);$('gameStatus').textContent='PAUSED';}
    else if(mode==='paused'){mode='playing';$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');$('gameStatus').textContent='POWER UP. CATCH A BLUE GHOST.';canvas.focus({preventScroll:true});}
  }
  function edit() {countdownToken++;mode='setup';stopAudio();engine=null;$('setupPanel').hidden=false;$('rosterPanel').hidden=true;$('pause').disabled=true;
    $('names').value=students.map(s=>s.name).join('\n');validateNames();overlay('READY!','Update your class, then start the chase.');$('names').focus({preventScroll:false});
  }
  const wallCanvas=document.createElement('canvas');wallCanvas.width=canvas.width;wallCanvas.height=canvas.height;
  const wc=wallCanvas.getContext('2d');
  function buildWalls() {
    // Trace component boundaries, then round their corners like the arcade maze.
    const edges=[];const wall=(x,y)=>y>=0&&y<H&&x>=0&&x<W&&MAP[y][x]==='#';
    MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='#')return;
      if(!wall(x,y-1))edges.push([[x,y],[x+1,y]]);
      if(!wall(x+1,y))edges.push([[x+1,y],[x+1,y+1]]);
      if(!wall(x,y+1))edges.push([[x+1,y+1],[x,y+1]]);
      if(!wall(x-1,y))edges.push([[x,y+1],[x,y]]);
    }));
    const byStart=new Map();edges.forEach((e,i)=>{const k=e[0].join(',');if(!byStart.has(k))byStart.set(k,[]);byStart.get(k).push(i);});
    const used=new Set();wc.strokeStyle='#2424ff';wc.lineWidth=3;wc.lineJoin='round';
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
    const frightened=!!engine&&engine.boost>0;
    const flash=frightened&&engine.boost<2&&Math.floor(t*5)%2===0;
    ctx.fillStyle=frightened?(flash?'#fff':'#2424ff'):g.color;
    ghostMask.forEach((r,iy)=>[...r].forEach((v,ix)=>{let yes=v==='1';if(iy>=12&&Math.floor(t*8)%2)yes=((ix+iy)%5)<3;if(yes)ctx.fillRect(Math.round(x+ix*S),Math.round(y+iy*S),Math.ceil(S),Math.ceil(S));}));
    if(frightened){ctx.fillStyle=flash?'#ff4242':'#fff';[4,9].forEach(ex=>ctx.fillRect(x+ex*S,y+5*S,2*S,2*S));
      ctx.strokeStyle=flash?'#ff4242':'#fff';ctx.lineWidth=S;ctx.beginPath();ctx.moveTo(x+2*S,y+10*S);for(let i=3;i<=11;i++)ctx.lineTo(x+i*S,y+(i%2?9:10)*S);ctx.stroke();
    }else{const d=DIRS[g.dir]||[0,0];
      [3,9].forEach(ex=>{ctx.fillStyle='#fff';ctx.fillRect(Math.round(x+ex*S),Math.round(y+4*S),4*S,5*S);
        ctx.fillStyle='#2424ff';ctx.fillRect(Math.round(x+(ex+1+d[0])*S),Math.round(y+(6+d[1])*S),2*S,2*S);});}
    if(labels&&g.name){ctx.font='600 17px Arial, sans-serif';let name=g.name;while(ctx.measureText(name).width>134&&name.length>1)name=name.slice(0,-2)+'…';
      const tw=ctx.measureText(name).width,padding=6,lx=Math.max(tw/2+padding,Math.min(canvas.width-tw/2-padding,px)),ly=Math.max(20,py-23);
      ctx.fillStyle='#000e';ctx.fillRect(lx-tw/2-padding,ly-16,tw+padding*2,22);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(name,lx,ly);}
  }
  function drawPac(p,t) {
    const x=(p.x+.5)*T,y=(p.y+.5)*T,angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
    const mouth=.12+Math.abs(Math.sin(t*12))*.7;
    ctx.save();ctx.translate(x,y);ctx.rotate(angles[p.dir]);ctx.fillStyle='#ffe500';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,15,mouth,Math.PI*2-mouth);ctx.closePath();ctx.fill();ctx.restore();
  }
  function draw(t) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(wallCanvas,0,0);
    const pellets=engine?engine.pellets:demoEngine.pellets;
    for(const [key,c] of pellets){const[x,y]=key.split(',').map(Number);ctx.fillStyle='#ffb8aa';if(c==='o'){if(Math.floor(t*3)%2===0||mode==='setup'){ctx.beginPath();ctx.arc((x+.5)*T,(y+.5)*T,6,0,Math.PI*2);ctx.fill();}}
      else ctx.fillRect((x+.5)*T-1.8,(y+.5)*T-1.8,3.6,3.6);}
    const e=engine||demoEngine;
    e.ghosts.forEach(g=>drawGhost(g,t,!!engine));drawPac(e.pac,t);
    if(e.pac.x<0)drawPac({...e.pac,x:e.pac.x+W},t);if(e.pac.x>W-1)drawPac({...e.pac,x:e.pac.x-W},t);
    $('boost').hidden=mode!=='playing'||!engine||engine.boost<=0;
    if(engine&&engine.boost>0)$('boostTime').textContent=Math.ceil(engine.boost)+'s';
  }
  let demoEngine;
  function frame(now) {
    const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;gameTime+=dt;
    if(mode==='countdown') {countdown=3.6-(now-countdownStarted)/1000;$('overlayText').textContent=countdown>1.1?'The ghosts are getting ready…':'Big pellet first. Blue ghost next!';
      if(countdown<=0){mode='playing';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');$('gameStatus').textContent='POWER UP. CATCH A BLUE GHOST.';}}
    if(mode==='playing'&&engine){const events=engine.step(dt);events.forEach(e=>{if(e.type==='catch')caught(e.student);else if(e.type==='death')died();else if(e.type==='power')audio('eatfruit');else if(e.type==='pellet'&&now-lastChomp>150){audio('chomp');lastChomp=now;}});
      $('score').textContent=String(score+(mode==='playing'?engine.score:0)).padStart(2,'0');}
    draw(gameTime);requestAnimationFrame(frame);
  }
  $('names').addEventListener('input',validateNames);$('start').onclick=startFromRoster;
  $('demo').onclick=()=>{$('names').value='Alex\nEmma\nOliver\nSofia\nLiam\nMia';validateNames();toast('Demo class loaded. Press Let’s play!');};
  $('next').onclick=()=>remaining().length?startRound():resetTurns();$('pause').onclick=pause;$('edit').onclick=edit;
  $('restart').onclick=()=>{startRound();toast('Chase restarted. Your turn list is kept.');};$('reset').onclick=resetTurns;
  document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();if(engine)engine.setDirection(b.dataset.dir);canvas.focus({preventScroll:true});}));
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
  document.addEventListener('keydown',e=>{
    if(e.target.matches('textarea,input')||$('credits').open)return;
    const dir=keys[e.key]||keys[e.key.toLowerCase()];
    if(dir&&engine&&(mode==='playing'||mode==='countdown')){e.preventDefault();engine.setDirection(dir);}
    if(e.code==='Space'&&(mode==='playing'||mode==='paused')&&!e.target.matches('button')){e.preventDefault();pause();}
  });
  let touchStart;
  canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{if(!touchStart||!engine)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))>10)engine.setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));});
  $('sound').onclick=()=>{soundOn=!soundOn;updateSound();if(!soundOn)stopAudio();else audio('eatfruit');save();};
  function updateSound(){$('sound').querySelector('span').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',soundOn);}
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.arcade').requestFullscreen();}catch{toast('Full screen is unavailable here. Try opening the game in a browser.');}};
  $('exitFullscreen').onclick=()=>document.exitFullscreen().catch(()=>{});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').querySelector('span').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
  $('copy').onclick=async()=>{const text=picked.map((s,i)=>`${i+1}. ${s.name}`).join('\n');try{await navigator.clipboard.writeText(text);toast('Turn list copied!');}catch{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();try{document.execCommand('copy');toast('Turn list copied!');}catch{toast('Copy is unavailable. Your turn list is shown here.');}ta.remove();}};
  $('creditsButton').onclick=()=>{if(mode==='playing')pause();$('credits').showModal();};$('closeCredits').onclick=()=>$('credits').close();
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mode==='playing')pause();stopAudio();}lastTime=0;});
  buildWalls();restore();validateNames();renderLists();updateSound();
  demoEngine=new Engine([{id:'demo1',name:''},{id:'demo2',name:''},{id:'demo3',name:''},{id:'demo4',name:''}]);
  demoEngine.ghosts.forEach((g,i)=>{g.x=11+i*2;g.y=11;g.dir='left';});
  requestAnimationFrame(frame);
})();
