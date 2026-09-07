# SpeakKai flagship proof and asset audit

Audit date: 2026-09-07 (Asia/Shanghai)

Repository basis: `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-schedule-cues`, read-only inspection of `origin/main` at `ae6969f57f3a905320bcbeca82f1c44fff6a927a` (`Add on-device speech recognition to bypass unavailable browser service`). The checkout was not edited. Live checks used `https://speakkai.com/`, `/about/`, `/contact/`, `/schedule/`, `/resources/`, and `/resources/tools/`.

## Publication state

- `https://speakkai.com/` returned 200 and currently publishes the Version 5 homepage with five interactive panels: About, Philosophy, Programs, Paradigm, and Media. The production entry point is [`src/pages/index.astro`](C:/Users/kai/Documents/ChatGPT/SpeakKai/website-worktrees/speakkai-schedule-cues/src/pages/index.astro) lines 6–9 and 33–37, which mounts `HomepageV5`.
- `https://speakkai.com/about/` currently returns a static “Redirecting to: /” document with `noindex`, a meta refresh, and canonical `/`. The committed [`src/pages/about.astro`](C:/Users/kai/Documents/ChatGPT/SpeakKai/website-worktrees/speakkai-schedule-cues/src/pages/about.astro) is only `Astro.redirect("/", 301)`. There is no standalone live About page to cite as independent proof.
- `/contact/`, `/schedule/`, `/resources/`, and `/resources/tools/` were reachable and returned 200. The live contact page exposes WeChat and Xiaohongshu handles; resources exposes five working speaking/classroom tools.

## Current public copy that can be located in the production source

These statements are currently published in the homepage source and visible on the live homepage. “Source-present” means the repository and live page contain the copy; it does not mean an independent credentialing body or third party was checked.

| Area | Current source-present copy | Source |
|---|---|---|
| Identity/bio | Kai Liu; “Coach · competitor · teacher · speaker”; first-generation Chinese American; personal history of a stutter, fear of public speaking, and difficulty expressing ideas; teaching in China helped him find his voice. | `src/components/HomepageV5.astro:10-25` |
| Experience metrics | `15+ years` education and communication training; `1,000+` presentations across seven countries; `2,000+` students trained. | `src/components/HomepageV5.astro:16-20` |
| Career framing | 2007–2017 foundation in English training, education consulting, interviews, test preparation, structured argument and communication; 2017–present speech, debate, storytelling, TEDx preparation, student competition work and professional presentations. | `src/components/HomepageV5.astro:21-24` |
| Toastmasters | Past president of four clubs and former District 85 Division N Director, with continued competition and training experience. | `src/components/HomepageV5.astro:21-25` |
| Current named program | “Young Competition Speakers,” Fall 2026, 18 classes, Grades 1–2; mostly 60–90 second practice speeches, six three-class units, and a supported three-minute showcase speech. | `src/components/HomepageV5.astro:42-55`; `docs/homepage-content-evidence.md:20-26` |
| Coaching paths | Original oratory, expository speaking, storytelling, debate, TEDx preparation, and professional presentations are named as other coaching paths. The evidence document explicitly says they are not separate confirmed Fall curricula. | `src/components/HomepageV5.astro:50-55`; `docs/homepage-content-evidence.md:26` |
| Method | Audience/purpose, a clear through-line, technique serving meaning, real-condition rehearsal, usable feedback, and independent speaker growth. | `src/components/HomepageV5.astro:29-38` |
| Evaluation lens | Clarity/intelligibility, organization/content, role/audience awareness, voice/physical delivery, thinking/story/connection, and preparation/recovery/growth. No universal numerical weighting is claimed. | `src/components/HomepageV5.astro:58-68`; `docs/homepage-content-evidence.md:11-18` |

The business concept route repeats a shorter version of the bio and services but is explicitly `noindex, nofollow` and titled “Business Experience — Test”; it should not be treated as the production flagship or as extra proof. See `src/pages/test.astro:1-23` and `src/components/BusinessTestExperience.astro:4-55`.

## Historical credentials and results: source-present, not independently verified here

The strongest detailed credential copy is historical public site copy in commit `90078fa` (the content was in the root homepage at that point). It is not present as a standalone current About route. Preserve it as a lead for owner review, not as cleared marketing proof.

