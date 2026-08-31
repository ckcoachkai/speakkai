# SpeakKai Homepage Experiment Lab V3

Status: local implementation and internal review complete; not published.

## Evidence boundary

- Tests 21–50 are 30 new design hypotheses, not measured A/B tests.
- Scores are an internal simulated multi-role review, not real parent, student, customer, usability, or conversion research.
- No client logos, testimonials, ratings, partnerships, student results, or performance statistics were invented.
- Repository evidence preserves Tests 1–7, A, 9, and 10. Numeric Test 8 and Tests 11–20 were not present in local or remote source and remain explicitly marked `Missing` in the gallery.

## Portfolio

| Primary stakeholder | Count | Tests |
| --- | ---: | --- |
| Parent | 9 | 26, 27, 28, 29, 31, 38, 40, 43, 49 |
| Student | 8 | 22, 23, 34, 37, 41, 44, 46, 48 |
| Customer / decision-maker | 8 | 21, 24, 25, 33, 35, 36, 42, 47 |
| Mixed | 5 | 30, 32, 39, 45, 50 |

Tests 21–39 are full-page concepts. Tests 40–50 use a one-screen desktop shell at 1920×1080, 1600×900, 1440×900, and 1366×768, then reflow to a scrolling layout at tablet and mobile sizes.

## Review method

The review combined eight roles: creative direction, skeptical parent, student advocate, customer/school decision-maker, UX/accessibility, performance engineering, skeptical competitor, and conversion. Each role was allowed to disagree. A low non-primary stakeholder score is accepted when the page succeeds strongly for its declared primary audience.

The canonical 16-dimension scorecards are in `src/data/experimentReviews.ts`. The gallery shows the simple mean of those dimensions to aid comparison. Scores cover visual impact, originality, brand fit, the three stakeholder appeals, clarity, trust, conversion, UX, image use, motion, responsiveness, accessibility, technical quality, and performance.

## Per-experiment stakeholder and adversarial review

