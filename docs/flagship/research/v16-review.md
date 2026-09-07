# SpeakKai flagship V16 Astro architecture review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded, read-only architecture review of the current Astro + React + local CMS + GitHub Pages arrangement in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`, and a decision gate for a possible Next.js migration across V16–V25. No product files, generated output, builds, deployment, or browser state were changed. The worktree already contained coordinating documentation changes owned by the root task; those were left untouched.

## Verdict

Retain Astro through V16–V25.

The current public site is a static Astro application with selective React hydration, repository-backed content, and a GitHub Pages publication gate. That architecture matches the observed product: marketing and offer pages, bilingual course and practice pages, static SEO metadata, local browser interactions, and a local editorial workflow. The review found no demonstrated requirement for request-time rendering, authenticated remote editing, server actions, booking persistence, personalization, or a protected public API.

A Next.js migration would currently add route, component, styling, content, image, hydration, CMS, CI, and hosting migration work without solving a verified problem. If Next.js is configured for static export so GitHub Pages can remain the host, it keeps the same server boundary while replacing a working static framework. If Next.js server features are required, GitHub Pages is no longer an adequate runtime and a new host, secrets, deployment process, privacy boundary, and rollback plan become part of the product decision.

## Evidence-backed architecture

- `astro.config.mjs:1-28` uses Astro with the React integration and `output: "static"`. Keystatic is added only when `KEYSTATIC_LOCAL=1`, and its integration hook is invoked only during development. The Vite exclusion for `@keystatic/astro/api` keeps the editor's server API out of browser dependency prebundling.
- `package.json:2-46` identifies Astro, React, `@astrojs/react`, Keystatic, Sharp, and the existing check/build scripts. The scripts include content, course-language, inquiry, SEO, practice, privacy, and flagship-budget checks, which form the current release contract.
- React is used selectively. The source review found the public practice guide as the current hydrated island: `src/components/FlagshipPracticePage.astro:32` renders `PracticeGuide` with `client:load`. The guide preserves the full static practice sheet and uses React for step navigation, progress, focus management, and the optional guided view. This is a good fit for Astro's islands model; it does not establish a need for a full-app React runtime.
- `src/pages/[offer].astro:4-14` uses `getStaticPaths()` over typed offer data. `src/pages/resources/[lesson].astro:2-10` reads the local `practice` collection, filters to published lessons, and generates static paths. The Chinese practice route applies the same publication boundary through `getEntry` in `src/pages/zh/resources/[lesson].astro:5-8`.
- `src/content.config.ts:1-22` defines a typed local JSON collection with bounds for titles, copy, lesson steps, timing, publication status, review dates, and editorial notes. Its refinement requires the step minutes to equal the lesson total before a build can succeed.
- `keystatic.config.ts:1-56` uses `storage: { kind: "local" }` for practice content and bilingual course editorial content. The editor itself says saving is local and that publication requires the website release checks and deployment. This is a repository authoring workflow, not a public CMS endpoint or remote authentication system.
- `scripts/start-cms.mjs:1-4` starts the local editor with `KEYSTATIC_LOCAL=1`. The production configuration therefore does not need to mount the editor routes.
- `.github/workflows/deploy.yml:1-65` installs the locked dependencies, syncs the published schedule, runs privacy/content/inquiry/SEO/practice/flagship checks, builds the static site, uploads the `dist` artifact, and deploys through GitHub Pages. The workflow has no Node server process, runtime API, database, OAuth callback, or server secret boundary.
- `src/layouts/FlagshipLayout.astro:32-78` emits canonical URLs, language alternates, structured data, Open Graph metadata, and the static page shell. `src/pages/sitemap.xml.ts:1-11` derives sitemap targets from public routes and published lessons. These are build-time content graph responsibilities that Astro already handles directly.
- The source inventory contains approximately 131 files under `src` and `scripts`, with a mix of flagship pages, tools, experiments, local speech behavior, and itinerary/internal routes. Any migration must decide whether to preserve, isolate, or retire those route families rather than assuming the twelve flagship routes are the whole application.

## Current fit and limits

Astro is a strong fit for the public surface because the main work happens at build time, the content source is already typed and local, and the browser behavior is isolated to small islands or page scripts. It also keeps JavaScript optional for the main editorial pages while allowing a guided practice enhancement where it has clear value.

The local CMS is adequate for Kai or a trusted maintainer working in the checkout. It does not provide remote team editing, hosted authentication, role-based access, or a public save endpoint. If remote editing becomes necessary, the narrowest change is a separately hosted CMS or service that commits reviewed content to the existing repository while GitHub Pages continues to publish the static output. A CMS requirement alone does not justify changing the public rendering framework.

There is a separate protected-data boundary to keep explicit. `src/pages/i.astro` displays an internal password form, hashes the entered value in the browser, stores an unlock marker in `sessionStorage`, and fetches `/data/schedule-internal.json` from the static site (the client logic is around lines 985-1034). This can be a convenience gate for a deliberately non-confidential internal tool; it is not server-enforced authentication because the page and data are static. If V16–V25 introduces genuinely private schedules, student records, accounts, or dashboards, that requirement should be treated as a separate server/application boundary. It would support evaluating a small protected service or a Next.js server deployment, but it does not support migrating the public site merely to obtain React components.

