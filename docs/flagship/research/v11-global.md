# V11 global benchmark: bilingual course-copy editorial workflow

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded research before changes. The target is a paired English/Chinese editor for the Young Competition Speakers course page, with shared numerical facts, an Astro build check, editor-note exclusion, and real Keystatic UI save/restore verification. No product edit, build, or shared-browser inspection was performed.

## Repeatable page structure

[Duarte’s Storytelling for Business Presentations course page](https://www.duarte.com/training/storytelling-for-business-presentations/) returned HTTP 200 and exposes a useful course-page order: short promise, problem, audience, delivery/workload, learning gains, FAQs, and a direct “Talk with Our Team” inquiry route. Its structured data declares online and onsite instances with eight-hour and one-day workloads, plus leaders, managers, cross-functional teams, and L&D/HR as the audience.

Use that sequence as an editorial checklist for SpeakKai. Duarte’s testimonials, “Proof It Works” claims, and branded method references remain provider content and are not evidence for SpeakKai outcomes.

## Keystatic fit

The official [Singletons](https://keystatic.com/docs/singletons) documentation describes a singleton as a one-of-a-kind entry such as site settings or a homepage. That fits one flagship course page. [Object fields](https://keystatic.com/docs/fields/object) support nested schemas and grouped field labels/descriptions. [Local mode](https://keystatic.com/docs/local-mode) stores content directly on the local filesystem. [Format options](https://keystatic.com/docs/format-options) says JSON can be selected with `format: { data: 'json' }`, producing an `index.json` entry file.

Recommended schema boundary:

- `facts`: one shared object for dates, class count, duration, grade range, format, location, and status. Store dates in a stable machine-readable form; localize only their display.
- `copy.en` and `copy.zhHans`: parallel objects for title, summary, audience explanation, practice focus, FAQs, CTA, and inquiry note. Do not duplicate numbers or dates inside either copy object.
- `editorNote`: an internal editorial field outside the public render model, with clear UI description that it must never ship.

This prevents an editor from “translating” a number into a different scope. It also makes parity review mechanical: compare the two copy objects for required keys, while comparing facts once.

## Implementation and QA recommendation

Build a paired editor with identical field order and labels for English and Simplified Chinese. Render both views from the same facts object, expose an explicit language switch, and keep inquiry framed as a discussion rather than an automatic booking.

Astro should explicitly select public fields when rendering. Add a build validation that parses the generated course JSON, checks required bilingual keys and shared fact types, confirms the public HTML contains the course facts and both CTA labels, and fails if `editorNote` or its value appears in generated output. This is an implementation safeguard, not proof until a real build passes.

Use the real Keystatic UI to edit one English sentence, one Chinese sentence, and one shared fact; save; reload the editor; and restore the original values. Confirm that save/restore preserves both language objects, leaves shared numbers identical, and does not expose `editorNote` publicly. Record each check as **PASS**, **FAIL**, or **NOT_CHECKED**.

## Source limits

The Duarte review is one English provider page and does not prove translation quality, editorial parity, Astro output, Keystatic persistence, or inquiry safety. The Keystatic docs describe supported configuration and file formats; they do not validate SpeakKai’s chosen schema or current checkout. No build or real UI save/restore was run in this research pass.

## Source ledger

| Source | Publisher | Verified observation |
|---|---|---|
| [Storytelling for Business Presentations](https://www.duarte.com/training/storytelling-for-business-presentations/) | Duarte | HTTP 200; clear audience, delivery/workload, learning-focus, FAQ, and direct inquiry structure |
| [Singletons](https://keystatic.com/docs/singletons) | Thinkmill / Keystatic | Singleton is for one-of-a-kind data entries and supports path/format options |
| [Object field](https://keystatic.com/docs/fields/object) | Thinkmill / Keystatic | `fields.object()` creates nested schemas and grouped fields |
| [Local mode](https://keystatic.com/docs/local-mode) | Thinkmill / Keystatic | `storage.kind: 'local'` stores content directly on the local filesystem |
| [Format options](https://keystatic.com/docs/format-options) | Thinkmill / Keystatic | `format.data: 'json'` produces JSON entry files such as `index.json` |


