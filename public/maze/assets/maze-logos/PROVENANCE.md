# Maze company logos

10,240 distinct source company/brand IDs, packed in 80 local lossless WebP atlases. All accepted IDs have a public stock-exchange listing in the upstream metadata. Brand labels are source slugs converted to readable text, not a legal-entity database.

Source: [tradient0/companies-logo](https://github.com/tradient0/companies-logo), pinned at [b8d75c2855a682f8866d9fc35aa8e894519d4801](https://github.com/tradient0/companies-logo/tree/b8d75c2855a682f8866d9fc35aa8e894519d4801). The upstream project provides stock-company logos; SVG files carry TradingView attribution. The bundled atlases rasterize those supplied SVGs without redrawing or inventing marks.

## Counting

131,280 upstream exchange listings were collapsed to one source slug per company/brand. We then excluded obvious funds, ETFs, notes, index/currency/security products; normalized corporate suffixes and share-class variants for duplicate checking; and rejected duplicate SVG hashes, duplicate rendered pixel hashes, text placeholders, external-resource SVGs, empty and flat-color renders. The 10,240 entries have unique IDs, normalized names, source SVG hashes and rendered pixel hashes. A repeated logo across exchanges is never counted twice. Several separately listed companies may share a corporate-group logo; identical marks are deliberately represented once. This is a company/brand-mark catalog and is not an independently audited company legal registry.

## Rights and attribution

Company logos remain trademarks/copyrights of their respective owners. The upstream README describes its project as MIT but supplies no LICENSE file in this revision; no license to the underlying marks is asserted.

Each runtime entry contains its unique source company/brand ID, readable label and atlas coordinates. The build audit retains representative exchange tickers, original SVG Git blob SHAs and rendered mark SHA-256 hashes; aggregate uniqueness counts are included in catalog-report.json. Its exact original URL is formed by replacing {id} in source.logoUrlTemplate. The source metadata URL and pinned repository revision are recorded in the manifest.

## Rendering

Each tile is 64×64 pixels, with the original mark centered within 52×52 pixels on an opaque neutral card. Nearly white marks receive a dark card. No remote tracking, key, API account, runtime hotlink or external SVG resource is used. Each atlas contains up to 128 entries. Only the atlas pages used by a maze need to be loaded.