## What a Next.js migration would cost

A migration would need concrete parity work in each of these areas:

1. Convert Astro pages, layouts, components, slots, scoped styles, and page-level scripts into Next layouts, pages, components, and CSS while preserving the existing URL graph and language paths.
2. Rebuild Astro content collections, local JSON validation, `getStaticPaths` generation, draft filtering, lesson timing refinement, and the bilingual course editorial contract.
3. Reproduce the current React island behavior and its no-JavaScript/static-sheet fallback. The migration should not turn every page into a client component simply because one practice guide is interactive.
4. Replace the Astro image pipeline and preserve responsive logo candidates, intrinsic dimensions, crop geometry, alt behavior, font loading, and the current static byte checks. Next's default image optimizer would require a compatible runtime; a static export would require an explicitly supported image strategy.
5. Rework Keystatic integration and its development-only route boundary. The local editor must still write the same repository files, keep editor-only notes out of public output, and coexist with the selected Next build and preview flow.
6. Port JSON-LD, canonical and hreflang links, robots behavior, sitemap generation, 404 handling, inquiry checks, practice checks, schedule privacy checks, route checks, and image-budget semantics.
7. Rebuild CI and deployment. A static Next export would still require artifact upload and GitHub Pages path/base configuration. A server-capable Next app would require a new host, environment variables, secrets, preview deployments, logging, rollback, and a review of what data is allowed to cross that host.
8. Revalidate the full public graph. V15 release context records 49 generated pages and 12 flagship budget/SEO routes; each page and route would need parity evidence after conversion, including bilingual metadata, contact paths, image loading, accessibility, mobile geometry, and no-JavaScript behavior.

These are engineering obligations, not speculative hour estimates. A migration plan should record the actual route and content inventory, test rewrites, design-regression work, deployment changes, and ongoing maintenance before any framework decision.

## Objective migration gate

Begin an isolated Next.js prototype only when all of the following are true:

- A signed product requirement names at least one real server-bound behavior: authenticated remote CMS or preview, request-time personalization, protected dashboards or APIs, server actions, durable booking/inquiry state, or another requirement that cannot be cleanly isolated as a small service.
- The requirement is shown to fail in the current Astro plan. A React island, a separate CMS host, or a small backend must be considered before making the public rendering framework responsible for it.
- The hosting decision is concrete. If server features are used, select a Node/edge-capable host and define secrets, preview environments, privacy boundaries, logging, rollback, and operating ownership. If static export is retained, document why it materially improves a measured outcome despite preserving static limitations.
- An isolated parity prototype preserves the twelve flagship routes, public slugs and redirects, bilingual content, local editorial behavior, structured data, sitemap/robots/404 output, responsive images, practice hydration, inquiry boundaries, accessibility behavior, and deployment artifact.
- The comparison measures a material durable gain: reduced maintenance or risk, required server capability, public JavaScript, build/deploy reliability, edit/preview workflow, or a product capability the current architecture cannot provide. “React would be easier,” “the CMS needs a UI,” animation, or a more familiar framework is insufficient evidence.
- The migration has an explicit payback or risk-reduction case and a rollback plan. Preserve source history, generated route manifests, asset provenance, content slugs, and public URL behavior through the comparison.

Do not migrate on the basis of the current React island or local CMS. Those already work within Astro's architecture. Reassess at the start of each major V16–V25 product cycle when requirements change.

## Recommended V16–V25 path

Keep the public build in Astro and keep Keystatic local unless a real remote-editor need is demonstrated. Continue to treat repository changes, review, the existing checks, and the GitHub Pages workflow as the publication gate. If remote editorial access becomes necessary, prototype a separately hosted CMS against a test repository and verify edit, commit/PR, build, rollback, permissions, and privacy behavior end to end.

If a protected student, teacher, or booking application becomes part of the product, first define its data and auth boundary. Compare a small dedicated service plus the current static site against a unified Next.js application. Migrate the public rendering layer only if the parity prototype shows that the unified application materially lowers durable cost or risk.

## Verification boundary

Independent source review: PASS for static output configuration, selective React hydration, typed local content, local/dev-only Keystatic wiring, static GitHub Pages publication, build-time SEO/content graph, migration cost categories, and the server-boundary decision gate.

The 49-page final build, generated output, deployed public behavior, browser screenshots, screen-reader behavior, real remote CMS editing, protected-data security, field performance, conversion, ranking, enrollment, learning outcomes, and competition results are **NOT_CHECKED** in this review. The V15 49-page/12-route figures are coordinating release context, not a new V16 build result.

## Conservative score

V15 final baseline: **43.5/55**. This architecture review does not justify a product score change. Keep the V15 dimensions unchanged until a future product change supplies new evidence.

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

**V16 architecture-review total: 43.5/55.**

The recommendation reflects architectural fit and evidence boundaries. It does not claim framework choice has improved speed, conversion, ranking, enrollment, learning, or competition results.


