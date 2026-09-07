# V18 global benchmark: concrete feedback and a retry

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for the Fall Grades 1–2 course page. The aim is to show one early learner a concrete speaking adjustment and an immediate retry, while keeping the English and Chinese editorial fields maintainable. No product files, builds, shared-browser inspection, or claims about learner outcomes were made.

## Fresh education reference

[Cambridge English: Activities for children](https://www.cambridgeenglish.org/learning-english/parents-and-children/activities-for-children/) returned HTTP 200 on 2026-09-07. The page presents activities at Pre-A1, A1, and A2 levels. It says each activity helps children practise at least one assessed skill, including reading and writing, listening, or speaking; it also says activities become more difficult as children move through the levels and suggests starting at Pre-A1 when a child’s level is uncertain.

The useful design evidence is narrow: identify the early learner level, keep the activity skill-specific, and show a progression from a simpler task to a more difficult one. The page does not provide a verified teacher feedback transcript, a first/second utterance, or evidence that retrying improves results. Its activities are described as designed for desktop or tablet, so it is not evidence of mobile behavior. Cambridge’s assessment and learning claims remain publisher-presented and do not establish SpeakKai outcomes.

## Recommended original paired example

Add one short, clearly fictional example to the existing course explanation. Keep the same two-sentence content in the first attempt and the retry; change only the delivery cue. This makes the feedback concrete without inventing a student result.

**虚构示例 · 不是学生成果**  
**Fictional example · not a student result**

**第一次 / First attempt**

> 这是我的红围巾。它让我想起我的家人。  
> This is my red scarf. It reminds me of my family.

**具体反馈 / Concrete feedback**

> 两个想法都很清楚。说最后一句前停一下，让听众听清这个个人细节。  
> Your two ideas are clear. Pause before the last sentence so the listener can hear the personal detail.

**重试 / Retry**

> 这是我的红围巾。[短暂停顿] 它让我想起我的家人。  
> This is my red scarf. [short pause] It reminds me of my family.

**听众检查 / Listener check**

> 听众说出：物件是什么，以及它让说话者想起什么。如果听众漏掉其中一项，说话者再次读同样两句话，并把停顿保持在最后一句之前。  
> The listener names the object and what it reminds the speaker of. If either detail is missed, the speaker reads the same two sentences again and keeps the pause before the last sentence.

This example models one move only: preserve the words and add a deliberate pause before the final sentence. It does not claim that a real child used the example, that a listener understood it, or that the retry produced improvement. The label must remain adjacent to the example in both languages.

## Editorial and translation boundary

Keep the paired example as two explicit fields with the same semantic keys: label, firstAttempt, feedback, retry, and listenerCheck. Translate the content as a pair and review the two versions for meaning, subject, sequence, and the location of the pause cue. Do not let the Chinese version add a new family detail, age claim, achievement, or promise.

[W3C WCAG 2.2 Understanding 3.1.1 Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) and [3.1.2 Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) require the page language and language of passages to be programmatically determinable. Set the page language for the selected route and mark any mixed-language example or label with the appropriate language value. Language metadata supports correct reading technology behavior; it does not verify translation quality.

## Implementation recommendation

Keep the example in the existing course content model or component data, with English and Simplified Chinese values side by side. A new framework, interactive widget, or audio asset is unnecessary for this teaching move. Render the example as ordinary text with a clear read-aloud instruction; retain the current pause feedback in the course flow.

If the visual design needs progressive disclosure, use the existing native details pattern with a summary such as 显示一个虚构的第一次尝试和重试示例 / Show a fictional first attempt and retry. Keep the core practice prompt and course action outside the disclosure. The example should remain present in the HTML and readable when JavaScript is unavailable.

## Testable hypothesis and release checks

**Hypothesis:** If an early learner can read one fictional two-sentence story, receive one specific pause cue, repeat the same wording with that cue, and use a listener check, then the page demonstrates a concrete feedback-and-retry loop without asserting an unverified result.

Before release, record each result as PASS, FAIL, or NOT_CHECKED:

- The example is labeled fictional and explicitly does not present a student result.
- First attempt, concrete feedback, retry, and listener check appear in that order.
- The retry preserves the two sentences and adds only the labeled pause cue.
- Feedback names one observable delivery change and where it occurs.
- The listener check asks for the object and the remembered detail, then gives a clear repeat action.
- English and Simplified Chinese preserve the same subject, sequence, pause location, and fictional boundary.
- The selected route and mixed-language passages expose correct language metadata.
- The example does not add a testimonial, learner name, score, completion claim, outcome, or guarantee.
- The main course facts, practice prompt, and direct contact route remain unchanged and visible.
- The example remains readable with JavaScript disabled and at the course page’s supported narrow layout.

This research did not edit the course page, test the read-aloud instruction, verify translation quality with a bilingual reviewer, run a screen-reader check, or measure learner comprehension or retry performance.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Activities for children](https://www.cambridgeenglish.org/learning-english/parents-and-children/activities-for-children/) | Cambridge English | HTTP 200; Pre-A1/A1/A2 activities, speaking among the practised skills, increasing difficulty, and advice to start at Pre-A1 when uncertain |
| [Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) / [Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) | W3C WAI | HTTP 200; page and mixed-language passages need programmatically determinable language |

## Unavailable or unverified

- British Council TeachingEnglish feedback pages timed out during bounded retrieval and were not used as evidence.
- Product behavior, bilingual editorial review, screen-reader output, read-aloud usability, mobile rendering, and learning impact remain NOT_CHECKED.
