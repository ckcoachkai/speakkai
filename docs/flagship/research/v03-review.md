# SpeakKai flagship V3 contact composer review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: independent read-only review of the V3 contact composer in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`, focused on `src/pages/contact.astro`, `src/lib/inquiry.mjs`, the offer-to-contact links, and the prior V2 review. No SpeakKai checkout files were edited, and no Sites calls were used.

## Verdict

V3 is a useful, appropriately bounded conversion step. It carries the offer audience into `/contact/?audience=...`, lets a visitor create and edit a local message, and makes the final WeChat handoff explicit. The page has a direct QR and handle path even without JavaScript, and the helper never sends, stores, or posts inquiry data.

No P0 or P1 source blocker was found. `node --test scripts/check-inquiry.mjs` passed all four tests. Direct `astro check` completed with 0 errors, 0 warnings, and the same six existing hints elsewhere in the site. The built contact HTML is version 03, contains one client script, preserves a `<noscript>` path, and contains no form submission, `fetch`, `XMLHttpRequest`, `sendBeacon`, or POST action.

The main follow-up is a privacy-copy gap for company inquiries. The composer’s field guidance warns about student names and records, but it does not warn company visitors against entering confidential internal material before a confidentiality arrangement. The company offer FAQ has that boundary, but the contact page should repeat it at the point where the user types and copies the brief.

## Findings

### P2 — company confidentiality guidance is missing in the composer

`src/pages/contact.astro:39-50` attaches `details-privacy` to the goal textarea and says to leave out “full student names and private records.” The same textarea is used after `audience=companies`, and the generated text is intentionally copied into WeChat. A company visitor could therefore paste confidential project, client, financial, or internal presentation material without seeing the relevant warning on this page.

Add a universal short warning such as “Use a general description. Leave out student records and confidential company material.” If the copy changes with the selected audience, keep the default and no-JavaScript wording equally safe. This is a content/privacy correction, not a data transmission bug: the current implementation remains client-only.

### P3 — audience context is only a one-time query preselection

`src/pages/contact.astro:172-182` reads the query once and selects the matching audience. Changing the select updates labels and placeholders, and `buildInquiry()` uses the current value, so the generated message is correct. Refreshing or using browser back/forward after a manual change loses that new choice because the URL is not updated. This is low impact and does not expose data, but a small in-memory or URL-state decision would make the route context more predictable.

### P3 — the replaced contact component remains as dead code

`src/pages/contact.astro` no longer imports `ContactStrip`, and `rg` found no remaining source import of `ContactStrip.astro`. Keeping the old component and its styling raises the chance of editing the wrong contact surface in a later cycle. Remove it after the V3 release is accepted, or document it as an intentional rollback artifact outside the active page path.

## What is working

- `FlagshipOfferPage.astro:111-114` sends each offer to `contact/?audience={offer.slug}` and changes the CTA to “Prepare your inquiry,” resolving the V2 review’s generic contact-context issue.
- `FlagshipCurrentProgram.astro:11-12` carries the course into the coaching audience route.
- `normalizeAudience()` uses own-property validation, so unknown query values fall back to `unsure` without being reflected in the generated message (`src/lib/inquiry.mjs:1-9`).
- `buildInquiry()` trims and bounds goal, group, format, and timing text, omits blank optional fields, and produces a plain-text draft (`src/lib/inquiry.mjs:10-24`).
- `copyInquiry()` reports success only after the provided write completes and gives a recoverable selected-text fallback when the clipboard is denied or unavailable (`src/lib/inquiry.mjs:26-45`).
- The contact page clearly says the website does not send or save the inquiry and that the visitor chooses what to share in WeChat (`src/pages/contact.astro:107-117`).
- The QR is a direct, labeled full-size image link with explicit dimensions and descriptive alt text (`src/pages/contact.astro:125-143`).
- The no-JavaScript branch still provides a direct WeChat instruction, QR, handle, schedule link, and no-booking guarantee (`src/pages/contact.astro:119-154`).
- All inquiry buttons are `type="button"`; there is no form action or backend endpoint.

## Conservative score

| Dimension | Score / 5 | Reviewer view |
|---|---:|---|
| Positioning | 4.0 | Starts with the visitor’s next speaking moment and supports three audience paths. |
| Credibility | 3.5 | Direct handle, QR and honest process language; no additional proof is introduced here. |
| Offer clarity | 4.0 | Audience selection and concrete prompts make the first brief easy to understand. |
| Conversion | 4.5 | Offer context, editable draft, clipboard fallback and direct QR form a coherent handoff. |
| Visual | 4.0* | Dedicated layout and QR panel are coherent; visual score relies on the separate QA pass. |
| Story / emotional fit | 4.0 | The tone is warm and specific without promising results. |
| Mobile | 4.0* | Responsive rules are present; final score relies on separate viewport QA. |
| Accessibility | 4.0* | Labels, fieldset legend, live status, focus target and native controls are present; final score relies on browser/AT QA. |
| Performance | 4.0 | No third-party runtime or network submission; QR is dimensioned and the script is small. |
| SEO | 3.5 | Title, description, canonical and one clear h1 are present; no structured data is added. |
| Maintainability | 3.5 | Helper extraction and tests help; the page still has a large inline script/style and a dead legacy component. |

**Total: 43 / 55**, with visual, mobile and accessibility marked provisional because this review is source/read-only.

## Five next priorities

1. Add the confidential-company-material warning to the composer’s goal guidance and the no-JavaScript instruction.
2. Keep the audience context stable after a manual selection, or explicitly treat the query as one-time initialization and avoid implying persistent routing.
3. Remove or clearly quarantine the unused `ContactStrip.astro` implementation after V3 acceptance.
4. Retain the tested clipboard failure wording and selected-text fallback as a release contract; do not replace it with a silent or sending action.
5. After deployment, recheck `/contact/`, `/contact/?audience=coaching`, `/contact/?audience=schools`, `/contact/?audience=companies`, and an invalid audience query for canonical/title, no-JavaScript direct contact, QR reachability, no data submission, and the exact generated message.

