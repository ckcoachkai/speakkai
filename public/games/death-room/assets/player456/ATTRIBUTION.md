# Player 456 character

`player456.glb` is self-contained and preserves the original HumanRig skeleton and Idle/Run animation clips.

- Base avatar and animation source: Microsoft Rocketbox, copyright (c) 2020 Microsoft, MIT License. See `LICENSE-Microsoft-Rocketbox.txt`.
- Green/cream tracksuit: original project geometry derived from the final uniform male asset.
- Face: existing skinned head with small cheek, jaw and nasal geometry adjustments; the original UV atlas was adapted by the built-in image generation tool using the user-supplied appearance reference. The final head UVs were adjusted to align facial landmarks. This is an approximate game likeness, not a digital scan.
- Hair: original 3D tapered locks plus existing scalp, weighted to `Bip01 Head`.
- `reference.png`: an unchanged copy of the user-supplied reference. The base avatar MIT license does not grant rights to this reference image.
- `head-albedo.png`: generated face atlas, embedded in the GLB.

The game adds the 456 chest/back number patches at runtime.

V2 refines the original face geometry and adds five expression morphs, separate eye material, 64 eyelash fibers, 130 brow fibers, layered swept hair and a Blender-baked skin normal map. `head-albedo-v2.png` is the selected built-in image-generation texture. The prior `head-albedo.png` remains as provenance; the current GLB embeds the V2 texture. `TEXTURE-PROMPT-V2.md` records the exact two V2 image-generation prompts. The final V2 uniform garment is used without altering its source asset.

## V4 material detail

Native Blender procedural skin pores, roughness variation, hand/footwear grain, fabric weave and mild clean fabric wear were authored for this project and baked into the exported GLBs. These project-authored modifications are provided under the same MIT terms; the original Microsoft copyright and license notice remain required. The editable material graphs and packed inputs are in `../uniforms/pbr-v4/material-authoring.blend`. No wounds are baked into the healthy textures. The generated head albedo atlases and identity colors were preserved.

V4 adds one bounded skinned seam-thread primitive per avatar (916 or 1,440 triangles), without altering any existing geometry, morph, skeleton or animation accessor data. Original material names and skin color factors are unchanged; the extra cloth material is `Uniform_SeamThread`. Skin and fabric detail maps are 2,048 pixels; hand/footwear detail maps are 1,024 pixels. The current hashes and validation are in the manifest and `material-validation-v4.json`.
