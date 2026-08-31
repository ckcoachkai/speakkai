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
  assert((gallery.match(/class="card"/g) || []).length === 8, "Gallery must contain exactly eight active version cards.");
  for (const label of ["Original Versions 1–4", "Editable Versions 5–8"]) assert(gallery.includes(label), `Gallery is missing ${label}.`);
}

for (const { version, source } of selected) {
  const htmlPath = path.join(dist, "tests", String(version), "index.html");
  assert(fs.existsSync(htmlPath), `Original route missing: /tests/${version}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes(`data-test-number="${version}"`), `Original Version ${version} route identity is missing.`);
  assert(html.includes(`data-source-number="${source}"`), `Original Version ${version} must preserve source ${source}.`);
  assert(!html.includes("data-editor-launch"), `Original Version ${version} must remain editor-free.`);
}

for (let version = 5; version <= 8; version += 1) {
  const htmlPath = path.join(dist, "tests", String(version), "index.html");
  assert(fs.existsSync(htmlPath), `Editable-copy route missing: /tests/${version}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes(`data-editor-version="${version}"`), `Editable Version ${version} identity is missing.`);
  assert(html.includes(`data-original-version="${version - 4}"`), `Editable Version ${version} must map to Original Version ${version - 4}.`);
  assert(html.includes("data-editor-launch"), `Editable Version ${version} needs an Edit Page control.`);
  assert(html.includes("/scripts/editor-bootstrap.js"), `Editable Version ${version} needs the lightweight state bootstrap.`);
}

for (let version = 9; version <= 12; version += 1) {
  const htmlPath = path.join(dist, "tests", String(version), "index.html");
  assert(fs.existsSync(htmlPath), `Legacy rollback route missing: /tests/${version}/`);
}

for (let removed = 13; removed <= 50; removed += 1) assert(!fs.existsSync(path.join(dist, "tests", String(removed), "index.html")), `Retired route still exists: /tests/${removed}/`);
assert(!fs.existsSync(path.join(dist, "tests", "archive", "v3-parent-command-center", "index.html")), "Retired V3 archive must not remain public.");

const retiredLegacyRoutes = ["test1", "test2", "test3", "test4", "test5", "test6", "test7", "test9", "test10", "testa", "concept-lab/home", "concept-lab/test1", "concept-lab/test2", "concept-lab/test3", "concept-lab/test4", "concept-lab/test5", "concept-lab/test6", "concept-lab/test7", "concept-lab/test9", "concept-lab/test10", "concept-lab/testa"];
for (const route of retiredLegacyRoutes) assert(!fs.existsSync(path.join(dist, ...route.split("/"), "index.html")), `Retired legacy route still exists: /${route}/`);

if (failures.length) {
  console.error(`Homepage evolution check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Homepage evolution check passed: four original references, four editable twins, eight active gallery entries, and four unlisted rollback routes.");
