# Player 456 V2

The dedicated character preserves the original HumanRig and native scale. The 456 patches remain owned by the runtime character module.

- GLB SHA256: `b26eb4daa9ea3145b8b5463d2b7b177194f6755047109c5e43e94173f6b84034`.
- 8,442,860 bytes; 72,559 triangles; 80 joints; 5 embedded images; Idle and Run clips.
- All five morph defaults are zero. Neither locomotion clip contains expression weight channels.
- Morph targets on the head and brow/lash meshes: `Blink`, `JawOpen`, `BrowFurrow`, `Scream`, `Cry`.
- Validated ranges: Blink 0–1, JawOpen 0–0.7, BrowFurrow 0–1, Scream 0–1, Cry 0–1. Use Scream or JawOpen as the primary jaw expression rather than adding their full values together.
- Eye/head bones: `Bip01 Head`, `Bip01 LEye`, `Bip01 REye`.
- Final V2 GreenTracksuit copied from the uniform owner's frozen garment; its vertex color, woven normal and roughness materials are retained.

Checks used the exported GLB imported into a fresh Blender scene. Fifty sampled poses/expressions passed finite geometry, dimensions and hair attachment checks. The skin normal map is nonflat and embedded. Front, three-quarter, running, blink, jaw, brow, scream and distressed renders were inspected. Motion comparison and facial expression previews were rendered from the exported GLB.

The refined face is an approximate reference-informed likeness. Close-up film-quality facial fidelity and full performance capture were not established. Final in-game lighting and reaction integration are coordinator-owned checks.