| Test | Primary | Parent review | Student review | Customer review | Adversarial decision |
| ---: | --- | --- | --- | --- | --- |
| 21 | Customer | Professional and credible, but little student evidence. | Mature but distant. | Offer and program conversation are clear. | Keep as an editorial buyer route; do not pretend it is youth-first. |
| 22 | Student | Practice areas are clear; proof and age fit remain open. | Memorable, active, modern, and explorable. | Commercial offer is secondary. | Keep the specialization; label the map as practice areas, not levels. |
| 23 | Student | High energy may feel less reassuring. | Strong hook and creator energy without childish styling. | Services are understandable but not procurement-ready. | Keep; reduce oversized type so the CTA remains visible at every tested width. |
| 24 | Customer | Clear and calm, though evidence is sparse. | Intentionally austere. | Fastest explanation of what can be discussed. | Keep; fix narrow-phone headline overflow and accept low student appeal. |
| 25 | Customer | Teaching principles increase seriousness; outcomes remain unproven. | Thoughtful rather than exciting. | Differentiated point of view supports a workshop conversation. | Keep as thought leadership, with principles explicitly not framed as research. |
| 26 | Parent | Kai is visible, the method is understandable, and fit is the next step. | Human but not strongly interactive. | Credible personal-brand route. | Strong candidate; link to verified biography instead of adding claims. |
| 27 | Parent | Process is concrete without promising transformation. | Can imagine a sequence of attempts. | Program scope is less explicit. | Keep the journey but call it an example, not a fixed curriculum. |
| 28 | Parent | Answers fit, practice, skills, and next-step questions quickly. | Useful but parent-led. | Less tailored to institutions. | Strong full-page parent candidate; leave age, price, and outcomes unguessed. |
| 29 | Parent | Strongest full-page trust boundary and evidence navigation. | Evidence language feels adult. | Professional and inspectable. | Strong candidate; absence of testimonials is disclosed rather than filled. |
| 30 | Mixed | Emotional but lighter on proof. | Aspirational and cinematic. | Audience routes remain understandable. | Keep as brand storytelling; do not let atmosphere replace the three practical paths. |
| 31 | Parent | Modular answers make fit and method scannable. | More dashboard-like than playful. | Capabilities and action are clear. | Strong balanced system, though less original than specialized concepts. |
| 32 | Mixed | Has a direct family entrance. | Has a direct student entrance. | Has a school/organization entrance. | Keep: audience self-selection is the experiment, not a compromise hero. |
| 33 | Customer | Public timeline builds context; not proof of student outcomes. | Career chronology is unlikely to hold attention. | Strong credibility and experience framing. | Keep only with biography-backed dates and no inferred affiliations. |
| 34 | Student | Educational structure is visible; formal levels are not claimed. | Highest exploration and aspiration value. | Weak institutional framing by design. | Strong student candidate; the skill tree remains non-linear and uncertified. |
| 35 | Customer | Serious and reassuring for school conversations. | Intentionally not student-facing. | Clearest full-page audience/need/focus/format sequence. | Strong institutional candidate; avoid implying existing partners or fixed packages. |
| 36 | Customer | Calm and discreet; price and terms remain questions. | Low energy. | Clear private preparation offer and next action. | Keep as a premium adult/parent route; do not universalize it. |
| 37 | Student | Visual energy may reduce perceived seriousness. | Boldest youth-culture direction and easy to remember. | Commercial detail is thin. | Keep as a deliberate edge case; reduce type so CTA stays visible. |
| 38 | Parent | The process feels human without using a fake case study. | Can imagine participating, though imagery is illustrative. | Less commercially explicit. | Keep the documentary structure and its privacy-safe limitation label. |
| 39 | Mixed | Atmosphere is compelling; trust evidence is not immediate. | Stage metaphor adds aspiration. | Partnership path is available. | Keep as the experimental wildcard, not the default production choice. |
| 40 | Parent | One screen answers fit, practice, and next step. | Secondary but not alienating. | Customer offer is not the main purpose. | Top parent candidate; the dashboard is publicly descriptive, not a private account. |
| 41 | Student | Skills are understandable; evidence remains elsewhere. | Strongest one-screen student world. | Not designed for purchasing teams. | Top student candidate; keep the CTA and navigation inside all desktop targets. |
| 42 | Customer | Professional and safe for a parent to encounter. | Low youth appeal is intentional. | Strongest one-screen institutional proposition and CTA. | Top customer candidate; no partner, scale, or package claims. |
| 43 | Parent | Strongest human trust route with biography access. | Coach visibility helps, but interaction is limited. | Professional enough for a first conversation. | Top trust candidate; avoid awards, client, and affiliation embellishment. |
| 44 | Student | Observable practice stages help parents understand the work. | Concrete sense of progress without fake scores. | Only moderately commercial. | Strong hybrid; explicitly state that it is not a logged-in tracker. |
| 45 | Mixed | Sophisticated, though proof is light. | Editorial curiosity without childish visuals. | Service routes remain visible. | Keep as a brand/editorial test; do not imitate awards or press coverage. |
| 46 | Student | Exciting but less reassuring than evidence-led concepts. | Strongest speaking-moment aspiration. | Low institutional specificity. | Top student candidate; critical cues remain visible without hover. |
| 47 | Customer | Needs-based structure is easy for a parent to use. | Student appeal is secondary. | Strong comparison of speaker, professional, and organization routes. | Top customer candidate; every path says ask about fit, not guaranteed availability. |
| 48 | Student | Activity feels visible without exposing students. | Modern, concrete, and tool-connected. | Limited buyer proof. | Strong student candidate; use consented video only when approved. |
| 49 | Parent | Most inspectable trust proposition. | Evidence-first language is not youth-oriented. | Biography, tools, availability, and evidence gaps are explicit. | Highest trust candidate; preserve the visible missing-evidence boundary. |
| 50 | Mixed | Parent entry is immediate. | Student skill route is immediate. | School/program route is immediate. | Highest overall candidate; maintain three distinct paths instead of blending their copy. |

