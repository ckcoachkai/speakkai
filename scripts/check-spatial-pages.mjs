import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined;
const outputDir = "output/playwright/spatial-pages";
const routes = [
  { name: "about", path: "/about/", canonical: "https://speakkai.com/about/" },
  { name: "contact", path: "/contact/", canonical: "https://speakkai.com/contact/" },
  { name: "resources", path: "/resources/", canonical: "https://speakkai.com/resources/" },
  { name: "schedule", path: "/schedule/", canonical: "https://speakkai.com/schedule/" },
];
const expectedNavigation = ["/", "/about/", "/schedule/", "/resources/", "/contact/"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const failures = [];
const report = [];
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath });
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width <= 760, reducedMotion: "reduce" });
  for (const [index, route] of routes.entries()) {
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("response", (item) => { if (item.status() >= 400) failedRequests.push(`${item.status()} ${item.url()}`); });
    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle", timeout: 45_000 });
    if (route.name === "schedule") await page.locator("#schedule:not([hidden])").waitFor({ state: "visible", timeout: 15_000 });
    const checks = await page.evaluate(({ routeName, expectedNavigation }) => ({
      h1Count: document.querySelectorAll("h1").length,
      navCount: document.querySelectorAll(".spatial-site-header .site-nav").length,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
      navigation: [...document.querySelectorAll(".spatial-site-header .site-nav a")].map((link) => link.getAttribute("href")),
      activeNavigation: document.querySelector(".spatial-site-header .site-nav a[aria-current='page']")?.getAttribute("href") || "",
      navigationComplete: expectedNavigation.every((href) => [...document.querySelectorAll(".spatial-site-header .site-nav a")].some((link) => link.getAttribute("href") === href)),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      scheduleTable: routeName === "schedule" ? document.querySelectorAll("#table-shell table").length : null,
      scheduleTabs: routeName === "schedule" ? [...document.querySelectorAll(".sheet-tab")].map((tab) => tab.textContent?.trim()) : null,
      scheduleMonth: routeName === "schedule" ? document.querySelector("#month-heading")?.textContent?.trim() : null,
      contactPanel: routeName === "contact" ? document.querySelectorAll(".contact-strip.is-page").length : null,
      contactQrFrame: routeName === "contact" ? (() => {
        const frame = document.querySelector(".contact-strip.is-page .contact-qr-wrap");
        if (!(frame instanceof HTMLElement)) return null;
        const rect = frame.getBoundingClientRect();
        return { width: rect.width, height: rect.height, radius: getComputedStyle(frame).borderRadius };
      })() : null,
      resourceCards: routeName === "resources" ? document.querySelectorAll(".tool-card").length : null,
    }), { routeName: route.name, expectedNavigation });
    const failed = response?.status() !== 200 || checks.h1Count !== 1 || checks.navCount !== 1 || checks.canonical !== route.canonical || !checks.navigationComplete || checks.activeNavigation !== route.path || checks.horizontalOverflow > 4 || !checks.imagesLoaded || consoleErrors.length > 0 || pageErrors.length > 0 || failedRequests.length > 0 || (route.name === "schedule" && (checks.scheduleTable !== 1 || checks.scheduleMonth !== "September 2026" || checks.scheduleTabs?.length !== 1)) || (route.name === "contact" && (checks.contactPanel !== 1 || !checks.contactQrFrame || Math.abs(checks.contactQrFrame.width - checks.contactQrFrame.height) > 2 || checks.contactQrFrame.radius !== "14px")) || (route.name === "resources" && checks.resourceCards < 5);
    if (failed) failures.push(`${route.name} at ${viewport.name}: ${JSON.stringify({ checks, consoleErrors, pageErrors, failedRequests })}`);
    const screenshot = path.join(outputDir, `test-${String(index + 1).padStart(2, "0")}-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
    report.push({ route: route.name, viewport, status: response?.status() ?? null, checks, consoleErrors, pageErrors, failedRequests, screenshot });
    await page.close();
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`Spatial page check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Spatial page check passed: About, Contact, Resources, and Schedule at desktop and mobile sizes with working navigation, content, images, and schedule rendering.");
