# Resources catalog — 5 October 2026

The public library has 17 finished browser games and apps: 15 classroom tools and two adult conversation tools. Actual screenshots lead each card; visitors can search by name and choose a category. English and Chinese indexes share the same catalog. Lessons, news topics and visual practice remain below the game catalog in compact links.

## Added or surfaced

- Dynamite Mice (`/maze/`): existing public game, newly surfaced in the catalog. Current shipped v7 retained.
- Filler Alarm (`/speak/`): existing public speaking app, moved into the visual catalog.
- X Buzzer (`/tools/x-buzzer/`): finished standalone hold-to-play sound/light app. Release stops the effect; counter and reset retained.
- Would you, though? (`/tools/would-you-though/`): October 4 completed edition with 100 conversation questions, ten categories, previous/next and optional follow-ups.
- Two Perspectives (`/tools/two-perspectives/`): October 4 completed edition with 3,000 questions, collection/topic selection, previous/next and optional notes.

The two conversation apps appear under **Adults 18+**, outside the default classroom results. Only their runtime files are published; local server scripts, research/review records and source archives are not included.

## Existing entries preserved

One Question, One Minute; Problem-solving Sprint; Keeperfall; Mouse House; Class Charades; The Hungry Forest; Ice Drop; Marble Name Picker; Wheel of Doom; Kai Class Time; Toastmasters Speech Timer; Speech & Debate Timer.

## Outside this browser library

- Second Chance: local Unreal/Windows playtest build, not a finished web release.
- Ashfall and Skyforge: native/Roblox projects without a verified finished browser package.
- Mission Control, Kaban/Codex adapters and PC widgets: local computer tools that require local services, filesystem access or private configuration.
- Bob's character notebook: personal game state, preserved on its existing route rather than presented as a reusable classroom app.
- Animation/video exports and worksheets: separate media/materials, not additional completed games or apps.

## Verification

- Production Astro build: zero errors.
- All 23 existing release-check groups passed, including game invariants, media, public routes, SEO, language pairs, practice content, schedule privacy and asset budgets.
- Browser: all 17 routes opened with HTTP 200 and no page JavaScript errors; all 17 preview images decoded.
- Catalog: six filters, search, empty results, clearing, English/Chinese versions and tools-gallery route passed. No horizontal document overflow at 320, 390, 768 and 1440 pixels.
- New apps: next/previous and question data, category/follow-up controls, X hold/release/reset, and phone layouts passed.
- Existing game behavior is retained; route smoke checks are not exhaustive gameplay or statistical-fairness certification. Microphone inference was not retested as part of this catalog release.

Preview images use WebP and lazy loading after the first row. The shared stylesheet is cached externally; resource page markup remains under the existing 30 KB raw-file budget. The catalog loads no game engines or question bundles until a visitor opens an app.
