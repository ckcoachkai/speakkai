import {RACE_ROSTER_TYPES,getRacerIdentity} from './race3d-roster.js?v=20261025-city-contact1';
/** Comparison uses the same game-calibrated parameters as the simulation. */
export function addCarGuide(root,map,options={}){
 const button=document.createElement('button');button.className='race3d-guide-button';button.textContent='Compare cars';button.type='button';map.append(button);
 const dialog=document.createElement('dialog');dialog.className='race3d-car-guide';dialog.setAttribute('aria-label','Compare car attributes');
 const title=document.createElement('h2');title.textContent='Five cars, different strengths';
 const note=document.createElement('p');note.textContent='Reference-informed simulation inputs; concept and class estimates are identified on each car card. Simplified grip, gearing and suspension are game models. Every driver has one held item slot.';
 const scroll=document.createElement('div');scroll.className='race3d-guide-scroll';const table=document.createElement('table');
 const head=document.createElement('thead'),hr=document.createElement('tr');for(const t of ['Car','Speciality','Mass','Speed ceiling','Power','Tyre grip','Braking','Durability']){const th=document.createElement('th');th.textContent=t;hr.append(th);}head.append(hr);table.append(head);
 const body=document.createElement('tbody'),roles=['Light / agile','Braking / resilience','All-round balance','Straight-line speed','Acceleration / heavy'];
 for(const [i,type]of RACE_ROSTER_TYPES.entries()){
  const c=getRacerIdentity(type),row=document.createElement('tr');
  const s=c.vehicleSpec;
  for(const t of [c.vehicleName,s.priority||roles[i],s.massKg+' kg',s.topSpeedKph+' km/h',s.powerKW+' kW',s.tireGrip.toFixed(2),s.brakeDecelMps2+' m/s²',c.durabilityFactor.toFixed(2)+'x']){const td=document.createElement('td');td.textContent=t;row.append(td);}body.append(row);
 }
 const cinematicLabel=document.createElement('label'),cinematic=document.createElement('input');cinematic.type='checkbox';cinematic.checked=!!options.cinematicRamps;cinematic.onchange=()=>options.onCinematic?.(cinematic.checked);cinematicLabel.append(cinematic,document.createTextNode(' Slow-motion ramp camera (slows every racer equally)'));cinematicLabel.style.cssText='display:block;padding:12px 0;cursor:pointer';
 const powerNote=document.createElement('p');powerNote.textContent='Nitro boost adds traction-limited ground acceleration and blue energy streaks, including on electric cars. Rocket adds forward thrust, including in the air; Launch makes a lofted jump. They are separate items. Attacks impose temporary speed/control penalties; shields prevent hits and Repair clears disruption. One held slot per car; the displayed item disappears when used.';
 table.append(body);scroll.append(table);const close=document.createElement('button');close.textContent='Back to race';close.type='button';close.onclick=()=>dialog.close();button.onclick=()=>dialog.showModal();dialog.append(title,note,scroll,powerNote,cinematicLabel,close);root.append(dialog);
 return ()=>{dialog.close();dialog.remove();button.remove();};
}
