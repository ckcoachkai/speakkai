"""Photo-referenced Suzhou Bay architectural study, Blender 5.2.1.
Run --graybox, --draft, or --final after --. Geometry is metre-based, photo-estimated.
"""
import bpy,math,random,json,sys,time
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];OUT=R/'output/travel/realism';OUT.mkdir(parents=True,exist_ok=True)
TEX=R/'media/travel/realism-textures';random.seed(555)
GRAY='--graybox' in sys.argv;FINAL='--final' in sys.argv or '--export-only' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
S=bpy.context.scene;S.unit_settings.system='METRIC';S.unit_settings.scale_length=1
COL={}
for name in ['01 Terrain and water','02 Guest wings','03 Hall and arrival','04 Garden villas','05 Roads and paths','06 Landscape and furniture','07 Trees and planting','08 Labels and anchors','09 Cameras and lighting']:
 c=bpy.data.collections.new(name);S.collection.children.link(c);COL[name[:2]]=c
M={};textures={}
def img(name):
 if name not in textures:textures[name]=bpy.data.images.load(str(TEX/name),check_existing=True)
 return textures[name]
def material(name,color,rough=.65,metal=0,scan=None,normal=None,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emit:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 if scan and not GRAY:
  for field,file in scan.items():
   tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img(file);tex.label=field+' photographic surface'
   if field!='Base Color':tex.image.colorspace_settings.name='Non-Color'
   if field=='Normal':
    n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.32;m.node_tree.links.new(tex.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],p.inputs['Normal'])
   else:m.node_tree.links.new(tex.outputs['Color'],p.inputs[field])
 if normal and not GRAY:
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img(normal);tex.image.colorspace_settings.name='Non-Color';n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.45;m.node_tree.links.new(tex.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],p.inputs['Normal'])
 M[name]=m;return m
def scanned(name,prefix,normal='normal_gl',color=(.5,.5,.5)):
 return material(name,color,scan={'Base Color':prefix+'_diff.jpg','Roughness':prefix+'_rough.jpg','Normal':prefix+'_'+normal+'.jpg'})
stone=scanned('Limestone concrete — scanned','concrete');wood=scanned('Weathered timber — scanned','wood');brick=scanned('Brick retaining walls — scanned','brick')
asphalt=material('Fine aggregate asphalt — scanned',(.13,.13,.13),scan={'Base Color':'asphalt_02_diff_2k.jpg','Roughness':'asphalt_02_rough_2k.jpg','Normal':'asphalt_02_nor_gl_2k.jpg'})
wall=material('Warm mineral plaster',(.75,.7,.60),scan={'Base Color':'plaster-color.jpg','Roughness':'plaster-rough.jpg','Normal':'plaster-normal.png'})
roof=material('Charcoal ceramic tile',(.09,.10,.11),scan={'Base Color':'roof-color.jpg','Roughness':'roof-rough.jpg','Normal':'roof-normal.png'})
grass=material('Variegated lakeside grass',(.25,.3,.105),scan={'Base Color':'grass-color.jpg','Roughness':'grass-rough.jpg','Normal':'grass-normal.png'})
soil=material('Moist dark earth',(.115,.09,.055),.95);sand=material('Warm paving limestone',(.49,.45,.35),.84,normal='plaster-normal.png')
glass=material('Recessed bronze glazing',(.095,.16,.17),.17,.38);glass.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.4
litglass=material('Occasional warm interiors',(.34,.22,.10),.23,.12,emit=.45)
curtain=material('Linen curtains',(.64,.57,.43),.98)
glassrail=material('Smoky balcony glass',(.18,.24,.23),.18,.3)
metal=material('Bronze anodised framing',(.16,.115,.065),.35,.7);black=material('Powder coated steel',(.035,.042,.04),.5,.5)
water=material('Taihu water',(.065,.145,.14),.17,.16,normal='water-normal.png');water.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1.333
pondmat=material('Garden pond reflections',(.025,.055,.043),.075,.10,normal='water-normal.png')
light=material('Warm practical lighting',(.95,.51,.18),.38,emit=2.0)
paint=material('Road markings',(.82,.79,.65),.85)
leaves=[material('Leaf tone '+str(i),c,.83) for i,c in enumerate([(.12,.22,.045),(.19,.28,.06),(.26,.32,.07),(.11,.19,.065),(.3,.34,.10)])]
trunk=material('Tree bark',(.16,.12,.065),.98,normal='plaster-normal.png')
for watermat in [water,pondmat]:
 waterbsdf=watermat.node_tree.nodes.get('Principled BSDF');waterbsdf.inputs['Coat Weight'].default_value=.7;waterbsdf.inputs['Coat Roughness'].default_value=.07
 for node in watermat.node_tree.nodes:
  if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=.12
