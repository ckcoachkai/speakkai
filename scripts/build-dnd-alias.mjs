import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const canonical=path.join(root,'DND','index.html');
if(!fs.existsSync(canonical))throw Error('Bob character page has not been built');
const alias=path.join(root,'dnd','index.html');
// Case-insensitive Windows already resolves this path. Linux deployment needs the alias.
if(!fs.existsSync(alias)){
  fs.mkdirSync(path.dirname(alias),{recursive:true});
  fs.writeFileSync(alias,'<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/DND/"><link rel="canonical" href="https://speakkai.com/DND/"><title>Bob the Paladin</title></head><body><a href="/DND/">Open Bob’s character sheet</a></body></html>');
}
console.log('Bob character page and lowercase alias ready.');
