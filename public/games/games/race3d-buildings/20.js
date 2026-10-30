export const buildings = [
  {id:'lotus-cultural-pavilion',name:'Lotus Cultural Pavilion',category:'culture',build(b){
    b.box('stone-platform','#a7a298',0,.5,0,26,1,20);
    b.box('upper-platform','#d4c9b1',0,1.15,0,22,.3,17);
    for(let i=0;i<3;i++)b.box('entry-stair','#bcb5a5',0,.18+i*.26,10-i*.7,9,.36+i*.15,1.4);
    b.box('inner-cultural-hall','#a33d30',0,4.1,-2,16,5.6,10);
    b.roof('lower-jade-gable','#3c7061',0,7.8,-1,26,3.2,18);
    b.box('lower-eave-gold-edge','#cda95b',0,6.25,8,26,.23,.25);
    b.box('upper-lantern-hall','#a33d30',0,9.5,-1,10,2.3,8);
    b.roof('upper-jade-gable','#3c7061',0,12,-1,16,3,12);
    b.box('upper-eave-edge','#cda95b',0,10.55,5,16,.22,.25);
    b.box('gilded-ridge','#d4b46a',0,13.6,-1,.22,.25,12);
    for(const x of [-10,-6,6,10]){
      b.cylinder('red-veranda-column','#9a302b',x,3.8,6,.24,.32,5);
      b.box('carved-column-bracket','#ceab62',x,6.05,6,1.4,.35,1.2);
      b.cylinder('stone-column-foot','#9b9b92',x,1.5,6,.46,.52,.45);
    }
    for(const x of [-6,-3,3,6]){
      b.box('lattice-window','#352b26',x,4.3,3.06,2.2,2.9,.15);
      b.box('gold-window-mullion','#c59956',x,4.3,3.16,.12,2.9,.1);
      b.box('gold-window-rail','#c59956',x,4.3,3.17,2.2,.12,.1);
    }
    b.box('double-door','#542e28',0,3.2,3.08,2.6,3.8,.18);
    for(const x of [-7,7]){
      b.cylinder('lantern','#dc6743',x,5.3,7,.5,.5,.9);
      b.cylinder('lantern-gold-cap','#d9b764',x,5.8,7,.54,.54,.12);
    }
    b.cylinder('lotus-stone-basin','#777f79',9,1.6,-7,1.3,1,.7);
    b.cylinder('lotus-water','#438782',9,1.98,-7,1.1,1.1,.06);
    b.sign('LOTUS CULTURE','#723f2f',0,5.65,6.3,8,.8);
  }},
  {id:'neighborhood-community-hub',name:'Neighborhood Community Hub',category:'community',build(b){
    b.box('accessible-plaza','#c8bda8',0,.2,0,29,.4,22);
    b.box('public-services-wing','#e6c89d',-8,3.4,-2,12,6.4,17);
    b.box('sports-hall','#ce7b54',6,4.6,-4,14,8.8,14);
    b.box('stepped-upper-reading-room','#efe1c6',-7,8.2,-5,10,3.2,10);
    b.box('roof-garden-slab','#7d8f70',-7,10,-5,11,.35,11);
    b.box('hall-monitor','#8faeb3',6,9.3,-4,9,1,9);
    b.box('hall-monitor-cap','#ebdabe',6,10,-4,10,.4,10);
    b.box('public-entry-glass','#3d6975',-2,2.5,6.6,4,4.5,.2);
    b.box('entry-canopy','#dca34b',-2,5.2,8,8,.3,5);
    for(const x of [-5,1])b.box('canopy-column','#7e6552',x,2.6,9.6,.2,5.2,.2);
    for(const x of [-12,-8])for(const y of [3,8])b.box('reading-window','#3c6876',x,y,6.6-(y>5?6:0),2.6,2.5,.15);
    for(const x of [2,6,10]){
      b.box('hall-window','#456c78',x,5,3.1,2.6,4.8,.2);
      b.box('hall-sunshade','#f0d4a6',x,7.7,3.8,3,.2,1.5);
    }
    for(const x of [-11,-7,-3]){
      b.box('rooftop-planter','#b07f59',x,10.45,-1.2,2,.65,1.2);
      b.box('rooftop-shrub','#63845a',x,11,-1.2,1.8,.6,1);
    }
    b.box('notice-board-frame','#735d48',10,2.4,8.7,4.2,2.6,.25);
    b.box('notice-board','#efe5cc',10,2.4,8.9,3.8,2.2,.12);
    for(const x of [8.8,10,11.2])b.box('community-notice','#b6c8b5',x,2.5,9,.8,1.3,.05);
    for(const x of [-10,5]){
      b.box('plaza-bench','#87694d',x,.9,8.5,4,.25,1);
      for(const dx of [-1.4,1.4])b.box('bench-foot','#737a72',x+dx,.5,8.5,.3,.8,.7);
    }
    b.box('access-ramp','#b2ac9e',-8,.4,10,9,.25,2,.05);
    b.sign('COMMUNITY HUB','#925c39',-2,4.6,6.9,8,.8);
  }},
  {id:'harbor-seafood-house',name:'Harbor Seafood House',category:'restaurant',build(b){
    b.box('raised-timber-deck','#9b8064',0,.65,0,28,.5,22);
    b.box('whitewashed-dining-house','#e3ded1',-3,3.9,-3,19,6,14);
    b.roof('weathered-blue-gable','#486f7c',-3,8,-3,21,3.2,16);
    b.box('kitchen-wing','#c9d0c8',10,3.1,-5,6,4.8,10);
    b.box('kitchen-roof','#697e7c',10,5.7,-5,7,.3,11);
    for(const x of [-10,-5,0,5]){
      b.box('dining-glazing','#417b87',x,4,4.1,3.3,3.4,.2);
      b.box('window-shutter','#698d8d',x-1.85,4,4.24,.35,3.6,.2);
    }
    b.box('seafood-tank-base','#324b54',8,1.5,4.4,7,1.2,2.4);
    b.box('seafood-tank-glass','#6ca8ad',8,2.65,4.4,7,1.2,2.4);
    b.box('tank-water-surface','#87bdc1',8,3.29,4.4,6.8,.06,2.2);
    for(const x of [5.8,8,10.2]){
      b.box('tank-divider','#cfddd7',x,2.65,5.64,.1,1.3,.08);
      b.box('modeled-fish','#e4b878',x,2.6,5.7,.8,.24,.12,.15);
    }
    b.box('terrace-awning','#d6b77b',-5,5.5,7.5,17,.22,6);
    for(const x of [-12,2])b.box('awning-post','#725d49',x,3.2,10,.17,4.6,.17);
    for(const x of [-9,-3,3]){
      b.cylinder('terrace-table','#ac8b60',x,1.65,8.4,1.2,1.2,.15);
      b.cylinder('table-pedestal','#665950',x,1.25,8.4,.17,.35,.8);
      for(const dx of [-1.6,1.6]){
        b.box('dining-chair-seat','#846e55',x+dx,1.25,8.4,.7,.15,.7);
        b.box('dining-chair-back','#846e55',x+dx,1.7,8.1,.7,.9,.12);
      }
    }
    for(const x of [-13,13]){
      b.box('deck-railing','#698280',x,1.9,0,.12,.15,21);
      for(const z of [-9,0,9])b.box('railing-post','#698280',x,1.4,z,.18,1.4,.18);
    }
    b.cylinder('kitchen-extraction','#83928d',10,6.8,-6,.55,.55,2);
    b.sign('HARBOR SEAFOOD','#355e69',-3,6.2,4.25,11,.85);
  }},
];
