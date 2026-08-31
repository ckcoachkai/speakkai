---
name: speakkai-experiment-lab
description: Build, test, red-team, and compare 30 distinct single-screen SpeakKai homepage experiments using verified content, a shared portrait asset, stakeholder-specific design, route isolation, screenshot QA, and viewport back-testing.
---

# SpeakKai Experiment Lab

Use this skill whenever Codex is asked to create, replace, compare, or refine SpeakKai homepage tests.

## Required reads

Before implementation, read:

1. `design-lab-v4/MASTER_CODEX_PROMPT.md`
2. `design-lab-v4/config/experiments.json`
3. `design-lab-v4/docs/REFERENCE_ANALYSIS.md`
4. `design-lab-v4/docs/CONTENT_CONTRACT.md`
5. `design-lab-v4/docs/TOOL_ORCHESTRATION.md`
6. `design-lab-v4/qa/ACCEPTANCE_CRITERIA.md`

## Hard gates

### Archive gate

Never overwrite the current experiment range before:

- branch/commit/tag
- component archive
- screenshots
- dependency/asset record

Locate the Parent Command Center by visible strings, not remembered route number.

### Accuracy gate

Never invent evidence, outcomes, schools, testimonials, credentials, or statistics.

### Single-screen gate

Tests 21–50 must fit at:

- 1920×1080
- 1600×900
- 1440×900
- 1366×768

Desktop scroll is a failure unless the repository’s actual protected browser shell makes it impossible; in that case adapt the composition rather than hiding overflow.

### Differentiation gate

Each test must differ from neighboring tests in at least six design-signature dimensions.

### Accessibility gate

Critical content cannot be hover-only. Support keyboard, click/tap, reduced motion, and readable contrast.

### Evidence gate

Completion requires:

- screenshots
- automated viewport output
- contact sheet
- review scores
- fixed issues
- regression result

## Workflow

```text
archive
→ inventory
→ verify content
→ build one batch
→ render
→ screenshot
→ viewport test
→ stakeholder review
→ red team
→ fix
→ contact-sheet compare
→ next batch
→ final cross-test back-test
```

## Tool routing

- Codex: code, integration, testing, reports
- Figma: complex layout/keyframe exploration
- Canva: cutouts, composites, posters, static graphic prep
- Image generation: decorative assets and approved portrait derivatives
- HyperFrames/Remotion: motion studies and rendered supporting assets
- Suno: optional opt-in audio/showreel only
- Playwright: browser screenshots and one-screen checks

Do not use tools for spectacle alone. Choose the lightest method that achieves the concept.

## Output discipline

Maintain:

- experiment registry
- asset manifest
- decision log
- QA results
- screenshots
- contact sheets
- final comparative report
