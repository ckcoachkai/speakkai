# SpeakKai flagship V17 company brief example review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded review of the V17 `FlagshipBriefExample` component and its Companies offer placement in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Independent inspection covered the component source, its conditional integration, the existing Companies offer data, and the published `one-minute-brief` lesson. Final build, checks, browser, and screenshot results below are coordinating evidence supplied by the root task; this reviewer did not edit product files, run a build, or use the shared browser.

## Verdict

V17 is a focused, evidence-backed improvement to the Companies page. It replaces the generic decision-ready prompt with a concrete before-and-after speaking example that demonstrates one recommendation, one reason, one missing request, and one observable revision. The scenario is explicitly fictional and contains no client story, measured outcome, testimonial, affiliation, or business guarantee.

The placement is appropriate. The hero link points to the example, the example sits before the FAQ and contact path, and the full ten-minute workplace practice remains available through a link only when the published `one-minute-brief` record exists. The company inquiry route remains intact.

The content warrants a modest Story / emotional fit increase from 4 to 4.25 because the visitor can see the teaching method in action: identify what the listener needs, make one change, and check what came through. No credibility, conversion, performance, SEO, or business-outcome increase is justified.

## Evidence-backed strengths

- `src/components/FlagshipBriefExample.astro:3-6` defines a stable opening sentence and labels the scenario as a fictional practice example. The wording “The timings and scenario are invented for this exercise” prevents the 15-minute and two-week details from reading as a client case or promised format.
- `:7-16` gives the example a clear heading and asks the visitor to identify the missing action. The initial attempt keeps the recommendation and reason, then ends with “That is what I wanted to share,” making the missing request concrete without inventing failure data.
- `:17-32` uses a native `details/summary` disclosure for the revision. “Change only the ending” makes the learning intervention observable: the first two sentences remain exact, while the revision adds “Would you join a two-week trial and then help us decide whether to continue?” This is a specific invitation and decision point, not a claim that the trial will succeed.
- `:30-31` asks the listener to identify the recommendation and requested action or decision. That mirrors the existing lesson’s listener-comprehension contract and keeps feedback focused on what came through rather than personality, accent, approval, or business performance.
- `:33-37` tells the visitor to use a safe scenario and only supportable facts. The link to the free ten-minute briefing practice is emitted only when `practiceHref` is present.
- `src/components/FlagshipOfferPage.astro:7,28,82-92` scopes the new component to `offer.slug === "companies"`. Coaching and schools retain their existing examples. The hero anchor is present only for Companies, and the lesson link is derived from the already published, company-filtered collection.
- `src/content/practice/one-minute-brief.json:10-47` provides a coherent continuation: choose a listener, build recommendation/reason/request, speak for 45–60 seconds, check comprehension, and make one change. It explicitly says the scenario is fictional, assumptions should be stated as assumptions, and evidence/results must not be invented.
- The component contains no script, storage, network call, form, or automatic submission. With JavaScript disabled, the initial attempt remains visible, the native disclosure remains operable, and the practice link remains an ordinary link.

## Audience fit and claim discipline

The example fits the Companies audience because the offer already names presentations, pitches, Q&A, team workshops, and decision-ready updates. A project check-in is a safe generic workplace scenario that demonstrates message structure without requiring confidential slides, customer data, personnel details, or a real organization.

The sample’s strongest claim is procedural: a clearer ending gives the listener a specific invitation and a decision to revisit. It does not claim alignment, productivity, approval, revenue, confidence, or improved business results. The surrounding copy also keeps the practice separate from a booking promise and directs users to use facts they can support.

The initial sentence “That is what I wanted to share” is somewhat formal and intentionally incomplete. That is acceptable as a teachable first attempt because the heading and prompt explain that the visitor should pause and supply a closing. It should remain labeled as an initial attempt rather than being presented as recommended business language.

The phrase “See a coaching example” in the hero is understandable, but “See a one-minute speaking example” or “See an illustrative speaking example” would be more immediately audience-facing for company buyers. This is a P3 wording refinement, not a structural or claims blocker.

The example demonstrates recommendation, reason, and request through its prose, while the existing Companies offer still describes two supporting facts in its original data object. The compact example should not be presented as a substitute for adding verified facts in a real brief.

## No-JavaScript, accessibility, and reflow

Native `details/summary` gives the disclosure a browser-managed open state and keyboard behavior without a client runtime. The summary is a clear control, the plus icon is `aria-hidden`, and the revised text is not hidden behind a script-dependent rendering path. The shared flagship focus outline applies to `summary`, and the component’s responsive grid collapses from two columns to one at 760px.

The coordinating browser evidence reports Enter, Space, pointer open/close, and no-JavaScript accessibility-tree activation working. At 320px with doubled fonts, the open example remained within the viewport without horizontal overflow. The 1440px screenshot was reviewed. These results support the small reflow and usability improvement.

Screen-reader output, native browser zoom, and other assistive-technology combinations remain unverified. Native disclosure semantics are a strong baseline, but those unverified checks prevent a broader accessibility claim.

## Verification boundary

Independent source review: PASS for Companies-only scope, fictional scenario labeling, one-change pedagogy, exact retained opening, explicit revised request, listener comprehension check, no-JavaScript structure, published-lesson gating, no submission/persistence path, responsive CSS, and consistency with the existing one-minute lesson.

Coordinating final evidence: PASS as reported for the 49-page build with zero errors/warnings, required static checks, pointer/keyboard/no-JavaScript disclosure behavior, exact before/after text, 320px doubled-font reflow, 1440px visual review, lesson navigation to guided practice step 1, and preserved inquiry path. Documentation EOF whitespace was being corrected separately at review time.

Still **NOT_CHECKED**:

- Native browser zoom and operating-system text enlargement.
- Actual screen-reader output and announcements.
- Field comprehension, inquiry quality, conversion, ranking, enrollment, learning outcomes, and competition results.
- Whether a real company buyer prefers this example or the generic prompt; no user research or experiment was run.

## Conservative score

V16 final baseline: **43.75/55**. V17 raises Story / emotional fit from 4 to 4.25 because the page now shows a concrete, human-readable teaching moment and an observable revision. Keep all other dimensions unchanged.

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4.5 |
| Visual | 4 |
| Story / emotional fit | 4.25 |
| Mobile | 4.5 |
| Accessibility | 4.5 |
| Performance | 3.5 |
| SEO | 4 |
| Maintainability | 4.75 |

**V17 final conservative total: 44/55.**

The increase reflects clearer demonstration of the coaching method only. It does not establish improved credibility, conversion, performance, ranking, enrollment, learning, or competition results.

