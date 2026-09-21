import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const cast=JSON.parse(await readFile('src/scripts/forest/hosts.json','utf8'));
const page=await readFile('dist/forest/index.html','utf8');
assert.match(page,/https:\/\/speakkai.com\/forest\//);
for(const id of ['canvas','host-select','pause','motion','roster','result'])assert.ok(page.includes(`id="${id}"`),id);
assert.ok(!page.includes('/src.js'),'Unbuilt entry point');
for(const route of ['resources','resources/tools','zh/resources'])assert.ok((await readFile(`dist/${route}/index.html`,'utf8')).includes('href="/forest/"'),`Resource link missing: ${route}`);
assert.equal(cast.length,10);
let total=0;
for(const host of cast){
 assert.equal(host.phrases.length,20,host.id);
 if(host.id!=='dog')assert.ok((await stat(`dist/forest/art/host-${host.id}.webp`)).size>1000);
 total+=host.phrases.length;
 assert.ok(host.phrases.every(text=>typeof text==='string'&&text.length>0));
}
const source=await readFile('src/scripts/forest/app.js','utf8');
assert.ok(!source.includes("'/art/"),'Root-only media URL');
assert.ok(!/[{,]\s*start\s*:\s*-\d/.test(source),'Students must start on-screen');
assert.equal(total,200);
assert.ok(!source.includes('loadVoice('),'No boss speech downloads');
assert.ok(!source.includes('createBufferSource('),'No boss speech playback');
assert.ok(!page.includes('id="voice"')&&!page.includes('id="hear-dog"'),'No speech controls');
assert.ok(source.includes("$('#dog-speech').textContent=DOG_PHRASES[current]"),'Text quotes independent of audio');
assert.ok(source.includes('soundEffects.load(audio,master)'),'Game effects retained');
console.log('Forest PASS: 10 characters, 200 text quotes, no boss speech or voice controls, game effects retained.');
