// Original Chinese dining architecture: open noodle counter, steamer pavilion, duck hall.
export const buildings = [
  {id:'lan-noodle-workshop',name:'Lan Noodle Workshop',category:'restaurant',build(b){
    b.box('terrazzo-platform','#b8b3a5',0,.25,0,24,.5,20);
    b.box('narrow-upper-house','#d8c5a4',0,7,-3,21,13,13);
    b.roof('steep-noodle-house-roof','#445758',0,14.5,-3,22,3,14);
    b.box('open-shop-back','#ab8460',0,2.4,3.2,20,4,.3);
    for(const x of [-9,9]) b.box('shop-pier','#674837',x,2.8,6,.55,5.2,.65);
    b.box('service-counter','#ece2ca',-3,1.4,6,11,1.8,1.4);
    b.box('counter-edge','#584436',-3,2.35,6,11.4,.2,1.7);
    for(const x of [-7,-4,-1]){
      b.cylinder('soup-stockpot','#8c9b9c',x,2.8,5.8,.65,.65,.75,12);
      b.cylinder('pot-rim','#d5d8cf',x,3.2,5.8,.72,.72,.12,12);
      b.box('counter-stool-leg','#604631',x,.65,8.4,.18,1,.18);
      b.cylinder('counter-stool-seat','#b85f34',x,1.2,8.4,.6,.6,.15,12);
    }
    b.box('walk-in-entry','#233d40',6,2.4,3.5,3.5,4,.18);
    b.box('woven-awning','#ba5734',0,5.5,6.8,23,.3,5);
    for(let i=0;i<8;i++)b.box('awning-seam','#e3c89c',-10+i*2.8,5.67,6.8,.12,.05,4.8);
    for(const x of [-7,0,7]){
      b.box('upper-window-surround','#f1dfb8',x,10,3.6,3.8,4,.2);
      b.box('upper-window','#375455',x,10,3.75,3.3,3.5,.15);
      b.box('window-crossbar','#755743',x,10,3.9,3.3,.14,.1);
    }
    b.box('hanging-noodle-board','#70422c',10,8,5,.35,4,1.8);
    b.sign('兰记面馆 · LAN NOODLES','#ecd49f',0,6.7,3.95,15,1.4);
  }},
  {id:'bamboo-dumpling-pavilion',name:'Bamboo Dumpling Pavilion',category:'restaurant',build(b){
    b.box('raised-stone-platform','#aaa99a',0,.4,0,28,.8,21);
    b.box('low-pavilion-body','#e5dcc8',0,3.6,-3,25,6.4,13);
    b.roof('broad-teal-gable','#3f665e',0,7.5,-2,28,3.5,17);
    b.box('roof-ridge','#c1b381',0,9.3,-2,.35,.35,18);
    for(const x of [-11,0,11])b.box('red-veranda-post','#8b3931',x,3.3,7,.5,5.8,.5);
    b.box('front-lintel','#735536',0,6.1,7,25,.5,.6);
    b.box('center-door','#334e49',0,2.7,3.6,3.2,4.3,.2);
    for(const x of [-7,7]){
      b.box('open-kitchen-recess','#314d46',x,3,3.65,6.4,3.7,.18);
      b.box('dumpling-prep-counter','#b28a55',x,1.6,5.8,6.4,1.3,2);
      b.box('prep-marble-top','#e0ddbd',x,2.3,5.8,6.7,.15,2.2);
      for(const dx of [-1.6,1.6]){
        for(let layer=0;layer<3;layer++)b.cylinder('bamboo-steamer-tier','#d1ad68',x+dx,2.55+layer*.35,5.8,.6,.6,.28,12);
        b.cylinder('steamer-lid','#ad894d',x+dx,3.5,5.8,.65,.65,.15,12);
      }
    }
    for(const x of [-11,11]){
      b.box('lantern-hanger','#5e4836',x,5.5,8,.08,1.1,.08);
      b.cylinder('round-paper-lantern','#df9b4c',x,4.7,8,.55,.55,.8,12);
      b.box('lantern-tassel','#a43128',x,4,8,.08,.6,.08);
    }
    for(const z of [-7,-2])for(const x of [-12.6,12.6])b.box('side-timber-fin','#8d7453',x,3.5,z,.15,4.7,1.7);
    b.box('entrance-step','#c1bba9',0,.15,10.7,7,.3,1.5);
    b.sign('竹香饺子 · DUMPLINGS','#d4b56e',0,6.6,7.4,15,1);
  }},
  {id:'golden-duck-banquet-hall',name:'Golden Duck Banquet Hall',category:'restaurant',build(b){
    b.box('granite-plinth','#8c8580',0,.4,0,29,.8,22);
    b.box('tall-banquet-hall','#8c3028',0,6,-3,27,11.2,15);
    b.box('black-stone-cornice','#303b3b',0,11.9,-3,28.5,.6,16.2);
    b.roof('central-gold-roof','#b19250',0,13,-3,17,3,16.5);
    for(const x of [-10,10])b.roof('wing-dark-roof','#344b49',x,12.5,-3,8,1.8,16);
    b.box('grand-entrance-portal','#c0a264',0,4.1,6.3,9,7.4,2.7);
    b.box('double-entrance-glass','#243f43',0,3.6,7.8,6.5,5.8,.15);
    b.box('door-center-bar','#d1b272',0,3.6,7.95,.14,5.8,.1);
    b.box('entrance-canopy','#303b3b',0,8.1,8,12,.5,5);
    for(const x of [-5,5])b.cylinder('portal-column','#bc9859',x,4,9,.28,.38,7.4,12);
    for(const x of [-10,10]){
      b.box('duck-display-recess','#243531',x,3.3,4.6,5,4.6,.25);
      b.box('display-counter','#c4b494',x,1.4,6.1,5,1.3,2.6);
      b.box('hanging-roast-rail','#a9a08c',x,5,6.2,4.7,.1,.1);
      for(const dx of [-1.5,0,1.5]){
        b.box('duck-hook','#aaa69a',x+dx,4.7,6.2,.06,.5,.06);
        b.cylinder('roast-duck-body','#ad5c28',x+dx,4,6.2,.19,.35,.9,8);
        b.cylinder('roast-duck-neck','#c17b39',x+dx,4.55,6.2,.08,.12,.35,8);
      }
      b.box('upper-lattice-window','#273d38',x,9,4.65,4.6,2.6,.15);
      for(const dx of [-1.4,0,1.4])b.box('gold-lattice-bar','#c5a76b',x+dx,9,4.8,.12,2.6,.12);
    }
    for(const z of [10.2,10.9])b.box('broad-arrival-step','#bcb4a3',0,.25,z,11,.5,.65);
    b.box('rear-kitchen-flue','#5b6060',10,13,-8,1.2,3,1.2);
    b.box('flue-cap','#303b3b',10,14.6,-8,1.7,.2,1.7);
    b.sign('金鸭楼 · GOLDEN DUCK','#e7c47b',0,10.2,6.4,10,1.3);
  }}
];
