"""Fixed-frame visual evidence, excluding distant ground from framing bounds."""
import bpy,sys,json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];source='--source' in sys.argv;tag='authored' if source else 'reimport';out=R/'output/travel/realism'/tag;out.mkdir(parents=True,exist_ok=True)
if source:bpy.ops.wm.open_mainfile(filepath=str(R/'media/travel/suzhou-bay-realistic.blend'))
else:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(R/'public/travel/assets/suzhou-bay-realistic.glb'))
S=bpy.context.scene
for o in list(S.objects):
 if o.type in ['LIGHT','CAMERA']:bpy.data.objects.remove(o,do_unlink=True)
S.world=bpy.data.worlds.new('Neutral daylight verification');S.world.use_nodes=True;S.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.8,1);S.world.node_tree.nodes['Background'].inputs[1].default_value=.55
bpy.ops.object.light_add(type='SUN',location=(-160,-230,160));sun=bpy.context.object;sun.rotation_euler=(Vector((0,0,0))-sun.location).to_track_quat('-Z','Y').to_euler();sun.data.energy=2;sun.data.angle=.07
S.render.engine='CYCLES';S.cycles.samples=12;S.cycles.use_denoising=True
try:
 pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='OPTIX';pref.get_devices()
 for d in pref.devices:d.use=d.type=='OPTIX'
 S.cycles.device='GPU'
except:pass
S.view_settings.view_transform='AgX';S.render.resolution_x=720;S.render.resolution_y=540;S.render.resolution_percentage=100;S.render.image_settings.file_format='PNG'
bpy.ops.object.camera_add();c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=320;c.data.clip_end=2500;S.camera=c
for name,loc in [('hero',(-220,-260,200)),('front',(0,-350,55)),('back',(0,350,55)),('left',(-350,0,55)),('right',(350,0,55)),('top',(0,0,450))]:
 c.location=loc;c.rotation_euler=(Vector((0,10,4))-c.location).to_track_quat('-Z','Y').to_euler();S.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
print('VISUAL_VALIDATION_COMPLETE',tag)
