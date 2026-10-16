# Original garden giants

Three original creature designs were generated with ChatGPT Image Gen for SpeakKai Garden. They are not extracted Plants vs. Zombies characters:

- **Mossbell Colossus** — a moss-covered stone and fungus giant with hanging bell teeth and a glowing eye.
- **Bramblecrab** — a broad root-and-bramble crab with crystal pincers, thorny plates and flowers.
- **Scrapjaw** — a haunted garden-tool automaton assembled from watering cans, shears, roots and a glowing chest lantern.

Browser generation was unavailable during this run, so built-in image generation supplied the transparent source. The complete original is preserved byte-for-byte at `outputs/artwork/garden-giants-original.png`. Its SHA256 is `7854a41e7d32b8752fa575da4f99e82ab4a84161c39f447719a94b0bdeb9051b`.

## Runtime assets

| File | Details |
| --- | --- |
| `garden-monsters.webp` | 1032×384 transparent atlas,151,074bytes total for all three figures, WebP quality78 |
| `garden-monsters.json` | Whole-figure rectangles, feet, visible-body bounds, identity names and provenance; embeds the WebP as a data URL |
| `games/garden-monsters.js` | Loader, five HP appearance stages, hit/bite feedback, whole-silhouette motion and procedural fallback |

WebP SHA256: `9fe8445549145d649f14eb047cf28117b2b4aa14b29a5cab4c57cc71277a583a`.

The original PNG is1983×793. Its silhouettes extend across fixed one-third gutters, and faint1–8alpha edge pixels join the figures. Packaging therefore finds the three substantial alpha components above8, assigns their faint edge pixels without overwriting those components, then assigns isolated faint specks to the nearest figure. **All1,024,336nonzero-alpha source pixels are assigned exactly once.** Extracted source pixels retain their original RGBA values. No details are repainted, limbs invented or backgrounds replaced. The game atlas is subsequently resized and compressed, so its pixels are not claimed to be lossless copies of the high-resolution original.

Each whole figure has16px transparent atlas gutters. `bodyBounds` records the substantial silhouette separately from faint generated halo padding. All three bodies therefore normalize to370logical pixels high and stand at their own actual ground baseline, even though the crab is wider and the source includes faint specks above it. The full atlas cell is drawn; no limb or head rectangles are cut from a body.

## Renderer API

```js
import {createGardenMonsters, GARDEN_MONSTER_TYPES} from './garden-monsters.js';
const monsters = createGardenMonsters({artwork});
monsters.draw(ctx, {
  id: 'mossbell', x, y, scale, time, hp, maxHp,
  hit: 0, bite: 0,
  clip: {x: enemyLeft, y: laneTop, width: enemyWidth, height: laneHeight}
});
monsters.destroy();
```

`x/y` are the foot origin in the caller's canvas coordinate space. `scale` is the engine's enemy scale. `GARDEN_MONSTER_TYPES` exports immutable `mossbell`, `bramblecrab` and `scrapjaw` metadata, each with logical height370; regular zombies have logical height112, giving a3.30×relative height. The engine can make regular enemies smaller in the compact view so each giant still fits its lane and all six rows remain visible.

`draw` also accepts `type` as a string or an object with `id`/`monsterId`, and accepts a direct `monsterId`. Health is divided by maxHp to choose the five appearance stages. Those stages change brightness/saturation and add small botanical/metal cracks without ever changing the figure's identity or atlas cell. Hit/bite values are0..1. Whole-silhouette breathing, sway and a small bite lean preserve the generated figure's connections. These are visual motions, not a claim that the generated bitmap contains a full skeletal limb rig. The original procedural loading/failure fallbacks have separately attached limbs with small joint rotations.

Optional `clip` is applied before the monster's translation so it protects the student/name region. Optional `fitWithinClip:true` may reposition/fit the visual inside that region; it defaults tofalse so the engine controls lane placement. Engines own health, spawn rarity, collision, damage, rewards and outcomes. This renderer neither reads nor advances combat RNG and cannot force a player to lose.

Runtime loading reads `artwork.gardenMonsters || 'assets/garden-monsters.json'`. Offline builds pass `artwork.gardenMonstersManifest`. Since the manifest embeds the compressed image, the offline build needs no separate image-path rewrite. `getState()` exposes loading/ready/error, loaded identity keys, image dimensions and bitmap/fallback draw counters, without exposing image bytes. `destroy()` cancels pending fetches, clears image handlers and releases references. Original procedural fallback silhouettes remain available during loading or after a reported asset error.

## Verification

- Source original copied with matching SHA256; all source nonzero-alpha pixels assigned once before scaling/compression.
- The decoded WebP is transparent and1032×384; its exact bytes match the manifest's embedded image and provenance hash.
- The local repacked preview was visually inspected: each creature retains its full silhouette, and the crab's pincers contain no neighbour parts.
-324renderer fixture cases passed across three identities, multiple scales/times and five HP stages. Checks cover stable full-cell identity, finite transforms,3.30×logical sizing, enemy-region clipping, no combat RNG, missing-image fallback, invalid-frame rejection, repeated cleanup and destruction during load.

This is original generated artwork and a focused browser renderer. Its motion and damage treatment are SpeakKai visual effects, not original PvZ mechanics or retail-game parity.
