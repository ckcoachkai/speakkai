# Injury variation catalog

210 authored, timed contact-feedback recipes: 21 for each of the ten rooms. Every recipe has two or three ordered visual/body-response beats, changing supported body response, affected body region and particle trajectory. All 210 effective step signatures are distinct even when hazard, name, color and tiny numeric parameters are excluded. There is no Cartesian-product expansion or random label counting.

These are **210 effect recipes, not 210 separately motion-captured animations or death cinematics**. They reuse ten supported character reactions and 22 spatial effect primitives. The variation is in visible ordered composition: for example a left-palm electrical arc followed by a chest shudder is different from a heel discharge followed by a stumbling foot trail. Hazard-specific particle geometry and physics further differentiate the rooms.

Impact, collapse, rat, spike and laser contacts add fictional blood jets/droplets and ground splats. Severe heat/electric/gas contacts can add smaller bloody accents. The independent boiler fatal ash/spirit cinematic is not triggered or counted here. This engine ignores fatal/dead events, permanent guest and dead actors.

Budget: 192 particles globally, eight active sequences, at most eleven instanced effect draws (usually one or two). Per-actor 1.85-second cooldown. A shuffled per-room bag avoids repeating any of its 21 recipes until the bag is exhausted. Reduced motion uses small three-fleck cues and no additional body jolts/blood sprays. Disabling effects clears particles and pending sequences immediately. Pause freezes timers. Reset clears effects but preserves bag progress.

Source tests: verification/injury-variations-source.mjs. Browser integration/visual validation is additionally required before publication.
