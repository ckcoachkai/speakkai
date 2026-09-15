"""Blender source for the travel guide's schematic map, not surveyed geography.
Run: blender --background --python scripts/build-travel-model.py
"""
import bpy, math
from pathlib import Path
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def material(name, color, metallic=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metallic;p.inputs['Roughness'].default_value=.55
    return m
land=material('Garden green',(.16,.32,.25));water=material('Taihu blue',(.025,.35,.46),.3)
stone=material('Resort sandstone',(.72,.59,.39));roof=material('Dark roof',(.075,.14,.17))
city=material('Qibao marker',(.57,.72,.68));leaf=material('Tree canopy',(.13,.3,.15))
def block(name,x,y,z,sx,sy,sz,mat):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=name;o.scale=(sx,sy,sz)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    bevel=o.modifiers.new('Soft edges','BEVEL');bevel.width=.045;bevel.segments=2
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
# Blender Z-up is exported as glTF Y-up. Coordinates match the route viewer.
block('Diagram base',0,0,-.3,17,9,.35,land)
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=3.7,depth=.035,location=(-4,.4,-.09))
bpy.context.object.name='East Taihu schematic';bpy.context.object.scale=(1,1.05,1);bpy.context.object.data.materials.append(water)
for i in range(5):
    h=.6+i*.13
    block('Qibao schematic block',5+i%3*.7,-2.7-(i//3)*.8,h/2,.5,.6,h,city)
for i in range(7):
    angle=(i-3)*.12;x=-1.45+math.sin(angle)*2.1;y=2.0+math.cos(angle)*.2
    o=block('Resort schematic wing',x,y,.35,.38,.52,.7,stone);o.rotation_euler.z=-angle
    o=block('Roof',x,y,.73,.43,.59,.08,roof);o.rotation_euler.z=-angle
for x,y in [(-.3,1),(-.1,2.9),(-2.7,2.8),(1,1.8),(1.4,-1),(3,-2),(3.6,2.8),(-.8,-2.5)]:
    block('Tree trunk',x,y,.2,.07,.07,.4,stone)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.27,location=(x,y,.53));bpy.context.object.data.materials.append(leaf)
root=Path(__file__).resolve().parents[1]
out=root/'public/travel/assets/suzhou-route.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(root/'media/travel/suzhou-route.blend'))
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_apply=True)
print('Exported schematic travel model:',out)

