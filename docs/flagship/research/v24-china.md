# V24 Chinese resource-index benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only pre-edit research for translating the resource index and two practice activities. No SpeakKai edits, builds, browser actions, bookings, outreach, or social-platform searches.

## One fresh official Chinese resource hub

[新东方官网](https://www.xdf.cn/) returned HTTP 200 on 2026-09-07. The public title is `新东方官网-新东方课程报名入口`; the fetched HTML was 418,986 UTF-8 bytes.

The homepage exposes a resource-oriented `知识加油站` / `活动资料` area and a visible learning sequence:

- `预` — `养成循序渐进的预习习惯`
- `学` — `知识点视频精准同步学习`
- `练` — `配套习题线上个性化练习`
- `测` — `阶段测不断夯实知识理解`
- `评` — `智能报告评判诊断薄弱项`

Resource cards make scope discoverable in the title or label. Examples include `6年级英语 | 代词介词连词3大专题轻松学（含配套习题）`, `9年级化学 | 总复习！120分钟精讲化学计算重难点`, `7-9年级英语 | 高频词汇先记全，完形填空不再难`, `六升七专属 24节专题课 | 全科知识入门`, and `系列题集 | 语数英模块复习，重点知识持续强化（含题目解析）`.

This demonstrates a useful information pattern: show the learner or group, the scope or duration, what kind of practice follows, and the next action in the discovery surface. The provider's claims such as `不再难`, `夯实`, or `精准` are publisher language and are not evidence of outcomes.

## Hypothesis for SpeakKai's Chinese resource pages

Put the decision information on every resource card instead of making a visitor open the activity to learn whether it fits:

```text
适合：学校小组
约 12 分钟 · 5 个步骤
开始练习
```

For the three existing audience lanes, use `学生与家长`, `学校与教育工作者`, and `成人与职场团队` only where the source activity supports that audience. Keep a separate `适合对象` or `适合` label from `形式`; do not turn a free activity into a course, placement assessment, or service offer. Use `约 N 分钟 · N 个步骤` on the index and retain each step's actual minute value on the detail page.

Suggested Chinese labels:

- Resource index: `表达练习资源`, `适合对象`, `约 12 分钟 · 5 个步骤`, `开始练习`.
- Detail metadata: `适合对象`, `练习形式`, `预计用时`, `需要准备`, `练习步骤`.
- A printable or optional aid: `打开练习单`; keep it separate from the primary `开始练习` action.

## Translation hypotheses for the two new activities

**Explain it, then swap** should remain a school-group activity, not a general child course:

- `适合对象：学校小组`
- `练习形式：两人一组，可由教师或带领者引导`
- `约 12 分钟 · 5 个步骤`
- `需要准备：一个熟悉的话题；笔记可选`
- `练习步骤：一起选一个想法 / 准备一个重点和一个例子 / 表达、倾听，再交换角色 / 再试一个更清楚的版本 / 选择下一步`

Keep the five step durations as **2、2、3、3、2 分钟**. Preserve the source's age-appropriate-topic instruction without inventing a grade range. Preserve the privacy boundary that partners choose something they can explain without sharing private experiences, and retain the instruction to describe the explanation rather than judge the person.

**The one-minute brief** should identify an adult workplace audience and a practice partner:

- `适合对象：成人与职场团队`
- `练习形式：与同事或练习伙伴一起`
- `约 10 分钟 · 5 个步骤`
- `需要准备：一个概括性的情境；如有需要可准备几条笔记`
- `练习步骤：选择听众 / 搭建简报 / 用一分钟说出来 / 确认听众听懂了什么 / 做一处调整，再试一次`

Keep the five step durations as **2、2、1、2、3 分钟**, including the source's `约 45–60 秒` spoken version. Translate the guardrails directly: keep customer, personnel, and confidential company details out; state assumptions as assumptions; do not invent evidence or results; and make clear that feedback is not a prediction of approval or business success.

The source supports discoverability and instruction labels only. It does not verify SpeakKai's audience outcomes, completion rates, printable-file behavior, or any commercial offer. No new age range, certificate, score, result, or guarantee should be added during translation.

No Bilibili, Zhihu, WeChat, Douyin, or Xiaohongshu search was performed for V24. Earlier bounded work recorded Bilibili CAPTCHA, Zhihu HTTP 403, WeChat article anti-spider redirects, Douyin's JavaScript shell, and unavailable Xiaohongshu search or account metrics; those limits remain unrefreshed and provide no evidence here.
