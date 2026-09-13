# Bob character publishing

The versioned character record is maintained in the private repository https://github.com/ckcoachkai/bob-the-paladin.

The local checkout at setup is `C:/Users/kai/Documents/ChatGPT/Bob-the-Paladin`. See its `AGENTS.md` and README for the update workflow. `character.json` is the source of the approved published character, with an Excel workbook and portrait alongside it. Run its sync script to update the seed in `src/lib/dnd/character.ts`, `public/dnd/character.json`, and the downloadable `public/dnd/Bob_the_Paladin.xlsx` together.

The published page is https://speakkai.com/DND/. The lowercase route is also supported. Run the DND tests and the normal site build before publishing. Verify the Pages deployment and compare the live JSON with the approved repository record.

Password-protected browser notebooks are separate. The **Export for GitHub** button downloads the currently displayed character as readable JSON for a reviewed repository update; it does not send credentials or push to GitHub. Never overwrite a user's encrypted notebook to match the published seed. Supabase is not configured.

The September 13, 2026 level 2 update retains current HP 15/20, sets chain-mail AC 16 and two available hit dice, raises Lay on Hands to 10/10, prepares Command/Purify Food and Drink/Bless, and adds Great Weapon Fighting and Divine Smite. XP remains unrecorded (0 placeholder), not assumed to be earned XP.