# Efficient semantic material batches. Preserve editable meshes and bevel stacks in source.
B={}
def batch(group,name,mat,uv=3,bevel=0):
 key=(group,name,mat.name,uv,bevel)
 if key not in B:B[key]=[[],[]]
 return B[key]
def mesh(group,name,verts,faces,mat,uv=3,bevel=0):
 v,f=batch(group,name,mat,uv,bevel);off=len(v);v.extend(verts);f.extend([tuple(i+off for i in face) for face in faces])
def box(group,name,loc,size,mat,angle=0,bevel=.035,uv=3):
 x,y,z=loc;a,b,c=[q/2 for q in size];co=math.cos(angle);si=math.sin(angle)
 vv=[(x+dx*co-dy*si,y+dx*si+dy*co,z+dz) for dx,dy,dz in [(-a,-b,-c),(a,-b,-c),(a,b,-c),(-a,b,-c),(-a,-b,c),(a,-b,c),(a,b,c),(-a,b,c)]]
 mesh(group,name,vv,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,uv,0 if GRAY else bevel)
def polygon(group,name,pts,z,mat,depth=.1,uv=8):
 if sum(pts[i][0]*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*pts[i][1] for i in range(len(pts)))<0:pts=list(reversed(pts))
 n=len(pts);vv=[(x,y,z) for x,y in pts]+[(x,y,z-depth) for x,y in pts]
 mesh(group,name,vv,[tuple(range(n)),tuple(reversed(range(n,n*2)))]+[(i,i+n,(i+1)%n+n,(i+1)%n) for i in range(n)],mat,uv)
def tube(group,name,a,b,r1,r2,mat,sides=8):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,0,1)))
 if u.length<.001:u=axis.cross(Vector((0,1,0)))
 u.normalize();v=axis.cross(u);vv=[]
 for origin,r in [(a,r1),(b,r2)]:
  for i in range(sides):vv.append(tuple(origin+r*(u*math.cos(i*math.tau/sides)+v*math.sin(i*math.tau/sides))))
 faces=[tuple(reversed(range(sides))),tuple(range(sides,2*sides))]+[(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
 mesh(group,name,vv,faces,mat,3)
def smoothpoints(points,steps=12):
 p=[points[0]]+points+[points[-1]];out=[]
 for i in range(1,len(p)-2):
  for j in range(steps):
   t=j/steps;out.append(tuple(.5*((2*p[i][k])+(-p[i-1][k]+p[i+1][k])*t+(2*p[i-1][k]-5*p[i][k]+4*p[i+1][k]-p[i+2][k])*t*t+(-p[i-1][k]+3*p[i][k]-3*p[i+1][k]+p[i+2][k])*t*t*t) for k in range(2)))
 return out+[points[-1]]
def strip(name,points,width,mat,z=.48,group='05',curb=False):
 pp=smoothpoints(points);vv=[]
 for i,p in enumerate(pp):
  q=pp[min(i+1,len(pp)-1)];r=pp[max(0,i-1)];dx=q[0]-r[0];dy=q[1]-r[1];l=max(.001,math.hypot(dx,dy));nx=-dy/l;ny=dx/l
  vv.extend([(p[0]+nx*width/2,p[1]+ny*width/2,z),(p[0]-nx*width/2,p[1]-ny*width/2,z)])
 mesh(group,name,vv,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(pp)-1)],mat,4)
 if curb:
  for side in [0,1]:
   for i in range(0,len(pp)-1,2):
    a=vv[2*i+side];b=vv[min(2*(i+2)+side,len(vv)-1)];dist=math.dist(a,b)
    box(group,'Kerbstones',((a[0]+b[0])/2,(a[1]+b[1])/2,z+.10),(dist+.03,.22,.2),stone,math.atan2(b[1]-a[1],b[0]-a[0]),.025)
 return pp
