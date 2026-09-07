# SpeakKai flagship V15 logo optimization and static budget review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded, read-only source review of the V15 logo conversion and `scripts/check-flagship-budget.mjs` in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. No product files, generated output, builds, or browser state were changed. Root owns the pending final build and visual QA.

## Verdict

V15 is structurally sound with no P0, P1, or P2 blocker in the reviewed source. `FlagshipLayout.astro` now imports Latin-only Manrope subsets and uses Astro’s `Image` pipeline to generate a 480px WebP logo with 160/320/480 candidates. The copied `src/assets/brand/speakkai-logo.png` is byte-identical to `public/images/speakkai-logo-header-source.png`, preserving rollback/provenance while allowing the flagship header to use an optimized asset.

The existing crop geometry remains the controlling presentation: desktop `.brand-image` is 146×34 with a 158px positioned image, and mobile is 116×28 with a 126px positioned image. The generated square asset and responsive `sizes="(max-width: 760px) 126px, 158px"` cover those display widths, including common high-DPI selections.

## Evidence-backed strengths

- `src/layouts/FlagshipLayout.astro:1-7` imports `latin-400/600/700.css`, `Image`, and the copied asset. The Latin-only imports reduce font variants relative to the prior broad Manrope imports while keeping the existing typography family.
- `:93-104` uses `Image` with `width={480}`, `height={480}`, `widths={[160, 320, 480]}`, CSS-matched `sizes`, WebP output, and quality 90. The intrinsic square geometry is compatible with the existing overflow crop in `src/styles/flagship.css:117-128` and `:620-628`.
- SHA-256 inspection confirms the copied source and retained public PNG are identical; the original source remains available for other routes, JSON-LD, and rollback.
- `scripts/check-flagship-budget.mjs:6-9` covers the same 12 flagship routes already used by the SEO audit, including both Chinese routes and the localized practice page.
- `:11-25` resolves same-origin local assets safely, rejects path traversal and unexpected external assets, caches repeated files, classifies CSS/JS/fonts/images, and recursively follows CSS `url()`/`@import` and literal JS imports.
- `:30-43` reports raw UTF-8 HTML bytes and recursively referenced asset bytes per route, with explicit HTML/CSS/JS/font/image/other limits and a separate larger practice-page JS allowance. It deduplicates the aggregate referenced-asset total across routes.
- `:44-50` requires each route’s logo to be responsive, rejects the old public logo as a rendered `<img>`, and applies an individual logo-byte ceiling. `:53-55` also reports the full published artifact size, which is useful for detecting retained unreferenced files.
- `package.json:42-46` and the lockfile add an explicit Sharp dependency so Astro’s image service has a deterministic build dependency. The previous missing-Sharp failure is a release signal that the final CI/Linux and local/Windows builds must both be checked after this dependency change.

## Budget-accounting blind spots and acceptance criteria

The checker’s semantics are appropriately conservative, but they need to remain explicit in release output:

- Every `srcset` candidate is counted, so route image totals represent a worst-case candidate inventory rather than a browser network waterfall. This is valid for a release budget; it must not be presented as selected-candidate transfer or Core Web Vitals evidence.
- Inline CSS and JavaScript are included in HTML bytes, while external assets are counted separately. Inline CSS `url(...)` references are not recursively inspected; this is currently harmless for the header logo but should be documented as a bounded checker limitation.
- The JS import regex follows literal `.js`/`.mjs` paths only. It will miss variable dynamic imports, extensionless imports, and assets referenced through runtime-generated URLs. The current static bundle is covered enough for the logo release, but the checker is not a complete dependency graph.
- The `link` scan intentionally excludes icons and some non-stylesheet links. The inventory therefore describes route HTML plus selected local dependencies, not every byte a browser might request.
- The original 760,917-byte PNG remains under `public/images` and is copied into the published artifact because it is still used by `SpatialSiteHeader`, `BusinessTestExperience`, and the JSON-LD logo URL. Report **referenced flagship image bytes** separately from **full published artifact bytes**; an optimized flagship `<img>` does not mean the old PNG has left the deployment.
- The checker verifies responsive `srcset`/`sizes` and byte ceilings, but it does not verify the generated width, WebP MIME/format, source hash, alpha handling, or the visual crop. Those need explicit static metadata/hash checks and root’s visual screenshots.

Acceptance criteria:

1. The final build passes with Sharp installed from the lockfile on CI and the local development environment.
2. All 12 routes pass the budget checker. Output reports raw byte semantics, per-route totals, deduplicated referenced assets, and full published artifact size with thresholds visible.
3. Each flagship header emits Astro-generated WebP `src`/`srcset` candidates with reserved 480×480 intrinsic geometry and CSS crop behavior unchanged at desktop and mobile widths.
4. The old PNG is absent from flagship `<img src>` references, while its retained public-artifact status is documented and its source hash remains unchanged.
5. CSS/JS/font/image accounting follows the checker’s stated recursive and deduplication rules, with no claim that the result measures transfer speed, LCP, or field performance.
6. Existing route, SEO, language, inquiry, practice, and no-hydration checks remain green after the image and font changes.

## Verification boundary

Independent source review: PASS for source identity, Astro image parameters, Latin font imports, crop-compatible dimensions, route coverage, path safety, recursive CSS/JS accounting, deduplication, and explicit full-artifact reporting. The final V15 build, generated budget output, route checks, screenshot crop comparison, and field-performance measurements are **NOT_CHECKED** here; root owns them.

## Conservative score

V14 baseline: **43/55**. V15 does not justify a product score increase from source inspection alone. Keep all dimensions unchanged until the final build and visual evidence confirm the crop and the budget output.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.5 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5 |
| Accessibility | 4.25 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.75 |

**V15 provisional total: 43/55.**

Static byte reduction and an optimized logo do not establish improved speed, conversion, ranking, enrollment, learning outcomes, or competition results.

## Coordinating final addendum — 2026-09-07

Root’s final evidence closes the V15 implementation checks:

- The 49-page Sharp-enabled build passed with zero errors. The generated logo candidates were verified as WebP at 160/320/480 widths, with dimensions and bytes of 2,102 / 4,226 / 6,456 respectively.
- All 12 budget routes passed at 320px and 1440px. The logo loaded at the intended 126px mobile and 158px desktop display widths, with no horizontal overflow. At 3× 320px, the browser selected the 480px candidate (6,456 bytes). Desktop/mobile homepage and Chinese screenshots matched the existing crop and typography.
- The uncached 1440px homepage static resource body fell from 968,842 to 189,354 bytes excluding HTML and favicon. Referenced CSS fell from 44,197 to 23,524 bytes; the three Latin font files remained 42,492 bytes. These are static resource measurements, not field-performance results.
- The budget checker passed all 12 routes and produced `docs/flagship/v15-budget.json`; the documented performance policy is in `docs/flagship/PERFORMANCE-BUDGETS.md`. Its false positive for Astro’s bare decorative `alt` attribute was corrected.

This coordinating evidence confirms the source-level expectations and supports a limited Performance uplift. It still does not verify real-user transfer timing, LCP, bandwidth conditions, or conversion.

## Final conservative score

With the coordinating build, budget, responsive selection, and crop evidence, raise Performance from 3 to 3.5. Keep every other dimension unchanged.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.5 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5 |
| Accessibility | 4.25 |
| Performance | 3.5 |
| SEO | 4 |
| Maintainability | 4.75 |

**V15 final conservative total: 43.5/55.**

The uplift reflects verified static asset and responsive-selection improvements only. No field-performance, conversion, ranking, enrollment, learning, or competition-result claim is made.
