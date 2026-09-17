# Red Hood forest validation — 2026-09-17

Status: implemented and verified locally; not published.

Base: origin/main `b546d84`. Branch: `codex/forest-red-hood`.

## Checks

- `npm run build`: 180 pages; Astro check reported 0 errors, 0 warnings, 14 existing hints.
- `node --test scripts/check-forest-motion.mjs`: 11/11 pass. Covers random selection, frame-rate consistency, full-sized punch contact, five crunch/punch peaks, five cape states, and laser suppression.
- `node scripts/check-forest.mjs`: pass, including 100 unchanged voice assets and Resources links.
- `git diff --check`: pass.
- Production preview at `http://127.0.0.1:4328/forest/`: two successive selections without duplicate winners; selected child remains visible; result follows the encounter; reset and host switch pass.
- Pause/resume checked during race and encounter. Final build additionally passed a pixel-for-pixel Canvas freeze check over 500 ms, including the speaking wolf.
- Gentle mode: no additional laser events during a 10.5-second observation.
- Mobile at 390×844: no horizontal overflow; full scene and controls visually inspected. Desktop inspected at 1440×1000.
- 30-child roster: ran successfully, no page errors. A 120-frame sample measured median 25 ms and p95 29.2 ms on this machine/browser (about 40 fps median); not a guarantee for other devices.
- Existing crunch buffers decoded and were scheduled during selection. Actual speaker listening was not independently verified.

Evidence screenshots are in local `output/playwright/`: `forest-running.png`, `forest-punch-final.png`, `forest-mobile-final.png`, `forest-desktop-final.png`, `forest-30-runners.png`, `forest-other-host.png`.

## Implementation limits

This is a real-time 2D painted rig with procedural fur and cloth, not a complete 3D anatomical skeleton or physical hair simulation. Wolf artwork area is multiplied by ten in world coordinates; wider camera framing reduces the on-screen multiplier. Existing character recordings are preserved, including their original jokes about eating children, while the encounter itself now shows the child punching the wolf.

## Publication and rollback

No remote branch push or production deployment has been performed. Upon publication approval, refresh origin/main, resolve any intervening changes, run release checks and deploy using the repository workflow. Verify the live `/forest/` interaction after deployment. Roll back with a revert of the isolated feature commit followed by the same deployment checks.
