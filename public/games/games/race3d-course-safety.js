/** Startup-only geometry validation; no road edits or per-frame spline scans. */
const cache=new WeakMap();
const layouts=new WeakMap();
const angle=t=>Math.atan2(t.x,t.z),delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const gap=(a,b,length)=>{let d=(a-b)%length;if(d>length/2)d-=length;if(d< -length/2)d+=length;return d;};
function probes(track){let p=cache.get(track);if(!p){p=[];for(let d=0;d<track.totalLength;d+=32){const s=track.sampleTrack(d);p.push({d,x:s.position.x,z:s.position.z});}cache.set(track,p);}return p;}
export function auditStraightCorridor(track,distance,{length=22,runup=100,landing=400,halfWidth=3.9}={}){
 if(!track||typeof track.sampleTrack!=='function'||!(track.totalLength>0))return {safe:false,reason:'invalid-track'};
 const heading=angle(track.sampleTrack(distance).tangent),end=length+landing;let maxTurn=0,maxCurvature=0,maxGrade=0,minMargin=Infinity;
 const route=[];
 for(let offset=-runup;offset<=end;offset+=8){const d=distance+offset,s=track.sampleTrack(d),a=angle(s.tangent),turn=Math.abs(delta(a,heading)),curvature=Math.abs(delta(angle(track.sampleTrack(d+3).tangent),angle(track.sampleTrack(d-3).tangent)))/6,margin=(s.width||track.width||16.5)/2-halfWidth;
  maxTurn=Math.max(maxTurn,turn);maxCurvature=Math.max(maxCurvature,curvature);maxGrade=Math.max(maxGrade,Math.abs(s.tangent.y));minMargin=Math.min(minMargin,margin);
  if(margin<1.5)return {safe:false,reason:'width'};
  if(turn>.085||curvature>.0008)return {safe:false,reason:'bend'};
  if(Math.abs(s.tangent.y)>.08||Math.abs(s.bank||0)>.05)return {safe:false,reason:'grade-or-bank'};
  route.push({d,x:s.position.x,z:s.position.z});
 }
 for(const h of track.hazards||[]){const along=gap(h.distance,distance,track.totalLength);if(along>=-runup&&along<=end&&Math.abs(h.lateral||h.offset||0)<halfWidth+(h.radius||2)+1.5)return {safe:false,reason:'obstruction'};}
 for(const a of route)for(const b of probes(track)){if(Math.abs(gap(a.d,b.d,track.totalLength))<end+runup+80)continue;if(Math.hypot(a.x-b.x,a.z-b.z)<38)return {safe:false,reason:'near-intersection'};}
 return {safe:true,reason:null,runup,landing,maxTurn,maxCurvature,maxGrade,minMargin,assumedMaxSpeed:80};
}
export function safeRampSites(track,{wanted=5}={}){
 const key=wanted+':'+track.totalLength+':'+(track.hazards||[]).map(h=>[h.distance,h.lateral,h.offset,h.radius,h.type].join(',')).join(';'),old=layouts.get(track);
 if(old?.key===key)return old.sites.map(r=>({...r,corridor:{...r.corridor}}));
 const candidates=[];for(let d=160;d<track.totalLength-460;d+=24){const audit=auditStraightCorridor(track,d);if(audit.safe)candidates.push({distance:d,audit});}
 const chosen=[];for(let i=0;i<wanted;i++){const ideal=(i+.5)*track.totalLength/wanted,eligible=candidates.filter(c=>chosen.every(p=>Math.abs(gap(c.distance,p.distance,track.totalLength))>600));eligible.sort((a,b)=>Math.abs(a.distance-ideal)-Math.abs(b.distance-ideal)||a.distance-b.distance);if(eligible[0])chosen.push(eligible[0]);}
 const sites=chosen.sort((a,b)=>a.distance-b.distance).map((c,i)=>({id:'ramp-'+(i+1),distance:c.distance,lateral:0,width:5.8,length:22,height:2.6,corridor:c.audit}));layouts.set(track,{key,sites});return sites.map(r=>({...r,corridor:{...r.corridor}}));
}
