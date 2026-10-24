# Driving audio source handoff

Eight ready-to-integrate mono 44.1 kHz PCM WAV files are in `ready/`. Original downloads and license evidence page HTML are retained beside them. `audio-manifest.json` records originals, duration, gain, measured output peak and SHA256. Decode/probe and peak checks passed; no audio was played on the host.

| Ready file | Seconds | Source / creator / license | Intended response |
|---|---:|---|---|
| engine-idle.wav | 0.864082 | domasx2, CC0 | Real generic combustion engine loop. Crossfade against load loop; ramp pitch from RPM and gear ratio. |
| engine-load.wav | 3.984739 | GGBotNet, CC0 | Generic car loop, phone recorded. Load gain follows throttle; lower pitch and damp volume on deceleration. |
| acceleration.wav | 2.965964 | GGBotNet, CC0 | Actual recorded acceleration transient. Trigger on strong throttle rise, with cooldown; do not restart every frame. |
| tire-skid.wav | 3.000000 | audible-edge (Tom Haigh), edited by qubodup, CC-BY 3.0 | Actual tire squeal loop. Gain follows lateral slip and braking slip, silent under grip threshold. |
| impact.wav | 0.583923 | qubodup, CC0 | Recorded foley collision, creator describes stapler + lock + click. Gain follows collision impulse; rate-limit repeats. |
| suspension-thud.wav | 0.980658 | GGBotNet, CC0 | Real car hood close repurposed as landing body thud. This is foley, NOT a recording of suspension travel. |
| mechanical-click.wav | 0.442245 | GGBotNet, CC0 | Actual parking-brake mechanism. Optional quiet shift click; NOT an actual recorded gear shift. |
| pressure-release.wav | 1.846145 | bart, CC0 | Steam hiss. Optional short turbo/blowoff release texture; NOT a real turbo recording. |

No verified EV/F1/supercar/monster-truck-specific recordings were found in this bounded pass. Class variations can use honest artistic pitch/EQ/layer choices; do not describe generic sources as recordings of those models. Likewise, deceleration is achieved with engine RPM/load envelopes, not an alleged separate deceleration recording. Direct-source engine loops from domasx2 differ only in pitch; only the base loop was downloaded, avoiding redundant payload.

## Source URLs and attribution

- domasx2: https://opengameart.org/content/racing-car-engine-sound-loops ; direct original https://opengameart.org/sites/default/files/loop_0.wav ; license https://creativecommons.org/publicdomain/zero/1.0/ . Creator states these were remade from a public-domain car recording (clarified in page comments).
- GGBotNet: https://opengameart.org/content/car-sound-effects-pack-low-quality ; direct archive https://opengameart.org/sites/default/files/car_sound_effects_pack.zip ; CC0 https://creativecommons.org/publicdomain/zero/1.0/ . 13 actual car recordings captured with a phone, original OGG at 64 kbit/s. The small complete 176 kB archive is retained.
- **Required attribution if tire-skid is distributed:** "Car tire squeal skid loop" by audible-edge (Tom Haigh), loop edit by qubodup, licensed CC BY 3.0, https://opengameart.org/content/car-tire-squeal-skid-loop , https://creativecommons.org/licenses/by/3.0/ . Modification here: resampled from 96 kHz/24-bit mono to 44.1 kHz/16-bit mono, level adjusted. Direct original https://opengameart.org/sites/default/files/tires_squal_loop.wav . Preserve this credit in visible game credits/documentation.
- qubodup: https://opengameart.org/content/crash-collision ; direct original https://opengameart.org/sites/default/files/qubodup-crash.ogg ; CC0 https://creativecommons.org/publicdomain/zero/1.0/ . Own recordings only, according to creator.
- bart: https://opengameart.org/content/steam-release-sounds ; direct archive https://opengameart.org/sites/default/files/steam_hisses.zip ; CC0 https://creativecommons.org/publicdomain/zero/1.0/ . Attribution appreciated by creator. 622 kB complete archive retained.

Reviewed/downloaded 2026-10-24. This handoff modifies only `work/race3d-items-ramps/driving-sounds/sources`; it does not itself modify game code or prove live playback.
