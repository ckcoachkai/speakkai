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

The workflow mirrors only sheet tab IDs `260607` and `260608`. Hidden rows and
columns are excluded. Formulas, comments, notes, and Google credentials are not
written to the public file.

One-time Google setup:

1. Create or select a Google Cloud project and enable the Google Sheets API.
2. Create a service account and download its JSON key.
3. Share the source spreadsheet with the service account's `client_email` as a
   viewer.
4. Add the complete JSON key to the GitHub Actions secret
   `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. Add the spreadsheet ID to the GitHub Actions secret `GOOGLE_SHEET_ID`.
6. Run the Pages workflow manually once, then verify `/schedule/`.

The source spreadsheet remains private. Do not commit the service account JSON
or place it in `public/`.

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
