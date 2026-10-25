import { RACE_VEHICLE_PROFILES, getVehicleProfile } from './race3d-vehicle-specs.js?v=20261025-supercars';

export const RACE_ROSTER_TYPES = Object.freeze(Object.keys(RACE_VEHICLE_PROFILES));
export function getRacerIdentity(type) {
  const profile = getVehicleProfile(type);
  return profile ? { ...profile, racerType: type, category: 'car', ratingsKind: 'reference-informed-simulation' } : null;
}

/**
 * Assign a fresh car every round from shuffled five-car decks. Every complete
 * deck contains each type once; a partial deck differs by at most one car.
 * Prior racerType, student name, ID and old physics data never pick a car. This
 * also removes stale animals/cheese/trucks/spacecraft from saved player data.
 */
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
    const identity = getRacerIdentity(draw());
    return { ...player, ...identity };
  });
}
