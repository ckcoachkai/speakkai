# SpeakKai flagship V12 Chinese-course discoverability review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded, read-only source review of V12 in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Focus: the shared Chinese-course entry component, link language metadata, scope text, placement semantics, and the limits of the resulting discoverability claim. No product files, generated output, builds, or browser state were changed by this review. Root owns the ongoing build and browser QA.

## Verdict

V12 is a sound, reversible discoverability improvement. `FlagshipChineseCourseEntry.astro` is a single shared component with one Chinese label and one direct link to the existing server-rendered Chinese course page. It uses the existing `currentProgram.href` for the destination and the existing `courseCopy["zh-CN"]` for season and grade scope, so it does not create a second course URL or duplicate programme facts.

The component appears once in the homepage hero, once in the coaching offer hero, and once in the resources introduction. On the homepage and coaching offer, the existing primary actions remain before the Chinese entry. The resources placement is an additional route into the course from a relevant practice-discovery page. This supports the claim that the Chinese page is easier to discover from three selected English entry points; it does not establish site-wide Chinese navigation, a localized homepage, or improved conversion.

No P0, P1, or P2 blocker was found. No separate test file was needed for this small static-link reuse; existing route and language checks cover the destination, while the source review covers the component’s link and scope contract.

## Source evidence

- `src/components/FlagshipChineseCourseEntry.astro:1-4` imports `currentProgram` and the existing `courseCopy`, then selects only `courseCopy["zh-CN"]`. The link target is constructed as `/zh${program.href}`, so it follows the shared course slug.
- `:6-10` wraps the entry in `lang="zh-CN"`, gives every instance the same visible label `中文课程介绍`, exposes the existing Chinese season and audience values, and declares `hreflang="zh-CN"`. The language metadata is inherited by the link text and scope line; the arrow is `aria-hidden`.
- `:13-28` provides a 44px minimum link height, wrapping, a 100% width cap, and visible underline/focus-compatible native anchor behavior. No JavaScript, form submission, tracking mutation, or booking action is introduced.
- `src/components/FlagshipHome.astro:45-56` places the component after the two primary hero actions and before the audience shortcuts. The homepage’s main “Find your starting point” and “Meet your coach” actions therefore retain their existing order and prominence.
- `src/components/FlagshipOfferPage.astro:14-27` places the component in the offer hero after the two existing actions, and gates it to `offer.slug === "coaching"`. Schools and companies do not receive a misleading student-course entry.
- `src/pages/resources/index.astro:17-24` places the same component after the resources introduction and before the practice library. The entry connects a parent or learner who begins with practice resources to the existing course route.
- `src/data/currentProgram.ts:1-12` remains the source of the programme name, season, audience, and canonical English slug. `src/data/courseCopy.ts:37-45` remains the source of the Chinese season and audience values shown by the entry.
- `src/layouts/FlagshipLayout.astro:39-70` continues to provide the destination document’s `lang`, canonical URL, JSON-LD language, and reciprocal alternate metadata. V12 adds an entry link; it does not alter the destination’s URL architecture.

## Semantics and honest discoverability boundary

The normal `<a>` element is keyboard and no-JavaScript operable. `hreflang="zh-CN"` accurately describes the destination language, while the wrapper’s `lang="zh-CN"` tells user agents how to interpret the visible Chinese label and scope. Because the entry is a separate destination, it correctly uses a link rather than a button or `aria-current` state.

The copy communicates only “Chinese course introduction” plus the already confirmed `2026 年秋季 · 1–2 年级` scope. It does not imply that the homepage or resources page is translated, that all site navigation is available in Chinese, that a place is reserved, or that the course guarantees a competition result. The destination’s existing inquiry boundaries remain authoritative.

The one shared component prevents label drift across the three placements. The season and audience values are read from the existing Chinese course model rather than duplicated in each caller. The destination remains a stable internal URL and is therefore easy to remove or reposition if the course slug changes.

## Verification status

- Static source inspection: PASS for one shared component, three intended call sites, homepage action ordering, coaching-only gating, inherited Chinese language metadata, `hreflang`, existing course scope values, direct destination, and native link semantics.
- Existing V11 destination controls remain the relevant safety net: the Chinese route is already part of the public route set and language/canonical checks. No new reversible-link test was added because this change only adds a normal internal anchor and does not mutate state.
- V12 build, generated HTML, route-count output, and root browser geometry/navigation: **NOT_CHECKED in this independent review**; root owns the shared `dist` and ongoing QA.
- Screen-reader output, full-site 200% text resize, search indexing, and conversion impact: **NOT_CHECKED**.

## Optional P3 follow-ups

The entry currently exposes only the season and audience beside the label. If later evidence shows that parents need more context before clicking, add a short scope phrase from the existing Chinese description, preserving the current concise hero treatment. Keep the component as a direct link and retain the current boundary language on the destination.

If additional Chinese pages are introduced, extend this pattern through the shared course-language model rather than adding page-specific hardcoded routes. Until then, describe V12 as three selected English-page entry points to one Chinese course page.

## Conservative score

V11 baseline: **42.25/55**. V12 raises Conversion from 4 to 4.25 because the confirmed Chinese course now has direct entry links from the homepage hero, student-coaching hero, and resources introduction. No other dimension changes are supported by this source review.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.25 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5 |
| Accessibility | 4 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.75 |

**V12 conservative total: 42.5/55.**

This is a heuristic discoverability assessment, not a measured conversion or ranking result. No claim is made about enrollment, learning outcomes, translation quality, or competition results.
