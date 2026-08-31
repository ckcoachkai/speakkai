# V4 30-point QA summary

Date: 2026-08-31

Scope: Tests 21-50. The same 30 checks were applied to every experiment. Automated results are separated from internal visual/editorial review; this is not a formal third-party accessibility audit or real-user test.

## Per-test result

| Tests | Route/build | 4 desktop viewports | Interaction | Tablet/mobile | Performance | Content/review | Retain |
|---|---:|---:|---:|---:|---:|---:|---:|
| 21-50 | 30/30 | 120/120 states | 30/30 | 60/60 states | 30/30 | 30/30 | 30/30 |

## The 30 checks and evidence

| # | Check | Result for Tests 21-50 | Evidence basis |
|---:|---|---|---|
| 1 | Route works | Pass | Static registry plus production-preview navigation |
| 2 | Build succeeds | Pass | Astro check/build, 69 generated pages |
| 3 | No major console error | Pass | Playwright page-error and console-error capture |
| 4 | No missing image | Pass | Browser image completeness checks |
| 5 | Navigation works | Pass | Previous/next/gallery links checked |
| 6 | Test switcher works | Pass | Stable test-switcher selector and browser activation |
| 7 | CTA works | Pass | CTA exists, is visible, and resolves to a valid public route |
| 8 | Desktop layout works | Pass | 1920x1080, 1600x900, 1440x900, 1366x768 |
| 9 | Tablet usable | Pass | 900x1180 rendered interaction/layout sweep |
| 10 | Mobile usable | Pass | 390x844 rendered interaction/layout sweep |
| 11 | Brand identifiable | Pass | Five-second internal review plus visible SpeakKai brand selector |
| 12 | Purpose clear | Pass | Primary-message selector and internal review |
| 13 | Primary stakeholder clear | Pass | Registry metadata and stakeholder review |
| 14 | Secondary stakeholder not unnecessarily alienated | Pass | Stakeholder and adversarial review; specialization allowed by the brief |
| 15 | Value proposition understandable | Pass | Five-second internal review and clarity score gate |
| 16 | Credibility discoverable | Pass | Verified-route evidence or explicit Missing boundary |
| 17 | Images crop correctly | Pass | 30-page screenshot/contact-sheet review and responsive sweep |
| 18 | Text readable | Pass | Screenshot review at all target desktop sizes and responsive sweep |
| 19 | Contrast sufficient | Pass, internal visual review | Palette review across screenshots; no formal WCAG measurement claim |
| 20 | Keyboard usable | Pass | Arrow/Home/End/Enter/Space interaction QA |
| 21 | Touch usable | Pass | Click/touch-equivalent button and tab controls |
| 22 | Hover fallback exists | Pass | Critical content is button/tab activated, never hover-only |
| 23 | Reduced motion respected | Pass | Reduced-motion browser state and CSS contract |
| 24 | No accidental overflow | Pass | 120 desktop viewport measurements plus responsive sweep |
| 25 | No obvious layout shift | Pass, rendered review | Browser screenshots after load; fixed three responsive overlaps |
| 26 | Heavy media controlled | Pass | No autoplay video; one route portrait; performance suite |
| 27 | Design sufficiently distinct | Pass | Registry signature threshold and 30-page contact-sheet review |
| 28 | Claims are factual | Pass within repository evidence | Content verification report and explicit Missing labels |
| 29 | CTA matches stakeholder | Pass | Registry, stakeholder review, and route-level CTA checks |
| 30 | Concept deserves to remain | Pass, internal decision | Review score retain gates and adversarial review |

## Repairs triggered by QA

- Tests 27, 32, and 49: corrected responsive portrait stacking/overlap.
- Test 43: corrected pointer interception between perspective cards.
- All repaired routes passed targeted retests and the full suites.

## Evidence files

- `one-screen-report.json`
- `interaction-report.json`
- `responsive-report.json`
- `performance-report.json`
- `review-scorecards.json`
- `stakeholder-review.md`
- `contact-sheet-21-50-1920.png`
- `screenshots/1920x1080/`