# Stage 2: real metre-scale primary relationships derived from the aerial photograph.
polygon('01','East Taihu lake',[(-2500,-2500),(2500,-2500),(2500,2500),(-2500,2500)],0,water,.1,20)
shore=[(-121+7*math.sin(y/75),y) for y in range(-1200,1801,15)]
land=shore+[(1500,1800),(1500,-1200)]
polygon('01','Earth shoreline',land,.24,soil,1.2)
polygon('01','Ground cover',[(x+.4,y) for x,y in shore]+[(1500,1800),(1500,-1200)],.34,grass,.08,9)
strip('Lake embankment',[(-127,-175),(-129,-110),(-120,-40),(-115,40),(-115,115),(-127,210)],5,stone,.42,curb=not GRAY)
strip('West garden watercourse',[(-108,-105),(-110,-40),(-97,20),(-95,70),(-83,120)],15,pondmat,.42,group='01')
pond=[(-58,-22),(-52,-12),(-36,-6),(-15,-3),(9,-8),(27,-23),(17,-42),(-10,-51),(-39,-42)]
pond=smoothpoints(pond+[pond[0]],8)[:-1]
polygon('01','Central reflecting garden',pond,.43,pondmat,.15,10)
strip('Water garden coping',pond[::8]+[pond[0]],1.0,stone,.54)
# Building local coordinates, with five real floor bands and recessed balcony modules.
def building(name,a,b,width=15,floors=5,group='02'):
 cx=(a[0]+b[0])/2;cy=(a[1]+b[1])/2;L=math.dist(a,b);ang=math.atan2(b[1]-a[1],b[0]-a[0]);h=floors*3.4
 def at(x,y,z):return (cx+x*math.cos(ang)-y*math.sin(ang),cy+x*math.sin(ang)+y*math.cos(ang),z)
 def bb(n,loc,size,m,bev=.04):box(group,name+' / '+n,at(*loc),size,m,ang,bev)
 bb('Footing',(0,0,.55),(L+.8,width+.8,.4),stone)
 bb('Masonry core',(0,0,.7+h/2),(L,width-2.4,h),wall)
 if not GRAY:
  modules=max(2,int(L/3.7));step=L/modules
  for floor in range(floors):
   z=.7+floor*3.4
   bb('Projecting balcony slabs',(0,0,z+.13),(L+.45,width+.5,.26),stone,.06)
   for side in [-1,1]:
    bb('Balcony soffit light',(0,side*(width/2-.05),z+3.15),(L-.5,.10,.06),light,.01)
    for k in range(modules):
     x=-L/2+(k+.5)*step
     bb('Recessed glass doors',(x,side*(width/2-1.14),z+1.55),(step-.48,.07,2.65),litglass if random.random()<.19 else glass,.008)
     if k%3!=1:bb('Linen curtain panels',(x-step*.3,side*(width/2-1.035),z+1.56),(.36,.02,2.6),curtain,.005)
     for dx in [-step/2+.16,0,step/2-.16]:bb('Window mullions',(x+dx,side*(width/2-1.08),z+1.58),(.055,.11,2.74),metal,.012)
     bb('Balcony dividers',(x+step/2-.1,side*(width/2-.55),z+1.6),(.16,1.3,3.2),wall,.035)
     bb('Glass balustrades',(x,side*(width/2+.11),z+.83),(step-.2,.07,1.1),glassrail,.012)
     bb('Bronze handrails',(x,side*(width/2+.11),z+1.4),(step-.15,.08,.07),metal,.016)
     if floor==0 and k%3==0:bb('Interior amber glow',(x,side*(width/2-1.02),z+1.8),(.45,.03,1.1),light,.01)
  bb('Fascia',(0,0,h+.8),(L+.8,width+.85,.38),metal)
 hiproof(name,at(0,0,h+1.0),L+1.6,width+1.8,2.1,ang,group)
 return (cx,cy,h)
