// Original medical architecture: emergency campus, courtyard clinic, maternity terraces.
export const buildings = [
  {
    id: 'medical-emergency-hospital', name: 'Central Emergency Hospital', category: 'hospital',
    build(b) {
      b.box('hospital-foundation', '#bdc7ce', 0,.25,0,29,.5,23);
      b.box('inpatient-tower', '#e2e9e8', 0,12,-3,18,24,15);
      b.box('west-diagnostic-wing', '#b2cace', -11,4,0,6,8,18);
      b.box('east-diagnostic-wing', '#b2cace', 11,4,0,6,8,18);
      b.box('glazed-lift-core', '#34616c', 0,13,4.65,4,21,.35);
      for (const x of [-6,6]) for(let y=5;y<=21;y+=4) {
        b.box('ward-window-band', '#46757e', x,y,4.6,5.3,2.1,.25);
        b.box('ward-sunshade', '#f4f3df', x,y+1.25,4.9,5.8,.22,.85);
      }
      for(const x of [-11,11]) for(const y of [2.2,5.6]) {
        b.box('diagnostic-window', '#426773', x,y,9.08,4.3,2,.18);
      }
      b.box('emergency-entrance', '#2e5660', 0,1.9,5.1,7,3.8,1.2);
      b.box('emergency-red-canopy', '#bd3e45', 0,4.6,8.1,15,.6,6.2);
      for(const x of [-6.4,6.4]) b.cylinder('ambulance-bay-column', '#e8eded', x,2.2,10,.22,.22,4.4);
      for(const x of [-3.3,3.3]) b.box('ambulance-bay-divider', '#fff5d5', x,.53,8.5,.16,.06,5);
      b.box('roof-plant-room', '#879ba2', -3,25.2,-3,6,2.4,5);
      for(const x of [2.5,5.5]) b.cylinder('rooftop-exhaust', '#70858d', x,25,-5,.8,.8,2);
      b.box('medical-cross-upright', '#d93e4c', 0,21,5,1.1,4,.3);
      b.box('medical-cross-arm', '#d93e4c', 0,21,5,3.6,1.1,.31);
      b.box('roof-parapet-front', '#94adb3', 0,24.4,4.5,18,.8,.35);
      b.box('roof-parapet-back', '#94adb3', 0,24.4,-10.5,18,.8,.35);
      b.sign('急诊 • EMERGENCY', '#9d2739', 0,4.65,11.25,12,.65);
    }
  },
  {
    id: 'medical-courtyard-clinic', name: 'Neighborhood Courtyard Clinic', category: 'clinic',
    build(b) {
      b.box('raised-stone-court', '#b6ada0', 0,.25,0,27,.5,21);
      b.box('clinic-rear-hall', '#ecdfc4', 0,3.2,-5,24,6.4,9);
      b.box('clinic-west-wing', '#e8dbc3', -9,2.5,3,6,5,10);
      b.box('clinic-east-wing', '#e8dbc3', 9,2.5,3,6,5,10);
      b.roof('dark-tile-main-gable', '#465b59', 0,7.15,-5,26,2.1,11);
      for(const x of [-9,9]) b.roof('wing-tiled-roof', '#465b59', x,5.7,3,7.6,1.8,11);
      b.box('main-ridge-cap', '#71857a', 0,8.3,-5,.3,.25,11);
      for(const x of [-8,-4,4,8]) {
        b.box('timber-window-surround', '#75503b', x,3.4,-.38,2.5,2.6,.3);
        b.box('consulting-window', '#60918f', x,3.4,-.15,2.1,2.2,.12);
        b.box('window-lattice-vertical', '#e2c49a', x,3.4,-.05,.12,2.2,.12);
      }
      b.box('central-clinic-door', '#3d7775', 0,1.9,-.25,3,3.4,.4);
      b.box('entrance-step', '#a59c8d', 0,.4,1.1,4.5,.3,2.5);
      b.box('veranda-canopy', '#566b61', 0,4.5,1.3,12,.3,3.3);
      for(const x of [-5,5]) b.cylinder('veranda-red-column', '#904b3e', x,2.3,2.6,.2,.23,4.4);
      for(const x of [-7,7]) {
        b.box('courtyard-bench-seat', '#856344', x,1,7,3.2,.25,.8);
        for(const dx of [-1.1,1.1]) b.box('courtyard-bench-leg', '#66574c', x+dx,.6,7,.25,.8,.7);
      }
      for(const x of [-3.8,3.8]) {
        b.box('medicinal-herb-planter', '#8e6650', x,.9,7.5,2.3,.9,2.3);
        b.box('medicinal-herb-bed', '#639667', x,1.5,7.5,2,.6,2);
      }
      b.box('pharmacy-counter', '#c2b59d', 9,1.25,8.2,4,2.2,.5);
      b.box('pharmacy-service-window', '#497b7a', 9,3,8.1,3.8,1.5,.2);
      b.sign('社区卫生 • CLINIC', '#245c55', 0,5.3,-.25,8,1);
      b.sign('中西药房', '#7f4335', 9,4.3,8.2,4,.75);
    }
  },
  {
    id: 'medical-maternity-terraces', name: 'Lotus Maternity Hospital', category: 'hospital',
    build(b) {
      b.box('maternity-podium', '#eaded9', 0,1.6,-.5,28,3.2,21);
      // A five-step convex silhouette approximates a sweeping curved facade.
      for(let i=0;i<5;i++) {
        const x=(i-2)*5.1, edge=Math.abs(i-2), height=19-edge*3, front=7-edge*1.4;
        b.box('rounded-facade-segment', ['#f0d8cd','#f1e5da','#f7eee4','#f1e5da','#f0d8cd'][i], x,3.2+height/2,front-8,5.2,height,15);
        b.box('terrace-coping', '#e6b7a5', x,3.4+height,front-8,5.35,.4,15.3);
        for(let y=6;y<height+2;y+=3.5) {
          b.box('ribbon-glazing', '#688e9c', x,y,front-.4,4.45,1.8,.25);
          b.box('balcony-lip', '#f6ede3', x,y-1,front,5.1,.22,1.1);
        }
        b.box('terrace-planter', '#ae9b89', x,4+height,front-7,3.5,.8,1.6);
        b.box('terrace-garden', '#6e9166', x,4.7+height,front-7,3.2,.7,1.3);
      }
      b.box('entry-glass-lobby', '#4d7e8e', 0,1.9,10.1,9,3.2,.3);
      b.box('floating-entrance-canopy', '#d8a68e', 0,3.6,10.3,13,.35,3);
      for(const x of [-5.5,5.5]) b.cylinder('slender-lobby-column', '#faf0dc', x,1.85,11,.13,.13,3.35);
      b.box('lobby-door-mullion', '#d5e4e4', 0,1.9,10.35,.12,3,.12);
      for(const x of [-10,10]) {
        b.cylinder('round-garden-pot', '#c78d78', x,.95,10,.85,.7,1.2);
        b.cylinder('clipped-garden-crown', '#79916e', x,2.1,10,1,1.2,1.2);
      }
      b.sign('母婴医院 • LOTUS', '#a66d63', 0,4.3,7.25,8,1.1);
    }
  }
];
