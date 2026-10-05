# Dynamite Mice v8 QA status

Date: 5 October 2026. This is a pre-publication status record for the v8 maze bundle. It does not certify the live `/maze/` route.

## Completed deterministic checks

- The v8 engine suite reports **105/105 checks passed**. Coverage includes the 180 ms hold-to-drag contract at the engine boundary, wall-safe relocation, fuse ticking while a mouse is held, automatic recovery from immobility and loops, attached insects, progressive damage, the 1,200-item poop cap, insect-type data, cat slow/fast behavior, and the `devoured` fourth selection outcome.
- The movement matrix completed **50/50 angles** across small, medium and larger rosters with varied update slices.
- The full production-rule race suite completed **12/12 cases** across roster sizes, fuse intervals and cheese settings. The one-time-selection, pause/Continue, bomb ownership and wall-safety invariants passed.
- All five package checks pass against both `public` and `dist`: base media/source, Unicode/CSV/audio regression, bomb, v7 cheese/insect, and v8 behavior checks.

## v8 behavior under review

Holding a mouse for 180 ms begins direct relocation; dropping uses the nearest valid floor cell and preserves the active fuse. An automatic watchdog routes a mouse out of an immobile or looping state and marks the recovery as a distinct reaction. Mice show red tears and situational expressions. Ground insects may crunch underfoot or attach; attached insects increase gradual damage through visual stages and can select a name as `devoured`. The cat enters at 60 seconds, alternates between a slower stalking cycle and faster bursts, is slowed temporarily by poop, and receives tapered cheese gains. The visual pass adds distinct labeled heart, liver, stomach, kidney, eye, foot and tail debris.

## Completed Chromium observations

Real Chromium input covered ready/running/paused drag, outside/Escape cancellation, click-follow while running at 4×, explicit fullscreen Escape exit, a devoured fixture selected in the UI after accelerated damage at six seconds, result CSV output containing `devoured`, music pause and Continue resume, Gore and reduced-motion toggles, Map, and 375px/320px layouts without horizontal overflow. No runtime errors were observed. Cat movement at 12 game seconds covered 7.43 cells across 9 distinct cells; sampled speed bursts ranged from 0.72× to 1.5× and remained wall-safe.

An 80-mouse five-second stress sample used 400 cheese, 520 lice, 294 insects and 247 attached insects. It measured 4.13 ms mean render / 5.3 ms p95, 3.71 ms mean update / 4.6 ms p95, and 13.66 ms mean frame interval / 16.8 ms p95.

A natural unaccelerated fullscreen 30-second explosion held exact time, actor positions and canvas screenshot bytes for 1.1 seconds. The song paused, and Continue resumed while preserving fullscreen.

The built-in ImageGen anatomy atlas is a 3×3 atlas with 9 illustrated sprite panels. The game has 20 image atlases total; the v8 media pack totals 21 files and 13,350,364 bytes. Pipeline hashes passed. The original `outputs/custom-assets/anatomy-v8.png` and prompt text are retained. The art is illustrative game artwork and has not been validated as a textbook anatomy reference.

## Pending release evidence

The final close-zoom inspection found the detailed atlas and each heart/liver/stomach/kidney/eye/foot/tail label readable without obscuring the actor or maze. The anatomy artwork is illustrative game art and has not been validated as a textbook anatomy reference. Firefox, Safari/WebKit, physical phones, screen readers and physical haptics remain unverified. Live page/hash/media verification remains pending.

The complete 50-angle inventory and five review lenses are maintained in `work/mouse-maze/v8-qa/REVIEW.md`. Local deterministic, package, Chromium and visual checks are complete; the remaining release gate is the parent agent's final intended-diff review followed by deployment and live page/manifest/media verification.
