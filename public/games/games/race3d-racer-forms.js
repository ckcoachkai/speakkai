/** Original procedural racer sculptures. Local +Z forward, Y up, in race world units. */
const DESCRIPTORS = [
  ['cheese-swiss','Swiss cheese','cheese',2.3,1.5,3.2],
  ['cheese-cheddar','Cheddar wedge','cheese',2.3,1.6,3.2],
  ['cheese-brie','Brie wheel','cheese',2.7,1.1,2.7],
  ['cheese-blue','Blue cheese','cheese',2.4,1.55,3.1],
  ['cheese-gouda','Waxed Gouda','cheese',2.7,1.65,2.7],
  ['cheese-parmesan','Parmesan wedge','cheese',2.3,1.7,3.2],
  ['cheese-mozzarella','Mozzarella ball','cheese',2.4,2.1,2.5],
  ['cheese-feta','Feta cube','cheese',2.25,1.8,2.5],
  ['cheese-provolone','Provolone pear','cheese',2.1,2.8,2.2],
  ['cheese-leicester','Red Leicester','cheese',2.35,1.6,3.1],
  ['bear','Brown bear','animal',2.45,2.6,4.1],
  ['eagle','Bald eagle','animal',5.4,2.15,3.2],
  ['fox','Red fox','animal',1.9,2.1,4.4],
  ['rabbit','Rabbit','animal',1.8,2.85,3.1],
  ['x-wing','Crosswing starfighter','spacecraft',4.7,2.1,5.3],
  ['tie-fighter','Twin-panel interceptor','spacecraft',4.1,3.3,3.1],
  ['falcon','Disk freighter','spacecraft',4.7,1.65,5.0],
  ['snail','Garden snail','animal',2.3,2.6,3.8],
  ['monster-truck','Monster truck','truck',4.0,3.0,4.8],
];
export const RACER_FORM_TYPES = Object.freeze(DESCRIPTORS.map(d=>d[0]));
const ALIASES = {swiss:'cheese-swiss',cheddar:'cheese-cheddar',brie:'cheese-brie',camembert:'cheese-brie',blue:'cheese-blue',gouda:'cheese-gouda',parmesan:'cheese-parmesan',mozzarella:'cheese-mozzarella',feta:'cheese-feta',provolone:'cheese-provolone','red-leicester':'cheese-leicester',leicester:'cheese-leicester',xwing:'x-wing',tie:'tie-fighter','millennium-falcon':'falcon',monstertruck:'monster-truck'};
const descriptor = type => DESCRIPTORS.find(d=>d[0]===(ALIASES[type]||type));
export function getRacerFormMeta(type) {
  const d=descriptor(type); if(!d) return null;
  return {type:d[0],label:d[1],category:d[2],dimensions:{width:d[3],height:d[4],length:d[5]},forward:'+Z',slow:d[0]==='snail',speedClass:d[0]==='snail'?'slow':'normal',authored:true};
}

