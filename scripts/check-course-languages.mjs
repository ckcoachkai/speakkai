import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const origin = "https://speakkai.com";
const english = "/coaching/young-competition-speakers/";
const chinese = `/zh${english}`;
const pages = await Promise.all([english, chinese].map(route => readFile(`dist${route}index.html`, "utf8")));
for (const [index, html] of pages.entries()) {
  const lang = index ? "zh-CN" : "en";
  const route = index ? chinese : english;
  assert.ok(html.includes(`<html lang="${lang}"`));
  assert.ok(html.includes(`<link rel="canonical" href="${origin}${route}"`));
  for (const [code, target] of [["en", english], ["zh-CN", chinese], ["x-default", english]]) {
    assert.ok(html.includes(`<link rel="alternate" hreflang="${code}" href="${origin}${target}"`));
  }
  assert.match(html, /CKcoachkai/);
  assert.match(html, /id="course-contact"/);
  assert.match(html, /href="\/images\/coach-kai-wechat-qr.png"/);
  const facts = html.match(/<dl class="course-facts"[^>]*>(.*?)<\/dl>/s)?.[1];
  assert.ok(facts);
  assert.equal((facts.match(/<dt\b/g) || []).length, 4);
  const values = [...facts.matchAll(/<dd[^>]*>(.*?)<\/dd>/g)].map(m => m[1].replace(/<[^>]+>/g, ""));
  assert.deepEqual(values.map(value => value.match(/\d+/g)), [["18"], ["6", "3"], ["60", "90"], ["3"]]);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
}
for (const text of ["Fall 2026", "Grades 1–2", "Supported", "not a student testimonial", "does not guarantee", "does not reserve a place"]) assert.ok(pages[0].includes(text), text);
for (const text of ["2026 年秋季", "1–2 年级", "在支持下完成", "并非学生评价", "不保证竞赛结果", "咨询不会保留名额", "每节课时长", "费用和名额", "示例练习"]) assert.ok(pages[1].includes(text), text);
console.log("Course languages PASS: two static routes, reciprocal alternates, shared numerical scope, contact paths and scope boundaries.");
