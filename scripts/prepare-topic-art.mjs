import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
// Input is a local manifest mapping 12 illustration names to generated PNG originals.
// Originals remain untouched; web variants only change dimensions and compression.
const manifest=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
await fs.mkdir('public/topic/art',{recursive:true});
const results=[];
for(const [key,source] of Object.entries(manifest)){
  if(!/^[a-z]+$/.test(key))throw new Error('Invalid illustration name');
  const target=path.join('public/topic/art',key+'.webp');
  await sharp(source).resize({width:1200,withoutEnlargement:true}).webp({quality:79,effort:5}).toFile(target);
  results.push({key,bytes:(await fs.stat(target)).size});
}
console.log(JSON.stringify(results));
