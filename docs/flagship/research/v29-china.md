# V29 Chinese visual-practice choice benchmark

Checked: 2026-09-07 (Asia/Shanghai). One HTTP retrieval was used. Read-only research; no SpeakKai edits, builds, browser actions, image generation, or publishing.

## Fresh official reference

[British Council China: English learning mobile apps](https://www.britishcouncil.cn/english/mobile) returned HTTP 200. The title is `英国文化教育协会的英语学习移动应用APP`; the fetched response was 39,609 UTF-8 bytes.

The page presents a choice of `游戏、播客、视频、小测验` (games, podcasts, videos, and quizzes). It lists `LearnEnglish Kids: Playtime`, described by the publisher as offering more than 100 animated songs and video stories, with categories including `童话故事、经典儿童歌曲、语法儿歌`. The page says each video has optional subtitles and can be downloaded for offline viewing. It also presents `LearnEnglish Videos` for listening and reading practice and `LearnEnglish Sounds Right` as a visual pronunciation chart.

## SpeakKai hypothesis

Make the practice format explicit before a visitor starts: `动态示例` / `Motion example`, `舞台排练` / `Stage rehearsal`, or `图片故事` / `Picture story`. Where relevant, expose compact metadata such as `中文文字版` / `Chinese text version`, `无旁白` / `No narration`, and `约 18 秒` / `About 18 seconds`, only when those properties have been verified for that item.

Every visual practice item should place a static text or printable alternative beside motion, audio, or video controls. This makes the same prompt discoverable for visitors who prefer reading, need captions, or cannot use playback. Keep the control labels bilingual and literal; do not imply a real person, venue, duration, caption accuracy, or learning result.

## Evidence boundary

The server HTML did not verify individual media durations, playback behavior, caption accuracy, or learning outcomes. The source supports discoverable format choices and publisher-presented subtitle/offline options; it does not establish that any SpeakKai item will produce a particular learner result.