- Historical role claim: “TEDx Speaker | Communication Coach | Speech & Debate Coach,” plus “TEDxSMIC speaker and TEDx coach.” (`90078fa:src/pages/index.astro:508-521` and `:627-637`.)
- Historical career detail: English Trainer (2007–2012), Education Consultant (2012–2015), Test Preparation (2015–2017), Speech & Debate Coach (2017–Present), with IELTS/TOEFL/SAT and international interview wording. (`90078fa:src/pages/index.astro:541-561`.)
- Historical Toastmasters details: past president of Shanghai No.1, Xujiahui, Imagine, and Teachers Bilingual clubs; District 85 Division N Director (2019–2020) for 20 clubs and approximately 500 members; two 120-participant officer trainings; six Pathways and Competent Communicator; district trainer/public-relations speaker. (`90078fa:src/pages/index.astro:566-585`.)
- Historical dated competition results: District 85 Area 02 Table Topics Champion (2018); Division Evaluation Contest Finalist (2019); Evaluation Runner-up and International Speech Finalist (2021); 2022 Table Topics and International Speech Second Runner-up; 2024 Table Topics Finalist and Train-the-Trainer trainer; 2025 Evaluation Finalist; 2026 Table Topics Finalist and International Speech Runner-up. (`90078fa:src/pages/index.astro:587-595`.)
- Historical student-results wording: coached national champions and finalists across HOSA, USAD, National History Day, ESDP, TOC, WSDA, and World Forensics League; also judged Toastmasters, USAD, HOSA, WSDA, and Star of Outlook competitions. (`90078fa:src/pages/index.astro:611-623`.)
- Historical business-client wording: training for Microsoft, Entegris, AIA, fintech teams, law firms, and creative companies; this is not accompanied by client permissions, logos, case studies, or third-party links in the committed tree. (`90078fa:src/pages/index.astro:627-637`.)
- Historical mentorship wording names Darren LaCroix, Mark Brown, Craig Valentine, Verity Price, Kwong Yue Yang, Kin Ng, and Fursey Gotuaco. No supporting certificates or links were found in this audit. (`90078fa:src/pages/index.astro:640-647`.)

The repository’s own verification report makes the boundary explicit: its audit is not independent verification, and it excludes the 15+ years, 1,000+ presentations, 2,000+ students, competition placements, and dated achievements from proof because no independent source or durable provenance record was found. It also records Missing approved case studies, attributable testimonials, named learner stories, student media consent, approved documentary media, partner names/logos, and measured outcomes. See `design-lab-v4/content/verification-report.md:1-5`, `:20-43`.

## Testimonials, learner results, and student media

No attributable testimonial, named learner story, approved case study, before/after measure, or measured learner outcome exists in `origin/main`. The experiment registry deliberately labels process examples as “not testimonials, student stories, or before-and-after claims” (`src/data/experimentLabV4.ts:137-151`) and the verification report lists these evidence classes as Missing. Do not turn the historical “coached national champions and finalists” sentence into a testimonial or guaranteed outcome.

`public/images/test/kids-speaking.webp` is explicitly classified as an illustrative young-speakers asset with provenance and consent Missing; the asset manifest says never to present it as a real learner, student result, testimonial, or case study (`design-lab-v4/config/asset-manifest.json:84-91`). Exclude it from flagship proof and do not republish identifiable student imagery.

## Services and usable public routes

The current production framing supports:

- Speech, debate, storytelling, presentation, and general communication coaching for students and professionals in Shanghai and online (`src/pages/index.astro:6-9`).
- The confirmed Fall 2026 Young Competition Speakers course described above.
- Current coaching paths of original oratory, expository speaking, storytelling, debate, TEDx preparation, and professional presentations, with the curriculum boundary noted above.
- For institutions/businesses, the noindex test concept describes custom school curricula, focused organizational workshops, one-off or multi-session development, and online/in-person/hybrid delivery. This is useful service language, but it is a test route and should be re-confirmed before moving to flagship copy (`src/components/BusinessTestExperience.astro:27-34`).
- Public tools at `/resources/tools/`: Marble Name Picker, Class Charades, Toastmasters Speech Timer, Wheel of Doom, and Speech & Debate Timer. These demonstrate working product/tool capability, not learner outcomes (`src/components/ToolsGallery.astro:4-46`).

## Contact and QR

- Public handle: WeChat `CKcoachkai`.
- Public handle: Xiaohongshu `CKcoachkai`; the stable public profile URL is explicitly unverified.
- Verified public profile URL in the repository: Pinterest `https://kr.pinterest.com/ckcoachkai/` (the source says this was checked on 2026-08-31). `src/components/HomepageV5.astro:70-78`; `docs/homepage-content-evidence.md:28-32`.
- QR asset: `public/images/coach-kai-wechat-qr.png`, 938×1340 RGBA PNG. It is used by `ContactStrip` and the homepage Media panel, and the live asset returned HTTP 200. Source: `src/components/ContactStrip.astro:1-24`; `src/components/HomepageV5.astro:74-77`.
- The public `/contact/` page is the correct CTA target. The QR and handles are also used on the public schedule and in the noindex business test. The QR image was not decoded independently in this audit; use the existing owner-supplied asset and avoid replacing or cropping it beyond the established contact component.
- An old `hello@speakkai.com` email appears in the 2026-07-17 historical homepage commit, but not in the current production contact component. Treat it as stale until separately re-confirmed.

