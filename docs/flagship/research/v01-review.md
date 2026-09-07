# SpeakKai flagship V1 review

Review date: 2026-09-07 (Asia/Shanghai)

Scope: read-only source review of the dirty checkout `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30`, focused on `src/layouts/FlagshipLayout.astro`, `src/components/FlagshipHome.astro`, and `src/styles/flagship.css`. The production baseline is `origin/main` at `ae6969f57f3a905320bcbeca82f1c44fff6a927a`, especially `src/pages/index.astro` + `src/components/HomepageV5.astro`. No site checkout files were edited.

The direct Astro checker completed with 0 errors, 0 warnings, and 6 existing hints. `pnpm check` itself could not start because pnpm attempted a non-interactive dependency-directory removal and aborted; invoking the already-installed `node_modules/.bin/astro.cmd check` succeeded. The coordinating QA pass additionally reports a successful 38-route V1 build, 21 static-integrity targets, CUA checks at 320/390/768/1440 with no overflow, CTA/contact flow working, visible skip-link focus, reduced-motion checks passing, and no console errors. Those visual/device results were not independently rerun in this bounded review; Lighthouse, actual assistive-technology use, network resilience, and production deployment remain outside the evidence here.

## Overall verdict

This is a strong narrative landing page with a clearer, more human first impression than the spatial HomepageV5. The new sequence—promise, audience routes, personal story, method, contact—makes the offer easier to scan and gives the brand a credible emotional center. It is structurally sound and has good basic accessibility and performance hygiene.

V1 is not ready to replace the baseline without a small content/conversion pass. The most concrete issue is that the three segmented links append `?interest=student|school|company`, while the existing `/contact/` page has no query handling, form, or prefilled context; the selection is therefore lost after the click. The new page also removes the baseline’s confirmed Fall 2026 program details, direct Schedule and Contact navigation, QR-first contact path, and verified Pinterest link. Those omissions reduce specificity and conversion for parents and partners.

No P0 technical blocker was found in source, and the Astro checker plus the coordinating build/UA checks validate the new files. I would hold release for the dead interest-routing path and for a decision on whether the broader “keynotes / executive coaching / founder” language is intended and approved.

## Concrete findings

### P1 — segmented offer links lose the selected intent

`FlagshipHome.astro:3-5` links to `/contact/?interest=student`, `/contact/?interest=school`, and `/contact/?interest=company`. The current `src/pages/contact.astro:1-96` only renders a static `ContactStrip`; it does not read `Astro.url.searchParams`, display the interest, or prefill any enquiry mechanism. A visitor who chooses a route reaches the same generic contact page, with no indication of what they selected.

This is a real conversion bug rather than a cosmetic concern. Either implement a visible, private-safe context label on the contact page or remove the query parameters and make the links honest generic contact links. The smallest useful fix is to preserve the selected audience in a heading or short prompt while keeping WeChat as the actual contact action.

### P1 — the primary WeChat CTA adds an avoidable step and hides the QR

The hero’s strongest action is `Find your starting point`, which only scrolls to the offers (`FlagshipHome.astro:8`). The final yellow CTA says `Connect with Kai on WeChat` but links to `/contact/` (`FlagshipHome.astro:13`), where the visitor must then inspect the QR page. The baseline’s HomepageV5 Media panel already exposed the complete QR asset and a clear “Open full QR” action (`origin/main:src/components/HomepageV5.astro:70-77`).

For a WeChat-first business, the new page should expose the QR or a direct “Open contact QR” action near the conversion section, and retain one direct Contact/Schedule route in the header. The current wording is understandable, but the action does not itself connect the visitor to WeChat.

### P1 — the replacement removes the confirmed current program

The baseline production homepage has a named Fall 2026 program: Young Competition Speakers, 18 classes, Grades 1–2, with six three-class units and a supported three-minute showcase (`origin/main:src/components/HomepageV5.astro:42-55`). The flagship page replaces that concrete offer with broad audience copy and generic “Speech · Storytelling · Debate” or “Curricula · Workshops · Teacher training” labels (`FlagshipHome.astro:3-5`).

The new copy is more elegant, but parents lose the only specific current program, age range, class count, and next-step context. Keep an appropriately compact current-program signal below the student offer, or link it visibly to the schedule/contact path. If the Fall program is intentionally omitted, the release brief should state that this is a deliberate product-positioning choice.