def hiproof(name,loc,L,W,H,angle,group):
 cx,cy,z=loc;local=[(-L/2,-W/2,0),(L/2,-W/2,0),(L/2,W/2,0),(-L/2,W/2,0),(-L/2+W*.35,0,H),(L/2-W*.35,0,H)]
 vv=[(cx+x*math.cos(angle)-y*math.sin(angle),cy+x*math.sin(angle)+y*math.cos(angle),z+zz) for x,y,zz in local]
 mesh(group,name+' / hipped roof',vv,[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4),(3,2,1,0)],roof,2)
 if not GRAY:
  for i,j in [(0,1),(1,2),(2,3),(3,0),(4,5)]:tube(group,name+' / roof edge',vv[i],vv[j],.12,.12,metal,8)
  # Visible tile ribs at human scale; normal maps carry the finer tile courses.
  for i in range(int(L/.85)):
   x=-L/2+.4+i*.85;ridge=max(0,min(H,(L/2-abs(x))*H/(W*.35)))
   for side in [-1,1]:
    def w(xx,yy,zz):return (cx+xx*math.cos(angle)-yy*math.sin(angle),cy+xx*math.sin(angle)+yy*math.cos(angle),z+zz)
    tube(group,name+' / tile ribs',w(x,side*W/2,.02),w(x,0,ridge+.02),.034,.034,roof,5)
# A bent chain; no pretend city district adjacent to the hotel.
building('West guest wing',(-85,-7),(-64,27),14,5)
building('Central guest wing',(-64,27),(-18,35),15,5)
building('East guest wing',(-18,35),(30,22),15,5)
building('Return guest wing',(30,22),(56,-13),15,5)
building('Garden event hall',(45,-57),(104,-57),29,2,'03')
box('03','Hall limestone gable',(45,-57,6.5),(1,29,12),wall)
box('03','Arrival lobby',(73,1,4.3),(26,23,7.2),wall)
hiproof('Arrival lobby',(73,1,8),28,25,2.5,0,'03')
box('03','Arrival canopy',(99,5,4.5),(22,13,.5),metal)
for x in [91,107]:
 for y in [-.5,10.5]:box('03','Canopy columns',(x,y,2.4),(.45,.45,4.2),stone,.03)
# Villas frame the southern and northern garden, rather than uniform toy houses.
for i,(x,y,ang) in enumerate([(-85,-88,.18),(-48,-84,.05),(-8,-81,-.05),(26,-77,-.15),(-73,66,0),(-37,78,.15),(3,84,-.07),(-57,110,.05),(-15,115,.1)]):
 dx=math.cos(ang)*9;dy=math.sin(ang)*9;building('Garden villa '+str(i+1),(x-dx,y-dy),(x+dx,y+dy),11,2,'04')
 box('04','Villa terraces',(x,y-8.5,.65),(20,6,.45),wood,ang,.04)
 for j in [-6,6]:box('04','Terrace chairs',(x+j,y-8,1.0),(1.8,.75,.6),wood,ang,.04)
