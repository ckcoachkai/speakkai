# Editing practice lessons

V06 uses Keystatic in local mode. It is a real form editor that writes repository files. It does not provide a public login or remote team editing.

1. In this website checkout, use Node 24 and the pnpm version declared in package.json. Run `pnpm install --frozen-lockfile` if dependencies are missing.
2. Run `npm run cms`, then open `http://127.0.0.1:4326/keystatic` on the same computer.
3. Open Practice lessons, then an existing lesson or Add. Keep an existing URL slug unchanged unless you also plan its redirect and link updates.
4. Edit the title, introduction, audience, practice setting, materials, step instructions, prompts and listener guidance. Choose the related coaching path so the lesson links to the right audience. Step minutes must add up to the total. Required length limits and totals are validated by the website build.
5. Keep unpublished work unchecked. Include in the next public release controls the page, resource listing and sitemap. Save writes `src/content/practice/<slug>.json` locally; it does not publish.
6. Read the preview, use the complete guide and print preview, and inspect the repository diff. Run `npm run build`, `npm run check:practice-content`, the flagship/SEO checks and schedule privacy check before the release.
7. Publish through the existing reviewed GitHub Pages release process. Verify the public version and affected routes after the workflow succeeds.

The source/review note is editorial only and is tested for exclusion from public files. This is not a place for private student or account data: repository files have their own visibility and history. Use source references and review decisions without sensitive information. No testimonial, partner, credential or result should be added without an attributable, publishable source.

The public guide receives only the lesson title and steps. Every published lesson also has its entire static printable content. No recording, score, saved progress or automatic audio is involved.

## Verified V06 behavior

The local form read the existing JSON, saved a temporary introduction sentence, and Astro rendered that exact sentence. The original was restored through the form. A temporary unpublished fixture was absent from the page output, resource list and sitemap; editor notes were absent from public HTML/JS/JSON/XML. The fixture was removed after testing.

## Maintenance notes

The pinned Keystatic integration adds routes only in `astro:config:setup`. The wrapper invokes that hook only for an explicitly enabled development server; public builds omit it, even if the launcher environment is inherited. Recheck that assumption if updating the integration.

Its generated dependency scan includes the server API. `vite.optimizeDeps.exclude` keeps that API out of browser prebundling so Astro can resolve `astro:env/server` normally. The editor has a separate Vite cache so an `astro check` or build cannot replace the development JSX runtime with a production cache. Do not remove these settings without testing editor startup, a real save, guide hydration and a public build.
