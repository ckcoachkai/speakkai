export const buildings = [
 {id:'jade-pharmacy',name:'Jade Pharmacy 药房',category:'pharmacy',build(b){
  b.box('white-clinical-block','#e8e9df',0,4,0,22,8,16);
  b.box('green-upper-band','#39846f',0,7,8.2,22,1.4,.5);
  b.box('accessible-platform','#b7bbb6',0,.2,1,24,.4,19);
  b.box('entrance-canopy','#69b6a0',0,3.8,9,7,.4,4);
  for(const x of [-2,2])b.box('sliding-door','#355c67',x,1.8,8.2,3.7,3.2,.2);
  for(const x of [-8,8]){
   b.box('display-recess','#173d42',x,2.8,8.12,5,4.4,.2);
   for(let r=0;r<3;r++){
    b.box('medicine-shelf','#efeee4',x,1.2+r*1.3,8.4,4.8,.12,.5);
    for(let c=0;c<3;c++)b.box('boxed-medicine',c%2?'#71aa8d':'#e4e8dc',x-1.5+c*1.5,1.65+r*1.3,8.45,.75,.7,.35);
   }
  }
  b.box('medical-cross-vertical','#e8fff4',8,7,8.52,.5,1.1,.15);
  b.box('medical-cross-horizontal','#e8fff4',8,7,8.54,1.2,.4,.15);
  for(const x of [-7,0,7])b.box('upper-clerestory','#658d94',x,5.6,8.18,5,.75,.15);
  b.box('roof-plant','#7f9993',-5,8.6,-3,4,1.2,4);
  for(let i=0;i<4;i++)b.box('plant-louvre','#455c59',-5,8.2+i*.25,-.95,3.7,.1,.1);
  b.sign('JADE PHARMACY · 药房','#26745e',-2,7,8.56,13,1.1);
 }},
 {id:'lens-optical',name:'Lens Optical 明镜',category:'optical',build(b){
  b.box('dark-jewel-box','#233248',0,3,0,20,6,15);
  b.box('floating-silver-roof','#b6c5c9',0,6.25,0,23,.5,17);
  b.box('glazed-front','#71a5b4',0,2.5,7.6,18,4.4,.2);
  b.box('central-door','#224858',0,1.8,7.82,3,3.4,.15);
  for(const x of [-8,-3,3,8])b.box('slender-mullions','#d2c8a6',x,2.5,7.85,.12,4.6,.12);
  // Two segmented circular spectacle rims mounted above the facade.
  for(const cx of [-4.2,4.2])for(let j=0;j<12;j++){
   const a=j*Math.PI/6;
   b.box('circular-spectacle-rim','#d6b568',cx+2.6*Math.cos(a),8.7+2.6*Math.sin(a),7.6,1.42,.24,.32,a+Math.PI/2);
  }
  b.box('spectacle-bridge','#d6b568',0,8.8,7.6,3.2,.25,.32);
  for(const x of [-6,6]){
   b.box('window-display-pedestal','#ece8da',x,1.1,8.1,3,1.5,.7);
   for(let j=0;j<3;j++)b.box('display-frame','#c3ad71',x-1+j,2,8.5,.65,.2,.16);
  }
  b.box('inset-door-step','#929da3',0,.12,8.8,4,.24,2);
  b.box('rear-consultation-wing','#516476',8,4.4,-4,7,8.8,7);
  b.sign('LENS · 明镜','#24364c',0,5.4,7.92,12,.85);
 }},
 {id:'herbal-apothecary',name:'Hundred Herbs 百草堂',category:'apothecary',build(b){
  b.box('ochre-plaster','#c6b18c',0,3.2,-1,20,6.4,14);
  b.box('stone-plinth','#8b8b7c',0,.25,0,23,.5,18);
  b.roof('charcoal-tiled-roof','#414e4b',0,6.4,-1,23,3.5,17);
  for(const x of [-10,10])b.box('dark-timber-column','#633b2d',x,3.2,6.6,.55,6.4,.55);
  b.box('carved-lintel','#633b2d',0,5.9,6.7,21,.65,.7);
  b.box('open-door-shadow','#282f29',0,2.5,6.1,4,4.7,.2);
  for(const x of [-6.5,6.5]){
   b.box('medicine-cabinet','#714b32',x,2.6,6.3,5.4,4.7,.6);
   for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const xx=x-1.7+col*1.7,yy=.9+row*1.1;
    b.box('herbal-drawer','#a97e4e',xx,yy,6.67,1.5,.9,.18);
    b.box('brass-drawer-pull','#d6b771',xx,yy,6.8,.3,.1,.12);
   }
  }
  for(const x of [-8,8]){
   b.cylinder('herbal-urn','#73553c',x,.9,9, .85,1,1.3,12);
   b.cylinder('urn-lid','#9f8860',x,1.65,9,.95,.95,.18,12);
  }
  for(const x of [-9,-4.5,0,4.5,9])b.box('roof-ridge-cap','#66726a',x,9.95,-1,4.4,.25,.5);
  b.sign('百草堂 · HUNDRED HERBS','#57392b',0,5.9,7.1,10,.8);
 }}
];
