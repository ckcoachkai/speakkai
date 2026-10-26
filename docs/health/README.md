# Health route: published setup shell

`https://speakkai.com/health/` currently serves an honest, empty **setup-required page**. This is not a working tracker or sign-in service. It contains no real records, sample meals, measurements, photos, credentials, forms, JavaScript, storage integration or automatic chat sync. Sign-in is deliberately disabled. Source code can be public; health records must never enter this repository, its build inputs/output, maps, public assets, or Git history.

The route is standalone in `public/health/`; the global editorial theme excludes it. Its meta CSP disables script, connections, forms and workers for this page. It is publicly cacheable on GitHub Pages because it contains only generic setup text and decorative vector art. The noindex metadata is search guidance, not authentication. Do not claim that a path, CSP or disabled button supplies owner authorization.

## Required next actions

The user confirmed this domain, consented to Supabase as the sensitive-data destination, and authorized publication. At inspection the connected Supabase account had no projects; `ckcoachkai's Org` was on the Free plan. **No project or credentials were created.**

Before provisioning: confirm the organization and region, obtain a current cost quote, and obtain explicit approval for project creation (which generates credentials). Proposed project name: `speakkai-health`; proposed region: Singapore (`ap-southeast-1`). Only a $0 creation is within scope; no subscription or paid plan is authorized. The Free plan's current limits and inactivity pausing must be reviewed at provisioning time. Never promise free indefinite storage or durable backup coverage.

Separate action-time approval is required before configuring the owner identity/credentials, changing authentication settings, adding persistent access grants, applying row/object access policies or creating private storage. `owner-only-schema.proposed.sql` is an **unapplied design draft**, not a tested migration. It must be adapted to the verified owner, audited on a synthetic test environment and approved before use. No real health seed should be requested until actual access controls are verified.

## Production security contract

- Explicitly allowlisted owner only, enforced by database/API and object policies. Reject unauthenticated users and authenticated non-owners. UI checks alone are insufficient. Keep elevated keys in the approved secret manager, never in Git, HTML, browser JS, build env with PUBLIC prefixes, logs or chat.
- Keep the data-free shell separate from runtime health records. Use private object storage for originals and thumbnails, authenticated reads, no public bucket/URLs. Signed URLs are bearer capabilities; prefer authenticated downloads and no-store responses. Review the public site's same-origin apps before choosing a session design. A separate origin may be needed for stronger isolation.
- No real data in pre-rendering, public JSON, source maps, CI artifacts, analytics, browser storage, cache or service workers. Private API and photo responses require no-store and cache/CDN bypass. Verify logout, expiry, account switching, browser back/forward/offline behavior and existing service workers against the actual production system.
- Store original timestamp/offset plus UTC and Asia/Shanghai eating date. Keep planned/consumed, estimated/measured, incomplete/complete, null/unknown nutrition, confidence and provisional targets distinct.
- Stage imports privately, review and confirm, then commit atomically with server-enforced message/content-hash idempotency and optimistic revision checks. A retry returns the previous receipt; changed payload under the same key conflicts. No implicit chat-to-site sync. Exclude medication/symptom history from the default import.
- Test backup/restore and retention/deletion, and return durable IDs/receipts after verified saves. Frontend rollback must not delete private data.

## Release checks

Run `node scripts/check-health.mjs` and the full `npm run build`, then `node scripts/check-health.mjs --dist`. Existing site CI remains intact. Before changing this shell into a real tracker, replace these shell-specific tests with full synthetic owner/non-owner, record/photo URL, cache/logout, duplicate, concurrency, durable-save and mobile tests. No mock result is proof of live RLS.

The earlier interactive prototype is kept outside the site repository and was not published. It uses invented data and memory-only edits. This public page never presents that concept as a finished personal tracker.
