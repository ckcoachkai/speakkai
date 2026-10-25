# Released city/contact review snapshot

Historical review of local `541b423`, published as `5061ce8152fcb260467e93b71b14c2ba16489a95` with an identical tree. Deployment and live smoke checks passed. The newer unpublished balance/driver delta is documented separately in `race3d-balance-review.md`.

## What changed

Five licensed car representations are reused with varied liveries for classroom rosters. Upstream car reveals, original authored item models and source notes remain. All racers finish; finish order/time are immutable; FIRST SPEAKER and teacher Continue follow the final finish and decorative effect cleanup.

Four wheel contacts, measured hub geometry, load transfer and suspension drive ramp support. Speed, partial coverage, CG and inertia determine angular impulse. Bounded game air control can fail to settle an edge launch. Airborne momentum deviates from the curving course; there is no arbitrary lane clamp. AI seeks reachable ramps and skips unsafe traffic, late approaches or predicted landing bends with a reason. Extreme sustained excursions receive a visible safety return with 12m progress penalty. This is simplified arcade/Frenet physics, not a full 3D rigid-body or engineering vehicle simulator. Decorative buildings have no rigid-body collision model.

The implemented environment is an original compact Shanghai/Nanjing Road-inspired **fictional closed course**, not an exact reconstruction or photorealistic city scan. It uses 168 modular buildings, cornices, shopfronts, signs and windows in nine instanced batches, with reused materials. No Google geometry, streaming service, paid asset, new credential or tracking was added. Licensed existing car/audio assets and upstream original item-model credits are preserved.

Finishers spin then disappear into pooled fragments, sparks and smoke with an original layered burst. Global limits are 1,488 particles on detailed tiers and 432 on Performance; simultaneous sounds merge and use gain protection. Reduced motion and mute are respected.

## Items, ownership and randomness

Each racer has one independent inventory slot that persists until use; use consumes it once and removes the held icon immediately. Active-effect pills and geometry are distinct. Draws are uniform over ten types from independent seeded per-driver RNG streams; duplicate outcomes are allowed. AI decisions recur at seeded 0.16–0.28 simulation-second intervals. Offensive targeting estimates range, closing speed, trajectory, lateral uncertainty, shields and immunity; it may miss. There is no preselected winner.

| Item | Actual effect |
|---|---|
| Nitro boost | Traction-limited ground acceleration for 6 simulation seconds; active glow, cyan energy streaks and pooled trails. EVs use explicit arcade energy emitters. |
| Rocket | Separate forward thrust for 6 simulation seconds, including airborne use. No item is literally named Jet. |
| Launch | Lofted arcade jump, 55m profile over 6 simulation seconds; separate from physical ramps. |
| Banana | Rear drop, sensible arming and permanent owner immunity. Opponents spin for 6.2 seconds then regain traction over 2.2 seconds. |
| Bomb | Forward bouncing attack at max(110m/s, owner+65); swept hits and blast, bounded to 1.5 course laps (about 6.54km on this circuit). |
| Missile | Guided eligible target; max(82m/s, owner+38), 4.5-second lifetime; swept contact and expiry. |
| Jellyfish shockwave | The shockwave item has an original jellyfish carrier; max(85m/s, owner+42), 1,000m range / 14-second lifetime, multi-target pulse. |
| Freeze | Moving frost wave, 230m / 3.6-second travel lifetime; a hit imposes a 6-second control penalty. |
| Shield | 8-second protection; counters attacks without consuming another driver's inventory. |
| Repair | Restores damage/control and clears attack disruption, with short recovery protection. |

All durations above are **simulation seconds**; normal clock is 5× real time. Optional shared ramp slow motion is explicitly opt-in in Compare cars. Attack slowdown bases are Bomb 6s, Missile 5s, Jellyfish 5.5s, Freeze 6s, Banana 8s, varied by a seeded 0.92–1.08 severity factor. Speed caps use actual pre-impact speed with base retained-speed factors 0.48/0.50/0.58/0.42/0.52, adjusted for strength. Propulsion is reduced while disrupted; Nitro/Rocket cannot immediately erase the penalty. Immunity extends 1.2 seconds beyond the slowdown, preventing indefinite chaining. Repair is an explicit counter.

Original cues and licensed generic engine/foley samples are retained; these are not recordings from each exact manufacturer model.

## Car inputs and comparison

These are reference-informed **simulation inputs**. Concept/class estimates and historical references are identified in `race3d-vehicle-specs.js` and the car cards; do not read the table as current manufacturer certification. Actual model hub dimensions, CG and suspension tuning are in `race3d-vehicle.js`.

