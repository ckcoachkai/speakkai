// Original electronics district architecture, shared instancing-kit primitives.
export const buildings = [
  { id:'circuit-electronics', name:'Circuit Electronics Hall', category:'electronics', build(b) {
    b.box('raised-plinth','#888e98',0,.4,0,28,.8,22);
    b.box('graphite-retail-hall','#34404f',0,6,-1,26,11,19);
    b.box('floating-silver-roof','#bdc9d5',0,12,-1,28,1,21);
    b.box('upper-media-facade','#132234',0,9,8.7,24,4,.5);
    for(let i=0;i<5;i++) {
      b.box('digital-display-bezel','#080e18',(i-2)*4.4,9,9.05,4,2.7,.2);
      b.box('colored-display-panel',['#3cb6d4','#b0d34d','#7d7fe0','#ec9b4e','#42c2ac'][i],(i-2)*4.4,9,9.18,3.6,2.3,.06);
      b.box('glass-ground-floor','#254f67',(i-2)*4.7,3.7,8.65,4.4,5.5,.18);
      b.box('window-divider','#aebbc8',(i-2)*4.7-2.25,3.7,8.85,.15,5.7,.25);
    }
    b.box('wide-door-frame','#d6e2e8',0,2.8,9,4.3,4.8,.3);
    b.box('sliding-entry-glass','#163e54',0,2.8,9.2,3.9,4.5,.12);
    b.box('entry-canopy','#2caec4',0,5.5,10,8,.4,3);
    for(const x of [-3.5,3.5]) b.box('canopy-support','#d6e2e8',x,2.85,10.5,.18,5.3,.18);
    for(const x of [-8,8]) {
      b.box('demo-desk','#e5e8ed',x,1.7,9.8,3.1,.25,1);
      b.box('desk-base','#66717e',x,1.1,9.8,1.8,1.1,.7);
      b.box('demo-monitor','#152533',x,2.3,9.65,1.6,.95,.13);
      b.box('monitor-screen','#70c7d6',x,2.3,9.73,1.4,.75,.03);
      b.box('roof-cooling-unit','#798994',x,13.1,-4,3,1.2,3);
    }
    b.box('loading-shutter','#566777',12.99,2.8,-4,.12,4,5);
    b.sign('CIRCUIT ELECTRONICS','#133449',0,6.5,9.1,17,.9);
  }},
  { id:'pocket-mobile', name:'Pocket Mobile Corner', category:'electronics', build(b) {
    b.box('shop-platform','#bbc2bd',0,.25,0,21,.5,18);
    b.box('service-block','#e7e9df',-4,4,-2,11,7.5,14);
    b.cylinder('rounded-corner-tower','#e5e7dd',5,5.5,0,5,5,11,16);
    b.cylinder('tower-glass-ribbon','#3d7b8c',5,5.4,0,5.05,5.05,5.3,16);
    b.cylinder('tower-roof-disc','#b0d64b',5,11.2,0,5.6,5.6,.55,16);
    b.box('display-window','#326573',-4,3.6,5.05,9,5,.15);
    b.box('lime-canopy','#b0d64b',-3,6.3,6.8,12,.5,3.5);
    for(const x of [-8.5,1.5]) b.box('entry-upright','#899591',x,3.1,6.8,.18,5.7,.18);
    b.box('door-frame','#798b89',-4,2.5,5.25,2.4,4.6,.2);
    b.box('door-glass','#183b4b',-4,2.5,5.4,2,4.3,.08);
    b.box('door-pull','#dbe1dc',-3.3,2.4,5.5,.08,.7,.08);
    for(let i=0;i<4;i++) {
      const x=-8+i*2.2;
      b.box('phone-display-plinth','#f5f3e7',x,1.3,7.1,1.4,1.6,1);
      b.box('phone-body','#16232c',x,2.35,7.1,.55,.8,.11);
      b.box('phone-screen','#5bc9c4',x,2.35,7.17,.44,.63,.02);
    }
    b.box('service-counter','#465756',-5,1.5,2,6,1.6,1.2);
    for(const x of [-7,-5,-3]) b.cylinder('consultation-stool','#a9ce43',x,.95,3.3,.4,.4,1.4,8);
    for(let i=0;i<4;i++) b.box('tower-vertical-fin','#ebeee4',2+i*2,5.4,4.15,.12,5.5,.6);
    b.box('rooftop-phone-sculpture','#1e3038',-4,9.8,0,3.2,4.6,.65);
    b.box('sculpture-screen','#6ac6b6',-4,9.8,.36,2.7,3.8,.08);
    b.sign('POCKET MOBILE','#497854',-3,6.4,8.58,9,.8);
  }},
  { id:'aperture-camera', name:'Aperture Camera House', category:'electronics', build(b) {
    b.box('stone-shop-base','#a6a2a0',0,.3,0,20,.6,18);
    b.box('brick-workshop','#865750',0,4.7,-1,18,8.2,15);
    b.roof('steep-dark-gable','#35424b',0,8.8,-1,20,4.6,17);
    b.box('black-gallery-front','#202c34',0,3.6,6.7,17,5.7,.5);
    for(const x of [-5.6,5.6]) {
      b.box('gallery-window-frame','#d1c8b1',x,3.6,7,5,4.6,.3);
      b.box('gallery-glass','#355163',x,3.6,7.2,4.6,4.2,.12);
      b.box('window-display-shelf','#b4936a',x,2,7.6,4.5,.18,.9);
      for(let i=0;i<3;i++) {
        b.box('camera-display-body','#252a30',x+(i-1)*1.25,2.5,7.65,.8,.6,.45);
        b.box('camera-display-lens','#596b73',x+(i-1)*1.25,2.5,7.98,.4,.4,.3);
      }
    }
    b.box('recessed-door','#384b54',0,2.8,7,2.6,4.9,.2);
    b.box('door-upper-glazing','#63808c',0,3.4,7.14,2.1,2.6,.08);
    b.box('door-handle','#e5c779',.9,2.6,7.25,.08,.65,.08);
    b.box('entry-awning','#d4b676',0,5.5,8,4.8,.3,3);
    // Stacked concentric rooftop lens sculpture: recognisable without lettering.
    b.cylinder('lens-outer-barrel','#1c252d',-5,12.2,-2,1.9,1.9,2.2,16);
    b.cylinder('lens-focus-ring','#7c8990',-5,13.35,-2,2,2,.3,16);
    b.cylinder('lens-front-glass','#35879a',-5,13.55,-2,1.6,1.6,.12,16);
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      b.box('focus-ring-knurl','#c3c8c6',-5+1.9*Math.cos(a),12.6,-2+1.9*Math.sin(a),.15,.6,.15);
    }
    b.box('repair-bench','#8c735a',5,1.5,9,4,.25,1.2);
    for(const x of [3.5,6.5]) b.box('bench-leg','#48545a',x,.85,9,.2,1.3,.8);
    b.box('repair-tool-tray','#232c32',5,1.7,9,1.4,.18,.65);
    b.box('roof-chimney','#704a44',6,11,-4,1.5,3,1.5);
    b.sign('APERTURE • CAMERA REPAIR','#293843',0,7.5,7.1,15,1);
  }}
];
