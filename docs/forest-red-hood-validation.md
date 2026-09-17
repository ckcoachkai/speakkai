# Red Hood forest validation — 2026-09-17

Status: implemented and verified locally; not published.

Base: origin/main `b546d84`. Branch: `codex/forest-red-hood`.

## Checks

- `npm run build`: 180 pages; Astro check reported 0 errors, 0 warnings, 14 existing hints.
- `node --test scripts/check-forest-motion.mjs scripts/check-forest-physics.mjs`: 16/16 pass. Covers selection, motion, all boss rigs, five crunch/punch peaks, cloth stability, 180-degree hinge recovery at multiple frame rates, gentle limits and charged fur.
- `node scripts/check-forest.mjs`: pass, including 100 unchanged voice assets and Resources links.
- `git diff --check`: pass.
- Production preview at `http://127.0.0.1:4328/forest/`: two successive selections without duplicate winners; selected child remains visible; result follows the encounter; reset and host switch pass.
- Pause/resume checked during race and encounter. Final build additionally passed a pixel-for-pixel Canvas freeze check over 500 ms, including the speaking wolf.
- Gentle mode: no additional laser events during a 10.5-second observation.
- Mobile at 390×844: no horizontal overflow; full scene and controls visually inspected. Desktop inspected at 1440×1000.
- Final physical-cloth build: a complete 30-child monkey round passed without page errors. A 120-frame sample measured median 33.3 ms and p95 37.5 ms (about 30 fps median); not a guarantee for other devices.
- Every other boss completed a full round with lasers, webs, child visibility, head recoil, pixel-exact pause, result and reset before the cloth refinement. The representative monkey round was repeated after refinement.
- Final wolf physics round reached exactly pi radians, received all five impulses, and returned upright. Canvas remained pixel-identical while paused. Gentle round peaked at 0.18 radians; final mobile screenshot at 390x844 showed no overflow.
- Existing crunch buffers decoded and were scheduled during selection. Actual speaker listening was not independently verified.

Evidence screenshots are in local `output/playwright/`: `forest-running.png`, `forest-punch-final.png`, `forest-mobile-final.png`, `forest-desktop-final.png`, `forest-30-runners.png`, `forest-other-host.png`.

## Implementation limits

This is a painted 2D character rig with an angular spring hinge, 3D particle cloth and spring-driven fur tufts. It is not a complete 3D anatomical skeleton, self-colliding cloth or individual-hair simulation. The full 180-degree hinge applies to the wolf; other bosses retain their individual recoil. Boss artwork area is multiplied by ten in world coordinates; wider camera framing reduces the on-screen multiplier. Existing character recordings are preserved, including their original jokes about eating children, while the encounter itself now shows the child punching the boss.

Latest evidence: `output/physics-performance.log`, `output/physics-gentle-mobile.log`, `output/forest-physics-build.log`, and screenshots `physics-running-refined.png`, `physics-flip-refined.png`, `physics-mobile-final.png` under `output/playwright/`. Earlier all-boss evidence: `output/boss-batch-{1,2,3}.log` and `boss-*-punch.png`.

## Publication and rollback

No remote branch push or production deployment has been performed. Upon publication approval, refresh origin/main, resolve any intervening changes, run release checks and deploy using the repository workflow. Verify the live `/forest/` interaction after deployment. Roll back with a revert of the isolated feature commit followed by the same deployment checks.
