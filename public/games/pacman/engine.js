/* Classic maze geometry with classroom chase rules. No network dependencies. */
(function (root) {
  'use strict';
  const MAP = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ###--### ##.#     ',
    '######.## #      # ##.######',
    '      .   #      #   .      ',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#.####.#####.##.#####.####.#',
    '#o..##.......  .......##..o#',
    '###.##.##.########.##.##.###',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################'
  ];
  const DIRS = { left: [-1,0], right: [1,0], up: [0,-1], down: [0,1] };
  const COLORS = ['#ff4242','#ffb8ff','#00e8e8','#ffb852','#a5f56b','#ac99ff'];
  const W = 28, H = 31;
  function walkable(x,y) {
    if (y < 0 || y >= H) return false;
    if (y === 14) x = (x + W) % W;
    if (x < 0 || x >= W) return false;
    if (y >= 10 && y <= 18 && y !== 14 && (x < 6 || x > 21)) return false;
    if (x >= 10 && x <= 17 && y >= 12 && y <= 16) return false;
    return MAP[y][x] !== '#' && MAP[y][x] !== '-';
  }
  function neighbor(x,y,dir) {
    x=Math.round(x);y=Math.round(y);
    const d = DIRS[dir], nx = x+d[0], ny = y+d[1];
    return walkable(nx,ny) ? {x:(nx+W)%W, y:ny} : null;
  }
  function distances(x,y) {
    x = (Math.round(x)+W)%W; y = Math.round(y);
    const dist = new Map([[`${x},${y}`,0]]), queue = [{x,y}];
    for (let i=0; i<queue.length; i++) {
      const p=queue[i], n=dist.get(`${p.x},${p.y}`)+1;
      for (const dir of Object.keys(DIRS)) {
        const q=neighbor(p.x,p.y,dir); if (!q) continue;
        const key=`${q.x},${q.y}`;
        if (!dist.has(key)) { dist.set(key,n); queue.push(q); }
      }
    }
    return dist;
  }
  function shuffle(items,random) {
    for(let i=items.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [items[i],items[j]]=[items[j],items[i]]; }
    return items;
  }
  class Engine {
    constructor(students, random=Math.random, options={}) {
      this.random=random;
      this.normal=options.mode==='normal';this.level=options.level||1;this.combo=0;
      this.fruit=null;this.fruitSpawns=new Set();
      this.pac={x:13,y:23,dir:'left',remaining:0,queued:'left'};
      this.active=true; this.boost=0; this.score=0; this.elapsed=0;
      this.pellets=new Map();
      MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='.'||c==='o')this.pellets.set(`${x},${y}`,c);}));
      const dist=distances(this.pac.x,this.pac.y);
      const cells=shuffle([...dist].filter(([key,d])=>d>=12&&MAP[Number(key.split(',')[1])][Number(key.split(',')[0])]==='.')
        .map(([key])=>{const [x,y]=key.split(',').map(Number);return {x,y};}),random);
      this.ghosts=students.map((s,i)=>({ ...cells[i%cells.length],id:s.id,name:s.name,color:s.color||COLORS[i%COLORS.length],
        index:i, dir:Object.keys(DIRS)[Math.floor(random()*4)],remaining:0,speed:3.5+random()*1.1 }));
      if(this.normal)this.ghosts.forEach((g,i)=>{g.x=12+i;g.y=11;g.home={x:g.x,y:g.y};g.speed=4.1+i*.12+Math.min(this.level-1,8)*.12;g.returning=false;});
      if(options.pellets)this.pellets=new Map(options.pellets);
      this.events=[];
    }
    setDirection(dir) { if(DIRS[dir])this.pac.queued=dir; }
    chooseGhost(g,dist) {
      if(g.returning)dist=distances(g.home.x,g.home.y);
      else if(this.normal&&this.boost<=0){
        // Alternating scatter and chase, with different targets for the four ghosts.
        const corners=[{x:26,y:1},{x:1,y:1},{x:26,y:29},{x:1,y:29}];
        const scatter=this.elapsed%27<7;
        let target=scatter?corners[g.index%4]:this.pac;
        if(!scatter&&g.index===1){const d=DIRS[this.pac.dir];target={x:this.pac.x+d[0]*4,y:this.pac.y+d[1]*4};}
        if(!scatter&&g.index===2)target={x:26-this.pac.x,y:30-this.pac.y};
        if(!scatter&&g.index===3&&(dist.get(`${Math.round(g.x)},${Math.round(g.y)}`)||0)<8)target=corners[3];
        // Target the nearest open tile if an anticipated position falls inside a wall.
        let best=Infinity,cell=target;
        for(const key of dist.keys()){const [x,y]=key.split(',').map(Number),d=Math.hypot(x-target.x,y-target.y);if(d<best){best=d;cell={x,y};}}
        dist=distances(cell.x,cell.y);
      }
      let choices=Object.keys(DIRS).filter(d=>neighbor(Math.round(g.x),Math.round(g.y),d));
      const forward=choices.filter(d=>DIRS[d][0]!==-DIRS[g.dir][0]||DIRS[d][1]!==-DIRS[g.dir][1]);
      if(forward.length)choices=forward;
      if(!g.returning&&this.random()<(this.normal?.08:.24))return choices[Math.floor(this.random()*choices.length)];
      let best=-Infinity, chosen=choices[0];
      for(const dir of choices) {const q=neighbor(Math.round(g.x),Math.round(g.y),dir), d=dist.get(`${q.x},${q.y}`)??0;
        const value=(this.boost>0&&!g.returning?d:-d)+this.random()*(this.normal?.25:2); if(value>best){best=value;chosen=dir;} }
      return chosen;
    }
    move(entity,amount,choose,onCenter) {
      while(amount>1e-8&&this.active) {
        if(entity.remaining<1e-8) {
          entity.x=(Math.round(entity.x)+W)%W;entity.y=Math.round(entity.y);
          if(onCenter)onCenter();
          const dir=choose(); if(!dir||!neighbor(entity.x,entity.y,dir))return;
          entity.dir=dir;entity.remaining=1;
        }
        const step=Math.min(amount,entity.remaining), d=DIRS[entity.dir];
        entity.x+=d[0]*step;entity.y+=d[1]*step;
        entity.remaining-=step;amount-=step;
      }
    }
    consume() {
      const key=`${Math.round(this.pac.x)},${Math.round(this.pac.y)}`, c=this.pellets.get(key);
      if(c) {this.pellets.delete(key);this.score+=c==='o'?50:10;
        if(c==='o'){this.boost=this.normal?Math.max(2,6-(this.level-1)*.4):6;this.combo=0;}
        this.events.push({type:c==='o'?'power':'pellet'});
        if(this.normal){
          const eaten=244-this.pellets.size;
          if((eaten===70||eaten===170)&&!this.fruitSpawns.has(eaten)){this.fruitSpawns.add(eaten);this.fruit={x:13,y:17,time:9};}
          if(!this.pellets.size){this.active=false;this.events.push({type:'level'});}
        }
      }
      if(this.normal&&this.fruit&&Math.hypot(this.pac.x-this.fruit.x,this.pac.y-this.fruit.y)<.7){const points=Math.min(5000,100*this.level);this.score+=points;this.fruit=null;this.events.push({type:'fruit',points});}
    }
    step(dt) {
      if(!this.active)return [];
      this.events=[];
      // Small substeps prevent crossing through a ghost at low frame rates.
      let left=Math.min(dt,.1);
      while(left>1e-8&&this.active) {
        const delta=Math.min(left,1/120);left-=delta;this.elapsed+=delta;this.boost=Math.max(0,this.boost-delta);
        if(this.fruit){this.fruit.time-=delta;if(this.fruit.time<=0)this.fruit=null;}
        this.move(this.pac,(this.normal?5.5+Math.min(this.level-1,8)*.1:this.boost>0?7:5.5)*delta,()=>{
          if(neighbor(this.pac.x,this.pac.y,this.pac.queued))return this.pac.queued;
          return this.pac.dir;
        },()=>this.consume());
        if(!this.active)break;
        const dist=distances(this.pac.x,this.pac.y);
        for(const g of this.ghosts)this.move(g,(g.returning?9:g.speed*(this.boost>0?.85:1))*delta,()=>this.chooseGhost(g,dist),()=>{
          if(g.returning&&g.x===g.home.x&&g.y===g.home.y){g.returning=false;g.safeUntil=this.elapsed+1;}
        });
        for(const g of this.ghosts) {
          if(g.returning||g.safeUntil>this.elapsed)continue;
          let dx=Math.abs(this.pac.x-g.x);
          if(Math.abs(this.pac.y-14)<.1&&Math.abs(g.y-14)<.1)dx=Math.min(dx,W-dx);
          if(Math.hypot(dx,this.pac.y-g.y)<.68){
            if(this.normal&&this.boost>0){const points=200*2**Math.min(this.combo++,3);this.score+=points;g.returning=true;this.events.push({type:'ghost',points,x:g.x,y:g.y});}
            else {this.active=false;if(this.boost>0){this.score+=200;this.events.push({type:'catch',student:{id:g.id,name:g.name,color:g.color}});}else this.events.push({type:'death'});}
            break;
          }
        }
      }
      return this.events;
    }
  }
  const api={MAP,DIRS,COLORS,W,H,Engine,walkable,neighbor,distances,shuffle};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PacEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
