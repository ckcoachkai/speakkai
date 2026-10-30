export const buildings = [
  {id:'sunrise-elementary',name:'Sunrise Elementary',category:'education',build(b){
    b.box('school-foundation','#b9b3a6',0,.3,-1,28,.6,18);
    b.box('classroom-wing','#e4c69d',0,6,-3,27,11.4,13);
    b.box('central-stair-tower','#f1e8d1',0,7.2,1,6,13.8,9);
    b.box('tower-cap','#bd5944',0,14.3,1,7,.45,10);
    b.box('wing-parapet','#b45d46',0,11.9,-3,28,.5,14);
    for(const x of [-10,-6,6,10])for(const y of [2.8,6.2,9.6]){
      b.box('classroom-window-frame','#f5eee0',x,y,3.58,3.3,2.3,.22);
      b.box('classroom-blue-glass','#457581',x,y,3.72,2.9,1.9,.12);
      b.box('sunshade','#bd5944',x,y+1.2,4,3.6,.18,1.2);
    }
    for(const y of [6,9,12])b.box('stairwell-glass','#547d87',0,y,5.56,2,1.8,.12);
    b.box('double-entry','#315568',0,2,5.6,3.6,3.2,.18);
    b.box('entrance-canopy','#bd5944',0,4,6.5,6.5,.3,3);
    for(const x of [-2.8,2.8])b.box('entrance-pillar','#f1e8d1',x,2.1,7.4,.32,3.6,.32);
    for(let i=0;i<3;i++)b.box('wide-front-step','#aca99d',0,.15+i*.2,8.7-i*.65,8,.3+i*.4,1.3);
    b.cylinder('flagpole','#bdc6ca',10,5,8.5,.08,.08,10);
    b.box('school-flag','#cf4439',11.1,9,8.5,2.1,1.3,.08);
    b.sign('SUNRISE SCHOOL','#843e32',0,13.2,5.65,5,1);
  }},
  {id:'rainbow-kindergarten',name:'Rainbow Kindergarten',category:'education',build(b){
    b.box('playground-plinth','#b7d4c0',0,.15,0,28,.3,22);
    for(let i=0;i<3;i++){
      const x=(i-1)*8,c=['#e8ac68','#76b9ac','#e6948e'][i];
      b.box('small-classroom-house',c,x,2.6,-3,7.8,4.9,12);
      b.roof('classroom-gabled-roof',['#bf6654','#4f938c','#be696e'][i],x,5.8,-3,8,1.5,12.5);
      b.box('child-height-window','#426a7a',x-1.8,2.8,3.12,2.1,1.7,.16);
      b.box('child-height-window','#426a7a',x+1.8,2.8,3.12,2.1,1.7,.16);
      b.box('little-classroom-door','#f5dfaf',x,1.7,3.16,1.2,2.8,.18);
    }
    b.box('covered-play-canopy','#f5cc63',0,4.1,7,17,.3,5);
    for(const x of [-7.5,0,7.5])for(const z of [5,9])b.cylinder('colorful-play-column',x===0?'#d97d75':'#6d9bb5',x,2,z,.14,.14,4);
    b.box('sandbox-rim','#c38d5d',-10,.4,7,4,.5,4);
    b.box('sandbox-sand','#e9cf8b',-10,.68,7,3.5,.1,3.5);
    b.box('play-tower-platform','#df8b55',10,1.6,6.7,3,.3,3);
    for(const x of [8.7,11.3])for(const z of [5.4,8])b.box('play-tower-leg','#7e9ca4',x,.85,z,.2,1.5,.2);
    b.roof('play-tower-roof','#cb665a',10,3.8,6.7,3.5,1.2,3.5);
    for(const x of [8.7,11.3])b.box('play-tower-upright','#cfb788',x,2.55,6.7,.14,2,.14);
    for(let i=0;i<4;i++)b.box('small-climbing-step','#69a1ae',10,.25+i*.36,10.1-i*.45,2,.3+i*.72,.5);
    for(const x of [-12,-8,-4,0,4,8,12])b.box('low-fence-post','#eee3c7',x,.9,11,.18,1.5,.18);
    b.box('low-fence-rail','#eee3c7',0,.7,11,25,.13,.14);
    b.box('low-fence-rail','#eee3c7',0,1.3,11,25,.13,.14);
    b.sign('RAINBOW KIDS','#447f85',0,4.55,3.2,6,.8);
  }},
  {id:'page-learning-center',name:'Page Learning Center',category:'education',build(b){
    b.box('learning-center-base','#b5b8b3',0,.3,-1,25,.6,18);
    b.box('rear-classroom-mass','#eee6d7',0,7,-4,22,13.4,11);
    b.box('library-wing','#54798a',-8,4,2,6,7.4,9);
    b.box('upper-cantilever','#d4aa64',2,11.7,1,20,3.4,9);
    b.box('cantilever-soffit','#795f48',2,9.9,1,20,.22,9);
    b.box('glazed-study-wall','#3e6477',2,5.3,1.65,15,8,.18);
    for(const x of [-4,0,4,8])b.box('study-wall-mullion','#dbe0d5',x,5.3,1.85,.12,8,.18);
    for(const y of [3.3,6.7])b.box('study-floor-band','#dbe0d5',2,y,1.85,15,.18,.2);
    for(let i=0;i<7;i++)b.box('upper-sun-fin','#f0d9a8',-6+i*2.6,11.7,5.65,.22,3.5,1.1);
    b.box('entry-door','#294957',9,1.8,2,2.2,3,.18);
    b.box('entry-landing','#a9aca6',9,.4,4,4,.8,3);
    for(let i=0;i<3;i++)b.box('broad-reading-stair','#c5beb0',1,.25+i*.5,8.6-i*1.2,12,.5+i,1.3);
    for(const x of [-3,2,7]){
      b.box('study-desk','#b98d56',x,4.1,1,2.4,.15,1);
      b.box('desk-leg','#6d7979',x,3.6,1,.18,1,.6);
    }
    b.box('book-display-backing','#5c776d',-8,3.4,6.6,5,5,.2);
    for(const y of [1.4,2.8,4.2,5.6])b.box('display-bookshelf','#d9c29b',-8,y,6.95,5,.16,.8);
    for(let i=0;i<12;i++)b.box('oversized-book-spine',['#c56b56','#d9b460','#538b94','#899d65'][i%4],-10+(i%4)*1.2,2+(Math.floor(i/4))*1.4,6.95,.75,1,.6);
    b.box('roof-terrace-rail','#5b737b',0,14.5,-3,21,.12,.12);
    for(const x of [-10,0,10])b.box('roof-rail-post','#5b737b',x,14,-3,.12,1,.12);
    b.sign('PAGE LEARNING','#345665',2,13.4,5.6,8,.8);
  }}
];
