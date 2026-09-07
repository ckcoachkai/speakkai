# V18 Chinese feedback and story-detail example

Checked: 2026-09-07 (Asia/Shanghai). Read-only research and copy recommendation. No SpeakKai product edits, builds, browser actions, submissions, or messages.

## Continuity review

The current flagship editorial source is the V18 worktree at `src/content/flagship/course-editorial.json`, with its paired display copy in `src/data/courseCopy.ts`. The existing Chinese feedback framing is:

- `下面的示例展示了如何把反馈转化为下一次可以尝试的行动。`
- `“你的例子让我想象出了那个场景。试着在最后一句前停顿一下，让我听清它为什么重要。”`
- `学生再试一次结尾，听众观察这次有什么变化。`

The new recommendation should extend that exact teaching idea: ask for one concrete detail, then preserve the ending wording while marking a non-spoken pause before it. It should remain a demonstration rather than a student evaluation.

## One fresh official Chinese provider

[EF 中国大陆地区](https://www.ef.com.cn/) returned HTTP 200 on 2026-09-07. The official page describes its youth offering for ages 3–18 and places expression activities under `语言表达`. It names `故事表演、朗诵演讲、播音主持、戏剧表演` and includes a course called `未来演说星`.

The page also describes a broader learning route involving classroom instruction, an interactive language laboratory, and English clubs that include an `优秀英语演讲赛`. This makes speaking practice concrete through recognizable activity formats and places where speaking can happen. It does not show a short teacher prompt, a specific story detail, a before/after utterance, or a listener question.

EF's descriptions of confidence, learning speed, teacher qualifications, and program quality are publisher-presented claims. This source is used only to support the choice of story, speech, and performance as recognizable activity forms; it is not evidence of outcomes or a reason to copy EF wording into SpeakKai.

## Recommended paired fictional example

Place this under the existing **feedback example** on the English and Chinese course pages, or in **Resources** as a small practice demonstration. Use the label:

> `反馈示例 · 虚构练习 · 并非学生评价`

Boundary copy:

> 以下是为说明练习流程而写的虚构示例，不是真实学生案例，也不代表学习结果。

Keep two editable content fields for the shared story meaning so the English and Chinese displays cannot drift:

- `opening`: `我喜欢我们班的图书角。` / `I like our class library.`
- `ending`: `它让我觉得很安静。` / `It makes me feel calm.`

Recommended Chinese display:

```text
初次表达
“我喜欢我们班的图书角。它让我觉得很安静。”

老师的问题
“你能说一个我们可以看见的具体细节吗？”

再次尝试
“我喜欢我们班的图书角，窗边有一本蓝色恐龙书。【停顿】它让我觉得很安静。”
```

The English pairing is:

```text
First try
“I like our class library. It makes me feel calm.”

Teacher question
“Can you add one concrete detail that we can picture?”

Second try
“I like our class library because there is a blue dinosaur book by the window. [Pause] It makes me feel calm.”
```

`【停顿】` / `[Pause]` is an instruction cue, not spoken text. The ending sentence stays the same on the second try; the first sentence gains one visible detail, and the speaker pauses before the meaning sentence. The teacher asks one question and the example stops there. It does not claim that the second version was better, that a learner improved, or that a result followed.

## Editorial and age-fit guidance

- Keep the example to two short sentences on each attempt. The first attempt establishes the object and feeling; the second adds one concrete, age-appropriate detail and the pause cue.
- Use familiar school imagery and simple verbs. A class library, a window, and a blue dinosaur book are fictional details, not a student record.
- Keep the question singular and actionable. `你能说一个我们可以看见的具体细节吗？` asks for one addition without scoring or diagnosing.
- Render the pause cue visually and accessibly, while excluding it from any spoken-text or copy-to-speech string.
- Keep `opening` and `ending` as shared editable fields for English and Simplified Chinese. The Chinese and English labels can be localized separately, but the story facts and retry logic should come from the same example record.
- Retain the existing course facts exactly: **Young Competition Speakers, Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, and a supported three-minute final showcase**.
- Do not label this as a class, placement assessment, client story, testimonial, improvement proof, or guaranteed method.

## Source limits

EF 中国大陆地区 is an accessible official public education page checked on 2026-09-07. Its age ranges, course names, activity descriptions, teacher claims, and outcome language are publisher-presented. No independent teaching evidence, real lesson recording, feedback transcript, or learner result was verified. No Bilibili, Zhihu, WeChat, or other social-platform search was performed.
