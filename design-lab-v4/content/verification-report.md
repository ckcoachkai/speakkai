# SpeakKai V4 content verification report

Access date: 2026-08-31

This report separates source-present public content from evidence that is Missing. It is a repository audit, not independent verification of every biographical claim.

## Source-present and used

| Content | Status | Source | V4 use |
|---|---|---|---|
| SpeakKai and Coach Kai identity | Source-present | `src/pages/index.astro`, `src/pages/about.astro` | Brand and portrait labels |
| Speech, debate, storytelling, presentations, and communication coaching | Source-present | `src/pages/index.astro` | Service framing |
| Students, families, professionals, schools, and organizations | Source-present | `src/pages/index.astro` | Audience routing |
| Assess, Structure, Practice, Refine, Perform | Source-present | `src/pages/index.astro` | Process explanations |
| Public Coach Kai profile | Verified route | `/about/` | Evidence and profile link |
| Public speaking/classroom tools | Verified routes | `src/components/ToolsGallery.astro`, `/resources/tools/`, `/tools/` | Practice examples and secondary CTA |
| Contact route | Verified route | `/contact/` | Primary CTA for all V4 experiments |
| Coach Kai standalone headshot | Verified repository asset | `public/images/coach-kai-headshot.webp`, 1400x1400 | Signature identity in all 30 experiments |

## Source-present but excluded from V4 proof

The current public homepage/About page contains numerical experience and achievement claims. V4 does not use those numbers as proof because no independent source or durable provenance record was found in this repository audit.

- 15+ years
- 1,000+ presentations
- 2,000+ students
- competition placements and other dated achievements

These may remain on the existing public pages, but V4 experiments do not repeat them as verified evidence.

## Missing

- Approved case studies
- Attributable testimonials
- Named learner stories
- Student image/video consent records
- Approved real student documentary media
- School or institutional partner names and logos
- Measured learner outcomes
- Conversion or A/B-test results
- Pricing
- Fixed program packages, capacities, or delivery formats
- Safety certifications or formal guarantees

## Implementation consequences

- Test 28 uses clearly labelled `Process example` stages, not a case study.
- Test 29 uses approved public site context, not documentary student evidence.
- Test 35 contains no score, rank, streak, account, or learner metric.
- Test 38 performs no microphone recording or voice analysis.
- Test 39 describes an iterative practice process, not guaranteed transformation.
- Test 46 is explicitly not an account or private dashboard.
- Test 49 labels its network as an illustrative path, not measured data.
- Every route includes a visible factual boundary.

## Schedule boundary

`public/data/schedule.json` was not changed. Its freshness was not relied on for V4 claims or CTAs. Visitors can still open `/schedule/`, but availability should be confirmed before making plans.

