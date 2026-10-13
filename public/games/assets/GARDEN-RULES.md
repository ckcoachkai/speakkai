# Garden rules: original reference and browser adaptations

This document accompanies `games/garden-rules.js`. It records the numeric reference values shared by the classroom name picker and the separate playable lawn mode. The sources are publisher documentation and pinned community reconstructions of the PC game. This is a browser adaptation, not a claim of binary equivalence, an official PopCap release, or a complete reproduction of the Adventure campaign.

## Sources and version limits

- [EA-hosted Plants vs. Zombies readme](https://akamai.cdn.ea.com/eadownloads/u/f/manuals/GAME-PVZ/en_US_readme.html): general play rules, sun, rows, seed recharge, cold, upgrades, and single-use lawnmowers. It identifies the original release date as May 5, 2009, but the supplied page is a version 1.0.40 readme built October 17, 2012 with Mac system requirements. It does not supply all numeric combat values and is not being represented as an untouched 2009 PC manual.
- [Patoke/re-plants-vs-zombies](https://github.com/Patoke/re-plants-vs-zombies/tree/c4692036c5e11d227c8fb7c593b734dac96da028), pinned commit **c4692036c5e11d227c8fb7c593b734dac96da028**: plant, projectile, zombie, board, seed-packet, random-number and animation implementations. Its [README](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/README.md) describes a decompilation/modernization project based on the older 0.9.9 reconstruction, with later GOTY work.
- [ruslan831/PlantsVsZombies-decompilation](https://github.com/ruslan831/PlantsVsZombies-decompilation/tree/325b2229a7225d73870bb69322eefcda3a45bf8d), pinned commit **325b2229a7225d73870bb69322eefcda3a45bf8d**: an archived reconstruction containing explicit comments comparing selected behavior against the PC **1.0.0.1051** binary. Those comments are evidence supplied by that repository; this project has not independently disassembled or verified the retail executable.
- Existing articulated artwork comes from [FregD156/PvZ_Assets](https://github.com/FregD156/PvZ_Assets/tree/8ba94e95cfe7d0de5682f8258d3b932dbdac885c), pinned commit **8ba94e95cfe7d0de5682f8258d3b932dbdac885c**. See `garden-rig/PROVENANCE.md` for individual original PNGs and transform sources.

## Time and coordinate units

The reference logic updates every **10 ms**, or **100 ticks/second**. This is game simulation frequency, not a requirement to draw 100 frames/second. [SexyAppBase.cpp](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/SexyAppFramework/SexyAppBase.cpp#L187) sets the frame time to 10 ms. The JS API uses seconds for duration fields and original lawn pixels/second for `speed`; accompanying `*Ticks` fields preserve the reference counters.

The daytime lawn is **5 rows × 9 columns**, with original tile spacing **80 px horizontally and 100 px vertically**. Browser engines scale that coordinate system to the visible canvas. See [Board::GridToPixelX/Y](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Board.cpp#L9204).

## Plant catalog

Costs below are **sun costs**, not the shop's coin purchase prices. Recharge is the seed packet's repeat-use counter. Most plants have **300 HP**. Wall-nut and Tall-nut have **4,000/8,000 HP** and do **no contact damage**. Definitions and HP overrides: [Plant.cpp definitions](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L25), [initial health](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L113), [nuts](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L268).

| Browser ID | Original plant | Sun | Recharge | HP | Attack or production |
| --- | --- | ---: | ---: | ---: | --- |
| `sunflower` | Sunflower | 50 | 7.5 s | 300 | Produces 25 sun; first 3–12.5 s, then 23.5–25 s |
| `pea` | Peashooter | 100 | 7.5 s | 300 | One 20-damage pea |
| `twin` | Repeater | 200 | 7.5 s | 300 | Two 20-damage peas, paired 0.25 s apart |
| `burst` | Threepeater | 325 | 7.5 s | 300 | One 20-damage pea in each valid adjacent/current row |
| `frost` | Snow Pea | 175 | 7.5 s | 300 | 20 damage, cold for 10 s |
| `gatling` | Gatling Pea | 250 | 50 s | 300 | Four 20-damage peas; upgrades a Repeater |
| `catapult` | Melon-pult | 300 | 7.5 s | 300 | 80 direct damage plus nearby 26-damage splash |
| `wintermelon` | Winter Melon | 200 | 50 s | 300 | Melon damage and cold; upgrades a Melon-pult |
| `splash` | Kernel-pult | 100 | 7.5 s | 300 | 20-damage kernel or 40-damage butter, with no area splash |
| `pierce` | Cactus | 125 | 7.5 s | 300 | 20-damage single-target spike; can target balloons |
| `walnut` | Wall-nut | 50 | 30 s | 4,000 | Blocks movement; does not shoot or hurt on contact |
| `tallnut` | Tall-nut | 125 | 30 s | 8,000 | Blocks movement and vaulting; no contact damage |
| `potato` | Potato Mine | 25 | 30 s | 300 | 15 s buried countdown plus original19-frame rise at18fps; armed contact blast1800 in the same row |
| `cherrybomb` | Cherry Bomb | 150 | 50 s | 300 | 1 s source special counter, then1800 area damage |
| `torchwood` | Torchwood | 175 | 7.5 s | 300 | Support plant: ordinary pea→40-damage fire pea; snow pea→ordinary pea |

The old IDs `splash` and `pierce` are retained for compatibility; their names do not describe the original Kernel-pult/Cactus mechanics. Cactus is not a projectile that pierces a series of grounded zombies. The October13 update uses the separately extracted original Winter Melon basket, stalk, and blue fruit, as well as original Potato Mine, Cherry Bomb, and Torchwood parts. See `garden-extra.json` for that artwork's pinned provenance.

### Mines, bombs and Torchwood

Pinned [Plant.cpp definitions and initialization](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L28) correct common rounded recollections: Torchwood costs175sun; Potato Mine's buried counter is1500ticks; Cherry Bomb's special counter is100ticks. [UpdatePotato](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L1143) waits for the original rise animation to finish after the buried counter. The extracted rise has19frames at18fps, giving an adapted armed time of about16.056seconds. An unarmed mine can be eaten and cannot explode.

[DoSpecial](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L4374) gives the mine a60px same-row blast and Cherry Bomb a115px blast permitting adjacent rows; the explosion routine inflicts1800damage. Browser targeting scales those source radii horizontally and uses the source row limits; it simplifies the original rectangle-distance geometry.

[Torchwood conversion](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L1378) converts normal peas to fire and snow peas to ordinary peas, once per distinct Torchwood. A second torch can ignite the thawed pea. Fire does40direct damage plus13same-row secondary splash; its reduced crowd pool is40 rather than the melon's560. A direct fire hit removes existing chill; secondary splash leaves its targets' cold intact. [Projectile.cpp](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Projectile.cpp#L15).

The original packet logic gives 30-second plants a **20-second initial recharge** and upgrade/50-second plants a **35-second initial recharge** outside Survival. Repeat recharge ends when the counter exceeds the threshold, introducing a possible 10 ms boundary difference. The shared catalog records nominal counter durations, with `initialRecharge` separately available. [SeedPacket::SetPacketType / Update](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/SeedPacket.cpp#L1105).

### Firing pace and bursts

[Plant::UpdateShooter](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L936) resets the launch counter to the plant's rate minus `Rand(15)`. The [integer random generator](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/SexyAppFramework/misc/MTRand.cpp#L168) returns modulo the supplied range, so the deducted values are **0–14**, not 0–15. Consequently:

- Pea, Repeater, Threepeater, Snow Pea, Gatling and Cactus: **136–150 ticks**, or **1.36–1.50 s**, with mean **1.43 s**.
- Melon, Winter Melon and Kernel-pult: **286–300 ticks**, or **2.86–3.00 s**, with mean **2.93 s**.
- New shooters receive a randomized initial launch phase from 0 through their base rate. Target availability and wind-up animation affect the first visible shot.
- Repeater triggers at 25 ticks remaining and at counter rollover, producing the steady **0.25-second pair** across a cycle boundary. Treating this as `[0, .25]` per repeating burst preserves sustained behavior while simplifying initial phase.
- Gatling's 100-tick shooting state emits when the remaining count is 68/51/35/18: offsets **0.32/0.49/0.65/0.82 s** from wind-up start, or **0/.17/.33/.50 s** relative to the first pea. An even `.1667` gap is only a convenience summary.
- Threepeater emits at most **three peas total**, one in each valid row; top and bottom rows have two valid output rows, not three peas in every row.

Burst timing: [Plant::UpdateShooting](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L3246). Projectile damage: [Projectile definitions](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Projectile.cpp#L15). Straight peas move 3.33 original pixels per update, or **333 px/s**; lobbed projectiles follow a separate trajectory.

### Melon splash, shields and armor

Melon/Winter Melon use **80 direct damage** and integer division **80/3 = 26** per secondary target. The splash test allows rows **−1, 0, +1** and requires horizontal overlap between the projectile's rectangle and each zombie's rectangle. The melon rectangle is **x+20, width 60 px**; a plain zombie's reference collision rectangle is **x+36, width 42 px**. A neat 3×3 tile area is a teaching shorthand, not the actual collision algorithm. [Splash test and damage](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Projectile.cpp#L411), [projectile rectangle](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Projectile.cpp#L1174).

The two reconstructions disagree about crowded splash. Patoke computes the pool from `26×7=182`; the archived source's [annotated PC 1.0.0.1051 correction](https://github.com/ruslan831/PlantsVsZombies-decompilation/blob/325b2229a7225d73870bb69322eefcda3a45bf8d/Lawn/Projectile.cpp#L464) uses **80×7=560**. The shared helper selects the latter. For **N secondary targets**, excluding the direct target:

`base = floor(direct/3); pool = direct*7; total = base*N;`

When total exceeds the pool, secondary damage becomes `max(1, floor(direct*pool/(total*3)))`; otherwise it remains base. For an 80-damage melon: 21 targets →26 each, 22 targets →26 each after integer calculation, 23 targets →24 each, 100 targets →5 each. Direct damage stays80. This is damage reduction across the crowd, not a cap that ignores all but seven targets.

Melon splash damages a shield and also forwards the full hit to the helmet/body damage path. Ordinary lobbed kernel/butter bypass a held shield; they still encounter helmets. Direct pea/spike hits consume held shield HP before helmet and body, carrying only leftover damage onward. [Projectile damage flags](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Projectile.cpp#L383), [Zombie::TakeDamage](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L8045).

### Cold and butter

Snow Pea and Winter Melon apply **1,000 ticks =10 s** of chill. It refreshes duration without stacking a stronger slowdown. Ordinary animated ground walkers use **half animation rate**, so both their ground-driven movement and chewing are halved. The low-level `CHILLED_SPEED_FACTOR=.4` is used for direct/fallback movement and target-leading calculations; applying it indiscriminately to the ordinary `_ground` walkers is inaccurate. [ApplyChill](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L7585), [ApplyAnimRate](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L6684), [walking](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L4099). A shield that absorbs an ordinary snow pea completely does not pass cold to the helmet/body path.

Kernel-pult chooses butter with **1/4 probability**. Butter does **40 damage** and immobilizes a susceptible headed zombie for **400 ticks =4 s**; ordinary kernels do20. Butter is a stop, not a temporary fast/slow style change. [Kernel choice](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L784), [ApplyButter](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L8606).

## Zombie identity, health and movement

Damage never changes a zombie into a different archetype. Its original body identity persists; helmets/shields crack and disappear separately. The body drops an arm below **2/3 max HP**, and its head below **1/3 max HP**. A headless body cannot chew and randomly loses 1 HP per tick with probability1/5 (3 HP for bodies initially at least500 HP), until its remaining body HP is depleted. Smooth 20/60-DPS decay is only an expected-rate browser approximation. [Damage states](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L3887), [headless decay](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L4659), [chewing](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L6907).

| ID | Body HP | Helmet HP | Shield HP | Nominal `mVelX`, px/tick | Reconstructed mean speed, px/s |
| --- | ---: | ---: | ---: | --- | ---: |
| `walker` | 270 | 0 | 0 | .23–.37 | 14.41 |
| `flag` | 270 | 0 | 0 | .45 | 21.61 |
| `cone` | 270 | 370 | 0 | .23–.37 | 14.41 |
| `bucket` | 270 | 1100 | 0 | .23–.37 | 14.41 |
| `football` | 270 | 1400 | 0 | .66–.68 | 32.58 |
| `newspaper` | 270 | 0 | 150 paper | .23–.37; .89–.91 after paper loss | 14.41;43.22 enraged |
| `pole` | 500 | 0 | 0 | .66–.68 before vault; .23–.37 after | 32.36;14.42 |

All listed ordinary chewers inflict **4 damage every4 ticks =100 HP/s**. Chilled chewers wait8 ticks, giving50 HP/s. [Zombie.h constants](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.h#L29), [initializer](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L181).

Speed is especially easy to misread. Grounded originals move using a `_ground` animation track, not simply `mVelX×100`. The shared `speed` is a **derived cycle average**, `mVelX×47×N/(N−1)`, from the source animation-rate and track-velocity formulas for ordinary looping clips. Original clip lengths are47 for normal/newspaper,30 for football,37 for pole run and45 for pole walk. Instantaneous original speed varies over the gait; the browser's constant mean is a disclosed simplification. [UpdateAnimSpeed](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Zombie.cpp#L6696), [GetTrackVelocity and frame selection](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Sexy.TodLib/Reanimator.cpp#L1188).

Patoke's default random upper bound is.32. The archived source has an [explicit retail-binary comparison note selecting.37](https://github.com/ruslan831/PlantsVsZombies-decompilation/blob/325b2229a7225d73870bb69322eefcda3a45bf8d/Lawn/Zombie.cpp#L1147); this catalog selects.37 and retains the source discrepancy. Newspaper retains a separate paper shield; after loss, its 13-frame gasp at8fps precedes its enraged walk. Pole vaulting is a one-use action blocked by Tall-nut; a mode that lacks the vault action should omit that zombie rather than silently substitute ordinary walking.

## Sun, waves and lawnmowers

Sun tokens are **25 units**. Original normal starting sun is50; tutorial/challenge modes have exceptions. Sunflower initial production counter is3–12.5s, subsequent23.5–25s. Sky sun first arrives4.25–7s; later spacing is `(min(950,425+fallenCount*10)+Rand(275))/100` seconds. [Sunflower production](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Plant.cpp#L999), [sun value](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Coin.cpp#L1301), [starting sun/sky initialization](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Board.cpp#L1436), [sky spawning](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Board.cpp#L5430).

Reference wave counters normally start at18s, then25–30.99s; later waves may accelerate after more than4s when remaining wave HP falls below a selected50–65% threshold, leaving2s. Flag waves add a7.5s warning sequence. The shared file supplies these reference counters, not a full campaign wave list. [GameConstants.h](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/GameConstants.h), [Board::UpdateZombieSpawning](https://github.com/Patoke/re-plants-vs-zombies/blob/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn/Board.cpp#L5558).

Each row has one single-use mower as its last defense. The browser mower uses the connected original parts in `garden-mower.json`. Mower activation, sweeping, and mower kills are silent in the October13 browser update. Picker activation timing, normalized travel speed, and eligibility are application rules. A subsequent breach after that row's mower is spent can reach the protected person or home.

### Browser level schedules and playback

The default playable mode retains48 zombies in three authored waves: nine starting at30seconds, fifteen starting at155seconds, and twenty-four starting at295seconds. The first two waves introduce one ordinary walker per row before stronger equipment. The final wave arrives in groups of five (last group four),27seconds apart, so every row faces simultaneous pressure. These compositions are application choices; original unit HP, damage, firing cadence and source-derived movement averages are retained.

The toolbar also offers Endless Survival. Wave targets are5,50,100,200,400,800 and continue doubling. A new wave begins only after the previous target has entirely spawned and all surviving zombies are defeated. Groups grow from5 to25; stronger mixtures add cones, buckets, newspapers, pole vaulters and football zombies. There are at most120 living zombies at once. Excess zombies remain in an implicit queue, so a full arena delays spawning without discarding any of the wave's target. This mode ends on a breach and has no victory condition or classroom-speaker history.

Playback speed0.5ז8× scales elapsed simulation time. It does not multiply HP, damage, cadence, costs, or movement constants, and it does not draw extra combat randomness. Paused and hidden games do not catch up old wall time. Sun collection uses a bounded original synthesized ascending chime instead of the coin-pickup sample; Gatling emits a short four-pulse rattle accompanying its original four-pea burst. Both sounds obey mute, pause, reset and destruction.

## Explicit application extensions

- `fire`, `laser`, `thorn`, and `chestnut` are custom picker additions, not classical PvZ1 plant types. PvZ1 fire peas are produced by Torchwood converting an ordinary pea, not by a Fire Peashooter seed.
- Children/avatar selection, player names, per-person lanes, last-hit loot,100 item IDs, automatic sun-based recruitment, power-level upgrades, randomized opponent combinations, winner selection and reset are classroom-picker rules.
- Picker Wall-nut/Tall-nut may deliberately use shortened HP pools1200/1800 to finish a speaker-selection round. Their catalog `sourceHp` remains4000/8000, and the playable lawn mode uses the classical HP values.
- Five botanical damage stages, red plant sap, recoil and composite limb effects are custom animation treatment. Original Wall-nut/Tall-nut cracked textures use thresholds2/3 and1/3 rather than five unique stock Peashooter damage sprites.
- Both browser engines use a readable three-row splash area with a1.5-tile horizontal radius. The original horizontal hitbox algorithm above is documented as reference rather than reproduced exactly. Source damage and the selected crowd formula are retained.
- The browser lawn mode supplies a finite custom wave schedule, available seed selection, and user interface. It should describe itself as a playable classic-style adaptation and should not imply the whole original50-level game is present.

## Shared API

`GARDEN_RULES` is an immutable object. `CLASSIC_PLANTS` and `CLASSIC_ZOMBIES` are immutable arrays; `PLANT_BY_ID` and `ZOMBIE_BY_ID` are immutable lookup objects. `getSplashDamage(directDamage, secondaryTargetCount, fireball=false)` implements the selected integer crowd calculation. `getGroundSpeedPxPerSecond(nominalVelocityPerTick, frameCount)` returns the disclosed reconstructed mean. Durations use seconds, raw reference counters end in `Ticks`, and speed uses original lawn pixels/second. Both engines should scale speeds by their displayed tile width rather than reinterpret them as tile/second values.
