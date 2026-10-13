# Integrated Pac-Man assets

Copied from the existing SpeakKai Pac-Man game at repository commit 320a3ad056454616c4c06d8147103b45a343ba39:

https://github.com/ckcoachkai/speakkai/tree/320a3ad056454616c4c06d8147103b45a343ba39/public/games/pacman

The original engine blob is 8b7f38a5d021f17a77591ce588bb3416a496f457 (8,914 bytes). games/pacman-engine.js retains those original bytes inside a private module capture, exporting PacEngine without adding a browser global. games/pacman.js renders its maze directly inside the shared arcade stage. It does not load the old menu, roster editor, navigation, stylesheet or storage logic.

The Kai PNG and seven short WAV files were matched against the pinned repository's file sizes and Git blob hashes. Combined asset size is 470,145 bytes. Original Pac-Man geometry, movement and power-up/collision rules remain in the copied engine. The adapter uses the arcade's current eligible roster and speaking-history callbacks; normal mode uses the four original ghost identities and does not pick students.
