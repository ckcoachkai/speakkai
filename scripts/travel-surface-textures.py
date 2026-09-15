import numpy as np
from PIL import Image
from pathlib import Path
import shutil,json
root=Path('media/travel/realism-textures');rng=np.random.default_rng(41);N=1024
x,y=np.meshgrid(np.arange(N)/N,np.arange(N)/N)
def save(name,a):Image.fromarray(np.uint8(np.clip(a,0,1)*255)).save(root/name)
def normal(name,h,strength):
 dy,dx=np.gradient(h);n=np.stack([-dx*strength,-dy*strength,np.ones_like(h)],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True);save(name,n*.5+.5)
noise=rng.random((N,N));grass=np.zeros((N,N))
for cells,weight in [(4,.04),(13,.035),(49,.016),(201,.008)]:
 small=Image.fromarray(np.uint8(rng.random((cells,cells))*255));grass+=(np.array(small.resize((N,N),Image.Resampling.BICUBIC))/255-.5)*weight
save('grass-color.jpg',np.clip(np.array([.30,.33,.19])+grass[...,None],0,1));save('grass-rough.jpg',np.full((N,N),.92));normal('grass-normal.png',grass,9)
water=.13*np.sin(x*51+y*31+2*np.sin(y*17))+.09*np.sin(y*173-x*21)+.04*np.sin(x*341+y*133)
normal('water-normal.png',water,2.8)
plaster=.025*(noise-.5)+.03*np.sin(x*17)*np.sin(y*21)
save('plaster-color.jpg',np.array([.75,.70,.60])+plaster[...,None]);save('plaster-rough.jpg',.78+plaster);normal('plaster-normal.png',plaster,4)
roof=.04*np.cos(x*32*np.pi*2)+.02*np.cos(y*24*np.pi*2)
save('roof-color.jpg',np.array([.095,.108,.113])+roof[...,None]*.22);save('roof-rough.jpg',.6+roof);normal('roof-normal.png',roof,11)
shutil.copy2('C:/Users/kai/Documents/ChatGPT/HQ/outputs/second-chance/evidence/texture_sources.json',root/'reused-scans-sources.json')
print('Original surface maps and scan provenance saved.')
