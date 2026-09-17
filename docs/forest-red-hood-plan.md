# Little Red Riding Hoods versus the Big Bad Wolf

## Direction
Keep the existing painted forest, children, editable roster, voices and unbiased selection. Give every child a red hood with an open face and a long, shaded cape. Children bounce toward a towering wolf and punch it at the finish; nobody disappears into its mouth.

## Production approach
Use the existing high-resolution painted wolf as texture for a hierarchical Canvas rig. Blender, Unreal, Adobe and HyperFrames were considered: a rendered movie would not respond to runner timing, roster changes or pause. This implementation uses runtime artwork deformation and layered joints, not a claim of a fully simulated anatomical skeleton or offline cloth simulation.

1. Increase wolf width and height by sqrt(10), giving exactly ten times its world-space image area. Expand camera framing to keep the full creature visible. Preserve children's world-space size.
2. Separate torso, head, ears, jaw, tail, upper/lower arms, wrists, thighs, shins and paws. Add breathing, secondary joint motion and layered moving fur strands.
3. Draw red capes with a segmented cloth mesh and five blended motion states: idle flutter, run billow, rising lift, apex curl and falling ripple. Use runner velocity and phase; keep the existing faces visible through red hoods.
4. Schedule short twin eye-laser bursts and drifting radial webs behind the wolf. Reduced motion suppresses lasers and reduces secondary movement. Pause freezes the scene animation.
5. Preserve the chosen child's scale and opacity. Extend its arm toward the wolf, play the existing five crunches and recoil the head on each beat. Delay the result overlay until the visible encounter ends.
6. Verify a full round, subsequent round, reset, pause/resume, gentle motion, other hosts, desktop/mobile layout, browser errors and build checks. Prepare a local preview before publication.

## Scope boundaries
Ten times refers to image area, not ten times its height (which would dwarf the entire viewport). Characters retain painted 2D artwork. Existing recorded character dialogue is retained.

## Physical animation refinement
The wolf now receives five angular impulses at the crunch beats. A damped spring hinge folds its head backward to a 180-degree stop, then restores it upright; gentle mode limits recoil to 0.18 radians. The body remains planted. Ninety-six damped fur springs bias tufts upward for the charged cartoon look.

Each child's cape uses 80 particles in three dimensions, with a pinned neckline, structural/shear/bending constraints, gravity, wind and jump acceleration. Smooth curved panels and depth shading soften the silhouette. This is simplified real-time physics, not a fully 3D character or self-colliding cloth simulation. Other bosses retain their individual head recoil, with the shared physical capes.

## Extension to the complete boss roster

The follow-up request applies the same treatment to all nine other hosts: cat, rabbit, monkey, parrot, sock, Queen Elizabeth II, Elton John, Trump, and koala. Each uses its existing painted artwork with character-specific shoulder/elbow/wrist, hip/knee/ankle and neck landmarks. A continuous deforming image mesh avoids gaps between separately cut body pieces. Tail, ear, hat, tie, coat, hair and feather motion varies by character. All ten bosses share enlarged framing, eye-anchored lasers, rear webs, full-sized Red Hood runners, five crunch punches and independent head recoil.

Validate every boss through a complete selection encounter, check effect placement visually, and verify pause freezes the rendered canvas. Keep the existing public-figure parody disclosure and voice assets.
