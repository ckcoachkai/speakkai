# MASTER CODEX PROMPT — SPEAKKAI EXPERIMENT LAB V4

You are the lead orchestrator, creative technologist, front-end engineer, motion designer, QA lead, and red-team reviewer for the SpeakKai homepage experiment system.

Website: `speakkai.com`

Repository: inspect the current working repository before making assumptions.

Reference files in this kit:

- `design-lab-v4/reference/parent-command-center-reference.png`
- `design-lab-v4/docs/REFERENCE_ANALYSIS.md`
- `design-lab-v4/docs/ARCHITECTURE.md`
- `design-lab-v4/docs/CONTENT_CONTRACT.md`
- `design-lab-v4/docs/TOOL_ORCHESTRATION.md`
- `design-lab-v4/config/experiments.json`
- `design-lab-v4/qa/`

## Mission

Replace the current experimental homepage set with **30 completely new, deliberately different, single-screen desktop concepts**.

Default numbering:

- Tests 21–30: Corporate / institutional / trust-led
- Tests 31–40: Fun / animated / kinetic / motion-graphic
- Tests 41–50: Modern / spatial / experimental / premium

This is exactly 30 tests.

The original request mentioned replacing 22–50, but that range contains 29 pages. Use 21–50 by default. If Test 21 is explicitly protected by repository documentation, use 22–51 instead and update every route, registry entry, script, gallery label, and report consistently. Do not mix numbering systems.

## Critical baseline rule

The supplied screenshot is the quality reference. It appears to display:

- `TEST 40 / PARENT COMMAND CENTER`
- `What will your child practise next?`

The user remembers it as possibly Test 39. Identify the actual route/component by its visible strings and component content, not by the remembered number.

Before overwriting any experiment:

1. create a working branch
2. create a git commit or tag for the current experiment set
3. copy the exact Parent Command Center component and styles into an archive/reference folder
4. save screenshots at 1920×1080, 1440×900, and 1366×768
5. record its route, dependencies, and assets
6. confirm the archive can still render

Do not delete first and archive later.

## What to preserve from the reference

Preserve the quality principles:

- everything important fits or is immediately discoverable in one desktop viewport
- strong Coach Kai identity
- one dominant message
- clear CTA
- disciplined spacing
- confident typography
- clear stakeholder intent
- calm but purposeful color
- progressive disclosure
- responsive behavior
- no fake proof

Do not clone the exact portrait-left / headline-center / three-cards-right composition 30 times.

## Non-negotiable desktop requirement

All 30 new experiments are single-screen desktop experiences.

Test at:

- 1920×1080
- 1600×900
- 1440×900
- 1366×768

At those sizes:

- no normal vertical page scrolling
- no clipped CTA
- no clipped experiment navigator
- no hidden critical content
- no unreadably small text
- no horizontal overflow
- no popover outside the viewport
- no hover-only critical interaction
- no concealed broken layout using `overflow: hidden`

On tablet/mobile, recompose intelligently and permit scrolling where needed. Do not shrink the desktop canvas into a miniature.

## Content requirement

At first load, every concept must visibly communicate:

1. SpeakKai
2. Coach Kai
3. what the brand helps people do
4. one audience or service cue
5. one trust cue
6. one primary action

Within one clear interaction, the visitor must be able to discover:

- programs/services
- process/method
- credible outcomes/evidence
- contact or booking path
- stakeholder-specific detail

Use real, verified content from the repository. Never fabricate numbers, testimonials, schools, affiliations, results, credentials, availability, or prices.

## Portrait rule

Use the best available approved Coach Kai portrait as the human basis for all 30 experiments.

First locate the highest-resolution original asset in the repository. Do not rely on the screenshot crop if a better source exists.

Create optimized derivatives as needed:

- AVIF/WebP
- transparent cutout
- monochrome
- duotone
- halftone
- high-contrast poster treatment
- cinematic grade
- circular or lens crop
- small identity seal
- full-bleed crop

Preserve facial identity. Do not distort the face. Do not invent factual contexts.

Each test must use the portrait differently; it should not always be the same rounded rectangle.

## Stakeholders

Every experiment must declare:

- primary stakeholder
- secondary stakeholder
- core question
- CTA
- evidence strategy

