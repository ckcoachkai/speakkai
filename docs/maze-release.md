# Dynamite Mice at /maze/

The route publishes the v6 standalone game as a static page. Nineteen WebP atlases and the supplied Mouse Maze Mayhem MP3 are extracted into content-addressed assets; game code, controls, artwork and audio bytes are preserved. Roster names and fuse/cheese preferences remain in browser local storage.

V6 replaces random timed victims with one transferable bomb. The carrier runs 25% faster and pursues another mouse. Wall-aware contact passes the same fuse, with a one-second cooldown. The fuse defaults to 30 game seconds and can be set to 10–120 seconds in five-second steps. Changes during a race apply to the next fuse. Escape, capture, and explosion still select a speaker and pause until Continue. Fullscreen hides the editing interface and HUD; the speaker overlay and auto-hiding Pause/Exit controls remain available.

Reimport a revised approved standalone file with:

```sh
node scripts/import-dynamite-mice.mjs /path/to/Dynamite-Mice.html
node scripts/check-maze.mjs
node scripts/check-maze-regressions.mjs
node scripts/check-maze-bomb.mjs
npm run build
node scripts/check-maze.mjs --dist
node scripts/check-maze-regressions.mjs --dist
node scripts/check-maze-bomb.mjs --dist
```

The media manifest records the original source hash and each deployed asset hash. The checker reconstructs the standalone source in memory and compares its hash, so extraction cannot silently change game logic or presentation.

Release validation includes desktop and phone-sized Chromium checks, all nineteen image decodes, song playback, +1–100% cheese control, lice arrival, bomb ownership/handoffs, the 30-second selection and Continue flow, fullscreen and zoom controls. See `maze-v6-qa.md` for evidence and limitations. GitHub Pages publishes main through the normal site deployment workflow. Verify the live /maze/ route, page hash, manifest and media after the workflow succeeds.

Rollback: revert only the v6 maze release commit on the current main branch, preserving unrelated site commits, then let the same deployment workflow finish. The release receipt records the exact deployed commit and Actions run. The preceding maze baseline is `e0a2a3164c42b3c0ce3d91306e2a2b9e735cb34a`; do not reset the site to that commit because it would discard later unrelated updates.
