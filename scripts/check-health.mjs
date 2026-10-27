import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const html=await read('public/health/index.html'),js=await read('public/health/app.js'),css=await read('public/health/styles.css');
test('public journal connects to read-only Supabase data and exposes no privileged key or write control',()=>{
 assert.match(html,/data-health-mode="public-readonly"/);
 assert.match(html,/Public journal · Read only/);
 assert.match(html,/https:\/\/ufxqfgxjsjezjhuyvyqd.supabase.co/);
 assert.match(js,/sb_publishable_/);
 assert.doesNotMatch(html+js,/sb_secret_|service_role|Bearer |<form\b|localStorage|sessionStorage|indexedDB/i);
 assert.doesNotMatch(js,/method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/i);
 assert.match(js,/offset\+=500/);
 assert.match(js,/Eating date unconfirmed/);
});
test('source coverage, incomplete logs and old weight limitations remain explicit',()=>{
 assert.match(html,/Dot’s complete provided export is merged/);
 assert.match(js,/Sparse scale readings/);
 assert.match(css,/@media\(max-width:450px\)/);
 assert.match(html,/Upload dates are UTC, not guaranteed eating dates/);
});
async function paths(dir){let out=[];for(const e of await readdir(new URL(dir,root),{withFileTypes:true})){const p=dir+'/'+e.name;out.push(...(e.isDirectory()?await paths(p):[p]));}return out.sort();}
test('public asset directory contains only dashboard code and five approved photos',async()=>{
 const files=await paths('public/health');
 assert.ok(files.length>=63);
 assert.ok(files.every(p=>/\.(html|css|js|jpg|webp)$/.test(p)));
 assert.equal(files.filter(p=>p.endsWith('.jpg')).length,5);
});
test('built dashboard matches reviewed source assets',{skip:!process.argv.includes('--dist')},async()=>{
 for(const p of await paths('public/health')){
 const [source,built]=await Promise.all([readFile(new URL(p,root)),readFile(new URL(p.replace('public/','dist/'),root))]);
 assert.ok(source.equals(built),p);
 }
});

