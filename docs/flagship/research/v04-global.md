# V4 global research: discoverability and structured data

**Access date:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Live HTML and crawl signals on two official communication-training sites, plus Google Search Central guidance for Organization, ProfilePage, canonical URLs, and sitemaps. This is read-only research; no SpeakKai checkout or deployment was changed.

## Executive finding

Duarte provides a useful technical benchmark: its homepage and contact page expose absolute canonical URLs, indexable robots directives, multiple JSON-LD blocks, Organization identity, WebSite/SearchAction, BreadcrumbList, ContactPage, and SiteNavigationElement data. Its `robots.txt` points to a sitemap index whose child sitemaps expose recent `lastmod` dates. Vinh Giang exposes absolute canonical URLs and a public sitemap through `robots.txt`, but the checked homepage and contact page contained no JSON-LD blocks and no visible sitemap link in the HTML.

For SpeakKai, the practical improvement is a small, truthful metadata layer that mirrors visible page content: one Organization graph on the site root, one Person/ProfilePage graph on Kai’s genuine profile/about page, stable canonical URLs, an XML sitemap referenced from `robots.txt`, and clear internal links among parent, school, company, practice, and contact routes. Structured data can improve machine understanding and eligibility for search features, but Google explicitly says it does not guarantee a rich result or a particular appearance.

## Live benchmark observations

### Duarte

