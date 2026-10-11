import * as THREE from './three.module.js';

// All weapon/threat interactions belong to the fictional, uninhabited range.
// This deliberately models practice projectiles, not real weapon ballistics.
const RANGE=new THREE.Vector3(6500,0,-600), FWD=new THREE.Vector3(0,0,-1), UP=new THREE.Vector3(0,1,0);
const G=9.80665, MAX_BULLETS=96, MAX_ROCKETS=16, MAX_THREATS=8;
const clamp=THREE.MathUtils.clamp;

function inRange(p){return Math.hypot(p.x-RANGE.x,p.z-RANGE.z)<2500;}
function segmentSphere(a,b,center,radius){
  const ab=b.clone().sub(a),den=ab.lengthSq();
  const t=den>0?clamp(center.clone().sub(a).dot(ab)/den,0,1):0;
  return a.clone().addScaledVector(ab,t).distanceToSquared(center)<=radius*radius;
}

export function createCombat(scene,world,effects,audio){
  const root=new THREE.Group();root.name='Fictional practice projectiles';scene.add(root);
  const stats={shots:0,hits:0,rockets:0,targetsHit:0};
  const threatState={locked:false,missileDistance:Infinity,missiles:0,warning:''};
  const bullets=[],rockets=[],missiles=[],flares=[],targetFlashes=new Map(),hitTargets=new Set();
  const targets=world.targets||[];
  let gunCooldown=0,rocketCooldown=0,flareCooldown=0,flareCount=24,threatCooldown=4,aaCooldown=8,lockTime=0;
  let clock=0,previousThreats=false,flareProgramRemaining=0,flarePulseTimer=0;
  const bright=new THREE.MeshBasicMaterial({color:0xffe3a1,toneMapped:false});
  const hostile=new THREE.MeshBasicMaterial({color:0xff6d42,toneMapped:false});
  const rocketPaint=new THREE.MeshStandardMaterial({color:0x8f9994,metalness:.5,roughness:.48});
  const exhaustMat=new THREE.MeshBasicMaterial({color:0xffb95a,toneMapped:false,transparent:true,opacity:.86,depthWrite:false});
  const tracerGeometry=new THREE.BoxGeometry(.045,.045,1),missileGeometry=new THREE.CylinderGeometry(.085,.12,1.8,8);
  missileGeometry.rotateX(Math.PI/2);
  const noseGeometry=new THREE.ConeGeometry(.085,.35,8);noseGeometry.rotateX(-Math.PI/2);
  const finGeometry=new THREE.BoxGeometry(.58,.025,.40),flameGeometry=new THREE.ConeGeometry(.13,1.1,8);flameGeometry.rotateX(Math.PI/2);
  const tracerInstances=new THREE.InstancedMesh(tracerGeometry,bright,MAX_BULLETS),enemyInstances=new THREE.InstancedMesh(tracerGeometry,hostile,32);
  tracerInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);enemyInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tracerInstances.frustumCulled=enemyInstances.frustumCulled=false;tracerInstances.count=enemyInstances.count=0;root.add(tracerInstances,enemyInstances);
  const tempMatrix=new THREE.Matrix4(),tempQuat=new THREE.Quaternion(),tempScale=new THREE.Vector3();
  const launchers=[new THREE.Vector3(6070,3,-1330),new THREE.Vector3(6950,3,-1020),new THREE.Vector3(6470,3,40)];
  const launcherGroup=new THREE.Group();root.add(launcherGroup);launcherGroup.visible=false;
  const padMaterial=new THREE.MeshStandardMaterial({color:0x414b42,metalness:.32,roughness:.7});
  for(const pos of launchers){
    const chassis=new THREE.Mesh(new THREE.BoxGeometry(4,1.5,6),padMaterial);chassis.position.copy(pos);launcherGroup.add(chassis);
    const rack=new THREE.Mesh(new THREE.BoxGeometry(3.3,.8,4.3),padMaterial);rack.position.copy(pos).add(new THREE.Vector3(0,1.3,0));rack.rotation.x=-.5;launcherGroup.add(rack);
    for(const s of [-1,1]){const tube=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,4.4,10),rocketPaint);tube.position.copy(pos).add(new THREE.Vector3(s*.9,2.1,-.3));tube.rotation.x=1.05;launcherGroup.add(tube);}
  }

  function floor(p){return typeof world.groundHeight==='function'?world.groundHeight(p.x,p.z):0;}
  function noiseDirection(dir,amount){return dir.clone().add(new THREE.Vector3((Math.random()-.5)*amount,(Math.random()-.5)*amount,(Math.random()-.5)*amount)).normalize();}
  function projectileVisual(enemy=false){
    const g=new THREE.Group();root.add(g);
    const body=new THREE.Mesh(missileGeometry,rocketPaint);g.add(body);
    const nose=new THREE.Mesh(noseGeometry,rocketPaint);nose.position.z=-1.03;g.add(nose);
    const fins=new THREE.Mesh(finGeometry,rocketPaint);fins.position.z=.65;g.add(fins);const fins2=fins.clone();fins2.rotation.z=Math.PI/2;g.add(fins2);
    const flame=new THREE.Mesh(flameGeometry,exhaustMat);flame.position.z=1.33;g.add(flame);
    if(enemy)g.scale.setScalar(1.8);
    return {group:g,flame};
  }
  function spark(pos,scale){effects?.explode?.(pos.clone(),scale);}
  function allowed(flight,def){return Boolean(def.weapon&&!flight.crashed&&inRange(flight.position));}
  function launchPosition(flight,def,side=0){return new THREE.Vector3(side,-.35,-Math.min(def.length*.34,4.2)).applyQuaternion(flight.quaternion).add(flight.position);}

  function fireGun(flight,def){
    if(gunCooldown>0||!allowed(flight,def))return false;
    gunCooldown=1/15;stats.shots++;
    if(bullets.length>=MAX_BULLETS)bullets.shift();
    const dir=noiseDirection(FWD.clone().applyQuaternion(flight.quaternion),.0014),position=launchPosition(flight,def);
    bullets.push({position,previous:position.clone(),velocity:dir.multiplyScalar(900).add(flight.velocity),age:0,enemy:false});
    audio?.gun?.();return true;
  }
  function fireRocket(flight,def){
    if(rocketCooldown>0||!allowed(flight,def))return false;
    rocketCooldown=.7;stats.rockets++;
    if(rockets.length>=MAX_ROCKETS)rockets.shift().visual.group.removeFromParent();
    const dir=FWD.clone().applyQuaternion(flight.quaternion),position=launchPosition(flight,def,stats.rockets%2?-.8:.8);
    const visual=projectileVisual();visual.group.position.copy(position);visual.group.quaternion.copy(flight.quaternion);
    rockets.push({position,previous:position.clone(),velocity:dir.clone().multiplyScalar(125).add(flight.velocity),direction:dir,age:0,visual});
    audio?.rocket?.();return true;
  }
  function emitFlarePair(flight){
    if(flight.crashed||flareCount<2)return false;
    flareCount-=2;
    for(const side of [-1,1]){
      const position=new THREE.Vector3(side*.8,-.3,1.1).applyQuaternion(flight.quaternion).add(flight.position);
      const velocity=new THREE.Vector3(side*(8+Math.random()*5),-4,8).applyQuaternion(flight.quaternion).add(flight.velocity);
      const flare=effects?.flare?.(position,velocity);
      // Effects owns the integration; local fallback is used only if no effect
      // object was provided, keeping guidance behaviour independently testable.
      flares.push(flare?{object:flare,fallback:false}:{object:{position,velocity,life:5},fallback:true});
    }
    audio?.flare?.();return true;
  }
  function deployFlares(flight){
    if(flight.crashed||flareCooldown>0||flareCount<2)return false;
    flareProgramRemaining=5;flarePulseTimer=.5;flareCooldown=7;
    return emitFlarePair(flight);
  }

  function hitTarget(target,position,rocket=false){
    stats.hits++;hitTargets.add(target);stats.targetsHit=hitTargets.size;
    targetFlashes.set(target,.35);spark(position,rocket?1.3:.14);
    if(rocket)audio?.explosion?.(.8);
  }
  function checkTargets(p,rocket=false){
    for(const target of targets){if(segmentSphere(p.previous,p.position,target.position,target.radius+(rocket?.4:0))){hitTarget(target,p.position,rocket);return true;}}
    return false;
  }
  function crash(flight,reason,position){
    if(flight.crashed)return;flight.crashed=true;flight.crashReason=reason;
    // The main loop owns the one-time aircraft crash effects and sound.
  }
  function launchThreat(flight){
    if(missiles.length>=MAX_THREATS)return;
    const eligible=launchers.filter(p=>p.distanceTo(flight.position)>80&&p.distanceTo(flight.position)<2700);
    if(!eligible.length)return;
    const launcher=eligible.reduce((a,b)=>a.distanceToSquared(flight.position)<b.distanceToSquared(flight.position)?a:b);
    const position=launcher.clone().add(new THREE.Vector3(0,2,0)),direction=flight.position.clone().sub(position).normalize();
    const distance=position.distanceTo(flight.position);
    if(distance>2700||distance<80)return;
    const visual=projectileVisual(true);
    visual.group.position.copy(position);visual.group.quaternion.setFromUnitVectors(FWD,direction);
    missiles.push({position,previous:position.clone(),velocity:direction.multiplyScalar(105),age:0,visual,decoy:null,testedFlares:new Set()});
    audio?.rocket?.();
  }
  function aaBurst(flight){
    const launcher=launchers[1],distance=launcher.distanceTo(flight.position),lead=flight.position.clone().addScaledVector(flight.velocity,distance/600);
    // A sparse, imperfect burst provides a visible range hazard without
    // constant city gunfire; swept intersection still applies to every round.
    for(let i=0;i<5;i++){
      if(bullets.filter(p=>p.enemy).length>=24)break;
      const pos=launcher.clone().add(new THREE.Vector3(0,2,0)),dir=noiseDirection(lead.clone().sub(pos).normalize(),.08);
      bullets.push({position:pos,previous:pos.clone(),velocity:dir.multiplyScalar(620),age:0,enemy:true});
    }
  }
  function clearThreats(){for(const m of missiles)m.visual.group.removeFromParent();missiles.length=0;for(let i=bullets.length-1;i>=0;i--)if(bullets[i].enemy)bullets.splice(i,1);lockTime=0;}

  function update(dt,time,flight,def,controls={},options={}){
    dt=clamp(dt,0,.1);clock=time??clock+dt;gunCooldown=Math.max(0,gunCooldown-dt);rocketCooldown=Math.max(0,rocketCooldown-dt);flareCooldown=Math.max(0,flareCooldown-dt);
    if(flareProgramRemaining>0){flareProgramRemaining=Math.max(0,flareProgramRemaining-dt);if(flareProgramRemaining<1e-8)flareProgramRemaining=0;flarePulseTimer-=dt;while(flarePulseTimer<=0&&flareProgramRemaining>0){if(!emitFlarePair(flight)){flareProgramRemaining=0;break;}flarePulseTimer+=.5;}}
    if(controls.gun||controls.fireGun)fireGun(flight,def);if(controls.rocket||controls.fireRocket)fireRocket(flight,def);
    const threats=Boolean(options.threats&&def.weapon&&inRange(flight.position)&&!flight.crashed);
    launcherGroup.visible=Boolean(options.threats);
    if(!threats){if(previousThreats||missiles.length)clearThreats();threatCooldown=4;aaCooldown=8;}else{
      lockTime+=dt;threatCooldown-=dt;aaCooldown-=dt;
      if(threatCooldown<=0&&flight.position.y-floor(flight.position)>8){launchThreat(flight);threatCooldown=20;}
      if(aaCooldown<=0&&flight.position.y-floor(flight.position)>12){aaBurst(flight);aaCooldown=8;}
    }
    previousThreats=threats;
    for(let i=flares.length-1;i>=0;i--){const f=flares[i];if(f.fallback){f.object.life-=dt;f.object.velocity.y-=G*dt;f.object.position.addScaledVector(f.object.velocity,dt);}if(f.object.life<=0)flares.splice(i,1);}
    const aircraftRadius=clamp((def.length||8)*.19,1.4,5);
    let ownCount=0,enemyCount=0;
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];b.previous.copy(b.position);b.age+=dt;b.velocity.y-=G*dt;b.position.addScaledVector(b.velocity,dt);
      let remove=b.age>5||b.position.y<floor(b.position);
      if(!remove&&b.enemy&&segmentSphere(b.previous,b.position,flight.position,aircraftRadius)){crash(flight,'Range AA impact',b.position);remove=true;}
      if(!remove&&!b.enemy)remove=checkTargets(b);
      if(remove){bullets.splice(i,1);continue;}
      const instances=b.enemy?enemyInstances:tracerInstances,index=b.enemy?enemyCount++:ownCount++;
      if(index>=instances.instanceMatrix.count)continue;
      const direction=b.velocity.clone().normalize();tempQuat.setFromUnitVectors(FWD,direction);tempScale.set(b.enemy?1.3:1,b.enemy?1.3:1,Math.min(16,b.velocity.length()*.016));
      tempMatrix.compose(b.position,tempQuat,tempScale);instances.setMatrixAt(index,tempMatrix);
    }
    tracerInstances.count=Math.min(ownCount,MAX_BULLETS);enemyInstances.count=Math.min(enemyCount,32);tracerInstances.instanceMatrix.needsUpdate=enemyInstances.instanceMatrix.needsUpdate=true;
    for(let i=rockets.length-1;i>=0;i--){
      const r=rockets[i];r.previous.copy(r.position);r.age+=dt;
      if(r.age<1.75)r.velocity.addScaledVector(r.direction,150*dt);r.velocity.y-=G*dt;r.position.addScaledVector(r.velocity,dt);
      let remove=checkTargets(r,true);
      if(!remove&&(r.position.y<=floor(r.position)||r.age>10)){spark(r.position,.9);audio?.explosion?.(.6);remove=true;}
      if(remove){r.visual.group.removeFromParent();rockets.splice(i,1);continue;}
      r.visual.group.position.copy(r.position);r.visual.group.quaternion.setFromUnitVectors(FWD,r.velocity.clone().normalize());r.visual.flame.visible=r.age<1.75;r.visual.flame.scale.setScalar(.8+Math.random()*.4);
    }
    let nearest=Infinity;
    for(let i=missiles.length-1;i>=0;i--){
      const m=missiles[i];m.age+=dt;m.previous.copy(m.position);
      const aircraftDistance=m.position.distanceTo(flight.position);nearest=Math.min(nearest,aircraftDistance);
      for(const wrapped of flares){const f=wrapped.object;if(m.decoy||m.testedFlares.has(f)||m.position.distanceTo(f.position)>350)continue;
        const toFlare=f.position.clone().sub(m.position).normalize();if(m.velocity.clone().normalize().dot(toFlare)<.45)continue;
        m.testedFlares.add(f);if(Math.random()<.72)m.decoy=f;
      }
      if(m.decoy?.life<=0)m.decoy=null;
      const aim=m.decoy?m.decoy.position:flight.position.clone().addScaledVector(flight.velocity,.35),desired=aim.clone().sub(m.position).normalize();
      const direction=m.velocity.clone().normalize(),angle=direction.angleTo(desired),speed=Math.min(310,m.velocity.length()+dt*55);
      // Finite turning authority: min 1.15 rad/s and 9 g lateral acceleration.
      const maxTurn=Math.min(1.15,9*G/speed)*dt;
      if(angle>1e-5){const q=new THREE.Quaternion().setFromUnitVectors(direction,desired);tempQuat.identity().slerp(q,Math.min(1,maxTurn/angle));direction.applyQuaternion(tempQuat);}
      m.velocity.copy(direction).multiplyScalar(speed);m.position.addScaledVector(m.velocity,dt);
      let remove=m.age>28||m.position.y<floor(m.position)-.3;
      if(!remove&&!m.decoy&&segmentSphere(m.previous,m.position,flight.position,aircraftRadius+1.2)){crash(flight,'Missile impact',m.position);remove=true;}
      else if(!remove&&m.decoy&&segmentSphere(m.previous,m.position,m.decoy.position,8)){spark(m.position,.6);remove=true;}
      if(remove){m.visual.group.removeFromParent();missiles.splice(i,1);continue;}
      m.visual.group.position.copy(m.position);m.visual.group.quaternion.setFromUnitVectors(FWD,direction);m.visual.flame.scale.setScalar(.9+Math.random()*.4);
    }
    for(const [target,left]of targetFlashes){targetFlashes.set(target,left-dt);target.mesh?.scale.setScalar(1+.08*Math.max(0,left/.35));if(left<=0){target.mesh?.scale.setScalar(1);targetFlashes.delete(target);}}
    threatState.locked=threats&&lockTime>1.3;threatState.missiles=missiles.length;threatState.missileDistance=missiles.length?nearest:Infinity;
    threatState.warning=flight.crashed?'':missiles.length?(nearest<350?'MISSILE CLOSE · FLARES':'MISSILE INBOUND'):threatState.locked?'RANGE RADAR LOCK':'';
  }
  function reset(){
    for(const p of [...rockets,...missiles])p.visual.group.removeFromParent();bullets.length=rockets.length=missiles.length=flares.length=0;
    for(const target of targetFlashes.keys())target.mesh?.scale.setScalar(1);targetFlashes.clear();hitTargets.clear();for(const k of Object.keys(stats))stats[k]=0;
    gunCooldown=rocketCooldown=flareCooldown=lockTime=flareProgramRemaining=flarePulseTimer=0;flareCount=24;threatCooldown=4;aaCooldown=8;previousThreats=false;
    Object.assign(threatState,{locked:false,missileDistance:Infinity,missiles:0,warning:''});tracerInstances.count=enemyInstances.count=0;
  }
  return {update,fireGun,fireRocket,deployFlares,reset,stats,threatState,get flareCount(){return flareCount;},get flareActive(){return flareProgramRemaining>0;},rearm(){flareCount=24;flareProgramRemaining=flarePulseTimer=flareCooldown=0;}};
}
