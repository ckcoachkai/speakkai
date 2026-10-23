/** Continuous terrain; caller owns disposal through its scenery group. */
export function addLandscapeTerrain({ THREE, group, route, groundY, unit = 1, center, radius }) {
  const extent = radius + 650 * unit;
  const divisions = 160;
  const cell = extent * 2 / divisions;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
  // Distance to every closed route segment, not only the nearest sample.
  // Half-cell-diagonal padding ensures interpolated triangles cannot rise into road.
  const segments = route.map((a, i) => {
    const b = route[(i+1)%route.length];
    return {a:a.p,b:b.p,width:Math.max(a.width,b.width)/2};
  });
  function roadClearance(x,z) {
    let best = Infinity;
    for (const {a,b,width} of segments) {
      const dx=b.x-a.x,dz=b.z-a.z;
      const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
      best=Math.min(best,Math.hypot(x-a.x-t*dx,z-a.z-t*dz)-width);
    }
    return best;
  }
  function shape(x,z) {
    x-=center.x; z-=center.z;
    const r=Math.hypot(x,z);
    const outer=smooth(radius*.75,radius+280*unit,r);
    const low=4.5+3*Math.sin(x/97)*Math.cos(z/81)+2*Math.sin((x+z)/53);
    const ridge=30+22*Math.sin(x/193+1.1)*Math.cos(z/157)+14*Math.sin((x-z)/237);
    const detail=2.1*Math.sin(x/29)*Math.sin(z/37)+.65*Math.cos((x+z)/13);
    return Math.max(.05,low+outer*ridge+outer*detail);
  }
  function heightAt(x,z) {
    const clearance=roadClearance(x,z);
    return groundY+.018+shape(x,z)*smooth(cell*1.45+10*unit,cell*1.45+65*unit,clearance);
  }
  const geometry=new THREE.PlaneGeometry(extent*2,extent*2,divisions,divisions);
  geometry.rotateX(-Math.PI/2);
  const positions=geometry.attributes.position;
  const colors=new Float32Array(positions.count*3);
  const grass=new THREE.Color('#65724a'),dry=new THREE.Color('#8e8960');
  const earth=new THREE.Color('#77705c'),rock=new THREE.Color('#8b8b80');
  const color=new THREE.Color();
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i)+center.x,z=positions.getZ(i)+center.z;
    positions.setXYZ(i,x,heightAt(x,z),z);
  }
  geometry.computeVertexNormals();
  const normals=geometry.attributes.normal;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),z=positions.getZ(i),h=positions.getY(i)-groundY;
    const slope=1-Math.abs(normals.getY(i));
    const patch=.5+.5*Math.sin(x*.027+Math.sin(z*.021))*Math.cos(z*.033);
    color.copy(grass).lerp(dry,patch*.65).lerp(earth,smooth(.035,.17,slope)*.65);
    color.lerp(rock,smooth(.11,.32,slope)*smooth(10,35,h));
    color.multiplyScalar(.94+.08*Math.sin(x*.21)*Math.cos(z*.17));
    colors.set([color.r,color.g,color.b],i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='continuous-grass-earth-rock-landscape';
  mesh.receiveShadow=true;
  group.add(mesh);
  return {mesh,heightAt,roadClearance};
}
