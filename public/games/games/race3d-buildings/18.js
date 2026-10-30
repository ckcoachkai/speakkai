/** Three original residential forms, with the inhabited frontage toward +Z. */
export const buildings = [
  {id:'home-shikumen-lane',name:'Stone Gate Lane Houses',category:'residential',build(b){
    b.box('lane-paving','#a7a098',0,.18,0,27,.36,22);
    for(const x of [-8.5,8.5]){
      b.box('red-brick-lane-house','#8d5549',x,5.2,-1,8,10,17);
      b.roof('charcoal-tile-gable','#424d50',x,11.3,-1,9,2.4,18);
      b.box('white-eaves-band','#d1c2ad',x,9.7,7.6,8.4,.4,.5);
      for(const y of [3.1,7])for(const dx of [-2,2]){
        b.box('stone-window-lintel','#c2b5a0',x+dx,y+1.1,7.65,2.7,.3,.5);
        b.box('timber-casement','#33484b',x+dx,y,7.7,2.3,1.9,.2);
        b.box('window-central-mullion','#ddd0b8',x+dx,y,7.86,.12,1.9,.12);
      }
      b.box('chimney-stack','#7e4a40',x+2.2,12,-4,1.1,2.2,1.3);
      b.box('chimney-coping','#c3b7a6',x+2.2,13.2,-4,1.4,.25,1.6);
      b.box('street-door','#503a2e',x,1.7,7.85,1.6,3,.25);
    }
    for(const x of [-3.1,3.1]){
      b.box('carved-stone-gate-pier','#c0b7a7',x,2.7,8.3,1,5,1.4);
      b.box('gate-pier-cap','#e2d5be',x,5.25,8.3,1.45,.3,1.7);
    }
    b.box('stone-gate-lintel','#bfb5a5',0,4.9,8.3,6.8,.6,1.4);
    b.roof('gate-crown-pediment','#ded0ba',0,5.6,8.3,6.6,1,1.5);
    b.box('dark-recessed-lane-gate','#493c32',0,2.3,8.2,4.9,4.2,.2);
    for(const x of [-1.2,1.2])b.box('gate-door-knocker','#b39258',x,2.3,8.4,.22,.3,.14);
    b.box('upper-lane-link','#825145',0,7.9,-6,9,3.6,5);
    b.roof('rear-bridge-roof','#465253',0,10.1,-6,10,1.4,6);
    b.box('laundry-line','#535557',0,7.2,2.5,9,.06,.06);
    for(const [x,color]of [[-2,'#e2c4b1'],[0,'#88a7ad'],[2,'#e9dfc5']])b.box('hanging-linen',color,x,6.6,2.5,1.2,1.2,.08);
    b.sign('LANE 18','#594c41',0,4.9,9.04,2.3,.35);
  }},
  {id:'home-balcony-apartments',name:'Terrace Garden Apartments',category:'residential',build(b){
    b.box('apartment-podium','#aaa99c',0,.35,-1,26,.7,20);
    b.box('main-residential-slab','#dbd1bd',-2,12.6,-2,20,24.5,16);
    b.box('exposed-stair-tower','#7a8b8f',10,14,-4,4.5,27.3,11);
    b.box('stair-crown','#b9c5c1',10,27.8,-4,5,.4,11.5);
    b.box('ground-glazed-lobby','#244951',-2,2.2,6.1,18,3,.2);
    b.box('entry-canopy','#6d7778',-2,4.1,8,11,.35,4);
    b.box('glass-entry-doors','#41616a',-2,2.1,6.4,3.8,3.1,.2);
    for(let f=0;f<5;f++){
      const y=6+f*4;
      for(const x of [-8,-1,6]){
        b.box('balcony-sliding-doors','#34555e',x,y,6.13,4.4,2.7,.15);
        b.box('projecting-balcony-slab','#e5dfd0',x,y-1.5,7.25,5.4,.3,2.6);
        b.box('balcony-glass-rail','#71979e',x,y-.8,8.45,5.1,1.15,.12);
      }
      b.box('stairwell-window','#2f515e',10,y,1.6,2,2.8,.15);
    }
    for(const x of [-9,-2,5]){
      b.box('roof-planter','#b6a08c',x,25.4,-1,4,.8,2.5);
      b.box('roof-garden-shrub','#5a7651',x,26.2,-1,3.5,1.2,2);
    }
    b.box('roof-pergola-beam','#716250',-2,28,-5,17,.3,6);
    for(const x of [-9,5])b.box('pergola-post','#716250',x,26.7,-5,.22,2.3,.22);
    b.box('mailbox-bank','#4e6467',-9,1.3,9,3,1.6,.6);
    b.sign('TERRACE GARDENS','#435b50',-2,4.6,9.9,7,.7);
  }},
  {id:'home-modern-townhouse',name:'Courtyard Terrace Townhouse',category:'residential',build(b){
    b.box('stone-garden-platform','#b6b1a5',0,.3,0,27,.6,22);
    b.box('ground-floor-stone-wing','#aaa28e',-5,2.4,-1,14,4.2,18);
    b.box('floating-white-upper-floor','#e6e4dc',-1,6.6,-2,21,4.2,15);
    b.box('timber-stair-volume','#8b6245',9,5,-4,4,9.4,11);
    b.box('upper-roof-overhang','#555f60',-1,8.9,-2,22,.35,16);
    b.box('upper-ribbon-glass','#2b555d',-1,6.5,5.6,18,2.7,.18);
    for(const x of [-8,-4,0,4,8])b.box('ribbon-window-mullion','#b9b8ab',x,6.5,5.75,.12,2.7,.1);
    b.box('ground-sliding-glass','#375c62',-5,2.4,8.1,11,3,.16);
    b.box('ground-glass-divider','#8e968c',-5,2.4,8.25,.12,3,.1);
    b.box('entry-pivot-door','#614735',8,2.2,1.7,2.5,3.6,.2);
    b.box('door-pull','#c4c4b4',8.8,2.3,1.85,.08,1.1,.08);
    b.box('entrance-path','#d9d4c5',8,.7,5,4,.2,7);
    b.box('upper-terrace-deck','#967957',-1,4.4,7.1,21,.3,3);
    b.box('terrace-glass-railing','#8aa5a4',-1,5,8.6,21,1,.12);
    for(let i=0;i<7;i++)b.box('vertical-cedar-screen','#8f684a',-10.5+i*.6,6.5,5.95,.22,3.5,.3);
    b.box('garage-wing','#687675',8,2.2,-6.3,6,3.8,7);
    b.box('garage-door','#3e4b4c',8,2,-2.7,4.8,2.7,.2);
    for(let y=1;y<3.1;y+=.5)b.box('garage-door-seam','#85928b',8,y,-2.55,4.8,.045,.06);
    b.box('entry-water-basin','#777f79',1,.8,9.5,4,1,2.4);
    b.box('reflecting-water','#497d88',1,1.32,9.5,3.7,.08,2.1);
    for(const x of [-10,-6]){
      b.box('front-garden-bed','#837763',x,.9,10,3,1.2,2);
      b.cylinder('sculpted-shrub','#52704a',x,1.9,10,.8,1,1.1);
    }
    b.box('solar-panel','#283e50',-3,9.2,-3,9,.18,5);
    b.box('panel-frame','#bbc0b4',-3,9.32,-.5,9,.06,.1);
  }}
];
