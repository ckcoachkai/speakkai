export const SELECTION_SECONDS = 2.4;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t=clamp(value);return t*t*(3-2*t); };

/** A showroom uses the race's actual model roots and shared GPU assets. */
export function createRaceSelection(THREE, { racers = [] } = {}) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#07131f');
  const camera=new THREE.OrthographicCamera(-20,20,12,-12,.1,150);
  camera.position.set(0,1.5,60);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#c9efff','#182a46',2.6));
  const key=new THREE.DirectionalLight('#fff1d8',3.6);key.position.set(-8,14,20);scene.add(key);
  const rim=new THREE.DirectionalLight('#4fcfff',3);rim.position.set(12,6,-10);scene.add(rim);
  const ringGeometry=new THREE.TorusGeometry(2.55,.045,6,56);
  const discGeometry=new THREE.CylinderGeometry(2.6,2.7,.10,48);
  const scanGeometry=new THREE.TorusGeometry(2.8,.024,4,48);
  const discMaterial=new THREE.MeshStandardMaterial({color:'#102b41',metalness:.55,roughness:.32});
  const resources=[ringGeometry,discGeometry,scanGeometry,discMaterial];
  const point=new THREE.Vector3();
  const slots=racers.map((racer,index)=>{
    const holder=new THREE.Group();scene.add(holder);
    const material=new THREE.MeshBasicMaterial({color:racer.color||'#60e6ff',transparent:true,opacity:.8});resources.push(material);
    const base=new THREE.Mesh(discGeometry,discMaterial);base.position.y=-.12;holder.add(base);
    const ring=new THREE.Mesh(ringGeometry,material);ring.rotation.x=Math.PI/2;holder.add(ring);
    const scan=new THREE.Mesh(scanGeometry,material);scan.rotation.x=Math.PI/2;holder.add(scan);
    return {racer,index,holder,ring,scan,material,x:0,y:0,scale:0,rotation:0};
  });
  let models=null,parent=null,active=false,progress=0,loading=true,disposed=false;
  function layout(width,height) {
    const aspect=Math.max(.2,width/Math.max(1,height));
    const columns=Math.min(Math.max(1,slots.length),Math.max(1,Math.ceil(Math.sqrt(slots.length*aspect*.78))));
    const rows=Math.ceil(slots.length/columns)||1;
    const viewHeight=Math.max(rows*5.3+3,(columns*7+1)/aspect)*1.16;
    camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
    camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    for(const slot of slots){
      const row=Math.floor(slot.index/columns),rowCount=Math.min(columns,slots.length-row*columns);
      slot.x=(slot.index%columns-(rowCount-1)/2)*7;
      slot.y=((rows-1)/2-row)*5.3-.65;
      slot.holder.position.set(slot.x,slot.y,0);
    }
  }
  function begin(carModels) {
    if(disposed)return;
    if(active)end();
    models=carModels;parent=models.group.parent;scene.add(models.group);
    active=true;progress=0;loading=true;
  }
  function update(value, size, isLoading=false) {
    if(!active||disposed)return;
    progress=clamp(value);loading=isLoading;layout(size.width,size.height);
    for(const slot of slots){
      const delay=slots.length>1?slot.index/(slots.length-1)*.15:0;
      const reveal=smooth((progress-delay)/.55);
      const lock=smooth((progress-.65)/.3);
      slot.scale=.025+.975*reveal;
      slot.rotation=-Math.PI*1.6*(1-reveal)+.65+(1-lock)*progress*.8;
      models.selectionPose(slot.racer.id,{x:slot.x,y:slot.y+(1-reveal)*.9,rotation:slot.rotation,scale:slot.scale});
      slot.material.opacity=.3+reveal*.55;
      slot.scan.position.y=.15+((progress*1.8+slot.index*.04)%1)*2.7;
      slot.scan.scale.setScalar(1+Math.sin(progress*20+slot.index)*.04);
      slot.scan.visible=progress<.84;
      slot.ring.scale.setScalar(.82+reveal*.18);
      point.set(slot.x,slot.y+2.3,0).project(camera);
      slot.racer.screen={x:(point.x*.5+.5)*size.width,y:(-point.y*.5+.5)*size.height,visible:true};
    }
  }
  function end() {
    if(!active)return;
    if(parent)parent.add(models.group);else models.group.removeFromParent();
    models.reset();models=null;parent=null;active=false;
  }
  function snapshot() {
    return {active,loading,progress,duration:SELECTION_SECONDS,cars:slots.map(slot=>({id:slot.racer.id,racerType:slot.racer.racerType,x:slot.x,y:slot.y,rotation:slot.rotation,scale:slot.scale}))};
  }
  function dispose(){if(disposed)return;end();disposed=true;for(const resource of resources)resource.dispose();scene.clear();}
  return {scene,camera,begin,update,end,snapshot,dispose};
}
