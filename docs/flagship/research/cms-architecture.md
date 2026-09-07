# SpeakKai CMS and framework architecture memo

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** A practical content editing path for the existing SpeakKai site, assumed to be Astro 5.18, static output on GitHub Pages, using pnpm, with no backend or hosted CMS credentials. This is read-only architecture research; no site checkout, account, or deployment was changed.

## Recommendation

For V6–V15, use Keystatic in **local mode** as a real, schema-driven editor for Kai or a trusted maintainer. Keep the source of truth in the repository, commit the resulting Markdown/MDX/Markdoc content through the normal branch and review flow, and let the existing GitHub Pages build publish it. This gives the team a working editor without pretending that a static host can provide authentication or write access.

If nontechnical remote editors are a hard requirement, run Keystatic on a small separate Node-capable CMS host and keep the public site’s static output on GitHub Pages. Keystatic’s GitHub mode is the closest fit to the existing repository workflow, but it requires a GitHub App/OAuth setup, secrets, repository permissions, and a server for its API routes. Keystatic Cloud can simplify some authentication and allow editors without GitHub accounts, but it introduces a third-party account/service and its own team access model. That choice needs action-time approval and a current cost/privacy review.

Decap CMS is viable only after adding an authentication/backend service. Its GitHub backend documentation says GitHub requires a server for authentication and that all users need push access to the repository. Its Git Gateway route avoids direct repository write access for editors, but the official docs require Netlify Identity/Git Gateway or a self-hosted Git Gateway plus an identity service that issues JWTs. That is extra infrastructure for this site.

Pages CMS is a narrower GitHub-based alternative, but its official installation docs require PostgreSQL, environment secrets, and a GitHub App. It is therefore not a V6–V15 drop-in for static GitHub Pages. It becomes relevant only if SpeakKai already decides to operate a small always-on CMS application.

Do not migrate to Next.js merely to obtain React components or a CMS. Astro’s official React integration supports React components, and Astro content collections provide type-safe structured content. Next.js can also produce a static export, but that does not remove the need for a server when the chosen CMS or future product requires authentication, cookies, dynamic requests, draft mode, or server actions. At V16–V25, migrate only if measured product requirements need server behavior that cannot be supplied cleanly by Astro plus a small separate CMS/service, or if a controlled prototype demonstrates a material, durable operational gain.

## What the official documentation establishes

### Keystatic

