# SpeakKai flagship V5 course and resources review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: compact read-only review of `src/data/currentProgram.ts`, `src/pages/coaching/young-competition-speakers.astro`, `src/pages/resources/one-object-story.astro`, `src/pages/resources/index.astro`, `src/components/ToolsGallery.astro`, and the published course facts in `src/components/HomepageV5.astro`. No checkout files were edited, and no build or browser pass was run here.

## Verdict

V5 is source-aligned and gives the flagship a concrete course and a useful practice handoff. The course page repeats the approved HomepageV5 facts: Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90 second practice speeches, a supported three-minute showcase, the three-part learning cycle, warm-ups, themes, and speaker roles. The one-object story is clearly labelled as a suggested activity, not a student testimonial, test, placement assessment, or complete course lesson. Resources still expose all five existing tools.

No P0, P1, or P2 blocker was found. The current flagship card already imports and renders `currentProgram`, and both new routes are already present in the curated public-route list. HomepageV5 contains a historical editorial copy of the course block, but it is a separate legacy surface rather than a second source for the flagship card.

## Findings

### Historical copy note — HomepageV5 remains a separate legacy surface

`src/components/HomepageV5.astro` contains an editorial Programs panel with the same approved facts. The active flagship card is already data-driven through `src/components/FlagshipCurrentProgram.astro:1-16`, which imports `currentProgram` and derives its season, audience, class count, description and link. The duplication is therefore a historical content-maintenance consideration only, not a current flagship implementation defect.

## Evidence-backed strengths

- `currentProgram.ts:1-25` matches HomepageV5’s confirmed 18-class, Grades 1–2, six-unit, 60–90 second, supported three-minute course description and uses the same themes and role set; the active shared card consumes this data directly (`FlagshipCurrentProgram.astro:1-16`).
- The course page labels the three-stage sequence as a repeatable learning cycle and states that every class begins with articulation, body and voice warm-ups (`young-competition-speakers.astro:18-19`).
- The course page states that dates, duration, location/online format, fees and availability are confirmed with Kai, and that competition results are not guaranteed (`young-competition-speakers.astro:22`).
- The feedback example is explicitly marked “not a student testimonial,” avoiding invented learner evidence (`young-competition-speakers.astro:20`).
- The one-object story says it is a suggested practice activity, not a test or full course lesson; its five steps add to the stated approximately 10 minutes (`one-object-story.astro:3-8`).
- Print support is progressive: the print button starts hidden, appears only with JavaScript, and `window.print()` is used; print CSS removes site chrome and interactive controls while preserving the sheet (`one-object-story.astro:10`, final style block).
- The resources index links the activity, Filler Alarm, all five existing tool cards, the Fall course and contact (`resources/index.astro:20-55`).
- `ToolsGallery.astro:16-65` retains Marble Name Picker, Class Charades, Toastmasters Speech Timer, Wheel of Doom and Speech & Debate Timer, with descriptive alt text, explicit dimensions, lazy loading and responsive one-column behavior below 680px.

- `publicRoutes.ts:1-16` already includes both `/coaching/young-competition-speakers/` and `/resources/one-object-story/`; there is no route-allowlist omission in the current source.

## Conservative score

Using the PROGRAM baseline of 39/55 and retaining credibility at 2/5, V5 raises only offer clarity by 0.5 for the concrete course/resource paths. Other categories are held constant.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4 |
| Conversion | 4 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 3.5 |
| Accessibility | 3.5 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4 |

**Total: 39.5 / 55 (rounds to 40).** The only increase relative to the stated baseline is offer clarity, justified by the concrete course and practice routes. Credibility remains 2/5.

## Five next priorities

1. Keep `currentProgram.ts` as the active flagship card source; treat HomepageV5’s parallel block as historical editorial copy and update it deliberately if the facts change.
2. Preserve the explicit “illustrative,” “not a testimonial,” “not a test,” and “no guaranteed results” boundaries in future copy edits.
3. Keep the already-added course/activity routes in the deliberate public-route and sitemap review before deployment.
4. Retain the print CSS and no-JavaScript readable activity path when changing the practice sheet.
5. Recheck all five tool URLs after any `ToolsGallery` edit so a tool card cannot drift from its existing route.
