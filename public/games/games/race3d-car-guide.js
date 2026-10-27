import {RACE_ROSTER_TYPES,getRacerIdentity} from './race3d-roster.js?v=20261027-midnight';
import {ALL_ITEM_IDS,ITEM_REGISTRY} from './race3d-item-registry.js?v=20261027-midnight';
import {itemThumbnail} from './race3d-ui-catalog.js?v=20261027-midnight';
/** Comparison uses the same game-calibrated parameters as the simulation. */
export function addCarGuide(root,map,options={}){
 const button=document.createElement('button');button.className='race3d-guide-button';button.textContent='Compare cars';button.type='button';map.append(button);
 const dialog=document.createElement('dialog');dialog.className='race3d-car-guide';dialog.setAttribute('aria-label','Compare car attributes');
 const title=document.createElement('h2');title.textContent=RACE_ROSTER_TYPES.length+' cars, different strengths';
 const note=document.createElement('p');note.textContent='Mixed-class race calibration: these game power, speed and grip values differ from the source reference estimates. Cars retain mass, suspension and specialist tradeoffs. Fictional driver skills are redrawn each race, independently of car, student name and real ability: reactions, lines, braking, ramp judgment and item confidence affect decisions. One held item slot each; trailing cars have better odds of useful comeback items, never a guaranteed win.';
 const scroll=document.createElement('div');scroll.className='race3d-guide-scroll';const table=document.createElement('table');
 const head=document.createElement('thead'),hr=document.createElement('tr');for(const t of ['Car','Speciality','Mass','Speed ceiling','Power','Tyre grip','Braking','Durability']){const th=document.createElement('th');th.textContent=t;hr.append(th);}head.append(hr);table.append(head);
 const body=document.createElement('tbody'),roles=['Light / agile','Braking / resilience','All-round balance','Straight-line speed','Acceleration / heavy'];
 for(const [i,type]of RACE_ROSTER_TYPES.entries()){
  const c=getRacerIdentity(type),row=document.createElement('tr');
  const s=c.vehicleSpec;
  for(const t of [c.vehicleName,s.priority||roles[i],s.massKg+' kg',s.topSpeedKph+' km/h',s.powerKW+' kW',s.tireGrip.toFixed(2),s.brakeDecelMps2+' m/s²',c.durabilityFactor.toFixed(2)+'x']){const td=document.createElement('td');td.textContent=t;row.append(td);}body.append(row);
 }
 const cinematicLabel=document.createElement('label'),cinematic=document.createElement('input');cinematic.type='checkbox';cinematic.checked=!!options.cinematicRamps;cinematic.onchange=()=>options.onCinematic?.(cinematic.checked);cinematicLabel.append(cinematic,document.createTextNode(' Slow-motion ramp camera (slows every racer equally)'));cinematicLabel.style.cssText='display:block;padding:12px 0;cursor:pointer';
 const powerNote=document.createElement('p');powerNote.textContent='Nitro boost adds traction-limited ground acceleration and blue energy streaks, including on electric cars. Rocket adds forward thrust and a finite, attitude-dependent lift budget with white jets; Launch gives one mass-dependent upward impulse followed by gravity. They are separate items. Attacks impose temporary speed/control penalties; shields prevent hits and Repair clears disruption. One held slot per car; the displayed item disappears when used.';
 const items=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Powerup field guide';items.append(summary);const hint=document.createElement('p');hint.textContent='One held item until used. Drivers wait for a useful target or safe opportunity. Active effects use separate rings and status labels; the held icon disappears when the item is consumed.';items.append(hint);for(const id of ALL_ITEM_IDS){const row=document.createElement('p'),icon=document.createElement('span');icon.innerHTML=itemThumbnail(id);icon.style.cssText='display:inline-block;width:32px;height:32px;vertical-align:middle;margin-right:8px';row.append(icon,document.createTextNode(ITEM_REGISTRY[id].label+' — '+ITEM_REGISTRY[id].mechanic));items.append(row);}
 table.append(body);scroll.append(table);const close=document.createElement('button');close.textContent='Back to race';close.type='button';close.onclick=()=>dialog.close();button.onclick=()=>dialog.showModal();dialog.append(title,note,scroll,powerNote,items,cinematicLabel,close);root.append(dialog);
 return ()=>{dialog.close();dialog.remove();button.remove();};
}
