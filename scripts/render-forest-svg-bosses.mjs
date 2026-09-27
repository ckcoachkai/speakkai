import sharp from 'sharp';
import {mkdir,copyFile} from 'node:fs/promises';
// Run build-forest-svg-bosses.py first. No browser or external asset service needed.
for(const id of ['cow','pelican']){
  await mkdir(`public/forest/art/${id}`,{recursive:true});
  for(let i=0;i<36;i++)await sharp(`output/forest-svg-frames/${id}-${i}.svg`).webp({quality:85}).toFile(`public/forest/art/${id}/${i}.webp`);
  await copyFile(`public/forest/art/${id}/0.webp`,`public/forest/art/host-${id}.webp`);
}