### P2 — header navigation regresses route discoverability

The baseline header exposes Home, Schedule, Resources, and Contact (`origin/main:src/components/SiteNavigation.astro:163-186` and `origin/main:src/pages/index.astro:33-37`). The new header has Work with Kai, Meet Kai, Resources, and Let’s talk (`FlagshipLayout.astro:34-37`). Schedule is only in the footer and as a small link in the final contact copy; Contact is only a CTA or footer item.

This is a reasonable editorial navigation choice for a short campaign page, but it weakens a known public workflow. A parent checking availability should not need to search the footer. Add Schedule to the header or make the audience cards route to a clear availability/contact step.

### P2 — unsupported scope drift in metadata and service labels

The default title and description claim “Communication Coaching, Keynotes & Training” and “keynotes” (`FlagshipLayout.astro:6-8`, `:30`). The company offer also names “Keynotes · Team training · Executive coaching” (`FlagshipHome.astro:5`). The current production HomepageV5 baseline names speech, debate, storytelling, presentations, and communication coaching; its current Programs panel names professional presentations and other coaching paths, but does not name executive coaching or keynotes (`origin/main:src/components/HomepageV5.astro:42-55`).

These may be valid services, but the new page presents them as established scope without a route, example, offer boundary, or current source tie. Confirm that Kai wants these categories in the flagship proposition. If yes, add one sentence describing the format and intended buyer; if not, use “presentations and team communication” to stay aligned with the existing public source.

### P2 — “founder” appears in image alt text without source support

The hero image alt text says `Kai Liu, communication coach and founder of SpeakKai` (`FlagshipHome.astro:8`). The current baseline and evidence files establish Coach Kai/SpeakKai identity, but do not establish “founder” as a published biographical fact. This is exposed to screen readers and assistive metadata even though it is not visible body copy. Use `Kai Liu, communication coach and speaker` unless founder status is confirmed and intentionally included.

### P2 — proof language is stronger than the evidence boundary

The experience bar is labelled `Kai’s published career experience` (`FlagshipHome.astro:9`). The numbers match the existing published homepage, so this is not a new number. However, “published career experience” can sound like an independent validation label, while the repository’s own verification report says the metrics lack independent sources and durable provenance (`origin/main:design-lab-v4/content/verification-report.md:20-29`). Keep the metrics if desired, but label them neutrally as “Career highlights” or omit the `aria-label` qualifier that implies a proof category.

### P2 — baseline media proof and verified Pinterest route disappear

HomepageV5 has a Media panel with WeChat QR, Xiaohongshu handle, and verified Pinterest URL (`origin/main:src/components/HomepageV5.astro:70-78`). The new flagship has only WeChat text in the contact section and no Pinterest or Xiaohongshu route (`FlagshipHome.astro:13`). This reduces public evidence and channel discovery. If the long page is intended to be the sole homepage, preserve a small media/contact row or link to the existing contact/resources destination.

### P2 — static markup and CSS reduce maintainability

The three new files are heavily compressed: most of `FlagshipHome.astro` is one line per section and `flagship.css` is effectively one long declaration line per rule group. This is valid and the checker passes, but it makes review, line-level changes, accessibility inspection, and future content updates needlessly difficult. The offer data array is a good start; format the Astro and CSS into readable blocks and add a small typed offer shape if the content will be maintained.

## What improved versus HomepageV5

- The first screen explains the proposition immediately with “Make yourself understood,” instead of requiring the visitor to interpret a spatial canvas and select a hidden panel.
- The three audience routes—students/parents, schools/educators, and companies/event teams—are easier to recognize than the baseline’s rotating five-panel experience.
- The personal story is visible in normal page flow and uses the approved public stutter/first-generation/teaching-in-China narrative (`FlagshipHome.astro:11`).
- The Think → Practise → Grow sequence is a compact, comprehensible expression of the baseline method (`FlagshipHome.astro:12`; compare `origin/main:src/components/HomepageV5.astro:29-38`).
- The source uses a real `h1`, `h2` section headings, a skip link, descriptive image alternatives, visible focus outlines, width/height image attributes, and a reduced-motion override (`FlagshipLayout.astro:32-40`; `flagship.css:2`, `:11`).
- The new page avoids third-party scripts, embeds, and animation loops. The hero image is prioritized and the training image is lazy-loaded (`FlagshipHome.astro:8`, `:11`).

