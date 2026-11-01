# Explosion sound layers

These three sounds are original procedural synthesis created for this project on 2026-11-01. They contain no sampled recordings or third-party source material. The creator dedicates these generated assets and the synthesis script to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/); attribution is not required.

| File | Design | Duration | Peak | RMS |
| --- | --- | ---: | ---: | ---: |
| `explosion-attack.wav` | Broadband crack and descending punch | 0.38 s | -1.31 dBFS | -20.09 dBFS |
| `explosion-body.wav` | Low turbulent pressure wave and descending bass | 0.98 s | -2.05 dBFS | -18.83 dBFS |
| `explosion-debris.wav` | Decaying grit and staggered fragments | 1.12 s | -3.35 dBFS | -21.42 dBFS |

All files are mono 44,100 Hz signed 16-bit PCM WAV. The script applies DC removal and onset and tail fades, and normalizes each layer below full scale. Measured residual DC offsets are all below 0.00019 of full scale. Mixer headroom is still needed when layers overlap. Reproducible synthesis and a 32-window peak waveform envelope, measured peaks, RMS, and DC for each file are in `evidence/impact-upgrade/audio-scout/`.

Existing `impact.wav` and `pressure-release.wav` were inspected but not sampled: their source credits remain in `CREDITS.md`.
