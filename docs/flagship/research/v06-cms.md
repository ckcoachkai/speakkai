# V6 CMS implementation note: Keystatic local mode on Astro 5

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Minimal, local-only Keystatic setup for the existing Astro 5.18 static site. Public production remains static on GitHub Pages; no OAuth, hosted CMS, account, or checkout was used.

## Recommendation

Use Keystatic `local` storage during development. It gives Kai a real schema-driven editing UI at `/keystatic` while writing actual JSON/content files in the repository. The production GitHub Pages build must omit the admin integration with the documented `SKIP_KEYSTATIC=true` condition. This keeps authoring local and reviewable through Git diff/PR while keeping the public output static.

The current npm metadata for [`@keystatic/astro`](https://registry.npmjs.org/@keystatic%2fastro/latest) reports version `6.0.0` with peer support for `astro: 5 || 6 || 7`, `react: ^18.2.0 || ^19.0.0`, and `react-dom: ^18.2.0 || ^19.0.0`. That is direct package-level evidence that Astro 5 is in the declared peer range. It does not prove compatibility with this exact repository until the project installs the package and runs its existing checks.

## Minimal install/config shape

[Keystatic’s Astro guide](https://keystatic.com/docs/installation-astro) documents installing `@keystatic/core` and `@keystatic/astro`, adding the Keystatic Astro integration, and creating `keystatic.config.ts`. Adapt the guide to pnpm and keep the existing Astro integrations:

```powershell
pnpm add @keystatic/core @keystatic/astro
```

```ts
// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core'

export default config({
  storage: { kind: 'local' },
  collections: {
    practice: collection({
      label: 'Practice lessons',
      path: 'src/content/practice/*',
      slugField: 'title',
      format: { data: 'json' },
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: { label: 'URL slug' },
        }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        bullets: fields.array(
          fields.text({ label: 'Bullet' }),
          { label: 'Key points', itemLabel: (props) => props.value }
        ),
      },
    }),
  },
})
```

The exact field behaviors above are documented by [Slug field](https://keystatic.com/docs/fields/slug), [Array field](https://keystatic.com/docs/fields/array), and [Format options](https://keystatic.com/docs/format-options):

- `fields.slug` gives a title input plus an editable URL-friendly slug.
- `slugField: 'title'` makes the collection use that slug field for entry paths.
- `fields.array` accepts one child field; an object child can represent richer repeated items. `itemLabel` makes the editor list meaningful.
- In this checkout, `path: 'src/content/practice/*'` plus the content loader's `pattern: '*.json'` produces one file per slug, for example `src/content/practice/one-object-story.json`. The observed layout is therefore `src/content/practice/<slug>.json`; do not infer an `index.json` directory layout from the generic format documentation.

For a first slice, keep one small collection and add only fields the public page actually renders. Add an object array later if a repeated item needs multiple properties:

```ts
proof: fields.array(
  fields.object({
    label: fields.text({ label: 'Label' }),
    detail: fields.text({ label: 'Detail', multiline: true }),
  }),
  {
    label: 'Proof points',
    itemLabel: (props) => props.fields.label.value,
  }
)
```

Do not add private student recordings, calendar event text, or unsupported claims to this public collection. Content fields should include audience, language, last-reviewed date, and consent/reference status if they will influence what gets published.

## Astro integration and production exclusion

The official guide’s integration example imports `keystatic` from `@keystatic/astro` and adds `keystatic()` to `integrations`. The project should preserve existing integrations and conditionally append Keystatic:

```js
// astro.config.mjs (adapt existing config; do not replace other integrations)
import keystatic from '@keystatic/astro'

export default defineConfig({
  // ...existing config
  integrations: [
    // ...existing integrations
    ...(process.env.SKIP_KEYSTATIC === 'true' ? [] : [keystatic()]),
  ],
})
```

[Keystatic’s official Astro production recipe](https://keystatic.com/docs/recipes/astro-disable-admin-ui-in-production) uses the same conditional idea and says `SKIP_KEYSTATIC=true` prevents the admin routes from being mounted. Set that variable in the GitHub Pages build environment; leave it unset for Kai’s local dev server. Verify the generated production output contains no `/keystatic` route and that the local dev server does show the editor. The recipe’s example uses truthiness; the explicit string comparison above is a safer adaptation for CI values.

The [local-mode documentation](https://keystatic.com/docs/local-mode) says content is stored directly on the local file system. Therefore this mode is deliberately owner-local: it does not make a public editing service and does not require OAuth. A local save is a file change; publishing still occurs only through the reviewed repository build.

## React compatibility

[Astro’s official React integration guide](https://docs.astro.build/en/guides/integrations-guide/react/) documents installing `@astrojs/react` with pnpm and using React components within Astro. Current npm metadata for [`@astrojs/react`](https://registry.npmjs.org/@astrojs%2freact/latest) reports version `6.0.5`, React/React DOM peer ranges covering 17, 18, and 19, and a Node engine of `>=22.12.0`. The package metadata does not declare an Astro peer range, and the guide does not publish a clear Astro 5-to-integration-major compatibility table.

Use the project-aware command so Astro selects and records the integration in the existing lockfile:

```powershell
pnpm astro add react
```

Then verify the actual resolved versions and the existing Node runtime. If the machine/CI runtime is below Node 22.12, the current `@astrojs/react` release’s engine declaration is a compatibility blocker; choose a version supported by the project’s runtime only after testing it in an isolated branch. Do not infer compatibility from the React peer range alone. Keystatic itself requires React 18.2 or 19 according to its current package metadata, so use one of those React versions if React is added for Keystatic.

## Verification checklist for the owner

1. In a branch, install the two Keystatic packages and run the existing typecheck/build commands.
2. Start the local Astro dev server and open `/keystatic`; create one Practice lesson entry.
3. Confirm a real `src/content/practice/<slug>.json` appears and contains the expected title, summary, steps, prompts, and review fields.
4. Confirm the public lesson page reads the same JSON file and displays it.
5. Build with `SKIP_KEYSTATIC=true`; confirm the static output has no admin route and still contains the public practice lesson.
6. Review the Git diff for accidental private data, broken slugs, missing required fields, or unsupported proof.
7. Only then decide whether the practice schema is ready for more lessons or for a future hosted editor.

## V6 checkout verification and optimizer workaround

The first local CMS start reached Astro `v5.18.2` but its dependency optimizer failed with five errors. The reproduced messages were `Cannot read directory "node_modules/astro:env": The directory name is invalid` and `Could not resolve "astro:env/server"`, pointing to `@keystatic/astro/dist/keystatic-astro-api.js:2:26`. This is a Windows path interpretation during esbuild's optimize-deps scan, not evidence that Astro 5 lacks the virtual module: Astro's installed `dist/env/vite-plugin-env.js` explicitly resolves `astro:env/server`, while Keystatic's installed integration writes `.astro/keystatic-imports.js` with an `@keystatic/astro/api` import and adds that generated file to `optimizeDeps.entries`.

The narrow configuration workaround is:

```js
vite: { optimizeDeps: { exclude: ["@keystatic/astro/api"] } },
```

After restarting the local server with this exclusion, `/keystatic` returned HTTP 200, the generated optimizer metadata contained the React and Keystatic UI entries but no optimized Keystatic API bundle, and the API was served from the package's direct source path where Astro resolves `astro:env/server`. End-to-end verification also read the local tree, saved a temporary lesson edit through the UI, observed the exact text in the Astro lesson response, and restored the file. The static public build still passed. Keep this exclusion scoped to the Keystatic API; globally externalizing `astro:env/server` would leave the server virtual import unresolved.

## Learning-tool benchmark: Toastmasters Pathways

Checked 2026-09-07 against [Toastmasters' official Pathways Learning Experience page](https://www.toastmasters.org/Education/Pathways). The page calls Pathways an “interactive and flexible education program,” lists six specialized learning paths and online content available anytime and anywhere, and describes learners practicing communication and leadership skills and giving club speeches based on assignments.

The design signal for V6 is a sequenced practice path with bounded assignments, an explicit speaking attempt, and a feedback or next-attempt loop. The current `steps`, `prompts`, `listenerGuide`, `feedbackExample`, `minutes`, and `reviewedOn` fields already support that shape. A later schema revision could add an explicit level or pathway only if the public lesson set needs it; the benchmark does not justify adding complexity by itself.

The page is a provider description and design reference, not independent outcome evidence. It does not establish completion, skill transfer, measured improvement, or causal effects for SpeakKai. Keep the social component bounded: a parent, partner, or other listener can be an optional practice role, while the site should avoid implying that a short local exercise provides a class, therapy, credential, or guaranteed social-performance result.

## Uncertainty and nonclaims

- The package peer range is current npm metadata as of 2026-09-07, and this checkout verified the package with the local dev route and static build.
- Keystatic’s public Astro guide still presents an Astro v2 example; the successful Astro 5.18 local CMS run here is repository-specific evidence rather than a guarantee for every Astro 5 project.
- Current `@astrojs/react` metadata declares a Node `>=22.12.0` engine but no Astro peer range. Exact compatibility with Astro 5.18 therefore remains a test item.
- Local mode does not provide remote multi-user editing, authentication, hosted media, or approval workflow. Those require a different storage/deployment choice and are outside V6’s local-only scope.

## Source ledger

| Source | Publisher | Verified use |
|---|---|---|
| [Adding Keystatic to an Astro project](https://keystatic.com/docs/installation-astro) | Keystatic | Package names, Astro integration, local config shape, `/keystatic` dev route; guide example references Astro v2 |
| [Local mode](https://keystatic.com/docs/local-mode) | Keystatic | Local filesystem storage behavior |
| [Disable Admin UI Routes in Production](https://keystatic.com/docs/recipes/astro-disable-admin-ui-in-production) | Keystatic | `SKIP_KEYSTATIC` conditional integration pattern |
| [Slug field](https://keystatic.com/docs/fields/slug) | Keystatic | Slug/title field behavior |
| [Array field](https://keystatic.com/docs/fields/array) | Keystatic | Simple/complex arrays and `itemLabel` |
| [Format options](https://keystatic.com/docs/format-options) | Keystatic | JSON format option; this checkout was verified separately to write `src/content/practice/<slug>.json` |
| [`@keystatic/astro` npm metadata](https://registry.npmjs.org/@keystatic%2fastro/latest) | npm registry | Current version `6.0.0`; Astro `5 || 6 || 7`; React `^18.2.0 || ^19.0.0` peers |
| [React integration](https://docs.astro.build/en/guides/integrations-guide/react/) | Astro | Official pnpm integration path |
| [`@astrojs/react` npm metadata](https://registry.npmjs.org/@astrojs%2freact/latest) | npm registry | Current version `6.0.5`, React peers, Node engine |
| [Pathways Learning Experience](https://www.toastmasters.org/Education/Pathways) | Toastmasters International | Current public description of sequenced, online and practice-based communication learning; design signal only, not outcome evidence |
