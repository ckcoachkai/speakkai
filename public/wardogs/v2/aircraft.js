import * as THREE from './three.module.js';

// Dimensions are metres; performance values are SI. Training masses represent
// a typical loaded aircraft, rather than empty or maximum certificated mass.
export const AIRCRAFT = [
  {id:'h125',name:'Airbus H125',role:'Light utility helicopter',kind:'heli',mass:1950,rotorRadius:5.345,length:10.93,wingspan:10.69,gearHeight:1.6,maxSpeed:79,cruiseSpeed:65,hoverPower:.57,weapon:false,description:'Agile single-engine helicopter · skids · three-blade rotor'},
  {id:'uh60',name:'UH-60 Black Hawk',role:'Medium utility helicopter',kind:'heli',mass:7800,rotorRadius:8.18,length:15.26,wingspan:16.36,gearHeight:1.65,maxSpeed:82,cruiseSpeed:72,hoverPower:.59,weapon:true,description:'Twin-engine utility · four-blade rotor · wheeled gear'},
  {id:'ah64',name:'AH-64 Apache',role:'Attack helicopter',kind:'heli',mass:6838,rotorRadius:7.3,length:14.7,wingspan:14.6,gearHeight:1.7,maxSpeed:78,cruiseSpeed:66,hoverPower:.61,weapon:true,description:'Tandem cockpit · mast radar · rocket pods and chain gun'},
  {id:'mh6',name:'AH-6 Little Bird',role:'Light attack helicopter',kind:'heli',mass:1400,rotorRadius:4.15,length:9.80,wingspan:8.30,gearHeight:1.20,maxSpeed:78,cruiseSpeed:65,hoverPower:.57,weapon:true,description:'Framed bubble canopy · five-blade rotor · light weapon outriggers'},
  {id:'ch47',name:'CH-47 Chinook',role:'Heavy transport helicopter',kind:'heli',mass:18000,rotorRadius:9.145,length:15.46,wingspan:18.29,gearHeight:2.1,maxSpeed:84,cruiseSpeed:75,hoverPower:.63,weapon:false,description:'Two counter-rotating three-blade rotors · rear cargo ramp'},
  {id:'c172',name:'Cessna 172 Skyhawk',role:'Piston trainer',kind:'prop',mass:1050,length:8.28,wingspan:11,gearHeight:1.35,maxSpeed:70,cruiseSpeed:58,stallSpeed:24,wingArea:16.2,maxThrust:2200,weapon:false,description:'High-wing trainer · fixed landing gear · analog flight deck'},
  {id:'kingair',name:'Beechcraft King Air 350',role:'Twin turboprop',kind:'prop',mass:6100,length:14.22,wingspan:17.65,gearHeight:1.9,maxSpeed:161,cruiseSpeed:145,stallSpeed:46,wingArea:28.8,maxThrust:18000,weapon:false,description:'Twin turboprops · T-tail · retractable landing gear'},
  {id:'a320',name:'Airbus A320',role:'Commercial airliner',kind:'airliner',mass:64000,length:37.57,wingspan:35.8,gearHeight:3.8,maxSpeed:255,cruiseSpeed:230,stallSpeed:65,wingArea:122.6,maxThrust:240000,weapon:false,description:'Twin turbofans · sharklets · six-screen flight deck'},
  {id:'f16',name:'F-16 Fighting Falcon',role:'Multirole fighter',kind:'jet',mass:11000,length:15.06,wingspan:9.96,gearHeight:2,maxSpeed:580,cruiseSpeed:260,stallSpeed:67,wingArea:27.87,maxThrust:129000,weapon:true,description:'Single engine · bubble canopy · swept wing · afterburner'},
  {id:'f22',name:'F-22 Raptor',role:'Air superiority fighter',kind:'jet',mass:25000,length:18.9,wingspan:13.56,gearHeight:2,maxSpeed:630,cruiseSpeed:320,stallSpeed:72,wingArea:78,maxThrust:310000,weapon:true,description:'Twin engines · trapezoidal wings · canted fins · glass cockpit'},
].map(d=>({...d,type:d.kind}));

const UP=new THREE.Vector3(0,1,0), TAU=Math.PI*2;

