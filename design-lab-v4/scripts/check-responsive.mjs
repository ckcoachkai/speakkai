import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const outputDir = process.env.RESPONSIVE_QA_DIR || "output/playwright/v4/responsive-qa";
const start = Number(process.env.TEST_START || 21);
const end = Number(process.env.TEST_END || 50);
const viewports = [
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});

const report = [];
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();

  for (let test = start; test <= end; test += 1) {
    const consoleErrors = [];
    const pageErrors = [];
    const onConsole = (message) => { if (message.type() === "error") consoleErrors.push(message.text()); };
    const onPageError = (error) => pageErrors.push(String(error));
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    const url = new URL(`/tests/${test}/`, baseUrl).toString();
    let checks = {};
    let error = null;

    try {
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      checks = await page.evaluate(() => {
        const doc = document.documentElement;
        const requiredSelectors = [
          '[data-qa="experiment-root"]',
          '[data-qa="brand"]',
          '[data-qa="primary-message"]',
          '[data-qa="portrait"]',
          '[data-qa="primary-cta"]',
          '[data-qa="test-switcher"]',
        ];
        return {
          statusReady: document.readyState === "complete",
          requiredPresent: requiredSelectors.every((selector) => Boolean(document.querySelector(selector))),
          horizontalOverflow: Math.max(0, doc.scrollWidth - innerWidth),
          verticalScrollable: doc.scrollHeight > innerHeight,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
        };
      });
      checks.status = response?.status() ?? null;

      const controls = page.locator('[data-v4-control]');
      checks.controlCount = await controls.count();
      checks.firstControlVisible = checks.controlCount > 0 && await controls.first().isVisible();
      if (checks.controlCount > 1) {
        await controls.nth(1).click();
        checks.touchPanelSwitch = await controls.nth(1).getAttribute("aria-selected") === "true";
      }

      const cta = page.locator('[data-qa="primary-cta"]');
      await cta.scrollIntoViewIfNeeded();
      checks.ctaReachable = await cta.isVisible() && await cta.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight + 1 && rect.left >= 0 && rect.right <= innerWidth + 1;
      });

      checks.imagesLoaded = await page.locator("img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0));
      const failed =
        checks.status >= 400 ||
        !checks.statusReady ||
        !checks.requiredPresent ||
        checks.horizontalOverflow > 4 ||
        !checks.firstControlVisible ||
        !checks.touchPanelSwitch ||
        !checks.ctaReachable ||
        !checks.imagesLoaded ||
        consoleErrors.length > 0 ||
        pageErrors.length > 0;
      report.push({ test, viewport, url, checks, consoleErrors, pageErrors, failed });
    } catch (caught) {
      error = String(caught);
      report.push({ test, viewport, url, checks, consoleErrors, pageErrors, error, failed: true });
    } finally {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    }
  }

  await context.close();
}

const galleryContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const galleryPage = await galleryContext.newPage();
await galleryPage.goto(new URL("/tests/", baseUrl).toString(), { waitUntil: "networkidle" });
const galleryChecks = {
  cards: await galleryPage.locator(".card").count(),
  filters: await galleryPage.locator("[data-filter]").count(),
};
await galleryPage.locator('[data-filter="parent"]').click();
galleryChecks.parentCardsVisible = await galleryPage.locator(".card:not([hidden])").count();
galleryChecks.horizontalOverflow = await galleryPage.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
galleryChecks.failed = galleryChecks.cards !== 30 || galleryChecks.filters < 7 || galleryChecks.parentCardsVisible !== 10 || galleryChecks.horizontalOverflow > 4;
await galleryContext.close();

await fs.writeFile(path.join(outputDir, "responsive-report.json"), JSON.stringify({ routes: report, gallery: galleryChecks }, null, 2));
await browser.close();

const failures = report.filter((item) => item.failed);
console.log(`Responsive checks: ${report.length - failures.length}/${report.length} route states passed.`);
console.log(`Gallery mobile filter: ${galleryChecks.failed ? "failed" : "passed"}.`);
if (failures.length || galleryChecks.failed) {
  for (const item of failures) console.error(`Test ${item.test} @ ${item.viewport.name}: ${item.error || JSON.stringify(item.checks)}`);
  if (galleryChecks.failed) console.error(JSON.stringify(galleryChecks));
  process.exitCode = 1;
}
