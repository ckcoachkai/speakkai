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
  for (let version = 5; version <= 12; version += 1) {
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
        sectionCount: document.querySelectorAll("[data-editor-section]").length,
        horizontalOverflow: Math.max(0, root.scrollWidth - innerWidth),
        imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
        unnamedButtons: buttons.filter((button) => !(button.innerText || button.getAttribute("aria-label"))).length,
        emptyLinks: links.filter((link) => !link.getAttribute("href")).length,
        primaryCtaCount: document.querySelectorAll(".evo-button.primary").length,
        editorUiPremature: Boolean(document.querySelector(".editor-toolbar")),
        visualEditorLoaded: resources.some((entry) => entry.name.includes("visual-editor.js")),
        totalTransfer: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        autoplayMedia: document.querySelectorAll("video[autoplay],audio[autoplay]").length,
      };
    });
    checks.httpStatus = response?.status() ?? null;
    checks.editButton = await page.locator("[data-editor-launch]").count();
    checks.failed = checks.httpStatus !== 200 || !checks.status || checks.h1Count !== 1 || checks.sectionCount < 4 || checks.horizontalOverflow > 4 || !checks.imagesLoaded || checks.unnamedButtons > 0 || checks.emptyLinks > 0 || checks.primaryCtaCount < 2 || checks.editorUiPremature || checks.autoplayMedia > 0 || (version <= 8 && checks.editButton !== 0) || (version >= 9 && checks.editButton !== 1) || checks.visualEditorLoaded || consoleErrors.length > 0 || pageErrors.length > 0;
    report.push({ version, viewport, checks, consoleErrors, pageErrors });
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
  }
  await context.close();
}

const galleryPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await galleryPage.goto(`${baseUrl}/tests/`, { waitUntil: "networkidle" });
const gallery = { cards: await galleryPage.locator(".card").count(), horizontalOverflow: await galleryPage.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)) };
gallery.failed = gallery.cards !== 12 || gallery.horizontalOverflow > 4;

const architecturePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await architecturePage.goto(`${baseUrl}/tests/8/`, { waitUntil: "networkidle" });
const tabs = architecturePage.locator("[data-evo-control]");
await tabs.first().focus();
await architecturePage.keyboard.press("ArrowRight");
const keyboardTabs = (await tabs.nth(1).getAttribute("aria-selected")) === "true";

await browser.close();
await fs.mkdir("design-lab-v5/evidence", { recursive: true });
await fs.writeFile(output, JSON.stringify({ report, gallery, keyboardTabs }, null, 2));
const failures = report.filter((item) => item.checks.failed);
if (failures.length || gallery.failed || !keyboardTabs) {
  for (const item of failures) console.error(`Version ${item.version} @ ${item.viewport.name}: ${JSON.stringify(item.checks)}`);
  if (gallery.failed) console.error(`Gallery: ${JSON.stringify(gallery)}`);
  if (!keyboardTabs) console.error("Architecture tabs failed keyboard navigation");
  process.exit(1);
}
console.log(`Evolution quality check passed: ${report.length}/${report.length} route/viewport states, gallery, keyboard tabs, lazy editor loading.`);
