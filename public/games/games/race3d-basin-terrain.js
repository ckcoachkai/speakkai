/** Refine only lake rectangles; perimeter heights follow original coarse edges. */
export function refineBasinTerrain(THREE,geometry,basins,heightAt){
 const source=geometry.attributes.position,positions=Array.from(source.array),indices=[],stride=257,cells=256;
 const x0=source.getX(0),z0=source.getZ(0),dx=source.getX(1)-x0,dz=source.getZ(stride)-z0;
 const regions=basins.map(b=>({x0:Math.max(0,Math.floor((b.x-b.radiusX*1.8-x0)/dx)),x1:Math.min(cells,Math.ceil((b.x+b.radiusX*1.8-x0)/dx)),z0:Math.max(0,Math.floor((b.z-b.radiusZ*1.8-z0)/dz)),z1:Math.min(cells,Math.ceil((b.z+b.radiusZ*1.8-z0)/dz))}));
 const old=geometry.index.array;
 for(let z=0;z<cells;z++)for(let x=0;x<cells;x++)if(!regions.some(r=>x>=r.x0&&x<r.x1&&z>=r.z0&&z<r.z1)){const i=(z*cells+x)*6;indices.push(...old.slice(i,i+6));}
 for(const r of regions){
  const nx=(r.x1-r.x0)*4,nz=(r.z1-r.z0)*4,base=positions.length/3;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
   const gx=r.x0+i/4,gz=r.z0+j/4,x=x0+gx*dx,z=z0+gz*dz;let y=heightAt(x,z);
   if(i===0||i===nx||j===0||j===nz){
    const ax=Math.min(cells-1,Math.floor(gx)),az=Math.min(cells-1,Math.floor(gz)),tx=gx-ax,tz=gz-az;
    y=source.getY(az*stride+ax)*(1-tx)*(1-tz)+source.getY(az*stride+ax+1)*tx*(1-tz)+source.getY((az+1)*stride+ax)*(1-tx)*tz+source.getY((az+1)*stride+ax+1)*tx*tz;
   }
   positions.push(x,y,z);
   if(i<nx&&j<nz){const a=base+j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
 }
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.deleteAttribute('normal');geometry.deleteAttribute('uv');geometry.setIndex(indices);
 geometry.userData.basinRefinement={factor:4,addedVertices:positions.length/3-source.count,regions:regions.length};
}