## Coach-only image candidates

All image URLs below returned HTTP 200 when checked on 2026-09-07. Dimensions come from the committed Git blobs using an in-memory image probe; no files were written to the checkout.

| Asset | Dimensions | Repository role and source | Recommendation |
|---|---:|---|---|
| `public/images/coach-kai-headshot.webp` | 1400×1400 | Highest-resolution standalone Coach Kai portrait; verified repository asset, signature identity portrait. `design-lab-v4/config/asset-manifest.json:65-72`; used by production `Portrait` and as the social image in `src/pages/index.astro:6-9`. | Preferred flagship identity image. Safe candidate for a coach profile/hero, subject to normal owner rights. |
| `public/images/coach-kai-banner-desktop.png` / `.webp` | 2508×627 | Existing wide Coach Kai banner; PNG is recorded in the manifest as an existing public banner. `src/components/ChampionConcept.astro:180`; `design-lab-v4/config/asset-manifest.json:75-82`. | Good for a wide banner or background. Embedded text and wide composition limit flexible cropping. |
| `public/images/coach-kai-banner-mobile.png` / `.webp` | 1683×935 | Mobile banner variants used by the internal schedule and Pinterest card (`src/pages/i.astro:648-654`; `src/components/HomepageV5.astro:77`). | Candidate for mobile hero/banner; validate text legibility and crop. |
| `public/images/test-business/kai-international-speech-final.webp` | 606×456 | Coach Kai speaking at an international speech contest final, based on the gallery alt/source (`src/components/BusinessTestExperience.astro:58-64`). | Strong proof-adjacent candidate for a Coach Kai speaking section, but it currently lives only in the noindex business test. Confirm event/date/rights before flagship reuse. |
| `public/images/test-business/kai-training-stage.webp` | 668×606 | Coach Kai leading a professional training session, based on the gallery alt/source. | Candidate for training/workshop context after owner confirms event and rights. |
| `public/images/test-business/kai-wsda-stage.webp` | 350×466 | Coach Kai speaking at a WSDA event, based on the gallery alt/source. | Candidate for competition/event context after owner confirms event and rights. Do not infer a student result from it. |
| `public/images/test-business/kai-awards-display.webp` | 1600×1200 | Coach Kai’s public speaking awards display, based on the gallery alt/source. | Useful visual evidence only if each displayed award is legible and the dates/titles are confirmed. Do not use it as a generic “awards” badge without that check. |
| `public/images/speakkai-logo-header-source.png` | 1254×1254 | Brand mark used by the noindex business test and shared navigation. | Useful brand asset; not proof. |

The four `test-business` images were added with the noindex business concept in commit `f674dad`; they are source-present and coach-only by their labels, but the repository contains no capture provenance, event metadata, rights record, or independent links. They should be treated as “candidate pending owner approval,” not automatically cleared proof.

## Video availability

There are no tracked video files in `origin/main` (`.mp4`, `.webm`, `.mov`, `.m4v`, `.avi`, `.mkv`, `.mp3`, `.wav`, or `.m4a` search returned no paths), and no real video source is mounted in the production homepage. The historical homepage contains three text-only video placeholders (“Introduction Video,” “Speaking Tip,” and “Workshop Clip”) with no media files or embeds; those are not video evidence. A future flagship video section needs an owner-supplied file or exact public URL, usage rights, caption/transcript, and a clear label for what the clip demonstrates.

## Recommendations and evidence gaps

1. Use the current production homepage copy as the baseline for identity, method, services, Fall 2026 program, handles, QR, and tools. Keep the `/about/` link aware that it currently redirects to `/`.
2. Use `coach-kai-headshot.webp` as the primary human asset. Add the four `test-business` Coach Kai images only after confirming who/what/when, usage rights, and whether any visible third party requires consent.
3. Keep metrics and historical credential/result copy labelled as public self-description/source-present until supporting evidence is supplied. Do not add “verified,” “award-winning,” client logos, school names, rankings, guarantees, or quantified outcomes from the historical copy alone.
4. For a proof section, collect: official TEDxSMIC page or event record; Toastmasters district/club records and exact award titles/dates; permission to name organizations; approved case studies; attributable testimonials with consent; and learner image/video consent records. The current repo has none of these durable proof packages.
5. Keep `kids-speaking.webp` and any student-facing imagery out of proof. Keep abstract concept artwork (`test/cyber-orbit.webp`, `test/vlog-megaphone.webp`, and `concepts/speakkai-influence-sketch.png`) as decorative/illustrative only.
6. Use `/contact/` with the owner-supplied QR and `CKcoachkai` handles for the CTA. Do not restore the historical email or guess WeChat/Xiaohongshu profile URLs without a fresh owner check.
