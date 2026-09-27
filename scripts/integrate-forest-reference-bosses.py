"""Idempotent registration of the nine vector reference bosses."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
src=root/'src/scripts/forest'
names=[('golden-cow','Golden Cow'),('sunset-cows','Sunset Cow Duo'),('round-pikachu','Round Pikachu'),('ultraman','Ultraman'),('gundam','Gundam'),('garden-zombie','Garden Zombie'),('block-zombie','Block Zombie'),('block-zombie-shuffle','Block Zombie Shuffle'),('garden-zombie-groove','Garden Zombie Groove')]
openers=['I brought the moo-ves.','We ordered a double moo.','My cheeks run on rechargeable giggles.','The timer says it is dance time.','All systems set to disco.','I came for brains and stayed for recess.','I only dance on the grid.','One block left. Two blocks right.','My tie has better rhythm than me.']
phrases=['My knees have entered party mode.','That was a very enthusiastic high five.','I practiced this in front of a tree.','Who put a trampoline in my shoes?','My shoulders are doing their homework.','I meant to do that. Probably.','Let us settle this with a dance battle.','The forest has excellent acoustics.','My left foot would like a recount.','Someone turn up the chocolate cake.','I have been training all snack time.','Six! Seven! Now where was I?','These moves are locally grown.','My secret power is being dramatic.','That tickled my confidence.','The next round comes with extra wiggles.','Please give my elbows some space.','I saved my best move for recess.','Everybody gets a victory dance.']
hosts=json.loads((src/'hosts.json').read_text(encoding='utf-8'))
for i,(id,name) in enumerate(names):
    pika=id=='round-pikachu'
    h=dict(id=id,name=name,eyes=[[.404,.328],[.580,.328]] if pika else [[.426,.215],[.55,.215]],mouth=[.5,.43 if pika else .30],phrases=[openers[i]]+phrases)
    hosts=[x for x in hosts if x['id']!=id]+[h]
(src/'hosts.json').write_text(json.dumps(hosts,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
rigs=[];targets=[]
for id,_ in names:
    neck=.48 if id=='round-pikachu' else .36
    arm='[[.35,.39],[.25,.50],[.26,.64]],[[.65,.39],[.75,.50],[.72,.64]]'
    if id in ['ultraman','gundam']:arm='[[.35,.36],[.23,.49],[.32,.58]],[[.65,.36],[.77,.49],[.69,.58]]'
    if id.startswith('block-'):arm='[[.38,.39],[.27,.39],[.17,.39]],[[.62,.39],[.49,.43],[.35,.42]]'
    if id=='round-pikachu':arm='[[.27,.50],[.23,.61],[.23,.72]],[[.73,.50],[.77,.61],[.77,.72]]'
    rigs.append(f"  '{id}': {{neck:[.5,{neck}],arms:arms({arm}),legs:legs([[.41,.64],[.39,.77],[.36,.90]],[[.57,.64],[.62,.77],[.66,.90]]),fur:'cloth',hair:0,features:[]}},")
    targets.append(f"  '{id}': {{head:point(.48,{.34 if id=='round-pikachu' else .22}),neck:point(.5,{neck}),arm:point(.26,.51),stomach:point(.50,.57)}},")
for filename,marker,lines in [('boss-rigs.js','export const BOSS_RIGS = {',rigs),('attack-targets.js','const HOST_LANDMARKS = Object.freeze({',targets)]:
    p=src/filename;s=p.read_text(encoding='utf-8');s='\n'.join(l for l in s.split('\n') if not any(l.startswith(f"  '{id}':") for id,_ in names));s=s.replace(marker,marker+'\n'+'\n'.join(lines));p.write_text(s,encoding='utf-8')
p=src/'app.js';s=p.read_text(encoding='utf-8')
if "from './animated-bosses.js'" not in s:s="import {ANIMATED_BOSSES,bossFrameIndex} from './animated-bosses.js';\n"+s
s=s.replace("['cow','pelican'].map(async id=>",'Object.keys(ANIMATED_BOSSES).map(async id=>').replace('Array.from({length:36}', 'Array.from({length:ANIMATED_BOSSES[id].frames}')
s=s.replace("encounter?0:Math.floor(time/(hostId==='cow'?1.8:1.65)*36)%36",'bossFrameIndex(hostId,time,encounter,gentle)')
p.write_text(s,encoding='utf-8')
for file in ['check-forest.mjs','check-forest-targets.mjs']:
    p=root/'scripts'/file;s=p.read_text(encoding='utf-8').replace('cast.length,12','cast.length,21').replace('total,240','total,420').replace('12 characters, 240','21 characters, 420').replace('all twelve','all twenty-one').replace('HOST_IDS.length, 12','HOST_IDS.length, 21');p.write_text(s,encoding='utf-8')
