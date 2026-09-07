# SpeakKai flagship V7 guided lessons review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded read-only review of the V7 classroom activity, lesson `setting` and `followUp` fields, compact `PracticeGuide`, audience-aware contact links, related published lessons, and the lesson content/workflow changes in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. No checkout or browser state was changed.

## Verdict

V7 is internally consistent and source-safe. The published school activity is an original, practical exercise with no student testimonial, score, affiliation, or outcome claim. The dynamic lesson page now uses validated setting and audience follow-up data, while the compact React guide remains optional progressive enhancement above the complete static and printable sheet. The current parent evidence reports the build, regressions, route/sitemap/content checks, and responsive/no-JavaScript QA passing.

No P0, P1, or P2 blocker was found. The V6 review’s date-validation concern is resolved by the current `z.string().date()` schema. The conservative score remains **40/55**; no conversion uplift is inferred from a source review or from the interactive guide.

## P3 refinement

`src/components/FlagshipOfferPage.astro:70-76` renders related activity links as repeated `section-note` paragraphs inside the speaking-prompt section. The links are understandable because each begins with “Free activity,” but a small `nav aria-label="Related practice"` or heading would give screen-reader users a clearer grouping if several published lessons are attached to one audience. This is a semantic polish item, not a navigation defect.

## Evidence-backed strengths

- `src/content.config.ts` validates `setting`, restricts `followUp` to `coaching`, `schools`, or `companies`, validates real ISO dates with `z.string().date()`, and retains the step-total refinement.
- `src/pages/resources/[lesson].astro:6-17` emits only published lessons and maps the validated follow-up to a fixed, known next action. The selected audience also reaches the contact route through the layout CTA.
- `src/pages/resources/[lesson].astro:26-41` uses the same authored steps for the optional `PracticeGuide` and the complete static list, preventing interactive/static text drift.
- `PracticeGuide.tsx` starts with a short introduction, uses native buttons, announces progress with `role="status"` and `aria-live`, moves focus to the updated heading after interaction, and states that there is no recording or saved progress.
- The page’s static note says the activity is suggested and should be adapted to learners; the footer repeats that it is not a test or full course lesson.
- `explain-then-swap.json` describes school-group practice with a teacher/facilitator, peer role swapping, age-appropriate familiar topics, and an explicit instruction to avoid private experiences. Its editorial note identifies it as original and contains no student data or outcome claim.
- `src/pages/resources/index.astro` derives the resource feature list from published content, so a draft cannot appear in the public listing. Existing Filler Alarm and classroom tool links remain present.
- `src/components/FlagshipOfferPage.astro` filters related lessons by both `published` and the offer slug, preventing draft or wrong-audience suggestions.
- `keystatic.config.ts` exposes setting and related coaching path fields, while the deployment workflow keeps the local editor dev-only and runs content isolation checks before upload.
- The dynamic sitemap also derives published lesson URLs from the same collection. The static allowlist need not duplicate those lesson routes.

## Conservative score

Retaining the V6 scorecard: `3.5, 2, 4.5, 4, 4, 4, 3.5, 3.5, 3, 4, 4 = 40/55`. V7 adds useful school practice and audience routing, but this review does not increase conversion, credibility, performance, or other unrelated categories without live evidence.

## Five next priorities

1. Group related activity links under a labelled navigation or heading when more than one appears.
2. Keep the compact guide optional and preserve the complete static/no-JavaScript sheet below it.
3. Retain the `followUp` enum and fixed next-step mapping so CMS content cannot invent arbitrary contact destinations.
4. Continue excluding drafts and editor-only fields from page, listing, sitemap and build artifacts.
5. Treat completion and conversion effects as unmeasured until real visitor data exists.

