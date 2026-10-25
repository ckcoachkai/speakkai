# Mixed-class balance and independent drivers — unpublished follow-on

Live release remains `5061ce8152fcb260467e93b71b14c2ba16489a95`. This branch builds on its identical local tree (`541b423`). No follow-on push or deployment is authorized without review.

The reference/class inputs previously allowed Formula to accelerate to 30 m/s in 1.87 simulated seconds versus Gallardo's 3.73, and win all four solo reference courses. The original source notes/specs remain unchanged. A separate explicitly labelled race calibration now limits mixed-class power, top speed, launch force, grip and braking. The force model no longer applies a second legacy acceleration multiplier on top of SI power. Corner planning uses the actual force envelope rather than a separate legacy grip rating.

| Car | Mass kg | Game kW | Ceiling km/h | Launch cap m/s² | Grip | Braking m/s² | Durability |
|---|---:|---:|---:|---:|---:|---:|---:|
| Formula | 800 | 144 | 162 | 10.1 | 1.20 | 13.5 | 0.78 |
| GT3 | 1320 | 224 | 159 | 9.5 | 1.19 | 14.5 | 1.30 |
| Coupe | 1420 | 248 | 164 | 9.9 | 1.15 | 13.0 | 0.95 |
| Gallardo | 1510 | 287 | 171 | 9.2 | 1.14 | 12.5 | 1.02 |
| Roadster concept | 2050 | 390 | 166 | 10.8 | 1.12 | 12.0 | 1.10 |

These are fictional competitive-race values, not manufacturer specifications. Measured geometry, mass, center of mass and suspension remain distinct. In the solo probes, Roadster has the fastest launch (3.35s to 30m/s), Gallardo the fastest straight/circuit time, and GT3 the least remaining endurance damage. Course finish spreads are about 3–6%, rather than the former straight spread of 35%. Real car certification or full rigid-body accuracy is not claimed.

Five driver skills are drawn from a separate seeded stream at each race: reaction, control, braking, ramp judgment and item judgment. They influence throttle/brake response delay (0.179–0.440 simulated seconds), steering response, line error, braking lookahead/margin, recoverable mistake frequency, ramp approach offset and item opportunity threshold/think interval. There is no driver top-speed multiplier. Profiles are independent of car and student name; labels/scores are fictional race behavior, not assessments of students. Higher scores cannot guarantee a win; different decisions can produce a worse result in a particular race.

Inventory still has one persistent held slot. Rank/deficit-aware item weights increase Nitro/Rocket/Missile/Jellyfish opportunities for trailing racers, keep every item possible and never choose a winner. All prior ownership, immunity, disruption, counterplay and cleanup rules remain. No universally weakest car or tested basis for a two-slot advantage has been established.

## Seeded comparison

Randomized vehicle-to-slot assignment and randomized starting grid; straight, production and tighter technical layouts. Thirty seeds per layout/mode, five cars, one lap: 90 equal-driver and 90 varied-driver races, all 900 car starts finishing. Equal mode disables mistakes and uses common controls to isolate vehicles. The matched first 20 seeds/layout compare 60 before/after races:

| Wins | Formula | GT3 | Coupe | Gallardo | Roadster |
|---|---:|---:|---:|---:|---:|
| Before, equal, matched 60 | 25 | 8 | 13 | 2 | 12 |
| After, equal, matched 60 | 10 | 13 | 18 | 14 | 5 |
| After, equal, all 90 | 16 | 19 | 28 | 20 | 7 |
| After, varied, all 90 | 18 | 15 | 16 | 29 | 12 |

No sampled car won half of a mode or 60% of any layout. Every grid position won. The strongest sampled car/upper-skill group was Gallardo: 11 wins in 24 starts (a small group, wide uncertainty), not an undefeated combination. This is a bounded diagnostic sample, not evidence of equal win probabilities or coverage of every classroom roster, multi-lap condition or future course/item expansion. Details and reproducible measurement harness: `scripts/measure-race3d-balance.mjs`; deterministic action/independence/odds/force tests: `scripts/check-race3d-balance.mjs`.

## Current verification

Full Astro build: zero errors/warnings, 20 existing hints, 193 canonical pages plus aliases/theme processing. All current deterministic item, strategy, disruption, vehicle contact, flight/recovery and bounded finish tests pass. Desktop and mobile reduced-motion/mute races: 24 finishers, all ten current items, no held-icon mismatches or page errors, immutable finish results and teacher Continue exactly once. Delayed models, all 15 model/item assets plus eight WAVs aborted, procedural/synth fallback race, controls, three restarts including mid-roulette/mid-burst, and one canvas/HUD passed. Intentional abort routes were removed. Performance/visual checkpoint is recorded separately before this phase is committed.

## Next authorized scope (not implemented by this balance pass)

1. Integrate the forthcoming 50-mechanic design in bounded groups with deterministic target/effect/counter/duration/reset tests. Do not count visual reskins as new mechanics.
2. Add a varied course and shared geometry-aware ramp placement restricted to clear straight run-up/deck/landing corridors; repeat contact, all-finisher and balance comparisons on that final layout.
3. Enlarge original finish bursts and distinct Nitro/rocket/cold-gas-inspired plume/cloud scale within global particle/draw/audio budgets. The cited Tesla videos have not been visually matched; no claim of copied or verified SpaceX flame hardware.
4. Review car scale/ride height, load transfer, suspension and airborne height against the revised geometry. Profile final production code and run desktop/mobile/fallback/restarts, every one of the 50 mechanics and finish/Continue regressions. Review before any further publication.

Final warm production sample (same Chrome155/GTX1060 context, 1440×900/DPR1, Medium, seed89173, 24 cars, 8s warmup/18s capture): frame p50 17.6ms/p95 18.3ms/p99 34.6ms/max36ms; callback CPU p50 10.2ms/p95 15ms; sparse GPU median6.98ms/p958.61ms; zero long tasks. Prior city sample had p50 17.6/p9518.3/p9918.7/max89.4ms, CPU9.9/14ms. Different dynamics change race paths and visible car density; this is a bounded regression check, not identical scene timing, proof of user experience or a stable60FPS claim.

Reference materialization blocker: Library `libfile_ccf064dbded481918f3c74a38def7ca7` was prepared through the supported helper; on Windows, downloaded-transfer metadata failed with `AttributeError: os has no attribute setxattr`. No access denial; no successfully materialized/inspected local reference image, no image-dependent matching yet. Independent code work can continue.
