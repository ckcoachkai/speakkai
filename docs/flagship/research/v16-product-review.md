# SpeakKai flagship V16 product reflow and architecture review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded review of the V16 text-enlargement/reflow changes and the Astro architecture decision in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Independent inspection covered the latest CSS, components, and `docs/flagship/ARCHITECTURE.md`. The final build and browser results below are coordinating evidence supplied by the root task; this reviewer did not run a build, use the shared browser, or edit product files.

## Verdict

V16 closes the identified 320px reflow failure for the reviewed public routes. The final coordinating evidence reports a 49-page build with zero errors or warnings, all required route/content/SEO/inquiry/Speak/privacy/budget checks passing, and no horizontal overflow at the tested 320px and 1440px viewports. The enlarged-text pass also kept every reviewed route within the 305px client width available inside the nominal 320px viewport after the scrollbar.

The source changes are narrow and address observed failure modes:

- `body.flagship` now permits long tokens to wrap with `overflow-wrap: anywhere` in `src/styles/flagship.css:19-27`.
- The mobile experience bar uses `repeat(auto-fit, minmax(min(100%, 4.5em), 1fr))` in `src/styles/flagship.css:569-571`, allowing its statistics to stack when doubled text cannot usefully fit three columns.
- `src/components/FlagshipPracticePage.astro:111-120` sizes the step-number track to max-content and keeps the number together with `white-space: nowrap`. Its mobile override at `:192-194` preserves the same behavior with a smaller minimum.
- `src/components/FlagshipCoursePage.astro:199-214` uses em-based `auto-fit` tracks for mobile course facts and roles, allowing one-column stacking when the enlarged labels or values need it.
- `src/layouts/FlagshipLayout.astro` advances the version marker to 16. No new product dependency or framework migration was introduced.

The final browser screenshots reportedly show horizontal `01` step numbers, stacked `15+ years / 1000+ / 2000+` statistics, and stacked Chinese course facts. Those changes resolve the known visual defects without hiding overflow or reducing the requested text size.

## Coordinating final evidence

The root task reports:

- A 49-page production build completed with zero errors and zero warnings.
- All required checks passed for the twelve flagship routes, content, SEO, inquiry, speech, schedule privacy, and byte budgets.
- At nominal 320px and 1440px viewports, all twelve routes fit horizontally and images loaded. Lazy resource images were verified after scrolling.
- In the doubled precomputed-font-size stress test, the nominal 320px viewport exposed a 305px client width because of the scrollbar; all twelve routes reported `scrollWidth === 305`, so no horizontal overflow remained.
- The enlarged-text visual pass confirmed the step-number repair, stacked experience statistics, and stacked Chinese course facts.
- The enlarged Menu opened and Escape closed it while focus returned to the summary. The English one-minute guide completed all five steps, Finish and Retry worked, and the control right edges stayed at or below 259px within the 305px client width. Chinese inquiry generation focused the draft and kept its controls within bounds.

This is meaningful route-level and interaction evidence. It is not evidence for native browser zoom, screen-reader output, field performance, conversion, ranking, enrollment, learning outcomes, or competition results.

## Source-level reflow review

The shared flagship layout already has several protective properties: responsive grids collapse at the 720px breakpoint, the mobile navigation uses `minmax(0, 1fr)`, the contact inputs and fieldsets use `min-width: 0`, breadcrumbs and action rows wrap, and no flagship `white-space: nowrap` rule was found beyond the intentional step-number label. The existing `overflow: hidden` uses are limited to image crops and screen-reader utility elements.

The V16 fixes match the observed failure causes:

- The previous fixed mobile step-number track could split the number or crowd the content column when font sizes were doubled. `minmax(32px, max-content)` plus `nowrap` preserves a readable horizontal number at the cost of allowing the number track to claim the width it needs.
- The previous three-column experience bar could impose excessive min-content pressure at small widths. The em-based `auto-fit` minimum responds to text size rather than a fixed pixel assumption.
- The previous two-column mobile course facts and roles could become cramped under enlarged text. The new `7em` minimum allows the grid to collapse and keeps the values readable.
- `overflow-wrap: anywhere` provides a general last-resort break for long English, Chinese, URL-like, or token-like text. The supplied screenshots did not report an adverse break in the reviewed routes. Future copy changes should still inspect important labels because arbitrary breaking can affect polish even when it prevents overflow.

The print-only practice rules retain their own fixed print columns and font sizes in `src/components/FlagshipPracticePage.astro:239-256`; the V16 mobile reflow change does not silently redefine print layout.

## Architecture decision

`docs/flagship/ARCHITECTURE.md` records the V16 decision to retain Astro for the public site. That remains consistent with the final product evidence: the site is static, React is used for a selective guided-practice island, Keystatic is local authoring, and GitHub Pages is the publication host. The reflow work did not create a server requirement.

The architecture note correctly keeps framework migration behind concrete gates: protected accounts or data, durable bookings, remote editorial previews, a measured requirement for request-time behavior, a suitable runtime host, a parity prototype, and a demonstrated durable gain. Client-side password checks on static files remain insufficient for confidential data. No V16 evidence changes that decision.

## Remaining verification boundary

Independent source review: PASS for the narrow reflow changes, responsive track logic, control sizing safeguards, intentional overflow boundaries, and consistency with the Astro retention decision.

Coordinating final evidence: PASS as reported for the 49-page build, release checks, twelve-route horizontal fit, image loading after scroll, enlarged-text screenshots, Menu Escape/focus behavior, English guide focus behavior, and Chinese inquiry focus/control geometry.

Still **NOT_CHECKED**:

- Native browser zoom and operating-system text enlargement.
- Actual screen-reader output and announcements.
- Other browser engines or assistive technology combinations.
- Real-user performance, conversion, ranking, enrollment, learning outcomes, and competition results.
- Confidentiality of static internal data; the architecture decision explicitly treats client-side static password gates as non-authentication.

The 305px client width is a scrollbar-adjusted viewport measurement, not a failure. It should remain visible in release evidence so future reviewers do not mistake it for a nominal 320px content width.

## Conservative score

V15 final baseline: **43.5/55**. V16 raises Accessibility from 4.25 to 4.5 because enlarged-text reflow, keyboard menu dismissal/focus return, guide focus progression, and inquiry focus behavior were verified. No performance, conversion, SEO, or outcome uplift is justified.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.5 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5 |
| Accessibility | 4.5 |
| Performance | 3.5 |
| SEO | 4 |
| Maintainability | 4.75 |

**V16 final conservative total: 43.75/55.**

The accessibility increase reflects tested reflow and keyboard focus behavior within the stated scope. It does not establish full native zoom compliance, screen-reader compatibility, field performance, conversion, ranking, enrollment, learning, or competition-result improvement.


