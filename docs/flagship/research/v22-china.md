# V22 bilingual language-switch benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only research and copy recommendation. No SpeakKai product edits, builds, browser actions, redirects, storage changes, or social-platform searches.

## One fresh official bilingual reference

[British Council China](https://www.britishcouncil.cn/) returned HTTP 200 with `lang="zh"` and canonical `/`. Its explicit English counterpart, [British Council China English](https://www.britishcouncil.cn/en), returned HTTP 200 with `lang="en"` and canonical `/en`.

Both public HTML responses expose the same small language choice:

- `Choose your language`
- `中文` → `/`
- `English` → `/en`

The English page reverses the active order (`English`, `中文`) and keeps the same direct route model. No automatic redirect or language-storage behavior was evidenced in the fetched HTML. The responses contained no `hreflang` links, so this source demonstrates visible route selection, not complete search metadata.

The site also keeps parallel information architecture across languages. Examples include `英语学习` / `Learn English`, `企业培训` / `Corporate training solutions`, `英语教学` / `TeachingEnglish`, `英语教师CPD` / `CPD for English Teachers`, and `全球伙伴学校联盟` / `British Council Partner Schools`. Content cards use the direct action pair `了解更多` / `Learn more`.

## Recommended SpeakKai convention

Use a persistent, compact top switch on equivalent English and Chinese pages:

```text
English | 中文
```

Recommended behavior:

- Keep the switch visible in the top navigation on both language versions.
- Link directly to the equivalent route: English course page ↔ `/zh/` course page; English resource page ↔ `/zh/` resource page.
- Mark the active language with `aria-current="page"` and a visible state. Use an accessible label such as `选择语言` / `Choose language`.
- Do not show a language splash, auto-redirect by browser locale, or persist a language choice in local storage. The visitor chooses deliberately and can switch again at any time.
- Preserve the current route's query-free destination when switching; do not send a visitor to the homepage or a booking flow merely because the language changed.

## Concise Chinese homepage labels

Use short labels whose action is clear:

- `中文` — language choice; pair with `English`.
- `了解课程` — read course information.
- `打开练习` — open a resource without implying enrollment.
- `开始练习` — start an actual free exercise.
- `联系 Kai` — open the direct contact route.
- `查看示例` — open an illustrative example.

Avoid `立即报名`, `马上预约`, `免费领取`, or `提交申请` unless that exact operational path, availability, and consequence are verified. The language switch itself should be labelled `English` / `中文`, not an ambiguous `切换` button with no visible destination.

For the Chinese homepage, keep a short parallel sentence near the switch or primary entry:

> `中文页面提供同一组课程与练习信息；点击 English 可查看对应英文页面。`

This describes route parity without claiming that every translation, booking detail, or future page is complete. If space is tight, the switch alone is sufficient; do not add a splash screen solely to explain it.

## Claim and route boundaries

- A language switch is navigation, not a booking, registration, or account action.
- Keep direct contact and QR routes unchanged and visible; language selection must not send a message, reserve a place, or confirm availability.
- Keep the confirmed course facts unchanged: **Young Competition Speakers, Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, and a supported three-minute final showcase**.
- Do not claim perfect translation parity, language-specific outcomes, existing partnerships, prices, or available places from the switch pattern.
- British Council's parallel labels are a structural reference only; its courses, partnerships, results, and institutional claims are publisher-presented and do not transfer to SpeakKai.

## Source and platform limits

British Council China is an accessible official bilingual education site checked on 2026-09-07. The root and `/en` responses support the visible language-link and route observations above. Absence of redirect or storage code in server HTML is not proof that every client-side behavior is absent; no browser test was performed.

No Bilibili, Zhihu, WeChat, Douyin, or Xiaohongshu search was performed for V22. Earlier bounded work recorded Bilibili CAPTCHA, Zhihu HTTP 403, WeChat article anti-spider redirects, Douyin's JavaScript shell, and unavailable Xiaohongshu search/account metrics; those limitations remain unrefreshed and provide no evidence here.
