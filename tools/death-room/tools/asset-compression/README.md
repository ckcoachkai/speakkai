# Runtime asset compression
Run npm ci in this directory (exact versions in package-lock.json).
Run node compress.mjs, then node lite.mjs, then node medium.mjs, then node validate.mjs, then node activate.mjs.
Inputs are original web GLBs and manifest.json.pre-fast-web backups. Originals are never modified.
compress produces lossless meshopt geometry and pixel-matched smaller textures; lite downsizes textures to max1024, uses WebP94 albedo and losslessWebP normal/roughness; medium applies standard meshopt medium quantization. activate minifiesJSON and selects fast-web paths.
Native GLTFLoader requires MeshoptDecoder. Keep shared-lite, fast-web GLTFs and their BIN files together in published assets.
