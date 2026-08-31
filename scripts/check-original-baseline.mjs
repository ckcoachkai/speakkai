import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const expected = {
  "src/pages/tests/[id].astro": "78A3ADA56EC8E4D499705845608358B630B5FD4951BD8C9CCB3BDC648705B74F",
  "src/data/experimentLabV4.ts": "11AAEC1A330C370354CCD5AEB59C5670B3238C47B1AA8DCFAE2CAE9923DBC002",
  "src/components/experiments-v4/ExperimentShell.astro": "6D8F2DA80FDD485E5F2D668F3B29FE3B6AAAF47438266F6A04E7DD2E7511E860",
  "src/components/experiments-v4/V4Navigator.astro": "0ECD656EA1FB54ADA5C46831ABBAB3DAF8FC1629C8CE55F49219648C84A66C67",
  "src/components/experiments-v4/Portrait.astro": "7610427A0666530C52A3FBABC551BED530CCDC398D5FE9C88BED696FA5554CF0",
  "src/components/experiments-v4/families/CorporateExperiment.astro": "78FF65BBE3569E820C63553C80B3F348E67868E0D700E6666E7C8DD9CF40CE96",
  "src/components/experiments-v4/families/ModernExperiment.astro": "D8EC72FB2CB73BAC50E36AA01CECC5DB02C8F41640886C37380E257778F4929E",
  "src/components/experiments-v4/families/MotionExperiment.astro": "956DD2D6E8F2737A8FE58C30D8E6030AAAD08768ACBDF10F59D24E4A1A31691C",
  "src/styles/experiment-lab-v4.css": "667B45B50112A952C886DC8FEDDF5B772FDD4220A53955123CE002F62A8B9FC0",
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
