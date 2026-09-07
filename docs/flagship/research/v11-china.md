# V11 bilingual course-editor workflow

Checked: 2026-09-07 (Asia/Shanghai). Refreshed source: [51Talk course system](https://www.51talk.com/global/course), HTTP 200. Its title/description states online course format and 25-minute lessons; headings then expose the curriculum and progression. This is publisher copy, not independent evidence. The useful editorial lesson is to put audience, format, and learning shape where a parent can scan them.

For SpeakKai, keep numerical scope in one fixed record, separate from editable prose:

```ts
scope: {
  season: "Fall 2026",
  audience: "Grades 1–2",
  classes: 18,
  units: 6,
  classesPerUnit: 3,
  practiceSpeechSeconds: "60–90",
  finalShowcaseMinutes: 3,
  fees: "unknown",
}
```

English and Chinese descriptions should read from the same scope record or be checked against it. Editors may improve sentence order and tone, but must not retype the date, grade range, class count, unit count, speech duration, or final duration in separate untracked fields. `fees: "unknown"` should render as “Fees confirmed directly with Kai” / `费用由 Kai 直接确认`, never as an empty string, estimate, or implied free offer.

Use paired language prose with identical content keys: `name`, `summary`, `sequence[]`, `cta`, and `boundary`. A save should require both languages or an explicit “translation pending” state; the public page should not silently fall back to a stale translation. The sequence can stay factual and high-level: explore a topic or role → build content → present and reflect. Do not add unit topics, results, certificates, or guarantees.

Before save, show a side-by-side preview and a scope checklist. Flag changed numerals, date tokens, grade labels, and fee status for review. After save, restore the record and preview in the real UI; verify that English and Chinese show the same seven scope facts, that unknown fees remain unknown, and that no stale draft reappears after reload. Keep reviewer/date and source status with the record so future edits can distinguish approved facts from draft copy.

This workflow supports the confirmed **Young Competition Speakers**, **Fall 2026**, **Grades 1–2**, **18 classes**, **six three-class units**, **60–90-second practice speeches**, and **supported three-minute final showcase**. The illustrative 10-minute speaking starter remains a separate example resource and must not become a course unit or fixed timing claim.
