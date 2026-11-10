"""Original articulated mascot cast. Run Blender --background --python this.py -- ROOT OUTPUT.
Z-up authoring, -Y forward; glTF exports Y-up. No third-party character meshes/motions.
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector, Matrix

ARGS = sys.argv[sys.argv.index('--')+1:]
ROOT, OUT = map(Path, ARGS[:2])
ASSETS = ROOT/'public/games/assets/dancers'
ASSETS.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
FPS, FRAMES = 30, 240
SPECIES = ['cat','dog','rabbit','lion','tiger','panda','cheetah','puma','leopard','eagle']
COLORS = {'cat':(.49,.56,.61,1),'dog':(.55,.30,.15,1),'rabbit':(.82,.79,.74,1),'lion':(.68,.39,.12,1),'tiger':(.90,.40,.06,1),'panda':(.85,.84,.78,1),'cheetah':(.74,.55,.23,1),'puma':(.54,.41,.31,1),'leopard':(.67,.46,.17,1),'eagle':(.83,.81,.73,1)}

def material(name, color, quadrant=None, rough=.6):
    mat=bpy.data.materials.new(name);mat.diffuse_color=color;mat.use_nodes=True
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=color;p.inputs['Roughness'].default_value=rough
    p.inputs['Specular IOR Level'].default_value=.28
    texpath=ASSETS/'material-atlas.png'
    if quadrant is not None and texpath.exists():
        uv=nodes.new('ShaderNodeTexCoord');scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(.48,.48,1)
        add=nodes.new('ShaderNodeVectorMath');add.operation='ADD';add.inputs[1].default_value=(.01+(quadrant%2)*.5,.51-(quadrant//2)*.5,0)
        tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(texpath),check_existing=True)
        links.new(uv.outputs['UV'],scale.inputs[0]);links.new(scale.outputs[0],add.inputs[0]);links.new(add.outputs[0],tex.inputs['Vector'])
        # Bake quadrant UVs into geometry below. glTF can then use a plain texture node.
        links.remove(tex.inputs['Vector'].links[0]);links.new(uv.outputs['UV'],tex.inputs['Vector'])
        links.new(tex.outputs['Color'],p.inputs['Base Color']);mat['quadrant']=quadrant
    return mat

def build(species):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.render.fps=FPS;scene.frame_start=1;scene.frame_end=FRAMES+1
    mats={
      'fur':material('Fur',COLORS[species],0),
      'cream':material('Muzzle',(.83,.78,.66,1)),
      'dark':material('Nose and pads',(.025,.033,.041,1),rough=.4),
      'cloth':material('Sweatshirt',(.045,.065,.09,1),1),
      'pants':material('Joggers',(.035,.049,.065,1),1),
      'shoe':material('Sneaker leather',(.91,.91,.85,1),2),
      'accent':material('Player accent',(.09,.61,.48,1),3),
      'pink':material('Inner ear',(.52,.27,.29,1)),
      'eye':material('Eye white',(.94,.94,.89,1),rough=.25),
      'iris':material('Amber iris',(.32,.15,.035,1),rough=.19),
    }
    # Fur coloration is species-specific; detailed atlas provides subtle bump, not replacement color.
    fm=mats['fur'];pn=fm.node_tree.nodes.get('Principled BSDF')
    if pn.inputs['Base Color'].is_linked:
        fm.node_tree.links.remove(pn.inputs['Base Color'].links[0]);tex=next(n for n in fm.node_tree.nodes if n.type=='TEX_IMAGE')
        bump=fm.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.012
        fm.node_tree.links.new(tex.outputs['Color'],bump.inputs['Height']);fm.node_tree.links.new(bump.outputs['Normal'],pn.inputs['Normal'])
    armdata=bpy.data.armatures.new('GardenSkeleton');rig=bpy.data.objects.new('GardenDancer',armdata);scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    bones={}
    def bone(name,head,tail,parent=None):
        b=armdata.edit_bones.new(name);b.head=head;b.tail=tail
        if parent:b.parent=armdata.edit_bones[parent]
        bones[name]=(Vector(head),Vector(tail));return name
    bone('root',(0,0,0),(0,0,.2));bone('pelvis',(0,0,1.00),(0,0,1.16),'root')
    bone('spine_01',(0,0,1.16),(0,0,1.35),'pelvis');bone('spine_02',(0,0,1.35),(0,0,1.53),'spine_01')
    bone('neck',(0,0,1.53),(0,0,1.67),'spine_02');bone('head',(0,0,1.67),(0,0,1.99),'neck')
    bone('jaw',(0,-.07,1.78),(0,-.18,1.71),'head')
    for s,x in [('L',-1),('R',1)]:
        bone('clavicle_'+s,(0,0,1.49),(x*.25,0,1.48),'spine_02')
        bone('upper_arm_'+s,(x*.25,0,1.48),(x*.41,0,1.19),'clavicle_'+s)
        bone('forearm_'+s,(x*.41,0,1.19),(x*.47,-.03,.94),'upper_arm_'+s)
        bone('hand_'+s,(x*.47,-.03,.94),(x*.48,-.04,.82),'forearm_'+s)
        bone('thigh_'+s,(x*.14,0,1.02),(x*.16,-.055,.58),'pelvis')
        bone('shin_'+s,(x*.16,-.055,.58),(x*.16,0,.14),'thigh_'+s)
        bone('foot_'+s,(x*.16,0,.14),(x*.16,-.18,.10),'shin_'+s)
        bone('toe_'+s,(x*.16,-.18,.10),(x*.16,-.29,.10),'foot_'+s)
        bone('ear_'+s,(x*.15,0,1.98),(x*.21,0,2.15),'head')
        bone('eye_'+s,(x*.09,-.15,1.88),(x*.09,-.24,1.88),'head')
        bone('lid_'+s,(x*.09,-.17,1.91),(x*.09,-.20,1.96),'head')
        for f in range(5):
            h=Vector((x*(.433+f*.021),-.04,.83));length=.08 if f in [0,4] else .105
            if f==0:h.z+=.06;h.y-=.035
            for j in range(3):
                t=h+Vector((0,-.008,-length/3))
                bone(f'finger_{s}_{f}_{j}',h,t,'hand_'+s if j==0 else f'finger_{s}_{f}_{j-1}');h=t
    prev='pelvis'
    for i in range(5):
        bone('tail_'+str(i),(0,.06+i*.09,1.04-i*.03),(0,.15+i*.09,1.01-i*.03),prev);prev='tail_'+str(i)
    bpy.ops.object.mode_set(mode='OBJECT');parts=[]
    def skin(obj,bname,mat):
        obj.data.materials.append(mats[mat]);obj.vertex_groups.new(name=bname).add(list(range(len(obj.data.vertices))),1,'REPLACE')
        if 'quadrant' in mats[mat]:
            q=mats[mat]['quadrant']
            if not obj.data.uv_layers.active:obj.data.uv_layers.new()
            for uv in obj.data.uv_layers.active.data:uv.uv=(uv.uv.x*.48+.01+(q%2)*.5,uv.uv.y*.48+.51-(q//2)*.5)
        for p in obj.data.polygons:p.use_smooth=True
        parts.append(obj);return obj
    def ell(name,loc,scale,mat,bname,segments=24):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=12,location=loc)
        obj=bpy.context.object;obj.name=name;obj.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        return skin(obj,bname,mat)
    def linkmesh(name,a,b,r1,r2,mat,bname):
        a,b=Vector(a),Vector(b);d=b-a
        bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r1,radius2=r2,depth=d.length,location=(a+b)/2)
        obj=bpy.context.object;obj.name=name;obj.rotation_mode='QUATERNION';obj.rotation_quaternion=d.to_track_quat('Z','Y')
        bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
        bevel=obj.modifiers.new('Soft seams','BEVEL');bevel.width=.018;bevel.segments=3;bpy.ops.object.modifier_apply(modifier=bevel.name)
        return skin(obj,bname,mat)
    def tube(name,rings,mat,weights):
        verts=[];faces=[];count=32
        for center,rx,ry,axis in rings:
            axis=Vector(axis).normalized();u=Vector((0,1,0));v=u.cross(axis).normalized()
            for j in range(count):
                a=j*math.tau/count;verts.append(Vector(center)+v*(math.cos(a)*rx)+u*(math.sin(a)*ry))
        for k in range(len(rings)-1):
            for j in range(count):faces.append((k*count+j,k*count+(j+1)%count,(k+1)*count+(j+1)%count,(k+1)*count+j))
        faces.extend([tuple(reversed(range(count))),tuple((len(rings)-1)*count+j for j in range(count))])
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
        data.materials.append(mats[mat]);uv=data.uv_layers.new()
        for polygon in data.polygons:
            polygon.use_smooth=True
            for li in polygon.loop_indices:
                idx=data.loops[li].vertex_index;j=idx%count;k=idx//count
                # Apply UV quadrant directly. Generated texture remains embedded and local.
                q=mats[mat].get('quadrant',1);uv.data[li].uv=(j/count*.48+.01+(q%2)*.5,k/max(1,len(rings)-1)*.48+.51-(q//2)*.5)
        for k in range(len(rings)):
            for bn,w in weights(k/(len(rings)-1)).items():
                group=obj.vertex_groups.get(bn) or obj.vertex_groups.new(name=bn);group.add(list(range(k*count,(k+1)*count)),w,'REPLACE')
        parts.append(obj);return obj
    def blend(a,b,t):t=max(0,min(1,t));return {a:1-t,b:t}
    torso=[]
    for k in range(17):
        t=k/16;z=1.055+t*.49;rx=.207+.047*math.sin(t*math.pi)-.055*max(0,(t-.78)/.22)
        ry=.137+.025*math.sin(t*math.pi);torso.append(((0,0,z),rx,ry,(0,0,1)))
    def torso_weights(t):
        if t<.30:return blend('pelvis','spine_01',t/.30)
        return blend('spine_01','spine_02',(t-.30)/.58)
    tube('Continuous tailored sweatshirt',torso,'cloth',torso_weights)
    ell('Waistband',(0,0,1.04),(.214,.14,.075),'accent','pelvis')
    ell('Trouser seat',(0,.005,1.00),(.207,.138,.13),'pants','pelvis')
    ell('Hood',(0,.08,1.53),(.158,.103,.097),'cloth','spine_02')
    ell('Collar',(0,0,1.56),(.119,.105,.029),'accent','neck')
    # Sewn pocket, center zip, drawstrings and small metal ends add readable material detail.
    ell('Kangaroo pocket',(0,-.139,1.18),(.14,.019,.065),'pants','spine_01')
    for s in [-1,1]:
        linkmesh('Hood drawstring',(s*.065,-.13,1.52),(s*.07,-.167,1.36),.007,.007,'cream','spine_02')
        ell('Drawstring metal tip',(s*.07,-.167,1.36),(.009,.009,.017),'shoe','spine_02',12)
    ell('Neck',(0,0,1.62),(.09,.085,.12),'fur','neck')
    ell('Head',(0,-.006,1.87),(.223,.186,.226),'fur','head',32)
    # Sculpted muzzle, lower jaw, nostrils and separate eyeballs/lids.
    ell('Lower jaw',(0,-.127,1.745),(.125,.086,.057),'cream','jaw')
    for x,s in [(-1,'L'),(1,'R')]:
        ell('Muzzle '+s,(x*.058,-.176,1.79),(.079,.072,.063),'cream','head')
        ell('Eye '+s,(x*.09,-.164,1.902),(.061,.042,.057),'eye','eye_'+s)
        ell('Iris '+s,(x*.09,-.202,1.9),(.030,.014,.034),'iris','eye_'+s)
        ell('Pupil '+s,(x*.09,-.214,1.9),(.014,.006,.023),'dark','eye_'+s)
        ell('Catchlight '+s,(x*.09-.009,-.220,1.914),(.008,.003,.008),'eye','eye_'+s,12)
        ell('Brow '+s,(x*.09,-.16,1.96),(.067,.035,.018),'fur','lid_'+s)
        ear=(.054,.04,.19) if species=='rabbit' else ((.073,.048,.087) if species in ['panda','lion','dog'] else (.067,.046,.11))
        z=2.075 if species!='rabbit' else 2.14
        if species=='eagle':
            # Birds have feather tufts rather than external mammal ears.
            for k in range(3):ell('Crown feather '+s+str(k),(x*(.055+k*.035),.04+k*.014,2.06-k*.017),(.027,.03,.061),'cream','ear_'+s,16)
        elif species=='dog':
            ell('Floppy ear '+s,(x*.204,.015,1.98),(.064,.047,.142),'iris','ear_'+s)
            ell('Ear fold '+s,(x*.21,-.015,1.948),(.036,.024,.083),'fur','ear_'+s)
        elif species in ['cat','tiger','puma','cheetah','leopard']:
            data=bpy.data.meshes.new('Sculpted pointed ear')
            data.from_pydata([(x*.105,-.025,2.005),(x*.24,-.015,2.005),(x*.205,.025,2.205),(x*.17,.07,2.035)],[],[(0,2,1),(0,3,2),(1,2,3),(0,1,3)])
            data.update();obj=bpy.data.objects.new('Ear '+s,data);scene.collection.objects.link(obj)
            skin(obj,'ear_'+s,'fur')
            bevel=obj.modifiers.new('Soft ear edges','BEVEL');bevel.width=.012;bevel.segments=3
            bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
            ell('Ear inner '+s,(x*.176,-.024,2.055),(.035,.015,.065),'pink','ear_'+s)
        else:
            ell('Ear '+s,(x*.171,0,z),ear,'dark' if species=='panda' else 'fur','ear_'+s)
            ell('Ear inner '+s,(x*.171,-.035,z),tuple(v*.65 for v in ear),'pink','ear_'+s)
        for upper,lower,mat,r in [('upper_arm_','forearm_','cloth',.092),('thigh_','shin_','pants',.112)]:
            a,joint=bones[upper+s];_,b=bones[lower+s];rings=[]
            for k in range(21):
                t=k/20
                if t<.5:pos=a.lerp(joint,t*2);axis=joint-a
                else:pos=joint.lerp(b,(t-.5)*2);axis=b-joint
                radius=r*(1-.34*t)+.005*math.sin(t*math.pi*10)**2
                rings.append((pos,radius,radius*.94,axis))
            tube('Seamless '+upper+s,rings,mat,lambda t,u=upper+s,l=lower+s:blend(u,l,(t-.35)/.30))
        ell('Shoulder '+s,(x*.25,0,1.47),(.099,.094,.10),'cloth','upper_arm_'+s)
        ell('Cuff '+s,(x*.467,-.027,.96),(.069,.066,.042),'accent','forearm_'+s)
        ell('Palm '+s,(x*.475,-.035,.86),(.061,.043,.082),'fur','hand_'+s)
        for f in range(5):
            for j in range(3):
                bn=f'finger_{s}_{f}_{j}';a,b=bones[bn];linkmesh(bn,a,b,.012,.011,'fur',bn)
        ell('Sneaker '+s,(x*.16,-.095,.12),(.105,.207,.10),'shoe','foot_'+s)
        ell('Sole '+s,(x*.16,-.095,.055),(.11,.21,.035),'dark','foot_'+s)
        ell('Toe cap '+s,(x*.16,-.245,.105),(.10,.07,.067),'shoe','toe_'+s)
        for k in range(4):
            ell('Lace '+s+str(k),(x*.16,-.065-k*.029,.204-k*.008),(.067,.008,.008),'cream','foot_'+s,12)
        ell('Shoe trim '+s,(x*.16,-.025,.17),(.107,.03,.017),'accent','foot_'+s)
        if species in ['panda','cheetah']:
            ell('Eye marking '+s,(x*.109,-.119,1.88),(.09,.06,.095),'dark','head')
    ell('Nose',(0,-.239,1.822),(.045,.028,.028),'dark','head')
    if species=='eagle':
        ell('Beak',(0,-.239,1.80),(.072,.12,.07),'iris','jaw')
    if species=='lion':
        for i in range(18):
            a=i*math.tau/18;ell('Mane',(math.cos(a)*.22,.03,1.86+math.sin(a)*.23),(.075,.10,.08),'iris','head',16)
    if species in ['tiger','cat','cheetah','leopard']:
        for s in [-1,1]:
            for i in range(3):ell('Face marking',(s*(.162+i*.014),-.12+i*.021,1.85-i*.035),(.026,.014,.010 if species in ['tiger','cat'] else .018),'dark','head',12)
    if species not in ['panda','eagle']:
        for i in range(5):
            a,b=bones['tail_'+str(i)];linkmesh('Tail '+str(i),a,b,.037*(1-i*.12),.035*(1-i*.12),'fur','tail_'+str(i))
    # Join all surfaces into one skinned mesh; the armature retains individual finger/face bones.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();mesh=bpy.context.object;mesh.name='Mascot_'+species
    mod=mesh.modifiers.new('Full body skin','ARMATURE');mod.object=rig;mesh.parent=rig
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    # IK targets are authoring controls. Bake evaluated poses, then remove controls before export.
    targets={};arm_targets={}
    for s,x in [('L',-1),('R',1)]:
        target=bpy.data.objects.new('Foot target '+s,None);scene.collection.objects.link(target);target.location=(x*.16,0,.14)
        ik=rig.pose.bones['shin_'+s].constraints.new('IK');ik.target=target;ik.chain_count=2;ik.use_stretch=False
        targets[s]=target
        hand=bpy.data.objects.new('Hand target '+s,None);scene.collection.objects.link(hand);hand.location=(x*.47,-.03,.94)
        ik=rig.pose.bones['forearm_'+s].constraints.new('IK');ik.target=hand;ik.chain_count=2;ik.use_stretch=False
        arm_targets[s]=hand
    pb=rig.pose.bones
    for p in pb:p.rotation_mode='XYZ'
    actions=[]
    for style in ['square','shuffle','hiphop','disco']:
        if rig.animation_data:rig.animation_data.action=None
        for p in pb:p.rotation_mode='XYZ'
        samples=[]
        for frame in range(1,FRAMES+2):
            t=(frame-1)/FPS;beat=t*2;a=beat*math.pi;phrase=beat*math.pi/4
            for p in pb:p.matrix_basis=Matrix.Identity(4)
            sway=math.sin(a/2);bounce=.025*(1-math.cos(a*2))
            pb['root'].location=(.075*sway,0,-bounce)
            pb['pelvis'].rotation_euler=(.025*math.sin(a),.035*sway,.065*sway)
            pb['spine_01'].rotation_euler=(.04*math.sin(a+.3),-.035*sway,-.05*sway)
            pb['spine_02'].rotation_euler=(.035*math.sin(a+.6),.03*math.sin(phrase),-.065*sway)
            pb['neck'].rotation_euler=(.02*math.sin(a+.8),.02*math.cos(a),.04*sway)
            pb['head'].rotation_euler=(.045*math.sin(a+1),.06*math.sin(phrase),.03*math.sin(a/2+.5))
            pb['jaw'].rotation_euler.x=.035*(1+math.sin(a/2))
            for s,x in [('L',-1),('R',1)]:
                lift=max(0,x*math.sin(a/2))**2
                tx=x*.16;ty=0;tz=.14
                if style=='shuffle':ty=.13*math.sin(a+x*math.pi/2);tz+=.13*lift;tx+=x*.06*lift
                elif style=='hiphop':tx+=x*.12*lift;ty=-.05*lift;tz+=.08*lift
                else:tx+=x*.085*lift;tz+=.065*lift
                targets[s].location=(tx,ty,tz)
                if style=='square':hand=(x*(.39+.12*math.cos(a/2)),-.20-.12*math.cos(a/2+x),1.25+.23*math.sin(a/2+x*1.5))
                elif style=='shuffle':hand=(x*.37,-.18-.18*math.sin(a/2+x*math.pi/2),1.22+.19*math.sin(a/2+x*math.pi/2))
                elif style=='hiphop':hand=(x*.27+.20*math.sin(phrase),-.38,1.43+.24*math.sin(a/2+x*1.2))
                else:
                    lift=(1+x*math.sin(phrase))/2;hand=(x*(.35+.12*lift),-.15,1.10+.88*lift)
                arm_targets[s].location=(hand[0]+.075*sway,hand[1],hand[2]-bounce)
                pb['clavicle_'+s].rotation_euler=(0,.025*math.sin(a+x),x*.025*math.sin(a))
                arm=pb['upper_arm_'+s];fore=pb['forearm_'+s]
                if style=='square':arm.rotation_euler=(.35*math.sin(a/2+x),.15*math.sin(a/2),x*(.22+.30*math.cos(a/2)));fore.rotation_euler.x=-.65-.4*math.sin(a/2+x)
                elif style=='shuffle':arm.rotation_euler=(.55*math.sin(a+x),0,x*.16);fore.rotation_euler.x=-.65+.3*math.sin(a+x)
                elif style=='hiphop':arm.rotation_euler=(-.4-.45*math.sin(phrase),.2*math.cos(a),x*(.5+.4*math.sin(a/2)));fore.rotation_euler=(-.95+.35*math.sin(a),0,x*.25)
                else:arm.rotation_euler=(-.2,0,x*(.8+.8*math.sin(a/2+x*.9)));fore.rotation_euler=(-.35-.25*math.cos(a/2),0,x*.35)
                pb['hand_'+s].rotation_euler=(.15*math.sin(a+x),.10*math.cos(a/2),.14*math.sin(a/2+x))
                pb['foot_'+s].rotation_euler.x=-.2*lift
                pb['toe_'+s].rotation_euler.x=.20*lift
                pb['ear_'+s].rotation_euler=(.07*math.sin(a+.7),0,x*.06*math.cos(a+.8))
                pb['eye_'+s].rotation_euler.z=.025*math.sin(phrase)
                pb['lid_'+s].rotation_euler.x=.08*max(0,math.cos(phrase*2))**12
                for f in range(5):
                    for j in range(3):pb[f'finger_{s}_{f}_{j}'].rotation_euler.x=.12+.18*(1+math.sin(a/2+f*.4+j*.2))
            for i in range(5):pb['tail_'+str(i)].rotation_euler=(.07*math.sin(a/2-i*.4),.13*math.sin(a/2-i*.5),.04*math.cos(a/2))
            bpy.context.view_layer.update()
            samples.append({p.name:p.matrix.copy() for p in pb})
        # Constraints must be muted while replaying baked matrices.
        for s in targets:
            pb['shin_'+s].constraints[0].mute=True;pb['forearm_'+s].constraints[0].mute=True
        action=bpy.data.actions.new(style);rig.animation_data_create();rig.animation_data.action=action
        for p in pb:p.rotation_mode='QUATERNION'
        for frame,pose in enumerate(samples,1):
            for p in pb:
                # Solve basis against the sampled parent, not the previous evaluated frame.
                # Assigning p.matrix sequentially leaves stale parent transforms in Blender.
                basis=p.bone.matrix_local.inverted() @ (p.parent.bone.matrix_local @ pose[p.parent.name].inverted() if p.parent else Matrix.Identity(4)) @ pose[p.name]
                p.matrix_basis=basis;p.keyframe_insert('location',frame=frame,group=p.name);p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
        actions.append(action)
        for s in targets:
            pb['shin_'+s].constraints[0].mute=False;pb['forearm_'+s].constraints[0].mute=False
    for s in targets:
        for constraint in list(pb['shin_'+s].constraints):pb['shin_'+s].constraints.remove(constraint)
        for constraint in list(pb['forearm_'+s].constraints):pb['forearm_'+s].constraints.remove(constraint)
        bpy.data.objects.remove(targets[s],do_unlink=True)
        bpy.data.objects.remove(arm_targets[s],do_unlink=True)
    # glTF exports named NLA strips as the four selectable clips.
    rig.animation_data.action=None
    for action in actions:
        track=rig.animation_data.nla_tracks.new();track.name=action.name;strip=track.strips.new(action.name,1,action);strip.action_frame_start=1;strip.action_frame_end=FRAMES+1
    scene.frame_set(1)
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ASSETS/(species+'.glb')),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_anim_slide_to_zero=True,export_force_sampling=True,export_optimize_animation_size=True,export_yup=True)
    if species=='cat':
        # Native editable file and portable FBX for actual Unreal import/validation.
        bpy.ops.file.pack_all()
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Garden-Dancer.blend'))
        bpy.ops.export_scene.fbx(filepath=str(OUT/'Garden-Dancer.fbx'),use_selection=True,add_leaf_bones=False,bake_anim=True,bake_anim_use_all_actions=False,bake_anim_use_nla_strips=True,axis_forward='-Y',axis_up='Z',path_mode='COPY',embed_textures=True,mesh_smooth_type='FACE')
    return {'species':species,'bones':len(armdata.bones),'vertices':len(mesh.data.vertices),'clips':[a.name for a in actions]}

results=[]
for species in (ARGS[2:] or SPECIES):
    # Clear orphaned actions/materials so every file contains only its own four clips.
    for action in list(bpy.data.actions):bpy.data.actions.remove(action)
    results.append(build(species))
previous=json.loads((ASSETS/'manifest.json').read_text()).get('characters',[]) if (ASSETS/'manifest.json').exists() else []
characters={item['species']:item for item in previous+results}
(ASSETS/'manifest.json').write_text(json.dumps({'version':1,'fps':FPS,'bpm':120,'duration':8,'characters':[characters[s] for s in SPECIES if s in characters]},indent=2))
print('DANCERS_COMPLETE '+json.dumps(results))
