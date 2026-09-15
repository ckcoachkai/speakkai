# Wide forest, fluid running and cartoon foley

The camera now displays a 3200 by 1800 world at half the old scale. Runners begin
on-screen and cross a longer visible path. Fixed trail markings provide reference
points for forward motion. Starting columns shuffle each round.

Strides advance with distance, rather than an unrelated clock. Jointed legs use
two-bone inverse kinematics; arms swing in opposition. Acceleration and banana
boosts ease smoothly. Bounces, lane zigzags and poses freeze during Pause.
Gentle motion reduces bounce, sway, zigzag and splash counts.

Six short ElevenLabs sound effects supply leaf/dirt footsteps, cartoon chomps,
brittle biscuit cracks, ketchup squirts and banana pickup pops. Footsteps trigger
on stride contacts, with randomized texture and pitch, stereo position and a
crowd rate limit. The separate Effects toggle controls all foley. All six clips
are prerecorded; the browser makes no ElevenLabs API requests.

Runners acquire a gradual warm-red tint over their entire sprite, including the
face. Shiny cartoon ketchup droplets trail them. A selection triggers a short
chomp animation and sauce splash, then reveals the result after 550 ms. Reset
cancels that pending result. Particles have bounded lifetimes and a hard count cap.

Verification: movement tests at 30, 60 and 120 FPS, stride-distance consistency,
smooth boost acceleration, frozen pause poses, gradual tint, bounded finishing
time, and hashes for all six source and built effects. All six encoded MP3s
decode successfully. Existing 100-voice and Resources checks remain in place.

The generation prompts, durations and hashes are in `forest-sfx-manifest.json`.
Existing names and outfits remain in browser storage. No roster was added to the
repository. The previous cartoon voice pack is unchanged.

Rollback: revert this feature commit to restore the previous scene and controls.
