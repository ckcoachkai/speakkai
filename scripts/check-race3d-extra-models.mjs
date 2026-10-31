import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {EXTRA_MODEL_IDS,extraItemRecipe,createExtraItemModels} from '../public/games/games/race3d-extra-models.js';
assert.equal(EXTRA_MODEL_IDS.length,40);
const signatures=new Set();
for(const id of EXTRA_MODEL_IDS){const recipe=extraItemRecipe(id);assert.ok(recipe.length>=3&&recipe.length<=18,id);signatures.add(JSON.stringify(recipe));for(const part of recipe){assert.ok(part.position.concat(part.scale,part.rotation).every(Number.isFinite),id);assert.ok(part.scale.every(n=>n>0),id);}}
assert.equal(signatures.size,40,'every miniature has its own silhouette recipe');
for(const low of [false,true]){
 const scene=new THREE.Scene(),models=createExtraItemModels(THREE,{parent:scene,capacity:60,low}),pose=new THREE.Object3D();
 models.beginFrame();for(const [i,id]of EXTRA_MODEL_IDS.entries()){pose.position.set(i*3,2,0);assert.equal(models.stamp(id,pose),true);}models.endFrame();
 const stats=models.snapshot();assert.equal(stats.items,40);assert.equal(stats.types,40);assert.ok(stats.drawCalls<=18);assert.ok(stats.parts<=720);
 for(const mesh of models.group.children){assert.ok(mesh.isInstancedMesh);assert.ok(mesh.material.isMeshStandardMaterial);assert.ok(mesh.count<=mesh.instanceMatrix.count);for(let i=0;i<mesh.count*16;i++)assert.ok(Number.isFinite(mesh.instanceMatrix.array[i]));const pos=mesh.geometry.attributes.position;assert.ok([...pos.array].every(Number.isFinite));assert.ok(mesh.geometry.attributes.normal);}
 const bounds=new THREE.Box3().setFromObject(models.group);assert.ok(bounds.max.z-bounds.min.z>.5,'props must have actual depth');
 models.reset();assert.equal(models.snapshot().items,0);assert.equal(models.snapshot().drawCalls,0);assert.ok(models.group.children.every(m=>m.count===0));
 for(let frame=0;frame<100;frame++){models.beginFrame();models.stamp('magnet',pose);models.endFrame();}assert.equal(models.snapshot().pools,stats.pools,'no per-frame mesh growth');models.dispose();models.dispose();assert.equal(scene.children.length,0);assert.equal(models.stamp('magnet',pose),false);console.log(JSON.stringify({low,...stats,uniqueRecipes:signatures.size,resetAndDispose:true}));
}
assert.equal(extraItemRecipe('unknown'),null);
