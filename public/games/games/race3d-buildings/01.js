// Original banking architecture: stone civic hall, glass branch, brick savings house.
export const buildings = [
  { id: 'bank-stone-hall', name: 'Civic Stone Bank', category: 'bank', build(b) {
    const stone='#d9ceb5', pale='#f2e7cd', bronze='#857049', glass='#244453';
    b.box('broad-foundation',stone,0,.45,0,27,.9,20);
    b.box('vault-hall',stone,0,7,-1,24,13,17);
    for(let i=0;i<3;i++) b.box('terraced-front-stair',pale,0,.22+i*.24,9+i*.65,17-i*2,.44+i*.48,1.5);
    b.box('pedestal-course',bronze,0,1.5,-1,24.5,.45,17.5);
    b.box('entablature',pale,0,12.6,7,27,1.2,5);
    b.box('projecting-cornice',bronze,0,13.4,7,28,.35,5.4);
    b.roof('stone-pediment',pale,0,14.6,7,26,2.6,4.6);
    for(const x of [-10,-6,6,10]) {
      b.box('column-plinth',pale,x,1.35,8,1.8,.7,1.8);
      b.cylinder('fluted-portico-column',stone,x,6.5,8,.62,.76,9.6,12);
      b.box('column-capital',pale,x,11.55,8,1.8,.6,1.8);
    }
    for(const x of [-8,-4,4,8]) for(const y of [4.5,9]) {
      b.box('window-surround',pale,x,y,7.6,2.3,3.1,.3);
      b.box('deep-bank-window',glass,x,y,7.8,1.85,2.6,.15);
      b.box('window-bronze-mullion',bronze,x,y,7.92,.12,2.6,.1);
    }
    b.box('entrance-surround',bronze,0,3.5,7.7,4.4,5.2,.4);
    b.box('double-door-glass',glass,0,3.4,8,3.8,4.8,.2);
    b.box('door-central-divider',pale,0,3.4,8.15,.12,4.8,.12);
    for(const x of [-.45,.45]) b.box('brass-door-pull',bronze,x,3.4,8.3,.1,1.1,.12);
    b.cylinder('pediment-medallion',bronze,0,14,7.5,.85,.85,.22,16);
    b.sign('城市银行 · CITY BANK',bronze,0,11.6,9.55,8,1.1);
  }},
  { id: 'bank-glass-branch', name: 'Glass Atrium Bank', category: 'bank', build(b) {
    const frame='#c4d5d8', glass='#32667a', dark='#163545', teal='#00a7a5';
    b.box('floating-slab',frame,0,.3,0,27,.6,21);
    b.box('service-core',dark,-8,7,-3,9,14,15);
    b.box('atrium-glazing',glass,3,7,0,17,13.4,18);
    b.box('roof-sail',frame,1,14.2,1,28,.6,20);
    b.box('teal-roof-edge',teal,1,14.55,10.6,28,.18,.25);
    for(const x of [-5,-1,3,7,11]) b.box('front-vertical-fin',frame,x,7,9.2,.22,13.4,.5);
    for(const y of [1,5,9,13]) b.box('front-transom',frame,3,y,9.25,17,.18,.35);
    for(const z of [-7,-3,1,5,9]) b.box('side-vertical-fin',frame,11.6,7,z,.35,13.4,.2);
    for(const y of [5,9]) b.box('side-floor-band',frame,11.65,y,0,.4,.25,18);
    b.box('entry-canopy',teal,1,4.5,10,10,.35,3.5);
    for(const x of [-3.2,5.2]) b.cylinder('canopy-steel-post',frame,x,2.25,11,.12,.12,4.5,8);
    b.box('vestibule-glass',dark,1,2.1,9.7,4,4,.25);
    b.box('automatic-door-divider',frame,1,2.1,9.9,.1,4,.1);
    for(const x of [-.35,2.35]) b.box('automatic-door-safety-stripe',teal,x,2.1,9.92,1.1,.16,.06);
    for(let i=0;i<4;i++) {
      b.box('roof-louver',frame,-9+i*1.5,15,-3,.4,.8,10);
      b.box('interior-service-desk',frame,-3+i*3,1.2,7,2.2,1.4,1.2);
    }
    for(const x of [-11,10]) {
      b.box('entry-planter',dark,x,.75,10.2,2.4,1.5,2);
      b.box('clipped-shrub',teal,x,1.8,10.2,2,1.1,1.6);
    }
    b.sign('汇新银行 · HUIXIN',teal,-8,10.7,4.6,7,1.8);
  }},
  { id: 'bank-savings-porch', name: 'Neighborhood Savings Bank', category: 'bank', build(b) {
    const brick='#9d5d49', cream='#efdbb5', green='#22594e', glass='#28424a';
    b.box('brick-main-block',brick,-3,4.4,-1,18,8.8,16);
    b.roof('pitched-tile-roof',green,-3,10,-1,20,3,18);
    b.box('atm-side-wing',cream,9,2.7,1,7,5.4,12);
    b.box('atm-porch-canopy',green,8.5,5.6,7.6,9,.45,6);
    for(const x of [5,12]) b.box('porch-post',cream,x,2.7,10,.3,5.4,.3);
    for(const y of [.5,4.8,8.6]) b.box('brick-belt-course',cream,-3,y,7.1,18,.25,.25);
    for(const x of [-9,-5,0,4]) {
      b.box('upper-window-frame',cream,x,6.7,7.2,2.5,2.4,.3);
      b.box('upper-window',glass,x,6.7,7.4,2.1,2,.12);
      b.box('upper-window-mullion',cream,x,6.7,7.5,.1,2,.1);
    }
    b.box('entrance-door-frame',cream,-3,2.2,7.3,3.6,4.3,.4);
    b.box('entrance-glass-door',glass,-3,2.15,7.6,3.1,3.9,.15);
    b.box('entry-divider',cream,-3,2.15,7.7,.1,3.9,.1);
    b.box('door-awning',green,-3,4.5,8.2,5,.4,2.5);
    for(const x of [-9,2]) {
      b.box('street-window-frame',cream,x,2.6,7.2,3.3,3,.3);
      b.box('street-window-glass',glass,x,2.6,7.4,2.9,2.6,.15);
      b.box('window-planter',green,x,1.1,7.8,3.3,.55,.75);
    }
    for(const x of [7,10]) {
      b.box('atm-recess',green,x,2.3,7.2,2.1,3.8,.55);
      b.box('atm-terminal',cream,x,1.9,7.7,1.5,2.9,.7);
      b.box('atm-screen',glass,x,2.6,8.08,1,.7,.08);
      b.box('atm-keypad-shelf',green,x,1.95,8.2,1,.12,.45);
      b.box('cash-slot',glass,x,1.5,8.1,.65,.12,.08);
    }
    b.box('chimney',brick,-9,11,-4,1.4,3,1.6);
    b.box('chimney-crown',cream,-9,12.6,-4,1.8,.25,2);
    b.box('front-step',cream,-3,.18,9,6,.36,2);
    b.sign('邻里储蓄 · SAVINGS',green,-3,4,7.95,7,1);
    b.sign('24h ATM',green,8.5,4.7,10.65,5,.8);
  }}
];
