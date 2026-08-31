import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const expected = {
  "src/pages/tests/[id].astro": "7F9C3697B19D4AD663C4FBFC17691F289A30242993F51CB20FD6722AD1C30869",
  "src/data/experimentLabV4.ts": "5CEF08E1D19E7B2978CE2637E7393672FD41C5D39E3526E1013AA5C58F5CF20F",
  "src/components/experiments-v4/ExperimentShell.astro": "88979845848F3EF072875D45B3AC89403AFC49597C30FC70BCF130650E689441",
  "src/components/experiments-v4/V4Navigator.astro": "2E67A47EE3413544A1518130721D95B5A3571D0AE8F7DCDE6DC117461B36C614",
  "src/components/experiments-v4/Portrait.astro": "7610427A0666530C52A3FBABC551BED530CCDC398D5FE9C88BED696FA5554CF0",
  "src/components/experiments-v4/families/CorporateExperiment.astro": "78FF65BBE3569E820C63553C80B3F348E67868E0D700E6666E7C8DD9CF40CE96",
  "src/components/experiments-v4/families/ModernExperiment.astro": "D8EC72FB2CB73BAC50E36AA01CECC5DB02C8F41640886C37380E257778F4929E",
  "src/components/experiments-v4/families/MotionExperiment.astro": "956DD2D6E8F2737A8FE58C30D8E6030AAAD08768ACBDF10F59D24E4A1A31691C",
  "src/styles/experiment-lab-v4.css": "95B040F6DF7D9303DD7C85DF1050C9DD3BA828AD28D7E7A3CFA9E805CBFE1BCA",
};

const failures = [];
for (const [relativePath, expectedHash] of Object.entries(expected)) {
  const absolutePath = path.join(process.cwd(), ...relativePath.split("/"));
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing.`);
    continue;
  }
  const actualHash = crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex").toUpperCase();
  if (actualHash !== expectedHash) failures.push(`${relativePath} changed (${actualHash}).`);
}

if (failures.length) {
  console.error("Original Test 1–4 baseline check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Original Test 1–4 baseline check passed (${Object.keys(expected).length} protected files).`);
