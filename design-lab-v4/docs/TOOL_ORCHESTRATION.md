# Tool Orchestration

The goal is not to use every tool on every experiment. The goal is to route each job to the best tool while keeping Codex as the implementation and QA orchestrator.

## Codex — source-code orchestrator

Codex should:

- inspect the repository
- archive the old experiments
- create the content and experiment registries
- implement Tests 21–50
- create accessible interaction states
- run the local app
- capture screenshots
- run viewport, console, accessibility, and performance checks
- generate external asset briefs when another tool is more suitable
- integrate returned assets
- maintain a decision log

Codex must not store credentials or bypass login/security controls for external services.

## Figma — layout and system exploration

Use Figma selectively for:

- high-risk or geometrically complex concepts
- the three family-level art-direction boards
- shared spacing/type studies
- 3D/spatial or isometric keyframes
- interaction-state diagrams
- stakeholder-mode comparisons

Do not require 30 complete Figma mockups before coding. A code-first concept can be valid.

Recommended family boards:

1. Corporate: Tests 21–30
2. Fun/Motion: Tests 31–40
3. Modern: Tests 41–50

## Canva — fast compositing and static graphic prep

Use Canva for:

- photo cutouts and simple composites
- sticker sheets
- contact sheets
- poster compositions
- desk-world props
- approved texture overlays
- static fallback frames

Export web-ready transparent PNG, SVG where appropriate, and source metadata.

Do not flatten essential text or UI into a raster image.

## ChatGPT image generation — custom decorative assets

Use it for:

- abstract backdrops
- non-factual decorative illustrations
- style-consistent icons or props
- controlled portrait-derived stylization only when an approved user photo is supplied

Portrait rules:

- preserve facial identity
- do not make the user thinner/fatter unless explicitly requested
- do not invent clothing, credentials, uniforms, or event contexts that could be mistaken as factual
- retain an authentic photo version for trust-heavy pages
- record generated assets in the asset manifest

## HyperFrames

Use HyperFrames for:

- deterministic 16:9 motion studies
- animated poster studies
- title sequences
- short background loops
- launch/showreel videos
- testing the timing of kinetic type

Do not use a rendered HyperFrames video as the only content layer of an interactive homepage. The website still needs accessible HTML, real controls, and reduced-motion fallbacks.

## Remotion

Use Remotion for:

- React-based motion prototypes
- flipbook or transformation sequences
- reusable motion components
- a final design-lab showreel
- pre-rendered fallback loops or social previews

Do not mount a heavy Remotion Player on every route without a clear reason.

## Suno — optional audio identity

Audio is optional and should not block the website project.

Use Suno only for:

- an owned instrumental track for a design-lab showreel
- an opt-in sound mode for a single experiment
- rhythm studies for Test 38

Rules:

- no autoplay audio
- visible mute/sound control
- the page must work fully without sound
- store no account credentials
- keep licensing/source notes with exported audio
- do not use copied melodies or lyrics

## Runtime motion

Prefer:

- CSS for simple transitions
- the project’s existing animation library
- GSAP/Framer Motion for sequenced interface motion
- SVG for line/path animation
- Canvas/WebGL only when clearly justified

## Asset handoff queue

Codex should create machine-readable jobs rather than stalling:

```json
{
  "job_id": "asset-036-sticker-pack",
  "test": 36,
  "tool_preference": ["Canva", "ChatGPT image generation"],
  "input_asset": "public/portraits/coach-kai-original.jpg",
  "prompt_file": "design-lab-v4/asset-jobs/asset-036.md",
  "required_outputs": [
    "public/design-lab/test-36/coach-cutout.webp",
    "public/design-lab/test-36/stickers.svg"
  ],
  "status": "requested"
}
```

If authenticated external-tool automation is unavailable, Codex should use a high-quality CSS/SVG fallback, continue building, and report the asset job clearly.
