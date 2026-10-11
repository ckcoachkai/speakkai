const C = { navy: '#101b33', cream: '#fff3d8', gold: '#f8c75a', coral: '#ff735e', teal: '#7bd8c9' };
const TAU = Math.PI * 2;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => 1 - Math.pow(1 - clamp(n), 3);

// Coordinates are normalized against the inspected, original square photographs.
// These polygons trace existing candy / dentition; nothing new is pasted over the idle photo.
const PG_TEETH = [
  { grip: [.231,.542], poly: [[.195,.463],[.248,.469],[.268,.507],[.263,.545],[.244,.56],[.209,.553],[.192,.522]] },
  { grip: [.307,.544], poly: [[.275,.48],[.337,.483],[.351,.522],[.345,.559],[.318,.566],[.281,.551],[.265,.525]] },
  { grip: [.398,.55], poly: [[.351,.489],[.436,.488],[.447,.523],[.439,.562],[.408,.572],[.365,.561],[.351,.537]] },
  { grip: [.503,.544], poly: [[.452,.489],[.496,.478],[.538,.491],[.552,.53],[.538,.557],[.488,.563],[.451,.552]] },
  { grip: [.6,.55], poly: [[.562,.496],[.635,.491],[.651,.535],[.638,.564],[.59,.573],[.559,.557]] },
  { grip: [.69,.544], poly: [[.656,.483],[.714,.474],[.733,.516],[.724,.554],[.69,.567],[.654,.558]] },
  { grip: [.768,.537], poly: [[.737,.47],[.794,.462],[.81,.505],[.8,.541],[.772,.559],[.74,.551],[.727,.519]] },
  { grip: [.268,.706], lower: true, poly: [[.229,.67],[.277,.66],[.306,.687],[.3,.724],[.273,.746],[.242,.728],[.223,.699]] },
  { grip: [.326,.745], lower: true, poly: [[.288,.71],[.336,.704],[.363,.737],[.356,.781],[.324,.797],[.29,.771],[.274,.739]] },
  { grip: [.406,.765], lower: true, poly: [[.371,.735],[.415,.728],[.441,.756],[.445,.799],[.419,.819],[.38,.811],[.356,.78]] },
  { grip: [.5,.784], lower: true, poly: [[.452,.753],[.494,.742],[.541,.754],[.555,.792],[.54,.824],[.505,.835],[.464,.825],[.443,.793]] },
  { grip: [.599,.767], lower: true, poly: [[.568,.742],[.607,.732],[.636,.755],[.644,.801],[.619,.821],[.581,.82],[.554,.793]] },
  { grip: [.679,.745], lower: true, poly: [[.646,.72],[.687,.706],[.715,.729],[.73,.776],[.707,.797],[.669,.792],[.636,.765]] },
  { grip: [.744,.706], lower: true, poly: [[.715,.676],[.754,.66],[.777,.684],[.768,.727],[.743,.745],[.715,.729],[.7,.702]] }
];
const HORROR_TEETH = [
  { grip: [.386,.562], poly: [[.364,.46],[.393,.449],[.417,.475],[.404,.553],[.382,.609],[.367,.558],[.36,.505]] },
  { grip: [.442,.477], poly: [[.43,.45],[.45,.448],[.458,.465],[.45,.499],[.437,.492],[.427,.47]] },
  { grip: [.48,.473], poly: [[.464,.449],[.487,.443],[.501,.46],[.498,.48],[.474,.483],[.458,.475]] },
  { grip: [.523,.473], poly: [[.507,.45],[.529,.445],[.542,.462],[.544,.48],[.512,.484],[.501,.475]] },
  { grip: [.56,.478], poly: [[.55,.453],[.569,.452],[.577,.473],[.565,.5],[.553,.494],[.546,.475]] },
  { grip: [.615,.56], poly: [[.595,.458],[.622,.45],[.639,.482],[.635,.547],[.619,.621],[.601,.57],[.589,.493]] },
  { grip: [.398,.753], lower: true, poly: [[.4,.722],[.413,.749],[.436,.835],[.419,.86],[.386,.845],[.375,.817],[.386,.754]] },
  { grip: [.455,.827], lower: true, poly: [[.446,.806],[.464,.824],[.474,.849],[.462,.863],[.445,.85],[.437,.83]] },
  { grip: [.484,.839], lower: true, poly: [[.471,.829],[.495,.832],[.505,.85],[.495,.868],[.474,.861],[.467,.845]] },
  { grip: [.522,.839], lower: true, poly: [[.508,.831],[.532,.828],[.541,.847],[.534,.864],[.514,.866],[.504,.85]] },
  { grip: [.55,.826], lower: true, poly: [[.544,.817],[.559,.804],[.569,.831],[.562,.854],[.548,.862],[.538,.845]] },
  { grip: [.606,.754], lower: true, poly: [[.605,.721],[.617,.756],[.635,.813],[.628,.846],[.602,.862],[.574,.844],[.588,.787]] }
];

