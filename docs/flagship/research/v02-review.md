# SpeakKai flagship V2 offer-route review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: read-only review of the V2 changes in `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`: `src/pages/[offer].astro`, `src/components/FlagshipOfferPage.astro`, `src/data/flagshipOffers.ts`, and the tracked `src/components/FlagshipCurrentProgram.astro`. The V1 homepage and layout are the deployed baseline. No site checkout files were edited. No Sites tools or skills were used.

Validation available for this review: direct `astro check` completed with 0 errors, 0 warnings, and 6 existing hints across 65 files. The coordinating V1 QA pass reported a successful 38-route build, static integrity checks, CUA checks at 320/390/768/1440 with no overflow, working CTA/contact flow, visible skip-link focus, reduced-motion checks, and no console errors. The V2 route pages were not independently browser-rendered or deployed in this bounded review, so route-level screenshot and live-link verification remain useful before release.

## Verdict

V2 is a sound expansion of the flagship: the three audience routes have clear, differentiated copy, typed content, static paths, useful FAQs, practical prompts, and explicit “conversation does not confirm a booking” boundaries. The new coaching page restores the concrete Fall 2026 course without turning the other paths into invented fixed packages.

There is no release-blocking compile or route-integrity bug in the inspected source. The main follow-up is a conversion semantics issue: the shared header’s “Let’s talk” link always goes to the homepage `/#connect`, even on an offer page whose more relevant CTA is `#next-step`. This loses the offer-specific next-step context. A second, lower-severity issue is that offer-page CTAs say “Open WeChat contact” while linking to the generic contact page; the destination is honest, but the QR is still one additional interaction away.

## Route integrity

- `src/pages/[offer].astro:1-18` uses `getStaticPaths()` over the typed `flagshipOffers` array and generates the slugs `coaching`, `schools`, and `companies`.
- `src/components/FlagshipHome.astro:52-54` audience shortcuts and `:106` offer-card actions now target `/coaching/`, `/schools/`, and `/companies/`, matching the data slugs exactly.
- All offer pages pass their title and description into `FlagshipLayout` and use `current="programs"` (`src/pages/[offer].astro:14-18`), so canonical and social metadata are generated consistently.
- The offer-page back link `/\#work`, contact `/contact/`, schedule `/schedule/`, resources `/resources/`, and format/next-step anchors are all present and resolve to known routes or local IDs in source.
- No JavaScript is required for the route pages. FAQ `<details>` blocks are native, and all page content is statically rendered.

The V2 route files compile under `astro check`; no missing import, invalid Astro syntax, or type error was found. The shared `FlagshipCurrentProgram` import is present and tracked in the checkout.

## Findings

### P1 — global “Let’s talk” leaves the selected offer context

`FlagshipLayout.astro:70-71` uses `href="/#connect"` for the shared header CTA. On `/coaching/`, `/schools/`, and `/companies/`, the offer page’s own conversion section is `#next-step` (`FlagshipOfferPage.astro:104-112`) and contains the offer-specific `nextStep` request. A visitor who clicks the persistent header CTA is taken to the generic homepage closing section instead of the page-specific next step.

This does not break navigation, but it weakens the intended audience route and can make a school or company visitor lose the context they just evaluated. Pass an optional CTA target through `FlagshipLayout`, or use a route-aware link so offer pages target `#next-step` while the homepage keeps `/#connect`.

### P2 — “Open WeChat contact” is accurate as a destination but not as an immediate action

`FlagshipOfferPage.astro:109-115` labels the button `Open WeChat contact` but links to `/contact/`. The existing contact page presents the QR and handles, so this is not a broken link or a false promise. It does add a click between the offer decision and the WeChat QR, and the page does not carry the offer slug into the contact destination.

Consider a button label such as “View WeChat contact” or link directly to the full QR asset with a secondary “Contact details” link. If the generic contact page is retained, a small offer label can preserve context without collecting personal data.

### P2 — “executive coaching” remains a scope claim without an offer boundary

The companies data names `Presentation & executive coaching` (`flagshipOffers.ts:221-224`). Keynotes are explicitly within the current flagship objective; executive coaching is also a plausible service, but the public source baseline primarily describes professional presentations, business communication, and personal coaching. The V2 copy wisely asks for a brief and says scope, fees, and availability are agreed directly.

This is a content-alignment item rather than a blocker. Either retain it as an intentional service category or use “Presentation coaching” for tighter continuity with the established public wording. If retained, one sentence explaining that this means focused preparation for a specific speaking moment would reduce ambiguity; the existing detail already points in that direction.

## Fact and claim audit

### Coaching route

The student page is aligned with the approved source:

- `Young Competition Speakers` is correctly described as Fall 2026, Grades 1–2, 18 classes, six three-class units, short practice speeches, and a supported three-minute showcase (`flagshipOffers.ts:37-52`; `FlagshipCurrentProgram.astro:1-12`).
- Original oratory, expository speaking, storytelling, and specific presentation support are framed as conversation-dependent coaching paths, not guaranteed results (`flagshipOffers.ts:43-52`).
- The outcomes are practice behaviors—central idea, delivery choices, and one next adjustment—not promised competition placements (`flagshipOffers.ts:54-69`).
- The FAQ explicitly says competition-ready performance is not a prerequisite and results are not guaranteed (`flagshipOffers.ts:88-100`).

