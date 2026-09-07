# V06 editable parent-practice lesson schema

Checked: 2026-09-07 (Asia/Shanghai). One external source refreshed this cycle; no site or source files were edited.

## Fresh source signal

[51Talk 学习理念](https://www.51talk.com/global/study) returned HTTP 200 on 2026-09-07. Its public title is `真人外教一对一在线教学模式，服务全球3-18岁青少用户`; its description says the service uses live foreign-teacher one-to-one online teaching for ages 3–18. Visible headings describe a learning loop of pre-class grammar video, 10-minute pre-study, a lesson, 10-minute review, unit/level testing, and level certificates. This is a publisher-described product structure, not independent evidence of outcomes and not a specification for SpeakKai.

The practical lesson-design signal is that a parent can see what happens before, during, and after practice. SpeakKai can use the same clarity while keeping its own confirmed scope and wording.

## Five editable field groups

These fields are the minimum useful contract for a parent-facing practice lesson. `language` and `audience` sit together in the first context field, keeping the total to five groups while retaining both required values.

| Field group | Required content | Editor guidance | Parent-facing result |
|---|---|---|---|
| **1. Context: language + audience** | `language` (`en`, `zh-CN`, or `bilingual`); audience role; age/grade or adult context; starting situation. | Separate UI language from practice language. Use `Grades 1–2` only where the confirmed offer applies. Avoid student names, records, or sensitive details. | The parent immediately knows who the activity is for and whether the prompt is English, Chinese-supported, or bilingual. |
| **2. Timing** | Total estimate; per-step estimate; sequence position (`before`, `practice`, `after`); status such as `illustrative` or `confirmed`. | Keep an illustrative 10-minute starter visibly separate from the confirmed Fall 2026 course schedule. Do not copy 51Talk’s 10-minute timing into SpeakKai as a promise. | A parent can decide whether to try now and understands what “finish” means. |
| **3. Ordered steps** | An ordered list of prompt, learner action, optional example, and retry/continue action. | Give each step one job. Keep prompts short enough to act on. Store steps as editable records so an editor can reorder or revise them without changing the lesson’s factual scope. | The learner sees a clear next action instead of a large block of instructions. |
| **4. Feedback and next action** | One observable speaking choice; a plain-language explanation; one next attempt. | Describe what can be heard or seen (`main point first`, `pause before the example`, `finish with the takeaway`). Keep feedback supportive and specific. Avoid guaranteed confidence, competition results, or invented diagnosis. | The parent receives a useful recap: what the learner tried, what to notice, and what to try next. |
| **5. Source and review status** | `sourceUrl`; source title; claim/scope note; `status` (`draft`, `reviewed`, `approved`); reviewer/date; last-reviewed date. | Every imported benchmark or factual claim needs a link and review state. Keep external examples labelled as references. Mark timing, outcomes, credentials, and programme details `unverified` until approved. | Public copy can stay simple while the editor has a traceable reason for each claim. |

A compact shape for the editor model could be:

```ts
type PracticeLesson = {
  context: {
    language: "en" | "zh-CN" | "bilingual";
    audience: string;
    startingPoint: string;
  };
  timing: {
    totalMinutes: number;
    stepMinutes?: number[];
    phase: "before" | "practice" | "after";
    scope: "illustrative" | "confirmed";
  };
  steps: Array<{
    prompt: string;
    action: string;
    example?: string;
    retryLabel?: string;
  }>;
  feedback: {
    observableChoice: string;
    explanation: string;
    nextAction: string;
  };
  review: {
    sourceUrl: string;
    sourceTitle: string;
    status: "draft" | "reviewed" | "approved";
    scopeNote: string;
    reviewedAt: string;
  };
};
```

The `scope` and `review` values are editorial safeguards. They do not need to appear as marketing copy, but they prevent a benchmark’s age range, timing, certificate, or outcome claim from silently becoming a SpeakKai promise.

## Why a guided practice stepper helps

A stepper should present one small action at a time: orient to the goal, make a first attempt, notice one speaking choice, retry, and finish with a next action. A visible `1 of 4` or equivalent progress cue gives the parent and learner a bounded task. A `Try again` action makes revision part of the activity rather than a failure state. A final recap turns the activity into something a parent can discuss without needing teaching terminology.

Recommended states:

1. **Orient:** show audience, purpose, practice language, and estimated time.
2. **Prompt:** show one question or situation; allow the learner to prepare briefly.
3. **Attempt:** let the learner speak or rehearse; keep the prompt available.
4. **Notice:** reveal one observable feedback choice, not a score or diagnosis.
5. **Retry:** ask for a second attempt using that one choice.
6. **Recap:** show the next practice action and a parent-readable summary.

This structure reduces reading load, creates a natural retry, and makes a short lesson feel complete. It also gives the editor a stable place for translations, examples, and feedback without requiring a new page for every variation. Any claims about completion or improvement should be measured after release; they are not established by the 51Talk source.

## SpeakKai scope guard

The confirmed current programme remains **Young Competition Speakers, Grades 1–2, Fall 2026, 18 classes**. The illustrative **10-minute speaking starter** can use the stepper shape as a standalone practice resource, but it must be labelled illustrative and must not be presented as one of the 18 classes or as an invented unit title. Its exact prompts and feedback should be approved as SpeakKai copy.

The schema does not import 51Talk’s L0–L6 levels, 10-minute pre/post timings, certificates, foreign-teacher model, or age range. Those are external reference details and publisher claims.

## Review limits

The external source was checked directly and was accessible without sign-in. No registration, lesson booking, or parent account flow was tested. No social-platform searches were repeated in V06; prior XHS, WeChat, Douyin, Bilibili, and Zhihu access limits remain unchanged/unknown. No SEO ranking, traffic, conversion, or learning-outcome claim is made.
