# Dynamite Mice v9 verification

5 October 2026. V9 adds four fictional alien organs, persistent labels for the latest fourteen named fragments, and faster-to-slower mouse bug passing.

## Gameplay

Every mouse contributes its current simulation slice's swept movement segments before contact is resolved. The faster mouse passes every attached ground insect and all logical lice, including lice whose display records have been retired. Equal speeds do not transfer. Walls block contact; a pair must separate and complete its cooldown before passing again. Wounds stay with their original mouse. Transferred insects can exceed the ordinary 12-insect attachment limit; exact counts/types are retained while damage remains capped.

Independent transfer review: **25/25 passed**, including movement, crossing paths, ties, walls, pause/selection/drag guards, separation/cooldown, conservation, damage limits, retained lice, determinism and an 80-mouse sample. The existing engine suite passes **105/105** and click/drag regression passes **4/4**. The packaged gate uses actual game.update() calls for equal-speed and faster-speed encounters. Renderer, effects and audio checks also pass.

A controlled browser encounter transferred five insect species and fifteen logical lice: donor counts became zero, recipient counts became five and fifteen, original damage remained 0.4 on the donor and zero on the recipient, and the bounded transfer effect appeared. This fixture is separate from the natural timed-round test.

## Presentation

The transparent 2-by-2 atlas contains a nebula gland, void bladder, echo core and plasma sac. Every alien label starts with ALIEN. The latest impact retains fourteen labels in two side rails, with leader lines to fragments or viewport-edge indicators. Chromium verified all fourteen at overview, 8x zoom, with fragments offscreen, in fullscreen, under reduced motion, and at 320px/375px viewport widths. Gore Off draws zero anatomy labels.

Phone speaker holds use a taller stage and move the card below the labels. All fourteen labels and Continue remain visible without horizontal overflow. Continue restores the normal stage height. Canvas-bound checks account for CSS scaling below its internal 320px rendering width.

The custom artwork gallery and desktop/phone screenshots were inspected. Art is illustrative game artwork, with deliberately fictional alien pieces; it is not a textbook anatomy reference.

## Build and release

All six package gates cover public and dist: source/media parity, regressions, bomb, v7, v8 and v9. The full Astro check/build passes. The media manifest contains 21 image atlases and the supplied Mouse Maze Mayhem song: 22 media files, 13,844,438 bytes. A natural local-browser round selected once at exactly 30 game seconds and paused the soundtrack.

The final deployment receipt, live page/media hash verification and performance figures are recorded in the workspace's work/mouse-maze/v9-qa folder after publication. Publishing success must be confirmed separately from build success.

## Limits

Physical touch/haptics, screen readers and Firefox/Safari were not tested. Performance measurements describe local Chromium and are not guarantees for every device. The previous v8 release remains available as a standalone file and commit 6b1ced923358098344d5ab7a3d63a0ad0727fecc; rollback should revert only the v9 maze commit on current main, preserving unrelated website changes.
