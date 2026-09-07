# V19 global benchmark: help schools choose a format

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for the current SpeakKai Schools page. The goal is better decision information for its three existing formats, preparation and responsibilities, and a direct inquiry. No product files, builds, browser actions, partnership claims, copied packages, or guaranteed deliverables were created.

## Fresh school-facing reference

[Toastmasters International: Youth Leadership Program](https://www.toastmasters.org/education/youth-leadership-program) returned HTTP 200 on 2026-09-07. Its public page gives a school or cooperating organization concrete scoping information:

- It describes a workshop of eight one- to two-hour sessions for ages 14–18.
- It says the program can be presented during or after school, or on weekends.
- It names practical content: evaluating speaking ability, preparing and delivering speeches, impromptu talks, voice/vocabulary/gestures, and constructive feedback.
- It explains selection by a sponsoring club or cooperating organization such as a school.
- It states a limit of 25 students and says Toastmasters members coordinate with club oversight.
- It directs a prospective coordinator to a workbook, coordinator guide, and club leadership before the program decision.

The useful pattern is information architecture: show format shape, participant scope, timing options, what is practised, who coordinates, and what must be discussed before delivery. Toastmasters’ age range, eight-session package, 25-student limit, materials, laws, and coordinator model belong to its program. They are not SpeakKai offerings, partnership evidence, or defaults to copy. The page does not prove school outcomes, price, regional fit, safeguarding compliance for SpeakKai, or the feasibility of any SpeakKai date.

## Current SpeakKai formats and missing decision information

The current Schools offer already names three formats in src/data/flagshipOffers.ts: A focused workshop, A sequence of lessons, and Teacher development. The page explains their learning direction, but a school buyer still benefits from a compact decision aid that makes the choice and scoping conversation explicit.

| Format | Choose it when… | Discuss before an inquiry is confirmed |
|---|---|---|
| **A focused workshop** | One shared speaking task and one clear learning focus fit the school’s immediate need. | The task or event, age/language level, approximate group size, one-off timing, room or online setup, and the teacher’s role during the session. |
| **A sequence of lessons** | Students need progressive practice across a short or longer curriculum. | Number and length of sessions, interval and target dates, groups, starting level, learning aims, the final speaking task to explore, and how teachers will support continuity. |
| **Teacher development** | Teachers want to model speaking tasks and give feedback that students can act on. | Teacher roles and approximate participant count, priority classroom situations, existing materials, session shape, follow-up discussion, and any school-specific safeguarding or supervision requirements. |

Use “discuss,” “possible,” and “to be agreed” for scope. Do not publish a fixed session count, group capacity, curriculum alignment, report, assessment, recording, or student result unless SpeakKai has confirmed that exact offer.

## Recommended school decision aid

Place a short comparison list or semantic table after the Schools introduction and before the direct inquiry. Give it a descriptive caption such as Choose a starting format for discussion. Keep the same three names already used by the page. Each row should answer four questions in plain language:

1. What situation does this format fit?
2. What does the session or sequence make room for?
3. What does the school need to decide or prepare?
4. What remains to be agreed with Kai?

For a narrow screen, stack each row as a labeled block or use a responsive table with repeated row headings. If it remains a table, use a caption and real header cells with appropriate scope; do not make the reader infer the format from color or position. The decision aid needs no new framework or client-side interaction.

## Preparation and responsibilities

Keep preparation short and school-relevant:

- student age range and language level;
- approximate group size and number of groups;
- communication need or real speaking moment;
- preferred format and possible dates;
- delivery setting: school room, online, or another proposed arrangement;
- teacher or staff role during preparation, practice, supervision, and feedback;
- materials the school already has and materials it expects to discuss;
- safeguarding, supervision, accessibility, and any proposed public sharing or recording requirements.

Separate responsibilities clearly. The school provides accurate context, an appropriate supervising contact, timetable and room or online details, participant grouping, safeguarding requirements, and permission decisions for any identifiable student material. Kai discusses fit, proposes a possible scope, and confirms the format, dates, fees, materials, and responsibilities directly. These are inquiry-stage responsibilities and discussion points; they are not a guarantee that a program is available or that a particular deliverable will be supplied.

## Direct inquiry recommendation

Keep the current direct contact route visible beside the decision aid. Use a CTA such as Discuss a school program and a compact inquiry prompt:

> We are exploring a SpeakKai school program.  
> Age range and language level: [optional]  
> Approximate group size: [optional]  
> Main speaking need or event: [optional]  
> Possible dates and delivery setting: [optional]  
> Format to explore: focused workshop / sequence of lessons / teacher development  
> What would you like to discuss with Kai? [optional]

Add a boundary beside the prompt: a first inquiry does not need student names, individual records, payment data, or confidential school documents. The inquiry starts a conversation; it does not confirm a booking, place, date, fee, partnership, or deliverable. Kai confirms fit and scope directly.

If a manual WeChat handoff is used, keep the preview editable and ask the school contact to check the fields before sending. Do not add a server form, automatic booking state, school logo, named partner, or “guaranteed” result to make the route appear more established.

## Testable hypothesis and release checks

**Hypothesis:** If a school visitor can match the need to one of the three existing formats, see the preparation and responsibility boundaries, and send a concise scoping inquiry, then the page provides better decision information without implying a fixed package or confirmed partnership.

Before release, record each result as PASS, FAIL, or NOT_CHECKED:

- All three current formats appear with the same names and distinct fit descriptions.
- Each format explains what must be scoped with Kai rather than inventing a standard package.
- The comparison list/table has a caption, real headings, readable labels, and a narrow-layout treatment.
- Age/level, group size, speaking need, possible timing, setting, format, and school responsibilities are easy to find.
- The direct contact path remains visible and its action is described as an inquiry or discussion.
- The inquiry does not request student names, individual records, payment data, or confidential documents.
- The page states that dates, fees, availability, responsibilities, and any deliverables are confirmed directly.
- No Toastmasters package detail, logo, partnership, school case, outcome, or capacity is presented as SpeakKai evidence.
- English and Chinese school-page content preserves the same three-format choices and boundaries.
- Keyboard users and narrow-screen readers can understand each row without relying on color, hover, or horizontal scrolling.

This research did not edit the Schools page, test the current comparison layout, verify a live inquiry handoff, validate school safeguarding requirements, or establish pricing, capacity, outcomes, partnerships, or delivery availability.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Youth Leadership Program](https://www.toastmasters.org/education/youth-leadership-program) | Toastmasters International | HTTP 200 on 2026-09-07; eight one- to two-hour sessions, ages 14–18, during/after school or weekends, practical speaking and feedback topics, school/cooperating-organization selection, 25-student limit, and named coordinator/oversight guidance |

## Unavailable or unverified

- SpeakKai’s actual school response time, fees, session capacities, room/online availability, teacher materials, reporting, and any school-specific safeguarding process remain NOT_CHECKED.
- The Toastmasters page’s package, age range, capacity, and coordinator details were not adopted as SpeakKai facts.
