import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import path from 'node:path';
const [input,date]=process.argv.slice(2);
if(!input || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !process.env.IVY_PASSWORD) throw Error('Provide private HTML path, lesson date, and IVY_PASSWORD environment variable.');
const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12));
const material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(process.env.IVY_PASSWORD),'PBKDF2',false,['deriveKey']);
const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',iterations:600000,salt},material,{name:'AES-GCM',length:256},false,['encrypt']);
const html=await readFile(input,'utf8');
// Inline the lesson stylesheet so the encrypted document is self-contained.
const styled=await html.replace(/<link rel="stylesheet" href="([^"]+)"\s*\/?\s*>/g,(_,url)=>`<!--STYLE:${url}-->`);
let output=styled;
for(const match of styled.matchAll(/<!--STYLE:([^>]+)-->/g)) output=output.replace(match[0],`<style>${await readFile(path.join('dist',match[1]),'utf8')}</style>`);
const cipher=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(output));
await mkdir('src/data/ivy',{recursive:true});
await writeFile(`src/data/ivy/${date}.json`,JSON.stringify({date,salt:Buffer.from(salt).toString('base64'),iv:Buffer.from(iv).toString('base64'),ciphertext:Buffer.from(cipher).toString('base64')}));
