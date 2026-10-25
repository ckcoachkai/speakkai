import {getVehicleSpec} from './race3d-vehicle-specs.js?v=20261025-balance-drivers1';
/** Fictional mixed-class race tuning. Source reference specs remain unmodified. */
export const RACE_CALIBRATION=Object.freeze({
 'f1-2026':{topSpeedKph:162,powerKW:144,torqueNm:370,tireGrip:1.20,downforceCoefficient:1.7,brakeDecelMps2:13.5,launchAccelMps2:10.1},
 gt3:{topSpeedKph:159,powerKW:224,torqueNm:570,tireGrip:1.19,downforceCoefficient:1.25,brakeDecelMps2:14.5,launchAccelMps2:9.5},
 'car-concept':{topSpeedKph:164,powerKW:248,torqueNm:650,tireGrip:1.15,downforceCoefficient:.65,brakeDecelMps2:13,launchAccelMps2:9.9},
 'lamborghini-gallardo':{topSpeedKph:171,powerKW:287,torqueNm:680,tireGrip:1.14,downforceCoefficient:.45,brakeDecelMps2:12.5,launchAccelMps2:9.2},
 'tesla-roadster':{topSpeedKph:166,powerKW:390,torqueNm:980,tireGrip:1.12,downforceCoefficient:.5,brakeDecelMps2:12,launchAccelMps2:10.8},
});
const cache=new Map();
export function getRaceVehicleSpec(type){
 if(cache.has(type))return cache.get(type);
 const reference=getVehicleSpec(type);if(!reference)return null;
 const spec=Object.freeze({...reference,...RACE_CALIBRATION[type],raceCalibration:'mixed-class-v1'});cache.set(type,spec);return spec;
}
