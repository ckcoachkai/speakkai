import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4321";
const routeTemplate = process.env.ROUTE_TEMPLATE || "/tests/{n}/";
const start = Number(process.env.TEST_START || 1);
const end = Number(process.env.TEST_END || 4);
const outputDir = process.env.QA_DIR || "output/playwright/v4/viewport-qa";
const tolerance = Number(process.env.OVERFLOW_TOLERANCE || 4);

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
];

function routeFor(n) {
  return routeTemplate.replace("{n}", String(n));
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});
const report = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (let n = start; n <= end; n += 1) {
    const route = routeFor(n);
    const url = new URL(route, baseUrl).toString();
    const consoleErrors = [];
    const pageErrors = [];

    const onConsole = (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    };
    const onPageError = (error) => pageErrors.push(String(error));
    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    let metrics = null;
    let error = null;
    let status = null;

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 45_000,
      });
      status = response?.status() ?? null;
      await page.waitForTimeout(500);

      metrics = await page.evaluate(({ tolerance }) => {
        const scrollingElement = document.scrollingElement || document.documentElement;
        const body = document.body;
        const doc = document.documentElement;

        const scrollHeight = Math.max(
          scrollingElement?.scrollHeight || 0,
          body?.scrollHeight || 0,
          doc?.scrollHeight || 0,
        );
        const scrollWidth = Math.max(
          scrollingElement?.scrollWidth || 0,
          body?.scrollWidth || 0,
          doc?.scrollWidth || 0,
        );

        const required = {
          root: Boolean(document.querySelector('[data-qa="experiment-root"]')),
          brand: Boolean(document.querySelector('[data-qa="brand"]')),
          primaryMessage: Boolean(document.querySelector('[data-qa="primary-message"]')),
          portrait: Boolean(document.querySelector('[data-qa="portrait"]')),
          primaryCta: Boolean(document.querySelector('[data-qa="primary-cta"]')),
          testSwitcher: Boolean(document.querySelector('[data-qa="test-switcher"]')),
        };

        const visibleText = [...document.querySelectorAll("body *")]
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const hasOwnText = [...element.childNodes].some(
              (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
            );
            return (
              hasOwnText &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              Number(style.opacity) > 0 &&
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.top < innerHeight &&
              rect.right > 0 &&
              rect.left < innerWidth
            );
          })
          .map((element) => ({
            text: element.textContent.trim().slice(0, 120),
            fontSize: parseFloat(getComputedStyle(element).fontSize),
            rect: element.getBoundingClientRect().toJSON(),
          }));

        const tinyVisibleText = visibleText.filter(
          (item) => Number.isFinite(item.fontSize) && item.fontSize < 11,
        );

        const offscreenInteractive = [
          ...document.querySelectorAll(
            'a, button, input, select, textarea, [role="button"], [role="tab"], [role="dialog"]',
          ),
        ]
          .filter((element) => {
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const rect = element.getBoundingClientRect();
            return (
              rect.right > innerWidth + tolerance ||
              rect.bottom > innerHeight + tolerance ||
              rect.left < -tolerance ||
              rect.top < -tolerance
            );
          })
          .map((element) => ({
            tag: element.tagName,
            text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 100),
            rect: element.getBoundingClientRect().toJSON(),
          }));

        return {
          viewport: { width: innerWidth, height: innerHeight },
          scrollHeight,
          scrollWidth,
          verticalOverflow: Math.max(0, scrollHeight - innerHeight),
          horizontalOverflow: Math.max(0, scrollWidth - innerWidth),
          required,
          tinyVisibleText: tinyVisibleText.slice(0, 20),
          offscreenInteractive: offscreenInteractive.slice(0, 20),
          title: document.title,
        };
      }, { tolerance });

      const failed =
        metrics.verticalOverflow > tolerance ||
        metrics.horizontalOverflow > tolerance ||
        Object.values(metrics.required).some((present) => !present) ||
        metrics.offscreenInteractive.length > 0 ||
        consoleErrors.length > 0 ||
        pageErrors.length > 0 ||
        (typeof status === "number" && status >= 400);

      let failureScreenshot = null;
      if (failed) {
        failureScreenshot = path.join(
          outputDir,
          `FAIL-test-${String(n).padStart(2, "0")}-${viewport.width}x${viewport.height}.png`,
        );
        await page.screenshot({
          path: failureScreenshot,
          fullPage: false,
          animations: "disabled",
        });
      }

      report.push({
        test: n,
        route,
        url,
        status,
        viewport,
        metrics,
        consoleErrors,
        pageErrors,
        failureScreenshot,
        failed,
      });
    } catch (caught) {
      error = String(caught);
      report.push({
        test: n,
        route,
        url,
        status,
        viewport,
        error,
        consoleErrors,
        pageErrors,
        failed: true,
      });
    } finally {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    }
  }

  await context.close();
}

await fs.writeFile(
  path.join(outputDir, "one-screen-report.json"),
  JSON.stringify(report, null, 2),
);

await browser.close();

const failures = report.filter((item) => item.failed);
console.log(
  `One-screen checks: ${report.length - failures.length}/${report.length} passed.`,
);

if (failures.length) {
  const summary = failures
    .slice(0, 40)
    .map((item) => `Test ${item.test} @ ${item.viewport.width}x${item.viewport.height}`)
    .join("\n");
  console.error(summary);
  process.exitCode = 1;
}
