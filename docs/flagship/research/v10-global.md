# V10 global benchmark: bilingual course-page clarity and language metadata

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded, read-only research before changes to the SpeakKai flagship course page at `src/pages/coaching/young-competition-speakers.astro`. The recommendation covers an explicit English/Chinese switch, fact parity, direct inquiry, and user-controlled language choice. No product edit, form submission, sign-in, or live-browser/shared-tab inspection was performed.

## Direct recommendation

Add a visible two-option language switch to the course page: **English** and **中文**. Make the switch a native keyboard-operable control, keep the selected state clear, and let the learner choose the language. Do not automatically redirect from the visitor’s browser or IP language.

Keep the course facts in one source-of-truth object and render a parallel English and Simplified Chinese presentation from that data. Both views should expose the same:

- course title and audience or age/grade range;
- confirmed dates, class count, duration, delivery format, and location or online status;
- learning focus and what the learner actually practises;
- what is confirmed, illustrative, or still pending;
- inquiry/contact action and the expected next step;
- FAQ answers and any registration or availability limits.

If a fact is unknown, preserve an explicit “To be confirmed” or equivalent Chinese wording in both views. Do not fill a missing date, outcome, fee, or availability with a translation guess.

The primary action should be a direct inquiry, such as **Ask about this course** / **咨询课程**, and should explain what happens next. It can open the existing contact route with the course name prefilled or clearly identified. It should not imply that a click books a place, confirms a seat, charges a payment, or guarantees an outcome.

## What the international training source establishes

