/** Local refinement for polar terrain, preserving coarse perimeter edges. */
export function refineDownhillBasin(THREE,geometry,basin,heightAt){
 const p=geometry.attributes.position,old=geometry.index.array,pos=Array.from(p.array),idx=[],stride=97,segments=96;
 const radius=Math.hypot(basin.x,basin.z),angle=(Math.atan2(basin.z,basin.x)+Math.PI*2)%(Math.PI*2),pad=Math.max(basin.radiusX,basin.radiusZ)*2;
 const r0=Math.floor((radius-pad)/10),r1=Math.ceil((radius+pad)/10),a0=Math.floor((angle-pad/radius)/Math.PI/2*96),a1=Math.ceil((angle+pad/radius)/Math.PI/2*96);
 for(let r=0;r<160;r++)for(let a=0;a<segments;a++){
  const offset=(r*segments+a)*6;if(r<r0||r>=r1||a<a0||a>=a1){idx.push(...old.slice(offset,offset+6));continue;}
  const corners=[r*stride+a,r*stride+a+1,(r+1)*stride+a,(r+1)*stride+a+1],base=pos.length/3;
  for(let j=0;j<=4;j++)for(let i=0;i<=16;i++){
   const u=i/16,v=j/4,w=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];let x=0,y=0,z=0;
   corners.forEach((c,k)=>{x+=p.getX(c)*w[k];y+=p.getY(c)*w[k];z+=p.getZ(c)*w[k];});
   if(!((r===r0&&j===0)||(r===r1-1&&j===4)||(a===a0&&i===0)||(a===a1-1&&i===16)))y=heightAt(x,z);
   pos.push(x,y,z);if(j<4&&i<16){const n=base+j*17+i,b=n+17;idx.push(n,n+1,b+1,n,b+1,b);}
  }
 }
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setIndex(idx);geometry.userData.basinAddedVertices=pos.length/3-p.count;
}
