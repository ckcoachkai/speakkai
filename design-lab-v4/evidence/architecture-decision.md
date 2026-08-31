# V4 architecture decision

Date: 2026-08-31

## Decision

Keep the existing Astro static route `/tests/[id].astro`, but replace the V3 all-purpose hero shell with three source-isolated family renderers:

- `CorporateExperiment.astro` for Tests 21–30
- `MotionExperiment.astro` for Tests 31–40
- `ModernExperiment.astro` for Tests 41–50

Each renderer contains ten distinct semantic structures matching the authoritative V4 registry. Shared code is limited to document/navigation behavior, portrait loading, design tokens, and accessible panel activation.

## Why

- Preserves the existing route contract and Astro static generation.
- Avoids 30 copies of document metadata and navigator logic.
- Prevents the V3 failure mode where every experiment was one hero/cards template with mode skins.
- Loads one family renderer per generated route rather than all 30 pages or media sets.
- Keeps critical copy as server-rendered HTML with no framework hydration.

## Accessibility contract

- Every interaction uses semantic buttons and labelled tab panels.
- Arrow, Home, End, Enter/Space, click, and touch paths share the same state.
- Focus states are visible.
- Reduced-motion CSS disables continuous and entrance motion.
- Mobile/tablet reflow allows natural scrolling.
- No critical content is hover-only.

## QA contract

Every V4 route exposes:

- `data-qa="experiment-root"`
- `data-qa="brand"`
- `data-qa="primary-message"`
- `data-qa="portrait"`
- `data-qa="primary-cta"`
- `data-qa="test-switcher"`

