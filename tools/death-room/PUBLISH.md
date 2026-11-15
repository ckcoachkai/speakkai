# Published Death Room

Source is retained in this directory; runtime assets are in ../../public/games/death-room/assets.
To rebuild, run npm ci, copy the runtime asset directories to public/assets locally, then npm run build -- --base=/games/death-room/. Copy generated files to ../../public/games/death-room without source .blend files. Preserve third-party notices.

Performance release: DPR capped at 1.5, 2048 shadow maps, 30 Hz shadow/HUD updates, anisotropy 8, hidden-tab suspension. Controlled headless Edge preview at 1280x720 DPR2 with nine actors measured 27.3 FPS before and 52.5 FPS after (six seconds each); this is not an all-device guarantee. Subpath smoke covers all ten previews and one start/reveal/reset cycle, with zero browser errors or asset failures.
