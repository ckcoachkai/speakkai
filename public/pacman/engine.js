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
    constructor(students, random=Math.random) {
      this.random=random;
      this.pac={x:13,y:23,dir:'left',remaining:0,queued:'left'};
      this.active=true; this.boost=0; this.score=0; this.elapsed=0;
      this.pellets=new Map();
      MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='.'||c==='o')this.pellets.set(`${x},${y}`,c);}));
      const dist=distances(this.pac.x,this.pac.y);
      const cells=shuffle([...dist].filter(([key,d])=>d>=12&&MAP[Number(key.split(',')[1])][Number(key.split(',')[0])]==='.')
        .map(([key])=>{const [x,y]=key.split(',').map(Number);return {x,y};}),random);
      this.ghosts=students.map((s,i)=>({ ...cells[i%cells.length],id:s.id,name:s.name,color:s.color||COLORS[i%COLORS.length],
        index:i, dir:Object.keys(DIRS)[Math.floor(random()*4)],remaining:0,speed:3.5+random()*1.1 }));
      this.events=[];
    }
    setDirection(dir) { if(DIRS[dir])this.pac.queued=dir; }
    chooseGhost(g,dist) {
      let choices=Object.keys(DIRS).filter(d=>neighbor(Math.round(g.x),Math.round(g.y),d));
      const forward=choices.filter(d=>DIRS[d][0]!==-DIRS[g.dir][0]||DIRS[d][1]!==-DIRS[g.dir][1]);
      if(forward.length)choices=forward;
      if(this.random()<.24)return choices[Math.floor(this.random()*choices.length)];
      let best=-Infinity, chosen=choices[0];
      for(const dir of choices) {const q=neighbor(Math.round(g.x),Math.round(g.y),dir), d=dist.get(`${q.x},${q.y}`)??0;
        const value=(this.boost>0?d:-d)+this.random()*2; if(value>best){best=value;chosen=dir;} }
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
        if(c==='o')this.boost=6;
        this.events.push({type:c==='o'?'power':'pellet'});
      }
    }
    step(dt) {
      if(!this.active)return [];
      this.events=[];
      // Small substeps prevent crossing through a ghost at low frame rates.
      let left=Math.min(dt,.1);
      while(left>1e-8&&this.active) {
        const delta=Math.min(left,1/120);left-=delta;this.elapsed+=delta;this.boost=Math.max(0,this.boost-delta);
        this.move(this.pac,(this.boost>0?7:5.5)*delta,()=>{
          if(neighbor(this.pac.x,this.pac.y,this.pac.queued))return this.pac.queued;
          return this.pac.dir;
        },()=>this.consume());
        const dist=distances(this.pac.x,this.pac.y);
        for(const g of this.ghosts)this.move(g,g.speed*(this.boost>0?.85:1)*delta,()=>this.chooseGhost(g,dist));
        for(const g of this.ghosts) {
          let dx=Math.abs(this.pac.x-g.x);
          if(Math.abs(this.pac.y-14)<.1&&Math.abs(g.y-14)<.1)dx=Math.min(dx,W-dx);
          if(Math.hypot(dx,this.pac.y-g.y)<.68){
            this.active=false;
            if(this.boost>0){this.score+=200;this.events.push({type:'catch',student:{id:g.id,name:g.name,color:g.color}});}
            else this.events.push({type:'death'});
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