[Duarte’s Storytelling for Business Presentations course page](https://www.duarte.com/training/storytelling-for-business-presentations/) returned HTTP 200. The page is explicitly English in its delivered markup (`<html lang="en-US">`) and structured data (`inLanguage: "en-US"`). Its page and JSON-LD provide a useful clarity sequence:

- a concise hero promise, “Build Persuasive Business Presentations”;
- a problem statement explaining unclear thinking and unfocused messaging;
- a clear CTA, “Help Your Team Tell Better Stories,” leading to a contact section;
- audience information for leaders, managers, cross-functional teams, and L&D/HR leaders;
- explicit delivery metadata for online and onsite instances, with structured workloads of eight hours and one day;
- learning themes including audience-first thinking, stakes/contrast, and message clarity;
- visible sections on participant gains, delivery, audience fit, FAQs, and a “Talk with Our Team” inquiry route.

This supports a simple course-page hierarchy for SpeakKai: who it is for, what the course helps practise, what the learner receives, how it is delivered, and what the next human conversation is. The CTA language is specific about discussion rather than pretending that a public page alone completes enrollment.

The page also contains provider marketing claims under “Proof It Works,” participant testimonials, and branded method references. Those are Duarte’s content. They are not independent evidence of effectiveness and should not be copied into SpeakKai’s course page or translated as if they were SpeakKai results.

The source is a single English course page. Its static HTML does not establish bilingual parity, translation quality, language-switch behavior, viewport usability, screen-reader output, or whether its inquiry flow completes a booking. Those remain SpeakKai implementation and browser-test questions.

## Language and locale guidance

[W3C WAI’s Understanding SC 3.1.1, Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html), updated 09 March 2026, requires the default human language of each page to be programmatically determinable. [W3C WAI’s Understanding SC 3.1.2, Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html), updated 12 July 2026, extends this to passages or phrases written in another language.

[MDN’s `lang` reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) describes `lang` as a BCP 47 language tag and recommends specifying an appropriate value rather than leaving the language unknown. It also explains that WCAG 3.1.1 and 3.1.2 are served by marking the page and language parts with `lang`.

For a same-route client-side switch, update the document language to match the selected view:

- English view: `<html lang="en">` or the project’s chosen English BCP 47 tag.
- Simplified Chinese view: `<html lang="zh-Hans">` when identifying language and script; use a region-qualified tag such as `zh-CN` when the page is intentionally targeted to Mainland China and that convention is used consistently.
- Mark the visible language labels themselves, for example `<span lang="en">English</span>` and `<span lang="zh-Hans">中文</span>`.
- Mark any retained bilingual phrase, quoted term, or mixed-language content at the element containing that passage.

Do not confuse `lang` with search routing. The `lang` attribute tells user agents and assistive technology the language of content; it is not a translation engine and does not, by itself, select a page for a searcher.

[Google Search Central’s localized-versions guidance](https://developers.google.com/search/docs/specialty/international/localized-versions) says that sites with separate language or regional page versions should explicitly indicate those variants. When separate indexable English and Chinese URLs exist, add fully qualified, reciprocal `hreflang` links for each variant, including the page itself. Use a valid language/region code and consider `x-default` for a language selector or unmatched-language fallback. Google’s guidance also states that it uses algorithms to determine page language rather than relying on `hreflang` or the HTML `lang` attribute.

For V10, a same-page native switch is the smaller first implementation. Do not add `hreflang` links that point to the same URL and pretend they create separate localized pages. If the site later publishes stable `/en/` and `/zh-cn/` equivalents, add reciprocal `hreflang` annotations only after both pages carry matching facts and are independently reachable.

## Implementation recommendation: one fact model, two language views

Use a single typed course record with localized text fields rather than maintaining two unrelated copies. Candidate fields are:

```ts
{
  slug,
  title: { en, zhHans },
  audience: { en, zhHans },
  status: { en, zhHans },
  dates,
  classCount,
  duration,
  format: { en, zhHans },
  location: { en, zhHans },
  focus: { en, zhHans },
  outcomes: [{ en, zhHans }],
  faqs: [{ question: { en, zhHans }, answer: { en, zhHans } }],
  inquiryLabel: { en, zhHans },
  inquiryNote: { en, zhHans },
  reviewedOn
}
```

The exact field names are implementation options. The important constraint is that dates, numbers, status, and operational boundaries are shared values, while prose is translated in parallel. Avoid translating a source fact into a stronger claim. “Practise,” “focuses on,” and “can discuss” should not become “master,” “guarantees,” or “enrolls.”

Place the switch near the course title or first action, and repeat the selected language in the document title or accessible status if the page changes without navigation. Use two `<button type="button">` controls for an in-place view switch, with `aria-pressed` reflecting the selected option and an accessible name that includes the language. If each language becomes a separate URL, use normal links instead, preserve the current course slug, and set the destination’s `lang` value on the server-rendered document.

Keep the inquiry CTA visible in both language views. The inquiry payload may carry the stable course slug, but the user must still see a human-readable summary of what they are asking about. The language switch should not erase a completed form field, move the user to a different course, or silently submit anything.

## Content structure for the SpeakKai course page

Use the following order to make the page understandable before a visitor reaches inquiry:

1. **Course identity:** exact title, audience/grade, language, and a one-sentence purpose.
2. **At-a-glance facts:** confirmed dates, number of classes, duration, delivery mode, location, and status.
3. **What learners practise:** a short list of observable practice tasks, separated from broader aspirations.
4. **What a parent or learner can expect:** materials, participation format, teacher involvement, and any prerequisites.
5. **Example or illustrative content:** clearly label examples as illustrative and keep them separate from confirmed syllabus or schedule facts.
6. **Questions:** answer audience fit, timing, format, language, support, and what happens after inquiry.
7. **Direct inquiry:** one clear action in the selected language, with a short note that inquiry does not itself reserve a place.

Use the same headings and fact order in English and Chinese so a parent or teacher can compare the views. Translation can be natural rather than word-for-word, but it must preserve scope, numbers, modality, and status. Avoid putting a critical fact only in a screenshot, icon, tooltip, or one language.

## Verification before release

The research pass is HTTP-only, so browser verification is required. Test the actual course page in both views:

- Switch English → 中文 → English with mouse, touch, Tab, Enter, and Space. The selected state, heading, facts, CTA, and FAQ content must update together.
- Confirm the document language and language-of-parts markup after each switch. A screen reader should use the appropriate pronunciation rules for English and Chinese text where supported.
- Compare a generated fact checklist for both views: title, dates, class count, duration, audience, format, location, status, inquiry destination, and FAQ answers must match or be explicitly marked unavailable in both.
- Refresh, use Back/Forward, open the page at a deep link, and change language without losing the course identity or creating an accidental booking.
- Test a narrow viewport and large text so the switch and inquiry CTA remain visible, labels wrap, and no essential fact is clipped or hidden.
- Test with JavaScript unavailable or delayed. The English page and direct inquiry route should remain usable; if Chinese depends on JavaScript, state that limitation and decide whether a server-rendered or separate-URL fallback is needed.
- Check that the page title, meta description, canonical URL, and any future `hreflang` tags agree with the selected URL architecture. Do not claim SEO or conversion improvement from markup alone.

Record each result as **PASS**, **FAIL**, or **NOT_CHECKED**. Translation parity, browser behavior, accessibility announcements, and inquiry safety are separate checks.

## Source ledger and limits

| Source | Publisher | Verified observation |
|---|---|---|
| [Storytelling for Business Presentations](https://www.duarte.com/training/storytelling-for-business-presentations/) | Duarte | HTTP 200; English course page with explicit audience, online/onsite structured workloads, learning themes, FAQs, and direct “Talk with Our Team” inquiry routes |
| [Understanding SC 3.1.1: Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) | W3C Web Accessibility Initiative | Default human language of each page must be programmatically determinable; page updated 2026-03-09 |
| [Understanding SC 3.1.2: Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) | W3C Web Accessibility Initiative | Language of each passage or phrase can be programmatically determined; page updated 2026-07-12 |
| [`lang` HTML global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) | MDN Web Docs | `lang` uses BCP 47 tags; page and mixed-language parts should be marked for user agents and assistive technology |
| [Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions) | Google Search Central | Separate language/region versions should use explicit reciprocal `hreflang` annotations; `x-default` can identify a selector or fallback; `lang` and `hreflang` do not themselves determine page language for Google |

This review covers the listed public pages as returned on 2026-09-07. It does not verify the current SpeakKai course file, translation accuracy, browser interaction, screen-reader announcements, SEO indexing, inquiry delivery, or booking state. The bilingual switch and one-source fact model are implementation recommendations; they do not claim improved learning, conversion, ranking, or enrollment.

