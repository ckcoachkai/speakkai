# V23 global benchmark: preserve the example, the format and the next action

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for SpeakKai’s English and Chinese audience/service offers. The decision is how to keep concrete examples, meaningful format distinctions and an honest next action aligned across languages. No product files, builds, browser/shared-browser actions or deployment were performed.

## Fresh official speaker/training-provider reference

[Toastmasters International: Membership](https://www.toastmasters.org/membership) returned HTTP 200 on 2026-09-07. The page title is **“Toastmasters International -Membership.”** It presents a visitor journey with distinct information and actions:

- A membership overview explains what a prospective member can expect.
- **“My First Meeting”** is described as a preview of the experience.
- **“The Club Experience Video”** shows a club meeting in action.
- **“Club Meeting Roles”** provides brief descriptions and resources for different roles.
- The page keeps clear next actions such as **“Find a Club”** and **“Start a Club.”**

The transferable pattern is structural: let a visitor see a specific experience or task, preserve meaningful distinctions between ways to participate, and finish each path with a concrete action. A short preview helps a visitor choose without copying the entire service or lesson onto the entry page.

The page does not demonstrate English/Chinese parity, prove any Toastmasters outcome, or establish a SpeakKai package. Its membership model, roles, resources and calls to action remain Toastmasters content.

## Current SpeakKai strengths

Read-only inspection of `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30` shows a useful foundation:

- `src/data/homeCopy.ts` keeps the same three audience offers in English and Simplified Chinese: students/parents, schools/educators, and companies/event teams. Each language has its own audience label, title, short explanation, format detail and audience-specific action.
- `src/data/flagshipOffers.ts` keeps real service distinctions rather than collapsing everything into generic “training.” Coaching distinguishes Young Competition Speakers, focused speech coaching, and debate/competition preparation. Schools distinguishes a focused workshop, a sequence of lessons, and teacher development. Companies distinguishes a keynote, a practical team workshop, and presentation/executive coaching.
- Each offer contains a concrete example prompt and steps, a fit section, preparation or scoping information, and a `nextStep` inquiry brief. The destination pages therefore carry the detail while the homepage can remain a concise choice point.
- `src/components/FlagshipMethodExamples.astro` gives the homepage specific, inspectable examples: a pause-and-retry course example, a school paired activity, and a company briefing revision. The English and Chinese labels preserve the same audience order and teaching move.
- `src/lib/siteLanguage.mjs` explicitly distinguishes genuine language pairs from visible fallbacks. The course and `one-object-story` practice have Chinese routes; untranslated audience pages remain English destinations and can be labeled as English rather than presented as translated offers.
- The Chinese homepage already has translated audience summaries and links. That is useful entry information, but it does not mean the linked `/coaching/`, `/schools/` or `/companies/` pages are available in Chinese.

## Current misses and risks

The Chinese homepage can describe all three audiences in Chinese while sending visitors to English-only offer pages. That is an honest fallback when the destination label says English, but it is still a language break: the visitor will not see the format distinctions, example prompt, preparation notes, FAQ or `nextStep` copy in Chinese.

The most valuable detail is distributed across the offer record and the English-only page renderer. If future Chinese offer pages copy only the headline and summary, they can lose the three-format distinction, the specific exercise and the precise inquiry fields that make the next action useful. If the two languages are maintained as unrelated prose, format order and example meaning can drift.

The homepage’s three method examples are a good preview layer, but their link state must remain visible. A Chinese label should not imply that a Chinese destination exists when `localizedPath` falls back to an English route. The existing `destinationLabel` convention (`（英文）`) is a useful honesty shield and should remain adjacent to the link text.

## Bounded recommendation

Preserve one shared offer shape for both languages. For every audience, keep these four fields aligned in order:

1. **Who it is for:** the audience and the speaking situation.
2. **How the work can take shape:** the existing three named formats, with their distinct fit and scope.
3. **What the visitor can inspect:** one existing concrete example or prompt, clearly labeled as a practice example where appropriate.
4. **What to do next:** an audience- and format-specific discussion action, followed by the existing scoping fields and confirmation boundary.

Keep the three English and Chinese homepage cards parallel in order and meaning. Preserve their current audience-specific actions rather than replacing them with a generic “Learn more.” Keep the destination page responsible for the full format explanation, example steps, preparation, FAQ and inquiry boundary.

For Chinese audience pages that do not yet exist, continue linking to the English route with a nearby **（英文）** marker. Do not attach Chinese `hreflang`, call the page a Chinese translation, or duplicate the full English page into a thin machine-translated shell. When a Chinese offer page is complete, add it as an explicit language pair and translate the whole decision path: audience fit, all three format distinctions, example, preparation, FAQ and `nextStep`.

Keep the exact examples already present:

- Coaching: the existing pause-and-retry example.
- Schools: the existing “Explain it to a younger student” or published paired activity, according to the destination currently linked.
- Companies: the existing briefing example with a revised ending and listener check.

Use the example as a preview of the method, not as a testimonial, client result, standard package or guarantee. Keep the next action specific, for example **Discuss student coaching**, **Discuss a school program**, or **Discuss a talk or workshop**. The action starts a conversation; it does not confirm a date, fee, capacity, partnership or deliverable.

## Testable hypothesis and release checks

**Hypothesis:** If each English and Chinese audience entry preserves the same audience, three format distinctions, concrete preview and clear next action, visitors can choose an appropriate path without the localized page overstating translation coverage or inventing a package.

Before any later product edit, record each result as PASS, FAIL or NOT_CHECKED:

- English and Chinese homepages present the same three audiences in the same order and preserve equivalent meaning.
- Every audience retains its existing format distinctions: three coaching directions, three school formats and three company formats.
- Format names and descriptions remain specific enough to distinguish a workshop, sequence, keynote, team workshop or coaching conversation.
- Each audience has one concrete example or prompt linked to the existing source page, with fictional/example boundaries preserved where applicable.
- Each audience has a clear next action naming the conversation or route; generic or misleading “learn more” links do not replace it.
- Chinese links to English-only destination pages are visibly marked as English and do not receive false Chinese `hreflang` metadata.
- A future Chinese offer page is considered complete only when it carries the format distinctions, example, preparation, FAQ and next-step boundary in Chinese, not just a translated hero.
- English and Chinese example order, audience association, and teaching move remain aligned.
- No example becomes a testimonial, outcome claim, standard package, availability statement or guarantee.
- A first inquiry remains a discussion; dates, fees, availability, responsibilities and deliverables are confirmed directly with Kai.
- Live route resolution, final rendered language parity, translation review, keyboard behavior, screen-reader output and analytics remain **NOT_CHECKED** in this research because no build or browser verification was authorized.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [Membership](https://www.toastmasters.org/membership) | Toastmasters International | HTTP 200 on 2026-09-07; official speaker-training membership page with an overview, “My First Meeting” preview, club-experience video, role-specific descriptions/resources, and clear “Find a Club”/“Start a Club” actions. Used as an information-architecture reference only. |

## Local source inspected

- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\data\homeCopy.ts`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\data\flagshipOffers.ts`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipMethodExamples.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipOfferPage.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\lib\siteLanguage.mjs`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\pages\zh\index.astro`

## Unavailable or unverified

- No Chinese coaching, schools, companies, contact, resources index or schedule offer pages were created or verified as complete translations in this pass.
- No translation review, route/build check, live rendering, click behavior, analytics, conversion or audience comprehension was measured.
