# V24 global benchmark: complete guided practice with a static fallback

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for SpeakKai practice resources. The question is what a visitor needs to run an activity without a coach present: complete instructions, duration, listener feedback, self-paced guidance and a static alternative. No product files, builds, browser/shared-browser actions or deployment were performed.

## Fresh official speaker-practice reference

[Toastmasters International: Membership](https://www.toastmasters.org/membership) returned HTTP 200 on 2026-09-07. The page title is **“Toastmasters International -Membership.”** It gives prospective participants several ways to preview the experience: **“My First Meeting”** is described as a preview of what they will experience; **“The Club Experience Video”** shows a meeting in action; and **“Club Meeting Roles”** gives brief descriptions and resources for specific roles. The page also keeps concrete next actions such as **“Find a Club”** and **“Start a Club.”**

This is useful as a preview/resource pattern, but it is not evidence of a complete self-paced speaking worksheet. The retrieved page does not establish a timed sequence, listener feedback protocol, printable alternative or SpeakKai outcome. Those are requirements SpeakKai should make explicit in its own resources.

## Current SpeakKai baseline

The existing practice content already covers the needed parts:

- `one-object-story.json` is a 10-minute activity; `one-minute-brief.json` is 10 minutes; `explain-then-swap.json` is 12 minutes. Each has per-step minute values that sum to the stated total.
- Each resource gives setting and materials, numbered instructions, a listener guide, a concrete feedback example and a retry or next-step action. The listener is asked to name what came through and ask a useful question, so feedback describes the explanation rather than judging the person.
- `FlagshipPracticePage.astro` renders the total duration, materials, setting, all step details, listener note and a print control. `PracticeGuide.tsx` adds a one-step-at-a-time start/next/back/again flow for self-paced use.
- The complete ordered `<ol id="practice-steps">` remains in the page as the static full sheet. The interactive guide and print button are enhancements; the core activity does not depend on a saved account, storage or a coach being online.

## Bounded recommendation and gaps

Keep this contract for every activity: state the total time first; name the setting, materials and partner role; give every step with a time and an action; tell the listener exactly what to notice or ask; require one small retry; and finish with a choice to keep. Keep the guided control and the complete printable/read-all version together. Do not replace the full instructions with a carousel, video or client-only interaction.

The Chinese course and `one-object-story` have explicit Chinese routes. The school and workplace practice JSON is currently English data with no equivalent Chinese practice route; do not expose a Chinese language link for those resources until complete Chinese instructions, timings, listener guidance and boundaries exist. Mark an English fallback honestly when needed.

## Testable hypothesis and checks

**Hypothesis:** If a visitor can see the time, follow complete timed steps, use a listener check and retry independently, then the resource remains usable in guided, self-paced and no-JavaScript/print contexts.

Before release, record PASS, FAIL or NOT_CHECKED for: total and per-step durations; complete instructions and materials; explicit listener feedback and retry; guided start/next/back/again behavior; readable static full sheet and print output; Chinese meaning parity where a route is offered; no storage or outcome claim; and live route, keyboard, screen-reader and print verification.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Membership](https://www.toastmasters.org/membership) | Toastmasters International | HTTP 200 on 2026-09-07; preview of a first meeting, meeting-in-action video, role-specific descriptions/resources and clear next actions. Used as an experience-preview reference only. |

## Local source inspected

`C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipPracticePage.astro`, `src\components\PracticeGuide.tsx`, and `src\content\practice\*.json`.

**Unverified:** final build, live route behavior, screen-reader/keyboard behavior, print rendering, Chinese translations for the school/workplace activities and measured learner outcomes.
