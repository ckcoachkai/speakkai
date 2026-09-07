# SpeakKai V13 localized practice-page review — initial risks

Review date: 2026-09-07 (Asia/Shanghai)

Scope: read-only inspection of the existing `src/components/PracticeGuide.tsx`, `src/pages/resources/[lesson].astro`, the practice content schema, and the current English `one-object-story` record. V13 is expected to add one Chinese practice page, localized React controls, reciprocal language metadata, a no-JavaScript sheet, and Chinese course entry/return links. No product files, generated output, builds, or browser state were changed.

## Current implementation risks

1. **P2 — React controls are entirely English.** `PracticeGuide.tsx:22-43` hardcodes the section label, progress status, heading states, completion guidance, start/next/back/finish controls, full-sheet link, and no-recording note. A Chinese route must pass a complete localized control-copy object, including `aria-label` and live-status text, rather than translating only the visible headings.

2. **P2 — The lesson route is English by default.** `[lesson].astro:19-42` uses English title/description, English breadcrumbs, English static labels, an English `aria-label` on the full steps list, English print-sheet controls, and English follow-up links. A Chinese page must set `lang="zh-CN"`, localized metadata and labels, a self-canonical Chinese URL, reciprocal English/Chinese alternates, and a Chinese breadcrumb/return path.

3. **P2 — Do not put localized data into the existing published lesson collection accidentally.** `src/content.config.ts:3-22` loads top-level JSON records under `src/content/practice` and `getStaticPaths`/the resources index enumerate published collection entries. A Chinese record added there can change English listing counts, sitemap targets, or schema expectations. Use an explicit localized data source or a deliberately separate collection/route with clear publication rules.

4. **P2 — No-JavaScript fallback must remain complete.** `PracticeGuide.tsx:22` hides the interactive island until hydration, which is acceptable only because `[lesson].astro:34-42` contains the full static sheet. The Chinese route must server-render every translated title, step, prompt, listener instruction, reflection, timing, and direct next-step link; essential Chinese content cannot live only inside the React guide.

5. **P3 — Timing parity can drift during translation.** The current English record has five steps with timings `2, 2, 1, 2, 3` and a ten-minute total (`one-object-story.json:6-33`). The Chinese record must retain those exact integer minutes and the same five-step order; translated prose may say “about 10 minutes” without changing the source timing model.

6. **P3 — Course entry/return links need a reciprocal route decision.** The current course and lesson links use the English `/resources/one-object-story/` and `/coaching/young-competition-speakers/` paths. For the new Chinese page, the Chinese course should enter the Chinese practice route and the Chinese practice page’s coaching CTA should return to the Chinese course. A fallback to English should be explicit in its label when no Chinese route exists.

## Acceptance checklist for the implementation

- `PracticeGuide` receives localized copy for every current English string: section label, intro/step/complete headings, progress status, step duration, completion detail, start/retry/back/previous/next/finish controls, full-sheet link, and no-recording note. The live status remains `role="status"`/polite and the heading-focus behavior remains intact.
- The Chinese static sheet has one H1, translated breadcrumb and metadata, localized `aria-label`s, all five translated steps, the unchanged 2/2/1/2/3 minute values, the unchanged ten-minute total, prompts, listener guidance, reflection, print control, footer boundary, and Chinese course CTA.
- With JavaScript unavailable, the Chinese page still exposes the complete sheet, print-safe content, language switch/alternate link, and direct course/return links. The interactive guide may remain hidden because the static sheet is the fallback.
- English and Chinese pages use self-canonical URLs and reciprocal `hreflang="en"`/`hreflang="zh-CN"` plus `x-default` where the project convention requires it. Both pages render the selected document language and matching JSON-LD `inLanguage`.
- The English page gains the Chinese alternate link and the Chinese page gains the English alternate link; neither route auto-redirects by browser or IP language.
- The Chinese course’s starter link reaches the Chinese practice route, and the Chinese practice page’s coaching CTA reaches the Chinese course route. Any English resource or contact fallback is visibly labelled.
- The translated record is explicit and bounded. It preserves the activity’s illustrative, no-score, achievable-practice framing and introduces no testimonial, result, booking, or competition guarantee.
- The existing English resources collection still contains the same published lessons and does not gain a duplicate Chinese listing unless that is an intentional, separately audited product decision.

