# Resources game audit

September 16, 2026. Scope: the seven games and name pickers linked from Resources.

## Changes

- Mouse House: remove the large introductory and welcome copy; preserve the maze aspect ratio; cap cumulative cheese speed at 4x instead of unbounded exponential growth; scroll to the chase when starting.
- Ice Drop: consolidate three cascading stylesheets, compact the stage and roster, remove unused video capture hooks and GSAP, and replace three PNGs with WebP (6,434,674 to 854,524 bytes).
- Charades: lock the active student and settings during a round, handle unavailable storage, account for elapsed timer time, simplify copy and card decoration, and fit stats on narrow phones.
- Marble Picker: hold the busy state throughout scoring and inter-round delays, handle unavailable storage, collapse the detailed scoring/effect references, and constrain the board without distorting its physics coordinates.
- Wheel: prevent roster/settings mutations during a spin; honor automatic removal when dismissing with Escape; share contiguous weighted-slice geometry between rendering and winner positioning; fit the wheel inside its stage.
- Keeperfall: remove developer release audits and forecasts from the player interface while retaining core checks; fit portrait cameras; remove repeated presentation labels; correct narrow-grid overflow.
- Hungry Forest: remove duplicated introductions, zoom/debug-like copy, and repeated guidance; collapse optional character controls; preserve the native canvas aspect ratio and voice attribution.
- Shared tool shell: replace fixed height arithmetic with flex sizing, fix navigation collapse and mobile toggle overlap, and permit embedded fullscreen.

## Verification

- Production Astro build and existing forest, public-page, language, SEO, and asset-budget checks.
- All seven pages at widths 320, 390, 768, and 1440: no document horizontal overflow or page JavaScript errors.
- Browser checks for Charades scoring, undo, pause, and student locking; complete Ice Drop selection/reset; wheel selection and editing locks; Mouse House pause/result/exclusion/edit; Marble tournament completion/reset; Forest pause/result/reset.
- Keeperfall navigation, settings, 2D/3D switching, save persistence, and desktop/mobile scene screenshots.
- Nonblank 3D scene pixel variance and changing Ice Drop frames.
- 40 seeded Mouse House races, 270 Ice Drop boundary checks, weighted-wheel geometry, and a non-mutating 365-day Keeperfall release audit with no stalls.

Core regression checks run in the deployment workflow:

```sh
node scripts/check-resource-games.mjs
```

For interactive QA, run Astro on port 4325 and use Playwright CLI's
`run-code --filename` with the `scripts/qa-*.js` files added in this change.
These scripts use an isolated browser session and save screenshots under its
`output/playwright/` directory. They modify only that test browser's local game state.

The selection simulations were checked for bounded completion and roster
handling, not certified for statistical fairness or exhaustive gameplay balance.
React, Matter.js, and Three.js runtime code remains intact.
