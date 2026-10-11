# Generated game artwork

The final plant, zombie, racing, maze, and student atlas prompts and reference provenance are documented in [the prompt set](../artwork/PROMPTS.md). Original PNGs are preserved in that directory; online and offline copies use WebP encodings with identical dimensions and exact alpha. All atlases use four columns and three rows, with inspected crop overrides for the car sheet's taller rows.

Generated with the built-in image generation tool, with true transparent backgrounds. Chrome's browser connection was unavailable, so these were generated directly in Codex and copied into the project.

## PG candy bear

Saved asset: dist/assets/bear-pg.png

Prompt brief: A large front-facing, cute cuddly caramel plush bear head, round friendly eyes, soft fur, rosy cheeks, and a wide open mouth framed by colorful candy teeth, peppermint sweets and gumdrops. Leave the mouth cavity unobstructed for game characters. Whole head visible, isolated on transparent background, polished whimsical game artwork. No text, no children, no blood.

## R horror bear

Saved asset: dist/assets/bear-horror.png

Prompt brief: A large front-facing, photoreal ferocious zombie grizzly bear head with scarred, decayed fur, eerie pale eyes, a wide snarling open mouth, sharp bloodied fangs and dark crimson gums. Survival-horror atmosphere, detailed realistic fur and flesh, leave the mouth cavity unobstructed for game characters. Whole head visible, isolated on transparent background. No text, no people, no children.

The game adds students as separate non-graphic cartoon characters. Blood stays on the horror bear and teeth. WebP copies are embedded in the offline HTML and served as separate assets online. Students grip actual candy/tooth anchors in each image; extraction moves a polygon-clipped fragment of that same tooth from its socket. Larger classes share the finite physical anchors.

## Articulated Plants vs. Zombies characters

Garden uses original transparent part images and original animation tracks. Source, exact hashes, custom adaptations and renderer scope are documented in [Garden rig provenance](dist/assets/garden-rig/PROVENANCE.md). The generated plant/zombie atlases are retained as fallbacks.

## Garden selection poster

Generated with built-in ChatGPT Image Gen. Original output: ../artwork/garden-selection-poster.png (1448×1086). Production file: dist/assets/garden-selection-poster.webp (quality90,382208bytes; original PNG preserved). The final exact prompt and generation provenance are in [Garden selection prompt](../artwork/GARDEN-SELECTION-PROMPT.md). The game overlays the live selected name and an uninjured cartoon student portrait in the center.

## Connected lawnmower

The original multipart lawnmower uses eight exact transparent PNG parts embedded in one small manifest. Its original connected frame, wheels and engine draw together between each student and the plants. Wheels rotate and the engine vibrates during the single-use rescue sweep. See [mower provenance](dist/assets/GARDEN-MOWER.md).
