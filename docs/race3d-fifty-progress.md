# Fifty-item racing expansion: implementation and verification

This revision extends the existing game. Fifty distinct mechanics are enabled in independent per-racer draws; held items remain until used, and consume exactly once. Category priors are offense 30%, defense 20%, mobility 25%, recovery 15%, track 10%, normalized by item weights before bounded rank/gap adjustments. Every category remains possible. Rare theft, charge and rewind use lower weights. Per-driver item RNG is separate from decision timing, impact variation and cosmetic effects. No student name or real ability selects skills, cars or winners.

## Current implementation

The original ten IDs and identities remain, including Jellyfish shockwave. Forty new handlers, original atlas pictograms, bounded world actors, status rings and paired synthesized cues are integrated. Forty different effects are not forty reskins of a speed multiplier. Ground attacks, projectile defenses, body-contact effects, force/traction changes, legal recovery and temporary validated road interactions have separate state and eligibility rules.

The fictional Shanghai/Nanjing-inspired closed boulevard is 6564.83 m with doglegs, a hairpin and return esses. Two ramps have 100 m straight run-up and 400 m unobstructed landing corridors; the same audited geometry drives rendering, wheel contact and takeoff. No Google Earth geometry or new external assets/services. Five existing licensed car representations remain: Formula concept, GT3, CarConcept coupe, Gallardo and Roadster. The scenery is stylized original architecture, not a photorealistic reconstruction.

Unilateral support permits tyres to hang over a ramp edge; limited suspension does not force all four tyres onto incompatible surfaces. Pitch/roll depend on contact coverage, approach speed, mass/inertia and load transfer. This is simplified arcade contact/attitude simulation, not an engineering vehicle solver; it does not deform the licensed body meshes or promise perfect body-volume collision on every edge.

Nitro has enlarged rearward blue-white feedback. Rocket has forward thrust plus a finite 4 m/s lift-impulse budget and bounded attitude assistance. Launch gives a mass-dependent 14–22 m/s initial upward impulse, then gravity 9.81 m/s²: tested peaks 10.63–24.67 m and airtimes 2.94–4.48 simulation seconds. White jets and low grey-white cloud sprites follow actual effect/force state. Car dimensions stay constant. The executor could not locally materialize the supplied reference image because the supported Windows helper lacks os.setxattr; this is original rendering from the parent's inspected, authored brief, not a verified exact match to that image/video.

Decorative finish explosions add larger fragments, soft puffs and expanding shock rings, preserving total global capacities of 1488 high / 432 low. Immutable finish results are recorded before the spin/burst; finished cars leave targeting/collisions. Shared extra-actor capacity is 96 (48 patches, 32 shots, 16 links). The added visual layer caps icons at 256, jets 240, cloud sprites 64/24 and eight draw calls; quality/reduced-motion limits alter rendering, never race outcomes. Audio voices/gain limiter and mute remain bounded.

## Car parameters actually used by physics

| Car | Mass kg | Power kW | Speed ceiling km/h | Grip | Braking m/s² | Durability |
|---|---:|---:|---:|---:|---:|---:|
| Qvist 2026 Formula concept | 800 | 144 | 162 | 1.2 | 13.5 | 0.78 |
| Race Car 01 LMGT3 | 1320 | 224 | 159 | 1.19 | 14.5 | 1.3 |
| CarConcept sports coupe | 1420 | 248 | 164 | 1.15 | 13 | 0.95 |
| Lamborghini Gallardo 2010 | 1510 | 287 | 171 | 1.14 | 12.5 | 1.02 |
| Tesla Roadster 2020 concept | 2050 | 390 | 166 | 1.12 | 12 | 1.1 |

Independent fictional driver skills affect reaction/steering/braking/ramp judgment/item timing, without a hidden engine-speed multiplier. One slot remains: there is no universal weakest car across conditions, so no unmeasured double-slot advantage is added. The prior 180-race comparison established varied specialist outcomes; the expanded-course 60-race regression (10 seeds × 3 layouts × equal/varied skills, randomized grids) completed every race. Formula/GT3/Coupe/Gallardo/Roadster wins were 7/5/7/20/21 overall. Every type won, but Gallardo and Roadster led this small sample. No equal-odds or universal-balance claim.

## All fifty actual mechanics

