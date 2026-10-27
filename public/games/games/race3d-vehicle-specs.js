import { CONCEPT_VEHICLE_PROFILES } from './race3d-concept-profiles.js?v=20261027-midnight';
/**
 * SI vehicle inputs for the race simulation, not homologation data for the models.
 * Aerodynamic coefficients use frontalAreaM2 as their reference area; positive
 * downforceCoefficient means a downward load. torqueNm is crank/motor-equivalent
 * torque BEFORE gearing (never Tesla's advertised wheel torque).
 * All operating masses include a simulated driver/fluids allowance.
 */
const CHECKED = '2026-10-25';
const source = (url, title, notes) => ({ url, title, notes, checkedOn: CHECKED });
const F1_RULES = source(
  'https://www.fia.com/sites/default/files/fia_2026_formula_1_technical_regulations_issue_8_-_2024-06-24.pdf',
  'FIA 2026 Formula 1 Technical Regulations, issue 8, 24 June 2024',
  'Historical class reference, not the latest rules or a Qvist specification. Article 5.3: 1.6-litre, six-cylinder 90-degree V engine. Hybrid ERS in article 5.19.'
);
const F1_CLASS = source(
  'https://www.fia.com/news/new-era-competition-fia-showcases-future-focused-formula-1-regulations-2026-and-beyond',
  'FIA: A New Era of Competition, 6 June 2024',
  'Historical design announcement: 3400 mm maximum wheelbase, 400 kW combustion and 350 kW electric power. Does not establish the fictional Qvist car performance.'
);
const GT_RULES = source(
  'https://www.fia.com/system/files/documents/2026_lmgt3_technical_regulations_2025.10.16_published_2025.10.17_clean_version.pdf',
  'FIA/ACO 2026 LMGT3 Technical Regulations, published 17 October 2025',
  'LMGT3 class reference only: homologated GT3 cars and balance of performance; the class has no single universal engine architecture.'
);
const GT_BOP = source(
  'https://api.fia.com/sites/default/files/wec_2025_d30_lmgt3_bop_amended_06062025.pdf',
  'FIA/ACO Le Mans LMGT3 Balance of Performance, 6 June 2025',
  'Historical event table shows several masses around 1315-1360 kg before success ballast. Generic 1320 kg operating mass is a simulation choice, not any one car homologation.'
);
const GT_V8 = source(
  'https://www.ford.com/performance/mustang-gt3/',
  'Ford Mustang GT3 manufacturer overview',
  'A real GT3 V8 reference: 5.4-litre naturally aspirated Coyote-based V8. The generic Race Car 01 asset is not identified as a Ford; its V8 is an explicitly modeled choice.'
);
const GALLARDO = source(
  'https://teamspeed.com/forums/attachment.php?attachmentid=9128&d=1213280742',
  'Automobili Lamborghini Product Marketing: Gallardo LP 560-4 MY09, February 2008 (manufacturer document mirrored by TeamSpeed)',
  'Primary manufacturer-authored document, pp. 10-11 and 17: 5.2-litre V10, 412 kW, 540 Nm, 325 km/h, 2560 mm wheelbase, 1410 kg DRY. LP 560-4 is the chosen representative of the 2010 model, not a claim that all 2010 Gallardo variants are identical.'
);
const GALLARDO_HISTORY = source(
  'https://www.lamborghini.com/en-en/history/gallardo',
  'Automobili Lamborghini: Gallardo model history',
  'Manufacturer corroboration of longitudinal V10 architecture and the LP 560-4 generation introduced in 2008.'
);
const TESLA_CURRENT = source(
  'https://www.tesla.com/roadster',
  'Tesla Roadster manufacturer page',
  'Page inspected, but current text concerns a newer Rocket/Thrust option and cannot verify the historical 2020 concept. No current figures are transplanted into the old model.'
);
const TESLA_EXHIBIT = source(
  'https://petersen.org/pages/petersen-vehicle/2017-tesla-roadster-2',
  'Petersen Automotive Museum: 2017 Tesla Roadster 2.0 Deck Model, courtesy of Tesla Motors',
  'Firsthand exhibit record of the historical concept: three electric motors, AWD, estimated 250 mph and estimated 1.9 s 0-60 mph. Horsepower is explicitly N/A. The game ID/name retains its originally advertised 2020 concept designation, not a production-model claim.'
);

const AERO_FIELDS = ['dragCoefficient', 'frontalAreaM2', 'downforceCoefficient', 'brakeDecelMps2', 'tireGrip', 'rampPreference', 'priority'];
const PHYSICAL_FIELDS = ['massKg', 'powerKW', 'torqueNm', ...AERO_FIELDS, 'topSpeedKph', 'engineType', 'wheelbaseM'];
const basis = (kind, referenceFields, notes) => ({
  kind,
  referenceFields,
  simulationFields: PHYSICAL_FIELDS.filter(field => !referenceFields.includes(field)),
  notes,
});
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/**
 * rampPreference is the AI willingness in [0,1] to take a stunt ramp; priority is
 * a driving-style label. Both are game decisions, never manufacturer claims.
 * Legacy multipliers are retained for UI/backward compatibility. Physics should
 * use vehicleSpec so displayed names and student IDs cannot change performance.
 */
