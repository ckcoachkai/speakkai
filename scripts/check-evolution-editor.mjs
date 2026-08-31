import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4322";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_EXECUTABLE_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

for (let version = 1; version <= 8; version += 1) {
  const response = await page.goto(`${baseUrl}/tests/${version}/`, { waitUntil: "networkidle" });
  check(response?.status() === 200, `Version ${version} did not return 200`);
}

for (let version = 5; version <= 8; version += 1) {
  await page.goto(`${baseUrl}/tests/${version}/`, { waitUntil: "networkidle" });
  check(await page.locator("[data-editor-launch]").isVisible(), `Version ${version} has no visible Edit Page button`);
  check((await page.locator(".visual-editor").count()) === 0, `Version ${version} loaded editor UI before activation`);
  await page.locator("[data-editor-launch]").click();
  await page.locator(".editor-toolbar").waitFor({ state: "visible" });
  check((await page.locator("[data-layers] .layer-section").count()) >= 1, `Version ${version} layers did not load`);
  await page.locator('[data-action="close"]').click();
}

await page.goto(`${baseUrl}/tests/5/`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.removeItem(window.__SPEAKKAI_EDITOR__.storageKey));
await page.reload({ waitUntil: "networkidle" });
await page.locator("[data-editor-launch]").click();
await page.locator('[data-edit-id="h1-1"]').click();
const textarea = page.locator('[data-prop="text"]');
const originalTitle = await textarea.inputValue();
const editedTitle = `${originalTitle} — visual QA`;
await textarea.fill(editedTitle);
await textarea.dispatchEvent("change");
check((await page.locator('[data-edit-id="h1-1"]').innerText()).includes("visual QA"), "Inline/property text editing did not apply");
await page.locator('[data-action="undo"]').click();
const titleAfterUndo = await page.locator('[data-edit-id="h1-1"]').innerText();
check(!titleAfterUndo.includes("visual QA"), `Undo did not restore text (found: ${titleAfterUndo})`);
await page.locator('[data-action="redo"]').click();
check((await page.locator('[data-edit-id="h1-1"]').innerText()).includes("visual QA"), "Redo did not restore edit");

const draggable = page.locator('[data-edit-id="p-1"]');
await draggable.click();
const dragBox = await draggable.boundingBox();
if (dragBox) {
  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragBox.x + dragBox.width / 2 + 64, dragBox.y + dragBox.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
}
const draggedPosition = await draggable.evaluate((element) => element.style.translate);
check(Boolean(draggedPosition), "Direct on-canvas drag did not move the selected element");
await page.locator('[data-action="undo"]').click();
check((await draggable.evaluate((element) => element.style.translate)) === "", "Undo did not restore the pre-drag position");
await page.locator('[data-action="redo"]').click();
check((await draggable.evaluate((element) => element.style.translate)) === draggedPosition, "Redo did not restore the dragged position");

const portraitId = await page.locator('[data-edit-type="image"]').first().getAttribute("data-edit-id");
await page.locator(`[data-layer-id="${portraitId}"]`).click();
const focalPoint = page.locator('[data-prop="objectPosition"]');
await focalPoint.fill("40% 30%");
await focalPoint.dispatchEvent("change");
check((await page.locator(`[data-edit-id="${portraitId}"] img`).evaluate((image) => image.style.objectPosition)) === "40% 30%", "Image focal-point editing did not apply");

await page.locator('[data-preview="mobile"]').click();
check((await page.locator("body").getAttribute("data-editor-preview")) === "mobile", "Mobile preview did not activate");
await page.locator('[data-preview="desktop"]').click();
await fs.mkdir("output/playwright/evolution/editor", { recursive: true });
await page.screenshot({ path: "output/playwright/evolution/editor/version-5-editor.png", animations: "disabled" });
await page.locator('[data-action="save"]').click();
await page.locator('[data-action="close"]').click();
await page.reload({ waitUntil: "networkidle" });
check((await page.locator('[data-edit-id="h1-1"]').innerText()).includes("visual QA"), "Saved text did not persist after reload");

await page.locator("[data-editor-launch]").click();
await page.locator('[data-layer-id="p-1"]').click();
await page.locator('[data-element-action="duplicate"]').click();
check((await page.locator('[data-editor-duplicate="true"]').count()) === 1, "Duplicate action did not create a copy");
await page.locator('[data-action="save"]').click();
await page.reload({ waitUntil: "networkidle" });
check((await page.locator('[data-editor-duplicate="true"]').count()) === 1, "Duplicate did not persist after reload");
await page.locator("[data-editor-launch]").click();
page.once("dialog", (dialog) => dialog.accept());
await page.locator(".layer-section-name").first().click();
await page.locator('[data-action="reset"]').click();
await page.waitForLoadState("networkidle");
check(!(await page.locator('[data-edit-id="h1-1"]').innerText()).includes("visual QA"), "Reset did not restore the generated design");
check((await page.locator('[data-editor-duplicate="true"]').count()) === 0, "Reset did not remove generated copies");

await browser.close();
if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("Visual editor interaction check passed for original Versions 1–4 and editable twins 5–8.");
