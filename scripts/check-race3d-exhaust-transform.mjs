import assert from 'node:assert/strict';
import * as THREE from '../public/games/assets/vendor/three.module.js';
import {createCarMotion} from '../public/games/games/race3d-car-motion.js';

const car = new THREE.Group(), body = new THREE.Object3D();
body.position.set(.4,.8,-2.2); car.add(body);
const motion = createCarMotion(THREE,{car,racer:{id:1}});
const chassis = car.getObjectByName('chassis-motion');
const detail = new THREE.Group(); car.remove(chassis); detail.add(chassis); car.add(detail);
car.position.set(12,3,-7); car.rotation.set(.22,.8,-.14,'YXZ');
detail.position.set(.02,0,0); chassis.position.y=.55; chassis.rotation.set(-.08,0,.06,'YXZ');
car.updateMatrixWorld(true);
const expected=body.getWorldPosition(new THREE.Vector3());
const actual=new THREE.Vector3(.4,.8,-2.2).applyMatrix4(motion.bodyMatrix(new THREE.Matrix4()));
assert.ok(expected.distanceTo(actual)<1e-9,`body difference ${expected.distanceTo(actual)}`);
const proxy=new THREE.Vector3(.4,.8,-2.2).applyMatrix4(motion.bodyMatrix(new THREE.Matrix4(),false));
assert.ok(proxy.distanceTo(new THREE.Vector3(.4,.8,-2.2).applyMatrix4(car.matrix))<1e-9);
console.log('PASS: sprung body and rigid proxy attachment transforms match rendered hierarchy');
