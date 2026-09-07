# V25 Chinese inquiry and confirmation benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only pre-edit research for the general Chinese inquiry composer and contact-link consistency. No SpeakKai edits, builds, browser actions, messages, or saved submissions.

## One fresh official Chinese contact page

[EF China: 联系我们](https://www.ef.com.cn/legal/contact-us/) returned HTTP 200 on 2026-09-07. The public title is `联系我们 | EF 中国`; the fetched HTML was 155,506 UTF-8 bytes.

The page separates routing, fields, and submission expectations. It says the form is for course terms, privacy, personal-information changes, or technical questions, while general product questions should be directed to an office. The visible form contains:

- required `名字`, `电邮`, and `查询类别` fields;
- optional `联系电话` and `手机号码` fields (neither has a `required` attribute in the fetched markup);
- a `请告诉我们更多信息` textarea, with no `required` attribute in the fetched markup;
- an intent selector with `----- 请选择 -----`, personal-data, course-terms, and privacy or cookie options;
- a consent checkbox and `点击提交` action.

The page states that fields marked with `*` are required. It does not state a response time, quote, lesson place, or booking confirmation. These observations describe form information architecture only; EF’s course, staffing, privacy, and service statements remain publisher claims.

## SpeakKai translation hypothesis

The general Chinese composer should make a useful first brief easy without requiring personal data. Keep every inquiry detail optional and label the fields clearly:

```text
对象：学生与家长 / 学校与教育工作者 / 企业与活动团队 / 还不确定
目标或需要：几句话即可
年龄或年级 / 听众：可选
大致人数：可选
时间范围：可选
形式：可选
```

For a school direction, the optional fields can also mention language level, timetable, staff responsibilities, room or online setup, and safeguarding or supervision requirements. For a company or event, invite audience, communication challenge, participant count, date range, and format. Ask for a short need or goal before asking for detailed context; do not require a name, phone number, email address, student name, student record, or confidential company material in this local draft.

Use `复制中文咨询稿` as the action if the composer prepares text for WeChat. Place this expectation beside the action: `网站不会发送或保存咨询，也不会预约课程或确认名额。请自行检查后，打开微信粘贴并发送给 CKcoachkai。` A draft, copy action, QR display, schedule view, or contact link is not a booking or availability confirmation.

The post-inquiry boundary should say that Kai discusses fit, scope, format, fees, dates, and availability directly. A session, package, deliverable, partnership, place, or outcome exists only after direct confirmation. Keep the Chinese field labels parallel to the English composer’s audience, goal, group, format, and timing fields; do not add a provider-style lead promise or guaranteed response time.
