/** Three civic landmarks: lantern library, folded gallery, planetarium. */
export const buildings = [
  { id: 'civic-lantern-library', name: 'Lantern Civic Library', category: 'culture', build(b) {
    b.box('library-plinth','#acaba0',0,.35,0,27,.7,21);
    b.box('reading-hall','#ddcfb1',0,6,-1,24,11,16);
    b.roof('copper-reading-roof','#4d7a77',0,13,-1,26,4,18);
    b.box('clerestory-lantern','#6b9ca0',0,15,-1,7,3,12);
    b.roof('lantern-cap','#355c61',0,17,-1,8,2,13);
    for (const x of [-9,-6,-3,3,6,9]) {
      b.box('tall-reading-window','#365b65',x,6,7.08,1.9,6,.18);
      b.box('window-limestone-lintel','#f1e7cd',x,9.2,7.25,2.3,.35,.4);
      b.box('window-sill','#f1e7cd',x,2.85,7.25,2.3,.3,.45);
    }
    b.box('library-entrance','#35545c',0,2.7,7.2,3,4,.25);
    b.box('portico-canopy','#e6d8b9',0,5.4,8.7,7,.6,3.8);
    for(const x of [-2.8,2.8]) b.cylinder('portico-column','#ede0c1',x,2.8,9.7,.34,.4,5,10);
    for(let i=0;i<3;i++) b.box('entry-stair','#c8c1ae',0,.18+i*.17,10.8-i*.5,7,.36+i*.34,1.1);
    for(const x of [-9,9]) {
      b.box('book-return-cabinet','#506865',x,1.3,9.4,1.5,1.9,1.2);
      b.box('book-return-slot','#1e3338',x,1.75,10.03,1.1,.16,.08);
      b.box('reading-bench-seat','#715541',x,1,10.9,4,.25,1);
      for(const dx of [-1.5,1.5]) b.box('bench-foot','#474d4d',x+dx,.55,10.9,.2,.9,.7);
    }
    b.sign('LIBRARY · 图书馆','#405f5a',0,6.2,7.4,6,1);
  }},
  { id: 'folded-art-museum', name: 'Folded Court Art Museum', category: 'culture', build(b) {
    b.box('museum-platform','#b4b8b9',0,.3,0,28,.6,22);
    b.box('dark-recessed-base','#34444e',-2,3,0,20,5.4,17);
    b.box('cantilever-gallery','#f2eee4',1,8,-1,25,5,18);
    b.box('gallery-shadow-seam','#52606a',1,5.7,-1,25.2,.3,18.1);
    b.roof('folded-roof-west','#c5d0d2',-6,11.5,-1,11,3,19);
    b.roof('folded-roof-east','#e3e8e5',6,11.5,-1,11,5,19);
    b.box('entry-glass-wall','#417c8c',-1,2.9,8.6,15,4.4,.2);
    for(const x of [-7,-3,1,5]) b.box('lobby-mullion','#bac6c7',x,2.9,8.8,.12,4.6,.14);
    b.box('revolving-entry-frame','#a5b4b5',0,2.4,9.1,3.4,4,.4);
    b.box('entry-door','#263e48',0,2.4,9.35,2.9,3.6,.12);
    for(const x of [-9,-5,-1,3,7,11]) {
      b.box('gallery-slit','#335b69',x,8,8.1,.7,3.4,.2);
      b.box('gallery-sun-fin','#d2cbc0',x+.6,8,8.4,.18,4.3,.9);
    }
    b.box('sculpture-plinth','#d5d0c4',-10,1,9.5,3,1.4,3);
    b.box('sculpture-angled-plane','#c45b3d',-10,3.1,9.5,.6,4.5,1.1,-.4);
    b.box('sculpture-cross-plane','#ec9861',-10,3.3,9.5,3,.5,1.3,.6);
    for(const x of [8,11]) {
      b.box('sculpture-court-planter','#7b8179',x,.8,10.1,2,1,2);
      b.cylinder('topiary','#547661',x,1.8,10.1,.8,.7,1.5,8);
    }
    for(const x of [-8,0,8]) b.box('roof-skylight','#72a5ad',x,13,-3,2,.35,6);
    b.sign('ART · 美术馆','#485865',3,4.7,9,7,.8);
  }},
  { id: 'orbital-science-center', name: 'Orbital Discovery Center', category: 'culture', build(b) {
    b.box('science-center-plaza','#9aaab4',0,.25,0,28,.5,22);
    b.cylinder('planetarium-drum','#456584',-4,5,-2,8,8,9.5,20);
    b.cylinder('planetarium-tapered-roof','#91b8c4',-4,10.9,-2,5,8.4,2.8,20);
    b.cylinder('planetarium-crown','#b8d4da',-4,12.7,-2,1.8,5,1.2,20);
    b.cylinder('observatory-finial','#dce9e3',-4,13.7,-2,.55,1.8,.9,16);
    b.box('interactive-exhibit-wing','#e7e1ce',8,4,-2,9,7.5,17);
    b.box('wing-roof-float','#64869b',8,8,-2,10,.5,18);
    for(const z of [-7,-3,1,5]) {
      b.box('exhibit-east-window','#365a75',12.58,4,z,.18,4,2.4);
      b.box('exhibit-east-fin','#c6d8d8',12.9,4,z+.8,.8,6,.18);
    }
    b.box('glass-entry-connector','#598f9f',2,3.2,7,7,5.8,3);
    b.box('entry-shade','#e8d48b',2,6.3,8,9,.35,5);
    for(const x of [-1,2,5]) b.box('entry-mullion','#cadad5',x,3,8.6,.15,5.2,.2);
    for(let i=0;i<8;i++) {
      const a=(i+.5)*Math.PI/8;
      b.cylinder('drum-vertical-rib','#b6d1d5',-4+8.1*Math.cos(a),5,-2+8.1*Math.sin(a),.13,.13,9,6);
    }
    b.box('rocket-display-base','#667a88',-10,.65,9.6,3,.8,3);
    b.cylinder('exhibit-rocket-body','#e8e7d8',-10,3.3,9.6,.7,.7,4.5,12);
    b.cylinder('exhibit-rocket-nose','#d87843',-10,6,9.6,0,.7,.9,12);
    for(const dx of [-1,1]) b.box('rocket-stabilizer','#c8553c',-10+dx*.75,1.7,9.6,.2,1.8,1.5,dx*.22);
    b.cylinder('solar-system-pedestal','#d3c6a4',10,1.4,9.5,.3,.7,2.3,10);
    b.cylinder('solar-system-disc','#d4ab53',10,2.6,9.5,1.2,1.2,.2,16);
    b.cylinder('sun-model','#efc453',10,3.1,9.5,.5,.5,.8,12);
    b.sign('DISCOVER · 科学馆','#305677',2,7,10.58,8,1);
  }}
];
