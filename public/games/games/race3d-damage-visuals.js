/** Damage hides real authored pieces and keeps detached copies as bounded debris. */
export function createDamageVisuals(THREE, parent) {
  const states=new Set(),debris=[];
  const detached=new THREE.Group();detached.name='race-detached-parts';parent.add(detached);
  const inverse=new THREE.Matrix4(),local=new THREE.Matrix4();let time=0;
  function add(state){const record={state,parts:[],ready:false,level:0,replacements:0};states.add(record);return record;}
  function prepare(record){
    const {state}=record;
    if(state.form&&state.racer.racerType!=='monster-truck'){record.ready=true;return;}
    if(!state.car.userData.assetLoaded)return;
    // The source GLB nodes remain separate. Reuse those named panels as damage
    // and replacement targets instead of putting generic bars over the body.
    const authored=state.authoredParts?.byKind||{};
    for(const node of authored.rearBumper||[])record.parts.push({node,threshold:4,removed:false,kind:'rearBumper'});
    for(const node of authored.frontBumper||[])record.parts.push({node,threshold:8,removed:false,kind:'frontBumper'});
    const wheels=state.wheelMounts||[];
    if(wheels[0])record.parts.push({node:wheels[0],threshold:12,removed:false,kind:'wheel',slot:wheels[0].userData?.wheelSlot||'FL'});
    if(wheels[2])record.parts.push({node:wheels[2],threshold:16,removed:false,kind:'wheel',slot:wheels[2].userData?.wheelSlot||'RL'});
    record.ready=true;
  }
  function release(record,part){
    const {state}=record;part.node.updateWorldMatrix(true,true);detached.updateWorldMatrix(true,false);
    const copy=part.node.clone(true);copy.visible=true;copy.name=`detached-${part.node.name}`;
    inverse.copy(detached.matrixWorld).invert();local.multiplyMatrices(inverse,part.node.matrixWorld);local.decompose(copy.position,copy.quaternion,copy.scale);detached.add(copy);
    const side=copy.position.x>=state.car.position.x?1:-1,heading=state.car.rotation.y;
    debris.push({mesh:copy,born:time,ground:state.car.position.y+.12,velocity:new THREE.Vector3(Math.sin(heading)*7+Math.cos(heading)*side*3,3.2,Math.cos(heading)*7-Math.sin(heading)*side*3),spin:side*6,kind:part.kind,sourceName:part.node.name});
    while(debris.length>24)debris.shift().mesh.removeFromParent();
  }
  function update(dt){
    dt=Math.max(0,Math.min(.1,Number(dt)||0));time+=dt;
    for(const record of states){if(!record.ready)prepare(record);if(!record.ready)continue;
      const racer=record.state.racer,level=Math.max(0,Math.min(20,Math.floor(Number.isFinite(racer.damageLevel)?racer.damageLevel:(Number(racer.damage)||0)*20)));
      const replacements=Number(racer.replacements)||Number(racer.replacementCount)||0;
      for(const part of record.parts){const removed=level>=part.threshold;if(removed&&!part.removed&&dt>0&&record.replacements===replacements)release(record,part);part.node.visible=!removed;part.removed=removed;}
      record.level=level;record.replacements=replacements;
    }
    for(let i=debris.length-1;i>=0;i--){const part=debris[i],age=time-part.born;if(age>3.6){part.mesh.removeFromParent();debris.splice(i,1);continue;}
      part.velocity.y-=9.81*dt;part.mesh.position.addScaledVector(part.velocity,dt);part.mesh.rotation.x+=part.spin*dt;part.mesh.rotation.z+=part.spin*.4*dt;
      if(part.mesh.position.y<part.ground){part.mesh.position.y=part.ground;part.velocity.y=Math.abs(part.velocity.y)*.26;part.velocity.x*=.85;part.velocity.z*=.85;}
      if(age>2.8)part.mesh.scale.multiplyScalar(Math.max(.01,1-dt*6));
    }
  }
  function reset(){for(const item of debris)item.mesh.removeFromParent();debris.length=0;time=0;for(const record of states){record.level=0;record.replacements=0;for(const part of record.parts){part.node.visible=true;part.removed=false;}}}
  return {add,update,reset,snapshot:()=>({debris:debris.length,cars:[...states].map(({state,level,parts,replacements})=>({id:state.racer.id,assetId:state.car.userData.assetId||null,level,replacements,detached:parts.filter(p=>p.removed).map(p=>({kind:p.kind,name:p.node.name,slot:p.slot||null}))}))}),dispose(){reset();states.clear();detached.removeFromParent();}};
}
