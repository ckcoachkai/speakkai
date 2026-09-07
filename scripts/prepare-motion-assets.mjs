// Run after rendering from the repository root. ffprobe verifies the actual encoded output.
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const records=[];
for(const language of ['en','zh']) {
  await sharp(`media/remotion/out/poster-${language}.png`).resize(720).webp({quality:85}).toFile(`public/media/point-example-check-${language}.webp`);
  const data=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',`public/media/point-example-check-${language}.mp4`],{encoding:'utf8'}));
  assert.equal(data.streams.length,1,'Silent output must have no audio track');
  const video=data.streams[0];
  assert.equal(video.codec_name,'h264');assert.equal(video.width,1080);assert.equal(video.height,1080);
  assert.equal(video.r_frame_rate,'30/1');assert.equal(Number(video.nb_frames),540);assert.equal(Number(data.format.duration),18);
  for(const extension of ['mp4','webp']) {
    const file=`point-example-check-${language}.${extension}`;const bytes=await readFile(`public/media/${file}`);
    records.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),...(extension==='mp4'?{duration:18,width:1080,height:1080,fps:30,audio:false,codec:'h264'}:{width:720,height:720})});
  }
}
await writeFile('media/remotion/manifest.json',JSON.stringify({generator:'Remotion 4.0.522',source:'src/PointExampleCheck.tsx',fonts:'Windows Arial and Microsoft YaHei; font files are not distributed',records},null,2)+'\n');
console.log(records);
