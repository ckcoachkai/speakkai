# Travel redesign — 2026-09-15

## Delivered design
Premium lakeside travel editorial, with existing Suzhou Bay itinerary and booking uncertainty preserved. Figma direction and editable desktop implementation: https://www.figma.com/design/hIilPdps6ULivq66e691tc (frames 2:2 and 5:5). Figma uses verified DM Sans and Playfair Display. A captured Georgia date label cannot currently be reloaded through the Figma API, so the full capture is retained as editable source rather than falsely claiming all text was converted to components.

## Tool contributions
- Figma: original direction, type/color/layout exploration, imported library CTA; full implementation capture.
- Image generation: original lakeside jetty atmosphere. Built-in generation returned 1672x941; no upscale or native-4K claim. Original: media/travel/lake-atmosphere-ai.png; web derivative: public/travel/assets/lake-atmosphere.webp.
- Blender 5.2.1: original 153,796-triangle route landscape with 25 materials, buildings, swept roofs, glazing, planted paths, pool, city district, organic shoreline and jetty. Deterministic source scripts/build-travel-model.py; editable media/travel/suzhou-route.blend; runtime public/travel/assets/suzhou-route.glb.
- HyperFrames 0.8.40: deterministic 8-second silent film, native 3840x2160 at 24 fps. Composition media/travel/escape-film/index.html. Master public/travel/assets/escape-film-4k.mp4; 1600px streaming derivative public/travel/assets/escape-film.mp4. User-initiated playback, pause controls, off-tab pause.

## Asset provenance and resolution
- Existing resort.jpg: IHG hotel photography, 1400x700; springs.jpg: IHG, 1000x500. Reused from original published guide. Rights documentation beyond existing IHG attribution has not been independently established.
- AI lake: 1672x941, visibly identified as an AI impression; not documentary hotel photography.
- Blender still: native 3840x2160, public/travel/assets/landscape-4k.jpg; 1920px WebP poster.
- HyperFrames film: native 3840x2160 output using native-resolution Blender source. Web derivative 1600x900.
- External sourcing attempts: IHG returned Access Denied and Commons retrieval failed. No Xiaohongshu photographs were copied, and no new third-party photo is claimed to be licensed or 4K.

## Generation prompt
Photorealistic editorial lake photograph for a Suzhou escape website; 16:9, native 3840x2160 if supported; quiet East China lake at sunrise; pale wooden jetty, willow branches, misty hills, amber morning light and subtle ripples; no people, text, logos or identifiable invented hotel buildings. Explicit atmospheric AI illustration, not property evidence. Actual output resolution is stated above.

## Verification
- Browser desktop and 390x844 mobile visually reviewed. Mobile headline clipping fixed and retested; no document horizontal overflow or broken visible images.
- Day 2 and both-days selectors, spa 1400→1700 CNY change, room edits, reload persistence, save-trip, packing checkboxes, reset, gallery next/previous/wrap/Escape, route-focus buttons and film playback verified in browser.
- Browser error log empty during tested flow. Film decoded at 1600x900 and played with no media error.
- HyperFrames check: layout, runtime and contrast passed, 15/15 contrast samples; motion audit disabled by CLI, motion inspected through playback. 8-second 4K master verified using ffprobe.
- Blender exported GLB independently imported, zero invalid vertices, degenerate faces, zero-length edges or missing material assignments. Source and fresh-import multiview images reviewed. Generic evidence utility produced underlit frames; replaced by scripts/travel-validate-import.py with explicit review lighting, source materials retained.
- Authored and import evidence: output/travel/blender. Web device GPU performance beyond desktop emulation remains unverified.
- Astro build: 166 pages, no errors. Run final release checks after integrating current main.

## Release and rollback
Only travel-specific files changed. Integrate current origin/main before pushing to avoid replacing concurrent forest/food changes. Rollback: revert the travel redesign commit (no data migrations). Saved UI preferences are localStorage-only under speakkai-travel-v2 and can be reset on page.

Final release gate: 57 regression tests passed; merged current main; 166-page build passed; schedule privacy, premium-media, flagship-budget and forest checks passed. Ten directly referenced travel assets resolve locally; Figma capture code is excluded from production. The 3D model loads only near the route section.

## Photo-led bilingual revision — September 15
- Rebuilt the guide as full-height photographs with overlaid headings and compact captions. Hotel information, itinerary, budget and packing details expand on demand.
- First-visit Chinese / English dialog remembers the selected language independently of trip preferences. Header control reopens it. Static text, accessibility labels, gallery, itinerary, budget, feedback and route messages translate; calendar exports use the selected language.
- Browser verified at desktop and 390x844: first-visit chooser, both languages, reload persistence, no horizontal overflow, no broken images, experience-to-itinerary expansion, spa budget changes, numeric edit preservation across language changes, preference reset retaining language, translated gallery, 3D focus and film playback. Error log empty.
- Build passed for 166 pages; 57 existing regression tests and schedule privacy check passed. Print opens details temporarily and restores them after printing; native print output was not visually inspected.
- This revision changes the website layout; existing Figma frames document the earlier design iteration. Original Blender and HyperFrames deliverables are retained.
- Rollback this revision with git revert; no data migrations. Language preference key: speakkai-travel-language.


## Bilingual audio introduction — September 15
- Original energetic script covers the complete one-night itinerary, estimates, optional spa, return deadline, packing and site interactions. Scripts: NARRATION.md; generation text: narration.json.
- ElevenLabs v3, stock voice Liam, language codes en and zh. English 150.56 seconds; Chinese 142.8 seconds. Prerecorded mono MP3 at 96 kbps, normalized toward -18 LUFS / -2 dBTP. Hashes and request fingerprints recorded in narration-manifest.json.
- Selecting a language starts its narration synchronously within the button activation. Changing languages stops the previous track and restarts the selected version. First visitors hear nothing before choosing. Returning visits attempt the remembered language and show a play control if browser autoplay policy blocks playback.
- Persistent compact player includes pause/resume, replay, seek progress and localized full transcript. Opening language selection and hiding the tab pause audio. API credentials stay in local configuration; visitors only download static audio files.
- Verified desktop and 390x844 mobile: English/Chinese selection autoplay, first-visit silence, language-switch pause, correct file/duration, pause/resume, seeking, replay after completion, translated transcript, no horizontal overflow, no console errors. Both MP3s fully decoded with ffmpeg.
- English audio transcribed with ElevenLabs Scribe; Chinese checked with cached local Whisper large-v3 after the Scribe quota was exhausted. Transcript review confirmed the itinerary and budget, with some proper-name/homophone recognition differences. No independent native-listener pronunciation review is claimed.
- 166-page build, 57 regression tests, and schedule privacy check passed. Rollback by reverting this audio introduction commit; no migrations.

## Photo-referenced Blender resort — September 15
- Replaced imagined route map with detailed resort architecture, PBR surfaces, HDR lighting, bilingual anchored labels and four interactive camera views.
- Added three native 4K Cycles stills and bilingual labeled SVG; selected camera controls the 4K link. Gallery uses the new render.
- Source, evidence, metrics and explicit approximation boundaries: REALISM-REPORT.md. Packed editable Blender scene retained locally.
- Desktop/mobile UI and fresh GLB inspection completed; two remote terrain slivers remain documented. No survey-accuracy claim.
