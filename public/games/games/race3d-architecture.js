import { mergeGeometries } from '../assets/vendor/BufferGeometryUtils.js';

/** Compile original building recipes without creating GPU objects. Front is +Z. */
export function compileBuilding(model) {
  const parts=[];
  model.build({
    box:(name,color,x,y,z,w,h,d,rz=0)=>parts.push({kind:'box',name,color,x,y,z,w,h,d,rz}),
    roof:(name,color,x,y,z,w,h,d)=>parts.push({kind:'roof',name,color,x,y,z,w,h,d}),
    cylinder:(name,color,x,y,z,rt,rb,h,segments=12)=>parts.push({kind:'cylinder',name,color,x,y,z,rt,rb,h,segments}),
    sign:(name,color,x,y,z,w,h)=>parts.push({kind:'sign',name,color,x,y,z,w,h,d:1}),
  });return parts;
}

/** Spatially merged districts retain fine geometry with three draws per visible district. */
export function createArchitecture(THREE,track,models,{id='medium'}={}) {
  const group=new THREE.Group();group.name='specialist-city';
  const resources=new Set(),own=r=>(resources.add(r),r),recipes=models.map(compileBuilding);
  const box=own(new THREE.BoxGeometry(1,1,1));
  const roof=own(new THREE.BufferGeometry());
  roof.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,-.5,.5,-.5,-.5,0,.5,-.5,-.5,-.5,.5,.5,-.5,.5,0,.5,.5],3));
  roof.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);roof.computeVertexNormals();
  roof.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(12),2));
  const solid=own(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.76,metalness:.05}));
  const glass=own(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.23,metalness:.32}));
  const signs=recipes.flat().filter(p=>p.kind==='sign'),lookup=new Map(signs.map((p,i)=>[p,i]));
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;
  const ctx=canvas.getContext('2d'),columns=4,rows=Math.ceil(signs.length/columns),cellH=2048/rows;
  signs.forEach((p,i)=>{const x=i%columns*512,y=Math.floor(i/columns)*cellH;ctx.fillStyle=p.color;ctx.fillRect(x,y,512,cellH);ctx.fillStyle='#fff5da';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 27px "Microsoft YaHei",sans-serif';ctx.fillText(p.name,x+256,y+cellH/2,488);});
  const tex=own(new THREE.CanvasTexture(canvas));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const signMat=own(new THREE.MeshBasicMaterial({map:tex})),cache=new Map();
  function geometry(p){
    if(p.kind==='box')return box;if(p.kind==='roof')return roof;
    const key=p.kind==='sign'?'sign'+lookup.get(p):[p.rt,p.rb,p.h,p.segments].join(':');
    if(!cache.has(key)){
      let g;
      if(p.kind==='cylinder')g=new THREE.CylinderGeometry(p.rt,p.rb,p.h,p.segments);
      else {g=new THREE.PlaneGeometry(1,1);const i=lookup.get(p),uv=g.attributes.uv;for(let j=0;j<uv.count;j++){uv.setX(j,(uv.getX(j)+i%columns)/columns);uv.setY(j,(uv.getY(j)+rows-1-Math.floor(i/columns))/rows);}}
      cache.set(key,own(g));
    }return cache.get(key);
  }
  const samples=[];for(let d=0;d<track.totalLength;d+=10)samples.push(track.sampleTrack(d));
  function clearance(x,z){let distance=Infinity;for(const s of samples)distance=Math.min(distance,Math.hypot(x-s.position.x,z-s.position.z)-(s.width||18)/2);return distance;}
  const districts=new Map(),placements=[],parent=new THREE.Object3D(),part=new THREE.Object3D(),matrix=new THREE.Matrix4();
  const slots=Math.floor(track.totalLength/70);let index=0;
  for(let i=0;i<slots;i++)for(const side of [-1,1]){
    const s=track.sampleTrack((i+.28)*track.totalLength/slots),across=(s.width||18)/2+44+(i%3)*2;
    const x=s.position.x+s.right.x*across*side,z=s.position.z+s.right.z*across*side,clear=clearance(x,z);
    // 20m footprint radius plus 22m recovery margin; checks nearby switchbacks too.
    if(clear<42)continue;
    const type=index++%models.length,key=`${Math.floor(x/160)},${Math.floor(z/160)}`;
    if(!districts.has(key))districts.set(key,{solid:[],glass:[],sign:[]});const buckets=districts.get(key);
    parent.position.set(x,s.position.y-.3,z);parent.rotation.y=Math.atan2(-s.right.x*side,-s.right.z*side);parent.updateMatrix();
    const foundation={kind:'box',name:'foundation',color:'#aaa49c',x:0,y:-.2,z:0,w:31,h:.4,d:25};
    for(const p of [foundation,...recipes[type]]){
      part.position.set(p.x,p.y,p.z);part.rotation.set(0,0,p.rz||0);part.scale.set(p.kind==='cylinder'?1:p.w,p.kind==='cylinder'?1:p.h,p.kind==='cylinder'?1:p.d);part.updateMatrix();matrix.multiplyMatrices(parent.matrix,part.matrix);
      const original=geometry(p).clone().applyMatrix4(matrix),g=original.index?original.toNonIndexed():original;if(g!==original)original.dispose();
      const tint=new THREE.Color(p.color),colors=new Float32Array(g.attributes.position.count*3);for(let n=0;n<colors.length;n+=3)tint.toArray(colors,n);g.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const kind=p.kind==='sign'?'sign':/glass|glaz|window/i.test(p.name)?'glass':'solid';buckets[kind].push(g);
    }
    placements.push({id:models[type].id,name:models[type].name,x,y:s.position.y,z,clearance:clear-20});
  }
  const meshes=[];
  for(const [key,buckets]of districts)for(const [kind,list]of Object.entries(buckets)){
    if(!list.length)continue;const g=own(mergeGeometries(list));for(const p of list)p.dispose();g.computeBoundingSphere();
    const mesh=new THREE.Mesh(g,kind==='sign'?signMat:kind==='glass'?glass:solid);mesh.name=`city-${key}-${kind}`;mesh.userData.kind=kind;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;group.add(mesh);meshes.push(mesh);
  }
  let disposed=false;function setQuality(value){for(const m of meshes)m.castShadow=value==='high'&&m.userData.kind==='solid';}setQuality(id);
  return {group,setQuality,stats:{kind:'specialist-authored-city',types:models.length,buildings:placements.length,districts:districts.size,batches:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),placements},update(){},dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.clear();for(const r of resources)r.dispose();resources.clear();}};
}
