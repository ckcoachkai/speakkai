import sharp from "sharp";
import { stat } from "node:fs/promises";

// Deterministic display-size derivatives of the existing published portrait.
// Preserve the original 1400px file for large displays and existing URLs.
for (const width of [360, 720, 1080]) {
  const output = `public/images/coach-kai-headshot-${width}.webp`;
  await sharp("public/images/coach-kai-headshot.webp")
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, effort: 6 })
    .toFile(output);
  console.log(`${width}px: ${(await stat(output)).size} bytes`);
}
