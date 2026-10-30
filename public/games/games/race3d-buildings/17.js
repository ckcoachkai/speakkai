export const buildings = [
  {id:'ev-charge-station',name:'Jade Current Charging',category:'automotive',build(b){
    b.box('forecourt','#b2b8bb',0,.15,0,29,.3,23);
    b.box('service-lounge','#e3ebe4',0,2.1,-6,22,4.2,9);
    b.box('lounge-glazing','#315866',0,2,-1.42,17,3.2,.14);
    b.box('entrance-door','#163e48',0,1.65,-1.3,2.1,3,.16);
    b.box('green-roof-band','#37a47d',0,4.35,-6,23,.4,9.8);
    for(const x of [-10,10]) b.box('canopy-column','#cadbd6',x,2.9,5,.36,5.5,.36);
    b.box('solar-canopy','#26454b',0,5.8,4.8,27,.45,11);
    for(let x=-11;x<=11;x+=2.75) b.box('solar-panel','#244c68',x,6.08,4.8,2.55,.12,9.5);
    for(const x of [-8,0,8]){
      b.box('charging-bollard','#e2f3e9',x,1.65,2,1.1,3,.8);
      b.box('charger-screen','#183d4b',x,2.05,2.45,.68,.7,.08);
      b.box('cable-side','#273431',x+.62,1.4,2,.12,1.9,.16);
      b.box('plug-arm','#4bd3a3',x+.45,2.3,2,.5,.16,.2);
      b.box('bay-left-stripe','#e7eee8',x-2,.32,6,.14,.04,8);
      b.box('bay-right-stripe','#e7eee8',x+2,.32,6,.14,.04,8);
    }
    for(const x of [-12,12]){
      b.box('planter','#687d75',x,.6,-1,2,1,2);
      b.cylinder('planter-shrub','#4b8560',x,1.6,-1,.8,.65,1.1,8);
    }
    b.sign('JADE CURRENT · 充电','#20775e',0,4.7,-1.05,13,.8);
  }},
  {id:'auto-showroom',name:'Velocity Auto Gallery',category:'automotive',build(b){
    b.box('raised-plinth','#b7bcc1',0,.35,0,28,.7,22);
    b.box('rear-service-wall','#4c5663',0,3.8,-7,26,7,7);
    b.box('upper-gallery','#e0e4e9',-6,8,-3,13,2.1,14);
    b.box('showroom-glass','#426a79',0,3.8,6.8,26,6.4,.13);
    b.box('floating-roof','#cad0d5',0,7.1,1,28,.45,19);
    for(const x of [-12,-6,0,6,12]) b.box('facade-mullion','#d4dce1',x,3.9,6.96,.18,6.4,.18);
    b.box('revolving-door-frame','#8b979f',9,2.2,7.12,3.2,3.8,.25);
    b.box('entrance-glass','#234652',9,2.1,7.3,2.8,3.5,.12);
    for(const x of [-8,0]){
      b.cylinder('display-dais','#d7dce0',x,.95,4,3.1,3.1,.5,16);
      b.box('display-car-body','#c75a35',x,1.65,4,3.8,.85,1.7);
      b.box('display-car-cabin','#293e4b',x-.2,2.25,4,1.9,.6,1.5);
      for(const dx of [-1.2,1.2])for(const z of [3.15,4.85]) b.box('display-tire','#20252a',x+dx,1.35,z,.6,.7,.24);
    }
    for(const x of [-10,-5,0,5,10]) b.box('upper-sun-fin','#eff0e8',x,8.7,-3,.2,1.5,14);
    b.box('front-step','#b0b7be',0,.32,9,19,.6,3);
    b.box('reception-desk','#b29b7f',10,1.35,3,2.8,1.4,1.3);
    b.sign('VELOCITY AUTO','#273e55',-5,8,7.15,13,1.1);
  }},
  {id:'tire-repair-garage',name:'Longway Tire Works',category:'automotive',build(b){
    b.box('garage-foundation','#989c99',0,.2,0,28,.4,22);
    b.box('workshop-back','#a69177',0,3.25,-6,26,6.1,8);
    for(const x of [-12,0,12]) b.box('bay-brick-pier','#a07557',x,3.25,2,1.4,6.1,9);
    b.roof('workshop-gable','#58646a',0,7.35,-1,27,2.3,20);
    b.box('lintel','#beab8e',0,5.7,6.55,26,.8,.5);
    for(const x of [-6,6]){
      b.box('rolled-shutter','#727f83',x,5.1,6.5,9,.6,.8);
      b.box('bay-dark-back','#303e41',x,2.6,-1.8,9,4.7,.2);
      for(const dx of [-2.2,2.2]){
        b.box('lift-post','#d6a633',x+dx,2.1,1,.45,3.8,.5);
        b.box('lift-arm','#c89927',x+dx/2,.9,1,2.2,.22,.35);
      }
      b.box('lift-car-body','#6c8b9d',x,1.65,1,3.6,.8,1.6);
      b.box('lift-car-cab','#263e48',x,2.2,1,1.8,.6,1.45);
    }
    for(const x of [-10,-8])for(let y=0;y<4;y++){
      b.cylinder('stacked-tire','#292b2b',x,.65+y*.42,8.3,.72,.72,.4,12);
      b.cylinder('wheel-center','#687174',x,.87+y*.42,8.3,.27,.27,.025,12);
    }
    b.box('tool-cabinet','#b33d31',10,1.2,8.3,2,1.7,.9);
    for(let y=.7;y<1.9;y+=.35)b.box('drawer-handle','#cbd0cc',10,y,8.8,1.1,.05,.1);
    b.cylinder('air-compressor','#b84d35',3,.9,8.4,.45,.45,1.4,12);
    b.box('compressor-handle','#343b3d',3,1.75,8.4,.8,.1,.15);
    b.sign('LONGWAY TIRES · 轮胎','#854b2f',0,6.3,7,15,.9);
  }}
];
