# Dynamite Mice at /maze/

The route publishes the approved standalone v5 game as a full-screen static page. Nineteen WebP atlases and the supplied Mouse Maze Mayhem MP3 are extracted into content-addressed assets; game code, controls, artwork and audio bytes are preserved. Roster names and preferences remain in browser local storage.

Reimport a revised approved standalone file with:

```sh
node scripts/import-dynamite-mice.mjs /path/to/Dynamite-Mice.html
node scripts/check-maze.mjs
npm run build
node scripts/check-maze.mjs --dist
```

The media manifest records the original source hash and each deployed asset hash. The checker reconstructs the standalone source in memory and compares its hash, so extraction cannot silently change game logic or presentation.

Release validation includes desktop and phone browser checks, all nineteen image decodes, song playback, +1–100% cheese control, lice arrival, the 30-second selection and Continue flow, and zoom controls. GitHub Pages publishes main through the normal site deployment workflow. Verify the live /maze/ route and manifest after the workflow succeeds.

Rollback: revert the maze publication commit on the current main branch, preserving later unrelated site commits, then let the same deployment workflow finish. This release adds a route; existing pages are unchanged.
