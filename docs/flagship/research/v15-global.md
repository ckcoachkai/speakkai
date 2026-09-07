# V15 global benchmark: lightweight static homepage

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded performance research before the V15 homepage pass. This memo covers static HTML, responsive images, font subsets, and measurable transfer budgets. No SpeakKai product edits, builds, browser actions, or deployment actions were performed.

## One refreshed leader homepage

[Apple](https://www.apple.com/) returned HTTP 200 on 2026-09-07. The fetched HTML was 254,738 bytes and had the title Apple. Its global navigation exposes a clear product hierarchy with labeled entries for Store, Mac, iPad, iPhone, Watch, Vision, AirPods, TV and Home, Entertainment, Accessories, and Support.

The homepage HTML includes a responsive picture block for a prominent event image. It provides separate small, medium, large, and tall candidates selected by media conditions, plus 2x density variants and a fallback img with descriptive alternative text. This is a markup benchmark for serving one appropriate candidate per viewport and device density. It is not visual mobile QA, a Core Web Vitals result, or evidence of user behavior.

## Authoritative implementation guidance

[web.dev: Image performance](https://web.dev/learn/performance/image-performance) explains that srcset can provide width or pixel-density candidates and that sizes describes the intended CSS display width so the browser can choose an appropriate source. Preserve intrinsic width and height or an aspect-ratio box to avoid layout movement. Use compressed, width-appropriate candidates; do not send desktop and mobile variants together.

[web.dev: Optimize web fonts](https://web.dev/learn/performance/optimize-web-fonts) says large font files can delay First Contentful Paint and that font choice can affect visual shifts. It recommends WOFF2 for modern browser support, subsetting by Unicode code points when only part of a character set is needed, and care with preload because unused preloads divert bandwidth from other critical resources. Its example also notes that preloaded fonts require crossorigin.

[Astro: Images](https://docs.astro.build/en/guides/images/) recommends keeping local images in src/ when possible so Astro can transform, optimize, and bundle them. Files in public/ are served or copied as-is with no processing. Astro’s Image and Picture components can generate optimized and responsive outputs; a native img remains an explicit unprocessed choice.

[Astro: Using custom fonts](https://docs.astro.build/en/guides/fonts/) provides local-font and provider configuration, preloading, variable-font, fallback, and caching guidance. [Astro: Deploy your Astro Site](https://docs.astro.build/en/guides/deploy/) lists static deployment targets and documents dist/ as the default build output. These are framework capabilities and deployment guidance, not a current SpeakKai build result.

## V15 recommendations

Keep the homepage’s primary offer, course route, and direct contact path in server-rendered HTML. Treat JavaScript as an enhancement for local interactions such as the V14 inquiry helper. Avoid a page-wide client framework or a third-party widget in the first view.

For the shared logo currently recorded in the V15 live audit at about 760,917 bytes while rendering around 126–158 CSS pixels, create a purpose-sized Astro image variant around 480 square pixels and serve WebP or another supported compressed format. Keep intrinsic dimensions and the existing crop/visual role. Recheck the actual output size after the asset is generated; the 480-pixel suggestion is a candidate source size, not a measured final file.

Use width-aware image candidates with srcset and sizes, or Astro Picture where format selection is useful. Keep the hero/first-view image to one selected candidate. Lazy-load below-fold content, and do not preload an image unless it is actually visible and critical to first content.

Use local WOFF2 only where the existing design needs it. Subset Latin and Simplified Chinese glyph coverage according to the actual page language/content, retain a stable system fallback, and avoid preloading every weight. A Chinese page may need a materially larger glyph set than an English page; measure each subset rather than assuming one shared font file fits both.

## Proposed raw-transfer budgets

These are SpeakKai guardrails to measure on a fresh production-style load, not universal web standards and not current pass/fail results:

- First-view image bytes: **≤ 300 KB compressed total**; one responsive hero candidate.
- Shared logo or small identity asset: **≤ 80 KB compressed** after purpose sizing; investigate any asset near the current 760,917-byte audit signal.
- All homepage images after ordinary below-fold loading: **≤ 1.0 MB compressed total**.
- First-load font transfer: **≤ 100 KB total**; use subsetted WOFF2 and load only the weights needed by the rendered page.
- Initial JavaScript: **≤ 50 KB compressed**, with **0 KB page-wide hydration** as the preferred static-homepage baseline; interactive islands must justify their own bytes.
- First-view CSS: **≤ 60 KB compressed** and no unused global framework bundle added for the inquiry helper.
- Preload hints: at most one first-view image and one required font, each tied to a visible element.

Budgets should be reported by route and asset URL with transfer encoding, selected image candidate, font subset/weight, and whether the item was eager or lazy. A passing byte budget does not prove good LCP, CLS, INP, accessibility, or conversion; pair it with a fresh rendered mobile/desktop performance check later.

## Testable hypothesis and release checks

**Hypothesis:** If the homepage serves static first-view HTML, one width-appropriate compressed image, only required subsetted fonts, and no unnecessary first-view JavaScript, then the page can preserve its current visual hierarchy while reducing avoidable transfer and layout risk.

Before release, record each result as PASS, FAIL, or NOT_CHECKED:

- The primary headline, course link, and direct contact route are present in initial HTML.
- The large shared logo is replaced or resized with an explicit responsive candidate, and its final transferred bytes are recorded.
- Each meaningful image has alternative text and intrinsic dimensions or an aspect-ratio reservation.
- Responsive images expose srcset/sizes or an equivalent Astro Picture output; only the selected candidate transfers.
- Below-fold images are deferred without delaying or hiding the first-view offer.
- English and Chinese pages load only the font subsets and weights required by their content, with a readable fallback during font load.
- Static output contains no accidental page-wide hydration or third-party widget request.
- Fresh production-style transfer totals are checked against every proposed budget.
- Rendered mobile and desktop checks confirm crop, typography, keyboard access, and direct-contact visibility after optimization.

This research did not build SpeakKai, measure Lighthouse or Core Web Vitals, inspect a real mobile waterfall, validate the final WebP/font files, or confirm visual parity after the planned asset change.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Apple](https://www.apple.com/) | Apple | HTTP 200; 254,738-byte fetched HTML; labeled global navigation and media-specific/2x responsive picture candidates with descriptive fallback alt |
| [Image performance](https://web.dev/learn/performance/image-performance) | web.dev | srcset/sizes let the browser choose candidates for density and CSS display width |
| [Optimize web fonts](https://web.dev/learn/performance/optimize-web-fonts) | web.dev | Large fonts affect FCP; WOFF2, Unicode subsetting, and careful preload reduce avoidable transfer |
| [Images](https://docs.astro.build/en/guides/images/) | Astro Docs | src/ assets can be transformed/optimized; public/ assets are copied as-is; Image/Picture provide responsive processing |
| [Using custom fonts](https://docs.astro.build/en/guides/fonts/) / [Deploy your Astro Site](https://docs.astro.build/en/guides/deploy/) | Astro Docs | Local/provider font configuration and static deployment guidance; dist/ is the default build output |
