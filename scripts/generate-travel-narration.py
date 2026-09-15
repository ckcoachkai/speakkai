"""Generate the two cached travel narrations. Credentials remain in user config."""
import base64,hashlib,json,os,subprocess,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
scripts=json.loads((ROOT/'docs/travel/narration.json').read_text(encoding='utf-8'))
key=os.environ.get('ELEVENLABS_API_KEY')
if not key:
 for line in (Path.home()/'.config/elevenlabs/credentials.env').read_text(encoding='utf-8-sig').splitlines():
  if line.startswith('ELEVENLABS_API_KEY='):key=line.split('=',1)[1].strip().strip('\"\'')
if not key:raise SystemExit('Missing ElevenLabs credential.')
client=urllib.request.build_opener(urllib.request.ProxyHandler({'https':os.environ.get('ELEVENLABS_PROXY','http://127.0.0.1:7897')}))
def request(path,payload=None):
 req=urllib.request.Request('https://api.elevenlabs.io/v1/'+path,data=json.dumps(payload,ensure_ascii=False).encode() if payload is not None else None,headers={'xi-api-key':key,'Content-Type':'application/json'})
 try:
  with client.open(req,timeout=180) as response:return json.load(response)
 except urllib.error.HTTPError as error:raise SystemExit(f'ElevenLabs request failed: HTTP {error.code}; cached outputs preserved.')
masters=ROOT/'output/travel/narration';masters.mkdir(parents=True,exist_ok=True)
voice='TX3LPaxmHKxFdv7VOQHJ'
model='eleven_v3'
payloads={lang:{'text':text,'model_id':model,'language_code':lang,'voice_settings':{'stability':0.5,'similarity_boost':0.75,'style':0.35,'use_speaker_boost':False}} for lang,text in scripts.items()}
fingerprints={lang:hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest() for lang,payload in payloads.items()}
needed=sum(len(scripts[lang]) for lang in scripts if not (masters/(fingerprints[lang]+'.json')).exists())
sub=request('user/subscription');remaining=sub['character_limit']-sub['character_count']
print(f'{needed} new characters; {remaining} included credits available.',flush=True)
if needed>remaining:raise SystemExit('Insufficient included credits; no generation started.')
manifest={'provider':'ElevenLabs','model':model,'voice_id':voice,'voice_name':'Liam — Energetic, Social Media Creator','clips':[]}
for lang,payload in payloads.items():
 cache=masters/(fingerprints[lang]+'.json')
 if not cache.exists():
  print('Generating '+lang,flush=True)
  data=request(f'text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128',payload)
  cache.write_text(json.dumps(data),encoding='utf-8')
 else:data=json.loads(cache.read_text(encoding='utf-8'))
 master=masters/(lang+'-master.mp3');master.write_bytes(base64.b64decode(data['audio_base64']))
 output=ROOT/f'public/travel/assets/introduction-{lang}.mp3'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(master),'-af','loudnorm=I=-18:TP=-2:LRA=9','-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',str(output)],check=True)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(output)]))
 if not 60<duration<240:raise SystemExit(f'Unexpected {lang} duration {duration}; inspect before publishing.')
 manifest['clips'].append({'language':lang,'file':output.name,'seconds':duration,'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'request_sha256':fingerprints[lang]})
 (ROOT/'docs/travel/narration-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
 print(f'{lang}: {duration:.1f}s, {output.stat().st_size} bytes',flush=True)