# Believable circulating paths, curbs and arrival drive.
road=strip('Arrival driveway',[(133,-145),(123,-93),(120,-40),(117,7),(101,28),(96,58),(125,83),(149,124),(180,220),(215,400)],8,asphalt,.45,curb=not GRAY)
strip('Garden walking loop',[(-103,-102),(-84,-60),(-62,-48),(-62,-20),(-84,4),(-86,38),(-70,54),(-38,57),(4,59),(42,46),(77,31),(104,9)],3,stone,.55,curb=not GRAY)
strip('South garden path',[(-100,-109),(-65,-103),(-27,-100),(15,-96),(46,-92),(62,-74)],3,stone,.55,curb=not GRAY)
strip('Pond pedestrian bridge',[(-65,-54),(-59,-43),(-57,-24),(-55,-12)],3.0,wood,1.0)
strip('Villa garden path',[(-88,50),(-63,69),(-48,93),(-20,97),(13,104),(48,93),(84,68),(98,58)],2.8,stone,.52,curb=not GRAY)
if not GRAY:
 for i in range(0,len(road)-2,6):
  a,b=road[i],road[i+1];box('05','Centre lane dashes',(a[0],a[1],.48),(2.3,.13,.025),paint,math.atan2(b[1]-a[1],b[0]-a[0]),0)
 # Pedestrian crossing and parking pockets.
 for i in range(7):box('05','Crosswalk markings',(118,-13+i*.8,.48),(6,.36,.03),paint,0,0)
 box('05','Parking court',(148,-55,.40),(40,58,.13),asphalt,0,.02,6)
 for y in range(-77,-28,5):
  for x in [135,155]:
   box('05','Parking bay lines',(x,y,.49),(7,.10,.025),paint,0,0)
   if random.random()<.6:
    cmat=material('Car finish '+str(x)+str(y),random.choice([(.16,.19,.2),(.45,.43,.39),(.75,.73,.68)]),.3,.4)
    box('06','Parked car body',(x,y+2,1.05),(4.6,1.95,1.1),cmat,0,.25)
    box('06','Parked car glazing',(x-.3,y+2,1.75),(2.5,1.75,.68),glass,0,.22)
    for dx in [-1.4,1.35]:
     for dy in [-.94,.94]:tube('06','Car wheels',(x+dx,y+2+dy-.10,.83),(x+dx,y+2+dy+.10,.83),.38,.38,black,12)
 for i in range(8):box('03','Lobby entry stairs',(94+i*.38,-11,.50+i*.13),(.42,7,.15+i*.26),stone,0,.025)
 # The waterfront bridge is supported, with separate posts and handrails.
 bridge=[(-65,-54,1.0),(-59,-43,1.0),(-57,-24,1.0),(-55,-12,1.0)]
 for y in range(-49,-12,3):
  x=-58-(abs(y+25)*.12)
  for side in [-1,1]:
   tube('06','Bridge posts',(x+side*1.5,y,.2),(x+side*1.5,y,2.15),.09,.07,wood,8)
   if y<-15:tube('06','Bridge handrails',(x+side*1.5,y,2.15),(x+.36+side*1.5,y+3,2.15),.065,.065,wood,8)
 # Finely proportioned garden lights and benches.
 for x,y in [(-99,-95),(-83,-62),(-57,-54),(-26,-59),(9,-57),(42,-62),(-90,8),(-76,52),(-39,56),(13,55),(93,34),(104,-7),(114,-34),(114,-82),(-112,60),(-118,-48)]:
  tube('06','Garden lamp shafts',(x,y,.5),(x,y,3.4),.095,.06,black,10)
  box('06','Lamp housing',(x,y,3.55),(.38,.38,.4),black,0,.04)
  box('06','Lamp diffuser',(x,y,3.5),(.4,.4,.24),light,0,.04)
  if x<50:
   for j in range(4):box('06','Bench slats',(x+2,y+j*.15,.95),(1.9,.11,.08),wood,0,.02)
   for dx in [1.3,2.7]:box('06','Bench legs',(x+dx,y+.23,.7),(.10,.5,.5),black,0,.025)
