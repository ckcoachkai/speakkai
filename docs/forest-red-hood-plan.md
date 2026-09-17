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
Ten times refers to image area, not ten times its height (which would dwarf the entire viewport). The wolf uses a 2D joint rig and procedural fur/cloth. Existing recorded character dialogue is retained.
