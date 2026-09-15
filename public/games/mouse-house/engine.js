/* Mouse House: deterministic, DOM-free simulation. Also loadable by Node for verification. */
(function(root){
  'use strict';
  const COLORS=['#b8a9d5','#c9d99d','#eca787','#a8c9dc','#e5b2cb','#dbca83','#9bc8b7','#cca895'];
  function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function distances(maze,start){const d=Array(maze.n).fill(-1),q=[start];d[start]=0;for(let i=0;i<q.length;i++)for(const v of maze.links[q[i]])if(d[v]<0){d[v]=d[q[i]]+1;q.push(v);}return d;}
  function generate(rng,w=29,h=19){
    const n=w*h,links=Array.from({length:n},()=>[]),seen=new Set([0]),stack=[0];
    while(stack.length){const a=stack[stack.length-1],x=a%w,y=Math.floor(a/w),opts=[];if(x>0)opts.push(a-1);if(x<w-1)opts.push(a+1);if(y>0)opts.push(a-w);if(y<h-1)opts.push(a+w);const free=opts.filter(v=>!seen.has(v));if(!free.length){stack.pop();continue;}const b=free[Math.floor(rng()*free.length)];links[a].push(b);links[b].push(a);seen.add(b);stack.push(b);}
    const maze={w,h,n,links,start:0};const fromStart=distances(maze,0);let border=Array.from({length:n},(_,i)=>i).filter(i=>i%w===w-1||Math.floor(i/w)===h-1);maze.exit=border.reduce((a,b)=>fromStart[a]>fromStart[b]?a:b);maze.toExit=distances(maze,maze.exit);maze.fromStart=fromStart;return maze;
  }
  function route(maze,start,end){if(start===end)return [];const d=distances(maze,end),out=[];let at=start;while(at!==end){const next=maze.links[at].find(n=>d[n]<d[at]);if(next===undefined)throw Error('Disconnected maze');out.push(next);at=next;}return out;}
  function parseNames(text){const names=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!names.length)return {error:'Add at least one student to start.'};if(names.length>60)return {error:'Please use up to 60 students per crew.'};if(names.some(n=>n.length>40))return {error:'Keep each name to 40 characters or fewer.'};return {names};}
  class Round{
    constructor(people,seed=Date.now()){
      if(!people.length)throw Error('A round needs at least one mouse');this.rng=seeded(seed);this.maze=generate(this.rng);this.time=0;this.done=null;this.events=[];this.cheese=[];this.cheeseAt=1;this.cat=null;this.cheeseTarget=320;
      // Shuffle launch positions independently of roster order. All mice have identical base stats.
      const near=Array.from({length:this.maze.n},(_,i)=>i).filter(i=>this.maze.fromStart[i]<=5);
      this.mice=people.map(p=>({id:p.id,name:p.name,color:p.color,node:near[Math.floor(this.rng()*near.length)],next:null,progress:0,hp:20,cheeses:0,speed:1.6,burstUntil:0,lastBite:-10,visits:new Map(),committed:false,steps:0,previous:-1}));
      for(let i=this.mice.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[this.mice[i],this.mice[j]]=[this.mice[j],this.mice[i]];}
      this.refillCheese(this.cheeseTarget);
    }
    position(a){const w=this.maze.w;let x=a.node%w,y=Math.floor(a.node/w);if(a.next!==null){x+=(a.next%w-x)*a.progress;y+=(Math.floor(a.next/w)-y)*a.progress;}return {x,y};}
    spawnCheese(){
      this.refillCheese(1);
    }
    refillCheese(count){
      const occupied=new Set(this.cheese.map(c=>c.node));
      for(const m of this.mice){occupied.add(m.node);if(m.next!==null)occupied.add(m.next);}
      occupied.add(this.maze.start);occupied.add(this.maze.exit);
      const free=Array.from({length:this.maze.n},(_,i)=>i).filter(i=>!occupied.has(i));
      const total=Math.min(count,this.cheeseTarget-this.cheese.length,free.length);
      for(let i=0;i<total;i++){const j=i+Math.floor(this.rng()*(free.length-i));[free[i],free[j]]=[free[j],free[i]];this.cheese.push({node:free[i],born:this.time});}
    }
    mouseNext(m){
      const maze=this.maze,opts=maze.links[m.node];
      const v=(m.visits.get(m.node)||0)+1;m.visits.set(m.node,v);
      // Three returns to a cell, or the end of exploration, switches to a strictly descending exit distance.
      if(v>=3||this.time>=40)m.committed=true;
      if(m.committed)return opts.find(n=>maze.toExit[n]<maze.toExit[m.node]);
      const scored=opts.map(n=>({n,s:(m.visits.get(n)||0)*4+(n===m.previous?3:0)+(this.cheese.some(c=>c.node===n)?-6:0)+this.rng()*2.5}));
      scored.sort((a,b)=>a.s-b.s);return scored[0].n;
    }
    catNext(){
      const c=this.cat;let target=this.mice.find(m=>m.id===c.target);
      if(!target){target=this.mice[Math.floor(this.rng()*this.mice.length)];c.target=target.id;}
      const goal=target.next!==null?target.next:target.node;
      if(c.node===goal)return null;
      return route(this.maze,c.node,goal)[0]??null;
    }
    arrive(m){
      const i=this.cheese.findIndex(c=>c.node===m.node);
      if(i>=0){this.cheese.splice(i,1);m.cheeses++;m.speed*=2;this.events.push({kind:'cheese',id:m.id,node:m.node,text:'×'+(2**m.cheeses)});}
      if(m.node===this.maze.exit)this.choose(m,'escaped');
    }
    move(a,budget,isCat=false){
      // Traverse every edge; even very large cheese boosts cannot teleport through walls or skip an exit.
      while(budget>0&&!this.done){
        if(a.next===null){if(!isCat&&a.node===this.maze.exit){this.choose(a,'escaped');break;}a.next=isCat?this.catNext():this.mouseNext(a);if(a.next===undefined||a.next===null)break;}
        const step=Math.min(1-a.progress,budget);a.progress+=step;budget-=step;
        if(a.progress>=1-1e-9){a.previous=a.node;a.node=a.next;a.next=null;a.progress=0;a.steps=(a.steps||0)+1;if(!isCat)this.arrive(a);}
      }
    }
    bite(m){if(this.done||this.time-m.lastBite<.65)return false;m.lastBite=this.time;m.hp=Math.max(0,m.hp-1);m.burstUntil=this.time+.5;this.events.push({kind:'bite',id:m.id,node:m.node,text:'−1 HP'});if(m.hp===0)this.choose(m,'eaten');else this.move(m,.3);return true;}
    choose(m,reason){if(!this.done){this.done={id:m.id,name:m.name,reason,time:this.time,hp:m.hp,cheeses:m.cheeses};this.events.push({kind:'chosen',...this.done});}}
    step(dt){
      if(this.done)return;this.time+=dt;
      if(this.time>=30&&!this.cat){this.cat={node:0,next:null,progress:0,speed:3,target:null};this.events.push({kind:'cat'});}
      if(this.cat)this.cat.speed=Math.min(12,3+Math.floor(this.time-30)*.3);
      if(this.time>=this.cheeseAt){this.refillCheese(this.cheeseTarget);this.cheeseAt=this.time+1;}
      // Rotate update order to avoid favoring the first listed student on a shared simulation tick.
      const offset=Math.floor(this.rng()*this.mice.length);
      for(let i=0;i<this.mice.length&&!this.done;i++){const m=this.mice[(i+offset)%this.mice.length];this.move(m,m.speed*(this.time<m.burstUntil?1.5:1)*dt);}
      if(this.cat&&!this.done){this.move(this.cat,this.cat.speed*dt,true);const p=this.position(this.cat);for(const m of this.mice){const q=this.position(m);if(Math.hypot(p.x-q.x,p.y-q.y)<.48)this.bite(m);if(this.done)break;}}
    }
    update(dt){let left=dt;while(left>1e-8&&!this.done){const tick=Math.min(left,1/60);this.step(tick);left-=tick;}}
  }
  const api={Round,generate,route,distances,seeded,parseNames,COLORS};root.MouseHouse=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
