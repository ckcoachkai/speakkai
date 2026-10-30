/** Original entertainment architecture, shared primitive contract. */
export const buildings = [
  {id:'starlight-cinema',name:'Starlight Cinema',category:'entertainment',build(b){
    b.box('auditorium','#513d53',0,6,-2,25,12,18);
    b.box('art-deco-front','#e7c899',0,7,7,26,14,2);
    b.box('central-tower','#824957',0,11,7.7,6,22,2.2);
    b.box('tower-crown','#efd6a2',0,22.4,7.7,7,1,2.6);
    for(const x of [-10,-7,7,10])b.box('vertical-deco-fin','#f2d9aa',x,7.5,8.2,.45,13,.65);
    for(const x of [-2,0,2])b.box('tower-flute','#f1c864',x,15,9,.22,12,.3);
    b.box('marquee-shadow','#373548',0,4.7,9.1,23,.8,4.8);
    b.box('marquee-gold-edge','#efb65d',0,4.9,11.4,23,.6,.2);
    for(const x of [-10,-8,-6,-4,-2,0,2,4,6,8,10])b.box('marquee-bulb','#fff1b3',x,4.35,11.2,.22,.22,.22);
    for(const x of [-3,0,3]){
      b.box('entrance-frame','#cba577',x,1.9,8.2,2.5,3.8,.4);
      b.box('entrance-glass','#25485c',x,1.9,8.45,2.15,3.4,.12);
      b.box('door-pull','#e7ca91',x+.6,1.7,8.6,.08,.7,.1);
    }
    for(const x of [-9,9]){
      b.box('poster-case','#27323e',x,2.4,8.25,2.8,3.8,.5);
      b.box('poster-art','#cc674f',x,2.4,8.55,2.4,3.4,.1);
      b.box('poster-band','#edc16e',x,2.3,8.63,2.1,.5,.05);
    }
    b.box('ticket-booth','#b97759',0,1.35,10.6,1.5,2.7,1.6);
    b.box('ticket-glazing','#6b99a4',0,2,11.45,1.25,1.1,.08);
    b.box('entrance-step','#9c9995',0,.15,9.8,24,.3,3.9);
    b.sign('STARLIGHT CINEMA','#703747',0,5.8,11.25,14,1.2);
  }},
  {id:'pixel-arcade',name:'Pixel Arcade',category:'entertainment',build(b){
    b.box('low-game-hall','#33435f',0,4.5,-1,26,9,20);
    b.box('raised-game-loft','#486481',-6,10,-3,12,4,14);
    b.box('roof-parapet','#e980ba',-6,12.2,-3,13,.5,15);
    b.box('entry-portal-left','#6bd8ce',-7,4,9.2,2,8,2.3);
    b.box('entry-portal-right','#6bd8ce',7,4,9.2,2,8,2.3);
    b.box('entry-portal-top','#6bd8ce',0,8,9.2,16,1.8,2.3);
    b.box('recessed-glass','#18313e',0,3.6,9,12,6.8,.2);
    for(const x of [-4,0,4])b.box('glass-divider','#9dc7cf',x,3.6,9.2,.12,6.6,.15);
    b.box('portal-threshold','#c3c0ae',0,.15,10.4,15,.3,2.5);
    // Oversized physical joystick sculpture on the tower.
    b.box('joystick-plinth','#f0bd58',7,10.1,-2,6,2,6);
    b.cylinder('joystick-stem','#a5b1be',7,13,-2,.45,.45,4,10);
    b.cylinder('joystick-knob','#e878aa',7,15.2,-2,1.4,1.4,1.3,12);
    for(const x of [4.8,6.2,7.6,9])b.cylinder('arcade-button','#6bddd2',x,11.25,.1,.38,.38,.3,10);
    for(const x of [-11,-9,9,11]){
      b.box('pixel-facade-block','#8c8bda',x,6.4,9.25,1.3,1.3,.5);
      b.box('pixel-facade-lower','#edb758',x,4.6,9.25,1.3,1.3,.5);
    }
    for(const x of [-4.5,-1.5,1.5,4.5]){
      b.box('arcade-cabinet-base','#bd579d',x,1,7,1.2,2,1.3);
      b.box('arcade-cabinet-screen','#75d9e0',x,2.2,7.5,1,.9,.15);
      b.box('cabinet-control-shelf','#38375e',x,1.65,7.7,1.25,.18,.6);
    }
    b.sign('PIXEL PLAY','#523c7c',0,8.2,10.4,12,1.2);
  }},
  {id:'river-music-hall',name:'River Music Hall',category:'entertainment',build(b){
    b.box('acoustic-auditorium','#a4795c',0,6,-3,24,12,16);
    b.box('glazed-foyer','#355b68',0,3.4,7,24,6.8,4);
    // Three dramatic folded roof volumes over the performance hall.
    for(const x of [-8,0,8]){
      b.roof('folded-copper-roof','#668c85',x,14,-2,8,4,20);
      b.box('roof-fascia','#d0b386',x,12.1,8.15,8,.3,.45);
    }
    for(const x of [-11,-7,-3,3,7,11]){
      b.box('foyer-mullion','#dec39a',x,3.6,9.15,.18,7.2,.22);
      b.box('auditorium-acoustic-fin','#e2b788',x,7,-10.9,.4,12,.35);
    }
    b.box('entry-canopy','#d1b38c',0,4.4,10,12,.4,3.4);
    for(const x of [-5.5,5.5])b.cylinder('canopy-column','#bfad93',x,2.2,10.5,.16,.16,4.4,8);
    for(const x of [-2,2]){
      b.box('door-frame','#bd9c6b',x,1.8,9.35,3.2,3.6,.25);
      b.box('door-glass','#517e89',x,1.8,9.52,2.8,3.3,.08);
    }
    b.box('wide-arrival-step','#aaa69e',0,.15,10.3,23,.3,3.2);
    // Exterior organ-pipe sculpture and sheltered ticket desk.
    for(let i=0;i<6;i++)b.cylinder('organ-pipe-sculpture','#bca87d',-11+i*.65,3+i*.45,10.4,.2,.2,4+i*.9,8);
    b.box('ticket-counter','#be895d',9,1.2,8.8,3,2.4,1.4);
    b.box('ticket-window','#6a99a3',9,2.9,9,3,1,.15);
    b.box('service-wing','#716d65',11,3,-5,3,6,9);
    b.box('service-door','#444b4e',12.6,1.6,-5,.2,3.2,2.4);
    b.sign('RIVER MUSIC HALL','#304b56',0,5.5,9.3,13,1.25);
  }}
];
