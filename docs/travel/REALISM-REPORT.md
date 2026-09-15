# Travel resort architectural visualization

Delivered September 15, 2026. The photo-based resort reconstruction replaces the earlier imagined city-and-resort map. Architectural features include five-level angled guest wings, recessed glazing, glass balcony rails, roof ribs, villas, event hall, arrival canopy, pond edges, paths, curbs, road markings, landscaping and street furniture.

## Files

- Editable packed scene: ../../media/travel/suzhou-bay-realistic.blend (54.9 MB, local deliverable).
- Reproducible model: ../../scripts/build-travel-realism.py
- Texture generation: ../../scripts/travel-surface-textures.py
- Web model: ../../public/travel/assets/suzhou-bay-realistic.glb
- Native 3840 x 2160 Cycles stills: ../../public/travel/assets/resort-hero-4k.jpg, resort-overview-4k.jpg, resort-courtyard-4k.jpg.
- Bilingual annotated presentation: ../../public/travel/assets/resort-labeled-4k.svg.
- Local staged inspection evidence: ../../output/travel/realism/ (graybox, draft, authored and fresh-import multiviews, metrics, logs).

## Reference and limits

Trip.com hotel listing 73261577 and aerial photograph 0201g120008y9vdu3FE38_R_960_660_R5_D.jpg, plus the existing IHG facade photo. The bent hotel wings, central pond, western water edge, villas, eastern hall and arrival circulation informed the layout. No survey or georeferenced dimensions were available. Landscaping and secondary furniture are plausible interpretations. This is an architectural visualization, not a survey, navigation map or claim of photographic equivalence. The site discloses this in both languages.

Photo-derived PBR scans and HDRI are Poly Haven CC0; manifests remain with media/travel/realism-textures. Hotel reference photographs were not republished as new textures. Major buildings and trees use geometry. Separate water, glass, metal, stone/concrete, asphalt, timber, grass and wall materials include roughness and normal variation. The original animated landscape film is a separate earlier artwork.

## Technical validation

Blender 5.2.1 LTS, Cycles, OptiX, RTX 5070 Laptop. Three final views rendered at native 3840 x 2160 with 64 samples and denoising. Final tabletop bevel correction is reflected in the editable source and runtime; the stills precede that minor correction.

Authored: 294 meshes, 35 materials, 440 editable modifiers, all meshes UV mapped; zero invalid vertices, zero degenerate faces, zero zero-length edges, zero missing materials. Export: 63 material batches, 35 materials, 19 embedded images, 1,461,028 triangles; 21,398,868 bytes. The triangle count exceeds the initial aspirational range to preserve architectural and foliage detail. Draco uses 20-bit position precision; asphalt textures downsample to 1K only after saving the packed source.

Fresh GLB import: zero invalid vertices, zero missing materials, zero zero-length edges; two tiny degenerate terrain triangles remain at the remote ground boundary. These are recorded as a minor geometry warning, not concealed as a perfect pass. Authored and imported six-view contact sheets were opened and compared. Final hero, overview and courtyard stills were opened. Labels were visually inspected in the standalone presentation.

## Web verification

Local desktop and 390 x 844 browser: detailed model loaded, green ground retained, all camera controls exercised, labels toggle and translate, no horizontal overflow, no console errors. 4K link follows hero/overview/courtyard selection. English language selection starts English MP3 playback; Chinese labels and controls verified. The earlier bilingual audio and first-visit dialog remain integrated.

Web rendering uses optimized real-time shadows/environment lighting, not Cycles-equivalent path tracing. Model downloads lazily near the map; resolution and frame rates are capped. A still fallback and 4K links remain available. No measured FPS or physical mobile-device performance claim.

## Rebuild and rollback

Run scripts/travel-surface-textures.py with the documented texture inputs, then Blender background with scripts/build-travel-realism.py -- --final. Generate JPG/SVG deliverables using scripts/travel-render-deliverables.py. Source media stays local; runtime assets and durable scripts are versioned. Revert the release commit to restore the prior map; no data migrations.

Validation completed: 166-page production build, 57 existing regression tests, 5 merged food-card tests, schedule privacy and diff whitespace checks passed. Browser console had no errors during map tests. Release includes the concurrent food-page commit ef1c408 without altering it.