## Content and design weaknesses

The page is polished but close to a generic premium coaching template. “Make yourself understood,” “ideas that move a room,” and “A conversation is a good beginning” are warm and usable, yet they do not fully distinguish SpeakKai from a broad communication coach. The strongest differentiator remains the practical method and the specific student program, both of which are underrepresented in the new version.

The offer cards describe audiences and outcomes but do not establish a concrete first engagement: session type, age range beyond the omitted Fall program, typical duration, delivery options, or what happens after contacting Kai. The closing copy correctly says scope, fees, and availability are agreed directly (`FlagshipHome.astro:13`), but visitors still need one tangible next step beyond “tell Kai.” A short “What to send” list or a named consultation path would improve conversion without inventing pricing or guarantees.

The story photo is a strong coach-only candidate from the existing noindex business test, but the caption “On stage. In the classroom. In your corner.” is brand copy rather than evidence (`FlagshipHome.astro:11`). Keep the image as context, not as proof of a specific client or result. The CSS likely produces a strong editorial desktop layout, but visual quality, crop quality, and mobile rhythm need screenshot QA.

## Reviewer scores

Scores combine this source review with the coordinating CUA/build evidence above. Visual, mobile, accessibility, speed, and SEO scores still include a confidence caveat because this reviewer did not independently run the screenshot/device pass, a screen-reader pass, Lighthouse, or production deployment verification.

| Dimension | Score / 5 | Reviewer view |
|---|---:|---|
| Positioning | 4.0 | Clear “make yourself understood” promise and three audiences; differentiation is still broad. |
| Credibility | 3.0 | Uses existing published metrics and approved public story, but adds founder/keynote/executive language and gives no proof block or current program evidence. |
| Offer clarity | 3.5 | Audience cards are easy to scan; concrete program, format, and first engagement are missing. |
| Conversion | 3.0 | Multiple CTAs and a clear closing section, but QR is one click away, the hero CTA only scrolls, and interest routing is inert. |
| Visual | 4.0* | Strong hierarchy, restrained palette, portrait-led editorial composition, and coherent spacing in CSS; requires screenshot QA. |
| Story / emotional fit | 4.5 | The approved personal story is concise, relevant, and connected to the coaching promise. |
| Mobile | 4.0* | Explicit 720px layout, single-column offers/story/method/contact, and mobile spacing rules; needs 320–390px screenshots and tap-target checks. |
| Accessibility | 4.0* | Skip link, headings, focus styles, alt text, hidden decorative arrows, and reduced motion are present; run a browser/AT pass and fix the founder alt claim. |
| Performance | 4.0* | No third-party runtime, prioritized hero, lazy story image, explicit image dimensions, and compact CSS; verify production build and Core Web Vitals. |
| SEO | 3.5* | Canonical, title/description, Open Graph, Twitter card, language, and one clear h1 are present; no structured data or verified proof/profile content is added. |
| Maintainability | 3.0 | Small data array and layout split help, but compressed one-line source and dead query context increase future maintenance cost. |

## Top five next improvements

1. Make audience routing work. Read the `interest` query on `/contact/`, display the selected audience in the enquiry prompt, and keep the route private-data-minimizing. Add a no-query fallback.
2. Restore a direct conversion path. Put Contact or Schedule in the header and expose the QR at the closing CTA, with wording that accurately describes the action.
3. Restore one concrete offer. Add a compact Young Competition Speakers card or current-program link with 18 classes, Grades 1–2, and the confirmed speaking progression; keep other services as conversation topics.
4. Resolve scope and proof wording. Confirm keynotes, executive coaching, and founder status; otherwise align metadata, alt text, and service labels with the current public baseline. Label existing metrics as career highlights rather than proof.
5. Run visual and interaction QA at 320×844, 390×844, 768×1024, 1366×768, and 1920×1080. Check image crops, horizontal overflow, focus order, keyboard activation, link destinations, QR visibility, contrast, and Lighthouse output before release.