export const RACE_VEHICLE_PROFILES = deepFreeze({
  ...CONCEPT_VEHICLE_PROFILES,
  'f1-2026': {
    vehicleName: 'Qvist 2026 Formula concept',
    speedFactor: 1.08, accelerationFactor: 1.12, gripFactor: 1.16, durabilityFactor: .78,
    vehicleSpec: {
      massKg: 800, powerKW: 720, torqueNm: 650,
      dragCoefficient: .85, frontalAreaM2: 1.45, downforceCoefficient: 3.5,
      brakeDecelMps2: 19, tireGrip: 1.6, topSpeedKph: 350,
      engineType: 'v6-hybrid', wheelbaseM: 3.4, rampPreference: .28, priority: 'corners',
    },
    specBasis: basis('class-inspired-simulation', [],
      'Fictional Qvist concept: all numeric values are simulation calibrations. V6 hybrid architecture follows the cited historical Formula class reference. Lightest car, strongest aero cornering/braking, fragile in collisions.'),
    sources: [F1_RULES, F1_CLASS],
  },
  gt3: {
    vehicleName: 'Race Car 01 LMGT3',
    speedFactor: 1.01, accelerationFactor: 1.02, gripFactor: 1.10, durabilityFactor: 1.30,
    vehicleSpec: {
      massKg: 1320, powerKW: 390, torqueNm: 650,
      dragCoefficient: .48, frontalAreaM2: 2, downforceCoefficient: 1.25,
      brakeDecelMps2: 14, tireGrip: 1.4, topSpeedKph: 290,
      engineType: 'v8', wheelbaseM: 2.75, rampPreference: .48, priority: 'grip',
    },
    specBasis: basis('class-inspired-simulation', [],
      'Generic LMGT3 race car, not a homologated manufacturer model. All values, including the V8 engine choice, are simulation calibrations informed by class and real V8 GT3 references. Endurance grip and durability; lower straight-line speed.'),
    sources: [GT_RULES, GT_BOP, GT_V8],
  },
  'car-concept': {
    vehicleName: 'CarConcept sports coupe',
    speedFactor: 1.13, accelerationFactor: 1.09, gripFactor: 1.02, durabilityFactor: .95,
    vehicleSpec: {
      massKg: 1420, powerKW: 700, torqueNm: 850,
      dragCoefficient: .30, frontalAreaM2: 1.95, downforceCoefficient: .5,
      brakeDecelMps2: 12.8, tireGrip: 1.22, topSpeedKph: 380,
      engineType: 'v8', wheelbaseM: 2.8, rampPreference: .58, priority: 'speed',
    },
    specBasis: basis('fictional-simulation', [],
      'Unspecified fictional hypercar concept. Every engine, mass and aero value is authored for the simulation, not inferred as fact from appearance. Low-drag high-speed profile with weaker cornering than the two race cars.'),
    sources: [],
  },
  'lamborghini-gallardo': {
    vehicleName: 'Lamborghini Gallardo 2010',
    speedFactor: 1.04, accelerationFactor: 1.07, gripFactor: 1.05, durabilityFactor: 1.02,
    vehicleSpec: {
      massKg: 1510, powerKW: 412, torqueNm: 540,
      dragCoefficient: .36, frontalAreaM2: 1.9, downforceCoefficient: .16,
      brakeDecelMps2: 11.5, tireGrip: 1.13, topSpeedKph: 325,
      engineType: 'v10', wheelbaseM: 2.56, rampPreference: .62, priority: 'balanced',
    },
    specBasis: basis('manufacturer-reference-with-simulation', ['powerKW', 'torqueNm', 'topSpeedKph', 'engineType', 'wheelbaseM'],
      '2010 Gallardo represented by LP 560-4 specifications. The 1510 kg operating mass is calibrated from the cited 1410 kg dry reference plus 100 kg simulated driver/fluids allowance; it is not a manufacturer curb-weight figure. All aero, braking, tire and stunt values are simulated.'),
    sources: [GALLARDO, GALLARDO_HISTORY],
  },
  'tesla-roadster': {
    vehicleName: 'Tesla Roadster 2020 concept',
    speedFactor: 1.14, accelerationFactor: 1.22, gripFactor: 1.01, durabilityFactor: 1.10,
    vehicleSpec: {
      massKg: 2050, powerKW: 900, torqueNm: 1200,
      dragCoefficient: .27, frontalAreaM2: 2.05, downforceCoefficient: .2,
      brakeDecelMps2: 11, tireGrip: 1.2, topSpeedKph: 402,
      engineType: 'electric', wheelbaseM: 2.8, rampPreference: .40, priority: 'launch',
    },
    specBasis: basis('historical-concept-with-simulation', ['engineType'],
      'Historical 2017 unveiling/2020-target concept, not a production road test. Only electric architecture is treated as established here. 2050 kg, 900 kW and 1200 Nm are simulation choices, not Tesla specifications; torque is motor-equivalent before gearing. The 402 km/h simulation ceiling is inspired by the old 250 mph estimate, not a verified top speed. Heavy mass, strong EV launch, limited aero braking.'),
    sources: [TESLA_EXHIBIT, TESLA_CURRENT],
  },
});

export function getVehicleProfile(type) {
  return Object.hasOwn(RACE_VEHICLE_PROFILES, type) ? RACE_VEHICLE_PROFILES[type] : null;
}

export function getVehicleSpec(type) {
  return getVehicleProfile(type)?.vehicleSpec || null;
}