| ID | Name | Actual distinct mechanic |
|---|---|---|
| launch | Launch | Single ballistic lift impulse |
| rocket | Rocket | Sustained bounded thrust |
| boost | Nitro boost | Traction-limited rearward burst |
| bomb | Bomb | Bouncing explosive projectile |
| shield | Shield | Timed hit protection |
| banana | Banana | Owner-immune rear trap with spin |
| missile | Missile | Limited homing shot |
| shockwave | Jellyfish shockwave | Travelling multi-target jellyfish pulse |
| freeze | Freeze | Travelling cold wave |
| repair | Repair | Restore damage and disrupted control |
| bolt | Piercing bolt | Straight shot pierces two rivals |
| emp | EMP strip | Road strip suppresses boosters, not base engine |
| oil | Oil slick | Low traction while crossing a temporary patch |
| ram | Ram bumper | Next actual body contact adds one shove |
| tether | Tow tether | Short range breakable tension pulls and drags |
| jammer | Item jammer | Delay activation without deleting inventory |
| smoke | Smoke curtain | Obscure new missile target acquisition |
| decoy | Decoy pickup | Trap delays the next pickup claim |
| draftbreaker | Draft breaker | Remove followers’ drafting benefit |
| theft | Pickpocket dart | Swept skill shot steals one unused held item |
| charge | Passing charge | Actual contact passes a charge with a fixed fuse |
| deflector | Rear deflector | Short rear arc returns one shot |
| flare | Flare decoy | Divert one locked homing missile |
| grip | Grip chains | Traction floor and peel/slick protection |
| cleanse | Cleanse pulse | Clear existing debuffs without future protection |
| ghost | Ghost body | Brief body-contact immunity with safe reentry |
| interceptor | Interceptor | Destroy up to two nearby hostile projectiles |
| brace | Anchor brace | Resist impulses while sacrificing forward pace |
| dash | Side dash | Bounded swept lateral movement |
| draftcollector | Draft collector | Widen drafting cone only behind rivals |
| slingshot | Corner slingshot | Bank real cornering work for one exit release |
| airfoil | Airfoil | Air attitude assistance without lift energy |
| overdrive | Overdrive | Higher attainable ceiling without instant speed |
| clutch | Launch clutch | Grounded low-speed launch force |
| pivot | Apex pivot | Low-speed yaw response within tyre grip |
| fasttow | Fast tow | Earlier stuck rescue with a progress penalty |
| rewind | Rewind | Retrace bounded own history without refunding events |
| capacitor | Impact capacitor | One hostile hit charges delayed exit thrust |
| airbrake | Air brake | Descent drag shortens airborne overshoot |
| winch | Rescue winch | Slow shoulder reentry without forward boost |
| jack | Self-righting jack | Stationary controlled upright recovery |
| magnet | Pickup magnet | Increase same-route pickup attraction range |
| strip | Boost strip | Approved temporary shared acceleration strip |
| spring | Spring pad | Approved shared ballistic jump tile |
| sweeper | Road sweeper | Clear ground traps ahead |
| foam | Foam barricade | Soft obstacle leaving an open lane |
| beacon | Warning beacon | Hazard-aware line information |
| inverter | Pad inverter | Temporarily reverse an existing boost strip |
| reclaim | Trap reclaimer | Capture one ground trap into inventory |
| shift | Hazard shifter | Move an unoccupied trap to a safe adjacent slot |

## Acceptance evidence

- Full website build: 0 errors, 0 warnings, 20 pre-existing hints, 193 canonical pages plus aliases/theme. Twelve deterministic check commands passed: kart, vehicle, strategy, finish, flight, disruption, balance, three extra-item batches, propulsion and combined fifty-item course replay. CI runs them through check:race3d-fifty plus existing checks.
- Forty new mechanics: 44 scenario groups covering actual targets/hits, owner immunity, duration/expiry, counters, retention/consumption, rejected activations, transfer/steal rules, safe slots and cleanup. Original ten retain their working-item/counter scenarios. Forty added icons rendered in WebGL with immediate used-icon removal and zero reset counts.
- Final three 24-car course races plus one identical-seed replay: all finish, all 50 IDs drawn, 45 used naturally, remaining situational activations covered by targeted scenarios. Replayed finish order/times and item uses are identical across 0.25 s and 1/60 s frame chunks. This tests fixed-step pacing, not every browser/quality combination.
- Sixty centered wheel/ramp cases, 30,668 actual deck rays (max error 0.000337 m), 45 additional speed/edge/inertia/recovery cases. Side/front and edge-flight screenshots captured from real modules.
- Twenty-five attack-versus-no-hit counterfactual pairs, 50 shield/air-miss cases and ten boosted defenders pass. Penalties materially lose speed/time/place and then recover; no guaranteed rank change. Banana owner immunity, 6.2 s spin + 2.2 s traction recovery, and anti-chain protection remain. Bomb travel cap 6000 m, Jellyfish 1000 m. These and all durations are simulation units; normal playback is 5× wall time.
- Desktop/mobile browser full races: 24 finishers/24 decorative bursts; FIRST SPEAKER and teacher Continue exactly once, 23 remain. Desktop 118,860 and mobile 124,506 inventory-icon checks, zero mismatches/page errors. Mobile 390×844 with reduced motion/mute. Field guide has all 50 entries and five comparison rows, fits viewport and leaves Start uncovered.
- Delayed models, all car/item models and eight WAVs blocked: fallback race finishes; cameras/follow/mute/unmute and three restarts including roulette/burst pass; one canvas/HUD, zero retained added effects. Test routes removed. Native audio outputs were exercised through browser state; this executor does not claim a human listening assessment.
- Simultaneous finish stress: 24 high / 60 low / reduced-motion, exactly once, resource expiry/reset, immutable order and gain curve peak 0.881. No literal billion objects or permanent debris.

## Measured warm performance and limits

Chrome 155 headless Windows / ANGLE GTX 1060 6GB, 1440×900 actual DPR1, Medium, 24 generic racers, seed89173, 8 s warm-up + 18 s capture, cinematic ramp slow motion off. Different road geometry and car density mean this is a controlled regression comparison, not identical-scene proof or reproduction of Kai's unspecified browser.

| Metric ms | Prior balance release sample | Fifty-item candidate |
|---|---:|---:|
| Frame median | 17.6 | 17.7 |
| Frame p95 | 18.3 | 18.5 |
| Frame p99 | 34.6 | 35.8 |
| Worst frame gap | 36.0 | 36.6 |
| Callback CPU median / p95 | 10.2 / 15.0 | 11.3 / 17.9 |
| Sparse GPU median / p95 | 6.98 / 8.61 | 7.96 / 13.38 |

Final sample had zero long tasks and 121 calls / 686,284 triangles at its ending view. CPU/GPU cost increased modestly with new mechanics/visible effects; frame p95 remains near the previous sample. Stable60FPS, mobile-device performance and all possible thermal/driver conditions are not established. Existing adaptive quality/DPR and LOD remain available; intentional ramp slow-motion is separately labelled and can be disabled. No claim that lag is universally fixed.
