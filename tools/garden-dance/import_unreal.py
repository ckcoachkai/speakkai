"""Run in UnrealEditor-Cmd with -run=pythonscript -script=<this file>.
Creates an editable skeletal mesh, original dance sequences and a studio level.
"""
import unreal, json
from pathlib import Path

project = Path(unreal.Paths.project_dir())
source = project.parent/'Garden-Dancer.fbx'
options=unreal.FbxImportUI()
options.set_editor_property('import_mesh',True)
options.set_editor_property('import_as_skeletal',True)
options.set_editor_property('mesh_type_to_import',unreal.FBXImportType.FBXIT_SKELETAL_MESH)
options.set_editor_property('import_animations',True)
options.set_editor_property('import_materials',True)
options.set_editor_property('import_textures',True)
options.set_editor_property('automated_import_should_detect_type',False)
options.skeletal_mesh_import_data.set_editor_property('import_morph_targets',True)
task=unreal.AssetImportTask()
task.set_editor_property('filename',str(source))
task.set_editor_property('destination_path','/Game/GardenDance')
task.set_editor_property('automated',True)
task.set_editor_property('replace_existing',True)
task.set_editor_property('save',True)
task.set_editor_property('options',options)
unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
assets=list(unreal.EditorAssetLibrary.list_assets('/Game/GardenDance',recursive=True))
meshes=[];animations=[]
for path in assets:
    asset=unreal.load_asset(path)
    if isinstance(asset,unreal.SkeletalMesh):meshes.append(asset)
    if isinstance(asset,unreal.AnimSequence):animations.append(asset)
if not meshes or len(animations)<4:raise RuntimeError('Missing skeletal mesh or four dance clips: '+str(assets))
subsystem=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
map_path='/Game/GardenDance/DanceStudio'
if unreal.EditorAssetLibrary.does_asset_exist(map_path):
    if not subsystem.load_level(map_path):raise RuntimeError('Could not load studio map')
else:
    if not subsystem.new_level(map_path):raise RuntimeError('Could not create studio map')
actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
for actor in actors.get_all_level_actors():
    if isinstance(actor,(unreal.SkeletalMeshActor,unreal.StaticMeshActor,unreal.Light,unreal.CineCameraActor)):
        actors.destroy_actor(actor)
hero=actors.spawn_actor_from_class(unreal.SkeletalMeshActor,unreal.Vector(0,0,0))
hero.set_actor_label('Garden Dancer - articulated original rig')
component=hero.skeletal_mesh_component
component.set_skeletal_mesh_asset(meshes[0])
component.set_animation_mode(unreal.AnimationMode.ANIMATION_SINGLE_NODE)
component.override_animation_data(animations[0],True,True,0,1)
floor=actors.spawn_actor_from_class(unreal.StaticMeshActor,unreal.Vector(0,0,-6))
floor.set_actor_label('Dance plinth')
floor.static_mesh_component.set_static_mesh(unreal.load_asset('/Engine/BasicShapes/Cylinder.Cylinder'))
floor.set_actor_scale3d(unreal.Vector(1.9,1.9,.10))
key=actors.spawn_actor_from_class(unreal.DirectionalLight,unreal.Vector(-180,-220,350),unreal.Rotator(-50,-25,0))
key.light_component.set_editor_property('intensity',7)
sky=actors.spawn_actor_from_class(unreal.SkyLight,unreal.Vector(0,0,250))
sky.light_component.set_editor_property('intensity',1.5)
camera=actors.spawn_actor_from_class(unreal.CineCameraActor,unreal.Vector(320,-430,200),unreal.Rotator(-12,125,0))
camera.set_actor_label('Dance studio camera')
if not subsystem.save_current_level():raise RuntimeError('Could not save studio map')
unreal.EditorAssetLibrary.save_directory('/Game/GardenDance',only_if_is_dirty=False,recursive=True)
report={'engine':unreal.SystemLibrary.get_engine_version(),'skeletal_meshes':[m.get_path_name() for m in meshes],'animations':[a.get_path_name() for a in animations],'map':'/Game/GardenDance/DanceStudio','assets':assets}
(project.parent/'unreal-validation.json').write_text(json.dumps(report,indent=2))
unreal.log('GARDEN_DANCE_VALIDATED '+json.dumps(report))