| Car | Mass kg | Power kW | Torque Nm | Speed ceiling km/h | Brake m/s² | Tire grip | Durability multiplier |
|---|---:|---:|---:|---:|---:|---:|---:|
| Qvist 2026 Formula concept | 800 | 720 | 650 | 350 | 19 | 1.6 | 0.78 |
| Race Car 01 LMGT3 | 1320 | 390 | 650 | 290 | 14 | 1.4 | 1.3 |
| CarConcept sports coupe | 1420 | 700 | 850 | 380 | 12.8 | 1.22 | 0.95 |
| Lamborghini Gallardo 2010 | 1510 | 412 | 540 | 325 | 11.5 | 1.13 | 1.02 |
| Tesla Roadster 2020 concept | 2050 | 900 | 1200 | 402 | 11 | 1.2 | 1.1 |

Forty seeded five-car item-enabled races all completed. Wins: {"f1-2026":15,"gt3":6,"car-concept":10,"lamborghini-gallardo":3,"tesla-roadster":6}. Formula was fastest in all four solo baselines. This is **not class parity or proof of equal win odds**. A universal weakest car was not established across the tradeoffs; every car keeps one slot, avoiding an untested two-slot advantage.

## Verification

- Full Astro build: 0 errors / 0 warnings / 20 existing hints; 193 pages plus aliases/theme.
- All ten items, shields, independent persistent inventory, AI hold/use, owner immunity, long-range trajectories, expiry and reset passed.
- 60 centered-ramp cases: 30,044 rays against the actual rendered deck, max tire error 0.000386m; steering, rolling, load transfer, landing recovery and all ten ramp/item interactions passed.
- 45 additional type/edge/speed cases: mirrored roll, varied pitch/inertia, partial launches, imperfect landings, off-track travel and recovery passed.
- 25 same-seed hit/no-hit pairs across five cars × five attacks; 50 shield/airborne-miss cases; ten boosted defenders; seeded impact variation; eventual finish/reset passed. Controlled fixtures lost 17.3–23.0m/s and 4.8–9.5 simulation seconds, with 1–2 places lost. **Not a guarantee every real hit changes rank.**
- Nitro visual activation/expiry/disposal passed on all five authored cars, with reduced motion both off/on (10 browser cases).
- Final desktop: 24 finishers, 169 uses of all ten items, 55 takeoffs/landings, 75834 held-icon checks / 0 failures, teacher Continue produced history1 / 23 remaining, no page errors.
- Final mobile 390×844: 24 finishers, 77282 held-icon checks / 0 failures, mute/late-unmute, reduced motion, Auto/Performance and Continue passed. This is desktop viewport emulation, not an Android hardware test.
- Three-second slow car-model loads recovered. Aborted five car GLBs, ten item GLBs and eight WAVs used procedural/synth fallback; full five-car race, cameras, mute/unmute and three restarts (including mid-roulette / mid-explosion) passed. One canvas/HUD, no history change; test routes removed.
- 24/60-car decorative finish stress: exactly once, immutable order, bounded pools, expiry/reset/dispose and audio peak protection passed.

## Measured performance and limits

Async shader preparation keeps diagnostics enabled and leaves fallback cars visible until authored variants are ready. An earlier targeted reload profile dropped 9.7→4.9s, synchronous shader-log waits 7.5→1.5s; that was a pre-integration targeted sample, not a fresh uncached installation benchmark of the final city scene. Pickup scanning, traffic allocation and hidden-wheel work were reduced. Medium retains cheap contact shadows; Auto has bounded render-only resolution/detail control, never different physics or odds.

Paired warm runs: Chrome155 headless on Windows, hardware ANGLE GTX1060/D3D11, 1440×900, actual DPR1, 24 generic racers, seed89173, Medium, mute, 10 laps; 8-second warm-up then18-second sample. Baseline is exact saved222b code with shared unchanged assets. Code/mechanics differ intentionally; the same input seed does not imply identical race paths.

| Metric ms | Before222b | Final revision |
|---|---:|---:|
| Frame interval median | 17.7 | 17.6 |
| Frame interval p95 | 18.4 | 18.3 |
| Frame interval p99 | 35.3 | 18.7 |
| Worst frame gap | 36.6 | 89.4 |
| Game callback CPU median | 12.1 | 9.9 |
| Game callback CPU p95 | 17.2 | 14.0 |
| GPU timer median | 5.49 | 4.14 |

GPU samples are sparse (16/16), not a full GPU trace. These are controlled local production-build measurements, **not proof of the user's browser experience or stable 60FPS**. The final candidate was not publicly served; an equivalent final online/local comparison requires later authorized deployment. Downloading assets alone does not remove browser simulation/shader/render work. The user's tested URL/browser remains unconfirmed.

## Review and publication boundary

Raw generic-name browser evidence and reports are retained in the task workspace; the final contact sheet is saved separately to Library. Mechanics close-ups use isolated lighting and a plain test environment; the street screenshot is the actual game view. No before/after visual comparison is fabricated.

The original publication hold was superseded by explicit approval to publish the tested revision first. Release `5061ce8` passed GitHub Pages build/deploy and exact 32-file live hash verification, then a 24-car live race and teacher Continue. Any newer follow-on remains unpublished pending review.
