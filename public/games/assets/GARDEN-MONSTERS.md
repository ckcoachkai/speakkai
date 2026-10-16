# Animated garden cameos

The picker includes the user's requested Labubu, Niu Lai (牛来), Rubber Duck, Mummy, Hello Kitty, Ultraman, Team Rocket, Pikachu and Dog Man lineup. These are custom Canvas illustrations of the characters, not official game sprites or extracted animation clips. Niu Lai refers to the calf from the 2026 film, as clarified by the user and checked against its [film listing](https://www.imdb.com/title/tt44146991/).

## Size and visibility

Ordinary zombie size is restored to `clamp((laneHeight-4)/113,0.20,1)`. Students and plants do not shrink to make room for a giant. Normal bodies use112logical pixels; the cameos use370, about3.30times taller at the same scale. Giants span multiple lawn rows in a shared enemy layer. The game may limit a giant only when the entire visible arena is shorter than its full body, never to fit one row.

Giants render before ordinary enemies, students, defenders and name tags, so foreground actors remain readable. The topmost rows shift a giant's visual foot downward when needed to keep its head onscreen. A ground marker and tether preserve the actual target lane. Combat continues in that lane and does not turn the giant into a multi-row automatic wipe.

## Connected animation

`games/garden-cameos-a.js` draws Labubu, Niu Lai, Rubber Duck and Mummy. `games/garden-cameos-b.js` draws Hello Kitty, Ultraman, Team Rocket, Pikachu and Dog Man. `games/garden-monsters.js` coordinates the rigs and maintains presentation-only draw counts.

Each rig draws connected body parts separately, with independent knees, elbows, feet, ears, tail, wings or clothing as appropriate. Deterministic time drives walking, blinking and attacks; damage gives flinches and five non-graphic wear stages, and defeat folds the joints into a collapse. The renderer never consumes combat randomness, changes health, selects a player or modifies spawn timing.

The cast retains recognizable shapes and colors: Labubu's long ears and toothy cream face; the golden calf's horns and muzzle; the duck's bill, webbed feet and wings; trailing mummy bandages; Hello Kitty's red bow; Ultraman's crest and chest timer; Team Rocket's uniforms and trio; Pikachu's cheeks and lightning tail; Dog Man's dog head and police uniform.

## Combat

All nine appear uniformly within rare later-wave giant spawns, under the existing one-live-giant-per-lane limit. Each has fixed health, armor, speed, bite strength and cadence. Identity stays constant through damage and armor loss. No deadline or scripted giant determines the next speaker. The actual first student whose HP reaches zero still supplies the exact stable ID to speaking history.

## Archived artwork

The prior three generated silhouettes are preserved in `garden-monsters.webp` and `garden-monsters.json`, with the high-resolution source in `outputs/artwork/garden-giants-original.png`. They are no longer loaded by the game or embedded in the offline build. The current cameo animation is implemented in code rather than by wobbling those static images.
