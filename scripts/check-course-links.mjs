import assert from "node:assert/strict";
import { chromium } from "playwright";
import { audiencePages, courseSlug } from "../src/data/audiencePages.ts";

const base = process.env.BASE_URL || "http://127.0.0.1:4322";
const browser = await chromium.launch({executablePath: process.env.PW_EXECUTABLE_PATH});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  // Capture the copy action without touching the host clipboard.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: {
      writeText: async text => { document.documentElement.dataset.copied = text; }
    }});
  });
  for (const stage of audiencePages) {
    for (const [prefix, language] of [["", "en"], ["/zh", "zh-CN"]]) {
      await page.goto(base + prefix + "/for/" + stage.slug + "/");
      const cards = page.locator(".landing-course");
      const courses = stage[language].courses;
      assert.equal(await cards.count(), courses.length);
      const ids = new Set();
      for (const [index, course] of courses.entries()) {
        const card = cards.nth(index);
        assert.equal(await card.locator("h3").innerText(), course.title);
        const href = new URL(await card.locator("a").getAttribute("href"), base);
        const id = courseSlug(stage.en.courses[index].title);
        assert.ok(id && !ids.has(id));
        ids.add(id);
        assert.equal(href.pathname, prefix + "/contact/");
        assert.equal(href.searchParams.get("stage"), stage.slug);
        assert.equal(href.searchParams.get("course"), id);
        if (index === 0) {
          await card.locator("a").click();
          const draft = page.locator("#inquiry-preview");
          await draft.waitFor({state:"visible"});
          assert.ok((await draft.inputValue()).includes(course.title));
          assert.ok((await draft.inputValue()).includes(stage[language].name));
          await draft.fill("Edited draft");
          await page.locator("#copy-inquiry").click();
          assert.equal(await page.locator("html").getAttribute("data-copied"), "Edited draft");
          const other = language === "en" ? "zh-CN" : "en";
          await page.locator(".site-language a:not([aria-current])").click();
          await draft.waitFor({state:"visible"});
          assert.ok((await draft.inputValue()).includes(stage[other].courses[index].title));
          await page.goto(base + prefix + "/for/" + stage.slug + "/");
        }
      }
    }
  }
  await page.goto(base + "/contact/?audience=schools&schoolDirection=teachers&stage=unknown&course=bogus");
  assert.equal(await page.locator("#inquiry-goal").inputValue(), "");
  assert.equal(await page.locator("#inquiry-school-direction").inputValue(), "teachers");
  console.log("Verified bilingual course links, editable drafts, language switching and copy.");
} finally {
  await browser.close();
}
