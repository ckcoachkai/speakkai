# SpeakKai Experiment Lab V4

This kit turns the SpeakKai homepage tests into a controlled **30-concept, single-screen design laboratory** for Codex.

It is designed around the supplied reference screenshot: the clean, pale-blue **Parent Command Center** page with a large portrait, oversized headline, modular information cards, restrained yellow accent, and a no-scroll 16:9 composition.

## What this package contains

- `MASTER_CODEX_PROMPT.md` — paste this into Codex to run the full project.
- `.codex/skills/speakkai-experiment-lab/SKILL.md` — reusable project skill.
- `config/experiments.json` — the source of truth for all 30 concepts.
- `reference/parent-command-center-reference.png` — the supplied visual reference.
- `docs/REFERENCE_ANALYSIS.md` — what to preserve from the reference and what not to clone.
- `docs/ARCHITECTURE.md` — suggested component/data architecture.
- `docs/CONTENT_CONTRACT.md` — what information every single-screen concept must communicate.
- `docs/TOOL_ORCHESTRATION.md` — how Codex, Figma, Canva, ChatGPT image generation, HyperFrames, Remotion, and Suno fit together.
- `qa/` — viewport, stakeholder, accessibility, performance, and differentiation gates.
- `scripts/` — framework-neutral Playwright/Python helpers for screenshots, one-screen testing, registry validation, and contact sheets.
- `plugin/ORCHESTRATOR_PLUGIN_BLUEPRINT.md` — optional future MCP/plugin design.

## Numbering decision

The request said “replace 22–50” and “create 30 new versions.” Since 22–50 contains only 29 numbers, this kit uses:

- **Tests 21–30:** corporate / institutional / trust-led
- **Tests 31–40:** fun, animated, kinetic, motion-graphic
- **Tests 41–50:** modern, spatial, experimental, premium

That gives exactly 30 tests.

Before replacing anything, Codex must archive the current experiment set and preserve the exact page matching the supplied screenshot. The screenshot itself appears to label the page as **Test 40 / Parent Command Center**, even if it was remembered as Test 39. Codex must identify it by visible text/component content rather than relying on the remembered number.

## Recommended first command to Codex

Paste the contents of `MASTER_CODEX_PROMPT.md`, or say:

> Read `design-lab-v4/MASTER_CODEX_PROMPT.md`, `design-lab-v4/config/experiments.json`, and the SpeakKai Experiment Lab skill. Execute the project autonomously from archive through final QA. Do not delete the current Parent Command Center design until it is archived and screenshot-tested.

## Installation into a repository

Place this entire folder at a stable project path such as:

```text
/design-lab-v4/
```

Copy the skill into the repository-level Codex skill location if your Codex setup expects it there:

```text
/.codex/skills/speakkai-experiment-lab/SKILL.md
```

Codex should adapt routes, scripts, and commands to the actual framework. Do not force the example route `/test/{n}` if the project already uses a different convention.

## Core operating rule

A test is not done when it compiles. It is done only after:

```text
ARCHIVE
→ INVENTORY
→ SPECIFY
→ BUILD
→ RENDER
→ SCREENSHOT
→ VIEWPORT TEST
→ STAKEHOLDER REVIEW
→ RED TEAM
→ DIFFERENTIATION CHECK
→ PERFORMANCE CHECK
→ FIX
→ RE-RENDER
```