export default function createGame({ container, names = [], onPick = () => {}, random = Math.random, bearMode = 'pg', artwork = {} }) {
  const players = names.slice(0, 60), horror = bearMode === 'horror';
  const teeth = horror ? HORROR_TEETH : PG_TEETH;
  // Spread an eight-person class across actual upper and lower canines / central teeth.
  const order = horror ? [0,2,3,5,6,8,9,11,1,4,7,10] : [0,2,4,6,7,9,11,13,1,3,5,8,10,12];
  const image = new Image(), photoSize = horror ? 545 : 670;
  let imageState = 'loading', photoRect = { x: 500-photoSize/2, y: 535-photoSize, width: photoSize, height: photoSize };
  const root = document.createElement('div'), canvas = document.createElement('canvas');
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#101b33;';
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  canvas.setAttribute('role','img');
  root.append(canvas); container.append(root);
  const ctx = canvas.getContext('2d');
  let dead = false, running = false, frame = 0, started = 0, elapsed = 0, winner = -1, hover = -1, picked = false;
  let scale = 1, ox = 0, oy = 0, slots = [], fakeouts = [], labels = [];
  const duration = 8500, compact = players.length > teeth.length;
  const dollScale = players.length > 36 ? .25 : players.length > teeth.length ? .34 : horror ? .65 : .79;
  const word = horror ? 'tooth' : 'candy';
  function accessible() { canvas.setAttribute('aria-label', `${horror ? 'A zombie bear' : 'A plush candy bear'} with clean cartoon students gripping its photographed ${horror ? 'teeth' : 'candies'}. The first student to tumble is the next speaker.`); }
  accessible();
  function world(point) { return { x: photoRect.x + point[0] * photoRect.width, y: photoRect.y + point[1] * photoRect.height }; }
  function bounds(tooth) {
    const xs = tooth.poly.map(p=>p[0]), ys = tooth.poly.map(p=>p[1]);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  function rootOf(tooth) { const b = bounds(tooth); return world([(b.left+b.right)/2, tooth.lower ? b.bottom : b.top]); }
  function layout() {
    slots = players.map((p,i) => {
      const toothIndex = order[i % teeth.length], tooth = teeth[toothIndex], grip = world(tooth.grip);
      const sharing = players.filter((_,j)=>order[j % teeth.length]===toothIndex).length;
      const rank = Math.floor(i / teeth.length);
      // A real photograph has finite teeth. Larger classes share them with miniature students.
      const columns = sharing > 1 ? Math.min(sharing,3) : 1;
      const column = rank % columns, row = Math.floor(rank / columns);
      const shift = compact ? (column-(columns-1)/2) * 12 : 0;
      return { i,p,tooth,toothIndex,grip,x:grip.x+shift,y:grip.y-28*dollScale+(compact?row*26:0),rank };
    });
    labels = [];
    if (!compact) {
      for (const side of [-1,1]) {
        const group = slots.filter(s=>s.x < 500 ? side===-1 : side===1).sort((a,b)=>a.y-b.y || a.x-b.x);
        let prev = 185;
        const positions = group.map(slot=>{ const y=Math.max(slot.y+76*dollScale,prev+24);prev=y;return {slot,y}; });
        const overflow = Math.max(0,(positions.at(-1)?.y||0)-490);
        positions.forEach(({slot,y})=>labels.push({slot,y:y-overflow,x:side<0?photoRect.x-16:photoRect.x+photoRect.width+16,side}));
      }
    }
  }
  layout();
  function rr(x,y,w,h,r=8,fill,stroke,line=1) { ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();} }
  function ellipse(x,y,rx,ry,fill,stroke,line=1) { ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();} }
  function path(points,stroke,width=2) { ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(); }
  function label(value,x,y,size=12,fill=C.cream,align='center',weight=600) { ctx.font=`${weight} ${size}px "DM Sans",system-ui,sans-serif`;ctx.fillStyle=fill;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y); }
  function short(value,width,size=12) { ctx.font=`600 ${size}px "DM Sans",system-ui,sans-serif`;const a=Array.from(String(value));if(ctx.measureText(a.join('')).width<=width)return a.join('');while(a.length&&ctx.measureText(a.join('')+'…').width>width)a.pop();return a.join('')+'…'; }
  function polygon(tooth,origin={x:0,y:0}) { ctx.beginPath();tooth.poly.forEach((p,i)=>{const w=world(p);i?ctx.lineTo(w.x-origin.x,w.y-origin.y):ctx.moveTo(w.x-origin.x,w.y-origin.y);});ctx.closePath(); }
  function drawBackground() {
    ctx.fillStyle=C.navy;ctx.fillRect(0,0,1000,560);
    const g=ctx.createRadialGradient(500,310,80,500,300,510);g.addColorStop(0,horror?'#382534':'#304454');g.addColorStop(1,C.navy);ctx.fillStyle=g;ctx.fillRect(0,0,1000,560);
  }
  function drawFallback() {
    ellipse(500-photoRect.width*.36,94,48,47,'#a46a50');ellipse(500+photoRect.width*.36,94,48,47,'#a46a50');
    ellipse(500,280,photoRect.width*.46,photoRect.height*.42,'#ae7254');
    ellipse(500-photoRect.width*.19,155,25,29,C.cream);ellipse(500+photoRect.width*.19,155,25,29,C.cream);
    ellipse(500-photoRect.width*.19,158,9,12,'#271c2a');ellipse(500+photoRect.width*.19,158,9,12,'#271c2a');
    ellipse(500,218,58,40,'#f0c49b');ellipse(500,205,34,22,'#30222b');
    const left=world([horror?.35:.19,horror?.44:.46]),right=world([horror?.65:.81,horror?.88:.84]);
    ellipse(500,(left.y+right.y)/2,(right.x-left.x)/2,(right.y-left.y)/2,horror?'#08070a':'#480c22','#7b4650',7);
    teeth.forEach((tooth,i)=>{polygon(tooth);ctx.fillStyle=horror?'#d8c6ae':['#ef6180','#99b76e','#e69749','#e7d4aa'][i%4];ctx.fill();ctx.strokeStyle=horror?'#5b252c':'#fff2dc66';ctx.lineWidth=1;ctx.stroke();});
  }
  function drawBear() {
    if (imageState==='ready') {
      ctx.save();ctx.beginPath();ctx.rect(0,0,1000,535);ctx.clip();ctx.shadowColor='#00000070';ctx.shadowBlur=19;
      ctx.drawImage(image,photoRect.x,photoRect.y,photoRect.width,photoRect.height);ctx.restore();
    } else if(imageState==='error') drawFallback();
    else label('Loading bear…',500,280,14,'#c9cdda');
  }
  function socket(tooth) {
    const b=bounds(tooth),a=world([0,b.top]),z=world([0,b.bottom]);
    const g=ctx.createLinearGradient(0,a.y,0,z.y);
    g.addColorStop(tooth.lower?1:0,horror?'#33171e':'#6e1826');g.addColorStop(tooth.lower?0:1,horror?'#08070b':'#360719');
    polygon(tooth);ctx.fillStyle=g;ctx.fill();
    // A dark gum lip connects the opening to the same photographed tooth root.
    const root=rootOf(tooth),width=(b.right-b.left)*photoRect.width*.55;
    ellipse(root.x,root.y,width/2,2.1,horror?'#481d24':'#711e2e');
  }
  function fragment(tooth,offsetX=0,offsetY=0,angle=0,zoom=1,pivotOverride=null) {
    const pivot=rootOf(tooth),target=pivotOverride||{x:pivot.x+offsetX,y:pivot.y+offsetY};
    ctx.save();ctx.translate(target.x,target.y);ctx.rotate(angle);ctx.scale(zoom,zoom);polygon(tooth,pivot);ctx.clip();
    if(imageState==='ready') {
      const b=bounds(tooth),w=image.naturalWidth||1,h=image.naturalHeight||1;
      ctx.drawImage(image,b.left*w,b.top*h,(b.right-b.left)*w,(b.bottom-b.top)*h,photoRect.x+b.left*photoRect.width-pivot.x,photoRect.y+b.top*photoRect.height-pivot.y,(b.right-b.left)*photoRect.width,(b.bottom-b.top)*photoRect.height);
    } else { ctx.fillStyle=horror?'#d8c6ae':'#ef6180';ctx.fill(); }
    ctx.restore();
  }
  function transformedGrip(slot,offsetY,angle) {
    const r=rootOf(slot.tooth),dx=slot.grip.x-r.x,dy=slot.grip.y-r.y;
    return {x:r.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:r.y+offsetY+dx*Math.sin(angle)+dy*Math.cos(angle)};
  }
  function kid(slot,x,y,s,grip,scared=false,sitting=false) {
    const skin=['#f1b991','#d89166','#f6d2ae','#ba7954','#e2a47d'][slot.i%5],hair=['#3d2932','#8b4c32','#332f40','#b47b3b'][slot.i%4];
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    const gx=(grip.x-x)/s,gy=(grip.y-y)/s,spread=compact?14:19;
    path([[-8,65],[gx-spread,gy+17],[gx-spread,gy]],skin,5);path([[8,65],[gx+spread,gy+17],[gx+spread,gy]],skin,5);
    ellipse(gx-spread,gy,4.5,5.5,skin);ellipse(gx+spread,gy,4.5,5.5,skin);
    rr(-10,62,20,22,6,slot.p.color||C.teal,'#152039',1.3);
    path([[-5,83],[-7,sitting?87:95],[-13,sitting?87:98]],'#29374b',5);path([[5,83],[sitting?13:7,sitting?87:95],[sitting?18:13,sitting?87:98]],'#29374b',5);
    path([[-14,sitting?87:98],[-8,sitting?87:98]],C.cream,3);path([[sitting?15:8,sitting?87:98],[sitting?21:15,sitting?87:98]],C.cream,3);
    ellipse(0,51,12.5,13,skin,'#503143',1.2);ellipse(-12,53,2,3,skin);ellipse(12,53,2,3,skin);
    ctx.beginPath();ctx.moveTo(-12,49);ctx.quadraticCurveTo(-15,34,-1,36);ctx.quadraticCurveTo(13,35,13,47);ctx.quadraticCurveTo(5,43,2,42);ctx.quadraticCurveTo(-1,48,-12,49);ctx.fillStyle=hair;ctx.fill();
    ellipse(-4,52,1.3,scared?2.2:1.6,'#211c29');ellipse(4,52,1.3,scared?2.2:1.6,'#211c29');
    if(scared)ellipse(0,58,2.8,3.5,'#79474b');else{ctx.beginPath();ctx.arc(0,55,4,.1,Math.PI-.1);ctx.strokeStyle='#79474b';ctx.lineWidth=1.3;ctx.stroke();}
    if(slot.i%5===2){rr(-8,48,7,7,2,null,'#322b38',1.3);rr(1,48,7,7,2,null,'#322b38',1.3);path([[-1,51],[1,51]],'#322b38',1);}
    ctx.restore();
  }
  function activeAt(t) {
    if(!running&&elapsed===0)return hover;
    if(t>=5930)return winner;
    if(t<850)return -1;
    return fakeouts[Math.floor((t-850)/630)%fakeouts.length]??-1;
  }
  function drawStudents(t) {
    const active=activeAt(t),selected=winner>=0&&t>=6600?slots[winner]:null;
    const pull=selected?ease((t-6600)/640)*24:0,angle=selected&&t<7240?Math.sin(t/43)*.055:0;
    if(selected){socket(selected.tooth);if(t<7240)fragment(selected.tooth,0,pull,angle);}
    for(const slot of slots) {
      if(slot.i===winner&&t>=7240)continue;
      const isSelected=slot===selected,grip=isSelected?transformedGrip(slot,pull,angle):slot.grip;
      const dy=isSelected?grip.y-slot.grip.y:0,dx=isSelected?grip.x-slot.grip.x:0;
      const wobble=running?Math.sin(t/(horror?25:65)+slot.i)*(slot.i===active?1.3:horror?.45:.12):0;
      const x=slot.x+dx+wobble,y=slot.y+dy;
      if(slot.i===active)ellipse(x,y+63*dollScale,19*dollScale+3,36*dollScale+3,'#f8c75a0e','#f8c75a70',1);
      kid(slot,x,y,dollScale,grip,horror||running&&slot.i===active);
      if(compact){ctx.font='600 8px system-ui';ctx.lineWidth=2.8;ctx.strokeStyle=C.navy;ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText(String(slot.i+1).padStart(2,'0'),x,y+109*dollScale);label(String(slot.i+1).padStart(2,'0'),x,y+109*dollScale,8,slot.i===active?C.gold:C.cream);}
    }
    if(!compact)for(const item of labels){const {slot,x,y,side}=item;if(slot.i===winner&&t>=6600)continue;const end=slot.x+side*13*dollScale,sy=slot.y+65*dollScale;path([[end,sy],[x-side*10,y]],'#cbd0dc38',.8);label(short(slot.p.name,120,12),x,y,12,slot.i===active?C.gold:'#e1e2e7',side<0?'right':'left',500);}
    if(winner>=0&&t>=7240)drawTumble(slots[winner],t);
  }
  function drawTumble(slot,t) {
    const q=clamp((t-7240)/650),landed=q===1,s=dollScale+(1-dollScale)*ease(q),sourceRoot=rootOf(slot.tooth);
    if(!landed){
      const x=slot.x+(500-slot.x)*ease(q),y=slot.y+24+(414-slot.y)*q*q;
      const rotation=q*TAU*.4;
      const toothX=sourceRoot.x+(500-sourceRoot.x)*ease(q),toothY=sourceRoot.y+24+(420-sourceRoot.y)*q*q;
      fragment(slot.tooth,0,0,rotation,1,{x:toothX,y:toothY});
      // The student remains clean and tumbles separately from the photographic fragment.
      kid(slot,x,y,s,{x:x,y:y+28*s},true);
    } else {
      const since=t-7890,bounce=Math.max(0,Math.sin(since/100))*10*Math.exp(-since/350);
      rr(448,502,104,12,6,'#8fe1cd');
      kid(slot,500,415-bounce,1,{x:500,y:443-bounce},false,true);
      const b=bounds(slot.tooth),fragmentHeight=(b.bottom-b.top)*photoRect.height;
      fragment(slot.tooth,0,0,slot.tooth.lower?Math.PI:.7,Math.min(1,42/Math.max(1,fragmentHeight)),{x:575,y:488-bounce});
      for(let i=0;i<7;i++){ctx.globalAlpha=Math.max(0,1-since/500);const a=i*TAU/7;ellipse(500+Math.cos(a)*(23+since/18),500+Math.sin(a)*5,4,3,C.cream);ctx.globalAlpha=1;}
      label(short(slot.p.name,300,16),500,538,16,C.gold,'center',700);
    }
  }
  function cue(t) {
    let text=`${horror?'R':'PG'} · ${players.length?running?'Hold tight':players.length+' holding on':'Add names'}`;
    if(hover>=0&&!running)text=`${horror?'R':'PG'} · ${String(hover+1).padStart(2,'0')} ${short(players[hover].name,185,10)}`;
    if(winner>=0&&t>=7890)text=`${horror?'R':'PG'} · Speaker picked`;
    ctx.font='600 10px system-ui';const w=Math.min(250,ctx.measureText(text).width+24);rr(22,19,w,27,13,'#101b33d9','#ffffff18');label(text,34,33,10,'#c9cdda','left',600);
  }
  function render(t=elapsed) {
    if(dead||!ctx)return;
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.navy;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,ox,oy);drawBackground();drawBear();
    ellipse(500,523,165,10,'#080e1d66');
    if(imageState!=='loading')drawStudents(t);
    cue(t);
  }
  function resize() {
    if(dead)return;const r=root.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round((r.width||1000)*dpr));canvas.height=Math.max(1,Math.round((r.height||560)*dpr));
    scale=Math.min(canvas.width/1000,canvas.height/560);ox=(canvas.width-1000*scale)/2;oy=(canvas.height-560*scale)/2;render();
  }
  function tick(now) {
    if(dead||!running)return;elapsed=Math.min(now-started,duration);render(elapsed);
    if(elapsed>=duration){running=false;frame=0;canvas.setAttribute('aria-label',`${players[winner].name} pulled the loose ${word} and is the next speaker.`);if(!picked){picked=true;onPick(players[winner].id);}}
    else frame=requestAnimationFrame(tick);
  }
  function point(event) {
    if(dead||running)return;const r=canvas.getBoundingClientRect();
    const x=((event.clientX-r.left)*canvas.width/Math.max(1,r.width)-ox)/scale,y=((event.clientY-r.top)*canvas.height/Math.max(1,r.height)-oy)/scale;
    let closest=-1,distance=Infinity;
    slots.forEach(slot=>{const dx=x-slot.x,dy=y-(slot.y+67*dollScale),d=dx*dx+dy*dy;if(Math.abs(dx)<Math.max(9,19*dollScale)&&Math.abs(dy)<38*dollScale+6&&d<distance){closest=slot.i;distance=d;}});
    if(closest!==hover){hover=closest;canvas.title=closest>=0?`${closest+1}: ${players[closest].name}`:'';render();}
  }
  function leave(){hover=-1;canvas.title='';if(!running)render();}
  canvas.addEventListener('pointermove',point);canvas.addEventListener('pointerdown',point);canvas.addEventListener('pointerleave',leave);
  image.onload=()=>{if(dead)return;const w=image.naturalWidth||1,h=image.naturalHeight||1,fit=photoSize/Math.max(w,h);photoRect={x:500-w*fit/2,y:535-h*fit,width:w*fit,height:h*fit};imageState='ready';layout();render();};
  image.onerror=()=>{if(dead)return;imageState='error';layout();render();};
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  observer?.observe(root);window.addEventListener('resize',resize);resize();
  image.src=artwork[horror?'horror':'pg']||new URL(`../assets/bear-${horror?'horror':'pg'}.png`,import.meta.url).href;
  return {
    start(){if(dead||running||!players.length)return;cancelAnimationFrame(frame);picked=false;hover=-1;winner=Math.min(players.length-1,Math.max(0,Math.floor(random()*players.length)));fakeouts=Array.from({length:9},()=>Math.min(players.length-1,Math.max(0,Math.floor(random()*players.length))));elapsed=0;running=true;started=performance.now();canvas.setAttribute('aria-label',`Students grip the real photographed ${horror?'teeth':'candies'}. One loose ${word} will select the next speaker.`);frame=requestAnimationFrame(tick);},
    reset(){if(dead)return;cancelAnimationFrame(frame);frame=0;running=false;elapsed=0;winner=-1;hover=-1;picked=false;fakeouts=[];canvas.title='';accessible();render();},
    destroy(){if(dead)return;dead=true;running=false;cancelAnimationFrame(frame);frame=0;image.onload=null;image.onerror=null;observer?.disconnect();window.removeEventListener('resize',resize);canvas.removeEventListener('pointermove',point);canvas.removeEventListener('pointerdown',point);canvas.removeEventListener('pointerleave',leave);root.remove();}
  };
}