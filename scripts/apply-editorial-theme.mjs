import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
// CAT and the interactive games own their presentation. Keep their colors intact.
const protectedRoute = route => /(^|\/)(cat[^/]*|logopitch|logo-pitch)(\/|$)/i.test(route) || /^(games|maze|wardogs)(\/|$)/i.test(route);
let themed = 0, protectedCount = 0;
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const route = path.relative('dist', file).replaceAll('\\', '/');
    if (protectedRoute(route)) { protectedCount++; continue; }
    if (entry.isDirectory()) await visit(file);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(file, 'utf8');
      if (!html.includes('</head>') || html.includes('editorial-theme.css')) continue;
      await writeFile(file, html.replaceAll('href="/favicon.svg"', 'href="/favicon.svg?v=signature20261014"').replace('</head>', '<link rel="stylesheet" href="/editorial-theme.css?v=20261014"></head>'));
      themed++;
    }
  }
}
await visit('dist');
console.log(`Editorial theme: ${themed} pages; ${protectedCount} CAT/game paths excluded.`);