# Hotel forecourt terraces and the low glazed garden pavilion visible in references.
strip('Guest wing forecourt',[(-76,-10),(-55,12),(-18,20),(22,7),(38,-17)],5.8,stone,.55,curb=not GRAY)
strip('Courtyard connection',[(-18,20),(-19,7),(-14,-2)],3.8,stone,.56)
box('02','Glass garden pavilion',(-61,-8,3.0),(19,13,5.2),glass,0,.08)
box('02','Pavilion timber cornice',(-61,-8,5.75),(20,14,.38),wood,0,.06)
if not GRAY:
 for x in range(-70,-51,2):
  box('02','Pavilion vertical fins',(x,-14.7,3.0),(.14,.32,5.4),metal,0,.015)
  box('02','Pavilion roof lattice',(x,-8,6.0),(.32,14,.15),wood,0,.02)
 for y in range(-14,-1,2):box('02','Pavilion cross lattice',(-61,y,6.13),(20,.3,.12),wood,0,.02)
 for x,y in [(-30,8),(-10,6),(15,-1),(29,-12)]:
  box('06','Terrace table',(x,y,1.25),(1.1,1.1,.10),wood,0,.025)
  tube('06','Table pedestal',(x,y,.55),(x,y,1.23),.08,.08,metal,8)
  for dx in [-1.1,1.1]:
   box('06','Terrace chair seat',(x+dx,y,.93),(.65,.7,.1),wood,0,.03)
   box('06','Terrace chair back',(x+dx,y+.3,1.28),(.65,.09,.7),wood,0,.03)
   for ox in [-.24,.24]:box('06','Terrace chair legs',(x+dx+ox,y,.70),(.05,.5,.4),metal,0,.015)

# Stage 6: botanical silhouettes built from branch networks and individual leaf geometry.
def leaf(center,size,mat):
 c=Vector(center);u=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(-.4,.5))).normalized()*size;v=u.cross(Vector((0,0,1))).normalized()*size*.42
 vv=[tuple(c-u),tuple(c-u*.3+v),tuple(c+u*.5+v*.75),tuple(c+u),tuple(c+u*.5-v*.75),tuple(c-u*.3-v)]
 mesh('07','Individual broad leaves',vv,[(0,1,2,3),(0,3,4,5)],mat,1)
def tree(x,y,h=8):
 base=.36;lean=random.uniform(-.45,.45)
 tube('07','Tree trunks',(x,y,base),(x+lean,y+.2,base+h*.66),.21,.075,trunk,10)
 clusters=[]
 for k in range(9):
  ang=k*2.399+random.uniform(-.3,.3);rad=random.uniform(1.2,2.5)*h/8;zz=base+h*(.58+random.random()*.31)
  tip=(x+math.cos(ang)*rad,y+math.sin(ang)*rad,zz);tube('07','Branch systems',(x+lean*.6,y+.1,base+h*.4),tip,.075,.018,trunk,7);clusters.append(tip)
 for cx,cy,cz in clusters:
  for j in range(78):
   theta=random.random()*math.tau;v=random.uniform(-1,1);r=random.random()**(1/3)*h*.17
   leaf((cx+math.cos(theta)*math.sqrt(1-v*v)*r,cy+math.sin(theta)*math.sqrt(1-v*v)*r,cz+v*r*.85),random.uniform(.27,.44)*h/8,random.choice(leaves))
if not GRAY:
 treepos=[(-121+7*math.sin(y/75)+5,y) for y in range(-130,151,14)]+[(x,-115) for x in range(-95,100,14)]+[(x,142) for x in range(-80,161,14)]+[(109,y) for y in [-114,-97,-76,-45,42,67,99]]
 treepos += [(-84,-46),(-81,-31),(-67,-66),(-41,-61),(-28,-65),(6,-58),(27,-53),(36,-39),(-98,35),(-78,48),(-62,49),(-47,52),(-23,55),(7,54),(38,48),(48,64),(62,78),(38,113),(69,122),(87,104),(-80,97),(-99,103),(-92,131),(29,-105),(61,-109)]
 # Natural groups soften the lawn without invented distant buildings.
 for i in range(115):
  x=random.uniform(-90,250);y=random.uniform(150,360);treepos.append((x,y))
 treepos += [(-63,-15),(-47,-53),(-38,-56),(-26,-57),(-14,-59),(1,-54),(17,-49),(29,-44),(38,-31),(-63,-33),(-76,-57),(-100,-78),(-42,61),(21,67),(39,79),(81,57)]
 for cx,cy in [(-85,-88),(-48,-84),(-8,-81),(26,-77),(-73,66),(-37,78),(3,84)]:
  for dx,dy in [(-12,8),(13,8),(-11,-11),(12,-11)]:treepos.append((cx+dx+random.uniform(-2,2),cy+dy+random.uniform(-2,2)))
 for i,(x,y) in enumerate(treepos):tree(x+random.uniform(-1,1),y+random.uniform(-1,1),random.uniform(6.2,10))
 for i in range(60):
  a=i*math.tau/60;x=-13+48*math.cos(a);y=-24+28*math.sin(a)
  if y>-8:continue
  for k in range(160):leaf((x+random.uniform(-1.4,1.4),y+random.uniform(-.7,.7),random.uniform(.6,1.5)),.24,random.choice(leaves))
 # Timber screen at the lobby and planter edging.
 for x in range(62,85):box('03','Lobby timber screen',(x,-11.7,4.4),(.12,.3,6),wood,0,.02)
 for x,y in [(-41,-58),(-8,-58),(19,-54),(80,29)]:
  box('06','Stone planters',(x,y,.8),(4,1.4,.85),stone,0,.12)
  box('06','Planter soil',(x,y,1.25),(3.7,1.12,.12),soil,0,.03)
  for j in range(90):leaf((x+random.uniform(-1.7,1.7),y+random.uniform(-.4,.4),random.uniform(1.3,1.8)),.2,random.choice(leaves))
