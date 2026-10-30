// Original restaurant architecture; the names do not imply brand affiliation.
export const buildings = [
  { id: 'ember-tide-hotpot', name: 'Ember Tide Hotpot', category: 'hotpot', build(b) {
    b.box('stone-plinth','#9b9188',0,.25,0,27,.5,20);
    b.box('upper-dining-volume','#bd302c',0,6,-1,25,11,17);
    b.box('dark-ground-floor','#352e2b',0,2.1,1,25,3.8,17);
    b.box('roof-cornice','#e0b76c',0,11.7,-1,26,.5,18);
    b.box('front-canopy','#a51f27',0,4.5,9,27,.65,4);
    b.box('canopy-gold-edge','#e0b76c',0,4.25,11,27,.15,.18);
    for (const x of [-10,-5,5,10]) {
      b.box('dining-window','#41636a',x,7.65,7.6,3.7,4.3,.18);
      b.box('window-lintel','#e0b76c',x,9.9,7.8,4.1,.2,.4);
      b.box('window-base','#e0b76c',x,5.45,7.8,4.1,.2,.4);
      b.box('ground-glass','#41636a',x,2.15,9.6,3.8,2.9,.18);
      b.cylinder('lantern-cord','#24272b',x,3.9,10.5,.025,.025,.5,6);
      b.cylinder('red-hanging-lantern','#ef4936',x,3.2,10.5,.43,.43,.9,12);
      b.cylinder('lantern-bottom','#e6b95e',x,2.72,10.5,.24,.24,.08,10);
    }
    for(const x of [-12,12]) b.box('entry-column','#8b2828',x,2.3,10, .45,4.1,.5);
    b.box('door-reveal','#d1b17a',0,2,9.7,3.2,3.3,.28);
    b.box('double-glass-door','#23424b',0,1.95,9.9,2.7,3.05,.12);
    for(const x of [-.16,.16]) b.box('door-pull','#e5c278',x,1.9,10.03,.07,.75,.08);
    b.box('waiting-bench','#cc9a60',-8,.8,10.9,3.2,.3,.9);
    for(const x of [-9.2,-6.8]) b.box('bench-leg','#302b2c',x,.5,10.9,.15,.5,.6);
    b.box('menu-pedestal','#d4af6c',3,.8,10.6,.6,1.3,.6);
    b.box('menu-board','#552d29',3,1.65,10.6,1.2,.7,.18);
    b.box('roof-extraction-plant','#7a8585',-6,12.2,-4,4,1,3);
    for(const x of [3,6]) { b.cylinder('extractor-stack','#aaaead',x,12.5,-4,.45,.45,1.5,10); b.cylinder('rain-cap','#656d70',x,13.3,-4,.7,.7,.18,10); }
    b.sign('潮火锅 · EMBER TIDE','#ae2429',0,10.65,8,18,1.2);
  }},
  { id: 'sichuan-courtyard-pot', name: 'Sichuan Courtyard Hotpot', category: 'hotpot', build(b) {
    b.box('courtyard-paving','#8f9087',0,.15,0,28,.3,23);
    b.box('rear-dining-hall','#dbd1b6',0,2.7,-7.5,26,5.1,7);
    b.roof('rear-tiled-gable','#3e5351',0,5.2,-7.5,28,2.4,8);
    for(const x of [-10,10]) {
      b.box('courtyard-wing','#d4c6a4',x,2.3,1.8,6,4.3,12);
      b.roof('wing-tiled-roof','#3e5351',x,4.5,1.8,7.5,1.7,13);
      for(const z of [-2,3,7]) b.box('timber-wing-post','#702f25',x>0?6.8:-6.8,2.2,z,.32,4.4,.32);
    }
    for(const x of [-10,-5,0,5,10]) {
      b.box('rear-timber-post','#713e2a',x,2.5,-3.8,.25,5,.35);
      b.box('lattice-window','#39554b',x,3,-3.9,3.4,2.4,.18);
      for(const dx of [-1,0,1]) b.box('window-lattice','#b18a54',x+dx,3,-3.75,.07,2.4,.06);
    }
    for(const x of [-4,4]) {
      b.box('gateway-pier','#6f2921',x,2.5,9,.55,5,.55);
      b.cylinder('entry-lantern','#db3927',x,3.5,9.6,.45,.45,.8,12);
      b.cylinder('lantern-gold-cap','#d3ac55',x,3.94,9.6,.38,.38,.1,12);
    }
    b.box('gate-crossbeam','#6f2921',0,5,9,9,.4,1);
    b.roof('gate-tiled-roof','#374c49',0,5.2,9,10,1.2,2.7);
    b.sign('川院火锅 · SICHUAN COURT','#612b21',0,4.35,9.6,6,1);
    for(const x of [-3,3]) for(const z of [-.7,4.2]) {
      b.cylinder('round-dining-table','#b17b49',x,1.05,z,1.2,1.2,.18,12);
      b.cylinder('table-pedestal','#553d2b',x,.55,z,.23,.35,.9,8);
      b.cylinder('silver-hotpot','#c1c7c3',x,1.25,z,.42,.34,.2,12);
      for(const dx of [-1.7,1.7]) b.box('dining-stool','#805c37',x+dx,.48,z,.65,.9,.65);
    }
    b.box('service-counter','#875e3c',0,1,-3,3,1.7,1);
    for(const x of [-12.5,12.5]) { b.cylinder('entry-planter','#6c7570',x,.7,9,.8,.6,1.3,10); b.cylinder('bamboo-clump','#456f3b',x,2.3,9,.55,.4,2,7); }
  }},
  { id: 'solo-pot-bar', name: 'Solo Pot Bar', category: 'hotpot', build(b) {
    b.box('raised-platform','#c7c4b8',0,.2,0,26,.4,20);
    b.box('rear-kitchen','#527976',0,3,-5,24,5.6,9);
    b.box('upper-mezzanine','#e0c7a0',-6,6.6,-2,12,2.4,14);
    b.box('glass-dining-facade','#315b63',0,2.7,5.9,24,4.7,.16);
    b.box('flat-canopy','#e5d3b3',0,5.3,4,26,.3,9);
    b.box('upper-roof','#305a59',-6,8,-2,13,.3,15);
    for(const x of [-11,-7,-3,3,7,11]) b.box('slender-facade-frame','#c6a36e',x,2.6,6.05,.1,4.7,.18);
    b.box('recessed-entry','#203c42',0,2,6.12,2.5,3.6,.16);
    b.box('entry-handle','#dfbc78',.8,1.8,6.24,.06,.8,.06);
    b.box('outdoor-counter','#a8734b',0,1.45,8.8,20,.25,1.2);
    b.box('counter-base','#305b58',0,.75,8.5,19,1.3,.5);
    for(const x of [-8,-5.3,-2.6,0,2.6,5.3,8]) {
      b.cylinder('individual-pot','#becbca',x,1.7,8.8,.32,.27,.22,12);
      b.cylinder('stool-seat','#dba55b',x,.95,10.5,.4,.4,.16,12);
      b.cylinder('stool-stem','#314c4c',x,.5,10.5,.075,.075,.8,8);
      b.cylinder('stool-foot','#314c4c',x,.1,10.5,.3,.3,.12,10);
      b.box('vertical-sun-screen','#c6a36e',x,6.65,5.15,.12,2.2,.15);
    }
    for(const x of [-12,12]) b.box('canopy-post','#b18a5a',x,2.7,7.7,.2,5.2,.2);
    b.box('mezzanine-window','#315b63',-6,6.6,5.1,10,1.65,.15);
    b.box('ventilation-plenum','#879995',6,6,-5,7,1,2);
    for(const x of [3,5,7,9]) b.cylinder('kitchen-vent','#c5cccb',x,6.8,-5,.3,.3,.8,10);
    b.box('side-display-plinth','#d7c09a',11,1.1,7.6,1.2,1.8,1);
    b.cylinder('display-pot','#d6a65d',11,2.2,7.6,.48,.32,.4,12);
    b.sign('一人一锅 · SOLO POT','#315b58',4,4.6,6.2,10,.8);
  }}
];
