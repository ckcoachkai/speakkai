# V9 global benchmark: compact navigation with reachable Contact

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded, read-only public-page research before a SpeakKai flagship navigation implementation. The design target is a compact responsive navigation/disclosure that keeps Contact visible, works for keyboard users, and remains usable with large text. No website edit, form submission, sign-in, or shared-browser-tab inspection was performed.

## Direct recommendation

Use a compact header with a small set of visible top-level links and a separate, always-visible **Contact** link or button. On narrow screens, collapse secondary groups behind a clearly labelled menu control, but keep Contact beside that control and repeat it as the first or last item in the open panel. Do not make Contact depend on hover, a pointer-only mega-menu, or a hidden footer.

For a group with child links, preserve the parent destination as a normal link and give the group a separate disclosure control. Implement that control with a native `<button type="button">` and a controlled region:

- The button exposes its state with `aria-expanded="false"` or `true`.
- `aria-controls` points to the controlled region when a custom disclosure is used.
- The button has an accessible name such as “Show Practice links” and “Hide Practice links”.
- Enter and Space open or close it; native button semantics supply this behavior.
- The open region appears in the DOM and follows the trigger in logical tab order.
- Visible focus remains clear at every size, and the expanded panel can wrap and scroll vertically without clipping links.

A native `<details>/<summary>` disclosure is also suitable for a simple no-script group, provided the summary contains one clear control and does not nest an interactive link inside it. Use a custom button and explicit state when the header needs coordinated panels, focus return, or a modal-like menu.

## What the international speaker/training source establishes

