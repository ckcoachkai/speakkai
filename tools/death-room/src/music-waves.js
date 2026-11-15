import * as THREE from 'three';
/** Two quiet wall-mounted music visualizers, driven only by decoded soundtrack energy. */
export function createMusicWaves({scene,room={}}={}){
 const root=new THREE.Group();root.name='soundtrack-wall-waves';scene.add(root);
 const barGeo=new THREE.BoxGeometry(.075,1,.075), ringGeo=new THREE.TorusGeometry(.52,.012,4,48);
 const mats=[new THREE.MeshBasicMaterial({color:0x4ad9ea,transparent:true,opacity:.85,depthWrite:false}),new THREE.MeshBasicMaterial({color:0xb991ee,transparent:true,opacity:.45,depthWrite:false})];
 const bars=[],rings=[],barMeshes=[],dummy=new THREE.Object3D();const half=room.halfWidth||7;
 for(let side=0;side<2;side++){const panel=new THREE.Group();panel.position.set((side?1:-1)*8.4,3.15,4.5);panel.rotation.y=.22;root.add(panel);const instances=new THREE.InstancedMesh(barGeo,mats[side],13);instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);instances.frustumCulled=false;panel.add(instances);barMeshes.push(instances);for(let i=0;i<13;i++){bars.push({mesh:instances,index:i});}for(let i=0;i<3;i++){const m=mats[side].clone();const ring=new THREE.Mesh(ringGeo,m);ring.position.z=-.04;panel.add(ring);rings.push({mesh:ring,index:i});}}
 const reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;let disposed=false,energy=0,active=false;
 root.visible=false;
 function update(dt,r={}){if(disposed)return;active=!!r.active;const step=Math.min(.1,Math.max(0,dt||0));energy+=(Math.max(0,Math.min(1,active?r.energy||0:0))-energy)*(1-Math.exp(-step*10));root.visible=active&&energy>.002;if(!root.visible)return;const motion=!reduced?.matches;const visual=Math.min(1,Math.sqrt(Math.max(0,energy))*3.2);for(const b of bars){const shape=.3+.7*Math.abs(Math.sin(b.index*.6+(motion?(r.time||0)*1.8:0)));dummy.position.set((b.index-6)*.16,0,0);dummy.scale.set(1,.08+visual*1.6*shape+(motion?(r.beatPulse||0)*.15:0),1);dummy.updateMatrix();b.mesh.setMatrixAt(b.index,dummy.matrix);}for(const mesh of barMeshes)mesh.instanceMatrix.needsUpdate=true;for(const ring of rings){const phase=motion?((r.time||0)*.4+ring.index/3)%1:ring.index/3;ring.mesh.scale.setScalar(.7+phase*2.3);ring.mesh.material.opacity=visual*(1-phase)*.8+(motion?(r.beatPulse||0)*.12:0);}}
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();barGeo.dispose();ringGeo.dispose();mats.forEach(m=>m.dispose());rings.forEach(r=>r.mesh.material.dispose());}
 return {update,dispose,get stats(){return {active,energy,visible:root.visible&&!disposed,bars:bars.length,barDrawCalls:barMeshes.length,rings:rings.length,reducedMotion:!!reduced?.matches,disposed};}};
}
