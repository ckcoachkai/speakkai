export const FAMILIAR_MODELS = Object.freeze([
  {
    "id": "familiar-sedan",
    "label": "Family sedan",
    "length": 4.6,
    "wheelbase": 2.6975799481417453,
    "front": 1.3487899740708726,
    "rear": 1.3487899740708726,
    "track": 1.717545375972342
  },
  {
    "id": "familiar-suv",
    "label": "SUV",
    "length": 4.7,
    "wheelbase": 2.7577443927211176,
    "front": 1.3788721963605588,
    "rear": 1.3788721963605588,
    "track": 1.8330596699111301
  },
  {
    "id": "familiar-hatchback",
    "label": "Sports hatchback",
    "length": 4.1,
    "wheelbase": 2.3967858869018843,
    "front": 1.1983929434509422,
    "rear": 1.1983929434509422,
    "track": 1.6931077815369742
  },
  {
    "id": "familiar-pickup",
    "label": "Pickup truck",
    "length": 5.1,
    "wheelbase": 2.9984173505275495,
    "front": 1.4992086752637748,
    "rear": 1.4992086752637748,
    "track": 1.8654161781946073
  },
  {
    "id": "familiar-taxi",
    "label": "Taxi",
    "length": 4.6,
    "wheelbase": 2.6975799481417453,
    "front": 1.3487899740708726,
    "rear": 1.3487899740708726,
    "track": 1.717545375972342
  },
  {
    "id": "familiar-police",
    "label": "Police car",
    "length": 4.6,
    "wheelbase": 2.6975799481417453,
    "front": 1.3487899740708726,
    "rear": 1.3487899740708726,
    "track": 1.717545375972342
  },
  {
    "id": "familiar-van",
    "label": "Family van",
    "length": 4.9,
    "wheelbase": 2.8780780170662332,
    "front": 1.4390390085331166,
    "rear": 1.4390390085331166,
    "track": 1.854075579032913
  }
]);
const wheelNodes=Object.freeze({FL:'WheelFrontL',FR:'WheelFrontR',RL:'WheelRearL',RR:'WheelRearR'});
export const FAMILIAR_ASSETS=Object.freeze(FAMILIAR_MODELS.map(m=>({id:m.id,label:m.label,length:m.length,url:new URL('../assets/race3d-familiar/'+m.id.replace('familiar-','')+'.glb',import.meta.url).href,yaw:0,wheelNodes,wheelPattern:/^Wheel(Front|Rear)[LR]$/})));
// Generic operating masses include driver/fluids; simulation choices, not manufacturer data.
// Keep power-to-mass and torque-to-mass constant so mass variety does not buy pace.
const FAMILIAR_MASS_KG=Object.freeze({'familiar-sedan':1450,'familiar-suv':1850,'familiar-hatchback':1250,'familiar-pickup':2000,'familiar-taxi':1500,'familiar-police':1650,'familiar-van':1900});
export const FAMILIAR_PROFILES=Object.freeze(Object.fromEntries(FAMILIAR_MODELS.map(m=>[m.id,{vehicleName:m.label,speedFactor:1,accelerationFactor:1,gripFactor:1,durabilityFactor:1,vehicleGeometry:{wheelbase:m.wheelbase,front:m.front,rear:m.rear,track:m.track},vehicleSpec:{massKg:FAMILIAR_MASS_KG[m.id],powerKW:280*FAMILIAR_MASS_KG[m.id]/1450,torqueNm:680*FAMILIAR_MASS_KG[m.id]/1450,dragCoefficient:.34,frontalAreaM2:2.1,downforceCoefficient:.6,brakeDecelMps2:13,tireGrip:1.2,topSpeedKph:320,engineType:'i4',wheelbaseM:m.wheelbase,rampPreference:.6,priority:'balanced'},specBasis:{kind:'original-generic-simulation',referenceFields:[],simulationFields:['massKg','powerKW','torqueNm','dragCoefficient','frontalAreaM2','downforceCoefficient','brakeDecelMps2','tireGrip','topSpeedKph','engineType','wheelbaseM','rampPreference','priority'],notes:'Original stylized generic vehicle type, not a manufacturer model. All performance values are game calibration; geometry is measured from the authored mesh.'},sources:[]}])));


