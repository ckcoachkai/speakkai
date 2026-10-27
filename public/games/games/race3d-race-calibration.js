import {getVehicleSpec} from './race3d-vehicle-specs.js?v=20261027-midnight';
/** Fictional mixed-class race tuning. Source reference specs remain unmodified. */
export const RACE_CALIBRATION=Object.freeze({
 'f1-2026':{topSpeedKph:165,powerKW:148,torqueNm:370,tireGrip:1.20,downforceCoefficient:1.7,brakeDecelMps2:13.5,launchAccelMps2:10.1},
 gt3:{topSpeedKph:164,powerKW:237,torqueNm:570,tireGrip:1.19,downforceCoefficient:1.25,brakeDecelMps2:14.5,launchAccelMps2:9.5},
 'car-concept':{topSpeedKph:165,powerKW:255,torqueNm:650,tireGrip:1.15,downforceCoefficient:.65,brakeDecelMps2:13,launchAccelMps2:9.9},
 'lamborghini-gallardo':{topSpeedKph:166,powerKW:279,torqueNm:680,tireGrip:1.14,downforceCoefficient:.45,brakeDecelMps2:12.5,launchAccelMps2:9.2},
 'tesla-roadster':{topSpeedKph:165,powerKW:379,torqueNm:980,tireGrip:1.12,downforceCoefficient:.5,brakeDecelMps2:12,launchAccelMps2:10.8},
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** New fictional concepts enter the same race class. Their raw fantasy power
 * never bypasses competition tuning. Preserve their mass, aero and architecture
 * while bounding acceleration, grip, braking and speed to useful tradeoffs. */
function conceptCalibration(reference){
 const aero=clamp(reference.downforceCoefficient||.6,.35,1.6),grip=clamp(reference.tireGrip||1.2,1.1,1.5);
 return {topSpeedKph:clamp(164+(Number(reference.topSpeedKph||310)-310)*.045,162,167),
  powerKW:reference.massKg*(.181+.004*clamp((Number(reference.powerKW)||400)/reference.massKg,.2,.6)),
  torqueNm:reference.massKg*.46,tireGrip:1.12+(grip-1.1)*.2,
  downforceCoefficient:aero,brakeDecelMps2:clamp(reference.brakeDecelMps2||13,12,14.5),
  launchAccelMps2:clamp(9.5+(reference.torqueNm/reference.massKg-.5),9.2,10.4)};
}
const cache=new Map();
export function getRaceVehicleSpec(type){
 if(cache.has(type))return cache.get(type);
 const reference=getVehicleSpec(type);if(!reference)return null;
 const spec=Object.freeze({...reference,...(RACE_CALIBRATION[type]||conceptCalibration(reference)),raceCalibration:'mixed-class-v2'});cache.set(type,spec);return spec;
}
