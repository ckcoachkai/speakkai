from pathlib import Path
from PIL import Image
import json,base64,html
root=Path('public/travel/assets');proj=json.loads(Path('output/travel/realism/label-projections.json').read_text())
for name in ['hero','overview','courtyard']:
 im=Image.open(f'output/travel/realism/{name}-4k.png').convert('RGB');assert im.size==(3840,2160);im.save(root/f'resort-{name}-4k.jpg',quality=93,optimize=True)
 if name=='hero':im.resize((1920,1080),Image.Resampling.LANCZOS).save(root/'resort-hero.webp',quality=88)
labels={'Hotel guest wings':('HUALUXE guest wings','华邑客房楼',0,-125),'Water garden':('Water garden','水景花园',0,70),'Garden suites':('Garden suites','花园别墅',40,20),'Arrival lobby':('Arrival lobby','抵达大堂',120,-100),'East Taihu Lake':('East Taihu Lake','东太湖',-20,-50),'Event hall':('Event hall','宴会厅',80,35)}
image=base64.b64encode((root/'resort-hero-4k.jpg').read_bytes()).decode()
svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160" style="max-width:100%;height:auto" viewBox="0 0 3840 2160"><image width="3840" height="2160" href="data:image/jpeg;base64,{image}"/>'
svg+='<style>text{font-family:Arial,"Microsoft YaHei",sans-serif}</style><rect x="65" y="65" width="795" height="152" rx="8" fill="#102e2c" fill-opacity=".9"/><text x="104" y="126" font-size="42" fill="#fffaf0" letter-spacing="5">SUZHOU BAY</text><text x="104" y="174" font-size="27" fill="#d6dfd1">Photo-referenced architectural study · 酒店景观重建</text>'
for key,(en,zh,dx,dy) in labels.items():
 x,y,z=proj['hero'][key];x*=3840;y=(1-y)*2160;tx=max(190,min(3650,x+dx));ty=max(275,min(1900,y+dy));w=max(240,len(en)*18+46)
 svg+=f'<path d="M{x:.1f},{y:.1f} L{tx:.1f},{ty:.1f}" stroke="#fff9dd" stroke-width="3"/><circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="#fff9dd"/><rect x="{tx-w/2:.1f}" y="{ty-82:.1f}" width="{w}" height="96" rx="6" fill="#fffff5" fill-opacity=".95"/><text x="{tx:.1f}" y="{ty-42:.1f}" font-size="29" text-anchor="middle" fill="#193831">{html.escape(en)}</text><text x="{tx:.1f}" y="{ty-7:.1f}" font-size="25" text-anchor="middle" fill="#526154">{zh}</text>'
svg+='<rect x="65" y="2036" width="1830" height="66" rx="5" fill="#102e2c" fill-opacity=".88"/><text x="100" y="2080" font-size="27" fill="#fffaf0">Layout and dimensions are approximate · 布局与尺寸为近似示意 · Blender / Cycles / 3840 × 2160</text></svg>'
(root/'resort-labeled-4k.svg').write_text(svg,encoding='utf-8')
print('Three 4K stills, web poster and labeled presentation exported.')
