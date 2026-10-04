# Problem-solving Sprint

One-minute speaking game with all 500 user-provided prompts. Prompts 1–438 came from the pasted source and 439–500 from the accompanying message (October 4, 2026). Wording is preserved.

`game.html` is the editable fragment. `public/games/problem-solving-sprint.html` is its self-contained rendered export, with local browser state storage. The public route is `/tools/problem-solving-sprint/`; the shared Resources gallery links to it in both site languages. The game itself is English.

Regenerate the public file with `node scripts/build-problem-solving-sprint.mjs` after editing the fragment or classroom screen styles. `screen.css` provides the responsive full-height classroom layout and large text; `screen.js` provides fullscreen entry and exit where supported. No remote API or microphone is required. Players answer aloud and a partner or teacher records the score. Reset stops the timer, clears the round, and returns to the start screen. Every new round shuffles all 500 prompts without repeats within that round.

Validation: `node scripts/check-problem-solving-sprint.cjs`, `npm run build`, and the site's flagship, SEO, language, resource-game and asset-budget checks. Browser checks cover start, answer, skip, reset and layouts at 320, 390, 768 and 1280 pixels. Deadline checks reject late scoring. Screenshot-derived gallery preview is `public/images/game-previews/problem-solving-sprint.webp`.

Rollback: revert the single feature commit to remove the route, gallery entry, game and source; no external data changes are involved.
