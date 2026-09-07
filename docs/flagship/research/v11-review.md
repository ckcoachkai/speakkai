# SpeakKai flagship V11 editorial CMS review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: read-only source review of V11 in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Focus: the new Keystatic course-editorial singleton, the seven editable narrative fields in English and Simplified Chinese, runtime validation, public render parity, exclusion of editor-only notes, and practical editing limits. No product files, generated output, build artifacts, or browser state were changed by this review. The coordinating agent owns the real UI and final build.

## Verdict

V11 is structurally sound and keeps the new editing surface appropriately narrow. Keystatic exposes one bilingual singleton with seven narrative fields per language, a review date, and an editor-only source note. The shared programme model still owns class count, units, speech lengths, showcase scope, themes, roles, and operational boundaries. `courseCopy.ts` imports the two language records explicitly and leaves the fixed course facts in code.

No P0, P1, or P2 blocker was found in the inspected source. The remaining concerns are P3 maintainability limits: the editor does not provide a semantic or side-by-side translation-parity check, and the runtime validator tolerates unknown top-level JSON keys even though it rejects unknown fields inside each language record. Both are low-risk because the public template explicitly selects the known language fields and CI checks the expected rendered copy.

## Data and editor safety

- `src/lib/courseEditorial.mjs:1-9` defines exactly seven editable narrative keys: `introduction`, `worldsIntro`, `rolesIntro`, `feedbackIntro`, `example`, `retry`, and `decideIntro`. The object is shared by the CMS schema and validator, so the field inventory has one source.
- `keystatic.config.ts:1-24` registers the `courseEditorial` singleton at `src/content/flagship/course-editorial`. It creates the same seven multiline fields under `en` and `zh-CN`, requires 10–700 characters, and labels the scope clearly: narrative copy only; facts, dates, fees, and booking boundaries remain separate. The review date and editor-only source note are required.
- `src/data/currentProgram.ts` is unchanged in the V11 working tree. This preserves the confirmed numerical and programme scope outside the CMS editing surface.
- `src/data/courseCopy.ts:1-4` validates the JSON record during module loading. `:10-11` and `:37-38` spread only `editorial.en` and `editorial["zh-CN"]`; fixed titles, facts, labels, themes, roles, contact copy, and boundaries remain explicit in the course source.
- `src/lib/courseEditorial.mjs:11-34` rejects a missing record or language, missing or extra nested narrative fields, non-string values, values outside 10–700 characters, invalid calendar dates, and a missing editor note. The date check catches normalized invalid dates such as February 30.
- `scripts/check-course-editorial.mjs:4-8` exercises five invalid-record cases: missing Chinese content, an empty English field, an invalid date, an unexpected nested field, and an empty editor note. `:9-24` checks both public routes for every editable value and scans generated public files to ensure the editor note is absent.
- The current `src/content/flagship/course-editorial.json:1-21` contains paired English and Chinese values, `reviewedOn: "2026-09-07"`, and a source/review note. The temporarily appended introduction sentence reported during UI QA is absent from the current source inspection, consistent with its restoration before the final build.

## Coordinating UI evidence

The coordinating agent saved both English and Chinese introductions through the real Keystatic UI, reloaded the editor, and verified both rendered Astro pages. The temporary appended sentence was restored through the UI before the build step. This confirms the practical save/reload path and the intended source-to-page connection; the final post-restore V11 build remains the coordinating agent’s check.

## Practical editing limits

The singleton is local storage (`keystatic.config.ts:10-17`), so saving changes the local content file. It is not a publishing workflow, translation-management system, or approval log. The existing field descriptions instruct the editor to review both languages, but the UI does not enforce simultaneous editing, semantic translation parity, terminology consistency, or a side-by-side comparison.

The validator enforces exact keys within `en` and `zh-CN`, but it does not reject unknown top-level keys on the JSON record (`src/lib/courseEditorial.mjs:13-33`). Such keys are ignored by the explicit runtime spreads and are therefore unlikely to leak, but strict top-level-key validation would make manual JSON edits fail closed and reduce schema drift.

The render check confirms that each stored narrative string appears in the matching page and that the editor note is excluded. It does not prove that the English and Chinese passages have equivalent meaning, that a phrase has the intended cultural register, or that a future template renders every field in an appropriate visual location. Human bilingual review remains required before release.

## Verification status

- Static source inspection: PASS for singleton registration, seven-field parity, required review metadata, explicit language imports, fixed-fact ownership, nested-key validation, invalid-record coverage, rendered-copy checks, and editor-note exclusion.
- Coordinating Keystatic UI evidence: PASS for saving and reloading both introductions and checking both rendered pages; temporary test sentence restored before build.
- V11 build and generated `check-course-editorial.mjs`: **NOT_CHECKED in this independent review**; root owns the shared `dist` directory and will run the post-restore build/check sequence.
- Screen-reader output, full-site 200% text resize, external publication, and translation-quality adjudication: **NOT_CHECKED**.

## Optional P3 follow-ups

1. Reject unknown top-level JSON keys in `validateCourseEditorial` and add that case to the checker, so manual edits fail closed at the record boundary.
2. Add a small editor preview or review report that displays English and Chinese fields together and flags empty, missing, or materially divergent entries before release.
3. Keep the CMS description and release checklist explicit that saving locally does not publish and that the fixed course facts remain outside the editor.

## Conservative score

V10 baseline: **42/55**. V11 raises Maintainability from 4.5 to 4.75 for the bounded singleton, shared field inventory, runtime validation, paired render checks, and editor-note exclusion. No other score changes are justified by this source review.

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
| Maintainability | 4.75 |

**V11 conservative total: 42.25/55.**

This score reflects editing safety and maintainability only. It does not claim improved translation quality, conversion, ranking, enrollment, learning outcomes, or competition results. Publication remains subject to the post-restore build and release checks.
