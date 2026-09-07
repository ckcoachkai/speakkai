# V16 global benchmark: Astro versus Next.js for the static site

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded architecture research before V16 product work. The question is whether the current static GitHub Pages site needs a Next.js migration for React practice islands or local Keystatic. No product files, builds, browser actions, or deployment actions were changed.

## Fresh education leader benchmark

[Coursera](https://www.coursera.org/) returned HTTP 200 on 2026-09-07. The fetched HTML was 797,559 bytes and had the title Coursera | Online Courses, Certificates, & Degrees. Its initial readable sequence is direct: Learn without limits, a visible offer banner, Start, switch, or advance your career., then New and popular, job-ready pathways, and category filters. The page also exposes labeled catalog search, navigation, and program routes.

This is a hierarchy benchmark only: state the broad promise, show the next action, and let visitors move into a focused learning route. It is not evidence for SpeakKai outcomes, conversion, performance, or mobile behavior. The large fetched HTML size is also not a target for SpeakKai; it includes a production application’s content and infrastructure.

## Current SpeakKai architecture evidence

The current flagship checkout is already a static Astro site:

- astro.config.mjs sets output: "static", uses @astrojs/react, and conditionally adds the Keystatic editor only when KEYSTATIC_LOCAL = "1".
- package.json includes astro, @astrojs/react, @keystatic/astro, @keystatic/core, React, and Sharp.
- src/components/FlagshipPracticePage.astro:32 uses one React practice component with client:load; the rest of the page remains Astro-rendered HTML.
- keystatic.config.ts uses local storage for course editorial content and practice lessons, so the editor is a local authoring aid rather than a public runtime dependency.
- .github/workflows/deploy.yml builds and uploads a GitHub Pages artifact, then deploys it with the Pages action.

There is no known requirement for authentication, server-side booking, request-time personalization, or private runtime data. These facts make a static Astro baseline a good fit for the current product.

## What Next.js static export changes

[Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) returned HTTP 200. The current documentation says that output: "export" causes next build to generate an HTML file per route and that the result can be hosted on a static web server, including GitHub Pages. The generated directory is out.

The same documentation lists constraints that matter here: dynamic routes need generateStaticParams(), and features requiring a Node server or request-time logic are unsupported, including request-dependent route handlers, rewrites, redirects, headers, Proxy, Incremental Static Regeneration, Server Actions, Intercepting Routes, Draft Mode, and the default image optimization loader. A static export therefore keeps a future Next migration inside the same static boundary until the deployment target changes.

Next can render React Server Components at build time and hydrate selected Client Components. That can model practice interactions, but every client boundary still needs its client JavaScript and static export does not create a server for future booking or authoring requests. Astro already expresses the desired boundary explicitly: static page HTML plus a small React island.

## Decision for V16

Stay with Astro for this V16 pass. The current output: "static" and GitHub Pages workflow already match the product’s needs, while React practice islands and local Keystatic are present in the existing dependency graph. A migration would replace a working static pipeline and local editor integration without unlocking a requirement currently known to exist.

Use React selectively for practice interactions. Keep informational course and practice content in Astro templates and content files. Keep Keystatic local-only and outside public pages. If a future requirement introduces authenticated editing, server-side booking, request-time personalization, or private data access, re-evaluate the deployment architecture then; do not migrate solely because Next has a broader server feature set.

If a later Next spike is requested, it must prove route parity, GitHub Pages asset paths, local Keystatic authoring parity, practice-island bundle size, image behavior without the default loader, and no loss of no-JavaScript content before any migration decision. With the current custom domain at the site root, a subpath basePath issue is not currently known; verify it if hosting changes.

## Text enlargement and reflow requirements

[W3C WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) says text, including control and label text, must resize to 200% without loss of content or functionality, except for captions and images of text.

[W3C WCAG 2.2 Understanding 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) defines the narrow test as 320 CSS pixels for vertical-scrolling content (equivalent to 400% zoom from a 1280px viewport), without two-dimensional scrolling for ordinary content. Maps, video, games, presentations, and other content whose meaning requires two-dimensional layout are exceptions.

For the actual V16 practice work, treat these as layout acceptance checks: enlarge text to 200% and keep prompts, controls, feedback, and the direct contact path usable; then test the page at 320 CSS pixels or equivalent 400% zoom. Let text wrap, controls stack, and cards grow naturally. Keep any deliberate game or diagram canvas isolated from ordinary explanatory text and provide its controls and instructions outside the two-dimensional region.

## Testable hypothesis and release checks

**Hypothesis:** If the existing Astro static pipeline keeps course content in server-rendered HTML, hydrates only the React practice island, and preserves local Keystatic authoring, then V16 can improve the practice experience without the cost or static-export constraints of a Next migration.

Before release, record each result as PASS, FAIL, or NOT_CHECKED:

- Static GitHub Pages output still contains the primary offer, practice instructions, and direct contact route in initial HTML.
- The React practice island is the only intentionally hydrated practice surface; no page-wide client runtime is introduced.
- Local Keystatic remains available only under its existing local-editor condition and does not add public authoring routes.
- English and Chinese practice pages retain content and language parity after any island change.
- At 200% text size, all ordinary text, labels, prompts, controls, and contact links remain usable without clipped or hidden content.
- At 320 CSS pixels or equivalent 400% zoom, ordinary content reflows without two-dimensional scrolling.
- Any canvas/game/diagram exception is bounded, labeled, keyboard-operable where applicable, and accompanied by readable instructions outside the canvas.
- If a Next spike is made, it proves static route generation, GitHub Pages asset paths, local editor parity, client bundle cost, image-loader replacement, and no-JavaScript content before comparison.

This research did not run a build, inspect generated assets, execute the GitHub Pages deployment, test keyboard or screen-reader behavior, measure bundle size, or verify 200%/320px rendering.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Coursera](https://www.coursera.org/) | Coursera | HTTP 200; 797,559-byte fetched HTML; broad promise, clear next actions, catalog search, pathways, and categories |
| [Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) | Next.js | HTTP 200; output: "export" generates per-route HTML in out; documents GitHub Pages hosting and unsupported server-dependent features |
| [Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) / [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | W3C WAI | HTTP 200; 200% text enlargement and 320 CSS pixel/400% reflow requirements for ordinary content |

## Unavailable or unverified

- Khan Academy was attempted as a possible education benchmark, but its public response was an HTTP 200 client-challenge page of 3,038 bytes; no usable homepage content was treated as verified.
- Current Astro build output, Next bundle size, GitHub Pages deployment behavior, Keystatic editor interaction, React island runtime cost, and actual text enlargement/reflow behavior remain NOT_CHECKED.
