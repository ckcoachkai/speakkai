import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { flagshipRoutes } from "./flagship-routes.mjs";

const root = path.resolve("dist");
const routes = process.argv.slice(2).length ? process.argv.slice(2) : flagshipRoutes;
const decodeAttribute = value => value.replace(/&(?:#(x[0-9a-f]+|[0-9]+)|(amp|quot|apos|lt|gt));/gi, (match, numeric, named) => {
  if (numeric) {
    const point = numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : Number(numeric);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
  }
  return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" }[named.toLowerCase()];
});
const results = [];
for (const route of routes) {
  const file = path.join(root, route, "index.html");
  const html = await readFile(file, "utf8");
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `${route}: expected one h1`,
  );
  assert.match(html, /<html[^>]+lang="[a-z-]+"/i, `${route}: language`);
  assert.match(
    html,
    /<meta name="description" content=".{40,}"/i,
    `${route}: description`,
  );
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/speakkai.com\//,
    `${route}: canonical`,
  );
  assert.match(
    html,
    /<meta name="speakkai-version" content="\d{2}"/,
    `${route}: release marker`,
  );
  assert.doesNotMatch(
    html,
    /\b(?:TODO|lorem ipsum|your-logo-here)\b/i,
    `${route}: unresolved content`,
  );
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const targets = [
    ...new Set(
      [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((u) => u.startsWith("/") || u.startsWith("#")),
    ),
  ];
  for (const target of targets) {
    const url = new URL(decodeAttribute(target), `https://speakkai.com${route}`);
    const isPage = !path.extname(url.pathname);
    const local = path.join(root, url.pathname, isPage ? "index.html" : "");
    const info = await stat(local).catch(() => null);
    assert(info?.isFile(), `${route}: missing local target ${target}`);
    if (url.hash && isPage) {
      const targetHtml = url.pathname === route ? html : await readFile(local, "utf8");
      const targetIds = url.pathname === route ? ids : new Set([...targetHtml.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
      assert(targetIds.has(decodeURIComponent(url.hash.slice(1))), `${route}: broken anchor ${target}`);
    }
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    // Astro's image serializer may emit a bare alt attribute for alt="".
    assert.match(image[0], /\salt(?:="[^"]*"|(?=\s|\/?>))/, `${route}: image missing alt`);
    assert.match(
      image[0],
      /\bwidth="\d+"/,
      `${route}: image missing reserved width`,
    );
    assert.match(
      image[0],
      /\bheight="\d+"/,
      `${route}: image missing reserved height`,
    );
  }
  results.push({
    route,
    htmlBytes: Buffer.byteLength(html),
    checkedLocalTargets: targets.length,
    status: "PASS",
  });
}
await mkdir("output/flagship", { recursive: true });
await writeFile(
  "output/flagship/static-audit.json",
  JSON.stringify({ time: new Date().toISOString(), results }, null, 2),
);
console.log(JSON.stringify(results, null, 2));
