async (page) => {
  const base = "http://127.0.0.1:4321";
  const failures = [];
  const consoleErrors = [];
  const requestFailures = [];
  let checks = 0;

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push({ url: page.url(), text: message.text() });
  });
  page.on("requestfailed", (request) => {
    requestFailures.push({ url: page.url(), request: request.url(), error: request.failure()?.errorText || "unknown" });
  });

  const standardViewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 1024, height: 768 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (let id = 21; id <= 50; id += 1) {
    for (const viewport of standardViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${base}/tests/${id}/`, { waitUntil: "networkidle" });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const result = await page.evaluate((singleScreen) => {
        const root = document.documentElement;
        const h1 = document.querySelector("h1");
        const nav = document.querySelector(".experiment-nav");
        const cta = document.querySelector(".primary-action");
        const cards = document.querySelectorAll(".concept-cards details, .concept-cards article");
        const missingImages = [...document.images]
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.getAttribute("src"));
        const rectVisible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
        };
        return {
          title: document.title,
          horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
          verticalOverflow: singleScreen && window.innerWidth >= 1101 ? root.scrollHeight > root.clientHeight + 1 : false,
          h1Visible: rectVisible(h1),
          navVisible: rectVisible(nav),
          ctaVisible: rectVisible(cta),
          missingImages,
          cardCount: cards.length,
          noindex: document.querySelector('meta[name="robots"]')?.getAttribute("content") === "noindex, nofollow",
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      }, id >= 40);
      checks += 1;
      const failed = [];
      if (result.horizontalOverflow) failed.push("horizontal-overflow");
      if (result.verticalOverflow) failed.push("single-screen-vertical-overflow");
      if (!result.h1Visible) failed.push("h1-not-visible");
      if (!result.navVisible) failed.push("navigation-not-visible");
      if (!result.ctaVisible) failed.push("cta-not-visible");
      if (result.missingImages.length) failed.push(`missing-images:${result.missingImages.join(",")}`);
      if (result.cardCount < 3) failed.push("too-few-content-paths");
      if (!result.noindex) failed.push("noindex-missing");
      if (!result.reducedMotion) failed.push("reduced-motion-not-emulated");
      if (failed.length) failures.push({ id, viewport: viewport.name, size: `${viewport.width}x${viewport.height}`, failed });

      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const active = document.activeElement;
        return active && active !== document.body && active !== document.documentElement;
      });
      if (!focused) failures.push({ id, viewport: viewport.name, size: `${viewport.width}x${viewport.height}`, failed: ["no-keyboard-focus"] });

      if (viewport.name === "desktop") {
        await page.screenshot({
          path: `output/playwright/screenshots/T${id}-1440x900.png`,
          fullPage: id < 40,
          animations: "disabled",
        });
      }
    }
  }

  const singleScreenViewports = [
    { width: 1920, height: 1080 },
    { width: 1600, height: 900 },
    { width: 1366, height: 768 },
  ];
  for (let id = 40; id <= 50; id += 1) {
    for (const viewport of singleScreenViewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/tests/${id}/`, { waitUntil: "networkidle" });
      const result = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        ctaVisible: (() => {
          const rect = document.querySelector(".primary-action")?.getBoundingClientRect();
          return Boolean(rect && rect.bottom <= window.innerHeight && rect.top >= 0);
        })(),
        navVisible: (() => {
          const rect = document.querySelector(".experiment-nav")?.getBoundingClientRect();
          return Boolean(rect && rect.bottom <= window.innerHeight && rect.top >= 0);
        })(),
      }));
      checks += 1;
      const failed = [];
      if (result.scrollHeight > result.clientHeight + 1) failed.push(`vertical:${result.scrollHeight}>${result.clientHeight}`);
      if (result.scrollWidth > result.clientWidth + 1) failed.push(`horizontal:${result.scrollWidth}>${result.clientWidth}`);
      if (!result.ctaVisible) failed.push("cta-outside-viewport");
      if (!result.navVisible) failed.push("nav-outside-viewport");
      if (failed.length) failures.push({ id, viewport: "single-screen", size: `${viewport.width}x${viewport.height}`, failed });
      if (viewport.width === 1366) {
        await page.screenshot({ path: `output/playwright/screenshots/T${id}-1366x768.png`, fullPage: false, animations: "disabled" });
      }
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/tests/`, { waitUntil: "networkidle" });
  const gallery = await page.evaluate(() => ({
    newCards: document.querySelectorAll('a.card[href^="/tests/"]').length,
    missingCards: document.querySelectorAll("article.card.missing").length,
    filters: document.querySelectorAll("[data-filter]").length,
  }));
  if (gallery.newCards !== 30) failures.push({ id: "gallery", failed: [`new-card-count:${gallery.newCards}`] });
  if (gallery.missingCards !== 11) failures.push({ id: "gallery", failed: [`missing-card-count:${gallery.missingCards}`] });
  if (gallery.filters < 10) failures.push({ id: "gallery", failed: [`filter-count:${gallery.filters}`] });
  await page.locator('[data-filter="single-screen"]').click();
  const filteredGallery = await page.evaluate(() => ({
    visibleCards: [...document.querySelectorAll("[data-tags]")].filter((card) => !card.hidden).length,
    selected: document.querySelector('[data-filter="single-screen"]')?.getAttribute("aria-pressed"),
    announced: document.querySelector(".result-count")?.textContent,
  }));
  if (filteredGallery.visibleCards !== 11) failures.push({ id: "gallery", failed: [`single-screen-filter-count:${filteredGallery.visibleCards}`] });
  if (filteredGallery.selected !== "true") failures.push({ id: "gallery", failed: ["single-screen-filter-state"] });
  if (filteredGallery.announced !== "11 gallery items shown") failures.push({ id: "gallery", failed: ["single-screen-filter-announcement"] });
  await page.locator('[data-filter="all"]').click();
  await page.screenshot({ path: "output/playwright/screenshots/gallery-1440x900.png", fullPage: true, animations: "disabled" });

  const result = { checks, failures, consoleErrors, requestFailures, gallery };
  if (failures.length || consoleErrors.length || requestFailures.length) {
    throw new Error("EXPERIMENT_QA_FAILED " + JSON.stringify(result));
  }

  await page.evaluate((summary) => {
    document.documentElement.dataset.experimentQa = JSON.stringify(summary);
  }, result);
}
