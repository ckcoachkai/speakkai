// Rejection sampling gives every remaining player exactly the same chance.
export function drawWinner(eligible, nextUint = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  if (!eligible.length) return null;
  const limit = 4294967296 - (4294967296 % eligible.length);
  let value;
  do { value = nextUint(); } while (value >= limit);
  return eligible[value % eligible.length];
}

// Normalize for distance so starting columns cannot affect the draw.
export function raceBase(start, finish, winner, variation) {
  return (finish - start) / 2560 * (winner ? 1.25 : 0.82 + variation * 0.18);
}
