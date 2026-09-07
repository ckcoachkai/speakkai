import { readFile, readdir, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

const read = file => readFile(file, "utf8");
const escape = s => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const files = (await readdir("src/content/practice")).filter(file => file.endsWith(".json"));
const index = await read("dist/resources/index.html");
const sitemap = await read("dist/sitemap.xml");
const editorNotes = [];
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
for (const target of ["dist/keystatic", "dist/api/keystatic"]) assert.equal(await stat(target).catch(() => null), null);
assert.ok(!(await read("dist/index.html")).includes("<astro-island"), "Homepage gained client hydration");
console.log(`Practice PASS: ${published} public lessons, ${drafts} drafts excluded; source parity, listing, sitemap, editor isolation and static homepage.`);
