# V7 global benchmark: teacher-led speaking turns in a small group

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Source reviewed:** [TED-Ed Student Talks](https://ed.ted.com/student_talks), returned HTTP 200 with the title “TED-Ed Student Talks.”  
**Scope:** One current, first-party international learning-program page reviewed for a V7 classroom/group speaking interaction. No TED-Ed account, application, community, or event was joined. No learning outcome is claimed.

## What the source establishes

TED-Ed describes Student Talks as free, customizable activities for educators to help students identify, develop, and share ideas with each other and the world. The page says the program is for educators working with students ages 6–18 in classrooms, schools, extracurricular settings, or youth and educational organizations. It describes guided activities and resources, and lists students thinking critically, developing ideas into spoken narratives, sharing with peers and community, and giving and receiving meaningful feedback.

The page also says its educator community spans more than 130 countries. That is a description of the program’s stated reach, not evidence that its activities produce a particular result for SpeakKai learners.

## Strength for V7

This is a strong design signal for putting the teacher or facilitator inside the activity. It supports a short group routine where each learner gets a speaking turn, another learner has a defined listening job, and feedback leads to a next attempt. It also supports making the activity adaptable by age, group setting, and local topic rather than presenting one universal speech lesson.

The source is especially useful because it names feedback and peer sharing as parts of the activity shape. That gives V7 a credible reason to include simple listener roles and prompt-based turn-taking while keeping the interaction understandable on a phone.

## Gap and limits

The public page does not specify a compact mobile card layout, a turn timer, a listener-role protocol, or a particular prompt sequence. It also describes an educator application and access to a customized virtual learning platform, so it is not evidence that a static public SpeakKai page should reproduce TED-Ed’s platform, community, or approval model.

The page uses program language such as “21st century skills,” confidence, and meaningful feedback, but it does not provide independent measurements of completion, transfer, speaking improvement, or social outcomes on the checked page. SpeakKai should therefore label its activity as an original practice format and measure only what it actually observes. A teacher, peer, parent, or partner may be invited as a local listener; the activity should not imply that a short exercise replaces a class, therapy, credential, or supervised safeguarding process.

## Concrete V7 recommendation

Create one original **Group Turn** practice entry with a teacher start state and a compact mobile view. The teacher chooses a prompt and group size of two to four, then hands the phone to each speaker in sequence. Each turn displays only four things: the speaker prompt, a 30–60 second target, one listener action, and a “next speaker” control.

Use three plain roles:

1. **Speaker:** answer the prompt with one idea and one concrete detail.
2. **Detail listener:** say one specific detail they heard.
3. **Questioner:** ask one follow-up question. In a pair, the listener can do both jobs.

End the round with one private reflection: “What became clearer when you tried again?” The teacher can restart the round or move to a new prompt. Keep the activity usable without login, recording upload, public posting, or chat. If V7 adds a CMS collection, candidate fields are `prompt`, `groupSize`, `turnSeconds`, `turns` with `role`/`instruction`/`listenerAction`, `teacherNote`, `reflectionPrompt`, `audience`, `reviewedOn`, and `editorialNote`; these are implementation options, not an approved syllabus.

This recommendation carries the source’s useful structure—educator guidance, spoken narratives, peer listening, and feedback—while remaining an original SpeakKai activity. It does not copy TED-Ed branding, claim TED affiliation, or promise a result. The public card should state the intended age or level, allow a teacher to skip a sensitive prompt, and make participation or sharing optional for learners who do not want to speak in front of a group.

## Verification and measurement boundary

Before release, check that a teacher can understand the setup in one screen, assign roles without extra explanation, complete one round on a narrow mobile viewport, and restart without losing the prompt. Test keyboard navigation, readable focus states, English/Chinese copy if the entry is bilingual, and a no-JavaScript fallback or clear limitation. Use only original prompts and examples, with no student names, recordings, calendar details, or private classroom data in public content.

Useful operational observations are round starts, completed turns where instrumentation exists, restart use, teacher-reported confusion, and optional feedback requests. These can guide iteration; they do not establish learning gains or prove that peer feedback improves performance.

## Source ledger and limits

| Source | Publisher | Verified observation |
|---|---|---|
| [TED-Ed Student Talks](https://ed.ted.com/student_talks) | TED-Ed | Free, customizable educator activities for ages 6–18 in classroom and related youth settings; guided resources; idea development into spoken narratives; peer feedback; stated educator reach in over 130 countries |

The review covers the public page as returned on 2026-09-07. It does not verify the application process, educator platform access, resource contents, moderation, local safeguarding, participation quality, or learning outcomes. The proposed Group Turn card is an original SpeakKai design recommendation, not a TED-Ed method, approved syllabus, or result claim.
