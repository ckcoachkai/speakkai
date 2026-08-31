# Test 1–4 baseline analysis and evolution strategy

Date: 2026-08-31

The baseline was rendered at seven viewport sizes before implementation. Tests 1–4 are protected by source fingerprints and visual screenshots. New work must live in separate components, data, styles, scripts, and routes.

## Test 1 → Test 5: Coaching Atelier

### Baseline strengths

- Warm cream, serif typography, and portrait framing feel personal and premium.
- The composition communicates bespoke private coaching better than a generic education layout.
- Mobile reading order is strong and the portrait remains human.

### Weaknesses

- The desktop CTA and service explanation are visually secondary.
- Trust and verified experience are not available at the moment of decision.
- Bottom swatches are elegant but do not reveal enough of the coaching journey at a glance.

### Evolution strategy

Retain the editorial warmth and atelier metaphor. Build a richer parent/customer journey around verified experience, a four-stage coaching process, clear program moments, and a persistent next step. Use restrained tactile motion and avoid luxury styling that suggests exclusivity or unsupported outcomes.

## Test 2 → Test 6: Cinematic Hotspot Portrait

### Baseline strengths

- Strongest personality and memorable art direction of the four.
- Full-bleed portrait and dark stage language make Coach Kai the brand anchor.
- Hotspots create curiosity and work well as a compact navigation model.

### Weaknesses

- The main offer, supporting proof, and CTA compete with the portrait.
- Small hotspot labels and low-contrast secondary copy can slow comprehension.
- The mobile stack becomes long before the visitor reaches the decision content.

### Evolution strategy

Retain the cinematic portrait and hotspot interaction, but add a clear five-second proposition, a visible action rail, chapter-style storytelling, and verified authority cards. Motion should feel like stage lighting—finite, purposeful, and removed under reduced-motion preferences.

## Test 3 → Test 7: Spatial Glass Canvas

### Baseline strengths

- Calm spatial field communicates modernity without feeling childish.
- Glass planes make the information system feel exploratory.
- Blue/yellow palette has strong SpeakKai brand recognition.

### Weaknesses

- The dispersed desktop composition weakens the primary reading path.
- Evidence and CTA can feel like secondary floating objects rather than a decision sequence.
- Blur/transparency can reduce contrast and must degrade gracefully.

### Evolution strategy

Retain depth, blue atmosphere, and modular glass. Introduce a stronger central focus rail, audience-goal controls, an anchored conversion panel, and clear verified credentials. Treat depth as enhancement only: every surface needs an opaque fallback, visible focus, and simple mobile stacking.

## Test 4 → Test 8: 3D Card Architecture

### Baseline strengths

- Best commercial explanation of the available speaking paths.
- Light technical language feels suitable for schools and institutional buyers.
- Cards create a natural inspection interaction.

### Weaknesses

- Desktop hierarchy splits between headline, portrait, cards, and inspector.
- The 3D metaphor risks resembling generic product software.
- The visitor needs a clearer bridge from choosing a path to starting a conversation.

### Evolution strategy

Retain the dimensional program deck and institutional clarity. Organize the page as Brief → Choose a path → See the practice method → Start a planning conversation. Add a disciplined blueprint grid, explicit customization language, and stronger CTAs without inventing packages, capacity, pricing, or partnership proof.

## Cross-pollination rules

- Share accessibility and interaction contracts, never visual sameness.
- Test 5 may borrow Test 8’s commercial clarity but not its technical styling.
- Test 6 may borrow Test 7’s anchored controls but keep cinematic motion.
- Test 7 may borrow Test 5’s human warmth through copy and portrait treatment, not cream styling.
- Test 8 may borrow Test 6’s dramatic focal hierarchy, not dark stage aesthetics.

## Adversarial guardrails

- Minimalist: reject additions that duplicate an existing message.
- Performance: no autoplay video, heavy animation library, or globally loaded editor.
- Accessibility: no critical hover-only content, keyboard-operable controls, reduced motion, high-contrast fallbacks.
- Conversion: one primary action per major section and proof before repeated asks.
- Brand: keep all claims traceable to current public SpeakKai content; do not invent testimonials, partnerships, results, or packages.
