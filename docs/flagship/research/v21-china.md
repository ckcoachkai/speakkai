# V21 Chinese responsive-image benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only HTML asset inspection and recommendation. No SpeakKai product edits, builds, browser actions, or social-platform searches.

## One fresh official page

[高途](https://www.gaotu.cn/) returned HTTP 200 on 2026-09-07. The public title is `高途 - 名师出高途`. The fetched response included a responsive viewport declaration, `width=device-width, initial-scale=1`, and a text-first course entry with `选课中心`, `小学`, year-group choices, `实用英语`, `登录 / 注册`, and `下载APP`.

The same response exposed a practice entry in text: `刷题工具`, `今日已有3367人进行了刷题练习！`, `开始练习`, and `今日推荐`. These are useful structural observations only; the provider's user count and education claims are not independent evidence.

## Bounded image-markup observations

In the fetched HTML response (182,705 UTF-8 bytes), there were 21 `img` tags:

- 18 had a `src` attribute.
- 0 had `srcset`.
- 0 had an explicit `loading` attribute.
- 0 had `width` or `height` attributes.
- 0 `picture` and 0 `source` tags were present.
- Several tags repeated the same small arrow image; some app/service image tags had blank `src` values in the server HTML and were likely populated or handled by client code.

This is markup evidence from one response, not a transfer trace. It does not establish image bytes, load order, Core Web Vitals, mobile rendering, or speed. CSS backgrounds and client-side requests can still add media that is not represented by these `img` tags.

The page's text-first course and practice entry suggests a restrained first view: make the learner's route understandable with text and a clear action, then add supporting media where it carries information. The source's viewport also contains `maximum-scale=1` and `user-scalable=0`; that is an accessibility caution and should not be copied into SpeakKai.

## SpeakKai recommendations

For the current homepage, keep the existing hero and audience routes, but apply this asset policy when the page is edited:

- Give each meaningful image intrinsic `width` and `height` or an equivalent aspect-ratio box to prevent layout movement.
- Offer responsive candidates with `srcset` and `sizes`; do not send a desktop portrait to a narrow phone when a smaller candidate can preserve the same crop.
- Preload or prioritize only the visible hero image. Keep below-fold story, program, and supporting images lazy.
- Use SVG or CSS for repeated arrows and decorative marks instead of repeating raster assets. Keep meaningful image alt text; leave purely decorative images empty and explicitly decorative.
- Keep the first view text-first: audience, one-sentence offer, and one clear route should remain usable if supporting media is delayed.
- Preserve the current visual composition, crop, colors, and typography while changing image candidates and loading metadata. This is an asset-delivery recommendation, not a redesign.

For a small home-page example strip, use one lightweight card image only when it explains the practice. Link to the existing detail route for the full exercise; do not load a second full-resolution image merely to preview the same example.

## Proposed verification record for a later audit

Record actual network measurements separately from this benchmark:

1. Route and viewport used.
2. Image URL, rendered dimensions, transferred bytes, and selected `srcset` candidate.
3. Whether the image is eager, lazy, or preloaded.
4. Font requests and transferred bytes.
5. Any layout shift caused by missing dimensions.

Do not mark a performance budget as passed from HTML inspection alone. A later audit needs a fresh production-style load and an explicit measurement record.

## Scope and claim boundaries

Keep the confirmed Young Competition Speakers facts separate from image examples: **Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, and a supported three-minute final showcase**. Do not turn a restrained image treatment into a claim about learner outcomes, teaching quality, or a provider partnership.

No Bilibili, Zhihu, WeChat, Douyin, or Xiaohongshu search was performed for V21. Earlier bounded work recorded Bilibili CAPTCHA, Zhihu HTTP 403, WeChat article anti-spider redirects, Douyin's JavaScript shell, and unavailable Xiaohongshu search/account metrics; those limitations remain unrefreshed and provide no evidence here.

高途 is an accessible official education homepage checked on 2026-09-07. Its course, practice, user-count, and education statements are publisher-presented. Only the visible text-first entry and one-response image-markup observations are used. No visual rendering or performance result was claimed.
