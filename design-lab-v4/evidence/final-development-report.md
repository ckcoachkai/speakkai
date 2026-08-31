# SpeakKai Homepage Experiment Lab V4 - final development report

Date: 2026-08-31

Status: complete locally, committed after validation, not published.

## 1. Tests created

Tests 21-50 were replaced with exactly 30 new desktop single-screen homepage hypotheses:

- 21-30: corporate, institutional, trust, and parent decision support.
- 31-40: student energy, motion, learning, and performance.
- 41-50: modern, spatial, portrait-led, and multi-audience systems.

All are available through the local `/tests/` gallery. The prior V3 Parent Command Center is preserved at `/tests/archive/v3-parent-command-center/` with source and baseline screenshots.

## 2. Stakeholder allocation

- Parent primary: 10
- Student primary: 10
- Customer/institutional primary: 8
- Mixed primary: 2

Secondary audiences are explicit in the registry. A specialist concept was judged against its intended audience rather than forced into a generic compromise.

## 3. Major design hypotheses

- Serious buyers respond to editorial authority, decision structure, and program clarity more than decoration.
- Parents respond to inspectable process, explicit evidence boundaries, and a human coach presence.
- Students respond to participation, stage identity, story structure, and expressive typography more than corporate proof grids.
- A mixed homepage works best when visitors choose a relevant path and the actual proposition and CTA change with that choice.
- Visual ambition can remain static-first and fast: the experiments use server-rendered HTML, limited media, CSS motion, and no framework hydration.

## 4. Strongest Parent concepts

1. Test 25, Parent Decision Matrix - the clearest parent question-to-next-step structure.
2. Test 28, Proof Process Wall - the strongest honest trust concept because it distinguishes process evidence from unavailable case studies.
3. Test 45, Quiet Mono - the best clarity, restraint, accessibility, and performance balance.

## 5. Strongest Student concepts

1. Test 34, Kinetic Type Lab - motion demonstrates pace, pause, emphasis, and contrast.
2. Test 33, Comic Storyboard - an unusually clear, memorable way to teach speech structure.
3. Test 40, Motion Poster Festival - the highest-energy and most shareable student-facing direction.

## 6. Strongest Customer and institutional concepts

1. Test 24, Keynote Authority - strongest five-second commercial clarity and corporate confidence.
2. Test 26, Program Blueprint - converts an abstract coaching offer into a configurable school-program conversation.
3. Test 49, Institutional Network - best systems-level map, while explicitly labelling relationships as illustrative.

## 7. Strongest overall concepts

1. Test 50, Audience Orbit - strongest overall hypothesis; parent, student, and school paths change message, evidence, and CTA, and persist in the URL.
2. Test 24, Keynote Authority - strongest premium commercial starting point.
3. Test 47, Portrait Portal - strongest portrait-led brand drama with clear public destinations.
4. Test 28, Proof Process Wall - strongest evidence-minded trust system.
5. Test 40, Motion Poster Festival - strongest student energy and visual impact.

## 8. Weakest experiments and why

- Test 22: the Swiss evidence grid is clear but exposes how thin the approved proof set currently is.
- Test 29: the documentary/contact-sheet idea needs a larger rights-cleared media library.
- Test 35: the HUD language is engaging for students but reduces parent trust and can imply assessment.
- Test 44: the lens interaction is elegant but too abstract for an impatient buyer.

These remain useful boundary experiments rather than recommended production leaders.

## 9. Major QA failures discovered

- Tests 27, 32, and 49 overlapped portraits/content during narrow responsive reflow.
- Test 43's perspective deck caused cards to intercept one another's pointer targets.
- Initial kit QA defaults targeted the wrong route shape and local port.
- The inherited V3 gallery and shared shell did not truthfully describe or differentiate V4.

## 10. Fixes performed

- Corrected responsive positioning and stacking in Tests 27, 32, and 49.
- Rebuilt Test 43 as four independently operable perspective cards.
- Adapted QA scripts to `/tests/{n}/` and configurable local/preview servers.
- Rebuilt the gallery with stakeholder/family filters, scores, legacy-route truth, and the V3 archive link.
- Added stable QA selectors and accessible panel behavior across every experiment.

## 11. Performance improvements and results

- One family renderer is statically selected per route; inactive experiments are not hydrated or loaded.
- No autoplay video and no global loading of all experiment media.
- CSS supplies visual motion; reduced motion disables continuous and entrance effects.
- Performance checks passed 30/30. The largest tested route transferred 159,364 encoded bytes; the largest HTML document was 11,020 characters.

## 12. Accessibility improvements and results

- Semantic buttons and labelled panels replace hover-only discovery.
- Arrow, Home, End, Enter/Space, click, and touch share the same state model.
- Visible focus styling and reduced-motion behavior are built into the shared contract.
- Mobile/tablet reflow uses natural scrolling instead of scaling a desktop canvas down.
- Interaction QA passed 30/30 and responsive QA passed 60/60 route states. Contrast was internally reviewed from rendered screenshots; this is not a formal third-party WCAG certification.

## 13. Remaining limitations

- Approved case studies, testimonials, student-consent media, institutional proof, measured learner outcomes, and pricing remain Missing.
- Internal scores are simulated expert review, not real parent/student/customer research or conversion evidence.
- The available portrait is 1400x1400; several cinematic directions would benefit from a rights-cleared landscape portrait/stage set.
- Mainland-China loading performance remains Missing and requires separate network measurement.
- V4 is local only until Kai gives action-time approval to publish.

## 14. Recommended production candidates

Advance these ten to real stakeholder testing: 24, 25, 28, 33, 34, 40, 45, 47, 49, and 50.

A pragmatic production sequence is:

1. Test 50 for audience architecture.
2. Test 24 for the customer/school entry path.
3. Test 28 or 45 for the parent entry path.
4. Test 34 or 40 for the student entry path.
5. Test 47 for the final visual brand layer.

## 15. Gallery and evidence

- Gallery: `/tests/`
- Archived V3 reference: `/tests/archive/v3-parent-command-center/`
- Full contact sheet: `design-lab-v4/evidence/contact-sheet-21-50-1920.png`
- Desktop screenshots: `design-lab-v4/evidence/screenshots/1920x1080/`
- 30-point QA: `design-lab-v4/evidence/qa-30-point-summary.md`
- Detailed stakeholder review: `design-lab-v4/evidence/stakeholder-review.md`
- Scores: `design-lab-v4/evidence/review-scorecards.json`

## Final verification receipts

- Astro check: 0 errors; one pre-existing schedule hint.
- Astro build: 69 pages.
- V4 static registry check: passed.
- V4 kit registry validator: passed.
- Desktop single-screen: 120/120 states passed.
- Interaction: 30/30 routes passed.
- Tablet/mobile: 60/60 route states passed; gallery filter passed.
- Performance: 30/30 passed.
- Schedule privacy check: passed.
- Schedule data diff: clean.
