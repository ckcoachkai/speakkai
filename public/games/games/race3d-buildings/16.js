export const buildings = [
  { id: 'garden-flower-conservatory', name: 'Bloom Conservatory', category: 'garden', build(b) {
    b.box('garden-paving','#a8aa95',0,.15,0,28,.3,23);
    b.box('brick-service-house','#ab775c',-8,3.4,-3,9,6.5,14);
    b.roof('service-house-gable','#416c61',-8,7.2,-3,10,2,15);
    b.box('greenhouse-glass','#94bcb3',4,3.2,-3,14,6,15);
    for (const x of [-1,4,9]) {
      b.roof('conservatory-glazed-gable','#c0d9c7',x,7,-3,5,2,16);
      for (const z of [-10,4.6]) b.box('greenhouse-upright','#eee7cb',x,3.3,z,.16,6.4,.18);
    }
    for (const y of [1,3,5,6.3]) b.box('glazing-transom','#eee7cb',4,y,4.65,14,.12,.15);
    b.box('shop-door','#284c43',-8,2,4.1,2.4,3.6,.15);
    b.box('door-glass','#94bcb3',-8,2.5,4.2,1.9,2,.1);
    b.box('plant-bench','#79634c',4,1.1,7.5,15,.25,2.6);
    for (const x of [-2,1,4,7,10]) {
      b.cylinder('terracotta-pot','#b66743',x,1.65,7.5,.6,.4,.8);
      b.cylinder('plant-leaf-cone','#547f49',x,2.55,7.5,.05,.9,1.4,8);
      b.cylinder('flower-crown','#e0ad9e',x,3.3,7.5,.48,.6,.4,8);
    }
    for (const x of [-12,-4]) {
      b.cylinder('entry-planter','#d4c7ab',x,.9,7.5,1,.7,1.5);
      b.cylinder('clipped-topiary','#37694a',x,2.5,7.5,.65,1.2,2.2,10);
    }
    for (const x of [-11,-5]) b.box('pergola-post','#746a4d',x,2.4,10,.2,4.6,.2);
    for (const x of [-11,-9,-7,-5]) b.box('pergola-rafter','#746a4d',x,4.8,8,.15,.2,5.5);
    b.sign('BLOOM GARDEN','#e9dcb8',-8,5.4,4.3,7,1);
  }},
  { id: 'pet-grooming-house', name: 'Paw House', category: 'pet', build(b) {
    b.box('paw-house-plinth','#c5b7a3',0,.2,0,28,.4,22);
    b.box('supply-shop','#e9c39c',-5,3.4,-2,17,6.4,17);
    b.box('grooming-wing','#80aca8',9,4.7,-3,8,9,14);
    b.roof('shop-gable','#a66e61',-5,7.4,-2,18,2,18);
    b.box('grooming-coping','#e5e0c8',9,9.35,-3,9,.3,15);
    b.roof('left-cat-ear','#648a88',6.5,10,-3,3,2,4);
    b.roof('right-cat-ear','#648a88',11.5,10,-3,3,2,4);
    b.box('shop-display','#2d5360',-7,3,6.6,10,4.3,.15);
    b.box('entry-door','#446b72',1,2.2,6.65,3,3.9,.2);
    b.box('door-handle','#f0d791',2,2.2,6.85,.1,.65,.15);
    b.box('entry-canopy','#e6af6b',1,4.6,8.1,4,.25,3.3);
    b.box('grooming-window','#b4d6d0',9,4,4.2,6,5.5,.2);
    for (const y of [2,4,6]) b.box('grooming-window-bar','#e5e0c8',9,y,4.4,6,.1,.12);
    for (const x of [7,11]) b.box('grooming-mullion','#e5e0c8',x,4,4.4,.12,5.5,.12);
    for (const y of [1.4,2.6,3.8]) {
      b.box('pet-food-display-shelf','#cf9a67',-7,y,6.9,9,.15,.7);
      for (const x of [-10,-7,-4]) b.box('food-sack',y<3?'#e2b06b':'#b0b48c',x,y+.4,7,.85,.7,.5);
    }
    b.box('wash-tub','#e4e3ce',9,1.6,5.1,4,1.1,1.5);
    b.box('wash-tub-interior','#658d8d',9,2.2,5.1,3.5,.1,1.1);
    b.cylinder('tap-pipe','#8d9d9d',10,2.55,4.8,.08,.08,.8);
    b.box('tap-spout','#8d9d9d',9.8,2.9,4.8,.45,.1,.12);
    b.box('kennel-base','#b17e54',-9,.7,9.7,3,1.4,2.4);
    b.roof('kennel-roof','#8b5943',-9,1.7,9.7,3.5,1.2,3);
    b.box('kennel-opening','#34454a',-9,.65,10.93,1.2,1.2,.08);
    for(const x of [5,8,11]) {
      b.box('pet-tie-post','#6b8c86',x,.9,9,.12,1.8,.12);
      b.box('tie-post-cap','#e4c393',x,1.85,9,.3,.15,.3);
    }
    b.sign('PAW HOUSE','#fff0cf',-5,5.9,6.9,12,.8);
  }},
  { id: 'bicycle-workshop', name: 'Spoke Works', category: 'bicycle', build(b) {
    b.box('workshop-slab','#9a9e9d',0,.15,0,29,.3,23);
    b.box('workshop-brick-body','#926d54',-4,4,-2,19,7.7,17);
    b.box('display-tower','#567d87',10,5.7,-4,7,11.1,13);
    b.box('floating-workshop-roof','#364b52',-4,8.1,-2,20,.4,18);
    b.box('tower-coping','#cbd3cc',10,11.4,-4,8,.3,14);
    b.box('large-workshop-opening','#263c43',-4,3,6.6,15,5.6,.2);
    b.box('folded-up-shutter','#687d7f',-4,6.2,6.95,15,.6,.8);
    b.box('tower-glass','#99bdc0',10,4.7,2.6,5,8.2,.15);
    for(const y of [2,5,8]) b.box('tower-window-transom','#d9d7bf',10,y,2.8,5,.14,.1);
    b.box('workbench','#b68d5e',-4,1.3,6.9,12,.25,1.3);
    for(const x of [-9,1]) b.box('bench-leg','#53666a',x,.7,6.8,.18,1.2,.3);
    for(const x of [-10,-6,-2,2]) b.box('wall-tool','#b7c2bb',x,4.4,6.85,.16,1.1,.2,.25);
    // Two front-facing bicycles: octagonal tyre rings, diamond frames and forks.
    for(const center of [-7,3]) {
      const z=9.8, y=1.2;
      for(const dx of [-1.55,1.55]) {
        for(let k=0;k<8;k++) {
          const angle=k*Math.PI/4;
          b.box('bicycle-tyre-segment','#29343a',center+dx+Math.cos(angle),y+Math.sin(angle),z,.82,.16,.16,angle+Math.PI/2);
        }
        b.box('wheel-horizontal-spoke','#afbcb9',center+dx,y,z,1.85,.045,.05);
      }
      b.box('frame-down-tube','#dca14b',center-.6,1.55,z,1.6,.12,.12,-.6);
      b.box('frame-top-tube','#dca14b',center,2.05,z,1.6,.12,.12);
      b.box('frame-seat-tube','#dca14b',center-.65,1.6,z,1.05,.12,.12,1.25);
      b.box('front-fork','#dca14b',center+1.2,1.65,z,1.25,.1,.1,-1.05);
      b.box('bike-saddle','#334047',center-.75,2.3,z,.55,.13,.28);
      b.box('handlebar','#334047',center+.9,2.45,z,.65,.12,.15);
    }
    b.sign('SPOKE WORKS','#e9d6ac',-4,7.2,7,16,.9);
  }}
];
