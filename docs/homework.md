# Public homework page

The `/hw/` page presents one compact trading card for each class. Each card shows the exact date and Shanghai time, the students, class content, and homework for the selected dated session. Older and newer controls move through the recorded sessions for that class without inventing week numbers or missing lessons. Cards remain readable in a responsive grid and with JavaScript disabled through the build-time snapshot.

## Copy and feedback behavior

The card has separate plain-text controls for class content, homework, or both. Copied text is headed by the selected date and time and uses readable bullets and numbered homework steps. If the browser denies clipboard access, a selectable text area appears so the user can press Ctrl+C or use the device copy command.

Student names with a supplied feedback URL open the owner-private feedback row in a new tab with `noopener`, `noreferrer`, and no referrer. A name without a URL remains clickable and reports that no individual feedback is recorded for that student for the selected class. These links are expected to require the owner's Google account; publishing the link does not make the private workbook public.

## Public data contract

`public/data/homework.json` uses version 2:

```json
{
  "version": 2,
  "updatedAt": "2026-09-12T10:00:00+08:00",
  "timeZone": "Asia/Shanghai",
  "classes": [{
    "id": "class-id",
    "sessions": [{
      "id": "class-id-2026-09-12",
      "date": "2026-09-12",
      "time": "13:00–15:00",
      "students": [{ "name": "Student", "feedbackUrl": null }],
      "classContent": ["Observable class content"],
      "homework": {
        "title": "Assignment title",
        "steps": ["A concrete step"],
        "prepareFor": "the next class",
        "note": "Optional context"
      }
    }]
  }]
}
```

`homework` may be `null`, and `note` is optional. Empty class content or missing homework is shown as “Not recorded for this class.” Every session is a dated record; future sessions are hidden until their date arrives in Shanghai. The validator rejects unexpected fields, invalid dates or times, duplicate IDs, and feedback URLs outside the secure Google feedback destinations.

## Update procedure

1. Read the newly dictated assignment or class content. Confirm which existing class and dated session it belongs to; do not infer identity from a student's name alone.
2. Add or correct the matching session with its actual date, time, students, class content, and homework. Preserve earlier sessions. Do not fabricate a missing week or convert curriculum suggestions into historical homework.
3. Verify the exact student and class against the current private Google Sheets row before adding its `feedbackUrl`. Confirm that the destination remains private. Use `null` when no individual feedback is recorded.
4. Set `updatedAt` to the real update timestamp with timezone. Run `node --test scripts/check-homework.mjs`, `npm run build`, and the existing release checks.
5. Commit and deploy through the site's existing main-branch GitHub Pages workflow, then verify `/data/homework.json` and `/hw/` live.

The browser fetches the public JSON on load, when the tab becomes visible, once per minute while visible, and on manual refresh. It follows the latest session on or before the current Shanghai calendar date by default. Deliberate browsing of an older session stays on that session across refreshes; returning to the newest session resumes following updates. Fetch failures retain the last loaded content and display an error. Copy and filtering remain usable from the build-time snapshot if the initial JSON fetch fails. The static page does not read private chats or generate new homework.

## Initial content provenance

The initial content comes from the recovered September 5, 10, and 11 class dictation and the September 7 follow-up. Exact recurring times were checked against Kai Schedule 2026 where available. Student first names were explicitly authorised for this public page. Unresolved names remain excluded until attribution is confirmed. Individual feedback, task IDs, source-message identifiers, and the private archive remain outside the public JSON.

The September 12 update contains one confidently matched session for each of seven current classes, 34 verified private feedback links, and one unlinked student name with a missing-feedback message. Older archive records could not safely be assigned to these current classes from their dates and rosters, so they remain unattached. Navigation buttons are disabled at the boundaries and will become available as confirmed sessions are appended. Browser-only fixtures test multiweek navigation; they are not published lesson records.

September 5 is blank in the schedule. Its Saturday times come from Kai's confirmation and the following Saturday's recurring slots, not independent proof of attendance or actual start/end times on September 5. The archive's raw class-date uncertainty is preserved in the private workbook. The current card dates retain the September class mapping established in the conversation. Friday afternoon uses the scheduled 15:40–17:40 rather than the rounded dictated 15:30–17:30. Cannon remains unresolved; Kaka is on the roster without a recovered feedback entry. No schedule or workbook sharing permission was changed.

## Rollback

Revert the homework feature commit and deploy `main` to remove the page. For a content correction, restore the preceding approved JSON version and deploy. The feature does not alter schedule sync or other site pages.
