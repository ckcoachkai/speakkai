# SEO strategy — V30

The final technical inventory contains 22 core routes, 11 language pairs and 28 sitemap targets. Search rankings, impressions and organic conversions are not measured by these checks.

## Match the visitor's task

The homepage introduces Kai and the three audiences. Coaching, Schools and Companies each explain fit, formats, practical work and an inquiry. The named Fall course has its own English and Chinese pages. Free practices answer a specific speaking task and lead to the appropriate audience. Keep each page's title and description tied to that actual content; avoid rankings, unsupported locations or near-duplicate keyword pages.

## Current technical contract

FlagshipLayout supplies one main landmark, page language, canonical pathname without inquiry parameters, social metadata and safely serialized JSON-LD. The shared graph identifies SpeakKai, Kai Liu, the website and the current page. Relevant pages add Service and BreadcrumbList; contact uses ContactPage. Do not add ratings, awards, endorsements, event dates or course availability without evidence.

All 11 English/Chinese pairs use reciprocal language links and hreflang, with English as x-default. A language alternative must offer corresponding content. Keep draft practices out of generated routes, sitemap and public data. The language switch is a normal link; it does not redirect by browser locale or remember a preference.

src/data/publicRoutes.ts is the curated sitemap base; published practice records supply additional paths. The current base deliberately omits experiments, schedule, itinerary, lab and redirects. Sitemap omission is not an access-control mechanism or a guarantee of no indexing. robots.txt allows crawling and points to sitemap.xml. The 404 page uses noindex and useful recovery links.

## Editorial priorities

Publish useful original teaching resources: a clear purpose, audience, materials, steps, listener check and retry. Give them descriptive internal links from relevant offers and method sections. Keep visible examples and media transcripts readable in static HTML. Maintain the existing public URL when improving an article; use a verified redirect if it must change.

Preserve descriptive alternative text for meaningful images, reserved dimensions and responsive assets. Add accurate media metadata only after the actual video or illustration exists and can be inspected. Generated media is not an authentic client case.

The /watch/ and /zh/watch/ metadata describes all three activities. Actual local MP4s, posters and illustrations exist, with full HTML instructions and fictional labels. No VideoObject, ratings or outcome schema has been added; page metadata remains the shared graph above. Do not imply video rich-result eligibility from a successful page check.

## Verification and measurement

Run scripts/check-flagship-seo.mjs, route/link checks, content publication checks and the byte budget for every release. These validate emitted metadata, serialization, sitemap targets and local assets. They do not prove search-engine eligibility, indexing, rankings or real-user speed.

Future measurement should use an authorized search-property setup and aggregate metrics: indexed canonical pages, impressions, queries, clicks and useful inquiry paths. No analytics or search account integration was installed as part of this draft. Define a baseline and a review window before making an SEO outcome claim.
