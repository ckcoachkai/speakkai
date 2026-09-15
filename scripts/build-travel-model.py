"""Original artistic route landscape. Not surveyed geography or a hotel reconstruction.
Blender 5.2.1; deterministic rerunnable authoring and fresh-import evidence.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
random.seed(19)
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'output/travel/blender';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def mat(name,color,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
sand=mat('Warm cut limestone',(.62,.58,.43));edge=mat('Layered earth',(.34,.4,.27));grass=mat('Soft sage lawns',(.39,.48,.28));water=mat('Jade lake',(.075,.34,.31),.2,.18);pool=mat('Clear pool turquoise',(.13,.57,.56),.17,.1);wall=mat('Ivory limewashed walls',(.86,.8,.65));roof=mat('Charcoal ceramic roofs',(.11,.17,.15),.48);wood=mat('Warm cedar',(.31,.21,.12));glass=mat('Deep bronze glazing',(.13,.24,.2),.23,.3);gold=mat('Brass route',(.77,.5,.16),.28,.5);leafm=[mat('Leaves '+str(i),c) for i,c in enumerate([(.22,.36,.17),(.3,.43,.22),(.46,.52,.25),(.18,.31,.21)])];white=mat('Path limestone',(.8,.77,.62));asphalt=mat('Road charcoal',(.22,.28,.24));citymat=mat('City warm stone',(.58,.65,.55));light=mat('Window amber',(.96,.65,.26));light.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(.96,.57,.2,1);light.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.25

def finish(o,name,m):
 o.name=name;o.data.materials.append(m);return o

def block(name,loc,scale,m,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,m)
 if bevel:mod=o.modifiers.new('Crafted rounded edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o

def polygon(name,pts,z,depth,m):
 verts=[(x,y,z) for x,y in pts]+[(x,y,z-depth) for x,y in pts];n=len(pts);faces=[tuple(range(n)),tuple(reversed(range(n,2*n)))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)];mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,m);return o

def path(name,pts,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=16;c.bevel_depth=r;c.bevel_resolution=3;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for b,p in zip(s.bezier_points,pts):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o

def ellipsoid(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=loc);o=bpy.context.object;o.scale=scale;finish(o,name,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
# Stage 1/2: composition and proportion, organic shoreline on a floating cutaway.
block('Floating landscape plinth',(0,0,-.48),(17,10,.65),edge,.3)
block('Stone border',(0,0,-.13),(17.1,10.1,.16),sand,.28)
block('Lake surface',(-.1,0,-.025),(16.65,9.65,.1),water,.24)
shore=[(-2+math.sin(y*.65)*.4,y) for y in [-4.7+i*.147 for i in range(65)]]
pts=shore+[(8.2,4.7),(8.2,-4.7)]
polygon('Organic shoreline bank',pts,.075,.12,sand)
pts2=[(x+.15,y) for x,y in shore]+[(8.12,4.6),(8.12,-4.6)]
polygon('Garden landmass',pts2,.13,.09,grass)
# Islands, curved paths and finely layered ripples.
for j in range(3):
 cx=-6.1+j*1.8;cy=2.8+j*.5;pp=[(cx+math.cos(a)*(.7+j*.12),cy+math.sin(a)*(.42+j*.08)) for a in [i*math.tau/48 for i in range(48)]];polygon('Low wooded island '+str(j),pp,.1,.13,grass)
for i in range(7):
 x=-6.3+i*.7;y=-2.6+(i%3)*.4
 path('Subtle water ripple',[(x-.35,y,.045),(x,y+.04,.045),(x+.35,y,.045)],.007,mat('Ripple '+str(i),(.24,.48,.41),.4))
promenade=path('Lakeside promenade',[(-1.7,-4.3,.18),(-1.85,-2,.18),(-1.6,0,.18),(-1.9,2,.18),(-1.5,4.1,.18)],.115,white)
promenade.scale.z=.12;promenade.location.z=.15
roadpts=[(6.2,-3.5,.17),(5,-2.8,.17),(4,-1,.17),(2.7,.2,.17),(1.4,1.6,.17),(.5,2.3,.17)]
road=path('Driveway asphalt',roadpts,.2,asphalt);road.scale.z=.12;road.location.z=.15
path('Continuous brass itinerary',[(x,y,.195) for x,y,z in roadpts],.025,gold)
# Stage 3/4: courtyard resort; walls, windows, swept tile roofs, colonnades.
def building(x,y,w,d,h,name):
 block(name+' stone footing',(x,y,.2),(w+.12,d+.12,.14),sand)
 block(name+' main walls',(x,y,.22+h/2),(w,d,h),wall)
 for side in [-1,1]:
  for k in range(max(2,int(w/.27))):
   xx=x-w/2+.15+k*.27
   if xx>x+w/2-.1:continue
   block(name+' glazing',(xx,y+side*(d/2+.008),.35+h*.43),(.16,.018,h*.6),glass,.008)
   block(name+' window lintel',(xx,y+side*(d/2+.02),.36+h*.75),(.19,.035,.025),wood,.003)
 # Curved Chinese-inspired eaves generated as a grid, raised corners and overhang.
 verts=[];faces=[];nx=14;ny=12
 for ix in range(nx+1):
  u=ix/nx*2-1
  for iy in range(ny+1):
   v=iy/ny*2-1;zz=.22+h+.18*(1-abs(v))+.09*abs(v)**4+.07*abs(u)**6
   verts.append((x+u*(w/2+.13),y+v*(d/2+.16),zz))
 for ix in range(nx):
  for iy in range(ny):a=ix*(ny+1)+iy;faces.append((a,a+1,a+ny+2,a+ny+1))
 me=bpy.data.meshes.new(name+' swept roof');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name+' swept roof',me);bpy.context.collection.objects.link(o);o.data.materials.append(roof);sol=o.modifiers.new('Roof thickness','SOLIDIFY');sol.thickness=.045
 for p in me.polygons:p.use_smooth=True
 path(name+' ridge cap',[(x-w/2-.08,y,.22+h+.21),(x,y,.22+h+.2),(x+w/2+.08,y,.22+h+.21)],.027,roof)
 for k in range(int(w/.13)):
  xx=x-w/2+k*.13
  path(name+' roof seams',[(xx,y-d/2-.13,.22+h+.1),(xx,y,.22+h+.195),(xx,y+d/2+.13,.22+h+.1)],.009,roof)
 return o
building(-.25,2.9,2.45,.72,.9,'Resort north wing');building(.05,1.15,1.85,.66,.68,'Resort south wing');building(1.0,2.15,.65,1.45,.78,'Resort east wing')
block('Courtyard terrace',(-.15,2.05,.18),(1.6,1.02,.09),white)
block('Courtyard reflecting pool',(-.3,2.03,.24),(.8,.58,.025),pool,.08)
for x in [-.78,.25]:
 for y in [1.69,2.4]:block('Courtyard planted box',(x,y,.29),(.22,.19,.15),sand,.02);ellipsoid('Courtyard shrub',(x,y,.45),(.16,.15,.17),leafm[1])
# Lakeside swimming pavilion is artistic, not a claim about hotel facilities.
block('Illustrated pool deck',(-.6,-.95,.19),(1.6,1.8,.1),white)
block('Illustrated swimming pool',(-.75,-.95,.26),(.78,1.28,.04),pool,.01)
for y in [-1.45,-1.12,-.79,-.46]:
 block('Pool lounger',(.01,y,.3),(.23,.13,.1),wall,.025)
 block('Lounger backrest',(.08,y,.37),(.06,.13,.17),wall,.018)
building(.65,-.9,.7,1.15,.42,'Garden pavilion')
# Jetty with individual planks and supported railings.
for i in range(22):block('Cedar jetty plank',(-2.2-i*.095,.3,.23),(.085,.44,.055),wood,.008)
for x in [-2.25,-2.9,-3.65,-4.18]:
 for y in [.09,.51]:block('Jetty support',(x,y,.09),(.06,.06,.37),wood,.008)
# City district, podiums, articulated facades and roof caps.
for i,(x,y,h) in enumerate([(5.7,-3.6,1.4),(6.65,-3.5,2),(7.45,-3.4,1.1),(6,-2.6,.9),(7,-2.5,1.45)]):
 block('City podium '+str(i),(x,y,.23),(.7,.68,.2),sand)
 block('City tower '+str(i),(x,y,.32+h/2),(.53,.5,h),citymat)
 block('City roof '+str(i),(x,y,.34+h),(.59,.56,.09),roof)
 for z in range(int(h/.19)):
  block('City glazing band',(x,y-.255,.45+z*.19),(.4,.015,.085),glass,.004)
# Tree canopies are smooth clumps, planted into terrain.
def tree(x,y,size=1):
 block('Cedar trunk',(x,y,.13+.25*size),(.055*size,.055*size,.5*size),wood,.01)
 for dx,dy,dz,r in [(0,0,.59,.27),(.12,.04,.48,.2),(-.1,-.06,.5,.21)]:ellipsoid('Soft tree crown',(x+dx*size,y+dy*size,.13+dz*size),(r*size,r*.8*size,r*1.15*size),random.choice(leafm))
for i in range(72):
 x=random.uniform(2,7.8);y=random.uniform(-4.4,4.4)
 if y<-2 and x>5:continue
 if abs(y-(x-2)*-.9)<.4:continue
 tree(x,y,random.uniform(.6,1.15))
for x,y in [(-1.2,3.9),(-1,3.6),(-1.35,1.1),(-1.4,-2.2),(-1.1,-3.2),(-1.2,-4),(-4.9,2.9),(-4.6,3),(-4.1,3.1)]:tree(x,y,.85)
# Small pathway lamps, gardens and crafted junctions.
for y in [-3.8,-2.6,-1.9,.8,3.7]:
 block('Promenade lamp post',(-1.55,y,.43),(.025,.025,.54),roof,.005)
 ellipsoid('Warm lamp globe',(-1.55,y,.72),(.065,.065,.075),light)
# Stage 5/6: material-defined surfaces, studio light and camera.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.color=(.65,.7,.57);scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.73,.62,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
bpy.ops.object.light_add(type='AREA',location=(-6,-4,12));bpy.context.object.name='Large warm softbox';bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=8
bpy.ops.object.camera_add(location=(-13,-17,16));cam=bpy.context.object;cam.name='Editorial hero camera';cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=21.5;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.resolution_x=3840;scene.render.resolution_y=2160;scene.render.resolution_percentage=100;scene.render.film_transparent=False
# Stage 7: durable source and independent export.
blend=ROOT/'media/travel/suzhou-route.blend';glb=ROOT/'public/travel/assets/suzhou-route.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(blend));bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',export_apply=True,export_cameras=False,export_lights=False)
scene.render.filepath=str(OUT/'hero-4k.png');bpy.ops.render.render(write_still=True)
# Fixed evidence angles at modest resolution.
scene.render.resolution_x=960;scene.render.resolution_y=720;scene.cycles.samples=12
for name,loc in [('front',(0,-23,9)),('back',(0,23,9)),('left',(-23,0,9)),('right',(23,0,9)),('top',(0,0,26))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=21.5;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('TRAVEL_RENDER_COMPLETE')