Primary stakeholders:

- Parent
- Student
- Customer / school / organization / adult client

Evaluate a concept primarily by whether it succeeds for its declared stakeholder, not by whether every audience likes it equally.

## Source-of-truth concept specs

Read `design-lab-v4/config/experiments.json`.

Implement the exact conceptual differences described there. You may improve a concept when the repository/assets reveal a better solution, but preserve:

- family allocation
- stakeholder strategy
- core hypothesis
- distinct layout archetype
- distinct interaction model
- distinct portrait treatment
- distinct motion language

If you substantially change a concept, update the registry and decision log.

## Differentiation gate

A new test is not valid if it is merely:

- the same layout with another color
- the same hero with a new background
- the same bento cards with new icons
- the same typography with another portrait crop
- the same animation timing with different copy

Each test must differ from its nearest neighbors in at least six of these dimensions:

1. structure
2. depth
3. geometry
4. typography
5. portrait treatment
6. navigation
7. interaction
8. motion
9. density
10. tone
11. CTA strategy
12. stakeholder argument

Use the `signature` fields in `experiments.json`.

Run the fingerprint validation script and also compare screenshots visually. Metadata alone cannot prove originality.

## Family objectives

### Tests 21–30 — Corporate

These should feel suitable for:

- parents making a serious decision
- schools and organizations
- adult coaching customers
- event or education partners

Corporate does not mean generic SaaS. Explore editorial, annual-report, keynote, blueprint, case-study, documentary, and luxury-coaching metaphors.

### Tests 31–40 — Fun / animated / motion-graphic

These should feel:

- energetic
- responsive
- memorable
- student-relevant
- modern enough for teens
- visually expressive without becoming chaotic

Use motion to demonstrate communication concepts. Avoid childish clip art, constant motion, fake game scores, or inaccessible hover tricks.

### Tests 41–50 — Modern

These should explore:

- spatial layouts
- new interface metaphors
- glass/depth
- neo-brutalism
- 3D cards
- optical/lens systems
- extreme minimalism
- OS metaphors
- cinematic hotspots
- fluid typography
- network maps
- audience-adaptive states

Modern does not mean every page uses glass cards or gradients.

## Tool orchestration

Codex remains the source-code and QA owner.

Use other tools only when they materially improve a concept:

- Figma: complex layout systems, family art-direction boards, interaction-state diagrams
- Canva: cutouts, contact sheets, posters, sticker/desk assets
- ChatGPT image generation: abstract/decorative custom assets and approved portrait-derived stylization
- HyperFrames: deterministic motion studies, title sequences, short loops, launch reel material
- Remotion: React motion prototypes, flipbook sequences, showreel, rendered fallback loops
- Suno: optional owned instrumental for a showreel or explicit opt-in audio experiment

Do not block implementation waiting for an external asset. Create an asset job, use a professional fallback, continue, and integrate the final asset later.

Do not store credentials or automate around login/security barriers.

No autoplay audio.

## Implementation architecture

First inspect the framework and existing conventions.

Then build:

1. verified content store
2. experiment registry
3. route-level lazy loading
4. compact Test 1–50 navigator
5. `/tests` gallery with lightweight preview thumbnails
6. shared accessible primitives
7. isolated per-test visual modules
8. QA instrumentation with stable `data-qa` selectors
9. screenshot and viewport test scripts
10. reports and decision log

Do not make the gallery render all 50 live pages simultaneously.

Do not load all 30 experiments’ media on every route.

## Design batches

Work in six batches:

- Batch A: 21–25
- Batch B: 26–30
- Batch C: 31–35
- Batch D: 36–40
- Batch E: 41–45
- Batch F: 46–50

After each batch:

1. build
2. render all target viewports
3. capture 1920×1080 screenshots
4. create a contact sheet
5. run one-screen checks
6. run console checks
7. run keyboard/touch interaction checks
8. run the five-second stakeholder test
9. compare within the batch
10. redesign the weakest duplicate before continuing

Do not postpone all QA until the end.

## Motion rules

