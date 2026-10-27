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
el('stats').innerHTML=stat('Pushups · Oct 27',push,'Completed · user reported')+stat('Latest recorded steps',s?Number(s.payload.value).toLocaleString():'Unknown',s?s.occurred_on+' · partial day':'No record')+stat('Latest captured sleep',sl?(Number(sl.payload.total_duration_minutes)/60).toFixed(1)+' h':'Unknown',sl?sl.occurred_on+' · captured sessions':'No record')+stat('Latest imported weight',w?w.payload.weight_kg+' kg':'Unknown',w?w.occurred_on+' · scale reading':'No record');
el('exercise').innerHTML=by('exercise-log').map(r=>'<div class="exercise-row"><div><strong>'+esc(r.payload.exercise==='pushup'?r.payload.repetitions+' pushups':r.payload.title||r.payload.exercise)+'</strong><small>'+esc(r.payload.exercise==='pushup'?'Completed · sets, duration and calories not reported':r.payload.duration_minutes+' min · '+r.payload.speed_kmh+' km/h · '+r.payload.incline_percent+'% incline · user reported')+'</small></div><span>'+esc(r.occurred_on||r.payload.date_context||'Date unconfirmed')+'</span></div>').join('')||'<p>No exercise entries imported.</p>';
el('meals').innerHTML=by('food-log').sort((a,b)=>(b.occurred_on||'').localeCompare(a.occurred_on||'')).map(r=>{const p=r.payload;return '<article class="meal"><span class="eyebrow">'+esc(p.meal)+'</span><h3>'+esc(p.id.replaceAll('-',' '))+'</h3><ul>'+p.items.map(x=>'<li>'+esc(x.food)+(x.amount_g!=null?' · '+esc(x.amount_g)+' g':x.amount_original?' · '+esc(x.amount_original)+' (unit unclear)':x.amount!=null?' · '+esc(x.amount)+' '+esc(x.unit):' · portion unknown')+'</li>').join('')+'</ul>'+nutrition(p)+'<small>'+esc(r.occurred_on||p.date_context||'Eating date unconfirmed')+' · incomplete day</small></article>'}).join('');
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
el('chart-note').textContent=c.name+' · '+c.unit+' · '+a.length+' observations · '+a[0].date+' to '+a.at(-1).date+(dataset==='weight-records'?' · Sparse scale readings; latest report October 25. Not a continuous weight trend.':dataset==='heart-manual-records'?' · Repeated manual readings, not continuous monitoring.':'');
}
async function fetchPage(offset){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(API+'?select=id,dataset,kind,occurred_on,occurred_at_original,timezone_status,is_derived,payload&order=id&limit=500&offset='+offset,{headers:{apikey:KEY},cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new Error('Health data request failed ('+response.status+').');
   const page=await response.json();if(!Array.isArray(page))throw new Error('Unexpected health data response.');return page;
  }catch(err){last=err;if(attempt<2){el('load-status').textContent='Connection interrupted. Retrying the health journal…';await new Promise(resolve=>setTimeout(resolve,700*(attempt+1)));}}
 }
 throw last;
}
async function load(){
try{
const pending=[];
for(let offset=0;;offset+=500){const page=await fetchPage(offset);pending.push(...page);if(page.length<500)break}
rows=pending;
el('load-status').textContent='Connected to Supabase · Mi Fitness captured October 24 · Dot export merged · 106 conversations · Public read-only journal';
render();renderDot();renderHistory();renderPhotos();
}catch(err){el('load-status').textContent='Health records could not be loaded. '+err.message+' Please retry later.';el('load-status').setAttribute('role','alert');}
}
el('metric').addEventListener('change',draw);el('period').addEventListener('change',draw);
el('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({timezone:'Asia/Shanghai',records:rows},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='speakkai-health-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
load();


function nutrition(p){
 if(p.calories==null)return '<p>Calories & macros: not calculated</p>';
 const parts=['~'+p.calories+' kcal'];
 if(p.protein_g!=null)parts.push('P '+p.protein_g+' g');if(p.carbs_g!=null)parts.push('C '+p.carbs_g+' g');if(p.fat_g!=null)parts.push('F '+p.fat_g+' g');
 return '<p class="nutrition">'+esc(parts.join(' · '))+'</p><p class="caption">Historical estimate'+(p.range_kcal?' · '+esc(p.range_kcal.join('–'))+' kcal range':'')+'</p>'+(p.notes||p.nutrition_notes?'<details class="meal-notes"><summary>Assumptions & corrections</summary><p>'+esc([...(p.notes||[]),p.nutrition_notes||''].filter(Boolean).join(' '))+'</p></details>':'');
}
function renderDot(){
 const r=by('body-composition').sort((a,b)=>(b.occurred_on||'').localeCompare(a.occurred_on||''))[0];if(!r)return;
 const p=r.payload;el('composition').innerHTML=stat('Body fat',p.body_fat_percent+'%','Bioimpedance estimate')+stat('Muscle mass',p.muscle_mass_kg+' kg','Device estimate · not change over time')+stat('Visceral fat',p.visceral_fat_rating,'Device rating · not a diagnosis')+stat('Basal metabolism',p.bmr_kcal_estimate+' kcal','Device BMR estimate · not intake target');
}
function inline(text){return esc(text).replace(/\[([^\]]+)\]\((https:\/\/[^ )]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
function markdown(text){
 const lines=text.split(/\r?\n/);let out='',table=false,list=false;
 for(const input of lines){
  const line=input.trim();
  if(line.startsWith('|')){if(!table){if(list){out+='</ul>';list=false}out+='<div class="table-wrap"><table><tbody>';table=true}if(/^\|[\s:|-]+\|$/.test(line))continue;out+='<tr>'+line.replace(/^\||\|$/g,'').split('|').map(c=>'<td>'+inline(c.trim())+'</td>').join('')+'</tr>';continue}
  if(table){out+='</tbody></table></div>';table=false}
  if(/^[-*] /.test(line)){if(!list){out+='<ul>';list=true}out+='<li>'+inline(line.slice(2))+'</li>';continue}
  if(list){out+='</ul>';list=false}
  if(/^#{1,6} /.test(line)){out+='<h3>'+inline(line.replace(/^#{1,6} /,''))+'</h3>';continue}
  if(line&&!/^[-_]{3,}$/.test(line))out+='<p>'+inline(line)+'</p>';
 }
 if(table)out+='</tbody></table></div>';if(list)out+='</ul>';return out;
}
function renderHistory(){
 const query=el('history-search').value.toLowerCase(),category=el('history-category').value;
 const matches=by('dot-history').filter(r=>(category==='all'||r.payload.category===category)&&((r.payload.title+' '+r.payload.text).toLowerCase().includes(query)));
 el('history-count').textContent=matches.length+' matching source sections · repeated history is not additional consumption';
 el('history').innerHTML=matches.map(r=>'<details class="history-entry"><summary>'+esc(r.payload.title)+'</summary><div class="history-body"><span class="tag">'+esc(r.payload.category)+'</span>'+markdown(r.payload.text)+'</div></details>').join('')||'<p>No matching source sections.</p>';
}
let photoLimit=18;
function renderPhotos(){
 const q=el('photo-search').value.toLowerCase(),all=by('dot-photos').filter(r=>(r.payload.label+' '+r.payload.type+' '+r.payload.upload_date_utc).toLowerCase().includes(q)).sort((a,b)=>b.payload.upload_date_utc.localeCompare(a.payload.upload_date_utc));
 const shown=all.slice(0,photoLimit);
 el('photo-count').textContent=all.length+' matching originals · showing '+shown.length+' · previews for personal food and measurement images';
 el('photo-catalog').innerHTML=shown.map(r=>{const p=r.payload;return '<article class="photo-card">'+(p.public_image?'<a href="'+esc(p.public_image)+'" target="_blank" rel="noopener"><img src="'+esc(p.public_image)+'" alt="'+esc(p.label)+'" loading="lazy" width="640" height="480"></a>':'<div class="photo-placeholder">'+esc(p.type)+'</div>')+'<span class="tag">'+esc(p.type)+'</span><h3>'+esc(p.label)+'</h3><small>Uploaded '+esc(p.upload_date_utc)+' UTC · eating day unconfirmed</small>'+(p.public_image?'':'<p class="caption">Original retained in the source backup.</p>')+'</article>'}).join('');
 el('more-photos').hidden=photoLimit>=all.length;
}
el('history-search').addEventListener('input',renderHistory);el('history-category').addEventListener('change',renderHistory);
el('photo-search').addEventListener('input',()=>{photoLimit=18;renderPhotos()});el('more-photos').addEventListener('click',()=>{photoLimit+=18;renderPhotos()});