# Materialize batches and intentionally scaled triplanar UVs into portable meshes.
for (group,name,matname,uv,bevel),(vv,ff) in B.items():
 meshdata=bpy.data.meshes.new(name);meshdata.from_pydata(vv,[],ff);meshdata.update();obj=bpy.data.objects.new(name,meshdata);COL[group].objects.link(obj);meshdata.materials.append(M[matname]);layer=meshdata.uv_layers.new(name='World metre UV')
 for face in meshdata.polygons:
  n=face.normal;axis=max(range(3),key=lambda k:abs(n[k]));axes=[a for a in range(3) if a!=axis]
  for li in face.loop_indices:
   v=meshdata.vertices[meshdata.loops[li].vertex_index].co;layer.data[li].uv=(v[axes[0]]/uv,v[axes[1]]/uv)
  if name in ['Tree trunks','Branch systems']:face.use_smooth=True
 if bevel:
  mod=obj.modifiers.new('Architectural edge chamfers','BEVEL');mod.width=bevel;mod.segments=2;mod.limit_method='ANGLE'
  mod=obj.modifiers.new('Weighted architectural normals','WEIGHTED_NORMAL');mod.keep_sharp=True
# Anchors are separately named and preserved for consumers.
anchors={'Hotel guest wings':[-15,31,24],'Water garden':[-20,-23,1],'Garden suites':[-28,-85,10],'Arrival lobby':[88,6,10],'East Taihu Lake':[-155,37,1],'Event hall':[77,-56,14]}
for name,loc in anchors.items():o=bpy.data.objects.new('Anchor / '+name,None);o.location=loc;COL['08'].objects.link(o)
# Photo-based daylight plus golden hour sun. Same direction exported for the runtime.
S.world=bpy.data.worlds.new('Golden hour natural sky');S.world.use_nodes=True;n=S.world.node_tree.nodes;l=S.world.node_tree.links;bg=n.get('Background');bg.inputs['Strength'].default_value=.65
sky=n.new('ShaderNodeTexEnvironment');sky.image=img('kloofendal_48d_partly_cloudy_puresky_2k.hdr');l.new(sky.outputs['Color'],bg.inputs['Color'])
def lightobj(name,kind,loc,energy,color,size=1):
 d=bpy.data.lights.new(name,kind);o=bpy.data.objects.new(name,d);COL['09'].objects.link(o);o.location=loc;d.energy=energy;d.color=color
 if kind=='AREA':d.shape='DISK';d.size=size
 return o
sun=lightobj('Low warm sun','SUN',(-120,-130,180),3.0,(1,.85,.66));sun.rotation_euler=(Vector((0,0,0))-Vector((-160,-230,160))).to_track_quat('-Z','Y').to_euler();sun.data.angle=math.radians(4)
# Practical lights illuminate arrival and pavilion; geometry emission stays restrained.
for x,y in [(90,4),(-53,13),(35,-2)]:
 o=lightobj('Warm lobby bounce','AREA',(x,y,6),170,(1,.58,.23),5)