- layout is correct before animation starts
- motion supports hierarchy, feedback, storytelling, or delight
- essential content remains accessible with reduced motion
- no infinite high-intensity loop
- no strobing
- no forced cursor-following
- no background motion that consumes CPU indefinitely
- no autoplay audio
- no interaction whose only affordance is hover

## Accessibility rules

Check:

- semantic buttons/links
- visible focus
- keyboard order
- escape behavior for overlays/dialogs
- touch fallback
- contrast
- readable text
- alt text
- reduced motion
- no essential rasterized text
- no information conveyed by color alone

## Performance rules

- active route loads only active-route media
- lazy-load heavy images/video
- use responsive images
- provide posters for video
- remove background work when the tab or component is inactive
- avoid unnecessary WebGL
- avoid giant shared animation bundles
- inspect rerenders and long tasks
- optimize without stripping away the concept

Record justified exceptions.

## Multi-agent review

If sub-agents are available, use distinct roles. Otherwise simulate sequentially.

Roles:

1. Creative Director
2. Parent Advocate
3. Student Advocate
4. Customer / School Decision-Maker
5. UX & Accessibility Reviewer
6. Motion Director
7. Performance Engineer
8. Factual Accuracy Reviewer
9. Skeptical Competitor
10. Conversion Reviewer

Do not force agreement. Resolve criticism based on the experiment’s declared objective.

## Five-second test

Show or inspect the first frame for five seconds.

Ask the primary stakeholder:

- What is this?
- Who is it for?
- Why might it matter?
- Who is Coach Kai?
- What can I do next?

If the primary stakeholder cannot answer most of these, improve the first frame.

## 30-point QA

For every test verify:

1. route exists
2. build succeeds
3. no major console error
4. no missing asset
5. navigator works
6. current test is identified
7. primary CTA works
8. 1920×1080 fits
9. 1600×900 fits
10. 1440×900 fits
11. 1366×768 fits
12. no horizontal overflow
13. brand is clear
14. Coach Kai identity is clear
15. purpose is clear
16. primary stakeholder is clear
17. trust cue exists
18. programs/services are discoverable
19. process is discoverable
20. contact path is discoverable
21. text is readable
22. contrast is sufficient
23. keyboard works
24. touch/click fallback exists
25. reduced motion works
26. motion is smooth and purposeful
27. media loading is controlled
28. claims are verified
29. design is meaningfully distinct
30. the concept deserves to remain

Fix meaningful failures; do not merely record them.

## Cross-experiment back-test

After all 30 exist:

1. capture the full 21–50 contact sheet
2. compare all screenshots at thumbnail scale
3. run the signature/fingerprint duplicate check
4. identify repeated structures
5. identify repeated portrait treatments
6. identify repeated motion
7. identify stakeholder gaps
8. replace the weakest duplicate concepts
9. rerun all viewport checks
10. regression-test Tests 1–20 and shared navigation

Ask:

> Did we create 30 ideas, or six ideas with five skins each?

Do not accept the second outcome.

## Final scoring

Score each experiment honestly from 1–10 for:

- visual impact
- originality
- brand fit
- primary stakeholder fit
- clarity
- trust
- conversion
- portrait integration
- interaction
- motion
- responsiveness
- accessibility
- technical quality
- performance

Do not fabricate perfect scores.

Shortlist:

- top 3 parent-facing
- top 3 student-facing
- top 3 customer/institutional
- top 5 overall
- strongest production candidate
- strongest experimental wildcard

## Completion gates

Do not finish until:

- the old set is archived
- the Parent Command Center reference is preserved
- 30 new tests exist
- the chosen numbering is consistent
- all are single-screen at four desktop viewports
- mobile/tablet reflow exists
- the test navigator reaches all tests
- the gallery uses lightweight previews
- every test uses a distinct portrait treatment
- stakeholder reviews are complete
- 30-point QA is complete
- screenshot contact sheets are complete
- differentiation checks are complete
- accessibility and performance passes are complete
- Tests 1–20 still work
- a final report names strengths, weaknesses, fixes, and recommendations

## Autonomous execution

Do not repeatedly ask for permission.

Inspect, archive, build, test, compare, red-team, fix, and continue.

If a non-critical external asset is unavailable, create a clear asset job and continue with a professional fallback.

Do not claim success without screenshots, test output, and a final comparative report.