## Score summary

| Test | Mean / 10 | Parent | Student | Customer | Main reason to retain |
| ---: | ---: | ---: | ---: | ---: | --- |
| 21 | 7.31 | 7 | 4 | 8 | Editorial authority |
| 22 | 7.38 | 6 | 9 | 5 | Learning-world exploration |
| 23 | 7.19 | 4 | 9 | 5 | Creator energy |
| 24 | 7.75 | 7 | 4 | 9 | Extreme clarity |
| 25 | 7.44 | 6 | 6 | 8 | Thought leadership |
| 26 | 7.94 | 9 | 5 | 8 | Human trust |
| 27 | 7.69 | 9 | 7 | 6 | Visible learning process |
| 28 | 8.06 | 10 | 6 | 6 | Parent questions first |
| 29 | 7.94 | 9 | 4 | 8 | Evidence boundaries |
| 30 | 7.75 | 7 | 8 | 7 | Cinematic shared moment |
| 31 | 7.88 | 8 | 6 | 8 | Modular overview |
| 32 | 7.81 | 8 | 8 | 8 | Audience self-selection |
| 33 | 7.63 | 8 | 4 | 9 | Verified experience timeline |
| 34 | 7.50 | 6 | 10 | 4 | Skill-tree aspiration |
| 35 | 7.88 | 7 | 4 | 10 | Institutional planning |
| 36 | 7.88 | 8 | 4 | 9 | Private preparation |
| 37 | 7.13 | 5 | 9 | 4 | Youth-culture edge case |
| 38 | 7.75 | 9 | 8 | 6 | Privacy-safe documentary |
| 39 | 7.81 | 6 | 8 | 8 | Experimental stage world |
| 40 | 8.13 | 10 | 6 | 6 | One-screen parent clarity |
| 41 | 7.63 | 6 | 10 | 4 | One-screen student universe |
| 42 | 8.19 | 7 | 4 | 10 | One-screen partnership deck |
| 43 | 8.25 | 10 | 5 | 8 | One-screen human profile |
| 44 | 7.94 | 8 | 9 | 5 | Progress without fake metrics |
| 45 | 7.75 | 6 | 7 | 8 | Editorial brand curiosity |
| 46 | 7.81 | 6 | 10 | 5 | Stage aspiration |
| 47 | 8.13 | 8 | 5 | 10 | Needs-based program map |
| 48 | 7.75 | 7 | 9 | 5 | Practice made visible |
| 49 | 8.38 | 10 | 4 | 9 | Inspectable trust |
| 50 | 8.69 | 9 | 9 | 9 | Three intentional entry lanes |

## Shortlists

- Parent: 49, 43, 40. Test 28 is the strongest scrolling alternative.
- Student: 41, 46, 34. Tests 44 and 48 are the strongest parent-compatible alternatives.
- Customer / institutional: 42, 47, 35. Tests 24 and 36 are strongest for an individual adult customer.
- Overall brand: 50, 31, 26. They retain SpeakKai's human identity while explaining the system.
- Highest simple overall means: 50, 49, 43.

## Weakest experiments

- Test 37 (7.13): deliberately polarizing youth energy; weak parent trust and customer clarity.
- Test 23 (7.19): memorable student hook, but weaker brand authority and parent reassurance.
- Test 21 (7.31): credible editorial treatment, but comparatively static and distant for students.
- Test 22 (7.38): strong student interest, but the abstract world needs more real proof before production.

These are retained because they test distinct hypotheses. They should not outrank the shortlist without real audience evidence.

## QA and fixes

The browser harness ran 123 layout checks: 30 routes at 1440×900, 1024×768, and 390×844, plus Tests 40–50 at 1920×1080, 1600×900, and 1366×768. It also checked the gallery. Screenshots were captured for all 30 at 1440×900, all 11 single-screen experiments at 1366×768, and the gallery.

Meaningful failures found in the first hardened pass:

