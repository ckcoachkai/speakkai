# SpeakKai flagship V8 workplace brief and audience resources review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded read-only review of the V8 flagship checkout at `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Reviewed the new `one-minute-brief.json` workplace exercise, audience-labelled resource cards, the existing `followUp`-based company related link, content claims and privacy boundaries, route and sitemap wiring, and responsive card CSS. No checkout files, browser tabs, CMS state, or shared website state were changed.

## Verdict

V8 is internally consistent and ready for the parent agent's final release decision. The new workplace activity is a concrete, buyer-relevant practice entry with a fictional scenario and explicit instructions to keep real customer, personnel, and confidential company details out of the exercise. Its five steps total the advertised 10 minutes, and the content does not promise business, approval, confidence, or other outcomes.

The resources page now gives each published activity a clear audience label: Students & parents, Schools & educators, or Adults & teams. The new company lesson appears automatically on the companies offer page through the validated `followUp: "companies"` value and routes to the fixed companies inquiry destination. The dynamic sitemap includes the new published lesson, while the curated static route list remains correctly limited to permanent site routes.

No P0, P1, or P2 blocker was found. The parent evidence reports the build, 18 regressions, 10-route/174-target audit, 16-target sitemap, content isolation, responsive 320/900/901/1440 checks, adult five-step completion/restart, company-selected inquiry, no-JavaScript fallback, and print fallback all passing. My targeted practice-content and SEO checks also passed.

## Findings

### No new blocker or required fix

- `src/content/practice/one-minute-brief.json` is schema-valid, published, and internally timed: 2 + 2 + 1 + 2 + 3 = 10 minutes.
- The exercise is plainly framed as practice. The fictional weekly check-in scenario is generic, and the first step explicitly excludes real customer, personnel, and confidential company details.
- The copy avoids unsupported proof. It does not contain testimonials, named client results, affiliation claims, certifications, approval predictions, or business-success promises. The listener guide explicitly says feedback is not a prediction of approval or business success.
- The editorial note identifies the activity as original and records public source signals for internal review. Practice-content checks confirm that the editorial note and its source names do not leak into generated HTML, JavaScript, JSON, or XML.
- The new resource listing derives from the published content collection, sorts by the validated audience enum, labels each card, and uses a heading hierarchy of section `h2` and card `h3`. Each card has an explicit activity link with an accessible name.
- `src/components/FlagshipOfferPage.astro` filters related lessons by both `published` and the offer slug. The companies page therefore receives the workplace activity only through the validated `companies` audience and links onward to `/contact/?audience=companies`.
- `src/pages/resources/[lesson].astro` continues to generate only published lesson routes and maps the enum to fixed next-step destinations. The complete static sheet remains below the optional React guide.
- The resources grid uses three columns above 900px and one column at 900px and below, with a further mobile stack treatment at 760px. Parent viewport QA found no overflow at the tested widths.
- The deployment route check and SEO route list include `/resources/one-minute-brief/`; the dynamic sitemap derives all published lesson URLs from the same collection. `publicRoutes.ts` does not need to duplicate content-derived lesson routes.

The prior semantic polish note remains optional: when an offer eventually has several related activities, a list or small heading inside the existing labelled related-practice navigation would make the group easier to scan. The current single company link is already understandable and correctly grouped by `nav aria-label="Related practice"`.

## Conservative score

Using the V7 coordinator baseline `3.5, 2, 4, 4, 4, 4, 4, 3.5, 3, 4, 4.5 = 40.5/55`, V8 raises only offer clarity by 0.5 for the distinct workplace practice route, audience-labelled resource cards, and automatic company handoff. No visual, conversion, credibility, performance, or completion uplift is inferred without live visitor evidence.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4 |
| Accessibility | 3.5 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.5 |

**Total: 41/55.**

## Evidence run

- `node scripts/check-practice-content.mjs` — PASS: 3 public lessons, 0 drafts, source parity, sitemap inclusion, editor isolation, static homepage.
- `node scripts/check-flagship-seo.mjs` — PASS: 10 graphs, 16 sitemap targets, 404 recovery, robots, and safe serialization.
- `git diff --check` — PASS.
- Parent evidence: production build and 47-page check, 18 regressions, route/link audit, responsive CUA checks, adult guide completion/restart, company inquiry selection, no-JavaScript, and print fallback all passing.



