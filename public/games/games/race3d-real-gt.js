/** Huracan STO inspired, original unbranded geometry. +Z forward, Y up.
 * Official references: https://www.lamborghini.com/en-en/models/huracan/huracan-sto
 * https://newsroom.porsche.com/en_US/2022/products/porsche-911-gt3-rs-world-premiere-29439.html
 * The GT3 RS reference informs wing supports only; this silhouette is angular STO-inspired.
 */
export const REAL_GT_PROFILE = {
 shoulderAmplitude: .11,
 stations: [[-2.30,.83,.77],[-2.12,.98,.84],[-1.65,1.02,.90],[-1.39,1.03,.93],[-.8,.95,.86],[0,.91,.82],[.75,.97,.82],[1.39,1.02,.88],[1.8,.99,.73],[2.12,.91,.59],[2.28,.82,.51]]
};
// Call after cockpit/details, before mergeStaticMeshes. Existing wheels stay untouched.
export function addRealGT(THREE, car, mats, api) {
 const {cacheGeometry,mesh,box}=api;
 const remove=new Set(['rear-wing','rear-wing-upright','wing-endplate','wing-gurney-lip','shark-fin']);
 for(const child of [...car.children]) if(remove.has(child.name)) car.remove(child);
 // Compress the existing complete cockpit vertically, preserving visible driver and glazing.
 const cockpit=new Set(['laminated-windshield','rear-window','left-window','right-window','painted-cabin-roof','bonded-window-seal','windshield-wiper','bucket-seat-back','driver-torso','driver-helmet','driver-visor','shoulder-harness','driver-arm','steering-wheel']);
 const cabin=new THREE.Group(); cabin.name='gt-low-greenhouse'; car.add(cabin);
 for(const child of [...car.children]) if(cockpit.has(child.name)) cabin.add(child);
 cabin.scale.y=.77; cabin.position.y=.19;
 function polygon(name,points,material) {
  const geo=cacheGeometry('real-gt:'+name,()=>{
   const g=new THREE.BufferGeometry(); const p=[];
   for(let i=1;i<points.length-1;i++) p.push(...points[0],...points[i],...points[i+1]);
   g.setAttribute('position',new THREE.Float32BufferAttribute(p,3)); g.computeVertexNormals(); return g;
  });
  return mesh(car,geo,material,'gt-'+name);
 }
 for(const s of [-1,1]) {
  // Side intake sits behind the door, ahead of rear axle; dark inset creates depth.
  const a=[[s*.965,.49,-.98],[s*.962,.80,-.98],[s*.925,.78,-.40],[s*.929,.60,-.56]];
  polygon('side-intake-'+s,s===1?a:a.slice().reverse(),mats.carbon);
  mesh(car,box(.05,.045,1.22),mats.carbon,'gt-sill',[s*.96,.35,-.02]);
  mesh(car,box(.05,.37,.09),mats.carbon,'gt-wing-support',[s*.53,1.13,-1.89],[.15,0,0]);
  mesh(car,box(.035,.22,.47),mats.body,'gt-wing-endplate',[s*.98,1.34,-1.96]);
  // Separate hood vents follow the forward deck, avoiding the windscreen.
  mesh(car,box(.22,.012,.36),mats.carbon,'gt-hood-extractor',[s*.38,.811,1.24],[.03,0,s*.06]);
 }
 mesh(car,box(1.98,.045,.43),mats.carbon,'gt-rear-airfoil',[0,1.39,-1.96],[-.08,0,0]);
 mesh(car,box(1.88,.035,.24),mats.carbon,'gt-front-splitter',[0,.32,2.17]);
 car.userData.realWorldReference='Huracan STO inspired original GT';
}
