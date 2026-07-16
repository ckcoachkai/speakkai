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

The view-only schedule is published at `https://speakkai.com/schedule/`. GitHub
Actions refreshes it every 15 minutes. The browser-facing page reads only the
generated `/data/schedule.json` file and never connects to Google.

The workflow mirrors only the separately published `July 2026` and `August
2026` sheet feeds. Other spreadsheet tabs remain private. Comments, notes, and
Google account credentials are not written to the public file.

Google publishing setup:

1. In Google Sheets, use `File` -> `Share` -> `Publish to web`.
2. Publish only `July 2026` and `August 2026` as CSV feeds, not the entire
   document.
3. Keep `Automatically republish when changes are made` enabled.
4. The two generated public CSV feeds are configured in
   `.github/workflows/deploy.yml`; no Google account key is required.
5. Run the Pages workflow manually once, then verify `/schedule/`.

The selected schedule feeds and the resulting mirror are public. All other tabs
remain private.

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
