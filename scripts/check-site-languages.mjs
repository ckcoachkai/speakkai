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
const fallback = await readFile('dist/schools/index.html','utf8');
assert.ok(fallback.includes('中文首页'));
assert.doesNotMatch(fallback,/<link rel="alternate" hreflang="zh-CN"/);
const zhHome = await readFile('dist/zh/index.html','utf8');
for(const text of ['让你的表达，','找到自己的声音。','让表达融入校园。','让想法打动听众。','项目范围、费用和可安排时间','CKcoachkai','Young Competition Speakers']) assert.ok(zhHome.includes(text),text);
assert.ok(!zhHome.includes('<astro-island'),'Chinese homepage gained hydration');
console.log(`Site languages PASS: ${languagePairs.length} reciprocal pairs, explicit fallback, Chinese homepage and static navigation.`);
