# Component library — V30

Components live under `src/components`; the shared shell is under `src/layouts`. See HANDOVER.md for final validation and release evidence.

| Component | Responsibility | Important contract |
|---|---|---|
| FlagshipLayout | Page shell, metadata, language, header/navigation, footer | One main landmark; real canonical; selected language; explicit alternatives; no unnecessary hydration |
| FlagshipHome | Homepage hero, audience routes, current program, story, method and contact | Real portrait; visible offer paths; published resource links |
| FlagshipMethodExamples | Compact audience examples inside the homepage method | Static links to exact examples; school title/time/link gated by published CMS record; localized course alternative |
| FlagshipBreadcrumbs | Page ancestry and current label | Current page is identifiable; preserve linked ancestors |
| FlagshipOfferPage | Student, school and company offer structure | Typed audience data, valid contact target, published related practices |
| FlagshipCurrentProgram | Confirmed course entry | Derive course scope from currentProgram; avoid extra promises |
| FlagshipChineseCourseEntry | Explicit Chinese course route from English homepage and coaching offer | Label destination language; keep route and scope accurate |
| FlagshipCoursePage | Bilingual course, scope facts, learning cycle, feedback and contact | One shared numerical model; paired narrative; same wording in first/retry; localized pause cue |
| FlagshipPracticePage | Complete authored lesson and printable sheet | Published content only; coherent timing; usable static content; correct follow-up audience |
| PracticeGuide | React enhancement for one-step practice | No recording/persistence; heading focus after user navigation; finish/retry; static sheet remains |
| ChineseCourseInquiry | Optional local inquiry preparation | One instance per page: fixed IDs and single query selector; editable draft; explicit copy; no submission/reservation/persistence |
| FlagshipBriefExample | Fictional company example and optional revision | Same opening, one changed ending, native details, listener check, published lesson link |
| FlagshipResourceIndex | Shared bilingual resource landing page | Published-record gating; localized practices and visual examples |
| FlagshipContactPage | Shared bilingual optional inquiry composer | Local editable draft; truthful copy state; no send, booking or persistence |
| ToolsGallery | Existing tool discovery inside resource pages | Localized descriptions; English-only destinations explicitly labeled |
| FlagshipWatchPage | Three visual practice choices, silent animation, complete text and print sheet | Native anchors and video; no page hydration; print reflection area |
| FlagshipStagePractice | Original fictional 3D scene and three rehearsal cues | Native details; same source strings for complete print cues; no 3D runtime |
| FlagshipStoryPrompt | Original AI picture, observation/possibility prompts and optional example | Full description and provenance; same source strings for print example |

## Use the smallest suitable component

Render informational content in Astro. Use native links, details and form controls for their standard behavior. Add a React island only when stateful interaction warrants it; the practice guide already has a clear isolated responsibility. A new decorative section does not require page-wide hydration or a framework migration.

The shell receives title, description, current navigation context, contact target, optional service/breadcrumb data, selected language and alternatives. Match the route's content rather than copying metadata from another audience. Course and practice templates derive their content from validated records; do not duplicate numerical course scope in new components.

## Shared presentation

`src/styles/flagship.css` owns colors, typography, page spacing, common actions, navigation, grids, focus and reduced-motion behavior. Component-local styles own specific structures. Use `minmax(0, 1fr)` or content-aware tracks where enlarged text can impose minimum widths. Keep numeric labels together and let content grow vertically.

Use existing primary `.button`, secondary `.text-link`, section `.eyebrow`, `.wrap` and `.section` conventions. Do not make non-interactive labels look like buttons. Keep actual controls at usable touch sizes, with visible keyboard focus and understandable names.

The shell uses local Manrope Latin weights 400/600/700. Its logo uses Astro Image, WebP candidates at 160/320/480px, rendered sizes 126/158px and eager loading. Preserve the page-specific asset contracts in docs/flagship/v15-budget.json and scripts/check-flagship-budget.mjs; deployment runs the budget check.

The bilingual contact composer owns a school-only, allowlisted program direction separate from delivery preference. Initial query selection applies only to the school audience. Generated drafts remain editable and only rebuild explicitly. Field changes announce that the existing draft is unchanged. Language switching resets local draft/query state; it is not a translation or submission action.

## Content and state boundaries

Fictional demonstrations need an adjacent fictional label. A displayed before/retry sequence is a teaching illustration, not proof of learning. Preserve explicit uncertainty about delivery, fees, availability and outcomes. Never turn a local draft or editor save into an apparent sent message or live publication.

Use published-record gating for links into optional content. Paired English/Chinese content needs both structural checks and meaning review. The current schema checks exact fields and lengths; it cannot establish pedagogical quality or accurate translation.

## Acceptance before reuse

Run the relevant content checks and production build, then inspect the component in its actual page. Cover ordinary 320px/desktop layouts, long or enlarged text, keyboard input, no-JavaScript reading and all implemented states. Add reduced-motion/media checks where applicable. Keep byte budgets and schedule/tool regressions in the release gate. Passing one component's tests does not verify all assistive technologies or browser engines.
