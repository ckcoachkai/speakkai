# SpeakKai flagship V4 SEO and recovery review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded read-only review of `src/lib/structuredData.mjs`, `src/data/publicRoutes.ts`, `src/pages/sitemap.xml.ts`, `src/pages/404.astro`, `src/layouts/FlagshipLayout.astro`, `src/components/FlagshipBreadcrumbs.astro`, and `scripts/check-flagship-seo.mjs` in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. No checkout files were edited, and no browser, Sites call, or build was run here.

## Verdict

V4 is a truthful, privacy-safe SEO layer. The structured data describes SpeakKai, Kai Liu, the website, the page, and the three declared services without ratings, reviews, prices, awards, or outcome claims. The contact page is represented as a `ContactPage`; offer pages add a `Service` and visible breadcrumb trail. The sitemap is deliberately curated to exclude schedule, itinerary, experiments, labs, redirects, and other non-indexable surfaces. The 404 page is noindexed and gives useful recovery links.

No P0, P1, or P2 blocker was found. The supplied SEO pass reports five valid JSON-LD graphs, 12 valid sitemap targets, recovery links, robots handling, and safe `</script>` serialization. The only follow-up is P3 test depth: the checker validates important invariants but does not fully validate schema semantics or parse the sitemap as XML.

## Findings

### P3 — SEO checker could validate graph semantics more deeply

`scripts/check-flagship-seo.mjs:8-23` confirms that a graph parses, has key organization/person/page nodes, and includes a service and breadcrumb on offer routes. It does not assert unique `@id` values, the graph `@context`, the `Service.provider`, the page’s `mainEntity` reference, breadcrumb positions/items, or that every `BreadcrumbList` item points to the expected canonical page. A future malformed graph could pass the current check.

Add a few focused structural assertions rather than a broad external validator: `@context === "https://schema.org"`, unique IDs, service ID matching `page.mainEntity`, provider organization ID, and two breadcrumb list items with positions 1 and 2. Keep claims and values sourced from the existing page data.

### P3 — sitemap test relies on regex instead of XML parsing

`scripts/check-flagship-seo.mjs:25-35` checks `<loc>` values with a regex and then tests filesystem targets. This is sufficient for the current generated output, but it would not reliably catch malformed XML, escaped locations, or a different namespace/element layout. The generator itself uses a closed list of safe literal paths, so this is a test-hardening item rather than a live sitemap defect.

Use a small XML parser if the bundled environment already provides one, or add a narrow well-formedness check while retaining the current duplicate and filesystem assertions.

## Evidence-backed strengths

- `structuredData()` uses a stable production origin and emits `Organization`, `Person`, `WebSite`, and page nodes with linked IDs (`src/lib/structuredData.mjs:1-7`). The visible brand, handle and role support the declared names and job title.
- Service nodes are created only when a page supplies `service`, and offer routes derive the service name from the typed offer title (`src/pages/[offer].astro:14-19`).
- Breadcrumb JSON-LD is emitted only when an offer supplies a breadcrumb label, and the visible component exposes the same Home/current-page path (`src/lib/structuredData.mjs:8`; `src/components/FlagshipBreadcrumbs.astro:1-7`).
- JSON-LD is escaped against literal `<` before insertion into a script element (`src/lib/structuredData.mjs:9`), and the checker covers a hostile `</script><img...>` title (`scripts/check-flagship-seo.mjs:41-43`). JSON.stringify also handles quotes and backslashes.
- `noindex` suppresses JSON-LD on the 404 page and adds a robots meta tag through `FlagshipLayout` (`src/layouts/FlagshipLayout.astro:14-37`; `src/pages/404.astro:4-11`). The 404 page offers student, school, company, resources, home, and contact recovery paths.
- `publicRoutes` is a short, explicit allowlist for indexable pages and tools. It excludes schedule, itinerary, labs, experiments and redirects by design (`src/data/publicRoutes.ts:1-6`).
- The sitemap generator emits only that allowlist with the standard sitemap namespace and XML content type (`src/pages/sitemap.xml.ts:1-7`).
- No structured-data property claims a rating, review count, price, award, ranking, or guaranteed result. The SEO checker explicitly guards those terms (`scripts/check-flagship-seo.mjs:17`).

## Conservative score

The prior V3 baseline was 43/55. This V4 review changes only the SEO score; unrelated categories remain unchanged.

| Dimension | Score / 5 | Reviewer view |
|---|---:|---|
| Positioning | 4.0 | Unchanged from V3; schema mirrors existing positioning. |
| Credibility | 3.5 | Organization/person identity is coherent and avoids invented proof. |
| Offer clarity | 4.0 | Offer services are named from the typed route data. |
| Conversion | 4.5 | Unchanged from V3; SEO additions do not alter the contact handoff. |
| Visual | 4.0* | Breadcrumb styling is compact; full visual score remains dependent on QA. |
| Story / emotional fit | 4.0 | Unchanged from V3. |
| Mobile | 4.0* | Recovery links have a single-column mobile rule; final score remains dependent on QA. |
| Accessibility | 4.0* | Breadcrumb and recovery navigation are semantic; final score remains dependent on QA. |
| Performance | 4.0 | JSON-LD is small and there is no new runtime or network call. |
| SEO | 4.0 | Canonical, JSON-LD, service/breadcrumb graphs, curated sitemap, robots and 404 recovery are present; structured validation remains intentionally narrow. |
| Maintainability | 3.5 | Central helpers and an allowlist help; the checker and route list could use stronger typed/parser-backed validation. |

**Total: 44 / 55**, with visual, mobile and accessibility still provisional.

## Five next priorities

1. Add focused JSON-LD assertions for context, unique IDs, service/provider linkage, and breadcrumb structure.
2. Add XML well-formedness parsing to the sitemap check while preserving the current route and filesystem gates.
3. Keep `publicRoutes.ts` as the sole sitemap allowlist and review every new public page for `noindex`, private data, schedule/itinerary content, and redirect status before adding it.
4. Re-run the SEO pass after each deployment and compare the generated canonical URLs and graph names to the live route set.
5. Preserve the current no-rating, no-price, no-award schema boundary; add richer schema only when the corresponding public evidence and page content exist.