# Presentation cameras, perspective keeps architectural scale believable.
views={'hero':((-205,-255,178),(-5,0,1),43),'overview':((-180,-255,355),(-5,12,0),47),'courtyard':((-92,-123,53),(-13,14,9),43)}
for name,(loc,target,lens) in views.items():
 d=bpy.data.cameras.new(name);o=bpy.data.objects.new('Camera / '+name,d);COL['09'].objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();d.lens=lens;d.clip_end=3000
 if name=='courtyard':d.dof.use_dof=True;d.dof.focus_distance=(Vector(target)-o.location).length;d.dof.aperture_fstop=11
S.camera=bpy.data.objects['Camera / hero'];S.render.engine='CYCLES';S.cycles.samples=64 if FINAL else 16;S.cycles.use_denoising=True
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='OPTIX'
 S.cycles.device='GPU'
except Exception: S.cycles.device='CPU'
S.cycles.max_bounces=7;S.cycles.transparent_max_bounces=4;S.view_settings.view_transform='AgX';S.view_settings.look='AgX - Medium High Contrast';S.render.image_settings.file_format='PNG';S.render.resolution_x=3840 if FINAL else 1280;S.render.resolution_y=2160 if FINAL else 720;S.render.resolution_percentage=100
S.render.film_transparent=False
if GRAY:
 neutral=material('Graybox neutral',(.5,.5,.5));S.view_layers[0].material_override=neutral
 for name in ['hero','overview']:
  S.camera=bpy.data.objects['Camera / '+name];S.render.filepath=str(OUT/('graybox-'+name+'.png'));bpy.ops.render.render(write_still=True)
 print('GRAYBOX_COMPLETE');sys.exit()
# Save packed editable source. Exclude lighting/cameras from the portable map.
for im in bpy.data.images:
 if im.source=='FILE':im.pack()
blend=R/'media/travel/suzhou-bay-realistic.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend))
for im in bpy.data.images:
 if im.name.startswith('asphalt_02') and im.size[0]>1024:im.scale(1024,1024);im.pack()
deps=bpy.context.evaluated_depsgraph_get()
for o in list(S.objects):
 if o.type=='MESH':
  evaluated=bpy.data.meshes.new_from_object(o.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps);o.modifiers.clear();o.data=evaluated
mergegroups={}
for o in list(S.objects):
 if o.type=='MESH':mergegroups.setdefault((o.users_collection[0].name,o.data.materials[0].name),[]).append(o)
for (group,matname),objs in mergegroups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();objs[0].name=group+' / '+matname
for o in bpy.context.selected_objects:o.select_set(False)
for o in S.objects:
 if o.type=='MESH' or o.name.startswith('Anchor /'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'public/travel/assets/suzhou-bay-realistic.glb'),export_format='GLB',use_selection=True,export_apply=True,export_cameras=False,export_lights=False,export_image_format='JPEG',export_jpeg_quality=82,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=20,export_draco_normal_quantization=12,export_draco_texcoord_quantization=16)
(R/'docs/travel/realism-anchors.json').write_text(json.dumps(anchors,indent=2),encoding='utf-8')
if '--export-only' in sys.argv:print('EXPORT_ONLY_COMPLETE');sys.exit()
for name in views:
 S.camera=bpy.data.objects['Camera / '+name];S.render.filepath=str(OUT/(name+('-4k' if FINAL else '-draft')+'.png'));bpy.ops.render.render(write_still=True)
from bpy_extras.object_utils import world_to_camera_view
projection={}
for name in views:
 c=bpy.data.objects['Camera / '+name];projection[name]={key:list(world_to_camera_view(S,c,Vector(value))) for key,value in anchors.items()}
(OUT/'label-projections.json').write_text(json.dumps(projection,indent=2))
print('REALISTIC_MAP_COMPLETE',len(B),'batches')
