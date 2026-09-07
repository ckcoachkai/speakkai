# V20 global benchmark: let visitors preview the practice

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for the current SpeakKai homepage. The decision is the smallest useful addition that lets visitors inspect one existing practice example for coaching, companies and schools. No product files, builds, browser/shared-browser actions or deployment were performed.

## Fresh official global reference

[Center for Creative Leadership: Leadership Training Programs](https://www.ccl.org/leadership-programs/) returned HTTP 200 on 2026-09-07. The page title is **“Proven Leadership Training Programs for Every Leader Level | CCL.”** It is the official CCL program index, so its marketing claims are publisher-presented and should not be treated as independent evidence.

The useful information architecture is specific:

- The introduction tells visitors to explore options and says that, when they are unsure, they can select **“Compare”** to create a side-by-side view of **2 or 3 programs**, or contact CCL for advice.
- Each program card exposes a short fit statement, the audience level, delivery mode such as **In person** or **Live online**, and two next actions: **“Compare”** and **“Explore Program.”**
- A later section, **“What Sets Our Leadership Courses Apart?”**, previews the method at a high level. It names feedback-rich insights, experiential activities with opportunities to practise new behaviours, goal-setting for real-world application, and peer interaction.

The transferable pattern is small and practical: give a visitor a short preview of how to choose or experience the work, then link to the fuller detail. A homepage does not need to reproduce the lesson or program page. CCL’s audience levels, delivery modes, program language, outcomes and global/provider claims remain CCL’s content; this page does not establish SpeakKai outcomes, pricing, capacity, partnerships, safeguarding, regional fit or availability.

## Current SpeakKai starting point

The current homepage already explains the method as **Think / Practise / Grow**:

- Think: find the real message.
- Practise: make it work aloud.
- Grow: know what to try next.

It also has audience cards linking to `/coaching/`, `/schools/` and `/companies/`, but it does not visibly link from the homepage to the three concrete examples below. The destination content already exists:

| Audience | Existing preview | Existing route to use |
|---|---|---|
| Coaching | The bilingual course page shows first attempt, coach feedback, pause and retry, then a listener check. | English: `/coaching/young-competition-speakers/#feedback-example`; the page already provides the Chinese counterpart `/zh/coaching/young-competition-speakers/#feedback-example`. |
| Companies | The company page’s briefing example shows an initial ending, a revision, and a listener check. | `/companies/#brief-example` (the `brief-example` anchor exists). |
| Schools | The school page’s exercise asks the speaker to explain one idea to a younger student, use a familiar comparison, ask what remains unclear and try again. | `/schools/` (the exercise is present on the page, but no dedicated school-exercise anchor was found). |

The local source inspection supporting these observations was limited to the current flagship worktree at `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`:

- `src/components/FlagshipHome.astro` contains the method section and current audience links.
- `src/components/FlagshipCoursePage.astro` contains `id="feedback-example"` and the pause/retry sequence.
- `src/components/FlagshipBriefExample.astro` contains `id="brief-example"` and the company revision.
- `src/components/FlagshipOfferPage.astro` renders the school exercise from `src/data/flagshipOffers.ts`; that section has no stable id.

## Smallest useful homepage addition

Add one compact static section immediately after the existing Think / Practise / Grow method and before the direct contact section. A heading such as **“See the practice”** is enough. Use three ordinary links or a three-item list; do not add a new interactive component, duplicate the exercise text, or create another call-to-action funnel.

Suggested link labels and one-line descriptions:

1. **Course feedback: pause and retry** — Open the existing bilingual course example and see one delivery adjustment carried into a second attempt. Link the English homepage to `/coaching/young-competition-speakers/#feedback-example`; use the Chinese route for a localized Chinese homepage or keep the destination’s existing language switch.
2. **Company briefing: change the ending** — Open the existing briefing example and inspect how the closing is revised for the listener. Link to `/companies/#brief-example`.
3. **School exercise: explain it clearly** — Open the school page and find the existing “Explain it to a younger student” exercise. Link to `/schools/`. Do not publish a made-up `#school-exercise` target; adding a dedicated anchor would be a separate product edit.

Keep each description about the visitor’s next inspection or action. Do not paste the first attempt, feedback, retry, company wording, school prompt or school steps into the homepage. Do not add claims that these examples are client work, student results, representative outcomes, guaranteed improvements or standard packages. The section should make the method inspectable while leaving the current pages as the source of detail.

## Testable hypothesis and release checks

**Hypothesis:** If a visitor can move from the existing method statement to one concrete practice preview for each audience in one click, then the homepage makes the method easier to inspect without adding lesson duplication or unverified claims.

Before any later product edit, record each result as PASS, FAIL or NOT_CHECKED:

- The new section appears once, after the method and before contact, with one heading and three links.
- The coaching link reaches the existing `feedback-example` section, and English/Chinese destinations preserve the same pause/retry meaning.
- The company link reaches the existing `brief-example` section.
- The school link reaches `/schools/` and names the existing exercise without claiming a direct anchor.
- Link text and descriptions say what the visitor will inspect or try; they do not imply outcomes, testimonials, partnerships, availability, price or guarantees.
- The homepage does not repeat the full course, company or school example content.
- The section uses ordinary HTML links, remains understandable without JavaScript, and does not add a client island.
- The section is readable at narrow widths and keyboard users can identify all three destinations.
- Live route resolution, rendered placement, mobile reflow, keyboard behavior and language parity remain **NOT_CHECKED** in this research because no browser or build verification was authorized.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Leadership Training Programs](https://www.ccl.org/leadership-programs/) | Center for Creative Leadership | HTTP 200 on 2026-09-07; official program index with “Compare” side-by-side selection for 2 or 3 programs, audience/modality/fit cards, “Explore Program” actions, and a high-level preview of feedback, experiential practice and goal-setting. Used only for information architecture. |
| `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipHome.astro` | SpeakKai source | Existing homepage method and audience routes inspected read-only. |
| `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipCoursePage.astro` | SpeakKai source | Existing bilingual feedback example, pause/retry sequence and `feedback-example` anchor inspected read-only. |
| `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipBriefExample.astro` | SpeakKai source | Existing company revision and `brief-example` anchor inspected read-only. |
| `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipOfferPage.astro` and `src\data\flagshipOffers.ts` | SpeakKai source | Existing school exercise and absence of a dedicated exercise anchor inspected read-only. |

## Unavailable or unverified

- An IDEO online-courses URL and a Harvard Business online-learning URL attempted during the bounded pass returned HTTP 404; neither was used as evidence.
- No claim about CCL program quality, SpeakKai learning outcomes, conversion, link clicks, route availability, rendered layout, accessibility, translation quality or live deployment was established.