[Keystatic’s local-mode documentation](https://keystatic.com/docs/local-mode) says local storage writes content directly to the local file system and describes this as the sensible starting mode for a project. This is a genuine editor, but the editing session is local to the machine running the dev server; it is not a public hosted CMS endpoint.

[The Astro installation guide](https://keystatic.com/docs/installation-astro) shows `@keystatic/core`, `@keystatic/astro`, the Astro integration, and a `keystatic.config.ts` collection writing into the project’s content directory. The guide also says Keystatic needs server-side code and Node.js APIs, so an Astro adapter is needed for deployment. Its guide still describes an existing Astro v2 project, so compatibility with this project’s Astro 5.18 should be verified in an isolated branch before adoption; the architectural constraint remains clear even if package versions differ.

[Keystatic’s GitHub-mode documentation](https://keystatic.com/docs/github-mode) says the project must be on an existing GitHub repository, collaborators need repository write access, and the `/keystatic` route prompts GitHub login. The documented setup creates or connects a GitHub App, grants it repository access, and generates environment variables including a GitHub client ID/secret, a Keystatic secret, and an Astro public GitHub App slug. The page says deployed Keystatic needs environment variables and a host that can run Node.js API routes; its deployment section is marked “Coming soon,” which is a material documentation uncertainty for production operations.

[Keystatic’s production-route recipe](https://keystatic.com/docs/recipes/astro-disable-admin-ui-in-production) documents an environment flag (`SKIP_KEYSTATIC`) to prevent the admin routes from being mounted in production. This supports a split deployment: keep `/keystatic` out of the public static site and expose it only on a controlled CMS host or local development environment.

[Keystatic Cloud documentation](https://keystatic.com/docs/cloud) says Cloud handles GitHub authentication and removes the need to manage environment variables and a custom GitHub App. It says projects connect to a GitHub repository, team-level access applies to all projects in that team, the free plan allows up to three users per team, and the page currently lists Pro starting at $10/month with additional users at $5/month each. Those prices and terms are time-sensitive and were not purchased or independently tested. Cloud is an option for reducing auth setup, not proof that GitHub Pages itself can host an editor.

### Decap CMS

[Decap’s overview](https://decapcms.org/docs/intro/) describes a static-site CMS with a `/admin` single-page application, a configurable backend, collections, fields, media, editorial workflows, and platform guides. The UI can be copied into a static site, but the backend/authentication decision is the part that determines deployment feasibility.

[Decap’s GitHub backend documentation](https://decapcms.org/docs/github-backend/) says GitHub-backed users can log in with GitHub, but all users must have push access to the content repository. It also says GitHub requires a server for authentication and points to Netlify as the facilitator of basic GitHub authentication. That permission model is poorly suited to giving a school editor or contractor limited content access to a private repository.

[Decap’s Git Gateway documentation](https://decapcms.org/docs/git-gateway-backend/) says Git Gateway can avoid direct write access to the GitHub/GitLab repository for CMS users. Its Netlify path uses Netlify Identity; without Netlify, the official page says the operator must run a Git Gateway server and an identity service that issues JWTs. This is a real solution, but it is additional hosted infrastructure, credentials, and security maintenance.

[Decap’s editorial-workflow documentation](https://decapcms.org/docs/editorial-workflows/) says the default save can push directly to the configured publication branch, while `publish_mode: editorial_workflow` adds drafting, reviewing, and approving. That is useful for an editorial team, but the repository and preview/deploy workflow still need to be configured and tested against the existing GitHub Pages Actions pipeline.

### Pages CMS

[Pages CMS introduction](https://pagescms.org/docs/) presents a GitHub-oriented CMS with configuration, fields, editors, collaborators, and self-hosting guides.

[Its local installation guide](https://pagescms.org/docs/guides/installing/) explicitly requires PostgreSQL, environment variables such as `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `CRYPTO_KEY`, and a GitHub App. It also documents database migrations and a running app. This is a conventional application deployment, not a static `/admin` folder that GitHub Pages can serve by itself.

[Its self-hosting guide](https://pagescms.org/docs/guides/installing/self-host/) requires a PostgreSQL database, secrets, a base URL, and optional admin email configuration. [Its GitHub App guide](https://pagescms.org/docs/guides/installing/github-app/) says the App supports repository access, user sign-in, webhook delivery, and installation-scoped operations. [Its authentication documentation](https://pagescms.org/docs/development/authentication/) describes choosing between a GitHub user token and a GitHub App installation token. These are useful capabilities but exceed the current no-backend/no-credentials constraint.

### Astro and GitHub Pages

[Astro content collections](https://docs.astro.build/en/guides/content-collections/) describe type-safe, structured content that can be stored locally in the project, hosted remotely, or fetched from live sources. That supports a repository-backed V6–V15 content model without adopting a CMS immediately.

[Astro’s React integration](https://docs.astro.build/en/guides/integrations-guide/react/) documents adding `@astrojs/react` with npm, pnpm, or Yarn and rendering React components in Astro. A React island for a diagnostic, filter, or interactive offer card therefore does not require a framework migration.

[Astro’s GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/) documents a GitHub Actions build and `actions/deploy-pages@v5` deployment. [GitHub’s Pages quickstart](https://docs.github.com/en/pages/quickstart) describes publishing from a branch or configured source and supports a custom domain. These sources describe static publication; they do not provide a server runtime for CMS authentication, OAuth callbacks, or write operations.

### Next.js static export and server boundary

[Next.js static-export documentation](https://nextjs.org/docs/app/guides/static-exports) currently identifies version 16.3.4 and a 2026-08-25 update. It says `output: 'export'` makes `next build` produce an `out` directory that can be hosted on any web server. It also says Server Components can run at build time and Client Components can use browser APIs.

The same official page lists important unsupported features in static export: dynamic routes without `generateStaticParams`, request-dependent Route Handlers, cookies, rewrites, Incremental Static Regeneration, default `next/image` optimization, Draft Mode, Server Actions, and Intercepting Routes. A migration that keeps GitHub Pages static would retain those boundaries. Moving to Next.js alone would not solve deployed CMS authentication.

## Practical options for SpeakKai

| Option | What is genuinely edited | Hosting and credentials | Fit now | Main risk |
|---|---|---|---|---|
| Keystatic local mode | Repository content files through a local `/keystatic` dev UI | Existing checkout and pnpm; no hosted auth | **Recommended for V6–V15** | Remote editors cannot use it without access to the checkout |
| Keystatic GitHub mode on separate host | Repository content through GitHub App/OAuth, branches, and commits | Node-capable CMS host, env secrets, GitHub App, repo permissions | Good when remote editing is required | Deployment docs are still marked “Coming soon”; permissions and callback setup need a real rehearsal |
| Keystatic Cloud | Repository content through Cloud-backed auth and team access | Cloud account/service; current docs list free up to 3 users and paid expansion | Good later if third-party service is acceptable | Vendor dependency, team-wide project access model, volatile pricing/terms |
| Decap + GitHub backend | Files/commits through `/admin` | Static UI plus OAuth server; all users need repo push access | Weak for limited external editors | Auth and permissions are unsuitable without additional service design |
| Decap + Git Gateway | Files/branches/PR workflow | Netlify Identity/Git Gateway or self-hosted equivalents | Possible, but infrastructure-heavy | More auth, JWT, and service operations than the site currently has |
| Pages CMS self-host | GitHub repository content through a full CMS app | PostgreSQL, secrets, GitHub App, public app host | Not for V6–V15 | Broad infrastructure addition and operational burden |
| No CMS, structured Astro content | Markdown/MDX/content collections edited in an IDE or GitHub PR | Existing repo and Pages Actions | Strong fallback and baseline | Nontechnical editing is less friendly |

## Proposed V6–V15 delivery without faking a CMS

1. **Define content contracts first.** Model parent, school, and company offers as typed collections or content data with fields for audience, title, summary, language, CTA, proof reference, last-reviewed date, and publication status. Keep private student or calendar data out of public collections.
2. **Add Keystatic local mode in a branch.** Use the official Astro integration and local storage. Start with one harmless collection such as benchmark-backed resources or public offer cards. Verify that saving in `/keystatic` creates a real file in the intended repository path and that the Astro build reads that exact file.
3. **Keep the authoring path local and reviewable.** Kai runs `pnpm dev`, edits in Keystatic, reviews the Git diff, runs the existing typecheck/build/QA commands, and opens a branch or PR. A reviewer can reject stale claims, missing consent, broken links, or accidental private data before GitHub Pages publishes.
4. **Make preview and publish explicit.** A local editor save is not a publish. The repository branch and GitHub Actions build remain the publication gate. Add content linting for required audience, language, CTA, source/proof status, and last-reviewed date.
5. **Disable admin routes in public output.** If local mode is used, conditionally omit Keystatic in production using the documented `SKIP_KEYSTATIC` pattern. This prevents a public admin route from being mistaken for authenticated editing.
6. **Reassess remote editing after a real user test.** If Kai can complete the intended editing task locally in under 10 minutes and the PR review is acceptable, stop there. If a trusted remote editor cannot work with the local flow, run a separate-host Keystatic GitHub-mode prototype with a test repository and nonproduction callback URL. Do not point an untested CMS at the live repository.

This path preserves the current Astro/GitHub Pages deployment and gives real editing immediately for the owner. It also leaves a clean upgrade path to a hosted CMS without encoding CMS-specific runtime assumptions into every page.

## If remote editing is mandatory

The narrowest architecture is a split deployment:

```text
Keystatic admin host (Node runtime + GitHub App/OAuth)
                 │ commits content / optional branch or PR
                 ▼
          GitHub repository
                 │ GitHub Actions build
                 ▼
      Static Astro output on GitHub Pages
```

The public site can remain on `speakkai.com`/GitHub Pages while a separately controlled host serves something like `cms.speakkai.com`. The admin host needs secrets, callback URLs, an access policy, and a rollback plan. A content commit should trigger the existing Pages build; the test must verify that a committed edit appears on the public site and that a rejected or reverted commit removes it on the next build.

Keystatic GitHub mode is the closest match because it writes to the existing repository and understands GitHub collaboration. Keystatic Cloud is simpler for non-GitHub editors but changes the trust and service boundary. Decap is reasonable if SpeakKai already chooses Netlify/Git Gateway or is willing to operate an OAuth/JWT service. Pages CMS is a later option if the team wants a full CMS application with PostgreSQL. None should be represented as “installed” until authentication, edit, commit, build, rollback, and permissions are tested end to end.

## Objective Next.js migration gate for V16–V25

The decision should be based on requirements and measured cost, not familiarity or the presence of React components. Record each requirement as **Static**, **Client island**, **Server/auth**, or **CMS operation**. Astro plus `@astrojs/react` covers the first two. A CMS host or small service can cover the latter two without changing the public rendering framework.

Proceed to a Next.js migration study only when all of these are true:

- **Two or more server-bound requirements are confirmed.** Examples include authenticated student/teacher dashboards, request-time personalization, secure server actions, draft/preview mode that must run on the same app host, or a unified API that cannot be isolated as a small service. “We might add a dashboard” is not sufficient.
- **The requirement fails cleanly in the current plan.** Document why Astro static output plus a separate CMS/service, React island, or existing backend cannot satisfy it. If a separate Keystatic host solves editing, CMS need alone does not pass the gate.
- **A parity prototype exists.** Build the same representative routes, content model, bilingual behavior, inquiry flow, and proof media in Astro and Next in isolated branches. Compare build/deploy reliability, generated output, JavaScript shipped on the public routes, accessibility, SEO metadata, and editing workflow.
- **The migration pays back.** Estimate route/content conversion, test rewrite, design regression, deployment, and ongoing maintenance. Require an agreed payback period of 6–12 months or a material risk reduction that the owner explicitly values. Record engineering hours rather than treating migration as free.
- **The hosting decision is real.** If Next uses server features, select a compatible host, configure secrets, preview environments, rollback, logging, and data/privacy boundaries. If Next remains a static export, prove that it improves a measured outcome while accepting the same static limitations documented by Next.js.
- **Content identity survives.** Preserve slugs, canonical URLs, language routes, image references, structured data, and redirects. A migration that loses the public content graph fails even if the new app builds.
- **Operational and audience QA passes.** No material regression in mobile readability, reduced-motion behavior, keyboard access, load performance, bilingual copy, safe inquiry wording, or private-data handling.

Do not migrate if the only evidence is “React would be easier,” “the CMS needs a UI,” a desire for animation, or a static site looking more premium. Astro already supports React islands and static content collections; Next static export remains static. The migration case becomes strong only when the product has a demonstrated server/application boundary whose cost is lower when unified in Next.

## Suggested decision checkpoints

| Checkpoint | Decision question | Evidence required |
|---|---|---|
| End V6 | Is content structured and editable by the owner? | Keystatic local save produces a real diff; Astro build consumes it |
| End V10 | Is the workflow safe for bilingual public content? | Required-field/content/privacy checks and reviewed preview |
| End V15 | Is remote editing worth a hosted runtime? | Owner/remote-editor task timing, permissions, and support burden |
| Start V16 | Does any product requirement truly need server behavior? | Signed requirement list with Astro/service alternatives assessed |
| End V20 | Does Next solve the requirement materially? | Astro/Next parity prototype and measured comparison |
| End V25 | Is migration operationally justified? | Cost/payback, host/secrets, redirects, QA, rollback plan |
| V26–V30 | Can premium media remain framework-agnostic? | Verified static fallback, transcript/alt text, rights/consent, load and reduced-motion QA |

## Uncertainty and explicit nonclaims

- The repository baseline (Astro 5.18, pnpm, static GitHub Pages, no backend/credentials) is supplied task context here; it was not independently inspected because this memo is read-only architecture research.
- Keystatic’s public docs are current enough to establish local/GitHub/server boundaries, but the Astro integration page still uses an Astro v2 example and its deployment section says “Coming soon.” Test exact package compatibility and deployment behavior in an isolated branch before choosing it for production.
- Prices and limits on Keystatic Cloud are observations from the official page on 2026-09-07, not a purchase quote.
- No authentication, GitHub App, OAuth callback, CMS edit, commit, Pages build, rollback, or hosted preview was executed in this research pass.
- Official documentation describes capability and setup, not SpeakKai-specific security, privacy, cost, or editorial suitability. Those require a controlled prototype and action-time review.

## Source ledger

All sources below are official documentation pages accessed on 2026-09-07. Where an official page exposed a last-updated date, it is recorded; otherwise no date is inferred.

| Source | Publisher | URL | Relevant evidence |
|---|---|---|---|
| Local mode | Keystatic | https://keystatic.com/docs/local-mode | Filesystem-backed editing; local is the starting mode |
| Astro installation | Keystatic | https://keystatic.com/docs/installation-astro | Astro integration, content path, server-side Node/API adapter requirement |
| GitHub mode | Keystatic | https://keystatic.com/docs/github-mode | GitHub repo/write access, login, GitHub App, environment variables, Node host |
| Disable Admin UI in production | Keystatic | https://keystatic.com/docs/recipes/astro-disable-admin-ui-in-production | `SKIP_KEYSTATIC` route exclusion pattern |
| Keystatic Cloud | Keystatic | https://keystatic.com/docs/cloud | Cloud auth, team access, current displayed plan details |
| Decap overview | Decap CMS | https://decapcms.org/docs/intro/ | Static `/admin` UI, backends, collections, editorial workflows |
| GitHub backend | Decap CMS | https://decapcms.org/docs/github-backend/ | Push access requirement and server-for-authentication statement |
| Git Gateway | Decap CMS | https://decapcms.org/docs/git-gateway-backend/ | Netlify Identity or self-hosted Git Gateway/JWT requirement |
| Editorial workflows | Decap CMS | https://decapcms.org/docs/editorial-workflows/ | Direct publication versus draft/review/approval workflow |
| Pages CMS introduction | Pages CMS | https://pagescms.org/docs/ | GitHub-oriented CMS feature surface |
| Install locally | Pages CMS | https://pagescms.org/docs/guides/installing/ | PostgreSQL, secrets, GitHub App, migrations, running app |
| Self-host | Pages CMS | https://pagescms.org/docs/guides/installing/self-host/ | Database, secrets, base URL, admin access |
| GitHub App | Pages CMS | https://pagescms.org/docs/guides/installing/github-app/ | Repository access, sign-in, webhooks, installation-scoped operations |
| Authentication | Pages CMS | https://pagescms.org/docs/development/authentication/ | User-token versus GitHub-App installation-token behavior |
| Content collections | Astro | https://docs.astro.build/en/guides/content-collections/ | Typed local/remote structured content |
| React integration | Astro | https://docs.astro.build/en/guides/integrations-guide/react/ | React components in Astro; pnpm installation path |
| Deploy Astro to GitHub Pages | Astro | https://docs.astro.build/en/guides/deploy/github/ | GitHub Actions and Pages static deployment |
| GitHub Pages quickstart | GitHub | https://docs.github.com/en/pages/quickstart | Branch/source publishing and custom domain context |
| Static exports | Next.js | https://nextjs.org/docs/app/guides/static-exports | `output: 'export'`, static hosting, supported/unsupported server features; page showed v16.3.4 and updated 2026-08-25 |
