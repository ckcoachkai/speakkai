import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const root = new URL('../',import.meta.url);
const source = await readFile(new URL('public/health/index.html',root),'utf8');
const css = await readFile(new URL('public/health/styles.css',root),'utf8');
test('public health shell is explicitly unconfigured and cannot collect credentials or health data', () => {
  assert.match(source,/data-health-mode="setup-required"/);
  assert.match(source,/health tracker is not connected to private storage/);
  assert.match(source,/Nothing is being synced from chat/);
  assert.match(source,/<button[^>]*disabled[^>]*>Sign-in unavailable/);
  assert.doesNotMatch(source,/<(?:script|form|input|textarea|select|iframe|object)\b/i);
  assert.match(source,/script-src 'none'/);
  assert.match(source,/connect-src 'none'/);
  assert.match(source,/form-action 'none'/);
  assert.match(source,/worker-src 'none'/);
  assert.doesNotMatch(source+css,/supabase\.co|service_role|sb_secret_|localStorage|sessionStorage|indexedDB|serviceWorker|Bearer /i);
  assert.doesNotMatch(source,/76\.4|21\.8%|Berry oats|1,051|demo-photo|demo-message/);
});
test('setup route contains only allowlisted static assets with mobile layout and no external dependencies', async () => {
  assert.deepEqual((await readdir(new URL('public/health/',root))).sort(),['index.html','styles.css']);
  assert.match(css,/@media\(max-width:450px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css,/@import|url\(/);
  assert.match(source,/href="https:\/\/speakkai.com\/health\/"/);
});
test('built health route keeps the reviewed data-free shell and is not modified by the global theme', {skip: !process.argv.includes('--dist')}, async () => {
  const built = await readFile(new URL('dist/health/index.html',root),'utf8');
  const builtCss = await readFile(new URL('dist/health/styles.css',root),'utf8');
  assert.equal(built,source); assert.equal(builtCss,css);
  assert.doesNotMatch(built,/editorial-theme\.css/);
  assert.deepEqual((await readdir(new URL('dist/health/',root))).sort(),['index.html','styles.css']);
});
