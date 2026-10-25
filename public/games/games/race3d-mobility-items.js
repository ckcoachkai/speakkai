/** Additional mobility/recovery items: physical actions, never winner overrides. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const MOBILITY_IDS=Object.freeze(['dash','draftcollector','slingshot','airfoil','overdrive','clutch','pivot','fasttow','rewind','capacitor','airbrake','winch','jack','magnet']);
export const MOBILITY_TIMERS=Object.freeze([...MOBILITY_IDS,'slingRelease','capRelease']);
export function createMobilityItems(ctx,{state,emit}){
 const roadHalf=(ctx.track.width||ctx.track.sampleTrack(0).width||16.5)/2,cars=()=>ctx.cars(),now=()=>ctx.time(),half=()=>roadHalf;
 const near=(c,d,l)=>cars().some(o=>!o.finished&&o.id!==c.id&&Math.abs(o.distance-d)<5&&Math.abs(o.lateral-l)<2.2);
 function history(c){if(!c._motionHistory){c._motionHistory=new Float64Array(96*5);c._historyIndex=0;c._historyCount=0;c._historyAt=0;}return c._motionHistory;}
 function decision(c,type){const s=state(c),hold=reason=>({use:false,reason}),yes=reason=>({use:true,reason});if(s[type]>0||s.jammer>0)return hold('active-or-jammed');
  const ground=c.flightRemaining<=0,bend=Math.max(...[0,35,80,140].map(d=>Math.abs(ctx.curvature(c.distance+d))));
  if(type==='dash'){if(!ground||c.spin>0||c.rampState==='approach'||c.rampPlan?.ahead>0&&c.rampPlan.ahead<c.speed*2+30)return hold('needs-control-or-ramp-clearance');const options=[-1,1].filter(dir=>Math.abs(c.lateral+dir*2.7)<half(c)-1.2&&!near(c,c.distance+5,c.lateral+dir*2.7));return options.length?{use:true,reason:'clear-side-lane',direction:options[0]}:hold('occupied-side');}
  if(type==='draftcollector')return cars().some(o=>o.id!==c.id&&!o.finished&&o.distance-c.distance>5&&o.distance-c.distance<40&&Math.abs(o.lateral-c.lateral)<4.5)?yes('following-opponent'):hold('no-wake');
  if(type==='slingshot')return ground&&c.speed>10&&bend>.002?yes('actual-corner-window'):hold('no-corner');
  if(type==='airfoil')return !ground&&(Math.abs(c.airAttitude?.roll||0)+Math.abs(c.airAttitude?.pitch||0)+Math.abs(c.heading)>.12)?yes('unstable-air-attitude'):hold('stable-or-grounded');
  if(type==='overdrive')return ground&&bend<.0015&&c.speed>c.topSpeed*.7&&c.attackSlowRemaining<=0?yes('long-straight'):hold('no-clear-high-speed-run');
  if(type==='clutch')return ground&&c.speed<25&&c.spin<=0&&c.attackSlowRemaining<=0&&s.emp<=0?yes('low-speed-launch'):hold('too-fast-or-disrupted');
  if(type==='pivot')return ground&&c.speed<32&&(bend>.003||Math.abs(c.heading)>.08)?yes('low-speed-turn'):hold('no-turn');
  if(type==='fasttow')return ground&&c.stuckTime>1?yes('confirmed-stuck'):hold('not-stuck');
  if(type==='rewind'){history(c);return ground&&c._historyCount>=32&&now()-c._motionHistory[((c._historyIndex+95)%96)*5]<.15&&(c.spin>0||c.offRoad||c.recoveryRemaining>.5)?yes('recent-valid-recovery-path'):hold('no-recent-recovery-path');}
  if(type==='capacitor')return ctx.projectiles().some(p=>p.ownerId!==c.id&&Math.abs(ctx.gap(p.distance,c.distance))<100)?yes('incoming-hostile-impact'):hold('no-impact-threat');
  if(type==='airbrake')return !ground&&c.verticalVelocity<0&&c.speed>20?yes('descending-overshoot-control'):hold('not-descending');
  if(type==='winch')return ground&&c.offRoad&&Math.abs(c.lateral)<half(c)+8&& !near(c,c.distance,Math.sign(c.lateral)*(half(c)-1.5))?yes('clear-shoulder-reentry'):hold('no-safe-shoulder');
  if(type==='jack')return ground&&c.speed<5&&Math.abs(c.landingRoll)+Math.abs(c.landingPitch)>.7?yes('overturned-at-low-speed'):hold('not-overturned');
  if(type==='magnet')return ground&&ctx.pickups().some(p=>p.active&&ctx.gap(p.distance,c.distance)>0&&ctx.gap(p.distance,c.distance)<90)?yes('nearby-pickup-gate'):hold('no-pickup');
  return hold('unknown');
 }
 function activate(c,type,choice){const s=state(c);s[type]={dash:1.4,draftcollector:8,slingshot:6,airfoil:3,overdrive:8,clutch:2,pivot:4,fasttow:1,rewind:1.5,capacitor:8,airbrake:2,winch:3,jack:1.2,magnet:6}[type];
  if(type==='dash'){c._dashTarget=clamp(c.lateral+choice.direction*2.7,-half(c)+1.2,half(c)-1.2);c._dashOrigin=c.lateral;c.preferredLane=c._dashTarget;}
  if(type==='slingshot')c._cornerCharge=0;
  if(type==='fasttow'){c._towAnchor={distance:Math.min(c.distance-2,c._lastLegalPose?.distance??c.distance-2),lateral:c._lastLegalPose?.lateral||0};c._towActive=true;s.ghost=Math.max(s.ghost,1.2);c._ghostGrace=0;}
  if(type==='rewind'){const data=history(c),i=c._historyIndex*5;data[i]=now();data[i+1]=c.distance;data[i+2]=c.lateral;data[i+3]=c.heading;data[i+4]=c.speed;c._historyIndex=(c._historyIndex+1)%96;c._historyCount=Math.min(96,c._historyCount+1);c._rewindAt=now();c._rewindActive=true;s.ghost=Math.max(s.ghost,1.7);c._ghostGrace=0;}
  if(type==='capacitor'){c._capPending=0;c._capPendingTTL=0;}
  c._nextExtraUse=now()+(type==='rewind'?8:3);emit(type,c);return true;
 }
 function beforeMotion(c,dt){const s=state(c);if(c._towActive){c.speed=0;if(s.fasttow<=0){const d=Math.min(c.distance,c._towAnchor.distance),l=clamp(c._towAnchor.lateral,-half(c)+1.5,half(c)-1.5);if(!near(c,d,l)){c.distance=d;c.previousProgress=d;c.lateral=l;c.heading=0;c.lateralVelocity=0;c.spin=0;c.speed=4;c.stuckTime=0;c._towActive=false;emit('fasttow-complete',c,{penaltyMetres:2});}else {s.fasttow=.1;c._towWait=(c._towWait||0)+.1;if(c._towWait>1){c._towActive=false;c.speed=4;}}}return c._towActive;}
  if(!c._rewindActive)return false;if(s.rewind<=0){c._rewindActive=false;c.speed=6;return false;}
  const data=history(c),target=now()-2*(now()-c._rewindAt),last=(c._historyIndex+95)%96;let newer=last,older=last;
  for(let n=1;n<c._historyCount;n++){older=(last-n+96)%96;if(data[older*5]<=target)break;newer=older;}
  const a=older*5,b=newer*5,f=clamp((target-data[a])/Math.max(.0001,data[b]-data[a]),0,1),d=data[a+1]+(data[b+1]-data[a+1])*f,l=data[a+2]+(data[b+2]-data[a+2])*f;
  if(near(c,d,l)||Math.abs(d-c.distance)>3){s.rewind=0;c._rewindActive=false;c.speed=5;emit('rewind-blocked',c);return false;}
  c.distance=Math.min(c.distance,d);c.lateral=l;c.heading=data[a+3];c.speed=0;c.lateralVelocity=0;c.spin=Math.max(0,c.spin-dt);return true;
 }
 function acceleration(c,dt,envelope,drive){const s=state(c);let requested=0;if(c.flightRemaining<=0){if(s.clutch>0)requested+=5*clamp((28-c.speed)/18,0,1);if(s.slingRelease>0&&c._cornerCharge>0)requested+=Math.min(6,c._cornerCharge/Math.max(1,c.speed)/Math.max(dt,.001));if(s.capRelease>0)requested+=4;}if(c.attackSlowRemaining>0||c.itemEffects?.emp>0)return 0;return Math.min(requested,Math.max(0,envelope.longitudinalAccel-Math.max(0,drive.acceleration)-c.nitroAcceleration-c.rocketAcceleration));}
 function onHit(c,type,source){if(state(c).capacitor>0&&source?.ownerId!==c.id&&cars().some(o=>o.id===source?.ownerId)){state(c).capacitor=0;c._capPending=1;c._capPendingTTL=12;emit('capacitor-charged',c,{attack:type});}}
 function step(dt){for(const c of cars()){if(c.finished)continue;const s=state(c),ground=c.flightRemaining<=0;
   if(s.dash>0&&Math.abs(c.lateral-c._dashOrigin)>=2.7)s.dash=0;
   if(s.slingshot>0&&ground&&Math.abs(c.lateral)<half(c)){const load=Math.abs(c.lateralAcceleration||0);c._cornerCharge=clamp((c._cornerCharge||0)+load*c.speed*.35*dt,0,180);if(Math.abs(ctx.curvature(c.distance+20))<.0015&&c._cornerCharge>15){s.slingshot=0;s.slingRelease=3;emit('slingshot-release',c,{charge:c._cornerCharge});}}
   if(s.slingRelease>0)c._cornerCharge=Math.max(0,(c._cornerCharge||0)-(c._mobilityAcceleration||0)*Math.max(1,c.speed)*dt);
   if(c._capPending){c._capPendingTTL-=dt;if(c._capPendingTTL<=0)c._capPending=0;else if(c.spin<=0&&c.attackSlowRemaining<=0&&c.freezeRemaining<=0){c._capPending=0;s.capRelease=3;emit('capacitor-release',c);}}
   if(s.airfoil>0&&!ground){if(c.airAttitude){c.airAttitude.rollRate+=clamp(-c.airAttitude.roll*3-c.airAttitude.rollRate*2,-3,3)*dt;c.airAttitude.yawRate*=Math.exp(-3*dt);}else c.heading*=Math.exp(-3*dt);}
   if(s.winch>0&&ground){const target=Math.sign(c.lateral)*(half(c)-1.5);if(!near(c,c.distance,target)){c.lateralVelocity+=clamp((target-c.lateral)*3-c.lateralVelocity*2,-6,6)*dt;c.speed=Math.min(c.speed,5);}}
   if(s.jack>0&&ground){c.landingRoll*=Math.exp(-12*dt);c.landingPitch*=Math.exp(-12*dt);c.recoveryRemaining=Math.max(0,c.recoveryRemaining-dt*3);}
   if(c._towActive||c._rewindActive)continue;
   const data=history(c);if(now()>=c._historyAt&&ground&&c.distance>=0&&Math.abs(c.lateral)<half(c)+4){const i=c._historyIndex*5;data[i]=now();data[i+1]=c.distance;data[i+2]=c.lateral;data[i+3]=c.heading;data[i+4]=c.speed;c._historyIndex=(c._historyIndex+1)%96;c._historyCount=Math.min(96,c._historyCount+1);c._historyAt=now()+.05;if(Math.abs(c.lateral)<half(c)-1.5){c._lastLegalPose||={distance:0,lateral:0};c._lastLegalPose.distance=c.distance;c._lastLegalPose.lateral=c.lateral;}}
  }}
 function clear(c){for(const k of MOBILITY_TIMERS)state(c)[k]=0;c._towActive=false;c._rewindActive=false;c._motionHistory=null;c._capPending=0;c._cornerCharge=0;c.itemAcceleration=0;}
 return {decision,activate,beforeMotion,acceleration,onHit,step,clear};
}
