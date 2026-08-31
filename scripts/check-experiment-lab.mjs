import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "design-lab-v4", "config", "experiments.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const experiments = registry.experiments;
const scorecards = JSON.parse(fs.readFileSync(path.join(root, "design-lab-v4", "evidence", "review-scorecards.json"), "utf8"));
const contentSource = fs.readFileSync(path.join(root, "src", "data", "experimentLabV4.ts"), "utf8");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const expected = Array.from({ length: 30 }, (_, index) => index + 21);
const numbers = experiments.map((item) => item.number);
assert(experiments.length === 30, `Expected 30 V4 records; found ${experiments.length}.`);
assert(new Set(numbers).size === 30, "V4 experiment numbers must be unique.");
assert(expected.every((number) => numbers.includes(number)), "V4 experiments must cover Tests 21–50.");
assert(new Set(experiments.map((item) => item.slug)).size === 30, "V4 experiment slugs must be unique.");
assert(new Set(experiments.map((item) => item.title)).size === 30, "V4 experiment titles must be unique.");

const familyCounts = experiments.reduce((counts, item) => {
  counts[item.family] = (counts[item.family] || 0) + 1;
  return counts;
}, {});
assert(familyCounts.corporate === 10, `Expected 10 corporate concepts; found ${familyCounts.corporate || 0}.`);
assert(familyCounts["fun-motion"] === 10, `Expected 10 fun-motion concepts; found ${familyCounts["fun-motion"] || 0}.`);
assert(familyCounts.modern === 10, `Expected 10 modern concepts; found ${familyCounts.modern || 0}.`);

const categoryCounts = { parent: 0, student: 0, customer: 0, mixed: 0 };
for (const item of experiments) {
  const value = item.primary_stakeholder.toLowerCase();
  if (value.includes("mixed")) categoryCounts.mixed += 1;
  else if (value.includes("student")) categoryCounts.student += 1;
  else if (value.includes("parent")) categoryCounts.parent += 1;
  else categoryCounts.customer += 1;
  assert(contentSource.includes(`${item.number}: {`), `Missing verified-boundary content for Test ${item.number}.`);
}
assert(categoryCounts.parent >= 7, `Expected at least 7 Parent-first concepts; found ${categoryCounts.parent}.`);
assert(categoryCounts.student >= 7, `Expected at least 7 Student-first concepts; found ${categoryCounts.student}.`);
assert(categoryCounts.customer >= 7, `Expected at least 7 Customer-first concepts; found ${categoryCounts.customer}.`);

assert(scorecards.dimensions.length === 14, `Expected 14 V4 score dimensions; found ${scorecards.dimensions.length}.`);
assert(scorecards.reviews.length === 30, `Expected 30 V4 review scorecards; found ${scorecards.reviews.length}.`);
for (const review of scorecards.reviews) {
  assert(review.scores.length === 14, `Test ${review.test} must have 14 review scores.`);
  assert(review.scores.every((score) => Number.isInteger(score) && score >= 1 && score <= 10), `Test ${review.test} contains a score outside 1–10.`);
  const average = review.scores.reduce((sum, score) => sum + score, 0) / review.scores.length;
  assert(average >= 7, `Test ${review.test} average ${average.toFixed(2)} is below the retain gate.`);
  assert(review.scores[3] >= 8, `Test ${review.test} primary stakeholder fit is below 8.`);
  assert(review.scores[4] >= 7, `Test ${review.test} clarity is below 7.`);
  assert(review.scores[11] >= 7, `Test ${review.test} accessibility is below 7.`);
}

for (let leftIndex = 0; leftIndex < experiments.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < experiments.length; rightIndex += 1) {
    const left = experiments[leftIndex];
    const right = experiments[rightIndex];
    const keys = Object.keys(left.signature).filter((key) => key in right.signature);
    const differences = keys.filter((key) => left.signature[key] !== right.signature[key]).length;
    assert(differences >= 6, `Tests ${left.number} and ${right.number} differ in only ${differences} signature dimensions.`);
  }
}

const requiredLegacyRoutes = [
  "concept-lab/home",
  "concept-lab/test1", "concept-lab/test2", "concept-lab/test3", "concept-lab/test4", "concept-lab/test5",
  "concept-lab/test6", "concept-lab/test7", "concept-lab/test9", "concept-lab/test10", "concept-lab/testa",
  "test1", "test2", "test3", "test4", "test5", "test6", "test7", "test9", "test10", "testa",
];

const dist = path.join(root, "dist");
assert(fs.existsSync(dist), "dist/ is missing; run the site build before this check.");
for (const route of requiredLegacyRoutes) {
  assert(fs.existsSync(path.join(dist, ...route.split("/"), "index.html")), `Legacy route missing: /${route}/`);
}

const galleryPath = path.join(dist, "tests", "index.html");
assert(fs.existsSync(galleryPath), "Experiment gallery route is missing.");
if (fs.existsSync(galleryPath)) {
  const gallery = fs.readFileSync(galleryPath, "utf8");
  assert(gallery.includes("Homepage Experiment Lab V4"), "Gallery must identify V4.");
  assert((gallery.match(/data-single-screen="true"/g) || []).length === 30, "Gallery must contain 30 single-screen V4 cards.");
}

for (const number of expected) {
  const htmlPath = path.join(dist, "tests", String(number), "index.html");
  assert(fs.existsSync(htmlPath), `V4 route missing: /tests/${number}/`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes('name="robots" content="noindex, nofollow"'), `Test ${number} must remain noindex.`);
  assert(html.includes(`<title>Test ${number}:`), `Test ${number} title metadata is missing.`);
  assert(html.includes("<h1"), `Test ${number} needs an H1.`);
  assert(html.includes('data-qa="experiment-root"'), `Test ${number} needs the experiment root selector.`);
  assert(html.includes('data-qa="brand"'), `Test ${number} needs the brand selector.`);
  assert(html.includes('data-qa="primary-message"'), `Test ${number} needs the primary-message selector.`);
  assert(html.includes('data-qa="portrait"'), `Test ${number} needs the portrait selector.`);
  assert(html.includes('data-qa="primary-cta"'), `Test ${number} needs the primary CTA selector.`);
  assert(html.includes('data-qa="test-switcher"'), `Test ${number} needs the test-switcher selector.`);
  assert(html.includes('data-single-screen="true"'), `Test ${number} must use the V4 single-screen desktop shell.`);

  for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = match[1];
    if (!src.startsWith("/")) continue;
    assert(fs.existsSync(path.join(dist, ...src.slice(1).split("/"))), `Test ${number} references missing image ${src}.`);
  }
}

const archivePath = path.join(dist, "tests", "archive", "v3-parent-command-center", "index.html");
assert(fs.existsSync(archivePath), "Renderable V3 Parent Command Center archive route is missing.");
if (fs.existsSync(archivePath)) {
  const archive = fs.readFileSync(archivePath, "utf8");
  assert(archive.includes("What will your child practise next?"), "V3 archive headline changed unexpectedly.");
}

if (failures.length) {
  console.error(`Experiment lab V4 check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Experiment lab V4 check passed.");
console.log(`Routes: 30 V4 + ${requiredLegacyRoutes.length} preserved + 1 archived reference.`);
console.log(`Families: corporate ${familyCounts.corporate}, fun-motion ${familyCounts["fun-motion"]}, modern ${familyCounts.modern}.`);
console.log(`Primary stakeholder balance: Parent ${categoryCounts.parent}, Student ${categoryCounts.student}, Customer ${categoryCounts.customer}, Mixed ${categoryCounts.mixed}.`);
