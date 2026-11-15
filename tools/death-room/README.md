# The Death Room — speaker picker

Enter **2–8 student names**. The **first person eliminated is chosen to speak**. Each draw selects one student. **Choose Next Speaker** excludes previously selected students until you reset the speaker order.

## Play

Double-click **Start-Game.cmd** on Windows. It opens the prebuilt upgraded game at http://127.0.0.1:5188. Node.js must be available; npm installation, API keys, Suno login and internet are not needed to play.

Choose one of the ten rooms or **Random room**, set the countdown, then click **Choose First Speaker**. After the reveal, choose the next speaker or reset the class. The last remaining student still receives a normal draw. Rooms and countdown length can change between draws; names stay locked until reset.

Player 456 remains in the room and is never selected. Four pink-uniformed staff stand outside the playing area.

## Controls

- Arrow keys or left mouse drag: look around. Arrow keys retain normal behavior in form fields.
- Mouse wheel: zoom. Right drag: pan.
- **Face Cam**: inspect the next character; preview characters pause and demonstrate an expression.
- **Camera**: observation, floor and overhead views.
- **Labels**: automatic spacing, all name labels, or hidden cards.
- **Pause / Reveal**: pause the draw or skip to its outcome.
- **☰ / Settings**: collapse or reopen the sidebar.
- **Fullscreen**: expand the scene and hide the header/footer. Settings becomes an overlay drawer; Exit Fullscreen restores the previous sidebar state.
- **Sound**: toggle music and effects. Sound begins after a game interaction. The slider adjusts music volume.
- **Blood effects**: toggle blood, wound marks and pools. Burns and floating bodies remain separate.

Characters move independently, with fresh behavior seeds, varied walking pace, brief hesitations and individual reaction timing. Escape targets retain their required speed. Rat swarms, boiler steam patterns and freezing effects vary between room loads. Camera input does not influence selection. One name is locked at the start using unbiased Web Crypto sampling, and the animated room reveals that result.

## Characters and effects

Eight fictional adult identities have authored Japanese, Korean, Chinese, Indonesian, Malaysian and Indian backgrounds. These biographies do not describe the real students whose names are entered. Each has a numbered green/cream tracksuit, distinct movement timing/personality, facial morphs, gaze/blinks and hazard reactions. Player 456 uses a separate reference-inspired model; likeness is approximate.

The ten rooms are crushing walls, boiler, flood, gas, rats, collapsing floor, electricity, freeze, spikes and lasers. All students receive early hazard damage. Only participant names are displayed; health remains internal. Injury marks, guarded posture, fatigue, vocal reactions, burns and ice build with exposure. Rats bite at actual mouth contacts, with bite marks, blood jets/pools and soft debris. Living electrical burns remain patchy; fatal scorching can turn fully black. Ordinary falls settle into a still authored pose; floating corpses move as whole objects. Freezing slows actual movement and animation to a completely fixed upright pose, with opaque surface rime and attached crystals. Spike impalement holds the actual contact pose through the reveal. The flood starts with two bodies already on the floor; they rise continuously with the water. Water reaches the 7m ceiling, and the selected drowned character sinks with a preserved pose. Crushing walls hold the group inside until the final seconds, then survivors rush for clearance. Visual corpses never enter the name draw.

Materials use Blender-baked skin pores, fabric weave/stitches, footwear grain, brushed metal, chipped paint, corrosion, concrete pores and wet drain detail. These are detailed authored browser-game models and effects; they do not reproduce the fidelity or physical simulation of a modern AAA game.

Danger reactions include covering the mouth in gas, shielding the head, warding off rats, heat recoil, cold hugging and varied bracing/stumbling. Actual hit positions can trigger short escape steps; explicit safe-route targets retain priority. Gas faces flush red, turn blue-purple and develop nose/eye/mouth bleeding. Only the selected fatal gas exposure produces a brief bounded facial burst. Blood OFF suppresses facial blood/bursts as well as wounds and pools. The spike fatality waits for real rendered metal/body contact and a short embedded hold; the person is not teleported to a strike location.

## Music and voices

Ten genuine **Suno v6** tracks are stored in `public/assets/music/`. Each room has its own musical style and short original lyrics. The manifest retains source URLs, provenance, titles and measured durations. Tracks last roughly 79 seconds, use balanced loudness and crossfade between rooms; pause/resume preserves playheads.

Composition briefs and lyrics are in `music-design/`. Six recorded CC0 scream, gasp, effort and crying clips are in `public/assets/voices/`, with full source credits. Per-character pitch/filter/pan, cadence limits and a maximum of two simultaneous voices keep the mix controlled. Actual musical audition and seamless-loop verification were not performed.

## Source, licensing and development

- `src/`: game source; `dist-v2/`: prebuilt upgraded game.
- `public/assets/cast/`: eight models, hashes, expression rules, texture-generation prompts and contact sheets.
- `public/assets/blender/`: original industrial props, editable Blender source and validation; `tools/`: asset scripts.
- Character models derive from Microsoft Rocketbox under MIT; preserve included notices.
- Original industrial props are CC0. Voice recordings retain their CC0 source records. Music retains Suno provenance.
- Dependency licenses are in `THIRD-PARTY-NOTICES.txt`.

Develop with `npm install` and `npm run dev`. Build with `npm run build -- --outDir dist-v2`.

To serve the upgraded build manually in PowerShell:

```powershell
$env:DEATH_ROOM_BUILD = 'dist-v2'
$env:DEATH_ROOM_PORT = '5188'
node server.mjs
```

The server binds only to 127.0.0.1 and supports audio byte ranges. Names remain in browser memory and are not uploaded or persisted across reloads. `VERIFICATION.md` and `verification/` summarize checks; detailed work evidence is under this chat’s `work/upgrade-v4/` directory. Rendering speed depends on the GPU/browser; motion, fluids, damage and death poses are authored visual approximations.
