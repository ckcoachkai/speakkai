# V26 Chinese short teaching video benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only pre-edit research for a silent, original 18-second motion lesson and its static alternative. No SpeakKai edits, builds, browser actions, publishing, or social-platform outreach.

## One fresh official Chinese education reference

[British Council China: 在线英语学习资源](https://www.britishcouncil.cn/english/online) returned HTTP 200 on 2026-09-07. The public title is `英国文化教育协会英语学习网络资源`; the fetched HTML was 32,902 UTF-8 bytes.

The page organizes discovery by audience and mode. It names `成人英语学习网 LearnEnglish`, `儿童英语学习网 LearnEnglish Kids`, and `青少年英语学习网 LearnEnglish Teens`; the teen route is explicitly described as for `13至17岁的英语学习者`. It also lists `互动视频、游戏和练习` for teens, and `做游戏、听歌曲、讲故事` for children, while the wider resource description names `音频，视频，游戏、文章以及互动练习`. It says teachers can use the children’s resources in class and parents can use the related section for extra support.

This is useful discovery structure: audience first, then a media or activity type, with static modes alongside video. The fetched Chinese hub exposes no video duration, spoken-language, caption, or transcript label. No client-side playback or linked resource behavior was tested. The provider’s learning and improvement statements are publisher claims and are not evidence for SpeakKai outcomes.

## SpeakKai hypothesis

Present the motion lesson as a tiny practice example, with language and duration visible before playback:

```text
重点 · 例子 · 确认
中文文字版 · 无旁白 · 约 18 秒
虚构练习示例
```

Use three quiet six-second beats, with large Chinese text and simple shape or line motion:

1. `重点：我建议每周一次项目碰头会。`
2. `例子：这样我们有固定时间讨论问题。`
3. `确认：你愿意先试行两周，再一起决定是否继续吗？`

Keep the scenario fictional and the wording as practice text. Add a persistent alternative beside the motion control: `阅读文字步骤` or `查看完整练习单`. The static route should preserve the same three labels and sentences, allow the visitor to read at their own pace, and carry a visible `中文` language label with an `English` counterpart only when that version exists.

Do not add a presenter portrait, voice, testimonial, result, score, or promise. Treat `约 18 秒` as the authored duration of this animation, not a measured playback result. A later implementation audit should verify the actual rendered duration, silent audio state, text legibility, and static alternative; this source does not verify any of those technical properties.