// An elliptical/superelliptical ring loft gives every fuselage its own profile.
function loftGeometry(rings,segments=28) {
  const p=[],uv=[],idx=[];
  for(let k=0;k<rings.length;k++){
    const [z,y,w,h,exponent=1]=rings[k];
    for(let j=0;j<=segments;j++){
      const a=j/segments*TAU, c=Math.cos(a),s=Math.sin(a);
      p.push(Math.sign(c)*Math.pow(Math.abs(c),exponent)*w,y+Math.sign(s)*Math.pow(Math.abs(s),exponent)*h,z);
      uv.push(j/segments,k/(rings.length-1));
      if(k<rings.length-1&&j<segments){ const i=k*(segments+1)+j;idx.push(i,i+1,i+segments+1,i+1,i+segments+2,i+segments+1); }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

// Prism faces may form horizontal wings or vertical stabilizers. Points are 3D.
function plateGeometry(points,thickness=.09,axis='y') {
  const a=axis==='y'?1:0, contour=points.map(p=>new THREE.Vector2(p[axis==='y'?0:2],p[axis==='y'?2:1]));
  const triangles=THREE.ShapeUtils.triangulateShape(contour,[]), p=[],idx=[];
  for(const side of [-1,1])for(const q of points){const v=q.slice();v[a]+=side*thickness*.5;p.push(...v);}
  const n=points.length;
  for(const t of triangles){idx.push(t[0],t[1],t[2],t[2]+n,t[1]+n,t[0]+n);}
  const clockwise=THREE.ShapeUtils.area(contour)<0;
  for(let i=0;i<n;i++){const j=(i+1)%n;if(clockwise)idx.push(i,j,j+n,i,j+n,i+n);else idx.push(i,j+n,j,i,i+n,j+n);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}

// Consolidate static meshes by material. Moving rotor/prop/gear groups are kept.
function batchStatic(root){
  root.updateMatrixWorld(true);const batches=new Map(),remove=[];
  root.traverse(o=>{if(!o.isMesh||o.userData.dynamic)return;let p=o.parent;while(p&&p!==root){if(p.userData.dynamic)return;p=p.parent;}if(Array.isArray(o.material))return;
    const list=batches.get(o.material)||[];const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);list.push(g);batches.set(o.material,list);remove.push(o);
  });
  for(const [mat,gs]of batches){const p=[],n=[],uv=[];for(const g of gs){p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);if(g.attributes.uv)uv.push(...g.attributes.uv.array);else for(let i=0;i<g.attributes.position.count;i++)uv.push(0,0);g.dispose();}
    const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geom.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const m=new THREE.Mesh(geom,mat);m.castShadow=true;m.receiveShadow=true;root.add(m);
  }
  for(const o of remove){o.removeFromParent();o.geometry.dispose();}
}

function makePanelTexture(style){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=384;
  const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  function draw(state={}){
    const {power=.6,altitude=0,speed=0,heading=0,pitch=0,roll=0,verticalSpeed=0}=state;
    ctx.fillStyle='#151b20';ctx.fillRect(0,0,1024,384);
    ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle='#d5dfe0';ctx.fillText(style==='analog'?'CESSNA / FLIGHT INSTRUMENTS':style==='airliner'?'FLIGHT DECK · PRIMARY DISPLAYS':'FLIGHT / NAVIGATION',512,23);
    function dial(x,y,r,label,value,unit,max){
      ctx.fillStyle='#080d10';ctx.beginPath();ctx.arc(x,y,r+5,0,TAU);ctx.fill();ctx.strokeStyle='#626c71';ctx.lineWidth=3;ctx.stroke();
      ctx.save();ctx.translate(x,y);ctx.strokeStyle='#dbe5e7';ctx.lineWidth=2;
      for(let i=0;i<=40;i++){const a=-Math.PI*.75+i/40*Math.PI*1.5;ctx.beginPath();ctx.moveTo(Math.sin(a)*(r-5),-Math.cos(a)*(r-5));ctx.lineTo(Math.sin(a)*(r-(i%5===0?16:10)),-Math.cos(a)*(r-(i%5===0?16:10)));ctx.stroke();}
      ctx.font='11px monospace';ctx.fillStyle='#c5d6da';ctx.fillText(label,0,-r*.23);ctx.fillText(unit,0,r*.48);ctx.font='bold 17px monospace';ctx.fillText(Math.round(value).toString(),0,r*.24);
      const a=-Math.PI*.75+THREE.MathUtils.clamp(value/max,0,1)*Math.PI*1.5;ctx.strokeStyle='#ffdf91';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-Math.sin(a)*12,Math.cos(a)*12);ctx.lineTo(Math.sin(a)*(r-20),-Math.cos(a)*(r-20));ctx.stroke();ctx.restore();
    }
    function horizon(x,y,w,h){
      ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.translate(x+w/2,y+h/2);ctx.rotate(-roll);
      const py=pitch*125;ctx.fillStyle='#268bb1';ctx.fillRect(-400,-400+py,800,400);ctx.fillStyle='#856541';ctx.fillRect(-400,py,800,400);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-400,py);ctx.lineTo(400,py);ctx.stroke();
      ctx.font='12px monospace';ctx.textAlign='left';for(let a=-30;a<=30;a+=10){if(a===0)continue;const yy=py-a*3;ctx.beginPath();ctx.moveTo(-35,yy);ctx.lineTo(35,yy);ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(Math.abs(a).toString(),45,yy+4);}
      ctx.restore();ctx.strokeStyle='#f9db58';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+w/2-45,y+h/2);ctx.lineTo(x+w/2-15,y+h/2);ctx.lineTo(x+w/2-15,y+h/2+7);ctx.moveTo(x+w/2+45,y+h/2);ctx.lineTo(x+w/2+15,y+h/2);ctx.lineTo(x+w/2+15,y+h/2+7);ctx.stroke();
    }
    const kt=Math.max(0,speed)*1.94384,ft=Math.max(0,altitude)*3.28084;
    if(style==='analog'){
      dial(103,132,79,'AIRSPEED',kt,'KNOTS',160);horizon(223,52,178,157);dial(518,132,79,'ALTITUDE',ft,'FT',10000);
      dial(103,307,57,'TURN',Math.abs(roll)*40,'BANK',30);dial(310,304,59,'HEADING',heading,'DEG',360);dial(518,307,57,'V/S',Math.abs(verticalSpeed)*196.85,'FPM',2000);
      ctx.fillStyle='#050e0e';ctx.fillRect(633,57,358,238);ctx.strokeStyle='#719892';ctx.strokeRect(633,57,358,238);
      ctx.font='bold 22px monospace';ctx.textAlign='left';ctx.fillStyle='#78d9bf';ctx.fillText('NAV  SHA / CITY',652,91);ctx.fillText(`COM  118.000`,652,143);ctx.fillText(`XPDR 1200   ALT`,652,183);ctx.fillText(`RPM  ${Math.round(power*2400)}`,652,233);ctx.fillText('FUEL  L |||||| R',652,270);
    }else{
      ctx.fillStyle='#060b0d';ctx.fillRect(30,42,302,308);ctx.fillRect(362,42,302,308);ctx.fillRect(695,42,299,308);
      horizon(63,72,239,204);ctx.fillStyle='#f2ffff';ctx.font='bold 21px monospace';ctx.textAlign='left';ctx.fillText(Math.round(kt).toString().padStart(3,'0'),36,181);ctx.fillText(Math.round(ft).toString().padStart(4,'0'),249,181);
      ctx.font='15px monospace';ctx.fillStyle='#62e6ac';ctx.fillText(`HDG ${Math.round(heading).toString().padStart(3,'0')}`,88,323);ctx.fillText(`V/S ${Math.round(verticalSpeed*196.85)}`,216,323);
      ctx.save();ctx.beginPath();ctx.rect(375,55,275,278);ctx.clip();ctx.translate(513,254);ctx.rotate(-heading*Math.PI/180);ctx.strokeStyle='#365c55';ctx.lineWidth=1;
      for(let r=50;r<270;r+=50){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();}for(let a=0;a<360;a+=30){ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-220);ctx.stroke();}ctx.strokeStyle='#46dfa1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-95,99);ctx.lineTo(-72,34);ctx.lineTo(25,-43);ctx.lineTo(67,-139);ctx.stroke();ctx.restore();
      ctx.fillStyle='#ecfff6';ctx.font='16px monospace';ctx.textAlign='center';ctx.fillText('SHA · NAV',513,71);ctx.fillStyle='#e9faac';ctx.beginPath();ctx.moveTo(513,230);ctx.lineTo(501,257);ctx.lineTo(525,257);ctx.closePath();ctx.fill();
      ctx.fillStyle='#c6d7d8';ctx.font='14px monospace';ctx.fillText(style==='airliner'?'ENGINE / ECAM':'ENGINE / SYSTEMS',844,69);
      dial(774,159,52,style==='airliner'?'N1':'TORQUE',power*100,'%',110);dial(913,159,52,'NR',power>0?100:0,'%',110);
      ctx.font='16px monospace';ctx.textAlign='left';ctx.fillStyle='#78e3b9';ctx.fillText(`PWR  ${Math.round(power*100)} %`,735,253);ctx.fillText('OIL  58  PSI',735,281);ctx.fillText('FUEL  ███████',735,308);
    }
    ctx.fillStyle='#96a6aa';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('SIMULATED AVIONICS · TRAINING SANDBOX',512,373);texture.needsUpdate=true;
  }
  draw();return {texture,draw};
}

