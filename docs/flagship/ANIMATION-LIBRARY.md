# SpeakKai animation and visual asset library — V30

All three media types exist. They demonstrate original fictional teaching tasks; they are not testimonials, documentary footage, real venues or outcome evidence.

## Remotion: Point · Example · Check

Sources: [PointExampleCheck.tsx](../../media/remotion/src/PointExampleCheck.tsx), [Root.tsx](../../media/remotion/src/Root.tsx). Exact commands/font notes: [PROVENANCE.md](../../media/remotion/PROVENANCE.md). Technical/hash inventory: [manifest.json](../../media/remotion/manifest.json).

| Composition | Contract |
|---|---|
| PointExampleCheckEN | 18 seconds, 1080 x 1080, 30fps, 540 frames, H.264, no audio; 285,220 bytes |
| PointExampleCheckZH | Same timing/format; 265,572 bytes |
| Posters at frame 45 | 720 x 720 WebP; 16,194 / 17,532 bytes |

The outputs are public/media/point-example-check-{en,zh}.mp4 and .webp. Remotion 4.0.522 and React 19.2.3 are pinned in the separate media/remotion project. Each beat lasts six seconds; rendered frames drive transitions. Windows Arial/Microsoft YaHei are system references, not distributed fonts. Other machines may render text differently.

From media/remotion, run npm ci and npx tsc --noEmit. Preview with npx remotion studio --no-open --port=4330. Follow PROVENANCE.md to render both compositions with --muted and both frame-45 PNG posters. Then run node scripts/prepare-motion-assets.mjs from repository root: it compresses posters, probes actual streams/frame count/duration and writes hashes. Review frames, full playback and both languages before committing changed outputs. Do not update hashes simply to silence a check.

## Blender: imagined rehearsal room

[create_stage.py](../../media/blender/create_stage.py), [CONTRACT.md](../../media/blender/CONTRACT.md) and [final_report.md](../../media/blender/final_report.md) define reproduction and limitations. Native/export files are media/blender/output/rehearsal-stage.blend and .glb; both are deliberately tracked under an otherwise ignored output directory.

Blender 5.2.1 LTS, build 9e2066aef7ef. The scene has 95 meshes, 72,964 evaluated triangles, five materials and 8.8 x 8.4 x 4.11m bounds. Adaptive bevel fixes removed degenerate geometry. Blender retains procedural timber; GLB uses a deliberate solid timber approximation. Final GLB metrics were refreshed in V30 and pass. No game, physical-access or acoustics claim follows from this inspection.

Run Blender in background factory-startup mode with create_stage.py from repository root. It renders a 1200 x 900 PNG using CPU Cycles, 32 samples, denoising and AgX Medium High Contrast. render_imported.py produces independent export views. The site uses only public/media/rehearsal-stage.webp: 960 x 720, 26,990 bytes. It requests no GLB or 3D runtime.

## AI illustration: umbrella, book and bench

Raw output: media/story/umbrella-source.png. [PROVENANCE.md](../../media/story/PROVENANCE.md) preserves the exact prompt and generation method. Website file: public/media/umbrella-story.webp, 960 x 720, 159,342 bytes. Optimization only resizes/compresses; no crop or artistic edit. Regeneration is not pixel-identical and needs fresh review.

Keep the visible AI-generated fictional illustration label, full scene description and observation-versus-possibility distinction. No identifiable student, source photo, actual venue or documentary footage was supplied to generation.

## Integration and acceptance

[FlagshipWatchPage](../../src/components/FlagshipWatchPage.astro) integrates native controls, preload none, muted/playsinline, no autoplay/loop and every instructional sentence in HTML. [FlagshipStagePractice](../../src/components/FlagshipStagePractice.astro) and [FlagshipStoryPrompt](../../src/components/FlagshipStoryPrompt.astro) use native details. Print alternatives reuse the same strings, independent of open/closed state. Three native anchors focus the matching practice headings.

There is no page hydration or external media service. Reduced motion disables smooth scrolling; playback remains user-started. scripts/check-premium-media.mjs verifies output hashes, fictional labels and text. media/visual-assets.json records image hashes. CI also enforces media byte budgets. See cycles/30.md for actual browser evidence and unverified engines, assistive technologies, physical printing and learning effects.
