# Green tracksuit avatars

Base avatars and skeletal animations: Copyright (c) 2020 Microsoft, [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox), MIT License. The complete copyright and license notice is in `LICENSE-Microsoft-Rocketbox.txt` and must accompany redistribution. Source commit: `0943055db6ec570bcef9f2c8b41c9e5467c808f9`.

The source [README](https://github.com/microsoft/Microsoft-Rocketbox/blob/0943055db6ec570bcef9f2c8b41c9e5467c808f9/README.md) explicitly licenses the avatar library under MIT and identifies its compatible animation collection. Original source assets are `Male_Adult_01`, `Female_Adult_01`, their body/head/hair textures, and the corresponding `m_`/`f_idle_breathe_01.max.fbx` and `m_`/`f_run_neutral.max.fbx` clips.

Original green tracksuit geometry was authored for The Death Room, guided by the user's supplied clothing reference. The models include full sleeves and full trousers, green fabric, cream shoulder/sleeve and outer-leg stripes, cuffs, a zipper seam, and a small woven normal texture. Heads and hands retain the Rocketbox source geometry and textures. The female's original denim ankle-cuff polygons were removed, its trouser hem extended, and closed dark heel caps added to complete the retained source shoes. The reference photograph is not embedded or redistributed.

The existing 80-joint HumanRig bone hierarchy and the validated `Idle` and `Run` motion are preserved. New clothing is weighted to that rig. Exported GLBs are Y-up, face +Z, and use meters. The male is approximately 1.813 m tall; the female is 1.737 m. Horizontal root travel is removed; internal rig transformations and gait height variation must remain intact. Clone each skeleton independently and place it inside an outer movement group.

Meshes are named `GreenTracksuit` and `OriginalHeadHandsShoes`. V2 uses one garment material, `Uniform_FabricPalette`, with a vertex-color palette, normal map, and roughness map. Keep vertex colors enabled and its material color white. Do not apply whole-character green tint. Participant number patches are added by the game and are not baked into these files.

## V2 additions

The jacket sleeves now share their armhole boundary vertices with the torso, replacing overlapping cap surfaces. The collar has a rolled rim and neck-weight blending. Cream reflectance is reduced, and cloth wrinkle/weave normal and roughness textures are embedded. Geometry is allocated toward smoother facial contours while keeping each complete avatar below 30,000 triangles. The male exports three material primitives; the female exports four.

The original Rocketbox `m002_head_normal.tga`, `m002_head_specular.tga`, `m002_body_normal.tga`, `f001_head_normal.tga`, `f001_head_specular.tga`, and `f001_body_normal.tga` maps were downloaded from the same pinned MIT-licensed repository. Original 2048-pixel face albedo and normals are preserved, with roughness derived from the source specular maps. Facial UV coordinates and semantic facial bone groups remain compatible. The male's problematic transparent hair cards were removed to reveal its clean textured short-hair surface.

Twelve original blend shapes were authored from the semantic facial weights: `Blink`, `eyeBlinkLeft`, `eyeBlinkRight`, `JawOpen`, `BrowFurrow`, `browInnerUp`, `mouthFrownLeft`, `mouthFrownRight`, `Scream`, `Cry`, `Fear`, and `Dead`. Their neutral defaults are zero. `expressions.json` documents tested maxima and combination rules. These targets are authored for the existing Rocketbox topology; no external facial targets or topology-incompatible expression packs were copied into the model.

Validation: the final GLBs were reimported into Blender; both models were rendered in three locomotion poses from front and back, plus facial close-ups in eight states including neutral. Sampled skinned bounds throughout both animations and 24 expression/pose combinations per model were checked for finite coordinates and deformation spikes. All 80 source joint names remain intact, all default expression weights are zero, and Idle/Run have no facial-weight channels. Browser integration separately checks number-patch fit and gameplay appearance.

## V4 material detail

Native Blender procedural skin pores, roughness variation, hand/footwear grain, fabric weave and mild clean fabric wear were authored for this project and baked into the exported GLBs. These project-authored modifications are provided under the same MIT terms; the original Microsoft copyright and license notice remain required. The editable material graphs and packed inputs are in `../uniforms/pbr-v4/material-authoring.blend`. No wounds are baked into the healthy textures. The generated head albedo atlases and identity colors were preserved.

V4 adds one bounded skinned seam-thread primitive per avatar (916 or 1,440 triangles), without altering any existing geometry, morph, skeleton or animation accessor data. Original material names and skin color factors are unchanged; the extra cloth material is `Uniform_SeamThread`. Skin and fabric detail maps are 2,048 pixels; hand/footwear detail maps are 1,024 pixels. The current hashes and validation are in the manifest and `material-validation-v4.json`.
