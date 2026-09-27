"""Bake the original SVG motions into deterministic game-clock frames."""
import copy, math, re, xml.etree.ElementTree as E
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'docs/forest-animation-sources';OUT=ROOT/'output/forest-svg-frames';OUT.mkdir(parents=True,exist_ok=True)
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);E.register_namespace('xlink','http://www.w3.org/1999/xlink')
def find(root,id):return next(e for e in root.iter() if e.get('id')==id)
def root(box):return E.Element('{'+NS+'}svg',{'width':'512','height':'768','viewBox':box})
def interpolate(a,b,f):
    nums=re.findall(r'-?\d*\.?\d+',b);i=iter(nums)
    return re.sub(r'-?\d*\.?\d+',lambda m:str(float(m[0])*(1-f)+float(next(i))*f),a)
def animate(svg,t):
    for parent in list(svg.iter()):
        for el in list(parent):
            kind=el.tag.split('}')[-1]
            if kind not in ('animate','animateTransform'):continue
            values=el.get('values').split(';');duration=float(el.get('dur').rstrip('s'));p=(t%duration)/duration
            keys=list(map(float,el.get('keyTimes',';'.join(str(i/(len(values)-1)) for i in range(len(values)))).split(';')))
            j=next((i for i in range(len(keys)-1) if p<keys[i+1]),len(keys)-2)
            value=interpolate(values[j],values[j+1],(p-keys[j])/(keys[j+1]-keys[j]))
            if kind=='animateTransform':value=el.get('type')+'('+value+')'
            parent.set(el.get('attributeName'),value);parent.remove(el)
cow=E.parse(SRC/'cow.svg').getroot()
html=(SRC/'pelican.html').read_text('utf-8');pelican=E.fromstring(next(s for s in re.findall(r'<svg\b.*?</svg>',html,re.S) if 'id="bicycle"' in s))
for frame in range(36):
    t=frame/36*1.8;r=root('-210 -250 420 630')
    for el in cow:
        if el.tag.split('}')[-1] in ('defs','style'):r.append(copy.deepcopy(el))
    ladder=copy.deepcopy(find(cow,'ladder'));ladder.set('transform',f'translate(0 {245+t/1.8*48})');r.append(ladder)
    r.append(copy.deepcopy(find(cow,'cow-wobble')))
    truck=copy.deepcopy(find(cow,'fire-truck'));truck.set('transform','translate(260 -25) scale(-.5 .5)');r.append(truck)
    for label in truck.iter():
        if label.tag.split('}')[-1]=='text':
            label.set('text-anchor','end');label.set('transform',f"translate({float(label.get('x'))*2} 0) scale(-1 1)")
    animate(r,t);(OUT/f'cow-{frame}.svg').write_text(E.tostring(r,encoding='unicode'),'utf-8')
    r=root('285 -90 580 870')
    for el in pelican:
        if el.tag.split('}')[-1]=='defs':r.append(copy.deepcopy(el))
    r.append(copy.deepcopy(find(pelican,'bicycle')))
    # The original pelican group is nested inside the bicycle group.
    if not any(e.get('id')=='pelican' for e in r.iter()):r.append(copy.deepcopy(find(pelican,'pelican')))
    def set(id,key,value):find(r,id).set(key,str(value))
    cycle=frame/36*math.tau;bob=math.sin(cycle*2)*1.5
    for id in ('rear-spokes','front-spokes'):set(id,'transform',f'rotate({cycle*2*180/math.pi})')
    set('pelican','transform',f'translate(0 {bob})')
    for side,hx,hy,angle in [('far',499,351+bob,cycle+math.pi+.45),('near',513,350+bob,cycle+.45)]:
        x=548+math.cos(angle)*30;y=481+math.sin(angle)*30;dx=x-hx;dy=y-6-hy;dist=math.hypot(dx,dy);along=(86**2-94**2+dist**2)/(2*dist);height=math.sqrt(max(0,86**2-along**2));kx=hx+along*dx/dist+height*dy/dist;ky=hy+along*dy/dist-height*dx/dist
        for id in (side+'-leg',side+'-leg-outline'):set(id,'d',f'M{hx} {hy}L{kx} {ky} {x} {y-6}')
        set(side+'-crank','d',f'M548 481L{x} {y}');set(side+'-pedal','d',f'M{x-12} {y+7}h36');set(side+'-foot','d',f'M{x-5} {y-8}l20 0 7 9-30 0Z')
    flutter=math.sin(cycle*3)*5
    set('scarf-tail','d',f'M580 247C552 {237+flutter} 529 {248-flutter} 502 {230+flutter}L481 {235+flutter} 492 {247+flutter} 474 {257+flutter}C517 {252-flutter} 546 {270+flutter} 582 260Z')
    mirror=E.SubElement(r,'{'+NS+'}g',{'transform':'translate(1150 0) scale(-1 1)'})
    for child in list(r):
        if child is not mirror and child.tag.split('}')[-1]!='defs':r.remove(child);mirror.append(child)
    (OUT/f'pelican-{frame}.svg').write_text(E.tostring(r,encoding='unicode'),'utf-8')
print('Prepared 36 original-motion frames per boss.')
