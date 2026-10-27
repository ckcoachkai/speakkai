const API='https://ufxqfgxjsjezjhuyvyqd.supabase.co/rest/v1/health_records';
const KEY="sb_publishable_AiWOi_ogpJvoZA2jU_jxXQ_enJURjYz";
const el=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rows=[];
const by=d=>rows.filter(r=>r.dataset===d);
const numeric=(r,key)=>{const v=Number(r.payload[key]);return r.payload[key]!==''&&Number.isFinite(v)?v:null};
const config={
 'steps-daily':{name:'Steps',unit:'steps',value:r=>numeric(r,'value')},
 'sleep-daily-totals':{name:'Recorded sleep',unit:'hours',value:r=>{const x=numeric(r,'total_duration_minutes');return x===null?null:x/60}},
 'weight-records':{name:'Weight',unit:'kg',value:r=>numeric(r,'weight_kg')},
 'heart-manual-records':{name:'Manual heart rate',unit:'bpm',value:r=>parseFloat(r.payload.displayed_value)},
 'activity-time-daily':{name:'Recorded activity',unit:'min',value:r=>numeric(r,'value')},
 'calories-daily':{name:'App calories',unit:'kcal',value:r=>numeric(r,'value')}
};
function latest(dataset){return by(dataset).filter(r=>r.occurred_on).sort((a,b)=>(b.occurred_at_original||b.occurred_on).localeCompare(a.occurred_at_original||a.occurred_on)||Number(a.payload.record_order??0)-Number(b.payload.record_order??0))[0]}
function stat(name,value,note){return '<article class="stat"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></article>'}
function render(){
const w=latest('weight-records'),s=latest('steps-daily'),sl=latest('sleep-daily-totals'),push=by('exercise-log').filter(r=>r.occurred_on==='2026-10-27').reduce((a,r)=>a+(Number(r.payload.repetitions)||0),0);
el('stats').innerHTML=stat('Pushups · Oct 27',push,'Completed · user reported')+stat('Latest recorded steps',s?Number(s.payload.value).toLocaleString():'Unknown',s?s.occurred_on+' · partial day':'No record')+stat('Latest captured sleep',sl?(Number(sl.payload.total_duration_minutes)/60).toFixed(1)+' h':'Unknown',sl?sl.occurred_on+' · captured sessions':'No record')+stat('Latest imported weight',w?w.payload.weight_kg+' kg':'Unknown',w?w.occurred_on+' · older reading':'No record');
el('exercise').innerHTML=by('exercise-log').map(r=>'<div class="exercise-row"><div><strong>'+esc(r.payload.repetitions)+' pushups</strong><small>Completed · sets, duration and calories not reported</small></div><span>'+esc(r.occurred_on)+'</span></div>').join('')||'<p>No exercise entries imported.</p>';
el('meals').innerHTML=by('food-log').map(r=>{const p=r.payload;return '<article class="meal"><span class="eyebrow">'+esc(p.meal)+'</span><h3>'+esc(p.id.replaceAll('-',' '))+'</h3><ul>'+p.items.map(x=>'<li>'+esc(x.food)+(x.amount_g!=null?' · '+esc(x.amount_g)+' g':x.amount_original?' · '+esc(x.amount_original)+' (unit unclear)':x.amount!=null?' · '+esc(x.amount)+' '+esc(x.unit):' · portion unknown')+'</li>').join('')+'</ul><p>Calories & macros: not calculated</p><small>Eating date unconfirmed · incomplete day</small></article>'}).join('');
const ds=['steps-daily','calories-daily','activity-time-daily','sleep-sessions','weight-records','heart-manual-records'];
el('coverage').innerHTML='<table><thead><tr><th>Source series</th><th>Rows</th><th>Coverage</th></tr></thead><tbody>'+ds.map(d=>{const a=by(d).map(r=>r.occurred_on).filter(Boolean).sort();return '<tr><td>'+esc(d.replaceAll('-',' '))+'</td><td>'+by(d).length+'</td><td>'+esc(a[0])+' → '+esc(a.at(-1))+'</td></tr>'}).join('')+'</tbody></table>';
draw();
}
function draw(){
const dataset=el('metric').value,c=config[dataset];
let a=by(dataset).map(r=>({date:r.occurred_on,value:c.value(r)})).filter(x=>x.date&&Number.isFinite(x.value)).sort((a,b)=>a.date.localeCompare(b.date));
if(!a.length){el('chart').textContent='No recorded values for this metric.';return}
const latestTime=Date.parse(a.at(-1).date+'T00:00:00Z'),period=el('period').value;
if(period!=='all')a=a.filter(x=>Date.parse(x.date+'T00:00:00Z')>=latestTime-(Number(period)-1)*86400000);
const values=a.map(x=>x.value),lo=Math.min(...values),hi=Math.max(...values),span=Math.max(hi-lo,1),low=Math.max(0,lo-span*.15),high=hi+span*.15;
const start=Date.parse(a[0].date+'T00:00:00Z'),end=Date.parse(a.at(-1).date+'T00:00:00Z'),width=960,height=280,left=65,right=24,top=15,bottom=45;
const xx=x=>left+(Date.parse(x.date+'T00:00:00Z')-start)/Math.max(end-start,86400000)*(width-left-right),yy=v=>top+(high-v)/(high-low)*(height-top-bottom);
let body='';
for(let i=0;i<4;i++){const v=low+(high-low)*i/3,y=yy(v);body+='<line class="grid" x1="'+left+'" x2="'+(width-right)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(left-9)+'" y="'+(y+4)+'" text-anchor="end">'+v.toLocaleString(undefined,{maximumFractionDigits:1})+'</text>'}
body+=a.map(p=>'<circle cx="'+xx(p)+'" cy="'+yy(p.value)+'" r="3"><title>'+esc(p.date+': '+p.value.toFixed(1)+' '+c.unit)+'</title></circle>').join('');
body+='<text x="'+left+'" y="'+(height-10)+'">'+esc(a[0].date)+'</text><text x="'+(width-right)+'" y="'+(height-10)+'" text-anchor="end">'+esc(a.at(-1).date)+'</text>';
el('chart').innerHTML='<svg viewBox="0 0 960 280" role="img" aria-label="'+esc(c.name)+' recorded observations from '+a[0].date+' to '+a.at(-1).date+'">'+body+'</svg>';
el('chart-note').textContent=c.name+' · '+c.unit+' · '+a.length+' observations · '+a[0].date+' to '+a.at(-1).date+(dataset==='weight-records'?' · Older scale series; not a current weight trend.':dataset==='heart-manual-records'?' · Repeated manual readings, not continuous monitoring.':'');
}
async function load(){
try{
for(let offset=0;;offset+=500){const response=await fetch(API+'?select=id,dataset,kind,occurred_on,occurred_at_original,timezone_status,is_derived,payload&order=id&limit=500&offset='+offset,{headers:{apikey:KEY},cache:'no-store'});if(!response.ok)throw new Error('Health data request failed ('+response.status+').');const page=await response.json();if(!Array.isArray(page))throw new Error('Unexpected health data response.');rows.push(...page);if(page.length<500)break}
el('load-status').textContent='Connected to Supabase · Mi Fitness captured October 24 · Dot export pending · Public read-only journal';
render();
}catch(err){el('load-status').textContent='Health records could not be loaded. '+err.message+' Please retry later.';el('load-status').setAttribute('role','alert');}
}
el('metric').addEventListener('change',draw);el('period').addEventListener('change',draw);
el('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({timezone:'Asia/Shanghai',records:rows},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='speakkai-health-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
load();

