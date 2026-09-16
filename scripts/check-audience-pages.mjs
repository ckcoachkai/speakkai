import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const slugs=['kindergarten','primary','upper-primary','middle-school','high-school','adults'];
for(const prefix of ['','/zh']){
  const home=await readFile(`dist${prefix}/index.html`,'utf8');
  for(const slug of slugs)assert.ok(home.includes(`href="${prefix}/for/${slug}/"`),`Gateway must reach ${slug}`);
  assert.doesNotMatch(home,/Young Competition Speakers|FEATURED GROUP PROGRAMME|current-program-title/);
  for(const slug of slugs){
    const route=`${prefix}/for/${slug}/`;
    const html=await readFile(`dist${route}index.html`,'utf8');
    assert.ok(html.includes(`data-audience="${slug}"`));
    assert.doesNotMatch(html,/current-program-title|Young Competition Speakers|data-audience-link/,'Landing must stay specific to its audience');
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    for(const id of ['courses','story','connect'])assert.ok(html.includes(`id="${id}"`));
    assert.ok((html.match(/data-course-focus=/g)||[]).length>=4,'Detailed course choices must be present');
    assert.ok(html.includes(prefix?'线上课程即将推出':'Online classes coming soon'));
    assert.ok(html.includes('portrait-scene'));
    if(slug==='adults')assert.doesNotMatch(html,/data-course-focus="(?:drama|debate)"|favorite toy|小学低年级/);
    if(slug==='kindergarten')assert.doesNotMatch(html,/data-course-focus="(?:professional|debate)"|CEO|master’s admissions/);
  }
}
console.log('Audience pages PASS: 12 bilingual landings, gateway routes, scoped courses, no universal programme promotion, contact paths and online notice.');
