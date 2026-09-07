# V17 global benchmark: show the teaching

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for a small communication-practice example. The goal is to show a learner what to do through a concrete fictional briefing, then one revision and a listener check. No product files, builds, shared-browser inspection, or claims about learner outcomes were made.

## Fresh communication benchmark

[Julian Treasure: 5 ways to listen better](https://www.ted.com/talks/julian_treasure_5_ways_to_listen_better) returned HTTP 200 on 2026-09-07. The page describes a short talk in which Treasure shares five ways to re-tune the ears for conscious listening to people and the world, and it exposes a transcript route. The useful teaching pattern is observable and sequenced: name a communication skill, give several concrete ways to practise it, and let the learner inspect the explanation.

This is a presentation-page observation, not evidence that the talk improves listening or that SpeakKai learners will achieve a result. Its five-way structure can inform the shape of a practice example, while the content and speaker claims remain TED/presenter material.

## Recommended example reveal

Add one optional, clearly labeled example after the practice prompt. Use native HTML disclosure so the initial page remains small and the example remains available without JavaScript:

**Summary:** 显示一个虚构的团队简报示例 / Show a fictional team briefing example

Inside the reveal, label the example as fictional and show exactly one targeted revision:

**Fictional practice example — no real team or outcome**

**Initial version**  
“We need to improve our presentation. Let’s communicate better.”

**One targeted revision: decision + owner + date**  
“For today’s three-minute briefing, lead with the decision, name one owner, and state the next check-in by Friday.”

**Listener check**  
The listener repeats: “The decision is ___, the owner is ___, and the check-in is Friday.” If any part is unclear, the speaker replaces that phrase with a specific word or date.

The example demonstrates a teachable move: replace a broad intention with a concrete decision, owner, and time. It does not invent a team, a learner, a before/after result, a percentage, a testimonial, or a guaranteed outcome. Keep the learner’s own practice prompt separate from this fictional text.

## Accessibility guidance

[MDN: details HTML details disclosure element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) explains that a details widget needs a summary or label, with the summary serving as the disclosure label and the details content providing its description. Its documented closed state shows only the label and its open state reveals the contents; the native control supports click and Space-key toggling.

[W3C APG: Disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) defines the equivalent button pattern: Enter and Space toggle the content, the control exposes aria-expanded true or false, and aria-controls may identify the controlled section. Prefer native details/summary for this single optional example; use a custom button only if a demonstrated product need requires behavior the native element cannot provide. Do not build a tab interface for one example.

For the native version, keep summary text specific, put the complete example in the controlled details content, preserve visible focus, and test keyboard operation at 200% text size and narrow reflow widths. Do not hide the exercise prompt, the main course action, or the direct contact path behind the disclosure.

## V17 content and implementation boundary

- Keep the initial practice instruction actionable: ask the learner to give a short briefing with a decision, owner, and next check-in.
- Keep the example optional and closed by default if the practice page’s current design favors learner-first discovery.
- Render the example in the page HTML; JavaScript is unnecessary for opening or closing native details.
- Keep the wording in the selected page language and preserve English/Chinese meaning parity; do not translate the fictional example into a new promise.
- Keep any listener check observable: ask the listener to repeat the three pieces, then revise one unclear phrase.
- Do not add invented results, named teams, real organizations, testimonials, completion claims, skill guarantees, or assessment scores.
- Do not introduce a framework or new client island for a disclosure that native HTML already provides.

## Testable hypothesis and release checks

**Hypothesis:** If a learner can open one optional fictional briefing, see an initial broad version, inspect one targeted revision, and use the three-part listener check, then the page demonstrates the teaching move without asserting an unverified outcome.

Before release, record each result as PASS, FAIL, or NOT_CHECKED:

- The summary identifies the content as a fictional example and says what will be revealed.
- The native disclosure opens and closes with pointer, keyboard focus, Enter/Space as supported by the browser, and JavaScript disabled.
- The example contains the initial version, one targeted revision, and a listener check in that order.
- The learner can identify the decision, owner, and date in the revised version.
- The listener check asks for observable repetition and gives a clear revision action.
- The example does not claim a real person, team, result, improvement, or guarantee.
- The main practice prompt, course route, and direct contact path remain visible and usable when the example is closed or open.
- English and Chinese versions preserve the same teaching move and fictional boundary.
- At 200% text size and a narrow reflow width, summary, example, prompts, and controls remain readable without clipped ordinary content.

This research did not edit the practice page, test the native control in the current browser, verify translation quality, run a screen-reader check, or measure learner comprehension.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [5 ways to listen better](https://www.ted.com/talks/julian_treasure_5_ways_to_listen_better) | TED | HTTP 200; page describes five concrete ways to practise conscious listening and exposes a transcript route |
| [details HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details) | MDN Web Docs | HTTP 200; native summary label, closed/open states, and keyboard toggling guidance |
| [Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | W3C WAI | HTTP 200; custom disclosure keyboard, aria-expanded, and optional aria-controls guidance |

## Unavailable or unverified

- The TED-Ed lesson URL attempted during this pass returned HTTP 404, so no TED-Ed lesson structure was treated as verified; the TED communication talk above is the usable benchmark.
- Product behavior, learner comprehension, translation quality, screen-reader output, 200% enlargement, and narrow reflow remain NOT_CHECKED.
