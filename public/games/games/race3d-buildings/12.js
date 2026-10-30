export const buildings = [
 {id:'civic-fire-station',name:'River Fire Station',category:'civic',build(b){
  b.box('apron','#818887',0,.15,0,29,.3,23);
  b.box('apparatus-hall','#963d34',-3,4,-2,21,8,15);
  b.box('hose-training-tower','#b45443',10,9,-5,6,18,8);
  b.box('tower-roof','#e4d7bf',10,18.2,-5,7,.4,9);
  b.box('hall-coping','#e1d4be',-3,8.2,-2,22,.4,16);
  for(const x of [-10,-3,4]){
   b.box('bay-surround','#ddd5bf',x,3.3,5.6,6.3,6.5,.35);
   b.box('roller-door','#444e55',x,3.15,5.85,5.7,5.9,.2);
   for(let y=1;y<6;y+=1) b.box('door-slat','#8a969b',x,y,6,5.5,.1,.08);
   b.box('bay-glazing','#7ba1af',x,4.4,6.04,4.8,.7,.08);
   b.box('parking-guide','#eacb6c',x,.32,8.4,.18,.05,4.8);
  }
  for(let y=4;y<18;y+=4){b.box('tower-opening','#233d4c',10,y,-.94,3.1,2,.15);b.box('tower-sill','#d4bda4',10,y-1,-.7,3.5,.2,.4);}
  b.box('personnel-door','#31464d',10,1.6,.1,2.2,3.2,.2);
  b.box('entry-awning','#f0d9af',10,3.5,1.2,4,.3,3);
  b.cylinder('hydrant','#dc4935',12,.85,8,.3,.4,1.4);
  b.box('hydrant-arms','#dc4935',12,1,8,1.2,.22,.3);
  b.sign('FIRE • 消防','#f8e5c6',-3,7,6.1,17,.8);
 }},
 {id:'civic-post-office',name:'Jade Post Office',category:'civic',build(b){
  b.box('stone-plinth','#a5a99b',0,.35,0,28,.7,21);
  b.box('postal-hall','#dfd6b8',0,4,-2,25,7.3,16);
  b.roof('green-tiled-gable','#306e59',0,8.9,-2,27,2.6,18);
  b.box('porch-roof','#315e4c',0,4.5,7.5,17,.35,6);
  for(const x of [-7,7]) b.box('porch-column','#eee6d1',x,2.4,9,.6,4.2,.6);
  b.box('main-door','#254f4c',0,2.1,6.15,3.2,3.5,.2);
  b.box('door-transom','#90b1aa',0,4.1,6.2,3.2,.55,.15);
  for(const x of [-8,-4,4,8]){
   b.box('window-surround','#f3ead1',x,3.4,6.08,2.5,3.2,.25);
   b.box('window-glass','#3a6565',x,3.4,6.25,2.15,2.8,.1);
   b.box('window-mullion','#e1dfc4',x,3.4,6.33,.12,2.8,.08);
  }
  for(const x of [-10.5,-8.7]){
   b.box('mailbox-body','#28734f',x,1.2,9.7,1.3,2,.9);
   b.box('mail-slot','#182d2c',x,1.7,10.2,.9,.15,.08);
   b.roof('mailbox-cap','#245b42',x,2.35,9.7,1.5,.4,1.1);
  }
  for(let i=0;i<6;i++){
   b.box('parcel-locker','#b5c0ad',9+(i%2)*1.1,.85+Math.floor(i/2)*.95,8.9,1,.85,.9);
   b.box('locker-handle','#345c4b',9.3+(i%2)*1.1,.85+Math.floor(i/2)*.95,9.4,.1,.25,.08);
  }
  b.box('entry-step','#bfc2ad',0,.55,9,6,.4,4);
  b.sign('POST • 邮政','#256a4d',0,5.5,6.4,10,.8);
 }},
 {id:'civic-service-station',name:'Neighborhood Service Station',category:'civic',build(b){
  b.box('paved-site','#a6afb4',0,.15,0,29,.3,22);
  b.box('public-service-wing','#e1e4dc',-4,3,-2,19,5.7,14);
  b.box('watchtower-shaft','#5c7381',9,6,-5,5,12,6);
  b.box('observation-cabin','#c3d7dc',9,12.4,-5,7,3,8);
  b.box('cabin-roof','#244963',9,14.2,-5,8,.4,9);
  for(const x of [6,9,12])b.box('watchtower-glass','#366c83',x,12.5,-.91,2.5,1.8,.15);
  b.box('blue-service-band','#315c7d',-4,5.7,-2,20,.5,15);
  b.box('cantilever-entry','#244d6a',-3,3.8,7,14,.35,6);
  for(const x of [-9,3])b.box('canopy-column','#adbec4',x,1.9,9,.22,3.8,.22);
  for(const x of [-10,-6,-2,2]){
   b.box('service-glazing','#547d8b',x,2.4,5.08,3.3,3.5,.18);
   b.box('glazing-header','#c6d0ce',x,4.2,5.2,3.5,.15,.15);
   b.box('service-counter','#d4be9a',x,1.2,4.6,2.8,.8,.6);
  }
  b.box('sliding-door','#193c51',-3,1.8,5.25,2.5,3.2,.12);
  b.box('notice-kiosk','#365e72',9,1.65,8,3.5,3,.5);
  b.box('notice-display','#dfddca',9,1.8,8.3,2.9,2,.08);
  for(const x of [-12,-7,-2,3,13]) b.cylinder('safety-bollard','#385e75',x,.85,10.5,.15,.18,1.4);
  b.box('bench-seat','#94745d',7,.8,3.5,4,.2,.7);
  for(const x of [5.6,8.4])b.box('bench-leg','#45606a',x,.4,3.5,.15,.8,.6);
  b.box('bench-back','#94745d',7,1.3,3.2,4,.7,.15);
  b.sign('SERVICE • 警务','#244d70',-4,4.9,5.4,12,.8);
 }}
];
