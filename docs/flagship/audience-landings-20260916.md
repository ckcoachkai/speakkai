# Audience-specific homepage — September 16, 2026

This supersedes the earlier universal homepage service catalogue. Kai requested that the entrance itself be a selector and that the subsequent page contain the courses for the selected audience, with fuller course detail and a bolder visual identity.

## Visitor flow

- `/` and `/zh/` are dedicated welcome/selection pages. Six directly linked groups: kindergarten (around age five–Grade 1), Grades 1–3, Grades 4–6, middle school, high school, and adults/organisations.
- Each group has a complete static landing under `/for/<group>/` and `/zh/for/<group>/`, with reciprocal language links and sitemap entries. Visitors can share or bookmark a group directly.
- An optional course focus narrows the available group choices at the entrance and filters courses on the selected landing. The focus stays in the URL and is retained through language switching and the header navigation. All-courses and change-stage routes remain available. Unknown focus values safely show that group's full range.
- Every landing has tailored copy, three skill outcomes, four to six detailed course cards, a three-step example of practice, additional options, coaching background and an enquiry route. A focused view adjusts the lesson example for drama, debate or preparation and hides unrelated additional options.
- The Fall 2026 / Grades 1–2 / 18-class featured programme is absent from the entrance and every new landing. Its existing course page remains accessible by its own URL for prior links and enrolled visitors.
- Online availability is still only “Online classes coming soon.” No demo timetable or recruitment workflow is introduced.

## Content and design

Content comes from Kai's dictated service inventory. Age groups have their own English and Chinese copy, rather than displaying a shared catalogue with a highlighted card. Younger learners use guided stories; older learners progress through original ideas, research, interpretation and debate; adults see role-based workplace communication and interviews. Contest preparation is event-specific, with current event rules controlling timings. Uncertain competition identities remain in the working references from service-offerings-20260916.md rather than becoming unsupported public affiliations.

The visual palette uses navy #004165, red #c82032, a brighter stage red #e62b1e, white and near-black. These are colour/design influences, not affiliation claims or third-party logos. Large headline accents, numbered cards, tags, bullet lists and contrasting practice sections establish hierarchy.

The custom voice scene combines perspective typography planes, SVG orbit drawing, a waveform and a moving dot. The entrance sequence finishes in under four seconds, with an optional replay control. Scroll reveals are finite. Reduced-motion preferences remove animation, transitions and the replay control. Small mobile entrance screens prioritise the selector; dedicated landings retain the decorative scene. No video, remote animation library or new font download is required.

## Verification before release

- 180-page build; no errors or warnings, existing informational hints remain.
- Ten static checks pass: flagship, SEO, site languages, new audience isolation/routing check, asset budgets, premium media, course languages/editorial, practice content and schedule privacy.
- Browser verified English entrance → professional focus → adult page; only professional courses displayed. Adult interview filtering displays only interview coaching and updates the practice example. Chinese switching retains the focus and group.
- All twelve new pages checked at 320px width with no horizontal overflow. Desktop entrance and English/Chinese landing layouts visually inspected; mobile heading and selection-number wrapping refined.
- JavaScript-disabled entrance still reaches the kindergarten page and its four static courses. Reduced-motion emulation returns animation `none` and hides replay. Browser emulations restored.
- A long combined browser test exceeded its tool time limit; no complete exhaustive filter-matrix result is claimed. Focus behaviour was separately verified in bounded checks.

Final deployment evidence is recorded locally under `output/flagship/audience-release.json` after publication. Roll back this audience-landing implementation commit with `git revert`, preserving concurrent schedule and logo changes.
