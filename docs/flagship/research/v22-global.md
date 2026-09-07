# V22 global benchmark: an explicit English / 中文 switch

**Checked:** 2026-09-07 (Asia/Shanghai)  
**Scope:** Bounded pre-edit research for the SpeakKai flagship site. The decision is how to introduce a persistent top English/中文 switch and a Chinese homepage while remaining honest about which routes are actually translated. No product files, builds, browser/shared-browser actions, redirects, storage, splash screen or deployment was created.

## Fresh official bilingual institutional reference

[World Health Organization](https://www.who.int/) returned HTTP 200 on 2026-09-07. The English root response has `<html lang="en">` and a labeled **“Select language”** control. Its native-language options include **English**, **العربية**, **中文**, **Français**, **Русский** and **Español**. The page exposes explicit language-specific homepage destinations in its HTML: English `https://www.who.int/home` and Chinese `https://www.who.int/zh/home`.

The useful pattern is explicit choice and explicit destination: the current language is identifiable, the selector names languages in their own scripts, and the Chinese homepage has a stable `/zh/home` route. The English root remains English until a visitor chooses another option. This is an information-architecture reference, not a reason to copy WHO’s selector or JavaScript behavior, and it does not establish any SpeakKai translation quality or international coverage.

## W3C language requirement

[W3C WAI: Understanding SC 3.1.1 Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) returned HTTP 200 on 2026-09-07. W3C states that the default human language of each web page must be programmatically determinable; this helps assistive technology use appropriate pronunciation and lets user agents render linguistic content correctly.

For SpeakKai, each route needs a truthful page language such as `en` or `zh-CN`. A visible switch should use ordinary links with destination labels that remain understandable out of context. `hreflang` metadata should describe genuine equivalent language pages; a Chinese-homepage fallback is a useful visible destination but is not an equivalent translation and should not be advertised as one.

## Current SpeakKai route baseline

Read-only inspection of `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30` found:

- `src/layouts/FlagshipLayout.astro` already accepts `language`, emits `<html lang={language}>`, and supports optional `alternates`/`hreflang` metadata.
- The layout has no site-wide English/中文 switch. On Chinese pages, its navigation still points to English paths (`/#work`, `/#story`, `/resources/`, `/schedule/`) and labels them as English in Chinese.
- The brand link on Chinese pages is explicitly labeled **“SpeakKai 首页（英文）”**. `FlagshipBreadcrumbs.astro` likewise sends Chinese pages to `/` and labels it **“首页（英文）”**.
- Chinese flagship content currently has only two concrete routes: `/zh/coaching/young-competition-speakers/` and `/zh/resources/one-object-story/`. There is no `src/pages/zh/index.astro`, so a Chinese homepage does not currently exist.
- The English flagship routes include `/`, `/coaching/`, `/schools/`, `/companies/`, `/contact/`, `/resources/`, `/schedule/`, the course route, and published practice routes. The English course and `one-object-story` practice have genuine Chinese counterparts; the audience landing pages and general contact/resources/schedule pages do not.
- The course and one-object-story components already model exact language pairs with `language`, `hreflang`, `aria-current`, and language-specific copy. The Chinese practice route is intentionally limited to the `one-object-story` entry in `getStaticPaths`; it is not evidence that every practice page has a Chinese version.

## Equivalent route mapping and honest fallback

Use this mapping for a first top switch. “Exact pair” means a Chinese route exists with corresponding content. “Fallback” means the visible Chinese destination is the new Chinese homepage and must be labeled as such.

| Current English route | Chinese switch destination | Status and metadata |
|---|---|---|
| `/` | `/zh/` | Chinese homepage to create; exact homepage pair after content and `lang="zh-CN"` are present. |
| `/coaching/` | `/zh/` | Fallback; no Chinese coaching landing page exists. Label the link **中文首页** rather than implying a translated coaching page. |
| `/schools/` | `/zh/` | Fallback; no Chinese school landing page exists. |
| `/companies/` | `/zh/` | Fallback; no Chinese company landing page exists. |
| `/contact/` | `/zh/` | Fallback unless a Chinese contact page is later created. Do not imply that a Chinese inquiry form exists. |
| `/resources/` and other English-only practice routes | `/zh/` | Fallback; only the named story below has a Chinese route. |
| `/schedule/` | `/zh/` | Fallback; preserve the existing schedule route as English until it is translated. |
| `/coaching/young-competition-speakers/` | `/zh/coaching/young-competition-speakers/` | Exact pair; preserve the course page’s existing bilingual language switch and `hreflang`. |
| `/resources/one-object-story/` | `/zh/resources/one-object-story/` | Exact pair; preserve the practice page’s existing language switch and `hreflang`. |

For the reverse direction, Chinese routes switch back to their exact English counterpart. The Chinese homepage switches to `/`. A Chinese page without an English equivalent should use `/` as the English-home fallback and label it **English homepage**. Do not create cross-language links by mechanically prepending or removing `/zh` for routes that have not been authored in both languages.

## Smallest useful implementation recommendation

Add a compact, persistent switch in `FlagshipLayout.astro` near the brand or primary navigation: two ordinary anchors, **English** and **中文**, with `aria-current="page"` on the active language. Resolve the destination from an explicit route-pair table rather than from the current pathname. The switch should be present on the English homepage, the Chinese homepage and all flagship pages that use the layout.

Create `/zh/` as a real Chinese homepage with its own Chinese title/description, `<html lang="zh-CN">`, canonical `/zh/`, and a clear English counterpart link to `/`. Keep its first scope small: Chinese hero, method summary, the three audience entry points, and direct contact context. For audience pages that remain English, make the fallback visible in the link label or nearby note, for example **中文首页（其他页面正在准备）** only if that preparation statement is true and intentionally published. The safer minimum is **中文首页**.

Use `hreflang="en"`/`hreflang="zh-CN"` only on `/` ↔ `/zh/`, the course pair and the one-object-story pair once both endpoints are live and semantically equivalent. Do not attach `hreflang="zh-CN"` to `/schools/` merely because its switch sends visitors to `/zh/`; that would describe the homepage as a translation of the school page. The same rule applies to canonical URLs and structured-data `inLanguage` values.

Keep the switch visible in the initial page and usable with keyboard navigation. Do not add a language splash, automatic browser-language redirect, `navigator.language` decision, cookie, localStorage preference or session state. A visitor should be able to copy or share `/` and `/zh/` and get the same language every time. The destination should change only after the visitor activates a link.

## Testable hypothesis and release checks

**Hypothesis:** If visitors can choose English or 中文 from the top of every flagship page, reach a real Chinese homepage, and see a clearly labeled Chinese-homepage fallback where a page is not translated, then language navigation becomes predictable without overstating translation coverage or changing language unexpectedly.

Before any later product edit, record each result as PASS, FAIL or NOT_CHECKED:

- `/` and `/zh/` exist as stable, manually selected pages with truthful `lang`, title, description and canonical values.
- The top switch appears on both homepages and all FlagshipLayout pages, with visible English/中文 labels and `aria-current` on the active option.
- Exact pairs are mapped explicitly: the course and one-object-story routes preserve their existing content and language links.
- English-only audience, contact, resources and schedule routes send visitors to `/zh/` only as an explicitly named Chinese-homepage fallback.
- Chinese pages link to their exact English counterpart or to `/` as an explicitly named English-homepage fallback.
- `hreflang` appears only for genuine equivalent page pairs; fallback links are not marked as translated alternates.
- Chinese pages expose `lang="zh-CN"`, and mixed-language names or labels use an appropriate `lang` value where needed.
- No splash, automatic redirect, browser-language detection, cookie, localStorage, query-based persistence or hidden language state is introduced.
- Navigation, breadcrumbs, brand link and footer agree on the same exact-pair/fallback mapping.
- Keyboard users can reach and understand both switch choices, and the link text remains clear at narrow widths.
- The existence of the built output, live route status, rendered switch placement, keyboard interaction, translation quality and screen-reader output remain **NOT_CHECKED** in this research because no build or browser verification was authorized.

## Source ledger

| Source | Publisher | Verified observation and use |
|---|---|---|
| [World Health Organization](https://www.who.int/) | World Health Organization | HTTP 200 on 2026-09-07; English root with `lang="en"`, labeled language selector, native-language options including 中文, and explicit English/Chinese homepage destinations (`/home` and `/zh/home`). Used as a manual language-choice and stable-route pattern. |
| [Understanding SC 3.1.1: Language of Page](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html) | W3C Web Accessibility Initiative | HTTP 200 on 2026-09-07; default human language of each page must be programmatically determinable for correct user-agent and assistive-technology handling. |

## Local source inspected

- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\layouts\FlagshipLayout.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipBreadcrumbs.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipCoursePage.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\components\FlagshipPracticePage.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\pages\zh\coaching\young-competition-speakers.astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\pages\zh\resources\[lesson].astro`
- `C:\Users\kai\Documents\ChatGPT\SpeakKai\website-worktrees\speakkai-flagship-30\src\data\publicRoutes.ts`

## Unavailable or unverified

- No Chinese homepage source or site-wide switch was created.
- Remaining Chinese audience landing pages, contact, resources index, schedule, tools and other practice translations remain unverified or unavailable as localized routes; the memo treats them as English-only fallbacks rather than assuming coverage.
- No claim about WHO’s translation completeness or SpeakKai’s Chinese translation quality, SEO performance, search indexing, analytics, or user preference behavior was established.
