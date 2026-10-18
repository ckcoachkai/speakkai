# Living garden update — 18 October 2026

## Motion, not duplicate frame inflation
- Troopers: six articulated actions (walk, kneel, aim, fire, reload, react), 48 phase samples per action with continuous interpolation and generated textured armor parts. Rifle muzzle coordinates drive both flash and projectile origin.
- Clone defenders retain 120 articulated poses: 60 walking and 60 overhead sword-slam poses. Multiple clones retain separate progress and complete their first swing before defeat.
- Ten mecha configurations use separate textured torso, head, shoulder, arm, hand, hip, leg, foot, weapon and pack components. They track targets, recoil and release bombs. These share generated base armor with distinct packs/proportions/trim, not ten exact official kit replicas.
- Ten animals use 96 interpolated motion phases for breathing, head, gaze, ears, paws and tails. Winner dancers retain full-body joint animation.
- Plants and ordinary zombies preserve their original continuously interpolated joint tracks, now with 160 ms transitions into shooting/biting. Native source tracks contain 13–39 poses, not 100 original drawings. Wall-nuts remain stationary.
- Large creatures with sparse source animation use a connected 96-pose texture mesh for gait, anticipation and recoil. Dense native animations and pixel art retain their original animation. A per-frame budget limits mesh work in crowded scenes.
- Presentation runs on wall time so the 100× simulation does not turn every animation into a flicker.

## Real combat abilities
Zeus: 1.15 s marked lightning warning, 70 plant damage. Pikachu: same telegraph, 45 damage. Both select living plants in their own lane. Gandalf: traveling fireball, 55 direct damage and 18 damage within a small 0.055 normalized lane radius. Hello Kitty: traveling hearts, 8 damage. Clowns may blink a short distance when a projectile approaches; cooldowns and a bounded destination prevent constant invulnerability or teleporting through the animal.

The mower is an independent breach barrier. Entering clones behind the animal cannot draw zombies offscreen. After the mower is spent, zombies stop at the animal and bite until zero HP selects that player.

## Artwork and sound
Mecha and trooper body-part atlases and mechanical toy crawler sprites were generated with the built-in image-generation tool. The crawler is explicitly a manufactured robot toy, not a realistic infant. Six-stage cartoon animal damage remains unchanged.
Pikachu uses 18 native transparent frames from the official Pokémon_JPN sticker https://giphy.com/stickers/pokemon-jpn-transparent-pokemon-deliciousdaywithpokemon-RSzP9hF9kFvgkcozx9/ . The source remains third-party copyrighted art; no separate redistribution license is claimed. Native colors and frame timing retained.
New combat sounds are original layered Web Audio effects, with per-shot rifle sounds, charging tones, lightning thunder, fireballs, hearts and teleports. A compressor limits stacked audio peaks. Lawnmower stays silent. Screen flashes are subtle, rate-limited and disabled for reduced-motion.

Generated asset prompts and original outputs are retained locally in the work folder and Codex generated-images directory. Full mecha part provenance: GARDEN-MECHA-RIG.md.
