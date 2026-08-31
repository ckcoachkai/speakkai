import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const output = "design-lab-v5/evidence/evolution-quality-report.json";
const viewports = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile-large", width: 390, height: 844 },
  { name: "mobile-small", width: 360, height: 800 },
];
const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH || undefined });
const report = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width <= 820, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (let version = 1; version <= 14; version += 1) {
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    const response = await page.goto(`${baseUrl}/tests/${version}/`, { waitUntil: "networkidle", timeout: 45_000 });
    const checks = await page.evaluate(() => {
      const root = document.documentElement;
      const buttons = [...document.querySelectorAll("button")];
      const links = [...document.querySelectorAll("a")];
      const resources = performance.getEntriesByType("resource");
      return {
        status: document.readyState === "complete",
        h1Count: document.querySelectorAll("h1").length,
        horizontalOverflow: Math.max(0, root.scrollWidth - innerWidth),
        imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
        unnamedButtons: buttons.filter((button) => !(button.innerText || button.getAttribute("aria-label"))).length,
        emptyLinks: links.filter((link) => !link.getAttribute("href")).length,
        primaryCtaCount: document.querySelectorAll('[data-qa="primary-cta"]').length,
        editorUiPremature: Boolean(document.querySelector(".editor-toolbar")),
        visualEditorLoaded: resources.some((entry) => entry.name.includes("visual-editor.js")),
        totalTransfer: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        autoplayMedia: document.querySelectorAll("video[autoplay],audio[autoplay]").length,
      };
    });
    checks.httpStatus = response?.status() ?? null;
    checks.editButton = await page.locator("[data-editor-launch]").count();
    checks.failed = checks.httpStatus !== 200 || !checks.status || checks.h1Count !== 1 || checks.horizontalOverflow > 4 || !checks.imagesLoaded || checks.unnamedButtons > 0 || checks.emptyLinks > 0 || checks.primaryCtaCount < 1 || checks.editorUiPremature || checks.autoplayMedia > 0 || checks.editButton !== 0 || checks.visualEditorLoaded || consoleErrors.length > 0 || pageErrors.length > 0;
    report.push({ version, viewport, checks, consoleErrors, pageErrors });
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
  }
  await context.close();
}

const galleryPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await galleryPage.goto(`${baseUrl}/tests/`, { waitUntil: "networkidle" });
const gallery = { cards: await galleryPage.locator(".card").count(), horizontalOverflow: await galleryPage.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)) };
gallery.failed = gallery.cards !== 14 || gallery.horizontalOverflow > 4;

const architecturePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await architecturePage.goto(`${baseUrl}/tests/7/`, { waitUntil: "networkidle" });
const tabs = architecturePage.locator("[data-v4-control]");
await tabs.first().focus();
await architecturePage.keyboard.press("ArrowRight");
const keyboardTabs = (await tabs.nth(1).getAttribute("aria-selected")) === "true";

const mobilePreviews = [];
for (const version of [7, 10, 14]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseUrl}/tests/${version}/`, { waitUntil: "networkidle" });
  await page.locator("[data-mobile-preview]").click();
  const dialog = page.locator("[data-mobile-dialog]");
  await dialog.waitFor({ state: "visible" });
  const frameUrl = await page.locator("[data-mobile-frame]").getAttribute("src");
  const title = await dialog.locator("strong").innerText();
  await page.locator("[data-mobile-close]").click();
  const passed = frameUrl?.includes(`/tests/${version}/?mobile-preview=1`) && title.includes(`Version ${version}`) && !(await dialog.isVisible());
  mobilePreviews.push({ version, frameUrl, title, passed });
  await page.close();
}

await browser.close();
await fs.mkdir("design-lab-v5/evidence", { recursive: true });
await fs.writeFile(output, JSON.stringify({ report, gallery, keyboardTabs, mobilePreviews }, null, 2));
const failures = report.filter((item) => item.checks.failed);
const mobilePreviewFailures = mobilePreviews.filter((item) => !item.passed);
if (failures.length || gallery.failed || !keyboardTabs || mobilePreviewFailures.length) {
  for (const item of failures) console.error(`Version ${item.version} @ ${item.viewport.name}: ${JSON.stringify(item.checks)}`);
  if (gallery.failed) console.error(`Gallery: ${JSON.stringify(gallery)}`);
  if (!keyboardTabs) console.error("Version 3 refinement tabs failed keyboard navigation");
  for (const item of mobilePreviewFailures) console.error(`Mobile preview failed: ${JSON.stringify(item)}`);
  process.exit(1);
}
console.log(`Homepage quality check passed: ${report.length}/${report.length} route/viewport states, fourteen-card gallery, keyboard tabs, three mobile-preview dialogs, and no editor payload.`);
