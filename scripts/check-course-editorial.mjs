import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validateCourseEditorial, courseEditorialFields } from '../src/lib/courseEditorial.mjs';
const record = JSON.parse(await fs.readFile('src/content/flagship/course-editorial.json','utf8'));
validateCourseEditorial(record);
const invalidTransforms = [r=>delete r['zh-CN'], r=>r.en.introduction='', r=>r.reviewedOn='2026-02-30', r=>r.en.unexpected='Unreviewed copy', r=>r.editorialNote='', r=>delete r.en.practiceEnding, r=>r['zh-CN'].practiceOpening=''];
for(const transform of invalidTransforms) {
  const invalid = structuredClone(record); transform(invalid); assert.throws(()=>validateCourseEditorial(invalid));
}
for(const [language,route] of [['en','/coaching/young-competition-speakers/'],['zh-CN','/zh/coaching/young-competition-speakers/']]) {
  const html = await fs.readFile(`dist${route}index.html`,'utf8');
  for(const key of Object.keys(courseEditorialFields)) {
    const value = record[language][key];
    const escaped = value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    assert.ok(html.includes(value) || html.includes(escaped), `${language}.${key} not rendered`);
  }
  for (const attempt of ['first', 'retry']) {
    const block = html.match(new RegExp(`data-attempt="${attempt}"[^>]*>([\\s\\S]*?)</p>`))?.[1];
    assert.ok(block, `${language}: missing ${attempt} display`);
    for (const key of ['practiceOpening', 'practiceEnding']) {
      const value = record[language][key].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
      assert.equal(block.split(value).length - 1, 1, `${language}: ${attempt} must retain ${key} exactly once`);
    }
    assert.equal(block.includes('class="pause-cue"'), attempt === 'retry', `${language}: pause belongs only in retry`);
  }
}
let inspected = 0;
for(const file of await fs.readdir('dist',{recursive:true})) {
  if(!/\.(html|js|json|xml|map)$/.test(file)) continue;
  const output = await fs.readFile(`dist/${file}`,'utf8');
  assert.ok(!output.includes(record.editorialNote), `${file}: editorial note leaked`);
  inspected++;
}
console.log(`Course editorial PASS: paired copy and same-word retry parity, ${invalidTransforms.length} invalid records rejected, note excluded from ${inspected} public files.`);
