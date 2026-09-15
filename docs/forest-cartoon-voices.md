# Forest cartoon voice release

Replaces all 100 Windows-generated clips with the user-requested ElevenLabs v3
cartoon performances, ten distinct stock voices for the ten characters.
The user described the game as noncommercial and explicitly requested publication.

Natural-speed playback replaces the old 0.84 speed multiplier. Voice gain is now
1.0 because clips are loudness-normalized. A media query version invalidates old
browser audio caches. The page credits ElevenLabs and identifies the public-figure
lines as fictional synthetic performances.

The API key and generation tools are not part of the website. Only prerecorded
MP3 files are served; playback does not use API credits or upload player names.

Before release, the personal edition passed decoding checks for all 100 MP3s,
one-line-per-character transcription checks, and browser playback checks for all
ten voice selections. The website check additionally verifies every file hash
against `forest-voice-manifest.json`, phrase coverage, attribution and cache version.

Rollback: revert this release commit to restore the previous 100 audio assets,
playback settings and page copy together.
