// Original shop architecture; furniture and lamps are modeled behind open display bays.
export const buildings = [
  { id: 'nord-home-warehouse', name: 'Nord Home Furniture Warehouse', category: 'homewares', build(b) {
    b.box('warehouse-plinth','#adb1b0',0,.3,-1,29,.6,21);
    b.box('blue-warehouse-shell','#155da4',0,5.1,-2,28,9.6,18);
    b.box('yellow-parapet','#f2cb35',0,10,-2,28.6,.65,18.6);
    b.box('entrance-yellow-frame','#f2cb35',-6,3.4,7.3,11,6,1.5);
    b.box('entrance-glass','#183f58',-6,3,8.15,9.6,4.8,.18);
    for (const x of [-9,-6,-3]) b.box('entrance-mullion','#d3dce0',x,3,8.3,.14,4.8,.16);
    b.box('cantilever-yellow-canopy','#f2cb35',-6,5.7,9.4,13,.4,4.8);
    for (const x of [-11, -1]) b.box('canopy-support','#4b5860',x,2.8,10.5,.25,5.6,.25);
    b.box('loading-door','#70818b',9,2.5,7.1,5,4,.16);
    for (let i=0;i<6;i++) b.box('loading-door-slats','#394d5c',9,.9+i*.6,7.22,4.7,.07,.08);
    b.box('loading-platform','#657078',9,.7,8.7,6,1.1,3);
    for(const x of [6,12]) b.box('loading-bollard','#f2cb35',x,1.15,10.5,.28,2.3,.28);
    for (let i=0;i<5;i++) b.box('warehouse-roof-sawtooth','#6b8eaa',-10+i*5,10.65,-2,3,.7,13);
    for(let i=0;i<5;i++) b.box('shopping-cart-rail','#82939d',-11+i*.75,.9,10, .1,1.1,1.7);
    b.box('cart-corral-crossbar','#82939d',-9.5,1.2,10.85,3.4,.12,.12);
    b.box('roof-vent','#697f8d',9,10.7,-6,3,1,2);
    b.sign('NORD HOME','#f2cb35',4,8,7.25,12,1.8);
  }},
  { id: 'heju-home-showroom', name: 'Heju Chinese Homewares Showroom', category: 'homewares', build(b) {
    b.box('showroom-platform','#b6a18b',0,.25,0,26,.5,20);
    b.box('rear-showroom-wing','#ede0c9',0,5,-4,24,9.5,10);
    b.box('upper-gallery','#ddc6a1',0,7.6,1,24,4.3,10);
    b.box('gallery-glass-band','#46686b',0,7.6,6.1,22,2.7,.16);
    for(const x of [-10,-5,0,5,10]) b.box('gallery-screen-fin','#785343',x,7.6,6.4,.25,3.5,.6);
    for(const x of [-10,0,10]) b.box('timber-pier','#624b3d',x,2.7,6.5,.6,4.8,.7);
    for(const x of [-5,5]) {
      b.box('display-bay-back','#ac997e',x,2.5,4,8,4, .15);
      b.box('display-floor','#d7c2a2',x,.6,6.3,8,.2,4.6);
      b.box('sofa-seat','#a64f39',x,1.3,6.4,4.5,.7,1.5);
      b.box('sofa-back','#a64f39',x,1.85,5.8,4.5,1.2,.5);
      for(const s of [-1,1]) b.box('sofa-arm','#a64f39',x+s*2.1,1.7,6.4,.4,.7,1.7);
      b.box('tea-table','#785343',x,1.1,8.4,2.4,.2,1.2);
      for(const s of [-1,1]) b.box('table-leg','#785343',x+s*.9,.8,8.4,.2,.6,.8);
    }
    for(const side of [-1,1]) {
      const r=side*5.8;
      b.box('upturned-eave','#604c44',r,10.1,0,12,.35,20,side*.08);
      b.box('roof-edge','#bda17c',r,9.95,10.1,12,.22,.35,side*.08);
    }
    b.box('central-entrance','#263d3e',0,2.3,3.95,2.3,3.8,.2);
    b.box('entrance-lintel','#b69161',0,4.45,6.6,4,.45,1.1);
    for(const x of [-11,11]) {
      b.cylinder('stone-planter','#807a6d',x,.8,8.7,.75,.6,1.1);
      b.cylinder('clipped-shrub','#43684b',x,1.7,8.7,.85,.85,1.1);
    }
    b.sign('合居 HOME','#b69161',0,5.05,6.6,7,.9);
  }},
  { id: 'lumen-lighting-shop', name: 'Lumen Lighting and Decor', category: 'homewares', build(b) {
    b.box('shop-base','#a4a8ac',0,.25,0,23,.5,19);
    b.box('rear-solid-wall','#454958',0,4,-6.5,21,7.5,4);
    for(const x of [-10,10]) b.box('side-gallery-wall','#454958',x,4,0,1,7.5,16);
    b.box('flat-floating-roof','#c5c8ca',0,8,0,23,.45,19);
    b.box('glowing-roof-edge','#f5cd76',0,7.7,9.55,23,.15,.18);
    b.box('recessed-entrance','#1a2935',0,2.4,6.9,3.5,4.3,.15);
    b.box('door-center-bar','#a7b0b6',0,2.4,7.1,.1,4.3,.15);
    for(const x of [-6,6]) {
      b.box('display-raised-deck','#d2c4ab',x,.65,4.6,7,.5,7);
      b.box('display-rear-panel','#867c70',x,3.7,1.3,7,5.6,.15);
      for(const dx of [-2,0,2]) {
        b.cylinder('pendant-cable','#353944',x+dx,6.2,4.5,.025,.025,2.3,6);
        b.cylinder('pendant-shade','#e0b867',x+dx,4.8,4.5,.35,.85,.65);
        b.cylinder('pendant-diffuser','#fff0bb',x+dx,4.45,4.5,.62,.62,.08);
      }
      b.cylinder('floor-lamp-base','#505660',x-2.4,.95,7.2,.6,.6,.16);
      b.cylinder('floor-lamp-stem','#a88d55',x-2.4,2,7.2,.07,.07,2.1,8);
      b.cylinder('floor-lamp-shade','#eee2bb',x-2.4,3.3,7.2,.4,.75,.7);
      b.box('display-console','#624b3d',x+1,1.7,7.1,3.4,.18,1);
      for(const dx of [-.4,2.4]) b.box('console-leg','#624b3d',x+dx,1.2,7.1,.15,1,.8);
      b.cylinder('display-vase','#d08d69',x+1,2.15,7.1,.2,.4,.7);
    }
    for(const x of [-9.5,-2,2,9.5]) b.box('facade-mullion','#c5c8ca',x,4.2,8.6,.14,6.7,.14);
    b.box('entrance-canopy','#454958',0,5,8.5,4.3,.3,4);
    b.sign('LUMEN 灯饰','#ebce91',0,6.8,9.1,9,1.05);
  }}
];
