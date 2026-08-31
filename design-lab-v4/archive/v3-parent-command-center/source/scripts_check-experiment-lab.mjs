import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "src", "data", "experimentLab.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const reviewSource = fs.readFileSync(path.join(root, "src", "data", "experimentReviews.ts"), "utf8");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const ids = [...source.matchAll(/\bid:\s*(\d+),\s*name:/g)].map((match) => Number(match[1]));
const expected = Array.from({ length: 30 }, (_, index) => index + 21);
assert(ids.length === 30, `Expected 30 experiment records; found ${ids.length}.`);
assert(new Set(ids).size === ids.length, "Experiment IDs must be unique.");
assert(expected.every((id) => ids.includes(id)), "Experiment IDs must cover every number from 21 through 50.");

const reviewIds = [...reviewSource.matchAll(/\{ id:\s*(\d+),\s*visualImpact:/g)].map((match) => Number(match[1]));
assert(reviewIds.length === 30, `Expected 30 review scorecards; found ${reviewIds.length}.`);
assert(expected.every((id) => reviewIds.includes(id)), "Review scorecards must cover every number from 21 through 50.");
for (const match of reviewSource.matchAll(/(?:visualImpact|originality|brandFit|parentAppeal|studentAppeal|customerAppeal|clarity|trust|conversion|ux|imageUsage|motionQuality|responsiveness|accessibility|technicalQuality|performance):\s*(\d+)/g)) {
  const value = Number(match[1]);
  assert(value >= 1 && value <= 10, `Review score ${match[1]} is outside the 1–10 range.`);
}

const stakeholderCounts = { Parent: 0, Student: 0, Customer: 0, Mixed: 0 };
for (const match of source.matchAll(/\bprimary:\s*"(Parent|Student|Customer|Mixed)"/g)) {
  stakeholderCounts[match[1]] += 1;
}
assert(stakeholderCounts.Parent >= 7, `Expected at least 7 Parent-first concepts; found ${stakeholderCounts.Parent}.`);
assert(stakeholderCounts.Student >= 7, `Expected at least 7 Student-first concepts; found ${stakeholderCounts.Student}.`);
assert(stakeholderCounts.Customer >= 7, `Expected at least 7 Customer-first concepts; found ${stakeholderCounts.Customer}.`);

const requiredLegacyRoutes = [
  "concept-lab/home",
  "concept-lab/test1", "concept-lab/test2", "concept-lab/test3", "concept-lab/test4", "concept-lab/test5",
  "concept-lab/test6", "concept-lab/test7", "concept-lab/test9", "concept-lab/test10", "concept-lab/testa",
  "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test9", "test10", "testa",
];

for (const route of requiredLegacyRoutes) {
  assert(fs.existsSync(path.join(root, "dist", ...route.split("/"), "index.html")), `Legacy route missing: /${route}/`);
}

assert(fs.existsSync(path.join(root, "dist", "tests", "index.html")), "Experiment gallery route is missing.");

for (const id of expected) {
  const htmlPath = path.join(root, "dist", "tests", String(id), "index.html");
  assert(fs.existsSync(htmlPath), `Experiment route missing: /tests/${id}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes('name="robots" content="noindex, nofollow"'), `Test ${id} must remain noindex.`);
  assert(html.includes(`<title>Test ${id}:`), `Test ${id} title metadata is missing.`);
  assert(html.includes("<h1"), `Test ${id} needs an H1.`);
  assert(html.includes("primary-action"), `Test ${id} needs a primary CTA.`);
  assert(html.includes("data-primary="), `Test ${id} needs primary stakeholder metadata.`);
  if (id >= 40) assert(html.includes("is-single-screen"), `Test ${id} must use the single-screen desktop shell.`);

  for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = match[1];
    if (!src.startsWith("/")) continue;
    assert(fs.existsSync(path.join(root, "dist", ...src.slice(1).split("/"))), `Test ${id} references missing image ${src}.`);
  }
}

if (failures.length) {
  console.error(`Experiment lab check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Experiment lab check passed.");
console.log(`Routes: ${expected.length} new + ${requiredLegacyRoutes.length} preserved checks.`);
console.log(`Primary stakeholder balance: Parent ${stakeholderCounts.Parent}, Student ${stakeholderCounts.Student}, Customer ${stakeholderCounts.Customer}, Mixed ${stakeholderCounts.Mixed}.`);