Sources: [Duarte homepage](https://www.duarte.com/) and [Duarte contact page](https://www.duarte.com/help-contact/contact-us/), both HTTP 200 on 2026-09-07.

- The homepage has `<title>Communication & Presentation Skills Training | Duarte</title>`, canonical `https://www.duarte.com/`, and robots `follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large`.
- The homepage contained five JSON-LD script blocks. The checked types included `WebPage`, `Organization`, `WebSite`, `SearchAction`, `Article`, `Person`, `ContactPoint`, and `SiteNavigationElement`.
- The homepage’s Organization graph includes a stable `@id`, name, URL, logo, and social `sameAs` links. Another Organization block exposes a sales ContactPoint with phone, contact URL, and available language. These details are visible in source, but their duplication should be treated as a maintenance concern: SpeakKai should prefer one coherent graph unless multiple graphs are intentional and consistent.
- The homepage HTML links to a sitemap presentation URL, `https://www.duarte.com/sitemap/`. `robots.txt` also points to `https://www.duarte.com/sitemap_index.xml`.
- The contact page has canonical `https://www.duarte.com/help-contact/contact-us/`, indexable robots directives, and JSON-LD types including `Organization`, `WebSite`, `BreadcrumbList`, `WebPage`, `ContactPage`, `SearchAction`, and `SiteNavigationElement`.
- The contact page’s navigation exposes distinct training and service links, including presentation writing, business storytelling, visual/data storytelling, delivery, speaker coaching, and consulting. This is a useful relationship between visible navigation and machine-readable navigation; it is not evidence that markup itself caused traffic or conversions.
- `https://www.duarte.com/sitemap.xml` and `https://www.duarte.com/sitemap_index.xml` both returned HTTP 200 and an XML sitemap index. The response listed post, page, book, case-study, guide, and talk sitemaps with `lastmod` values from June–August 2026. `https://www.duarte.com/robots.txt` returned HTTP 200 and declared the sitemap index.

### Vinh Giang

Sources: [Vinh Giang homepage](https://vinhgiang.com/) and [Contact Vinh Giang](https://vinhgiang.com/contact), both HTTP 200 on 2026-09-07.

- The homepage canonical is the absolute URL `https://vinhgiang.com/`; the contact-page canonical is `https://vinhgiang.com/contact`. Both checked pages expose `robots` content `max-image-preview:large`; no `noindex` directive was observed.
- Neither checked page contained an `application/ld+json` block in the returned HTML. This is an observation of the initial response, not proof that JavaScript, a CDN, or another rendering path never adds structured data.
- The homepage navigation is semantically useful even without JSON-LD: Programs, Speaking, Blog/Resources, Free Masterclass, and Contact are linked, and the page exposes audience-relevant actions such as learning, booking speaking, and exploring resources.
- `https://vinhgiang.com/sitemap.xml` returned HTTP 200 with a `urlset` containing the home, programs, speaking, about, community, blog, resources, masterclass, contact, and policy routes. `https://vinhgiang.com/robots.txt` returned HTTP 200, allowed all user agents, and declared `Sitemap: https://vinhgiang.com/sitemap.xml`.
- The sitemap includes promotional, community, policy, and program routes. That breadth is useful for discovery but should be reviewed against indexability goals; a sitemap is a crawl hint, not a substitute for deciding which pages should be public search landing pages.

## Google’s current guidance

Sources: [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), [ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), and [Canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), all HTTP 200 on 2026-09-07.

- Google says Organization markup on the home page can help it understand administrative details and disambiguate an organization. It says there are no required Organization properties and recommends relevant information such as name/alternateName, real-world presence (address/telephone), and online presence (URL/logo). SpeakKai should include only facts it can maintain and publicly stand behind.
- Google says ProfilePage markup must have a `mainEntity` that is a Person or Organization for eligibility. It recommends `name`, and optionally `dateCreated`, `dateModified`, `description`, `image`, `sameAs`, and other properties. A SpeakKai “About Kai” page is a natural candidate if it is genuinely about Kai; adding ProfilePage to every offer or contact page would be semantically wrong.
- Google recommends validating structured data with the Rich Results Test and warns that structured data does not guarantee that a search feature will appear. This is a reason to treat JSON-LD as a truthful enhancement, not a ranking promise.
- Google describes a sitemap as a file that helps search engines crawl more efficiently and communicate important pages, files, relationships, last-update information, and alternate language versions. It does not replace internal links or canonical decisions.
- Google ranks canonicalization signals: redirects are strong, `rel="canonical"` is a strong signal, and sitemap inclusion is a weak signal. For SpeakKai, each public route should have one self-consistent absolute canonical and redirects for any legacy duplicates; merely adding a URL to a sitemap is insufficient.

## Applicable SpeakKai changes

1. **Add a single root Organization graph.** On the homepage, describe SpeakKai only with verified `name`, canonical `url`, logo, concise description, and selected `sameAs` profiles. Add a `ContactPoint` only when the channel and contact details are public and operational. Keep it aligned with visible copy. Do not invent awards, locations, follower counts, or corporate relationships.

2. **Add a Kai ProfilePage graph on the About/profile route.** Use `mainEntity: Person` with Kai’s real name, real crawlable portrait, concise credentials/description, and verified `sameAs` links. Add `dateModified` only when the editorial system can maintain it. Do not add fake interaction statistics or placeholder image URLs. The page should visibly be a Kai profile, since Google’s guidance is about what the page is about, not a hidden SEO label.

3. **Make canonical/sitemap/robots behavior release checks.** Emit one absolute canonical per indexable route, generate a sitemap containing only intended public pages, include language alternates when those routes genuinely exist, and publish the sitemap URL in `robots.txt`. Check redirects and trailing-slash variants. Use internal links that reflect the audience IA: parent, school, company, practice/resources, and safe inquiry.

4. **Add metadata and navigation to the content contract.** For CMS or repository content, require page title, description, canonical path, audience, language, indexability, last-reviewed date, and proof/consent status. Generate JSON-LD only from those fields and fail the build on duplicate canonicals, malformed JSON-LD, missing required route metadata, or a sitemap URL that does not return 200. Validate with Google’s Rich Results Test and a crawl/read-back after deployment.

## Limits and uncertainty

- The Duarte and Vinh observations describe initial public HTML on 2026-09-07. JavaScript, personalized responses, or alternate rendering could change what a browser sees after load.
- No Google Search Console, Rich Results Test submission, indexing result, ranking result, or traffic measurement was performed. No conversion or SEO uplift is claimed.
- Vinh’s lack of JSON-LD is not proof that the site never uses structured data elsewhere. Duarte’s multiple Organization-related blocks may be intentional, generated by different systems, or redundant; they should be reconciled only after reading the exact deployed graph and deciding the site’s canonical entity model.
- Sitemap inclusion is a weak canonical signal according to Google. It cannot repair duplicate or conflicting canonical URLs.
- ProfilePage is appropriate for a real profile/about page. Organization and ProfilePage should not be used to decorate a marketing claim that the visible page does not support.

## Source ledger

| Source | Publisher | Evidence read |
|---|---|---|
| [Duarte homepage](https://www.duarte.com/) | Duarte | Canonical, robots, five JSON-LD blocks, Organization/WebSite/navigation types, sitemap link |
| [Duarte contact](https://www.duarte.com/help-contact/contact-us/) | Duarte | Canonical, robots, ContactPage/BreadcrumbList/navigation data, visible service navigation |
| [Duarte sitemap index](https://www.duarte.com/sitemap.xml) | Duarte | HTTP 200; child sitemaps and 2026 `lastmod` values |
| [Duarte robots](https://www.duarte.com/robots.txt) | Duarte | HTTP 200; sitemap declaration and crawl rules |
| [Vinh Giang homepage](https://vinhgiang.com/) | Vinh Giang | Canonical, robots, no JSON-LD in initial HTML, audience-relevant navigation |
| [Vinh Giang contact](https://vinhgiang.com/contact) | Vinh Giang | Canonical, robots, no JSON-LD in initial HTML, contact navigation |
| [Vinh Giang sitemap](https://vinhgiang.com/sitemap.xml) | Vinh Giang | HTTP 200; public route set |
| [Vinh Giang robots](https://vinhgiang.com/robots.txt) | Vinh Giang | HTTP 200; allow rule and sitemap declaration |
| [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) | Google Search Central | Organization purpose, relevant properties, validation and no-guarantee warning |
| [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page) | Google Search Central | `mainEntity` requirement, Person/Organization properties, image and sameAs guidance |
| [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) | Google Search Central | Crawl/discovery role, updates and alternate-language context |
| [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | Google Search Central | Relative strength of redirects, canonical links, and sitemap inclusion |
