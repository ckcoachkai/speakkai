import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4321";
const outputDir = process.env.INTERACTION_QA_DIR || "output/playwright/v4/interaction-qa";
const start = Number(process.env.TEST_START || 21);
const end = Number(process.env.TEST_END || 50);

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || undefined,
});

const report = [];

for (let test = start; test <= end; test += 1) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: "reduce",
    hasTouch: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  const url = new URL(`/tests/${test}/`, baseUrl).toString();
  const checks = {};
  let error = null;

  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    checks.status = response?.status() ?? null;

    const controls = page.locator('[data-v4-control]');
    const controlCount = await controls.count();
    checks.controlCount = controlCount;
    checks.hasInteraction = controlCount >= 3;

    if (controlCount >= 2) {
      await controls.nth(0).focus();
      await page.keyboard.press("ArrowRight");
      checks.keyboardArrowSelectsNext = await controls.nth(1).getAttribute("aria-selected") === "true";
      const secondTarget = await controls.nth(1).getAttribute("data-target");
      checks.keyboardPanelVisible = secondTarget ? await page.locator(`#${secondTarget}`).isVisible() : false;
      await controls.nth(Math.min(2, controlCount - 1)).click();
      checks.touchClickSelects = await controls.nth(Math.min(2, controlCount - 1)).getAttribute("aria-selected") === "true";
    }

    const cta = page.locator('[data-qa="primary-cta"]');
    checks.primaryCtaHref = await cta.getAttribute("href");
    checks.primaryCtaVisible = await cta.isVisible();
    checks.primaryCtaInViewport = await cta.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
    });

    const imageState = await page.locator("img").evaluateAll((images) => images.map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth })));
    checks.imagesLoaded = imageState.every((item) => item.complete && item.naturalWidth > 0);
    checks.imageState = imageState;

    const summary = page.locator(".v4-jump summary");
    await summary.click();
    checks.switcherOpens = await page.locator(".v4-jump").evaluate((element) => element.hasAttribute("open"));
    checks.switcherPanelBounded = await page.locator(".v4-jump-panel").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight + 1 && element.scrollHeight >= element.clientHeight;
    });
    await summary.click();

    checks.reducedMotionApplied = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll(".wave-field i, .v4-experiment *")].slice(0, 300);
      return candidates.every((element) => {
        const style = getComputedStyle(element);
        const durations = style.animationDuration.split(",").map((value) => value.trim());
        return durations.every((value) => {
          if (value.endsWith("ms")) return Number.parseFloat(value) <= 0.01;
          if (value.endsWith("s")) return Number.parseFloat(value) <= 0.00001;
          return value === "0";
        });
      });
    });

    if (test === 50) {
      await page.goto(`${url}?audience=student`, { waitUntil: "networkidle" });
      checks.audienceDeepLink = await page.locator('[data-audience="student"]').getAttribute("aria-selected") === "true";
      await page.locator('[data-audience="school"]').click();
      checks.audienceUrlUpdates = new URL(page.url()).searchParams.get("audience") === "school";
    }

    const failed =
      checks.status >= 400 ||
      !checks.hasInteraction ||
      !checks.keyboardArrowSelectsNext ||
      !checks.keyboardPanelVisible ||
      !checks.touchClickSelects ||
      !checks.primaryCtaVisible ||
      !checks.primaryCtaInViewport ||
      !checks.primaryCtaHref ||
      !checks.imagesLoaded ||
      !checks.switcherOpens ||
      !checks.switcherPanelBounded ||
      !checks.reducedMotionApplied ||
      (test === 50 && (!checks.audienceDeepLink || !checks.audienceUrlUpdates)) ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0;

    report.push({ test, url, checks, consoleErrors, pageErrors, failed });
  } catch (caught) {
    error = String(caught);
    report.push({ test, url, checks, consoleErrors, pageErrors, error, failed: true });
  }

  await context.close();
}

await fs.writeFile(path.join(outputDir, "interaction-report.json"), JSON.stringify(report, null, 2));
await browser.close();

const failures = report.filter((item) => item.failed);
console.log(`Interaction checks: ${report.length - failures.length}/${report.length} passed.`);
if (failures.length) {
  for (const item of failures) console.error(`Test ${item.test}: ${item.error || JSON.stringify(item.checks)}`);
  process.exitCode = 1;
}
