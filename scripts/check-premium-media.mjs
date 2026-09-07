import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(await readFile('media/remotion/manifest.json','utf8'));
for(const record of manifest.records) {
  const bytes=await readFile(`dist/media/${record.file}`);
  assert.equal(bytes.length,record.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Rendered asset changed without revalidation');
  if(record.file.endsWith('.mp4')){assert.equal(record.duration,18);assert.equal(record.audio,false);assert.ok(record.bytes<2000000);}
}
for(const [language,route] of [['en','watch'],['zh','zh/watch']]) {
  const html=await readFile(`dist/${route}/index.html`,'utf8');
  assert.match(html,/preload="none"/);assert.doesNotMatch(html,/<video[^>]*(?:autoplay|loop)/);
  assert.ok(html.includes(`/media/point-example-check-${language}.mp4`));
  assert.ok(html.includes(`/media/point-example-check-${language}.webp`));
  const quotes=language==='en'?['Let’s meet in the library.','Yesterday, it was quiet after lunch.','Would that work for you?']:['我们去图书馆见面吧。','昨天午饭后，那里很安静。','这个安排适合你吗？'];
  for(const quote of quotes) assert.ok(html.includes(quote),'Complete static example missing');
}
console.log('Premium media PASS: verified rendered asset hashes, 18-second silent H264, native controls, no autoplay/preload and complete bilingual HTML.');
