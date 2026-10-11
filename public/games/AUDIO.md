# Garden sound effects

Garden Siege uses the original short Plants vs. Zombies sound effects requested for this update. The files were obtained from the publicly accessible [PvZ_Assets sound directory](https://github.com/FregD156/PvZ_Assets/tree/main/sounds), which documents extracted game assets. Plants vs. Zombies and its original audio belong to their respective owners; this source is recorded as provenance, not as a license grant. The music remains an original synthesized loop.

| Event | Original file | Duration |
| --- | --- | --- |
| Pea shot | throw.ogg | 0.141s |
| Pea impacts | splat3.ogg, splat.ogg | 0.682s, 0.522s |
| Armor hit | shieldhit.ogg | 0.274s |
| Zombie growls | groan.ogg, groan2.ogg, groan3.ogg, groan4.ogg, lowgroan.ogg | 1.022–2.101s |
| Zombie chewing | chomp.ogg, chomp2.ogg | 0.993s, 1.165s |
| Plant recruited | plant.ogg | 0.755s |
| Sun, star or loot pickup | points.ogg | 1.132s |
| Zombie defeated | zombie_falling_1.ogg | 0.644s |

All14 files were checked against the source Git blob hashes and successfully decoded by the browser's AudioContext. Total asset size is252,136bytes. The offline HTML embeds the same Ogg samples. Sound remains an optional browser preference, controlled by ♪ in the bottom Controls drawer.

## Opening and selection cues

The opening uses the original short readysetplant.ogg cue (5.255 seconds). Selection plays floop.ogg (0.120 seconds), followed by groan.ogg and winmusic.ogg (4.421 seconds). The Garden result poster stays visible for 5.6 seconds, allowing the outro to finish. These three new cue files were verified against their original source Git blob hashes; see dist/assets/AUDIO.md for the exact sources. Reset, mute, changing games and leaving the page cancel pending and active cues. The battle accompaniment remains synthesized.
