# SpeakKai design system — V30

Implementation reference for the V30 release. See HANDOVER.md for deliverables and cycles/30.md for final verification.

## Identity and voice

SpeakKai / 说开. Kai Liu is presented as a communication coach and speaker. The central teaching idea is clear thinking, purposeful practice and human connection. Write concretely about what the speaker and listener do. Label illustrative exchanges; retain uncertainty about outcomes, dates, fees and availability.

## Foundation tokens

| Token | Value | Use |
|---|---|---|
| Ink | #0b1020 | Primary text and dark surfaces |
| Blue | #2454d8 | Emphasis, actions and visible focus |
| Yellow | #ffcc00 | Small accents and skip link |
| Paper | #ffffff | Main page surface |
| Wash | #f0f3f8 | Secondary sections |
| Muted | #535e72 | Supporting text |
| Line | #dbe1ec | Quiet separators |
| Content maximum | 1220px | Shared page width |

Manrope is served locally at weights400/600/700, with system sans-serif fallback. Body text is16px with1.65 line height. Display sizes use responsive clamps. Do not assume numeric token choices alone prove contrast or legibility: test their actual combinations.

Reflow rules: long tokens may wrap as a last resort; numeric practice-step labels stay together in content-sized tracks. Mobile course facts, roles and experience figures use font-relative grid minimums so enlarged text can stack. Chinese headings have zero tracking and 1.35 line height. Do not hide horizontal overflow to pass checks. The final inventory has 22 core routes and 11 language pairs; cycle records distinguish ordinary geometry from doubled-font stress. Native browser text resizing remains a separate check.

## Current components

- FlagshipLayout: metadata, organization/person/page graph, header, skip link, main landmark and footer.
- FlagshipBreadcrumbs: page hierarchy with a current-page label.
- Audience offer pages: fit, practice, process, questions and inquiry links.
- Course page: scope facts, repeatable class sequence, themes/roles, illustrative feedback and parent inquiry.
- Practice library and lessons: authored JSON, static full sheet and React guided round.
- Contact composer: optional local prompts and explicit user-controlled WeChat handoff.
- Native mobile navigation: full-width disclosure below a visible brand/contact row;44px minimum control targets; no-JavaScript support.

## Interaction and motion

Use ordinary links for navigation and native controls for actions. Preserve keyboard focus. Guided practice focuses the next heading after the user advances. Mobile navigation uses native Enter/Space, Escape with focus return and same-page destination focus. Reduced-motion styles disable smooth scrolling and nonessential motion. The top English/中文 switch uses matching page links; there is no splash, stored language preference or automatic redirect. Switching discards query and local draft state.

Video exists on /watch/ and /zh/watch/: native controls, muted, preload none, no autoplay/loop. The MP4s have no audio stream. Blender and AI visuals are static images with HTML alternatives. The three practice choices use native anchors and focusable destination headings. See ANIMATION-LIBRARY.md for sources and replay contracts.

The visual practice print stylesheet removes navigation and video controls, preserves all prompts/provenance, supplies static copies from the same source strings for closed disclosures, and adds a writing/reflection page. Print layouts use dark text, reserved image dimensions and page breaks between activities. See the final cycle for the actual browser print verification scope.

## Content and asset rules

Use verified first-party assets already approved for publication. Do not invent testimonials, partner logos, credentials or results. Generated media must not imply documentary footage. Editor notes must remain absent from public payloads. Keep public schedule privacy checks in every release.

## Validation scope

Each cycle records concrete geometry/interaction checks and separate heuristic scores. Chromium checks are not cross-browser certification. Native screen-reader behavior, actual text-resize settings, physical print and field performance require explicit evidence before being called verified.
