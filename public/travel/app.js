const day1 = [
 ['10:00','Leave Qibao','Check live traffic first. Allow 1½–2 hours, with extra time if roads are busy.'],
 ['12:00','Arrive & have lunch','Leave bags with reception. Early room and pool access must be confirmed.'],
 ['13:00','An unhurried afternoon','Tea, a short walk or lounge time while waiting for your room.'],
 ['15:00','Check in','Official standard check-in time. Settle in and unpack your swim kit.'],
 ['15:30','Swimming & poolside rest','Confirm the indoor pool’s opening hours and swim-cap policy.'],
 ['17:00','Optional spa / quiet time','Choose a treatment only after checking availability, length and price.'],
 ['18:30','Dinner','Choose the hotel restaurant or a nearby meal that fits your food budget.'],
 ['20:00','A slow evening','A short stroll if conditions suit, then tea and an early night.']
];
const day2 = [
 ['07:15','Breakfast','Check whether your room package includes breakfast for both guests.'],
 ['08:00','Last lake-view moment','A brief walk or coffee. Keep bags ready and watch the traffic estimate.'],
 ['08:45','Check out','Settle extras and collect everything before leaving.'],
 ['09:00','Drive home','Aim for Qibao around 10:30–11:00, leaving extra time before noon.'],
 ['12:00','Back in Shanghai','Your hard return deadline. Leave earlier if live traffic calls for it.']
];
const costs = [{key:'room',name:'Room · one night',value:850},{key:'food',name:'Food · two adults',value:350},{key:'transport',name:'Return driving',value:200},{key:'spaCost',name:'Optional spa allowance',value:300}];
const yuan=n=>'¥'+n.toLocaleString('en-CN');
function events(rows){return rows.map(([t,title,note])=>`<div class="event"><time>${t}</time><div><h4>${title}</h4><p>${note}</p></div></div>`).join('');}
function renderPlan(){const rows=day1.map(row=>[...row]);if(!document.querySelector('#spa').checked)rows[5]=['17:00','Quiet time','Rest in your room or take a gentle walk. No treatment planned.'];document.querySelector('#day1').innerHTML=events(rows);document.querySelector('#day2').innerHTML=events(day2);}
document.querySelector('#costs').innerHTML=costs.map(c=>`<label class="cost-row" for="${c.key}"><span>${c.name} (CNY)</span><input type="number" min="0" max="100000" step="10" id="${c.key}" value="${c.value}"></label>`).join('');
function budget(){const spa=document.querySelector('#spa').checked;const values=costs.map(c=>Math.min(100000,Math.max(0,Number(document.getElementById(c.key).value)||0)));if(!spa)values[3]=0;document.querySelector('#spaCost').disabled=!spa;const total=values.reduce((a,b)=>a+b,0);document.querySelector('#total').textContent=yuan(total);document.querySelector('#remaining').textContent=total<=1500?yuan(1500-total)+' left within your target':yuan(total-1500)+' over your target';document.querySelector('#remaining').style.color=total>1500?'#a6422d':'#39747b';document.querySelector('#bars').innerHTML=costs.map((c,i)=>`<div class="bar-row">${c.name} · ${yuan(values[i])}<div class="bar-track"><div class="bar-fill" style="width:${total?values[i]/total*100:0}%"></div></div></div>`).join('');}
document.querySelector('#costs').addEventListener('input',budget);document.querySelector('#spa').addEventListener('change',()=>{renderPlan();budget();});document.querySelector('#print').onclick=()=>window.print();
document.querySelector('#calendar').onclick=()=>{const rows=[...day1.map(e=>({day:'20260916',event:e})),...day2.map(e=>({day:'20260917',event:e}))];const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SpeakKai//Travel Guide//EN','CALSCALE:GREGORIAN'];for(const [i,{day,event}] of rows.entries()){if(i===5&&!document.querySelector('#spa').checked)continue;const [time,title,note]=event;const stamp=day+'T'+time.replace(':','')+'00';const escape=s=>s.replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,');lines.push('BEGIN:VEVENT',`UID:suzhou-20260916-${i}@speakkai.com`,'DTSTAMP:20260915T080000Z',`DTSTART;TZID=Asia/Shanghai:${stamp}`,`SUMMARY:${escape(title)}`,`DESCRIPTION:${escape('Proposed itinerary. '+note)}`,'STATUS:TENTATIVE','END:VEVENT');}lines.push('END:VCALENDAR');const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='suzhou-bay-september-16-17.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};renderPlan();budget();
