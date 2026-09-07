# SpeakKai flagship V14 Chinese inquiry composer review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded, read-only source review of V14 in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Focus: the Chinese-only progressive inquiry composer, reuse of the inquiry library, editable preview, no-JavaScript behavior, privacy and no-send boundaries, and preservation of the always-visible WeChat contact path. No product files, generated output, builds, or browser state were changed.

## Verdict

V14 is safe and appropriately scoped. `ChineseCourseInquiry.astro` is rendered only on the Chinese course page, after the direct-contact copy and QR within `course-contact`. The native `<details>` starts closed, while the handle and QR remain visible without interaction. The initial Chinese message is server-rendered in an editable `<textarea>`, so the page remains useful without JavaScript; JavaScript only reveals optional fields and the clipboard action.

The composer collects only optional grade, speaking goal, and timeframe. It does not persist, submit, transmit, or reserve anything. Its preview can be edited before copying, clipboard success is reported only after an awaited write, and clipboard failure selects the message for manual copying. No P0, P1, or P2 blocker was found.

## Evidence-backed strengths

- `src/components/FlagshipCoursePage.astro:55-61` keeps the direct WeChat handle and QR in the contact section, then conditionally renders `ChineseCourseInquiry` only when `language === "zh-CN"`. The English course page receives no new composer.
- `src/components/ChineseCourseInquiry.astro:1-17` derives the stable course name from `currentProgram` and renders a native `<details lang="zh-CN">` with a clear Chinese summary, optional fields, privacy guidance, and a prebuilt editable message. The copy explicitly says the website does not send or save the inquiry and does not reserve a course place.
- `:18-28` keeps the optional fieldset hidden until JavaScript loads, while the editable preview and direct manual-copy instructions remain present in ordinary HTML. The QR/handle contact path is outside this disclosure and remains available with JavaScript disabled.
- `:29-61` scopes DOM queries to the single composer, builds from grade/goal/timeframe only, preserves preview edits until an explicit rebuild, uses `copyInquiry(..., "zh-CN")`, and restores focus/selects the preview when clipboard access fails. Buttons use `type="button"`; no form, fetch, storage, analytics, or automatic message send is introduced.
- `src/lib/inquiry.mjs:26-33` bounds Chinese course inputs to 100/600/100 characters, omits blank optional fields, and keeps the fixed course framing and availability conversation in the generated plain-text message. `:35-57` adds localized empty, success, and clipboard-failure messages without changing the existing English default API.
- `scripts/check-inquiry.mjs:25-44` verifies blank optional fields, bounded entered text, localized Chinese output, clipboard success only after the write, explicit denial handling, and no write for an empty message. Existing English inquiry tests remain in place at `:46-99`.
- `src/components/FlagshipCoursePage.astro:26,52` already routes the Chinese course’s practice links to the Chinese practice page, while the composer’s copy remains a human-controlled WeChat handoff. No direct booking or reservation state is added.

## Safety and semantics

The native `<details>/<summary>` control is keyboard and no-JavaScript operable. The initial preview is ordinary text in a textarea, not HTML, so entered content is not interpreted as markup. The custom status uses `role="status"` and `aria-live="polite"`; localized status text covers generation, edits, success, and clipboard failure.

The component is placed after the always-visible direct contact block, so opening or closing the preparation UI cannot hide the QR or handle. The Chinese message asks for general information and the surrounding copy asks users to omit names, contact details, and private records. The final line discusses fit, arrangements, fees, and available places while the UI explicitly says the website does not reserve a place.

## Remaining P3 follow-up

The component uses fixed IDs (`course-grade`, `course-goal`, `course-timing`, `course-preview`) and selects the first `.course-inquiry` from the document before scoping subsequent queries (`ChineseCourseInquiry.astro:31-34`). This is safe for the current one-instance placement. If the composer is later reused more than once on a page, generate unique IDs and initialize each instance independently to avoid label and query collisions.

`buildChineseCourseInquiry` hardcodes `followUp` conceptually to the course conversation rather than accepting an audience value. That is appropriate for this Chinese-only course composer; preserve the single-purpose scope if the component is reused, or add an explicit validated course model before supporting more courses.

## Verification boundary

Independent source inspection: PASS for Chinese-only rendering, direct-contact ordering, native disclosure semantics, editable no-JavaScript initial copy, optional-field privacy, bounded plain-text generation, localized clipboard outcomes, and no persistence/submission paths. The extended inquiry tests were inspected but not executed in this review. V14 build, generated route checks, browser keyboard/geometry checks, screen-reader output, print behavior, clipboard permissions on a real device, and conversion impact remain **NOT_CHECKED** here; root owns those checks.

## Conservative score

V13 baseline: **42.75/55**. V14 raises Conversion from 4.25 to 4.5 because the Chinese course now offers a low-friction, editable inquiry handoff while keeping direct WeChat contact visible. No other score changes are justified by this source review.

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
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.75 |

**V14 conservative total: 43/55.**

This is a bounded interaction and conversion-path assessment, not a claim of successful message delivery, booking, improved conversion, ranking, enrollment, learning outcomes, translation quality, or competition results.
