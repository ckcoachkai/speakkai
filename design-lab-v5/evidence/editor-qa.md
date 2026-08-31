# Versions 9–12 visual editor QA

## Architecture

Versions 9–12 reuse the rendered evolution canvas from Versions 5–8. The editor stores structured JSON per editable version in browser `localStorage`; it does not rewrite source code. Normal page rendering loads only a small state bootstrap. The editor module and control CSS load after **Edit Page** is activated.

## Implemented controls

- page-element and layer selection with visible outlines;
- direct double-click text editing plus property-panel content editing;
- font, size, weight, line height, letter spacing, alignment, text/background color;
- width, height, padding, margin, gap, radius, opacity;
- image source, local image replacement up to 1.5 MB, fit, and focal point;
- section drag/reorder and element move up/down;
- hide/show, duplicate, and delete duplicated elements;
- desktop, tablet, and mobile constrained previews;
- undo, redo, confirmed reset, Save, and JSON export;
- keyboard undo/redo and Delete for generated copies.

## Review loop

1. **Non-technical user:** layer labels use page language, not DOM terminology; the selected element and current save scope are visible.
2. **Professional designer:** typography, spacing, dimensions, imagery, hierarchy, and section order are directly adjustable. Arbitrary free positioning was intentionally excluded because it would break responsive production layouts.
3. **Developer:** configuration is versioned JSON and constrained inline properties, not generated source mutations.
4. **UX specialist:** a first desktop render showed the page squeezed between the layers and properties panels. The editor was changed to scale a true 1440px artboard into the available workspace.
5. **Performance engineer:** editor assets are lazy; the quality suite confirmed `visual-editor.js` is absent before activation on all editable routes.

## Defects found and fixed

- **Undo after text change:** browser blur emitted a second change event and created a duplicate history entry. No-op text changes are now ignored; undo/redo and reload persistence pass.
- **Nested layers omitted:** the initial tree exposed containers but skipped their cards. The tree now includes every labeled editable element.
- **Desktop preview cramped:** a squeezed desktop layout distorted hierarchy. A scaled true-width artboard now preserves composition.
- **Oversized local images:** browser storage can fail on large data URLs. Replacements are constrained to 1.5 MB and explain the limit.

## Automated interaction receipt

`scripts/check-evolution-editor.mjs` verifies all 12 routes, lazy editor activation on 9–12, layers, text edits, undo, redo, responsive preview switching, Save, reload persistence, duplication, and duplicate persistence. Final result: passed.

## Known boundaries

- Saved edits are local to the current browser/device until exported as JSON; they are not a shared database or production publish action.
- Imported JSON, clipboard style copy/paste, alignment guides, animation tuning, and unconstrained free-positioning are not included in this stable core.
- A very large embedded image is intentionally rejected; optimized web assets should be used for production.
