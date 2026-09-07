"""Deterministic fictional rehearsal diorama. Blender 5.2.1; run -- --graybox for proportion review."""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
GRAY='--graybox' in sys.argv
OUT=ROOT/('graybox' if GRAY else 'output')
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=12 if GRAY else 32
scene.cycles.use_denoising=True
scene.render.resolution_x=600 if GRAY else 1200
scene.render.resolution_y=450 if GRAY else 900
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=0
scene.world=bpy.data.worlds.new('Soft studio world')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(0.34,0.40,0.50,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=0.45

def material(name,color,rough=0.5,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*((0.48,0.5,0.52) if GRAY else color),1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m
blue=material('Midnight blue matte',(0.02,0.055,0.14))
wood=material('Warm timber',(0.46,0.22,0.075),0.48)
gold=material('Brushed warm brass',(0.65,0.43,0.09),0.3,0.75)
metal=material('Dark powder coated metal',(0.055,0.075,0.105),0.3,0.7)
fabric=material('Blue upholstered fabric',(0.07,0.21,0.42),0.87)
if not GRAY:
    nodes=wood.node_tree.nodes;links=wood.node_tree.links
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=16;noise.inputs['Detail'].default_value=2
    coord=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(1,16,3)
    ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(0.27,0.105,0.027,1);ramp.color_ramp.elements[1].color=(0.51,0.28,0.12,1)
    links.new(coord.outputs['Generated'],mapping.inputs[0]);links.new(mapping.outputs[0],noise.inputs['Vector']);links.new(noise.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs[0],nodes['Principled BSDF'].inputs['Base Color'])

def finish(obj,name,mat,bevel=0.04):
    obj.name=name;obj.data.materials.append(mat)
    if bevel and not GRAY:
        mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=bevel;mod.segments=3
        obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
    return obj
def box(name,loc,scale,mat,bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);obj=bpy.context.object;obj.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,mat,min(bevel,min(scale)*0.2))
def cylinder(name,loc,radius,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96 if not GRAY else 24,radius=radius,depth=depth,location=loc)
    obj=finish(bpy.context.object,name,mat,min(0.025,radius*0.15,depth*0.1))
    for p in obj.data.polygons:p.use_smooth=len(p.vertices)==4
    return obj
def rod(name,a,b,radius,mat):
    delta=Vector(b)-Vector(a);obj=cylinder(name,(Vector(a)+Vector(b))/2,radius,delta.length,mat)
    obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return obj

box('Presentation plinth',(0,0,0),(8.8,8.4,0.32),blue,0.20)
box('Brass plinth inset',(0,0,0.17),(8.6,8.2,0.035),gold,0.13)
box('Main floor',(0,0,0.23),(8.5,8.1,0.1),wood,0.1)
box('Stage structure',(0,1.5,0.6),(7.5,4.6,0.64),blue,0.17)
box('Stage timber surface',(0,1.5,0.95),(7.48,4.58,0.09),wood,0.13)
box('Lower broad step',(0,-1.23,0.43),(3.8,0.74,0.28),wood,0.07)
box('Upper broad step',(0,-0.93,0.7),(3.8,0.5,0.29),wood,0.06)
box('Acoustic back wall',(0,3.57,2.45),(7.5,0.25,3.0),blue,0.1)
if not GRAY:
    for i in range(31):
        box(f'Timber acoustic slat {i+1:02}',(-3.55+i*0.237,3.39,2.45),(0.075,0.13,2.8),wood,0.018)
    box('Backdrop brass upper rail',(0,3.33,3.91),(7.45,0.07,0.035),gold,0.01)
cylinder('Standing cue',(0,0.7,1.008),0.55,0.024,gold)
cylinder('Lectern foot',(-2,1.0,1.05),0.43,0.12,metal)
rod('Lectern upright',(-2,1.0,1.11),(-2,1.0,2.10),0.06,metal)
top=box('Lectern angled writing surface',(-2,1.0,2.14),(0.95,0.60,0.09),wood,0.04);top.rotation_euler.x=math.radians(12)
if not GRAY:
    rod('Microphone flexible neck',(-1.72,1.1,2.2),(-1.62,0.92,2.53),0.018,metal)
    rod('Microphone head',(-1.62,0.92,2.53),(-1.6,0.82,2.54),0.035,metal)
    box('Lectern page lip',(-2,0.72,2.12),(0.88,0.035,0.09),metal,0.01)
for row in range(2):
    for col in range(3):
        x=(col-1)*1.8;y=-2.3-row*1.2;name=f'Chair {row+1}-{col+1}'
        box(name+' seat',(x,y,0.84),(0.76,0.70,0.14),fabric,0.10)
        box(name+' back',(x,y-0.31,1.2),(0.76,0.13,0.66),fabric,0.1)
        if not GRAY:
            for dx in [-0.27,0.27]:
                for dy in [-0.23,0.23]:
                    rod(name+f' leg {dx} {dy}',(x+dx,y+dy,0.28),(x+dx,y+dy,0.8),0.028,metal)
            for dx in [-0.28,0.28]:rod(name+f' back support {dx}',(x+dx,y-0.29,0.79),(x+dx,y-0.29,1.4),0.025,metal)

def light(name,loc,energy,size):
    bpy.ops.object.light_add(type='AREA',location=loc);obj=bpy.context.object;obj.name=name;obj.data.energy=energy;obj.data.shape='DISK';obj.data.size=size;obj.rotation_euler=(Vector((0,0,0.8))-obj.location).to_track_quat('-Z','Y').to_euler()
light('Large warm key',(-6,-5,11),1900,7)
light('Soft listener fill',(7,-3,7),1250,6)
light('Backdrop rim',(0,7,9),1700,5)
bpy.ops.object.camera_add(location=(10,-14,11));camera=bpy.context.object;camera.name='Hero camera';camera.data.type='ORTHO';camera.data.ortho_scale=14.5
camera.rotation_euler=(Vector((0,0,1.1))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rehearsal-stage.blend'))
if not GRAY:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        if obj.type=='MESH':obj.select_set(True)
    # GLB uses a deliberate solid timber approximation; Blender retains procedural grain.
    color_input=wood.node_tree.nodes['Principled BSDF'].inputs['Base Color']
    source_socket=color_input.links[0].from_socket if color_input.links else None
    for connection in list(color_input.links):wood.node_tree.links.remove(connection)
    color_input.default_value=(0.46,0.22,0.075,1)
    bpy.ops.export_scene.gltf(filepath=str(OUT/'rehearsal-stage.glb'),export_format='GLB',use_selection=True,export_apply=True)
    if source_socket:wood.node_tree.links.new(source_socket,color_input)
views={'hero':(10,-14,11)}
if GRAY:views.update({'front':(0,-16,5),'side':(16,0,5),'top':(0,0,18)})
for name,loc in views.items():
    camera.location=loc;camera.rotation_euler=(Vector((0,0,1.1))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('STAGE_DONE',str(OUT))
