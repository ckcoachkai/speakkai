import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined;
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const browser = await chromium.launch({ headless: true, executablePath });

const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: "no-preference" });
const consoleErrors = [];
desktop.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
const response = await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
const initial = await desktop.evaluate(() => ({
  status: document.readyState,
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
  robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
  h1Count: document.querySelectorAll("h1").length,
  labNavCount: document.querySelectorAll(".v4-nav, [data-qa='test-switcher']").length,
  productionHeaderCount: document.querySelectorAll(".spatial-site-header").length,
  controls: document.querySelectorAll("[data-home-control]").length,
  primaryCtaCount: document.querySelectorAll('[data-qa="primary-cta"]').length,
  horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  imagesLoaded: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
}));

assert(response?.status() === 200, "Homepage did not return HTTP 200.");
assert(initial.status === "complete", "Homepage did not finish loading.");
assert(initial.canonical === "https://speakkai.com/", "Canonical homepage URL is missing or incorrect.");
assert(!initial.robots.toLowerCase().includes("noindex"), "Production homepage must not be noindex.");
assert(initial.h1Count === 1, "Production homepage must contain exactly one H1.");
assert(initial.labNavCount === 0, "Experiment-lab toolbar leaked onto the production homepage.");
assert(initial.productionHeaderCount === 1, "Production navigation is missing.");
assert(initial.controls === 3, "Production homepage must contain three information controls.");
assert(initial.primaryCtaCount === 1, "Production homepage must contain one primary CTA.");
assert(initial.horizontalOverflow <= 4, "Desktop homepage has horizontal overflow.");
assert(initial.imagesLoaded, "A production homepage image failed to load.");

await desktop.waitForTimeout(3200);
const motion = await desktop.evaluate(() => {
  const controls = [...document.querySelectorAll("[data-home-control]")];
  const activeControl = controls.findIndex((control) => control.getAttribute("aria-selected") === "true");
  const activePanel = document.querySelector("[data-home-panel]:not([hidden])");
  const animation = activePanel?.getAnimations()[0];
  return {
    activeControl,
    activePanel: activePanel?.id || "",
    animationDuration: animation?.effect?.getTiming().duration || 0,
    animationPlayState: animation?.playState || "missing",
  };
});
assert(motion.activeControl === 1, "Automatic rotation did not advance from item one to item two.");
assert(motion.animationDuration === 2400, "Panel entrance is not using the requested 2.4-second duration.");
assert(["running", "finished"].includes(motion.animationPlayState), "Panel entrance animation did not run.");

const controls = desktop.locator("[data-home-control]");
await controls.nth(1).focus();
await desktop.keyboard.press("ArrowRight");
assert((await controls.nth(2).getAttribute("aria-selected")) === "true", "Keyboard navigation did not select the third panel.");

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
await mobile.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
const mobileState = await mobile.evaluate(() => ({
  horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  navVisible: Boolean(document.querySelector(".spatial-site-header .site-nav")),
  h1Visible: Boolean(document.querySelector("h1")),
  controls: document.querySelectorAll("[data-home-control]").length,
}));
assert(mobileState.horizontalOverflow <= 4, "Mobile homepage has horizontal overflow.");
assert(mobileState.navVisible, "Mobile production navigation is missing.");
assert(mobileState.h1Visible, "Mobile homepage heading is missing.");
assert(mobileState.controls === 3, "Mobile homepage controls are incomplete.");
assert(consoleErrors.length === 0, `Homepage logged console errors: ${consoleErrors.join(" | ")}`);

await browser.close();

if (failures.length) {
  console.error(`Production homepage check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Production Version 5 homepage check passed: metadata, clean navigation, responsive layout, keyboard controls, automatic rotation, and 2.4-second entrance motion.");
