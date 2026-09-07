# V29 global benchmark: make three practice choices easy to find

**Checked:** 2026-09-07 (Asia/Shanghai)
**Scope:** One current official resource/video library page and a bounded pre-edit recommendation for linking SpeakKai’s method to media. No product files, builds or browser actions were performed.

## Fresh official library reference

[TED Talks](https://www.ted.com/talks) returned HTTP 200 on 2026-09-07 with title **“TED Talks.”** Its navigation organizes discovery into distinct paths: **WATCH** (TED Talks, Playlists, Series, TED-Ed videos, TEDx Talks, TED Fluent), **DISCOVER** (Topics, Podcasts, Ideas Blog, Newsletters, Games), then **ATTEND**, **PARTICIPATE** and **ABOUT**. The hierarchy lets a visitor choose a type of resource before opening individual media.

The one HTTP response exposes the navigation shell but no visible list of current talk cards, practice durations, skill filters or method-to-media mapping. This may reflect client rendering; it is not evidence that the live library lacks those features. TED’s category structure does not prove faster discovery, comprehension or conversion, and TED content is not SpeakKai evidence.

## SpeakKai application

Keep the existing **Think / Practise / Grow** method as the explanation layer, then add one compact **Choose a practice** row with exactly three options:

- **Tell one object story** — 10 minutes; early speaker with a parent or partner. Link to the existing `/resources/one-object-story/` HTML guide.
- **Explain it, then swap** — 12 minutes; school pair activity with a teacher or facilitator. Link to `/resources/explain-then-swap/`.
- **Give a one-minute brief** — 10 minutes; workplace partner practice. Link to `/resources/one-minute-brief/`.

Each option should show audience, duration and the single practice move before the link. Use one direct action such as **Open the practice**. If a matching original visual exists, add a secondary **Watch the short example** link; never make the video the only route. The planned silent `Point · Example · Check` clip can sit beside its complete HTML instruction and should remain user-started.

Keep the existing audience-specific method examples and fictional boundaries. Do not turn TED’s categories into a claim that SpeakKai offers a media library, level system or standardized curriculum.

## Hypothesis and checks

**Hypothesis:** Three labeled choices with audience, duration, practice move and an HTML route will help visitors move from the abstract method to a suitable practice without decision overload or media dependence.

Record PASS/FAIL/NOT_CHECKED for: exactly three choices; accurate audience/time labels; direct working HTML links; method-to-practice wording; optional user-controlled media; visible text alternative; English/Chinese parity; narrow layout; keyboard access; and live rendered-card/link verification.
