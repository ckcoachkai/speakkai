// Each line is an authored sequence, not an automatically multiplied combination.
// name | reaction@body-region:spatial-motion > next timed response. Every step affects actual output.
const authored = {
crushing:`
Ceiling brace|brace@shoulders:sheet>stumble@feet:ring
Side squeeze|brace@leftHand:fan>dodge@rightFoot:trail
Low compression|crouch@chest:split>brace@feet:ripple
Shoulder check|stumble@rightHand:burst>brace@chest:column
Backstep dust|dodge@feet:comet>fear@head:halo
Double brace|brace@leftHand:arc>brace@rightHand:arc>stumble@feet:scatter
Heel skid|stumble@leftFoot:trail>brace@shoulders:fan
Cross pressure|brace@chest:cross>dodge@rightHand:jet
Narrow escape|dodge@leftHand:sweep>stumble@rightFoot:split
Knee tremble|shiver@feet:ladder>brace@chest:ring
Head shield|brace@head:sheet>fear@shoulders:orbit
Floor rebound|stumble@feet:burst>brace@chest:funnel
Elbow wedge|brace@rightHand:ray>dodge@leftHand:fan
Compression wave|brace@chest:ripple>stumble@feet:sweep
Dust collar|fear@shoulders:halo>brace@leftHand:column
Tilting balance|stumble@rightFoot:arc>dodge@leftFoot:zigzag
Two-side press|brace@leftHand:sheet>brace@rightHand:sheet
High to low|fear@head:scatter>brace@feet:column
Scuff turn|dodge@feet:pinwheel>brace@chest:fan
Dust exhale|cough@chest:jet>brace@shoulders:split
Final foothold|stumble@leftFoot:cross>brace@rightFoot:ring>fear@head:arc`,
boiler:`
Hot palm recoil|heat@leftHand:jet>dodge@rightHand:arc
Steam collar|cough@shoulders:funnel>heat@head:halo
Foot shuffle|heat@leftFoot:burst>heat@rightFoot:burst>stumble@feet:trail
Rising warmth|heat@feet:column>fear@chest:spiral
Steam face fan|cough@head:fan>dodge@leftHand:sweep
Valve startle|shock@rightHand:ray>heat@chest:split
Warm sleeve|heat@rightHand:trail>brace@shoulders:ring
Ankle plume|heat@rightFoot:jet>stumble@leftFoot:scatter
Double palm fan|heat@leftHand:fan>heat@rightHand:fan
Heat shimmer|shiver@chest:ladder>heat@head:orbit
Backwash|dodge@shoulders:sheet>cough@chest:column
Steam sidestep|dodge@leftFoot:comet>heat@rightHand:spiral
Hot crown|heat@head:ring>fear@shoulders:burst
Crossing vents|brace@leftHand:cross>heat@rightFoot:jet
Sleeve shake|heat@leftHand:zigzag>heat@leftHand:scatter
Bellows breath|cough@chest:funnel>heat@head:fan>brace@feet:ripple
Steam curtain|brace@shoulders:sheet>dodge@feet:sweep
Hot heel pivot|stumble@rightFoot:pinwheel>heat@chest:arc
Fingertip fizz|heat@rightHand:ladder>fear@head:split
Low vent lift|dodge@feet:ray>heat@chest:column
Cooling gestures|heat@leftHand:orbit>cough@head:comet>brace@chest:ring`,
flood:`
First splash|drown@feet:ripple>brace@chest:fan
Left ankle wash|stumble@leftFoot:sweep>drown@rightHand:jet
Face splash|drown@head:burst>cough@chest:column
Overhead droplets|brace@head:halo>drown@shoulders:sheet
Paddle spray|drown@leftHand:fan>drown@rightHand:fan
Waterline shiver|shiver@chest:ring>drown@feet:ladder
Heel slip|stumble@rightFoot:trail>dodge@leftHand:arc
Crosscurrent|drown@chest:cross>brace@rightHand:ray
Foam skirt|drown@feet:orbit>shiver@chest:spiral
Chin lift|cough@head:funnel>drown@shoulders:split
Backwash stumble|stumble@feet:comet>brace@chest:sheet
Left paddle return|drown@leftHand:arc>brace@leftHand:scatter
Right paddle return|drown@rightHand:arc>brace@rightHand:scatter
Waist whirl|drown@chest:pinwheel>shiver@feet:ripple
Double splash shield|brace@leftHand:sheet>brace@rightHand:sheet>drown@head:fan
Bubbling breath|cough@chest:column>drown@head:orbit
Knee spray|dodge@leftFoot:jet>drown@rightFoot:fan
Shallow kick|stumble@feet:split>drown@rightHand:comet
Cold collar|shiver@shoulders:ladder>cough@head:halo
Flood pulse|drown@feet:ring>drown@chest:ring>brace@shoulders:ring
Wading balance|stumble@leftFoot:zigzag>brace@rightHand:sweep>drown@feet:scatter`,
gas:`
Cover and cough|cough@head:fan>brace@chest:split
Low cloud step|dodge@feet:sheet>cough@chest:column
Collar curl|cough@shoulders:spiral>fear@head:halo
Hand fan left|cough@leftHand:sweep>dodge@head:arc
Hand fan right|cough@rightHand:sweep>dodge@head:split
Chest flutter|cough@chest:ladder>shiver@shoulders:ring
Mist backstep|dodge@feet:comet>fear@chest:funnel
Double cough|cough@head:jet>cough@chest:burst>brace@shoulders:fan
Cloud parting|brace@leftHand:sheet>brace@rightHand:fan
Shoulder mist|fear@shoulders:orbit>cough@head:column
Heel haze|stumble@rightFoot:trail>cough@chest:spiral
Low to high haze|cough@feet:column>fear@head:scatter
Face shield|brace@head:cross>cough@leftHand:fan
Wavering knees|stumble@feet:zigzag>shiver@chest:ladder
Spiral exhale|cough@chest:spiral>cough@head:comet
Parted veil|dodge@shoulders:split>brace@head:sheet
Elbow cover|cough@rightHand:arc>fear@chest:halo
Haze pocket|fear@chest:ring>dodge@leftFoot:sweep
Mist shake|shiver@head:pinwheel>cough@shoulders:scatter
Retreat through mist|dodge@rightFoot:ray>cough@chest:funnel>brace@head:ring
Small breath recovery|cough@head:ripple>shiver@chest:orbit>brace@feet:ring`,
rats:`
Left boot flinch|swarm@leftFoot:burst>dodge@rightFoot:trail
Right boot flinch|swarm@rightFoot:fan>stumble@leftFoot:arc
Two-foot scatter|swarm@leftFoot:scatter>swarm@rightFoot:scatter
Ankle orbit|swarm@feet:orbit>fear@head:halo
Sleeve shakeoff|swarm@leftHand:zigzag>dodge@rightHand:fan
Cross step|stumble@feet:cross>swarm@rightFoot:jet
Small hop startle|shock@feet:ring>swarm@chest:split
Shin shake|swarm@leftFoot:ladder>brace@chest:arc
Right sleeve flick|swarm@rightHand:comet>fear@head:scatter
Dust trail retreat|dodge@feet:trail>swarm@leftFoot:sweep
Knee knock|stumble@feet:split>shiver@chest:column
Hand ward|swarm@leftHand:fan>swarm@rightHand:ray
Panic pivot|swarm@feet:pinwheel>fear@shoulders:halo
Boot brush|dodge@rightHand:sweep>swarm@rightFoot:burst
Left brush return|dodge@leftHand:arc>swarm@leftFoot:fan
Swarm wave|swarm@feet:ripple>brace@chest:sheet
Shoulder startle|shock@shoulders:burst>swarm@feet:orbit
Alternating heels|swarm@leftFoot:ray>swarm@rightFoot:ray>stumble@feet:ring
Dust crown|fear@head:orbit>swarm@feet:funnel
Warding circle|swarm@leftHand:spiral>swarm@rightHand:spiral
Quick recovery|stumble@rightFoot:zigzag>brace@leftHand:cross>swarm@feet:scatter`,
collapse:`
Ceiling grit|brace@head:sheet>stumble@feet:burst
Left rubble dodge|dodge@leftHand:ray>brace@rightHand:fan
Shoulder debris|brace@shoulders:scatter>fear@head:ring
Landing dust|stumble@feet:ring>brace@chest:column
Falling chip fan|brace@head:fan>dodge@rightFoot:trail
Cross shower|brace@shoulders:cross>stumble@feet:split
Rubble slide|stumble@leftFoot:sweep>dodge@rightHand:arc
Neck dust collar|cough@shoulders:halo>brace@head:sheet
Dust exhale|cough@head:funnel>brace@chest:fan
Heel rubble skip|dodge@rightFoot:jet>stumble@leftFoot:scatter
Roof tremor|shiver@head:ladder>brace@shoulders:ring
Diagonal fragment|dodge@leftHand:comet>brace@chest:split
Double shield|brace@leftHand:sheet>brace@rightHand:sheet>fear@head:halo
Grit whirl|cough@chest:spiral>stumble@feet:orbit
Shoulder to ground|brace@rightHand:burst>stumble@rightFoot:ray
Dust curtain|brace@chest:sheet>dodge@feet:sweep
Rubble recoil|shock@chest:cross>brace@head:fan
Falling pebble arc|dodge@head:arc>stumble@feet:zigzag
Floor tremble|shiver@feet:ripple>brace@chest:ladder
Side collapse warning|fear@leftHand:column>dodge@rightFoot:comet
Balance recovery|stumble@feet:pinwheel>brace@shoulders:split>cough@head:scatter`,
electric:`
Left palm arc|shock@leftHand:arc>shiver@chest:ladder
Right palm zig|shock@rightHand:zigzag>dodge@leftHand:fan
Foot ground pulse|shock@feet:ring>stumble@rightFoot:jet
Shoulder branch|shock@shoulders:split>brace@chest:cross
Crown static|shiver@head:halo>shock@rightHand:ray
Left heel spark|shock@leftFoot:burst>dodge@rightFoot:trail
Right heel spark|shock@rightFoot:scatter>stumble@leftFoot:arc
Crossed current|shock@leftHand:cross>shock@rightHand:cross
Static collar|shiver@shoulders:orbit>fear@head:fan
Two-beat jolt|shock@chest:burst>shock@feet:ring>brace@shoulders:sheet
Upward crackle|shock@feet:column>shiver@head:ladder
Arm ladder|shock@leftHand:ladder>brace@rightHand:arc
Spark flick|dodge@rightHand:sweep>shock@leftHand:comet
Body zigzag|shiver@chest:zigzag>shock@shoulders:split
Ground pinwheel|shock@feet:pinwheel>stumble@rightFoot:fan
Brief static tremor|shiver@head:scatter>shock@chest:ripple
Side discharge|shock@rightHand:ray>dodge@leftFoot:sweep
Split sparks|shock@leftFoot:split>shock@rightHand:split
Rising static spiral|shiver@chest:spiral>fear@head:orbit
Hand-to-floor arc|shock@leftHand:jet>shock@rightFoot:arc>brace@chest:halo
Discharge recovery|shock@shoulders:fan>shiver@feet:ripple>brace@head:ring`,
freeze:`
Shoulder frost|shiver@shoulders:sheet>brace@chest:ring
Left glove chill|shiver@leftHand:spiral>fear@head:halo
Right glove shake|shiver@rightHand:scatter>dodge@leftHand:arc
Ankle crystals|shiver@feet:ring>stumble@rightFoot:trail
Cold breath|cough@head:jet>shiver@chest:column
Ice collar|shiver@shoulders:orbit>cough@head:funnel
Double hand rub|shiver@leftHand:fan>shiver@rightHand:fan
Left toe flinch|shiver@leftFoot:burst>stumble@rightFoot:arc
Right toe flinch|shiver@rightFoot:ladder>dodge@leftFoot:scatter
Rising frost line|shiver@feet:column>shiver@chest:ladder>fear@head:ring
Crystal crown|shiver@head:halo>brace@shoulders:split
Cold sleeve flick|shiver@leftHand:comet>brace@chest:fan
Ice backstep|dodge@feet:sweep>shiver@chest:ripple
Frost shudder|shiver@chest:zigzag>shiver@head:scatter
Shoulder snow|brace@shoulders:fan>shiver@rightHand:ray
Crossed arms chill|shiver@chest:cross>brace@leftHand:sheet
Foot snow swirl|stumble@feet:pinwheel>shiver@shoulders:spiral
Two cold breaths|cough@head:arc>cough@head:jet>shiver@chest:orbit
Low frost veil|shiver@feet:sheet>brace@chest:split
Knee tremor|shiver@leftFoot:zigzag>shiver@rightFoot:zigzag
Thawing gesture|shiver@rightHand:ripple>cough@head:fan>brace@feet:ring`,
spikes:`
Left foot near miss|dodge@leftFoot:ray>brace@rightHand:arc
Right foot near miss|dodge@rightFoot:jet>stumble@leftFoot:trail
Guarded landing|brace@feet:ring>fear@head:halo
Boot scrape|stumble@leftFoot:comet>dodge@rightFoot:fan
Metallic ping|shock@rightFoot:burst>brace@chest:split
Side-step shower|dodge@feet:sweep>brace@leftHand:sheet
Left glove deflect|brace@leftHand:fan>dodge@head:arc
Right glove deflect|brace@rightHand:cross>dodge@leftFoot:ray
Scattered footing|stumble@feet:scatter>brace@shoulders:ring
Sharp startle|shock@chest:split>dodge@rightHand:jet
High shield|brace@head:sheet>fear@shoulders:halo
Heel pivot|dodge@rightFoot:pinwheel>stumble@leftFoot:zigzag
Dust skid|stumble@feet:trail>brace@chest:fan
Left-to-right retreat|dodge@leftFoot:arc>dodge@rightFoot:arc
Shoulder graze sparkle|brace@shoulders:burst>fear@head:orbit
Knee wobble|stumble@feet:ladder>brace@chest:column
Deflection sparks|brace@leftHand:ray>brace@rightHand:ray>fear@head:ring
Low dust pulse|dodge@feet:ripple>brace@rightHand:scatter
Near-miss spiral|fear@chest:spiral>dodge@leftHand:sweep
Guarded shuffle|brace@leftFoot:split>stumble@rightFoot:cross
Footing restored|stumble@feet:funnel>brace@chest:sheet>dodge@rightHand:comet`,
lasers:`
Left beam duck|dodge@head:ray>brace@leftHand:fan
Right beam sidestep|dodge@rightHand:jet>stumble@leftFoot:trail
Light collar|fear@shoulders:halo>shock@chest:split
Floor sweep|dodge@feet:sweep>brace@chest:ring
Crossed beam flash|shock@chest:cross>dodge@rightFoot:arc
Shoulder glint|dodge@leftHand:comet>fear@head:scatter
Left ankle beam|dodge@leftFoot:ray>brace@rightHand:sheet
Right ankle beam|dodge@rightFoot:ray>brace@leftHand:sheet
Prismatic fan|shock@rightHand:fan>dodge@leftHand:arc
Twin reflection|brace@leftHand:split>brace@rightHand:split
Tracking shimmer|fear@chest:ladder>dodge@feet:zigzag
Crown warning|dodge@head:ring>brace@shoulders:cross
Low light burst|shock@feet:burst>stumble@rightFoot:scatter
Spiral scan|dodge@chest:spiral>fear@head:orbit
Beam step-back|dodge@feet:comet>brace@chest:column
Vertical scan dodge|dodge@head:column>dodge@rightHand:sweep
Light recoil|shock@leftHand:burst>brace@chest:fan
Refraction stars|fear@head:pinwheel>dodge@shoulders:arc
Staggered beams|dodge@leftFoot:jet>dodge@rightHand:ray>brace@head:sheet
Laser ribbon|dodge@shoulders:sheet>stumble@feet:ripple
Scan recovery|shock@chest:zigzag>dodge@rightHand:scatter>brace@feet:ring`
};
const reactions=new Set(['heat','cough','shiver','shock','dodge','brace','swarm','drown','stumble','fear']);
export const INJURY_RECIPES=Object.freeze(Object.entries(authored).flatMap(([hazard,lines])=>lines.trim().split('\n').map((line,index)=>{
 const [name,sequence]=line.split('|');const steps=sequence.split('>').map((token,i)=>{let [reaction,rest]=token.split('@');if(reaction==='crouch')reaction='brace';const [region,pattern]=rest.split(':');if(!reactions.has(reaction))throw Error('Unsupported reaction');return Object.freeze({at:i===0?0:i===1?.42:.96,reaction,region,pattern});});
 return Object.freeze({id:`${hazard}-${String(index+1).padStart(2,'0')}`,hazard,name,steps:Object.freeze(steps)});
})));
export const INJURY_CATALOG_DESCRIPTION='210 explicitly authored, hazard-specific timed visual/body-response recipes. Shared supported body reactions and spatial particle primitives are reused. These are not 210 unique motion-capture clips; fictional bloody contact layers accompany applicable recipes, while heat/frost/gas retain their own effects; names and color changes alone are not counted.';
export function validateInjuryCatalog(){const ids=new Set(),signatures=new Set(),counts={};for(const r of INJURY_RECIPES){if(ids.has(r.id))throw Error('Duplicate id');ids.add(r.id);const signature=JSON.stringify(r.steps.map(({reaction,region,pattern})=>[reaction,region,pattern]));if(signatures.has(signature))throw Error('Duplicate effective recipe');signatures.add(signature);counts[r.hazard]=(counts[r.hazard]||0)+1;}return {count:ids.size,counts,effectiveSignatures:signatures.size};}
validateInjuryCatalog();
