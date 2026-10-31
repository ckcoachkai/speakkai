# Dimensional power-ups — October 31, 2026

## Changes

- Replaced the 40 extra held-item billboards with original, genuinely volumetric miniatures. Shared beveled primitives use metal/enamel/glow materials and gentle orientation changes. All 40 types together require 15 instanced draw calls / 224 component instances; runtime limits remain bounded. The existing ten authored GLB power-ups are preserved.
- Mystery pickups now have beveled crystal shells, metallic corner studs and independently turning crystal/orbit cores.
- All 50 inventory portraits use deterministic raised enamel artwork with highlights, extrusion and contact shadows. Five-slot panels have beveled reserve frames and slot labels; mobile spacing avoids the camera controls.
- Added bounded 3D energy arcs, ice shards and rising repair crosses. Shields use a view-dependent rim with subtle energy bands; explosions use softer smoke, clearer ballistic sparks and dimensional torus shockwaves. Reduced-motion burst budgets are respected.
- Race mechanics, item probabilities, five-item ownership, ten-racer grid and classroom finish/Continue behavior are unchanged.
- No AI bitmap assets were needed: actual geometry changes shape with the view, while vector inventory art stays sharp without image downloads.

## Verification

- All 20 `scripts/check-race3d-*.mjs` checks pass, including existing fifty-item, grid, inventory-flow, disruption, finish and vehicle suites plus the three new visual/lifecycle checks.
- Full Astro build passes: 193 canonical pages, 0 errors, 0 warnings, 20 existing hints.
- All 50 portraits rasterized and visually reviewed. Browser DOM/HUD checks cover accessible slot labels, five slots, stable nodes, clear/restore and 390px narrow-screen layout. CPU Blender contact sheet of actual exported model geometry confirms all 40 miniatures are visibly volumetric and unclipped.
- New modules are cache-versioned through the game entry, UI, field guide and styles. Temporary QA fixtures are not published.

## Explicit limits

The available cloud Chrome reports WebGL disabled and cannot create a context for either the unchanged live game or the updated preview. Standalone Chromium is also blocked by the environment's local-socket sandbox. Therefore browser/GPU gameplay, real-time shader appearance, frame-time performance and physical-phone behavior were **not verified** in this pass. CPU geometry renders and shader-hook assertions are not substitutes for those checks. No audio changes or human listening claim.
