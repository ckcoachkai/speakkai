/** Fictional race-only driver skills, drawn independently of car/name/real ability. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createDriverSkills(random,mode='varied'){
 const equal=mode==='equal',base=equal?.75:.50+random()*.46;
 const axis=()=>equal?.75:clamp(base+(random()-.5)*.34,.40,.98);
 const reaction=axis(),control=axis(),braking=axis(),ramp=axis(),items=axis();
 const strongest=Object.entries({reaction,control,braking,ramp,items}).sort((a,b)=>b[1]-a[1])[0][0];
 return Object.freeze({reaction,control,braking,ramp,items,equal,label:equal?'Equal test driver':{reaction:'Quick reactions',control:'Precise lines',braking:'Early planner',ramp:'Ramp specialist',items:'Item tactician'}[strongest]});
}
export function driverControls(s){return {reactionSeconds:.62-.45*s.reaction,steerResponse:3.8+2.1*s.control,lineError:s.equal?0:(1-s.control)*.85,brakeMargin:.82+.17*s.braking,lookAhead:.77+.30*s.braking,itemConfidence:.67-.15*s.items,itemThink:.42-.27*s.reaction,rampError:s.equal?0:(1-s.ramp)*.75,mistakeInterval:15+23*s.control,
 // Race-only concentration varies over time independently of position or car.
 // Equal-driver tests retain exactly constant pace.
 paceVariation:s.equal?0:.10,paceInterval:5+5*s.control};}
