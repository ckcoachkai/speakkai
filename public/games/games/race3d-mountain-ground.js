/** Shared mountain elevation and recessed lake bed in world metres. */
export const MOUNTAIN_BASINS=Object.freeze([{x:-1620,z:-620,y:44,radiusX:38,radiusZ:28}]);
export function mountainGroundHeight(x,z) {
  const t=Math.max(0,Math.min(1,(300-z)/1050));let height=48*t*t*(3-2*t);
  for(const b of MOUNTAIN_BASINS){const r=Math.hypot((x-b.x)/b.radiusX,(z-b.z)/b.radiusZ);if(r<1.7){const u=Math.max(0,Math.min(1,(r-.72)/.28)),rise=u*u*(3-2*u);
    const bank=b.y+1.35-2+3*rise;
    const v=Math.max(0,Math.min(1,(r-1.12)/.58)),blend=v*v*(3-2*v);height=bank*(1-blend)+height*blend;}}
  return height;
}

/** Road-cleared continuous rock ridges; same field is used for camera clearance. */
export function createMountainTerrain(route) {
  return (x,z)=>{
    let nearest=Infinity;for(const p of route)nearest=Math.min(nearest,Math.hypot(x-p.x,z-p.z));
    const t=Math.max(0,Math.min(1,(nearest-65)/150)),blend=t*t*(3-2*t);
    const ridge=45+95*Math.pow(.5+.5*Math.sin(x/185+z/235),2)+38*Math.pow(.5+.5*Math.cos(z/125-x/210),3);
    let basinMask=1;for(const b of MOUNTAIN_BASINS){const r=Math.hypot((x-b.x)/b.radiusX,(z-b.z)/b.radiusZ);basinMask=Math.min(basinMask,Math.max(0,Math.min(1,(r-1.7)/1.3)));}
    return -1.35+mountainGroundHeight(x,z)+ridge*blend*basinMask;
  };
}
