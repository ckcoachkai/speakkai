import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const failures = [];
const selected = [{ version: 1, source: 27 }, { version: 2, source: 47 }, { version: 3, source: 41 }, { version: 4, source: 43 }];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(fs.existsSync(dist), "dist/ is missing; run the site build before this check.");
const galleryPath = path.join(dist, "tests", "index.html");
assert(fs.existsSync(galleryPath), "Evolution gallery route is missing.");
if (fs.existsSync(galleryPath)) {
  const gallery = fs.readFileSync(galleryPath, "utf8");
  assert(gallery.includes("Homepage Evolution Lab"), "Gallery title must identify the evolution lab.");
  assert((gallery.match(/class="card"/g) || []).length === 14, "Gallery must contain exactly fourteen active version cards.");
  assert(gallery.includes("Versions 1–4"), "Gallery is missing the reference Versions 1–4 heading.");
  assert(gallery.includes("Versions 5–14"), "Gallery is missing the Version 3 refinement heading.");
  assert(!gallery.includes("Editable Versions 5–8"), "The retired visual-editor set must not appear in the gallery.");
}

for (const { version, source } of selected) {
  const htmlPath = path.join(dist, "tests", String(version), "index.html");
  assert(fs.existsSync(htmlPath), `Original route missing: /tests/${version}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes(`data-test-number="${version}"`), `Original Version ${version} route identity is missing.`);
  assert(html.includes(`data-source-number="${source}"`), `Original Version ${version} must preserve source ${source}.`);
  assert(!html.includes("data-editor-launch"), `Original Version ${version} must remain editor-free.`);
  assert(html.includes("data-mobile-preview"), `Original Version ${version} needs a mobile preview control.`);
}

for (let version = 5; version <= 14; version += 1) {
  const htmlPath = path.join(dist, "tests", String(version), "index.html");
  assert(fs.existsSync(htmlPath), `Version 3 refinement route missing: /tests/${version}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes(`data-test-number="${version}"`), `Refinement Version ${version} route identity is missing.`);
  assert(html.includes('data-source-number="41"'), `Refinement Version ${version} must derive from Version 3 source 41.`);
  assert(!html.includes("data-editor-launch"), `Refinement Version ${version} must remain editor-free.`);
  assert(html.includes("data-mobile-preview"), `Refinement Version ${version} needs a mobile preview control.`);
}

for (let removed = 15; removed <= 50; removed += 1) assert(!fs.existsSync(path.join(dist, "tests", String(removed), "index.html")), `Retired route still exists: /tests/${removed}/`);
assert(!fs.existsSync(path.join(dist, "tests", "archive", "v3-parent-command-center", "index.html")), "Retired V3 archive must not remain public.");

const retiredLegacyRoutes = ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test9", "test10", "testa", "concept-lab/home", "concept-lab/test1", "concept-lab/test2", "concept-lab/test3", "concept-lab/test4", "concept-lab/test5", "concept-lab/test6", "concept-lab/test7", "concept-lab/test9", "concept-lab/test10", "concept-lab/testa"];
for (const route of retiredLegacyRoutes) assert(!fs.existsSync(path.join(dist, ...route.split("/"), "index.html")), `Retired legacy route still exists: /${route}/`);

if (failures.length) {
  console.error(`Homepage evolution check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Homepage evolution check passed: four references plus ten Version 3 refinements, all with mobile preview controls.");
