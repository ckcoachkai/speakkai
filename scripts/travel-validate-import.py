import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];out=root/'output/travel/blender/reimport-lit';out.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/'public/travel/assets/suzhou-route.glb'))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True
w=bpy.data.worlds.new('Review world');s.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.68,.73,.62,1);w.node_tree.nodes['Background'].inputs[1].default_value=.65
bpy.ops.object.light_add(type='AREA',location=(-6,-4,12));bpy.context.object.data.energy=1800;bpy.context.object.data.size=8
bpy.ops.object.camera_add();c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=21.5;s.camera=c;s.view_settings.view_transform='AgX';s.render.resolution_x=960;s.render.resolution_y=720;s.render.resolution_percentage=100
for name,loc in [('hero',(-13,-17,16)),('front',(0,-23,9)),('back',(0,23,9)),('left',(-23,0,9)),('right',(23,0,9)),('top',(0,0,26))]:
 c.location=loc;c.rotation_euler=(Vector((0,0,0))-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)

