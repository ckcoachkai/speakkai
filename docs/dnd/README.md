# Bob’s Character Chronicle

Canonical route: `/DND/`. The production build adds `/dnd/` as a redirect on case-sensitive hosts.

## Current implementation

- Original June 17, 2026 Bob: Dragonborn Paladin 1, Noble, Chaotic Neutral; 6/11 HP; AC 16; STR 17, DEX 12, CON 13, INT 8, WIS 10, CHA 14.
- Identity and combat cells, all 18 skills and six saving throws, dynamic proficiency/modifiers/attacks, death saves, inspiration, Divine Sense, Lay on Hands, breath weapon, rest counters with undo.
- Spell library, custom spells, preparation and concentration tracking, 2014 Paladin slot progression through level 20. No spells claimed at level 1.
- Inventory table with quantity, individual weight, notes and add/remove rows; gold, languages, proficiencies; personality, notes, XP, extensible custom fields.
- Read-only entry; explicit edit/save/discard; encrypted local notebook; encrypted JSON export/restore; plaintext character export when viewing the public sheet.
- Local encryption: PBKDF2-SHA256 with 600,000 iterations, random 16-byte salt, AES-GCM-256, fresh 12-byte IV for each save. Password/key retained only for the unlocked in-memory session. Reload locks the notebook. Passwords cannot be recovered. Clearing browser data removes local saves; exported backups are portable.
- Local edits do not update the public sheet. The interface states this at creation and labels storage state throughout.

## Cloud adapter

`src/lib/dnd/cloud.ts` uses Supabase Auth password sign-in and PostgREST. All public writes must be refused by RLS; only the explicitly provisioned owner can update `data`. Owner and version columns cannot be written by the client. Updates filter on the previously read version, and a database trigger increments it to reject stale edits.

Build environment: `PUBLIC_DND_SUPABASE_URL`, `PUBLIC_DND_SUPABASE_KEY` (publishable key only). Never use a service-role key. Sessions stay in memory and must be renewed on expiry. No signup/claim-Bob endpoint is exposed.

`cloud-schema.sql` is a reviewed setup proposal, not evidence of deployment. Provisioning requires a confirmed project, an owner in Supabase Auth, a seeded Bob row, and live RLS tests. Supabase connector initially needed reauthentication, then reported unknown tool after reconnection; dashboard setup is being completed separately.

## Data provenance

Source: original photographed sheet `IMG_20260617_215504.jpg` and ChatGPT conversation https://chatgpt.com/c/6a32aba7-8794-83ee-a07d-7d3b00c77e8d, which contains `Bob_DnD_Character_Sheet.xlsx`.

The paper sheet records 120 gp together with equipment. Preserve the DM-check note; never silently add the Noble’s 25 gp. The backup martial weapon is unconfirmed. Bonds were blank. XP 0 and full resource counters are starting placeholders, explicitly noted. Zero equipment weight denotes unrecorded weight. Maximum HP and resource pools require review when leveling. Formulae assume single-class 2014 Paladin / 2014 Dragonborn; the app is not a multiclass rules engine.

## Portrait

Built-in ImageGen, original generation. Production asset: `public/dnd/bob-paladin.webp` (768×1152, 205 KB). Original retained at `C:/Users/kai/.codex/generated_images/01a09a0e-5d74-7980-8f5a-60e691aaa184/exec-508ff337-e2a7-45a8-b6e3-f7377ac30c7d.png`.

Prompt: “Use case: stylized-concept. Create an original premium fantasy character portrait for a D&D character sheet web app. Bob is a male Dragonborn paladin, noble background, a powerful frontline warrior with draconic face, horns, warm bronze-red scales and ember eyes. Wearing practical chain mail with restrained ivory cloth and antique gold detailing. Holding a large two-handed greatsword, no shield. Heroic and approachable, quiet confidence, detailed painterly realism, rich tactile steel and scale textures. Vertical 2:3 composition, waist-up, head and horns fully in frame; cinematic warm rim light, atmospheric dark blue cathedral-like stone backdrop, subtle sparks hinting at fire breath. Strong readable silhouette, elegant collectible fantasy book-cover quality. No text, no logos, no watermark.”

## Verification

- `node node_modules/astro/astro.js check` — zero errors/warnings (existing hints plus React/deprecated beforeunload compatibility hints).
- `node --test scripts/check-dnd.mjs` — five tests: source/calculation boundaries; invalid imports; encryption round trip, tampering and wrong passwords; cloud version conflict handling; non-owner login rejection. Cloud tests use mock HTTP and do not prove live RLS.
- Browser on localhost: create disposable notebook, edit STR 17→18, HP 6→9, level 1→2, spend a spell slot, add and prepare Bless, save, reload, reject wrong password, unlock and recover edits. This does not alter production Bob.
- Desktop portrait/layout inspected. At 390 CSS pixels, document width equals viewport width with no horizontal page overflow. Mobile layout inspected; physical devices and other browser engines remain unverified.
- Production build: 63 pages. Generated Bob client chunk ~42 KB before gzip, portrait ~205 KB.

Use `node node_modules/astro/astro.js dev --host 127.0.0.1 --port 4338` for local preview. This worktree reuses dependencies via a junction; do not run a package-manager install against the junction or purge its target. Use direct Astro commands here, or install isolated dependencies first.

Rollback: revert only the Bob app commit(s), retaining unrelated schedule/site commits and the database backup. Never remove cloud data as part of a frontend rollback.
