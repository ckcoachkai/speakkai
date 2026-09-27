# Imported animated bosses

User requested these two existing animations on September 27, 2026.

- Cow: task `01a0e0fd-23a3-7f43-8132-c6744661b5e5`, Create looping cow ladder animation, original `outputs/oh-no-cow.svg`.
- Pelican: task `01a0c7d5-24f8-7f43-a0e9-b9b0b54732e5`, Create pelican bicycle animation, original `HQ/outputs/pelican-coastal-ride/index.html`. The other same-title task later became a public-speaking animation.

Original vector source and limb motion are retained here. Bake with
`python scripts/build-forest-svg-bosses.py`, then `node scripts/render-forest-svg-bosses.mjs`.
Each boss has 36 transparent frames synchronized to the pausable game clock.
The cow climbs in place over scrolling ladder rungs so it stays reachable by the students;
the truck remains below it. The pelican retains its bicycle, pedaling, rotating spokes and scarf.
During encounters the original loop holds a reference pose while the common game rig supplies
targeted hit reactions, dance motion and hand props. Both use the existing music and effects,
with 20 original text-only jokes each and no spoken dialogue.
