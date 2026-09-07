# V21 global benchmark: responsive media before premium assets

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for the SpeakKai flagship homepage. The question is what media/performance baseline to establish before adding premium imagery or heavier assets. No product files, builds, browser/shared-browser actions, network waterfall, transfer measurement, LCP measurement or deployment was performed.

## Fresh official training homepage observation

[Toastmasters International](https://www.toastmasters.org/) returned HTTP 200 on 2026-09-07. The page title is **“Toastmasters International -Home.”** Its retrieved HTML contained 14 `<img>` elements. The main training illustrations include descriptive alt text and explicit `width="400"` attributes, and they are SVG assets such as a person presenting or a mentoring session. The retrieved homepage HTML had no `srcset` attributes and no `loading` attributes on the inspected images.

The useful observation is restrained media architecture: use a small number of purposeful illustrations to support the education entry points, give informative images text alternatives, and provide intrinsic dimensions where the source knows the intended size. The absence of `srcset` or `loading` on this particular page is an observation, not a recommendation or a performance verdict. Its HTML does not reveal actual transfer size, caching, decoded image cost, rendered CSS size, Core Web Vitals or the reason for each loading choice. Toastmasters’ program, brand and outcome claims are not SpeakKai evidence.

## Official responsive-images guidance

[MDN: Using responsive images in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) returned HTTP 200 on 2026-09-07. MDN explains that responsive images are intended to work across different screen sizes and resolutions and can improve performance across devices. Its documented HTML patterns are:

- `srcset` provides a set of image candidates with their intrinsic widths so the browser can choose an appropriate resource.
- `sizes` tells the browser how much layout space the image is expected to occupy, helping it choose among `srcset` candidates.
- `<picture>` with `<source>` supports art direction, such as different crops for wide and narrow displays, while a final `<img>` supplies the required fallback and `alt` text.

This is implementation guidance, not a measurement of the current SpeakKai page. It does not tell us which crop, width variants, format, loading priority or performance budget fits SpeakKai until the actual rendered page and representative devices are measured.

## Current SpeakKai media baseline

Read-only inspection of `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipHome.astro` found three homepage image uses:

- The above-fold coach headshot is one `/images/coach-kai-headshot.webp` source with `width="1400"`, `height="1400"`, descriptive alt text and `fetchpriority="high"`.
- The below-fold training-stage image is `/images/test-business/kai-training-stage.webp` with `width="668"`, `height="606"`, descriptive alt text and `loading="lazy"`.
- The below-fold WeChat contact card is a `/images/coach-kai-wechat-qr.png` source with `width="938"`, `height="1340"`, descriptive alt text and `loading="lazy"`.

The source contains no `srcset`, `sizes` or `<picture>` for these homepage images. That means the current code expresses intrinsic dimensions and loading intent, but it does not establish a responsive candidate set or an art-directed crop. The 1400px headshot and 938px QR image are candidates for a later rendered-size/transfer review; source dimensions alone do not prove that either is too large. Astro or deployment processing may also affect the final HTML and files, so rendered output remains **NOT_CHECKED**.

## Smallest useful pre-edit recommendation

Before adding premium photos, video, animation or a full-bleed media treatment, keep the current three-image homepage inventory and establish a measurable baseline. The next product decision should be a media inventory and measurement pass, not a new asset purchase or a visual expansion:

1. Treat the hero headshot as the only likely above-fold/LCP candidate until a real measurement identifies another element. Keep its intrinsic dimensions and `fetchpriority` under review; do not add a second high-priority image by default.
2. Keep the training-stage image and QR card below-fold and lazy-loaded where the rendered layout supports that choice. Confirm the QR remains usable at its displayed size; its source dimensions do not by themselves justify a new file.
3. For any later raster-image addition or replacement, provide `srcset` and `sizes` when the same image serves materially different rendered widths. Use `<picture>` only when a genuinely different crop or composition is needed at a breakpoint. Preserve meaningful `alt` text for informative media and empty alt text for purely decorative media.
4. Set and record a simple budget before commissioning premium assets: intended displayed width, maximum candidate dimensions, format, and whether the asset is above or below the fold. The budget must be based on measured layout and transfer data rather than a generic “high quality” file.
5. Defer any claim that the homepage is fast, light, Core Web Vitals compliant or improved. Those claims require final rendered-route measurement on representative viewport and network conditions.

This keeps the homepage’s existing visual story intact while making the next asset decision reviewable. It also avoids duplicating the same large source file for several display widths without evidence that the browser needs it.

## Testable hypothesis and release checks

**Hypothesis:** If each homepage image has a defined role, reserved dimensions, appropriate loading intent and responsive candidates when its rendered width varies, then SpeakKai can add premium media without making an unmeasured transfer or LCP claim.

Before any later media edit, record each result as PASS, FAIL or NOT_CHECKED:

- The homepage image inventory names each asset’s role, displayed-size target, above/below-fold status and format.
- Informative images have meaningful alt text; decorative images are handled as decorative.
- Width and height reserve the displayed image box, and the chosen dimensions reflect the actual layout.
- Only the measured LCP candidate receives high loading priority; below-fold images use lazy loading where appropriate.
- Variable-width raster images expose `srcset` and an accurate `sizes` value; art-directed crops use `<picture>` only when needed.
- The QR remains legible and usable at its rendered size.
- No new premium media is added solely because a source file is high resolution or a competitor page uses imagery.
- Final HTML, transfer sizes, cache behavior, rendered image dimensions, LCP, CLS and representative narrow/desktop behavior are measured before any speed or Core Web Vitals claim. These remain **NOT_CHECKED** in this research.
- The page remains understandable and useful with media unavailable, including alt text and the existing text/contact path.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Toastmasters International](https://www.toastmasters.org/) | Toastmasters International | HTTP 200 on 2026-09-07; official training homepage with 14 image elements, purposeful SVG illustrations, descriptive alt text and explicit 400px width attributes on the main illustrated entries. Retrieved HTML had no `srcset` or `loading` on the inspected images. Used as an information-architecture observation, not a performance benchmark. |
| [Using responsive images in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) | MDN Web Docs | HTTP 200 on 2026-09-07; documents `srcset`/`sizes` for resolution switching, `<picture>` for art direction, and the performance rationale for responsive images. |

## Local source inspected

- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipHome.astro`

## Unavailable or unverified

- No final built HTML, image pipeline output, CDN behavior, resource transfer sizes, cache headers, decoded image costs, rendered CSS widths, LCP, CLS, visual crop quality or accessibility tree was inspected.
- No recommendation here establishes that any current image is oversized, that a premium asset is needed, or that a specific format/variant will improve a measured metric.
