import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createPowerupAccents} from '../public/games/games/race3d-powerup-accents.js';
const position=new THREE.Vector3(0,2,4),cases=[['item-pickup','boost'],['repair','repair'],['freeze-hit','freeze'],['shield-block','shield'],['shockwave-hit','shockwave'],['boost','boost']];
for(const low of [false,true])for(const reducedMotion of [false,true]){
 const fx=createPowerupAccents(THREE,{low,reducedMotion});
 for(const [type,kind]of cases){fx.reset();fx.emit(type,position,kind);fx.update(.05);assert.ok(fx.snapshot().pools.arcs.active>0);if(reducedMotion||type==='item-pickup')assert.equal(fx.snapshot().pools.crystals.active+fx.snapshot().pools['repair-crosses'].active,0);else assert.ok(fx.snapshot().pools[kind==='repair'?'repair-crosses':'crystals'].active>0);}
 for(let i=0;i<500;i++)for(const [type,kind]of cases)fx.emit(type,position,kind);
 fx.update(.05);for(const p of Object.values(fx.snapshot().pools))assert.ok(p.active<=p.capacity);
 for(const mesh of fx.group.children){assert.ok(mesh.geometry.attributes.normal);for(let i=0;i<mesh.count;i++){const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));}assert.ok(mesh.geometry.attributes.position.count<1000);}
 const states=JSON.stringify(fx.snapshot());fx.emit('freeze-hit',{x:NaN,y:0,z:0},'freeze');assert.equal(JSON.stringify(fx.snapshot()),states);
 for(let i=0;i<120;i++)fx.update(1/60);assert.ok(Object.values(fx.snapshot().pools).every(p=>p.active===0));fx.reset();assert.ok(fx.group.children.every(m=>m.count===0));fx.dispose();fx.dispose();fx.emit('repair',position,'repair');assert.equal(fx.group.children.length,0);assert.equal(fx.snapshot().disposed,true);
}
console.log(JSON.stringify({dimensionalArcsCrystalsCrosses:true,qualityBudgets:true,reducedMotion:true,finiteTransforms:true,boundedStress3000Events:true,expiryResetDispose:true}));
// Validate shader insertion against the bundled Three revision (not a GPU compile).
const {readFile}=await import('node:fs/promises');
const source=await readFile(new URL('../public/games/games/race3d-powerups.js',import.meta.url),'utf8');
const shieldBody=source.match(/shieldBubble\.material\.onBeforeCompile=shader=>\{([\s\S]+?)\n  \};/)[1];
for(const reducedMotion of [true,false]){
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
 new Function('shader','exhaustTime','reducedMotion',shieldBody)(shader,{value:0},reducedMotion);
 assert.ok(shader.vertexShader.includes('vShieldLocal=position;'));
 assert.ok(shader.fragmentShader.includes('float rim='));assert.ok(shader.fragmentShader.includes('vViewPosition'));
 assert.ok(shader.uniforms.shieldClock);assert.ok(!reducedMotion||shader.fragmentShader.includes('vShieldLocal.y*12.0-0.0'));
}
console.log(JSON.stringify({bundledThreeShaderHooks:true,gpuCompilation:'requires browser'}));
