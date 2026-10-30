// Three original retail silhouettes, designed for shared instanced primitives.
export const buildings = [
  {id:'stride-sports-hall',name:'Stride Sports Hall',category:'sportswear',build(b){
    b.box('concrete-plinth','#929b9e',0,.3,0,28,.6,22);
    b.box('warehouse-hall','#bec6bf',0,5,-2,26,9.4,17);
    for(const x of [-9,0,9]){
      b.roof('sawtooth-roof-bay','#3f6669',x,10.5,-2,8.7,3,18);
      b.box('clerestory-glazing','#638f9a',x,10,7,7.5,1.3,.15);
    }
    b.box('front-display-glazing','#27444b',0,3.6,6.6,24,5.7,.2);
    for(const x of [-12,-6,0,6,12])b.box('steel-front-mullion','#d1d5cc',x,3.6,6.8,.18,5.8,.2);
    b.box('entrance-portal','#ee9e3c',0,3,7.7,5.4,5.6,1.5);
    b.box('recessed-double-door','#30484a',0,2.9,8.5,4.5,5,.12);
    b.box('door-center-bar','#c3c9c3',0,2.9,8.65,.1,5,.12);
    b.box('projecting-marquee','#364a4d',0,6,8.2,17,.35,4.4);
    for(const x of [-9,9]){
      b.box('display-podium','#d5d3ba',x,.9,7.6,3.6,.7,2);
      b.box('mannequin-torso','#e9dfc5',x,2.6,7.7,.9,1.6,.5);
      b.cylinder('mannequin-head','#e9dfc5',x,3.7,7.7,.35,.35,.55,8);
      for(const dx of [-.25,.25])b.box('mannequin-leg','#4d6263',x+dx,1.65,7.7,.25,.8,.3);
    }
    for(let i=0;i<5;i++)b.box('track-graphic-stripe','#ebc97e',-10+i*.7,.64,9.6,.12,.05,2.3);
    b.box('roof-air-handler','#7b898b',8,12,-6,3,1.3,3);
    for(const x of [-11,11])b.cylinder('bollard','#f0ac49',x,.95,10,.18,.18,1.3,8);
    b.sign('STRIDE SPORTS','#e9b95a',0,7.3,7.05,18,1.6);
  }},
  {id:'jin-silk-tailor',name:'Jin Silk Tailor',category:'textiles',build(b){
    b.box('stone-threshold','#afa98d',0,.25,0,25,.5,21);
    b.box('two-storey-workshop','#dfcaa1',0,6,-2,22,11.5,16);
    b.roof('green-tile-gable','#3d625c',0,12.7,-2,25,3.3,18);
    b.box('tile-ridge','#bba778',0,14.5,-2,.35,.25,18.7);
    b.box('shopfront-recess','#493f35',0,3,6.1,20,5,.2);
    for(const x of [-10,10])b.box('timber-veranda-post','#704837',x,3.25,8.4,.55,6,.55);
    b.box('deep-shop-eave','#40635b',0,6.4,7.5,24,.5,4);
    b.box('entry-door','#293e39',0,2.8,6.35,3.1,4.7,.2);
    for(const side of [-1,1]){
      const x=side*6.4;
      b.box('window-frame','#85543c',x,8.7,6.2,6.6,3.6,.25);
      b.box('window-paper','#d6c69e',x,8.7,6.4,6,3,.12);
      for(let i=-2;i<=2;i++)b.box('woven-screen-upright','#6f4936',x+i,8.7,6.55,.12,3.1,.1);
      for(const y of [8,9.4])b.box('woven-screen-crosspiece','#6f4936',x,y,6.6,6.1,.12,.1);
      b.box('fabric-display-bench','#8c5c3c',x,1.1,7.6,5.3,1.3,1.6);
      for(let i=0;i<4;i++)b.cylinder('upright-silk-bolt',['#b94b4e','#cfac60','#548b88','#9a7394'][i],x-1.8+i*1.2,2.35,7.6,.4,.4,1.15,8);
    }
    b.box('cutting-table','#af8b55',-3,1.7,9,4.4,.25,1.7);
    for(const x of [-4.7,-1.3])b.box('cutting-table-leg','#5b4635',x,.9,9,.18,1.5,.18);
    b.box('folded-fabric','#768f8d',-3,1.95,9,2.5,.25,1.2);
    b.sign('JIN SILK TAILOR','#e3c493',0,5.3,6.5,13,1.1);
  }},
  {id:'sole-gallery',name:'Sole Sneaker Gallery',category:'footwear',build(b){
    b.box('gallery-plinth','#c4c1b9',0,.3,0,27,.6,21);
    b.box('rear-service-block','#505766',-8,4,-3,8,7.4,15);
    b.box('rear-gallery-wall','#d7cec1',4,4,-9,16,7.4,.6);
    b.box('side-gallery-wall','#d7cec1',11.8,4,-2,.6,7.4,14);
    b.box('low-floating-roof','#e7b09b',4,7.7,1,18,.6,15);
    b.box('upper-floating-roof','#737a8a',-7,9,-2,10,.55,17);
    b.box('gallery-glass','#4b6871',4,4,7.1,15.5,6.6,.16);
    for(const x of [-3.5,4,11.5])b.box('glass-joint','#c9d0ca',x,4,7.25,.08,6.6,.12);
    b.box('pink-door-portal','#e5a18f',-7,3,6,4.5,5.4,.7);
    b.box('entry-door','#30454c',-7,2.9,6.45,3.7,4.9,.12);
    b.box('door-pull','#d2c5ac',-5.7,2.8,6.6,.09,1.2,.1);
    for(const x of [0,4,8])for(const y of [1.8,3.6,5.4]){
      b.box('floating-shoe-shelf','#e4d8c8',x,y,7.6,2.8,.13,1.2);
      b.box('sculpted-sneaker-sole','#f5eee2',x,y+.21,7.7,1.65,.22,.65);
      b.box('sneaker-upper',['#d48672','#6f91a0','#b49c70'][Math.round(x/4)],x-.15,y+.48,7.7,1.2,.37,.55);
      b.box('sneaker-heel','#404c5a',x-.65,y+.65,7.7,.3,.3,.53);
    }
    b.box('try-on-bench','#a38d7d',1,1.1,9.4,5,.5,1.3);
    for(const x of [-.8,2.8])b.box('bench-foot','#4e5964',x,.65,9.4,.2,.6,1);
    b.cylinder('round-feature-planter','#aeb8ad',9,.9,9.6,.8,.65,1.2,12);
    b.cylinder('columnar-shrub','#527461',9,1.95,9.6,.55,.65,1.4,8);
    b.sign('SOLE GALLERY','#efd2bf',-7,7.4,6.4,7,1.1);
  }}
];
