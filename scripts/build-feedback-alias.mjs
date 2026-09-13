import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const canonical = path.join(root, 'fb', 'index.html');
const alias = path.join(root, 'FB', 'index.html');
if (!fs.existsSync(canonical)) throw Error('Feedback page has not been built');
// Windows resolves both spellings to the same file. The page normalizes its URL there.
if (!fs.existsSync(alias)) {
  fs.mkdirSync(path.dirname(alias), {recursive: true});
  fs.writeFileSync(alias, '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/fb/"><link rel="canonical" href="https://speakkai.com/fb/"><title>Student feedback | SpeakKai</title></head><body><a href="/fb/">Student feedback</a><script>location.replace("/fb/"+location.search+location.hash)</script></body></html>');
}
console.log('Feedback uppercase alias ready; canonical page preserved.');

const progressAlias=path.join(root,'FBS','index.html');
if(!fs.existsSync(progressAlias)){fs.mkdirSync(path.dirname(progressAlias),{recursive:true});fs.writeFileSync(progressAlias,'<!doctype html><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/fbs/"><a href="/fbs/">Student progress</a><script>location.replace("/fbs/"+location.search+location.hash)</script>');}
