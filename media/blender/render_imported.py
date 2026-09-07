"""Fresh GLB evidence under lights appropriate to the 8.8m model scale."""
import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent/'output'
OUT=ROOT/'evidence';OUT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'rehearsal-stage.glb'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=384;scene.render.resolution_y=384;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
scene.world=bpy.data.worlds.new('Neutral validation world');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(0.34,0.4,0.5,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=0.45
for loc,energy,size in [((-6,-5,11),1900,7),((7,-3,7),1250,6),((0,7,9),1700,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.data.energy=energy;lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1.1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=12.5;scene.camera=camera
for name,loc in {'perspective':(10,-14,11),'front':(0,-18,2),'back':(0,18,2),'left':(-18,0,2),'right':(18,0,2),'top':(0,0,18)}.items():
    camera.location=loc;camera.rotation_euler=(Vector((0,0,1.7))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
