# Shanghai Flight Lab material texture pack

Sources and licences verified October 11, 2026. These are real downloadable PBR material assets from **Poly Haven**, not newly generated facade patterns. They are generic surface references; they are not photographs of the specific Shanghai buildings, roads or trees shown in the simulator.

Poly Haven publishes its downloadable textures, HDRIs and models under [CC0](https://polyhaven.com/license), including permission to modify and redistribute the assets in commercial and non-commercial products. The [CC0 legal text](https://creativecommons.org/publicdomain/zero/1.0/) defines the licence. Credit is retained here even though attribution is not required by CC0. No account, payment or private API key was used.

## Materials

| Browser family | Original asset | Author | Source tile dimensions | Delivered maps |
| --- | --- | --- | --- | --- |
| Concrete pavement | [Concrete Pavement](https://polyhaven.com/a/concrete_pavement) | Charlotte Baglioni | 1.8 × 1.8 m | 1024 px albedo; 512 px GL normal; 256 px roughness |
| Weathered masonry | [Red Brick 03](https://polyhaven.com/a/red_brick_03) | Rob Tuytel | 1 × 1 m | 1024 px albedo; 512 px GL normal; 256 px roughness |
| Asphalt road | [Asphalt 02](https://polyhaven.com/a/asphalt_02) | Rob Tuytel | 3 × 3 m | 512 px albedo; 512 px GL normal; 256 px roughness |
| Weathered roof | [Grey Roof Tiles 02](https://polyhaven.com/a/grey_roof_tiles_02) | Rob Tuytel | 1.5 × 1.5 m | 1024 px albedo; 512 px GL normal; 256 px roughness |
| Tree bark | [Bark Platanus](https://polyhaven.com/a/bark_platanus) | Dimitrios Savva | 1.5 × 1.5 m | 512 px albedo; 512 px GL normal; 256 px roughness |
| Grass / soil ground | [Grass Ground](https://polyhaven.com/a/grass_ground) | Charlotte Baglioni | 2.51 × 2.51 m | 1024 px albedo; 512 px GL normal; 256 px roughness |
| Pale weathered wall | [White Plaster Rough 01](https://polyhaven.com/a/white_plaster_rough_01) | Rob Tuytel | 1 × 1 m | 512 px albedo; 512 px GL normal; 256 px roughness |
| Broadleaf colour / opacity | [Tree Small 02](https://polyhaven.com/a/tree_small_02) | Rico Cilliers | Original model foliage UV atlas; not a seamless surface tile | Isolated 256 px leaf colour and matching alpha mask |

The seven seamless surface sets follow Poly Haven's [photo-based texture standards](https://docs.polyhaven.com/en/technical-standards/textures). The foliage is an official model texture atlas; it is described here as a model texture, without claiming that it documents a Shanghai tree or that every atlas element is a raw camera photograph. The complete high-polygon tree model was not downloaded or embedded.

## Files and processing

The local texture directory contains:

```text
assets/textures/concrete-{albedo,normal,roughness}.jpg
assets/textures/masonry-{albedo,normal,roughness}.jpg
assets/textures/asphalt-{albedo,normal,roughness}.jpg
assets/textures/roof-{albedo,normal,roughness}.jpg
assets/textures/bark-{albedo,normal,roughness}.jpg
assets/textures/grass-{albedo,normal,roughness}.webp
assets/textures/plaster-{albedo,normal,roughness}.webp
assets/textures/leaves-albedo.jpg
assets/textures/leaves-alpha.png
assets/textures/leaves-albedo.png           # combined RGBA equivalent
assets/textures/manifest.json               # exact URLs, checksums and edits
```

The official 1K source maps were downloaded from `dl.polyhaven.org` links published by the official asset API. All **23 source files** matched their published MD5 checksums before processing. The manifest preserves those original download URLs and checksums, and the SHA-256, dimensions and byte size of every delivered texture.

Surface albedos were retained at 1K for concrete, masonry, roofing and grass, and reduced to 512 px for asphalt, bark and plaster. OpenGL normals were reduced to 512 px; roughness maps to 256 px. LANCZOS resizing and JPEG/WebP encoding reduce the browser payload. JPEG normal maps use no chroma subsampling; grass and plaster use compact WebP encoding. This trades some fine scan detail for a compact browser package; these are not lossless source masters. No displacement meshes, metallic maps or AO maps are included.

The foliage atlas contains multiple leaf and stem UV islands, which would show unwanted shapes if used as one whole billboard. One oval leaf was isolated from source rectangle `[244,285,367,372]`, resized to 256 px, and its alpha trimmed to the leaf contour to remove unrelated atlas islands. The colour and vein information remain from the supplied texture. The original crop aspect ratio is **123/87 ≈ 1.414**; the module records that value. Foliage geometry can arrange many rotated leaf copies along original procedural twigs to produce a branch card. Such branch arrangements are new simulator assets; they are not surveyed trees.

`texture-assets.js` exports `MATERIAL_TEXTURES` containing embedded data URLs and `MATERIAL_SCALES` containing each surface's source width/height in metres. The simulator can therefore load these materials without depending on Poly Haven during flight. Leaves use `{albedo, alpha, kind: 'leaf', aspect}`. Normal/roughness textures should be interpreted as linear data; albedo uses sRGB. Scale the seamless materials in world metres instead of stretching one photograph over an entire city block.

The module is approximately **1.48 MB** including base64 overhead, with about **1.11 MB** of embedded image data. The full local pack is about **1.17 MB**, including the additional combined RGBA leaf image. Grass adds only **86,990 bytes** of image data (about 116 KB after base64 encoding), despite retaining its 1K albedo. Plaster adds another **30,062 bytes** of image data. Albedo, normal and roughness maps were inspected/validated for dimensions and decoding; the isolated leaf mask includes transparent background and an opaque interior. Visual quality in the integrated simulator still depends on lighting, mapping, vegetation placement and the graphics hardware.

## Primary metadata links

- [Concrete Pavement files](https://api.polyhaven.com/files/concrete_pavement)
- [Red Brick 03 files](https://api.polyhaven.com/files/red_brick_03)
- [Asphalt 02 files](https://api.polyhaven.com/files/asphalt_02)
- [Grey Roof Tiles 02 files](https://api.polyhaven.com/files/grey_roof_tiles_02)
- [Bark Platanus files](https://api.polyhaven.com/files/bark_platanus)
- [Grass Ground files](https://api.polyhaven.com/files/grass_ground)
- [White Plaster Rough 01 files](https://api.polyhaven.com/files/white_plaster_rough_01)
- [Tree Small 02 files](https://api.polyhaven.com/files/tree_small_02)

The pack contributes surface detail. It does not supply complete geographic coverage, surveyed heights, building interiors or a photographic mesh of Shanghai. OSM scenery data retains its separate ODbL licence and attribution.
