# V09 China-facing navigation and mobile-entry notes

Checked: 2026-09-07 (Asia/Shanghai). Bounded public-page review before changes. No sign-in, form submission, mobile interaction, account action, site edit, or social-platform search. Static HTML signals are reported separately from mobile behavior.

## Refreshed official public source

[EF China all courses](https://www.ef.com.cn/pg/all/) returned HTTP 200. The title is `所有EF英孚教育课程 - 英孚英语 - EF海外课程 | EF`; the meta description says EF offers children/youth courses, adult English, preparatory study, travel, and camps. The page’s top-level navigation and visible contact signals include:

- `课程 / 查看所有英孚提供的课程` → `/pg/`
- `办公室 / 查找您附近的办公室` → `/contact/`
- `关于我们 / 企业文化` → `/about-us/`
- A visible China phone: `+86 400 880 1965`
- `索取免费课程资料` links on many course cards
- Repeated descriptive actions such as `了解更多`, plus `免费语言测试`, `EF学校和办公室`, and `联系我们` in the footer

## What the public HTML makes discoverable

The route starts with `请选择您的年龄`, then offers age bands from 3–14 through 50+ and `企业和政府机关`. It presents named product families with age, geography, duration, destinations, a short description, and a next link. The visible categories cover youth education, adult English, overseas programmes, university pathways, `EF Corporate learning`, and executive education.

This gives a visitor a predictable path from audience → programme family → detail or free course material. The link text also reveals content type: a brochure/material route, a course detail route, a location route, a test route, or a corporate route. For a Chinese-speaking parent or company buyer, this is easier to scan than a single undifferentiated course catalogue.

## Mobile-entry finding: HTML versus behavior

The refreshed all-courses HTML contains no visible mobile-specific CTA, WeChat QR handoff, or app-entry label in the extracted navigation and link text. It does include an office/contact route and phone number. That is a static HTML observation only.

I did not open a mobile viewport, test responsive layout, tap a phone link, scan a QR code, test the external course domains, or measure load/interaction behavior. Therefore mobile usability, app handoff, click-to-call behavior, and any responsive navigation are **unobserved**, not failures and not successes. No claim about mobile conversion or search ranking follows from this pass.

## Strengths and gaps for SpeakKai

**Strengths:** audience segmentation is visible at the top; course cards carry enough context to compare age, duration, geography, and programme family; `索取免费课程资料` is a concrete low-commitment next step; phone and office routes make human contact discoverable; corporate and executive routes are present alongside education routes.

**Gaps:** many cards repeat the generic `了解更多`, which does not tell a visitor whether the next page is a syllabus, brochure, destination, or contact form. The page does not expose a speaking-specific resource, listener practice, sample feedback, or a role-specific first inquiry. A phone is visible, but the HTML does not show a low-friction WeChat or mobile practice handoff. These are content/design observations, not claims about EF’s actual mobile experience.

## Concrete recommendation: three descriptive top-level doors

Give SpeakKai three visible resource entries in the first navigation and repeat them in the contact block. Use identical destination labels on desktop and mobile so the content contract is stable:

1. **学生与家长｜先试一个表达练习** — opens the illustrative practice starter; shows language, audience, estimated time, one prompt, one observable adjustment, retry, and a parent-readable recap. The next action is to discuss coaching fit.
2. **学校与教育工作者｜索取学校项目简介** — opens a brief with age range, language level, group size, delivery format, learning focus, sample task/rubric, materials, safeguarding questions, and reporting options.
3. **企业与活动团队｜提交一个沟通场景** — opens a short template for audience, business situation, desired decision, format, participant count, date range, confidentiality, and next rehearsal. The next action is to discuss keynote, workshop, or coaching fit.

Use link text that names the next object (`表达练习`, `学校项目简介`, `沟通场景模板`) rather than repeating `了解更多`. Keep phone and WeChat contact visible beside the relevant door, while stating that inquiry, schedule view, and contact do not reserve a place. A mobile view should let a visitor reach the resource or contact route with one clear tap; that must be checked in a real mobile viewport before being described as verified.

## Scope and evidence guardrails

The confirmed SpeakKai programme remains **Young Competition Speakers, Grades 1–2, Fall 2026, 18 classes**. The illustrative **10-minute speaking starter** can be the parent resource, but it must remain labelled illustrative and cannot become an invented course unit, timing promise, outcome, or certificate path. EF’s age bands, course durations, programme claims, company scale, and results are external publisher content and must not be copied as SpeakKai facts.

Social evidence remains unchanged/unknown. Prior checks found Xiaohongshu public search/account metrics unavailable; WeChat article bodies redirected to anti-spider after searchable snippets; Douyin returned a JavaScript shell; Bilibili later served CAPTCHA after an earlier visible result set; and Zhihu search returned HTTP 403. No V09 conclusion depends on those channels.

## Source limits and next verification

This cycle refreshed one official public source and inspected its title, description, headings, top-level links, and contact signals. It did not submit any course-material request or contact form. The next useful check is an authorized mobile-viewport review of the three SpeakKai doors: tap count to resource, phone/WeChat affordance, line wrapping, and whether the same descriptive labels remain visible. Those are pending observations, not inferred behavior.
