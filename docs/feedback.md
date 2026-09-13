# Student feedback page

`/fb/` displays Kai's educational feedback in English and Chinese. `/FB/` redirects to the canonical lowercase route. Kai explicitly requested public student feedback and updates every three hours on September 13, 2026; the earlier private-link-only homework design is superseded for these published entries. Raw dictation, provenance, unresolved identities, and sensitive private matters remain outside the public repository.

The initial release contains 49 bilingual feedback entries, two explicit missing-feedback entries, and one cancelled session across eight class groups and eleven dated sessions. These are records, not counts of unique students. The data includes the earlier September 5/10/11 class mapping and newly recovered September 12/13 observations. Berlingo's spelling was explicitly confirmed by Kai. Kai subsequently identified the missing Sunday student as Yiyi; her observation previously transcribed as E is now included.

## Display and copying

Each dated class shows Class content and Homework above the student cards, in the selected EN/CN language. Unrecorded sections display exactly `N/A`. Each section has its own Copy button, including `N/A` when absent. Sections follow the selected historical session; future planned curriculum is never substituted for actual class content or assigned homework.


The initial selection is the newest recorded class. The initial date window covers the latest seven Shanghai calendar dates, including today. The class selector includes all classes; the week selector and earlier/later buttons navigate recorded seven-day windows. A class with no feedback in the selected window shows an empty state rather than substituting old comments. Future entries are excluded from the view.

EN and CN select both the interface and feedback language, and the browser remembers the language where storage is available. Every student's Copy button copies only that student's selected-language feedback with its class date, time, and name. A clipboard denial opens a selected-text dialog for manual copying. No message is sent to a parent.

The browser uses the build-time data immediately and checks `/data/feedback.json` on load, on returning to the tab, every visible minute, and on manual refresh. A failed fetch retains the last working data and copy controls. Class and week selections remain selected during updates; the default class follows the newest available class until the user makes a choice.

Deep links use `/fb/?class=<class-id>&date=YYYY-MM-DD&student=<student-id>`. The class/date selects the correct history window, and the student parameter scrolls to the corresponding card. `/hw/` now uses these links for published feedback. Missing feedback has no fabricated destination.

## Data and updates

`public/data/feedback.json` has a strict public-only schema: document version, update timestamp, timezone, classes with localized labels, and sessions with date, time, held/cancelled status students, and optional bilingual `classContent`/`homework` text pairs or null. Their English content matches the same dated homework-page record; Chinese translations preserve all assignment details. Each student has a stable class-scoped ID, display name, and paired `en`/`zh` text or two null values. Sessions and older comments are retained, and later attempts update the relevant student's cumulative record.

The scheduled Codex workflow is documented in the private Speak Feedback research repository's `FEEDBACK-PUBLISHING.md`. Its source collector reads original user messages, then the agent reconciles the schedule, identities, chronology and translation before committing a publication. The browser itself has no access to private Codex data or the private Google Sheet. A scheduled run with no new publishable content creates no website commit.

Before releasing, run `node --test scripts/check-feedback.mjs scripts/check-homework.mjs`, `npm run build`, and the existing release checks. Verify copying in both languages, history/class selection, missing and cancelled sessions, mobile layout, deep links, and retained content after a refresh failure in a real browser. Only a successful deployment plus inspection of the public page establishes that an update is live.

For rollback, revert the intended publication commit after checking for newer work; do not overwrite other changes or delete earlier valid history. The schedule and private workbook permissions are never changed by this feature.
