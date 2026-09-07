# SpeakKai flagship V10 bilingual course-page review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: source, generated-artifact, CI, and coordinating browser-QA review of V10 in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. The review covers the new server-rendered English and Simplified Chinese course routes, shared programme facts, language metadata, direct inquiry behavior, route audits, and the QR asset. The coordinating agent owns the browser interaction and screenshot evidence; this review does not claim independent screen-reader or full-site text-resize testing.

## Verdict

V10 is release-ready from the checked source and generated-artifact perspective. The new Chinese route preserves the confirmed programme scope, provides a visible language switch, exposes a same-page direct-contact section, and emits reciprocal canonical and `hreflang` metadata. The corrected QR intrinsic dimensions match the 938×1340 source asset, and CI now includes both the Chinese route in the flagship audit and the dedicated bilingual parity check.

No P0, P1, or P2 blocker remains in the reviewed working tree. The remaining items are optional P3 polish: mark retained English tokens inside Chinese prose with `lang="en"`, and consider replacing the Chinese fact label `课时` with `课程数量` or `课程` to avoid any possible “hours” reading. Neither changes the checked route behavior or confirmed facts.

## Evidence-backed strengths

- `src/data/currentProgram.ts:1-45` remains the single numerical programme source: Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, and a supported three-minute showcase, with the three-stage sequence, themes, and roles.
- `src/data/courseCopy.ts:39-75` gives the Chinese page parallel copy for the sequence, themes, roles, illustrative feedback boundary, range disclaimer, availability and fee limits, no-guarantee language, and direct inquiry expectation. It does not turn the programme range into a fixed syllabus or a booking promise.
- `src/components/FlagshipCoursePage.astro:12-30` renders a server-selected language view with a native link switch, selected-state `aria-current`, shared fact structure, and one H1. `:54-57` keeps the direct contact block visible with the literal `CKcoachkai` handle and existing public QR asset.
- `src/components/FlagshipCoursePage.astro:57` now declares the QR’s actual 938×1340 ratio while `:91-92` scales it to 200px wide with automatic height. This reserves the correct shape and avoids the previous square intrinsic reservation.
- `src/layouts/FlagshipLayout.astro:39-70` emits the selected document language, canonical URL, reciprocal alternate links, `x-default`, and Chinese Open Graph locale. `:100-110` labels English destination routes explicitly on the Chinese page, while `:114-130` keeps the footer in English with explicit language markup for the mixed brand tokens.
- `src/components/FlagshipBreadcrumbs.astro:9-11` and `src/lib/structuredData.mjs:28-70` carry the Chinese page language and breadcrumb metadata through both visible and JSON-LD representations.
- `src/data/publicRoutes.ts:2-17` includes the Chinese route in the curated public route set.
- `.github/workflows/deploy.yml:48-54` now audits both course routes, runs the SEO graph/sitemap check, and runs `check-course-languages.mjs`. `package.json:25-28` exposes the same language check as `check:course-languages` for local use.
- `scripts/check-course-languages.mjs:1-27` checks both static routes for language, canonical, reciprocal alternates, direct contact, QR path, four facts, one H1, and the English/Chinese scope-boundary copy.

## Coordinating browser-QA evidence

The coordinating QA pass reported 48 pages with 0 errors, 0 warnings, and 7 hints; 11 JSON-LD graphs and 17 sitemap targets; fact, language, alternate, inquiry, and privacy checks passing; and no overflow at 320, 760, 761, or 1440px. It also passed native English→Chinese keyboard activation, Chinese→English click/Back navigation, and no-JavaScript Chinese→English Enter behavior. The direct Chinese contact anchor showed the actual 200px-wide QR and literal handle without transmitting anything. Desktop and mobile screenshots were reviewed, including the corrected Chinese H1 wrapping.

Actual screen-reader output and full-site native 200% text resizing remain **NOT_CHECKED**. The browser evidence verifies rendered language access and interaction paths, but it does not establish assistive-technology pronunciation or every large-text layout condition.

## Verification

- `npm run build`: PASS; Astro generated 48 pages with 0 errors and 7 hints. Existing hints concern JSON-LD script processing, an unused schedule helper, and deprecated audio APIs.
- `node scripts/check-flagship.mjs / /coaching/ /schools/ /companies/ /contact/ /resources/ /coaching/young-competition-speakers/ /zh/coaching/young-competition-speakers/ /resources/one-object-story/ /resources/explain-then-swap/ /resources/one-minute-brief/`: PASS for all 11 routes.
- `node scripts/check-flagship-seo.mjs`: PASS; 11 graphs and 17 sitemap targets, with 404, robots, and safe JSON-LD serialization checks.
- `node scripts/check-course-languages.mjs`: PASS; both static course routes, reciprocal alternates, shared numerical scope, contact paths, and scope boundaries.
- `node scripts/check-practice-content.mjs`: PASS; three public lessons, zero drafts included, and source/listing/sitemap/editor isolation checks.
- `git diff --check`: PASS apart from expected Git LF/CRLF working-copy warnings.

## Optional P3 polish

The Chinese prose at `src/data/courseCopy.ts:67-74` retains plain `Kai` and `CKcoachkai` tokens. Wrapping those tokens in `lang="en"` would improve language-of-parts metadata for assistive technology. The explicit markup in the header, programme name, and WeChat line already covers the most visible mixed-language labels.

The Chinese fact label at `src/data/courseCopy.ts:46` is `课时`. Because its value is explicitly `共 18 节课`, the meaning is recoverable, but `课程数量` or `课程` would remove any ambiguity with lesson hours.

## Conservative score

V9 final baseline: **41.5/55**. V10 raises Accessibility only from 3.5 to 4 because the page now serves a separately reachable Chinese document with `lang="zh-CN"`, localized visible content, language-of-parts markup in key areas, and reciprocal language navigation. The coordinating browser evidence supports this limited uplift. Keep actual screen-reader and full-site 200% text-resize results labelled NOT_CHECKED.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5 |
| Accessibility | 4 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.5 |

**V10 conservative total: 42/55.**

No conversion, ranking, enrollment, learning, or competition-result uplift is claimed from this implementation or its markup. Inquiry remains a human discussion and does not reserve a place; fees, exact dates, format, location, and availability remain directly confirmed with Kai.
