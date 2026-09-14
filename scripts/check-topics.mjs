import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const topics=JSON.parse(await fs.readFile('src/data/topics.json','utf8'));
assert.equal(topics.length,100);assert.equal(new Set(topics.map(t=>t.id)).size,100);
for(const lens of ['overall','expository','oratory','logic','unusual'])assert.equal(new Set(topics.map(t=>t.ranks?.[lens])).size,100,`${lens} ranks must be unique`);
const index=await fs.readFile('dist/topic/index.html','utf8');
const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"');
let sources=0;const images=new Set();
for(let i=0;i<topics.length;i++){
  const t=topics[i];assert.equal(t.number,i+1);assert.match(t.date,/^2026-09-(0[1-9]|1[0-4])$/);
  const route=`/topic/${t.number}/`;
  const html=await fs.readFile(`dist${route}index.html`,'utf8');
  assert.ok(index.includes(`href="${route}"`),`Index link ${route}`);
  assert.ok(sitemap.includes(`https://speakkai.com${route}</loc>`),`Sitemap ${route}`);
  assert.ok(html.includes(`rel="canonical" href="https://speakkai.com${route}"`),`Canonical ${route}`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal(t.concepts.length,3);assert.ok(t.concepts.every(c=>typeof c==='string'&&c.trim()));
  assert.ok(t.summary.length>50&&t.plainSummary.length>30&&t.caveat.length>20);
  assert.ok(html.includes(`src="/topic/art/${t.imageKey}.webp"`));images.add(t.imageKey);
  assert.ok(html.includes('AI-generated concept illustration, not a photograph of the event.'));
  assert.ok(html.includes('id="evidence-heading"'));
  if(t.sensitivity && t.sensitivity!=='None')assert.ok(html.includes('class="topic-sensitivity"'),`${t.id} content note`);
  if(t.number>1)assert.ok(html.includes(`href="/topic/${t.number-1}/"`));
  if(t.number<100)assert.ok(html.includes(`href="/topic/${t.number+1}/"`));
  assert.ok(t.speech&&t.ageMin>=8&&t.ageMin<=16,`${t.id} speaking fields`);assert.ok(html.includes('id="speaking-heading"'));
  for(const lens of ['overall','expository','oratory','logic','unusual']){assert.equal(typeof t.scores?.[lens],'number',`${t.id} ${lens} score`);assert.ok(Number.isInteger(t.ranks?.[lens])&&t.ranks[lens]>=1&&t.ranks[lens]<=100,`${t.id} ${lens} rank`);}
  for(const source of t.sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.read);assert.ok(decode(html).includes(source.url));sources++;}
  assert.ok(Buffer.byteLength(html)<45000,`${route} exceeds 45 KB HTML`);
}
for(const key of images){const file=`dist/topic/art/${key}.webp`;const meta=await sharp(file).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,1200);assert.ok((await fs.stat(file)).size<260000);}
assert.equal((index.match(/<article\b[^>]*\sdata-topic-card(?:\s|>)/g)||[]).length,100);assert.equal((index.match(/<p\b[^>]*\sdata-topic-rank(?:\s|>)/g)||[]).length,100);assert.ok(index.includes('Overall rank #1'));assert.ok(!index.includes('id="topic-mode"'));assert.ok(!index.includes('News references'));assert.ok(index.includes('id="topic-search"'));assert.ok(index.includes('id="topic-sort"'));
const resources=await fs.readFile('dist/resources/index.html','utf8');assert.ok(resources.includes('href="/topic/"'));
console.log(JSON.stringify({status:'PASS',pages:100,rankedStories:100,sourceCitations:sources,illustrations:images.size,sitemap:'all 101 routes',navigation:'index and previous/next complete'}));
