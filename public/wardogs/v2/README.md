# Shanghai Flight Lab

Live: https://speakkai.com/wardogs/

A browser flight simulator built with Three.js. Starts in rear chase view with full Alt free look. High detail increases render resolution for sharper edges. Includes reconstructed Shanghai landmarks, a fictional airport/helipad and separate practice range, ten aircraft, cockpit/chase cameras, rotor spool and force-based flight, missiles/AA, countermeasures, crash effects, and licensed sound recordings.

Scenery now uses locally embedded photographic PBR materials for concrete paving, plaster walls, brick, asphalt, roofing, bark and grass. Surface scale stays consistent in world metres; normal and roughness maps add relief and weathering. Trees use photographed leaves arranged on branching, transparent clusters, with distance-based detail reduction. Focused directional shadows add depth to buildings and streets.

## Start

Use a desktop browser with hardware acceleration. Select an aircraft and departure and click **Start flight**. Sound starts after this click; the audio button mutes/unmutes. Use the fullscreen button for an unobstructed view. **Go to practice range** starts the selected aircraft near the targets; weapons are available on armed military aircraft. Threats start disabled; enable them in inventory.

For local development, serve this directory with any static HTTP server. ES modules require HTTP; opening `index.html` directly as a file is insufficient. All simulation and sound assets are local. Google Fonts is optional; the browser falls back to system fonts.

## Controls

| Key | Action |
| --- | --- |
| W / S | Nose down / up |
| Q / E | Bank left / right |
| A / D | Steer / yaw left / right |
| Shift / Ctrl or arrow up / down | Collective / engine throttle |
| M | Mouse cyclic toggle |
| Alt + mouse | Orbit 360 degrees in chase; release to return behind aircraft |
| C | Cockpit / chase camera |
| F | Inventory |
| R | Five-second flare program: pairs every half-second |
| Space / left mouse | Machine gun |
| Mouse 4 / X / right mouse | Rocket |
| G / J / B | Gear / flaps / hold wheel brake |
| L | Engine start / stop |
| Z | Stability assist toggle |
| H / P / Home | Hangar / pause / reset to selection |
| ? | Guide and gamepad/HOTAS axis mapping |

Weapons are active on military aircraft in the fictional range. Gun/rocket ammunition replenishes indefinitely; 24 flares are available per sortie; a full five-second program uses 20. Civilian aircraft remain unarmed. The simulator uses browser-local state; no accounts or saves are required.

During flight, modifier chords such as **Ctrl+S** remain simulator inputs: collective descent and pitch still work together without opening the browser Save dialog. Text fields and selection controls keep normal editing. Fullscreen also requests the browser's optional Keyboard Lock for reserved flight-key chords; unsupported or denied locks fall back to ordinary shortcut capture. Escape and Tab remain available for navigation. Browser/OS-reserved shortcuts vary by host.

## Aircraft

Airbus H125, UH-60 Black Hawk, AH-64 Apache, AH-6 Little Bird, CH-47 Chinook, Cessna 172, Beechcraft King Air 350, Airbus A320, F-16, F-22.

## Source and assets

`aircraft.js` contains parameterized aircraft meshes and instrument textures. `city.js` contains the browser scenery. `physics.js` contains force integration. `combat.js`, `effects.js`, and `audio.js` handle range activity, visual effects, and sound. `main.js` integrates the UI and rendering. Three.js 0.170.0 is vendored under MIT.

`assets/shanghai-landmarks.blend` is the editable Blender 5.2 architectural study; `assets/shanghai-landmarks.glb` exports those landmark meshes. The browser renders equivalent procedural meshes, rather than loading that GLB. The photographic sky and six sound recordings have license/source notes in `SOURCES.md`.

`materials.js`, `foliage.js` and `texture-assets.js` supply the surface/leaf pack. The original material sources, CC0 licence, verified checksums and conversion details are in `TEXTURE-SOURCES.md` and `assets/textures/manifest.json`. These are generic material photographs, not photographs of the specific Shanghai buildings.

## Accuracy

Shanghai landmark heights and forms use architecture references and their centres align with OpenStreetMap WGS84 coordinates. A selected roughly 4 km radius core uses real mapped footprints, roads and water outlines, with incomplete coverage and many estimated heights. Outside the core, scenery is procedural. This is not a surveyed or photogrammetric reconstruction or an entire Shanghai 3D map. Map data is © OpenStreetMap contributors (ODbL 1.0), processed from Geofabrik; the derived database is offered in assets/shanghai-core.json and in the simulator's Model & sources dialog. Aircraft shape and flight dynamics are modelled interpretations. Cockpits are simplified. The model is inspired by WARDOGS presentation and documented aviation concepts; it does not reproduce the game's unpublished equations. It has not been validated for real-flight training. See SCENERY-ROADMAP.md for the next accuracy stages.

## Verification

Deterministic physics checks cover hover, rotor spool/takeoff, directional inputs, trim, stalls, vortex ring state, swept building collisions and hard landings. All ten aircraft instantiate/animate/dispose with finite geometry. Startup combinations were checked against city colliders. Combat checks cover gun target hits, rockets, flare inventory and missile guidance. Audio lifecycle and particle stress tests pass. Browser checks exercised cockpit/chase views, airliner selection, gunfire, inventory, flares, rockets, ground crash effects and reset, without console errors.
