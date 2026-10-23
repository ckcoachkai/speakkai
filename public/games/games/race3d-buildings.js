/** Bounded, shared-resource architecture. Coordinates: Y up; track API only. */
export function createRoadsideBuildings(THREE, track, options = {}) {
  const group = new THREE.Group(); group.name = 'roadside-architecture';
  const resources = new Set();
  const own = r => (resources.add(r), r);
  const box = own(new THREE.BoxGeometry(1, 1, 1));
  function texture(kind) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d'); if (!ctx) return null;
    ctx.fillStyle = kind === 'roof' ? '#665d51' : '#b9b3a1'; ctx.fillRect(0,0,128,128);
    for (let y=0;y<128;y+=8) for (let x=0;x<144;x+=16) {
      const shade = (x * 17 + y * 31) % 37;
      ctx.fillStyle = kind === 'roof' ? `rgb(${72+shade},${65+shade},${56+shade})` : `rgb(${155+shade},${150+shade},${135+shade})`;
      ctx.fillRect(x-(y%16?8:0),y,15,7);
    }
    const t=own(new THREE.CanvasTexture(c)); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(2,2); if (THREE.SRGBColorSpace) t.colorSpace=THREE.SRGBColorSpace;
    return t;
  }
  const mat = (color, extra={}) => own(new THREE.MeshStandardMaterial({color,roughness:.87,...extra}));
  const stone=mat(0xd6cfb9,{map:texture('stone')}), plaster=mat(0xe7dfc9), roof=mat(0xafa695,{map:texture('roof')});
  const wood=mat(0x625044), trim=mat(0xe6e0cd), glass=mat(0x344b52,{roughness:.24,metalness:.18});
  const metal=mat(0x586160,{metalness:.4,roughness:.56}), concrete=mat(0xaaa89b), red=mat(0x7c4840);
  function cube(parent,material,x,y,z,w,h,d,name) {
    const m=new THREE.Mesh(box,material); m.position.set(x,y,z); m.scale.set(w,h,d); m.name=name;
    m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function windowAt(g,x,y,z) {
    cube(g,trim,x,y,z,1.5,1.85,.16,'window-frame');
    cube(g,glass,x,y,z+.1,1.24,1.58,.08,'recessed-window-glass');
    cube(g,trim,x,y,z+.16,.075,1.6,.06,'window-mullion');
    cube(g,trim,x,y,z+.16,1.26,.075,.06,'window-crossbar');
    cube(g,stone,x,y-.96,z+.2,1.7,.13,.4,'window-sill');
  }
  function house(g,index) {
    cube(g,stone,0,.45,0,13,.9,9,'masonry-foundation');
    cube(g,index%2?plaster:stone,0,3.6,0,12,6.3,8,'house-walls');
    // Two proper sloped roof planes, with a ridge and overhanging eaves.
    for (const side of [-1,1]) {
      const r=cube(g,roof,0,7.25,side*2.25,13.5,.24,5.25,'sloped-tiled-roof'); r.rotation.x=side*.48;
      cube(g,wood,0,6.1,side*4.55,13.5,.22,.17,'eaves-fascia');
    }
    cube(g,roof,0,8.45,0,13.6,.24,.28,'roof-ridge');
    cube(g,red,3.9,8.1,-1.2,1.05,2.6,1,'brick-chimney');
    cube(g,stone,3.9,9.4,-1.2,1.3,.2,1.25,'chimney-cap');
    for(const x of [-4,0,4]) windowAt(g,x,4.6,4.07);
    for(const x of [-4,4]) windowAt(g,x,1.95,4.07);
    cube(g,trim,0,1.55,4.08,1.9,2.9,.2,'door-surround');
    cube(g,wood,0,1.5,4.23,1.6,2.65,.12,'front-door');
    cube(g,metal,.57,1.5,4.32,.08,.15,.08,'door-handle');
    cube(g,concrete,0,.18,4.8,2.5,.36,1.5,'front-step');
    for(let x=-8;x<=8;x+=2) cube(g,wood,x,.85,9,.16,1.7,.16,'fence-post');
    for(const y of [.5,1.25]) cube(g,wood,0,y,9,16,.13,.12,'fence-rail');
  }
  function pitstand(g) {
    cube(g,concrete,0,.2,0,22,.4,9,'pit-slab');
    cube(g,plaster,0,2,-2.9,21,3.6,2.7,'pit-service-building');
    for(let x=-8;x<=8;x+=4) {
      cube(g,metal,x,2,3,.14,4,.14,'canopy-column');
      cube(g,glass,x,2.2,-1.48,2.7,1.6,.08,'pit-window');
    }
    cube(g,roof,0,4.2,0,23,.24,9,'pit-canopy');
    for(let row=0;row<3;row++) cube(g,wood,0,.65+row*.45,1-row,18,.16,.6,'viewing-bench');
    cube(g,metal,0,1.25,4.1,22,.12,.12,'spectator-safety-rail');
  }
  const total=Math.max(1,Number(track.totalLength)||1);
  // Validate against all course samples, including nearby switchbacks.
  const route=Array.from({length:256},(_,i)=>track.sampleTrack(total*i/256));
  const clearance = options.roadClearance || ((x,z)=>Math.min(...route.map(s=>Math.hypot(x-s.position.x,z-s.position.z)-(s.width||18)/2)));
  for(let i=0;i<12;i++) {
    const s=track.sampleTrack(total*(i+.35)/12), side=i%2?1:-1;
    const t=s.tangent, right=s.right||{x:-t.z,z:t.x};
    const offset=(s.width||18)/2+42+(i%3)*18;
    const x=s.position.x+right.x*offset*side,z=s.position.z+right.z*offset*side;
    if(clearance(x,z)<22) continue;
    const y=options.heightAt ? options.heightAt(x,z) : (options.groundY||0);
    if(!Number.isFinite(y)) continue;
    const g=new THREE.Group(); g.name=i%4===0?'roadside-pitstand':'country-farmhouse';
    g.position.set(x,y,z); g.rotation.y=Math.atan2(-right.x*side,-right.z*side);
    if(i%4===0) pitstand(g); else house(g,i); group.add(g);
  }
  let disposed=false;
  return {group,dispose(){if(disposed)return;disposed=true;group.removeFromParent(); for(const r of resources)r.dispose();resources.clear();group.clear();}};
}
