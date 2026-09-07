import { readFile, stat, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

// Conservative referenced-file inventory, not a network waterfall or Core Web Vitals test.
import { flagshipRoutes as routes } from "./flagship-routes.mjs";
const root = path.resolve("dist");
const origin = "https://speakkai.com";
const cache = new Map();
const aggregate = new Map();
const limits = { html: 30000, css: 50000, fonts: 120000, images: 400000, other: 10000, media: 2000000 };
function resolveLocal(value, parent = "/") {
  if (value.startsWith("data:")) return null; // Inline bytes already counted in HTML/CSS.
  const url = new URL(value, origin + parent);
  assert.equal(url.origin, origin, `Unexpected external asset: ${url.href}`);
  const decoded = decodeURIComponent(url.pathname);
  const file = path.resolve(root, "." + decoded);
  assert.ok(file.startsWith(root + path.sep), `Asset outside dist: ${value}`);
  return { file, url: url.pathname };
}
async function asset(value, parent) {
  const resolved = resolveLocal(value, parent);
  if (!resolved) return null;
  if (cache.has(resolved.url)) return cache.get(resolved.url);
  const bytes = await readFile(resolved.file);
  const kind = /\.css$/.test(resolved.url) ? "css" : /\.m?js$/.test(resolved.url) ? "js" : /\.(woff2?|ttf|otf)$/.test(resolved.url) ? "fonts" : /\.(png|jpe?g|webp|avif|svg|gif)$/.test(resolved.url) ? "images" : /\.(mp4|webm)$/.test(resolved.url) ? "media" : "other";
  const entry = { ...resolved, bytes: bytes.length, kind, text: ["css", "js"].includes(kind) ? bytes.toString("utf8") : "" };
  cache.set(resolved.url, entry);
  return entry;
}
function attribute(tag, name) { return tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1]; }
async function inventory(html, route) {
  const found = new Map();
  const add = async (value, parent = route) => {
    if (!value) return;
    const entry = await asset(value, parent);
    if (!entry || found.has(entry.url)) return;
    found.set(entry.url, entry);
    if (entry.kind === "css") {
      for (const match of entry.text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) await add(match[1], entry.url);
      for (const match of entry.text.matchAll(/@import\s+["']([^"']+)["']/g)) await add(match[1], entry.url);
    }
    if (entry.kind === "js") {
      for (const match of entry.text.matchAll(/(?:from\s*|import\s*\(?\s*)["']([^"']+\.m?js(?:\?[^"']*)?)["']/g)) await add(match[1], entry.url);
    }
  };
  for (const [tag] of html.matchAll(/<(?:img|video|source|script|link|astro-island)\b[^>]*>/g)) {
    if (tag.startsWith("<link") && !/rel="(?:stylesheet|modulepreload|preload)"/.test(tag)) continue;
    for (const key of ["src", "poster", "href", "component-url", "renderer-url"]) await add(attribute(tag, key));
    if (tag.startsWith("<video")) assert.ok(/controls/.test(tag) && /preload="none"/.test(tag) && !/autoplay|loop/.test(tag), `${route}: media must be user-controlled with no preload`);
    const srcset = attribute(tag, "srcset");
    if (srcset) for (const candidate of srcset.split(",")) await add(candidate.trim().split(/\s+/)[0]);
  }
  return found;
}
const rows = [];
for (const route of routes) {
  const html = await readFile(path.join(root, route, "index.html"), "utf8");
  const found = await inventory(html, route);
  const totals = { html: Buffer.byteLength(html), css: 0, js: 0, fonts: 0, images: 0, other: 0, media: 0 };
  for (const entry of found.values()) { totals[entry.kind] += entry.bytes; aggregate.set(entry.url, entry); }
  for (const [kind, limit] of Object.entries(limits)) assert.ok(totals[kind] <= limit, `${route} ${kind}: ${totals[kind]} > ${limit}`);
  const hasPractice = /component-export="default"/.test(html);
  const jsLimit = hasPractice ? 215000 : 8000;
  assert.ok(totals.js <= jsLimit, `${route} JS: ${totals.js} > ${jsLimit}`);
  assert.ok(!/<img\b[^>]*src="\/images\/speakkai-logo-header-source\.png"/.test(html), `${route}: original logo still rendered`);
  const logoTag = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]).find(tag => tag.includes("speakkai-logo"));
  assert.ok(logoTag && attribute(logoTag, "srcset") && attribute(logoTag, "sizes"), `${route}: responsive logo missing`);
  for (const entry of found.values()) if (entry.url.includes("speakkai-logo")) assert.ok(entry.bytes < 80000, `${route}: oversized logo ${entry.url}`);
  if (route === "/") assert.ok(!html.includes("<astro-island"), "Homepage hydration introduced");
  rows.push({ route, ...totals, assets: found.size });
}
async function totalArtifact(dir) {
  let bytes = 0;
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    bytes += item.isDirectory() ? await totalArtifact(file) : (await stat(file)).size;
  }
  return bytes;
}
console.log(JSON.stringify({ semantics: "Raw UTF-8/file bytes; every srcset candidate and CSS font fallback included conservatively. Inline assets are counted only in their containing file. Not selected-candidate transfer or field performance.", limits: { ...limits, staticJs: 8000, practiceJs: 215000, individualLogo: 80000 }, routes: rows, uniqueReferencedAssetBytes: [...aggregate.values()].reduce((sum, x) => sum + x.bytes, 0), publishedArtifactBytes: await totalArtifact(root), status: "PASS" }, null, 2));
