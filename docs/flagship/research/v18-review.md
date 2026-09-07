# SpeakKai flagship V18 bilingual feedback and retry review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded review of the V18 bilingual course feedback example in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Independent inspection covered the paired editorial JSON, field map, Keystatic schema guidance, course template, localized display copy, and structural check. CMS, build, and browser results below are coordinating evidence supplied by the root task; this reviewer did not edit product files, run a build, or use the shared browser.

## Verdict

V18 is a sound, narrowly scoped extension of the course page. It turns the existing fictional coach quote into a complete three-part exchange:

1. A short learner utterance.
2. Specific coach feedback about pausing before the final sentence.
3. The same utterance retried with a written pause cue.

The implementation keeps the words identical between the first attempt and retry, so the visible change is delivery guidance rather than an invented improvement in the learner’s content or performance. English and Simplified Chinese are authored as paired fields, and the public page still carries the fictional-example label and course boundaries.

This supports a modest Story / emotional fit increase from 4.25 to 4.5 because a parent can now see the course’s feedback-and-retry loop in a concrete child-accessible example. No credibility, conversion, accessibility certification, performance, SEO, learning, or competition-result uplift is justified.

## Evidence-backed strengths

- `src/lib/courseEditorial.mjs:1-9` adds `practiceOpening` and `practiceEnding` to the shared editorial field map. The existing exact-key validation at `:13-24` requires the same fields and 10–700 character bounds in both languages.
- `src/content/flagship/course-editorial.json:6-18` supplies paired red-kite sentences, preserves the existing coach quote, and explains that the retry uses the same words with one pause. The English and Chinese examples describe the same simple action and emotional reason without a student identity, result, testimonial, or achievement claim.
- `keystatic.config.ts:5-11` exposes both fields in the English and Simplified Chinese objects and gives practice fields explicit guidance: one short fictional sentence, reused unchanged in first try and retry, with the page adding the pause cue.
- `src/components/FlagshipCoursePage.astro:43-53` renders a numbered static sequence for first try, coach feedback, and pause retry. The retry reuses `copy.practiceOpening` and `copy.practiceEnding`; only the template-owned `pause-cue` is inserted between them.
- `src/data/courseCopy.ts:26-30,61-65` localizes the labels, pause cue, pause explanation, and listener check. The pause help explicitly says the marker is a rehearsal instruction and is not spoken; the listener check says there is no required pause length.
- The existing coach quote remains the controlling feedback: “Try pausing before your last sentence so I can hear why it matters.” This keeps the new utterances aligned with the already reviewed teaching point.
- `scripts/check-course-editorial.mjs:4-36` now rejects seven invalid records, checks both new fields on both generated language routes, verifies each attempt contains each field exactly once, requires the pause cue only in the retry, and continues checking that the editor note does not leak into public files.
- The page is ordinary server-rendered text. It does not add a React island, audio, microphone measurement, storage, submission, or network behavior. The three parts remain available without JavaScript.
- The three-card desktop layout collapses to one column at the existing 760px breakpoint in `src/components/FlagshipCoursePage.astro:197-214`, preserving reading order on narrow screens.

## Coordinating evidence

The root task reports:

- A real Keystatic paired save/reload was completed for a temporary blue-kite edit, both development language routes rendered the edit twice, and the original red-kite content was restored through the form and source.
- The production build generated 49 pages with zero errors and zero warnings.
- The editorial check passed all seven invalid-record cases and same-word first/retry parity.
- English and Chinese desktop/mobile screenshots were reviewed.
- The doubled-font 320px pass kept the course within the 305px client width.
- No-JavaScript Chinese output exposed all three parts and the pause guidance in the accessibility tree.

This is strong source, editorial workflow, static-output, and bounded browser evidence. The CMS test validates local authoring and restoration; it does not validate remote editing, hosted authentication, or multi-author permissions.

## Content and translation risks

The red-kite example is appropriately small for Grades 1–2, and “I felt proud because I kept trying” describes the fictional speaker’s feeling rather than a measurable course result. The Chinese version preserves the object, height comparison, continued effort, and feeling without adding a new claim.

The schema validates field presence, exact paired keys, and length, but it does not enforce one sentence, prohibit extra pause markers, or semantically verify that English and Chinese describe the same scene. The Keystatic description is an editorial guardrail, not a translation checker. Each future edit still needs paired-language preview and human review.

The retry changes delivery only. The page should continue calling it a retry with a pause rather than a revised performance or improvement. The accessibility-tree evidence can expose the written cue and explanation, but it does not prove that a listener heard a different pause or that the learner’s delivery changed.

One documentation item is stale: `docs/flagship/CONTENT-EDITOR.md:29` still describes seven narrative fields, while the current shared map exposes nine. Update that field count and the editing list before treating the editor guide as current. This is a P3 release-documentation issue, not a public page blocker.

## Verification boundary

Independent source review: PASS for paired field shape, local CMS guidance, same-word reuse, preserved fictional coach feedback, localized labels and pause guidance, static/no-JavaScript rendering, responsive card order, and structural parity checks.

Coordinating evidence: PASS as reported for real local paired save/reload and restoration, both language routes, 49-page zero-error build, seven invalid editorial cases, same-word output, desktop/mobile screenshots, doubled-font 320px fit, and no-JavaScript Chinese accessibility-tree content.

Still **NOT_CHECKED**:

- Native browser zoom and operating-system text enlargement as separate from the scripted doubled-font pass.
- Independent screen-reader certification across browser/AT combinations.
- Human bilingual parent review or comprehension testing.
- Remote CMS editing, authentication, and multi-author permissions.
- Listener hearing, learner delivery, learning outcomes, conversion, ranking, enrollment, or competition results.
- Full release check completion beyond the evidence supplied for this review.

## Conservative score

V17 final baseline: **44/55**. V18 raises Story / emotional fit from 4.25 to 4.5 because the course now demonstrates a concrete fictional speaking moment, specific feedback, and an immediately repeatable next attempt. Keep all other dimensions unchanged.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.5 |
| Visual | 4 |
| Story / emotional fit | 4.5 |
| Mobile | 4.5 |
| Accessibility | 4.5 |
| Performance | 3.5 |
| SEO | 4 |
| Maintainability | 4.75 |

**V18 final conservative total: 44.25/55.**

The increase reflects clearer demonstration of the course’s feedback loop only. It does not establish translation quality through independent study, improved accessibility certification, learner progress, conversion, ranking, enrollment, learning, or competition-result improvement.


Coordinator close-out, 2026-09-07: the editor guide was updated to nine fields per language, eighteen public fields, same-word retry checks and V18 CMS evidence before this release commit. The reviewer subsequently confirmed that correction. All required release checks and 24 route geometry cases passed; both English and Chinese no-JavaScript content and enlarged screenshots were checked. This adds final coordinating evidence without claiming the reviewer ran those tests.
