# Fictional adult cast

The eight avatars are fictional adult characters created for The Death Room. Their background labels are authored biographies and are not inferred descriptions of any real person or roster user.

Base avatar geometry, skeletons, original UV layouts and source texture content come from [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox): Avatar Copyright (c) 2020 Microsoft, distributed under the MIT license included in `LICENSE-Microsoft-Rocketbox.txt`.

The green and cream tracksuit geometry, facial expression targets, individual facial geometry/hairstyle variations and this cast manifest were authored for The Death Room. The eight head albedo atlases were individually edited with OpenAI's built-in image generation tool, using the original MIT UV atlases as layout references. No particular real-person identity was requested; each atlas was prompted as a new fictional adult. The original Microsoft copyright and license notice are preserved in the exported GLBs.

Each GLB includes its textures, the original compatible HumanRig skeleton, Idle and Run clips, and twelve named facial morph targets. All default expression weights are zero, and locomotion clips do not animate expression weights. The separate guest character 456 is not part of this cast and is not used as the face reference for these identities.

Eye openings, head silhouettes, jaw shapes, brow positions and articulated mouths vary in actual mesh geometry. Green/cream garment colors are preserved. Authored body/hair material factors match skin and hair colors; runtime integrations should preserve those factors.

The rendered contact sheets are inspection previews of the exported GLBs. Face values and proportions intentionally favor expressive gameplay readability over exact photorealism.

## V4 material detail

Native Blender procedural skin pores, roughness variation, hand/footwear grain, fabric weave and mild clean fabric wear were authored for this project and baked into the exported GLBs. These project-authored modifications are provided under the same MIT terms; the original Microsoft copyright and license notice remain required. The editable material graphs and packed inputs are in `../uniforms/pbr-v4/material-authoring.blend`. No wounds are baked into the healthy textures. The generated head albedo atlases and identity colors were preserved.

V4 adds one bounded skinned seam-thread primitive per avatar (916 or 1,440 triangles), without altering any existing geometry, morph, skeleton or animation accessor data. Original material names and skin color factors are unchanged; the extra cloth material is `Uniform_SeamThread`. Skin and fabric detail maps are 2,048 pixels; hand/footwear detail maps are 1,024 pixels. The current hashes and validation are in the manifest and `material-validation-v4.json`.