## Verification boundary

This is an initial source-risk review before V13 implementation. Build output, route audits, browser language navigation, no-JavaScript rendering, print layout, screen-reader pronunciation, and translation quality are **NOT_CHECKED** here. A final diff review should verify the exact generated English/Chinese documents and the course-to-practice return path after implementation.

## Final source review — 2026-09-07

The implementation addresses the listed risks without introducing a release blocker.

- `src/components/FlagshipPracticePage.astro:1-21` centralizes the English and Chinese practice-page structure, derives the Chinese path from the same slug, passes localized labels to the guide, and points Chinese coaching follow-up directly to `/zh/coaching/young-competition-speakers/`. `:23-45` localizes the visible static sheet, ARIA labels, language switch, print control, footer boundary, and course/resources actions.
- `src/components/PracticeGuide.tsx:3-45` now accepts `language` and selects `practiceLabels` for every guide label, progress/live-status string, heading state, button, full-sheet link, and privacy note. The existing focus return and `hidden={!ready}` behavior remain intact, so the static sheet remains the no-JavaScript fallback.
- `src/data/practiceLanguage.ts:1-40` contains parallel English and Chinese control copy. The Chinese labels preserve the no-recording/no-saved-progress boundary and say that changing language starts a new practice.
- `src/data/storyChinese.ts:1-23` translates the one-object story’s narrative fields while inheriting the English step timings by index. It rejects a changed English step count before producing the Chinese record. The translated five-step sequence keeps the source timings `2, 2, 1, 2, 3` and the ten-minute activity scope.
- `src/pages/zh/resources/[lesson].astro:1-10` emits the Chinese route only when the published English source entry is published. This prevents a draft English lesson from acquiring an indexable Chinese page.
- `src/pages/resources/[lesson].astro:1-12` now delegates the existing English route to the same template, reducing structural drift between language routes.
- `src/components/FlagshipCoursePage.astro:26,52` returns the Chinese course’s practice links to `/zh/resources/one-object-story/`, completing the Chinese course → practice → Chinese course path.
- `src/pages/sitemap.xml.ts:7` includes the Chinese practice URL only when the source lesson is published. `scripts/check-practice-content.mjs:47-71` covers publication gating, reciprocal alternates, Chinese language/canonical metadata, exact rendered timings, key translated phrases, Chinese course target, course return-link count, sitemap inclusion, and editor-output isolation. `scripts/check-flagship-seo.mjs:5-17` and `.github/workflows/deploy.yml:51-55` include the new route in the existing route and SEO checks.

The source keeps the English resource collection unchanged: the Chinese lesson is a separate route/data projection, so it does not create a second English resources card or alter the published lesson count. The user-facing copy remains an illustrative, achievable practice activity and makes no outcome, testimonial, booking, or competition-result claim.

## Remaining P3 follow-ups

`storyChinese.followUp` is currently fixed to `"coaching"` (`src/data/storyChinese.ts:12-19`) to guarantee the intended Chinese course path. If the source lesson’s `followUp` becomes editor-mutable later, derive or validate this value against the source rather than allowing the two records to disagree.

The translated record checks step-count and timing alignment plus selected rendered phrases, but it does not perform semantic translation comparison or enumerate every source field in a machine-readable parity report. Human bilingual review remains required for future copy changes.

## Final verification boundary

Independent source inspection: PASS for the shared template, localized controls, static/no-JavaScript fallback structure, publication gating, timing inheritance, reciprocal language metadata, Chinese course entry/return links, sitemap gating, and existing CI integration. Root’s build, generated checks, and browser QA were ongoing at the time of this review and remain **NOT_CHECKED independently** here. Screen-reader output, full-site 200% text resizing, print rendering, translation-quality adjudication, and conversion impact remain **NOT_CHECKED**.

## Conservative score

V12 baseline: **42.5/55**. V13 raises Accessibility from 4 to 4.25 because the guided experience and static sheet now have complete localized visible labels, live-status strings, ARIA labels, language metadata, and a working no-JavaScript Chinese path. No other score changes are justified by this source review.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.25 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5 |
| Accessibility | 4.25 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.75 |

**V13 conservative total: 42.75/55.**

This is a bounded accessibility and language-path assessment, not a claim of WCAG conformance, improved translation quality, conversion, ranking, enrollment, learning outcomes, or competition results.
