export const buildings = [
  {id:'tram-pavilion',name:'Junction Tram Pavilion',category:'transport',build(b){
    b.box('raised-platform','#b7b2a5',0,.4,0,28,.8,22);
    b.box('ticket-hall','#c8b48c',-6,3.8,-4,12,6.8,12);
    b.roof('station-gable','#506d66',-6,8.1,-4,14,2.1,14);
    b.box('clock-tower','#c8b48c',5,6,-6,4,12,5);
    b.roof('tower-cap','#506d66',5,13,-6,5.8,2,6.8);
    b.box('clock-face','#f6e8c5',5,10.2,-3.43,2.7,2.7,.14);
    b.box('clock-minute-hand','#34433c',5,10.65,-3.32,.12,.85,.08);
    b.box('clock-hour-hand','#34433c',5.35,10.2,-3.31,.7,.12,.08);
    b.box('platform-canopy','#4d716b',0,5.2,5,28,.35,9);
    b.box('canopy-front-edge','#d9ba79',0,5.05,9.55,28,.5,.2);
    for(const x of [-12,-4,4,12]){
      b.cylinder('platform-column','#637369',x,2.9,7,.15,.21,4.6);
      b.box('column-cap','#d9ba79',x,4.9,7,.9,.25,.9);
    }
    for(const x of [-10,-6,-2]){
      b.box('ticket-hall-window','#315a64',x,3.9,2.08,2.2,3.3,.16);
      b.box('window-lintel','#ede0bf',x,5.65,2.22,2.6,.2,.25);
    }
    b.box('ticket-counter','#725d42',-6,1.8,2.35,3.3,1.2,.7);
    for(const x of [-8,7]){
      b.box('passenger-bench','#74543c',x,1.1,5,4,.22,.9);
      b.box('bench-back','#74543c',x,1.65,4.6,4,.85,.14);
      for(const dx of [-1.5,1.5])b.box('bench-leg','#425250',x+dx,.75,5,.15,.7,.5);
    }
    b.box('boarding-edge','#e4be4c',0,.87,10.3,27,.06,.45);
    b.box('timetable-case','#315a64',12,2.6,3,1.8,2.4,.3);
    b.sign('JUNCTION / 电车站','#244f4a',0,4.35,9.7,9,1);
  }},
  {id:'bus-interchange',name:'Crossline Bus Hall',category:'transport',build(b){
    b.box('interchange-slab','#a5afb0',0,.25,0,29,.5,23);
    b.box('waiting-hall','#d9e0de',-9,3.5,-2,9,6.5,16);
    b.box('upper-glazed-gallery','#366a77',-9,6,-2,9.2,2,16.2);
    b.box('gallery-roof','#edf1e7',-9,7.2,-2,10,.3,17);
    for(const x of [-2,5,12]){
      b.box('bay-roof-wing','#e5eee6',x,5.7,0,6,.28,21,-.1);
      b.box('bay-roof-rib','#7a9698',x,5.9,0,.18,.4,21);
      for(const z of [-7,7]){
        b.cylinder('bay-pier','#55797a',x,3,z,.18,.28,5.5);
        b.box('pier-head','#55797a',x,5.4,z,2,.25,.5);
      }
      b.box('boarding-island','#bcc7bf',x,.55,6.7,4,.6,7);
      b.box('bay-yellow-edge','#e2b64d',x+2.05,.9,6.7,.15,.07,7);
      b.box('information-display','#243c4c',x,4.3,7.3,2.8,.85,.22);
    }
    for(const z of [-6,-1,4])b.box('hall-side-window','#366a77',-4.4,3,z,.13,3,3.8);
    b.box('hall-entrance','#294853',-9,2.2,6.1,3.2,3.8,.18);
    b.box('arrival-canopy','#e3af52',-9,4.5,8,9,.25,4);
    for(const x of [-12,-6])b.box('waiting-seat','#e3af52',x,1,7.5,1.5,.3,.8);
    b.box('route-map-kiosk','#315a64',-13,2.3,9,1.6,3.2,.4);
    b.box('rooftop-vent','#7c9196',-9,7.9,-6,3,1.1,2);
    b.sign('CROSSLINE / 公交换乘','#285b66',-9,5.2,6.25,8,1.1);
  }},
  {id:'parcel-depot',name:'Swift Parcel Depot',category:'transport',build(b){
    b.box('depot-slab','#92999c',0,.3,0,29,.6,23);
    b.box('warehouse','#b4bcc0',1,4.3,-3,24,8,16);
    b.roof('industrial-gable','#51626e',1,9,-3,25,1.6,17);
    b.box('dispatch-office','#e7b550',-10,2.1,6,7,3.6,8);
    b.box('office-flat-roof','#475b66',-10,4.1,6,7.7,.3,8.5);
    b.box('office-glass','#284e63',-10,2.5,10.08,5,1.8,.16);
    b.box('dock-platform','#868c90',5,1,6.5,17,1.4,5);
    for(const x of [-1,5,11]){
      b.box('loading-door-surround','#e7b550',x,3.7,5.08,4.8,5.5,.3);
      b.box('roller-loading-door','#667b86',x,3.7,5.3,4.2,5.1,.16);
      for(let y=1.5;y<6;y+=.85)b.box('door-rib','#99a8ac',x,y,5.42,4.1,.07,.08);
      b.box('dock-buffer-left','#263640',x-1.6,1.8,8.95,.3,.8,.3);
      b.box('dock-buffer-right','#263640',x+1.6,1.8,8.95,.3,.8,.3);
    }
    b.box('dock-canopy','#e7b550',5,6.9,7,18,.25,5);
    for(const x of [-2,12])b.box('canopy-post','#475b66',x,3.6,9.2,.18,6.2,.18);
    for(const x of [-12,-10,-8]){
      b.box('parcel-locker','#e4e5d9',x,1.6,-10.9,1.6,2.2,.45);
      b.box('locker-divider','#607c8b',x,1.6,-10.62,1.5,.05,.08);
    }
    b.box('pallet-base','#8e6846',9,1.85,7,2,.25,1.4);
    b.box('stacked-cartons','#c49763',9,2.65,7,1.8,1.35,1.2);
    b.box('parcel-ramp','#9ca5a8',2,.7,10,5,.2,3);
    b.sign('SWIFT / 快递集散','#304e62',1,7.65,5.2,15,1.1);
  }}
];