The headings “Help them find a voice of their own” and “growing independence” are aspirational marketing language, but the surrounding copy describes practice and does not claim a guaranteed transformation. This is acceptable if the page continues to retain the explicit no-guarantee answer.

### Schools route

The school page stays within the source-backed service framing: focused workshops, short or longer lesson sequences, teacher development, custom curricula, and agreed group/timetable details (`flagshipOffers.ts:123-155`). It does not name an unverified school partner, logo, award, ranking, or measured learner result.

The “outcomes” are framed as program aims and teacher-observable structures: clear purpose, repeatable practice, and feedback with a next action. The wording does not promise a score, award, or universal improvement. The FAQ correctly says curriculum fit, objectives, participants, and format must be discussed directly (`flagshipOffers.ts:167-182`).

### Companies route

The company page’s keynote, workshop, presentation-coaching, and online/in-person/hybrid language is intentionally within the V2 objective and is carefully qualified with “discuss,” “possible themes,” and “agreed with Kai” (`flagshipOffers.ts:209-224`, `:253-272`). It does not promise audience size, business impact, revenue, or guaranteed presentation results.

The practice outcomes—sharper message, a presentation that works aloud, and a next rehearsal—are concrete process outcomes, not business-performance claims (`flagshipOffers.ts:226-241`). The FAQ also keeps quoting and booking honest: a schedule view or inquiry does not confirm a booking (`flagshipOffers.ts:270-272`).

## Privacy and booking honesty

The V2 pages are appropriately private-data-minimizing for a first contact:

- Coaching asks for age/grade, goal, deadline, and preferred format, and explicitly asks visitors to leave out school records and other sensitive details (`flagshipOffers.ts:103-105`).
- Schools ask for age range, approximate group size, learning goal, dates, and format, and explicitly say names or individual records are unnecessary (`flagshipOffers.ts:189-190`).
- Companies ask for organization type, audience, challenge, approximate count, dates, and format, and say a short brief is enough (`flagshipOffers.ts:275-276`).
- The company FAQ advises against sending internal documents before confidentiality/material-sharing arrangements are agreed (`flagshipOffers.ts:260-263`).
- The school FAQ separates participation from public sharing and describes appropriate permission for identifiable student images, recordings, or stories (`flagshipOffers.ts:184-186`).
- Every offer page says scope, delivery, fees, and availability are confirmed in conversation (`FlagshipOfferPage.astro:47-49`), and the next-step sequence says agreement precedes booking (`FlagshipOfferPage.astro:117-123`).

No page claims that a schedule view reserves a place, and no page asks the visitor to enter student names, records, confidential company material, payment information, or account credentials. The contact destination is a static public QR/handle page, so no hidden form transmission is introduced by V2.

## Semantics and accessibility

The structure is generally strong:

- One page-level `h1` is rendered from each offer’s headline/emphasis (`FlagshipOfferPage.astro:10-20`).
- Fit, formats, practice, exercise, FAQ, and next-step sections have meaningful headings and native lists/details.
- FAQ plus signs are `aria-hidden`, and `summary` remains keyboard operable (`FlagshipOfferPage.astro:88-101`).
- The global layout supplies the skip link, visible focus outline, language attribute, and reduced-motion CSS (`FlagshipLayout.astro:19-48`; `flagship.css` reduced-motion block).
- The offer pages have no client-side state or inaccessible custom accordion logic.

The remaining semantic improvement is the header CTA target described above. A route-aware target would keep keyboard and screen-reader users in the same offer context. Screenshot and actual screen-reader testing were not independently repeated for V2.

## Maintainability and SEO

Moving content into a typed `Offer` model is a material improvement over duplicated page markup. The route template is shared, titles/descriptions are data-driven, and adding a future offer requires one data object plus the static path list.

The current `Offer` type uses `slug: string` rather than a literal union, so a typo can still generate a route that no homepage link uses. A small `as const` slug union or a static integrity check would make route/link drift harder. This is a low-risk maintainability improvement, not a release blocker.

Each route receives a unique title and meta description and a canonical path from `FlagshipLayout` (`FlagshipLayout.astro:11-45`). Open Graph and Twitter image metadata remain consistent. The routes add useful indexable depth, although no JSON-LD service/breadcrumb schema or explicit offer sitemap validation was inspected here.

## Recommended next actions

1. Make the shared header CTA route-aware: `#next-step` on offer pages, `/#connect` on the homepage.
2. Decide whether the WeChat button should say “View WeChat contact” or link directly to the QR while preserving the existing contact page as the details route.
3. Keep the coaching course block prominent and verify that the final deployed `/coaching/` page retains the exact 18-class, Grades 1–2, six-unit, and three-minute wording.
4. Confirm whether “executive coaching” is a deliberate service label; if not, use “presentation coaching.”
5. Run deployed V2 route checks at `/coaching/`, `/schools/`, and `/companies/`: verify canonical/title text, all internal links, QR/contact/schedule links, FAQ keyboard behavior, 320–390px layout, and no accidental booking or sensitive-data collection.

