# Architecture decision — V16 through V25

Decision date: 2026-09-07. Retain Astro for the current public website. Reassess during V16–V25 when a concrete requirement changes the comparison.

The public product is static marketing, bilingual course content and practice sheets, with a React island for guided practice and local Keystatic authoring. GitHub Pages serves generated files. These needs are already supported; no measured benefit currently justifies migrating the public rendering framework.

Next.js static export can also run on GitHub Pages, but cannot supply request-time authentication, Server Actions, booking persistence or the default image optimization server. A migration alone would not create those capabilities. See the fresh official Next.js reference and competitor research in `research/v16-global.md`, plus the independent source assessment in `research/v16-review.md`.

## Reconsideration gates

1. Name the unmet product requirement and its acceptance check: for example protected accounts, durable bookings or remote editorial previews. Framework preference alone is insufficient.
2. Compare the smallest viable options: current Astro plus an isolated service, hosted CMS, Astro server rendering, and Next.js. Identify actual maintenance, operating and privacy costs.
3. If runtime features are needed, select a suitable host and define authentication, data boundaries, secrets, deployment, ownership and rollback. Client-side password checks on static files are not authentication for confidential data.
4. Build an isolated prototype and prove parity for public URLs, all legacy tools, English/Chinese content, no-JavaScript reading, CMS editing, metadata, sitemap, image output, accessibility, and release checks.
5. Measure the required capability or durable gain, including browser JavaScript and deployment reliability. Promote only when the benefits exceed migration cost and no existing release gate regresses.

React interactions, animation, richer local media and a local CMS do not by themselves trigger migration. Premium V26–V30 media can be integrated as optimized static assets and selective islands while this decision remains valid.

This document records an architectural decision, not a product score improvement, performance result or security audit.

## End of V25 review

The public site now has ten English/Chinese page pairs, three self-paced practices and optional local inquiry drafting. These work with generated HTML, selective React and small browser scripts. The contact composer uses no account, submission endpoint or persistence. Builds, static reading, language metadata, local editorial isolation and release gates continue to pass. Retain Astro for V26–V30. Remotion output, Blender renders and generated illustrations can be optimized static media with accessible HTML descriptions. Reopen the gates above only when a concrete new requirement is authorized; a version number is not a migration trigger.
