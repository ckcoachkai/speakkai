import { RACER_FORM_TYPES, getRacerFormMeta } from './race3d-racer-forms.js?v=20261024-race3d-realism2';

const CARS = [
  ['f1-2026', 'Qvist 2026 Formula concept', 1.08, 1.12, 1.16, .83],
  ['gt3', 'Race Car 01 LMGT3', 1.01, 1.02, 1.10, 1.04],
  ['car-concept', 'CarConcept sports coupe', 1.03, 1.03, 1.02, 1],
  ['lamborghini-gallardo', 'Lamborghini Gallardo 2010', 1.04, 1.07, 1.05, .96],
  ['tesla-roadster', 'Tesla Roadster 2020 concept', 1.05, 1.16, 1.01, 1.03],
];
export const RACE_ROSTER_TYPES = Object.freeze([...CARS.map(car => car[0]), ...RACER_FORM_TYPES]);
export function getRacerIdentity(type) {
  const car = CARS.find(car => car[0] === type);
  if (car) return { racerType: type, vehicleName: car[1], category: 'car', speedFactor: car[2], accelerationFactor: car[3], gripFactor: car[4], durabilityFactor: car[5], ratingsKind: 'game-balanced' };
  const form = getRacerFormMeta(type);
  if (!form) return null;
  const traits = type === 'snail' ? [.42, .42, 1.12, 1.28] : type === 'monster-truck' ? [.93, .90, .91, 1.45] : form.category === 'spacecraft' ? [1.07, 1.08, .96, .96] : form.category === 'cheese' ? [.98, .98, 1.01, 1.08] : [1, 1.05, 1.06, .95];
  return { racerType: type, vehicleName: form.label, category: form.category, speedFactor: traits[0], accelerationFactor: traits[1], gripFactor: traits[2], durabilityFactor: traits[3], ratingsKind: 'game-balanced' };
}

/** Shuffle without replacing a type until the complete mixed grid is used. */
export function assignRacerTypes(players, random = Math.random) {
  let deck = [];
  const draw = () => {
    if (!deck.length) {
      deck = [...RACE_ROSTER_TYPES];
      for (let i = deck.length - 1; i > 0; i--) {
        const value = Number(random());
        const j = Math.floor(Math.max(0, Math.min(.999999999, Number.isFinite(value) ? value : .5)) * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck.pop();
  };
  return players.map(player => {
    const identity = getRacerIdentity(player.racerType) || getRacerIdentity(draw());
    return { ...player, ...identity };
  });
}
