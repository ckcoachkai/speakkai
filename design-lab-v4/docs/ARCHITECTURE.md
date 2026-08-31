# Suggested Architecture

Codex must inspect the actual repository first and adapt this plan to the existing framework.

## Source-of-truth layers

### 1. Verified content store

Create or reuse a structured content source, for example:

```text
content/speakkai-facts.json
content/programs.json
content/testimonials.json
content/cta.json
```

Only publish claims verified by the repository, current live site, or user-approved source.

### 2. Experiment registry

Use `config/experiments.json` as the design brief source. Mirror the useful runtime fields into the application registry:

```ts
type Experiment = {
  number: number;
  slug: string;
  title: string;
  family: "corporate" | "fun-motion" | "modern";
  primaryStakeholder: string;
  secondaryStakeholder?: string;
  hypothesis: string;
  component: LazyExoticComponent<ComponentType>;
  singleScreen: true;
};
```

Use route-level lazy loading. Viewing Test 21 must not import all media and animation code from Tests 22–50.

### 3. Shared functional primitives

Share behavior, not visual sameness.

Useful primitives may include:

- `ExperimentRoute`
- `ExperimentNavigator`
- `SingleScreenFrame`
- `AccessibleDisclosure`
- `AccessiblePopover`
- `AudienceModeSwitch`
- `PortraitAsset`
- `MotionProvider`
- `ReducedMotionGate`
- `QAOverlay`
- `PrimaryCTA`
- `EvidenceProvenance`
- `MobileReflow`

Do not force all tests through one hero/card template.

### 4. Per-test design modules

Each test should own:

```text
/tests/test-21/
  index.tsx
  test-21.module.css
  motion.ts
  assets.ts
  README.md
```

or the equivalent structure for the project.

### 5. Shared QA instrumentation

Every page should expose stable selectors:

```html
<div data-qa="experiment-root" data-test-number="21">
<div data-qa="brand">
<button data-qa="primary-cta">
<nav data-qa="test-switcher">
<section data-qa="primary-message">
<div data-qa="portrait">
```

When panels are interactive, add clear semantics and stable QA labels.

## Single-screen frame

At desktop widths, the application should be intentionally composed inside the viewport.

Recommended principles:

- use CSS Grid/Flexbox for primary layout
- use `100dvh`/`100svh` carefully with fallbacks
- use `clamp()` for responsive type and spacing
- use container queries where helpful
- reserve absolute positioning for decorative layers, not the entire content system
- keep safe space for browser UI and the test navigator
- allow mobile/tablet reflow and scrolling below the desktop breakpoint

Do not simply apply `overflow: hidden` to conceal broken layout. The content must actually fit.

## Progressive disclosure depth

Critical information should be either:

- visible immediately, or
- reachable with one clear click/focus/tap

Avoid more than two nested interaction levels.

## Runtime animation

Prefer the lightest suitable option:

1. CSS transitions/keyframes
2. existing animation library already in the repo
3. GSAP/Framer Motion when the design genuinely needs sequencing
4. Canvas/WebGL only when the concept cannot be achieved responsibly otherwise

Rendered motion assets from HyperFrames or Remotion are supporting media, not a substitute for accessible HTML content.
