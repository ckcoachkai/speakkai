# V25 global benchmark: a Chinese contact composer on the existing static site

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for the Chinese contact path and the end-of-V25 framework decision. No product files, builds, browser/shared-browser actions or deployment were performed.

## Fresh official contact-flow reference

[Center for Creative Leadership: Contact Us](https://www.ccl.org/contact-us/) returned HTTP 200 on 2026-09-07. The official training provider’s page separates routes before asking for a conversation: technical support is directed to a Support Center; regional contacts are grouped under Americas, APAC and EMEA; and the main path says **“Start a Conversation”** and asks visitors to describe their organization’s priorities and leadership challenges. It also keeps a concrete regional action, **“View Our Locations.”**

The useful pattern is routing plus a short context brief: send a person to the right kind of help, ask for the situation and goal, then make the next action explicit. CCL’s follow-up language and organizational model are publisher-specific; they do not establish a SpeakKai response time, support channel, partnership or result.

## Current SpeakKai baseline and recommendation

`src/pages/contact.astro` already provides an English no-account composer with optional audience, goal, group/age, delivery preference and timing fields. It generates a reviewable message locally, lets the visitor edit it, copies it to WeChat, and states that the website does not send or save the inquiry. Its no-JavaScript text route tells visitors what to include in a manual WeChat message.

`src/components/ChineseCourseInquiry.astro` and `src/lib/inquiry.mjs` already demonstrate the Chinese interaction pattern: optional localized fields, generated Chinese draft, visible review/edit step, copy with fallback selection, and a clear statement that the site does not send, save or reserve anything.

For a Chinese contact page, reuse the same static page shape and audience vocabulary. Add a localized route and a Chinese `buildInquiry` function or localized template with optional fields for audience, school direction where relevant, goal, age/group, delivery preference and timing. Keep the generated draft editable before copying. Use labels such as **联系 Kai** and **生成咨询稿**, and say clearly that the visitor must review and send the message in WeChat. Include a no-JavaScript fallback with the same short fields. Do not collect names, phone numbers, payment details, student records or confidential company material.

**Framework decision:** keep Astro with `output: "static"`. The current `astro.config.mjs` already declares static output, and the existing composer proves that local progressive enhancement is sufficient. A Next.js migration, authentication layer, database, cookie or persistence mechanism is unnecessary for this contact goal.

## Hypothesis and checks

**Hypothesis:** A Chinese visitor can choose an audience, prepare a concise editable message and manually send it through WeChat without authentication or site-side storage, while retaining a usable text fallback.

Before release, record PASS/FAIL/NOT_CHECKED for: Chinese route and `lang="zh-CN"`; audience-specific fields and school direction; editable draft before copy; clipboard failure fallback; no send/save/reservation behavior; no-JavaScript instructions; English/Chinese field parity; narrow keyboard and screen-reader use; and live/build verification.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Contact Us](https://www.ccl.org/contact-us/) | Center for Creative Leadership | HTTP 200 on 2026-09-07; separates technical support, regional contact and “Start a Conversation,” asking for organizational priorities and challenges. Used as contact-flow structure only. |

**Local source inspected:** `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\pages\contact.astro`, `src\components\ChineseCourseInquiry.astro`, `src\lib\inquiry.mjs`, `astro.config.mjs`. Final build, live route, translation quality and accessibility remain NOT_CHECKED.