export function createAircraft(def){
  const group=new THREE.Group(), exterior=new THREE.Group(),cockpit=new THREE.Group();group.name=def.name;group.add(exterior,cockpit);cockpit.visible=false;
  const isHeli=def.kind==='heli',attack=def.id==='ah64',jet=def.kind==='jet',airliner=def.kind==='airliner';
  const mats={
    body:new THREE.MeshStandardMaterial({color:airliner?0xe1e8eb:def.id==='h125'?0xece9dd:def.id==='c172'?0xebeee8:def.id==='kingair'?0xe7e4da:jet?0x79858d:0x445145,metalness:.38,roughness:.47}),
    secondary:new THREE.MeshStandardMaterial({color:def.id==='h125'?0xb72d29:def.id==='c172'?0x8b2827:def.id==='kingair'||airliner?0x173e67:jet?0x4f5b64:0x303a33,metalness:.38,roughness:.5}),
    metal:new THREE.MeshStandardMaterial({color:0x8d969b,metalness:.82,roughness:.3}),
    dark:new THREE.MeshStandardMaterial({color:0x1c2427,metalness:.45,roughness:.48}),
    rubber:new THREE.MeshStandardMaterial({color:0x111719,roughness:.9}),
    glass:new THREE.MeshPhysicalMaterial({color:jet?0x7c9197:0x335c70,metalness:.38,roughness:.13,transparent:true,opacity:.77,side:THREE.DoubleSide}),
    interior:new THREE.MeshStandardMaterial({color:0x263038,roughness:.86}),
    panel:new THREE.MeshStandardMaterial({color:0x11171b,roughness:.73}),
    seat:new THREE.MeshStandardMaterial({color:jet?0x575b43:0x36434b,roughness:.9}),
    white:new THREE.MeshStandardMaterial({color:0xbac9ce,roughness:.75}),
    red:new THREE.MeshBasicMaterial({color:0xef4d43}),green:new THREE.MeshBasicMaterial({color:0x53f795}),
  };
  const rotors=[],props=[],gears=[],lights=[];let rpm=1,panelTimer=0;
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  function mesh(geo,mat,parent=exterior){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,l,x,y,z,mat=mats.body,parent=exterior){const m=mesh(new THREE.BoxGeometry(w,h,l),mat,parent);m.position.set(x,y,z);return m;}
  function sphere(r,x,y,z,mat=mats.body,parent=exterior,scale=[1,1,1]){const m=mesh(new THREE.SphereGeometry(r,18,12),mat,parent);m.position.set(x,y,z);m.scale.set(...scale);return m;}
  function rod(a,b,r=.03,mat=mats.metal,parent=exterior){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const m=mesh(new THREE.CylinderGeometry(r,r,d.length(),8),mat,parent);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,d.normalize());return m;}
  function cyl(radius,length,x,y,z,mat=mats.body,parent=exterior,axis='z',radius2=radius){const m=mesh(new THREE.CylinderGeometry(radius,radius2,length,24),mat,parent);m.position.set(x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;}
  function loft(rings,mat=mats.body,parent=exterior){return mesh(loftGeometry(rings),mat,parent);}
  function plate(pts,t=.08,mat=mats.body,axis='y',parent=exterior){return mesh(plateGeometry(pts,t,axis),mat,parent);}
  function glass(pts,parent=exterior){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));const idx=[];for(let i=1;i<pts.length-1;i++)idx.push(0,i,i+1);g.setIndex(idx);g.computeVertexNormals();mesh(g,mats.glass,parent);for(let i=0;i<pts.length;i++)rod(pts[i],pts[(i+1)%pts.length],.035,mats.dark,parent);}
  function seam(pts,parent=exterior){for(let i=0;i<pts.length-1;i++)rod(pts[i],pts[i+1],.009,mats.dark,parent);}
  function wheel(x,y,z,r=.3,width=.2,parent=exterior){cyl(r,width,x,y,z,mats.rubber,parent,'x');cyl(r*.53,width+.012,x,y,z,mats.metal,parent,'x');cyl(r*.21,width+.025,x,y,z,mats.dark,parent,'x');}
  function nav(x,y,z,color){const l=sphere(.065,x,y,z,mats[color]);l.userData.dynamic=true;lights.push(l);}
  function label(text,x,y,z,w=1,h=.2,parent=exterior,ry=0){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#bbc4be';ctx.font='bold 76px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,92);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}),parent);m.position.set(x,y,z);m.rotation.y=ry;}
  function rotor(x,y,z,r,count=4,dir=1,tail=false){
    const assembly=new THREE.Group();assembly.position.set(x,y,z);assembly.userData.dynamic=true;exterior.add(assembly);if(tail)assembly.rotation.z=Math.PI/2;
    cyl(.12,.52,0,0,0,mats.metal,assembly,'y');cyl(.30,.12,0,.19,0,mats.dark,assembly,'y');
    const blades=new THREE.Group();blades.position.y=.21;assembly.add(blades);
    for(let i=0;i<count;i++){const b=new THREE.Group();b.rotation.y=i*TAU/count;blades.add(b);const root=Math.min(.6,r*.14),chord=tail?.18:.36;
      plate([[root,.0,-chord*.4],[r*.85,.0,-chord*.4],[r,.0,-chord*.72],[r,.0,chord*.36],[root,.0,chord*.5]],tail?.025:.045,mats.dark,'y',b);
      box(r*.08,.018,chord*.9,r*.94,.024,0,mats.white,b);rod([.12,0,0],[root,.0,0],tail?.018:.047,mats.metal,b);
    }
    const disk=mesh(new THREE.RingGeometry(r*.12,r,80),new THREE.MeshBasicMaterial({color:0x9da8ad,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}),assembly);disk.rotation.x=-Math.PI/2;disk.position.y=.22;
    const line=mesh(new THREE.RingGeometry(r*.985,r,80),new THREE.MeshBasicMaterial({color:0xd3dcdf,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}),assembly);line.rotation.x=-Math.PI/2;line.position.y=.23;
    rotors.push({blades,disk,line,dir,tail});return assembly;
  }
  function propeller(x,y,z,r,count=4){const p=new THREE.Group();p.position.set(x,y,z);p.userData.dynamic=true;exterior.add(p);for(let i=0;i<count;i++){const m=box(.17,r,.06,0,r*.5,0,mats.dark,p);m.rotation.z=i*TAU/count;m.position.set(-Math.sin(i*TAU/count)*r*.5,Math.cos(i*TAU/count)*r*.5,0);}
    sphere(.22,0,0,-.05,mats.metal,p,[1,1,1.5]);const disk=mesh(new THREE.CircleGeometry(r,64),new THREE.MeshBasicMaterial({color:0xd6dadd,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}),p);props.push({p,disk});}
  function gearLeg(x,z,bottomY,r=.3,retract=true){const g=new THREE.Group();g.userData.dynamic=true;g.position.set(x,-.45,z);exterior.add(g);rod([0,0,0],[0,bottomY+.45+r,0],.06,mats.metal,g);wheel(0,bottomY+.45+r,0,r,r*.65,g);if(retract)gears.push(g);return g;}
  function skid(w,length,y,z=0){for(const s of [-1,1]){rod([s*w,y,z-length*.43],[s*w,y,z+length*.45],.07,mats.metal);rod([s*w,y,z-length*.43],[s*w,y+.22,z-length*.53],.065,mats.metal);rod([s*.48,-.5,z-length*.22],[s*w,y,z-length*.22],.06,mats.metal);rod([s*.48,-.5,z+length*.22],[s*w,y,z+length*.22],.06,mats.metal);}}
  function gunPods(span,y,z){for(const s of [-1,1]){
    plate([[s*.7,y,z-.75],[s*span,y,z-.4],[s*span,y,z+.5],[s*.7,y,z+.55]],.1,mats.body);
    cyl(.24,1.4,s*span*.8,y-.35,z,mats.dark);cyl(.245,.06,s*span*.8,y-.35,z-.71,mats.metal);
    for(let i=0;i<7;i++){const a=i/6*TAU;const xx=i===6?0:Math.cos(a)*.13,yy=i===6?0:Math.sin(a)*.13;cyl(.043,.08,s*span*.8+xx,y-.35+yy,z-.75,mats.rubber);}
    for(let i=0;i<2;i++){const x=s*(span-.25+i*.35);cyl(.085,1.6,x,y-.15,z-.15,mats.secondary);cyl(.085,.3,x,y-.15,z-1.1,mats.dark,exterior,'z',0);}
  }}

  let cockpitOffset;
  if(isHeli){
    if(def.id==='h125'){
      loft([[-3.8,-.28,.02,.03],[-3.5,-.05,.48,.5],[-2.7,.15,.98,.89],[-1.6,.12,1.02,1.04],[-.2,.02,.95,.91],[1.1,.03,.63,.68],[1.7,.23,.26,.36],[5.45,.5,.10,.15],[5.9,.53,.02,.04]]);
      loft([[-1.3,.83,.59,.05],[-.6,1.08,.56,.39],[.55,1.01,.43,.31],[1.4,.71,.05,.05]],mats.secondary);
      for(const s of [-1,1]){glass([[s*.1,.25,-3.55],[s*.73,.20,-3.14],[s*.84,1.02,-2.2],[s*.1,1.17,-2.45]]);glass([[s*.9,.20,-3.02],[s*1.03,.18,-1.30],[s*1.03,.90,-1.30],[s*.91,1.02,-2.12]]);seam([[s*1.04,-.63,-2.6],[s*1.04,-.63,-.70],[s*1.04,.90,-.70],[s*1.04,.90,-1.25]]);box(.035,.04,.23,s*1.045,.05,-.95,mats.metal);}
      skid(1.09,3.5,-def.gearHeight);rotor(0,1.7,0,def.rotorRadius,3);rotor(.17,.69,5.48,1.05,2,-1,true);
      plate([[0,.5,5.1],[0,2.0,5.45],[0,1.88,5.98],[0,.40,5.8]],.08,mats.secondary,'x');plate([[-1.17,.5,4.3],[1.17,.5,4.3],[1.05,.5,4.8],[-1.05,.5,4.8]],.06,mats.body);
      cyl(.17,.5,.36,.89,1.1,mats.dark);label('B-SHA',-.99,.0,.12,1.1,.2,exterior,-Math.PI/2);cockpitOffset=V(-.40,.92,-1.82);
    }else if(def.id==='mh6'){
      // OH-6/AH-6 teardrop cabin, raised engine fairing and slender boom.
      loft([[-2.42,-.12,.015,.03],[-2.12,-.05,.58,.60],[-1.43,.05,.88,.94],[-.35,.07,.92,1.02],[.7,.13,.73,.82],[1.25,.19,.42,.52],[1.75,.3,.17,.22],[5.8,.59,.072,.12],[6.0,.59,.015,.02]],mats.body);
      // Separate bubble made from a curved ring loft, with framing following
      // the canopy's curvature instead of planar windshield rectangles.
      loft([[-2.40,.05,.015,.03],[-2.20,.19,.51,.51],[-1.80,.32,.78,.73],[-1.36,.39,.85,.77],[-.94,.41,.86,.75]],mats.glass);
      for(const s of [-1,1]){
        seam([[s*.02,-.03,-2.43],[s*.33,.55,-2.18],[s*.49,.95,-1.76],[s*.56,1.16,-1.31],[s*.60,1.17,-.97]]);
        rod([s*.08,-.04,-2.42],[s*.55,-.20,-2.19],.029,mats.dark);rod([s*.55,-.20,-2.19],[s*.84,-.11,-1.56],.029,mats.dark);
        rod([s*.84,-.11,-1.56],[s*.88,.93,-1.12],.036,mats.dark);rod([s*.88,.93,-1.12],[s*.61,1.16,-1.05],.035,mats.dark);
        glass([[s*.9,-.25,-.94],[s*.93,-.23,.12],[s*.91,.86,.12],[s*.87,.98,-.90]]);
        seam([[s*.94,-.42,-.89],[s*.94,-.42,.3],[s*.94,.86,.3],[s*.94,.86,-.88]]);box(.025,.04,.19,s*.95,-.03,.10,mats.metal);
        // Minigun and rocket pod training load on removable outriggers.
        rod([s*.60,-.43,.07],[s*1.70,-.39,.07],.062,mats.metal);
        box(.18,.14,.57,s*1.65,-.40,.04,mats.dark);cyl(.17,.78,s*1.77,-.38,-.43,mats.dark);cyl(.17,.025,s*1.77,-.38,-.83,mats.metal);
        for(let i=0;i<7;i++){const a=i/6*TAU;cyl(.032,.04,s*1.77+(i===6?0:Math.cos(a)*.10),-.38+(i===6?0:Math.sin(a)*.10),-.85,mats.rubber);}
        cyl(.10,.35,s*1.23,-.40,-.38,mats.dark);for(let i=0;i<6;i++){const a=i/6*TAU;cyl(.019,.76,s*1.23+Math.cos(a)*.061,-.40+Math.sin(a)*.061,-.87,mats.metal);}
        box(.22,.12,1.2,s*.98,-.49,.22,mats.dark);
      }
      loft([[-.6,.85,.27,.04],[-.20,1.01,.38,.30],[.8,1.0,.30,.29],[1.23,.68,.09,.07]],mats.secondary);
      cyl(.19,.52,0,.72,1.20,mats.dark);cyl(.20,.05,0,.72,1.47,mats.metal);
      skid(.91,2.7,-def.gearHeight,-.65);rotor(0,1.60,-.06,def.rotorRadius,5);rotor(.12,.81,5.75,.72,2,-1,true);
      plate([[0,.58,5.14],[0,1.67,5.65],[0,1.72,6.0],[0,.51,5.98]],.045,mats.body,'x');plate([[-.79,.5,4.68],[.79,.5,4.68],[.75,.5,5.03],[-.75,.5,5.03]],.035,mats.body);
      label('ARMY',-.94,-.19,.53,.65,.16,exterior,-Math.PI/2);cockpitOffset=V(-.34,.77,-.83);
    }else if(def.id==='ch47'){
      loft([[-7.5,-.4,.05,.05],[-7.0,-.02,.87,.94,.7],[-5.6,.0,1.40,1.39,.7],[-3.0,0,1.50,1.46,.6],[4.7,0,1.48,1.45,.6],[6.8,-.2,1.25,1.0,.6],[7.6,-.45,1.0,.65,.6]]);
      loft([[-6.1,1.16,.5,.16],[-5.4,1.9,.7,.8],[-4.1,1.8,.65,.65],[-3.5,1.30,.3,.2]]);
      loft([[4.1,1.28,.9,.15],[4.8,2.14,1.1,.9],[6.1,2.45,1.02,1.01],[7.0,1.8,.6,.6]]);
      rotor(0,2.93,-4.6,def.rotorRadius,3,1);rotor(0,3.73,5.4,def.rotorRadius,3,-1);
      for(const s of [-1,1]){glass([[s*.09,.24,-7.12],[s*.91,.21,-6.88],[s*1.11,1.12,-5.9],[s*.09,1.29,-6.1]]);glass([[s*1.35,.22,-5.6],[s*1.50,.22,-4.42],[s*1.50,1.11,-4.42],[s*1.34,1.21,-5.53]]);
        for(let i=0;i<5;i++){const z=-2.8+i*1.7;const m=mesh(new THREE.CircleGeometry(.28,18),mats.glass);m.position.set(s*1.506,.50,z);m.rotation.y=s*Math.PI/2;}
        loft([[-3.7,-.51,.01,.03],[-3.1,-.73,.38,.47],[4.0,-.73,.38,.47],[4.4,-.73,.01,.03]],mats.secondary).position.x=s*1.53;
        cyl(.45,2.45,s*1.26,1.7,5.42,mats.body);cyl(.30,.08,s*1.26,1.7,6.66,mats.dark);
        gearLeg(s*1.7,-4.4,-def.gearHeight,.39,false);gearLeg(s*1.7,4.3,-def.gearHeight,.39,false);
      }
      box(2.0,.07,1.25,0,-1.03,6.97,mats.dark);seam([[-1.01,-1.07,6.35],[1.01,-1.07,6.35],[1.01,-.18,7.59],[-1.01,-.18,7.59],[-1.01,-1.07,6.35]]);
      label('ARMY 47',-1.53,.0,0,1.9,.28,exterior,-Math.PI/2);cockpitOffset=V(-.55,.92,-5.59);
    }else{
      const uh=def.id==='uh60',viper=def.id==='ah1z',w=uh?1.12:viper?.46:.63,nose=uh?-5.3:viper?-5.7:-5.3;
      loft([[nose,-.30,.02,.03],[nose+.45,-.17,w*.65,.5],[nose+1.35,.1,w,.97],[uh?-1.1:-1.8,.10,w,1.05],[1.1,.05,w*.85,.88],[2.1,.43,w*.45,.52],[uh?8.8:8.0,1.20,.13,.20],[uh?9.1:8.5,1.22,.02,.03]]);
      if(uh){
        for(const s of [-1,1]){glass([[s*.07,.28,-4.94],[s*.84,.25,-4.53],[s*1.03,1.05,-3.31],[s*.07,1.15,-3.43]]);glass([[s*1.10,.24,-4.17],[s*1.14,.22,-2.8],[s*1.14,1.01,-2.8],[s*1.08,1.08,-3.30]]);
          for(let i=0;i<2;i++)glass([[s*1.13,.06,-2.17+i*1.45],[s*1.13,.06,-1.0+i*1.45],[s*1.13,.78,-1.0+i*1.45],[s*1.13,.78,-2.17+i*1.45]]);
          seam([[s*1.145,-.79,-2.38],[s*1.145,-.79,.68],[s*1.145,.95,.68],[s*1.145,.95,-2.38]]);rod([s*1.15,.93,-2.6],[s*1.15,.93,1.0],.022,mats.metal);box(.04,.06,.35,s*1.15,-.08,.18,mats.metal);
          cyl(.37,2.55,s*.71,1.25,-.08,mats.secondary);cyl(.33,.08,s*.71,1.25,-1.39,mats.dark);cyl(.30,.54,s*.71,1.22,1.50,mats.metal);gearLeg(s*1.6,-2.6,-def.gearHeight,.37,false);
        }
        gearLeg(0,7.15,-def.gearHeight,.24,false);cockpitOffset=V(-.45,.97,-3.11);
      }else{
        for(const s of [-1,1]){
          // Both attack types have narrow tandem, stepped canopies.
          glass([[s*.08,.45,nose+.47],[s*w*.87,.40,nose+.7],[s*w*.93,1.13,nose+1.58],[s*.08,1.30,nose+1.55]]);
          glass([[s*w,.34,nose+1.04],[s*w,.39,nose+2.34],[s*w,1.23,nose+2.34],[s*w*.94,1.15,nose+1.58]]);
          glass([[s*.07,1.32,nose+2.50],[s*w*.90,1.28,nose+2.58],[s*w*.92,1.66,nose+3.14],[s*.07,1.72,nose+3.1]]);
          glass([[s*w,.5,nose+2.5],[s*w,.54,nose+4.10],[s*w,1.56,nose+4.1],[s*w*.95,1.67,nose+3.15]]);
          cyl(.40,2.48,s*(w+.38),.96,.17,mats.body);cyl(.34,.10,s*(w+.38),.96,-1.10,mats.dark);cyl(.31,.40,s*(w+.38),.96,1.58,mats.metal);
        }
        gunPods(viper?2.85:2.9,-.13,-.23);
        if(viper)skid(1.06,3.9,-def.gearHeight,-1.3);else{gearLeg(-1.2,-1.75,-def.gearHeight,.33,false);gearLeg(1.2,-1.75,-def.gearHeight,.33,false);gearLeg(0,6.7,-def.gearHeight,.20,false);}
        sphere(viper?.36:.43,0,-.07,nose+.05,mats.dark);sphere(.16,.17,-.08,nose-.27,mats.glass);
        sphere(.27,0,-.81,nose+1.25,mats.dark);const barrels=viper?3:1;for(let i=0;i<barrels;i++)cyl(.027,1.25,(i-1)*.06,-.88,nose+.35,mats.metal);
        if(!viper){cyl(.23,.45,0,2.18,-.12,mats.dark,exterior,'y');sphere(.65,0,2.51,-.12,mats.dark,exterior,[1,.4,1]);}
        cockpitOffset=V(0,1.34,nose+3.37);
      }
      const ry=uh?2.25:1.9;rotor(0,ry,uh?-.4:-.07,def.rotorRadius,4);const tz=uh?8.67:8.07;rotor(.25,1.66,tz,uh?1.66:1.42,4,-1,true);
      plate([[0,1.06,tz-.61],[0,3.15,tz-.17],[0,3.42,tz+.57],[0,1.13,tz+.58]],.10,mats.body,'x');plate([[-1.75,1.10,tz-1.4],[1.75,1.10,tz-1.4],[1.66,1.10,tz-.61],[-1.66,1.10,tz-.61]],.08,mats.body);
      label(uh?'UNITED STATES ARMY':viper?'MARINES':'ARMY',-w-.017,-.15,uh?-.45:.4,uh?2.8:1.5,.17,exterior,-Math.PI/2);
    }
    nav(-.8,.45,.8,'red');nav(.8,.45,.8,'green');rod([0,1.0,2],[0,2.3,2.1],.018,mats.dark);
  }else if(def.id==='c172'){
    loft([[-4.12,-.15,.01,.03],[-3.92,-.05,.46,.53],[-2.60,.02,.51,.66],[-1.66,.0,.61,.92],[.20,.01,.65,.96],[1.5,-.08,.50,.68],[3.1,.16,.16,.26],[4.16,.25,.02,.06]]);
    for(const s of [-1,1]){glass([[s*.06,.21,-2.57],[s*.48,.20,-2.53],[s*.57,.91,-1.63],[s*.06,.99,-1.67]]);glass([[s*.61,.19,-1.56],[s*.655,.21,-.10],[s*.655,.93,-.10],[s*.59,.94,-1.5]]);glass([[s*.66,.24,.04],[s*.60,.26,.80],[s*.60,.83,.80],[s*.66,.93,.04]]);
      plate([[s*.40,1.05,-1.15],[s*5.50,1.05,-1.06],[s*5.48,1.05,.45],[s*.40,1.05,.63]],.14,mats.body);rod([s*.54,-.41,-.49],[s*3.88,1.0,-.25],.055,mats.metal);plate([[s*.1,.28,2.6],[s*2.04,.28,2.78],[s*2.00,.28,3.62],[s*.1,.28,3.4]],.08,mats.body);
      rod([s*.38,-.57,.1],[s*1.15,-1.09,.45],.05,mats.metal);wheel(s*1.15,-1.1,.45,.25,.17);nav(s*5.48,1.10,-.10,s<0?'red':'green');label('SHA-172',s*.665,-.24,.62,1.10,.16,exterior,s*Math.PI/2);
      seam([[s*.63,-.51,-1.68],[s*.65,-.51,.0],[s*.65,.88,.0]]);box(.025,.035,.21,s*.664,.15,-.17,mats.dark);
    }
    plate([[0,.15,2.60],[0,2.0,3.33],[0,2.12,3.84],[0,.22,4.06]],.1,mats.secondary,'x');gearLeg(0,-2.9,-def.gearHeight,.24,false);propeller(0,-.03,-4.10,1.0,2);cockpitOffset=V(-.28,.80,-.79);
    for(const s of [-1,1])box(.014,.12,1.7,s*.65,-.28,.55,mats.secondary);
  }else if(def.id==='kingair'){
    loft([[-7.11,-.16,.02,.03],[-6.48,.04,.56,.51],[-5.1,.11,.83,.82],[-3.9,.13,.87,1.10],[2.55,.05,.85,1.09],[4.6,.15,.55,.62],[6.8,.31,.11,.14],[7.10,.31,.02,.02]]);
    for(const s of [-1,1]){glass([[s*.04,.43,-6.06],[s*.63,.35,-5.8],[s*.79,1.03,-4.85],[s*.04,1.19,-4.88]]);glass([[s*.82,.44,-4.76],[s*.86,.44,-3.65],[s*.86,1.0,-3.65],[s*.82,1.06,-4.65]]);
      plate([[s*.64,-.34,-1.3],[s*8.83,-.10,.40],[s*8.75,-.10,1.36],[s*.64,-.34,1.6]],.18,mats.body);
      loft([[-3.95,-.13,.03,.03],[-3.6,-.13,.4,.43],[-2.6,-.13,.48,.61],[.7,-.13,.35,.4],[1.65,-.13,.06,.10]],mats.secondary).position.x=s*2.86;propeller(s*2.86,-.13,-3.75,1.30,4);gearLeg(s*2.86,-.4,-def.gearHeight,.35);
      for(let i=0;i<7;i++){const z=-2.8+i*.88;const m=mesh(new THREE.CircleGeometry(.22,20),mats.glass);m.position.set(s*.855,.45,z);m.scale.y=1.27;m.rotation.y=s*Math.PI/2;}
      plate([[s*.1,2.20,4.7],[s*2.63,2.20,5.82],[s*2.65,2.20,6.46],[s*.1,2.20,6.14]],.10,mats.body);nav(s*8.81,-.06,.65,s<0?'red':'green');box(.018,.20,7.5,s*.88,-.23,-.5,mats.secondary);
    }
    plate([[0,.31,3.72],[0,2.29,5.05],[0,2.31,6.31],[0,.36,6.66]],.16,mats.secondary,'x');gearLeg(0,-4.80,-def.gearHeight,.30);cockpitOffset=V(-.36,1.0,-4.08);label('SHA-350',-.89,.0,2.1,1.45,.21,exterior,-Math.PI/2);
  }else if(airliner){
    loft([[-18.79,-.38,.02,.03],[-18.05,-.20,.80,.87],[-16.7,-.05,1.50,1.60],[-14.10,0,1.95,1.97],[-11,0,1.98,1.98],[9.1,0,1.98,1.98],[13.4,.36,1.31,1.42],[17.65,.68,.16,.31],[18.78,.73,.02,.02]],mats.body,exterior);
    for(const s of [-1,1]){glass([[s*.05,.73,-17.85],[s*.96,.62,-17.26],[s*1.18,1.40,-16.1],[s*.05,1.59,-16.36]]);glass([[s*1.07,.60,-17.13],[s*1.65,.69,-15.41],[s*1.55,1.35,-15.34],[s*1.22,1.43,-16.06]]);
      for(let i=0;i<30;i++){const z=-12.9+i*.73;const m=mesh(new THREE.PlaneGeometry(.29,.43),mats.glass);m.position.set(s*1.892,.58,z);m.rotation.y=s*Math.PI/2;}
      for(const z of [-13.8,-1.4,.8,9.6]){seam([[s*1.86,1.0,z-.38],[s*1.99,-.72,z-.38],[s*1.99,-.72,z+.38],[s*1.86,1.0,z+.38],[s*1.86,1.0,z-.38]]);box(.025,.06,.17,s*1.99,.16,z+.20,mats.metal);}
      plate([[s*1.45,-.82,-4.37],[s*17.86,.11,3.52],[s*17.73,.11,4.80],[s*9.2,-.35,4.55],[s*1.45,-.82,4.71]],.27,mats.body);
      plate([[s*17.74,.10,3.51],[s*17.89,2.20,4.19],[s*17.87,2.39,4.87],[s*17.69,.1,4.82]],.08,mats.secondary,'x');
      const x=s*5.4;box(.18,1.0,2.2,x,-1.29,-2.26,mats.metal);
      loft([[-5.4,-2.14,.77,.77],[-5.1,-2.14,.98,.98],[-2.7,-2.14,.97,.97],[-1.28,-2.14,.53,.59],[-.89,-2.14,.40,.47]],mats.body).position.x=x;
      cyl(.73,.06,x,-2.14,-5.44,mats.dark);cyl(.29,.11,x,-2.14,-5.50,mats.metal);for(let i=0;i<18;i++){const a=i/18*TAU;rod([x+Math.cos(a)*.31,-2.14+Math.sin(a)*.31,-5.49],[x+Math.cos(a+.10)*.69,-2.14+Math.sin(a+.10)*.69,-5.49],.032,mats.metal);}
      cyl(.41,.14,x,-2.14,-.87,mats.dark);plate([[s*.50,.62,11.45],[s*6.22,1.06,14.4],[s*6.21,1.06,15.42],[s*.5,.62,14.59]],.14,mats.body);nav(s*17.79,.14,4.61,s<0?'red':'green');
      const g=gearLeg(s*2.60,1.2,-def.gearHeight,.58);wheel(s*.38,-2.78,0,.58,.30,g);label('SPEAKKAI',s*1.989,.25,-7.25,5.3,.54,exterior,s*Math.PI/2);
      for(const z of [-3.6,-1.9,.0,1.9,3.6])seam([[s*2.0,-.68,z],[s*15.7,.07,z+2.8]]);
    }
    plate([[0,1.37,10.3],[0,8.12,14.0],[0,8.28,16.22],[0,1.48,16.98]],.25,mats.secondary,'x');gearLeg(0,-12.7,-def.gearHeight,.47);cockpitOffset=V(-.63,1.32,-15.20);
  }else{
    const f22=def.id==='f22',L=def.length,n=L*.5;
    loft([[-n,0,.015,.025],[-n+1,.02,.36,.35],[-n+2.4,.03,f22?.66:.53,.54],[-n+4,.0,f22?1.11:.74,.64],[-1.8,0,f22?1.18:.76,.70],[1.4,0,f22?1.46:.87,.71],[n-2,.11,f22?1.45:.65,.65],[n-.2,.08,f22?1.40:.57,.55]],mats.body);
    loft([[-n+2.6,.54,.10,.10],[-n+3.2,.72,f22?.55:.48,.57],[-n+4.45,.80,f22?.64:.53,.66],[-n+5.7,.62,f22?.50:.43,.38],[-n+6.3,.46,.03,.02]],mats.glass);
    for(const s of [-1,1]){
      rod([s*.08,.55,-n+2.7],[s*.46,.80,-n+3.2],.035,mats.dark);rod([s*.46,.80,-n+3.2],[s*.60,1.04,-n+4.45],.03,mats.dark);rod([s*.60,1.04,-n+4.45],[s*.46,.70,-n+5.7],.03,mats.dark);
      const span=def.wingspan/2;plate([[s*.64,.05,-n+3.2],[s*span,.05,f22?.10:1.01],[s*span,.05,f22?2.75:2.35],[s*1.10,.05,f22?4.0:3.44]],.11,mats.body);
      plate([[s*.74,.05,n-3.20],[s*(f22?4.5:2.8),.05,n-1.30],[s*(f22?4.33:2.7),.05,n+.05],[s*.71,.05,n-1.03]],.09,mats.secondary);
      seam([[s*1.3,.12,2.66],[s*span*.94,.12,2.12]]);seam([[s*.82,.73,-1.6],[s*.82,.73,2.2],[s*.67,.70,3.2]]);
      if(f22){
        plate([[s*.87,-.11,-4.63],[s*1.86,-.07,-3.75],[s*1.88,-.07,5.3],[s*.90,-.11,6.8]],.64,mats.secondary);
        plate([[s*1.1,-.49,-4.9],[s*1.95,-.36,-4.2],[s*1.85,.24,-3.94],[s*1.11,.25,-4.70]],.03,mats.dark);
        const fin=plate([[s*1.10,.40,n-4.7],[s*1.10,3.7,n-2.0],[s*1.10,3.78,n-.63],[s*1.10,.42,n-.02]],.10,mats.secondary,'x');fin.rotation.z=-s*.31;fin.position.y=-.02;
        box(1.00,.62,1.00,s*.82,.06,n-.02,mats.dark);box(.85,.40,.08,s*.82,.06,n+.50,mats.metal);
      }else{
        loft([[-4.82,-.79,.27,.27],[-4.38,-.75,.57,.34],[-1.6,-.45,.66,.40],[.7,-.24,.51,.40]],mats.secondary);cyl(.39,.08,0,-.78,-4.88,mats.dark);
        cyl(.53,1.22,0,.02,n-.40,mats.dark);cyl(.56,.06,0,.02,n+.23,mats.metal);
        plate([[0,.42,n-4.8],[0,3.40,n-2.15],[0,3.46,n-.91],[0,.41,n-.09]],.12,mats.secondary,'x');
        cyl(.09,2.73,s*span,.06,1.25,mats.white);cyl(.09,.40,s*span,.06,-.33,mats.dark,exterior,'z',0);
        plate([[s*span,.08,.2],[s*(span+.25),.08,.9],[s*span,.08,1.27]],.03,mats.secondary);
      }
      gearLeg(s*(f22?1.25:1.10),1.16,-def.gearHeight,.31);nav(s*span,.12,f22?2.75:2.36,s<0?'red':'green');
    }
    gearLeg(0,-n+3.55,-def.gearHeight,.25);rod([0,.15,-n],[0,.15,-n-.45],.025,mats.metal);cockpitOffset=V(0,1.03,-n+4.48);
    label(f22?'FF 022':'AF 016',f22?-1.52:-.065,2.1,n-1.9,1.2,.24,exterior,-Math.PI/2);
  }

  // Full-size interior surrounding the eye point; not a flat HUD overlay.
  // Geometry intentionally leaves the central forward sightline unobstructed.
  const eye=cockpitOffset,wide=airliner?1.63:attack||jet?.73:def.id==='ch47'?1.50:isHeli?1.08:.88;
  const panelZ=eye.z-(jet?1.0:1.04),panelY=eye.y-.57,panelW=wide*1.73,panelH=airliner?.61:.49;
  box(panelW,panelH,.20,0,panelY,panelZ,mats.panel,cockpit);
  box(panelW+.09,.06,.30,0,panelY+panelH*.5,panelZ+.04,mats.dark,cockpit);
  box(panelW,.10,.62,0,panelY-panelH*.55,panelZ+.23,mats.interior,cockpit);
  const display=makePanelTexture(def.id==='c172'?'analog':airliner?'airliner':'glass');
  const screenMat=new THREE.MeshBasicMaterial({map:display.texture,toneMapped:false});
  const screen=mesh(new THREE.PlaneGeometry(panelW*.92,panelH*.90),screenMat,cockpit);screen.position.set(0,panelY,panelZ+.103);
  for(const s of [-1,1]){
    box(.09,.67,1.80,s*wide,eye.y-.72,eye.z-.20,mats.interior,cockpit);
    box(.20,.10,1.45,s*(wide-.07),eye.y-.39,eye.z-.10,mats.panel,cockpit);
    rod([s*wide,eye.y-.35,eye.z+.15],[s*wide*.91,eye.y+.67,eye.z-1.36],jet?.028:.037,mats.interior,cockpit);
    rod([s*wide*.91,eye.y+.67,eye.z-1.36],[s*wide*.78,eye.y+.72,eye.z+.80],.033,mats.interior,cockpit);
    rod([s*wide,eye.y-.35,eye.z-1.00],[s*wide*.91,eye.y+.67,eye.z-1.36],.038,mats.interior,cockpit);
    // Side consoles and knobs are below the window line.
    for(let i=0;i<7;i++){cyl(.018,.027,s*(wide-.055),eye.y-.325,eye.z-.65+i*.145,mats.metal,cockpit,'y');box(.013,.017,.027,s*(wide-.12),eye.y-.317,eye.z-.65+i*.145,mats.white,cockpit);}
    box(.24,.16,.5,s*(wide-.13),eye.y-.52,eye.z+.48,mats.seat,cockpit);
  }
  if(!jet){
    rod([-wide*.91,eye.y+.67,eye.z-1.36],[wide*.91,eye.y+.67,eye.z-1.36],.046,mats.interior,cockpit);
    // Windscreen centre post aligns with aircraft centre; left-seat eye has a
    // clear view through its own windscreen, as in the utility helicopters.
    if(!attack)rod([0,panelY+.3,panelZ-.35],[0,eye.y+.67,eye.z-1.36],.026,mats.interior,cockpit);
    box(wide*1.55,.12,.49,0,eye.y+.78,eye.z-.20,mats.panel,cockpit);
    for(let i=0;i<9;i++){box(.035,.016,.04,(i-4)*.10,eye.y+.711,eye.z-.25,mats.white,cockpit);}
  }else{
    // Front canopy arch is well ahead of the pilot, so it frames the scenery.
    rod([-wide*.8,eye.y-.04,eye.z-1.38],[-wide*.47,eye.y+.67,eye.z-1.48],.025,mats.dark,cockpit);
    rod([-wide*.47,eye.y+.67,eye.z-1.48],[wide*.47,eye.y+.67,eye.z-1.48],.025,mats.dark,cockpit);
    rod([wide*.47,eye.y+.67,eye.z-1.48],[wide*.8,eye.y-.04,eye.z-1.38],.025,mats.dark,cockpit);
  }
  box(.24,.22,1.03,0,eye.y-.89,eye.z-.03,mats.panel,cockpit);
  for(let i=0;i<8;i++){box(.034,.027,.047,-.065,eye.y-.767,eye.z-.42+i*.1,mats.white,cockpit);box(.023,.013,.023,.06,eye.y-.762,eye.z-.42+i*.1,mats.metal,cockpit);}
  const sticks=[];
  function stick(x,z){const g=new THREE.Group();g.position.set(x,eye.y-.88,z);g.userData.dynamic=true;cockpit.add(g);rod([0,0,0],[0,.31,-.04],.024,mats.metal,g);box(.056,.12,.077,0,.34,-.04,mats.dark,g);box(.025,.013,.027,0,.401,-.04,mats.red,g);sticks.push(g);}
  if(isHeli||jet){stick(jet?.48:eye.x,eye.z-.30);rod([eye.x-.35,eye.y-.80,eye.z+.05],[eye.x-.35,eye.y-.58,eye.z-.43],.025,mats.dark,cockpit);box(.065,.07,.20,eye.x-.35,eye.y-.54,eye.z-.46,mats.dark,cockpit);}
  else if(airliner){stick(-1.34,eye.z-.06);stick(1.34,eye.z-.06);for(const x of [-.05,.05]){rod([x,eye.y-.71,eye.z-.43],[x,eye.y-.49,eye.z-.38],.021,mats.metal,cockpit);box(.10,.055,.11,x,eye.y-.47,eye.z-.38,mats.dark,cockpit);}}
  else{
    rod([eye.x,eye.y-.7,panelZ+.16],[eye.x,eye.y-.48,eye.z-.35],.032,mats.dark,cockpit);
    rod([eye.x-.2,eye.y-.47,eye.z-.35],[eye.x+.2,eye.y-.47,eye.z-.35],.031,mats.dark,cockpit);
    for(const s of [-1,1])rod([eye.x+s*.20,eye.y-.47,eye.z-.35],[eye.x+s*.20,eye.y-.32,eye.z-.35],.030,mats.dark,cockpit);
  }
  for(const s of [-1,1])box(.12,.035,.23,eye.x+s*.13,eye.y-1.04,eye.z-.63,mats.metal,cockpit);
  box(.53,.08,.52,eye.x,eye.y-1.03,eye.z+.25,mats.seat,cockpit);box(.51,.80,.11,eye.x,eye.y-.60,eye.z+.50,mats.seat,cockpit);
  label(def.name.toUpperCase(),0,panelY+panelH*.57,panelZ+.20,.52,.030,cockpit);

  batchStatic(exterior);batchStatic(cockpit);
  return {group,exterior,cockpit,cockpitOffset,
    animate(dt,state={}){
      const {power=.6,gear=true,engineRunning=true,time=0}=state;
      rpm=THREE.MathUtils.damp(rpm,engineRunning?1:0,engineRunning?.5:.25,dt);
      const rotorSpeed=Number.isFinite(state.rotorRPM)?THREE.MathUtils.clamp(state.rotorRPM,0,1.15):rpm;
      const engineSpeed=Number.isFinite(state.engineRPM)?THREE.MathUtils.clamp(state.engineRPM,0,1.15):rpm;
      for(const r of rotors){r.blades.rotation.y+=dt*(r.tail?95:35)*rotorSpeed*r.dir;r.disk.material.opacity=(r.tail?.10:.11)*rotorSpeed;r.line.material.opacity=.13*rotorSpeed;}
      for(const p of props){p.p.rotation.z+=dt*(70+power*100)*engineSpeed;p.disk.material.opacity=.12*engineSpeed;}
      for(const g of gears){g.scale.y=THREE.MathUtils.damp(g.scale.y,gear?1:.03,6,dt);g.visible=g.scale.y>.05;}
      for(const l of lights)l.visible=Math.sin(time*4)>-.8;
      for(const s of sticks){s.rotation.x=THREE.MathUtils.damp(s.rotation.x,(state.inputPitch||0)*.16,8,dt);s.rotation.z=THREE.MathUtils.damp(s.rotation.z,-(state.inputRoll||0)*.13,8,dt);}
      panelTimer+=dt;if(cockpit.visible&&panelTimer>.1){panelTimer=0;display.draw(state);}
    },
    dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.map)textures.add(m.map);}}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();group.removeFromParent();}
  };
}

