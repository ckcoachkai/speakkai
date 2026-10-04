# Dynamite Mice v7 — effects, motion and ground creatures

## Changes

- Cheese adds progressively less speed. The slider sets the first bite's 1–100% gain. At 100%, the cheese multiplier progresses through 2×, 2.5×, 2.75× and approaches a 3× ceiling. Formula: `Mnext = M + (3 - M) * (rate / 2)`. Slider changes preserve collected gains. Bomb speed and lice penalties still compose with this multiplier; 3× is the cheese ceiling, not the total speed ceiling.
- At six game seconds, 240 ground creatures appear: beetles, roaches, ants, spiders and maggots. They roam on floor cells and replenish gradually, with a hard cap of 320. Mice squash them along their movement segments. Small effects and quiet, globally throttled crunch audio provide feedback. Lice retain their separate attachment/slowdown behavior.
- Explosions and captures each have 240 principal fragments, including 40 maggots, plus 96 fine flecks and existing blood jets/droplets. At most six heavy impacts animate concurrently; persistent marks remain capped at 2,600. Reduced motion uses smaller budgets. Gore Off hides graphic material while preserving ordinary ground insects and crunch feedback.
- Running transitions and face accents preserve all 30 mouse costumes and six cats. Reactions follow wrong turns, dead ends, bomb danger, cat proximity, cheese, droppings, itching, crunchy footsteps and the exit. The original painted eyes are preserved.
- HUD refresh is limited to ten updates per second while animation remains on requestAnimationFrame. Fullscreen and the every-speaker Continue hold remain intact.

## Verification

- Eleven focused engine groups pass: bomb rules, diminishing gains, slider stability, ground species, population bounds, swept/wall-aware crushing and pause safety.
- Forty-eight seeded regression races completed. Seven rule groups pass on the focused rerun. One old exponential-speed assertion failed during the first run and was updated for the agreed taper; the passing race matrix was not repeated for this test-only change.
- Twelve additional full-rule races passed: 1/2/20/80 names, 10/30/120-second fuses, 1%/100% cheese. Every name was selected once, movement segments stayed out of walls, each update selected at most one name, and awaiting froze fuse/owner/positions/events. The longest case completed 80 selections over 2,040 game seconds.
- Seven hundred lice attachments preserve accumulated slowdown and the 520-record bound.
- Renderer checks cover density, equal explosion/capture material, six-impact cap, five insect types, crushing, culling, reduced motion, Gore Off, pause behavior and simulation purity.
- Audio checks cover cue ordering, immediate music pause, stale-play guards, final speaker hold, and bounded audio with 500 simultaneous crush events.
- `check-maze-v7.mjs` tests the actual bundled engine. CI retains exact media/source reconstruction, safe names/CSV/audio regressions and bomb-mode tests.

## Review findings and limits

### Final browser and visual pass

Desktop Chromium was exercised at 1440×960. A natural round recorded four bomb handoffs, ten insect crushes and one carrier detonation at exactly 30 game seconds. The impact contained 240 pieces, 40 maggots and 96 flecks. The transparent speaker card held the scene; time, all creature records and the canvas PNG were identical across the settled hold. The supplied song paused. Continue resumed once, retained fullscreen and selected no extra name; music playback resumed in a subsequent run.

Zoom 8 and Map reset worked. Gore Off and Reduced Motion were switched on and off without errors. The cheese slider displayed +100% and returned to +1%. Dismissing New Maze preserved the race; confirming cleared insects, lice, effects, splats, selections and accumulated boosts. Phone layouts at 375px and 320px had matching viewport/document widths with reachable Start/Pause controls. The standalone ran with Chromium network access disabled, decoded all 19 image atlases and played the embedded song.

Final screenshots inspect all 30 costumed faces, ten reaction states, close zoom, the five ground species, and the explosion hold. The dense 80-mouse overview also contained 240 insects and 377 lice. Over 3.5 seconds it produced 193 frames (about 55 fps): renderer mean 6.91 ms/p95 7.80 ms; engine update mean 2.75 ms/p95 3.70 ms; frame interval mean 18.08 ms/p95 20.70 ms. V6's same-machine sample produced 203 frames with renderer mean 5.88 ms. Added detail therefore has a modest cost; this does not certify 60 fps or performance on physical phones. Level-of-detail drawing recovered most of the first v7 draft's slowdown (155 frames).

### Five review lenses

- **Game correctness:** deterministic cheese curves, one-shot crushes, exact bomb deadlines, unique selections and full-rule race completion passed engine and bundled-source checks.
- **Host workflow:** the natural speaker hold, Continue, fullscreen, reset confirmation and song pause/resume were checked through browser controls.
- **Visual clarity:** the first extra-eye overlay was rejected; final art preserves the painted eyes, adds situational accents, and keeps the overview readable with close-range detail.
- **Performance and longevity:** actor/insect/debris bounds and long races passed; the measured dense scene remains responsive at about 55 fps on the test machine. The strict 60 fps target was not met in that sample.
- **Release integrity:** standalone-to-hosted reconstruction and content-addressed media checks pass. Existing name/CSV/audio regressions remain in CI. Live page/media verification follows deployment.

The first face-overlay draft created extra eyes on some costumes and was rejected during contact-sheet review. Its replacement retains the original eyes. Close insect art was corrected to six insect/eight spider legs; maggots received segmented bodies. These findings required visual inspection beyond source tests.

Ground contact uses 1/30-second simulation slices and swept mouse paths against insect positions for that slice. Insects travel at most about 0.026 cells per slice versus a 0.34-cell crush radius. This is a bounded game approximation, not continuous two-body physics.

Physical haptics/touch, screen readers, Safari and Firefox remain unverified. Refresh resets the race. The standalone embeds media for offline use; a fresh hosted load needs media downloads. Media remain 20 unchanged files totaling 12,934,978 bytes. Game-driven selection order is not a statistically uniform random draw.

Local evidence: `work/mouse-maze/v7-qa/`, focused source QA scripts, and `work/mouse-maze/bomb-qa/final-race-qa-results.json`. Final browser/performance and publication receipts accompany the release.
