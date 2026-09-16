"""Freeze rendered content and tracked asset/source manifest before presentation edits."""
import hashlib, json, subprocess
from pathlib import Path
from html.parser import HTMLParser
class Content(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip=0; self.text=[]; self.links=[]; self.media=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('script','style'): self.skip+=1
        if tag=='a' and 'href' in a: self.links.append(a['href'])
        if tag in ('img','video','source'): self.media.append(a)
    def handle_endtag(self,tag):
        if tag in ('script','style'): self.skip=max(0,self.skip-1)
    def handle_data(self,data):
        if not self.skip and data.strip(): self.text.append(' '.join(data.split()))
root=Path.cwd(); out=root/'output/flagship/redesign-baseline.json'
if out.exists(): raise SystemExit('Baseline already exists; refusing to overwrite.')
files=[]
for name in subprocess.check_output(['git','ls-files'],text=True).splitlines():
    p=root/name
    if p.is_file(): files.append({'path':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
pages={}
for p in (root/'dist').rglob('*.html'):
    parser=Content(); parser.feed(p.read_text(encoding='utf-8'))
    pages[p.relative_to(root/'dist').as_posix()]={'text':parser.text,'links':parser.links,'media':parser.media}
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'base':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':files,'pages':pages},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Inventoried {len(files)} tracked files and {len(pages)} rendered pages.')
