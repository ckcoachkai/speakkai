import { readFile, readdir, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { translatedPracticeSlugs, publishedTranslatedPracticeSlugs } from "../src/lib/practiceAvailability.mjs";
import { languagePairs } from "../src/lib/siteLanguage.mjs";

const read = file => readFile(file, "utf8");
const escape = s => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const files = (await readdir("src/content/practice")).filter(file => file.endsWith(".json"));
const index = await read("dist/resources/index.html");
const sitemap = await read("dist/sitemap.xml");
const editorNotes = [];
const zhIndex = await read('dist/zh/resources/index.html');
for (const slug of translatedPracticeSlugs) {
  const source = JSON.parse(await read(`src/content/practice/${slug}.json`));
  const route = `/zh/resources/${slug}/`;
  const target = `dist${route}index.html`;
  if (!source.published) {
    assert.equal(await stat(target).catch(() => null),null,`Chinese draft emitted: ${slug}`);
    assert.ok(!zhIndex.includes(route));
    assert.ok(!sitemap.includes(route));
    assert.ok(!languagePairs.some(pair => pair.includes(route)));
    continue;
  }
  assert.ok(publishedTranslatedPracticeSlugs.includes(slug));
  const html = await read(target);
  assert.ok(zhIndex.includes(route));
  assert.ok(sitemap.includes(route));
  assert.ok(html.includes('不录音，也不保存进度'));
  assert.ok(html.includes('href="/zh/resources/"'));
  const times = [...html.matchAll(/class="step-time"[^>]*>(\d+) 分钟/g)].map(m => Number(m[1]));
  assert.deepEqual(times,source.steps.map(step => step.minutes));
  assert.equal(times.reduce((sum,n)=>sum+n,0),source.minutes);
  if (slug === 'explain-then-swap') for (const text of ['不需要分享私人经历','不评价对方这个人','不对表达者进行排名','/zh/schools/#next-step']) assert.ok(html.includes(text),text);
  if (slug === 'one-minute-brief') for (const text of ['不要编造证据或结果','45–60 秒','不评价表达者的性格或口音','并不预测建议是否会获批','/zh/companies/#next-step']) assert.ok(html.includes(text),text);
}
let published = 0;
let drafts = 0;
for (const file of files) {
  const lesson = JSON.parse(await read(`src/content/practice/${file}`));
  const slug = file.slice(0, -5);
  const target = `dist/resources/${slug}/index.html`;
  editorNotes.push(lesson.editorialNote);
  if (!lesson.published) {
    drafts++;
    assert.equal(await stat(target).catch(() => null), null, `Draft emitted: ${slug}`);
    assert.ok(!index.includes(`/resources/${slug}/`), `Draft listed: ${slug}`);
    assert.ok(!sitemap.includes(`/resources/${slug}/`), `Draft indexed: ${slug}`);
    continue;
  }
  published++;
  const html = await read(target);
  for (const text of [lesson.title, lesson.introduction, lesson.setting, lesson.materials, lesson.frameTitle, lesson.listenerGuide, lesson.feedbackExample, ...lesson.prompts, ...lesson.steps.flatMap(step => [step.title, step.detail])]) {
    assert.ok(html.includes(escape(text)), `${slug}: missing authored text ${text}`);
  }
  assert.equal(lesson.steps.reduce((sum, step) => sum + step.minutes, 0), lesson.minutes);
  assert.ok(index.includes(`/resources/${slug}/`));
  assert.ok(sitemap.includes(`/resources/${slug}/`));
  assert.match(html, /component-export="default"/);
  assert.ok(html.includes(`/contact/?audience=${lesson.followUp}`), `${slug}: wrong inquiry audience`);
}
async function inspect(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) { await inspect(file); continue; }
    if (!/\.(html|js|json|xml)$/.test(file)) continue;
    const text = await read(file);
    assert.ok(!text.includes("editorialNote"), `${file}: editor-only field name leaked`);
    for (const note of editorNotes) assert.ok(!text.includes(note), `${file}: editor note leaked`);
  }
}
await inspect("dist");
const story = JSON.parse(await read("src/content/practice/one-object-story.json"));
const zhPath = "dist/zh/resources/one-object-story/index.html";
if (story.published) {
  const en = await read("dist/resources/one-object-story/index.html");
  const zh = await read(zhPath);
  for (const html of [en, zh]) {
    for (const [lang, route] of [["en", "/resources/one-object-story/"], ["zh-CN", "/zh/resources/one-object-story/"]]) {
      assert.ok(html.includes(`hreflang="${lang}" href="https://speakkai.com${route}"`), "Practice alternate missing");
    }
  }
  assert.match(zh, /<html lang="zh-CN"/);
  assert.ok(zh.includes('rel="canonical" href="https://speakkai.com/zh/resources/one-object-story/"'));
  assert.ok(sitemap.includes("/zh/resources/one-object-story/"));
  const times = [...zh.matchAll(/class="step-time"[^>]*>(\d+) 分钟/g)].map(m => Number(m[1]));
  assert.deepEqual(times, story.steps.map(step => step.minutes));
  for (const phrase of ["一件物品的故事", "我选择了……", "有一次……", "它对我重要，是因为……", "30–60 秒", "下次我想尝试的一件事", "不录音，也不保存进度", "切换语言会重新开始练习"]) assert.ok(zh.includes(phrase), `Chinese practice missing ${phrase}`);
  assert.ok(zh.includes('href="/zh/coaching/young-competition-speakers/"'));
  const course = await read("dist/zh/coaching/young-competition-speakers/index.html");
  assert.equal((course.match(/href="\/zh\/resources\/one-object-story\/"/g) || []).length, 2);
  console.log("Chinese practice PASS: timing, prompts, reciprocal language/course links, canonical, sitemap and privacy text.");
} else {
  assert.equal(await stat(zhPath).catch(() => null), null, "Draft Chinese story emitted");
  assert.ok(!sitemap.includes("/zh/resources/one-object-story/"));
}
for (const target of ["dist/keystatic", "dist/api/keystatic"]) assert.equal(await stat(target).catch(() => null), null);
assert.ok(!(await read("dist/index.html")).includes("<astro-island"), "Homepage gained client hydration");
console.log(`Practice PASS: ${published} public lessons, ${drafts} drafts excluded; source parity, listing, sitemap, editor isolation and static homepage.`);
