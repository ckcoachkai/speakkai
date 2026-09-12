# Public homework page

Route: `/hw/`. Public content: `public/data/homework.json`. Kai explicitly authorised publishing the recorded first-name rosters on September 12. Individual feedback, private Sheet links, task IDs and source-message identifiers remain excluded.

## Update procedure

1. Read the newly dictated assignment. Confirm which existing class it belongs to; do not infer identity from a student's name alone.
2. Append a record to that class's assignments with a unique ID, the actual assignment date, task steps and next-class preparation. Preserve earlier assignments. Correct an existing entry in place only when correcting that same assignment.
3. Use class-wide homework only. Editorial suggestions and curriculum targets must not become historical assignments. If no homework was supplied, keep the assignments empty or retain the previous dated entry.
4. Set updatedAt to the real update timestamp with timezone. Run `node --test scripts/check-homework.mjs`, `npm run build`, and the existing release checks.
5. Commit and deploy through the site's existing main-branch GitHub Pages workflow, then verify `/data/homework.json` and `/hw/` live.

The browser fetches the public JSON on load, on returning to the tab, once per minute while visible, and on manual refresh. It chooses the latest assignment on or before the current Shanghai calendar date; older entries are available under Previous homework. Selection links use `/hw/#class-id`. Date changes trigger recalculation even when the JSON is unchanged. Fetch failures retain the last loaded content and display an error. With JavaScript disabled, the build-time snapshot remains readable.

Time-based display does not generate or infer new homework. The static site cannot read private chats. New dictated assignments must go through the update procedure above. No private Google Sheet has been published or connected.

## Initial content provenance

Assignments were taken from the recovered September 5, 10 and 11 class dictation discussed with Kai. Saturday introductory homework was recorded in a September 7 follow-up. Thursday afternoon and Friday later class had no distinct recovered assignment. Class labels use day, broad course type and only recorded times; they deliberately avoid mapping the Grade 8/upper-grade curriculum to an unconfirmed roster.

## Date and time display revision

Kai requested exact dates and class times instead of weekday/course labels, and removal of the introductory marketing and update text. The selector and headings now use assignment date plus class time. The empty Thursday and Friday records retain the date of the recorded class. Existing hash links remain supported.

Times checked against Kai Schedule 2026, September grid: September 10 Thursday 15:30–17:30 and 18:15–20:15; September 11 Friday 15:40–17:40 and 18:00–20:00. The scheduled Friday afternoon slot takes precedence over the dictated rounded 15:30–17:30. Kai explicitly confirmed Saturday Grade 8–9 as 13:00–15:00. The September 12/19 Saturday schedule lists 15:30–17:30 and 17:30–19:30 for the following classes; those recurring slots identify the earlier Saturday homework groups. September 5 is blank in that schedule, so it does not independently verify that day's attendance or actual start/end times. No schedule was edited.

## Rollback

Revert the homework feature commit and deploy main to remove the new page. For a content correction, restore the preceding approved JSON version and deploy. The feature does not alter the schedule sync or existing pages.

## Card layout and roster update

Homework appears in a responsive grid of cards with the class date/time, recorded first names and full assignment. At narrow widths cards stack. The unresolved name Cannon in the Thursday later dictation is not published as an additional student; the five clearly recorded names are retained until attribution is confirmed. Kaka is included from the explicit Friday roster even without an individual observation.
