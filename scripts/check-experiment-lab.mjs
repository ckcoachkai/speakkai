import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const failures = [];
const selected = [
  { version: 1, source: 27 },
  { version: 2, source: 47 },
  { version: 3, source: 41 },
  { version: 4, source: 43 },
];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(fs.existsSync(dist), "dist/ is missing; run the site build before this check.");

const galleryPath = path.join(dist, "tests", "index.html");
assert(fs.existsSync(galleryPath), "Shortlist gallery route is missing.");
if (fs.existsSync(galleryPath)) {
  const gallery = fs.readFileSync(galleryPath, "utf8");
  assert(gallery.includes("Four Homepage Directions"), "Gallery title must identify the four-version shortlist.");
  assert((gallery.match(/class="card"/g) || []).length === 4, "Gallery must contain exactly four version cards.");
  assert(!gallery.includes("Preserved earlier routes"), "Legacy experiments must not remain in the public shortlist.");
  assert(!gallery.includes("All 30"), "The retired 30-concept filter must not remain in the public shortlist.");
}

for (const { version, source } of selected) {
  const htmlPath = path.join(dist, "tests", String(version), "index.html");
  assert(fs.existsSync(htmlPath), `Version route missing: /tests/${version}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes('name="robots" content="noindex, nofollow"'), `Version ${version} must remain noindex.`);
  assert(html.includes(`<title>Version ${version}:`), `Version ${version} title metadata is missing.`);
  assert(html.includes(`data-test-number="${version}"`), `Version ${version} route identity is missing.`);
  assert(html.includes(`data-source-number="${source}"`), `Version ${version} must preserve source ${source}.`);
  assert(html.includes("<h1"), `Version ${version} needs an H1.`);
  for (const selector of ["experiment-root", "brand", "primary-message", "portrait", "primary-cta", "test-switcher"]) {
    assert(html.includes(`data-qa="${selector}"`), `Version ${version} needs the ${selector} selector.`);
  }
  assert(html.includes('data-single-screen="true"'), `Version ${version} must retain the single-screen desktop shell.`);
  for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = match[1];
    if (!src.startsWith("/")) continue;
    assert(fs.existsSync(path.join(dist, ...src.slice(1).split("/"))), `Version ${version} references missing image ${src}.`);
  }
}

for (let removed = 5; removed <= 50; removed += 1) {
  assert(!fs.existsSync(path.join(dist, "tests", String(removed), "index.html")), `Retired route still exists: /tests/${removed}/`);
}
assert(!fs.existsSync(path.join(dist, "tests", "archive", "v3-parent-command-center", "index.html")), "Retired V3 archive must not remain public.");

const retiredLegacyRoutes = [
  "test", "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test9", "test10", "testa",
  "concept-lab/home", "concept-lab/test1", "concept-lab/test2", "concept-lab/test3", "concept-lab/test4",
  "concept-lab/test5", "concept-lab/test6", "concept-lab/test7", "concept-lab/test9", "concept-lab/test10", "concept-lab/testa",
];
for (const route of retiredLegacyRoutes) {
  assert(!fs.existsSync(path.join(dist, ...route.split("/"), "index.html")), `Retired legacy route still exists: /${route}/`);
}

if (failures.length) {
  console.error(`Experiment shortlist check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Experiment shortlist check passed.");
console.log("Public mapping: Version 1 ← 27, Version 2 ← 47, Version 3 ← 41, Version 4 ← 43.");
console.log("Routes: 4 active shortlist versions; all retired experiment and archive routes are absent.");
