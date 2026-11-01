/**
 * Outlet positions use the car frame: +Z forward, +Y up. Combustion concept
 * and Gallardo outlets are measured from named asset meshes after the same
 * normalization as race3d-car-assets.js. F1, GT3 and CarConcept lack named
 * outlet meshes, so their rear-fascia placements are approximate.
 *
 * Electric cars and organic/cheese racer forms receive fictional arcade
 * retrofit boost vents at the rear, not claimed factory exhaust pipes. Craft
 * use their modeled thrusters. Animated forms and temporary procedural asset
 * fallbacks can move slightly relative to these static mount positions.
 */
const backward = Object.freeze([0, 0, -1]);
const mount = (x, y, z) => Object.freeze({ position: Object.freeze([x, y, z]), direction: backward });
const pair = (x, y, z) => Object.freeze([mount(-x, y, z), mount(x, y, z)]);
const procedural = pair(.48, .375, -2.429);
const wedge = pair(.48, .65, -1.51);
const mounts = Object.freeze({
  'lamborghini-gallardo': pair(.625, .3395, -2.148),
  'tesla-roadster': pair(.43, .30, -2.355),
  'f1-2026': Object.freeze([mount(0, .582, -2.30)]),
  'gt3': pair(.474, .310, -2.355),
  'car-concept': pair(.543, .303, -2.305),
  'concept-asterion': pair(.298, .3874, -2.438),
  'concept-helix': pair(.298, .3871, -2.228),
  'concept-ion': pair(.298, .3875, -2.534),
  'concept-vesper': pair(.390, .4005, -2.659),
  'concept-tempest': pair(.390, .4005, -2.499),
  'concept-atlas': pair(.390, .4005, -2.629),
  'concept-kestrel': pair(.130, .450, -2.285),
  'concept-apex': pair(.130, .450, -2.4075),
  'concept-vector': pair(.130, .450, -2.385),
  'concept-aurora': pair(.25, .34, -2.536),
  'concept-flux': pair(.25, .34, -2.256),
  'concept-solstice': pair(.20, .34, -2.676),
  'concept-obsidian': pair(.320, .390, -2.538),
  'concept-cinder': pair(.320, .500, -2.388),
  'concept-meridian': pair(.320, .400, -2.458),
  'cheese-swiss': wedge, 'cheese-cheddar': wedge, 'cheese-blue': wedge,
  'cheese-parmesan': wedge, 'cheese-leicester': wedge,
  'cheese-brie': pair(.4, .55, -1.35),
  'cheese-gouda': pair(.4, .70, -1.31),
  'cheese-mozzarella': pair(.4, .75, -1.17),
  'cheese-feta': pair(.4, .70, -1.10),
  'cheese-provolone': pair(.35, .65, -1.03),
  'bear': pair(.42, 1.1, -1.94), 'eagle': pair(.30, 1.05, -1.74),
  'fox': pair(.25, .90, -2.71), 'rabbit': pair(.3, .70, -1.63),
  'snail': pair(.35, .40, -1.61),
  'monster-truck': pair(.55, 1.55, -2.00),
  'x-wing': Object.freeze([mount(-1.37,.675,-1.67),mount(-1.37,1.203,-1.67),mount(1.37,.675,-1.67),mount(1.37,1.203,-1.67)]),
  'tie-fighter': pair(.32,1.648,-.85),
  'falcon': Object.freeze(Array.from({length:7},(_,i)=>mount((i-3)*.34,.74,-2.32+Math.abs(i-3)*.055))),
});
const aliases = Object.freeze({swiss:'cheese-swiss',cheddar:'cheese-cheddar',brie:'cheese-brie',camembert:'cheese-brie',blue:'cheese-blue',gouda:'cheese-gouda',parmesan:'cheese-parmesan',mozzarella:'cheese-mozzarella',feta:'cheese-feta',provolone:'cheese-provolone','red-leicester':'cheese-leicester',leicester:'cheese-leicester',xwing:'x-wing',tie:'tie-fighter','millennium-falcon':'falcon',monstertruck:'monster-truck'});

/** Return immutable car-local outlet positions and unit directions. */
export function getExhaustMounts(car) {
  const type = typeof car === 'string' ? car : car?.racerType;
  return mounts[aliases[type] || type] || procedural;
}