1. Tests 23 and 37 pushed the CTA below the first viewport at desktop/tablet.
2. Test 24 overflowed horizontally on a 390px phone.
3. The first QA rule incorrectly treated a 1024px tablet reflow as a desktop no-scroll failure.
4. The initial browser pass found a missing favicon request.

Fixes:

- Reduced and responsively tuned creator/signal headline scale and vertical rhythm.
- Added robust headline wrapping and a smaller narrow-screen minimal headline.
- Aligned the no-scroll assertion to desktop widths; tablets are intentionally allowed to reflow and scroll.
- Linked the existing SVG favicon on experiment routes and the gallery.
- Added a hard-failure browser harness for overflow, viewport CTA/navigation, missing images, keyboard focus, noindex metadata, console errors, failed requests, and gallery counts.

### 30-point QA coverage

| Checks | Evidence |
| --- | --- |
| 1–7 routes, build, console, images, navigation, switcher, CTA | Static checker, production build, browser harness, and link targets |
| 8–10 desktop, tablet, mobile | 123 viewport checks and screenshots |
| 11–16 brand, purpose, stakeholder, value, credibility | Registry metadata plus internal eight-role review |
| 17–19 crop, readability, contrast | Manual screenshot/contact-sheet review; no claim of a laboratory contrast study |
| 20–23 keyboard, touch, hover fallback, reduced motion | Focus-entry check, large link/button targets, no critical hover-only content, reduced-motion emulation |
| 24–26 overflow, layout stability, media cost | Hard overflow assertions, fixed-size media shells, no video/autoplay and no new runtime animation library |
| 27–30 distinctness, factual claims, CTA fit, retain decision | Cross-experiment contact sheets, explicit limitations, per-test stakeholder review |

Performance decisions:

- Static Astro routes with no framework hydration for the experiment pages.
- One route loads one concept; the gallery lazy-loads thumbnails rather than mounting all experiments.
- Existing optimized local images only; no video, autoplay, WebGL, or new animation dependency.
- One lightweight CSS orbit animation, disabled under reduced motion.
- Tests remain `noindex, nofollow` until Kai chooses a production direction.

Accessibility decisions:

- Semantic headings, links, figures, articles/details, and nav landmarks.
- Visible focus rings and keyboard-reachable navigation/CTAs.
- Critical information is never hover-only.
- Tablet/mobile reflow is structural rather than a scaled desktop canvas.
- Reduced-motion media query and test coverage.

## Regression boundary

- Production build generated the existing canonical pages, legacy test routes, the gallery, and all 30 new routes.
- Static regression checks verified `/concept-lab/home/`, `/concept-lab/test1/`–`test7/`, `/concept-lab/test9/`, `/concept-lab/test10/`, `/concept-lab/testa/`, and their preserved legacy aliases.
- Numeric Test 8 and Tests 11–20 cannot be regression-tested because no source routes exist in the available local or remote repository history.
- Schedule data was not edited; the existing schedule privacy check remains part of the validation run.

## Recommended production-candidate batch

Develop these eight next, in this order:

1. Test 50 — strongest balanced navigation hypothesis.
2. Test 49 — strongest inspectable-trust hypothesis.
3. Test 43 — strongest human/coach trust hypothesis.
4. Test 42 — strongest institutional conversion hypothesis.
5. Test 40 — strongest one-screen parent hypothesis.
6. Test 47 — strongest needs-based customer map.
7. Test 28 — strongest scrolling parent journey.
8. Test 41 — strongest student-first exploration direction.

Before selecting a production homepage, test these with real parents, students, and decision-makers using five-second comprehension and task-completion interviews. Internal scores are useful for pruning, not proof of market preference.

## Local artifacts

- Gallery: `/tests/`
- Experiments: `/tests/21/` through `/tests/50/`
- Score source: `src/data/experimentReviews.ts`
- Registry: `src/data/experimentLab.ts`
- Browser QA: `scripts/playwright-experiment-qa.js`
- Static QA: `scripts/check-experiment-lab.mjs`
- Local screenshots: `output/playwright/screenshots/`
- Local contact sheets: `output/playwright/review/`
