# Shanghai Flight Lab sources and licenses

# Shanghai architectural study

The browser scene uses metre-scale landmark geometry, derived from the same parameters as the editable Blender landmark source and interchange GLB. The four primary landmarks use source-backed heights and characteristic forms. The central scenery now also uses a selected OpenStreetMap subset for real mapped building footprints, street lines, water and green-space outlines. Generic facades, most building heights and the outer context remain approximations: this is **not surveyed geometry, photogrammetry or a navigation database**.

Coordinates are east-positive x and north-negative z, relative to the WGS84 reference 121.5055 E, 31.2336 N. This origin is east of Shanghai Tower, not its actual position. The landmark centres are aligned to named OSM outlines; the tower model is around x=-404.6 m, z=-216.8 m. Heights are metres above local ground. The ground is flat; no terrain elevation dataset was used.

- Shanghai Tower: **632 m**, rounded tri-lobed form tapering to 55% of base scale and rotating **120 degrees**. Architect Gensler: https://www.gensler.com/projects/shanghai-tower and facade design paper https://www.gensler.com/uploads/document/242/file/Shanghai_Tower_Facade_Design_Process_11_10_2011.pdf . Tower operator: https://en.shanghaitower.com/ProjectIntroduction.html .
- Shanghai World Financial Center: **492 m**, tapered trapezoidal form, actual open crown aperture. Operator project outline: https://www.swfc-shanghai.com/about_intro.php?l=en .
- Jin Mao Tower: **420.5 m**, eightfold pagoda-like setbacks. Architect SOM: https://www.som.com/projects/jin-mao-tower/ and https://www.som.com/news/som-and-jin-mao-tower-part-1/ .
- Oriental Pearl Tower: **468 m**, tripod, major spheres and slender mast. Shanghai municipality: https://english.shanghai.gov.cn/en-ScenicSpots/20231205/19a5f5184eca45728fd57a4d4c8efc61.html .

The Pearl sphere dimensions, facade patterns, mechanical decks, Bund frontage and surrounding architecture are visual approximations. The selected core includes real mapped footprints; the simulator does not contain every Shanghai building or reproduce interiors.

## Flight facilities

Flight Park helipad, Practice Field runway 18/36 and Aim Practice Range are **fictional** facilities inserted for gameplay. They are not Shanghai's real airfields or any representation of approved flight routes. Aim boards occupy a separate uninhabited field, and none are attached to the civilian landmarks.

## Blender source

`shanghai-landmarks.blend` contains editable landmark geometry, named structural components, metre units, materials, lighting and a skyline review camera. `shanghai-landmarks.glb` provides the same four landmarks for import into other 3D tools. The browser scene renders equivalent lightweight geometry in `city.js`; it does not stream the GLB or contain remote map imagery. The export was generated with Blender 5.2.2 LTS in background mode.

Facade and pavement textures are locally generated patterns. The photographic environment sky uses a CC0 Poly Haven photograph, documented separately in `sky-sources.md`. No third-party 3D building models or map imagery are embedded.


# Photographic environment sky

Asset: **Kloofendal 48d Partly Cloudy (Pure Sky)**, photographed by **Greg Zaal**, sky-only edits by **Jarod Guest**, published by Poly Haven.

- Official asset: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
- Official asset metadata: https://api.polyhaven.com/files/kloofendal_48d_partly_cloudy_puresky
- Source HDR: https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr
- License: **CC0**, https://polyhaven.com/license
- Original source MD5 published by the API: `c69498687e876bf68d2a8b8a62234eb9`

Downloaded the official 1024×512 HDR and converted locally using Blender 5.2.2 LTS, AgX with Medium High Contrast, exposure approximately +0.986 stops, JPEG quality 87. The photographic equirectangular JPEG is 42,556 bytes and is embedded as a data URL in `sky.js` to avoid network fetches during flight. The JPEG is a display texture, not an unclipped HDR lighting source.

This sky photograph was captured in South Africa, not Shanghai. It supplies generic partly-cloudy daylight for the Shanghai architectural study; it is not evidence of Shanghai's current or recorded weather.


# Flight range audio sources

These six sound pages explicitly display **Creative Commons Zero (CC0)**. Sources and licenses checked October 11, 2026. The publicly available high-quality MP3 previews were downloaded, converted to mono 22,050 Hz, encoded as short MP3 excerpts, and embedded in `audio.js` so playback does not depend on a third-party server or cross-origin access. No Freesound account or paid subscription was used.

