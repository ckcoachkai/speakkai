import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4325";
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined;
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const browser = await chromium.launch({ headless: true, executablePath });
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const consoleErrors = [];
desktop.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

const response = await desktop.goto(`${baseUrl}/test/`, { waitUntil: "networkidle" });
const initial = await desktop.evaluate(() => ({
  robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
  navLabels: [...document.querySelectorAll(".test-main-nav button")].map((button) => button.textContent?.trim()),
  tabs: document.querySelectorAll("[data-home-tab]").length,
  photos: document.querySelectorAll("[data-gallery-image]").length,
  activePhoto: [...document.querySelectorAll("[data-gallery-image]")].findIndex((image) => image.classList.contains("is-active")),
  headline: document.querySelector(".home-message h1")?.textContent?.replace(/\s+/g, " ").trim() || "",
  horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  initialImagesLoaded: [...document.querySelectorAll("[data-gallery-image]")].slice(0, 2).every((image) => image.complete && image.naturalWidth > 0),
}));

assert(response?.status() === 200, "The test route did not return HTTP 200.");
assert(initial.robots.includes("noindex"), "The test route must remain excluded from search indexing.");
assert(JSON.stringify(initial.navLabels) === JSON.stringify(["Home", "Schedule", "Resources", "Contact"]), "The single-shell navigation is incomplete.");
assert(initial.tabs === 5, "The five homepage information sections are incomplete.");
assert(initial.photos === 5 && initial.initialImagesLoaded, "The supplied-photo gallery is incomplete or failed to load.");
assert(initial.headline.includes("Make the message clear") && initial.headline.includes("Make the speaker ready"), "The business-first message is missing.");
assert(initial.horizontalOverflow <= 4, "The desktop test homepage has horizontal overflow.");

await desktop.waitForTimeout(4200);
const advancedPhoto = await desktop.evaluate(() => [...document.querySelectorAll("[data-gallery-image]")].findIndex((image) => image.classList.contains("is-active")));
assert(advancedPhoto !== initial.activePhoto, "The four-second photo rotation did not advance.");

const aboutDetails = desktop.locator("[data-home-panel]").first().locator("[data-panel-details]");
assert(await aboutDetails.isVisible(), "Homepage details are not visible automatically.");
await desktop.locator("[data-home-tab]").nth(2).click();
assert(await desktop.locator("[data-home-panel]").nth(2).isVisible(), "Programs did not open from the section tabs.");

await desktop.getByRole("button", { name: "Schedule", exact: true }).click();
const scheduleText = await desktop.locator('[data-view="schedule"]').innerText();
assert(desktop.url().endsWith("#schedule"), "Schedule did not update the test URL state.");
assert(scheduleText.includes("September 2026") && scheduleText.includes("Coach Kai’s Availability"), "The compact schedule heading is missing.");
assert(scheduleText.includes("Important note") && scheduleText.includes("Bright green times are available"), "The emphasized schedule note is missing.");
assert(scheduleText.includes("15:30–17:30 · Booked"), "Busy time ranges are missing from limited-availability days.");
for (const privateLabel of ["SAS", "井亭", "古北", "Logan", "STCC"]) assert(!scheduleText.includes(privateLabel), `The public test schedule exposes ${privateLabel}.`);

await desktop.getByRole("button", { name: "Resources", exact: true }).click();
const resourceState = await desktop.evaluate(() => ({
  heading: document.querySelector(".resources-heading h2")?.textContent?.trim(),
  description: document.querySelector(".resources-heading p")?.textContent?.trim(),
  cards: document.querySelectorAll(".test-tool-card").length,
}));
assert(resourceState.heading === "Resources" && resourceState.description?.startsWith("Classroom tools"), "The compact Resources header is incomplete.");
assert(resourceState.cards === 5, "The Resources panel does not show all five tools.");

await desktop.getByRole("button", { name: "Contact", exact: true }).click();
const qrState = await desktop.evaluate(() => {
  const image = document.querySelector(".contact-qr-full img");
  if (!(image instanceof HTMLImageElement)) return null;
  return { loaded: image.complete && image.naturalWidth > 0, fit: getComputedStyle(image).objectFit, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height };
});
assert(qrState?.loaded && qrState.fit === "contain" && qrState.width > 200 && qrState.height > 250, "The complete contact QR is not visibly rendered.");

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
await mobile.goto(`${baseUrl}/test/#home`, { waitUntil: "networkidle" });
const mobileHome = await mobile.evaluate(() => ({
  overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  nav: document.querySelectorAll(".test-main-nav button").length,
  tabs: document.querySelectorAll("[data-home-tab]").length,
  h1: Boolean(document.querySelector("h1")),
}));
assert(mobileHome.overflow <= 4 && mobileHome.nav === 4 && mobileHome.tabs === 5 && mobileHome.h1, "The mobile homepage does not reflow cleanly.");
await mobile.getByRole("button", { name: "Schedule", exact: true }).click();
const mobileSchedule = await mobile.evaluate(() => ({
  overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  calendarScrollable: (() => { const item = document.querySelector(".test-calendar"); return item ? item.scrollWidth > item.clientWidth && getComputedStyle(item).overflowX === "auto" : false; })(),
}));
assert(mobileSchedule.overflow <= 4 && mobileSchedule.calendarScrollable, "The mobile schedule does not contain its horizontal calendar scroll.");
assert(consoleErrors.length === 0, `The test route logged console errors: ${consoleErrors.join(" | ")}`);

await browser.close();
if (failures.length) {
  console.error(`Business test check failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Business test check passed: instant four-view navigation, four-second photo gallery, in-place details, privacy-safe schedule, compact Resources, complete QR, and responsive layouts.");
