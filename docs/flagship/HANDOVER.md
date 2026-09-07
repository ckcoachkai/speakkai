# SpeakKai flagship handover

[English website](https://speakkai.com/) · [中文网站](https://speakkai.com/zh/) · [Visual practice](https://speakkai.com/watch/) · [中文视觉练习](https://speakkai.com/zh/watch/).

The V30 package contains all nine requested deliverables. PROGRAM.md, cycles/30.md and releases.json establish completed release status; this inventory alone does not.

| Deliverable | Implementation and guide |
|---|---|
| 1. Complete website | Live links above; src/pages, src/components and src/layouts; 22 core routes / 11 language pairs; preserved legacy tools and schedule |
| 2. Design system | [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), src/styles/flagship.css and visual-practice-print.css |
| 3. Brand guidelines | [BRAND-GUIDELINES.md](BRAND-GUIDELINES.md) |
| 4. Component library | [COMPONENT-LIBRARY.md](COMPONENT-LIBRARY.md) and actual Astro/React sources |
| 5. Animation library | [ANIMATION-LIBRARY.md](ANIMATION-LIBRARY.md), rendered media and Remotion/Blender/AI sources and provenance |
| 6. Content strategy | [CONTENT-STRATEGY.md](CONTENT-STRATEGY.md), [CONTENT-EDITOR.md](CONTENT-EDITOR.md) |
| 7. SEO strategy | [SEO-STRATEGY.md](SEO-STRATEGY.md), emitted metadata and sitemap |
| 8. Conversion recommendations | [CONVERSION-RECOMMENDATIONS.md](CONVERSION-RECOMMENDATIONS.md) |
| 9. Future roadmap | [FUTURE-ROADMAP.md](FUTURE-ROADMAP.md), [ARCHITECTURE.md](ARCHITECTURE.md) |

## Use and maintain

The top English/中文 control links to the exact counterpart. There is no splash or stored preference. Switching discards query parameters and local practice/inquiry state. Legacy English tools and schedule are labeled. Inquiry preparation creates an editable local message; the visitor decides whether to send it through WeChat. It does not submit or reserve a place.

Use Node 24 and the pinned pnpm version. Install missing dependencies with pnpm install --frozen-lockfile. npm run cms starts the local editor on 4326; saving changes repository files and does not publish. See CONTENT-EDITOR.md for supported fields, draft gating and isolation. npm run build generates the static website. Start its preview explicitly with npx astro preview --port 4327; that is the preview port used during this handover.

Run the eleven checks listed in cycles/30.md, then review changed interactions. [PERFORMANCE-BUDGETS.md](PERFORMANCE-BUDGETS.md) defines byte contracts, not field speed. Preserve source/provenance and validate changed media before updating hashes. Blender native/export files are intentionally tracked under an otherwise ignored output directory.

## Evidence and limits

Research and critique history lives in research/ and cycles/. [releases.json](releases.json) identifies completed live versions, exact commits, workflows and rollback points. Later documentation-only closeout commits may preserve the same V30 product; its release record identifies the originally verified product commit.

Build, content/privacy/SEO/media checks and browser observations establish implemented behavior. They do not establish conversion uplift, real learning, independently verified career claims, rankings or world-class market standing. Authentic consent-cleared footage, attributable outcomes, screen readers, other browser engines, physical devices/printing and China-network field performance remain follow-up work. Print CSS was inspected in browser print emulation; PDF generation was unavailable in the browser tool.
