# Garden visual assets and effects — October13 update

`garden-extra.json` adds four original plant rigs and shared projectile/particle images. `garden-rig/manifest.json` remains unchanged at1,626,395bytes, SHA256 `a6836ee0cd60c74725dfc5d8c87c15594b8e80dd5ff2d5b19a61e81d45df6c92`. All source PNGs remain their original bytes; the extra pack contains embedded PNG data URLs rather than external image requests.

## Source and extraction

Original artwork and animation tracks come from [FregD156/PvZ_Assets](https://github.com/FregD156/PvZ_Assets/tree/8ba94e95cfe7d0de5682f8258d3b932dbdac885c), pinned commit **8ba94e95cfe7d0de5682f8258d3b932dbdac885c**. Each asset records its exact repository path, Git blob SHA, byte length, original dimensions, alpha bounds and embedded URL. New PNG downloads were independently checked using the Git blob hash of the decoded bytes. Local source originals are retained in `work/rig-extra-images/` and the four unmodified `.reanim` files in `work/rig-source/`.

The extra pack has **52 image records**, including **46 newly downloaded PNGs totalling152,054bytes**, and six reused original parts from the existing pack. It is348,747bytes as uncompressed JSON. It preserves independent body, eye, leaf, basket, fire, soil and stem tracks with inherited keyframes. Actor parts are drawn as complete transparent PNGs with their individual affine transforms; there is no rectangular slicing of a full-body sprite. Source bounds record the entire animation so long catapult motions remain inspectable.

| New rig | Exact original animation source | Browser behavior |
| --- | --- | --- |
| `potato` / `potatomine` | [PotatoMine.reanim](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/reanim/PotatoMine.reanim) | Buried pose, rising independent parts, armed mine and original mashed pose |
| `cherrybomb` / `cherry` | [CherryBomb.reanim](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/reanim/CherryBomb.reanim) | Original two-cherry body/eye/mouth/leaf tracks; inflate sequence is held at its fuse phase |
| `torchwood` | [Torchwood.reanim](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/reanim/Torchwood.reanim) | Original wood, face, flame and spark tracks |
| `wintermelon` | [WinterMelon.reanim](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/reanim/WinterMelon.reanim) | Actual original Winter Melon parts, basket and icy projectile; same planted world scale as ordinary Melon-pult |

Winter Melon now uses its own source artwork. The earlier rule-document note about reusing a blue-tinted Melon-pult rig describes the previous implementation and is superseded by this update.

## Planted blockers and legacy names

The original [Wallnut.reanim](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/reanim/Wallnut.reanim) `anim_face` frames43–55 include a full360° rotation. Looping that sequence for a planted defender made the Wall-nut spin. The renderer now holds its upright first pose for planted Wall-nut and the custom Chestnut variant. Tall-nut also holds its original planted pose. Original cracked damage images still change independently of the stationary silhouette.

Picker IDs are retained for compatibility while their artwork follows the corresponding original weapon: `fire`→Repeater, `laser`→Gatling Pea, `thorn`→Cactus. Repeater and Gatling retain their normal original green artwork, without the previous artificial flame or blue laser filter. A real Torchwood-converted fire pea is a separate projectile kind `fire`; its fallback flame effect is documented below. Chestnut remains a custom cosmetic/gameplay extension.

## Plant rendering states

The existing renderer API remains `createGardenRenderer({artwork})`, with local plant-foot coordinates and `drawPlant(ctx,{weapon,time,simTime,hp,maxHp,recoil,seed,defender})`.

- Potato Mine: `defender={armed,armingAge,armDelay:15,riseDuration:19/18,exploding}`. `armingAge` is seconds since planting. Before armDelay it holds the buried original pose; during the rise period it traverses the original rise keyframes; `armed:true` selects the armed clip. `armProgress:0..1` is also accepted as total progress over armDelay+riseDuration when armingAge is absent. `exploding:true` selects the original mashed pose.
- Original Potato Mine `anim_rise` spans frames1–19:19frames. At the source's18fps playback rate this gives **19/18≈1.05556s**, following the source1500-tick countdown. The resulting reference arming duration is approximately16.05556s, with simulation-boundary variation. [Plant initializer](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L317), [rise playback](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L1144).
- Cherry Bomb: `defender={fuseAge,fuseDuration:1,exploding}` traverses the original inflate sequence with a clamped fuse fraction. `exploding:true` hides the intact plant so the engine's explosion can take over. This timing treatment is a browser adaptation of the original tracks.
- Torchwood: the original idle flame/face tracks loop at the recorded rate. Projectile conversion and damage stay in the engine.
- Winter Melon: original idle/shoot tracks use the existing recoil parameter. Full shoot extents are retained; actor clipping should be board-wide rather than per-lane.

Runtime extra-pack loading uses `artwork.gardenExtra || 'assets/garden-extra.json'`. Offline builds supply `artwork.gardenExtraManifest`. The extra pack merges into the renderer's own manifest copy and never mutates the supplied original base object. An optional extra-pack failure reports `extraError` while keeping existing base rigs available. `getState()` includes `extraLoaded`, ready parts and rig keys. `destroy()` cancels requests and releases pending image handlers.

## Shared projectile and melon-impact API

Import `createGardenFX` from `games/garden-fx.js`.

```js
const fx = createGardenFX({ artwork });
fx.drawProjectile(ctx, { kind, x, y, scale: plantScale, time, progress, rotation });
const impact = fx.createMelonImpact({ x, y, row, lane, kind: 'melon', seed: visualId });
fx.drawImpact(ctx, impact, { x, y, scale: plantScale, age: elapsedSeconds });
fx.destroy();
```

Projectile x/y are the **center** in engine/canvas coordinates. `scale` is the same outer scale used for the plant/lawn, not a raw tile width. Supported kinds are `pea`, `snow`, `kernel`, `butter`, `melon`, `wintermelon`, `spike`, and `fire`. Aliases include frost→snow, catapult→melon, splash→kernel, and pierce/cactus→spike. Rotation is optional radians; lobbed fruit defaults to a visual spin driven by progress. The engine owns the actual trajectory and collision.

The corresponding original PNG is drawn whole. Logical projectile size incorporates the source [Projectile::Draw scale](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Projectile.cpp#L971) and existing source-to-72px-plant normalization:

| Kind | Original PNG | Raw size | Logical size at scale1 |
| --- | --- | --- | --- |
| Pea | `images/ProjectilePea.png` | 28×28 | 28.20×28.20 |
| Snow | `images/ProjectileSnowPea.png` | 28×28 | 28.10×28.10 |
| Kernel | `reanim/Cornpult_kernal.png` | 21×22 | 17.36×18.19 |
| Butter | `reanim/Cornpult_butter.png` | 49×50 | 34.12×34.82 |
| Melon | `reanim/Melonpult_melon.png` | 55×48 | 38.27×33.40 |
| Winter Melon | `reanim/WinterMelon_projectile.png` | 55×48 | 38.27×33.40 |
| Spike | `images/ProjectileCactus.png` | 30×16 | 25.82×13.77 |

Kernel uses original drawing scale.95, butter.8, ordinary/icy melon1.0; the further rig normalization fits the browser scene. These are visual sizes rather than changes to combat hitboxes. Ordinary peas, paired Repeater shots and Gatling bursts all use the same whole green pea sprite.

Melon impact uses the original [Melonpult_particles.png](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/images/Melonpult_particles.png) and [WinterMelon_particles.png](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/images/WinterMelon_particles.png). These are authored **nine-cell particle atlases**, including distinct red flesh, green rind and small droplets. Their dimensions are334×37, with integer37px cel width and one unused padding column. Cel selection is deliberate sprite-sheet rendering, not slicing a character body.

The original [melon emitter](https://github.com/FregD156/PvZ_Assets/blob/8ba94e95cfe7d0de5682f8258d3b932dbdac885c/particles/melonimpact.xml) requests15 fragments and nine image frames. The shared effect also creates15 fragments, initially shows the full fruit with a crack overlay, sends original flesh/rind cells outward, then leaves ground juice. Ballistics, crack choreography, ground stains, icy juice colors and the three-second stain duration are **browser visual extensions**, not claims to reproduce PopCap's full particle-system implementation. No human blood or body parts are used.

`createMelonImpact` uses a private deterministic generator seeded by a stable visual ID. It never calls `Math.random()` or accepts/advances the engines' combat generator. Rendering depends only on the impact object and age, so the same seed/age gives the same pieces. The helper stores no impact list; each engine owns and removes its own expired objects. `drawImpact` returnsfalse after three seconds. Fragments stop drawing after.9s while juice persists. The factory loads only the nine FX images from the pack and releases them on destroy. Visible procedural fallbacks work while those images load or when an image fails.

Standalone named `drawGardenProjectile`, `createMelonImpact` and `drawMelonImpact` are also exported; without the factory's supplied images they draw documented procedural fallback shapes. Original fireball artwork is particle-driven rather than a whole PNG in this pack, so the fire kind uses a procedural flame envelope around a tinted original pea. It does not change the original colors of the legacy Repeater/Gatling plants.

## Verification

- Existing renderer regression:3,264cases passed, covering complete independent parts, finite transforms, animation bounds, stable football torso/armor identity, foot motion and cleanup.
- New extra-pack/FX regression: all52 embedded PNG blob hashes matched;235combined renderer parts and nine FX images loaded in the mock fixture. Planted Wall-nut/Tall-nut/Chestnut matrices stayed identical across time at all five damage stages. New original rigs rendered without actor slicing. Mine buried/rising/armed states, actual Winter Melon images, and legacy ID mappings were checked.
- Effects passed deterministic-seed, scale-ratio, authored-atlas bounds, no-combat-RNG, ground-stain lifetime, failed-image fallback, mid-load destroy and repeated cleanup checks. Tests were run with `Math.random()` replaced by a throwing function during effect creation and rendering.
- Root browser review reported235original parts/nine FX images loaded without errors; nuts remained upright after18s, original new rigs were connected and full projectiles looked correct. `work/garden-vfx-review.html` provides live and held impact phases for screenshot inspection; it is QA-only and excluded from production publication.

The source is reconstructed/original-asset reference material; the browser remains a classroom/playable adaptation with its own UI, scene scaling, effects choreography and wave rules. This update makes no assertion of retail binary parity.
