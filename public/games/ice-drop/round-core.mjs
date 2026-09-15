// The winner is the first body whose foot support leaves the remaining ice.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function seeded(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
export function setupBodies(names,seed=7){const r=seeded(seed),n=names.length;const slots=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]]}const cols=Math.ceil(Math.sqrt(n*1.7)),rows=Math.ceil(n/cols);return names.map((name,i)=>{const slot=slots[i],a=r()*Math.PI*2;return{name,x:n===1?0:((slot%cols+.5)/cols*2-1)*1.8+(rows>1?(Math.floor(slot/cols)%2?.25:-.25):0),z:n===1?0:((Math.floor(slot/cols)+.5)/rows*2-1)*1.12,dx:Math.cos(a),dz:Math.sin(a),phase:r()*6.28,speed:.65+r()*.65}})}
export function surface(t,duration){const p=clamp(t/duration);return{halfX:2.65*(1-.34*p),halfZ:1.65*(1-.34*p),height:.9*(1-.2*p),integrity:1-.4*p}}
export function bodyAt(body,t,duration){const p=clamp(t/duration),drift=p*p*4.8*body.speed;return{x:body.x+body.dx*drift+Math.sin(t*3.1+body.phase)*.09*p,z:body.z+body.dz*drift+Math.cos(t*2.7+body.phase)*.07*p}}
export function supported(pos,ice){return Math.abs(pos.x)<=ice.halfX-.09&&Math.abs(pos.z)<=ice.halfZ-.09}
export function createRound(names,seed,duration=12){if(!names.length)throw Error('No players remaining');const bodies=setupBodies(names,seed);let hit=null;for(let tick=1;tick<=duration*120;tick++){const t=tick/120,ice=surface(t,duration);const exits=bodies.map((b,i)=>({i,pos:bodyAt(b,t,duration)})).filter(b=>!supported(b.pos,ice));if(exits.length){ // Resolve a simultaneous step by interpolating the earliest boundary crossing.
let earliest=Infinity;for(const e of exits){let lo=t-1/120,hi=t;for(let k=0;k<18;k++){const m=(lo+hi)/2;if(supported(bodyAt(bodies[e.i],m,duration),surface(m,duration)))lo=m;else hi=m}if(hi<earliest){earliest=hi;hit={index:e.i,time:hi}}}break}}
if(!hit)throw Error('Round failed to produce a fall');return{bodies,hit,duration,seed,ice:surface(hit.time,duration)}}
export function remaining(names,history){return names.filter(n=>!history.includes(n))}

