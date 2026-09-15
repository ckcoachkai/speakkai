# Suzhou Bay architectural map — modeling contract

Blender: C:/Program Files/Blender Foundation/Blender 5.2/blender.exe, 5.2.1 LTS (9e2066aef7ef).

Purpose: a photographic-reference architectural environment for the travel page, with a portable GLB and native 3840×2160 Cycles stills. Golden-hour lighting, physically varied materials, realistic rather than low-poly finish.

Reference: Trip.com hotel listing for hotel 73261577, retrieved September 15, 2026; aerial image 0201g120008y9vdu3FE38_R_960_660_R5_D.jpg. The photograph shows the angled five-level guest wings, central pond, western shoreline and garden water, foreground villas, eastern large hall and arrival roads. Existing IHG facade photograph also inspected. Address: No. 555 Pingbo Road, Dongtaihu Ecotourism Resort Area, Wujiang, Suzhou. Reference images are local study material, not new published textures.

Accuracy boundary: trace spatial relationships from the aerial, infer dimensions from floor heights and balcony modules. No cadastral/site survey or verified georeferencing is available. Label the map as a photo-based reconstruction with approximate dimensions; do not invent a Shanghai city next to the hotel. Detailed landscaping and secondary furniture are plausible reconstructions, not documented inventories.

Parts: angled guest wings, recessed windows, balcony slabs and rails, roof overhangs and tile courses, large eastern hall, arrival canopy, garden villas, planted courtyards, pond and west water edge, paths/curbs/steps, road lines, benches, lamps, parking and greenery. Hero buildings use real geometry; scanned photo-derived PBR materials carry secondary surface detail.

Materials: Poly Haven CC0 asphalt, concrete, weathered timber and brick scans, with color/roughness/OpenGL normals; original water ripple, grass and wall surface textures. Separate glass, metals, wood, painted wall, stone, soil, vegetation and water. HDRI: Poly Haven kloofendal_48d_partly_cloudy_puresky 2K plus warm low sun. All texture assets packed into the .blend and embedded in GLB.

Delivery/performance target: approximately 300k–900k triangles; GLB under 25 MB where practical, fewer than 100 material batches, lazy web loading and capped resolution/shadows. Browser lighting is an optimized real-time approximation of the Cycles result.

Stages: references and contract; graybox proportion review; primary/secondary architecture; structural detail; UV/PBR; vegetation and lighting polish; export/fresh-import verification. Self-review at every stage; no user approval gate requested.

Views: main aerial hero, semi-top-down overview, courtyard close-up, five diagnostic orthographic directions. Bilingual HTML labels anchored to world coordinates; labeled 4K presentation still. No flyover required.

Review questions: Does the bent hotel silhouette resemble the aerial? Are floor/balcony dimensions believable? Does glazing read as recessed glass rather than painted strips? Are foliage and water natural at overview distance? Are no buildings floating? Do detail and roughness survive GLB import? Are labels readable without obscuring architecture?
