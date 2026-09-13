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
 assert.equal(host.phrases.length,10,host.id);
 if(host.id!=='dog')assert.ok((await stat(`dist/forest/art/host-${host.id}.webp`)).size>1000);
 for(let i=0;i<10;i++){const key=host.id==='dog'?`phrase-${i}`:`${host.id}-phrase-${i}`;const bytes=(await stat(`dist/forest/art/${key}.mp3`)).size;assert.ok(bytes>1000,key);total+=bytes;}
}
const source=await readFile('src/scripts/forest/app.js','utf8');
assert.ok(!source.includes("'/art/"),'Root-only media URL');
assert.ok(!source.includes('start:-'),'Students must start on-screen');
assert.ok(!source.includes('HOSTS.flatMap'),'Do not preload every voice');
assert.ok(total<4_000_000,'Voice asset budget');
console.log(`Forest PASS: route, 3 resource links, 10 characters, 100 voice files (${total} bytes), scoped media URLs and visible starts.`);
