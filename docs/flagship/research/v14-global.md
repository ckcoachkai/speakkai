# V14 global benchmark: parent inquiry preparation

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded public-page research for the Chinese course-page inquiry helper. The recommendation covers minimized fields, a truthful local WeChat message preview, and manual copy/paste/send. No product edits, builds, shared-browser inspection, server submission, automatic booking, message sending, or booking claim were performed.

## Global education and form references

[Toastmasters Pathways](https://www.toastmasters.org/education/pathways) returned HTTP 200 on 2026-09-07. Its education page presents a discoverable sequence of overview, first-project sampling, accessible materials, translated options, and paths/projects. It describes flexible online learning organized around paths, speeches, and projects. This supports making a course inquiry route easy to discover, stating what the parent can do next, and keeping translated help alongside the main offer. Toastmasters’ program claims and outcomes remain publisher-presented; they are not evidence for SpeakKai results.

[W3C WAI: Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/) says every control needs a label, with labels associated to controls through matching for/id values. Placeholder text does not replace a label. [W3C WAI: Form Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/) recommends giving overall instructions before the form and placing important requirements or format guidance in labels or associated descriptions, including through aria-describedby when needed.

[MDN: Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) documents that clipboard writing is promise-based, permission/security constrained, and should handle failure. This supports an explicit Copy message action with a visible manual-selection fallback. Do not copy on page load.

## Recommended inquiry workflow

Use a compact optional helper beside the existing direct WeChat QR code or handle. Keep the route visibly labeled 课程咨询准备 and explain its boundary before the fields:

> 这是一份中文咨询准备稿，帮助你整理课程兴趣、孩子年级、表达目标和时间范围。内容可编辑，也可以复制到微信；不会自动发送消息、预约课程或确认名额。请使用页面提供的微信二维码或账号自行联系。

Ask only for information that improves the inquiry:

- 课程兴趣（可选）
- 家长称呼或偏好称呼（可选）
- 孩子年级或年龄段（可选）
- 语言（可选）
- 想了解的问题或目标（可选）

All fields may remain blank. Do not require an exact birth date, address, medical information, payment data, phone number, or other unnecessary contact detail. If a field is blank, omit that line from the preview or leave a plainly editable prompt; never infer a value.

The page should present the Chinese draft in a selectable, editable text area. Keep the confirmed course facts synchronized with the page’s current offer. The draft may include the course name and confirmed scope, then ask the parent’s questions:

    你好，我想咨询 SpeakKai 的 Young Competition Speakers（Fall 2026）课程。

    孩子年级或年龄段：［可选填写］
    语言：［可选填写］
    想了解的问题或目标：［可选填写］

    我想确认：
    1. 课程的开课时间、上课时区和具体安排是什么？
    2. 课程费用和报名方式是什么？
    3. 是否有适合先了解课程的咨询或试听安排？

    谢谢！我会通过页面提供的微信方式自行联系。

If the current course page confirms facts such as Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, or a supported three-minute final showcase, include those facts exactly. Questions about fees, schedule, enrollment, or trials must remain questions unless the page independently confirms the answer. Do not invent an instructor, fee, timetable, guarantee, certificate, competition result, availability, or contact identifier.

Use an explicit button such as 复制中文咨询稿. On success, show:

> 已复制，可粘贴到微信；请自行检查后发送。

On permission or security failure, show:

> 复制不可用。请选中上方文字，手动复制到微信。

The action copies text only. It must not open WeChat, send a message, submit to a server, create a booking, reserve a place, or display a confirmation. Keep the text selectable so keyboard and touch users have a fallback.

## Testable hypothesis and release checks

**Hypothesis:** If a parent can complete a few minimized optional fields, review a truthful Chinese draft, copy it or manually select it, and paste/send it in WeChat themselves, then inquiry preparation is adequate without exposing unnecessary data or implying a booking.

Before release, record each result as PASS, FAIL, or NOT_CHECKED:

- Every field has a visible, programmatically associated label; placeholder text is supplementary.
- The helper explains optionality, local/manual handling, and the absence of booking or server submission.
- Blank fields produce no invented facts and do not block preview or copy.
- The preview contains only confirmed course facts and clearly labeled parent questions.
- The preview is selectable and editable; it does not copy automatically on page load.
- Successful copy shows the exact success status; denied or unavailable clipboard access shows the manual fallback.
- Keyboard users can reach, edit, copy, and read the status; the status is exposed accessibly.
- JavaScript-disabled or delayed loading still leaves the direct WeChat route and a usable static message/instructions.
- Network inspection or request logging confirms no form submission, analytics payload containing the entered inquiry, booking request, or message send is triggered by the helper.
- Confirm the direct WeChat identifier separately from the live page before publishing; this research does not verify or authorize a new identifier.

This pass did not test product behavior, clipboard permissions in the browser, screen-reader output, JavaScript-disabled rendering, network traffic, or translation quality.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Toastmasters Pathways](https://www.toastmasters.org/education/pathways) | Toastmasters International | HTTP 200; overview, first-project, accessibility, translated-options, and paths/projects entry points support discoverable next steps and translated help |
| [Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/) | W3C WAI | Labels are required and must be associated with controls; placeholders are not labels |
| [Form Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/) | W3C WAI | Give overall instructions before fields and associate important guidance with controls |
| [Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) | MDN Web Docs | Clipboard writes are permission/security constrained; handle promise failure and provide manual fallback |
