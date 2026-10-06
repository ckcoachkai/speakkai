import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

const base = fileURLToPath(new URL(process.argv.includes('--dist') ? '../dist/maze/' : '../public/maze/', import.meta.url));
const hash = data => createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(await readFile(resolve(base, 'manifest.json'), 'utf8'));
const html = await readFile(resolve(base, 'index.html'), 'utf8');
assert.equal(hash(html), manifest.pageSha256);
assert.equal(manifest.mouseOutfits, 30);
assert.equal(manifest.catOutfits, 6);
assert.equal(manifest.files.length, 23);
assert.match(html, /rel="canonical" href="https:\/\/speakkai\.com\/maze\/"/);
assert(!/data:(image|audio)\//.test(html), 'Media must be cacheable external files');
assert(!/file:\/\/|C:[\\/]Users[\\/]/i.test(html), 'Published page must not contain machine-local file paths');
const originalUris = new Map();
for (const file of manifest.files) {
  assert.match(file.path, /^assets\/[A-Za-z0-9-]+\.[a-f0-9]{12}\.(webp|mp3)$/);
  const data = await readFile(resolve(base, file.path));
  assert.equal(data.length, file.bytes, file.path);
  assert.equal(hash(data), file.sha256, file.path);
  originalUris.set(file.path, `data:${file.type};base64,${data.toString('base64')}`);
}
const images = html.match(/window\.MOUSE_MAZE_ASSETS=(\{.*?\});(?=window\.MOUSE_MAZE_CHARACTER_ART=)/);
assert(images);
const hostedImages = JSON.parse(images[1]);
assert.equal(Object.keys(hostedImages).length, 22);
assert(hostedImages.anatomy, 'Detailed anatomy artwork is required');
assert(hostedImages.alienAnatomy, 'Fictional alien anatomy artwork is required');
assert(hostedImages.crawlers, 'Detailed crawler artwork is required');
const embeddedImages = {};
for (const [name, url] of Object.entries(hostedImages)) {
  assert(originalUris.has(url), name);
  embeddedImages[name] = originalUris.get(url);
}
const music = html.match(/window\.BACKGROUND_TRACK_DATA\s*=\s*"([^"]+)"/);
assert(music && originalUris.has(music[1]));
const restored = html.replace(images[0], `window.MOUSE_MAZE_ASSETS=${JSON.stringify(embeddedImages)};`)
  .replace(music[1], originalUris.get(music[1]))
  .replace('  <meta name="description" content="Dynamite Mice: a maze name picker with costumed mice, cheese boosts, a chasing cat, and speaker pauses.">\n  <link rel="canonical" href="https://speakkai.com/maze/">\n', '');
assert.equal(hash(restored), manifest.sourceSha256, 'Game logic and presentation must match the approved standalone version');
for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script[1]);
console.log('Maze verified: exact source parity, 30 mice, 6 cats, 22 images, song, and canonical route.');
