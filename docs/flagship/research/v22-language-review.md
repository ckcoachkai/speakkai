# V22 Chinese homepage language review

Checked: 2026-09-07 (Asia/Shanghai). Read-only review of the Chinese home copy, the current-program translation, the method-example labels, and shared flagship navigation/footer. No edits, builds, or browser validation were performed.

## Fixes recommended

1. **Audience label mismatch — `homeCopy.ts`.** `选择你的需求` means “choose your need,” while the English label asks the visitor to choose an audience. Because the three links are students, schools, and companies, use `选择适合你的入口` (or the more literal `选择你的受众`). The first option is more natural navigation copy.

2. **QR action precision — `homeCopy.ts`.** The Chinese `contactAction` is `打开微信联系方式`, but the homepage button opens the QR image directly. Use `打开微信二维码` or `打开微信联系卡` so the label matches the destination. The separate `qrLabel` is understandable, though `打开微信联系二维码` is slightly cleaner than `打开完整微信联系二维码`.

3. **Generated numeric phrasing — `FlagshipCurrentProgram.astro`.** The output `6 个3节课单元` is understandable but visually awkward. Use the equivalent `6 个三节课单元` or `6 个每个 3 节课的单元`. The numbers remain correct: 6 units × 3 classes = 18 classes, 60–90 seconds, and a supported 3-minute showcase.

4. **Naturalness in the student offer — `homeCopy.ts`.** `围绕日常开口的信心` is literal and awkward. `围绕日常表达的自信和重要的演讲时刻` reads more naturally while preserving the English meaning.

## Optional polish

- `看看如何练习。` is friendly and understandable. `看看练习如何进行。` is slightly clearer for a page heading.
- `你希望自己的表达，带来什么？` is understandable but broad. `你希望自己的表达发挥什么作用？` is more idiomatic and closer to “What do you want your voice to do?”
- `让演讲更出色，也让表达者更有力量。` is a natural slogan but shifts the English `More than a polished speech. A stronger speaker.` toward a promise of making the speech better. If closer parity is preferred, use `不只是打磨一篇演讲。让表达者更有力量。`
- `虚构故事 · 一项练习调整` in `FlagshipMethodExamples.astro` is understandable but slightly abstract. `虚构故事 · 一处表达调整` makes the one speaking change more concrete.

## Passes

- The Chinese and English offer audiences, formats, and actions align: students/parents, schools/educators, and companies/event teams.
- The current-program paragraph preserves the fixed numerical scope and does not add a fee, schedule, outcome, or guarantee.
- `First try` / `第一次尝试`, `Coach feedback` / `老师的反馈`, `Retry with one pause` / `加一处停顿，再试一次`, and `Pause` / `停顿` are age-appropriate and semantically aligned.
- The pause-help text clearly says the cue is not spoken. The listener question remains generic and exploratory; it does not claim a result.
- Shared navigation/footer wording is clear. English-only destinations are correctly surfaced as `时间安排（英文）`, and the language-switch route behavior is separate from content translation.
- The course/resource labels and fixed facts remain distinct from the free-practice example and contact boundaries.

No unsupported testimonial, partnership, fee, availability, certificate, competition result, or new numerical scope was found in the reviewed Chinese strings. These are language-review findings only, not human translation validation.