export function createRacerForm(THREE,type,options={}) {
  const meta=getRacerFormMeta(type);
  if(!meta) throw new RangeError(`Unknown racer form: ${type}`);
  type=meta.type;
  const group=new THREE.Group(); group.name=`racer-form-${type}`;
  const body=new THREE.Group(); body.name='animated-form-body';group.add(body);
  const geometries=new Set(),materials=new Set(),cache=new Map(),animations=[],wheelGroups=[];
  let disposed=false,time=0;
  const geo=(key,build)=>{if(!cache.has(key)){const g=build();geometries.add(g);cache.set(key,g);}return cache.get(key);};
  const mat=(color,roughness=.65,metalness=0,extra={})=>{const key=JSON.stringify([color,roughness,metalness,extra]);if(!cache.has(key)){const m=new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});materials.add(m);cache.set(key,m);}return cache.get(key);};
  const ellipsoid=geo('unit-sphere',()=>new THREE.SphereGeometry(1,24,16));
  const cube=geo('unit-box',()=>new THREE.BoxGeometry(1,1,1));
  const cylinder=geo('unit-cylinder',()=>new THREE.CylinderGeometry(1,1,1,32));
  const mesh=(g,m,p=[0,0,0],s=[1,1,1],parent=body,r=[0,0,0],name='')=>{const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const ball=(m,p,s,parent=body)=>mesh(Math.max(...s)<.18?geo('detail-sphere',()=>new THREE.SphereGeometry(1,10,7)):ellipsoid,m,p,s,parent);
  const box=(m,p,s,parent=body,r=[0,0,0])=>mesh(cube,m,p,s,parent,r);
  const cyl=(m,p,s,parent=body,r=[0,0,0])=>mesh(cylinder,m,p,s,parent,r);
  const ring=(m,p,radius,tube,parent=body,rot=[0,0,0])=>mesh(geo(`torus:${radius}:${tube}`,()=>new THREE.TorusGeometry(radius,tube,8,40)),m,p,[1,1,1],parent,rot);
  const pivot=(name,p,parent=body)=>{const o=new THREE.Group();o.name=name;o.position.set(...p);parent.add(o);return o;};
  const link=(m,a,b,r,parent=body)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.sub(av),o=cyl(m,av.addScaledVector(d,.5).toArray(),[r,d.length(),r],parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  const curve=(m,points,r,parent=body)=>mesh(geo(`curve:${r}:${JSON.stringify(points)}`,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(10,Math.min(128,points.length*5)),r,7,false)),m,[0,0,0],[1,1,1],parent);
  const black=mat('#131a1c',.5),eye=mat('#070b0c',.12),ivory=mat('#f4e7bc',.72);
  function eyes(parent,y,z,x=.34,size=.085){for(const s of [-1,1]){ball(eye,[s*x,y,z],[size,size,size*.7],parent);ball(mat('#ffffff',.1),[s*x-size*.22,y+size*.25,z+size*.62],[size*.23,size*.23,size*.15],parent);}}
  function wedge(material,height=1.3,holes=false){
    const shape=new THREE.Shape();shape.moveTo(-1.12,-1.45);shape.lineTo(1.12,-1.45);shape.quadraticCurveTo(1.05,-.8,.05,1.65);shape.quadraticCurveTo(-.1,1.7,-.2,1.48);shape.lineTo(-1.12,-1.45);
    if(holes)for(const [x,z,r] of [[-.52,-.88,.23],[.44,-.85,.29],[-.16,-.06,.25],[.11,.7,.15]]){const h=new THREE.Path();h.absarc(x,z,r,0,Math.PI*2,true);shape.holes.push(h);}
    return mesh(geo(`wedge:${height}:${holes}`,()=>new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:3,steps:1,curveSegments:28})),material,[0,height+.14,0],[1,1,1],body,[Math.PI/2,0,0]);
  }
  function rindBack(material,height=1.3){box(material,[0,height/2+.14,-1.43],[2.22,height,.085]);}
  function cheese(){
    if(type==='cheese-swiss'){
      wedge(mat('#efc841',.48),1.32,true);rindBack(mat('#d59823',.72),1.32);
      const dark=mat('#b78828',.9);for(const [x,z,r]of [[-.52,-.88,.23],[.44,-.85,.29],[-.16,-.06,.25],[.11,.7,.15]])cyl(dark,[x,.16,z],[r*.9,.015,r*.9]);
      // Side cavities are concave hemispheres, visibly recessed into the back rind.
      for(const [x,y,r]of [[-.62,.65,.2],[.18,.95,.25],[.69,.45,.15]])ball(dark,[x,y,-1.479],[r,r,.018]);
    }else if(type==='cheese-cheddar'||type==='cheese-leicester'||type==='cheese-parmesan'||type==='cheese-blue'){
      const blue=type==='cheese-blue',parmesan=type==='cheese-parmesan',red=type==='cheese-leicester';
      const h=parmesan?1.5:1.3;wedge(mat(blue?'#e3dfbf':parmesan?'#d4b65d':red?'#df6220':'#ef9c28',.7),h);rindBack(mat(blue?'#c9b89b':parmesan?'#9f7d35':red?'#a83d12':'#c87914',.9),h);
      if(blue){const vein=mat('#507d72',.95),veinDark=mat('#284c49',.9),sideX=z=>{const t=(-1.3+Math.sqrt(1.69+7.2*(z+1.45)))/3.6;return 1.12*(1-t)**2+2*1.05*t*(1-t)+.05*t*t;};for(let i=0;i<8;i++){const x=-.75+i*.19,z=-1.16+(i%3)*.38;curve(i%2?vein:veinDark,[[x,h+.195,z],[x+.09,h+.195,z+.16],[x-.035,h+.195,z+.31],[x+.02,h+.195,z+.5]],.007);if(i%2===0)curve(vein,[[x+.06,h+.195,z+.18],[x+.16,h+.195,z+.22],[x+.2,h+.195,z+.32]],.006);}for(let i=0;i<13;i++){const z=-1.2+i*.19,p=(zz,y)=>[sideX(zz)+.053,y,zz];curve(i%2?vein:veinDark,[p(z,.3),p(z+.06,.5),p(z+.01,.77),p(z+.1,1.1)],.009);}for(let i=0;i<24;i++){const z=-1.13+(i%8)*.31;ball(i%3?vein:veinDark,[sideX(z)+.054,.35+Math.floor(i/8)*.32,z],[.016,.035+(i%3)*.013,.03+(i%4)*.01]);}for(let i=0;i<10;i++)ball(vein,[-.95+i*.2,.42+(i%3)*.3,-1.48],[.04,.09,.012]);}
      else {const fleck=mat(parmesan?'#f4dfa1':red?'#ed8f37':'#ffc967',.85);for(let i=0;i<22;i++){const z=-1.2+(i%7)*.32,x=(Math.sin(i*7.2)*.72)*(1-(z+1.2)/3.5);ball(fleck,[x,h+.2,z],[parmesan?.025:.017,.008,.025]);}if(parmesan)for(let i=0;i<10;i++)box(mat('#705a2d',1),[-.94+i*.21,.84,-1.49],[.009,.92,.008]);}
    }else if(type==='cheese-brie'){
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.absarc(0,0,1.3,.35,Math.PI*2-.35,false);shape.lineTo(0,0);
      const g=geo('brie-cut-wheel',()=>new THREE.ExtrudeGeometry(shape,{depth:.88,bevelEnabled:true,bevelThickness:.06,bevelSize:.045,bevelSegments:3,curveSegments:48}));
      mesh(g,mat('#eee8d4',.96),[0,1.03,0],[1,1,1],body,[Math.PI/2,0,Math.PI/2]);
      // Exposed creamy cut faces contrast with the bloomy outer rind.
      const cream=mat('#f0d98a',.42);for(const s of [-1,1])box(cream,[s*.205,.57,.61],[.016,.72,1.25],body,[0,s*.35,0]);
      const rind=mat('#fffbed',.98);for(let i=0;i<36;i++){const a=i*Math.PI*2/36;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.4)continue;ball(rind,[Math.sin(a)*1.25,1.025,Math.cos(a)*1.25],[.085,.02,.065]);}
    }else if(type==='cheese-gouda'){
      cyl(mat('#b63124',.33),[0,.77,0],[1.3,1.28,1.3]);cyl(mat('#edbd48',.57),[0,1.43,0],[1.21,.05,1.21]);ring(mat('#dc4934',.3),[0,1.43,0],1.24,.06,body,[Math.PI/2,0,0]);
      for(let i=0;i<8;i++){const a=i*2.4,r=.3+(i%3)*.25;ball(mat('#c18c2b',.8),[Math.cos(a)*r,1.462,Math.sin(a)*r],[.09,.009,.055]);}
      box(mat('#e6c16d',.85),[0,.82,1.304],[.7,.42,.014]);for(let i=-1;i<=1;i++)box(mat('#8d471c',1),[i*.15,.83,1.316],[.018,.25,.008]);
    }else if(type==='cheese-mozzarella'){
      const white=mat('#fff6df',.28);ball(white,[0,1.11,0],[1.13,.96,1.16]);ball(white,[.06,1.98,-.06],[.3,.13,.3]);
      const folds=mat('#e4d9c0',.56);for(let i=0;i<5;i++)curve(folds,[[-.4+i*.18,1.84,.42],[-.34+i*.16,1.93,.13],[-.18+i*.1,2,-.03]],.013);
      const basil=mat('#398444',.72);for(const s of [-1,1])ball(basil,[s*.7,.22,.75],[.35,.04,.55]).rotation.y=s*.7;
    }else if(type==='cheese-feta'){
      const white=mat('#f2eee0',.95);const shape=new THREE.Shape();shape.moveTo(-1,-1);shape.lineTo(1,-1);shape.lineTo(1,1);shape.lineTo(-1,1);shape.closePath();mesh(geo('feta-rounded-cube',()=>new THREE.ExtrudeGeometry(shape,{depth:1.6,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:4})),white,[0,1.78,0],[1,1,1],body,[Math.PI/2,0,0]);
      const pore=mat('#cecabb',1);for(let i=0;i<38;i++){const x=Math.sin(i*11.2)*.89,z=Math.cos(i*7.3)*.88;ball(pore,[x,1.875,z],[.025+(i%3)*.012,.006,.028]);}for(let i=0;i<20;i++)ball(pore,[Math.sin(i*8)*.9,.35+(i%5)*.28,1.095],[.035,.025,.007]);
    }else if(type==='cheese-provolone'){
      const points=[[.01,0],[.63,.08],[.98,.45],[1.02,.95],[.77,1.48],[.39,1.88],[.27,2.2],[.34,2.35],[.3,2.48],[.02,2.52]].map(p=>new THREE.Vector2(...p));
      mesh(geo('pear-cheese',()=>new THREE.LatheGeometry(points,40)),mat('#d9b961',.56),[0,.16,0]);
      const twine=mat('#a58c5a',.92);ring(twine,[0,2.48,0],.3,.025,body,[Math.PI/2,0,0]);curve(twine,[[-.24,2.5,0],[-.28,2.75,.02],[.24,2.75,.02],[.24,2.5,0]],.022);
    }
  }
  function bear(){
    const fur=mat('#77452c',.98),light=mat('#a97145',.95),muzzle=mat('#bd9970',.94),claw=mat('#d0bda0',.6);
    ball(fur,[0,1.45,-.3],[.95,.92,1.42]);ball(fur,[0,1.95,1.05],[.82,.75,.74]);ball(light,[0,1.5,1.55],[.54,.38,.46]);ball(black,[0,1.65,1.92],[.27,.17,.14]);
    for(const s of [-1,1]){ball(fur,[s*.59,2.5,.98],[.28,.3,.23]);ball(muzzle,[s*.59,2.51,1.15],[.17,.18,.06]);}eyes(body,2.13,1.66,.37,.088);ball(fur,[0,1.42,-1.67],[.25,.22,.26]);
    for(const s of [-1,1])for(const z of [-1.05,1.02]){const p=pivot('bear-leg',[s*.67,1.25,z]);ball(fur,[0,-.43,0],[.32,.64,.37],p);ball(fur,[0,-.92,.14],[.36,.22,.5],p);for(let i=-1;i<=1;i++)ball(claw,[i*.16,-.95,.55],[.045,.06,.13],p);animations.push((t,v)=>p.rotation.x=Math.sin(t*8+z*1.3+s)*.28*v);}
    for(let i=0;i<11;i++)ball(light,[Math.sin(i*3)*.64,1.96+Math.cos(i)*.17,-.42+i*.12],[.1,.04,.12]);
  }
  function eagle(){
    const brown=mat('#49372d',.9),feather=mat('#6c5240',.88),white=mat('#f1eee0',.88),gold=mat('#c58a20',.58);
    ball(brown,[0,1.18,0],[.59,.67,1.03]);ball(white,[0,1.72,.89],[.45,.47,.56]);eyes(body,1.85,1.32,.25,.07);
    const beak=geo('eagle-beak',()=>new THREE.ConeGeometry(.18,.53,12));mesh(beak,gold,[0,1.62,1.5],[1,1,1],body,[Math.PI/2,0,0]);ball(gold,[0,1.49,1.65],[.1,.17,.12]);
    for(const s of [-1,1]){const p=pivot('eagle-wing',[s*.4,1.35,.1]);ball(brown,[s*.72,0,-.1],[1.05,.16,.61],p);for(let i=0;i<8;i++){const f=ball(i%2?brown:feather,[s*(.85+i*.17),-.015,-.25-i*.09],[.22,.09,.68-i*.025],p);f.rotation.y=s*(-.2+i*.045);}animations.push((t,v)=>p.rotation.z=s*(.08+Math.sin(t*(4+v*3))*.2));
      link(gold,[s*.27,.8,.32],[s*.28,.36,.58],.06);for(let k=-1;k<=1;k++)curve(gold,[[s*.28,.36,.58],[s*.28+k*.12,.25,.76],[s*.28+k*.13,.22,.95]],.035);
    }for(let i=-2;i<=2;i++){const tail=ball(white,[i*.15,1.1,-1.18],[.16,.08,.55]);tail.rotation.y=-i*.12;}
  }
  function fox(){
    const orange=mat('#b65c29',.93),cream=mat('#eee0b9',.92),dark=mat('#40342c',.95);
    ball(orange,[0,1.09,-.1],[.55,.58,1.15]);ball(orange,[0,1.64,.9],[.54,.52,.62]);ball(cream,[0,1.42,1.32],[.38,.25,.44]);ball(black,[0,1.46,1.72],[.13,.1,.1]);eyes(body,1.75,1.39,.28,.065);
    for(const s of [-1,1]){mesh(geo('fox-ear',()=>new THREE.ConeGeometry(.25,.64,3)),orange,[s*.36,2.15,.85],[1,1,.6],body,[0,s*.1,s*-.17]);mesh(geo('fox-inner-ear',()=>new THREE.ConeGeometry(.14,.38,3)),cream,[s*.36,2.16,.96],[1,1,.3]);for(const z of [-.85,.72]){const p=pivot('fox-leg',[s*.36,1,z]);ball(orange,[0,-.3,0],[.14,.42,.16],p);ball(dark,[0,-.7,.08],[.16,.22,.23],p);animations.push((t,v)=>p.rotation.x=Math.sin(t*11+z*3+s)*.36*v);}}
    const tail=pivot('fox-tail',[0,1.15,-.98]);ball(orange,[.2,.1,-.65],[.35,.33,.88],tail);ball(cream,[.22,.15,-1.33],[.27,.27,.39],tail);animations.push(t=>tail.rotation.y=Math.sin(t*3)*.13);
  }
  function rabbit(){
    const fur=mat('#c5b9a3',.92),cream=mat('#eee7d8',.95),pink=mat('#c78d8b',.83);
    ball(fur,[0,.9,-.26],[.67,.75,1.05]);ball(cream,[0,1.43,.7],[.53,.53,.57]);for(const s of [-1,1]){const e=pivot('rabbit-ear',[s*.28,1.85,.53]);ball(fur,[0,.46,0],[.18,.65,.17],e);ball(pink,[0,.48,.13],[.085,.47,.045],e);e.rotation.z=s*-.17;animations.push(t=>e.rotation.x=Math.sin(t*3+s)*.06);ball(fur,[s*.46,.42,-.65],[.28,.41,.5]);ball(cream,[s*.42,.2,.77],[.22,.18,.45]);}ball(cream,[0,.98,-1.34],[.32,.29,.28]);eyes(body,1.59,1.16,.3,.085);ball(pink,[0,1.4,1.25],[.1,.07,.06]);
    for(const s of [-1,1])for(let i=-1;i<=1;i++)curve(mat('#77746c',1),[[s*.15,1.37,1.21],[s*.45,1.38+i*.04,1.23],[s*.71,1.39+i*.08,1.19]],.007);
    animations.push((t,v)=>{body.position.y=Math.abs(Math.sin(t*7))*.18*v;body.rotation.x=Math.sin(t*7)*.04*v;});
  }
  function snail(){
    const skin=mat('#ac9b65',.82),shell=mat('#9e5c2d',.48),stripe=mat('#e0af6b',.59),dark=mat('#5c351c',.7);
    ball(skin,[0,.31,.1],[.85,.3,1.7]);ball(skin,[0,.64,1.36],[.47,.64,.54]);ball(shell,[0,1.28,-.23],[.99,1.06,.82]);
    // Visible spiral relief on both sides of a volumetric shell.
    for(const s of [-1,1]){const pts=[];for(let i=0;i<=90;i++){const a=i/90*Math.PI*4.6,r=.07+.91*i/90;pts.push([s*(.99*Math.sqrt(1-(r/1.06)**2)+.018),1.28+Math.sin(a)*r,-.23+Math.cos(a)*r*.7736]);}curve(stripe,pts,.035);const edge=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;edge.push([s*.37,1.28+Math.sin(a)*.99,-.23+Math.cos(a)*.766]);}curve(dark,edge,.028);}
    for(const s of [-1,1]){const a=pivot('snail-eye-stalk',[s*.24,.95,1.5]);curve(skin,[[0,0,0],[s*.08,.38,.09],[s*.14,.7,.11]],.064,a);ball(skin,[s*.14,.7,.11],[.12,.13,.12],a);ball(eye,[s*.14,.72,.21],[.061,.07,.035],a);animations.push(t=>a.rotation.z=s*.06+Math.sin(t*1.7+s)*.065);curve(skin,[[s*.33,.65,1.69],[s*.55,.78,1.85],[s*.63,.8,1.89]],.04);}
    curve(dark,[[-.15,.65,1.85],[0,.6,1.9],[.15,.65,1.85]],.018);
    for(let i=0;i<13;i++)ball(mat('#d1bc80',.84),[Math.sin(i*8)*.65,.48,-1.15+i*.19],[.07,.022,.045]);animations.push(t=>body.scale.z=1+Math.sin(t*1.7)*.025);
  }
  function craft(){
    const hull=mat('#c8c9bd',.48,.48),panel=mat('#737d82',.57,.56),dark=mat('#202b35',.6,.6),red=mat('#9e3931',.55,.25),glass=mat('#173b4d',.17,.65),glow=mat('#74dcff',.24,0,{emissive:'#34b8ff',emissiveIntensity:2.4});
    const thrusters=[];
    const nozzle=(p,r=.2)=>{cyl(dark,p,[r,.34,r],body,[Math.PI/2,0,0]);const o=ball(glow,[p[0],p[1],p[2]-.2],[r*.76,r*.76,.17]);thrusters.push(o);};
    if(type==='x-wing'){
      ball(hull,[0,.88,.05],[.36,.28,2.25]);box(hull,[0,.8,1.66],[.31,.24,1.44]);ball(glass,[0,1.13,.36],[.24,.16,.68]);box(red,[0,1.005,1.62],[.11,.018,1.3]);
      for(const s of [-1,1])for(const up of [-1,1]){const wing=pivot('crosswing-sfoil',[s*.25,.9,-.6]);wing.rotation.z=s*up*.23;box(hull,[s*.95,0,-.14],[1.9,.1,.63],wing);box(red,[s*1.36,.059,-.14],[.3,.015,.63],wing);cyl(hull,[s*1.16,.04,-.5],[.2,1.05,.2],wing,[Math.PI/2,0,0]);cyl(dark,[s*2.03,0,.23],[.058,2.1,.058],wing,[Math.PI/2,0,0]);cyl(hull,[s*2.03,0,1.38],[.038,.34,.038],wing,[Math.PI/2,0,0]);const o=ball(glow,[s*1.16,.04,-1.07],[.14,.14,.09],wing);thrusters.push(o);}
      for(let i=0;i<7;i++)box(panel,[0,.945,-1.2+i*.16],[.48,.025,.035]);
    }else if(type==='tie-fighter'){
      ball(hull,[0,1.6,0],[.72,.72,.72]);ball(glass,[0,1.6,.65],[.48,.48,.13]);ring(panel,[0,1.6,.76],.48,.055);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;link(panel,[0,1.6,.8],[Math.sin(a)*.46,1.6+Math.cos(a)*.46,.79],.024);}
      for(const s of [-1,1]){cyl(panel,[s*1.08,1.6,0],[.13,1.1,.13],body,[0,0,Math.PI/2]);const points=[];for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;points.push(new THREE.Vector2(Math.cos(a)*1.6,Math.sin(a)*1.6));}const shape=new THREE.Shape(points);mesh(geo('interceptor-panel',()=>new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:false})),dark,[s*1.77,1.6,0],[1,1,1],body,[0,Math.PI/2,0]);for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3,b=a+Math.PI/3;link(hull,[s*1.84,1.6+Math.sin(a)*1.6,Math.cos(a)*1.6],[s*1.84,1.6+Math.sin(b)*1.6,Math.cos(b)*1.6],.055);link(panel,[s*1.85,1.6,0],[s*1.85,1.6+Math.sin(a)*1.6,Math.cos(a)*1.6],.028);}nozzle([s*.32,1.6,-.65],.14);}
    }else{
      cyl(hull,[0,.74,-.24],[2.08,.48,2.08]);ball(hull,[0,.86,-.26],[1.8,.4,1.75]);cyl(panel,[0,1.15,-.15],[.61,.16,.61]);ring(dark,[0,1.26,-.15],.38,.045,body,[Math.PI/2,0,0]);
      // Split forward mandibles and offset glazed cockpit establish the freighter silhouette.
      for(const s of [-1,1]){box(hull,[s*.69,.76,1.42],[.7,.39,2.05],body,[0,s*.11,0]);box(panel,[s*.66,.98,1.48],[.15,.025,1.88],body,[0,s*.11,0]);}
      link(hull,[1.43,.84,.48],[2.08,.84,1.41],.27);ball(glass,[2.08,.85,1.48],[.29,.24,.48]);ring(panel,[2.08,.85,1.65],.26,.035);
      for(let i=0;i<6;i++){cyl(dark,[-1.12+i*.42,1.11,-1.23],[.16,.035,.16]);ring(panel,[-1.12+i*.42,1.14,-1.23],.17,.025,body,[Math.PI/2,0,0]);}
      for(let i=0;i<14;i++){const a=i/14*Math.PI*2;box(i%3?panel:red,[Math.sin(a)*1.5,1.05,Math.cos(a)*1.5-.25],[.22,.018,.12],body,[0,a,0]);}
      for(let i=-3;i<=3;i++)nozzle([i*.34,.74,-2.12+Math.abs(i)*.055],.14);
      const dish=pivot('freighter-dish',[-.83,1.12,-.26]);cyl(hull,[0,.25,0],[.05,.5,.05],dish);mesh(geo('dish',()=>new THREE.SphereGeometry(.4,24,12,0,Math.PI*2,0,.9)),panel,[0,.5,0],[1,.5,1],dish,[.5,0,.2]);
    }
    animations.push((t,v)=>{body.position.y=.13+Math.sin(t*2.5)*.055;body.rotation.z=Math.sin(t*1.9)*.025;for(let i=0;i<thrusters.length;i++){const k=1+Math.sin(t*22+i)*.13+v*.2;thrusters[i].scale.z=(type==='x-wing'?.09:.17)*k;}});
  }
  function monsterTruck(){
    const paint=mat(options.color||'#bc342f',.31,.36),steel=mat('#869295',.4,.8),rubber=mat('#16191c',.94),tread=mat('#292d2e',.96),glass=mat('#244452',.18,.55),spring=mat('#e6c043',.42,.55);
    box(black,[0,1.21,0],[1.55,.32,3.5]);box(paint,[0,1.95,.05],[1.83,.62,3.76]);box(paint,[0,2.46,-.32],[1.65,.7,1.83]);box(glass,[0,2.5,.61],[1.42,.45,.03],body,[-.17,0,0]);for(const s of [-1,1]){box(glass,[s*.835,2.49,-.3],[.025,.43,1.25]);box(steel,[s*.89,1.71,.05],[.12,.12,3.8]);}
    box(paint,[0,2.12,1.66],[1.86,.11,.55]);box(steel,[0,1.62,2.02],[2.1,.18,.16]);box(black,[0,1.94,1.96],[1.2,.3,.035]);for(let i=-3;i<=3;i++)box(steel,[i*.15,1.94,1.985],[.045,.26,.012]);for(const s of [-1,1])box(ivory,[s*.73,2.01,1.98],[.24,.22,.04]);
    for(const z of [-1.4,1.4]){link(steel,[-1.5,.93,z],[1.5,.93,z],.11);for(const s of [-1,1]){const p=pivot('monster-wheel',[s*1.46,.94,z]);p.userData.radius=.9;p.userData.side=s;p.userData.front=z>0;wheelGroups.push(p);cyl(rubber,[0,0,0],[.9,.63,.9],p,[0,0,Math.PI/2]);for(const edge of [-1,1]){cyl(steel,[edge*.325,0,0],[.42,.03,.42],p,[0,0,Math.PI/2]);cyl(black,[edge*.35,0,0],[.16,.04,.16],p,[0,0,Math.PI/2]);for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(steel,[edge*.38,Math.sin(a)*.27,Math.cos(a)*.27],[.035,.035,.035],p);}}for(let i=0;i<20;i++){const a=i*Math.PI/10;for(const half of [-1,1])box(tread,[half*.17,Math.sin(a)*.89,Math.cos(a)*.89],[.31,.16,.15],p,[-a,half*.28,0]);}
      link(steel,[s*.58,1.4,z],[s*1.29,.94,z],.07);const points=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*12;points.push([s*1.01+Math.cos(a)*.09,.93+i/40*.7,z+Math.sin(a)*.09]);}curve(spring,points,.025);}}
    box(black,[0,2.78,-.2],[1.4,.07,1.3]);for(let i=-2;i<=2;i++)ball(ivory,[i*.25,2.91,.47],[.095,.09,.07]);
    animations.push((t,v,dt,state)=>{for(const p of wheelGroups)p.rotation.x+=(Number.isFinite(state.speed)?state.speed:v*15)*dt/.9;body.position.y=Math.sin(t*12)*.035*v;body.rotation.z=Math.sin(t*7)*.022*v;});
  }
  if(type.startsWith('cheese-'))cheese();else if(type==='bear')bear();else if(type==='eagle')eagle();else if(type==='fox')fox();else if(type==='rabbit')rabbit();else if(type==='snail')snail();else if(type==='monster-truck')monsterTruck();else craft();

  // Batch every rigid material set, preserving all named animation pivots.
  function batch(parent){
    for(const child of [...parent.children])if(child.isGroup)batch(child);
    const sets=new Map();for(const child of parent.children)if(child.isMesh&&!Array.isArray(child.material)){if(!sets.has(child.material))sets.set(child.material,[]);sets.get(child.material).push(child);}
    for(const [material,parts]of sets){if(parts.length<2)continue;const positions=[],normals=[],indices=[];let offset=0;for(const part of parts){part.updateMatrix();const g=part.geometry,p=g.attributes.position,n=g.attributes.normal,nm=new THREE.Matrix3().getNormalMatrix(part.matrix),v=new THREE.Vector3(),nv=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(part.matrix);positions.push(v.x,v.y,v.z);if(n)nv.fromBufferAttribute(n,i).applyNormalMatrix(nm);else nv.set(0,1,0);normals.push(nv.x,nv.y,nv.z);}if(g.index)for(let i=0;i<g.index.count;i++)indices.push(g.index.getX(i)+offset);else for(let i=0;i<p.count;i++)indices.push(i+offset);offset+=p.count;parent.remove(part);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);g.computeBoundingSphere();geometries.add(g);mesh(g,material,[0,0,0],[1,1,1],parent,[0,0,0],'batched-form-detail');}
  }
  // Thruster meshes carry changing scale and must remain independently animated.
  // Their glow material appears only once per rigid group, except freighter exhaust.
  // Marking them as pivots before batching preserves their visible pulse.
  const pulsing=[];body.traverse(o=>{if(o.isMesh&&o.material.emissiveIntensity>1)pulsing.push(o);});
  for(const o of pulsing){const holder=new THREE.Group();holder.name='thruster-pulse';holder.position.copy(o.position);o.position.set(0,0,0);o.parent.add(holder);holder.add(o);}
  batch(body);
  const box3=new THREE.Box3().setFromObject(group),groundOffset=Math.max(0,-box3.min.y);
  body.position.y=groundOffset;box3.setFromObject(group);const size=box3.getSize(new THREE.Vector3());
  const dimensions={width:size.x,height:size.y,length:size.z,minY:box3.min.y};
  let draws=0,triangles=0;group.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  meta.drawCalls=draws;meta.triangles=triangles;meta.dimensions=dimensions;
  group.userData.racerForm=meta;
  return {group,meta,dimensions,wheelGroups,
    update(dt=0,state={}){if(disposed)return;dt=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));time+=dt;body.position.y=0;const speed=Number.isFinite(state.speed)?Math.abs(state.speed):Number.isFinite(state.velocity)?Math.abs(state.velocity):10;const v=Math.min(1,speed/20);for(const animation of animations)animation(time,v,dt,state);body.position.y+=groundOffset;},
    dispose(){if(disposed)return;disposed=true;for(const g of geometries)g.dispose();for(const m of materials)m.dispose();geometries.clear();materials.clear();cache.clear();group.removeFromParent();group.clear();},
  };
}
