# Music and Elton dance

All ten bosses: eight seconds after the combo, with shoulders (0–2s), hips (2–4s), then jumps (4–8s), before the result card. Uses the game clock and Gentle mode.

Suno creation is pending: no callable Suno connector found, and the computer-use browser bridge failed on both opening Suno and listing browsers. No Suno music has been generated or downloaded.

Prepared Suno prompts:

- Forest race: Instrumental happy pop EDM, 126 BPM, C major, bright pluck hook, warm major chords, bouncy bass, clean four-on-the-floor kick and claps, playful classroom adventure, polished sound, no vocals, no artist imitation, no dramatic intro, seamless loop arrangement.
- Boss celebration: Instrumental joyful piano-house dance break, 126 BPM, C major, sparkling piano chords, funky bass, claps and upbeat synth melody, immediate full groove for shoulder shakes, hip sways and jumps, eight-second cut suitable for looping, no vocals or artist imitation.

Temporary fallback: existing in-browser score revised to 126 BPM major-key pop/EDM. Audio begins on the first audio-enabling user interaction, subject to browser autoplay restrictions. No claim that this fallback is Suno-generated.

Playback fix: score scheduling starts immediately after AudioContext.resume, independently of voice/SFX fetches; music gain increased from 0.18 to 0.65. First Music click unlocks playback instead of muting the not-yet-started score. Browser analyser measured RMS 0.138 while playing and 0.0000011 when muted. Speaker output has not been independently listened to.
