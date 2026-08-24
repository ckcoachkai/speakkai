# SpeakKai

Astro website for `speakkai.com`, prepared for GitHub Pages and Porkbun DNS.

## Local setup

Install Node.js, then run:

```powershell
npm install
npm run dev
```

## Publish to GitHub Pages

1. Create a GitHub repository for this site.
2. Push this folder to the repository's `main` branch.
3. In GitHub, open `Settings` -> `Pages`.
4. Set `Source` to `GitHub Actions`.
5. After the first successful deploy, set the custom domain to `speakkai.com`.

The `public/CNAME` file keeps the custom domain attached during future deploys.

## Google Sheet schedule mirror

The availability calendar is published at `https://speakkai.com/schedule/`.
GitHub Actions refreshes it every day at 08:15 Asia/Shanghai, as well as after
a push to `main` or a manual workflow run. The browser-facing page reads only
the generated `/data/schedule.json` file and never connects to Google.

The sync deliberately converts every occupied calendar cell to either
`Limited availability` or `Unavailable`. Timed entries retain a normalized time
and one approved concise cue, such as `09:30–12:15 · SAS`. The only permitted
cues are `SAS`, `龙柏班课`, `JH班课`, `TMC`, the explicitly approved name `Claire`,
and the safe fallbacks `Coaching` or `Reserved time`. Long descriptions,
locations, contact details, notes, and unapproved names are not written to the
public JSON. A separate deployment check rejects any generated file that does
not match this concise-label schema.

The workflow discovers published tabs named in English as `Month YYYY`, starting
with `July 2026`, and mirrors only those month tabs. Summary, entry, notes, and
other working tabs are excluded from the website payload. Comments, cell notes,
and Google account credentials are not written to the public file.

Google publishing setup:

1. In Google Sheets, use `File` -> `Share` -> `Publish to web`.
2. Publish only the month tabs that are approved for public display. Name each
   one in English as `Month YYYY` so the workflow can discover it.
3. Keep `Automatically republish when changes are made` enabled.
4. The published workbook URL and earliest public month are configured in
   `.github/workflows/deploy.yml`; no Google account key is required.
5. Run the Pages workflow manually once, then verify `/schedule/`.

The selected schedule feeds and the resulting mirror are public. Google Sheets
publication settings control whether any other tabs are accessible through
Google itself, so keep private working tabs out of the published selection.

Google Calendar is reconciled by a separate daily Codex automation. This Pages
workflow intentionally contains no Calendar credentials.

## Porkbun DNS for `speakkai.com`

In Porkbun, you can use Quick DNS for GitHub Pages if it is available. If you set the records manually, use these.

For the apex domain, create these `A` records:

```text
@ 185.199.108.153
@ 185.199.109.153
@ 185.199.110.153
@ 185.199.111.153
```

Also create these `AAAA` records:

```text
@ 2606:50c0:8000::153
@ 2606:50c0:8001::153
@ 2606:50c0:8002::153
@ 2606:50c0:8003::153
```

For `www`, create this `CNAME` record:

```text
www <your-github-username>.github.io
```

After DNS propagates, return to GitHub Pages and enable `Enforce HTTPS`.
