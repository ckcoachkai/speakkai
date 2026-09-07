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

## Editing the Fall course in two languages (V11)

Open **Fall course — English & Chinese** from the local CMS dashboard. As of V18 it contains nine narrative fields in each language: introduction, topic purpose, role purpose, feedback introduction, fictional story opening, fictional story ending, illustrative quote, retry description and parent guidance. Edit the matching fields together, record the translation review date and add a non-sensitive source/review note.

Saving updates `src/content/flagship/course-editorial.json` locally. It does not publish. Preview both course routes and review the diff before deployment. This is an editorial form, not an automatic translation or factual-accuracy checker.

Course numbers, season, grade range, programme name, sequence, themes/roles, contact details, fees/availability boundaries and metadata remain outside this form. Request a separately reviewed source update when the actual course scope changes. Do not add new scope, prices, credentials or results to narrative fields as a workaround.

Required fields are limited to 10–700 characters. The build rejects missing language fields, invalid review dates and absent source notes. `npm run check:course-editorial` verifies all eighteen public fields against the content file, confirms that the first attempt and retry use identical story wording with a pause cue only in the retry, and checks that the editor-only note is absent from generated HTML, JavaScript, JSON, XML and source maps. Language/fact parity and privacy checks remain required.

Verified: a paired temporary introduction edit was saved in the real CMS, survived editor reload and appeared in both Astro-rendered pages. Both original introductions were then restored through the editor and verified in the production build. This test did not modify or publish course scope.

## Review the pause example as a pair (V18)

Keep the opening and final sentence short and fictional. The template reuses both sentences, inserts a pause cue before the ending on the retry, and explains that the cue is not spoken. Edit the story in English and Chinese together: same object, same event, same reason it matters. Check that the coach's feedback and the listener question still fit. The checker verifies structure and presence; it does not judge translation, age suitability, factual accuracy or pedagogy.

Verified in V18: a temporary red-to-blue kite change was saved in both language fields, survived CMS reload and appeared twice in each development page. Both fields were restored to red through the CMS; source and production content checks confirmed the intended final wording. Agent language review is recorded separately from real parent or independent professional translation research.
