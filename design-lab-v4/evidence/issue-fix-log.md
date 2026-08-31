# V4 issue and fix log

## Resolved during implementation

| Issue | Evidence | Fix | Retest |
|---|---|---|---|
| V4 kit was planning-only while runtime still rendered V3 | Runtime Test 40 was Parent Command Center; config Test 40 is Motion Poster Festival | Added V4 registry/content loader and replaced Tests 21–50 route rendering | Static registry check passed; all 30 production-preview routes passed interaction QA |
| Previous Test 40 needed preservation before overwrite | V3 source and screenshots captured at 1920x1080, 1440x900, 1366x768 | Added byte-for-byte archive plus `/tests/archive/v3-parent-command-center/` | Archive route builds and returns HTTP 200 |
| V3 shared hero/cards shell made concepts look like siblings | `ExperimentLabPage.astro` rendered every route with one structure | Replaced with 30 concept-specific structures across three family renderers | 30-page contact-sheet review confirmed materially different compositions |
| V4 QA scripts expected `/test/{n}` and port 3000 | Project uses `/tests/{n}/` and local Astro port 4321 | Adapted scripts to the project defaults while retaining environment overrides | 120/120 production-preview desktop viewport states passed |
| Playwright package/browser absent | Kit scripts import `playwright` | Added Playwright as a development dependency and used an isolated Chromium executable | Desktop, interaction, responsive, screenshot, and performance suites passed |
| Case studies, testimonials, institutional proof, and learner outcomes unavailable | Repository content audit | Replaced claims with labelled process examples, public-route evidence, and Missing boundaries | Static content audit passed |
| V3 gallery metadata and filters did not describe V4 | Gallery said V3 and mixed scroll/single-screen concepts | Rebuilt `/tests/` for 30 V4 single-screen experiments and preserved legacy/Missing states | Gallery mobile filter QA passed; all 30 cards and review scores build |
| Tests 27, 32, and 49 overlapped text/controls during narrow responsive reflow | First full tablet/mobile browser sweep | Reset desktop portrait positioning and stacking below the responsive breakpoint | Targeted retests passed, then the full 60/60 responsive route sweep passed |
| Test 43 perspective cards intercepted one another's pointer targets | Production-preview interaction sweep | Separated the four cards into independently clickable perspective regions | Production-preview interaction retest passed 30/30 |

## Completed browser evidence

- Four-viewport one-screen measurements: 120/120 passed.
- Full 1920x1080 screenshot set: 30/30 captured; contact sheet generated.
- Interaction suite: 30/30 routes passed, including keyboard activation, click/touch parity, CTA availability, reduced-motion behavior, and Test 50 deep links.
- Tablet/mobile suite: 60/60 route states passed; gallery filter passed.
- Performance suite: 30/30 passed; largest route transferred 159,364 encoded bytes and largest HTML was 11,020 characters.
- Internal simulated stakeholder reviews and scorecards completed. These are design evidence, not real-user or conversion evidence.
