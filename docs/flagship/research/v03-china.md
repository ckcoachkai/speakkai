# V03 China-facing inquiry and contact journeys

Checked: 2026-09-07 (Asia/Shanghai). Read-only public HTTP review. No sign-in, form submission, WeChat contact, account change, or publishing was performed. The two company sites below are benchmarks for inquiry design, not endorsements or independently verified outcomes.

## Enterprise reference: 时代光华

Source: [21tb.com](https://www.21tb.com/) — HTTP 200; title: “时代光华-企业数智化学习服务商-企业在线学习平台-企业培训平台-E-learning在线学习平台”. The current public home page exposes a complete B2B inquiry ladder:

- Immediate routes: `立即体验`, `申请试用`, `立即获取资料`, `预约演示`, a visible business phone (`400-618-7500`), and a public-account QR route (`扫一扫关注公众号`).
- The visible “平台试用申请” form asks for required `姓名`, `企业`, `手机号`, `省市县区`, and `需求简要描述`; the description field is prefilled in the public markup as `企业培训`. The submit action is `立即体验`.
- The page frames the offer in buyer language: learning platform, content resources, operations service, AI decision support, customer cases, and solutions for new hires and managers. It also states that a dedicated consultant will answer about detailed solutions, pricing, and implementation within three business days.
- A phone/QR/form combination supports different levels of intent: quick human contact, a reusable WeChat follow-up, or a structured lead that already carries company and need context.

What works for a company buyer: the form qualifies the organization and need before the first conversation; `申请试用` and `预约演示` say what happens next; the public page names implementation and pricing as conversation topics; the response-time language reduces uncertainty.

Gaps to keep in mind: the page is a broad enterprise-learning proposition rather than a speaking-specific one. It does not visibly ask about audience, presentation situation, participant count, date range, or delivery format. Some numerical counters rendered as `0` in the non-JavaScript text extraction, so those counters require visual confirmation before being used as proof. The form was not submitted, so lead routing and actual response time remain unverified.

## Accessible education reference: 51Talk

Sources: [51Talk home](https://www.51talk.com/) — HTTP 200; title: “51Talk是全球化的在线青少英语教育品牌”. [51Talk course system](https://www.51talk.com/global/course) — HTTP 200; title: “51Talk在线英语，打下英语语言基础，培养英语沟通交通能力”.

The parent-facing journey is concrete before contact:

- The home page leads with a child audience (`3–15岁儿童`), one-to-one foreign-teacher lessons, game-based interaction, and a progression described as `学练测辅`.
- The course page states `25分钟一节课`, describes a progressive curriculum, links it to CEFR and Cambridge exams, and gives level purposes. It explains what learners work toward at each stage rather than presenting one undifferentiated course.
- The home page shows `注册` as the primary account entry, plus `选择外教老师 → 预约上课时间 → 提前5分钟进教室` as the public “how to take a lesson” sequence. The page source contains account/phone/email verification and user/privacy agreement strings, but the registration modal was not opened and no account action was taken.
- Teacher cards show qualifications and specialties, and learner-impression categories such as `耐心讲解`, `善于鼓励`, `适当纠错`, and `善用教具`. These are publisher-presented social proof; they are not independent outcome evidence.

What works for a parent buyer: age and level are visible early; lesson length and class format reduce ambiguity; teacher choice is explained as a step; the parent can imagine the sequence from registration to booked class; course goals are stated at each level.

Gaps: the visible path is optimized for a child English subscription and does not show SpeakKai-style parent questions such as a specific speech, event deadline, confidence concern, or preferred individual/group format. Public page copy contains broad claims (for example, user scale and “high quality”) that should be treated as marketing claims. The actual registration fields, follow-up, fees, and availability were not verified.

## SpeakKai inquiry design implications

### WeChat handoff

The safest public handoff is a clear expectation that WeChat starts a conversation and does not reserve a place. A contact page or QR caption should ask the visitor to send a short brief and should state that scope, fees, timing, and availability are confirmed directly. The prefilled prompt can be:

`我是【家长 / 学校 / 企业或活动团队】。我们想为【孩子 / 学生 / 团队或活动】准备【演讲 / 讲故事 / 辩论 / presentation / 主题演讲 / 沟通工作坊】。目标是【一句话目标】；大约有【人数】人；希望在【日期范围】、以【在线 / 线下 / 待讨论】进行。`

Keep the first message free of student names, school records, internal company documents, or identifiable recordings. For a parent, a grade and speaking goal are enough. For a school or company, organization type, audience, goal, rough group size, date range, and format are enough. This preserves the existing public boundary that a schedule view or inquiry is not a booking.

### Parent questions to answer before asking for contact

1. What age/grade is the learner, and is the request for regular coaching or a defined speaking moment?
2. What do they need to do: organize ideas, tell a story, answer questions, debate, present, or prepare for a competition?
3. What is the starting point and what currently feels difficult?
4. Is there an event deadline, preferred lesson format, or group-size constraint?
5. What will a session contain, and what kind of feedback or next practice step will the learner receive?
6. Are fees, timing, availability, and any competition preparation confirmed directly rather than implied by the public page?

The page should answer the first five in plain language and collect only what is needed for the sixth conversation. Do not promise competition results.

### School questions to answer before asking for contact

1. What age range, language level, curriculum context, and speaking outcome are in scope?
2. Is the need a one-off workshop, a sequence of lessons, a showcase/project, or teacher development?
3. What are the approximate group size, timetable, room/online setup, and staff responsibilities?
4. What learning materials, rubric, feedback, and reporting cadence will be agreed?
5. What safeguarding, supervision, recording, image, and student-work permissions apply?

The useful handoff is a school programme brief request, not a consumer “buy now” flow. The first inquiry can omit student names and records.

### Company and event questions to answer before asking for contact

1. What communication situation matters: executive update, client pitch, bilingual presentation, Q&A, keynote, or team workshop?
2. Who is in the room, what should they understand or decide, and what is the event date range?
3. Is the format a keynote, half/full-day workshop, multi-session programme, or individual/executive coaching?
4. What participant count, delivery location, confidentiality constraints, and existing materials matter?
5. What tangible scope should be discussed: message structure, rehearsal, delivery feedback, materials, or follow-up?

The first form should accept a short brief rather than request confidential slides. A useful next step is “discuss fit and scope”; inquiry, schedule view, and QR scan should remain distinct from confirmation.

## Prior social-platform evidence limits

These limits were refreshed or carried forward from the same 2026-09-07 public pass:

- [Xiaohongshu creator platform](https://creator.xiaohongshu.com/) — HTTP 200, title “小红书创作服务平台”; public metadata describes video upload, data analysis, fan management, and creative guidance. [Xiaohongshu public search for 新东方](https://www.xiaohongshu.com/search_result?keyword=%E6%96%B0%E4%B8%9C%E6%96%B9) failed with a request-state error. No creator account, note count, or engagement should be treated as verified.
- [WeChat public platform](https://mp.weixin.qq.com/) — HTTP 200 shell only. [Sogou WeChat search for 演讲培训](https://weixin.sogou.com/weixin?type=2&query=%E6%BC%94%E8%AE%B2%E5%9F%B9%E8%AE%AD) returned visible snippets and titles, including speech-training and bilingual speech examples, but direct result links redirected to anti-spider. Article body, author, date, and engagement remain unverified.
- [Douyin English-speaking search](https://www.douyin.com/search/%E8%8B%B1%E8%AF%AD%E5%8F%A3%E8%AF%AD) — HTTP 200 JavaScript shell with empty body and no visible result cards or creator metrics. Account and performance examples are uncertain.
- [Bilibili English-speaking search](https://search.bilibili.com/all?keyword=%E8%8B%B1%E8%AF%AD%E6%BC%94%E8%AE%B2) — earlier on 2026-09-07 the public result page visibly exposed titles, durations, subtitles, views, and an education creator account; the refresh later served `验证码`. Treat earlier counts as point-in-time observations only and recheck visually before decisions.
- [Zhihu search](https://www.zhihu.com/search?type=content&q=%E8%8B%B1%E8%AF%AD%E6%BC%94%E8%AE%B2) — HTTP 403. No public question, answer, author, or engagement example is verified.

The public social evidence supports channel-specific experiments but does not establish current platform ranking, conversion, or audience quality. When those channels become available through an authorized assigned tab, capture the exact profile/note/video URL, visible date, title, format, engagement, and CTA separately from assumptions.

## Short test backlog

1. Compare a generic WeChat button with a button that says `发送你的受众、目标和时间` and includes the role-specific prompt. Measure completed inquiries and missing fields.
2. Compare one shared contact form with three role routes. Measure qualified parent, school, and company conversations rather than raw submissions.
3. Compare a hidden “contact for details” offer with visible format, duration, deliverable, and “fees/availability confirmed directly” language. Measure inquiry quality and abandonment.
4. Compare a parent page led by a course title with one led by age/goal and a sample feedback artifact. Measure diagnostic completion and parent comprehension.
5. Compare a school programme-brief request with a generic contact CTA. Measure whether the first message includes age range, group size, objective, and timetable.
6. Compare a company use-case selector with one broad corporate page. Measure whether briefs name the communication situation and produce a better-fit first conversation.
7. Track WeChat inquiries by source label (homepage, parent page, school page, company page, article, video) while keeping student/private details out of public analytics.
