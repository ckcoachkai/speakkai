import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const outputDir = process.env.PERFORMANCE_QA_DIR || "output/playwright/v4/performance-qa";
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});
const report = [];

for (let test = 1; test <= 4; test += 1) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const url = new URL(`/tests/${test}/`, baseUrl).toString();
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  const metrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      encodedBodySize: entry.encodedBodySize,
      transferSize: entry.transferSize,
      duration: entry.duration,
    }));
    const images = [...document.images].map((image) => image.currentSrc || image.src);
    return {
      htmlChars: document.documentElement.outerHTML.length,
      resources,
      images,
      externalScripts: [...document.scripts].filter((script) => script.src).map((script) => script.src),
      autoplayMedia: [...document.querySelectorAll("video[autoplay],audio[autoplay]")].length,
      mediaElements: document.querySelectorAll("video,audio").length,
      totalEncodedBodySize: resources.reduce((sum, item) => sum + (item.encodedBodySize || 0), 0),
      cssEncodedBodySize: resources.filter((item) => item.initiatorType === "css" || item.name.endsWith(".css")).reduce((sum, item) => sum + (item.encodedBodySize || 0), 0),
      imageEncodedBodySize: resources.filter((item) => item.initiatorType === "img").reduce((sum, item) => sum + (item.encodedBodySize || 0), 0),
    };
  });

  const inactiveExperimentMedia = metrics.images.filter((src) => !src.endsWith("/images/coach-kai-headshot.webp"));
  const failed =
    (response?.status() || 500) >= 400 ||
    metrics.htmlChars > 20_000 ||
    metrics.totalEncodedBodySize > 500_000 ||
    metrics.cssEncodedBodySize > 120_000 ||
    metrics.images.length > 2 ||
    inactiveExperimentMedia.length > 0 ||
    metrics.externalScripts.length > 0 ||
    metrics.autoplayMedia > 0 ||
    metrics.mediaElements > 0;

  report.push({ test, url, status: response?.status() ?? null, metrics, inactiveExperimentMedia, failed });
  await context.close();
}

await fs.writeFile(path.join(outputDir, "performance-report.json"), JSON.stringify(report, null, 2));
await browser.close();

const failures = report.filter((item) => item.failed);
const maxBytes = Math.max(...report.map((item) => item.metrics.totalEncodedBodySize));
const maxHtml = Math.max(...report.map((item) => item.metrics.htmlChars));
console.log(`Performance checks: ${report.length - failures.length}/${report.length} passed.`);
console.log(`Largest route resource total: ${maxBytes} encoded bytes; largest HTML: ${maxHtml} characters.`);
if (failures.length) {
  for (const item of failures) console.error(`Test ${item.test}: ${JSON.stringify(item.metrics)}`);
  process.exitCode = 1;
}
