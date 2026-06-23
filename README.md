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
