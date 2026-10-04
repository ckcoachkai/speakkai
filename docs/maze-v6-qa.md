# Dynamite Mice v6 — QA and review

Date: 4 October 2026. Scope: transferable bomb, adjustable fuse, focused fullscreen, and existing maze/audio/artwork regressions. Publication and live verification are recorded separately in the deployment receipt.

## Contract

- Exactly one living carrier while a race is running. Initial assignment is seeded and random.
- Carrier pursues other mice through the maze and gets one 1.25× speed multiplier, composed with cheese, lice and fear. Passing removes that bonus from the sender and applies it to the recipient.
- Swept, wall-aware contact works when either actor crosses the other. Spawn grace and handoff cooldown are one second. A pass never resets the fuse.
- Default fuse: 30 game seconds. Slider: 10–120 seconds, five-second steps. Ready changes the initial deadline; running/paused/awaiting changes future fuse durations only.
- Escape and cat movement are processed before timed fuse events in the same update. Any selection stops further outcomes until Continue. A pending fuse deadline remains pending. A selected carrier is replaced on Continue without resetting the current deadline.
- The final speaker also waits for Continue. The cat still appears at 60 game seconds.
- Fullscreen removes surrounding interface elements. A transparent speaker card and Continue remain available; Pause/Exit controls reveal on pointer, touch or keyboard activity.

## Results across five review lenses

| Lens | Evidence and result | Challenge / limit |
| --- | --- | --- |
| Rules, timing and fairness | Eight focused bomb groups pass; 12 full-rule races complete with every name chosen exactly once. Every bomb selects its actual carrier. Manual and speaker pauses freeze time, ownership and positions. Real browser 30-second and 10-then-120-second sequences pass. | Game behavior determines order. This is not a statistically uniform random picker. |
| Movement and simulation | 48 seeded regression races plus 12 full-rule races pass. Full-rule coverage uses 1/2/20/80 mice, 10/30/120-second fuses and 1%/100% cheese. Movement segments sampled at ≤0.08 cells never cross walls. Bidirectional swept passing and cooldown checks pass. A 700-attachment lice test preserves the carrier multiplier. | The 48 regression races accelerate actors and disable lice; the 12 additional races use production rules. +100% cheese can finish races before the cat arrives. |
| Presenter flow, controls and accessibility | Native fullscreen, fallback focus layout, Pause, Continue, Escape and Exit pass in Chromium. Long Unicode speaker names fit the phone card. Six widths (320/375/768/1024/1366/1920) have no horizontal overflow or HUD/canvas collision. Slider has a name, units and current value. | Phone sizing is emulated. Physical touch, screen-reader interpretation and haptics are unverified. |
| Reliability, audio and data | Browser evidence records no uncaught page errors. Empty/duplicate/script-looking names, reset confirmation, unavailable storage/media, invalid uploads, fallback score, mute, safe CSV and stale-audio guards pass. The standalone works offline with 19 image atlases and the embedded song. Forty resets show no observed DOM/listener growth after GC. | Refresh resets the race. The hosted version needs its assets for a fresh load; it is not an offline-installed app. Reset evidence is bounded, not proof of no leaks. |
| Visual quality and performance | Carrier-only bomb/countdown, last-drawn marker/name, fullscreen and transparent selection states inspected in browser. Renderer, 30-mouse/six-cat wardrobe, audio and effects suites pass. Effect counts and lice (≤520) remain bounded. Costume frame caching and deferred hosted music loading are integrated. | Dense scenes can be choppy on slow devices. No fresh v6 cross-device performance claim is made. Safari and Firefox remain unverified. |

There are **60 completed seeded race cases** in these two race suites. The 50-item inventory is a coverage/challenge checklist, not a claim that 50 independent hardware/browser tests all passed. Its deterministic invariants, core browser flows and visual presentation are supported by the evidence above; human timed-recognition trials, physical-device checks and comprehensive throttled/background audio synchronization are not fully established.

## Issues found and repaired

- Initial slider changes now set the initial deadline rather than leaving an invisible 30-second timer.
- Running/paused slider changes preserve the active fuse and clearly label the next fuse.
- Fullscreen Start/Pause/Exit controls are usable, auto-hide, and stay hidden outside fullscreen.
- HUD clocks no longer clip or overlap the maze across the six tested widths.
- Carrier marker and name render after crowds. A group-count label is suppressed when it would overlap that carrier. Upper-edge chatter flips below the mouse.
- Unicode truncation preserves whole graphemes. Loud handoff toasts were removed so the maze remains readable.

## Evidence and repeatability

Local working evidence is in `work/mouse-maze/bomb-qa/`: `QA-INVENTORY.md`, `REVIEW-REPORT.md`, `final-race-qa.cjs`, `final-race-qa-results.json`, `browser-results.json`, and screenshots. Earlier entries in the browser log intentionally preserve failures found during QA; later `initial-fuse-fixed` and `final-viewport-spacing` entries supersede them.

Canonical source is in `work/mouse-maze/src/`; the website deploys its generated standalone bundle. Local verification scripts include `bomb-engine-qa.cjs`, `review-tests.cjs`, `render-qa.cjs`, `v5-cast-qa.cjs`, `audio-qa.cjs`, `nodeeffects-qa.cjs`, and `lice-endurance-qa.cjs`. The repository keeps three checks against the actual packaged engine/media: `check-maze.mjs`, `check-maze-regressions.mjs`, and `check-maze-bomb.mjs`; all run against the deployment output in CI.

Media remain 20 unchanged files totaling 12,934,978 bytes. Hosting extracts these from the embedded standalone and checks reconstruction against its SHA-256. Hashes for the current release are in `public/maze/manifest.json`.
