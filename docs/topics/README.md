# September topic library

The public index is `/topic/`. Pages `/topic/1/` through `/topic/100/` are a September 1–14, 2026 snapshot. Page numbers are stable identifiers assigned chronologically; each story also has a rank within the 100-story library.

`src/data/topics.json` contains the 100 source-cited records. Every story includes expository/oratory directions, coaching age guidance, five lens scores, and deterministic ranks for overall potential, expository potential, original-oratory potential, logic and impact, and unusualness and impact. The notes distinguish publication dates from older underlying events and retain claim limitations.

The 12 original AI-generated conceptual illustrations in `public/topic/art/` cover related subject areas. Each story combines its subject illustration with three specific concept labels. They are not photographs, factual reconstructions, or diagrams to scale. Page captions state this. WebP files were resized and compressed from generated PNG originals without changing their artwork. Do not replace factual source citations with illustration attribution.

Run `npm run build` and `node scripts/check-topics.mjs`. The topic check verifies all 100 pages, speech and ranking fields, source links, illustrations, sequential navigation, canonicals, and sitemap entries. It also checks that the index server-rendered order starts with overall rank 1 and that the rank lens controls sort ascending with stable page-number tie breaks. Also run the existing release checks in `.github/workflows/deploy.yml`, then verify the live index, sample story pages, filters and images after GitHub Pages deploys.

The production content is static and remains readable without JavaScript. Filtering and sorting enhance the index. No student data, accounts, tracking, or personal disclosures are collected by these pages.
