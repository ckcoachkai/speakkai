# V26 global benchmark: short video discovery with a full HTML alternative

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for one optional silent 18-second Remotion practice lesson. No product files, builds, browser/shared-browser actions or deployment were performed.

## Fresh official speaker reference

[TED: Julian Treasure — How to speak so that people want to listen](https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen) returned HTTP 200 on 2026-09-07. The page pairs a clear title and short description of the speaking topic with a video discovery surface, a poster image, a `Read transcript` action and video metadata. Its Open Graph metadata reports a 584-second video duration. The description identifies concrete content—vocal exercises and speaking with empathy—before the visitor chooses whether to watch.

The useful pattern is layered access: explain what the media teaches, let the visitor start it deliberately, and expose the same substance as readable text. TED’s page does not prove improved speaking, comprehension or conversion. Its transcript and player are not evidence that SpeakKai’s planned media has passed keyboard, screen-reader, mobile or reduced-motion testing.

## SpeakKai recommendation

Place the original silent **18-second “Point · Example · Check”** clip inside the existing practice-example area as an optional preview. Give it a visible poster, a short label such as **18 seconds · silent example**, and a user-started play control. If rendered as native video, use `controls`, `preload="none"`, `muted` and `playsinline`; do not autoplay, loop or require an account. Keep the clip local to the static Astro/Remotion output.

Put the complete equivalent instruction directly beside or below the video in ordinary HTML: state the point, show the example, and ask the listener check. The HTML should remain visible when video is unavailable, JavaScript is disabled or a visitor prefers text. The clip is a demonstration of the existing method, not a testimonial, result, guarantee or new lesson claim.

## Hypothesis and checks

**Hypothesis:** A short, deliberately started visual example plus the same readable Point–Example–Check instruction will improve method discovery while preserving access for visitors who do not play media.

Before release, record PASS/FAIL/NOT_CHECKED for: poster and duration label; no autoplay and `preload="none"`; native keyboard-operable controls; silent playback; complete HTML equivalent; readable fallback when media fails; narrow-layout behavior; reduced-motion preference; file size and LCP/transfer impact; and screen-reader/accessibility review.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [How to speak so that people want to listen](https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen) | TED | HTTP 200 on 2026-09-07; speaking-focused video page with concrete topic summary, poster/video metadata, 584-second duration metadata and a “Read transcript” alternative. Used as a discovery and text-alternative pattern only. |

**Unverified:** the planned Remotion render, player behavior, captions/transcript implementation, file size, LCP, transfer cost, keyboard/screen-reader behavior and reduced-motion behavior.
