import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { languagePairs, pageAlternates, localizedPath, languageChoices } from "../src/lib/siteLanguage.mjs";
const origin = "https://speakkai.com";
for (const [english,chinese] of languagePairs) {
  for (const [route,language] of [[english,"en"],[chinese,"zh-CN"]]) {
    const html = await readFile(`dist${route}index.html`,"utf8");
    assert.ok(html.includes(`<html lang="${language}"`),route);
    assert.ok(html.includes(`rel="canonical" href="${origin}${route}"`),route);
    for (const alternate of pageAlternates(route)) assert.ok(html.includes(`hreflang="${alternate.lang}" href="${origin}${alternate.href}"`),route);
    const top = html.match(/<div class="wrap site-language"[\s\S]*?<\/div>/)?.[0];
    assert.ok(top,`${route}: top language control missing`);
    assert.equal((top.match(/aria-current="page"/g)||[]).length,1,route);
    for (const choice of languageChoices(route,language)) assert.ok(top.includes(`href="${choice.href}"`),route);
    assert.doesNotMatch(html,/<meta[^>]*http-equiv="refresh"/i,route);
  }
}
assert.equal(localizedPath('/#work','zh-CN'),'/zh/#work');
assert.equal(localizedPath('/coaching/young-competition-speakers/#feedback-example','zh-CN'),'/zh/coaching/young-competition-speakers/#feedback-example');
assert.equal(localizedPath('/schedule/','zh-CN'),'/schedule/');
const fallback = await readFile('dist/404.html','utf8');
assert.ok(fallback.includes('中文首页'));
assert.doesNotMatch(fallback,/<link rel="alternate" hreflang="zh-CN"/);
const zhHome = await readFile('dist/zh/index.html','utf8');
for(const text of ['让你的表达，','找到自己的声音。','让表达融入校园。','让想法打动听众。','项目范围、费用和可安排时间','CKcoachkai','Young Competition Speakers']) assert.ok(zhHome.includes(text),text);
assert.ok(!zhHome.includes('<astro-island'),'Chinese homepage gained hydration');
console.log(`Site languages PASS: ${languagePairs.length} reciprocal pairs, explicit fallback, Chinese homepage and static navigation.`);

for (const slug of ['coaching','schools','companies']) {
  const zh = await readFile(`dist/zh/${slug}/index.html`,'utf8');
  const en = await readFile(`dist/${slug}/index.html`,'utf8');
  for (const id of ['formats','next-step','faq-title']) assert.ok(zh.includes(`id="${id}"`));
  assert.equal((zh.match(/<article class="offer"/g)||[]).length,3);
  assert.equal((zh.match(/<details\b/g)||[]).length,(en.match(/<details\b/g)||[]).length);
  assert.ok(zh.includes(`/zh/contact/?audience=${slug}`));
  assert.ok(zh.includes('准备咨询内容'));
  assert.ok(!zh.includes('准备咨询内容（英文）'));
  assert.ok(!zh.includes('<astro-island'));
}
const zhSchool = await readFile('dist/zh/schools/index.html','utf8');
for (const direction of ['workshop','sequence','teachers']) assert.ok(zhSchool.includes(`schoolDirection=${direction}`));
assert.ok(zhSchool.includes('不需要学生姓名或个人记录'));
const zhCompany = await readFile('dist/zh/companies/index.html','utf8');
assert.ok(zhCompany.includes('虚构练习示例'));
assert.ok(zhCompany.includes('咨询或查看时间安排并不代表预订成功'));
assert.ok(zhCompany.includes('发送内部文件前，先商定保密与材料分享安排'));
console.log('Chinese offers PASS: three formats per audience, full disclosures, query directions, static reading and Chinese inquiry routes.');
