import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Import an approved standalone game, preserving its code while moving its
// embedded media into cacheable, content-addressed same-origin files.
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/import-dynamite-mice.mjs path/to/game.html');
const output = fileURLToPath(new URL('../public/maze/', import.meta.url));
const source = await readFile(resolve(input), 'utf8');
const sha256 = data => createHash('sha256').update(data).digest('hex');
const imageMatch = source.match(/window\.MOUSE_MAZE_ASSETS=(\{.*?\});(?=window\.MOUSE_MAZE_CHARACTER_ART=)/);
const characterMatch = source.match(/window\.MOUSE_MAZE_CHARACTER_ART=(\{.*?\});(?=window\.MOUSE_MAZE_LICE_ART=)/);
const musicMatch = source.match(/window\.BACKGROUND_TRACK_DATA\s*=\s*"(data:audio\/mpeg;base64,[A-Za-z0-9+/=]+)"/);
if (!imageMatch || !characterMatch || !musicMatch) throw new Error('Missing game media or wardrobe data');
const images = JSON.parse(imageMatch[1]);
const characters = JSON.parse(characterMatch[1]);
if (Object.keys(images).length !== 21 || !images.anatomy || !images.alienAnatomy || characters.mouse.length !== 30 || characters.cat.length !== 6) throw new Error('Expected the complete v9 cast and both anatomy atlases');
await mkdir(resolve(output, 'assets'), { recursive: true });
const files = [];
async function media(name, uri, type, extension) {
  const prefix = `data:${type};base64,`;
  if (!uri.startsWith(prefix)) throw new Error(`Invalid ${name} media type`);
  const bytes = Buffer.from(uri.slice(prefix.length), 'base64');
  const hash = sha256(bytes);
  const relative = `assets/${name}.${hash.slice(0, 12)}.${extension}`;
  await writeFile(resolve(output, relative), bytes);
  files.push({ path: relative, type, bytes: bytes.length, sha256: hash });
  return relative;
}
const hostedImages = {};
for (const [name, uri] of Object.entries(images)) hostedImages[name] = await media(name, uri, 'image/webp', 'webp');
const song = await media('mouse-maze-mayhem', musicMatch[1], 'audio/mpeg', 'mp3');
let html = source.replace(imageMatch[0], `window.MOUSE_MAZE_ASSETS=${JSON.stringify(hostedImages)};`)
  .replace(musicMatch[1], song)
  .replace('</head>', '  <meta name="description" content="Dynamite Mice: a maze name picker with costumed mice, cheese boosts, a chasing cat, and speaker pauses.">\n  <link rel="canonical" href="https://speakkai.com/maze/">\n</head>');
if (/data:(image|audio)\//.test(html)) throw new Error('Unextracted embedded media remains');
await writeFile(resolve(output, 'index.html'), html);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ version: 9, sourceSha256: sha256(source), pageSha256: sha256(html), mouseOutfits: 30, catOutfits: 6, files }, null, 2) + '\n');
console.log(JSON.stringify({ route: '/maze/', pageBytes: Buffer.byteLength(html), mediaFiles: files.length, mediaBytes: files.reduce((sum, file) => sum + file.bytes, 0) }));
