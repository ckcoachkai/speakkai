# Acceptance Criteria

## Migration

- [ ] Current routes/components are archived before replacement.
- [ ] Parent Command Center is identified by content and preserved.
- [ ] Existing Tests 1–20 continue to work.
- [ ] Numbering is internally consistent.
- [ ] No orphaned navigation links remain.

## Exactly 30 new concepts

- [ ] 10 corporate concepts.
- [ ] 10 fun/motion concepts.
- [ ] 10 modern concepts.
- [ ] Every concept has a unique title and signature.
- [ ] Every concept declares primary stakeholder, hypothesis, CTA, and proof strategy.

## Single-screen desktop

At 1920×1080, 1600×900, 1440×900, and 1366×768:

- [ ] `scrollHeight <= innerHeight + tolerance`.
- [ ] `scrollWidth <= innerWidth + tolerance`.
- [ ] CTA visible/reachable.
- [ ] experiment switcher visible/reachable.
- [ ] headline readable.
- [ ] portrait does not cover essential content.
- [ ] overlays/popovers remain inside viewport.
- [ ] no text smaller than the project’s agreed minimum.
- [ ] hidden overflow is not masking missing content.

## Mobile/tablet

- [ ] content reflows rather than shrinking the desktop canvas.
- [ ] scrolling is allowed.
- [ ] touch targets are usable.
- [ ] no hover-only information.
- [ ] dialogs/drawers can close.

## Accuracy/privacy

- [ ] no invented facts.
- [ ] no private student information.
- [ ] approved photos only.
- [ ] portrait identity preserved.
- [ ] generated visual context cannot be mistaken for a real credential/event.
- [ ] testimonial/source provenance recorded.

## Differentiation

- [ ] adjacent tests differ in at least six signature dimensions.
- [ ] contact sheet does not look like one template with skins.
- [ ] no more than two tests share the same primary layout archetype.
- [ ] portrait treatments visibly vary.
- [ ] motion languages visibly vary.
- [ ] stakeholder arguments visibly vary.

## Accessibility

- [ ] semantic controls.
- [ ] focus visible.
- [ ] keyboard order logical.
- [ ] escape closes modal/drawer.
- [ ] reduced-motion state works.
- [ ] contrast checked.
- [ ] essential text remains HTML.
- [ ] alt text appropriate.
- [ ] no color-only meaning.

## Performance

- [ ] route-level asset isolation.
- [ ] inactive experiment media not loaded.
- [ ] responsive image formats.
- [ ] video has poster and lazy/idle load.
- [ ] no autoplay sound.
- [ ] no uncontrolled infinite animation.
- [ ] no obvious rerender loop.
- [ ] no major console errors.

## Evidence of completion

- [ ] screenshot per test at 1920×1080.
- [ ] failed-layout screenshots for issues found.
- [ ] full contact sheet.
- [ ] viewport QA JSON.
- [ ] signature duplicate report.
- [ ] stakeholder scores.
- [ ] issue/fix log.
- [ ] final shortlist.
