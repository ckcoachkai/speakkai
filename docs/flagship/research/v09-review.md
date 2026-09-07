# SpeakKai flagship V9 compact mobile navigation review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: bounded read-only source and generated-artifact review of the V9 changes in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`. Reviewed `src/layouts/FlagshipLayout.astro` and the related `src/styles/flagship.css` diff, with the V9 global and China research memos in `C:\Users\kai\Documents\ChatGPT\HQ\outputs\speakkai-flagship-research`. Focus: native mobile disclosure semantics, keyboard and focus handling, no-JavaScript behavior, desktop/mobile CSS correctness, and the 320px header objective. Browser interaction and screen-reader testing were left to the coordinating agent.

## Verdict

V9 is structurally sound. The mobile menu is a native `<details>/<summary>` disclosure, so it retains keyboard activation and open/close behavior without JavaScript. Contact remains a separate visible header link, and the four secondary navigation links are available in the controlled region. The small script adds Escape-to-close with focus returned to the summary and improves focus handling for same-page hash links.

No P0, P1, or P2 blocker was found. The source and generated V9 output contain one desktop navigation and one mobile disclosure, with the inactive version hidden by CSS at each breakpoint. The no-JavaScript path keeps the disclosure operable, and the static HTML keeps Contact available outside the disclosure. The parent agent owns the final browser checks for real keyboard operation, focus visibility, 320/900/1440 layout, large text, and assistive technology.

## Evidence-backed strengths

- `FlagshipLayout.astro:26-31` centralizes the four navigation destinations, so desktop and mobile use the same href and label data.
- `FlagshipLayout.astro:91-102` uses a native `<details class="mobile-navigation">` with a `<summary>` named “Menu” and a nested navigation. The decorative plus is `aria-hidden`; native summary semantics provide the disclosure control.
- `FlagshipLayout.astro:126-153` closes the disclosure on Escape and returns focus to the summary. Same-page hash links close the menu and temporarily give the target `tabindex="-1"` so focus can move to the destination without permanently changing the document’s tab order.
- The script does not replace native activation. Enter and Space remain supplied by the summary element, and no custom `role="button"` or fragile click-only control was introduced.
- `flagship.css:156-158` hides the mobile disclosure by default. At `max-width: 720px`, `flagship.css:598-624` hides the desktop nav, keeps the header CTA visible, and gives the disclosure a full-width flex row.
- `flagship.css:625-655` provides a 44px minimum summary row and 44px minimum navigation links, a visible focus path through the global `summary:focus-visible` rule, and `overflow-wrap: anywhere` for narrow or enlarged text.
- The generated V9 homepage contains one `details.mobile-navigation`, one Menu summary, the four expected links, and `speakkai-version="09"`. The mobile disclosure is initially closed in ordinary HTML, so a no-JavaScript browser can open it natively.
- Contact remains a separate `header-cta` link before the mobile disclosure. This satisfies the research requirement that contact not depend on a hover menu or hidden footer.
- The global reduced-motion rule still disables transitions and animations. V9 introduces no new dependency or runtime package.

## Optional P3 polish

The V9 map no longer emits an `aria-current` attribute for the header links. The V8 layout only marked “Meet Kai” when `current === "about"`, and no active flagship page currently passes `current="about"`, so this is not a functional regression in the checked routes. If active-page indication becomes a requirement, make the navigation entries carry explicit keys and map `current` to the relevant destination rather than relying on the old one-off condition.

The breakpoint keeps desktop navigation through 720px and switches to the disclosure at 720px and below. This is a valid design choice if the coordinating viewport checks confirm that the desktop header remains legible in the 721–1000px range. It is a responsive verification point, not a source-level defect.

## Verification status

- `git diff --check`: PASS, with only expected LF/CRLF working-tree warnings.
- Static source inspection: native disclosure, visible Contact, Escape focus return, same-page focus handling, no-script markup, and narrow-link wrapping all present.
- Generated V9 artifact inspection: release marker 09, disclosure markup, expected navigation labels, and Contact link present.
- Browser keyboard, screen-reader, large-text, and physical print behavior: not independently rerun in this bounded review; root’s coordinating QA should supply those observations before converting the conditional score uplift into a final release claim.

## Conservative score

V8 baseline: `3.5, 2, 4.5, 4, 4, 4, 4, 3.5, 3, 4, 4.5 = 41/55`.

If root’s browser evidence confirms the stated 320/900/1440 no-overflow, visible focus, Enter/Space activation, Escape focus return, and no-JavaScript behavior, raise only Mobile by 0.5:

| Dimension | Score / 5 |
|---|---:|
| Positioning | 3.5 |
| Credibility | 2 |
| Offer clarity | 4.5 |
| Conversion | 4 |
| Visual | 4 |
| Story / emotional fit | 4 |
| Mobile | 4.5, conditional on coordinating QA |
| Accessibility | 3.5 |
| Performance | 3 |
| SEO | 4 |
| Maintainability | 4.5 |

**Conditional total: 41.5/55.**

Without that coordinating browser evidence, retain the V8 mobile score and report V9 as source-ready but behaviorally unverified.

## Coordinating browser addendum — 2026-09-07

Root’s production-preview QA now confirms the behavior left untested in this independent source pass:

- At 320px, header height is 114.43px versus the V8 baseline of 206.61px, and the H1 begins at 206.82px versus 299.01px: a 44.6% reduction in the measured top offsets.
- No horizontal overflow was observed at 320, 720, 721, or 1440px. At 721px the desktop header wraps to 140.85px; the 1440px header remains 84px.
- Enter and Space toggle the native disclosure. Escape from a menu link closes the menu and returns focus to the summary. The same-page Work link closes the menu and focuses the Work target.
- The Resources link reaches a page with the visible Contact action, and the native no-JavaScript menu opens all four links.
- A header-only temporary 200% text check at 320px produced 28px Menu/Contact text and 32px links without clipping or overflow; the temporary style was restored.

This coordinating evidence satisfies the conditional mobile uplift. V9’s final conservative score is **41.5/55**, with Mobile at 4.5/5. Actual screen-reader output and full-site native 200% text resizing remain untested and should stay labelled that way.