[Duarte’s homepage](https://www.duarte.com/) returned HTTP 200 with the title “Communication & Presentation Skills Training | Duarte.” Its delivered HTML contains:

- A desktop primary navigation with groups such as Training, Services, Resources, and About.
- A mobile-specific menu toggle rendered as a native button with the label “Open Primary Menu”, plus a corresponding “Close Primary Menu” button.
- A mobile menu overlay with grouped links and separate “Toggle Sub Links” buttons.
- A visible header call-to-action linking to Duarte’s contact route, labelled “Let’s talk”, and additional contact links in the page content.

This is useful as an information-architecture signal: a communication-training site keeps a human contact route discoverable while providing a compact mobile entry. The mobile markup also keeps parent links and child-link toggles separate, a pattern that maps well to SpeakKai’s practice, programmes, and contact routes.

The static source includes CSS and responsive classes such as `d-xl-none`, a modal overlay, and menu data attributes. These prove what was delivered in HTML/CSS. They do not prove the computed layout at a given viewport, that the overlay opens correctly, that focus is trapped and returned correctly, that screen readers announce the state, or that the menu remains usable at 200% text size.

Duarte is a large corporate training site with a much deeper information architecture than SpeakKai. Its markup should be treated as a benchmark observation, not copied as a component or presented as evidence of accessibility conformance.

## Authoritative disclosure and keyboard guidance

The [W3C WAI-ARIA Authoring Practices disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) defines a disclosure as a button controlling content that is collapsed or expanded. Its keyboard guidance says Enter and Space activate the control and toggle the controlled content. The pattern uses button semantics, sets `aria-expanded="true"` when the content is visible, and optionally uses `aria-controls` to identify the controlled region. WAI also publishes a disclosure-navigation example that preserves top-level links.

[MDN’s `aria-expanded` reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded) describes the attribute as the state of a control and whether the controlled elements are displayed or hidden. [MDN’s button-role guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role) warns that `role="button"` alone does not provide click behavior or keyboard handling. MDN recommends a native `<button>` or `<input type="button">`; a custom element must supply focusability and handlers for click, Enter, and Space.

These sources support a small implementation contract: use the native control first, expose the current state, identify the controlled content, and preserve a normal link for any top-level destination that users may need to open directly.

## Large-text and reflow requirements

[W3C WAI’s Understanding SC 1.4.4, Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), updated 12 July 2026, states that text can be resized up to 200% without loss of content or functionality. For V9 this means the header cannot hide Contact, clip the menu label, or make disclosure controls unusable when text is enlarged.

[W3C WAI’s Understanding SC 1.4.10, Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), updated 10 August 2026, states that ordinary vertically scrolling content should be available at a width equivalent to 320 CSS pixels without loss of information or functionality or two-dimensional scrolling. The page explains that responsive navigation may relocate content into a “More” or hamburger menu if all information and functionality remain available. It also cautions that sticky navigation can obscure keyboard focus and suggests making such components static or user-toggleable at smaller sizes.

Apply these requirements to the header and menu rather than assuming that a responsive CSS breakpoint is enough. Use flexible widths, allow labels to wrap, avoid fixed-height menu rows, and ensure the expanded panel does not cover the focused link or the Contact action.

## SpeakKai implementation recommendation: Compact Resource Nav

Create one original **Compact Resource Nav** with this structure:

1. **Header at every size:** SpeakKai logo, visible links for the most important resource families, a visible **Contact** link, and a **Menu** button when groups need collapsing.
2. **Top-level destinations:** Keep parent routes such as Practice, Programmes, and About as links. Give each group a nearby “Show [group] links” button when it has children.
3. **Secondary panel:** Show child links in a single-column panel on narrow screens. Keep labels descriptive, such as “Try a speaking practice,” “School programme overview,” “Company speaking workshop,” and “Contact SpeakKai,” instead of repeating “Learn more.”
4. **State and focus:** Update `aria-expanded` whenever a group opens or closes. Move focus into a newly opened custom panel only when the interaction model requires it; return focus to the triggering button when that panel closes. If the menu is a dialog, provide an accessible name, Escape-to-close, and a tested focus boundary. A simple disclosure should remain a disclosure rather than acquiring dialog behavior accidentally.
5. **No-script resilience:** Keep the key parent links and Contact route available in ordinary HTML. If JavaScript controls a custom panel, provide a usable fallback or document the limitation.
6. **Contact reachability:** Do not remove the visible Contact action at the mobile breakpoint. A user should be able to see and activate Contact without opening a hover menu, scrolling to the footer, or knowing an icon-only control’s meaning.

The visual treatment can remain compact: one row on wide screens, a two-action header on narrow screens, and a vertical panel for secondary links. The accessibility contract matters more than matching Duarte’s modal or mega-menu implementation.

## Verification before release

Browser testing is required because the research pass inspected HTTP responses and static markup only. Test the actual SpeakKai build with:

- A narrow viewport around 320 CSS pixels: Contact remains visible, the Menu button is labelled, the panel opens, every link wraps, and no control is clipped.
- Keyboard only: Tab reaches Contact and Menu; Enter and Space toggle the disclosure; focus is visible; Escape behavior is correct for any custom panel; closing returns focus predictably.
- Large text and zoom: text resize to 200% preserves content and functionality; 400% zoom/reflow reaches the 320 CSS pixel equivalent without ordinary header links requiring horizontal scrolling.
- Screen reader output: the menu control announces its name and expanded/collapsed state; the controlled region and links have sensible names and order.
- Touch and pointer: the same routes work without hover, and the menu remains operable when the user taps outside or navigates back.
- Regression: desktop links, child disclosures, Contact, language controls if present, and the no-script path all retain their intended destinations.

Record these as observed pass, fail, or untested results. HTTP-only evidence must not be upgraded into a claim about mobile behavior, keyboard operation, screen-reader announcements, or large-text usability.

## Source ledger and limits

| Source | Publisher | Verified observation |
|---|---|---|
| [Duarte homepage](https://www.duarte.com/) | Duarte | HTTP 200; delivered HTML contains desktop navigation, a native mobile menu toggle, a mobile overlay with grouped links and sub-link buttons, and a visible “Let’s talk” contact route |
| [Disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | W3C Web Accessibility Initiative | Disclosure is a button controlling collapsed/expanded content; Enter and Space activate it; `aria-expanded` reflects visibility; `aria-controls` is optional; a hybrid navigation example preserves top-level links |
| [`aria-expanded` attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded) | MDN Web Docs | Defines `aria-expanded` as the state of a control and the visibility of its controlled elements |
| [button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role) | MDN Web Docs | `role="button"` alone does not provide click or keyboard behavior; native buttons are generally recommended |
| [Understanding SC 1.4.4: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) | W3C Web Accessibility Initiative | 200% text enlargement must preserve content and functionality; page updated 2026-07-12 |
| [Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | W3C Web Accessibility Initiative | Ordinary content should reflow at a 320 CSS pixel width without two-dimensional scrolling; sticky navigation must not obscure focus; page updated 2026-08-10 |

The review covers the listed public pages as returned on 2026-09-07. It does not verify the Duarte implementation in a live browser, SpeakKai’s current navigation, responsive breakpoints, keyboard or assistive-technology behavior, or any conversion, contact, or learning outcome. The Compact Resource Nav is an original SpeakKai recommendation.

