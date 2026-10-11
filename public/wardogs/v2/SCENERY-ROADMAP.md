# Real Shanghai scenery: delivered data and next steps

Research and source checks: October 11, 2026.

The simulator does not contain a complete, photographic 3D model of Shanghai. A real OpenStreetMap extract for the Shanghai region has now been downloaded and a small, browser-ready central-city subset prepared. It supplies real mapped building footprints, street lines and water polygons; missing heights, facade materials, terrain and many architectural details still require modelling or additional licensed data.

## Data prepared for this release

`shanghai-buildings.js` exports `loadShanghaiGeography()`. The module embeds a compressed, locally decoded database; it needs no account, API key or map-server request. The uncompressed equivalent is `assets/shanghai-core.json`. Its source is the [Geofabrik Shanghai extract](https://download.geofabrik.de/asia/china/shanghai.html), a regional download of OpenStreetMap data, approximately 24.7 MB at the source check.

The selected area is within approximately 4 km of **121.5055 E, 31.2336 N**. The building selection preserves the dense near field up to 1.5 km and then samples 500 m outer tiles to fit the geometry budget. Roads also have a hierarchy-based budget. This means that even this central area does not render every mapped building or road.

| Exported data | Count | Interpretation |
| --- | ---: | --- |
| Building footprints / parts | 4,270 | Real mapped plan shapes, including holes where recorded |
| Road segments | 2,094 | Real mapped street lines; widths mostly estimated by road class |
| Water polygons | 97 | Mapped water outlines clipped to the local scenery bounds |
| Park / green-space polygons | 170 | Mapped park, garden, forest, grass and recreation outlines |
| Total coordinate points | 52,986 | 49,986 core points plus a separate 3,000-point green-space budget |
| Buildings with explicit height tags | 192 | Community-recorded values, not independently surveyed |
| Heights derived from floor counts | 616 | Approximation using 3 m per level, plus tagged roof height |
| Buildings with default height estimates | 3,462 | Type-based defaults; about 81% of exported buildings |

Building outlines are simplified only for almost-collinear points and rounded to 0.1 m in the local projection. This numeric precision does not establish survey accuracy. Whole-building outlines containing exported building parts are omitted to avoid stacking two buildings in the same place. Four failed area geometries in the regional extraction were skipped. Landmark and fictional helipad exclusions are deliberate.

The embedded browser module is approximately **326 KB**, containing a **243 KB** gzip payload after lossless delta-coding of the already-rounded coordinates. The readable JSON is approximately **1.58 MB**. The loader and readable database were compared after decoding, and coordinate validity, height provenance, exclusions and geometry budgets were checked. This validates the export mechanics, not the real-world completeness of OSM.

The coordinate origin is a fixed reference, not the actual Shanghai Tower position. Named OSM building outlines place the landmarks at the following approximate local centres; these correct the earlier offset between the hand-built scene and the real WGS84 map.

| Landmark | OSM way | Local centre x, z in metres |
| --- | --- | --- |
| Shanghai Tower | 165792123 | -404.6, -216.8 |
| Shanghai World Financial Center | 10691100 | -234.1, -331.4 |
| Jin Mao Tower | 376075961 | -389.9, -406.4 |
| Oriental Pearl Tower | 40778038 | -973.2, -926.6 |

The four landmarks remain detailed modelled interpretations. Their source footprints and all parts within 160 m of these centres are excluded from the generic extrusion layer. The airport, flight pad and weapons range remain fictional facilities. No current weather, navigation database, interiors or aerial photographic textures are supplied by this extract.

Raw PBF SHA-256: `77cdeada205c3480086a6f1bbb3c693f6b8f506be78e74f9abad8334c6453381`. Coordinates use x east and z south in a local equirectangular projection. A future city-wide system should use a proper geospatial frame and origin rebasing rather than extending this flat projection indefinitely.

## Which scenery sources can actually help

| Option | Useful contribution | Current limitation |
| --- | --- | --- |
| Self-hosted OSM geometry | Real road, water and footprint positions; the extracted subset is already available | Uneven coverage and missing heights/materials; it does not contain photographs |
| Cesium OSM Buildings | Streamed global OSM-derived 3D Tiles, rather than loading the whole city at startup | Requires a Cesium ion account/token; global availability does not guarantee complete Shanghai geometry or facade accuracy |
| Google Photorealistic 3D Tiles | Textured aerial meshes in supported locations | Google's official coverage table does not indicate mainland-China 3D coverage, so Shanghai support cannot be promised |
| Licensed local aerial/photogrammetric data | Potentially accurate roofs, terrain and facades | No suitable Shanghai-wide dataset with verified browser/game redistribution rights has been obtained in this work |
| Blender architectural assets | Detailed close-view landmarks, cockpit and aircraft models | Models need reliable references and textures; Blender cannot invent missing geographic evidence |

[Cesium's own description](https://cesium.com/platform/cesium-ion/content/cesium-osm-buildings/) says its buildings are derived from OSM, with global coverage and quarterly updates. It explicitly documents estimated heights where height is missing, including 3 m per recorded level. These are extruded map objects, not evidence of photographic detail or a surveyed complete city.

In the [Google Maps Platform coverage table](https://developers.google.com/maps/coverage), countries with 2D and 3D Map Tiles have two coverage marks; China's row has one mark and no Maps JavaScript 3D availability. This supports excluding Google photographic Shanghai scenery from the current implementation plan. Coverage has not been tested with a paid API key, and it should be checked again before any future provider choice.

## Practical architecture

1. **Keep the real central-city layout.** Use this local data for roads, river banks and irregular building shapes. Merge extruded buildings by a few facade materials or spatial chunks, retain height-provenance flags, and place landmark models in the same coordinate frame. Avoid overlaying the earlier fictional street grid on the mapped core.
2. **Improve the routes the player sees most.** Add independently referenced tower envelopes, roof structures, bridges, parks and waterfront details along several flight corridors. Use licensed photographs/PBR textures at close distances and cheaper material/geometry representations farther away. Audit visible height estimates before calling a district accurate.
3. **Expand by streaming districts.** Preprocess the regional PBF into roughly 500 m–1 km chunks with several detail levels. Load nearby chunks on demand; unload distant ones. Keep a lightweight spatial index for collision queries separate from visible high-detail geometry. This gives a route to the larger Shanghai area without keeping the entire municipality in GPU memory.
4. **Add photographic/terrain data only after source verification.** Check geographic coverage, coordinate reference system, resolution, capture date and redistribution permission before integration. Keep attribution visible. Verified photogrammetry can replace generic buildings locally while OSM supplies a consistent broader layout.

Existing Three.js can be retained. The [NASA-AMMOS 3D Tiles renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS) supports streaming geospatial tiles into Three.js; adopting CesiumJS is another option when globe/terrain integration becomes central. Neither renderer supplies missing Shanghai imagery. Pin and test versions against the currently vendored Three.js before adopting a tile loader. [3D Tiles](https://github.com/CesiumGS/3d-tiles) describes the streaming format, not a promise of source coverage.

Suggested future asset organization, not files already generated:

```text
assets/scenery/shanghai/manifest.json          # bounds, versions, sources, quality
assets/scenery/shanghai/tiles/<district>/...   # streamed meshes and detail levels
assets/scenery/shanghai/collision/...          # coarse indexed flight collisions
assets/scenery/shanghai/textures/...           # licensed, compressed material maps
assets/scenery/shanghai/attribution.json        # visible credits and source links
```

## Clearer rendering

Sharper rendering and more truthful geography are separate improvements. Check the actual canvas drawing-buffer dimensions against its CSS display size; a stretched low-resolution buffer stays blurry regardless of model detail. The [Three.js responsive-rendering guide](https://threejs.org/manual/pages/responsive.html) explains device pixel scaling and recommends capping total buffer pixels to control GPU cost. Use an explicit quality setting and measured frame time rather than assuming every laptop can sustain an unlimited pixel ratio.

Maintain mipmaps and hardware-supported anisotropic filtering for roads and facades viewed at grazing angles; [Three.js Texture documentation](https://threejs.org/docs/pages/Texture.html) describes the clarity/performance tradeoff. Detailed near geometry, correctly scaled facade patterns and controlled atmospheric haze matter more than a blanket sharpening filter. Target stable frame times on the user's actual laptop, with a lower pixel/detail setting available. Streaming detail should likewise follow a measured memory and frame-time budget; [Cesium3DTileset](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html) exposes screen-space-error and cache limits for this purpose.

## Attribution, access and imagery policy

This derived scenery database is offered under **ODbL 1.0**. Display **© OpenStreetMap contributors** with a link to the [OSM copyright/licence page](https://www.openstreetmap.org/copyright). Retain the embedded source metadata and make the derived database available in machine-readable form. The raw JSON and decompressible module provide that database; this does not turn the simulator's unrelated code into ODbL data.

The geometry pipeline downloads a legitimate regional raw-data extract. It does not bulk-download images from the public OSM tile server. The [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/) prohibits bulk/offline prefetching of its standard tile service and requires attribution and compliant caching.

If Cesium ion is added later, use an application-specific, asset-restricted `assets:read` token with allowed URLs for `https://speakkai.com/wardogs/`, according to [Cesium's token guide](https://cesium.com/learn/ion/cesium-ion-access-tokens/). Administrative/write tokens belong outside public JavaScript. No token or account has been created for this work.

Google imagery, if ever selected for a supported location, has separate [Map Tiles policies](https://developers.google.com/maps/documentation/tile/policies): visible provider attribution, restrictions on prefetching/storage and permitted display use. Do not treat hosted image/mesh access as permission to export an offline city or derive a collision database. The current OSM geometry and original models remain the practical source for that purpose.
