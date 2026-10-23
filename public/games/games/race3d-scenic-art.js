// Generated scenic cutouts. Fixed bounded batches, no frame-time allocation.
const assets=[{url:new URL('../assets/race3d-scenery/mature-oak.png',import.meta.url),name:'mature-oak.png',height:15,count:18,aspect:0.9263238679969301},
{url:new URL('../assets/race3d-scenery/mature-spruce.png',import.meta.url),name:'mature-spruce.png',height:17,count:15,aspect:0.6666666666666666},
{url:new URL('../assets/race3d-scenery/pine_daylight.png',import.meta.url),name:'pine_daylight.png',height:18,count:14,aspect:0.6666666666666666},
{url:new URL('../assets/race3d-scenery/flowering-hedge-grass.png',import.meta.url),name:'flowering-hedge-grass.png',height:3,count:20,aspect:3},
{url:new URL('../assets/race3d-scenery/farmhouse_cutout.png',import.meta.url),name:'farmhouse_cutout.png',height:12,count:3,aspect:1.5},
{url:new URL('../assets/race3d-scenery/barn-realistic.png',import.meta.url),name:'barn-realistic.png',height:11,count:2,aspect:1},
{url:new URL('../assets/race3d-scenery/roadside-horse-grazing.png',import.meta.url),name:'roadside-horse-grazing.png',height:4,count:4,aspect:1.5},
{url:new URL('../assets/race3d-scenery/cow_grazing.png',import.meta.url),name:'cow_grazing.png',height:3.6,count:4,aspect:1.5},
{url:new URL('../assets/race3d-scenery/sheep-grazing-cutout.png',import.meta.url),name:'sheep-grazing-cutout.png',height:2,count:6,aspect:1.5},
{url:new URL('../assets/race3d-scenery/crowd-barrier.png',import.meta.url),name:'crowd-barrier.png',height:4,count:4,aspect:2.4824120603015074},
{url:new URL('../assets/race3d-scenery/ray-spectator.png',import.meta.url),name:'ray-spectator.png',height:2.5,count:1,aspect:0.6666666666666666}];

export function addScenicArt(THREE, {group, track, terrain, unit}) {
 const root=new THREE.Group(); root.name='realistic-scenic-art'; group.add(root);
 const loader=new THREE.TextureLoader(); const dummy=new THREE.Object3D();
 for(let ai=0;ai<assets.length;ai++) {
  const asset=assets[ai], h=asset.height*unit, w=h*asset.aspect;
  const map=loader.load(asset.url.href); map.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map,roughness:1,alphaTest:.45,side:THREE.DoubleSide});
  const geo=new THREE.PlaneGeometry(w,h); geo.translate(0,h*.5,0);
  const crossed=/oak|spruce|pine|hedge/.test(asset.name);
  const mesh=new THREE.InstancedMesh(geo,material,asset.count*(crossed?2:1)); mesh.name='scenic-'+asset.name;
  let slot=0;
  for(let i=0;i<asset.count;i++) {
   // Reject against every road segment, including neighboring hairpins.
   const at=track.sampleTrack(track.totalLength*((i+.37+ai*.123)/asset.count%1));
   const side=i%2?-1:1, offset=at.width*.5+(40+ai*3)*unit+w*.5;
   const x=at.position.x+at.right.x*offset*side,z=at.position.z+at.right.z*offset*side;
   if(terrain.roadClearance(x,z)<w*.5+20*unit) continue;
   const y=terrain.heightAt(x,z);
   dummy.position.set(x,y,z); dummy.rotation.set(0,Math.atan2(-at.right.x*side,-at.right.z*side),0);
   dummy.scale.set(1,1,1); dummy.updateMatrix(); mesh.setMatrixAt(slot++,dummy.matrix);
   if(crossed) { dummy.rotation.y+=Math.PI/2; dummy.updateMatrix(); mesh.setMatrixAt(slot++,dummy.matrix); }
   if(asset.name.includes('ray-') || asset.name.includes('crowd-')) {
    // Independent physical scenery barrier sits between people and the road.
    const wall=new THREE.Mesh(new THREE.BoxGeometry(w+4*unit,1.25*unit,.8*unit),new THREE.MeshStandardMaterial({color:0xe3e2da,roughness:.9}));
    wall.name='spectator-protective-wall'; wall.position.set(x-at.right.x*side*3*unit,y+.625*unit,z-at.right.z*side*3*unit);
    wall.rotation.y=dummy.rotation.y; root.add(wall);
   }
  }
  mesh.count=slot; mesh.instanceMatrix.needsUpdate=true; root.add(mesh);
 }
 return root;
}

