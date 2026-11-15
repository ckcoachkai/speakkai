# Editable character material detail

`material-authoring.blend` contains packed source images and the native Blender procedural graphs used for the V4 maps. The graphs are saved as materials with fake users. The UV bake surface is a simple plane; the character GLBs retain their original UV coordinates and embedded maps.

The face graphs preserve anatomical normal detail, add masked pore relief, and vary oil/roughness across the forehead, cheeks and nose. Mouth and eye openings are excluded from the new pore layer. The garment graph adds a woven yarn normal, roughness variation and restrained clean wear. Hand/footwear maps retain the source normals with fine surface grain. The geometry, original face albedos and authored skin tones stay intact.

Maps use 2K resolution for faces and clothing and 1K for hands/footwear. Normal and roughness maps are non-color data; albedo is sRGB. Roughness textures use the glTF channel layout: green is roughness, blue is zero metallic. Normal details are baked at their intended strength and the GLB normal scale is one.

Project-authored procedural detail is distributed under MIT terms alongside the avatar library. Preserve the original `../LICENSE-Microsoft-Rocketbox.txt` notice. These healthy textures contain no permanent wounds; the game applies damage separately.
