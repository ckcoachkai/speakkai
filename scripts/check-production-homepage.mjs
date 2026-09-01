import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined;
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const browser = await chromium.launch({ headless: true, executablePath });

const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: "no-preference" });
const consoleErrors = [];
desktop.on("console", (message) => {
  if (message.type() !== "error") return;
  const location = message.location();
  if (location.url.endsWith("/favicon.ico")) return;
  consoleErrors.push(`${message.text()}${location.url ? ` (${location.url})` : ""}`);
});
const response = await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
const initial = await desktop.evaluate(() => ({
  status: document.readyState,
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
  robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
  h1Count: document.querySelectorAll("h1").length,
  labNavCount: document.querySelectorAll(".v4-nav, [data-qa='test-switcher']").length,
  productionHeaderCount: document.querySelectorAll(".spatial-site-header").length,
  brandText: document.querySelector(".spatial-brand")?.textContent?.replace(/\s+/g, " ").trim() || "",
  brandLabel: document.querySelector(".spatial-brand")?.getAttribute("aria-label") || "",
  brandImageLoaded: (() => {
    const image = document.querySelector(".spatial-brand-image img");
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  })(),
  brandLockup: (() => {
    const brand = document.querySelector(".spatial-brand");
    const latin = brand?.querySelector(".spatial-brand-image");
    const chinese = brand?.children[1];
    if (!(brand instanceof HTMLElement) || !(latin instanceof HTMLElement) || !(chinese instanceof HTMLElement)) return null;
    const chineseStyle = getComputedStyle(chinese);
    return {
      chineseColor: chineseStyle.color,
      gap: parseFloat(getComputedStyle(brand).gap),
      alignItems: getComputedStyle(brand).alignItems,
      imageHeight: latin.getBoundingClientRect().height,
    };
  })(),
  headline: document.querySelector("[data-qa='primary-message'] h1")?.textContent?.trim() || "",
  redundantHomepageLabels: document.querySelectorAll(".production-v5 .v4-kicker, .production-v5 .homepage-service-line").length,
  controls: document.querySelectorAll("[data-home-control]").length,
  controlLabels: [...document.querySelectorAll("[data-home-control] strong")].map((item) => item.textContent?.trim()),
  controlMicrocopy: document.querySelectorAll("[data-home-control] span, [data-home-control] small").length,
  panelEyebrows: document.querySelectorAll(".production-v5 .panel-eyebrow").length,
  panelNotes: document.querySelectorAll(".production-v5 .panel-note").length,
  homepageStats: document.querySelectorAll(".homepage-stats div").length,
  paradigmText: document.querySelector("#homepage-panel-3")?.textContent?.replace(/\s+/g, " ").trim() || "",
  aboutNavLinks: document.querySelectorAll('.spatial-site-header a[href="/about/"]').length,
  primaryCtaCount: document.querySelectorAll('[data-qa="primary-cta"]').length,
  primaryCtaText: document.querySelector('[data-qa="primary-cta"]')?.textContent?.trim() || "",
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
assert(initial.brandText.replace(/\s+/g, "") === "说开" && initial.brandLabel === "SpeakKai 说开 home", "Homepage brand does not preserve the bilingual name.");
assert(initial.brandImageLoaded, "Selected SpeakKai logo image failed to load.");
assert(initial.brandLockup?.chineseColor === "rgb(0, 0, 0)" && initial.brandLockup?.gap <= 3 && initial.brandLockup?.alignItems === "center" && initial.brandLockup?.imageHeight === 32, "Bilingual brand lockup is not visually unified.");
assert(initial.headline === "Take your speech to the next level.", "Homepage headline was not updated.");
assert(initial.redundantHomepageLabels === 0, "Low-value homepage labels are still present.");
assert(initial.controls === 5, "Production homepage must contain five information controls.");
assert(JSON.stringify(initial.controlLabels) === JSON.stringify(["About", "Philosophy", "Programs", "Paradigm", "Media"]), "Homepage information controls are not labelled as requested.");
assert(initial.controlMicrocopy === 0, "Homepage controls still contain numbers or explanatory microcopy.");
assert(initial.panelEyebrows === 1, "Internal panel labels are still exposed as customer-facing copy.");
assert(initial.panelNotes === 0, "Internal evidence notes are still exposed as customer-facing copy.");
assert(initial.homepageStats === 3, "Homepage About panel is missing its compact career highlights.");
assert(initial.paradigmText.includes("Clarity and intelligibility"), "Homepage paradigm does not reflect the documented judging pattern.");
assert(!initial.paradigmText.includes("formally adopted") && !initial.paradigmText.includes("Reconstructed from"), "Internal paradigm research notes leaked into customer-facing copy.");
assert(initial.aboutNavLinks === 0, "Standalone About navigation is still visible.");
assert(initial.primaryCtaCount === 1, "Production homepage must contain one primary CTA.");
assert(initial.primaryCtaText === "Take your speech to the next level", "Homepage CTA was not updated.");
assert(initial.horizontalOverflow <= 4, "Desktop homepage has horizontal overflow.");
assert(initial.imagesLoaded, "A production homepage image failed to load.");

await desktop.waitForTimeout(4700);
const motion = await desktop.evaluate(() => {
  const controls = [...document.querySelectorAll("[data-home-control]")];
  const activeControl = controls.findIndex((control) => control.getAttribute("aria-selected") === "true");
  const activePanel = document.querySelector("[data-home-panel]:not([hidden])");
  const title = activePanel?.querySelector("h2");
  const panelAnimations = activePanel?.getAnimations({ subtree: false }) || [];
  const titleAnimation = title?.getAnimations()[0];
  return {
    activeControl,
    activePanel: activePanel?.id || "",
    panelAnimations: panelAnimations.length,
    titleAnimationDuration: titleAnimation?.effect?.getTiming().duration || 0,
    titleAnimationPlayState: titleAnimation?.playState || "missing",
  };
});
assert(motion.activeControl === 1, "Automatic rotation did not advance from item one to item two.");
assert(motion.panelAnimations === 0, "The entire panel still moves instead of keeping its content stable.");
assert(motion.titleAnimationDuration === 2800, "Panel title is not using the requested slower 2.8-second duration.");
assert(["running", "finished"].includes(motion.titleAnimationPlayState), "Panel title entrance animation did not run.");

const controls = desktop.locator("[data-home-control]");
await controls.nth(1).focus();
await desktop.keyboard.press("ArrowRight");
assert((await controls.nth(2).getAttribute("aria-selected")) === "true", "Keyboard navigation did not select the third panel.");

await controls.nth(4).click();
const mediaState = await desktop.evaluate(() => ({
  cards: document.querySelectorAll(".homepage-media a").length,
  imagesLoaded: [...document.querySelectorAll(".homepage-media img")].every((image) => image.complete && image.naturalWidth > 0),
}));
assert(mediaState.cards === 3, "Media panel does not contain the three verified account/contact cards.");
assert(mediaState.imagesLoaded, "A media thumbnail failed to load.");

const verifyPanelsFit = async (page, label) => {
  const panelControls = page.locator("[data-home-control]");
  for (let index = 0; index < 5; index += 1) {
    await panelControls.nth(index).click();
    const fit = await page.evaluate(() => {
      const content = document.querySelector(".glass-panel-content");
      const activePanel = document.querySelector("[data-home-panel]:not([hidden])");
      if (!content || !activePanel) return { found: false };
      const contentRect = content.getBoundingClientRect();
      const panelRect = activePanel.getBoundingClientRect();
      return {
        found: true,
        overflowY: getComputedStyle(content).overflowY,
        contentFits: content.scrollHeight <= content.clientHeight + 2,
        panelFits: panelRect.top >= contentRect.top - 2 && panelRect.bottom <= contentRect.bottom + 2,
      };
    });
    assert(fit.found, `${label} panel ${index + 1} was not found.`);
    assert(fit.overflowY !== "auto" && fit.overflowY !== "scroll", `${label} panel ${index + 1} still uses an internal scrollbar.`);
    assert(fit.contentFits && fit.panelFits, `${label} panel ${index + 1} is clipped instead of fitting within the information area.`);
  }
};

await verifyPanelsFit(desktop, "1920x1080");

const compactDesktop = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: "reduce" });
await compactDesktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
await verifyPanelsFit(compactDesktop, "1366x768");
const compactOverflow = await compactDesktop.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth));
assert(compactOverflow <= 4, "1366x768 homepage has horizontal overflow.");
await compactDesktop.close();

const aboutRedirect = await desktop.goto(`${baseUrl}/about/`, { waitUntil: "networkidle" });
assert(aboutRedirect?.status() === 200, "Legacy About URL did not resolve through the homepage redirect.");
assert(new URL(desktop.url()).pathname === "/", "Legacy About URL did not redirect to the homepage.");

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
assert(mobileState.controls === 5, "Mobile homepage controls are incomplete.");
assert(consoleErrors.length === 0, `Homepage logged console errors: ${consoleErrors.join(" | ")}`);

await browser.close();

if (failures.length) {
  console.error(`Production homepage check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Production Version 5 homepage check passed: unified bilingual brand, simplified copy, responsive layout, keyboard controls, 4.5-second automatic rotation, and title-only entrance motion.");
