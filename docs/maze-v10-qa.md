# Dynamite Mice v10 QA

The packaged v10 gate is `scripts/check-maze-v10.mjs`. It runs against the
embedded engine and renderer in `public/maze/index.html` or `dist/maze/index.html`
and is invoked after the v9 gate in the Pages build.

It covers the new independent floor-bomb contract: bombs are enabled by
default, spawn at 5-second intervals, use a 10-second fuse, emit one tick at
3, 2, and 1 seconds remaining, respect pause and speaker holds, and present
multi-hit casualties one at a time without advancing simulation time. It also
checks that a blast resets a cat to the valid maze start and that the carried
bomb retains its 30-second cadence when floor bombs are isolated.

The packaged renderer checks the crawler atlas, all five crawler species and
four atlas frame source rectangles, the 28-piece foreground payload contract,
and the 3.4-second full-impact freeze declaration. Browser QA still owns the
visual round, mobile layout, audio playback, vibration, and physical touch
checks. The v9 label gate now matches the current presentation: compact direct
text anchored to the settled anatomy piece with a subtle glow, without
connecting lines or side rails.

Run locally from `work/speakkai-maze` after a site build:

```powershell
node scripts/check-maze-v10.mjs --dist
```

The final local Chromium pass completed 18 browser checks with no application
exceptions, including multi-hit Continue queues, a pixel-stable settled canvas,
soundtrack pause/resume, cat teleport and movement recovery, fullscreen, Gore
Off, reduced motion, and 375/320px layouts without horizontal overflow. Peak,
shrinking and settled effects and close feeding views were visually inspected.
The full site build and all seven distribution gates passed. OfflineAudioContext
rendering produced non-silent cues with zero clipped samples (peak -15.4 dBFS).
Physical vibration, touch hardware, Safari, Firefox and screen readers remain
unverified. The source and receipts are retained in the workspace v10 QA folder.
