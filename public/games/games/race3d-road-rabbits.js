/** Cartoon roadside rabbits and temporary non-graphic impact decals. Purely cosmetic. */
export function createRoadRabbits(THREE, { track, random = Math.random, reducedMotion = false } = {}) {
  if (!track?.sampleTrack || !(track.totalLength > 0)) throw new TypeError('Road rabbits need a track with a positive length');
  const MAX_RABBITS = 192, MAX_RENDERED = 96, MAX_DECALS = 64, length = track.totalLength;
  const group = new THREE.Group(); group.name = 'race3d-road-rabbits';
  const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wrap = d => ((d % length) + length) % length;
  const gap = (a, b) => track.closed === false ? a - b : wrap(a - b + length / 2) - length / 2;
  const seed = Math.floor(clamp(finite(random(), .5), 0, .999999) * 2147483647) || 1234567;
  const hash = n => { let x = (n + seed) | 0; x = Math.imul(x ^ x >>> 16, 0x45d9f3b); x = Math.imul(x ^ x >>> 16, 0x45d9f3b); return ((x ^ x >>> 16) >>> 0) / 4294967296; };
  const bodyGeometry = new THREE.SphereGeometry(1, 8, 6), headGeometry = new THREE.SphereGeometry(1, 8, 6), earGeometry = new THREE.SphereGeometry(1, 6, 5);
  const rabbitMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  function instanced(name, geometry, material, capacity) {
    const mesh = new THREE.InstancedMesh(geometry, material, capacity); mesh.name = name; mesh.count = 0;
    mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(mesh); return mesh;
  }
  const bodies = instanced('rabbit-bodies', bodyGeometry, rabbitMaterial, MAX_RENDERED);
  const heads = instanced('rabbit-heads', headGeometry, rabbitMaterial, MAX_RENDERED);
  const ears = instanced('rabbit-ears', earGeometry, rabbitMaterial, MAX_RENDERED * 2);
  // Irregular, flat red mark: deliberately abstract, with no anatomical detail.
  const splatPosition = [];
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI * 2 / 24, b = (i + 1) * Math.PI * 2 / 24;
    const r1 = .78 + .22 * Math.sin(i * 7.1) ** 2, r2 = .78 + .22 * Math.sin((i + 1) * 7.1) ** 2;
    splatPosition.push(0,0,0, Math.cos(a)*r1,0,Math.sin(a)*r1, Math.cos(b)*r2,0,Math.sin(b)*r2);
  }
  const splatGeometry = new THREE.BufferGeometry(); splatGeometry.setAttribute('position', new THREE.Float32BufferAttribute(splatPosition, 3));
  const alpha = new THREE.InstancedBufferAttribute(new Float32Array(MAX_DECALS), 1); splatGeometry.setAttribute('splatAlpha', alpha);
  const splatMaterial = new THREE.MeshBasicMaterial({ color: 0xd82c39, transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  splatMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float splatAlpha; varying float vSplatAlpha;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplatAlpha = splatAlpha;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vSplatAlpha;').replace('#include <opaque_fragment>', 'diffuseColor.a *= vSplatAlpha;\n#include <opaque_fragment>');
  };
  splatMaterial.customProgramCacheKey = () => 'race3d-rabbit-splat-v1';
  const splats = instanced('rabbit-splats', splatGeometry, splatMaterial, MAX_DECALS);
  const dummy = new THREE.Object3D(), offset = new THREE.Vector3(), baseRotation = new THREE.Quaternion(), yawRotation = new THREE.Quaternion();
  const axisY = new THREE.Vector3(0,1,0), euler = new THREE.Euler(0,0,0,'YXZ');
  const shades = [new THREE.Color(0xd8d0bf),new THREE.Color(0xb8aaa1),new THREE.Color(0xeee8d9),new THREE.Color(0x9e9990)];
  const rabbits = Array.from({length:MAX_RABBITS}, (_, i) => {
    // Eight rabbits per cluster; the first group starts near the race grid.
    const cluster = Math.floor(i / 8), slot = i % 8;
    const clusterStart = Math.min(120, length * .12);
    const center = track.closed === false ? clusterStart + cluster * Math.max(0, length - clusterStart - 35) / 23 : 120 + cluster * length / 24;
    const rawDistance = center + (slot - 3.5) * 7 + (hash(i * 5) - .5) * 2;
    const distance = track.closed === false ? clamp(rawDistance, 0, length) : wrap(rawDistance);
    const sample = track.sampleTrack(distance), half = Math.min(7.4, finite(sample.width, finite(track.width,18)) * .40);
    const lateral = (hash(i * 5 + 1) * 2 - 1) * half;
    const tangent = sample.tangent, right = sample.right || {x:tangent.z,y:0,z:-tangent.x}, bank = finite(sample.bank);
    const position = new THREE.Vector3(finite(sample.position.x)+finite(right.x)*lateral,
      finite(sample.position.y)+finite(right.y)*lateral+Math.tan(bank)*lateral+.045,
      finite(sample.position.z)+finite(right.z)*lateral);
    euler.set(-Math.atan2(finite(tangent.y),Math.max(.001,Math.hypot(finite(tangent.x),finite(tangent.z,1)))), Math.atan2(finite(tangent.x),finite(tangent.z,1)), bank,'YXZ');
    baseRotation.setFromEuler(euler);
    return { distance,lateral,position,rotation:baseRotation.clone(),yaw:hash(i*5+2)*Math.PI*2,phase:hash(i*5+3)*6.28,shade:i%shades.length,alive:true };
  });
  const decals = Array.from({length:MAX_DECALS},()=>({live:false,age:0,position:new THREE.Vector3(),rotation:new THREE.Quaternion()}));
  const previous = new Map(), nearestIndices = new Uint16Array(MAX_RENDERED), nearestDistances = new Float32Array(MAX_RENDERED);
  let cursor=0, clock=0, hits=0, visible=0, decalCount=0, disposed=false, qualityId='medium';
  function reset() { for(const r of rabbits)r.alive=true; for(const d of decals)d.live=false; previous.clear(); cursor=clock=hits=visible=decalCount=0; bodies.count=heads.count=ears.count=splats.count=0; group.visible=false; }
  reset();
  function update(cars,dt,{active=false,quality='medium'}={}) {
    if(disposed)return;
    qualityId=typeof quality==='string'?quality:quality?.id||'medium';
    if(!active || !Array.isArray(cars)) { group.visible=false; previous.clear(); return; }
    const step=clamp(finite(dt),0,.25); clock=(clock+step)%1000;
    const limit=qualityId==='low'?48:qualityId==='high'?96:72, radius=qualityId==='low'?90:150;
    // Advance decals before creating new ones; each instance carries its own opacity.
    for(const d of decals)if(d.live){d.age+=step;if(d.age>=3)d.live=false;}
    for(let c=0;c<cars.length;c++){
      const car=cars[c]; if(!car)continue;
      const id=car.id ?? c, d=finite(car.distance), lateral=finite(car.lateral), prev=previous.get(id);
      const grounded=!car.finished&&!car.eliminated&&!car.finishHidden&&finite(car.flightHeight)<.45&&finite(car.rampHeight)<.45&&finite(car.flightRemaining)<=0;
      if(grounded){
        let travel=prev?.grounded?gap(d,prev.distance):0; if(Math.abs(travel)>Math.max(80,finite(car.speed)*step*3+20))travel=0;
        const start=prev?.grounded?prev.distance:d, startLateral=prev?.grounded?prev.lateral:lateral;
        for(let i=0;i<MAX_RABBITS;i++){
          const r=rabbits[i]; if(!r.alive)continue;
          const rel=gap(r.distance,start), t=Math.abs(travel)>.0001?clamp(rel/travel,0,1):0;
          const longitudinal=gap(r.distance,start+travel*t), side=startLateral+(lateral-startLateral)*t;
          if(Math.abs(longitudinal)<(finite(car.length,4.4)*.5+.3)&&Math.abs(r.lateral-side)<(finite(car.width,1.9)*.5+.28)){
            r.alive=false; hits++; const mark=decals[cursor];cursor=(cursor+1)%MAX_DECALS;
            mark.live=true;mark.age=0;mark.position.copy(r.position);mark.position.y+=.025;mark.rotation.copy(r.rotation);
          }
        }
      }
      if(prev){prev.distance=d;prev.lateral=lateral;prev.grounded=grounded;}else previous.set(id,{distance:d,lateral,grounded});
    }
    // Keep only the nearest visible animals, independent of cluster or quality tier.
    let selected=0;
    for(let i=0;i<MAX_RABBITS;i++){
      const r=rabbits[i];if(!r.alive)continue;
      let nearest=Infinity;for(let c=0;c<cars.length;c++)if(cars[c]&&!cars[c].finished&&!cars[c].eliminated)nearest=Math.min(nearest,Math.abs(gap(r.distance,finite(cars[c].distance))));
      if(nearest>radius || (selected===limit && nearest>=nearestDistances[selected-1]))continue;
      let at=Math.min(selected,limit-1);
      while(at>0 && nearest<nearestDistances[at-1]){if(at<limit){nearestDistances[at]=nearestDistances[at-1];nearestIndices[at]=nearestIndices[at-1];}at--;}
      nearestDistances[at]=nearest;nearestIndices[at]=i;if(selected<limit)selected++;
    }
    visible=0;
    for(let j=0;j<selected;j++){
      const r=rabbits[nearestIndices[j]];
      const hop=reducedMotion?0:Math.max(0,Math.sin(clock*3+r.phase))*.18;
      yawRotation.setFromAxisAngle(axisY,r.yaw);dummy.quaternion.copy(r.rotation).multiply(yawRotation);
      offset.set(0,.32+hop,0).applyQuaternion(r.rotation); dummy.position.copy(r.position).add(offset); dummy.scale.set(.32,.29,.43);dummy.updateMatrix();bodies.setMatrixAt(visible,dummy.matrix);bodies.setColorAt(visible,shades[r.shade]);
      offset.set(0,.58+hop,.27).applyQuaternion(dummy.quaternion); dummy.position.copy(r.position).add(offset);dummy.scale.set(.24,.23,.23);dummy.updateMatrix(); heads.setMatrixAt(visible,dummy.matrix);heads.setColorAt(visible,shades[r.shade]);
      for(let side=-1;side<=1;side+=2){offset.set(side*.12,.91+hop,.27).applyQuaternion(dummy.quaternion);dummy.position.copy(r.position).add(offset);dummy.scale.set(.075,.34,.075);dummy.updateMatrix();const n=visible*2+(side+1)/2;ears.setMatrixAt(n,dummy.matrix);ears.setColorAt(n,shades[r.shade]);}
      visible++;
    }
    bodies.count=heads.count=visible; ears.count=visible*2; decalCount=0;
    for(const mark of decals)if(mark.live){dummy.position.copy(mark.position);dummy.quaternion.copy(mark.rotation);dummy.scale.set(1.05,1,.72);dummy.updateMatrix();splats.setMatrixAt(decalCount,dummy.matrix);alpha.setX(decalCount,clamp((3-mark.age)/1.4,0,1));decalCount++;}
    splats.count=decalCount; alpha.needsUpdate=true; group.visible=visible>0||decalCount>0;
    for(const mesh of [bodies,heads,ears,splats]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  }
  function snapshot(){return {disposed,quality:qualityId,reducedMotion:!!reducedMotion,capacity:MAX_RABBITS,renderCapacity:MAX_RENDERED,decalCapacity:MAX_DECALS,alive:rabbits.filter(r=>r.alive).length,visible,decals:decalCount,hits,drawCalls:(visible?3:0)+(decalCount?1:0),placements:rabbits.map(r=>({distance:r.distance,lateral:r.lateral,alive:r.alive}))};}
  function dispose(){if(disposed)return;reset();disposed=true;group.removeFromParent();group.clear();for(const m of [bodies,heads,ears,splats])m.dispose();bodyGeometry.dispose();headGeometry.dispose();earGeometry.dispose();splatGeometry.dispose();rabbitMaterial.dispose();splatMaterial.dispose();}
  return {group,update,reset,dispose,snapshot};
}



