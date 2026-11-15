# Face texture generation receipt

Mode: built-in `image_gen.imagegen`, one call, two local references viewed first. No CLI fallback and no Python image editing. The returned raster was copied unchanged to `public/assets/player456/head-albedo.png` and embedded in the GLB. The existing mesh UVs were then remapped to compensate for the generated nose/lip landmark offset.

Inputs:

1. `work/swarm/human_assets/head.png`: editable UV atlas template.
2. User-supplied photo `codex-clipboard-a2cadbd9-3929-4842-8250-c9a1218a4487.png`: appearance reference.

Prompt:

> Use case: identity-preserve. Asset type: game character diffuse head texture atlas, square 1024x1024. IMAGE 1 IS THE EXACT EDIT TARGET: a flattened UV atlas with a central face at x 0.5, hair scalp at the upper left and upper right, blank eye socket holes, neck at bottom of large head island, mouth cavity island lower left and eyeball island below left of center. IMAGE 2 is the identity/appearance reference for the middle-aged East Asian man centered foreground wearing green and cream tracksuit. Edit IMAGE 1 ONLY to reflect the reference man's face: warm light-medium East Asian skin tone, thicker straighter dark brows, subtle forehead and under-eye age lines, slightly fuller cheeks, narrow natural lips, dark brown iris, short dark nearly black hair scalp. EXTREMELY IMPORTANT: preserve IMAGE 1 UV island shapes, boundaries, proportions, locations, all black background and all facial landmark positions pixel for pixel. The nose, mouth, eye socket holes and ears must stay in exactly the same position as IMAGE 1, because this will be mapped onto an existing mesh. Texture should be flat albedo with even illumination and no directional shadows. Hair must be short nearly black textured hair only within the current hair region, preserving exact boundaries. Keep the two blank eye socket cavities in place. Keep mouth cavity and eyeball islands exactly in their existing locations; simply make iris dark brown. No jacket, no photograph composition, no 3D render, no framing, no text, no watermark; only the revised flat UV head texture atlas.

Limit: the atlas islands were preserved closely, not pixel-identically. Facial landmark offsets were corrected through mesh UVs and real renders were inspected.