| Embedded sound | Original work and creator | Source | Edit |
|---|---|---|---|
| Helicopter rotor | Helicopter Rotor Loop.flac — qubodup | https://freesound.org/people/qubodup/sounds/187681/ | Full 6.318-second loop, mono 48 kbps |
| Propeller aircraft | Propeller Plane — clif_creates | https://freesound.org/people/clif_creates/sounds/251971/ | 13–16.5-second excerpt of aircraft passing overhead at LAX; high-pass filter, boundary fades, mono 48 kbps |
| Jet aircraft | Jet Engine — m_cel | https://freesound.org/people/m_cel/sounds/534856/ | 3–6.5-second excerpt of static jet engine test; boundary fades, mono 48 kbps |
| Machine gun | Machine Gun Single Shot — qubodup | https://freesound.org/people/qubodup/sounds/854347/ | Full short single-shot excerpt, mono 64 kbps |
| Explosion | Explosion — qubodup | https://freesound.org/people/qubodup/sounds/182429/ | Full 3-second clip, mono 48 kbps |
| Rocket | Rocket Launch.flac — qubodup | https://freesound.org/people/qubodup/sounds/182794/ | 18.95–20.6-second launch excerpt, reduced volume, tail fade, mono 48 kbps |

The rotor, gun, explosion and rocket source descriptions identify public-domain US government video material. These recordings represent those sound types; they are not recordings of every selectable aircraft model. Engine whine, low-frequency vibration, wind, warning beeps, flare discharge and fallback effects are original procedural Web Audio sound design. Helicopter pitch follows governed rotor RPM; propeller pitch follows RPM; turbine pitch and roar follow throttle. A master compressor limits overlapping effects. Aircraft recordings are low-pass filtered in cockpit view.

The module creates its AudioContext only through `enable()`, called from a user gesture, and disconnects event nodes after completion. Mute and pause silence every audio bus. Individual effects have polyphony and repeat-rate limits.

CC0 legal code: https://creativecommons.org/publicdomain/zero/1.0/


Three.js 0.170.0 is distributed under the MIT license (https://github.com/mrdoob/three.js/blob/r170/LICENSE).


# Shanghai OpenStreetMap scenery data

Source: OpenStreetMap contributors, downloaded from the official Geofabrik regional extract on October 11, 2026:

- Regional download page: https://download.geofabrik.de/asia/china/shanghai.html
- Raw PBF download: https://download.geofabrik.de/asia/china/shanghai-latest.osm.pbf
- Downloaded PBF SHA-256: `77cdeada205c3480086a6f1bbb3c693f6b8f506be78e74f9abad8334c6453381`
- Data copyright and licence: https://www.openstreetmap.org/copyright
- Licence legal text: https://opendatacommons.org/licenses/odbl/1-0/

The derived database is distributed under **ODbL 1.0** with attribution **© OpenStreetMap contributors**. `assets/shanghai-core.json` is a machine-readable local-metre equivalent. `shanghai-buildings.js` also contains the entire selected database as a gzip/base64 payload, delta-coded in decimetres; its exported `loadShanghaiGeography()` function restores the usable coordinate arrays. The module requests no remote map API. Preserve the attribution and licence/source metadata when redistributing the scenery data.

This is a selected central subset within approximately 4 km of the reference origin. The geometry budget retains 4,270 mapped building footprints/parts, 2,094 street segments, 97 water polygons and a separate budget of mapped park/green-space polygons. All four hand-modelled landmark areas and the fictional helipad are excluded from the generic building layer. The near 1.5 km is prioritised; farther buildings are selected across 500 m cells rather than rendering every mapped object.

Only 192 exported building records have an explicit height tag. Another 616 use recorded floor counts with an estimated 3 m floor spacing and any recorded roof height. The remaining 3,462 use type-based height defaults. Explicit OSM heights are community-recorded values, not independent measurements made for this project. Most road widths are defaults by highway class. Facades are original generated material patterns, not photographs of the mapped buildings. Coordinates are rounded to 0.1 m and nearly collinear vertices simplified; this storage precision does not imply survey accuracy.

The named source outlines used for landmark alignment are Shanghai Tower way165792123 (Wikidata Q18547), World Financial Center way10691100 (Q80852), Jin Mao way376075961 (Q80813), and Oriental Pearl way40778038 (Q223207). Detailed geometry and landmark heights remain the architectural interpretations referenced above.

No bulk download of the OSM public raster tile service was performed; raw geographic data was downloaded instead. No Google/Bing satellite imagery, Shanghai photogrammetric mesh, private API key or paid map account is included. Further source options and their verified coverage/access limitations are recorded in `SCENERY-ROADMAP.md`.
