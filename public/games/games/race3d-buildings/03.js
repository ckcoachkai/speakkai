// Three grocery architectures: a dock-served big shop, an open wet market,
// and a narrow neighborhood convenience store. Original procedural geometry.
export const buildings = [
  { id: 'supermarket-loading-dock', name: 'Fresh Avenue Supermarket', category: 'grocery', build(b) {
    b.box('raised-supermarket-plinth','#b5b9b7',0,.3,0,28,.6,21);
    b.box('wide-low-market-hall','#dfdfcb',0,4,-2,27,7.4,16);
    b.box('green-front-parapet','#477b59',0,7.9,6.1,28,1.8,.6);
    b.box('flat-roof-overhang','#e7e4d4',0,7.3,-2,28,.4,17);
    b.box('glass-shop-front','#52888e',-3,3.4,6.15,20,5.1,.16);
    for (const x of [-12,-8,-4,0,4,7]) b.box('glazed-facade-mullion','#edece2',x,3.4,6.3,.18,5.5,.2);
    b.box('entry-recess','#273e40',0,2.4,6.4,4,3.7,.2);
    for (const x of [-1,1]) b.box('automatic-glass-door','#77b6bb',x,2.4,6.6,1.85,3.5,.1);
    b.box('entry-floating-canopy','#557c4c',0,5,8.1,9,.35,4);
    for(const x of [-4,4]) b.cylinder('canopy-slender-pier','#bac8b5',x,2.5,9.5,.12,.12,5);
    b.box('entry-paving','#b1b9ad',0,.15,9,11,.3,5);
    b.box('dock-platform','#737b7b',10,1.1,7.7,6,2.2,3.5);
    b.box('loading-shutter','#667b7d',10,3.8,6.3,5,4.5,.24);
    for(let y=2;y<6;y+=.55) b.box('shutter-horizontal-seam','#9eaaa9',10,y,6.48,4.8,.065,.06);
    for(const x of [8,12]) b.box('dock-rubber-bumper','#303c3b',x,1.2,9.52,.4,1.5,.25);
    b.box('dock-weather-hood','#537d58',10,6.4,7.4,6.3,.3,3);
    for(const x of [-10,-6]) {
      b.box('roof-cooling-unit','#879598',x,8.1,-4,2.6,1.2,3);
      b.cylinder('cooling-fan','#34464b',x,8.78,-4,.8,.8,.12,12);
    }
    b.box('trolley-shelter-roof','#79a683',-9,2.1,9.4,6,.2,3.8);
    for(const x of [-11.8,-6.2]) b.box('trolley-shelter-post','#afbdb8',x,1.1,9.5,.12,2.1,.12);
    for(let i=0;i<4;i++) b.box('nested-shopping-trolley','#9baeb0',-10.7+i*.75,.85,9.3,.55,.8,1.2);
    b.sign('FRESH AVENUE 鲜生活','#376848',-3,7.9,6.48,17,1.3);
  }},
  { id: 'chinese-open-wet-market', name: 'Morning Lane Wet Market', category: 'grocery', build(b) {
    b.box('market-stone-base','#a6a495',0,.2,0,28,.4,22);
    b.box('rear-storage-wall','#d2c6a5',0,2.7,-9.3,27,5,.7);
    for(const x of [-13,0,13]) for(const z of [-8,1,9]) b.box('market-red-timber-post','#874c35',x,3.1,z,.45,6,.45);
    for(const x of [-6.5,6.5]) {
      b.roof('twin-vented-gable-roof','#517b73',x,6.4,-.3,13.7,2.2,21);
      b.box('roof-ridge-cap','#315a54',x,8.6,-.3,.35,.25,21.6);
    }
    b.box('front-market-beam','#864d39',0,5.9,10.2,28,.5,.5);
    b.box('open-central-passage','#c8c3ae',0,.24,.5,4,.1,21);
    for(const x of [-9,-4.5,4.5,9]) {
      b.box('individual-market-counter','#b99a6e',x,1,7.5,3.6,1.6,2.5);
      b.box('hygienic-countertop','#d9e1d4',x,1.88,7.5,3.8,.18,2.7);
      b.box('stall-awning','#d5904c',x,4.2,7.4,4.1,.2,3.3);
      for(const dx of [-1.7,1.7]) b.box('stall-awning-post','#7a5644',x+dx,2.5,8.6,.12,3.4,.12);
      for(let i=0;i<3;i++) {
        b.box('produce-crate','#795b38',x-1.1+i*1.1,2.1,7.7,.95,.35,1.7);
        b.cylinder('heaped-round-produce',['#55984c','#d88035','#b9a52a'][i],x-1.1+i*1.1,2.4,7.7,.32,.4,.35,8);
      }
    }
    for(const x of [-8,8]) {
      b.box('rear-fish-counter','#8faaa9',x,1,-3,6,1.5,2);
      b.box('fish-display-ice','#d1e9e3',x,1.8,-3,5.8,.2,1.8);
      b.box('storage-crate-stack','#8a7854',x,1.2,-7,3,2,2);
    }
    for(const x of [-11.5,11.5]) b.cylinder('red-entry-lantern','#ce5b43',x,4.9,10.7,.6,.6,1.1,12);
    b.sign('早市 MORNING MARKET','#624c31',0,5.6,10.55,10,1.05);
  }},
  { id: 'corner-convenience-store', name: 'Night Owl Corner Shop', category: 'grocery', build(b) {
    b.box('narrow-corner-shop-base','#a7a7a2',0,.2,0,14,.4,17);
    b.box('upper-rental-apartment','#d7cbb8',0,6.2,-1,12,11.6,13);
    b.box('ground-floor-shop-glass','#3d686e',0,2,5.6,11.6,3.3,.22);
    b.box('corner-shop-side-glass','#426b70',6.08,2,2,.16,3.3,6.8);
    b.box('brand-stripe-fascia','#ecb351',0,4.2,5.8,12.6,.8,.45);
    b.box('brand-side-fascia','#ecb351',6.2,4.2,1,.45,.8,10);
    b.box('deep-entry-canopy','#347f78',0,3.5,7.1,12.8,.25,3);
    for(const x of [-5.5,-2,2,5.5]) b.box('storefront-frame','#dbe0cc',x,2,5.8,.12,3.3,.16);
    b.box('shop-door-dark-recess','#1d4348',2,1.9,5.96,2.2,3.1,.12);
    b.box('glass-entry-door','#86b7b4',2,1.9,6.06,1.9,2.9,.08);
    b.box('door-pull-handle','#e1e7d4',2.7,1.7,6.15,.06,.65,.09);
    for(const y of [6.4,9.7]) for(const x of [-3.1,3.1]) {
      b.box('upstairs-window-trim','#eee6d6',x,y,5.62,2.5,2.2,.22);
      b.box('upstairs-window-glass','#577e88',x,y,5.77,2.15,1.9,.12);
      b.box('window-central-mullion','#cbd5ca',x,y,5.86,.09,1.9,.08);
    }
    for(const x of [-4.8,4.8]) {
      b.box('wall-air-conditioner','#deddd1',x,7.9,5.95,1.3,.8,.65);
      for(let i=0;i<3;i++) b.box('ac-vent-slot','#7d8e8d',x,7.65+i*.17,6.31,1.1,.045,.05);
    }
    b.box('flat-roof-parapet','#827d71',0,12.1,-1,12.5,.35,13.5);
    b.box('ice-cream-freezer','#dee9df',-3.7,.95,7.6,2.7,1.3,1.4);
    b.box('freezer-sliding-glass','#76b6bc',-3.7,1.65,7.6,2.5,.1,1.2);
    b.box('parcel-locker-cabinet','#b94f38',4.8,1.4,7.7,1.7,2.4,1.2);
    for(const y of [.65,1.4,2.15]) b.box('parcel-locker-door','#d78054',4.8,y,8.34,1.5,.65,.07);
    b.box('delivery-crates','#4d896b',-5.5,.65,7.8,.7,.9,1);
    b.box('entrance-step','#cec6b7',1.8,.25,7,3.5,.5,1.8);
    b.sign('夜猫 24H','#286e67',0,4.2,6.08,9.6,.65);
  }}
];
