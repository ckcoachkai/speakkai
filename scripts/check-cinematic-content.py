import json, re
from pathlib import Path
from html.parser import HTMLParser
class Text(HTMLParser):
 def __init__(self): super().__init__(); self.skip=0; self.parts=[]
 def handle_starttag(self,t,a):
  if t in ('script','style'): self.skip+=1
 def handle_endtag(self,t):
  if t in ('script','style'): self.skip=max(0,self.skip-1)
 def handle_data(self,s):
  if not self.skip and s.strip(): self.parts.append(' '.join(s.split()))
b=json.loads(Path('output/flagship/redesign-baseline.json').read_text(encoding='utf-8')); rows=[]
for route, old in b['pages'].items():
 p=Path('dist')/route
 if not p.exists(): rows.append({'route':route,'missing':True}); continue
 parser=Text(); parser.feed(p.read_text(encoding='utf-8')); text=' '.join(parser.parts)
 removed=[s for s in old['text'] if s not in text and s not in ('↻','Replay motion','重播动画','IDEA → VOICE → CONNECTION','想法 → 声音 → 连接') and not re.fullmatch(r'0[0-9]',s)]
 if removed: rows.append({'route':route,'removed':removed})
Path('output/flagship/cinematic-content-comparison.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(rows,ensure_ascii=False)[:6000]); print('Routes compared:',len(b['pages']))
