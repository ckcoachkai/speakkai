# Adult cinematic finisher effects

`createFinisherEffects({scene,room})` is a visual-only module. Call `emit(actor,{scenarioId})` once on confirmed elimination, before hiding the actor. It snapshots the actor position and never changes the real rig, health or outcome. Call `update(dt,game)` per frame. Reset on roster/scenario change; dispose on teardown. Tie `setEnabled` to the effects checkbox and optional `setBloodEnabled` to a separate blood control.

Wait for both `stats.active === 0` and `stats.sequences === 0` before showing the result overlay. The three stages start at 0, 0.38 and 0.83 seconds; effects finish within approximately 2.9 seconds. Boiler returns `boiler-delegated` and creates nothing, preserving the existing ghost/portal/flame cinematic.

Nine distinct compositions: crushing inward compression/horizontal blast; spikes vertical fountain/falling rain; lasers three sequential cutting planes; rats inward swarm/outward recoil; electricity conductive helix/angular discharge; freeze shell/shards/ground crystals; flood rising red bubbles/water crown/ripples; gas directed cough jet/descending haze; collapse falling rubble/impact corona/dust. These are stylized primitive-particle cinematics, not realistic body slicing or severed-limb animation.

Global cap 256 particles, four simultaneous sequences, nine instanced effect meshes (normally one or two active). Repeat actor emissions are rejected until reset. Invincible guests are always excluded. Reduced motion replaces each sequence with six gentle nonblood cues. Pause freezes time, effects off clears all particles, blood off immediately removes red particles, reset releases sequence references, dispose releases GPU resources.

`node verification/finisher-effects-test.mjs` verifies every room, distinct timed spatial signatures, caps, immunity, toggles, pause, reduced motion, cleanup and disposal. Browser integrated visual acceptance remains the coordinator's deployment test.
