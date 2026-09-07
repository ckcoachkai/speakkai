# V15 Chinese lightweight homepage benchmark

Checked: 2026-09-07 (Asia/Shanghai). Read-only research and performance recommendation. No SpeakKai product edits, builds, browser actions, submissions, or social-platform retries.

## One fresh official reference

[51Talk](https://www.51talk.com/) returned HTTP 200. Its public title is `51Talk是全球化的在线青少英语教育品牌`. The initial HTML was 62,241 UTF-8 bytes and included a responsive viewport declaration: `width=device-width, initial-scale=1`.

The first text sequence in the HTML is compact and easy to scan:

1. Navigation and a registration entry: `注册` and `课程体系`.
2. Hero message: `让每个人都有对话世界的能力`.
3. Offer description: `真人外师一对一在线课程`.
4. Supporting proof text: `10年美股上市+15年教育品牌`.
5. Next section heading: `我们有哪些优势`.

The page also exposes clear utility entries later in the document: `下载APP`, `下载PC在线教室`, and `立即下载`. This provides a useful mobile-entry pattern: retain one short primary entry in the first view and keep the app or class-tool route discoverable as a secondary action.

This is an HTTP/HTML observation, not mobile visual QA. It does not prove the rendered layout, Core Web Vitals, or actual user behavior on a phone.

## Image and font transfer signals

The response contained 33 `img` tags. The first hero image in document order had alt text `让每个人都有对话世界的能力`; its CDN response was `image/png`, 528,656 bytes. Two later sample images were 57,842 bytes and 52,234 bytes. The HTML did not expose an explicit `loading` attribute on the sampled image tags.

The page preloaded multiple Nuxt JavaScript and CSS files. No font URL, `.woff`, `.woff2`, `.ttf`, or Google Fonts reference appeared in the HTML scan. These are source-page observations only; they are not a claim that every resource was transferred during a real mobile visit.

The performance lesson for SpeakKai is narrow: preserve the first-view message and action hierarchy while ensuring that below-fold imagery and unnecessary font files do not compete with the first useful content. A large hero image can keep its composition and visual role while receiving a responsive, compressed variant.

## Proposed V15 budgets for SpeakKai

These are proposed guardrails for the built homepage, not measurements of the current checkout. Measure transferred bytes from a fresh production-style page load and report failures with the asset URL and route.

- Eager first-view images: **≤ 300 KB compressed total**. Prefer one responsive hero candidate; do not fetch desktop and mobile variants together.
- All homepage images after normal below-fold loading: **≤ 1.0 MB compressed total**. Load later content lazily and use width-appropriate `srcset` candidates.
- Font transfer on the first load: **≤ 100 KB total**. Keep the existing visual family; use system fonts or a subsetted local WOFF2 where the design already requires it. Avoid adding a new family or preloading every weight.
- First-view preload hints: at most one hero image and one required font file. A preload should correspond to an element visible in the first view.
- Image behavior: retain intrinsic dimensions or aspect-ratio boxes, preserve the existing crop and layout, and use `loading="lazy"` for below-fold images. These are implementation checks, not reasons to remove designed content.

The 300 KB hero budget is intentionally below the 528,656-byte sample hero observed on 51Talk. It is a proposed SpeakKai target, not a claim about 51Talk quality or a universal web standard.

## Mobile entry recommendation

Keep the existing direct contact route visible in the Chinese course contact area. Pair it with one compact helper link such as `课程咨询准备` from V14, while keeping the direct QR code or WeChat handle in view. If the homepage has a separate first-view CTA, use a short label such as `了解课程` or `咨询课程`; choose one primary label and avoid presenting multiple equal-weight buttons above the fold.

Recommended small-screen boundary copy for the helper remains:

> 这是一份中文咨询准备稿，帮助你整理年级、表达目标和时间范围。内容可编辑，也可以复制到微信；不会自动发送消息、预约课程或确认名额。请使用页面提供的微信二维码或账号自行联系。

The helper should not add a new image, external font, or third-party widget to the first view. Its editable fields and manual-copy action can remain lightweight text and native controls.

## Parity and implementation boundaries

- Preserve the current visual design, hero composition, course wording, and Chinese direct-contact route while optimizing file variants and loading priority.
- Treat byte thresholds above as budgets to enforce in the V15 performance audit. They are not current pass/fail results because this research did not build or measure the SpeakKai checkout.
- Do not claim a mobile layout passed without fresh rendered mobile verification.
- Do not add Chinese course outcomes, fees, guarantees, certificates, teacher claims, or new contact identifiers.
- Keep the confirmed course facts unchanged: **Young Competition Speakers, Fall 2026, Grades 1–2, 18 classes, six three-class units, 60–90-second practice speeches, and a supported three-minute final showcase**.

## Source limits

51Talk is an accessible official public education homepage checked on 2026-09-07. Its education, teacher, quality, and brand statements are publisher-presented claims; they are used here only for visible hierarchy and contact-entry structure. Byte counts are limited to the fetched HTML and three sampled CDN responses, and do not represent a full performance trace. No broader Chinese social-platform search was performed.
