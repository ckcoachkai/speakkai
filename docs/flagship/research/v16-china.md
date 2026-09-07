# V16 Chinese readable mobile offer benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only content and accessibility research. No SpeakKai product edits, builds, browser actions, submissions, or framework changes.

## One fresh official reference

[新东方官网](https://www.xdf.cn/) returned HTTP 200. Its public title is `新东方官网-新东方课程报名入口`. The HTML includes a responsive viewport declaration, `width=device-width, initial-scale=1.0`, and exposes a broad but readable offer pattern in the course area.

The visible sequence is:

1. A compact entry area with `课程分类` and categories such as `少儿素质`, `双语`, `脑力`, and `编程`.
2. A short offer title and plain-language descriptor, for example `双语故事表演` followed by `原版优质读物 阅读表演双提升`.
3. A delivery mode and one action placed together: `面授 免费预约`.
4. A related speaking offer, `思辨与口才 善思巧辩 语言逻辑 面授 免费预约`.

This gives a useful content hierarchy for a small screen: offer name → one-sentence value or scope → format/status → one action. It keeps the decision information together instead of making a reader open several panels before understanding what is offered.

The page also exposes `手机购课` and `登录/注册`, which shows that a mobile entry can be named directly in navigation. Those labels describe 新东方's own funnel and should not be copied as SpeakKai claims.

## Readability and reflow recommendations for SpeakKai

Use the same compact hierarchy for the Chinese course offer while preserving SpeakKai's confirmed facts:

```text
Young Competition Speakers
2026 年秋季 · 1–2 年级 · 18 节课
六个三课时单元；练习演讲目标为 60–90 秒
了解课程
```

If the existing direct contact action has a different verified label, keep that label. The example `了解课程` is a neutral recommendation; it does not imply enrollment, availability, or booking.

For enlarged text and narrow screens:

- Let the title, metadata, description, and action wrap naturally. Avoid fixed-height cards, clipped text, and `white-space: nowrap` on offer copy.
- Keep the order stable when text grows: course name first, confirmed scope second, format or status third, action last.
- Allow the metadata row to become stacked lines at narrow widths. The action should remain a full-width or otherwise easy-to-find control.
- Preserve the existing visual treatment through the same colors, spacing rhythm, imagery, and control style. Text reflow should change geometry only as needed for legibility.
- Do not make a reader rely on an image to understand grade, season, class count, unit structure, speech length, or showcase support. Those facts should remain selectable text.
- Keep any direct QR code or WeChat handle accompanied by a readable text label and sufficient surrounding space; do not make the image the only contact explanation.

The source's viewport also includes `maximum-scale=1.0` and `user-scalable=no`. Treat that as a caution, not a pattern to copy: SpeakKai should allow the user's normal text enlargement and should not disable zoom.

## Proposed reflow checks

These are acceptance checks for the current Astro/React/CMS site, not results from this research pass:

- At a 320–390 CSS-pixel viewport, every course title, confirmed-fact line, and primary action is readable without clipping.
- At 200% text enlargement, content remains in one reading order, cards expand vertically, and no page-level horizontal scrolling is introduced.
- At 400% text enlargement or the narrowest supported layout, the action remains reachable after the description; it may move below the metadata.
- A blank or unavailable course detail remains explicitly blank or labelled as unknown; enlarged layout must not turn missing information into a promise.

## Architecture boundary

This single source supports a content hierarchy and reflow review. It provides no evidence for migrating Astro/React/CMS content to Next.js, and no framework decision should be inferred from the public page. A migration would require separate repository-level evidence such as a measured limitation, build requirement, or verified performance regression.

## Editorial boundaries

- Keep the confirmed course facts unchanged: **Young Competition Speakers, Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, and a supported three-minute final showcase**.
- Do not copy 新东方's `免费预约`, `手机购课`, prices, teacher claims, outcomes, or delivery modes into SpeakKai unless separately verified.
- Do not add fees, schedules, guarantees, certificates, competition results, language promises, or a new contact identifier.
- This benchmark is about readable text hierarchy and mobile reflow. No mobile rendering, browser measurement, product edit, or Next.js migration was performed.

## Source limits

新东方官网 is an accessible official public education homepage checked on 2026-09-07. Its course descriptions, labels, and commercial claims are publisher-presented; only the visible information hierarchy is reused here. The `user-scalable=no` observation is reported as a caution. No broad Chinese education or social-platform sweep was performed.
