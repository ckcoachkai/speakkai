// Hand-authored vector interpretations of the nine supplied references.
// SVGs contain real paths and articulated SMIL animation, never embedded photos.
import sharp from 'sharp';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
export const referenceBosses = [
 ['golden-cow','Golden Cow','cow',0],['sunset-cows','Sunset Cow Duo','cow',1],
 ['round-pikachu','Round Pikachu','pika',0],['ultraman','Ultraman','ultra',0],
 ['gundam','Gundam','mech',0],['garden-zombie','Garden Zombie','zombie',0],
 ['block-zombie','Block Zombie','block',0],['block-zombie-shuffle','Block Zombie Shuffle','block',1],
 ['garden-zombie-groove','Garden Zombie Groove','zombie',1],
];
const path=(d,f,s='#25302d',w=4)=>`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ellipse=(x,y,rx,ry,f,s='none',w=3)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="${w}"/>`;
const rect=(x,y,w,h,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
function group(content,pivot,amp,phase,t,animated){
 const [x,y]=pivot,a=Math.sin(t*Math.PI*2+phase)*amp;
 return `<g transform="rotate(${a} ${x} ${y})">${animated?`<animateTransform attributeName="transform" type="rotate" values="${Math.sin(phase)*amp} ${x} ${y};${amp} ${x} ${y};${-amp} ${x} ${y};${Math.sin(phase)*amp} ${x} ${y}" dur="2.4s" repeatCount="indefinite"/>`:''}${content}</g>`;
}
function character(kind,variant,t,animated){
 const g=(c,p,a,phase=0)=>group(c,p,a,phase,t,animated);
 let body='',head='',left='',right='',legs='',extra='';
 if(kind==='cow'){
  legs=path('M179 481 Q158 579 176 680 L220 680 250 507 M274 503 L287 680 334 680 Q350 575 326 485','url(#gold)','#8d611b')+path('M177 661 Q160 695 164 713 Q194 734 225 712 L220 663 M289 663 L284 714 Q316 733 344 711 L331 665','#c9b396','#826941')+path('M195 690 L195 719 M313 690 L313 719','none','#826941',3);
  body=ellipse(256,414,108,159,'url(#gold)','#9c7018')+ellipse(235,435,66,103,'#f6c947');
  left=path('M172 281 Q120 285 109 377 L109 484 Q127 506 145 482 L164 385 199 326','url(#gold)','#a87b1e')+path('M110 469 Q91 504 112 524 L122 508 Q121 536 133 526 L145 479','#ceb89c','#947654');
  right=path('M333 283 Q384 289 400 371 L403 480 Q383 503 368 479 L347 385 311 320','url(#gold)','#a87b1e')+path('M369 470 L368 517 Q378 537 388 509 L398 523 Q418 511 402 476','#ceb89c','#947654');
  head=path('M181 127 Q133 117 147 60 Q158 98 191 99 M319 127 Q369 120 361 60 Q343 99 315 97','#89735e','#66503c')+path('M174 148 Q123 126 122 159 Q141 187 178 171 M337 145 Q388 127 390 157 Q371 188 333 173','#f4bc32','#a37a25')+ellipse(255,177,91,105,'url(#gold)','#a87924')+ellipse(248,229,59,48,variant?'#c1a3b6':'#e0c49f')+path('M203 226 Q229 206 247 222 Q268 205 293 226 Q268 258 239 249 Q216 247 203 226',variant?'#9c7e97':'#ce6b69','#925c59',2)+path('M208 228 Q251 238 288 228','none','#725251',3)+ellipse(231,206,7,5,'#8c7462')+ellipse(266,206,7,5,'#8c7462');
  for(const x of [217,287])head+=ellipse(x,165,15,12,'#f7eed2')+ellipse(x-3,165,6,9,'#5a5140')+ellipse(x-5,162,2,3,'white');
  head+=path('M198 144 Q216 135 234 141 M270 141 Q288 135 304 145','none','#8a6427',5);
  if(variant){for(let i=0;i<44;i++){let x=178+(i*37%155),y=300+(i*53%230);body+=path(`M${x} ${y} l-3 8 7 -4`,'none','#c09225',1.5);}extra=`<g transform="translate(14 422) scale(.38)">${character('cow',0,t+.25,animated)}</g>`;}
 }else if(kind==='pika'){
  extra=path('M365 473 L448 424 409 366 476 307 450 231 362 311 390 374 340 426','#f9cb19','#a17a1c',5);
  legs=ellipse(182,687,55,25,'#eeb922','#957121')+ellipse(328,687,55,25,'#eeb922','#957121');
  body=ellipse(256,474,173,218,'url(#gold)','#a47f18')+path('M134 407 Q256 465 377 407 M130 535 Q253 577 383 535','none','#d5a619',5);
  left=ellipse(120,474,41,99,'url(#gold)','#b68c19');right=ellipse(391,474,41,99,'url(#gold)','#b68c19');
  head=path('M180 161 Q137 81 113 59 Q ninety 80 137 205'.replace('ninety','90'),'#f7cb22','#957121')+path('M321 165 Q374 72 417 69 Q417 133 355 211','#f7cb22','#957121')+path('M113 59 Q145 76 150 115 L119 139 Q96 83 113 59 M417 69 Q388  seventy 372 111 L403 124 Z'.replace('seventy','70'),'#282b2d','#282b2d')+ellipse(254,265,133,123,'url(#gold)','#b0881b');
  for(const x of [207,297])head+=ellipse(x,252,18,24,'#222728')+ellipse(x-5,242,7,8,'white');
  head+=ellipse(157,293,23,26,'#e74c30')+ellipse(352,293,23,26,'#e74c30')+path('M244 278 L266 278 255 289 Z','#39312c')+path('M255 289 Q247 312 230 300 M255 289 Q264 312 281 300','none','#725326',3)+ellipse(255,339,39,18,'#eabd25');
 }else if(kind==='ultra'||kind==='mech'){
  const mech=kind==='mech';
  legs=path('M187 466 L174 586 151 678 207 691 252 489 M266 489 L303 689 361 678 331 470',mech?'#dce5ef':'url(#silver)')+path('M153 674 L117 712 Q158 733 212 710 L207 676 M303 677 L298 709 Q353 737 389 714 L360 675',mech?'#a7183a':'url(#silver)');
  body=path('M179 260 L328 260 354 331 320 494 272 518 255 484 229 518 186 494 153 329',mech?'#204caa':'#b32235');
  if(mech){body+=path('M168 285 L249 306 337 281 329 345 271 364 254 420 228 357 172 340','#173775')+path('M224 352 L282 352 297 438 268 482 239 463','#c42243')+path('M183 433 L234 451 217 519 159 502 Z M277 451 L325 434 350 503 294 520 Z','#e8eef3');}
  else body+=path('M182 267 L226 289 235 357 Q252 386 263 357 L272 289 323 267 306 318 297 390 328 379 317 422 277 428 256 448 234 430 188 422 179 379 210 390 201 318','#cbd1d2')+ellipse(255,325,16,20,'#4dd9ff','#ebf9ff',4);
  left=path('M178 271 L126 277 91 380 140 456 178 431 142 379 200 307',mech?'#e8eef4':'url(#silver)');
  right=path('M329 270 L380 279 419 380 369 455 333 431 370 379 307 306',mech?'#e8eef4':'url(#silver)');
  if(mech){left+=path('M113 265 L179 261 196 317 136 343 90 318 Z M99 366 L146 372 165 420 127 443 Z','#f2f7fb')+path('M137 438 L169 424 190 455 156 478 Z','#515e6b');right+=path('M328 261 L395 265 423 318 372 344 311 316 Z M372 371 L413 365 387 444 345 420 Z','#f2f7fb')+path('M344 424 L375 438 357 478 324 455 Z','#515e6b');}
  head=path('M212 251 L211 224 296 224 296 252','#9f2436')+path('M200 119 Q253 65 311 120 L304 209 278 249 229 248 200 211 Z','url(#silver)');
  if(mech)head+=path('M200 130 L174 54 234 122 250 101 269 122 341 48 308 146 279 169 223 165','#f6d24a')+path('M211 160 L248 175 224 190 Z M266 174 L300 156 288 187 Z','#dcf55c')+path('M233 190 L277 191 288 225 256 235 226 222','#f4f6fa')+path('M246 222 L267 222 272 248 248 251 Z','#bf2545')+path('M238 202 L273 202 M238 212 L275 212','none','#596775',3);
  else head+=path('M250 84 L255 34 263 87 261 220 251 220 Z','#e8eff2','#6e7b82',2)+ellipse(224,158,22,14,'#fff4ad','#879298')+ellipse(286,158,22,14,'#fff4ad','#879298')+path('M230 213 L279 213 270 229 240 229 Z','#71858e')+path('M237 215 L273 215','none','#f4fbff',3);
 }else if(kind==='zombie'){
  legs=path('M201 474 L193 576 151 661 204 683 267 576 266 497 M278 486 L299 573 321 667 367 653 345 558 340 475','#343e63')+path('M148 648 L119 689 Q156 717 220 694 L208 664 M315 648 L307 690 Q363 720 403 687 L368 654','#604628','#292824',5);
  body=path('M186 275 L290 254 332 285 370 497 338 481 322 511 295 489 274 516 226 492 184 505 169 423','#665032')+path('M215 277 L272 271 301 451 248 488 207 380','#c5c2b6')+path('M242 300 L264 311 249 337 273 431 239 467 220 422 241 338 228 317','#94282c')+path('M235 363 L257 372 M228 396 L265 408 M228 426 L259 438','none','#eee1bd',4);
  left=path('M193 284 L151 300 126 468 166 483 216 330','#685033')+path('M129 464 Q111 484 114 524 L129 538 141 517 151 540 167 528 178 489 163 476','#879572');
  right=path('M303 278 L348 307 338 474 296 484 280 324','#685033')+path('M299 471 L286 511 Q286 538 302 536 L312 515 316 540 332 536 343 510 338 471','#879572');
  head=path('M186 88 Q246 58 302 99 Q341 152 317 225 L276 279 215 281 171 248 165 212 Q135 183 155 139 Z','#879572','#263a2f',5)+path('M166 218 Q229 195 271 221 L281 256 214 264 174 249 Z','#4c1d1e')+path('M185 218 L199 217 201 234 186 233 M220 216 L236 217 235 231 223 231 M253 241 L269 239 268 252 257 252','#f2e5b8');
  for(const [x,y,r]of [[176,174,28],[273,165,37]])head+=ellipse(x,y,r,r+2,'#e0ddb0','#243429',5)+ellipse(x-5,y+2,5,6,'#1d2723')+ellipse(x-10,y-12,8,9,'#fffbe4');
  head+=path('M215 191 Q227 179 231 198 M190 122 Q211 132 238 116 M192 83 Q179 59 196 42 M247 81 Q237 49 253 39 M292 94 L319 67','none','#354735',3);
 }else{
  legs=rect(187,475,66,217,'#39357e')+rect(260,475,68,217,'#2b2864')+rect(183,667,70,41,'#667274')+rect(260,667,76,41,'#536362');
  body=path('M183 274 L302 255 345 288 327 492 257 519 182 480','#079294','#244b40')+path('M302 255 L345 288 327 492 302 477','#04666e')+rect(199,310,28,95,'#078788')+rect(247,387,32,83,'#0aa1a0');
  left=path('M195 288 L91 259 71 331 190 374','#4d7739')+path('M91 259 L118 277 97 343 71 331','#648b44');
  right=path('M316 287 L191 277 165 356 307 382 346 335','#3e672d')+path('M191 277 L214 292 189 363 165 356','#5c8539');
  head=path('M180 114 L283 76 346 114 244 153 Z','#5a8039')+path('M180 114 L244 153 244 274 180 239 Z','#628a47')+path('M244 153 L346 114 346 236 244 274 Z','#365c2c');
  head+=path('M193 190 L211 199 211 213 193 205 M263 204 L285 196 285 210 263 219','#141f19','none')+path('M224 229 L254 238 279 230 279 245 251 255 224 243','#2b4926','none');
  for(let i=0;i<15;i++){let x=187+i*23%140,y=133+i*29%91;head+=rect(x,y,12,10,i%2?'#638549':'#477038');}
 }
 return extra+g(legs,[256,480],variant?5:2,Math.PI)+body+g(left,[180,290],variant?10:5)+g(right,[330,290],variant?10:5,Math.PI)+g(head,[256,276],variant?6:3,.4);
}
const defs='<defs><linearGradient id="gold" x2="1" y2=".4"><stop stop-color="#ffe478"/><stop offset=".5" stop-color="#efbc24"/><stop offset="1" stop-color="#c68c12"/></linearGradient><linearGradient id="silver"><stop stop-color="#778893"/><stop offset=".45" stop-color="#f3f8f8"/><stop offset="1" stop-color="#81919a"/></linearGradient></defs>';
await mkdir('public/forest/animations',{recursive:true});
for(const [id,name,kind,variant]of referenceBosses){
 const svg=(t,animated)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 768" width="512" height="768" role="img" aria-label="${name}"><title>${name}</title>${defs}${character(kind,variant,t,animated)}</svg>`;
 await writeFile(`public/forest/animations/${id}.svg`,svg(0,true));
 await mkdir(`public/forest/art/${id}`,{recursive:true});
 for(let i=0;i<24;i++)await sharp(Buffer.from(svg(i/24,false))).webp({quality:86}).toFile(`public/forest/art/${id}/${i}.webp`);
 await copyFile(`public/forest/art/${id}/0.webp`,`public/forest/art/host-${id}.webp`);
}
