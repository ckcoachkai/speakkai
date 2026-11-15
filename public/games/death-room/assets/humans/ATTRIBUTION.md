# Human avatars and animation

Copyright (c) 2020 Microsoft. Licensed under the MIT License; the full notice is included in `LICENSE-Microsoft-Rocketbox.txt` and must accompany redistribution.

These models are derived from the [Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox), pinned to commit `0943055db6ec570bcef9f2c8b41c9e5467c808f9`. The source [README](https://github.com/microsoft/Microsoft-Rocketbox/blob/0943055db6ec570bcef9f2c8b41c9e5467c808f9/README.md) explicitly states that the avatar library is released under MIT and identifies the included compatible animation library. The source [license](https://github.com/microsoft/Microsoft-Rocketbox/blob/0943055db6ec570bcef9f2c8b41c9e5467c808f9/LICENSE.md) is MIT.

Source files:

- `Assets/Avatars/Adults/Male_Adult_01/Export/Male_Adult_01.fbx` and its `m002_body_color.tga`, `m002_head_color.tga`, `m002_opacity_color.tga` textures.
- `Assets/Avatars/Adults/Female_Adult_01/Export/Female_Adult_01.fbx` and its `f001_body_color.tga`, `f001_head_color.tga`, `f001_opacity_color.tga` textures.
- `Assets/Animations/all_animations_max_motextr_static/m_idle_breathe_01.max.fbx` and `f_idle_breathe_01.max.fbx`.
- `Assets/Animations/all_animations_max_motextr_xy/m_run_neutral.max.fbx` and `f_run_neutral.max.fbx`.

Modifications: converted FBX avatars to GLB; retargeted and baked compatible skeletal motion into `Idle` and `Run` clips; removed horizontal root travel so the game controls movement; retained gait height variation; embedded color textures at 1024 × 1024; used rough nonmetallic materials and alpha masking for hair. This does not imply endorsement by Microsoft or the original creators.

Both models use meters, Y-up, and face +Z. Use `SkeletonUtils.clone` to give each participant an independent skeleton. Preserve the model hierarchy and animate it inside an outer placement group. The male is approximately 1.823 m tall and the female 1.737 m. Root animation includes internal rig transforms, including the source centimeter conversion; do not independently strip those transforms. The body material includes some exposed skin as well as clothing, so strong whole-material tinting changes skin color too.

Validation: each final GLB was imported back into Blender, both clips were rendered and visually inspected, and sampled skinned bounds across both clips were checked for finite coordinates and deformation spikes. Three textures, one skin, and 82 nodes are embedded in each file. Male: 4,803 exported vertices, Idle 2.7667 s, Run 0.8 s. Female: 5,563 exported vertices, Idle 2.7 s, Run 0.8667 s.
