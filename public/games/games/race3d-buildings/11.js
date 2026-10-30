/** Original hotels: roadside facades face +Z; shared primitive kit only. */
export const buildings = [
  { id:'hotel-lantern-boutique', name:'Lantern House Boutique Hotel', category:'hotel', build(b) {
    b.box('raised-travertine-plinth','#b6a99a',0,.3,0,25,.6,19);
    b.box('boutique-main-mass','#e9d9c2',-3,7.5,-1,18,14,16);
    b.box('narrow-brick-stair-tower','#965b4c',9,10,-3,5,19.4,12);
    b.box('tower-crown','#c29b71',9,20,-3,5.6,.6,12.6);
    b.box('roof-terrace-cap','#6c4a3d',-3,14.8,-1,18.6,.6,16.6);
    b.box('glazed-lobby','#244b50',-3,2.2,7.1,17,3,.2);
    b.box('entry-recess','#2d3333',-3,2,7.5,3.4,3,.45);
    b.box('brass-door-divider','#c99c54',-3,2,7.78,.12,3,.1);
    b.box('entrance-canopy','#725344',-3,3.9,9,9,.4,4);
    for (const x of [-7,1]) b.cylinder('canopy-brass-column','#be9859',x,1.95,10,.12,.12,3.3);
    b.box('entry-step','#ddd0bb',-3,.5,10,8,.4,2.5);
    for(let floor=0;floor<3;floor++) for(let col=0;col<3;col++) {
      const x=-9+col*6,y=6+floor*3;
      b.box('guestroom-window','#345b60',x,y,7.1,3.4,2,.2);
      b.box('juliet-balcony-floor','#b7a084',x,y-1.1,7.7,4,.22,1.4);
      b.box('juliet-brass-rail','#997b46',x,y-.55,8.25,4,.12,.12);
    }
    for(let f=0;f<5;f++) b.box('stairwell-slit','#38606a',9,3+f*3.2,3.1,1.1,2.5,.2);
    for(const x of [-10,4]) {
      b.box('entry-planter','#a48464',x,.9,9.7,2.4,1.2,2);
      b.cylinder('clipped-shrub','#4a6849',x,1.8,9.7,.85,.9,1.1);
    }
    b.sign('LANTERN HOUSE · 灯舍','#5e443a',-3,4.6,9.1,8,1);
  }},
  { id:'hotel-cloud-courtyard', name:'Cloud Courtyard Inn', category:'hotel', build(b) {
    b.box('courtyard-stone-base','#a9a49b',0,.2,0,28,.4,23);
    b.box('back-guest-wing','#ddd0b7',0,3.5,-7,25,6.6,7);
    b.roof('back-wing-tiled-gable','#4b5250',0,7.7,-7,27,2.1,8);
    for(const x of [-10.5,10.5]) {
      b.box('side-guest-wing','#d1c3a7',x,2.7,1.2,6,5,12.5);
      b.roof('side-wing-tiled-gable','#505955',x,5.9,1.2,7,1.7,14);
      b.box('veranda-beam','#744e37',x<0?-6.9:6.9,4.7,1.2,.3,.35,13);
      for(const z of [-4,0,4,7]) b.cylinder('timber-veranda-column','#785039',x<0?-6.9:6.9,2.5,z,.16,.16,4.5);
      for(const z of [-2,3]) b.box('side-lattice-opening','#624b35',x,2.8,z,3.6,2.4,.25);
    }
    b.box('moon-gate-left-pier','#d8c9ad',-4.3,2.5,9.6,4.6,4.6,1.7);
    b.box('moon-gate-right-pier','#d8c9ad',4.3,2.5,9.6,4.6,4.6,1.7);
    b.box('gate-timber-lintel','#694831',0,4.5,9.6,13.4,.5,2.1);
    b.roof('gate-peaked-tile-roof','#4e5750',0,5.4,9.6,14.3,1.5,3);
    for(const x of [-5,5]) {
      b.cylinder('gate-red-lantern','#b13c27',x,3.5,10.8,.45,.45,.9);
      b.cylinder('lantern-gold-tassel','#bb9145',x,2.9,10.8,.06,.06,.4);
    }
    for(const x of [-8,-4,0,4,8]) {
      b.box('rear-room-door','#6d4b35',x,2,-3.4,2.3,3.2,.2);
      b.box('rear-room-transom','#3e5958',x,4.5,-3.4,2.3,1,.2);
    }
    b.box('courtyard-path','#c5bdab',0,.43,2.5,3,.1,13);
    b.cylinder('central-lotus-basin','#7b847c',3.5,.8,2,1.45,1.55,.7,16);
    b.cylinder('basin-water','#397879',3.5,1.16,2,1.32,1.32,.04,16);
    b.box('courtyard-bench','#6f5038',-3.5,1.05,2,2.8,.25,.8);
    for(const x of [-4.5,-2.5]) b.box('bench-leg','#6f5038',x,.7,2,.25,.7,.6);
    b.sign('云庭客栈 · CLOUD INN','#75513b',0,4.48,10.71,5,.7);
  }},
  { id:'hotel-skyline-business', name:'Skyline Business Hotel', category:'hotel', build(b) {
    b.box('business-hotel-podium','#b1b9bb',0,2.2,0,28,4.4,22);
    b.box('slender-glass-tower','#405f70',-3,16,-2,18,25,15);
    b.box('offset-service-spine','#d3d6d0',9.2,16,-4,4,27,13);
    b.box('tower-floating-crown','#e3e6df',-3,29,-2,19,.7,16);
    b.box('roof-plant-screen','#7b878e',-3,30,-3,10,1.5,7);
    for(let floor=0;floor<8;floor++) {
      const y=5.6+floor*3;
      b.box('horizontal-facade-spandrel','#b3c2c4',-3,y,5.62,18,.32,.22);
      b.box('side-facade-spandrel','#9aaeb6',-12.12,y,-2,.22,.32,15);
    }
    for(const x of [-10,-6,-2,2,6]) b.box('vertical-sun-fin','#c6d0cc',x,16,5.9,.18,25,.8);
    b.box('lobby-curtain-glass','#245466',0,2.2,11.12,26,3.6,.2);
    for(const x of [-11,-6,6,11]) b.box('lobby-mullion','#e5e6d9',x,2.2,11.3,.16,3.8,.25);
    b.box('door-portal','#273f4c',0,2,11.35,4,3.4,.35);
    b.cylinder('revolving-door-canopy','#a0bac4',0,3.65,10.2,1.7,1.7,.2,16);
    b.box('revolving-door-axis','#bbc8c8',0,1.85,10.6,.1,3.4,2.2);
    b.box('cantilever-arrival-canopy','#dce5dc',0,4.7,8.7,18,.55,6.3);
    b.box('canopy-bronze-edge','#a4804b',0,4.5,11.8,18,.18,.22);
    for(const x of [-11,11]) {
      b.box('lobby-planter','#6f7e80',x,.6,10,2,1.2,2);
      b.cylinder('topiary','#466951',x,1.7,10,.7,.8,1.1);
    }
    b.box('conference-annex','#c9c8b9',9,6.2,-2,8,3.6,15);
    for(const z of [-6,-2,2]) b.box('annex-rooflight','#5b8995',9,8.1,z,5,.2,2);
    b.sign('SKYLINE HOTEL','#304e60',0,3.85,11.64,10,.8);
  }}
];
