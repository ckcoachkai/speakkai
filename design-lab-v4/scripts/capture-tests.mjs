import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4321";
const routeTemplate = process.env.ROUTE_TEMPLATE || "/tests/{n}/";
const start = Number(process.env.TEST_START || 1);
const end = Number(process.env.TEST_END || 4);
const outputDir = process.env.SCREENSHOT_DIR || "output/playwright/v4/screenshots";
const width = Number(process.env.VIEWPORT_WIDTH || 1920);
const height = Number(process.env.VIEWPORT_HEIGHT || 1080);
const reducedMotion = process.env.REDUCED_MOTION === "1" ? "reduce" : "no-preference";

function routeFor(n) {
  return routeTemplate.replace("{n}", String(n));
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width, height },
  reducedMotion,
  deviceScaleFactor: 1,
});
const page = await context.newPage();

const report = [];

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

  let status = null;
  let error = null;
  const startedAt = Date.now();

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    status = response?.status() ?? null;

    // Prefer a project-provided readiness flag, but do not require it.
    await page
      .waitForFunction(() => {
        const root = document.querySelector('[data-qa="experiment-root"]');
        return !root || root.getAttribute("data-qa-ready") !== "false";
      }, null, { timeout: 5_000 })
      .catch(() => {});

    // Give fonts and finite entrance motion a brief chance to settle.
    await page.waitForTimeout(800);

    const file = path.join(
      outputDir,
      `test-${String(n).padStart(2, "0")}-${width}x${height}.png`,
    );

    await page.screenshot({
      path: file,
      fullPage: false,
      animations: "disabled",
    });

    report.push({
      test: n,
      route,
      url,
      status,
      screenshot: file,
      consoleErrors,
      pageErrors,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (caught) {
    error = String(caught);
    report.push({
      test: n,
      route,
      url,
      status,
      error,
      consoleErrors,
      pageErrors,
      elapsedMs: Date.now() - startedAt,
    });
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

await fs.writeFile(
  path.join(outputDir, `capture-report-${width}x${height}.json`),
  JSON.stringify(report, null, 2),
);

await browser.close();

const failures = report.filter(
  (item) =>
    item.error ||
    (typeof item.status === "number" && item.status >= 400) ||
    item.pageErrors.length > 0,
);

console.log(
  `Captured ${report.length - failures.length}/${report.length} tests at ${width}x${height}.`,
);

if (failures.length) {
  console.error(`Failures: ${failures.map((item) => item.test).join(", ")}`);
  process.exitCode = 1;
}
