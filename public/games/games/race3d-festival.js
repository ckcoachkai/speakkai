/** Original circuit furniture, all instanced; no proprietary artwork or textures. */
export function createCircuitFestival(THREE,track){
 const group=new THREE.Group();group.name='race3d-circuit-festival';const geo=[],mats=[],batches=[];
 const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.18,...extra});mats.push(m);return m;};
 const teal=mat('#2cbdc9'),gold=mat('#ffc65b'),ink=mat('#172b3b'),silver=mat('#b2bdc7',{metalness:.7,roughness:.35}),white=mat('#e8eeec'),grass=mat('#3d765e');
 const batch=(name,geometry,material,capacity)=>{geo.push(geometry);const m=new THREE.InstancedMesh(geometry,material,capacity);m.name=name;m.count=0;m.castShadow=true;m.receiveShadow=true;group.add(m);batches.push(m);return m;};
 const posts=batch('safety-fence-posts',new THREE.BoxGeometry(.14,2.4,.14),silver,240);
 const rails=batch('safety-fence-rails',new THREE.BoxGeometry(.09,.1,9),silver,480);
 const tires=batch('stacked-trackside-tires',new THREE.CylinderGeometry(.54,.54,.52,10),ink,360);
 const seats=batch('grandstand-seats',new THREE.BoxGeometry(1.1,.25,.65),teal,360);
 const terraces=batch('grandstand-terraces',new THREE.BoxGeometry(25,.6,3),white,36);
 const canopy=batch('grandstand-solar-canopies',new THREE.BoxGeometry(27,.16,12),ink,6);
 const flags=batch('circuit-pennants',new THREE.PlaneGeometry(1.35,1.8),gold,80);flags.material.side=THREE.DoubleSide;
 const markers=batch('braking-distance-boards',new THREE.BoxGeometry(.2,1.4,1.2),white,36);
 const stripes=batch('braking-board-stripes',new THREE.BoxGeometry(.22,.12,1.22),ink,108);
 const flowers=batch('trackside-planters',new THREE.ConeGeometry(.8,1.3,6),grass,96);
 const d=new THREE.Object3D();const put=(mesh,dist,side,y=0,rot=0,scale=1)=>{const s=track.sampleTrack(dist);d.position.copy(s.position).addScaledVector(s.right,side);d.position.y+=y;d.rotation.set(0,Math.atan2(s.tangent.x,s.tangent.z)+rot,0);d.scale.setScalar(scale);d.updateMatrix();mesh.setMatrixAt(mesh.count++,d.matrix);};
 for(let i=0;i<110;i++){const at=i/110*track.totalLength;for(const side of [-1,1]){put(posts,at,side*11,1.2);for(const h of [.6,1.6])put(rails,at,side*11,h);}}
 for(let zone=0;zone<5;zone++)for(let i=0;i<12;i++)for(let row=0;row<3;row++)put(tires,track.totalLength*(.18+zone*.16)+i*1.1,(zone%2?1:-1)*12,.3+row*.52);
 for(let zone=0;zone<3;zone++){const at=track.totalLength*(.025+zone*.34),side=zone%2?-1:1;for(let row=0;row<6;row++){put(terraces,at,side*(19+row*2.3),row*.65+.3,Math.PI/2);for(let col=0;col<18;col++)put(seats,at+(col-9)*1.3,side*(19+row*2.3),row*.65+.95);}put(canopy,at,side*25,6.7,Math.PI/2);}
 for(let i=0;i<64;i++){const at=i/64*track.totalLength;put(flags,at,(i%2?1:-1)*12.4,4.4,Math.PI/2);put(flowers,at,(i%2?1:-1)*15,.65);}
 for(let bend=0;bend<6;bend++)for(let number=1;number<=3;number++){const at=track.totalLength*(.13+bend*.145)-number*40;put(markers,at,10.4,1.5);for(let k=0;k<number;k++)put(stripes,at,10.4,1.15+k*.3);}
 for(const b of batches){b.instanceMatrix.needsUpdate=true;b.computeBoundingSphere();}
 const flagPositions=Array.from({length:flags.count},(_,i)=>{const m=new THREE.Matrix4();flags.getMatrixAt(i,m);return m;});let disposed=false;
 return {group,stats:{drawCalls:batches.length,instances:batches.reduce((n,b)=>n+b.count,0)},update(time=0){if(disposed)return;for(let i=0;i<flagPositions.length;i++){d.matrix.copy(flagPositions[i]);d.matrix.decompose(d.position,d.quaternion,d.scale);d.rotation.y+=Math.sin(time*2.8+i*.7)*.18;d.updateMatrix();flags.setMatrixAt(i,d.matrix);}flags.instanceMatrix.needsUpdate=true;},dispose(){if(disposed)return;disposed=true;group.removeFromParent();geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());group.clear();}};
}
