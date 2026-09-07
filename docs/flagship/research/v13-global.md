# V13 global benchmark: localized one-object story with a static fallback

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded public-page research before changes to the existing introductory one-object story practice. The target is one Chinese-localized practice view, a printable/static fallback, and an explicit language switch. No product edit, build, or shared-browser inspection was performed.

## Education benchmark

[TED-Ed Student Talks](https://ed.ted.com/student_talks) returned HTTP 200. The page describes free, customizable educator activities for students ages 6–18, with students identifying, developing, and sharing ideas. Its visible structure is repeatable: explain the purpose, show how the program works, give a concrete application/resource action, and describe what students practise. The page also names educator context and provides guided resources.

This supports a small SpeakKai routine where the learner chooses one ordinary object, gives it a clear point of view or story, shares it, and makes one revision. TED-Ed’s program claims, application process, and learning outcomes remain its content; they are not evidence for SpeakKai results.

## V13 recommendation

Give the practice one stable entry label: **One-Object Story｜一个物件的故事**. The selected view should show the same five blocks in English and Simplified Chinese:

1. purpose and audience;
2. choose one safe, ordinary object;
3. speak using three short prompts: what it is, why it matters, and one moment or detail;
4. listener or self-check;
5. retry and one reflection.

Render both languages from the same practice data and keep the task contract identical. Use explicit English and 中文 links or buttons near the title. A same-route switch may be progressively enhanced, but the server-rendered page must leave one complete language view usable if JavaScript is absent or delayed. A print action should print the selected language’s title, prompts, time target, example, and reflection; do not print hidden duplicate language blocks or editor-only notes.

Use a direct, observable hypothesis: **If a first-time learner can open the Chinese entry, choose one object, complete the three prompts, print the instructions, and retry without JavaScript, then language discovery and static resilience are adequate for this practice.** This is a test hypothesis, not a learning-outcome claim.

For accessibility, set the page language and each mixed-language passage with valid BCP 47 lang values such as en and zh-Hans, following [W3C Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html), [W3C Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html), and [MDN lang guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang). If English and Chinese later receive separate indexable URLs, add reciprocal hreflang only after both pages are complete and fact-matched; a same-route switch does not create alternate URLs by itself.

## Checks before release

- Open the Chinese entry directly from its intended offer/resource link; confirm the title, prompt order, time target, example, and retry action are present.
- Switch English → 中文 → English with keyboard and touch; preserve the current practice state or clearly announce a reset.
- Disable JavaScript and print from the resulting page; confirm all required instructions and no editor note are exposed.
- Compare English and Chinese required keys and any shared numbers, then test 200% text and a narrow viewport.
- Record each result as PASS, FAIL, or NOT_CHECKED. This pass did not test translation quality, live interaction, print rendering, screen-reader output, or learning improvement.

## Source ledger

| Source | Publisher | Verified observation |
|---|---|---|
| [TED-Ed Student Talks](https://ed.ted.com/student_talks) | TED-Ed | HTTP 200; educator-led student idea development, sharing, guided resources, ages 6–18, and a concrete application path |
| [Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) / [Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) | W3C WAI | Page and language passages must be programmatically determinable |
| [lang global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) | MDN Web Docs | Use valid BCP 47 language tags for page and language parts |
