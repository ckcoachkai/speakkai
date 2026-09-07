# V12 global benchmark: make the Chinese Fall course discoverable

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded HTTP research before changes. The target is one visible Chinese Fall-course entry from the homepage, student offer, or resources area. This does not propose a whole-site language switch. No product edit, build, or shared-browser inspection was performed.

## Source signal

[Toastmasters International’s homepage](https://www.toastmasters.org/) returned HTTP 200. Its delivered HTML exposes **Education Programs**, **Resources**, and repeated **Find a Club** calls to action. The page describes a worldwide club network, speech practice, impromptu questions, and constructive feedback, and links to the Pathways learning experience, described as featuring six paths in six languages.

This is a useful discovery pattern: a global speaking organisation gives visitors separate entry points for learning, resources, and a next human/community action. The homepage does not expose a Chinese-specific Fall course in its static HTML. That absence is an observation about this response, not a failure claim about Toastmasters’ live experience.

## SpeakKai recommendation

Add one consistent card or link in each of these three surfaces:

- **Homepage:** 中文｜Young Competition Speakers｜Fall 2026
- **Student offer:** the same label beside audience, level, and format
- **Resources:** the same label with a short course overview

All three should point to the same course route and use one direct action such as **Ask about this course** / **咨询课程**. The entry should identify language, audience/grade, Fall 2026 term, confirmed class count or dates, delivery format, and status before the visitor needs to open a menu. Keep the inquiry action discussion-based; it does not reserve a place or confirm enrollment.

Use visible native-language labels rather than flags alone. Keep the selected language explicit in the course view, but do not infer or force a language from browser, IP, or device settings. For a same-route switch, set the document and bilingual blocks with valid lang values such as en and zh-Hans; W3C WCAG 3.1.1/3.1.2 and MDN’s lang guidance support programmatically identifying the page and language parts. If separate localized URLs are later created, add reciprocal hreflang only after both routes carry matching facts.

Render the English and Chinese cards from the same immutable facts object. Dates, numbers, term, grade range, format, and status must be shared values; only labels and explanatory copy vary. Preserve explicit unknown or pending states in both languages.

## Verification boundary

Before release, verify that Home, Student Offer, and Resources each expose the same destination and label, the course page retains fact parity, the language switch is keyboard-operable, and the inquiry route is reachable without automatic booking. This pass did not test viewport behavior, touch interaction, translation quality, screen-reader announcements, indexing, or conversion.

## Source ledger

| Source | Publisher | Verified observation |
|---|---|---|
| [Toastmasters International homepage](https://www.toastmasters.org/) | Toastmasters International | HTTP 200; Education Programs, Resources, Find a Club, global speaking-practice description, and six-language Pathways link |
| [Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) and [Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) | W3C WAI | Page and passages in different languages must be programmatically determinable |
| [lang global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) | MDN Web Docs | Use valid BCP 47 language tags for page and language parts |
