# Dynamite Mice at /maze/ — v8 release notes

The v8 standalone is prepared for the static `/maze/` route; final publication verification is still pending. Twenty WebP image atlases and the supplied Mouse Maze Mayhem MP3 are extracted into content-addressed assets; game code, controls, artwork and audio bytes are preserved. Roster names and fuse/cheese preferences remain in browser local storage.

V6 replaces random timed victims with one transferable bomb. The carrier runs 25% faster and pursues another mouse. Wall-aware contact passes the same fuse, with a one-second cooldown. The fuse defaults to 30 game seconds and can be set to 10–120 seconds in five-second steps. Changes during a race apply to the next fuse. Escape, capture, and explosion still select a speaker and pause until Continue. Fullscreen hides the editing interface and HUD; the speaker overlay and auto-hiding Pause/Exit controls remain available.

V7 added diminishing cheese gains, crushable ground insects, denser debris/maggots, and revised running/facial reactions. V8 adds a 180 ms hold-to-drag interaction for relocating a mouse, automatic recovery from local loops or immobility, red tears, attached insects with progressive anatomy damage, and a fourth `devoured` selection outcome that pauses for the speaker. The cat now reads as a slower stalk followed by faster bursts; poop temporarily slows it, while cheese speeds it with the same taper. The v8 visual pass also includes distinct labeled heart, liver, stomach, kidney, eye, foot and tail debris; browser appearance remains a release check. See `work/mouse-maze/v8-qa/REVIEW.md` for current evidence and limitations.

Reimport a revised approved standalone file with:

```sh
node scripts/import-dynamite-mice.mjs /path/to/Dynamite-Mice.html
node scripts/check-maze.mjs
node scripts/check-maze-regressions.mjs
node scripts/check-maze-bomb.mjs
node scripts/check-maze-v7.mjs
node scripts/check-maze-v8.mjs
npm run build
node scripts/check-maze.mjs --dist
node scripts/check-maze-regressions.mjs --dist
node scripts/check-maze-bomb.mjs --dist
node scripts/check-maze-v7.mjs --dist
node scripts/check-maze-v8.mjs --dist
```

The media manifest records the original source hash and each deployed asset hash. The checker reconstructs the standalone source in memory and compares its hash, so extraction cannot silently change game logic or presentation.

The deterministic v8 suites currently report 105/105 engine checks, 50/50 movement-matrix angles and 12/12 full production-rule races. All five package checks pass against both `public` and `dist`. Chromium checks cover ready/running/paused drag, outside/Escape cancellation, click-follow at 4×, explicit fullscreen Escape exit, the devoured UI result and CSV, music pause/Continue resume, Gore and reduced-motion toggles, Map, and 375px/320px no-horizontal-overflow layouts. A natural unaccelerated fullscreen 30-second explosion held exact time, actor positions and canvas screenshot bytes for 1.1 seconds; the song paused and Continue resumed while preserving fullscreen. An 80-mouse stress run with 400 cheese, 520 lice, 294 insects and 247 attached insects measured 4.13 ms mean render, 5.3 ms p95 render, 3.71 ms mean update, 4.6 ms p95 update, and 13.66 ms mean frame time. Cat verification covered 12 game seconds, 7.43 cells crossed across 9 distinct cells, 0.72–1.5× speed bursts and wall safety. The final close-zoom inspection found the anatomy labels readable; live `/maze/` hash/manifest/media verification remains pending. See `work/mouse-maze/v8-qa/REVIEW.md` for current evidence and limitations, and `maze-v7-qa.md`/`maze-v6-qa.md` for preceding releases. GitHub Pages publishes main through the normal site deployment workflow after these gates pass.

Rollback: after publication, revert only the v8 maze release commit on current main, preserving unrelated site commits, then let the same deployment workflow finish. Record the exact v8 commit and Actions run in the release receipt. The preceding v6 maze baseline is `8dfdc8492b1c3f3aaa47765a568f81cedfb5455e`; do not reset the site to that commit because it would discard later unrelated updates.
