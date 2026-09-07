# Flagship performance budgets

Run `npm run check:flagship-budget` after the production build. CI runs the same check over twelve flagship routes. See `v15-budget.json` for the initial passing inventory.

The checker uses raw UTF-8 HTML and file bytes. It includes every referenced srcset candidate, CSS font fallback and statically discoverable JavaScript import, including Astro island component/renderer entries. This deliberately overestimates mutually exclusive candidates. Inline content is already in the HTML/CSS byte count; it is not charged twice. Runtime-generated requests and dependencies hidden in inline scripts require browser inspection. The scanner supports the current generated markup and is not a general HTML/CSS/JavaScript parser.

Per route: HTML 30 KB; external CSS 50 KB; declared font files 120 KB; image candidates 400 KB; other assets 10 KB. Static-route external JavaScript is capped at 8 KB; the four guided practice pages allow 215 KB raw including React. Each generated logo is below 80 KB. Homepage hydration is prohibited. These are project guardrails, not universal performance standards. A 350 KB draft image threshold caught Resources at 350,803 bytes; the final 400 KB guard allows its existing tool thumbnails and all responsive logo candidates.

The report separates the deduplicated union of referenced assets from the full published artifact. The latter includes legacy pages, original assets, and existing speech-tool files. V15 retains the original PNG for provenance and other pages; removing its request from the flagship header does not remove it from the deployment.

## V15 observed changes

The 760,917-byte square PNG is replaced in flagship image markup by Astro-generated WebP candidates at 160, 320 and 480 pixels. Original and copied source hashes match. Existing CSS crop geometry stays at 126px on mobile and 158px on desktop. Eager loading is explicit for the visible brand image. A 1x desktop browser selected 2,102 bytes; a 3x narrow-screen check selected the 6,456-byte candidate. No portrait, identity wording or course content changed.

Manrope imports now declare only Latin subsets at the same three weights. Chinese uses the existing system fallback. Actual Latin WOFF2 requests remain 42,492 bytes; the gain is smaller CSS and fewer declared unused font alternatives, not a claim that these fonts used to all download.

One uncached localhost homepage comparison at 1440×900: requested resource body bytes fell from 968,842 to 189,354, excluding HTML and favicon. The observed shared CSS fell from 44,197 to 23,524 bytes. Portrait and stage image requests remained 66,486 and 54,750 bytes. These are one-run asset observations, not a field loading-speed or Core Web Vitals result.

Future video and 3D features must use deliberate opt-in loading, poster/static fallbacks and separate media budgets. Recheck actual selected candidates and interactions after changes. Do not relax a budget solely to silence a regression; record why an intentional feature justifies it. Field LCP, CLS, INP, conversion, multiple browser engines and real China-network performance remain to be measured.

## V21 observed changes

The portrait now offers 360/720/1080px derivatives plus the unchanged 1400px original. scripts/build-portrait-variants.mjs regenerates the smaller square WebP files without cropping; source identity, CSS crop, alt text and dimensions are retained. File sizes are 7,962 / 20,402 / 34,428 / 66,486 bytes. sizes reflects the single-column mobile layout and approximately 500px desktop slot. The browser may choose a larger candidate for device density or cache reasons.

Run `npm run build:portrait` after an authorized portrait source update, inspect each size, and commit the resulting three WebP files with the source changes. They are checked-in assets; a normal CI build does not regenerate them.

Uncached localhost loads at approximately 1x DPR: the 320px viewport selected the 7,962-byte candidate for a 260.66px rendered portrait; 1440px selected 20,402 bytes for 497.78px. Both previously requested 66,486 bytes. These are image encoded-body observations, not whole-page speed or field LCP gains. Higher-density physical devices remain unverified.

Extracting the method navigation into its own Astro component removed unnecessary style-scope attributes from the rest of the homepage. Final HTML fell from 19,468 to 16,663 bytes despite the added responsive markup. The conservative image budget now counts all new candidates; the published artifact grows while selected browser requests shrink. No budget was relaxed.
