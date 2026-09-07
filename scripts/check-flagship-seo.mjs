import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import { structuredData } from "../src/lib/structuredData.mjs";

const routes = ["/", "/coaching/", "/schools/", "/companies/", "/contact/", "/resources/", "/coaching/young-competition-speakers/", "/resources/one-object-story/", "/resources/explain-then-swap/", "/resources/one-minute-brief/", "/zh/coaching/young-competition-speakers/", "/zh/resources/one-object-story/"];
for (const route of routes) {
  const html = await readFile(`dist${route}index.html`, "utf8");
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(match, `${route}: graph missing`);
  const graph = JSON.parse(match[1])["@graph"];
  const page = graph.find(
    (x) => x["@id"] === `https://speakkai.com${route}#page`,
  );
  assert.equal(page.url, `https://speakkai.com${route}`);
  assert.equal(page.inLanguage, route.startsWith("/zh/") ? "zh-CN" : "en");
  assert.equal(
    graph.find((x) => x["@type"] === "Organization").name,
    "SpeakKai",
  );
  assert.equal(graph.find((x) => x["@type"] === "Person").name, "Kai Liu");
  assert.ok(
    html.includes(page.description.replaceAll("&", "&amp;")) ||
      html.includes(page.description),
  );
  assert.doesNotMatch(
    match[1],
    /aggregateRating|reviewCount|priceCurrency|award/,
  );
  if (route === "/contact/") assert.equal(page["@type"], "ContactPage");
  if (["/coaching/", "/schools/", "/companies/"].includes(route)) {
    assert.ok(graph.some((x) => x["@type"] === "Service"));
    assert.ok(graph.some((x) => x["@type"] === "BreadcrumbList"));
    assert.match(html, /aria-label="Breadcrumb"/);
  }
}
const xml = await readFile("dist/sitemap.xml", "utf8");
assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
assert.equal(urls.length, new Set(urls).size);
for (const route of routes)
  assert.ok(urls.includes(`https://speakkai.com${route}`));
for (const url of urls) {
  const path = new URL(url).pathname;
  assert.doesNotMatch(path, /test|schedule|malatrip|speak-lab|^\/i\//);
  assert.ok((await stat(`dist${path}index.html`)).isFile());
  assert.doesNotMatch(
    await readFile(`dist${path}index.html`, "utf8"),
    /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/,
  );
}
assert.match(
  await readFile("dist/robots.txt", "utf8"),
  /Sitemap: https:\/\/speakkai.com\/sitemap.xml/,
);
const missing = await readFile("dist/404.html", "utf8");
assert.match(missing, /<meta name="robots" content="noindex"/);
assert.equal((missing.match(/<h1(?:\s|>)/g) || []).length, 1);
for (const route of [
  "/coaching/",
  "/schools/",
  "/companies/",
  "/resources/",
  "/contact/",
])
  assert.ok(missing.includes(`href="${route}"`));
const safe = structuredData({
  path: "/",
  title: "</script><img src=x>",
  description: "Plain test",
});
assert.ok(!safe.includes("</script>"));
assert.equal(
  JSON.parse(safe)["@graph"].find((x) => x["@type"] === "WebPage").name,
  "</script><img src=x>",
);
console.log(
  `SEO PASS: ${routes.length} graphs, ${urls.length} sitemap targets, 404 recovery, robots and safe serialization.`,
);
