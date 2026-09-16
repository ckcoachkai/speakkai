# Content inventory — 16 September 2026

Baseline: b7a8ae541ede1929e701f563c2569d8896a941b4. Full tracked-file hashes, rendered text, links, and media references are frozen in output/flagship/redesign-baseline.json before design edits.

| Content | Source and preservation decision |
| --- | --- |
| Homepage and six bilingual audience entrances | AudienceGateway, AudienceLanding, audiencePages.ts, focusPractice.ts. Preserve all course copy, filter routing, language switching, group/private arrangements and online-coming-soon notice. |
| Biography, statistics, method | homeCopy.ts. Reuse current 17+ years, 1,000+ presentations across 7 countries, 2,000+ students; first-generation Chinese American story and Think / Practise / Grow wording. Legacy HomepageV5 has stale 15+ years; do not resurface that number. |
| Credentials and milestones | HomepageV5 and BusinessTestExperience contain career and Toastmasters background. Preserve sources; no new timeline milestones or award interpretations. |
| Services | audiencePages, services, flagshipOffers and flagshipOffersZh; coaching, school and company pages. Preserve descriptions, outcomes, formats, FAQs, interview/debate/competition details. |
| Real photographs | Existing seated portrait (960 × 1280), headshot variants; training stage (668 × 606), international speech final (606 × 456), WSDA and awards photographs. Existing captions establish context. Portrait, training and final photographs visually inspected. Use original assets, no synthetic documentary images. |
| Branding | Latest dialogue-book logo 081, responsive variants and bilingual name retained. Presentation palette changes to charcoal, white and fluorescent yellow-green. |
| Video and illustrated practice | FlagshipWatchPage and public/media: two silent 18-second teaching videos, fictional rehearsal room, fictional umbrella illustration. Preserve native controls, written alternatives and fictional provenance labels. |
| Testimonials | No verified testimonial collection identified. Do not create testimonials, client quotes or a carousel. |
| Schedule | Existing generated schedule data and availability-only privacy behavior retained without edits. |
| Pricing | No fixed public prices identified. Scope, fees and availability agreed directly; retain that language. |
| Contact and CTAs | WeChat CKcoachkai and original QR, local enquiry draft builder, social links, contact/schedule/resource links. Preserve form behavior and no-automatic-send disclosure. |
| Resources and downloads | Resource index, topic library, printable practice, tools, videos and existing file links retained. |
| Other routes | All generated routes inventoried, including courses, topic pages, games, homework, travel, design archives and utilities. Preserve their specialist content and behavior; shared flagship shell receives the marketing theme. |

## Design plan
Keep the audience gateway as the first decision. Replace abstract hero graphics with the existing portrait, retain their three-word messaging as image captions. Reintroduce the existing biography, training photograph, statistics and method below the gateway. Use shared CSS motion tokens and one small observer; no WebGL, new font or third-party animation runtime. Content is visible without JavaScript, motion is finite, and reduced-motion disables transforms.

## Verification and second pass
Pending implementation. Compare route inventory, source hashes and rendered content; inspect desktop/mobile, keyboard, filters, language navigation and reduced motion before release.

### First-pass critique and improvements

- Real content: original bilingual course and contact text retained; the added story, statistics and method are rendered directly from existing homeCopy.ts, not rewritten claims.
- Content preservation: all 190 baseline HTML files compared. No missing meaningful text; only obsolete abstract-animation replay labels and decorative numbering are exempt. Original assets and service data untouched.
- Photography: existing seated portrait replaces abstract typographic hero; existing training image supports the biography. No stock or generated photographs introduced.
- Mobile: use a compact portrait beside the gateway title, retain captions and all six decisions, stack the biography/method and make statistics readable in rows. No horizontal overflow observed on 20 representative routes at 390px and five at 320px.
- Accessibility critique: inactive language links were too dark on charcoal. Second pass explicitly restores light text and distinct hover/current states; mobile portrait caption no longer suppresses the three-word message.
- Motion critique: old orbit/wave CSS was unused after the photo redesign. Removed its animation rules and retained one finite observer-driven reveal system. Offscreen animation pauses; reduced-motion reports animation-name: none. All content renders without JS; native audience links remain functional.
- Simplicity: no added runtime, font, video autoplay, canvas or WebGL. Existing conservative page budgets pass.
- Interaction: selecting Drama at the gateway reaches Primary with only drama courses visible; switching to Chinese retains that focus. Existing automated bilingual, course, inquiry, SEO, practice, asset and schedule-privacy checks pass.
- Remaining verification: complete final build checks and verify the deployed pages. These checks do not claim measured field Core Web Vitals or universal 60 FPS.
